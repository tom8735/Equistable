import React, { useState } from 'react';
import { supabase } from './lib/db.js';

const T = {
  forest: '#16241C', brass: '#B8863E', brassDark: '#8F6A2E', paper: '#F7F5F0',
  ink: '#26221C', inkSoft: '#6B6357', line: '#E7E1D4', rust: '#A8452F',
};

function HorseshoeMark({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 22V12.5C6 8.36 8.69 5 12 5s6 3.36 6 7.5V22" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M9 22v-9.2C9 10.1 10.34 8 12 8s3 2.1 3 4.8V22" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

const input = "w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 bg-white mb-3";

function Shell({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: T.paper }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: T.forest }}>
            <HorseshoeMark size={22} color={T.brass} />
          </div>
          <div>
            <div className="font-serif text-xl" style={{ color: T.ink }}>Equistable CRM</div>
            <div className="text-[11px] uppercase tracking-wider" style={{ color: T.brassDark }}>Gestionale equestre</div>
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-6" style={{ borderColor: T.line }}>
          <h2 className="font-serif text-lg mb-1" style={{ color: T.ink }}>{title}</h2>
          {subtitle && <p className="text-xs mb-4" style={{ color: T.inkSoft }}>{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}

export function AuthScreen() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr(''); setInfo(''); setBusy(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user && !data.session) setInfo('Controlla la tua email per confermare la registrazione, poi accedi.');
      }
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <Shell title={mode === 'login' ? 'Accedi' : 'Crea un account'} subtitle={mode === 'login' ? 'Entra nel gestionale della tua scuderia' : 'Registrati con email e password'}>
      <input className={input} style={{ borderColor: T.line }} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className={input} style={{ borderColor: T.line }} type="password" placeholder="Password (min. 6 caratteri)" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
      {err && <div className="text-xs mb-3" style={{ color: T.rust }}>{err}</div>}
      {info && <div className="text-xs mb-3" style={{ color: T.brassDark }}>{info}</div>}
      <button disabled={busy} onClick={submit} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ background: T.brass }}>
        {busy ? 'Attendere…' : mode === 'login' ? 'Accedi' : 'Registrati'}
      </button>
      <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErr(''); setInfo(''); }} className="w-full text-xs mt-4" style={{ color: T.inkSoft }}>
        {mode === 'login' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
      </button>
    </Shell>
  );
}

export function OrgOnboarding({ onDone }) {
  const [mode, setMode] = useState('choose');
  const [nome, setNome] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const createOrg = async () => {
    setErr(''); setBusy(true);
    const { data, error } = await supabase.rpc('create_org', { p_nome: nome || 'La mia scuderia' });
    setBusy(false);
    if (error) return setErr(error.message);
    onDone(data);
  };
  const joinOrg = async () => {
    setErr(''); setBusy(true);
    const { data, error } = await supabase.rpc('join_org', { p_code: code.trim().toUpperCase() });
    setBusy(false);
    if (error) return setErr(error.message);
    onDone(data);
  };

  if (mode === 'choose') return (
    <Shell title="Benvenuto" subtitle="Sei il titolare di una scuderia o un collaboratore?">
      <button onClick={() => setMode('create')} className="w-full py-3 rounded-xl text-sm font-semibold text-white mb-3" style={{ background: T.brass }}>Crea la mia scuderia</button>
      <button onClick={() => setMode('join')} className="w-full py-3 rounded-xl text-sm font-semibold border" style={{ borderColor: T.line, color: T.ink }}>Ho un codice invito</button>
      <button onClick={() => supabase.auth.signOut()} className="w-full text-xs mt-4" style={{ color: T.inkSoft }}>Esci</button>
    </Shell>
  );

  if (mode === 'create') return (
    <Shell title="Nuova scuderia" subtitle="Sarai il titolare: potrai invitare i collaboratori dalle Impostazioni.">
      <input className={input} style={{ borderColor: T.line }} placeholder="Nome della scuderia" value={nome} onChange={(e) => setNome(e.target.value)} />
      {err && <div className="text-xs mb-3" style={{ color: T.rust }}>{err}</div>}
      <button disabled={busy} onClick={createOrg} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ background: T.brass }}>{busy ? 'Creazione…' : 'Crea scuderia'}</button>
      <button onClick={() => setMode('choose')} className="w-full text-xs mt-4" style={{ color: T.inkSoft }}>Indietro</button>
    </Shell>
  );

  return (
    <Shell title="Entra con codice invito" subtitle="Chiedi il codice di 8 caratteri al titolare della scuderia.">
      <input className={input} style={{ borderColor: T.line }} placeholder="Es. 4F7A2C91" value={code} onChange={(e) => setCode(e.target.value)} />
      {err && <div className="text-xs mb-3" style={{ color: T.rust }}>{err}</div>}
      <button disabled={busy} onClick={joinOrg} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ background: T.brass }}>{busy ? 'Verifica…' : 'Entra nella scuderia'}</button>
      <button onClick={() => setMode('choose')} className="w-full text-xs mt-4" style={{ color: T.inkSoft }}>Indietro</button>
    </Shell>
  );
}
