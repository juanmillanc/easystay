const express = require('express');
const app = express();
const path = require('path');
const nodemailer = require('nodemailer');

// Configuración del motor de vistas
app.set('view engine', 'ejs');

// Configuración de seguridad básica
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

//Rutas de hoteles
app.get('/hotels/marina-resort', (req, res) => {
    res.render('hotels/marina-resort');
});

app.get('/hotels/mountain-view', (req, res) => {
    res.render('hotels/mountain-view');
});

app.get('/hotels/city-lights', (req, res) => {
    res.render('hotels/city-lights');
});

// Configuración de middleware
app.use(express.urlencoded({extended:false}));
app.use(express.json());

// Configuración de archivos estáticos
app.use(express.static('public'));

// Importar y usar el router de autenticación
const authRouter = require('./router/auth');
app.use('/', authRouter);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'jmiguelmillan7@gmail.com',
        pass: 'hnyw miow skhl ggzi'
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', ()=>{
    console.log('\n=== SERVIDOR INICIADO ===');
    console.log(`Server corriendo en http://localhost:${PORT}`);
    console.log('Esperando peticiones...\n');
});  