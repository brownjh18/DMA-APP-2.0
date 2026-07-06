import React, { useState, useRef, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import apiService from '../services/api';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonAlert,
  IonChip,
  IonBadge,
  IonCard,
  IonCardContent
} from '@ionic/react';
import {
  mic,
  play,
  pause,
  stop,
  radio,
  image,
  time,
  settings,
  shieldOutline,
  alertCircle,
  musicalNotes,
  arrowBack,
  download,
  cloudUpload,
  flash,
  analytics,
  people,
  documentText
} from 'ionicons/icons';

const AdminGoLive: React.FC = () => {
  const history = useHistory();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [audioData, setAudioData] = useState<number[]>([]);
  const [hasStoppedRecording, setHasStoppedRecording] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [micError, setMicError] = useState<string | null>(null);
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Don't check permission on load - just set to prompt
    // We'll check when user tries to record
    setMicPermission('prompt');
    return () => {
      cleanup();
    };
  }, []);

  const checkMicPermission = async () => {
    // This function is no longer used on load
    // Permission is checked when user clicks record
  };

  const requestMicPermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission('granted');
      setMicError(null);
      return true;
    } catch (error: any) {
      console.error('Microphone permission denied:', error);
      setMicPermission('denied');
      setMicError('Microphone access denied. Please enable microphone permissions in your device settings.');
      return false;
    }
  };

  const cleanup = () => {
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
  };

  const startRecording = async () => {
    if (!title.trim()) {
      setAlertMessage('Please enter a broadcast title.');
      setShowAlert(true);
      return;
    }

    // Always try to get permission when user clicks record
    // This will show the permission prompt if not yet granted
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const getSupportedMimeType = () => {
        const types = ['audio/mp4;codecs=mp4a.40.2', 'audio/webm;codecs=opus', 'audio/webm', 'audio/wav'];
        for (const type of types) {
          if (MediaRecorder.isTypeSupported(type)) return type;
        }
        return 'audio/webm';
      };

      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };

      mediaRecorder.onerror = (event) => {
        setAlertMessage('Recording failed. Please check your microphone and try again.');
        setShowAlert(true);
        setIsRecording(false);
        setIsPaused(false);
        cleanup();
      };

      mediaRecorder.onstop = () => {
        try {
          if (recordedChunksRef.current.length === 0) {
            setAlertMessage('No audio data was recorded.');
            setShowAlert(true);
            return;
          }

          const blob = new Blob(recordedChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
          const audioUrl = URL.createObjectURL(blob);
          setRecordedBlob(blob);

          if (audioPreviewRef.current) {
            audioPreviewRef.current.src = audioUrl;
          }

          if (isPublishing) {
            uploadPodcast(blob);
            setIsPublishing(false);
          }
          recordedChunksRef.current = [];
        } catch (error) {
          setAlertMessage('Failed to process recorded audio.');
          setShowAlert(true);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setHasStoppedRecording(false);
      setIsPlayingPreview(false);
      setAudioDuration(0);
      setCurrentTime(0);
      setRecordedBlob(null);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      startAudioVisualization();
    } catch (error: any) {
      console.error('Microphone error:', error);
      let errorMsg = 'Failed to access microphone: ';
      if (error.name === 'NotAllowedError') {
        errorMsg += 'Permission denied. Please enable microphone in Settings > Apps > This App > Permissions.';
      } else if (error.name === 'NotFoundError') {
        errorMsg += 'No microphone found on this device.';
      } else if (error.name === 'NotReadableError') {
        errorMsg += 'Microphone is in use by another app.';
      } else if (error.name === 'SecurityError') {
        errorMsg += 'Security restriction. Make sure the app is trusted.';
      } else {
        errorMsg += error.message || 'Unknown error';
      }
      setAlertMessage(errorMsg);
      setShowAlert(true);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        recordingIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      setHasStoppedRecording(true);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      cleanup();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startAudioVisualization = () => {
    const visualize = () => {
      if (analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
        setAudioData(Array.from(dataArrayRef.current));
      }
      animationFrameRef.current = requestAnimationFrame(visualize);
    };
    visualize();
  };

  const uploadPodcast = async (blob: Blob) => {
    let extension = 'webm';
    if (blob.type.includes('mp4')) extension = 'm4a';
    else if (blob.type.includes('wav')) extension = 'wav';
    else if (blob.type.includes('ogg')) extension = 'ogg';

    const formData = new FormData();
    formData.append('audioFile', blob, `podcast-${Date.now()}.${extension}`);
    formData.append('title', title || 'Untitled Podcast');
    formData.append('speaker', 'Dove Church');
    formData.append('description', description || '');
    if (thumbnailFile) formData.append('thumbnailFile', thumbnailFile);

    const url = '/api/podcasts';
    const headers: HeadersInit = {};
    const token = localStorage.getItem('token');
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const response = await fetch(url, { method: 'POST', headers, body: formData });
      if (!response.ok) throw new Error('Failed to upload');

      setIsPublishing(false);
      alert(`Podcast "${title || 'Untitled Podcast'}" has been uploaded successfully!`);
      setTimeout(() => history.push('/admin/radio'), 1500);
    } catch (error) {
      setAlertMessage('Failed to publish podcast.');
      setShowAlert(true);
      setIsPublishing(false);
    }
  };

  const publishPreview = () => {
    if (recordedBlob) {
      setIsPublishing(true);
      uploadPodcast(recordedBlob);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnail(URL.createObjectURL(file));
    }
  };

  // ---- Render Components ----

  // Floating Background Orbs
  const FloatingOrbs = () => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-10%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        animation: 'float 20s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '-5%',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)',
        animation: 'float 25s ease-in-out infinite reverse'
      }} />
      <div style={{
        position: 'absolute',
        top: '40%',
        right: '10%',
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
        animation: 'float 18s ease-in-out infinite'
      }} />
    </div>
  );

  // Glass Card Component
  const GlassCard = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: '24px',
      border: '1px solid rgba(255, 255, 255, 0.5)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
      padding: '20px',
      ...style
    }}>
      {children}
    </div>
  );

  // Quick Stats Row
  const renderStatsRow = () => (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
      {[
        { icon: flash, label: 'Recording', value: 'HD', color: '#6366f1' },
        { icon: analytics, label: 'Format', value: 'MP3', color: '#10b981' },
        { icon: people, label: 'Mode', value: 'Live', color: '#f59e0b' },
      ].map((stat, i) => (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          background: `${stat.color}10`,
          borderRadius: '16px',
          border: `1px solid ${stat.color}20`,
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: stat.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IonIcon icon={stat.icon} style={{ fontSize: '14px', color: 'white' }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '10px', fontWeight: '600', color: 'var(--ion-text-color)', opacity: 0.6 }}>{stat.label}</p>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: stat.color }}>{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );

  // Open device settings to enable microphone
  const openDeviceSettings = async () => {
    try {
      // Check if we're running in Capacitor (native mobile app)
      const isCapacitor = !!(window as any).capacitor || !!(window as any).Capacitor;
      
      if (isCapacitor) {
        // For Capacitor apps, try to use the AppLauncher plugin if available
        // First, check if the plugin is registered
        const plugins = (window as any).Plugins || (window as any).Capacitor?.Plugins;
        
        if (plugins?.AppLauncher) {
          try {
            await plugins.AppLauncher.openSettings({ action: 'application_settings' });
            return;
          } catch (e) {
            console.log('AppLauncher not available, trying alternative method');
          }
        }
        
        // Alternative: Try using Capacitor's native intent for Android
        // This opens the app's settings page directly
        try {
          const { App } = (window as any).Capacitor?.plugins || {};
          if (App && typeof App.getInfo === 'function') {
            // We can at least get app info, but to open settings we need a different approach
            // Try opening settings via intent URL (Android specific)
            const settingsUrl = 'app-settings:';
            window.location.href = settingsUrl;
            return;
          }
        } catch (e) {
          console.log('Capacitor App plugin not available');
        }
      }
      
      // For Android Chrome/browser, try to open settings via intent
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('android')) {
        try {
          // Try Android settings intent
          window.location.href = 'app-settings:';
          // If that doesn't work, try package-specific settings
          setTimeout(() => {
            // Fallback: try to open Chrome settings
            window.location.href = 'chrome://settings/content/microphone';
          }, 500);
          return;
        } catch (e) {
          console.log('Android settings intent failed');
        }
      }
      
      // For iOS Safari, we cannot directly open settings
      // Show instructions instead
      if (ua.includes('iphone') || ua.includes('ipad')) {
        setAlertMessage('To enable microphone access:\n\n1. Open Settings\n2. Scroll down and tap this app\n3. Toggle Microphone ON');
        setShowAlert(true);
        return;
      }
      
      // For desktop browsers, re-request permission
      if (navigator.permissions) {
        await requestMicPermission();
      }
      
    } catch (error) {
      console.error('Failed to open settings:', error);
      // Fallback: show detailed instructions
      setAlertMessage('To enable microphone access:\n\n• On Mobile: Go to Settings > Apps > This App > Permissions > Microphone > Allow\n\n• On Desktop: Click the lock icon in your browser address bar and enable Microphone.');
      setShowAlert(true);
    }
  };

  // Main Record Button with Ripple Effect
  const renderRecordButton = () => (
    !isRecording && !hasStoppedRecording && (
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          position: 'relative',
          width: '140px',
          height: '140px',
          margin: '0 auto'
        }}>
          {/* Outer Glow Ring */}
          <div style={{
            position: 'absolute',
            inset: '-8px',
            borderRadius: '50%',
            background: micPermission === 'denied'
              ? 'linear-gradient(135deg, #ef4444 0%, #f97316 50%, #dc2626 100%)'
              : 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #10b981 100%)',
            opacity: micPermission === 'denied' ? 0.4 : 0.3,
            animation: micPermission === 'denied' ? 'pulse-ring-warning 2s ease-out infinite' : 'pulse-ring 2s ease-out infinite'
          }} />
          
          {/* Middle Glow Ring */}
          <div style={{
            position: 'absolute',
            inset: '-4px',
            borderRadius: '50%',
            background: micPermission === 'denied'
              ? 'linear-gradient(135deg, #ef4444 0%, #f97316 50%, #dc2626 100%)'
              : 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #10b981 100%)',
            opacity: micPermission === 'denied' ? 0.3 : 0.2,
            animation: micPermission === 'denied' ? 'pulse-ring-warning 2s ease-out infinite 0.5s' : 'pulse-ring 2s ease-out infinite 0.5s'
          }} />

          {/* Main Button */}
          <button
            onClick={startRecording}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: micPermission === 'denied'
                ? 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)'
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
              border: 'none',
              cursor: 'pointer',
              boxShadow: micPermission === 'denied'
                ? '0 20px 60px rgba(249, 115, 22, 0.4), inset 0 -4px 8px rgba(0,0,0,0.1), inset 0 4px 8px rgba(255,255,255,0.3)'
                : '0 20px 60px rgba(239, 68, 68, 0.4), inset 0 -4px 8px rgba(0,0,0,0.1), inset 0 4px 8px rgba(255,255,255,0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = micPermission === 'denied'
                ? '0 24px 80px rgba(249, 115, 22, 0.5)'
                : '0 24px 80px rgba(239, 68, 68, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = micPermission === 'denied'
                ? '0 20px 60px rgba(249, 115, 22, 0.4)'
                : '0 20px 60px rgba(239, 68, 68, 0.4)';
            }}
          >
            {/* Shine Effect */}
            <div style={{
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              background: 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.4) 0%, transparent 50%)',
              borderRadius: '50%'
            }} />
            
            {/* Icon */}
            <IonIcon 
              icon={micPermission === 'denied' ? alertCircle : mic} 
              style={{ 
                position: 'relative', 
                zIndex: 1, 
                fontSize: '56px', 
                color: 'white',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
              }} 
            />
          </button>
        </div>
        
        <p style={{
          margin: '16px 0 0 0',
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--ion-text-color)',
          opacity: 0.7
        }}>
          {micPermission === 'denied' ? 'Microphone access denied' : isCheckingPermission ? 'Checking permission...' : 'Tap to start recording'}
        </p>
        
        {micPermission === 'denied' && (
          <div style={{
            marginTop: '12px',
            padding: '14px 16px',
            background: 'rgba(249, 115, 22, 0.1)',
            borderRadius: '14px',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            maxWidth: '320px',
            margin: '12px auto 0 auto'
          }}>
            <p style={{
              margin: 0,
              fontSize: '12px',
              color: 'var(--ion-text-color)',
              opacity: 0.8,
              lineHeight: 1.5
            }}>
              <strong style={{ color: '#f97316' }}>Microphone Access Required</strong>
              <br />
              Please enable microphone access in your device settings to record audio.
            </p>
            <div style={{
              marginTop: '10px',
              display: 'flex',
              gap: '10px'
            }}>
              <button
                onClick={openDeviceSettings}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <IonIcon icon={settings} style={{ fontSize: '14px' }} />
                Open Settings
              </button>
              <button
                onClick={() => {
                  setIsCheckingPermission(true);
                  requestMicPermission().then(() => setIsCheckingPermission(false));
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '10px',
                  color: '#6366f1',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    )
  );

  // Recording Controls (inline)
  const renderRecordingControls = () => (
    isRecording && (
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center' }}>
          {/* Pause Button */}
          <button
            onClick={pauseRecording}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '18px',
              background: isPaused
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              border: 'none',
              cursor: 'pointer',
              boxShadow: isPaused
                ? '0 8px 24px rgba(16, 185, 129, 0.3)'
                : '0 8px 24px rgba(245, 158, 11, 0.3)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <IonIcon icon={isPaused ? play : pause} style={{ fontSize: '24px', color: 'white' }} />
          </button>

          {/* Stop Button */}
          <button
            onClick={stopRecording}
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '22px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 12px 32px rgba(239, 68, 68, 0.3)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }} />
          </button>
        </div>
      </div>
    )
  );

  // Audio Visualization
  const renderVisualization = () => (
    isRecording && (
      <GlassCard style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          height: '60px'
        }}>
          {audioData.slice(0, 50).map((value, i) => (
            <div
              key={i}
              style={{
                width: '4px',
                height: `${Math.max(4, (value / 255) * 50)}px`,
                background: `linear-gradient(180deg, #6366f1 0%, #a855f7 100%)`,
                borderRadius: '2px',
                transition: 'height 0.1s ease'
              }}
            />
          ))}
        </div>
      </GlassCard>
    )
  );

  // Details Form
  const renderDetailsForm = () => (
    (!isRecording || hasStoppedRecording) && (
      <div style={{
        background: 'var(--ion-card-background)',
        borderRadius: '24px',
        border: '1px solid var(--ion-color-step-200)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <h2 style={{
          margin: '0 0 16px 0',
          fontSize: '15px',
          fontWeight: '700',
          color: 'var(--ion-text-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'var(--ion-color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IonIcon icon={documentText} style={{ fontSize: '16px', color: '#fff' }} />
          </div>
          Broadcast Details
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: '600',
              color: 'var(--ion-text-color)',
              opacity: 0.6,
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Title <span style={{ color: 'var(--ion-color-danger)' }}>*</span>
            </label>
            <div style={{
              position: 'relative',
              background: 'var(--ion-background-color)',
              borderRadius: '14px',
              border: '1px solid var(--ion-color-step-200)'
            }}>
              <IonIcon
                icon={radio}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--ion-color-primary)',
                  fontSize: '16px'
                }}
              />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter broadcast title"
                disabled={isRecording}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--ion-text-color)',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: '600',
              color: 'var(--ion-text-color)',
              opacity: 0.6,
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Description
            </label>
            <div style={{
              position: 'relative',
              background: 'var(--ion-background-color)',
              borderRadius: '14px',
              border: '1px solid var(--ion-color-step-200)'
            }}>
              <IonIcon
                icon={time}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '14px',
                  color: 'var(--ion-color-primary)',
                  fontSize: '16px'
                }}
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter broadcast description"
                rows={3}
                disabled={isRecording}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--ion-text-color)',
                  fontSize: '14px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>

          {/* Thumbnail */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: '600',
              color: 'var(--ion-text-color)',
              opacity: 0.6,
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Thumbnail
            </label>
            <button
              onClick={() => thumbnailInputRef.current?.click()}
              disabled={isRecording}
              style={{
                width: '100%',
                padding: '14px',
                background: 'var(--ion-background-color)',
                border: '2px dashed var(--ion-color-step-200)',
                borderRadius: '14px',
                cursor: isRecording ? 'not-allowed' : 'pointer',
                opacity: isRecording ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: 'var(--ion-text-color)',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isRecording) {
                  e.currentTarget.style.borderColor = 'var(--ion-color-primary)';
                  e.currentTarget.style.background = 'var(--ion-color-primary-shade)';
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--ion-color-step-200)';
                e.currentTarget.style.background = 'var(--ion-background-color)';
              }}
            >
              <IonIcon icon={image} style={{ fontSize: '20px', color: 'var(--ion-color-primary)' }} />
              <span style={{ flex: 1, textAlign: 'left' }}>
                {thumbnailFile ? thumbnailFile.name : 'Click to upload thumbnail'}
              </span>
              {thumbnail && (
                <img src={thumbnail} alt="Thumbnail" style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '10px' }} />
              )}
            </button>
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              disabled={isRecording}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      </div>
    )
  );

  // Preview Section
  const renderPreviewSection = () => (
    hasStoppedRecording && recordedBlob && (
      <GlassCard style={{ marginBottom: '24px' }}>
        <h2 style={{
          margin: '0 0 16px 0',
          fontSize: '15px',
          fontWeight: '700',
          color: 'var(--ion-text-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IonIcon icon={musicalNotes} style={{ fontSize: '16px', color: 'white' }} />
          </div>
          Preview Recording
        </h2>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '16px',
          background: 'rgba(16, 185, 129, 0.05)',
          borderRadius: '16px',
          border: '1px solid rgba(16, 185, 129, 0.1)'
        }}>
          {/* Play Button */}
          <button
            onClick={() => {
              if (audioPreviewRef.current) {
                if (isPlayingPreview) {
                  audioPreviewRef.current.pause();
                  setIsPlayingPreview(false);
                } else {
                  audioPreviewRef.current.play();
                  setIsPlayingPreview(true);
                }
              }
            }}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <IonIcon icon={isPlayingPreview ? pause : play} style={{ fontSize: '20px', color: 'white' }} />
          </button>

          {/* Progress */}
          <div style={{ flex: 1 }}>
            <div style={{
              height: '6px',
              background: 'rgba(0,0,0,0.08)',
              borderRadius: '3px',
              overflow: 'hidden',
              cursor: 'pointer'
            }}
            onClick={(e) => {
              if (audioPreviewRef.current && audioDuration > 0) {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const seekTime = (x / rect.width) * audioDuration;
                audioPreviewRef.current.currentTime = seekTime;
                setCurrentTime(seekTime);
              }
            }}>
              <div style={{
                height: '100%',
                width: `${audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0}%`,
                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                borderRadius: '3px',
                transition: 'width 0.1s linear'
              }} />
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '8px',
              fontSize: '11px',
              color: 'var(--ion-text-color)',
              opacity: 0.6,
              fontWeight: '500'
            }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(audioDuration)}</span>
            </div>
          </div>

          {/* Download */}
          <button
            onClick={() => {
              if (recordedBlob) {
                const url = URL.createObjectURL(recordedBlob);
                const a = document.createElement('a');
                a.href = url;
                let extension = 'webm';
                if (recordedBlob.type.includes('mp4')) extension = 'm4a';
                else if (recordedBlob.type.includes('wav')) extension = 'wav';
                else if (recordedBlob.type.includes('ogg')) extension = 'ogg';
                a.download = `recording-${Date.now()}.${extension}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }
            }}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(99, 102, 241, 0.1)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <IonIcon icon={download} style={{ fontSize: '18px', color: '#6366f1' }} />
          </button>
        </div>

        <audio
          ref={audioPreviewRef}
          onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onEnded={() => { setIsPlayingPreview(false); setCurrentTime(0); }}
          onPlay={() => setIsPlayingPreview(true)}
          onPause={() => setIsPlayingPreview(false)}
          style={{ display: 'none' }}
        />
      </GlassCard>
    )
  );

  // Action Buttons
  const renderActionButtons = () => (
    hasStoppedRecording && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <IonButton
          expand="block"
          onClick={publishPreview}
          disabled={isPublishing}
          style={{
            height: '54px',
            borderRadius: '16px',
            fontWeight: '700',
            fontSize: '15px',
            background: isPublishing
              ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            boxShadow: isPublishing ? 'none' : '0 8px 24px rgba(16, 185, 129, 0.3)',
            '--border-radius': '16px'
          }}
        >
          {isPublishing ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid white',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Publishing...
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IonIcon icon={cloudUpload} style={{ fontSize: '18px' }} />
              Publish to Podcast
            </span>
          )}
        </IonButton>

        <IonButton
          expand="block"
          fill="outline"
          onClick={() => history.push('/admin/radio')}
          style={{
            height: '54px',
            borderRadius: '16px',
            fontWeight: '600',
            fontSize: '15px',
            '--border-color': 'rgba(0,0,0,0.1)',
            '--color': '#6366f1',
            '--background': 'transparent',
            '--border-radius': '16px'
          }}
        >
          Go to Radio Manager
        </IonButton>
      </div>
    )
  );

  return (
    <IonPage>
      {/* Floating Background Orbs */}
      <FloatingOrbs />

      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()} style={{ marginLeft: '4px' }}>
            <IonIcon icon={arrowBack} style={{ fontSize: '22px' }} />
          </IonButton>
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>Go Live</IonTitle>

        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '16px', maxWidth: '560px', margin: '0 auto', paddingBottom: '80px', position: 'relative', zIndex: 1 }}>
          {/* Stats Row */}
          {renderStatsRow()}

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h1 style={{
              margin: 0,
              fontSize: '26px',
              fontWeight: '800',
              color: 'var(--ion-text-color)',
              letterSpacing: '-0.5px'
            }}>
              {isRecording ? 'Recording...' : hasStoppedRecording ? 'Ready to Publish' : 'Audio Studio'}
            </h1>
            <p style={{
              margin: '8px 0 0 0',
              fontSize: '14px',
              color: 'var(--ion-text-color)',
              opacity: 0.5,
              lineHeight: 1.5
            }}>
              {isRecording
                ? 'Your session is being recorded in high quality'
                : hasStoppedRecording
                  ? 'Preview your recording and publish when ready'
                  : 'Create professional audio content with one tap'}
            </p>
          </div>

          {/* Recording Button */}
          {renderRecordButton()}

          {/* Recording Controls */}
          {renderRecordingControls()}

          {/* Visualization */}
          {renderVisualization()}

          {/* Details Form */}
          {renderDetailsForm()}

          {/* Preview */}
          {renderPreviewSection()}

          {/* Action Buttons */}
          {renderActionButtons()}
        </div>

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Alert"
          message={alertMessage}
          buttons={['OK']}
        />
      </IonContent>

      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.4; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        
        @keyframes pulse-ring-warning {
          0% { transform: scale(0.8); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 0.2; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -20px); }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        input::placeholder,
        textarea::placeholder {
          color: var(--ion-text-color) !important;
          opacity: 0.3 !important;
        }
      `}</style>
    </IonPage>
  );
};

export default AdminGoLive;