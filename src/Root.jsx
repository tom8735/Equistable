import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, COLLECTIONS, loadCollection, loadImpostazioni, syncCollection, syncImpostazioni, subscribeRealtime } from './lib/db.js';
import { AuthScreen, OrgOnboarding } from './Auth.jsx';
import App from './App.jsx';

export default function Root() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [membership, setMembership] = useState(undefined);
  const [store, setStore] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const storeRef = useRef(null);
  storeRef.current = store;

  // 1) Sessione
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // 2) Membership (org + ruolo)
  useEffect(() => {
    if (!session) { setMembership(session === null ? null : undefined); return; }
    (async () => {
      const { data, error } = await supabase.from('memberships').select('org_id, role').eq('user_id', session.user.id).limit(1);
      if (error) { setLoadErr(error.message); return; }
      setMembership(data && data.length ? data[0] : null);
    })();
  }, [session]);

  const reloadTable = useCallback(async (table, orgId) => {
    try {
      if (table === 'impostazioni') {
        const imp = await loadImpostazioni(orgId);
        setStore((p) => ({ ...p, impostazioni: imp }));
      } else {
        const arr = await loadCollection(table, orgId);
        setStore((p) => ({ ...p, [table]: arr }));
      }
    } catch (e) { console.error('reload', table, e); }
  }, []);

  // 3) Caricamento dati + realtime
  useEffect(() => {
    if (!membership) return;
    const orgId = membership.org_id;
    let unsub = () => {};
    (async () => {
      try {
        const entries = await Promise.all(COLLECTIONS.map(async (t) => [t, await loadCollection(t, orgId)]));
        const impostazioni = await loadImpostazioni(orgId);
        setStore({ ...Object.fromEntries(entries), impostazioni });
        unsub = subscribeRealtime(orgId, (table) => reloadTable(table, orgId));
      } catch (e) { setLoadErr(e.message); }
    })();
    return () => unsub();
  }, [membership, reloadTable]);

  // 4) mutate compatibile con i moduli: aggiornamento ottimistico + sync al DB
  const mutate = useCallback(async (key, value) => {
    const orgId = membership.org_id;
    const prev = storeRef.current[key];
    setStore((p) => ({ ...p, [key]: value }));
    try {
      if (key === 'impostazioni') await syncImpostazioni(orgId, value);
      else await syncCollection(key, orgId, prev, value);
    } catch (e) {
      console.error('sync', key, e);
      setStore((p) => ({ ...p, [key]: prev })); // rollback
      alert('Salvataggio non riuscito: ' + e.message);
    }
  }, [membership]);

  if (session === undefined || (session && membership === undefined)) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-stone-500" style={{ background: '#F7F5F0' }}>Caricamento…</div>;
  }
  if (!session) return <AuthScreen />;
  if (!membership) return <OrgOnboarding onDone={(orgId) => setMembership({ org_id: orgId, role: 'owner' })} />;
  if (loadErr) return <div className="min-h-screen flex items-center justify-center text-sm text-red-700" style={{ background: '#F7F5F0' }}>Errore: {loadErr}</div>;
  if (!store) return <div className="min-h-screen flex items-center justify-center text-sm text-stone-500" style={{ background: '#F7F5F0' }}>Caricamento dati…</div>;

  return <App data={store} mutate={mutate} role={membership.role} orgId={membership.org_id} onLogout={() => supabase.auth.signOut()} />;
}
