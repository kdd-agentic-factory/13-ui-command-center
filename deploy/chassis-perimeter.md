# Perímetro comercial Chassis

El perfil `chassis` es la entrega comercial; `local-development` conserva las integraciones de desarrollo. Vite selecciona Chassis por defecto al construir y desarrollo local durante `vite dev`. No son roles ni credenciales. La autorización real sigue en el servidor.

## Configuración

Build: `VITE_PRODUCT_PROFILE=chassis`, `VITE_TELEMETRY_URL=/api/telemetry`; configurar URL y clave anónima públicas del proveedor de autenticación aprobado. Nunca incluir secretos de servicio en variables VITE. El SDK comercial expone únicamente operaciones públicas de autenticación; las rutas históricas, datos, funciones, pagos, correo, IA y transportes directos quedan fuera del cliente comercial.

Runtime nginx: `KDD_TELEMETRY_HOST` obligatorio, sin esquema/ruta/usuario; `KDD_TELEMETRY_PORT` opcional, por defecto443; `KDD_TELEMETRY_API_KEY` opcional y exclusiva del proxy. La validación envsh ocurre antes de envsubst; rechaza entradas inválidas. El destino usa HTTPS, SNI y CA verificada; no admitir destinos elegidos por peticiones. No usar claves principales de agentes en esta variable.

Backend18: `TDS_PRODUCT_PROFILE=chassis`, `TDS_APP_ENV=production`, `TDS_IDENTITY_MODE=authenticated`, proveedor HTTPS fijo y el resto de configuración productiva exigida por Settings. Comprobar los nombres del proveedor en config.py; no copiar credenciales de desarrollo. Este cambio no configura membresías ni aplica RLS cloud.

## Contrato

El inventario autoritativo es18/src/telemetry_dataset/identity/public_surface.py, exportado a deploy/chassis-surface.json. Desde18 ejecutar `.venv/Scripts/python.exe scripts/export_chassis_surface.py --check ../13-ui-command-center/deploy/chassis-surface.json`. Desde13 ejecutar `npm run perimeter:check`. Para regenerar: exportar con --output y ejecutar `node scripts/render-chassis-surface.mjs`.

Nginx solo publica el inventario humano bajo /api/telemetry. Otras rutas API devuelven404, las privadas sin Bearer401 y las cabeceras de servicio falsas403. Presencia de Bearer no verifica JWT: lo hace el backend. El proxy sustituye X-API-Key, elimina cookies y conserva Authorization/X-Team-ID. Límite multipart102MiB, contenido backend100MiB, conexión10s y lectura/envío180s. Timeout no garantiza cancelación inmediata de SDK nativo.

El cliente comercial verifica /identity/mode sin caché antes de cada operación (timeout12s). Si falla o declara modo distinto a authenticated, revoca la selección de equipo y bloquea operaciones; Comprobar acceso vuelve a validar modo y membresía. Cada petición comprueba también que su generación y equipo siguen vigentes antes de salir y al consumir la respuesta. Coste: una petición adicional por operación; no se conserva una autorización de modo durante una caída.

## Verificación y límites

`npm test`, `npm run typecheck`, `npm run perimeter:check`; `npm run perimeter:test` usa exclusivamente imágenes ya disponibles, red aislada y certificados sintéticos. Su resultado global permanece blocked hasta ejecutar la cadena completa de aplicación. `npm run test:e2e:perimeter` exige KDD_PERIMETER_BASE_URL loopback y un runtime de navegador aislado; nunca usa cloud por defecto. No ejecutarlo sin aislamiento.

No se ha desplegado esta configuración. El control nginx1.29-alpine no acredita la imagen de release1.27.3-alpine del Dockerfile. La autoridad de identidad de control es sintética y no certifica proveedor, RLS ni permisos cloud.

## Reversión preparada

Conservar el artefacto comercial y su manifiesto por separado antes de construir desarrollo. Para una futura reversión operativa, restaurar el último artefacto y configuración verificados como conjunto; no abrir proxies antiguos ni cambiar producción a modo local. Las baselines de esta sesión sirven para comparar los cambios del perímetro, no para sustituir un checkout completo que contiene trabajo previo. No se ha ejecutado reversión, reinicio, migración o despliegue.


## Paquete comercial comprobado

La resolución de SettingsPage se decide en Vite por perfil: comercial compila SettingsCommercialPage y desarrollo conserva SettingsDevelopmentPage. Chassis no expone automáticamente variables VITE_*: únicamente las claves públicas de autenticación, contacto, web blueprint y analítica expresamente definidas, más telemetría same-origin y perfil. Los endpoints históricos de archivos dotenv se ignoran en la entrega comercial.

La carpeta pública comercial se genera con favicon, manual y diseño experimental de referencia; no se copian pit-wall-os ni la configuración histórica vercel.json. Desarrollo conserva public completo. El test commercialArtifact construye realmente la entrega, inyecta un destino histórico de control y exige su ausencia y la de URLs históricas/ajustes prefijados. .dockerignore excluye .superpowers para no enviar certificados sintéticos ni snapshots al contexto de Docker. No sustituye la aceptación completa de la imagen ni valida RLS.


## Contexto real de Docker — corrección adicional

Detectado y reproducido con Docker: la exclusión general **/*.md eliminaba el manual requerido por el build comercial. Se conserva esa exclusión y se permite exclusivamente public/kdd-application-manual.md. Control tests/perimeter/Dockerfile.context: FROM scratch, solo COPY, sin descarga de imágenes, instalación ni ejecución del producto. Build RED por manual ausente → GREEN con7archivos copiados y cotejados byte a byte. Un segundo control rechaza un archivo sintético bajo .superpowers. Evidencia: docker-context-red.log, docker-context-green.log, docker-context-denied.log y docker-context-acceptance.json en el workspace del plan.

Esto valida la disponibilidad de los recursos de build, no la imagen completa, sus dependencias, el backend ni la cadena de autenticación productiva. No se modifica CI remoto ni se despliega.
