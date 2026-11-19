# Pregled prevzetega projekta

Pregled: 19. 11. 2026. Izvor: `ozzvaa/RIRS-projekt`, prevzeti commit
`979d1cf`. Fork: `Freak4e/RIRS-projekt`. Spodnje ocene opisujejo stanje ob
prevzemu; popravki drugega dela naloge so navedeni ločeno.

## Implementirani MVP

MohorjevaManager je uredniški portal za knjižne projekte. React/TypeScript
vmesnik vsebuje prijavo, sezname in podrobnosti avtorjev, urednikov in projektov.
Express uporablja Prisma ORM in PostgreSQL; gesla so zgoščena z bcrypt,
prijava uporablja podpisan JWT v piškotku HttpOnly. Pregledani so dokumenti
01–06, vseh sedem ADR, Prisma shema in migracije, poti API, storitve in strani
vmesnika. Dokumentirani Docker Compose ob prevzemu ni obstajal; obstoječi
Dockerfile v `database/` je vseboval samo PostgreSQL.

Delujejo ustvarjanje, prikaz, urejanje in brisanje knjižnih projektov ter
avtorjev, ustvarjanje in urejanje urednikov, povezovanje avtorjev in urednikov
s projekti, razvrščanje projektov po naslovu, letu in izpolnjenosti ter izračun
odstotka izpolnjenih polj. Administrator in glavni urednik vidita vse projekte,
urednik samo dodeljene. Polja tehničnih in uredniških podatkov so v skupnem obrazcu.

## Presoja petih uporabniških zgodb

| Zgodba | Ocena ob prevzemu | Ugotovitve in povezava s kodo |
| --- | --- | --- |
| **US-02 – CRUD** | Delno | `routes/author.ts` in `routes/project.ts` podpirata CRUD, strani `Avtorji` in `Projekti` omogočajo urejanje. Seznami so kartice, zato kriterij tabelaričnega prikaza ni dobesedno izpolnjen. Uredniki nimajo svoje DELETE poti; vsi modeli iz sheme nimajo uporabniškega vmesnika. |
| **US-03 – avtentikacija** | Delno | `authController.ts`, `auth/jwt.ts` in `RequireAuth.tsx` omogočajo prijavo, odjavo in zaščito strani. Vendar sta bila `POST /api/auth/register` in `POST /api/users` javna, kar nasprotuje zahtevi, da uporabnike ustvarja samo administrator. Tudi nekatere druge API poti niso zahtevale prijave. |
| **US-04 – avtorizacija** | Delno | `requireRoles.ts` omejuje privilegirana dejanja; `projectService.ts` pri seznamu in podrobnostih filtrira projekte po dodeljenem uporabniku. Branje uporabnikov ter branje/urejanje/brisanje avtorjev pa ob prevzemu niso bili zaščiteni z avtentikacijo. Zaščita strani v Reactu sama ne zaščiti API-ja. |
| **US-06 – pregled vseh knjižnih projektov** | Pretežno | `getProjects` omogoča administratorju in glavnemu uredniku pregled vseh projektov. `Projekti.tsx` omogoča razvrščanje po naslovu, letu izdaje in odstotku izpolnjenosti. Odstotek ni ločeno poslovno stanje »zaključen«; ročne potrditve zaključka ni. |
| **US-07 – dodeljevanje dostopov** | Da, za predvideni MVP | Obrazec `ProjektPodrobnosti.tsx` omogoča izbiro več urednikov. Relacija `UrednikiNaProjektu` podpira več uporabnikov na projektu. API preverja vlogo izbranih urednikov in pravico za spremembo dodelitev. Urednik lahko bere in ureja samo dodeljene projekte. |

Dinamično ustvarjanje vlog (US-05), dovoljenja po stolpcih, izvozne maske,
statistične analize in ročno potrjevanje zaključka niso implementirani.
Vloge so vnaprej določen Prisma enum. Ti deli se ne štejejo kot opravljen MVP.

## Lokalni zagon in popravki pri prevzemu

Dodani so `compose.yaml`, pravilni primeri okolja, ukazi za generiranje Prisma
odjemalca, migracije in začetnega administratorja. PostgreSQL 18 je bil lokalno
zagnan v Dockerju; vseh pet migracij se uspešno uporabi na prazni bazi.
Frontend in backend se uspešno zgradita. Backend se za produkcijo pripravi z
esbuild, saj prvotni `tsc` izhod z uvozi brez končnic ni bil primeren za običajni
`node dist/index.js` v ESM načinu.

Javna registracija je omejena na administratorja; poti uporabnikov so omejene
na administratorja, poti avtorjev pa zahtevajo prijavo. Ustvarjanje uporabnika
ne prepiše več administratorjevega prijavnega piškotka. Dodani so nastavljiv
`VITE_API_URL`, skupni izvor za frontend in API ter preverjanje baze na
`/api/health`. S tem so odpravljene navedene vrzeli v prijavi ob prevzemu;
manjkajoče poslovne funkcionalnosti iz zgornje tabele ostajajo izven te naloge.

Preverjanje zajema 29 backend enotskih/API testov z nadomeščeno bazo,
6 integracijskih testov s pravo ločeno PostgreSQL bazo in 14 frontend testov.
Integracija preveri pravo prijavo, piškotek, filtriranje dodelitev, zavrnitev
nepooblaščenega dostopa, shranjevanje sprememb ter ustvarjanje/brisanje projekta.
Poročili pokritosti vključujeta tudi nepokrite izvorne datoteke; uspešni testi
ne pomenijo popolne pokritosti aplikacije.
