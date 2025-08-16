import { 
  Component, 
  OnInit, 
  OnDestroy, 
  ChangeDetectorRef,
  Output,
  EventEmitter,
  HostListener,
  OnChanges
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ViewportService } from '@services/viewport.service';
import { AnnotationService } from '@services/annotation.service';

@Component({
  selector: 'app-slice-navigator',
  templateUrl: './slice-navigator.component.html',
  styleUrls: ['./slice-navigator.component.scss']
})
export class SliceNavigatorComponent implements OnInit, OnDestroy, OnChanges {
  @Output() sliceChanged = new EventEmitter<number>();

  currentSlice = 0;
  totalSlices = 0;
  annotationCount = 0;
  public sliceStats: { [sliceIndex: number]: { count: number, hasSelected: boolean } } = {};
  public isMultiFrame: boolean = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private viewportService: ViewportService,
    private annotationService: AnnotationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setupSubscriptions();
  }

  ngOnChanges(): void {
    this.updateAnnotationCount();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Removed keyboard shortcuts as requested



  private setupSubscriptions(): void {
    this.viewportService.viewportState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.currentSlice = state.currentSliceIndex;
        this.totalSlices = state.totalSlices;
        this.updateAnnotationStats();
        this.cdr.markForCheck();
      });

    // Listen for annotation changes
    this.annotationService.annotations$
      .pipe(takeUntil(this.destroy$))
      .subscribe(annotations => {
        this.updateAnnotationStats();
        this.cdr.markForCheck();
      });
  }

  // 📊 Enhanced annotation statistics update
  private updateAnnotationStats(): void {
    this.sliceStats = this.annotationService.getSliceStats();
    this.annotationCount = this.annotationService.getSliceAnnotationCount(this.currentSlice);
    
    console.log('📊 SliceNavigator: Updated stats for slice', this.currentSlice, '- count:', this.annotationCount);
  }
  
  // 🔄 Legacy method for compatibility
  private updateAnnotationCount(): void {
    this.updateAnnotationStats();
  }

  onSliderChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newSlice = parseInt(target.value, 10);
    this.goToSlice(newSlice);
  }

  nextSlice(): void {
    console.log('▶️ Next slice clicked, current:', this.currentSlice, 'total:', this.totalSlices);
    if (this.currentSlice < this.totalSlices - 1) {
      this.goToSlice(this.currentSlice + 1);
    } else {
      console.log('🚫 Already at last slice');
    }
  }

  previousSlice(): void {
    console.log('◀️ Previous slice clicked, current:', this.currentSlice, 'total:', this.totalSlices);
    if (this.currentSlice > 0) {
      this.goToSlice(this.currentSlice - 1);
    } else {
      console.log('🚫 Already at first slice');
    }
  }

  firstSlice(): void {
    console.log('⏮️ First slice clicked');
    this.goToSlice(0);
  }

  lastSlice(): void {
    console.log('⏭️ Last slice clicked');
    this.goToSlice(this.totalSlices - 1);
  }

  private goToSlice(sliceIndex: number): void {
    console.log('🎯 goToSlice called with index:', sliceIndex, 'valid range: 0 to', this.totalSlices - 1);
    if (sliceIndex >= 0 && sliceIndex < this.totalSlices) {
      console.log('🔄 Setting viewport service slice to:', sliceIndex);
      this.viewportService.setCurrentSlice(sliceIndex);
      
      console.log('📡 Emitting sliceChanged event with:', sliceIndex);
      this.sliceChanged.emit(sliceIndex);
      
      console.log(`✅ Navigator: Successfully moved to slice ${sliceIndex + 1}/${this.totalSlices}`);
    } else {
      console.error('❌ Invalid slice index:', sliceIndex, 'valid range: 0 to', this.totalSlices - 1);
    }
  }

  public getSliceProgress(): number {
    if (this.totalSlices <= 1) return 100;
    return (this.currentSlice / (this.totalSlices - 1)) * 100;
  }

  public getNavigationHint(): string {
    if (this.totalSlices <= 1) {
      return 'Single slice DICOM file';
    }
    
    const annotatedSlices = Object.keys(this.sliceStats).length;
    const methods = ['Mouse wheel on image', 'Navigation buttons', 'Slider control'];
    
    if (annotatedSlices > 0) {
      return `Navigate with: ${methods.join(', ')}. ${annotatedSlices} slices have annotations`;
    }
    
    return `Navigate with: ${methods.join(', ')}`;
  }

  public hasAnnotationsOnSlice(sliceIndex?: number): boolean {
    const slice = sliceIndex ?? this.currentSlice;
    return this.annotationService.hasAnnotationsOnSlice(slice);
  }
  
  // 🎬 Enhanced methods for multi-frame UI feedback
  public getSliceAnnotationCount(sliceIndex?: number): number {
    const slice = sliceIndex ?? this.currentSlice;
    return this.annotationService.getSliceAnnotationCount(slice);
  }
  
  public isCurrentSliceSelected(sliceIndex: number): boolean {
    return this.sliceStats[sliceIndex]?.hasSelected || false;
  }
  
  public getMultiFrameStatus(): string {
    if (!this.isMultiFrame) return 'Single frame';
    const annotatedSlices = Object.keys(this.sliceStats).length;
    return `${annotatedSlices}/${this.totalSlices} annotated`;
  }
  
  // 📊 Additional methods for enhanced UI feedback
  public getSliceIndicesWithAnnotations(): number[] {
    return Object.keys(this.sliceStats).map(key => parseInt(key, 10)).sort((a, b) => a - b);
  }
  
  public getAnnotatedSlicesCount(): number {
    return Object.keys(this.sliceStats).length;
  }
  
  public getTotalAnnotationsCount(): number {
    return Object.values(this.sliceStats).reduce((total, stats) => total + stats.count, 0);
  }
  
  public getSlicePercentage(sliceIndex: number): number {
    if (this.totalSlices <= 1) return 0;
    return (sliceIndex / (this.totalSlices - 1)) * 100;
  }

  // 🎯 Click-to-slide functionality
  private isDragging = false;
  private isThumbDragging = false;

  onProgressBarClick(event: MouseEvent): void {
    if (this.totalSlices <= 1) return;
    
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;
    const newSlice = Math.round((percentage / 100) * (this.totalSlices - 1));
    
    console.log('🎯 Progress bar clicked:', percentage + '%', '→ slice', newSlice);
    this.goToSlice(newSlice);
  }

  onProgressBarMouseDown(event: MouseEvent): void {
    if (this.totalSlices <= 1) return;
    this.isDragging = true;
    console.log('🎯 Progress bar mouse down');
  }

  onProgressBarMouseMove(event: MouseEvent): void {
    if (!this.isDragging || this.totalSlices <= 1) return;
    
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (mouseX / rect.width) * 100));
    const newSlice = Math.round((percentage / 100) * (this.totalSlices - 1));
    
    console.log('🎯 Progress bar dragging:', percentage + '%', '→ slice', newSlice);
    this.goToSlice(newSlice);
  }

  onProgressBarMouseUp(event: MouseEvent): void {
    this.isDragging = false;
    console.log('🎯 Progress bar mouse up');
  }

  onProgressBarMouseLeave(event: MouseEvent): void {
    this.isDragging = false;
    console.log('🎯 Progress bar mouse leave');
  }

  onThumbMouseDown(event: MouseEvent): void {
    if (this.totalSlices <= 1) return;
    this.isThumbDragging = true;
    event.stopPropagation();
    console.log('🎯 Thumb mouse down');
  }

  onThumbMouseMove(event: MouseEvent): void {
    if (!this.isThumbDragging || this.totalSlices <= 1) return;
    
    const progressContainer = (event.currentTarget as HTMLElement).closest('.progress-container') as HTMLElement;
    if (!progressContainer) return;
    
    const rect = progressContainer.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (mouseX / rect.width) * 100));
    const newSlice = Math.round((percentage / 100) * (this.totalSlices - 1));
    
    console.log('🎯 Thumb dragging:', percentage + '%', '→ slice', newSlice);
    this.goToSlice(newSlice);
  }

  onThumbMouseUp(event: MouseEvent): void {
    this.isThumbDragging = false;
    console.log('🎯 Thumb mouse up');
  }
}