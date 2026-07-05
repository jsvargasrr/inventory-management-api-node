# Inventory Management API — MercadoExpress

API REST para gestión de inventario, alertas de stock bajo y órdenes de compra.

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Runtime | Node.js 20+ |
| Lenguaje | TypeScript (strict) |
| HTTP | Fastify 5 |
| ORM | Prisma |
| Base de datos | SQLite (local) / PostgreSQL (producción) |
| Validación | Zod |
| Tests | Vitest + supertest (via `app.inject`) |

## Arquitectura

Se implementó **Clean Architecture (Hexagonal)** con separación en capas:

```
src/
├── domain/           # Entidades, reglas de negocio, interfaces (ports)
├── application/      # Casos de uso (orquestación)
├── infrastructure/   # Adaptadores: Prisma, HTTP (Fastify)
└── shared/           # Errores de dominio compartidos
```

### Justificación

- **Domain**: Las reglas de negocio (stock no negativo, cantidad mínima de orden, máquina de estados) viven aisladas del framework y la base de datos. Son testeables sin infraestructura.
- **Application**: Cada caso de uso representa una acción del sistema (ajustar stock, recibir orden). Un caso de uso = una responsabilidad.
- **Infrastructure**: Prisma y Fastify son detalles de implementación intercambiables. Los repositorios implementan interfaces definidas en domain.
- **Composition Root**: `composition-root.ts` conecta dependencias sin acoplar capas internas.

### Flujo de datos

```
HTTP Request → Zod validation → Use Case → Domain Rules → Repository → DB
                                    ↓
                              Domain Errors → HTTP Error Handler
```

## Requisitos previos

- Node.js >= 20
- npm >= 10

## Instalación y ejecución

```bash
# 1. Clonar e instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Generar cliente Prisma, aplicar migraciones y seed
npm run db:generate
npm run db:deploy
npm run db:seed

# 4. Iniciar servidor en modo desarrollo
npm run dev
```

La API estará disponible en `http://localhost:3000`.

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor con hot-reload |
| `npm run build` | Compilar TypeScript |
| `npm start` | Ejecutar build de producción |
| `npm test` | Ejecutar todos los tests |
| `npm run test:coverage` | Tests con reporte de cobertura |
| `npm run db:deploy` | Aplicar migraciones (producción/CI) |
| `npm run db:migrate` | Crear/aplicar migraciones en desarrollo |
| `npm run db:seed` | Cargar datos de referencia |
| `npm run db:reset` | Resetear DB y re-seed |
| `npm run lint` | Verificar código con ESLint |
| `npm run format` | Formatear con Prettier |

## Endpoints

### Productos

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/products` | Registrar producto |
| `GET` | `/products` | Listar con filtros |
| `GET` | `/products/:id` | Obtener producto |
| `POST` | `/products/:id/adjustments` | Ajustar stock (entrada/salida) |
| `GET` | `/products/:id/movements` | Historial de movimientos |

**Filtros de listado:** `category`, `supplier`, `hasActiveAlert`, `minStock`, `maxStock`

### Alertas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/alerts` | Listar alertas (`status`, `productId`) |

### Órdenes de compra

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/purchase-orders` | Crear orden (manual o desde alerta) |
| `GET` | `/purchase-orders` | Listar órdenes |
| `GET` | `/purchase-orders/:id` | Obtener orden |
| `PATCH` | `/purchase-orders/:id/approve` | Aprobar (PENDIENTE → APROBADA) |
| `PATCH` | `/purchase-orders/:id/reject` | Rechazar con motivo |
| `PATCH` | `/purchase-orders/:id/receive` | Recibir (incrementa stock) |

### Health

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Estado del servicio |

## Reglas de negocio implementadas

1. **Stock no negativo** — Las salidas que excedan el stock disponible se rechazan indicando cuántas unidades faltan.
2. **Cantidad mínima de orden** — Debe ser al menos 2× el stock mínimo del producto.
3. **Cierre automático de alertas** — Al recibir una orden o ajustar stock por encima del mínimo.
4. **Una alerta activa por producto** — No se crea duplicada si ya existe una ACTIVA.
5. **Transiciones de estado** — Solo PENDIENTE puede aprobarse/rechazarse; solo APROBADA puede recibirse.
6. **Historial inmutable** — Los movimientos de inventario solo se crean, nunca se modifican ni eliminan.

## Seguridad

- **@fastify/helmet** — Headers HTTP de seguridad
- **@fastify/rate-limit** — Límite de 100 req/min en producción
- **bodyLimit** — Tamaño máximo de body: 1 MB
- **Errores 500** — Sin stack trace en producción

## Tests

```bash
npm test                  # 52 tests
npm run test:coverage     # Reporte de cobertura
npm run verify:enunciado  # Checklist RF + reglas de negocio (27 checks)
```

**Cobertura actual:** ~86% statements · ~92% functions · ~70% branches

Estructura de tests:

- `tests/unit/domain/` — Reglas de negocio puras
- `tests/unit/application/` — Casos de uso con repositorios mockeados
- `tests/integration/api/` — Flujos completos contra SQLite de prueba

## Documentación API (Swagger)

Con el servidor en marcha, abre:

```
http://localhost:3000/docs
```

OpenAPI JSON en `/docs/json`.

## Docker (PostgreSQL)

```bash
# Levantar API + PostgreSQL
docker compose up --build

# API: http://localhost:3000
# Docs: http://localhost:3000/docs
# Health: http://localhost:3000/health
```

El contenedor usa `prisma/schema.postgresql.prisma` automáticamente.

## CI (GitHub Actions)

Pipeline en `.github/workflows/ci.yml`:

- `npm ci` → lint → build → test → verify:enunciado

## Deploy en la nube

### Render (recomendado)

1. Conectar repo en [Render](https://render.com)
2. Usar `render.yaml` (Blueprint) — crea Web Service + PostgreSQL
3. La variable `DATABASE_URL` se inyecta automáticamente
4. Start command: `./scripts/start-production.sh`

### Railway

1. Conectar repo en [Railway](https://railway.app)
2. Añadir servicio PostgreSQL
3. Configurar `DATABASE_URL` en variables de entorno
4. Railway detecta `railway.toml` + `Dockerfile`

### Manual (PostgreSQL)

```bash
# Con DATABASE_URL apuntando a PostgreSQL
npm run build
npm run start:prod
```

El script `start-production.sh` detecta PostgreSQL y usa el schema correcto.

## Datos de referencia (seed)

El seed carga 6 productos del enunciado. Productos con stock ≤ mínimo generan alerta activa automáticamente (ej: Yogur LAC-002, Jugo BEB-002).
