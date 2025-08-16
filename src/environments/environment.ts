export const environment = {
  production: false,
  appName: 'Angular DICOM Viewer',
  version: '1.0.0',
  
  // API endpoints (if needed in future)
  apiBaseUrl: 'http://localhost:3000/api',
  
  // DICOM configuration
  dicom: {
    enableWebWorkers: true,
    maxCacheSize: 1000, // MB
    defaultWindowWidth: 400,
    defaultWindowLevel: 40,
    enableCompression: false
  },
  
  // Annotation settings
  annotations: {
    enableAutoSave: true,
    autoSaveInterval: 30000, // 30 seconds
    maxAnnotationsPerSlice: 100,
    enableExport: true
  },
  
  // Performance settings
  performance: {
    enableLazyLoading: true,
    preloadSlices: 3,
    enableGPUAcceleration: true,
    maxTextureSize: 4096
  },
  
  // Feature flags
  features: {
    enableAdvancedTools: true,
    enableMultipleViewports: false,
    enableVolumeRendering: false,
    enableMeasurements: true,
    enableKeyboardShortcuts: true
  },
  
  // Debug settings
  debug: {
    enableLogging: true,
    logLevel: 'debug',
    enablePerformanceMonitoring: true
  }
};