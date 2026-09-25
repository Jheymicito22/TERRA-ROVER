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
// Información provincial integrada en el módulo.
// =====================================================

async function cargarDatosProvincias() {
    try {
        const respuesta = await fetch("datos/provincias.json");
        if (!respuesta.ok) throw new Error("No se encontró datos/provincias.json");
        datosProvincias = await respuesta.json();
        cargarFiltroGeneros();
        // Mostrar las plantas disponibles desde el inicio en Categorías.
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
            <p>Zona: <strong>${escapeHtml(info.zona)}</strong>. Información disponible para esta provincia.</p>

            <div class="provincia-datos-clima">
                <div><span>⛰️</span><strong>Altitud de referencia</strong><small>${escapeHtml(info.altitudReferencia)} m</small></div>
                <div><span>🌡️</span><strong>Temperatura de referencia</strong><small>${escapeHtml(info.temperaturaReferencia)}</small></div>
                <div><span>🟢</span><strong>Adecuadas</strong><small>${info.adecuadas}</small></div>
                <div><span>🟡</span><strong>Con condiciones</strong><small>${info.adecuadasConCondiciones}</small></div>
            </div>

            <div class="provincia-plantas">
                <h3>🌱 Plantas registradas para ${escapeHtml(nombre)}</h3>
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


/* =========================================================
   HERRAMIENTAS AGRÍCOLAS — LÓGICA INTEGRADA
   Identificadores propios ha-* para no interferir con el sistema existente.
========================================================= */
(function(){
    'use strict';

    const HA_KEY = 'plantasAncash_herramientas_v1';
    let haMap = null;
    let haMarker = null;
    let haDrawnItems = null;
    let haWeatherChart = null;
    let haLat = null;
    let haLon = null;
    let haAreaM2 = null;
    let haDecisionBarChart = null;
    let haDecisionProvinceChart = null;

    const cultivos = {
        papa:{nombre:'Papa blanca',cientifico:'Solanum tuberosum',altMin:2500,altMax:4000,tempMin:6,tempMax:18,humMin:45,humMax:80,ciclo:120,rend:25,precio:1.20,plaga:'Rancha (Phytophthora infestans)',suelo:'Franco a franco arenoso',ph:'5.0–6.5'},
        mango:{nombre:'Mango',cientifico:'Mangifera indica',altMin:0,altMax:800,tempMin:18,tempMax:32,humMin:45,humMax:75,ciclo:180,rend:20,precio:3.50,plaga:'Mosca de la fruta',suelo:'Franco limoso',ph:'5.5–7.0'},
        palta:{nombre:'Palta Hass',cientifico:'Persea americana',altMin:0,altMax:1500,tempMin:10,tempMax:28,humMin:45,humMax:75,ciclo:210,rend:15,precio:4.80,plaga:'Arañita roja',suelo:'Franco arenoso con buen drenaje',ph:'5.5–6.5'},
        esparrago:{nombre:'Espárrago',cientifico:'Asparagus officinalis',altMin:0,altMax:500,tempMin:13,tempMax:30,humMin:45,humMax:85,ciclo:150,rend:12,precio:5.50,plaga:'Prodiplosis longifila',suelo:'Arenoso profundo',ph:'6.5–7.5'},
        quinua:{nombre:'Quinua',cientifico:'Chenopodium quinoa',altMin:2500,altMax:3800,tempMin:4,tempMax:20,humMin:35,humMax:75,ciclo:160,rend:2.5,precio:6.00,plaga:'Mildiu',suelo:'Franco arcilloso',ph:'6.0–8.5'},
        maiz:{nombre:'Maíz',cientifico:'Zea mays',altMin:0,altMax:1500,tempMin:14,tempMax:30,humMin:45,humMax:80,ciclo:140,rend:10,precio:1.10,plaga:'Spodoptera frugiperda',suelo:'Franco arcilloso',ph:'6.0–7.0'}
    };

    const cultivosDB = {};
    let catalogoDBListo = false;

    function normalizarTextoHA(v){
        return String(v ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
    }

    function rangoDB(p,campo){
        const x=p?.[campo];
        if(x && Number.isFinite(Number(x.min)) && Number.isFinite(Number(x.max))) return [Number(x.min),Number(x.max)];
        return null;
    }

    function perfilCultivoDesdeDB(p){
        if(!p) return null;
        const alt=rangoDB(p,'altitud'), temp=rangoDB(p,'temperatura'), hum=rangoDB(p,'humedad');
        const key='db-'+p.id;
        return cultivosDB[key] || (cultivosDB[key]={
            nombre:p.nombre||'Planta sin nombre', cientifico:p.nombreCientifico||'',
            altMin:alt?alt[0]:null, altMax:alt?alt[1]:null,
            tempMin:temp?temp[0]:null, tempMax:temp?temp[1]:null,
            humMin:hum?hum[0]:null, humMax:hum?hum[1]:null,
            suelo:p.suelo||'No registrado', luz:p.luz||'No registrada', espacio:p.espacioRango||'No registrado',
            imagen:p.imagen||'', taxonomia:p.taxonomia||{}, db:true, planta:p,
            ciclo:null,rend:null,precio:null,plaga:null,ph:null
        });
    }

    function obtenerCultivoActivo(){
        const key=$ha('ha-cultivo')?.value;
        if(!key) return null;
        return cultivos[key] || cultivosDB[key] || null;
    }

    function construirCatalogoCultivosDB(){
        if(typeof plantas==='undefined'||!Array.isArray(plantas)||!plantas.length){ setTimeout(construirCatalogoCultivosDB,500); return; }
        const sel=$ha('ha-cultivo'); if(!sel) return;
        const search=$ha('ha-cultivo-buscar'); const prev=sel.value;
        plantas.forEach(p=>perfilCultivoDesdeDB(p));
        const render=(query='')=>{
            const q=normalizarTextoHA(query);
            const encontrados=plantas.filter(p=>{const t=normalizarTextoHA((p.nombre||'')+' '+(p.nombreCientifico||''));return !q||t.includes(q);});
            const ref='<optgroup label="Cultivos de referencia"><option value="papa">Papa blanca</option><option value="mango">Mango</option><option value="palta">Palta Hass</option><option value="esparrago">Espárrago</option><option value="quinua">Quinua</option><option value="maiz">Maíz</option></optgroup>';
            const db=encontrados.map(p=>`<option value="db-${haEsc(p.id)}">🌿 ${haEsc(p.nombre)}${p.nombreCientifico?' · '+haEsc(p.nombreCientifico):''}</option>`).join('');
            sel.innerHTML=ref+'<optgroup label="Plantas disponibles">'+db+'</optgroup>';
            if(prev && (cultivos[prev]||cultivosDB[prev])) sel.value=prev;
            const counter=$ha('ha-cultivo-contador'); if(counter) counter.textContent=encontrados.length ? 'Varias plantas disponibles' : 'No se encontraron plantas con esa búsqueda';
            actualizarPreviewCultivoDB();
        };
        render(search?.value||'');
        if(search){ search.oninput=()=>render(search.value); }
        if(!sel.dataset.dbChange){
            sel.dataset.dbChange='1'; sel.addEventListener('change',actualizarPreviewCultivoDB);
        }
        catalogoDBListo=true;
    }

    function actualizarPreviewCultivoDB(){
        const key=$ha('ha-cultivo')?.value, box=$ha('ha-cultivo-base-preview'); if(!box) return;
        const c=obtenerCultivoActivo();
        if(!key||!c){box.classList.remove('ha-cultivo-db-activo');return;}
        if(c.db){
            const p=c.planta, alt=(c.altMin!=null&&c.altMax!=null)?`${c.altMin}–${c.altMax} m`:'--', temp=(c.tempMin!=null&&c.tempMax!=null)?`${c.tempMin}–${c.tempMax} °C`:'--', hum=(c.humMin!=null&&c.humMax!=null)?`${c.humMin}–${c.humMax} %`:'--';
            box.classList.add('ha-cultivo-db-activo');
            box.innerHTML=`<div class="ha-cultivo-base-icon">🌿</div><div><strong>${haEsc(c.nombre)}</strong><p>${haEsc(c.cientifico||'Sin nombre científico')} · Altitud ${alt} · Temperatura ${temp} · Humedad ${hum} · Suelo: ${haEsc(c.suelo||'No registrado')} · Luz: ${haEsc(c.luz||'No registrada')}</p></div><span id="ha-cultivo-base-badge">DISPONIBLE</span>`;
        } else {
            box.classList.remove('ha-cultivo-db-activo');
            box.innerHTML=`<div class="ha-cultivo-base-icon">🌱</div><div><strong>${haEsc(c.nombre)}</strong><p>Cultivo de referencia. También puedes buscar una planta específica entre las plantas disponibles en tu base.</p></div><span id="ha-cultivo-base-badge">REFERENCIA</span>`;
        }
    }

    function $ha(id){ return document.getElementById(id); }
    function haEsc(v){ return String(v ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
    function haToast(msg){
        if(typeof mostrarToast === 'function'){ mostrarToast(msg,'info'); return; }
        const box=document.createElement('div'); box.textContent=msg; box.style.cssText='position:fixed;right:20px;bottom:20px;z-index:99999;background:#315d39;color:white;padding:12px 16px;border-radius:10px;box-shadow:0 8px 25px #0002'; document.body.appendChild(box); setTimeout(()=>box.remove(),2800);
    }

    function iniciarMapa(){
        const el=$ha('ha-mapa');
        if(!el || !window.L || haMap) return;
        haMap=L.map(el,{zoomControl:true}).setView([9.52,-77.53],9);
        const haSat=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,maxNativeZoom:19,attribution:'Tiles © Esri'}).addTo(haMap);
        let haOsmFallback=null;
        haSat.on('tileerror',()=>{
            if(haOsmFallback)return;
            haMap.removeLayer(haSat);
            haOsmFallback=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,maxNativeZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(haMap);
        });
        haDrawnItems=new L.FeatureGroup(); haMap.addLayer(haDrawnItems);
        const drawControl=new L.Control.Draw({position:'topright',draw:{polyline:false,rectangle:false,circle:false,circlemarker:false,marker:true,polygon:{allowIntersection:false,showArea:true,shapeOptions:{color:'#4f9c49'}}},edit:{featureGroup:haDrawnItems}});
        haMap.addControl(drawControl);
        haMap.on(L.Draw.Event.CREATED,e=>{
            haDrawnItems.clearLayers(); haDrawnItems.addLayer(e.layer);
            if(e.layer.getLatLngs) haAreaM2=L.GeometryUtil.geodesicArea(e.layer.getLatLngs()[0]);
            actualizarArea();
        });
        haMap.on(L.Draw.Event.EDITED,e=>{e.layers.eachLayer(layer=>{if(layer.getLatLngs) haAreaM2=L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);}); actualizarArea();});
        haMap.on(L.Draw.Event.DELETED,()=>{haAreaM2=null; actualizarArea();});
    }

    function actualizarArea(){
        $ha('ha-area').textContent=haAreaM2==null?'--':(haAreaM2<10000?haAreaM2.toFixed(1)+' m²':(haAreaM2/10000).toFixed(3)+' ha');
    }

    function centrarUbicacion(lat,lon){
        haLat=Number(lat); haLon=Number(lon);
        $ha('ha-lat').textContent=haLat.toFixed(6); $ha('ha-lon').textContent=haLon.toFixed(6);
        if(haMap){ haMap.setView([haLat,haLon],15); if(haMarker) haMap.removeLayer(haMarker); haMarker=L.marker([haLat,haLon]).addTo(haMap).bindPopup('Ubicación de la parcela').openPopup(); }
        $ha('ha-estado-gps').textContent='Ubicación obtenida correctamente.';
        consultarClima();
    }

    function obtenerGPS(){
        if(!navigator.geolocation){ $ha('ha-estado-gps').textContent='Este navegador no permite geolocalización.'; return; }
        $ha('ha-estado-gps').textContent='Obteniendo ubicación…';
        navigator.geolocation.getCurrentPosition(p=>centrarUbicacion(p.coords.latitude,p.coords.longitude),()=>{$ha('ha-estado-gps').textContent='No se pudo obtener la ubicación. Revisa los permisos del navegador.';},{enableHighAccuracy:true,timeout:12000,maximumAge:300000});
    }

    async function consultarClima(){
        if(haLat==null || haLon==null){$ha('ha-clima-estado').textContent='Obtén una ubicación para consultar el clima.';return;}
        $ha('ha-clima-estado').textContent='Consultando condiciones meteorológicas…';
        try{
            const url=`https://api.open-meteo.com/v1/forecast?latitude=${haLat}&longitude=${haLon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,shortwave_radiation&hourly=temperature_2m,relative_humidity_2m&forecast_days=1&timezone=auto`;
            const r=await fetch(url); if(!r.ok) throw new Error('clima'); const d=await r.json();
            const c=d.current||{};
            $ha('ha-temp').textContent=(c.temperature_2m??'--')+' °C';
            $ha('ha-humedad').textContent=(c.relative_humidity_2m??'--')+' %';
            $ha('ha-viento').textContent=(c.wind_speed_10m??'--')+' km/h';
            $ha('ha-radiacion').textContent=(c.shortwave_radiation??'--')+' W/m²';
            $ha('ha-clima-estado').textContent='Datos actuales obtenidos para las coordenadas de tu parcela.';
            dibujarClima(d.hourly);
            const diag=$ha('ha-diagnostico'); if(diag&&!diag.classList.contains('ha-oculto')&&$ha('ha-cultivo')?.value) setTimeout(()=>evaluar(false),80);
        }catch(e){$ha('ha-clima-estado').textContent='No se pudo consultar el servicio meteorológico. Puedes continuar con el análisis de la parcela.';}
    }

    function dibujarClima(hourly){
        if(!window.Chart || !hourly) return;
        const ctx=$ha('ha-grafico-clima'); if(!ctx) return;
        if(haWeatherChart) haWeatherChart.destroy();
        const labels=(hourly.time||[]).slice(0,24).map(x=>x.slice(11,16));
        const data=(hourly.temperature_2m||[]).slice(0,24);
        haWeatherChart=new Chart(ctx,{type:'line',data:{labels,datasets:[{label:'Temperatura °C',data,borderWidth:2,pointRadius:1,tension:.35}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,labels:{font:{size:10}}}},scales:{x:{ticks:{font:{size:8},maxTicksLimit:8}},y:{ticks:{font:{size:9}}}}}});
    }

    function datosClima(){
        return {temp:parseFloat(($ha('ha-temp').textContent||'').replace(',','.')),hum:parseFloat(($ha('ha-humedad').textContent||'').replace(',','.'))};
    }

    function cargarProvinciasDecisiones(){
        const sel=$ha('ha-decision-provincia'); if(!sel||typeof datosProvincias==='undefined') return; const note=document.querySelector('.ha-decision-tools-note'); if(note) note.remove();
        const prev=sel.value; sel.innerHTML='<option value="">-- Selecciona una provincia (opcional) --</option>'+Object.keys(datosProvincias).sort().map(p=>`<option value="${haEsc(p)}">${haEsc(p)}</option>`).join('');
        if(prev)sel.value=prev;
        sel.addEventListener('change',()=>{const ext=$ha('selectorProvinciaBichos');if(ext&&ext.value!==sel.value){ext.value=sel.value;ext.dispatchEvent(new Event('change'));} const d=$ha('ha-diagnostico'); if(d&&!d.classList.contains('ha-oculto')&&$ha('ha-cultivo')?.value)evaluar(false);});
    }

    function puntajeRangoDisponibilidad(valor, rango){
        if(!Number.isFinite(Number(valor)) || !Array.isArray(rango) || rango.length<2) return null;
        const v=Number(valor), min=Number(rango[0]), max=Number(rango[1]);
        if(!Number.isFinite(min)||!Number.isFinite(max)||max<min) return null;
        if(v>=min && v<=max) return 100;
        const amplitud=Math.max(max-min,1);
        const distancia=v<min ? min-v : v-max;
        return Math.max(0,Math.round(100-(distancia/amplitud)*100));
    }

    function puntajeEstadoProvincial(estado){
        const e=normalizarTextoHA(estado);
        if(e.includes('adecuada con condiciones')) return 70;
        if(e==='adecuada' || e.includes('adecuada')) return 100;
        if(e.includes('no recomendada')) return 15;
        return null;
    }

    function evaluar(registrar=true){
        const key=$ha('ha-cultivo').value;
        if(!key){
            $ha('ha-diagnostico').classList.remove('ha-oculto');
            $ha('ha-diagnostico').innerHTML='<h3>Selecciona un cultivo</h3><p>Busca una planta disponible o elige un cultivo de referencia para generar el análisis.</p>';
            return;
        }

        const c=obtenerCultivoActivo(), clima=datosClima();
        if(!c){
            $ha('ha-diagnostico').classList.remove('ha-oculto');
            $ha('ha-diagnostico').innerHTML='<h3>Registro no disponible</h3><p>No se pudo cargar la ficha seleccionada.</p>';
            return;
        }

        const tempRange=(c.tempMin!=null&&c.tempMax!=null)?[Number(c.tempMin),Number(c.tempMax)]:null;
        const humRange=(c.humMin!=null&&c.humMax!=null)?[Number(c.humMin),Number(c.humMax)]:null;
        const tempScore=puntajeRangoDisponibilidad(clima.temp,tempRange);
        const humScore=puntajeRangoDisponibilidad(clima.hum,humRange);
        const tempOk=tempScore===null?null:tempScore>=100;
        const humOk=humScore===null?null:humScore>=100;

        const phVal=Number($ha('ha-pro-ph')?.value);
        const phRange=c.ph?(()=>{const m=String(c.ph).match(/(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)/);return m?[+m[1],+m[2]]:null;})():null;
        const phScore=puntajeRangoDisponibilidad(phVal,phRange);
        const phOk=phScore===null?null:phScore>=100;

        const soilVal=$ha('ha-pro-suelo')?.value||'';
        let soilScore=null;
        if(soilVal && c.suelo){
            const a=normalizarTextoHA(c.suelo), b=normalizarTextoHA(soilVal);
            soilScore=(a.includes(b)||b.includes(a))?100:35;
        }
        const soilOk=soilScore===null?null:soilScore>=100;

        const provSelect=$ha('ha-decision-provincia');
        const prov=(provSelect?.value||$ha('selectorProvinciaBichos')?.value||'');
        let provincialHTML='';
        let provinceChartData=null;
        let provinceBaseScore=null;
        let estadoPlanta='';

        if(c.db && typeof datosProvincias!=='undefined' && datosProvincias && prov && datosProvincias[prov]){
            const info=datosProvincias[prov];
            estadoPlanta=info.adecuacionPorPlanta?.[String(c.planta.id)]||'No evaluada';
            provinceBaseScore=puntajeEstadoProvincial(estadoPlanta);
            const total=Number(info.totalEvaluado)||0;
            const ade=Number(info.adecuadas)||0;
            const cond=Number(info.adecuadasConCondiciones)||0;
            const no=Number(info.noRecomendadas)||0;
            const pAde=total?Math.round(ade/total*100):0;
            const pCond=total?Math.round(cond/total*100):0;
            const pNo=total?Math.round(no/total*100):0;
            provinceChartData={ade:pAde,cond:pCond,no:pNo};
            provincialHTML=`<div class="ha-db-decision"><div><strong>📍 ${haEsc(prov)}</strong><span>${haEsc(info.zona||'Zona registrada')} · ${haEsc(info.temperaturaReferencia||'')}</span></div><b>${haEsc(estadoPlanta)}</b><div class="ha-db-mini-bars"><span>🌱 Adecuadas <i data-width="${pAde}"></i><em>${pAde}%</em></span><span>⚠️ Con condiciones <i data-width="${pCond}"></i><em>${pCond}%</em></span><span>🚫 No recomendadas <i data-width="${pNo}"></i><em>${pNo}%</em></span></div></div>`;
        }

        // La disponibilidad parte de la adecuación de la planta en la provincia
        // y solo se ajusta con condiciones que realmente estén disponibles.
        // Los datos faltantes no se convierten en 0 %.
        const condicionScores=[];
        if(tempScore!==null) condicionScores.push(tempScore);
        if(humScore!==null) condicionScores.push(humScore);
        if(phScore!==null) condicionScores.push(phScore);
        if(soilScore!==null) condicionScores.push(soilScore);

        let score;
        if(provinceBaseScore!==null){
            const mediaCond=condicionScores.length
                ? condicionScores.reduce((a,b)=>a+b,0)/condicionScores.length
                : null;
            score=Math.round(mediaCond===null ? provinceBaseScore : provinceBaseScore*0.55 + mediaCond*0.45);
        }else if(condicionScores.length){
            score=Math.round(condicionScores.reduce((a,b)=>a+b,0)/condicionScores.length);
        }else{
            score=null;
        }

        const scoreVisible=score===null?0:Math.max(0,Math.min(100,score));
        const estado=score===null?'Pendiente':score>=75?'Condiciones compatibles':score>=50?'Viabilidad intermedia':'Requiere revisión';
        const rows=[];
        if(tempScore!==null) rows.push(['Temperatura',tempScore]);
        if(humScore!==null) rows.push(['Humedad',humScore]);
        if(phScore!==null) rows.push(['pH',phScore]);
        if(soilScore!==null) rows.push(['Suelo',soilScore]);
        if(provinceBaseScore!==null) rows.push(['Adecuación provincial',provinceBaseScore]);

        let pestHTML='';
        if(prov && typeof baseBichosAncash!=='undefined' && baseBichosAncash[prov]){
            const n=normalizarTextoHA(c.nombre);
            const relevant=baseBichosAncash[prov].filter(b=>{
                const a=normalizarTextoHA(b.afecta||'');
                return (n.includes('papa')&&a.includes('papa')) ||
                    (n.includes('mango')&&(a.includes('frut')||a.includes('mango'))) ||
                    (!n.includes('papa')&&!n.includes('mango')&&a.includes('diversos cultivos'));
            });
            if(relevant.length) pestHTML=`<div class="ha-db-plagas"><strong>🛡️ Registros fitosanitarios en ${haEsc(prov)}</strong><div>${relevant.slice(0,4).map(b=>`<span><b>${haEsc(b.nombre)}</b><small>${haEsc(b.peligro||'Registro de vigilancia')}</small></span>`).join('')}</div></div>`;
        }

        const principalTexto=score===null
            ? 'Completa una condición disponible para calcular el índice.'
            : provinceBaseScore!==null
                ? `Índice calculado con la adecuación provincial de la planta${condicionScores.length?' y las condiciones disponibles actualmente':''}.`
                : 'Índice calculado con las condiciones disponibles actualmente.';

        $ha('ha-diagnostico').classList.remove('ha-oculto');
        $ha('ha-diagnostico').innerHTML=`<div class="ha-decision-head"><div><h3>${haEsc(estado)} · ${haEsc(c.nombre)}</h3><p><strong>${haEsc(c.cientifico||'')}</strong> · Información disponible</p></div><div class="ha-score-ring" data-score="${scoreVisible}"><svg viewBox="0 0 42 42"><circle class="bg" cx="21" cy="21" r="15.9155"></circle><circle class="fg" cx="21" cy="21" r="15.9155"></circle></svg><strong>0%</strong></div></div><div class="ha-indicadores"><div class="ha-indicador"><small>Índice de disponibilidad</small><strong data-count-to="${scoreVisible}">0%</strong><div class="ha-progress"><i data-width="${scoreVisible}"></i></div></div><div class="ha-indicador"><small>Temperatura</small><strong>${tempOk===null?'Pendiente':tempOk?'Compatible':'Fuera de rango'}</strong><div class="ha-progress"><i data-width="${tempScore===null?0:tempScore}"></i></div></div><div class="ha-indicador"><small>Humedad</small><strong>${humOk===null?'Pendiente':humOk?'Compatible':'Fuera de rango'}</strong><div class="ha-progress"><i data-width="${humScore===null?0:humScore}"></i></div></div><div class="ha-indicador"><small>pH / suelo</small><strong>${phOk===null&&soilOk===null?'Pendiente':(phOk===false||soilOk===false)?'Revisar':'Compatible'}</strong><div class="ha-progress"><i data-width="${phScore!==null?phScore:(soilScore!==null?soilScore:0)}"></i></div></div></div>${c.db?`<div class="ha-db-ficha"><span>⛰️ Altitud: ${c.altMin!=null?c.altMin+'–'+c.altMax+' m':'No registrada'}</span><span>🌡️ ${c.tempMin!=null?c.tempMin+'–'+c.tempMax+' °C':'No registrada'}</span><span>💧 ${c.humMin!=null?c.humMin+'–'+c.humMax+' %':'No registrada'}</span><span>🪨 ${haEsc(c.suelo||'Suelo no registrado')}</span><span>☀️ ${haEsc(c.luz||'Luz no registrada')}</span><span>📐 ${haEsc(c.espacio||'Espacio no registrado')}</span></div>`:''}<div class="ha-decision-graficas"><div class="ha-decision-chart-card"><div><strong>📊 Compatibilidad por parámetro</strong><small>Los valores se actualizan cuando cambian las condiciones disponibles.</small></div><div class="ha-decision-chart"><canvas id="ha-decision-bar-chart"></canvas></div></div>${provinceChartData?`<div class="ha-decision-chart-card"><div><strong>📍 Adecuación de la provincia</strong><small>Comparación porcentual de las categorías disponibles.</small></div><div class="ha-decision-chart"><canvas id="ha-decision-province-chart"></canvas></div></div>`:''}</div>${provincialHTML}${pestHTML}<div class="ha-alerta ${score!==null&&score>=75?'ha-ok':''}">${haEsc(principalTexto)} Los datos que todavía no estén registrados se mantienen como pendientes y no reducen artificialmente el porcentaje a 0 %.</div>`;
        animarPorcentajes($ha('ha-diagnostico'));
        dibujarGraficasDecision(rows, provinceChartData);
    }

    function destruirGraficasDecision(){
        if(haDecisionBarChart){haDecisionBarChart.destroy();haDecisionBarChart=null;}
        if(haDecisionProvinceChart){haDecisionProvinceChart.destroy();haDecisionProvinceChart=null;}
    }
    function dibujarGraficasDecision(rows, provinceData){
        destruirGraficasDecision();
        if(!window.Chart) return;
        const bar=$ha('ha-decision-bar-chart');
        if(bar){
            const validRows=rows.filter(r=>Number.isFinite(Number(r[1])));
            const labels=validRows.map(r=>r[0]);
            const values=validRows.map(r=>Number(r[1]));
            haDecisionBarChart=new Chart(bar,{type:'bar',data:{labels,datasets:[{label:'Compatibilidad',data:values,borderWidth:1,borderRadius:8,maxBarThickness:24}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,animation:{duration:900,easing:'easeOutQuart'},plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` ${c.raw}%`}}},scales:{x:{beginAtZero:true,max:100,ticks:{callback:v=>v+'%'}},y:{grid:{display:false}}}}});
        }
        const pbar=$ha('ha-decision-province-chart');
        if(pbar&&provinceData){
            haDecisionProvinceChart=new Chart(pbar,{type:'bar',data:{labels:['Adecuadas','Con condiciones','No recomendadas'],datasets:[{label:'Porcentaje',data:[provinceData.ade,provinceData.cond,provinceData.no],borderWidth:1,borderRadius:8,maxBarThickness:30}]},options:{responsive:true,maintainAspectRatio:false,animation:{duration:1100,easing:'easeOutQuart'},plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` ${c.raw}%`}}},scales:{y:{beginAtZero:true,max:100,ticks:{callback:v=>v+'%'}},x:{grid:{display:false}}}}});
        }
    }

    function animarPorcentajes(scope){
        if(!scope) return;
        // Reinicio visual: cada nuevo diagnóstico vuelve a arrancar desde cero.
        scope.querySelectorAll('[data-count-to]').forEach(el=>{
            const target=Math.max(0,Math.min(100,Number(el.dataset.countTo)||0));
            el.textContent='0%';
            const start=performance.now(), dur=1000;
            function tick(now){
                const p=Math.min(1,(now-start)/dur);
                const e=1-Math.pow(1-p,3);
                el.textContent=Math.round(target*e)+'%';
                if(p<1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        });

        const ring=scope.querySelector('.ha-score-ring');
        if(ring){
            const target=Math.max(0,Math.min(100,Number(ring.dataset.score)||0));
            const fg=ring.querySelector('.fg');
            if(fg){
                const len=100.1;
                fg.style.strokeDasharray=`${len} ${len}`;
                fg.style.strokeDashoffset=len;
                requestAnimationFrame(()=>requestAnimationFrame(()=>{
                    fg.style.strokeDashoffset=len-(len*target/100);
                }));
            }
            const strong=ring.querySelector('strong');
            if(strong){
                strong.textContent='0%';
                const start=performance.now(), dur=1000;
                function tickRing(now){
                    const p=Math.min(1,(now-start)/dur);
                    const e=1-Math.pow(1-p,3);
                    strong.textContent=Math.round(target*e)+'%';
                    if(p<1) requestAnimationFrame(tickRing);
                }
                requestAnimationFrame(tickRing);
            }
        }

        scope.querySelectorAll('[data-width]').forEach(bar=>{
            const target=Math.max(0,Math.min(100,Number(bar.dataset.width)||0));
            bar.style.width='0%';
            requestAnimationFrame(()=>requestAnimationFrame(()=>{
                bar.style.width=target+'%';
            }));
        });
    }

    function planificar(){
        const key=$ha('ha-cultivo').value;if(!key){$ha('ha-planificacion').classList.remove('ha-oculto');$ha('ha-planificacion').innerHTML='<h3>Selecciona un cultivo</h3><p>Elige una especie antes de calcular la planificación.</p>';return;}
        const c=obtenerCultivoActivo(), ha=Math.max(.01,Number($ha('ha-hectareas').value)||1), costo=Math.max(0,Number($ha('ha-costo').value)||0), fecha=$ha('ha-fecha-siembra').value;
        if(!c)return;
        if(c.db && (c.rend==null || c.precio==null || c.ciclo==null)){
            $ha('ha-planificacion').classList.remove('ha-oculto');
            $ha('ha-planificacion').innerHTML=`<h3>Planificación basada en tu base · ${haEsc(c.nombre)}</h3><p>La ficha seleccionada sí aporta condiciones ambientales y de suelo, pero tu registro no contiene rendimiento, precio ni ciclo productivo para calcular una proyección económica sin inventar datos.</p><div class="ha-indicadores"><div class="ha-indicador"><small>Área ingresada</small><strong>${ha.toFixed(2)} ha</strong></div><div class="ha-indicador"><small>Temperatura de referencia</small><strong>${c.tempMin!=null?c.tempMin+'–'+c.tempMax+' °C':'Pendiente'}</strong></div><div class="ha-indicador"><small>Suelo</small><strong>${haEsc(c.suelo||'No registrado')}</strong></div></div><div class="ha-alerta ha-ok">Se muestran únicamente datos presentes en tu base de plantas. Puedes completar ciclo, rendimiento y precios reales de tu zona en una futura ampliación de la ficha.</div>`;
            return;
        }
        const produccion=c.rend*ha, ingreso=produccion*1000*c.precio, inversion=costo*ha, neto=ingreso-inversion, roi=inversion?neto/inversion*100:0;
        let dias=''; if(fecha){const f=new Date(fecha+'T00:00:00'); if(!Number.isNaN(f.getTime())){const cosecha=new Date(f);cosecha.setDate(cosecha.getDate()+c.ciclo);dias=cosecha.toLocaleDateString('es-PE');}}
        $ha('ha-planificacion').classList.remove('ha-oculto');
        $ha('ha-planificacion').innerHTML=`<h3>Plan referencial · ${haEsc(c.nombre)}</h3><div class="ha-indicadores"><div class="ha-indicador"><small>Ciclo estimado</small><strong>${c.ciclo} días</strong></div><div class="ha-indicador"><small>Producción referencial</small><strong>${produccion.toFixed(2)} t</strong></div><div class="ha-indicador"><small>Cosecha estimada</small><strong>${dias||'Pendiente'}</strong></div></div><div class="ha-indicadores"><div class="ha-indicador"><small>Ingreso bruto referencial</small><strong>S/ ${ingreso.toFixed(2)}</strong></div><div class="ha-indicador"><small>Inversión</small><strong>S/ ${inversion.toFixed(2)}</strong></div><div class="ha-indicador"><small>Resultado referencial</small><strong>S/ ${neto.toFixed(2)}</strong></div></div><div class="ha-alerta">Los valores económicos son estimaciones de referencia y dependen del rendimiento, precio, costos reales y condiciones de manejo.</div>`;
    }

    function analizarFoto(file){
        const preview=$ha('ha-preview'), result=$ha('ha-resultado-vision'); if(!file)return;
        const reader=new FileReader(); reader.onload=e=>{preview.src=e.target.result;preview.classList.remove('oculto');$ha('ha-analizar-foto').classList.remove('ha-oculto');}; reader.readAsDataURL(file);
        $ha('ha-analizar-foto').onclick=()=>{
            const c=obtenerCultivoActivo();
            result.classList.remove('ha-oculto'); result.innerHTML=`<h3>Revisión visual orientativa</h3><p>La imagen se ha cargado correctamente. ${c?`Para <strong>${haEsc(c.nombre)}</strong>, conviene revisar hojas con manchas, cambios de color, deformaciones, presencia de insectos y distribución del daño.`:'Selecciona un cultivo para contextualizar mejor la revisión.'}</p><div class="ha-alerta">Esta función local no sustituye la identificación de un especialista ni una confirmación de laboratorio. Para una evaluación más precisa, registra síntomas, fecha, ubicación y condiciones ambientales.</div>`;
        };
    }

    function guardarLote(){
        const nombre=$ha('ha-nombre-lote').value.trim();if(!nombre){haToast('Escribe un nombre para el lote.');return;}
        const lote={id:'HA-'+Date.now(),nombre,cultivo:$ha('ha-cultivo').value,fecha:$ha('ha-fecha-siembra').value,hectareas:$ha('ha-hectareas').value,costo:$ha('ha-costo').value,productor:$ha('ha-productor').value,telefono:$ha('ha-telefono').value,lat:haLat,lon:haLon,area:haAreaM2,guardado:new Date().toISOString()};
        const arr=JSON.parse(localStorage.getItem(HA_KEY)||'[]'); const idx=arr.findIndex(x=>x.nombre===nombre); if(idx>=0)arr[idx]=lote;else arr.push(lote); localStorage.setItem(HA_KEY,JSON.stringify(arr)); cargarListaLotes(); haToast('Lote guardado correctamente.');
    }
    function cargarListaLotes(){const s=$ha('ha-lotes-select');if(!s)return;const arr=JSON.parse(localStorage.getItem(HA_KEY)||'[]');s.innerHTML='<option value="">-- Selecciona un lote guardado --</option>';arr.forEach(x=>s.appendChild(new Option(x.nombre,x.id)));}
    function cargarLote(){const id=$ha('ha-lotes-select').value;if(!id)return;const x=(JSON.parse(localStorage.getItem(HA_KEY)||'[]')).find(v=>v.id===id);if(!x)return;$ha('ha-nombre-lote').value=x.nombre;$ha('ha-cultivo').value=x.cultivo||'';$ha('ha-fecha-siembra').value=x.fecha||'';$ha('ha-hectareas').value=x.hectareas||1;$ha('ha-costo').value=x.costo||5000;$ha('ha-productor').value=x.productor||'';$ha('ha-telefono').value=x.telefono||'';if(x.lat&&x.lon)centrarUbicacion(x.lat,x.lon);if(x.area){haAreaM2=Number(x.area);actualizarArea();}haToast('Lote cargado.');}
    function borrarLote(){const id=$ha('ha-lotes-select').value;if(!id)return;const arr=JSON.parse(localStorage.getItem(HA_KEY)||'[]').filter(x=>x.id!==id);localStorage.setItem(HA_KEY,JSON.stringify(arr));cargarListaLotes();haToast('Lote eliminado.');}
    function exportarLotes(){const data=localStorage.getItem(HA_KEY)||'[]';const blob=new Blob([data],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='plantas-ancash-lotes.json';a.click();URL.revokeObjectURL(a.href);}
    function importarLotes(file){if(!file)return;const r=new FileReader();r.onload=()=>{try{const nuevos=JSON.parse(r.result);if(!Array.isArray(nuevos))throw 0;localStorage.setItem(HA_KEY,JSON.stringify(nuevos));cargarListaLotes();haToast('Datos importados correctamente.');}catch(e){haToast('El archivo no tiene un formato válido.');}};r.readAsText(file);}

    function generarEtiqueta(){
        const key=$ha('ha-cultivo').value;if(!key){haToast('Selecciona un cultivo.');return;}
        const c=obtenerCultivoActivo(), id='LT-'+Math.random().toString(36).slice(2,8).toUpperCase(), area=$ha('ha-area').textContent, ubic=haLat!=null?`${haLat.toFixed(5)}, ${haLon.toFixed(5)}`:'No registrada';
        $ha('ha-lbl-lote').textContent=id;$ha('ha-lbl-productor').textContent=$ha('ha-productor').value||'No especificado';$ha('ha-lbl-cultivo').textContent=c.nombre;$ha('ha-lbl-area').textContent=area;$ha('ha-lbl-ubicacion').textContent=ubic;
        const texto=`TRAZABILIDAD AGRÍCOLA\nLOTE: ${id}\nPRODUCTOR: ${$ha('ha-productor').value||'No especificado'}\nCULTIVO: ${c.nombre}\nÁREA: ${area}\nUBICACIÓN: ${ubic}`;
        $ha('ha-qr').src='https://api.qrserver.com/v1/create-qr-code/?size=240x240&data='+encodeURIComponent(texto);
        $ha('ha-etiqueta-wrap').classList.remove('ha-oculto');
    }
    async function descargarEtiqueta(){const el=$ha('ha-etiqueta');if(!window.html2canvas||!el){haToast('No se pudo preparar la etiqueta.');return;}try{const canvas=await html2canvas(el,{scale:3,useCORS:true,backgroundColor:'#ffffff'});const a=document.createElement('a');a.download=`Etiqueta-${$ha('ha-lbl-lote').textContent||'lote'}.png`;a.href=canvas.toDataURL('image/png');a.click();}catch(e){haToast('No se pudo generar la imagen.');}}

    function limpiarParcela(){if(haDrawnItems)haDrawnItems.clearLayers();haAreaM2=null;actualizarArea();if(haMarker){haMap.removeLayer(haMarker);haMarker=null;}haLat=null;haLon=null;$ha('ha-lat').textContent='--';$ha('ha-lon').textContent='--';$ha('ha-estado-gps').textContent='Parcela limpia.';}

    function iniciarModulo(){
        if(!$ha('herramientas')) return;
        iniciarMapa(); cargarListaLotes();
        $ha('ha-btn-gps').addEventListener('click',obtenerGPS);$ha('ha-btn-clima').addEventListener('click',consultarClima);$ha('ha-btn-limpiar').addEventListener('click',limpiarParcela);
        $ha('ha-evaluar').addEventListener('click',()=>evaluar(true));$ha('ha-planificar').addEventListener('click',planificar);$ha('ha-guardar-lote').addEventListener('click',guardarLote);$ha('ha-cargar-lote').addEventListener('click',cargarLote);$ha('ha-borrar-lote').addEventListener('click',borrarLote);$ha('ha-exportar-lotes').addEventListener('click',exportarLotes);$ha('ha-importar-lotes').addEventListener('change',e=>importarLotes(e.target.files[0]));$ha('ha-generar-etiqueta').addEventListener('click',generarEtiqueta);$ha('ha-descargar-etiqueta').addEventListener('click',descargarEtiqueta);
        $ha('ha-drop-area').addEventListener('click',()=>$ha('ha-foto').click());$ha('ha-foto').addEventListener('change',e=>analizarFoto(e.target.files[0]));
        construirCatalogoCultivosDB();
        const esperarProvincias=()=>{if(typeof datosProvincias!=='undefined'&&Object.keys(datosProvincias||{}).length){cargarProvinciasDecisiones();}else setTimeout(esperarProvincias,500);};
        esperarProvincias();
        ['ha-pro-ph','ha-pro-suelo','ha-pro-drenaje','ha-pro-riego'].forEach(id=>$ha(id)?.addEventListener('input',()=>{const d=$ha('ha-diagnostico'); if(d&&!d.classList.contains('ha-oculto')&&$ha('ha-cultivo')?.value) evaluar(false);}));
        document.querySelectorAll('.ha-tab').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.ha-tab').forEach(x=>x.classList.remove('activo'));document.querySelectorAll('.ha-tab-contenido').forEach(x=>x.classList.remove('activo'));btn.classList.add('activo');const panel=document.querySelector(`[data-ha-panel="${btn.dataset.haTab}"]`);if(panel)panel.classList.add('activo');}));
        document.querySelector('.nav-btn[onclick*="herramientas"]')?.addEventListener('click',()=>setTimeout(()=>haMap&&haMap.invalidateSize(),80));
    }

    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciarModulo);else iniciarModulo();
})();


/* =========================================================
   CENTRO PRO — EXTENSIÓN ADITIVA
   No reemplaza la lógica anterior. Lee las variables globales
   existentes: plantas y datosProvincias.
========================================================= */
(function(){
    'use strict';
    const PRO_KEY='plantasAncash_pro_stats_v1';
    let proRangosChart=null, proForecastChart=null, proTimer=null;
    let proLastWeather=null, proElevation=null;
    const $p=id=>document.getElementById(id);
    const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

    const fallbackProfiles={
      papa:{ph:'5.0–6.5',suelo:'Franco arenoso',origen:'Andes sudamericanos; cultivo andino tradicional',temp:[6,18],hum:[45,80]},
      mango:{ph:'5.5–7.0',suelo:'Franco limoso',origen:'Regiones tropicales; cultivado en zonas cálidas del Perú',temp:[18,32],hum:[45,75]},
      palta:{ph:'5.5–6.5',suelo:'Franco arenoso con buen drenaje',origen:'Andes y Mesoamérica; ampliamente cultivada en Perú',temp:[10,28],hum:[45,75]},
      esparrago:{ph:'6.5–7.5',suelo:'Arenoso profundo',origen:'Región mediterránea; cultivo introducido en Perú',temp:[13,30],hum:[45,85]},
      quinua:{ph:'6.0–8.5',suelo:'Franco arcilloso',origen:'Andes de Sudamérica; cultivo ancestral andino',temp:[4,20],hum:[35,75]},
      maiz:{ph:'6.0–7.0',suelo:'Franco arcilloso',origen:'América; cultivo ampliamente adaptado en los Andes',temp:[14,30],hum:[45,80]}
    };

    function stats(){try{return JSON.parse(localStorage.getItem(PRO_KEY)||'{"analisis":0,"clima":0,"gps":0,"plantas":{},"historial":[],"visitas":0}')}catch(e){return {analisis:0,clima:0,gps:0,plantas:{},historial:[],visitas:0};}}
    function saveStats(s){localStorage.setItem(PRO_KEY,JSON.stringify(s)); renderStats();}
    function eventStat(tipo,detalle){const s=stats();if(tipo==='analisis')s.analisis++;if(tipo==='clima')s.clima++;if(tipo==='gps')s.gps++;if(tipo==='planta'&&detalle){s.plantas[detalle]=(s.plantas[detalle]||0)+1;}s.historial.unshift({tipo,detalle:detalle||'',fecha:new Date().toISOString()});s.historial=s.historial.slice(0,12);saveStats(s);}
    function renderStats(){const s=stats();$p('ha-stat-analisis').textContent=s.analisis;$p('ha-stat-clima').textContent=s.clima;$p('ha-stat-gps').textContent=s.gps;$p('ha-stat-plantas').textContent=Object.keys(s.plantas).length;$p('ha-stat-ultima').textContent=s.historial[0]?new Date(s.historial[0].fecha).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'}):'--:--';const list=$p('ha-pro-historial-lista');if(!list)return;list.innerHTML=s.historial.length?s.historial.map(x=>`<div><span>${iconoEvento(x.tipo)}</span><strong>${esc(labelEvento(x.tipo))}</strong><small>${esc(x.detalle||'Actividad registrada')} · ${new Date(x.fecha).toLocaleString('es-PE')}</small></div>`).join(''):'<div class="ha-pro-vacio">Todavía no hay actividad registrada.</div>';}
    function iconoEvento(t){return t==='analisis'?'🔬':t==='clima'?'🌦️':t==='gps'?'📍':'🌱';}
    function labelEvento(t){return t==='analisis'?'Análisis de compatibilidad':t==='clima'?'Actualización meteorológica':t==='gps'?'Ubicación registrada':'Planta consultada';}

    function rango(obj,nombres){for(const n of nombres){const v=obj?.[n];if(v&&Number.isFinite(Number(v.min))&&Number.isFinite(Number(v.max)))return [Number(v.min),Number(v.max)];}return null;}
    function first(obj,nombres){for(const n of nombres){if(obj&&obj[n]!==undefined&&obj[n]!==null&&String(obj[n]).trim()!=='')return obj[n];}return null;}
    function pHRange(v){if(!v)return null;const m=String(v).replace(',','.').match(/(\d+(?:\.\d+)?)\s*[–\-]\s*(\d+(?:\.\d+)?)/);return m?[Number(m[1]),Number(m[2])]:null;}
    function selectedPlant(){const id=$p('ha-pro-planta')?.value;if(!id||typeof plantas==='undefined')return null;return plantas.find(x=>String(x.id)===String(id))||null;}
    function fallbackFor(p){const n=String(p?.nombre||'').toLowerCase();if(n.includes('papa'))return fallbackProfiles.papa;if(n.includes('mango'))return fallbackProfiles.mango;if(n.includes('palta')||n.includes('aguacate'))return fallbackProfiles.palta;if(n.includes('esparr'))return fallbackProfiles.esparrago;if(n.includes('quinua')||n.includes('quinoa'))return fallbackProfiles.quinua;if(n.includes('maiz')||n.includes('maíz'))return fallbackProfiles.maiz;return null;}
    function plantProfile(p){
      if(!p)return null;
      const alt=rango(p,['altitud','elevacion']); const temp=rango(p,['temperatura','temp']); const hum=rango(p,['humedad']);
      const phRaw=first(p,['ph','pH','rangoPh','phSuelo','ph_suelo']); const ph=pHRange(phRaw);
      const soil=first(p,['suelo','tipoSuelo','tipo_suelo','texturaSuelo','textura']);
      const origin=first(p,['origen','procedencia','zonaOrigen','zona_origen','distribucion','regionOrigen','region_origen']);
      return {alt,temp,hum,ph,soil,origin};
    }
    function provincesForPlant(p){
      if(!p||typeof datosProvincias==='undefined'||!datosProvincias)return [];
      const id=Number(p.id), out=[];Object.entries(datosProvincias).forEach(([prov,info])=>{if((info?.plantasIds||[]).map(Number).includes(id))out.push(prov);});return out;
    }
    function fillCatalog(){
      const sel=$p('ha-pro-planta');if(!sel)return;
      if(typeof plantas==='undefined'||!Array.isArray(plantas)||!plantas.length){setTimeout(fillCatalog,500);return;}
      const prev=sel.value;sel.innerHTML='<option value="">-- Selecciona una planta de la base --</option>'+plantas.map(p=>`<option value="${esc(p.id)}">${esc(p.nombre)}${p.nombreCientifico?' · '+esc(p.nombreCientifico):''}</option>`).join('');if(prev)sel.value=prev;updatePlantPanel();
    }
    function updatePlantPanel(){
      const p=selectedPlant(); if(!p){$p('ha-pro-origen').textContent='📍 Origen/procedencia: pendiente';$p('ha-pro-ficha-mini').innerHTML='';$p('ha-pro-ficha-base').innerHTML='<span>🌱 Selecciona una planta de la base para cargar su ficha.</span>';return;}
      const d=plantProfile(p), prov=provincesForPlant(p); const fb=fallbackFor(p);
      const ph=d?.ph?d.ph:(fb?.ph? pHRange(fb.ph):null); const soil=d?.soil||fb?.suelo||'No registrado'; const origin=d?.origin||'';
      $p('ha-pro-origen').innerHTML='📍 <strong>Origen/procedencia:</strong> '+esc(origin|| (prov.length?'Distribución registrada en Áncash':'No registrado en la base')); 
      $p('ha-pro-ficha-mini').innerHTML=`<div><strong>${esc(p.nombre)}</strong><small>${esc(p.nombreCientifico||'')}</small></div><div><span>⛰️</span> ${d?.alt?d.alt.join('–')+' m':'--'}</div><div><span>🌡️</span> ${d?.temp?d.temp.join('–')+' °C':'--'}</div><div><span>💧</span> ${d?.hum?d.hum.join('–')+' %':'--'}</div><div><span>🧪</span> ${ph?ph.join('–'):'--'}</div><div><span>🪨</span> ${esc(soil)}</div>`;
      $p('ha-pro-ficha-base').innerHTML=`<span>🌱 <strong>Registro:</strong> ${esc(p.nombre)}</span><span>🧬 ${esc(p.nombreCientifico||'Sin nombre científico')}</span><span>🪨 Suelo: ${esc(soil)}</span><span>🧪 pH: ${ph?ph.join('–'):'No registrado'}</span>`;
      const dist=$p('ha-pro-distribucion');dist.innerHTML=prov.length?`<div class="ha-pro-prov-grid">${prov.map(x=>`<span>📍 ${esc(x)}</span>`).join('')}</div><p>Distribución registrada en las provincias disponibles.</p>`:`<div class="ha-pro-vacio">No se encontró una asociación provincial para esta planta en la base disponible.</div>`;
      dibujarRangos(p);
    }
    function currentConditions(){
      const ph=Number($p('ha-pro-ph')?.value);const soil=$p('ha-pro-suelo')?.value||'';const drainage=$p('ha-pro-drenaje')?.value||'';const water=$p('ha-pro-riego')?.value||'';
      return {temp:Number.isFinite(proLastWeather?.temp)?proLastWeather.temp:parseFloat(($p('ha-temp')?.textContent||'').replace(',','.')),hum:Number.isFinite(proLastWeather?.hum)?proLastWeather.hum:parseFloat(($p('ha-humedad')?.textContent||'').replace(',','.')),ph:Number.isFinite(ph)?ph:null,soil,drainage,water};
    }
    function drawChart(id,config){if(!window.Chart)return;const ctx=$p(id);if(!ctx)return;return new Chart(ctx,config);}
    function dibujarRangos(p){
      if(!window.Chart)return;const d=plantProfile(p)||{}, fb=fallbackFor(p);const temp=d.temp||fb?.temp, hum=d.hum||fb?.hum, ph=d.ph|| (fb?.ph?pHRange(fb.ph):null);const cur=currentConditions();
      if(proRangosChart)proRangosChart.destroy();
      const labels=[], adequ=[], actual=[]; if(temp){labels.push('Temperatura');adequ.push((temp[0]+temp[1])/2);actual.push(Number.isFinite(cur.temp)?cur.temp:null);}if(hum){labels.push('Humedad');adequ.push((hum[0]+hum[1])/2);actual.push(Number.isFinite(cur.hum)?cur.hum:null);}if(ph){labels.push('pH');adequ.push((ph[0]+ph[1])/2);actual.push(cur.ph);}
      proRangosChart=drawChart('ha-pro-chart-rangos',{type:'bar',data:{labels,datasets:[{label:'Centro del rango adecuado',data:adequ,borderWidth:1},{label:'Condición actual',data:actual,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{position:'bottom'}},scales:{x:{beginAtZero:false}}}});
    }
    function proCoords(){const lat=parseFloat($p('ha-lat')?.textContent||'');const lon=parseFloat($p('ha-lon')?.textContent||'');return Number.isFinite(lat)&&Number.isFinite(lon)?{lat,lon}:null;}
    async function fetchForecast(){const coords=proCoords();if(!coords)return;try{const url=`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,shortwave_radiation,surface_pressure,precipitation&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,shortwave_radiation&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,et0_fao_evapotranspiration&forecast_days=7&timezone=auto`;const r=await fetch(url);if(!r.ok)throw 0;const d=await r.json();proElevation=Number(d.elevation);proLastWeather={temp:Number(d.current?.temperature_2m),hum:Number(d.current?.relative_humidity_2m),viento:Number(d.current?.wind_speed_10m),radiacion:Number(d.current?.shortwave_radiation),presion:Number(d.current?.surface_pressure),precipitacion:Number(d.current?.precipitation)};updateWeatherExtras(d);drawForecast(d.daily);dibujarRangos(selectedPlant());eventStat('clima','Clima y pronóstico actualizados');}catch(e){console.warn('Pronóstico PRO no disponible',e)}}
    function updateWeatherExtras(d){const card=$p('ha-pro-weather-extra');if(!card)return;const c=d.current||{};card.innerHTML=`<span>⛰️ Altitud estimada: <strong>${Number.isFinite(proElevation)?proElevation.toFixed(0):'--'} m</strong></span><span>🧭 Presión: <strong>${c.surface_pressure??'--'} hPa</strong></span><span>🌧️ Precipitación: <strong>${c.precipitation??'--'} mm</strong></span><span>💨 Viento: <strong>${c.wind_speed_10m??'--'} km/h</strong></span><span>☀️ Radiación: <strong>${c.shortwave_radiation??'--'} W/m²</strong></span>`;}
    function drawForecast(day){if(!window.Chart||!day)return; if(proForecastChart)proForecastChart.destroy();const labels=(day.time||[]).map(x=>x.slice(5));proForecastChart=drawChart('ha-pro-chart-pronostico',{type:'line',data:{labels,datasets:[{label:'Máx. °C',data:day.temperature_2m_max||[],borderWidth:2,tension:.3},{label:'Mín. °C',data:day.temperature_2m_min||[],borderWidth:2,tension:.3},{label:'Precip. mm',data:day.precipitation_sum||[],borderWidth:2,tension:.3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom'}},scales:{y:{beginAtZero:true}}}});}
    function scoreRange(v,r){if(!Number.isFinite(v)||!r)return null;if(v>=r[0]&&v<=r[1])return 100;const d=v<r[0]?r[0]-v:v-r[1], span=Math.max(.001,r[1]-r[0]);return Math.max(0,Math.round(100-100*(d/span)));}
    function normalizeSoil(v){return String(v||'').toLowerCase().replace(/franco /,'franco ').trim();}
    function analyze(){const p=selectedPlant();if(!p){$p('ha-pro-diagnostico').innerHTML='<div class="ha-pro-vacio">Selecciona una planta de la base de datos.</div>';return;}const d=plantProfile(p),fb=fallbackFor(p);const temp=d.temp||fb?.temp,hum=d.hum||fb?.hum,ph=d.ph||(fb?.ph?pHRange(fb.ph):null),soil=d.soil||fb?.suelo;const cur=currentConditions();const scores=[];const rows=[];if(temp){const s=scoreRange(cur.temp,temp);if(s!==null){scores.push(s);}rows.push(['Temperatura',cur.temp,temp,s]);}if(hum){const s=scoreRange(cur.hum,hum);if(s!==null){scores.push(s);}rows.push(['Humedad',cur.hum,hum,s]);}if(ph){const s=scoreRange(cur.ph,ph);if(s!==null){scores.push(s);}rows.push(['pH',cur.ph,ph,s]);}if(soil&&cur.soil){const match=normalizeSoil(soil).includes(normalizeSoil(cur.soil))||normalizeSoil(cur.soil).includes(normalizeSoil(soil));const s=match?100:50;scores.push(s);rows.push(['Suelo',cur.soil,[soil],s]);}if(d.alt&&Number.isFinite(proElevation)){const s=scoreRange(proElevation,d.alt);if(s!==null){scores.push(s);}rows.push(['Altitud',proElevation,d.alt,s]);} const score=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):0;const cls=score>=80?'ha-score-alto':score>=60?'ha-score-medio':'ha-score-bajo';$p('ha-pro-diagnostico').innerHTML=`<div class="ha-pro-score ${cls}"><strong>${score}%</strong><span>compatibilidad de los parámetros registrados</span></div><div class="ha-pro-rows">${rows.map(r=>`<div><strong>${esc(r[0])}</strong><span>Actual: ${esc(r[1]??'--')}</span><span>Referencia: ${Array.isArray(r[2])?esc(r[2].join('–')):esc(r[2])}</span><b>${r[3]??'--'}%</b></div>`).join('')}</div><div class="ha-alerta">El índice es una herramienta de apoyo: un parámetro sin medición no se interpreta como favorable. El pH y el tipo de suelo deben proceder de mediciones/registro de la parcela.</div>`;eventStat('analisis',p.nombre);dibujarRangos(p);}
    function iniciarPro(){if(!$p('ha-pro-panel'))return;renderStats();fillCatalog();$p('ha-pro-planta').addEventListener('change',()=>{const p=selectedPlant();if(p)eventStat('planta',p.nombre);updatePlantPanel();});$p('ha-pro-analizar').addEventListener('click',analyze);$p('ha-btn-gps')?.addEventListener('click',()=>setTimeout(fetchForecast,1800));$p('ha-btn-clima')?.addEventListener('click',()=>setTimeout(fetchForecast,500));['ha-pro-ph','ha-pro-suelo','ha-pro-drenaje','ha-pro-riego'].forEach(id=>$p(id)?.addEventListener('input',()=>dibujarRangos(selectedPlant())));$p('ha-pro-limpiar-estadisticas').addEventListener('click',()=>{localStorage.removeItem(PRO_KEY);renderStats();});proTimer=setInterval(fetchForecast,10*60*1000);document.querySelector('.nav-btn[onclick*="herramientas"]')?.addEventListener('click',()=>setTimeout(()=>{fillCatalog();fetchForecast();},150));setTimeout(()=>fetchForecast(),1200);}
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciarPro);else iniciarPro();
})();
