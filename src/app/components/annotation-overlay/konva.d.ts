// Basic Konva type declarations
declare module 'konva' {
  export default class Konva {
    static Stage: new (config: any) => any;
    static Layer: new () => any;
    static Rect: new (config: any) => any;
    static Circle: new (config: any) => any;
    static Group: new (config?: any) => any;
  }
}

declare const Konva: {
  Stage: new (config: {
    container: HTMLElement;
    width: number;
    height: number;
  }) => {
    add: (layer: any) => void;
    on: (event: string, callback: (e: any) => void) => void;
    getPointerPosition: () => { x: number; y: number } | null;
    container: () => HTMLElement;
    width: (width?: number) => number;
    height: (height?: number) => number;
    destroy: () => void;
    batchDraw: () => void;
    draw: () => void;
  };
  
  Layer: new () => {
    add: (shape: any) => void;
    draw: () => void;
    batchDraw: () => void;
  };
  
  Rect: new (config: {
    x: number;
    y: number;
    width: number;
    height: number;
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    dash?: number[];
    shadowColor?: string;
    shadowBlur?: number;
    shadowOpacity?: number;
  }) => {
    x: (x?: number) => number;
    y: (y?: number) => number;
    width: (width?: number) => number;
    height: (height?: number) => number;
    stroke: (stroke?: string) => string;
    strokeWidth: (width?: number) => number;
    fill: (fill?: string) => string;
    dash: (dash?: number[]) => number[];
    shadowColor: (color?: string) => string;
    shadowBlur: (blur?: number) => number;
    shadowOpacity: (opacity?: number) => number;
  };
  
  Circle: new (config: {
    x: number;
    y: number;
    radius: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    draggable?: boolean;
    name?: string;
  }) => {
    x: (x?: number) => number;
    y: (y?: number) => number;
    position: () => { x: number; y: number };
    on: (event: string, callback: () => void) => void;
  };
  
  Group: new (config?: {
    draggable?: boolean;
  }) => {
    add: (shape: any) => void;
    on: (event: string, callback: (e: any) => void) => void;
    setAttr: (name: string, value: any) => void;
    getAttr: (name: string) => any;
    draggable: (draggable?: boolean) => boolean;
    findOne: (selector: string) => any;
    find: (selector: string) => any[];
    moveToTop: () => void;
    destroy: () => void;
  };
};