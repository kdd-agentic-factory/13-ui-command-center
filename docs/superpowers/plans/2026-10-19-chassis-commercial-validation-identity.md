# Chassis Commercial Validation and Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking. El usuario ya eligió ejecución nativa en esta sesión; conservarla.

**Goal:** Contrastar el subconjunto2D, ejecutar priorización de hallazgos con IA realmente local y proteger el flujo completo por identidad y membresía de equipo verificadas.

**Architecture:** Tres bloques entregables: validación2D, runtime local e identidad/aislamiento. Reutilizar InsForge para identidad y membresías, manteniendo telemetría y física en18. Toda ruta de datos restringidos requiere autorización o queda cerrada en modo autenticado; ningún header de actor/equipo concede permisos por sí solo.

**Tech Stack:** FastAPI/Python3.12, SQLite/JSON locales, PostgreSQL/RLS de InsForge, React/TypeScript/Vite, Ollama loopback, pytest/Vitest/Playwright.

**Spec:** ../specs/2026-10-19-chassis-commercial-validation-identity-design.md (aprobada por el usuario).

## Global Constraints

- No alterar raw ni enviar telemetría a servicios externos.
- Identidad InsForge validada en servidor; memberships activas en fuente autorizada. Sin fallback system ni identidad obtenida de headers.
- Roles: lector consulta; ingeniero importa/guarda; administrador gestiona membresías. Identificador seleccionado solo delimita una membresía existente.
- Datos legacy sin propietario quedan en cuarentena; nunca asignarlos automáticamente al primer usuario.
- Fuente2D sin referencia del fabricante continúa experimental. No sustituir referencia por otro lector de la misma hipótesis.
- Runtime IA exclusivamente loopback con OLLAMA_NO_CLOUD=1; sin firewall ni exposición de red. Solo agregados, sin muestras, GPS, notas ni identidades.
- No ejecutar migraciones cloud ni desplegar públicamente durante preparación. Preparar migraciones revisables, probarlas localmente y mantener bloqueado el modo autenticado si no están aplicadas.
- Reutilizar ramas y cambios existentes en13/17/18/21 sin sobrescribirlos. No commits, push ni publicaciones, conservando el alcance local anterior.
- Aplicar TDD y registrar decisiones/evidencia en docs/superpowers/plans/commercial-identity-execution-ledger.md. No afirmar capacidad comercial sin sus verificaciones.

## Review Focus

1. Respuestas tardías al cambiar equipo/logout: no repoblar estado/caché de otro ámbito; prueba en tarea7.
2. Membresía revocada mientras hay token válido: siguiente petición pierde acceso sin confiar en caché indefinida; tarea4.
3. UUIDs mezclados, operaciones idempotentes y rutas legacy/exportación: mismo operation_id en equipos distintos no colisiona ni filtra datos; tareas5–6.
4. Exportación2D interpolada o con unidades cambiadas: no certificar equivalencia de muestras ni ocultar desfases; tarea1.
5. Carga fría de Ollama y generación lenta: no bloquear servidor ni anunciar inferencia cuando se usa fallback; tareas2–3.

## Archivos y contratos

18: parsers/two_d_reference.py compara referencia sin modificar fuentes; identity/{models,insforge,memberships,dependencies,policy}.py concentra autenticación/autorización; recorded_store.py concentra lectura/escritura con propiedad; chassis/store.py aplica ámbito explícito. routers/teams.py sirve equipos/permisos del sujeto verificado. Scripts separados para referencia, runtime y migración legacy.

13: services/telemetryIdentity.ts administra transporte autorizado; contexto de equipo y selector operativo; servicios recorded/chassis consumen ese transporte. AuthContext mantiene identidad real y perfiles visuales diferenciados.

21: migración nueva numerada a continuación de las existentes para chassis_teams/chassis_team_memberships y RLS. No alterar políticas históricas para conceder acceso público.

`Principal(subject_id: str, team_id: str, role: Literal[reader,engineer,admin])` es inmutable. `require_principal(request, write: bool=False) -> Principal` verifica identidad/membresía. `load_recording(id, principal)` y todo método público de store exigen principal explícito en modo autenticado. Auditoría conserva subject_id/team_id/trace sin guardar tokens.

### Task 1: Contraste2D reproducible

**Files:** crear18/src/telemetry_dataset/parsers/two_d_reference.py,18/scripts/compare_2d_reference.py,18/tests/test_two_d_reference.py y18/docs/two-d-validation.md; ampliar documentación de importaciones.

**Interfaces:** `compare_reference(native_channel: dict, reference_channel: dict, metadata: dict) -> dict`. Metadatos obligatorios: medición, nombres originales, unidades, resolución/precisión del export, transformación temporal e interpolación. Resultado: estado, dimensiones comparadas, cobertura, diferencias de reloj/valores, tolerancia justificada y motivos de no validación.

- [ ] Escribir pruebas: igualdad dentro de resolución declarada; signo invertido; factor1000; desplazamiento temporal; muestra ausente; unidad no convertible; sin resolución; exportación interpolada. Un canal correcto no valida otras variantes.
- [ ] Ejecutar `.venv/Scripts/python.exe -m pytest tests/test_two_d_reference.py -q` desde18 y observar RED.
- [ ] Implementar comparación de la misma medición, sin remuestreo/desfase automáticos. CLI exige rutas explícitas y escribe informe fuera de raw con hashes; nunca transforma originales.
- [ ] Buscar referencia/Analyzer en ubicaciones habituales, listado de archivos y metadatos sin leer material ajeno. Si están disponibles, ejecutar contraste real local y registrar versión/configuración. Si faltan, registrar bloqueo concreto y mantener experimental; no instalar software con licencia ni aceptar EULA por el usuario.
- [ ] Repetir pruebas junto con test_two_d_package.py y test_verified_import.py; GREEN. Informe de fixtures y referencia real permanecen diferenciados.

### Task 2: Runtime local real y licencia trazable

**Files:** crear18/scripts/start_local_chassis_ai.ps1,18/scripts/check_local_chassis_ai.py,18/docs/local-chassis-ai.md y18/tests/test_local_ai_runtime.py.

**Interfaces:** `probe_runtime(endpoint, model) -> dict` devuelve presencia, identidad/digest, estado local, licencia registrada y disponibilidad; no envía hallazgos durante inventario. Arranque no abre puertos fuera de127.0.0.1.

- [ ] Pruebas RED: runtime ausente, puerto ocupado por otro servicio, alias remoto, instalación ya existente y modelo sin licencia registrada. El script no modifica una instalación ajena ni descarga silenciosamente otro modelo.
- [ ] Implementar instalación en directorio local KDD desde distribución oficial Ollama, verificar procedencia/hash y versión. Seleccionar candidato qwen3:4b cuantizado solo tras comprobar licencia de sus pesos y tamaño exacto; registrar digest. No confundir con qwen:4b ni variantes cloud. Si no cumple licencia comercial/RAM, registrar motivo y elegir candidato3–4B compatible antes de descargar.
- [ ] Iniciar proceso oculto con variables de proceso OLLAMA_HOST=127.0.0.1:11434 y OLLAMA_NO_CLOUD=1, sin cambiar firewall ni configuración global. Registrar PID propio para parada segura; descarga limitada al modelo elegido.
- [ ] Descargar modelo, comprobar /api/show local, licencia/digest y petición sintética. Medir carga fría separada y latencia caliente. No usar datos raw ni identidades en el smoke.
- [ ] Ejecutar test_local_ai_runtime.py y registrar salida real del probe. Si no termina instalación/inferencia, declarar el fallo y conservar reglas, sin marcar activación completa.

### Task 3: Inferencia útil sin bloquear física

**Files:** modificar18/chassis/{local_explainer,recommendations}.py,18/tests/test_local_explainer.py; ampliar check_local_chassis_ai.py.

**Interfaces:** conservar `explain_local(findings, model, endpoint) -> dict` con estados existentes; añadir metadatos de latencia/digest sin datos privados. Selección estricta de IDs/pruebas permitidas, sin texto mecánico libre.

- [ ] Pruebas RED: carga fría, timeout, respuesta parcial, respuesta mayor64KiB, JSON inválido, IDs duplicados/inventados, pruebas fuera de catálogo, endpoint remoto/redirección, alias remoto y prompt sin GPS/identidades/muestras.
- [ ] Mantener límiteHTTP8s de generación en petición operativa y preflight separado; calentamiento explícito fuera de comparación. Configurar contexto2048, temperatura0 y salida acotada a512tokens; deshabilitar razonamiento extenso cuando el modelo lo soporte. No aumentar tiempo de comparación sin evidencia.
- [ ] Ejecutar inferencia real con hallazgos sintéticos y luego agregados permitidos de una comparación del equipo autorizado; capturar selección aceptada o fallback real, latencia, versión/digest. Si hardware no cumple8s, mantener fallback visible y registrar que la priorización operativa sigue pendiente; no presentar mocks como inferencia.
- [ ] Ejecutar tests de hallazgos/local_explainer/recomendaciones y smoke real; GREEN y resultado reproducible.

### Task 4: Identidad y membresías autorizadas

**Files:** crear18/src/telemetry_dataset/identity/{__init__,models,insforge,memberships,dependencies}.py,18/routers/teams.py,18/tests/test_team_identity.py; modificar18/config.py/main.py; crear migración siguiente disponible en21/migrations y pruebasSQL locales. Leer skills insforge/insforge-cli y AGENTS antes de integración/migraciones.

**Interfaces:** `verify_identity(bearer: str) -> VerifiedIdentity(subject_id: str)` y `list_memberships(identity, bearer) -> list[Membership]`. GET /api/v1/teams devuelve exclusivamente equipos autorizados y rol. Equipo seleccionado por X-Team-ID, autorizado contra membresías actuales, no contra datos de perfil editables.

- [ ] Escribir pruebas RED de401 sin token/token inválido/caducado,503 proveedor no disponible,403 sin membresía o revocada; headers X-Actor-ID/X-Principal-* falsificados no cambian sujeto ni permisos.
- [ ] Verificar contrato oficial de InsForge y SDK instalado. Usar GET /api/auth/sessions/current en URL servidor fija HTTPS, timeout acotado, sin redirecciones, con bearer; validar respuesta user.id. La introspección del proveedor verifica token: no decodificar JWT sin firma como autorización. No enviar telemetría al proveedor.
- [ ] Crear tablas de equipos/membresías enlazadas a auth.users según contrato real. Membresía única(team_id,user_id), role enum reader/engineer/admin, active boolean y auditoría. RLS permite consultar propias membresías y administración solo por admin del equipo; cerrar autoasignación, cambio de user_id/team_id y escalada. Funciones privilegiadas fijan search_path y evitan recursión de políticas. Bootstrap inicial solo administrativo explícito.
- [ ] Consultar memberships mediante token de usuario y políticas verificadas, no anon con acceso abierto. Sin caché persistente de permisos. Endpoint/equipo deben estar configurados por servidor, sin URL controlada por cliente.
- [ ] Ejecutar pytest test_team_identity.py y pruebasSQL en base local aislada con dos equipos, cambios de rol y revocación. No aplicar migración cloud; documentar paso operativo pendiente y bloqueo si falta tabla.

### Task 5: Propiedad, migración y aislamiento persistente

**Files:** crear18/recorded_store.py,18/scripts/migrate_team_ownership.py,18/tests/test_team_store.py y18/tests/test_team_migration.py; modificar chassis/{store,service}.py,schemas/recorded-session.json,esquema chassis empaquetado y schema-version.yaml.

**Interfaces:** lectura/escritura con Principal explícito. Sesiones guardan team_id/created_by; SQLite objects incorpora team_id/created_by y unicidad(team_id,kind,operation). Binding/comparison no pueden referenciar IDs de otro equipo. El sujeto sirve para auditoría, equipo para colaboración.

- [ ] Pruebas RED: miembros del mismo equipo colaboran; equipoB no lee sesión/setup/estado deA; IDs y etiquetas no filtran existencia; mismo operation_id en dos equipos es independiente; mezclar sesiones/setups devuelve404; reader no escribe.
- [ ] Implementar versión de contrato major2 para propiedad obligatoria en modo autenticado y lectura histórica solo mediante modo local explícito/cuarentena. Filtro de equipo antes de devolver muestras o construir evidencia; nunca almacenar principal global mutable. Conservar la física pura de17 sin identidad.
- [ ] Migración con backup verificado, dry-run e inventario previo, transacción SQLite y diario paraJSON. Ficheros sin propietario permanecen en cuarentena. Adoptar requiere IDs enumerados, equipo destino, admin verificado y confirmación explícita; no ejecutar adopción real en preparación.
- [ ] Probar interrupción, reintento, restauración de backup y lectura legacy restringida. No mover/modificar raw. Ejecutar test_team_store.py/test_team_migration.py y suites previas de chasis adaptadas al principal explícito; GREEN.

### Task 6: Autorización completa de rutas y despliegue cerrado

**Files:** crear18/identity/policy.py y18/tests/test_team_route_isolation.py; modificar main.py/dependencies.py/routers/{recorded,chassis}.py y puntos de entrada restantes de datos; actualizar configuración/ejemplos/Docker y guía operativa.

**Interfaces:** `authorize_route(request, principal)` usa allowlist explícita del flujo protegido. Cualquier API desconocida de datos queda cerrada en modo autenticado. Health/version públicos sin información de usuarios/equipos; metrics protegidas operacionalmente.

- [ ] Generar inventario real de rutas y pruebas parametrizadas por método/path con equipoA/B, sin token, reader/engineer/admin. Incluir previews/full, geometría, inspección ZIP, catálogo/sesiones, imports legacy, math/anomaly/trajectory, export/digital_twin/storage, docs/OpenAPI y variantes slash. Observar RED.
- [ ] Autorizar recorded/chassis/teams según identidad/rol. Deshabilitar rutas legacy sin propiedad en modo autenticado antes de invocar handlers; no basta proteger la navegación. API key de servicio sigue separada, no permite saltarse identidad. Auditar denegaciones sin tokens ni contenido.
- [ ] Validar configuración al arranque: production exige modo authenticated/config de identidad y memberships; modo local solo explícito en desarrollo y loopback, nunca fallback de fallo de verificación. No retirar503 de producción hasta cumplir matriz de rutas y almacén.
- [ ] Pruebas de rutas nuevas no clasificadas, encabezados falsos, callbacks/redirecciones, ausencia de cookies/sesión, errores proveedor y concurrencia de equipos; GREEN. Comprobar rutas sensibles fuera de /api y CORS restrictivo.

### Task 7: Login/equipo en interfaz y transporte

**Files:** crear13/services/telemetryIdentity.ts,13/context/TeamContext.tsx,13/components/auth/TeamSelector.tsx y13/tests/teamIdentityUI.test.tsx; modificar AuthContext,servicios recordedTelemetry/chassisTelemetry,domain/recordedSession,ChassisPage,ConnectDataPage y proxyVite.

**Interfaces:** `telemetryRequest(path, init)` adjunta bearer obtenido por contrato públicoSDK, X-Team-ID autorizado y trace; no token en URL/localStorage. TeamContext expone equipo/rol validado y contador de ámbito para descartar respuestas tardías.

- [ ] Pruebas RED: requiere sesión real en modo autenticado; perfil visual no autentica; seleccionar equipo ajeno falla; logout/equipo nuevo limpian señales, resultados y selección; respuesta tardía deA no aparece enB; reader ve consulta y denegación real de escritura.
- [ ] Verificar método público de sesiónSDK (no acceder tokenManager privado). Refrescar sesión por contratoSDK; si falla, limpiar identidad y solicitar login. GET /teams determina opciones; UI no inventa equipo ni autoasigna administrador.
- [ ] Sustituir fetch de servicios del flujo por transporte común. Evitar propagar bearer a URLs arbitrarias o servicios no configurados; secreto de servicio sigue servidor. LocalStorage solo selección bajo claveusuario/equipo; jamás raw/token. Sesión preautenticación no se adopta automáticamente.
- [ ] Añadir selector compacto/estados401/403/503 y permiso por rol, conforme design.md. Operación local explícita permanece distinguida en banner. Ejecutar teamIdentityUI.test.tsx y regresiones recorded/chassis, tipos/build; GREEN.

### Task 8: Evidencia de entrega y revisión final

**Files:** crear13/tests/e2e/chassis-teams.spec.ts y docs/superpowers/plans/commercial-identity-execution-ledger.md; actualizar docs/chassis-operation.md y18/docs/{two-d-validation,local-chassis-ai}.md.

- [ ] Ejecutar E2E con dos equipos y usuarios de entorno de pruebas: login real si existe entorno autorizado, importación/calibración/comparación/consulta/logout y aislamiento. No crear cuentas productivas ni enviar invitaciones sin instrucción específica. Diferenciar fixtures autenticados de verificación con proveedor real.
- [ ] Ejecutar suites18 de identidad/aislamiento/lector/chasis y suites13; tipos/build/Ruff/diff-check, wheel aislado y Docker chassis-core. Medir importación grande manteniendo servidor responsive.
- [ ] Una revisión independiente final de contratos, límites de autorización, datos legacy y salidaIA; corregir importantes RED→GREEN y suite verde (skill executing-plans autoriza esta revisión, no delegación por tarea).
- [ ] Registrar evidencia separada: referencia2D real o bloqueo; inferencia local aceptada/latencia o fallback; aislamiento local real; migraciones cloud aplicadas/no aplicadas; operación producción validada/no validada. No llamar listo para vender si falta condición necesaria.
- [ ] Conservar cambios locales revisables y servicios de desarrollo en loopback. No publicar, adoptar datos legacy ni habilitar acceso multiusuario externo en esta preparación.

## Autorrevisión del plan

Cobertura: contraste2D tarea1; runtime/licencia tarea2; generación restringida tarea3; identidad/memberships/RLS tarea4; propiedad/backup tarea5; todas las rutas y configuración tarea6; UX/transporte/caché tarea7; integración/revisión tarea8. Interfaces Principal y transporte se reutilizan sin introducir identidad en17. Review Focus se cubre en tareas1,3,4,5,6,7. No hay cambios a datos reales implícitos, aplicación de migración cloud ni adopción automática. Dependencias4→5→6→7 se ejecutan secuencialmente;1 y2/3 son entregas propias dentro de esta misma sesión.
