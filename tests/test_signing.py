import os
import subprocess
import sys
import tempfile
import pathlib
import unittest

SCRIPT = pathlib.Path(__file__).resolve().parents[1] / 'scripts' / 'configure-release-signing.py'
TEMPLATE = """
android {
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            // production must NOT use a debug key
            signingConfig signingConfigs.debug
            minifyEnabled false
        }
    }
}
"""

class SigningTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        base = pathlib.Path(self.tmp.name)
        folder = base / 'android' / 'app'
        folder.mkdir(parents=True)
        self.gradle = folder / 'build.gradle'
        self.gradle.write_text(TEMPLATE)
        self.keystore = base / 'release.jks'
        self.keystore.write_bytes(b'fixture')
        self.env = dict(os.environ)

    def test_absent_signing_key_blocks_release(self):
        for name in ('ASCEND_KEYSTORE_PATH','ASCEND_KEYSTORE_PASSWORD','ASCEND_KEY_ALIAS','ASCEND_KEY_PASSWORD'):
            self.env.pop(name, None)
        p = subprocess.run([sys.executable, str(SCRIPT)],cwd=self.tmp.name,env=self.env,capture_output=True,text=True)
        self.assertNotEqual(p.returncode,0)
        self.assertEqual(self.gradle.read_text(),TEMPLATE)

    def test_release_replaces_debug_signature_only(self):
        self.env.update({'ASCEND_KEYSTORE_PATH':str(self.keystore),'ASCEND_KEYSTORE_PASSWORD':'secret','ASCEND_KEY_ALIAS':'release','ASCEND_KEY_PASSWORD':'secret'})
        p = subprocess.run([sys.executable, str(SCRIPT)],cwd=self.tmp.name,env=self.env,capture_output=True,text=True)
        self.assertEqual(p.returncode,0,p.stdout+p.stderr)
        output=self.gradle.read_text()
        self.assertIn('signingConfig signingConfigs.release',output)
        self.assertIn('signingConfig signingConfigs.debug',output)
        self.assertIn("System.getenv('ASCEND_KEYSTORE_PATH')",output)

if __name__ == '__main__':
    unittest.main()
