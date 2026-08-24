// =====================================================
// PLANTAS DE ÁNCASH
// SISTEMA PRINCIPAL
// =====================================================


// =====================================================
// VARIABLES GLOBALES
// =====================================================

let plantas = [];

let resultadosUltimoAnalisis = [];


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

        console.log(
            "Base de datos cargada:",
            plantas.length,
            "plantas"
        );

        // Actualizar favoritos después de cargar las plantas
        mostrarFavoritos();

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
// BUSCAR PLANTA
// =====================================================

function buscarPlanta() {

    const input =
        document.getElementById("busqueda");


    const texto =
        normalizarTexto(input.value);


    const resultado =
        document.getElementById(
            "resultadoBusqueda"
        );


    if (texto === "") {

        resultado.innerHTML = `

            <div class="ficha-planta">

                <h3>⚠️ Escribe una planta</h3>

                <p>
                    Introduce el nombre de una
                    planta para realizar la búsqueda.
                </p>

            </div>

        `;

        return;

    }


    if (plantas.length === 0) {

        resultado.innerHTML = `

            <div class="ficha-planta">

                <h3>⏳ Cargando información...</h3>

                <p>
                    Espera un momento y vuelve a intentar.
                </p>

            </div>

        `;

        return;

    }


    const planta =
        plantas.find(
            function(p) {

                return normalizarTexto(
                    p.nombre
                ).includes(texto);

            }
        );


    if (!planta) {

        resultado.innerHTML = `

            <div class="ficha-planta">

                <h3>
                    ❌ Planta no encontrada
                </h3>

                <p>
                    No encontramos
                    <strong>${input.value}</strong>
                    en nuestra base de datos.
                </p>

                <p>
                    Prueba con:
                    Quinua, Papa, Haba, Oca u Olluco.
                </p>

            </div>

        `;

        return;

    }


    mostrarFichaPlanta(
        planta,
        resultado
    );

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

    const lugar =
        document.getElementById(
            "lugar"
        ).value.trim();


    const altitud =
        Number(
            document.getElementById(
                "altitud"
            ).value
        );


    const temperatura =
        Number(
            document.getElementById(
                "temperatura"
            ).value
        );


    const humedad =
        Number(
            document.getElementById(
                "humedad"
            ).value
        );


    const area =
        Number(
            document.getElementById(
                "area"
            ).value
        );


    const resultado =
        document.getElementById(
            "resultadoZona"
        );


    // -----------------------------------------------
    // VALIDACIÓN
    // -----------------------------------------------

    if (
        lugar === "" ||
        !Number.isFinite(altitud) ||
        !Number.isFinite(temperatura) ||
        !Number.isFinite(humedad) ||
        !Number.isFinite(area) ||
        area <= 0
    ) {

        resultado.innerHTML = `

            <div class="ficha-planta">

                <h3>
                    ⚠️ Datos incompletos
                </h3>

                <p>
                    Completa todos los campos
                    correctamente.
                </p>

            </div>

        `;

        return;

    }


    // -----------------------------------------------
    // ACTUALIZAR CONDICIONES
    // -----------------------------------------------

    document.getElementById(
        "condAltitud"
    ).textContent =
        altitud + " m";


    document.getElementById(
        "condTemperatura"
    ).textContent =
        temperatura + " °C";


    document.getElementById(
        "condHumedad"
    ).textContent =
        humedad + " %";


    document.getElementById(
        "condArea"
    ).textContent =
        area + " m²";


    document.getElementById(
        "condLugar"
    ).textContent =
        "📍 " + lugar;


    // -----------------------------------------------
    // CALCULAR
    // -----------------------------------------------

    const resultados =
        plantas.map(
            function(planta) {

                let puntos = 0;


                const altitudCorrecta =
                    altitud >= planta.altitud.min &&
                    altitud <= planta.altitud.max;


                if (altitudCorrecta) {

                    puntos++;

                }


                const temperaturaCorrecta =
                    temperatura >= planta.temperatura.min &&
                    temperatura <= planta.temperatura.max;


                if (temperaturaCorrecta) {

                    puntos++;

                }


                const humedadCorrecta =
                    humedad >= planta.humedad.min &&
                    humedad <= planta.humedad.max;


                if (humedadCorrecta) {

                    puntos++;

                }


                const cantidad =
                    Math.floor(
                        area /
                        planta.espacioPorPlanta
                    );


                const espacioCorrecto =
                    cantidad >= 1;


                if (espacioCorrecto) {

                    puntos++;

                }


                const compatibilidad =
                    Math.round(
                        (puntos / 4) * 100
                    );


                let nivel;
                let icono;


                if (compatibilidad >= 75) {

                    nivel = "RECOMENDADA";
                    icono = "🟢";

                }

                else if (compatibilidad >= 50) {

                    nivel = "POSIBLE";
                    icono = "🟡";

                }

                else {

                    nivel = "NO RECOMENDADA";
                    icono = "🔴";

                }


                return {

                    planta: planta,

                    compatibilidad:
                        compatibilidad,

                    nivel:
                        nivel,

                    icono:
                        icono,

                    cantidad:
                        cantidad,

                    altitudCorrecta:
                        altitudCorrecta,

                    temperaturaCorrecta:
                        temperaturaCorrecta,

                    humedadCorrecta:
                        humedadCorrecta,

                    espacioCorrecto:
                        espacioCorrecto

                };

            }
        );


    // -----------------------------------------------
    // ORDENAR
    // -----------------------------------------------

    resultados.sort(
        function(a, b) {

            return (
                b.compatibilidad -
                a.compatibilidad
            );

        }
    );


    resultadosUltimoAnalisis =
        resultados;


    // -----------------------------------------------
    // MOSTRAR RESULTADOS
    // -----------------------------------------------

    let html = `

        <div class="ficha-planta">

            <h2>
                🧠 Análisis inteligente
            </h2>

            <p>
                📍 <strong>Zona:</strong>
                ${lugar}
            </p>

            <p>
                ⛰️ <strong>Altitud:</strong>
                ${altitud} m
            </p>

            <p>
                🌡️ <strong>Temperatura:</strong>
                ${temperatura} °C
            </p>

            <p>
                💧 <strong>Humedad:</strong>
                ${humedad} %
            </p>

            <p>
                📐 <strong>Área:</strong>
                ${area} m²
            </p>

            <hr>

            <h2>
                🌱 Resultados
            </h2>

    `;


    resultados.forEach(
        function(r) {

            const p =
                r.planta;


            html += `

                <div class="resultado-planta">

                    <h3>
                        ${r.icono}
                        ${p.nombre}
                    </h3>

                    <h4>
                        Compatibilidad:
                        ${r.compatibilidad}%
                    </h4>

                    <p>
                        <strong>
                            ${r.nivel}
                        </strong>
                    </p>

                    <p>
                        📐 Puedes plantar aproximadamente:

                        <strong>
                            ${r.cantidad}
                        </strong>
                        plantas.
                    </p>


                    <ul>

                        <li>
                            ⛰️ Altitud:
                            ${
                                r.altitudCorrecta
                                ? "🟢 Adecuada"
                                : "🔴 No adecuada"
                            }
                        </li>

                        <li>
                            🌡️ Temperatura:
                            ${
                                r.temperaturaCorrecta
                                ? "🟢 Adecuada"
                                : "🔴 No adecuada"
                            }
                        </li>

                        <li>
                            💧 Humedad:
                            ${
                                r.humedadCorrecta
                                ? "🟢 Adecuada"
                                : "🔴 No adecuada"
                            }
                        </li>

                        <li>
                            📐 Espacio:
                            ${
                                r.espacioCorrecto
                                ? "🟢 Suficiente"
                                : "🔴 Insuficiente"
                            }
                        </li>

                    </ul>


                    <button
                        class="boton-principal"
                        onclick="alternarFavorito(${p.id})"
                    >

                        ${
                            obtenerFavoritos().includes(p.id)
                            ? "⭐ Quitar de favoritos"
                            : "☆ Guardar en favoritos"
                        }

                    </button>

                </div>

            `;

        }
    );


    html += `

        </div>

    `;


    resultado.innerHTML =
        html;


    // -----------------------------------------------
    // ACTUALIZAR RECOMENDACIONES
    // -----------------------------------------------

    actualizarRecomendaciones(
        resultados
    );


    // -----------------------------------------------
    // IR A RECOMENDACIONES
    // -----------------------------------------------

    mostrarSeccion(
        "zona"
    );

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

    const contenedor =
        document.getElementById(
            "listaFavoritos"
        );


    if (!contenedor) {

        return;

    }


    const favoritos =
        obtenerFavoritos();


    const plantasFavoritas =
        plantas.filter(
            function(p) {

                return favoritos.includes(
                    p.id
                );

            }
        );


    if (
        plantasFavoritas.length === 0
    ) {

        contenedor.innerHTML = `

            <div class="mensaje-vacio">

                <span>⭐</span>

                <h2>
                    Todavía no tienes favoritos
                </h2>

                <p>
                    Busca una planta y presiona
                    ☆ para guardarla.
                </p>

            </div>

        `;

        return;

    }


    let html = "";


    plantasFavoritas.forEach(
        function(p) {

            html += `

                <div class="favorito-card">

                    <div>

                        <h2>
                            🌱 ${p.nombre}
                        </h2>

                        <p>
                            ${p.nombreCientifico}
                        </p>

                        <small>
                            ⛰️
                            ${p.altitud.min}
                            -
                            ${p.altitud.max} m
                        </small>

                    </div>


                    <button
                        onclick="alternarFavorito(${p.id})"
                    >

                        🗑️ Quitar

                    </button>

                </div>

            `;

        }
    );


    contenedor.innerHTML =
        html;

}


// =====================================================
// CATEGORÍAS
// =====================================================

function obtenerCategoria(
    nombre
) {

    const n =
        normalizarTexto(nombre);


    if (
        ["papa", "oca", "olluco"]
        .includes(n)
    ) {

        return "tuberculo";

    }


    if (
        n === "quinua"
    ) {

        return "cereal";

    }


    if (
        n === "haba"
    ) {

        return "leguminosa";

    }


    return "otros";

}


// =====================================================
// FILTRAR CATEGORÍA
// =====================================================

function filtrarCategoria(
    categoria
) {

    const lista =
        plantas.filter(
            function(p) {

                return (
                    obtenerCategoria(
                        p.nombre
                    ) === categoria
                );

            }
        );


    mostrarListaCategoria(
        lista
    );

}


// =====================================================
// MOSTRAR TODAS
// =====================================================

function mostrarTodasLasPlantas() {

    mostrarListaCategoria(
        plantas
    );

}


// =====================================================
// MOSTRAR LISTA CATEGORÍA
// =====================================================

function mostrarListaCategoria(
    lista
) {

    const contenedor =
        document.getElementById(
            "resultadoCategoria"
        );


    if (
        lista.length === 0
    ) {

        contenedor.innerHTML =
            "<p>No hay plantas disponibles.</p>";

        return;

    }


    let html = `

        <div class="ficha-planta">

            <h2>
                🌱 Plantas encontradas
            </h2>

    `;


    lista.forEach(
        function(p) {

            html += `

                <div class="resultado-planta">

                    <h3>
                        🌱 ${p.nombre}
                    </h3>

                    <p>
                        ${p.nombreCientifico}
                    </p>

                    <p>
                        ⛰️
                        ${p.altitud.min}
                        -
                        ${p.altitud.max} m
                    </p>

                    <p>
                        🌡️
                        ${p.temperatura.min}
                        -
                        ${p.temperatura.max} °C
                    </p>

                    <button
                        class="boton-principal"
                        onclick="
                            seleccionarPlantaDesdeCategoria(
                                '${p.nombre}'
                            )
                        "
                    >
                        Ver planta
                    </button>

                </div>

            `;

        }
    );


    html += "</div>";


    contenedor.innerHTML =
        html;


    contenedor.scrollIntoView({
        behavior: "smooth"
    });

}


// =====================================================
// ABRIR PLANTA DESDE CATEGORÍA
// =====================================================

function seleccionarPlantaDesdeCategoria(
    nombre
) {

    document.getElementById(
        "busqueda"
    ).value = nombre;


    mostrarSeccion(
        "inicio"
    );


    buscarPlanta();

}

// =====================================================
// MAPA INTERACTIVO DE ÁNCASH
// =====================================================

// El SVG conserva sus 20 provincias como elementos independientes.
// Este objeto relaciona cada provincia con las plantas disponibles.
// Si luego agregas plantas específicas por provincia, solo cambia estas listas.
const plantasPorProvincia = {
    "Aija": [1, 2, 3, 4, 5],
    "Antonio Raymondi": [1, 2, 3, 4, 5],
    "Asunción": [1, 2, 3, 4, 5],
    "Bolognesi": [1, 2, 3, 4, 5],
    "Carhuaz": [1, 2, 3, 4, 5],
    "Carlos Fermín Fitzcarrald": [1, 2, 3, 4, 5],
    "Casma": [1, 2, 3, 4, 5],
    "Corongo": [1, 2, 3, 4, 5],
    "Huaraz": [1, 2, 3, 4, 5],
    "Huari": [1, 2, 3, 4, 5],
    "Huarmey": [1, 2, 3, 4, 5],
    "Huaylas": [1, 2, 3, 4, 5],
    "Mariscal Luzuriaga": [1, 2, 3, 4, 5],
    "Ocros": [1, 2, 3, 4, 5],
    "Pallasca": [1, 2, 3, 4, 5],
    "Pomabamba": [1, 2, 3, 4, 5],
    "Recuay": [1, 2, 3, 4, 5],
    "Santa": [1, 2, 3, 4, 5],
    "Sihuas": [1, 2, 3, 4, 5],
    "Yungay": [1, 2, 3, 4, 5]
};

// Información base de la provincia para la ficha.
// Se deja explícito que son datos de referencia y no reemplazan una estación
// meteorológica local.
const informacionProvincias = {
    "Aija": { descripcion: "Provincia altoandina de Áncash.", clima: "Condiciones variables según altitud.", altitud: "Variable" },
    "Antonio Raymondi": { descripcion: "Provincia andina de Áncash.", clima: "Condiciones variables según altitud.", altitud: "Variable" },
    "Asunción": { descripcion: "Provincia andina de Áncash.", clima: "Condiciones variables según altitud.", altitud: "Variable" },
    "Bolognesi": { descripcion: "Provincia andina de Áncash.", clima: "Condiciones variables según altitud.", altitud: "Variable" },
    "Carhuaz": { descripcion: "Provincia del Callejón de Huaylas.", clima: "Clima variable según piso altitudinal.", altitud: "Variable" },
    "Carlos Fermín Fitzcarrald": { descripcion: "Provincia andina de Áncash.", clima: "Condiciones variables según altitud.", altitud: "Variable" },
    "Casma": { descripcion: "Provincia costera de Áncash.", clima: "Clima costero; varía localmente.", altitud: "Variable" },
    "Corongo": { descripcion: "Provincia andina de Áncash.", clima: "Condiciones variables según altitud.", altitud: "Variable" },
    "Huaraz": { descripcion: "Provincia del Callejón de Huaylas.", clima: "Clima variable según piso altitudinal.", altitud: "Variable" },
    "Huari": { descripcion: "Provincia andina de Áncash.", clima: "Condiciones variables según altitud.", altitud: "Variable" },
    "Huarmey": { descripcion: "Provincia costera de Áncash.", clima: "Clima costero; varía localmente.", altitud: "Variable" },
    "Huaylas": { descripcion: "Provincia del Callejón de Huaylas.", clima: "Clima variable según piso altitudinal.", altitud: "Variable" },
    "Mariscal Luzuriaga": { descripcion: "Provincia andina de Áncash.", clima: "Condiciones variables según altitud.", altitud: "Variable" },
    "Ocros": { descripcion: "Provincia de transición costa-sierra.", clima: "Condiciones variables según altitud.", altitud: "Variable" },
    "Pallasca": { descripcion: "Provincia andina de Áncash.", clima: "Condiciones variables según altitud.", altitud: "Variable" },
    "Pomabamba": { descripcion: "Provincia andina de Áncash.", clima: "Condiciones variables según altitud.", altitud: "Variable" },
    "Recuay": { descripcion: "Provincia del Callejón de Huaylas.", clima: "Clima variable según piso altitudinal.", altitud: "Variable" },
    "Santa": { descripcion: "Provincia costera de Áncash.", clima: "Clima costero; varía localmente.", altitud: "Variable" },
    "Sihuas": { descripcion: "Provincia andina de Áncash.", clima: "Condiciones variables según altitud.", altitud: "Variable" },
    "Yungay": { descripcion: "Provincia del Callejón de Huaylas.", clima: "Clima variable según piso altitudinal.", altitud: "Variable" }
};

function inicializarMapaAncash() {
    const mapa = document.getElementById("mapaAncash");
    if (!mapa) return;

    const conectar = function() {
        const documentoSVG = mapa.contentDocument;
        if (!documentoSVG) return;

        const provincias = documentoSVG.querySelectorAll(".provincia-mapa");

        provincias.forEach(function(provincia) {
            provincia.style.cursor = "pointer";

            provincia.addEventListener("click", function(evento) {
                evento.stopPropagation();

                const nombre = provincia.getAttribute("data-provincia");
                seleccionarProvincia(nombre, provincia);
            });

            provincia.addEventListener("keydown", function(evento) {
                if (evento.key === "Enter" || evento.key === " ") {
                    evento.preventDefault();

                    const nombre = provincia.getAttribute("data-provincia");
                    seleccionarProvincia(nombre, provincia);
                }
            });
        });
    };

    if (mapa.contentDocument && mapa.contentDocument.documentElement) {
        conectar();
    }

    mapa.addEventListener("load", conectar);
}

function seleccionarProvincia(nombre, elementoSVG) {
    const mapa = document.getElementById("mapaAncash");

    if (mapa && mapa.contentDocument) {
        mapa.contentDocument
            .querySelectorAll(".provincia-mapa")
            .forEach(function(provincia) {
                provincia.classList.remove("selected");
            });

        if (elementoSVG) {
            elementoSVG.classList.add("selected");
        }
    }

    mostrarInformacionProvincia(nombre);
}

function mostrarInformacionProvincia(nombre) {
    const contenedor = document.getElementById("informacionProvincia");
    if (!contenedor) return;

    const info = informacionProvincias[nombre] || {
        descripcion: "Información de la provincia.",
        clima: "No registrado",
        altitud: "No registrada"
    };

    const idsPlantas = plantasPorProvincia[nombre] || [];
    const plantasProvincia = plantas.filter(function(planta) {
        return idsPlantas.includes(planta.id);
    });

    const rangos = obtenerRangosClimaticos(plantasProvincia);

    let galeria = "";

    if (plantasProvincia.length === 0) {
        galeria = `
            <div class="sin-plantas-provincia">
                <span>🌱</span>
                <p>No hay plantas registradas para esta provincia.</p>
            </div>
        `;
    } else {
        galeria = plantasProvincia.map(function(planta) {
            const imagen = "imagenes/" + planta.imagen;

            return `
                <article class="planta-galeria-card">
                    <div class="planta-galeria-imagen">
                        <img
                            src="${imagen}"
                            alt="Imagen de ${planta.nombre}"
                            onerror="
                                this.style.display='none';
                                this.parentElement.classList.add('sin-imagen');
                            "
                        >
                        <span class="planta-imagen-fallback">🌱</span>
                    </div>

                    <div class="planta-galeria-contenido">
                        <h4>${planta.nombre}</h4>
                        <p class="nombre-cientifico">${planta.nombreCientifico}</p>

                        <div class="planta-clima-mini">
                            <span>⛰️ ${planta.altitud.min}-${planta.altitud.max} m</span>
                            <span>🌡️ ${planta.temperatura.min}-${planta.temperatura.max} °C</span>
                            <span>💧 ${planta.humedad.min}-${planta.humedad.max}%</span>
                        </div>
                    </div>
                </article>
            `;
        }).join("");
    }

    contenedor.innerHTML = `
        <div class="provincia-seleccionada">
            <div class="provincia-icono">📍</div>

            <span class="etiqueta">PROVINCIA SELECCIONADA</span>

            <h2>${nombre}</h2>

            <p>${info.descripcion}</p>

            <div class="provincia-datos-clima">
                <div>
                    <span>🌦️</span>
                    <strong>Clima</strong>
                    <small>${info.clima}</small>
                </div>

                <div>
                    <span>⛰️</span>
                    <strong>Altitud</strong>
                    <small>${info.altitud}</small>
                </div>

                <div>
                    <span>🌡️</span>
                    <strong>Rangos de cultivos</strong>
                    <small>${rangos.temperatura}</small>
                </div>

                <div>
                    <span>💧</span>
                    <strong>Humedad de cultivos</strong>
                    <small>${rangos.humedad}</small>
                </div>
            </div>

            <div class="provincia-plantas">
                <h3>🌱 Plantas registradas en ${nombre}</h3>

                <div class="galeria-plantas-provincia">
                    ${galeria}
                </div>
            </div>
        </div>
    `;
}

function obtenerRangosClimaticos(lista) {
    if (!lista.length) {
        return {
            temperatura: "Sin datos",
            humedad: "Sin datos"
        };
    }

    const temperaturasMin = lista.map(p => p.temperatura.min);
    const temperaturasMax = lista.map(p => p.temperatura.max);
    const humedadesMin = lista.map(p => p.humedad.min);
    const humedadesMax = lista.map(p => p.humedad.max);

    return {
        temperatura:
            Math.min(...temperaturasMin) + "–" +
            Math.max(...temperaturasMax) + " °C",

        humedad:
            Math.min(...humedadesMin) + "–" +
            Math.max(...humedadesMax) + " %"
    };
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
