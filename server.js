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
                        client.send(JSON.stringify({ tipo: 'actualizar', chats }));
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

server.listen(3000, () => console.log('🚀 Servidor WebSocket en http://localhost:3000'));
