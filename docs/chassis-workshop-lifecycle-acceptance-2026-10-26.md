# Orden de taller: aceptación del ciclo de software

Continuación del plan visual aprobado, 26-Oct-2026. No acredita instalación física ni autoridad cloud productiva.

## Recorrido demostrado

La nueva prueba `18-telemetry-dataset/tests/test_workshop_order_sql.py::test_documented_order_requires_human_approval_application_and_all_checks` usa PostgreSQL efímero con las funciones reales de autoridad. La fuente, identidad emisora, manual y selección del modelo son controlados exclusivamente para QA. Se crean fichas verificadas iguales para A/B y una comparación de offset, calculada por el motor estático existente antes de congelar el snapshot.

Se demuestra: propuesta física restringida a un parámetro soportado; resolución humana documentada de discrepancias; orden sin ejecución antes de aprobación; rechazo 409 del inicio sin aprobación; aprobación del Crew Chief designado; inicio; evento de aplicación para B exacto; rechazo 422 de comprobaciones incompletas y de evento ausente; rechazo 409 de evento desconocido; finalización y repetición idempotente. Los intentos rechazados mantienen la orden en seguimiento.

El flujo es de servicios de software y autoridad SQL, no una prueba completa de UI, proveedor cloud, IA local real o trabajo en una moto real. La evidencia de fuente validada del fixture no valida el lector 2D.

## Fallo encontrado y corregido

Recuperar la operación antigua de inicio después de completar devolvía su revisión original como ejecutable. La prueba RED conservada reproduce ese resultado. La vista de orden ahora consulta su cabeza: revisiones superadas conservan identidad/digest originales, pero se presentan como históricas y no ejecutables con `order_revision_superseded`. La orden actual sigue completada. No se reescriben eventos ni se sustituye la autorización humana por un booleano.

## Verificación y revisión

- Recorrido inicial y negativo de comparación ajena: 2 pasan, 12.73 s.
- RED del reintento histórico: 1 falla por `executable=True`, antes de la corrección.
- Taller/autoridad tras corrección y refuerzo de aserciones: 54 pasan, 688 no seleccionadas, 15.58 s.
- Wheels 17/18 reconstruidas e importadas fuera del checkout; seis contratos, rutas y autoridad local desactivada pasan.
- Revisión independiente de código: sin hallazgos importantes. Se atendieron los tres menores: códigos/reasón de errores, eventos ausentes/incorrectos y conservación de cabeza tras replay. No hubo segunda implementación paralela.

La suite completa 18 no está verde: primer banco sin catálogos produjo `TestDatasets.test_list_all_datasets` (27 pasan, 1 falla). Al montar metadatos en solo lectura se alcanzaron 77 pruebas antes de fallar `test_local_sql_runner_cleans_creation_timeout`, porque el helper de 21 no estaba montado. No se cambiaron esos tests ni se contabilizan como aprobados. La regresión afectada y el SQL real sí pasan; la aceptación global del banco sigue pendiente de completar sus entradas.

## Activación

Solo se recargó el backend local propio tras 0 runs/reservas y backup consistente `chassis-before-verified-decisions-20261026T173601449769Z.sqlite` (`quick_check=ok`). Lanzador 41008. Health publicado devuelve 200/ok; gateway, worker, modelo y modo local preservados. Sin fixtures en la base principal, migraciones cloud, cambios de credenciales, commits o publicación.

Evidencia y baseline exacto de los dos archivos en `.superpowers/sdd/2026-10-26-workshop-lifecycle/`. Se conserva el workspace para recuperación porque la base aceptada no está respaldada por commits de esta fase. Coste: almacenamiento local. La corrección reduce la posibilidad de presentar una revisión histórica como trabajo vigente; no establece atomicidad distribuida con un proveedor de autoridad externo.
