PLANTAS DE ÁNCASH — VERSIÓN PRO (BASE DE DATOS + DECISIONES DINÁMICAS)

Esta versión conserva la interfaz y la lógica del proyecto anterior y añade funciones de forma aditiva.

CAMBIOS NUEVOS
- En «Centro de análisis del cultivo / decisiones» se añadió un buscador conectado a las 300 plantas de datos/plantas.json.
- El selector permite filtrar por nombre común o nombre científico.
- Al elegir una planta de la base se muestran automáticamente sus datos disponibles: altitud, temperatura, humedad, suelo, luz, espacio y taxonomía.
- Se añadió un selector de provincia para cruzar la decisión con datos/provincias.json.
- El diagnóstico puede mostrar los porcentajes provinciales de plantas adecuadas, adecuadas con condiciones y no recomendadas cuando existe el registro para la planta seleccionada.
- Se integran los registros fitosanitarios disponibles en datos/bichos.json cuando corresponden a la provincia y al cultivo seleccionado.
- Los porcentajes del diagnóstico ahora aparecen con animación: contador, barra de progreso y anillo de compatibilidad.
- Los datos de la base se usan sin inventar rendimiento, precios o ciclos cuando esos campos no existen.

BASES INCLUIDAS
- datos/plantas.json — 300 registros de plantas.
- datos/provincias.json — base provincial de Áncash.
- datos/bichos.json — registros fitosanitarios por provincia.

IMPORTANTE
- NO se modificó deliberadamente el código del mapa Leaflet/Draw en esta ampliación. Si el mapa continúa mostrando «Map data not yet available», se conserva ese comportamiento tal como se solicitó.
- No reemplazar ni eliminar las carpetas de imágenes, mapa, fondo o logo de tu proyecto original.
- Los datos de pH no se inventan: si una ficha no contiene pH, el sistema lo muestra como no registrado y solo utiliza el pH que el usuario introduzca manualmente.
- El porcentaje de compatibilidad es una herramienta de apoyo basada en los parámetros disponibles; no sustituye una evaluación agronómica profesional.

INSTALACIÓN
1. Haz una copia de seguridad de tu proyecto.
2. Sustituye index.html, script.js y style.css por los de esta versión.
3. Conserva tus carpetas imagenes/, mapa/ y demás recursos visuales.
4. Si tu proyecto ya tiene una carpeta datos/, puedes reemplazar sus tres JSON por los incluidos aquí, que corresponden a los archivos entregados para esta ampliación.
5. Abre index.html mediante un servidor local (por ejemplo, Live Server) para que fetch() pueda cargar los JSON.
