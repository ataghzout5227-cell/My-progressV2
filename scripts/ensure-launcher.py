#!/usr/bin/env python3
"""Validate Expo icon aliases without creating a competing permanent launcher."""
from pathlib import Path
from xml.etree import ElementTree as ET
ET.register_namespace("android", "http://schemas.android.com/apk/res/android")
path = Path("android/app/src/main/AndroidManifest.xml")
tree = ET.parse(path)
root = tree.getroot()
ns = "{http://schemas.android.com/apk/res/android}"
app = root.find("application")
if app is None:
    raise SystemExit("Missing Android application")
activity = next((item for item in app.findall("activity") if item.get(ns+"name", "").endswith("MainActivity")), None)
if activity is None:
    raise SystemExit("Missing MainActivity")
activity.set(ns+"enabled", "true")
activity.set(ns+"exported", "true")
def is_launcher(f):
    return (any(x.get(ns+"name") == "android.intent.action.MAIN" for x in f.findall("action"))
        and any(x.get(ns+"name") == "android.intent.category.LAUNCHER" for x in f.findall("category")))
# MainActivity must not compete with the activity-alias selected by the icon library.
for f in list(activity.findall("intent-filter")):
    if is_launcher(f):
        activity.remove(f)
aliases = [a for a in app.findall("activity-alias") if ".AwesomeAppIcon." in a.get(ns+"name", "")]
if len(aliases) < 2:
    raise SystemExit("Dynamic icon aliases were not generated")
default = next((a for a in aliases if a.get(ns+"name", "").endswith(".Default")), None)
if default is None:
    raise SystemExit("Default icon alias missing")
default.set(ns+"enabled", "true")
for alias in aliases:
    alias.set(ns+"exported", "true")
    if not any(is_launcher(f) for f in alias.findall("intent-filter")):
        raise SystemExit("Missing launcher intent on alias: " + alias.get(ns+"name", ""))
    if alias is not default:
        alias.set(ns+"enabled", "false")
tree.write(path, encoding="utf-8", xml_declaration=True)
print("Verified default and alternate Android launcher aliases; no competing MainActivity shortcut")
