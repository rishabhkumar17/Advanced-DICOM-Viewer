import { Component, ElementRef, Input, AfterViewInit, OnDestroy, ViewChild, Output, EventEmitter } from '@angular/core';
import { CornerstoneService } from '@services/cornerstone.service';
import { AnnotationService } from '@services/annotation.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ViewportService } from '@services/viewport.service';
import { AnnotationOverlayComponent } from '../annotation-overlay/annotation-overlay.component';

declare const cornerstone: any;

@Component({
  selector: 'app-dicom-viewer-new',
  templateUrl: './dicom-viewer-new.component.html',
  styleUrls: ['./dicom-viewer-new.component.scss']
})
export class DicomViewerNewComponent implements AfterViewInit, OnDestroy {
  @Input() file!: File;
  
  // Loading state management
  public showLoading(message: string, progress: number = 0): void {
    this.isLoading = true;
    this.loadingMessage = message;
    this.loadingProgress = progress;
  }
  
  public updateLoading(message: string, progress: number): void {
    this.loadingMessage = message;
    this.loadingProgress = progress;
  }
  
  public hideLoading(): void {
    this.isLoading = false;
  }
  @ViewChild('vp', {static: true}) vpElem!: ElementRef<HTMLDivElement>;
  @ViewChild(AnnotationOverlayComponent) annotationOverlay!: AnnotationOverlayComponent;
  @Output() annotationCreated = new EventEmitter<any>();
  @Output() annotationUpdated = new EventEmitter<any>();

  viewportWidth: number = 512;
  viewportHeight: number = 512;
  activeTool: string | null = null;
  isLoading: boolean = false;
  loadingMessage: string = 'Initializing...';
  loadingProgress: number = 0;
  private destroy$ = new Subject<void>();
  private wheelDebounceTimeout: NodeJS.Timeout | null = null;
  private globalWheelHandler: ((e: WheelEvent) => void) | null = null;
  private canvasWheelHandler: ((e: WheelEvent) => void) | null = null;

  constructor(
    private cornerstoneService: CornerstoneService,
    private annotationService: AnnotationService,
    private viewportService: ViewportService
  ) {}
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Clear any pending timeouts
    if (this.wheelDebounceTimeout) {
      clearTimeout(this.wheelDebounceTimeout);
    }
    
    // Remove global wheel listener
    if (this.globalWheelHandler) {
      document.removeEventListener('wheel', this.globalWheelHandler);
    }
    
    // Remove canvas wheel listener
    if (this.canvasWheelHandler) {
      const canvas = this.vpElem.nativeElement.querySelector('canvas');
      if (canvas) {
        canvas.removeEventListener('wheel', this.canvasWheelHandler);
      }
    }
  }

  async ngAfterViewInit() {
    if (this.file) {
      try {
        // Show loading state
        this.isLoading = true;
        this.loadingMessage = 'Loading DICOM file...';
        this.loadingProgress = 10;
        
        console.log('🏥 DICOM Viewer: Initializing with file:', this.file.name);
        
        this.loadingProgress = 30;
        this.loadingMessage = 'Processing DICOM data...';
        await this.cornerstoneService.displayDicomImage(this.file, this.vpElem.nativeElement);
        
        this.loadingProgress = 60;
        this.loadingMessage = 'Setting up navigation...';
        this.setupSliceNavigation();
        
        this.loadingProgress = 80;
        this.loadingMessage = 'Configuring mouse wheel...';
        this.setupMouseWheelNavigation();
        
        this.loadingProgress = 90;
        this.loadingMessage = 'Finalizing setup...';
        this.setupAdvancedInteractions();
        
        // Update viewport dimensions for overlay
        setTimeout(() => {
          this.updateViewportDimensions();
        }, 100);
        
        this.loadingProgress = 100;
        this.loadingMessage = 'Ready!';
        
        // Hide loading after a brief moment
        setTimeout(() => {
          this.isLoading = false;
        }, 500);
        
        console.log('✅ DICOM Viewer: Initialization complete - Ready for annotations');
      } catch (e) {
        console.error('❌ DICOM viewer error:', e);
        this.loadingMessage = 'Failed to load DICOM file';
        this.isLoading = false;
      }
    }
  }

  private updateViewportDimensions(): void {
    if (this.vpElem && this.vpElem.nativeElement) {
      const rect = this.vpElem.nativeElement.getBoundingClientRect();
      this.viewportWidth = rect.width || 512;
      this.viewportHeight = rect.height || 512;
      console.log('📐 Updated viewport dimensions:', this.viewportWidth, 'x', this.viewportHeight);
    }
  }

  // Listen for window resize to update overlay dimensions
  public onWindowResize(): void {
    setTimeout(() => {
      this.updateViewportDimensions();
    }, 100);
  }

  private setupSliceNavigation(): void {
    const element = this.vpElem.nativeElement;
    
    // Add a small delay to ensure Cornerstone has finished loading
    setTimeout(() => {
      const totalSlices = this.cornerstoneService.getTotalSlices(element);

      console.log('📊 Setting up slice navigation with', totalSlices, 'total slices');
    
      if (totalSlices > 0) {
    // Update viewport service with slice information
    this.viewportService.setTotalSlices(totalSlices);
    this.viewportService.setCurrentSlice(0);
        
        console.log('✅ Slice navigation setup complete - Total slices:', totalSlices);
      } else {
        console.log('⚠️ No slices detected, checking again in 500ms...');
        // Retry after a longer delay
        setTimeout(() => {
          const retryTotalSlices = this.cornerstoneService.getTotalSlices(element);
          console.log('🔄 Retry - Total slices detected:', retryTotalSlices);
          if (retryTotalSlices > 0) {
            this.viewportService.setTotalSlices(retryTotalSlices);
            this.viewportService.setCurrentSlice(0);
            console.log('✅ Slice navigation setup complete on retry');
          }
        }, 500);
      }
    }, 100);
    
    // Listen to viewport service for slice changes
    this.viewportService.viewportState$.subscribe(state => {
      const currentSlice = this.cornerstoneService.getCurrentSliceIndex(element);

      if (state.currentSliceIndex !== currentSlice) {
        console.log('🔄 Slice navigation: changing from', currentSlice, 'to', state.currentSliceIndex);
        this.cornerstoneService.navigateToSlice(element, state.currentSliceIndex);
      }
    });
  }

  // Annotation event listeners are now handled by the Konva overlay component

  // Annotation creation and updates are now handled by the Konva overlay component

  public activateAnnotationTool(toolName: string): void {
    console.log('🔧 DicomViewerNewComponent: Activating annotation tool:', toolName);
    this.activeTool = toolName;
    
    // Update viewport dimensions
    this.updateViewportDimensions();
    
    console.log('✅ Activated Konva-based annotation tool:', toolName);
  }

  public deactivateAnnotationTools(): void {
    console.log('🛑 DicomViewerNewComponent: Deactivating annotation tools');
    this.activeTool = null;
    console.log('✅ Deactivated annotation tools');
  }

  public clearAnnotations(): void {
    console.log('🗑️ DicomViewerNewComponent: Clearing annotations');
    if (this.annotationOverlay) {
      this.annotationOverlay.clearAll();
    }
  }

  public onAnnotationCreated(annotation: any): void {
    console.log('✅ DicomViewerNewComponent: Annotation created:', annotation);
    this.annotationCreated.emit(annotation);
  }

  public onAnnotationUpdated(annotation: any): void {
    console.log('✏️ DicomViewerNewComponent: Annotation updated:', annotation);
    this.annotationUpdated.emit(annotation);
  }

  public onAnnotationSelected(annotation: any): void {
    console.log('🎯 DicomViewerNewComponent: Annotation selected:', annotation);
    // Handle annotation selection if needed
  }

  // Annotation selection and interaction are now handled by the Konva overlay component
  
  public selectAnnotationById(annotationId: string): void {
    console.log('🎯 Selecting annotation by ID:', annotationId);
    this.annotationService.selectAnnotation(annotationId);
  }

  // Annotations are now managed by the annotation service and Konva overlay

    private setupMouseWheelNavigation(): void {
    const element = this.vpElem.nativeElement;
    let wheelTimeout: NodeJS.Timeout | null = null;
    let touchStartY = 0;
    let touchStartTime = 0;

    if (!element) {
      console.error('Mouse wheel setup failed: element not found');
      return;
    }
    
    // Mouse wheel navigation
    element.addEventListener('wheel', (e: WheelEvent) => {
      console.log('🖱️ Mouse wheel event detected:', e.deltaY, 'activeTool:', this.activeTool);

      // Check if element is properly initialized
      if (!element) {
        console.log('🚫 Element not found for wheel navigation');
        return;
      }
      
      // Only handle wheel events when NOT in annotation mode
      if (this.activeTool) {
        console.log('🚫 Wheel event ignored - annotation tool active');
        return;
      }
      
      e.preventDefault();
      e.stopPropagation(); // Prevent event bubbling
      
      const totalSlices = this.cornerstoneService.getTotalSlices(element);
      console.log('📊 Total slices available:', totalSlices);
      
      if (totalSlices > 1) {
        const currentSlice = this.viewportService.getCurrentSliceIndex();
        let newSlice = currentSlice;
        
        // Determine scroll direction with improved sensitivity
        if (Math.abs(e.deltaY) > 1) {  // Very low threshold for better responsiveness
          if (e.deltaY > 0) {
            // Scroll down - next slice
            newSlice = Math.min(currentSlice + 1, totalSlices - 1);
            console.log('⬇️ Scrolling down to next slice');
          } else {
            // Scroll up - previous slice
            newSlice = Math.max(currentSlice - 1, 0);
            console.log('⬆️ Scrolling up to previous slice');
          }
          
          if (newSlice !== currentSlice) {
            console.log('🔄 Slice change detected:', currentSlice, '→', newSlice);
            
            // Clear previous timeout
            if (this.wheelDebounceTimeout) {
              clearTimeout(this.wheelDebounceTimeout);
            }
            
            // Immediate navigation for better responsiveness
            console.log('🎯 Navigating to slice:', newSlice);
            
            try {
              this.cornerstoneService.navigateToSlice(element, newSlice);
              this.viewportService.setCurrentSlice(newSlice);
              console.log('✅ Navigation successful');
            } catch (error) {
              console.error('❌ Navigation failed:', error);
            }
            
            // Visual feedback
            element.style.boxShadow = '0 0 12px rgba(59, 130, 246, 0.6)';
            element.style.transition = 'box-shadow 0.2s ease-out';
            
            // Remove highlight after brief moment
              if (wheelTimeout) {
                clearTimeout(wheelTimeout);
            }
            wheelTimeout = setTimeout(() => {
              element.style.boxShadow = '';
              element.style.transition = '';
            }, 300);
          } else {
            console.log('🚫 No slice change needed');
          }
        } else {
          console.log('🚫 Scroll delta too small:', e.deltaY);
        }
      } else {
        console.log('🚫 Single slice DICOM - no navigation needed');
      }
    }, { passive: false });
    
    // Touch navigation for mobile devices
    element.addEventListener('touchstart', (e: TouchEvent) => {
      if (this.activeTool) return;
      
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    }, { passive: true });
    
    element.addEventListener('touchend', (e: TouchEvent) => {
      if (this.activeTool) return;
      
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();
      const deltaY = touchStartY - touchEndY;
      const deltaTime = touchEndTime - touchStartTime;
      
      // Only handle quick swipes (less than 300ms)
      if (deltaTime < 300 && Math.abs(deltaY) > 30) {
        const totalSlices = this.cornerstoneService.getTotalSlices(element);
        
        if (totalSlices > 1) {
          const currentSlice = this.viewportService.getCurrentSliceIndex();
          let newSlice = currentSlice;
          
          if (deltaY > 0) {
            // Swipe up - next slice
            newSlice = Math.min(currentSlice + 1, totalSlices - 1);
          } else {
            // Swipe down - previous slice
            newSlice = Math.max(currentSlice - 1, 0);
          }
          
          if (newSlice !== currentSlice) {
            console.log('📱 Touch navigation:', currentSlice, '→', newSlice);
            this.cornerstoneService.navigateToSlice(element, newSlice);
            this.viewportService.setCurrentSlice(newSlice);
            
            // Visual feedback
            element.style.boxShadow = '0 0 12px rgba(59, 130, 246, 0.6)';
            element.style.transition = 'box-shadow 0.2s ease-out';
            
            setTimeout(() => {
              element.style.boxShadow = '';
              element.style.transition = '';
            }, 300);
          }
        }
      }
    }, { passive: true });
    
    // Global mouse wheel listener for better responsiveness
    this.globalWheelHandler = (e: WheelEvent) => {
      console.log('🌐 Global wheel event detected:', e.deltaY, 'target:', e.target);
      
      // Check if the event is over our DICOM viewer element or its children (like canvas)
      const target = e.target as HTMLElement;
      
      // Check if target is a canvas (Cornerstone canvas) or our viewer element
      const isCanvas = target.tagName === 'CANVAS';
      const canvasInElement = element.querySelector('canvas');
      
      // Simplified check: if it's a canvas and we have a canvas in our element, treat it as our canvas
      const isOverViewer = element.contains(target) || element === target || 
                          (isCanvas && canvasInElement) ||
                          (isCanvas && target.style.position === 'absolute' && target.style.display === 'block') ||
                          (isCanvas && (target as HTMLCanvasElement).width > 0 && (target as HTMLCanvasElement).height > 0); // Any active canvas
      
      console.log('🎯 Element check:', {
        element: element,
        target: target,
        isCanvas: isCanvas,
        contains: element.contains(target),
        isEqual: element === target,
        hasCanvas: !!canvasInElement,
        targetIsCanvas: target === canvasInElement,
        targetStyle: { position: target.style.position, display: target.style.display },
        canvasDimensions: isCanvas ? { width: (target as HTMLCanvasElement).width, height: (target as HTMLCanvasElement).height } : null
      });
      
      if (isOverViewer) {
        console.log('🌐 Global wheel event over DICOM viewer');
        
        // Check if element is properly initialized
        if (!element) {
          console.log('🚫 Element not found for global wheel navigation');
          return;
        }
        
        // Only handle wheel events when NOT in annotation mode
        if (this.activeTool) {
          console.log('🚫 Global wheel event ignored - annotation tool active');
          return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        const totalSlices = this.cornerstoneService.getTotalSlices(element);
        console.log('📊 Global: Total slices available:', totalSlices);
        
        if (totalSlices > 1) {
          const currentSlice = this.viewportService.getCurrentSliceIndex();
          let newSlice = currentSlice;
          
          // Determine scroll direction
          if (Math.abs(e.deltaY) > 1) {
            if (e.deltaY > 0) {
              newSlice = Math.min(currentSlice + 1, totalSlices - 1);
              console.log('⬇️ Global: Scrolling down to next slice');
            } else {
              newSlice = Math.max(currentSlice - 1, 0);
              console.log('⬆️ Global: Scrolling up to previous slice');
            }
            
            if (newSlice !== currentSlice) {
              console.log('🔄 Global: Slice change detected:', currentSlice, '→', newSlice);
              
              try {
                this.cornerstoneService.navigateToSlice(element, newSlice);
                this.viewportService.setCurrentSlice(newSlice);
                console.log('✅ Global navigation successful');
              } catch (error) {
                console.error('❌ Global navigation failed:', error);
              }
              
              // Visual feedback
              element.style.boxShadow = '0 0 12px rgba(59, 130, 246, 0.6)';
              element.style.transition = 'box-shadow 0.2s ease-out';
              
              setTimeout(() => {
                element.style.boxShadow = '';
                element.style.transition = '';
              }, 300);
            } else {
              console.log('🚫 Global: No slice change needed');
            }
          } else {
            console.log('🚫 Global: Scroll delta too small:', e.deltaY);
          }
        } else {
          console.log('🚫 Global: Single slice DICOM - no navigation needed');
        }
      } else {
        console.log('🚫 Global: Event not over DICOM viewer');
      }
    };
    
    document.addEventListener('wheel', this.globalWheelHandler, { passive: false });
    
    // Simple test wheel handler to verify events are being captured
    element.addEventListener('wheel', (e: WheelEvent) => {
      console.log('🧪 TEST: Basic wheel event captured on element:', e.deltaY);
      
      // Test cornerstone service
      const totalSlices = this.cornerstoneService.getTotalSlices(element);
      const currentSlice = this.viewportService.getCurrentSliceIndex();
      console.log('🧪 TEST: Total slices:', totalSlices, 'Current slice:', currentSlice);
    }, { passive: false });
    
    // Also listen to canvas wheel events directly
    setTimeout(() => {
      const canvas = element.querySelector('canvas');
      if (canvas) {
        console.log('🎨 Found canvas element, adding wheel listener');
        this.canvasWheelHandler = (e: WheelEvent) => {
          console.log('🎨 Canvas wheel event detected:', e.deltaY);
          
          // Only handle wheel events when NOT in annotation mode
          if (this.activeTool) {
            console.log('🚫 Canvas wheel event ignored - annotation tool active');
            return;
          }
          
          e.preventDefault();
          e.stopPropagation();
          
          const totalSlices = this.cornerstoneService.getTotalSlices(element);
          console.log('📊 Canvas: Total slices available:', totalSlices);
          
          if (totalSlices > 1) {
            const currentSlice = this.viewportService.getCurrentSliceIndex();
            let newSlice = currentSlice;
            
            // Determine scroll direction
            if (Math.abs(e.deltaY) > 1) {
              if (e.deltaY > 0) {
                newSlice = Math.min(currentSlice + 1, totalSlices - 1);
                console.log('⬇️ Canvas: Scrolling down to next slice');
              } else {
                newSlice = Math.max(currentSlice - 1, 0);
                console.log('⬆️ Canvas: Scrolling up to previous slice');
              }
              
              if (newSlice !== currentSlice) {
                console.log('🔄 Canvas: Slice change detected:', currentSlice, '→', newSlice);
                
                try {
                  this.cornerstoneService.navigateToSlice(element, newSlice);
                  this.viewportService.setCurrentSlice(newSlice);
                  console.log('✅ Canvas navigation successful');
                } catch (error) {
                  console.error('❌ Canvas navigation failed:', error);
                }
                
                // Visual feedback
                element.style.boxShadow = '0 0 12px rgba(59, 130, 246, 0.6)';
                element.style.transition = 'box-shadow 0.2s ease-out';
                
                setTimeout(() => {
                  element.style.boxShadow = '';
                  element.style.transition = '';
                }, 300);
              } else {
                console.log('🚫 Canvas: No slice change needed');
              }
            } else {
              console.log('🚫 Canvas: Scroll delta too small:', e.deltaY);
            }
          } else {
            console.log('🚫 Canvas: Single slice DICOM - no navigation needed');
          }
        };
        
        canvas.addEventListener('wheel', this.canvasWheelHandler, { passive: false });
      } else {
        console.log('❌ No canvas element found');
      }
    }, 1000); // Wait for Cornerstone to create the canvas
    

  }

  private setupAdvancedInteractions(): void {
    const element = this.vpElem.nativeElement;
    
    // Enhanced focus management for better accessibility
    element.setAttribute('tabindex', '0');
    element.style.outline = 'none';
    
    // Add visual feedback for mouse wheel availability
    element.addEventListener('mouseenter', () => {
      if (!this.activeTool && this.cornerstoneService.getTotalSlices(element) > 1) {
        element.style.cursor = 'grab';
        element.title = 'Use mouse wheel to navigate slices, or click and drag to pan';
      }
    });
    
    element.addEventListener('mouseleave', () => {
      if (!this.activeTool) {
        element.style.cursor = 'default';
        element.removeAttribute('title');
      }
    });
    
    // Removed keyboard shortcuts as requested
    
    console.log('✅ Advanced interactions setup complete');
  }

  public getNavigationStatus(): string {
    const totalSlices = this.cornerstoneService.getTotalSlices(this.vpElem.nativeElement);
    const currentSlice = this.viewportService.getCurrentSliceIndex();
    
    if (totalSlices <= 1) {
      return 'Single slice DICOM';
    }
    
    return `Slice ${currentSlice + 1} of ${totalSlices} - Use mouse wheel, arrow keys, or buttons to navigate`;
  }
}