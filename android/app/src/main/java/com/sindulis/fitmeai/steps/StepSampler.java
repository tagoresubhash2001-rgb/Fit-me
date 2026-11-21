package com.sindulis.fitmeai.steps;

import android.content.Context;
import android.content.SharedPreferences;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.provider.Settings;
import java.time.ZoneId;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/** Reads the hardware step counter once and records it in the persisted StepCounterStore. */
public final class StepSampler {
    static final String PREFS = "fitme_steps";
    static final String KEY_STORE = "store";
    static final String KEY_ZONE = "zone";

    private StepSampler() {}

    public static boolean hasSensor(Context c) {
        SensorManager sm = (SensorManager) c.getSystemService(Context.SENSOR_SERVICE);
        return sm != null && sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) != null;
    }

    static int bootCount(Context c) {
        try {
            return Settings.Global.getInt(c.getContentResolver(), Settings.Global.BOOT_COUNT);
        } catch (Settings.SettingNotFoundException e) {
            return -1;
        }
    }

    public static ZoneId zone(Context c) {
        String z = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_ZONE, null);
        try {
            return z != null ? ZoneId.of(z) : ZoneId.systemDefault();
        } catch (RuntimeException e) {
            return ZoneId.systemDefault();
        }
    }

    public static synchronized StepCounterStore load(Context c) {
        return StepCounterStore.decode(c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_STORE, ""));
    }

    public static synchronized void record(Context c, float counter) {
        SharedPreferences p = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        StepCounterStore s = StepCounterStore.decode(p.getString(KEY_STORE, ""));
        s.sample(counter, System.currentTimeMillis(), zone(c), bootCount(c));
        p.edit().putString(KEY_STORE, s.encode()).apply();
    }

    /** Blocking single read (used by the background worker); returns false when no reading arrives. */
    public static boolean sampleOnce(Context c, long timeoutMs) {
        SensorManager sm = (SensorManager) c.getSystemService(Context.SENSOR_SERVICE);
        Sensor sensor = sm == null ? null : sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        if (sensor == null) return false;
        CountDownLatch latch = new CountDownLatch(1);
        float[] value = { -1 };
        SensorEventListener l = new SensorEventListener() {
            @Override
            public void onSensorChanged(SensorEvent e) {
                value[0] = e.values[0];
                latch.countDown();
            }

            @Override
            public void onAccuracyChanged(Sensor s, int a) {}
        };
        sm.registerListener(l, sensor, SensorManager.SENSOR_DELAY_NORMAL);
        try {
            latch.await(timeoutMs, TimeUnit.MILLISECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            sm.unregisterListener(l);
        }
        if (value[0] < 0) return false;
        record(c, value[0]);
        return true;
    }
}
