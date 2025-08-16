import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

// Import Cornerstone libraries using require for better compatibility
declare const require: any;
const cornerstone = require('cornerstone-core');
const dicomParser = require('dicom-parser');

import { 
  DicomSeries, 
  DicomImage, 
  DicomMetadata, 
  DicomLoadResult, 
  DicomLoadState, 
  LoadingProgress 
} from '@models/dicom-metadata.model';
import { SAMPLE_DICOM_FILES, ERROR_MESSAGES } from '@shared/constants';

@Injectable({
  providedIn: 'root'
})
export class DicomService {
  private currentSeriesSubject = new BehaviorSubject<DicomSeries | null>(null);
  private loadingStateSubject = new BehaviorSubject<DicomLoadState>(DicomLoadState.IDLE);
  private loadingProgressSubject = new BehaviorSubject<LoadingProgress>({ loaded: 0, total: 0, percentage: 0 });

  public currentSeries$ = this.currentSeriesSubject.asObservable();
  public loadingState$ = this.loadingStateSubject.asObservable();
  public loadingProgress$ = this.loadingProgressSubject.asObservable();

  constructor() {}

  public async processFile(file: File): Promise<DicomSeries> {
    try {
      console.log('Processing DICOM file:', file.name, 'Size:', file.size);
      
      const arrayBuffer = await file.arrayBuffer();
      console.log('File read successfully, size:', arrayBuffer.byteLength);
      
      const byteArray = new Uint8Array(arrayBuffer);
      console.log('Converting to byte array, length:', byteArray.length);
      
      const dataSet = dicomParser.parseDicom(byteArray);
      console.log('DICOM parsed successfully');
      
      if (!this.isValidDicomFile(dataSet)) {
        throw new Error(ERROR_MESSAGES.INVALID_DICOM);
      }

      const metadata = this.extractMetadata(dataSet);
      console.log('Metadata extracted:', metadata);
      
      // Check if this is a multi-frame DICOM
      const numberOfFrames = dataSet.uint16('x00280008') || 1;
      console.log('Number of frames detected:', numberOfFrames);
      
      const images: DicomImage[] = [];
      
      if (numberOfFrames > 1) {
        // Multi-frame DICOM - create multiple images
        console.log('🔄 Processing multi-frame DICOM with', numberOfFrames, 'frames');
        
        for (let i = 0; i < numberOfFrames; i++) {
          const imageId = `wadouri:${URL.createObjectURL(file)}#${i}`;
          const dicomImage: DicomImage = {
            sopInstanceUID: metadata.sopInstanceUID,
            instanceNumber: metadata.instanceNumber + i,
            imageId,
            metadata: { ...metadata, frameIndex: i },
            isLoaded: false
          };
          images.push(dicomImage);
        }
      } else {
        // Single frame DICOM
        const imageId = 'wadouri:' + URL.createObjectURL(file);
        console.log('Image ID created:', imageId);
        
        const dicomImage: DicomImage = {
          sopInstanceUID: metadata.sopInstanceUID,
          instanceNumber: metadata.instanceNumber,
          imageId,
          metadata,
          isLoaded: false
        };
        images.push(dicomImage);
      }

      const series: DicomSeries = {
        seriesInstanceUID: metadata.seriesInstanceUID,
        studyInstanceUID: metadata.studyInstanceUID,
        seriesDescription: dataSet.string('x0008103e') || 'Unknown Series',
        modality: dataSet.string('x00080060') || 'CT',
        images: images,
        sliceCount: images.length
      };

      console.log('DICOM series created successfully:', series);
      console.log('Series contains', series.sliceCount, 'slices');
      return series;
    } catch (error) {
      console.error('Error processing DICOM file:', error);
      throw error;
    }
  }

  private isValidDicomFile(dataSet: any): boolean {
    try {
      // Check for required DICOM tags
      const studyUID = dataSet.string('x0020000d');
      const seriesUID = dataSet.string('x0020000e');
      const sopUID = dataSet.string('x00080018');
      
      console.log('DICOM validation - Study UID:', studyUID, 'Series UID:', seriesUID, 'SOP UID:', sopUID);
      
      return !!(studyUID && seriesUID && sopUID);
    } catch (error) {
      console.error('Error validating DICOM file:', error);
      return false;
    }
  }

  private extractMetadata(dataSet: any): DicomMetadata {
    return {
      studyInstanceUID: dataSet.string('x0020000d') || '',
      seriesInstanceUID: dataSet.string('x0020000e') || '',
      sopInstanceUID: dataSet.string('x00080018') || '',
      instanceNumber: dataSet.intString('x00200013') || 1,
      rows: dataSet.uint16('x00280010') || 512,
      columns: dataSet.uint16('x00280011') || 512,
      sliceThickness: dataSet.floatString('x00180050'),
      sliceLocation: dataSet.floatString('x00201041'),
      imagePosition: dataSet.string('x00200032')?.split('\\').map(Number),
      imageOrientation: dataSet.string('x00200037')?.split('\\').map(Number),
      pixelSpacing: dataSet.string('x00280030')?.split('\\').map(Number),
      windowWidth: dataSet.floatString('x00281051') || 400,
      windowCenter: dataSet.floatString('x00281050') || 40,
      rescaleIntercept: dataSet.floatString('x00281052') || 0,
      rescaleSlope: dataSet.floatString('x00281053') || 1
    };
  }

  private getErrorMessage(error: any): string {
    if (error?.message) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return ERROR_MESSAGES.LOAD_FAILED;
  }

  getSampleFiles(): typeof SAMPLE_DICOM_FILES {
    return SAMPLE_DICOM_FILES;
  }

  getCurrentSeries(): DicomSeries | null {
    return this.currentSeriesSubject.value;
  }

  clearCurrentSeries(): void {
    this.currentSeriesSubject.next(null);
    this.loadingStateSubject.next(DicomLoadState.IDLE);
    this.loadingProgressSubject.next({ loaded: 0, total: 0, percentage: 0 });
  }
}
