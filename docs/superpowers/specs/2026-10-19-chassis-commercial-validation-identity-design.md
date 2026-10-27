# Validación 2D, IA local e identidad de equipos

Fecha: 2026-10-19. Estado: aprobada por el usuario el 2026-10-19. Continúa el plan progresivo anterior; no presupone validación comercial ya conseguida.

## Objetivo y evidencia actual

El usuario solicita contrastar 2D, activar IA local y completar autenticación/aislamiento. El flujo debe permitir trabajar a miembros autorizados de un equipo sin acceso a datos de otro. El login InsForge existe en13, pero18 protege por API key y actor declarado, sin identidad de equipo. Los dos ZIP ASPAR carecen de CSV/ASC/TSV de referencia. No se ha localizado runtime/modelo Ollama; equipo Windows con32GB RAM y gráfica integrada. No alterar raw ni enviar telemetría a servicios externos.

## Decisión de arquitectura

Reutilizar identidad InsForge; pertenencia y rol de equipo verificados por servidor. Alternativas descartadas: crear otro sistema de contraseñas duplica identidad; confiar en X-Team-ID/X-Actor-ID o roles de navegador deja una frontera falsificable. InsForge se usa para identidad y membresías; la telemetría y la inferencia permanecen locales. No subir raw al proveedor de identidad.

## Contraste 2D

Localizar Analyzer/AutoAna y exportaciones preexistentes mediante inventario acotado. Comparar exactamente la misma medición y canales Susp_F/Susp_R y, si existen, RPM y velocidad con salida del fabricante. Registrar hashes, variante, unidades, escala/signo, frecuencia, origen temporal, transformación de exportación y errores máximos. No ajustar desfases ni remuestrear silenciosamente. Tolerancias deben derivarse de la resolución del canal/exportación; un umbral arbitrario no certifica exactitud. Cada variante conserva validación independiente. Si faltan licencia/software/exportación, entregar comparador y evidencia de bloqueo; el lector nativo continúa experimental, sin recomendaciones mecánicas. La exportación oficial permite interpolación: debe desactivarse para contraste de muestras o declararse y limitar qué se puede validar.

## IA local

Instalar runtime oficial de Ollama y un modelo de pesos descargables compatible con uso comercial y RAM disponible. Empezar por familia pequeña de3–4B, fijar modelo/digest y registrar licencia/tamaño antes de descarga. Ejecutar exclusivamente en loopback con OLLAMA_NO_CLOUD=1; sin reglas de firewall ni exposición de red. Separar comprobación/carga inicial del límite de generación. Mantener límite de contexto/salida, timeout y fallback; medir latencia real CPU antes de afirmar operación adecuada. Comprobar respuestas reales, no solo mocks. El modelo solo prioriza hallazgos conocidos y pruebas permitidas; no inventa números ni recomendaciones de ajustes. Solo recibe agregados sin muestras, GPS ni identidades.

## Autenticación y equipos

Validar token de identidad en servidor mediante contrato oficial del emisor (firma/introspección según soporte verificado), expiración, sujeto y emisor/audiencia aplicables. No reutilizar verificadores históricos que aceptan identidad mediante cabeceras o fallback system. Resolver membresías activas y roles desde fuente autorizada del servidor. Seleccionar equipo activo solo si hay membresía; selección no concede acceso.

Identidad interna: sujeto, equipo, rol y contexto de auditoría. Actor de auditoría deriva del sujeto autenticado. Roles mínimos: lector consulta; ingeniero importa y guarda; administrador gestiona membresías mediante operación autorizada. Nadie se autoasigna administrador ni puede elegir otro sujeto mediante headers. Revocaciones y sesión caducada dejan de autorizar operaciones.

Aplicar el ámbito de equipo en TODAS las rutas que exponen datos restringidos de este servicio: catálogo/sesiones históricas, importaciones, inspecciones, canales completos/previews, geometría, setups, bindings, comparaciones, estado, exportaciones y almacenamiento. Rutas legacy sin modelo de propiedad se bloquean en modo autenticado hasta incorporar autorización; la API key interna no sustituye usuario/equipo. Health/version pueden quedar públicos sin contenido restringido.

Persistir propiedad de equipo y creador en sesiones, revisiones y resultados; consultas y escrituras filtran equipo autorizado. Relacionar sesión y setups solo dentro del mismo equipo. Miembros del mismo equipo pueden colaborar según rol; miembros de otro reciben404 sin revelar existencia. Separar caché/selección cliente por usuario/equipo y limpiar al cambiar/logout; evitar respuestas tardías de otro ámbito. Inferencia hereda el ámbito del cálculo y no mezcla evidencias.

## Datos existentes y producción

Hacer copia de seguridad antes de migrar. Datos legacy sin propietario no se asignan automáticamente al primer usuario: quedan en cuarentena local. Adopción por equipo mediante herramienta administrativa explícita, con inventario/auditoría y comprobación de pertenencia. No borrar ni reescribir raw. Cambios de esquema llevan versión y migración compatible. Producción falla cerrada si faltan identidad, configuración de membresías o autorización de rutas. No levantar el bloqueo global de producción solo porque un token sea válido. Mantener operación local explícita separada, nunca como fallback tras fallo de autenticación.

No desplegar públicamente ni ejecutar migraciones cloud durante preparación. Entregar código/migraciones revisables y validación local; cambios a infraestructura existente requieren un resultado concreto revisable antes de aplicarlos.

## Pruebas de aceptación

1. Comparador2D detecta signo, escala, desplazamiento temporal, muestras ausentes y exportaciones interpoladas; informe real separado de fixtures. Sin referencia no cambia a validado.
2. Ollama real carga modelo, devuelve selección válida y usa fallback ante timeout, IDs inventados o alias remoto. Prueba de privacidad del payload y latencia registrada.
3. Dos equipos, usuarios distintos, colaboración dentro del equipo, roles y revocación. Tokens ausentes/caducados/falsificados y headers manipulados no conceden acceso.
4. Acceso cruzado por UUID, descarga completa, estado, comparación entre equipos, catálogo legacy y exportaciones se deniega. No aparece contenido en errores/logs/caché.
5. Migración legacy en cuarentena, idempotencia, recuperación tras fallo y restore de backup comprobados. Flujo de navegador login/equipo/importación/comparación/logout.
6. Suites existentes, tipos/build, empaquetado y revisión independiente de frontera de autorización antes de declarar despliegue multiusuario listo.

## Límites de entrega

No sustituir referencia del fabricante por dos lectores que comparten la misma hipótesis. La disponibilidad de Ollama no valida por sí sola recomendaciones físicas. Autenticación/aislamiento probados no sustituyen TLS, backups y operación de producción. Si falta una referencia externa, registrar qué falta y completar lo verificable sin inventar evidencia.

## Autorrevisión

Las tres líneas de trabajo tienen criterios observables, condiciones de fallo y límites explícitos. No hay permisos de acceso basados en claims de navegador ni adopción automática de datos legacy. La ejecución continúa en esta sesión tras revisión de especificación y plan.

Referencias: https://help.2d-datarecording.com/Analyzer_Export ; https://help.2d-datarecording.com/Analyzer_Script ; https://github.com/ollama/ollama/blob/main/docs/faq.mdx
