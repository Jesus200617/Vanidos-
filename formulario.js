document.addEventListener("DOMContentLoaded", async function () {
    const usuario = obtenerUsuarioActivo();
    if (!usuario) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('saludoUsuario').innerText = usuario.nombre;
    document.getElementById('btnCerrarSesion').addEventListener('click', cerrarSesion);

    function mostrarModal(titulo, mensaje) {
        const tituloEl = document.getElementById('tituloModal');
        const textEl = document.getElementById('textModal');
        const modalEl = document.getElementById('modal-resumen');

        if (tituloEl && textEl && modalEl) {
            tituloEl.innerText = titulo;
            textEl.innerText = mensaje;
            const modalBoostrap = new bootstrap.Modal(modalEl);
            modalBoostrap.show();
        } else {
            alert(`${titulo}: ${mensaje}`);
        }
    }

    async function comprobrarHorario() {
        const fecha_obtenida = document.getElementById('fechaCita');
        const selectHora = document.getElementById('opciones_Horario');

        if (!fecha_obtenida.value) {
            selectHora.innerHTML = '<option value="" disabled selected>Elige primero una fecha arriba</option>';
            return;
        }

        selectHora.innerHTML = '<option value="" disabled selected>Buscando horarios disponibles...</option>';

        const inicio_dia = 'T00:00:00-06:00';
        const fin_dia = 'T23:59:59-06:00';
        const fecha_requerida = fecha_obtenida.value + inicio_dia;
        const fecha_limite = fecha_obtenida.value + fin_dia;
        const horasServicio = ["12:00", "13:00", "14:00", "16:00", "17:00", "18:00", "19:00"];
        let horario_ocupado = [];

        const { data, error } = await _supabase
            .from('citas')
            .select('*')
            .gte('fecha_hora', fecha_requerida)
            .lte('fecha_hora', fecha_limite);

        if (error) {
            console.error('Error al consultar disponibilidad:', error);
            selectHora.innerHTML = '<option value="" disabled selected>Error al cargar horarios</option>';
            return;
        }

        data.forEach(cita => {
            const horasOcupadas = new Date(cita.fecha_hora);
            const horasOcupadas_formateadas = horasOcupadas.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            horario_ocupado.push(horasOcupadas_formateadas);
        });

        const horasLibres = horasServicio.filter(h => !horario_ocupado.includes(h));

        selectHora.innerHTML = "";

        if (horasLibres.length === 0) {
            selectHora.innerHTML = '<option value="" disabled selected>Sin horarios libres para este día</option>';
            mostrarModal("Agenda llena", "Todos los horarios de este día ya están ocupados.");
        } else {
            selectHora.insertAdjacentHTML('beforeend', '<option value="" disabled selected>Selecciona una hora disponible</option>');
            horasLibres.forEach(hora => {
                selectHora.insertAdjacentHTML('beforeend', `<option value="${hora}">${hora}</option>`);
            });
        }
    }

    async function enviarCita(e) {
        e.preventDefault();

        const nombreCliente = document.getElementById('NombreCliente').value.trim();
        const servicioCliente = document.getElementById('servicioCliente').value;
        const fecha = document.getElementById('fechaCita').value;
        const horaValor = document.getElementById('opciones_Horario').value;

        if (!nombreCliente || !servicioCliente || !fecha || !horaValor) {
            mostrarModal("Faltan datos", "Por favor completa el nombre del cliente y selecciona una hora válida.");
            return;
        }

        const fechaInicioCliente = `${fecha} ${horaValor}:00-06:00`;
        const [horas, minutos] = horaValor.split(':');
        const horaFin = `${String(parseInt(horas) + 1).padStart(2, '0')}:${minutos}`;
        const fechaFinCliente = `${fecha} ${horaFin}:00-06:00`;

        const { error } = await _supabase
            .from('citas')
            .insert([
                { 
                    nombre_cliente: nombreCliente, 
                    servicio: servicioCliente, 
                    fecha_hora: fechaInicioCliente, 
                    fecha_fin: fechaFinCliente,
                    atendido_por: usuario.nombre
                }
            ]);

        if (error) {
            console.error('Error al guardar:', error);
            mostrarModal("Error", "No se pudo registrar la cita en la base de datos.");
        } else {
            mostrarModal("Cita Registrada", `Cliente: ${nombreCliente} | Servicio: ${servicioCliente} | Atiende: ${usuario.nombre}`);
            document.getElementById('NombreCliente').value = "";
            document.getElementById('opciones_Horario').innerHTML = '<option value="" disabled selected>Elige primero una fecha arriba</option>';
            document.getElementById('fechaCita').value = "";
            if (typeof refrescarCalendario === 'function') {
                await refrescarCalendario();
            }
        }
    }

    document.getElementById('fechaCita').addEventListener('change', comprobrarHorario);
    document.getElementById('formAgendarCita').addEventListener('submit', enviarCita);
});
