const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const conexion = require('../databases/db');

// Ruta para mostrar el formulario
router.get('/', (req, res) => {
    res.render('index');
});

// Ruta para el dashboard
router.get('/dashboard', (req, res) => {
    res.render('dashboard');
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
        const { email, password } = req.body;

        // Buscar el usuario por email
        const [users] = await conexion.promise().query(
            'SELECT * FROM usuarios WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const user = users[0];

        // Verificar la contraseña
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(400).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Verificar si el usuario está activo
        if (user.estado !== 'activo') {
            return res.status(400).json({
                success: false,
                message: 'Tu cuenta está inactiva'
            });
        }

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
        console.error('Error en el inicio de sesión:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión'
        });
    }
});

module.exports = router; 