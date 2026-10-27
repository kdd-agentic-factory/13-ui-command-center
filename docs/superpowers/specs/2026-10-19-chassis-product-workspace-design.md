# Producto Chassis: experiencia operativa y comercial

Estado: especificación y plan aprobados por el usuario en esta conversación; núcleo implementado y verificado localmente el 25-10-2026. Ampliación de alcance por el informe externo en `2026-10-25-telemetry-report-integration.md`. Los límites comerciales y dependencias externas siguen vigentes.

## Problema y resultado

La base funciona para importación y comparación de Chassis, pero la experiencia conserva dos aplicaciones, navegación histórica y promesas más amplias que las integraciones reales. El resultado debe ser un producto entendible: entrar, trabajar con una sesión del equipo, comparar geometrías y setups, ver evidencia y recuperar ese trabajo después.

El producto completo se desarrollará por subsistemas verificables. Esta especificación cubre el núcleo de producto y su presentación. No declara implementados los 65 módulos históricos ni los elimina: quedan en una matriz explícita de integración para entregas posteriores con contratos propios.

## Decisiones conservadas

- Aplicación canónica: `13-ui-command-center`, motor físico 17, backend de datos 18, identidad cloud 21. No mover repositorios ni fusionar bases de datos en esta entrega.
- Conservar nombres, activos KDD/Keedio y sistema visual técnico existente, simplificando jerarquía y navegación. La aceptación del rediseño no autoriza inventar una marca nueva.
- Conservar los contratos de importación, versiones físicas, revisiones A/B, calibración, procedencia y autorización ya implementados. Cada ampliación de API necesita verificación de pertenencia al equipo.
- Las mediciones existentes y sus archivos crudos permanecen intactos. No asignar propietarios a datos antiguos automáticamente.
- La web comercial y el espacio operativo tienen navegación y objetivos diferentes; no crear otra aplicación paralela.

## Arquitectura de información

### Aplicación operativa

1. **Chassis Tool:** entrada principal; moto, setup A/B, dibujo geométrico, suspensión y evidencia bajo un mismo contexto de sesión.
2. **Sesiones y telemetría:** importar, listar las sesiones autorizadas y abrir una; consultar canales reales y su reloj. La lista persiste en servidor, no depende de recordar el último identificador del navegador.
3. **Setups:** historial de revisiones de la sesión actual, identificación y diferencias A/B. No presentar como librería global de motos una lista que aún no tenga ese contrato.
4. **Evidencia e informe:** resultados guardados, supuestos, límites, fuente, calibración, curva, modelo y siguientes pruebas. Exportación reproducible para la sesión autorizada.
5. **Equipo y ajustes:** identidad, equipo activo, rol y estado real de servicios requeridos. El modo local permanece explícito.

La navegación secundaria de investigación/plataforma no compite con estas tareas. Cada módulo pendiente indica su estado y no muestra valores ficticios durante una sesión real. La demostración, si se conserva para ventas, será una entrada explícita con datos sintéticos identificados y sin mezclarse con datos de un equipo.

### Web comercial

Propuesta principal: comparar geometrías y setups con telemetría y evidencia. Mostrar el proceso real, qué se necesita importar y qué permite decidir el modelo. Acciones principales: abrir Chassis y consultar compatibilidad. Las áreas de investigación y plataforma conservan acceso secundario.

Publicar una tabla de compatibilidad honesta: AiM según formato/SDK/plataforma; 2D experimental para variantes admitidas; tabulares con esquema exigido; otros fabricantes pendientes o mediante exportación validada, sin prometer compatibilidad universal. Sin cifras de mejora, clientes ficticios ni precios no decididos.

## Diseño de la experiencia

En escritorio, cabecera compacta con sesión, moto, equipo y estado. Chassis utiliza tres áreas: edición contextual, visualización A/B y resultados/evidencia. Los detalles técnicos extensos se despliegan sin esconder advertencias necesarias para interpretar resultados. La señal se consulta junto al intervalo y la calibración que producen la comparación.

Evitar que tarjetas de metadatos y mensajes repetidos desplacen fuera de la primera vista la tarea principal. La fuente y su validación se resumen en un bloque persistente; la explicación completa sigue disponible. Usar nombres operativos en español de forma consistente, manteniendo nombres técnicos y unidades del fabricante cuando sean evidencia.

En tablet las áreas se apilan con la selección A/B y las acciones accesibles. En móvil se priorizan selección, revisión y lectura; las tablas pueden desplazarse dentro de su contenedor. Ningún control ni mensaje queda fuera del ancho de página. No agregar animaciones que retrasen trabajo ni efectos visuales sin función.

Conservar color semántico, tipografía legible, números tabulares y foco visible. A/B se distingue por texto y trazo además de color. Formularios con etiquetas, errores asociados y ayuda de unidades; estados de guardado y recuperación explícitos. Los dibujos se derivan de medidas, sin proporciones inventadas para rellenar vacíos.

## Estados y recuperación

- Sin sesión: importar AiM/2D, explicar requisitos, abrir una sesión autorizada previa cuando exista.
- Importación: seleccionar formato/medición; progreso real de petición, errores accionables y reintento; no fabricar un porcentaje.
- Fuente experimental: advertencia persistente y recomendaciones mecánicas bloqueadas según reglas existentes.
- Setup incompleto: mostrar qué falta y permitir completar sin rellenar supuestos automáticamente.
- Cambios sin guardar: conservar el borrador en el contexto actual y pedir resolverlo antes de perderlo por navegación; no guardar datos de equipo en almacenamiento compartido sin alcance de identidad.
- Comparación en curso/error: impedir duplicados, mantener la última evidencia guardada e identificar cuándo corresponde a una revisión anterior.
- Equipo/cuenta cambiados o sesión caducada: descartar respuestas tardías y contenido del contexto anterior; usar las garantías existentes del transporte.
- Servicio/modelo ausente: degradación explícita; sin IA local se conservan los hallazgos deterministas.

## Extensiones mínimas de backend

Se necesita listado paginado de sesiones del equipo actual para recuperación real. Contrato propuesto: `GET /api/v1/recorded?limit=20&cursor=...`, con metadatos mínimos, cursor opaco y orden estable por fecha/ID. Validar límite 1–100 y cursor; local muestra solo sesiones locales, autenticado solo sesiones con propietario del equipo activo. No devolver muestras crudas ni datos de otro equipo. Añadir únicamente esta ruta exacta al inventario de permisos de lectura.

El informe se genera a partir de una comparación guardada y sus revisiones inmutables, no del estado visible sin guardar. Incluir una exportación JSON versionada y una vista imprimible de informe en la aplicación. La exportación requiere lectura autorizada de sesión/comparación; no abrir rutas legacy de exportación. El documento distingue alternativa calculada B de otra sesión medida.

La salud de producto usa endpoints reales del backend y estado del modelo, separados de la salud de la plataforma histórica. No mostrar «todo operativo» por recibir HTML 200 ni presentar el estado de seis servicios no requeridos como caída de Chassis.

## Interfaz secundaria y repositorios restantes

En 15, conservar enlaces de entrada existentes y encaminarlos al espacio real para las tareas de producto consolidadas, sin añadir otra importación o base de setups. Inventariar y mantener pruebas de los enlaces. No eliminar páginas históricas ni introducir redirecciones globales que rompan rutas de investigación sin una decisión explícita.

La matriz de cierre conserva los 27 repositorios y todos los módulos de navegación: responsable, pantalla, API, persistencia, autorización, dependencia externa, prueba y estado. Los estados distinguen `verificado`, `parcial`, `demostración`, `pendiente de verificar` y `bloqueado por evidencia externa`. Documentación o presencia de un endpoint no bastan para marcar verificado.

## Entregas y aceptación

1. **Contrato de producto y matriz:** PRODUCT.md, catálogo verificable y una ruta principal inequívoca. Mantener todas las limitaciones actuales documentadas.
2. **Sesiones recuperables:** listado real con paginación; abrir tras recarga; sin fuga al cambiar equipo. Pruebas de propietario, ausencia de propietario, cursor inválido, igualdad de fechas y permisos reader.
3. **Espacio Chassis renovado:** jerarquía y navegación compactas; A/B, curva y calibración conservan comportamiento y persistencia; borradores no se pierden inadvertidamente. Pruebas de edición, errores, recarga y cambio de equipo.
4. **Evidencia e informe:** exportación y vista imprimible coinciden con la comparación guardada, identifican versión física y supuestos; cambios sin guardar no alteran el informe histórico.
5. **Web comercial y acceso secundario:** Chassis protagonista, compatibilidad explícita, enlaces correctos desde 15; sin claims no verificados.
6. **Verificación de producto:** tipos, suites apropiadas, build, flujos de navegador y revisión visual escritorio/móvil, teclado y errores. Validar una sesión real AiM y una 2D conservando su carácter experimental. Registrar exactamente qué pasó y qué falta.

No se considerará vendible en producción hasta completar contraste independiente 2D si se comercializa ese soporte, validación física del alcance anunciado, identidad cloud real, primera cuenta autorizada, restauración de copias y procedimiento de despliegue/soporte. Esas puertas tienen evidencia propia; no pueden cerrarse mediante diseño o una prueba con proveedor simulado.

## Fuera de esta especificación

No hay reescritura de física, control automático de una moto, recomendaciones de clics sin modelo contrastado, adquisición en directo universal, pasarela de pago, publicación externa ni aplicación de migraciones cloud. Estos subsistemas necesitan requisitos y planes independientes; su exclusión aquí no equivale a abandonar el objetivo de producto completo.
