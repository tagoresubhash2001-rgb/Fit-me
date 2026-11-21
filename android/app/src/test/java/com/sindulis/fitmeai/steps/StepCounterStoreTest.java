package com.sindulis.fitmeai.steps;

import static org.junit.Assert.assertEquals;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import org.junit.Test;

public class StepCounterStoreTest {
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    private static long at(int day, int h, int m) {
        return ZonedDateTime.of(2026, 11, day, h, m, 0, 0, IST).toInstant().toEpochMilli();
    }

    @Test
    public void countsStepsBetweenSamplesOnTheLocalDay() {
        StepCounterStore s = new StepCounterStore();
        s.sample(10000, at(21, 9, 0), IST, 5);
        s.sample(10800, at(21, 9, 15), IST, 5);
        s.sample(12000, at(21, 9, 30), IST, 5);
        assertEquals(2000, s.stepsOn("2026-11-21"));
    }

    @Test
    public void survivesARebootWhenTheCounterRestarts() {
        StepCounterStore s = new StepCounterStore();
        s.sample(50000, at(21, 8, 0), IST, 7);
        s.sample(50500, at(21, 8, 30), IST, 7);
        // Phone rebooted: counter restarted at 0 and the boot count changed.
        s.sample(300, at(21, 9, 0), IST, 8);
        s.sample(1000, at(21, 9, 30), IST, 8);
        assertEquals(500 + 300 + 700, s.stepsOn("2026-11-21"));
    }

    @Test
    public void detectsAResetEvenWithoutABootCount() {
        StepCounterStore s = new StepCounterStore();
        s.sample(9000, at(21, 8, 0), IST, -1);
        s.sample(400, at(21, 8, 30), IST, -1);
        assertEquals(400, s.stepsOn("2026-11-21"));
    }

    @Test
    public void splitsAtLocalMidnight() {
        StepCounterStore s = new StepCounterStore();
        s.sample(1000, at(21, 23, 50), IST, 1);
        s.sample(1200, at(22, 0, 10), IST, 1); // 200 steps over 20 minutes: 10 before midnight, 10 after
        assertEquals(100, s.stepsOn("2026-11-21"));
        assertEquals(100, s.stepsOn("2026-11-22"));
    }

    @Test
    public void ignoresImpossibleJumps() {
        StepCounterStore s = new StepCounterStore();
        s.sample(1000, at(21, 9, 0), IST, 1);
        s.sample(900000, at(21, 9, 1), IST, 1);
        assertEquals(0, s.stepsOn("2026-11-21"));
    }

    @Test
    public void persistsAndRestoresTheBaseline() {
        StepCounterStore s = new StepCounterStore();
        s.sample(1000, at(21, 9, 0), IST, 1);
        s.sample(1500, at(21, 9, 30), IST, 1);
        StepCounterStore r = StepCounterStore.decode(s.encode());
        r.sample(1700, at(21, 10, 0), IST, 1);
        assertEquals(700, r.stepsOn("2026-11-21"));
        assertEquals(0, StepCounterStore.decode("garbage").stepsOn("2026-11-21"));
    }

    @Test
    public void keepsThirtyDays() {
        StepCounterStore s = new StepCounterStore();
        s.days.put("2026-10-01", 5000L);
        s.sample(1, at(21, 9, 0), IST, 1);
        s.sample(101, at(21, 9, 30), IST, 1);
        assertEquals(0, s.stepsOn("2026-10-01"));
    }
}
