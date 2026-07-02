# Asistencia — Curso Vibe Coding

Página de pase de lista para el curso. Dos modos:

- **`/` (alumnos):** buscan su nombre y se marcan presente con el código de 4 dígitos que se proyecta en clase. Sin cuentas ni contraseñas.
- **`/admin` (organizadores):** login con Google (solo emails en la allowlist), abrir/cerrar la sesión del día, ver la lista en vivo, corregir manualmente, historial y exportar CSV.

**Stack:** Next.js (App Router) + Firestore + Firebase Auth, deploy en Vercel. Todo en free tier.

**Seguridad:** el navegador nunca habla directo con Firestore (las reglas niegan todo). Todas las operaciones pasan por API routes del servidor con `firebase-admin`. Las rutas admin verifican el ID token de Firebase y la allowlist `ADMIN_EMAILS`.

## Setup

### 1. Proyecto de Firebase

1. Crea un proyecto en [console.firebase.google.com](https://console.firebase.google.com) (plan Spark, gratis).
2. **Firestore Database** → Crear base de datos (modo producción). Pega el contenido de [firestore.rules](firestore.rules) en la pestaña Reglas.
3. **Authentication** → Método de acceso → habilita **Google**.
4. **Configuración del proyecto → General → Tus apps** → agrega una app Web y copia `apiKey`, `authDomain`, `projectId`.
5. **Configuración del proyecto → Cuentas de servicio** → Generar nueva clave privada (JSON).

### 2. Variables de entorno

```bash
cp .env.local.example .env.local
```

Llena los valores con lo del paso anterior. `ADMIN_EMAILS` = emails de Google con acceso al panel, separados por coma.

### 3. Importar la lista de alumnos

Con un CSV de una columna de nombres (uno por línea):

```bash
node --env-file=.env.local scripts/import-students.mjs lista.csv
```

Es idempotente: puedes volver a correrlo para agregar gente sin duplicar.

### 4. Desarrollo

```bash
npm install
npm run dev
```

### 5. Deploy en Vercel

1. Sube el repo a GitHub y conéctalo en [vercel.com](https://vercel.com) (plan Hobby).
2. Agrega en Vercel las mismas variables de `.env.local`.
3. En Firebase → Authentication → Configuración → Dominios autorizados, agrega el dominio `*.vercel.app` de tu deploy.

## Uso diario

1. Admin entra a `/admin`, pulsa **Abrir sesión de hoy** y proyecta el código de 4 dígitos.
2. Los alumnos entran a `/`, buscan su nombre, teclean el código y listo.
3. El admin ve la lista actualizarse en vivo y puede marcar/desmarcar a quien sea.
4. Al final: **Exportar CSV** para el historial completo (una columna por sesión).
