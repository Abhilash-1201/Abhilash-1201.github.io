# abhilash-1201.github.io

Personal portfolio of **Abhilash RL**, Senior DevOps Engineer. Plain HTML, CSS and JavaScript with no build step, deployed to GitHub Pages by GitHub Actions on every push to `main`.

Live: https://abhilash-1201.github.io/

## What's in here

```
index.html                     page content
assets/css/style.css           styles
assets/js/main.js              cursor-tracking avatar + build stamp
assets/avatar/*.webp|svg       9 avatar images, one per gaze direction
assets/favicon.svg
.github/workflows/deploy.yml   validate → assemble → deploy to Pages
```

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
