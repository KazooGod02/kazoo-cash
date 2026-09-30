# Kazoo Cash

Finanzas personales minimalistas, siempre en modo oscuro. Funciona sin conexión y se instala en el iPhone como app.

- **Resumen:** patrimonio, disponible vs. apartado en metas, ingresos/gastos del mes, tasa de ahorro, tendencia de 6 meses e indicadores (fondo de emergencia, gasto contra el mes pasado, peso de suscripciones).
- **Movimientos:** gastos, ingresos y transferencias entre cuentas, con búsqueda y filtros por mes.
- **Metas:** progreso, aporte mensual necesario según la fecha límite y fecha estimada al ritmo actual.
- **Suscripciones:** próximo cobro, costo mensual y anual, registro automático del gasto, avisos por notificación y exportación a Calendario con alarmas.
- **Presupuestos** por categoría con “cuánto puedes gastar al día”.
- **Privacidad:** ocultar montos, código de acceso, datos solo en el dispositivo, respaldo JSON y exportación CSV.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub (por ejemplo `kazoo-cash`) y sube todos estos archivos a la raíz.
2. En el repositorio: **Settings › Pages › Build and deployment** → *Deploy from a branch* → rama `main`, carpeta `/ (root)`.
3. En uno o dos minutos estará en `https://TU-USUARIO.github.io/kazoo-cash/`.

Cada vez que publiques cambios, sube la versión en `sw.js` (`kazoo-v1` → `kazoo-v2`) para que el iPhone descargue la versión nueva.

## Instalar en el iPhone

1. Abre la URL en **Safari**.
2. Toca **Compartir** → **Agregar a inicio**.
3. Abre Kazoo desde el ícono y en **Ajustes › Avisos** activa las notificaciones.

## Sobre los avisos

iOS permite notificaciones en apps web instaladas (iOS 16.4 o posterior), pero una app sin servidor solo puede revisar tus cobros cuando la abres. Por eso hay dos capas:

- **Notificación y globo en el ícono** cuando abres la app y un cobro está dentro del periodo de aviso.
- **Agregar cobros al Calendario** (Ajustes o el ícono de calendario en Suscripciones): crea eventos repetidos con alarma, que avisan aunque nunca abras la app.

## Datos

Todo se guarda en `localStorage` del dispositivo. Si borras los datos de Safari o desinstalas la app, se pierden: exporta un respaldo de vez en cuando (**Ajustes › Datos**).
