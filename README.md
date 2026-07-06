# 📋 Pase de lista — Taller Vibe Coding (Remotto)

Guía de uso del sistema de asistencia del taller.

**Página:** https://ttaller.vercel.app/

---

## Cómo funciona

La asistencia la registran los propios alumnos desde su celular; el panel de administración sirve para supervisar y corregir. El control anti-suplantación es el **código del día**: un número de 4 dígitos que se genera en cada sesión y solo se muestra dentro del salón. Como el registro requiere ese código, no es posible marcarse presente desde fuera aunque se tenga el link de la página.

Flujo completo de una sesión:

```
PANEL DE ADMINISTRACIÓN                 ALUMNO
───────────────────────                 ──────
1. Entrar a /admin
2. "Iniciar pase de lista"
   → se genera el código del día
3. "⛶ Proyectar QR"
   → QR + URL en pantalla completa
                                        4. Escanea el QR (o escribe la URL)
                                        5. Busca y toca su nombre
                                        6. Escribe el código de 4 dígitos
                                        7. Confirmación verde ✓
8. Los registros llegan en vivo
   (nombre + hora de llegada)
9. Marcado manual para quien
   no trae dispositivo
10. Al terminar: "Terminar pase de lista"
```

Cada sesión queda guardada por fecha en la pestaña **Historial**.

---

## Acceso al panel

1. Abre https://ttaller.vercel.app/ (la vista pública, con la lista de nombres).
2. En el pie de página, toca la palabra **"Remotto"** — es el acceso al panel; también funciona entrar directo a `/admin`.
3. Inicia sesión con el email y contraseña de administrador.

Solo los emails de la lista de administradores pueden entrar; cualquier otra cuenta es rechazada aunque la contraseña sea correcta. Para dar de alta un email nuevo, hay que agregarlo a la variable `ADMIN_EMAILS` del proyecto.

Dentro del panel, arriba a la derecha: **"Ver pase de lista"** abre la vista pública y **"Salir"** cierra la sesión.

---

## Durante la sesión

### 1. Iniciar el pase de lista

Pestaña **Hoy** → **"Iniciar pase de lista"**. Se crea el registro de la fecha y se genera el **código de 4 dígitos**, que aparece en pantalla.

El código es **uno por fecha**: cerrar y reabrir el pase el mismo día conserva el mismo número (así los registros previos siguen siendo válidos). Cada fecha nueva genera un código distinto. El código solo cambia dentro de un mismo día si se elimina la fecha desde el Historial.

### 2. Proyectar el QR

Botón **"⛶ Proyectar QR"** (a la derecha de las pestañas). Abre una pantalla completa blanca con el QR y, debajo, la **URL en letras grandes** para quien prefiera escribirla. Se cierra tocando en cualquier parte.

El código de 4 dígitos **no viaja dentro del QR** — es deliberado: si viajara, una foto del QR bastaría para registrarse desde fuera. Hay que dictarlo o escribirlo junto a la proyección.

### 3. Registro de los alumnos

El alumno escanea, busca su nombre (el buscador ignora acentos), lo toca, escribe el código y recibe la confirmación. No es posible registrarse dos veces: los reintentos muestran "ya estás registrado".

En el panel, la lista se actualiza **sola cada 10 segundos**: cada registro aparece en verde con su **hora de llegada**, y el contador indica el avance (ej. "23 / 57 presentes").

### 4. Marcado manual

Tocar un nombre en la lista del panel lo marca o desmarca al instante. Los registros hechos así llevan la etiqueta **(manual)**. Sirve para quien no trae dispositivo y para corregir errores.

### 5. Cerrar la sesión

**"Terminar pase de lista"** detiene los registros de ese día. Si no se cierra, el código deja de servir de todas formas al cambiar la fecha.

---

## Historial

Pestaña **Historial**: cada sesión aparece como una tarjeta con fecha y total de asistentes.

- **Tocar una fecha** muestra el detalle: quién asistió, hora de llegada y si el registro fue propio o manual. Desde ahí se puede corregir la asistencia de esa fecha tocando los nombres.
- **El botón 🗑** elimina la fecha completa con toda su asistencia. Pide confirmación y **no se puede deshacer**. Útil para borrar sesiones de prueba o abiertas por error.
- **"Descargar Excel"** genera el concentrado del curso: una fila por persona, una columna por fecha (1 = asistió, 0 = faltó) y el total por persona.

---

## Añadir integrantes

Pestaña **Hoy**, al final de la lista, tarjeta **"Añadir integrante"**:

1. Escribir el **nombre completo** tal como debe aparecer en la lista.
2. Tocar **"Añadir"**.
3. La persona aparece de inmediato en la lista y ya puede registrarse.

Los nombres repetidos se detectan (aunque cambien mayúsculas o acentos) y no se duplican.

---

## Lo que ve el alumno

- Solo la lista de nombres y el buscador. **La información de quién asistió no es visible para los alumnos**, ni en pantalla ni en la red; es exclusiva del panel.
- Tras registrarse, su pantalla muestra únicamente la confirmación. Si vuelve a entrar el mismo día desde el mismo dispositivo, ve "**ya estás registrado**".
- Bajo ese mensaje hay un enlace de "**Registrar a otra persona desde este dispositivo**", para registrar a un compañero desde el mismo celular.

---

## Situaciones comunes

| Situación | Causa | Acción |
|---|---|---|
| Tocar un nombre no hace nada; la lista se ve apagada | No hay pase de lista iniciado | Iniciarlo desde la pestaña Hoy |
| "Código incorrecto" | Número equivocado o de una fecha anterior | Verificar el código del día proyectado |
| Un nombre no aparece | Búsqueda por apodo o segundo nombre | Buscar por apellido; si no existe, usar "Añadir integrante" |
| Registro incorrecto (de más o de menos) | Error al marcar o registro ajeno | Tocar el nombre en Hoy (o en la fecha del Historial) para corregir |
| "Ya estás registrado" sin haberse registrado ese día | Otro registro se hizo desde ese dispositivo | Verificar el estado real en el panel y corregir ahí |
| Página congelada tras navegar con "atrás" | Caché del navegador | Recargar la página |
| El QR no abre la página | Overlay generado en una versión anterior | Cerrar y volver a tocar "⛶ Proyectar QR" |

---

## Seguridad

- Acceso al panel restringido a los emails de la lista de administradores.
- Los alumnos no usan cuentas ni contraseñas y no pueden ver información de otros.
- Ningún registro es posible sin el código del día, y el código solo existe dentro del salón.
- La base de datos no acepta conexiones directas del navegador; toda operación pasa por el servidor.
