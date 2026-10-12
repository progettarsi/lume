from pathlib import Path
import subprocess,sys,re
adb=Path(__file__).resolve().parents[3]/'.mobile-tools/android-sdk/platform-tools/adb.exe'
root=Path(__file__).resolve().parents[2]/'releases/qa/onboarding-integration-0.1.13'
name=sys.argv[1]
if not re.fullmatch(r'[a-z0-9-]+',name):raise ValueError('Evidence name')
root.joinpath(name+'.png').write_bytes(subprocess.check_output([str(adb),'-s','R5CW81QWV1F','exec-out','screencap','-p']))
