import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import styles from './Privacy.module.css';

export default function Privacy() {
  const [session, setSession] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleDeleteAccount = async () => {
    if (!session) return;
    
    const confirmDelete = window.confirm(
      "Are you absolutely sure? This will permanently delete your account and ALL your saved runs. This action cannot be undone."
    );

    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      // 1. Delete all runs associated with the user first (optional if CASCADE is set up, but safer)
      const { error: runsError } = await supabase
        .from('runs')
        .delete()
        .eq('user_id', session.user.id);

      if (runsError) throw runsError;

      // 2. Call the RPC function to delete the user from auth.users
      const { error: deleteError } = await supabase.rpc('delete_user');
      
      if (deleteError) throw deleteError;

      // 3. Sign out to clear local session
      await supabase.auth.signOut();

      alert("Your data and account have been successfully removed.");
      navigate('/');
    } catch (err: any) {
      console.error("Deletion failed:", err);
      alert("An error occurred while deleting your account: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportData = async () => {
    if (!session) return;

    try {
      // Fetch all runs for the user
      const { data: runs, error } = await supabase
        .from('runs')
        .select('*')
        .eq('user_id', session.user.id);

      if (error) throw error;

      const exportData = {
        user: {
          id: session.user.id,
          email: session.user.email,
          created_at: session.user.created_at,
        },
        runs: runs || [],
        exported_at: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `run_tracker_data_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Export failed:", err);
      alert("An error occurred while exporting your data: " + err.message);
    }
  };

  return (
    <div className={styles.pageWrapper} onMouseMove={handleMouseMove}>
      <div className={styles.mouseFollower} style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }} />
      
      <div className={styles.topoContainer}>
        <div className={styles.peak}>
          <div className={styles.contourLine} />
          <div className={styles.contourLine} />
          <div className={styles.contourLine} />
        </div>
      </div>

      <div className={styles.container}>
        <h1 className={styles.title}>Privacy Policy</h1>
        
        <div className={styles.contentCard}>
          <section className={styles.section}>
            <h2>What We Store</h2>
            <p>
              Your privacy is our priority. We only store the absolute minimum information required 
               to provide you with a functional running experience:
            </p>
            <ul>
              <li><strong>Email Address:</strong> Used exclusively for account authentication and login purposes.</li>
              <li><strong>Run Data:</strong> The distances, durations, and routes you explicitly choose to save.</li>
            </ul>
            <p className={styles.important}>
              We do <strong>not</strong> store your name, sex, age, physical address, or any other personal identifiers.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Location & Tracking</h2>
            <p>
              We believe in "Location Privacy." We do <strong>not</strong> track or store your live 
              location in real-time.
            </p>
            <ul>
              <li>
                The "Find Me" feature uses your browser's local location services only to center 
                the map for your convenience while planning routes.
              </li>
              <li>
                Route coordinates are only stored when you manually click "Save Run" after finishing your route planning.
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>Data Retention</h2>
            <p>
              Your data belongs to you. We store it only as long as your account remains active. 
              If you decide to leave, we provide a complete data wipe.
            </p>
          </section>

          {session && (
            <div className={styles.dangerZone}>
              <h3>Account Management</h3>
              <p>Download a copy of your data or permanently remove your account from our servers.</p>
              <div className={styles.buttonGroup}>
                <button 
                  className={styles.exportButton} 
                  onClick={handleExportData}
                >
                  Get My Data (.json)
                </button>
                <button 
                  className={styles.deleteButton} 
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete My Account'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
