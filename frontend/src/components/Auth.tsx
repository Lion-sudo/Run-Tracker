import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import styles from './Auth.module.css';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp && !agreedToPrivacy) {
      setMessage('Please agree to the privacy terms before signing up.');
      setIsError(true);
      return;
    }

    setLoading(true);
    setMessage('');
    setIsError(false);
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Success!\nCheck your email for the confirmation link');
        setIsError(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/map');
      }
    } catch (error: any) {
      setMessage(error.error_description || error.message);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container} onMouseMove={handleMouseMove}>
      {/* Interactive Background Elements */}
      <div 
        className={styles.mouseFollower} 
        style={{ 
          transform: `translate(${mousePos.x}px, ${mousePos.y}px)` 
        }} 
      />
      <div className={styles.bgDecorations}>
        <div className={styles.circle1}></div>
        <div className={styles.circle2}></div>
        <div className={styles.circle3}></div>
        <div className={styles.circle4}></div>
        <div className={styles.circle5}></div>
      </div>

      <div className={styles.authBox}>
        <h2 className={styles.title}>{isSignUp ? 'Join the Journey' : 'Welcome Back'}</h2>
        <p className={styles.subtitle}>
          {isSignUp 
            ? 'Track every step, crush every goal.' 
            : 'Log in to continue your journey.'}
        </p>
        
        <form onSubmit={handleAuth} className={styles.form}>
          <input
            className={styles.input}
            type="email"
            placeholder="Your email address"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className={styles.input}
            type="password"
            placeholder="Your password (min 6 chars)"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
          />

          {isSignUp && (
            <div className={styles.privacyConsent}>
              <input 
                type="checkbox" 
                id="privacy" 
                checked={agreedToPrivacy}
                onChange={(e) => setAgreedToPrivacy(e.target.checked)}
              />
              <label htmlFor="privacy">
                I've read the <span className={styles.privacyLink} onClick={() => navigate('/privacy')}>privacy terms</span>
              </label>
            </div>
          )}

          <button className={styles.button} disabled={loading}>
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        {message && (
          <p className={`${styles.message} ${isError ? styles.errorMessage : styles.successMessage}`}>
            {message}
          </p>
        )}
        
        <button 
          className={styles.toggleButton} 
          onClick={() => {
            setIsSignUp(!isSignUp);
            setMessage('');
            setIsError(false);
          }}
        >
          {isSignUp ? "Already have an account? Log In" : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}
