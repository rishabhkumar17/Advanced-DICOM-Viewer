import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { DicomService } from '@services/dicom.service';
import { AnnotationService } from '@services/annotation.service';
import { ViewportService } from '@services/viewport.service';
import { ConfigService } from '@services/config.service';
import { DicomLoadResult, DicomLoadState, DicomSeries } from '@models/dicom-metadata.model';
import { Annotation } from '@models/annotation.model';
import { DicomViewerNewComponent } from './components/dicom-viewer-new/dicom-viewer-new.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  
  @ViewChild('dicomViewer') dicomViewer!: DicomViewerNewComponent;
  
  currentSeries: DicomSeries | null = null;
  loadingState: DicomLoadState = DicomLoadState.IDLE;
  isSidebarCollapsed = false;
  errorMessage = '';
  file: File | null = null;
  currentSliceIndex = 0;
  annotations: Annotation[] = [];
  
  private destroy$ = new Subject<void>();

  constructor(
    private dicomService: DicomService,
    private annotationService: AnnotationService,
    private viewportService: ViewportService,
    private configService: ConfigService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Log app initialization with config
    console.log('🚀 App initialized:', this.configService.appName, 'v' + this.configService.version);
    
    // Clear all annotations on page reload
    this.annotationService.clearAllAnnotations();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSubscriptions(): void {
    // Listen to DICOM series changes
    this.dicomService.currentSeries$
      .pipe(takeUntil(this.destroy$))
      .subscribe(series => {
        this.currentSeries = series;
        this.cdr.markForCheck();
      });

    // Listen to loading state changes
    this.dicomService.loadingState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.loadingState = state;
        if (state === DicomLoadState.ERROR) {
          this.errorMessage = 'Failed to load DICOM file. Please try again.';
        } else if (state === DicomLoadState.LOADED) {
          this.errorMessage = '';
        }
        this.cdr.markForCheck();
      });

    // Listen to current slice changes for overlay display
    this.viewportService.currentSliceIndex$
      .pipe(takeUntil(this.destroy$))
      .subscribe(sliceIndex => {
        this.currentSliceIndex = sliceIndex;
        this.cdr.markForCheck();
      });

    // Listen to annotation changes for overlay display
    this.annotationService.annotations$
      .pipe(takeUntil(this.destroy$))
      .subscribe(annotations => {
        this.annotations = annotations;
        this.cdr.markForCheck();
      });
  }

  onFileLoaded(file: File): void {
    this.file = file;
    this.loadingState = DicomLoadState.LOADING;
    this.cdr.markForCheck();
    
    this.dicomService.processFile(file).then(series => {
        this.currentSeries = series;
        this.loadingState = DicomLoadState.LOADED;
        this.cdr.markForCheck();
    }).catch(error => {
        this.errorMessage = error.message;
        this.loadingState = DicomLoadState.ERROR;
        this.cdr.markForCheck();
    });
  }

  onLoadingStateChanged(state: DicomLoadState): void {
    this.loadingState = state;
    this.cdr.markForCheck();
  }

  onAnnotationSelected(annotation: Annotation | null): void {
    console.log('🎯 App: Annotation selected:', annotation);
    
    if (annotation && this.dicomViewer) {
      // Tell the DICOM viewer to highlight this annotation
      this.dicomViewer.selectAnnotationById(annotation.id);
      console.log('✅ App: Told DICOM viewer to highlight annotation:', annotation.id);
    } else if (!annotation && this.dicomViewer) {
      // Deselect all annotations on the canvas
      this.dicomViewer.selectAnnotationById('');
      console.log('✅ App: Told DICOM viewer to deselect all annotations');
    }
    
    this.cdr.markForCheck();
  }

      onNavigateToSlice(sliceIndex: number): void {
        console.log('🧭 App: onNavigateToSlice called with:', sliceIndex);
        console.log('🔍 App: Current viewport state before navigation:', this.viewportService.getCurrentSliceIndex());
        this.viewportService.setCurrentSlice(sliceIndex);
        console.log('🔍 App: Current viewport state after navigation:', this.viewportService.getCurrentSliceIndex());
        this.cdr.markForCheck();
    }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  clearError(): void {
    this.errorMessage = '';
  }

  get isLoading(): boolean {
    return this.loadingState === DicomLoadState.LOADING;
  }

  get hasError(): boolean {
    return this.loadingState === DicomLoadState.ERROR || !!this.errorMessage;
  }

  get hasData(): boolean {
    return !!this.currentSeries && this.currentSeries.images.length > 0;
  }

  get showFileLoader(): boolean {
    return !this.hasData && !this.isLoading;
  }

    onSliceChanged(sliceIndex: number): void {
        console.log('📍 App: onSliceChanged called with:', sliceIndex);
        console.log('🔍 App: Current viewport state before slice change:', this.viewportService.getCurrentSliceIndex());
        this.viewportService.setCurrentSlice(sliceIndex);
        console.log('🔍 App: Current viewport state after slice change:', this.viewportService.getCurrentSliceIndex());
    }

    // Annotation event handlers
    onAnnotationToolSelected(toolName: string): void {
        console.log('🔧 App: Annotation tool selected:', toolName);
        if (this.dicomViewer) {
            console.log('✅ App: DICOM viewer found, activating tool...');
            this.dicomViewer.activateAnnotationTool(toolName);
        } else {
            console.error('❌ App: DICOM viewer not found! Cannot activate annotation tool.');
        }
    }

    onClearAnnotations(): void {
        console.log('🗑️ App: Clearing all annotations');
        this.annotationService.clearAllAnnotations();
        // Also clear the Konva canvas
        if (this.dicomViewer) {
            this.dicomViewer.clearAnnotations();
        }
    }

    onDeactivateAnnotationTools(): void {
        console.log('🛑 App: Deactivating annotation tools');
        if (this.dicomViewer) {
            this.dicomViewer.deactivateAnnotationTools();
        } else {
            console.error('❌ App: DICOM viewer not found! Cannot deactivate tools.');
        }
    }



    onAnnotationCreated(annotation: any): void {
        console.log('✅ App: Annotation created successfully:', annotation);
        // Annotation is already saved by the annotation service
        this.cdr.markForCheck();
    }

      onAnnotationUpdated(annotation: any): void {
    console.log('✏️ App: Annotation updated:', annotation);
    // Annotation updates are handled by the annotation service
    this.cdr.markForCheck();
  }

  // Removed global keyboard shortcuts as requested
}
