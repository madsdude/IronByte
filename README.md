# Setup Guide (Dansk)

Dette projekt er en ticket-system applikation bestående af en React frontend og en Node.js/Express backend med PostgreSQL database.

## Forudsætninger

Før du går i gang, skal du have følgende installeret på din maskine:

1.  **Docker** og **Docker Compose**: Bruges til at køre databasen og backenden.
2.  **Node.js** (version 18 eller nyere) og **npm**: Bruges til at køre frontenden.

## Installation og Opsætning

Følg disse trin for at få applikationen op at køre.

### 1. Start Backend og Database

Vi bruger Docker Compose til at starte PostgreSQL databasen, pgAdmin (database administrationsværktøj) og backend serveren.

Åbn en terminal i projektets rodmappe og kør:

```bash
docker-compose up -d
```

Dette vil:
*   Starte en PostgreSQL database på port `5432`.
*   Oprette de nødvendige tabeller og indsætte startdata (defineret i `docker/init.sql`).
*   Starte backend serveren på port `3000`.
*   Starte pgAdmin på port `5050` (Login: `admin@admin.com` / `admin`).

Du kan tjekke om alt kører korrekt ved at køre:

```bash
docker-compose ps
```

### 2. Start Frontend

Frontenden køres lokalt med Vite.

1.  Åbn en ny terminal (eller brug den samme).
2.  Installer afhængigheder:

    ```bash
    npm install
    ```

3.  Start udviklingsserveren:

    ```bash
    npm run dev
    ```

Frontenden vil nu være tilgængelig på `http://localhost:5173` (eller den port der vises i terminalen).

## Miljøvariabler

Projektet er konfigureret til at virke "ud af boksen" med standardindstillingerne.

### Backend (`backend/server.js` og `docker-compose.yml`)

Backenden bruger `DATABASE_URL` til at forbinde til databasen. Denne sættes automatisk i `docker-compose.yml`:
`postgresql://postgres:postgrespassword@postgres:5432/ticket_system`

Hvis du vil køre backenden uden Docker (f.eks. ved udvikling direkte i `backend` mappen), skal du oprette en `.env` fil i `backend/` mappen med indholdet:

```
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/ticket_system
```

(Bemærk: `localhost` i stedet for `postgres` hostnavnet, da du forbinder udefra containeren).

### Frontend

Frontenden kommunikerer med backenden på `http://localhost:3000`. Hvis du ændrer backend porten, skal du muligvis opdatere API kaldene i `src/lib/api.ts` (eller konfigurere `VITE_API_URL` hvis understøttet).

## Fejlfinding

*   **Database fejl:** Hvis backenden ikke kan forbinde til databasen, sørg for at `docker-compose up` er færdig med at starte, og at `init.sql` blev kørt succesfuldt. Du kan se logs med `docker-compose logs -f backend` eller `docker-compose logs -f postgres`.
*   **Port konflikter:** Hvis port 3000 eller 5432 allerede er i brug, skal du stoppe de processer der bruger dem, eller ændre port mappingen i `docker-compose.yml`.

## Projektstruktur

*   `/backend` - Node.js Express server.
*   `/src` - React frontend kildekode.
*   `/docker` - Docker konfiguration og initialiserings SQL script.
*   `/supabase` - (Legacy) Supabase migrationer (reference).
