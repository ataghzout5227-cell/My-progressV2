#!/usr/bin/env python3
"""Ensure Ascend retains a reliable Android launcher entry point."""
from pathlib import Path
from xml.etree import ElementTree as ET
import io

path = Path("android/app/src/main/AndroidManifest.xml")
xml = path.read_text()
for event, (prefix, uri) in ET.iterparse(io.StringIO(xml), events=["start-ns"]):
    ET.register_namespace(prefix, uri)
tree = ET.parse(path)
root = tree.getroot()
ns = "{http://schemas.android.com/apk/res/android}"
app = root.find("application")
if app is None:
    raise SystemExit("No Android application in manifest")
activity = next((item for item in app.findall("activity") if item.get(ns+"name", "").endswith("MainActivity")), None)
if activity is None:
    raise SystemExit("No MainActivity found")
activity.set(ns+"enabled", "true")
activity.set(ns+"exported", "true")
def launcher_filter(node):
    for f in node.findall("intent-filter"):
        acts = {a.get(ns+"name") for a in f.findall("action")}
        cats = {a.get(ns+"name") for a in f.findall("category")}
        if "android.intent.action.MAIN" in acts and "android.intent.category.LAUNCHER" in cats:
            return True
    return False
if not launcher_filter(activity):
    f = ET.SubElement(activity, "intent-filter")
    ET.SubElement(f, "action", {ns+"name": "android.intent.action.MAIN"})
    ET.SubElement(f, "category", {ns+"name": "android.intent.category.LAUNCHER"})
tree.write(path, encoding="utf-8", xml_declaration=True)
print("MainActivity is enabled, exported and has a launcher intent filter")
