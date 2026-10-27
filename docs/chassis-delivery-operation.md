# Aceptación coordinada de Chassis

La aceptación local usa los cuatro servicios construidos desde el mismo conjunto de fuentes y dependencias bloqueadas. Un ensayo sintético no autoriza despliegue ni acredita mediciones de adquisición.

## Entradas

- Manifiesto del resolvedor con los cinco repositorios, huellas y bases fijadas.
- Ruedas y paquetes del sistema públicos con hashes; ninguna dependencia se instala en el host.
- Configuración pública del frontend: destino declarado, origen HTTPS de identidad y clave anónima. Nunca una clave administrativa.
- Certificado y clave TLS exclusivos del ensayo, fuera de Git. En Linux la clave debe pertenecer al UID1000 y tener modo0400.
- Imagen QA del navegador construida con `tests/delivery/Dockerfile.browser`; pasar su ID sha256 inmutable.

## Secuencia

1. Ejecutar `scripts/resolve-chassis-release.py` y `scripts/build-chassis-images.py` con los inputs bloqueados. El frontend del ensayo usa `isolated-fixture`; para otro destino se necesita otra construcción y otra aceptación.
2. Descargar por separado la base pública del scanner fijado. Ejecutar `scripts/scan-chassis-images.py` con los cuatro IDs y esa base. Comprueba archivo de imagen, digest de configuración, frescura y HIGH/CRITICAL; un error bloquea.
3. Combinar manifiesto e IDs en la entrada del runner. Ejecutar `tests/delivery/run_stack.py` con `--release`, `--output` nuevo, `--fixture-tls`, `--browser-image-id`, `--engineering-fixture` y `--scan-report` del escaneo exacto. Se vuelven a comprobar los hashes de los archivos de imagen y los hallazgos originales. `--browser-smoke-only` sirve para depurar HTTP y no supera la aceptación autenticada.
4. Consultar cada gate en `result.json`, no sólo el código de salida del navegador. El runner crea únicamente recursos UUID de su propiedad: red sin salida, un volumen de prueba y contenedores aislados; no publica puertos ni monta Docker socket. La SQL de autoridad se aplica sólo a PostgreSQL efímero local.
5. La autoridad de prueba usa los contratos SQL congelados y comprobados por SHA. El modelo HTTP entrega respuestas controladas identificadas como sintéticas. La firma UI se contrasta con los actores humanos designados en SQL; no representa la aceptación personal de operadores reales.
6. Conservar informes y huellas. No subir claves, cookies, estado, grabaciones ni catálogos. El workflow manual conserva solamente los informes públicos expresamente enumerados.

El runner exige recuperación HTTP de un trabajo interrumpido: backup frío, restauración a destino nuevo, rechazo de grants/leases antiguos, bloqueo de propuestas restauradas y conservación de la reserva de inferencia hasta su expiración. Sólo una reconciliación humana explícita permite crear un análisis nuevo. Los recibos históricos se conservan; no autorizan acciones nuevas.

La aceptación incluye cambio de equipo durante una comprobación de identidad retenida, modos de identidad inválidos, caída HTTP503 del emisor desde una sesión autenticada y rechazo de una CA incorrecta por nginx. Son fallos controlados del entorno aislado. No prueban la disponibilidad del proveedor externo. En Linux, ejecutar además `tests/delivery/check_fixture_permissions.py` con el ID inmutable de API: los grupos suplementarios se limitan a las rutas temporales del ensayo. El archivo privado de transferencia de recuperación sólo se monta en su contenedor de recuperación.

Un `status: passed` tiene alcance `isolated_fixture_acceptance`, `fixture_only: true` y `publishable: false`. No cambia los bloqueos separados de IA real, proveedor externo ni referencias AiM/2D. El manifiesto comercial sigue siendo candidato hasta la aceptación de su destino.

## Límites actuales

El candidato permanece bloqueado mientras falte cualquier gate requerido. La recuperación instalada comprueba fencing de trabajos/leases y cuarentena; el recorrido HTTP integral de un trabajo pendiente restaurado tiene aceptación separada. La evidencia de preproducción real y Ollama local tampoco transforma el modelo controlado del ensayo en IA real.

La limpieza usa sólo los handles UUID creados por el runner, con presupuesto independiente del ensayo. Un fallo de limpieza se registra como bloqueo. No eliminar recursos del operador para repetir una prueba.

Las fuentes con cambios locales son válidas únicamente para diagnóstico local. La promoción exige fuentes limpias, identidad exacta y aceptación del destino real. Esta fase no ejecuta workflows remotos, push de imágenes ni despliegue.

## Conexiones del destino real

Compose exige ahora autoridad InsForge, clave de servicio mediante archivo privado montado sólo en API, bundle de confianza explícito de identidad y nombre/URL del modelo local. Evita arrancar un paquete comercial con autoridad deshabilitada por omisión. `AUTHORITY_URL` debe ser HTTPS y corresponder al proveedor autorizado. El bundle se utiliza también para la autoridad; no desactiva TLS.

El modelo debe existir y ser accesible desde la red privada del contenedor API. `localhost` dentro del contenedor no identifica Ollama del host. No hay descarga, instalación ni apertura de puertos de modelos automática. Un digest opcional fija el modelo observado; verificar esa identidad y su aceptación antes de promover. La configuración sólo prepara los mounts y variables: el ensayo con emisor/modelo controlados no acredita por sí mismo la conexión operativa real.
