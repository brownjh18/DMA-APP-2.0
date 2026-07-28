package io.dove.ministries.africa;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
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
    private final Handler handler = new Handler(Looper.getMainLooper());
    private boolean isPlaying = false;
    private String currentTitle = "Dove Church";
    private String currentSubtitle = "Playing podcast";
    private String currentArtUri = "";
    private long currentPosition = 0;
    private long totalDuration = 0;
    private Bitmap artBitmap = null;

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

        mediaSession.setCallback(new MediaSessionCompat.Callback() {
            @Override
            public void onPlay() {
                AudioPlugin plugin = AudioPlugin.getInstance();
                if (plugin != null) plugin.sendControlToJS("play");
                isPlaying = true;
                updateMediaSessionState();
                updateNotification();
            }

            @Override
            public void onPause() {
                AudioPlugin plugin = AudioPlugin.getInstance();
                if (plugin != null) plugin.sendControlToJS("pause");
                isPlaying = false;
                updateMediaSessionState();
                updateNotification();
            }

            @Override
            public void onStop() {
                AudioPlugin plugin = AudioPlugin.getInstance();
                if (plugin != null) plugin.sendControlToJS("stop");
                isPlaying = false;
                updateMediaSessionState();
                stopForeground(STOP_FOREGROUND_REMOVE);
                stopSelf();
            }

            @Override
            public void onSkipToNext() {
                AudioPlugin plugin = AudioPlugin.getInstance();
                if (plugin != null) plugin.sendControlToJS("next");
            }

            @Override
            public void onSkipToPrevious() {
                AudioPlugin plugin = AudioPlugin.getInstance();
                if (plugin != null) plugin.sendControlToJS("prev");
            }

            @Override
            public void onSeekTo(long pos) {
                currentPosition = pos;
                AudioPlugin plugin = AudioPlugin.getInstance();
                if (plugin != null) plugin.sendSeekToJS(pos);
                updateMediaSessionState();
                updateNotification();
            }
        });
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && intent.getAction() != null) {
            switch (intent.getAction()) {
                case ACTION_PLAY:
                    isPlaying = true;
                    notifyPlugin("play");
                    break;
                case ACTION_PAUSE:
                    isPlaying = false;
                    notifyPlugin("pause");
                    break;
                case ACTION_STOP:
                    isPlaying = false;
                    notifyPlugin("stop");
                    updateMediaSessionState();
                    stopForeground(STOP_FOREGROUND_REMOVE);
                    stopSelf();
                    return START_NOT_STICKY;
                case ACTION_NEXT:
                    notifyPlugin("next");
                    break;
                case ACTION_PREV:
                    notifyPlugin("prev");
                    break;
                case ACTION_SEEK:
                    long seekTo = intent.getLongExtra("position", 0);
                    currentPosition = seekTo;
                    AudioPlugin plugin = AudioPlugin.getInstance();
                    if (plugin != null) plugin.sendSeekToJS(seekTo);
                    break;
            }

            if (intent.hasExtra("title")) {
                currentTitle = intent.getStringExtra("title");
            }
            if (intent.hasExtra("subtitle")) {
                currentSubtitle = intent.getStringExtra("subtitle");
            }
            if (intent.hasExtra("artUri")) {
                String newArtUri = intent.getStringExtra("artUri");
                if (newArtUri != null && !newArtUri.equals(currentArtUri)) {
                    currentArtUri = newArtUri;
                    downloadArtAndNotify();
                }
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

    private void notifyPlugin(String action) {
        AudioPlugin plugin = AudioPlugin.getInstance();
        if (plugin != null) {
            plugin.sendControlToJS(action);
        }
    }

    private void downloadArtAndNotify() {
        AudioPlugin plugin = AudioPlugin.getInstance();
        if (plugin != null && !currentArtUri.isEmpty()) {
            plugin.downloadBitmap(currentArtUri, bitmap -> {
                artBitmap = bitmap;
                updateNotification();
            });
        } else {
            artBitmap = null;
            updateNotification();
        }
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

    private String formatTime(long millis) {
        long totalSeconds = millis / 1000;
        long minutes = totalSeconds / 60;
        long seconds = totalSeconds % 60;
        return String.format("%d:%02d", minutes, seconds);
    }

    private Notification buildNotification() {
        Intent contentIntent = new Intent(this, MainActivity.class);
        contentIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent contentPending = PendingIntent.getActivity(this, 0, contentIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        String timelineText;
        if (totalDuration > 0) {
            timelineText = currentSubtitle + "  \u2022  " + formatTime(currentPosition) + " / " + formatTime(totalDuration);
        } else {
            timelineText = currentSubtitle;
        }

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
                .addAction(new NotificationCompat.Action(
                        R.drawable.ic_media_previous, "Previous", prevPending))
                .addAction(new NotificationCompat.Action(
                        isPlaying ? R.drawable.ic_media_pause : R.drawable.ic_media_play,
                        isPlaying ? "Pause" : "Play", playPausePending))
                .addAction(new NotificationCompat.Action(
                        R.drawable.ic_media_next, "Next", nextPending))
                .setStyle(new MediaStyle()
                        .setMediaSession(mediaSession.getSessionToken())
                        .setShowActionsInCompactView(0, 1, 2)
                        .setShowCancelButton(true)
                        .setCancelButtonIntent(stopPending));

        if (artBitmap != null) {
            builder.setLargeIcon(artBitmap);
        } else if (!currentArtUri.isEmpty()) {
            Bitmap defaultIcon = BitmapFactory.decodeResource(getResources(), R.drawable.ic_music_note);
            if (defaultIcon != null) {
                builder.setLargeIcon(defaultIcon);
            }
        }

        return builder.build();
    }

    private void updateNotification() {
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, buildNotification());
        }
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
            wakeLock.acquire(60 * 60 * 1000L);
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
