export const SAMPLE_DICOM_FILES = [
  {
    name: 'Sample DICOM 1',
    url: 'https://raw.githubusercontent.com/dcmjs-org/data/master/dcm/DICOM_JPEG/image-00001.dcm',
    description: 'Sample DICOM image from dcmjs repository'
  },
  {
    name: 'Sample DICOM 2', 
    url: 'https://raw.githubusercontent.com/dcmjs-org/data/master/dcm/DICOM_JPEG/image-00002.dcm',
    description: 'Another sample DICOM image'
  }
];

export const DEFAULT_VIEWPORT_SETTINGS = {
  zoom: 1,
  pan: { x: 0, y: 0 },
  windowWidth: 400,
  windowLevel: 40,
  invert: false,
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false
};

export const ANNOTATION_COLORS = {
  DEFAULT: '#ff6b35',
  SELECTED: '#00ff88',
  HOVER: '#ffaa00',
  HANDLE: '#ffffff'
};

export const ANNOTATION_SETTINGS = {
  MIN_SIZE: 5,
  HANDLE_SIZE: 8,
  BORDER_WIDTH: 2,
  SELECTION_BORDER_WIDTH: 3
};

export const KEYBOARD_SHORTCUTS = {
  DELETE_ANNOTATION: 'Delete',
  NEXT_SLICE: 'ArrowDown',
  PREVIOUS_SLICE: 'ArrowUp',
  ZOOM_IN: '+',
  ZOOM_OUT: '-',
  RESET_VIEWPORT: 'r',
  TOGGLE_ANNOTATIONS: 'a'
};

export const LOCAL_STORAGE_KEYS = {
  ANNOTATIONS: 'dicom_annotations',
  VIEWPORT_SETTINGS: 'dicom_viewport',
  RECENT_FILES: 'dicom_recent_files'
};

export const ERROR_MESSAGES = {
  INVALID_DICOM: 'Invalid DICOM file format',
  LOAD_FAILED: 'Failed to load DICOM file',
  NETWORK_ERROR: 'Network error while loading file',
  BROWSER_SUPPORT: 'Browser does not support required features',
  FILE_TOO_LARGE: 'File size exceeds maximum limit'
};