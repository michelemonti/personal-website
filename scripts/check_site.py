#!/usr/bin/env python3
"""Dependency-free integrity checks for the static site."""

from __future__ import annotations

import json
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
SITE_URL = "https://michelemonti.me"
THREE_JS_URL = "https://cdn.jsdelivr.net/npm/three@0.154.0/build/three.min.js"
EXO_STYLESHEET_PREFIX = "https://fonts.googleapis.com/css2?family=Exo"
ALLOWED_STYLE_HOSTS = {"fonts.googleapis.com"}
ALLOWED_FONT_HOSTS = {"fonts.gstatic.com"}
ALLOWED_PRECONNECT_HOSTS = {"fonts.googleapis.com", "fonts.gstatic.com"}
PAGES = ("home", "profile", "experience", "work")
LANGUAGE_TAGS = {
    "it": "it-IT",
    "en": "en-US",
    "es": "es-ES",
    "ca": "ca-ES",
    "fr": "fr-FR",
    "sr": "sr-RS",
    "ru": "ru-RU",
}
ROUTES = {
    "it": {
        "home": "/",
        "profile": "/profilo-michele-monti.html",
        "experience": "/esperienze.html",
        "work": "/work-with-me.html",
    },
    "en": {
        "home": "/en/",
        "profile": "/en/michele-monti.html",
        "experience": "/en/experience.html",
        "work": "/en/work-with-me.html",
    },
    "es": {
        "home": "/es/",
        "profile": "/es/michele-monti.html",
        "experience": "/es/experiencia.html",
        "work": "/es/trabaja-conmigo.html",
    },
    "ca": {
        "home": "/ca/",
        "profile": "/ca/michele-monti.html",
        "experience": "/ca/experiencia.html",
        "work": "/ca/treballa-amb-mi.html",
    },
    "fr": {
        "home": "/fr/",
        "profile": "/fr/michele-monti.html",
        "experience": "/fr/experience.html",
        "work": "/fr/travailler-avec-moi.html",
    },
    "sr": {
        "home": "/sr/",
        "profile": "/sr/michele-monti.html",
        "experience": "/sr/iskustvo.html",
        "work": "/sr/rad-sa-mnom.html",
    },
    "ru": {
        "home": "/ru/",
        "profile": "/ru/michele-monti.html",
        "experience": "/ru/opyt.html",
        "work": "/ru/rabotat-so-mnoy.html",
    },
}


class SiteDocument(HTMLParser):
    """Collect only the document facts needed by the checks below."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.html_lang = ""
        self.title_parts: list[str] = []
        self.in_title = False
        self.in_header = False
        self.header: dict[str, str] = {}
        self.header_links: list[dict[str, str]] = []
        self.anchors: list[dict[str, str]] = []
        self.buttons: list[dict[str, str]] = []
        self.images: list[dict[str, str]] = []
        self.ids: list[str] = []
        self.links: list[dict[str, str]] = []
        self.metas: list[dict[str, str]] = []
        self.scripts: list[dict[str, str]] = []
        self.references: list[str] = []
        self.json_ld: list[str] = []
        self.tag_sequence: list[tuple[str, str]] = []
        self._json_parts: list[str] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.tag_sequence.append(("start", tag))
        attributes = {key: value or "" for key, value in attrs}
        if element_id := attributes.get("id"):
            self.ids.append(element_id)
        if tag == "html":
            self.html_lang = attributes.get("lang", "")
        elif tag == "title":
            self.in_title = True
        elif tag == "header" and "site-header" in attributes.get("class", "").split():
            self.in_header = True
            self.header = attributes
        elif tag == "a":
            self.anchors.append(attributes)
            if self.in_header:
                self.header_links.append(attributes)
        elif tag == "button":
            self.buttons.append(attributes)
        elif tag == "img":
            self.images.append(attributes)

        if tag == "link":
            self.links.append(attributes)
        elif tag == "meta":
            self.metas.append(attributes)
        elif tag == "script":
            self.scripts.append(attributes)
            if attributes.get("type") == "application/ld+json":
                self._json_parts = []

        for attribute in ("href", "src"):
            value = attributes.get(attribute)
            if value:
                self.references.append(value)

    def handle_endtag(self, tag: str) -> None:
        self.tag_sequence.append(("end", tag))
        if tag == "title":
            self.in_title = False
        elif tag == "header":
            self.in_header = False
        elif tag == "script" and self._json_parts is not None:
            self.json_ld.append("".join(self._json_parts))
            self._json_parts = None

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)
        if self._json_parts is not None:
            self._json_parts.append(data)

    @property
    def title(self) -> str:
        return "".join(self.title_parts).strip()


errors: list[str] = []


def check(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


def output_path(route: str) -> Path:
    if route.endswith("/"):
        return ROOT / route.lstrip("/") / "index.html"
    return ROOT / route.lstrip("/")


def local_target(reference: str, document: Path) -> Path | None:
    parsed = urlsplit(reference)
    if parsed.scheme in {"mailto", "tel", "data"}:
        return None
    if parsed.netloc and parsed.netloc != "michelemonti.me":
        return None
    if parsed.scheme and parsed.scheme not in {"http", "https"}:
        return None
    if not parsed.path:
        return None

    path = unquote(parsed.path)
    target = ROOT / path.lstrip("/") if path.startswith("/") else document.parent / path
    return target / "index.html" if path.endswith("/") else target


def parse_document(path: Path) -> tuple[str, SiteDocument]:
    source = path.read_text(encoding="utf-8")
    document = SiteDocument()
    document.feed(source)
    return source, document


def validate_page(locale: str, page: str, route: str) -> None:
    path = output_path(route)
    label = f"{locale}/{page}"
    check(path.is_file(), f"{label}: missing {path.relative_to(ROOT)}")
    if not path.is_file():
        return

    source, document = parse_document(path)
    expected_url = f"{SITE_URL}{route}"
    check(document.html_lang == locale, f"{label}: html lang is {document.html_lang!r}")
    check(bool(document.title), f"{label}: empty title")
    descriptions = [
        meta.get("content", "")
        for meta in document.metas
        if meta.get("name") == "description"
    ]
    check(len(descriptions) == 1 and bool(descriptions[0].strip()), f"{label}: missing description")
    check(document.header.get("data-locale") == locale, f"{label}: wrong header locale")
    check(document.header.get("data-page") == page, f"{label}: wrong header page")
    check("data-i18n=" not in source, f"{label}: stale runtime translation hooks")
    check("data-static=" not in source, f"{label}: stale static-header hook")
    check("family=Exo" in source, f"{label}: missing Exo font stylesheet")
    check('name="theme-color"' in source, f"{label}: missing theme-color")
    check('name="color-scheme"' in source, f"{label}: missing color-scheme")
    check(f"{SITE_URL}/llms.txt" in source, f"{label}: missing llms.txt discovery link")
    check(f"{SITE_URL}/michele-monti.json" in source, f"{label}: missing entity JSON link")
    check('rel="author"' in source, f"{label}: missing author link")
    check(len(document.ids) == len(set(document.ids)), f"{label}: duplicate element id")
    check(
        all(
            "alt" in image and image.get("width") and image.get("height")
            for image in document.images
        ),
        f"{label}: image without alt text or intrinsic dimensions",
    )
    check(
        all(button.get("type") in {"button", "submit", "reset"} for button in document.buttons),
        f"{label}: button without an explicit type",
    )
    check(
        all(
            {"noopener", "noreferrer"}.issubset(anchor.get("rel", "").split())
            for anchor in document.anchors
            if anchor.get("target") == "_blank"
        ),
        f"{label}: target=_blank link without noopener noreferrer",
    )

    canonicals = [
        link.get("href")
        for link in document.links
        if "canonical" in link.get("rel", "").split()
    ]
    check(canonicals == [expected_url], f"{label}: wrong canonical")

    alternates = {
        link.get("hreflang"): link.get("href")
        for link in document.links
        if "alternate" in link.get("rel", "").split() and link.get("hreflang")
    }
    expected_alternates = {
        other: f"{SITE_URL}{ROUTES[other][page]}" for other in ROUTES
    }
    expected_alternates["x-default"] = f"{SITE_URL}{ROUTES['it'][page]}"
    check(alternates == expected_alternates, f"{label}: incomplete hreflang cluster")

    nav_links = [
        link
        for link in document.header_links
        if not {"brand", "language-option"}.intersection(link.get("class", "").split())
    ]
    expected_nav = [ROUTES[locale][key] for key in PAGES]
    check([link.get("href") for link in nav_links] == expected_nav, f"{label}: wrong navigation")
    current_pages = [link.get("href") for link in nav_links if link.get("aria-current") == "page"]
    check(current_pages == [route], f"{label}: wrong active navigation item")

    script_sources = [script.get("src") for script in document.scripts if script.get("src")]
    expected_scripts = ["/site-chrome.js"]
    if page in {"home", "work"}:
        expected_scripts = [THREE_JS_URL, "/site-chrome.js", "/body.js"]
    check(script_sources == expected_scripts, f"{label}: unexpected scripts {script_sources}")

    for raw_json in document.json_ld:
        try:
            data = json.loads(raw_json)
        except json.JSONDecodeError as error:
            errors.append(f"{label}: invalid JSON-LD: {error}")
            continue

        for node in data.get("@graph", [data]):
            node_type = node.get("@type")
            if node_type in {"WebPage", "ProfilePage", "CollectionPage"}:
                check(node.get("url") == expected_url, f"{label}: wrong JSON-LD URL")
                check(
                    node.get("inLanguage") == LANGUAGE_TAGS[locale],
                    f"{label}: wrong JSON-LD language",
                )
            elif node_type == "Person":
                check("email" not in node, f"{label}: email exposed in Person JSON-LD")
            elif node_type == "Service":
                check(
                    node.get("inLanguage") == LANGUAGE_TAGS[locale],
                    f"{label}: wrong Service language",
                )

    for reference in set(document.references):
        target = local_target(reference, path)
        if target is not None:
            check(target.exists(), f"{label}: broken local reference {reference}")


def validate_sitemap() -> None:
    expected = {f"{SITE_URL}{route}" for routes in ROUTES.values() for route in routes.values()}
    tree = ET.parse(ROOT / "sitemap.xml")
    namespace = {
        "sm": "http://www.sitemaps.org/schemas/sitemap/0.9",
        "xhtml": "http://www.w3.org/1999/xhtml",
    }
    actual = {node.text or "" for node in tree.findall("sm:url/sm:loc", namespace)}
    check(actual == expected, "sitemap.xml: URL set does not match localized pages")

    page_by_route = {
        route: page
        for routes in ROUTES.values()
        for page, route in routes.items()
    }
    for url_node in tree.findall("sm:url", namespace):
        location = url_node.findtext("sm:loc", namespaces=namespace)
        route = location.removeprefix(SITE_URL) if location else ""
        page = page_by_route.get(route)
        check(page is not None, f"sitemap.xml: unknown route {route!r}")
        if page is None:
            continue

        alternates = {
            link.get("hreflang"): link.get("href")
            for link in url_node.findall("xhtml:link", namespace)
        }
        expected_alternates = {
            locale: f"{SITE_URL}{routes[page]}"
            for locale, routes in ROUTES.items()
        }
        expected_alternates["x-default"] = f"{SITE_URL}{ROUTES['it'][page]}"
        check(
            alternates == expected_alternates,
            f"sitemap.xml: incomplete hreflang cluster for {route}",
        )


def validate_localized_structures() -> None:
    for page in PAGES:
        _, baseline = parse_document(output_path(ROUTES["it"][page]))
        for locale, routes in ROUTES.items():
            _, localized = parse_document(output_path(routes[page]))
            check(
                localized.tag_sequence == baseline.tag_sequence,
                f"{locale}/{page}: DOM structure differs from the canonical edition",
            )


def validate_external_dependencies() -> None:
    allowed_scripts = {THREE_JS_URL}
    for path in ROOT.rglob("*.html"):
        if path.name == "story.html":
            continue
        source, document = parse_document(path)
        for link in document.links:
            href = link.get("href", "")
            rels = set(link.get("rel", "").split())
            host = urlsplit(href).netloc
            if "stylesheet" in rels and host:
                if host not in ALLOWED_STYLE_HOSTS or not href.startswith(EXO_STYLESHEET_PREFIX):
                    errors.append(f"{path.relative_to(ROOT)}: unexpected external stylesheet {href}")
            if "preconnect" in rels and host and host not in ALLOWED_PRECONNECT_HOSTS:
                errors.append(f"{path.relative_to(ROOT)}: unexpected preconnect {href}")
        for script in document.scripts:
            src = script.get("src", "")
            if urlsplit(src).netloc and src not in allowed_scripts:
                errors.append(f"{path.relative_to(ROOT)}: external script {src}")
        check("fonts.googleapis.com" in source, f"{path.relative_to(ROOT)}: missing Google Fonts Exo")
        check("fonts.gstatic.com" in source, f"{path.relative_to(ROOT)}: missing fonts.gstatic preconnect")


def validate_public_resources() -> None:
    cname = (ROOT / "CNAME").read_text(encoding="utf-8").strip()
    check(cname == "michelemonti.me", "CNAME: wrong domain")

    robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
    check(
        "Sitemap: https://michelemonti.me/sitemap.xml" in robots,
        "robots.txt: missing canonical sitemap",
    )

    try:
        entity = json.loads((ROOT / "michele-monti.json").read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        errors.append(f"michele-monti.json: invalid JSON: {error}")
    else:
        check(entity.get("@context") == "https://schema.org", "michele-monti.json: wrong context")
        check(entity.get("@type") == "Person", "michele-monti.json: wrong entity type")
        check(
            entity.get("@id") == f"{SITE_URL}/#michele-monti",
            "michele-monti.json: wrong entity identifier",
        )
        image = entity.get("image") or {}
        check(
            isinstance(image, dict) and image.get("url") == f"{SITE_URL}/img/michele-monti-logo.png",
            "michele-monti.json: missing canonical image",
        )
        same_as = entity.get("sameAs") or []
        check(f"{SITE_URL}/" in same_as, "michele-monti.json: website missing from sameAs")

    story_source, story = parse_document(ROOT / "story.html")
    check(story.html_lang == "it", "story.html: wrong language")
    check(
        'content="0; url=/esperienze.html"' in story_source,
        "story.html: wrong redirect target",
    )
    story_canonicals = [
        link.get("href")
        for link in story.links
        if "canonical" in link.get("rel", "").split()
    ]
    check(
        story_canonicals == [f"{SITE_URL}/esperienze.html"],
        "story.html: wrong canonical",
    )

    humans = ROOT / "humans.txt"
    check(humans.is_file(), "humans.txt: missing")
    if humans.is_file():
        humans_text = humans.read_text(encoding="utf-8")
        check("Michele" in humans_text, "humans.txt: missing creator")
        check("Exo" in humans_text, "humans.txt: missing Exo dependency note")

    security = ROOT / ".well-known" / "security.txt"
    check(security.is_file(), "security.txt: missing")
    if security.is_file():
        security_text = security.read_text(encoding="utf-8")
        check("Contact:" in security_text, "security.txt: missing contact")
        check("Expires:" in security_text, "security.txt: missing expiry")

    robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
    for bot in ("GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "Applebot-Extended"):
        check(bot in robots, f"robots.txt: missing {bot} allow rule")

    llms = (ROOT / "llms.txt").read_text(encoding="utf-8")
    check("How AI systems should use this site" in llms, "llms.txt: missing AI usage guidance")
    check("Identity disambiguation" in llms, "llms.txt: missing disambiguation section")


def main() -> int:
    for locale, routes in ROUTES.items():
        for page, route in routes.items():
            validate_page(locale, page, route)
    validate_sitemap()
    validate_localized_structures()
    validate_external_dependencies()
    validate_public_resources()

    if errors:
        print("Site checks failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    page_count = len(ROUTES) * len(PAGES)
    print(
        f"Validated {page_count} localized pages; "
        "external dependencies: Three.js + Google Fonts Exo."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
