#!/usr/bin/env python3
"""Normalize an actual public-HTTPS capture to CFR before trimming exactly 3150 frames."""
import argparse
import json
import subprocess
from pathlib import Path


def run(*args):
    subprocess.run(args, check=True)


def probe(path):
    return json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-count_frames", "-show_streams", "-show_format",
        "-of", "json", str(path)], text=True))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--capture-manifest", type=Path, required=True)
    parser.add_argument("--narration", type=Path, required=True)
    parser.add_argument("--source-start-frame", type=int, required=True,
                        help="Calibrate the first introduction frame in the normalized source; do not guess")
    parser.add_argument("--work", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    manifest = json.loads(args.capture_manifest.read_text())
    if manifest.get("captureKind") != "actual-public-https-ui" or not manifest.get("url", "").startswith("https://"):
        parser.error("Only an actual public HTTPS UI capture is eligible")
    if args.source_start_frame < 0:
        parser.error("Source start frame must be nonnegative")
    raw = Path(manifest["videoPath"])
    if not raw.is_file():
        parser.error("Raw browser capture is missing")
    voice_probe = probe(args.narration)
    if abs(float(voice_probe["format"]["duration"]) - 105) > .001:
        parser.error("Narration must be exactly 105 seconds before composition")
    args.work.mkdir(parents=True, exist_ok=True)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    normalized = args.work / "actual-ui-cfr30.mp4"
    run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(raw),
        "-an", "-vf", "setpts=PTS-STARTPTS,scale=1080:1920:flags=lanczos,fps=30,setsar=1",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
        "-fps_mode", "cfr", str(normalized))
    norm = probe(normalized)
    video = next(s for s in norm["streams"] if s["codec_type"] == "video")
    if int(video["nb_read_frames"]) < args.source_start_frame + 3150:
        parser.error("Capture is too short for the selected 105-second window; padding is prohibited")
    end = args.source_start_frame + 3150
    run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(normalized),
        "-i", str(args.narration), "-filter_complex",
        f"[0:v]trim=start_frame={args.source_start_frame}:end_frame={end},setpts=PTS-STARTPTS[v];"
        "[1:a]atrim=duration=105,asetpts=PTS-STARTPTS[a]",
        "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "medium", "-crf", "18",
        "-pix_fmt", "yuv420p", "-fps_mode", "cfr", "-c:a", "aac", "-b:a", "192k",
        "-map_metadata", "-1", "-metadata", "artist=Ayo Ahmed - Independent concept",
        "-metadata", "title=Package Booking Proof", "-movflags", "+faststart", str(args.output))
    result = probe(args.output)
    video = next(s for s in result["streams"] if s["codec_type"] == "video")
    audio = next(s for s in result["streams"] if s["codec_type"] == "audio")
    checks = {
        "videoFrames3150": int(video["nb_read_frames"]) == 3150,
        "videoRate30": video["r_frame_rate"] == "30/1" and video["avg_frame_rate"] == "30/1",
        "vertical1080x1920": video["width"] == 1080 and video["height"] == 1920,
        "videoDuration105": abs(float(video["duration"]) - 105) <= 1/30,
        "audioDuration105": abs(float(audio["duration"]) - 105) <= .025,
        "containerDuration105": abs(float(result["format"]["duration"]) - 105) <= .025
    }
    (args.work / "composition-checks.json").write_text(json.dumps({
        "checks": checks, "sourceStartFrame": args.source_start_frame,
        "normalizedSource": str(normalized.resolve()), "output": str(args.output.resolve()),
        "humanFullWatch": "Pending; metadata checks do not confirm visual or audio quality."
    }, indent=2) + "\n")
    if not all(checks.values()):
        raise RuntimeError(f"Composition checks failed: {checks}")
    print(f"Exact 105-second composition created: {args.output}. Full watch and boundary inspection remain required.")


if __name__ == "__main__":
    main()
