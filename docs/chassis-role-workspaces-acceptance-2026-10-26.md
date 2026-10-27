# Un producto con vistas por perfil — aceptación local

26-Oct-2026. Especificación y plan aprobados por el usuario; ejecución en esta sesión. No es una certificación comercial ni de ingeniería física.

## Producto entregado

Chassis ofrece seis vistas de trabajo: Piloto, Mecánico, Ingeniero, Analista, Crew Chief y Dirección/observación. Comparten sesión, grabación, comparación y evidencia. La preferencia es temporal; no cambia identidad, membresía, permisos ni designación humana. Los perfiles históricos pueden encontrar Chassis y la biblioteca real, que conservan TelemetryGate y autorización en servidor.

La cabecera muestra contexto y siguiente paso a partir de estados existentes. Distingue contexto incompleto, datos ausentes/experimentales, medidas pendientes, borradores, asociación pendiente y análisis/autoridad bloqueados. Permite volver al contexto guardado. No inicia análisis ni guarda al cambiar vista. La navegación hacia una tarea puede seleccionar la vista técnica adecuada sin otorgar permisos.

Las vistas de lectura mantienen conclusión y estado de autoridad consultado, con recarga de lectura. Los diagnósticos de tareas/hashes e historial quedan bajo detalles desplegables. Formularios de decisión y validación se conservan montados y se ocultan en lectura, preservando sus valores. En Mecánico la orden gana prioridad visual; en Analista, fuente y señales; en Ingeniero, A/B.

## Evidencia y límites

La aceptación de página usa una grabación y servicios controlados, con la comparación y su borrador reales. Comprueba las seis vistas, una sola instancia, conservación de B, bloqueo 2D y recuperación de contexto. Otras pruebas conservan escenario de curva y protección al salir mientras el editor está oculto; el cambio de vista no vuelve a consultar el estado ni las fichas. Los tests existentes de autoridad siguen comprobando el servidor. Esto no acredita identidad productiva ni IA real por cada perfil.

La suite completa, TypeScript, build y checks de taller se ejecutan tras la pasada final de corrección; sus resultados finales están en el ledger y logs de `.superpowers/sdd/2026-10-26-chassis-role-workspaces/`. No confundir el paquete congelado de revisión con el manifiesto final corregido.

Resultados finales sobre el código corregido: **92 archivos / 425 pruebas nativas pasan** (123.16 s); **TypeScript pasa**; **build nativo pasa** (23.53 s, aviso de bundles grandes conservado); **13 checks adicionales de taller pasan** (18.60 s). Focal de corrección: 50 pasan; preservación de escenario/guard con editor oculto pasa. El detector de diseño se ejecutó una vez sin hallazgos. No se repitió IA real porque este cambio reorganiza presentación, no cálculo o inferencia.

La confirmación de navegador conserva una sola instancia, fuente bloqueada, selector y foco de siguiente paso; no muestra overflow observado a1366/1024/390px. Captura completa sin telemetría cruda guardada en el workspace; viewport restaurado y vista Ingeniero abierta. Un intento de recorte produjo imagen desplazada en el adaptador y se sustituyó por captura completa comprobada, sin usarlo como evidencia válida.

La suite global 18 sigue limitada por entradas del banco y no se anuncia verde: véase el informe separado del ciclo de taller. El SQL afectado de taller/autoridad sí pasa54tests. Backend local recargado solo por esa corrección de ciclo; para las vistas bastó Vite/HMR, sin cambios a identidad, modelo o presupuesto.

## Revisión independiente

Se revisaron 17 archivos congelados contra sus baselines, con hashes comprobados. El primer veredicto solicitó cambios. Se aceptaron los cuatro P2 y se corrigieron en una pasada final:

1. Asociación/global dirty omitidos: se usan asociación vigente y propietarios de borradores del proveedor existente. Sesión, calculadora histórica y comparación/escenario conducen a sus formularios reales. Pruebas de proyección y página.
2. Navegación a biblioteca imposible para dirección/observador: habilitada la entrada de navegación `data`, manteniendo requiresAuth y las puertas existentes. Dos pruebas de DashboardShell recorren el cambio real de ruta; la página destino está sustituida por una sonda para esta prueba de navegación.
3. Bloqueos actuales ocultos en lectura: resumen de vigencia y motivos visibles, recarga de lectura y blockers en la cabecera. La misma propuesta con autoridad caducada se comprueba en las seis vistas, sin habilitar aprobación.
4. Diagnósticos antes del resultado: ejecución e historial pasan a detalles colapsados en lectura sin desmontar los formularios. Caso con ejecución poblada; el test comprueba visibilidad nativa de details, no ausencia del DOM.

P3 diferido: CSS prioriza visualmente secciones y la orden; el orden de Tab/lector de pantalla conserva el DOM. Se confirmó teclado del selector y foco al siguiente paso, pero no se certifica orden accesible completo de taller. Reorganizar esos árboles puede perder borradores; requiere un ajuste estructural probado, no duplicar paneles. También continúa el aviso de bundles grandes de Vite.

El revisor no certificó layout en ejecución, móvil/tableta, teclado real, tráfico a lo largo del tiempo, suite, autorización live o transiciones de identidad. El implementador verificó renderizado acotado en tres tamaños, ausencia de overflow observado, instancia única y teclado de cabecera; eso no equivale a auditoría integral de accesibilidad. Pruebas vecinas cubren partes de autoridad/cancelación. No se acredita aquí persistencia de todos los formularios posibles, latencia de paddock, montaje físico, visión/biometría, salida comercial ni proveedores cloud.

## Decisiones y costes

- Checkout existente y baseline exacto, para preservar la base dirty/untracked aprobada. Sin aislamiento adicional ni commits; workspace conservado para recuperación, con coste de almacenamiento.
- Instancias únicas montadas y `hidden` en vez de mover propietarios de estado: evita duplicar consultas/borradores; algunos componentes ocultos mantienen sus lecturas anteriores.
- Preferencia en memoria y reset por perfil/scope: no se añade persistencia insegura ni migración; la elección no sobrevive recarga.
- La proyección incluye un estado adicional de asociación y propietarios de borradores. Son metadatos de presentación del proveedor existente, sin nueva autoridad o datos crudos.
- Reutilización de conclusiones sin otra llamada de IA. No se genera un entrenador de piloto ni un informe distinto de los datos existentes.
- Las pruebas con servicios controlados validan UI y flujo de software. Fidelidad del fabricante, metrología, usuarios reales y disposición a pagar necesitan aceptación separada.

## Pendientes comerciales

Contraste independiente 2D y medidas físicas; activación y prueba de identidad/autoridad productiva; validación de uso con piloto, mecánico, analista, ingeniero y dirección; soporte/recuperación/despliegue; precios y pruebas de compra. Frenos, embrague, ergonomía, circuito/visión, biometría y optimización siguen en sus contratos pendientes. No se anuncian como operativos al añadir vistas.
