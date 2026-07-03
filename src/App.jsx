import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LayoutDashboard, Users, CalendarDays, Home, GraduationCap, Wallet, Award,
  Package, FileText, Settings, Plus, Search, X, Edit2, Trash2, ChevronRight,
  ChevronLeft, AlertTriangle, CheckCircle2, Clock, Phone, Mail, TrendingUp,
  Syringe, Hammer, Stethoscope, MapPin, Filter, Save, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';

/* ============================= DESIGN TOKENS ============================= */
const T = {
  forest: '#16241C',
  forestLight: '#213326',
  forestLine: '#2E4536',
  brass: '#B8863E',
  brassLight: '#D4A45F',
  brassDark: '#8F6A2E',
  paper: '#F7F5F0',
  card: '#FFFFFF',
  ink: '#26221C',
  inkSoft: '#6B6357',
  rust: '#A8452F',
  rustBg: '#F7E7E2',
  sage: '#5C7A52',
  sageBg: '#E9F0E4',
  amber: '#B4801E',
  amberBg: '#FBF0DA',
  line: '#E7E1D4',
};

const MANTELLI = {
  Baio: '#6B4226',
  Sauro: '#B5651D',
  Morello: '#231F1A',
  Grigio: '#A8A296',
  Pezzato: '#C9A66B',
  Palomino: '#D4A843',
  Roano: '#8C7A6B',
};

const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const euro = (n) => (Number(n) || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const fmtDate = (d) => { if (!d) return '—'; const dt = new Date(d); return dt.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }); };
const daysUntil = (d) => { if (!d) return null; const diff = (new Date(d) - new Date()) / 86400000; return Math.ceil(diff); };
const todayISO = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

function HorseshoeMark({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 22V12.5C6 8.36 8.69 5 12 5s6 3.36 6 7.5V22" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M9 22v-9.2C9 10.1 10.34 8 12 8s3 2.1 3 4.8V22" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
      {[6, 8.4, 10.8, 13.2, 15.6, 18].map((y, i) => (
        <circle key={i} cx={i < 3 ? 6.4 : 17.6} cy={y} r="0.55" fill={color} opacity="0.7" />
      ))}
    </svg>
  );
}

/* ============================= SMALL UI PRIMITIVES ============================= */
function Pill({ children, tone = 'neutral' }) {
  const map = {
    neutral: { bg: '#EFEBE1', fg: T.inkSoft },
    good: { bg: T.sageBg, fg: T.sage },
    warn: { bg: T.amberBg, fg: T.amber },
    bad: { bg: T.rustBg, fg: T.rust },
    brass: { bg: '#F1E4CB', fg: T.brassDark },
  };
  const s = map[tone] || map.neutral;
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap" style={{ background: s.bg, color: s.fg }}>
      {children}
    </span>
  );
}

function IconBtn({ onClick, title, children }) {
  return (
    <button onClick={onClick} title={title} className="p-2 rounded-lg hover:bg-stone-100 transition-colors text-stone-500 hover:text-stone-800">
      {children}
    </button>
  );
}

function PrimaryButton({ onClick, children, icon: Icon }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform active:scale-[0.98] shadow-sm"
      style={{ background: T.brass }}>
      {Icon && <Icon size={16} />} {children}
    </button>
  );
}

function SectionHeader({ eyebrow, title, action }) {
  return (
    <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
      <div>
        {eyebrow && <div className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: T.brassDark }}>{eyebrow}</div>}
        <h1 className="text-3xl font-serif" style={{ color: T.ink }}>{title}</h1>
      </div>
      {action}
    </div>
  );
}

function Card({ children, className = '', style = {} }) {
  return <div className={`rounded-2xl border ${className}`} style={{ borderColor: T.line, background: T.card, ...style }}>{children}</div>;
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="pl-9 pr-3 py-2.5 rounded-xl border text-sm w-64 focus:outline-none focus:ring-2 bg-white"
        style={{ borderColor: T.line, '--tw-ring-color': T.brassLight }} />
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: T.inkSoft }}>{label}</span>
      {children}
    </label>
  );
}
const inputCls = "w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 bg-white";
const inputStyle = { borderColor: T.line };

function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onEsc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(22,36,28,0.55)' }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[88vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl" style={{ borderColor: T.line }}>
          <h3 className="font-serif text-xl" style={{ color: T.ink }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400"><X size={18} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDelete({ label, onConfirm, onCancel }) {
  return (
    <Modal title="Conferma eliminazione" onClose={onCancel}>
      <p className="text-sm mb-5" style={{ color: T.inkSoft }}>Eliminare definitivamente <strong style={{ color: T.ink }}>{label}</strong>? L'operazione non è reversibile.</p>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: T.line }}>Annulla</button>
        <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: T.rust }}>Elimina</button>
      </div>
    </Modal>
  );
}

function EmptyState({ icon: Icon, text, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: T.paper }}>
        <Icon size={22} style={{ color: T.brass }} />
      </div>
      <div className="font-medium" style={{ color: T.ink }}>{text}</div>
      {sub && <div className="text-sm mt-1" style={{ color: T.inkSoft }}>{sub}</div>}
    </div>
  );
}

function urgencyTone(days) {
  if (days === null) return 'neutral';
  if (days < 0) return 'bad';
  if (days <= 14) return 'warn';
  return 'good';
}
function urgencyLabel(days) {
  if (days === null) return '—';
  if (days < 0) return `Scaduto da ${Math.abs(days)} gg`;
  if (days === 0) return 'Scade oggi';
  return `Tra ${days} gg`;
}

/* ============================= SIDEBAR ============================= */
const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'soci', label: 'Soci & Clienti', icon: Users },
  { key: 'cavalli', label: 'Cavalli', icon: HorseshoeMark },
  { key: 'calendario', label: 'Calendario & Lezioni', icon: CalendarDays },
  { key: 'istruttori', label: 'Istruttori', icon: GraduationCap },
  { key: 'box', label: 'Box & Pensioni', icon: Home },
  { key: 'fatturazione', label: 'Fatturazione', icon: Wallet },
  { key: 'eventi', label: 'Gare & Eventi', icon: Award },
  { key: 'magazzino', label: 'Magazzino', icon: Package },
  { key: 'documenti', label: 'Documenti', icon: FileText },
  { key: 'impostazioni', label: 'Impostazioni', icon: Settings },
];

function Sidebar({ active, setActive, impostazioni, alerts, role, onLogout }) {
  return (
    <div className="w-64 shrink-0 h-screen sticky top-0 flex flex-col" style={{ background: T.forest }}>
      <div className="px-5 pt-6 pb-5 flex items-center gap-3 border-b" style={{ borderColor: T.forestLine }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: T.brass }}>
          <HorseshoeMark size={20} color="#16241C" />
        </div>
        <div className="min-w-0">
          <div className="font-serif text-white text-lg leading-tight truncate">{impostazioni?.nome || 'Scuderia'}</div>
          <div className="text-[11px] uppercase tracking-wider" style={{ color: T.brassLight }}>Gestionale equestre</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {NAV.filter((item) => role === 'owner' || item.key !== 'fatturazione').map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          const alertCount = alerts?.[item.key];
          return (
            <button key={item.key} onClick={() => setActive(item.key)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm transition-colors relative"
              style={{ background: isActive ? T.forestLight : 'transparent', color: isActive ? '#fff' : '#B9C4BA' }}>
              <Icon size={17} color={isActive ? T.brassLight : '#8FA090'} />
              <span className="flex-1 text-left">{item.label}</span>
              {!!alertCount && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: T.rust, color: '#fff' }}>{alertCount}</span>
              )}
              {isActive && <ChevronRight size={14} color={T.brassLight} />}
            </button>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t" style={{ borderColor: T.forestLine }}>
        <div className="flex items-center justify-between">
          <span className="text-[11px]" style={{ color: '#748376' }}>Equistable CRM · {role === 'owner' ? 'Titolare' : 'Staff'}</span>
          <button onClick={onLogout} className="text-[11px] font-semibold" style={{ color: T.brassLight }}>Esci</button>
        </div>
      </div>
    </div>
  );
}

/* ============================= DASHBOARD ============================= */
function Dashboard({ data, setActive, role }) {
  const { clienti, cavalli, lezioni, fatture, box, istruttori } = data;

  const kpis = useMemo(() => {
    const sociAttivi = clienti.filter((c) => c.stato === 'attivo').length;
    const cavalliAttivi = cavalli.filter((h) => h.stato !== 'vendita').length;
    const oggi = todayISO();
    const lezioniOggi = lezioni.filter((l) => l.data === oggi).length;
    const meseCorrente = oggi.slice(0, 7);
    const incassoMese = fatture.filter((f) => f.data.slice(0, 7) === meseCorrente && f.stato === 'pagata').reduce((s, f) => s + f.importo, 0);
    const boxOccupati = box.filter((b) => b.cavalloId).length;
    return { sociAttivi, cavalliAttivi, lezioniOggi, incassoMese, boxOccupati, boxTot: box.length };
  }, [clienti, cavalli, lezioni, fatture, box]);

  const revenueByMonth = useMemo(() => {
    const map = {};
    fatture.forEach((f) => {
      const m = f.data.slice(0, 7);
      map[m] = (map[m] || 0) + (f.stato === 'pagata' ? f.importo : 0);
    });
    return Object.entries(map).sort().map(([m, v]) => ({ month: m.slice(5) + '/' + m.slice(2, 4), incasso: v }));
  }, [fatture]);

  const scadenze = useMemo(() => {
    const items = [];
    cavalli.forEach((h) => {
      const vac = h.vaccinazioni[h.vaccinazioni.length - 1];
      if (vac) items.push({ tipo: 'Vaccinazione', chi: h.nome, data: vac.prossima, icon: Syringe });
      const fer = h.ferrature[h.ferrature.length - 1];
      if (fer) items.push({ tipo: 'Ferratura', chi: h.nome, data: fer.prossima, icon: Hammer });
    });
    clienti.forEach((c) => { if (c.certMedico) items.push({ tipo: 'Certificato medico', chi: `${c.nome} ${c.cognome}`, data: c.certMedico, icon: Stethoscope }); });
    return items.map((it) => ({ ...it, giorni: daysUntil(it.data) })).sort((a, b) => a.giorni - b.giorni).slice(0, 7);
  }, [cavalli, clienti]);

  const lezioniOggiList = useMemo(() => {
    const oggi = todayISO();
    return lezioni.filter((l) => l.data === oggi).sort((a, b) => a.ora.localeCompare(b.ora));
  }, [lezioni]);

  const cavalloNome = (id) => cavalli.find((h) => h.id === id)?.nome || '—';
  const istruttoreNome = (id) => { const i = istruttori.find((x) => x.id === id); return i ? `${i.nome} ${i.cognome}` : '—'; };

  const fattureSospese = fatture.filter((f) => f.stato !== 'pagata').reduce((s, f) => s + f.importo, 0);

  return (
    <div>
      <SectionHeader eyebrow={new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })} title="Buongiorno, ecco il quadro di oggi" />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Soci attivi', value: kpis.sociAttivi, onClick: () => setActive('soci') },
          { label: 'Cavalli in gestione', value: kpis.cavalliAttivi, onClick: () => setActive('cavalli') },
          { label: 'Lezioni oggi', value: kpis.lezioniOggi, onClick: () => setActive('calendario') },
          ...(role === 'owner' ? [{ label: 'Incasso mese', value: euro(kpis.incassoMese), onClick: () => setActive('fatturazione'), mono: true }] : []),
          { label: 'Box occupati', value: `${kpis.boxOccupati}/${kpis.boxTot}`, onClick: () => setActive('box') },
        ].map((k, i) => (
          <Card key={i} className="p-5 cursor-pointer hover:shadow-md transition-shadow" style={{}}>
            <button onClick={k.onClick} className="text-left w-full">
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: T.inkSoft }}>{k.label}</div>
              <div className={`text-3xl ${k.mono ? 'font-mono' : 'font-serif'}`} style={{ color: T.ink }}>{k.value}</div>
            </button>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {role === 'owner' && <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg" style={{ color: T.ink }}>Incassi ultimi mesi</h3>
            <Pill tone={fattureSospese > 0 ? 'warn' : 'good'}>{fattureSospese > 0 ? `${euro(fattureSospese)} da incassare` : 'Tutto incassato'}</Pill>
          </div>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.line} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: T.inkSoft }} axisLine={{ stroke: T.line }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: T.inkSoft }} axisLine={false} tickLine={false} width={40} />
                <Tooltip formatter={(v) => euro(v)} contentStyle={{ borderRadius: 12, borderColor: T.line, fontSize: 13 }} />
                <Bar dataKey="incasso" fill={T.brass} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>}

        <Card className={role === 'owner' ? 'p-6' : 'p-6 lg:col-span-3'}>
          <h3 className="font-serif text-lg mb-4" style={{ color: T.ink }}>Prossime scadenze</h3>
          <div className="space-y-3">
            {scadenze.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: T.paper }}>
                    <Icon size={14} style={{ color: T.brassDark }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate" style={{ color: T.ink }}>{s.tipo} · {s.chi}</div>
                    <div className="text-xs" style={{ color: T.inkSoft }}>{fmtDate(s.data)}</div>
                  </div>
                  <Pill tone={urgencyTone(s.giorni)}>{urgencyLabel(s.giorni)}</Pill>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="p-6 mt-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg" style={{ color: T.ink }}>Ordine del giorno — lezioni di oggi</h3>
          <Pill tone="brass">{lezioniOggiList.length} in programma</Pill>
        </div>
        {lezioniOggiList.length === 0 ? (
          <EmptyState icon={CalendarDays} text="Nessuna lezione in programma oggi" />
        ) : (
          <div className="divide-y" style={{ borderColor: T.line }}>
            {lezioniOggiList.map((l, i) => (
              <div key={l.id} className="flex items-center gap-4 py-3">
                <div className="font-mono text-sm w-14 shrink-0" style={{ color: T.brassDark }}>{l.ora}</div>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ background: T.forest }}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: T.ink }}>{l.tipo} · {cavalloNome(l.cavalloId)}</div>
                  <div className="text-xs" style={{ color: T.inkSoft }}>Istruttore: {istruttoreNome(l.istruttoreId)} · {l.durata} min</div>
                </div>
                <Pill tone={l.stato === 'confermata' ? 'good' : l.stato === 'cancellata' ? 'bad' : 'warn'}>{l.stato}</Pill>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ============================= SOCI ============================= */
function ClienteForm({ initial, onSave, onCancel, cavalli }) {
  const [f, setF] = useState(initial || { nome: '', cognome: '', email: '', telefono: '', tessera: 'Base', dataIscrizione: todayISO(), certMedico: '', cavalliIds: [], stato: 'attivo', note: '' });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome"><input className={inputCls} style={inputStyle} value={f.nome} onChange={(e) => set('nome', e.target.value)} /></Field>
        <Field label="Cognome"><input className={inputCls} style={inputStyle} value={f.cognome} onChange={(e) => set('cognome', e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Email"><input className={inputCls} style={inputStyle} value={f.email} onChange={(e) => set('email', e.target.value)} /></Field>
        <Field label="Telefono"><input className={inputCls} style={inputStyle} value={f.telefono} onChange={(e) => set('telefono', e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Tipo tessera">
          <select className={inputCls} style={inputStyle} value={f.tessera} onChange={(e) => set('tessera', e.target.value)}>
            <option>Base</option><option>Standard</option><option>Premium</option>
          </select>
        </Field>
        <Field label="Stato">
          <select className={inputCls} style={inputStyle} value={f.stato} onChange={(e) => set('stato', e.target.value)}>
            <option value="attivo">Attivo</option><option value="sospeso">Sospeso</option>
          </select>
        </Field>
        <Field label="Scad. certificato medico"><input type="date" className={inputCls} style={inputStyle} value={f.certMedico} onChange={(e) => set('certMedico', e.target.value)} /></Field>
      </div>
      <Field label="Cavalli associati">
        <div className="flex flex-wrap gap-2">
          {cavalli.map((h) => {
            const checked = f.cavalliIds.includes(h.id);
            return (
              <button type="button" key={h.id} onClick={() => set('cavalliIds', checked ? f.cavalliIds.filter((x) => x !== h.id) : [...f.cavalliIds, h.id])}
                className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                style={{ borderColor: checked ? T.brass : T.line, background: checked ? '#F1E4CB' : 'white', color: checked ? T.brassDark : T.inkSoft }}>
                {h.nome}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="Note"><textarea className={inputCls} style={inputStyle} rows={2} value={f.note} onChange={(e) => set('note', e.target.value)} /></Field>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: T.line }}>Annulla</button>
        <button onClick={() => onSave(f)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white inline-flex items-center gap-1.5" style={{ background: T.brass }}><Save size={14} />Salva socio</button>
      </div>
    </div>
  );
}

function Soci({ data, mutate }) {
  const { clienti, cavalli } = data;
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState('tutti');
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);
  const [detail, setDetail] = useState(null);

  const filtered = clienti.filter((c) => {
    const s = `${c.nome} ${c.cognome} ${c.email}`.toLowerCase();
    if (!s.includes(q.toLowerCase())) return false;
    if (filtro !== 'tutti' && c.stato !== filtro) return false;
    return true;
  });

  const save = (f) => {
    let next;
    if (f.id) next = clienti.map((c) => (c.id === f.id ? f : c));
    else next = [...clienti, { ...f, id: uid('c') }];
    mutate('clienti', next);
    setModal(null);
  };
  const remove = (id) => { mutate('clienti', clienti.filter((c) => c.id !== id)); setDel(null); setDetail(null); };

  return (
    <div>
      <SectionHeader eyebrow={`${clienti.length} soci registrati`} title="Soci & Clienti" action={<PrimaryButton icon={Plus} onClick={() => setModal({})}>Nuovo socio</PrimaryButton>} />
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <SearchBox value={q} onChange={setQ} placeholder="Cerca per nome o email…" />
        <div className="flex gap-1.5">
          {['tutti', 'attivo', 'sospeso'].map((s) => (
            <button key={s} onClick={() => setFiltro(s)} className="px-3 py-2 rounded-lg text-xs font-medium border capitalize"
              style={{ borderColor: filtro === s ? T.brass : T.line, background: filtro === s ? '#F1E4CB' : 'white', color: filtro === s ? T.brassDark : T.inkSoft }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left" style={{ background: T.paper }}>
              {['Socio', 'Contatti', 'Tessera', 'Cavalli', 'Cert. medico', 'Stato', ''].map((h) => (
                <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: T.inkSoft }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const giorni = daysUntil(c.certMedico);
              return (
                <tr key={c.id} className="border-t hover:bg-stone-50 cursor-pointer" style={{ borderColor: T.line }} onClick={() => setDetail(c)}>
                  <td className="px-5 py-3">
                    <div className="font-medium" style={{ color: T.ink }}>{c.nome} {c.cognome}</div>
                    <div className="text-xs" style={{ color: T.inkSoft }}>Socio dal {fmtDate(c.dataIscrizione)}</div>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: T.inkSoft }}>
                    <div className="flex items-center gap-1.5"><Mail size={12} />{c.email}</div>
                    <div className="flex items-center gap-1.5 mt-0.5"><Phone size={12} />{c.telefono}</div>
                  </td>
                  <td className="px-5 py-3"><Pill tone="brass">{c.tessera}</Pill></td>
                  <td className="px-5 py-3 text-xs" style={{ color: T.inkSoft }}>{c.cavalliIds.map((id) => cavalli.find((h) => h.id === id)?.nome).filter(Boolean).join(', ') || '—'}</td>
                  <td className="px-5 py-3"><Pill tone={urgencyTone(giorni)}>{fmtDate(c.certMedico)}</Pill></td>
                  <td className="px-5 py-3"><Pill tone={c.stato === 'attivo' ? 'good' : 'bad'}>{c.stato}</Pill></td>
                  <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1 justify-end">
                      <IconBtn title="Modifica" onClick={() => setModal(c)}><Edit2 size={14} /></IconBtn>
                      <IconBtn title="Elimina" onClick={() => setDel(c)}><Trash2 size={14} /></IconBtn>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState icon={Users} text="Nessun socio trovato" sub="Prova a modificare la ricerca o aggiungi un nuovo socio" />}
      </Card>

      {modal && <Modal title={modal.id ? 'Modifica socio' : 'Nuovo socio'} onClose={() => setModal(null)} wide><ClienteForm initial={modal.id ? modal : null} cavalli={cavalli} onSave={save} onCancel={() => setModal(null)} /></Modal>}
      {del && <ConfirmDelete label={`${del.nome} ${del.cognome}`} onConfirm={() => remove(del.id)} onCancel={() => setDel(null)} />}
      {detail && (
        <Modal title={`${detail.nome} ${detail.cognome}`} onClose={() => setDetail(null)}>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span style={{ color: T.inkSoft }}>Email</span><span style={{ color: T.ink }}>{detail.email}</span></div>
            <div className="flex justify-between"><span style={{ color: T.inkSoft }}>Telefono</span><span style={{ color: T.ink }}>{detail.telefono}</span></div>
            <div className="flex justify-between"><span style={{ color: T.inkSoft }}>Tessera</span><Pill tone="brass">{detail.tessera}</Pill></div>
            <div className="flex justify-between"><span style={{ color: T.inkSoft }}>Iscritto dal</span><span style={{ color: T.ink }}>{fmtDate(detail.dataIscrizione)}</span></div>
            <div className="flex justify-between"><span style={{ color: T.inkSoft }}>Cert. medico</span><Pill tone={urgencyTone(daysUntil(detail.certMedico))}>{fmtDate(detail.certMedico)}</Pill></div>
            <div><span style={{ color: T.inkSoft }}>Cavalli</span><div className="mt-1 flex flex-wrap gap-1.5">{detail.cavalliIds.map((id) => <Pill key={id}>{cavalli.find((h) => h.id === id)?.nome}</Pill>)}{detail.cavalliIds.length === 0 && <span style={{ color: T.inkSoft }}>Nessuno</span>}</div></div>
            {detail.note && <div className="pt-2 border-t" style={{ borderColor: T.line }}><span className="text-xs font-semibold uppercase" style={{ color: T.inkSoft }}>Note</span><p className="mt-1" style={{ color: T.ink }}>{detail.note}</p></div>}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ============================= CAVALLI ============================= */
function CavalloForm({ initial, onSave, onCancel, clienti, box }) {
  const [f, setF] = useState(initial || { nome: '', razza: '', sesso: 'Castrone', nascita: '', mantello: 'Baio', tipo: 'Scuola', proprietarioId: null, boxId: null, stato: 'attivo', vaccinazioni: [], vermifughi: [], ferrature: [], visiteVet: [] });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome"><input className={inputCls} style={inputStyle} value={f.nome} onChange={(e) => set('nome', e.target.value)} /></Field>
        <Field label="Razza"><input className={inputCls} style={inputStyle} value={f.razza} onChange={(e) => set('razza', e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Sesso">
          <select className={inputCls} style={inputStyle} value={f.sesso} onChange={(e) => set('sesso', e.target.value)}>
            <option>Maschio</option><option>Femmina</option><option>Castrone</option>
          </select>
        </Field>
        <Field label="Data di nascita"><input type="date" className={inputCls} style={inputStyle} value={f.nascita} onChange={(e) => set('nascita', e.target.value)} /></Field>
        <Field label="Mantello">
          <select className={inputCls} style={inputStyle} value={f.mantello} onChange={(e) => set('mantello', e.target.value)}>
            {Object.keys(MANTELLI).map((m) => <option key={m}>{m}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Tipo">
          <select className={inputCls} style={inputStyle} value={f.tipo} onChange={(e) => set('tipo', e.target.value)}>
            <option>Scuola</option><option>Pensione</option><option>Allevamento</option><option>Vendita</option>
          </select>
        </Field>
        <Field label="Proprietario / pensionante">
          <select className={inputCls} style={inputStyle} value={f.proprietarioId || ''} onChange={(e) => set('proprietarioId', e.target.value || null)}>
            <option value="">Scuderia</option>
            {clienti.map((c) => <option key={c.id} value={c.id}>{c.nome} {c.cognome}</option>)}
          </select>
        </Field>
        <Field label="Box">
          <select className={inputCls} style={inputStyle} value={f.boxId || ''} onChange={(e) => set('boxId', e.target.value || null)}>
            <option value="">Nessuno</option>
            {box.map((b) => <option key={b.id} value={b.id}>Box {b.numero}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Stato">
        <select className={inputCls} style={inputStyle} value={f.stato} onChange={(e) => set('stato', e.target.value)}>
          <option value="attivo">Attivo</option><option value="riposo">A riposo</option><option value="vendita">In vendita</option>
        </select>
      </Field>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: T.line }}>Annulla</button>
        <button onClick={() => onSave(f)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white inline-flex items-center gap-1.5" style={{ background: T.brass }}><Save size={14} />Salva cavallo</button>
      </div>
    </div>
  );
}

function CoatBadge({ nome, mantello, size = 44 }) {
  const color = MANTELLI[mantello] || '#8C7A6B';
  const initials = nome.slice(0, 2).toUpperCase();
  return (
    <div className="rounded-full flex items-center justify-center text-white font-serif shrink-0" style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>
      {initials}
    </div>
  );
}

function LibrettoEntry({ icon: Icon, label, entry, extra }) {
  const giorni = entry ? daysUntil(entry.prossima) : null;
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: T.paper }}><Icon size={14} style={{ color: T.brassDark }} /></div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium" style={{ color: T.ink }}>{label}</div>
        <div className="text-xs" style={{ color: T.inkSoft }}>{entry ? `Ultima: ${fmtDate(entry.data)}${extra ? ' · ' + extra(entry) : ''}` : 'Nessun dato registrato'}</div>
      </div>
      {entry && <Pill tone={urgencyTone(giorni)}>{urgencyLabel(giorni)}</Pill>}
    </div>
  );
}

function Cavalli({ data, mutate }) {
  const { cavalli, clienti, box } = data;
  const [q, setQ] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('tutti');
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);
  const [detail, setDetail] = useState(null);

  const filtered = cavalli.filter((h) => {
    if (!h.nome.toLowerCase().includes(q.toLowerCase()) && !h.razza.toLowerCase().includes(q.toLowerCase())) return false;
    if (tipoFiltro !== 'tutti' && h.tipo !== tipoFiltro) return false;
    return true;
  });

  const save = (f) => {
    let next;
    if (f.id) next = cavalli.map((h) => (h.id === f.id ? f : h));
    else next = [...cavalli, { ...f, id: uid('h') }];
    mutate('cavalli', next);
    setModal(null);
  };
  const remove = (id) => { mutate('cavalli', cavalli.filter((h) => h.id !== id)); setDel(null); setDetail(null); };
  const proprietarioNome = (id) => id ? (clienti.find((c) => c.id === id) ? `${clienti.find((c) => c.id === id).nome} ${clienti.find((c) => c.id === id).cognome}` : '—') : 'Scuderia';
  const boxNum = (id) => box.find((b) => b.id === id)?.numero;

  return (
    <div>
      <SectionHeader eyebrow={`${cavalli.length} cavalli in gestione`} title="Cavalli" action={<PrimaryButton icon={Plus} onClick={() => setModal({})}>Nuovo cavallo</PrimaryButton>} />
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <SearchBox value={q} onChange={setQ} placeholder="Cerca per nome o razza…" />
        <div className="flex gap-1.5 flex-wrap">
          {['tutti', 'Scuola', 'Pensione', 'Allevamento', 'Vendita'].map((s) => (
            <button key={s} onClick={() => setTipoFiltro(s)} className="px-3 py-2 rounded-lg text-xs font-medium border"
              style={{ borderColor: tipoFiltro === s ? T.brass : T.line, background: tipoFiltro === s ? '#F1E4CB' : 'white', color: tipoFiltro === s ? T.brassDark : T.inkSoft }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((h) => {
          const nextVac = h.vaccinazioni[h.vaccinazioni.length - 1];
          const giorni = nextVac ? daysUntil(nextVac.prossima) : null;
          return (
            <Card key={h.id} className="p-5 cursor-pointer hover:shadow-md transition-shadow" >
              <div onClick={() => setDetail(h)}>
                <div className="flex items-start gap-3">
                  <CoatBadge nome={h.nome} mantello={h.mantello} />
                  <div className="flex-1 min-w-0">
                    <div className="font-serif text-lg" style={{ color: T.ink }}>{h.nome}</div>
                    <div className="text-xs" style={{ color: T.inkSoft }}>{h.razza} · {h.sesso} · {h.mantello}</div>
                  </div>
                  <Pill tone={h.stato === 'attivo' ? 'good' : h.stato === 'riposo' ? 'warn' : 'neutral'}>{h.stato}</Pill>
                </div>
                <div className="mt-4 pt-4 border-t space-y-1.5 text-xs" style={{ borderColor: T.line, color: T.inkSoft }}>
                  <div className="flex justify-between"><span>Tipo</span><span style={{ color: T.ink }}>{h.tipo}</span></div>
                  <div className="flex justify-between"><span>Proprietario</span><span style={{ color: T.ink }}>{proprietarioNome(h.proprietarioId)}</span></div>
                  <div className="flex justify-between"><span>Box</span><span style={{ color: T.ink }}>{boxNum(h.boxId) ? `N. ${boxNum(h.boxId)}` : '—'}</span></div>
                  <div className="flex justify-between items-center"><span>Prossimo vaccino</span><Pill tone={urgencyTone(giorni)}>{urgencyLabel(giorni)}</Pill></div>
                </div>
              </div>
              <div className="flex gap-1 justify-end mt-3">
                <IconBtn title="Modifica" onClick={() => setModal(h)}><Edit2 size={14} /></IconBtn>
                <IconBtn title="Elimina" onClick={() => setDel(h)}><Trash2 size={14} /></IconBtn>
              </div>
            </Card>
          );
        })}
      </div>
      {filtered.length === 0 && <EmptyState icon={HorseshoeMark} text="Nessun cavallo trovato" />}

      {modal && <Modal title={modal.id ? 'Modifica cavallo' : 'Nuovo cavallo'} onClose={() => setModal(null)} wide><CavalloForm initial={modal.id ? modal : null} clienti={clienti} box={box} onSave={save} onCancel={() => setModal(null)} /></Modal>}
      {del && <ConfirmDelete label={del.nome} onConfirm={() => remove(del.id)} onCancel={() => setDel(null)} />}
      {detail && (
        <Modal title={detail.nome} onClose={() => setDetail(null)} wide>
          <div className="flex items-center gap-4 mb-5">
            <CoatBadge nome={detail.nome} mantello={detail.mantello} size={60} />
            <div>
              <div className="font-serif text-xl" style={{ color: T.ink }}>{detail.nome}</div>
              <div className="text-sm" style={{ color: T.inkSoft }}>{detail.razza} · {detail.sesso} · nato il {fmtDate(detail.nascita)}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
            <div className="p-3 rounded-xl" style={{ background: T.paper }}><div className="text-xs" style={{ color: T.inkSoft }}>Tipo</div><div style={{ color: T.ink }}>{detail.tipo}</div></div>
            <div className="p-3 rounded-xl" style={{ background: T.paper }}><div className="text-xs" style={{ color: T.inkSoft }}>Proprietario</div><div style={{ color: T.ink }}>{proprietarioNome(detail.proprietarioId)}</div></div>
            <div className="p-3 rounded-xl" style={{ background: T.paper }}><div className="text-xs" style={{ color: T.inkSoft }}>Box</div><div style={{ color: T.ink }}>{boxNum(detail.boxId) ? `N. ${boxNum(detail.boxId)}` : '—'}</div></div>
            <div className="p-3 rounded-xl" style={{ background: T.paper }}><div className="text-xs" style={{ color: T.inkSoft }}>Mantello</div><div style={{ color: T.ink }}>{detail.mantello}</div></div>
          </div>
          <div className="font-serif text-base mb-1" style={{ color: T.ink }}>Libretto sanitario</div>
          <div className="divide-y" style={{ borderColor: T.line }}>
            <LibrettoEntry icon={Syringe} label={`Vaccinazione — ${detail.vaccinazioni[0]?.tipo || ''}`} entry={detail.vaccinazioni[detail.vaccinazioni.length - 1]} />
            <LibrettoEntry icon={Stethoscope} label="Vermifugazione" entry={detail.vermifughi[detail.vermifughi.length - 1]} />
            <LibrettoEntry icon={Hammer} label="Ferratura" entry={detail.ferrature[detail.ferrature.length - 1]} extra={(e) => e.maniscalco} />
          </div>
          {detail.visiteVet.length > 0 && (
            <div className="mt-4">
              <div className="font-serif text-base mb-2" style={{ color: T.ink }}>Visite veterinarie</div>
              {detail.visiteVet.map((v, i) => (
                <div key={i} className="text-sm py-1.5 border-t" style={{ borderColor: T.line }}>
                  <span style={{ color: T.ink }}>{fmtDate(v.data)} — {v.motivo}</span> <span style={{ color: T.inkSoft }}>({v.veterinario})</span>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

/* ============================= CALENDARIO ============================= */
function LezioneForm({ initial, onSave, onCancel, istruttori, cavalli, clienti }) {
  const [f, setF] = useState(initial || { data: todayISO(), ora: '10:00', durata: 60, tipo: 'Privata', istruttoreId: istruttori[0]?.id, cavalloId: cavalli[0]?.id, allievi: [], stato: 'da confermare', note: '' });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Data"><input type="date" className={inputCls} style={inputStyle} value={f.data} onChange={(e) => set('data', e.target.value)} /></Field>
        <Field label="Ora"><input type="time" className={inputCls} style={inputStyle} value={f.ora} onChange={(e) => set('ora', e.target.value)} /></Field>
        <Field label="Durata (min)">
          <select className={inputCls} style={inputStyle} value={f.durata} onChange={(e) => set('durata', Number(e.target.value))}>
            {[30, 45, 60, 90].map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Tipo di lezione">
        <select className={inputCls} style={inputStyle} value={f.tipo} onChange={(e) => set('tipo', e.target.value)}>
          <option>Privata</option><option>Gruppo</option><option>Salto ostacoli</option><option>Dressage</option><option>Passeggiata</option>
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Istruttore">
          <select className={inputCls} style={inputStyle} value={f.istruttoreId} onChange={(e) => set('istruttoreId', e.target.value)}>
            {istruttori.map((i) => <option key={i.id} value={i.id}>{i.nome} {i.cognome}</option>)}
          </select>
        </Field>
        <Field label="Cavallo">
          <select className={inputCls} style={inputStyle} value={f.cavalloId} onChange={(e) => set('cavalloId', e.target.value)}>
            {cavalli.map((h) => <option key={h.id} value={h.id}>{h.nome}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Allievi">
        <div className="flex flex-wrap gap-2">
          {clienti.map((c) => {
            const checked = f.allievi.includes(c.id);
            return (
              <button type="button" key={c.id} onClick={() => set('allievi', checked ? f.allievi.filter((x) => x !== c.id) : [...f.allievi, c.id])}
                className="px-3 py-1.5 rounded-full text-xs font-medium border"
                style={{ borderColor: checked ? T.brass : T.line, background: checked ? '#F1E4CB' : 'white', color: checked ? T.brassDark : T.inkSoft }}>
                {c.nome} {c.cognome}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="Stato">
        <select className={inputCls} style={inputStyle} value={f.stato} onChange={(e) => set('stato', e.target.value)}>
          <option value="confermata">Confermata</option><option value="da confermare">Da confermare</option><option value="cancellata">Cancellata</option>
        </select>
      </Field>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: T.line }}>Annulla</button>
        <button onClick={() => onSave(f)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white inline-flex items-center gap-1.5" style={{ background: T.brass }}><Save size={14} />Salva lezione</button>
      </div>
    </div>
  );
}

function Calendario({ data, mutate }) {
  const { lezioni, istruttori, cavalli, clienti } = data;
  const [weekStart, setWeekStart] = useState(() => { const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); return d.toISOString().slice(0, 10); });
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);

  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  const cavalloNome = (id) => cavalli.find((h) => h.id === id)?.nome || '—';
  const istruttoreNome = (id) => { const i = istruttori.find((x) => x.id === id); return i ? `${i.nome} ${i.cognome}` : '—'; };
  const allieviNomi = (ids) => ids.map((id) => clienti.find((c) => c.id === id)?.nome).filter(Boolean).join(', ');

  const save = (f) => {
    let next;
    if (f.id) next = lezioni.map((l) => (l.id === f.id ? f : l));
    else next = [...lezioni, { ...f, id: uid('lz') }];
    mutate('lezioni', next);
    setModal(null);
  };
  const remove = (id) => { mutate('lezioni', lezioni.filter((l) => l.id !== id)); setDel(null); };

  return (
    <div>
      <SectionHeader eyebrow="Settimana" title="Calendario & Lezioni" action={<PrimaryButton icon={Plus} onClick={() => setModal({})}>Nuova lezione</PrimaryButton>} />

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <IconBtn title="Settimana precedente" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft size={16} /></IconBtn>
          <div className="text-sm font-medium px-2" style={{ color: T.ink }}>{fmtDate(days[0])} – {fmtDate(days[6])}</div>
          <IconBtn title="Settimana successiva" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronLeft size={16} className="rotate-180" /></IconBtn>
        </div>
        <button onClick={() => { const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); setWeekStart(d.toISOString().slice(0, 10)); }} className="text-xs font-semibold px-3 py-1.5 rounded-lg border" style={{ borderColor: T.line, color: T.brassDark }}>Oggi</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {days.map((d) => {
          const dayLezioni = lezioni.filter((l) => l.data === d).sort((a, b) => a.ora.localeCompare(b.ora));
          const isToday = d === todayISO();
          return (
            <div key={d}>
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: isToday ? T.brassDark : T.inkSoft }}>
                  {new Date(d).toLocaleDateString('it-IT', { weekday: 'short' })} <span className="font-mono">{new Date(d).getDate()}</span>
                </div>
                {isToday && <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.brass }} />}
              </div>
              <div className="space-y-2 min-h-[80px]">
                {dayLezioni.map((l) => (
                  <Card key={l.id} className="p-3 cursor-pointer hover:shadow-sm group" style={{ borderLeft: `3px solid ${l.stato === 'confermata' ? T.sage : l.stato === 'cancellata' ? T.rust : T.amber}` }} >
                    <div onClick={() => setModal(l)}>
                      <div className="font-mono text-xs font-semibold" style={{ color: T.brassDark }}>{l.ora} · {l.durata}′</div>
                      <div className="text-sm font-medium mt-0.5" style={{ color: T.ink }}>{l.tipo}</div>
                      <div className="text-xs mt-0.5" style={{ color: T.inkSoft }}>{cavalloNome(l.cavalloId)}</div>
                      <div className="text-xs" style={{ color: T.inkSoft }}>{istruttoreNome(l.istruttoreId)}</div>
                    </div>
                    <div className="flex justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <IconBtn title="Elimina" onClick={() => setDel(l)}><Trash2 size={12} /></IconBtn>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <Modal title={modal.id ? 'Modifica lezione' : 'Nuova lezione'} onClose={() => setModal(null)} wide>
          <LezioneForm initial={modal.id ? modal : null} istruttori={istruttori} cavalli={cavalli} clienti={clienti} onSave={save} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {del && <ConfirmDelete label={`la lezione delle ${del.ora}`} onConfirm={() => remove(del.id)} onCancel={() => setDel(null)} />}
    </div>
  );
}

/* ============================= ISTRUTTORI ============================= */
function IstruttoreForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState(initial || { nome: '', cognome: '', specializzazioni: [], telefono: '', email: '', brevetto: '', giorni: [] });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const GIORNI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome"><input className={inputCls} style={inputStyle} value={f.nome} onChange={(e) => set('nome', e.target.value)} /></Field>
        <Field label="Cognome"><input className={inputCls} style={inputStyle} value={f.cognome} onChange={(e) => set('cognome', e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Telefono"><input className={inputCls} style={inputStyle} value={f.telefono} onChange={(e) => set('telefono', e.target.value)} /></Field>
        <Field label="Email"><input className={inputCls} style={inputStyle} value={f.email} onChange={(e) => set('email', e.target.value)} /></Field>
      </div>
      <Field label="Brevetto / qualifica"><input className={inputCls} style={inputStyle} value={f.brevetto} onChange={(e) => set('brevetto', e.target.value)} /></Field>
      <Field label="Specializzazioni (separate da virgola)">
        <input className={inputCls} style={inputStyle} value={f.specializzazioni.join(', ')} onChange={(e) => set('specializzazioni', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} />
      </Field>
      <Field label="Giorni disponibili">
        <div className="flex flex-wrap gap-2">
          {GIORNI.map((g) => {
            const checked = f.giorni.includes(g);
            return (
              <button type="button" key={g} onClick={() => set('giorni', checked ? f.giorni.filter((x) => x !== g) : [...f.giorni, g])}
                className="px-3 py-1.5 rounded-full text-xs font-medium border"
                style={{ borderColor: checked ? T.brass : T.line, background: checked ? '#F1E4CB' : 'white', color: checked ? T.brassDark : T.inkSoft }}>{g}</button>
            );
          })}
        </div>
      </Field>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: T.line }}>Annulla</button>
        <button onClick={() => onSave(f)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white inline-flex items-center gap-1.5" style={{ background: T.brass }}><Save size={14} />Salva istruttore</button>
      </div>
    </div>
  );
}

function Istruttori({ data, mutate }) {
  const { istruttori, lezioni } = data;
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);

  const save = (f) => {
    let next;
    if (f.id) next = istruttori.map((i) => (i.id === f.id ? f : i));
    else next = [...istruttori, { ...f, id: uid('i') }];
    mutate('istruttori', next);
    setModal(null);
  };
  const remove = (id) => { mutate('istruttori', istruttori.filter((i) => i.id !== id)); setDel(null); };
  const countLezioni = (id) => lezioni.filter((l) => l.istruttoreId === id && l.stato !== 'cancellata').length;

  return (
    <div>
      <SectionHeader eyebrow={`${istruttori.length} istruttori`} title="Istruttori" action={<PrimaryButton icon={Plus} onClick={() => setModal({})}>Nuovo istruttore</PrimaryButton>} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {istruttori.map((i) => (
          <Card key={i.id} className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-serif text-white" style={{ background: T.forest }}>{i.nome[0]}{i.cognome[0]}</div>
                <div>
                  <div className="font-serif text-lg" style={{ color: T.ink }}>{i.nome} {i.cognome}</div>
                  <div className="text-xs" style={{ color: T.inkSoft }}>{i.brevetto}</div>
                </div>
              </div>
              <div className="flex gap-1">
                <IconBtn title="Modifica" onClick={() => setModal(i)}><Edit2 size={14} /></IconBtn>
                <IconBtn title="Elimina" onClick={() => setDel(i)}><Trash2 size={14} /></IconBtn>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {i.specializzazioni.map((s) => <Pill key={s} tone="brass">{s}</Pill>)}
            </div>
            <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs" style={{ borderColor: T.line, color: T.inkSoft }}>
              <span>Disponibile: {i.giorni.join(' · ')}</span>
              <span className="font-mono font-semibold" style={{ color: T.brassDark }}>{countLezioni(i.id)} lezioni</span>
            </div>
          </Card>
        ))}
      </div>
      {modal && <Modal title={modal.id ? 'Modifica istruttore' : 'Nuovo istruttore'} onClose={() => setModal(null)} wide><IstruttoreForm initial={modal.id ? modal : null} onSave={save} onCancel={() => setModal(null)} /></Modal>}
      {del && <ConfirmDelete label={`${del.nome} ${del.cognome}`} onConfirm={() => remove(del.id)} onCancel={() => setDel(null)} />}
    </div>
  );
}

/* ============================= BOX ============================= */
function BoxForm({ initial, onSave, onCancel, cavalli }) {
  const [f, setF] = useState(initial);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <div>
      <Field label={`Box numero ${f.numero}`}><input className={inputCls} style={inputStyle} value={f.dimensione} onChange={(e) => set('dimensione', e.target.value)} /></Field>
      <Field label="Cavallo assegnato">
        <select className={inputCls} style={inputStyle} value={f.cavalloId || ''} onChange={(e) => set('cavalloId', e.target.value || null)}>
          <option value="">Libero</option>
          {cavalli.map((h) => <option key={h.id} value={h.id}>{h.nome}</option>)}
        </select>
      </Field>
      <Field label="Canone mensile (€)"><input type="number" className={inputCls} style={inputStyle} value={f.canone} onChange={(e) => set('canone', Number(e.target.value))} /></Field>
      <Field label="Note"><textarea className={inputCls} style={inputStyle} rows={2} value={f.note} onChange={(e) => set('note', e.target.value)} /></Field>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: T.line }}>Annulla</button>
        <button onClick={() => onSave(f)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white inline-flex items-center gap-1.5" style={{ background: T.brass }}><Save size={14} />Salva box</button>
      </div>
    </div>
  );
}

function BoxModule({ data, mutate }) {
  const { box, cavalli } = data;
  const [modal, setModal] = useState(null);
  const occupati = box.filter((b) => b.cavalloId).length;
  const canoni = box.reduce((s, b) => s + (b.cavalloId ? b.canone : 0), 0);

  const save = (f) => { mutate('box', box.map((b) => (b.id === f.id ? f : b))); setModal(null); };

  return (
    <div>
      <SectionHeader eyebrow={`${occupati}/${box.length} box occupati`} title="Box & Pensioni" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-5"><div className="text-xs font-semibold uppercase" style={{ color: T.inkSoft }}>Box totali</div><div className="text-3xl font-serif mt-1" style={{ color: T.ink }}>{box.length}</div></Card>
        <Card className="p-5"><div className="text-xs font-semibold uppercase" style={{ color: T.inkSoft }}>Occupati</div><div className="text-3xl font-serif mt-1" style={{ color: T.sage }}>{occupati}</div></Card>
        <Card className="p-5"><div className="text-xs font-semibold uppercase" style={{ color: T.inkSoft }}>Liberi</div><div className="text-3xl font-serif mt-1" style={{ color: T.brassDark }}>{box.length - occupati}</div></Card>
        <Card className="p-5"><div className="text-xs font-semibold uppercase" style={{ color: T.inkSoft }}>Canoni / mese</div><div className="text-2xl font-mono mt-1" style={{ color: T.ink }}>{euro(canoni)}</div></Card>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {box.map((b) => {
          const cavallo = cavalli.find((h) => h.id === b.cavalloId);
          return (
            <Card key={b.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow text-center" onClick={() => setModal(b)}
              style={{ background: cavallo ? '#F9F6EF' : T.card }}>
              <div className="text-xs font-mono font-semibold mb-2" style={{ color: T.brassDark }}>BOX {b.numero}</div>
              {cavallo ? (
                <>
                  <CoatBadge nome={cavallo.nome} mantello={cavallo.mantello} size={40} />
                  <div className="text-xs font-medium mt-2 truncate" style={{ color: T.ink }}>{cavallo.nome}</div>
                </>
              ) : (
                <div className="py-3">
                  <div className="w-10 h-10 mx-auto rounded-full border-2 border-dashed" style={{ borderColor: T.line }} />
                  <div className="text-xs mt-2" style={{ color: T.inkSoft }}>Libero</div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {modal && <Modal title={`Box ${modal.numero}`} onClose={() => setModal(null)}><BoxForm initial={modal} cavalli={cavalli} onSave={save} onCancel={() => setModal(null)} /></Modal>}
    </div>
  );
}

/* ============================= FATTURAZIONE ============================= */
function FatturaForm({ initial, onSave, onCancel, clienti }) {
  const [f, setF] = useState(initial || { numero: '', clienteId: clienti[0]?.id, data: todayISO(), scadenza: addDays(todayISO(), 15), importo: 0, voce: '', stato: 'in sospeso', metodo: '—' });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Numero fattura"><input className={inputCls} style={inputStyle} value={f.numero} onChange={(e) => set('numero', e.target.value)} /></Field>
        <Field label="Socio">
          <select className={inputCls} style={inputStyle} value={f.clienteId} onChange={(e) => set('clienteId', e.target.value)}>
            {clienti.map((c) => <option key={c.id} value={c.id}>{c.nome} {c.cognome}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Descrizione / voce"><input className={inputCls} style={inputStyle} value={f.voce} onChange={(e) => set('voce', e.target.value)} /></Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Data emissione"><input type="date" className={inputCls} style={inputStyle} value={f.data} onChange={(e) => set('data', e.target.value)} /></Field>
        <Field label="Scadenza"><input type="date" className={inputCls} style={inputStyle} value={f.scadenza} onChange={(e) => set('scadenza', e.target.value)} /></Field>
        <Field label="Importo (€)"><input type="number" className={inputCls} style={inputStyle} value={f.importo} onChange={(e) => set('importo', Number(e.target.value))} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Stato">
          <select className={inputCls} style={inputStyle} value={f.stato} onChange={(e) => set('stato', e.target.value)}>
            <option value="pagata">Pagata</option><option value="in sospeso">In sospeso</option><option value="scaduta">Scaduta</option>
          </select>
        </Field>
        <Field label="Metodo di pagamento">
          <select className={inputCls} style={inputStyle} value={f.metodo} onChange={(e) => set('metodo', e.target.value)}>
            <option>—</option><option>Contanti</option><option>Bonifico</option><option>Carta</option>
          </select>
        </Field>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: T.line }}>Annulla</button>
        <button onClick={() => onSave(f)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white inline-flex items-center gap-1.5" style={{ background: T.brass }}><Save size={14} />Salva fattura</button>
      </div>
    </div>
  );
}

function Fatturazione({ data, mutate }) {
  const { fatture, clienti } = data;
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);
  const [filtro, setFiltro] = useState('tutte');

  const clienteNome = (id) => { const c = clienti.find((x) => x.id === id); return c ? `${c.nome} ${c.cognome}` : '—'; };
  const save = (f) => {
    let next;
    if (f.id) next = fatture.map((x) => (x.id === f.id ? f : x));
    else next = [...fatture, { ...f, id: uid('f') }];
    mutate('fatture', next);
    setModal(null);
  };
  const remove = (id) => { mutate('fatture', fatture.filter((f) => f.id !== id)); setDel(null); };

  const filtered = filtro === 'tutte' ? fatture : fatture.filter((f) => f.stato === filtro);
  const totIncassato = fatture.filter((f) => f.stato === 'pagata').reduce((s, f) => s + f.importo, 0);
  const totSospeso = fatture.filter((f) => f.stato !== 'pagata').reduce((s, f) => s + f.importo, 0);

  return (
    <div>
      <SectionHeader eyebrow={`${fatture.length} documenti`} title="Fatturazione" action={<PrimaryButton icon={Plus} onClick={() => setModal({})}>Nuova fattura</PrimaryButton>} />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-5"><div className="text-xs font-semibold uppercase flex items-center gap-1.5" style={{ color: T.inkSoft }}><ArrowUpRight size={13} color={T.sage} />Incassato</div><div className="text-2xl font-mono mt-1" style={{ color: T.sage }}>{euro(totIncassato)}</div></Card>
        <Card className="p-5"><div className="text-xs font-semibold uppercase flex items-center gap-1.5" style={{ color: T.inkSoft }}><ArrowDownRight size={13} color={T.rust} />Da incassare</div><div className="text-2xl font-mono mt-1" style={{ color: T.rust }}>{euro(totSospeso)}</div></Card>
        <Card className="p-5"><div className="text-xs font-semibold uppercase" style={{ color: T.inkSoft }}>Totale documenti</div><div className="text-2xl font-mono mt-1" style={{ color: T.ink }}>{fatture.length}</div></Card>
      </div>

      <div className="flex gap-1.5 mb-4">
        {['tutte', 'pagata', 'in sospeso', 'scaduta'].map((s) => (
          <button key={s} onClick={() => setFiltro(s)} className="px-3 py-2 rounded-lg text-xs font-medium border capitalize"
            style={{ borderColor: filtro === s ? T.brass : T.line, background: filtro === s ? '#F1E4CB' : 'white', color: filtro === s ? T.brassDark : T.inkSoft }}>{s}</button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: T.paper }}>
              {['N.', 'Socio', 'Voce', 'Emissione', 'Scadenza', 'Importo', 'Stato', ''].map((h) => <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: T.inkSoft }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.id} className="border-t hover:bg-stone-50" style={{ borderColor: T.line }}>
                <td className="px-5 py-3 font-mono text-xs" style={{ color: T.inkSoft }}>{f.numero}</td>
                <td className="px-5 py-3 font-medium" style={{ color: T.ink }}>{clienteNome(f.clienteId)}</td>
                <td className="px-5 py-3 text-xs" style={{ color: T.inkSoft }}>{f.voce}</td>
                <td className="px-5 py-3 text-xs" style={{ color: T.inkSoft }}>{fmtDate(f.data)}</td>
                <td className="px-5 py-3 text-xs" style={{ color: T.inkSoft }}>{fmtDate(f.scadenza)}</td>
                <td className="px-5 py-3 font-mono font-semibold" style={{ color: T.ink }}>{euro(f.importo)}</td>
                <td className="px-5 py-3"><Pill tone={f.stato === 'pagata' ? 'good' : f.stato === 'scaduta' ? 'bad' : 'warn'}>{f.stato}</Pill></td>
                <td className="px-5 py-3"><div className="flex gap-1 justify-end"><IconBtn title="Modifica" onClick={() => setModal(f)}><Edit2 size={14} /></IconBtn><IconBtn title="Elimina" onClick={() => setDel(f)}><Trash2 size={14} /></IconBtn></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState icon={Wallet} text="Nessuna fattura in questa categoria" />}
      </Card>

      {modal && <Modal title={modal.id ? 'Modifica fattura' : 'Nuova fattura'} onClose={() => setModal(null)} wide><FatturaForm initial={modal.id ? modal : null} clienti={clienti} onSave={save} onCancel={() => setModal(null)} /></Modal>}
      {del && <ConfirmDelete label={`la fattura ${del.numero}`} onConfirm={() => remove(del.id)} onCancel={() => setDel(null)} />}
    </div>
  );
}

/* ============================= EVENTI ============================= */
function EventoForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState(initial || { nome: '', tipo: 'Gara', data: todayISO(), luogo: '', iscritti: [] });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <div>
      <Field label="Nome evento"><input className={inputCls} style={inputStyle} value={f.nome} onChange={(e) => set('nome', e.target.value)} /></Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Tipo">
          <select className={inputCls} style={inputStyle} value={f.tipo} onChange={(e) => set('tipo', e.target.value)}>
            <option>Gara</option><option>Clinic</option><option>Evento sociale</option>
          </select>
        </Field>
        <Field label="Data"><input type="date" className={inputCls} style={inputStyle} value={f.data} onChange={(e) => set('data', e.target.value)} /></Field>
        <Field label="Luogo"><input className={inputCls} style={inputStyle} value={f.luogo} onChange={(e) => set('luogo', e.target.value)} /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: T.line }}>Annulla</button>
        <button onClick={() => onSave(f)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white inline-flex items-center gap-1.5" style={{ background: T.brass }}><Save size={14} />Salva evento</button>
      </div>
    </div>
  );
}

function Eventi({ data, mutate }) {
  const { eventi, cavalli, clienti } = data;
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);
  const save = (f) => {
    let next;
    if (f.id) next = eventi.map((e) => (e.id === f.id ? f : e));
    else next = [...eventi, { ...f, id: uid('e') }];
    mutate('eventi', next);
    setModal(null);
  };
  const remove = (id) => { mutate('eventi', eventi.filter((e) => e.id !== id)); setDel(null); };
  const nomeCliente = (id) => { const c = clienti.find((x) => x.id === id); return c ? `${c.nome} ${c.cognome}` : '—'; };
  const nomeCavallo = (id) => cavalli.find((h) => h.id === id)?.nome || '—';

  const sorted = [...eventi].sort((a, b) => a.data.localeCompare(b.data));

  return (
    <div>
      <SectionHeader eyebrow={`${eventi.length} eventi in calendario`} title="Gare & Eventi" action={<PrimaryButton icon={Plus} onClick={() => setModal({})}>Nuovo evento</PrimaryButton>} />
      <div className="space-y-4">
        {sorted.map((ev) => {
          const giorni = daysUntil(ev.data);
          return (
            <Card key={ev.id} className="p-5">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0" style={{ background: T.paper }}>
                    <div className="text-[10px] uppercase font-semibold" style={{ color: T.brassDark }}>{new Date(ev.data).toLocaleDateString('it-IT', { month: 'short' })}</div>
                    <div className="font-serif text-xl leading-none" style={{ color: T.ink }}>{new Date(ev.data).getDate()}</div>
                  </div>
                  <div>
                    <div className="font-serif text-lg" style={{ color: T.ink }}>{ev.nome}</div>
                    <div className="text-xs flex items-center gap-1.5 mt-1" style={{ color: T.inkSoft }}><MapPin size={12} />{ev.luogo}</div>
                    <div className="flex gap-1.5 mt-2"><Pill tone="brass">{ev.tipo}</Pill><Pill tone={urgencyTone(giorni)}>{urgencyLabel(giorni)}</Pill></div>
                  </div>
                </div>
                <div className="flex gap-1"><IconBtn title="Modifica" onClick={() => setModal(ev)}><Edit2 size={14} /></IconBtn><IconBtn title="Elimina" onClick={() => setDel(ev)}><Trash2 size={14} /></IconBtn></div>
              </div>
              {ev.iscritti.length > 0 && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: T.line }}>
                  <div className="text-xs font-semibold uppercase mb-2" style={{ color: T.inkSoft }}>Iscritti ({ev.iscritti.length})</div>
                  <div className="flex flex-wrap gap-2">
                    {ev.iscritti.map((it, idx) => <Pill key={idx}>{nomeCavallo(it.cavalloId)} · {nomeCliente(it.clienteId)} {it.categoria !== '—' ? `· ${it.categoria}` : ''}</Pill>)}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      {sorted.length === 0 && <EmptyState icon={Award} text="Nessun evento in programma" />}
      {modal && <Modal title={modal.id ? 'Modifica evento' : 'Nuovo evento'} onClose={() => setModal(null)}><EventoForm initial={modal.id ? modal : null} onSave={save} onCancel={() => setModal(null)} /></Modal>}
      {del && <ConfirmDelete label={del.nome} onConfirm={() => remove(del.id)} onCancel={() => setDel(null)} />}
    </div>
  );
}

/* ============================= MAGAZZINO ============================= */
function MagazzinoForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState(initial || { nome: '', categoria: 'Mangime', quantita: 0, unita: 'kg', soglia: 0, fornitore: '', ultimo: todayISO() });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <div>
      <Field label="Articolo"><input className={inputCls} style={inputStyle} value={f.nome} onChange={(e) => set('nome', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Categoria">
          <select className={inputCls} style={inputStyle} value={f.categoria} onChange={(e) => set('categoria', e.target.value)}>
            <option>Mangime</option><option>Lettiera</option><option>Farmaci</option><option>Attrezzatura</option>
          </select>
        </Field>
        <Field label="Fornitore"><input className={inputCls} style={inputStyle} value={f.fornitore} onChange={(e) => set('fornitore', e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Quantità"><input type="number" className={inputCls} style={inputStyle} value={f.quantita} onChange={(e) => set('quantita', Number(e.target.value))} /></Field>
        <Field label="Unità"><input className={inputCls} style={inputStyle} value={f.unita} onChange={(e) => set('unita', e.target.value)} /></Field>
        <Field label="Soglia minima"><input type="number" className={inputCls} style={inputStyle} value={f.soglia} onChange={(e) => set('soglia', Number(e.target.value))} /></Field>
      </div>
      <Field label="Ultimo rifornimento"><input type="date" className={inputCls} style={inputStyle} value={f.ultimo} onChange={(e) => set('ultimo', e.target.value)} /></Field>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: T.line }}>Annulla</button>
        <button onClick={() => onSave(f)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white inline-flex items-center gap-1.5" style={{ background: T.brass }}><Save size={14} />Salva articolo</button>
      </div>
    </div>
  );
}

function Magazzino({ data, mutate }) {
  const { magazzino } = data;
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);
  const save = (f) => {
    let next;
    if (f.id) next = magazzino.map((m) => (m.id === f.id ? f : m));
    else next = [...magazzino, { ...f, id: uid('m') }];
    mutate('magazzino', next);
    setModal(null);
  };
  const remove = (id) => { mutate('magazzino', magazzino.filter((m) => m.id !== id)); setDel(null); };
  const basse = magazzino.filter((m) => m.quantita <= m.soglia).length;

  return (
    <div>
      <SectionHeader eyebrow={basse > 0 ? `${basse} articoli sotto soglia` : 'Scorte in ordine'} title="Magazzino" action={<PrimaryButton icon={Plus} onClick={() => setModal({})}>Nuovo articolo</PrimaryButton>} />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: T.paper }}>
              {['Articolo', 'Categoria', 'Quantità', 'Soglia minima', 'Fornitore', 'Ultimo rifornimento', ''].map((h) => <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: T.inkSoft }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {magazzino.map((m) => {
              const low = m.quantita <= m.soglia;
              return (
                <tr key={m.id} className="border-t hover:bg-stone-50" style={{ borderColor: T.line }}>
                  <td className="px-5 py-3 font-medium" style={{ color: T.ink }}>{m.nome}</td>
                  <td className="px-5 py-3"><Pill tone="brass">{m.categoria}</Pill></td>
                  <td className="px-5 py-3 font-mono" style={{ color: low ? T.rust : T.ink }}>{m.quantita} {m.unita}</td>
                  <td className="px-5 py-3 font-mono text-xs" style={{ color: T.inkSoft }}>{m.soglia} {m.unita}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: T.inkSoft }}>{m.fornitore}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: T.inkSoft }}>{fmtDate(m.ultimo)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {low && <Pill tone="bad"><span className="flex items-center gap-1"><AlertTriangle size={11} />sotto soglia</span></Pill>}
                      <IconBtn title="Modifica" onClick={() => setModal(m)}><Edit2 size={14} /></IconBtn>
                      <IconBtn title="Elimina" onClick={() => setDel(m)}><Trash2 size={14} /></IconBtn>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      {modal && <Modal title={modal.id ? 'Modifica articolo' : 'Nuovo articolo'} onClose={() => setModal(null)}><MagazzinoForm initial={modal.id ? modal : null} onSave={save} onCancel={() => setModal(null)} /></Modal>}
      {del && <ConfirmDelete label={del.nome} onConfirm={() => remove(del.id)} onCancel={() => setDel(null)} />}
    </div>
  );
}

/* ============================= DOCUMENTI ============================= */
function DocumentoForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState(initial || { nome: '', tipo: 'Certificato medico', associato: '', scadenza: '', note: '' });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <div>
      <Field label="Nome documento"><input className={inputCls} style={inputStyle} value={f.nome} onChange={(e) => set('nome', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo">
          <select className={inputCls} style={inputStyle} value={f.tipo} onChange={(e) => set('tipo', e.target.value)}>
            <option>Certificato medico</option><option>Assicurazione</option><option>Contratto</option><option>Documento cavallo</option><option>Altro</option>
          </select>
        </Field>
        <Field label="Associato a"><input className={inputCls} style={inputStyle} value={f.associato} onChange={(e) => set('associato', e.target.value)} /></Field>
      </div>
      <Field label="Scadenza (lascia vuoto se non prevista)"><input type="date" className={inputCls} style={inputStyle} value={f.scadenza} onChange={(e) => set('scadenza', e.target.value)} /></Field>
      <Field label="Note"><textarea className={inputCls} style={inputStyle} rows={2} value={f.note} onChange={(e) => set('note', e.target.value)} /></Field>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: T.line }}>Annulla</button>
        <button onClick={() => onSave(f)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white inline-flex items-center gap-1.5" style={{ background: T.brass }}><Save size={14} />Salva documento</button>
      </div>
    </div>
  );
}

function Documenti({ data, mutate }) {
  const { documenti } = data;
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);
  const save = (f) => {
    let next;
    if (f.id) next = documenti.map((d) => (d.id === f.id ? f : d));
    else next = [...documenti, { ...f, id: uid('d') }];
    mutate('documenti', next);
    setModal(null);
  };
  const remove = (id) => { mutate('documenti', documenti.filter((d) => d.id !== id)); setDel(null); };
  const sorted = [...documenti].sort((a, b) => (a.scadenza || '9999').localeCompare(b.scadenza || '9999'));

  return (
    <div>
      <SectionHeader eyebrow={`${documenti.length} documenti archiviati`} title="Documenti" action={<PrimaryButton icon={Plus} onClick={() => setModal({})}>Nuovo documento</PrimaryButton>} />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: T.paper }}>
              {['Documento', 'Tipo', 'Associato a', 'Scadenza', ''].map((h) => <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: T.inkSoft }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {sorted.map((d) => {
              const giorni = d.scadenza ? daysUntil(d.scadenza) : null;
              return (
                <tr key={d.id} className="border-t hover:bg-stone-50" style={{ borderColor: T.line }}>
                  <td className="px-5 py-3 font-medium flex items-center gap-2" style={{ color: T.ink }}><FileText size={14} style={{ color: T.brassDark }} />{d.nome}</td>
                  <td className="px-5 py-3"><Pill tone="brass">{d.tipo}</Pill></td>
                  <td className="px-5 py-3 text-xs" style={{ color: T.inkSoft }}>{d.associato}</td>
                  <td className="px-5 py-3">{d.scadenza ? <Pill tone={urgencyTone(giorni)}>{fmtDate(d.scadenza)}</Pill> : <span className="text-xs" style={{ color: T.inkSoft }}>Nessuna scadenza</span>}</td>
                  <td className="px-5 py-3"><div className="flex gap-1 justify-end"><IconBtn title="Modifica" onClick={() => setModal(d)}><Edit2 size={14} /></IconBtn><IconBtn title="Elimina" onClick={() => setDel(d)}><Trash2 size={14} /></IconBtn></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      {modal && <Modal title={modal.id ? 'Modifica documento' : 'Nuovo documento'} onClose={() => setModal(null)}><DocumentoForm initial={modal.id ? modal : null} onSave={save} onCancel={() => setModal(null)} /></Modal>}
      {del && <ConfirmDelete label={del.nome} onConfirm={() => remove(del.id)} onCancel={() => setDel(null)} />}
    </div>
  );
}

/* ============================= IMPOSTAZIONI ============================= */
function Impostazioni({ data, mutate, role, orgId }) {
  const [f, setF] = useState(data.impostazioni);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const [saved, setSaved] = useState(false);
  const [invite, setInvite] = useState('');
  const [inviteErr, setInviteErr] = useState('');
  const isOwner = role === 'owner';
  const save = () => { mutate('impostazioni', f); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const genInvite = async () => {
    setInviteErr('');
    const { supabase } = await import('./lib/db.js');
    const { data: code, error } = await supabase.rpc('create_invite', { p_org: orgId, p_role: 'staff' });
    if (error) setInviteErr(error.message);
    else setInvite(code);
  };

  return (
    <div>
      <SectionHeader eyebrow="Configurazione" title="Impostazioni struttura" />
      <Card className="p-6 max-w-xl">
        <Field label="Nome struttura"><input disabled={!isOwner} className={inputCls} style={inputStyle} value={f.nome} onChange={(e) => set('nome', e.target.value)} /></Field>
        <Field label="Indirizzo"><input disabled={!isOwner} className={inputCls} style={inputStyle} value={f.indirizzo} onChange={(e) => set('indirizzo', e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="P.IVA"><input disabled={!isOwner} className={inputCls} style={inputStyle} value={f.piva} onChange={(e) => set('piva', e.target.value)} /></Field>
          <Field label="Telefono"><input disabled={!isOwner} className={inputCls} style={inputStyle} value={f.telefono} onChange={(e) => set('telefono', e.target.value)} /></Field>
        </div>
        <Field label="Email"><input disabled={!isOwner} className={inputCls} style={inputStyle} value={f.email} onChange={(e) => set('email', e.target.value)} /></Field>
        {isOwner && (
          <div className="flex items-center gap-3 mt-4">
            <button onClick={save} className="px-4 py-2 rounded-lg text-sm font-semibold text-white inline-flex items-center gap-1.5" style={{ background: T.brass }}><Save size={14} />Salva impostazioni</button>
            {saved && <span className="text-xs font-medium" style={{ color: T.sage }}>Salvato ✓</span>}
          </div>
        )}
        {!isOwner && <div className="text-xs mt-2" style={{ color: T.inkSoft }}>Solo il titolare puo modificare questi dati.</div>}
      </Card>

      {isOwner && (
        <Card className="p-6 max-w-xl mt-5">
          <h3 className="font-serif text-lg mb-1" style={{ color: T.ink }}>Invita un collaboratore</h3>
          <p className="text-xs mb-4" style={{ color: T.inkSoft }}>Genera un codice e passalo al dipendente: lo inserira dopo la registrazione. Avra accesso a tutto tranne la fatturazione.</p>
          <div className="flex items-center gap-3">
            <button onClick={genInvite} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: T.forest }}>Genera codice invito</button>
            {invite && <span className="font-mono text-lg font-bold tracking-widest px-3 py-1.5 rounded-lg" style={{ background: T.amberBg, color: T.brassDark }}>{invite}</span>}
          </div>
          {inviteErr && <div className="text-xs mt-2" style={{ color: T.rust }}>{inviteErr}</div>}
        </Card>
      )}

      <div className="mt-6 text-xs max-w-xl" style={{ color: T.inkSoft }}>
        Tutti i dati sono salvati in cloud e condivisi in tempo reale con i membri della tua scuderia.
      </div>
    </div>
  );
}

/* ============================= APP ROOT ============================= */
export default function App({ data, mutate, role, orgId, onLogout }) {
  const [active, setActive] = useState('dashboard');
  const { clienti, cavalli, fatture, magazzino, impostazioni } = data;

  const alerts = useMemo(() => {
    const certScaduti = clienti.filter((c) => daysUntil(c.certMedico) !== null && daysUntil(c.certMedico) <= 14).length;
    const sanitarie = cavalli.reduce((s, h) => {
      const v = h.vaccinazioni[h.vaccinazioni.length - 1];
      const f = h.ferrature[h.ferrature.length - 1];
      let c = 0;
      if (v && daysUntil(v.prossima) <= 14) c++;
      if (f && daysUntil(f.prossima) <= 14) c++;
      return s + c;
    }, 0);
    const fattScadute = role === 'owner' ? fatture.filter((f) => f.stato !== 'pagata').length : 0;
    const magBasso = magazzino.filter((m) => m.quantita <= m.soglia).length;
    return { soci: certScaduti || undefined, cavalli: sanitarie || undefined, fatturazione: fattScadute || undefined, magazzino: magBasso || undefined };
  }, [clienti, cavalli, fatture, magazzino, role]);

  const screens = {
    dashboard: <Dashboard data={data} setActive={setActive} role={role} />,
    soci: <Soci data={data} mutate={mutate} />,
    cavalli: <Cavalli data={data} mutate={mutate} />,
    calendario: <Calendario data={data} mutate={mutate} />,
    istruttori: <Istruttori data={data} mutate={mutate} />,
    box: <BoxModule data={data} mutate={mutate} />,
    fatturazione: role === 'owner' ? <Fatturazione data={data} mutate={mutate} /> : null,
    eventi: <Eventi data={data} mutate={mutate} />,
    magazzino: <Magazzino data={data} mutate={mutate} />,
    documenti: <Documenti data={data} mutate={mutate} />,
    impostazioni: <Impostazioni data={data} mutate={mutate} role={role} orgId={orgId} />,
  };

  return (
    <div className="min-h-screen flex font-sans" style={{ background: T.paper }}>
      <Sidebar active={active} setActive={setActive} impostazioni={impostazioni} alerts={alerts} role={role} onLogout={onLogout} />
      <main className="flex-1 p-8 max-w-[1400px]">
        {screens[active]}
      </main>
    </div>
  );
}
