import { Injectable, ElementRef } from '@angular/core';
import { from, Observable, Subject } from 'rxjs';
import { DicomService } from './dicom.service';

declare const require: any;
const cornerstone = require('cornerstone-core');
const cornerstoneTools = require('cornerstone-tools');
const cornerstoneMath = require('cornerstone-math');
const cornerstoneWADOImageLoader = require('cornerstone-wado-image-loader');
const cornerstoneWebImageLoader = require('cornerstone-web-image-loader');
const dicomParser = require('dicom-parser');
const Hammer = require('hammerjs');

@Injectable({
  providedIn: 'root'
})
export class CornerstoneService {
  private renderingEngine: any;
  private eventListenersInitialized = false;

  constructor(private dicomService: DicomService) {
    this.initializeCornerstone();
    this.initializeCornerstoneTools();
  }

  private initializeCornerstone(): void {
    try {
      // Configure external dependencies
      cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
      cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

      // Initialize the WADO image loader
      cornerstoneWADOImageLoader.configure({
        useWebWorkers: false,
        decodeConfig: {
          convertFloatPixelDataToInt: false,
          use16BitDataType: false
        }
      });

      // Register the WADO image loader
      cornerstone.registerImageLoader('wadouri', cornerstoneWADOImageLoader.wadouri.loadImage);
      cornerstone.registerImageLoader('wadors', cornerstoneWADOImageLoader.wadors.loadImage);

      // Register the web image loader
      cornerstone.registerImageLoader('http', cornerstoneWebImageLoader.loadImage);
      cornerstone.registerImageLoader('https', cornerstoneWebImageLoader.loadImage);

      console.log('✅ Cornerstone image loaders registered successfully');
    } catch (error) {
      console.error('Failed to initialize Cornerstone image loaders:', error);
      throw error;
    }
  }

  private initializeCornerstoneTools(): void {
    try {
      cornerstoneTools.external.cornerstone = cornerstone;
      cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
      cornerstoneTools.external.Hammer = Hammer;
      cornerstoneTools.init();

      // Add the Rectangle ROI tool for annotation marking
      const RectangleRoiTool = cornerstoneTools.RectangleRoiTool;
      cornerstoneTools.addTool(RectangleRoiTool);

      console.log('✅ Cornerstone Rectangle ROI tool initialized for annotations');
      console.log('🔍 Available tools:');
      try {
        const allTools = cornerstoneTools.store.getters.allTools();
        console.log('All tools:', allTools);
      } catch (e) {
        console.log('Could not get all tools list');
      }
    } catch (error) {
      console.error('❌ Error initializing Cornerstone tools:', error);
    }
  }

  public async displayDicomImage(
    file: File,
    element: HTMLDivElement
  ): Promise<void> {
    try {
      const series = await this.dicomService.processFile(file);
      console.log('📊 CornerstoneService: Processing series with', series.sliceCount, 'slices');
      
      if (series && series.images.length > 0) {
        const imageId = series.images[0].imageId;
        console.log('🎯 CornerstoneService: Loading first image:', imageId);
        
        cornerstone.enable(element);
        const image = await cornerstone.loadImage(imageId);
        cornerstone.displayImage(element, image);
        this.initializeTools(element);
        
        // Store the image stack for multi-frame navigation
        this.setupImageStack(element, series.images);
        
        // Enable keyboard navigation
        this.setupKeyboardNavigation(element);
        
        console.log('✅ CornerstoneService: Successfully loaded DICOM with', series.sliceCount, 'slices');
      } else {
        throw new Error('No images found in the DICOM series.');
      }
    } catch (error) {
      console.error('Error displaying DICOM image:', error);
      throw error;
    }
  }

  private setupImageStack(element: HTMLDivElement, images: any[]): void {
    // Store image stack for navigation
    (element as any).imageIds = images.map(img => img.imageId);
    (element as any).currentImageIndex = 0;
    
    console.log(`📚 Setup image stack with ${images.length} images`);
    console.log('🖼️ Image IDs:', images.map((img, i) => `${i}: ${img.imageId}`));
  }

  private setupKeyboardNavigation(element: HTMLDivElement): void {
    // Note: Mouse wheel navigation is now handled by DicomViewerNewComponent
    // to avoid conflicts and provide better integration with annotation tools
    
    // Make element focusable for accessibility
    element.tabIndex = 0;
    
    console.log('✅ Cornerstone keyboard navigation setup (mouse wheel handled by DicomViewer)');
  }

  public navigateToSlice(element: HTMLDivElement, sliceIndex: number): void {
    console.log('📑 CornerstoneService.navigateToSlice called with:', sliceIndex);
    
    const imageIds = (element as any).imageIds;
    console.log('🖼️ CornerstoneService imageIds:', imageIds ? imageIds.length : 'none');
    
    if (!imageIds) {
      console.error('❌ CornerstoneService: No imageIds found on element');
      return;
    }
    
    if (sliceIndex < 0 || sliceIndex >= imageIds.length) {
      console.error('❌ CornerstoneService: Invalid slice index:', sliceIndex, 'valid range: 0 to', imageIds.length - 1);
      return;
    }
    
    const imageId = imageIds[sliceIndex];
    console.log('🎯 CornerstoneService: Loading image:', imageId);
    
    (element as any).currentImageIndex = sliceIndex;
    
    try {
      cornerstone.loadImage(imageId).then((image: any) => {
        console.log('🆫 CornerstoneService: Image loaded, displaying...');
        cornerstone.displayImage(element, image);
        console.log(`✅ CornerstoneService: Successfully navigated to slice ${sliceIndex + 1}/${imageIds.length}`);
      }).catch((error: any) => {
        console.error('❌ CornerstoneService: Error loading slice:', error);
      });
    } catch (error) {
      console.error('❌ CornerstoneService: Error in navigateToSlice:', error);
    }
  }

  public getCurrentSliceIndex(element: HTMLDivElement): number {
    return (element as any).currentImageIndex || 0;
  }

  public getTotalSlices(element: HTMLDivElement): number {
    const imageIds = (element as any).imageIds;
    const totalSlices = imageIds ? imageIds.length : 1;
    console.log('🔍 CornerstoneService.getTotalSlices:', totalSlices, 'imageIds:', imageIds);
    return totalSlices;
  }

  private initializeTools(element: HTMLDivElement): void {
    console.log('CornerstoneService: Initializing tools for element');
    
    // Store the element reference for later use
    this.currentElement = element;
    
    try {
      const WwwcTool = cornerstoneTools.WwwcTool;
      const PanTool = cornerstoneTools.PanTool;
      const ZoomTool = cornerstoneTools.ZoomTool;
      
      // Add basic navigation tools
      cornerstoneTools.addTool(WwwcTool);
      cornerstoneTools.addTool(PanTool);
      cornerstoneTools.addTool(ZoomTool);
      
      // Set default tool states - window/level on left click by default
      cornerstoneTools.setToolActive('Wwwc', { mouseButtonMask: 1 }, element); // Left click
      cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 2 }, element);  // Middle click
      cornerstoneTools.setToolActive('Zoom', { mouseButtonMask: 4 }, element); // Right click
      
      // Rectangle ROI tool is now handled by Konva overlay
      // cornerstoneTools.setToolEnabled('RectangleRoi', element);
      
      console.log('🎯 Default tools activated: Wwwc, Pan, Zoom');
      console.log('🎯 Annotation tools handled by Konva overlay');
      
      console.log('✅ Tools initialized for element');
      
      // Enable cornerstone tools for this element
      cornerstoneTools.addToolForElement(element, WwwcTool);
      cornerstoneTools.addToolForElement(element, PanTool);
      cornerstoneTools.addToolForElement(element, ZoomTool);
      
      cornerstone.updateImage(element);
    } catch (error) {
      console.error('❌ Error initializing Cornerstone tools:', error);
      // Continue without tools - Konva overlay will handle annotations
    }
  }

  private currentElement: HTMLDivElement | null = null;

  public activateAnnotationTool(toolName: string, element?: HTMLDivElement): void {
    console.log('CornerstoneService: Attempting to activate tool:', toolName);
    
    // Store or use the provided element
    if (element) {
      this.currentElement = element;
    }
    
    if (!this.currentElement) {
      console.error('❌ No viewport element available for tool activation');
      return;
    }
    
    if (toolName === 'RectangleRoi') {
      try {
        // Check if cornerstone tools are available
        if (!cornerstoneTools) {
          console.error('❌ Cornerstone tools not available!');
          return;
        }
        
        console.log('🔧 Deactivating other tools on element...');
        
        // Disable navigation tools to avoid conflicts with Konva overlay
        try {
          cornerstoneTools.setToolDisabled('Wwwc', this.currentElement);
          cornerstoneTools.setToolDisabled('Pan', this.currentElement);
          cornerstoneTools.setToolDisabled('Zoom', this.currentElement);
        } catch (e) {
          console.warn('Could not disable navigation tools:', e);
        }
        
        // Make sure the element is focusable for mouse events
        this.currentElement.style.cursor = 'crosshair';
        this.currentElement.focus();
        
        console.log('✅ Activated Rectangle ROI tool for annotation marking');
        console.log('📝 Instructions: Click and drag on the DICOM image to draw annotations');
        console.log('🎯 Element should now have crosshair cursor and accept mouse clicks for drawing');
      } catch (error) {
        console.error('❌ Error activating annotation tool:', error);
        console.error('Error details:', error instanceof Error ? error.message : String(error));
      }
    } else {
      console.warn('Unknown tool name:', toolName);
    }
  }

  public deactivateAllAnnotationTools(element?: HTMLDivElement): void {
    if (element) {
      this.currentElement = element;
    }
    
    if (!this.currentElement) {
      console.error('❌ No viewport element available for tool deactivation');
      return;
    }
    
    try {
      // Deactivate Rectangle ROI tool
      cornerstoneTools.setToolPassive('RectangleRoi', this.currentElement);
      
      // Re-enable default navigation tools
      cornerstoneTools.setToolEnabled('Wwwc', this.currentElement);
      cornerstoneTools.setToolEnabled('Pan', this.currentElement);
      cornerstoneTools.setToolEnabled('Zoom', this.currentElement);
      
      // Reactivate default navigation tools
      cornerstoneTools.setToolActive('Wwwc', { mouseButtonMask: 1 }, this.currentElement);
      cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 2 }, this.currentElement);
      cornerstoneTools.setToolActive('Zoom', { mouseButtonMask: 4 }, this.currentElement);
      
      // Reset cursor
      this.currentElement.style.cursor = 'default';
      
      console.log('✅ Deactivated annotation tools, returned to navigation mode');
    } catch (error) {
      console.error('❌ Error deactivating annotation tools:', error);
    }
  }

  public getAnnotations(element: HTMLDivElement): any[] {
    const toolState = cornerstoneTools.globalImageIdSpecificToolStateManager.saveToolState();
    return toolState || [];
  }

  public clearAnnotations(element: HTMLDivElement): void {
    cornerstoneTools.clearToolState(element, 'RectangleRoi');
    cornerstone.updateImage(element);
    console.log('✅ Cleared all annotations');
  }

  public enableAnnotationSelection(element: HTMLDivElement): void {
    // Enable selection and manipulation of existing annotations
    cornerstoneTools.setToolActive('RectangleRoiTouchDrag', {}, element);
    console.log('✅ Enabled annotation selection and editing');
  }

  public selectAnnotation(element: HTMLDivElement, annotationId: string): void {
    const toolState = cornerstoneTools.getToolState(element, 'RectangleRoi');
    if (toolState && toolState.data) {
      // Find and highlight the annotation
      const annotation = toolState.data.find((data: any) => data.uuid === annotationId);
      if (annotation) {
        // Set as selected
        annotation.active = true;
        annotation.highlight = true;
        cornerstone.updateImage(element);
        console.log('✅ Selected annotation:', annotationId);
      }
    }
  }

  public deselectAllAnnotations(element: HTMLDivElement): void {
    const toolState = cornerstoneTools.getToolState(element, 'RectangleRoi');
    if (toolState && toolState.data) {
      toolState.data.forEach((annotation: any) => {
        annotation.active = false;
        annotation.highlight = false;
      });
      cornerstone.updateImage(element);
      console.log('✅ Deselected all annotations');
    }
  }

  public deleteSelectedAnnotation(element: HTMLDivElement): boolean {
    const toolState = cornerstoneTools.getToolState(element, 'RectangleRoi');
    if (toolState && toolState.data) {
      const selectedIndex = toolState.data.findIndex((annotation: any) => annotation.active);
      if (selectedIndex !== -1) {
        const deletedAnnotation = toolState.data.splice(selectedIndex, 1)[0];
        cornerstone.updateImage(element);
        console.log('✅ Deleted selected annotation:', deletedAnnotation.uuid);
        return true;
      }
    }
    return false;
  }

  public updateAnnotationPosition(element: HTMLDivElement, annotationId: string, newCoords: {x: number, y: number, width: number, height: number}): boolean {
    const toolState = cornerstoneTools.getToolState(element, 'RectangleRoi');
    if (toolState && toolState.data) {
      const annotation = toolState.data.find((data: any) => data.uuid === annotationId);
      if (annotation && annotation.handles) {
        // Update the handles
        annotation.handles.start.x = newCoords.x;
        annotation.handles.start.y = newCoords.y;
        annotation.handles.end.x = newCoords.x + newCoords.width;
        annotation.handles.end.y = newCoords.y + newCoords.height;
        
        cornerstone.updateImage(element);
        console.log('✅ Updated annotation position:', annotationId);
        return true;
      }
    }
    return false;
  }
}
