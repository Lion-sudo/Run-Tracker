import React, { useState } from 'react';
import styles from './About.module.css';

export default function About() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
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
        <h1 className={styles.title}>About Run Planner</h1>
        
        <div className={styles.contentCard}>
          <section className={styles.section}>
            <h2>The Project</h2>
            <p>
              Run Planner is a lightweight, mobile-first web application designed to help runners 
              map their routes, track their distances, and monitor their progress over time. 
              This is my first full-stack web project, built as a long-term learning exercise to master 
              modern web development practices, responsive design, and database integration.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Tech Stack</h2>
            <p>
              The application leverages a modern, robust technology stack to deliver a fast and 
              seamless user experience:
            </p>
            <ul>
              <li><strong>Frontend Framework:</strong> React 19 with TypeScript, utilizing Vite for lightning-fast builds.</li>
              <li><strong>Mapping & Routing:</strong> Leaflet and React-Leaflet for interactive maps, powered by the Open Source Routing Machine (OSRM) API for accurate pedestrian pathfinding.</li>
              <li><strong>Backend & Database:</strong> Supabase (PostgreSQL) for secure user authentication and reliable data persistence.</li>
              <li><strong>Styling:</strong> Pure CSS Modules for scoped, maintainable styles, featuring custom topographic UI elements and smooth animations.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>Key Features</h2>
            <ul>
              <li><strong>Interactive Route Planning:</strong> Click on the map to draw routes. The app automatically calculates the exact pedestrian path, distance, and estimated calories burned.</li>
              <li><strong>Personal Dashboard:</strong> View a detailed history of your logged runs, including pace calculations and duration.</li>
              <li><strong>Visual Insights:</strong> Analyze your progress over different time ranges (weekly, monthly, yearly) and visualize your most frequent routes using an interactive heatmap.</li>
              <li><strong>Story Mode:</strong> Export beautiful, social-media-ready images of your running routes and heatmaps to share with friends.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>Developer</h2>
            <p>
              Created by {" "} <a href="https://github.com/Lion-sudo" target="_blank" rel="noopener noreferrer" className={styles.githubLink}>Lion Abramov</a>.
              <br/>You can view the source code and follow the development of this
              project on GitHub:
            </p>
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <a href="https://github.com/Lion-sudo/Run-Tracker" target="_blank" rel="noopener noreferrer" className={styles.githubLink}>GitHub Repository</a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
