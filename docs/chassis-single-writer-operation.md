# Operación de Chassis: instancia escritora única

Estado: candidato local; no desplegado y no autorizado para promoción automática.

## Contrato de instalación

Una instalación tiene una sola instancia escritora y un único volumen persistente. API, gateway y worker se construyen con identidades verificadas de los repositorios 01, 02, 17 y 18; la web corresponde al repositorio 13. No se utilizan datos del operador para construir imágenes. El perfil comercial exige identidad HTTPS y rechaza el modo local.

La raíz contiene `.state-format.json`, `recorded/<UUID>.json`, `recorded/catalog.sqlite`, `chassis.sqlite`, `suspension-lab.sqlite` y `domain-evidence.sqlite`. Se conservan, cuando existen, `chassis.pre-team.sqlite` y `chassis.pre-engineering.sqlite`. SQLite gestiona sus journals/WAL/SHM: no eliminarlos manualmente. Cualquier otro contenido impide la apertura hasta clasificarlo expresamente.

El bloqueo es del sistema operativo, no de un PID guardado. Un proceso que pierde o no obtiene el bloqueo no puede operar como escritor. La segunda instancia y las operaciones de mantenimiento fallan mientras el escritor siga activo.

## Preparación del operador

Usar `deploy/compose.chassis.yml` con imágenes verificadas y un volumen externo previamente identificado. `deploy/chassis.env.example` deja deliberadamente vacíos los valores obligatorios. No introducir claves en ese ejemplo, en el repositorio, en buildargs, en URLs ni en argumentos de CLI. Los archivos privados externos deben pertenecer al UID1000 y tener permisos0600/0400; no se reparan permisos de material existente durante el arranque. La CA es pública y se monta en nginx; la clave TLS solo corresponde a la API.

Solo el frontend publica el puerto3000. La terminación TLS del acceso público y el proveedor de identidad deben configurarse y verificarse en el despliegue real. Gateway y worker comparten la red interna de la API; el gateway escucha en loopback. Ninguno recibe el volumen de estado. La configuración no incorpora un nodo de IA ni prueba su capacidad: readiness informa de capacidades no verificadas o ausentes.

## Copia en frío

1. El responsable autoriza una ventana y detiene el escritor con el procedimiento de su instalación. Esta implementación no detiene servicios del operador.
2. Verificar que se conserva la imagen exacta y su identidad de release. El archivo para `chassis-state` contiene exclusivamente `state_schema`, `sources`, `runtime_lock_sha256` e `images`, conforme a `ReleaseIdentity`; no pasar directamente el manifiesto completo de build.
3. Ejecutar `chassis-state backup --state-root <raíz absoluta> --destination <destino nuevo privado> --release <identidad.json>` dentro de la imagen correspondiente, con red deshabilitada y los mounts mínimos. El bloqueo debe estar libre. Un destino existente nunca se sobrescribe.
4. Un backup válido tiene manifiesto cerrado, clasificación restricted, inventario completo, tamaños y SHA256 de cada archivo e integridad SQLite verificada. `.incomplete` significa copia no publicada. Conservar una copia fuera del equipo siguiendo la política del propietario; esta entrega no programa ni aplica retención.

Si SQLite conserva un journal caliente tras un fallo, el arranque normal recupera la transacción con el bloqueo obtenido. Una copia que no puede abrir o validar el estado falla cerrada; no se suprimen journals para forzarla.

## Restauración y vuelta al servicio

1. Conservar el volumen original y su imagen; preparar un destino nuevo privado. No restaurar sobre la raíz original, ni dentro de raw.
2. Ejecutar `chassis-state restore --source <backup> --destination <raíz nueva> --release <identidad.json>` en la imagen exacta. Esta primera versión exige igualdad de identidad; una actualización necesita un procedimiento de migración distinto.
3. Verificar el resultado `restored_not_activated`. La restauración no arranca servicios ni cambia el volumen del despliegue. Los trabajos interrumpidos se cierran, las delegaciones y leases anteriores no dan autorización, y se respeta el plazo de las reservas de modelo conservadas.
4. El responsable revisa la copia y decide si conecta una única instancia al nuevo volumen. Antes de admitir trabajo, comprobar TLS, readiness privada, identidad, aislamiento de equipos y permisos humanos. Las recomendaciones necesitan su propia evidencia y aprobación del Crew Chief humano o sustituto designado.
5. Para rollback, preparar el cambio de referencia a la imagen/volumen anterior dentro de otra ventana controlada. No conectar simultáneamente dos escritores al mismo volumen. Este documento prepara esa operación; no la ejecuta.

## Límites de evidencia

Las pruebas usan identidad, claves y telemetría sintéticas claramente identificadas. No acreditan RLS de InsForge real, disponibilidad de IA local, precisión externa de2D, AiM nativo en Windows ni validación metrológica del banco. Tampoco establecen SLA, RPO o RTO comerciales. Los tiempos de recuperación deben medirse sobre el volumen y la infraestructura de cada instalación antes de contratarlos.

Actualización del27 de octubre: un ensayo adicional sí utiliza sesiones, RLS y autoridad reales de preproducción, más Ollama local existente; pasan69 comprobaciones con dos equipos. Su alcance está en [aceptación autenticada](chassis-preproduction-identity-acceptance-2026-10-27.md). La telemetría sigue siendo sintética y la aplicación se ejecutó localmente. Esto no acredita la cadena desplegada completa ni modifica los límites físicos, metrológicos o de SLA anteriores.

## Autoridad después de restaurar

Los runs copiados, incluidos los sellados, conservan su historial pero no pueden reclamar síntesis ni publicar de nuevo. Con el servicio conectado al proveedor configurado, un usuario autorizado del equipo debe reconciliar la sesión mediante el flujo existente (`POST /api/v1/engineering/sessions/{id}/runs/reconcile`) antes de crear un snapshot y análisis nuevos. La API lee la generación de la autoridad y verifica nuevamente el estado local; no inventa una generación ni escribe en cloud durante la restauración. Si la autoridad no está disponible o existe trabajo activo, no se fuerza la reconciliación.

El tiempo máximo configurado de mantenimiento no interrumpe necesariamente cada copia, hash o comprobación SQLite. Medir la ventana real antes de contratar un RTO. Si el primer arranque se interrumpe antes de publicar el marcador de formato, conservar el volumen para diagnóstico; no borrar sus archivos para reintentar.
