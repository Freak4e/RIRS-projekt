# Dokazila preverjanja

Datum: 19. 11. 2026. Ta datoteka ločuje dejansko izvedene preizkuse od nastavitev,
ki še potrebujejo dostop do gostovanja.

## Lokalno

- PostgreSQL 18 v Docker Compose je zdrav; vseh pet migracij je uporabljenih.
- `npm run lint` uspe na frontendu in backendu.
- `npm run build` uspe na obeh delih; backend je pripravljen za Node ESM.
- Backend: 29 enotskih/API in 6 integracijskih testov je uspešnih.
- Frontend: 14 testov je uspešnih. Skupaj: **49 testov**.
- Pokritost vrstic ob preverjanju: backend 50,20 %, frontend 14,98 %.
  Poročili zajemata tudi nepreizkušene izvorne datoteke; odstotka nista cilj
  popolne pokritosti, temveč izmerjeno stanje osnovnega nabora testov.
- Produkcijska Docker slika se uspešno zgradi in zažene migracije ter seed.
- Preverjeni so HTTP 200 za `/api/health`, stran `/projekti`, prijavo in
  avtenticiran seznam projektov na lokalnem Node zagonu. V Docker sliki so
  dodatno preverjeni zdravstveni endpoint, stran in prijavni odgovor.

## GitHub

- Fork: https://github.com/Freak4e/RIRS-projekt
- Actions so omogočene.
- Okolje `production` obstaja in dovoljuje namestitve iz zaščitenih vej.
- `main` zahteva pull request ter uspešne `lint`, `build`, `test`.
- Zaščita velja tudi za administratorja.

- [PR #1](https://github.com/Freak4e/RIRS-projekt/pull/1) vsebuje razvojno vejo
  `feat/ci-cd`, namerno napako in popravek v isti zgodovini.
- [Namerno padajoča izvedba](https://github.com/Freak4e/RIRS-projekt/actions/runs/44598896752):
  commit `960a412` vsebuje `debugger` v `frontend/src/api.ts`. `lint` pade,
  `build` in `test` uspeta, `deploy` je pri PR izpuščen. GitHub poroča
  `mergeable_state: blocked`; PR ni bil združen.
- Popravek odstrani namerni `debugger`; [zadnje preverbe PR](https://github.com/Freak4e/RIRS-projekt/pull/1/checks)
  prikazujejo rezultat popravljenega commita. Točna uspešna izvedba se pred
  združitvijo preveri tudi na zavihku Actions.

## Javna namestitev

Workflow za Render je pripravljen. Javna namestitev še ni potrjena: manjkajo
dostop do uporabnikove storitve, produkcijske skrivnosti in dejanski javni URL.
Točki 2.5 in povezava v 2.7 sta dokončani šele, ko uspe job `deploy` in je
preverjena prijava na javnem HTTPS naslovu. Lokalni naslov ni dokaz javne objave.
