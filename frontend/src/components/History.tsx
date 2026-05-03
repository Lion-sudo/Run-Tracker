import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import styles from './History.module.css';

interface Run {
  id: string;
  distance: number;
  calories: number;
  duration_seconds: number;
  run_date: string;
  created_at: string;
}

export default function History() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

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

  useEffect(() => {
    const fetchRuns = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsAuthenticated(false);
          setRuns([]);
          return;
        }

        setIsAuthenticated(true);
        const { data, error } = await supabase
          .from('runs')
          .select('*')
          .eq('user_id', user.id)
          .order('run_date', { ascending: false });

        if (error) throw error;
        setRuns(data || []);
      } catch (err) {
        console.error("Failed to fetch runs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRuns();
  }, []);

  if (loading) return <div className={styles.loading}>Loading your history...</div>;

  if (!isAuthenticated) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.topoContainer}>
          <div className={`${styles.peak} ${styles.peak1}`}>
            <div className={`${styles.contourLine} ${styles.p1_l1}`} />
            <div className={`${styles.contourLine} ${styles.p1_l2}`} />
            <div className={`${styles.contourLine} ${styles.p1_l3}`} />
            <div className={`${styles.contourLine} ${styles.p1_l4}`} />
            <div className={`${styles.contourLine} ${styles.p1_l5}`} />
          </div>
          <div className={`${styles.peak} ${styles.peak2}`}>
            <div className={`${styles.contourLine} ${styles.p2_l1}`} />
            <div className={`${styles.contourLine} ${styles.p2_l2}`} />
            <div className={`${styles.contourLine} ${styles.p2_l3}`} />
            <div className={`${styles.contourLine} ${styles.p2_l4}`} />
          </div>
          <div className={`${styles.peak} ${styles.peak3}`}>
            <div className={`${styles.contourLine} ${styles.p3_l1}`} />
            <div className={`${styles.contourLine} ${styles.p3_l2}`} />
          </div>
          <div className={styles.activePath} />
        </div>
        
        <div className={styles.container}>
          <h2 className={styles.title}>My Running History</h2>
          <div className={styles.emptyState}>
            <p>Please log in to see your history.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      {/* Topographic Background Decorations */}
      <div className={styles.topoContainer}>
        {/* Peak 1 - Top Left */}
        <div className={`${styles.peak} ${styles.peak1}`}>
          <div className={`${styles.contourLine} ${styles.p1_l1}`} />
          <div className={`${styles.contourLine} ${styles.p1_l2}`} />
          <div className={`${styles.contourLine} ${styles.p1_l3}`} />
          <div className={`${styles.contourLine} ${styles.p1_l4}`} />
          <div className={`${styles.contourLine} ${styles.p1_l5}`} />
        </div>

        {/* Peak 2 - Bottom Right */}
        <div className={`${styles.peak} ${styles.peak2}`}>
          <div className={`${styles.contourLine} ${styles.p2_l1}`} />
          <div className={`${styles.contourLine} ${styles.p2_l2}`} />
          <div className={`${styles.contourLine} ${styles.p2_l3}`} />
          <div className={`${styles.contourLine} ${styles.p2_l4}`} />
        </div>

        {/* Peak 3 - Middle Right */}
        <div className={`${styles.peak} ${styles.peak3}`}>
          <div className={`${styles.contourLine} ${styles.p3_l1}`} />
          <div className={`${styles.contourLine} ${styles.p3_l2}`} />
        </div>

        {/* The dashed active trail */}
        <div className={styles.activePath} />
      </div>

      <div className={styles.container}>
        <h2 className={styles.title}>My Running History</h2>
        
        {runs.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No runs saved yet. Get out there and start planning!</p>
          </div>
        ) : (
          <div className={styles.runList}>
            {runs.map((run) => (
              <div key={run.id} className={styles.runCard}>
                <div className={styles.runInfo}>
                  <span className={styles.date}>{new Date(run.run_date).toLocaleDateString()}</span>
                  <span className={styles.distance}>
                    {run.distance.toFixed(2)} 
                    <small style={{fontSize: '0.6em', opacity: 0.6, marginLeft: '4px'}}>KM</small>
                  </span>
                  <span style={{fontSize: '0.85rem', color: '#7f8c8d', marginTop: '4px'}}>
                    Pace: <strong>{calculatePace(run.distance, run.duration_seconds)}</strong> min/km
                  </span>
                </div>
                <div className={styles.runDetails}>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{formatDuration(run.duration_seconds)}</span>
                    <span className={styles.statLabel}>Time</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{run.calories}</span>
                    <span className={styles.statLabel}>Kcal</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
