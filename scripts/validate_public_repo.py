#!/usr/bin/env python3
"""Dependency-free checks for the public PwaTruckPocket repository."""

from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []


class StrictEnoughHTMLParser(HTMLParser):
    """Catch malformed declarations and gross HTML errors."""


def require(condition: bool, message: str) -> None:
    if not condition:
        ERRORS.append(message)


def validate_required_files() -> None:
    required = [
        "Dockerfile",
        "docker-entrypoint.sh",
        "docker-compose.yml",
        "pwatruckpocket",
        ".env.example",
        "pb_migrations/1753950000_public_demo_schema.js",
        "scripts/ci_smoke.sh",
    ]
    for relative in required:
        require((ROOT / relative).is_file(), f"missing required file: {relative}")


def validate_manifest() -> None:
    data = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    require(bool(data.get("name")), "manifest.json: missing name")
    require(bool(data.get("start_url")), "manifest.json: missing start_url")
    require(data.get("display") == "standalone", "manifest.json: display should be standalone")
    require(len(data.get("icons") or []) >= 2, "manifest.json: expected at least two icons")


def validate_html() -> None:
    text = (ROOT / "index.html").read_text(encoding="utf-8")
    StrictEnoughHTMLParser().feed(text)
    require("<!doctype html>" in text.lower(), "index.html: missing doctype")
    require("serviceWorker" in text, "index.html: service worker registration not found")
    require("indexedDB" in text, "index.html: offline queue storage not found")
    require("telegram.org/bot" not in text, "index.html: Telegram API must not be called directly from the client")
    require(text.count("INSERT_URL_HERE") == 1, "index.html: expected exactly one runtime URL placeholder")


def validate_compose() -> None:
    text = (ROOT / "docker-compose.yml").read_text(encoding="utf-8")
    require("profiles:" in text and "remote" in text, "docker-compose.yml: tunnel should be optional through the remote profile")
    require("condition: service_healthy" in text, "docker-compose.yml: tunnel must wait for PocketBase health")
    require("pb_migrations" not in (ROOT / ".gitignore").read_text(encoding="utf-8"), ".gitignore: migrations must remain tracked")


def validate_public_boundary() -> None:
    text_suffixes = {".md", ".html", ".js", ".json", ".yml", ".yaml", ".example", ".sh", ""}
    text_paths = [
        path
        for path in ROOT.rglob("*")
        if path.is_file()
        and ".git" not in path.parts
        and path.suffix.lower() in text_suffixes
        and "pb_data" not in path.parts
    ]

    token_patterns = {
        "Telegram bot token": re.compile(r"\b\d{7,12}:[A-Za-z0-9_-]{30,}\b"),
        "private key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
        "Cloudflare tunnel token": re.compile(r"\beyJhIjoi[A-Za-z0-9._-]{40,}\b"),
    }

    for path in text_paths:
        text = path.read_text(encoding="utf-8", errors="replace")
        for label, pattern in token_patterns.items():
            require(not pattern.search(text), f"{path.relative_to(ROOT)}: possible {label}")

    forbidden_files = [
        *ROOT.rglob("*.apk"),
        *ROOT.rglob("*.aab"),
        *ROOT.rglob("*.jks"),
        *ROOT.rglob("*.keystore"),
        *ROOT.rglob("*.db"),
        *ROOT.rglob("*.sqlite"),
    ]
    require(not forbidden_files, "private runtime binary, database or signing material is present")
    require(not (ROOT / ".env").exists(), "real .env is present")
    require(not (ROOT / "pb_data").exists(), "PocketBase runtime data is present")


def main() -> int:
    validate_required_files()
    validate_manifest()
    validate_html()
    validate_compose()
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
