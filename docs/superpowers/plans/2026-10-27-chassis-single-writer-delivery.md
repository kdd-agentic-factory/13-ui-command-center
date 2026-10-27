# Chassis1B Single-Writer Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preparar una entrega Chassis reproducible con una instancia escritora, persistencia explícita, disponibilidad verificable y recuperación probada sin activar producción.

**Architecture:** Solo18 escribe el estado de negocio. El worker01 conserva su CLI y pasa por un gateway02 privado que expone únicamente contratos engineering; ninguno monta el volumen de datos.13 es el único acceso humano. Mantenimiento y API comparten exclusión de OS; las copias se realizan con API detenida y se restauran a un destino nuevo.

**Tech Stack:** Python3.12, FastAPI/Uvicorn, SQLite, pathlib/contextvars, locks fcntl/msvcrt, TLS, Docker/Compose, Vite/React, pytest, Playwright1.61.1 instalado en13, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-26-chassis-single-writer-delivery-design.md`, aprobado por el usuario el2026-10-27.

## Global Constraints

- «Preservar checkouts y evidencia previa sin commits, limpieza ni modificación de raw». Método conservado: ejecución inline en esta sesión, una revisión final independiente. No commits/push ni limpieza automática.
- «Primera versión: copia en frío, con la instalación detenida y exclusión de mantenimiento adquirida». Los comandos no detienen servicios del operador.
- «Restaurar únicamente a un directorio nuevo y vacío fuera del estado actual». Concretado: el destino no debe existir; se crea de forma exclusiva y no se cambia el volumen activo.
- «No se autoriza compartir SQLite en NFS/SMB entre hosts». Un API escritor, workers sin volumen; no migrar negocio a PostgreSQL ni habilitar réplicas.
- «La conexión proxy→API conserva HTTPS verificado». No desactivar validación de CA, permisos, aislamiento, autoridad ni aprobación humana para pasar tests.
- No desplegar, aplicar migraciones cloud, modificar credenciales/usuarios reales, instalar en el host, crear automatizaciones reales ni acceder a datos del operador. Leer AGENTS y data-governance18 antes de cualquier fixture/data operation; usar datos sintéticos privados.
- Autorización de recursos que se solicita con este plan: descargar bases oficiales, ruedas de PyPI, paquetes npm y runtime de navegador/escáner exclusivamente para construir/verificar contenedores aislados. Sin instalación en el host ni acceso al proveedor real. No imprimir secretos ni enviar fuentes/datos a servicios externos. Se resuelven y registran versiones/digests antes de ejecutar el objetivo; no usar latest ni sustituir la imagen de release por otra cacheada.
- Si no se aprueba o no existe el recurso necesario: salida blocked, no passed. Preparación offline sigue siendo útil. Proveedor/RLS real, metrología2D, banco externo y nodo Windows AiM no quedan certificados por1B.

## Inventario y decisiones ya cerradas

Abreviaturas relativas al padre de13:01=`01-agent-orchestrator`,02=`02-mcp-gateway`,17=`17-digital-twin-simulation-lab`,18=`18-telemetry-dataset`. Los Files de tareas usan esos prefijos;13 es el repositorio del plan.

Estado comercial canónico, todos dentro de `TDS_STATE_ROOT` absoluto:

| Ruta | Responsable | Contenido |
|---|---|---|
|recorded/<UUID>.json|18 routers/recorded + recorded_persistence|Canales, tiempos, ownership y geometría asociados a cada grabación|
|recorded/catalog.sqlite|18 recorded_catalog|Índice recuperable de grabaciones; se incluye en copia coherente|
|chassis.sqlite|18 chassis/store y engineering/store|Chassis, taller, catálogos de sesión, snapshots, runs, decisiones y su auditoría local|
|suspension-lab.sqlite|18 chassis/suspension_lab/store|Originales BLOB, derivados e índices inmutables de banco|
|domain-evidence.sqlite|18 chassis/domain_evidence/store|Originales y revisiones privadas de dominio|
|chassis.pre-team.sqlite; chassis.pre-engineering.sqlite|18 migraciones existentes|Archivos históricos opcionales, privados; se inventarían y conservan sin modificarlos|

La carpeta raíz contiene además `.installation.lock`, metadatos de formato y control de restauración; no se respaldan locks, temporales ni probes. Un archivo no clasificado provoca fallo explícito del mantenimiento. No incluir data/raw, catálogo legacy YAML, certificados, claves de firma/control, tokens, logs de contenedor ni backups externos en el backup de negocio. Estos recursos requieren procedimientos separados, no se afirman restaurados. Laboratorio/dominio pueden estar vacíos; ausencia se distingue de corrupción. Se registra un marcador de formato1.0 al inicializar un volumen nuevo, no por un GET de salud.

Entrypoints comprobados:18 `telemetry_dataset.main:main`;01 `python -m orchestrator.engineering.worker` (renueva leases cada15s, poll2s);02 servidor engineering actual por `EngineeringMCP` y `routers.tools`. El worker no se incrusta en FastAPI ni se reemplaza por una cola local. Gateway privado escucha solo loopback en namespace compartido con API y worker; worker→gateway usa HTTP loopback permitido por su contrato, gateway→API usa HTTPS con CA explícita. En producción solo13 publica puerto; en aceptación todos comparten namespace de red none. Se conservan rutas internas fuera de BFF1A.

Comandos de Python: desde18 usar .venv/Scripts/python.exe; desde13 usar ../18-telemetry-dataset/.venv/Scripts/python.exe. Desde01/02 usar su venv existente o el18 ya compatible con los tests cross-repo; no instalar faltantes en host.

El gateway completo existente carga herramientas históricas y su auditoría persistente genérica puede degradar a memoria. Este plan no lo publica ni certifica su corrección global: crea una entrada privada engineering-only reutilizando validación, permisos y auditoría redacted existentes. La auditoría de negocio18 se recupera; los logs operativos de02 se envían a stdout redacted y al logging acotado del despliegue, separados del backup. Auditoría remota/retención y autoridades legacy continúan como gates explícitos de revisión comercial, nunca como garantías nuevas de1B.

## Review Focus

1. Dos app factories con settings distintos, threadpool y variables heredadas conflictivas: ninguna usa el volumen de la otra ni cae a rutas de desarrollo; Task1.
2. Crash del API, PID reutilizado, worker vivo y mantenimiento concurrente: lock real evita segunda instalación y copia activa sin bloquear workers HTTP legítimos; Task2/8.
3. Backup parcialmente escrito, rutas con traversal/junction/symlink y origen que cambia durante verificación: nunca sobrescribir ni activar estado inválido; Task3/4.
4. Restauración con grant, lease, propuesta y reserva de modelo aún vigentes: no reemitir acciones ni liberar ficticiamente cómputo remoto; Task4/9.
5. Health200 con volumen readonly, modelo ausente, autoridad no comprobada o CA incorrecta: exponer capacidades reales y no certificar una release operativa; Task5/9.

### Task 1: Layout persistente ligado al runtime real

**Files:** Create18/src/telemetry_dataset/operations/{__init__.py,state.py}; Create18/tests/delivery/{conftest.py,test_state_layout.py}; Modify18/src/telemetry_dataset/{config.py,main.py,recorded_catalog.py}, routers/recorded.py, chassis/store.py, chassis/suspension_lab/store.py, chassis/domain_evidence/store.py.

**Interfaces:** `StateLayout(root:Path, recorded:Path, recorded_catalog:Path, chassis_db:Path, suspension_db:Path, domain_db:Path)` frozen; `resolve_layout(settings:Settings,environ:Mapping[str,str])->StateLayout|None`; `bind_layout(layout:StateLayout)` contextmanager; `current_layout()->StateLayout|None`; `inventory(layout:StateLayout)->tuple[StoreSpec,...]`, StoreSpec(name,relative_path,kind,required). None conserva explícitamente desarrollo; comercial sin layout enlazado falla.

- [ ] Crear fixture factory `commercial_settings(root)` en tests/delivery/conftest.py: Settings sin dotenv, identidad HTTPS sintética, raíz propia y claves de control generadas en tmp privado; no proveedor real. Añadir test `test_factory_layout_isolated_from_module_singleton`: dos apps sobre raícesA/B, escrituras y lecturas concurrentes/threadpool no cruzan archivos. Parametrizar alias TDS_RECORDED_DIR/TDS_CHASSIS_DB/TDS_SUSPENSION_LAB_DB/TDS_DOMAIN_EVIDENCE_DB y data_root explícito incoherentes, relativo, symlink y raíz raw: rechazar.
- [ ] Run18 `.venv/Scripts/python.exe -m pytest tests/delivery/test_state_layout.py -q`. Expected RED por módulo/contrato ausente.
- [ ] Implementar state.py y `state_root:Path|None` en Settings. Un middleware ASGI enlaza layout desde app.state para cada petición y restaura ContextVar en finally; lifespan/CLI enlazan explícitamente. Adaptar todos los consumidores inventariados, no solo directorio recorded. No cambiar rutas de desarrollo ni usar ContextVar del lifespan como si llegara automáticamente a requests.
- [ ] Repetir comando y tests/test_runtime_config.py/tests/test_geometry_storage.py. Expected GREEN; layout estable y archivos solo en raíz autorizada. Registrar baseline/huellas, sin commit.

### Task 2: Exclusión de instalación y lifecycle

**Files:** Create18/src/telemetry_dataset/operations/exclusive.py y bootstrap.py; Modify18/src/telemetry_dataset/main.py y18/src/telemetry_dataset/config.py; Test18/tests/delivery/test_installation_lock.py.

**Interfaces:** `InstallationLease(layout:StateLayout,purpose:Literal['serve','maintenance'])` contextmanager no bloqueante; `initialize_state(layout:StateLayout)->None`; lease vive todo el lifespan, no en import. Mutex exclusivo de fichero con fcntl.flock en POSIX y msvcrt.locking en Windows; handle no heredado por subprocesses externos. Metadata PID no es autoridad.

- [ ] Test con dos procesos: mientras A sirve, B y mantenimiento fallan; tras terminar A/crash, B obtiene lock aunque exista fichero. El worker sin acceso al volumen puede seguir solicitando MCP a A. Volumen readonly, lock path sustituido por enlace y fallo tras adquirir lease liberan correctamente. Código de proceso controlado se ejecuta oculto en Windows.
- [ ] Run `pytest tests/delivery/test_installation_lock.py -q` usando Python venv18. Expected RED.
- [ ] Implementar inicialización una vez bajo lease, formato1.0 y schemas de stores; no escanear/migrar catálogo legacy privado. Startup comercial exige volumen válido y1worker Uvicorn sin reload; ausencia de stores opcionales se inicializa explícitamente. Lecturas readiness no inicializan stores. El API mantiene lease;01/02 no lo adquieren ni montan datos.
- [ ] Repetir tests y tests/test_engineering_run_recovery.py. Expected GREEN, cierre de lifespan y excepciones liberan exclusión. Registrar rutas/estado sin secretos.

### Task 3: Copia en frío y manifiesto privado

**Files:** Create18/src/telemetry_dataset/operations/{manifest.py,backup.py,cli.py,schemas/backup-manifest-1.0.json}; Modify18/pyproject.toml (package-data/CLI) y schema-version.yaml (registro nuevo, incremento minor compatible7.3.0→7.4.0 si no cambia antes); Test18/tests/delivery/test_backup.py.

**Interfaces:** `BackupLimits(max_bytes:int=53687091200,max_files:int=500000,max_manifest_bytes:int=10485760)`; `create_backup(layout:StateLayout,destination:Path,*,release:ReleaseIdentity,limits:BackupLimits)->BackupManifest`; `verify_backup(source:Path,*,limits:BackupLimits)->BackupManifest`. ReleaseIdentity se define en manifest.py con formato1.0, state_schema, sources y runtime_lock_sha256; las sources tienen git_ref/tree_sha256/dirty. Task7 completa sus valores reales y una sección de imágenes. Fixtures usan identidades de control marcadas, nunca promocionables. BackupManifest1.0 contiene stores, paths relativos, longitudes y SHA256; nunca secretos o muestra de datos.

- [ ] Crear fixture privada con4SQLite válidos (incluido recorded/catalog), dos grabaciones y opcionales legacy. `test_cold_backup_complete_and_hashes`: manifiesto cubre cada recurso; permisos privados; no raw ni claves. Fallos: lease activo, destino dentro de origen/ya existente, desconocidos, enlaces, límite excedido y error de copia a mitad: no backup marcado completo.
- [ ] Run `pytest tests/delivery/test_backup.py -q`. Expected RED.
- [ ] Implementar creación bajo lease maintenance; SQLite backup con origen readonly e integrity_check, copia de archivos sin seguir enlaces y comprobación de identidad/tamaño del origen. Staging privado y publicación final solo después de fsync/validación, sin overwrite. No copiar WAL/SHM como si fueran bases; registrar checkpoints/ausencias opcionales de forma explícita. CLI `main()->int`, con guard de módulo y sin importar la app del operador: `python -m telemetry_dataset.operations.cli backup --state-root ... --destination ... --release ...`; códigos0éxito,2bloqueo/precondición,1fallo.
- [ ] GREEN mismo comando y control de destino parcial. El manifiesto acredita integridad, no autenticidad de un backup de origen arbitrario: entrada privada del operador, nunca upload HTTP. Registrar sin contenidos y sin borrar staging/evidencia ajena.

### Task 4: Restauración nueva y fencing de trabajo pendiente

**Files:** Create18/src/telemetry_dataset/operations/restore.py; Modify18/src/telemetry_dataset/operations/cli.py, bootstrap.py y 18/src/telemetry_dataset/chassis/engineering/runs.py; Test18/tests/delivery/test_restore.py.

**Interfaces:** `restore_backup(source:Path,destination:Path,*,release:ReleaseIdentity,limits:BackupLimits)->RestoreReport`; `invalidate_restored_work(layout:StateLayout,*,restored_at:float)->RecoveryReport`. Reporte sin datos: conteos, hashes, duración, quarantine_until. CLI restore usa los mismos códigos de Task3 y no cambia mounts/config activa.

- [ ] Test `test_restore_retains_terminal_history_but_fences_active_work`: fixture running run, pending start, lease, grant y model slot con deadline futuro; al restaurar quedan estado failed/cause restored_state, starts superseded y sin leases reutilizables; ninguna llamada a autoridad/inferencia y ningún permiso físico nuevo. Resultados terminales y propiedad permanecen. Una reserva de cómputo aún vigente NO se borra por suponer cancelación remota: conserva su plazo/quarantine y bloquea nueva reserva hasta vencimiento.
- [ ] Parametrizar manifiesto alterado, traversal, path absoluto/UNC, enlaces/junctions, origen cambiado tras verificar, esquemas futuros/incompatibles, SQLite corrupto y destino existente. Run `pytest tests/delivery/test_restore.py -q`. Expected RED.
- [ ] Implementar verificación estricta con claves/campos cerrados y límites antes de copiar. Destino se crea exclusivamente; marcador de restauración incompleta impide arrancar hasta finalizar integridad/fencing. No se abre origen activo como destino ni se ejecutan migraciones/downgrade para aceptar un backup desconocido. Añadir invalidación transaccional en RunStore usando tablas existentes y audit; no llamar `_recover()` suponiendo que interrumpe todo ni liberar slots remotos antes de plazo.
- [ ] GREEN tests y tests/test_engineering_run_recovery.py/test_engineering_proposal_authority_protocol.py. Dos equipos conservan aislamiento tras restore; propuestas antiguas requieren verificación vigente y decisión humana explícita. No reconciliar ni reemitir mutaciones cloud al restaurar.

### Task 5: Readiness interna y servidor TLS

**Files:** Create18/src/telemetry_dataset/operations/{readiness.py,server.py}; Modify18/src/telemetry_dataset/config.py, main.py y identity/dependencies.py; Test18/tests/delivery/test_readiness_tls.py; conservar inventario humano1A sin añadir readiness.

**Interfaces:** `check_readiness(app)->ReadinessReport(core_ready:bool,capabilities:dict[str,CapabilityStatus])`; CapabilityStatus enum available/unavailable/unverified. GET `/api/v1/internal/readiness` solo red interna y clave dedicada readonly `operations_probe_key_file` enviada como X-Readiness-Key; no acepta bearer humano, principal de agente ni grants. Rama de middleware exacta GET/path con comparación constante, sin bypass de prefijo y sin modificar engineering_service_route. Sin clave configurada devuelve404 y clave inválida403. Sin información de usuarios/paths/secrets; HTTP200si core_ready y503si no, capacidades independientes nunca equivalen a full acceptance. `serve(settings:Settings)->None` pasa app factory/runtime correcto a Uvicorn con workers1/reloadFalse/TLS explícito; `tls_cert_file`, `tls_key_file` configurados fuera de state.

- [ ] Tests: health200pero volumen readonly→readiness503; probe de1KiB en control privado y eliminado, cero DDL/objetos de negocio; autoridad sin probe seguro→unverified, modelo ausente/digest distinto→unavailable, cero inferencias/decisiones. Token humano/cabeceras de servicio falsas nunca habilitan la ruta; clave de readiness no habilita otra ruta. Timeout de probes3s; diagnóstico genérico. BFF1A rechaza readiness404. TLS: cert/clave ausente o CA incorrecta falla; no fallbackHTTP.
- [ ] Run `pytest tests/delivery/test_readiness_tls.py -q`. Expected RED.
- [ ] Implementar ro queries/schema checks y writer lease vigente. Solo probes no mutadores a destinos configurados; si no hay prueba remota segura, no inventar available. No sustituir autorización al ejecutar acciones por un booleano de salud. Linux sin SDK AiM nativo informa capacidad no disponible; importación tabular no se presenta como SDK nativo. /health conserva liveness.
- [ ] GREEN tests y test_commercial_profile.py/test_production_hardening.py; comprobar que app runtime no se sustituye por singleton al lanzar servidor TLS.

### Task 6: Gateway privado y worker existente

**Files:** Create02/src/mcp_gateway/engineering_app.py y tests/test_engineering_delivery.py; Modify02/src/mcp_gateway/servers/engineering_mcp.py y02/src/mcp_gateway/config.py, crear util TLS específica si hace falta; Modify01/src/orchestrator/config.py y01/src/orchestrator/clients/mcp_client.py solo para lectura de secretos por fichero cuando no exista; Test01/tests/unit/test_engineering_delivery.py. Modify18/src/telemetry_dataset/config.py para clave interna por archivo. No modificar autoridades/governance legacy.

**Interfaces:** `create_engineering_app(config:EngineeringDeliveryConfig)->FastAPI`; registra solo02/contracts/engineering.tools.yaml, EngineeringMCP, ToolExecutionService y routers.tools con autenticación interna existente. EngineeringDeliveryConfig incluye backend HTTPS, backend CAfile y rutas readonly a credenciales. Worker conserva `python -m orchestrator.engineering.worker`, no recibe bearer humano ni state path. En perfil privado, dependency wrapper exige además principal fijo engineering-orchestrator/engineering_service incluso con key correcta; no cambia el authenticator legacy global. Añadir verify SSLContext explícito en02 para CA; trust_env=False no debe ignorar la CA elegida.

- [ ] Tests: solo herramientas registradas engineering visibles; github/filesystem/legacy denegadas; claves faltantes y principal falso no ejecutan; identidad de servicio no confiere firma física. Cero acceso a SQLite/recorded desde01/02. Backend TLS de control: CA válida pasa y otra falla, redirect no seguido. Logs no incluyen grants/capabilities/payloads.
- [ ] Run02 `python -m pytest tests/test_engineering_delivery.py -q` y01 `python -m pytest tests/unit/test_engineering_delivery.py -q` con sus entornos existentes; ausencia runtime→blocked documentado, no instalar en host. Expected RED.
- [ ] Implementar entrypoint mínimo reutilizando registry/permission/audit existentes; no arrancar main gateway completo. Fallo de inicialización no devuelve éxito vacío. Claves solo montadas como archivos privados, no hardcoded ni en argv. Añadir en18 configuración de engineering_internal_api_key_file y resolver con validación privada antes de setup_identity; alias plaintext conservado solo en desarrollo y conflicto de ambos rechazado. En02 usar Settings resuelto desde fichero para dependency get_settings sin mutar singleton global ajeno. Emitir auditoría técnica redacted a stdout además del registro existente; la persistencia remota genérica02 no se declara arreglada ni se usa como autoridad.
- [ ] GREEN tests propios y18/tests/test_engineering_worker_transport.py usando fixtures actuales. Worker renueva15s/poll2s como antes; API mantiene única escritura/leases, humano titular/suplente conserva decisión final.

### Task 7: Entradas reproducibles e imágenes coordinadas

**Files:** Create18/{Dockerfile.chassis,.dockerignore}, requirements/chassis-runtime.in; Create13/deploy/{chassis-release.schema.json,chassis-release.json}; Create13/scripts/{resolve-chassis-release.py,build-chassis-images.py}; Modify13/Dockerfile para bases parametrizadas por lock sin defaults históricos y copies inmutables; Create01/Dockerfile.engineering-worker,02/Dockerfile.engineering; Create13/tests/release/test_release_inputs.py. Mantener Dockerfiles de desarrollo ajenos a esta entrega salvo exclusiones seguras.

**Interfaces:** ReleaseIdentity de Task3 añade `sources:{01,02,13,17,18}->{git_ref,tree_sha256,dirty}`, `platform:'linux/amd64'`, bases con versión/digest real, hashes de locks y paquetes. `resolve-chassis-release.py --resolve` genera lock Linux3.12 y manifiesto a destino nuevo; `--check` no descarga y rechaza unresolved. `build-chassis-images.py --release FILE --output DIR` verifica huellas y usa contexto17 explícito para18, sin push.

- [ ] Tests fixtures: fuente17 ausente, digest inventado/incompleto, drift de árbol, Windows wheels como lockLinux, paquete no fijado, secreto en buildargs y private catalog/contexto rechazados. Estado unresolved o imagen no verificable localmente devuelve2, nunca un release válido; forma SHA256 correcta por sí sola no acredita existencia; diff de fuente sucia se identifica sin fingir commit limpio. Run13 `python -m pytest tests/release/test_release_inputs.py -q` con Python existente (sin instalaciones). Expected RED.
- [ ] Implementar primero check offline y recetas. Resolver dependencias dentro de Docker Linux, exactas y con hashes/verificación, incluyendo closures01/02/17/18; nunca freeze del venv Windows. Distribucionesfuente requieren toolchain/builder fijado y resolución aislada explícita; preferir wheels y fallar si faltan. Bases iniciales son candidatas de los Dockerfiles actuales, no consideradas seguras por antigüedad: seleccionar versiones soportadas y registrar digests antes del build; disponibilidad/versiones se verifican en registros oficiales durante fase autorizada. No usar latest.
- [ ] Si se aprueba ejecución de este plan, descargar únicamente bases oficiales/paquetes públicos necesarios y Playwright runtime1.61.1 compatible (resolver etiqueta/digest disponible antes de pull); scanner público fijado igualmente. Fetch en fase separada de tests sin egress; descargas no autorizan arrancar servicios de producción. Sin recurso/registro disponible, registrar blocked. No fabricar lock con placeholders para poner verde.
- [ ] Construir imágenes sin datos/catálogos operativos, fixtures ni secretos, no root, motor17 instalado exacto. Prueba dentro de18 desde /tmp/Python aislado: import físico y resultado spring_response wheel_rate25000; imports de app Chassis sin Torch y capacidad histórica no disponible explícita. Lock/artifacts verificados→GREEN; build/scan no realizado queda bloqueado.

### Task 8: Definición comercial, mounts y controles aislados

**Files:** Create13/deploy/{compose.chassis.yml,chassis.env.example}; Create13/tests/release/test_compose_contract.py; Create13/tests/delivery/{run_stack.py,identity_fixture.py}; Extend18/tests/delivery/test_installation_lock.py si surge cruce de mounts.

**Interfaces:** compose recibe tags/digests del release de Task7; servicios frontend,api,gateway,worker. Solo frontend puerto3000, API TLS8180 interno; gateway loopback8010, worker sin listener; gateway/worker comparten namespace api. Volumen state solo API; claves/CA readonly por consumidor, tmpfs separado. Runtime UID1000(API) y usuarios explícitos otros; read_only rootfs, cap_drop ALL, no-new-privileges, pids_limit128, mem_limit1GiB por servicio excepto frontend256MiB, tmpfs256MiB/timeout de aceptación global600s. Límites de IA/node externos no se fingen cubiertos por estos contenedores.

- [ ] Tests de compose parseado: puertos internos no publicados, defaults locales prohibidos, ninguna clave literal, red/data mount correctos, segundaAPI rechazada, temp no comparte estado, modelo/autoridad sin configuración no aparecen disponibles. `python -m pytest tests/release/test_compose_contract.py -q`: RED.
- [ ] Implementar definición y entrypoints; no ejecutar `compose up` del operador. API publica HTTPS y13 monta CA de confianza en ruta nginx fija, sin modificar template para desactivar verificación. Claves montadas requieren propietario/permisos válidos para el UID real; no chmod de secretos existentes para hacerlo funcionar.
- [ ] Harness solo fixtures UUID privadas: todos los targets y navegador en namespace de red none compartido, sin puertos del host ni socketDocker ni entorno/credenciales del usuario, mounts mínimos, límites y cleanup de contenedores propios. Identidad/autoridad TLS sintéticas sustituidas por configuración de fixture externa a imágenes finales; código real protegido se ejecuta sin monkeypatch de rutas. Un fixture no se empaqueta como proveedor del producto.
- [ ] GREEN contrato y `docker compose --env-file <fixture> -f deploy/compose.chassis.yml config --quiet`. El render no acredita operación real. Si aislamiento o imágenes exactas faltan, run_stack devuelve status blocked y salta target, nunca lo ejecuta sin protección.

### Task 9: Aceptación de recuperación y navegador

**Files:** Create13/tests/delivery/test_full_stack.py y tests/e2e/chassis-delivery.spec.ts; Create13/playwright.delivery.config.ts; Create18/tests/delivery/test_recovery_acceptance.py; Create13/docs/chassis-delivery-acceptance-2026-10-27.md.

**Interfaces:** `run_stack.py --release FILE --output DIR` devuelveJSON `{status:passed|failed|blocked,gates,images,sources,checks,blockers}`. Cada gate mantiene estado propio; cero sumario passed si falta test requerido. Config navegador exige origen loopback de fixture, no fallbackcloud. Backup/restore de Task3/4 se ejecutan dentro de la imagen18, destino scratch nuevo.

- [ ] Escribir aceptación fixture dos equipos con reader/engineer/admin y titular/suplente humano; crear grabación, A/B, evidencia de banco/dominio, sesión, run y propuesta por APIs reales. Datos sintéticos están marcados; fuente física insuficiente produce solicitud/abstención, no recomendación inventada. Llevar run pending hasta backup frío; no inferencia real obligatoria para probar restauración. El gate IA real se separa y permanece pendiente si no hay nodo/modelo real validado.
- [ ] RED: ejecutar `python tests/delivery/run_stack.py --release <lock> --output <workspace>`; antes de implementar controles espera fallos de aserción o blocked si falta runtime, nunca confundirlos. No construir resultados verdes con ASGI/mocks.
- [ ] Completar checks HTTP+browser: auth/team isolation, roles, jefe humano y suplente, legacy/internal/encoded paths negados, proxyCAincorrecta, modo local/desconocido/caído, cambio de equipo antes de POST, reload de página, reinicio con persistencia, readonly503 y2API. Comparar backup/restore inventario/hashes; restaurado no emite acciones, leases/grants previos rechazados y cuarentena de modelo respetada. Bundle y Docker context controles1A siguen pasando.
- [ ] GREEN por gate con resultados de proceso/navegador y tiempos medidos; backend/CA/modelo fake identificados como sintéticos. Proveedor/RLS real, IA local real y AiM nativo Windows/2Dcontrastado no se certifican por este harness. Si algo falta conservar blocked y salida no-cero; entregar procedimiento listo y evidencia exacta.

### Task 10: CI, revisión y operación de la entrega

**Files:** Create13/.github/workflows/chassis-delivery.yml, tests/release/test_delivery_workflow.py y docs/chassis-delivery-operation.md; Modify13/.github/workflows/ci.yml y18/.github/workflows/ci.yml solo gating de publicación comercial/push automático inseguro, manteniendo tests/security existentes; Update13/docs/product-completion-matrix.md. No tocar reusable12 ni protecciones remotas.

**Interfaces:** workflow_dispatch con refs exactos y credencial de lectura de repositorios, sin despliegue/push; checkouts01/02/13/17/18 verifican SHA/tree contra release. Artefactos: locks, digests, SBOM, informe de scanner, gates/testlogs sin datos ni secretos. No intenta checkout de cambios locales no committed como si ya existieran en remoto. Fuentes dirty solo aceptación local, nunca promoción.

- [ ] Tests estructurales de YAML/paths y scripts: todos los contextos presentes, workflow no publica tras unit tests, no se eliminan scanners, fallos de scanner/dependencias/browser no son continue-on-error verde, permisos mínimos y ningún secreto interpolado en CLI/log. Run `python -m pytest tests/release/test_delivery_workflow.py -q`: RED.
- [ ] Implementar jobs diferenciados: test/typecheck, lock/check, build coordinado, scanner fijado, aceptación y artefactos. Scanner HIGH/CRITICAL no se ignora automáticamente (exit1); indisponible/DBnoaccesible bloquea. Nunca ejecutar jobs remotos durante esta sesión. Corregir invocación frontend a npm run typecheck en vez de un comando raíz que puede no recorrer referencias.
- [ ] Ejecutar verificaciones afectadas y una sola suite amplia18/13 y suites01/02 pertinentes después del delta final; registrar skips/blocked por separado. Builds comercial/desarrollo y canonical surface/map check; RLS/2D/banco no se atribuyen como nuevos. Revisar release bundle sin secretos/catálogos operativos y scanner real si disponible.
- [ ] Solicitar una revisión independiente del delta completo con spec, plan, baseline y evidencias. Corregir importantes con RED→GREEN en una pasada y repetir solo checks afectados; no encadenar rerevisiones. Congelar manifiestos de fuentes/artefactos nuevos conservando1A.
- [ ] Documentar copia en frío, restore a raíz nueva, montaje de claves externo, cambio de volumen y rollback preparado sin ejecutarlos. Incluir indisponibilidad, limites de única instancia y mediciones RPO/RTO de fixture sin convertirlas en SLA. No programar backups ni aplicar retención real; no proclamar listo para venta general.

## Autorrevisión

Cobertura: estado y stores completos→1; exclusión y lifecycle→2; copia→3; restauración/fencing→4; readiness/TLS→5; worker/MCP respetados→6; paquete/locks/contextos→7; definición comercial/aislamiento→8; recuperación+browser→9; CI/evidencias/operación→10. ReviewFocus1→1,2→2/8,3→3/4,4→4/9,5→5/9. Firmas StateLayout/InstallationLease/ReleaseIdentity/BackupManifest y sus consumidores coherentes. Las dependencias compartidas forman una única entrega: no dividir backup o TLS en planes incompatibles. Descargas expresas solo dentro de construcción autorizada; nunca claims offline de imágenes no ejecutadas.

## Handoff

### Estado de ejecución del27octubre2026

Ejecución en esta sesión autorizada por el usuario. Cierre de Task9 en `stack-37-full/result.json`:11 controles obligatorios pasan en la entrega aislada del candidato13; incluye recuperación HTTP ampliada, identidad y firmas de titular/suplente. Task10 cuenta con workflow manual, contratos, documentación y revisión independiente; no se han ejecutado jobs remotos, conforme al alcance. Evidencias, correcciones y bloqueos comerciales en `docs/chassis-delivery-acceptance-2026-10-27.md` y el ledger privado. Las listas originales se conservan como plan aprobado; este estado no autoriza promoción, despliegue ni atribuye aceptación al destino real.

Método conservado: ejecutar aquí con executing-plans, tareas secuenciales y revisión final. Pendiente de que el usuario revise este plan y confirme que refleja el diseño aprobado, incluida la autorización acotada de descargas para construir contenedores. No se elige de nuevo método ni se ejecuta producto antes de esa revisión.
