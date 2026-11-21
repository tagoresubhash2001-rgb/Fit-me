# Google Play Console: everything that can be prepared in files

Package: `com.sindulis.fitmeai` · Version 2.0.0 (200) · Signed release bundle: `android/app/build/outputs/bundle/release/app-release.aab`
(upload key: alias `fitme-upload`, stored in Google Secret Manager as `FITME_UPLOAD_KEYSTORE` / `FITME_UPLOAD_KEYSTORE_PASSWORD`; enrol in Play App Signing on first upload).

## Store listing

- **App name:** FitMe
- **Short description (80):** FitMe – For a Healthier Life. Food, steps, water, sleep and workouts in one app.
- **Full description:**

  FitMe – For a Healthier Life.

  Track what you eat with a food database built for India and the world: idli, dosa, biryani, roti and thousands of everyday foods, with calories, protein, carbs, fat and fibre. Scan a meal with your camera and check the result before you save it.

  Count your steps with your phone, even without a watch, or connect Health Connect to bring in steps, heart rate, sleep and workouts from Samsung Health, Wear OS, Fitbit and other apps. Track walks, runs and rides with GPS.

  Log water, weight and sleep, see your progress, and set goals that fit you. Available in English, Hindi, Telugu, Tamil, Arabic, Spanish, Portuguese, French, German and Indonesian.

  FitMe gives general wellness information. It does not diagnose or treat any condition; talk to a doctor about medical questions.

- **Category:** Health & Fitness · **Contact email:** the support email set in the admin dashboard · **Privacy policy:** https://fit-me1.web.app/privacy.html
- **Screenshots:** `docs/store/screenshots/phone-*.png` (1080 × 2400 captured at 412 × 915 CSS px, 2.6×) and `tablet-*.png`.

## Health Connect permissions declaration (App content → Health apps)

FitMe only **reads** Health Connect data; it never writes. For each permission, the purpose to enter:

| Permission | Purpose shown to reviewers |
|---|---|
| READ_STEPS | Show the user's daily steps, goal progress and 7- and 30-day history. |
| READ_DISTANCE | Show distance walked or run each day. |
| READ_ACTIVE_CALORIES_BURNED | Show calories burned through activity and adjust the daily calorie balance. |
| READ_TOTAL_CALORIES_BURNED | Show total daily energy use next to food intake. |
| READ_HEART_RATE | Show average, minimum and maximum heart rate per day. |
| READ_RESTING_HEART_RATE | Show resting heart rate trends. |
| READ_HEART_RATE_VARIABILITY | Show heart rate variability trends for recovery. |
| READ_OXYGEN_SATURATION | Show blood oxygen readings from the user's watch. |
| READ_SLEEP | Show sleep duration and stages per night. |
| READ_EXERCISE | List workouts recorded by the user's watch or other apps in their workout history. |
| READ_WEIGHT | Show weight history and progress to the user's goal. |

Answers: data is used only for the user-facing features above; not sold, not used for advertising, not shared with third parties; stored encrypted in Firebase (Google Cloud) under the user's account; the user can disconnect at any time and delete all data in Settings → Delete account.

## Data safety form

| Data type | Collected | Shared | Purpose | Optional |
|---|---|---|---|---|
| Name, email address | Yes | No | Account management | Required |
| Health info (steps, heart rate, sleep, weight, food logs) | Yes | No | App functionality | Optional (user chooses what to log or connect) |
| Fitness info (workouts, physical activity) | Yes | No | App functionality | Optional |
| Precise location | Yes, only while a route is being tracked | No | App functionality (route distance) | Optional |
| Photos | Processed (meal scan, not stored); profile photo stored if the user adds one | No | App functionality | Optional |
| App interactions, crash logs, diagnostics | Yes (diagnostics only when the user taps Send diagnostics) | No | Analytics, app functionality | Optional |
| Purchase history | Yes (when payments open) | No | App functionality | Required for subscribers |

Security: data encrypted in transit (HTTPS) and at rest; users can request deletion (in-app: Settings → Delete account). No data sold. Ads: none at launch.

## Other declarations

- **Physical activity (ACTIVITY_RECOGNITION):** used to count steps with the phone's sensor; shown with an in-app explanation first.
- **Foreground service (location):** only while the user is tracking a walk, run or ride; a notification is shown the whole time. No background location permission is requested.
- **Notifications:** reminders the user sets, free-period notices and replies from support.
- **Target audience:** 18+ (health data). **Ads:** No. **Government app:** No. **News app:** No.
