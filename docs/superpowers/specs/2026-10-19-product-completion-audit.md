# Revisión inicial del producto completo — 2026-10-19

Estado: inventario y diagnóstico inicial; no equivale a certificación comercial ni a auditoría exhaustiva de seguridad. No se ha cambiado la interfaz en esta ampliación.

## Objetivo confirmado

Producto vendible de ingeniería de motocicletas con Chassis Tool propio como centro. Integrar telemetría real AiM/2D, geometrías y setups, suspensión progresiva y recomendaciones respaldadas por evidencia. Revisar todos los repositorios y modernizar la experiencia completa. Conservar una superficie comercial y otra operativa.

Usuario principal propuesto, pendiente de confirmación: ingeniero de pista y equipo de competición. No se inventarán precios, clientes, resultados físicos ni compatibilidades certificadas.

## Inventario de los 27 repositorios

| Repositorio | Responsabilidad declarada / revisión necesaria |
|---|---|
| 00-kdd-governance | Gobierno, contratos y trazabilidad; comprobar que el producto cumple sus contratos |
| 01-agent-orchestrator | Orquestación; verificar invocaciones reales y permisos antes de exponerla |
| 02-mcp-gateway | Acceso a herramientas; revisar identidad y alcance de cada herramienta |
| 03-rag-cag-knowledge-layer | Conocimiento; verificar fuentes, aislamiento y citas |
| 04-skills-autoskills-registry | Registro de skills; distinguir catálogo de ejecución operativa |
| 05-documentation-agent | Informes; comprobar generación con evidencia y pertenencia al equipo |
| 06-kdd-data-pipelines | Transformación y linaje; comprobar uso efectivo por las sesiones |
| 07-agentic-workflows | Flujos declarativos; verificar ejecutor, errores y persistencia |
| 08-experimentation-lab | Evaluación; separar evidencias reproducibles de ejemplos |
| 09-observability-platform | Métricas, logs y alertas; verificar servicios realmente conectados |
| 10-infra-docker | Arranque local y contenedores; conservar cambios previos |
| 11-infra-kubernetes | Despliegue; no desplegar durante la revisión |
| 12-ci-cd-security | Calidad y releases; revisar qué verificaciones se ejecutan realmente |
| 13-ui-command-center | Interfaz principal; contiene web pública y espacio real de Chassis |
| 14-paper-reproducibility-kit | Investigación y reproducibilidad; separar de navegación comercial |
| 15-race-command-center | Segunda interfaz operativa; solapa funciones y contiene demostraciones |
| 16-race-ai-copilot | Copiloto general; no confundir con el explicador local acotado de Chassis |
| 17-digital-twin-simulation-lab | Motor físico de Chassis y simulaciones históricas; separar su validación |
| 18-telemerty-dataset | Repositorio con nombre erróneo; README mínimo, no asumir fuente de datos |
| 18-telemetry-dataset | Backend de datos reales, importación, Chassis e identidad |
| 19-agent-runtime-hermes | Runtime de agentes; verificar dependencia y operación real |
| 20-agentic-control-plane-paperclip | Coordinación; verificar necesidad y aislamiento |
| 21-agentic-backend-insforge | Backend cloud; migración de equipos preparada, no aplicada |
| 22-log-telemetry-fluent-bit | Recolección de logs; revisar datos sensibles y destino |
| 23-object-storage-minio | Almacenamiento; comprobar políticas, persistencia y recuperación |
| 24-security-governance-compliance | Políticas y aprobaciones; comprobar aplicación efectiva |
| 25-monorepo | Organización agregada; no dar por sincronizadas las copias con repos individuales |

Inventariados README, manifiestos principales, rama y número de cambios de cada repositorio. Esto no significa haber probado cada servicio. Hay trabajo previo sin commit en 10, 13, 15, 17, 18 y 21; debe preservarse.

## Hallazgos comprobados

1. **P1 — Dos aplicaciones operativas solapadas.** `13/src/app/App.tsx` incluye rutas públicas y operativas; `15/frontend/src/routes.tsx` mantiene otra aplicación de módulos. No son simplemente una landing y una aplicación. El Chassis secundario ya remite al principal.
2. **P1 — Cobertura funcional incompleta.** `13/src/app/DashboardShell.tsx:280` limita sesiones reales a Chassis, datos y ajustes; las demás vistas muestran explícitamente que faltan conexiones. Es una protección correcta, pero confirma que el producto completo no está implementado.
3. **P1 — Simulación histórica pendiente de sustituir.** `13/src/hooks/useLiveTelemetry.ts` genera fotogramas sintéticos; `OverviewPage.tsx:96` calcula diferencias aleatorias; `DigitalTwinReportPage.tsx:464` espera y modifica tiempos aleatoriamente. Actualmente esas pantallas quedan restringidas por el punto anterior para sesiones reales. No deben habilitarse al retirar esa protección sin implementar sus contratos.
4. **P1 — Demostraciones extensas en la segunda interfaz.** 23 archivos de páginas en `15/frontend/src/pages` importan directamente `rcc-module-demo-data`. Es un indicador verificable de dependencia de demostraciones, no una cuenta exhaustiva de funcionalidades falsas.
5. **P1 — Puertas comerciales externas abiertas.** Falta referencia independiente del fabricante para 2D, activación cloud de identidad/equipos y validación con medidas físicas de suspensión. Los resultados previos de pruebas locales no sustituyen estas comprobaciones.
6. **P2 — Rendimiento secundario.** `npm run build` de `15/frontend` pasa TypeScript y Vite: JavaScript principal 922,85 kB, gzip 259,51 kB. Vite avisa de bloque superior a 500 kB. Revisar separación por rutas y carga de gráficos.
7. **P2 — Contexto de producto ausente.** Impeccable no encuentra `PRODUCT.md`. Existe `design.md`, con reglas de centro de mando. Los tokens actuales y la documentación usan vocabularios distintos. Hace falta una autoridad de diseño compartida sin romper componentes existentes.
8. **P2 — Diseño aún sin aceptación visual medida.** Chassis dispone de puntos de corte 1200/760/640 y foco visible. Queda comprobar en navegador teclado, contraste, densidad, desbordamiento y tareas completas; no se asigna puntuación WCAG sin medición.
9. **P1 — Relato comercial desalineado con el núcleo.** La navegación y el contenido públicos observados en navegador presentan PitWall, Nodes, Federation, Copilot y Research; Chassis no aparece como producto protagonista. La explicación comercial debe distinguir capacidades presentes y futuras.
10. **P2 — Salud global poco representativa.** La barra lateral observada muestra `Platform · 0/6 services online`, mientras el backend real de Chassis responde. Ese grupo mide otros servicios y no debe interpretarse como salud de Chassis. La interfaz conserva 65 módulos secundarios, lo que necesita una decisión explícita de arquitectura y catálogo.

## Comprobaciones nuevas de esta revisión

- HTTP 200 en las interfaces locales 5173 y 5174.
- Backend 8180: `/api/v1/identity/mode` responde `local`.
- Ollama 11434: `/api/version` responde `0.40.6`; esta petición comprueba disponibilidad, no una inferencia nueva.
- `/health` devuelve 404: la salud del backend está bajo el prefijo API; no concluir caída del servicio por consultar una ruta incorrecta.
- Build secundario completado. No se han repetido todavía las suites de todos los repositorios.
- Las verificaciones de la entrega anterior constan en `../plans/commercial-identity-execution-ledger.md`; no se presentan como ejecutadas nuevamente.
- Inspección visual y de accesibilidad del navegador en la sesión real 2D existente, sin modificar sus medidas ni la selección de canales; revisión del contenido público en una pestaña temporal. La vista examinada de Chassis no presenta desbordamiento horizontal a 899 px. Esto no constituye validación móvil ni de todos los puntos de corte.

## Dirección propuesta para revisar con el usuario

Recomendada: una aplicación operativa canónica en 13 y una superficie comercial claramente separada por navegación y contenido. Conservar repositorios hasta documentar cualquier cambio de límites. Aprovechar capacidades reales de 15 mediante contratos, evitando mantener dos implementaciones divergentes del mismo flujo.

Alternativa A: mantener ambas aplicaciones operativas. Menor cambio inicial, pero duplica navegación, permisos, mantenimiento y pruebas.

Alternativa B: reescribir todo. Mayor coste y riesgo de perder importación, física e identidad ya verificadas; no recomendada.

Arquitectura de navegación propuesta: Chassis, sesiones/telemetría, setups, evidencia/informes y equipo. El estado de fuente, unidades, calibración, procedencia y limitaciones debe acompañar los resultados. Los módulos adicionales requieren integración real y criterios de aceptación individuales; no basta con ocultarlos para declarar el producto terminado.

Dirección visual propuesta: herramienta de ingeniería precisa, legible y contemporánea; dibujo A/B y señales como contenido principal, controles agrupados por tarea, tablas comparables, color semántico y estados vacíos accionables. Mantener identidad KDD y evitar paneles decorativos o cifras de muestra en el flujo real. La web comercial debe explicar ese mismo flujo con evidencia verificable.

## Trabajo siguiente

Confirmar usuario principal; completar matriz módulo → pantalla → API → persistencia → permisos → prueba → estado. Ejecutar revisión visual de ambas superficies y auditoría de seguridad con sus skills específicas. Preparar especificación escrita del rediseño y cierre funcional, y después plan verificable por entregas. La aprobación de planes anteriores no cubre esta reestructuración global.
