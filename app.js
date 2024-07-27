const { createBot, createProvider, createFlow, addKeyword, EVENTS, media, addAnswer } = require('@bot-whatsapp/bot')

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')
const INACTIVITY = 600000

//FINALIZACION DE LA CONVERSACIÓN POR TIEMPO DE EXPIRACIÓN
const flowTime = addKeyword(EVENTS.ACTION)
    .addAction(
        async (ctx, { endFlow }) => {
            endFlow(`Se notifica que el usuario ha sido desconectado del chat por una inactividad de 10 minutos.`)
        }
    )

//SALUDO DE DESPEDIDA AL FINALIZAR LA CONVERSACIÓN
const flowExit = addKeyword(EVENTS.ACTION)
    .addAction(
        async ({ endFlow }) => {
            endFlow([
                '¡Gracias por contactarnos! Recuerde que estamos para ayudarle 👩🏻',
                '\nVisitenos en https://www.junicalmedical.com.co/'
            ])
        }
    )

const flowItem9 = addKeyword(EVENTS.ACTION)
    .addAnswer(
        [
            
            '*Apreciado usuario:* Para radicar su solicitud como peticiones, quejas, reclamos, sugerencias y felicitaciones, por alguno de los siguientes medios:\n',
            '1️⃣ *Correo electronico:*\natencionalcliente@junicalmedical.com.co\n',
            '2️⃣ *Buzones de sugerencias:*\nUbicados en cada uno de los servicios de hospitalización, consulta externa, urgencias, medicina nuclear, imágenes diagnosticas, cardiología y archivo.\n',
            '3️⃣ *WhatsApp:*\n312 593 97 60\n',
            '4️⃣ *Página web:*\nhttps://www.junicalmedical.com.co/contactenos/\n',
            '5️⃣ *Formulario digital:*\nhttps://forms.office.com/r/JPPcJ7b0R5?origin=lprLink\n',
            '6️⃣ *Presencial:*\nEn la Carrera 6 No. 20 - 115 Altos del Rosario. Girardot, área de atención al usuario de lunes a sábado de 7:00 A. M. a 7:00 P. M., jornada continua, domingos o festivos 11:00 A. M. a 3:00 P. M. debe diligenciar previamente el formulario\n https://servicioalcliente.junicalmedical.com.co/declaracion_del_usuario_relacionada.pdf\n',            
            'La solicitud es atendida por orden de llegada en el menor tiempo posible.'
        ])
    .addAnswer(
        [
            '👇 Seleccione alguna de las siguientes opciones:\n',
            '1️⃣ Para devolverse al menú principal.',
            '0️⃣ Para finalizar la conversación.'
        ], { capture: true, idle: INACTIVITY }, async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
            const object_text = ctx.message.extendedTextMessage ? ctx.message.extendedTextMessage.text : ctx.message.conversation;
            if (ctx?.idleFallBack) {
                console.log('SELECCIONÓ: INACTIVIDAD FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowTime);
            } else if (object_text === '1') {
                console.log('SELECCIONÓ: FLOWPRINCIPAL');
                await gotoFlow(flowSecundario);
            } else if (object_text === '0') {
                console.log('SELECCIONÓ: FLOWEXIT FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowExit);
            } else {
                await fallBack('Recuerde que soy un robot 🤖. Elija una opción válida');
            }
        }
    );

//OPCION DE CITAS 8.4 Historia clinica a paciente fallecido. 👎
const flowItem84 = addKeyword(EVENTS.ACTION)
    .addAnswer(
        [
            'Señor usuario, para radicar su solicitud enviar los formatos diligenciados y documentos requeridos, por alguno de los siguientes medios: \n',
            '1️⃣ *Correo electrónico:*\n historias.clinicas@junical.com.co',
            '2️⃣ *WhatsApp:*\n 310 793 92 42',
            '3️⃣ *Presencial:*\n En la Carrera 6 No. 20 - 115 Altos del Rosario. Girardot, área de archivo de historias clínicas de lunes a viernes (no festivos) de 8:00 A. M. a 3:00 P. M., jornada continua.\n',
            'La solicitud es atendida por un solo medio y en orden de llegada en el menor tiempo posible',
        ], { delay: 3000, }
    )
    .addAnswer(
        [
            '*HISTORIA CLÍNICA DE PACIENTE FALLECIDO.*\n',
            '✅ Anexar fotocopia del Registro Civil de Defunción.',
            '✅ Fotocopia de la cédula del paciente, registro civil o tarjeta de identidad.',
            '✅ Registro civil para verificar el parentesco, en caso que sea hijo y/o padres.',
            '✅ Si el solicitante es cónyuge, registro de matrimonio.',
            '✅ Si es compañero o compañera presentar extra juicio de convivencia realizado en vida.',
            '✅ Presentar el formulario diligenciado y firmado autorizado adjunto',
            '(SOLICITUD AUTORIZACIÓN TERCEROS).'
        ])
    .addAnswer('.', {
        media: './assets/Solicitud_autorizacion_terceros.pdf',
    })
    .addAnswer(
        [
            '👇 Seleccione alguna de las siguientes opciones:\n',
            '1️⃣ Para devolverse al menú principal.',
            '2️⃣ Para devolverse al menú anterior.',
            '0️⃣ Para finalizar la conversación.'
        ], { capture: true, idle: INACTIVITY }, async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
            const object_text = ctx.message.extendedTextMessage ? ctx.message.extendedTextMessage.text : ctx.message.conversation;
            if (ctx?.idleFallBack) {
                console.log('SELECCIONÓ: INACTIVIDAD FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowTime);
            } else if (object_text === '1') {
                console.log('SELECCIONÓ: FLOWPRINCIPAL');
                await gotoFlow(flowSecundario);
            } else if (object_text === '2') {
                console.log('SELECCIONÓ: MENU ANTERIOR');
                await gotoFlow(flowItem8);
            } else if (object_text === '0') {
                console.log('SELECCIONÓ: FLOWEXIT FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowExit);
            } else {
                await fallBack('Recuerde que soy un robot 🤖. Elija una opción válida');
            }
        }
    );

//OPCION DE CITAS 8.3 Historia clinica a paciente menor de edad o persona en condcion de discapacidad mental o fisica. 👎
const flowItem83 = addKeyword(EVENTS.ACTION)
    .addAnswer(
        [
            'Señor usuario, para radicar su solicitud enviar los formatos diligenciados y documentos requeridos, por alguno de los siguientes medios: \n',
            '1️⃣ *Correo electrónico:*\n historias.clinicas@junical.com.co',
            '2️⃣ *WhatsApp:*\n 310 793 92 42',
            '3️⃣ *Presencial:*\n En la Carrera 6 No. 20 - 115 Altos del Rosario. Girardot, área de archivo de historias clínicas de lunes a viernes (no festivos) de 8:00 A. M. a 3:00 P. M., jornada continua.\n',
            'La solicitud es atendida por un solo medio y en orden de llegada en el menor tiempo posible',
        ], { delay: 3000, }
    )
    .addAnswer(
        [
            '*HISTORIA CLÍNICA DE PACIENTE MENOR DE EDAD O PERSONA EN CONDICIÓN DE DISCAPACIDAD MENTAL O FÍSICA.*\n',
            '✅ Carta de solicitud del padre, madre o representante legal explicando el motivo de la solicitud.',
            '✅ Fotocopia del documento de identificación.',
            '(Registro Civil, Tarjeta de Identidad y Cédula de Ciudadanía)',
            '✅ Fotocopia del documento de identidad del padre, madre o representante legal.',
            '(En caso que el apoderado es un abogado debe presentar la copia de la tarjeta de profesional)',
            '✅ Presentar el formulario diligenciado y firmado autorizado adjunto',
            '(SOLICITUD AUTORIZACIÓN TERCEROS).'
        ])
    .addAnswer('.', {
        media: './assets/Solicitud_autorizacion_terceros.pdf',
    })
    .addAnswer(
        [
            '👇 Seleccione alguna de las siguientes opciones:\n',
            '1️⃣ Para devolverse al menú principal.',
            '2️⃣ Para devolverse al menú anterior.',
            '0️⃣ Para finalizar la conversación.'
        ], { capture: true, idle: INACTIVITY }, async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
            const object_text = ctx.message.extendedTextMessage ? ctx.message.extendedTextMessage.text : ctx.message.conversation;
            if (ctx?.idleFallBack) {
                console.log('SELECCIONÓ: INACTIVIDAD FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowTime);
            } else if (object_text === '1') {
                console.log('SELECCIONÓ: FLOWPRINCIPAL');
                await gotoFlow(flowSecundario);
            } else if (object_text === '2') {
                console.log('SELECCIONÓ: MENU ANTERIOR');
                await gotoFlow(flowItem8);
            } else if (object_text === '0') {
                console.log('SELECCIONÓ: FLOWEXIT FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowExit);
            } else {
                await fallBack('Recuerde que soy un robot 🤖. Elija una opción válida');
            }
        }
    );

//OPCION DE CITAS 8.2 Historia clinica a tercero autorizado. 👎
const flowItem82 = addKeyword(EVENTS.ACTION)
    .addAnswer(
        [
            'Señor usuario, para radicar su solicitud enviar los formatos diligenciados y documentos requeridos, por alguno de los siguientes medios: \n',
            '1️⃣ *Correo electrónico:*\n historias.clinicas@junical.com.co',
            '2️⃣ *WhatsApp:*\n 310 793 92 42',
            '3️⃣ *Presencial:*\n En la Carrera 6 No. 20 - 115 Altos del Rosario. Girardot, área de archivo de historias clínicas de lunes a viernes (no festivos) de 8:00 A. M. a 3:00 P. M., jornada continua.\n',
            'La solicitud es atendida por un solo medio y en orden de llegada en el menor tiempo posible',
        ], { delay: 3000, }
    )
    .addAnswer(
        [
            '*HISTORIA CLÍNICA PARA TERCERO AUTORIZADO.*\n',
            '✅ Presentar carta de autorización firmada al departamento de archivo explicando el motivo de la solicitud.',
            '✅ Fotocopia del documento de identidad del paciente.',
            '✅ Fotocopia del documento de identidad del autorizado.',
            '✅ Presentar el formulario diligenciado y firmado autorizado adjunto',
            '(SOLICITUD AUTORIZACIÓN TERCEROS).'
        ])
    .addAnswer('.', {
        media: './assets/Solicitud_autorizacion_terceros.pdf',
    })
    .addAnswer(
        [
            '👇 Seleccione alguna de las siguientes opciones:\n',
            '1️⃣ Para devolverse al menú principal.',
            '2️⃣ Para devolverse al menú anterior.',
            '0️⃣ Para finalizar la conversación.'
        ], { capture: true, idle: INACTIVITY }, async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
            const object_text = ctx.message.extendedTextMessage ? ctx.message.extendedTextMessage.text : ctx.message.conversation;
            if (ctx?.idleFallBack) {
                console.log('SELECCIONÓ: INACTIVIDAD FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowTime);
            } else if (object_text === '1') {
                console.log('SELECCIONÓ: FLOWPRINCIPAL');
                await gotoFlow(flowSecundario);
            } else if (object_text === '2') {
                console.log('SELECCIONÓ: MENU ANTERIOR');
                await gotoFlow(flowItem8);
            } else if (object_text === '0') {
                console.log('SELECCIONÓ: FLOWEXIT FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowExit);
            } else {
                await fallBack('Recuerde que soy un robot 🤖. Elija una opción válida');
            }
        }
    );

//OPCION DE CITAS 8.1 Historia clinica (Mayor de edad) 👎
const flowItem81 = addKeyword(EVENTS.ACTION)
    .addAnswer(
        [
            'Señor usuario, para radicar su solicitud enviar los formatos diligenciados y documentos requeridos, por alguno de los siguientes medios: \n',
            '1️⃣ *Correo electrónico:*\n historias.clinicas@junical.com.co',
            '2️⃣ *WhatsApp:*\n 310 793 92 42',
            '3️⃣ *Presencial:*\n En la Carrera 6 No. 20 - 115 Altos del Rosario. Girardot, área de archivo de historias clínicas de lunes a viernes (no festivos) de 8:00 A. M. a 3:00 P. M., jornada continua.\n',
            'La solicitud es atendida por un solo medio y en orden de llegada en el menor tiempo posible',
        ], { delay: 3000, }
    )
    .addAnswer(
        [
            '*HISTORIA CLÍNICA DE PACIENTE MAYOR DE EDAD.*\n',
            '✅ Presentar documento de identidad original.',
            '(Cédula de ciudadanía, Cédula de extranjería o Pasaporte)',
            '✅ Diligenciar y firmar el formulario adjunto.',
            '(PACIENTE DIRECTAMENTE)'
        ])
    .addAnswer('.', {
        media: './assets/Paciente_directamente.pdf', delay: 3000,
    })
    .addAnswer(
        [
            '👇 Seleccione alguna de las siguientes opciones:\n',
            '1️⃣ Para devolverse al menú principal.',
            '2️⃣ Para devolverse al menú anterior.',
            '0️⃣ Para finalizar la conversación.'
        ], { capture: true, idle: INACTIVITY }, async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
            const object_text = ctx.message.extendedTextMessage ? ctx.message.extendedTextMessage.text : ctx.message.conversation;
            if (ctx?.idleFallBack) {
                console.log('SELECCIONÓ: INACTIVIDAD FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowTime);
            } else if (object_text === '1') {
                console.log('SELECCIONÓ: FLOWPRINCIPAL');
                await gotoFlow(flowSecundario);
            } else if (object_text === '2') {
                console.log('SELECCIONÓ: MENU ANTERIOR');
                await gotoFlow(flowItem8);
            } else if (object_text === '0') {
                console.log('SELECCIONÓ: FLOWEXIT FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowExit);
            } else {
                await fallBack('Recuerde que soy un robot 🤖. Elija una opción válida');
            }
        }
    );

//OPCION 8 Requisitos para la entrega de la historia clínica. 👍
const flowItem8 = addKeyword(EVENTS.ACTION)
    .addAnswer(
        [
            '👇 Seleccione una de las siguientes opciones.\n',
            '1️⃣ Historia clínica (Mayor de edad).',
            '2️⃣ Historia clínica a tercero autorizado.',
            '3️⃣ Historia clínica a paciente menor de edad o persona en condición de discapacidad mental o física.',
            '4️⃣ Historia clínica a paciente fallecido.',
            '5️⃣ Para devolverse al menú anterior.',
            '0️⃣ Para finalizar la conversación.'
        ], { capture: true, idle: INACTIVITY }, async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
            const object_text = ctx.message.extendedTextMessage ? ctx.message.extendedTextMessage.text : ctx.message.conversation;
            if (ctx?.idleFallBack) {
                console.log('SELECCIONÓ: INACTIVIDAD FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowTime);
            } else if (object_text === '1') {
                console.log('SELECCIONÓ: OPCION 1');
                await gotoFlow(flowItem81);
            } else if (object_text === '2') {
                console.log('SELECCIONÓ: OPCION 2');
                await gotoFlow(flowItem82);
            } else if (object_text === '3') {
                console.log('SELECCIONÓ: OPCION 3');
                await gotoFlow(flowItem83);
            } else if (object_text === '4') {
                console.log('SELECCIONÓ: OPCION 4');
                await gotoFlow(flowItem84);
            } else if (object_text === '5') {
                console.log('SELECCIONÓ: FLOWPRINCIPAL');
                await gotoFlow(flowSecundario);
            } else if (object_text === '0') {
                console.log('SELECCIONÓ: FLOWEXIT FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowExit);
            } else {
                await fallBack('Recuerde que soy un robot 🤖. Elija una opción válida');
            }
        }
    );

//OPCION DE CITAS 7.5 Agendamiento odontología 👎
const flowItem75 = addKeyword(EVENTS.ACTION)
    .addAnswer(
        [
            '*Contactos de odontología*\n',
            '📲 Llamadas y whatsApp: 3222638365',
            '\n*Correo electrónico*\n',
            '📩 odontologia@junical.com.co'
        ])
    .addAnswer(
        [
            '👇 Seleccione alguna de las siguientes opciones:\n',
            '1️⃣ Para devolverse al menú principal.',
            '2️⃣ Para devolverse al menú anterior.',
            '0️⃣ Para finalizar la conversación.'
        ], { capture: true, idle: INACTIVITY }, async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
            const object_text = ctx.message.extendedTextMessage ? ctx.message.extendedTextMessage.text : ctx.message.conversation;
            if (ctx?.idleFallBack) {
                console.log('SELECCIONÓ: INACTIVIDAD FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowTime);
            } else if (object_text === '1') {
                console.log('SELECCIONÓ: FLOWPRINCIPAL');
                await gotoFlow(flowSecundario);
            } else if (object_text === '2') {
                console.log('SELECCIONÓ: MENU ANTERIOR');
                await gotoFlow(flowItem7);
            } else if (object_text === '0') {
                console.log('SELECCIONÓ: FLOWEXIT FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowExit);
            } else {
                await fallBack('Recuerde que soy un robot 🤖. Elija una opción válida');
            }
        }
    );

//OPCION DE CITAS 7.4 Agendamiento de terapias 👎
const flowItem74 = addKeyword(EVENTS.ACTION)
    .addAnswer(
        [
            '*Contactos de terapias*\n',
            '📲 Llamadas y whatsApp: 314 489 87 18',
            '\n*Correo electrónico*\n',
            '📩 terapias.ambulatorias@junical.com.co '
        ])
    .addAnswer(
        [
            '👇 Seleccione alguna de las siguientes opciones:\n',
            '1️⃣ Para devolverse al menú principal.',
            '2️⃣ Para devolverse al menú anterior.',
            '0️⃣ Para finalizar la conversación.'
        ], { capture: true, idle: INACTIVITY }, async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
            const object_text = ctx.message.extendedTextMessage ? ctx.message.extendedTextMessage.text : ctx.message.conversation;
            if (ctx?.idleFallBack) {
                console.log('SELECCIONÓ: INACTIVIDAD FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowTime);
            } else if (object_text === '1') {
                console.log('SELECCIONÓ: FLOWPRINCIPAL');
                await gotoFlow(flowSecundario);
            } else if (object_text === '2') {
                console.log('SELECCIONÓ: MENU ANTERIOR');
                await gotoFlow(flowItem7);
            } else if (object_text === '0') {
                console.log('SELECCIONÓ: FLOWEXIT FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowExit);
            } else {
                await fallBack('Recuerde que soy un robot 🤖. Elija una opción válida');
            }
        }
    );

//OPCION DE CITAS 7.3 Agendamiento medicina nuclear 👎
const flowItem73 = addKeyword(EVENTS.ACTION)
    .addAnswer(
        [
            '*Contactos de medicina nuclear*\n',
            '📲 Llamadas y whatsApp: 317 365 17 53',
            '\n*Correo electrónico*\n',
            '📩 medicina.nuclear@junical.com.co'
        ])
    .addAnswer(
        [
            '👇 Seleccione alguna de las siguientes opciones:\n',
            '1️⃣ Para devolverse al menú principal.',
            '2️⃣ Para devolverse al menú anterior.',
            '0️⃣ Para finalizar la conversación.'
        ], { capture: true, idle: INACTIVITY }, async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
            const object_text = ctx.message.extendedTextMessage ? ctx.message.extendedTextMessage.text : ctx.message.conversation;
            if (ctx?.idleFallBack) {
                console.log('SELECCIONÓ: INACTIVIDAD FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowTime);
            } else if (object_text === '1') {
                console.log('SELECCIONÓ: FLOWPRINCIPAL');
                await gotoFlow(flowSecundario);
            } else if (object_text === '2') {
                console.log('SELECCIONÓ: MENU ANTERIOR');
                await gotoFlow(flowItem7);
            } else if (object_text === '0') {
                console.log('SELECCIONÓ: FLOWEXIT FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowExit);
            } else {
                await fallBack('Recuerde que soy un robot 🤖. Elija una opción válida');
            }
        }
    );

//OPCION DE CITAS 7.2 Agendamiento imágenes diagnósticas 👍
const flowItem72 = addKeyword(EVENTS.ACTION)
    .addAnswer(
        [
            '*Contactos de imágenes diagnósticas*\n',
            '📲 llamadas y whatsApp: 312 528 95 39',
            '\n*Correo electrónico*\n',
            '📩 radiologia@junical.com.co'
        ])
    .addAnswer(
        [
            '👇 Seleccione alguna de las siguientes opciones:\n',
            '1️⃣ Para devolverse al menú principal.',
            '2️⃣ Para devolverse al menú anterior.',
            '0️⃣ Para finalizar la conversación.'
        ], { capture: true, idle: INACTIVITY }, async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
            const object_text = ctx.message.extendedTextMessage ? ctx.message.extendedTextMessage.text : ctx.message.conversation;
            if (ctx?.idleFallBack) {
                console.log('SELECCIONÓ: INACTIVIDAD FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowTime);
            } else if (object_text === '1') {
                console.log('SELECCIONÓ: FLOWPRINCIPAL');
                await gotoFlow(flowSecundario);
            } else if (object_text === '2') {
                console.log('SELECCIONÓ: MENU ANTERIOR');
                await gotoFlow(flowItem7);
            } else if (object_text === '0') {
                console.log('SELECCIONÓ: FLOWEXIT FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowExit);
            } else {
                await fallBack('Recuerde que soy un robot 🤖. Elija una opción válida');
            }
        }
    );

//OPCION DE CITAS 7.1 Agendamiento de citas médicas 👍
const flowItem71 = addKeyword(EVENTS.ACTION)
    .addAnswer(
        [
            '*Contactos de citas médicas*\n',
            '📲 Eps solo whatsApp: 313 329 70 20',
            '📲 Eps solo llamadas: 322 721 99 44',
            '📲 Eps sanitas, llamadas y whatsApp: 311 512 98 29',
            '📲 Particulares y medicina prepagada, llamadas y WhatsApp: 310 208 53 17',
            '\n*Correos electrónicos*\n',
            '📩 citas.medicas@junicalmedical.com.co',
            '📩 servicio.preferencial@junical.com.co'
        ])
    .addAnswer(
        [
            '👇 Seleccione alguna de las siguientes opciones:\n',
            '1️⃣ Para devolverse al menú principal.',
            '2️⃣ Para devolverse al menú anterior.',
            '0️⃣ Para finalizar la conversación.'
        ], { capture: true, idle: INACTIVITY }, async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
            const object_text = ctx.message.extendedTextMessage ? ctx.message.extendedTextMessage.text : ctx.message.conversation;
            if (ctx?.idleFallBack) {
                console.log('SELECCIONÓ: INACTIVIDAD FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowTime);
            } else if (object_text === '1') {
                console.log('SELECCIONÓ: FLOWPRINCIPAL');
                await gotoFlow(flowSecundario);
            } else if (object_text === '2') {
                console.log('SELECCIONÓ: MENU ANTERIOR');
                await gotoFlow(flowItem7);
            } else if (object_text === '0') {
                console.log('SELECCIONÓ: FLOWEXIT FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowExit);
            } else {
                await fallBack('Recuerde que soy un robot 🤖. Elija una opción válida');
            }
        }
    );

//OPCION 7 Contactos sevicios de consulta externa 👍
const flowItem7 = addKeyword(EVENTS.ACTION)
    .addAnswer(
        [
            '👇 Seleccione una de las siguientes opciones.\n',
            '1️⃣ Citas médicas.',
            '2️⃣ Imágenes diagnósticas.',
            '3️⃣ Medicina nuclear.',
            '4️⃣ Terapias.',
            '5️⃣ Odontología.',
            '6️⃣ Para devolverse al menú anterior.',
            '0️⃣ Para finalizar la conversación.'
        ], { capture: true, idle: INACTIVITY }, async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
            const object_text = ctx.message.extendedTextMessage ? ctx.message.extendedTextMessage.text : ctx.message.conversation;
            if (ctx?.idleFallBack) {
                console.log('SELECCIONÓ: INACTIVIDAD FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowTime);
            } else if (object_text === '1') {
                console.log('SELECCIONÓ: OPCION 1');
                await gotoFlow(flowItem71);
            } else if (object_text === '2') {
                console.log('SELECCIONÓ: OPCION 2');
                await gotoFlow(flowItem72);
            } else if (object_text === '3') {
                console.log('SELECCIONÓ: OPCION 3');
                await gotoFlow(flowItem73);
            } else if (object_text === '4') {
                console.log('SELECCIONÓ: OPCION 4');
                await gotoFlow(flowItem74);
            } else if (object_text === '5') {
                console.log('SELECCIONÓ: OPCION 5');
                await gotoFlow(flowItem75);
            } else if (object_text === '6') {
                console.log('SELECCIONÓ: FLOWPRINCIPAL');
                await gotoFlow(flowSecundario);
            } else if (object_text === '0') {
                console.log('SELECCIONÓ: FLOWEXIT FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowExit);
            } else {
                await fallBack('Recuerde que soy un robot 🤖. Elija una opción válida');
            }
        }
    );

//OPCION 6 Contactos del area de atencion al usuario 👍
const flowItem6 = addKeyword(EVENTS.ACTION)
    .addAnswer([
        '*Contactos del área de atención al usuario*\n',
        '📲 Llamadas y whatsApp: 312 593 97 60',
        '\n*Correo electrónico*\n',
        '📩 atencionalcliente@junicalmedical.com.co'
    ])
    .addAnswer(
        [
            '👇 Seleccione alguna de las siguientes opciones:\n',
            '1️⃣ Para devolverse al menú principal.',
            '0️⃣ Para finalizar la conversación.'
        ], { capture: true, idle: INACTIVITY }, async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
            const object_text = ctx.message.extendedTextMessage ? ctx.message.extendedTextMessage.text : ctx.message.conversation;
            if (ctx?.idleFallBack) {
                console.log('SELECCIONÓ: INACTIVIDAD FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowTime);
            } else if (object_text === '1') {
                console.log('SELECCIONÓ: FLOWPRINCIPAL');
                await gotoFlow(flowSecundario);
            } else if (object_text === '0') {
                console.log('SELECCIONÓ: FLOWEXIT FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowExit);
            } else {
                await fallBack('Recuerde que soy un robot 🤖. Elija una opción válida');
            }
        }
    );

//OPCION 5 Solicitud de dietas 👍
const flowItem5 = addKeyword(EVENTS.ACTION)
    .addAnswer('👇 Solicite su dieta haciendo clic en el siguiente enlace.')
    .addAnswer('https://alfonso.junicalmedical.com.co/frmPedPaci/frmPedPaciId')
    .addAnswer(
        [
            '👇 Seleccione alguna de las siguientes opciones:\n',
            '1️⃣ Para devolverse al menú principal.',
            '0️⃣ Para finalizar la conversación.'
        ], { capture: true, idle: INACTIVITY }, async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
            const object_text = ctx.message.extendedTextMessage ? ctx.message.extendedTextMessage.text : ctx.message.conversation;
            if (ctx?.idleFallBack) {
                console.log('SELECCIONÓ: INACTIVIDAD FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowTime);
            } else if (object_text === '1') {
                console.log('SELECCIONÓ: FLOWPRINCIPAL');
                await gotoFlow(flowSecundario);
            } else if (object_text === '0') {
                console.log('SELECCIONÓ: FLOWEXIT FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowExit);
            } else {
                await fallBack('Recuerde que soy un robot 🤖. Elija una opción válida');
            }
        }
    );

//OPCION 4 Solicitud de citas👍
const flowItem4 = addKeyword(EVENTS.ACTION)
    .addAnswer('👇 Solicite su cita en el siguiente enlace.')
    .addAnswer('http://citasweb.junicalmedical.com.co/NewCitasWeb/')
    .addAnswer(
        [
            '👇 Seleccione alguna de las siguientes opciones:\n',
            '1️⃣ Para devolverse al menú principal.',
            '0️⃣ Para finalizar la conversación.'
        ], { capture: true, idle: INACTIVITY }, async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
            const object_text = ctx.message.extendedTextMessage ? ctx.message.extendedTextMessage.text : ctx.message.conversation;
            if (ctx?.idleFallBack) {
                console.log('SELECCIONÓ: INACTIVIDAD FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowTime);
            } else if (object_text === '1') {
                console.log('SELECCIONÓ: FLOWPRINCIPAL');
                await gotoFlow(flowSecundario);
            } else if (object_text === '0') {
                console.log('SELECCIONÓ: FLOWEXIT FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowExit);
            } else {
                await fallBack('Recuerde que soy un robot 🤖. Elija una opción válida');
            }
        }
    );

//OPCION 3 Encuesta de satisfacción 👍
const flowItem3 = addKeyword(EVENTS.ACTION)
    .addAnswer('👇 Para diligenciar la encuesta oprima el siguiente link')
    .addAnswer('https://docs.google.com/forms/d/e/1FAIpQLScd8oEuy6h9Eua4arCw5Su1dnNqkpKYRdLpHcXFhnMOdBQTcA/viewform')
    .addAnswer('.', {
        media: './assets/qrEncuesta.jpeg',
    })
    .addAnswer(
        [
            '👇 Seleccione alguna de las siguientes opciones:\n',
            '1️⃣ Para devolverse al menú principal.',
            '0️⃣ Para finalizar la conversación.'
        ], { capture: true, idle: INACTIVITY }, async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
            const object_text = ctx.message.extendedTextMessage ? ctx.message.extendedTextMessage.text : ctx.message.conversation;
            if (ctx?.idleFallBack) {
                console.log('SELECCIONÓ: INACTIVIDAD FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowTime);
            } else if (object_text === '1') {
                console.log('SELECCIONÓ: FLOWPRINCIPAL');
                await gotoFlow(flowSecundario);
            } else if (object_text === '0') {
                console.log('SELECCIONÓ: FLOWEXIT FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowExit);
            } else {
                await fallBack('Recuerde que soy un robot 🤖. Elija una opción válida');
            }
        }
    );

//OPCION 2 información importante sobre el dengue 👍
const flowItem2 = addKeyword(EVENTS.ACTION)
    .addAnswer('🦟 Información importante sobre el dengue.')
    .addAnswer('.', {
        media: './assets/información_sobre_el_dengue.pdf',
    })
    .addAnswer(
        [
            '👇 Seleccione alguna de las siguientes opciones:\n',
            '1️⃣ Para devolverse al menú principal.',
            '0️⃣ Para finalizar la conversación.'
        ], { capture: true, idle: INACTIVITY }, async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
            const object_text = ctx.message.extendedTextMessage ? ctx.message.extendedTextMessage.text : ctx.message.conversation;
            if (ctx?.idleFallBack) {
                console.log('SELECCIONÓ: INACTIVIDAD FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowTime);
            } else if (object_text === '1') {
                console.log('SELECCIONÓ: FLOWPRINCIPAL');
                await gotoFlow(flowSecundario);
            } else if (object_text === '0') {
                console.log('SELECCIONÓ: FLOWEXIT FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowExit);
            } else {
                await fallBack('Recuerde que soy un robot 🤖. Elija una opción válida');
            }
        }
    );

//OPCION 1 Reglamento interno
const flowItem1 = addKeyword(EVENTS.ACTION)
    .addAnswer('📓 Derechos y deberes de los usuarios.')
    .addAnswer('.', {
        media: './assets/Derechos&deberes_usuarios.pdf',
    })
    .addAnswer(
        [
            '👇 Seleccione alguna de las siguientes opciones:\n',
            '1️⃣ Para devolverse al menú principal.',
            '0️⃣ Para finalizar la conversación.'
        ], { capture: true, idle: INACTIVITY }, async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
            const object_text = ctx.message.extendedTextMessage ? ctx.message.extendedTextMessage.text : ctx.message.conversation;
            if (ctx?.idleFallBack) {
                console.log('SELECCIONÓ: INACTIVIDAD FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowTime);
            } else if (object_text === '1') {
                console.log('SELECCIONÓ: FLOWPRINCIPAL');
                await gotoFlow(flowSecundario);
            } else if (object_text === '0') {
                console.log('SELECCIONÓ: FLOWEXIT FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowExit);
            } else {
                await fallBack('Recuerde que soy un robot 🤖. Elija una opción válida');
            }
        }
    );

const flowSecundario = addKeyword(EVENTS.WELCOME)
    .addAnswer(
        [
            '👇 Seleccione una de las siguientes opciones.\n',
            '1️⃣ Consultar manual de derechos y deberes de los usuarios.',
            '2️⃣ Boletin con información importante sobre el dengue.',
            '3️⃣ Encuesta de  satisfacción.',
            '4️⃣ Solicitud de citas.',
            '5️⃣ Solicitud de dietas hospitalarias',
            '6️⃣ Contactos para atención al usuario.',
            '7️⃣ Contactos servicios de consulta externa.',
            '8️⃣ Requisitos para la entrega de la historia clínica.',
            '9️⃣ Peticiones, quejas y reclamos',
            '0️⃣ Para finalizar la conversación.',
            '\n¡Gracias por contactarnos! Recuerde que estamos para ayudarle 👩🏻'
        ], { capture: true, idle: INACTIVITY, }, async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
            const object_text = ctx.message.extendedTextMessage ? ctx.message.extendedTextMessage.text : ctx.message.conversation;
            console.log('👉 CONTEXTO DEL MENSAJE FLOWPRINCIPAL: ', object_text);

            if (ctx?.idleFallBack) {
                console.log('SELECCIONÓ: INACTIVIDAD FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowTime);
            } else if (object_text === '1') {
                console.log('SELECCIONÓ: OPCION 1');
                await gotoFlow(flowItem1);
            } else if (object_text === '2') {
                console.log('SELECCIONÓ: OPCION 2');
                await gotoFlow(flowItem2);
            } else if (object_text === '3') {
                console.log('SELECCIONÓ: OPCION 3');
                await gotoFlow(flowItem3);
            } else if (object_text === '4') {
                console.log('SELECCIONÓ: OPCION 4');
                await gotoFlow(flowItem4);
            } else if (object_text === '5') {
                console.log('SELECCIONÓ: OPCION 5');
                await gotoFlow(flowItem5);
            } else if (object_text === '6') {
                console.log('SELECCIONÓ: OPCION 6');
                await gotoFlow(flowItem6);
            } else if (object_text === '7') {
                console.log('SELECCIONÓ: OPCION 7');
                await gotoFlow(flowItem7);
            } else if (object_text === '8') {
                console.log('SELECCIONÓ: OPCION 8');
                await gotoFlow(flowItem8);
            } else if (object_text === '9') {
                console.log('SELECCIONÓ: OPCION 9');
                await gotoFlow(flowItem9);
            } else if (object_text === '0') {
                console.log('SELECCIONÓ: OPCION EXIT');
                await gotoFlow(flowExit);
            } else {
                await fallBack('Recuerde que soy un robot 🤖. Elija una opción válida');
            }
        })

const flowPrincipal = addKeyword(EVENTS.WELCOME)
    .addAnswer('🙌 Bienvenido, soy el asistente virtual informativo de Junical Medical S. A. S.')
    .addAnswer('Le informamos que al continuar acepta las Políticas de Tratamiento de Información (Datos personales) (https://alfonso.junicalmedical.com.co/politica_de_privacidad_y_tratamiento_de_datos_personales) de Junical Medical S. A. S.')
    .addAnswer(
        [
            '👇 Seleccione una de las siguientes opciones.\n',
            '1️⃣ Consultar manual de derechos y deberes de los usuarios.',
            '2️⃣ Boletin con información importante sobre el dengue.',
            '3️⃣ Encuesta de  satisfacción.',
            '4️⃣ Solicitud de citas.',
            '5️⃣ Solicitud de dietas hospitalarias.',
            '6️⃣ Contactos para atención al usuario.',
            '7️⃣ Contactos servicios de consulta externa.',
            '8️⃣ Requisitos para la entrega de la historia clínica.',
            '9️⃣ Peticiones, quejas y reclamos',
            '0️⃣ Para finalizar la conversación.',
            '\n¡Gracias por contactarnos! Recuerde que estamos para ayudarle 👩🏻'
        ], { capture: true, idle: INACTIVITY, delay: 3000, }, async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
            const object_text = ctx.message.extendedTextMessage ? ctx.message.extendedTextMessage.text : ctx.message.conversation;
            console.log('👉 CONTEXTO DEL MENSAJE FLOWPRINCIPAL: ', object_text);

            if (ctx?.idleFallBack) {
                console.log('SELECCIONÓ: INACTIVIDAD FINALIZACION DE LA CONVERSACION');
                await gotoFlow(flowTime);
            } else if (object_text === '1') {
                console.log('SELECCIONÓ: OPCION 1');
                await gotoFlow(flowItem1);
            } else if (object_text === '2') {
                console.log('SELECCIONÓ: OPCION 2');
                await gotoFlow(flowItem2);
            } else if (object_text === '3') {
                console.log('SELECCIONÓ: OPCION 3');
                await gotoFlow(flowItem3);
            } else if (object_text === '4') {
                console.log('SELECCIONÓ: OPCION 4');
                await gotoFlow(flowItem4);
            } else if (object_text === '5') {
                console.log('SELECCIONÓ: OPCION 5');
                await gotoFlow(flowItem5);
            } else if (object_text === '6') {
                console.log('SELECCIONÓ: OPCION 6');
                await gotoFlow(flowItem6);
            } else if (object_text === '7') {
                console.log('SELECCIONÓ: OPCION 7');
                await gotoFlow(flowItem7);
            } else if (object_text === '8') {
                console.log('SELECCIONÓ: OPCION 8');
                await gotoFlow(flowItem8);
            } else if (object_text === '9') {
                console.log('SELECCIONÓ: OPCION 9');
                await gotoFlow(flowItem9);
            } else if (object_text === '0') {
                console.log('SELECCIONÓ: OPCION EXIT');
                await gotoFlow(flowExit);
            } else {
                await fallBack('Recuerde que soy un robot 🤖. Elija una opción válida');
            }
        })


const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = createFlow([flowPrincipal, flowSecundario, flowItem1, flowItem2, flowItem3, flowItem4, flowItem5, flowItem6, flowItem7, flowItem71, flowItem72, flowItem73, flowItem74, flowItem75, flowItem8, flowItem81, flowItem82, flowItem83, flowItem84, flowItem9, flowExit, flowTime])
    const adapterProvider = createProvider(BaileysProvider)


    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    },{
        blackList:'3156078058'
    })

    QRPortalWeb({ port: 4000 });
}

main()

