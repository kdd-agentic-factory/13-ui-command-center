# Chassis Visual Workshop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Inline execution in this session is preserved; independent review at the end.

**Goal:** Integrar cuatro vistas vectoriales de Chassis Tool, cálculos trazables, Target Lock y órdenes de taller bajo autoridad humana, sin resultados ficticios.

**Architecture:** 17 mantiene física pura SI;18 autoriza, calcula y persiste revisiones, fichas, escenarios y órdenes;13 comparte un único borrador y dibuja resultados del servidor. Se reutilizan identidad, evidencia, propuestas y eventos humanos; la nueva visualización no amplía silenciosamente la capacidad de la IA.

**Tech Stack:** Python/Pydantic/FastAPI/SQLite y React/TypeScript/SVG/CSS existentes. Sin nuevas dependencias de producto, Three.js, CAD específico ni servicios externos.

**Spec:** `docs/superpowers/specs/2026-10-26-chassis-visual-workshop-design.md`. Núcleo aprobado; anexo de dinámica en curva concretado tras petición del usuario y pendiente de confirmación junto con este plan. No comenzar implementación hasta esa revisión.

**Estado de ejecución 26-Oct:** plan y anexo aprobados por el usuario. Código de las diez entregas integrado y activación local de inspección realizada. La aceptación física/comercial NO está cerrada: anti-squat numérico bloqueado, contraste 2D externo pendiente y flujo positivo completo de orden/aplicación/finalización con autoridad productiva no demostrado. Las casillas originales no se marcan en bloque porque algunas exigen esas evidencias. Resultados, decisiones, seis correcciones de revisión y límites en `docs/chassis-visual-workshop-acceptance-2026-10-26.md` y ledger de esta fase.

## Global Constraints

- SVG esquemático explícito; las tres vistas aprobadas y la cuarta de curva conservan contexto de equipo/circuito/moto/piloto/tipo de sesión.
- Un único borrador B; A es la revisión seleccionada como referencia, sin mutación.
- El servidor es la autoridad de cálculo, guardado, comparación, permisos y estado de orden.
- Metros/radianes/newtons canónicos; unidades de presentación, origen, incertidumbre y revisión conservados. Sin NaN/inf ni imputar datos ausentes.
- Sin presets ficticios ni copia de torque, coeficientes, Flow Score o diagnósticos del prototipo.
- Source2D experimental, autoridad local deshabilitada y las seis métricas actuales de IA conservan sus límites.
- No se aplica migración cloud, publica, instala dependencias ni cambia modelo/presupuesto de IA como efecto lateral.
- Continuar sobre la base dirty/untracked aceptada, con baselines y manifiesto previos; sin reset/clean/commit/push. Registrar la excepción a worktree al iniciar ejecución.
- Fuentes leídas en tests como solo lectura, almacenamiento/identidades de prueba efímeros. No crear fixtures en la base principal ni exportar telemetría restringida.
- Los seis dominios avanzados de la hoja de ruta no se anuncian implementados por añadir esta vista.

## Review Focus

1. Respuesta de cálculo tardía después de cambiar equipo/sesión o editar B: debe descartarse; Task5 prueba cambio de contexto y de generación de borrador.
2. Revisión de ficha o designación cambiada entre preflight y liberación: no puede publicarse orden ejecutable; Task8 prueba carrera transaccional y revocación.
3. Geometría degenerada/parametrización insuficiente: no debe dibujar IFC infinito, inventar compensación ni confundir límite de cómputo con inviabilidad física; Tasks3/6.
4. Resultado agregado de curva confundido con diagnóstico por rueda o con telemetría: Task7 verifica etiquetas, procedencia y ausencia de diagnóstico de caída.
5. Revisión histórica sin campos nuevos o llamada antigua: no pierde datos, no genera cambios mecánicos ni altera aprobación; Tasks1/4/9 prueban ida/vuelta y hashes existentes.

## Mapa de archivos y contratos

Rutas desde cada repositorio;17=`17-digital-twin-simulation-lab`,18=`18-telemetry-dataset`,13=`13-ui-command-center`.

-17 `src/digital_twin_lab/chassis/workshop_models.py`: DTOs mecánicos y resultados; `planar_pose.py`, `chain_geometry.py`, `target_lock.py`, `cornering.py`: responsabilidades puras separadas. `models.py` amplía setup de forma opcional sin cambiar valores históricos.
-18 `src/telemetry_dataset/chassis/workshop/{models,store,specifications,preview,target_lock,orders,reports}.py`: contratos, persistencia, fichas, cálculo, compensación, orden y anexo. `routers/workshop.py`: rutas independientes dentro de la autorización existente.
-13 `src/domain/chassisWorkshop.ts`, `src/services/chassisWorkshop.ts`, `src/hooks/useChassisWorkspace.ts`: contratos, transporte y único estado. `components/chassis/workshop/`: shell, vistas y controles por responsabilidad. `styles/chassis-workshop.css`: tokens existentes.
- Actualizar modelos/servicio de setup, middleware/rutas autorizadas y contratos/snapshots/reportes solamente donde la extensión lo requiera; sin cambiar la semántica de Analysis ni el contrato de decisión de los agentes.
- Esquemas nuevos18 `chassis-workshop-{specification,preview,target-lock,cornering,order}.json`, registrados en `schema-version.yaml`; versión inicial1.0.0. Versionar además el contrato existente afectado y conservar lectura histórica. Los nuevos campos opcionales ausentes no se materializan en hashes históricos.

DTOs definidos en Task1: `MechanicalSetup` (entradas con marco y procedencia), `ComponentConfiguration` (valores medidos/registrados por clave declarada), `ComponentSpecification` y `SpecificationRef` (id/revision/digest), `WorkshopPreviewInput/Result`, `PoseInput/Result`, `ChainResult`, `TargetLockInput/Result`, `CorneringInput/Result`, `WorkshopOrderInput/Order`. Todos son cerrados, sin campos extra. Resultados declaran versión, cobertura, missing/warnings, huella y supuestos. Magnitud ausente no es0.

Las nuevas APIs cuelgan de `/api/v1/chassis/workshop`, con los mismos headers de identidad/auditoría y verificación de membresía que chassis. No confiar en team_id/actor_id/estado de aprobación enviados en body. Las mutaciones aceptan operation_id y expected_revision cuando corresponda.18 puede generar schemas desde DTOs;13 tiene paridad mediante fixtures públicas sintéticas, nunca una reimplementación física.

## Verificación y entorno

Ejecutar cada comando pytest descrito dentro del banco aislado existente: herramientas confiables en `C:/Users/usuario/.codex/tmp/kdd-actionable-ai-tools-20261026`, fuentesRO, sin red externa. El runner actual admite01/02/18; para17 preparar una variante externa con mounts explícitos17/src y17/tests, conservando límites/aislamiento. No ejecutar código del checkout con permisos del host como atajo.

El banco UI actual permite SSR y typecheck, no acredita Vitest/build nativo. Ampliar fuera del checkout su lista explícita de tests para los nuevos `.check.mjs`. Intentar pruebas nativas/build solo en un entorno compatible y acotado; si falta binario, registrar bloqueo real, sin instalarlo ni darlo por aprobado. SQL usa PostgreSQL efímero del harness anterior; no base cloud. Cada tarea conserva salida RED/GREEN, diffs y manifiesto, sin commits por la restricción de sesión.

### Task1: Contratos versionados de setup mecánico, fichas y cobertura

**Files:** crear17 `src/digital_twin_lab/chassis/workshop_models.py`; modificar17 `chassis/models.py`; crear18 `chassis/workshop/__init__.py`, `models.py` y schemas; modificar18 `chassis/models.py`, `chassis/service.py`, `schema-version.yaml`; crear13 `src/domain/chassisWorkshop.ts`; extender13 `src/domain/chassisComparison.ts`.

**Interfaces:** `SetupInput/SetupRevision.mechanical: MechanicalSetup | None`, `.component_configuration: ComponentConfiguration | None`, `.specification_refs: list[SpecificationRef]` opcionales y omitidos cuando ausentes. `MechanicalSetup` separa puntos de chasis/basculante, centros/radios de rueda, dirección/offset, transmisión y pose de referencia. Entradas compatibles con el marco explícito de la spec; no exigir el conjunto completo para guardar una revisión parcial.

- [ ] Escribir `18/tests/test_workshop_contracts.py`: legacy sin claves nuevas serializa exactamente como antes; guardar/restaurar entrada parcial conserva unidad/origen/incertidumbre; rechaza coordenada no finita, torque negativo, unidad incompatible, referencia extra y límite máximo menor que el mínimo del rango; configura clicks con cero/sentido explícitos, sin mapa de fuerzas implícito. Comprobar setup.parent_id de otra moto rechazado.
- [ ] Ejecutar `pytest tests/test_workshop_contracts.py -q` dentro de18 y observar FAIL por contrato ausente.
- [ ] Implementar DTOs y extensión aditiva; mantener keys de values existentes, sin introducir claves mecánicas libres en su diccionario. Actualizar `service.revision(data)` para no perder la extensión; conservar huellas legacy y versionar payload nuevo cuando exista.
- [ ] Repetir focal y tests existentes `test_chassis_api.py`, `test_chassis_package.py`; esperar PASS. Añadir fixture de paridad Python/TS y comprobar los esquemas empaquetados.

### Task2: Fichas de componente y almacenamiento trazable por equipo

**Files:** crear18 `chassis/workshop/store.py`, `specifications.py`, `routers/workshop.py`; modificar18 `main.py` y puntos de clasificación/autorización existentes localizados al ejecutar; crear13 `src/services/chassisWorkshop.ts`; tests18 `test_workshop_specifications.py`, `test_workshop_identity.py`.

**Interfaces:** `create_specification(input, principal, audit) -> ComponentSpecification`; `verify_specification(id, expected_revision, principal, audit) -> ComponentSpecification`; `get_specification(id, principal)`. APIs POST/GET `/specifications`, POST `/specifications/{id}/verify`. Ficha inmutable por revisión; verificar produce revisión nueva con autor, fuente/página y digest. Engineer/admin, nunca reader, puede aportar/verificar según permisos existentes. Sin rol nuevo de mecánico ni poder de Crew Chief implícito.

- [ ] Tests RED: fuente vacía impide verified; lector no muta; equipoB no enumera/lee/verifica fichaA; body no suplanta equipo/verificador; idempotencia misma petición devuelve misma revisión, distinto payload409; un historial antiguo conserva referencia inmutable. Ejemplo de torque del adjunto no aparece en fichas nuevas.
- [ ] Ejecutar ambos ficheros de tests y observar fallo antes de implementar.
- [ ] Implementar almacenamiento aditivo transaccional, versiones y estado aportado/verificado; no asignar registros antiguos sin propietario. Material documental como referencia sin fetch automático de URLs ni importación de adjuntos como autoridad.
- [ ] Ejecutar focal+identidad anterior. Comprobar router dentro de middleware y reglas de rutas: ninguna nueva mutación/lectura queda fuera del control de equipo. PASS requerido.

### Task3: Pose plana, cadena y IFC con dominio explícito

**Files:** crear17 `chassis/planar_pose.py`, `chain_geometry.py`; tests17 `tests/unit/test_workshop_pose.py`, `test_workshop_chain.py`; crear18 `docs/chassis-workshop-physics-basis.md`.

**Interfaces:** `evaluate_pose(input: PoseInput) -> PoseResult`; `evaluate_chain(input: PoseInput) -> ChainResult`. PoseResult entrega puntos y segmentos SI etiquetados además de métricas, para SVG. ChainResult separa tangente/IFC geométricos y porcentaje anti-squat validado o no disponible. No confundir definición geométrica con respuesta causal de suspensión.

- [ ] Documentar antes del código el marco, signos, ecuaciones/hipótesis y referencia independiente primaria del modelo. Consultar fuentes técnicas primarias para anti-squat y cierre geométrico; registrar URL/edición/sección y casos numéricos, no aceptar coeficientes del prototipo. Si no se encuentra contraste suficiente, fijar capacidad anti_squat=`unavailable`, motivo `independent_reference_missing`; no bloquear el resto ni presentar porcentaje.
- [ ] RED: avance reproduce `.100729517237m` del caso existente R=.3/rake24°/offset.03; transformación rígida mantiene longitudes; ruedas en suelo cumplen residual declarado; datos insuficientes devuelven missing sin pose inventada; cambios de piñón no mueven eje fijado. Tangente de círculos iguales es paralela a centros, intersección analítica exacta de dos líneas conocida; líneas paralelas/casi paralelas no retornan IFC finito; cadena imposible y pasos/dientes incompatibles se rechazan. Sensibilidades por perturbación se contrastan con diferencia independiente, sin matriz fija.
- [ ] Ejecutar tests17 y observar FAIL; implementar funciones puras. La pose reconstruida requiere todos los anclajes y restricciones del modelo rígido documentado; una curva rueda/amortiguador aislada no sustituye esas coordenadas. Estado `unsupported_kinematics` cuando la configuración no permite resolverla.
- [ ] Repetir focal+`test_chassis_physics.py`+`test_chassis_linkage.py`; verificar ningún NaN/overflow, infinidades dibujables ni recorte silencioso. PASS requerido; si anti-squat no se habilita, dejar prueba explícita de su bloqueo y datos/fuente pendientes.

### Task4: Preview autorizado, replay y escenarios de aceleración

**Files:** crear18 `chassis/workshop/preview.py`; ampliar router Task2; modificar18 `chassis/engineering/snapshots.py` y `technical_context.py` solo para integridad de extensiones; tests18 `test_workshop_preview.py`, `test_workshop_snapshot.py`; ampliar13 service Task2.

**Interfaces:** `build_preview(input: WorkshopPreviewInput, principal, audit) -> WorkshopPreviewResult`, POST `/preview`; `WorkshopPreviewInput` identifica recording opcional, setup/revisión o borrador B explícito, referencia A y modo static/recorded/quasistatic_scenario. Recorded incluye tiempo y calibraciones separadas por canal, no índices alineados supuestos. Result incluye input_digest/model_version y fragmentos PoseResult/cargas/curva con cobertura independiente.

- [ ] RED: draft de otra moto o referencia ajena404/422; replay sin calibración/tiempos compatibles no produce pose; sin datos delanteros no se reutiliza amortiguador como horquilla. Huecos/muestras fuera de rango no se interpolan por defecto. En escenarios -1.4g/0/+1.1g el cálculo usa9.80665 y conserva pérdida de contacto como bloqueo; clicks no cambian recorrido mediante constantes. Experimental2D no fundamenta órdenes aunque exista preview etiquetado.
- [ ] Ejecutar focal; implementar usando Task3, carga y curva existentes. Sin modelos suficientes, devolver cargas y pasos faltantes, no hundimiento. No persistir en preview ni alterar binding/montaje.
- [ ] Añadir prueba snapshot: cambio mecánico cambia digest nuevo; claves ausentes conservan canonicalización legacy; los seis tipos de referencia de IA no admiten nuevas magnitudes accidentalmente. Ejecutar focal y pruebas existentes de snapshots/decisiones. PASS requerido.

### Task5: Shell visual de tres vistas y un único borrador

**Files:** crear13 `src/hooks/useChassisWorkspace.ts`, `components/chassis/workshop/{ChassisWorkshop,GeometryView,ForkView,RearView,PartInspector,WorkshopControls}.tsx`, `styles/chassis-workshop.css`; modificar `ChassisPage.tsx`, `ChassisComparison.tsx`, `SetupEditor.tsx` y tipos compartidos para reutilizar estado; tests `tests/chassisWorkshopUI.test.tsx`, `tests/chassisWorkshop.check.mjs`, `tests/e2e/chassis-workshop.spec.ts`.

**Interfaces:** `useChassisWorkspace(context) -> {referenceA,draftB,draftGeneration,preview,editB,selectReference,calculate,saveAlternative}`; `ChassisWorkshop({workspace,context,onPrepareOrder})`. La selección de referencia A y edición explícita de su ficha existente se conservan como acciones de revisión; el visor solo edita B. No llamar bindSetup al mover sliders ni interpretar binding como montaje físico. Mantener el flujo legacy accesible sin duplicar borrador/cálculos.

- [ ] RED SSR/RTL: tres pestañas, lista accesible de piezas, sin sesión/presets/métricas por defecto; explosión0/100 y corte solo modifican vista; inputs y +/− comparten valores con editor. Ficha desconocida dice pendiente, nunca muestra nombres/torques comerciales inventados.
- [ ] RED interacción: editar B no muta A; una respuesta de preview de generación anterior o de equipo/sesión anterior se descarta; cambio de contexto pide tratar borrador mediante protección existente; errores de guardado mantienen B y resultados anteriores etiquetados como antiguos.
- [ ] Ejecutar tests para observar FAIL. Leer `design.md` y craft-floor de Impeccable antes de editar UI; implementar CSS con tokens, sin tarjetas anidadas, sin estilos masivos copiados del adjunto. Las capas SVG usan exclusivamente coordenadas del preview o esquema educativo sin escala claramente separado.
- [ ] Ejecutar SSR focal, RTL si entorno compatible, typecheck y regresiones de comparación/sesión. Revisar foco de pestañas, alternativa a sliders, reduced-motion y estados faltantes. No llamar éxito a interacción no ejecutada.

### Task6: Target Lock verificable y explícito

**Files:** crear17 `chassis/target_lock.py`,18 `chassis/workshop/target_lock.py`,13 `components/chassis/workshop/TargetLockPanel.tsx`; tests17 `test_workshop_target_lock.py`,18 `test_workshop_target_lock_api.py`,13 tests de interacción.

**Interfaces:** `solve_target_lock(input: TargetLockInput) -> TargetLockResult`; POST `/target-lock`. Input tiene revisión/digest objetivo, rake/trail y tolerancias positivas, actuadores permitidos con límites y paso físico de ficha verificada. Result status feasible/infeasible/missing_inputs/out_of_domain, residual por objetivo, límites activos, propuesta de cambios y evaluations. Consume evaluate_pose y no una matriz del prototipo.

- [ ] RED: óptimo ya presente no propone cambios; objetivo imposible da infeasible; variable omitida/modelo insuficiente missing_inputs; torque o autorización no se deducen de factibilidad. Cuantización y límites se cumplen exactamente; una respuesta factible coincide con recalcular la pose propuesta y sus tolerancias.
- [ ] Implementar búsqueda determinista sobre el producto finito de posiciones permitidas, máximo5000 evaluaciones por solicitud. Si se supera, out_of_domain con motivo `search_space_limit`, no infeasible. Priorizar minimizar suma de desplazamientos normalizados por recorrido permitido entre soluciones factibles; desempatar por orden explícito de actuadores y valor ascendente. Actuadores con límite igual se tratan como fijos. No afirmar óptimo continuo.
- [ ] RED API/UI: rechazar actuador fuera de ficha/digest obsoleto; calcular no edita B, botón «Usar propuesta en B» actualiza solo borrador e invalida preview previo; no guarda ni monta automáticamente. Ejecutar focal antes y después, PASS requerido.

### Task7: Cuarta vista de dinámica en curva y elipse idealizada

**Files:** crear17 `chassis/cornering.py`,18 `chassis/workshop/cornering.py`,13 `components/chassis/workshop/{CorneringView,CorneringControls}.tsx`; extender DTOs/router/service Task1/2; tests17 `test_workshop_cornering.py`,18 `test_workshop_cornering_api.py`,13 `tests/chassisCornering.check.mjs`/interacción.

**Interfaces:** `evaluate_cornering(input: CorneringInput) -> CorneringResult`; POST `/cornering/preview`; POST/GET `/cornering/scenarios` para escenarios inmutables por equipo con operation_id. Input velocidad SI, radio, masa, optional Fx, optional Fz/mu_x/mu_y con origen; modo scenario/recorded referencia canal/calibración válida. La física mínima no depende de aero ni postura; inputs de esas hipótesis se registran separados como no modelados.

- [ ] RED: v=185/3.6,R=140,m=240 verifica a_y=v²/R, Fy=m*a_y y ángulo atan2(a_y,9.80665); duplicar masa doblaFy, no a_y/ángulo. SignoFx simétrico en elipse; normalización1 permanece1 y>1 no se recorta. Mu ausente no produce porcentaje; radio0/negativo y no finitos/overflow rechazados; velocidad0 permitida.
- [ ] Implementar ecuaciones del anexo. `Fz=m*g` solo modo idealizado sin aero y con etiqueta; no inferir Fx=0 en recorded. Result distingue fuerza global y ausencia de reparto por rueda. Esquema versionado sin presentarse como Pacejka ni afirmar incertidumbre estadística.
- [ ] RED SSR/interacción: pestaña cuarta, escenario35/75/140m explícito, dos SVG, métricas y supuestos; parámetros cambian solo escenario, no setup B; aero/descuelgue sin modelo dicen no disponible y no alteran ángulo. No existe diagnóstico «low-side» ni reserva de agarre medida. Se puede guardar hipótesis sin certificarla, conservando fuente y estado.
- [ ] Ejecutar focal y pruebas por equipo para escenarios. Fixture sintética de la imagen no se inserta en catálogo real ni se convierte en telemetría. PASS requerido.

### Task8: Orden persistida, ficha aplicable y autoridad existente

**Files:** crear18 `chassis/workshop/orders.py`; ampliar models/store/router; integrar18 `chassis/engineering/decisions.py` solo mediante comprobaciones existentes y bindings de orden; crear13 `components/chassis/workshop/{WorkshopOrderPanel,SpecificationEditor}.tsx`; tests18 `test_workshop_orders.py`, `test_workshop_order_races.py`; pruebas13.

**Interfaces:** `prepare_order(input: WorkshopOrderInput, principal, audit) -> WorkshopOrder`; `get_order(id,principal) -> WorkshopOrder`; `transition_order(id, expected_revision, action, principal, audit) -> WorkshopOrder`. APIs `/orders` y `/orders/{id}/transitions`. Input referencia comparación A/B, moto/sesión y opcional propuesta existente exacta; el servidor deriva líneas antes/después y elegibilidad, nunca acepta status=approved del cliente. Escrito manual sin propuesta elegible puede ser borrador, no orden liberada.

- [ ] RED: línea sin torque/fuente/herramienta/rango aplicable impide liberación; cambios de configuración sin conversión mecánica contrastada no generan vueltas. Lista de componentes afectados sale de claves reales, no de textos del modelo. Documento por equipo idempotente, no lectura cruzada; reader no muta.
- [ ] Implementar revisiones inmutables y huella que incluye A/B, propuesta/snapshot/digest/generación, fichas y versiones de modelo. Estados visibles draft/pending/approved_current/in_progress/completed/invalidated/cancelled. Aprobación vigente se deriva de la autoridad existente, no de un booleano persistido independiente. Fichas de revisión antigua se conservan, pero cambio de ficha efectiva invalida liberación pendiente.
- [ ] RED: entre validar y liberar cambia ficha, setup, propuesta o designación; una carrera no publica approved_current. Reintento mismo operation_id devuelve mismo evento, body distinto409. Cambio de membresía revoca acceso. Autoridad local no disponible impide liberar con motivo explícito; UI no simula aprobación.
- [ ] Ejecución usa eventos existentes de aplicación/validación y sus requisitos de rol y objetivo congelado. Una anotación de progreso no significa montaje; completar exige evento de aplicación válido correspondiente y todas las líneas verificadas. Pruebas SQL con autoridad efímera y tests de API deben pasar antes de permitir estado ejecutable.

### Task9: Informes, cobertura y compatibilidad con agentes

**Files:** crear18 `chassis/workshop/reports.py`; modificar18 `chassis/reports.py`, `chassis/engineering/reports.py`, schemas afectados y empaquetado; modificar13 `ChassisReport.tsx`, `domain/chassisReport.ts`, `domain/telemetryReportRequirements.ts`; actualizar `docs/product-completion-matrix.md`, operación y estado de entrega. Tests18 `test_workshop_reports.py`,13 `tests/chassisWorkshopReport.check.mjs`.

**Interfaces:** `build_workshop_annex(comparison_id, order_id, scenario_ids, principal) -> WorkshopAnnex`; anexo opcional versionado1, agregado de referencias inmutables, fórmulas/versiones/supuestos y estado de autoridad. No añadir scalars nuevos al catálogo de revisión de los agentes en esta entrega.

- [ ] RED: informe histórico sin anexo idéntico; anexo de otra sesión/equipo rechazado; datos de curva guardados separados de telemetría; orden antigua visible como histórica sin etiqueta ejecutable. Un IFC dibujado no aparece como validado por IA ni supera un gate físico.
- [ ] Implementar anexo y versión de esquema, conservar salida histórica sin nulls nuevos; fingerprint cambia con nuevo anexo. Hoja de ruta marca aero/Pacejka/flex/chatter/biometría/vida de piezas pendientes con dependencias reales, no porcentajes de progreso inventados.
- [ ] Ejecutar focal, empaquetado offline y regresiones de decisiones verificables01/02/18; PASS requerido para la entrega, anotando cobertura y skips del banco.

### Task10: Aceptación integrada, revisión y activación controlada

**Files:** crear13 `docs/chassis-visual-workshop-acceptance-2026-10-26.md`, workspace de evidencias `.superpowers/sdd/2026-10-26-chassis-visual-workshop/`; completar tests E2E Task5; ajustar solo defectos descubiertos con regresión.

- [ ] Ejecutar test de flujo completo en almacenamiento efímero: contexto→entrada mecánica→tres vistas/curva→B→preview→guardado/comparación→Target Lock→orden borrador→bloqueo por datos faltantes. Escenario separado con autoridad SQL efímera demuestra aprobación humana, aplicación e invalidación. No registrar éxito comercial a partir de fixtures.
- [ ] Ejecutar suites de física17 y ingeniería18 afectadas,01 unidades y02 contratos; SSR/typecheck/build donde disponible; verificación de wheel incluye módulos/schemas nuevos. Conservar resultados exactos, no sustituir build/Vitest por SSR. Medir preview/Target Lock con fixture máxima y respetar límite5000, sin llamadas de modelo por cada slider.
- [ ] Inspección visual acotada desktop/tablet/mobile, teclado y reduced-motion sobre estados vacíos, parciales, suficientes, error, resultados obsoletos y orden bloqueada; una pasada, corrección por lote y una confirmación. Ejecutar detector de Impeccable una vez al terminar UI. La captura aportada orienta distribución, no reemplaza tokens ni datos.
- [ ] Solicitar revisión independiente final del diff exacto y contratos; corregir hallazgos materiales con pruebas RED/GREEN. Actualizar matriz de cobertura requisito→test→estado y declarar capacidades que siguen bloqueadas, incluido anti-squat si no se logró contraste.
- [ ] Comprobar que la aceptación IA anterior no se degrada. Solo repetir modelo real si cambia su contexto/serialización/inferencia; caso contrario no gastar inferencia adicional para una vista puramente determinista.
- [ ] Antes de recargar runtime, verificar0ejecuciones activas, propietarios reales de procesos y backup SQLite consistente con quick_check. No parar procesos ajenos. Recargar solo servicios locales afectados tras gates; HTTP200, schema esperado, worker operativo, sin sesiones ficticias en DB principal. Si un gate falla, mantener runtime anterior y registrar bloqueo; no cambiar modelo/identidad para disimularlo.
- [ ] Informe final distingue implementado/contrastado/bloqueado; conservar baselines y hashes. Sin despliegue, cloud, commits ni publicación. No afirmar listo para venta mientras sigan abiertos2D independiente, metrología, identidad y auditoría de producción.

## Dependencias y ejecución

Task1→Task2; Task1→Task3; Task2+3→Task4; Task4→Task5; Task3+4+5→Task6; Task1+2+5→Task7; Task2+4+5+6→Task8; Tasks5–8→Task9→Task10. Son entregas del mismo flujo, no aplicaciones independientes. Se mantiene implementación inline: contratos y estados comparten demasiadas dependencias para delegar cambios simultáneos en los mismos archivos. Revisión independiente al final; una revisión focal puede solicitarse si una duda física concreta lo justifica.

## Auto-revisión del plan

Cobertura: tres vistas y controles(Task5), estado/datos(Task1/2/4), física/IFC(Task3), Target Lock(Task6), nueva imagen/curva(Task7), órdenes y humano(Task8), informes/IA y roadmap(Task9), operación/visual y aceptación(Task10). Los cinco Review Focus tienen regresión en su tarea. Contratos y firmas se definen antes de consumirlos. No se prescribe una predicción de agarre, dinámica hidráulica o anti-squat sin validación. Pendiente de confirmación del usuario: este plan y la concreción del anexo de curva. No se ha modificado código de producto.

