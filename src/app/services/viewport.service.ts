import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ViewportSettings } from '@models/dicom-metadata.model';
import { DEFAULT_VIEWPORT_SETTINGS, LOCAL_STORAGE_KEYS } from '@shared/constants';

export interface ViewportState {
  settings: ViewportSettings;
  currentSliceIndex: number;
  totalSlices: number;
  isDrawingMode: boolean;
  isLoaded: boolean;
}

export interface ViewportAction {
  type: 'zoom' | 'pan' | 'window' | 'reset' | 'slice' | 'mode';
  payload?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ViewportService {
  private viewportStateSubject = new BehaviorSubject<ViewportState>({
    settings: { ...DEFAULT_VIEWPORT_SETTINGS },
    currentSliceIndex: 0,
    totalSlices: 0,
    isDrawingMode: false,
    isLoaded: false
  });

  public viewportState$ = this.viewportStateSubject.asObservable();
  public currentSliceIndex$ = this.viewportStateSubject.pipe(
    map(state => state.currentSliceIndex)
  );

  constructor() {
    this.loadViewportSettings();
  }

  getViewportState(): ViewportState {
    return this.viewportStateSubject.value;
  }

  updateViewportSettings(settings: Partial<ViewportSettings>): void {
    const currentState = this.viewportStateSubject.value;
    const updatedSettings = { ...currentState.settings, ...settings };
    
    this.viewportStateSubject.next({
      ...currentState,
      settings: updatedSettings
    });
    
    this.saveViewportSettings();
  }

  setZoom(zoom: number): void {
    this.updateViewportSettings({ zoom: Math.max(0.1, Math.min(10, zoom)) });
  }

  setPan(pan: { x: number; y: number }): void {
    this.updateViewportSettings({ pan });
  }

  setWindowLevel(windowWidth: number, windowLevel: number): void {
    this.updateViewportSettings({ 
      windowWidth: Math.max(1, windowWidth),
      windowLevel 
    });
  }

  setCurrentSlice(sliceIndex: number): void {
    const currentState = this.viewportStateSubject.value;
    const clampedIndex = Math.max(0, Math.min(currentState.totalSlices - 1, sliceIndex));
    
    if (clampedIndex !== currentState.currentSliceIndex) {
      this.viewportStateSubject.next({
        ...currentState,
        currentSliceIndex: clampedIndex
      });
    }
  }

  setTotalSlices(totalSlices: number): void {
    const currentState = this.viewportStateSubject.value;
    this.viewportStateSubject.next({
      ...currentState,
      totalSlices,
      currentSliceIndex: Math.min(currentState.currentSliceIndex, totalSlices - 1)
    });
  }

  nextSlice(): boolean {
    const currentState = this.viewportStateSubject.value;
    if (currentState.currentSliceIndex < currentState.totalSlices - 1) {
      this.setCurrentSlice(currentState.currentSliceIndex + 1);
      return true;
    }
    return false;
  }

  previousSlice(): boolean {
    const currentState = this.viewportStateSubject.value;
    if (currentState.currentSliceIndex > 0) {
      this.setCurrentSlice(currentState.currentSliceIndex - 1);
      return true;
    }
    return false;
  }

  setDrawingMode(isDrawingMode: boolean): void {
    const currentState = this.viewportStateSubject.value;
    this.viewportStateSubject.next({
      ...currentState,
      isDrawingMode
    });
  }

  toggleDrawingMode(): boolean {
    const currentState = this.viewportStateSubject.value;
    const newMode = !currentState.isDrawingMode;
    this.setDrawingMode(newMode);
    return newMode;
  }

  setLoaded(isLoaded: boolean): void {
    const currentState = this.viewportStateSubject.value;
    this.viewportStateSubject.next({
      ...currentState,
      isLoaded
    });
  }

  resetViewport(): void {
    const currentState = this.viewportStateSubject.value;
    this.viewportStateSubject.next({
      ...currentState,
      settings: { ...DEFAULT_VIEWPORT_SETTINGS }
    });
    this.saveViewportSettings();
  }

  resetZoom(): void {
    this.setZoom(1);
  }

  resetPan(): void {
    this.setPan({ x: 0, y: 0 });
  }

  resetWindowLevel(): void {
    this.setWindowLevel(DEFAULT_VIEWPORT_SETTINGS.windowWidth, DEFAULT_VIEWPORT_SETTINGS.windowLevel);
  }

  applyWindowingPreset(windowWidth: number, windowLevel: number): void {
    console.log(`ViewportService: Applying windowing preset - W:${windowWidth}, L:${windowLevel}`);
    this.setWindowLevel(windowWidth, windowLevel);
  }

  zoomIn(factor: number = 1.2): void {
    const currentZoom = this.viewportStateSubject.value.settings.zoom;
    this.setZoom(currentZoom * factor);
  }

  zoomOut(factor: number = 1.2): void {
    const currentZoom = this.viewportStateSubject.value.settings.zoom;
    this.setZoom(currentZoom / factor);
  }

  adjustWindowWidth(delta: number): void {
    const currentSettings = this.viewportStateSubject.value.settings;
    this.setWindowLevel(currentSettings.windowWidth + delta, currentSettings.windowLevel);
  }

  adjustWindowLevel(delta: number): void {
    const currentSettings = this.viewportStateSubject.value.settings;
    this.setWindowLevel(currentSettings.windowWidth, currentSettings.windowLevel + delta);
  }

  setInvert(invert: boolean): void {
    this.updateViewportSettings({ invert });
  }

  toggleInvert(): boolean {
    const currentInvert = this.viewportStateSubject.value.settings.invert;
    const newInvert = !currentInvert;
    this.setInvert(newInvert);
    return newInvert;
  }

  setRotation(rotation: number): void {
    const normalizedRotation = rotation % 360;
    this.updateViewportSettings({ rotation: normalizedRotation });
  }

  rotateClockwise(): void {
    const currentRotation = this.viewportStateSubject.value.settings.rotation;
    this.setRotation(currentRotation + 90);
  }

  rotateCounterClockwise(): void {
    const currentRotation = this.viewportStateSubject.value.settings.rotation;
    this.setRotation(currentRotation - 90);
  }

  setFlipHorizontal(flipHorizontal: boolean): void {
    this.updateViewportSettings({ flipHorizontal });
  }

  setFlipVertical(flipVertical: boolean): void {
    this.updateViewportSettings({ flipVertical });
  }

  toggleFlipHorizontal(): boolean {
    const currentFlip = this.viewportStateSubject.value.settings.flipHorizontal;
    const newFlip = !currentFlip;
    this.setFlipHorizontal(newFlip);
    return newFlip;
  }

  toggleFlipVertical(): boolean {
    const currentFlip = this.viewportStateSubject.value.settings.flipVertical;
    const newFlip = !currentFlip;
    this.setFlipVertical(newFlip);
    return newFlip;
  }

  // Convenience methods for getting current values
  getCurrentSliceIndex(): number {
    return this.viewportStateSubject.value.currentSliceIndex;
  }

  getTotalSlices(): number {
    return this.viewportStateSubject.value.totalSlices;
  }

  getViewportSettings(): ViewportSettings {
    return { ...this.viewportStateSubject.value.settings };
  }

  isDrawingMode(): boolean {
    return this.viewportStateSubject.value.isDrawingMode;
  }

  isLoaded(): boolean {
    return this.viewportStateSubject.value.isLoaded;
  }

  // Batch operations
  applyPreset(preset: 'chest' | 'lung' | 'bone' | 'brain'): void {
    const presets = {
      chest: { windowWidth: 400, windowLevel: 40 },
      lung: { windowWidth: 1500, windowLevel: -600 },
      bone: { windowWidth: 1800, windowLevel: 400 },
      brain: { windowWidth: 100, windowLevel: 50 }
    };

    if (presets[preset]) {
      this.setWindowLevel(presets[preset].windowWidth, presets[preset].windowLevel);
    }
  }

  private saveViewportSettings(): void {
    try {
      const settings = this.viewportStateSubject.value.settings;
      localStorage.setItem(LOCAL_STORAGE_KEYS.VIEWPORT_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving viewport settings:', error);
    }
  }

  private loadViewportSettings(): void {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.VIEWPORT_SETTINGS);
      if (stored) {
        const settings = JSON.parse(stored);
        const currentState = this.viewportStateSubject.value;
        this.viewportStateSubject.next({
          ...currentState,
          settings: { ...DEFAULT_VIEWPORT_SETTINGS, ...settings }
        });
      }
    } catch (error) {
      console.error('Error loading viewport settings:', error);
    }
  }
}