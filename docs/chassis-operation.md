# Operación local de Chassis Tool

## Flujo disponible

Abrir `http://127.0.0.1:5173/pit-wall/app`. Importar una sesión AiM o una exportación tabular con tiempos y unidades. En Chassis introducir identificador de moto, confirmar su asociación y completar A (base declarada de la sesión) y B (alternativa). Campos vacíos permanecen desconocidos; marcar las estimaciones. Guardar y comparar produce revisiones inmutables y diferencias B−A calculadas por el backend.

La superposición representa dirección, radio delantero y batalla. No inventa dimensiones de rueda trasera o bieletas. Para inspeccionar evidencia, abrir el cálculo y consultar sesión, revisiones, modelo y fórmula. Una recarga restaura la última comparación compatible con la moto asociada. Si se modifica un dato, los resultados anteriores permanecen identificados hasta recalcular.

La sección de señal calibrada exige canal, magnitud, cero, escala, signo y referencia de calibración. Es una declaración del operador, no una calibración verificada en banco. Los tiempos se conservan. La aceleración longitudinal permite calcular un sobre de cargas cuasiestáticas si existen masa con piloto, reparto estático, CG y batalla. Las cargas negativas invalidan el dominio, no se recortan.

Un desplazamiento de amortiguador identificado como tal puede utilizar muelle, precarga y relación constante de movimiento medidos. Una pendiente local distinta de cero exige introducir la curva completa en el editor progresivo. La fórmula general de rigidez tangente está disponible como cálculo puntual en el motor Python. Ni un potenciómetro de horquilla ni el desplazamiento de rueda se interpretan automáticamente como carrera del amortiguador.

La velocidad de suspensión es opcional: requiere ventana impar de 3–101 muestras y hueco máximo temporal positivo. Se estima mediante ajuste lineal local sobre el reloj original. Los bordes y ventanas que cruzan huecos quedan ausentes. Los parámetros del filtro se guardan con la evidencia.

## Arranque

Desde `18-telemetry-dataset`, instalar primero el paquete hermano del motor y después el lector. La instalación del motor sin dependencias utiliza únicamente su subpaquete puro de chasis; no inicia el laboratorio de simulación ni sus servicios.

```powershell
.\.venv\Scripts\python.exe -m pip install --no-deps -e ..\17-digital-twin-simulation-lab
.\.venv\Scripts\python.exe -m pip install -e '.[dev]'
.\.venv\Scripts\python.exe -m uvicorn telemetry_dataset.main:app --host 127.0.0.1 --port 8180
```

Desde `13-ui-command-center`: `npm run dev -- --host 127.0.0.1`. Desde `15-race-command-center/frontend`: arrancar su Vite en 5174; su entrada de chasis conduce al espacio principal. La ruta real de chasis reside en 13, no en dos implementaciones independientes.

AiM nativo necesita Windows x64, la DLL oficial y sus dependencias. Ver `18-telemetry-dataset/docs/recorded-imports.md`. Linux puede usar exportaciones tabulares; no ejecuta esa DLL.

## Persistencia y contratos

Sesiones en `18/data/recorded`, inmutables en cuanto a muestras; revisiones, bindings y comparaciones en `18/data/chassis.sqlite`, excluidos de Git. `TDS_RECORDED_DIR` y `TDS_CHASSIS_DB` permiten cambiar las rutas. Conservar ambos durante copias de seguridad. Las transacciones evitan revisiones parciales y las claves de operación evitan duplicar un guardado reintentado con idénticas medidas. Reutilizar una clave con otro contenido devuelve 409.

API bajo `/api/v1/chassis`: `POST /setups`, `GET /setups/{id}`, `POST /bindings`, `POST /comparisons`, `GET /sessions/{id}/state`. Todas exigen los encabezados de auditoría y aplican la API key del servicio si está configurada. Los actores delimitan el trabajo local; esos encabezados no son autenticación independiente de equipos. Producción exige identidad autenticada y membresías verificadas en servidor. El entorno de trabajo sigue en modo local; no exponerlo como servicio multiusuario.

El esquema registrado es `chassis-comparison` 1.1.0, registro global 1.3.0; admite resultados históricos 1.0.0. Los registros antiguos de geometría se conservan y se ofrecen como punto de partida parcial de A/B; guardar nuevas revisiones no reescribe esos registros ni los canales.

## Matriz de capacidad

| Capacidad | Estado y evidencia |
|---|---|
| Lectura AiM XRK | SDK oficial en Windows x64; dos sesiones reales verificadas, 110 y 111 canales incluyendo grupos GPS. Sin hardware conectado. |
| 2D CSV/TSV con unidades | Lector y flujo de UI probados con fixture de formato; pendiente contraste con una exportación real de 2D. |
| 2D MES/DDD en ZIP | Subconjunto experimental: 27 canales leídos en una medición de cada ZIP ASPAR. 48 canales excluidos por medición. Sin contraste del fabricante; no fundamenta recomendaciones mecánicas. DRK corresponde a AiM. |
| Geometría A/B | Operativa localmente: avance, avance normal y batalla, revisiones y superposición plana. |
| Cargas longitudinales | Operativas bajo aceleración y medidas explícitas; modelo cuasiestático, sin aero ni inclinación. |
| Muelle y velocidad | Cálculos condicionados a punto de medida, calibración, relación y filtro identificados. No identifican hidráulicos. |
| Explicación de evidencia | Hallazgos deterministas con referencias. Adaptador opcional de priorización mediante modelo local; no hay un modelo ejecutándose en este equipo. |
| Nube, live y otros módulos | Su presencia en navegación no demuestra integración; quedan secundarios y el flujo real indica los módulos pendientes. |
| Despliegue multiusuario | Bloqueado para chasis hasta verificar identidad/aislamiento, operación y validación experimental. |

## Comprobaciones

En 17: `python -m pytest tests/unit/test_chassis_physics.py -q`.
En 18: `python -m pytest tests/test_chassis_api.py tests/test_chassis_signals.py tests/test_chassis_recommendations.py tests/test_recorded_sessions.py tests/test_verified_import.py tests/test_aim_channel_groups.py -q`.
El contrato empaquetado se comprueba además con `tests/test_chassis_package.py`; `tests/packaging_chassis_smoke.py` ejecuta una comparación usando una instalación wheel aislada por `pip --target`, fuera del checkout.
En 13: `npm test`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/chassis-recorded.spec.ts --project=chromium --reporter=line` con el backend local arrancado. La prueba de navegador usa datos QA declarados, no constituye validación real de 2D ni de una moto.

Desde 18, `docker build --target chassis-core --build-context chassis_source=../17-digital-twin-simulation-lab -t kdd-chassis-core:local .` verifica empaquetado y cálculo puro en Linux, fuera del checkout. Omitir `--target` construye además el runtime completo; incluye las dependencias históricas de PyTorch. La verificación del stage de chasis no certifica por sí sola el runtime completo.
El Compose de `10-infra-docker/docker-compose.jarvis.yml` incorpora ese mismo contexto adicional; requiere conservar juntos los repositorios 17 y 18.

## Validación pendiente

Medidas de la moto y piloto, referencias de sensores, básculas, curvas de bieletas y banco de amortiguadores; una exportación 2D real; validación de dominio, incertidumbre y comportamiento frente a ensayos. La incertidumbre de entrada se conserva si se proporciona, pero aún no se propaga estadísticamente a resultados. Los setups QA asumidos sirven para comprobar el software y no deben utilizarse como recomendación para esa moto.


## Suspensión progresiva — modelo 1.1.0

En cada setup abrir «Curva de suspensión progresiva». Introducir 3–500 pares rueda; amortiguador en mm, empezando por 0;0 y aumentando estrictamente ambos ejes. Indicar fuente, procedencia y extensión completa. No se suministran curvas ficticias. No se han localizado medidas de bieletas verificadas de esta moto.

El backend interpola s=f(z) con PCHIP monótono, invierte solo dentro del dominio y calcula q=ds/dz, Fs=k(s+p), Fw=Fs*q y kw=k*q²+Fs*dq/dz. La rigidez contempla ambos límites en nodos porque la segunda derivada puede saltar. Se evalúan todas las muestras originales del intervalo, hasta 250000; no se diezman para física. Fuera de dominio se excluye la muestra y se informa cobertura. La comparación aplica el mismo movimiento registrado a ambas alternativas: no predice el movimiento de B ni tiempos de vuelta. Se exige cero del sensor referido a extensión completa tanto con curva como con relación constante.

## Importación nativa 2D experimental

Seleccionar origen 2D y ZIP; inspeccionar, elegir explícitamente una medición MES y aceptar el carácter experimental antes de importar. No se extrae el ZIP. Se comprueban rutas, duplicados, cifrado/enlaces, límites de expansión y CRC de todas las entradas. Solo se decodifican variantes observadas de 16 bits y reloj continuo IST/STI compatibles. Los tiempos se reconstruyen desde metadatos; el origen temporal, signo y escala requieren contraste con Analyzer. Variantes desconocidas quedan excluidas; relojes desconocidos bloquean la medición.

Verificación local: abril, primera medición, Susp_F/Susp_R con 75920 muestras por canal; mayo, segunda medición, 40976 por canal; ambos a 100 Hz reconstruidos. La primera medición de mayo carece del IST requerido y se rechaza. Esto comprueba funcionamiento del lector, no exactitud certificada. Los hallazgos de estas sesiones piden contrastar la fuente antes de recomendar ingeniería.

Para contraste usar [exportación oficial 2D Analyzer](https://help.2d-datarecording.com/Analyzer_Export), conservando unidades y registrando si hubo interpolación o conversión de frecuencia. [Analyzer Script](https://help.2d-datarecording.com/Analyzer_Script) documenta automatización mediante AutoAna; ese software no está instalado aquí.

## Inferencia local opcional

Configurar en el servidor `CHASSIS_LOCAL_MODEL` y opcionalmente `CHASSIS_LOCAL_MODEL_URL` (por defecto http://127.0.0.1:11434). El adaptador consulta metadatos del modelo, rechaza alias remotos y solo envía magnitudes agregadas de hallazgos, sin muestras, GPS, notas ni identidades. Usar Ollama con `OLLAMA_NO_CLOUD=1`. No descarga modelos. Timeout HTTP de 8 segundos por operación, sin reintentos. El modelo solo ordena IDs conocidos y elige pruebas permitidas; las cifras y las afirmaciones mecánicas proceden del motor. Ante ausencia, fallo o salida inválida se mantienen reglas deterministas y estado visible.

Siguen pendientes para venta: medición y ensayo de la suspensión real, contraste con exportación 2D del fabricante, validación de dominio/incertidumbre y activación/verificación de equipos reales. El explicador de comparación es opcional y distinto del análisis de agentes. El 26 de octubre se verificó inferencia real de agentes con qwen3:0.6b: tres revisores y Crew Chief finalizaron; mecánica pidió evidencia adicional. La prueba usó datos e identidades de QA, no acredita la precisión física de la grabación real y no superó la aceptación completa. Consultar `docs/engineering-delivery-status.md` y `docs/engineering-crew-chief-operation.md` para su estado operativo.


## Identidad y equipos — contrato2.0

`TDS_IDENTITY_MODE=authenticated` activa la frontera de identidad del servicio. Configurar `TDS_IDENTITY_URL` con el origen HTTPS del proveedor InsForge y, si corresponde, `TDS_IDENTITY_ANON_KEY` (publicable). Cliente: `VITE_INSFORGE_URL`/`VITE_INSFORGE_ANON_KEY` del mismo proyecto; mantener el proveedor dentro de la política CSP, sin desactivarla. Los bearer solo viven en memoria; la renovación usa el método público refreshSession del SDK. El modo local es explícito, acepta solo loopback y nunca recibe credenciales como fallback. Producción exige authenticated y conserva los requisitos de TLS/operación externa.

El servidor verifica identidad en `/api/auth/sessions/current` y consulta membresías activas en cada petición. `X-Team-ID` selecciona un equipo al que ya pertenece el sujeto; headers de actor/rol no autorizan. El actor guardado deriva del sujeto verificado. Roles reader/engineer/admin. Las sesiones y objetos de chasis llevan team_id/created_by; miembros del mismo equipo colaboran. Foreign/unowned IDs devuelven404. Las rutas legacy, catálogo compartido, exportación y almacenamiento sin propiedad de equipo quedan cerrados en modo autenticado; también docs/OpenAPI y métricas sin política propia. Health/version no contienen datos de equipo. CORS envuelve respuestas de identidad y fallos.

Migración `21-agentic-backend-insforge/migrations/012_chassis_teams.sql`: equipos, membresías, RLS y función `chassis_set_membership`. Solo un admin activo del equipo puede gestionar sus miembros, sin escritura directa ni eliminación del último admin. Primera creación de equipo/admin requiere al operador autorizado del entorno; la aplicación no se autoasigna ese permiso. La migración se probó en PostgreSQL16 local aislado; NO se aplicó a la nube ni se crearon cuentas reales. Validar proveedor, roles DB y sesión real después de aplicarla antes de habilitar clientes.

SQLite crea copia `.pre-team.sqlite` antes de añadir columnas de propietario. Filas y sesiones antiguas sin dueño quedan en cuarentena para authenticated. El modo local mantiene su acceso previo; no adoptar automáticamente datos reales. `scripts/migrate_team_ownership.py --recorded-dir <dir> --database <db>` solo inventaría cantidades. Una adopción debe revisarse por ID/equipo/admin con backup restaurable; esta entrega no la ejecuta ni la automatiza.

La selección del cliente se separa por usuario/equipo. Cambio de equipo desmonta el espacio anterior; respuestas y cuerpos JSON que terminan tarde se descartan. Logout invalida restauraciones pendientes y borra identidad visible antes de esperar al proveedor. Expiración renueva una vez; fallo definitivo vuelve a requerir login.

### Evidencia y activación pendiente

Las pruebas API usan un proveedor sintético y dos equipos; las pruebas SQL ejercitan políticas reales en una base local. El navegador de equipos usa Vite5175 y servidor8191 exclusivos de QA, con credenciales ficticias y rutas de proveedor interceptadas; NO demuestra login con el proveedor productivo. El proveedor del entorno real y la migración cloud siguen pendientes de activación/validación. La aplicación de trabajo en5173/8180 permanece local para no asignar datos antiguos ni bloquear su acceso durante preparación.

Ejecutar modelo y backend local: `scripts/start_chassis_backend.ps1 -IdentityMode local`. El script comprueba digest de pesos y calienta Ollama antes de activar CHASSIS_LOCAL_MODEL. Para equipos, usar authenticated solo tras configurar proveedor/membresías y completar revisión del despliegue. Ninguna publicación se ha realizado.

## Producto e informe mínimo — 2026-10-25

La entrada de datos permite desplegar **Abrir una sesión guardada**. La biblioteca procede de `GET /api/v1/recorded`: metadatos paginados y filtrados por equipo; reader puede consultar y abrir. En modo local solo se listan grabaciones sin propietario. El índice `catalog.sqlite` es reconstruible a partir de JSON; los registros antiguos no se reescriben ni se adoptan. Su fecha es incorporación al catálogo, no adquisición. Un archivo corrupto se omite con diagnóstico y no debe bloquear las demás sesiones.

Chassis muestra su backend y modelo reales, separados de los seis servicios de plataforma histórica. Setups e informe ya usan estado persistido de la sesión actual. El informe se descarga en JSON restringido o se imprime desde una comparación guardada; contiene revisiones, medidas/procedencia, versión física, calibración, evidencia y límites, sin arrays de señales crudas. Editar un borrador no cambia informes previos. La impresión expande detalles de evidencia y después restaura la vista.

Al navegar, cerrar la grabación o cambiar de perfil con cambios sin guardar, elegir seguir editando o descartar. Cambios forzados de identidad limpian datos y respuestas del contexto anterior. Los borradores permanecen en memoria; recargar voluntariamente advierte si hay cambios, pero no los persiste como medidas verificadas.

**Circuito, piloto y motocicleta · cobertura del producto**, dentro de Chassis, presenta 39 requisitos del informe recibido, estados, dependencias y aceptación. Permite filtrar dominio/estado; sus seis especialistas son contratos previstos. Los canales presentes solo informan disponibilidad parcial y una fuente experimental sigue sin validar. No hay diagnósticos de piloto, optimizador bayesiano, visión de pista o seis agentes operativos por mostrar esta cobertura. La matriz completa está en `docs/product-completion-matrix.md`.

## Taller visual — 26 octubre 2026

Las cuatro vistas están dentro de Chassis: geometría global, horquilla, tren trasero y escenario de curva. Los despieces son esquemáticos; el deslizador de explosión solo cambia la vista. No son CAD certificados de un fabricante. Identificar moto y completar medidas antes de calcular. El eje de dirección respecto al chasis se introduce por separado de la dirección desde la vertical; una inconsistencia bloquea la pose.

Target Lock requiere referencia A completa, fichas verificadas del modelo de componente, límites, paso y cero documentados. Calcula una búsqueda discreta acotada y exige «Usar propuesta en B». La aceptación actualiza también dirección global/batalla como estimaciones; no modifica A ni el montaje. Revisar una ficha invalida resultados anteriores y respuestas pendientes.

Las órdenes derivan de una comparación guardada y solo avanzan con autoridad humana vigente del sistema existente. Cambios de extensiones sin contrato de parámetros revisable (incluidos shim stack y sustituciones) bloquean la prescripción física; no basta con una aprobación del offset. No se inventan herramientas o pares. Los anexos son copias históricas separadas: incluyen la revisión solicitada y la cabeza actual consultada. Una orden cancelada no revive al citar su revisión anterior.

Las listas consumen páginas por cursor sin truncar silenciosamente a 100 objetos; órdenes y anexos filtran comparación antes de paginar. Los escenarios se mantienen separados de señales originales. El modo local no permite verificar fichas ni aprobar como Crew Chief autenticado. La activación productiva de identidad/autoridad sigue siendo una entrega independiente.

La suite maestra propuesta en el nuevo TSX permanece como requisitos en product-completion-matrix.md: frenos/embrague/ergonomía, visión/geodesia, neurofisiología y optimización requieren datos y validación propios. Sus animaciones y valores de demostración no constituyen integraciones operativas.

## Vistas de trabajo y ciclo de taller — 26 octubre 2026

Dentro de Chassis, «Vista de trabajo» organiza tareas para Piloto, Mecánico, Ingeniero, Analista, Crew Chief y Dirección/observación. «Revisar contexto» vuelve a sesión/circuito/moto/piloto. «Siguiente paso» consulta el estado conocido: también exige asociación vigente de la grabación y revisiones, y resolver borradores de otros formularios. Los cambios no guardados permanecen al ocultar el editor; salir sigue usando la protección existente.

La vista elegida no cambia usuario, equipo o autoridad. Dirección/observador pueden navegar a Chassis y biblioteca, con TelemetryGate y permisos de backend vigentes. Las vistas de lectura muestran la vigencia y bloqueos actuales consultados, y permiten recargar; las acciones de firma/montaje se mantienen fuera de lectura. Diagnósticos de ejecución e historial se despliegan cuando se necesitan.

La aceptación SQL de taller ahora demuestra el ciclo de software con datos controlados, aprobación humana, aplicación y comprobaciones. Recuperar un inicio histórico después de completar conserva la revisión original pero la marca no ejecutable. Ver `chassis-workshop-lifecycle-acceptance-2026-10-26.md`. No demuestra montaje real ni valida fuentes de fabricante.

La prioridad visual por vista usa CSS: el orden completo de teclado de taller sigue siendo una mejora pendiente. No afirmar accesibilidad integral ni producto listo para venta por disponer de estas vistas. Ver aceptación de roles y matriz de cobertura.
# Banco y señales — ampliación local 26-Oct-2026

Dentro de Chassis, «Banco y señales» permite seleccionar la grabación actual o un ensayo privado. «Recargar laboratorio» recupera el catálogo tras una interrupción sin recargar la página. Para pista, identificar canal, ubicación, calibración e intervalo; los valores de cero/escala son entradas del operador y no certifican calibración. El motor conserva tiempos originales y rechaza espectros con huecos/jitter fuera de política.

Para banco: CSV UTF-8, delimitador y decimal explícitos, tiempo/fuerza y desplazamiento o velocidad, unidades y signos, modelo/serie/configuración, fecha, calibración, reloj, sincronización y montaje. Temperatura desconocida permanece desconocida. El trabajo por ciclo requiere desplazamiento, convención y ciclo completo. La fuerza total no equivale a amortiguación hidráulica aislada. No hay conexión a un banco físico ni datos de demostración de fondo.

Los resultados se guardan por ámbito como objetos inmutables. Se pueden consultar curvas, tabla alternativa, calidad, parámetros, huellas y anexos. La selección de un anexo para un snapshot nuevo no altera informes anteriores; los especialistas pueden citar referencias escalares verificadas; los anexos exploratorios mantienen los bloqueos físicos y la aceptación integral sobre datos contrastados sigue pendiente. No sustituye la aprobación del Crew Chief humano ni el contraste del lector 2D.

Aceptación y límites: `docs/chassis-suspension-spectral-acceptance-2026-10-26.md`. No considerar esta ampliación autorización para desplegar cloud, transmitir CAN/ECU ni diagnosticar fallos a partir de un pico espectral.

La aceptación del laboratorio puede repetirse con `npx playwright test --config playwright.suspension.config.ts`: backend vacío en8184 y Vite5174, datos de control retenidos en workspace restringido, sin mezclar mediciones del operador. El snapshot normaliza el anexo decimal antes de su huella y conserva los bloqueos exploratorios.

Compatibilidad de anexos: desplegar juntos backend/gateway con herramientas5.1.2 y registro7.2.2. El acceso autenticado al laboratorio usa inventario exacto de rutas y los mismos roles existentes. Para la aceptación nativa de inferencia: `KDD_QA_SHARED_PYTHON=1`, `KDD_REAL_OLLAMA_SMOKE=1`, `KDD_REAL_OLLAMA_MODEL=qwen3:0.6b`, pytest `tests/test_engineering_integration.py -k suspension`; requiere NumPy/SciPy nativos y PostgreSQL efímero local (el fixture utiliza una imagen Docker ya presente, sin cloud). Los fixtures declaran siempre su carácter sintético.

## Evidencias de dominio — operación local

En Chassis, capturar una medida puntual o importar CSV UTF-8 con columnas, unidades, reloj e intervalo explícitos. Presión requiere referencia absoluta/manométrica y condición. Para propulsión, seleccionar canales de una grabación propia asociada. Guardar deja Aportado; la revisión documental humana separada requiere documento e instrumento coincidente y solo habilita observación. No importar los rangos típicos del catálogo como medidas.

Seleccionar referencias para el próximo snapshot; editar o revisar crea una revisión y puede invalidar propuestas vigentes. Los informes anteriores conservan su evidencia. Cancelar puede necesitar recargar el catálogo si el servidor ya publicó. Físico/neuro guardan referencias de adquisición, sin muestras biométricas ni inferencia.

Compatibilidad de esta ampliación: consumidores01/02/18 coordinados, herramientas6.0, contexto de decisiones1.1, snapshot1.2 e informe1.1. No mezclar consumidores antiguos. La base privada domain-evidence.sqlite se guarda fuera de raw. El contraste2D y la referencia externa del banco siguen pendientes.

## Volver a una entrada pendiente

Si hay cambios sin guardar, «Siguiente paso» vuelve al panel que los contiene antes de pedir importar o revisar otros errores. Conserva las entradas al cambiar de vista. Para el escenario de curva, abre ingeniería y su pestaña; la acción no guarda, descarta ni aprueba el escenario. Cuando termines el borrador, reaparecen los requisitos normales de fuente, comparación y análisis. Al intentar salir sigue siendo necesario conservar o descartar los cambios mediante el diálogo existente.

Las pruebas omitidas de la regresión previa están identificadas: tres requieren PyTorch y otras 17 dependen de muestras o metadatos públicos ausentes. No son una aceptación de esos módulos ni motivo para publicar telemetría restringida. Evidencia: `chassis-workflow-recovery-2026-10-26.md`.

## Integridad de las nuevas importaciones

Las grabaciones se publican completas tras serializar y sincronizar un archivo temporal privado. El almacenamiento debe admitir enlaces duros en el mismo sistema de archivos; sin ese soporte se rechaza con503, sin copiar parcialmente. No se sobrescriben identificadores existentes ni se cambian muestras, relojes o unidades. Importación e inspección2D comparten el límite100MiB y respuesta413. Revisar el almacenamiento y reintentar ante503. Esta corrección no certifica2D ni modifica el guardado de revisiones geométricas. Aceptación: `chassis-recorded-import-integrity-2026-10-26.md`.

Una desconexión detectada tras decodificar y antes de publicar evita guardar la nueva grabación. El SDK no se cancela inmediatamente; conserva timeout120s. Si la conexión se pierde después de ese control, la publicación puede completarse: consultar biblioteca antes de reintentar. Los proxies pueden retrasar la detección. Evidencia: `chassis-import-disconnect-2026-10-26.md`.

El guardado de geometría conserva la cabecera anterior si falla la escritura. Cada revisión se publica completa y la activación usa reemplazo atómico bajo el bloqueo de autoridad vigente. HTTP503 permite revisar almacenamiento y reintentar; una revisión no activada puede quedar retenida para auditoría. No cambia los canales. Evidencia: `chassis-geometry-storage-2026-10-26.md`.


## Perímetro comercial — 2026-10-26

Implementados inventario humano verificable, perfil comercial con autenticación obligatoria, SDK de autenticación limitado, bloqueo de integraciones históricas y proxy HTTPS mínimo. Desarrollo local se conserva. Evidencias y límites en [aceptación del perímetro](chassis-commercial-perimeter-acceptance-2026-10-26.md); configuración en [operación del perímetro](../deploy/chassis-perimeter.md).

Estado de salida: parcial, pendiente de cadena completa con imagen productiva y navegador aislado. Proveedor/RLS cloud, release/storage/CI/backups (1B), contraste externo2D y referencia de banco permanecen abiertos. No se ha desplegado ni declarado disponibilidad general.


Paquete comercial (continuación1A): build real comprobado sin URLs operativas históricas, ajustes de desarrollo ni previews estáticas heredadas; variables públicas limitadas expresamente y scratch excluido de Docker. Build de desarrollo preservado. La aceptación completa de imágenes, navegador y proveedor sigue pendiente; esto cierra el gate de empaquetado, no el de despliegue.
