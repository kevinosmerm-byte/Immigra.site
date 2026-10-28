import re, json, hashlib, sys
from pathlib import Path
from pypdf import PdfReader

root = Path(__file__).resolve().parents[1]
pdf = root / 'public/study-guides/uscis-2025-civics-test-study-guide.pdf'
old = json.loads((root/'src/data/uscis2025Civics.json').read_text(encoding='utf-8'))
records = []
current = None
for page_number, page in enumerate(PdfReader(pdf).pages, 1):
    if page_number == 1:
        continue
    for line in page.extract_text().splitlines():
        line = line.strip()
        if not line or re.match(r'^\d+ of 19$', line) or line == 'uscis.gov/citizenship' or re.match(r'^[ABC]: ', line) or line in ['AMERICAN GOVERNMENT', 'AMERICAN HISTORY', 'SYMBOLS AND HOLIDAYS']:
            continue
        match = re.match(r'^(\d+)\.\s+(.+)', line)
        if match:
            current = {'id': int(match[1]), 'question': match[2].replace('*', '').strip(), 'answers': [], 'special6520': '*' in line, 'page': page_number, 'notes': []}
            records.append(current)
        elif line == '*':
            current['special6520'] = True
        elif line.startswith('•'):
            current['answers'].append(line[1:].strip())
        elif line.startswith('For a complete list'):
            current['notes'].append(line)
        elif current['answers']:
            current['answers'][-1] += ' ' + line
        else:
            current['question'] += ' ' + line
assert [q['id'] for q in records] == list(range(1,129))
for q in records:
    q['answers'] = [re.sub(r'(\d)\s+(th|st|nd|rd)\b', r'\1\2', a) for a in q['answers']]
    assert q['answers'], q
    q['spanish'] = old['questions'][q['id']-1]['spanish']
    words = {'two':2, 'three':3, 'five':5}
    count = re.search(r'\b(?:Name|What are) (two|three|five)\b',q['question'],re.I)
    q['minimumAnswersRequired'] = words[count[1].lower()] if count else 1
data = {'source': {'title':'128 Civics Questions and Answers (2025 version)', 'edition':'M-1778 (09/25)', 'path':'/study-guides/uscis-2025-civics-test-study-guide.pdf', 'sha256':hashlib.sha256(pdf.read_bytes()).hexdigest(), 'spanishTranslation':'Supplemental app translation; English questions and answers are the official source.'}, 'questions':records}
if '--check' in sys.argv:
    assert data == old, 'Official bank differs from the bundled PDF'
else:
    (root/'src/data/uscis2025Civics.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Verified 128 questions and',sum(len(q['answers']) for q in records),'official answer bullets')

