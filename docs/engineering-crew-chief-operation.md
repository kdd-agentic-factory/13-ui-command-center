# Operación local del Session Crew Chief

Estado al 26-10-2026: integración HTTP y decisiones con PostgreSQL efímero verificadas mediante datos sintéticos. Ollama qwen3:0.6b completa las cuatro inferencias en frío dentro de los plazos, pero la aceptación completa sigue pendiente: tres tareas succeeded y mechanical-check blocked_missing_inputs por additional_evidence; Crew Chief succeeded. No se elimina ese bloqueo ni se declara suficiencia física. La instancia principal conserva su grabación real 2D experimental y no tiene autoridad humana autenticada ni activación cloud. El explainer conserva qwen3:4b.

## Arranque

Desde `18-telemetry-dataset`, en tres terminales independientes:

```powershell
./scripts/start_engineering_local.ps1 -Component backend -ModelName qwen3:0.6b -SkipModelStartup
./scripts/start_engineering_local.ps1 -Component gateway
./scripts/start_engineering_local.ps1 -Component worker -WorkerId worker-a
```

El backend escucha en `http://127.0.0.1:8180`, gateway en `http://127.0.0.1:8010`, Vite en `http://127.0.0.1:5173/pit-wall/` y Ollama en `http://127.0.0.1:11434`. `-SkipModelStartup` evita iniciar o calentar Ollama; no simula disponibilidad. Sin ese switch se reutiliza el arranque del explainer 4B existente. `-ModelName` selecciona explícitamente el modelo de ingeniería ya instalado: admite qwen3:4b (default conservado) y qwen3:0.6b. El ejemplo operativo local usa 0.6B sin modificar el explainer. Mantener `OLLAMA_NO_CLOUD=1` en su proceso. La versión verificada fue 0.40.6; metadata de inferencia no acredita pin de digest.

La optimización del 26-10 conserva el contrato público Analysis: sólo el transporte interno a Ollama usa referencias cortas por petición, expandidas a las tuplas exactas de evidencia/medida/unidad antes de validar esquema y permiso de snapshot. No reduce campos físicos, revisores, cuotas ni deadlines. Identificadores desconocidos, mixtos o ambiguos se rechazan; missing_inputs y limitaciones se conservan. El test en frío terminó en 66,83 s, con tareas de modelo entre 9,152 y 12,149 s, y falló su aserción de cuatro succeeded porque mecánica solicitó evidencia adicional. Un intento acotado 4B con el mismo codec agotó los 27 s; no se hicieron más ajustes ni inferencias exploratorias.

El script lee sólo dentro del proceso cuatro archivos fuera del repositorio, por defecto bajo `%USERPROFILE%/.codex/secrets`: `kdd-engineering-grants-dev.key` (firma binaria), `kdd-engineering-control-dev.key` (capacidad de control), `kdd-engineering-gateway-dev.key` (primer salto) y `kdd-engineering-backend-dev.key` (segundo salto). Restringir sus ACL al usuario operativo. No copiar valores a argumentos, logs, documentación o Git. Si falta un archivo, el arranque de ingeniería falla explícitamente. `-SecretsDirectory` permite otra ubicación protegida.

Los tres servicios comparten `18-telemetry-dataset/data/chassis.sqlite`; no confundirla con las bases temporales de QA. El worker usa identidad de servicio y grants de alcance limitado. Un único worker local limita la cola del modelo CPU. Su polling es 5 s y el backend local usa un presupuesto de 1000 solicitudes/minuto: el anterior valor por defecto de 60 quedaba consumido por claim + claim_synthesis y producía 429 al navegador. Los valores generales de producción no cambian.

Antes de reiniciar, consultar listener, PID, executable y command line; detener únicamente el proceso cuya propiedad y propósito se hayan verificado. No matar un ocupante desconocido del puerto. Conservar los datos y las claves al cerrar. Los procesos lanzados desde terminal admiten Ctrl+C; para un árbol de QA propio en Windows, usar el PID devuelto por ese lanzamiento y su cierre de árbol.

## Salud y comportamiento sin dependencias

### Equipo autenticado y autoridad remota (preparado, sin activar)

La aplicación tiene una fábrica de autoridad por instancia; su valor por defecto es `TDS_ENGINEERING_AUTHORITY_MODE=disabled`. Autenticar la identidad por sí solo no habilita decisiones remotas. La configuración explícita admite únicamente `disabled` o `insforge`; en este último modo exige:

- `TDS_IDENTITY_MODE=authenticated`, `TDS_IDENTITY_URL` y `TDS_IDENTITY_ANON_KEY` del emisor configurado.
- `TDS_ENGINEERING_AUTHORITY_URL` con el mismo origen HTTPS que identidad, sin usuario, contraseña, ruta adicional, query ni fragmento.
- `TDS_ENGINEERING_AUTHORITY_SERVICE_KEY_FILE` como ruta absoluta de archivo externo al checkout. El contenido es una credencial exclusivamente del backend18; nunca incluirlo en argumentos, logs, frontend,01/02 o prompts.

En Windows el archivo debe tener ACL protegida, sin permisos Allow para identidades distintas del usuario operativo, SYSTEM o Administradores. En POSIX debe pertenecer al usuario del proceso y no conceder permisos al grupo ni a otros. El arranque rechaza archivo ausente, vacío, demasiado grande, de enlace simbólico, dentro del checkout o sin protección; el error no muestra contenido ni ruta. No se consulta la red al construir la fábrica. Configuración habilitada inválida aborta el arranque; no vuelve a modo local ni a una autoridad permisiva. `disabled` no lee el archivo.

La autoridad se enlaza al contexto de cada petición, incluidas las rutas de servicio y su trabajo en threadpool. Dos aplicaciones dentro del mismo proceso no comparten adaptador. Las llamadas humanas siguen exigiendo bearer verificado, membresía y designación vigentes; la credencial servidor sólo sirve para las RPC privilegiadas de fences, elegibilidad y recuperación. Fuera de una petición enlazada, la autoridad permanece deshabilitada. Esto no añade un job de fondo ni autentica a un agente como humano.

El launcher `start_engineering_local.ps1` conserva el modo local; esta sección no lo convierte en un launcher de producción ni activa autoridad. Antes de habilitar otro proceso hacen falta, de forma separada: autorización explícita para el entorno cloud elegido; verificar/aplicar migraciones012+013 y sus permisos reales; cuentas y membresías activas; designación administrativa de titular/sustituto; credenciales protegidas y una prueba autenticada de concurrencia/revocación en ese entorno. Las pruebas locales con HTTP controlado no acreditan esos requisitos. No se han aplicado migraciones cloud ni creado cuentas o designaciones reales como parte de este cierre de wiring. Tampoco acredita aislamiento de dos bases SQLite distintas: la ruta actual de almacenamiento sigue siendo configuración de proceso.

```powershell
Invoke-RestMethod http://127.0.0.1:8180/api/v1/health
Invoke-RestMethod http://127.0.0.1:8180/api/v1/engineering/sessions
```

La salud HTTP no certifica el modelo, permisos humanos o ciencia. Sin modelo, las tareas quedan unavailable; sin entradas quedan blocked_missing_inputs. Sin control/grants válidos, los endpoints internos deniegan el acceso. En identidad local se puede preparar contexto y ejecutar análisis autorizado local, pero no aprobar como un humano autenticado. Una aprobación requiere membresía, designación y autoridad transaccional vigentes; los cambios de contexto invalidan la propuesta anterior.

Para iniciar sólo el backend sin exigir archivos de ingeniería, usar `scripts/start_chassis_backend.ps1 -IdentityMode local -Port 8181 -SkipModelStartup` en un entorno aislado con `TDS_CHASSIS_DB` y `TDS_RECORDED_DIR` temporales. No apuntarlo a la base principal para pruebas positivas. Los smokes de wheel realizan esta comprobación de aplicación sin proveedores configurados y verifican las denegaciones.

## Validación histórica y recuperación de inicios

En «Análisis y decisión», «Validar una aplicación persistida» permite seleccionar aplicaciones de toda la sesión cargadas en el historial, incluso después de guardar otro contexto o generar otra propuesta. «Cargar más eventos» amplía la selección. La UI resuelve la propuesta y revisión inmutables del evento elegido, consulta la designación vigente y exige evidencia de la misma sesión posterior al montaje. El servidor verifica también ownership, IDs de evidencia y fecha. Esta acción registra una validación; no reactiva una aprobación ni autoriza otro montaje.

Si un inicio pierde la respuesta, «Recuperar inicio pendiente» conserva el mismo cuerpo, snapshot y operaciones mientras la vista los mantiene. Después de recargar o navegar, usar «Reconciliar inicios persistidos»: envía `POST /api/v1/engineering/sessions/{id}/runs/reconcile` con `{}` mediante la identidad humana autenticada existente. El servidor reconcilia sus intents persistidos; la UI recarga ejecución y contexto antes de permitir otro inicio. Cada inicio autenticado nuevo comprueba además esta reconciliación antes de crear snapshot. Si la autoridad no responde, hay conflicto o falla la recarga, se mantiene el bloqueo y se puede reintentar el mismo procedimiento. Un409 no prueba reconciliación y no se borran intents desde la UI. Una carrera que revele otra ejecución en curso no crea otro snapshot.

## Contexto técnico de revisión

Las versiones correspondientes de01/02/18 deben actualizarse juntas: el contrato cerrado de herramientas pasa a versión2 en el registro, manteniendo el envelope1 y los snapshots existentes. `engineering.read_snapshot` añade `technical_context` exclusivamente desde el manifiesto congelado: revisiones, ventanas en segundos, calibración tipada y curvas completas en SI con measured/referencia/límites. No contiene identidad, notas privadas, GPS ni muestras. Cada curva admite hasta64puntos y la proyección completa hasta8192bytes; no se redondea ni remuestrea para ajustarla. Una curva seleccionada que exceda el límite o una proyección no representable declara cobertura parcial/ausente y sus causas.01 queda blocked_missing_inputs antes de inferir si esa cobertura falta. Si los hechos completos no caben en el límite de prompt16000, declara `technical_context_prompt_limit`; las cuotas y deadlines siguen iguales. Un campo nulo significa contexto no seleccionado, nunca una medida validada.

## Reproducción de QA aislado

Requiere las dependencias declaradas de 01/02/18, Docker con PostgreSQL16 local y Playwright de 13. Los tests no ejecutan migraciones cloud. El PostgreSQL de QA se crea con red deshabilitada; el adaptador RPC de autoridad es controlado y ejecuta SQL real dentro de ese contenedor. El trayecto worker01→gateway02→backend18 usa HTTP y procesos reales.

```powershell
# En 18
.venv/Scripts/python.exe -m pytest tests/test_engineering_integration.py -q
.venv/Scripts/python.exe -m tests.engineering_browser_fixture --manifest ../13-ui-command-center/.superpowers/sdd/2026-10-25-session-crew-chief-dual-analysis/task-11-browser-fixture.json
# En otra terminal, dentro de 13
npx playwright test tests/e2e/engineering-crew-chief.spec.ts --reporter=list
```

El host `tests/e2e/engineering-harness.html` monta componentes y proveedores reales, usa una identidad sintética explícita y redirige sus llamadas sólo al backend loopback aislado del manifiesto. No representa una autenticación cloud real. Su título advierte QA SINTÉTICA AISLADA. El recorrido guarda contexto, asocia A/B persistidos creados por HTTP, ejecuta ambas ramas, aprueba mediante SQL, descarga el informe y verifica invalidación por cambio. Casos HTTP separados cubren modelo ausente, fuente2D experimental, contraste fallido y revocación de membresía.

Crear `task-11-browser-fixture.stop` junto al manifiesto para cerrar el stack y eliminar sólo su contenedor propio. Antes de otro lanzamiento, retirar únicamente ese marcador de parada conocido; el nuevo manifiesto contendrá otro puerto e IDs. Nunca usar este host con usuarios o bases reales.

Para el smoke explícito de Ollama sin fallback:

```powershell
$env:KDD_REAL_OLLAMA_SMOKE='1'
$env:KDD_REAL_OLLAMA_MODEL='qwen3:0.6b'
.venv/Scripts/python.exe -m pytest tests/test_engineering_integration.py -k real-ollama -q -s
Remove-Item Env:KDD_REAL_OLLAMA_SMOKE
Remove-Item Env:KDD_REAL_OLLAMA_MODEL
```

El resultado actual con 0.6B falla la aceptación por el bloqueo de mecánica descrito arriba. El intento histórico del 25-10 con 4B agotó plazos. No aumentar silenciosamente deadlines. Crew Chief devuelve como máximo un candidato prioritario; la limitación `priority_selection_not_exhaustive` es explícita. El catálogo, gates, referencias y matriz persistidos conservan los candidatos y evidencia; la proyección del prompt elimina duplicación de contenido, no las restricciones. Esto no acredita cobertura exhaustiva de recomendaciones.

## Evidencia y límites

Expediente: `13-ui-command-center/.superpowers/sdd/2026-10-25-session-crew-chief-dual-analysis/task-11-report.md`, con comandos, salidas, hashes del freeze, capturas y gates. No hay commits por autorización del usuario. Las bases y propuestas de QA son desechables.

Faltan referencia independiente 2D Analyzer, geometría medida y validación física, despliegue/migraciones/cuentas/designaciones cloud reales y capacidades de los dominios declarados no disponibles. No interpretar una propuesta sintética o un gate técnico como validación de seguridad física, ganancia de tiempo o producto comercial listo. El informe completo distingue propuestas del agente, decisión humana, aplicación y validación.


### Historial del intento del 25-10 (superado por instalación del 26-10)

El intento del 25-10 de [qwen3:0.6b oficial](https://ollama.com/library/qwen3:0.6b) quedó en 0 bytes por timeout TCP y se canceló. El 26-10 la descarga oficial se completó y el modelo se midió realmente. La selección local explícita de 0.6B está autorizada para operar mostrando sus bloqueos; no equivale a aceptación completa. Evidencia y hashes: `.superpowers/acceptance/2026-10-26-local-ai-2d/local-ai-runtime-report.md`. El test conserva su default 4B y exige cuatro tareas succeeded; no se ha relajado esa aserción.
