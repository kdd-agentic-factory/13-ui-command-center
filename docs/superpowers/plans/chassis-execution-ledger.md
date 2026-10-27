# SDD ledger — plan: 2026-10-19-chassis-physics-workspace.md

Spec y plan aprobados; ejecución nativa solicitada por el usuario.

Ruling: conservar checkouts actuales y crear ramas codex/chassis-physics-20261019 en 13/17/18, en lugar de copiar los cambios pendientes a worktrees — el flujo local depende de esos cambios y servicios activos — coste: aislamiento por rama, sin segundo checkout físico.

Ruling: no realizar commits automáticos sobre el trabajo previo; dejar diffs verificables — hay cambios de sesiones anteriores sin commits — coste: la recuperación depende del workspace y este registro hasta que se revisen y guarden los commits.

Pre-flight: tareas 1→2 comparten SetupRevision/PhysicsResult; 2→3 comparten comparación y binding; 2→4 usan sesiones inmutables; 4→5 usan EvidenceItem; 6 verifica todas. Nombres y unidades coherentes.

Estado inicial: nueve fallos corregidos, suite 319/319; restauración desconocida revisada y 5/5 pruebas focales adicionales. Modelo ampliado pendiente.

Task 1: complete — 10/10 pruebas físicas, después de observar fallos por módulo ausente y desbordamiento. Cálculo puro empaquetado y probado en Docker Linux `chassis-core`, fuera del checkout.

Task 2: complete — revisiones SQLite transaccionales, idempotencia, binding explícito, comparaciones versionadas y esquema. Pruebas API incluidas en las 24/24 del backend; se conserva el original byte a byte. Restauración filtrada por moto tras reproducir el fallo.

Task 3: complete — espacio A/B, esquema con cotas, evidencia y estados; 7/7 pruebas focales de UI/navegación. Suite frontend 323/323, tipos y build pasan. Prueba de navegador de importación, A/B, calibración, recarga, móvil y fallo API pasa; ampliando comprobación de restauración de los controles de calibración.

Task 4: complete within first-release domain — calibración explícita, alineación sin extrapolación, derivada filtrada en reloj original, cargas cuasiestáticas y muelle con relación constante medida. Pruebas RED→GREEN de huecos, unidades, cargas y curva progresiva bloqueada. El AiM real expone InlineAcc y se comprobó una comparación con geometría QA explícitamente asumida.

Task 5: complete for local evidence explanation — referencias estructuradas y siguiente ensayo, sin prescripciones de clics o tiempo de vuelta. Proveedor externo desactivado; pruebas de salida insuficiente y referencias inválidas pasan sin exportar datos.

Ruling: muelle en replay limitado a relación constante medida — un único q y dq/dz no identifica la curva completa de una bieleta — coste: replay progresivo pendiente de curva medida, aunque el cálculo puntual general existe.

Ruling: mantener IA externa desactivada y rechazar router de chasis en producción — los encabezados de actor son auditoría, no identidad de tenant — coste: uso local operativo, pendiente integración autenticada antes de comercializar como SaaS.

Task 6: in progress — documentación de operación y matriz de capacidad escritas, prueba del stage Linux pasa. Runtime Docker completo histórico con PyTorch no construido; exportación real de 2D y validación experimental siguen pendientes explícitos.

Final review: revisión independiente por /root/review_chassis_final. Cuatro importantes confirmados; corregidos en un pase, cada uno con prueba RED→GREEN: unidad incompatible al restaurar, recuperación de revisiones tras fallo, esquema incluido en wheel y conservación de geometría ante canal incompatible. El smoke wheel descubrió además conexiones SQLite sin cierre; prueba RED→GREEN añadida y cierre transaccional verificado.

Final verification: frontend completo 325/325 en 71 archivos; backend focal 27/27; motor 10/10; recorrido Playwright completo 1/1; typecheck y build pasan. Ruff del código nuevo pasa. Wheel instalado fuera del checkout: comparación, esquema empaquetado y persistencia PASS. Docker Linux chassis-core PASS. Sin menores señalados por el revisor.

Task 6: complete for local release — ambas webs y health del lector responden 200, rutas nuevas presentes, flujo real probado. Lo pendiente de la matriz (2D real/nativo, validación experimental, runtime completo y SaaS) no se declara operativo.

Ruling: añadir el contexto de compilación del motor también en 10-infra-docker/docker-compose.jarvis.yml — el Dockerfile del lector requiere el paquete hermano y la integración existente debía conservarse — coste: el build requiere ambos repositorios. Compose validado con `config --quiet`, usando placeholders efímeros solo para analizar configuración, sin arrancar ni publicar servicios.

Entrega conservada en ramas locales codex/chassis-physics-20261019 de 10/13/17/18, sin commits ni push. Se conserva este registro para continuar sin perder estado.
