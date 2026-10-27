# Recuperación del trabajo pendiente en Chassis

Corrección local del 26 de octubre de 2026 sobre el flujo existente.

## Problema y resultado

«Siguiente paso» reconocía los borradores de sesión y geometría anterior, pero enviaba los de contexto medido, laboratorio y curva a la comparación. Sin grabación, ofrecía importar antes de terminar esos formularios. La página tampoco disponía de destinos de foco para los dos paneles nuevos o para el taller independiente.

Ahora cada uno de los seis propietarios tiene un destino explícito. Revisar un borrador tiene prioridad frente a importar, completar requisitos o volver a errores anteriores; esos controles reaparecen cuando ya no hay borrador pendiente. Si hay varios, el orden es determinista: sesión, geometría anterior, comparación, contexto medido, laboratorio y curva. No se guardan ni descartan campos al pulsar esta acción.

La navegación revela y enfoca el panel existente sin remontarlo. En curva activa la vista de ingeniería y reabre la pestaña correspondiente, tanto con grabación como en el taller independiente. Cambiar presentación no otorga permisos. La recuperación actúa durante la sesión abierta; al intentar salir sigue funcionando la protección de cambios sin guardar.

## Verificación

- Siete fallos de regresión reproducidos antes del cambio; foco y retención comprobados después.
- 17 pruebas focales pasan, incluida curva con/sin grabación y conservación de entradas a través de las seis vistas.
- Seis pruebas sobre build compilado con backend vacío real: contexto/laboratorio/curva a 390 y 1366 px. Sin interceptar API; solo contexto sintético y entradas no guardadas. Comprueban foco, valores, pestaña y diálogo de salida.
- Typecheck y build final pasan ; 151 chunks dentro del umbral existente de 1.600 kB.
- Revisión independiente acotada de las dos fuentes contra baseline: sin hallazgos materiales.
- Regresión completa final de interfaz: 101 archivos y 453 pruebas pasan en 110,82 s.

El primer recorrido conjunto de navegador agotó el límite de 60 peticiones/minuto al repetir seis contextos por la misma IP. Las trazas identificaron429; el fixture QA aislado usa 1000/min para esta repetición. No se cambió el límite del producto ni presupuestos de IA. La corrección no altera el backend, los datos de usuario, las aprobaciones humanas ni los contratos físicos.

## Auditoría de las pruebas omitidas

Se ejecutaron las cuatro suites implicadas con motivos de omisión visibles: 20 pasan y 20 se omiten. Tres requieren PyTorch no instalado; 17 dependen de directorios, muestras o metadatos públicos/anónimos aún ausentes. No se instalaron dependencias ni se publicaron datos restringidos para eliminar esas omisiones. No acreditan una validación externa de 2D ni del banco.

## Repetición

`npx vitest run tests/chassisWorkViews.test.ts tests/chassisDraftRecovery.test.tsx tests/chassisWorkPage.test.tsx`

`npm run typecheck` y `npm test -- --run`.

`npm run build -- --config vite.domain.config.ts --outDir .superpowers/sdd/2026-10-26-workflow-recovery/production-dist` seguido de `npx playwright test --config playwright.workflow.config.ts`.

El harness crea su propia base vacía y usa 8185/5175; termina esos servicios al acabar. Las evidencias y baselines de esta entrega se conservan en `.superpowers/sdd/2026-10-26-workflow-recovery`. El contraste externo de fuentes, identidad productiva y federación operativa siguen pendientes.
