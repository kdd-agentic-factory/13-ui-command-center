# Aceptación autenticada en preproducción — 27 octubre 2026

Proyecto: The Digital Pit Wall, `23afcca6-10d0-4bae-83d0-9999f4717a81`. Resultado: **69 comprobaciones pasan** con identidades, membresías, RLS y autoridad en InsForge real.

Se crearon dos equipos de ensayo y ocho cuentas con contraseñas aleatorias: titular con rol administrativo, suplente con rol de ingeniería, ingeniero y lector por equipo. Las parejas titular/suplente se designaron mediante la función autenticada y auditada del producto. El alta administrativa confirmó únicamente las cuentas de ensayo; no se desactivó la verificación de correo ni se enviaron invitaciones. Credenciales y sesiones quedan fuera del repositorio, con ACL comprobada sin permisos generales.

| Comprobación | Resultado |
|---|---|
| Sesiones de contraseña | Las ocho cuentas autentican contra el proveedor real. |
| RLS | Cada usuario ve únicamente su equipo y su propia membresía activa. |
| Elevación | Lector no puede modificar su rol; ingeniero no puede designar responsables. |
| Aislamiento | Se rechazan autoridad, acceso a propuestas y decisiones del otro equipo. |
| Revocación | El mismo token pierde membresías visibles y acceso a autoridad. Las membresías de lector se restauraron después. |
| Agentes | Dos recorridos HTTP con gateway/worker reales, siete especialistas y síntesis del Chief; ocho llamadas por equipo a Ollama local `qwen3:0.6b`. Sin respuestas de modelo simuladas. |
| Adquisición ausente | Físico y neuro permanecen no disponibles. |
| Aprobación | Cuenta designada del titular en A y del suplente en B; reintentar conserva el mismo evento. |
| Sin autoridad | Lector, ingeniero, otro equipo, petición anónima, token inválido y clave de servicio no pueden aprobar. |
| Contexto obsoleto | Cambiar la sesión invalida la propuesta anterior. |

La lectura final de la base remota confirma ocho usuarios, dos equipos, ocho membresías activas, dos parejas designadas, dos eventos de aprobación —uno del titular y otro del suplente— y dos cabeceras de autoridad invalidadas. Los eventos de ensayo se conservan como evidencia; no son órdenes de taller reales. Las aprobaciones son pruebas automatizadas de cuentas humanas designadas, no aceptación firmada por personas.

La aplicación, gateway y workers se ejecutaron localmente en una instalación de ensayo separada, usando las implementaciones reales de identidad y autoridad por HTTPS contra InsForge, sin reemplazarlas por mocks. Los procesos propios se cerraron al terminar. No se desplegaron servicios ni se detuvieron los del operador.

Los datos de ingeniería y telemetría son fixtures explícitamente sintéticos, con parámetros asumidos y sin validación metrológica. Esto demuestra contratos y autorización; no certifica precisión física, lectura independiente de2D, calidad sobre una moto real ni SLA. La inferencia utilizó Ollama existente en el host; no acredita inferencia dentro de las imágenes de producción.

Persisten el navegador autenticado completo bajo aislamiento, aceptación coordinada de imágenes definitivas, configuración operativa de autoridad/modelo en la entrega, CI completa, congelación de fuentes limpias y referencias externas de adquisición. No se declara disponibilidad general.

Evidencia privada en `.superpowers/sdd/2026-10-27-chassis-single-writer-delivery/preproduction-inspection/`: `remote-acceptance-result.json` (59 comprobaciones), `remote-negative-result.json` (10), `remote-persisted-state.json` y `remote-run-02.log`. Las credenciales permanecen fuera del checkout.


Continuación independiente: el candidato coordinado10 supera27 comprobaciones de navegador con sandbox/TLS, usando emisor sintético y autoridad SQL real aislada, incluidas firmas UI de titular A y suplente B. No reutiliza ni modifica las cuentas cloud de este informe. Detalle y pendientes globales en [aceptación de entrega](chassis-delivery-acceptance-2026-10-27.md).

Ampliación posterior del candidato13:32 comprobaciones del navegador aislado pasan, incluidas revocación del espacio de trabajo ante503 real del emisor, identidad inválida y cambio de equipo durante una petición retenida. Las dos firmas de personas designadas se comprueban contra PostgreSQL efímero. Esta ampliación no realizó operaciones cloud y no sustituye la aceptación de las imágenes contra el destino real.
