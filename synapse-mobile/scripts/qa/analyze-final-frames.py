"""Recent native frames; exclude idle gaps instead of deriving FPS from session length."""
import csv, json, sys
from pathlib import Path
def summary(values):
    values=sorted(values)
    return {f'p{p}':round(values[min(len(values)-1,int((len(values)-1)*p/100))],3) for p in (50,95,99)} if values else {}
results={}
for name in sys.argv[1:]:
    text=Path(name).read_text(encoding='utf-8-sig')
    if '\x00' in text: text=Path(name).read_text(encoding='utf-16')
    block=text.split('---PROFILEDATA---')[1]
    rows=[{k:int(v) for k,v in r.items() if k and v} for r in csv.DictReader(block.strip().splitlines())]
    rows=[r for r in rows if r['Flags']==0 and r['FrameCompleted']>r['IntendedVsync']]
    present=sorted(set(r['DisplayPresentTime'] for r in rows if 0<r['DisplayPresentTime']<2**63-1))
    gaps=[(b-a)/1e6 for a,b in zip(present,present[1:])]
    active=[g for g in gaps if g<=40]
    def phase(end,start):return summary([(r[end]-r[start])/1e6 for r in rows if r[end]>=r[start]])
    results[Path(name).name]={'recentFrames':len(rows),'presentTimestamps':len(present),'activeIntervals':len(active),'idleOrLongGapsExcluded':len(gaps)-len(active),'presentIntervalMs':summary(active),'intervalsOver12ms':sum(g>12 for g in active),'intervalsOver20ms':sum(g>20 for g in active),'nominalFrameIntervalMs':summary([r['FrameInterval']/1e6 for r in rows]),'frameTotalMs':phase('FrameCompleted','IntendedVsync'),'uiUntilTraversalMs':phase('PerformTraversalsStart','HandleInputStart'),'traversalUntilDrawMs':phase('DrawStart','PerformTraversalsStart'),'drawUntilSyncMs':phase('SyncQueued','DrawStart'),'renderSubmitMs':phase('SwapBuffers','IssueDrawCommandsStart'),'gpuTailMs':phase('GpuCompleted','SwapBuffers'),'limitations':'Circular recent buffer, not entire interaction. Gaps >40ms may be idle or stalls; excluded and counted, never certified as idle. Phase timings do not isolate React/JS CPU. Presentation intervals include compositor scheduling.'}
output=Path(sys.argv[1]).parent/'frame-analysis.json'
output.write_text(json.dumps(results,indent=2),encoding='utf-8')
print(json.dumps(results,indent=2))
