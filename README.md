# Kazoo Cash

Finanzas personales minimalistas, siempre en modo oscuro. Funciona sin conexión y se instala en el iPhone como app.

**App:** https://kazoogod02.github.io/kazoo-cash/

## Funciones

- **Resumen:** patrimonio (cuentas − deudas), disponible vs. apartado en metas, ingresos/gastos del mes, tasa de ahorro, próximos pagos, tendencia de 6 meses e indicadores (fondo de emergencia, gasto contra el mes pasado, peso de deudas y suscripciones).
- **Movimientos:** gastos, ingresos y transferencias, con **etiquetas** (`#viaje`), **foto del ticket**, búsqueda y filtros por mes.
- **Metas:** progreso, aporte mensual necesario según la fecha límite y fecha estimada al ritmo actual. Si la meta tiene una cuenta de ahorro, al aportar se registra una **transferencia real** desde otra cuenta.
- **Deudas:** saldo, tasa, pago mensual y día de pago; cuándo quedas libre, intereses por pagar, **simulador “¿y si pago más?”** y orden de pago (avalancha o bola de nieve).
- **Suscripciones e ingresos fijos:** próximo cobro, costo mensual y anual, **quincena (15 y fin de mes)**, registro automático, avisos y exportación a Calendario con alarmas.
- **Presupuestos** por categoría con “cuánto puedes gastar al día”.
- **Sincronización entre dispositivos:** copia **cifrada** (AES-256, con tu frase) en un gist secreto de tu cuenta de GitHub.
- **Privacidad:** ocultar montos, código de acceso, respaldo JSON (incluye fotos) y exportación CSV.

## Publicar cambios

GitHub Pages publica automáticamente la rama `main`. Cada vez que cambies archivos, sube la versión en `sw.js` (`kazoo-v2` → `kazoo-v3`) para que el iPhone descargue la versión nueva.

## Instalar en el iPhone

1. Abre la URL en **Safari**.
2. Toca **Compartir** → **Agregar a inicio**.
3. Abre Kazoo desde el ícono y en **Ajustes › Avisos** activa las notificaciones.

## Sobre los avisos

iOS permite notificaciones en apps web instaladas (iOS 16.4 o posterior), pero una app sin servidor solo revisa tus cobros cuando la abres. Por eso hay dos capas:

- **Notificación y globo en el ícono** al abrir la app, si un cobro o pago de deuda está dentro del periodo de aviso.
- **Agregar al Calendario** (Ajustes o el ícono de calendario en Suscripciones): eventos repetidos con alarma que avisan aunque no abras la app.

## Sincronizar

1. En GitHub crea un token *classic* con el permiso **gist** (el botón “Abrir GitHub” en la app lo deja preconfigurado).
2. En **Ajustes › Sincronización** pega el token y elige una frase de cifrado.
3. En el otro dispositivo usa el mismo token y la misma frase.

Los datos se cifran antes de salir del teléfono; sin la frase nadie puede leerlos. Las fotos de tickets no se sincronizan (van en el respaldo `.json`).

## Datos

Todo se guarda en el dispositivo (`localStorage` e IndexedDB para fotos). Si borras los datos de Safari se pierden: activa la sincronización o exporta un respaldo de vez en cuando.
