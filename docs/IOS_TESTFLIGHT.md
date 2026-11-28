# iPhone app on TestFlight

The workflow `.github/workflows/ios-testflight.yml` builds the FitMe iPhone app (bundle id `com.sindulis.fitmeai`,
HealthKit and push notifications) on a Mac in GitHub and uploads it to TestFlight. It runs only when you start it:
GitHub → **Actions** → **iOS TestFlight** → **Run workflow**.

It needs an Apple Developer account (99 USD a year) and nine GitHub secrets. Until they exist the workflow stops
at its first step and lists what is missing.

## 1. Apple Developer account
1. Enrol at https://developer.apple.com/programs/enroll/ (as an organisation: Sindulis Innovative Solutions).
2. When it is approved, note your **Team ID**: https://developer.apple.com/account → Membership details.

## 2. App ID and app record
1. https://developer.apple.com/account/resources/identifiers/list → **+** → App IDs → App.
   - Bundle ID (explicit): `com.sindulis.fitmeai`.
   - Capabilities: tick **HealthKit** and **Push Notifications**.
2. https://appstoreconnect.apple.com/apps → **+** → New App → iOS, name **FitMe**, bundle id `com.sindulis.fitmeai`,
   SKU `fitme-ios`.

## 3. Signing certificate and profile
1. On a Mac: Keychain Access → Certificate Assistant → *Request a Certificate From a Certificate Authority* → save to disk.
2. https://developer.apple.com/account/resources/certificates/list → **+** → **Apple Distribution** → upload the request
   → download → double-click to add it to Keychain → right-click it in Keychain → **Export** as `.p12` with a password.
3. https://developer.apple.com/account/resources/profiles/list → **+** → **App Store Connect** → App ID
   `com.sindulis.fitmeai` → the certificate above → name it `FitMe App Store` → download the `.mobileprovision`.

## 4. App Store Connect API key
https://appstoreconnect.apple.com/access/integrations/api → **Generate API Key**, access **App Manager** → note the
**Key ID** and **Issuer ID**, download the `.p8` file (only once).

## 5. Firebase iOS app
https://console.firebase.google.com/project/fit-me1/settings/general → **Add app** → iOS → bundle id
`com.sindulis.fitmeai` → download **GoogleService-Info.plist**. For push: Project settings → Cloud Messaging →
Apple app configuration → upload the same `.p8` key (APNs authentication key, with its Key ID and your Team ID).

## 6. GitHub secrets
GitHub → repository **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. On a Mac, make
the base64 text with `base64 -i FILE | pbcopy` and paste it.

| Secret | Value |
|---|---|
| `APPLE_TEAM_ID` | Team ID from step 1 |
| `ASC_KEY_ID` | Key ID from step 4 |
| `ASC_ISSUER_ID` | Issuer ID from step 4 |
| `ASC_KEY_P8_BASE64` | base64 of the `.p8` file |
| `IOS_DIST_CERT_P12_BASE64` | base64 of the `.p12` from step 3 |
| `IOS_DIST_CERT_PASSWORD` | the `.p12` password |
| `IOS_PROFILE_BASE64` | base64 of the `.mobileprovision` |
| `IOS_PROFILE_NAME` | `FitMe App Store` (the profile name) |
| `IOS_GOOGLE_SERVICE_INFO_PLIST_BASE64` | base64 of `GoogleService-Info.plist` |

## 7. Run and share
1. Actions → **iOS TestFlight** → **Run workflow**. After about 20 minutes the build appears in App Store Connect →
   TestFlight (Apple then processes it for a few minutes).
2. TestFlight → **External Testing** → add a group → add the build → submit for Beta App Review (first time only) →
   turn on **Public Link** and copy it.
3. FitMe admin → **App releases** → iPhone → paste the link in **TestFlight public link** → Save. The download page
   then shows "Install on iPhone (TestFlight)". When the app is live on the App Store, paste the App Store link
   instead; the page then shows the App Store badge.
