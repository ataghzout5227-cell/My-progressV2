#!/usr/bin/env python3
"""Fail closed on Android release signing: never ship the runner's debug key."""
import os,re,sys,pathlib
file=pathlib.Path('android/app/build.gradle')
source=file.read_text()
required=['ASCEND_KEYSTORE_PATH','ASCEND_KEYSTORE_PASSWORD','ASCEND_KEY_ALIAS','ASCEND_KEY_PASSWORD']
missing=[x for x in required if not os.environ.get(x)]
if missing:sys.exit('Signing secrets missing: '+', '.join(missing))
if not pathlib.Path(os.environ['ASCEND_KEYSTORE_PATH']).is_file():
    sys.exit('Provided release keystore does not exist.')
if "signingConfig signingConfigs.release" in source:
    print('Release signing already configured');sys.exit(0)
# Expo-generated Gradle has a buildTypes/release block with debug signing.
anchor="    buildTypes {"
if source.count(anchor)!=1:sys.exit('Unexpected Gradle template: buildTypes not unique.')
signing="""
    signingConfigs {
        release {
            storeFile file(System.getenv('ASCEND_KEYSTORE_PATH'))
            storePassword System.getenv('ASCEND_KEYSTORE_PASSWORD')
            keyAlias System.getenv('ASCEND_KEY_ALIAS')
            keyPassword System.getenv('ASCEND_KEY_PASSWORD')
        }
    }
"""
source=source.replace(anchor,signing+anchor,1)
block=re.search(r"(release\s*\{)([\s\S]*?)(?=\n\s*\}\s*\n\s*\})",source)
if not block:sys.exit('Could not find release buildType; refusing an unsigned build.')
replacement=block.group(0).replace('signingConfig signingConfigs.debug','signingConfig signingConfigs.release')
if replacement==block.group(0):sys.exit('Expected Expo debug signing clause not found. Refusing release.')
source=source[:build_types_start+block.start()]+replacement+source[build_types_start+block.end():]
file.write_text(source)
print('Configured Gradle to sign releases with a persistent external keystore.')
