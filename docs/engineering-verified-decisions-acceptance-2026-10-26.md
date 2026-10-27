# Aceptación de decisiones verificables — 26 de octubre de 2026

Estado: implementación revisada, aceptación con IA local real superada y flujo actualizado activo localmente. No acredita que el producto esté listo para vender.

## Alcance de la entrega

Herramientas5, tareas2, resultados3 y registro7. El servidor construye el contexto y el catálogo desde el snapshot autorizado. El trabajador no envía prompts ni catálogos. Cada tarea nueva admite una sola llamada al modelo. Las opciones y referencias usan alias locales con expansión exacta; se conservan valores SI, incertidumbres, calibración y límites originales.

Las decisiones son revisión sustentada, petición concreta o abstención. Petición y abstención permanecen bloqueadas. El triage solo corrige entradas cuando el único bloqueo es physical_inputs_missing; nunca permite succeeded. Una fuente2D experimental, un dominio inválido o contexto insuficiente impide inferir. Geometría asumida y wheelbase opcional no generan requisitos de medición universales.

El alcance de IA sigue limitado a las seis métricas publicadas de geometría plana y señales calibradas. Las fuerzas progresivas pertenecen al motor determinista; esta entrega no las certifica mediante IA. La aprobación física conserva al Crew Chief humano titular o sustituto designado y los permisos de equipo comprobados en servidor.

El contexto y el recibo de inferencia son inmutables en SQLite. El sellado comprueba decisión, expansión, referencias, estado, contadores y recibo; omitir la decisión no permite publicar conclusiones ni ocultar un recibo existente. Informes, secciones y Chief conservan la decisión original. Las versiones históricas1/2 y sus campos ausentes no se reinterpretan.

## Revisión independiente

Revisión de contexto fresco del paquete congelado y suplemento: un P1 y dos P2. Corregidos en una sola pasada con cuatro regresiones observadas primero en rojo: solicitud inventada sin decisión, recibo oculto, segunda reserva de revisor y exceso de prompt. Las15 pruebas focales pasan; la suite de ingeniería posterior pasa301 pruebas.

El límite16000 se comprueba con el prompt exacto en el preflight del servidor, antes de permitir la llamada. Un exceso declara cobertura no disponible y causa explícita; no se recortan hechos ni se culpa a una respuesta inexistente del modelo.

## Evidencia ejecutada

| Ámbito | Resultado |
|---|---|
|01, unidades completas |161PASS,8.36s|
|02, suite completa |118PASS,48.01s; aviso conocido cache_dir|
|18, ingeniería con PostgreSQL efímero |301PASS,3SKIP,409deseleccionadas,46.76s tras ajuste de gramática|
|HTTP real01→02→18 con respuestas controladas, antes del cierre de revisión |5PASS,90.98s|
|HTTP controlado tras correcciones |5PASS,86.51s|
|Interfaz |13SSR PASS; typecheck completo PASS|
|Inspección visual aislada |899px escritorio y marco390px; teclado Space; sin recorte visible; contraste del texto16.14:1|
|Empaquetado18 fuera del checkout |PASS;349588bytes;SHA256 48bbb2d620b2ef2af11084b24cc6c6dd7140bfeefadc67e22d54142baca0f940|
|IA local real |PASS positivo, triage exacto y bloqueo2D; qwen3:0.6b fijo|

Los tests se ejecutan con fuentes montadas en solo lectura, sin red externa ni socket Docker dentro del producto. Las identidades, PostgreSQL y grabaciones de aceptación son sintéticos. El positivo conserva sus valores y procedencia originales; el nuevo negativo omite únicamente offset_m en setupA y obtiene el diagnóstico del motor. No se han manipulado respuestas del modelo para obtener un aprobado.

SSR y typecheck no sustituyen Vitest/build nativos, no ejecutados en este banco por sus dependencias binarias Windows. La inspección visual solo cubre los estados modificados, no todas las pantallas. No se declara verde la suite global: se conservan las limitaciones anteriores de catálogo no montado y uuid_utils en colección global.

## Decisiones y límites asumidos

- Continuar sobre la base dirty/untracked aprobada, con baselines exactos; crear otro checkout omitiría trabajo previo. Coste: no hay aislamiento adicional entre repositorios.
- Mantener la gramática Analysis antigua en un recurso separado, sin admitirla en la llamada nueva. Coste: conservar compatibilidad de dos generaciones de contrato.
- Añadir recibos inmutables de inferencia además del catálogo. Coste: almacenamiento SQLite de agregados autorizados; nunca muestras raw.
- Completar metadatos de geometría solo en fixtures controlados y migrar sus respuestas al contrato nuevo. Coste: esa aceptación demuestra integración, no exactitud física. El positivo con modelo real no se sustituye por este fixture.
- Conservar explícitamente fixtures anteriores para las regresiones de doce intentos, reservas reemplazadas y hashes/listas históricas. Coste: mantener pruebas de lectura y contabilidad antiguas junto a las de tarea2; no habilita tareas nuevas1.
- La revisión no juzgó competencia ni latencia del modelo: se ha contrastado con aceptación real del candidato fijo en los tres casos previstos; no demuestra competencia fuera de ese alcance.
- La revisión estática no certifica interfaz ni build instalado: se aportan SSR/typecheck e inspección acotada; el build nativo sigue pendiente.
- La revisión no certificó las copias no incluidas originalmente: se verifican aparte la identidad byte a byte02/18, alias de resultado y validadores. No equivale a comprobar un despliegue ajeno.
- La revisión no certificó la implementación completa del almacén de comparaciones: se conservan sus comprobaciones existentes de revisión/origen y el sellado vuelve a contrastar las referencias. Coste: no representa una auditoría nueva de todo el almacén.

Sin hallazgos menores diferidos en esta revisión. No se ha aplicado una migración cloud ni publicado. Backend, gateway y worker locales se han recargado tras copia SQLite consistente y comprobación de ausencia de ejecuciones activas. Tampoco se ha cambiado automáticamente el modelo. El contraste independiente del fabricante2D, la validación física real y la auditoría comercial completa permanecen como límites externos de producción.

## Incidencia encontrada en la aceptación real

La primera aceptación positiva con qwen3:0.6b pasó77.25s: cuatro especialistas críticos succeeded y Chief succeeded, cinco llamadas. El primer negativo semántico falló65.86s: los cuatro especialistas quedaron failed por oneOf y el Chief terminó; ningún error se promovió a éxito físico.

La investigación encontró un defecto comprobable en el wire sin evidencias: referencias con items:not:{} dependen de un operador que la documentación primaria de llama.cpp declara no soportado ([limitaciones de JSON Schema](https://github.com/ggml-org/llama.cpp/blob/master/grammars/README.md#json-schemas--gbnf)). Se sustituyó por arrays con maxItems0 y se retiraron únicamente definiciones inalcanzables del esquema de salida. Es la misma selección semántica; no cambia prompts, hechos, modelo, presupuesto ni validación canónica. La regresión estructural fue RED→GREEN y las24 focales y301 de ingeniería pasan. La repetición del caso afectado pasó52.76s: los cuatro especialistas críticos pidieron exactamente setup_a.values_si.offset_m y quedaron bloqueados. La aceptación final positiva y2D pasó2 casos en108.61s: positivo con cuatro especialistas críticos y Chief, cinco llamadas;2D sin inferencia especialista y una llamada del Chief.

El observador de QA añade solo enums de decisión y contadores/formas de referencias, además de hashes de prompt, esquema y respuesta. No guarda texto libre. Catálogo local del candidato:7df6b6e09427a769808717c0a93cadc4ae99ed4eb8bf5ca557c90846becea435; el transporte de generación no autentica ese digest y model_metadata.digest continúa null.
## Activación local y conservación

Backend8180 y gateway8010 responden HTTP200 después del reinicio; OpenAPI publica analysis_version por defecto2. El worker permanece activo sin errores registrados. Vite5173 se conserva. La base se copió con backup consistente y quick_check correcto antes del reinicio; local-backup.json y local-reload-processes.json conservan las rutas y propietarios. No se crearon sesiones ficticias en la base principal.

La autoridad sigue en modo local: no habilita aprobación física ni identidad cloud. OpenRouter carece de clave y su ruta externa sigue indisponible; no interviene en la inferencia local verificada. El health del gateway declara database:not_configured, por lo que HTTP200 no certifica todas sus integraciones.

Los cuatro archivos de metadatos de relay de esta fase, sus hashes y los logs de aceptación quedan indexados en real-model-evidence-manifest.json. No se guardan prompts ni respuestas libres. El manifiesto release-candidate-manifest.json identifica el código actual. Se conserva el workspace ignorado y sus baselines, sin commit, push ni limpieza; coste: almacenamiento local y ausencia de una instantánea de recuperación en Git.
