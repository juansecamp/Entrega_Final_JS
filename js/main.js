// --- UTILIDADES DE TIEMPO Y DATA SIMULADA ---

/**
 * Genera todos los horarios de turno posibles (08:00 a 18:00, cada 30 min).
 */
const generarTurnosCompletos = (inicio, fin) => {
    const turnos = [];
    let tiempoActual = inicio * 60;
    const tiempoFin = fin * 60;
    const intervalo = 30;

    while (tiempoActual < tiempoFin) {
        const hora = Math.floor(tiempoActual / 60);
        const minuto = tiempoActual % 60;

        const horaStr = String(hora).padStart(2, '0');
        const minutoStr = String(minuto).padStart(2, '0');

        turnos.push(`${horaStr}:${minutoStr}`);

        tiempoActual += intervalo;
    }
    return turnos;
};

const TURNOS_BASE = generarTurnosCompletos(8, 18);

/**
 * Simula la asignación aleatoria de turnos ocupados (35% de probabilidad)
 * para cada profesional, representando la disponibilidad del backend.
 */
const simularDisponibilidad = () => {
    const data = {};
    Object.keys(DATOS_SIMULADOS).forEach(especialidad => {
        DATOS_SIMULADOS[especialidad].forEach(profesional => {
            const id = profesional.id;
            const turnosProfesional = TURNOS_BASE.map(hora => {
                const ocupado = Math.random() < 0.35; 
                return { hora, ocupado };
            });
            data[id] = turnosProfesional;
        });
    });
    return data;
};


// Estructura de datos: Especialidad -> Profesionales
const DATOS_SIMULADOS = {
    "cardiologia": [
        { id: "C1", nombre: "Dr. Pérez García" },
        { id: "C2", nombre: "Dra. Ana López" }
    ],
    "pediatria": [
        { id: "P3", nombre: "Dr. Mario Giménez" },
        { id: "P4", nombre: "Dra. Sofía Torres" }
    ],
    "dermatologia": [
        { id: "D5", nombre: "Dr. Pablo Fernández" }
    ]
};

const DISPONIBILIDAD_TURNOS = simularDisponibilidad();

// --- VARIABLES Y ELEMENTOS DOM GLOBALES ---
const texto = document.getElementById('p');
const selectEspecialidad = document.getElementById('select-especialidad');
const selectProfesional = document.getElementById('select-profesional');
const contenedorDinamico = document.getElementById('contenedor-turnos-dinamico');
const listaSeleccionadosDOM = document.getElementById('lista-seleccionados');
const btnGuardar = document.getElementById('btn-guardar');

// Lógica de color de texto intermitente (estética simple)
const colorOriginal = 'black';
const colorAlternativo = 'gray';
let esColorAlternativo = false;

function alternarColor() {
    if (esColorAlternativo) {
        texto.style.color = colorOriginal;
    } else {
        texto.style.color = colorAlternativo;
    }
    esColorAlternativo = !esColorAlternativo;
}
setInterval(alternarColor, 1000);

// Variables de estado del formulario
let turnoSeleccionado = null; 
let profesionalSeleccionadoID = null;
let profesionalSeleccionadoNombre = null;

// --- FUNCIONES ASÍNCRONAS (Simulación de llamadas a API) ---

const obtenerEspecialidades = async () => {
    // Simula latencia de red de 600ms
    await new Promise(resolve => setTimeout(resolve, 600)); 
    return Object.keys(DATOS_SIMULADOS);
};

const obtenerProfesionales = async (especialidad) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return DATOS_SIMULADOS[especialidad] || [];
};

const obtenerTurnos = async (profesionalId) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return DISPONIBILIDAD_TURNOS[profesionalId] || [];
};

// --- MANEJO DE SELECTORES Y RENDERIZADO ---

const llenarEspecialidades = async () => {
    selectEspecialidad.innerHTML = '<option value="">Cargando especialidades...</option>';
    try {
        const especialidades = await obtenerEspecialidades();
        selectEspecialidad.innerHTML = '<option value="">Seleccione una especialidad</option>';
        
        especialidades.forEach(esp => {
            const option = document.createElement('option');
            option.value = esp;
            option.textContent = esp.charAt(0).toUpperCase() + esp.slice(1);
            selectEspecialidad.appendChild(option);
        });
    } catch (error) {
        console.error("Error al cargar especialidades:", error);
        // Manejo de error visible para el usuario si falla la carga inicial
        selectEspecialidad.innerHTML = '<option value="">Error de carga. Intente recargar.</option>';
    }
};

const handleEspecialidadChange = async () => {
    const especialidadSeleccionada = selectEspecialidad.value;

    // Reinicia el selector de profesional y la UI de turnos al cambiar especialidad
    selectProfesional.innerHTML = '<option value="">Seleccione un profesional</option>';
    selectProfesional.disabled = true;
    resetTurnoUI();

    if (especialidadSeleccionada) {
        selectProfesional.innerHTML = '<option value="">Cargando profesionales...</option>';
        const profesionales = await obtenerProfesionales(especialidadSeleccionada);
        
        selectProfesional.innerHTML = '<option value="">Seleccione un profesional</option>';
        profesionales.forEach(prof => {
            const option = document.createElement('option');
            option.value = prof.id; 
            option.textContent = prof.nombre;
            selectProfesional.appendChild(option);
        });
        
        selectProfesional.disabled = false;
    }
};

const handleProfesionalChange = async () => {
    profesionalSeleccionadoID = selectProfesional.value;
    profesionalSeleccionadoNombre = selectProfesional.options[selectProfesional.selectedIndex].text;
    
    resetTurnoUI();

    if (profesionalSeleccionadoID) {
        contenedorDinamico.innerHTML = '<p class="mensaje-espera">Buscando disponibilidad...</p>';

        const turnos = await obtenerTurnos(profesionalSeleccionadoID);
        
        dibujarTurnosDisponibles(turnos);
    } else {
        contenedorDinamico.innerHTML = '<p class="mensaje-espera">Seleccione un **Profesional** para ver la disponibilidad.</p>';
    }
};

/**
 * Dibuja la grilla de turnos, marcando los ocupados con la clase 'ocupado' (rojo/colorado).
 */
const dibujarTurnosDisponibles = (turnos) => {
    contenedorDinamico.innerHTML = ''; 

    if (turnos.length === 0) {
        contenedorDinamico.innerHTML = `<p class="mensaje-espera">No hay disponibilidad de turnos.</p>`;
        return;
    }
    
    const titulo = document.createElement('h2');
    titulo.textContent = 'Grilla de Turnos (08:00 a 18:00)';
    contenedorDinamico.appendChild(titulo);
    
    const turnosGrid = document.createElement('div');
    turnosGrid.classList.add('turnos-grid');
    
    turnos.forEach(turnoObj => {
        const boton = document.createElement('button');
        
        boton.textContent = turnoObj.hora;
        boton.classList.add('turno-btn');
        boton.setAttribute('data-turno', turnoObj.hora);
        // Almacenamos el estado de ocupado en un data-attribute
        boton.setAttribute('data-ocupado', turnoObj.ocupado);
        
        if (turnoObj.ocupado) {
            boton.classList.add('ocupado'); // Usa esta clase para el color rojo en CSS
            boton.textContent += ' (Ocupado)'; 
        }
        
        // Se añade listener a todos; la validación se hace dentro de manejarSeleccionTurno.
        boton.addEventListener('click', manejarSeleccionTurno);
        
        turnosGrid.appendChild(boton);
    });
    
    contenedorDinamico.appendChild(turnosGrid);
};


// --- LÓGICA DE SELECCIÓN Y SWEETALERT ---

const actualizarListaSeleccionados = () => {
    listaSeleccionadosDOM.innerHTML = '';
    
    if (turnoSeleccionado) {
        const li = document.createElement('li');
        li.textContent = `${profesionalSeleccionadoNombre} - ${turnoSeleccionado} hs.`;
        listaSeleccionadosDOM.appendChild(li);
        btnGuardar.removeAttribute('disabled');
    } else {
        const li = document.createElement('li');
        li.textContent = 'Aún no has seleccionado un turno.';
        listaSeleccionadosDOM.appendChild(li);
        btnGuardar.setAttribute('disabled', 'disabled');
    }
};

/**
 * Limpia la selección visualmente y en el estado global.
 */
const handleDeseleccion = (turnoADeseleccionar) => {
    const botonPreviamenteSeleccionado = document.querySelector(`.turno-btn.seleccionado[data-turno="${turnoADeseleccionar}"]`);
    
    if (botonPreviamenteSeleccionado) {
        botonPreviamenteSeleccionado.classList.remove('seleccionado');
        botonPreviamenteSeleccionado.style.pointerEvents = 'auto'; 
    }
    
    turnoSeleccionado = null;
    actualizarListaSeleccionados();
};

/**
 * Marca el nuevo turno como seleccionado, actualizando el estado.
 */
const seleccionarNuevoTurno = (boton, turno) => {
    turnoSeleccionado = turno;
    boton.classList.add('seleccionado');
    // Deshabilita el click directo para forzar la lógica de reemplazo vía SweetAlert
    boton.style.pointerEvents = 'none'; 
    
    actualizarListaSeleccionados();
}

/**
 * Maneja el evento de click: valida ocupado, o pide reemplazar el turno anterior.
 */
const manejarSeleccionTurno = (event) => {
    const boton = event.target;
    const turno = boton.getAttribute('data-turno');
    const estaOcupado = boton.getAttribute('data-ocupado') === 'true';

    // 1. VALIDACIÓN: Turno Ocupado
    if (estaOcupado) {
        Swal.fire({
            icon: 'error',
            title: '¡Turno Ocupado!',
            text: `Lo sentimos, el turno de las ${turno} hs. ya ha sido reservado. Por favor, elige otro horario.`,
            confirmButtonText: 'Entendido',
        });
        return; 
    }

    // 2. VALIDACIÓN: Lógica de Reemplazo
    if (turnoSeleccionado) {
        Swal.fire({
            icon: 'warning',
            title: 'Turno Ya Seleccionado',
            html: `Ya tienes reservada la hora **${turnoSeleccionado} hs.** <br> ¿Quieres reemplazarlo por **${turno} hs.**?`,
            showCancelButton: true,
            confirmButtonText: 'Sí, Reemplazar',
            cancelButtonText: 'No, Mantener',
        }).then((result) => {
            if (result.isConfirmed) {
                handleDeseleccion(turnoSeleccionado);
                seleccionarNuevoTurno(boton, turno);
            }
        });
        return;
    }

    // 3. Selección Normal
    seleccionarNuevoTurno(boton, turno);
};

const resetTurnoUI = () => {
    if (turnoSeleccionado) {
        handleDeseleccion(turnoSeleccionado);
    }
    turnoSeleccionado = null; 
    actualizarListaSeleccionados();
};


const guardarTurnoFinal = () => {
    if (!turnoSeleccionado) {
        Swal.fire({
            icon: 'error',
            title: 'Turno No Elegido',
            text: 'Debes seleccionar una hora con un profesional antes de guardar la reserva.',
            confirmButtonText: 'Aceptar'
        });
        return;
    }
    
    // Confirma la reserva antes de guardar
    Swal.fire({
        title: '¿Confirmar Reserva?',
        html: `Confirma tu turno para las **${turnoSeleccionado} hs.** con el **${profesionalSeleccionadoNombre}** de ${selectEspecialidad.options[selectEspecialidad.selectedIndex].text}.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, Reservar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true
    }).then(async (result) => { 
        if (result.isConfirmed) {
            
            try {
                // Simulación de guardado en servidor (latencia)
                await new Promise(resolve => setTimeout(resolve, 800)); 

                // Guardado en Local Storage (simulado)
                localStorage.setItem('turnoReservado', JSON.stringify({
                    hora: turnoSeleccionado,
                    profesional: profesionalSeleccionadoNombre,
                    id: profesionalSeleccionadoID,
                    especialidad: selectEspecialidad.value
                }));
                
                Swal.fire(
                    '¡Reservado con Éxito!',
                    `Tu turno de las ${turnoSeleccionado} hs. con el ${profesionalSeleccionadoNombre} ha sido guardado.`,
                    'success'
                );
                
            } catch (error) {
                Swal.fire(
                    'Error de Reserva',
                    'Hubo un problema al guardar el turno. Intenta nuevamente.',
                    'error'
                );
            }
            
            setTimeout(() => {
                resetFormularioCompleto();
            }, 1500);
            
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            Swal.fire(
                'Reserva Cancelada',
                'Puedes elegir otro turno si lo deseas.',
                'info'
            );
        }
    });
};


const resetFormularioCompleto = () => {
    resetTurnoUI();
    selectEspecialidad.selectedIndex = 0;
    handleEspecialidadChange();
    localStorage.removeItem('turnoReservado');
};


// --- INICIALIZACIÓN ---

document.addEventListener('DOMContentLoaded', () => {
    // Inicia la carga de las especialidades
    llenarEspecialidades(); 

    // Asigna los Event Listeners para la interacción del usuario
    selectEspecialidad.addEventListener('change', handleEspecialidadChange);
    selectProfesional.addEventListener('change', handleProfesionalChange);
    btnGuardar.addEventListener('click', guardarTurnoFinal);
    
    actualizarListaSeleccionados();
});