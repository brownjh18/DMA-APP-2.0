package io.dove.ministries.africa;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.InputStream;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "AudioService")
public class AudioPlugin extends Plugin {
    private static final String TAG = "AudioServicePlugin";
    private static AudioPlugin instance;
    private final ExecutorService imageExecutor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    public static AudioPlugin getInstance() {
        return instance;
    }

    @Override
    public void load() {
        instance = this;
    }

    @Override
    protected void handleOnDestroy() {
        instance = null;
        imageExecutor.shutdownNow();
        super.handleOnDestroy();
    }

    public void sendControlToJS(String action) {
        Log.d(TAG, "sendControlToJS: " + action);
        JSObject data = new JSObject();
        data.put("action", action);
        notifyListeners("audioControl", data);
        bringAppToForeground();
    }

    public void sendSeekToJS(long position) {
        Log.d(TAG, "sendSeekToJS: " + position);
        JSObject data = new JSObject();
        data.put("action", "seek");
        data.put("position", String.valueOf(position));
        notifyListeners("audioControl", data);
        bringAppToForeground();
    }

    private void bringAppToForeground() {
        Activity activity = getActivity();
        if (activity == null) return;
        try {
            Intent launchIntent = activity.getPackageManager()
                .getLaunchIntentForPackage(activity.getPackageName());
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
                activity.startActivity(launchIntent);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to bring app to foreground", e);
        }
    }

    @PluginMethod
    public void startService(PluginCall call) {
        String title = call.getString("title", "Dove Church");
        String subtitle = call.getString("subtitle", "Playing podcast");
        String artUri = call.getString("artUri", "");
        Double position = call.getDouble("position", 0.0);
        Double duration = call.getDouble("duration", 0.0);

        Intent intent = new Intent(getContext(), AudioForegroundService.class);
        intent.setAction("io.dove.ministries.africa.PLAY");
        intent.putExtra("title", title);
        intent.putExtra("subtitle", subtitle);
        intent.putExtra("artUri", artUri != null ? artUri : "");
        intent.putExtra("position", position != null ? position.longValue() : 0L);
        intent.putExtra("duration", duration != null ? duration.longValue() : 0L);
        intent.putExtra("isPlaying", true);

        startServiceIntent(intent);

        JSObject result = new JSObject();
        result.put("started", true);
        call.resolve(result);
    }

    @PluginMethod
    public void stopService(PluginCall call) {
        Intent intent = new Intent(getContext(), AudioForegroundService.class);
        intent.setAction("io.dove.ministries.africa.STOP");
        try {
            getContext().startService(intent);
        } catch (Exception e) {
            Log.e(TAG, "Failed to stop service", e);
        }

        JSObject result = new JSObject();
        result.put("stopped", true);
        call.resolve(result);
    }

    @PluginMethod
    public void updateMetadata(PluginCall call) {
        String title = call.getString("title", "Dove Church");
        String subtitle = call.getString("subtitle", "Playing podcast");
        String artUri = call.getString("artUri", "");
        Double position = call.getDouble("position", 0.0);
        Double duration = call.getDouble("duration", 0.0);
        Boolean playing = call.getBoolean("isPlaying", true);

        Intent intent = new Intent(getContext(), AudioForegroundService.class);
        intent.setAction(playing ? "io.dove.ministries.africa.PLAY" : "io.dove.ministries.africa.PAUSE");
        intent.putExtra("title", title);
        intent.putExtra("subtitle", subtitle);
        intent.putExtra("artUri", artUri != null ? artUri : "");
        intent.putExtra("position", position != null ? position.longValue() : 0L);
        intent.putExtra("duration", duration != null ? duration.longValue() : 0L);
        intent.putExtra("isPlaying", playing);

        startServiceIntent(intent);

        JSObject result = new JSObject();
        result.put("updated", true);
        call.resolve(result);
    }

    @PluginMethod
    public void updatePosition(PluginCall call) {
        Double position = call.getDouble("position", 0.0);
        Double duration = call.getDouble("duration", 0.0);
        Boolean playing = call.getBoolean("isPlaying", null);
        String title = call.getString("title", null);
        String subtitle = call.getString("subtitle", null);

        Intent intent = new Intent(getContext(), AudioForegroundService.class);
        intent.setAction("io.dove.ministries.africa.PLAY");
        intent.putExtra("position", position != null ? position.longValue() : 0L);
        intent.putExtra("duration", duration != null ? duration.longValue() : 0L);
        if (playing != null) intent.putExtra("isPlaying", playing);
        if (title != null) intent.putExtra("title", title);
        if (subtitle != null) intent.putExtra("subtitle", subtitle);

        startServiceIntent(intent);

        JSObject result = new JSObject();
        result.put("updated", true);
        call.resolve(result);
    }

    @PluginMethod
    public void sendControl(PluginCall call) {
        String action = call.getString("action", "");
        if (action.isEmpty()) {
            call.reject("Missing action");
            return;
        }

        String serviceAction;
        switch (action) {
            case "pause":
                serviceAction = "io.dove.ministries.africa.PAUSE";
                break;
            case "stop":
                serviceAction = "io.dove.ministries.africa.STOP";
                break;
            case "next":
                serviceAction = "io.dove.ministries.africa.NEXT";
                break;
            case "prev":
                serviceAction = "io.dove.ministries.africa.PREV";
                break;
            case "seek":
                serviceAction = "io.dove.ministries.africa.SEEK";
                break;
            default:
                serviceAction = "io.dove.ministries.africa.PLAY";
                break;
        }

        Intent intent = new Intent(getContext(), AudioForegroundService.class);
        intent.setAction(serviceAction);

        if (action.equals("seek")) {
            Double position = call.getDouble("position", 0.0);
            intent.putExtra("position", position != null ? position.longValue() : 0L);
        }

        if (action.equals("stop")) {
            try {
                getContext().startService(intent);
            } catch (Exception e) {
                Log.e(TAG, "Failed to send stop control", e);
            }
        } else {
            startServiceIntent(intent);
        }

        JSObject result = new JSObject();
        result.put("sent", true);
        call.resolve(result);
    }

    private void startServiceIntent(Intent intent) {
        try {
            getContext().startForegroundService(intent);
        } catch (Exception e) {
            Log.e(TAG, "Failed to start foreground service", e);
            try {
                getContext().startService(intent);
            } catch (Exception e2) {
                Log.e(TAG, "Failed to start service as fallback", e2);
            }
        }
    }

    public void downloadBitmap(String artUri, OnBitmapDownloadedListener listener) {
        if (artUri == null || artUri.isEmpty()) {
            listener.onBitmapDownloaded(null);
            return;
        }
        imageExecutor.execute(() -> {
            try {
                URL url = new URL(artUri);
                InputStream in = url.openStream();
                Bitmap bitmap = BitmapFactory.decodeStream(in);
                in.close();
                mainHandler.post(() -> listener.onBitmapDownloaded(bitmap));
            } catch (Exception e) {
                Log.e(TAG, "Failed to download bitmap: " + artUri, e);
                mainHandler.post(() -> listener.onBitmapDownloaded(null));
            }
        });
    }

    public interface OnBitmapDownloadedListener {
        void onBitmapDownloaded(Bitmap bitmap);
    }
}
