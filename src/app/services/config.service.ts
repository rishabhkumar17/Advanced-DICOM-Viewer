import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config = environment;

  constructor() {
    console.log('🔧 Config Service initialized with environment:', this.config.production ? 'production' : 'development');
  }

  // DICOM Configuration
  get dicomConfig() {
    return this.config.dicom;
  }

  // Annotation Configuration
  get annotationConfig() {
    return this.config.annotations;
  }

  // Performance Configuration
  get performanceConfig() {
    return this.config.performance;
  }

  // Feature Flags
  get features() {
    return this.config.features;
  }

  // Debug Configuration
  get debugConfig() {
    return this.config.debug;
  }

  // App Information
  get appName() {
    return this.config.appName;
  }

  get version() {
    return this.config.version;
  }

  get isProduction() {
    return this.config.production;
  }

  // Helper methods
  shouldEnableLogging(): boolean {
    return this.debugConfig.enableLogging;
  }

  shouldEnableAutoSave(): boolean {
    return this.annotationConfig.enableAutoSave;
  }

  shouldEnableWebWorkers(): boolean {
    return this.dicomConfig.enableWebWorkers;
  }

  getMaxAnnotationsPerSlice(): number {
    return this.annotationConfig.maxAnnotationsPerSlice;
  }

  getAutoSaveInterval(): number {
    return this.annotationConfig.autoSaveInterval;
  }

  getMaxCacheSize(): number {
    return this.dicomConfig.maxCacheSize;
  }

  getPreloadSlices(): number {
    return this.performanceConfig.preloadSlices;
  }
} 