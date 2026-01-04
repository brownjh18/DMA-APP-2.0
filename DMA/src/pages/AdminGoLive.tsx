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
  IonInput,
  IonTextarea,
  IonLabel,
  IonItem,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonText,
  IonProgressBar,
  IonAlert,
  IonFooter,
  IonSelect,
  IonSelectOption
} from '@ionic/react';
import {
  mic,
  micOff,
  play,
  pause,
  stop,
  radio,
  videocam,
  image,
  camera,
  time,
  checkmarkCircle,
  closeCircle,
  eye,
  cloudUpload,
  arrowBack
} from 'ionicons/icons';

const AdminGoLive: React.FC = () => {
  const history = useHistory();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [liveTime, setLiveTime] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showDetails, setShowDetails] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [audioData, setAudioData] = useState<number[]>([]);
  const [hasStoppedRecording, setHasStoppedRecording] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [hasStoppedLive, setHasStoppedLive] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [liveBroadcastId, setLiveBroadcastId] = useState<string | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const liveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Request permissions on component mount
    requestPermissions();
  
    return () => {
      // Cleanup on unmount
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const requestPermissions = async () => {
    try {
      // Request permission to access audio
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Check supported audio formats
      const supportedFormats: string[] = [];
      const formatsToCheck = [
        'audio/mp4;codecs=mp4a.40.2', // AAC
        'audio/webm;codecs=opus',     // Opus in WebM
        'audio/webm',                 // WebM fallback
        'audio/wav',                  // WAV fallback
      ];

      formatsToCheck.forEach(format => {
        if (MediaRecorder.isTypeSupported(format)) {
          supportedFormats.push(format);
        }
      });

      console.log('Supported audio recording formats:', supportedFormats);

      // Request notification permission
      if ('Notification' in window) {
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.warn('Notification permission not granted');
          }
        }
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setAlertMessage('Unable to access required permissions. Please check audio and notification settings.');
      setShowAlert(true);
    }
  };

  const startRecording = async () => {
    if (!title.trim()) {
      setAlertMessage('Please enter a broadcast title.');
      setShowAlert(true);
      return;
    }

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

      // Set up Web Audio API for visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Create properly typed data array
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;

      // Determine the best supported audio format
      const getSupportedMimeType = () => {
        const types = [
          'audio/mp4;codecs=mp4a.40.2', // AAC
          'audio/webm;codecs=opus',     // Opus in WebM
          'audio/webm',                 // WebM fallback
          'audio/wav',                  // WAV fallback
        ];

        for (const type of types) {
          if (MediaRecorder.isTypeSupported(type)) {
            return type;
          }
        }
        return 'audio/webm'; // Final fallback
      };

      const mimeType = getSupportedMimeType();
      console.log('Using live audio format:', mimeType);

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setAlertMessage('Recording failed. Please check your microphone and try again.');
        setShowAlert(true);
        setIsRecording(false);
        setIsLive(false);
        setIsPaused(false);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.onstop = () => {
        try {
          if (recordedChunksRef.current.length === 0) {
            console.warn('No audio data recorded');
            setAlertMessage('No audio data was recorded. Please check your microphone.');
            setShowAlert(true);
            return;
          }

          const blob = new Blob(recordedChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
          const audioUrl = URL.createObjectURL(blob);
          setRecordedBlob(blob);

          // Set audio source for preview
          if (audioPreviewRef.current) {
            audioPreviewRef.current.src = audioUrl;
            // Add error handling for audio loading
            audioPreviewRef.current.onerror = () => {
              console.error('Failed to load live recorded audio for playback');
              setAlertMessage('Live recorded audio format is not supported for playback. Please try downloading instead.');
              setShowAlert(true);
            };
            audioPreviewRef.current.onloadeddata = () => {
              console.log('Live audio loaded successfully for preview');
            };
          }

          if (isPublishing) {
            uploadPodcast(blob);
            setIsPublishing(false);
          }
          recordedChunksRef.current = [];
        } catch (error) {
          console.error('Error processing recorded audio:', error);
          setAlertMessage('Failed to process recorded audio.');
          setShowAlert(true);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setShowDetails(false);
      setHasStoppedRecording(false);
      setIsPlayingPreview(false);
      setAudioDuration(0);
      setCurrentTime(0);
      setRecordedBlob(null);
      setHasStoppedLive(false);

      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start audio visualization
      startAudioVisualization();

    } catch (error) {
      setAlertMessage('Failed to access microphone. Please check permissions.');
      setShowAlert(true);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        // Resume timer
        recordingIntervalRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        // Pause timer
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      setShowDetails(true);
      setHasStoppedRecording(true);

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }

      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const goLive = async () => {
    if (!title.trim()) {
      setAlertMessage('Please enter a broadcast title.');
      setShowAlert(true);
      return;
    }

    try {
      // If we have a thumbnail file, upload it first
      let thumbnailUrl = '/bible.JPG';
      if (thumbnailFile) {
        try {
          const formData = new FormData();
          formData.append('thumbnailFile', thumbnailFile);

          const uploadData = await apiService.uploadThumbnail(formData);
          thumbnailUrl = uploadData.thumbnailUrl;
        } catch (uploadError) {
          console.warn('Thumbnail upload failed, using default:', uploadError);
          // If upload fails, use default thumbnail
        }
      }

      // Create the live broadcast record in the backend
      const token = localStorage.getItem('token');
      const response = await fetch('/api/live-broadcasts/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          title: title.trim(),
          speaker: 'Dove Ministries Africa',
          description: description.trim(),
          thumbnailUrl: thumbnailUrl
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start live broadcast');
      }

      const data = await response.json();
      setLiveBroadcastId(data.broadcast.id);

      // Now start the local live streaming
      setIsLive(true);
      setIsRecording(false);
      setRecordingTime(0);
      setShowDetails(false);
      setHasStoppedRecording(false);
      setIsPlayingPreview(false);
      setAudioDuration(0);
      setCurrentTime(0);
      setHasStoppedLive(false);

      // Start recording for live capture
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

      // Set up Web Audio API for visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;

      // Determine the best supported audio format
      const getSupportedMimeType = () => {
        const types = [
          'audio/mp4;codecs=mp4a.40.2', // AAC
          'audio/webm;codecs=opus',     // Opus in WebM
          'audio/webm',                 // WebM fallback
          'audio/wav',                  // WAV fallback
        ];

        for (const type of types) {
          if (MediaRecorder.isTypeSupported(type)) {
            return type;
          }
        }
        return 'audio/webm'; // Final fallback
      };

      const mimeType = getSupportedMimeType();
      console.log('Using audio format:', mimeType);

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('Live MediaRecorder error:', event);
        setAlertMessage('Live recording failed. Please check your microphone and try again.');
        setShowAlert(true);
        setIsLive(false);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.onstop = () => {
        try {
          if (recordedChunksRef.current.length === 0) {
            console.warn('No live audio data recorded');
            setAlertMessage('No audio data was recorded during live session.');
            setShowAlert(true);
            return;
          }

          const blob = new Blob(recordedChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
          const audioUrl = URL.createObjectURL(blob);
          setRecordedBlob(blob);

          // Set audio source for preview
          if (audioPreviewRef.current) {
            audioPreviewRef.current.src = audioUrl;
            // Add error handling for audio loading
            audioPreviewRef.current.onerror = () => {
              console.error('Failed to load recorded audio for playback');
              setAlertMessage('Recorded audio format is not supported for playback. Please try downloading instead.');
              setShowAlert(true);
            };
            audioPreviewRef.current.onloadeddata = () => {
              console.log('Audio loaded successfully for preview');
            };
          }
          recordedChunksRef.current = [];
        } catch (error) {
          console.error('Error processing live recorded audio:', error);
          setAlertMessage('Failed to process recorded live audio.');
          setShowAlert(true);
        }
      };

      mediaRecorder.start();
      startAudioVisualization();

      // Start live timer
      liveIntervalRef.current = setInterval(() => {
        setLiveTime(prev => prev + 1);
      }, 1000);

      // Show success message
      alert(`Live broadcast "${title}" has started!`);

      // Trigger immediate live indicator update
      localStorage.setItem('liveBroadcastUpdate', Date.now().toString());
      window.dispatchEvent(new CustomEvent('liveBroadcastUpdate'));

    } catch (error) {
      console.error('Go live error:', error);
      setAlertMessage(error instanceof Error ? error.message : 'Failed to start live broadcast.');
      setShowAlert(true);
    }
  };

  const stopLive = async () => {
    try {
      // Stop local recording first to get the recorded blob
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }

      // Wait a bit for the recording to finish processing
      setTimeout(async () => {
        try {
          // Upload the recorded audio if we have a blob
          if (recordedBlob && liveBroadcastId) {
            await uploadLiveRecording(recordedBlob, liveBroadcastId);
          }

          // Stop the live broadcast in the backend
          if (liveBroadcastId) {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/live-broadcasts/${liveBroadcastId}/stop`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` })
              }
            });

            if (!response.ok) {
              console.warn('Failed to stop live broadcast in backend, but continuing with local cleanup');
            }
          }

          setIsLive(false);
          setLiveTime(0);
          setShowDetails(true);
          setHasStoppedLive(true);
          setLiveBroadcastId(null);

          if (liveIntervalRef.current) {
            clearInterval(liveIntervalRef.current);
          }

          // Stop audio visualization
          stopAudioVisualization();

          // Stop all tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }

          // Trigger immediate live indicator update
          localStorage.setItem('liveBroadcastUpdate', Date.now().toString());
          window.dispatchEvent(new CustomEvent('liveBroadcastUpdate'));

          // Show success message
          alert(`Live broadcast "${title}" has stopped.`);

        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          // Still perform cleanup even if upload fails
          setIsLive(false);
          setLiveTime(0);
          setShowDetails(true);
          setHasStoppedLive(true);
          setLiveBroadcastId(null);

          if (liveIntervalRef.current) {
            clearInterval(liveIntervalRef.current);
          }
          stopAudioVisualization();
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }

          // Trigger immediate live indicator update
          localStorage.setItem('liveBroadcastUpdate', Date.now().toString());
          window.dispatchEvent(new CustomEvent('liveBroadcastUpdate'));

          setAlertMessage('Live broadcast stopped (recording may not have been saved).');
          setShowAlert(true);
        }
      }, 1000); // Wait 1 second for recording to complete

    } catch (error) {
      console.error('Stop live error:', error);
      // Still perform local cleanup even if backend call fails
      setIsLive(false);
      setLiveTime(0);
      setShowDetails(true);
      setHasStoppedLive(true);
      setLiveBroadcastId(null);

      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
      }
      stopAudioVisualization();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Trigger immediate live indicator update
      localStorage.setItem('liveBroadcastUpdate', Date.now().toString());
      window.dispatchEvent(new CustomEvent('liveBroadcastUpdate'));

      setAlertMessage('Live broadcast stopped (with some errors).');
      setShowAlert(true);
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
        // Update audioData for potential use
        setAudioData(Array.from(dataArrayRef.current));
      }
      animationFrameRef.current = requestAnimationFrame(visualize);
    };
    visualize();
  };

  const stopAudioVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const publishRecording = () => {
    setIsPublishing(true);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
    setShowDetails(true);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const uploadLiveRecording = async (blob: Blob, broadcastId: string) => {
    // Determine file extension based on MIME type
    let extension = 'webm'; // default
    if (blob.type.includes('mp4')) {
      extension = 'm4a';
    } else if (blob.type.includes('wav')) {
      extension = 'wav';
    } else if (blob.type.includes('ogg')) {
      extension = 'ogg';
    }

    const formData = new FormData();
    formData.append('audioFile', blob, `live-recording-${Date.now()}.${extension}`);

    // Calculate duration (rough estimate based on live time)
    const duration = `${Math.floor(liveTime / 60)}:${(liveTime % 60).toString().padStart(2, '0')}`;
    formData.append('duration', duration);

    const url = `/api/live-broadcasts/${broadcastId}/recording`;
    const headers: HeadersInit = {};
    const token = localStorage.getItem('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      console.log('AdminGoLive: Starting live recording upload...');
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      console.log('AdminGoLive: Live recording response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AdminGoLive: Live recording upload error:', errorText);
        throw new Error('Failed to upload live recording');
      }

      const responseData = await response.json();
      console.log('AdminGoLive: Live recording upload success:', responseData);

    } catch (error) {
      console.error('AdminGoLive: Live recording upload error:', error);
      throw error; // Re-throw to be handled by caller
    }
  };

  const uploadPodcast = async (blob: Blob) => {
    // Determine file extension based on MIME type
    let extension = 'webm'; // default
    if (blob.type.includes('mp4')) {
      extension = 'm4a';
    } else if (blob.type.includes('wav')) {
      extension = 'wav';
    } else if (blob.type.includes('ogg')) {
      extension = 'ogg';
    }

    const formData = new FormData();
    formData.append('audioFile', blob, `podcast-${Date.now()}.${extension}`);
    formData.append('title', title || 'Untitled Podcast');
    formData.append('speaker', 'Dove Ministries Africa'); // Default speaker
    formData.append('description', description || '');
    if (thumbnailFile) {
      formData.append('thumbnailFile', thumbnailFile);
    }

    const url = '/api/podcasts';
    const headers: HeadersInit = {};
    const token = localStorage.getItem('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      console.log('AdminGoLive: Starting podcast upload...');
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      console.log('AdminGoLive: Response status:', response.status);
      console.log('AdminGoLive: Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AdminGoLive: Response error:', errorText);
        throw new Error('Failed to upload');
      }

      const responseData = await response.json();
      console.log('AdminGoLive: Success response:', responseData);

      // Reset publishing state
      setIsPublishing(false);

      // Show success message
      alert(`Podcast "${title || 'Untitled Podcast'}" has been uploaded successfully!`);

      // Navigate to radio management page after successful upload
      setTimeout(() => {
        history.push('/admin/radio');
      }, 1500);

    } catch (error) {
      console.error('AdminGoLive: Upload error:', error);
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

  const renderAudioWaves = () => {
    if (!isRecording && !isLive) return null;

    const baseColor = isLive ? '#ef4444' : '#10b981';
    const glowColor = isLive ? 'rgba(239, 68, 68, 0.6)' : 'rgba(16, 185, 129, 0.6)';

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3px',
        height: '60px',
        marginBottom: '20px',
        padding: '10px',
        background: 'rgba(0, 0, 0, 0.05)',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {Array.from({ length: 20 }, (_, i) => {
          const baseHeight = 20;
          const variation = Math.sin((i / 20) * Math.PI * 4 + Date.now() * 0.003) * 15;
          const height = Math.max(8, baseHeight + variation);
          return (
            <div
              key={i}
              style={{
                width: '4px',
                minHeight: '8px',
                height: `${height}px`,
                background: `linear-gradient(180deg, ${baseColor} 0%, ${baseColor}CC 30%, ${baseColor}66 70%, ${baseColor}33 100%)`,
                borderRadius: '2px 2px 0 0',
                animation: 'wavePulse 1.2s ease-in-out infinite',
                animationDelay: `${i * 0.08}s`,
                boxShadow: `0 0 6px ${glowColor}, 0 2px 4px rgba(0,0,0,0.1)`,
                transition: 'all 0.3s ease'
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <div
            onClick={() => history.goBack()}
            style={{
              position: 'absolute',
              top: 'calc(var(--ion-safe-area-top) - -5px)',
              left: 20,
              width: 45,
              height: 45,
              borderRadius: 25,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 999,
              transition: 'transform 0.2s ease'
            }}
            onMouseDown={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'scale(0.8)';
            }}
            onMouseUp={(e) => {
              const target = e.currentTarget as HTMLElement;
              setTimeout(() => {
                target.style.transform = 'scale(1)';
              }, 200);
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'scale(1)';
            }}
          >
            <IonIcon
              icon={arrowBack}
              style={{
                color: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000',
                fontSize: '20px',
              }}
            />
          </div>
          <IonTitle className="title-ios">Go Live</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios" scrollY={true}>
        <div style={{
          padding: '20px 24px',
          maxWidth: '600px',
          margin: '0 auto',
          paddingTop: '40px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100vh - 160px)' // Account for header and footer
        }}>

          {/* Status Cards and Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

            {/* Introduction Section */}
            {!isRecording && !isLive && !hasStoppedRecording && !hasStoppedLive && (
              <div style={{ marginBottom: '32px' }}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <IonIcon icon={radio} style={{ fontSize: '3em', color: 'var(--ion-color-primary)' }} />
                </div>
                <h1 style={{
                  margin: '0 0 16px 0',
                  fontSize: '2em',
                  fontWeight: '700',
                  color: 'var(--ion-text-color)',
                  textAlign: 'center'
                }}>
                  Live Broadcast
                </h1>
                <p style={{
                  margin: '0 0 16px 0',
                  fontSize: '1.1em',
                  color: 'var(--ion-text-color)',
                  textAlign: 'center',
                  opacity: 0.8
                }}>
                  Start your live broadcast or record a podcast. Fill in the broadcast details below and choose your preferred option to engage your audience.
                </p>
              </div>
            )}

            {/* Live Broadcast Indicator */}
            {isLive && (
              <div style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '24px',
                textAlign: 'center',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                border: '2px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#ffffff',
                    borderRadius: '50%',
                    animation: 'livePulse 1s ease-in-out infinite'
                  }} />
                  <IonText style={{ fontSize: '1.2em', fontWeight: '700' }}>
                    LIVE BROADCASTING
                  </IonText>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                  <IonIcon icon={mic} style={{ fontSize: '1em', color: '#ffffff' }} />
                  <IonText style={{ fontSize: '0.9em', fontWeight: '600' }}>
                    AUDIO RECORDING ACTIVE
                  </IonText>
                </div>
                <IonText style={{ fontSize: '0.9em', opacity: 0.9 }}>
                  Your broadcast is now live and visible to all users
                </IonText>
              </div>
            )}

            {/* Microphone Visualization - Centered in middle of screen */}
            {(isRecording || isLive) && (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* Radiating waves */}
                  {[1, 2, 3, 4].map((wave) => (
                    <div
                      key={wave}
                      style={{
                        position: 'absolute',
                        width: `${80 + wave * 20}px`,
                        height: `${80 + wave * 20}px`,
                        border: `2px solid ${isLive ? '#ef4444' : '#10b981'}${Math.floor((5 - wave) * 51).toString(16).padStart(2, '0')}`,
                        borderRadius: '50%',
                        animation: `radiate${wave} 2s ease-in-out infinite`,
                        animationDelay: `${wave * 0.3}s`,
                        opacity: 0.6
                      }}
                    />
                  ))}

                  {/* Central microphone */}
                  <div style={{
                    width: '80px',
                    height: '80px',
                    background: `linear-gradient(135deg, ${isLive ? '#ef4444' : '#10b981'} 0%, ${isLive ? '#dc2626' : '#059669'} 100%)`,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 8px 24px ${isLive ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                    zIndex: 1
                  }}>
                    <IonIcon icon={mic} style={{ fontSize: '36px', color: 'white' }} />
                  </div>
                </div>

                {/* Status text */}
                <div style={{
                  marginTop: '50px',
                  textAlign: 'center'
                }}>
                  <IonText style={{
                    color: isLive ? '#ef4444' : '#10b981',
                    fontWeight: '600',
                    fontSize: '1.1em'
                  }}>
                    {isLive ? 'LIVE BROADCASTING' : hasStoppedRecording ? 'RECORDING COMPLETE' : isPaused ? 'RECORDING PAUSED' : 'RECORDING AUDIO'}
                  </IonText>
                  {/* Recording time display */}
                  {(isRecording || isLive || hasStoppedRecording) && (
                    <div style={{
                      marginTop: '10px',
                      fontSize: '1.5em',
                      fontWeight: 'bold',
                      color: isLive ? '#ef4444' : '#10b981',
                      fontFamily: 'monospace'
                    }}>
                      {isLive ? formatTime(liveTime) : formatTime(recordingTime)}
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Audio Preview Section - appears after stopping recording or live */}
            {(hasStoppedRecording || hasStoppedLive) && (
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{
                  margin: '0 0 16px 0',
                  fontSize: '1.4em',
                  fontWeight: '600',
                  color: 'var(--ion-text-color)'
                }}>
                  Preview Recording
                </h2>

                {/* Audio Player */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '16px',
                  borderRadius: '12px',
                  border: '1px solid var(--ion-color-step-300)',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  padding: '16px'
                }}>
                  <div
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
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 3px 10px rgba(16, 185, 129, 0.3)',
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <IonIcon icon={isPlayingPreview ? pause : play} style={{ fontSize: '16px', color: 'white' }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      height: '6px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                      if (audioPreviewRef.current && audioDuration > 0) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const width = rect.width;
                        const seekTime = (x / width) * audioDuration;
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
                      marginTop: '4px',
                      fontSize: '0.8em',
                      color: 'rgba(255, 255, 255, 0.7)'
                    }}>
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(audioDuration)}</span>
                    </div>
                  </div>

                  {/* Download Button */}
                  <div
                    onClick={() => {
                      if (recordedBlob) {
                        const url = URL.createObjectURL(recordedBlob);
                        const a = document.createElement('a');
                        a.href = url;

                        // Determine file extension based on MIME type
                        let extension = 'webm'; // default
                        if (recordedBlob.type.includes('mp4')) {
                          extension = 'm4a';
                        } else if (recordedBlob.type.includes('wav')) {
                          extension = 'wav';
                        } else if (recordedBlob.type.includes('ogg')) {
                          extension = 'ogg';
                        }

                        a.download = `live-recording-${Date.now()}.${extension}`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }
                    }}
                    style={{
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 3px 10px rgba(99, 102, 241, 0.3)',
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <IonIcon icon={cloudUpload} style={{ fontSize: '16px', color: 'white' }} />
                  </div>
                </div>

                {/* Hidden audio element */}
                <audio
                  ref={audioPreviewRef}
                  onLoadedMetadata={(e) => {
                    const audio = e.currentTarget;
                    setAudioDuration(audio.duration);
                  }}
                  onTimeUpdate={(e) => {
                    const audio = e.currentTarget;
                    setCurrentTime(audio.currentTime);
                  }}
                  onEnded={() => {
                    setIsPlayingPreview(false);
                    setCurrentTime(0);
                  }}
                  onPlay={() => setIsPlayingPreview(true)}
                  onPause={() => setIsPlayingPreview(false)}
                  style={{ display: 'none' }}
                />
              </div>
            )}

           {/* Broadcast Details */}
            {!isLive && (!isRecording || showDetails) && (
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{
                  margin: '0 0 16px 0',
                  fontSize: '1.4em',
                  fontWeight: '600',
                  color: 'var(--ion-text-color)'
                }}>
                  Broadcast Details
                </h2>

                <IonItem
                  style={{
                    marginBottom: '16px',
                    borderRadius: '12px',
                    border: '1px solid var(--ion-color-step-300)',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    '--border-radius': '12px'
                  }}
                  lines="none"
                >
                  <IonIcon icon={radio} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
                  <IonInput
                    value={title}
                    onIonChange={e => setTitle(e.detail.value!)}
                    placeholder="Broadcast title *"
                    style={{ color: 'var(--ion-text-color)' }}
                  />
                </IonItem>

                <IonItem
                  style={{
                    marginBottom: '16px',
                    borderRadius: '12px',
                    border: '1px solid var(--ion-color-step-300)',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    '--border-radius': '12px'
                  }}
                  lines="none"
                >
                  <IonIcon icon={time} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
                  <IonTextarea
                    value={description}
                    onIonChange={e => setDescription(e.detail.value!)}
                    placeholder="Broadcast description"
                    rows={3}
                    style={{ color: 'var(--ion-text-color)' }}
                  />
                </IonItem>

                <IonItem
                  style={{
                    marginBottom: '16px',
                    borderRadius: '12px',
                    border: '1px solid var(--ion-color-step-300)',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    '--border-radius': '12px'
                  }}
                  lines="none"
                >
                  <IonIcon slot="start" icon={image} style={{ color: 'var(--ion-color-primary)' }} />
                  {thumbnail && (
                    <img slot="end" src={thumbnail} alt="Thumbnail" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }} />
                  )}
                  <button
                    onClick={() => thumbnailInputRef.current?.click()}
                    style={{ color: 'var(--ion-text-color)', background: 'transparent', border: 'none', textAlign: 'left', width: '100%', padding: 0 }}
                  >
                    {thumbnailFile ? `Selected: ${thumbnailFile.name}` : 'Choose thumbnail image'}
                  </button>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    style={{ display: 'none' }}
                  />
                </IonItem>

              </div>
            )}

            {/* Publish Button - appears after stopping recording */}
            {hasStoppedRecording && !isLive && (
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
                <IonButton
                  onClick={publishPreview}
                  disabled={isPublishing}
                  fill="solid"
                  color="primary"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                    fontWeight: '600',
                    textTransform: 'none',
                    minWidth: '150px'
                  }}
                >
                  {isPublishing ? 'Publishing...' : 'Publish Recording'}
                </IonButton>
              </div>
            )}

            {/* Done Button - appears after stopping live session */}
            {hasStoppedLive && !isLive && (
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
                <IonButton
                  onClick={() => history.push('/admin/radio')}
                  fill="solid"
                  color="primary"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                    fontWeight: '600',
                    textTransform: 'none',
                    minWidth: '150px'
                  }}
                >
                  Done
                </IonButton>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer with Action Buttons */}
        {(isLive || (!isLive && !hasStoppedRecording && !hasStoppedLive)) && (
          <IonFooter style={{
          position: 'fixed',
          bottom: '80px',
          left: '0',
          right: '0',
          backgroundColor: 'var(--ion-background-color)',
          borderTop: '1px solid var(--ion-color-step-200)',
          padding: '16px 24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            alignItems: 'center',
            flexWrap: 'wrap',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            {/* Recording Controls */}
            {!isLive && !hasStoppedRecording && (
              <>
                {!isRecording ? (
                  <div
                    onClick={startRecording}
                    style={{
                      width: '55px',
                      height: '55px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4), 0 4px 10px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                      border: '3px solid rgba(255, 255, 255, 0.3)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 12px 35px rgba(16, 185, 129, 0.5), 0 6px 15px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4), 0 4px 10px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: '0',
                      left: '0',
                      right: '0',
                      bottom: '0',
                      background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.6) 0%, transparent 50%)',
                      borderRadius: '50%'
                    }} />
                    <IonIcon icon={mic} style={{ fontSize: '24px', color: 'white', position: 'relative', zIndex: 1 }} />
                  </div>
                ) : (
                  <>
                    <div
                      onClick={pauseRecording}
                      style={{
                        width: '55px',
                        height: '55px',
                        background: isPaused ? 'linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: isPaused ? '0 6px 20px rgba(5, 150, 105, 0.4), 0 3px 8px rgba(5, 150, 105, 0.2)' : '0 6px 20px rgba(245, 158, 11, 0.4), 0 3px 8px rgba(245, 158, 11, 0.2)',
                        border: '3px solid rgba(255, 255, 255, 0.3)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
                        e.currentTarget.style.boxShadow = isPaused ?
                          '0 10px 30px rgba(5, 150, 105, 0.5), 0 5px 12px rgba(5, 150, 105, 0.3)' :
                          '0 10px 30px rgba(245, 158, 11, 0.5), 0 5px 12px rgba(245, 158, 11, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = isPaused ?
                          '0 6px 20px rgba(5, 150, 105, 0.4), 0 3px 8px rgba(5, 150, 105, 0.2)' :
                          '0 6px 20px rgba(245, 158, 11, 0.4), 0 3px 8px rgba(245, 158, 11, 0.2)';
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        right: '0',
                        bottom: '0',
                        background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.5) 0%, transparent 50%)',
                        borderRadius: '50%'
                      }} />
                      <IonIcon icon={isPaused ? play : pause} style={{ fontSize: '22px', color: 'white', position: 'relative', zIndex: 1 }} />
                    </div>

                    <div
                      onClick={stopRecording}
                      style={{
                        width: '55px',
                        height: '55px',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 6px 20px rgba(239, 68, 68, 0.4), 0 3px 8px rgba(239, 68, 68, 0.2)',
                        border: '3px solid rgba(255, 255, 255, 0.3)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(239, 68, 68, 0.5), 0 5px 12px rgba(239, 68, 68, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4), 0 3px 8px rgba(239, 68, 68, 0.2)';
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        right: '0',
                        bottom: '0',
                        background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)',
                        borderRadius: '50%'
                      }} />
                      <IonIcon icon={stop} style={{ fontSize: '22px', color: 'white', position: 'relative', zIndex: 1 }} />
                    </div>

                  </>
                )}
              </>
            )}

            {/* Go Live Button - DISABLED */}
            {!isRecording && !isLive && !hasStoppedRecording && (
              <div
                style={{
                  width: '55px',
                  height: '55px',
                  background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 50%, #4b5563 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'not-allowed',
                  boxShadow: '0 4px 15px rgba(156, 163, 175, 0.3), 0 2px 8px rgba(156, 163, 175, 0.2)',
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                  opacity: 0.6,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  right: '0',
                  bottom: '0',
                  background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
                  borderRadius: '50%'
                }} />
                <IonIcon icon={videocam} style={{ fontSize: '24px', color: 'white', position: 'relative', zIndex: 1, opacity: 0.7 }} />
              </div>
            )}

            {/* Stop Live Button */}
            {isLive && (
              <div
                onClick={stopLive}
                style={{
                  width: '55px',
                  height: '55px',
                  background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #7f1d1d 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(127, 29, 29, 0.4), 0 4px 10px rgba(127, 29, 29, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 12px 35px rgba(127, 29, 29, 0.5), 0 6px 15px rgba(127, 29, 29, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(127, 29, 29, 0.4), 0 4px 10px rgba(127, 29, 29, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  right: '0',
                  bottom: '0',
                  background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 50%)',
                  borderRadius: '50%'
                }} />
                <IonIcon icon={stop} style={{ fontSize: '24px', color: 'white', position: 'relative', zIndex: 1 }} />
              </div>
            )}
          </div>
        </IonFooter>
        )}

        {/* Alert */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Alert"
          message={alertMessage}
          buttons={['OK']}
        />
      </IonContent>

      <style>
        {`
          @keyframes wavePulse {
            0% { height: 8px; opacity: 0.6; }
            25% { height: 25px; opacity: 0.8; }
            50% { height: 35px; opacity: 1; }
            75% { height: 20px; opacity: 0.9; }
            100% { height: 12px; opacity: 0.7; }
          }

          @keyframes radiate1 {
            0% { transform: scale(0.8); opacity: 0.8; }
            50% { transform: scale(1.1); opacity: 0.4; }
            100% { transform: scale(0.8); opacity: 0.8; }
          }

          @keyframes radiate2 {
            0% { transform: scale(0.9); opacity: 0.7; }
            50% { transform: scale(1.2); opacity: 0.3; }
            100% { transform: scale(0.9); opacity: 0.7; }
          }

          @keyframes radiate3 {
            0% { transform: scale(1.0); opacity: 0.6; }
            50% { transform: scale(1.3); opacity: 0.2; }
            100% { transform: scale(1.0); opacity: 0.6; }
          }

          @keyframes radiate4 {
            0% { transform: scale(1.1); opacity: 0.5; }
            50% { transform: scale(1.4); opacity: 0.1; }
            100% { transform: scale(1.1); opacity: 0.5; }
          }

          @keyframes waveSmooth {
            0% { transform: scaleY(0.5); opacity: 0.7; }
            50% { transform: scaleY(1.2); opacity: 1; }
            100% { transform: scaleY(0.8); opacity: 0.9; }
          }

          @keyframes wave {
            0% { height: 10px; }
            100% { height: 40px; }
          }

          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }

          @keyframes progressBar {
            0% { width: 0%; }
            100% { width: 100%; }
          }
    
          @keyframes livePulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.6;
              transform: scale(1.2);
            }
          }
        `}
      </style>
    </IonPage>
  );
};

export default AdminGoLive;