/*REVISA SI YA SALIÓ EL CAPITULO #3*/

document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.form-register');
    const alertaError = form.querySelector('.alerta-error');
    const alertaExito = form.querySelector('.alerta-exito');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Obtener los valores del formulario
        const formData = new FormData(form);
        const data = {
            nombre: formData.get('nombre'),
            email: formData.get('email'),
            password: formData.get('password'),
            telefono: formData.get('telefono')
        };

        // Validar que los campos requeridos no estén vacíos
        if (!data.nombre || !data.email || !data.password) {
            alertaError.textContent = 'Todos los campos son obligatorios';
            alertaError.classList.add('alertaError');
            alertaExito.classList.remove('alertaExito');
            return;
        }

        try {
            console.log('Enviando datos:', data);
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            console.log('Respuesta del servidor:', result);

            if (result.success) {
                // Mostrar mensaje de éxito
                alertaExito.textContent = result.message;
                alertaExito.classList.add('alertaExito');
                alertaError.classList.remove('alertaError');
                
                // Limpiar el formulario
                form.reset();
                
                // Redirigir al login después de 2 segundos
                setTimeout(() => {
                    document.getElementById('sign-in').click();
                }, 2000);
            } else {
                // Mostrar mensaje de error
                alertaError.textContent = result.message;
                alertaError.classList.add('alertaError');
                alertaExito.classList.remove('alertaExito');
            }
        } catch (error) {
            console.error('Error:', error);
            alertaError.textContent = 'Error al registrar el usuario';
            alertaError.classList.add('alertaError');
            alertaExito.classList.remove('alertaExito');
        }
    });
});