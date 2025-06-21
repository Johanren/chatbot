const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let chats = {}; // Almacenará los chats en memoria
let chatsWeb = {};

// Código de server.js

// server.js

// server.js
wss.on('connection', (ws) => {
    console.log("✅ Nuevo cliente conectado");

    ws.on('message', (message) => {
        //console.log("📩 Mensaje recibido:", message.toString());

        try {
            let data = JSON.parse(message);

            if (data.tipo === 'nuevoMensaje') {
                const fechaHoraActual = new Date();
                const fecha = fechaHoraActual.toLocaleDateString(); // Formato de fecha (dd/mm/yyyy)
                const hora = fechaHoraActual.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Formato de hora (hh:mm)

                if (!chats[data.usuario]) chats[data.usuario] = [];

                // Almacenamos el mensaje con fecha y hora
                chats[data.usuario].push({
                    asesor: data.asesor,
                    mensaje: data.mensaje,
                    fecha: fecha,  // Fecha en formato dd/mm/yyyy
                    hora: hora     // Hora en formato hh:mm
                });

                // Enviar el mensaje actualizado a todos los clientes conectados
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ tipo: 'actualizar', chats, asesor: data.asesor }));
                    }
                });
            }
            if (data.tipo === 'mensajeWeb') {
                const fechaHoraActual = new Date();
                const fecha = fechaHoraActual.toLocaleDateString(); // Formato de fecha (dd/mm/yyyy)
                const hora = fechaHoraActual.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Formato de hora (hh:mm)

                if (!chatsWeb[data.usuarioWeb]) chatsWeb[data.usuarioWeb] = [];

                // Almacenamos el mensaje con fecha y hora
                chatsWeb[data.usuarioWeb].push({
                    asesor: data.asesorWeb,
                    usuario: data.usuarioWeb,
                    mensaje: data.mensajeWeb,
                    fecha: fecha,  // Fecha en formato dd/mm/yyyy
                    hora: hora     // Hora en formato hh:mm
                });
                // Enviar el mensaje actualizado a todos los clientes conectados
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ tipo: 'actualizarWeb', chatsWeb }));
                    }
                });
            }
        } catch (error) {
            console.error("❌ Error al procesar el mensaje:", error);
        }
    });

    ws.on('close', () => {
        console.log("❌ Cliente desconectado");
    });

    // Enviar historial de chats al nuevo cliente
    ws.send(JSON.stringify({ tipo: 'actualizar', chats }));
});


app.use(express.static('public')); // Sirve la página HTML
//////
app.use(express.json()); // Para aceptar JSON

app.post('/enviar', express.json(), (req, res) => {
    const { numero, mensaje, asesor } = req.body;

    if (!numero || !mensaje) {
        return res.status(400).json({ success: false, error: 'Datos incompletos' });
    }

    const fechaHoraActual = new Date();
    const fecha = fechaHoraActual.toLocaleDateString(); // dd/mm/yyyy
    const hora = fechaHoraActual.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // hh:mm

    if (!chatsWeb[numero]) chatsWeb[numero] = [];

    chatsWeb[numero].push({
        asesor: asesor || "asesor1",
        usuario: numero,
        mensaje: mensaje,
        fecha: fecha,
        hora: hora
    });

    console.log(`📲 Enviando a asesor ${numero}: ${mensaje}`);

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ tipo: 'actualizarWeb', chatsWeb }));
        }
    });

    res.json({ success: true, enviado_a: numero });
});


app.post('/agregar-mensaje-cliente', (req, res) => {
    const { numero, asesor, mensaje } = req.body;

    if (!numero || !mensaje) {
        return res.status(400).json({ success: false, error: 'Datos incompletos' });
    }

    const fechaHoraActual = new Date();
    const fecha = fechaHoraActual.toLocaleDateString(); // dd/mm/yyyy
    const hora = fechaHoraActual.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // hh:mm

    if (!chatsWeb[numero]) chatsWeb[numero] = [];

    chatsWeb[numero].push({
        asesor: asesor || "asesor1",
        usuario: numero,
        mensaje: mensaje,
        fecha: fecha,
        hora: hora
    });

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ tipo: 'actualizarWeb', chatsWeb }));
        }
    });

    res.json({ success: true });
});
//////
server.listen(3000, () => console.log('🚀 Servidor WebSocket en http://localhost:3000/login.html'));
