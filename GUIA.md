# Guía para instructores — Pase de lista del Taller

Manual de uso de la página de asistencia. No necesitas saber nada técnico.

**Página:** https://pase-de-lista-gilt.vercel.app/

---

## Cómo funciona en 30 segundos

1. Un instructor **inicia el pase de lista** desde el panel → se genera un **código de 4 dígitos**.
2. Se **proyecta el QR y el código** en la pantalla del salón.
3. Cada alumno escanea el QR con su celular, **busca su nombre**, escribe el código y listo: queda registrado.
4. El código es el candado: como solo lo ven los que están en el salón, nadie puede marcarse desde su casa.

---

## Entrar al panel de instructores

1. Abre la página y toca la palabra **"Remotto"** en el pie de página (o entra directo a `/admin`).
2. Inicia sesión con el email y contraseña de instructor que te compartieron.
3. Si te equivocaste de pantalla, el botón **"← Volver al pase de lista"** te regresa.

> Si tu email no tiene acceso, pídele a Juan que te agregue a la lista de administradores.

## El día de la clase (rutina normal)

1. Entra al panel → pestaña **Hoy** → botón **"Iniciar pase de lista"**.
2. Aparece el **código de 4 dígitos** en grande. Proyéctalo, o mejor:
3. Toca **"⛶ Proyectar QR"** (arriba a la derecha) → se abre el QR a pantalla completa para que lo escaneen. Se cierra tocando en cualquier parte. El código también díctalo o escríbelo en el pizarrón.
4. La lista de abajo se va actualizando sola (cada 10 segundos) con la hora en que cada quien se registró.
5. Al terminar la clase puedes dar **"Terminar pase de lista"** para que ya nadie se registre tarde. (Opcional: si no lo cierras, se cierra solo en el sentido de que al día siguiente ya es otra fecha.)

**Notas sobre el código:**
- Es **uno por día**: aunque cierres y vuelvas a abrir el pase el mismo día, el código no cambia.
- Cada día nuevo se genera uno diferente automáticamente.

## Marcar o corregir a alguien a mano

- En la pestaña **Hoy**, toca el nombre de la persona y se marca/desmarca al instante. Los marcados a mano aparecen con la etiqueta **(manual)**.
- Sirve para: gente que no trae celular, que llegó tarde con justificación, o que se marcó por error.

## Consultar días anteriores

- Pestaña **Historial**: ahí queda guardado cada día de clase con su número de asistentes.
- Toca una fecha para ver **quiénes asistieron y a qué hora**. También puedes corregir asistencias de días pasados tocando los nombres.
- El botón **🗑** de cada fecha elimina ese día completo (pide confirmación; no se puede deshacer).
- **"Descargar Excel"** genera un archivo con todo el historial: una fila por persona, una columna por día y el total de asistencias. Los acentos salen bien en Excel.

## Añadir a un integrante nuevo

- Pestaña **Hoy** → hasta abajo está **"Añadir integrante"** → escribes su nombre completo → **Añadir**.
- Aparece de inmediato en la lista y ya puede registrarse como todos.
- Si el nombre ya existe, el sistema te avisa (no se duplica).

## Qué ve el alumno (por si te preguntan)

- Entra, busca su nombre, lo toca, escribe el código de 4 dígitos y le sale la confirmación verde.
- Si vuelve a entrar el mismo día desde el mismo celular, solo ve el mensaje de **"ya estás registrado"** — es normal, no tiene que hacer nada más.
- Si alguien le presta el celular a un compañero, abajo del mensaje hay un enlace para **"Registrar a otra persona desde este dispositivo"**.
- Los alumnos **no pueden ver** quién asistió y quién no; eso solo se ve en el panel de instructores.

## Problemas comunes

| Situación | Qué hacer |
|---|---|
| "No me aparece el botón de marcar" / la lista se ve gris | No hay pase de lista iniciado. Inícialo desde el panel. |
| "Dice código incorrecto" | Está escribiendo otro número; recuérdale el código proyectado. El código de ayer no sirve hoy. |
| "No encuentro mi nombre" | Búscalo sin acentos o solo por apellido. Si de verdad no está, agrégalo con "Añadir integrante". |
| Alguien se marcó y no debía | Pestaña Hoy → toca su nombre para desmarcarlo. |
| La página se quedó "congelada" tras navegar | Recargar la página siempre la arregla. |

## Seguridad (resumen para quedarse tranquilos)

- Solo los emails autorizados pueden entrar al panel; todo lo demás está bloqueado.
- Los alumnos no necesitan cuenta ni contraseña, y no ven datos de nadie más (solo la lista de nombres).
- La base de datos no acepta conexiones directas desde el navegador; todo pasa por el servidor.
