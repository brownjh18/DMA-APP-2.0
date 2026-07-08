import React, { useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useNotifications } from '../contexts/NotificationContext';

/**
 * NotificationListener Component
 * 
 * This component listens to Socket.io events and automatically creates
 * notifications when content is published or updated. It should be rendered
 * once at the top level of the app (in App.tsx).
 */
const NotificationListener: React.FC = () => {
  const { 
    isConnected, 
    onSermonCreated, 
    onSermonUpdated,
    onDevotionCreated, 
    onDevotionUpdated,
    onEventCreated, 
    onEventUpdated,
    onPodcastCreated,
    onPodcastUpdated,
    onMinistryCreated,
    onMinistryUpdated,
  } = useSocket();
  
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!isConnected) return;

    console.log('🔔 NotificationListener: Setting up socket listeners for notifications');

    // Sermon notifications
    onSermonCreated((data: any) => {
      console.log('🔔 NotificationListener: New sermon published:', data);
      if (data.sermon) {
        addNotification({
          title: 'New Sermon Published',
          message: data.sermon.title || 'A new sermon has been published',
          type: 'sermon',
          data: {
            url: `/tab2?videoId=${data.sermon._id || data.sermon.id}`,
            sermon: data.sermon
          }
        });
      }
    });

    onSermonUpdated((data: any) => {
      console.log('🔔 NotificationListener: Sermon updated:', data);
      if (data.sermon) {
        addNotification({
          title: 'Sermon Updated',
          message: data.sermon.title || 'A sermon has been updated',
          type: 'sermon',
          data: {
            url: `/tab2?videoId=${data.sermon._id || data.sermon.id}`,
            sermon: data.sermon
          }
        });
      }
    });

    // Devotion notifications
    onDevotionCreated((data: any) => {
      console.log('🔔 NotificationListener: New devotion published:', data);
      if (data.devotion) {
        addNotification({
          title: 'New Devotion Available',
          message: data.devotion.title || 'A new devotion has been published',
          type: 'devotion',
          data: {
            url: `/full-devotion?id=${data.devotion._id || data.devotion.id}`,
            devotion: data.devotion
          }
        });
      }
    });

    onDevotionUpdated((data: any) => {
      console.log('🔔 NotificationListener: Devotion updated:', data);
      if (data.devotion) {
        addNotification({
          title: 'Devotion Updated',
          message: data.devotion.title || 'A devotion has been updated',
          type: 'devotion',
          data: {
            url: `/full-devotion?id=${data.devotion._id || data.devotion.id}`,
            devotion: data.devotion
          }
        });
      }
    });

    // Event notifications
    onEventCreated((data: any) => {
      console.log('🔔 NotificationListener: New event created:', data);
      if (data.event) {
        addNotification({
          title: 'New Event Announced',
          message: data.event.title || 'A new event has been announced',
          type: 'event',
          data: {
            url: `/event/${data.event._id || data.event.id}`,
            event: data.event
          }
        });
      }
    });

    onEventUpdated((data: any) => {
      console.log('🔔 NotificationListener: Event updated:', data);
      if (data.event) {
        addNotification({
          title: 'Event Updated',
          message: data.event.title || 'An event has been updated',
          type: 'event',
          data: {
            url: `/event/${data.event._id || data.event.id}`,
            event: data.event
          }
        });
      }
    });

    // Podcast notifications
    onPodcastCreated((data: any) => {
      console.log('🔔 NotificationListener: New podcast published:', data);
      if (data.podcast) {
        addNotification({
          title: 'New Podcast Episode',
          message: data.podcast.title || 'A new podcast episode has been published',
          type: 'podcast',
          data: {
            type: 'podcast',
            url: `/podcast-player?id=${data.podcast._id || data.podcast.id}`,
            podcast: data.podcast
          }
        });
      }
    });

    onPodcastUpdated((data: any) => {
      console.log('🔔 NotificationListener: Podcast updated:', data);
      if (data.podcast) {
        addNotification({
          title: 'Podcast Updated',
          message: data.podcast.title || 'A podcast episode has been updated',
          type: 'podcast',
          data: {
            type: 'podcast',
            url: `/podcast-player?id=${data.podcast._id || data.podcast.id}`,
            podcast: data.podcast
          }
        });
      }
    });

    // Ministry notifications
    onMinistryCreated((data: any) => {
      console.log('🔔 NotificationListener: New ministry created:', data);
      if (data.ministry) {
        addNotification({
          title: 'New Ministry Launched',
          message: data.ministry.name || 'A new ministry has been launched',
          type: 'ministry',
          data: {
            type: 'ministry',
            url: `/ministry/${data.ministry._id || data.ministry.id}`,
            ministry: data.ministry
          }
        });
      }
    });

    onMinistryUpdated((data: any) => {
      console.log('🔔 NotificationListener: Ministry updated:', data);
      if (data.ministry) {
        addNotification({
          title: 'Ministry Update',
          message: data.ministry.name || 'A ministry has been updated',
          type: 'ministry',
          data: {
            type: 'ministry',
            url: `/ministry/${data.ministry._id || data.ministry.id}`,
            ministry: data.ministry
          }
        });
      }
    });

  }, [isConnected, onSermonCreated, onSermonUpdated, onDevotionCreated, onDevotionUpdated, onEventCreated, onEventUpdated, onPodcastCreated, onPodcastUpdated, onMinistryCreated, onMinistryUpdated, addNotification]);

  // This component doesn't render anything visible
  return null;
};

export default NotificationListener;