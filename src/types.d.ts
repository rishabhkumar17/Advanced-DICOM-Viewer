// Type declarations for DICOM and Cornerstone libraries

declare module 'cornerstone-core' {
  interface Image {
    imageId: string;
    minPixelValue: number;
    maxPixelValue: number;
    slope: number;
    intercept: number;
    windowCenter: number;
    windowWidth: number;
    rows: number;
    columns: number;
    height: number;
    width: number;
    color: boolean;
    columnPixelSpacing: number;
    rowPixelSpacing: number;
    invert: boolean;
    sizeInBytes: number;
    data?: any;
  }

  interface Viewport {
    scale: number;
    translation: { x: number; y: number };
    voi: {
      windowWidth: number;
      windowCenter: number;
    };
    invert: boolean;
    pixelReplication: boolean;
    rotation: number;
    hflip: boolean;
    vflip: boolean;
  }

  function enable(element: HTMLElement): void;
  function disable(element: HTMLElement): void;
  function displayImage(element: HTMLElement, image: Image, viewport?: Viewport): void;
  function loadImage(imageId: string): Promise<Image>;
  function getViewport(element: HTMLElement): Viewport;
  function setViewport(element: HTMLElement, viewport: Viewport): void;
  function resize(element: HTMLElement): void;
  function reset(element: HTMLElement): void;
  function fitToWindow(element: HTMLElement): void;
  function updateImage(element: HTMLElement): void;
}

declare module 'cornerstone-web-image-loader' {
  interface Config {
    useWebWorkers?: boolean;
    decodeConfig?: {
      convertFloatPixelDataToInt?: boolean;
      use16BitDataType?: boolean;
    };
  }

  namespace external {
    let cornerstone: any;
    let dicomParser: any;
  }

  namespace wadouri {
    namespace fileManager {
      function add(file: File): string;
      function remove(imageId: string): void;
      function purge(): void;
    }
  }

  function configure(config: Config): void;
}

declare module 'cornerstone-tools' {
  function init(): void;
  function addTool(tool: any): void;
  function setToolActive(toolName: string, options?: any): void;
  function setToolPassive(toolName: string): void;
  function setToolEnabled(toolName: string): void;
  function setToolDisabled(toolName: string): void;
}

declare module 'cornerstone-math' {
  namespace point {
    function distance(point1: any, point2: any): number;
    function subtract(point1: any, point2: any): any;
  }
  
  namespace rect {
    function getCorners(rect: any): any[];
  }
}

// dicom-parser types are already provided by the library