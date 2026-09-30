/* Kazoo Cash — finanzas personales.
   Todo se guarda en este dispositivo (localStorage). Sin servidores, sin cuentas. */
'use strict';

// ───────────────────────── Utilidades ─────────────────────────
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const round2 = (n) => Math.round(n * 100) / 100;
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const initial = (s) => (String(s || '?').trim()[0] || '?').toUpperCase();
const sum = (arr, f = (x) => x) => arr.reduce((s, x) => s + f(x), 0);

const pad = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d || 1); };
const today = () => toISO(new Date());
const addDays = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d); };
const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 864e5);
const addMonths = (iso, n, anchor) => {
  const d = parseISO(iso);
  const y = d.getFullYear(), m = d.getMonth() + n;
  const last = new Date(y, m + 1, 0).getDate();
  return toISO(new Date(y, m, Math.min(anchor || d.getDate(), last)));
};
const shiftMonth = (ym, n) => addMonths(ym + '-01', n).slice(0, 7);
const daysInMonth = (ym) => { const [y, m] = ym.split('-').map(Number); return new Date(y, m, 0).getDate(); };

const LOCALE = 'es-MX';
const fDayLong = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
const fShort = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' });
const fShortY = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' });
const fMonth = new Intl.DateTimeFormat(LOCALE, { month: 'long' });
const fMonthShort = new Intl.DateTimeFormat(LOCALE, { month: 'short' });
const fMonthYear = new Intl.DateTimeFormat(LOCALE, { month: 'short', year: 'numeric' });
const clean = (s) => s.replace(/\./g, '');
const monthLabel = (ym) => { const d = parseISO(ym + '-01'); return `${cap(fMonth.format(d))} ${d.getFullYear()}`; };
const shortDate = (iso) => clean(parseISO(iso).getFullYear() === new Date().getFullYear() ? fShort.format(parseISO(iso)) : fShortY.format(parseISO(iso)));
const dayLabel = (iso) => {
  const d = daysBetween(iso, today());
  if (d === 0) return 'Hoy';
  if (d === 1) return 'Ayer';
  if (d === -1) return 'Mañana';
  return cap(fDayLong.format(parseISO(iso)));
};
const relDays = (iso) => {
  const d = daysBetween(today(), iso);
  if (d === 0) return 'Hoy';
  if (d === 1) return 'Mañana';
  if (d < 0) return `Hace ${-d} d`;
  if (d < 7) return `En ${d} días`;
  return shortDate(iso);
};

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

// ───────────────────────── Íconos ─────────────────────────
const ICON = {
  home: '<path d="M3.5 10.2 12 3.5l8.5 6.7V19.5a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z"/>',
  list: '<path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12"/><circle cx="4" cy="6.5" r=".6" fill="currentColor"/><circle cx="4" cy="12" r=".6" fill="currentColor"/><circle cx="4" cy="17.5" r=".6" fill="currentColor"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8" fill="currentColor"/>',
  repeat: '<path d="m17 2.5 3.5 3.5L17 9.5"/><path d="M3.5 11V9.5A3.5 3.5 0 0 1 7 6h13.5"/><path d="M7 21.5 3.5 18 7 14.5"/><path d="M20.5 13v1.5A3.5 3.5 0 0 1 17 18H3.5"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  eyeOff: '<path d="m3.5 3.5 17 17"/><path d="M10.4 5.7A9 9 0 0 1 12 5.5C18 5.5 21.5 12 21.5 12a16 16 0 0 1-2.9 3.7M6.6 6.9C4 8.7 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.3-1.1"/><path d="M10 10a2.8 2.8 0 0 0 4 4"/>',
  left: '<path d="m14.5 18-6-6 6-6"/>',
  right: '<path d="m9.5 18 6-6-6-6"/>',
  x: '<path d="M17.5 6.5l-11 11M6.5 6.5l11 11"/>',
  bell: '<path d="M6 9a6 6 0 1 1 12 0c0 6.5 2.5 8.5 2.5 8.5h-17S6 15.5 6 9"/><path d="M10.3 20.5a1.9 1.9 0 0 0 3.4 0"/>',
  calendar: '<rect x="3.5" y="4.5" width="17" height="16" rx="2.5"/><path d="M16 2.5v4M8 2.5v4M3.5 10h17"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20.5 20.5-4.8-4.8"/>',
  swap: '<path d="M7 20V5M3.5 8.5 7 5l3.5 3.5M17 4v15M13.5 15.5 17 19l3.5-3.5"/>',
  back: '<path d="M20.5 5.5H9.5l-6 6.5 6 6.5h11a1 1 0 0 0 1-1v-11a1 1 0 0 0-1-1z"/><path d="m16 9.5-5 5M11 9.5l5 5"/>',
  share: '<path d="M12 3.5v11M8 7.5l4-4 4 4"/><path d="M7 11H6a1.5 1.5 0 0 0-1.5 1.5v7A1.5 1.5 0 0 0 6 21h12a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 18 11h-1"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
};
const icon = (n, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;

// ───────────────────────── Datos ─────────────────────────
const KEY = 'kazoo.cash.v1';
const PALETTE = ['#D4BE8A', '#7CCFA6', '#8FB3E8', '#E8837E', '#B89BE0', '#E3B55F', '#6FC7C9', '#E39BC0', '#9CC47A', '#E0A07A', '#A3A3AA'];
const ACCOUNT_TYPES = { debito: 'Débito', credito: 'Tarjeta de crédito', efectivo: 'Efectivo', ahorro: 'Ahorro', inversion: 'Inversión' };
const CYCLES = [['1w', 'Semanal'], ['2w', 'Cada 2 semanas'], ['1m', 'Mensual'], ['2m', 'Bimestral'], ['3m', 'Trimestral'], ['6m', 'Semestral'], ['1y', 'Anual']];
const REMIND = [[0, 'El mismo día'], [1, '1 día antes'], [2, '2 días antes'], [3, '3 días antes'], [5, '5 días antes'], [7, '1 semana antes']];
const CURRENCIES = [['MXN', 'Peso mexicano'], ['USD', 'Dólar'], ['EUR', 'Euro'], ['COP', 'Peso colombiano'], ['ARS', 'Peso argentino'], ['CLP', 'Peso chileno'], ['PEN', 'Sol peruano'], ['GTQ', 'Quetzal'], ['DOP', 'Peso dominicano'], ['GBP', 'Libra esterlina']];
const cycleLabel = (c) => (CYCLES.find((x) => x[0] === c) || [0, c])[1];

function seed() {
  const c = (id, name, kind, color) => ({ id, name, kind, color, budget: 0 });
  return {
    v: 1,
    settings: { currency: 'MXN', hideAmounts: false, notify: false, autoCharge: true, remindDays: 3, pinHash: null, installDismissed: false, lastBackup: null, lastAccount: null },
    accounts: [
      { id: 'a-main', name: 'Cuenta principal', type: 'debito', initial: 0 },
      { id: 'a-cash', name: 'Efectivo', type: 'efectivo', initial: 0 },
    ],
    categories: [
      c('c-food', 'Comida', 'expense', PALETTE[9]), c('c-market', 'Súper', 'expense', PALETTE[8]),
      c('c-transport', 'Transporte', 'expense', PALETTE[2]), c('c-home', 'Hogar', 'expense', PALETTE[0]),
      c('c-bills', 'Servicios', 'expense', PALETTE[6]), c('c-health', 'Salud', 'expense', PALETTE[1]),
      c('c-fun', 'Entretenimiento', 'expense', PALETTE[4]), c('c-shop', 'Compras', 'expense', PALETTE[7]),
      c('c-edu', 'Educación', 'expense', PALETTE[5]), c('c-subs', 'Suscripciones', 'expense', PALETTE[3]),
      c('c-other', 'Otros', 'expense', PALETTE[10]),
      c('c-salary', 'Sueldo', 'income', PALETTE[1]), c('c-free', 'Freelance', 'income', PALETTE[2]),
      c('c-invest', 'Inversiones', 'income', PALETTE[0]), c('c-gift', 'Regalos', 'income', PALETTE[7]),
      c('c-inc-other', 'Otros ingresos', 'income', PALETTE[10]),
    ],
    transactions: [],
    goals: [],
    subscriptions: [],
    notified: {},
  };
}

function migrate(s) {
  const base = seed();
  s.settings = { ...base.settings, ...(s.settings || {}) };
  for (const k of ['accounts', 'categories', 'transactions', 'goals', 'subscriptions']) if (!Array.isArray(s[k])) s[k] = base[k];
  if (!s.notified || typeof s.notified !== 'object') s.notified = {};
  s.goals.forEach((g) => { if (!Array.isArray(g.history)) g.history = []; });
  return s;
}

function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) return migrate(JSON.parse(raw)); } catch (e) { console.error(e); }
  return seed();
}
let state = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch { toast('No se pudo guardar. Exporta un respaldo.'); }
}

const ui = { tab: 'home', month: today().slice(0, 7), query: '', filter: 'all', showArchived: false, day: today() };
try { ui.tab = sessionStorage.getItem('kazoo.tab') || 'home'; } catch {}

// ───────────────────────── Dinero ─────────────────────────
let _nf, _nfKey;
function nf() {
  const c = state.settings.currency;
  if (_nfKey !== c) {
    try { _nf = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: c, currencyDisplay: 'narrowSymbol' }); }
    catch { _nf = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: c }); }
    _nfKey = c;
  }
  return _nf;
}
const HIDDEN = '••••';
const hidden = () => state.settings.hideAmounts;
const money = (n) => (n < 0 ? '−' : '') + nf().format(Math.abs(n || 0));
const fmt = (n, sign) => {
  if (hidden()) return HIDDEN;
  const s = nf().format(Math.abs(n || 0));
  if (sign === '+') return '+' + s;
  if (sign === '-') return '−' + s;
  return (n < -0.004 ? '−' : '') + s;
};
function fmtHero(n) {
  if (hidden()) return '<span class="masked">••••••</span>';
  let main = n < -0.004 ? '−' : '', tail = '', dec = false;
  for (const p of nf().formatToParts(Math.abs(n))) { if (p.type === 'decimal') dec = true; if (dec) tail += p.value; else main += p.value; }
  return `${esc(main)}<span class="cents">${esc(tail)}</span>`;
}
const curSymbol = () => (nf().formatToParts(0).find((p) => p.type === 'currency') || {}).value || '$';
const pct = (x) => `${Math.round(x * 100)}%`;
function parseAmount(v) {
  v = String(v ?? '').trim().replace(/[^\d.,-]/g, '');
  if (v.includes(',') && !v.includes('.') && /,\d{1,2}$/.test(v)) v = v.replace(',', '.');
  v = v.replace(/,/g, '');
  const n = parseFloat(v);
  return Number.isFinite(n) ? round2(n) : NaN;
}

// ───────────────────────── Cálculos ─────────────────────────
const byId = (arr, id) => arr.find((x) => x.id === id);
const cat = (id) => byId(state.categories, id);
const acc = (id) => byId(state.accounts, id);
const catName = (id) => cat(id)?.name || 'Sin categoría';
const catColor = (id) => cat(id)?.color || PALETTE[10];

function balances() {
  const m = Object.fromEntries(state.accounts.map((a) => [a.id, +a.initial || 0]));
  for (const t of state.transactions) {
    if (t.type === 'income') m[t.accountId] = (m[t.accountId] || 0) + t.amount;
    else if (t.type === 'expense') m[t.accountId] = (m[t.accountId] || 0) - t.amount;
    else if (t.type === 'transfer') {
      m[t.accountId] = (m[t.accountId] || 0) - t.amount;
      m[t.toAccountId] = (m[t.toAccountId] || 0) + t.amount;
    }
  }
  return m;
}
const netWorth = (b = balances()) => round2(sum(state.accounts, (a) => b[a.id] || 0));
const goalSaved = (g) => round2(sum(g.history, (h) => h.amount));
const reserved = () => round2(sum(state.goals.filter((g) => !g.archived), (g) => Math.max(0, goalSaved(g))));

function monthTotals(ym, uptoDay) {
  let income = 0, expense = 0;
  for (const t of state.transactions) {
    if (t.date.slice(0, 7) !== ym) continue;
    if (uptoDay && +t.date.slice(8) > uptoDay) continue;
    if (t.type === 'income') income += t.amount;
    else if (t.type === 'expense') expense += t.amount;
  }
  return { income: round2(income), expense: round2(expense), net: round2(income - expense) };
}
function spentByCat(ym) {
  const m = {};
  for (const t of state.transactions) if (t.type === 'expense' && t.date.slice(0, 7) === ym) m[t.categoryId || ''] = (m[t.categoryId || ''] || 0) + t.amount;
  return m;
}
function avgMonthly(key) {
  const cur = today().slice(0, 7);
  const vals = [1, 2, 3].map((i) => monthTotals(shiftMonth(cur, -i))[key]).filter((v) => v > 0);
  if (vals.length) return sum(vals) / vals.length;
  return monthTotals(cur)[key];
}

// Suscripciones
const cycleParts = (c) => ({ n: parseInt(c, 10) || 1, u: String(c).slice(-1) });
function advanceSub(s) {
  const { n, u } = cycleParts(s.cycle);
  s.next = u === 'w' ? addDays(s.next, 7 * n) : addMonths(s.next, u === 'y' ? 12 * n : n, s.anchorDay);
}
function subMonthly(s) {
  const { n, u } = cycleParts(s.cycle);
  if (u === 'w') return (s.amount * 52) / 12 / n;
  if (u === 'y') return s.amount / (12 * n);
  return s.amount / n;
}
function chargeSub(s, date = s.next) {
  state.transactions.push({ id: uid(), type: 'expense', amount: s.amount, date, categoryId: s.categoryId, accountId: s.accountId, note: s.name, subId: s.id, created: Date.now() });
  advanceSub(s);
}
function processDueSubs() {
  if (!state.settings.autoCharge) return 0;
  const t = today();
  let n = 0;
  for (const s of state.subscriptions) {
    if (!s.active || !s.next || !acc(s.accountId)) continue;
    let guard = 0;
    while (s.next <= t && guard++ < 120) { chargeSub(s); n++; }
  }
  if (n) save();
  return n;
}
const activeSubs = () => state.subscriptions.filter((s) => s.active).sort((a, b) => a.next.localeCompare(b.next));

// Metas
function goalPlan(g) {
  const saved = goalSaved(g), rem = Math.max(0, round2(g.target - saved));
  const out = { saved, rem, p: g.target > 0 ? clamp(saved / g.target, 0, 1) : 0, done: g.target > 0 && rem <= 0 };
  if (g.deadline && !out.done) {
    out.daysLeft = daysBetween(today(), g.deadline);
    if (out.daysLeft > 0) out.monthly = rem / Math.max(1, out.daysLeft / 30.44);
  }
  const since = addDays(today(), -90);
  const recent = sum(g.history.filter((h) => h.date >= since), (h) => h.amount);
  const span = clamp(daysBetween(g.created || today(), today()), 30, 90);
  const pace = recent / (span / 30.44);
  if (pace > 0 && !out.done) { out.pace = pace; out.eta = addDays(today(), Math.ceil((rem / pace) * 30.44)); }
  return out;
}

// ───────────────────────── Componentes ─────────────────────────
function ring(p, color, size = 52, stroke = 4) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, h = size / 2;
  const off = c * (1 - clamp(p, 0, 1));
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle cx="${h}" cy="${h}" r="${r}" fill="none" stroke="var(--track)" stroke-width="${stroke}"/>
    <circle cx="${h}" cy="${h}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
      stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}" transform="rotate(-90 ${h} ${h})"${p <= 0 ? ' opacity="0"' : ''}/></svg>`;
}
const bar = (p, color, cls = '') => `<div class="bar ${cls}"><i style="width:${(clamp(p, 0, 1) * 100).toFixed(1)}%;--c:${color}"></i></div>`;
const opts = (list, sel) => list.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(sel) ? 'selected' : ''}>${esc(l)}</option>`).join('');
const swatches = (name, sel) => `<div class="swatches">${PALETTE.map((c) => `<label class="swatch"><input type="radio" name="${name}" value="${c}" ${c === sel ? 'checked' : ''}><span style="--c:${c}"></span></label>`).join('')}</div>`;
const sw = (setting, on, label) => `<label class="switch" aria-label="${esc(label)}"><input type="checkbox" data-setting="${setting}" ${on ? 'checked' : ''}><span></span></label>`;

function txRow(t) {
  const isT = t.type === 'transfer';
  const c = isT ? 'var(--muted)' : catColor(t.categoryId);
  const title = t.note || (isT ? 'Transferencia' : catName(t.categoryId));
  const sub = isT ? `${acc(t.accountId)?.name || '—'} → ${acc(t.toAccountId)?.name || '—'}` : `${t.note ? catName(t.categoryId) + ' · ' : ''}${acc(t.accountId)?.name || '—'}${t.subId ? ' · Recurrente' : ''}`;
  const amt = t.type === 'income' ? `<span class="row-amt pos">${fmt(t.amount, '+')}</span>` : t.type === 'expense' ? `<span class="row-amt">${fmt(t.amount, '-')}</span>` : `<span class="row-amt muted">${fmt(t.amount)}</span>`;
  return `<button class="row" data-action="edit-tx" data-id="${t.id}">
    <span class="mono" style="--c:${c}">${isT ? icon('swap') : esc(initial(catName(t.categoryId)))}</span>
    <span class="row-main"><span class="row-title">${esc(title)}</span><span class="row-sub">${esc(sub)}</span></span>
    ${amt}</button>`;
}

function subRow(s) {
  const d = daysBetween(today(), s.next);
  const soon = s.active && d <= (s.remind ?? state.settings.remindDays);
  return `<button class="row ${s.active ? '' : 'dim'}" data-action="edit-sub" data-id="${s.id}">
    <span class="mono" style="--c:${s.color}">${esc(initial(s.name))}</span>
    <span class="row-main"><span class="row-title">${esc(s.name)}</span><span class="row-sub">${esc(cycleLabel(s.cycle))}${acc(s.accountId) ? ' · ' + esc(acc(s.accountId).name) : ''}</span></span>
    <span class="row-end"><span class="row-amt">${fmt(s.amount)}</span><span class="pill ${soon ? 'soon' : ''}">${s.active ? relDays(s.next) : 'En pausa'}</span></span></button>`;
}

function goalCard(g) {
  const p = goalPlan(g);
  let sub;
  if (p.done) sub = '<span class="pos">Meta cumplida</span>';
  else if (g.deadline && p.daysLeft <= 0) sub = `<span class="neg">Fecha vencida · faltan ${fmt(p.rem)}</span>`;
  else if (p.monthly) sub = `${fmt(p.monthly)}/mes hasta ${clean(fMonthYear.format(parseISO(g.deadline)))}`;
  else if (p.eta) sub = `A este ritmo: ${clean(fMonthYear.format(parseISO(p.eta)))}`;
  else sub = `Faltan ${fmt(p.rem)}`;
  return `<button class="goal-card" data-action="goal" data-id="${g.id}">
    <span class="ring-wrap">${ring(p.p, g.color, 54, 4)}<span>${Math.floor(p.p * 100)}%</span></span>
    <span class="goal-main"><b>${esc(g.name)}</b>
      <div class="goal-amt">${fmt(p.saved)} <span>/ ${fmt(g.target)}</span></div>
      <div class="goal-sub">${sub}</div></span></button>`;
}

// ───────────────────────── Vistas ─────────────────────────
const TABS = [['home', 'Inicio', 'home'], ['tx', 'Movimientos', 'list'], ['goals', 'Metas', 'target'], ['subs', 'Suscripciones', 'repeat'], ['settings', 'Ajustes', 'sliders']];

function viewHome() {
  const ym = today().slice(0, 7);
  const b = balances(), nw = netWorth(b), res = reserved();
  const mt = monthTotals(ym);
  const rate = mt.income > 0 ? mt.net / mt.income : null;
  const fresh = !state.transactions.length && state.accounts.every((a) => !+a.initial) && !state.goals.length && !state.subscriptions.length;

  const body = `
    ${installHint()}
    <section class="hero">
      <p class="eyebrow">Patrimonio</p>
      <p class="hero-amount" data-action="toggle-hide">${fmtHero(nw)}</p>
      <div class="hero-sub"><span>Disponible <b>${fmt(nw - res)}</b></span><span class="sep-dot"></span><span>En metas <b>${fmt(res)}</b></span></div>
    </section>
    <section class="stats">
      <div class="stat"><p>Ingresos</p><b class="pos">${fmt(mt.income)}</b></div>
      <div class="stat"><p>Gastos</p><b>${fmt(mt.expense)}</b></div>
      <div class="stat"><p>Ahorro</p><b class="${rate != null && rate < 0 ? 'neg' : ''}">${rate == null ? '—' : pct(rate)}</b></div>
    </section>
    ${fresh ? homeStart() : ''}
    ${homeUpcoming()}
    ${homeBudget(ym)}
    ${homeGoals()}
    ${homeCategories(ym, mt.expense)}
    ${homeTrend(ym)}
    ${homeInsights(ym, nw - res)}`;
  return {
    sub: cap(fDayLong.format(new Date())),
    title: 'Resumen',
    actions: `<button class="icon-btn" data-action="toggle-hide" aria-label="${hidden() ? 'Mostrar montos' : 'Ocultar montos'}">${icon(hidden() ? 'eyeOff' : 'eye')}</button>`,
    body,
  };
}

function installHint() {
  if (!isIOS() || isStandalone() || state.settings.installDismissed) return '';
  return `<div class="card hint-card"><div><b>Instala Kazoo en tu iPhone</b>
    <p>Toca ${icon('share', 'inline')} Compartir y elige “Agregar a inicio”. Se abrirá como app, sin conexión y con avisos.</p></div>
    <button class="icon-btn" data-action="dismiss-install" aria-label="Cerrar">${icon('x')}</button></div>`;
}

function homeStart() {
  const step = (action, title, sub, n) => `<button class="row" data-action="${action}"><span class="mono" style="--c:var(--accent)">${n}</span><span class="row-main"><span class="row-title">${title}</span><span class="row-sub">${sub}</span></span>${icon('right', 'muted')}</button>`;
  return `<div class="card"><div class="card-head"><h3>Primeros pasos</h3></div>
    ${step('accounts', 'Configura tus cuentas', 'Nombre y saldo actual de cada una', 1)}
    ${step('new-tx', 'Registra un movimiento', 'Un gasto o un ingreso', 2)}
    ${step('new-goal', 'Crea una meta de ahorro', 'Viaje, fondo de emergencia, auto…', 3)}
    ${step('new-sub', 'Agrega tus suscripciones', 'Te avisamos antes de cada cobro', 4)}</div>`;
}

function homeUpcoming() {
  if (!state.subscriptions.length) return '';
  const list = activeSubs().filter((s) => daysBetween(today(), s.next) <= 14).slice(0, 4);
  const monthly = sum(activeSubs(), subMonthly);
  return `<div class="card"><div class="card-head"><h3>Próximos cobros</h3><button class="link" data-action="tab" data-tab="subs">Ver todo</button></div>
    ${list.length ? list.map(subRow).join('') : '<p class="lead">Nada se cobra en los próximos 14 días.</p>'}
    <p class="card-note">Suscripciones: ${fmt(monthly)} al mes · ${fmt(monthly * 12)} al año</p></div>`;
}

function homeBudget(ym) {
  const cats = state.categories.filter((c) => c.kind === 'expense' && c.budget > 0);
  if (!cats.length) {
    if (!state.transactions.length) return '';
    return `<div class="card"><div class="card-head"><h3>Presupuesto</h3></div>
      <p class="lead">Define un límite mensual por categoría y sabrás cuánto puedes gastar al día.</p>
      <div style="margin-top:14px"><button class="btn secondary small" data-action="budgets">Definir presupuestos</button></div></div>`;
  }
  const spent = spentByCat(ym);
  const total = sum(cats, (c) => c.budget), used = sum(cats, (c) => spent[c.id] || 0);
  const remaining = total - used;
  const left = daysInMonth(ym) - new Date().getDate() + 1;
  const p = total ? used / total : 0;
  const color = p > 1 ? 'var(--neg)' : p > 0.85 ? 'var(--warn)' : 'var(--text)';
  const rows = cats.map((c) => ({ c, s: spent[c.id] || 0, p: (spent[c.id] || 0) / c.budget })).sort((a, b) => b.p - a.p).slice(0, 4);
  return `<div class="card"><div class="card-head"><h3>Presupuesto del mes</h3><button class="link" data-action="budgets">Editar</button></div>
    <p class="card-big ${remaining < 0 ? 'neg' : ''}">${fmt(remaining)}</p>
    <p class="card-note" style="margin:2px 0 12px">${remaining >= 0 ? `disponibles de ${fmt(total)} · ~${fmt(remaining / left)} al día por ${left} día${left > 1 ? 's' : ''}` : `te pasaste del presupuesto de ${fmt(total)}`}</p>
    ${bar(p, color)}
    <div style="margin-top:18px">${rows.map(({ c, s, p }) => `<div class="meter"><div class="meter-top"><span><i class="dot" style="--c:${c.color}"></i>${esc(c.name)}</span><span class="${p > 1 ? 'neg' : ''}">${fmt(s)} / ${fmt(c.budget)}</span></div>${bar(p, p > 1 ? 'var(--neg)' : p > 0.85 ? 'var(--warn)' : c.color, 'thin')}</div>`).join('')}</div></div>`;
}

function homeGoals() {
  const goals = state.goals.filter((g) => !g.archived);
  if (!goals.length) return '';
  const top = goals.map((g) => ({ g, p: goalPlan(g) })).sort((a, b) => a.p.done - b.p.done || b.p.p - a.p.p).slice(0, 3);
  return `<div class="card"><div class="card-head"><h3>Metas</h3><button class="link" data-action="tab" data-tab="goals">Ver todas</button></div>
    ${top.map(({ g, p }) => `<div class="meter" data-action="goal" data-id="${g.id}" style="cursor:pointer"><div class="meter-top"><span><i class="dot" style="--c:${g.color}"></i>${esc(g.name)}</span><span>${fmt(p.saved)} · ${Math.floor(p.p * 100)}%</span></div>${bar(p.p, g.color, 'thin')}</div>`).join('')}</div>`;
}

function homeCategories(ym, total) {
  if (!total) return '';
  const spent = Object.entries(spentByCat(ym)).sort((a, b) => b[1] - a[1]);
  const top = spent.slice(0, 5);
  const rest = sum(spent.slice(5), (x) => x[1]);
  const max = top[0][1];
  const rows = top.map(([id, v]) => ({ name: catName(id), color: catColor(id), v }));
  if (rest > 0) rows.push({ name: 'Resto', color: PALETTE[10], v: rest });
  return `<div class="card"><div class="card-head"><h3>Gasto por categoría</h3><button class="link" data-action="tab" data-tab="tx">Detalle</button></div>
    ${rows.map((r) => `<div class="meter"><div class="meter-top"><span><i class="dot" style="--c:${r.color}"></i>${esc(r.name)}</span><span>${fmt(r.v)} · ${pct(r.v / total)}</span></div>${bar(r.v / max, r.color, 'thin')}</div>`).join('')}</div>`;
}

function homeTrend(ym) {
  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(ym, i - 5));
  const data = months.map((m) => monthTotals(m));
  if (data.filter((d) => d.income || d.expense).length < 2) return '';
  const max = Math.max(...data.flatMap((d) => [d.income, d.expense]));
  const W = 320, H = 132, ch = 100, gw = W / 6, bw = 11;
  const h = (v) => (v > 0 ? Math.max(2, (v / max) * ch) : 0);
  const bars = data.map((d, i) => {
    const x = i * gw + gw / 2;
    const cur = i === 5;
    return `<rect x="${x - bw - 1.5}" y="${ch - h(d.income)}" width="${bw}" height="${h(d.income)}" rx="2.5" fill="var(--pos)" opacity="${cur ? 1 : 0.55}"/>
      <rect x="${x + 1.5}" y="${ch - h(d.expense)}" width="${bw}" height="${h(d.expense)}" rx="2.5" fill="var(--text)" opacity="${cur ? 0.95 : 0.4}"/>
      <text x="${x}" y="${H - 12}" text-anchor="middle"${cur ? ' style="fill:var(--text)"' : ''}>${esc(cap(clean(fMonthShort.format(parseISO(months[i] + '-01')))))}</text>`;
  }).join('');
  return `<div class="card"><div class="card-head"><h3>Últimos 6 meses</h3><div class="legend"><span><i class="dot" style="--c:var(--pos)"></i>Ingresos</span><span><i class="dot" style="--c:var(--text)"></i>Gastos</span></div></div>
    <svg class="chart" viewBox="0 0 ${W} ${H - 4}" role="img" aria-label="Ingresos y gastos de los últimos seis meses">
      <line x1="0" x2="${W}" y1="${ch + 0.5}" y2="${ch + 0.5}" stroke="var(--line)"/>${bars}</svg></div>`;
}

function homeInsights(ym, available) {
  const items = [];
  const avgExp = avgMonthly('expense'), avgInc = avgMonthly('income');
  if (avgExp > 0) {
    const m = available / avgExp;
    items.push(['Fondo de emergencia', `${m < 0 ? 0 : m.toFixed(1)} meses`, 'de gastos cubiertos con tu saldo disponible', m >= 6 ? 'pos' : m < 3 ? 'warn' : '']);
  }
  const day = new Date().getDate();
  const now = monthTotals(ym, day).expense, prev = monthTotals(shiftMonth(ym, -1), day).expense;
  if (prev > 0 && now > 0) {
    const d = (now - prev) / prev;
    items.push(['Contra el mes pasado', `${d > 0 ? '+' : '−'}${pct(Math.abs(d))}`, `de gasto a la misma fecha (${fmt(prev)} el mes pasado)`, d > 0.1 ? 'warn' : d < 0 ? 'pos' : '']);
  }
  const subs = sum(activeSubs(), subMonthly);
  if (subs > 0 && avgInc > 0) items.push(['Peso de suscripciones', pct(subs / avgInc), 'de tus ingresos mensuales promedio', subs / avgInc > 0.15 ? 'warn' : '']);
  if (avgInc > 0) {
    const r = (avgInc - avgExp) / avgInc;
    items.push(['Tasa de ahorro promedio', pct(r), 'de lo que ganas, últimos meses', r >= 0.2 ? 'pos' : r < 0 ? 'neg' : '']);
  }
  if (!items.length) return '';
  return `<div class="card"><div class="card-head"><h3>Indicadores</h3></div>
    ${items.map(([t, v, n, cls]) => `<div class="row plain" style="--sep:0px"><span class="row-main"><span class="row-title">${t}</span><span class="row-sub">${esc(n)}</span></span><span class="row-amt ${cls}">${v}</span></div>`).join('')}</div>`;
}

function viewTx() {
  const ym = ui.month;
  const mt = monthTotals(ym);
  const filters = [['all', 'Todo'], ['expense', 'Gastos'], ['income', 'Ingresos'], ['transfer', 'Transf.']];
  return {
    title: 'Movimientos',
    body: `
      <div class="month-nav">
        <button class="icon-btn" data-action="month" data-d="-1" aria-label="Mes anterior">${icon('left')}</button>
        <h2>${monthLabel(ym)}</h2>
        <button class="icon-btn" data-action="month" data-d="1" aria-label="Mes siguiente">${icon('right')}</button>
      </div>
      <section class="stats">
        <div class="stat"><p>Entradas</p><b class="pos">${fmt(mt.income)}</b></div>
        <div class="stat"><p>Salidas</p><b>${fmt(mt.expense)}</b></div>
        <div class="stat"><p>Balance</p><b class="${mt.net < 0 ? 'neg' : ''}">${fmt(mt.net)}</b></div>
      </section>
      <div class="search">${icon('search')}<input id="q" type="search" placeholder="Buscar" value="${esc(ui.query)}" autocomplete="off" enterkeyhint="search"></div>
      <div class="seg sm">${filters.map(([v, l]) => `<button class="${ui.filter === v ? 'on' : ''}" data-action="tx-filter" data-v="${v}">${l}</button>`).join('')}</div>
      <div id="tx-list">${txList()}</div>`,
    mount() {
      $('#q').addEventListener('input', (e) => { ui.query = e.target.value; $('#tx-list').innerHTML = txList(); });
    },
  };
}

function txList() {
  let list = state.transactions.filter((t) => t.date.slice(0, 7) === ui.month);
  if (ui.filter !== 'all') list = list.filter((t) => t.type === ui.filter);
  if (ui.query.trim()) {
    const q = norm(ui.query.trim());
    list = list.filter((t) => norm([t.note, catName(t.categoryId), acc(t.accountId)?.name, acc(t.toAccountId)?.name, t.amount].join(' ')).includes(q));
  }
  if (!list.length) {
    return ui.query || ui.filter !== 'all'
      ? '<div class="empty"><p>Sin resultados.</p></div>'
      : `<div class="empty"><h3>Sin movimientos</h3><p>Registra tus gastos e ingresos de ${esc(monthLabel(ui.month).toLowerCase())} con el botón +.</p></div>`;
  }
  list.sort((a, b) => b.date.localeCompare(a.date) || (b.created || 0) - (a.created || 0));
  const groups = new Map();
  for (const t of list) { if (!groups.has(t.date)) groups.set(t.date, []); groups.get(t.date).push(t); }
  return [...groups].map(([d, items]) => {
    const net = sum(items, (t) => (t.type === 'income' ? t.amount : t.type === 'expense' ? -t.amount : 0));
    return `<div class="group-h"><span>${esc(dayLabel(d))}</span><span>${net ? fmt(net) : ''}</span></div><div class="list">${items.map(txRow).join('')}</div>`;
  }).join('');
}

function viewGoals() {
  const active = state.goals.filter((g) => !g.archived);
  const archived = state.goals.filter((g) => g.archived);
  const saved = sum(active, goalSaved), target = sum(active, (g) => g.target);
  let body;
  if (!state.goals.length) {
    body = `<div class="empty"><h3>Ahorra con intención</h3><p>Crea metas —un viaje, tu fondo de emergencia, un auto— y mira cómo avanza tu progreso.</p><button class="btn primary" data-action="new-goal">Crear meta</button></div>`;
  } else {
    body = `
      <section class="hero" style="padding-bottom:14px">
        <p class="eyebrow">Ahorrado en metas</p>
        <p class="hero-amount">${fmtHero(saved)}</p>
        <div class="hero-sub"><span>de <b>${fmt(target)}</b></span><span class="sep-dot"></span><span>${target ? pct(clamp(saved / target, 0, 1)) : '0%'} completado</span></div>
        <div style="margin-top:16px">${bar(target ? saved / target : 0, 'var(--accent)')}</div>
      </section>
      ${active.map(goalCard).join('')}
      ${archived.length ? `<p class="section-h" data-action="toggle-archived" style="cursor:pointer">Archivadas <span class="link">${ui.showArchived ? 'Ocultar' : `Mostrar (${archived.length})`}</span></p>${ui.showArchived ? archived.map(goalCard).join('') : ''}` : ''}
      <p class="foot">El dinero en metas se aparta de tu saldo disponible.</p>`;
  }
  return { title: 'Metas', body };
}

function viewSubs() {
  const subs = [...activeSubs(), ...state.subscriptions.filter((s) => !s.active)];
  const monthly = sum(activeSubs(), subMonthly);
  const st = notifStatus();
  const needsNotif = state.subscriptions.length && !(st === 'granted' && state.settings.notify);
  let body;
  if (!subs.length) {
    body = `<div class="empty"><h3>Pagos recurrentes</h3><p>Streaming, gimnasio, renta, telefonía… Agrégalos y te avisamos antes de cada cobro.</p><button class="btn primary" data-action="new-sub">Agregar suscripción</button></div>`;
  } else {
    body = `
      <section class="hero" style="padding-bottom:14px">
        <p class="eyebrow">Gasto recurrente</p>
        <p class="hero-amount">${fmtHero(monthly)}<span class="cents"> /mes</span></p>
        <div class="hero-sub"><span><b>${fmt(monthly * 12)}</b> al año</span><span class="sep-dot"></span><span>${activeSubs().length} activa${activeSubs().length === 1 ? '' : 's'}</span></div>
      </section>
      ${needsNotif ? `<div class="card hint-card"><div><b>Activa los avisos</b><p>${st === 'install' ? 'En iPhone los avisos funcionan cuando la app está agregada a tu pantalla de inicio.' : st === 'denied' ? 'Las notificaciones están bloqueadas. Actívalas en Configuración › Notificaciones › Kazoo.' : 'Recibe una notificación antes de cada cobro.'}</p>
        ${st === 'default' || (st === 'granted' && !state.settings.notify) ? `<div style="margin-top:12px"><button class="btn secondary small" data-action="notify-enable">Activar avisos</button></div>` : ''}</div></div>` : ''}
      <p class="section-h">Por fecha de cobro</p>
      <div class="list">${subs.map(subRow).join('')}</div>`;
  }
  return {
    title: 'Suscripciones',
    actions: state.subscriptions.length ? `<button class="icon-btn" data-action="ics" aria-label="Agregar al calendario">${icon('calendar')}</button>` : '',
    body,
  };
}

function notifStatus() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return isIOS() && !isStandalone() ? 'install' : 'unsupported';
  return Notification.permission; // granted | denied | default
}

function viewSettings() {
  const s = state.settings;
  const st = notifStatus();
  const notifLabel = { granted: s.notify ? 'Activados' : 'Desactivados', denied: 'Bloqueados', default: 'Sin permiso', install: 'Instala la app', unsupported: 'No disponible' }[st];
  const b = balances();
  const nav = (action, title, val) => `<button class="row plain" data-action="${action}"><span class="row-main"><span class="row-title">${title}</span></span><span class="row-val">${val ?? ''}${icon('right')}</span></button>`;
  const backup = s.lastBackup ? `Último: ${shortDate(s.lastBackup)}` : 'Nunca';
  return {
    title: 'Ajustes',
    body: `
      <p class="section-h">Finanzas</p>
      <div class="list">
        ${nav('accounts', 'Cuentas', `${state.accounts.length} · ${fmt(netWorth(b))}`)}
        ${nav('budgets', 'Presupuestos', `${state.categories.filter((c) => c.budget > 0).length} activos`)}
        ${nav('categories', 'Categorías', state.categories.length)}
      </div>
      <p class="section-h">Preferencias</p>
      <div class="list">
        <label class="row plain"><span class="row-main"><span class="row-title">Moneda</span></span><select class="inline" data-setting="currency">${opts(CURRENCIES.map(([c, n]) => [c, `${n} (${c})`]), s.currency)}</select></label>
        <div class="row plain"><span class="row-main"><span class="row-title">Ocultar montos</span><span class="row-sub">Para ver la app en público</span></span>${sw('hideAmounts', s.hideAmounts, 'Ocultar montos')}</div>
        <div class="row plain"><span class="row-main"><span class="row-title">Registrar cobros automáticamente</span><span class="row-sub">Las suscripciones se anotan como gasto al llegar su fecha</span></span>${sw('autoCharge', s.autoCharge, 'Registrar cobros')}</div>
      </div>
      <p class="section-h">Avisos</p>
      <div class="list">
        ${st === 'granted'
          ? `<div class="row plain"><span class="row-main"><span class="row-title">Notificaciones de cobro</span><span class="row-sub">${notifLabel}</span></span>${sw('notify', s.notify, 'Notificaciones')}</div>`
          : `<button class="row plain" data-action="notify-enable"><span class="row-main"><span class="row-title">Notificaciones de cobro</span><span class="row-sub">${notifLabel}</span></span><span class="row-val">${st === 'default' ? 'Activar' : ''}${icon('right')}</span></button>`}
        <label class="row plain"><span class="row-main"><span class="row-title">Anticipación</span><span class="row-sub">Predeterminada para nuevas suscripciones</span></span><select class="inline" data-setting="remindDays">${opts(REMIND, s.remindDays)}</select></label>
        <button class="row plain" data-action="ics"><span class="row-main"><span class="row-title">Agregar cobros al Calendario</span><span class="row-sub">Recordatorios garantizados aunque la app esté cerrada</span></span><span class="row-val">${icon('right')}</span></button>
        ${st === 'granted' && s.notify ? `<button class="row plain" data-action="notify-test"><span class="row-main"><span class="row-title">Enviar aviso de prueba</span></span><span class="row-val">${icon('right')}</span></button>` : ''}
      </div>
      <p class="section-h">Seguridad</p>
      <div class="list">
        <button class="row plain" data-action="pin"><span class="row-main"><span class="row-title">Código de acceso</span><span class="row-sub">Pide un código de 4 dígitos al abrir</span></span><span class="row-val">${s.pinHash ? 'Activado' : 'Desactivado'}${icon('right')}</span></button>
      </div>
      <p class="section-h">Datos <span>${backup}</span></p>
      <div class="list">
        <button class="row plain" data-action="export"><span class="row-main"><span class="row-title">Exportar respaldo</span><span class="row-sub">Archivo .json con toda tu información</span></span><span class="row-val">${icon('right')}</span></button>
        <button class="row plain" data-action="import"><span class="row-main"><span class="row-title">Restaurar respaldo</span></span><span class="row-val">${icon('right')}</span></button>
        <button class="row plain" data-action="csv"><span class="row-main"><span class="row-title">Exportar movimientos (CSV)</span><span class="row-sub">Para Excel o Numbers</span></span><span class="row-val">${icon('right')}</span></button>
        <button class="row plain" data-action="reset"><span class="row-main"><span class="row-title neg">Borrar todos los datos</span></span></button>
      </div>
      <p class="foot">Kazoo Cash · Tus datos viven solo en este dispositivo.<br>Exporta un respaldo de vez en cuando.</p>`,
  };
}

const VIEWS = { home: viewHome, tx: viewTx, goals: viewGoals, subs: viewSubs, settings: viewSettings };

function render() {
  if (!VIEWS[ui.tab]) ui.tab = 'home';
  const v = VIEWS[ui.tab]();
  $('#topbar').innerHTML = `<div>${v.sub ? `<p class="top-sub">${esc(v.sub)}</p>` : ''}<h1>${esc(v.title)}</h1></div><div class="top-actions">${v.actions || ''}</div>`;
  $('#view').innerHTML = v.body;
  $('#tabbar').innerHTML = TABS.map(([id, label, ic]) => `<button class="tab ${ui.tab === id ? 'active' : ''}" data-action="tab" data-tab="${id}" aria-current="${ui.tab === id ? 'page' : 'false'}">${icon(ic)}<span>${label}</span></button>`).join('');
  const fab = $('#fab');
  fab.innerHTML = icon('plus');
  fab.classList.toggle('hide', ui.tab === 'settings');
  v.mount?.();
}

// Re-render sin reiniciar animaciones (cambios de datos dentro de la misma vista).
function refresh() {
  const y = window.scrollY;
  render();
  $$('#view > *').forEach((el) => (el.style.animation = 'none'));
  window.scrollTo(0, y);
}

// ───────────────────────── Hojas y diálogos ─────────────────────────
let sheetToken = 0;
function openSheet(title, body, mount) {
  const root = $('#sheet-root');
  sheetToken++;
  root.innerHTML = `<div class="scrim" data-close></div>
    <section class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <header class="sheet-head"><h2>${esc(title)}</h2><button class="icon-btn" data-close aria-label="Cerrar">${icon('x')}</button></header>
      <div class="sheet-body">${body}</div></section>`;
  document.body.classList.add('noscroll');
  if (!root.classList.contains('open')) { void root.offsetHeight; root.classList.add('open'); }
  mount?.($('.sheet', root));
}
function closeSheet() {
  const root = $('#sheet-root');
  const tk = ++sheetToken;
  root.classList.remove('open');
  document.body.classList.remove('noscroll');
  document.activeElement?.blur?.();
  setTimeout(() => { if (tk === sheetToken) root.innerHTML = ''; }, 380);
}

function ask({ title, text = '', ok = 'Aceptar', danger = false }) {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'alert-wrap';
    el.innerHTML = `<div class="alert" role="alertdialog"><h3>${esc(title)}</h3>${text ? `<p>${esc(text)}</p>` : ''}
      <div class="alert-btns"><button data-r="0">Cancelar</button><button data-r="1" class="${danger ? 'neg' : ''}">${esc(ok)}</button></div></div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-r]');
      if (!b && e.target !== el) return;
      el.classList.remove('show');
      setTimeout(() => el.remove(), 200);
      resolve(b?.dataset.r === '1');
    });
  });
}

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

function nudge(input) {
  input.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }], { duration: 300 });
  input.focus();
}

// Movimiento
function txSheet(id, preset = {}) {
  if (!state.accounts.length) { toast('Primero crea una cuenta'); return accountForm(); }
  const t0 = id ? byId(state.transactions, id) : null;
  const lastAcc = acc(state.settings.lastAccount) ? state.settings.lastAccount : state.accounts[0].id;
  const t = t0 ? { ...t0 } : { type: 'expense', amount: '', date: today(), accountId: lastAcc, note: '', ...preset };
  const body = `<form class="form" id="txf" autocomplete="off" novalidate>
    <div class="seg">${[['expense', 'Gasto'], ['income', 'Ingreso'], ['transfer', 'Transferencia']].map(([v, l]) => `<label><input type="radio" name="type" value="${v}" ${t.type === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>
    <label class="amount-field"><span class="cur">${esc(curSymbol())}</span><input name="amount" inputmode="decimal" placeholder="0" value="${t.amount || ''}" aria-label="Monto"></label>
    <div id="tx-dyn" class="form"></div>
    <div class="grid2">
      <label class="field"><span>Fecha</span><input type="date" name="date" value="${t.date}" required></label>
      <label class="field"><span>Nota</span><input name="note" maxlength="80" placeholder="Opcional" value="${esc(t.note)}"></label>
    </div>
    <button class="btn primary" type="submit">${t0 ? 'Guardar cambios' : 'Agregar'}</button>
    ${t0 ? `<button class="btn danger" type="button" data-action="tx-delete" data-id="${t0.id}">Eliminar movimiento</button>` : ''}
  </form>`;
  openSheet(t0 ? 'Editar movimiento' : 'Nuevo movimiento', body, (sh) => {
    const f = $('#txf', sh);
    const dyn = $('#tx-dyn', sh);
    const accOpts = (sel) => opts(state.accounts.map((a) => [a.id, a.name]), sel);
    const draw = () => {
      const type = new FormData(f).get('type');
      if (type === 'transfer') {
        const to = t.toAccountId && t.toAccountId !== t.accountId ? t.toAccountId : (state.accounts.find((a) => a.id !== t.accountId) || {}).id;
        dyn.innerHTML = `<div class="grid2"><label class="field"><span>Desde</span><select name="accountId">${accOpts(t.accountId)}</select></label>
          <label class="field"><span>Hacia</span><select name="toAccountId">${accOpts(to)}</select></label></div>`;
      } else {
        const cats = state.categories.filter((c) => c.kind === type);
        const sel = cat(t.categoryId)?.kind === type ? t.categoryId : cats[0]?.id;
        dyn.innerHTML = `<div class="field"><span>Categoría</span><div class="chips">${cats.map((c) => `<label class="chip"><input type="radio" name="categoryId" value="${c.id}" ${c.id === sel ? 'checked' : ''}><span><i style="--c:${c.color}"></i>${esc(c.name)}</span></label>`).join('')}</div></div>
          <label class="field"><span>Cuenta</span><select name="accountId">${accOpts(t.accountId)}</select></label>`;
      }
    };
    draw();
    f.addEventListener('change', (e) => {
      if (e.target.name === 'type') draw();
      if (e.target.name === 'categoryId') t.categoryId = e.target.value;
      if (e.target.name === 'accountId') t.accountId = e.target.value;
      if (e.target.name === 'toAccountId') t.toAccountId = e.target.value;
    });
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(f);
      const amount = parseAmount(fd.get('amount'));
      if (!(amount > 0)) { toast('Escribe un monto'); return nudge(f.elements.amount); }
      const type = fd.get('type');
      const rec = { id: t0?.id || uid(), type, amount, date: fd.get('date') || today(), note: String(fd.get('note') || '').trim(), accountId: fd.get('accountId'), created: t0?.created || Date.now() };
      if (type === 'transfer') {
        rec.toAccountId = fd.get('toAccountId');
        if (rec.toAccountId === rec.accountId) return toast('Elige dos cuentas distintas');
      } else rec.categoryId = fd.get('categoryId') || null;
      if (t0?.subId) rec.subId = t0.subId;
      if (t0) state.transactions[state.transactions.indexOf(t0)] = rec;
      else state.transactions.push(rec);
      state.settings.lastAccount = rec.accountId;
      save(); closeSheet(); refresh();
      toast(t0 ? 'Cambios guardados' : 'Movimiento agregado');
    });
    if (!t0) f.elements.amount.focus();
  });
}

// Metas
function goalForm(id) {
  const g0 = id ? byId(state.goals, id) : null;
  const used = state.goals.map((g) => g.color);
  const g = g0 || { name: '', target: '', deadline: '', color: PALETTE.find((c) => !used.includes(c)) || PALETTE[0] };
  openSheet(g0 ? 'Editar meta' : 'Nueva meta', `<form class="form" id="gf" autocomplete="off" novalidate>
    <label class="field"><span>Nombre</span><input name="name" maxlength="40" placeholder="Fondo de emergencia" value="${esc(g.name)}"></label>
    <div class="grid2">
      <label class="field"><span>Monto objetivo</span><input name="target" inputmode="decimal" placeholder="0" value="${g.target || ''}"></label>
      ${g0 ? `<label class="field"><span>Fecha límite</span><input type="date" name="deadline" value="${g.deadline || ''}"></label>` : `<label class="field"><span>Ya tengo ahorrado</span><input name="initial" inputmode="decimal" placeholder="0"></label>`}
    </div>
    ${g0 ? '' : `<label class="field"><span>Fecha límite (opcional)</span><input type="date" name="deadline" min="${today()}"></label>`}
    <p class="hint-text">Con fecha límite te decimos cuánto apartar cada mes.</p>
    <div class="field"><span>Color</span>${swatches('color', g.color)}</div>
    <button class="btn primary" type="submit">${g0 ? 'Guardar cambios' : 'Crear meta'}</button>
  </form>`, (sh) => {
    const f = $('#gf', sh);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(f);
      const name = String(fd.get('name') || '').trim();
      const target = parseAmount(fd.get('target'));
      if (!name) return nudge(f.elements.name);
      if (!(target > 0)) return nudge(f.elements.target);
      if (g0) Object.assign(g0, { name, target, deadline: fd.get('deadline') || null, color: fd.get('color') || g.color });
      else {
        const init = parseAmount(fd.get('initial'));
        const goal = { id: uid(), name, target, deadline: fd.get('deadline') || null, color: fd.get('color') || g.color, created: today(), archived: false, history: [] };
        if (init > 0) goal.history.push({ id: uid(), date: today(), amount: init, note: 'Saldo inicial' });
        state.goals.push(goal);
      }
      save(); refresh();
      if (g0) goalDetail(g0.id); else { closeSheet(); toast('Meta creada'); }
    });
    if (!g0) f.elements.name.focus();
  });
}

function goalDetail(id) {
  const g = byId(state.goals, id);
  if (!g) return closeSheet();
  const p = goalPlan(g);
  const kv = [['Te falta', fmt(p.rem)]];
  if (g.deadline) kv.push(['Fecha límite', `${shortDate(g.deadline)}${p.daysLeft > 0 && !p.done ? ` · ${p.daysLeft} días` : ''}`]);
  if (p.monthly) kv.push(['Aparta cada mes', fmt(p.monthly)]);
  if (p.pace) kv.push(['Tu ritmo actual', `${fmt(p.pace)}/mes`]);
  if (p.eta) kv.push(['La cumplirías en', cap(clean(fMonthYear.format(parseISO(p.eta))))]);
  const hist = [...g.history].sort((a, b) => b.date.localeCompare(a.date));
  openSheet(g.name, `
    <div class="goal-hero">${ring(p.p, g.color, 150, 7)}<div><b>${Math.floor(p.p * 100)}%</b></div></div>
    <p class="center big-line">${fmt(p.saved)} <span class="muted">de ${fmt(g.target)}</span></p>
    ${p.done ? '<p class="center pos" style="margin-top:6px">Meta cumplida</p>' : ''}
    <div class="kv">${kv.map(([k, v]) => `<div><span>${k}</span><span>${v}</span></div>`).join('')}</div>
    <form class="form" id="gcf" autocomplete="off" novalidate>
      <div class="seg"><label><input type="radio" name="dir" value="1" checked><span>Aportar</span></label><label><input type="radio" name="dir" value="-1"><span>Retirar</span></label></div>
      <div class="grid2">
        <label class="field"><span>Monto</span><input name="amount" inputmode="decimal" placeholder="0"></label>
        <label class="field"><span>Nota</span><input name="note" maxlength="60" placeholder="Opcional"></label>
      </div>
      <button class="btn primary" type="submit">Registrar</button>
    </form>
    ${hist.length ? `<p class="sub-h">Historial</p><div class="list">${hist.map((h) => `<button class="row plain" data-action="goal-hist-del" data-id="${g.id}" data-h="${h.id}"><span class="row-main"><span class="row-title">${esc(h.note || (h.amount >= 0 ? 'Aportación' : 'Retiro'))}</span><span class="row-sub">${shortDate(h.date)}</span></span><span class="row-amt ${h.amount >= 0 ? 'pos' : ''}">${fmt(h.amount, h.amount >= 0 ? '+' : '-')}</span></button>`).join('')}</div>` : ''}
    <div class="btn-row" style="margin-top:20px">
      <button class="btn secondary" data-action="goal-edit" data-id="${g.id}">Editar</button>
      <button class="btn secondary" data-action="goal-archive" data-id="${g.id}">${g.archived ? 'Restaurar' : 'Archivar'}</button>
    </div>
    <button class="btn danger" data-action="goal-delete" data-id="${g.id}" style="margin-top:6px">Eliminar meta</button>`, (sh) => {
    const f = $('#gcf', sh);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(f);
      const amount = parseAmount(fd.get('amount'));
      if (!(amount > 0)) return nudge(f.elements.amount);
      const dir = +fd.get('dir');
      if (dir < 0 && amount > p.saved + 0.001) return toast('No puedes retirar más de lo ahorrado');
      const wasDone = p.done;
      g.history.push({ id: uid(), date: today(), amount: round2(dir * amount), note: String(fd.get('note') || '').trim() });
      save(); refresh(); goalDetail(g.id);
      if (!wasDone && goalPlan(g).done) toast('¡Meta cumplida! 🎉');
      else toast(dir > 0 ? 'Aportación registrada' : 'Retiro registrado');
    });
  });
}

// Suscripciones
function subForm(id) {
  if (!state.accounts.length) { toast('Primero crea una cuenta'); return accountForm(); }
  const s0 = id ? byId(state.subscriptions, id) : null;
  const s = s0 || { name: '', amount: '', cycle: '1m', next: addMonths(today(), 1), accountId: acc(state.settings.lastAccount) ? state.settings.lastAccount : state.accounts[0].id, categoryId: cat('c-subs') ? 'c-subs' : null, remind: state.settings.remindDays, color: PALETTE[(state.subscriptions.length * 3) % PALETTE.length], active: true };
  const expCats = state.categories.filter((c) => c.kind === 'expense').map((c) => [c.id, c.name]);
  openSheet(s0 ? s0.name : 'Nueva suscripción', `<form class="form" id="sf" autocomplete="off" novalidate>
    <label class="field"><span>Nombre</span><input name="name" maxlength="40" placeholder="Netflix, gimnasio, renta…" value="${esc(s.name)}"></label>
    <div class="grid2">
      <label class="field"><span>Monto</span><input name="amount" inputmode="decimal" placeholder="0" value="${s.amount || ''}"></label>
      <label class="field"><span>Frecuencia</span><select name="cycle">${opts(CYCLES, s.cycle)}</select></label>
    </div>
    <div class="grid2">
      <label class="field"><span>Próximo cobro</span><input type="date" name="next" value="${s.next}"></label>
      <label class="field"><span>Avisarme</span><select name="remind">${opts(REMIND, s.remind)}</select></label>
    </div>
    <div class="grid2">
      <label class="field"><span>Se cobra en</span><select name="accountId">${opts(state.accounts.map((a) => [a.id, a.name]), s.accountId)}</select></label>
      <label class="field"><span>Categoría</span><select name="categoryId">${opts(expCats, s.categoryId)}</select></label>
    </div>
    <div class="field"><span>Color</span>${swatches('color', s.color)}</div>
    ${s0 ? `<label class="row plain" style="padding:4px 4px"><span class="row-main"><span class="row-title">Activa</span><span class="row-sub">Pausa para dejar de contarla y de avisarte</span></span><span class="switch"><input type="checkbox" name="active" ${s.active ? 'checked' : ''}><span></span></span></label>` : ''}
    <button class="btn primary" type="submit">${s0 ? 'Guardar cambios' : 'Agregar'}</button>
    ${s0 && s0.active ? `<button class="btn secondary" type="button" data-action="sub-charge" data-id="${s0.id}">Registrar cobro de hoy</button>` : ''}
    ${s0 ? `<button class="btn danger" type="button" data-action="sub-delete" data-id="${s0.id}">Eliminar suscripción</button>` : ''}
  </form>`, (sh) => {
    const f = $('#sf', sh);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(f);
      const name = String(fd.get('name') || '').trim();
      const amount = parseAmount(fd.get('amount'));
      const next = fd.get('next');
      if (!name) return nudge(f.elements.name);
      if (!(amount > 0)) return nudge(f.elements.amount);
      if (!next) return nudge(f.elements.next);
      const rec = { name, amount, cycle: fd.get('cycle'), next, anchorDay: parseISO(next).getDate(), accountId: fd.get('accountId'), categoryId: fd.get('categoryId'), remind: +fd.get('remind'), color: fd.get('color') || s.color, active: s0 ? fd.get('active') === 'on' : true };
      if (s0) Object.assign(s0, rec); else state.subscriptions.push({ id: uid(), created: today(), ...rec });
      save();
      const n = processDueSubs();
      closeSheet(); refresh(); checkReminders();
      toast(n ? `Guardada · ${n} cobro${n > 1 ? 's' : ''} registrado${n > 1 ? 's' : ''}` : s0 ? 'Cambios guardados' : 'Suscripción agregada');
    });
    if (!s0) f.elements.name.focus();
  });
}

// Cuentas
function accountsSheet() {
  const b = balances();
  openSheet('Cuentas', `
    <div class="list">${state.accounts.map((a) => `<button class="row" data-action="acc-edit" data-id="${a.id}">
      <span class="mono" style="--c:${a.type === 'credito' ? 'var(--neg)' : a.type === 'inversion' || a.type === 'ahorro' ? 'var(--accent)' : 'var(--text)'}">${esc(initial(a.name))}</span>
      <span class="row-main"><span class="row-title">${esc(a.name)}</span><span class="row-sub">${ACCOUNT_TYPES[a.type] || ''}</span></span>
      <span class="row-amt ${(b[a.id] || 0) < 0 ? 'neg' : ''}">${fmt(b[a.id] || 0)}</span></button>`).join('')}</div>
    <div class="kv"><div><span>Total</span><span>${fmt(netWorth(b))}</span></div></div>
    <button class="btn secondary" data-action="acc-new">Nueva cuenta</button>
    <p class="hint-text" style="margin-top:14px">En tarjetas de crédito, escribe tu deuda como saldo negativo.</p>`);
}

function accountForm(id) {
  const a0 = id ? acc(id) : null;
  const cur = a0 ? balances()[a0.id] || 0 : 0;
  openSheet(a0 ? 'Editar cuenta' : 'Nueva cuenta', `<form class="form" id="af" autocomplete="off" novalidate>
    <label class="field"><span>Nombre</span><input name="name" maxlength="30" placeholder="BBVA, Nu, Efectivo…" value="${esc(a0?.name || '')}"></label>
    <div class="grid2">
      <label class="field"><span>Tipo</span><select name="type">${opts(Object.entries(ACCOUNT_TYPES), a0?.type || 'debito')}</select></label>
      <label class="field"><span>Saldo actual</span><input name="balance" inputmode="decimal" placeholder="0" value="${a0 ? round2(cur) : ''}"></label>
    </div>
    <p class="hint-text">Ajustar el saldo no crea movimientos; corrige el punto de partida de la cuenta.</p>
    <button class="btn primary" type="submit">${a0 ? 'Guardar' : 'Crear cuenta'}</button>
    ${a0 && state.accounts.length > 1 ? `<button class="btn danger" type="button" data-action="acc-delete" data-id="${a0.id}">Eliminar cuenta</button>` : ''}
  </form>`, (sh) => {
    const f = $('#af', sh);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(f);
      const name = String(fd.get('name') || '').trim();
      if (!name) return nudge(f.elements.name);
      const raw = String(fd.get('balance') || '').trim();
      const want = raw ? parseAmount(raw) : 0;
      if (Number.isNaN(want)) return nudge(f.elements.balance);
      if (a0) {
        const effect = cur - (+a0.initial || 0);
        Object.assign(a0, { name, type: fd.get('type'), initial: round2(want - effect) });
      } else state.accounts.push({ id: uid(), name, type: fd.get('type'), initial: want });
      save(); refresh(); accountsSheet();
    });
    if (!a0) f.elements.name.focus();
  });
}

function budgetsSheet() {
  const ym = today().slice(0, 7);
  const spent = spentByCat(ym);
  const cats = state.categories.filter((c) => c.kind === 'expense');
  openSheet('Presupuestos', `<form class="form" id="bf" autocomplete="off" novalidate>
    <p class="hint-text">Límite mensual por categoría. Déjalo vacío si no quieres límite.</p>
    <div class="list">${cats.map((c) => `<label class="row plain">
      <i class="dot" style="--c:${c.color}"></i>
      <span class="row-main"><span class="row-title">${esc(c.name)}</span><span class="row-sub">Este mes: ${fmt(spent[c.id] || 0)}</span></span>
      <span class="field" style="width:120px"><input name="${c.id}" inputmode="decimal" placeholder="Sin límite" value="${c.budget || ''}" style="height:40px;text-align:right;background:var(--surface-3)"></span></label>`).join('')}</div>
    <button class="btn primary" type="submit">Guardar</button></form>`, (sh) => {
    $('#bf', sh).addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      for (const c of cats) { const v = parseAmount(fd.get(c.id)); c.budget = v > 0 ? v : 0; }
      save(); closeSheet(); refresh(); toast('Presupuestos guardados');
    });
  });
}

function categoriesSheet(kind = 'expense') {
  const counts = {};
  for (const t of state.transactions) counts[t.categoryId] = (counts[t.categoryId] || 0) + 1;
  openSheet('Categorías', `
    <div class="seg" style="margin-bottom:14px">${[['expense', 'Gastos'], ['income', 'Ingresos']].map(([k, l]) => `<button class="${k === kind ? 'on' : ''}" data-action="cat-kind" data-k="${k}">${l}</button>`).join('')}</div>
    <div class="list">${state.categories.filter((c) => c.kind === kind).map((c) => `<button class="row" data-action="cat-edit" data-id="${c.id}">
      <span class="mono" style="--c:${c.color}">${esc(initial(c.name))}</span>
      <span class="row-main"><span class="row-title">${esc(c.name)}</span><span class="row-sub">${counts[c.id] || 0} movimientos</span></span>${icon('right', 'muted')}</button>`).join('')}</div>
    <button class="btn secondary" data-action="cat-new" data-k="${kind}" style="margin-top:12px">Nueva categoría</button>`);
}

function catForm(id, kind) {
  const c0 = id ? cat(id) : null;
  const c = c0 || { name: '', kind, color: PALETTE[state.categories.length % PALETTE.length] };
  openSheet(c0 ? 'Editar categoría' : 'Nueva categoría', `<form class="form" id="cf" autocomplete="off" novalidate>
    <label class="field"><span>Nombre</span><input name="name" maxlength="24" value="${esc(c.name)}" placeholder="Mascotas"></label>
    <div class="field"><span>Color</span>${swatches('color', c.color)}</div>
    <button class="btn primary" type="submit">Guardar</button>
    ${c0 ? `<button class="btn danger" type="button" data-action="cat-delete" data-id="${c0.id}">Eliminar categoría</button>` : ''}
  </form>`, (sh) => {
    const f = $('#cf', sh);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(f);
      const name = String(fd.get('name') || '').trim();
      if (!name) return nudge(f.elements.name);
      if (c0) Object.assign(c0, { name, color: fd.get('color') || c.color });
      else state.categories.push({ id: uid(), name, kind: c.kind, color: fd.get('color') || c.color, budget: 0 });
      save(); refresh(); categoriesSheet(c.kind);
    });
    if (!c0) f.elements.name.focus();
  });
}

// ───────────────────────── Código de acceso ─────────────────────────
async function hashPin(pin) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('kazoo-cash:' + pin));
  return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function pinSheet(forceNew) {
  if (state.settings.pinHash && !forceNew) {
    openSheet('Código de acceso', `<p class="hint-text" style="margin-bottom:16px">El código protege la app de miradas curiosas. Si lo olvidas, tendrás que borrar los datos.</p>
      <div class="form"><button class="btn secondary" data-action="pin-change">Cambiar código</button><button class="btn danger" data-action="pin-off">Desactivar código</button></div>`);
    return;
  }
  openSheet('Nuevo código', `<form class="form" id="pf" autocomplete="off" novalidate>
    <label class="field"><span>Código de 4 dígitos</span><input name="a" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off"></label>
    <label class="field"><span>Repite el código</span><input name="b" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off"></label>
    <p class="hint-text">Se pedirá al abrir la app y al volver después de un minuto. Guarda un respaldo por si lo olvidas.</p>
    <button class="btn primary" type="submit">Activar</button></form>`, (sh) => {
    const f = $('#pf', sh);
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const a = f.elements.a.value, b = f.elements.b.value;
      if (!/^\d{4}$/.test(a)) return nudge(f.elements.a);
      if (a !== b) { toast('Los códigos no coinciden'); return nudge(f.elements.b); }
      state.settings.pinHash = await hashPin(a);
      save(); closeSheet(); refresh(); toast('Código activado');
    });
    f.elements.a.focus();
  });
}

let pinBuf = '', hiddenAt = 0;
function showLock() {
  if (!state.settings.pinHash) return;
  const el = $('#lock');
  pinBuf = '';
  el.innerHTML = `<img src="icons/icon-192.png" alt="" width="64" height="64" style="border-radius:16px">
    <p class="lock-t">Ingresa tu código</p>
    <div class="pin-dots">${'<i></i>'.repeat(4)}</div>
    <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => `<button class="key" data-k="${k}">${k}</button>`).join('')}<span></span><button class="key" data-k="0">0</button><button class="key ghost" data-k="del" aria-label="Borrar">${icon('back')}</button></div>
    <button class="lock-forgot" data-k="forgot">¿Olvidaste tu código?</button>`;
  el.classList.add('show');
}
async function lockKey(k) {
  const el = $('#lock');
  if (k === 'forgot') {
    if (await ask({ title: '¿Borrar todo?', text: 'Sin el código no se pueden recuperar tus datos. Se borrará toda la información de este dispositivo.', ok: 'Borrar', danger: true })) resetAll();
    return;
  }
  if (k === 'del') pinBuf = pinBuf.slice(0, -1);
  else if (pinBuf.length < 4) pinBuf += k;
  $$('.pin-dots i', el).forEach((d, i) => d.classList.toggle('on', i < pinBuf.length));
  if (pinBuf.length === 4) {
    const ok = (await hashPin(pinBuf)) === state.settings.pinHash;
    if (ok) { el.classList.remove('show'); el.innerHTML = ''; pinBuf = ''; }
    else {
      const dots = $('.pin-dots', el);
      dots.classList.add('shake');
      setTimeout(() => { dots.classList.remove('shake'); pinBuf = ''; $$('i', dots).forEach((d) => d.classList.remove('on')); }, 420);
    }
  }
}

// ───────────────────────── Avisos ─────────────────────────
async function enableNotifications() {
  const st = notifStatus();
  if (st === 'install') return toast('Primero agrega Kazoo a tu pantalla de inicio');
  if (st === 'unsupported') return toast('Este navegador no admite notificaciones');
  if (st === 'denied') return toast('Actívalas en Configuración › Notificaciones › Kazoo');
  const p = await Notification.requestPermission();
  state.settings.notify = p === 'granted';
  save(); refresh();
  if (p === 'granted') { toast('Avisos activados'); checkReminders(); }
}

async function notify(title, body, tag) {
  const reg = await navigator.serviceWorker?.getRegistration?.();
  if (reg) return reg.showNotification(title, { body, tag, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' });
  return new Notification(title, { body, tag });
}

async function checkReminders() {
  const t = today();
  const due = activeSubs().filter((s) => { const d = daysBetween(t, s.next); return d >= 0 && d <= (s.remind ?? state.settings.remindDays); });
  try { if (navigator.setAppBadge) due.length ? await navigator.setAppBadge(due.length) : await navigator.clearAppBadge(); } catch {}
  if (!state.settings.notify || notifStatus() !== 'granted') return;
  let changed = false;
  for (const s of due) {
    const key = `${s.id}|${s.next}`;
    if (state.notified[key]) continue;
    const d = daysBetween(t, s.next);
    const when = d === 0 ? 'hoy' : d === 1 ? 'mañana' : `en ${d} días`;
    try {
      await notify(`${s.name} se cobra ${when}`, `${hidden() ? 'Cobro' : money(s.amount)} · ${acc(s.accountId)?.name || ''}`, key);
      state.notified[key] = t;
      changed = true;
    } catch (e) { console.warn(e); }
  }
  // limpia registros viejos
  const cutoff = addDays(t, -60);
  for (const [k, v] of Object.entries(state.notified)) if (typeof v === 'string' && v < cutoff) { delete state.notified[k]; changed = true; }
  if (changed) save();
}

// ───────────────────────── Archivos ─────────────────────────
async function deliverFile(name, content, type) {
  const blob = new Blob([content], { type });
  if (isIOS() && navigator.canShare) {
    try {
      const file = new File([blob], name, { type });
      if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file] }); return true; }
    } catch (e) { if (e?.name === 'AbortError') return false; }
  }
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return true;
}

function buildICS() {
  const e = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const d = (iso) => iso.replace(/-/g, '');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kazoo Cash//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Kazoo · Cobros'];
  for (const s of activeSubs()) {
    const { n, u } = cycleParts(s.cycle);
    const freq = { w: 'WEEKLY', m: 'MONTHLY', y: 'YEARLY' }[u];
    const byDay = u === 'm' && (s.anchorDay || 0) >= 29 ? ';BYMONTHDAY=-1' : '';
    const r = s.remind ?? state.settings.remindDays;
    const trigger = r === 0 ? 'PT9H' : r === 1 ? '-PT15H' : `-P${r - 1}DT15H`; // 9:00 a. m.
    L.push('BEGIN:VEVENT', `UID:${s.id}@kazoo.cash`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${d(s.next)}`, `DTEND;VALUE=DATE:${d(addDays(s.next, 1))}`,
      `RRULE:FREQ=${freq};INTERVAL=${n}${byDay}`,
      `SUMMARY:${e(`${s.name} · ${money(s.amount)}`)}`,
      `DESCRIPTION:${e(`Cobro ${cycleLabel(s.cycle).toLowerCase()} en ${acc(s.accountId)?.name || 'tu cuenta'}.`)}`,
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${e(`${s.name} se cobra pronto`)}`, `TRIGGER:${trigger}`, 'END:VALARM',
      'END:VEVENT');
  }
  L.push('END:VCALENDAR');
  return L.join('\r\n');
}

async function exportICS() {
  if (!activeSubs().length) return toast('No hay suscripciones activas');
  const ok = await ask({ title: 'Agregar al Calendario', text: 'Se creará un evento repetido por cada suscripción, con alarma según la anticipación que elegiste. En iPhone elige “Guardar en Archivos” y abre el archivo, o compártelo a Calendario.', ok: 'Continuar' });
  if (ok) deliverFile('kazoo-cobros.ics', buildICS(), 'text/calendar');
}

function exportBackup() {
  const data = JSON.stringify({ app: 'kazoo-cash', exportedAt: new Date().toISOString(), ...state }, null, 2);
  deliverFile(`kazoo-respaldo-${today()}.json`, data, 'application/json').then((ok) => {
    if (!ok) return;
    state.settings.lastBackup = today();
    save(); refresh();
  });
}

function exportCSV() {
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const type = { income: 'Ingreso', expense: 'Gasto', transfer: 'Transferencia' };
  const rows = [['Fecha', 'Tipo', 'Monto', 'Categoría', 'Cuenta', 'Cuenta destino', 'Nota']];
  for (const t of [...state.transactions].sort((a, b) => a.date.localeCompare(b.date))) {
    rows.push([t.date, type[t.type], (t.type === 'expense' ? -t.amount : t.amount).toFixed(2), t.type === 'transfer' ? '' : catName(t.categoryId), acc(t.accountId)?.name, acc(t.toAccountId)?.name, t.note]);
  }
  deliverFile(`kazoo-movimientos-${today()}.csv`, '\uFEFF' + rows.map((r) => r.map(q).join(',')).join('\r\n'), 'text/csv');
}

async function importBackup(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!data || !Array.isArray(data.transactions) || !Array.isArray(data.accounts)) throw new Error('formato');
    const ok = await ask({ title: 'Restaurar respaldo', text: `Se reemplazarán tus datos actuales con ${data.transactions.length} movimientos y ${(data.goals || []).length} metas.`, ok: 'Restaurar', danger: true });
    if (!ok) return;
    delete data.app; delete data.exportedAt;
    state = migrate(data);
    _nfKey = null;
    save(); refresh(); toast('Respaldo restaurado');
  } catch { toast('El archivo no es un respaldo válido'); }
}

function resetAll() {
  try { localStorage.removeItem(KEY); } catch {}
  state = seed();
  _nfKey = null;
  save();
  $('#lock').classList.remove('show');
  closeSheet(); ui.tab = 'home'; render();
  toast('Datos borrados');
}

// ───────────────────────── Acciones ─────────────────────────
const actions = {
  tab(el) {
    if (ui.tab === el.dataset.tab) return window.scrollTo({ top: 0, behavior: 'smooth' });
    ui.tab = el.dataset.tab;
    try { sessionStorage.setItem('kazoo.tab', ui.tab); } catch {}
    render(); window.scrollTo(0, 0);
  },
  fab() { ({ home: () => txSheet(), tx: () => txSheet(), goals: () => goalForm(), subs: () => subForm() })[ui.tab]?.(); },
  'toggle-hide'() { state.settings.hideAmounts = !state.settings.hideAmounts; save(); refresh(); },
  'dismiss-install'() { state.settings.installDismissed = true; save(); refresh(); },
  month(el) { ui.month = shiftMonth(ui.month, +el.dataset.d); refresh(); },
  'tx-filter'(el) { ui.filter = el.dataset.v; refresh(); },
  'new-tx'() { txSheet(); },
  'edit-tx'(el) { txSheet(el.dataset.id); },
  async 'tx-delete'(el) {
    if (!(await ask({ title: '¿Eliminar movimiento?', ok: 'Eliminar', danger: true }))) return;
    state.transactions = state.transactions.filter((t) => t.id !== el.dataset.id);
    save(); closeSheet(); refresh(); toast('Movimiento eliminado');
  },
  'new-goal'() { goalForm(); },
  goal(el) { goalDetail(el.dataset.id); },
  'goal-edit'(el) { goalForm(el.dataset.id); },
  'goal-archive'(el) {
    const g = byId(state.goals, el.dataset.id);
    g.archived = !g.archived;
    save(); closeSheet(); refresh(); toast(g.archived ? 'Meta archivada' : 'Meta restaurada');
  },
  async 'goal-delete'(el) {
    if (!(await ask({ title: '¿Eliminar meta?', text: 'Se borrará junto con su historial.', ok: 'Eliminar', danger: true }))) return;
    state.goals = state.goals.filter((g) => g.id !== el.dataset.id);
    save(); closeSheet(); refresh();
  },
  async 'goal-hist-del'(el) {
    if (!(await ask({ title: '¿Eliminar registro?', ok: 'Eliminar', danger: true }))) return;
    const g = byId(state.goals, el.dataset.id);
    g.history = g.history.filter((h) => h.id !== el.dataset.h);
    save(); refresh(); goalDetail(g.id);
  },
  'toggle-archived'() { ui.showArchived = !ui.showArchived; refresh(); },
  'new-sub'() { subForm(); },
  'edit-sub'(el) { subForm(el.dataset.id); },
  async 'sub-charge'(el) {
    const s = byId(state.subscriptions, el.dataset.id);
    if (!(await ask({ title: `Registrar cobro de ${s.name}`, text: `Se anotará un gasto de ${money(s.amount)} con fecha de hoy y el próximo cobro se moverá al siguiente periodo.`, ok: 'Registrar' }))) return;
    chargeSub(s, today());
    save(); closeSheet(); refresh(); checkReminders(); toast('Cobro registrado');
  },
  async 'sub-delete'(el) {
    if (!(await ask({ title: '¿Eliminar suscripción?', text: 'Los cobros ya registrados se conservan.', ok: 'Eliminar', danger: true }))) return;
    state.subscriptions = state.subscriptions.filter((s) => s.id !== el.dataset.id);
    save(); closeSheet(); refresh(); checkReminders();
  },
  accounts() { accountsSheet(); },
  'acc-new'() { accountForm(); },
  'acc-edit'(el) { accountForm(el.dataset.id); },
  async 'acc-delete'(el) {
    const id = el.dataset.id;
    const n = state.transactions.filter((t) => t.accountId === id || t.toAccountId === id).length;
    if (!(await ask({ title: '¿Eliminar cuenta?', text: n ? `También se eliminarán ${n} movimientos asociados.` : '', ok: 'Eliminar', danger: true }))) return;
    state.accounts = state.accounts.filter((a) => a.id !== id);
    state.transactions = state.transactions.filter((t) => t.accountId !== id && t.toAccountId !== id);
    state.subscriptions.forEach((s) => { if (s.accountId === id) s.accountId = state.accounts[0].id; });
    save(); refresh(); accountsSheet();
  },
  budgets() { budgetsSheet(); },
  categories() { categoriesSheet(); },
  'cat-kind'(el) { categoriesSheet(el.dataset.k); },
  'cat-new'(el) { catForm(null, el.dataset.k); },
  'cat-edit'(el) { catForm(el.dataset.id); },
  async 'cat-delete'(el) {
    const c = cat(el.dataset.id);
    if (state.categories.filter((x) => x.kind === c.kind).length <= 1) return toast('Debe quedar al menos una categoría');
    if (!(await ask({ title: `¿Eliminar “${c.name}”?`, text: 'Sus movimientos quedarán sin categoría.', ok: 'Eliminar', danger: true }))) return;
    state.categories = state.categories.filter((x) => x.id !== c.id);
    state.transactions.forEach((t) => { if (t.categoryId === c.id) t.categoryId = null; });
    state.subscriptions.forEach((s) => { if (s.categoryId === c.id) s.categoryId = null; });
    save(); refresh(); categoriesSheet(c.kind);
  },
  'notify-enable'() { enableNotifications(); },
  async 'notify-test'() {
    try { await notify('Kazoo Cash', 'Así se verán tus avisos de cobro.', 'test'); } catch { toast('No se pudo enviar el aviso'); }
  },
  ics() { exportICS(); },
  pin() { pinSheet(); },
  'pin-change'() { pinSheet(true); },
  async 'pin-off'() { state.settings.pinHash = null; save(); closeSheet(); refresh(); toast('Código desactivado'); },
  export() { exportBackup(); },
  import() { $('#import-file').click(); },
  csv() { if (!state.transactions.length) return toast('No hay movimientos'); exportCSV(); },
  async reset() {
    if (!(await ask({ title: '¿Borrar todos los datos?', text: 'Esta acción no se puede deshacer. Exporta un respaldo antes si lo necesitas.', ok: 'Continuar', danger: true }))) return;
    if (!(await ask({ title: '¿Seguro?', text: 'Se eliminarán cuentas, movimientos, metas y suscripciones.', ok: 'Borrar todo', danger: true }))) return;
    resetAll();
  },
};

document.addEventListener('click', (e) => {
  const lockKeyEl = e.target.closest('#lock [data-k]');
  if (lockKeyEl) return lockKey(lockKeyEl.dataset.k);
  if (e.target.closest('[data-close]')) return closeSheet();
  const el = e.target.closest('[data-action]');
  if (!el) return;
  e.preventDefault();
  actions[el.dataset.action]?.(el, e);
});

document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-setting]');
  if (!el) return;
  const k = el.dataset.setting;
  let v = el.type === 'checkbox' ? el.checked : el.value;
  if (k === 'remindDays') v = +v;
  if (k === 'notify' && v && notifStatus() !== 'granted') { el.checked = false; return enableNotifications(); }
  state.settings[k] = v;
  if (k === 'currency') _nfKey = null;
  save(); refresh();
  if (k === 'notify' && v) checkReminders();
  if (k === 'autoCharge' && v) { const n = processDueSubs(); if (n) { refresh(); toast(`${n} cobro${n > 1 ? 's' : ''} registrado${n > 1 ? 's' : ''}`); } }
});

$('#import-file').addEventListener('change', (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) importBackup(f); });

document.addEventListener('keydown', (e) => {
  if ($('#lock').classList.contains('show')) {
    if (/^\d$/.test(e.key)) lockKey(e.key);
    else if (e.key === 'Backspace') lockKey('del');
    return;
  }
  if (e.key === 'Escape' && $('#sheet-root').classList.contains('open')) closeSheet();
});

// ───────────────────────── Ciclo de vida ─────────────────────────
async function tick() {
  await checkReminders();
  const n = processDueSubs();
  if (ui.day !== today() || n) { ui.day = today(); ui.month = ui.month || today().slice(0, 7); refresh(); }
  if (n) toast(`${n} cobro${n > 1 ? 's' : ''} de suscripción registrado${n > 1 ? 's' : ''}`);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { hiddenAt = Date.now(); return; }
  if (state.settings.pinHash && hiddenAt && Date.now() - hiddenAt > 60_000) showLock();
  tick();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW', e)));
}
navigator.storage?.persist?.().catch(() => {});

showLock();
render();
tick();
setInterval(tick, 30 * 60 * 1000);
