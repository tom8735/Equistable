# Equistable CRM — Versione Cloud

Gestionale multi-utente per scuderie. Stack: React + Vite + Supabase (database, auth, realtime) + Cloudflare Pages (hosting). Costo: zero sui free tier.

## Come funziona

- Ogni scuderia è una **organizzazione** separata: i dati sono isolati a livello di database (Row Level Security), quindi un solo deploy serve tutti i tuoi clienti.
- **Titolare (owner)**: vede tutto, gestisce fatturazione e impostazioni, genera codici invito.
- **Staff**: gestisce soci, cavalli, lezioni, box, magazzino, eventi, documenti. Non vede la fatturazione (bloccato dal database, non solo dall'interfaccia).
- **Realtime**: se un dipendente aggiunge una lezione, gli altri la vedono comparire senza ricaricare.

## Setup Supabase (5 minuti)

1. Vai su https://supabase.com → New project (piano Free). Scegli una password DB e regione EU.
2. Apri **SQL Editor** → New query → incolla tutto il contenuto di `supabase/schema.sql` → Run. Deve finire senza errori.
3. Vai su **Project Settings → API** e copia:
   - `Project URL`
   - `anon public` key
4. (Consigliato per iniziare) **Authentication → Providers → Email**: disattiva "Confirm email" per non dover configurare l'invio email subito. Riattivalo quando vai in produzione con un provider SMTP.

## Sviluppo locale

```bash
cp .env.example .env    # inserisci URL e anon key
npm install
npm run dev
```

## Deploy su Cloudflare Pages (gratis, anche per uso commerciale)

1. Carica questo progetto su un repo GitHub (privato va bene).
2. https://dash.cloudflare.com → **Workers & Pages → Create → Pages → Connect to Git** → scegli il repo.
3. Impostazioni build:
   - Framework preset: **None** (o Vite)
   - Build command: `npm run build`
   - Build output directory: `dist`
4. In **Settings → Environment variables** aggiungi:
   - `VITE_SUPABASE_URL` = il Project URL
   - `VITE_SUPABASE_ANON_KEY` = la anon key
5. Deploy. Ottieni `tuo-progetto.pages.dev`; dominio custom collegabile gratis da **Custom domains**.

In alternativa senza GitHub: `npx wrangler pages deploy dist` dopo `npm run build`.

## Primo utilizzo

1. Apri il sito → **Registrati** → **Crea la mia scuderia**.
2. Da **Impostazioni → Invita un collaboratore** genera un codice.
3. Il dipendente si registra, sceglie **Ho un codice invito** e lo inserisce.

## Note tecniche

- I dati di ogni modulo sono righe `jsonb` per org: schema flessibile, facile aggiungere campi senza migrazioni.
- La sicurezza è nel database: le policy RLS in `schema.sql` sono l'unica fonte di verità. La anon key è pubblica per design — senza sessione valida e membership non si legge nulla.
- Free tier Supabase: il progetto va in pausa dopo 7 giorni senza traffico (si riattiva dalla dashboard). Con clienti paganti valuta il piano Pro.

## Struttura

```
supabase/schema.sql   → schema completo: tabelle, RLS, ruoli, inviti, realtime
src/Root.jsx          → sessione, membership, caricamento dati, realtime, sync
src/Auth.jsx          → login/registrazione + crea/entra scuderia
src/App.jsx           → il CRM (11 moduli, role-aware)
src/lib/db.js         → client Supabase + data layer (diff sync, realtime)
```
