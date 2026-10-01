<p align="center">
  <a href="https://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="NestJS Logo" />
  </a>
</p>

# Elite Academy - LMS Backend

API REST para la plataforma LMS de Elite Academy, desarrollada con NestJS, Prisma ORM y PostgreSQL.

El backend gestiona autenticación, usuarios, roles, permisos, cursos, módulos, lecciones, inscripciones, progreso, ventas, descuentos, certificados y recursos académicos. También expone endpoints públicos utilizados por el sitio web y endpoints protegidos para administración y estudiantes.

---

## Tabla de contenidos

- [Características](#características)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Módulos principales](#módulos-principales)
- [Autenticación y autorización](#autenticación-y-autorización)
- [Cursos, módulos y lecciones](#cursos-módulos-y-lecciones)
- [Ventas, precios y descuentos](#ventas-precios-y-descuentos)
- [Inscripciones y progreso](#inscripciones-y-progreso)
- [Certificados](#certificados)
- [Prisma y PostgreSQL](#prisma-y-postgresql)
- [Variables de entorno](#variables-de-entorno)
- [Instalación local](#instalación-local)
- [Scripts y comandos](#scripts-y-comandos)
- [Seed de producción](#seed-de-producción)
- [Docker](#docker)
- [Despliegue en VPS](#despliegue-en-vps)
- [Migraciones en producción](#migraciones-en-producción)
- [Backups de PostgreSQL](#backups-de-postgresql)
- [Actualización del backend](#actualización-del-backend)
- [Buenas prácticas](#buenas-prácticas)

---

## Características

- API REST con prefijo global `/api`.
- Autenticación mediante JWT.
- Guards globales y por ruta.
- Sistema de roles y permisos.
- Roles base de producción:
  - `ADMIN`
  - `ESTUDIANTE`
- Sincronización automática de permisos y permisos por rol al iniciar la aplicación.
- CRUD de usuarios.
- Cambio y recuperación de contraseña.
- Gestión de perfiles.
- CRUD de cursos.
- Categorías de cursos.
- Gestión de módulos.
- Gestión de lecciones.
- Orden automático de lecciones.
- Lecciones con:
  - descripción,
  - contenido enriquecido,
  - video,
  - vista previa pública,
  - requisito de completar la lección anterior,
  - estado de publicación.
- Recursos descargables y enlaces por lección.
- Formularios, preguntas y respuestas asociados a lecciones.
- Inscripciones a cursos y módulos.
- Seguimiento de progreso por:
  - curso,
  - módulo,
  - lección.
- Gestión de precios.
- Historial de precios.
- Promociones y descuentos.
- Venta de cursos.
- Venta de módulos.
- Registro de leads.
- Gestión de comprobantes de pago.
- Snapshots históricos de información de compra.
- Estado de compra de cursos y módulos.
- Certificados por módulo.
- Certificados por curso.
- Verificación pública de certificados.
- Generación de PDF de certificados.
- Generación de QR para verificación.
- Integración con Cloudinary para recursos multimedia donde corresponde.
- CORS configurable mediante variables de entorno.
- Validación global de DTOs.
- Filtro global de excepciones.
- PostgreSQL como base de datos principal.
- Prisma ORM 7.

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | NestJS 11 |
| Lenguaje | TypeScript |
| ORM | Prisma ORM 7 |
| Base de datos | PostgreSQL |
| Driver PostgreSQL | `pg` |
| Adaptador Prisma | `@prisma/adapter-pg` |
| Autenticación | JWT |
| Validación | class-validator + class-transformer |
| Archivos | Multer / interceptores de NestJS |
| Media | Cloudinary |
| PDF | `@react-pdf/renderer` |
| QR | `qrcode` |
| Package manager | pnpm |
| Contenedores | Docker + Docker Compose |

---

## Arquitectura

La API sigue una arquitectura modular basada en NestJS:

```text
Controller
   ↓
Service
   ↓
Prisma Service
   ↓
PostgreSQL
```

Cada dominio mantiene sus propios:

- controllers,
- services,
- DTOs,
- tipos,
- guards o decoradores cuando corresponde.

La autorización se resuelve en el backend. El frontend puede ocultar acciones, pero nunca reemplaza las validaciones de permisos del servidor.

---

## Estructura del proyecto

La estructura puede evolucionar conforme se agregan módulos, pero conceptualmente se organiza así:

```text
src/
├── app.module.ts
├── main.ts
├── auth/
├── common/
│   ├── decorator/
│   ├── filters/
│   ├── guards/
│   └── types/
├── curso/
├── leccion/
├── menus/
├── modules/
│   ├── inscripcion/
│   ├── progreso-curso/
│   ├── progreso-modulo/
│   ├── progreso-leccion/
│   ├── certificados/
│   ├── descuentos/
│   └── ...
├── permissions/
├── prisma/
├── rols/
└── user/
```

Prisma utiliza:

```text
prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```

---

## Módulos principales

### Autenticación

Responsable de:

- login,
- emisión de JWT,
- validación de usuario,
- recuperación/cambio de contraseña,
- protección de rutas.

Las rutas autenticadas utilizan `JwtAuthGuard`.

---

### Usuarios

Gestiona:

- creación,
- edición,
- consulta,
- perfiles,
- estado de usuarios,
- asignación de roles.

---

### Roles y permisos

El sistema utiliza control de acceso basado en permisos.

Ejemplo conceptual:

```ts
@UseGuards(JwtAuthGuard, PermissionGuard)
@Permission('cursos.editar')
```

Los permisos administrativos no deben asignarse al rol `ESTUDIANTE`.

Los permisos básicos de estudiante actualmente se limitan al acceso académico necesario para consultar:

- cursos,
- módulos,
- lecciones,
- formularios,
- recursos de lección.

---

### Menús

Los menús pueden asociarse a roles y permisos para construir dinámicamente la navegación del frontend.

---

## Cursos, módulos y lecciones

### Cursos

Los cursos contienen:

- información académica,
- imagen,
- categoría,
- módulos,
- precio,
- promociones,
- configuración de venta,
- visibilidad,
- información histórica asociada a compras.

### Módulos

Los módulos pueden incluir:

- nombre,
- descripción,
- imagen,
- precio propio,
- promoción,
- QR de pago,
- certificado independiente,
- visibilidad para estudiantes.

### Lecciones

Las lecciones permiten:

- contenido enriquecido,
- video,
- descripción,
- orden,
- vista previa pública,
- requisito de completar lección anterior,
- publicación.

Cuando se cambia el orden de una lección, el servicio reorganiza automáticamente las posiciones del resto de lecciones del mismo módulo.

Las rutas que reciben `multipart/form-data` deben utilizar el interceptor correspondiente, por ejemplo:

```ts
@UseInterceptors(FileInterceptor('video'))
```

Esto permite que NestJS procese correctamente el body cuando se envían archivos o `FormData`.

---

## Ventas, precios y descuentos

El sistema contempla:

- precios de cursos,
- precios de módulos,
- historial de precios,
- descuentos,
- promociones,
- venta de curso completo,
- venta por módulo,
- comprobantes de pago,
- QR para pagos,
- estados de compra.

Las ventas conservan información histórica relevante para evitar que cambios futuros en un curso alteren el registro original de la compra.

---

## Inscripciones y progreso

Una compra o inscripción puede habilitar acceso al contenido académico.

El progreso se administra por niveles:

```text
Curso
└── Módulo
    └── Lección
```

Existen registros independientes para:

- progreso de curso,
- progreso de módulo,
- progreso de lección.

Las lecciones pueden requerir que la anterior esté completada antes de permitir continuar.

---

## Certificados

El sistema puede emitir certificados por:

- módulo,
- curso completo.

### Generación de PDF

Los certificados PDF se generan mediante:

```text
@react-pdf/renderer
```

El QR de verificación se genera con:

```text
qrcode
```

Flujo general:

```text
Datos del certificado
       ↓
URL pública de verificación
       ↓
QR Code
       ↓
Template React PDF
       ↓
Buffer PDF
```

Los certificados pueden incluir:

- nombre del estudiante,
- curso o módulo,
- datos de emisión,
- identificador,
- QR,
- URL pública de verificación.

### Seguridad

Las operaciones administrativas de certificados utilizan permisos específicos, por ejemplo:

```text
certificados.ver
certificados.editar
certificados.anular
```

La consulta pública de verificación permanece accesible sin autenticación.

---

## Prisma y PostgreSQL

### Prisma 7

El proyecto utiliza Prisma 7 con configuración separada:

```ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

En `schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}
```

### Generar Prisma Client

```bash
pnpm prisma generate
```

### Ver estado de migraciones

```bash
pnpm prisma migrate status
```

### Crear una migración en desarrollo

```bash
pnpm prisma migrate dev --name nombre_migracion
```

### Aplicar migraciones en producción

```bash
pnpm prisma migrate deploy
```

> En producción no se debe utilizar `prisma migrate dev`.

### Prisma Studio

Para visualizar gráficamente la base de datos en desarrollo:

```bash
pnpm prisma studio
```

### `db pull`

```bash
pnpm prisma db pull
```

Este comando introspecciona la base y puede sobrescribir partes de `schema.prisma`. Debe utilizarse con cuidado y revisar `git diff` antes de hacer commit.

---

## Variables de entorno

Ejemplo conceptual:

```env
DATABASE_URL=postgresql://usuario:password@host:5432/base?schema=public

JWT_SECRET=secreto_seguro

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

NODE_ENV=development
PORT=3000

FRONTEND_URL=http://localhost:5173
FRONTEND_URL_PAGE=http://localhost:5173

ADMIN_EMAIL=
ADMIN_USERNAME=
ADMIN_NAME=
ADMIN_PASSWORD=
```

### Producción con Docker

Dentro de Docker, PostgreSQL se resuelve por el nombre del servicio:

```env
DATABASE_URL=postgresql://usuario:password@postgres:5432/lms_elite?schema=public
```

No utilizar `localhost` para PostgreSQL desde el contenedor backend.

> El archivo `.env` no debe subirse al repositorio.

---

## Instalación local

### Requisitos

- Node.js 24 recomendado.
- pnpm 10.
- PostgreSQL local o una instancia remota.
- Variables de entorno configuradas.

### Instalación

```bash
git clone <url-del-repositorio-backend>
cd <carpeta-backend>

pnpm install
pnpm prisma generate
```

Configurar `.env` y después:

```bash
pnpm prisma migrate dev
pnpm start:dev
```

La API se inicia por defecto en:

```text
http://localhost:3000/api
```

---

## Scripts y comandos

Los scripts disponibles dependen de `package.json`. Los principales utilizados en el proyecto son:

| Comando | Descripción |
|---------|-------------|
| `pnpm start:dev` | Desarrollo con watch |
| `pnpm build` | Compila NestJS |
| `pnpm start:prod` | Ejecuta `node dist/src/main` |
| `pnpm prisma generate` | Genera Prisma Client |
| `pnpm prisma migrate dev` | Migraciones en desarrollo |
| `pnpm prisma migrate deploy` | Aplica migraciones existentes |
| `pnpm prisma migrate status` | Estado de migraciones |
| `pnpm prisma db seed` | Ejecuta el seed |
| `pnpm prisma studio` | UI visual de Prisma |

---

## Seed de producción

El seed crea o sincroniza datos básicos necesarios para producción.

Actualmente incluye:

- administrador inicial,
- roles del sistema,
- permisos,
- asociación entre roles y permisos.

Ejemplo:

```bash
pnpm prisma db seed
```

El seed está diseñado para poder ejecutarse de manera segura cuando sea necesario, pero no debe utilizarse como sustituto de las migraciones.

Los roles principales de producción son:

```text
ADMIN
ESTUDIANTE
```

El administrador recibe todos los permisos activos.

El estudiante recibe únicamente permisos académicos limitados.

---

## Docker

### Dockerfile

El backend utiliza Node 24 sobre Debian slim.

Ejemplo:

```dockerfile
FROM node:24-bookworm-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y openssl \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@10

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm prisma generate
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start:prod"]
```

OpenSSL se instala para garantizar compatibilidad con Prisma dentro de la imagen.

### `.dockerignore`

Ejemplo:

```text
node_modules
dist
coverage
.git
.gitignore
.env
.env.*
npm-debug.log
pnpm-debug.log
```

### Docker Compose

El backend depende de PostgreSQL:

```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile
  restart: unless-stopped
  env_file:
    - .env
  depends_on:
    postgres:
      condition: service_healthy
  ports:
    - "127.0.0.1:3000:3000"
```

El backend queda disponible únicamente en el host del VPS, no directamente en Internet.

---

## Despliegue en VPS

Arquitectura utilizada:

```text
Internet
   ↓
Nginx host
   ├── /       → Frontend
   └── /api/   → Backend 127.0.0.1:3000
                       ↓
                 PostgreSQL Docker
```

Infraestructura:

```text
VPS Ubuntu
├── Nginx
├── Docker
│   ├── PostgreSQL
│   ├── Backend NestJS
│   └── Frontend
├── UFW
├── Fail2Ban
├── Swap
└── Backups
```

PostgreSQL no se expone públicamente.

El backend se publica únicamente como:

```text
127.0.0.1:3000
```

Nginx recibe las peticiones públicas y las redirige a `/api`.

---

## Migraciones en producción

Cuando existen nuevas migraciones:

```bash
cd ~/lms-elite/backend
git pull

cd ~/lms-elite

sudo docker compose build backend

sudo docker compose run --rm backend \
  pnpm prisma migrate deploy

sudo docker compose up -d backend
```

Nunca usar:

```bash
prisma migrate dev
```

en producción.

Tampoco ejecutar:

```bash
docker compose down -v
```

porque eliminaría los volúmenes persistentes.

---

## Backups de PostgreSQL

Los backups se generan con `pg_dump` en formato custom:

```bash
sudo docker compose exec -T postgres sh -c \
'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
> backups/lms_elite_$(date +%F_%H-%M-%S).dump
```

### Verificar backups

```bash
ls -lh backups
```

También se puede listar su contenido con `pg_restore`.

### Restauración

La restauración debe hacerse con precaución:

1. Detener temporalmente el backend.
2. Generar un backup adicional del estado actual.
3. Restaurar el archivo `.dump`.
4. Levantar nuevamente el backend.
5. Verificar funcionamiento.

Ejemplo conceptual:

```bash
sudo docker compose stop backend

sudo docker compose exec -T postgres sh -c \
'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner' \
< backups/archivo.dump

sudo docker compose start backend
```

Antes de cualquier restauración real se recomienda generar un respaldo adicional.

---

## Actualización del backend

### Cambio normal de código

```bash
cd ~/lms-elite/backend
git pull

cd ~/lms-elite
sudo docker compose up -d --build backend
```

### Cambio que incluye migraciones

```bash
cd ~/lms-elite/backend
git pull

cd ~/lms-elite
sudo docker compose build backend
sudo docker compose run --rm backend pnpm prisma migrate deploy
sudo docker compose up -d backend
```

### Logs

```bash
sudo docker compose logs backend --tail=100
```

### Estado

```bash
sudo docker compose ps
```

---

## CORS

El backend acepta orígenes configurados mediante variables de entorno:

```ts
app.enableCors({
  origin: [
    process.env.FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:3001",
    process.env.FRONTEND_URL_PAGE,
  ].filter(Boolean),
});
```

Cuando se agregue un dominio de producción, actualizar las variables correspondientes.

---

## Validación y manejo de errores

La aplicación utiliza un `ValidationPipe` global:

```ts
app.useGlobalPipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
  }),
);
```

También utiliza un filtro global de excepciones:

```ts
app.useGlobalFilters(new AllExceptionsFilter());
```

Esto centraliza la salida de errores y evita respuestas inconsistentes entre módulos.

---

## Buenas prácticas

- No subir archivos `.env`.
- No almacenar secretos en Git.
- Utilizar permisos en backend para operaciones administrativas.
- No confiar únicamente en la visibilidad del frontend.
- Utilizar `migrate dev` solo en desarrollo.
- Utilizar `migrate deploy` en producción.
- Ejecutar `prisma generate` cuando cambie el schema o se actualicen dependencias relacionadas con Prisma.
- Revisar `git diff` después de utilizar `prisma db pull`.
- Mantener PostgreSQL fuera de Internet.
- Mantener backend enlazado a `127.0.0.1` detrás de Nginx.
- No utilizar `docker compose down -v` en producción.
- Mantener backups periódicos de PostgreSQL.
- Probar restauraciones de backup antes de necesitarlas en una emergencia.
- No ejecutar el seed después de cada despliegue salvo que sea necesario.
- Mantener DTOs validados.
- Utilizar transacciones Prisma cuando una operación modifica múltiples registros relacionados.
- Mantener controllers delgados y lógica de negocio en services.
- Revisar logs del backend después de cada despliegue importante.

---

## Estado actual de producción

Actualmente el sistema utiliza:

```text
PostgreSQL 17
NestJS
Prisma 7
Docker Compose
Nginx
UFW
Fail2Ban
```

Los servicios de aplicación permanecen privados:

```text
Backend:   127.0.0.1:3000
Frontend:  127.0.0.1:8080
Postgres:  red interna de Docker
```

Solo Nginx recibe tráfico web público.

---

## Licencia

Proyecto privado de Elite Academy.

Todos los derechos reservados.
