from pathlib import Path
import json, sys
R=Path(__file__).resolve().parents[1]
errs=[]
cases=[]
for p in sorted((R/'04_synthetic_cases/detailed_cases').glob('*.json')):
    c=json.loads(p.read_text(encoding='utf-8')); cases.append(c)
    if not c.get('fictional'): errs.append(f'{p.name}: fictional flag false')
    if c.get('data_domain')!='synthetic': errs.append(f'{p.name}: wrong domain')
    if not c.get('country_context',{}).get('source_refs'): errs.append(f'{p.name}: no context sources')
    if not c.get('safety',{}).get('no_merge_with_personal_case'): errs.append(f'{p.name}: missing no-merge')
    if len(c.get('events',[]))<5: errs.append(f'{p.name}: too few events')
print('Detailed cases:',len(cases))
print('Countries:',sorted(set(c['country'] for c in cases)))
print('Errors:',len(errs))
for e in errs: print('ERROR',e)
sys.exit(1 if errs else 0)
