import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';

interface LiveAudioPlayerProps {
  broadcastId: string;
  onClose?: () => void;
}

const LiveAudioPlayer: React.FC<LiveAudioPlayerProps> = ({ broadcastId, onClose }) => {
  const { socket } = useSocket();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<string[]>([]);
  const playingRef = useRef(false);
  const blobUrlRef = useRef<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!socket || !broadcastId) return;

    socket.emit('broadcast:join-room', broadcastId);
    setConnected(true);

    const handler = (data: { chunk: string; mimeType?: string }) => {
      if (!data.chunk) return;
      chunksRef.current.push(data.chunk);

      const binary = atob(data.chunk);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const mime = data.mimeType || 'audio/webm';

      const newBlob = new Blob([bytes], { type: mime });
      const url = URL.createObjectURL(newBlob);

      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = url;

      if (!audioRef.current) {
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.play().catch(() => {});
        playingRef.current = true;
      }
    };

    socket.on('broadcast:audio', handler);

    return () => {
      socket.off('broadcast:audio', handler);
      socket.emit('broadcast:leave-room', broadcastId);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
      playingRef.current = false;
      setConnected(false);
    };
  }, [socket, broadcastId]);

  return null;
};

export default LiveAudioPlayer;
