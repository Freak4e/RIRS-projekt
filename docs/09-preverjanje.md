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

- Javni URL: https://rirs-projekt-freak4e.onrender.com.
- Render storitev `rirs-projekt-freak4e` uporablja že zgrajeno sliko iz GHCR,
  PostgreSQL 18 `rirs-projekt-db` pa teče v isti regiji Frankfurt.
- Začetna objava `dep-dbvl0mafngtc73ck90g0` je dosegla stanje `live`.
- Na javnem HTTPS naslovu so preverjeni frontend in direktna pot `/projekti`,
  povezava z bazo, prijava in odjava, varen piškotek, zavrnitev javne registracije,
  ustvarjanje avtorja/urednika/projekta, urednikov dostop samo do dodeljenih
  projektov, zavrnitev nedovoljene dodelitve in shranjevanje sprememb. Testni
  zapisi so po preverjanju odstranjeni.
- GitHub environment `production` vsebuje `RENDER_API_KEY`, `RENDER_SERVICE_ID`,
  `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`; variable
  `APP_URL` vsebuje javni naslov. Repository variable `VITE_API_URL` je `/api`.
- Pri prvem deployu je bila potrebna dopolnitev produkcijske konfiguracije.
  Nato je preizkus pokazal, da `docker load` v `RepoDigests` lahko ohrani lokalno
  ime slike `rirs-app`. Popravek sestavi referenco iz javnega GHCR repozitorija
  in nespremenjenega SHA256 digesta. Dokončni uspeh samodejnega deploya se
  preveri v [Actions](https://github.com/Freak4e/RIRS-projekt/actions/workflows/ci-cd.yml).
- Oba Render vira uporabljata paket Free. Baza poteče **19. 12. 2026**;
  za poznejšo oddajo je treba zagotoviti veljavno gostovanje baze. Spletna
  storitev lahko ob prvem obisku po neaktivnosti potrebuje čas za prebujanje.
