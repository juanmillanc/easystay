/*REVISA SI YA SALIÓ EL SIGUIENTE CÁPITULO #4*/

document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.form-login');
    const alertaError = form.querySelector('.alerta-error');
    const alertaExito = form.querySelector('.alerta-exito');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Obtener los valores del formulario
        const formData = new FormData(form);
        const data = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                // Mostrar mensaje de éxito
                alertaExito.textContent = result.message;
                alertaExito.classList.add('alertaExito');
                alertaError.classList.remove('alertaError');
                
                // Guardar información del usuario en localStorage
                localStorage.setItem('user', JSON.stringify(result.user));
                
                // Redirigir al dashboard después de 1.5 segundos
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
            } else {
                // Mostrar mensaje de error
                alertaError.textContent = result.message;
                alertaError.classList.add('alertaError');
                alertaExito.classList.remove('alertaExito');
            }
        } catch (error) {
            console.error('Error:', error);
            alertaError.textContent = 'Error al iniciar sesión';
            alertaError.classList.add('alertaError');
            alertaExito.classList.remove('alertaExito');
        }
    });
});