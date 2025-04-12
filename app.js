const fs = require('fs');
const path = require('path');
const express = require('express');
const { createBot, createProvider, createFlow, addKeyword, EVENTS, media, addAnswer, MemoryDB } = require('@bot-whatsapp/bot');
const QRPortalWeb = require('@bot-whatsapp/portal')
const WebWhatsappProvider = require('@bot-whatsapp/provider/web-whatsapp');
const MockAdapter = require('@bot-whatsapp/database/mock');

const TIMEOUT_INACTIVIDAD = 10 * 60 * 1000; // 10 minutos
const sesiones = new Map();
const temporizadores = new Map();

const { useMultiFileAuthState, makeWASocket, DisconnectReason, delay } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const qrcode1 = require('qrcode');

const sessions = ['asesor1']; // Agrega más sesiones si deseas
const socks = {}; // Mapa global de sesiones: { cliente1: sock1, cliente2: sock2 }

async function startAllSessions() {
    for (const name of sessions) {
        await startWhatsAppSession(name);
    }
}

async function startWhatsAppSession(sessionName) {
    const { state, saveCreds } = await useMultiFileAuthState(`./auth/${sessionName}`);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    socks[sessionName] = sock; // Guardar socket por sesión

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log(`📲 [${sessionName}] Escanea este código QR para conectar tu bot:`);
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`❌ [${sessionName}] Conexión cerrada`, shouldReconnect ? "→ Intentando reconectar..." : "→ Sesión cerrada permanentemente.");

            if (shouldReconnect) {
                startWhatsAppSession(sessionName);
            } else {
                console.log(`⚠ [${sessionName}] Debes volver a escanear el código QR.`);
            }
        } else if (connection === 'open') {
            console.log(`✅ [${sessionName}] Conectado a WhatsApp`);
        }
    });
}

async function enviarMensajeWhatsApp(sessionName, usuario, mensaje) {
    const sock = socks[sessionName];
    if (!sock) {
        console.error(`⚠️ Error: la sesión "${sessionName}" no está inicializada.`);
        return;
    }

    try {
        console.log(`🚀 Enviando desde [${sessionName}] → Usuario: ${usuario}, Mensaje: "${mensaje}"`);
        await sock.sendMessage(`${usuario}@s.whatsapp.net`, { text: mensaje });
        console.log("✅ Mensaje enviado correctamente.");
    } catch (error) {
        console.error("❌ Error al enviar mensaje:", error);
    }
}

// Iniciar todas las sesiones
startAllSessions();

/*Conexion con pagina web*/

const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000');
//const ws = new WebSocket('wss://3b59-2803-e5e3-2810-7900-1862-447a-ad19-e93.ngrok-free.app');
ws.on('open', () => {
    console.log("📡 Conectado al servidor Web");
});

ws.on('open', () => {
    console.log("📡 Conectado al servidor WebSocket");
});

ws.on('error', (error) => {
    console.error("❌ Error en WebSocket:", error);
});

const enviarMensajeWeb = (usuario, asesor, mensaje) => {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ tipo: 'nuevoMensaje', usuario, asesor, mensaje }));
    } else {
        console.warn("⚠️ No se pudo enviar el mensaje: WebSocket no está conectado.");
    }
};

const setEstadoUsuario = (user, estado) => {
    sesiones.set(user, estado);
    reiniciarTemporizador(user);
};

const getEstadoUsuario = (user) => sesiones.get(user);

const limpiarEstadoUsuario = (user) => {
    sesiones.delete(user);
    if (temporizadores.has(user)) {
        clearTimeout(temporizadores.get(user));
        temporizadores.delete(user);
    }
};

const reiniciarTemporizador = (user) => {
    if (temporizadores.has(user)) {
        clearTimeout(temporizadores.get(user));
    }

    const timer = setTimeout(async () => {
        let sesion = sesiones.get(user); // Obtener la sesión del usuario

        // Validar si la sesión existe
        if (!sesion) {
            console.error(`❌ Error: No existe sesión para el usuario ${user}. Se creará una temporal.`);
            sesion = {
                esperandoAsesor: false, // Valor por defecto
                sendMessage: (msg) => {
                    console.log(`Mensaje a ${user}: ${msg}`);
                }
            };
            sesiones.set(user, sesion); // Guardar la nueva sesión
        }

        // Validar si la sesión tiene el método sendMessage
        if (typeof sesion.sendMessage !== "function") {
            console.error(`❌ Error: La sesión para el usuario ${user} no tiene sendMessage. Se creará.`);
            sesion.sendMessage = (msg) => {
                console.log(`Mensaje a ${user}: ${msg}`);
            };
            sesiones.set(user, sesion); // Actualizar la sesión
        }

        sesion.sendMessage("⏳ Has estado inactivo por más de 10 minutos. Se cerrará la sesión.");

        // Si el usuario está esperando un asesor, notificar al sistema web
        if (sesion.esperandoAsesor) {
            console.log("Sesión terminada por inactividad del usuario.");
            enviarMensajeWeb(user, "asesor1", "Sesión terminada por inactividad del usuario");
            limpiarEstadoUsuario(user);
            sesiones.delete(user); // Eliminar la sesión del mapa
            return;
        }

        // Limpiar estado del usuario y cerrar sesión
        limpiarEstadoUsuario(user);
        sesiones.delete(user); // Eliminar la sesión del mapa

    }, TIMEOUT_INACTIVIDAD);

    temporizadores.set(user, timer);
};

ws.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);

        if (data.tipo === "actualizarWeb") {
            // Verificar si data.chatsWeb es un objeto válido
            if (typeof data.chatsWeb !== 'object' || data.chatsWeb === null) {
                console.error("❌ Error: data.chatsWeb no es un objeto válido", data.chatsWeb);
                return;
            }
            // Recorrer los usuarios y obtener solo el último mensaje
            Object.entries(data.chatsWeb).forEach(([usuario, mensajes]) => {
                if (!Array.isArray(mensajes) || mensajes.length === 0) {
                    console.error(`❌ Error: No hay mensajes válidos para el usuario ${usuario}`, mensajes);
                    return;
                }
                // Obtener el último mensaje del array
                const ultimoMensaje = mensajes[mensajes.length - 1];
                const asesor = ultimoMensaje.asesor || "asesor_desconocido"; // fallback si no viene asesor

                console.log(`✉️ Enviando último mensaje a ${usuario}: "${ultimoMensaje.mensaje}" desde el Asesor: ${asesor}`);
                enviarMensajeWhatsApp(asesor, usuario, ultimoMensaje.mensaje);
            });
        }
    } catch (error) {
        console.error("❌ Error al procesar el mensaje WebSocket:", error);
    }
};


/*Flujo Principal*/

const flowPrincipalAsesor = addKeyword(EVENTS.WELCOME)
    .addAction(async (ctx, { gotoFlow }) => {
        const usuarioID = ctx.from;
        const mensaje = ctx.body.trim();
        const estado = getEstadoUsuario(ctx.from);

        // Si el usuario está esperando un asesor, bloquea el flujo principal
        if (estado?.esperandoAsesor) {
            console.log("🔒 Actualmente estás esperando a un asesor. No se ejecutará el flujo principal.");
            await console.log("📩 *Puedes seguir enviando mensajes. Un asesor te responderá pronto.*");
            enviarMensajeWeb(usuarioID, "asesor1", mensaje);
            return;  // No hace nada, evitando el flujo
        }

        // Si no está esperando un asesor, continuar con el flujo principal
        return gotoFlow(flowPrincipal);
    });



const flowPrincipal = addKeyword(EVENTS.WELCOME)
    .addAnswer('¡Aquí tienes una imagen!', { media: 'c:/xampp/htdocs/chatbot/public/img/logo.png' })
    .addAnswer("👋 ¡Hola! Bienvenido al asistente virtual de *Jordel Ingeniería SAS, FiberNet*.", {}, async (ctx, { gotoFlow, flowDynamic }) => {
        return gotoFlow(flowMenuPrincipal);
    });

const flowMenuPrincipal = addKeyword(EVENTS.ACTION)
    .addAnswer([
        "👇 *Seleccione una opción:*",
        "1️⃣ Consulta de Servicio",
        "2️⃣ Facturación y Pagos",
        "3️⃣ Planes y Promociones",
        "4️⃣ Soporte Técnico Avanzado",
        "5️⃣ Consulta Personalizada",
        "6️⃣ Asistencia en Tiempo Real",
        "7️⃣ Comentarios y Sugerencias",
        "8️⃣ Información General",
        "✖️ Escribe *cerrar sesión* para salir.",
        "*Escribe el número de la opción que deseas.*"
    ], { capture: true }, async (ctx, { flowDynamic, gotoFlow }) => {
        setEstadoUsuario(ctx.from, { menu: "principal", sendMessage: flowDynamic });
        const seleccion = ctx.body.trim();
        if (seleccion === "Cerrar sesión") return gotoFlow(flowCerrarSesion);
        switch (seleccion) {
            case "1": return gotoFlow(flowConsultaServicio);
            case "2": return gotoFlow(flowFacturacionPagos);
            case "3": return gotoFlow(flowPlanesPromociones);
            case "4": return gotoFlow(flowSoporteTecnico);
            case "5": return gotoFlow(flowConsultaPersonalizada);
            case "6": return gotoFlow(flowAsistenciaTiendoReal);
            case "7": return gotoFlow(flowComentarioSugerencia);
            case "8": return gotoFlow(flowInformacionGeneral);
            default: return flowDynamic("⚠️ Opción no válida. Intente nuevamente.") + gotoFlow(flowMenuPrincipal);
        }
    });

/*Cierre Sesion*/

const flowCerrarSesion = addKeyword("cerrar sesión")
    .addAnswer("🔒 ¿Seguro que quieres cerrar sesión? Escribe *sí* o *no*.",
        { capture: true }, async (ctx, { flowDynamic, gotoFlow }) => {
            if (ctx.body.trim().toLowerCase() === "si" || ctx.body.trim().toLowerCase() === "Si") {
                limpiarEstadoUsuario(ctx.from);
                return flowDynamic("✅ Has cerrado sesión. Escribe *hola* para volver a activarlo.");
            }
            flowDynamic("🔙 Regresando al menú principal...");
            await new Promise(resolve => setTimeout(resolve, 1000)); // Espera 1 segundo antes de ir al flujo
            return gotoFlow(flowMenuPrincipal)
        });

const flowVolverMenuPrincipal = addKeyword(["9"])
    .addAnswer("🔙 Regresando al menú principal...", {}, async (ctx, { flowDynamic, gotoFlow }) => {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Espera 1 segundo antes de ir al flujo
        return gotoFlow(flowMenuPrincipal);
    });

const flowCerrarConversacion = addKeyword(["0"])
    .addAnswer("✅ *Conversación cerrada.*", {}, async (ctx, { flowDynamic, gotoFlow }) => {
        const estado = getEstadoUsuario(ctx.from);
        if (estado?.esperandoAsesor) {
            const usuarioID = ctx.from;
            let mensaje = "Conversacion terminada por el cliente";
            console.log("Conversacion terminda");
            await console.log("📩 *Puedes seguir enviando mensajes. Un asesor te responderá pronto.*");
            enviarMensajeWeb(usuarioID, "asesor1", mensaje);
            limpiarEstadoUsuario(usuarioID);
            return gotoFlow(flowMenuPrincipal);  // No hace nada, evitando el flujo
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // Espera 1 segundo antes de ir al flujo
        return gotoFlow(flowMenuPrincipal);
    });


/*Sub Menus*/

const flowConsultaServicio = addKeyword(EVENTS.ACTION)
    .addAnswer([
        "👇 *Seleccione una opción:*",
        "1️⃣📡 Estado de mi conexión",
        "2️⃣🔧 Problemas técnicos",
        "3️⃣📅 Mantenimiento programado",
        "9️⃣ Volver al menú principal"
    ], { capture: true }, async (ctx, { flowDynamic, gotoFlow }) => {
        const usuarioID = ctx.from;
        const seleccion = ctx.body.trim();
        /*const respuestas = {
            "1": "📡 Tu conexión está funcionando correctamente.",
            "2": "🔧 Puedes contactar a soporte técnico al 123-456-7890.",
            "3": "📅 No hay mantenimientos programados en este momento.",
        };*/
        if (seleccion === "9") return gotoFlow(flowVolverMenuPrincipal);

        // Respuestas según opción seleccionada
        if (seleccion === "1") {
            let mensaje = "Cliente busca ayuda en Estado de mi conexión";

            // Enviar mensaje al WebSocket
            enviarMensajeWeb(usuarioID, "asesor1", mensaje);
            return gotoFlow(flowChatAsesor);
        }

        if (seleccion === "2") {
            let mensaje = "Cliente busca ayuda en Problemas técnicos";

            // Enviar mensaje al WebSocket
            enviarMensajeWeb(usuarioID, "asesor1", mensaje);
            return gotoFlow(flowChatAsesor);
        }
        if (seleccion === "3") {
            let mensaje = "Cliente busca ayuda en Mantenimiento programado";

            // Enviar mensaje al WebSocket
            enviarMensajeWeb(usuarioID, "asesor1", mensaje);
            return gotoFlow(flowChatAsesor);
        }
        //await flowDynamic("⏳ Por favor, espera un momento mientras procesamos tu solicitud...");
        //await new Promise(resolve => setTimeout(resolve, 20000)); // 20 segundos de espera
        // Opción no válida
        await flowDynamic("⚠️ Opción no válida. Intente nuevamente.");
        return gotoFlow(flowConsultaServicio);
    });

const flowFacturacionPagos = addKeyword(EVENTS.ACTION)
    .addAnswer([
        "👇 *Facturación y Pagos:*",
        "1️⃣💰 Consultar saldo",
        "2️⃣💳 Realizar un pago",
        "3️⃣📜 Historial de facturación",
        "9️⃣ Volver al menú principal"
    ], { capture: true }, async (ctx, { flowDynamic, gotoFlow }) => {
        const usuarioID = ctx.from;
        const seleccion = ctx.body.trim();
        /*const respuestas = {
            "1": "💰 Tu saldo es de $50,000 COP.",
            "2": "💳 Puedes realizar un pago en nuestra plataforma.",
            "3": "📜 Aquí está tu historial de pagos.",
        };*/
        // Respuestas según opción seleccionada

        if (seleccion === "9") return gotoFlow(flowVolverMenuPrincipal);

        if (seleccion === "1") {
            let mensaje = "Cliente busca ayuda en Consultar saldo";

            // Enviar mensaje al WebSocket
            enviarMensajeWeb(usuarioID, "asesor1", mensaje);
            return gotoFlow(flowChatAsesor);
        }

        if (seleccion === "2") {
            let mensaje = "Cliente busca ayuda en Realizar un pago";

            // Enviar mensaje al WebSocket
            enviarMensajeWeb(usuarioID, "asesor1", mensaje);
            return gotoFlow(flowChatAsesor);
        }
        if (seleccion === "3") {
            let mensaje = "Cliente busca ayuda en Historial de facturación";

            // Enviar mensaje al WebSocket
            enviarMensajeWeb(usuarioID, "asesor1", mensaje);
            return gotoFlow(flowChatAsesor);
        }
        /*await flowDynamic("⏳ Por favor, espera un momento mientras procesamos tu solicitud...");
        await new Promise(resolve => setTimeout(resolve, 20000)); // 20 segundos de espera*/
        // Opción no válida
        await flowDynamic("⚠️ Opción no válida. Intente nuevamente.");
        return gotoFlow(flowFacturacionPagos);
    });

const flowPlanesPromociones = addKeyword(EVENTS.ACTION)
    .addAnswer([
        "👇 *Planes y Promociones:*",
        "1️⃣📄 Explorar planes",
        "2️⃣🔥 Promociones actuales",
        "3️⃣🔄 Cambio de plan",
        "9️⃣ Volver al menú principal"
    ], { capture: true }, async (ctx, { flowDynamic, gotoFlow }) => {
        const usuarioID = ctx.from;
        const seleccion = ctx.body.trim();
        /*const respuestas = {
            "1": "📄 Planes de hasta 1 Gbps disponibles.",
            "2": "🔥 10% de descuento en nuevos suscriptores.",
            "3": "🔄 Contacta a un asesor para cambiar de plan."
        };*/
        // Respuestas según opción seleccionada

        if (seleccion === "9") return gotoFlow(flowVolverMenuPrincipal);


        if (seleccion === "1") {
            await flowDynamic("⏳ Por favor, espera un momento mientras procesamos tu solicitud...");
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5 segundos de espera
            try {
                await flowDynamic([{ body: ' ', media: 'c:/xampp/htdocs/chatbot/public/img/uno.jpg', delay: 1000 }]);
                await flowDynamic([{ body: ' ', media: 'c:/xampp/htdocs/chatbot/public/img/dos.jpg', delay: 1000 }]);
                await flowDynamic([{ body: ' ', media: 'c:/xampp/htdocs/chatbot/public/img/tres.jpg', delay: 1000 }]);
                await flowDynamic([{ body: ' ', media: 'c:/xampp/htdocs/chatbot/public/img/cuatro.jpg', delay: 1000 }]);
                await flowDynamic([{ body: ' ', media: 'c:/xampp/htdocs/chatbot/public/img/cinco.jpg', delay: 1000 }]);
                await flowDynamic([{ body: ' ', media: 'c:/xampp/htdocs/chatbot/public/img/seis.jpg', delay: 1000 }]);
                await flowDynamic([{ body: ' ', media: 'c:/xampp/htdocs/chatbot/public/img/siete.jpg', delay: 1000 }]);
            } catch (error) {
                console.error('Error en flowDynamic:', error);
            }

        }

        if (seleccion === "2") {
            //await flowDynamic("⏳ Por favor, espera un momento mientras procesamos tu solicitud...");
            //await new Promise(resolve => setTimeout(resolve, 5000)); // 5 segundos de 
            let mensaje = "Cliente busca ayuda en Promociones actuales";

            // Enviar mensaje al WebSocket
            enviarMensajeWeb(usuarioID, "asesor1", mensaje);
            return gotoFlow(flowChatAsesor);
        }
        if (seleccion === "3") {
            await flowDynamic("⏳ Por favor, espera un momento mientras procesamos tu solicitud...");
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5 segundos de espera
            await flowDynamic("Haz Tu Cambio de plan aquí 👉 https://forms.gle/VFrnbvWzZYydiD4q6")
        }
        // Opción no válida
        if (!["9", "1", "2", "3"].includes(seleccion)) {
            await flowDynamic("⚠️ Opción no válida. Intente nuevamente.");
            return gotoFlow(flowComentarioSugerencia);
        }
    });

const flowSoporteTecnico = addKeyword(EVENTS.ACTION)
    .addAnswer([
        "👇 *Soporte Técnico Avanzado:*",
        "1️⃣🔍 Diagnóstico de red",
        "2️⃣⚙️ Configuración avanzada",
        "3️⃣📞 Contactar a un técnico",
        "9️⃣ Volver al menú principal"
    ], { capture: true }, async (ctx, { flowDynamic, gotoFlow }) => {
        const usuarioID = ctx.from;
        const seleccion = ctx.body.trim();
        /*const respuestas = {
            "1": "🔍 Realiza un diagnóstico de red en nuestra app.",
            "2": "⚙️ Consulta nuestra guía de configuración avanzada.",
            "3": "📞 Llama al 123-456-7890 para soporte técnico."
        };*/
        if (seleccion === "9") return gotoFlow(flowVolverMenuPrincipal);

        if (seleccion === "1") {
            let mensaje = "Cliente busca ayuda en Diagnóstico de red";

            // Enviar mensaje al WebSocket
            enviarMensajeWeb(usuarioID, "asesor1", mensaje);
            return gotoFlow(flowChatAsesor);
        }

        if (seleccion === "2") {
            let mensaje = "Cliente busca ayuda en Configuración avanzada";

            // Enviar mensaje al WebSocket
            enviarMensajeWeb(usuarioID, "asesor1", mensaje);
            return gotoFlow(flowChatAsesor);
        }
        if (seleccion === "3") {
            let mensaje = "Cliente busca ayuda en Contactar a un técnico";

            // Enviar mensaje al WebSocket
            enviarMensajeWeb(usuarioID, "asesor1", mensaje);
            return gotoFlow(flowChatAsesor);
        }
        /*await flowDynamic("⏳ Por favor, espera un momento mientras procesamos tu solicitud...");
        await new Promise(resolve => setTimeout(resolve, 20000)); // 20 segundos de espera*/
        // Opción no válida
        await flowDynamic("⚠️ Opción no válida. Intente nuevamente.");
        return gotoFlow(flowSoporteTecnico);
    });

const flowConsultaPersonalizada = addKeyword(EVENTS.ACTION)
    .addAnswer([
        "👇 *Consulta Personalizada:*",
        "1️⃣ Asistente inteligente",
        "2️⃣ Sugerencias basadas en historial",
        "9️⃣ Volver al menú principal"
    ], { capture: true }, async (ctx, { flowDynamic, gotoFlow }) => {
        const usuarioID = ctx.from;
        const seleccion = ctx.body.trim();
        /*const respuestas = {
            "1": " Describe tu problema o consulta y recibirás una respuesta personalizada",
            "2": " Si has interactuado antes, puedo ofrecerte soluciones basadas en tus consultas pasadas."
        };*/
        if (seleccion === "9") return gotoFlow(flowVolverMenuPrincipal);

        if (seleccion === "1") {
            let mensaje = "Cliente busca ayuda en Asistente inteligente";

            // Enviar mensaje al WebSocket
            enviarMensajeWeb(usuarioID, "asesor1", mensaje);
            return gotoFlow(flowChatAsesor);
        }

        if (seleccion === "2") {
            let mensaje = "Cliente busca ayuda en Sugerencias basadas en historial";

            // Enviar mensaje al WebSocket
            enviarMensajeWeb(usuarioID, "asesor1", mensaje);
            return gotoFlow(flowChatAsesor);
        }
        /*await flowDynamic("⏳ Por favor, espera un momento mientras procesamos tu solicitud...");
        await new Promise(resolve => setTimeout(resolve, 20000)); // 20 segundos de espera*/
        // Opción no válida
        await flowDynamic("⚠️ Opción no válida. Intente nuevamente.");
        return gotoFlow(flowConsultaPersonalizada);
    });

const flowAsistenciaTiendoReal = addKeyword(EVENTS.ACTION)
    .addAnswer([
        "👇 *Asistencia en Tiempo Real:*",
        "1️⃣ Hablar con un agente",
        "2️⃣ Programar una llamada",
        "9️⃣ Volver al menú principal"
    ], { capture: true }, async (ctx, { flowDynamic, gotoFlow }) => {
        const usuarioID = ctx.from;
        const seleccion = ctx.body.trim();

        if (seleccion === "9") return gotoFlow(flowVolverMenuPrincipal);

        // Respuestas según opción seleccionada
        if (seleccion === "1") {
            let mensaje = "Cliente busca ayuda en Hablar con un agente";

            // Enviar mensaje al WebSocket
            enviarMensajeWeb(usuarioID, "asesor1", mensaje);
            return gotoFlow(flowChatAsesor);
        }

        if (seleccion === "2") {
            let mensaje = "Cliente busca ayuda en Programar una llamada";

            // Enviar mensaje al WebSocket
            enviarMensajeWeb(usuarioID, "asesor1", mensaje);
            return gotoFlow(flowChatAsesor);
        }

        // Opción no válida
        await flowDynamic("⚠️ Opción no válida. Intente nuevamente.");
        return gotoFlow(flowAsistenciaTiendoReal);
    });


const flowComentarioSugerencia = addKeyword(EVENTS.ACTION)
    .addAnswer([
        "👇 *Comentarios y Sugerencias:*",
        "1️⃣ Dejar una opinión",
        "2️⃣ Participar en encuestas",
        "9️⃣ Volver al menú principal"
    ], { capture: true }, async (ctx, { flowDynamic, gotoFlow }) => {
        const seleccion = ctx.body.trim();
        /*const respuestas = {
            "1": " Comparte tu experiencia y sugerencias para mejorar.",
            "2": " Ayúdanos a mejorar nuestros servicios respondiendo a breves encuestas"
        };*/
        if (seleccion === "9") return gotoFlow(flowVolverMenuPrincipal);

        if (seleccion === "1") {
            await flowDynamic("⏳ Por favor, espera un momento mientras procesamos tu solicitud...");
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5 segundos de espera
            await flowDynamic("Dejanos tu opinion atraves de 👉 https://forms.gle/w3aTL3GhUXxGuh8MA")
        }

        if (seleccion === "2") {
            await flowDynamic("⏳ Por favor, espera un momento mientras procesamos tu solicitud...");
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5 segundos de espera
            await flowDynamic("Participar en encuestas")
            await flowDynamic("https://forms.gle/VFrnbvWzZYydiD4q6")
        }
        /*await flowDynamic("⏳ Por favor, espera un momento mientras procesamos tu solicitud...");
        await new Promise(resolve => setTimeout(resolve, 20000)); // 20 segundos de espera*/
        if (!["9", "1", "2", "3"].includes(seleccion)) {
            await flowDynamic("⚠️ Opción no válida. Intente nuevamente.");
            return gotoFlow(flowComentarioSugerencia);
        }
    });

const flowInformacionGeneral = addKeyword(EVENTS.ACTION)
    .addAnswer([
        "👇 *Información General:*",
        "1️⃣ Preguntas frecuentes",
        "2️⃣ Políticas de uso y privacidad",
        "9️⃣ Volver al menú principal"
    ], { capture: true }, async (ctx, { flowDynamic, gotoFlow }) => {
        const seleccion = ctx.body.trim();
        /*const respuestas = {
            "1": " Encuentra respuestas a las preguntas más comunes.",
            "2": " Consulta nuestras políticas y términos."
        };*/
        if (seleccion === "9") return gotoFlow(flowVolverMenuPrincipal);

        if (seleccion === "1") {
            await flowDynamic("⏳ Por favor, espera un momento mientras procesamos tu solicitud...");
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5 segundos de espera
            flowDynamic("Dejanos tu opinion atraves de 👉 https://forms.gle/w3aTL3GhUXxGuh8MA")
        }

        if (seleccion === "2") {
            await flowDynamic("⏳ Por favor, espera un momento mientras procesamos tu solicitud...");
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5 segundos de espera
            flowDynamic("Nuestras Politicas de uso y privacidad")
            flowDynamic("En FiberNet")
        }
        /*await flowDynamic("⏳ Por favor, espera un momento mientras procesamos tu solicitud...");
        await new Promise(resolve => setTimeout(resolve, 20000)); // 20 segundos de espera*/
        await flowDynamic("⚠️ Opción no válida. Intente nuevamente.");
        return gotoFlow(flowInformacionGeneral);
    });

/*Hablar con un accesor*/

// Inicializar el objeto global si no existe
if (!global.tiempoInactividad) {
    global.tiempoInactividad = {};
}

const flowChatAsesor = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { flowDynamic, gotoFlow }) => {
        const usuarioID = ctx.from;
        let mensaje = ctx.body.trim();

        // Enviar mensaje al WebSocket
        enviarMensajeWeb(usuarioID, "asesor1", mensaje);

        if (mensaje === "0") {
            limpiarEstadoUsuario(usuarioID);
            return gotoFlow(flowMenuPrincipal);
        }

        // Marcar como esperando asesor
        setEstadoUsuario(usuarioID, { esperandoAsesor: true });

        // Respuesta automática después de 2 segundos
        setTimeout(async () => {
            await flowDynamic("👇 *En un momento, uno de nuestros asesores se comunicará contigo.*");
        }, 2000);

        // Configurar recordatorio de inactividad
        if (global.tiempoInactividad[usuarioID]) {
            clearTimeout(global.tiempoInactividad[usuarioID]);
        }

        global.tiempoInactividad[usuarioID] = setTimeout(async () => {
            const estado = getEstadoUsuario(usuarioID);
            if (estado?.esperandoAsesor) {
                await flowDynamic("⏳ Parece que has estado inactivo. Si deseas cerrar la conversación, responde con *0️⃣*.");
                mensaje = "Inactividad por el usuario";
                enviarMensajeWeb(usuarioID, "asesor1", mensaje);
            }
        }, 300000); // 5 minutos
    });

// Almacenar temporalmente los QR por bot
const qrStorage = {};

const createInstance = async (nombreBot, sessionId, port) => {
    const sessionFolder = path.join(__dirname, 'sessions', sessionId);
    if (!fs.existsSync(sessionFolder)) {
        fs.mkdirSync(sessionFolder, { recursive: true });
    }

    const adapterDB = new MockAdapter();
    const adapterFlow = createFlow([
        flowPrincipalAsesor, flowPrincipal, flowMenuPrincipal, flowConsultaServicio,
        flowFacturacionPagos, flowPlanesPromociones, flowSoporteTecnico,
        flowConsultaPersonalizada, flowAsistenciaTiendoReal, flowComentarioSugerencia,
        flowInformacionGeneral, flowCerrarSesion, flowVolverMenuPrincipal,
        flowChatAsesor, flowCerrarConversacion
    ]);

    const adapterProvider = createProvider(WebWhatsappProvider, {
        sessionPath: sessionFolder,
    });

    const bot = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    QRPortalWeb({ port });
};

const bots = [
    { nombre: "Bot #1", sessionId: "bot1", port: 3001 }
];

const main = async () => {
    await Promise.all(
        bots.map(bot => createInstance(bot.nombre, bot.sessionId, bot.port))
    );
};

main();
