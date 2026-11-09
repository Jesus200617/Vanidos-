const SUPABASE_URL = 'https://lxwrnesgnirwasaotjlw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4d3JuZXNnbmlyd2FzYW90amx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NjI1OTYsImV4cCI6MjEwMzQzODU5Nn0.4d0IsGVMcYR-rVSDMg1VZUuPyG8a8Vw5NqjGvIBu4WI';
const { createClient } = window.supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function obtenerUsuarioActivo() {
    const userStr = localStorage.getItem('vanidoso_user');
    return userStr ? JSON.parse(userStr) : null;
}

// Cerrar sesión
function cerrarSesion() {
    localStorage.removeItem('vanidoso_user');
    window.location.href = 'index.html';
}

//Por que no jala?
