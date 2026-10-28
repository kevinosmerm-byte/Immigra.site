from pathlib import Path
import json,sqlite3,sys
R=Path(__file__).resolve().parents[1]; errors=[]
qs=[json.loads(x) for x in (R/'03_question_bank/question_bank.jsonl').read_text(encoding='utf-8').splitlines()]
if len({q['id'] for q in qs})!=len(qs): errors.append('duplicate question ids')
cases=[json.loads(p.read_text(encoding='utf-8')) for p in sorted((R/'04_synthetic_cases/cases').glob('*.json'))]
if any(not c.get('fictional') for c in cases): errors.append('fictional flag missing')
if any(c.get('data_domain')!='synthetic' for c in cases): errors.append('wrong synthetic data_domain')
if any('Do not merge this case with a personal case.' not in c.get('forbidden_behavior',[]) for c in cases): errors.append('no-merge rule missing')
conn=sqlite3.connect(':memory:'); conn.executescript((R/'02_database/asiloai_schema.sql').read_text(encoding='utf-8'))
print('Questions:',len(qs)); print('Synthetic cases:',len(cases)); print('Validation errors:',len(errors))
for e in errors: print('ERROR:',e)
sys.exit(1 if errors else 0)
