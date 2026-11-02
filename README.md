# abhilash-1201.github.io

Personal portfolio of **Abhilash RL**, Senior DevOps Engineer. Plain HTML, CSS and JavaScript with no build step, deployed to GitHub Pages by GitHub Actions on every push to `main`.

Live: https://abhilash-1201.github.io/

## What's in here

```
index.html                     welcome screen (gate) + profile page
assets/css/style.css           styles (white theme)
assets/js/landing.js           welcome screen: CI/CD loop + construction site animation
assets/js/main.js              intro video playback, sound toggle, replay, About photo tracking, build stamp
assets/video/intro.mp4         talking intro shown beside the name after "Visit my profile"
assets/video/final-pose.webp   still frame used if the video can't play
assets/logos/*.png             tool logos on the construction-site signs
assets/avatar/*.webp           9 photos, one per gaze direction (About section)
.github/workflows/deploy.yml   validate → assemble → deploy to Pages
```

## How the intro works

The page opens on the welcome screen. Clicking **Visit my profile** fades it out and plays `intro.mp4`
with sound (the click is what lets the browser play audio). If a browser still blocks sound, the video
plays muted and the **Tap for sound** button appears. **Replay intro** in the hero plays it again.

To swap the video, replace `assets/video/intro.mp4` (and `final-pose.webp` with its last frame).
Keep the video background pure white so it blends into the page.

Placeholders that still need your details are shown as dashed blue boxes (Education, Certifications,
Achievements). Search `index.html` for `class="todo"` to find them.

## How the cursor tracking works

There are nine images of the same character, identical except for where the head and eyes point:
`up-left, up, up-right, left, center, right, down-left, down, down-right`.

`main.js` finds the face's position on screen, works out the angle to the cursor, picks the nearest of the eight directions (or `center` when the cursor is close to the face) and shows that image. All nine are stacked and preloaded, so the swap is instant. On phones, or when the mouse is still, the avatar glances around on its own.

If the face isn't centred where the script expects, adjust `FACE_X` / `FACE_Y` at the top of `main.js`.

## Deploy

1. Push to `main`.
2. In the repo go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions** (one-time).
3. The workflow checks that every referenced file exists, stamps the commit SHA into the footer and publishes the site.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```
