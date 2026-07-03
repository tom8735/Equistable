import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anon);

export const COLLECTIONS = ['clienti', 'cavalli', 'istruttori', 'box', 'lezioni', 'fatture', 'eventi', 'magazzino', 'documenti', 'mangimi', 'diete'];

/** Carica tutte le righe di una collezione per l'org corrente e restituisce l'array dei payload. */
export async function loadCollection(table, orgId) {
  const { data, error } = await supabase.from(table).select('id, data').eq('org_id', orgId);
  if (error) {
    // fatture: lo staff riceve un array vuoto (RLS), non un errore bloccante
    if (table === 'fatture') return [];
    // tabella non ancora creata (migrazione non eseguita): non bloccare l'app
    if (error.code === '42P01') { console.warn(`Tabella ${table} mancante: esegui la migrazione SQL.`); return []; }
    throw error;
  }
  return (data || []).map((r) => ({ ...r.data, id: r.id }));
}

export async function loadImpostazioni(orgId) {
  const { data, error } = await supabase.from('impostazioni').select('data').eq('org_id', orgId).maybeSingle();
  if (error) throw error;
  return data?.data || { nome: 'La mia scuderia', indirizzo: '', piva: '', telefono: '', email: '' };
}

/**
 * Sincronizza un intero array verso il DB con diff:
 * upsert delle righe nuove/modificate, delete di quelle rimosse.
 * Mantiene invariata la firma mutate(collection, nextArray) dei moduli UI.
 */
export async function syncCollection(table, orgId, prevArr, nextArr) {
  const prevMap = new Map(prevArr.map((x) => [x.id, JSON.stringify(x)]));
  const nextIds = new Set(nextArr.map((x) => x.id));

  const upserts = nextArr
    .filter((x) => prevMap.get(x.id) !== JSON.stringify(x))
    .map((x) => ({ id: x.id, org_id: orgId, data: x, updated_at: new Date().toISOString() }));

  const deletes = prevArr.filter((x) => !nextIds.has(x.id)).map((x) => x.id);

  if (upserts.length) {
    const { error } = await supabase.from(table).upsert(upserts);
    if (error) throw error;
  }
  if (deletes.length) {
    const { error } = await supabase.from(table).delete().in('id', deletes).eq('org_id', orgId);
    if (error) throw error;
  }
}

export async function syncImpostazioni(orgId, data) {
  const { error } = await supabase.from('impostazioni').upsert({ org_id: orgId, data, updated_at: new Date().toISOString() });
  if (error) throw error;
}

/** Sottoscrizione realtime: al cambiare di una tabella dell'org, richiama onChange(table). */
export function subscribeRealtime(orgId, onChange) {
  const channel = supabase.channel(`org-${orgId}`);
  [...COLLECTIONS, 'impostazioni'].forEach((table) => {
    channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `org_id=eq.${orgId}` }, () => onChange(table));
  });
  channel.subscribe();
  return () => supabase.removeChannel(channel);
}
