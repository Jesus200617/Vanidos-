document.addEventListener("DOMContentLoaded", async function () {
    const usuario = obtenerUsuarioActivo();
    if (!usuario) {
        window.location.href = 'login.html';
        return;
    }

    // Mostrar el nombre del empleado en turno en la barra superior
    document.getElementById('saludoUsuario').innerText = usuario.nombre;
    document.getElementById('btnCerrarSesion').addEventListener('click', cerrarSesion);

    function mostrarModal(titulo, mensaje) {
        document.getElementById('tituloModal').innerText = titulo;
        document.getElementById('textModal').innerText = mensaje;
        const estructuraModal = document.getElementById('modal-resumen');
        const modalBoostrap = new bootstrap.Modal(estructuraModal);
        modalBoostrap.show();
    }

    async function comprobrarHorario() {
        const fecha_obtenida = document.getElementById('fechaCita');
        if (fecha_obtenida.value) {
            const inicio_dia = 'T00:00:00-06:00';
            const fin_dia = 'T23:59:59-06:00';
            const fecha_requerida = fecha_obtenida.value + inicio_dia;
            const fecha_limite = fecha_obtenida.value + fin_dia;
            const horasServicio = ["12:00", "13:00", "14:00", "16:00", "17:00", "18:00", "19:00"];
            let horario_ocupado = [];
            const selectHora = document.getElementById('opciones_Horario');

            const { data, error } = await _supabase
                .from('citas')
                .select('*')
                .gte('fecha_hora', fecha_requerida)
                .lte('fecha_hora', fecha_limite);

            if (error) {
                console.error('Error al consultar disponibilidad:', error);
                return;
            }

            selectHora.innerHTML = "";
            data.forEach(cita => {
                const horasOcupadas = new Date(cita.fecha_hora);
                const horasOcupadas_formateadas = horasOcupadas.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
                horario_ocupado.push(horasOcupadas_formateadas);
            });

            if (horario_ocupado.length >= horasServicio.length) {
                mostrarModal("Agenda llena", "Todos los horarios de este día ya están ocupados.");
            } else {
                for (let i = 0; i < horasServicio.length; i++) {
                    if (!horario_ocupado.includes(horasServicio[i])) {
                        selectHora.insertAdjacentHTML('beforeend', `<option value="${horasServicio[i]}">${horasServicio[i]}</option>`);
                    }
                }
            }
        } else {
            mostrarModal("Error", "Selecciona primero una fecha para revisar los horarios.");
        }
    }

    async function enviarCita(e) {
        e.preventDefault();

        const nombreCliente = document.getElementById('NombreCliente').value.trim();
        const servicioCliente = document.getElementById('servicioCliente').value;
        const fecha = document.getElementById('fechaCita').value;
        const horaValor = document.getElementById('opciones_Horario').value;

        if (!nombreCliente || !servicioCliente || !fecha || !horaValor) {
            mostrarModal("Faltan datos", "Completa el nombre del cliente y selecciona una hora disponible.");
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
            document.getElementById('opciones_Horario').innerHTML = "";
            await refrescarCalendario();
        }
    }

    document.getElementById('btn-disponibilidad').addEventListener('click', comprobrarHorario);
    document.getElementById('formAgendarCita').addEventListener('submit', enviarCita);
});