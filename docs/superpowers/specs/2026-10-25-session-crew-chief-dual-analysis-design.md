# Sesión de ingeniería, Crew Chief y contraste independiente

Fecha: 2026-10-25. Estado: aprobada por el usuario el 2026-10-25; implementación en curso. Catálogos/expedientes y snapshots backend completados con revisión independiente; el flujo completo de agentes y decisión todavía no está operativo.

Revisión de implementabilidad independiente completada: sin preguntas importantes pendientes. No equivale a verificación de implementación.

## Intención y decisiones confirmadas

Chassis Tool es el centro de un expediente de ingeniería por equipo. El usuario selecciona circuito, moto, piloto y tipo de sesión y trabaja con la geometría, setups y telemetría reales. Especialistas y líderes de sección fundamentan una propuesta que el agente Crew Chief presenta al responsable humano. El usuario ha elegido una jerarquía coordinada y una segunda línea de agentes autónomos para aportar enfoques independientes. Solo el Crew Chief humano titular o su sustituto designado pueden aprobar. Ninguna identidad de agente puede ejercer esa autoridad.

Se conserva la implementación previa y sus límites. Esta ampliación organiza el análisis y la decisión; no certifica el motor físico ni completa por sí sola las 39 capacidades del informe recibido.

## Enfoques considerados

1. Solo jerarquía coordinada: facilita consistencia y auditoría, pero carece del contraste independiente solicitado.
2. Solo agentes autónomos conversando: flexible, pero difícil de reproducir y de impedir contaminación entre conclusiones.
3. Elegido por el usuario: jerarquía principal más línea autónoma de contraste, sobre la misma versión de entradas, con resultados separados antes de confrontarlos. Exige más ejecución y persistencia, y permite distinguir ausencia de contraste de coincidencia real.

## Estado real y fronteras de repositorios

- 13-ui-command-center: React/Vite, Chassis, importaciones, biblioteca, comparación A/B, informes y cobertura del producto. Los selectores históricos mezclan modalidad de sesión con reproducción/demostración y contienen ejemplos: no usarlos como hechos de una sesión real.
- 18-telemetry-dataset: identidad por equipo, grabaciones, setups versionados, comparación y evidencia. Es autoridad del expediente, propiedad de sus objetos y aprobaciones. Mantiene la autorización exacta por método/ruta y el aislamiento local existente. No almacena razonamiento privado del modelo.
- 17-digital-twin-simulation-lab: cálculos físicos deterministas ya disponibles. Los LLM no sustituyen este motor ni inventan clics, presiones o ganancias de vuelta.
- 01-agent-orchestrator: coordinación, políticas, workflow_id, etapas KDD y trazas. CrewChiefAgent hoy devuelve un sobre de delegación. No implementar aquí algoritmos de telemetría ni acceso directo a datos crudos. Sus herramientas pasan por 02-mcp-gateway, y el conocimiento gobernado por 03 y 04 conforme a AGENTS.md.
- 07-agentic-workflows: contrato declarativo del flujo y validación de sus dependencias.
- 21-agentic-backend-insforge: identidad y membresías del producto Chassis; preparar migración adicional para designaciones, sin aplicar a cloud. La migración 012 existente continúa siendo prerrequisito.
- 15-race-command-center: integración mediante enlace al expediente canónico; sus decisiones y su proyecto de identidad no se importan como aprobaciones de Chassis.

Decisión técnica propuesta: conservar React/TypeScript y Python y sus contratos existentes, sin introducir otro runtime de agentes. Herramientas ausentes se muestran como no disponibles. Un sobre delegado o una llamada simulada no cuenta como análisis ejecutado.

## Expediente y contexto

Entidad EngineeringSession con UUID, team_id obtenido del principal, revisión monotónica, creador y fechas del servidor. Referencias versionadas a circuito, moto y piloto del catálogo del equipo; tipo de sesión: stint, warm_up, practice, qualifying, test, race u other (con etiqueta). La procedencia de datos live/recorded/sample/synthetic es independiente: una carrera grabada sigue siendo race. No presentar live sin adquisición activa comprobada.

Catálogos mínimos del equipo: nombre, identificador, revisión y campos necesarios de cada entidad, con CRUD de engineer/admin, lectura por miembros y borrado lógico cuando haya referencias. Datos opcionales desconocidos quedan vacíos. Los ejemplos históricos no se convierten automáticamente en pilotos, motos o geometrías medidas. Circuitos de referencia públicos se copian como referencia identificada, sin afirmar reconocimiento automático por GNSS. Los nombres de pilotos y catálogos privados permanecen dentro del equipo.

El expediente puede comenzar sin grabación. Se puede configurar y guardar, pero análisis físico queda blocked_missing_inputs hasta tener entradas válidas. Admite varias grabaciones de la misma sesión asignadas explícitamente por el humano y una comparación A/B seleccionada. Cada ejecución declara qué grabación, intervalos y revisión usa; no mezcla automáticamente tandas. Seleccionar una moto no certifica que un archivo pertenezca a ella.

Antes de ejecutar se congela un AnalysisSnapshot inmutable: revisión de contexto y de sus entidades, identificadores y hashes de grabaciones/validación, calibración y ventanas, revisiones A/B, comparación persistida, fuentes ambientales autorizadas, versión del motor y herramientas. El digest se calcula con serialización canónica versionada en servidor. Cambiar cualquier entrada crea una nueva revisión; no sobrescribe snapshots ni aprobaciones antiguas.

## Organización principal

Tres líderes de sección:

| Sección | Especialistas iniciales | Responsabilidad |
| --- | --- | --- |
| Motocicleta | chassis; tires-powertrain | Geometría, suspensión, cargas y señales disponibles de neumáticos/propulsión |
| Circuito | track; weather | Contexto de pista, superficie y ambiente con procedencia |
| Piloto | physical; neuro | Entradas autorizadas y validadas del piloto, sin diagnósticos |

Se conservan los seis identificadores del catálogo actual. Debrief revisado por el humano puede ser evidencia subjetiva de sesión, sin crear automáticamente biometría ni inferir estados mentales. Integraciones de visión, EMG, EEG y otros sensores no implementados siguen explícitamente unavailable. Un líder informa cobertura y conflictos aunque ningún especialista de su sección pueda correr. Líderes y Crew Chief no rellenan resultados ausentes.

SpecialistResult versionado: snapshot_digest, workflow_id, run_id, branch, agent_id/role, sección, versión de contrato/herramienta/modelo, estado, observaciones, cálculos referenciados, hipótesis etiquetadas, alternativas, supuestos, missing_inputs, límites y proposed_tests. Cada afirmación cita evidence_ids del manifiesto autorizado. No se aceptan identificadores inventados, unidades incompatibles, resultados no finitos ni números físicos nuevos de un LLM.

Estados de tarea: queued, running, succeeded, blocked_missing_inputs, unavailable, failed, timed_out, cancelled. Un resultado negativo válido no es un fallo. Se registran duración y causa acotada; no se muestran trazas sensibles. Los líderes producen SectionSummary, conservando posiciones minoritarias y conflictos. El Crew Chief produce un borrador principal inmutable antes de la confrontación.

## Línea autónoma e independencia

La autonomía significa que cada agente elige entre herramientas de lectura autorizadas y propone hipótesis/pruebas dentro de un presupuesto. No permite herramientas nuevas, acceso fuera del equipo, escritura de setups, ejecución de hardware ni ampliación de permisos.

Tres revisores iniciales propuestos por ingeniería: mechanical-check (dominio y coherencia física), evidence-quality (lectura, calibración, ventanas y suficiencia), alternative-hypotheses (explicaciones alternativas y pruebas discriminantes). Son identidades y contextos distintos de los autores principales. Reciben el mismo AnalysisSnapshot y las evidencias autorizadas; no reciben resúmenes, prompts, propuestas ni conversaciones de la línea principal. No se comunican entre sí antes del cierre. La API de herramientas exige run_id y branch y aplica en servidor el alcance de lectura; separar solo el texto de prompts no basta.

Cada salida se persiste inmutable con hash y fecha antes de revelar el borrador principal. La fase de confrontación posterior sí recibe ambas salidas cerradas y registra enlaces explícitos. Un reintento previo a cierre puede repetir trabajo dentro del mismo presupuesto; una revisión posterior a la revelación se etiqueta informed_review y no cuenta como contraste ciego. No se transmite cadena de pensamiento privada: se guardan afirmaciones, cálculos, referencias, objeciones y resúmenes auditables.

Se registra independencia de método: herramienta, reglas, familia/modelo y versiones. Primera implementación local puede usar el mismo modelo con roles aislados; se declara entonces process_independent_same_model, nunca validación externa. Una comprobación determinista no se presenta como agente autónomo ejecutado. El modelo local actual solo ordena hallazgos: habilitar agentes requiere un adaptador real con salidas tipadas, herramientas acotadas y validación; sin él el estado es unavailable.

La segunda línea no dispone de un bypass para 2D experimental o física no validada. Compartir un lector o modelo defectuoso es una limitación común que debe conservarse en la síntesis.

## Confrontación y propuesta final

El reconciliador compara por afirmación y objeto de cambio: acuerdo, desacuerdo, no comparable o evidencia insuficiente. No promedia votos ni inventa un porcentaje de confianza. El Crew Chief genera FinalProposal que enlaza el borrador principal, las salidas independientes y la matriz de discrepancias, preservando cada resultado original.

Cada ProposalItem declara tipo (measurement, controlled_test o setup_change), parámetro y unidades cuando corresponda, baseline/alternativa de revisión conocida, motivo, evidencias, condiciones, contraargumentos, límites y criterio de evaluación. Solo cambios con cálculo y dominio permitidos pueden llevar valores numéricos; el resto propone medición o prueba, sin afirmar un ajuste óptimo.

Gates de versión inicial: ambas líneas deben estar cerradas; ningún trabajo aplicable puede seguir pendiente; fallos/timeouts/indisponibilidad de contraste y desacuerdos materiales bloquean aprobar setup_change. Se puede conservar un informe incompleto y solicitar medidas o revisión. El desacuerdo material es contradicción sobre dirección/valor del mismo ajuste, evidencia inválida o restricción del dominio, no una puntuación arbitraria del LLM. Un desacuerdo solo se cierra mediante evidencia nueva y nueva ejecución, o revisión humana documentada que explica por qué no aplica; no se elimina. Esa revisión no convierte una fuente no validada en validada. Una propuesta exclusivamente de measurement/controlled_test puede revisarse con cobertura incompleta si no prescribe ajustes físicos no sustentados.

La fuente 2D experimental mantiene el gate actual: no recomendaciones mecánicas; primero contrastar el lector. La mera coincidencia de ramas no levanta este bloqueo. Ausencia de modelo local no se oculta con recomendaciones prefabricadas.

## Aprobación humana y permisos

Separar roles de acceso reader/engineer/admin de designaciones de responsabilidad. Por equipo hay un titular y como máximo un sustituto, usuarios humanos distintos con membresía activa engineer/admin. Un admin designa/revoca por operación auditada y transaccional, con revisión esperada; no adquiere aprobación por ser admin. Sin designación válida, aprobar queda bloqueado. El sustituto tiene autoridad equivalente sin aprobación adicional del titular; el evento identifica cuál actuó.

La designación inicial se prepara, pero no crea usuarios reales ni asigna propietarios históricos. Para operar autenticado se requiere activación cloud autorizada. En modo local sin identidad verificada se puede preparar y analizar; no se emite aprobación humana comercial ni se inventa un principal. En pruebas se usan identidades sintéticas aisladas, claramente etiquetadas.

ApprovalEvent inmutable: actor verificado, designación y revisión, team_id, proposal_id/revision/digest y snapshot_digest, acción approve/reject/request_revision, nota y hora del servidor. Una acción final cubre la propuesta completa; cambiar un ítem genera nueva propuesta. El agente no puede suministrar actor_id/approved_by ni invocar la capacidad de aprobación. El usuario humano puede aprobar una propuesta redactada con su ayuda: no se exige un segundo firmante.

El servidor vuelve a comprobar membresía, designación vigente, versión actual del expediente, gates y digest en la misma operación atómica que registra la decisión. Revocar al usuario/designación impide nuevas acciones; la aprobación histórica permanece con su autoridad al momento de firmar. Cambiar entradas/propuesta invalida su vigencia para el expediente actual, conserva el historial y exige otra aprobación. Una nueva ejecución solicitada también retira la propuesta actual de aprobación hasta producir la nueva versión. Doble envío idempotente y acciones concurrentes tienen un único resultado final; un conflicto devuelve 409 y obliga a recargar.

Estados de propuesta: draft, awaiting_review, approved, rejected, revision_requested, superseded. La vigencia depende además de la coincidencia con el snapshot actual. Approved significa decisión autorizada, nunca aplicación automática. Applied y validated son eventos humanos posteriores separados, con setup realmente montado, responsable, fecha y evidencia de la prueba; no controlan hardware ni garantizan mejora.

## Ejecución, persistencia y seguridad

18 mantiene expedientes, snapshots, resultados sellados, propuestas y auditoría con team_id y restricciones de unicidad. Reutilizar SQLite local para objetos con transacciones y migración aditiva respaldada. Todas las rutas nuevas entran en el inventario exacto de autorización y comprueban propiedad en servidor; consultar un UUID nunca concede acceso. Listados paginados, sin arrays crudos ni datos de otros equipos. No reutilizar rutas de decisión de 15 sin su propio análisis y adaptación.

01 coordina por una API/herramienta MCP de alcance de ejecución: evidencia agregada y objetos identificados, sin tokens del humano ni secretos para los agentes. La credencial interna y el grant de ejecución deben limitar team/snapshot/branch/operaciones y caducar; no se acepta un team_id de cabecera como autenticación. Si no existe transporte interno seguro, el adaptador queda disabled y el producto muestra la dependencia; construir ese transporte y pruebas es parte del plan, no simularlo. RAG/registry/MCP ausentes bloquean solo tareas que los requieren y no se sustituyen por respuestas inventadas.

Ejecuciones persistentes con lease de trabajador y transición atómica, cancellation token y clave de idempotencia por snapshot/configuración. Propuesta inicial de presupuesto configurable: una ejecución activa por expediente, máximo dos tareas de modelo simultáneas por instalación local, doce llamadas de modelo por ejecución, dos herramientas por revisor, 60 segundos por llamada y 10 minutos total. Una vez cerrado el resultado no se reintenta en silencio. Al reiniciar, tareas con lease vencido quedan failed/interrupted, nunca succeeded. Un reintento explícito crea intento enlazado; cancelación impide publicar resultados tardíos.

No introducir infraestructura de colas externa inicialmente: trabajador supervisado con estado persistido y reclamación transaccional. Límites son decisiones de ingeniería ajustables tras medir capacidad local, no promesas de rendimiento. No mantener una petición HTTP abierta durante todo el análisis; UI consulta estado paginado/acotado y puede cancelar.

Datos crudos, GPS, identidad de piloto y comentarios privados no salen de la frontera restringida. Modelos locales con herramientas y red limitadas, contenido de archivos/debrief tratado como datos no confiables. La línea de contraste tiene los mismos límites. Prompts registrados solo si están depurados y no contienen secretos; auditoría mínima de IDs, versiones, hashes y transiciones. Sin captura de biometría nueva ni afirmaciones clínicas en este alcance.

## Experiencia de producto propuesta

El expediente aporta un encabezado persistente circuito/moto/piloto/tipo y procedencia/calidad. Chassis conserva geometría, setups, calibración y comparación como área principal. Preparación de contexto antes de análisis, con guardado real y recuperación de borradores.

Un área de análisis muestra sección y estado real de cada especialista, luego contraste y una bandeja de propuestas. No se dibujan agentes trabajando por temporizadores. Se pueden inspeccionar evidencia, discrepancias y cobertura. El panel de decisión distingue claramente Crew Chief agente del humano titular/sustituto y explica por qué una acción está bloqueada. Navegar o cambiar de equipo conserva las protecciones de borradores y cancela/descarta respuestas de otro scope. Accesibilidad, móvil y estados vacíos/error siguen el sistema visual existente.

Esta es una descripción funcional, no aprobación de un nuevo diseño visual. La implementación adapta componentes actuales, sin nueva landing ni identidad de marca.

## Objetivos, no objetivos y criterios de rechazo

Objetivos: contexto persistente; dos líneas reproducibles y trazables; contradicciones visibles; permisos humanos comprobados; reutilización del motor real. No objetivos: optimizador universal, adquisición hardware nueva, todos los especialistas científicos del informe, certificación 2D, despliegue/cloud, biometría, migración de cuentas entre proyectos o control automático de la moto.

Es un fallo mostrar resultados simulados como reales, ocultar una rama fallida, elevar acuerdo a prueba causal, permitir aprobación por rol de interfaz o agente, perder versiones o exponer datos entre equipos.

## Aceptación y verificación requeridas

1. Crear contexto sin seeds y recuperar tras reinicio; warm_up distinto de practice y race compatible con recorded. Referencias ajenas/revocadas se rechazan.
2. Cambiar setup/contexto/calibración invalida vigencia; snapshot anterior e informe permanecen reproducibles. Dos actualizaciones concurrentes no pierden cambios silenciosamente.
3. Especialistas sin entradas o integración no emiten resultados inventados. Cálculos se cotejan con salidas existentes de 17/18; 2D experimental conserva bloqueos.
4. Prueba adversaria: revisor no puede leer propuesta, salida principal ni otra rama antes del cierre aun con IDs conocidos; salida sellada no se modifica. Revisión posterior se etiqueta informed_review.
5. Timeout, modelo ausente, herramienta caída, reinicio y cancelación muestran estado honesto, no generan aprobación ni publican respuesta tardía. Repetición idempotente no duplica decisión/trabajo.
6. Engineer/admin no designado, titular de otro equipo, usuario revocado y agente no pueden aprobar; titular y sustituto vigentes sí. Conflictos de revisión y doble aprobación se resuelven atómicamente.
7. Gate por desacuerdo, cobertura y dominio se comprueba en servidor, no solo en botones; nueva evidencia exige nueva versión. Applied/validated no se crean al aprobar.
8. E2E con identidades sintéticas y datos de prueba: contexto → grabación válida → A/B → ambas ramas reales → discrepancias → decisión humana → nueva revisión obsoleta la aprobación. Caso separado sin modelo, sin contraste y con 2D experimental.
9. UI accesible/móvil y cambios de equipo sin filtraciones; informes guardados incluyen referencias/versiones y límites. Tests de empaquetado, esquema y autorización cubren rutas nuevas. No afirmar listo para vender hasta cerrar los gates externos previos.

## Decisiones delegadas a implementación

Nombres precisos de archivos y rutas, librería de hash canónico, almacenamiento de leases y composición visual conforme al repo, distribución de fixtures y estrategia de mocks en pruebas unitarias. Ninguna puede relajar independencia, aislamiento, límites físicos o autoridad humana. Preparar migraciones y documentación operativa sin aplicarlas a cloud, sin commits/push/despliegue en esta fase.
