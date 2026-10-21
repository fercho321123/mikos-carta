# MIKOS - Carta virtual (sistema de pedidos por WhatsApp)

Sitio estático (HTML + CSS + JS, sin build). Publica la carpeta en Netlify, Vercel, GitHub Pages, etc.

## Archivos
- `js/config.js`  Datos del negocio: WhatsApp, tamaños, precios, reglas, ingredientes, extras, pagos.
- `js/core.js`    Catálogo derivado, precios, validaciones y carrito (cada burrito es una línea independiente).
- `js/order.js`   Código único de pedido, estados, historial local y mensaje de WhatsApp.
- `js/app.js`     Interfaz y flujo (Armar → Resumen → Datos → Enviar).

## Datos que aún puedes completar en config.js
`schedule` (horario), `delivery.fee` (valor del domicilio; null = "por confirmar"), `drinks` (lista de gaseosas del combo),
`pagos` (ej. agregar "Nequi", "Daviplata"; "Efectivo" activa el campo "¿Con cuánto vas a pagar?").

## Código de pedido
`MKS-` + 6 caracteres derivados de la hora (segundos desde 2026-01-01). No se repite en un mismo celular.
Sin backend no se puede garantizar unicidad global; para eso, reemplaza `MK.newId()` por una llamada a tu servidor.
Estados preparados: `MK.STATUS` (NUEVO, CONFIRMADO, EN_PREPARACION, LISTO, DESPACHADO, ENTREGADO, CANCELADO).
