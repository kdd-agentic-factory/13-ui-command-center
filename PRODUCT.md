# Producto

<!-- impeccable:product-schema 1 -->

## Platform

web

## Propósito

KDD debe convertirse en un producto vendible de ingeniería de motocicletas. Su módulo propio Chassis Tool es el centro: conecta geometría, suspensión, setups y telemetría real para fundamentar qué comprobar en pista. El usuario ha aprobado el 19 de octubre de 2026 la dirección de rediseño descrita en `docs/superpowers/specs/2026-10-19-product-completion-audit.md`.

## Usuarios

### Decisión confirmada — 26 de octubre de 2026

Un único producto con vistas por perfil, confirmado por el usuario. Debe resultar vendible a varios perfiles sin fragmentar datos ni flujo. Piloto, mecánico, ingeniero y Crew Chief comparten sesión y evidencia; los perfiles históricos de analista, dirección de equipo, observador y nodo técnico deberán reconciliarse. La vista elegida no otorga permisos. La prioridad de segmento, precios y validación con clientes siguen sin decidirse; no se atribuyen ventas ni disposición de pago a usuarios no entrevistados.

Implementación local: seis vistas de trabajo dentro de Chassis y siguiente paso verificable, con contexto/B/evidencia compartidos. La vista no equivale a un servicio nuevo o sensor implantado. Aceptación y límites en `docs/chassis-role-workspaces-acceptance-2026-10-26.md`.

Ingenieros, analistas y equipos de competición que trabajan con telemetría y ajustes de motocicletas. El ingeniero de pista es el perfil de referencia propuesto para ordenar las tareas; no hay una decisión confirmada sobre segmentos comerciales, precios o exclusividad de este perfil.

## Flujo de trabajo

Importar una medición → identificar sesión y moto → revisar canales, unidades y calidad → registrar geometría y setup A → definir alternativa B → calibrar y seleccionar evidencia → comparar → revisar limitaciones y siguiente prueba → conservar y compartir un informe dentro del equipo.

### Flujo operativo confirmado por el usuario — 2026-10-25

La aplicación debe comenzar seleccionando circuito, moto, piloto y tipo de sesión (tanda, warm-up, entrenamiento, carrera u otros que se definan). Ese contexto conduce al trabajo con Chassis Tool y las especificaciones del producto.

Los agentes se especializan por apartado y se organizan jerárquicamente mediante líderes de sección. Un agente Crew Chief reúne los análisis del conjunto y propone qué modificar y por qué. Siempre existe human in the loop: la decisión final pertenece al humano, no a los agentes ni a sus líderes. Esta es una exigencia del producto, no una capacidad jerárquica ya desplegada.

La aprobación humana debe referirse a una propuesta concreta y su evidencia. El usuario confirma que únicamente el Crew Chief humano titular del equipo o su sustituto expresamente designado pueden aprobar. El agente Crew Chief actúa como asistente del titular y reúne el trabajo de los grupos; no obtiene autoridad de aprobación humana. La asignación y verificación de estos permisos deberá hacerse en servidor y quedar auditada. No confundir los roles de responsabilidad de los agentes con los permisos de acceso de los usuarios.

El usuario elige además una segunda línea de agentes autónomos de contraste, separada de la jerarquía principal. Ambas parten de la misma versión de datos; el contraste formula y sella sus conclusiones antes de conocer la propuesta principal. Las discrepancias deben llegar visibles al Crew Chief humano. Esta ampliación está en implementación local, no desplegada; catálogos/expedientes y snapshots del backend ya están revisados, pero ambas líneas de agentes y su decisión humana aún no forman un flujo operativo completo.

## Posicionamiento

La diferenciación buscada es unir el Chassis Tool propio con las señales originales y evidencia trazable. Compatibilidad con fabricantes significa leer y validar sus datos; no implica reemplazar su adquisición ni ofrecer conexión en directo sin una integración comprobada.

### Nodos federados — requisito confirmado el 26 de octubre de 2026

La aplicación deberá conectarse a nodos federados para mejorar los informes. El usuario pide mantener esta necesidad presente mientras se prioriza la corrección de los fallos actuales. Esta conexión no está implementada ni activada por registrar el requisito. Su futura integración deberá respetar el aislamiento por equipo, la trazabilidad y el gobierno de datos vigentes; no autoriza por sí sola a transmitir telemetría restringida.

## Capacidades verificadas y límites

- Aplicación principal React/Vite en este repositorio; backend de sesiones e identidad en 18; motor físico de Chassis en 17; migraciones cloud en 21.
- Importación AiM mediante su SDK Windows y archivos tabulares admitidos; preservar metadatos y unidades.
- Lector nativo 2D para variantes observadas MES/DDD: experimental hasta contrastarlo con una exportación independiente de Analyzer de la misma medición.
- Geometría plana A/B, transferencia longitudinal cuasiestática y suspensión mediante curva rueda/amortiguador. No equivalen a un modelo completo de dinámica de motocicleta.
- Evidencia determinista y explicación local opcional con Ollama. El LLM actual ordena hallazgos permitidos; no calcula física ni inventa ajustes.
- Autorización por equipo implementada y probada localmente; migración cloud y primera alta autorizada pendientes de activación y comprobación real.
- La experiencia comercial y la aplicación son superficies distintas del mismo producto. Existe otra interfaz en 15 que debe reconciliarse sin perder funciones útiles.
- Muchas pantallas históricas dependen de demostraciones. Ocultarlas no significa completar su funcionalidad.

## Evidencia disponible

Datos reales AiM y paquetes 2D bajo gobierno del repositorio 18. Datos crudos restringidos: no publicarlos como activos comerciales ni transmitirlos a servicios externos durante el rediseño. Pruebas y resultados anteriores documentados en `docs/chassis-operation.md` y los ledgers de `docs/superpowers/plans`.

Faltan referencia independiente 2D, medidas físicas contrastadas de una moto y validación comercial con usuarios reales. No hay precios, testimonios, ganancias de vuelta o clientes verificados autorizados para publicar.

## Identidad y principios

Conservar el nombre y los activos existentes KDD / Keedio, con Chassis Tool protagonista. Priorizar tareas de ingeniería, resultados reproducibles y límites visibles. Distinguir medición, estimación y simulación. No confundir un perfil de interfaz con un permiso autenticado. Un producto terminado exige recuperación de errores, persistencia y operación repetible además de pantallas atractivas.

## Decisiones abiertas

Segmento inicial y modelo comercial; despliegue y soporte; primeras cuentas y equipo administrador; referencia del fabricante 2D; mediciones físicas. Estas decisiones no se suplirán con contenido inventado.

## Alcance mínimo ampliado — informe recibido el 2026-10-25

El usuario incorpora el informe «Sistema IA de Telemetría Motociclista» como mínimo del producto. Circuito, piloto y motocicleta deben converger alrededor de Chassis Tool mediante evidencia por sesión, no convertirse en silos de pantallas. Se añaden seis contratos de especialistas (pista/visión, clima, carga física, cognición/mirada, chasis y neumáticos/propulsión) y coordinación de conflictos, con estado de implementación explícito.

La cobertura, dependencias y criterios de aceptación se mantienen en `src/domain/telemetryReportRequirements.ts` y `docs/product-completion-matrix.md`. La integración y los puntos que requieren contraste están en `docs/superpowers/specs/2026-10-25-telemetry-report-integration.md`. El documento no acredita precisión de nuestro motor, diagnósticos del piloto, cumplimiento FIM ni ganancias de tiempo. Visión, biometría, optimización y exportaciones nativas siguen pendientes de desarrollo y validación.
# Ampliación aditiva: Banco y señales

Chassis incorpora inspección de suspensión registrada, ensayos CSV con fuerza medida y análisis Welch/STFT con límites de reloj y banda explícitos. Los resultados y anexos son privados y reproducibles; no acreditan diagnóstico mecánico, precisión del fabricante ni ganancias de vuelta. Las métricas nuevas tienen referencias verificadas en los contratos de especialistas. La aceptación integral con IA/Chief sobre datos contrastados, la referencia externa de banco y el contraste 2D permanecen pendientes. Estado detallado en `docs/chassis-suspension-spectral-acceptance-2026-10-26.md`.

## Evidencias de dominio — ampliación local 26 octubre 2026

Chassis añade paquetes privados de pista, clima y neumáticos/propulsión con unidades explícitas, importación CSV y canales de grabaciones propias. Las seis vistas comparten referencias inmutables para el siguiente snapshot. La revisión documental habilita observaciones, sin certificar precisión ni autorizar ajustes físicos. Físico/neuro conservan requisitos de adquisición e inferencia deshabilitada. Aceptación y límites: `docs/chassis-domain-evidence-acceptance-2026-10-26.md`.
