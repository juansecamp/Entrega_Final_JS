const MIN_DATE = new Date(2026, 0, 1); 
const MAX_DATE = new Date(2026, 2, 31); // Marzo 2026 (mes 3)
let currentMonth = new Date(MIN_DATE.getFullYear(), MIN_DATE.getMonth(), 1);
let selectedDate = null;

// Elementos del calendario
const calendarWrapper = document.getElementById('calendar-wrapper');
const daysContainer = document.getElementById('calendar-days');
const monthDisplay = document.getElementById('current-month');
const prevButton = document.getElementById('prev-month');
const nextButton = document.getElementById('next-month');
const mensajeCalendarEspera = document.getElementById('mensaje-calendar-espera');

// Lista de Feriados
const HOLIDAYS = [
    '2026-01-01', // Año Nuevo
    '2026-02-16', // Lunes de Carnaval
    '2026-02-17', // Martes de Carnaval
    '2026-03-24', // Día Nacional de la Memoria

];

/** Verifica si una fecha es feriado. */
const isHoliday = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return HOLIDAYS.includes(dateString);
};

const isDateInRange = (date) => {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const minDateOnly = new Date(MIN_DATE.getFullYear(), MIN_DATE.getMonth(), MIN_DATE.getDate());
    const maxDateOnly = new Date(MAX_DATE.getFullYear(), MAX_DATE.getMonth(), MAX_DATE.getDate());

    return dateOnly >= minDateOnly && dateOnly <= maxDateOnly;
};

const isWeekend = (dayOfWeek) => {
    return dayOfWeek === 0 || dayOfWeek === 6;
};

// Arma el calendario.
const renderCalendar = () => {
    daysContainer.innerHTML = '';
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    monthDisplay.textContent = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7; // Ajusta para que Lunes sea el día 0

    // Días de relleno del mes anterior
    for (let i = 0; i < startDayIndex; i++) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('day', 'other-month');
        daysContainer.appendChild(dayElement);
    }

    // Días del mes actual
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay(); // 0=Dom, 1=Lun, ..., 6=Sáb

        const dayElement = document.createElement('div');
        dayElement.classList.add('day');
        dayElement.textContent = day;

        let isSelectable = true;
        dayElement.classList.add('current-month');

        if (!isDateInRange(date)) {
            dayElement.classList.add('out-of-range');
            isSelectable = false;
        } else if (isWeekend(dayOfWeek)) {
            dayElement.classList.add('weekend');
            dayElement.title = "Fin de Semana";
            isSelectable = false;
        } else if (isHoliday(date)) {
            dayElement.classList.add('holiday');
            dayElement.title = "Feriado Nacional Argentino";
            isSelectable = false;
        }

        if (isSelectable) {
            dayElement.addEventListener('click', () => selectDate(date, dayElement));
        }

        if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
            dayElement.classList.add('selected');
        }

        daysContainer.appendChild(dayElement);
    }

    const isMinMonth = year === MIN_DATE.getFullYear() && month === MIN_DATE.getMonth();
    const isMaxMonth = year === MAX_DATE.getFullYear() && month === MAX_DATE.getMonth();

    prevButton.disabled = isMinMonth;
    nextButton.disabled = isMaxMonth;
};

/** Selecciona un día y busca los turnos para ese día. */
const selectDate = (date, element) => {
    // 1. Limpiar selección anterior
    document.querySelectorAll('.day.selected').forEach(el => el.classList.remove('selected'));
    // 2. Marcar el nuevo día
    element.classList.add('selected');
    selectedDate = date;

    // 3. Pedir y mostrar los turnos para el profesional y la fecha
    handleDateChange();
};

const changeMonth = (direction) => {
    const newMonth = currentMonth.getMonth() + direction;
    const newDate = new Date(currentMonth.getFullYear(), newMonth, 1);

    if (newDate >= MIN_DATE && newDate.getFullYear() <= MAX_DATE.getFullYear() && newDate.getMonth() <= MAX_DATE.getMonth()) {
        currentMonth = newDate;
        renderCalendar();
    }
};


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

const simularDisponibilidadPorDia = () => {
    const data = {};
    const oneDay = 24 * 60 * 60 * 1000;

    for (let d = new Date(MIN_DATE); d <= MAX_DATE; d = new Date(d.getTime() + oneDay)) {
        const dayOfWeek = d.getDay();
        if (isWeekend(dayOfWeek) || isHoliday(d)) continue; // Solo días hábiles

        const dateString = d.toISOString().split('T')[0];
        
// Para cada día (hábil), asigna los turnos ocupados segun el profesional
        Object.keys(DATOS_SIMULADOS).forEach(especialidad => {
            DATOS_SIMULADOS[especialidad].forEach(profesional => {
                const key = `${profesional.id}_${dateString}`;
                
                const turnosProfesional = TURNOS_BASE.map(hora => {

// Turnos ocupados aleatorios por día y por profesional
                    const ocupado = Math.random() < 0.35; 
                    return { hora, ocupado };
                });
                data[key] = turnosProfesional;
            });
        });
    }
    return data;
};


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


const DISPONIBILIDAD_TURNOS_COMPLETA = simularDisponibilidadPorDia();

const texto = document.getElementById('p');
const selectEspecialidad = document.getElementById('select-especialidad');
const selectProfesional = document.getElementById('select-profesional');
const contenedorDinamico = document.getElementById('contenedor-turnos-dinamico');
const listaSeleccionadosDOM = document.getElementById('lista-seleccionados');
const btnGuardar = document.getElementById('btn-guardar');


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

let turnoSeleccionado = null; 
let profesionalSeleccionadoID = null;
let profesionalSeleccionadoNombre = null;
let especialidadSeleccionada = null;

const obtenerEspecialidades = async () => {
    await new Promise(resolve => setTimeout(resolve, 600)); 
    return Object.keys(DATOS_SIMULADOS);
};

const obtenerProfesionales = async (especialidad) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return DATOS_SIMULADOS[especialidad] || [];
};

const obtenerTurnosPorDia = async (profesionalId, dateString) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const key = `${profesionalId}_${dateString}`;
    return DISPONIBILIDAD_TURNOS_COMPLETA[key] || [];
};

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
        selectEspecialidad.innerHTML = '<option value="">Error de carga. Intente recargar.</option>';
    }
};

const handleEspecialidadChange = async () => {
    especialidadSeleccionada = selectEspecialidad.value;

    selectProfesional.innerHTML = '<option value="">Seleccione un profesional</option>';
    selectProfesional.disabled = true;
    
    resetCalendarUI(); // Resetea el calendario al cambiar de especialidad
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
    
    if (profesionalSeleccionadoID) {
        profesionalSeleccionadoNombre = selectProfesional.options[selectProfesional.selectedIndex].text;
        
        mensajeCalendarEspera.classList.add('hidden-element');
        calendarWrapper.classList.remove('hidden-element');
        renderCalendar(); 
        
    } else {
        profesionalSeleccionadoNombre = null;
        resetCalendarUI();
    }
    
    resetTurnoUI(); // Limpia los turnos y la selección
};

const handleDateChange = async () => {
    resetTurnoUI(); // Limpiamos la selección de hora previa

    if (profesionalSeleccionadoID && selectedDate) {
        const dateString = selectedDate.toISOString().split('T')[0];
        const formattedDate = selectedDate.toLocaleDateString('es-AR', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
        
        contenedorDinamico.innerHTML = `<p class="mensaje-espera">Buscando disponibilidad para el ${formattedDate}...</p>`;

        const turnos = await obtenerTurnosPorDia(profesionalSeleccionadoID, dateString);
        
        dibujarTurnosDisponibles(turnos, formattedDate);
    } else {
        contenedorDinamico.innerHTML = '<p class="mensaje-espera">Seleccione una **Fecha** en el calendario para ver los horarios.</p>';
    }
};


const dibujarTurnosDisponibles = (turnos, fechaStr) => {
    contenedorDinamico.innerHTML = ''; 

    if (turnos.length === 0) {
        contenedorDinamico.innerHTML = `<p class="mensaje-espera">No hay disponibilidad de turnos para el ${fechaStr}.</p>`;
        return;
    }
    
    const titulo = document.createElement('h2');
    titulo.textContent = `Horarios disponibles el ${fechaStr}`;
    contenedorDinamico.appendChild(titulo);
    
    const turnosGrid = document.createElement('div');
    turnosGrid.classList.add('turnos-grid');
    
    turnos.forEach(turnoObj => {
        const boton = document.createElement('button');
        
        boton.textContent = turnoObj.hora;
        boton.classList.add('turno-btn');
        boton.setAttribute('data-turno', turnoObj.hora);
        boton.setAttribute('data-ocupado', turnoObj.ocupado);
        
        if (turnoObj.ocupado) {
            boton.setAttribute('disabled', 'disabled'); 
            boton.textContent += ' (Ocupado)'; 
        }
        
        boton.addEventListener('click', manejarSeleccionTurno);
        
        turnosGrid.appendChild(boton);
    });
    
    contenedorDinamico.appendChild(turnosGrid);
};

const actualizarListaSeleccionados = () => {
    listaSeleccionadosDOM.innerHTML = '';
    
    if (turnoSeleccionado && selectedDate) {
        const fecha = selectedDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
        const li = document.createElement('li');
        li.textContent = `${profesionalSeleccionadoNombre} - ${fecha} a las ${turnoSeleccionado} hs.`;
        listaSeleccionadosDOM.appendChild(li);
        btnGuardar.removeAttribute('disabled');
    } else {
        const li = document.createElement('li');
        li.textContent = 'Aún no has seleccionado un turno completo (Profesional y Fecha).';
        listaSeleccionadosDOM.appendChild(li);
        btnGuardar.setAttribute('disabled', 'disabled');
    }
};

const handleDeseleccion = (turnoADeseleccionar) => {
    const botonPreviamenteSeleccionado = document.querySelector(`.turno-btn.seleccionado[data-turno="${turnoADeseleccionar}"]`);
    
    if (botonPreviamenteSeleccionado) {
        botonPreviamenteSeleccionado.classList.remove('seleccionado');
    }
    
    turnoSeleccionado = null;
    actualizarListaSeleccionados();
};

const seleccionarNuevoTurno = (boton, turno) => {
    turnoSeleccionado = turno;
    boton.classList.add('seleccionado');
    
    actualizarListaSeleccionados();
}

const manejarSeleccionTurno = (event) => {
    const boton = event.target;
    const turno = boton.getAttribute('data-turno');
    const estaOcupado = boton.getAttribute('data-ocupado') === 'true';

    if (estaOcupado) {
        Swal.fire({
            icon: 'error',
            title: '¡Turno Ocupado!',
            text: `Lo sentimos, el turno de las ${turno} hs. ya ha sido reservado.`,
            confirmButtonText: 'Entendido',
        });
        return; 
    }

    if (turnoSeleccionado) {
        Swal.fire({
            icon: 'warning',
            title: 'Turno Ya Seleccionado',
            html: `Ya tienes reservada la hora **${turnoSeleccionado} hs.** <br> ¿Quieres reemplazarlo por **${turno} hs.** del ${selectedDate.toLocaleDateString('es-AR')}?`,
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

    seleccionarNuevoTurno(boton, turno);
};

const resetTurnoUI = () => {
    if (turnoSeleccionado) {
        handleDeseleccion(turnoSeleccionado);
    }
    turnoSeleccionado = null; 
    contenedorDinamico.innerHTML = '<p class="mensaje-espera">Selecciona una **Fecha Habil** para ver los horarios disponibles.</p>';
    actualizarListaSeleccionados();
};

const resetCalendarUI = () => {
    selectedDate = null;
    currentMonth = new Date(MIN_DATE.getFullYear(), MIN_DATE.getMonth(), 1); // Vuelve a Diciembre 2025
    
    mensajeCalendarEspera.classList.remove('hidden-element');
    calendarWrapper.classList.add('hidden-element');
    
    document.querySelectorAll('.day.selected').forEach(el => el.classList.remove('selected'));
};


const guardarTurnoFinal = () => {
    if (!turnoSeleccionado || !selectedDate) {
        Swal.fire({
            icon: 'error',
            title: 'Turno Incompleto',
            text: 'Debes seleccionar una Especialidad, un Profesional, una Fecha y una Hora.',
            confirmButtonText: 'Aceptar'
        });
        return;
    }
    
    // Confirma la reserva antes de guardar
    Swal.fire({
        title: '¿Confirmar Reserva?',
        html: `Confirma tu turno para el **${selectedDate.toLocaleDateString('es-AR')}** a las **${turnoSeleccionado} hs.** con el **${profesionalSeleccionadoNombre}** de ${selectEspecialidad.options[selectEspecialidad.selectedIndex].text}.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, Reservar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true
    }).then(async (result) => { 
        if (result.isConfirmed) {
            
            try {
                await new Promise(resolve => setTimeout(resolve, 800)); 

                localStorage.setItem('turnoReservado', JSON.stringify({
                    hora: turnoSeleccionado,
                    fecha: selectedDate.toISOString().split('T')[0],
                    profesional: profesionalSeleccionadoNombre,
                    id: profesionalSeleccionadoID,
                    especialidad: especialidadSeleccionada
                }));
                
                Swal.fire(
                    '¡Reservado con Éxito!',
                    `Tu turno del ${selectedDate.toLocaleDateString('es-AR')} a las ${turnoSeleccionado} hs. ha sido guardado.`,
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
    resetCalendarUI();
    selectEspecialidad.selectedIndex = 0;
    handleEspecialidadChange();
    localStorage.removeItem('turnoReservado');
};

document.addEventListener('DOMContentLoaded', () => {
    llenarEspecialidades(); 

    selectEspecialidad.addEventListener('change', handleEspecialidadChange);
    selectProfesional.addEventListener('change', handleProfesionalChange);
    
    prevButton.addEventListener('click', () => changeMonth(-1));
    nextButton.addEventListener('click', () => changeMonth(1));
    
    btnGuardar.addEventListener('click', guardarTurnoFinal);

    actualizarListaSeleccionados();
});