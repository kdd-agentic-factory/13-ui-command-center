# Producto Chassis — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar una experiencia coherente de sesiones reales, Chassis A/B, evidencia e informes, con una web comercial que describa sus capacidades verificadas.

**Architecture:** 13 sigue siendo la aplicación canónica; 18 ofrece sesiones, autorización y comparaciones persistidas; 17 conserva el motor físico. Ampliar contratos exactos en 18 y consumirlos con el transporte de identidad existente. Consolidar accesos de 15 sin mover repositorios ni aplicar migraciones cloud.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Playwright; Python 3.11+, FastAPI, Pydantic, SQLite, pytest. Sin nuevas dependencias de producto previstas.

**Spec:** `../specs/2026-10-19-chassis-product-workspace-design.md`, aprobada por el usuario. Plan aprobado y ejecutado de forma nativa en esta sesión. Resultados y decisiones en `product-workspace-execution-ledger.md`; el alcance nuevo del informe conserva requisitos pendientes explícitos.

## Global Constraints

- Conservar nombres, activos KDD/Keedio y sistema visual técnico existente, simplificando jerarquía y navegación.
- Conservar los contratos de importación, versiones físicas, revisiones A/B, calibración, procedencia y autorización ya implementados.
- Las mediciones existentes y sus archivos crudos permanecen intactos. No asignar propietarios a datos antiguos automáticamente.
- La web comercial y el espacio operativo tienen navegación y objetivos diferentes; no crear otra aplicación paralela.
- 2D experimental hasta contraste independiente del fabricante; no habilitar recomendaciones mecánicas mediante un cambio visual.
- Sin publicación externa, aplicación de migraciones cloud, nuevas cuentas, pagos ni transferencia de telemetría a servicios externos.
- Preservar cambios previos sin commit. No resetear, limpiar ni mezclar ramas; leer las instrucciones de cada repositorio antes de editarlo. No crear commits ni publicar durante esta entrega salvo instrucción posterior.

## Review Focus

1. Equipo/cuenta cambiados durante listado, carga o descarga: descartar datos y respuestas del contexto anterior. Pruebas en tareas 2, 4 y 5.
2. Sesiones antiguas sin fecha o propietario, o un JSON local corrupto: no adoptar propietarios ni ocultar la lista completa por un archivo defectuoso. Pruebas en tarea 2.
3. Edición incompleta, comparación fallida y navegación: no perder el borrador ni presentar resultados anteriores como recién calculados. Pruebas en tarea 4.
4. Empate de fechas, cursor alterado o usado en otro equipo: paginación estable y validación independiente de autorización. Pruebas en tarea 2.
5. Modelo ausente y fuente 2D experimental: conservar hallazgos deterministas y limitaciones, sin indicador de disponibilidad inventado. Pruebas en tareas 3, 5 y 6.

## Secuencia y alcance

Tarea 1 fija el catálogo; 2 habilita recuperación real; 3 añade estados de producto; 4 integra navegación y espacio Chassis; 5 entrega informes; 6 alinea web comercial y accesos de 15; 7 verifica el conjunto. Cada tarea deja software o evidencia revisable. No convertir este plan en una reimplementación de los 65 módulos históricos: la matriz identifica su cierre pendiente y mantiene el objetivo global visible.

Rutas de archivos abreviadas con `13/`, `15/`, `18/` significan respectivamente `13-ui-command-center/`, `15-race-command-center/`, `18-telemetry-dataset/`, bajo `C:/Users/usuario/Desktop/kdd-agentic-factory/`.

## Task 1: Catálogo de producto y matriz de cierre

**Files:** crear `13/src/domain/productModules.ts`, `13/tests/productModules.test.ts`, `13/docs/product-completion-matrix.md`; actualizar `13/PRODUCT.md` y estado de aprobación de la especificación.

**Interfaces:** producir `ProductModuleStatus = 'verified' | 'partial' | 'demo' | 'unverified' | 'external-blocker'` y `ProductModule {id:string; label:string; status:ProductModuleStatus; ownerRepo:string; evidence:string[]; reason:string}`; exportar `productModules: readonly ProductModule[]`. Mantener los identificadores actuales del shell; ningún enlace autoriza por su estado de catálogo.

- [ ] Añadir prueba `catalog_covers_navigation_without_duplicate_ids`: extraer los IDs declarados del shell como inventario de referencia; comprobar cobertura completa, IDs únicos y motivos/evidencia no vacíos. Comprobar que Chassis no se etiqueta como validación física comercial completa y 2D mantiene bloqueo externo.
- [ ] Ejecutar `npm test -- tests/productModules.test.ts`; comprobar fallo por catálogo ausente.
- [ ] Crear catálogo y matriz con los 27 repositorios, todos los módulos de navegación y columnas pantalla/API/persistencia/autorización/dependencia/prueba/estado. Distinguir evidencia ejecutada de revisión estática; no marcar verificado por un README.
- [ ] Repetir prueba y comprobar PASS; revisar catálogo contra `DashboardShell.tsx` y conservar referencias a pruebas anteriores con su fecha real.

## Task 2: Sesiones recuperables y paginación autorizada

**Files:** crear `18/src/telemetry_dataset/recorded_catalog.py`, `18/tests/test_recorded_catalog.py`; modificar `18/src/telemetry_dataset/routers/recorded.py`, `18/src/telemetry_dataset/identity/policy.py`, `18/tests/test_team_route_isolation.py`; ampliar `13/src/services/recordedTelemetry.ts`, crear `13/src/components/recorded/RecordedSessionLibrary.tsx`, `13/tests/recordedSessionLibrary.test.tsx`; actualizar `18/docs/recorded-imports.md`.

**Interfaces:** `GET /api/v1/recorded?limit=20&cursor=...` devuelve `{items: RecordedSessionListItem[], next_cursor: string|null}`. Item: `{id,source,filename,imported_at,channel_count,validation_status}` sin canales/muestras. `imported_at` es fecha UTC del registro en catálogo, no hora de adquisición. `list_recordings(principal: Principal|None, limit:int=20, cursor:str|None=None)->dict`. Frontend exporta `listRecordings(options?:{limit?:number;cursor?:string}):Promise<RecordedSessionPage>`; biblioteca recibe `onOpen(session:RecordedSession):void` y usa `getRecording(id)` antes de seleccionar.

- [ ] Añadir pruebas `test_team_reader_lists_only_own_sessions`, `test_unowned_hidden_in_authenticated_mode`, `test_local_list_excludes_team_owned`, `test_equal_timestamp_pagination_no_duplicates`, `test_invalid_limit_cursor_and_cross_scope_cursor`, `test_corrupt_legacy_record_does_not_break_list`, `test_import_commits_record_and_catalog_recovery`. Comprobar límites 1–100, 422 en cursor inválido, orden descendente `(imported_at,id)` y aislamiento A/B incluso al falsificar cursor.
- [ ] Ejecutar `.venv/Scripts/python -m pytest tests/test_recorded_catalog.py tests/test_team_route_isolation.py -q` en 18; comprobar fallo específico por contrato ausente.
- [ ] Implementar catálogo SQLite en directorio gobernado de grabaciones, separado de objetos Chassis. Indexar metadatos en importación; recuperar archivos previos por un backfill local idempotente en worker thread, sin modificar JSON ni propietarios. Usar mtime UTC como fecha de catálogo de registros antiguos, documentándolo. Ignorar con diagnóstico archivos corruptos; no devolverlos. Una escritura de catálogo fallida no deja la sesión permanentemente irrecuperable.
- [ ] Codificar cursor base64url de versión, fecha, UUID y ámbito; validarlo estrictamente y volver a aplicar filtro de propietario en SQL. Cursor no es credencial. Añadir solo `GET /api/v1/recorded` a lectura autorizada; conservar rutas estáticas `/capabilities` y `/inspect-2d` sin colisión. No incluir muestras ni abrir rutas legacy.
- [ ] Añadir pruebas UI `library_opens_saved_session`, `library_retries_error_and_loads_next_page`, `library_discards_late_page_on_team_change`: callback solo después de GET autorizado; mostrar vacío/error/carga, no borrar página anterior al cargar más. Ejecutarlas RED→GREEN con transporte existente y generación de ámbito.
- [ ] Ejecutar pytest indicado y `npm test -- tests/recordedSessionLibrary.test.tsx tests/teamIdentityUI.test.tsx`; PASS. Verificar recuperación tras recrear proceso/catalogo en directorio temporal, sin tocar raw.

## Task 3: Estado real de producto

**Files:** crear `18/src/telemetry_dataset/routers/chassis_status.py`, `18/tests/test_chassis_status.py`; modificar `18/src/telemetry_dataset/main.py`, `18/src/telemetry_dataset/identity/policy.py`; crear `13/src/services/chassisProductStatus.ts`, `13/src/components/chassis/ChassisProductStatus.tsx`, `13/tests/chassisProductStatus.test.tsx`.

**Interfaces:** `GET /api/v1/chassis/status` devuelve `{service:'telemetry-dataset-service', status:'ok', identity_mode:'local'|'authenticated', ai:{status:string,model?:string}, readers:{aim:{platform_supported:boolean,dll_found:boolean,state:string},two_d:{native_validation:string}}}`. `getChassisProductStatus():Promise<ChassisProductStatus>`, con validación de respuesta en cliente. Reutilizar `probe_runtime(endpoint,model)` y capacidades del lector, sin envío de telemetría; estado `ready` no implica inferencia ni validación física.

- [ ] Añadir pruebas backend `test_status_requires_verified_membership_in_authenticated_mode`, `test_reader_can_probe_status`, `test_unavailable_model_preserves_backend_ok`, `test_status_never_sends_recording`. Pruebas frontend: JSON malformado/HTML 200 nunca muestran servicio listo, timeout muestra estado desconocido, 2D siempre conserva su nivel de validación.
- [ ] Ejecutar pruebas focalizadas y confirmar RED.
- [ ] Implementar ruta exacta de lectura y consultas acotadas en worker thread; usar configuración existente del modelo y límites de `probe_runtime`. No invocar `/api/generate` ni mostrar nombres de equipos ajenos o secretos. Componente actualizable por acción, sin bucle de sondeo agresivo.
- [ ] Repetir pruebas hasta PASS. Verificar timeout del cliente superior al límite acotado del probe y rechazo de respuestas de ámbito anterior mediante `telemetryFetch`.

## Task 4: Espacio operativo Chassis, navegación y borradores

**Files:** modificar `13/src/app/DashboardShell.tsx`, `13/src/context/AuthContext.tsx`, `13/src/pages/ChassisPage.tsx`, `13/src/pages/ConnectDataPage.tsx`, `13/src/components/chassis/ChassisComparison.tsx`, `13/src/styles/recorded.css`; crear `13/src/components/chassis/ChassisWorkspaceNav.tsx`, `13/src/context/WorkspaceDraftContext.tsx`, `13/src/pages/RecordedSessionsPage.tsx`, `13/tests/chassisWorkspaceNavigation.test.tsx`; ampliar pruebas existentes de Chassis/curva/equipo. Leer `design.md`, Impeccable `craft-floor.md` y referencias de refinamiento antes de editar UI.

**Interfaces:** añadir TabId `'recorded-sessions'` sin renombrar IDs históricos. Navegación de producto usa `chassis`, `recorded-sessions`, `setup`, `report`, `settings`; `setup` y `report` se conectan a vistas reales de la sesión, no a las páginas demo. `WorkspaceDraftContext` proporciona `isDirty:boolean`, `markDirty(value:boolean):void`, `requestLeave(action:()=>void):void`; confirmación accesible ofrece seguir editando o descartar. Montarlo dentro del contexto de identidad, limpiar por ámbito en logout/equipo. Historial de setups usa `getChassisState` existente y revisiones reales.

- [ ] Pruebas RED: entrada inicial Chassis; biblioteca abre sesión y restaura al recargar; lector sin escritura; pestaña setups presenta revisiones reales; `unsaved_setup_or_calibration_blocks_navigation`; cancelar salida conserva campos; descartar ejecuta una sola acción; logout/equipo descarta sin reexponer borrador. Comparación fallida conserva borrador y última comparación marcada como anterior.
- [ ] Ejecutar `npm test -- tests/chassisWorkspaceNavigation.test.tsx tests/chassisComparisonUI.test.tsx tests/linkageCurveUI.test.tsx tests/teamIdentityUI.test.tsx`; registrar fallos esperados.
- [ ] Integrar biblioteca, estado de producto y navegación; priorizar dibujo A/B y edición, compactar fuente/advertencias sin ocultar límites. Separar metadatos desplegables y señal/calibración. No alterar física en cliente ni reemplazar cifras vacías por demostraciones. Eliminar del marco de producto la interpretación de salud de los seis servicios históricos; conservar su vista técnica separada.
- [ ] Aplicar guard a cambios de pestaña, apertura/cierre de sesión y salida voluntaria del espacio; `beforeunload` solo con cambios reales. Cambios forzados de identidad limpian estado inmediatamente. Borradores en memoria, sin localStorage de medidas; revisiones guardadas se restauran desde servidor. Error de restauración muestra reintento y volver a biblioteca.
- [ ] Ajustar CSS existente, controles etiquetados, foco visible, A/B distinguible sin color, tablet/móvil sin desbordamiento de página. Añadir confirmación accesible sin reutilizar `window.confirm` como flujo principal.
- [ ] Repetir pruebas hasta PASS y `npm run typecheck`; comprobar conservación de unidades/calibración/cobertura y restricciones 2D.

## Task 5: Informe de comparación persistida

**Files:** crear `18/src/telemetry_dataset/chassis/reports.py`, `18/src/telemetry_dataset/chassis/schemas/chassis-report.json`, `18/tests/test_chassis_reports.py`; modificar `18/schema-version.yaml`, `18/src/telemetry_dataset/routers/chassis.py`, `18/src/telemetry_dataset/identity/policy.py`; crear `13/src/domain/chassisReport.ts`, `13/src/components/chassis/ChassisReport.tsx`, `13/tests/chassisReport.test.tsx`; ampliar `13/src/services/chassisTelemetry.ts` y CSS de impresión.

**Interfaces:** `GET /api/v1/chassis/comparisons/{comparison_id}/report` autorizado devuelve `{schema_version:'1.0.0',classification:'restricted',comparison:ComparisonRun,session:{id,source,reader,reader_version,sha256,validation},limitations:string[]}`. `build_report(comparison_id:str,actor:str)->dict` carga objeto `comparison` mediante `store.get`, comprueba sesión autorizada y deriva las revisiones de las IDs almacenadas. Frontend: `getChassisReport(id:string):Promise<ChassisReportDocument>` y `serializeChassisReport(document):string`. Sin recalcular física ni llamar al LLM durante exportación.

- [ ] Pruebas RED: `test_report_uses_immutable_saved_revisions`, `test_report_cross_team_and_unowned_return_404`, `test_reader_can_read_report`, `test_report_has_no_raw_channels`, `test_report_preserves_experimental_source_and_model_version`. Comprobar esquema y prohibición de usar borrador B como medición independiente.
- [ ] Ejecutar `.venv/Scripts/python -m pytest tests/test_chassis_reports.py tests/test_team_route_isolation.py -q` y prueba UI que edita B después de guardar y mantiene informe anterior idéntico.
- [ ] Implementar endpoint exacto, autorizar lectura reader/engineer/admin sin abrir exportaciones legacy. Incluir fuente, versión física, A/B, supuestos, calibración, intervalo, cobertura, evidencia, hallazgos y estado real de inferencia del run persistido; no incluir arrays de señales crudas. Registrar el contrato nuevo `chassis-report` 1.0.0 en `schema-version.yaml`, sin alterar versiones de contratos existentes, y validar el documento con el esquema empaquetado mediante `importlib.resources`; probarlo también fuera del checkout.
- [ ] Implementar vista imprimible semántica, acción imprimir y descargar JSON UTF-8 local. Generar documento solo de respuesta autorizada; revocar object URLs y descartar descargas pendientes al cambiar ámbito. Nombres de archivo basados en ID, sin identidad sensible.
- [ ] Pruebas frontend `report_export_matches_saved_document`, `dirty_draft_does_not_change_export`, `late_report_after_team_change_cannot_download`; ejecutar `npm test -- tests/chassisReport.test.tsx` y pytest indicado hasta PASS.

## Task 6: Web comercial y accesos de la segunda interfaz

**Files:** modificar `13/src/pages/public/KddHubPage.tsx`, `13/src/pages/public/HomePage.tsx` solo si participa en la entrada efectiva, `13/src/styles/intro.css`; crear `13/src/components/public/ChassisCompatibility.tsx`, `13/tests/chassisProductEntry.test.tsx`; modificar `15/frontend/src/pages/ChassisGeometryPage.tsx`, `15/frontend/src/pages/ConnectDataPage.tsx`; crear `15/frontend/src/lib/chassis-product-url.ts` y `13/tests/e2e/chassis-product-entry.spec.ts`.

**Interfaces:** tabla de compatibilidad estática basada en las capacidades documentadas, con estado y requisitos por formato. Compartir dentro de 15 `chassisProductUrl(section:'chassis'|'sessions'):string`, configuración `VITE_CHASSIS_APP_URL`, misma URL canónica local por defecto ya existente; no generar nombres de hosts nuevos ni incluir credenciales en enlaces. Entrada de sesiones mediante query `workspace=recorded-sessions`, validada contra allowlist en App; ningún query habilita acceso sin identidad.

- [ ] Pruebas RED: home destaca Chassis antes que plataforma, CTA abre ruta canónica, 2D dice experimental, AiM indica requisito Windows SDK para nativo, otros fabricantes no prometen soporte universal. Navegador comprueba enlaces de 15 y rechazo de query de módulo desconocido sin activar modo demo.
- [ ] Ejecutar `npm test -- tests/chassisProductEntry.test.tsx` y test Playwright focalizado; documentar fallos de contenido/ruta esperados.
- [ ] Implementar relato de producto aprobado sobre el sistema visual técnico existente, proceso importación→medidas→comparación→evidencia y CTA principal. Conservar investigación/plataforma accesibles como secundarios; separar roadmap de capacidad presente. No crear testimonios, precios ni ganancias de vuelta.
- [ ] Consolidar enlaces de 15, conservar sus rutas históricas y su configuración de backend; no migrar cuentas entre sus distintos proyectos InsForge.
- [ ] Repetir pruebas, `npm run build` en 13 y en `15/frontend`. Advertencias de tamaño se registran; no introducir una división masiva del bundle ajena a estas rutas.

## Task 7: Verificación operativa, visual y revisión independiente

**Files:** crear `13/tests/e2e/chassis-product-workspace.spec.ts`, `13/docs/superpowers/plans/product-workspace-execution-ledger.md`; actualizar `13/docs/chassis-operation.md`, `13/design.md` solo para documentar cambios de sistema realmente aplicados, y documentación runtime de 18 pertinente.

**Interfaces:** flujo verificable importar→biblioteca→abrir→A/B→comparar→informe→recargar→restaurar. Reutilizar fixture de identidad local `18/tests/team_e2e_server.py` únicamente en QA aislada; no presentar esa prueba como autenticación cloud real.

- [ ] Añadir E2E del flujo completo, fallo de servicio/reintento, 2D experimental y cambio equipo A→B→A sin fuga. Fixture sintética claramente identificada; conservar comprobación separada con sesiones reales locales, sin inventar medidas de moto.
- [ ] Ejecutar suites frontend, typecheck/build; suites backend afectadas más identidad, rutas, importación, física/recomendaciones y empaquetado; pruebas físicas de 17 si se altera algún contrato que las consuma. Ejecutar Ruff en Python modificado y `git diff --check` por repositorio. Registrar comandos, conteos y resultados nuevos.
- [ ] Reiniciar solo servicios propios que requieran cargar cambios Python; usar lanzadores existentes con modo local y modelo fijado. Verificar salud JSON real y una lectura AiM/2D por separado de las fixtures. No abrir dispositivos ni transmitir raw.
- [ ] Aplicar Impeccable: detector una vez tras UI terminada; verificación visual acotada escritorio/móvil, teclado y foco, errores y overflow; máximo dos rondas agrupadas de capturas/correcciones salvo defecto funcional nuevo. Guardar prueba visual y mostrarla en la entrega. Documentar sistema visual según workflow aplicable, sin inventar identidad nueva.
- [ ] Aplicar skill de revisión de seguridad focalizada a rutas nuevas, filtrado de equipo, exportación y estado local. Una revisión independiente final conforme a `executing-plans` e Impeccable; atender defectos demostrados y repetir únicamente checks afectados antes de la comprobación final.
- [ ] Actualizar matriz y ledger con estado exacto y puertas externas pendientes. Detener servidores/contenedores QA propios, conservar servicios locales de usuario. Entregar enlaces, evidencia y limitaciones; sin declarar listos los módulos o la producción no comprobados.

## Revisión del plan

Cobertura: catálogo y 27 repositorios→1; sesiones/paginación→2; salud real→3; diseño/navegación/setups/borradores→4; evidencia/exportación→5; comercial/interfaz secundaria→6; aceptación y operación→7. Interfaces nuevas exactas bajo allowlist, con pruebas de identidad y respuestas tardías. No hay cambio del motor físico ni despliegue cloud escondido en tareas visuales. Método de ejecución preservado: nativo, aquí; revisión del plan pendiente.
