import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import html2canvas from 'html2canvas';
import { useTheme } from '../context/ThemeContext';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import './HeatmapStoryModal.css';

interface HeatmapStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  points: [number, number, number][];
  stats: {
    totalDistance: number;
    totalCalories: number;
    totalDuration: number;
    avgPace: string;
    count: number;
  };
  rangeName: string;
}

const FitBounds = ({ points }: { points: [number, number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const lats = points.map(p => p[0]);
      const lngs = points.map(p => p[1]);
      const bounds = L.latLngBounds(
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)]
      );
      map.fitBounds(bounds, { padding: [20, 20], animate: false });
    }
  }, [map, points]);
  return null;
};

const HeatLayer = ({ points }: { points: [number, number, number][] }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;

    // @ts-ignore
    const heatLayer = L.heatLayer(points, {
      radius: 15,
      blur: 12,
      maxZoom: 17,
      gradient: { 0.4: '#007bff', 0.6: '#00d4ff', 0.7: '#00ffcc', 0.8: '#fffb00', 1: '#ff0000' }
    }).addTo(map);

    // Add a specific class to identify the heatmap layer
    const container = (heatLayer as any)._container || (heatLayer as any).getContainer?.();
    if (container) {
      container.classList.add('leaflet-heatmap-layer');
    }

    return () => {
      if (heatLayer && map) {
        map.removeLayer(heatLayer);
      }
    };
  }, [map, points]);

  return null;
};

const HeatmapStoryModal: React.FC<HeatmapStoryModalProps> = ({ isOpen, onClose, points, stats, rangeName }) => {
  const storyRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const updateScale = () => {
      const availableWidth = window.innerWidth - 40;
      const availableHeight = window.innerHeight - 150;
      const scaleX = availableWidth / 720;
      const scaleY = availableHeight / 1280;
      setScale(Math.min(scaleX, scaleY, 0.5));
    };
    
    if (isOpen) {
      updateScale();
      window.addEventListener('resize', updateScale);
      return () => window.removeEventListener('resize', updateScale);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const handleDownload = async () => {
    if (!storyRef.current) return;
    
    try {
      // Increased delay to ensure everything is ready
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // PASS 1: Capture background (header, map tiles, footer) - Hide heatmap
      const canvasPass1 = await html2canvas(storyRef.current, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
        scale: 2,
        logging: false,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          const element = clonedDoc.querySelector('.story-card') as HTMLElement;
          if (element) element.style.transform = 'none';
          
          // Hide Heatmap layer specifically
          const heatmapLayer = clonedDoc.querySelector('.leaflet-heatmap-layer') as HTMLElement;
          if (heatmapLayer) heatmapLayer.style.visibility = 'hidden';
          
          // Fallback hide overlay pane
          const overlayPane = clonedDoc.querySelector('.leaflet-overlay-pane') as HTMLElement;
          if (overlayPane) overlayPane.style.visibility = 'hidden';
        }
      });

      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = canvasPass1.width;
      finalCanvas.height = canvasPass1.height;
      const ctxFinal = finalCanvas.getContext('2d')!;

      // Apply the Leaflet CSS inversion trick manually to the map region of the canvas
      if (theme === 'dark') {
        const mapEl = storyRef.current.querySelector('.story-map-container') as HTMLElement;
        const scale = 2; // match html2canvas scale
        const mapY = mapEl.offsetTop * scale;
        const mapH = mapEl.offsetHeight * scale;

        // Draw header normally
        ctxFinal.drawImage(canvasPass1, 0, 0, canvasPass1.width, mapY, 0, 0, canvasPass1.width, mapY);
        
        // Draw map with filter
        ctxFinal.save();
        ctxFinal.filter = 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)';
        ctxFinal.drawImage(canvasPass1, 0, mapY, canvasPass1.width, mapH, 0, mapY, canvasPass1.width, mapH);
        ctxFinal.restore();

        // Draw footer normally
        const footerY = mapY + mapH;
        const footerH = canvasPass1.height - footerY;
        ctxFinal.drawImage(canvasPass1, 0, footerY, canvasPass1.width, footerH, 0, footerY, canvasPass1.width, footerH);
      } else {
        ctxFinal.drawImage(canvasPass1, 0, 0);
      }

      // PASS 2: Capture Heatmap only (Transparent background)
      const canvasPass2 = await html2canvas(storyRef.current, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        scale: 2,
        logging: false,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          const element = clonedDoc.querySelector('.story-card') as HTMLElement;
          if (element) {
            element.style.transform = 'none';
            element.style.background = 'transparent';
          }
          
          // Hide header, footer, and base map tiles
          const header = clonedDoc.querySelector('.story-header') as HTMLElement;
          if (header) header.style.visibility = 'hidden';
          const footer = clonedDoc.querySelector('.story-footer') as HTMLElement;
          if (footer) footer.style.visibility = 'hidden';
          const tilePane = clonedDoc.querySelector('.leaflet-tile-pane') as HTMLElement;
          if (tilePane) tilePane.style.visibility = 'hidden';
          
          // Make map container backgrounds transparent
          const mapContainer = clonedDoc.querySelector('.story-map-container') as HTMLElement;
          if (mapContainer) mapContainer.style.background = 'transparent';
          const map = clonedDoc.querySelector('.story-map') as HTMLElement;
          if (map) map.style.background = 'transparent';
        }
      });

      // Composite Pass 2 over Pass 1
      ctxFinal.drawImage(canvasPass2, 0, 0);
      
      const link = document.createElement('a');
      link.download = `heatmap-story-${rangeName}.png`;
      link.href = finalCanvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Failed to generate heatmap story image:", err);
      alert("Failed to generate image. Please try again.");
    }
  };

  return (
    <div className="story-overlay" onClick={onClose}>
      <div className="story-modal" onClick={e => e.stopPropagation()}>
        <div 
          className="story-preview-container"
          style={{ width: 720 * scale, height: 1280 * scale, position: 'relative', display: 'block' }}
        >
          <div 
            ref={storyRef} 
            className="story-card"
            style={{ transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}
          >
            <div className="story-header">
              <span className="story-app-name">RUN TRACKER</span>
              <span className="story-date">{rangeName.toUpperCase()} HEATMAP</span>
            </div>
            
            <div className="story-map-container">
              <MapContainer 
                className="story-map" 
                zoomControl={false} 
                dragging={false} 
                touchZoom={false} 
                doubleClickZoom={false} 
                scrollWheelZoom={false}
                preferCanvas={true}
                zoomSnap={0}
              >
                <TileLayer
                  attribution=""
                  url={tileUrl}
                />
                <HeatLayer points={points} />
                <FitBounds points={points} />
              </MapContainer>
            </div>

            <div className="story-footer">
              <div className="story-stats">
                <div className="story-stat">
                  <span className="story-stat-value">{stats.totalDistance.toFixed(2)}</span>
                  <span className="story-stat-label">TOTAL DISTANCE (KM)</span>
                </div>
                <div className="story-stat">
                  <span className="story-stat-value">{stats.count}</span>
                  <span className="story-stat-label">TOTAL RUNS</span>
                </div>
                <div className="story-stat">
                  <span className="story-stat-value">{stats.avgPace}</span>
                  <span className="story-stat-label">AVG PACE (/KM)</span>
                </div>
              </div>
              <div className="story-brand">
                <div className="brand-dot"></div>
                <span>Captured with Run Tracker</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="story-actions">
          <button className="download-button" onClick={handleDownload}>Download Heatmap Story</button>
          <button className="cancel-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default HeatmapStoryModal;
