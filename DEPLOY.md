# Deploy de NuzNotes

El proyecto se compila con **Vite** y se publica en dos lugares con cada push a `main`:

| Destino | URL | Workflow |
|---|---|---|
| Azure App Service (Linux, Node 24) | https://app-block-de-notas.azurewebsites.net/ | `.github/workflows/main_app-block-de-notas.yml` |
| GitHub Pages | https://nuz777.github.io/NuzNotes/ | `.github/workflows/deploy-pages.yml` |

---

## Qué se hizo, paso a paso

### 1. Configuración de Vite y del proyecto

- **`vite.config.js`**: `base: './'`. Las rutas quedan relativas, así que el sitio funciona tanto en la raíz (Azure) como en `/NuzNotes/` (GitHub Pages).
- **`package.json`**: scripts `dev`, `build` y `preview`, y `"type": "module"`.
- **`public/web.config`**: Vite lo copia a `dist/`. Solo se usaría si el App Service fuera Windows (IIS). En Linux no molesta.
- **`.gitignore`**: se ignora `dist/`, que es el resultado del build. No se versiona porque lo generan los workflows.

### 2. GitHub Pages

- Se agregó `.github/workflows/deploy-pages.yml`. Hace `npm ci`, `npm run build` y publica `dist/` en Pages.
- En el repo, en **Settings → Pages → Source**, tiene que estar seleccionado **GitHub Actions**.

### 3. Azure App Service (`app-block-de-notas`)

Configuración en portal.azure.com:

1. **Configuración → Configuración general → "Credenciales de publicación de autenticación básica de SCM"** se activó. Sin esto, el Centro de implementación no deja usar "Autenticación básica" y el botón Guardar queda deshabilitado.
2. **Configuración → Configuración de la pila → Comando de inicio**:
   ```
   pm2 serve /home/site/wwwroot --no-daemon --spa
   ```
   Un App Service Linux con Node no sirve archivos estáticos por sí solo. `pm2` (ya viene instalado) sirve la carpeta del sitio.
3. **Centro de implementación**:
   - Origen: **GitHub**. Organización y repositorio correspondiente, rama `main`.
   - Opción de flujo de trabajo: **Agregar un flujo de trabajo**.
   - Tipo de autenticación: **Autenticación básica**.
   - **Guardar**. Azure genera `.github/workflows/main_app-block-de-notas.yml` y guarda el perfil de publicación como secreto del repo (`AZUREAPPSERVICE_PUBLISHPROFILE_...`).
4. Si la app está **Detenida**, se inicia desde **Introducción → Inicio**.
5. El workflow sube el build compilado (`dist/`) como `node-app`.

---

## Qué hacer cuando subas cambios nuevos

### Flujo normal

1. Hacé los cambios en el código (`index.html`, `assets/...`).
2. Probalo en local:
   ```bash
   npm run dev        # servidor de desarrollo con recarga automática
   ```
3. Antes de subir, verificá que el build compila:
   ```bash
   npm run build      # si falla acá, también va a fallar en GitHub
   npm run preview    # sirve dist/ en http://localhost:4173 para probar la versión final
   ```
4. Commit y push a `main`:
   ```bash
   git add .
   git commit -m "Descripción del cambio"
   git push
   ```
5. Listo. El push dispara los dos workflows. En 1 a 3 minutos el cambio está en Azure y en Pages.

### Si algo falla

| Síntoma | Qué revisar |
|---|---|
| El workflow sale en rojo en **Actions** | Abrí el run y mirá el paso que falló. Casi siempre es `npm run build`: corré `npm run build` en local y vas a ver el mismo error. |
| Azure muestra la página por defecto ("Your web app is running...") | Revisá que el **Comando de inicio** siga siendo `pm2 serve /home/site/wwwroot --no-daemon --spa` y reiniciá la app. |
| Azure no responde | Revisá en **Introducción** que el estado sea "En ejecución". Si dice "Detenido", dale a **Inicio**. |
| El deploy a Azure falla con error de autenticación (401) | Alguien desactivó la autenticación básica de SCM o se regeneró el perfil de publicación. Reactivala en Configuración general, o descargá el perfil nuevo y actualizá el secreto `AZUREAPPSERVICE_PUBLISHPROFILE` en GitHub. |
| Pages muestra la versión vieja o el README | Revisá que en **Settings → Pages** el Source sea **GitHub Actions**. |
