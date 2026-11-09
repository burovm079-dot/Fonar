# FONAR

A polished, mobile-first flashlight web app built with React, TypeScript, Vite and Framer Motion.

## Features

- Animated power control, soft glow and ambient light effects
- Responsive mobile-first interface
- Real device torch support through the MediaStream torch constraint
- Camera permission and unsupported-device handling
- Camera stream is released when the page is hidden or closed
- No sign-up, tracking, or paywall for turning the light off

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Publish with GitHub Pages

1. Open **Settings → Pages** in this repository.
2. Set **Build and deployment → Source** to **GitHub Actions**.
3. Open the **Actions** tab and check the **Deploy FONAR to GitHub Pages** workflow.

The workflow builds the project and publishes it automatically. The site address will be:

https://burovm079-dot.github.io/Fonar/

## Device support

Deploy over HTTPS. Flashlight control depends on the phone and browser exposing the camera torch capability. Chromium-based browsers on supported Android devices are generally the most reliable; iOS Safari may not expose torch control to web pages.

FONAR requests camera permission only to control the rear flash. It does not record or upload video. The light can always be switched off for free.
