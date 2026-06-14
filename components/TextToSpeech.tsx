/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2, VolumeX, Settings } from 'lucide-react';

interface TextToSpeechProps {
  content: string;
  topic: string;
  isLoading: boolean;
}

const TextToSpeech: React.FC<TextToSpeechProps> = ({ content, topic, isLoading }) => {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [rate, setRate] = useState<number>(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize Speech Synthesis and populate voices
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setIsSupported(true);
      
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Pick a good default voice (prefer english standard/natural)
        const defaultVoice = 
          availableVoices.find(v => v.lang.startsWith('en') && v.name.includes('Natural')) ||
          availableVoices.find(v => v.lang.startsWith('en')) ||
          availableVoices[0];
          
        if (defaultVoice) {
          setSelectedVoiceName(defaultVoice.name);
        }
      };

      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Stop reading immediately if user navigates to a new topic or if data restarts loading
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, [topic, isLoading]);

  const handlePlayPause = () => {
    if (!isSupported || !content) return;

    const synth = window.speechSynthesis;

    if (isPlaying) {
      if (isPaused) {
        synth.resume();
        setIsPaused(false);
      } else {
        synth.pause();
        setIsPaused(true);
      }
    } else {
      synth.cancel(); // Reset queue

      // Clean HTML tags or interactive placeholders if any, though it is standard text.
      const textToSpeak = `${topic}. ${content}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);

      // Apply voice choice
      if (selectedVoiceName) {
        const selectedVoice = voices.find(v => v.name === selectedVoiceName);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      // Apply speech rate settings
      utterance.rate = rate;

      // Event listeners
      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };

      utterance.onerror = (e) => {
        if (e.error !== 'interrupted') {
          console.error('SpeechSynthesisUtterance error:', e);
        }
        setIsPlaying(false);
        setIsPaused(false);
      };

      utteranceRef.current = utterance;
      setIsPlaying(true);
      setIsPaused(false);
      synth.speak(utterance);
    }
  };

  const handleStop = () => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  if (!isSupported) {
    return null;
  }

  // Disable controls while article is loading or text is empty
  const isDisabled = isLoading || !content;

  return (
    <div 
      className="tts-container" 
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        padding: '0.75rem 1rem',
        border: '1px solid #eee',
        marginBottom: '2rem',
        fontSize: '0.9rem',
      }}
      id="speech-controller"
    >
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            id="tts-play-btn"
            onClick={handlePlayPause}
            disabled={isDisabled}
            style={{
              padding: '0.4rem 0.8rem',
              border: '1px solid currentColor',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: isDisabled ? '#ccc' : '#000000',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem'
            }}
            aria-label={isPlaying ? (isPaused ? 'Resume reading' : 'Pause reading') : 'Read article aloud'}
          >
            {isPlaying && !isPaused ? (
              <>
                <Pause size={14} aria-hidden="true" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play size={14} aria-hidden="true" />
                <span>{isPaused ? 'RESUME' : 'READ ALOUD'}</span>
              </>
            )}
          </button>

          {isPlaying && (
            <button
              id="tts-stop-btn"
              onClick={handleStop}
              style={{
                padding: '0.4rem 0.8rem',
                border: '1px solid currentColor',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#000000',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
              aria-label="Stop reading"
            >
              <Square size={14} aria-hidden="true" />
              <span>STOP</span>
            </button>
          )}

          {isPlaying && !isPaused && (
            <span 
              id="tts-active-indicator"
              style={{ 
                color: '#0000ff', 
                fontSize: '0.8rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.25rem' 
              }}
            >
              <Volume2 size={12} className="blinking-cursor" aria-hidden="true" />
              <span>Speaking...</span>
            </span>
          )}
        </div>

        <button
          id="tts-settings-toggle"
          onClick={() => setShowSettings(!showSettings)}
          disabled={isDisabled}
          style={{
            padding: '0.4rem 0.6rem',
            color: isDisabled ? '#ccc' : (showSettings ? '#0000ff' : '#888'),
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.85rem'
          }}
          aria-label="Toggle voice and speed settings"
        >
          <Settings size={14} aria-hidden="true" />
          <span>SETTINGS</span>
        </button>
      </div>

      {showSettings && !isDisabled && (
        <div 
          id="tts-settings-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px dashed #eee',
            fontSize: '0.85rem'
          }}
        >
          {/* Speed Rate selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#888', width: '60px' }}>Speed:</span>
            {[0.8, 1, 1.25, 1.5, 2].map(speed => (
              <button
                key={speed}
                id={`tts-rate-${speed}`}
                onClick={() => {
                  setRate(speed);
                  // Dynamic update if currently speaking
                  if (isPlaying && utteranceRef.current) {
                    utteranceRef.current.rate = speed;
                  }
                }}
                style={{
                  padding: '0.15rem 0.5rem',
                  border: rate === speed ? '1px solid #0000ff' : '1px solid #eee',
                  color: rate === speed ? '#0000ff' : '#666',
                  cursor: 'pointer',
                  backgroundColor: rate === speed ? '#f0f5ff' : 'transparent',
                }}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Voice select controls if more than 1 are loaded */}
          {voices.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label htmlFor="tts-voice-select" style={{ color: '#888', width: '60px' }}>Voice:</label>
              <select
                id="tts-voice-select"
                value={selectedVoiceName}
                onChange={(e) => {
                  setSelectedVoiceName(e.target.value);
                  if (isPlaying) {
                    // Changing voices in mid-phrase is not supported consistently by SpeechSynthesis, 
                    // so we stop and restart from top with new voice.
                    window.speechSynthesis.cancel();
                    setIsPlaying(false);
                    setIsPaused(false);
                  }
                }}
                style={{
                  padding: '0.25rem',
                  border: '1px solid #eee',
                  fontSize: '0.8rem',
                  maxWidth: '280px',
                  background: 'none',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {voices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TextToSpeech;
