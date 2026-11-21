package com.sindulis.fitmeai.steps;

import android.Manifest;
import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.android.gms.fitness.FitnessLocal;
import com.google.android.gms.fitness.LocalRecordingClient;
import com.google.android.gms.fitness.data.LocalBucket;
import com.google.android.gms.fitness.data.LocalDataPoint;
import com.google.android.gms.fitness.data.LocalDataSet;
import com.google.android.gms.fitness.data.LocalDataType;
import com.google.android.gms.fitness.data.LocalField;
import com.google.android.gms.fitness.request.LocalDataReadRequest;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.concurrent.TimeUnit;

/**
 * FitMe on-device steps (Android). Primary: the Google Recording API on mobile (Play services records steps in the
 * background with no app running, keeps about 10 days of history, survives restarts and reboots). Fallback: the
 * hardware step counter sampled by WorkManager (StepSampleWorker). Live updates come from the sensor while the app
 * is open. Needs ACTIVITY_RECOGNITION (Android 10+).
 */
@CapacitorPlugin(name = "FitMeSteps", permissions = { @Permission(alias = "activity", strings = { Manifest.permission.ACTIVITY_RECOGNITION }) })
public class StepsPlugin extends Plugin implements SensorEventListener {
    private SensorManager sensors;

    private boolean recordingApiAvailable() {
        return GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(getContext(), LocalRecordingClient.LOCAL_RECORDING_CLIENT_MIN_VERSION_CODE) == ConnectionResult.SUCCESS;
    }

    private boolean needsRuntimePermission() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q;
    }

    private boolean granted() {
        return !needsRuntimePermission() || getPermissionState("activity") == PermissionState.GRANTED;
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject r = new JSObject();
        r.put("sensor", StepSampler.hasSensor(getContext()));
        r.put("recordingApi", recordingApiAvailable());
        r.put("available", StepSampler.hasSensor(getContext()) || recordingApiAvailable());
        call.resolve(r);
    }

    @Override
    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject r = new JSObject();
        r.put("activity", needsRuntimePermission() ? getPermissionState("activity").toString().toLowerCase() : "granted");
        call.resolve(r);
    }

    @Override
    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (!needsRuntimePermission() || granted()) {
            checkPermissions(call);
            return;
        }
        requestPermissionForAlias("activity", call, "permissionDone");
    }

    @PermissionCallback
    private void permissionDone(PluginCall call) {
        checkPermissions(call);
    }

    /** Starts background counting (Recording API subscription, or the WorkManager sampler) and remembers the zone. */
    @PluginMethod
    public void start(PluginCall call) {
        if (!granted()) {
            call.reject("permission_denied", "PERMISSION_DENIED");
            return;
        }
        String tz = call.getString("timeZone");
        if (tz != null) getContext().getSharedPreferences(StepSampler.PREFS, Context.MODE_PRIVATE).edit().putString(StepSampler.KEY_ZONE, tz).apply();
        if (recordingApiAvailable()) {
            FitnessLocal.getLocalRecordingClient(getContext())
                .subscribe(LocalDataType.TYPE_STEP_COUNT_DELTA)
                .addOnSuccessListener(v -> call.resolve(source("recordingApi")))
                .addOnFailureListener(e -> {
                    StepSampleWorker.schedule(getContext());
                    call.resolve(source("sensor"));
                });
        } else if (StepSampler.hasSensor(getContext())) {
            StepSampleWorker.schedule(getContext());
            StepSampler.sampleOnce(getContext(), 3000);
            call.resolve(source("sensor"));
        } else call.reject("unavailable", "UNAVAILABLE");
    }

    @PluginMethod
    public void stop(PluginCall call) {
        StepSampleWorker.cancel(getContext());
        if (recordingApiAvailable()) FitnessLocal.getLocalRecordingClient(getContext()).unsubscribe(LocalDataType.TYPE_STEP_COUNT_DELTA);
        stopLive();
        call.resolve();
    }

    private JSObject source(String s) {
        JSObject r = new JSObject();
        r.put("source", s);
        return r;
    }

    /** Daily totals for the last `days` days in the user's time zone: [{date, steps, source}]. */
    @PluginMethod
    public void getDailySteps(PluginCall call) {
        int days = Math.max(1, Math.min(30, call.getInt("days", 7)));
        ZoneId zone = StepSampler.zone(getContext());
        LocalDate today = LocalDate.now(zone);
        long start = today.minusDays(days - 1).atStartOfDay(zone).toInstant().toEpochMilli();
        long end = System.currentTimeMillis();
        if (recordingApiAvailable()) {
            LocalDataReadRequest req = new LocalDataReadRequest.Builder()
                .aggregate(LocalDataType.TYPE_STEP_COUNT_DELTA)
                .bucketByTime(1, TimeUnit.DAYS)
                .setTimeRange(start, end, TimeUnit.MILLISECONDS)
                .build();
            FitnessLocal.getLocalRecordingClient(getContext())
                .readData(req)
                .addOnSuccessListener(resp -> {
                    JSArray out = new JSArray();
                    for (LocalBucket b : resp.getBuckets()) {
                        long steps = 0;
                        for (LocalDataSet ds : b.getDataSets())
                            for (LocalDataPoint dp : ds.getDataPoints()) steps += dp.getValue(LocalField.FIELD_STEPS).asInt();
                        JSObject d = new JSObject();
                        d.put("date", StepCounterStore.day(b.getStartTime(TimeUnit.MILLISECONDS), zone));
                        d.put("steps", steps);
                        d.put("source", "recordingApi");
                        out.put(d);
                    }
                    JSObject r = new JSObject();
                    r.put("days", out);
                    call.resolve(r);
                })
                .addOnFailureListener(e -> call.resolve(fromStore(days, zone)));
        } else call.resolve(fromStore(days, zone));
    }

    private JSObject fromStore(int days, ZoneId zone) {
        StepSampler.sampleOnce(getContext(), 2000);
        StepCounterStore s = StepSampler.load(getContext());
        LocalDate today = LocalDate.now(zone);
        JSArray out = new JSArray();
        for (int i = days - 1; i >= 0; i--) {
            String d = today.minusDays(i).toString();
            JSObject o = new JSObject();
            o.put("date", d);
            o.put("steps", s.stepsOn(d));
            o.put("source", "sensor");
            out.put(o);
        }
        JSObject r = new JSObject();
        r.put("days", out);
        return r;
    }

    /** Opens FitMe's page in the system settings (for permissions the user denied permanently). */
    @PluginMethod
    public void openAppSettings(PluginCall call) {
        android.content.Intent i = new android.content.Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS, android.net.Uri.fromParts("package", getContext().getPackageName(), null));
        i.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(i);
        call.resolve();
    }

    /** Whether Android may stop FitMe in the background (battery optimisation). Counting itself keeps working. */
    @PluginMethod
    public void batteryStatus(PluginCall call) {
        android.os.PowerManager pm = (android.os.PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        JSObject r = new JSObject();
        r.put("optimised", pm != null && !pm.isIgnoringBatteryOptimizations(getContext().getPackageName()));
        call.resolve(r);
    }

    /** Opens the system list where the user can exclude FitMe from battery optimisation. */
    @PluginMethod
    public void openBatterySettings(PluginCall call) {
        android.content.Intent i = new android.content.Intent(android.provider.Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
        i.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(i);
        } catch (Exception e) {
            openAppSettings(call);
            return;
        }
        call.resolve();
    }

    /** Live step events ("step") while the app is in the foreground. */
    @PluginMethod
    public void startLive(PluginCall call) {
        if (!granted()) {
            call.reject("permission_denied", "PERMISSION_DENIED");
            return;
        }
        sensors = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        Sensor s = sensors == null ? null : sensors.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        if (s == null) {
            call.reject("unavailable", "UNAVAILABLE");
            return;
        }
        sensors.registerListener(this, s, SensorManager.SENSOR_DELAY_UI);
        call.resolve();
    }

    @PluginMethod
    public void stopLive(PluginCall call) {
        stopLive();
        call.resolve();
    }

    private void stopLive() {
        if (sensors != null) sensors.unregisterListener(this);
        sensors = null;
    }

    @Override
    protected void handleOnPause() {
        stopLive();
    }

    @Override
    public void onSensorChanged(SensorEvent e) {
        StepSampler.record(getContext(), e.values[0]);
        StepCounterStore s = StepSampler.load(getContext());
        JSObject r = new JSObject();
        r.put("date", StepCounterStore.day(System.currentTimeMillis(), StepSampler.zone(getContext())));
        r.put("sensorStepsToday", s.stepsOn(StepCounterStore.day(System.currentTimeMillis(), StepSampler.zone(getContext()))));
        notifyListeners("step", r);
    }

    @Override
    public void onAccuracyChanged(Sensor s, int a) {}
}
