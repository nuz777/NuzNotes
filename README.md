# NuzNotes

App de notas moderna hecha con **Vite** y JavaScript puro con diseño en modo blanco y tarjetas de cristal esmerilado (*glassmorphism*). Las notas se guardan en el `localStorage` del navegador de cada usuario (sin backend ni base de datos).

- Crear, editar, buscar y eliminar notas
- Guardado automático mientras escribes
- Sincroniza entre pestañas abiertas
- Diseño moderno en modo blanco con tarjetas translúcidas y desenfocadas (glassmorphism)
- Header flotante con bordes redondeados y desenfoque superior

> Como usa `localStorage`, las notas viven solo en ese navegador y dispositivo. Si el usuario borra los datos del sitio, se pierden.

## Desarrollo

```bash
npm install
npm run dev        # servidor de desarrollo
npm run build      # genera dist/
npm run preview    # sirve dist/ en http://localhost:4173
```

## Deploy

Con cada push a `main` se publica en dos lugares:

| Destino | Workflow |
|---|---|
| Azure App Service (Linux, Node 24) | `.github/workflows/main_app-block-de-notas.yml` |
| GitHub Pages | `.github/workflows/deploy-pages.yml` |

`vite.config.js` usa `base: './'`, así que funciona en la raíz (Azure) y en `/NuzNotes/` (GitHub Pages).

### GitHub Pages

En el repo: **Settings → Pages → Source → GitHub Actions**.

### Azure App Service

En portal.azure.com:

1. Crea un App Service **Linux** con pila **Node 24**.
2. **Configuración → Configuración general → "Credenciales de publicación de autenticación básica de SCM"**: actívalo.
3. **Configuración → Configuración de la pila → Comando de inicio**:
   ```
   pm2 serve /home/site/wwwroot --no-daemon --spa
   ```
   (Un App Service Linux con Node no sirve archivos estáticos por sí solo; `pm2` sirve la carpeta del sitio.)
4. **Centro de implementación**: origen GitHub, tu repo y rama `main`, "Agregar un flujo de trabajo", autenticación básica, **Guardar**.
5. Si la app está **Detenida**, inícialo desde **Introducción → Inicio**.
6. Azure genera su propio workflow y el secreto `AZUREAPPSERVICE_PUBLISHPROFILE_...`. Edítalo para que haga `npm ci`, `npm run build` y suba **solo `dist/`** (puedes copiar los pasos de `azure-app-service.yml`), o borra el generado y usa este archivo con `APP_NAME` y el nombre del secreto ajustados.

## Si algo falla

| Síntoma | Qué revisar |
|---|---|
| Workflow en rojo | Corre `npm run build` en local; casi siempre es el mismo error. |
| Azure muestra "Your web app is running..." | Revisa el comando de inicio de `pm2` y reinicia la app. |
| Azure no responde | Que el estado sea "En ejecución". |
| Deploy a Azure falla con 401 | Reactiva la autenticación básica de SCM o actualiza el secreto con el perfil de publicación nuevo. |
| Pages muestra versión vieja o el README | Source debe ser **GitHub Actions**. |
| `npm ci` falla | Commitea `package-lock.json` actualizado. |
