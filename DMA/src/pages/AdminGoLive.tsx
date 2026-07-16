import React, { useState, useRef, useEffect, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import apiService, { BACKEND_BASE_URL } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonAlert,
  IonText,
} from '@ionic/react';
import {
  mic, play, pause, stop, radio, image, arrowBack, download, cloudUpload,
  documentText, musicalNotes, send
} from 'ionicons/icons';
import { AuthContext } from '../App';
import './AdminDashboard.css';

const STEP_SETUP = 0;
const STEP_RECORDING = 1;
const STEP_REVIEW = 2;
const STEP_PUBLISHED = 3;



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
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveBroadcastId, setLiveBroadcastId] = useState<string | null>(null);
  const [isLiveGoing, setIsLiveGoing] = useState(false);
  const [audioEnhancement, setAudioEnhancement] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  useContext(AuthContext);
  const { socket: liveSocket } = useSocket();
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const currentStep = !isRecording && !hasStoppedRecording ? STEP_SETUP
    : isRecording ? STEP_RECORDING
    : hasStoppedRecording && !isPublishing ? STEP_REVIEW
    : STEP_PUBLISHED;

  useEffect(() => {
    return () => { cleanup(); };
  }, []);

  useEffect(() => {
    if (!recordedBlob) return;
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    const url = URL.createObjectURL(recordedBlob);
    blobUrlRef.current = url;
    if (audioPreviewRef.current) audioPreviewRef.current.src = url;
  }, [recordedBlob]);

  // Poll for live broadcast comments
  useEffect(() => {
    if (!liveBroadcastId) return;
    const fetchComments = async () => {
      try {
        const res = await fetch(`${BACKEND_BASE_URL}/api/comments/${liveBroadcastId}?_t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          setComments(data.comments || []);
        }
      } catch {}
    };
    fetchComments();
    const interval = setInterval(fetchComments, 5000);
    return () => clearInterval(interval);
  }, [liveBroadcastId]);

  const cleanup = () => {
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') audioContextRef.current.close();
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
  };

  const formatTime = (seconds: number) => {
    const totalSecs = Math.floor(seconds);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const drawVisualizer = () => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const draw = () => {
      if (!analyserRef.current || !canvas || !ctx) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);
      const barCount = 48;
      const step = Math.floor(bufferLength / barCount);
      const barWidth = (width - (barCount - 1) * 3) / barCount;
      for (let i = 0; i < barCount; i++) {
        const idx = i * step;
        const value = dataArray[idx] / 255;
        const barHeight = Math.max(2, value * height * 0.9);
        const x = i * (barWidth + 3);
        const y = height - barHeight;
        const gradient = ctx.createLinearGradient(x, y, x, height);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(0.5, '#a855f7');
        gradient.addColorStop(1, '#d946ef');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }
      animationFrameRef.current = requestAnimationFrame(draw);
    };
    draw();
  };

  const startRecording = async () => {
    if (!title.trim()) {
      setAlertMessage('Please enter a broadcast title before starting.');
      setShowAlert(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: audioEnhancement,
          noiseSuppression: audioEnhancement,
          autoGainControl: audioEnhancement,
          sampleRate: 44100,
          channelCount: 1
        }
      });
      streamRef.current = stream;
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      const mimeType = (() => {
        const types = ['audio/mp4;codecs=mp4a.40.2', 'audio/webm;codecs=opus', 'audio/webm', 'audio/wav'];
        for (const t of types) { if (MediaRecorder.isTypeSupported(t)) return t; }
        return 'audio/webm';
      })();
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      recordedChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
          if (isLiveMode && liveBroadcastId && liveSocket?.connected) {
            e.data.arrayBuffer().then(buf => {
              const bytes = new Uint8Array(buf);
              let binary = '';
              for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
              liveSocket.emit('broadcast:audio', {
                broadcastId: liveBroadcastId,
                chunk: btoa(binary),
                mimeType: mr.mimeType || 'audio/webm'
              });
            }).catch(() => {});
          }
        }
      };
      mr.onerror = () => { setAlertMessage('Recording failed. Check your microphone.'); setShowAlert(true); stopRecording(); };
      mr.onstop = () => {
        if (isLiveMode && liveBroadcastId && liveSocket?.connected) {
          liveSocket.emit('broadcast:leave-room', liveBroadcastId);
        }
        if (recordedChunksRef.current.length === 0) return;
        const blob = new Blob(recordedChunksRef.current, { type: mr.mimeType || 'audio/webm' });
        setRecordedBlob(blob);
        recordedChunksRef.current = [];
      };
      mr.start(2000); // timeslice — send chunks every 2s for live relay
      setIsRecording(true);
      setIsPaused(false);
      setHasStoppedRecording(false);
      setIsPlayingPreview(false);
      setAudioDuration(0);
      setCurrentTime(0);
      setRecordedBlob(null);
      recordingIntervalRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
      setTimeout(() => {
        if (canvasRef.current) {
          canvasRef.current.width = canvasRef.current.offsetWidth;
          canvasRef.current.height = 120;
          drawVisualizer();
        }
      }, 100);
    } catch (err: any) {
      let msg = 'Failed to access microphone: ';
      if (err.name === 'NotAllowedError') msg += 'Permission denied.';
      else if (err.name === 'NotFoundError') msg += 'No microphone found.';
      else if (err.name === 'NotReadableError') msg += 'Microphone in use by another app.';
      else msg += err.message || 'Unknown error';
      setAlertMessage(msg);
      setShowAlert(true);
    }
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      recordingIntervalRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      setHasStoppedRecording(true);
      // Clear live mode state so subsequent publish doesn't target the same broadcast
      setIsLiveMode(false);
      setLiveBroadcastId(null);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      cleanup();
      if (liveBroadcastId && isLiveMode) {
        try { await apiService.stopLiveBroadcast(liveBroadcastId); } catch (err: any) {
          console.error('Failed to stop live broadcast:', err);
        }
      }
    }
  };

  const uploadPodcast = async (blob: Blob, duration: string) => {
    let ext = 'webm';
    if (blob.type.includes('mp4')) ext = 'm4a';
    else if (blob.type.includes('wav')) ext = 'wav';
    else if (blob.type.includes('ogg')) ext = 'ogg';
    const fd = new FormData();
    fd.append('audioFile', blob, `podcast-${Date.now()}.${ext}`);
    fd.append('duration', duration);
    if (thumbnailFile) fd.append('thumbnailFile', thumbnailFile);
    try {
      if (liveBroadcastId) {
        // Upload recording to existing live broadcast (converts it to a podcast in-place)
        await apiService.uploadLiveBroadcastRecording(liveBroadcastId, fd);
      } else {
        fd.append('title', title || 'Untitled Podcast');
        fd.append('speaker', 'Dove Church');
        fd.append('description', description || '');
        fd.append('status', 'published');
        await apiService.createPodcast(fd);
      }
      // Clear live mode state to prevent double-creation on subsequent publishes
      setIsLiveMode(false);
      setLiveBroadcastId(null);
      setAlertMessage(`"${title || 'Untitled'}" published!`);
      setShowAlert(true);
      sessionStorage.setItem('podcastsNeedRefresh', 'true');
      setTimeout(() => history.push('/admin/radio'), 1500);
    } catch (err: any) {
      setAlertMessage(`Failed to publish: ${err.message || 'Please try again.'}`);
      setShowAlert(true);
      setIsPublishing(false);
    }
  };

  const publishPreview = async () => {
    if (recordedBlob) {
      setIsPublishing(true);
      const duration = formatTime(recordingTime);
      await uploadPodcast(recordedBlob, duration);
      setIsPublishing(false);
    }
  };

  const goLiveWithRecording = async () => {
    if (!recordedBlob || !title.trim()) {
      setAlertMessage('Please enter a title before going live.');
      setShowAlert(true);
      return;
    }
    setIsLiveGoing(true);
    try {
      // Use existing live broadcast if available, otherwise create a new one
      let liveId = liveBroadcastId;
      if (!liveId) {
        const broadcast = await apiService.startLiveBroadcast({ title, description, speaker: 'Dove Church' });
        liveId = broadcast?._id || broadcast?.id || broadcast?.broadcast?._id;
        if (!liveId) { throw new Error('Could not get live broadcast ID'); }
        await apiService.stopLiveBroadcast(liveId);
      }
      const fd = new FormData();
      let ext = 'webm';
      if (recordedBlob.type.includes('mp4')) ext = 'm4a';
      else if (recordedBlob.type.includes('wav')) ext = 'wav';
      else if (recordedBlob.type.includes('ogg')) ext = 'ogg';
      fd.append('audioFile', recordedBlob, `podcast-${Date.now()}.${ext}`);
      fd.append('duration', formatTime(recordingTime));
      if (thumbnailFile) fd.append('thumbnailFile', thumbnailFile);
      await apiService.uploadLiveBroadcastRecording(liveId, fd);
      setIsLiveMode(false);
      setLiveBroadcastId(null);
      setAlertMessage(`"${title}" is now live and published!`);
      setShowAlert(true);
      sessionStorage.setItem('podcastsNeedRefresh', 'true');
      setTimeout(() => history.push('/admin/radio'), 1500);
    } catch (err: any) {
      setAlertMessage(`Failed to go live: ${err.message || 'Please try again.'}`);
      setShowAlert(true);
    } finally {
      setIsLiveGoing(false);
    }
  };

  const startLiveBroadcastMode = async () => {
    if (!title.trim()) {
      setAlertMessage('Please enter a broadcast title.');
      setShowAlert(true);
      return;
    }
    try {
      const broadcast = await apiService.startLiveBroadcast({ title, description, speaker: 'Dove Church' });
      const liveId = broadcast?._id || broadcast?.id || broadcast?.broadcast?._id;
      setLiveBroadcastId(liveId);
      setIsLiveMode(true);
      if (liveSocket?.connected) liveSocket.emit('broadcast:join-room', liveId);
      await startRecording();
    } catch (err: any) {
      setAlertMessage(`Failed to start live broadcast: ${err.message || 'Please try again.'}`);
      setShowAlert(true);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setThumbnailFile(file); setThumbnail(URL.createObjectURL(file)); }
  };

  const togglePreview = () => {
    if (audioPreviewRef.current) {
      if (isPlayingPreview) { audioPreviewRef.current.pause(); setIsPlayingPreview(false); }
      else { audioPreviewRef.current.play().catch(() => {}); setIsPlayingPreview(true); }
    }
  };

  const seekPreview = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioPreviewRef.current && audioDuration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const seek = ((e.clientX - rect.left) / rect.width) * audioDuration;
      audioPreviewRef.current.currentTime = seek;
      setCurrentTime(seek);
    }
  };

  const downloadRecording = () => {
    if (!recordedBlob) return;
    const url = URL.createObjectURL(recordedBlob);
    let ext = 'webm';
    if (recordedBlob.type.includes('mp4')) ext = 'm4a';
    else if (recordedBlob.type.includes('wav')) ext = 'wav';
    else if (recordedBlob.type.includes('ogg')) ext = 'ogg';
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !liveBroadcastId) return;
    setIsSubmittingComment(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          contentId: liveBroadcastId,
          contentType: 'live_broadcast'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setComments(prev => [data.comment, ...prev]);
        setNewComment('');
      }
    } catch {}
    setIsSubmittingComment(false);
  };

  const resetAll = () => {
    setTitle('');
    setDescription('');
    setThumbnail('');
    setThumbnailFile(null);
    setRecordingTime(0);
    setHasStoppedRecording(false);
    setRecordedBlob(null);
    setAudioDuration(0);
    setCurrentTime(0);
    setIsPublishing(false);
    setIsPlayingPreview(false);
    setIsLiveMode(false);
    setLiveBroadcastId(null);
    if (audioPreviewRef.current) audioPreviewRef.current.src = '';
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
  };

  const heroAccent = currentStep === STEP_SETUP
    ? '#e11d48'
    : currentStep === STEP_RECORDING
      ? '#be123c'
      : '#0d9488';

  return (
    <IonPage>
      <style>{`
        .gl-page { padding: 16px; max-width: 800px; margin: 0 auto; padding-bottom: 100px; }
        .gl-hero { position: relative; margin-bottom: 32px; }
        .gl-hero-top { border-radius: 28px; padding: 32px 28px 56px; position: relative; overflow: hidden; background: rgba(255,255,255,0.55); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); border: 1px solid rgba(255,255,255,0.5); box-shadow: 0 4px 24px rgba(0,0,0,0.04); }
        .gl-hero-top::before { content: ''; position: absolute; top: -60%; right: -30%; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, rgba(225,29,72,0.08) 0%, transparent 70%); pointer-events: none; }
        .gl-hero-top::after { content: ''; position: absolute; bottom: -40%; left: -20%; width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%); pointer-events: none; }
        .gl-hero-inner { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 14px; }
        .gl-hero-row1 { display: flex; align-items: center; justify-content: space-between; }
        .gl-hero-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px 5px 10px; border-radius: 999px; background: rgba(0,0,0,0.04); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: rgba(0,0,0,0.5); }
        .gl-hero-chip-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        @keyframes fn-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(0.6); } }
        .gl-hero-step { font-size: 10px; font-weight: 600; color: rgba(0,0,0,0.25); letter-spacing: 0.5px; }
        .gl-hero-title { margin: 0; font-size: 34px; font-weight: 800; color: #1c1c1e; letter-spacing: -1px; line-height: 1.1; }
        .gl-hero-desc { margin: 0; font-size: 13px; font-weight: 400; color: rgba(0,0,0,0.35); line-height: 1.5; max-width: 340px; }
        .gl-hero-timer-card { position: relative; z-index: 2; margin: -28px 16px 0; padding: 14px 20px; border-radius: 18px; background: rgba(255,255,255,0.75); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); border: 1px solid rgba(255,255,255,0.5); box-shadow: 0 8px 32px rgba(0,0,0,0.06); display: flex; align-items: center; justify-content: space-between; }
        .gl-hero-timer-left { display: flex; align-items: center; gap: 12px; }
        .gl-hero-timer-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f43f5e, #e11d48); flex-shrink: 0; }
        .gl-hero-timer-icon.rec { background: linear-gradient(135deg, #e11d48, #be123c); }
        .gl-hero-timer-icon.done { background: linear-gradient(135deg, #2dd4bf, #0d9488); }
        .gl-hero-timer-icon ion-icon { font-size: 16px; color: white; }
        .gl-hero-timer-info { display: flex; flex-direction: column; }
        .gl-hero-timer-num { font-size: 22px; font-weight: 800; color: #1c1c1e; line-height: 1; letter-spacing: -0.3px; font-variant-numeric: tabular-nums; }
        .gl-hero-timer-lbl { font-size: 9px; font-weight: 600; color: #aeaeb2; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px; }
        .gl-hero-timer-track { height: 4px; border-radius: 2px; background: rgba(0,0,0,0.06); width: 100px; overflow: hidden; margin-left: auto; }
        .gl-hero-timer-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg, #f43f5e, #e11d48); transition: width 0.3s linear; }
        .gl-hero-timer-fill.rec { background: linear-gradient(90deg, #e11d48, #be123c); }
        .gl-hero-timer-fill.done { background: linear-gradient(90deg, #2dd4bf, #0d9488); }

        .gl-progress { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }
        .gl-step { display: flex; align-items: center; gap: 8px; flex: 1; }
        .gl-step-dot { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; transition: all 0.3s; }
        .gl-step-dot.active { background: #6366f1; color: white; box-shadow: 0 4px 12px rgba(99,102,241,0.3); }
        .gl-step-dot.done { background: #10b981; color: white; }
        .gl-step-dot.pending { background: rgba(0,0,0,0.06); color: #8e8e93; }
        .gl-step-label { font-size: 11px; font-weight: 600; color: #8e8e93; white-space: nowrap; }
        .gl-step-line { flex: 1; height: 2px; background: rgba(0,0,0,0.08); border-radius: 1px; }
        .gl-step-line.done { background: #10b981; }

        .gl-card { background: var(--ios26-card-bg-light); border: 1px solid var(--ios26-separator-light); border-radius: 20px; padding: 20px; margin-bottom: 16px; transition: all 0.2s; }
        .gl-card-title { font-size: 13px; font-weight: 700; color: #1c1c1e; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px; }
        .gl-field { margin-bottom: 16px; }
        .gl-field:last-child { margin-bottom: 0; }
        .gl-label { display: block; font-size: 11px; font-weight: 600; color: #8e8e93; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .gl-input-wrap { position: relative; }
        .gl-input-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #6366f1; font-size: 16px; pointer-events: none; }
        .gl-input { width: 100%; padding: 12px 14px 12px 40px; border-radius: 14px; border: 1px solid var(--ios26-separator-light); background: var(--ios26-card-bg-light); color: var(--ion-text-color); font-size: 14px; outline: none; font-family: inherit; transition: border-color 0.2s; }
        .gl-input:focus { border-color: #6366f1; }
        .gl-textarea { width: 100%; padding: 12px 14px 12px 40px; border-radius: 14px; border: 1px solid var(--ios26-separator-light); background: var(--ios26-card-bg-light); color: var(--ion-text-color); font-size: 14px; outline: none; font-family: inherit; resize: vertical; min-height: 80px; transition: border-color 0.2s; }
        .gl-textarea:focus { border-color: #6366f1; }
        .gl-upload { width: 100%; padding: 14px; border-radius: 14px; border: 2px dashed var(--ios26-separator-light); background: var(--ios26-card-bg-light); cursor: pointer; display: flex; align-items: center; gap: 12px; color: var(--ion-text-color); font-size: 13px; font-weight: 500; font-family: inherit; transition: all 0.2s; }
        .gl-upload:hover { border-color: #6366f1; background: rgba(99,102,241,0.04); }
        .gl-upload-preview { width: 40px; height: 40px; object-fit: cover; border-radius: 10px; flex-shrink: 0; }

        .gl-record-btn { width: 128px; height: 128px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; position: relative; margin: 0 auto; background: linear-gradient(145deg, #e11d48 0%, #be123c 50%, #881337 100%); box-shadow: 0 24px 64px rgba(190,18,60,0.35), inset 0 1px 0 rgba(255,255,255,0.15); transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease; }
        .gl-record-btn:hover { transform: scale(1.06); box-shadow: 0 32px 80px rgba(190,18,60,0.4), inset 0 1px 0 rgba(255,255,255,0.15); }
        .gl-record-btn:active { transform: scale(0.96); box-shadow: 0 8px 32px rgba(190,18,60,0.3), inset 0 1px 0 rgba(255,255,255,0.1); }
        .gl-record-btn .gl-shine { position: absolute; inset: 0; border-radius: 50%; background: radial-gradient(ellipse at 28% 18%, rgba(255,255,255,0.3) 0%, transparent 55%); pointer-events: none; }
        .gl-record-btn .gl-ring-1, .gl-record-btn .gl-ring-2, .gl-record-btn .gl-ring-3 { position: absolute; border-radius: 50%; border: 1.5px solid rgba(225,29,72,0.25); pointer-events: none; }
        .gl-record-btn .gl-ring-1 { inset: -8px; animation: gl-expand 2.8s ease-out infinite; }
        .gl-record-btn .gl-ring-2 { inset: -8px; animation: gl-expand 2.8s ease-out infinite 0.6s; }
        .gl-record-btn .gl-ring-3 { inset: -8px; animation: gl-expand 2.8s ease-out infinite 1.2s; }
        @keyframes gl-expand { 0% { transform: scale(0.9); opacity: 0.6; } 100% { transform: scale(1.35); opacity: 0; } }
        .gl-record-btn .gl-icon { position: relative; z-index: 1; font-size: 48px; color: white; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.15)); }

        .gl-controls { display: flex; align-items: center; justify-content: center; gap: 24px; padding: 8px 0; }
        .gl-ctrl-btn { width: 52px; height: 52px; border-radius: 16px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .gl-ctrl-btn:hover { transform: scale(1.1); }
        .gl-ctrl-btn:active { transform: scale(0.92); }
        .gl-ctrl-btn.pause { background: linear-gradient(145deg, #f59e0b, #d97706); box-shadow: 0 6px 20px rgba(245,158,11,0.3), inset 0 1px 0 rgba(255,255,255,0.15); }
        .gl-ctrl-btn.resume { background: linear-gradient(145deg, #10b981, #059669); box-shadow: 0 6px 20px rgba(16,185,129,0.3), inset 0 1px 0 rgba(255,255,255,0.15); }
        .gl-ctrl-btn.stop { width: 60px; height: 60px; border-radius: 18px; background: linear-gradient(145deg, #e11d48, #be123c); box-shadow: 0 8px 24px rgba(190,18,60,0.35), inset 0 1px 0 rgba(255,255,255,0.15); }
        .gl-ctrl-btn.stop:hover { box-shadow: 0 12px 32px rgba(190,18,60,0.4), inset 0 1px 0 rgba(255,255,255,0.15); }
        .gl-ctrl-icon { font-size: 20px; color: white; filter: drop-shadow(0 1px 4px rgba(0,0,0,0.1)); }
        .gl-ctrl-stop-icon { width: 20px; height: 20px; border-radius: 5px; background: white; box-shadow: inset 0 1px 2px rgba(0,0,0,0.1); }
        .gl-status { text-align: center; margin-top: 10px; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; }
        .gl-status.rec { color: #e11d48; animation: gl-blink 1.2s ease-in-out infinite; }
        .gl-status.paused { color: #f59e0b; }

        .gl-visualizer { border-radius: 16px; overflow: hidden; margin-bottom: 16px; background: rgba(0,0,0,0.03); }
        .gl-visualizer canvas { width: 100%; height: 120px; display: block; }
        .gl-preview-bar { height: 6px; background: rgba(0,0,0,0.06); border-radius: 3px; overflow: hidden; cursor: pointer; position: relative; }
        .gl-preview-fill { height: 100%; background: linear-gradient(90deg, #10b981 0%, #059669 100%); border-radius: 3px; transition: width 0.1s linear; }
        .gl-preview-times { display: flex; justify-content: space-between; margin-top: 6px; font-size: 11px; color: #8e8e93; font-weight: 500; }

        .gl-publish-btn { width: 100%; padding: 16px 24px; border-radius: 16px; border: none; cursor: pointer; font-size: 15px; font-weight: 700; color: white; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; font-family: inherit; }
        .gl-publish-btn:hover { transform: translateY(-1px); }
        .gl-publish-btn:active { transform: scale(0.98); }
        .gl-publish-btn:disabled { cursor: not-allowed; opacity: 0.6; transform: none; }
        .gl-publish-btn.primary { background: linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow: 0 8px 24px rgba(16,185,129,0.3); }
        .gl-publish-btn.secondary { background: transparent; border: 1px solid var(--ios26-separator-light); color: #6366f1; box-shadow: none; }
        .gl-spinner { width: 16px; height: 16px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: gl-spin 0.8s linear infinite; }
        @keyframes gl-spin { to { transform: rotate(360deg); } }

        .gl-footer { text-align: center; padding: 16px 0; margin-top: 12px; border-top: 1px solid var(--ios26-separator-light); }
        .gl-footer ion-text { color: #aeaeb2; font-size: 11px; }

        [data-theme="dark"] .gl-card { background: #1c1c1e !important; border-color: rgba(84,84,88,0.36) !important; }
        [data-theme="dark"] .gl-card-title { color: #fff !important; }
        [data-theme="dark"] .gl-input { background: #1c1c1e !important; color: #fff !important; border-color: rgba(84,84,88,0.36) !important; }
        [data-theme="dark"] .gl-textarea { background: #1c1c1e !important; color: #fff !important; border-color: rgba(84,84,88,0.36) !important; }
        [data-theme="dark"] .gl-upload { background: #1c1c1e !important; border-color: rgba(84,84,88,0.36) !important; color: #fff !important; }
        [data-theme="dark"] .gl-upload:hover { border-color: #6366f1 !important; background: rgba(99,102,241,0.08) !important; }
        [data-theme="dark"] .gl-step-dot.pending { background: rgba(255,255,255,0.08) !important; color: #98989d !important; }
        [data-theme="dark"] .gl-step-line { background: rgba(255,255,255,0.08) !important; }
        [data-theme="dark"] .gl-footer { border-top-color: rgba(84,84,88,0.36) !important; }
        [data-theme="dark"] .gl-footer ion-text { color: #98989d !important; }
        [data-theme="dark"] .gl-publish-btn.secondary { border-color: rgba(84,84,88,0.36) !important; }
        [data-theme="dark"] .gl-visualizer { background: rgba(255,255,255,0.03) !important; }
        [data-theme="dark"] .gl-preview-bar { background: rgba(255,255,255,0.08) !important; }
        [data-theme="dark"] .gl-hero-top { background: rgba(28,28,30,0.6) !important; border-color: rgba(255,255,255,0.06) !important; }
        [data-theme="dark"] .gl-hero-top::before { background: radial-gradient(circle, rgba(225,29,72,0.12) 0%, transparent 70%) !important; }
        [data-theme="dark"] .gl-hero-top::after { background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%) !important; }
        [data-theme="dark"] .gl-hero-chip { background: rgba(255,255,255,0.06) !important; color: rgba(255,255,255,0.5) !important; }
        [data-theme="dark"] .gl-hero-step { color: rgba(255,255,255,0.25) !important; }
        [data-theme="dark"] .gl-hero-title { color: #fff !important; }
        [data-theme="dark"] .gl-hero-desc { color: rgba(255,255,255,0.35) !important; }
        [data-theme="dark"] .gl-hero-timer-card { background: rgba(28,28,30,0.6) !important; border-color: rgba(255,255,255,0.06) !important; }
        [data-theme="dark"] .gl-hero-timer-num { color: #fff !important; }
        [data-theme="dark"] .gl-hero-timer-lbl { color: #98989d !important; }
        [data-theme="dark"] .gl-hero-timer-track { background: rgba(255,255,255,0.08) !important; }

        @media (max-width: 576px) {
          .gl-page { padding: 12px; }
          .gl-hero-top { padding: 24px 20px 48px; border-radius: 24px; }
          .gl-hero-title { font-size: 26px; }
          .gl-hero-timer-card { margin: -24px 12px 0; padding: 12px 16px; }
          .gl-hero-timer-num { font-size: 18px; }
          .gl-hero-timer-icon { width: 30px; height: 30px; }
          .gl-hero-timer-track { width: 60px; }
          .gl-card { padding: 16px; }
          .gl-record-btn { width: 104px; height: 104px; }
          .gl-record-btn .gl-icon { font-size: 40px; }
          .gl-ctrl-btn.stop { width: 52px; height: 52px; border-radius: 16px; }
          .gl-ctrl-stop-icon { width: 16px; height: 16px; }
          .gl-step-label { font-size: 10px; }
        }
      `}</style>

      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()} style={{ marginLeft: '4px' }}>
            <IonIcon icon={arrowBack} style={{ fontSize: '22px' }} />
          </IonButton>
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>
            {currentStep === STEP_RECORDING ? 'Recording' : currentStep === STEP_REVIEW ? 'Review' : 'Go Live'}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div className="gl-page">
          {/* Hero */}
          <div className="gl-hero">
            <div className="gl-hero-top">
              <div className="gl-hero-inner">
                <div className="gl-hero-row1">
                  <span className="gl-hero-chip">
                    <span className="gl-hero-chip-dot" style={{
                      background: currentStep === STEP_SETUP ? '#e11d48' : currentStep === STEP_RECORDING ? (isPaused ? '#f59e0b' : '#be123c') : '#0d9488',
                      animation: currentStep === STEP_RECORDING && !isPaused ? 'fn-pulse 1.2s ease-in-out infinite' : 'none',
                    }} />
                    {currentStep === STEP_SETUP && 'Setup'}
                    {currentStep === STEP_RECORDING && (isPaused ? 'Paused' : isLiveMode ? 'Live' : 'Recording')}
                    {currentStep === STEP_REVIEW && 'Review'}
                  </span>
                  <span className="gl-hero-step">
                    {currentStep === STEP_SETUP && '1 / 3'}
                    {currentStep === STEP_RECORDING && '2 / 3'}
                    {currentStep === STEP_REVIEW && '3 / 3'}
                  </span>
                </div>
                <h1 className="gl-hero-title">
                  {title || (currentStep === STEP_SETUP ? 'Go Live' : currentStep === STEP_RECORDING ? 'Recording' : 'Ready to Publish')}
                </h1>
                <p className="gl-hero-desc">
                  {currentStep === STEP_SETUP && 'Fill in the details below and tap the record button'}
                  {currentStep === STEP_RECORDING && (isPaused ? 'Recording is paused — tap resume to continue' : 'Microphone is live — tap stop when you\'re done')}
                  {currentStep === STEP_REVIEW && 'Listen to your recording, then publish or start over'}
                </p>
              </div>
            </div>
            <div className="gl-hero-timer-card">
              <div className="gl-hero-timer-left">
                <div className={`gl-hero-timer-icon ${currentStep === STEP_RECORDING ? 'rec' : currentStep >= STEP_REVIEW ? 'done' : ''}`}>
                  <IonIcon icon={currentStep >= STEP_REVIEW ? musicalNotes : mic} />
                </div>
                <div className="gl-hero-timer-info">
                  <span className="gl-hero-timer-num">{formatTime(recordingTime)}</span>
                  <span className="gl-hero-timer-lbl">{currentStep === STEP_RECORDING ? 'Elapsed' : currentStep >= STEP_REVIEW ? 'Duration' : 'Ready'}</span>
                </div>
              </div>
              {currentStep === STEP_RECORDING && (
                <div className="gl-hero-timer-track">
                  <div className={`gl-hero-timer-fill ${currentStep === STEP_RECORDING ? 'rec' : currentStep >= STEP_REVIEW ? 'done' : ''}`}
                    style={{ width: `${Math.min((recordingTime / 3600) * 100, 100)}%` }} />
                </div>
              )}
            </div>
          </div>

          {/* Progress Steps */}
          <div className="gl-progress">
            <div className="gl-step">
              <div className={`gl-step-dot ${currentStep >= STEP_SETUP ? (currentStep > STEP_SETUP ? 'done' : 'active') : 'pending'}`}>
                {currentStep > STEP_SETUP ? '\u2713' : '1'}
              </div>
              <span className="gl-step-label">Setup</span>
              <div className={`gl-step-line ${currentStep > STEP_SETUP ? 'done' : ''}`} />
            </div>
            <div className="gl-step">
              <div className={`gl-step-dot ${currentStep >= STEP_RECORDING ? (currentStep > STEP_RECORDING ? 'done' : 'active') : 'pending'}`}>
                {currentStep > STEP_RECORDING ? '\u2713' : '2'}
              </div>
              <span className="gl-step-label">Record</span>
              <div className={`gl-step-line ${currentStep > STEP_RECORDING ? 'done' : ''}`} />
            </div>
            <div className="gl-step">
              <div className={`gl-step-dot ${currentStep >= STEP_REVIEW ? (currentStep > STEP_REVIEW ? 'done' : 'active') : 'pending'}`}>
                {currentStep > STEP_REVIEW ? '\u2713' : '3'}
              </div>
              <span className="gl-step-label">Publish</span>
              <div className={`gl-step-line ${currentStep > STEP_REVIEW ? 'done' : ''}`} />
            </div>
          </div>

          {/* STEP 1: Setup Form */}
          {currentStep === STEP_SETUP && (
            <div className="gl-card">
              <h3 className="gl-card-title">
                <IonIcon icon={radio} style={{ color: '#6366f1', fontSize: '18px' }} />
                Broadcast Details
              </h3>
              <div className="gl-field">
                <label className="gl-label">Title <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="gl-input-wrap">
                  <IonIcon icon={musicalNotes} className="gl-input-icon" />
                  <input className="gl-input" type="text" value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Sunday Sermon - July 16" />
                </div>
              </div>
              <div className="gl-field">
                <label className="gl-label">Description</label>
                <div className="gl-input-wrap">
                  <IonIcon icon={documentText} className="gl-input-icon" style={{ top: '14px', transform: 'none' }} />
                  <textarea className="gl-textarea" value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Brief description of this broadcast..." />
                </div>
              </div>
              <div className="gl-field" style={{ marginBottom: 0 }}>
                <label className="gl-label">Thumbnail</label>
                <button className="gl-upload" onClick={() => thumbnailInputRef.current?.click()}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--ios26-separator-light)'}>
                  <IonIcon icon={image} style={{ fontSize: '20px', color: '#6366f1', flexShrink: 0 }} />
                  <span style={{ flex: 1, textAlign: 'left' }}>{thumbnailFile ? thumbnailFile.name : 'Upload artwork'}</span>
                  {thumbnail && <img src={thumbnail} alt="" className="gl-upload-preview" />}
                </button>
                <input ref={thumbnailInputRef} type="file" accept="image/*" onChange={handleThumbnailChange} style={{ display: 'none' }} />
              </div>
              <div className="gl-field" style={{ marginBottom: 0 }}>
                <label className="gl-label">Audio Enhancement</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0' }}>
                  <div
                    onClick={() => setAudioEnhancement(!audioEnhancement)}
                    style={{
                      width: '44px', height: '24px', borderRadius: '12px',
                      background: audioEnhancement ? '#10b981' : 'rgba(128,128,128,0.25)',
                      position: 'relative', cursor: 'pointer', flexShrink: 0,
                      transition: 'background 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%',
                      background: 'white', position: 'absolute', top: '3px',
                      left: audioEnhancement ? '23px' : '3px',
                      transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--ion-text-color)' }}>
                    {audioEnhancement ? 'Noise cancellation & echo reduction on' : 'Raw microphone (no processing)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Record Button */}
          {currentStep === STEP_SETUP && (
            <div className="gl-card" style={{ textAlign: 'center', padding: '36px 20px 28px' }}>
              <button className="gl-record-btn" onClick={startRecording}>
                <span className="gl-ring-1" />
                <span className="gl-ring-2" />
                <span className="gl-ring-3" />
                <div className="gl-shine" />
                <IonIcon icon={mic} className="gl-icon" />
              </button>
              <p style={{ margin: '20px 0 4px', fontSize: '15px', fontWeight: '700', color: 'var(--ion-text-color)' }}>Start Recording</p>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#8e8e93' }}>Microphone access required</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <div style={{ height: '1px', flex: 1, background: 'var(--ios26-separator-light)' }} />
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#aeaeb2', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Or</span>
                <div style={{ height: '1px', flex: 1, background: 'var(--ios26-separator-light)' }} />
              </div>
              <button onClick={startLiveBroadcastMode} style={{
                marginTop: '16px', width: '100%', padding: '14px 20px', borderRadius: '16px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                boxShadow: '0 8px 24px rgba(190,18,60,0.25)',
                color: 'white', fontSize: '14px', fontWeight: '700', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24', animation: 'fn-pulse 1.2s ease-in-out infinite' }} />
                Go Live Now
              </button>
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#aeaeb2' }}>Starts live broadcast + records simultaneously</p>
            </div>
          )}

          {/* STEP 2: Recording Interface */}
          {currentStep === STEP_RECORDING && (
            <>
              <div className="gl-visualizer">
                <canvas ref={canvasRef} />
              </div>
              <div className="gl-card" style={{ textAlign: 'center', padding: '20px 20px 18px' }}>
                {isLiveMode && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 14px 3px 10px', borderRadius: '999px', background: 'rgba(225,29,72,0.1)', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#e11d48', marginBottom: '12px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e11d48', animation: 'fn-pulse 1.2s ease-in-out infinite' }} />
                    Live Broadcast
                  </div>
                )}
                <div className="gl-controls">
                  <button className={`gl-ctrl-btn ${isPaused ? 'resume' : 'pause'}`} onClick={togglePause}>
                    <IonIcon icon={isPaused ? play : pause} className="gl-ctrl-icon" />
                  </button>
                  <button className="gl-ctrl-btn stop" onClick={stopRecording}>
                    <div className="gl-ctrl-stop-icon" />
                  </button>
                </div>
                <div className={`gl-status ${isPaused ? 'paused' : 'rec'}`}>
                  {isPaused ? 'PAUSED' : isLiveMode ? 'LIVE & RECORDING' : 'RECORDING'}
                </div>
              </div>

              {/* Live Comments Feed */}
              {isLiveMode && (
                <div className="gl-card">
                  <h3 className="gl-card-title">
                    <IonIcon icon={send} style={{ color: '#6366f1', fontSize: '18px' }} />
                    Live Comments
                  </h3>

                  {/* Comment Form */}
                  <form onSubmit={handleSubmitComment} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: '1px solid var(--ios26-separator-light)',
                          background: 'var(--ios26-card-bg-light)',
                          color: 'var(--ion-text-color)',
                          fontSize: '0.85em',
                          outline: 'none',
                          fontFamily: 'inherit'
                        }}
                        disabled={isSubmittingComment}
                      />
                      <IonButton
                        type="submit"
                        fill="solid"
                        disabled={!newComment.trim() || isSubmittingComment}
                        style={{
                          '--background': 'rgba(99,102,241,0.2)',
                          '--color': '#6366f1',
                          '--border-radius': '12px',
                          fontSize: '0.85em',
                          fontWeight: '600',
                          minWidth: '44px',
                          height: '40px'
                        }}
                      >
                        <IonIcon icon={send} style={{ fontSize: '16px' }} />
                      </IonButton>
                    </div>
                  </form>

                  {/* Comments List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                    {comments.length > 0 ? (
                      comments.map((comment: any) => (
                        <div key={comment._id} style={{
                          padding: '10px',
                          borderRadius: '12px',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.06)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span style={{
                              width: '22px', height: '22px', borderRadius: '50%',
                              background: 'rgba(99,102,241,0.3)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.7em', fontWeight: '600', color: 'white', flexShrink: 0
                            }}>
                              {(comment.user?.name || 'A')[0].toUpperCase()}
                            </span>
                            <span style={{ fontSize: '0.8em', fontWeight: '600', color: 'var(--ion-text-color)' }}>
                              {comment.user?.name || 'Anonymous'}
                            </span>
                            <span style={{ fontSize: '0.65em', color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>
                              {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.85em', color: 'rgba(255,255,255,0.7)', paddingLeft: '28px', lineHeight: '1.5' }}>
                            {comment.content}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '24px', color: '#8e8e93', fontSize: '0.85em' }}>
                        No comments yet. Comments will appear here in real-time.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* STEP 3: Review & Publish */}
          {currentStep === STEP_REVIEW && (
            <>
              <div className="gl-card">
                <h3 className="gl-card-title">
                  <IonIcon icon={play} style={{ color: '#10b981', fontSize: '18px' }} />
                  Preview Recording
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <button className="gl-ctrl-btn resume" onClick={togglePreview} style={{ width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0 }}>
                    <IonIcon icon={isPlayingPreview ? pause : play} className="gl-ctrl-icon" style={{ fontSize: '18px' }} />
                  </button>
                  <div style={{ flex: 1 }}>
                    <div className="gl-preview-bar" onClick={seekPreview}>
                      <div className="gl-preview-fill" style={{ width: `${audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0}%` }} />
                    </div>
                    <div className="gl-preview-times">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(audioDuration)}</span>
                    </div>
                  </div>
                  <button className="gl-ctrl-btn" onClick={downloadRecording}
                    style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(99,102,241,0.1)' }}>
                    <IonIcon icon={download} style={{ fontSize: '18px', color: '#6366f1' }} />
                  </button>
                </div>
                <audio ref={audioPreviewRef}
                  onLoadedMetadata={e => setAudioDuration(e.currentTarget.duration)}
                  onTimeUpdate={e => setCurrentTime(e.currentTarget.currentTime)}
                  onEnded={() => { setIsPlayingPreview(false); setCurrentTime(0); }}
                  style={{ display: 'none' }} />
              </div>

              <div className="gl-card">
                <h3 className="gl-card-title">
                  <IonIcon icon={radio} style={{ color: '#10b981', fontSize: '18px' }} />
                  Broadcast Summary
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(99,102,241,0.06)' }}>
                    <div style={{ fontSize: '10px', fontWeight: '600', color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Duration</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#6366f1', marginTop: '4px' }}>{formatTime(recordingTime)}</div>
                  </div>
                  <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16,185,129,0.06)' }}>
                    <div style={{ fontSize: '10px', fontWeight: '600', color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Title</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#10b981', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button className="gl-publish-btn primary" onClick={publishPreview} disabled={isPublishing}>
                  {isPublishing ? (
                    <><div className="gl-spinner" /> Publishing...</>
                  ) : (
                    <><IonIcon icon={cloudUpload} style={{ fontSize: '18px' }} /> Publish to Podcasts</>
                  )}
                </button>
                <button className="gl-publish-btn primary" onClick={goLiveWithRecording} disabled={isLiveGoing}
                  style={{ background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)', boxShadow: '0 8px 24px rgba(190,18,60,0.25)' }}>
                  {isLiveGoing ? (
                    <><div className="gl-spinner" /> Going Live...</>
                  ) : (
                    <><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24', animation: 'fn-pulse 1.2s ease-in-out infinite' }} /> Go Live</>
                  )}
                </button>
                <button className="gl-publish-btn secondary" onClick={resetAll}>
                  <IonIcon icon={arrowBack} style={{ fontSize: '18px' }} /> Start Over
                </button>
              </div>
            </>
          )}

          <div className="gl-footer">
            <IonText>Dove Church &bull; Live Broadcast System</IonText>
          </div>
        </div>

        <IonAlert isOpen={showAlert} onDidDismiss={() => setShowAlert(false)}
          header="Alert" message={alertMessage} buttons={['OK']} />
      </IonContent>
    </IonPage>
  );
};

export default AdminGoLive;
