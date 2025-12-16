# CSM ITIL Ticketing System

Dette projekt er en CSM (Customer Service Management) applikation migreret fra Supabase til en selv-hostet Docker-løsning.

## Forudsætninger

*   [Docker](https://www.docker.com/) og Docker Compose
*   [Node.js](https://nodejs.org/) version 18 eller nyere (til at køre frontend lokalt)

## Installation og Start

### 1. Start Backend og Database

Kør følgende kommando for at starte PostgreSQL, PgAdmin og Backend API'en:

```bash
docker-compose up -d
```

Dette vil starte:
*   **Postgres Database** på port `5432`
*   **Backend API** på port `3000`
*   **PgAdmin** på port `8080`

**Login til PgAdmin:**
*   URL: http://localhost:8080
*   Email: `admin@admin.com`
*   Password: `admin`

### 2. Start Frontend

Frontend kører separat via Vite.

1.  Installer afhængigheder:
    ```bash
    npm install
    ```

2.  (Valgfrit) Konfigurer miljøvariabler:
    Kopier `.env.example` til `.env` hvis du vil ændre API URL'en. Standard er `http://localhost:3000/api`.

3.  Start udviklingsserveren:
    ```bash
    npm run dev
    ```

Applikationen vil være tilgængelig på `http://localhost:5173`.

## Standard Login

Backend-serveren er konfigureret med en "mock" auth for demonstration. Du kan logge ind med enhver email.
Hvis du bruger **admin@example.com**, vil du få admin-rettigheder.

## Projektstruktur

*   `src/`: Frontend React kildekode.
*   `backend/`: Node.js Express API server.
*   `docker/`: Database init scripts.
*   `docker-compose.yml`: Docker services definition.
