# atv-recursos-mkt

Los recursos que Juan regala en los reels ("comentá ONBOARDING y te lo mando").

- `/`: **Fathoms + Playbooks**, el índice de las clases de Juan (series con su llamada de Fathom y sus
  playbooks en PDF). Los links no vienen en el JSON: cada botón pasa por `/api/contenido/clases/{slug}/ir`,
  que cuenta el clic y redirige. Se edita en ATV Ops, en Marketing → Clases.
- `/biblioteca`: todos los recursos. Los viejos se piden siempre por WhatsApp. Con `?r=palabra` se cuenta la visita y se marca la tarjeta (link para el DM de un reel viejo).

Los datos y las métricas viven en **ATV Ops** (Marketing → Recursos). Esta app no tiene backend: el nginx del contenedor reenvía `/api/contenido/` a `https://ops.atvos.io/api/recursos-publicos/`.

## Local

Con el backend de ATV Ops en `localhost:8010`:

```
npm ci
npm run dev
```

## Producción

Comparte `recursos.atvos.io` con la landing del webinar. El build lleva `base: '/mkt/'` para que sus archivos no choquen con los `/assets/` del webinar. El nginx del host manda `/`, `/video`, `/biblioteca`, `/mkt/` y `/api/contenido/` a este contenedor (`/video` era la landing vieja: cae en la raíz) (`127.0.0.1:8137`).

```
docker compose up -d --build
```
