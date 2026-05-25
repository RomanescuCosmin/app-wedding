# Aplicație de poze și filmulețe la nuntă

O aplicație web simplă unde invitații pot încărca poze și filmulețe direct de pe
telefon, iar mirii le pot vedea și gestiona într-o zonă de administrare protejată
cu parolă.

Aplicația este construită cu **Next.js** și folosește **Supabase** (gratuit) pentru
stocarea fișierelor. Acest ghid te conduce pas cu pas, chiar dacă nu ai mai folosit
niciodată Supabase.

---

## 1. Creează un cont și un proiect pe Supabase

1. Intră pe [supabase.com](https://supabase.com) și apasă **Start your project**
   (te poți autentifica cu Google sau GitHub — e gratuit).
2. După autentificare, apasă **New project**.
3. Completează:
   - **Name**: orice nume, de exemplu `nunta`.
   - **Database Password**: alege o parolă puternică și **salveaz-o** (e parola
     bazei de date, nu o vei folosi des, dar e bine să o ai notată).
   - **Region**: alege o regiune din **Europa** (de exemplu *Central EU (Frankfurt)*),
     ca încărcarea să fie rapidă pentru invitați.
4. Apasă **Create new project** și așteaptă 1–2 minute să se pregătească.

---

## 2. Copiază cheile de acces (Settings → API)

În proiectul tău Supabase, din meniul din stânga jos apasă pe **Project Settings**
(roata dințată) → **API**. Vei avea nevoie de trei valori:

| Unde scrie în Supabase            | Unde se pune în aplicație (`.env.local`) |
| --------------------------------- | ---------------------------------------- |
| **Project URL**                   | `NEXT_PUBLIC_SUPABASE_URL`               |
| **Project API Keys → `anon` `public`** | `NEXT_PUBLIC_SUPABASE_ANON_KEY`     |
| **Project API Keys → `service_role` `secret`** | `SUPABASE_SERVICE_ROLE_KEY`|

> ⚠️ Cheia **`service_role`** este **secretă**. Nu o pune niciodată în cod public,
> nu o trimite nimănui și nu o folosi în browser. Aici e folosită doar pe server.

Apasă pe iconița de „copiere" de lângă fiecare valoare și ține-le la îndemână
pentru pasul 5.

---

## 3. Creează tabelul în baza de date (SQL Editor)

1. În Supabase, din meniul din stânga, deschide **SQL Editor**.
2. Apasă **New query**.
3. Deschide fișierul [`supabase/schema.sql`](./supabase/schema.sql) din acest proiect,
   copiază tot conținutul și lipește-l în editor.
4. Apasă **Run** (sau `Ctrl+Enter`).

Acest script creează tabelul `uploads`, activează securitatea (RLS) și încearcă să
creeze și bucket-ul de stocare. Îl poți rula liniștit de mai multe ori — nu strică
nimic dacă există deja.

---

## 4. Verifică bucket-ul de stocare `wedding-media` (privat)

Scriptul de la pasul 3 încearcă să creeze automat bucket-ul. Verifică:

1. În Supabase, deschide **Storage** din meniul din stânga.
2. Ar trebui să vezi un bucket numit **`wedding-media`**.
3. **Dacă NU există**, creează-l manual:
   - Apasă **New bucket**.
   - **Name**: `wedding-media` (exact așa).
   - Lasă opțiunea **Public bucket** **DEZACTIVATĂ** (bucket-ul trebuie să fie privat).
   - Apasă **Create bucket**.

> De ce privat? Pozele nu sunt accesibile public; aplicația generează pe server
> link-uri temporare semnate, valabile o oră, doar pentru zona de administrare.

---

## 5. Configurează variabilele de mediu (`.env.local`)

1. În folderul proiectului, fă o copie a fișierului `.env.example` și
   redenumește-o `.env.local`.

   În PowerShell (Windows):
   ```powershell
   Copy-Item .env.example .env.local
   ```

2. Deschide `.env.local` și completează valorile:

   ```env
   # De la pasul 2 (Settings → API)
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=cheia-anon-public
   SUPABASE_SERVICE_ROLE_KEY=cheia-service-role-secret

   # Parola cu care intri tu în zona de administrare (alege-o singur)
   ADMIN_PASSWORD=o-parola-numai-a-ta

   # Personalizare (apar în interfață)
   NEXT_PUBLIC_COUPLE_NAMES=Ana & Mihai
   NEXT_PUBLIC_WEDDING_DATE=2026-06-12
   ```

   - **`ADMIN_PASSWORD`**: alege tu o parolă. Cu ea te vei autentifica în zona de
     administrare ca să vezi și să ștergi pozele.
   - **`NEXT_PUBLIC_COUPLE_NAMES`**: numele mirilor, afișate în aplicație.
   - **`NEXT_PUBLIC_WEDDING_DATE`**: data nunții în format `AAAA-LL-ZZ`.

> Fișierul `.env.local` rămâne doar pe calculatorul tău (nu se urcă în Git) și
> conține secrete — nu îl trimite nimănui.

---

## 6. Pornește aplicația local

Ai nevoie de [Node.js](https://nodejs.org) instalat (versiunea 24 recomandată).

În folderul proiectului, rulează:

```bash
npm install
npm run dev
```

Deschide [http://localhost:3000](http://localhost:3000) în browser. Gata!

---

## Deploy pe Vercel

Când vrei ca aplicația să fie disponibilă online (nu doar pe calculatorul tău),
o poți publica gratuit pe [Vercel](https://vercel.com), creatorii Next.js.

### 1. Urcă proiectul pe GitHub

1. Creează-ți un cont pe [github.com](https://github.com) (dacă nu ai deja).
2. Creează un **repository nou** (de exemplu `aplicatie-nunti`). Poate fi privat.
3. În folderul proiectului, urcă codul (în PowerShell sau terminal):

   ```bash
   git init
   git add .
   git commit -m "Aplicație nuntă"
   git branch -M main
   git remote add origin https://github.com/utilizatorul-tau/aplicatie-nunti.git
   git push -u origin main
   ```

> Fișierul `.env.local` **nu** se urcă (e ignorat de `.gitignore`) — secretele le
> vei pune direct în Vercel la pasul 3.

### 2. Conectează Vercel și importă proiectul

1. Intră pe [vercel.com](https://vercel.com) și autentifică-te cu contul de **GitHub**.
2. Apasă **Add New… → Project**.
3. Alege repository-ul `aplicatie-nunti` din listă și apasă **Import**.
4. Vercel detectează automat că e un proiect **Next.js** — nu trebuie să schimbi
   nimic la *Build & Output Settings*.
5. **NU apăsa încă Deploy** — întâi adaugă variabilele de mediu (pasul următor).

### 3. Setează variabilele de mediu în Vercel

Tot în ecranul de import (sau ulterior din **Project Settings → Environment
Variables**), adaugă fiecare variabilă de mai jos. Pune valorile din `.env.local`:

| Variabilă                       | Valoare                                                    |
| ------------------------------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Project URL din Supabase                                   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | cheia `anon` `public` din Supabase                         |
| `SUPABASE_SERVICE_ROLE_KEY`     | cheia `service_role` `secret` din Supabase                 |
| `ADMIN_PASSWORD`                | parola ta pentru zona de administrare                      |
| `NEXT_PUBLIC_COUPLE_NAMES`      | numele mirilor, ex. `Ana & Mihai`                          |
| `NEXT_PUBLIC_WEDDING_DATE`      | data nunții, format `AAAA-LL-ZZ`                            |
| `NEXT_PUBLIC_SITE_URL`          | URL-ul de producție, ex. `https://numele-tau.vercel.app`   |

> ⚠️ **`SUPABASE_SERVICE_ROLE_KEY` este secretă.** Se folosește **doar pe server**
> și **nu** trebuie să aibă prefixul `NEXT_PUBLIC_`. Variabilele cu `NEXT_PUBLIC_`
> ajung în browser și sunt vizibile pentru oricine — cheia `service_role` nu are
> ce căuta acolo.

> 💡 Despre `NEXT_PUBLIC_SITE_URL`: nu o știi încă la prima publicare. Poți lăsa
> codul QR să detecteze automat domeniul din browser, sau (recomandat) după
> primul deploy copiezi URL-ul dat de Vercel (ex. `https://numele-tau.vercel.app`),
> îl pui aici și apeși **Redeploy**. Astfel codul QR arată mereu spre domeniul
> corect, indiferent de unde îl deschizi.

Apasă **Deploy** și așteaptă 1–2 minute. La final primești un link de tipul
`https://numele-tau.vercel.app`.

### 4. Verifică Supabase (CORS / URL config)

Pentru această aplicație **nu** e nevoie de configurări speciale: link-urile către
poze sunt **semnate pe server** și funcționează din orice domeniu. Dacă totuși,
după deploy, vezi erori de tip CORS la încărcare, intră în Supabase la
**Project Settings → API** (sau **Authentication → URL Configuration**) și adaugă
domeniul tău Vercel (`https://numele-tau.vercel.app`) în lista de URL-uri permise.

### 5. După deploy

1. Deschide `https://numele-tau.vercel.app/admin`.
2. Autentifică-te cu `ADMIN_PASSWORD`.
3. Coboară la secțiunea **„Cod QR"**, apasă **Descarcă QR (PNG)** (sau
   **Printează**).
4. Printează codul și pune-l pe mese / pe invitații. Invitații îl scanează și
   ajung direct la pagina de încărcare a pozelor.

### Checklist final

- [ ] Codul e urcat pe GitHub.
- [ ] Proiectul e importat în Vercel.
- [ ] Toate cele 7 variabile de mediu sunt setate în Vercel.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` **fără** prefix `NEXT_PUBLIC_`.
- [ ] `NEXT_PUBLIC_SITE_URL` setat la URL-ul real Vercel (apoi Redeploy).
- [ ] Pagina publică `/` se deschide și permite încărcarea pozelor.
- [ ] `/admin` se deschide, login-ul funcționează, galeria se încarcă.
- [ ] Codul QR descărcat se scanează corect și duce la pagina publică.
