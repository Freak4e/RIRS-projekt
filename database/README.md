# Lokalna PostgreSQL baza

Iz korena projekta zaženi `docker compose up -d --wait`.
Docker Desktop mora biti vključen. Baza uporablja vrata `127.0.0.1:7777`,
uporabnika `portal`, razvojno geslo `portal_local` in bazo `uredniski_portal`.
Podatki so v imenovanem volumnu `rirs-projekt_postgres_data`.

Primer povezave in migracije so v [README](../README.md).
`Dockerfile` v tej mapi je prvotna slika baze; aplikacijska produkcijska slika
je definirana v `../Dockerfile.runtime`.
