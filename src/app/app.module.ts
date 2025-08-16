import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Components
import { DicomViewerNewComponent } from './components/dicom-viewer-new/dicom-viewer-new.component';
import { AnnotationOverlayComponent } from './components/annotation-overlay/annotation-overlay.component';
import { FileLoaderComponent } from './components/file-loader/file-loader.component';
import { AnnotationSidebarComponent } from './components/annotation-sidebar/annotation-sidebar.component';
import { SliceNavigatorComponent } from './components/slice-navigator/slice-navigator.component';
import { AnnotationToolbarComponent } from './components/annotation-toolbar/annotation-toolbar.component';

// Services
import { DicomService } from './services/dicom.service';
import { AnnotationService } from './services/annotation.service';
import { ViewportService } from './services/viewport.service';
import { CornerstoneService } from './services/cornerstone.service';
import { ConfigService } from './services/config.service';

@NgModule({
  declarations: [
    AppComponent,
    DicomViewerNewComponent,
    AnnotationOverlayComponent,
    FileLoaderComponent,
    AnnotationSidebarComponent,
    SliceNavigatorComponent,
    AnnotationToolbarComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    CommonModule
  ],
  providers: [
    DicomService,
    AnnotationService,
    ViewportService,
    CornerstoneService,
    ConfigService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
