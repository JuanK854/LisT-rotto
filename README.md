# 📋 Pase de lista — Taller Vibe Coding (Remotto)

Esta es la guía para los instructores del taller. Aquí está todo lo que necesitas para tomar asistencia cada clase, paso por paso. No necesitas saber nada de programación.

**La página:** https://ttaller.vercel.app/

---

## La idea general (léelo una vez y ya)

Antes, pasar lista era ir nombre por nombre en papel. Con esta página, son los propios alumnos quienes se registran desde su celular, y ustedes solo supervisan desde un panel. La clave de que nadie haga trampa es el **código del día**: un número de 4 dígitos que se genera cada clase y que **solo se muestra dentro del salón** (proyectado en la pantalla). Como el alumno necesita escribir ese código para registrarse, alguien que se quedó en su casa no puede marcarse presente aunque tenga el link de la página, porque nunca vio el código.

El flujo completo de un día de clase se ve así:

```
INSTRUCTOR                              ALUMNO
──────────                              ──────
1. Entra al panel (/admin)
2. Toca "Iniciar pase de lista"
   → se genera el código del día
3. Toca "⛶ Proyectar QR"
   → QR + URL en pantalla completa
                                        4. Escanea el QR con su cámara
                                        5. Busca y toca su nombre
                                        6. Escribe el código de 4 dígitos
                                        7. Ve la confirmación verde ✓
8. Ve llegar los registros en vivo
   (nombre + hora de llegada)
9. Marca a mano a quien no trae cel
10. Al final: "Terminar pase de lista"
```

Todo lo que pasa queda guardado por fecha en la pestaña **Historial**, así que nunca tienen que apuntar nada en otro lado.

---

## Entrar al panel de instructores

1. Abre https://ttaller.vercel.app/ — vas a ver la lista de alumnos (esa es la vista de ellos).
2. Baja hasta el pie de página y toca la palabra **"Remotto"**. Es un acceso discreto a propósito: los alumnos no lo notan, pero te lleva al inicio de sesión del panel.
3. Escribe el **email y contraseña de instructor** que te compartieron y toca **Entrar**.
4. ¿Llegaste aquí por accidente sin ser instructor? El botón **"← Volver al pase de lista"** te regresa a la lista.

Si tu email no tiene acceso, el sistema te va a rechazar aunque la contraseña sea correcta — solo los emails autorizados pueden entrar. Pídele a Juan que agregue el tuyo.

Una vez dentro, arriba a la derecha tienes dos botones que te acompañan siempre: **"Ver pase de lista"** (para asomarte a lo que ven los alumnos) y **"Salir"** (cierra tu sesión).

---

## El día de la clase, paso a paso

### 1. Inicia el pase de lista

En la pestaña **Hoy** hay una tarjeta grande. Toca **"Iniciar pase de lista"**. En ese momento pasan dos cosas: se crea el registro de asistencia de la fecha de hoy, y se genera el **código de 4 dígitos** que aparece en grande, en morado.

Un detalle importante para que no te saque de onda: el código es **uno por día**. Si cierras el pase y lo vuelves a abrir el mismo día, sale el mismo número — no es un error, es para que los que ya se registraron no queden con un código "viejo". Mañana será otro número automáticamente.

### 2. Proyecta el QR

Toca el botón **"⛶ Proyectar QR"** (está a la derecha de las pestañas Hoy/Historial). La pantalla completa se pone blanca con tres cosas: el texto "Escanea para pasar lista", el **QR gigante**, y abajo la **URL de la página** en letras grandes, para quien prefiera escribirla a mano en su navegador en vez de escanear.

Pon esa pantalla en el proyector. Para cerrarla, toca en cualquier parte.

**El código de 4 dígitos no viene en el QR** (a propósito — si viniera, cualquiera con una foto del QR podría registrarse después). Díctalo en voz alta o escríbelo en el pizarrón junto a la proyección.

### 3. Los alumnos se registran solos

Cada alumno escanea, busca su nombre (el buscador perdona los acentos: "hector" encuentra a "Héctor"), lo toca, escribe el código y le sale su confirmación verde. Si vuelve a abrir la página ese mismo día, solo verá el mensaje de que ya está registrado — no puede duplicarse ni marcarse dos veces.

Mientras tanto, en tu panel la lista se actualiza **sola cada 10 segundos**: verás cada nombre ponerse verde con su **hora de llegada**. El contador de arriba te dice cuántos van (por ejemplo "23 / 57 presentes").

### 4. Ayuda a los casos especiales

¿Alguien no trae celular, se le acabó la pila, o de plano no puede con la tecnología? **Tú lo marcas**: toca su nombre en tu lista y queda registrado al instante, con la etiqueta **(manual)** para que quede claro que lo marcó un instructor. Tocarlo otra vez lo desmarca — así también corriges errores.

### 5. Cierra cuando termine la clase

Toca **"Terminar pase de lista"**. A partir de ahí ya nadie puede registrarse (útil para que no lleguen registros de gente que se fue temprano y pasó el código a un amigo... por si acaso). Si se te olvida cerrar, no pasa nada grave: al día siguiente el código de hoy ya no sirve.

---

## Consultar la asistencia de días pasados

Ve a la pestaña **Historial**. Ahí está cada día de clase como una tarjeta con su fecha y cuántos asistieron, por ejemplo: *"miércoles, 9 de julio — 41 asistentes"*.

- **Toca una fecha** y verás la lista completa de ese día: quién asistió, a qué hora llegó cada quien, y si fue registro propio o manual. Desde ahí también puedes corregir ese día tocando nombres (por si alguien reclama una falta injusta días después).
- **El botón 🗑** de cada fecha elimina ese día completo con toda su asistencia. Te pide confirmación porque **no se puede deshacer**. Úsalo para borrar días de prueba o pases abiertos por error.
- **"Descargar Excel"** te baja un archivo con el resumen de todo el curso: una fila por persona, una columna por cada día (1 = asistió, 0 = faltó) y una columna de total. Sirve para entregar reportes o sacar constancias al final.

---

## Añadir a un integrante nuevo

¿Llegó alguien que no está en la lista? En la pestaña **Hoy**, hasta abajo de la lista, está la tarjeta **"Añadir integrante"**:

1. Escribe su **nombre completo** (nombre y apellidos, como quieres que aparezca).
2. Toca **"Añadir"**.
3. Listo: ya aparece en la lista de todos y puede registrarse en ese mismo momento.

Si escribes un nombre que ya existe (aunque sea con mayúsculas o acentos diferentes), el sistema te avisa que esa persona ya está — no se duplica.

---

## Qué ve el alumno (para cuando te pregunten)

- Ve **solo la lista de nombres** y el buscador. No puede ver quién asistió y quién no, ni hoy ni ningún día — esa información es exclusiva del panel de instructores.
- Después de registrarse, su pantalla se simplifica: solo el mensaje verde de confirmación. Si entra de nuevo ese día, verá "**ya estás registrado**". Es normal y significa que todo está bien.
- Debajo de ese mensaje hay un enlace de "**Registrar a otra persona desde este dispositivo**" — para el caso clásico de que alguien le preste su celular a un compañero que no trajo el suyo.

---

## Problemas comunes y su solución

| Lo que pasa | Por qué | Qué hacer |
|---|---|---|
| El alumno toca su nombre y no pasa nada, la lista se ve apagada | No hay pase de lista iniciado | Inícialo desde la pestaña Hoy |
| "Código incorrecto" | Está escribiendo otro número, o el de un día anterior | Recuérdale el código de HOY proyectado |
| "No encuentro mi nombre" | Puede estar buscando con apodo o segundo nombre | Que busque solo por apellido; si de verdad no está, agrégalo con "Añadir integrante" |
| Alguien quedó marcado y no debía (o al revés) | Error de dedo, o registro prestado | En la pestaña Hoy (o en la fecha del Historial), toca su nombre para corregir |
| A un alumno le sale "ya estás registrado" sin haberse registrado hoy | Alguien más usó su celular, o quedó de un registro anterior | Verifica en tu panel si aparece presente; ahí mandas tú |
| La página se ve rara o congelada después de navegar con "atrás" | Caché del navegador | Recargar la página lo arregla siempre |
| El QR proyectado no abre la página | El QR se generó en una versión vieja de la página | Cierra el overlay y vuelve a tocar "⛶ Proyectar QR" |

---

## Para quedarse tranquilos con la seguridad

- Al panel solo entran los **emails autorizados** con su contraseña. Cualquier otra cuenta es rechazada.
- Los alumnos **no necesitan cuenta ni contraseña**, y no pueden ver, tocar ni deducir información de nadie más.
- Nadie puede registrarse sin el código del día, y el código solo existe dentro del salón.
- La base de datos no acepta conexiones del público: todo pasa por el servidor con llaves privadas.
