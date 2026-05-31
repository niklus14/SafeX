# myRegion — Flutter app

A 1:1 Flutter port of the React/TypeScript `mobile/` app: the citizen-facing
civic issue-reporting app for Nərimanov rayonu, Baku. Same screens, same brand,
same Azerbaijani copy, same backend API.

> **Flutter is not installed in this repo's build machine.** This directory
> contains only `lib/` + `pubspec.yaml`. You must generate the platform folders
> and fetch packages before running (steps below).

## 1. Generate platform scaffolding + install packages

```bash
cd mobile_flutter
flutter create .            # generates android/, ios/, web/, etc. — keeps lib/
flutter pub get
```

## 2. Point the app at the backend

The API base URL defaults to `http://localhost:8000`. On a real device or
Android emulator, override it at run time:

```bash
# Android emulator (host loopback)
flutter run --dart-define=API_URL=http://10.0.2.2:8000

# Physical phone on the same Wi-Fi (use your Mac's LAN IP)
flutter run --dart-define=API_URL=http://192.168.1.50:8000
```

Make sure the backend is running:
```bash
cd ../back && OPENWAVE_MOCK=1 uvicorn main:app --reload --port 8000
```

## 3. Add the native permission declarations

Camera + GPS will crash without these. After `flutter create .`:

### iOS — `ios/Runner/Info.plist` (inside the top `<dict>`)
```xml
<key>NSCameraUsageDescription</key>
<string>Problemi fotoşəkil ilə sənədləşdirmək üçün kameraya icazə lazımdır.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Qalereyadan şəkil seçmək üçün icazə lazımdır.</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>Problemin dəqiq ünvanını təyin etmək üçün məkan icazəsi lazımdır.</string>
```

### Android — `android/app/src/main/AndroidManifest.xml` (above `<application>`)
```xml
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
<uses-permission android:name="android.permission.INTERNET"/>
```
Set `minSdkVersion 21` (or higher) in `android/app/build.gradle`.

## 4. Run

```bash
flutter run
```

---

## Architecture (mirrors mobile/src/)

```
lib/
  main.dart            ← RootView: screen-enum router (port of App.tsx)
  theme.dart           ← AppColors + ThemeData (port of index.css @theme)
  models.dart          ← Report, Reward, UserProfile, Draft + enum label maps (types.ts)
  api.dart             ← typed http client (api.ts)
  geolocate.dart       ← GPS + reverse-geocode (geolocate.ts)
  app_state.dart       ← ChangeNotifier: all state + actions + bootstrap (store.tsx)
  widgets/
    common.dart        ← AppImage, Pill, InitialAvatar, StatusStyle
    shell.dart         ← ShellHeader, ShellBottomNav (+FAB), ToastOverlay
  screens/
    onboarding_screen.dart        my_reports_screen.dart
    permissions_screen.dart       rewards_screen.dart
    feed_screen.dart              profile_screen.dart
    report_detail_screen.dart     messages_screen.dart
    camera_screen.dart            message_thread_screen.dart
    create_details_screen.dart    reward_claimed_screen.dart
    ai_analysis_screen.dart
    report_success_screen.dart
```

### State management
`AppState extends ChangeNotifier`, provided once at the root via `provider`.
Every React reducer case is a method (`toggleUpvote`, `loadFeed`, `completeAnalysis`,
`claimReward`, …). Navigation is `appState.navigate(Screen.x)`; the `RootView`
rebuilds on `screen` change — same single-tree, enum-switch model as `App.tsx`
(no `Navigator` stack), which keeps the bottom-nav shell persistent.

### Camera & location are real
- **Camera**: `image_picker` launches the native camera (`ImageSource.camera`)
  or gallery; the captured file path is stored in `draft.photo` and rendered
  via `Image.file`.
- **Location**: `geolocator.getCurrentPosition()` + `geocoding.placemarkFromCoordinates()`
  resolves an Azerbaijani street label; runs on the camera + create-details
  screens, writing `lat`/`lng`/`location` into the draft.
- **Permissions**: `permission_handler` drives the real OS prompts on the
  permissions screen.

### Notes
- `google_fonts` fetches Hanken Grotesk + Plus Jakarta Sans on first launch
  (needs network once, then cached). To ship fully offline, bundle the .ttf
  files and switch `theme.dart` to a local `fontFamily`.
- The leaderboard (rewards/profile) is static demo data, matching the React app.
- User id is persisted with `shared_preferences` (port of `localStorage`).
