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

## GitHub

- Fork: https://github.com/Freak4e/RIRS-projekt
- Actions so omogočene.
- Okolje `production` obstaja in dovoljuje namestitve iz zaščitenih vej.
- `main` zahteva pull request ter uspešne `lint`, `build`, `test`.
- Zaščita velja tudi za administratorja.

Povezavi do namerno padajoče in popravljene izvedbe bosta dodani po preverjanju
na GitHubu. Dokler nista zabeleženi, ta del še ni potrjen.

## Javna namestitev

Workflow za Render je pripravljen. Javna namestitev še ni potrjena: manjkajo
dostop do uporabnikove storitve, produkcijske skrivnosti in dejanski javni URL.
Točki 2.5 in povezava v 2.7 sta dokončani šele, ko uspe job `deploy` in je
preverjena prijava na javnem HTTPS naslovu. Lokalni naslov ni dokaz javne objave.
