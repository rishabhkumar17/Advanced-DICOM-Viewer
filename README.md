# 🏥 Advanced DICOM Viewer with Medical Annotation System

A professional-grade Angular web application for viewing DICOM medical images with comprehensive annotation capabilities. Built for radiologists, medical professionals, and researchers to analyze, annotate, and manage medical imaging studies with precision and efficiency.

**Developed by:** Rishabh Kumar

## 🎯 Core Features

### 📊 DICOM Image Processing
- **Multi-Frame Support**: Handle single and multi-frame DICOM files (.dcm)
- **Automatic Slice Detection**: Parse Number of Frames tag (x00280008) for multi-slice navigation
- **Professional Rendering**: Cornerstone.js integration for medical-grade image display
- **Metadata Extraction**: Parse and display DICOM metadata (patient info, study details, etc.)

### 🖱️ Advanced Navigation System
- **Mouse Wheel Navigation**: Smooth slice scrolling with visual feedback
- **Touch Gesture Support**: Swipe navigation for mobile and tablet devices
- **Click-to-Slide Progress Bar**: Interactive slider for precise slice navigation
- **Keyboard Shortcuts**: Arrow keys and number keys for quick navigation
- **Navigation Buttons**: First, Previous, Next, Last slice controls

### 🎨 Professional Annotation System
- **Interactive Bounding Boxes**: Click and drag to create precise rectangular annotations
- **Real-time Editing**: Select, resize, and move annotations with Konva.js integration
- **Smart Labeling**: Automatic annotation ID generation with slice-specific numbering
- **Visual Feedback**: Hover effects, selection highlighting, and drag indicators
- **Cross-Slice Persistence**: Annotations maintained when navigating between slices

### 🎛️ Enhanced Viewport Controls
- **Zoom Controls**: Mouse wheel + Ctrl, zoom buttons, and pinch gestures
- **Pan Navigation**: Click and drag for image panning
- **Window/Level Adjustment**: Medical-grade brightness and contrast controls
- **Viewport Reset**: One-click reset to default view
- **Responsive Scaling**: Automatic image scaling for different screen sizes

## 🚀 Installation & Setup

### Prerequisites
- **Node.js**: Version 16.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Git**: For version control and cloning

### Quick Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/rishabhkumar17/angular-dicom-viewer.git
   cd angular-dicom-viewer
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

4. **Access the Application**
   Open your browser and navigate to `http://localhost:4200`

### Production Build

1. **Build for Production**
   ```bash
   npm run build
   ```

2. **Serve Production Build**
   ```bash
   npm run serve:prod
   ```

3. **Deploy to Web Server**
   Copy the contents of `dist/angular-dicom-viewer` to your web server

## 📖 Usage Guide

### Loading DICOM Files

#### Single File Upload
1. **Drag & Drop**: Drag .dcm files directly into the upload area
2. **File Browser**: Click "Browse Files" to select from your file system
3. **Auto-Detection**: The system automatically detects single vs multi-frame DICOM files

#### Multi-Slice Navigation
- **Mouse Wheel**: Scroll over the image to navigate between slices
- **Touch Gestures**: Swipe up/down on mobile devices
- **Progress Bar**: Click or drag the slider for precise navigation
- **Navigation Buttons**: Use First/Previous/Next/Last buttons

### Creating Annotations

#### Drawing Mode
1. **Activate Tool**: Click the "Bounding Box" tool in the left toolbar
2. **Draw Annotations**: Click and drag on the image to create rectangles
3. **Visual Feedback**: Real-time preview during drawing
4. **Auto-Labeling**: Annotations receive automatic IDs (e.g., "1-7354")

#### Editing Annotations
1. **Select Annotations**: Click on any annotation to select it
2. **Resize**: Drag the corner handles to resize selected annotations
3. **Move**: Drag the center of selected annotations to move them
4. **Delete**: Use the trash icon or press Delete key to remove annotations

#### Annotation Management
- **Sidebar Display**: All annotations are listed in the right sidebar
- **Slice Filtering**: View annotations specific to each slice
- **Statistics**: Track total annotations and slice distribution
- **Export**: Save annotations as JSON for external analysis

### Viewport Controls

#### Navigation Tools
- **Pan**: Middle mouse button or click and drag
- **Zoom**: Mouse wheel + Ctrl or zoom buttons
- **Window/Level**: Adjust image brightness and contrast
- **Reset**: Return to default view settings

#### Keyboard Shortcuts
- **Arrow Keys**: Navigate between slices
- **Number Keys**: Jump to specific slice numbers
- **Space**: Toggle annotation mode
- **Delete**: Remove selected annotations
- **Escape**: Cancel current operation

## 🏗️ Technical Architecture

### Frontend Framework
- **Angular 16**: Modern component-based architecture
- **TypeScript**: Full type safety and modern development practices
- **RxJS**: Reactive programming for state management
- **SCSS**: Advanced styling with CSS custom properties

### Medical Imaging Libraries
- **Cornerstone.js**: Professional medical image rendering
- **Cornerstone Tools**: Medical-grade viewport controls
- **DICOM Parser**: JavaScript DICOM file parsing
- **Konva.js**: Interactive 2D canvas for annotations

### State Management
- **Viewport Service**: Centralized viewport state management
- **Annotation Service**: Annotation data and persistence
- **DICOM Service**: File processing and metadata extraction
- **Local Storage**: Persistent settings and annotation data

### UI/UX Features
- **Dark Theme**: Medical-grade dark interface for reduced eye strain
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Accessibility**: WCAG 2.1 AA compliant with screen reader support
- **Touch Support**: Full touch gesture support for mobile devices

## 🔧 Development

### Project Structure
```
src/
├── app/
│   ├── components/
│   │   ├── annotation-overlay/     # Konva.js annotation system
│   │   ├── annotation-sidebar/     # Annotation management UI
│   │   ├── annotation-toolbar/     # Tool selection interface
│   │   ├── dicom-viewer-new/       # Main DICOM viewer component
│   │   ├── file-loader/            # File upload interface
│   │   └── slice-navigator/        # Slice navigation controls
│   ├── models/                     # TypeScript interfaces
│   ├── services/                   # Business logic services
│   └── shared/                     # Shared utilities and constants
```

### Key Components

#### Annotation System
- **Interactive Drawing**: Real-time bounding box creation
- **Selection & Editing**: Click-to-select with resize handles
- **Cross-Slice Persistence**: Annotations maintained across navigation
- **Visual Feedback**: Hover effects and selection highlighting

#### Navigation System
- **Multi-Input Support**: Mouse wheel, touch, keyboard, and buttons
- **Progress Tracking**: Visual progress bar with click-to-navigate
- **Slice Statistics**: Display annotation counts per slice
- **Responsive Controls**: Adaptive UI for different screen sizes

#### File Processing
- **Multi-Frame Detection**: Automatic parsing of Number of Frames tag
- **Metadata Extraction**: Patient info, study details, and image properties
- **Error Handling**: Graceful handling of corrupted or invalid files
- **Performance Optimization**: Efficient loading of large datasets

### Development Commands

```bash
# Development server
npm start

# Production build
npm run build

# Unit tests
npm test

# E2E tests
npm run e2e

# Linting
npm run lint

# Code formatting
npm run format
```

## 🧪 Testing

### Unit Tests
- **Component Testing**: Angular TestBed for component isolation
- **Service Testing**: Mock services for business logic testing
- **Utility Testing**: Pure function testing for helper methods

### Integration Tests
- **File Upload**: Test DICOM file loading and processing
- **Annotation System**: Test drawing, editing, and persistence
- **Navigation**: Test slice navigation and viewport controls

### E2E Tests
- **User Workflows**: Complete user journey testing
- **Cross-Browser**: Testing across different browsers
- **Mobile Testing**: Touch gesture and responsive design testing

## 🚀 Deployment

### Production Build
```bash
# Create optimized production build
npm run build

# Build output in dist/angular-dicom-viewer/
```

### Docker Deployment
```dockerfile
# Dockerfile example
FROM nginx:alpine
COPY dist/angular-dicom-viewer /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Cloud Deployment
- **AWS S3 + CloudFront**: Static website hosting
- **Azure Blob Storage**: CDN-enabled file hosting
- **Google Cloud Storage**: Global content delivery
- **Vercel/Netlify**: Git-based deployment

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Automatic code formatting
- **Angular Style Guide**: Official Angular coding standards

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Rishabh Kumar**: Lead developer and architect of this DICOM viewer
- **Cornerstone.js Team**: For the excellent medical imaging library
- **DICOM Standards Committee**: For the DICOM file format specification
- **Angular Team**: For the robust frontend framework
- **Medical Imaging Community**: For feedback and testing

## 📞 Support

For questions, issues, or feature requests:
- **GitHub Issues**: [Create an issue](https://github.com/rishabhkumar17/angular-dicom-viewer/issues)
- **Documentation**: Check the [Wiki](https://github.com/rishabhkumar17/angular-dicom-viewer/wiki)
- **Discussions**: Join our [GitHub Discussions](https://github.com/rishabhkumar17/angular-dicom-viewer/discussions)

---

**Built with ❤️ by Rishabh Kumar for the medical imaging community**