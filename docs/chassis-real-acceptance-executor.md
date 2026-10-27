# Ejecutor de aceptación real en Linux

`tests/delivery/run_real_acceptance.py` usa exclusivamente el Docker de
`Chassis-Preproduction`, con UID1000 y almacenamiento propio. Es un ensayo de
preproducción; no despliega, modifica ARGOS ni acredita una entrega comercial.
WSL comparte anfitrión, kernel y red: esta separación no equivale a otra máquina.

## Entradas y revisión

El contrato conserva `prepare_real_acceptance.py`: proyecto y URL fijos, dos
equipos, ocho identidades designadas y cinco imágenes locales inmutables. Las
cuatro imágenes del producto y la imagen QA se comprueban antes de arrancar.

`provision_real_acceptance.py` recibe por stdin un sobre cerrado con las ocho
cuentas de ensayo y una única credencial de autoridad del proyecto designado.
No descubre variables ni copia carpetas. Crea archivos nativos nuevos con
`O_EXCL`, UID1000 y modo0600, sin reemplazar entradas ni cambiar ACL del origen.
Rechaza campos/identidades adicionales y la huella histórica pendiente de revocar.
La cuenta administrativa nunca entra en frontend, worker, gateway o QA.

La revisión completa del ejecutor debe preceder a la provisión y ejecución. Una
revisión de código no anula rechazos automáticos anteriores ni autoriza repetir
el antiguo lanzador que copiaba indiscriminadamente secretos.

## Ejecución y red

Dentro de la distribución designada:

    python3 tests/delivery/run_real_acceptance.py <configuración-privada.json> <configuración-pública.json>

Los archivos de credenciales se montan individualmente, en solo lectura, y se
verifica que sus metadatos no cambien. Solo la API monta su nuevo estado de ensayo.
Ningún servicio recibe el socket Docker, red del host ni puertos publicados.

La API y QA usan una red interna. Un relay TCP sin credenciales conecta con la
dirección pública resuelta del proveedor fijo en443; TLS conserva el hostname y
se verifica de extremo a extremo, sin interceptar certificados. Las otras salidas
directas quedan bloqueadas por la red interna. Este relay limita el destino TCP;
no interpreta el contenido HTTP cifrado ni afirma aislar otros dominios que
pudieran compartir ese mismo destino público.

Ollama comparte únicamente el namespace de red de la API: el proveedor del
producto mantiene su restricción de loopback. Binarios y pesos/índices del modelo
se montan en solo lectura, HOME es tmpfs y la nube de Ollama queda desactivada.
Se verifica el digest observado de qwen3:0.6b antes del ensayo; no se presenta esa
observación como un pin autenticado del protocolo de inferencia.
El nodo debe disponer de al menos8 CPU y12GiB; el modelo recibe un máximo de6 CPU
con3GiB y los demás servicios conservan sus límites. La petición congelada del
Chief se midió en28,3s con6 CPU y agotó60s con2 CPU. Es una referencia de capacidad,
no una garantía temporal universal; el producto mantiene su plazo de60s.

## Alcance de los controles

Antes de escribir, se autentican las ocho cuentas reales y se comprueban sus
identidades, membresías y designaciones. El CSV, las geometrías asumidas y los
contextos manuales llevan etiquetas SYNTHETIC y se crean solo por APIs públicas.
Nunca se escribe una grabación falsa en el almacenamiento ni se añade una marca
de validación científica para hacer pasar el ensayo.

Se ejecutan especialistas, revisores independientes y Chief con el modelo real.
Físico/neuro permanecen indisponibles si faltan sus datos. Solo se admite aprobar
un plan de mediciones, sin prescripciones físicas ni aplicación de taller. Se
comprueban la denegación al ingeniero no designado y la aprobación con las cuentas
de ensayo del titular y suplente de equipos distintos.

El navegador usa Chromium con sandbox y certificados verificados. Hace login
real y envía las dos aprobaciones mediante el botón de la aplicación, comprobando
el actor del evento remoto. Comprueba sesiones propias/ajenas, permisos de lectura y repite el acceso
verificado después de recargar; un usuario en caché no basta para pasar.

## Evidencia y limpieza

Cada ejecución tiene un UUID propio. Solo sus contenedores y redes se eliminan,
incluido el caso de fallo. El estado sintético local queda privado y separado por
ejecución; los eventos remotos de autoridad se conservan como auditoría con los
identificadores de objetos propios. No hay borrado amplio ni cambios de cuentas,
designaciones, permisos o migraciones cloud. Los informes no incluyen contraseñas,
tokens, claves ni arrays de muestras.

El resultado siempre mantiene `publishable=false`. Revocar la clave histórica y
contrastar AiM/2D contra exportaciones independientes siguen siendo controles
separados; superar este ensayo no los da por resueltos.
