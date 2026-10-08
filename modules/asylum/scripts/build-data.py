from pathlib import Path
import json
R=Path(__file__).resolve().parents[1]
P=R/'master-package'
questions=[json.loads(x) for x in (P/'03_question_bank/question_bank.jsonl').read_text(encoding='utf-8').splitlines() if x.strip()]
scenarios=[]
for folder in ['cases','detailed_cases']:
    for file in sorted((P/'04_synthetic_cases'/folder).glob('*.json')):
        c=json.loads(file.read_text(encoding='utf-8'))
        # Public fictional-role synopsis only. Do not deliver gold targets, engine hints,
        # discrepancies or context-derived personal facts to the interviewer.
        scenarios.append({'id':c['case_id'],'country':c['country'],'name':c['persona']['display_name'],'title':c.get('title',c.get('theme','')),'difficulty':c['difficulty'],'synopsis':c.get('story_narrative_es',c['persona'].get('background','')),'data_domain':'synthetic'})
payload={'questions':questions,'scenarios':scenarios,'version':'master-0.3'}
(R/'apps/web/package-data.js').write_text('window.AsiloData = '+json.dumps(payload,ensure_ascii=False)+';\n',encoding='utf-8')
print(f'Indexed {len(questions)} questions and {len(scenarios)} fictional scenario summaries. No gold facts exported.')
