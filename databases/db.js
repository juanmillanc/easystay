const mysql = require('mysql2'); // En lugar de require('mysql')

const conexion = mysql.createConnection({
    host: 'localhost',
    database: 'resyhot',
    user: 'root',
    password: 'root',
    insecureAuth: true
});

conexion.connect((error)=> {
    if (error){
        console.error('El error de conexion es: '+error);
        return
    }
    console.log('¡Conectado a la BD mysql!');    
})

module.exports = conexion;