let instanciaCalendario = null;

async function cargarCitas() {
    const { data, error } = await _supabase
        .from('citas')
        .select('*');
    if (error) {
        console.error('Error al cargar citas: ', error);
        return [];
    }

    return data.map(cita => ({
        title: `${cita.nombre_cliente} - ${cita.servicio}`,
        start: cita.fecha_hora,
        end: cita.fecha_fin
    }));
}

async function refrescarCalendario() {
    if (instanciaCalendario) {
        const citasActualizadas = await cargarCitas();
        instanciaCalendario.removeAllEvents();
        instanciaCalendario.addEventSource(citasActualizadas);
    }
}

document.addEventListener("DOMContentLoaded", async function () {
    const citasGuardadas = await cargarCitas();
    const calendarEl = document.getElementById("calendar");

    instanciaCalendario = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        locale: "es",
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',       
            right: 'dayGridMonth' 
        },
        events: citasGuardadas,
        eventClick: function(info) {
            const nombreCliente = info.event.title;
            const fecha_hora = info.event.start;
            const fecha_fin = info.event.end;
            const fecha_hora_fomateada = fecha_hora ? fecha_hora.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit', hour12: false}) : 'No especificada';
            const fecha_fin_formateada = fecha_fin ? fecha_fin.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit', hour12: false}) : '';
            
            document.getElementById('tituloModal').innerText = nombreCliente;
            document.getElementById('textModal').innerText = `Horario reservado: ${fecha_hora_fomateada} hrs a ${fecha_fin_formateada} hrs`;
            const estructuraModal = document.getElementById('modal-resumen');
            const modalBoostrap = new bootstrap.Modal(estructuraModal);
            modalBoostrap.show();
        }
    });

    instanciaCalendario.render();
});