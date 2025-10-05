# NASA Space Apps Challenge - Lost Frequencies 🏆

A web-based geospatial visualization tool built with React and Leaflet for displaying and analyzing GeoTIFF and GeoJSON layers. This application was developed for the NASA Space Apps Challenge to visualize environmental data including satellite imagery, agricultural parcels, and water quality indicators.

**🎉 Local Winner Project - NASA Space Apps Challenge 2025**

## 🚀 Features

- **Interactive Map Viewer**: Powered by Leaflet with OpenStreetMap tiles
- **Multi-layer Support**: 
  - GeoTIFF raster layers (satellite data, environmental indicators)
  - GeoJSON vector layers (agricultural parcels, administrative boundaries)
  - Custom tile layers
- **Layer Control Panel**: Toggle visibility and manage multiple data layers
- **Dynamic Legend**: Color-coded legends for each active layer
- **Responsive Popups**: Click on features to view detailed information
- **Performance Optimized**: Handles large datasets efficiently with lazy loading

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0 or higher) or **yarn**

## 🛠️ Installation

1. **Clone the repository** (or navigate to the project directory):
   ```bash
   cd visor-nasa
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

   This will install all required packages including:
   - React 19
   - Leaflet (mapping library)
   - Vite (build tool)
   - TailwindCSS (styling)
   - ESLint (code linting)

## 🎯 Running the Application

### Development Mode

Start the development server with hot-reload:

```bash
npm run dev
```

The application will be available at `http://localhost:5173/` (or another port if 5173 is busy).

### Production Build

Build the application for production:

```bash
npm run build
```

The optimized production files will be generated in the `dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

### Linting

Run ESLint to check code quality:

```bash
npm run lint
```

## 📁 Project Architecture

### Directory Structure

```
visor-nasa/
├── public/                      # Static assets
│   ├── capas/                   # Data layers directory
│   │   ├── *.tif               # GeoTIFF raster files
│   │   └── *.geojson           # GeoJSON vector files
│   └── *.webp                   # Logo and images
├── src/
│   ├── components/              # React components
│   │   ├── Map/                 # Main map component
│   │   │   └── Map.jsx
│   │   ├── Viewer/              # Main viewer container
│   │   │   └── Viewer.jsx
│   │   ├── Layers/              # Layer rendering components
│   │   │   ├── GeoTIFFLayer.jsx # Renders GeoTIFF files
│   │   │   ├── GeoJSONLayer.jsx # Renders GeoJSON files
│   │   │   ├── TilesLayer.jsx   # Base tile layer
│   │   │   └── index.js
│   │   ├── LayerControl/        # Layer management UI
│   │   │   ├── LayerControl.jsx
│   │   │   └── LayerControl.css
│   │   └── Legend/              # Dynamic legend display
│   │       ├── Legend.jsx
│   │       └── Legend.css
│   ├── hooks/                   # Custom React hooks
│   │   ├── useMap.js            # Map initialization logic
│   │   ├── useLayerControl.js   # Layer state management
│   │   └── useGeoJSONLayer.js   # GeoJSON loading logic
│   ├── utils/                   # Utility functions
│   │   ├── geojsonUtils.js      # GeoJSON processing
│   │   └── popupUtils.js        # Popup content generation
│   ├── constants/               # Configuration constants
│   │   └── mapConfig.js         # Map settings and styles
│   ├── App.jsx                  # Root component
│   └── main.jsx                 # Application entry point
├── index.html                   # HTML template
├── package.json                 # Dependencies and scripts
├── vite.config.js              # Vite configuration
└── eslint.config.js            # ESLint configuration
```

### Architecture Overview

#### 1. **Component Layer**
- **App.jsx**: Root component that renders the Viewer
- **Viewer.jsx**: Main container managing layers and controls
- **Map.jsx**: Leaflet map initialization and management
- **Layer Components**: Specialized components for different data types
- **LayerControl**: UI for toggling layer visibility
- **Legend**: Dynamic legend based on active layers

#### 2. **Hooks Layer**
Custom React hooks for state management and side effects:
- `useMap`: Initializes and manages Leaflet map instance
- `useLayerControl`: Manages layer visibility and state
- `useGeoJSONLayer`: Handles GeoJSON data loading and rendering

#### 3. **Utils Layer**
Helper functions for:
- GeoJSON data processing and optimization
- Popup content generation and formatting
- Performance optimization utilities

#### 4. **Constants Layer**
Configuration files containing:
- Map center, zoom levels, and bounds
- Style definitions for GeoJSON features
- Performance thresholds
- Popup configurations

## 📊 Adding New Layers

### Where to Place Your Data Files

All data layers should be placed in the **`public/capas/`** directory:

```
public/
└── capas/
    ├── your-geotiff-file.tif    # GeoTIFF raster files
    └── your-geojson-file.geojson # GeoJSON vector files
```

### Adding a GeoTIFF Layer

1. Place your `.tif` file in `public/capas/`
2. Add the layer configuration in `src/components/Viewer/Viewer.jsx`:

```javascript
{
  id: 'unique-layer-id',
  name: 'Display Name',
  description: 'Brief description of the layer',
  type: 'GeoTIFF',
  icon: '🛰️',
  url: '/capas/your-geotiff-file.tif',
  visible: false,
  options: {
    opacity: 0.8,
    min: -10,        // Minimum data value
    max: 10,         // Maximum data value
    palette: ['FF0000', 'FFFF00', '00FF00']  // RGB color palette
  }
}
```

### Adding a GeoJSON Layer

1. Place your `.geojson` file in `public/capas/`
2. Add the layer configuration in `src/components/Viewer/Viewer.jsx`:

```javascript
{
  id: 'unique-layer-id',
  name: 'Display Name',
  description: 'Brief description of the layer',
  type: 'GeoJSON',
  icon: '🌍',
  url: '/capas/your-geojson-file.geojson',
  visible: false,
  style: {
    color: '#2b6cb0',      // Stroke color
    weight: 2,              // Stroke width
    fillColor: '#90cdf4',   // Fill color
    fillOpacity: 0.35       // Fill opacity
  }
}
```

## 🎨 Basic Functionality

### Layer Control
- **Toggle Layers**: Click the layer icon to show/hide individual layers
- **Layer Information**: Hover over layers to see descriptions
- **Multiple Layers**: Multiple layers can be active simultaneously

### Map Interaction
- **Pan**: Click and drag to move around the map
- **Zoom**: Use mouse wheel, +/- buttons, or double-click to zoom
- **Feature Info**: Click on GeoJSON features to see popup with properties

### Legend
- Automatically displays color scales for active GeoTIFF layers
- Shows the data range (min/max values) for each layer
- Updates dynamically when layers are toggled

### Performance Features
- **Lazy Loading**: Large datasets load only when zoomed in
- **Canvas Rendering**: Efficient rendering of GeoJSON with many features
- **Optimized Popups**: Truncated text for better performance

## 🔧 Configuration

### Map Settings

Edit `src/constants/mapConfig.js` to change:
- Default center coordinates
- Initial zoom level
- Maximum zoom level
- Base tile layer URL
- Performance thresholds

### Styling

- **Global Styles**: Edit `src/index.css` and `src/App.css`
- **Component Styles**: Each component has its own CSS file
- **TailwindCSS**: Utility classes available throughout the project

## 🌐 Technologies Used

- **React 19**: UI framework
- **Leaflet 1.9.4**: Interactive map library
- **Vite 7**: Build tool and dev server
- **TailwindCSS 4**: Utility-first CSS framework
- **ESLint**: Code quality and consistency

## 📝 Notes

- GeoTIFF files are rendered client-side using canvas
- Large GeoJSON files are automatically optimized for performance
- The application uses OpenStreetMap tiles by default (free and open-source)
- All coordinates are in WGS84 (EPSG:4326) coordinate system

## 🤝 Contributing

1. Make your changes in a feature branch
2. Ensure code passes linting: `npm run lint`
3. Test in development mode: `npm run dev`
4. Build for production: `npm run build`
5. Submit your changes

## 📄 License

This project was created for the NASA Space Apps Challenge 2025.

---


