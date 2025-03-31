const { createBot, createProvider, createFlow, addKeyword, EVENTS, media, addAnswer } = require('@bot-whatsapp/bot');
const WebWhatsappProvider = require('@bot-whatsapp/provider/web-whatsapp');
const MockAdapter = require('@bot-whatsapp/database/mock');

const TIMEOUT_INACTIVIDAD = 10 * 60 * 1000; // 10 minutos
const sesiones = new Map();
const temporizadores = new Map();

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
        if (sesiones.has(user)) {
            sesiones.get(user).sendMessage("⏳ Has estado inactivo por más de 10 minutos. Se cerrará la sesión.");
            limpiarEstadoUsuario(user);
        }
    }, TIMEOUT_INACTIVIDAD);

    temporizadores.set(user, timer);
};

/*Flujo Principal*/

const flowPrincipalAsesor = addKeyword(EVENTS.WELCOME)
    .addAction(async (ctx, { gotoFlow }) => {
        const estado = getEstadoUsuario(ctx.from);

        // Si el usuario está esperando un asesor, bloquea el flujo principal
        if (estado?.esperandoAsesor) {
            console.log("🔒 Actualmente estás esperando a un asesor. No se ejecutará el flujo principal.");
            return;  // No hace nada, evitando el flujo
        }

        // Si no está esperando un asesor, continuar con el flujo principal
        return gotoFlow(flowPrincipal);
    });



const flowPrincipal = addKeyword(EVENTS.WELCOME)
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
            if (ctx.body.trim().toLowerCase() === "si"  || ctx.body.trim().toLowerCase() === "Si") {
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
        const seleccion = ctx.body.trim();
        const respuestas = {
            "1": "📡 Tu conexión está funcionando correctamente.",
            "2": "🔧 Puedes contactar a soporte técnico al 123-456-7890.",
            "3": "📅 No hay mantenimientos programados en este momento.",
        };
        if (seleccion === "9") return gotoFlow(flowVolverMenuPrincipal);
        await flowDynamic("⏳ Por favor, espera un momento mientras procesamos tu solicitud...");
        await new Promise(resolve => setTimeout(resolve, 20000)); // 20 segundos de espera
        await flowDynamic(respuestas[seleccion] || "⚠️ Opción no válida. Intente nuevamente." + gotoFlow(flowConsultaServicio));
        return;
    });

const flowFacturacionPagos = addKeyword(EVENTS.ACTION)
    .addAnswer([
        "👇 *Facturación y Pagos:*",
        "1️⃣💰 Consultar saldo",
        "2️⃣💳 Realizar un pago",
        "3️⃣📜 Historial de facturación",
        "9️⃣ Volver al menú principal"
    ], { capture: true }, async (ctx, { flowDynamic, gotoFlow }) => {
        const seleccion = ctx.body.trim();
        const respuestas = {
            "1": "💰 Tu saldo es de $50,000 COP.",
            "2": "💳 Puedes realizar un pago en nuestra plataforma.",
            "3": "📜 Aquí está tu historial de pagos.",
        };
        if (seleccion === "9") return gotoFlow(flowVolverMenuPrincipal);
        await flowDynamic("⏳ Por favor, espera un momento mientras procesamos tu solicitud...");
        await new Promise(resolve => setTimeout(resolve, 20000)); // 20 segundos de espera
        await flowDynamic(respuestas[seleccion] || "⚠️ Opción no válida. Intente nuevamente." + gotoFlow(flowFacturacionPagos));
        return;
    });

const flowPlanesPromociones = addKeyword(EVENTS.ACTION)
    .addAnswer([
        "👇 *Planes y Promociones:*",
        "1️⃣📄 Explorar planes",
        "2️⃣🔥 Promociones actuales",
        "3️⃣🔄 Cambio de plan",
        "9️⃣ Volver al menú principal"
    ], { capture: true }, async (ctx, { flowDynamic, gotoFlow }) => {
        const seleccion = ctx.body.trim();
        const respuestas = {
            "1": "📄 Planes de hasta 1 Gbps disponibles.",
            "2": "🔥 10% de descuento en nuevos suscriptores.",
            "3": "🔄 Contacta a un asesor para cambiar de plan."
        };
        if (seleccion === "9") return gotoFlow(flowVolverMenuPrincipal);
        await flowDynamic("⏳ Por favor, espera un momento mientras procesamos tu solicitud...");
        await new Promise(resolve => setTimeout(resolve, 20000)); // 20 segundos de espera
        await flowDynamic(respuestas[seleccion] || "⚠️ Opción no válida. Intente nuevamente." + gotoFlow(flowPlanesPromociones));
        return;
    });

const flowSoporteTecnico = addKeyword(EVENTS.ACTION)
    .addAnswer([
        "👇 *Soporte Técnico Avanzado:*",
        "1️⃣🔍 Diagnóstico de red",
        "2️⃣⚙️ Configuración avanzada",
        "3️⃣📞 Contactar a un técnico",
        "9️⃣ Volver al menú principal"
    ], { capture: true }, async (ctx, { flowDynamic, gotoFlow }) => {
        const seleccion = ctx.body.trim();
        const respuestas = {
            "1": "🔍 Realiza un diagnóstico de red en nuestra app.",
            "2": "⚙️ Consulta nuestra guía de configuración avanzada.",
            "3": "📞 Llama al 123-456-7890 para soporte técnico."
        };
        if (seleccion === "9") return gotoFlow(flowVolverMenuPrincipal);
        await flowDynamic("⏳ Por favor, espera un momento mientras procesamos tu solicitud...");
        await new Promise(resolve => setTimeout(resolve, 20000)); // 20 segundos de espera
        await flowDynamic(respuestas[seleccion] || "⚠️ Opción no válida. Intente nuevamente." + gotoFlow(flowSoporteTecnico));
        return;
    });

const flowConsultaPersonalizada = addKeyword(EVENTS.ACTION)
    .addAnswer([
        "👇 *Consulta Personalizada:*",
        "1️⃣ Asistente inteligente",
        "2️⃣ Sugerencias basadas en historial",
        "9️⃣ Volver al menú principal"
    ], { capture: true }, async (ctx, { flowDynamic, gotoFlow }) => {
        const seleccion = ctx.body.trim();
        const respuestas = {
            "1": " Describe tu problema o consulta y recibirás una respuesta personalizada",
            "2": " Si has interactuado antes, puedo ofrecerte soluciones basadas en tus consultas pasadas."
        };
        if (seleccion === "9") return gotoFlow(flowVolverMenuPrincipal);
        await flowDynamic("⏳ Por favor, espera un momento mientras procesamos tu solicitud...");
        await new Promise(resolve => setTimeout(resolve, 20000)); // 20 segundos de espera
        await flowDynamic(respuestas[seleccion] || "⚠️ Opción no válida. Intente nuevamente." + gotoFlow(flowSoporteTecnico));
        return;
    });

const flowAsistenciaTiendoReal = addKeyword(EVENTS.ACTION)
    .addAnswer([
        "👇 *Asistencia en Tiempo Real:*",
        "1️⃣ Hablar con un agente",
        "2️⃣ Programar una llamada",
        "9️⃣ Volver al menú principal"
    ], { capture: true }, async (ctx, { flowDynamic, gotoFlow }) => {
        const seleccion = ctx.body.trim();

        if (seleccion === "9") return gotoFlow(flowVolverMenuPrincipal);

        // Respuestas según opción seleccionada
        if (seleccion === "1") {
            await flowDynamic("🔄 Conéctate con un representante humano para asistencia directa.");
            return gotoFlow(flowChatAsesor);
        }

        if (seleccion === "2") {
            await flowDynamic("📞 Si prefieres que te contacten, déjanos tu información.");
            return gotoFlow(flowChatAsesor);
        }

        // Opción no válida
        await flowDynamic("⚠️ Opción no válida. Intente nuevamente.");
        return gotoFlow(flowSoporteTecnico);
    });


const flowComentarioSugerencia = addKeyword(EVENTS.ACTION)
    .addAnswer([
        "👇 *Comentarios y Sugerencias:*",
        "1️⃣ Dejar una opinión",
        "2️⃣ Participar en encuestas",
        "9️⃣ Volver al menú principal"
    ], { capture: true }, async (ctx, { flowDynamic, gotoFlow }) => {
        const seleccion = ctx.body.trim();
        const respuestas = {
            "1": " Comparte tu experiencia y sugerencias para mejorar.",
            "2": " Ayúdanos a mejorar nuestros servicios respondiendo a breves encuestas"
        };
        if (seleccion === "9") return gotoFlow(flowVolverMenuPrincipal);
        await flowDynamic("⏳ Por favor, espera un momento mientras procesamos tu solicitud...");
        await new Promise(resolve => setTimeout(resolve, 20000)); // 20 segundos de espera
        await flowDynamic(respuestas[seleccion] || "⚠️ Opción no válida. Intente nuevamente." + gotoFlow(flowSoporteTecnico));
        return;
    });

const flowInformacionGeneral = addKeyword(EVENTS.ACTION)
    .addAnswer([
        "👇 *Información General:*",
        "1️⃣ Preguntas frecuentes",
        "2️⃣ Políticas de uso y privacidad",
        "9️⃣ Volver al menú principal"
    ], { capture: true }, async (ctx, { flowDynamic, gotoFlow }) => {
        const seleccion = ctx.body.trim();
        const respuestas = {
            "1": " Encuentra respuestas a las preguntas más comunes.",
            "2": " Consulta nuestras políticas y términos."
        };
        if (seleccion === "9") return gotoFlow(flowVolverMenuPrincipal);
        await flowDynamic("⏳ Por favor, espera un momento mientras procesamos tu solicitud...");
        await new Promise(resolve => setTimeout(resolve, 20000)); // 20 segundos de espera
        await flowDynamic(respuestas[seleccion] || "⚠️ Opción no válida. Intente nuevamente." + gotoFlow(flowSoporteTecnico));
        return;
    });

/*Hablar con un accesor*/

// Inicializar el objeto global si no existe
if (!global.tiempoInactividad) {
    global.tiempoInactividad = {};
}

const flowChatAsesor = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { flowDynamic, gotoFlow }) => {
        const usuarioID = ctx.from;

        // Marcar como esperando asesor
        setEstadoUsuario(usuarioID, { esperandoAsesor: true });

        if (ctx.body.trim() === "0") {
            limpiarEstadoUsuario(usuarioID);
            return gotoFlow(flowMenuPrincipal); // Regresar al flujo principal
        }

        // Mensaje después de 2 segundos
        setTimeout(async () => {
            await flowDynamic("👇 *En un momento, uno de nuestros asesores se comunicará contigo.*");
        }, 2000);

        // Configurar recordatorio de inactividad después de 5 minutos (300,000 ms)
        if (global.tiempoInactividad[usuarioID]) {
            clearTimeout(global.tiempoInactividad[usuarioID]); // Limpiar cualquier temporizador previo
        }

        global.tiempoInactividad[usuarioID] = setTimeout(async () => {
            const estado = getEstadoUsuario(usuarioID);
            if (estado?.esperandoAsesor) {
                await flowDynamic("⏳ Parece que has estado inactivo. Si deseas cerrar la conversación, responde con *0️⃣*.");
            }
        }, 300000); // 5 minutos en milisegundos
    });


const main = async () => {
    const adapterDB = new MockAdapter();
    const adapterFlow = createFlow([flowPrincipalAsesor, flowPrincipal, flowMenuPrincipal, flowConsultaServicio, flowFacturacionPagos, flowPlanesPromociones, flowSoporteTecnico, flowConsultaPersonalizada, flowAsistenciaTiendoReal, flowComentarioSugerencia, flowInformacionGeneral, flowCerrarSesion, flowVolverMenuPrincipal, flowChatAsesor, flowCerrarConversacion]);
    const adapterProvider = createProvider(WebWhatsappProvider);
    createBot({ flow: adapterFlow, provider: adapterProvider, database: adapterDB });

    console.log("🤖 Bot en ejecución...");
};

main();
