const express = require('express');
const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended:false}));
app.use(express.json());

// Configuración de archivos estáticos
app.use(express.static('public'));

// Importar y usar el router de autenticación
const authRouter = require('./router/auth');
app.use('/', authRouter);

app.listen(5000, ()=>{
    console.log('\n=== SERVIDOR INICIADO ===');
    console.log('Server corriendo en Http://localhost:5000');
    console.log('Esperando peticiones...\n');
});  