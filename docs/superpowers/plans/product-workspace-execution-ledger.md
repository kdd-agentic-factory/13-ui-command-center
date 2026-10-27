# SDD ledger — plan: 2026-10-19-chassis-product-workspace.md

Plan y especificación aprobados; ejecución en esta sesión. No hay commits ni despliegues autorizados por este plan.

2026-10-25: nueva instrucción de integrar informe DOCX como mínimo. Ruling: ampliar la entrega 1 y la trazabilidad de las siguientes — el catálogo y estados explícitos forman parte del plan aprobado; no presentar nuevos algoritmos de física/biometría como implementados. Coste si faltara cobertura: mantener requisitos pendientes con aceptación, no descartarlos.

Ruling: conservar checkouts de las ramas feature existentes y trabajo previo sin commit; no crear worktrees que omitan ese trabajo ni volver a solicitar aprobaciones ya dadas. Repositorios 13/18 en codex/chassis-physics-20261019. Las modificaciones de 15 necesitarán su rama de trabajo antes de editar código, preservando sus cambios previos.

Pre-flight: 1→4/6 produce catálogo de capacidades y estados; 2→4 produce lista autorizada; 3→4 produce estado real; 4→5 consume comparación guardada; 5→6/7 exporta solo documentos autorizados. El informe añade dependencias externas y no altera estos contratos. 2D no se promociona a validado.

Task 1: complete — PRODUCT actualizado; 39 requisitos del informe, 6 contratos de especialistas, 68 módulos y 27 repositorios inventariados con estados pendientes explícitos. Pruebas de trazabilidad y vista de cobertura: RED por módulos ausentes → GREEN, 6 tests. La matriz no acredita el funcionamiento de los 68 módulos.

Report integration: texto/tablas y figura revisados; fuente y hash registrados. Contraste primario de MotoSPEC/2D y revisión algebraica identifican límites y afirmaciones que no deben copiarse como resultados. Nueva vista de cobertura añadida a Chassis, sin sensores ni diagnósticos ficticios.

Task 2: complete — listado paginado de metadatos, propietario filtrado en SQL, cursor validado y biblioteca en la entrada de datos. Pruebas de fechas iguales, archivos corruptos, cuarentena y recuperación del índice. Corrupción SQLite y conexión abierta en Windows se detectaron y corrigieron con prueba de reconstrucción.

Task 3: complete — estado JSON real de backend, modo, lector y modelo; estado LLM ausente no bloquea evidencia determinista. Ruta GET exacta autorizada para reader. Consultas al runtime solo loopback y sin señales.

Task 4: complete within approved core — navegación real Chassis/datos/setups/informe/ajustes, metadatos compactos, borradores de A/B/calibración y geometría protegidos, cierre/perfil y cambio forzado de identidad separados. Campos y revisiones conservan contratos físicos existentes. La sección de cobertura incorpora los dominios del nuevo informe sin simularlos.

Task 5: complete — informe versionado JSON e impresión desde comparación persistida, autorización de objeto/sesión, revisiones inmutables, valores y procedencia. Descarga local sin señales crudas; beforeprint expande evidencia y afterprint restaura el estado. Esquema empaquetado y registrado 1.0.0, registro global 2.1.0.

Task 6: complete — Chassis protagonista en home, tabla de compatibilidad y alcance multimodal pendiente explícito. Entradas de 15 consolidadas por helper sin fusionar sus proveedores de identidad. 15 en rama codex/chassis-product-20261025; build correcto con advertencia de bundle histórico.

Ruling: biblioteca integrada en la entrada de datos existente en lugar de añadir otro TabId — conserva contratos de navegación y ofrece importar/recuperar en el mismo flujo; workspace=recorded-sessions lleva a esa entrada mediante allowlist. Coste: un paso para desplegar la biblioteca, sin una página independiente nueva.

Ruling: el índice de sesiones se construye/reconcilia al listar y no participa en la transacción de importación — un fallo de caché nunca invalida la fuente persistida y puede reconstruirse sin modificarla. Coste: primera consulta más lenta por backfill; imported_at identifica incorporación al catálogo (mtime para legacy), no adquisición.

Final review: product_report_final_review, revisión independiente de fuente con gpt-6-astra. Sin crítico confirmado; cinco importantes corregidos. Rutas/permisos y estados explícitos inspeccionados; esto no certifica despliegue cloud, física, biometría ni compatibilidad de fabricante.
Final: fixed campos de cursor mal tipados/desbordados — test_malformed_cursor_fields_return_422 RED→GREEN.
Final: fixed metadatos de validación corruptos bloqueaban catálogo — test_corrupt_validation_status_does_not_break_catalog RED→GREEN.
Final: fixed Switch Profile omitía guard de borrador — protects the draft before voluntary Switch Profile RED→GREEN. El primer intento del test tenía una importación de fireEvent ausente; se corrigió y se verificó de nuevo el fallo real con el callback antiguo antes del cambio final.
Final: fixed editor geométrico antiguo no declaraba cambios — protects unsaved dimensions when closing the recording RED→GREEN.
Final: fixed impresión no abría detalles de evidencia — beforeprint/afterprint en test de informe persistido RED→GREEN; estado original restaurado.
Final: minor resolved — ledger actualizado con entregas y evidencias; no quedan menores de esta revisión aplazados.

Task 7: complete within local scope — 350 tests frontend/80 archivos PASS, tipos/build PASS; 62 backend afectados + 35 de lectores/progresiva/IA PASS. Flujo nuevo de producto y flujo existente de grabación pasan en navegador. Una ejecución conjunta alcanzó el limitador compartido de 60/min; se repitió el flujo existente por separado tras recargar código de backend, sin modificar límites. Detector de los cuatro componentes nuevos consultados: sin hallazgos. Inspección escritorio 1440 y móvil 390 sin overflow horizontal de página; capturas guardadas, no es certificación WCAG completa.

Empaquetado: primer intento --no-build-isolation falló porque setuptools no estaba instalado en la venv. Construcción con aislamiento PEP517 y requisitos de build ya declarados pasó, sin añadir dependencias de producto. Wheel incluye esquema de informe y catálogo; instalación --no-deps fuera del checkout + smoke con -I comprobó comparación, persistencia, informe validado con recurso empaquetado, listado e importación CSV. Ruff focalizado PASS. diff --check en 13/18/15 PASS tras normalizar CRLF del HTML generado por el build de 15.

Servicios finales: Vite5173 y backend8180 loopback; Ollama11434 local con qwen3:4b verificado por lanzador existente. No servicios QA adicionales, cuentas reales ni despliegue. La captura de integración es `chassis-report-integrated.jpg` bajo la carpeta de visualizaciones de esta conversación.

Ruling: conservar ramas, cambios sin commit y carpeta de evidencias de ejecución — el plan prohíbe publicar/commitear sin instrucción y la evidencia no debe desaparecer antes de integrar; coste: artefactos de QA locales pendientes de limpieza posterior. Se conserva la preferencia de mantener el trabajo aquí, sin pedir otra autorización de ejecución.

Final: Ruling: las áreas apartadas por el revisor (cloud, despliegue, precisión física, contraste fabricante y biometría) permanecen como puertas externas — no atribuirles resultados de QA local. Coste: no declarar listo para venta el alcance completo del informe hasta aportar esa evidencia.
