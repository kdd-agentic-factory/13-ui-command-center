# Primer cierre comercial: perímetro de Chassis

Estado: diseño aprobado por el usuario; plan en preparación. Fecha2026-10-26. El usuario ha elegido «Chassis primero; cierre progresivo». Continúa el orden del informe externo `C:/Users/usuario/security-audit-skill/kdd-agentic-factory/run-2/REPORT.md`. No sustituye las capacidades existentes ni autoriza desplegar cloud.

## Intención

Preparar una superficie de entrega comercial concreta de Chassis, que conserve el producto y sus integraciones históricas sin exponerlas por defecto como servicios públicos confiables. Reutilizar identidad/membresía verificadas del backend18 y grants internos de ingeniería, sin convertir claves del proxy o selección de perfil en identidad humana.

Este bloque es1A, perímetro y perfil de entrega. El siguiente1B resolverá build coordinado17→18, imagen/puertos, persistencia/réplicas, gates de CI, escaneo y backups; no se declaran cerrados aquí. La aplicación local de desarrollo sigue utilizable. El diseño no es una auditoría de seguridad completa ni autorización de disponibilidad general.

## Enfoques considerados y decisión

1. **Chassis primero, cierre progresivo — elegido por el usuario.** API pública mínima del producto, autenticación y web; servicios históricos conservados fuera del perfil público hasta su aceptación. Reduce superficie y permite demostrar límites con pruebas concretas.
2. **Asegurar todas las rutas históricas en la primera entrega.** Mantiene exposición amplia pero obliga a coordinar las autoridades paralelas de01/02/04/15/24 y sus modelos de datos. Descartado para este primer bloque; no se elimina su backlog.

## Base actual comprobada

-13 `default.conf.template` publica proxies a numerosos servicios e introduce claves/identidades estáticas. MCP recibe viewer; copilot race_engineer/propose. La plantilla no prueba el control de acceso del ingress real.
-13 Dockerfile incorpora URLs directas históricas por defecto y habilita preview Race Command. Vite local solo proxifica `/api/telemetry` a loopback.
-13 `telemetryIdentity.ts` envía Authorization Bearer y X-Team-ID; TeamContext consulta `/api/v1/identity/mode`, equipos y pertenencia. El backend es autoridad del equipo: el header es solo un selector.
-18 `identity/dependencies.py` verifica humano/membresías y deniega rutas fuera de inventario en modo autenticado. Los canales internos de ingeniería tienen clave/grant/capability, principal fijo y exclusión de credenciales humanas. Producción prohíbe identidad local.
-Las rutas y tablas legacy de InsForge no quedan protegidas por cerrar un proxy: clientes/proveedores directos y RLS desplegada son un gate distinto. Nada de esta entrega acredita migraciones cloud aplicadas.

## Contrato de exposición

### Públicos sin autoridad operativa

Web comercial, assets, navegación/login y liveness del servidor UI. La liveness se nombra como tal y no certifica datos, IA o backend. El endpoint de modo de identidad puede consultarse antes del login. El SDK de autenticación mantiene su issuer HTTPS configurado y clave pública; nunca se incorpora service-role ni credencial interna al bundle.

No se publican proxies genéricos `/api/database`, `/api/storage`, `/api/ai` o `/api/functions` para abrir capacidades históricas. Si un flujo vigente de Chassis necesita un endpoint concreto de proveedor, el inventario debe identificar método/recurso y comprobar su política antes de autorizarlo. No se inventa éxito del formulario comercial ni persistencia para ocultar un endpoint cerrado. Los accesos directos existentes del SDK se inventarían en aceptación y quedan sujetos al gate RLS cloud.

### API humana de Chassis

Las llamadas operativas del navegador utilizan `/api/telemetry/api/v1/...` por el mismo origen. Se inventarían métodos/rutas del flujo actual: modo de identidad, equipos, grabaciones/canales/medidas, Chassis/setups/calibración/laboratorio/dominios/taller y sesiones/análisis/propuestas/decisiones/informes de ingeniería. Solo ese conjunto queda permitido por el perfil BFF; otras rutas de dataset/exportación o APIs históricas se rechazan antes de proxy.

La allowlist se verifica contra el inventario real de rutas/backend y los consumidores frontend, sin asumir que un prefijo engineering completo sea público. Las rutas internas de ingeniería se deniegan siempre en el BFF, incluyendo variantes de ruta normalizadas o codificadas. Salud/identidad no deben convertirse en bypass a otro endpoint.

Se conserva el token humano Authorization y el selector X-Team-ID;18 vuelve a verificar ambos. No se inventan usuarios ni roles. Cabeceras internas aportadas por el navegador se rechazan o eliminan mediante una política explícita y comprobada: X-Internal-API-Key, X-Principal-ID/Role, X-Execution-Grant y X-Coordinator-Capability. Una credencial técnica dedicada del proxy, si el backend la requiere, es distinta de identidad humana, se configura solo en servidor y no habilita rutas internas. No se reusa la clave global como identidad de cliente.

### Canales internos e integraciones históricas

Backend/gateway/workers continúan usando los canales ya autenticados y acotados. No pasan por el proxy humano público. Las integraciones históricas conservan código y contexto, pero sus proxies y previews no se habilitan por defecto en el perfil comercial. El desarrollo loopback conserva su recorrido explícito; no se ofrece un interruptor remoto que convierta el servidor comercial en gateway legacy abierto.

## Perfil de entrega y fallos seguros

Se añade un contrato explícito para distinguir entrega comercial Chassis de desarrollo local. El constructor puede concretar los nombres de variables, pero habrá un único significado consistente entre build, servidor, UI y backend.

- El build comercial usa same-origin para telemetría; no hereda defaults hardcoded de servicios Fly históricos ni activa previews.
- El cliente comercial solo entra en operación si el backend declara modo authenticated y existe identidad/equipo verificados. Modo local, respuesta desconocida, fallo de consulta o cambio de ámbito bloquean acciones; no existe fallback a local.
- El perfil backend comercial rechaza configuración local/incompleta independientemente de un alias genérico de entorno; se prueban precedencia de variables prefijadas y valores desconocidos. No se aplica un cambio de emisor ni de SDK.
- El servidor comercial requiere un upstream explícito validado; no adivina un host cloud. No admite credenciales en URL o URL elegida por la petición. Los secretos no se imprimen ni se incluyen en estáticos. El método para parametrizar TLS/Host/URI debe ser válido para nginx real, sin depender de simulaciones textuales.
- Los errores de identidad/servicio se muestran como bloqueos recuperables, sin datos prefijados ni estados de éxito.
- Se mantiene el límite100MiB de contenido del importador, acordando el margen de transporte multipart sin abrir uploads ilimitados; timeouts de proxy coherentes con lectura nativa acotada y llamadas existentes.

No se modifica el login real, las autorizaciones por rol de18, la autoridad humana titular/suplente, los modelos físicos ni la lecturaAiM/2D. No se añaden pagos, federation ni nuevos sensores.

## Compatibilidad y conservación

Conservar cambios previos de todos los repositorios; baseline/manifest propios sin commits ni limpieza de checkout. Los datos raw, catálogos del operador y secretos son intocables. No sembrar fixtures en el catálogo principal. Se separan las aceptaciones compiladas de perfil comercial y desarrollo local: una prueba que usa backend local debe declararlo y no certificar el perfil comercial.

El selector de vista no concede permisos. La landing puede seguir accesible cuando el backend no opera, pero no se presenta la aplicación como autenticada por poder descargar su HTML. La captación/contacto debe conservar un estado real, aunque una integración pendiente aparezca no disponible.

## Criterios de aceptación del bloque1A

1. Un inventario legible y versionado clasifica cada ruta del BFF: pública, humana deChassis, interna denegada o histórica fuera de entrega. Ninguna nueva ruta operativa se incorpora sin aceptación explícita del inventario.
2. Perfil comercial con visitante anónimo: web/login disponibles, datos y mutaciones privados denegados; token inválido o equipo ajeno no obtiene objetos.
3. Dos equipos de control y rolesreader/engineer/admin: rutas permitidas conservan permisos backend; cambio de equipo/sesión descarta respuestas anteriores. Titular/suplente siguen siendo la única decisión humana aplicable.
4. Rutas internas y legacy quedan denegadas desde BFF, también con cabeceras falsas, barras repetidas y rutas codificadas relevantes para nginx/ASGI. No se afirma cerrar un proveedor directo sin validar su RLS.
5. El perfil comercial no arranca/entra en operación con identidad local, upstream implícito o configuración incoherente; desarrollo explícito sigue funcionando.
6. Artefacto compilado sin secreto ni URLs operativas históricas impuestas por defecto. No se exige borrar información histórica de documentación o demos, solo impedir exposición operativa accidental.
7. Configuración nginx real se renderiza y valida en un banco aislado con upstreams de control y sin llamadas cloud. Se registran pruebas de proxy/headers/rutas/errores. Una inspección de texto no sustituye esa aceptación.
8. Pruebas de contrato, identidad, permisos y regresiones frontend afectadas; revisión independiente del delta. Las pruebas completas previas se citan como históricas y no como pruebas nuevas.
9. Informe de aceptación distingue gates1A cerrados de1B/cloud/metrología pendientes. Si el runtime nginx o el aislamiento necesario faltan, se declara esa aceptación bloqueada y se conserva el paquete preparado; no se instala o despliega silenciosamente para ponerlo verde.

## Decisiones de implementación delegadas al constructor

Organización de archivos y nombres de variables; forma de generar/validar allowlist sin duplicar a ciegas reglas backend; estructura de harness nginx y fixtures de dos equipos; mensajes recuperables y adaptaciones mínimas de pruebas. Elegir opción que preserve contratos actuales y deje la política revisable. No se autoriza ampliar alcance a otra autoridad, issuer, integración externa o exposición legacy.

## No incluido ni autorizado

Despliegue público, modificación de ingress/proveedor real, aplicación de migraciones cloud, alta de usuarios reales, cambios de claves/firewall, instalaciones/licencias, commits/push ni cambios físicos. La corrección fail-open del orquestador y las autoridades legacy quedan para su bloque si no están expuestas por la entrega Chassis. La federación y la validación2D siguen en el registro original.

## Revisión de constructor

Revisor independiente: no quedan preguntas importantes que requieran decisión del usuario antes de planificar. Se incorporan estas concreciones de implementación:

- Inventariar llamadas directas del SDK además de proxies. En el perfil comercial quedan inactivas las operaciones no autenticadoras cuya política no esté acreditada; no se considera seguro un acceso por esquivar el BFF. La información necesaria del flujo Chassis utiliza18. Los usos históricos conservan su código en desarrollo explícito.
- La captación comercial puede usar un endpoint público dedicado configurado explícitamente; no habilita funciones genéricas ni acceso a datos operativos. Sin configuración/aceptación disponible, se muestra estado no disponible o contacto real, nunca registro exitoso ficticio.
- Modo de identidad es prelogin; equipos exige identidad humana; rutas internas siempre fuera de allowlist pública.
- El harness nginx se prepara con controles locales y declara cualquier imposibilidad de ejecución aislada. No se instala ni se prueba contra proveedores para suplirla.

Estado: revisado por constructor y aprobado por el usuario el2026-10-26. No se ha implementado código de producto ni cambiado el servicio local.
