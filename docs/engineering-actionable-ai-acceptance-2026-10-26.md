# Aceptación de IA accionable —26 de octubre de2026

Estado: aceptación positiva **fallida en0.6B y4B**. Contrato e interfaz implementados; no activar ni declarar cerrado el gap de análisis local. Plan aprobado: `superpowers/plans/2026-10-26-actionable-ai-production.md`. Revisión independiente y seguimiento: `.superpowers/sdd/2026-10-26-actionable-ai-production/` en este repositorio.

## Banco y alcance

Backend18, gateway02 y trabajador01 reales por HTTP; PostgreSQL16 efímero, identidades y geometría explícitamente sintéticas. Fuente marcada como fixture, sin validación de hardware. No se leyó telemetría original ni se crearon sesiones en la biblioteca principal. Namespace privado sin red externa, filesystem de aplicación y colas de transporte separados, fuentes de solo lectura, límites de recursos y cierre de procesos propios. El relay de QA no es una implementación de nodo federado.

Un padre de pruebas confiable envió las peticiones acotadas exclusivamente a Ollama nativo en127.0.0.1:11434. Modelo fijo `qwen3:0.6b`; etiqueta local con digest observado `7df6b6e09427a769808717c0a93cadc4ae99ed4eb8bf5ca557c90846becea435`, sin afirmar pin criptográfico del protocolo de generación. Sin descargas, reemplazo automático, retries ni modificación de respuestas. Máximo12 llamadas,2 simultáneas y58s por transporte del relay; producto conserva sus presupuestos. Los tiempos incluyen este transporte de banco y no son un SLA.

## Resultado positivo real

Una ejecución del caso `test_real_http_workers_sql_human_and_invalidation[real-ollama]`: FAIL en159,49s. El run se selló y la síntesis del Crew Chief terminó; el assert original exigía éxito de chassis, mechanical-check, evidence-quality y alternative-hypotheses y encontró el conjunto vacío. No se rebajó ese requisito. Cinco llamadas devolvieron respuesta del modelo; ninguna alcanzó el timeout del relay. Devolver JSON no acredita selección válida ni competencia física.

| Llamada | Duración del relay(s) | SHA256 del prompt | SHA256 del esquema |
|---|---:|---|---|
|1|36.886|616f26b4b7bcdbd3357b84f0a802c96cdb6be610da232a04217ecfdd32e2600f|aa8441510e5b4569fa9814b94b99fa90f335e489a6537632b20d38bbdf2ab607|
|2|24.202|a1049a1bb1247bed5f646e491875d44aa6a8e6924ecdbff85fae4fc8dd91531b|aa8441510e5b4569fa9814b94b99fa90f335e489a6537632b20d38bbdf2ab607|
|3|16.734|e1b978fe74f66457257a2c0dc29003efd4602bfbee072c80235e9bacfcd022e0|aa8441510e5b4569fa9814b94b99fa90f335e489a6537632b20d38bbdf2ab607|
|4|26.648|d5cd9828c30853055fbe9f08467d32d6babac4c69316d459d7f85b054effc616|aa8441510e5b4569fa9814b94b99fa90f335e489a6537632b20d38bbdf2ab607|
|5|12.775|c28788b37e44448d246088f627f5c5d3f7423a4815589d976bc6708140d6a6af|bc2cec5cda2183d68ee49ba6c7881babceedde804f0e09c7aa8b608d03121e90|

Límite de evidencia: la versión inicial del harness imprimía los motivos detallados solamente después del assert de éxito. No se conservaron los motivos por especialista en esta ejecución fallida y no se inventa su clasificación. Se movió el resumen acotado antes del assert para próximos ensayos. No se repitió la aceptación positiva para intentar obtener un verde.

## Resultado negativo real

`real-ollama-experimental-2d`:1PASS/5deseleccionados en47,57s. Siete agentes quedaron `blocked_missing_inputs/snapshot_not_analyzable` (incluidos los cuatro críticos); físico/neuro `unavailable/biometric_inference_not_enabled`. El Crew Chief terminó con una llamada real y propuesta publicada de medición exclusivamente; publicar un borrador de medición no aprueba ni ejecuta un cambio físico. No se creó decisión humana. Llamada12,293s, prompt SHA256 `914a95913a10e697645c83d1b5a064c03dba5a21c19c754fef02ec61d412d987`, esquema SHA256 `bc2cec5cda2183d68ee49ba6c7881babceedde804f0e09c7aa8b608d03121e90`.

Este caso comprueba el gate de fuente experimental: los especialistas se bloquearon antes de inferir y solamente llamó al modelo el Chief. No acredita calidad de solicitudes `InputRequest` generadas por IA real; esa aceptación continúa pendiente. El resumen nuevo del harness precede al assert de especialistas, pero sigue después del assert de síntesis: no se afirma retención de diagnóstico para todos los posibles fallos.

## Verificación de código y distribución

Continuación autorizada posteriormente por el usuario: se añadió diagnóstico acotado antes de los asserts y métricas de respuestas (hashes, conteos y códigos permitidos; sin texto libre). El ensayo diagnóstico0.6B falló en110,16s: los cuatro especialistas `failed/invalid_or_out_of_budget_response`, cinco respuestas nativas y Chief completado. Un diagnóstico estructural adicional, sin cambio de comportamiento, falló en114,00s y localizó en los cuatro casos el rechazo JSON Schema `anyOf` en `requested_inputs[0]`.

Se convirtió únicamente la gramática interna de `InputRequest` a ramas de objetos explícitas. El contrato público y las dos validaciones posteriores permanecen; no se vacían listas ni se reescribe la selección del modelo. RED reproducido;5824 combinaciones de selectores/parámetro omitido conservan equivalencia.60 pruebas focales pasan15,24s; barrido de ingeniería256PASS/3SKIP42,64s y E2E controlado final4PASS94,73s.

Aceptación0.6B posterior al cambio: FAIL118,47s. Desapareció el rechazo estructural observado, pero no la incapacidad del modelo para completar el caso: chassis, mechanical-check y alternative-hypotheses `failed/invalid_or_out_of_budget_response`; evidence-quality `failed/input_request_not_applicable`. Chief completado; cero éxitos críticos. Esto no certifica capacidad del modelo. El ensayo explícito del candidato4B ya instalado se registra aparte; no cambia el modelo principal ni autoriza fallback automático.

Wheel posterior a la corrección: smoke aislado fuera del checkout correcto, SHA256 `d42de3980f701195abd1e81bce5de35f9fbd95512d077c77c8ed1b540093f551`,287339bytes. No publicado.

Comparación explícita con4B ya instalado: FAIL214,93s. Chassis, mecánica y alternativas `blocked_missing_inputs/model_request_not_actionable`; calidad `failed/input_request_not_verifiable`; Chief completado. Las cinco llamadas respondieron sin timeout. Tres salidas piden `additional_evidence` sin campo concreto. No se cambió el modelo principal.

Se aclaró el alcance de la instrucción: revisión limitada de referencias calculadas y sus supuestos, separada de aprobación/readiness de un cambio físico. La revisión independiente no encontró conflicto con la especificación. La primera redacción superó el límite de contexto en la regresión de74 agregados; se compactó sin eliminar hechos ni ampliar16000 caracteres.152 unidades de01 pasan8,56s. La aclaración conserva intención contractual, pero **no se acredita como solución de capacidad**.

Único ensayo4B posterior a esa aclaración: FAIL309,31s. Chassis, mecánica y alternativas `failed/input_request_not_applicable`; calidad `timed_out/execution_deadline_exceeded`; Chief completado. Cero éxitos críticos. Se mantuvieron todos los asserts. No más reintentos de prompt/modelo en esta fase. Algunas comprobaciones controladas se ejecutaron concurrentemente; los tiempos no aíslan rendimiento/SLA. Una comprobación integrada conjunta agotó120s y no se acredita; su repetición secuencial consta en el cierre de verificación. El candidato4B se descargó de memoria mediante keep_alive=0 sin nueva generación.

Los metadatos acotados de los siete ensayos de las fases descritas (incluido el negativo anterior) se conservan en `.superpowers/sdd/2026-10-26-actionable-ai-production/real-model-transport-metadata.json`: hashes de prompt/esquema/respuesta cuando disponibles, conteos/códigos permitidos y duraciones. No contienen prompts ni texto generado. Los hashes previos a la aclaración permiten comprobar invariancia del contexto; los nuevos hashes identifican el cambio de instrucción.

Cierre secuencial después de liberar el candidato de QA: E2E controlado4PASS60,88s. Backend, gateway e interfazHTTP200. Este resultado acredita integración controlada del código final, sin convertir los fallos de inferencia real en éxito. No se amplió el timeout del banco para ocultar la ejecución concurrente agotada.

Barrido de ingeniería final sobre el código de cierre:261PASS/3SKIP en39,95s, incluyendo las cinco pruebas adicionales de proveedor y la aclaración compacta. Esto sustituye como evidencia final al barrido intermedio256PASS citado arriba. No cambia los límites documentados de las suites globales01/18 ni equivale a aceptación de IA.

- 01:152 pruebas unitarias pasan; la suite global no completa colección por dependencia nativa Linux `uuid_utils._uuid_utils` en `test_workflow_graph.py`.
- 02: suite completa118PASS, un aviso de configuración de cache.
- 18:32 pruebas focales de contratos/contexto/informes y44 de informes/decisiones/autoridad SQL pasan. Barrido de ingeniería inicialmente252PASS/3SKIP/3FAIL; corregidas fixtures de alcance/codec e intérprete aislado; los cuatro casos afectados pasan42,23s. Barrido final255PASS/3SKIP en56,01s.
- Interfaz:7 comprobaciones SSR pasan; typecheck completo previo exit0. No nueva acreditación de build ni suite nativa completa de frontend en este banco.
- E2E controlado:4PASS inicialmente en68,12s; comprobación final tras las modificaciones del harness:4PASS en79,71s (positivo, modelo ausente,2D experimental y contraste fallido). No es aceptación de inferencia real.
- Wheel construido offline y extraído fuera del checkout: DTO/esquema, imports y autoridad deshabilitada por defecto comprobados con Python aislado. SHA256 `f7d4406be400f4c80d7864414eb8c2afabef349d6548e86c15d8bfa3119bb515`,286785bytes. Artefacto efímero de verificación; no publicado ni desplegado.

La ejecución global de18 se detuvo con27PASS y tres fallos en `test_api_endpoints.py::TestDatasets` (list_all_datasets, filter_by_circuit, filter_by_session_type), porque el catálogo esperado no se montó. No es una suite global verde.

Cierre del banco: servicios principales backend8180/gateway8010/interfaz5173 respondenHTTP200; no quedan contenedores con la etiqueta de propiedad del banco ni procesos padre del relay. Revisión final independiente del delta sin nuevos hallazgos importantes; no certifica seguridad completa ni valida los resultados físicos.

## Gates de salida

Pendientes: aceptación positiva de especialistas con IA real y diagnóstico retenido, contraste independiente de2D, medidas físicas reales, issuer/membresías/RLS cloud, perímetro y vías paralelas de autoridad, auditoría de seguridad completa, enrolamiento y sincronización autenticada de nodos, y piloto con decisiones humanas reales. El titular humano y su sustituto conservan la decisión final. No hay disponibilidad comercial acreditada.
