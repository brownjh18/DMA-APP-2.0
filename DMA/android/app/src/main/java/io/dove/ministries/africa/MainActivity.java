package io.dove.ministries.africa;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {
    private static final int PERMISSION_REQUEST_CODE = 123;
    private static final String[] REQUIRED_PERMISSIONS = {
        Manifest.permission.RECORD_AUDIO,
        Manifest.permission.MODIFY_AUDIO_SETTINGS,
        Manifest.permission.READ_EXTERNAL_STORAGE,
        Manifest.permission.WRITE_EXTERNAL_STORAGE,
        Manifest.permission.POST_NOTIFICATIONS
    };

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AudioPlugin.class);
        
        super.onCreate(savedInstanceState);
        
        // Request all permissions at runtime for Android 6.0+
        requestAllPermissions();
    }

    private void requestAllPermissions() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            List<String> permissionsToRequest = new ArrayList<>();
            
            for (String permission : REQUIRED_PERMISSIONS) {
                // Skip POST_NOTIFICATIONS for Android versions below 13 (API 33)
                if (permission.equals(Manifest.permission.POST_NOTIFICATIONS) && 
                    Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
                    continue;
                }
                
                // Skip READ/WRITE_EXTERNAL_STORAGE for Android 13+ (use READ_MEDIA_* instead)
                if ((permission.equals(Manifest.permission.READ_EXTERNAL_STORAGE) || 
                     permission.equals(Manifest.permission.WRITE_EXTERNAL_STORAGE)) &&
                    Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    continue;
                }
                
                if (ContextCompat.checkSelfPermission(this, permission) 
                        != PackageManager.PERMISSION_GRANTED) {
                    permissionsToRequest.add(permission);
                }
            }
            
            // Add media permissions for Android 13+
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                String[] mediaPermissions = {
                    Manifest.permission.READ_MEDIA_IMAGES,
                    Manifest.permission.READ_MEDIA_VIDEO,
                    Manifest.permission.READ_MEDIA_AUDIO
                };
                
                for (String permission : mediaPermissions) {
                    if (ContextCompat.checkSelfPermission(this, permission) 
                            != PackageManager.PERMISSION_GRANTED) {
                        permissionsToRequest.add(permission);
                    }
                }
            }
            
            if (!permissionsToRequest.isEmpty()) {
                ActivityCompat.requestPermissions(this, 
                    permissionsToRequest.toArray(new String[0]), 
                    PERMISSION_REQUEST_CODE);
            }
        }
    }
}