package io.dove.ministries.africa;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

import androidx.core.app.NotificationCompat;

public class AudioForegroundService extends Service {
    private static final String CHANNEL_ID = "dove_audio_playback";
    private static final int NOTIFICATION_ID = 1001;
    private static final String ACTION_PLAY = "io.dove.ministries.africa.PLAY";
    private static final String ACTION_PAUSE = "io.dove.ministries.africa.PAUSE";
    private static final String ACTION_STOP = "io.dove.ministries.africa.STOP";
    private static final String ACTION_NEXT = "io.dove.ministries.africa.NEXT";
    private static final String ACTION_PREV = "io.dove.ministries.africa.PREV";

    private PowerManager.WakeLock wakeLock;
    private AudioFocusRequest audioFocusRequest;
    private boolean isPlaying = false;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        acquireWakeLock();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && intent.getAction() != null) {
            switch (intent.getAction()) {
                case ACTION_PLAY:
                    isPlaying = true;
                    updateNotification(true);
                    sendBroadcastToWebView("play");
                    break;
                case ACTION_PAUSE:
                    isPlaying = false;
                    updateNotification(false);
                    sendBroadcastToWebView("pause");
                    break;
                case ACTION_STOP:
                    isPlaying = false;
                    sendBroadcastToWebView("stop");
                    stopForeground(STOP_FOREGROUND_REMOVE);
                    stopSelf();
                    return START_NOT_STICKY;
                case ACTION_NEXT:
                    sendBroadcastToWebView("next");
                    break;
                case ACTION_PREV:
                    sendBroadcastToWebView("prev");
                    break;
            }
        }

        String title = "Dove Church";
        String subtitle = intent != null ? intent.getStringExtra("title") : "Playing podcast";

        startForeground(NOTIFICATION_ID, buildNotification(title, subtitle, isPlaying));
        return START_STICKY;
    }

    private void sendBroadcastToWebView(String action) {
        Intent intent = new Intent("io.dove.ministries.africa.AUDIO_CONTROL");
        intent.putExtra("action", action);
        sendBroadcast(intent);
    }

    private Notification buildNotification(String title, String subtitle, boolean playing) {
        // Content intent - opens the app
        Intent contentIntent = new Intent(this, MainActivity.class);
        contentIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent contentPending = PendingIntent.getActivity(this, 0, contentIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        // Action intents
        Intent pauseIntent = new Intent(this, AudioForegroundService.class);
        pauseIntent.setAction(playing ? ACTION_PAUSE : ACTION_PLAY);
        PendingIntent pausePending = PendingIntent.getService(this, 1, pauseIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent stopIntent = new Intent(this, AudioForegroundService.class);
        stopIntent.setAction(ACTION_STOP);
        PendingIntent stopPending = PendingIntent.getService(this, 2, stopIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent prevIntent = new Intent(this, AudioForegroundService.class);
        prevIntent.setAction(ACTION_PREV);
        PendingIntent prevPending = PendingIntent.getService(this, 3, prevIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent nextIntent = new Intent(this, AudioForegroundService.class);
        nextIntent.setAction(ACTION_NEXT);
        PendingIntent nextPending = PendingIntent.getService(this, 4, nextIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_media_play)
                .setContentTitle(title)
                .setContentText(subtitle)
                .setContentIntent(contentPending)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .addAction(new NotificationCompat.Action(
                        android.R.drawable.ic_media_previous, "Previous", prevPending))
                .addAction(new NotificationCompat.Action(
                        playing ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play,
                        playing ? "Pause" : "Play", pausePending))
                .addAction(new NotificationCompat.Action(
                        android.R.drawable.ic_media_next, "Next", nextPending))
                .addAction(new NotificationCompat.Action(
                        android.R.drawable.ic_delete, "Stop", stopPending));

        return builder.build();
    }

    private void updateNotification(boolean playing) {
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            String title = "Dove Church";
            String subtitle = playing ? "Playing podcast" : "Paused";
            manager.notify(NOTIFICATION_ID, buildNotification(title, subtitle, playing));
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Audio Playback",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Dove Church podcast playback controls");
            channel.setShowBadge(false);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private void acquireWakeLock() {
        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "dove:audio_playback");
            wakeLock.acquire();
        }
    }

    @Override
    public void onDestroy() {
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        if (audioFocusRequest != null) {
            AudioManager am = (AudioManager) getSystemService(AUDIO_SERVICE);
            if (am != null) {
                am.abandonAudioFocusRequest(audioFocusRequest);
            }
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
