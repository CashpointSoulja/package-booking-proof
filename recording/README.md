# Recording sources

Author: Ayo Ahmed — Independent concept for Trybe. Unofficial. This folder provides a reproducible plan and utilities, not a published demo or completed video.

`scenes.json` is the eight-scene 105-second narration source. `actions.json` is the real interface interaction plan. `capture.py` refuses an unconfirmed action plan and rejects HTTP, localhost, private addresses and an origin different from the owner-approved destination. The browser records actual UI transitions and injects only a visible pointer following real mouse events. It blocks third-party network requests so recording remains scoped to the approved origin. Bundle any required fonts and assets in the deployed application. The recorded footage includes navigation lead-in; calibrate its first introduction frame before composing.

Prerequisites: Python 3 with Playwright; Chromium; ffmpeg and ffprobe. No voice subscription is required. The installed offline speech filter can create a rehearsal voice; Ayo can replace it with a 105-second personal narration WAV. Speech synthesis runs locally and does not call a paid service.

From the repository root, create rehearsal narration in the intermediate directory:

```bash
python recording/narration.py --output /workspace/work/recording/voice
```

Once the owner has approved a deployment destination, deployment is complete, the actual public URL is reachable, and `actions.json` has been confirmed against that interface:

```bash
python recording/capture.py \
  --url https://APPROVED-HOST/ \
  --approved-origin https://APPROVED-HOST \
  --output /workspace/work/recording/public-capture
```

Replace `APPROVED-HOST` with that approved destination. This command does not create a deployment and its approval flag does not grant approval. Preserve configured proxies and follow the environment's network policy. Do not point it at a temporary localhost tunnel or a substitute site.

Normalize the raw capture before finding the start frame. To inspect the whole source without creating a deliverable, use:

```bash
ffmpeg -i /workspace/work/recording/public-capture/raw/ACTUAL-CAPTURE.webm \
  -an -vf 'setpts=PTS-STARTPTS,scale=1080:1920:flags=lanczos,fps=30,setsar=1' \
  -c:v libx264 -pix_fmt yuv420p -fps_mode cfr \
  /workspace/work/recording/start-frame-calibration.mp4
```

Find the first introduction frame after navigation in that normalized source; use the measured frame number, not a guessed timestamp. The capture manifest's estimated ready offset helps locate it but is not frame-accurate evidence. Replace `CALIBRATED-FRAME` below with the actual nonnegative frame number.

```bash
python recording/compose.py \
  --capture-manifest /workspace/work/recording/public-capture/capture-manifest.json \
  --narration /workspace/work/recording/voice/narration-105s.wav \
  --source-start-frame CALIBRATED-FRAME \
  --work /workspace/work/recording/composition \
  --output /codex/browser/projectless/0003-build-package-booking-proof-for-ayo-ahmed-s-inde/output/ayo-package-booking-105s.mp4
python recording/inspect_boundaries.py \
  /codex/browser/projectless/0003-build-package-booking-proof-for-ayo-ahmed-s-inde/output/ayo-package-booking-105s.mp4 \
  --output /workspace/work/recording/boundaries
```

Composition first converts the entire source to constant 30 fps, then trims frame numbers. It refuses a source shorter than the selected 3,150-frame window; it cannot pad a missing demonstration. It records frame count, frame rate, dimensions, audio duration and container duration in `composition-checks.json`. Scene boundary samples cover the adjacent frames at 10, 21, 35, 50, 65, 78 and 91 seconds, plus the first and final frames and two-second audio excerpts. The final scene executes both normal and deliberately broken checks, then saves the actual synthetic audit download under the capture's intermediate `downloads/` directory.

Inspect every boundary and then have Ayo watch the complete exported video with sound. Metadata checks and draft audio do not prove a finished recording. No outreach, deployments, payments or signups are performed by these utilities.
