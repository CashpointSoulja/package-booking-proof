#!/usr/bin/env python3
"""Extract each scene's adjacent frames and audio excerpts for human boundary review."""
import argparse
import json
import subprocess
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    spec = json.loads(Path(__file__).with_name("scenes.json").read_text())
    frames = {0, 3149}
    for scene in spec["scenes"][1:]:
        boundary = scene["start"] * 30
        frames.update([boundary - 1, boundary, boundary + 1])
        subprocess.run([
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(args.video),
            "-ss", str(scene["start"] - 1), "-t", "2", "-vn", "-c:a", "pcm_s16le",
            str(args.output / f"{scene['id']}-boundary.wav")], check=True)
    for frame in sorted(frames):
        subprocess.run([
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(args.video),
            "-vf", f"select=eq(n\\,{frame})", "-fps_mode", "vfr", "-frames:v", "1",
            str(args.output / f"frame-{frame:04d}.png")], check=True)
    (args.output / "review.json").write_text(json.dumps({
        "source": str(args.video.resolve()), "frames": sorted(frames),
        "sceneStartsSeconds": [scene["start"] for scene in spec["scenes"]],
        "boundaryReview": "Pending human inspection", "fullWatch": "Pending Ayo's complete 105-second watch"
    }, indent=2) + "\n")
    print("Boundary assets extracted. Inspect them, then watch the complete video with sound.")


if __name__ == "__main__":
    main()
