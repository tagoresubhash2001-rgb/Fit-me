# Mobile release: permissions, store declarations and device testing

## Why steps did not work before (root cause)

The Android and iOS apps were the web build inside a Capacitor shell with no native step sensor code, and the
Android project could not even build with the health plugin (`minSdk 24`, the plugin needs 26). The web cannot read
motion sensors, Health Connect or HealthKit, so step counting was impossible. Now:

- Android: `FitMeSteps` plugin (`android/.../steps/`) uses the Google Recording API (`LocalRecordingClient`,
  play-services-fitness 21.3.0) when Play services are present, and falls back to the `TYPE_STEP_COUNTER` sensor with a
  persisted baseline (`StepCounterStore`) sampled by WorkManager every 15 minutes, so counting survives app close,
  restarts and reboots and resets at local midnight. Health Connect is read through `@capgo/capacitor-health`.
- iOS: `FitMeStepsPlugin.swift` uses `CMPedometer` (the motion coprocessor keeps 7 days of steps even when the app is
  closed), plus HealthKit through `@capgo/capacitor-health`.
- Web: shows a clear message and manual entry.

## Android (Play Console)

Permissions in `AndroidManifest.xml`: `ACTIVITY_RECOGNITION`, `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`
(foreground only, no background location), `CAMERA`, `POST_NOTIFICATIONS`, and Health Connect `READ_STEPS`,
`READ_DISTANCE`, `READ_ACTIVE_CALORIES_BURNED`, `READ_TOTAL_CALORIES_BURNED`, `READ_HEART_RATE`,
`READ_RESTING_HEART_RATE`, `READ_HEART_RATE_VARIABILITY`, `READ_OXYGEN_SATURATION`, `READ_SLEEP`, `READ_EXERCISE`,
`READ_WEIGHT`. Write permissions the plugin declares are removed with `tools:node="remove"`.

Play Console tasks for the owner:
1. App content → Health apps declaration: list each Health Connect read type above with its purpose (show activity,
   sleep and progress); no writes.
2. App content → Data safety: health and fitness data, photos (processed, not stored for scans), approximate/precise
   location (only while tracking a route), app activity; encrypted in transit; deletion available in Settings.
3. Privacy policy URL: `https://fit-me1.web.app/privacy` (also set in `health_connect_privacy_policy_url`).
4. Physical activity permission rationale is shown in-app (Permissions primer) before the system prompt.
5. Upload a signed AAB: `cd android && ./gradlew bundleRelease` then sign with the upload key (keystore is not in git;
   create it in Play App Signing).

## iOS (App Store Connect / Xcode)

- `Info.plist`: `NSMotionUsageDescription`, `NSHealthShareUsageDescription`, `NSCameraUsageDescription`,
  `NSPhotoLibraryUsageDescription`, `NSLocationWhenInUseUsageDescription`, display name FitMe.
- `App/App.entitlements` enables HealthKit; in Xcode → Signing & Capabilities confirm the HealthKit capability is on for
  the App ID (needs the Apple Developer account).
- Build on a Mac: `npm run build && npx cap sync ios && npx cap open ios`, then Product → Archive. Not built in this
  environment (no Xcode).
- App Store privacy labels: Health & Fitness, Photos, Precise Location (app functionality only, not tracking).

## Permission behaviour (all platforms)

Every permission goes through `PermissionPrimer` (FitMe's own explanation) before the system prompt. States:
granted, limited (iOS partial photos), prompt, denied (can ask again), blocked (only in system settings: the primer
offers "Open settings", which deep-links to the app's system settings), unsupported. Settings → Permissions lists all
six (motion, location, camera, photos, health, notifications) with their state and a Change / Allow button.

## Physical-device checklist (cannot be done in this cloud environment: no KVM emulator, no Mac)

Android (one Pixel with Play services, one device without, e.g. Huawei, Android 10 and 14):
- [ ] Install `app-debug.apk`; Settings → Connected devices → This phone → Count steps; primer, then system prompt.
- [ ] Walk 200 steps with the app open: live count on Home updates within a few seconds.
- [ ] Swipe the app away, walk 200 steps, reopen: steps include the walk.
- [ ] Reboot the phone, walk, reopen: count continues (no reset, no double counting).
- [ ] Leave it past local midnight: the new day starts at 0, yesterday is kept in history.
- [ ] Deny once (ask again works), deny twice (primer shows Open settings, deep link opens app info).
- [ ] Health Connect: connect, sync, revoke in Health Connect → status shows not connected.
- [ ] Route: track a walk outdoors; distance within ~5% of a known route; weak GPS message indoors.
- [ ] Camera scan, gallery pick, profile photo; Android 13+ notification prompt.
iOS (iPhone with iOS 17+):
- [ ] Motion prompt, live steps, steps while closed (CMPedometer history), midnight reset.
- [ ] HealthKit connect, sync, Apple Watch data appears; partial photo access shows "Partly allowed".
- [ ] Location when-in-use only; camera and photo prompts with the usage strings.
