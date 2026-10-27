# Estado de entrega — Chassis y Crew Chief

26 de octubre de2026. El flujo de decisiones verificables está activo localmente con qwen3:0.6b. Aceptación real: positivo con cuatro especialistas críticos y Chief, petición exacta de offset ausente y bloqueo de fuente2D experimental. Backend y gateway HTTP200; worker activo. Autoridad local sin aprobación física. No hay despliegue ni migración cloud.

Verificación de esta entrega:161 unidades01,118 pruebas02,301 de ingeniería18,13SSR y typecheck; cinco escenarios HTTP controlados. El build nativo y la suite global completa no se acreditan. Sigue pendiente contrastar2D con fabricante, validar medidas físicas, activar identidad de producción y completar auditoría comercial. No se declara producto listo para venta. Evidencia: engineering-verified-decisions-acceptance-2026-10-26.md.

## Historial anterior (superado por el estado anterior)
# Estado de entrega — Chassis y Crew Chief

26 de octubre de2026. El núcleo anterior está activo localmente; la ampliación de IA accionable permanece pendiente de activación por aceptación real fallida. La aceptación operativa/comercial está incompleta. No se ha publicado ni aplicado una migración cloud. Los cambios permanecen en los repositorios de trabajo.

## Ampliación de IA accionable del 26 de octubre

Plan aprobado `2026-10-26-actionable-ai-production`: implementados contratos de herramientas4/resultado2, solicitudes de entradas tipadas y comprobadas contra el snapshot, contexto canónico independiente de UUID, conservación en informes y presentación de correcciones concretas. Esta ampliación todavía no se ha recargado en los servicios principales. Las referencias históricas y sus hashes se conservan.

La revisión independiente encontró cuatro fallos importantes y se corrigieron con regresiones: alcance físico determinado por la operación seleccionada, alias del identificador de calibración, incompatibilidad según referencia de desplazamiento declarada y paridad estructural entre JSON Schema y DTO. Una comparación no demuestra intención de cambio físico; se declara no verificable. La geometría no exige procedencia medida ni curvas universales. El replay distingue señal de rueda/amortiguador y parámetros de curva progresiva/relación constante.

Verificación nueva:152 pruebas unitarias de01,118 de la suite completa de02,32 focales de contexto/contratos/informes,44 de informes/decisiones/autoridad SQL y7 comprobaciones SSR de interfaz. El E2E HTTP con backend, gateway, trabajadores y PostgreSQL efímero pasó sus cuatro escenarios controlados en68,12s. No equivalen a inferencia real ni a validación física.

Límites explícitos de suites globales:01 no completó colección de `test_workflow_graph.py` por `uuid_utils._uuid_utils` ausente en el banco Linux. La ejecución global de18 se detuvo con27 pruebas pasadas y tres fallos de `TestDatasets` en `test_api_endpoints.py`: exige un catálogo no montado en el aislamiento. El barrido de ingeniería llegó a252PASS/3SKIP/3FAIL: dos subprocesos requerían `.venv/bin/python` y una fixture de transporte omitía metadatos de alcance. Se corrigieron la selección del intérprete aislado y la fixture, sin rebajar los asserts; su comprobación final se registra en el expediente de aceptación. No se afirma suite global verde.

Aceptación con Ollama real: positiva FAIL159,49s, Chief completado y cero especialistas críticos con éxito. Cinco llamadas respondieron; no se conservó el motivo por especialista porque el harness imprimía ese resumen después del assert. El resumen se movió antes del assert; no se repitió la positiva. Negativa2D PASS47,57s: agentes bloqueados por fuente experimental, una llamada real del Chief y solo propuesta de medición. Detalles/hashes/límites en `engineering-actionable-ai-acceptance-2026-10-26.md`. El barrido final de ingeniería pasa255 pruebas,3omitidas; las cuatro regresiones de fixtures/intérprete pasan42,23s. Wheel nuevo offline comprobado fuera del checkout. Esta ampliación no se activa ante la aceptación positiva fallida.

Servicios principales HTTP200 antes del ensayo, modelo principal0.6B y autoridad disabled conservados. Auditoría amplia de producción: `production-readiness-review-2026-10-26.md`; el expediente de seguridad sigue incompleto y los gates de2D, medidas físicas, identidad cloud y despliegue siguen abiertos.

Continuación autorizada: localizado rechazo de combinaciones de selector en `requested_inputs[0]`. Gramática interna reexpresada en ramas explícitas equivalentes al contrato público:5824 comprobaciones de paridad y60 pruebas focales pasan; barrido de ingeniería256PASS/3SKIP. Instrucción de revisión limitada aclarada y compactada manteniendo todos los hechos y el límite16000;152 unidades pasan. La revisión independiente no encontró hallazgos importantes en estos cambios. Ni0.6B ni el candidato4B instalado completaron la aceptación positiva. Último4B: tres solicitudes no aplicables y un timeout, Chief completado, FAIL309,31s. No se certifica mejora de capacidad por la aclaración del prompt. Los modelos no pueden considerarse competentes para este flujo sobre la base de estos ensayos; no se elimina el gate ni se activa un fallback. Expediente y metadatos guardados.

Verificación de cierre de esta continuación:261 pruebas de ingeniería pasan,3omitidas,39,95s; E2E controlado secuencial4PASS60,88s. Se conserva aparte el timeout120s de una ejecución concurrente del banco; no se interpreta como verde ni se oculta aumentando límites. Los servicios principales respondenHTTP200 y se cerraron los recursos propios de QA.

## Qué queda implementado y revisado

- Contexto de sesión versionado: circuito, moto, piloto, tipo y procedencia; asociación explícita a grabación y setups persistidos.
- Snapshots inmutables y dos líneas de análisis: especialistas y contraste independiente por proceso, con evidencia, límites y discrepancias. Compartir modelo no equivale a validación externa.
- Crew Chief agente separado de titular y sustituto humanos. Decisión, montaje y validación posterior son eventos distintos; permisos comprobados por servidor.
- Interfaz de propuesta, evidencia, designaciones, informe persistido y recuperación del análisis.
- Últimos tres hallazgos importantes cerrados por relectura independiente: validación histórica aunque cambie el contexto/propuesta; reconciliación autenticada de inicios persistidos tras recargar; entrega a los revisores de contexto técnico congelado y tipado.
- Contexto técnico acotado a 64 puntos de curva y 8192 bytes; cualquier exceso declara cobertura ausente y bloquea revisión, sin remuestreo silencioso. Corrección revisada el 26 de octubre: versión física, datos faltantes, avisos y valores SI con unidad/procedencia/incertidumbre llegan desde el snapshot congelado. Contrato de herramientas 3.0.0, registro 5.0.0 y contexto técnico 2.0.0 requieren actualización conjunta01/02/18; no cambian el cálculo ni el snapshot persistido.

## Comprobación y sus límites

La integración positiva usa dos procesos de trabajador reales, gateway y backend por HTTP, SQL real efímero y modelo/identidades controlados. El navegador recorre contexto → asociación A/B → nueve tareas → propuesta → aprobación SQL → informe → invalidación. No acredita issuer cloud, inferencia física ni Ollama real. Los setups del E2E se preparan por HTTP; no se afirma introducción manual de todas sus cotas.

Suites completas acreditadas antes de las últimas correcciones:01:140 PASS;02:115 PASS; frontend397 PASS;18:580 PASS,20 SKIP y1 FAIL previo en storage. Tras la última tanda se ejecutaron ámbitos afectados: UI58 PASS y32 PASS después del último arreglo;01:47;02:24;18:97 y6 de proyección finales. Typecheck/build terminados sin errores; siguen avisos conocidos de dependencias/bundle. Wheel reconstruido e instalado fuera del checkout, ambos smokes con python-I correctos. No se afirma suite18 completamente verde ni lint global limpio.

Inspección agrupada escritorio1440/móvil390, una tanda y una confirmación; teclado/disclosure comprobado en CUA. Detector estático único sin hallazgos. Esto no es una certificación WCAG completa. Las capturas de propuesta identifican modelo controlado; la captura principal conserva la fuente2D real y sus advertencias.

## Bloqueos pendientes

1. **Modelo real:** el 26 de octubre se instaló qwen3:0.6b y se corrigió el transporte de referencias, con expansión determinista y validación estricta. La primera prueba fría terminó en 66,83 s: tres especialistas finalizaron y mecánica pidió evidencia. Tras entregar el contexto físico completo se hizo una única aceptación fría nueva: FAIL en 74,16 s; los cuatro especialistas devolvieron `blocked_missing_inputs/model_reported_missing_inputs` con `additional_evidence`, sin timeouts, y Crew Chief finalizó. El código genérico no identifica qué campo requiere cada agente; no se atribuye a una causa física concreta ni se reescribe la salida para aprobar. La aceptación completa sigue fallando. El ensayo inicial de4B agotó27 s; después se encontró y corrigió una discrepancia: el plan y la reserva ya concedían60 s, pero el adaptador los recortaba a28 y el proveedor a27. Véase la verificación posterior de presupuesto. Ingeniería usa explícitamente 0.6B y el explicador conserva 4B. Esto no acredita precisión científica ni recomendaciones sobre la grabación real.
2. **2D y física:** falta referencia independiente de2D Analyzer y validación con medidas reales de geometría/curva/calibración. El lector nativo sigue experimental; ningún gate se levantó con valores ficticios.
3. **Equipos reales:** migraciones preparadas y SQL comprobado localmente, pero cloud, cuentas y designaciones reales no activados. La conexión del adaptador quedó implementada y revisada el 26 de octubre: fábrica `disabled|insforge`, credencial servidor en archivo externo protegido, issuer de identidad coincidente y contexto aislado por aplicación/petición/threadpool. Permanece apagada por defecto y en el entorno principal. Su prueba local no acredita configuración ni permisos del proveedor real; aplicar SQL por sí solo no configura ni valida esta conexión.
4. **Cobertura científica:** circuito/clima/neumáticos-motor sin contexto proyectado suficiente; físico/neuro no disponibles. No se afirma integración de todos los fabricantes, adquisición de hardware, predicción de ganancia de vuelta ni producto terminado para vender.

Menores diferidos: paridad de UUID en JSON Schema, legibilidad de JSX existente y warnings/Ruff anteriores. El test storage obsoleto se corrigió el 26 de octubre para exigir disponibilidad falsa, mensaje explícito y ausencia de muestras inventadas cuando no existen datos normalizados; la suite storage pasa 17 pruebas. Esto no equivale a una nueva ejecución completa de18.

Corrección posterior de peticiones de evidencia: si el modelo pide una curva medida que ya está declarada medida en ambos setups A/B congelados, su respuesta se rechaza con `requested_input_already_present`. Una curva ausente o declarada sin medir sigue permitiendo una petición legítima. La comprobación no certifica físicamente las curvas. RED1 fallo esperado y después88 pruebas unitarias de01 pasan. Las etiquetas de interfaz distinguen entradas solicitadas de ausencias verificadas; los códigos persistidos se conservan. Revisión independiente sin hallazgos abiertos.

El correctivo se activó reiniciando únicamente el worker inactivo verificado: nuevo worker15772, wrapper9160 y launcher38372. Backend/gateway/interfaz respondieron HTTP200 tras la operación; no se creó un run principal. Un comando combinado anterior había sido rechazado por revisión automática, sin ejecutarse; la acción final acotada se completó por separado. El modelo principal permanece0.6B y la autoridad disabled.

Experimento acotado posterior: el modelo local intermedio qwen3:1.7b se descargó de su fuente oficial y recibió una sola llamada con el mismo contexto QA, codec, esquema y límite27s. Agotó el plazo en27,015s, sin respuesta completa validable. No hubo nueva aceptación E2E, cambios de prompt ni sustitución del modelo principal. La capacidad de análisis local sigue pendiente; no se interpreta este ensayo como precisión física ni como mejora.

Verificación nueva del 26 de octubre: frontend: 410 PASS en 88 archivos, typecheck y build sin errores; 15 pruebas nuevas de arranque/aislamiento de autoridad y 104 pruebas de consumidores del backend pasan. La regresión adicional de protocolo SQL se interrumpió por un error de infraestructura y se conserva sin acreditarla como verde; no hubo cambios SQL ni reparación del entorno cloud.

Paquete de 18 reconstruido sin descargar dependencias, instalado fuera del checkout y comprobado con ambos smokes `python -I`: esquemas/contexto/autoridad deshabilitada, comparación persistida e importación de fixture pasan. Wheel SHA256 `22c87b8afc0a1c85cf7af27dbe0655e400e7a3ca8b848455895b9c04c6447a10`. No es una validación de hardware ni de telemetría real.

## Servicios locales verificados

Aplicación http://127.0.0.1:5173/pit-wall/app; backend8180; gateway8010; Ollama11434. Verificación independiente del 26 de octubre tras la recarga conjunta: backend, gateway, interfaz y grabación real existente HTTP200, worker vivo. PIDs en ese momento: Vite2308, backend11456, gateway1128, worker19576, Ollama34512. Ingeniería usa0.6B, autoridad disabled y contratos nuevos coherentes; no se creó ningún run en los datos principales. Son metadata histórica; comprobar propietario/puerto antes de reiniciar. Sin aprobación humana productiva ni exposición de claves.

## Evidencia y continuación

Expediente: `.superpowers/sdd/2026-10-25-session-crew-chief-dual-analysis/`. `final-review.md` recoge la revisión global; `final-fix-review.md` cierra F1–F3; `final-fix-report.md` contiene los comandos y salidas; `final-delivery-source-manifest.json` une142 archivos, sin discrepancias, con las dos series de revisión. `delivery-decisions.md` conserva las17 decisiones del controlador en orden. Runbook: `docs/engineering-crew-chief-operation.md`.

No borrar el expediente: no se autorizaron commits y contiene baselines, pruebas y decisiones. No hay merge, push, despliegue ni migración cloud. Para continuar, retomar sólo los bloqueos y la aceptación real pendientes; no repetir tareas1–10, la implementación completa de11 ni las revisiones ya cerradas.

Continuación26 de octubre: `.superpowers/acceptance/2026-10-26-local-ai-2d/local-ai-runtime-report.md` contiene el delta revisado de nueve archivos, RED/GREEN, pruebas focales, tiempos reales y metadatos de servicios. El informe de referencia2D del mismo expediente documenta que el usuario no dispone de Analyzer/exportaciones y que no se encontró una pareja pública verificable; el borrador de solicitud al fabricante permanece sin enviar.

Preparación de producto posterior: `.superpowers/acceptance/2026-10-26-product-readiness/` conserva los baselines, deltas y manifiestos separados de autoridad/proyección y las revisiones `product-root-review.md`, `authority-review.md` y `projection-review.md`. El manifiesto histórico de 142 archivos describe la revisión del 25; los cambios posteriores se atribuyen a estos expedientes nuevos.

Continuación de evidencia accionable: `.superpowers/acceptance/2026-10-26-actionable-evidence/` conserva el correctivo de validación y el ensayo del modelo intermedio. El requisito futuro de nodos federados para mejorar informes queda registrado en `PRODUCT.md`; no se conectaron nodos ni se transmitieron datos restringidos.

## Corrección del presupuesto de IA — 26 de octubre

El correctivo revisado restaura el máximo aprobado de60 s por llamada (59 s de proveedor), con transporte específico70/65 s en01/02. No amplía el presupuesto total600 s, las12 llamadas ni los2 slots globales; conserva cancelación, expiración y rechazo de resultados tardíos. Sólo cambian tres líneas de producto y cuatro archivos de pruebas. Revisión independiente sin hallazgos, siete hashes comprobados; verificación raíz01:97 PASS y02:52 PASS, más96 pruebas focales del backend. Expediente `.superpowers/acceptance/2026-10-26-model-budget/`.

Una única llamada fría4B con el mismo caso QA terminó en47,875 s, esquema y referencias exactas válidos, sin petición de entradas. Esto sólo acredita ese caso mecánico sintético. La siguiente aceptación HTTP completa fría **no pasó**: tres especialistas solicitaron `additional_evidence` con `no_external_validation` sin identificar un campo concreto; la línea alternativa agotó el plazo en59,572 s. El harness venció su espera240 s, con Crew Chief aún en curso y ninguna propuesta; terminó FAIL en270,61 s e informó además que un servidor HTTP QA no cerró dentro15 s. No se acredita resultado final del Crew Chief ni aceptación comercial. No se repitió la inferencia ni se relajaron las comprobaciones. El modelo principal se mantiene0.6B.
Activación posterior del correctivo: gateway41276 y worker1496 nuevos; backend11456, interfaz2308 y Ollama34512 conservados. Se detuvieron por separado únicamente los procesos reales comprobados; sus wrappers salieron naturalmente. Salud HTTP200 en interfaz, gateway y backend /api/v1/health, sin runs principales, modelo0.6B y autoridad disabled. Los siete hashes del delta revisado coinciden; no quedan procesos QA del ensayo. La salud no acredita la aceptación del modelo.

## Diagnóstico fiel de respuestas bloqueadas — 26 de octubre

Corregida la clasificación que convertía una respuesta sin referencias o un resumen insuficiente en una petición artificial additional_evidence. Las entradas solicitadas se conservan exactamente; las causas model_reported_insufficient_evidence y model_evidence_references_missing distinguen los otros casos, siempre bloqueados. La interfaz explica las causas. No cambian el prompt, el esquema, los cálculos ni los controles de aprobación. RED3 fallos esperados/2PASS; GREEN102 pruebas unitarias de01 y34 pruebas del panel/presentación pasan. Revisión independiente sin hallazgos; manifiesto de3 archivos comprobado. Expediente `.superpowers/acceptance/2026-10-26-analysis-causes/`.

La lectura forense del E2E anterior confirma que los tres modelos sí devolvieron missing_inputs=[additional_evidence], con9 referencias y3 evidenceIDs; no eran casos del fallback corregido. El correctivo no resolvería retrospectivamente esos bloqueos. Frente al diagnóstico aislado válido, la reconstrucción del prompt conserva los mismos datos físicos/instrucciones y difiere en UUIDs opacos y orden de referencias. Es una hipótesis de sensibilidad del modelo, no causalidad demostrada; no se ejecutaron nuevas inferencias ni se alteraron resultados históricos.
Activación de este correctivo: únicamente worker9640 nuevo, modelo0.6B/autoridad disabled, ningún run principal. Verificación raíz: worker vivo y backend/gateway/interfaz HTTP200. Sin nuevas inferencias ni reinicio de los otros servicios.

