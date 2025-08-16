import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
declare const Konva: any;

import { AnnotationService } from '@services/annotation.service';
import { ViewportService } from '@services/viewport.service';
import { Annotation, AnnotationCreate } from '@models/annotation.model';

@Component({
  selector: 'app-annotation-overlay',
  templateUrl: './annotation-overlay.component.html',
  styleUrls: ['./annotation-overlay.component.scss'],
})
export class AnnotationOverlayComponent
  implements AfterViewInit, OnDestroy, OnChanges
{
  @Input() width = 512;
  @Input() height = 512;
  @Input() activeTool: string | null = null;
  @Input() canvasScale = 1;
  @Input() canvasOffset = { x: 0, y: 0 };
  
  @Output() annotationCreated = new EventEmitter<Annotation>();
  @Output() annotationUpdated = new EventEmitter<Annotation>();
  @Output() annotationSelected = new EventEmitter<Annotation | null>();

  @ViewChild('konvaContainer', { static: false })
  konvaContainer!: ElementRef<HTMLDivElement>;

  private stage: any;
  private layer: any;
  private transformer: any;
  private annotations = new Map<string, any>();
  private isDrawing = false;
  private currentRect: any = null;
  private currentGroup: any = null;
  private startPos = { x: 0, y: 0 };
  private selectedAnnotation: Annotation | null = null;
  private destroy$ = new Subject<void>();
  private currentSliceIndex = 0;
  private allAnnotations: Annotation[] = [];
  private refreshTimeout: any = null;
  private handleKeyDown!: (e: KeyboardEvent) => void;

  constructor(
    private annotationService: AnnotationService,
    private viewportService: ViewportService
  ) {}

  ngAfterViewInit(): void {
    this.initializeKonva();
    this.setupSubscriptions();
    this.loadExistingAnnotations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stage?.destroy();
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['width'] || changes['height']) {
      this.updateStageSize();
    }
    if (changes['activeTool']) {
      this.updateCursor();
    }
  }

  private initializeKonva(): void {
    this.stage = new Konva.Stage({
      container: this.konvaContainer.nativeElement,
      width: this.width,
      height: this.height,
    });
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);

    this.transformer = new Konva.Transformer({
      rotateEnabled: false,
      keepRatio: false,
      enabledAnchors: [
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
      ],
      anchorSize: 12,
      anchorStroke: '#3b82f6',
      anchorFill: '#ffffff',
      borderStroke: '#3b82f6',
      borderStrokeWidth: 2,
      anchorCornerRadius: 6,
      anchorShape: 'circle',
      boundBoxFunc: (oldBox: any, newBox: any) => {
        if (newBox.width < 10 || newBox.height < 10) {
          return oldBox;
        }
        return newBox;
      },
    });

    this.layer.add(this.transformer);
    this.transformer.hide();
    console.log('🎯 Transformer initialized and added to layer');

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const isTransformerHandleDown = (e: any) =>
      e.target?.getParent?.()?.className === 'Transformer';

    this.stage.on('mousedown touchstart', (e: any) => {
      if (isTransformerHandleDown(e)) return;
      if (this.activeTool === 'RectangleRoi') {
        this.startDrawing(e);
      } else {
        this.handleSelection(e);
      }
    });

    this.stage.on('mousemove touchmove', (e: any) => {
      if (this.activeTool === 'RectangleRoi' && this.isDrawing) {
        this.updateDrawing(e);
      }
    });

    this.stage.on('mouseup touchend', (e: any) => {
      if (this.activeTool === 'RectangleRoi' && this.isDrawing) {
        this.finishDrawing(e);
      }
    });

    this.stage.on('click tap', (e: any) => {
      if (isTransformerHandleDown(e)) return;
      if (this.activeTool !== 'RectangleRoi') {
        this.handleSelection(e);
      }
    });

    this.handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        this.deleteSelectedAnnotation();
      }
    };
    document.addEventListener('keydown', this.handleKeyDown);

    this.transformer.on('transform', () => {
      console.log('🔄 Transform event triggered');
      this.onTransform();
    });
    this.transformer.on('transformend', () => {
      console.log('🔄 TransformEnd event triggered');
      this.onTransformEnd();
    });
  }

  private startDrawing(e: any): void {
    const pos = this.stage.getPointerPosition();
    if (!pos) return;

    this.isDrawing = true;
    this.startPos = { x: pos.x, y: pos.y };

    this.currentRect = new Konva.Rect({
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      stroke: '#3b82f6',
      strokeWidth: 2,
      fill: 'rgba(59, 130, 246, 0.1)',
      dash: [5, 5],
      cornerRadius: 2,
    });

    this.currentGroup = new Konva.Group({
      x: 0,
      y: 0,
      draggable: false,
      name: 'annotation-group',
    });

    this.currentGroup.add(this.currentRect);
    this.layer.add(this.currentGroup);
    this.layer.batchDraw();
  }

  private updateDrawing(e: any): void {
    if (!this.isDrawing || !this.currentRect) return;
    const pos = this.stage.getPointerPosition();
    if (!pos) return;

    const w = pos.x - this.startPos.x;
    const h = pos.y - this.startPos.y;

    this.currentRect.width(Math.abs(w));
    this.currentRect.height(Math.abs(h));
    this.currentRect.x(w < 0 ? pos.x : this.startPos.x);
    this.currentRect.y(h < 0 ? pos.y : this.startPos.y);

    this.layer.batchDraw();
  }

  private finishDrawing(e: any): void {
    if (!this.currentRect || !this.currentGroup) return;
    this.isDrawing = false;

    const rw = this.currentRect.width();
    const rh = this.currentRect.height();
    if (rw < 5 || rh < 5) {
      this.currentGroup.destroy();
      this.layer.batchDraw();
      this.currentRect = null;
      this.currentGroup = null;
      return;
    }

    // Normalize group position + zero rect.x/y
    const gx = Math.round(this.currentRect.x());
    const gy = Math.round(this.currentRect.y());
    this.currentGroup.position({ x: gx, y: gy });
    this.currentRect.x(0);
    this.currentRect.y(0);

    // Re-style
    this.currentRect.dash([]);
    this.currentRect.stroke('#10b981');
    this.currentRect.fill('rgba(16, 185, 129, 0.1)');

    // Create annotation data
    const sliceIndex = this.viewportService.getCurrentSliceIndex();
    const labelNumber = this.getNextAnnotationNumber(sliceIndex);
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(-4)}`;

    const annotationData: AnnotationCreate = {
      sliceIndex,
      x: gx,
      y: gy,
      width: Math.round(rw),
      height: Math.round(rh),
      label: `${sliceIndex + 1}-${Date.now().toString().slice(-4)}`,
      description: `Bounding box annotation on slice ${sliceIndex + 1}`,
    };

    const annotation = this.annotationService.createAnnotation(annotationData);
    
    // Create text group with the actual annotation label
    const textGroup = this.createAnnotationText(
      0,
      0,
      rw,
      rh,
      annotation.label || `Annotation ${sliceIndex + 1}-${annotation.id.slice(-4)}`,
      false,
      annotation.id
    );
    this.currentGroup.add(textGroup);

    this.currentGroup.draggable(true);
    this.makeAnnotationSelectable(this.currentGroup, textGroup);

    this.currentGroup.setAttr('annotationId', annotation.id);

    this.annotations.set(annotation.id, this.currentGroup);
    this.annotationCreated.emit(annotation);
    this.layer.batchDraw();

    this.currentRect = null;
    this.currentGroup = null;
  }

  private makeAnnotationSelectable(group: any, textGroup: any): void {
    const rect = group.findOne('Rect');
    if (!rect) return;

    group.on('mouseenter', () => {
      if (group.getAttr('selected')) return;
      rect.strokeWidth(3);
      rect.stroke('#fbbf24');
      document.body.style.cursor = 'pointer';
      this.layer.batchDraw();
    });
    group.on('mouseleave', () => {
      if (group.getAttr('selected')) return;
      rect.strokeWidth(2);
      rect.stroke('#10b981');
      document.body.style.cursor = 'default';
      this.layer.batchDraw();
    });

    group.on('click tap', (e: any) => {
      e.cancelBubble = true;
      this.selectAnnotation(group);
    });

    group.on('dragstart', () => {
      group.moveToTop();
    });

    group.on('dragmove', () => {
      this.updateTextPosition(group, rect);
    });

    group.on('dragend', () => {
      const annId = group.getAttr('annotationId');
      const r: any = group.findOne('Rect');
      if (annId && r) {
        const newX = Math.round(group.x());
        const newY = Math.round(group.y());
        this.annotationService.updateAnnotation({
          id: annId,
          x: newX,
          y: newY,
          width: Math.round(r.width()),
          height: Math.round(r.height()),
        });
        this.updateTextPosition(group, r);
      }
    });
  }

  private handleSelection(e: any): void {
    // Check if clicked on empty area
    const target = e.target;
    if (target === this.stage) {
      this.deselectAll();
    } else if (target && target.getParent && target.getParent().className === 'Group') {
      // Clicked on an annotation group
      const group = target.getParent();
      if (group.getAttr('annotationId')) {
        this.selectAnnotation(group);
      }
    } else if (target && target.className === 'Group' && target.getAttr('annotationId')) {
      // Direct click on annotation group
      this.selectAnnotation(target);
    }
  }

  private selectAnnotation(group: any): void {
    this.deselectAll();

    group.setAttr('selected', true);
    group.getChildren()?.forEach((child: any) => {
      if (child.getClassName() === 'Rect') {
        child.stroke('#3b82f6');
        child.strokeWidth(3);
        child.shadowColor('#3b82f6');
        child.shadowBlur(15);
        child.shadowOpacity(0.8);
        child.shadowOffset({ x: 0, y: 2 });
        child.fill('rgba(59, 130, 246, 0.05)');
      }
    });

    console.log('🎯 Attaching transformer to group:', group);
    this.transformer.nodes([group]);
    this.transformer.show();
    this.transformer.getLayer().batchDraw();
    console.log('✅ Transformer attached and shown');

    const annId = group.getAttr('annotationId');
    if (annId) {
      const annotation = this.annotationService.getAnnotationById(annId);
      if (annotation) {
        this.selectedAnnotation = annotation;
        this.annotationService.selectAnnotation(annId);
        this.annotationSelected.emit(annotation);
      }
    }

    this.layer.batchDraw();
  }

  private deselectAll(): void {
    this.annotations.forEach((group: any) => {
      group.setAttr('selected', false);
      const r = group.findOne('Rect');
      if (r) {
        r.stroke('#10b981');
        r.strokeWidth(2);
        r.shadowBlur(0);
        r.shadowOpacity(0);
        r.fill('rgba(16, 185, 129, 0.1)');
      }
    });
    this.selectedAnnotation = null;
    this.transformer.nodes([]);
    this.transformer.hide();
    this.annotationService.selectAnnotation(null);
    this.annotationSelected.emit(null);
    this.layer.batchDraw();
  }

  private deleteSelectedAnnotation(): void {
    if (!this.selectedAnnotation) return;
    const group = this.annotations.get(this.selectedAnnotation.id);
    if (group) {
      this.transformer.nodes([]);
      group.destroy();
      this.annotations.delete(this.selectedAnnotation.id);
      this.layer.draw();
    }
    this.annotationService.deleteAnnotation(this.selectedAnnotation.id);
    this.selectedAnnotation = null;
    this.annotationSelected.emit(null);
  }

  private onTransform(): void {
    console.log('🔄 onTransform() called');
    const group: any = this.transformer.nodes()[0];
    if (!group) {
      console.log('⚠️ No group found in transformer nodes');
      return;
    }
    const rect = group.findOne('Rect');
    if (rect) {
      // Update text position in real-time during transform
      this.updateTextPosition(group, rect);
      
      // Calculate current dimensions for real-time feedback
      const scaleX = group.scaleX();
      const scaleY = group.scaleY();
      const currentWidth = Math.round(rect.width() * scaleX);
      const currentHeight = Math.round(rect.height() * scaleY);
      const currentX = Math.round(group.x());
      const currentY = Math.round(group.y());
      
      console.log('🔄 Transform in progress - Dimensions:', currentX, currentY, currentWidth, currentHeight);
      
      // Update text content in real-time as well
      const annId = group.getAttr('annotationId');
      console.log('🔍 Checking annId:', annId);
      if (annId) {
        console.log('✅ annId found, updating annotation text');
        this.updateAnnotationText(group, annId);
        
        // Get the annotation to preserve the existing label
        const currentAnnotation = this.annotationService.getAnnotationById(annId);
        console.log('🔍 Current annotation:', currentAnnotation);
        if (currentAnnotation) {
          console.log('✅ Current annotation found, creating real-time update');
          // Update annotation service in real-time during transform
          const realTimeUpdate = {
            id: annId,
            x: currentX,
            y: currentY,
            width: currentWidth,
            height: currentHeight,
            label: currentAnnotation.label, // Preserve existing label
          };
          
          console.log('🔄 Real-time annotation update:', realTimeUpdate);
          this.annotationService.updateAnnotation(realTimeUpdate);
          
          // Emit the updated annotation to sidebar in real-time
          const updatedAnnotation = this.annotationService.getAnnotationById(annId);
          if (updatedAnnotation) {
            this.annotationUpdated.emit(updatedAnnotation);
          }
        } else {
          console.log('❌ Current annotation not found for ID:', annId);
        }
      } else {
        console.log('❌ No annId found on group');
      }
    }
  }

  private onTransformEnd(): void {
    const group: any = this.transformer.nodes()[0];
    if (!group) return;

    const rect = group.findOne('Rect');
    const annId = group.getAttr('annotationId');
    if (!rect || !annId) {
      this.transformer.hide();
      this.layer.batchDraw();
      return;
    }

    // Use the official Konva resizing pattern
    const scaleX = group.scaleX();
    const scaleY = group.scaleY();

    const baseW = rect.width();
    const baseH = rect.height();
    const newW = Math.max(10, Math.round(baseW * scaleX));
    const newH = Math.max(10, Math.round(baseH * scaleY));

    const newX = Math.round(group.x());
    const newY = Math.round(group.y());

    // Set rect dimensions and reset scale
    rect.width(newW);
    rect.height(newH);
    group.scaleX(1);
    group.scaleY(1);

    // Get the annotation to preserve the existing label
    const currentAnnotation = this.annotationService.getAnnotationById(annId);
    if (currentAnnotation) {
      // Update the annotation in the service with preserved label
      const updatedAnnotation = {
        id: annId,
        x: newX,
        y: newY,
        width: newW,
        height: newH,
        label: currentAnnotation.label, // Preserve existing label
      };

      console.log('🔄 Transform End - Updating annotation:', updatedAnnotation);
      const updateSuccess = this.annotationService.updateAnnotation(updatedAnnotation);
      console.log('✅ Annotation update success:', updateSuccess);

      // Update text position and ensure text shows correct annotation label
      this.updateTextPosition(group, rect);
      this.updateAnnotationText(group, annId);

      // Force sidebar update by emitting the updated annotation
      const annotation = this.annotationService.getAnnotationById(annId);
      if (annotation) {
        console.log('📤 Emitting updated annotation to sidebar:', annotation);
        this.annotationUpdated.emit(annotation);
      }
    }

    this.transformer.hide();
    this.layer.batchDraw();
  }

  private createAnnotationText(
    rx: number,
    ry: number,
    rW: number,
    rH: number,
    label: string,
    isSelected: boolean,
    annotationId?: string
  ): any {
    console.log('📝 Creating annotation text with label:', label, 'for annotationId:', annotationId);

    const shadow = new Konva.Text({
      x: rW / 2 - 24,
      y: -24,
      text: label,
      fontSize: 16,
      fontFamily: 'Inter',
      fontStyle: 'bold',
      fill: '#000',
      align: 'center',
      verticalAlign: 'middle',
      width: 100,
      height: 16,
      listening: false,
    });

    const text = new Konva.Text({
      x: rW / 2 - 25,
      y: -25,
      text: label,
      fontSize: 16,
      fontFamily: 'Inter',
      fontStyle: 'bold',
      fill: '#fff',
      align: 'center',
      verticalAlign: 'middle',
      width: 100,
      height: 16,
      listening: false,
      name: 'info-text',
    });

    const grp = new Konva.Group();
    grp.add(shadow);
    grp.add(text);
    return grp;
  }

  private renderExistingAnnotation(annotation: Annotation): void {
    const rect = new Konva.Rect({
      x: 0,
      y: 0,
      width: annotation.width,
      height: annotation.height,
      stroke: annotation.isSelected ? '#3b82f6' : '#10b981',
      strokeWidth: annotation.isSelected ? 3 : 2,
      fill: annotation.isSelected ? 'rgba(59,130,246,0.05)' : 'rgba(16,185,129,0.1)',
      cornerRadius: 2,
    });

    const group = new Konva.Group({
      x: annotation.x,
      y: annotation.y,
      draggable: true,
      name: 'annotation-group',
    });

    // Use the actual annotation label
    const textGroup = this.createAnnotationText(
      0,
      0,
      annotation.width,
      annotation.height,
      annotation.label || `Annotation ${annotation.sliceIndex + 1}-${annotation.id.slice(-4)}`,
      annotation.isSelected,
      annotation.id
    );
    
    group.add(rect);
    group.add(textGroup);
    
    // Set the annotation ID on the group
    group.setAttr('annotationId', annotation.id);
    
    this.makeAnnotationSelectable(group, textGroup);
    
    if (annotation.isSelected) {
      group.setAttr('selected', true);
      this.transformer.nodes([group]);
      this.transformer.show();
    }

    this.annotations.set(annotation.id, group);
    this.layer.add(group);
    this.layer.batchDraw();
  }

  private loadSliceSpecificAnnotations(): void {
    this.annotations.forEach(grp => grp.destroy());
    this.annotations.clear();

    const sliceAnn = this.allAnnotations.filter(
      a => a.sliceIndex === this.currentSliceIndex
    );

    sliceAnn.forEach(a => this.renderExistingAnnotation(a));
  }

  private shouldRefreshCurrentSlice(): boolean {
    return this.currentSliceIndex === this.viewportService.getCurrentSliceIndex();
  }

  private loadExistingAnnotations(): void {
    this.currentSliceIndex = this.viewportService.getCurrentSliceIndex();
    this.loadSliceSpecificAnnotations();
  }

  private setupSubscriptions(): void {
    this.annotationService.selectedAnnotation$
      .pipe(takeUntil(this.destroy$))
      .subscribe(a => {
        if (a?.id !== this.selectedAnnotation?.id) {
          a ? this.selectAnnotationById(a.id) : this.deselectAll();
        }
      });

    this.annotationService.annotationEvents$
      .pipe(takeUntil(this.destroy$))
      .subscribe(ev => {
        if (ev.action === 'delete') {
          const g = this.annotations.get(ev.annotation.id);
          if (g) {
            g.destroy();
            this.annotations.delete(ev.annotation.id);
            this.layer.draw();
          }
        }
      });

    this.viewportService.viewportState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => {
        const newSlice = v.currentSliceIndex;
        if (newSlice !== this.currentSliceIndex) {
          this.currentSliceIndex = newSlice;
          this.loadSliceSpecificAnnotations();
        }
      });

    this.annotationService.annotations$
      .pipe(takeUntil(this.destroy$))
      .subscribe(all => {
        this.allAnnotations = all;
        if (this.shouldRefreshCurrentSlice()) {
          if (this.refreshTimeout) clearTimeout(this.refreshTimeout);
          this.refreshTimeout = setTimeout(
            () => this.loadSliceSpecificAnnotations(),
            50
          );
        }
      });
  }

  private selectAnnotationById(id: string): void {
    const g = this.annotations.get(id);
    if (g) {
      this.selectAnnotation(g);
    }
  }

  private clearAllAnnotations(): void {
    this.annotations.forEach(grp => grp.destroy());
    this.annotations.clear();
    this.layer.draw();
  }

  public clearAll(): void {
    this.clearAllAnnotations();
    this.annotationService.clearAllAnnotations();
  }

  public getAnnotationCount(): number {
    return this.annotations.size;
  }

  private getNextAnnotationNumber(sliceIndex: number): number {
    return (
      this.allAnnotations.filter(a => a.sliceIndex === sliceIndex).length + 1
    );
  }

  private getAnnotationNumber(annotation: Annotation): number {
    return (
      this.allAnnotations
        .filter(a => a.sliceIndex === annotation.sliceIndex)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .findIndex(a => a.id === annotation.id) + 1
    );
  }

  private updateTextPosition(group: any, rect: any): void {
    const textGroup = group.findOne((n: any) => n.className === 'Group');
    if (!textGroup) return;

    const newX = rect.x() + rect.width() / 2 - 24;
    const newY = rect.y() - 24;
    const children = textGroup.getChildren();
    
    if (children.length >= 2) {
      const shadow = children[0];
      const main = children[1];
      
      if (shadow && main) {
        shadow.setAttrs({ x: newX + 1, y: newY + 1 });
        main.setAttrs({ x: newX, y: newY });
      }
    }
  }

  private updateAnnotationText(group: any, annotationId: string): void {
    const textGroup = group.findOne((n: any) => n.className === 'Group');
    if (!textGroup) {
      console.warn('⚠️ Could not find text group for annotation:', annotationId);
      return;
    }

    // Get the annotation to get its label
    const annotation = this.annotationService.getAnnotationById(annotationId);
    if (!annotation) {
      console.warn('⚠️ Could not find annotation in service for ID:', annotationId);
      return;
    }

    const label = annotation.label || `Annotation ${annotation.sliceIndex + 1}-${annotationId.slice(-4)}`;

    console.log('📝 Updating annotation text to:', label, 'for annotation:', annotationId);

    const children = textGroup.getChildren();
    if (children.length >= 2) {
      const shadow = children[0];
      const main = children[1];
      
      if (shadow && main) {
        shadow.setAttrs({ text: label });
        main.setAttrs({ text: label });
        console.log('✅ Successfully updated text labels for annotation:', annotationId, 'Label:', label);
        
        // Force the layer to redraw to show the updated text
        this.layer.batchDraw();
      } else {
        console.warn('⚠️ Could not find shadow and main text elements for annotation:', annotationId);
      }
    } else {
      console.warn('⚠️ Text group has insufficient children for annotation:', annotationId, 'Children count:', children.length);
    }
  }

  private updateStageSize(): void {
    if (this.stage) {
      this.stage.width(this.width);
      this.stage.height(this.height);
      this.layer.draw();
    }
  }

  private updateCursor(): void {
    const cont = this.stage?.container();
    if (!cont) return;
    cont.style.cursor = this.activeTool === 'RectangleRoi' ? 'crosshair' : 'default';
  }
}
