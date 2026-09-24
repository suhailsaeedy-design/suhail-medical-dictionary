#!/usr/bin/env python3
"""Suhail Medical Dictionary product-standard verification.

This check protects a small set of non-negotiable product standards:
- responsive page metadata
- consistent browser icon and canonical design layer
- correct creator name spelling
- obvious secret material never shipped in browser-facing files

It intentionally avoids style opinions that would make maintenance brittle.
"""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent

CORE_PAGES = (
    "index.html",
    "app.html",
    "anatomy.html",
    "ai.html",
    "offline.html",
    "settings.html",
    "about.html",
    "admin-login.html",
    "admin.html",
)

BROWSER_FILE_SUFFIXES = {".html", ".js", ".css", ".json", ".webmanifest"}

SECRET_PATTERNS = {
    "private key": re.compile(r"BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY"),
    "OpenAI secret key": re.compile(r"\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b"),
    "service-role assignment": re.compile(
        r'["\'](?:service[_-]?role|serviceRole)["\']\s*:\s*["\'][^"\']{8,}',
        re.IGNORECASE,
    ),
}


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    raise SystemExit(1)


def read(path: str) -> str:
    file_path = ROOT / path
    if not file_path.is_file():
        fail(f"Missing required file: {path}")
    return file_path.read_text(encoding="utf-8")


def verify_core_pages() -> None:
    for page in CORE_PAGES:
        text = read(page)

        if 'name="viewport"' not in text:
            fail(f"{page}: missing responsive viewport metadata")

        if "assets/css/design-system.css" not in text:
            fail(f"{page}: canonical design-system.css is not loaded")

        if "rel=\"icon\"" not in text and "apple-touch-icon" not in text:
            fail(f"{page}: browser/app icon is missing")

        if "Suhail Saeedi" in text or "Suhail Saeidi" in text:
            fail(f"{page}: creator surname must be spelled Saeedy")

        for tag in re.findall(r"<button\b[^>]*>", text, re.IGNORECASE):
            if not re.search(r"\btype\s*=", tag, re.IGNORECASE):
                fail(f"{page}: every button must declare an explicit type")


def verify_dictionary_runtime_contract() -> None:
    js = read("assets/js/dictionary.js")
    bad_collection_selector = re.compile(r"(?<!\$)\$\('\.(?:view-btn|category-card)'\)\.forEach")
    if bad_collection_selector.search(js):
        fail("dictionary.js: single-element selector used with forEach; use $$() for collections")


def verify_shared_design_contract() -> None:
    css = read("assets/css/design-system.css")
    required_tokens = (
        "--ux-touch",
        ".app-sidebar",
        ".app-topbar",
        ".settings-advanced",
        "@media(max-width:860px)",
        "@media(max-width:520px)",
    )
    for token in required_tokens:
        if token not in css:
            fail(f"design-system.css: missing required contract token {token}")


def verify_repository_hygiene() -> None:
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        relative = path.relative_to(ROOT).as_posix()
        lowered = relative.lower()
        if lowered.endswith((".tmp", ".bak", ".orig", ".swp")):
            fail(f"{relative}: temporary/backup artifact must not be committed")
        if "saeedi" in lowered or "saeidi" in lowered:
            fail(f"{relative}: creator surname in file path must be spelled Saeedy")

    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in {".html",".js",".css",".json",".md",".py",".yml",".yaml",".webmanifest"}:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        lowered_text=text.lower()
        misspellings=(
            "suhail "+"sa"+"eedi",
            "suhail "+"sa"+"eidi",
            "suhail-"+"sa"+"eedi",
            "suhail-"+"sa"+"eidi",
        )
        if any(bad in lowered_text for bad in misspellings):
            fail(f"{path.relative_to(ROOT)}: creator surname/reference must be spelled Saeedy")


def verify_browser_files_for_obvious_secrets() -> None:
    ignored_parts = {".git", "_site", "node_modules"}

    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in BROWSER_FILE_SUFFIXES:
            continue
        if any(part in ignored_parts for part in path.parts):
            continue

        text = path.read_text(encoding="utf-8", errors="ignore")
        relative = path.relative_to(ROOT)

        for label, pattern in SECRET_PATTERNS.items():
            if pattern.search(text):
                fail(f"{relative}: possible {label} exposed in browser-facing source")


def main() -> None:
    verify_core_pages()
    verify_dictionary_runtime_contract()
    verify_shared_design_contract()
    verify_repository_hygiene()
    verify_browser_files_for_obvious_secrets()
    print("PASS: Suhail Medical Dictionary product-standard checks")


if __name__ == "__main__":
    main()
