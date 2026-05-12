import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import styles from './Insights.module.css';
import Heatmap from './Heatmap';
import HeatmapStoryModal from './HeatmapStoryModal';

interface Run {
  id: string;
  distance: number;
  calories: number;
  duration_seconds: number;
  run_date: string;
  user_id: string;
  route_coordinates: [number, number][];
}

interface Stats {
  totalDistance: number;
  totalCalories: number;
  totalDuration: number;
  avgPace: string;
  count: number;
  heatPoints: [number, number, number][];
}

const emptyStats: Stats = {
  totalDistance: 0,
  totalCalories: 0,
  totalDuration: 0,
  avgPace: '0:00',
  count: 0,
  heatPoints: [],
};

type TimeRange = 'weekly' | 'monthly' | 'yearly' | 'allTime';

export default function Insights() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [selectedRange, setSelectedRange] = useState<TimeRange>('weekly');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [stats, setStats] = useState<{
    weekly: Stats;
    monthly: Stats;
    yearly: Stats;
    allTime: Stats;
  }>({
    weekly: emptyStats,
    monthly: emptyStats,
    yearly: emptyStats,
    allTime: emptyStats,
  });

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const calculateStats = (runsSubset: Run[]): Stats => {
    if (runsSubset.length === 0) return emptyStats;

    const totalDistance = runsSubset.reduce((sum, run) => sum + run.distance, 0);
    const totalCalories = runsSubset.reduce((sum, run) => sum + run.calories, 0);
    const totalDuration = runsSubset.reduce((sum, run) => sum + run.duration_seconds, 0);
    
    let avgPace = '0:00';
    if (totalDistance > 0) {
      const paceSecondsPerKm = totalDuration / totalDistance;
      const paceMins = Math.floor(paceSecondsPerKm / 60);
      const paceSecs = Math.round(paceSecondsPerKm % 60);
      avgPace = `${paceMins}:${paceSecs.toString().padStart(2, '0')}`;
    }

    const heatPoints: [number, number, number][] = [];
    runsSubset.forEach(run => {
      run.route_coordinates?.forEach(coord => {
        heatPoints.push([coord[0], coord[1], 0.5]);
      });
    });

    return {
      totalDistance,
      totalCalories,
      totalDuration,
      avgPace,
      count: runsSubset.length,
      heatPoints,
    };
  };

  const formatDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  useEffect(() => {
    const fetchRuns = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        setIsAuthenticated(true);
        const { data, error } = await supabase
          .from('runs')
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;
        
        const allRuns = data || [];
        setRuns(allRuns);

        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        setStats({
          weekly: calculateStats(allRuns.filter(run => new Date(run.run_date) >= oneWeekAgo)),
          monthly: calculateStats(allRuns.filter(run => new Date(run.run_date) >= startOfMonth)),
          yearly: calculateStats(allRuns.filter(run => new Date(run.run_date) >= startOfYear)),
          allTime: calculateStats(allRuns),
        });
      } catch (err) {
        console.error("Failed to fetch runs for insights:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRuns();
  }, []);

  if (loading) return <div className={styles.loading}>Calculating your insights...</div>;

  const currentStats = stats[selectedRange];

  return (
    <div className={styles.pageWrapper} onMouseMove={handleMouseMove}>
      <div className={styles.mouseFollower} style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }} />
      
      {/* Dynamic Insights Background */}
      <div className={styles.topoContainer}>
        <div className={`${styles.peak} ${styles.peak1}`}>
          <div className={`${styles.contourLine} ${styles.p1_l1}`} />
          <div className={`${styles.contourLine} ${styles.p1_l2}`} />
          <div className={`${styles.contourLine} ${styles.p1_l3}`} />
        </div>
        <div className={`${styles.peak} ${styles.peak2}`}>
          <div className={`${styles.contourLine} ${styles.p2_l1}`} />
          <div className={`${styles.contourLine} ${styles.p2_l2}`} />
        </div>
      </div>

      <div className={`${styles.container} ${!isAuthenticated ? styles.unauthContainer : ''}`}>
        <h2 className={styles.title}>Your Running Insights</h2>
        
        {!isAuthenticated ? (
          <div className={styles.emptyState}>
            <p>
              Please <span className={styles.loginLink} onClick={() => window.location.href = '/login'}>log in</span> to see your insights.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.rangeSelector}>
              {(['weekly', 'monthly', 'yearly', 'allTime'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  className={`${styles.rangeButton} ${selectedRange === range ? styles.activeRange : ''}`}
                  onClick={() => setSelectedRange(range)}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1).replace('Time', ' Time')}
                </button>
              ))}
            </div>

            <div className={styles.contentLayout}>
              <div className={styles.statGrid}>
                <div className={styles.statItem}>
                  <span className={styles.label}>Distance</span>
                  <span className={styles.value}>{currentStats.totalDistance.toFixed(2)} km</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.label}>Avg Pace</span>
                  <span className={styles.value}>{currentStats.avgPace} /km</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.label}>Duration</span>
                  <span className={styles.value}>{formatDuration(currentStats.totalDuration)}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.label}>Calories</span>
                  <span className={styles.value}>{currentStats.totalCalories} kcal</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.label}>Runs</span>
                  <span className={styles.value}>{currentStats.count}</span>
                </div>
                <button 
                  className={styles.storyButton}
                  onClick={() => {
                    if (currentStats.count > 0) {
                      setIsStoryModalOpen(true);
                    } else {
                      alert("Cannot create an image because there are no runs in the selected time range.");
                    }
                  }}
                >
                  Create Story
                </button>
              </div>

              <div className={styles.heatmapSection}>
                <h3 className={styles.heatmapTitle}>
                  {selectedRange.charAt(0).toUpperCase() + selectedRange.slice(1).replace('Time', ' Time')} Heatmap
                </h3>
                <div className={styles.mapContainerWrapper}>
                  <Heatmap points={currentStats.heatPoints} showTitle={false} />
                </div>
              </div>
            </div>
            
            <HeatmapStoryModal 
              isOpen={isStoryModalOpen}
              onClose={() => setIsStoryModalOpen(false)}
              points={currentStats.heatPoints}
              stats={currentStats}
              rangeName={selectedRange === 'allTime' ? 'All Time' : selectedRange.charAt(0).toUpperCase() + selectedRange.slice(1)}
            />
          </>
        )}
      </div>
    </div>
  );
}
