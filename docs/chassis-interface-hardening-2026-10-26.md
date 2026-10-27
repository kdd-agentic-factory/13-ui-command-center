# Cabecera y carga 3D — corrección local

Entrega aditiva sobre el producto existente, 26 octubre 2026. Sin despliegue, instalación, cambios de identidad ni modificación de las medidas o cálculos de Chassis.

## Correcciones

La cabecera de altura fija dejaba que el nombre del circuito invadiese el estado de adquisición a320/390px. Ahora admite altura y ajuste de filas; en móvil conserva menú/circuito y estado en filas separadas. Los nombres largos se recortan visualmente y mantienen el nombre completo en el atributo title. Se conserva la navegación con teclado y sus estados.

Los cuatro visores Babylon importaban el índice completo de core. Se sustituyó por módulos específicos de la versión7.54.3 ya instalada, manteniendo builders, materiales, cámaras y protección de creación del motor. El mayor chunk pasa de5.080.343 a1.069.422bytes: reducción del79% aproximado. Los151chunks JavaScript quedan dentro del umbral existente de1.600kB; no se elevó el umbral ni se eliminaron visores.

La prueba sin WebGL detectó cuatro instancias incompletas registradas cuando el constructor fallaba. La comprobación previa Engine.IsSupported evita construirlas en ese caso. Se mantiene el catch para otros errores de inicialización. No se ha prometido recuperación automática tras cambios de GPU ni compatibilidad certificada con todos los navegadores.

## Verificación

- Regresión reproducida antes de tocar CSS:320 y390 fallaban por solapamiento/recorte;768/1024/1366 pasaban.
- Presupuesto de build reproducido en rojo:5.080.343bytes frente al umbral existente de1.600.000.
- Navegador desarrollo:7pruebas pasan. Navegador sobre build compilado independiente:7pruebas pasan en11.8s; cinco anchuras y menú/teclado, cuatro escenas reales con materiales y liberación de motores, y ausencia de WebGL sin caída ni instancias residuales.
- Typecheck de proyecto y build final pasan;151chunks dentro del presupuesto. Capturas móvil/escritorio y renderizadores inspeccionadas.
- Suite completa final de interfaz:100archivos y445pruebas pasan en125.69s.
- Revisión independiente acotada contra baseline: sin hallazgos materiales. No se revisaron de nuevo los cambios históricos de todo el producto.

Las escenas de aceptación utilizan controles sintéticos del renderizador y no acreditan geometría, fuerza, temperatura, FEM ni precisión metrológica. Los fixtures de prueba no se incorporan a la entrada normal de producción. Los valores físicos y el control humano siguen sujetos a sus contratos previos.

## Repetición

`npm run typecheck`, `npm run build`, `node tests/build/check-bundle-budget.mjs`, `npm test -- --run`.

Con Vite local disponible en5173: `npx playwright test --config playwright.header.config.ts`.

Para aceptación compilada: `npm run build -- --config vite.header-qa.config.ts --outDir .superpowers/sdd/2026-10-26-responsive-header/production-dist` y `npx playwright test --config playwright.header.production.config.ts`. El preview QA usa5176 y termina al concluir las pruebas. No modifica datos de telemetría.

## Pendientes de producto

Continúan abiertos el contraste externo del lector2D, referencia independiente del banco, activación de identidad productiva, federación operativa y aceptación comercial. Esta corrección cierra los dos problemas de presentación/rendimiento registrados en la entrega de evidencias de dominio; no convierte el conjunto en un producto certificado para vender.
