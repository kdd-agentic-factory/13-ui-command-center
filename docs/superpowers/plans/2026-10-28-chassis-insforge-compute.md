> Archivo histórico: diseño/plan aprobado el 28-10-2026. Describe esa fase, no el estado actual de producción. El avance posterior se registra en el plan de factorías y Brain del repositorio 18; conservar esta especificación no declara una aceptación ni un despliegue nuevos.

# Chassis en InsForge Compute — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking. Ejecución en esta sesión, conservando el método elegido por el usuario.

**Goal:** alojar Chassis en InsForge sin perder estado al recrear servicios y realizar un cambio de tráfico recuperable después de aceptar el destino.

**Architecture:** Postgres contiene estado transaccional; Storage privado contiene grabaciones y derivados inmutables. El almacenamiento SQLite continúa disponible para instalaciones locales. La API conserva autenticación por equipo y autoridad humana; transporte de ingeniería e inferencia requieren una aceptación específica del destino.

**Tech Stack:** Python3.12/FastAPI, PostgreSQL/psycopg3, InsForge Storage, React/Vite/nginx, Docker linux/amd64, CLI de InsForge. Incorporar dependencias únicamente con locks y hashes regenerados y verificados.

**Spec:** ../specs/2026-10-28-chassis-insforge-compute-design.md. Diseño aprobado por el usuario el2026-10-28. La copia conserva el contenido de la propuesta aprobada; source21 y su aceptación se conservan inmutables.

## Global Constraints

- Proyecto destino The Digital Pit Wall:23afcca6-10d0-4bae-83d0-9999f4717a81. No tocar otros proyectos, ARGOS ni cuentas ajenas.
- Mantener todas las muestras, unidades, procedencia y hashes. No inventar relojes ni aplicar el recorte de16muestras del ejemplo MATLAB.
- El Crew Chief humano designado y su suplente conservan la decisión final. Ningún agente recibe autoridad humana.
- Sin buckets públicos, credenciales de ensayo reutilizadas, secretos en imágenes o migraciones automáticas en arranque.
- No asignar datos sin propietario a un equipo. Conservar cuarentena y originales.
- Solo retirar el servicio antiguo identificado después de reemplazo aceptado, inventario de dependencias y verificación de recuperación.
- Revocación histórica pendiente por decisión del usuario. No llamarlo producto completamente listo para venta mientras continúen sus bloqueos.
- La aceptación source21 pasa13gates/81controlesHTTP/5navegador con identidad/modelo reales y telemetría sintética: no certifica Postgres/Storage ni lectores2D.
- La ubicación/recursos/coste de inferencia productiva siguen abiertos. No crear servicios facturables ni activar una licencia2D sin resolver su destino concreto.

## Review Focus

1. Recreación de Compute durante una publicación: objeto pendiente invisible y recuperación idempotente; pruebas en tareas3/7.
2. Un UUID o ruta conocida de otro equipo:404, sin lectura de bytes ni URL firmada; pruebas en tareas2/3/7.
3. Restauración con leases/aprobaciones antiguas: no reanudar trabajo ni fabricar autoridad; pruebas en tareas4/5.
4. Dos procesos o reintentos con una operación idéntica: un único resultado; payload diferente produce conflicto; pruebas en tareas2/4.
5. Nodo/modelo ausente, TLS incorrecto o reinicio durante inferencia: fallo verificable, sin fallback ni resultado fingido; pruebas en tareas6/7.

## Estructura y secuencia

Rutas relativas al workspace kdd-agentic-factory; 18=18-telemetry-dataset,13=13-ui-command-center. Implementar en nuevos worktrees basados en los cinco SHAs de source21; no editar las fuentes congeladas ni los árboles originales con trabajo previo. Separar commits por entrega. Las migraciones se preparan primero; cualquier aplicación cloud se identifica por nombre/hash y destino antes de ejecutarla.

### Task 1: inventario y contratos de persistencia

**Files:** Create18/src/telemetry_dataset/persistence/{contracts.py,registry.py,inventory.py};18/tests/test_persistence_contract.py;18/tests/test_persistence_inventory.py. Read18/src/telemetry_dataset/operations/{state.py,bootstrap.py,backup.py,restore.py}, recorded_catalog.py, recorded_persistence.py y todos los módulos store.py de chassis. Modify18/src/telemetry_dataset/config.py únicamente para selección explícita de adaptador.

**Interfaces:** StorageMode=Literal['local','insforge']; StateInventory(stores, tables, artifacts, quarantine); BackendCapabilities(transactional, durable_blobs, migration_version). build_inventory(layout:StateLayout)->StateInventory; select_backend(settings)->StorageBackend. Los protocolos usan Principal explícito, UUID, operaciones idempotentes y payloads versionados; no exponen conexiones ni SQL a rutas HTTP.

- [ ] Escribir pruebas: modo desconocido rechazado, cloud sin DSN/storage rechazado, perfil local conserva comportamiento, inventario incluye las siete tiendas de operations/state.py y todos los artefactos de sesión/auditoría, archivo o tabla desconocida bloquea migración.
- [ ] Ejecutar `python -m pytest tests/test_persistence_contract.py tests/test_persistence_inventory.py -q` desde18; registrar RED por contratos ausentes.
- [ ] Implementar protocolos/inventario y manifiesto de consultas a reemplazar. Registrar cada uso de sqlite3, PRAGMA, lastrowid, jsonl y filesystem dentro del perímetro Chassis. No introducir un traductor genérico de SQL.
- [ ] Repetir pruebas y regresiones de operations/state y backup/restore hasta GREEN. Commit `feat: define cloud persistence contracts and complete state inventory`.

### Task 2: repositorios Postgres y aislamiento

**Files:** Create18/src/telemetry_dataset/persistence/postgres/{connection.py,repositories.py,migrations.py};18/migrations/insforge/chassis_cloud_state_v1.sql;18/tests/test_postgres_repositories.py;18/tests/test_postgres_team_isolation.py. Modify18/src/telemetry_dataset/chassis/{store.py,engineering/store.py,suspension_lab/store.py,domain_evidence/store.py}, recorded_catalog.py y repositorios consumidores inventariados en tarea1. Modify18/requirements/chassis-runtime.lock y manifiestos de dependencias mediante el proceso existente.

**Interfaces:** transaction(principal:Principal)->UnitOfWork; UnitOfWork.objects/catalog/suspension/domain; put_object(kind,id,operation,fingerprint,payload)->StoredObject; get_object(kind,id)->StoredObject; list_objects(kind,cursor,limit)->Page. migrate(connection,expected_sha256,dry_run=True)->MigrationReport. Firmas de repositorios definidas en contracts.py; SQL queda dentro del adaptador. No simular una conexión SQLite con psycopg.

- [ ] Pruebas contra Postgres efímero real: misma operación devuelve mismo UUID; contenido diferente genera409; UUID extranjero devuelve404; rol DB del runtime no puede DDL, omitir el contexto de equipo o eludir políticas; paginación estable con fechas iguales.
- [ ] Ejecutar `python -m pytest tests/test_postgres_repositories.py tests/test_postgres_team_isolation.py -q`; RED sin adaptador.
- [ ] Crear migración explícita con tablas/índices/constraints y políticas de equipo. Usar transacciones y contexto de equipo ligado a la transacción; rol de migración separado del runtime. No confiar en valores team_id enviados por cliente. Convertir consultas inventariadas a métodos del repositorio por dominio, conservando interfaces HTTP.
- [ ] GREEN en Postgres real y regresiones SQLite; ejecutar pruebas existentes de identidad/equipos y contratos de sesiones. Commit `feat: persist chassis transactional state in postgres`.

### Task 3: grabaciones inmutables y Storage privado

**Files:** Create18/src/telemetry_dataset/persistence/{blob_store.py,publication.py};18/tests/test_private_blob_publication.py;18/tests/test_blob_failure_recovery.py. Modify18/src/telemetry_dataset/{recorded_store.py,recorded_persistence.py,recorded_catalog.py,routers/recorded.py} y persistencia binaria de suspension_lab/domain_evidence identificada en tarea1.

**Interfaces:** BlobStore.stage(principal,stream,sha256,byte_limit)->PendingBlob; verify(pending)->VerifiedBlob; read(principal,object_id)->BinaryStream. PublicationService.publish(uow,operation,blob,metadata)->RecordingRevision; reconcile(limit)->ReconciliationReport. Registrar pendiente/confirmado y hash antes de exponer referencias; confirmar únicamente tras verificar bytes y propietario. Claves internas generadas por servidor; no aceptar rutas arbitrarias ni URLs externas.

- [ ] Pruebas: interrupción tras upload y antes de commit, reintento, checksum incorrecto, payload demasiado grande, nombre malicioso, referencia extranjera y URL caducada. Objeto pendiente nunca aparece en catálogo. Reconciliar no borra originales ni objetos de otro equipo.
- [ ] Ejecutar `python -m pytest tests/test_private_blob_publication.py tests/test_blob_failure_recovery.py -q` y observar RED.
- [ ] Implementar streaming acotado y publicación recuperable. Verificar permisos de Storage con dos identidades reales en preproducción cuando el bucket privado esté preparado; el servicio no entrega credenciales administrativas al navegador.
- [ ] GREEN; pruebas de importación AiM/conservación de arrays y atomicidad existentes. Commit `feat: publish private telemetry blobs with verified durable references`.

### Task 4: ejecución y autoridad duraderas

**Files:** Create18/src/telemetry_dataset/persistence/postgres/engineering.py;18/tests/test_postgres_engineering_leases.py;18/tests/test_postgres_authority_recovery.py. Modify18/src/telemetry_dataset/chassis/engineering/{runs.py,snapshots.py,sessions.py,decision_store.py,proposals.py,control.py}, operations/{exclusive.py,readiness.py}.

**Interfaces:** UnitOfWork.engineering.claim(worker_id,lease_seconds)->TaskLease|None; reserve_model_call(task_id,reservation_id)->Reservation; transition(task_id,expected_version,result)->TaskRecord; fence_restored_runs(manifest_id)->FenceReport. Propiedad de escritor y leases transaccionales en Postgres, preservando IDs/grants/contratos actuales.

- [ ] Pruebas con dos conexiones/procesos: un solo claim/reserva, expiración, pérdida de conexión, reintento de entrega y cambio de membresía antes de aprobar. Restaurar invalida runs/leases y obliga a nueva autoridad; agente e ingeniero siguen sin aprobar.
- [ ] Ejecutar `python -m pytest tests/test_postgres_engineering_leases.py tests/test_postgres_authority_recovery.py -q`; RED.
- [ ] Implementar transiciones atómicas y fencing sin sustituir authority_insforge ni reducir sus verificaciones. Readiness verifica versión DB y Storage disponible sin crear tablas ni escribir datos de negocio.
- [ ] GREEN y suites existentes de grants, runs, decisiones y autoridad humana. Commit `feat: preserve engineering leases and human authority in cloud persistence`.

### Task 5: migración y restauración a destino nuevo

**Files:** Create18/src/telemetry_dataset/operations/cloud_transfer.py;18/scripts/migrate_chassis_cloud.py;18/tests/test_cloud_transfer.py;18/tests/test_cloud_restore_fencing.py;13/docs/chassis-insforge-migration.md. Modify18/operations/cli.py y esquemas de manifiesto mediante nueva versión explícita.

**Interfaces:** export_state(layout,destination)->TransferManifest; import_state(manifest,target,dry_run=True)->TransferReport; verify_transfer(manifest,target)->ParityReport. Manifiesto por tabla/objeto, propietario, número de registros, revisión y SHA; ledger idempotente de importación. Firmas/versiones diferenciadas del backup1.0 existente.

- [ ] Pruebas: fuente sin detener escritor rechazada, versión desconocida, destino no vacío, objeto duplicado, blob faltante, caída a mitad, cuarentena sin propietario y aprobación histórica restaurada. Paridad de muestras, unidades, hashes y snapshots.
- [ ] Ejecutar `python -m pytest tests/test_cloud_transfer.py tests/test_cloud_restore_fencing.py -q`; RED.
- [ ] Implementar dry-run por defecto, exportación en frío y restauración sin sobrescritura. Probar primero con dos equipos sintéticos en Postgres/Storage aislados, luego en preproducción explícita. Nunca pasar datos de ensayo a producción como datos comerciales.
- [ ] GREEN y ensayo de reversión con escrituras congeladas y sin estados divergentes. Commit `feat: add verified chassis cloud migration and recovery`.

### Task 6: contrato de destino Compute e inferencia

**Files:** Create13/deploy/insforge/{deployment.schema.json,services.json,README.md};13/scripts/{prepare-insforge-delivery.py,verify-insforge-target.py};13/tests/release/test_insforge_target.py. Modify13/deploy/compose.chassis.yml solo si es necesario para ensayos del adaptador cloud,18/src/telemetry_dataset/config.py,18/src/telemetry_dataset/chassis/engineering/local_model.py y manifiestos de02/01 para configurar TLS/autenticación sin abrir rutas internas.

**Interfaces:** TargetManifest(project_id,region,services,image_digests,resource_limits,transport,inference,storage_schema,rollback); validate_target(manifest,capabilities)->TargetReport; prepare_delivery(manifest,directory)->DeliveryBundle. Sin claves en manifest/bundle público. Contrato de inferencia cerrado con endpoint HTTPS privado/verificado, modelo/digest exactos y límites vigentes.

- [ ] Pruebas: proyecto incorrecto, imagen por tag mutable, esquema no migrado, rol administrativo, endpoint local inalcanzable desde Compute, TLS no válido, clave ausente, modelo cambiado o coste/recursos no confirmados: preparación bloqueada con causa concreta.
- [ ] Ejecutar `python -m pytest tests/release/test_insforge_target.py -q` desde13 y RED.
- [ ] Consultar capacidades de red/secretos reales mediante CLI. Producir configuración concreta para API, gateway/worker y web con mismas restricciones del perímetro; si falta aislamiento privado, no publicar MCP/control para compensarlo. Mantener al nodo local como opción de inferencia sin cambiar a IA externa. Presentar ubicación de inferencia, región y presupuesto antes de crear servicios facturables; este requisito abierto no se resuelve por defecto.
- [ ] GREEN y revisión de exposición/credenciales. Si el proveedor no permite el contrato, registrar bloqueo reproducible; no sustituir el despliegue por un demo. Commit `feat: prepare verified insforge service delivery contract`.

### Task 7: aceptación cloud con recreación real

**Files:** Create13/tests/delivery/{run_insforge_acceptance.py,cloud_persistence_qa.py};13/tests/release/test_cloud_acceptance_gates.py. Reuse13/tests/delivery/{run_real_acceptance.py,real_acceptance_qa.py,browser_authenticated.cjs}, scripts/{resolve-chassis-release.py,build-chassis-images.py,scan-chassis-images.py}.

**Interfaces:** accept_cloud(target,private_inputs)->AcceptanceReport. Campos: exact_source_refs,image_digests,identity_gates,persistence_gates,agent_gates,browser_gates,cleanup,synthetic_inputs,publishable,blocking_reasons. Las cuentas y claves de ensayo permanecen en archivos privados; nunca en Git o parámetros impresos.

- [ ] RED: falta cualquier gate, deriva de digest, fixture de identidad en lugar de proveedor real, modelo simulado o datos sintéticos etiquetados como físicos impiden aceptación.
- [ ] Implementar ensayo aislado de ambos equipos y todos los dominios; aceptar upload, setup, análisis, revisión independiente, informe, Chief/suplente, revocación/cambio de rol y frontera de equipo. Recrear realmente Compute y comprobar paridad durable. Cortar Storage/DB/modelo durante operaciones y validar recuperación. No usar la aceptación source21 como sustituto.
- [ ] Ejecutar `python -m pytest tests/release/test_cloud_acceptance_gates.py -q`; reconstruir/escáner por digest; ejecutar aceptación real con manifiesto privado explícito y supervisar recursos propios. GREEN en pruebas; aceptación `passed` únicamente con evidencias completas.
- [ ] Revisión independiente de rama y artefactos; corregir hallazgos y repetir solo gates afectados con paridad final. Commit `test: verify durable insforge chassis delivery end to end`.

### Task 8: cambio de tráfico y retirada controlada

**Files:** Create13/scripts/promote-insforge-delivery.py;13/tests/release/test_insforge_promotion.py;13/docs/chassis-insforge-cutover.md. Update13/deploy/insforge/services.json con IDs/resultados aceptados sin secretos.

**Interfaces:** promotion_plan(target,acceptance,current_deployments)->PromotionPlan; promote(plan)->PromotionReport; retire_legacy(plan,postcutover_checks)->RetirementReport. Plan exacto por ID y hash; modificar solo el proyecto autorizado. Uso de CLI InsForge, no flyctl directo ni llamadas cloud no documentadas.

- [ ] RED: aceptación incompleta, consumidores antiguos sin inventariar, copia de recuperación inexistente, destino distinto, URLs/dependencias no verificadas o cambio de IDs bloquean promoción/borrado.
- [ ] Preparar plan concreto: servicios nuevos saludables, persistencia y restauración aceptadas, variables frontend explícitas no administrativas, enrutamiento same-origin, TLS y navegador desde dominio real. Conservar referencia del despliegue anterior y procedimiento de reversión antes de cambiar el sitio.
- [ ] Ejecutar tests de promoción hasta GREEN. El usuario ha autorizado redesplegar tras aceptación y eliminar servicios antiguos: no pedir la misma autorización; detenerse únicamente si el plan concreto excede ese alcance o faltan datos de destino/coste.
- [ ] Cambiar tráfico, comprobar dominio/login/datos/agentes/autoridad y auditoría. Solo entonces retirar el antiguo servicio70bc8e26-ae98-4ab0-bd9f-42d8ca8ee20b si el inventario confirma que no tiene datos/consumidores pendientes. No borrar el historial de despliegues ni otros proyectos.
- [ ] Registrar IDs, hashes, comprobaciones y limitaciones. Separar despliegue operativo de certificación de AiM/2D y de la revocación pendiente. Commit `docs: record verified insforge cutover and legacy retirement`.

## Línea paralela2D: requisito independiente

El usuario ha aportado un ticket de licencia y un mensaje del curso que indica Race2026. El ticket no se guarda en documentos, código, logs ni artefactos. El manual oficial distingue Race24+ (CodeMeter) de Race23 y anteriores: no dar por válida esa licencia para ejecutar DLL2023. El paquete2026 ya está descargado y firmado; la extracción en Wine falló y no se considera instalación/activación correcta.

Antes de activar: identificar equipo destino y disponibilidad de CodeMeter/licencia en ese equipo. No vincular una licencia a un contenedor efímero ni borrar software antiguo por una instrucción reenviada. Preparar una lectura/exportación con Race2026 en instalación autorizada, originales de las cinco demos en solo lectura y derivados privados con hashes. Cualquier prueba aislada de DLL requiere revisión del ejecutor y la licencia correspondiente. No llamar a funciones de escritura ni de cambio de tipo de licencia. La comprobación necesita arrays completos/frecuencias y origen del tiempo documentado, no únicamente coincidencia visual.

## Revisión del plan

Auto-revisión: tareas1–5 cubren inventario/persistencia/migración/restauración; tarea6 capacidades/transporte/inferencia y recursos abiertos; tarea7 aceptación del destino; tarea8 cambio/recuperación/retirada. Los cinco Review Focus tienen pruebas asignadas. Ninguna tarea da por implementado un enlace al nodo local o capacidad de volumen en Compute. No se aplican migraciones al preparar este plan.

Estado: plan preparado; pendiente revisión del usuario antes de implementación. Método conservado: ejecución en esta sesión. Después de aprobarlo, empezar por tarea1, no por desplegar contenedores con estado efímero.
