import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

type EventCallback = ((data: any) => void) | null;

const normalizeUrl = (url: string) => url.replace(/\/$/, '');

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onNotification: (callback: (data: any) => void) => void;
  joinUserRoom: (userId: string) => void;
  onSermonCreated: (callback: (data: any) => void) => void;
  onSermonUpdated: (callback: (data: any) => void) => void;
  onSermonDeleted: (callback: (data: any) => void) => void;
  onDevotionCreated: (callback: (data: any) => void) => void;
  onDevotionUpdated: (callback: (data: any) => void) => void;
  onDevotionDeleted: (callback: (data: any) => void) => void;
  onEventCreated: (callback: (data: any) => void) => void;
  onEventUpdated: (callback: (data: any) => void) => void;
  onEventDeleted: (callback: (data: any) => void) => void;
  onPodcastCreated: (callback: (data: any) => void) => void;
  onPodcastUpdated: (callback: (data: any) => void) => void;
  onPodcastDeleted: (callback: (data: any) => void) => void;
  onMinistryCreated: (callback: (data: any) => void) => void;
  onMinistryUpdated: (callback: (data: any) => void) => void;
  onMinistryDeleted: (callback: (data: any) => void) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onNotification: () => {},
  joinUserRoom: () => {},
  onSermonCreated: () => {},
  onSermonUpdated: () => {},
  onSermonDeleted: () => {},
  onDevotionCreated: () => {},
  onDevotionUpdated: () => {},
  onDevotionDeleted: () => {},
  onEventCreated: () => {},
  onEventUpdated: () => {},
  onEventDeleted: () => {},
  onPodcastCreated: () => {},
  onPodcastUpdated: () => {},
  onPodcastDeleted: () => {},
  onMinistryCreated: () => {},
  onMinistryUpdated: () => {},
  onMinistryDeleted: () => {},
});

export const useSocket = () => useContext(SocketContext);

const EVENTS = [
  'sermon:created', 'sermon:updated', 'sermon:deleted',
  'devotion:created', 'devotion:updated', 'devotion:deleted',
  'event:created', 'event:updated', 'event:deleted',
  'podcast:created', 'podcast:updated', 'podcast:deleted',
  'ministry:created', 'ministry:updated', 'ministry:deleted',
] as const;

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const notificationCallbackRef = useRef<EventCallback>(null);
  const eventCallbackRefs = useRef<Record<string, EventCallback>>({});

  useEffect(() => {
    // In dev, Vite runs on :5173 but Socket.IO is on the backend at :10000.
    // Prefer explicit socket URL, then API base URL, then same-origin production.
    const getSocketUrl = () => {
      if (import.meta.env.VITE_SOCKET_URL) {
        return normalizeUrl(import.meta.env.VITE_SOCKET_URL);
      }
      if (import.meta.env.VITE_API_URL) {
        return normalizeUrl(import.meta.env.VITE_API_URL).replace(/\/api$/, '');
      }
      if (window.location.hostname !== 'localhost') {
        return window.location.origin;
      }
      return 'http://localhost:10000';
    };

    const socketUrl = getSocketUrl();
    console.log('🔌 Connecting socket to:', socketUrl);

    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 15000,
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
      console.warn('Socket connection error:', error.message);
    });

    newSocket.on('notification:new', (data: any) => {
      console.log('📥 New notification received:', data);
      if (notificationCallbackRef.current) {
        notificationCallbackRef.current(data);
      }
    });

    EVENTS.forEach((event) => {
      newSocket.on(event, (data: any) => {
        const cb = eventCallbackRefs.current[event];
        if (cb) cb(data);
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const onNotification = useCallback((callback: (data: any) => void) => {
    notificationCallbackRef.current = callback;
  }, []);

  const joinUserRoom = useCallback((userId: string) => {
    if (socket && userId) {
      socket.emit('join', userId);
      console.log('👤 Joined room for user:', userId);
    }
  }, [socket]);

  const makeEventHandler = useCallback((event: string) => {
    return (callback: (data: any) => void) => {
      eventCallbackRefs.current[event] = callback;
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onNotification,
        joinUserRoom,
        onSermonCreated: makeEventHandler('sermon:created'),
        onSermonUpdated: makeEventHandler('sermon:updated'),
        onSermonDeleted: makeEventHandler('sermon:deleted'),
        onDevotionCreated: makeEventHandler('devotion:created'),
        onDevotionUpdated: makeEventHandler('devotion:updated'),
        onDevotionDeleted: makeEventHandler('devotion:deleted'),
        onEventCreated: makeEventHandler('event:created'),
        onEventUpdated: makeEventHandler('event:updated'),
        onEventDeleted: makeEventHandler('event:deleted'),
        onPodcastCreated: makeEventHandler('podcast:created'),
        onPodcastUpdated: makeEventHandler('podcast:updated'),
        onPodcastDeleted: makeEventHandler('podcast:deleted'),
        onMinistryCreated: makeEventHandler('ministry:created'),
        onMinistryUpdated: makeEventHandler('ministry:updated'),
        onMinistryDeleted: makeEventHandler('ministry:deleted'),
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
