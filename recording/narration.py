#!/usr/bin/env python3
"""Build exactly 105 seconds of offline draft narration, without any service calls."""
import argparse
import json
import subprocess
from pathlib import Path


def run(*args):
    subprocess.run(args, check=True)


def duration(path):
    return float(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=nw=1:nk=1", str(path)], text=True).strip())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True,
                        help="Intermediate directory, normally /workspace/work/recording/voice")
    parser.add_argument("--voice", default="slt", choices=["awb", "kal", "kal16", "rms", "slt"])
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    if any(c in str(args.output.resolve()) for c in ":,'[]\\"):
        parser.error("Use an output path without filter-reserved characters")
    spec = json.loads(Path(__file__).with_name("scenes.json").read_text())
    parts = []
    observations = []
    for scene in spec["scenes"]:
        text = args.output / (scene["id"] + ".txt")
        raw = args.output / (scene["id"] + "-raw.wav")
        part = args.output / (scene["id"] + ".wav")
        text.write_text(scene["narration"], encoding="utf-8")
        run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i",
            f"flite=textfile={text.resolve()}:voice={args.voice}", "-ac", "1", "-ar", "48000", str(raw))
        seconds = duration(raw)
        # Leave a small end pause; don't turn a dense script into rushed narration.
        tempo = max(1.0, seconds / (scene["duration"] - .4))
        if tempo > 1.25:
            raise RuntimeError(f"{scene['id']} needs {tempo:.2f}x speed: shorten narration first")
        run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(raw),
            "-af", f"atempo={tempo:.8f},apad,atrim=duration={scene['duration']},asetpts=PTS-STARTPTS",
            "-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le", str(part))
        parts.append(part.resolve())
        observations.append({"scene": scene["id"], "rawSeconds": seconds,
                             "tempo": tempo, "plannedSeconds": scene["duration"]})
    listing = args.output / "voice-parts.txt"
    listing.write_text("".join(f"file '{p}'\n" for p in parts))
    final = args.output / "narration-105s.wav"
    run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0",
        "-i", str(listing), "-af", "atrim=duration=105,asetpts=PTS-STARTPTS",
        "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", str(final))
    result = {"draft": True, "voice": args.voice, "durationSeconds": duration(final),
              "scenes": observations}
    (args.output / "voice-measurements.json").write_text(json.dumps(result, indent=2) + "\n")
    if abs(result["durationSeconds"] - 105) > 1/48000:
        raise RuntimeError("Narration is not exactly 105 seconds")
    print(f"Draft narration created: {final}; Ayo must approve the voice and pronunciation.")


if __name__ == "__main__":
    main()
