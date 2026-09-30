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
  clip: '<path d="m20.5 11.5-8.3 8.3a5.2 5.2 0 0 1-7.4-7.4l8.3-8.3a3.5 3.5 0 0 1 4.9 4.9l-8.3 8.3a1.7 1.7 0 0 1-2.5-2.5l7.7-7.6"/>',
  cloud: '<path d="M7 18.5a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.6 1.5h.5a3.8 3.8 0 0 1 0 7.5z"/>',
  debt: '<rect x="2.5" y="5.5" width="19" height="13" rx="2.5"/><path d="M2.5 10h19M6.5 14.5h4"/>',
};
const icon = (n, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;

// ───────────────────────── Datos ─────────────────────────
const KEY = 'kazoo.cash.v1';
const PALETTE = ['#D4BE8A', '#7CCFA6', '#8FB3E8', '#E8837E', '#B89BE0', '#E3B55F', '#6FC7C9', '#E39BC0', '#9CC47A', '#E0A07A', '#A3A3AA'];
const ACCOUNT_TYPES = { debito: 'Débito', credito: 'Tarjeta de crédito', efectivo: 'Efectivo', ahorro: 'Ahorro', inversion: 'Inversión' };
const CYCLES = [['1w', 'Semanal'], ['2w', 'Cada 2 semanas'], ['1q', 'Quincenal (15 y fin de mes)'], ['1m', 'Mensual'], ['2m', 'Bimestral'], ['3m', 'Trimestral'], ['6m', 'Semestral'], ['1y', 'Anual']];
const REMIND = [[0, 'El mismo día'], [1, '1 día antes'], [2, '2 días antes'], [3, '3 días antes'], [5, '5 días antes'], [7, '1 semana antes']];
const CURRENCIES = [['MXN', 'Peso mexicano'], ['USD', 'Dólar'], ['EUR', 'Euro'], ['COP', 'Peso colombiano'], ['ARS', 'Peso argentino'], ['CLP', 'Peso chileno'], ['PEN', 'Sol peruano'], ['GTQ', 'Quetzal'], ['DOP', 'Peso dominicano'], ['GBP', 'Libra esterlina']];
const cycleLabel = (c) => (c === '1q' ? 'Quincenal' : (CYCLES.find((x) => x[0] === c) || [0, c])[1]);

function seed() {
  const c = (id, name, kind, color) => ({ id, name, kind, color, budget: 0 });
  return {
    v: 1,
    meta: { updatedAt: 0 },
    settings: { currency: 'MXN', hideAmounts: false, notify: false, autoCharge: true, remindDays: 3, pinHash: null, installDismissed: false, lastBackup: null, lastAccount: null, debtStrategy: 'avalanche' },
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
      c('c-debt', 'Deudas', 'expense', PALETTE[3]), c('c-other', 'Otros', 'expense', PALETTE[10]),
      c('c-salary', 'Sueldo', 'income', PALETTE[1]), c('c-free', 'Freelance', 'income', PALETTE[2]),
      c('c-invest', 'Inversiones', 'income', PALETTE[0]), c('c-gift', 'Regalos', 'income', PALETTE[7]),
      c('c-inc-other', 'Otros ingresos', 'income', PALETTE[10]),
    ],
    transactions: [],
    goals: [],
    subscriptions: [],
    debts: [],
    notified: {},
  };
}

function migrate(s) {
  const base = seed();
  s.settings = { ...base.settings, ...(s.settings || {}) };
  s.meta = { ...base.meta, ...(s.meta || {}) };
  for (const k of ['accounts', 'categories', 'transactions', 'goals', 'subscriptions', 'debts']) if (!Array.isArray(s[k])) s[k] = base[k];
  if (!s.notified || typeof s.notified !== 'object') s.notified = {};
  s.goals.forEach((g) => { if (!Array.isArray(g.history)) g.history = []; });
  s.debts.forEach((d) => { if (!Array.isArray(d.history)) d.history = []; });
  s.subscriptions.forEach((x) => { if (!x.kind) x.kind = 'expense'; });
  if (!s.categories.some((c) => c.id === 'c-debt')) s.categories.splice(s.categories.findIndex((c) => c.id === 'c-other') + 1 || 0, 0, { id: 'c-debt', name: 'Deudas', kind: 'expense', color: PALETTE[3], budget: 0 });
  return s;
}

function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) return migrate(JSON.parse(raw)); } catch (e) { console.error(e); }
  return seed();
}
let state = load();
function save(opts = {}) {
  if (!opts.silent) state.meta.updatedAt = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch { toast('No se pudo guardar. Exporta un respaldo.'); }
  if (!opts.silent) scheduleSync();
}

const ui = { tab: 'home', month: today().slice(0, 7), query: '', filter: 'all', showArchived: false, day: today(), plan: 'goals' };
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
const cash = (b = balances()) => round2(sum(state.accounts, (a) => b[a.id] || 0));
const netWorth = (b = balances()) => round2(cash(b) - debtTotal());
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

// Suscripciones e ingresos fijos
const cycleParts = (c) => ({ n: parseInt(c, 10) || 1, u: String(c).slice(-1) });
function nextQuincena(iso) {
  const d = parseISO(iso), y = d.getFullYear(), m = d.getMonth();
  const last = new Date(y, m + 1, 0).getDate();
  if (d.getDate() < 15) return toISO(new Date(y, m, 15));
  if (d.getDate() < last) return toISO(new Date(y, m, last));
  return toISO(new Date(y, m + 1, 15));
}
function advanceSub(s) {
  const { n, u } = cycleParts(s.cycle);
  if (u === 'q') s.next = nextQuincena(s.next);
  else s.next = u === 'w' ? addDays(s.next, 7 * n) : addMonths(s.next, u === 'y' ? 12 * n : n, s.anchorDay);
}
function subMonthly(s) {
  const { n, u } = cycleParts(s.cycle);
  if (u === 'q') return s.amount * 2;
  if (u === 'w') return (s.amount * 52) / 12 / n;
  if (u === 'y') return s.amount / (12 * n);
  return s.amount / n;
}
function chargeSub(s, date = s.next) {
  state.transactions.push({ id: uid(), type: s.kind === 'income' ? 'income' : 'expense', amount: s.amount, date, categoryId: s.categoryId, accountId: s.accountId, note: s.name, subId: s.id, created: Date.now() });
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
const paySubs = () => activeSubs().filter((s) => s.kind !== 'income');
const incomeSubs = () => activeSubs().filter((s) => s.kind === 'income');

// Deudas
const debtBalance = (d) => round2(Math.max(0, d.start - sum(d.history, (h) => h.amount)));
const debtPaid = (d) => round2(sum(d.history.filter((h) => h.amount > 0 && !h.adjust), (h) => h.amount));
const debtTotal = () => round2(sum(state.debts || [], debtBalance));
function payoff(balance, ratePct, payment) {
  if (balance <= 0) return { months: 0, interest: 0 };
  if (!(payment > 0)) return null;
  const r = (ratePct || 0) / 100 / 12;
  if (r > 0 && payment <= balance * r) return { never: true };
  let b = balance, interest = 0, m = 0;
  while (b > 0.005 && m < 1200) { const i = b * r; interest += i; b = b + i - payment; m++; }
  return { months: m, interest: round2(interest), date: addMonths(today(), m) };
}
function debtDue(d) {
  if (!d.dueDay || debtBalance(d) <= 0) return null;
  const t = parseISO(today());
  const make = (y, m) => toISO(new Date(y, m, Math.min(d.dueDay, new Date(y, m + 1, 0).getDate())));
  const cur = make(t.getFullYear(), t.getMonth());
  return cur >= today() ? cur : make(t.getFullYear(), t.getMonth() + 1);
}
const monthsLabel = (n) => (n >= 24 ? `${(n / 12).toFixed(1).replace('.0', '')} años` : `${n} mes${n === 1 ? '' : 'es'}`);
function debtOrder() {
  const open = state.debts.filter((d) => debtBalance(d) > 0);
  return state.settings.debtStrategy === 'snowball'
    ? open.sort((a, b) => debtBalance(a) - debtBalance(b))
    : open.sort((a, b) => (b.rate || 0) - (a.rate || 0) || debtBalance(a) - debtBalance(b));
}

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
  const tags = (t.tags || []).map((x) => '#' + x).join(' ');
  const sub = (isT ? `${acc(t.accountId)?.name || '—'} → ${acc(t.toAccountId)?.name || '—'}` : `${t.note ? catName(t.categoryId) + ' · ' : ''}${acc(t.accountId)?.name || '—'}${t.subId ? ' · Recurrente' : ''}`) + (tags ? ` · ${tags}` : '');
  const amt = t.type === 'income' ? `<span class="row-amt pos">${fmt(t.amount, '+')}</span>` : t.type === 'expense' ? `<span class="row-amt">${fmt(t.amount, '-')}</span>` : `<span class="row-amt muted">${fmt(t.amount)}</span>`;
  return `<button class="row" data-action="edit-tx" data-id="${t.id}">
    <span class="mono" style="--c:${c}">${isT ? icon('swap') : esc(initial(catName(t.categoryId)))}</span>
    <span class="row-main"><span class="row-title">${esc(title)}${t.receipt ? ` ${icon('clip', 'tiny')}` : ''}</span><span class="row-sub">${esc(sub)}</span></span>
    ${amt}</button>`;
}

function subRow(s) {
  const d = daysBetween(today(), s.next);
  const inc = s.kind === 'income';
  const soon = s.active && !inc && d <= (s.remind ?? state.settings.remindDays);
  return `<button class="row ${s.active ? '' : 'dim'}" data-action="edit-sub" data-id="${s.id}">
    <span class="mono" style="--c:${s.color}">${esc(initial(s.name))}</span>
    <span class="row-main"><span class="row-title">${esc(s.name)}</span><span class="row-sub">${esc(cycleLabel(s.cycle))}${acc(s.accountId) ? ' · ' + esc(acc(s.accountId).name) : ''}</span></span>
    <span class="row-end"><span class="row-amt ${inc ? 'pos' : ''}">${inc ? fmt(s.amount, '+') : fmt(s.amount)}</span><span class="pill ${soon ? 'soon' : ''}">${s.active ? relDays(s.next) : 'En pausa'}</span></span></button>`;
}

function debtCard(d) {
  const bal = debtBalance(d), paid = debtPaid(d);
  const p = d.start > 0 ? clamp(1 - bal / d.start, 0, 1) : 0;
  const plan = payoff(bal, d.rate, d.payment);
  let sub;
  if (bal <= 0) sub = '<span class="pos">Liquidada</span>';
  else if (!plan) sub = `${d.rate ? d.rate + '% anual · ' : ''}Define un pago mensual`;
  else if (plan.never) sub = '<span class="neg">El pago no cubre los intereses</span>';
  else sub = `${fmt(d.payment)}/mes · libre en ${monthsLabel(plan.months)}`;
  return `<button class="goal-card" data-action="debt" data-id="${d.id}">
    <span class="ring-wrap">${ring(p, d.color, 54, 4)}<span>${Math.floor(p * 100)}%</span></span>
    <span class="goal-main"><b>${esc(d.name)}</b>
      <div class="goal-amt">${fmt(bal)} <span>${paid > 0 ? `· pagado ${fmt(paid)}` : `de ${fmt(d.start)}`}</span></div>
      <div class="goal-sub">${sub}</div></span></button>`;
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
  const b = balances(), nw = netWorth(b), res = reserved(), money_ = cash(b), debts = debtTotal();
  const mt = monthTotals(ym);
  const rate = mt.income > 0 ? mt.net / mt.income : null;
  const fresh = !state.transactions.length && state.accounts.every((a) => !+a.initial) && !state.goals.length && !state.subscriptions.length && !state.debts.length;

  const body = `
    ${installHint()}
    ${syncBanner()}
    <section class="hero">
      <p class="eyebrow">Patrimonio</p>
      <p class="hero-amount" data-action="toggle-hide">${fmtHero(nw)}</p>
      <div class="hero-sub"><span>Disponible <b>${fmt(money_ - res)}</b></span><span class="sep-dot"></span><span>En metas <b>${fmt(res)}</b></span>${debts > 0 ? `<span class="sep-dot"></span><span>Deudas <b>${fmt(debts)}</b></span>` : ''}</div>
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
    ${homeInsights(ym, money_ - res)}`;
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

function debtDueRow(d) {
  const due = debtDue(d);
  const soon = daysBetween(today(), due) <= state.settings.remindDays;
  return `<button class="row" data-action="debt" data-id="${d.id}">
    <span class="mono" style="--c:${d.color}">${icon('debt')}</span>
    <span class="row-main"><span class="row-title">Pago de ${esc(d.name)}</span><span class="row-sub">Deuda · saldo ${fmt(debtBalance(d))}</span></span>
    <span class="row-end"><span class="row-amt">${d.payment ? fmt(d.payment) : '—'}</span><span class="pill ${soon ? 'soon' : ''}">${relDays(due)}</span></span></button>`;
}

function homeUpcoming() {
  const dues = state.debts.filter((d) => debtDue(d) && daysBetween(today(), debtDue(d)) <= 14);
  if (!paySubs().length && !dues.length) return '';
  const items = [
    ...paySubs().filter((s) => daysBetween(today(), s.next) <= 14).map((s) => [s.next, subRow(s)]),
    ...dues.map((d) => [debtDue(d), debtDueRow(d)]),
  ].sort((a, b) => a[0].localeCompare(b[0])).slice(0, 5);
  const monthly = sum(paySubs(), subMonthly);
  return `<div class="card"><div class="card-head"><h3>Próximos pagos</h3><button class="link" data-action="tab" data-tab="subs">Ver todo</button></div>
    ${items.length ? items.map((x) => x[1]).join('') : '<p class="lead">Nada se cobra en los próximos 14 días.</p>'}
    ${monthly ? `<p class="card-note">Suscripciones: ${fmt(monthly)} al mes · ${fmt(monthly * 12)} al año</p>` : ''}</div>`;
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
  const debts = debtTotal();
  if (debts > 0 && avgInc > 0) {
    const pay = sum(state.debts.filter((d) => debtBalance(d) > 0), (d) => d.payment || 0);
    if (pay > 0) items.push(['Pagos de deuda', pct(pay / avgInc), 'de tus ingresos mensuales (sano: menos de 30%)', pay / avgInc > 0.35 ? 'neg' : pay / avgInc > 0.3 ? 'warn' : 'pos']);
  }
  const subs = sum(paySubs(), subMonthly);
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
    list = list.filter((t) => norm([t.note, catName(t.categoryId), acc(t.accountId)?.name, acc(t.toAccountId)?.name, t.amount, ...(t.tags || []).map((x) => '#' + x)].join(' ')).includes(q));
  }
  if (!list.length) {
    return ui.query || ui.filter !== 'all'
      ? '<div class="empty"><p>Sin resultados.</p></div>'
      : `<div class="empty"><h3>Sin movimientos</h3><p>Registra tus gastos e ingresos de ${esc(monthLabel(ui.month).toLowerCase())} con el botón +.</p></div>`;
  }
  list.sort((a, b) => b.date.localeCompare(a.date) || (b.created || 0) - (a.created || 0));
  let head = '';
  if (ui.query.trim()) {
    const out = sum(list.filter((t) => t.type === 'expense'), (t) => t.amount), inn = sum(list.filter((t) => t.type === 'income'), (t) => t.amount);
    head = `<p class="search-sum">${list.length} resultado${list.length === 1 ? '' : 's'}${out ? ` · gastos ${fmt(out)}` : ''}${inn ? ` · ingresos ${fmt(inn)}` : ''}</p>`;
  }
  const tagsUsed = [...new Set(list.flatMap((t) => t.tags || []))].slice(0, 10);
  if (!ui.query.trim() && tagsUsed.length) head = `<div class="tag-row">${tagsUsed.map((x) => `<button class="tag" data-action="tag" data-t="${esc(x)}">#${esc(x)}</button>`).join('')}</div>`;
  const groups = new Map();
  for (const t of list) { if (!groups.has(t.date)) groups.set(t.date, []); groups.get(t.date).push(t); }
  return head + [...groups].map(([d, items]) => {
    const net = sum(items, (t) => (t.type === 'income' ? t.amount : t.type === 'expense' ? -t.amount : 0));
    return `<div class="group-h"><span>${esc(dayLabel(d))}</span><span>${net ? fmt(net) : ''}</span></div><div class="list">${items.map(txRow).join('')}</div>`;
  }).join('');
}

function planSeg() {
  return `<div class="seg" style="margin:4px 0 6px">${[['goals', 'Metas'], ['debts', 'Deudas']].map(([k, l]) => `<button class="${ui.plan === k ? 'on' : ''}" data-action="plan" data-k="${k}">${l}</button>`).join('')}</div>`;
}

function viewDebts() {
  const open = state.debts.filter((d) => debtBalance(d) > 0);
  const done = state.debts.filter((d) => debtBalance(d) <= 0);
  const total = debtTotal();
  let body;
  if (!state.debts.length) {
    body = `<div class="empty"><h3>Sal de deudas con un plan</h3><p>Préstamos, créditos o dinero que debes. Te decimos cuándo quedas libre y cuánto pagas de intereses.</p><button class="btn primary" data-action="new-debt">Agregar deuda</button></div>`;
  } else {
    const pay = sum(open, (d) => d.payment || 0);
    const plans = open.map((d) => payoff(debtBalance(d), d.rate, d.payment));
    const allPlanned = plans.length && plans.every((p) => p && !p.never);
    const free = allPlanned ? plans.reduce((a, p) => (p.date > a ? p.date : a), today()) : null;
    const interest = allPlanned ? sum(plans, (p) => p.interest) : 0;
    const order = debtOrder();
    body = `
      <section class="hero" style="padding-bottom:14px">
        <p class="eyebrow">Deuda total</p>
        <p class="hero-amount">${fmtHero(total)}</p>
        <div class="hero-sub">${pay ? `<span><b>${fmt(pay)}</b> al mes</span>` : '<span>Sin pagos definidos</span>'}${free && total > 0 ? `<span class="sep-dot"></span><span>Libre en <b>${cap(clean(fMonthYear.format(parseISO(free))))}</b></span>` : ''}</div>
        ${interest > 0 ? `<p class="card-note">Intereses estimados por pagar: ${fmt(interest)}</p>` : ''}
      </section>
      ${order.length > 1 ? `<div class="card"><div class="card-head"><h3>Orden de pago</h3></div>
        <div class="seg sm">${[['avalanche', 'Avalancha'], ['snowball', 'Bola de nieve']].map(([k, l]) => `<button class="${state.settings.debtStrategy === k ? 'on' : ''}" data-action="debt-strategy" data-k="${k}">${l}</button>`).join('')}</div>
        <p class="card-note" style="margin:10px 0 4px">${state.settings.debtStrategy === 'snowball' ? 'Liquida primero la más pequeña: ganas impulso rápido.' : 'Liquida primero la de mayor tasa: pagas menos intereses.'} Paga el mínimo en las demás y todo lo extra a la primera.</p>
        ${order.map((d, i) => `<div class="meter"><div class="meter-top"><span><i class="dot" style="--c:${d.color}"></i>${i + 1}. ${esc(d.name)}</span><span>${fmt(debtBalance(d))}${d.rate ? ` · ${d.rate}%` : ''}</span></div></div>`).join('')}</div>` : ''}
      ${open.map(debtCard).join('')}
      ${done.length ? `<p class="section-h">Liquidadas</p>${done.map(debtCard).join('')}` : ''}
      <p class="foot">Para tarjetas de crédito que usas a diario, mejor crea una cuenta de tipo crédito.</p>`;
  }
  return { title: 'Metas', body: planSeg() + body };
}

function viewGoals() {
  if (ui.plan === 'debts') return viewDebts();
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
  return { title: 'Metas', body: planSeg() + body };
}

function viewSubs() {
  const all = [...activeSubs(), ...state.subscriptions.filter((s) => !s.active)];
  const subs = all.filter((s) => s.kind !== 'income');
  const incomes = all.filter((s) => s.kind === 'income');
  const monthly = sum(paySubs(), subMonthly);
  const monthlyIn = sum(incomeSubs(), subMonthly);
  const st = notifStatus();
  const needsNotif = subs.length && !(st === 'granted' && state.settings.notify);
  let body;
  if (!all.length) {
    body = `<div class="empty"><h3>Pagos e ingresos fijos</h3><p>Streaming, gimnasio, renta… y también tu quincena. Te avisamos antes de cada cobro y se anotan solos.</p><button class="btn primary" data-action="new-sub">Agregar</button></div>`;
  } else {
    body = `
      <section class="hero" style="padding-bottom:14px">
        <p class="eyebrow">Gasto recurrente</p>
        <p class="hero-amount">${fmtHero(monthly)}<span class="cents"> /mes</span></p>
        <div class="hero-sub"><span><b>${fmt(monthly * 12)}</b> al año</span><span class="sep-dot"></span><span>${paySubs().length} activa${paySubs().length === 1 ? '' : 's'}</span>${monthlyIn ? `<span class="sep-dot"></span><span>Ingresos fijos <b class="pos">${fmt(monthlyIn)}</b>/mes</span>` : ''}</div>
      </section>
      ${needsNotif ? `<div class="card hint-card"><div><b>Activa los avisos</b><p>${st === 'install' ? 'En iPhone los avisos funcionan cuando la app está agregada a tu pantalla de inicio.' : st === 'denied' ? 'Las notificaciones están bloqueadas. Actívalas en Configuración › Notificaciones › Kazoo.' : 'Recibe una notificación antes de cada cobro.'}</p>
        ${st === 'default' || (st === 'granted' && !state.settings.notify) ? `<div style="margin-top:12px"><button class="btn secondary small" data-action="notify-enable">Activar avisos</button></div>` : ''}</div></div>` : ''}
      ${subs.length ? `<p class="section-h">Pagos por fecha de cobro</p><div class="list">${subs.map(subRow).join('')}</div>` : ''}
      ${incomes.length ? `<p class="section-h">Ingresos fijos</p><div class="list">${incomes.map(subRow).join('')}</div>` : ''}
      ${!incomes.length ? `<p class="foot">¿Tienes sueldo fijo? Agrégalo con el botón + como <b>ingreso</b> y se anotará solo.</p>` : ''}`;
  }
  return {
    title: 'Suscripciones',
    actions: state.subscriptions.length ?`<button class="icon-btn" data-action="ics" aria-label="Agregar al calendario">${icon('calendar')}</button>` : '',
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
        ${nav('accounts', 'Cuentas', `${state.accounts.length} · ${fmt(cash(b))}`)}
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
      <p class="section-h">Sincronización</p>
      <div class="list">
        ${syncCfg().token
          ? `<button class="row plain" data-action="sync-now"><span class="row-main"><span class="row-title">Sincronizar ahora</span><span class="row-sub">${syncStatusText()}</span></span><span class="row-val">${icon('cloud')}</span></button>
             <button class="row plain" data-action="sync-off"><span class="row-main"><span class="row-title neg">Desconectar este dispositivo</span></span></button>`
          : `<button class="row plain" data-action="sync-setup"><span class="row-main"><span class="row-title">Sincronizar entre dispositivos</span><span class="row-sub">Copia cifrada en tu cuenta de GitHub</span></span><span class="row-val">Configurar${icon('right')}</span></button>`}
      </div>
      <p class="section-h">Seguridad</p>
      <div class="list">
        <button class="row plain" data-action="pin"><span class="row-main"><span class="row-title">Código de acceso</span><span class="row-sub">Pide un código de 4 dígitos al abrir</span></span><span class="row-val">${s.pinHash ? 'Activado' : 'Desactivado'}${icon('right')}</span></button>
      </div>
      <p class="section-h">Datos <span>${backup}</span></p>
      <div class="list">
        <button class="row plain" data-action="export"><span class="row-main"><span class="row-title">Exportar respaldo</span><span class="row-sub">Archivo .json con toda tu información y fotos de tickets</span></span><span class="row-val">${icon('right')}</span></button>
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

// ───────────────────────── Etiquetas y tickets ─────────────────────────
const parseTags = (v) => [...new Set(String(v || '').split(/[,\n]/).map((x) => norm(x).replace(/^#+/, '').trim().replace(/\s+/g, '-')).filter(Boolean))].slice(0, 6);
function topTags() {
  const c = {};
  for (const t of state.transactions) for (const x of t.tags || []) c[x] = (c[x] || 0) + 1;
  return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 8).map((x) => x[0]);
}

// Las fotos viven en IndexedDB (localStorage es muy pequeño para imágenes).
const idb = (() => {
  let p;
  const open = () => (p ||= new Promise((res, rej) => {
    const r = indexedDB.open('kazoo-cash', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('receipts');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  const run = async (mode, fn) => {
    const db = await open();
    return new Promise((res, rej) => {
      const tx = db.transaction('receipts', mode);
      const req = fn(tx.objectStore('receipts'));
      tx.oncomplete = () => res(req?.result);
      tx.onerror = () => rej(tx.error);
    });
  };
  return {
    get: (k) => run('readonly', (s) => s.get(k)),
    set: (k, v) => run('readwrite', (s) => s.put(v, k)),
    del: (k) => run('readwrite', (s) => s.delete(k)),
    keys: () => run('readonly', (s) => s.getAllKeys()),
    clear: () => run('readwrite', (s) => s.clear()),
  };
})();

async function compressImage(file, max = 1400, quality = 0.72) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * s);
    c.height = Math.round(img.naturalHeight * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', quality);
  } finally { URL.revokeObjectURL(url); }
}

function viewImage(src) {
  const el = document.createElement('div');
  el.className = 'viewer';
  el.innerHTML = `<img src="${src}" alt="Ticket"><button class="icon-btn" aria-label="Cerrar">${icon('x')}</button>`;
  el.addEventListener('click', () => { el.classList.remove('show'); setTimeout(() => el.remove(), 200); });
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
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

function ask({ title, text = '', ok = 'Aceptar', cancel = 'Cancelar', danger = false }) {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'alert-wrap';
    el.innerHTML = `<div class="alert" role="alertdialog"><h3>${esc(title)}</h3>${text ? `<p>${esc(text)}</p>` : ''}
      <div class="alert-btns"><button data-r="0">${esc(cancel)}</button><button data-r="1" class="${danger ? 'neg' : ''}">${esc(ok)}</button></div></div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-r]');
      if (!b && e.target !== el) return;
      el.classList.remove('show');
      setTimeout(() => el.remove(), 200);
      resolve(b ? b.dataset.r === '1' : null);
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
    <label class="field"><span>Etiquetas</span><input name="tags" placeholder="viaje, trabajo…" autocapitalize="off" autocorrect="off" value="${esc((t.tags || []).join(', '))}"></label>
    ${topTags().length ? `<div class="tag-row" id="tag-suggest">${topTags().map((x) => `<button type="button" class="tag" data-add-tag="${esc(x)}">#${esc(x)}</button>`).join('')}</div>` : ''}
    <div id="rc"></div>
    <input type="file" accept="image/*" id="rc-file" hidden>
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
    const amt = f.elements.amount;
    const fit = () => { amt.style.width = `${Math.max(1, (amt.value || amt.placeholder).length) + 0.4}ch`; };
    fit();
    amt.addEventListener('input', fit);
    // Ticket
    let pending = null, removed = false;
    const rc = $('#rc', sh), file = $('#rc-file', sh);
    const drawReceipt = async () => {
      const src = pending || (!removed && t.receipt ? await idb.get(t.receipt).catch(() => null) : null);
      rc.innerHTML = src
        ? `<div class="receipt"><img src="${src}" alt="Ticket" data-view-receipt><div><b>Foto del ticket</b><button type="button" class="link" data-rc="change">Cambiar</button> · <button type="button" class="link neg" data-rc="remove">Quitar</button></div></div>`
        : `<button type="button" class="btn secondary" data-rc="add">${icon('clip')} Adjuntar foto del ticket</button>`;
    };
    drawReceipt();
    rc.addEventListener('click', (e) => {
      const b = e.target.closest('[data-rc]');
      if (e.target.closest('[data-view-receipt]')) return viewImage(e.target.src);
      if (!b) return;
      if (b.dataset.rc === 'remove') { pending = null; removed = true; drawReceipt(); } else file.click();
    });
    file.addEventListener('change', async () => {
      const fl = file.files[0]; file.value = '';
      if (!fl) return;
      try { pending = await compressImage(fl); removed = false; drawReceipt(); } catch { toast('No se pudo leer la imagen'); }
    });
    sh.addEventListener('click', (e) => {
      const b = e.target.closest('[data-add-tag]');
      if (!b) return;
      const cur = parseTags(f.elements.tags.value);
      if (!cur.includes(b.dataset.addTag)) cur.push(b.dataset.addTag);
      f.elements.tags.value = cur.join(', ');
    });
    f.addEventListener('change', (e) => {
      if (e.target.name === 'type') draw();
      if (e.target.name === 'categoryId') t.categoryId = e.target.value;
      if (e.target.name === 'accountId') t.accountId = e.target.value;
      if (e.target.name === 'toAccountId') t.toAccountId = e.target.value;
    });
    f.addEventListener('submit', async (e) => {
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
      const tags = parseTags(fd.get('tags'));
      if (tags.length) rec.tags = tags;
      rec.receipt = t0?.receipt || null;
      try {
        if (pending) {
          const id = uid();
          await idb.set(id, pending);
          if (rec.receipt) idb.del(rec.receipt).catch(() => {});
          rec.receipt = id;
        } else if (removed && rec.receipt) { idb.del(rec.receipt).catch(() => {}); rec.receipt = null; }
      } catch { toast('No se pudo guardar la foto'); }
      if (!rec.receipt) delete rec.receipt;
      for (const k of ['subId', 'debtId', 'goalId']) if (t0?.[k]) rec[k] = t0[k];
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
    <label class="field"><span>¿Dónde guardas este ahorro?</span><select name="accountId"><option value="">En ninguna cuenta en especial</option>${opts(state.accounts.map((a) => [a.id, a.name]), g.accountId)}</select></label>
    <p class="hint-text">Si eliges una cuenta, al aportar podrás mover el dinero desde otra cuenta con una transferencia real.</p>
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
      const accountId = fd.get('accountId') || null;
      if (g0) Object.assign(g0, { name, target, deadline: fd.get('deadline') || null, color: fd.get('color') || g.color, accountId });
      else {
        const init = parseAmount(fd.get('initial'));
        const goal = { id: uid(), name, target, deadline: fd.get('deadline') || null, color: fd.get('color') || g.color, accountId, created: today(), archived: false, history: [] };
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
  const linked = g.accountId ? acc(g.accountId) : null;
  if (linked) kv.push(['Guardado en', esc(linked.name)]);
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
      ${linked ? `<label class="field"><span id="gc-acc-l">Desde la cuenta</span><select name="from"><option value="">No mover dinero (solo apartar)</option>${opts(state.accounts.filter((a) => a.id !== g.accountId).map((a) => [a.id, a.name]), state.accounts.find((a) => a.id !== g.accountId)?.id)}</select></label>
        <p class="hint-text">Se registra una transferencia hacia ${esc(linked.name)}.</p>` : ''}
      <button class="btn primary" type="submit">Registrar</button>
    </form>
    ${hist.length ? `<p class="sub-h">Historial</p><div class="list">${hist.map((h) => `<button class="row plain" data-action="goal-hist-del" data-id="${g.id}" data-h="${h.id}"><span class="row-main"><span class="row-title">${esc(h.note || (h.amount >= 0 ? 'Aportación' : 'Retiro'))}</span><span class="row-sub">${shortDate(h.date)}</span></span><span class="row-amt ${h.amount >= 0 ? 'pos' : ''}">${fmt(h.amount, h.amount >= 0 ? '+' : '-')}</span></button>`).join('')}</div>` : ''}
    <div class="btn-row" style="margin-top:20px">
      <button class="btn secondary" data-action="goal-edit" data-id="${g.id}">Editar</button>
      <button class="btn secondary" data-action="goal-archive" data-id="${g.id}">${g.archived ? 'Restaurar' : 'Archivar'}</button>
    </div>
    <button class="btn danger" data-action="goal-delete" data-id="${g.id}" style="margin-top:6px">Eliminar meta</button>`, (sh) => {
    const f = $('#gcf', sh);
    f.addEventListener('change', (e) => {
      if (e.target.name === 'dir' && $('#gc-acc-l', sh)) {
        const out = e.target.value === '-1';
        $('#gc-acc-l', sh).textContent = out ? 'Hacia la cuenta' : 'Desde la cuenta';
        $('#gc-acc-l', sh).closest('.field').nextElementSibling.textContent = out ? `Se registra una transferencia desde ${linked.name}.` : `Se registra una transferencia hacia ${linked.name}.`;
      }
    });
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(f);
      const amount = parseAmount(fd.get('amount'));
      if (!(amount > 0)) return nudge(f.elements.amount);
      const dir = +fd.get('dir');
      if (dir < 0 && amount > p.saved + 0.001) return toast('No puedes retirar más de lo ahorrado');
      const wasDone = p.done;
      const note = String(fd.get('note') || '').trim();
      const entry = { id: uid(), date: today(), amount: round2(dir * amount), note };
      const other = linked && fd.get('from');
      if (other) {
        const tx = { id: uid(), type: 'transfer', amount, date: today(), accountId: dir > 0 ? other : g.accountId, toAccountId: dir > 0 ? g.accountId : other, note: `Meta: ${g.name}`, goalId: g.id, created: Date.now() };
        state.transactions.push(tx);
        entry.txId = tx.id;
      }
      g.history.push(entry);
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
  s.kind ||= 'expense';
  const catsOf = (k) => state.categories.filter((c) => c.kind === k).map((c) => [c.id, c.name]);
  const expCats = catsOf(s.kind);
  openSheet(s0 ? s0.name : 'Nuevo recurrente', `<form class="form" id="sf" autocomplete="off" novalidate>
    <div class="seg">${[['expense', 'Pago o suscripción'], ['income', 'Ingreso fijo']].map(([v, l]) => `<label><input type="radio" name="kind" value="${v}" ${s.kind === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>
    <label class="field"><span>Nombre</span><input name="name" maxlength="40" placeholder="${s.kind === 'income' ? 'Quincena, renta que cobro…' : 'Netflix, gimnasio, renta…'}" value="${esc(s.name)}"></label>
    <div class="grid2">
      <label class="field"><span>Monto</span><input name="amount" inputmode="decimal" placeholder="0" value="${s.amount || ''}"></label>
      <label class="field"><span>Frecuencia</span><select name="cycle">${opts(CYCLES, s.cycle)}</select></label>
    </div>
    <div class="grid2">
      <label class="field"><span id="sf-next-l">${s.kind === 'income' ? 'Próximo depósito' : 'Próximo cobro'}</span><input type="date" name="next" value="${s.next}"></label>
      <label class="field" id="sf-remind" ${s.kind === 'income' ? 'hidden' : ''}><span>Avisarme</span><select name="remind">${opts(REMIND, s.remind)}</select></label>
    </div>
    <div class="grid2">
      <label class="field"><span id="sf-acc-l">${s.kind === 'income' ? 'Se deposita en' : 'Se cobra en'}</span><select name="accountId">${opts(state.accounts.map((a) => [a.id, a.name]), s.accountId)}</select></label>
      <label class="field"><span>Categoría</span><select name="categoryId">${opts(expCats, s.categoryId)}</select></label>
    </div>
    <div class="field"><span>Color</span>${swatches('color', s.color)}</div>
    ${s0 ? `<label class="row plain" style="padding:4px 4px"><span class="row-main"><span class="row-title">Activa</span><span class="row-sub">Pausa para dejar de contarla y de avisarte</span></span><span class="switch"><input type="checkbox" name="active" ${s.active ? 'checked' : ''}><span></span></span></label>` : ''}
    <button class="btn primary" type="submit">${s0 ? 'Guardar cambios' : 'Agregar'}</button>
    ${s0 && s0.active ? `<button class="btn secondary" type="button" data-action="sub-charge" data-id="${s0.id}">${s0.kind === 'income' ? 'Registrar depósito de hoy' : 'Registrar cobro de hoy'}</button>` : ''}
    ${s0 ? `<button class="btn danger" type="button" data-action="sub-delete" data-id="${s0.id}">Eliminar</button>` : ''}
  </form>`, (sh) => {
    const f = $('#sf', sh);
    f.addEventListener('change', (e) => {
      if (e.target.name !== 'kind') return;
      const inc = e.target.value === 'income';
      $('#sf-next-l', sh).textContent = inc ? 'Próximo depósito' : 'Próximo cobro';
      $('#sf-acc-l', sh).textContent = inc ? 'Se deposita en' : 'Se cobra en';
      $('#sf-remind', sh).hidden = inc;
      f.elements.name.placeholder = inc ? 'Quincena, renta que cobro…' : 'Netflix, gimnasio, renta…';
      const cats = catsOf(inc ? 'income' : 'expense');
      f.elements.categoryId.innerHTML = opts(cats, inc ? (cat('c-salary') ? 'c-salary' : cats[0]?.[0]) : (cat('c-subs') ? 'c-subs' : cats[0]?.[0]));
      if (inc && f.elements.cycle.value === '1m' && !s0) f.elements.cycle.value = '1q';
    });
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(f);
      const name = String(fd.get('name') || '').trim();
      const amount = parseAmount(fd.get('amount'));
      let next = fd.get('next');
      if (!name) return nudge(f.elements.name);
      if (!(amount > 0)) return nudge(f.elements.amount);
      if (!next) return nudge(f.elements.next);
      if (fd.get('cycle') === '1q') { const d = parseISO(next); const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); if (d.getDate() !== 15 && d.getDate() !== last) next = nextQuincena(addDays(next, -1)); }
      const rec = { kind: fd.get('kind') || 'expense', name, amount, cycle: fd.get('cycle'), next, anchorDay: parseISO(next).getDate(), accountId: fd.get('accountId'), categoryId: fd.get('categoryId'), remind: +fd.get('remind'), color: fd.get('color') || s.color, active: s0 ? fd.get('active') === 'on' : true };
      if (s0) Object.assign(s0, rec); else state.subscriptions.push({ id: uid(), created: today(), ...rec });
      save();
      const n = processDueSubs();
      closeSheet(); refresh(); checkReminders();
      toast(n ? `Guardada · ${n} cobro${n > 1 ? 's' : ''} registrado${n > 1 ? 's' : ''}` : s0 ? 'Cambios guardados' : 'Suscripción agregada');
    });
    if (!s0) f.elements.name.focus();
  });
}

// Deudas
function debtForm(id) {
  const d0 = id ? byId(state.debts, id) : null;
  const used = state.debts.map((d) => d.color);
  const d = d0 || { name: '', start: '', rate: '', payment: '', dueDay: '', color: PALETTE.find((c) => !used.includes(c) && c !== PALETTE[1]) || PALETTE[3] };
  openSheet(d0 ? 'Editar deuda' : 'Nueva deuda', `<form class="form" id="df" autocomplete="off" novalidate>
    <label class="field"><span>Nombre</span><input name="name" maxlength="40" placeholder="Préstamo auto, crédito personal…" value="${esc(d.name)}"></label>
    <div class="grid2">
      <label class="field"><span>${d0 ? 'Monto original' : 'Lo que debes hoy'}</span><input name="start" inputmode="decimal" placeholder="0" value="${d.start || ''}"></label>
      <label class="field"><span>Tasa anual (%)</span><input name="rate" inputmode="decimal" placeholder="0" value="${d.rate || ''}"></label>
    </div>
    <div class="grid2">
      <label class="field"><span>Pago mensual</span><input name="payment" inputmode="decimal" placeholder="0" value="${d.payment || ''}"></label>
      <label class="field"><span>Día de pago</span><input name="dueDay" inputmode="numeric" placeholder="Ej. 5" maxlength="2" value="${d.dueDay || ''}"></label>
    </div>
    <p class="hint-text">Con el día de pago te avisamos antes de que venza. La tasa sirve para calcular intereses y cuándo quedas libre.</p>
    <div class="field"><span>Color</span>${swatches('color', d.color)}</div>
    <button class="btn primary" type="submit">${d0 ? 'Guardar cambios' : 'Agregar deuda'}</button>
  </form>`, (sh) => {
    const f = $('#df', sh);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(f);
      const name = String(fd.get('name') || '').trim();
      const start = parseAmount(fd.get('start'));
      const rate = parseAmount(fd.get('rate')) || 0;
      const payment = parseAmount(fd.get('payment')) || 0;
      const dueDay = clamp(parseInt(fd.get('dueDay'), 10) || 0, 0, 31) || null;
      if (!name) return nudge(f.elements.name);
      if (!(start > 0)) return nudge(f.elements.start);
      if (rate < 0 || rate > 500) return nudge(f.elements.rate);
      const rec = { name, start, rate, payment, dueDay, color: fd.get('color') || d.color };
      if (d0) Object.assign(d0, rec);
      else state.debts.push({ id: uid(), created: today(), history: [], ...rec });
      save(); refresh();
      if (d0) debtDetail(d0.id); else { closeSheet(); ui.plan = 'debts'; refresh(); toast('Deuda agregada'); checkReminders(); }
    });
    if (!d0) f.elements.name.focus();
  });
}

function debtDetail(id) {
  const d = byId(state.debts, id);
  if (!d) return closeSheet();
  const bal = debtBalance(d), paid = debtPaid(d);
  const p = d.start > 0 ? clamp(1 - bal / d.start, 0, 1) : 0;
  const plan = payoff(bal, d.rate, d.payment);
  const kv = [['Saldo actual', fmt(bal)], ['Tasa anual', `${d.rate || 0}%`]];
  if (d.payment) kv.push(['Pago mensual', fmt(d.payment)]);
  if (d.dueDay && bal > 0) kv.push(['Próximo pago', `${shortDate(debtDue(d))} · ${relDays(debtDue(d)).toLowerCase()}`]);
  if (plan && !plan.never && bal > 0) {
    kv.push(['Quedas libre en', `${cap(clean(fMonthYear.format(parseISO(plan.date))))} · ${monthsLabel(plan.months)}`]);
    kv.push(['Intereses por pagar', fmt(plan.interest)]);
  } else if (plan?.never) kv.push(['Atención', '<span class="neg">El pago no cubre los intereses</span>']);
  const hist = [...d.history].sort((a, b) => b.date.localeCompare(a.date));
  openSheet(d.name, `
    <div class="goal-hero">${ring(p, d.color, 150, 7)}<div><b>${Math.floor(p * 100)}%</b><p class="muted" style="font-size:12px">pagado</p></div></div>
    <p class="center big-line">${fmt(bal)} <span class="muted">por pagar</span></p>
    ${bal <= 0 ? '<p class="center pos" style="margin-top:6px">Deuda liquidada</p>' : ''}
    <div class="kv">${kv.map(([k, v]) => `<div><span>${k}</span><span>${v}</span></div>`).join('')}</div>
    ${bal > 0 ? `<div class="card sim"><div class="card-head"><h3>¿Y si pagas más?</h3></div>
      <div class="field"><input id="sim" inputmode="decimal" placeholder="Pago mensual, ej. ${fmt((d.payment || bal / 12) * 1.5)}" aria-label="Pago simulado"></div>
      <p class="card-note" id="sim-out">Escribe un pago mensual para comparar.</p></div>` : ''}
    <form class="form" id="dpf" autocomplete="off" novalidate style="margin-top:16px">
      <div class="seg"><label><input type="radio" name="op" value="pay" checked><span>Registrar pago</span></label><label><input type="radio" name="op" value="adjust"><span>Ajustar saldo</span></label></div>
      <label class="field"><span id="dp-l">Monto pagado</span><input name="amount" inputmode="decimal" placeholder="${d.payment || 0}"></label>
      <label class="field" id="dp-acc"><span>Pagado desde</span><select name="accountId"><option value="">No registrar gasto</option>${opts(state.accounts.map((a) => [a.id, a.name]), acc(state.settings.lastAccount) ? state.settings.lastAccount : state.accounts[0]?.id)}</select></label>
      <p class="hint-text" id="dp-h">Se anota como gasto en la categoría Deudas.</p>
      <button class="btn primary" type="submit">Registrar</button>
    </form>
    ${hist.length ? `<p class="sub-h">Historial</p><div class="list">${hist.map((h) => `<button class="row plain" data-action="debt-hist-del" data-id="${d.id}" data-h="${h.id}"><span class="row-main"><span class="row-title">${esc(h.note || (h.adjust ? 'Ajuste de saldo' : 'Pago'))}</span><span class="row-sub">${shortDate(h.date)}</span></span><span class="row-amt ${h.adjust ? 'muted' : 'pos'}">${h.adjust ? (h.amount >= 0 ? fmt(h.amount, '-') : fmt(-h.amount, '+')) : fmt(h.amount)}</span></button>`).join('')}</div>` : ''}
    <div class="btn-row" style="margin-top:20px"><button class="btn secondary" data-action="debt-edit" data-id="${d.id}">Editar</button></div>
    <button class="btn danger" data-action="debt-delete" data-id="${d.id}" style="margin-top:6px">Eliminar deuda</button>`, (sh) => {
    const sim = $('#sim', sh);
    sim?.addEventListener('input', () => {
      const v = parseAmount(sim.value), out = $('#sim-out', sh);
      if (!(v > 0)) { out.textContent = 'Escribe un pago mensual para comparar.'; return; }
      const r = payoff(bal, d.rate, v);
      if (r.never) { out.innerHTML = '<span class="neg">Con ese pago la deuda nunca baja: no cubre los intereses.</span>'; return; }
      let txt = `Quedas libre en ${monthsLabel(r.months)} (${clean(fMonthYear.format(parseISO(r.date)))}) y pagas ${fmt(r.interest)} de intereses.`;
      if (plan && !plan.never && plan.months !== r.months) {
        const saved = plan.interest - r.interest, dm = plan.months - r.months;
        txt += dm > 0 ? ` Terminas ${monthsLabel(dm)} antes y ahorras ${fmt(saved)}.` : ` Tardas ${monthsLabel(-dm)} más.`;
      }
      out.textContent = txt;
    });
    const f = $('#dpf', sh);
    f.addEventListener('change', (e) => {
      if (e.target.name !== 'op') return;
      const adj = e.target.value === 'adjust';
      $('#dp-l', sh).textContent = adj ? 'Saldo actual según tu estado de cuenta' : 'Monto pagado';
      $('#dp-acc', sh).hidden = adj;
      $('#dp-h', sh).textContent = adj ? 'Úsalo cuando se sumen intereses o cargos. No crea movimientos.' : 'Se anota como gasto en la categoría Deudas.';
      f.elements.amount.placeholder = adj ? String(bal) : String(d.payment || 0);
    });
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(f);
      const amount = parseAmount(fd.get('amount'));
      if (fd.get('op') === 'adjust') {
        if (!(amount >= 0)) return nudge(f.elements.amount);
        d.history.push({ id: uid(), date: today(), amount: round2(bal - amount), adjust: true, note: 'Ajuste de saldo' });
      } else {
        if (!(amount > 0)) return nudge(f.elements.amount);
        const entry = { id: uid(), date: today(), amount, note: '' };
        const accountId = fd.get('accountId');
        if (accountId) {
          const tx = { id: uid(), type: 'expense', amount, date: today(), categoryId: cat('c-debt') ? 'c-debt' : null, accountId, note: `Pago ${d.name}`, debtId: d.id, created: Date.now() };
          state.transactions.push(tx);
          entry.txId = tx.id;
          state.settings.lastAccount = accountId;
        }
        d.history.push(entry);
        // se marca como avisado el vencimiento de este mes
        const due = debtDue(d);
        if (due && daysBetween(today(), due) <= 10) state.notified[`${d.id}|${due}`] = today();
      }
      save(); refresh(); checkReminders(); debtDetail(d.id);
      toast(debtBalance(d) <= 0 ? '¡Deuda liquidada! 🎉' : 'Registrado');
    });
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
    <div class="kv"><div><span>Total en cuentas</span><span>${fmt(cash(b))}</span></div></div>
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
  const due = paySubs().filter((s) => { const d = daysBetween(t, s.next); return d >= 0 && d <= (s.remind ?? state.settings.remindDays); });
  const debtsDue = state.debts.map((d) => ({ d, due: debtDue(d) })).filter(({ due }) => due && daysBetween(t, due) <= state.settings.remindDays);
  const count = due.length + debtsDue.length;
  try { if (navigator.setAppBadge) count ? await navigator.setAppBadge(count) : await navigator.clearAppBadge(); } catch {}
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
  for (const { d, due } of debtsDue) {
    const key = `${d.id}|${due}`;
    if (state.notified[key]) continue;
    const n = daysBetween(t, due);
    try {
      await notify(`Pago de ${d.name} ${n === 0 ? 'vence hoy' : n === 1 ? 'vence mañana' : `vence en ${n} días`}`, d.payment ? `${hidden() ? 'Pago' : money(d.payment)} · saldo ${hidden() ? '' : money(debtBalance(d))}` : 'Recuerda registrar tu pago', key);
      state.notified[key] = t;
      changed = true;
    } catch (e) { console.warn(e); }
  }
  // limpia registros viejos
  const cutoff = addDays(t, -60);
  for (const [k, v] of Object.entries(state.notified)) if (typeof v === 'string' && v < cutoff) { delete state.notified[k]; changed = true; }
  if (changed) save({ silent: true });
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
  const d_ = (iso) => iso.replace(/-/g, '');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kazoo Cash//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Kazoo · Cobros'];
  const alarm = (text, r) => ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${e(text)}`, `TRIGGER:${r === 0 ? 'PT9H' : r === 1 ? '-PT15H' : `-P${r - 1}DT15H`}`, 'END:VALARM']; // 9:00 a. m.
  for (const d of state.debts) {
    const due = debtDue(d);
    if (!due) continue;
    L.push('BEGIN:VEVENT', `UID:${d.id}@kazoo.cash`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${d_(due)}`, `DTEND;VALUE=DATE:${d_(addDays(due, 1))}`,
      `RRULE:FREQ=MONTHLY;BYMONTHDAY=${d.dueDay >= 29 ? -1 : d.dueDay}`, `SUMMARY:${e(`Pago ${d.name}${d.payment ? ' · ' + money(d.payment) : ''}`)}`, 'TRANSP:TRANSPARENT',
      ...alarm(`Pago de ${d.name} vence pronto`, state.settings.remindDays), 'END:VEVENT');
  }
  for (const s of activeSubs()) {
    const { n, u } = cycleParts(s.cycle);
    const inc = s.kind === 'income';
    const freq = { w: 'WEEKLY', m: 'MONTHLY', y: 'YEARLY', q: 'MONTHLY' }[u];
    const byDay = u === 'q' ? ';BYMONTHDAY=15,-1' : u === 'm' && (s.anchorDay || 0) >= 29 ? ';BYMONTHDAY=-1' : '';
    const r = s.remind ?? state.settings.remindDays;
    L.push('BEGIN:VEVENT', `UID:${s.id}@kazoo.cash`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${d_(s.next)}`, `DTEND;VALUE=DATE:${d_(addDays(s.next, 1))}`,
      `RRULE:FREQ=${freq};INTERVAL=${u === 'q' ? 1 : n}${byDay}`,
      `SUMMARY:${e(`${inc ? '+ ' : ''}${s.name} · ${money(s.amount)}`)}`,
      `DESCRIPTION:${e(`${inc ? 'Depósito' : 'Cobro'} ${cycleLabel(s.cycle).toLowerCase()} en ${acc(s.accountId)?.name || 'tu cuenta'}.`)}`,
      'TRANSP:TRANSPARENT',
      ...(inc ? [] : alarm(`${s.name} se cobra pronto`, r)),
      'END:VEVENT');
  }
  L.push('END:VCALENDAR');
  return L.join('\r\n');
}

async function exportICS() {
  if (!activeSubs().length && !state.debts.some(debtDue)) return toast('No hay pagos recurrentes activos');
  const ok = await ask({ title: 'Agregar al Calendario', text: 'Se creará un evento repetido por cada suscripción, ingreso fijo y pago de deuda, con alarma según la anticipación que elegiste. En iPhone elige “Guardar en Archivos” y abre el archivo, o compártelo a Calendario.', ok: 'Continuar' });
  if (ok) deliverFile('kazoo-cobros.ics', buildICS(), 'text/calendar');
}

async function exportBackup() {
  const receipts = {};
  for (const t of state.transactions) if (t.receipt) { const v = await idb.get(t.receipt).catch(() => null); if (v) receipts[t.receipt] = v; }
  const data = JSON.stringify({ app: 'kazoo-cash', exportedAt: new Date().toISOString(), ...state, receipts });
  const ok = await deliverFile(`kazoo-respaldo-${today()}.json`, data, 'application/json');
  if (!ok) return;
  state.settings.lastBackup = today();
  save({ silent: true }); refresh();
}

function exportCSV() {
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const type = { income: 'Ingreso', expense: 'Gasto', transfer: 'Transferencia' };
  const rows = [['Fecha', 'Tipo', 'Monto', 'Categoría', 'Cuenta', 'Cuenta destino', 'Nota', 'Etiquetas']];
  for (const t of [...state.transactions].sort((a, b) => a.date.localeCompare(b.date))) {
    rows.push([t.date, type[t.type], (t.type === 'expense' ? -t.amount : t.amount).toFixed(2), t.type === 'transfer' ? '' : catName(t.categoryId), acc(t.accountId)?.name, acc(t.toAccountId)?.name, t.note, (t.tags || []).join(' ')]);
  }
  deliverFile(`kazoo-movimientos-${today()}.csv`, '\uFEFF' + rows.map((r) => r.map(q).join(',')).join('\r\n'), 'text/csv');
}

async function importBackup(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!data || !Array.isArray(data.transactions) || !Array.isArray(data.accounts)) throw new Error('formato');
    const ok = await ask({ title: 'Restaurar respaldo', text: `Se reemplazarán tus datos actuales con ${data.transactions.length} movimientos y ${(data.goals || []).length} metas.`, ok: 'Restaurar', danger: true });
    if (!ok) return;
    const receipts = data.receipts || {};
    delete data.app; delete data.exportedAt; delete data.receipts;
    for (const [k, v] of Object.entries(receipts)) await idb.set(k, v).catch(() => {});
    state = migrate(data);
    _nfKey = null;
    save(); refresh(); toast('Respaldo restaurado');
  } catch { toast('El archivo no es un respaldo válido'); }
}

function resetAll() {
  try { localStorage.removeItem(KEY); } catch {}
  idb.clear().catch(() => {});
  disconnectSync();
  state = seed();
  _nfKey = null;
  save();
  $('#lock').classList.remove('show');
  closeSheet(); ui.tab = 'home'; render();
  toast('Datos borrados');
}

// ───────────────────────── Sincronización (gist secreto + cifrado AES) ─────────────────────────
// Los datos se cifran en el dispositivo con una frase del usuario antes de subirlos a GitHub.
const SYNC_KEY = 'kazoo.sync';
const SYNC_FILE = 'kazoo-cash.enc.json';
const LOCAL_SETTINGS = ['notify', 'installDismissed', 'lastAccount', 'hideAmounts', 'pinHash'];
let _sync;
function syncCfg() {
  if (!_sync) { try { _sync = JSON.parse(localStorage.getItem(SYNC_KEY)) || {}; } catch { _sync = {}; } }
  return _sync;
}
function saveSyncCfg() { try { localStorage.setItem(SYNC_KEY, JSON.stringify(_sync)); } catch {} }
function disconnectSync() { _sync = {}; try { localStorage.removeItem(SYNC_KEY); } catch {} }

const b64e = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const b64d = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const keyCache = new Map();
async function deriveKey(pass, salt) {
  const k = pass + '|' + b64e(salt);
  if (keyCache.has(k)) return keyCache.get(k);
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  keyCache.set(k, key);
  return key;
}
async function encryptState() {
  const cfg = syncCfg();
  if (!cfg.salt) { cfg.salt = b64e(crypto.getRandomValues(new Uint8Array(16))); saveSyncCfg(); }
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload = { ...state };
  delete payload.notified;
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await deriveKey(cfg.pass, b64d(cfg.salt)), new TextEncoder().encode(JSON.stringify(payload)));
  return JSON.stringify({ app: 'kazoo-cash', v: 1, updatedAt: state.meta.updatedAt, salt: cfg.salt, iv: b64e(iv), data: b64e(new Uint8Array(ct)) });
}
async function decryptEnvelope(env) {
  const cfg = syncCfg();
  try {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64d(env.iv) }, await deriveKey(cfg.pass, b64d(env.salt)), b64d(env.data));
    cfg.salt = env.salt;
    return JSON.parse(new TextDecoder().decode(pt));
  } catch { throw new Error('La frase de cifrado no coincide'); }
}

async function ghApi(path, opts = {}) {
  const res = await fetch('https://api.github.com' + path, {
    ...opts,
    cache: 'no-store',
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${syncCfg().token}`, 'X-GitHub-Api-Version': '2022-11-28', ...(opts.body ? { 'Content-Type': 'application/json' } : {}) },
  });
  if (!res.ok) throw new Error(res.status === 401 ? 'Token inválido o vencido' : res.status === 403 ? 'El token no tiene permiso de gist' : res.status === 404 ? 'No se encontró la copia en la nube' : `GitHub respondió ${res.status}`);
  return res.status === 204 ? null : res.json();
}
async function findGist() {
  for (let page = 1; page <= 5; page++) {
    const list = await ghApi(`/gists?per_page=100&page=${page}`);
    const g = list.find((x) => x.files?.[SYNC_FILE]);
    if (g) return g.id;
    if (list.length < 100) break;
  }
  return null;
}
async function readRemote() {
  const cfg = syncCfg();
  if (!cfg.gistId) return null;
  const g = await ghApi(`/gists/${cfg.gistId}`);
  const f = g.files?.[SYNC_FILE];
  if (!f) return null;
  const content = f.truncated ? await (await fetch(f.raw_url, { cache: 'no-store' })).text() : f.content;
  return JSON.parse(content);
}
async function writeRemote() {
  const cfg = syncCfg();
  const files = { [SYNC_FILE]: { content: await encryptState() } };
  if (cfg.gistId) await ghApi(`/gists/${cfg.gistId}`, { method: 'PATCH', body: JSON.stringify({ files }) });
  else {
    const g = await ghApi('/gists', { method: 'POST', body: JSON.stringify({ description: 'Kazoo Cash · respaldo cifrado', public: false, files }) });
    cfg.gistId = g.id;
  }
}
async function applyRemote(env) {
  const data = await decryptEnvelope(env);
  const keep = Object.fromEntries(LOCAL_SETTINGS.map((k) => [k, state.settings[k]]));
  const notified = state.notified;
  state = migrate(data);
  state.settings = { ...state.settings, ...keep };
  state.notified = notified;
  state.meta.updatedAt = env.updatedAt;
  _nfKey = null;
  save({ silent: true });
  refresh();
}
const isFresh = () => !state.transactions.length && !state.goals.length && !state.subscriptions.length && !state.debts.length;

let syncing = false, syncTimer;
function scheduleSync() {
  if (!syncCfg().token) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => syncNow(false), 3000);
}
async function syncNow(interactive) {
  const cfg = syncCfg();
  if (!cfg.token || syncing) return;
  if (!navigator.onLine) { if (interactive) toast('Sin conexión'); return; }
  syncing = true;
  if (interactive) toast('Sincronizando…');
  try {
    const remote = await readRemote();
    const localDirty = (state.meta.updatedAt || 0) > (cfg.localAt || 0);
    const remoteNewer = remote && remote.updatedAt > (cfg.remoteAt || 0);
    let action = !remote ? 'push' : remoteNewer && localDirty ? 'conflict' : remoteNewer ? 'pull' : localDirty ? 'push' : 'none';
    if (action === 'conflict' && isFresh()) action = 'pull';
    if (action === 'conflict') {
      if (!interactive) { cfg.conflict = true; saveSyncCfg(); return; }
      const useCloud = await ask({ title: 'Cambios en dos dispositivos', text: `La nube tiene cambios de ${timeAgo(remote.updatedAt)} y este dispositivo también cambió. ¿Qué versión conservas? La otra se reemplaza.`, ok: 'Usar la nube', cancel: 'Usar este' });
      if (useCloud === null) return;
      action = useCloud ? 'pull' : 'push';
    }
    if (action === 'pull') await applyRemote(remote);
    if (action === 'push') await writeRemote();
    cfg.remoteAt = action === 'pull' ? remote.updatedAt : action === 'push' ? state.meta.updatedAt : cfg.remoteAt;
    cfg.localAt = state.meta.updatedAt;
    cfg.lastSync = Date.now();
    cfg.conflict = false;
    cfg.error = null;
    saveSyncCfg();
    if (interactive) toast(action === 'pull' ? 'Datos actualizados desde la nube' : action === 'push' ? 'Copia en la nube actualizada' : 'Todo está al día');
  } catch (e) {
    cfg.error = e.message || 'Error de red';
    saveSyncCfg();
    if (interactive) toast(cfg.error);
  } finally {
    syncing = false;
    if (interactive || ui.tab === 'settings' || cfg.conflict || cfg.error) refresh();
  }
}
function timeAgo(ms) {
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 1) return 'hace un momento';
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
}
function syncStatusText() {
  const c = syncCfg();
  if (c.error) return `Error: ${esc(c.error)}`;
  if (c.conflict) return 'Hay cambios en otro dispositivo';
  return c.lastSync ? `Última sincronización ${timeAgo(c.lastSync)} · cifrada` : 'Pendiente';
}
function syncBanner() {
  const c = syncCfg();
  if (!c.token || !(c.conflict || c.error)) return '';
  return `<div class="card hint-card"><div><b>${c.conflict ? 'Hay cambios en otro dispositivo' : 'No se pudo sincronizar'}</b><p>${c.conflict ? 'Elige qué versión conservar.' : esc(c.error)}</p>
    <div style="margin-top:12px"><button class="btn secondary small" data-action="sync-now">Sincronizar ahora</button></div></div></div>`;
}
function syncSetupSheet() {
  openSheet('Sincronizar', `<form class="form" id="syf" autocomplete="off" novalidate>
    <p class="hint-text">Tus datos se cifran en este dispositivo con una frase que solo tú conoces y se guardan como un gist secreto en tu cuenta de GitHub. Nadie, ni GitHub, puede leerlos sin la frase.</p>
    <div class="kv">
      <div><span>1. Crea un token con permiso “gist”</span><a class="link" href="https://github.com/settings/tokens/new?scopes=gist&description=Kazoo%20Cash" target="_blank" rel="noopener">Abrir GitHub</a></div>
      <div><span>2. Pega el token y elige tu frase</span><span></span></div>
      <div><span>3. En tu otro dispositivo, usa los mismos</span><span></span></div>
    </div>
    <label class="field"><span>Token de GitHub</span><input name="token" type="password" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="ghp_…"></label>
    <label class="field"><span>Frase de cifrado</span><input name="pass" type="password" autocomplete="new-password" placeholder="Mínimo 8 caracteres"></label>
    <p class="hint-text">Si olvidas la frase, la copia en la nube no se puede leer. El token se guarda solo en este dispositivo. Las fotos de tickets no se sincronizan (van en el respaldo .json).</p>
    <button class="btn primary" type="submit">Conectar</button>
  </form>`, (sh) => {
    const f = $('#syf', sh);
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = f.elements.token.value.trim(), pass = f.elements.pass.value;
      if (token.length < 20) return nudge(f.elements.token);
      if (pass.length < 8) { toast('La frase debe tener al menos 8 caracteres'); return nudge(f.elements.pass); }
      const btn = f.querySelector('button[type=submit]');
      btn.disabled = true; btn.textContent = 'Conectando…';
      _sync = { token, pass };
      try {
        _sync.gistId = await findGist();
        saveSyncCfg();
        closeSheet();
        await syncNow(true);
      } catch (err) {
        disconnectSync();
        toast(err.message || 'No se pudo conectar');
        btn.disabled = false; btn.textContent = 'Conectar';
      }
    });
    f.elements.token.focus();
  });
}

// ───────────────────────── Acciones ─────────────────────────
const actions = {
  tab(el) {
    if (ui.tab === el.dataset.tab) return window.scrollTo({ top: 0, behavior: 'smooth' });
    ui.tab = el.dataset.tab;
    try { sessionStorage.setItem('kazoo.tab', ui.tab); } catch {}
    render(); window.scrollTo(0, 0);
  },
  fab() { ({ home: () => txSheet(), tx: () => txSheet(), goals: () => (ui.plan === 'debts' ? debtForm() : goalForm()), subs: () => subForm() })[ui.tab]?.(); },
  plan(el) { ui.plan = el.dataset.k; refresh(); },
  tag(el) { ui.query = '#' + el.dataset.t; const q = $('#q'); if (q) q.value = ui.query; $('#tx-list').innerHTML = txList(); },
  'new-debt'() { debtForm(); },
  debt(el) { debtDetail(el.dataset.id); },
  'debt-edit'(el) { debtForm(el.dataset.id); },
  'debt-strategy'(el) { state.settings.debtStrategy = el.dataset.k; save(); refresh(); },
  async 'debt-delete'(el) {
    if (!(await ask({ title: '¿Eliminar deuda?', text: 'Los pagos ya registrados como gasto se conservan.', ok: 'Eliminar', danger: true }))) return;
    state.debts = state.debts.filter((d) => d.id !== el.dataset.id);
    save(); closeSheet(); refresh(); checkReminders();
  },
  async 'debt-hist-del'(el) {
    const d = byId(state.debts, el.dataset.id);
    const h = d.history.find((x) => x.id === el.dataset.h);
    if (!(await ask({ title: '¿Eliminar registro?', text: h?.txId ? 'También se eliminará el gasto asociado.' : '', ok: 'Eliminar', danger: true }))) return;
    if (h?.txId) state.transactions = state.transactions.filter((t) => t.id !== h.txId);
    d.history = d.history.filter((x) => x.id !== el.dataset.h);
    save(); refresh(); debtDetail(d.id);
  },
  'sync-setup'() { syncSetupSheet(); },
  'sync-now'() { syncNow(true); },
  async 'sync-off'() {
    if (!(await ask({ title: '¿Desconectar?', text: 'Tus datos se quedan en este dispositivo y la copia en la nube no se borra.', ok: 'Desconectar', danger: true }))) return;
    disconnectSync(); refresh(); toast('Sincronización desconectada');
  },
  'toggle-hide'() { state.settings.hideAmounts = !state.settings.hideAmounts; save(); refresh(); },
  'dismiss-install'() { state.settings.installDismissed = true; save(); refresh(); },
  month(el) { ui.month = shiftMonth(ui.month, +el.dataset.d); refresh(); },
  'tx-filter'(el) { ui.filter = el.dataset.v; refresh(); },
  'new-tx'() { txSheet(); },
  'edit-tx'(el) { txSheet(el.dataset.id); },
  async 'tx-delete'(el) {
    if (!(await ask({ title: '¿Eliminar movimiento?', ok: 'Eliminar', danger: true }))) return;
    const t = byId(state.transactions, el.dataset.id);
    if (t?.receipt) idb.del(t.receipt).catch(() => {});
    for (const x of [...state.goals, ...state.debts]) x.history = x.history.filter((h) => h.txId !== el.dataset.id);
    state.transactions = state.transactions.filter((x) => x.id !== el.dataset.id);
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
    const h = g.history.find((x) => x.id === el.dataset.h);
    if (h?.txId) state.transactions = state.transactions.filter((t) => t.id !== h.txId);
    g.history = g.history.filter((x) => x.id !== el.dataset.h);
    save(); refresh(); goalDetail(g.id);
  },
  'toggle-archived'() { ui.showArchived = !ui.showArchived; refresh(); },
  'new-sub'() { subForm(); },
  'edit-sub'(el) { subForm(el.dataset.id); },
  async 'sub-charge'(el) {
    const s = byId(state.subscriptions, el.dataset.id);
    const inc = s.kind === 'income';
    if (!(await ask({ title: `Registrar ${inc ? 'depósito' : 'cobro'} de ${s.name}`, text: `Se anotará un ${inc ? 'ingreso' : 'gasto'} de ${money(s.amount)} con fecha de hoy y la próxima fecha se moverá al siguiente periodo.`, ok: 'Registrar' }))) return;
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
  syncNow(false);
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
