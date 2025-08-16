export interface Annotation {
  id: string;
  sliceIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  description?: string;
  timestamp: Date;
  isSelected: boolean;
  isHovered: boolean;
}

export interface AnnotationCreate {
  sliceIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  description?: string;
}

export interface AnnotationUpdate {
  id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  label?: string;
  description?: string;
}

export enum AnnotationAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  SELECT = 'select',
  DESELECT = 'deselect'
}

export interface AnnotationEvent {
  action: AnnotationAction;
  annotation: Annotation;
  previousState?: Partial<Annotation>;
}

export interface AnnotationStats {
  totalCount: number;
  slicesWithAnnotations: number;
  averageAnnotationsPerSlice: number;
}