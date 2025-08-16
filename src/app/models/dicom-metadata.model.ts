export interface DicomMetadata {
  studyInstanceUID: string;
  seriesInstanceUID: string;
  sopInstanceUID: string;
  instanceNumber: number;
  rows: number;
  columns: number;
  sliceThickness?: number;
  sliceLocation?: number;
  imagePosition?: number[];
  imageOrientation?: number[];
  pixelSpacing?: number[];
  windowWidth?: number;
  windowCenter?: number;
  rescaleIntercept?: number;
  rescaleSlope?: number;
  frameIndex?: number; // For multi-frame DICOM files
}

export interface DicomSeries {
  seriesInstanceUID: string;
  studyInstanceUID: string;
  seriesDescription?: string;
  modality: string;
  images: DicomImage[];
  sliceCount: number;
}

export interface DicomImage {
  sopInstanceUID: string;
  instanceNumber: number;
  imageId: string;
  metadata: DicomMetadata;
  isLoaded: boolean;
}

export interface ViewportSettings {
  zoom: number;
  pan: { x: number; y: number };
  windowWidth: number;
  windowLevel: number;
  invert: boolean;
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
}

export interface LoadingProgress {
  loaded: number;
  total: number;
  percentage: number;
  currentFile?: string;
}

export enum DicomLoadState {
  IDLE = 'idle',
  LOADING = 'loading',
  LOADED = 'loaded',
  ERROR = 'error'
}

export interface DicomLoadResult {
  series: DicomSeries | null;
  state: DicomLoadState;
  error?: string;
  progress?: LoadingProgress;
}