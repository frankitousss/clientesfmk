# FMK Barbershop — ahora en dos sitios conectados

Se separó todo en dos carpetas/repos, conectados al MISMO proyecto de
Supabase (mismas tablas, mismo login):

- **clientesfmk/** → el sitio público. Se entra directo, sin login. Se
  puede ver horarios y la tienda como invitado. Al querer reservar un
  turno o comprar, aparece un modal (cuadrado) para iniciar sesión o
  registrarse — no un alert del navegador.
- **barberofmk/** → el panel del barbero. Sitio aparte, con su propio
  login. Ahí el barbero también puede cargar su DNI al registrarse.

Subí cada carpeta a su propio repo de GitHub (`barberofmk` y
`clientesfmk` como pediste) y desplegalos por separado (Netlify,
Vercel, GitHub Pages, etc. — los dos gratis y sin backend propio).

## 1. Correr el SQL nuevo en Supabase

Es el MISMO proyecto de Supabase de antes. Andá a **SQL Editor** y
volvé a correr **todo** el archivo `sql/schema.sql` (es seguro
volver a correrlo, no rompe lo que ya tenías). Lo nuevo que agrega es
la función `email_by_dni`, que permite iniciar sesión con el DNI en
vez del email (Supabase Auth solo entiende de "email", así que esta
función busca el email correspondiente al DNI antes de loguear).

## 2. Configurar el link de "olvidé mi contraseña"

Para que el link que llega por email funcione:

- Andá a **Authentication → URL Configuration** en Supabase.
- En **Redirect URLs**, agregá la URL de `reset.html` de CADA sitio
  una vez que estén publicados, por ejemplo:
  - `https://clientesfmk.vercel.app/reset.html`
  - `https://barberofmk.vercel.app/reset.html`
  (o los dominios que uses). Mientras probás en tu compu con un
  servidor local, también podés agregar algo como
  `http://localhost:8000/reset.html`.

## 3. Por qué el login "andaba mal" antes

Las causas más comunes (y ya quedaron cubiertas en el código nuevo):

- Si abrís el `index.html` con doble clic (`file://...`) en vez de un
  servidor local, Supabase no funciona bien. Usá Live Server de VS
  Code o `python3 -m http.server`.
- Si en Supabase tenés activo "Confirm email" (Authentication →
  Settings), el usuario no puede entrar hasta confirmar el mail — el
  sistema ahora te avisa ese error de forma clara en vez de fallar
  raro.
- Si el registro fallaba a mitad de camino (por ejemplo un DNI
  duplicado), ahora se ve el mensaje de error real en vez de quedar
  colgado.

## 4. Qué es nuevo en los formularios

- Confirmar contraseña en el registro (cliente y barbero).
- El barbero también puede cargar su DNI al registrarse.
- Se puede iniciar sesión con email O con DNI, en ambos sitios.
- Botón de ojo para mostrar/ocultar la contraseña.
- Link "Olvidé mi contraseña" debajo de "Entrar", con su propia
  pantalla para crear una contraseña nueva (`reset.html`).
- En `clientesfmk`, se entra directo a la página (sin pantalla de
  login primero). Reservar un turno o comprar un producto sin estar
  logueado abre un modal con el estilo del sitio para iniciar sesión
  o registrarse; después de entrar, retoma automáticamente lo que
  querías hacer.

## 5. Actualización: horarios vencidos y compra por WhatsApp

- **Horarios vencidos**: ahora "Horarios disponibles" también filtra
  por hora, no solo por fecha. Un horario de hoy que ya pasó (por
  ejemplo las 7 de la mañana si ya son las 14) desaparece solo de la
  lista, igual que los de días anteriores. (Sigue en la base de
  datos por las dudas, solo se deja de mostrar y de poder reservar.)
- **Comprar en la tienda**: al tocar "Comprar" ahora se abre un
  modal para elegir la forma de pago (efectivo, transferencia,
  Mercado Pago) y si es retiro en el local o envío a domicilio (con
  su dirección). Al confirmar, se abre WhatsApp con un mensaje ya
  armado que incluye el producto, el precio, la forma de pago, la
  entrega elegida y el usuario/DNI de la cuenta del cliente — así
  después lo podés buscar fácil en "Buscar cliente" del panel del
  barbero.

## 6. Actualización: galería de videos, cantidad en la compra y Cursos

- **Galería de videos**: nueva sección debajo del título de la
  portada con 3 videos tuyos cortando (o de la barbería). Es
  responsive: en celular se ven en vertical, deslizando de a uno; en
  PC se ven los 3 en fila. Para cargar tus videos editados, mirá
  `assets/videos/README.md` — solo hay que poner los archivos con el
  nombre indicado, no hace falta tocar código.
- **Cantidad en la compra**: el modal de "Comprar" ahora pide
  cantidad (mínimo 1), muestra el total calculado en vivo, y el
  mensaje de WhatsApp queda armado con producto, cantidad, precio
  unitario, total, forma de pago, entrega y el DNI del cliente
  registrado.
- **Sección Cursos**: nuevo botón "Cursos" en el menú. Por ahora
  muestra un cartel de "Próximamente" con el estilo del sitio. Más
  adelante se puede convertir en una sección real con cursos
  cargados.

## Cosas para mejorar más adelante

- La compra por WhatsApp no descuenta stock ni cobra online
  automáticamente (sigue siendo el barbero quien coordina y cobra
  la venta a mano, ahora con todos los datos ya en el mensaje).
- Las imágenes de productos siguen siendo por URL; se puede sumar
  Supabase Storage para subirlas desde la compu.
