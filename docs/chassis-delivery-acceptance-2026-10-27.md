# Aceptación de entrega Chassis — 27 octubre2026

## Estado actual consolidado — 27 de octubre

La aceptación integrada del destino Chassis-Preproduction ha pasado con identidad
real de ocho cuentas de dos equipos, modelo local real y datos de ingeniería
explícitamente sintéticos. Pasan los especialistas y revisores con datos disponibles,
las dos síntesis del Chief (16 llamadas en total), el aislamiento y las aprobaciones
desde Chromium con sandbox del titular del equipo A y del suplente del equipo B.
Se verifican la identidad y la vigencia después de recargar y el perfil lector.
Físico/neuro permanecen indisponibles por falta de adquisición.

Las cuatro imágenes coordinadas superan el escaneo HIGH/CRITICAL. La comprobación
final confirma que no quedan contenedores ni redes del ensayo. Pasan 495 pruebas
de interfaz y la comprobación de tipos. Se corrigieron capacidad de CPU de la IA,
resolución de dependencias del navegador y una carrera de recuperación de identidad.

El candidato **sigue sin autorización de publicación**: faltan los contrastes
independientes de AiM y 2D y sigue pendiente la revocación de la clave histórica.
El control de promoción exige estos tres estados, además de los gates técnicos,
y rechaza declaraciones explícitas de fixture. Ninguna prueba sintética acredita
precisión de adquisición ni valida recomendaciones físicas.

Las secciones siguientes conservan la cronología de ensayos anteriores; sus
bloqueos concretos de identidad, modelo y navegador quedan sustituidos únicamente
por los resultados descritos aquí. No se ha desplegado en producción ni modificado ARGOS.


Candidato de instancia única. No desplegado. No aplicar migraciones cloud ni promover estas imágenes de fixture.

## Continuación: candidato coordinado 13

El manifiesto actual identifica las imágenes del candidato13. **La aceptación completa aislada pasa en `stack-37-full/result.json`:11 controles obligatorios, ninguno pendiente y ningún bloqueo del ensayo.** Alcance `isolated_fixture_acceptance`, con `fixture_only:true` y `publishable:false`. No se promociona ni despliega. El candidato10 queda como evidencia histórica y no contiene las correcciones posteriores de restauración.

| Control final | Resultado |
|---|---|
| HTTP y permisos | TransporteTLS, separación de equipos, lectores/ingenieros/administradores, revocación y rutas privadas/históricas rechazadas. |
| Navegador e identidad |32 comprobaciones; TLS y sandbox, persistencia, cambio de equipo durante petición retenida, modos inválidos y retirada de acceso ante503 real del emisor. |
| Agentes y decisión humana | Dos análisis completos con respuestas de modelo controladas; firmas UI de titularA y suplenteB, contrastadas con dos eventosSQL. |
| Recuperación | Backup frío verificado, destino nuevo, reinicioHTTPS, trabajo interrumpido fallido, permisos antiguos rechazados, reservas conservadas y reconciliación explícita. |
| Salud y seguridad | FrontendDocker saludable; cuatro archivos de imagen exactos revalidados contra sus informes originales, sin HIGH/CRITICAL. |

Pendientes de salida comercial: fuentes limpias y CI remota; construir y aceptar el frontend del destino real; conexión operativa de esas imágenes a autoridad y modelo reales; contraste externo2D y referencias metrológicas. Las comprobaciones históricas de InsForge/Ollama siguen siendo evidencia independiente y no se atribuyen a este ensayo controlado. Hay deuda de estiloRuff registrada en el ledger; no se presenta el lint general del backend como limpio.

Correcciones comprobadas con regresiones: una propuesta de un run restaurado deja de estar vigente para acciones nuevas; una aplicación restaurada tampoco admite validaciones nuevas. Se mantiene la repetición idempotente de recibos históricos. La autoridad instalada del candidato13 supera77 pruebas. Los contratos de entrega superan47 pruebas y la suite completa del backend985, con20 omitidas y dos avisos.

`stack-35-full/browser-result.json`:32 comprobaciones autenticadas pasan con sandbox y TLS verificado; incluye titularA, suplenteB y los nuevos escenarios de identidad. Las firmas están contrastadas con dos eventos de PostgreSQL aislado. El escaneo exacto de las cuatro imágenes pasa en `portable-scan13/result.json`, sin HIGH/CRITICAL. Las pruebas instaladas de operaciones dan49 pases y dos casos asíncronos adicionales ejecutados con `asyncio.run`: la imagen no incorpora el pluginpytest-asyncio de desarrollo. No se ha instalado una dependencia adicional en producción.

`stack-36-recovery/pending-recovery-result.json`:11 comprobaciones de recuperación HTTP pasan, con ambas plazas de inferencia ocupadas antes de interrumpir el servidor y más de54s de vigencia restantes al verificar el rechazo de la tercera llamada. El resultado general de ese ensayo de depuración sigue `blocked`, porque se ejecutó expresamente con `--browser-smoke-only`. La repetición integral es `stack-37-full`.

El ensayo ampliado añade cambio de equipo durante una comprobación retenida, rechazo de modos de identidad inválidos, caída503 del emisor desde una sesión autenticada y rechazo de CA incorrecta por nginx. La recuperación recrea un trabajo pendiente y dos reservas reales de inferenciaHTTP antes de interrumpir el servidor. Los resultados finales están en `stack-37-full`, separados de los ensayos anteriores.

Se corrigió la sonda Docker del frontend para usar127.0.0.1: nginx escuchaba IPv4, pero `localhost` podía resolver aIPv6 y dar un falso estado no saludable. El candidato13 debe acreditar también el estado `healthy`. En Linux, la transferencia privada sólo se comparte con el contenedor de recuperación mediante el grupo concreto de la ruta temporal; el navegador y nginx no reciben ese archivo.

## Histórico: candidato coordinado 10

**Navegador autenticado y firmas aisladas verificados; entrega global todavía bloqueada.** No desplegado ni publicable. La imagen frontend apunta al emisor de prueba y no debe entregarse a clientes.

| Área | Resultado medido |
|---|---|
| Cuatro imágenes exactas | Construcción coordinada completada; Trivy fijado, base fresca, cero HIGH/CRITICAL en `portable-scan10/result.json`. |
| Navegador compilado | 27 comprobaciones pasan en `stack-27-sql-human`: TLS verificado, sandbox, SDK/contraseña, cookie, logout, sesiones A/B, revisión persistida, lector después de cargar y retirada/reselección del equipo. |
| Agentes y firmas | Dos análisis sellados; ocho llamadas controladas por equipo. Firma UI del titular A y suplente B contrastada con dos eventos SQL de personas designadas. Físico/neuro sin inferencia al faltar adquisición. |
| Autoridad instalada | 73 pruebas contra PostgreSQL, sin omitidas; dos avisos por marcas de tests importados no seleccionados. |
| Recuperación instalada | 35 pruebas de backup/restore/exclusión/readiness y recorrido HTTPS de restauración a raíz nueva con catálogo y permisos conservados. No acredita aún el recorrido HTTP completo de un trabajo pendiente restaurado. |
| Física instalada | 34 pruebas de geometría, bieletas, movimiento, banco y espectro. Datos de control sintéticos; sin certificación metrológica. |
| Frontend/backend | Typecheck y 493 pruebas UI pasan. Backend: 981 pasan, 20 omitidas y dos avisos; ningún cambio backend posterior a esa suite. |
| Entrega | 35 contratos pasan; Compose resuelve con inputs sintéticos sin arrancar servicios. Autoridad, clave privada sólo en API y modelo explícitos; comprobación de promoción rechaza el candidato. |

Correcciones adicionales: la consulta de análisis cada dos segundos consumía 63 peticiones/minuto frente a la cuota humana de60. Regresión reproducida y corregida a cinco segundos, dejando margen para decisiones. No se aumentó ni desactivó el límite. Compose ya no omite silenciosamente la configuración de autoridad/modelo.

Pendientes para aceptación global: recorrido HTTP de un trabajo pendiente a través de copia/restauración con delegaciones y reservas; completar escenarios de identidad/proxy/scope exigidos por Task9 sobre el artefacto final; verificar la conexión operativa del destino con autoridad y modelo reales; fuentes limpias y CI coordinada cuando se autorice esa fase. La CI remota no se ha ejecutado, conforme al plan. Referencia externa de2D y validación metrológica siguen separadas y pendientes. Las pruebas de cuentas humanas son automatizadas, no una aceptación personal firmada por operadores.

Los artefactos anteriores se conservan como historial. El resultado global del runner sigue `blocked`; los gates de navegador autenticado y firma SQL específicos sí pasan. No se convierte el éxito del fixture en una release comercial aceptada.

## Primera tanda: evidencia histórica

Esta tabla conserva el punto de partida; los resultados de continuación posteriores la actualizan.

| Comprobación | Evidencia inicial |
|---|---|
| Dependencias Linux | Wheels descargadas dentro de Docker; versiones y SHA256 fijados. Sin instalación en el host. |
| Motor17 dentro de18 | Importación aislada sin red y resultado de wheel_rate25000 comprobados; aplicación importa sin Torch. |
| API HTTPS | Certificado verificado, readiness privada200 y anonimato rechazado. |
| Exclusión | Segunda API rechazada, backup en caliente bloqueado; bloqueo liberado tras terminar el proceso. |
| Recuperación | Copia fría verificada y restauración en destino nuevo. Prueba adicional de rollback real tras matar un escritor SQLite: RED→GREEN. |
| Nginx y servicios | HTTP real contra cuatro contenedores: proxyTLS, identidad de fixture, aislamiento entre equipos y rutas internas/históricas negadas pasan. |
| Worker | Control real y claim_synthesis devuelven200 en el stack aislado tras corregir el contexto de instalación. La ejecución completa de análisis con autoridad real sigue pendiente. |
| Navegador | Bloqueado: Chromium con sandbox no arranca bajo el aislamiento actual. No se ha desactivado el sandbox. |
| Seguridad de imágenes | Primer escaneo offline con Trivy0.76.1 fijado: API, gateway y worker bloqueados con15 identificadores cada uno; frontend con2. La baseTrixie alternativa elimina los hallazgos deSQLite, pero conserva avisosHIGH sin versión corregida en el informe. No se ha adoptado como imagen final. No se ignoran automáticamente. |
| Frontend | Typecheck correcto y489 pruebas pasan en108 archivos. |
| Backend | Suite final posterior a las correcciones:975 pasan,20 omitidas y2 avisos en380,73s. Física/suspensión/espectral dentro de la imagen Linux:38 pasan. No se atribuye esta suite final a imágenes anteriores. |
| CI | Push automático desactivado; checks de seguridad conservados. Workflow manual de contrato preparado; la cadena coordinada completa sigue pendiente. |

Los logs y artefactos de esta ejecución se conservan en `.superpowers/sdd/2026-10-27-chassis-single-writer-delivery`. `result.json` mantiene estado por gate y salida no-cero cuando falta aceptación. El manifiesto público sigue siendo candidate/no publicable. Las fuentes contienen cambios locales y no se presentan como commits remotos limpios.

Pendientes identificados en la primera tanda (ver actualizaciones posteriores): base e imágenes que superen seguridad, aceptación completa de trabajos del worker y perfiles/autoridad, navegador con aislamiento operativo, recuperación ampliada e integración CI de build/scan/aceptación, congelación de las huellas definitivas. La validación de proveedor real, IA real y referencias de adquisición permanece separada.

Durante el primer ensayo de contexto, el perfil global de desarrollo permitió un fallback y creó `13-ui-command-center/data/chassis.sqlite`. Se conserva sin asignarlo ni borrarlo; el caso se reprodujo después con perfil de producción y la corrección mantiene la raíz explícita de la instalación. Las pruebas posteriores fuerzan esa condición y no usan ese fallback.

## Revisión independiente y correcciones

La revisión final identificó cinco hallazgos importantes. Se corrigieron con regresiones observadas antes y después: bloquear la reutilización de runs restaurados incluso si estaban sellados; reconciliar la generación con la autoridad verificada sin incrementarla offline; impedir destinos de mantenimiento dentro de otra instalación; comprobar escritura real de almacenes y directorios en arranque/readiness; y exigir fuentes completas, limpias y coincidentes antes de promover imágenes. También se cerró el acceso a rutas RAW/Raw antes de crear el bloqueo.

La aceptación HTTPS en Linux comprueba que un almacén o directorio de grabaciones sin escritura devuelve503, que vuelve a200 al recuperar permisos y que la copia fría se restaura en un destino nuevo. Usa identidad y datos sintéticos. El historial restaurado se conserva; requiere un análisis nuevo para producir decisiones nuevas.

Se difieren dos limitaciones operativas: el presupuesto temporal no es un límite duro para todas las fases de copia/verificación, y un primer arranque interrumpido antes del marcador requiere diagnóstico manual. No se ofrece RTO garantizado ni reparación destructiva automática.

Estado al terminar la primera tanda: candidato bloqueado, no release aceptada. Las tareas7–10 siguen abiertas en construcción coordinada definitiva, seguridad, aceptación integral y CI. La imagen API de revisión precede al último guard de RAW en el lease directo; no se presenta como artefacto final congelado.

## Continuación: seguridad del frontend y trazabilidad

Se comprobaron en el repositorio Alpine3.24 las versiones corregidas brotli-libs1.2.1-r0 y curl/libcurl8.23.0-r0. Una imagen derivada del frontend de fixture, con esos paquetes exactos, supera Trivy0.76.1 sin hallazgos HIGH/CRITICAL (salida0, misma base de vulnerabilidades que el ensayo anterior). El Dockerfile incorpora estas versiones. Es una prueba de remediación de paquetes, no una imagen comercial final: todavía contiene configuración de identidad de fixture y requiere reconstrucción coordinada, prueba funcional y escaneo final. Las imágenes Python continúan bloqueadas.

El constructor ya no deriva las etiquetas solo del lock de dependencias: incluye la identidad de fuentes y bases. Evita reutilizar una etiqueta para código distinto con las mismas dependencias. Regresiones de entrega:16 pasan. No se han reconstruido ni promovido las imágenes comerciales con estas fuentes.

## Continuación: permisos y recuperación con arranque

El ensayo coordinado `stack-06-roles-recovery` comprueba HTTP real a través del proxy, gateway privado y una segunda API aislada dedicada a recuperación. Pasan los controles de lector frente a ingeniero, encabezados de rol falsificados, propiedad asignada por servidor, membresía revocada, lectura/escritura desde otro equipo y ausencia de cambios tras escrituras rechazadas. El emisor de identidad es sintético; no sustituye la validación del proveedor real ni acredita el Chief/suplente.

La copia fría ahora contiene un catálogo creado por HTTP. Se restaura a un destino nuevo, se arranca otra API sobre ese destino, se compara el catálogo completo y se repiten los límites de lector y equipo. Los gates parciales `cold_recovery` y `role_boundaries` pasan. La recuperación completa de trabajos interrumpidos/autoridad humana y el navegador siguen bloqueados; el resultado global conserva salida2. Se ha ejecutado con el frontend de ensayo de seguridad corregido.

Las identidades de fuentes declaradas en este ensayo provienen del snapshot histórico de preparación y no certifican correspondencia con el contenido de las imágenes usadas. El informe lo identifica expresamente en futuras ejecuciones. Las imágenes siguen siendo fixtures no publicables; falta congelar y verificar la entrega definitiva. Ningún servicio del operador ni dato real se ha utilizado.

## Actualización: runtime, sandbox, IA y proveedor real

Esta actualización sustituye los estados de bloqueo anteriores únicamente en las comprobaciones indicadas. El candidato global sigue bloqueado.

- Las tres imágenes Python finales de `ubuntu-images-05`, con Ubuntu24.04 y Python3.12, superan Trivy0.76.1 sin hallazgos HIGH/CRITICAL. Los informes `ubuntu-final-native-{api,gateway,worker}` identifican las imágenes exactas. Se verificaron paquetes del sistema y dependencias de aplicación, sin ignorar vulnerabilidades sin corrección. El frontend de fixture también supera el análisis; todavía requiere construcción comercial coordinada.
- Chromium arranca con sandbox habilitado. El perfil seccomp específico del navegador permite los espacios de nombres y `chroot` requeridos, manteniendo usuario sin privilegios, capacidades eliminadas, sistema de archivos de solo lectura y `no-new-privileges`. Pasan carga y recarga anónimas. Falta el recorrido autenticado completo por perfiles y aprobación humana en navegador.
- En Linux pasan73 comprobaciones de autoridad/permisos contra PostgreSQL aislado y3 recorridos HTTP de agentes con respuestas controladas. El motor numérico instalado supera38 pruebas. Son ensayos locales, no certificación del proveedor remoto.
- La IA real local con qwen3:0.6b completa siete agentes, Chief, propuesta, aprobación humana e invalidación por cambio de evidencia/revocación en70,48s. Usa telemetría sintética y SQL real aislado; físico/neuro permanecen sin llamadas por ausencia de adquisición. qwen3:1.7b pasa el recorrido básico con decisión humana, pero falla el ampliado por timeout de un especialista; qwen3:4b tampoco supera el presupuesto. No se ha cambiado automáticamente el modelo de producción ni eliminado límites.
- Se corrigió la CA privada de la autoridad: ahora utiliza la CA configurada para identidad, conserva verificación TLS y rechaza certificados no confiables. Pasan43 pruebas afectadas y3 pruebas TLS sobre la imagen instalada final.

El proyecto remoto confirmado por el usuario es `The Digital Pit Wall`, ID `23afcca6-10d0-4bae-83d0-9999f4717a81`. La inspección de solo lectura encuentra cero tablas públicas, usuarios, políticas públicas, funciones `chassis_*` y migraciones aplicadas. Las funciones públicas de extensiones existentes no se confunden con funciones de Chassis. No se han aplicado migraciones, creado cuentas ni modificado cloud. Se prepararon dos candidatos locales de migración en el área privada de evidencia, conservando el SQL revisado y dejando la transacción exterior al CLI. La activación remota queda fuera de la autorización actual.

Persisten la aceptación autenticada integral, configuración operativa de autoridad/modelo en la entrega, CI coordinada completa, congelación de fuentes limpias y referencias externas de adquisición. Estos resultados no autorizan presentar el producto como listo para producción o venta.

## Activación autorizada del esquema de preproducción

Tras autorización expresa posterior, se aplicaron exclusivamente `20261027110026_chassis-teams.sql` y `20261027110029_chassis-human-authority.sql` al proyecto identificado. Ambas constan en el historial remoto. La comprobación posterior encuentra11 tablas de Chassis con RLS habilitado y12 funciones de autoridad, todas propiedad de `project_admin` y sin permiso de ejecución para `anon`. Existen2 políticas públicas. Se conservan cero usuarios y cero equipos: no se crearon cuentas, membresías ni designaciones, ni se desplegaron servicios.

Esto sustituye únicamente el estado anterior de migraciones no aplicadas. La aceptación de aislamiento y decisión humana con sesiones autenticadas reales sigue pendiente; inspeccionar RLS y permisos no demuestra por sí solo ese recorrido.

## Cierre del ensayo autenticado contra preproducción

Con autorización posterior para crear cuentas y validar, se crearon dos equipos y ocho cuentas. Pasan69 comprobaciones con InsForge real: autenticación, RLS, revocación, aislamiento, agentes reales con Ollama local, aprobación mediante cuentas designadas de titular y suplente, idempotencia, rechazo de la clave de servicio e invalidación por cambio de contexto. La lectura remota confirma dos eventos de aprobación, uno por cada responsable probado. Las credenciales quedan fuera del repositorio y las membresías revocadas durante el ensayo están restauradas.

El alcance exacto está en [aceptación autenticada de preproducción](chassis-preproduction-identity-acceptance-2026-10-27.md). Los datos son sintéticos y los servicios de aplicación/agentes se ejecutaron localmente; no se atribuye este resultado al navegador ni a un despliegue productivo completo.


## Continuación: imágenes coordinadas y navegador autenticado

La tanda `ubuntu-images-09` construye API, gateway, worker y frontend desde los contextos verificados del candidato. Las cuatro imágenes exactas pasan el escaneo Trivy 0.76.1 con base actualizada el 27 de octubre: cero hallazgos HIGH/CRITICAL, sin ignorar vulnerabilidades sin parche. La prueba está en `portable-scan09/result.json`; no se atribuye a imágenes anteriores.

Se han corregido la CSP comercial para admitir únicamente el proveedor HTTPS configurado, la separación de cuotas entre identidades humanas y el servicio de coordinación, la propiedad de la clave TLS de CI y la limpieza de recursos de prueba cuando expira el presupuesto de aceptación. La imagen del navegador añade NSS dentro del contenedor; Chromium conserva sandbox, usuario no privilegiado, capacidades eliminadas y perfil seccomp restrictivo. No se desactiva la verificación TLS: primero se demuestra el rechazo de la CA desconocida y después se instala exclusivamente la CA pública de la prueba.

Verificación de código: frontend 492 pruebas en 109 archivos y typecheck correcto; backend 981 pruebas, 20 omitidas y dos avisos; contratos de entrega 34 pruebas. Sobre la API instalada de esta tanda, 35 pruebas de backup, restore, exclusión y readiness pasan, incluyendo cierre de trabajos interrumpidos, invalidación de leases y conservación de la cuarentena del modelo. Estas pruebas de recuperación usan estado sintético; no sustituyen todavía el recorrido HTTP completo de un trabajo pendiente restaurado.

El navegador autenticado de `stack-21-auth-browser-crud` pasó 19 comprobaciones: contraseña mediante SDK real, cookie de renovación, logout persistente, sesiones A/B persistidas, lectura restringida y aislamiento al cambiar de usuario en el mismo almacenamiento del navegador. La ampliación posterior incorpora espera explícita de los datos antes de afirmar aislamiento, revisión de sesiones, retirada del equipo activo y aprobación desde la interfaz con autoridad SQL real. Su resultado debe consultarse separadamente; los 19 checks anteriores no acreditan esa ampliación.

La CI manual prepara referencias exactas, fuentes limpias, construcción coordinada, escaneo y aceptación. No se ha ejecutado remotamente ni se han publicado imágenes. Usa fases secuenciales en un único job para conservar las mismas imágenes locales durante build, scan y aceptación; separarlas en jobs requeriría transferir y volver a verificar los artefactos. La entrada de paquetes y ruedas públicas debe aportarse como artefacto con integridad validada. Los fallos siguen bloqueando la entrega.

Estado: candidato local aún bloqueado. El frontend construido apunta al emisor sintético aislado y no es una imagen para desplegar en clientes. Continúan pendientes el recorrido ampliado del navegador, recuperación HTTP de trabajos pendientes, aceptación integral de la configuración real y congelación/promoción con fuentes limpias. El contraste externo de 2D sigue pendiente por ausencia de Analyzer/exportación de referencia; no se presenta como certificado. No se ha desplegado ni modificado cloud en este bloque.


La autoridad también se ha vuelto a comprobar sobre la API final `ubuntu-images-09`: 73 pruebas pasan contra PostgreSQL aislado, con dos avisos de marcas de tests importados que no se ejecutan. No hay omisiones en ese bloque. La CI preparada exige ahora el ensayo de agentes y autoridad SQL y conserva su informe de firmas. Sigue sin haberse ejecutado remotamente.
