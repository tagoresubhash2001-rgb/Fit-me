package com.sindulis.fitmeai.steps;

import android.content.Context;
import androidx.annotation.NonNull;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import java.util.concurrent.TimeUnit;

/**
 * Fallback for phones without the Google Recording API: WorkManager reads the hardware step counter every 15
 * minutes (the platform minimum, battery friendly), so steps are attributed to the right day even when the app is
 * closed, and the baseline survives reboots (WorkManager reschedules itself after boot).
 */
public class StepSampleWorker extends Worker {
    static final String NAME = "fitme-step-sample";

    public StepSampleWorker(@NonNull Context c, @NonNull WorkerParameters p) {
        super(c, p);
    }

    @NonNull
    @Override
    public Result doWork() {
        StepSampler.sampleOnce(getApplicationContext(), 5000);
        return Result.success();
    }

    public static void schedule(Context c) {
        PeriodicWorkRequest req = new PeriodicWorkRequest.Builder(StepSampleWorker.class, 15, TimeUnit.MINUTES).build();
        WorkManager.getInstance(c).enqueueUniquePeriodicWork(NAME, ExistingPeriodicWorkPolicy.KEEP, req);
    }

    public static void cancel(Context c) {
        WorkManager.getInstance(c).cancelUniqueWork(NAME);
    }
}
