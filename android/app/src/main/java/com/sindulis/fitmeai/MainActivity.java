package com.sindulis.fitmeai;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.sindulis.fitmeai.steps.StepsPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(StepsPlugin.class); // FitMe native plugin
        createNotificationChannels();
        super.onCreate(savedInstanceState);
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                // 1. Reminders channel
                NotificationChannel reminders = new NotificationChannel(
                    "reminders",
                    "Daily Reminders",
                    NotificationManager.IMPORTANCE_HIGH
                );
                reminders.setDescription("Step targets, hydration nudges, and workout notifications");
                reminders.enableVibration(true);
                nm.createNotificationChannel(reminders);

                // 2. Coach channel
                NotificationChannel coach = new NotificationChannel(
                    "coach",
                    "AI Coach",
                    NotificationManager.IMPORTANCE_HIGH
                );
                coach.setDescription("Real-time coaching insights and motivational updates from Jai & Jaya");
                coach.enableVibration(true);
                nm.createNotificationChannel(coach);

                // 3. Account channel
                NotificationChannel account = new NotificationChannel(
                    "account",
                    "Account & System Updates",
                    NotificationManager.IMPORTANCE_DEFAULT
                );
                account.setDescription("Subscription notifications, security notices, and app updates");
                nm.createNotificationChannel(account);
            }
        }
    }
}
