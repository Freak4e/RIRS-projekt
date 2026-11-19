# RIRS-projekt – MohorjevaManager

[![CI/CD](https://github.com/Freak4e/RIRS-projekt/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Freak4e/RIRS-projekt/actions/workflows/ci-cd.yml)

Uredniški portal za knjižne projekte: React + TypeScript, Express, Prisma in PostgreSQL.
Fork projekta [ozzvaa/RIRS-projekt](https://github.com/ozzvaa/RIRS-projekt).

**Javna aplikacija:** namestitev na Render še čaka na produkcijsko konfiguracijo.
Dejanski javni URL bo dodan po uspešnem deployu; trenutno javni zagon ni potrjen.

## Funkcionalnosti

Prijava in odjava s piškotkom HttpOnly, upravljanje avtorjev, urednikov in knjižnih
projektov, dodeljevanje urednikov, razvrščanje in prikaz izpolnjenosti. Uredniki
vidijo svoje projekte, administrator in glavni urednik vse. Podroben pregled
petih zgodb in omejitev je v [07-pregled-projekta.md](docs/07-pregled-projekta.md).

## Lokalni zagon (Windows / PowerShell)

Potrebuješ Git, Node.js 24 in vklopljen Docker Desktop z Linux containers.
Docker tu poganja PostgreSQL; frontend in backend tečeta z Node.js. Za CI na
GitHubu ali že objavljeno aplikacijo tvoj Docker Desktop ni potreben.

V korenski mapi projekta:

```powershell
docker compose up -d --wait
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Če `.env` že obstaja, ga ne prepisuj. V `backend/.env` nastavi naključni
`JWT_SECRET`, `ADMIN_EMAIL` in močno `ADMIN_PASSWORD`. Lokalna `DATABASE_URL`
v primeru ustreza bazi iz `compose.yaml`; teh razvojnih podatkov ne uporabljaj
v produkciji.

Backend (prvo terminalsko okno):

```powershell
cd backend
npm.cmd ci
npm.cmd run generate
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run dev
```

Frontend (drugo terminalsko okno, začni v korenu projekta):

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Odpri http://localhost:5173 in se prijavi z vrednostma `ADMIN_EMAIL` in
`ADMIN_PASSWORD` iz svojega `backend/.env`. Vite posreduje `/api` na backend
na vratih 3000. `.cmd` prepreči težavo s PowerShell execution policy;
na Linuxu/macOS uporabi `npm`.

Zaustavitev baze: `docker compose stop`. Podatki ostanejo v Docker volumnu.

## Preverjanje in produkcijska gradnja

Iz korena projekta:

```powershell
npm.cmd run lint --prefix frontend
npm.cmd run lint --prefix backend
npm.cmd run test:coverage --prefix frontend
npm.cmd run test:coverage --prefix backend
npm.cmd run build --prefix frontend
npm.cmd run build --prefix backend
docker build -f Dockerfile.runtime -t rirs-projekt:local .
```

Poročili: `frontend/coverage/index.html`, `backend/coverage/index.html`.
Osnovni testi tečejo brez baze; šest dodatnih integracijskih testov zahteva ločeno
`TEST_DATABASE_URL`. Navodila so v [dokumentaciji CI/CD](docs/08-ci-cd-in-namestitev.md).
V CI teče vseh **49 testov**. Skript `npm start` v backendu zažene zgrajen API;
Docker slika vsebuje tudi zgrajeni frontend in opravi migracije pred zagonom.

## GitHub Actions

Workflow se sproži ob pull requestu v `main` in pushu na `main`:

1. **lint** preveri frontend in backend z Oxlint; napake povzročijo padec.
2. **build** zgradi oba dela in produkcijsko Docker sliko ter shrani artefakt
   `application-build`. Namestitev odvisnosti uporablja npm cache.
3. **test** izvede frontend, backend in PostgreSQL integracijske teste ter
   shrani `coverage-reports`, tudi če test pade.
4. **deploy** teče samo pri pushu na `main` po vseh uspešnih preverjanjih in
   uporablja okolje `production`. Prenese že zgrajeno sliko, jo objavi v GHCR,
   namesti na Render in preveri javni frontend ter povezavo z bazo.
   V tem jobu se aplikacija ne gradi ponovno.

`main` je zaščiten z obveznimi preverjanji `lint`, `build`, `test`.
Spremembe potekajo prek razvojnih vej in PR.

- [Nastavitev gostovanja in secrets](docs/08-ci-cd-in-namestitev.md)
- [Izvedena preverjanja in dokazila](docs/09-preverjanje.md)
- [Izvorne uporabniške zgodbe](docs/05-uporabniske-zgodbe.md)
