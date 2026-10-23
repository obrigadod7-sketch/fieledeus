import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DICT from '../locales/autoTranslations.json';

const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE', 'NOSCRIPT']);
const textOrig = new WeakMap();
const attrOrig = new WeakMap();
const norm = (s) => s.replace(/\s+/g, ' ').trim();

export function translateText(s, lang) {
  if (!s || lang === 'pt') return s;
  const key = norm(s);
  const hit = DICT[key]?.[lang];
  if (!hit) return s;
  const lead = s.match(/^\s*/)[0];
  const trail = s.match(/\s*$/)[0];
  return lead + hit.trim() + trail;
}

const skipped = (el) => !el || SKIP.has(el.nodeName) || el.closest?.('[data-no-translate],[contenteditable="true"]');

function doText(node, lang) {
  if (skipped(node.parentElement)) return;
  const cur = node.nodeValue;
  const rec = textOrig.get(node);
  const orig = rec && (cur === rec.out) ? rec.orig : cur;
  const out = translateText(orig, lang);
  textOrig.set(node, { orig, out });
  if (out !== cur) node.nodeValue = out;
}

function doAttrs(el, lang) {
  if (skipped(el)) return;
  let rec = attrOrig.get(el);
  for (const a of ATTRS) {
    const cur = el.getAttribute(a);
    if (cur == null) continue;
    if (!rec) { rec = {}; attrOrig.set(el, rec); }
    const r = rec[a];
    const orig = r && cur === r.out ? r.orig : cur;
    const out = translateText(orig, lang);
    rec[a] = { orig, out };
    if (out !== cur) el.setAttribute(a, out);
  }
}

function walk(root, lang) {
  if (root.nodeType === 3) return doText(root, lang);
  if (root.nodeType !== 1) return;
  doAttrs(root, lang);
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n = tw.nextNode();
  while (n) {
    if (n.nodeType === 3) doText(n, lang); else doAttrs(n, lang);
    n = tw.nextNode();
  }
}

export default function AutoTranslate() {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'pt').slice(0, 2);

  useEffect(() => {
    document.documentElement.lang = lang;
    walk(document.body, lang);
    const obs = new MutationObserver((muts) => {
      obs.disconnect();
      for (const m of muts) {
        if (m.type === 'characterData') doText(m.target, lang);
        else if (m.type === 'attributes') doAttrs(m.target, lang);
        else m.addedNodes.forEach((n) => walk(n, lang));
      }
      obs.observe(document.body, opts);
    });
    const opts = { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS };
    obs.observe(document.body, opts);
    const { alert, confirm, prompt } = window;
    window.alert = (m) => alert(translateText(String(m ?? ''), lang));
    window.confirm = (m) => confirm(translateText(String(m ?? ''), lang));
    window.prompt = (m, d) => prompt(translateText(String(m ?? ''), lang), d);
    return () => { obs.disconnect(); Object.assign(window, { alert, confirm, prompt }); };
  }, [lang]);

  return null;
}
