# Aceptación del ciclo optimizado — 2026-11-02

Ensayo independiente sintético con identidad real de preproducción y Qwen3:1.7b local. No demuestra validación física ni aceptación global del producto.

- Preparación: 29 controles. Validación de resultados y equivalencia de entradas: 60 controles. Navegador aislado: 5 comprobaciones, cero decisiones humanas escritas.
- Ocho llamadas en ambos ciclos; mismos artefactos de modelo, seis hilos, seis CPU y 5 GiB en el candidato. Imagen API `sha256:ebac5d1eb4aa704e153502bf822c7ec9d9847ed7c31e0d3cb619ef9d80189214`.
- Suma de pases del worker: 488.531 → 353.557 segundos; diferencia observada 134.974 segundos. Transporte del modelo: 140.287 → 127.096 segundos. Tiempo completo del contenedor candidato: 361.58 segundos; sin equivalente anterior comparable.
- Mismas referencias de grabación/setup/análisis, evidencia no perteneciente a dominios y hechos/unidades/incertidumbres/instantes de tres observaciones sintéticas, contrastados por las rutas autenticadas.
- Especialistas y revisores completados, síntesis Chief publicada; físico/neuro unavailable. Propuesta pendiente de decisión del Chief humano o suplente. No autoriza montaje mecánico.

Una pareja de ensayos, red variable y respuestas generadas distintas (1189 → 1072 tokens). No es un porcentaje causal ni SLA. Los pases excluyen preparación, arranque/preflight y navegador. El frontend congelado no incorpora el rediseño local todavía sin commit.

Los cinco JSON homónimos contienen preparación, worker, validación, comparación y navegador. El probe reproducible es `tests/delivery/current_optimized_cycle_validation.py`; requiere el ejecutor privado aprobado y no contiene credenciales.

Se cierra la medición pendiente de este worker. Siguiente bloque funcional: entrega 2 del plan aprobado de guía/tablero, persistencia privada, CAS/idempotencia y asignaciones vigentes. Siguen pendientes Cicerone completo, paquete de sesión, ficha mecánica y contraste independiente AiM/2D. Sin despliegue ni migraciones; revocación histórica pendiente.
