# Dispatch for iOS

This folder is the iPhone app. Capacitor runs the web app inside a native shell, and you build that shell in Xcode on the Mac.

- `../index.html` is the app. It's the same file as the web version, so it's the only file you edit.
- `scripts/build.mjs` turns it into the app page at `www/index.html`, bundles the fonts (no Google Fonts requests), copies the latest `editions.json` in as the offline fallback, and points the app at `https://chapman-w.github.io/dispatch/editions.json` for each day's edition.
- `ios/` is the Xcode project. It's set up for iPhone only, portrait, light status bar on the dark theme, with the icon and launch screen in place.
- `store/` has the App Store listing text and the privacy policy (also published at the Pages URL).

## What's native

| Feature | Plugin | Where in index.html |
|---|---|---|
| Daily notification at the chosen time | `@capacitor/local-notifications` | `nativeNotify()` — scheduled when onboarding finishes and when the time changes in Settings |
| Saved progress survives storage clean-ups | `@capacitor/preferences` | `save()` mirrors the state; a boot check restores it |
| Haptics | `@capacitor/haptics` | `haptic()` |
| Status bar colour follows the theme | `@capacitor/status-bar` | `applyPrefs()` |
| New edition check on open and on return to foreground | fetch | `checkEditions()` |

Everything degrades cleanly on the web: each hook checks for `window.Capacitor` first.

## One-time setup on the Mac

1. Install **Xcode** from the Mac App Store, open it once, accept the licence, and include the **iOS** platform.
2. Install **Node.js** (LTS) from https://nodejs.org.
3. Get the project: `git clone https://github.com/chapman-w/dispatch.git ~/Developer/dispatch`
4. In Terminal:
   ```
   cd ~/Developer/dispatch/app
   npm install
   npm run ios
   ```
   Xcode opens the project and fetches Capacitor's packages the first time (a minute or two).

## Run it on your iPhone

1. In Xcode, click **App** in the sidebar → the **App** target → **Signing & Capabilities**. Tick **Automatically manage signing** and pick your **Team**.
2. Plug the iPhone in, tap **Trust** on the phone, pick it as the run destination and press **▶ Run**.
3. The app asks for notification permission after onboarding. Say yes to get the daily edition at the time you picked.

## Updating

After `index.html` changes (or a new edition lands), on the Mac:

```
cd ~/Developer/dispatch && git pull
cd app && npm run update
```

Then press Run in Xcode. For an App Store build, bump **Build** in the target's General tab, then Product → Archive.

## Submitting

See `store/listing.md` for the listing text and screenshot sizes. The privacy policy URL is https://chapman-w.github.io/dispatch/privacy.html.
