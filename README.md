# MichiMenú 😼 — CONGELADO (2026-07-28)

**Este repo está congelado, no borrado.** MichiMenú migró a la plataforma
multi-hogar [Semanita](https://semanita.app/h/michi/) — los dos miembros del
hogar tienen cuenta (enrolados vía invites) y sus checks sincronizan por
servidor. Desde el 2026-07-28: `data.js` **ya no se actualiza** (la semana
viva se siembra en la BD de Semanita — ver
`projects/menu-platform/db/README.md`), el deploy de GitHub Pages sigue en
línea solo como respaldo con un banner de mudanza, y la historia queda como
referencia (fue el molde original de toda la familia de apps). Mismo
tratamiento que capimenu recibió el mismo día.

---

Menú semanal, recetas con porciones en gramos (ella/tú), lista del súper con
links a Walmart, y buzón de antojos para la próxima semana. PWA estática —
sin backend, sin cuentas, sin datos sensibles. El estado (palomitas, súper,
antojos) vive en localStorage de cada teléfono.

## Probar local

Abrir `index.html` en el navegador, o:

```
npx serve .
```

## Deploy (GitHub Pages, igual que huerto-serdan)

1. Crear repo público `michimenu` en GitHub (cuenta Qimbis).
2. `git init && git add . && git commit -m "MichiMenú v1" && git push` a `main`.
3. Settings → Pages → Deploy from branch `main` / root.
4. URL: `https://qimbis.github.io/michimenu/`

## Instalar en los teléfonos

- **iPhone (ella):** abrir la URL en Safari → Compartir → **Agregar a
  pantalla de inicio**. Obligatorio, no opcional: si solo se usa como
  pestaña, iOS borra el almacenamiento local tras ~7 días sin uso y se
  pierden antojos y palomitas.
- **Samsung (tú):** Chrome → menú ⋮ → Agregar a pantalla principal.

## Ritual semanal

Cada fin de semana: llevar a Maple (1) qué gustó, (2) qué no se terminó,
(3) la lista de antojos del app. Maple genera la semana siguiente como un
objeto nuevo al **final** de `MICHI_DATA.weeks` en `data.js`; commit + push
y el app se actualiza solo (service worker network-first). No borrar
semanas pasadas — son el archivo para los domingos flojos.
