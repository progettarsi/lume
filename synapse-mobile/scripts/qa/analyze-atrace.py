"""Inclusive native slices and scheduled CPU intervals, never React render counts."""
import re, sys, json
from pathlib import Path
from collections import defaultdict

source=Path(sys.argv[1]); pid=int(sys.argv[2]); out=Path(sys.argv[3])
encoding='utf-16' if b'\x00' in source.read_bytes()[:100] else 'utf-8-sig'
stacks=defaultdict(list); slices=defaultdict(list); running={}; cpu=defaultdict(list); names={}
line_re=re.compile(r'^\s*(.+)-(\d+)\s+\(\s*(\d+)\)\s+\[\d+\].*?\s(\d+\.\d+): (\w+): (.*)$')
switch_re=re.compile(r'prev_comm=(.*?) prev_pid=(\d+).*?next_comm=(.*?) next_pid=(\d+)')
first=last=None; incomplete=0
with source.open(encoding=encoding,errors='replace') as stream:
 for line in stream:
  m=line_re.match(line)
  if not m: continue
  name,tid,owner,time,event,data=m.groups(); tid=int(tid); owner=int(owner); time=float(time)
  first=time if first is None else first; last=time
  if owner==pid: names[tid]=name.strip()
  if event=='sched_switch':
   sw=switch_re.search(data)
   if sw:
    old_name,old,new_name,new=sw.groups(); old=int(old); new=int(new)
    if old in running: cpu[old].append((time-running.pop(old))*1000)
    running[new]=time
  if owner!=pid or event!='tracing_mark_write': continue
  if data.startswith('B|'):
   bits=data.split('|',2)
   if len(bits)==3 and bits[1]==str(pid): stacks[tid].append((time,bits[2]))
  elif data.startswith('E'):
   if stacks[tid]:
    start,label=stacks[tid].pop(); slices[(tid,label)].append((time-start)*1000)
   else: incomplete+=1

def stats(values):
 values=sorted(values)
 return {'count':len(values),'totalMs':round(sum(values),3),'p50Ms':round(values[(len(values)-1)//2],3),'p95Ms':round(values[int((len(values)-1)*.95)],3),'maxMs':round(values[-1],3),'over8_33Ms':sum(v>8.33 for v in values)} if values else {}
threads=[{'tid':tid,'name':name,'scheduledRunning':stats(cpu[tid]),'slices':sorted([{'name':label,**stats(values)} for (thread,label),values in slices.items() if thread==tid],key=lambda x:x['totalMs'],reverse=True)[:25]} for tid,name in names.items()]
result={'trace':source.name,'pid':pid,'spanSeconds':round(last-first,3) if first else 0,'unmatchedEnds':incomplete,'openSlices':sum(map(len,stacks.values())),'threads':threads,'limitations':'Native slices are inclusive, overlap, and include waits; totals are not additive CPU costs. Scheduled running intervals exclude boundary intervals and do not identify JS functions. ReactText/Fabric mount/layout slices are not React render or commit counts. Trace overhead differs from untraced gfxinfo samples.'}
out.write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({'trace':source.name,'spanSeconds':result['spanSeconds'],'threads':[{'tid':r['tid'],'name':r['name'],'cpu':r['scheduledRunning'],'topSlices':r['slices'][:5]} for r in threads if r['name'] in ('mqt_v_js','RenderThread','.synapse.reader')],'limitations':result['limitations']},indent=2))
