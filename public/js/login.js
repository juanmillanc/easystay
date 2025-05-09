/*REVISA SI YA SALIÓ EL SIGUIENTE CÁPITULO #4*/

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Página de login cargada');
    const form = document.querySelector('.form-login');
    if (form) {
        console.log('Formulario de login encontrado');
        form.reset();
    }
    const alertaError = form.querySelector('.alerta-error');
    const alertaExito = form.querySelector('.alerta-exito');
    const userInitial = document.querySelector('.user-initial');
    const menuText = document.querySelector('.menu-text');

    // Función para verificar la sesión con el servidor
    async function verificarSesion() {
        try {
            const response = await fetch('/verify-session', {
                method: 'GET'
            });
            const result = await response.json();
            
            if (!result.success) {
                // Si la sesión no es válida, limpiar localStorage
                localStorage.removeItem('user');
                if (userInitial) userInitial.textContent = '';
                if (menuText) menuText.textContent = 'Iniciar sesión';
            }
        } catch (error) {
            console.error('Error al verificar sesión:', error);
            // Si hay error al conectar con el servidor, asumimos que no hay sesión
            localStorage.removeItem('user');
            if (userInitial) userInitial.textContent = '';
            if (menuText) menuText.textContent = 'Iniciar sesión';
        }
    }

    // Verificar la sesión al cargar la página
    await verificarSesion();

    // Función para cerrar sesión
    async function cerrarSesion() {
        try {
            console.log('Iniciando cierre de sesión...');
            const response = await fetch('/logout', {
                method: 'GET'
            });

            const result = await response.json();
            console.log('Respuesta del servidor:', result);

            if (result.success) {
                // Limpiar localStorage
                localStorage.removeItem('user');
                console.log('Datos de usuario eliminados del localStorage');

                // Actualizar la interfaz
                if (userInitial) userInitial.textContent = '';
                if (menuText) menuText.textContent = 'Iniciar sesión';

                // Redirigir a la página de login
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    }

    // Agregar evento de cierre de sesión al botón si existe
    const logoutButton = document.querySelector('.logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', cerrarSesion);
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Iniciando proceso de login...');

        try {
            // Limpiar mensajes de error/éxito anteriores
            alertaError.textContent = '';
            alertaError.classList.remove('alertaError');
            alertaExito.textContent = '';
            alertaExito.classList.remove('alertaExito');

            // Obtener los valores del formulario
            const formData = new FormData(form);
            const email = formData.get('email');
            const password = formData.get('password');

            // Validar que los campos no estén vacíos
            if (!email || !password) {
                console.log('Error: Campos vacíos');
                alertaError.textContent = 'Por favor, completa todos los campos';
                alertaError.classList.add('alertaError');
                return;
            }

            const data = { email, password };
            console.log('Enviando datos al servidor:', { email, password: '****' });

            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            console.log('Respuesta recibida del servidor:', {
                status: response.status,
                statusText: response.statusText
            });

            const result = await response.json();
            console.log('Datos de la respuesta:', result);

            if (result.success) {
                console.log('Login exitoso, procesando respuesta...');
                
                // Mostrar mensaje de éxito
                alertaExito.textContent = result.message;
                alertaExito.classList.add('alertaExito');
                
                // Guardar información del usuario
                localStorage.setItem('user', JSON.stringify(result.user));
                console.log('Usuario guardado en localStorage');
                
                // Actualizar UI
                if (result.user && result.user.email) {
                    const initial = result.user.email.charAt(0).toUpperCase();
                    if (userInitial) userInitial.textContent = initial;
                    if (menuText) menuText.textContent = result.user.nombre || 'Mi cuenta';
                    console.log('UI actualizada con datos del usuario');
                }

                // Esperar un momento para que se vea el mensaje de éxito
                console.log('Preparando redirección...');
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Intentar redirección
                console.log('Redirigiendo a /search...');
                window.location.href = '/search';
                
                // Si después de 2 segundos no se ha redirigido, intentar otro método
                setTimeout(() => {
                    if (window.location.pathname !== '/search') {
                        console.log('Intentando método alternativo de redirección...');
                        window.location.replace('/search');
                    }
                }, 2000);
            } else {
                console.log('Login fallido:', result.message);
                alertaError.textContent = result.message;
                alertaError.classList.add('alertaError');
            }
        } catch (error) {
            console.error('Error durante el proceso de login:', error);
            console.error('Stack trace:', error.stack);
            alertaError.textContent = 'Error al iniciar sesión. Por favor, intenta de nuevo.';
            alertaError.classList.add('alertaError');
        }
    });

    // Verificar sesión existente al cargar la página
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            console.log('Usuario encontrado en localStorage:', user);
            if (user.email) {
                const initial = user.email.charAt(0).toUpperCase();
                if (userInitial) userInitial.textContent = initial;
                if (menuText) menuText.textContent = user.nombre || 'Mi cuenta';
                console.log('UI actualizada con usuario guardado');
            }
        } catch (error) {
            console.error('Error al cargar usuario guardado:', error);
            localStorage.removeItem('user');
        }
    }
});