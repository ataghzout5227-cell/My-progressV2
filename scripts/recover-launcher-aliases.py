#!/usr/bin/env python3
"""Recover Android launcher aliases disabled by earlier icon-switching builds.

Android persists PackageManager component states across APK upgrades. Changing
only the manifest won't re-enable a previously disabled launcher alias.
Give all launcher aliases new stable component names and update Expo's metadata
so icon switching addresses those new components.
"""
import json
from pathlib import Path
from xml.etree import ElementTree as ET

ANDROID_NS = "http://schemas.android.com/apk/res/android"
ET.register_namespace("android", ANDROID_NS)
A = "{"+ANDROID_NS+"}"
manifest_path = Path("android/app/src/main/AndroidManifest.xml")
tree = ET.parse(manifest_path)
root = tree.getroot()
application = root.find("application")
if application is None:
    raise SystemExit("No Android <application> in manifest")
activity = next((a for a in application.findall("activity")
                 if a.get(A+"name", "").endswith("MainActivity")), None)
if activity is None:
    raise SystemExit("MainActivity missing")
activity.set(A+"enabled", "true")
activity.set(A+"exported", "true")

aliases = [a for a in application.findall("activity-alias")
           if ".AwesomeAppIcon." in a.get(A+"name", "")]
if len(aliases) != 5:
    raise SystemExit(f"Expected one default and four selectable launcher aliases, got {len(aliases)}")
mapping = {}
for alias in aliases:
    old = alias.get(A+"name")
    new = old.replace(".AwesomeAppIcon.", ".AscendIconV282.")
    mapping[old] = new
    alias.set(A+"name", new)
    alias.set(A+"exported", "true")
    alias.set(A+"enabled", "true" if old.endswith(".Default") else "false")
    has_launcher = any(
        any(x.get(A+"name")=="android.intent.action.MAIN" for x in f.findall("action"))
        and any(x.get(A+"name")=="android.intent.category.LAUNCHER" for x in f.findall("category"))
        for f in alias.findall("intent-filter")
    )
    if not has_launcher:
        raise SystemExit("Missing MAIN/LAUNCHER on "+old)

# Do not add a second permanent MainActivity launcher; that causes duplicates.
for f in list(activity.findall("intent-filter")):
    actions = {a.get(A+"name") for a in f.findall("action")}
    cats = {a.get(A+"name") for a in f.findall("category")}
    if "android.intent.action.MAIN" in actions and "android.intent.category.LAUNCHER" in cats:
        activity.remove(f)

found = set()
for metadata in application.findall("meta-data"):
    key = metadata.get(A+"name")
    value = metadata.get(A+"value", "")
    if key == "expo.modules.awesomeappicon.DEFAULT_ALIAS":
        if value not in mapping:
            raise SystemExit("Unexpected default alias: "+value)
        metadata.set(A+"value", mapping[value])
        found.add("default")
    elif key == "expo.modules.awesomeappicon.ICON_ALIASES":
        obj = json.loads(value)
        if len(obj) != 4 or any(v not in mapping for v in obj.values()):
            raise SystemExit("Icon metadata does not match Android aliases")
        metadata.set(A+"value", json.dumps({k: mapping[v] for k,v in obj.items()}, separators=(",",":")))
        found.add("alternates")
if found != {"default","alternates"}:
    raise SystemExit("Missing expo-awesome-app-icon alias metadata")

tree.write(manifest_path, encoding="utf-8", xml_declaration=True)
print("Recovered five independent launcher aliases and rewired native icon metadata")
