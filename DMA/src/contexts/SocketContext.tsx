import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

type EventCallback = ((data: any) => void) | null;

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  // Devotions
  devotionCreated: EventCallback;
  devotionUpdated: EventCallback;
  devotionDeleted: EventCallback;
  onDevotionCreated: (callback: (data: any) => void) => void;
  onDevotionUpdated: (callback: (data: any) => void) => void;
  onDevotionDeleted: (callback: (data: any) => void) => void;
  // Sermons
  sermonCreated: EventCallback;
  sermonUpdated: EventCallback;
  sermonDeleted: EventCallback;
  onSermonCreated: (callback: (data: any) => void) => void;
  onSermonUpdated: (callback: (data: any) => void) => void;
  onSermonDeleted: (callback: (data: any) => void) => void;
  // Podcasts
  podcastCreated: EventCallback;
  podcastUpdated: EventCallback;
  podcastDeleted: EventCallback;
  onPodcastCreated: (callback: (data: any) => void) => void;
  onPodcastUpdated: (callback: (data: any) => void) => void;
  onPodcastDeleted: (callback: (data: any) => void) => void;
  // Events
  eventCreated: EventCallback;
  eventUpdated: EventCallback;
  eventDeleted: EventCallback;
  onEventCreated: (callback: (data: any) => void) => void;
  onEventUpdated: (callback: (data: any) => void) => void;
  onEventDeleted: (callback: (data: any) => void) => void;
  // Ministries
  ministryCreated: EventCallback;
  ministryUpdated: EventCallback;
  ministryDeleted: EventCallback;
  onMinistryCreated: (callback: (data: any) => void) => void;
  onMinistryUpdated: (callback: (data: any) => void) => void;
  onMinistryDeleted: (callback: (data: any) => void) => void;
}

const initialContextValue: SocketContextType = {
  socket: null,
  isConnected: false,
  devotionCreated: null,
  devotionUpdated: null,
  devotionDeleted: null,
  onDevotionCreated: () => {},
  onDevotionUpdated: () => {},
  onDevotionDeleted: () => {},
  sermonCreated: null,
  sermonUpdated: null,
  sermonDeleted: null,
  onSermonCreated: () => {},
  onSermonUpdated: () => {},
  onSermonDeleted: () => {},
  podcastCreated: null,
  podcastUpdated: null,
  podcastDeleted: null,
  onPodcastCreated: () => {},
  onPodcastUpdated: () => {},
  onPodcastDeleted: () => {},
  eventCreated: null,
  eventUpdated: null,
  eventDeleted: null,
  onEventCreated: () => {},
  onEventUpdated: () => {},
  onEventDeleted: () => {},
  ministryCreated: null,
  ministryUpdated: null,
  ministryDeleted: null,
  onMinistryCreated: () => {},
  onMinistryUpdated: () => {},
  onMinistryDeleted: () => {},
};

const SocketContext = createContext<SocketContextType>(initialContextValue);

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Devotions callbacks
  const [devotionCreated, setDevotionCreated] = useState<EventCallback>(null);
  const [devotionUpdated, setDevotionUpdated] = useState<EventCallback>(null);
  const [devotionDeleted, setDevotionDeleted] = useState<EventCallback>(null);
  
  // Sermons callbacks
  const [sermonCreated, setSermonCreated] = useState<EventCallback>(null);
  const [sermonUpdated, setSermonUpdated] = useState<EventCallback>(null);
  const [sermonDeleted, setSermonDeleted] = useState<EventCallback>(null);
  
  // Podcasts callbacks
  const [podcastCreated, setPodcastCreated] = useState<EventCallback>(null);
  const [podcastUpdated, setPodcastUpdated] = useState<EventCallback>(null);
  const [podcastDeleted, setPodcastDeleted] = useState<EventCallback>(null);
  
  // Events callbacks
  const [eventCreated, setEventCreated] = useState<EventCallback>(null);
  const [eventUpdated, setEventUpdated] = useState<EventCallback>(null);
  const [eventDeleted, setEventDeleted] = useState<EventCallback>(null);
  
  // Ministries callbacks
  const [ministryCreated, setMinistryCreated] = useState<EventCallback>(null);
  const [ministryUpdated, setMinistryUpdated] = useState<EventCallback>(null);
  const [ministryDeleted, setMinistryDeleted] = useState<EventCallback>(null);

  useEffect(() => {
    // Check if we're running on Vercel - Socket.IO doesn't work on Vercel free tier
    const isVercel = import.meta.env.VITE_API_URL?.includes('vercel.app');
    
    if (isVercel) {
      console.log('🔌 Socket.IO disabled: Vercel free tier doesn\'t support WebSocket connections');
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || '';
    const socketUrl = apiUrl || window.location.origin;
    
    const newSocket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Set up event listeners for devotions
  useEffect(() => {
    if (!socket) return;

    const handleDevotionCreated = (data: any) => {
      console.log('📥 Received devotion:created event:', data);
      if (devotionCreated) devotionCreated(data);
    };

    const handleDevotionUpdated = (data: any) => {
      console.log('📥 Received devotion:updated event:', data);
      if (devotionUpdated) devotionUpdated(data);
    };

    const handleDevotionDeleted = (data: any) => {
      console.log('📥 Received devotion:deleted event:', data);
      if (devotionDeleted) devotionDeleted(data);
    };

    socket.on('devotion:created', handleDevotionCreated);
    socket.on('devotion:updated', handleDevotionUpdated);
    socket.on('devotion:deleted', handleDevotionDeleted);

    return () => {
      socket.off('devotion:created', handleDevotionCreated);
      socket.off('devotion:updated', handleDevotionUpdated);
      socket.off('devotion:deleted', handleDevotionDeleted);
    };
  }, [socket, devotionCreated, devotionUpdated, devotionDeleted]);

  // Set up event listeners for sermons
  useEffect(() => {
    if (!socket) return;

    const handleSermonCreated = (data: any) => {
      console.log('📥 Received sermon:created event:', data);
      if (sermonCreated) sermonCreated(data);
    };

    const handleSermonUpdated = (data: any) => {
      console.log('📥 Received sermon:updated event:', data);
      if (sermonUpdated) sermonUpdated(data);
    };

    const handleSermonDeleted = (data: any) => {
      console.log('📥 Received sermon:deleted event:', data);
      if (sermonDeleted) sermonDeleted(data);
    };

    socket.on('sermon:created', handleSermonCreated);
    socket.on('sermon:updated', handleSermonUpdated);
    socket.on('sermon:deleted', handleSermonDeleted);

    return () => {
      socket.off('sermon:created', handleSermonCreated);
      socket.off('sermon:updated', handleSermonUpdated);
      socket.off('sermon:deleted', handleSermonDeleted);
    };
  }, [socket, sermonCreated, sermonUpdated, sermonDeleted]);

  // Set up event listeners for podcasts
  useEffect(() => {
    if (!socket) return;

    const handlePodcastCreated = (data: any) => {
      console.log('📥 Received podcast:created event:', data);
      if (podcastCreated) podcastCreated(data);
    };

    const handlePodcastUpdated = (data: any) => {
      console.log('📥 Received podcast:updated event:', data);
      if (podcastUpdated) podcastUpdated(data);
    };

    const handlePodcastDeleted = (data: any) => {
      console.log('📥 Received podcast:deleted event:', data);
      if (podcastDeleted) podcastDeleted(data);
    };

    socket.on('podcast:created', handlePodcastCreated);
    socket.on('podcast:updated', handlePodcastUpdated);
    socket.on('podcast:deleted', handlePodcastDeleted);

    return () => {
      socket.off('podcast:created', handlePodcastCreated);
      socket.off('podcast:updated', handlePodcastUpdated);
      socket.off('podcast:deleted', handlePodcastDeleted);
    };
  }, [socket, podcastCreated, podcastUpdated, podcastDeleted]);

  // Set up event listeners for events
  useEffect(() => {
    if (!socket) return;

    const handleEventCreated = (data: any) => {
      console.log('📥 Received event:created event:', data);
      if (eventCreated) eventCreated(data);
    };

    const handleEventUpdated = (data: any) => {
      console.log('📥 Received event:updated event:', data);
      if (eventUpdated) eventUpdated(data);
    };

    const handleEventDeleted = (data: any) => {
      console.log('📥 Received event:deleted event:', data);
      if (eventDeleted) eventDeleted(data);
    };

    socket.on('event:created', handleEventCreated);
    socket.on('event:updated', handleEventUpdated);
    socket.on('event:deleted', handleEventDeleted);

    return () => {
      socket.off('event:created', handleEventCreated);
      socket.off('event:updated', handleEventUpdated);
      socket.off('event:deleted', handleEventDeleted);
    };
  }, [socket, eventCreated, eventUpdated, eventDeleted]);

  // Set up event listeners for ministries
  useEffect(() => {
    if (!socket) return;

    const handleMinistryCreated = (data: any) => {
      console.log('📥 Received ministry:created event:', data);
      if (ministryCreated) ministryCreated(data);
    };

    const handleMinistryUpdated = (data: any) => {
      console.log('📥 Received ministry:updated event:', data);
      if (ministryUpdated) ministryUpdated(data);
    };

    const handleMinistryDeleted = (data: any) => {
      console.log('📥 Received ministry:deleted event:', data);
      if (ministryDeleted) ministryDeleted(data);
    };

    socket.on('ministry:created', handleMinistryCreated);
    socket.on('ministry:updated', handleMinistryUpdated);
    socket.on('ministry:deleted', handleMinistryDeleted);

    return () => {
      socket.off('ministry:created', handleMinistryCreated);
      socket.off('ministry:updated', handleMinistryUpdated);
      socket.off('ministry:deleted', handleMinistryDeleted);
    };
  }, [socket, ministryCreated, ministryUpdated, ministryDeleted]);

  // Callback setters for devotions
  const onDevotionCreated = useCallback((callback: (data: any) => void) => setDevotionCreated(() => callback), []);
  const onDevotionUpdated = useCallback((callback: (data: any) => void) => setDevotionUpdated(() => callback), []);
  const onDevotionDeleted = useCallback((callback: (data: any) => void) => setDevotionDeleted(() => callback), []);

  // Callback setters for sermons
  const onSermonCreated = useCallback((callback: (data: any) => void) => setSermonCreated(() => callback), []);
  const onSermonUpdated = useCallback((callback: (data: any) => void) => setSermonUpdated(() => callback), []);
  const onSermonDeleted = useCallback((callback: (data: any) => void) => setSermonDeleted(() => callback), []);

  // Callback setters for podcasts
  const onPodcastCreated = useCallback((callback: (data: any) => void) => setPodcastCreated(() => callback), []);
  const onPodcastUpdated = useCallback((callback: (data: any) => void) => setPodcastUpdated(() => callback), []);
  const onPodcastDeleted = useCallback((callback: (data: any) => void) => setPodcastDeleted(() => callback), []);

  // Callback setters for events
  const onEventCreated = useCallback((callback: (data: any) => void) => setEventCreated(() => callback), []);
  const onEventUpdated = useCallback((callback: (data: any) => void) => setEventUpdated(() => callback), []);
  const onEventDeleted = useCallback((callback: (data: any) => void) => setEventDeleted(() => callback), []);

  // Callback setters for ministries
  const onMinistryCreated = useCallback((callback: (data: any) => void) => setMinistryCreated(() => callback), []);
  const onMinistryUpdated = useCallback((callback: (data: any) => void) => setMinistryUpdated(() => callback), []);
  const onMinistryDeleted = useCallback((callback: (data: any) => void) => setMinistryDeleted(() => callback), []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        devotionCreated: null,
        devotionUpdated: null,
        devotionDeleted: null,
        onDevotionCreated,
        onDevotionUpdated,
        onDevotionDeleted,
        sermonCreated: null,
        sermonUpdated: null,
        sermonDeleted: null,
        onSermonCreated,
        onSermonUpdated,
        onSermonDeleted,
        podcastCreated: null,
        podcastUpdated: null,
        podcastDeleted: null,
        onPodcastCreated,
        onPodcastUpdated,
        onPodcastDeleted,
        eventCreated: null,
        eventUpdated: null,
        eventDeleted: null,
        onEventCreated,
        onEventUpdated,
        onEventDeleted,
        ministryCreated: null,
        ministryUpdated: null,
        ministryDeleted: null,
        onMinistryCreated,
        onMinistryUpdated,
        onMinistryDeleted,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
