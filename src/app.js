(() => {
  'use strict';
  const DOMAINS = window.DBT_DOMAINS;
  const Q = window.DBT_Q;
  const DOM = Object.fromEntries(DOMAINS.map(d => [d.id, d]));
  const byId = Object.fromEntries(Q.map(q => [q.id, q]));
  const LETTERS = 'ABCDEFGH';
  const KEY = { sim: 'dbt-ae-simulado-v1', fast: 'dbt-ae-fast-v1', hist: 'dbt-ae-hist-v1', prefs: 'dbt-ae-simulado-prefs', fastSeen: 'dbt-ae-fastseen-v1',
                simLog: 'dbt-ae-simlog-v1', simDel: 'dbt-ae-simdel-v1' };
  const EXAM_MIN = 120, EXAM_LEN = 65, PASS_PCT = 65;
  const SIM_QUOTA = { d1: 26, d2: 7, d3: 9, d4: 5, d5: 10, d6: 4, d7: 4 };
  const INSTANT = { mc: true, hotspot: true };
  const reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  const TYPE_INFO = {
    mc:      { label: () => 'Multiple choice', pt: 'Uma alternativa correta.', hint: () => 'Selecione uma alternativa.' },
    multi:   { label: q => `Multiple choice · choose ${q.choose}`, pt: 'Escolha N alternativas corretas.', hint: q => `Selecione exatamente ${q.choose} alternativas.` },
    domc:    { label: () => 'DOMC', pt: 'Alternativas exibidas uma a uma; você responde Sim ou Não para cada.', hint: () => 'As alternativas aparecem uma de cada vez. A questão termina quando você responde Sim ou quando rejeita a alternativa correta.' },
    match:   { label: () => 'Matching', pt: 'Associar itens de duas colunas.', hint: () => 'Associe cada item a uma opção.' },
    order:   { label: () => 'Build list', pt: 'Colocar etapas na ordem certa.', hint: () => 'Toque nos itens na ordem correta. Toque num item da sua lista para devolvê-lo.' },
    fill:    { label: () => 'Fill in the blank', pt: 'Digitar o termo que falta.', hint: () => 'Digite o termo exato que preenche a lacuna.' },
    hotspot: { label: () => 'Hotspot', pt: 'Clicar no ponto exato do código.', hint: () => 'Clique na linha do código.' }
  };

  let S = null;      // simulado session
  let F = null;      // fast study session
  let H = {};        // per-question history: { id: { n, c, last, t } }
  let FS = {};       // times each question was shown in fast study (answered or skipped)
  let view = 'start';
  let confirmFinish = false, confirmDiscard = false, confirmReset = false;
  let openTopics = false, openFormats = false;   // breakdown panels on the start screen
  let prefs = { mode: 'study', order: 'mixed', fastDomain: 'all' };
  let RV = null;     // past simulado opened from the history (read-only)
  let SL = [];       // finished simulados, newest first; mirrored to the account's db when the page can reach it
  let DEL = [];      // ids of simulados deleted from the history (so other devices drop them too)
  let DB = null, syncState = 'off';   // off | syncing | on | local | error
  const PUB = !!window.DBT_PUBLIC;    // public build: browser storage only, no personal checkpoint
  let resFilter = 'all', confirmDel = null, confirmP2 = false;

  /* ── storage ── */
  function load(key) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
  function store(key, val) { try { if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
  const saveSim = () => store(KEY.sim, S);
  const saveFast = () => store(KEY.fast, F);
  const saveHist = () => store(KEY.hist, H);
  const savePrefs = () => store(KEY.prefs, prefs);
  const saveFS = () => store(KEY.fastSeen, FS);
  const saveSL = () => store(KEY.simLog, SL);
  const saveDEL = () => store(KEY.simDel, DEL);

  /* ── helpers ── */
  const $ = sel => document.querySelector(sel);
  // replaceChildren() turns null and arrays into text ("null", "[object HTMLElement]"), so flatten and drop empties first
  function setChildren(el, ...kids) { el.replaceChildren(...kids.flat(Infinity).filter(c => c != null && c !== false)); }
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : String(v));
    }
    for (const c of children.flat(Infinity)) {
      if (c == null || c === false) continue;
      el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return el;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function md(s) { return esc(s).replace(/~([^~]+)~/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*\s][^*]*)\*/g, '<em>$1</em>'); }
  function plain(s) { return String(s).replace(/~/g, '').replace(/\*\*/g, ''); }
  function dedent(t) {
    const lines = String(t).replace(/^\n/, '').replace(/\s+$/, '').split('\n');
    const ind = Math.min(...lines.filter(l => l.trim()).map(l => l.match(/^ */)[0].length));
    return lines.map(l => l.slice(Number.isFinite(ind) ? ind : 0)).join('\n');
  }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function range(n) { return Array.from({ length: n }, (_, i) => i); }
  function shuffledNotIdentity(n) { if (n < 2) return range(n); let p; do { p = shuffle(range(n)); } while (p.every((v, i) => v === i)); return p; }
  function fmtTime(ms) { ms = Math.max(0, ms); const s = Math.floor(ms / 1000); const hh = Math.floor(s / 3600), mm = Math.floor(s % 3600 / 60), ss = s % 60; return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`; }
  function scrollTop() { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); }
  function activeKey() { const a = document.activeElement; return a && a.dataset ? a.dataset.fk : null; }
  function restoreFocus(root, key) { if (!key) return; const el = root.querySelector(`[data-fk="${key}"]`); if (el && !el.disabled) el.focus({ preventScroll: true }); }
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
  function fmtDate(t) {
    if (!t) return 'data desconhecida';
    const d = new Date(t), p = n => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  function excerpt(s, n) {
    const t = plain(s).replace(/\s+/g, ' ').trim();
    if (t.length <= n) return t;
    const cut = t.slice(0, n);
    return cut.slice(0, Math.max(cut.lastIndexOf(' '), n - 20)) + '…';
  }

  /* ── syntax colouring for code blocks ── */
  const RX = {
    sql: /(\{\{.*?\}\}|\{%.*?%\})|(--.*$)|('[^']*')/g,
    yaml: /(\{\{.*?\}\}|\{%.*?%\})|(#.*$)|('[^']*'|"[^"]*")/g,
    bash: /(\{\{.*?\}\})|(#.*$)|('[^']*'|"[^"]*")/g
  };
  function hlTokens(s, lang) {
    const re = new RegExp(RX[lang].source, 'g');
    let out = '', last = 0, m;
    while ((m = re.exec(s))) {
      if (m[0] === '') { re.lastIndex++; continue; }
      out += esc(s.slice(last, m.index));
      const cls = m[1] ? 't-jinja' : m[2] ? 't-com' : 't-str';
      out += `<span class="${cls}">${esc(m[0])}</span>`;
      last = re.lastIndex;
    }
    return out + esc(s.slice(last));
  }
  function hl(line, lang) {
    if (lang === 'log') {
      return esc(line)
        .replace(/\[(PASS|OK)([^\]]*)\]/g, '<span class="t-pass">[$1$2]</span>')
        .replace(/\[(FAIL|ERROR)([^\]]*)\]/g, '<span class="t-fail">[$1$2]</span>')
        .replace(/\[(WARN)([^\]]*)\]/g, '<span class="t-warn">[$1$2]</span>')
        .replace(/\[(SKIP|RUN)\]/g, '<span class="t-muted">[$1]</span>');
    }
    if (!RX[lang]) return esc(line);
    if (lang === 'yaml') {
      const m = line.match(/^(\s*(?:-\s+)?)([A-Za-z_+][\w.+-]*)(:)(.*)$/);
      if (m) return esc(m[1]) + `<span class="t-key">${esc(m[2])}</span>:` + hlTokens(m[4], lang);
    }
    return hlTokens(line, lang);
  }
  function codeBlock(c, hot) {
    const lines = dedent(c.text).split('\n');
    const nums = c.lang !== 'log';
    const body = h('div', { class: 'code-body' });
    lines.forEach((ln, i) => {
      const inner = (nums ? `<span class="ln">${i + 1}</span>` : '') + `<span class="lc">${hl(ln, c.lang) || ' '}</span>`;
      if (hot) {
        let st = '';
        if (hot.fb) { if (i === hot.answer) st = ' is-correct'; else if (i === hot.sel) st = ' is-wrong'; }
        else if (i === hot.sel) st = ' is-sel';
        body.append(h('button', { type: 'button', class: 'cl hl-btn' + st, disabled: hot.locked, 'aria-pressed': String(i === hot.sel), 'data-fk': `l${i}`, onclick: () => hot.pick(i), html: inner }));
      } else {
        body.append(h('div', { class: 'cl', html: inner }));
      }
    });
    return h('figure', { class: 'code' }, c.label ? h('figcaption', {}, c.label) : null, body);
  }

  /* ── grading ── */
  function norm(s) { return String(s || '').toLowerCase().trim().replace(/[`'"~]/g, '').replace(/[\s-]+/g, '_'); }
  function isComplete(q, r) {
    if (r == null) return false;
    switch (q.type) {
      case 'mc': case 'hotspot': return typeof r === 'number';
      case 'multi': return Array.isArray(r) && r.length === q.choose;
      case 'domc': return !!r.done;
      case 'match': return Array.isArray(r) && r.length === q.left.length && r.every(v => v != null);
      case 'order': return Array.isArray(r) && r.length === q.items.length;
      case 'fill': return String(r).trim().length > 0;
    }
    return false;
  }
  function grade(q, r) {
    if (!isComplete(q, r)) return false;
    switch (q.type) {
      case 'mc': case 'hotspot': return r === q.answer;
      case 'multi': { const a = r.slice().sort(), b = q.answers.slice().sort(); return a.length === b.length && a.every((v, i) => v === b[i]); }
      case 'domc': return r.correct === true;
      case 'match': return q.answer.every((v, i) => r[i] === v);
      case 'order': return r.every((v, i) => v === i);
      case 'fill': return q.accept.some(a => norm(a) === norm(r));
    }
    return false;
  }
  function domcStep(q, perm, prev, yes) {
    prev = prev || { said: [] };
    if (prev.done) return prev;
    const r = { said: prev.said.concat(yes) };
    const oi = perm[r.said.length - 1];
    if (yes) { r.done = true; r.correct = oi === q.answer; }
    else if (oi === q.answer) { r.done = true; r.correct = false; }
    else if (r.said.length >= perm.length) { r.done = true; r.correct = false; }
    return r;
  }
  function makePerm(q) {
    if (q.type === 'mc' || q.type === 'multi' || q.type === 'domc') return shuffle(range(q.options.length));
    if (q.type === 'match') return shuffle(range(q.right.length));
    if (q.type === 'order') return shuffledNotIdentity(q.items.length);
    return null;
  }
  // Option order saved with a session; falls back to the bank order if the question changed since
  function safePerm(q, p) {
    if (q.type === 'fill' || q.type === 'hotspot') return null;
    const n = q.type === 'match' ? q.right.length : q.type === 'order' ? q.items.length : q.options.length;
    return Array.isArray(p) && p.length === n && range(n).every(i => p.includes(i)) ? p : range(n);
  }
  // The quiz and results screens show the live simulado (S) or a past one opened from the history (RV)
  const cur = () => RV || S;
  // P correct · F wrong · S unanswered · U unknown (reconstructed simulado with no result for that question)
  function outcome(X, id) {
    if (X.recon) { const v = X.recon[id]; return v === true ? 'P' : v === false ? 'F' : 'U'; }
    const q = byId[id], r = X.resp[id];
    return !isComplete(q, r) ? 'S' : grade(q, r) ? 'P' : 'F';
  }

  /* ── history ── */
  function record(id, ok) {
    const x = H[id] || { n: 0, c: 0 };
    H[id] = { n: x.n + 1, c: x.c + (ok ? 1 : 0), last: !!ok, t: Date.now() };
    saveHist();
  }
  function histStats(ids) {
    ids = ids || Q.map(q => q.id);
    let seen = 0, lastOk = 0, pending = 0;
    ids.forEach(id => { const x = H[id]; if (!x) return; seen++; if (x.last) lastOk++; else pending++; });
    return { seen, lastOk, pending, total: ids.length, acc: seen ? pct(lastOk, seen) : null };
  }
  // Questions from a reserved set (the checkpoint batch) stay out of fast study until answered somewhere
  // Questions of a fixed exam (Prova 2) also stay out of fast study and of the random draw until answered in that exam
  const reserved = q => (PUB ? !!q.exam : (!!q.set || !!q.exam)) && !H[q.id];
  const P2 = Q.filter(q => q.exam === 'p2').map(q => q.id);

  /* ── answer renderers; ctx = { id, q, r, perm, locked, fb, set, input, submit, domc } ── */
  function optContent(q, oi) {
    if (q.codeOptions) return h('pre', { class: 'opt-code', html: dedent(q.options[oi]).split('\n').map(l => hl(l, 'yaml')).join('\n') });
    return h('span', { html: md(q.options[oi]) });
  }
  function toggleMulti(ctx, oi) {
    const cur = Array.isArray(ctx.r) ? ctx.r.slice() : [];
    const k = cur.indexOf(oi);
    if (k >= 0) cur.splice(k, 1); else { if (cur.length >= ctx.q.choose) cur.shift(); cur.push(oi); }
    ctx.set(cur);
  }
  function ansChoice(ctx) {
    const { q, r, perm, locked, fb } = ctx;
    const multi = q.type === 'multi';
    const chosen = oi => multi ? Array.isArray(r) && r.includes(oi) : r === oi;
    const right = oi => multi ? q.answers.includes(oi) : oi === q.answer;
    const box = h('div', { class: 'opts', role: multi ? 'group' : 'radiogroup', 'aria-label': 'Alternativas' });
    perm.forEach((oi, pos) => {
      const sel = chosen(oi);
      let st = sel ? ' is-sel' : '';
      if (fb) st = right(oi) ? ' is-correct' : (sel ? ' is-wrong' : '');
      box.append(h('button', { type: 'button', class: 'opt' + st, role: multi ? 'checkbox' : 'radio', 'aria-checked': String(sel), disabled: locked, 'data-fk': `o${oi}`,
          onclick: () => multi ? toggleMulti(ctx, oi) : ctx.set(oi) },
        h('span', { class: 'opt-key' + (multi ? ' box' : '') }, LETTERS[pos]),
        h('span', { class: 'opt-body' }, optContent(q, oi)),
        fb && (right(oi) || sel) ? h('span', { class: 'opt-mark', 'aria-label': right(oi) ? 'correta' : 'incorreta' }, right(oi) ? '✓' : '✗') : h('span')));
    });
    return box;
  }
  function ansDOMC(ctx) {
    const { q, r, perm, fb, locked } = ctx;
    const said = (r && r.said) || [];
    if ((!r || !r.done) && !locked) {   // a finished simulado shows the full list even if the question was left open
      const pos = said.length, oi = perm[pos];
      return h('div', { class: 'domc' },
        h('div', { class: 'domc-meta' }, `Alternativa ${pos + 1}`),
        h('div', { class: 'domc-card', html: md(q.options[oi]) }),
        h('div', { class: 'domc-q' }, 'Esta alternativa responde corretamente à questão?'),
        h('div', { class: 'domc-actions' },
          h('button', { type: 'button', class: 'btn btn-primary', 'data-fk': 'yes', onclick: () => ctx.domc(true) }, 'Sim'),
          h('button', { type: 'button', class: 'btn', 'data-fk': 'no', onclick: () => ctx.domc(false) }, 'Não')),
        said.length ? h('p', { class: 'domc-prev' }, `${said.length} ${said.length === 1 ? 'alternativa rejeitada' : 'alternativas rejeitadas'} até aqui.`) : null);
    }
    const list = h('ol', { class: 'domc-list' });
    perm.forEach((oi, pos) => {
      const shown = pos < said.length;
      if (!fb && !shown) return;
      let st = '';
      if (fb) { if (oi === q.answer) st = ' is-correct'; else if (shown && said[pos]) st = ' is-wrong'; }
      list.append(h('li', { class: 'domc-item' + st },
        h('span', { html: md(q.options[oi]) }),
        h('span', { class: 'domc-verdict' }, ctx.noAnswer ? '' : shown ? (said[pos] ? 'Você: Sim' : 'Você: Não') : 'Não exibida')));
    });
    return h('div', { class: 'domc' }, list);
  }
  function ansMatch(ctx) {
    const { id, q, r, perm, locked, fb } = ctx;
    const cur = Array.isArray(r) ? r : q.left.map(() => null);
    const box = h('div', { class: 'match' });
    if (ctx.noAnswer) {
      q.left.forEach((L, i) => box.append(h('div', { class: 'mrow' }, h('div', { class: 'mleft', html: md(L) }),
        h('div', { class: 'mright' }, h('div', { class: 'mfix', html: md(q.right[q.answer[i]]) })))));
      return box;
    }
    q.left.forEach((L, i) => {
      const ok = cur[i] === q.answer[i];
      const sel = h('select', { id: `m-${id}-${i}`, 'data-fk': `m${i}`, disabled: locked, 'aria-label': `Opção para: ${plain(L)}`,
        onchange: e => { const nr = cur.slice(); nr[i] = e.target.value === '' ? null : Number(e.target.value); ctx.set(nr); } },
        h('option', { value: '' }, 'Selecione…'),
        perm.map(ri => h('option', { value: String(ri), selected: cur[i] === ri }, plain(q.right[ri]))));
      box.append(h('div', { class: 'mrow' + (fb ? (ok ? ' is-correct' : ' is-wrong') : '') },
        h('div', { class: 'mleft', html: md(L) }),
        h('div', { class: 'mright' }, sel, fb && !ok ? h('div', { class: 'mfix', html: 'Correto: ' + md(q.right[q.answer[i]]) }) : null)));
    });
    return box;
  }
  function correctOrder(q) {
    return h('div', { class: 'ord-col ord-correct' }, h('div', { class: 'ord-h' }, 'Ordem correta'),
      h('ol', { class: 'ord-list' }, q.items.map((t, k) => h('li', {}, h('div', { class: 'ord-item is-correct' }, h('span', { class: 'ord-n' }, String(k + 1)), h('span', { html: md(t) }))))));
  }
  function ansOrder(ctx) {
    const { q, r, perm, locked, fb } = ctx;
    if (ctx.noAnswer) return h('div', { class: 'ord' }, correctOrder(q));
    const cur = Array.isArray(r) ? r : [];
    const avail = perm.filter(i => !cur.includes(i));
    const pool = h('div', { class: 'ord-col' }, h('div', { class: 'ord-h' }, 'Itens'),
      avail.length
        ? avail.map(i => h('button', { type: 'button', class: 'ord-item', disabled: locked, 'data-fk': `a${i}`, onclick: () => ctx.set(cur.concat(i)) },
            h('span', { class: 'ord-plus', 'aria-hidden': 'true' }, '+'), h('span', { html: md(q.items[i]) })))
        : h('p', { class: 'ord-empty' }, 'Todos os itens foram posicionados.'));
    const list = h('ol', { class: 'ord-list' }, cur.map((i, pos) => h('li', {},
      h('button', { type: 'button', class: 'ord-item' + (fb ? (i === pos ? ' is-correct' : ' is-wrong') : ''), disabled: locked, 'data-fk': `p${i}`, title: 'Devolver item', onclick: () => ctx.set(cur.filter(x => x !== i)) },
        h('span', { class: 'ord-n' }, String(pos + 1)), h('span', { html: md(q.items[i]) })))));
    const mine = h('div', { class: 'ord-col' }, h('div', { class: 'ord-h' }, 'Sua ordem'),
      cur.length ? list : h('p', { class: 'ord-empty' }, 'Toque nos itens para montar a sequência.'));
    const box = h('div', { class: 'ord' }, pool, mine);
    if (fb && !grade(q, cur)) box.append(correctOrder(q));
    return box;
  }
  function ansFill(ctx) {
    const { id, q, r, locked, fb } = ctx;
    if (ctx.noAnswer) return h('div', { class: 'fillbox' }, h('p', { class: 'fill-exp', html: `Resposta esperada: <code>${esc(q.accept[0])}</code>` }));
    const ok = grade(q, r);
    const inp = h('input', { type: 'text', id: `fill-${id}`, class: 'fill' + (fb ? (ok ? ' is-correct' : ' is-wrong') : ''), value: r || '', disabled: locked,
      autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'Digite o termo', 'aria-label': 'Resposta', 'data-fk': 'fill' });
    inp.addEventListener('input', e => ctx.input(e.target.value));
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ctx.submit(); } });
    return h('div', { class: 'fillbox' }, inp,
      fb ? h('p', { class: 'fill-exp', html: `Resposta esperada: <code>${esc(q.accept[0])}</code>` }) : null);
  }
  function ansHotspot(ctx) {
    const { q, r, locked, fb } = ctx;
    return codeBlock(q.code[0], { sel: r, locked, fb, answer: q.answer, pick: i => ctx.set(i) });
  }
  function renderFeedback(ctx) {
    const { id, q, r } = ctx;
    const o = ctx.outcome || (!isComplete(q, r) ? 'S' : grade(q, r) ? 'P' : 'F');
    const ok = o === 'P';
    const status = { P: 'PASS', F: 'FAIL', S: 'SKIP', U: 'UNKNOWN' }[o];
    const left = `${ctx.logPrefix} ${status} ${id.replace(/-/g, '_')} `;
    const dots = '.'.repeat(Math.max(3, 56 - left.length));
    const tag = { PASS: '[PASS]', FAIL: '[FAIL 1]', SKIP: '[SKIP]', UNKNOWN: '[NO RECORD]' }[status];
    const tcls = status === 'PASS' ? 't-pass' : status === 'FAIL' ? 't-fail' : 't-muted';
    let summary = null;
    if (q.type === 'hotspot') summary = h('p', {}, h('strong', {}, 'Linha correta: '), String(q.answer + 1));
    if (q.type === 'domc' && !ok) summary = h('p', { html: '<strong>Alternativa correta:</strong> ' + md(q.options[q.answer]) });
    return h('section', { class: `feedback fb-${status === 'UNKNOWN' ? 'skip' : status.toLowerCase()}`, 'aria-live': 'polite' },
      h('div', { class: 'logline' }, left + dots + ' ', h('span', { class: tcls }, tag)),
      h('div', { class: 'fb-body' },
        h('h3', { class: 'fb-title' }, { PASS: 'Correto', FAIL: 'Incorreto', SKIP: 'Não respondida', UNKNOWN: 'Resultado não registrado' }[status]),
        ctx.noAnswer ? h('p', { class: 'note' }, 'A alternativa que você marcou não foi guardada: este simulado é anterior ao histórico. O certo ou errado vem do seu progresso no banco.') : null,
        summary,
        q.exp.map(p => h('p', { html: md(p) })),
        whyList(ctx),
        h('a', { class: 'doc', href: q.doc, target: '_blank', rel: 'noopener' }, 'Ler na documentação oficial ↗')));
  }
  // Per-option explanation (questions that carry `why`), in the order the options were shown
  function whyList(ctx) {
    const { q, perm } = ctx;
    if (!Array.isArray(q.why) || !q.options || !perm) return null;
    const right = oi => q.type === 'multi' ? q.answers.includes(oi) : oi === q.answer;
    return h('div', { class: 'why' }, h('div', { class: 'ord-h' }, 'Por alternativa'),
      h('ul', { class: 'why-list' }, perm.map((oi, pos) => h('li', { class: right(oi) ? 'is-right' : 'is-wrong' },
        h('span', { class: 'why-key' }, q.type === 'domc' ? (right(oi) ? '✓' : '✗') : `${LETTERS[pos]} ${right(oi) ? '✓' : '✗'}`),
        h('span', {}, q.type === 'domc' ? h('span', { class: 'why-opt', html: md(q.options[oi]) }) : null, h('span', { html: md(q.why[oi]) }))))));
  }
  function questionNodes(ctx) {
    const { q, fb } = ctx, dom = DOM[q.d];
    const answer = q.type === 'mc' || q.type === 'multi' ? ansChoice(ctx)
      : q.type === 'domc' ? ansDOMC(ctx)
      : q.type === 'match' ? ansMatch(ctx)
      : q.type === 'order' ? ansOrder(ctx)
      : q.type === 'fill' ? ansFill(ctx)
      : ansHotspot(ctx);
    return [
      h('div', { class: 'qmeta' },
        h('span', { class: 'qcount' }, ctx.countLabel),
        // during an exam only the question number shows; domain and subtopic would be a hint
        ctx.blind ? null : h('span', { class: 'chip chip-dom' }, `D${dom.n} · ${dom.pt}`),
        ctx.blind ? null : h('span', { class: 'chip' }, TYPE_INFO[q.type].label(q))),
      fb ? h('p', { class: 'qtopic' }, q.topic) : null,
      h('div', { class: 'stem', html: md(q.stem) }),
      q.type === 'hotspot' ? null : (q.code || []).map(c => codeBlock(c)),
      fb ? null : h('p', { class: 'hint' }, ctx.hint || TYPE_INFO[q.type].hint(q)),
      answer,
      fb ? renderFeedback(ctx) : (ctx.note || null)
    ];
  }

  /* ── simulado ── */
  function newSession(mode, order, subset, kind) {
    let ids;
    if (subset) ids = subset.slice();
    else {
      ids = [];
      DOMAINS.forEach(d => {
        // Prova 2 questions join the random draw only after they were answered in that exam
        const pool = shuffle(Q.filter(q => q.d === d.id && !(q.exam && !H[q.id])).map(q => q.id));
        // reserved checkpoint questions first, then unseen, then least answered; random within ties
        const rank = id => reserved(byId[id]) ? -1 : (H[id] ? H[id].n : 0);
        pool.sort((a, b) => rank(a) - rank(b));
        ids.push(...pool.slice(0, SIM_QUOTA[d.id] || 0));
      });
    }
    ids = order === 'domain' ? domainSort(ids) : shuffle(ids);
    const perms = {};
    ids.forEach(id => { perms[id] = makePerm(byId[id]); });
    const minutes = Math.ceil(EXAM_MIN * ids.length / EXAM_LEN);
    S = { v: 1, mode, order, kind: kind || (subset ? 'redo' : 'full'), ids, idx: 0, resp: {}, locked: {}, flags: {}, perms, minutes,
          startedAt: Date.now(), deadline: mode === 'exam' ? Date.now() + minutes * 60000 : null, finished: false, finishedAt: null, recorded: false };
    RV = null; confirmFinish = false; confirmDiscard = false;
    saveSim();
  }
  function domainSort(ids) {
    const rank = id => { const q = byId[id]; return [-(SIM_QUOTA[q.d] || 0), DOM[q.d].n, Q.indexOf(q)]; };
    return ids.sort((a, b) => { const ra = rank(a), rb = rank(b); return ra[0] - rb[0] || ra[1] - rb[1] || ra[2] - rb[2]; });
  }
  const isGraded = id => { const X = cur(); return X.finished || (X.mode === 'study' && !!X.locked[id]); };
  function quizCtx() {
    const X = cur(), ro = X === RV;
    const id = X.ids[X.idx], q = byId[id], r = X.resp[id], perm = safePerm(q, X.perms[id]);
    const fb = isGraded(id);
    let note = null;
    if (!fb && X.mode === 'exam' && isComplete(q, r)) {
      note = h('p', { class: 'saved' }, q.type === 'domc' ? 'Resposta registrada. A correção aparece quando você finalizar a prova.' : 'Resposta salva. Você pode alterá-la até finalizar a prova.');
    }
    const nop = () => {};
    return {
      id, q, r, perm, locked: ro || !!X.locked[id] || X.finished, fb, note,
      blind: X.mode === 'exam' && !X.finished,
      noAnswer: !!X.recon, outcome: X.recon ? outcome(X, id) : null,
      countLabel: `Questão ${X.idx + 1} de ${X.ids.length}`,
      logPrefix: `${X.idx + 1} of ${X.ids.length}`,
      // a past simulado is read-only; otherwise X is the live session S
      set: ro ? nop : v => { S.resp[id] = v; saveSim(); renderQuiz(); },
      input: ro ? nop : v => { S.resp[id] = v; saveSim(); renderChrome(); },
      submit: ro ? nop : submit,
      domc: ro ? nop : yes => {
        const nr = domcStep(q, perm, S.resp[id], yes);
        S.resp[id] = nr;
        if (nr.done) { S.locked[id] = true; if (S.mode === 'study') record(id, nr.correct); }
        saveSim(); renderQuiz();
      }
    };
  }
  function submit() {
    const id = S.ids[S.idx], q = byId[id];
    if (S.mode !== 'study' || S.locked[id] || !isComplete(q, S.resp[id])) return;
    S.locked[id] = true;
    record(id, grade(q, S.resp[id]));
    saveSim(); renderQuiz();
    const fb = document.querySelector('#qcard .feedback');
    if (fb) fb.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  function go(i) {
    const X = cur();
    if (!X || i < 0 || i >= X.ids.length) return;
    X.idx = i; confirmFinish = false; if (X === S) saveSim(); renderQuiz(); scrollTop();
  }
  function toggleFlag() { const id = S.ids[S.idx]; if (S.flags[id]) delete S.flags[id]; else S.flags[id] = true; saveSim(); renderQuiz(); }
  function finish() {
    if (!S || S.finished) return;
    S.finished = true; S.finishedAt = Date.now(); confirmFinish = false;
    if (S.mode === 'exam' && !S.recorded) {
      S.ids.forEach(id => { const q = byId[id], r = S.resp[id]; if (isComplete(q, r)) record(id, grade(q, r)); });
    }
    S.recorded = true;
    saveSim();
    addRecord(sessionRecord(S));
    resFilter = 'all';
    view = 'results'; render(); scrollTop();
  }
  function renderQuiz() {
    const key = activeKey();
    setChildren($('#qcard'), questionNodes(quizCtx()));
    renderChrome();
    restoreFocus($('#qcard'), key);
  }
  function renderChrome() { renderBar(); renderActions(); renderConfirm(); renderPalette(); }
  function renderBar() {
    const X = cur(), n = X.ids.length;
    const answered = X.ids.filter(id => isComplete(byId[id], X.resp[id])).length;
    const graded = X.ids.filter(isGraded);
    const correct = graded.filter(id => outcome(X, id) === 'P').length;
    $('#bar-progress').replaceChildren(...(X === RV
      ? [h('strong', {}, 'Revisão'), ` · simulado de ${fmtDate(X.startedAt || X.finishedAt)}`]
      : [h('strong', {}, `${answered}/${n}`), ' respondidas']));
    $('#bar-score').replaceChildren(...((X.mode === 'study' || X.finished) && graded.length ? [h('strong', {}, `${correct}/${graded.length}`), ' acertos'] : []));
    $('#bar-fill').style.width = ((X === RV ? X.idx + 1 : answered) / n * 100) + '%';
    const fin = $('#bar-finish');
    fin.textContent = X.finished ? 'Ver resultado' : (X.mode === 'exam' ? 'Finalizar prova' : 'Encerrar');
    fin.onclick = askFinish;
    updateTimer();
  }
  function updateTimer() {
    const t = $('#bar-timer');
    if (RV || !S || S.mode !== 'exam' || S.finished || view !== 'quiz') { t.hidden = true; return; }
    const left = S.deadline - Date.now();
    t.hidden = false;
    t.textContent = fmtTime(left);
    t.classList.toggle('is-low', left < 10 * 60000);
    t.setAttribute('aria-label', `Tempo restante ${fmtTime(left)}`);
    if (left <= 0) finish();
  }
  function renderActions() {
    const X = cur(), id = X.ids[X.idx], q = byId[id], r = X.resp[id];
    const locked = X === RV || !!X.locked[id] || X.finished;
    const last = X.idx === X.ids.length - 1;
    const right = [];
    if (X.mode === 'study' && !locked && q.type !== 'domc') {
      if (!last) right.push(h('button', { type: 'button', class: 'btn', onclick: () => go(X.idx + 1) }, 'Pular'));
      right.push(h('button', { type: 'button', class: 'btn btn-primary', disabled: !isComplete(q, r), onclick: submit }, 'Responder'));
    } else if (!last) {
      right.push(h('button', { type: 'button', class: 'btn btn-primary', onclick: () => go(X.idx + 1) }, 'Próxima →'));
    } else if (X.finished) {
      right.push(h('button', { type: 'button', class: 'btn btn-primary', onclick: () => { view = 'results'; render(); scrollTop(); } }, 'Ver resultado'));
    } else {
      right.push(h('button', { type: 'button', class: 'btn btn-primary', onclick: askFinish }, 'Finalizar'));
    }
    $('#actions').replaceChildren(
      h('div', {},
        h('button', { type: 'button', class: 'btn', disabled: X.idx === 0, onclick: () => go(X.idx - 1) }, '← Anterior'),
        // DOMC has no going back and no mark-for-review, as in the real exam
        X.finished || (X.mode === 'exam' && q.type === 'domc') ? null : h('button', { type: 'button', class: 'btn btn-ghost' + (S.flags[id] ? ' is-on' : ''), 'aria-pressed': String(!!S.flags[id]), onclick: toggleFlag }, S.flags[id] ? 'Marcada para revisão' : 'Marcar para revisão')),
      h('div', {}, right));
  }
  function askFinish() {
    if (cur().finished) { view = 'results'; render(); scrollTop(); return; }
    confirmFinish = true; renderConfirm();
    const el = $('#confirm'); if (!el.hidden) el.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  function renderConfirm() {
    const el = $('#confirm');
    if (!confirmFinish || cur().finished) { el.hidden = true; el.replaceChildren(); return; }
    const answered = S.ids.filter(id => isComplete(byId[id], S.resp[id])).length;
    const flagged = S.ids.filter(id => S.flags[id]).length;
    el.hidden = false;
    el.replaceChildren(
      h('p', {}, h('strong', {}, 'Finalizar o simulado? '), `Você respondeu ${answered} de ${S.ids.length}.` + (flagged ? ` ${flagged} ${flagged === 1 ? 'questão está marcada' : 'questões estão marcadas'} para revisão.` : '') + ' Questões sem resposta contam como erro.'),
      h('div', { class: 'row' },
        h('button', { type: 'button', class: 'btn btn-primary', onclick: finish }, 'Finalizar e ver resultado'),
        h('button', { type: 'button', class: 'btn', onclick: () => { confirmFinish = false; renderConfirm(); } }, 'Continuar respondendo')));
  }
  function renderPalette() {
    const X = cur();
    $('#palette').replaceChildren(...X.ids.map((id, i) => {
      const q = byId[id], done = isComplete(q, X.resp[id]);
      let cls = 'pcell';
      if (isGraded(id)) { const o = outcome(X, id); cls += o === 'P' ? ' correct' : o === 'U' ? '' : ' wrong'; }
      else if (done) cls += ' answered';
      if (X.flags[id]) cls += ' flagged';
      if (i === X.idx) cls += ' current';
      const title = X.mode === 'exam' && !X.finished ? `Questão ${i + 1}` : `${DOM[q.d].pt} · ${TYPE_INFO[q.type].label(q)}`;
      return h('button', { type: 'button', class: cls, 'aria-current': i === X.idx ? 'true' : null, title, onclick: () => go(i) }, String(i + 1));
    }));
  }

  /* ── simulado history: every finished simulado, with all questions and answers ── */
  function summarize(X) {   // X: a live session or a history record
    const per = {};
    let n = 0, pass = 0, fail = 0, skip = 0, unknown = 0;
    X.ids.forEach(id => {
      if (!byId[id]) return;
      const d = byId[id].d, p = per[d] || (per[d] = { t: 0, c: 0 }), o = outcome(X, id);
      n++; p.t++;
      if (o === 'P') { pass++; p.c++; } else if (o === 'F') fail++; else if (o === 'S') skip++; else unknown++;
    });
    return { n, pass, fail, skip, unknown, per, pct: pct(pass, n) };
  }
  function sessionRecord(s) {
    const copy = o => JSON.parse(JSON.stringify(o || {}));
    const sum = summarize(s);
    return { v: 1, id: 'r' + Number(s.startedAt || Date.now()).toString(36), mode: s.mode, order: s.order || 'mixed',
      kind: s.kind || (s.ids.length >= EXAM_LEN ? 'full' : 'redo'), startedAt: s.startedAt || null, finishedAt: s.finishedAt || Date.now(),
      ids: s.ids.slice(), resp: copy(s.resp), perms: copy(s.perms), flags: copy(s.flags),
      n: sum.n, pass: sum.pass, fail: sum.fail, skip: sum.skip, per: sum.per };
  }
  function validRecord(d) {
    return !!d && d.v === 1 && typeof d.id === 'string' && /^[\w.~:@+-]{1,100}$/.test(d.id) && Array.isArray(d.ids) && d.ids.some(id => byId[id]) &&
      !!d.resp && typeof d.resp === 'object' && (typeof d.startedAt === 'number' || typeof d.finishedAt === 'number');
  }
  const recTime = r => r.finishedAt || r.startedAt || 0;
  function sortSL() { SL.sort((a, b) => recTime(b) - recTime(a)); }
  function addRecord(rec) {
    if (SL.some(r => r.id === rec.id) || DEL.includes(rec.id)) return;
    SL.push(rec); sortSL(); saveSL(); pushRecord(rec);
  }
  function deleteRecord(id) {
    SL = SL.filter(r => r.id !== id);
    if (!DEL.includes(id)) DEL.push(id);
    saveSL(); saveDEL(); pushDelete(id);
    confirmDel = null; renderStart();
  }
  function openRecord(rec) {
    const ids = rec.ids.filter(id => byId[id]);
    if (!ids.length) return;
    RV = { mode: rec.mode, order: rec.order, kind: rec.kind, ids, idx: 0, resp: rec.resp || {}, locked: {}, flags: rec.flags || {}, perms: rec.perms || {},
           startedAt: rec.startedAt, finishedAt: rec.finishedAt, finished: true, recon: rec.recon || null };
    resFilter = 'all'; view = 'results'; render(); scrollTop();
  }
  function openReview(i) {
    const X = cur();
    X.idx = i; if (X === S) saveSim();
    view = 'quiz'; render(); scrollTop();
  }
  // The checkpoint simulado was taken before this history existed. If no record of it is left, rebuild which
  // questions were right or wrong from the per-question history: the exam recorded all 65 at the same moment,
  // and the 'redo the ones I got wrong' session, when present, lists exactly the wrong ones.
  function reconstructCheckpoint() {
    const cp = Q.filter(q => q.set === 'cp1').map(q => q.id);
    if (!cp.length || !cp.every(id => H[id] && typeof H[id].t === 'number')) return;
    const cpSet = new Set(cp);
    if (SL.some(r => r.ids.filter(id => cpSet.has(id)).length >= cp.length - 5)) return;
    const T = Math.min(...cp.map(id => H[id].t));
    if (cp.filter(id => H[id].t - T < 3000).length < 5) return;   // not answered together, so not an exam-mode simulado
    const id = 'cp1-' + T.toString(36);
    if (DEL.includes(id)) return;
    const wrong = S && S.mode === 'study' && S.startedAt > T && S.ids.length < cp.length && S.ids.every(x => cpSet.has(x)) ? new Set(S.ids) : null;
    const recon = {};
    cp.forEach(x => {
      const hx = H[x];
      recon[x] = wrong ? !wrong.has(x) : hx.n === 1 ? hx.c === 1 : hx.c === 0 ? false : hx.c === hx.n ? true : null;
    });
    const rec = { v: 1, id, mode: 'exam', order: 'domain', kind: 'full', recon, startedAt: null, finishedAt: T,
      ids: domainSort(cp.slice()), resp: {}, perms: {}, flags: {} };
    const sum = summarize(rec);
    Object.assign(rec, { n: sum.n, pass: sum.pass, fail: sum.fail, skip: 0, unknown: sum.unknown, per: sum.per });
    SL.push(rec);
  }

  /* ── sync with the account (db capability): local copy first, the account copy follows ── */
  const SYNC_NOTE = {
    off: 'Guardado neste navegador.',
    syncing: 'Sincronizando com a sua conta…',
    on: 'Guardado também na sua conta do Claude: aparece no celular e em outros navegadores.',
    local: 'Guardado só neste navegador.',
    error: 'Guardado neste navegador. A sincronização com a sua conta falhou; uma nova tentativa acontece quando você reabrir a página.'
  };
  const tombstone = id => ({ v: 1, id, deleted: true, deletedAt: Date.now() });
  function withTimeout(p, ms) { return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej({ code: 'timeout' }), ms))]); }
  function refreshHistory() { if (view === 'start') renderStart(); }
  async function initSync() {
    if (!(window.claude && typeof window.claude.use === 'function')) { syncState = 'off'; return; }
    let db = null;
    try { db = await window.claude.use('db'); } catch (e) { db = null; }
    if (!db) { syncState = 'off'; refreshHistory(); return; }
    try {
      const snap = await withTimeout(db.collection('sims').get(), 10000);
      DB = db;
      const remote = {};
      snap.docs.forEach(d => { if (d.exists) remote[d.id] = d.data(); });
      let changed = false;
      Object.keys(remote).forEach(id => {
        const d = remote[id];
        if (d && d.deleted) {   // deleted on another device
          if (!DEL.includes(id)) { DEL.push(id); changed = true; }
          if (SL.some(r => r.id === id)) { SL = SL.filter(r => r.id !== id); changed = true; }
        } else if (validRecord(d) && !DEL.includes(id) && !SL.some(r => r.id === id)) {   // taken on another device
          SL.push(JSON.parse(JSON.stringify(d))); changed = true;
        }
      });
      if (changed) { sortSL(); saveSL(); saveDEL(); }
      refreshHistory();
      // send what only this browser has, one write per document
      for (const id of DEL) if (!(remote[id] && remote[id].deleted)) await db.doc('sims/' + id).set(tombstone(id));
      for (const r of SL) if (!remote[r.id]) await db.doc('sims/' + r.id).set(r);
      syncState = 'on';
    } catch (e) {
      syncState = e && e.code === 'invalid_argument' ? 'local' : 'error';
    }
    refreshHistory();
  }
  function pushRecord(rec) {
    if (!DB || syncState === 'local') return;
    DB.doc('sims/' + rec.id).set(rec).catch(e => { syncState = e && e.code === 'invalid_argument' ? 'local' : 'error'; refreshHistory(); });
  }
  function pushDelete(id) {
    if (!DB || syncState === 'local') return;
    DB.doc('sims/' + id).set(tombstone(id)).catch(() => {});   // DEL keeps it, so the next sync retries
  }

  /* ── fast study ── */
  const LOG_MAX = 500;   // past questions kept for going back
  function newFast(domain) {
    F = { v: 1, domain: domain || 'all', id: null, perm: null, resp: null, locked: false, n: 0, c: 0, streak: 0, best: 0, recent: [], log: [], back: 0 };
    drawFast(); saveFast();
  }
  const wrongIds = () => Q.filter(q => H[q.id] && H[q.id].last === false).map(q => q.id);
  function fastPool() {
    if (F.domain === 'wrong') return wrongIds();
    return Q.filter(q => !reserved(q) && (F.domain === 'all' || q.d === F.domain)).map(q => q.id);
  }
  // Deck-style draw: a question already shown in fast study only comes back after every
  // other question in the filter has been shown as many times. Within the least-shown tier,
  // questions never answered anywhere come first, then ones last answered wrong.
  function pickNext() {
    let pool = fastPool();
    if (!pool.length) { F.domain = 'all'; prefs.fastDomain = 'all'; savePrefs(); pool = fastPool(); }
    const recent = new Set(F.recent.slice(-Math.min(10, Math.max(0, pool.length - 1))));
    let cands = pool.filter(id => id !== F.id && !recent.has(id));
    if (!cands.length) cands = pool.filter(id => id !== F.id);
    if (!cands.length) cands = pool;
    const least = Math.min(...cands.map(id => FS[id] || 0));
    const tier = cands.filter(id => (FS[id] || 0) === least);
    const w = tier.map(id => { const x = H[id]; if (!x) return 3; return x.last ? 1 : 2; });
    let t = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < tier.length; i++) { t -= w[i]; if (t <= 0) return tier[i]; }
    return tier[tier.length - 1];
  }
  function drawFast() {
    const id = pickNext();
    FS[id] = (FS[id] || 0) + 1; saveFS();
    F.id = id; F.perm = makePerm(byId[id]); F.resp = null; F.locked = false;
  }
  // The card shows the live question (F itself) or, after going back, an entry of F.log.
  // Log entries carry the same id/perm/resp/locked fields, so one code path answers either.
  const fastEntry = () => F.back ? F.log[F.log.length - F.back] : F;
  function fastCtx() {
    const e = fastEntry(), q = byId[e.id];
    const num = F.log.length - F.back + 1;
    return {
      id: e.id, q, r: e.resp, perm: e.perm, locked: e.locked, fb: e.locked,
      countLabel: F.back ? `Fast study · questão ${num} de ${F.log.length + 1}` : `Fast study · questão ${num}`,
      logPrefix: `#${num}`,
      hint: INSTANT[q.type] ? (q.type === 'mc' ? 'Clique na alternativa: a correção aparece na hora.' : 'Clique na linha: a correção aparece na hora.') : null,
      set: v => { if (e.locked) return; e.resp = v; if (INSTANT[q.type]) { fastLock(); return; } saveFast(); renderFast(); },
      input: v => { e.resp = v; saveFast(); renderFastActions(); },
      submit: fastSubmit,
      domc: yes => { if (e.locked) return; e.resp = domcStep(q, e.perm, e.resp, yes); if (e.resp.done) fastLock(); else { saveFast(); renderFast(); } }
    };
  }
  function fastLock() {
    const e = fastEntry(), q = byId[e.id], ok = grade(q, e.resp);
    e.locked = true; F.n++;
    if (ok) { F.c++; F.streak++; if (F.streak > F.best) F.best = F.streak; } else F.streak = 0;
    record(e.id, ok);
    saveFast(); renderFast();
    const fb = document.querySelector('#fcard .feedback');
    if (fb) fb.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
    const nx = document.getElementById('fast-next');
    if (nx) nx.focus({ preventScroll: true });
  }
  function fastSubmit() { const e = fastEntry(); if (!e.locked && isComplete(byId[e.id], e.resp)) fastLock(); }
  function retireCurrent() {
    F.recent.push(F.id); F.recent = F.recent.slice(-30);
    F.log.push({ id: F.id, perm: F.perm, resp: F.resp, locked: F.locked });
    if (F.log.length > LOG_MAX) F.log = F.log.slice(-LOG_MAX);
  }
  function fastNext() {
    F.back = 0; retireCurrent();
    drawFast(); saveFast(); renderFast(); scrollTop();
  }
  function fastGo(back) {   // back = how many questions behind the live one
    F.back = Math.max(0, Math.min(F.log.length, back));
    saveFast(); renderFast(); scrollTop();
  }
  function switchFastDomain(v) {
    F.domain = v; F.back = 0;
    if (F.locked) retireCurrent();   // an answered question stays reachable from the history
    drawFast(); saveFast();
  }
  function setFastDomain(v) {
    prefs.fastDomain = v; savePrefs();
    if (F.domain === v) return;
    switchFastDomain(v); renderFast();
  }
  function renderFast() {
    const key = activeKey();
    renderFastBar(); renderFastTop();
    setChildren($('#fcard'), questionNodes(fastCtx()));
    renderFastActions(); renderFastMap();
    restoreFocus($('#screen-fast'), key);
  }
  function renderFastMap() {
    const all = F.log.concat([F]), here = F.log.length - F.back;
    $('#fmap').hidden = !F.log.length;
    $('#fmap-sum').textContent = `Histórico da sessão (${all.length} questões)`;
    $('#fpalette').replaceChildren(...all.map((e, i) => {
      const q = byId[e.id];
      let cls = 'pcell';
      if (e.locked) cls += grade(q, e.resp) ? ' correct' : ' wrong';
      if (i === here) cls += ' current';
      return h('button', { type: 'button', class: cls, 'aria-current': i === here ? 'true' : null, title: `${DOM[q.d].pt} · ${TYPE_INFO[q.type].label(q)}`, onclick: () => fastGo(F.log.length - i) }, String(i + 1));
    }));
  }
  function renderFastBar() {
    $('#bar-progress').replaceChildren(h('strong', {}, String(F.n)), F.n === 1 ? ' respondida nesta sessão' : ' respondidas nesta sessão');
    $('#bar-score').replaceChildren(...(F.n ? [h('strong', {}, `${F.c}/${F.n}`), ` acertos (${pct(F.c, F.n)}%)` + (F.streak > 1 ? ` · sequência de ${F.streak}` : '')] : []));
    const pool = fastPool();
    $('#bar-fill').style.width = (pool.length ? pool.filter(id => FS[id]).length / pool.length * 100 : 0) + '%';
    $('#bar-timer').hidden = true;
    const fin = $('#bar-finish');
    fin.textContent = 'Sair';
    fin.onclick = () => { view = 'start'; render(); scrollTop(); };
  }
  function domainOptions(selected) {
    const nWrong = wrongIds().length;
    const avail = Q.filter(q => !reserved(q));
    return [h('option', { value: 'all', selected: selected === 'all' }, `Todos os domínios (${avail.length} questões)`),
      h('option', { value: 'wrong', selected: selected === 'wrong', disabled: !nWrong && selected !== 'wrong' }, `Revisar as que errei (${nWrong})`),
      ...DOMAINS.map(d => h('option', { value: d.id, selected: selected === d.id }, `D${d.n} · ${d.pt} (${avail.filter(q => q.d === d.id).length})`))];
  }
  function reviewButton() {
    const n = wrongIds().length, on = F.domain === 'wrong';
    return h('button', { type: 'button', class: 'fact fact-btn' + (on ? ' is-on' : ''), disabled: !n && !on, 'data-fk': 'review-wrong',
        title: on ? 'Voltar para todas as questões' : 'Praticar só as questões que você errou',
        onclick: () => setFastDomain(on ? 'all' : 'wrong') },
      h('b', {}, String(n)), on ? (n === 1 ? ' errada restante · sair da revisão' : ' erradas restantes · sair da revisão') : (n === 1 ? ' errada para revisar →' : ' erradas para revisar →'));
  }
  function renderFastTop() {
    const pool = fastPool();
    const shown = pool.filter(id => FS[id]).length;
    $('#fast-top').replaceChildren(
      h('label', { class: 'fast-filter', for: 'fast-domain' }, h('span', { class: 'ord-h' }, 'Filtro'),
        h('select', { id: 'fast-domain', 'data-fk': 'fast-domain', onchange: e => setFastDomain(e.target.value) }, domainOptions(F.domain))),
      h('div', { class: 'fast-stats' },
        h('span', { class: 'fact' }, h('b', {}, `${shown}/${pool.length}`), ' já apareceram'),
        reviewButton(),
        F.best > 1 ? h('span', { class: 'fact' }, 'Recorde: ', h('b', {}, String(F.best)), ' seguidas') : null));
  }
  function renderFastActions() {
    const e = fastEntry(), q = byId[e.id];
    const canFix = !e.locked && !INSTANT[q.type] && q.type !== 'domc';
    const fixBtn = () => h('button', { type: 'button', class: 'btn btn-primary', disabled: !isComplete(q, e.resp), onclick: fastSubmit }, 'Corrigir');
    const right = [];
    if (F.back) {
      if (canFix) right.push(fixBtn());
      right.push(h('button', { type: 'button', id: 'fast-next', class: 'btn' + (canFix ? '' : ' btn-primary'), 'data-fk': 'fast-fwd', onclick: () => fastGo(F.back - 1) }, F.back === 1 ? 'Voltar para a atual →' : 'Avançar →'));
    } else if (!e.locked) {
      right.push(h('button', { type: 'button', class: 'btn', onclick: fastNext }, 'Pular'));
      if (canFix) right.push(fixBtn());
    } else {
      right.push(h('button', { type: 'button', id: 'fast-next', class: 'btn btn-primary', onclick: fastNext }, 'Próxima questão →'));
    }
    const left = [h('button', { type: 'button', class: 'btn', 'data-fk': 'fast-prev', disabled: F.back >= F.log.length, onclick: () => fastGo(F.back + 1) }, '← Anterior')];
    if (F.back > 1) left.push(h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => fastGo(0) }, `Ir para a atual (${F.log.length + 1})`));
    const keys = [];
    if (!e.locked && (q.type === 'mc' || q.type === 'multi')) keys.push(`1–${q.options.length} escolhem`);
    if (F.back) keys.push('→ avança'); else if (e.locked) keys.push('Enter ou → próxima');
    if (F.back < F.log.length) keys.push('← volta');
    if (keys.length) left.push(h('p', { class: 'kbd-hint' }, 'Atalhos: ' + keys.join(' · ')));
    $('#factions').replaceChildren(h('div', {}, left), h('div', {}, right));
  }

  /* ── start screen ── */
  function radioGroup(name, legend, opts, value, onChange) {
    return h('fieldset', { class: 'seg' }, h('legend', {}, legend),
      h('div', { class: 'seg-opts' }, opts.map(o => h('label', { class: 'seg-opt' + (o.v === value ? ' is-on' : ''), for: `${name}-${o.v}` },
        h('input', { type: 'radio', name, id: `${name}-${o.v}`, value: o.v, checked: o.v === value, 'data-fk': `${name}-${o.v}`, onchange: () => onChange(o.v) }),
        h('span', { class: 'seg-title' }, o.t),
        h('span', { class: 'seg-desc' }, o.d)))));
  }
  function startFast() {
    if (!F) newFast(prefs.fastDomain);
    else if (F.domain !== prefs.fastDomain) switchFastDomain(prefs.fastDomain);
    else if (F.back) { F.back = 0; saveFast(); }
    view = 'fast'; render(); scrollTop();
  }
  function renderStart() {
    const key = activeKey();
    const root = $('#screen-start');
    const setPref = (k, v) => { prefs[k] = v; savePrefs(); renderStart(); };
    const all = histStats();
    const bankCount = d => Q.filter(q => q.d === d.id).length;
    const dist = DOMAINS.slice().sort((a, b) => bankCount(b) - bankCount(a) || a.n - b.n);
    const maxBank = Math.max(...dist.map(bankCount));
    const fmtCounts = {}; Q.forEach(q => { fmtCounts[q.type] = (fmtCounts[q.type] || 0) + 1; });
    const fmtOrder = ['mc', 'multi', 'domc', 'match', 'order', 'fill', 'hotspot'];
    const simTotal = Object.values(SIM_QUOTA).reduce((a, b) => a + b, 0);
    const nReserved = PUB ? 0 : Q.filter(q => q.set && !H[q.id]).length;
    const nP2Pending = P2.filter(id => !H[id]).length;

    /* progress */
    let progress = null;
    if (all.seen) {
      const statRow = (tag, name, st) => h('div', { class: 'drow' },
        h('div', { class: 'dname' }, tag ? h('span', { class: 'dnum' }, tag) : null, h('span', {}, name)),
        h('div', { class: 'dval' }, `${st.lastOk}/${st.seen} certas · ${st.acc}%`),
        h('div', { class: 'dbar' }, h('i', { class: st.acc >= PASS_PCT ? 'ok' : 'no', style: `width:${Math.max(st.acc, 2)}%` })));
      const topics = [];
      Q.forEach(q => { let t = topics.find(x => x.d === q.d && x.topic === q.topic); if (!t) topics.push(t = { d: q.d, topic: q.topic, ids: [] }); t.ids.push(q.id); });
      const topicStats = topics.map(t => Object.assign(t, { st: histStats(t.ids) })).filter(t => t.st.seen)
        .sort((a, b) => a.st.acc - b.st.acc || b.st.pending - a.st.pending || DOM[a.d].n - DOM[b.d].n);
      const fmtStats = fmtOrder.filter(t => fmtCounts[t]).map(t => ({ t, st: histStats(Q.filter(q => q.type === t).map(q => q.id)) })).filter(x => x.st.seen);
      progress = h('div', { class: 'block' },
        h('h2', {}, 'Seu progresso no banco'),
        h('div', { class: 'facts' },
          h('span', { class: 'fact' }, h('b', {}, `${all.seen}/${all.total}`), ' questões vistas'),
          h('span', { class: 'fact' }, h('b', {}, `${all.acc}%`), ' de acerto na última tentativa'),
          h('button', { type: 'button', class: 'fact fact-btn', disabled: !all.pending, title: 'Abrir o fast study só com as questões que você errou',
              onclick: () => { prefs.fastDomain = 'wrong'; savePrefs(); startFast(); } },
            h('b', {}, String(all.pending)), all.pending === 1 ? ' errada para revisar →' : ' erradas para revisar →')),
        h('div', { class: 'dist res-dom' }, dist.map(d => {
          const st = histStats(Q.filter(q => q.d === d.id).map(q => q.id));
          return h('div', { class: 'drow' },
            h('div', { class: 'dname' }, h('span', { class: 'dnum' }, `D${d.n}`), h('span', {}, d.pt)),
            h('div', { class: 'dval' }, st.seen ? `${st.seen}/${st.total} vistas · ${st.acc}%` : `0/${st.total} vistas`),
            h('div', { class: 'dbar' }, h('i', { class: st.seen ? (st.acc >= PASS_PCT ? 'ok' : 'no') : '', style: `width:${st.seen ? Math.max(st.acc, 2) : 0}%` })));
        })),
        h('p', { class: 'note' }, 'A barra mostra o acerto na última tentativa de cada questão já vista; a linha vertical marca 65%.'),
        h('details', { class: 'map breakdown', open: openTopics, ontoggle: e => { openTopics = e.currentTarget.open; } },
          h('summary', {}, `Desempenho por subtópico (${topicStats.length})`),
          h('p', { class: 'note' }, 'Do pior para o melhor, pela última tentativa de cada questão. Os nomes são os subtópicos do Topics Outline do guia oficial. Comece a revisão pelos que estão abaixo de 65%.'),
          h('div', { class: 'dist res-dom' }, topicStats.map(t => statRow(`D${DOM[t.d].n}`, t.topic, t.st)))),
        h('details', { class: 'map breakdown', open: openFormats, ontoggle: e => { openFormats = e.currentTarget.open; } },
          h('summary', {}, 'Desempenho por formato de questão'),
          h('div', { class: 'dist res-dom' }, fmtStats.map(x => statRow(null, TYPE_INFO[x.t].label({ choose: 'N' }), x.st)))),
        h('div', { class: 'row' }, confirmReset
          ? [h('button', { type: 'button', class: 'btn', onclick: () => { H = {}; saveHist(); FS = {}; saveFS(); confirmReset = false; renderStart(); } }, 'Confirmar: apagar progresso'),
             h('button', { type: 'button', class: 'btn', onclick: () => { confirmReset = false; renderStart(); } }, 'Cancelar')]
          : h('button', { type: 'button', class: 'btn btn-sm', onclick: () => { confirmReset = true; renderStart(); } }, 'Zerar progresso do banco')),
        h('p', { class: 'note' }, 'Zerar o progresso não apaga o histórico de simulados.'));
    }

    /* simulado history */
    const histRows = SL.map(rec => {
      const sum = summarize(rec);
      const when = fmtDate(rec.startedAt || rec.finishedAt);
      const mode = rec.mode === 'exam' ? 'prova' : 'estudo';
      const label = rec.recon ? 'Checkpoint · reconstruído' : rec.kind === 'p2' ? 'Prova 2' : rec.kind === 'redo' ? `Refazer erradas · modo ${mode}` : `Simulado · modo ${mode}`;
      const dur = rec.startedAt && rec.finishedAt ? fmtTime(rec.finishedAt - rec.startedAt) : null;
      if (confirmDel === rec.id) {
        return h('div', { class: 'hconfirm' },
          h('p', {}, h('strong', {}, `Excluir o simulado de ${when}? `), syncState === 'on' ? 'Ele sai deste navegador e da sua conta.' : 'Ele sai do histórico.'),
          h('div', { class: 'row' },
            h('button', { type: 'button', class: 'btn', 'data-fk': 'hdel-yes', onclick: () => deleteRecord(rec.id) }, 'Excluir'),
            h('button', { type: 'button', class: 'btn', 'data-fk': 'hdel-no', onclick: () => { confirmDel = null; renderStart(); } }, 'Cancelar')));
      }
      return h('div', { class: 'hrow' },
        h('button', { type: 'button', class: 'hmain', 'data-fk': 'h-' + rec.id, onclick: () => openRecord(rec) },
          h('span', { class: 'hdate' }, when),
          h('span', { class: 'hscore ' + (sum.pct >= PASS_PCT ? 'ok' : 'no') }, `${sum.pct}%`),
          h('span', { class: 'hdesc' }, [label, `${sum.n} questões`, dur].filter(Boolean).join(' · ')),
          h('span', { class: 'hcount' }, `${sum.pass}/${sum.n} certas`)),
        h('button', { type: 'button', class: 'btn btn-sm hdel', 'aria-label': `Excluir o simulado de ${when}`, onclick: () => { confirmDel = rec.id; renderStart(); } }, 'Excluir'));
    });
    const history = h('div', { class: 'block', id: 'hist' },
      h('h2', {}, SL.length ? `Histórico de simulados (${SL.length})` : 'Histórico de simulados'),
      h('p', { class: 'note' }, SL.length
        ? 'Cada simulado finalizado fica guardado com todas as questões e as suas respostas. Abra um para ver o resultado e revisar questão por questão, as certas e as erradas.'
        : 'Nenhum simulado salvo ainda. Cada simulado que você finalizar fica guardado aqui, com todas as questões e as suas respostas.'),
      h('p', { class: 'note sync' }, SYNC_NOTE[syncState]),
      SL.length ? h('div', { class: 'hlist' }, histRows) : null);

    /* fast panel */
    const fastPanel = h('section', { class: 'panel' },
      h('span', { class: 'panel-tag' }, 'Prática diária'),
      h('h2', {}, 'Fast study'),
      h('p', { class: 'note' }, 'Uma questão por vez, sorteada do banco inteiro. Clicou, corrigiu: a resposta certa e a explicação aparecem na hora. Uma questão que já apareceu só volta depois que todas as outras do filtro tiverem aparecido. Para rever seus erros, escolha o filtro "Revisar as que errei". O botão "← Anterior" e o histórico da sessão levam de volta a qualquer questão já vista.'),
      nReserved ? h('p', { class: 'note' }, `As ${nReserved} questões inéditas do checkpoint ficam fora do fast study até você respondê-las no simulado.`) : null,
      nP2Pending ? h('p', { class: 'note' }, `As ${nP2Pending} questões da Prova 2 que você ainda não respondeu ficam fora do fast study e do simulado sorteado.`) : null,
      h('label', { class: 'field', for: 'start-fast-domain' }, h('span', { class: 'ord-h' }, 'Filtro'),
        h('select', { id: 'start-fast-domain', 'data-fk': 'start-fast-domain', onchange: e => { prefs.fastDomain = e.target.value; savePrefs(); } }, domainOptions(prefs.fastDomain))),
      h('div', { class: 'row' },
        h('button', { type: 'button', class: 'btn btn-primary', 'data-fk': 'fast-go', onclick: startFast }, F && F.n ? `Continuar sessão (${F.n} respondidas)` : 'Começar fast study'),
        F && F.n ? h('button', { type: 'button', class: 'btn', onclick: () => { newFast(prefs.fastDomain); view = 'fast'; render(); scrollTop(); } }, 'Nova sessão') : null));

    /* simulado panel */
    let resume = null;
    if (S && !S.finished) {
      const answered = S.ids.filter(id => isComplete(byId[id], S.resp[id])).length;
      resume = h('div', { class: 'resume' },
        h('h3', {}, S.kind === 'p2' ? 'Prova 2 em andamento' : 'Simulado em andamento'),
        h('p', { class: 'note' }, `Modo ${S.mode === 'exam' ? 'prova' : 'estudo'} · ${answered} de ${S.ids.length} respondidas` + (S.mode === 'exam' ? ` · ${fmtTime(S.deadline - Date.now())} restantes` : '')),
        h('div', { class: 'row' },
          h('button', { type: 'button', class: 'btn btn-primary', onclick: () => { view = 'quiz'; render(); scrollTop(); } }, 'Continuar de onde parei'),
          confirmDiscard
            ? h('button', { type: 'button', class: 'btn', onclick: () => { S = null; store(KEY.sim, null); confirmDiscard = false; renderStart(); } }, 'Confirmar: descartar')
            : h('button', { type: 'button', class: 'btn', onclick: () => { confirmDiscard = true; renderStart(); } }, 'Descartar')));
    } else if (S && S.finished) {
      const ok = S.ids.filter(id => grade(byId[id], S.resp[id])).length;
      resume = h('div', { class: 'resume' },
        h('h3', {}, 'Último resultado'),
        h('p', { class: 'note' }, `${ok} de ${S.ids.length} corretas (${pct(ok, S.ids.length)}%).`),
        h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn', onclick: () => { view = 'results'; render(); scrollTop(); } }, 'Ver resultado e revisão')));
    }
    const simPanel = h('section', { class: 'panel' },
      h('span', { class: 'panel-tag' }, 'Dia da prova'),
      h('h2', {}, `Simulado de ${simTotal} questões`),
      h('p', { class: 'note' }, `Sorteia ${simTotal} questões do banco respeitando o peso de cada domínio, com prioridade para as que você ainda não viu. Cada simulado finalizado fica no histórico, logo abaixo.`),
      nReserved ? h('p', { class: 'reserved', html: `<strong>${nReserved} questões inéditas reservadas para o checkpoint.</strong> O próximo simulado sorteado usa estas antes de qualquer outra.` +
        (prefs.mode === 'exam' ? 'O modo Prova já está selecionado.' : 'Para valer como checkpoint, escolha o modo Prova abaixo.') }) : null,
      resume,
      radioGroup('mode', 'Modo', [
        { v: 'study', t: 'Estudo', d: 'Correção e explicação a cada resposta.' },
        { v: 'exam', t: 'Prova', d: 'Cronômetro de 2 horas; correção só no final.' }
      ], prefs.mode, v => setPref('mode', v)),
      radioGroup('order', 'Ordem das questões', [
        { v: 'mixed', t: 'Misturada', d: 'Domínios embaralhados, como na prova real.' },
        { v: 'domain', t: 'Por domínio', d: 'Do domínio mais cobrado para o menos cobrado.' }
      ], prefs.order, v => setPref('order', v)),
      h('div', { class: 'row' },
        h('button', { type: 'button', class: 'btn btn-primary', 'data-fk': 'sim-go', onclick: () => { newSession(prefs.mode, prefs.order); view = 'quiz'; render(); scrollTop(); } }, S && !S.finished ? 'Sortear um novo simulado' : 'Sortear simulado')));

    /* Prova 2: fixed exam calibrated to the real one */
    let p2Panel = null;
    if (P2.length) {
      const last = SL.find(r => r.kind === 'p2');
      const lastSum = last && summarize(last);
      const busy = S && !S.finished;
      const startP2 = () => { confirmP2 = false; newSession('exam', 'mixed', P2, 'p2'); view = 'quiz'; render(); scrollTop(); };
      p2Panel = h('section', { class: 'panel panel-wide' },
        h('span', { class: 'panel-tag' }, 'Mais difícil que a prova real'),
        h('h2', {}, 'Prova 2'),
        h('p', { class: 'note' }, `${P2.length} questões fixas e inéditas, em modo prova com cronômetro de 2 horas. Os distratores são plausíveis, a maioria das questões traz YAML, SQL, comando ou log, e o domínio e o subtópico só aparecem na revisão. É mais difícil que a prova oficial de propósito: passar de 65% aqui é um bom sinal.` + (PUB ? ' Faça depois de estudar com o banco, porque essas questões ficam fora do fast study e do simulado sorteado.' : '')),
        last ? h('p', { class: 'reserved' }, h('strong', {}, `Última tentativa: ${lastSum.pct}% `), `(${lastSum.pass}/${lastSum.n}) em ${fmtDate(last.startedAt || last.finishedAt)}. Refazer mede fixação, não desempenho em questões novas.`) : null,
        h('div', { class: 'row' }, confirmP2
          ? [h('button', { type: 'button', class: 'btn btn-primary', 'data-fk': 'p2-yes', onclick: startP2 }, 'Confirmar: descartar o simulado em andamento'),
             h('button', { type: 'button', class: 'btn', 'data-fk': 'p2-no', onclick: () => { confirmP2 = false; renderStart(); } }, 'Cancelar')]
          : h('button', { type: 'button', class: 'btn btn-primary', 'data-fk': 'p2-go', onclick: () => { if (busy) { confirmP2 = true; renderStart(); } else startP2(); } }, last ? 'Refazer a Prova 2' : 'Começar a Prova 2')));
    }

    setChildren(root,
      h('div', { class: 'hero' },
        h('p', { class: 'eyebrow' }, (PUB ? 'Não oficial · ' : '') + 'dbt Analytics Engineering Certification · dbt Core 1.11'),
        h('h1', {}, 'Simulado dbt Analytics Engineering'),
        h('p', { class: 'lede' }, `Banco com ${Q.length} questões no formato da prova, distribuídas pelo peso de cada domínio do guia oficial. Os enunciados estão em inglês, como na prova; as explicações estão em português, com link para a documentação.`),
        h('div', { class: 'facts' },
          h('span', { class: 'fact' }, h('b', {}, String(Q.length)), ' questões no banco'),
          h('span', { class: 'fact' }, h('b', {}, '65'), ' na prova, em 2 h'),
          h('span', { class: 'fact' }, h('b', {}, '65%'), ' para passar'),
          h('span', { class: 'fact' }, h('b', {}, '7'), ' formatos'))),
      h('div', { class: 'modes' }, fastPanel, simPanel, p2Panel),
      history,
      progress,
      h('div', { class: 'block' },
        h('h2', {}, 'Distribuição por domínio'),
        h('p', { class: 'note' }, 'O guia oficial não publica percentuais por domínio. A quantidade de questões segue o número de subtópicos de cada domínio no Topics Outline, com reforço em Testes, que aparecem em 3 das 10 questões de exemplo.'),
        h('div', { class: 'dist' }, dist.map(d => h('div', { class: 'drow' },
          h('div', { class: 'dname' }, h('span', { class: 'dnum' }, `D${d.n}`), h('span', {}, d.pt), h('span', { class: 'den' }, d.en)),
          h('div', { class: 'dval' }, `${bankCount(d)} no banco · ${SIM_QUOTA[d.id]} no simulado · ${pct(bankCount(d), Q.length)}%`),
          h('div', { class: 'dbar' }, h('i', { style: `width:${bankCount(d) / maxBank * 100}%` })))))),
      h('div', { class: 'block' },
        h('h2', {}, 'Formatos de questão'),
        h('div', { class: 'formats' }, fmtOrder.filter(t => fmtCounts[t]).map(t => h('div', { class: 'fmt' },
          h('div', { class: 'fmt-h' }, h('span', {}, TYPE_INFO[t].label({ choose: 'N' })), h('span', {}, String(fmtCounts[t]))),
          h('p', {}, TYPE_INFO[t].pt))))),
      PUB ? h('div', { class: 'block' },
        h('h2', {}, 'Sobre este simulado'),
        h('p', { class: 'note' }, 'Projeto independente e gratuito, sem vínculo com a dbt Labs. As questões são autorais, criadas com apoio de IA (Claude) a partir do guia de estudo oficial e da documentação do dbt Core 1.11. Nenhuma reproduz questões da prova.'),
        h('p', { class: 'note' }, 'Pode haver erros. Cada explicação traz o link da documentação: em caso de dúvida, vale o que a documentação diz.'),
        h('p', { class: 'note' }, 'Seu progresso e o histórico de simulados ficam salvos só neste navegador. Nada é enviado para servidor nenhum.')) : null);
    restoreFocus(root, key);
  }

  /* ── results screen ── */
  function renderResults() {
    const key = activeKey();
    const X = cur(), root = $('#screen-results'), past = X === RV;
    const sum = summarize(X), n = sum.n;
    const ok = sum.pct >= PASS_PCT;
    const doms = DOMAINS.filter(d => sum.per[d.id]).map(d => Object.assign({}, d, sum.per[d.id], { pct: pct(sum.per[d.id].c, sum.per[d.id].t) }))
      .sort((a, b) => b.t - a.t || a.n - b.n);
    const weak = doms.filter(d => d.pct < PASS_PCT).sort((a, b) => (b.t * (PASS_PCT - b.pct)) - (a.t * (PASS_PCT - a.pct)));
    const st = {};
    X.ids.forEach(id => { st[id] = outcome(X, id); });
    const wrongIds = X.ids.filter(id => st[id] === 'F' || st[id] === 'S');
    const elapsed = X.finishedAt && X.startedAt ? fmtTime(X.finishedAt - X.startedAt) : null;
    const busy = past && S && !S.finished;   // a redo would replace the simulado in progress
    const redo = () => { RV = null; newSession('study', 'mixed', wrongIds); view = 'quiz'; render(); scrollTop(); };
    const back = () => {
      view = 'start'; render();
      const el = past && document.getElementById('hist');
      if (el) el.scrollIntoView({ block: 'start' }); else scrollTop();
    };
    const filters = [
      { k: 'all', t: 'Todas', c: n },
      { k: 'F', t: sum.fail === 1 ? 'Errada' : 'Erradas', c: sum.fail },
      { k: 'P', t: sum.pass === 1 ? 'Certa' : 'Certas', c: sum.pass },
      sum.skip ? { k: 'S', t: 'Em branco', c: sum.skip } : null,
      sum.unknown ? { k: 'U', t: 'Sem registro', c: sum.unknown } : null
    ].filter(Boolean);
    if (!filters.some(f => f.k === resFilter)) resFilter = 'all';
    const shown = X.ids.map((id, i) => ({ id, i })).filter(x => resFilter === 'all' || st[x.id] === resFilter);
    const mark = { P: '✓', F: '✗', S: '–', U: '?' }, markLabel = { P: 'correta', F: 'incorreta', S: 'em branco', U: 'sem registro' };
    const kindLabel = X.recon ? 'checkpoint reconstruído' : X.kind === 'p2' ? 'prova 2' : X.kind === 'redo' ? 'refazer erradas' : null;

    setChildren(root,
      h('div', { class: 'res-head' },
        h('p', { class: 'eyebrow' }, [past ? 'Histórico' : 'Resultado', fmtDate(X.startedAt || X.finishedAt), kindLabel, `modo ${X.mode === 'exam' ? 'prova' : 'estudo'}`, elapsed].filter(Boolean).join(' · ')),
        h('h1', {}, ok ? 'Acima da nota de corte' : 'Abaixo da nota de corte'),
        h('div', { class: 'res-score' }, h('span', { class: 'res-pct' }, `${sum.pct}%`), h('span', { class: 'verdict ' + (ok ? 'ok' : 'no') }, ok ? `Aprovado (mínimo ${PASS_PCT}%)` : `Reprovado (mínimo ${PASS_PCT}%)`)),
        h('div', { class: 'logline', style: 'border-radius:8px' }, 'Done. ', h('span', { class: 't-pass' }, `PASS=${sum.pass}`), ' ', h('span', { class: 't-fail' }, `FAIL=${sum.fail}`), ' ', h('span', { class: 't-muted' }, `SKIP=${sum.skip}`),
          sum.unknown ? h('span', { class: 't-muted' }, ` NO_RECORD=${sum.unknown}`) : null, ` TOTAL=${n}`),
        X.recon ? h('p', { class: 'reserved' }, h('strong', {}, 'Simulado reconstruído. '),
          'Ele foi feito antes de o histórico existir. O app recuperou quais questões você acertou e errou a partir do seu progresso no banco, mas não as alternativas que você marcou nem o tempo de prova.') : null,
        h('div', { class: 'row' },
          h('button', { type: 'button', class: 'btn btn-primary', 'data-fk': 'res-review', onclick: () => openReview(0) }, 'Revisar questão por questão'),
          wrongIds.length && !busy ? h('button', { type: 'button', class: 'btn', onclick: redo }, `Refazer as ${wrongIds.length} que errei`) : null,
          h('button', { type: 'button', class: 'btn', onclick: back }, past ? 'Voltar ao histórico' : 'Voltar ao início')),
        wrongIds.length && busy ? h('p', { class: 'note' }, 'Para refazer as erradas deste simulado, finalize ou descarte antes o simulado em andamento.') : null),
      h('div', { class: 'block res-dom' },
        h('h2', {}, 'Desempenho por domínio'),
        h('p', { class: 'note' }, 'A linha vertical marca 65%.'),
        h('div', { class: 'dist' }, doms.map(d => h('div', { class: 'drow' },
          h('div', { class: 'dname' }, h('span', { class: 'dnum' }, `D${d.n}`), h('span', {}, d.pt)),
          h('div', { class: 'dval' }, `${d.c}/${d.t} · ${d.pct}%`),
          h('div', { class: 'dbar' }, h('i', { class: d.pct >= PASS_PCT ? 'ok' : 'no', style: `width:${Math.max(d.pct, 2)}%` })))))),
      weak.length ? h('div', { class: 'block' },
        h('h2', {}, 'Onde focar o estudo'),
        h('p', { class: 'note' }, 'Domínios abaixo de 65%, ordenados pelo impacto na nota (peso do domínio × distância até a meta). No fast study, filtre por um desses domínios para praticar.'),
        h('ol', { class: 'focus-list' }, weak.map(d => h('li', {}, h('strong', {}, `D${d.n} · ${d.pt}`), ` (${d.pct}%, ${d.t} questões no simulado)`)))) : null,
      h('div', { class: 'block' },
        h('h2', {}, `Todas as questões (${n})`),
        h('p', { class: 'note' }, X.recon
          ? 'Toque numa questão para ver o enunciado completo, a resposta correta e a explicação.'
          : 'Toque numa questão para ver o enunciado completo, a sua resposta, a correta e a explicação.'),
        h('div', { class: 'qfilter', role: 'group', 'aria-label': 'Filtrar questões' }, filters.map(f => h('button', {
            type: 'button', class: 'fact fact-btn' + (resFilter === f.k ? ' is-on' : ''), 'aria-pressed': String(resFilter === f.k), 'data-fk': 'qf-' + f.k,
            disabled: !f.c && resFilter !== f.k, onclick: () => { resFilter = f.k; renderResults(); } },
          h('b', {}, String(f.c)), ' ' + f.t))),
        h('div', { class: 'qlist' }, shown.map(({ id, i }) => {
          const q = byId[id], o = st[id];
          return h('button', { type: 'button', class: 'qrow', onclick: () => openReview(i) },
            h('span', { class: 'qrow-n' }, String(i + 1)),
            h('span', { class: 'qrow-st st-' + o, role: 'img', 'aria-label': markLabel[o] }, mark[o]),
            h('span', { class: 'qrow-body' },
              h('span', { class: 'qrow-meta' }, `D${DOM[q.d].n} · ${q.topic}`),
              h('span', { class: 'qrow-stem' }, excerpt(q.stem, 150))));
        }))));
    restoreFocus(root, key);
  }

  /* ── router ── */
  function render() {
    if (view === 'start' || view === 'fast') RV = null;
    if ((view === 'quiz' || view === 'results') && !cur()) view = 'start';
    if (view === 'fast' && !F) view = 'start';
    $('#screen-start').hidden = view !== 'start';
    $('#screen-quiz').hidden = view !== 'quiz';
    $('#screen-fast').hidden = view !== 'fast';
    $('#screen-results').hidden = view !== 'results';
    $('#bar').hidden = view !== 'quiz' && view !== 'fast';
    if (view === 'start') renderStart();
    else if (view === 'quiz') renderQuiz();
    else if (view === 'fast') renderFast();
    else renderResults();
  }

  function onKey(e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    const digit = /^[1-8]$/.test(e.key) ? Number(e.key) - 1 : null;
    const pickByKey = ctx => {
      if (ctx.locked || (ctx.q.type !== 'mc' && ctx.q.type !== 'multi')) return;
      const oi = ctx.perm[digit];
      if (oi == null) return;
      if (ctx.q.type === 'mc') ctx.set(oi); else toggleMulti(ctx, oi);
    };
    if (view === 'quiz') {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur().idx + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur().idx - 1); }
      else if (digit !== null) pickByKey(quizCtx());
    } else if (view === 'fast') {
      const cur = fastEntry();
      const fwd = e.key === 'ArrowRight' || (e.key === 'Enter' && tag !== 'BUTTON' && tag !== 'A' && cur.locked);
      if (e.key === 'ArrowLeft' && F.back < F.log.length) { e.preventDefault(); fastGo(F.back + 1); }
      else if (fwd && F.back) { e.preventDefault(); fastGo(F.back - 1); }
      else if (fwd && cur.locked) { e.preventDefault(); fastNext(); }
      else if (digit !== null) pickByKey(fastCtx());
    }
  }

  function start() {
    const p = load(KEY.prefs); if (p) prefs = Object.assign(prefs, p);
    H = load(KEY.hist) || {};
    FS = load(KEY.fastSeen) || {};
    const savedS = load(KEY.sim);
    if (savedS && savedS.v === 1 && Array.isArray(savedS.ids) && savedS.ids.every(id => byId[id])) S = savedS;
    // simulado history: keep the last finished simulado (taken before the history existed) and rebuild the checkpoint if it is gone
    const savedSL = load(KEY.simLog), savedDEL = load(KEY.simDel);
    DEL = Array.isArray(savedDEL) ? savedDEL.filter(x => typeof x === 'string') : [];
    SL = Array.isArray(savedSL) ? savedSL.filter(validRecord) : [];
    if (S && S.finished) { const rec = sessionRecord(S); if (!DEL.includes(rec.id) && !SL.some(r => r.id === rec.id)) SL.push(rec); }
    if (!PUB) reconstructCheckpoint();
    sortSL(); saveSL();
    const savedF = load(KEY.fast);
    if (savedF && savedF.v === 1) {
      F = savedF;
      F.recent = Array.isArray(F.recent) ? F.recent : [];
      F.log = Array.isArray(F.log) ? F.log.filter(x => x && byId[x.id]) : [];
      F.back = Math.max(0, Math.min(F.log.length, F.back | 0));
      // sessions started before the deck-style draw: count what this session already showed
      if (!Object.keys(FS).length) { F.recent.concat(F.id ? [F.id] : []).forEach(id => { if (byId[id]) FS[id] = (FS[id] || 0) + 1; }); saveFS(); }
      const validDomain = F.domain === 'all' || F.domain === 'wrong' || !!DOM[F.domain];
      if (!validDomain) F.domain = 'all';
      if (!byId[F.id] || !validDomain) { drawFast(); saveFast(); }
    }
    if (prefs.fastDomain !== 'all' && prefs.fastDomain !== 'wrong' && !DOM[prefs.fastDomain]) prefs.fastDomain = 'all';
    view = 'start';
    $('#bar-home').addEventListener('click', () => { view = 'start'; confirmDiscard = false; render(); scrollTop(); });
    document.addEventListener('keydown', onKey);
    setInterval(() => { if (S && view === 'quiz') updateTimer(); }, 1000);
    if (!PUB && window.claude && typeof window.claude.use === 'function') syncState = 'syncing';
    render();
    if (!PUB) initSync();
  }

  start();
})();
