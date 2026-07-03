# Aggiornamento — Alimentazione, logo, fix

## 1. Migrazione database (OBBLIGATORIA, prima del deploy)
Apri Supabase → SQL Editor → incolla `supabase/migrazione_alimentazione.sql` → Run.
Crea le tabelle `mangimi` e `diete`. Senza questa, il modulo Alimentazione appare ma non salva.

## 2. File da sostituire nella repo locale
- src/App.jsx
- src/Auth.jsx
- src/lib/db.js
- index.html
- public/favicon.svg  (nuovo file — crea la cartella public/ se non esiste)
- supabase/schema.sql (solo per riferimento/nuove installazioni)
- supabase/migrazione_alimentazione.sql (nuovo)

## 3. Deploy
git add .
git commit -m "Alimentazione e diete, logo, logo attivita, visite vet, fix"
git push
