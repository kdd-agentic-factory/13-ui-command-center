# Integración del informe de telemetría en el producto

Fuente recibida el 2026-10-25: `Sistema IA De Telemetría Motociclista.docx`, SHA-256 `794ebb2d3eb834556f3ed6b7d0794f44b4b522c2c6103d4864879fe49b36270f`. Lectura del cuerpo, tablas e imagen de arquitectura. Extracción interna en `../inputs/2026-10-25-telemetry-report-extracted.txt`; sus números de párrafo son las referencias del catálogo.

## Decisión de producto

Por instrucción del usuario, el documento pasa a ser alcance mínimo de la plataforma, integrado en el plan de producto ya aprobado, sin desplazar a Chassis Tool. No es prueba de que las funciones, precisiones o resultados descritos existan en nuestro software. Su calendario de doce meses no es una estimación de este proyecto.

La diferenciación se concreta en una cadena verificable: sesión → moto/setup → señal y calibración → modelo y versión → resultado → evidencia → conflicto o dato faltante → siguiente prueba → decisión humana. Cada dominio contextualiza esa misma comparación; no se añaden paneles aislados con valores ficticios.

## Trazabilidad incorporada

- 39 requisitos con estado, dependencias, aceptación y párrafos de origen en `src/domain/telemetryReportRequirements.ts`.
- Tres dominios (circuito, piloto y motocicleta) y una capa transversal de coordinación/evidencia.
- Seis contratos de especialistas, con despliegue pendiente explícito. La IA actual de Chassis no se renombra como un sistema de seis agentes.
- 68 módulos de navegación y 27 repositorios conservados en `docs/product-completion-matrix.md`.
- Cobertura consultable en Chassis, con filtros de dominio y estado. Disponibilidad de contexto derivada solo de canales canónicos realmente registrados, con muestras; no de nombres parecidos ni valores inventados.
- Fuente experimental 2D conserva su bloqueo aunque existan canales. Los especialistas de pista, clima y piloto sin integración declarada se muestran sin datos; no se deducen señales humanas de la IMU de la moto.

## Correcciones antes de convertir texto en algoritmos

1. **Precisiones atribuidas a otro producto.** Las diferencias de 0,1 mm o 1 % descritas en el informe proceden de comparaciones entre ecuaciones/tablas y el cálculo del proveedor. No certifican nuestro modelo ni la exactitud física de adquisición. MotoSPEC también declara exclusiones de inclinación, perfil y rigidez del neumático en esos canales. Fuente primaria: [Data AQ](https://www.motospec.ca/data-aq.html), consultada el 2026-10-25.
2. **Interoperabilidad por formato.** La documentación del proveedor distingue ecuaciones, tablas y configuración de cada destino; contempla `.CAL` para ecuaciones 2D y `.csv` para tablas. No equiparar CSV, HED y lectura MES ni anunciar compatibilidad por una extensión. Fuente: la misma página Data AQ. Nuestra implementación de exportaciones sigue pendiente de pruebas en cada destino.
3. **Wheel flop.** Con las propias fórmulas del informe, `Fw = Tg sin(theta) cos(theta)` y `Tg = (R cos(theta)-O)/sin(theta)` implican `Fw = R cos²(theta)-O cos(theta)`. Por tanto, el factor trigonométrico aislado no prueba un máximo global a 45° cuando Tg varía con theta. Se necesita definición, convención y contraste; no se añade ese resultado al motor existente.
4. **Anti-squat.** El solver requiere posiciones y tangencias de cadena, radios y reparto/posición longitudinal de masas, además de altura de CoG. La expresión del informe no se incorpora como fórmula universal. [Data For Motorcycles](https://www.datamc.org/data-acquisition/suspension-data-analysis/anti-squat-geometry/) describe las fuerzas motriz, de cadena y de transferencia; la validación del solver queda pendiente.
5. **GNSS/IMU.** Interpolar o aumentar muestras no acredita RTK ni exactitud centimétrica. Exigir sincronización, marcos, extrínsecos, errores y contraste independiente.
6. **FIM y permisos de wearables.** Las cifras y afirmaciones reglamentarias deben enlazarse a edición, artículo, disciplina y ámbito vigente antes de crear validadores. No se ha verificado homologación ni autorización de un casco instrumentado.
7. **Biometría.** EEG, EMG, carga vibratoria y lenguaje no habilitan diagnósticos de ansiedad, flujo o arm pump. Investigación, consentimiento y permisos específicos deben preceder captura/modelado. No se activan sensores, modelos clínicos ni recopilación de salud en esta integración.
8. **Causalidad y optimización.** Los ejemplos de presión, offset, mapas ECU o resonadores son escenarios ilustrativos del informe, no recomendaciones ejecutables para una moto real. Optimización bayesiana/RL/Monte Carlo necesita datos comparables, restricciones y validación fuera de muestra.

## Integración con las entregas aprobadas

La entrega 1 incorpora esta matriz como mínimo y separa alcance de estado real. Sesiones (2), estado de servicios (3), espacio Chassis (4) e informe (5) deben conservar contexto, calidad y supuestos. La web comercial (6) presenta los tres dominios como cobertura de producto en desarrollo, sin afirmar capacidades no comprobadas. La verificación (7) exige pruebas por requisito y no convierte el catálogo en evidencia funcional.

Los nuevos subsistemas físicos, de visión, biometría e inferencia necesitan implementación y validación propias; permanecen en el mínimo pendiente y no desaparecen al cerrar el núcleo. Su presencia en esta matriz no significa que estén implementados. Las seis salidas deberán ser resúmenes auditables de resultados, fórmulas, evidencia y límites; no cadenas internas privadas de razonamiento de modelos.

## Orden técnico resultante

1. Completar el producto operativo aprobado: recuperar sesiones, revisiones, informe, permisos y estados reales.
2. Ampliar Chassis y puente bidireccional con geometría dinámica, anti-squat, HED y formatos probados; contrastar físicamente cada modelo.
3. Añadir contexto medido de circuito, clima, neumáticos, motor y debrief.
4. Validar visión y fusión espacial; incorporar biometría únicamente bajo protocolo y permisos específicos.
5. Activar especialistas por disponibilidad real y resolver conflictos mediante pruebas; entrenar optimización solo cuando exista evidencia suficiente.

No se sustituye este orden por fechas inventadas ni por capacidades de demostración.
