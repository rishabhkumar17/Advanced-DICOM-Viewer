import { Component, EventEmitter, Output, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Subject } from 'rxjs';
import { DicomLoadState } from '@models/dicom-metadata.model';

@Component({
  selector: 'app-file-loader',
  templateUrl: './file-loader.component.html',
  styleUrls: ['./file-loader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileLoaderComponent implements OnDestroy {
  @Output() fileLoaded = new EventEmitter<File>();
  @Output() loadingStateChanged = new EventEmitter<DicomLoadState>();

  isDragOver = false;
  isLoading = false;
  loadingProgress = 0;
  loadingMessage = '';
  errorMessage = '';

  private destroy$ = new Subject<void>();

  constructor() {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFiles(files);
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFiles(input.files);
    }
  }

  loadSampleFile(url: string, name: string): void {
    this.errorMessage = '';
    console.log('Loading sample DICOM file from URL:', url);
    this.loadingStateChanged.emit(DicomLoadState.LOADING);
    fetch(url)
        .then(response => response.blob())
        .then(blob => {
            const file = new File([blob], name, {type: 'application/dicom'});
            this.fileLoaded.emit(file);
            this.loadingStateChanged.emit(DicomLoadState.LOADED);
        })
        .catch(error => {
            console.error('Error loading sample file:', error);
            this.errorMessage = `Failed to load sample file: ${name}. CORS or network issue.`;
            this.loadingStateChanged.emit(DicomLoadState.ERROR);
        });
  }

  private handleFiles(files: FileList): void {
    this.errorMessage = '';
    console.log('Handling files:', files.length);
    
    // Convert FileList to Array
    const fileArray = Array.from(files);
    
    // Filter for DICOM files
    const dicomFiles = fileArray.filter(file => 
      file.name.toLowerCase().endsWith('.dcm') || 
      file.type === 'application/dicom' ||
      file.type === 'application/octet-stream' ||
      file.type === '' // Some browsers don't set MIME type for .dcm files
    );

    console.log('DICOM files found:', dicomFiles.length);

    if (dicomFiles.length === 0) {
      this.errorMessage = 'Please select valid DICOM files (.dcm extension)';
      return;
    }

    if (dicomFiles.length === 1) {
      this.loadSingleFile(dicomFiles[0]);
    } else {
      this.loadMultipleFiles(dicomFiles);
    }
  }

  private loadSingleFile(file: File): void {
    console.log('🎯 FileLoader: Loading single DICOM file:', file.name, 'Size:', file.size, 'Type:', file.type);
    this.fileLoaded.emit(file);
  }

  private loadMultipleFiles(files: File[]): void {
    console.log('🎯 FileLoader: Loading multiple DICOM files:', files.length);
    
    // For now, just load the first file
    // TODO: Implement proper multi-file series loading
    console.log('⚠️ Multi-file loading not yet implemented, loading first file only');
    this.loadSingleFile(files[0]);
  }

  clearError(): void {
    this.errorMessage = '';
  }

  private isValidDicomFile(file: File): boolean {
    const validExtensions = ['.dcm', '.dicom'];
    const validMimeTypes = ['application/dicom', 'application/octet-stream'];
    
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    
    const hasValidMimeType = validMimeTypes.includes(file.type);
    
    return hasValidExtension || hasValidMimeType || file.type === '';
  }
}
