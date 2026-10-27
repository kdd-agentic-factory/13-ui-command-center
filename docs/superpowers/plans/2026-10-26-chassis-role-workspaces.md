# Chassis Role Workspaces Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Ejecución nativa en esta sesión ya elegida por el usuario; revisión independiente al final. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un solo Chassis operativo con vistas por tarea/perfil, datos compartidos y autoridad humana intacta.

**Architecture:** Una proyección de presentación deriva contexto y siguiente paso de estados existentes. Selector en memoria y secciones montadas conservan borradores; no se duplican peticiones, setups ni autoridad. Comparación y análisis publican únicamente resúmenes de estado con identidad de contexto para la cabecera; la física y decisión siguen en servidor.

**Tech Stack:** React/TypeScript/CSS y componentes actuales; sin dependencias, esquema DB ni endpoints nuevos.

**Spec:** `docs/superpowers/specs/2026-10-26-chassis-role-workspaces-design.md`, aprobada el26-Oct-2026.

**Estado de ejecución:** plan aprobado y vistas implementadas localmente. Revisión independiente17archivos, cuatro P2 corregidos en una pasada;425pruebas nativas, TypeScript, build y13checks de taller pasan. Aceptación local y costes en `docs/chassis-role-workspaces-acceptance-2026-10-26.md`; no equivale a producción, orden accesible completo de teclado ni validación comercial con usuarios reales.

## Global Constraints

- Un único producto, contexto y evidencia; vista elegida no otorga permisos. Mantener reader/engineer/admin y Crew Chief/sustituto en servidor.
- Vistas Piloto, Mecánico, Ingeniero, Analista, Crew Chief y Dirección/observación. Perfiles históricos sugieren vista; solo se permite ajustar listas de navegación de AuthContext para encontrar Chassis, nunca identidad, requiresAuth ni contratos de autenticación.
- Preferencia en memoria; reset al cambiar identidad/equipo. Sin localStorage nuevo ni perfiles cloud.
- Conservar borradores y protecciones existentes al cambiar vista. No clonar componentes con estado ni añadir key dependiente de vista a sus árboles.
- No usar semillas de garage, porcentajes, diagnósticos, notas no persistidas ni nueva IA. La fuente experimental sigue visible y bloqueada.
- No iniciar IA ni escrituras al navegar. Las acciones existentes conservan autorización y contexto.
- Conservar tokens/design.md y navegación accesible; jerarquía por tareas, sin nueva pantalla de bienvenida.
- Continuar sobre base dirty aceptada con baseline de archivos afectados; sin commits, despliegue, migraciones, instalaciones ni cambios de presupuesto/modelo.

## Review Focus

1. Borrador oculto: pasar de Ingeniero a Piloto y volver conserva campos y protección al salir; Task2/3.
2. Respuesta vieja: resumen/propuesta del equipo o sesión anterior no cambia siguiente paso ni decisión actuales; Task1/4.
3. Perfil frente a permiso: vista Crew Chief con usuario reader/local/no designado nunca habilita aprobación; Task4/5.
4. Contexto incompleto o fuente experimental: ninguna vista muestra «listo» o recomienda un ajuste por ocultar controles; Task1/3.
5. Dos instancias accidentales: cambiar vista no duplica queries, polling, guardados o llamadas de modelo; Task2/5.

## Mapa de archivos

Crear `src/domain/chassisWorkViews.ts` (tipos/proyección), `src/hooks/useChassisWorkView.ts` (preferencia con reset), `src/components/chassis/ChassisWorkHeader.tsx` (selector/contexto/siguiente paso), `src/styles/chassis-workviews.css` (composición) y pruebas `tests/chassisWorkViews.test.ts`, `tests/chassisWorkHeader.test.tsx`, `tests/chassisWorkViews.integration.test.tsx`.

Modificar `src/pages/ChassisPage.tsx`, `src/components/chassis/ChassisComparison.tsx`, `src/components/chassis/workshop/ChassisWorkshop.tsx`, `src/components/engineering/AnalysisRunPanel.tsx` y, solo si hace falta separar lectura de acciones, `HumanDecisionPanel.tsx` y `WorkshopOrderPanel.tsx`. Estos últimos mantienen su lógica/autorización. Documentación: PRODUCT.md, chassis-operation.md, product-completion-matrix.md. Sin cambios a 17/18 salvo un fallo real separado y probado.

### Task1: Proyección de vistas y siguiente paso

**Interfaces:** `WorkView = 'rider'|'mechanic'|'engineer'|'analyst'|'crew-chief'|'management'`. `initialWorkView(profileId:string|null):WorkView`. `WorkContextKey` es string compuesto por scope, workspaceEpoch, sesión/revisión y grabación actual. `ComparisonPresentation` contiene contextKey, comparisonId|null, saved:boolean, dirty:boolean, error:string|null. `AnalysisPresentation` contiene contextKey, status:'unknown'|'idle'|'running'|'review'|'blocked', proposalId|null y blockers:string[]. No contiene autoridad editable ni datos crudos. `WorkFacts` agrupa contextKey, sessionReady, recordingReady, sourceStatus, comparison, analysis. `nextWorkStep(facts:WorkFacts):{code:'context'|'import'|'quality'|'measure'|'compare'|'analysis'|'review'|'recover';label:string;target:string;blockers:string[]}`.

- [ ] Escribir RED en `chassisWorkViews.test.ts`: perfiles históricos mapeados, desconocido→Ingeniero; sin sesión→context, sin grabación→import, experimental→quality, error→recover; resumen con contextKey ajeno se trata desconocido, no listo. Una comparación dirty no ofrece analizar como si estuviera guardada.
- [ ] Ejecutar `npx vitest run tests/chassisWorkViews.test.ts`; observar fallo por módulo/comportamiento ausente.
- [ ] Implementar proyección pura. Prioridad: errores vigentes, contexto, grabación, calidad, comparación/medidas, análisis/revisión. No crear señales de «validado» ni inferir autorización desde perfil. Ausencia de estado sigue desconocida.
- [ ] Repetir focal hasta PASS; comprobar tipos con `npm run typecheck`. Si propiedades nuevas requieren pruebas vecinas, incluirlas.

### Task2: Selector y cabecera sin mutaciones

**Interfaces:** `useChassisWorkView(profileId:string|null,scope:string):{view:WorkView;setView:(view:WorkView)=>void}`. `ChassisWorkHeader({view,onView,contextLabel,nextStep,onNext,dirty}:Props)`. onNext enfoca/desplaza la sección real existente mediante refs; no guarda ni llama al modelo. Mostrar aviso de borrador si dirty.

- [ ] RED en `chassisWorkHeader.test.tsx`: selector accesible muestra seis vistas, cambia preferencia sin callbacks de red; cambio de scope reinicia; onNext recibe target esperado; `userEvent`/teclado funcionan sin etiquetas técnicas de autenticación. No almacenar preferencia en localStorage.
- [ ] Ejecutar focal y observar RED; implementar hook/header sobre tokens actuales.
- [ ] Integrar una sola cabecera en ChassisPage, derivar contexto del proveedor existente, sin leer semillas. Selector no altera profileId autenticado ni current team. Renderizar una sola instancia de cada bloque con estado.
- [ ] Incluir Chassis en navegación histórica de dirección/observador si falta (`src/context/AuthContext.tsx` y componente de navegación real localizado con rg). RED: ambos pueden localizar la entrada, pero usuario anónimo en modo autenticado sigue bloqueado por TelemetryGate y un reader no gana escritura. No cambiar requiresAuth ni conceder acceso de equipo desde la UI.
- [ ] PASS focal y test de montaje: contar peticiones del fixture antes/después de cambiar vista; sin incremento por remontaje. Ocultar con `hidden`, no desmontar los espacios editables; no elegir nuevos defaults de sesión/moto.

### Task3: Ingeniero, mecánico y analista con borrador compartido

**Interfaces:** Props opcionales `workView?:WorkView` (default Ingeniero para llamadas antiguas) y `onPresentation?:(state:ComparisonPresentation)=>void` en ChassisComparison. Pasar WorkContextKey desde página; emitir estado solo cuando cambie, descartar en página si no coincide. `ChassisWorkshop` recibe workView opcional y usa la misma instancia de WorkshopOrderPanel. No mover el propietario A/B fuera de useChassisWorkspace por esta entrega.

- [ ] RED integración: editar B, curva y escenario; cambiar Mecánico→Analista→Ingeniero; valores intactos, A sin mutación y leave guard activo incluso con editor oculto. Verificar que cambiar vista no llama a comparar/Target Lock/guardar.
- [ ] Ejecutar `npx vitest run tests/chassisWorkViews.integration.test.tsx`; confirmar RED.
- [ ] En Ingeniero priorizar comparación/visor; en Mecánico priorizar orden vigente y detalle de piezas; en Analista priorizar fuente/señales/calibración. Mantener acceso explícito a detalles técnicos y a borradores pendientes. La orden vive una sola vez; si su posición no puede cambiar sin remontaje, conservar su posición y desplazar al usuario mediante target real.
- [ ] Emitir resumen de comparación guardada/error/dirty desde el flujo existente, sin recalcular física en cliente. Sin publicar medidas ni IDs ajenos tras cambio de sesión.
- [ ] PASS integración, pruebas existentes `measuredChassisComparison`, `chassisProductEntry`, `engineeringDiscardWorkspace` y checks de taller; comprobar nombres reales con `rg --files tests` antes de invocar.

### Task4: Piloto, Crew Chief y dirección sobre evidencia existente

**Interfaces:** Props opcionales `workView?:WorkView`, `contextKey?:string`, `onPresentation?:(state:AnalysisPresentation)=>void` en AnalysisRunPanel. AnalysisWorkspace mantiene su estado, cancelación, fences y claves actuales; la vista no forma parte de la key. En HumanDecisionPanel no añadir autoridad derivada de WorkView.

- [ ] RED: una misma propuesta/snapshot conserva IDs, contenido y blockers al cambiar vista; Piloto muestra resumen e incertidumbre sin inventar diagnóstico; dirección no expone controles de montaje; vista Chief no habilita botones a reader/local/no designado. Una respuesta tardía de A después de cambiar a B no publica resumen ni siguiente paso.
- [ ] Ejecutar focal RED; implementar agrupación de secciones existentes con lectura accesible y detalles técnicos progresivos. No añadir notas de piloto sin backend, ni parafrasear recomendaciones mediante otra IA.
- [ ] Conservar panel de decisión original y todas sus verificaciones. La vista puede dar foco al panel, no sustituirlo. Autoridad desconocida o caducada muestra bloqueo y recarga; no suplirla con etiquetas de perfil.
- [ ] PASS focal y regresiones de `analysisRunPanel`, decisiones/eventos y contexto. No añadir polling; reutilizar el actual y garantizar que hidden no se anuncia como resultado nuevo.

### Task5: Aceptación de producto, revisión y activación local

- [ ] Prueba integrada en almacenamiento/servidor controlados: elegir contexto real de fixture, abrir grabación, completar A/B, comparar, revisar análisis/orden; cambiar seis vistas y verificar un único contexto/digest. Experimental2D mantiene bloqueo. No usar base principal para fixtures.
- [ ] Ejecutar `npm test`, `npm run typecheck`, `npm run build` y checks de taller. API/SQL de autoridad solo repetir si una modificación toca su contrato; no repetir IA real por cambios exclusivos de presentación. Registrar skips/avisos/fallos, sin afirmar suite global verde a partir de focales.
- [ ] Leer contexto Impeccable y design.md; inspección acotada escritorio/tableta/móvil, teclado, reduced motion, empty/error/blocked/dirty; una tanda de arreglos y una confirmación. Detector una vez si no se ejecuta por hook.
- [ ] Congelar baseline/manifiesto, pedir una revisión independiente final del diff completo. Clasificar primero; una pasada de corrección de hallazgos materiales con regresiones. Registrar menores diferidos y comportamientos no certificados.
- [ ] Actualizar matriz con requisito→vista→test→estado. La aprobación de diseño no acredita fidelidad 2D, biomecánica, agentes nuevos, seguridad mecánica o ventas.
- [ ] Confirmar HMR/runtime de versión local, sin perder borradores ni cambiar identidad. Backend no se reinicia si no cambia. Captura sin telemetría restringida; restaurar viewport y conservar evidencias. No publicar ni aplicar migraciones.

## Dependencias y auto-revisión

Task1→Task2→Task3/4→Task5; Task3 y4 comparten contextKey y no se implementan en paralelo por compartir ChassisPage. Spec completa cubierta: vistas y siguiente acción en1–4, estado/permisos/seed isolation en1/3/4, diseño y aceptación en5. Las cinco condiciones Review Focus tienen prueba asignada. Contratos y defaults retrocompatibles; preferencia en memoria y sin DB. Pendientes externos permanecen bloqueados. Antes de implementar, revisión/confirmación del usuario de este plan; conservar ejecución nativa ya elegida.
