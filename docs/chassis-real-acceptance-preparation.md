# Preparación revisable de aceptación real

Este comando prepara un contrato de revisión; no es un lanzador y no acredita aceptación:

    python tests/delivery/prepare_real_acceptance.py <configuración-privada.json>

La configuración vive fuera de cualquier checkout Git. Contiene exclusivamente:
- version: "1".
- project_id: "23afcca6-10d0-4bae-83d0-9999f4717a81" e identity_url: "https://czdpamk9.eu-central.insforge.app".
- private_root: directorio privado absoluto; files: rutas absolutas enumeradas en la tabla.
- images: IDs locales sha256 de api, gateway, worker, frontend y qa, sin etiquetas mutables.
- model: nombre qwen3:0.6b, digest verificado y URL local explícita (127.0.0.1 o host.docker.internal, puerto 11434).
- teams: exactamente dos objetos con team_id y members; chief, substitute, engineer y reader son UUID distintos de cuentas de ensayo.

## Lista de archivos y consumidores

| Archivo lógico | Consumidores |
|---|---|
| accounts | qa |
| api_cert, api_key, identity_ca, probe_key, authority_key | api |
| backend_key, signing_key | api, gateway |
| control_key | api, gateway, worker |
| gateway_key | gateway, worker |
| api_ca | gateway, frontend, qa |

Todos los montajes de credenciales son individuales y de solo lectura. accounts queda en /qa-private/accounts.json. El frontend solo recibe el certificado público; no recibe contraseñas, claves administrativas ni claves internas. Los workers y el contenedor QA no montan SQLite ni grabaciones.

La preparación solo consulta metadatos de archivos: rechaza enlaces, hardlinks, rutas fuera del directorio privado, ubicaciones Git, alias de credenciales privadas y permisos POSIX abiertos. No descubre variables *_FILE, no lee ni copia valores de credenciales, no cambia ACL/permisos y no inicia procesos, Docker o peticiones cloud. El CLI lee únicamente el JSON de configuración. La salida usa source_ref por nombre, omite rutas del host y no se puede ejecutar como Compose.

## Qué queda por revisar antes de ejecutar

La revisión del código no anula el rechazo automático anterior ni autoriza despliegue. El contrato siempre devuelve prepared_not_executed, acceptance_status=blocked, execution_authorized=false y publishable=false.

Hace falta verificar en el contenedor real: propiedad/permisos con UID1000 (UID101 para frontend), ausencia de cambios entre preparación y montaje, ACL de Windows, compatibilidad de TLS/SAN y CA, ID/contenido/procedencia de cada imagen y digest del modelo. No se resuelve incompatibilidad de UID copiando secretos, ejecutando como root o abriendo permisos existentes.

La red de ensayo necesitará acceso explícito al proveedor designado y al nodo local; host_network=false y sin puertos del host no constituyen por sí solos un control de egress. Deben revisarse DNS, egress y origen del navegador antes de la ejecución.

El futuro ejecutor debe usar solo las ocho cuentas declaradas, comprobar su pertenencia real antes de escribir, crear entidades sintéticas mediante APIs públicas, aprobar con el titular humano y el suplente designados y probar denegaciones. No puede reutilizar el seeder aislado que escribe directamente en el volumen del backend. Debe conservar los IDs de recursos propios para limpieza acotada y redactar resultados; el contrato no implementa aún ese ejecutor.

AiM/2D, precisión física y revocación de la clave histórica mantienen sus controles independientes. Nunca promover esta preparación ni las pruebas sintéticas como validación de telemetría o autorización comercial.
