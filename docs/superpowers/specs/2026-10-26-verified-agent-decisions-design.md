# Decisiones verificables de los agentes de Chassis Tool

Estado: especificación aprobada por el usuario el26 de octubre de2026, tras elegir decisiones verificables frente a probar otro modelo/nodo. Plan de implementación pendiente de revisión; ejecución en esta sesión conservada.

## Intención y evidencia

Conseguir que los especialistas distingan una revisión sustentada, una solicitud concreta y su propia incapacidad para concluir. Chassis Tool y el snapshot de circuito/moto/piloto/sesión/setups siguen siendo el centro; la decisión final es del Crew Chief humano titular o sustituto designado.

El expediente `docs/engineering-actionable-ai-acceptance-2026-10-26.md` documenta que0.6B y4B no superaron el análisis real. La gramática ya evita combinaciones estructurales inválidas, pero los modelos siguen inventando requisitos, pidiendo evidencia genérica o agotando su plazo. Cambiar otra vez las instrucciones no es una aceptación. Esta propuesta cambia el contrato de decisión; no garantiza competencia de los modelos probados.

## Alternativas y elección

1. Catálogo de solicitudes comprobadas, decisión explícita y abstención: elegido por el usuario. Reduce la posibilidad de inventar un dato ausente, cuesta un contrato nuevo y exige comprobar la política del catálogo.
2. Otro modelo o nodo local: puede mejorar capacidad/latencia, pero requiere evaluación y recursos; no garantiza corregir la semántica de las peticiones. No es el enfoque elegido para esta entrega.

Se descartan como solución vaciar solicitudes después de inferir, aceptar tres especialistas en vez de cuatro, relajar el plazo y sustituir silenciosamente al agente por reglas. El preflight determinista se presenta como tal.

## Alcance declarado de las capacidades

La nueva revisión cubre referencias de cálculos planos y señales escalares calibradas ya presentes en el contrato público: trail_m, normal_trail_m, wheelbase_m, longitudinal_acceleration, suspension_displacement y filtered_suspension_velocity. No recalcula ni añade magnitudes. Los roles críticos siguen siendo chassis, mechanical-check, evidence-quality y alternative-hypotheses.

Se distinguen capacidades `planar_geometry_review` y `calibrated_signal_review`. Cada tarea recibe del servidor las capacidades que debe revisar a partir de la comparación congelada y sus referencias disponibles. No las elige el modelo. Una declaración de éxito solo cubre ese alcance limitado; nunca certifica toda la moto ni una comparación exhaustiva.

La suspensión progresiva y sus fuerzas permanecen disponibles en el motor físico existente. Sus magnitudes de fuerza/rigidez no están en las seis referencias de IA actuales: esta entrega no afirmará que un agente las ha validado. `suspension_force_review`, circuito/clima/neumáticos sin contexto proyectado, físico/neuro y Registry/RAG no integrado permanecen explícitamente no disponibles. Ampliar esas capacidades es otra entrega, no un éxito implícito de este contrato.

## Flujo y responsabilidades

1.18 autoriza el grant, obtiene el snapshot exacto y construye un contexto de decisión y su catálogo desde datos congelados, sin telemetría original ni nuevos cálculos.
2.01 recibe contexto, alcance, limitaciones y opciones verificadas por MCP. El preflight puede bloquear antes del modelo y queda identificado como determinista.
3. El modelo realiza una sola decisión terminal con referencias: revisión sustentada, petición de una opción o abstención.
4.18 valida esquema, identidad del catálogo, decisión y referencias, y expande la opción elegida.01 comprueba el sobre y las invariantes del resultado. El sellado18 vuelve a comprobarlo antes de persistir.
5. Agregadores e informe conservan decisión original, diagnóstico y evidencia. El Chief agente solo prioriza candidatos permitidos. La autoridad humana y los eventos de montaje/validación no cambian.

La nueva llamada de modelo no aceptará `prompt` ni un catálogo arbitrarios del trabajador. El servidor18 construirá la entrada desde su proyección autorizada.01 enviará el target delegado, versión y digest esperados; no podrá sustituir valores SI, el alcance ni los motivos de ausencia. Esto hace comprobable que la decisión respondió al contexto real autorizado.

Dos modos explícitos de preflight: `reference_review` para snapshots analizables y `input_triage` exclusivamente para corregir entradas. El segundo solo se admite si el único motivo de bloqueo es `physical_inputs_missing`, el contexto está completo, la fuente y las identidades son válidas y existe una opción comprobada del catálogo. En triage el snapshot sigue analyzable=false y solo se permiten request_input/abstain, aunque no existan referencias calculadas; no se ejecuta análisis físico ni se puede emitir succeeded. Cualquier otro bloqueo —incluido2D experimental, dominio inválido, contexto incompleto o cobertura insuficiente— impide inferencia de especialistas. Un conjunto vacío de evidencia sin ese triage válido también sigue bloqueado. Esta distinción permite probar una solicitud real sin abrir el gate de análisis ni el de aprobación física.

La decisión nueva es terminal: no contiene tool_requests ni abre una segunda ronda. Las herramientas de lectura históricas y sus resultados siguen siendo legibles, pero no forman un bucle de generación del contrato nuevo.

## Catálogo determinista y vinculación

`DecisionContext`1 contiene versión de política, rol, capacidades, estado de cobertura, opciones, limitaciones y digest canónico. El digest vincula task_id, snapshot_digest, rol, versión de política y contenido completo del catálogo. Se construye una vez de forma determinista a partir del snapshot; no se persiste modificando el snapshot ni se regenera un hash histórico.

Cada opción identifica el InputRequest tipado existente, estado observado y capacidad afectada. Su identificador canónico se deriva del selector/contenido con hash; el modelo utiliza alias locales q0… con expansión exacta. Los alias no son credenciales, no dan acceso a otro objeto y no se aceptan fuera de esa llamada. El orden se canoniza; se rechazan duplicados, IDs desconocidos y catálogos de otro rol/tarea/snapshot.

El modelo recibe una vista sanitizada del contexto, no el sobre de autoridad ni el digest que incorpora task_id/snapshot_digest. El mapeo de alias y ese sobre se mantienen fuera del prompt. Física idéntica con otras identidades opacas debe seguir produciendo la misma entrada wire; el digest de autoridad sigue siendo diferente y no intercambiable.

Las reglas se implementan autoritativamente en18, donde están los datos y los motores de dominio.01 deja de duplicar la política física para decisiones nuevas y valida las opciones firmemente vinculadas al contexto recibido. El lector histórico mantiene el comportamiento necesario para resultados antiguos.

Política inicial cerrada:

- Geometría: catálogo restringido a front_radius_m, rake_rad, offset_m y wheelbase_m por setup seleccionado, respetando las dependencias del cálculo ya existente. Los tres primeros son entradas de trail/normal_trail; wheelbase es opcional en evaluate_static y no se convierte en requisito universal. Una ausencia solo se ofrece cuando concuerda con el diagnóstico de entradas faltantes del cálculo congelado y con el valor ausente en ese setup. Si las fuentes discrepan, se declara contexto no verificable, no se inventa una carencia. Valores asumidos e incertidumbre desconocida son limitaciones; no generan peticiones de medición para leer geometría.
- Una curva, calibración, intervalo, masa o muelle nunca se ofrecen por defecto para geometría. Una intención de cambio físico no existe en este contexto: no se deduce de un parámetro asumido.
- Señales: solo se revisan cantidades y unidades ya proyectadas con su calibración congelada. La calibración debe corresponder al tipo de señal. Un metadato requerido para interpretar esa señal que no está representado bloquea por cobertura; no se finge un valor ausente ni se solicita calibración para una geometría sin señal seleccionada. La referencia de extensión completa, curva o muelle requerida para calcular fuerzas no se convierte en requisito universal para leer un mínimo/máximo de desplazamiento.
- Diagnósticos de fuerzas/replay que no estén congelados y proyectados no se reconstruyen a partir de avisos inventados ni se toman del estado vivo. La capacidad se declara no disponible.
- No se ofrecen integraciones de dominio no existentes como si el usuario pudiera arreglarlas subiendo una medición. Se identifican como capacidad no disponible.

Un blocker verificado impide declarar completado el alcance al que afecta. Todavía se pueden devolver referencias parciales en una petición o abstención; no se pierden ni se presentan como revisión terminada. La lista vacía de opciones significa únicamente que no hay una petición verificable representable, no que existan todos los datos físicos ni que el modelo deba aprobar.

## Decisión del modelo

Unión discriminada cerrada, sin prosa libre ni valores propuestos:

- `review_supported`: referencias suministradas, hipótesis/alternativas de catálogo cuando proceda, supuestos y limitaciones. Requiere referencias válidas para cada capacidad asignada, ningún blocker verificado pendiente y una inferencia registrada. No equivale a recomendación física aprobada.
- `request_input`: elige una opción del catálogo de la llamada; no inventa source/field/parameter/reason. El servidor expande la solicitud y su diagnóstico. Queda bloqueado por entradas, con el dato concreto visible.
- `abstain`: motivo cerrado `insufficient_evidence`, `model_capability_limit` o `context_not_representable`, con referencias parciales y limitaciones opcionales. No afirma que falte una medición y nunca cuenta como éxito.

La abstención está siempre disponible cuando se llama al modelo. `request_input` solo está disponible si existen opciones verificadas. `review_supported` no se ofrece cuando hay un blocker verificado del alcance asignado. Esta restricción expresa acciones permitidas; no convierte una salida inválida en válida ni fuerza el éxito. Toda salida inválida, contradicción o resultado tardío se conserva como fallo de ejecución.

Los códigos genéricos históricos de missing_inputs no son un campo seleccionable por el modelo nuevo. Se siguen leyendo literalmente en resultados viejos. Ninguna migración vacía esas listas o reinterpreta sus estados. Se conserva la decisión seleccionada y su expansión separadamente.

## Contratos, autorización y persistencia

Decisión del diseño propuesta: herramientas5.0.0, contrato de tarea2.0.0, resultado3.0.0 y registro7.0.0; DecisionContext1. El contexto técnico2 y la serialización/hash de snapshots existentes no se cambian. Las versiones definitivas se cotejarán con el registro al elaborar el plan, sin reutilizar versiones de otro contrato incompatible.

El nombre registrado engineering.local_model_json se mantiene para conservar el circuito de reservas/deadlines, pero su entrada nueva sustituye el prompt libre por versión/digest de contexto. La versión de tarea discrimina el contrato permitido; una tarea nueva no puede usar la forma antigua para eludir la política.01/02/18 se actualizan conjuntamente; no se habilita mezcla de versiones en ejecución. Los grants siguen sujetos a equipo, tarea, rol y snapshot; el catálogo no amplía permisos.

Resultado3 conserva decisión canónica, contexto/digest de catálogo, referencias, diagnóstico, metadatos del modelo e invocación. El sellado rechaza incoherencias status/decisión, éxito sin modelo, opción de otro catálogo, referencias ajenas y blockers pendientes. Las versiones1/2 históricas conservan lectura y hashes exactos. Nuevos campos opcionales de informes/posiciones se omiten cuando no existían históricamente.

Una revisión sustentada se mapea a succeeded; petición a blocked_missing_inputs/model_reported_missing_inputs; abstención a blocked_missing_inputs con motivo específico de abstención, sin fabricar MissingCode. Fallos de transporte/esquema/plazo siguen siendo failed/unavailable/timed_out separados. El Chief y sus gates de disponibilidad siguen usando status y evidencia, no longitud de listas.

## Límites y ejecución

No se añaden rondas de inferencia: máximo una decisión por especialista en el flujo inicial, dentro de12 llamadas/2slots/60s por llamada/600s por run. El Chief conserva su llamada separada. Sin retries ocultos, cambios de modelo, descargas o ampliaciones de plazo.

Máximo20 opciones por catálogo, sin truncar: exceso o política/cobertura desconocida bloquea explícitamente. El contexto/catálogo completo enviado al modelo debe caber en16000 caracteres con todos los hechos que exige la revisión; la respuesta mantiene64KiB, resultado12KB y sobre MCP128KiB. Alias y serialización compacta pueden reducir duplicación de identidad, no redondear valores ni eliminar incertidumbre/curvas. El caso existente de74 agregados sin blockers debe seguir pasando. Catálogo y alias nunca se recortan para obtener un verde.

Cada invocación reserva un slot/llamada antes de generar. Se descartan decisiones tardías, snapshots/grants revocados, leases vencidos y contextos con digest incorrecto. El control de montaje, revocación y designación humana no se traslada al modelo.

## Interfaz y prueba de calidad

Mostrar origen de cada resultado: preflight determinista, decisión de agente, expansión/validación de servidor y decisión humana. Una abstención debe decir que el agente no pudo concluir, sin pedir una curva o medición inexistente. Un catálogo vacío no muestra “datos completos”. Informes históricos conservan sus etiquetas y causas.

Pruebas de aceptación antes de activar:

1. Catálogo positivo/negativo con parámetros presentes, asumidos y ausentes; desacuerdo de metadatos; ninguna curva universal; señales compatibles; capacidad de fuerza no disponible; cobertura parcial/exceso explícitos.
2. Identidad/digest, alias invariantes, rechazo de otra tarea/rol/equipo/snapshot, prompt/catálogo no sustituible por el cliente, duplicados y versiones cruzadas.
3. Tres decisiones, referencias por capacidad, éxito contradictorio rechazado, abstención con catálogo vacío todavía bloqueada, selección exacta de petición y roundtrip sin reescribir resultados1/2.
4. Presupuestos/cancelación/leases y sellado; ningún preflight o resumen determinista cuenta como llamada de IA exitosa ni aprobación humana.
5. UI e informes de los tres estados, legado y errores; typecheck, paquete fuera del checkout y recorrido visual aislado.
6. Mantener el positivo existente con cuatro especialistas críticos y Chief, sin cambiar sus medidas/procedencia para facilitarlo. Añadir un negativo independiente con un blocker verificable y conservar2D experimental. Modelo local configurado explícitamente; registrar estados, digests y duración antes de asserts. La abstención honesta puede satisfacer el caso insuficiente, nunca el positivo.

## Lo que no aprueba esta entrega

No acredita2D, mediciones reales, recomendaciones físicas de fuerza progresiva por IA, issuer/RLS cloud, federación/enrolamiento de nodos, despliegue, pagos ni disponibilidad comercial. No autoriza transmitir telemetría ni contactar a terceros. Si el modelo sigue absteniéndose o no pasa el positivo, el gate permanece y se registra el límite; no se presenta esta arquitectura como garantía de calidad.
