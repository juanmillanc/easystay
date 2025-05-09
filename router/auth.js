const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const conexion = require('../databases/db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Ruta para el login
router.get('/login', (req, res) => {
    res.render('index');
});

// Ruta para la búsqueda de hoteles
router.get('/search', (req, res) => {
    res.render('search');
});

// Ruta principal redirige a la búsqueda
router.get('/', (req, res) => {
    res.render('search');
});

// API para buscar hoteles por ciudad
router.get('/api/hotels/search', (req, res) => {
    const { ciudad } = req.query;
    
    if (!ciudad) {
        return res.json({ success: false, message: 'Por favor, ingresa una ciudad' });
    }

    const query = `
        SELECT h.*, c.nombre as ciudad_nombre 
        FROM hoteles h 
        INNER JOIN ciudades c ON h.ciudad_id = c.id 
        WHERE c.nombre LIKE ?
    `;

    conexion.query(query, [`%${ciudad}%`], (error, results) => {
        if (error) {
            console.error('Error en la búsqueda:', error);
            return res.json({ success: false, message: 'Error al buscar hoteles' });
        }
        
        res.json({
            success: true,
            hotels: results
        });
    });
});

// API para obtener sugerencias de ciudades
router.get('/api/cities/suggestions', (req, res) => {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
        return res.json({ success: true, cities: [] });
    }

    const searchQuery = `
        SELECT DISTINCT c.nombre 
        FROM ciudades c 
        WHERE c.nombre LIKE ? 
        ORDER BY 
            CASE 
                WHEN c.nombre LIKE ? THEN 1
                WHEN c.nombre LIKE ? THEN 2
                ELSE 3
            END,
            c.nombre
        LIMIT 5
    `;

    const exactMatch = `${query}%`;
    const startsWith = `${query}%`;
    const contains = `%${query}%`;

    conexion.query(searchQuery, [contains, exactMatch, startsWith], (error, results) => {
        if (error) {
            console.error('Error en la búsqueda de ciudades:', error);
            return res.json({ success: false, message: 'Error al buscar ciudades' });
        }
        
        res.json({
            success: true,
            cities: results.map(city => city.nombre)
        });
    });
});

// Ruta para el registro
router.post('/register', async (req, res) => {
    try {
        console.log('\n=== NUEVO INTENTO DE REGISTRO ===');
        console.log('Datos recibidos del formulario:', {
            nombre: req.body.nombre || 'no proporcionado',
            email: req.body.email || 'no proporcionado',
            telefono: req.body.telefono || 'no proporcionado',
            password: req.body.password ? '********' : 'no proporcionado'
        });

        // Validar que todos los campos requeridos estén presentes
        if (!req.body.nombre || !req.body.email || !req.body.password) {
            console.log('❌ Error: Faltan campos requeridos');
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        const { nombre, email, password, telefono } = req.body;

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('❌ Error: Formato de email inválido');
            return res.status(400).json({
                success: false,
                message: 'El formato del email no es válido'
            });
        }

        // Validar contraseña
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
        if (!passwordRegex.test(password)) {
            console.log('❌ Error: Contraseña no cumple con los requisitos');
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener entre 8 y 20 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales'
            });
        }

        // Verificar si el email ya existe
        console.log('\nVerificando si el email ya existe...');
        const [existingUser] = await conexion.promise().query(
            'SELECT * FROM usuarios WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            console.log('❌ Email ya registrado:', email);
            return res.status(400).json({ 
                success: false, 
                message: 'El email ya está registrado' 
            });
        }
        console.log('✅ Email disponible');

        // Encriptar la contraseña
        console.log('\nEncriptando contraseña...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log('✅ Contraseña encriptada correctamente');

        // Insertar el nuevo usuario
        console.log('\nInsertando nuevo usuario en la base de datos...');
        const [result] = await conexion.promise().query(
            'INSERT INTO usuarios (nombre, email, password, telefono) VALUES (?, ?, ?, ?)',
            [nombre, email, hashedPassword, telefono]
        );

        console.log('✅ Usuario registrado exitosamente');
        console.log('ID del nuevo usuario:', result.insertId);
        console.log('=== REGISTRO COMPLETADO ===\n');

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            userId: result.insertId
        });

    } catch (error) {
        console.error('\n❌ ERROR EN EL REGISTRO:');
        console.error('Mensaje de error:', error.message);
        console.error('Stack trace:', error.stack);
        console.error('=== ERROR DETALLADO ===\n');
        
        res.status(500).json({
            success: false,
            message: 'Error al registrar el usuario',
            error: error.message
        });
    }
});

// Ruta para el inicio de sesión
router.post('/login', async (req, res) => {
    try {
        console.log('\n=== INTENTO DE INICIO DE SESIÓN ===');
        const { email, password } = req.body;
        console.log('Email recibido:', email);

        // Buscar el usuario por email
        const [users] = await conexion.promise().query(
            'SELECT * FROM usuarios WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            console.log('❌ Usuario no encontrado');
            return res.status(400).json({
                success: false,
                message: 'El correo electrónico no está registrado'
            });
        }

        const user = users[0];
        console.log('✅ Usuario encontrado');

        // Verificar la contraseña
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            console.log('❌ Contraseña incorrecta');
            return res.status(400).json({
                success: false,
                message: 'La contraseña es incorrecta'
            });
        }
        console.log('✅ Contraseña válida');

        // Verificar si el usuario está activo
        if (user.estado !== 'activo') {
            console.log('❌ Cuenta inactiva');
            return res.status(400).json({
                success: false,
                message: 'Tu cuenta está inactiva. Por favor, contacta a soporte.'
            });
        }
        console.log('✅ Cuenta activa');

        console.log('✅ Inicio de sesión exitoso');
        console.log('=== FIN DEL INICIO DE SESIÓN ===\n');

        res.json({
            success: true,
            message: 'Inicio de sesión exitoso',
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol
            }
        });

    } catch (error) {
        console.error('\n❌ ERROR EN EL INICIO DE SESIÓN:');
        console.error('Mensaje de error:', error.message);
        console.error('Stack trace:', error.stack);
        console.error('=== ERROR DETALLADO ===\n');
        
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión. Por favor, intenta de nuevo más tarde.'
        });
    }
});

router.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    const [users] = await conexion.promise().query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (users.length === 0) {
        return res.render('forgot-password', { error: 'No existe una cuenta con ese email.' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hora
    await conexion.promise().query(
        'UPDATE usuarios SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
        [token, expiry, email]
    );
    // Configura tu transporter de nodemailer
    const transporter = nodemailer.createTransport({
        // Configura tu SMTP aquí
        service: 'gmail',
        auth: {
            user: 'jmiguelmillan7@gmail.com',
            pass: 'hnyw miow skhl ggzi'
        }
    });
    const resetLink = `http://${req.headers.host}/reset-password/${token}`;
    await transporter.sendMail({
        from: '"EasyStay" <no-reply@easystay.com>',
        to: email,
        subject: 'Recupera tu contraseña',
        html: `<p>Haz clic aquí para restablecer tu contraseña: <a href="${resetLink}">${resetLink}</a></p>`
    });
    res.render('forgot-password', { message: 'Revisa tu correo para restablecer la contraseña.' });
});

router.get('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const [users] = await conexion.promise().query(
        'SELECT * FROM usuarios WHERE reset_token = ? AND reset_token_expiry > NOW()', [token]
    );
    if (users.length === 0) {
        return res.send('Token inválido o expirado.');
    }
    res.render('reset-password', { token });
});

router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    const [users] = await conexion.promise().query(
        'SELECT * FROM usuarios WHERE reset_token = ? AND reset_token_expiry > NOW()', [token]
    );
    if (users.length === 0) {
        return res.send('Token inválido o expirado.');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await conexion.promise().query(
        'UPDATE usuarios SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE reset_token = ?',
        [hashedPassword, token]
    );
    res.send('¡Contraseña actualizada! Ya puedes iniciar sesión.');
});

// Ruta para cerrar sesión
router.get('/logout', (req, res) => {
    console.log('=== CERRANDO SESIÓN ===');
    console.log('Usuario cerrando sesión');
    
    res.json({
        success: true,
        message: 'Sesión cerrada exitosamente'
    });
});

// Ruta para verificar la sesión
router.get('/verify-session', (req, res) => {
    // Si el servidor está respondiendo, la sesión es válida
    res.json({
        success: true,
        message: 'Sesión válida'
    });
});

module.exports = router; 