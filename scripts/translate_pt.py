import json, os, time, requests
from concurrent.futures import ThreadPoolExecutor

SRC = json.load(open('/app/scripts/pt_strings.json'))
OUT = '/app/frontend/src/locales/autoTranslations.json'
os.makedirs(os.path.dirname(OUT), exist_ok=True)
done = json.load(open(OUT)) if os.path.exists(OUT) else {}
todo = [s for s in SRC if s not in done]


def tr(text, lang):
    for _ in range(4):
        try:
            r = requests.get('https://translate.googleapis.com/translate_a/single',
                             params={'client': 'gtx', 'sl': 'pt', 'tl': lang, 'dt': 't', 'q': text}, timeout=20)
            r.raise_for_status()
            return ''.join(seg[0] for seg in r.json()[0] if seg[0])
        except Exception:
            time.sleep(2)
    return None


def job(s):
    lead = s[:len(s) - len(s.lstrip())]
    trail = s[len(s.rstrip()):]
    res = {l: tr(s.strip(), l) for l in ('en', 'es', 'fr')}
    if all(res.values()):
        return s, {l: lead + v + trail for l, v in res.items()}
    return s, None


with ThreadPoolExecutor(8) as ex:
    for s, v in ex.map(job, todo):
        if v:
            done[s] = v
json.dump(done, open(OUT, 'w'), ensure_ascii=False, indent=0, sort_keys=True)
print(len(done), 'of', len(SRC))
