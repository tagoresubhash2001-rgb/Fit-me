package com.sindulis.fitmeai.steps;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Map;
import java.util.TreeMap;

/**
 * Daily step totals from the hardware step counter (TYPE_STEP_COUNTER), used when the Google Recording API is not
 * available. The sensor reports steps since boot; this keeps a persisted baseline so totals survive app restarts and
 * reboots, and splits steps between days at local midnight in the user's time zone. Pure Java: unit tested on the JVM.
 */
public final class StepCounterStore {
    /** A sample cannot add more steps than this per minute (about three steps a second): larger jumps are sensor glitches. */
    static final double MAX_STEPS_PER_MINUTE = 200;
    static final int KEEP_DAYS = 30;

    public float lastCounter = -1;
    public long lastSampleAt = 0;
    public int lastBootCount = -1;
    /** yyyy-MM-dd -> steps. */
    public final TreeMap<String, Long> days = new TreeMap<>();

    /** Adds one sensor reading. bootCount is Settings.Global.BOOT_COUNT (or -1 when unknown). */
    public void sample(float counter, long nowMs, ZoneId zone, int bootCount) {
        if (counter < 0) return;
        if (lastCounter < 0 || lastSampleAt == 0) {
            remember(counter, nowMs, bootCount);
            return;
        }
        float delta = counter - lastCounter;
        // After a reboot the counter restarts at zero: the reading is the number of steps since boot.
        if ((bootCount >= 0 && lastBootCount >= 0 && bootCount != lastBootCount) || delta < 0) delta = counter;
        long minutes = Math.max(1, (nowMs - lastSampleAt) / 60000);
        if (delta > 0 && delta <= MAX_STEPS_PER_MINUTE * minutes) addSplit(Math.round(delta), lastSampleAt, nowMs, zone);
        remember(counter, nowMs, bootCount);
        prune(nowMs, zone);
    }

    /** Steps between two samples are spread over the days they span, in proportion to time (exact at midnight). */
    void addSplit(long steps, long fromMs, long toMs, ZoneId zone) {
        if (toMs <= fromMs) {
            add(day(toMs, zone), steps);
            return;
        }
        long remaining = steps;
        long cursor = fromMs;
        while (true) {
            ZonedDateTime next = Instant.ofEpochMilli(cursor).atZone(zone).toLocalDate().plusDays(1).atStartOfDay(zone);
            long boundary = next.toInstant().toEpochMilli();
            if (boundary >= toMs) {
                add(day(cursor, zone), remaining);
                return;
            }
            long part = Math.round(steps * (double) (boundary - cursor) / (toMs - fromMs));
            part = Math.min(part, remaining);
            add(day(cursor, zone), part);
            remaining -= part;
            cursor = boundary;
        }
    }

    public long stepsOn(String day) {
        Long v = days.get(day);
        return v == null ? 0 : v;
    }

    static String day(long ms, ZoneId zone) {
        return Instant.ofEpochMilli(ms).atZone(zone).toLocalDate().toString();
    }

    private void add(String day, long steps) {
        if (steps <= 0) return;
        days.put(day, stepsOn(day) + steps);
    }

    private void remember(float counter, long nowMs, int bootCount) {
        lastCounter = counter;
        lastSampleAt = nowMs;
        lastBootCount = bootCount;
    }

    private void prune(long nowMs, ZoneId zone) {
        String oldest = LocalDate.parse(day(nowMs, zone)).minusDays(KEEP_DAYS).toString();
        days.headMap(oldest).clear();
    }

    /** Serialised as "counter|sampleAt|boot|day=steps,day=steps". */
    public String encode() {
        StringBuilder b = new StringBuilder();
        b.append(lastCounter).append('|').append(lastSampleAt).append('|').append(lastBootCount).append('|');
        boolean first = true;
        for (Map.Entry<String, Long> e : days.entrySet()) {
            if (!first) b.append(',');
            b.append(e.getKey()).append('=').append(e.getValue());
            first = false;
        }
        return b.toString();
    }

    public static StepCounterStore decode(String s) {
        StepCounterStore st = new StepCounterStore();
        if (s == null || s.isEmpty()) return st;
        try {
            String[] p = s.split("\\|", -1);
            st.lastCounter = Float.parseFloat(p[0]);
            st.lastSampleAt = Long.parseLong(p[1]);
            st.lastBootCount = Integer.parseInt(p[2]);
            if (p.length > 3 && !p[3].isEmpty())
                for (String kv : p[3].split(",")) {
                    String[] x = kv.split("=");
                    st.days.put(x[0], Long.parseLong(x[1]));
                }
        } catch (RuntimeException e) {
            return new StepCounterStore();
        }
        return st;
    }
}
