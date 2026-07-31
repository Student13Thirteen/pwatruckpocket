#!/usr/bin/env python3
"""Small dependency-free checks for the public PwaTruckPocket repository."""

from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class StrictEnoughHTMLParser(HTMLParser):
    """Use the standard parser to catch malformed declarations and gross HTML errors."""


ERRORS: list[str] = []


def require(condition: bool, message: str) -> None:
    if not condition:
        ERRORS.append(message)


def validate_manifest() -> None:
    path = ROOT / "manifest.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    require(data.get("name"), "manifest.json: missing name")
    require(data.get("start_url"), "manifest.json: missing start_url")
    require(data.get("display") == "standalone", "manifest.json: display should be standalone")
    icons = data.get("icons") or []
    require(len(icons) >= 2, "manifest.json: expected at least two icons")



def validate_html() -> None:
    path = ROOT / "index.html"
    text = path.read_text(encoding="utf-8")
    StrictEnoughHTMLParser().feed(text)
    require("<!DOCTYPE html>" in text or "<!doctype html>" in text.lower(), "index.html: missing doctype")
    require("serviceWorker" in text, "index.html: service worker registration not found")
    require("indexedDB" in text, "index.html: offline queue storage not found")
    require("telegram.org/bot" not in text, "index.html: Telegram API must not be called directly from the client")



def validate_public_boundary() -> None:
    text_paths = [
        path
        for path in ROOT.rglob("*")
        if path.is_file()
        and ".git" not in path.parts
        and path.suffix.lower() in {".md", ".html", ".js", ".json", ".yml", ".yaml", ".example"}
    ]

    token_patterns = {
        "Telegram bot token": re.compile(r"\b\d{7,12}:[A-Za-z0-9_-]{30,}\b"),
        "private key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    }

    for path in text_paths:
        text = path.read_text(encoding="utf-8", errors="replace")
        for label, pattern in token_patterns.items():
            require(not pattern.search(text), f"{path.relative_to(ROOT)}: possible {label}")

    tracked_binaries = list(ROOT.rglob("*.apk")) + list(ROOT.rglob("*.aab")) + list(ROOT.rglob("*.jks"))
    require(not tracked_binaries, "private Android release binary or signing material is present")



def main() -> int:
    validate_manifest()
    validate_html()
    validate_public_boundary()

    if ERRORS:
        print("Public repository validation failed:", file=sys.stderr)
        for error in ERRORS:
            print(f"- {error}", file=sys.stderr)
        return 1

    print("Public repository validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
