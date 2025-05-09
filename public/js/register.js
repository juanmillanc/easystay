/*REVISA SI YA SALIÓ EL CAPITULO #3*/

document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.form-register');
    const alertaError = form.querySelector('.alerta-error');
    const alertaExito = form.querySelector('.alerta-exito');
    const passwordInput = form.querySelector('input[name="password"]');
    const emailInput = form.querySelector('input[name="email"]');

    // Función para validar el email
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Función para validar la contraseña
    function validatePassword(password) {
        const requirements = {
            length: password.length >= 8 && password.length <= 20,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[@$!%*?&]/.test(password)
        };

        // Actualizar la UI de los requisitos
        Object.keys(requirements).forEach(req => {
            const element = document.getElementById(req);
            if (element) {
                if (requirements[req]) {
                    element.classList.add('valid');
                } else {
                    element.classList.remove('valid');
                }
            }
        });

        return Object.values(requirements).every(Boolean);
    }

    // Validación en tiempo real de la contraseña
    passwordInput.addEventListener('input', function() {
        validatePassword(this.value);
    });

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

        // Validar campos requeridos
        if (!data.nombre || !data.email || !data.password) {
            alertaError.textContent = 'Todos los campos son obligatorios';
            alertaError.classList.add('alertaError');
            alertaExito.classList.remove('alertaExito');
            return;
        }

        // Validar email
        if (!validateEmail(data.email)) {
            alertaError.textContent = 'Por favor, ingrese un email válido';
            alertaError.classList.add('alertaError');
            alertaExito.classList.remove('alertaExito');
            return;
        }

        // Validar contraseña
        if (!validatePassword(data.password)) {
            alertaError.textContent = 'La contraseña no cumple con los requisitos mínimos';
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