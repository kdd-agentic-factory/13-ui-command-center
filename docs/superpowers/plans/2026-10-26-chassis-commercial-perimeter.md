# Chassis Commercial Perimeter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task in the current session. Steps use checkbox (`- [ ]`) syntax for tracking. The user already selected execution in this session; preserve that method. Request independent final review before declaring completion.

**Goal:** Preparar el perímetro1A de una entrega comercial de Chassis con identidad humana verificada, rutas mínimas y desarrollo local explícito conservado.

**Architecture:**18 publica un inventario revisable de rutas humanas a partir de su política existente, sin reemplazar permisos.13 incorpora un perfil comercial y genera la allowlist del proxy desde un manifiesto congelado y comprobado contra18. Nginx no publica rutas internas/históricas ni inventa identidades; backend conserva la decisión de autorización.

**Tech Stack:** React18, TypeScript/Vite/Vitest, Python/FastAPI/Pydantic/pytest y nginx con entrypoint POSIX; runtimes y dependencias existentes. Docker se usa solo si hay imagen local y aislamiento verificables, sin descarga.

**Spec:** `docs/superpowers/specs/2026-10-26-chassis-commercial-perimeter-design.md`, aprobado por el usuario el2026-10-26. El plan necesita revisión antes de implementación.

## Global Constraints

- «Chassis primero; cierre progresivo», elegido por el usuario.
- «No sustituye las capacidades existentes ni autoriza desplegar cloud.»
- «Se conserva el token humano Authorization y el selector X-Team-ID;18 vuelve a verificar ambos.»
- «No se inventan usuarios ni roles.»
- «Las rutas internas de ingeniería se deniegan siempre en el BFF».
- «Modo local, respuesta desconocida, fallo de consulta o cambio de ámbito bloquean acciones; no existe fallback a local.»
- «El servidor comercial requiere un upstream explícito validado; no adivina un host cloud.»
- «Los secretos no se imprimen ni se incluyen en estáticos.»
- «Se mantiene el límite100MiB de contenido del importador»; margen de transporte multipart finito y explícito.
- «Los datos raw, catálogos del operador y secretos son intocables.»
- Conservar checkouts y cambios previos autorizados; baseline y hashes propios. Sin commits/push/limpieza, instalaciones, migraciones, llamadas cloud, usuarios reales ni reinicio del servicio principal de desarrollo para activar un perfil comercial no configurado.
- Perfil1B, RLS/autoridad cloud, física,2D y federación quedan pendientes; no se acreditan por cerrar1A.

## Review Focus

- URL/body de importación2D con medición codificada en query: aceptar query válida sin abrir rutas internas codificadas; prueba en Task4/5.
- Usuario cambia de equipo durante refresh/respuesta: descartar resultado viejo y no conservar autorización local; prueba en Task2/5.
- Backend devuelve local o falla después de cargar la landing: la web sigue visible y las operaciones comerciales quedan bloqueadas; prueba en Task2/5.
- Prefijos/credenciales ambiguos del proxy: método incorrecto, trailing slash, barras duplicadas, rutas escapadas y cabeceras de servicio nunca abren rutas internas; prueba en Task1/4/5.
- Artefacto/proveedor mal configurado: variables genéricas no eluden perfil comercial; SDK no abre database/functions por otro camino; prueba en Task2/3/6.

## Estructura y contratos entre entregas

Todos los paths siguientes son relativos a la raíz `kdd-agentic-factory`, salvo comandos con cwd explícito.

-18 `identity/public_surface.py`: `HumanRoute(method: str, pattern: str, access: Literal['public','identity','team'])` e `human_route_inventory() -> tuple[HumanRoute, ...]`, con expresiones ancladas a ruta completa. Consume READ/WRITE y excepciones explícitas de la política existente; no concede roles.
-18 `scripts/export_chassis_surface.py`: CLI `--output <path>` o `--check <path>`; versión de contrato1.0 y huella de inventario canónico, sin secretos ni imports que inicien la aplicación.
-13 `deploy/chassis-surface.json`: manifiesto congelado de ese export. Contiene solo método/patrón/clase de acceso y versión, no datos ni hosts.
-13 `src/domain/productProfile.ts`: `ProductProfile = 'chassis' | 'local-development'`; `resolveProductProfile(value: string | undefined, production: boolean): ProductProfile`; `allowsProviderCapability(profile, capability) -> boolean`; `assertCommercialIdentity(profile, mode) -> void`. Capacidades: auth/database/storage/ai/functions/realtime. Solo auth habilitada por defecto para SDK comercial.
-13 `scripts/render-chassis-surface.mjs`: consume manifiesto y produce maps/includes nginx deterministas. CLI `--check` detecta drift sin reescribir; no evalúa regex arbitrarios ni obtiene datos por red.
-13 servidor: `KDD_TELEMETRY_HOST` obligatorio, `KDD_TELEMETRY_PORT`1–65535 con default443, HTTPS y verificación TLS; `KDD_TELEMETRY_API_KEY` opcional dedicada y solo servidor. Host no admite esquema/path/userinfo/query/fragmento ni selección por request. Ruta de CA de prueba solo en fixture; producción usa trust store del contenedor.
- Perfil build/UI `VITE_PRODUCT_PROFILE=chassis|local-development`; default chassis para build productivo, local-development para Vite dev. Backend `TDS_PRODUCT_PROFILE` con los mismos valores, default local-development para compatibilidad; perfil chassis exige app_env production e identidad authenticated con proveedor válido.
- No se cambia la versión del JSON de grabaciones, snapshots o física; el manifiesto de perímetro tiene versión propia. Documentar su contrato operativo sin tocar esquemas de datos ajenos.

### Task1: Inventario humano comprobado y contrato de superficie

**Files:** Create18/src/telemetry_dataset/identity/public_surface.py;18/scripts/export_chassis_surface.py;18/tests/test_public_surface.py;13/deploy/chassis-surface.json. Read18/identity/{policy,dependencies}.py.

**Interfaces:** Produce HumanRoute y human_route_inventory arriba; incluye GETidentity/mode y GEThealth públicos, GETteams con identidad, READ/WRITE y los dos endpoints de designaciones especiales con equipo. Solo métodos reales, sin prefijo engineering abierto; excluir ENGINEERING_SERVICE_PATHS/CONTROL_PATHS y docs/export/apis legacy.

- [ ] Crear baseline restringido de archivos a modificar y leer AGENTS/gobierno aplicables. Registrar commits de referencia sin cambiar ramas ni copiar payloads/secretos.
- [ ] Escribir tests `test_surface_contains_real_human_routes`, `test_surface_never_contains_internal_routes`, `test_admin_designation_is_not_granted_by_inventory`, `test_surface_rejects_unknown_method_and_path`: import/teams/report presentes; internalcontrol/tools y export ausentes; PUTdesignación sigue denegado para engineer por política real.
- [ ] Ejecutar desde18 `.venv/Scripts/python.exe -m pytest tests/test_public_surface.py -q`; registrar RED por inventario ausente, no por errores de fixture.
- [ ] Implementar inventario puro y export/check canónico. Deduplicar método/patrón sin ampliar la política; validar patrones soportados antes de generar nginx. Probar que no se inicia aplicación ni se carga una credencial al exportar.
- [ ] Ejecutar tests nuevos y `tests/test_team_identity.py tests/test_team_route_isolation.py`; GREEN. Exportar con `.venv/Scripts/python.exe scripts/export_chassis_surface.py --output ../13-ui-command-center/deploy/chassis-surface.json` y verificar con `--check ../13-ui-command-center/deploy/chassis-surface.json`; este último debe fallar con drift controlado. Punto revisable: rutas concretas y excepciones prelogin.

### Task2: Perfil cliente, identidad comercial y accesos SDK directos

**Files:** Create13/src/domain/productProfile.ts;13/tests/productProfile.test.ts;13/tests/commercialIdentityUI.test.tsx;13/tests/providerSurface.test.ts. Modify13/src/context/TeamContext.tsx;13/src/lib/insforge.ts;13/src/components/auth/TeamSelector.tsx;13/vite.config.ts;13/Dockerfile;13/src/services/foundingNodeLeads.ts. Gate direct-call consumers as needed:13/src/domain/{sessionContext,circuits,garageProfile,decisions}.ts;13/src/hooks/{useInsForgeData,useAIChat,useBlueprintBrief}.ts;13/src/pages/PlatformConsolePage.tsx. No refactor unrelated UI.

**Interfaces:** Consume ProductProfile and provider capability helpers. Auth sigue usando cliente/issuer existentes; no implementar JWT manual. SDK comercial no permite database/storage/ai/functions/realtime sin aceptación explícita futura. Los consumidores históricos quedan inactivos con estado visible, sin fallback de éxito ni falsa persistencia. Chassis usa18.

- [ ] Leer skillInsForge y design.md antes de modificar integración/componentes. Inventariar cada llamada directa y qué estado verá el usuario al estar fuera de entrega.
- [ ] Escribir tests con assertions: `resolveProductProfile(undefined,true)==='chassis'`, `resolveProductProfile(undefined,false)==='local-development'`, valor desconocido lanza; auth permitida, database/functions denegadas en chassis; desarrollo explícito conserva acceso.
- [ ] Tests UI `commercial_rejects_local_or_unknown_mode`, `commercial_error_keeps_workspace_locked`, `commercial_waits_for_verified_team`, `scope_change_discards_pending_response`; no mutación antes de modo/usuario/equipo verificados. Error del SDK no debe convertirse en guardado correcto o sesión prefijada.
- [ ] Ejecutar desde13 `npm test -- --run tests/productProfile.test.ts tests/commercialIdentityUI.test.tsx tests/providerSurface.test.ts`; registrar RED.
- [ ] Implementar helpers puros y gates. Preservar AuthContext login/refresh y el actor humano del backend. Same-origin obligatorio para telemetría en build comercial; quitar defaults operativos históricos del Dockerfile y previews. API de captación solo con VITE_LEAD_CAPTURE_URL explícita; sin endpoint, informar no disponible antes de enviar, sin callback de éxito.
- [ ] GREEN de tests nuevos, `tests/teamIdentityUI.test.tsx tests/teamSelectionDraft.test.tsx tests/chassisProductEntry.test.tsx` y typecheck. Verificar que el perfil de desarrollo sigue abriendo Chassis y mantiene borradores. Punto revisable: capacidad bloqueada frente a autenticación conservada.

### Task3: Perfil backend comercial que falla cerrado

**Files:** Modify18/src/telemetry_dataset/config.py;18/src/telemetry_dataset/identity/dependencies.py solo si hace falta centralizar la comprobación. Create18/tests/test_commercial_profile.py. Read/reuse18/tests/test_production_hardening.py y tests/test_team_identity.py.

**Interfaces:** TDS_PRODUCT_PROFILE acepta únicamente chassis/local-development. En chassis, exige app_env production e identidad authenticated; proveedor se valida por mecanismos existentes. Una variable APP_ENV genérica no invalida el significado del perfil. No modificar permisos/pertenencia/grants.

- [ ] Escribir tests `commercial_profile_rejects_local_identity`, `commercial_profile_rejects_container_or_unknown_environment`, `commercial_profile_requires_valid_identity_provider`, `prefixed_env_alias_does_not_silence_commercial_contract`, `explicit_local_development_is_preserved`.
- [ ] Ejecutar desde18 `.venv/Scripts/python.exe -m pytest tests/test_commercial_profile.py -q`; registrar RED.
- [ ] Implementar validación de perfil reutilizando Settings/setup_identity; secretos reprfalse y mensajes sin valores. No requerir acceso al emisor cloud para testear configuración. Usar `_env_file=None`, entorno allowlisted y valores dummy en fixtures; no heredar ni leer secretos reales.
- [ ] GREEN junto a producción/identidad/aislamiento. El fixture comercial autenticado usa proveedor de control y datos aislados, sin aplicar SQLcloud. Punto revisable: arranque inválido rechazado, modos autorizados preservados.

### Task4: Proxy nginx mínimo y bootstrap seguro

**Files:** Create13/scripts/render-chassis-surface.mjs;13/deploy/chassis-surface.map.conf;13/docker/15-validate-chassis-env.sh;13/tests/chassisProxyConfig.test.ts;13/deploy/chassis-perimeter.md. Modify13/default.conf.template;13/Dockerfile;13/package.json. Conservar13/nginx.conf como desarrollo explícito documentado, nunca fallback comercial.

**Interfaces:** Consume manifiesto Task1 y genera maps para "$request_method:$uri" con defaultdeny. Prelogin permitido solo según inventario; resto requiere cabecera Bearer presente y backend verifica token/equipo. No se presenta presencia de Bearer como verificación criptográfica. Proxy no fija principal/rol/tenant.

- [ ] Escribir tests de generación/bootstrap: GETteams se clasifica identity, grabación humana permitida por método, internalcontrol denegado, POSTa un GET denegado; manifiesto inválido/no soportado falla; host ausente, userinfo, path o newline y puerto inválido rechazan configuración. Generación determinista y `--check` detecta cambios.
- [ ] Tests de política de cabeceras: solicitudes que aporten InternalAPIKey/Principal/ExecutionGrant/CoordinatorCapability se rechazan403 antes del upstream. Authorization/X-Team-ID y trazas humanas se conservan; X-API-Key entrante no se reutiliza y la dedicada del servidor nunca se devuelve.
- [ ] Ejecutar desde13 `npm test -- --run tests/chassisProxyConfig.test.ts`; RED antes de generar código.
- [ ] Implementar plantilla sin proxies genéricos/históricos. URI no permitida404; anónimo a ruta privada401. Rechazar paths ambiguos/escapados antes de resolver allowlist, conservando query codificada de medición2D válida. HTTPSupstream con SNI y verificaciónCA; sin proxy variable elegida por request.
- [ ] Establecer `client_max_body_size 102m`: margen multipart finito;18 mantiene100MiB de contenido. `proxy_read_timeout 180s`, `proxy_connect_timeout 10s`, `proxy_send_timeout 180s`; no confundir timeout con cancelación instantánea del SDK. Cabeceras de respuesta nunca contienen secretos ni identidades de servicio.
- [ ] GREEN de configuración/export y build del perfil comercial. Registrar explícitamente que tests de texto/render no acreditan nginx operativo. Punto revisable: template/include/bootstrap sin escape al perfil legacy.

### Task5: Aceptación con nginx real y backend aislado

**Files:** Create13/tests/perimeter/run_local_perimeter.py;13/tests/perimeter/upstream_fixture.py;13/tests/perimeter/test_proxy_http.py;13/tests/e2e/chassis-perimeter.spec.ts;13/playwright.perimeter.config.ts. Reuse/extend18/tests/team_e2e_server.py y fixtures de autoridad SQL existentes solo si necesarios para verificar no regresión, sin tocar cloud.

**Interfaces:** Harness devuelve resultado JSON `status: passed|failed|blocked`, checks, runtimes/digests y blockers. Nunca devuelve passed si nginx, certificados de control o aislamiento no existen. Puertos loopback asignados dinámicamente; ninguna URLcloud por defecto. Proveedores/identidades de control están marcados sintéticos; backend/store/proxy son reales.

- [ ] Inventariar runtime/imágenes locales sin descargar. Preparar entorno vacío allowlisted, red interna/loopback aislada sin salida externa, source/tools readonly y scratch exclusivo, límitesCPU/RAM/PIDs/disco/tiempo. No montar secretos/socketDocker en contenedores bajo prueba. Si falta control requerido, registrar blocked y no ejecutar el objetivo sin aislamiento.
- [ ] Ejecutar nginx real renderizado y `nginx -t`; servir upstreamTLS de control conCA de fixture y comprobar queCA incorrecta falla. Registrar huella de config/imagen; no inspeccionar servicios principales.
- [ ] Probar víaHTTP real web/liveness, modo prelogin, anónimo401, token inválido401, equipo ajeno403/404; reader no escribe, engineer no designa titular y admin no adquiere por ello aprobación física. Probar dos equipos con grabaciones propias y datos de control fuera del catálogo principal.
- [ ] Probar todas las rutas internas/legacy y variantes de barras/escape, métodos erróneos, cabeceras internas falsas y endpoints genéricos InsForge: sin llegada al upstream protegido. Query measurement2D codificada sigue llegando intacta en una ruta permitida; no se llama al fabricante ni se certifica2D.
- [ ] Probar proxy ante backend local/desconocido/caído y cambio de equipo durante refresh. Página pública conserva disponibilidad; operaciones comerciales bloqueadas, sin éxito ficticio. Validar que parámetros/grants internos no pasan por BFF humano.
- [ ] Ejecutar navegador con configuración local explícita: `npx playwright test --config playwright.perimeter.config.ts`. No ejecutar `playwright.production.config.ts`, cuyo default apunta a un servicio externo.
- [ ] Guardar logs mínimos sin credenciales, resultados y limitaciones. Si este banco queda bloqueado, conservar código/preparación y no cerrar el gate operativo1A.

### Task6: Revisión final, artefacto y evidencia de cierre

**Files:** Create13/docs/chassis-commercial-perimeter-acceptance-2026-10-26.md;13/.superpowers/sdd/2026-10-26-chassis-commercial-perimeter/{progress.md,source-manifest.json,review.md}. Update13/docs/chassis-operation.md;13/docs/product-completion-matrix.md. No modificar expedientes anteriores.

**Interfaces:** Aceptación enumera gates de1A `passed|failed|blocked` por evidencia; lista1B/cloud/2D/física como pendientes separados. No usar un resumen todoverde para ocultar un banco bloqueado.

- [ ] Verificar export/check del inventario, tests nuevos y suites afectadas con resultados frescos. Ejecutar13 `npm run typecheck`, `npm test`, `npm run build` en perfil comercial y build local explícito; registrar cualquier fallo previo separadamente sin rebajar tests.
- [ ] Ejecutar regresión18 de identidad/producción/grants y aislamiento; ampliar al resto solo si el delta o fallos lo justifican. No atribuir903/139 históricos a esta versión.
- [ ] Inspeccionar bundle/artefacto comercial: sin secretos ni defaults de URLs operativas históricas; previews no habilitados. Buscar fixtures de control propios, sin leer/imprimir credenciales del operador.
- [ ] Solicitar revisión independiente del delta completo, con baseline, spec y evidencia; corregir hallazgos importantes y repetir solo verificaciones afectadas.
- [ ] Congelar hashes/archivos modificados y documentar rollback de artefactos. No ejecutar rollback ni reiniciar el stack principal para activar un perfil comercial sin autoridad/proveedor configurados.
- [ ] Actualizar matriz: solo gates realmente probados cerrados; proveedores directos/RLS cloud, release/storage/CI/backups1B y validación metrológica permanecen abiertos. Presentar resultado concreto y siguiente bloque, sin declarar producto listo para venta general.

## Autorrevisión del plan

Cobertura: contrato/excepciones→Task1; identidad/SDK/UI/desarrollo→Task2; startupbackend→Task3; rutas/headers/TLS/upload/proxy→Task4; tráfico real/aislamiento/casos ambiguos→Task5; evidencia/revisión/no claims cloud→Task6. Firmas entre tareas coinciden. Los cinco ReviewFocus tienen sus pruebas asignadas. No se prescribe despliegue, otro issuer, nuevos sensores ni una autoridad paralela. Sin commits por la conservación autorizada del workspace.

## Handoff

Método conservado: ejecución en esta sesión mediante executing-plans, tareas secuenciales y revisión final independiente. Pendiente de que el usuario confirme que el plan refleja lo aprobado; no se solicita elegir de nuevo el método.


## Ejecución autorizada y estado

Aprobado por el usuario para ejecución en esta sesión. Entregas1–4 implementadas; entrega5 parcial (32 controles de transporte, cadena completa y navegador bloqueados). Revisión final y correcciones realizadas; no se marcan como cumplidos los checks de aceptación completa ni de eliminación del código histórico del paquete. Evidencia detallada: ../../chassis-commercial-perimeter-acceptance-2026-10-26.md. No se despliega ni se migra cloud.

Continuación1A: el check de artefacto compilado del Task6 queda verificado con build real y control negativo de endpoint histórico; ajustes y public assets se separan por perfil. Desarrollo conserva activos y opciones. Las variables VITE no allowlisted quedan fuera del comercial. Los checks de cadena completa/browser/cloud continúan abiertos.
