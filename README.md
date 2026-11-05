# Math Sudoku

Juego web estilo sudoku con operaciones matemáticas básicas. Cada casilla muestra una suma, resta,
multiplicación o división; el jugador **no escribe números**: arrastra (o toca) las opciones que el
propio juego entrega hasta colocarlas en la casilla correcta.

El juego pide **registro/inicio de sesión**, guarda el progreso en **PostgreSQL**, tiene
**temporizador por nivel**, **niveles infinitos generados al azar** y un botón para **ordenar las
opciones de menor a mayor**.

> **Estado: fase de prueba.** El proyecto todavía **no está finalizado**. Esta versión se publica
> para pruebas y contiene errores ya identificados que se corregirán en próximas iteraciones.

## Características

- Registro e inicio de sesión con usuario y contraseña (JWT + BCrypt).
- Progreso persistente: nivel actual, niveles completados, tiempo total y récord por nivel.
- Tableros 3×3 y 4×4 tipo sudoku: cada fila y columna tiene resultados distintos.
- Operaciones de suma, resta, multiplicación y división (sin decimales).
- Niveles generados aleatoriamente y **sin final**; la dificultad aumenta con el nivel.
- Números arrastrables (drag & drop) con alternativa táctil para móvil: tocar número → tocar casilla.
- Botón **Ordenar de menor a mayor** y botón **Mezclar** en el panel de opciones.
- Temporizador por nivel, barra de progreso y validación contra el servidor.
- Al completar: **“Felicitaciones, has finalizado el nivel”** y **“Deseas continuar? o Salir”**.
- Diseño responsive con tema oscuro.

## Stack

| Capa | Tecnología |
| --- | --- |
| Backend | Java 21 · Spring Boot 3.4 · Spring Security · Spring Data JPA · Flyway |
| Base de datos | PostgreSQL 16+ |
| Frontend | React 19 · React Router · Vite |
| Autenticación | JWT (HS256) · BCrypt |

## Estructura

```
math-sudoku/
├── backend/
│   ├── Dockerfile             # build multi-etapa (Maven + JRE 21)
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/mathsudoku/
│       │   ├── auth/          # registro, login, /me
│       │   ├── common/        # manejo de errores y health
│       │   ├── game/          # generador de niveles, evaluador y endpoints
│       │   ├── progress/      # progreso y récords por nivel
│       │   ├── security/      # configuración JWT / CORS
│       │   └── user/          # entidad y repositorio de usuarios
│       ├── main/resources/
│       │   ├── application.yml
│       │   └── db/migration/  # esquema Flyway
│       └── test/              # tests del generador y del evaluador
├── frontend/
│   ├── Dockerfile             # build multi-etapa (Node + Nginx)
│   ├── default.conf.template  # Nginx: SPA + proxy /api
│   ├── src/
│   │   ├── pages/             # login, registro, dashboard y juego
│   │   ├── components/        # tablero, opciones, modal, iconos
│   │   ├── context/           # sesión
│   │   ├── utils/             # formato de tiempo
│   │   ├── api.js
│   │   └── styles.css
│   └── vite.config.js         # proxy /api → localhost:8080
├── docker-compose.yml         # db + backend + frontend (red bridge)
├── docker-compose.host.yml    # override para equipos sin red bridge
├── scripts/
│   ├── up-host.sh             # levanta todo usando la red del host
│   ├── math-sudoku-launch.sh  # lanzador: Compose + navegador
│   ├── math-sudoku-stop.sh    # detiene el stack
│   └── math-sudoku.desktop    # entrada para wofi
└── README.md
```

## Requisitos

- JDK 21
- Maven 3.9+
- Node.js 20+
- PostgreSQL 16+ (o Docker)

## Puesta en marcha

### 1. Base de datos

Con Docker (recomendado, usa el puerto **5433** para no chocar con un PostgreSQL local):

```bash
docker compose up -d db
```

La base queda con:

- Base de datos: `mathsudoku`
- Usuario: `mathsudoku`
- Contraseña: `mathsudoku`
- Puerto host: `5433`

> Si tu equipo no puede crear redes bridge, usa el override de red host: la base queda entonces en
> `localhost:5434` (ver [Equipos sin red bridge](#equipos-sin-red-bridge)).

Si ya tienes PostgreSQL local en el puerto 5432:

```bash
psql -U postgres -c "CREATE ROLE mathsudoku LOGIN PASSWORD 'mathsudoku';"
psql -U postgres -c "CREATE DATABASE mathsudoku OWNER mathsudoku;"
```

y exporta `DB_URL=jdbc:postgresql://localhost:5432/mathsudoku` antes de arrancar el backend.

### 2. Backend

```bash
cd backend
mvn spring-boot:run
```

- API: <http://localhost:8080>
- Health check: <http://localhost:8080/api/health>
- Flyway crea las tablas automáticamente al iniciar.

### 3. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Abre <http://localhost:5173>, crea una cuenta y juega. Vite redirige `/api` al backend.

### Build de producción

```bash
cd frontend
npm run build
npm run preview   # sirve el build en http://localhost:4173 con proxy /api
```

Para desplegar, sirve `frontend/dist` con tu servidor estático y publica `/api` hacia el backend
(Nginx, Caddy, etc.). El frontend usa siempre la ruta relativa `/api`, así que ambos deben estar bajo
el mismo origen.

### Todo con Docker Compose

El repositorio incluye imágenes multi-etapa para el backend (Maven → JRE 21) y el frontend
(Node → Nginx), además de un `docker-compose.yml` que levanta PostgreSQL, backend y frontend:

```bash
docker compose up -d --build
```

| Servicio | URL / puerto por defecto | Variable |
| --- | --- | --- |
| Juego (Nginx) | <http://localhost:8080> | `FRONTEND_PORT` |
| API | <http://localhost:8081> | `BACKEND_PORT` |
| PostgreSQL | `localhost:5433` | `DB_HOST_PORT` |

Nginx sirve la SPA y hace proxy de `/api` hacia el backend (`BACKEND_UPSTREAM`), así que frontend y
API comparten origen y no hay CORS entre ellos. Los datos persisten en el volumen
`mathsudoku_pgdata` (nombre real `math-sudoku_mathsudoku_pgdata`, con el prefijo del proyecto
Compose). La primera build descarga dependencias de Maven y npm, así que necesita conexión a
internet. Antes de exponerlo, define un secreto propio:

```bash
JWT_SECRET="una-clave-larga-y-secreta-de-al-menos-32-bytes" docker compose up -d --build
```

Para revisar el estado y detener el stack:

```bash
docker compose ps            # estado y salud de los contenedores
docker compose logs -f       # logs en vivo (Ctrl+C para salir)
docker compose down          # detiene todo y conserva la base
docker compose down -v       # detiene todo y borra también los datos
```

Si usas el override de red host, añade los mismos `-f docker-compose.yml -f docker-compose.host.yml`
a esos comandos.

#### Equipos sin red bridge

Si Docker no puede crear la red bridge (`failed to create endpoint ... operation not supported`),
usa el override de red host incluido:

```bash
./scripts/up-host.sh
```

o, manualmente:

```bash
docker compose -f docker-compose.yml -f docker-compose.host.yml up -d --build
```

En ese modo todo comparte la red del host y se usan puertos que no chocan con PostgreSQL o Java ya
instalados:

| Servicio | URL / puerto |
| --- | --- |
| Juego (Nginx) | <http://localhost> |
| API | <http://localhost:8090/api/health> |
| PostgreSQL | `localhost:5434` |

En este modo, si arrancas el backend a mano contra esa base, apunta al puerto 5434:

```bash
DB_URL=jdbc:postgresql://localhost:5434/mathsudoku mvn spring-boot:run
```

#### Acceso directo desde wofi

`scripts/math-sudoku-launch.sh` levanta el stack (red host) y abre el juego en el navegador;
`scripts/math-sudoku-stop.sh` lo detiene conservando los datos. Para que aparezca en wofi:

```bash
mkdir -p ~/.local/share/applications
cp scripts/math-sudoku.desktop ~/.local/share/applications/
update-desktop-database ~/.local/share/applications 2>/dev/null || true
```

Después busca **Math Sudoku** en wofi. La entrada `.desktop` usa la ruta absoluta del proyecto: si
mueves la carpeta, vuelve a copiarla.

## Configuración

Variables de entorno del backend (todas opcionales en desarrollo):

| Variable | Valor por defecto | Descripción |
| --- | --- | --- |
| `SERVER_PORT` | `8080` | Puerto del backend |
| `DB_URL` | `jdbc:postgresql://localhost:5433/mathsudoku` | Conexión JDBC |
| `DB_USER` | `mathsudoku` | Usuario de PostgreSQL |
| `DB_PASSWORD` | `mathsudoku` | Contraseña de PostgreSQL |
| `JWT_SECRET` | secreto de desarrollo | Clave HS256 (mínimo 32 bytes). **Cámbiala en producción** |
| `JWT_EXPIRATION_MINUTES` | `1440` | Duración del token (24 h) |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Orígenes permitidos, separados por coma |

Ejemplo:

```bash
JWT_SECRET="una-clave-larga-y-secreta-de-al-menos-32-bytes" mvn spring-boot:run
```

Variables de Docker Compose (opcionales):

| Variable | Valor por defecto | Descripción |
| --- | --- | --- |
| `FRONTEND_PORT` | `8080` | Puerto público del frontend (Nginx) |
| `BACKEND_PORT` | `8081` | Puerto público del backend en la red bridge |
| `DB_HOST_PORT` | `5433` | Puerto de PostgreSQL en el host |
| `JWT_SECRET` | secreto de desarrollo | Se pasa al backend |
| `JWT_EXPIRATION_MINUTES` | `1440` | Duración del token (24 h) |
| `CORS_ORIGINS` | orígenes locales | Se pasa al backend |

## Cómo se juega

1. Inicia sesión; el dashboard muestra tu nivel actual y tus récords.
2. Pulsa **Jugar nivel N**. El temporizador empieza al cargar el tablero.
3. Cada casilla muestra una operación. Las casillas doradas son pistas ya resueltas.
4. Arrastra el número correcto desde **Opciones** hasta la casilla, o toca el número y luego la casilla.
5. Puedes usar **Ordenar de menor a mayor** para agrupar los números y **Mezclar** para desordenarlos.
6. Cuando todas las casillas estén llenas, el servidor comprueba la solución:
   - Si hay errores, las casillas se marcan en rojo y el tiempo sigue corriendo.
   - Si todo está correcto, aparece el modal de nivel completado.
7. En el modal puedes **Continuar** al siguiente nivel o **Salir** al dashboard. Los niveles no tienen
   final; cada uno se genera de nuevo al azar.

Las casillas se pueden corregir: toca una casilla llena para vaciarla o arrastra otro número encima.

## Generación de niveles

- **Tamaño**: 3×3 para los niveles 1–2 y 4×4 desde el nivel 3.
- **Cuadrado latino**: cada fila y cada columna contiene exactamente el mismo conjunto de resultados,
  sin repetirse, igual que en un sudoku.
- **Operaciones**:
  - Niveles 1–2: sumas y restas.
  - Nivel 3+: también multiplicaciones y divisiones exactas.
  - Nivel 7+: pueden aparecer expresiones de tres términos con precedencia (por ejemplo `3 + 4 × 5`).
- **Dificultad**: los operandos crecen con el nivel, las pistas disminuyen y aparecen más distractores.
- **Opciones**: los valores correctos más distractores cercanos. Las fichas son reutilizables.
- **Límite técnico**: el generador acepta hasta el nivel 100.000; en la práctica, el juego no tiene final.
- **Aleatoriedad verificable**: cada nivel viaja con una semilla. El servidor regenera el nivel con esa
  semilla al recibir la solución y valida las respuestas, de modo que el progreso no se puede guardar
  con una solución inventada.

## API

Todas las rutas salvo registro/login requieren `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Crea usuario y devuelve token |
| `POST` | `/api/auth/login` | Inicia sesión y devuelve token |
| `GET` | `/api/auth/me` | Datos del usuario autenticado |
| `GET` | `/api/progress` | Progreso, récords y mejor tiempo por nivel |
| `GET` | `/api/game/levels/{level}` | Genera el nivel (solo si está desbloqueado) |
| `POST` | `/api/game/levels/{level}/complete` | Valida la solución y guarda el progreso |
| `GET` | `/api/health` | Estado del servicio |

Ejemplo de registro:

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"jugador1","password":"secreto123"}'
```

Respuesta:

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": { "id": 1, "username": "jugador1" }
}
```

Ejemplo de nivel:

```json
{
  "level": 3,
  "size": 4,
  "seed": 1972345678901,
  "givenCount": 5,
  "emptyCount": 11,
  "cells": [
    { "id": "r0c0", "row": 0, "col": 0, "expression": "7 + 5", "value": 12, "given": true },
    { "id": "r0c1", "row": 0, "col": 1, "expression": "3 × 4", "given": false }
  ],
  "options": [
    { "id": "o1", "value": 9 },
    { "id": "o2", "value": 12 }
  ]
}
```

Las respuestas de las casillas vacías **no** se envían al cliente. Al completar se envía:

```json
{
  "seed": 1972345678901,
  "elapsedSeconds": 83,
  "solution": { "r0c1": 12, "r0c2": 5 }
}
```

## Modelo de datos

Creado por Flyway en `backend/src/main/resources/db/migration/V1__init.sql`:

- `users`: usuario único (sin distinguir mayúsculas) y hash BCrypt.
- `progress`: nivel actual (siguiente a jugar), nivel máximo, totales y tiempo acumulado.
- `level_results`: mejor tiempo e intentos por usuario y nivel.

## Pruebas

Backend:

```bash
cd backend
mvn test
```

Incluye 7 pruebas unitarias: determinismo del generador, cuadrados latinos, expresiones y precedencia,
división exacta y presencia de las respuestas correctas entre las opciones.

Flujo probado manualmente/automatizado durante el desarrollo: registro, login, generación de niveles
3×3 y 4×4, drag & drop, orden ascendente, temporizador, validación de errores, modal de fin de nivel,
continuar, salir, recarga con sesión persistente y progreso guardado.

## Seguridad

- Contraseñas con BCrypt, nunca en texto plano.
- Sesión sin estado con JWT firmado (HS256).
- Validación de entradas con Bean Validation.
- Validación de la solución en el servidor (no se confía en el cliente para guardar progreso).
- CORS restringido por configuración.
- Para producción: define un `JWT_SECRET` propio, usa HTTPS y añade límite de intentos de login.

## Ideas para ampliar

- Ranking global y comparación de tiempos entre jugadores.
- Niveles diarios con la misma semilla para todos.
- Modo contrarreloj o vidas.
- Sonidos y animaciones de acierto.
- Panel de administración para moderar usuarios.
