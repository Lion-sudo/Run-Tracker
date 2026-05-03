import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import styles from './Auth.module.css';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Success! (Check your email for the confirmation link if enabled)');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.authBox}>
        <h2 className={styles.title}>{isSignUp ? 'Create an Account' : 'Welcome Back'}</h2>
        <p className={styles.subtitle}>Sign in to start mapping your runs</p>
        
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
          <button className={styles.button} disabled={loading}>
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        {message && <p className={styles.message}>{message}</p>}
        
        <button 
          className={styles.toggleButton} 
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? "Already have an account? Log In" : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}
