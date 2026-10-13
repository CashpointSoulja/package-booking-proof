#!/usr/bin/env python3
"""Capture only the approved, actual public HTTPS UI with visible real interactions."""
import argparse
import asyncio
import ipaddress
import json
import os
import socket
import time
from pathlib import Path
from urllib.parse import urlparse

from playwright.async_api import async_playwright


CURSOR = r"""(() => {
  const install = () => {
    const dot = document.createElement('div');
    dot.setAttribute('aria-hidden', 'true');
    dot.style.cssText = 'position:fixed;left:-50px;top:-50px;width:18px;height:18px;border:2px solid #fff;border-radius:50%;background:#261a28;box-shadow:0 0 0 2px #261a28;pointer-events:none;z-index:2147483647;transform:translate(-50%,-50%);';
    document.documentElement.appendChild(dot);
    document.addEventListener('mousemove', e => {dot.style.left=e.clientX+'px';dot.style.top=e.clientY+'px';}, true);
    document.addEventListener('mousedown', () => {dot.style.background='#f2a9cb';dot.style.width='25px';dot.style.height='25px';}, true);
    document.addEventListener('mouseup', () => {dot.style.background='#261a28';dot.style.width='18px';dot.style.height='18px';}, true);
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', install, {once:true}) : install();
})();"""


def public_https(value):
    url = urlparse(value)
    host = url.hostname or ""
    if url.scheme != "https" or not host or url.username or url.password or url.port not in (None, 443):
        raise ValueError("Use a public HTTPS origin on port 443 without embedded credentials")
    if host == "localhost" or host.endswith((".localhost", ".local", ".internal")):
        raise ValueError("Local/internal hosts cannot be recorded")
    addresses = {info[4][0] for info in socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)}
    if not addresses or any(not ipaddress.ip_address(address).is_global for address in addresses):
        raise ValueError("Hostname must resolve exclusively to public addresses")
    return f"https://{url.netloc}"


async def interact(page, action, output):
    locator = page.locator(action["selector"])
    await locator.wait_for(state="visible", timeout=7000)
    await locator.scroll_into_view_if_needed()
    box = await locator.bounding_box()
    if not box:
        raise RuntimeError(f"No visible target for {action['selector']}")
    x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
    await page.mouse.move(x, y, steps=20)
    await page.wait_for_timeout(150)
    if action["kind"] == "click":
        await locator.click(timeout=7000)
    elif action["kind"] == "download":
        async with page.expect_download(timeout=7000) as pending:
            await locator.click(timeout=7000)
        download = await pending.value
        if download.suggested_filename != "synthetic-session-audit.json":
            raise RuntimeError("Unexpected export filename")
        folder = output / "downloads"
        folder.mkdir(exist_ok=True)
        path = folder / "synthetic-session-audit.json"
        await download.save_as(str(path))
        audit = json.loads(path.read_text())
        if not audit.get("synthetic") or audit.get("author") != "Ayo Ahmed - Independent concept":
            raise RuntimeError("Export did not contain the expected synthetic session audit")
    elif action["kind"] == "check":
        await locator.set_checked(action.get("checked", True), timeout=7000)
    elif action["kind"] == "fill":
        await locator.fill(action["value"], timeout=7000)
    elif action["kind"] == "select":
        await locator.select_option(action["value"], timeout=7000)
    elif action["kind"] == "show":
        pass
    else:
        raise ValueError(f"Unsupported action kind: {action['kind']}")
    if "expect" in action:
        expected = action["expect"]
        target = page.locator(expected["selector"])
        await target.wait_for(state="visible", timeout=7000)
        if "text" in expected:
            from playwright.async_api import expect
            await expect(target).to_contain_text(expected["text"], timeout=7000)
    pause = action.get("waitAfterSeconds", 0)
    if not isinstance(pause, (int, float)) or not 0 <= pause <= 5:
        raise ValueError("Action pause must be between zero and five seconds")
    if pause:
        await page.wait_for_timeout(pause * 1000)


async def capture(args):
    plan = json.loads(args.actions.read_text())
    if not plan.get("ready"):
        raise ValueError("Action plan is not confirmed against the implemented UI")
    origin = public_https(args.url)
    if origin != args.approved_origin.rstrip("/"):
        raise ValueError("URL does not match the explicitly owner-approved origin")
    args.output.mkdir(parents=True, exist_ok=True)
    spec = json.loads(Path(__file__).with_name("scenes.json").read_text())
    if len(plan["scenes"]) != len(spec["scenes"]):
        raise ValueError("Action plan must contain all eight scenes")
    observed = []
    errors = []
    manifest = {"url": args.url, "approvedOrigin": origin, "viewport": {"width": 540, "height": 960},
                "captureKind": "failed-public-https-ui", "scenes": observed,
                "publicOriginResolved": True, "readyToVideoStartOffset": "Human frame calibration required"}
    async with async_playwright() as p:
        launch = {"headless": True, "executable_path": args.chromium}
        # Preserve the environment's configured proxy without logging credentials.
        proxy_value = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
        if proxy_value:
            proxy = urlparse(proxy_value)
            config = {"server": f"{proxy.scheme}://{proxy.hostname}:{proxy.port or 80}"}
            if proxy.username:
                config["username"] = proxy.username
                config["password"] = proxy.password or ""
            launch["proxy"] = config
        browser = await p.chromium.launch(**launch)
        context = await browser.new_context(viewport={"width": 540, "height": 960},
                                            device_scale_factor=1,
                                            record_video_dir=str(args.output / "raw"),
                                            record_video_size={"width": 540, "height": 960})
        await context.add_init_script(CURSOR)

        async def guard(route):
            request_url = urlparse(route.request.url)
            if request_url.scheme in ("data", "blob") or f"{request_url.scheme}://{request_url.netloc}" == origin:
                await route.continue_()
            else:
                await route.abort()

        await context.route("**/*", guard)
        page = await context.new_page()
        capture_start = time.monotonic()
        page.on("pageerror", lambda error: errors.append(str(error)))
        try:
            response = await page.goto(args.url, wait_until="networkidle", timeout=30000)
            if not response or response.status != 200 or not page.url.startswith(origin + "/"):
                raise RuntimeError("Public deployed page did not return its actual interface with HTTP 200")
            from playwright.async_api import expect
            await expect(page.locator("body")).to_contain_text("Ayo Ahmed")
            await expect(page.locator("body")).to_contain_text("Unofficial")
            await expect(page.locator("body")).to_contain_text("synthetic")
            await page.wait_for_timeout(2000)
            ready = time.monotonic()
            manifest["estimatedReadyOffsetSeconds"] = ready - capture_start
            await page.screenshot(path=str(args.output / "public-ui-introduction.png"))
            for scene, planned in zip(spec["scenes"], plan["scenes"]):
                if scene["id"] != planned["id"]:
                    raise ValueError("Scene IDs must match the narration timeline")
                remaining = ready + scene["start"] - time.monotonic()
                if remaining > 0:
                    await asyncio.sleep(remaining)
                mark = {"id": scene["id"], "plannedStart": scene["start"],
                        "observedStart": time.monotonic() - ready, "actions": []}
                observed.append(mark)
                print(f"Recording actual public UI: {scene['id']}", flush=True)
                for action in planned.get("actions", []):
                    await interact(page, action, args.output)
                    mark["actions"].append({"selector": action["selector"], "kind": action["kind"],
                                            "observedSeconds": time.monotonic() - ready})
                if time.monotonic() - ready > scene["start"] + scene["duration"]:
                    raise RuntimeError(f"{scene['id']} overran its narration window; retry rather than cut out required proof")
            remaining = ready + 107 - time.monotonic()
            if remaining > 0:
                await asyncio.sleep(remaining)
            await page.screenshot(path=str(args.output / "public-ui-final.png"))
            if errors:
                raise RuntimeError(f"UI emitted {len(errors)} browser error(s); inspect before recording again")
            manifest["captureKind"] = "actual-public-https-ui"
        except Exception as error:
            manifest["failure"] = str(error)
            raise
        finally:
            video = page.video
            await context.close()
            manifest["videoPath"] = str(Path(await video.path()).resolve())
            manifest["browserErrorCount"] = len(errors)
            (args.output / "capture-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
            await browser.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", required=True)
    parser.add_argument("--approved-origin", required=True,
                        help="Owner-approved public origin. The flag does not itself grant deployment approval.")
    parser.add_argument("--actions", type=Path, default=Path(__file__).with_name("actions.json"))
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--chromium", default="/usr/bin/chromium")
    args = parser.parse_args()
    asyncio.run(capture(args))


if __name__ == "__main__":
    main()
