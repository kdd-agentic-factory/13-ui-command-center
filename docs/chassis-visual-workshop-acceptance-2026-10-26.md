# Chassis visual y taller — aceptación del 26 de octubre de 2026

Entrega local de ingeniería, no autorización de puesta a punto ni certificación para venta. Implementación sobre la base de trabajo aceptada; sin commits, despliegue, migraciones cloud ni cambios de modelo.

## Entregado

Cuatro vistas SVG integradas en Chassis: geometría global, horquilla, tren trasero y escenario de curva. Un borrador B compartido, selección de piezas, despiece visual, configuración medida, fichas revisables, búsqueda discreta Target Lock, órdenes bloqueables y anexos inmutables. El informe histórico conserva su contrato. La curva de suspensión usa puntos y constante de muelle aportados; los clicks no predicen fuerzas hidráulicas.

La pose 1.1 separa dirección global y eje de dirección del marco de chasis. Rechaza incoherencias de dirección/batalla. Las propuestas Target Lock actualizan geometría global estimada únicamente tras aceptación explícita en B. No altera A ni mueve componentes reales.

Las extensiones de taller entran en la identidad del snapshot, pero no amplían el contrato físico de la IA. Sus diferencias bloquean candidatos físicos y la autorización de propuestas anteriores. El humano conserva la decisión final; el agente no aprueba órdenes. El entorno principal permanece local sin autoridad humana autenticada.

## Revisión independiente y correcciones

Se revisaron 71 archivos congelados contra sus baselines. Veredicto inicial: cambios requeridos. Se aceptaron los seis hallazgos y se abordaron en una única pasada final:

| Hallazgo | Corrección y comprobación |
|---|---|
| P1: cambios de arandelas/modelo ocultos tras un offset aprobado | Bloqueo en catálogo y gates de propuestas; manifiesto de extensiones sin cobertura en orden. Regresiones de candidato, propuesta anterior y orden mixta. |
| P1: rake global reutilizado como ángulo local | Nuevo eje medido del chasis, consistencia de referencia, actuador separado y geometría global derivada al aceptar B. Pruebas analíticas y de aplicación en interfaz. |
| P2: orden cancelada revivía al anexar una revisión anterior | Revisión solicitada marcada histórica/no ejecutable y cabeza actual consultada registrada por separado. |
| P2: preview mezclaba grabación y borrador de motos diferentes | Comprobación del vínculo autoritativo de moto, con rechazo 422. |
| P2: pérdida aparente de registros después de 100 | Paginación por cursor consumida por las listas; filtro de comparación antes del límite. Caso de 105 registros. |
| P2: Target Lock conservaba límites de una ficha revisada | Identidad de fichas incluida en vigencia del resultado y respuesta pendiente. Dos regresiones de interfaz. |

El revisor no certificó precisión física independiente, instalación segura, flujo físico positivo completo orden/aplicación/finalización ni carreras de designación remota. Tampoco certificó UI, compilación o regresión por no ejecutar el producto; las comprobaciones del implementador se detallan debajo. No hubo hallazgos menores del revisor diferidos.

## Evidencia de verificación

| Comprobación | Resultado |
|---|---|
| Física afectada 17, banco aislado | 33 pasan; 45 no seleccionadas, incluida comparación SciPy incompatible con el banco. |
| Taller y autoridad SQL real efímera | 53 pasan, 688 no seleccionadas. |
| Ingeniería sin integración HTTP | 301 pasan, 3 omitidas, 437 no seleccionadas. |
| Integración HTTP y autoridad SQL efímera | 5 pasan, 91.40 s. |
| Vitest nativo completo 13 | 88 archivos, 410 pruebas pasan. Avisos de i18next/act/configuración cloud en tests conservados. |
| Interacción/SSR de taller | 13 pasan, incluidos resultados tardíos, fichas revisadas, geometría derivada y protección de borradores. |
| TypeScript aplicación | Pasa. |
| Build Vite nativo | Pasa; aviso de chunks grandes, pendiente de optimización de empaquetado. |
| Wheels 17 y 18 | Construidas e importadas fuera de los checkouts; seis esquemas, rutas y autoridad desactivada comprobados. |
| Regresiones 01/02 | 161 y 118 pasan en esta fase. |

Los intentos generales agotados a 120 segundos (exit 124) no se contabilizan como aprobados. Las suites se separaron por dependencia sin aumentar presupuestos. El intento de taller sin namespace SQL tuvo un error de infraestructura `docker` ausente; la ejecución posterior con PostgreSQL efímero sí pasa. El fallo SciPy se conserva: los binarios Windows no funcionan dentro del banco Linux; no se cambió la aserción ni se instaló otra dependencia.

Los logs, manifest de revisión, baselines y decisiones se conservan en `.superpowers/sdd/2026-10-26-chassis-visual-workshop/`. Los hashes de la revisión congelada no describen las correcciones posteriores; el manifiesto final se genera aparte.

Confirmación final: build nativo repetido tras redondeo de presentación de Target Lock pasa en 20.08 s. Interacción de taller 13/13 pasa. Detector de diseño ejecutado una vez sin hallazgos. Inspección visual en 1366 px, 1024 px y 390 px sin overflow horizontal; selección SVG del muelle trasero confirmada. El viewport del navegador se restauró. Esta inspección cubre los estados observados, no una auditoría completa de accesibilidad ni metrología.

## Activación local

Backend recargado con lanzador oculto propio, PID 49528, servidor 28780; gateway y worker existentes conservados. Antes del cambio: cero runs activos/reservas, copia SQLite consistente con `quick_check=ok`, `chassis-before-verified-decisions-20261026T172217443775Z.sqlite`. El nombre de backup procede del helper compartido; su fecha corresponde a esta activación.

HTTP 200 en `/api/v1/health`, `/api/v1/chassis/status` y lista de fichas; OpenAPI contiene 13 rutas de taller. Un primer sondeo a `/health` devolvió 404 por ruta incorrecta y se corrigió al endpoint publicado. La interfaz se refrescó tras comprobar ausencia de entradas sin guardar y ya no muestra «Fichas no disponibles». Modo local y autoridad desactivada preservados. AiM declara DLL encontrada pero no sondeada; 2D mantiene `experimental-no-vendor-reference`. Modelo explicador qwen3:4b listo según estado; selección de agentes qwen3:0.6b conservada, sin nueva inferencia real en esta fase. Procesos del worker verificados vivos, sin atribuirles una nueva aceptación de análisis.

## Decisiones de implementación

- Trabajo en el checkout existente para conservar la base dirty/untracked; coste: sin aislamiento adicional. Se guardó baseline exacto de src/tests.
- Se conserva workspace ignorado y evidencias porque no hay commits de recuperación; coste: almacenamiento local.
- DTOs compartidos en 17 y clase de medida reexportada: evita circularidad y mantiene payloads antiguos; coste: dos rutas de importación.
- Pruebas puras 17 sin fixture DB global incompatible: no prueban esa inicialización. Comparación independiente SciPy no disponible.
- Anti-squat numérico bloqueado por falta de referencia independiente reproducible; IFC geométrico no valida porcentaje.
- Anexos separados del informe histórico: mantiene hashes; coste: descarga complementaria.
- Eje de chasis explícito y validación de consistencia: exige una medida nueva, sin reinterpretar datos antiguos.
- Diferencias de taller bloqueadas hasta ampliar el contrato físico revisable: no hay prescripciones ejecutables de shim stack, componentes o geometría mecánica nueva por el mero hecho de visualizarlos.

## Pendientes que impiden afirmar «listo para vender»

Contraste independiente del lector 2D con salida del fabricante; metrología de una moto real; mapa hidráulico y validación mecánica; demostración positiva completa de orden física autorizada/aplicada/finalizada; garantía transaccional de autoridad remota; activación real de identidad, membresías y operación productiva. La aceptación anterior con IA local real es evidencia histórica, no una nueva aceptación del conjunto ampliado.

El nuevo prototipo de suite maestra se incorporó a la matriz de requisitos. Frenos, embrague, ergonomía, geodesia/visión/SLAM, neurofisiología y optimización bayesiana siguen pendientes. Sus cifras de demostración, interfaces o animaciones no prueban sensores, modelos entrenados ni mejoras de vuelta reales. No hay Pacejka, aero, EEG/EMG o diagnóstico clínico contrastados en esta entrega.
