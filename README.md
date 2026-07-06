# Asistencia — Taller Vibe Coding (Remotto)

> 📖 **¿Eres instructor y solo quieres saber cómo usarla?** Lee la [Guía para instructores](GUIA.md) — sin tecnicismos.

Página de pase de lista para el taller. Dos modos:

- **`/` (alumnos):** buscan su nombre y se marcan presente con el código de 4 dígitos que se proyecta en clase. Sin cuentas ni contraseñas.
- **`/admin` (organizadores):** login con email/contraseña (solo emails en la allowlist), abrir/cerrar la sesión del día, ver la lista en vivo, corregir manualmente, historial y exportar CSV.

**Stack:** Next.js (App Router) + Supabase (Postgres + Auth), deploy en Vercel. Todo en free tier. Diseño basado en [remotto.ai](https://www.remotto.ai).

**Seguridad:** el navegador nunca habla directo con la base (RLS activo sin políticas = todo bloqueado). Todas las operaciones pasan por API routes del servidor con la llave secreta. Las rutas admin verifican el access token de Supabase y la allowlist `ADMIN_EMAILS`.

## Setup

### 1. Proyecto de Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com/dashboard) (plan Free).
2. En el **SQL Editor**, ejecuta el contenido de [supabase/schema.sql](supabase/schema.sql).
3. En **Settings → API Keys**, copia la URL del proyecto, la llave *publishable* y una llave *secret*.

### 2. Variables de entorno

```bash
cp .env.local.example .env.local
```

Llena los valores del paso anterior. `ADMIN_EMAILS` = emails con acceso al panel, separados por coma.

### 3. Usuario admin e importación de alumnos

```bash
# crea el usuario del panel (email + contraseña)
node --env-file=.env.local scripts/create-admin.mjs admin@ejemplo.com su-contraseña

# importa la lista (CSV de una columna de nombres); idempotente
node --env-file=.env.local scripts/import-students.mjs lista-participantes.csv
```

### 4. Desarrollo

```bash
npm install
npm run dev
```

### 5. Deploy en Vercel

1. Sube el repo a GitHub y conéctalo en [vercel.com](https://vercel.com) (plan Hobby).
2. Agrega en Vercel las mismas variables de `.env.local`.

## Uso diario

1. Admin entra a `/admin`, pulsa **Abrir sesión de hoy** y proyecta el código de 4 dígitos.
2. Los alumnos entran a `/`, buscan su nombre, teclean el código y listo.
3. El admin ve la lista actualizarse en vivo (cada 10 s) y puede marcar/desmarcar a quien sea.
4. Al final: **Exportar CSV** para el historial completo (una columna por sesión, abre en Excel).
