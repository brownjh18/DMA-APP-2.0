package io.dove.ministries.africa;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AudioService")
public class AudioPlugin extends Plugin {
    private BroadcastReceiver audioControlReceiver;
    private static final String AUDIO_CONTROL_ACTION = "io.dove.ministries.africa.AUDIO_CONTROL";

    @PluginMethod
    public void startService(PluginCall call) {
        String title = call.getString("title", "Dove Church");
        String subtitle = call.getString("subtitle", "Playing podcast");
        Double position = call.getDouble("position", 0.0);
        Double duration = call.getDouble("duration", 0.0);

        Intent intent = new Intent(getContext(), AudioForegroundService.class);
        intent.setAction("io.dove.ministries.africa.PLAY");
        intent.putExtra("title", title);
        intent.putExtra("subtitle", subtitle);
        intent.putExtra("position", position != null ? position.longValue() : 0L);
        intent.putExtra("duration", duration != null ? duration.longValue() : 0L);
        intent.putExtra("isPlaying", true);

        startServiceIntent(intent);
        registerAudioControlReceiver();

        JSObject result = new JSObject();
        result.put("started", true);
        call.resolve(result);
    }

    @PluginMethod
    public void stopService(PluginCall call) {
        Intent intent = new Intent(getContext(), AudioForegroundService.class);
        intent.setAction("io.dove.ministries.africa.STOP");
        startServiceIntent(intent);

        unregisterAudioControlReceiver();

        JSObject result = new JSObject();
        result.put("stopped", true);
        call.resolve(result);
    }

    @PluginMethod
    public void updateMetadata(PluginCall call) {
        String title = call.getString("title", "Dove Church");
        String subtitle = call.getString("subtitle", "Playing podcast");
        Double position = call.getDouble("position", 0.0);
        Double duration = call.getDouble("duration", 0.0);
        Boolean playing = call.getBoolean("isPlaying", true);

        Intent intent = new Intent(getContext(), AudioForegroundService.class);
        intent.setAction(playing ? "io.dove.ministries.africa.PLAY" : "io.dove.ministries.africa.PAUSE");
        intent.putExtra("title", title);
        intent.putExtra("subtitle", subtitle);
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

        startServiceIntent(intent);

        JSObject result = new JSObject();
        result.put("sent", true);
        call.resolve(result);
    }

    private void startServiceIntent(Intent intent) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }
    }

    private void registerAudioControlReceiver() {
        if (audioControlReceiver != null) return;

        audioControlReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getStringExtra("action");
                if (action != null) {
                    JSObject data = new JSObject();
                    data.put("action", action);
                    notifyListeners("audioControl", data);
                }
            }
        };

        IntentFilter filter = new IntentFilter(AUDIO_CONTROL_ACTION);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getContext().registerReceiver(audioControlReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            getContext().registerReceiver(audioControlReceiver, filter);
        }
    }

    private void unregisterAudioControlReceiver() {
        if (audioControlReceiver != null) {
            try {
                getContext().unregisterReceiver(audioControlReceiver);
            } catch (Exception e) {
                // Already unregistered
            }
            audioControlReceiver = null;
        }
    }

    @Override
    protected void handleOnDestroy() {
        unregisterAudioControlReceiver();
        super.handleOnDestroy();
    }
}
