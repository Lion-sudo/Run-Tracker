import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { supabase } from '../supabaseClient';
import styles from './Heatmap.module.css';

// This sub-component handles the heat layer logic
const HeatLayer = ({ points }: { points: [number, number, number][] }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;

    let heatLayer: any = null;

    // Small timeout to allow container animations (like sidebars) to complete
    // and Leaflet to correctly calculate dimensions.
    const timeoutId = setTimeout(() => {
      map.invalidateSize();
      const size = map.getSize();
      
      // Only proceed if the container has a valid height/width
      if (size.x > 0 && size.y > 0) {
        // @ts-ignore - leaflet.heat adds heatLayer to L
        heatLayer = L.heatLayer(points, {
          radius: 10,
          blur: 8,
          maxZoom: 17,
          gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1: 'red' }
        }).addTo(map);

        // Fit bounds to points if they exist
        const bounds = L.latLngBounds(points.map(p => [p[0], p[1]]));
        map.fitBounds(bounds, { padding: [30, 30] });
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (heatLayer && map) {
        map.removeLayer(heatLayer);
      }
    };
  }, [map, points]);

  return null;
};

interface HeatmapProps {
  points?: [number, number, number][];
  showTitle?: boolean;
}

export default function Heatmap({ points, showTitle = true }: HeatmapProps) {
  const [heatPoints, setHeatPoints] = useState<[number, number, number][]>(points || []);
  const [loading, setLoading] = useState(!points);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (points) {
      setHeatPoints(points);
      setLoading(false);
      return;
    }

    const fetchAllRuns = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Please log in to see your heatmap.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('runs')
          .select('route_coordinates')
          .eq('user_id', user.id);

        if (error) throw error;

        const allCoords: [number, number, number][] = [];
        data?.forEach(run => {
          if (run.route_coordinates) {
            run.route_coordinates.forEach((coord: [number, number]) => {
              allCoords.push([coord[0], coord[1], 0.5]);
            });
          }
        });

        setHeatPoints(allCoords);
      } catch (err: any) {
        console.error("Error fetching coordinates for heatmap:", err);
        setError("Failed to load heatmap data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllRuns();
  }, [points]);

  if (loading) return <div className={styles.loading}>Generating your heatmap...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (heatPoints.length === 0) return <div className={styles.empty}>No runs found for this period.</div>;

  return (
    <div className={styles.container}>
      {showTitle && <h2 className={styles.title}>Your Running Heatmap</h2>}
      <div className={styles.mapWrapper}>
        <MapContainer
          center={[40.7128, -74.0060]}
          zoom={12}
          scrollWheelZoom={true}
          className={styles.mapContainer}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <HeatLayer points={heatPoints} />
        </MapContainer>
      </div>
    </div>
  );
}
