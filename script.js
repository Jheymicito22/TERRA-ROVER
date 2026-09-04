// =====================================================
// PLANTAS DE ÁNCASH
// SISTEMA PRINCIPAL
// =====================================================


// =====================================================
// VARIABLES GLOBALES
// =====================================================

let plantas = [];

let resultadosUltimoAnalisis = [];
let datosProvincias = {};


// =====================================================
// CARGAR BASE DE DATOS
// =====================================================

async function cargarPlantas() {

    try {

        const respuesta = await fetch("datos/plantas.json");

        if (!respuesta.ok) {

            throw new Error(
                "No se encontró datos/plantas.json"
            );

        }

        plantas = await respuesta.json();

        // Corrección de seguridad: algunas filas antiguas pueden traer min/max invertidos.
        // Se corrigen en memoria sin alterar el archivo original ni perder información.
        plantas.forEach(normalizarRangosPlanta);

        console.log(
            "Base de datos cargada:",
            plantas.length,
            "plantas"
        );

        // Actualizar favoritos y catálogo después de cargar las plantas
        mostrarFavoritos();
        cargarFiltroGeneros();
        mostrarListaCategoria(plantas, false);

    }

    catch (error) {

        console.error(error);

        alert(
            "No se pudo cargar la base de datos de plantas."
        );

    }
}


// =====================================================
// INICIAR APLICACIÓN
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        cargarPlantas();

        cargarDatosProvincias();

        mostrarFavoritos();

        inicializarMapaAncash();

    }
);


// =====================================================
// CAMBIAR DE SECCIÓN
// =====================================================

function mostrarSeccion(
    seccion,
    boton = null
) {

    const secciones =
        document.querySelectorAll(".seccion");

    secciones.forEach(
        function(elemento) {

            elemento.classList.add("oculto");

        }
    );


    const seleccion =
        document.getElementById(seccion);


    if (seleccion) {

        seleccion.classList.remove("oculto");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    // Activar botón del menú

    const botones =
        document.querySelectorAll(".nav-btn");

    botones.forEach(
        function(b) {

            b.classList.remove("activo");

        }
    );


    if (boton) {

        boton.classList.add("activo");

    }

}


// =====================================================
// NORMALIZAR RANGOS DE LA BASE DE DATOS
// =====================================================
function normalizarRangosPlanta(planta) {
    ["altitud", "temperatura", "humedad"].forEach(campo => {
        if (planta[campo] && Number.isFinite(Number(planta[campo].min)) && Number.isFinite(Number(planta[campo].max))) {
            const a = Number(planta[campo].min);
            const b = Number(planta[campo].max);
            planta[campo].min = Math.min(a, b);
            planta[campo].max = Math.max(a, b);
        }
    });
}

// =====================================================
// BUSCAR CON ENTER
// =====================================================

function buscarConEnter(evento) {

    if (evento.key === "Enter") {

        buscarPlanta();

    }

}


// =====================================================
// BUSCAR EJEMPLO
// =====================================================

function buscarEjemplo(nombre) {

    document.getElementById(
        "busqueda"
    ).value = nombre;

    buscarPlanta();

}


// =====================================================
// NORMALIZAR TEXTO
// =====================================================

function normalizarTexto(texto) {

    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

}


// =====================================================
// BUSCAR PLANTA - COINCIDENCIA EXACTA Y PRECISA
// =====================================================

function buscarPlanta() {

    const input = document.getElementById("busqueda");
    const textoOriginal = input ? input.value : "";
    const texto = normalizarTexto(textoOriginal);
    const resultado = document.getElementById("resultadoBusqueda");

    if (texto === "") {
        resultado.innerHTML = `
            <div class="ficha-planta">
                <h3>⚠️ Escribe una planta</h3>
                <p>Introduce el nombre de una planta para realizar la búsqueda.</p>
            </div>`;
        return;
    }

    if (plantas.length === 0) {
        resultado.innerHTML = `
            <div class="ficha-planta">
                <h3>⏳ Cargando información...</h3>
                <p>Espera un momento y vuelve a intentar.</p>
            </div>`;
        return;
    }

    const coincidenciasExactas = plantas.filter(p =>
        normalizarTexto(p.nombre) === texto ||
        normalizarTexto(p.nombreCientifico) === texto
    );

    const coincidenciasPorPalabra = plantas.filter(p => {
        if (coincidenciasExactas.some(x => x.id === p.id)) return false;
        const nombre = normalizarTexto(p.nombre);
        const cientifico = normalizarTexto(p.nombreCientifico);
        return contienePalabraExacta(nombre, texto) || contienePalabraExacta(cientifico, texto);
    });

    const coincidencias = [...coincidenciasExactas, ...coincidenciasPorPalabra];

    if (coincidencias.length === 1) {
        mostrarFichaPlanta(coincidencias[0], resultado);
        return;
    }

    if (coincidencias.length > 1) {
        resultado.innerHTML = `
            <div class="ficha-planta">
                <h2>🌿 ${coincidencias.length} coincidencias</h2>
                <p>La búsqueda <strong>${escapeHtml(textoOriginal)}</strong> coincide con estas plantas. La coincidencia exacta aparece primero.</p>
                <div class="catalogo-grid">
                    ${coincidencias.map(crearTarjetaCatalogo).join("")}
                </div>
            </div>`;
        return;
    }

    // Solo como último recurso se muestran coincidencias parciales, claramente etiquetadas.
    const parciales = plantas.filter(p => {
        const nombre = normalizarTexto(p.nombre);
        const cientifico = normalizarTexto(p.nombreCientifico);
        return nombre.includes(texto) || cientifico.includes(texto);
    });

    if (parciales.length) {
        resultado.innerHTML = `
            <div class="ficha-planta">
                <h2>🔎 No hay coincidencia exacta</h2>
                <p>No existe una planta cuyo nombre contenga <strong>${escapeHtml(textoOriginal)}</strong> como palabra independiente. Estas son coincidencias parciales:</p>
                <div class="catalogo-grid">
                    ${parciales.map(crearTarjetaCatalogo).join("")}
                </div>
            </div>`;
        return;
    }

    resultado.innerHTML = `
        <div class="ficha-planta">
            <h3>❌ Planta no encontrada</h3>
            <p>No encontramos <strong>${escapeHtml(textoOriginal)}</strong> en nuestra base de datos.</p>
        </div>`;
}

function contienePalabraExacta(texto, consulta) {
    if (!consulta) return false;
    const escapada = consulta.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp("(^|[\\s/(),;.-])" + escapada + "($|[\\s/(),;.-])", "i");
    return regex.test(texto);
}

// =====================================================
// MOSTRAR FICHA DE PLANTA CON IMAGEN
// =====================================================

function mostrarFichaPlanta(
    planta,
    contenedor
) {

    const esFavorita =
        obtenerFavoritos().includes(
            planta.id
        );


    contenedor.innerHTML = `

        <div class="ficha-planta">

            <!-- CABECERA DE LA PLANTA -->

            <div class="ficha-cabecera">

                <div class="ficha-informacion">

                    <div>

                        <h2>
                            🌱 ${planta.nombre}
                        </h2>

                        <p>
                            <strong>
                                ${planta.nombreCientifico}
                            </strong>
                        </p>

                    </div>


                    <button
                        onclick="alternarFavorito(${planta.id})"
                        class="boton-favorito"
                        title="Guardar en favoritos"
                    >

                        ${esFavorita ? "⭐" : "☆"}

                    </button>

                </div>


                <!-- IMAGEN DE LA PLANTA -->

                <div class="ficha-imagen">

                    <img
                        src="imagenes/plantas/${planta.imagen}"
                        alt="Imagen de ${planta.nombre}"
                        onerror="
                            if (!this.dataset.reintento) {
                                this.dataset.reintento = '1';
                                this.src = 'imagenes/' + '${planta.imagen}';
                            } else {
                                this.style.display='none';
                                this.parentElement.classList.add('sin-imagen');
                            }
                        "
                    >

                    <span class="imagen-error">
                        🌱
                    </span>

                </div>

            </div>


            <hr>


            <!-- INFORMACIÓN -->

            <div class="datos-planta">


                <div class="resultado-planta">

                    <h3>
                        ⛰️ Altitud
                    </h3>

                    <p>
                        ${planta.altitud.min}
                        -
                        ${planta.altitud.max}
                        metros
                    </p>

                </div>


                <div class="resultado-planta">

                    <h3>
                        🌡️ Temperatura
                    </h3>

                    <p>
                        ${planta.temperatura.min}
                        -
                        ${planta.temperatura.max}
                        °C
                    </p>

                </div>


                <div class="resultado-planta">

                    <h3>
                        💧 Humedad
                    </h3>

                    <p>
                        ${planta.humedad.min}
                        -
                        ${planta.humedad.max}
                        %
                    </p>

                </div>


                <div class="resultado-planta">

                    <h3>
                        📐 Espacio
                    </h3>

                    <p>
                        ${planta.espacioPorPlanta}
                        m² por planta
                    </p>

                </div>


                <div class="resultado-planta">

                    <h3>
                        🌱 Suelo
                    </h3>

                    <p>
                        ${planta.suelo}
                    </p>

                </div>


                <div class="resultado-planta">

                    <h3>
                        ☀️ Luz
                    </h3>

                    <p>
                        ${planta.luz}
                    </p>

                </div>


            </div>

        </div>

    `;

}


// =====================================================
// ANALIZAR ZONA
// =====================================================

function analizarZona() {

    const lugar = document.getElementById("lugar").value.trim();
    const altitud = Number(document.getElementById("altitud").value);
    const temperatura = Number(document.getElementById("temperatura").value);
    const humedad = Number(document.getElementById("humedad").value);
    const areaIngresada = Number(document.getElementById("area").value);
    const resultado = document.getElementById("resultadoZona");

    // El área mínima para el cálculo es 1 m².
    if (
        lugar === "" ||
        !Number.isFinite(altitud) ||
        !Number.isFinite(temperatura) ||
        !Number.isFinite(humedad) ||
        !Number.isFinite(areaIngresada) ||
        areaIngresada < 1
    ) {
        resultado.innerHTML = `
            <div class="ficha-planta">
                <h3>⚠️ Datos incompletos</h3>
                <p>Completa todos los campos correctamente.</p>
                <p>📐 El área mínima es de <strong>1 m²</strong>.</p>
            </div>`;
        return;
    }

    const area = Math.max(1, areaIngresada);

    const condAltitud = document.getElementById("condAltitud");
    const condTemperatura = document.getElementById("condTemperatura");
    const condHumedad = document.getElementById("condHumedad");
    const condArea = document.getElementById("condArea");
    const condLugar = document.getElementById("condLugar");

    if (condAltitud) condAltitud.textContent = altitud + " m";
    if (condTemperatura) condTemperatura.textContent = temperatura + " °C";
    if (condHumedad) condHumedad.textContent = humedad + " %";
    if (condArea) condArea.textContent = area + " m²";
    if (condLugar) condLugar.textContent = "📍 " + lugar;

    const resultados = plantas.map(function(planta) {

        let puntos = 0;

        const altitudMin = Number(planta.altitud?.min);
        const altitudMax = Number(planta.altitud?.max);
        const temperaturaMin = Number(planta.temperatura?.min);
        const temperaturaMax = Number(planta.temperatura?.max);
        const humedadMin = Number(planta.humedad?.min);
        const humedadMax = Number(planta.humedad?.max);

        const altitudCorrecta =
            Number.isFinite(altitudMin) &&
            Number.isFinite(altitudMax) &&
            altitud >= Math.min(altitudMin, altitudMax) &&
            altitud <= Math.max(altitudMin, altitudMax);

        if (altitudCorrecta) puntos++;

        const temperaturaCorrecta =
            Number.isFinite(temperaturaMin) &&
            Number.isFinite(temperaturaMax) &&
            temperatura >= Math.min(temperaturaMin, temperaturaMax) &&
            temperatura <= Math.max(temperaturaMin, temperaturaMax);

        if (temperaturaCorrecta) puntos++;

        const humedadCorrecta =
            Number.isFinite(humedadMin) &&
            Number.isFinite(humedadMax) &&
            humedad >= Math.min(humedadMin, humedadMax) &&
            humedad <= Math.max(humedadMin, humedadMax);

        if (humedadCorrecta) puntos++;

        // =================================================
        // FÓRMULA DE PLANTACIÓN
        // =================================================
        // 1 m² es el mínimo.
        // Cada planta recibe una densidad estable de 3 a 6
        // plantas por m² según su ID, para que no todas tengan
        // exactamente la misma cantidad.
        // Desde 4 m² se garantiza un mínimo de 20 plantas.
        // =================================================

        const idPlanta = Number(planta.id) || 1;
        const densidad = 3 + (Math.abs(idPlanta * 7) % 4);

        let cantidad = Math.round(area * densidad);

        if (area >= 4) {
            cantidad = Math.max(20, cantidad);
        } else {
            cantidad = Math.max(3, cantidad);
        }

        const espacioCorrecto = area >= 1;
        if (espacioCorrecto) puntos++;

        const compatibilidad = Math.round((puntos / 4) * 100);

        let nivel;
        let icono;

        if (compatibilidad >= 75) {
            nivel = "RECOMENDADA";
            icono = "🟢";
        } else if (compatibilidad >= 50) {
            nivel = "POSIBLE";
            icono = "🟡";
        } else {
            nivel = "NO RECOMENDADA";
            icono = "🔴";
        }

        return {
            planta: planta,
            compatibilidad: compatibilidad,
            nivel: nivel,
            icono: icono,
            cantidad: cantidad,
            densidad: densidad,
            altitudCorrecta: altitudCorrecta,
            temperaturaCorrecta: temperaturaCorrecta,
            humedadCorrecta: humedadCorrecta,
            espacioCorrecto: espacioCorrecto
        };
    });

    resultados.sort(function(a, b) {
        return b.compatibilidad - a.compatibilidad;
    });

    resultadosUltimoAnalisis = resultados;

    let html = `
        <div class="ficha-planta">
            <h2>🧠 Análisis inteligente</h2>
            <p>📍 <strong>Zona:</strong> ${escapeHtml(lugar)}</p>
            <p>⛰️ <strong>Altitud:</strong> ${altitud} m</p>
            <p>🌡️ <strong>Temperatura:</strong> ${temperatura} °C</p>
            <p>💧 <strong>Humedad:</strong> ${humedad} %</p>
            <p>📐 <strong>Área:</strong> ${area} m²</p>
            <hr>
            <h2>🌱 Resultados</h2>
    `;

    resultados.forEach(function(r) {

        const p = r.planta;

        html += `
            <div class="resultado-planta">
                <h3>${r.icono} ${escapeHtml(p.nombre)}</h3>
                <h4>Compatibilidad: ${r.compatibilidad}%</h4>
                <p><strong>${r.nivel}</strong></p>
                <p>
                    📐 Puedes plantar aproximadamente:
                    <strong>${r.cantidad} plantas</strong>.
                </p>
                <p>
                    🌱 Densidad estimada:
                    <strong>${r.densidad} plantas/m²</strong>.
                </p>
                <ul>
                    <li>⛰️ Altitud: ${r.altitudCorrecta ? "🟢 Adecuada" : "🔴 No adecuada"}</li>
                    <li>🌡️ Temperatura: ${r.temperaturaCorrecta ? "🟢 Adecuada" : "🔴 No adecuada"}</li>
                    <li>💧 Humedad: ${r.humedadCorrecta ? "🟢 Adecuada" : "🔴 No adecuada"}</li>
                    <li>📐 Espacio: ${r.espacioCorrecto ? "🟢 Suficiente" : "🔴 Insuficiente"}</li>
                </ul>
                <button
                    class="boton-principal"
                    onclick="alternarFavorito(${p.id})">
                    ${obtenerFavoritos().includes(p.id) ? "⭐ Quitar de favoritos" : "☆ Guardar en favoritos"}
                </button>
            </div>
        `;
    });

    html += `</div>`;

    resultado.innerHTML = html;

    actualizarRecomendaciones(resultados);
    mostrarSeccion("zona");
}


// =====================================================
// ACTUALIZAR RECOMENDACIONES
// =====================================================

function actualizarRecomendaciones(
    resultados
) {

    const recomendadas =
        resultados.filter(
            function(r) {

                return r.compatibilidad >= 50;

            }
        );


    const contenedor =
        document.getElementById(
            "resultadoRecomendacion"
        );


    const mini =
        document.getElementById(
            "miniRecomendaciones"
        );


    if (
        recomendadas.length === 0
    ) {

        contenedor.innerHTML = `

            <div class="mensaje-vacio">

                <span>⚠️</span>

                <h2>
                    No encontramos cultivos ideales
                </h2>

                <p>
                    Las condiciones introducidas
                    no coinciden suficientemente
                    con nuestra base actual.
                </p>

            </div>

        `;


        mini.innerHTML = `
            <p>
                No se encontraron coincidencias.
            </p>
        `;

        return;

    }


    // -----------------------------------------------
    // PÁGINA RECOMENDACIONES
    // -----------------------------------------------

    let html = "";


    recomendadas.forEach(
        function(r) {

            html += `

                <div class="resultado-planta">

                    <h2>
                        ${r.icono}
                        ${r.planta.nombre}
                    </h2>

                    <p>
                        <strong>
                            Compatibilidad:
                        </strong>

                        ${r.compatibilidad}%
                    </p>

                    <p>
                        ${r.nivel}
                    </p>

                    <p>
                        📐 Aproximadamente
                        ${r.cantidad}
                        plantas.
                    </p>

                    <button
                        class="boton-principal"
                        onclick="alternarFavorito(${r.planta.id})"
                    >

                        ${
                            obtenerFavoritos().includes(
                                r.planta.id
                            )
                            ? "⭐ Quitar favorito"
                            : "☆ Guardar favorito"
                        }

                    </button>

                </div>

            `;

        }
    );


    contenedor.innerHTML =
        html;


    // -----------------------------------------------
    // MINI RECOMENDACIONES
    // -----------------------------------------------

    const primeras =
        recomendadas.slice(
            0,
            3
        );


    let miniHTML = "";


    primeras.forEach(
        function(r) {

            miniHTML += `

                <div class="mini-planta">

                    <strong>
                        ${r.icono}
                        ${r.planta.nombre}
                    </strong>

                    <span>
                        ${r.compatibilidad}%
                    </span>

                </div>

            `;

        }
    );


    mini.innerHTML =
        miniHTML;

}


// =====================================================
// FAVORITOS
// =====================================================

function obtenerFavoritos() {

    return JSON.parse(
        localStorage.getItem(
            "plantasFavoritas"
        )
    ) || [];

}


// =====================================================
// CAMBIAR FAVORITO
// =====================================================

function alternarFavorito(
    id
) {

    let favoritos =
        obtenerFavoritos();


    if (
        favoritos.includes(id)
    ) {

        favoritos =
            favoritos.filter(
                function(
                    favorito
                ) {

                    return favorito !== id;

                }
            );

    }

    else {

        favoritos.push(id);

    }


    localStorage.setItem(
        "plantasFavoritas",
        JSON.stringify(favoritos)
    );


    mostrarFavoritos();


    // Actualizar análisis si existe

    if (
        resultadosUltimoAnalisis.length > 0
    ) {

        actualizarRecomendaciones(
            resultadosUltimoAnalisis
        );

    }


    // Actualizar búsqueda

    const texto =
        document.getElementById(
            "busqueda"
        )?.value;


    if (
        texto &&
        texto.trim() !== ""
    ) {

        buscarPlanta();

    }

}


// =====================================================
// MOSTRAR FAVORITOS
// =====================================================

function mostrarFavoritos() {
    const contenedor = document.getElementById("listaFavoritos");
    if (!contenedor) return;

    const favoritos = obtenerFavoritos();
    const plantasFavoritas = plantas.filter(p => favoritos.includes(p.id));

    if (plantasFavoritas.length === 0) {
        contenedor.innerHTML = `
            <div class="mensaje-vacio">
                <span>⭐</span>
                <h2>Todavía no tienes favoritos</h2>
                <p>Busca una planta y presiona ☆ para guardarla.</p>
            </div>`;
        return;
    }

    contenedor.innerHTML = plantasFavoritas.map(p => `
        <div class="favorito-card">
            <div class="favorito-imagen">
                <img src="imagenes/plantas/${escapeHtml(p.imagen)}" alt="Imagen de ${escapeHtml(p.nombre)}" onerror="this.style.display='none';">
            </div>
            <div class="favorito-contenido">
                <h2>🌱 ${escapeHtml(p.nombre)}</h2>
                <p>${escapeHtml(p.nombreCientifico)}</p>
                <small>⛰️ ${p.altitud.min}-${p.altitud.max} m</small>
            </div>
            <button onclick="alternarFavorito(${p.id})">🗑️ Quitar</button>
        </div>
    `).join("");
}

// =====================================================
// CATEGORÍAS Y CATÁLOGO COMPLETO
// =====================================================

function obtenerCategoria(nombre) {
    const n = normalizarTexto(nombre);
    if (["papa", "oca", "olluco"].includes(n)) return "tuberculo";
    if (n === "quinua") return "cereal";
    if (n === "haba") return "leguminosa";
    return "otros";
}

function filtrarCategoria(categoria) {
    const lista = plantas.filter(p => obtenerCategoria(p.nombre) === categoria);
    mostrarListaCategoria(lista, true);
}

function mostrarTodasLasPlantas() {
    mostrarListaCategoria(plantas, true);
}

function cargarFiltroGeneros() {
    const selectGenero = document.getElementById("filtroGenero");
    const selectEspecie = document.getElementById("filtroEspecie");
    if (!selectGenero) return;

    const generos = [...new Set(plantas.map(p => p.taxonomia?.genero).filter(Boolean))]
        .sort((a,b)=>a.localeCompare(b,"es"));
    selectGenero.innerHTML = `<option value="">Todos los géneros (${generos.length})</option>` +
        generos.map(g => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join("");

    if (selectEspecie) {
        const especies = [...new Set(plantas.map(p => p.taxonomia?.especie).filter(Boolean))]
            .sort((a,b)=>a.localeCompare(b,"es"));
        selectEspecie.innerHTML = `<option value="">Todas las especies (${especies.length})</option>` +
            especies.map(e => `<option value="${escapeHtml(e)}">${escapeHtml(e)}</option>`).join("");
    }
}

function filtrarPorGenero(genero) {
    const select = document.getElementById("filtroGenero");
    if (select) select.value = genero || "";
    filtrarTaxonomia();
}

function filtrarTaxonomia() {
    const genero = document.getElementById("filtroGenero")?.value || "";
    const especie = document.getElementById("filtroEspecie")?.value || "";
    const lista = plantas.filter(p =>
        (!genero || p.taxonomia?.genero === genero) &&
        (!especie || p.taxonomia?.especie === especie)
    );
    mostrarListaCategoria(lista, false);
}

function crearTarjetaCatalogo(p) {
    const genero = p.taxonomia?.genero || "No registrado";
    const especie = p.taxonomia?.especie || "No registrada";
    return `
        <article class="catalogo-card">
            <div class="catalogo-card-imagen">
                <img src="imagenes/plantas/${escapeHtml(p.imagen)}" alt="Fotografía de ${escapeHtml(p.nombre)}" loading="lazy" onerror="this.style.display='none';this.parentElement.classList.add('sin-imagen');">
                <span class="fallback">🌱</span>
            </div>
            <h3>${escapeHtml(p.nombre)}</h3>
            <p class="cientifico">${escapeHtml(p.nombreCientifico)}</p>
            <div class="catalogo-taxonomia">
                <span>Género: ${escapeHtml(genero)}</span>
                <span>Especie: ${escapeHtml(especie)}</span>
            </div>
            <button class="boton-principal" onclick="seleccionarPlantaDesdeCategoria(${p.id})">Ver planta</button>
        </article>`;
}

function mostrarListaCategoria(lista, hacerScroll) {
    const contenedor = document.getElementById("resultadoCategoria");
    if (!contenedor) return;

    const contador = document.getElementById("contadorCatalogo");
    if (contador) contador.textContent = `${lista.length} planta${lista.length === 1 ? "" : "s"}`;

    if (!lista.length) {
        contenedor.innerHTML = `<div class="ficha-planta"><p>No hay plantas disponibles para este filtro.</p></div>`;
        return;
    }

    contenedor.innerHTML = `
        <div class="ficha-planta">
            <h2>🌱 Plantas encontradas (${lista.length})</h2>
            <div class="catalogo-grid">
                ${lista.map(crearTarjetaCatalogo).join("")}
            </div>
        </div>`;

    if (hacerScroll) contenedor.scrollIntoView({behavior:"smooth", block:"start"});
}

function seleccionarPlantaDesdeCategoria(idOPlanta) {
    const planta = typeof idOPlanta === "number" ? plantas.find(p => p.id === idOPlanta) : plantas.find(p => p.nombre === idOPlanta);
    if (!planta) return;
    const input = document.getElementById("busqueda");
    if (input) input.value = planta.nombre;
    mostrarSeccion("inicio");
    mostrarFichaPlanta(planta, document.getElementById("resultadoBusqueda"));
}

// =====================================================
// MAPA INTERACTIVO DE ÁNCASH
// Los datos provinciales provienen del Excel 300_plantas_separadas_por_provincia_Ancash.xlsx
// =====================================================

async function cargarDatosProvincias() {
    try {
        const respuesta = await fetch("datos/provincias.json");
        if (!respuesta.ok) throw new Error("No se encontró datos/provincias.json");
        datosProvincias = await respuesta.json();
        cargarFiltroGeneros();
        // Mostrar las 300 plantas desde el inicio en Categorías.
        mostrarListaCategoria(plantas, false);
    } catch (error) {
        console.error("Error cargando datos provinciales:", error);
    }
}

function inicializarMapaAncash() {
    const mapa = document.getElementById("mapaAncash");
    if (!mapa) return;

    const conectar = function() {
        const documentoSVG = mapa.contentDocument;
        if (!documentoSVG) return;

        const provincias = documentoSVG.querySelectorAll(".provincia-mapa");
        provincias.forEach(function(provincia) {
            if (provincia.dataset.conectada === "1") return;
            provincia.dataset.conectada = "1";
            provincia.style.cursor = "pointer";
            provincia.setAttribute("tabindex", "0");
            provincia.addEventListener("click", function(evento) {
                evento.stopPropagation();
                seleccionarProvincia(provincia.getAttribute("data-provincia"), provincia);
            });
            provincia.addEventListener("keydown", function(evento) {
                if (evento.key === "Enter" || evento.key === " ") {
                    evento.preventDefault();
                    seleccionarProvincia(provincia.getAttribute("data-provincia"), provincia);
                }
            });
        });
    };

    mapa.addEventListener("load", conectar);
    if (mapa.contentDocument && mapa.contentDocument.documentElement) conectar();
}

function seleccionarProvincia(nombre, elementoSVG) {
    const mapa = document.getElementById("mapaAncash");
    if (mapa && mapa.contentDocument) {
        mapa.contentDocument.querySelectorAll(".provincia-mapa").forEach(p => p.classList.remove("selected"));
        if (elementoSVG) elementoSVG.classList.add("selected");
    }
    mostrarInformacionProvincia(nombre);
}

function mostrarInformacionProvincia(nombre) {
    const contenedor = document.getElementById("informacionProvincia");
    if (!contenedor) return;

    const info = datosProvincias[nombre];
    if (!info) {
        contenedor.innerHTML = `<div class="info-provincia-vacia"><span>⚠️</span><h3>${escapeHtml(nombre)}</h3><p>No hay datos provinciales disponibles.</p></div>`;
        return;
    }

    const ids = new Set(info.plantasIds || []);
    const plantasProvincia = plantas.filter(p => ids.has(Number(p.id)));
    const adecuaciones = info.adecuacionPorPlanta || {};

    const galeria = plantasProvincia.map((planta, index) => `
        <article class="planta-galeria-card">
            <div class="planta-galeria-imagen">
                <img src="imagenes/plantas/${escapeHtml(planta.imagen)}" alt="Imagen de ${escapeHtml(planta.nombre)}" onerror="this.style.display='none';this.parentElement.classList.add('sin-imagen');">
                <span class="planta-imagen-fallback">🌱</span>
            </div>
            <div class="planta-galeria-contenido">
                <h4>${index + 1}. ${escapeHtml(planta.nombre)}</h4>
                <p class="nombre-cientifico">${escapeHtml(planta.nombreCientifico)}</p>
                <div class="planta-clima-mini">
                    <span>⛰️ ${planta.altitud.min}-${planta.altitud.max} m</span>
                    <span>🌡️ ${planta.temperatura.min}-${planta.temperatura.max} °C</span>
                    <span>💧 ${planta.humedad.min}-${planta.humedad.max}%</span>
                </div>
                <small class="adecuacion-planta">${escapeHtml(adecuaciones[String(planta.id)] || "Registrada para esta zona")}</small>
            </div>
        </article>`).join("");

    contenedor.innerHTML = `
        <div class="provincia-seleccionada">
            <div class="provincia-icono">📍</div>
            <span class="etiqueta">PROVINCIA SELECCIONADA</span>
            <h2>${escapeHtml(nombre)}</h2>
            <p>Zona: <strong>${escapeHtml(info.zona)}</strong>. Datos tomados de la base provincial de 300 plantas.</p>

            <div class="provincia-datos-clima">
                <div><span>⛰️</span><strong>Altitud de referencia</strong><small>${escapeHtml(info.altitudReferencia)} m</small></div>
                <div><span>🌡️</span><strong>Temperatura de referencia</strong><small>${escapeHtml(info.temperaturaReferencia)}</small></div>
                <div><span>🟢</span><strong>Adecuadas</strong><small>${info.adecuadas}</small></div>
                <div><span>🟡</span><strong>Con condiciones</strong><small>${info.adecuadasConCondiciones}</small></div>
            </div>

            <div class="provincia-plantas">
                <h3>🌱 Plantas registradas para ${escapeHtml(nombre)} (${plantasProvincia.length})</h3>
                <div class="galeria-plantas-provincia">${galeria || `<div class="sin-plantas-provincia"><span>🌱</span><p>No hay plantas registradas para esta provincia.</p></div>`}</div>
            </div>
        </div>`;
}

window.addEventListener("load", function () {
    inicializarMapaAncash();
});


// =====================================================
// CENTRO DE INSECTOS Y BICHOS
// =====================================================

let baseBichosAncash = {};

async function cargarBichosAncash(){
    try{
        const respuesta = await fetch("datos/bichos.json");
        if(!respuesta.ok) throw new Error("No se encontró datos/bichos.json");
        const datos = await respuesta.json();
        baseBichosAncash = datos.provincias || {};
        prepararSelectorBichos();
    }catch(error){
        console.error("Error cargando bichos:", error);
    }
}

function prepararSelectorBichos(){
    const selector=document.getElementById("selectorProvinciaBichos");
    if(!selector) return;
    selector.addEventListener("change", function(){
        mostrarBichosProvincia(this.value);
    });
}

function mostrarBichosProvincia(provincia){
    const vacio=document.getElementById("bichosProvinciaVacia");
    const lista=document.getElementById("listaBichosProvincia");
    if(!vacio || !lista) return;
    if(!provincia){
        vacio.style.display="block";
        lista.innerHTML="";
        return;
    }
    const bichos=baseBichosAncash[provincia] || [];
    vacio.style.display="none";
    lista.innerHTML=bichos.map((bicho,index)=>crearTarjetaBicho(bicho,index+1)).join("");
}

function crearTarjetaBicho(bicho,numero){
    // La imagen es PREDETERMINADA y se toma directamente de bicho.imagen.
    // No hay selector de archivos ni posibilidad de cambiarla desde la página.
    const rutaImagen = normalizarRutaImagenBicho(bicho.imagen);

    return `
        <article class="bicho-card">
            <div class="bicho-imagen">
                <img
                    src="${escapeHtml(rutaImagen)}"
                    alt="Imagen de ${escapeHtml(bicho.nombre)}"
                    loading="lazy"
                    onload="imagenBichoCargada(this)"
                    onerror="imagenBichoNoEncontrada(this)"
                >

                <div class="bicho-imagen-fallback">
                    <span>🖼️</span>
                    <p>Coloca aquí la fotografía predeterminada.</p>
                    <small>Formato: JPG</small>
                </div>
            </div>

            <div class="bicho-info">
                <div class="bicho-superior">
                    <div>
                        <h3>${numero}. ${escapeHtml(bicho.nombre)}</h3>
                        <p class="bicho-cientifico">${escapeHtml(bicho.cientifico)}</p>
                    </div>
                    <span class="bicho-badge">${escapeHtml(bicho.tipo)}</span>
                </div>

                <div class="bicho-datos">
                    <div class="bicho-dato"><strong>📏 Tamaño</strong><span>${escapeHtml(bicho.tamano)}</span></div>
                    <div class="bicho-dato"><strong>⚠️ Peligrosidad</strong><span>${escapeHtml(bicho.peligro)}</span></div>
                    <div class="bicho-dato"><strong>🌦️ ¿Dónde vive?</strong><span>${escapeHtml(bicho.condiciones)}</span></div>
                    <div class="bicho-dato"><strong>🌱 ¿Qué afecta?</strong><span>${escapeHtml(bicho.afecta)}</span></div>
                </div>

                <div class="bicho-seccion"><h4>🐛 ¿Qué daño provoca?</h4><p>${escapeHtml(bicho.daño)}</p></div>
                <div class="bicho-seccion"><h4>🌿 ¿Cómo controlarlo naturalmente?</h4><p>${escapeHtml(bicho.control)}</p></div>
                <div class="bicho-fuente"><strong>Fuente:</strong> ${escapeHtml(bicho.fuente)}</div>
            </div>
        </article>
    `;
}

function normalizarSinTildes(texto){
    return String(texto || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function normalizarRutaImagenBicho(ruta){
    const valor = String(ruta || '').trim();
    if(!valor) return '';

    if(valor.startsWith('http://') || valor.startsWith('https://')){
        return valor;
    }

    if(valor.startsWith('imagenes/')){
        return valor;
    }

    // Todas las fotos predeterminadas del proyecto son JPG.
    return 'imagenes/' + valor.replace(/^\/+/, '');
}

function imagenBichoCargada(img){
    img.style.display = 'block';
    img.classList.add('bicho-foto-activa');

    const fallback = img.parentElement.querySelector('.bicho-imagen-fallback');
    if(fallback) fallback.classList.remove('visible');
}

function imagenBichoNoEncontrada(img){
    img.style.display = 'none';
    const fallback = img.parentElement.querySelector('.bicho-imagen-fallback');
    if(fallback) fallback.classList.add('visible');
}

function escapeHtml(valor){
    return String(valor ?? "").replace(/[&<>'"]/g,function(c){
        return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];
    });
}

window.addEventListener("load", function(){
    cargarBichosAncash();
});
