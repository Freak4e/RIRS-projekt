# CI/CD in javna namestitev

## Strategija razvoja in preverjanje

Fork: https://github.com/Freak4e/RIRS-projekt. Razvoj poteka v ločenih vejah,
združevanje v `main` prek pull requestov. Pravilo zaščite `main` zahteva
`lint`, `build` in `test`, posodobljenost veje ter razrešene pogovore.
Velja tudi za administratorja; neposredno potiskanje in obvoz padajočih preverjanj
nista predvidena. Actions morajo biti v forku omogočene.

Workflow `.github/workflows/ci-cd.yml` se sproži ob PR v `main` in pushu na `main`.

| Job | Preverjanje / rezultat |
| --- | --- |
| `lint` | Oxlint za frontend in backend; konfiguraciji `.oxlintrc.json`; napake in opozorila povzročijo neuspeh. |
| `build` | Node 24, `npm ci`, frontend Vite, backend TypeScript + esbuild, runtime Docker slika; artefakt `application-build` vsebuje oba `dist`, arhivirano sliko in skript za namestitev. |
| `test` | Vitest, Testing Library in Supertest; PostgreSQL service za integracijske teste; poročili HTML, LCOV in JSON sta v `coverage-reports`, tudi ob neuspešnem testu. |
| `deploy` | Samo push na `main`, `needs: [lint, build, test]`, okolje `production`; prenese artefakt, naloži sliko, jo objavi v GHCR in prek Render API namesti točno njen digest. Počaka na stanje `live` in preveri javni frontend ter `/api/health`. |

`actions/setup-node` predpomni npm prenosni predpomnilnik po obeh lock datotekah.
`npm ci` še vedno zagotavlja ponovljivo namestitev. V `deploy` ni `npm install`,
`npm run build` ali `docker build`; Render uporabi **Existing Image**, ne gradnje
iz repozitorija. Prisma migracije tečejo ob zagonu že zgrajene slike.

Za dokaz zaščite ustvarimo PR z namernim `debugger` stavkom, preverimo padec
`lint` in blokirano združevanje, nato v isti veji napako odstranimo. Konkretne
povezave do izvedb in končni status so zabeleženi v `09-preverjanje.md`.

## Lokalno preverjanje

Osnovna navodila so v README. Za integracijo uporabljaj ločeno testno bazo:

```powershell
docker compose exec -T db createdb -U portal rirs_test
cd backend
$env:DATABASE_URL = 'postgresql://portal:portal_local@localhost:7777/rirs_test'
$env:TEST_DATABASE_URL = $env:DATABASE_URL
npm.cmd run db:migrate
npm.cmd run test:coverage
Remove-Item Env:DATABASE_URL, Env:TEST_DATABASE_URL
```

Brez `TEST_DATABASE_URL` se šest integracijskih testov izpusti, 29 ostalih
backend testov teče brez baze. CI vedno nastavi ločeno testno bazo in izvede vseh
49 testov skupaj. Testi brišejo samo lastne zapise; ne praznijo celotne baze.

## Nastavitve za Render

Za javni zagon potrebujemo uporabnikov Render račun in javno dostopno PostgreSQL
storitev. Lokalni Docker volumen ni javna baza. Na Renderju izberi PostgreSQL
in Web Service v isti regiji. Cene in omejitve preveri pred izbiro paketa:
[Render Free](https://render.com/docs/free). Brezplačna baza po teh navodilih
poteče po 30 dneh, spletna storitev pa po neaktivnosti zaspi; za kasnejšo oddajo
je treba zagotoviti še veljavno bazo ali izbrati drugo PostgreSQL gostovanje.

### GitHub okolje production

V Settings → Environments → production → Environment secrets shrani:

| Secret | Vrednost |
| --- | --- |
| `RENDER_API_KEY` | API ključ tvojega Render računa z dostopom do storitve. |
| `RENDER_SERVICE_ID` | ID spletne storitve, oblike `srv-…`. |
| `DATABASE_URL` | Povezava do gostovane PostgreSQL baze; pri Renderju Internal Database URL v isti regiji. |
| `JWT_SECRET` | Dolga naključna skrivnost, drugačna od lokalne. |
| `ADMIN_EMAIL` | E-naslov začetnega administratorja. |
| `ADMIN_PASSWORD` | Močno geslo začetnega administratorja. |

Environment variable `APP_URL` vsebuje dejanski HTTPS naslov storitve (brez
`/api`). Repository variable `VITE_API_URL` naj bo `/api`: v produkciji je to
URL backenda na istem javnem izvoru. Ta vrednost se vgradi v frontend v jobu
`build`; skrivnosti se v frontend nikoli ne vgrajujejo. Absolutnega URL-ja druge
domene ne nastavljaj brez ustrezne konfiguracije piškotkov in CORS.

Deploy runtime secrets prenese na Render prek API; vrednosti se ne izpisujejo.
`GITHUB_TOKEN` se za objavo Docker slike zagotovi samodejno z dovoljenjem
`packages: write`; dodatnega GitHub gesla ni treba shranjevati.

### Prva objava in povezava storitve

1. Prvi uspešni push na `main` ustvari sliko
   `ghcr.io/freak4e/rirs-projekt:<commit-sha>`. Dokler Render secrets niso
   nastavljeni, se `deploy` po objavi slike ustavi z jasno napako; to še ni
   uspešna javna namestitev.
2. V GitHub profilu → Packages → `rirs-projekt` → Package settings nastavi
   paket na **Public**, da ga Render lahko prebere brez dodatnega žetona.
   Slika vsebuje aplikacijo in odvisnosti, ne `.env` ali gesel.
3. Render → New → Web Service → **Existing Image**. Uporabi objavljeni tag
   iz koraka 1. Health Check Path nastavi na `/api/health`; ne prepiši ukaza
   Docker CMD. Za prvo inicializacijo nastavi enake runtime vrednosti kot v
   okolju production. Samodejne namestitve iz Gita naj bodo izklopljene.
4. Dopolni `RENDER_SERVICE_ID`, `RENDER_API_KEY`, `APP_URL` in ostale secrets
   v GitHub okolju production; ponovno zaženi neuspešni job `deploy` iste izvedbe.
5. Preveri uspešen deploy, javno prijavo in shranjevanje projekta. Dejanski javni
   URL zapiši v README ter `09-preverjanje.md` prek novega PR.

Sledeče spremembe v `main` se namestijo samodejno. Ob migracijski ali zagonski
napaki deploy ne sme biti označen uspešno. Obstoječemu administratorju seed ne
spreminja gesla, zato sprememba `ADMIN_PASSWORD` sama ne ponastavi že ustvarjenega
računa.

Viri: [Render prebuilt images](https://render.com/docs/deploying-an-image),
[Render deploy API](https://api-docs.render.com/reference/create-deploy),
[GitHub branch protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).
