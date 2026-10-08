# OBS chat overlay (1920×1080)

Transparent browser overlay with black bars for bottom-left / bottom-right chat. Config reloads **every 1 second** from `config.json` (push to GitHub → updates on stream within ~1s + Pages deploy time).

## Streamer setup (OBS)

1. Wait until GitHub Pages is live (see **Owner setup** below).
2. OBS → **Sources** → **Browser**.
3. **URL:** `https://<github-user>.github.io/<repo-name>/`
4. **Width:** `1920` · **Height:** `1080`
5. Enable **Shutdown source when not visible** only if you want to save CPU (overlay stops refreshing when hidden).

Optional query params:

- `?debug=1` — grid and mask outlines (alignment only)
- `?refresh=2000` — poll config every 2s (default `1000`; `?refresh=0` disables polling)

## Owner setup (GitHub Pages)

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment:** Source = **GitHub Actions**.
3. After the first push to `main`, open **Actions** and confirm **Deploy to GitHub Pages** succeeded.
4. The site URL is shown under **Settings → Pages**.

Edit `config.json` and push; the overlay picks up changes on the next poll (about 1 second after the new deploy is live).

## Local test

```bash
python3 -m http.server 8765
```

Open `http://127.0.0.1:8765/?debug=1`
