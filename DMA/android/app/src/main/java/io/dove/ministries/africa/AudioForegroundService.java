package io.dove.ministries.africa;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

import androidx.core.app.NotificationCompat;
import androidx.media.app.NotificationCompat.MediaStyle;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;

public class AudioForegroundService extends Service {
    private static final String CHANNEL_ID = "dove_audio_playback";
    private static final int NOTIFICATION_ID = 1001;
    private static final String ACTION_PLAY = "io.dove.ministries.africa.PLAY";
    private static final String ACTION_PAUSE = "io.dove.ministries.africa.PAUSE";
    private static final String ACTION_STOP = "io.dove.ministries.africa.STOP";
    private static final String ACTION_NEXT = "io.dove.ministries.africa.NEXT";
    private static final String ACTION_PREV = "io.dove.ministries.africa.PREV";
    private static final String ACTION_SEEK = "io.dove.ministries.africa.SEEK";

    private PowerManager.WakeLock wakeLock;
    private MediaSessionCompat mediaSession;
    private boolean isPlaying = false;
    private String currentTitle = "Dove Church";
    private String currentSubtitle = "Playing podcast";
    private long currentPosition = 0;
    private long totalDuration = 0;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        acquireWakeLock();
        setupMediaSession();
    }

    private void setupMediaSession() {
        mediaSession = new MediaSessionCompat(this, "DoveAudioSession");
        mediaSession.setFlags(MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS | MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS);
        mediaSession.setActive(true);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && intent.getAction() != null) {
            switch (intent.getAction()) {
                case ACTION_PLAY:
                    isPlaying = true;
                    sendBroadcastToWebView("play");
                    break;
                case ACTION_PAUSE:
                    isPlaying = false;
                    sendBroadcastToWebView("pause");
                    break;
                case ACTION_STOP:
                    isPlaying = false;
                    sendBroadcastToWebView("stop");
                    updateMediaSessionState();
                    stopForeground(STOP_FOREGROUND_REMOVE);
                    stopSelf();
                    return START_NOT_STICKY;
                case ACTION_NEXT:
                    sendBroadcastToWebView("next");
                    break;
                case ACTION_PREV:
                    sendBroadcastToWebView("prev");
                    break;
                case ACTION_SEEK:
                    long seekTo = intent.getLongExtra("position", 0);
                    currentPosition = seekTo;
                    sendBroadcastToWebView("seek:" + seekTo);
                    break;
            }

            // Update metadata from intent extras
            if (intent.hasExtra("title")) {
                currentTitle = intent.getStringExtra("title");
            }
            if (intent.hasExtra("subtitle")) {
                currentSubtitle = intent.getStringExtra("subtitle");
            }
            if (intent.hasExtra("position")) {
                currentPosition = intent.getLongExtra("position", 0);
            }
            if (intent.hasExtra("duration")) {
                totalDuration = intent.getLongExtra("duration", 0);
            }
            if (intent.hasExtra("isPlaying")) {
                isPlaying = intent.getBooleanExtra("isPlaying", isPlaying);
            }
        }

        updateMediaSessionState();
        startForeground(NOTIFICATION_ID, buildNotification());
        return START_STICKY;
    }

    private void updateMediaSessionState() {
        int state = isPlaying
                ? PlaybackStateCompat.STATE_PLAYING
                : PlaybackStateCompat.STATE_PAUSED;

        PlaybackStateCompat.Builder stateBuilder = new PlaybackStateCompat.Builder()
                .setActions(
                        PlaybackStateCompat.ACTION_PLAY
                        | PlaybackStateCompat.ACTION_PAUSE
                        | PlaybackStateCompat.ACTION_PLAY_PAUSE
                        | PlaybackStateCompat.ACTION_SKIP_TO_NEXT
                        | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
                        | PlaybackStateCompat.ACTION_SEEK_TO
                        | PlaybackStateCompat.ACTION_STOP
                )
                .setState(state, currentPosition, isPlaying ? 1.0f : 0.0f);

        mediaSession.setPlaybackState(stateBuilder.build());
    }

    private void sendBroadcastToWebView(String action) {
        Intent intent = new Intent("io.dove.ministries.africa.AUDIO_CONTROL");
        intent.putExtra("action", action);
        sendBroadcast(intent);
    }

    private String formatTime(long millis) {
        long totalSeconds = millis / 1000;
        long minutes = totalSeconds / 60;
        long seconds = totalSeconds % 60;
        return String.format("%d:%02d", minutes, seconds);
    }

    private Notification buildNotification() {
        // Content intent - opens the app
        Intent contentIntent = new Intent(this, MainActivity.class);
        contentIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent contentPending = PendingIntent.getActivity(this, 0, contentIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        // Build subtitle with timeline
        String timelineText;
        if (totalDuration > 0) {
            timelineText = currentSubtitle + "  \u2022  " + formatTime(currentPosition) + " / " + formatTime(totalDuration);
        } else {
            timelineText = currentSubtitle;
        }

        // Action intents - use unique request codes for each
        Intent prevIntent = new Intent(this, AudioForegroundService.class);
        prevIntent.setAction(ACTION_PREV);
        PendingIntent prevPending = PendingIntent.getService(this, 10, prevIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent playPauseIntent = new Intent(this, AudioForegroundService.class);
        playPauseIntent.setAction(isPlaying ? ACTION_PAUSE : ACTION_PLAY);
        PendingIntent playPausePending = PendingIntent.getService(this, 11, playPauseIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent nextIntent = new Intent(this, AudioForegroundService.class);
        nextIntent.setAction(ACTION_NEXT);
        PendingIntent nextPending = PendingIntent.getService(this, 12, nextIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent stopIntent = new Intent(this, AudioForegroundService.class);
        stopIntent.setAction(ACTION_STOP);
        PendingIntent stopPending = PendingIntent.getService(this, 13, stopIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        // Build MediaStyle notification
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_music_note)
                .setContentTitle(currentTitle)
                .setContentText(timelineText)
                .setContentIntent(contentPending)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setShowWhen(false)
                // Add actions: Previous, Play/Pause, Next
                .addAction(new NotificationCompat.Action(
                        R.drawable.ic_media_previous, "Previous", prevPending))
                .addAction(new NotificationCompat.Action(
                        isPlaying ? R.drawable.ic_media_pause : R.drawable.ic_media_play,
                        isPlaying ? "Pause" : "Play", playPausePending))
                .addAction(new NotificationCompat.Action(
                        R.drawable.ic_media_next, "Next", nextPending))
                // MediaStyle: show first 3 actions in compact view, link to media session
                .setStyle(new MediaStyle()
                        .setMediaSession(mediaSession.getSessionToken())
                        .setShowActionsInCompactView(0, 1, 2)
                        .setShowCancelButton(true)
                        .setCancelButtonIntent(stopPending));

        return builder.build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Podcast Playback",
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
            wakeLock.acquire(60 * 60 * 1000L); // 1 hour max
        }
    }

    @Override
    public void onDestroy() {
        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
        }
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
