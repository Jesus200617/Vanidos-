document.addEventListener("DOMContentLoaded", async function () {
    const usuario = obtenerUsuarioActivo();
    if (!usuario) {
        window.location.href = 'login.html';
        return;
    }
    if (usuario.rol !== 'super_admin' && usuario.rol !== 'admin') {
        window.location.href = 'main.html';
        return;
    }

    document.getElementById('saludoAdmin').innerText = usuario.nombre;
    document.getElementById('btnCerrarSesionAdmin').addEventListener('click', cerrarSesion);

    const tablaCitasBody = document.getElementById('tablaCitasBody');
    const tablaEmpleadosBody = document.getElementById('tablaEmpleadosBody');
    const buscador = document.getElementById('buscadorCliente');
    const formAltaEmpleado = document.getElementById('formAltaEmpleado');
    const alertaEmpleado = document.getElementById('alertaEmpleado');

    let listaCitasGlobal = [];

    const preciosServicios = {
        "Corte de pelo": 200,
        "Tinte": 550,
        "Barberia": 250
    };

    async function cargarPanelAdmin() {
        const { data, error } = await _supabase
            .from('citas')
            .select('*')
            .order('fecha_hora', { ascending: true });

        if (error) {
            console.error('Error al cargar citas:', error);
            return;
        }

        listaCitasGlobal = data;
        actualizarMetricas(data);
        renderizarTablaCitas(data);
    }

    function actualizarMetricas(citas) {
        document.getElementById('metricTotalCitas').innerText = citas.length;

        const hoyLocal = new Date().toLocaleDateString('en-CA');        
        let citasHoy = 0;

        citas.forEach(c => {
        if (c.fecha_hora) {
            const fechaCitaLocal = new Date(c.fecha_hora).toLocaleDateString('en-CA');
            if (fechaCitaLocal === hoyLocal) {
                citasHoy++;
            }
        }
    });

        document.getElementById('metricCitasHoy').innerText = citasHoy;
    }

    function renderizarTablaCitas(citas) {
        tablaCitasBody.innerHTML = "";

        if (citas.length === 0) {
            tablaCitasBody.innerHTML = `<tr><td colspan="5" class="text-center text-secondary py-4">No hay citas registradas</td></tr>`;
            return;
        }

        ahora = new Date();
        ahora.setHours(0,0,0,0);
       
        citasHora = citas.filter(c => c.fecha_hora >ahora.toISOString());
        citasHora.forEach(cita => {
            const fechaObj = new Date(cita.fecha_hora);
            const fechaFormateada = fechaObj.toLocaleDateString('es-ES', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
            const horaFormateada = fechaObj.toLocaleTimeString('es-ES', {
                hour: '2-digit', minute: '2-digit', hour12: false
            });

            const empleadoAsignado = cita.atendido_por;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-semibold">${cita.nombre_cliente}</td>
                <td><span class="badge bg-secondary">${cita.servicio}</span></td>
                <td><span class="badge bg-primary">${empleadoAsignado}</span></td>
                <td>${fechaFormateada} - ${horaFormateada} hrs</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger btn-cancelar" data-id="${cita.id}">
                        Cancelar
                    </button>
                </td>
            `;
            tablaCitasBody.appendChild(tr);
        });

        document.querySelectorAll('.btn-cancelar').forEach(btn => {
            btn.addEventListener('click', async function () {
                const idCita = this.getAttribute('data-id');
                await eliminarCita(idCita);
            });
        });
    }

    async function eliminarCita(id) {
        const { error } = await _supabase
            .from('citas')
            .delete()
            .eq('id', id);

        if (!error) {
            await cargarPanelAdmin();
            if (typeof refrescarCalendario === 'function') {
                await refrescarCalendario();
            }
        }
    }

    buscador.addEventListener('input', function () {
        const texto = this.value.toLowerCase().trim();
        const filtradas = listaCitasGlobal.filter(c => 
            c.nombre_cliente.toLowerCase().includes(texto) ||
            c.servicio.toLowerCase().includes(texto) ||
            (c.atendido_por && c.atendido_por.toLowerCase().includes(texto))
        );
        renderizarTablaCitas(filtradas);
    });

    async function cargarEmpleados() {
        const { data, error } = await _supabase
            .from('usuarios')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error al cargar empleados:', error);
            return;
        }

        const totalEmpleados = data.filter(u => u.rol === 'empleado').length;
        document.getElementById('metricTotalEmpleados').innerText = totalEmpleados;

        tablaEmpleadosBody.innerHTML = "";
        data.forEach(emp => {
            const esSuperAdmin = emp.rol === 'admin';
            const badgeRol = esSuperAdmin 
                ? `<span class="badge bg-danger">Dueño / Admin</span>` 
                : `<span class="badge bg-info text-dark">Empleado</span>`;

            const btnAccion = (emp.id === usuario.id)
                ? `<span class="text-secondary small">Sesión actual</span>`
                : `<button class="btn btn-sm btn-outline-danger btn-baja-emp" data-id="${emp.id}">Dar de baja</button>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-semibold">${emp.nombre}</td>
                <td>${emp.correo}</td>
                <td>${badgeRol}</td>
                <td>${btnAccion}</td>
            `;
            tablaEmpleadosBody.appendChild(tr);
        });

        document.querySelectorAll('.btn-baja-emp').forEach(btn => {
            btn.addEventListener('click', async function () {
                const idEmp = this.getAttribute('data-id');
                await darDeBajaEmpleado(idEmp);
            });
        });
    }

    formAltaEmpleado.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('empNombre').value.trim();
        const correo = document.getElementById('empCorreo').value.trim();
        const password = document.getElementById('empPassword').value.trim();
        const rol = document.getElementById('empRol').value;

        const { error } = await _supabase
            .from('usuarios')
            .insert([{ nombre, correo, password, rol }]);

        if (error) {
            alertaEmpleado.className = 'alert alert-danger';
            alertaEmpleado.innerText = 'Error: El correo ya está registrado o hubo un fallo.';
            alertaEmpleado.classList.remove('d-none');
        } else {
            alertaEmpleado.className = 'alert alert-success';
            alertaEmpleado.innerText = `Personal "${nombre}" dado de alta correctamente.`;
            alertaEmpleado.classList.remove('d-none');
            formAltaEmpleado.reset();
            await cargarEmpleados();
            setTimeout(() => alertaEmpleado.classList.add('d-none'), 3000);
        }
    });

    async function darDeBajaEmpleado(id) {
        const { error } = await _supabase
            .from('usuarios')
            .delete()
            .eq('id', id);

        if (!error) {
            await cargarEmpleados();
        }
    }

    await cargarPanelAdmin();
    await cargarEmpleados();
});