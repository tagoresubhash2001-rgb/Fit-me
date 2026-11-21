# iOS: what has to be done on a Mac

The Xcode project is ready: HealthKit entitlement (`ios/App/App/App.entitlements`), background modes (location while
tracking, remote notifications), every permission text (motion, health, camera, photos, location when in use and
during tracking), the FitMe app icon and launch screen, display name FitMe, the FitMeSteps (Core Motion) plugin.
It has not been compiled here (no Mac in the cloud environment).

1. On a Mac with Xcode 16+: `git clone` the repository, then `npm ci && npm run build && npx cap sync ios && npx cap open ios`.
2. Firebase: in the Firebase console add an **iOS app** with bundle ID `com.sindulis.fitmeai`, download
   `GoogleService-Info.plist` and drag it into `ios/App/App` in Xcode (target App).
3. Xcode → App target → **Signing & Capabilities**: choose your Apple Developer team; confirm **HealthKit**,
   **Background Modes** (Location updates, Remote notifications) and add **Push Notifications** and **Sign in with Apple**.
4. Apple Developer → Keys: create an APNs key and upload it in Firebase console → Project settings → Cloud Messaging → Apple app.
5. Product → Archive → Distribute → App Store Connect. Then in App Store Connect: privacy labels (Health & Fitness,
   Photos, Precise Location — app functionality, not tracking), subscriptions (see `pricing.md`), screenshots
   (6.7" and 5.5" from `docs/store/screenshots`), and submit for review.
6. Test on an iPhone with the checklist in `docs/PHONE_TEST.md` (iOS section).
