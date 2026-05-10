import React, { useRef } from 'react';
import { MapContainer, TileLayer, Polyline, useMap, Marker } from 'react-leaflet';
import L from 'leaflet';
import html2canvas from 'html2canvas';
import { useTheme } from '../context/ThemeContext';
import 'leaflet/dist/leaflet.css';
import './StoryModal.css';

// Custom icons - Adjusted for 720px card width
const createIcon = (color: string) => L.divIcon({
  html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
  className: 'story-icon'
});

const StartIcon = createIcon('#27ae60');
const FinishIcon = createIcon('#e74c3c');

interface Run {
  id: string;
  distance: number;
  calories: number;
  duration_seconds: number;
  run_date: string;
  route_coordinates: [number, number][];
}

interface StoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  run: Run | null;
}

const FitBounds = ({ coordinates }: { coordinates: [number, number][] }) => {
  const map = useMap();
  React.useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      // Minimal padding for the tightest possible focus
      map.fitBounds(bounds, { padding: [20, 20], animate: false });
    }
  }, [map, coordinates]);
  return null;
};

const StoryModal: React.FC<StoryModalProps> = ({ isOpen, onClose, run }) => {
  const storyRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [scale, setScale] = React.useState(0.5);

  React.useEffect(() => {
    const updateScale = () => {
      const availableWidth = window.innerWidth - 40;
      const availableHeight = window.innerHeight - 150;
      const scaleX = availableWidth / 720;
      const scaleY = availableHeight / 1280;
      setScale(Math.min(scaleX, scaleY, 0.5)); // Max scale is 0.5
    };
    
    if (isOpen) {
      updateScale();
      window.addEventListener('resize', updateScale);
      return () => window.removeEventListener('resize', updateScale);
    }
  }, [isOpen]);

  if (!isOpen || !run || run.route_coordinates.length === 0) return null;

  const startPoint = L.latLng(run.route_coordinates[0]);
  const endPoint = L.latLng(run.route_coordinates[run.route_coordinates.length - 1]);
  const routeColor = theme === 'light' ? '#3a8ffd' : '#35ec2f';
  
  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const handleDownload = async () => {
    if (!storyRef.current) return;
    
    try {
      // Small delay to ensure all assets are ready
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // PASS 1: Capture everything EXCEPT the route line and markers.
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
          
          // Hide SVG overlays (polyline) and markers
          const overlayPane = clonedDoc.querySelector('.leaflet-overlay-pane') as HTMLElement;
          if (overlayPane) overlayPane.style.visibility = 'hidden';
          const markerPane = clonedDoc.querySelector('.leaflet-marker-pane') as HTMLElement;
          if (markerPane) markerPane.style.visibility = 'hidden';
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

      // PASS 2: Capture ONLY the route line and markers with a transparent background
      const canvasPass2 = await html2canvas(storyRef.current, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: null, // Transparent!
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

      // Download
      const link = document.createElement('a');
      link.download = `run-story-${run.run_date}.png`;
      link.href = finalCanvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Failed to generate story image:", err);
      alert("Failed to generate image. Please try again.");
    }
  };

  const formatDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs > 0 ? hrs.toString().padStart(2, '0') : null,
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  const calculatePace = (distance: number, totalSeconds: number) => {
    if (!distance || !totalSeconds) return '0:00';
    const paceSecondsPerKm = totalSeconds / distance;
    const paceMins = Math.floor(paceSecondsPerKm / 60);
    const paceSecs = Math.round(paceSecondsPerKm % 60);
    return `${paceMins}:${paceSecs.toString().padStart(2, '0')}`;
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
              <span className="story-date">{new Date(run.run_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
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
                zoomSnap={0} // Allows fractional zoom for a much tighter fit
              >
                <TileLayer
                  attribution=""
                  url={tileUrl}
                />
                <Polyline positions={run.route_coordinates} color={routeColor} weight={7} opacity={0.9} />
                <Marker position={startPoint} icon={StartIcon} />
                <Marker position={endPoint} icon={FinishIcon} />
                <FitBounds coordinates={run.route_coordinates} />
              </MapContainer>
            </div>

            <div className="story-footer">
              <div className="story-stats">
                <div className="story-stat">
                  <span className="story-stat-value">{run.distance.toFixed(2)}</span>
                  <span className="story-stat-label">DISTANCE (KM)</span>
                </div>
                <div className="story-stat">
                  <span className="story-stat-value">{formatDuration(run.duration_seconds)}</span>
                  <span className="story-stat-label">DURATION</span>
                </div>
                <div className="story-stat">
                  <span className="story-stat-value">{calculatePace(run.distance, run.duration_seconds)}</span>
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
          <button className="download-button" onClick={handleDownload}>Download Story Image</button>
          <button className="cancel-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default StoryModal;
