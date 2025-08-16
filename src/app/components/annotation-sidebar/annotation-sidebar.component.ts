import { 
  Component, 
  OnInit, 
  OnDestroy, 
  ChangeDetectionStrategy, 
  ChangeDetectorRef,
  Output,
  EventEmitter
} from '@angular/core';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { AnnotationService } from '@services/annotation.service';
import { ViewportService } from '@services/viewport.service';
import { Annotation, AnnotationStats } from '@models/annotation.model';

@Component({
  selector: 'app-annotation-sidebar',
  templateUrl: './annotation-sidebar.component.html',
  styleUrls: ['./annotation-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnnotationSidebarComponent implements OnInit, OnDestroy {
  @Output() navigateToSlice = new EventEmitter<number>();
  @Output() annotationSelected = new EventEmitter<Annotation>();

  annotations: Annotation[] = [];
  selectedAnnotation: Annotation | null = null;
  currentSlice = 0;
  totalSlices = 0;
  stats: AnnotationStats = {
    totalCount: 0,
    slicesWithAnnotations: 0,
    averageAnnotationsPerSlice: 0
  };
  
  isEditingLabel = false;
  editingAnnotationId: string | null = null;
  editLabelValue = '';
  
  private destroy$ = new Subject<void>();

  constructor(
    private annotationService: AnnotationService,
    private viewportService: ViewportService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSubscriptions(): void {
    // Listen to annotations changes
    this.annotationService.annotations$
      .pipe(takeUntil(this.destroy$))
      .subscribe(annotations => {
        this.annotations = annotations;
        this.cdr.markForCheck();
      });

    // Listen to selected annotation changes
    this.annotationService.selectedAnnotation$
      .pipe(takeUntil(this.destroy$))
      .subscribe(selected => {
        console.log('Selected annotation changed:', selected);
        this.selectedAnnotation = selected;
        this.cdr.markForCheck();
      });

    // Listen to viewport state for current slice info
    this.viewportService.viewportState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.currentSlice = state.currentSliceIndex;
        this.totalSlices = state.totalSlices;
        this.cdr.markForCheck();
      });

    // Listen to annotation stats
    this.annotationService.getAnnotationStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.stats = stats;
        this.cdr.markForCheck();
      });
  }

  onAnnotationClick(annotation: Annotation): void {
    console.log('Annotation clicked:', annotation);
    if (annotation.sliceIndex !== this.currentSlice) {
      // Navigate to the slice containing this annotation
      console.log('Navigating to slice:', annotation.sliceIndex);
      this.navigateToSlice.emit(annotation.sliceIndex);
    }
    
    // Select the annotation
    console.log('Selecting annotation:', annotation.id);
    this.annotationService.selectAnnotation(annotation.id);
    this.annotationSelected.emit(annotation);
  }

  onDeleteAnnotation(annotation: Annotation, event: Event): void {
    event.stopPropagation();
    this.annotationService.deleteAnnotation(annotation.id);
  }

  onEditLabel(annotation: Annotation, event: Event): void {
    event.stopPropagation();
    this.startEditingLabel(annotation);
  }

  startEditingLabel(annotation: Annotation): void {
    this.isEditingLabel = true;
    this.editingAnnotationId = annotation.id;
    this.editLabelValue = annotation.label || '';
    this.cdr.markForCheck();
    
    // Focus the input after change detection
    setTimeout(() => {
      const input = document.getElementById('label-input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    });
  }

  saveLabel(): void {
    if (this.editingAnnotationId && this.editLabelValue.trim()) {
      // Preserve current position and dimensions when updating label
      const currentAnnotation = this.annotationService.getAnnotationById(this.editingAnnotationId);
      if (currentAnnotation) {
        this.annotationService.updateAnnotation({
          id: this.editingAnnotationId,
          x: currentAnnotation.x,
          y: currentAnnotation.y,
          width: currentAnnotation.width,
          height: currentAnnotation.height,
          label: this.editLabelValue.trim()
        });
      }
    }
    this.cancelEditLabel();
  }

  cancelEditLabel(): void {
    this.isEditingLabel = false;
    this.editingAnnotationId = null;
    this.editLabelValue = '';
    this.cdr.markForCheck();
  }

  onLabelKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.saveLabel();
    } else if (event.key === 'Escape') {
      this.cancelEditLabel();
    }
  }

  getAnnotationsBySlice(): Map<number, Annotation[]> {
    const grouped = new Map<number, Annotation[]>();
    
    this.annotations.forEach(annotation => {
      const sliceIndex = annotation.sliceIndex;
      if (!grouped.has(sliceIndex)) {
        grouped.set(sliceIndex, []);
      }
      grouped.get(sliceIndex)!.push(annotation);
    });
    
    // Sort annotations within each slice by creation time
    grouped.forEach(annotations => {
      annotations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    });
    
    return grouped;
  }

  getSortedSliceIndices(): number[] {
    const sliceIndices = Array.from(this.getAnnotationsBySlice().keys());
    return sliceIndices.sort((a, b) => a - b);
  }

  formatCoordinates(annotation: Annotation): string {
    return `(${Math.round(annotation.x)}, ${Math.round(annotation.y)})`;
  }

  formatDimensions(annotation: Annotation): string {
    return `${Math.round(annotation.width)} × ${Math.round(annotation.height)}`;
  }

  formatTimestamp(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // Clear all annotations method removed as per user request

  clearCurrentSliceAnnotations(): void {
    const currentSliceAnnotations = this.annotations.filter(a => a.sliceIndex === this.currentSlice);
    if (currentSliceAnnotations.length === 0) return;
    
    if (confirm(`Are you sure you want to delete all ${currentSliceAnnotations.length} annotation(s) from slice ${this.currentSlice + 1}?`)) {
      this.annotationService.clearAnnotationsForSlice(this.currentSlice);
    }
  }

  exportAnnotations(): void {
    try {
      const jsonData = this.annotationService.exportAnnotations();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `dicom_annotations_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting annotations:', error);
      alert('Failed to export annotations. Please try again.');
    }
  }

  importAnnotations(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string;
        const success = this.annotationService.importAnnotations(jsonData);
        
        if (success) {
          alert('Annotations imported successfully!');
        } else {
          alert('Failed to import annotations. Please check the file format.');
        }
      } catch (error) {
        console.error('Error importing annotations:', error);
        alert('Failed to import annotations. Invalid file format.');
      }
    };
    
    reader.readAsText(file);
    
    // Reset the input
    input.value = '';
  }

  onAnnotationHover(annotation: Annotation, isHovered: boolean): void {
    this.annotationService.setAnnotationHover(annotation.id, isHovered);
  }

  isCurrentSliceAnnotation(annotation: Annotation): boolean {
    return annotation.sliceIndex === this.currentSlice;
  }

  getSliceTitle(sliceIndex: number): string {
    const sliceNumber = sliceIndex + 1;
    const isCurrentSlice = sliceIndex === this.currentSlice;
    return isCurrentSlice ? `Slice ${sliceNumber} (Current)` : `Slice ${sliceNumber}`;
  }

  // Track by functions for performance optimization
  trackBySliceIndex(index: number, sliceIndex: number): number {
    return sliceIndex;
  }

  trackByAnnotationId(index: number, annotation: Annotation): string {
    return annotation.id;
  }
}