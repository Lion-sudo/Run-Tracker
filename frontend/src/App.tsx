import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';
import Map from './components/Map';
import Auth from './components/Auth';
import History from './components/History';
import styles from './App.module.css';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(0);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [duration, setDuration] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleRouteUpdate = useCallback((newDistance: number, newRoute: [number, number][]) => {
    setDistance(newDistance);
    setCalories(Math.round(newDistance * 62));
    setRouteCoords(newRoute);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    // Force a full page reload to clear all local state (like map pins) 
    // and reset the app to a clean guest state.
    window.location.href = '/map';
  };

  const handleSaveRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      alert("Please log in to save your runs!");
      navigate('/login');
      setShowSaveModal(false);
      return;
    }
    
    if (!distance || isSaving) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('runs')
        .insert([
          {
            distance: distance,
            calories: calories,
            duration_minutes: parseInt(duration),
            route_coordinates: routeCoords,
            user_id: session.user.id
          }
        ]);

      if (!error) {
        alert("Run saved successfully!");
        setShowSaveModal(false);
        setDuration('');
        setDistance(0);
        setCalories(0);
        setRouteCoords([]);
        navigate('/runs');
      } else {
        alert(`Error saving run: ${error.message}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to Supabase.");
    } finally {
      setIsSaving(false);
    }
  };

  const isMapPage = location.pathname === '/map' || location.pathname === '/';

  return (
    <div className={styles.appContainer}>
      {/* Header Area */}
      <header className={styles.header}>
        <div className={styles.headerNav}>
          <Link to="/" className={styles.logo}>Run Tracker</Link>
          <div className={styles.navLinks}>
            <Link to="/map" className={styles.navLink}>Map</Link>
            <Link to="/runs" className={styles.navLink}>My History</Link>
            {session ? (
              <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
            ) : (
              <Link to="/login" className={styles.navLink}>Log In</Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Routing Area */}
      <main className={styles.mainContent}>
        <Routes>
          <Route path="/" element={<Navigate to="/map" replace />} />
          <Route path="/map" element={<Map onRouteUpdate={handleRouteUpdate} />} />
          <Route path="/runs" element={<History />} />
          <Route path="/login" element={session ? <Navigate to="/map" replace /> : <Auth />} />
          {/* Catch-all route to redirect undefined paths back to the map */}
          <Route path="*" element={<Navigate to="/map" replace />} />
        </Routes>
      </main>

      {/* Bottom Control Panel - only at map page */}
      {isMapPage && (
        <footer className={styles.controlPanel}>
          <div className={styles.statBox}>
            <div className={styles.statValue}>{distance.toFixed(2)}</div>
            <div className={styles.statLabel}>Distance (km)</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statValue}>{calories}</div>
            <div className={styles.statLabel}>Calories</div>
          </div>
          
          {session ? (
            <div className={styles.tooltipContainer}>
              {distance === 0 && (
                <span className={styles.tooltipText}>Add at least 2 points to the map to save</span>
              )}
              <button 
                className={styles.saveButton} 
                disabled={distance === 0}
                onClick={() => setShowSaveModal(true)}
              >
                Save Run
              </button>
            </div>
          ) : (
            <div className={styles.tooltipContainer}>
              <span className={styles.tooltipText}>
                {distance === 0 
                  ? "Add at least 2 points to the map to save" 
                  : "Please log in to save your run"}
              </span>
              <button 
                className={styles.guestSaveButton}
                disabled={true}
              >
                Save Run
              </button>
            </div>
          )}
        </footer>
      )}

      {/* Save Run Modal */}
      {showSaveModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Save your Run</h3>
            <form onSubmit={handleSaveRun}>
              <label>How many minutes did you run?</label>
              <input 
                type="number" 
                value={duration} 
                onChange={(e) => setDuration(e.target.value)} 
                required 
                placeholder="Minutes"
                autoFocus
              />
              <div className={styles.modalButtons}>
                <button type="button" onClick={() => setShowSaveModal(false)}>Cancel</button>
                <button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Confirm Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
