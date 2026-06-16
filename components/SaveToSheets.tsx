/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, getAccessToken, logout } from '../services/authService';
import { getOrCreateSpreadsheet, appendToSheet } from '../services/sheetsService';
import { Bookmark, CheckCircle, ExternalLink, LogOut, Loader2 } from 'lucide-react';

interface SaveToSheetsProps {
  topic: string;
  content: string; // The generated content
  isLoadingContent: boolean;
}

const SaveToSheets: React.FC<SaveToSheetsProps> = ({ topic, content, isLoadingContent }) => {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);

  // When topic changes, reset the saved state
  useEffect(() => {
    setIsSaved(false);
  }, [topic]);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, t) => {
        setUser(user);
        setToken(t);
        setNeedsAuth(false);
      },
      () => {
        setNeedsAuth(true);
        setToken(null);
        setUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Login failed:', err);
      alert("Failed to sign in. Please verify Firebase setup.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsSaved(false);
    setSheetUrl(null);
  };

  const handleSave = async () => {
    if (!token) return;
    setIsSaving(true);
    
    // Snippet for spreadsheet
    const snippet = content.length > 250 ? content.substring(0, 247) + '...' : content;
    const dateStr = new Date().toLocaleString();

    try {
      const sheetId = await getOrCreateSpreadsheet(token);
      if (sheetId) {
        setSheetUrl(`https://docs.google.com/spreadsheets/d/${sheetId}/edit`);
        await appendToSheet(token, sheetId, [topic, snippet, dateStr]);
        setIsSaved(true);
      }
    } catch (error) {
      console.error("Failed to save to Sheets", error);
      alert("Failed to save. You may need to grant Permissions again or the auth token expired.");
      // Force re-auth flow just in case
      setNeedsAuth(true);
    } finally {
      setIsSaving(false);
    }
  };

  const isSaveDisabled = isLoadingContent || !content || isSaving || isSaved;

  return (
    <div style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px dashed #eee' }}>
      {!needsAuth && user ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#666' }}>
              Connected as <strong>{user.email}</strong>
            </span>
            <button
              onClick={handleLogout}
              style={{ fontSize: '0.8rem', color: '#888', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <LogOut size={12} /> Sign out
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={handleSave}
              disabled={isSaveDisabled}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: isSaved ? '#e6f4ea' : '#1a73e8',
                color: isSaved ? '#137333' : 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.9rem',
                cursor: isSaveDisabled ? 'not-allowed' : 'pointer',
                opacity: isSaveDisabled && !isSaved ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
            >
              {isSaving ? (
                <Loader2 size={16} className="blinking-cursor" />
              ) : isSaved ? (
                <CheckCircle size={16} />
              ) : (
                <Bookmark size={16} />
              )}
              <span>{isSaving ? 'Saving...' : isSaved ? 'Saved to Google Sheets' : 'Save to Google Sheets'}</span>
            </button>

            {isSaved && sheetUrl && (
              <a 
                href={sheetUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ fontSize: '0.85rem', color: '#1a73e8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                Open Sheet <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
            Want to keep a log of interesting topics? Connect Google Sheets.
          </p>
          <button 
            className="gsi-material-button" 
            onClick={handleLogin}
            disabled={isLoggingIn}
            style={{ 
              backgroundColor: 'white', 
              color: '#3c4043', 
              border: '1px solid #dadce0', 
              borderRadius: '4px', 
              padding: '0 12px', 
              cursor: isLoggingIn ? 'not-allowed' : 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              fontWeight: 500, 
              fontSize: '14px', 
              lineHeight: '38px',
              fontFamily: '"Google Sans",Roboto,Arial,sans-serif'
            }}
          >
            <div style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}>
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="18" height="18" style={{ display: 'block' }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            </div>
            {isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SaveToSheets;
