# Entrega comercial1B: instancia escritora única y recuperación probada

Estado: revisado por constructor y aprobado por el usuario el2026-10-27; plan preparado para revisión. Continúa el perímetro1A aprobado y conserva sus restricciones. El usuario ha elegido primera entrega con una instancia escritora, volumen persistente y restauración probada. Arquitectura previamente elegida: servicio central con nodos locales; no se diseña aquí una instalación por equipo ni una federación nueva.

## Intención y alcance

Convertir el paquete Chassis en una entrega operable y recuperable, sin reemplazar física, ingestión, identidad, roles ni aprobación humana. Se coordina13(frontend),17(motor físico empaquetado) y18(API/datos). No se declara venta general por pasar tests unitarios: hacen falta imagen real, aislamiento entre equipos y recuperación comprobada.

Objetivos: build coordinado verificable; procesos y archivos persistentes explícitos; un solo escritor sobre el estado; salud diferenciada de disponibilidad; copia/restauración coherente; aceptación de dos equipos a través del proxy. Evitar imágenes que incluyan datos del operador, secretos, catálogos privados o material de pruebas.

Fuera: migración a PostgreSQL del estado de negocio, réplicas activas, despliegue público, migraciones cloud, cambios de usuarios/credenciales reales, instalación en el host, adquisición de sensores y certificación2D/banco. La autoridad y las membresías InsForge siguen externas; restaurar archivos locales no revierte decisiones cloud. No se sustituyen por una autoridad ficticia en producto.

## Enfoques

1. Instancia escritora única con volumen y restauración probada: elegido por el usuario. Conserva el almacenamiento vigente y reduce riesgo de migración; el coste es indisponibilidad breve durante mantenimiento y ausencia de alta disponibilidad.
2. Migrar primero todo el estado a PostgreSQL para varias réplicas: aplazado. Cambiaría contratos transaccionales, archivos de grabación y coordinación; no basta con rellenar DATABASE_URL.
3. Conservar el compose de desarrollo como producción: descartado; no acredita persistencia, readiness ni aislamiento y contiene valores propios de desarrollo.

## Situación comprobada

18 usa SQLite para Chassis/ingeniería, laboratorio y evidencias de dominio, además de archivos de grabaciones. Varias rutas se resuelven con variables de entorno fuera de Settings; deben unificarse para que app factory y entrega utilicen el mismo estado. DATABASE_URL exigida por configuración no implica que esos objetos estén en PostgreSQL.

/health devuelve vida del proceso. No comprueba que se pueda escribir estado, utilizar la autoridad ni ejecutar IA. Docker18 empaqueta17 mediante contexto adicional y usa dependencias abiertas; el CI18 no pasa explícitamente ese contexto, sin haberse inspeccionado aún el comportamiento del reusable. Docker18 copia catalog y no tiene .dockerignore. Ningún contenido de catálogo del operador se ha inspeccionado para este diseño.

13 ya tiene perfil comercial, fachada auth-only, inventario de rutas humano y HTTPS obligatorio hacia API; el control previo nginx1.29 no acredita la imagen1.27.3 del Dockerfile. El contexto real de Docker se probó con scratch y7archivos, corrigiendo la exclusión del manual; eso no ejecuta el producto.

## Entrega coordinada

Preparar una definición comercial independiente del compose de desarrollo. Solo el frontend/proxy expone el puerto de entrada; API, workers y dependencias no se publican como APIs humanas alternativas. Un proceso API, un worker de coordinación y volumen local compartido de forma compatible con las transacciones existentes. No levantar segundas réplicas escritoras. El conjunto API/worker es una instalación: la exclusión de segunda instalación no debe bloquear los accesos legítimos del worker de la misma instalación.

El constructor concretará la unidad de ejecución de API/worker leyendo sus entrypoints antes del plan; no se presupone que un segundo proceso HTTP sea necesario. El bloqueo de instalación debe ser de sistema operativo, liberarse tras fallo de proceso y estar compartido por mantenimiento. No usar solo PID, variable replicas:1 o archivo centinela persistente. No se autoriza compartir SQLite en NFS/SMB entre hosts; el nodo central usa almacenamiento local persistente. Los nodos futuros se integran mediante contratos, no montando estos SQLite.

El motor17 se instala como paquete de la versión exacta de fuente incluida en la release; se comprueba la importación y una operación física conocida dentro de18. La imagen comercial incluye solo código, esquemas y referencias públicas aceptadas. Los catálogos y grabaciones del operador se montan fuera de la imagen. Inspeccionar la clasificación antes de tocar datos conforme AGENTS18. No mover datos actuales para fabricar una aceptación.

Preparar lock de dependencias de runtime Linux/Python3.12 y metadatos de versión/huellas de las tres fuentes, plataformas e imágenes. Resolver versiones y hashes contra artefactos existentes o durante una fase de construcción autorizada; no inventar hashes desde el venv Windows. Evitar instalar Torch o funciones históricas por defecto si no son necesarias para Chassis, verificando imports antes de excluirlas. El constructor concreta división mínima de extras sin cambiar funcionalidades de desarrollo.

La conexión proxy→API conserva HTTPS verificado. El constructor preparará soporte TLS explícito en el servidor API o un terminador privado si la inspección de entrypoints lo exige; la opción recomendada es TLS en la API para evitar un servicio adicional. Certificados y claves son montajes readonly y destinos fijos. No rebajar nginx a HTTP para superar la prueba. Se conserva la validación estricta existente de claves, propietarios y permisos; no modificar ACL de secretos reales.

Sin descargas ni instalaciones en esta fase de diseño. El plan distinguirá preparación offline de construcción real: si no existen runtime/dependencias autorizados, la aceptación queda blocked. No se cambia una imagen por otra cacheada para afirmar que pasó la release. Cualquier descarga necesaria deberá quedar expuesta y autorizada en el plan posterior; nunca en el host como sustituto silencioso.

## Contrato de estado persistente

Definir un único directorio raíz absoluto comercial y un inventario cerrado de stores: grabaciones/metadatos, Chassis/ingeniería/runs/taller, suspensión y evidencias de dominio. Incluir cualquier otro store descubierto al planificar, o bloquear por falta de clasificación. Las rutas heredadas solo se conservan en desarrollo. En comercial se rechazan rutas fuera del volumen, alias incoherentes y symlinks que escapen; no corregir silenciosamente variables conflictivas.

Certificados, credenciales y claves de firma/control son montajes separados. Declarar su restauración/provisión como requisito externo sin copiarlos en el backup de datos. Ningún SQLite debe quedar por accidente en la capa efímera /app. Prueba de reinicio conserva sesiones, revisiones, evidencias y designaciones consultables por sus propietarios; otro equipo continúa sin acceso.

La exclusión de segunda instalación cubre toda la vida del servicio y se comprueba con dos procesos. El mantenimiento obtiene la misma exclusión antes de copiar o restaurar. El sistema no promete operación multi-host o réplicas activas.

## Salud y disponibilidad

/health continúa siendo liveness, sin declarar dependencias operativas. Añadir readiness interna, fuera de la allowlist humana1A, con diagnóstico acotado sin secretos, rutas privadas ni datos de usuarios. Diferenciar núcleo disponible y capacidades IA/ingestión/autoridad no disponibles. Un health200 no acredita que se pueda importar, analizar o aprobar.

El núcleo verifica configuración comercial autenticada, propiedad del volumen y stores accesibles. La comprobación de escritura utiliza un recurso privado de control, no catálogos ni raw; evita migraciones y escrituras de negocio al consultar salud. Probes de proveedor/modelo tienen timeout y no ejecutan inferencias ni decisiones, ni crean usuarios. Una clave configurada no se considera evidencia de autoridad remota válida. Si no hay probe remoto verificable, mostrar estado no comprobado y bloquear la capacidad que lo necesita.

El arranque falla ante perfil local, rutas incoherentes, estado no escribible o segunda instalación. Caída de IA/autoridad se refleja por capacidad; no se falsifica un análisis o una aprobación para mantener verde. El frontend mantiene sus bloqueos1A y la decisión física pertenece al titular/suplente humano.

## Copia y restauración

Primera versión: copia en frío, con la instalación detenida y exclusión de mantenimiento adquirida; el comando no mata procesos ni detiene producción automáticamente. Si la instalación está activa o no puede probar exclusión, aborta. Esto evita prometer consistencia entre varios SQLite y archivos durante escrituras concurrentes.

Copiar solo stores inventariados a un destino nuevo privado fuera del directorio activo, con límites y validación de rutas. Usar backup SQLite y comprobar integridad; incluir grabaciones y revisiones completas, manifiesto versionado, hashes, versión del esquema/release y resultado de comprobación. Publicar el backup solo al terminar; un fallo no deja un backup aparentemente válido. No seguir symlinks ni exportar raw, secretos o catálogos fuera de clasificación. El backup es privado y no se publica como evidencia.

Restaurar únicamente a un directorio nuevo y vacío fuera del estado actual, bajo exclusión, después de verificar manifiesto, hashes, compatibilidad e integridad. No sobrescribir datos del operador ni aplicar downgrade silencioso. Los backups con paths absolutos, traversal, enlaces, ficheros ajenos o versión incompatible se rechazan. El comando no cambia el volumen activo: el cambio operativo requiere el procedimiento de release aprobado.

Los runs y leases no terminales restaurados se invalidan/interrumpen antes de permitir operar; no se reanudan inferencias ni decisiones por haber copiado sus archivos. Se exige identidad/membresía actual y una nueva decisión humana cuando corresponda. No reemitir decisiones a la autoridad cloud ni reutilizar permisos en vuelo. Mantener resultados terminales e historial sin convertirlos en acciones nuevas.

Entregar procedimiento de recuperación y registro de tiempos medidos con fixtures. No inventar RPO/RTO o retención comercial: serán condiciones medidas y acordadas antes de desplegar. Esta entrega prepara backup verificable y su programación, pero no crea tareas reales ni borra backups por retención.

## CI y aceptación

Separar tests de código, build de imágenes, escaneo y aceptación completa. Preparar gates que no publiquen ni desplieguen automáticamente esta entrega por aprobar unit tests. Verificar build17→18, frontend comercial y desarrollo, contenido del contexto, dependencias de runtime, permisos y puertos de las imágenes. Escaneos con informes propios; no declarar vulnerabilidades ausentes sin ejecutar un scanner disponible.

Banco aislado sin acceso al proveedor o datos reales: proxy e imágenes de producto reales; identidad, membresías y autoridad de control inequívocamente sintéticas. Dos equipos y reader/engineer/admin; demostrar aislamiento, límites del Chief humano, fallo cerrado y no acceso a rutas internas por el proxy. El navegador requiere aislamiento de OS/red; un mock de fetch no sustituye HTTP real ni cuenta como acceptance del proveedor.

Fixture de recuperación con sesiones, setups, evidencias y run en curso: backup, restauración nueva, arranque, validación de propiedad/hashes y run interrumpido. Rechazar copia activa, dos instalaciones y backup alterado. Reinicio y volumen de solo lectura se prueban por separado. No inyectar fixtures en el catálogo principal.

Aceptación final separa: código/tests; imágenes exactas y TLS; persistencia/exclusión; recuperación; navegador/roles; proveedor/RLS real; validación2D/banco. Lo no ejecutado queda pendiente o blocked con motivo. No se habilita venta general ni despliegue por completar los controles sintéticos.

## Conservación y decisiones delegadas

Preservar checkouts y evidencia previa sin commits, limpieza ni modificación de raw. Se crearán baseline y ledger del nuevo plan, sin reutilizar como scratch el workspace1A. No aplicar migraciones cloud, cambiar secretos, parar servicios del operador ni ejecutar rollback real.

Decisiones del constructor: nombres y organización de contratos/scripts; primitivas de lock multiplataforma; estructura del compose comercial y pruebas; formato de manifiesto versionado; valores técnicos de timeout/límites respaldados por pruebas. Antes del plan deberá fijar inventario completo de stores y coordinación API/worker. No se deja al constructor decidir si migrar el almacenamiento a PostgreSQL, abrir rutas históricas, sustituir autoridad o desplegar: esas alternativas no están autorizadas.


## Revisión de constructor

Revisión independiente single_writer_delivery_builder_check: «Nothing important left». Inventario final de stores y entrypoints se resuelve en la inspección requerida previa al plan; no quedan decisiones importantes del usuario pendientes además de aprobar este documento. Decisiones propuestas por el constructor, no atribuidas al usuario: copia en frío con exclusión, restauración a destino nuevo, readiness interna por capacidades y TLS recomendado en la API. No se ha implementado este bloque ni modificado el entorno operativo.
