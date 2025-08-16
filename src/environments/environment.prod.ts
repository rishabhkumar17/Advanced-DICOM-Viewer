export const environment = {
  production: true,
  appName: 'Angular DICOM Viewer',
  version: '1.0.0',
  
  // API endpoints
  apiBaseUrl: 'https://api.dicom-viewer.com/api',
  
  // DICOM configuration
  dicom: {
    enableWebWorkers: true,
    maxCacheSize: 2000, // MB (increased for production)
    defaultWindowWidth: 400,
    defaultWindowLevel: 40,
    enableCompression: true // Enable compression in production
  },
  
  // Annotation settings
  annotations: {
    enableAutoSave: true,
    autoSaveInterval: 15000, // 15 seconds (more frequent in production)
    maxAnnotationsPerSlice: 100,
    enableExport: true
  },
  
  // Performance settings
  performance: {
    enableLazyLoading: true,
    preloadSlices: 5, // Increased preloading for better UX
    enableGPUAcceleration: true,
    maxTextureSize: 8192 // Higher quality in production
  },
  
  // Feature flags
  features: {
    enableAdvancedTools: true,
    enableMultipleViewports: false,
    enableVolumeRendering: false,
    enableMeasurements: true,
    enableKeyboardShortcuts: true
  },
  
  // Debug settings (disabled in production)
  debug: {
    enableLogging: false,
    logLevel: 'error',
    enablePerformanceMonitoring: false
  }
};