document.addEventListener("DOMContentLoaded", function () {
    const usuarioActivo = obtenerUsuarioActivo();
    if (usuarioActivo) {
        window.location.href = (usuarioActivo.rol === 'super_admin' || usuarioActivo.rol === 'admin') 
            ? 'admin.html' 
            : 'main.html';
    }

    const formLogin = document.getElementById('formLogin');
    const alerta = document.getElementById('alertaAuth');

    function mostrarAlerta(mensaje, tipo = 'danger') {
        alerta.className = `alert alert-${tipo}`;
        alerta.innerText = mensaje;
        alerta.classList.remove('d-none');
    }

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const correo = document.getElementById('loginCorreo').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        const { data, error } = await _supabase
            .from('usuarios')
            .select('*')
            .eq('correo', correo)
            .eq('password', password)
            .maybeSingle();

        if (error) {
            mostrarAlerta('Error al conectar con la base de datos.');
            console.error(error);
            return;
        }

        if (!data) {
            mostrarAlerta('Credenciales incorrectas o empleado no registrado.');
        } else {
            localStorage.setItem('vanidoso_user', JSON.stringify({
                id: data.id,
                nombre: data.nombre,
                correo: data.correo,
                rol: data.rol || 'empleado'
            }));

            if (data.rol === 'super_admin' || data.rol === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'main.html';
            }
        }
    });
});