import { Component, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AnnotationService } from '@services/annotation.service';
import { ViewportService } from '@services/viewport.service';

export interface AnnotationTool {
  name: string;
  label: string;
  icon: string;
  description: string;
  category: 'annotation' | 'measurement' | 'navigation';
  shortcut?: string;
}

export interface WindowingPreset {
  name: string;
  label: string;
  window: number;
  level: number;
  icon: string;
}

@Component({
  selector: 'app-annotation-toolbar',
  templateUrl: './annotation-toolbar.component.html',
  styleUrls: ['./annotation-toolbar.component.scss']
})
export class AnnotationToolbarComponent implements OnInit, OnDestroy {
  @Output() toolSelected = new EventEmitter<string>();
  @Output() clearAnnotations = new EventEmitter<void>();
  @Output() deactivateTools = new EventEmitter<void>();


  selectedTool: string | null = null;
  currentSlice = 0;
  totalAnnotations = 0;
  currentSliceAnnotations = 0;
  activeCategory: 'annotation' | 'measurement' | 'navigation' = 'annotation';
  selectedAnnotation: any = null;

  // Tool categories with proper typing
  toolCategories: ('annotation' | 'measurement' | 'navigation')[] = ['annotation', 'measurement', 'navigation'];

  private destroy$ = new Subject<void>();

  annotationTools: AnnotationTool[] = [
    // Annotation Tools
    {
      name: 'RectangleRoi',
      label: 'Rectangle',
      icon: '▭',
      description: 'Draw rectangular region of interest',
      category: 'annotation',
      shortcut: 'R'
    },
    {
      name: 'EllipticalRoi',
      label: 'Ellipse',
      icon: '○',
      description: 'Draw elliptical region of interest',
      category: 'annotation',
      shortcut: 'E'
    },
    {
      name: 'CircleRoi',
      label: 'Circle',
      icon: '●',
      description: 'Draw circular region of interest',
      category: 'annotation',
      shortcut: 'C'
    },
    // Measurement Tools
    {
      name: 'Length',
      label: 'Distance',
      icon: '📏',
      description: 'Measure distance between two points',
      category: 'measurement',
      shortcut: 'L'
    },
    {
      name: 'Angle',
      label: 'Angle',
      icon: '∠',
      description: 'Measure angle between three points',
      category: 'measurement',
      shortcut: 'A'
    },
    {
      name: 'Cobb',
      label: 'Cobb Angle',
      icon: '⟌',
      description: 'Measure Cobb angle for spinal assessment',
      category: 'measurement',
      shortcut: 'B'
    },
    // Navigation Tools
    {
      name: 'Pan',
      label: 'Pan',
      icon: '✋',
      description: 'Pan and navigate around the image',
      category: 'navigation',
      shortcut: 'P'
    },
    {
      name: 'Zoom',
      label: 'Zoom',
      icon: '🔍',
      description: 'Zoom in and out of the image',
      category: 'navigation',
      shortcut: 'Z'
    },
    {
      name: 'Wwwc',
      label: 'Window/Level',
      icon: '🔆',
      description: 'Adjust window width and center level',
      category: 'navigation',
      shortcut: 'W'
    }
  ];

  windowingPresets: WindowingPreset[] = [
    {
      name: 'lung',
      label: 'Lung',
      window: 1500,
      level: -600,
      icon: '🫁'
    },
    {
      name: 'bone',
      label: 'Bone',
      window: 2000,
      level: 300,
      icon: '🦴'
    },
    {
      name: 'soft_tissue',
      label: 'Soft Tissue',
      window: 400,
      level: 50,
      icon: '🧠'
    },
    {
      name: 'liver',
      label: 'Liver',
      window: 150,
      level: 30,
      icon: '🫀'
    }
  ];

  constructor(
    private annotationService: AnnotationService,
    private viewportService: ViewportService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setupSubscriptions();
    console.log('🔧 Annotation toolbar initialized');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSubscriptions(): void {
    // Listen to annotation changes
    this.annotationService.annotations$
      .pipe(takeUntil(this.destroy$))
      .subscribe(annotations => {
        this.totalAnnotations = annotations.length;
        this.currentSliceAnnotations = annotations.filter(a => a.sliceIndex === this.currentSlice).length;
      });

    // Listen to current slice changes
    this.viewportService.viewportState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.currentSlice = state.currentSliceIndex;
        // Recalculate current slice annotations
        this.annotationService.annotations$
          .pipe(takeUntil(this.destroy$))
          .subscribe(annotations => {
            this.currentSliceAnnotations = annotations.filter(a => a.sliceIndex === this.currentSlice).length;
          });
      });
  }

  onToolClick(toolName: string): void {
    console.log('Tool clicked:', toolName);
    if (this.selectedTool === toolName) {
      // Deactivate if already selected
      this.selectedTool = null;
      this.deactivateTools.emit();
    } else {
      // Activate new tool
      this.selectedTool = toolName;
      this.toolSelected.emit(toolName);
    }
  }

  onClearAnnotations(): void {
    console.log('Clear annotations button clicked');
    if (this.currentSliceAnnotations > 0) {
      if (confirm(`Clear all ${this.currentSliceAnnotations} annotation(s) from current slice?`)) {
        console.log('Emitting clearAnnotations event');
        this.clearAnnotations.emit();
      }
    } else {
      alert('No annotations to clear on current slice.');
    }
  }



  onDeactivateTools(): void {
    console.log('Deactivate tools button clicked');
    this.selectedTool = null;
    this.deactivateTools.emit();
  }

  onCategoryChange(category: 'annotation' | 'measurement' | 'navigation'): void {
    this.activeCategory = category;
    // Deactivate current tool when switching categories
    this.selectedTool = null;
    this.deactivateTools.emit();
  }

  onWindowingPresetSelect(preset: WindowingPreset): void {
    // Emit windowing preset change
    this.viewportService.applyWindowingPreset(preset.window, preset.level);
    console.log(`Applied ${preset.label} windowing: W=${preset.window}, L=${preset.level}`);
  }

  getToolsByCategory(category: 'annotation' | 'measurement' | 'navigation'): AnnotationTool[] {
    return this.annotationTools.filter(tool => tool.category === category);
  }

  getCurrentSliceAnnotationCount(): number {
    return this.currentSliceAnnotations;
  }

  getTotalAnnotationCount(): number {
    return this.totalAnnotations;
  }

  getToolIcon(tool: AnnotationTool): string {
    return tool.icon;
  }

  isToolActive(toolName: string): boolean {
    return this.selectedTool === toolName;
  }

  isCategoryActive(category: string): boolean {
    return this.activeCategory === category;
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'annotation': return '✏️';
      case 'measurement': return '📐';
      case 'navigation': return '🧭';
      default: return '🔧';
    }
  }


}