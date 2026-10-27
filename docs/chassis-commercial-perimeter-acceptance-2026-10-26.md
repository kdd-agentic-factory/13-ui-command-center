# Aceptación del perímetro comercial de Chassis — 2026-10-26

Estado: implementación del perímetro preparada; salida a producción bloqueada por aceptación completa pendiente. No se ha desplegado, reiniciado el stack principal, aplicado migraciones ni modificado credenciales o datos originales. Se conserva desarrollo local y el trabajo previo del checkout.

## Entregas

| Plan | Resultado |
|---|---|
|1 Inventario humano|Implementado: exportación canónica con huella, detección de deriva y roles existentes conservados.|
|2 Cliente comercial|Implementado: autenticación obligatoria, fachada de autenticación del SDK, bloqueo de proveedores y llamadas históricas, vistas de ajustes y previews restringidas.|
|3 Backend|Implementado: Chassis exige entorno production, modo authenticated y proveedor HTTPS fijo.|
|4 Proxy|Implementado: allowlist por método/ruta, cabeceras internas rechazadas, API key dedicada, TLS verificado y límites finitos.|
|5 Aceptación aislada|Parcial:32controles HTTP reales con nginx y upstream TLS sintético. Cadena con backend productivo, autoridad completa y navegador aislado pendiente.|
|6 Revisión/evidencia|Revisión independiente realizada y cinco hallazgos importantes corregidos con regresiones. Hashes y evidencia conservados. No equivale a aceptación productiva.|

## Revisión final y correcciones

1. Carrera con token en memoria: fijar equipo previsto y comprobar generación inmediatamente antes de enviar. Un cambio A→B impide despachar la mutación de A.
2. Cambio de modo o caída del backend: verificar modo sin caché antes de operaciones y al comprobar acceso; revocar selección y bloquear interfaz cuando falla. Se añade una petición de identidad por operación, limitada a12s.
3. Escape SDK: sustituir proxy de exclusión por fachada explícita de métodos públicos de autenticación. No se exponen getHttpClient, transportes privados, emails, payments ni futuros servicios. Desarrollo conserva el SDK original.
4. Decisiones históricas: no sincronizar ni aprobar/persistir decisiones del orquestador antiguo en perfil comercial. El flujo de Chief y aprobación humana de Chassis conserva sus servicios dedicados.
5. Probes/previews históricos: bloquear ejecución automática y manual, incluso fuera de Docker. Ajustes comerciales muestran designación humana y omiten estados históricos prefijados.

Hallazgo menor corregido: falta de Docker, imágenes o herramientas se registra como blocked, separado de una aserción ejecutada que falla. Control negativo de runtime y deriva del inventario verificados.

## Evidencia

Logs y manifiestos en `.superpowers/sdd/2026-10-26-chassis-commercial-perimeter/` de13. RED→GREEN: final-review, final-mode y settings. Backend global:926passed,20skipped,2warnings; no atribuir los skips a cobertura ejecutada. Cliente global:107archivos y487tests pasan; fachada de autenticación revalidada con7tests. Typecheck y builds comercial/local pasan por separado. Inventario export/check y mapa nginx check pasan.

El harness ejecuta imágenes cacheadas con red none/namespace compartido, no root, filesystem de solo lectura, sin capacidades y con límites CPU/RAM/PIDs/scratch/log. Certificados y usuarios de control son sintéticos; no representan datos del cliente. Control nginx:1.29-alpine, sha256:5616878291a2eed594aee8db4dade5878cf7edcb475e59193904b198d9b830de. La imagen1.27.3 del Dockerfile no se ha validado como release.

No distribuir los directorios proxy-fixture: contienen claves TLS sintéticas. El artefacto comercial final se conserva por separado y utiliza identidad.fixture.example/public-fixture-key, valores de control públicos sin acceso operativo. No es un artefacto configurado para desplegar.

## Gates abiertos y siguiente bloque

- 1B: imagen coordinada frontend/backend con dependencias, storage, secretos, health/readiness, CI, restauración y copias de seguridad verificadas. Ejecutar aceptación completa por nginx con dos equipos, roles y navegador aislado.
- Separación de ajustes, URLs operativas históricas y previews estáticas del artefacto comprobada en continuación del bloque1A. La CSP y la validación de la imagen productiva siguen pendientes de1B.
- Proveedor, membresías y RLS cloud no contrastados en un despliegue real; no se han tocado.
- Contraste metrológico de2D sin exportación independiente/Analyzer y referencia externa de banco de suspensión continúan pendientes.

Rulings: trabajo in-place preservado por autorización previa; sin commits/limpieza; envsh se usa para que el puerto validado se exporte antes de envsubst; falta de runtime no se sustituye por ejecución sin aislamiento. Las baselines comparan este delta, no autorizan restaurar archivos completos sobre cambios previos. [Configuración y reversión preparada](../deploy/chassis-perimeter.md).


## Continuación: cierre del paquete comercial

Regresión RED→GREEN con build real: se ignoran variables históricas de dotenv, se compila una entrada de ajustes comercial independiente y se excluyen previews/configuración pública históricas. Autenticación pública y documentos de referencia conservados. El build local conserva el código y activos de desarrollo. Se excluye .superpowers del contexto Docker para no copiar material de control. No se descargan imágenes ni dependencias. Las evidencias de esta continuación usan nombres continuation y nuevos directorios artifact-check; los manifiestos anteriores conservan su valor histórico.

Verificación de la continuación:108archivos y489tests pasan; typecheck y build local pasan. El build comercial se ejecuta como parte del test de artefacto y pasa con destino histórico de control excluido. La vista comercial se prueba también importando su módulo real. Los controles negativos rechazan secretos de servicio y telemetría cross-origin antes del build. No se repite ni se atribuye como nueva la suite de926tests del backend, que no cambia en esta continuación. Resultado y rutas exactas del artefacto: continuation-acceptance.json; huellas de fuentes y artefacto en continuation-source-manifest.json y continuation-artifact-manifest.json. Revisión de esta continuación por el implementador; la revisión independiente citada arriba corresponde al delta previo.


## Contexto real de Docker — corrección adicional

Detectado y reproducido con Docker: la exclusión general **/*.md eliminaba el manual requerido por el build comercial. Se conserva esa exclusión y se permite exclusivamente public/kdd-application-manual.md. Control tests/perimeter/Dockerfile.context: FROM scratch, solo COPY, sin descarga de imágenes, instalación ni ejecución del producto. Build RED por manual ausente → GREEN con7archivos copiados y cotejados byte a byte. Un segundo control rechaza un archivo sintético bajo .superpowers. Evidencia: docker-context-red.log, docker-context-green.log, docker-context-denied.log y docker-context-acceptance.json en el workspace del plan.

Esto valida la disponibilidad de los recursos de build, no la imagen completa, sus dependencias, el backend ni la cadena de autenticación productiva. No se modifica CI remoto ni se despliega.
