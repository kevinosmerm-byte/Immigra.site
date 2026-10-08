from pathlib import Path
import json,random
R=Path(__file__).resolve().parents[1]
Q=[json.loads(x) for x in (R/'03_question_bank/question_bank.jsonl').read_text(encoding='utf-8').splitlines()]
def choose(topic,lang='es'):
 p=[q for q in Q if q['category']==topic and q['question_type']!='controlled_variant']; q=random.choice(p); return q['question_es' if lang=='es' else 'question_en']
if __name__=='__main__':
 for t in ['ASYLUM_REASON','INCIDENT_DETAIL','FUTURE_FEAR']: print(t,'→',choose(t))
