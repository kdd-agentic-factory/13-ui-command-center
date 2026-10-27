# IA accionable y preparación para servicio central con nodos locales

Estado: propuesta para revisión. Continúa el flujo de ingeniería aprobado, sin sustituir evidencia física por inferencia.

## Problema comprobado

El análisis completo con modelo local no supera aceptación. Tres roles pidieron additional_evidence con referencias válidas; otro agotó su plazo. El contrato actual sólo permite tres MissingCode y no puede representar el campo concreto solicitado. La llamada aislada válida no certifica el análisis completo ni la precisión física.

El usuario ha elegido servicio central multi-equipo con nodos locales. Esta entrega cierra primero el contrato/aceptación de IA; no conecta nodos ni activa cloud. El informe `docs/production-readiness-review-2026-10-26.md` conserva los otros bloqueos y su prioridad.

## Enfoque y alternativa

Recomendado: mantener cálculo físico determinista y herramientas de lectura acotadas, ampliar el contrato para que las solicitudes sean accionables y medir el modelo sobre un banco estable. Alternativa: conservar el catálogo genérico y tratar cada bloqueo como revisión manual; requiere menos cambios, pero no elimina el gap que el usuario quiere resolver. No se propone forzar missing_inputs vacío ni presentar un resumen determinista como análisis de IA completado.

## Contrato de solicitudes

Añadir solicitudes estructuradas separadas de las limitaciones y del resumen. Cada solicitud identifica una referencia tipada al contexto congelado, un motivo de catálogo, el rol y la revisión que no puede completarse. Motivos distintos: valor ausente, procedencia/medición no acreditada, calibración incompatible, intervalo no seleccionado y requisito de dominio no representable. No admitir texto libre como ruta de acceso ni permitir que el modelo consulte objetos fuera del snapshot.

El catálogo debe derivarse de los campos realmente proyectados y de los requisitos existentes de cada capacidad. No convertir curvas/calibración en requisitos universales de la comparación planar. Los valores asumidos pueden permitir exploración geométrica y seguir bloqueando recomendaciones físicas según los gates existentes.

El servidor verifica que la referencia existe en el esquema autorizado y que el motivo concuerda con el estado congelado. Una petición de valor ya presente o medido es una contradicción del modelo; se rechaza con causa explícita. Si no puede nombrar una carencia representable, declarar solicitud no accionable y no atribuir al usuario la ausencia de un dato inventado. Ese resultado permanece bloqueado y visible.

Conservar lectura de resultados históricos con catálogo anterior. Versionar contratos y esquemas afectados conjuntamente en01/02/18; ninguna reinterpretación silenciosa de los resultados guardados. Los informes deben conservar salida seleccionada, diagnóstico determinista y modelo utilizado como entidades distinguibles.

## Presentación estable al modelo

Investigar y probar una representación canónica que elimine diferencias de identificadores opacos y orden no semántico entre casos físicamente idénticos. Usar referencias locales tipadas y expansión exacta; identidad y autoridad originales permanecen en el sobre de ejecución y se revalidan al regresar. No reemplazar cadenas arbitrarias, modificar puntos de curvas, redondear SI, reordenar series temporales ni eliminar procedencia/incertidumbre/advertencias.

Probar invariancia antes de inferir que la canonicalización mejora el modelo. La calidad se mide por casos, no por conseguir JSON válido ni por seleccionar más referencias.

## Ejecución y presupuestos

Conservar60 segundos por llamada,600 por run,12 llamadas totales y2 slots globales, con presupuesto restante, lease, cancelación y descarte de resultados tardíos. No descargar ni cambiar modelos automáticamente. No añadir retries ocultos ni ampliar cuotas para conseguir una aceptación.

Revisar la espera240 del harness frente al presupuesto aprobado600; cualquier ajuste del banco de pruebas debe seguir el deadline real y tener limpieza acotada. No modificar asserts para aceptar bloqueos ni reducir el número de especialistas críticos.

## Interfaz y Chief

Mostrar cada petición con campo/estado conocido, tarea afectada y paso de corrección cuando exista. Separar dato ausente, requisito no representado, respuesta no accionable y plazo agotado. No afirmar qué campo falta cuando el contrato/modelo no lo determine.

El Chief sólo prioriza candidatos con soporte permitido; las solicitudes no resueltas y revisiones ausentes siguen limitando la propuesta. Los líderes actuales se identifican como agregadores deterministas. No añadir una supuesta segunda validación científica por compartir un modelo entre ramas.

La última decisión corresponde al Crew Chief humano titular o sustituto designados, con membresías y revisión vigentes. Ni la nueva gramática ni un run exitoso ejecutan un cambio físico.

## Aceptación

1. Casos controlados RED/GREEN: peticiones válidas, campos presentes, valor asumido frente a medido, calibración incompatible, intervalo ausente, solicitud no accionable, referencia de otro scope y salida histórica.
2. Invariancia de representación en identidades distintas con idéntica física; conservar diferencias físicas reales, unidades, curvas y límites.
3. Persistencia e informes de solicitudes exactas; consumidor UI y Chief sin bypass por lista vacía o códigos nuevos.
4. Prueba completa aislada con modelo real, cuatro especialistas críticos y Chief; un caso suficiente para revisión del alcance declarado y otro insuficiente que solicite una entrada concreta o permanezca bloqueado de forma honesta. Registrar duración, modelo, versión de esquema y resultado por rol.
5. Verificación con mediciones reales como gate separado antes de recomendar cambios físicos productivos. Sigue pendiente el contraste independiente2D y la configuración de equipos cloud.

Si ningún modelo disponible cumple estos criterios en el nodo actual, conservar el gate y publicar la limitación de capacidad; no certificar el producto mediante un fallback oculto. La elección de otro hardware/modelo será una decisión explícita basada en medidas.

## Límites de esta entrega

No incluye despliegue, pagos, alta de clientes, migraciones cloud, enrolamiento de nodos, federación de datos, entrenamiento ni activación de rutas legacy. Esas áreas tienen entregas separadas en el informe de producción. Sin autorización adicional para enviar telemetría o contactar a terceros.
