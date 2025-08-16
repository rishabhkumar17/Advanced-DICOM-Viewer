import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

import { 
  Annotation, 
  AnnotationCreate, 
  AnnotationUpdate, 
  AnnotationEvent, 
  AnnotationAction, 
  AnnotationStats 
} from '@models/annotation.model';
import { LOCAL_STORAGE_KEYS } from '@shared/constants';

@Injectable({
  providedIn: 'root'
})
export class AnnotationService {
  private annotationsSubject = new BehaviorSubject<Annotation[]>([]);
  private selectedAnnotationSubject = new BehaviorSubject<Annotation | null>(null);
  private annotationEventsSubject = new Subject<AnnotationEvent>();
  private currentSliceSubject = new BehaviorSubject<number>(0);

  public annotations$ = this.annotationsSubject.asObservable();
  public selectedAnnotation$ = this.selectedAnnotationSubject.asObservable();
  public annotationEvents$ = this.annotationEventsSubject.asObservable();
  public currentSlice$ = this.currentSliceSubject.asObservable();

  constructor() {
    this.loadAnnotationsFromStorage();
  }

  createAnnotation(annotationData: AnnotationCreate): Annotation {
    // 🎯 Use current slice if not explicitly provided
    const sliceIndex = annotationData.sliceIndex ?? this.currentSliceSubject.value;
    
    const annotation: Annotation = {
      id: this.generateId(),
      ...annotationData,
      sliceIndex: sliceIndex,
      timestamp: new Date(),
      isSelected: false,
      isHovered: false
    };
    


    const currentAnnotations = this.annotationsSubject.value;
    const updatedAnnotations = [...currentAnnotations, annotation];
    
    this.annotationsSubject.next(updatedAnnotations);
    this.saveAnnotationsToStorage();
    
    this.annotationEventsSubject.next({
      action: AnnotationAction.CREATE,
      annotation
    });

    return annotation;
  }

  updateAnnotation(update: AnnotationUpdate): boolean {
    const currentAnnotations = this.annotationsSubject.value;
    const annotationIndex = currentAnnotations.findIndex(a => a.id === update.id);
    
    if (annotationIndex === -1) {
      return false;
    }

    const originalAnnotation = currentAnnotations[annotationIndex];
    const updatedAnnotation: Annotation = {
      ...originalAnnotation,
      ...update,
      label: update.label !== undefined ? update.label : originalAnnotation.label, // Preserve existing label if not provided
      timestamp: new Date()
    };

    const updatedAnnotations = [...currentAnnotations];
    updatedAnnotations[annotationIndex] = updatedAnnotation;
    
    this.annotationsSubject.next(updatedAnnotations);
    this.saveAnnotationsToStorage();
    
    this.annotationEventsSubject.next({
      action: AnnotationAction.UPDATE,
      annotation: updatedAnnotation,
      previousState: originalAnnotation
    });

    // Update selected annotation if it's the one being updated
    if (this.selectedAnnotationSubject.value?.id === update.id) {
      this.selectedAnnotationSubject.next(updatedAnnotation);
    }

    return true;
  }

  deleteAnnotation(id: string): boolean {
    const currentAnnotations = this.annotationsSubject.value;
    const annotationToDelete = currentAnnotations.find(a => a.id === id);
    
    if (!annotationToDelete) {
      return false;
    }

    const updatedAnnotations = currentAnnotations.filter(a => a.id !== id);
    this.annotationsSubject.next(updatedAnnotations);
    this.saveAnnotationsToStorage();
    
    this.annotationEventsSubject.next({
      action: AnnotationAction.DELETE,
      annotation: annotationToDelete
    });

    // Clear selection if deleted annotation was selected
    if (this.selectedAnnotationSubject.value?.id === id) {
      this.selectedAnnotationSubject.next(null);
    }

    return true;
  }

  selectAnnotation(id: string | null): void {
    const currentAnnotations = this.annotationsSubject.value;
    
    // Deselect current annotation
    const currentSelected = this.selectedAnnotationSubject.value;
    if (currentSelected) {
      this.updateAnnotationState(currentSelected.id, { isSelected: false });
      this.annotationEventsSubject.next({
        action: AnnotationAction.DESELECT,
        annotation: currentSelected
      });
    }

    if (id) {
      const annotationToSelect = currentAnnotations.find(a => a.id === id);
      if (annotationToSelect) {
        this.updateAnnotationState(id, { isSelected: true });
        this.selectedAnnotationSubject.next({ ...annotationToSelect, isSelected: true });
        
        this.annotationEventsSubject.next({
          action: AnnotationAction.SELECT,
          annotation: { ...annotationToSelect, isSelected: true }
        });
      }
    } else {
      this.selectedAnnotationSubject.next(null);
    }
  }

  setAnnotationHover(id: string, isHovered: boolean): void {
    this.updateAnnotationState(id, { isHovered });
  }

  private updateAnnotationState(id: string, state: Partial<Annotation>): void {
    const currentAnnotations = this.annotationsSubject.value;
    const annotationIndex = currentAnnotations.findIndex(a => a.id === id);
    
    if (annotationIndex !== -1) {
      const updatedAnnotations = [...currentAnnotations];
      updatedAnnotations[annotationIndex] = {
        ...updatedAnnotations[annotationIndex],
        ...state
      };
      this.annotationsSubject.next(updatedAnnotations);
    }
  }

  getAnnotationsForSlice(sliceIndex: number): Observable<Annotation[]> {
    return this.annotations$.pipe(
      map(annotations => annotations.filter(a => a.sliceIndex === sliceIndex))
    );
  }

  getAllAnnotations(): Annotation[] {
    return this.annotationsSubject.value;
  }

  getAnnotationById(id: string): Annotation | undefined {
    return this.annotationsSubject.value.find(a => a.id === id);
  }

  getSelectedAnnotation(): Annotation | null {
    return this.selectedAnnotationSubject.value;
  }

  getAnnotationStats(): Observable<AnnotationStats> {
    return this.annotations$.pipe(
      map(annotations => {
        const slicesWithAnnotations = new Set(annotations.map(a => a.sliceIndex)).size;
        return {
          totalCount: annotations.length,
          slicesWithAnnotations,
          averageAnnotationsPerSlice: slicesWithAnnotations > 0 
            ? annotations.length / slicesWithAnnotations 
            : 0
        };
      })
    );
  }



  exportAnnotations(): string {
    const annotations = this.annotationsSubject.value;
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      annotations: annotations.map(a => ({
        ...a,
        timestamp: a.timestamp.toISOString()
      }))
    };
    return JSON.stringify(exportData, null, 2);
  }

  importAnnotations(jsonData: string): boolean {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.annotations || !Array.isArray(importData.annotations)) {
        throw new Error('Invalid annotation format');
      }

      const annotations: Annotation[] = importData.annotations.map((a: any) => ({
        ...a,
        timestamp: new Date(a.timestamp),
        isSelected: false,
        isHovered: false
      }));

      this.annotationsSubject.next(annotations);
      this.saveAnnotationsToStorage();
      this.selectedAnnotationSubject.next(null);
      
      return true;
    } catch (error) {
      console.error('Error importing annotations:', error);
      return false;
    }
  }

  clearAllAnnotations(): void {
    console.log('🗑️ Clearing all annotations across all slices');
    this.annotationsSubject.next([]);
    this.selectedAnnotationSubject.next(null);
    this.saveAnnotationsToStorage();
  }
  
  // 🎯 Enhanced method to clear only current slice annotations
  clearCurrentSliceAnnotations(): void {
    const currentSlice = this.currentSliceSubject.value;
    console.log('🗑️ Clearing annotations for current slice:', currentSlice);
    this.clearAnnotationsForSlice(currentSlice);
  }

  clearAnnotationsForSlice(sliceIndex: number): void {
    const currentAnnotations = this.annotationsSubject.value;
    const filteredAnnotations = currentAnnotations.filter(a => a.sliceIndex !== sliceIndex);
    
    this.annotationsSubject.next(filteredAnnotations);
    this.saveAnnotationsToStorage();
    
    // Clear selection if it was on this slice
    const selected = this.selectedAnnotationSubject.value;
    if (selected && selected.sliceIndex === sliceIndex) {
      this.selectedAnnotationSubject.next(null);
    }
  }

  // 🎯 Enhanced slice management methods
  setCurrentSlice(sliceIndex: number): void {
    if (this.currentSliceSubject.value !== sliceIndex) {
      this.currentSliceSubject.next(sliceIndex);
      // Clear selection when changing slices to avoid cross-slice selection
      this.selectAnnotation(null);
    }
  }
  
  getCurrentSlice(): number {
    return this.currentSliceSubject.value;
  }
  
  getCurrentSliceAnnotations(): Annotation[] {
    const currentSlice = this.currentSliceSubject.value;
    return this.annotationsSubject.value.filter(a => a.sliceIndex === currentSlice);
  }
  
  getSliceAnnotationCount(sliceIndex: number): number {
    return this.annotationsSubject.value.filter(a => a.sliceIndex === sliceIndex).length;
  }
  
  hasAnnotationsOnSlice(sliceIndex: number): boolean {
    return this.getSliceAnnotationCount(sliceIndex) > 0;
  }
  
  // 📊 Get comprehensive statistics per slice
  getSliceStats(): { [sliceIndex: number]: { count: number, hasSelected: boolean } } {
    const stats: { [sliceIndex: number]: { count: number, hasSelected: boolean } } = {};
    const selected = this.selectedAnnotationSubject.value;
    
    this.annotationsSubject.value.forEach(annotation => {
      const slice = annotation.sliceIndex;
      if (!stats[slice]) {
        stats[slice] = { count: 0, hasSelected: false };
      }
      stats[slice].count++;
      if (selected && selected.id === annotation.id) {
        stats[slice].hasSelected = true;
      }
    });
    
    return stats;
  }

  private generateId(): string {
    return `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveAnnotationsToStorage(): void {
    try {
      const annotations = this.annotationsSubject.value;
      const serializedData = annotations.map(a => ({
        ...a,
        timestamp: a.timestamp.toISOString()
      }));
      localStorage.setItem(LOCAL_STORAGE_KEYS.ANNOTATIONS, JSON.stringify(serializedData));
    } catch (error) {
      console.error('Error saving annotations to localStorage:', error);
    }
  }

  private loadAnnotationsFromStorage(): void {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEYS.ANNOTATIONS);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        const annotations: Annotation[] = parsedData.map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp),
          isSelected: false,
          isHovered: false
        }));
        this.annotationsSubject.next(annotations);
      }
    } catch (error) {
      console.error('Error loading annotations from localStorage:', error);
      this.annotationsSubject.next([]);
    }
  }
}