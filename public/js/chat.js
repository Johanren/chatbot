document.getElementById("toggleSidebar").addEventListener("click", function () {
    const sidebar = document.querySelector(".sidebar");
    sidebar.classList.toggle("active");
});
let asesorActual = "";
let rolAsesor = "";
const secretKey = "JohanAna1007";
const params = new URLSearchParams(window.location.search);
const encryptedData = params.get("data");
const storedToken = localStorage.getItem("authToken");

if (!encryptedData || !storedToken) {
    alert("Acceso no autorizado. Inicie sesión nuevamente.");
    window.location.href = "login.html";
} else {
    try {
        const decryptedURL = JSON.parse(CryptoJS.AES.decrypt(encryptedData, secretKey).toString(CryptoJS.enc.Utf8));
        const decryptedLocal = JSON.parse(CryptoJS.AES.decrypt(storedToken, secretKey).toString(CryptoJS.enc.Utf8));

        if (decryptedURL.user !== decryptedLocal.user || decryptedURL.sessionID !== decryptedLocal.sessionID) {
            throw new Error("Sesión inválida");
        }

        asesorActual = decryptedURL.user;
        rolAsesor = decryptedURL.rol;
        //console.log(asesorActual);
        // Obtener usuarios activos existentes o crear un arreglo nuevo
        let usuariosActivos = JSON.parse(localStorage.getItem("usuariosActivos")) || [];

        // Agregar el usuario si no está en la lista
        if (!usuariosActivos.includes(asesorActual)) {
            usuariosActivos.push(asesorActual);
            localStorage.setItem("usuariosActivos", JSON.stringify(usuariosActivos));
        }

    } catch (error) {
        alert("Acceso no autorizado. Inicie sesión nuevamente.");
        window.location.href = "login.html";
    }
}

// Mostrar botones de admin si aplica
if (rolAsesor === "admin") {
    document.getElementById("admin-controls").style.display = "block";
}

// Modal y cierre de sesión
const botonAbrir = document.getElementById("mostrarModal");
const botonCerrar = document.getElementById("cerrarModal");
const modal = document.getElementById("modal-usuarios");
const listaUsuarios = document.getElementById("lista-usuarios-activos");
const borrarMemoria = document.getElementById("borrarMemoriaChats");
const cerrarSesionBtn = document.getElementById("cerrarSesion");

if (botonAbrir) {
    botonAbrir.addEventListener("click", () => {
        fetch("php/obtener_usuarios.php")
            .then(res => res.json())
            .then(usuariosActivos => {
                listaUsuarios.innerHTML = "";
                usuariosActivos.forEach(u => {
                    const li = document.createElement("li");
                    li.innerHTML = `<span class="punto-verde"></span> ${u}`;
                    listaUsuarios.appendChild(li);
                });
                modal.style.display = "flex";
            });
    });
}


if (botonCerrar) {
    botonCerrar.addEventListener("click", () => {
        modal.style.display = "none";
    });
}

if (cerrarSesionBtn) {
    cerrarSesionBtn.addEventListener("click", () => {
        const asesorActual = JSON.parse(localStorage.getItem("usuariosActivos"))[0]; // "asesor1"

        fetch("php/eliminar_usuario.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario: asesorActual })
        });


        // Guardar todo el localStorage en archivo
        const localData = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            localData[key] = localStorage.getItem(key);
        }

        fetch("php/guardar_localstorage.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(localData)
        }).then(() => {
            localStorage.clear();
            window.location.href = "login.html";
        });
    });
}
const ws = new WebSocket("ws://localhost:3000");
//const ws = new WebSocket("wss://3b59-2803-e5e3-2810-7900-1862-447a-ad19-e93.ngrok-free.app");
let chats = JSON.parse(localStorage.getItem("chats")) || [];

if (!chats || Object.keys(chats).length === 0) {
    fetch("json/chats.json")
        .then(res => res.json())
        .then(data => {
            chats = data;
            localStorage.setItem("chats", JSON.stringify(chats)); // 🔁 Restaurar en localStorage
            mostrarUsuarios(chats);
        })
        .catch(err => console.error("❌ No se pudo cargar chats.json", err));
} else {
    mostrarUsuarios(chats);
}
//console.log(chats);
let usuarioActivo = null;
let usuariosBloqueados = new Map(); // Almacena los usuarios bloqueados
function bloquearUsuario(usuario) {
    if (!usuariosBloqueados.has(usuario)) {
        usuariosBloqueados.set(usuario, asesorActual);
        actualizarListaUsuarios();
    }
}

function desbloquearUsuario(usuario) {
    if (usuariosBloqueados.has(usuario)) {
        usuariosBloqueados.delete(usuario);
        actualizarListaUsuarios();
    }
}

function actualizarListaUsuarios() {
    const userList = document.getElementById("user-list");
    userList.childNodes.forEach(userItem => {
        let usuario = userItem.getAttribute("data-usuario");
        if (usuariosBloqueados.has(usuario)) {
            userItem.style.pointerEvents = "none"; // Bloquear clics
            userItem.style.opacity = "0.5"; // Reducir visibilidad
        } else {
            userItem.style.pointerEvents = "auto"; // Habilitar clics
            userItem.style.opacity = "1"; // Restaurar visibilidad
        }
    });
}

mostrarUsuarios(chats);

// Detectar "Enter" en el input de mensaje
document.getElementById("message-input").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault(); // Evitar salto de línea en el input
        enviarMensaje();
    }
});


if (borrarMemoria) {
    borrarMemoria.addEventListener("click", () => {
        localStorage.removeItem("chats");
        chats = {};
        mostrarUsuarios({});
        document.getElementById("chat-messages").innerHTML = "";
        document.getElementById("chat-title").innerText = "Selecciona un usuario para ver el chat";
    });
}

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.tipo === "actualizar") {
        if (data.asesor === asesorActual) {
            mostrarUsuarios(data.chats);

            // ✅ Guardar en localStorage los nuevos mensajes
            localStorage.setItem("chats", JSON.stringify(data.chats));

            // ✅ Guardar en archivo JSON con PHP
            guardarChatsEnServidor(data.chats);

            if (usuarioActivo && data.chats[usuarioActivo]) {
                abrirChat(usuarioActivo, data.chats[usuarioActivo]);
            }
        }
    }
};

function enviarMensaje() {
    let input = document.getElementById("message-input");
    let mensajeTexto = input.value.trim();

    if (mensajeTexto !== "" && usuarioActivo) {
        let nuevoMensaje = {
            mensaje: mensajeTexto,
            fecha: new Date().toLocaleDateString(),
            hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            asesor: true,
            enviadoDesdeWeb: true
        };
        ws.send(JSON.stringify({
            tipo: "mensajeWeb",
            usuarioWeb: usuarioActivo,
            mensajeWeb: mensajeTexto,
            asesorWeb: asesorActual
        }));

        agregarMensajeAlChat(nuevoMensaje, usuarioActivo);
        input.value = "";

        // 🔥 Forzar actualización de la lista de usuarios
        mostrarUsuarios(chats);
    }
}


function agregarMensajeAlChat(mensaje, usuario) {
    const chatMessages = document.getElementById("chat-messages");
    let msgDiv = document.createElement("div");
    msgDiv.classList.add("message");

    if (mensaje.asesor && mensaje.enviadoDesdeWeb) {
        msgDiv.classList.add("asesor-web");
    } else if (mensaje.asesor) {
        msgDiv.classList.add("asesor");
    } else {
        msgDiv.classList.add("cliente");
    }

    msgDiv.innerHTML = `
    ${mensaje.mensaje}
    <span class="timestamp">${mensaje.hora}</span>
`;

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Animación de aparición
    msgDiv.style.opacity = "0";
    setTimeout(() => {
        msgDiv.style.opacity = "1";
        msgDiv.style.transition = "opacity 0.3s ease-in-out";
    }, 100);

    // 🔥 Almacenar el mensaje en memoria
    if (!chats[usuarioActivo]) {
        chats[usuarioActivo] = [];
    }
    chats[usuarioActivo].push(mensaje);
    localStorage.setItem("chats", JSON.stringify(chats));
    document.getElementById("message-input").value = "";
    guardarChatsEnServidor(chats);
}


let segundosActuales = new Date().getSeconds(); // Inicializa con el segundo actual

// 🔥 Actualiza los segundos cada segundo para mantenerlos dinámicos
setInterval(() => {
    segundosActuales = new Date().getSeconds();
}, 1000);

function parsearFechaHora(fecha, hora) {
    let [dia, mes, anio] = fecha.split("/").map(n => n.padStart(2, "0"));

    let partesHora = hora.match(/(\d+):(\d+)\s?(a\.?m\.?|p\.?m\.?)?/i);
    if (!partesHora) {
        console.error("❌ Error: Formato de hora incorrecto", hora);
        return null;
    }

    let horas = parseInt(partesHora[1], 10);
    let minutos = partesHora[2].padStart(2, "0");
    let periodo = partesHora[3] ? partesHora[3].toLowerCase() : null;

    if (periodo) {
        if (periodo.includes("p") && horas !== 12) horas += 12; // PM y no es 12
        if (periodo.includes("a") && horas === 12) horas = 0;   // AM y es 12
    }

    // 🔥 Usa la variable de segundos actualizados dinámicamente
    setInterval(() => {
        let segundos = segundosActuales.toString().padStart(2, "0");
        console.log(segundos);
        return new Date(`${anio}-${mes}-${dia}T${horas.toString().padStart(2, "0")}:${minutos}:${segundos}`).getTime();
    }, 1000);

}

function mostrarUsuarios(chats) {
    const userList = document.getElementById("user-list");
    userList.innerHTML = "";

    let usuariosOrdenados = Object.entries(chats).sort((a, b) => {
        const mensajeA = a[1][a[1].length - 1];
        const mensajeB = b[1][b[1].length - 1];

        if (!mensajeA || !mensajeA.fecha || !mensajeA.hora) return 1;
        if (!mensajeB || !mensajeB.fecha || !mensajeB.hora) return -1;

        const fechaHoraA = parsearFechaHora(mensajeA.fecha, mensajeA.hora, new Date().toLocaleTimeString([], { second: '2-digit' }));
        const fechaHoraB = parsearFechaHora(mensajeB.fecha, mensajeB.hora, new Date().toLocaleTimeString([], { second: '2-digit' }));

        if (!fechaHoraA) return 1; // Evita errores si la fecha no se pudo parsear
        if (!fechaHoraB) return -1;

        return fechaHoraB - fechaHoraA;
    });

    usuariosOrdenados.forEach(([usuario, mensajes]) => {
        let userItem = document.createElement("div");
        userItem.classList.add("user");

        let ultimoMensaje = mensajes[mensajes.length - 1];

        let lastMessageTime = ultimoMensaje ? ultimoMensaje.hora : "Sin mensajes";
        let lastMessageDate = ultimoMensaje ? ultimoMensaje.fecha : "";
        userItem.innerHTML = `
        <div style="display: flex; align-items: center;">
            <div class="user-icon">${usuario[0].toUpperCase()}</div> ${usuario}
        </div>
        <small>${lastMessageDate} - ${lastMessageTime}</small>
    `;
        userItem.onclick = () => {
            abrirChat(usuario, mensajes); // Abre el chat normal
        };
        userList.appendChild(userItem);
    });
}

function abrirChat(usuario, mensajesBot) {
    if (usuariosBloqueados.has(usuario) && usuariosBloqueados.get(usuario) !== asesorActual) {
        alert("Este usuario ya está siendo atendido por otro asesor.");
        return; // Evita abrir el chat si otro asesor ya lo bloqueó
    }
    usuarioActivo = usuario;
    bloquearUsuario(usuarioActivo); // Bloquea al usuario solo para otros asesores

    document.getElementById("chat-title").innerText = `Chat con ${usuario}`;
    document.getElementById("chat-title").style.display = "block";
    document.getElementById("input-container").style.display = "flex";
    const chatMessages = document.getElementById("chat-messages");
    chatMessages.innerHTML = "";
    chatMessages.style.display = "flex";
    chatMessages.style.flexDirection = "column";

    let mensajesWeb = chats[usuario] || [];
    let todosLosMensajes = [...mensajesBot, ...mensajesWeb];
    const fechaHoraActual = new Date();
    let segundos = 0;
    setInterval(() => {
        let fechaHoraActual = new Date();
        segundos = fechaHoraActual.toLocaleTimeString([], { second: '2-digit' });
        //todosLosMensajes.sort((a, b) => console.log(parsearFechaHora(a.fecha, a.hora)+parseInt(segundos)))
    }, 1000);

    todosLosMensajes.sort((a, b) => parsearFechaHora(a.fecha, a.hora) + parseInt(segundos) - parsearFechaHora(b.fecha, b.hora) + parseInt(segundos));
    let ultimaFecha = "";
    todosLosMensajes.forEach(m => {
        let fechaMensaje = m.fecha;
        if (fechaMensaje !== ultimaFecha) {
            let dateSeparator = document.createElement("div");
            dateSeparator.classList.add("date-separator");
            dateSeparator.innerText = fechaMensaje;
            chatMessages.appendChild(dateSeparator);
            ultimaFecha = fechaMensaje;
        }

        let msgDiv = document.createElement("div");
        msgDiv.classList.add("message");

        if (m.asesor && m.enviadoDesdeWeb) {
            msgDiv.classList.add("asesor-web");
            msgDiv.style.alignSelf = "flex-end";
        } else if (m.asesor) {
            msgDiv.classList.add("asesor");
            msgDiv.style.alignSelf = "flex-start";
        } else {
            msgDiv.classList.add("cliente");
            msgDiv.style.alignSelf = "flex-start";
        }

        msgDiv.innerHTML = `${m.mensaje}<span class="timestamp">${m.hora}</span>`;
        chatMessages.appendChild(msgDiv);

        // 🔥 Desbloquea automáticamente si el usuario finaliza la conversación
        if (m.mensaje.includes("Sesión terminada por inactividad del usuario") || m.mensaje.includes("Conversación terminada por el cliente")) {
            desbloquearUsuario(usuario);
        }
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
}


function parsearFechaHora(fecha, hora) {
    let [dia, mes, anio] = fecha.split("/").map(n => n.padStart(2, "0"));

    // 🔥 Convertir "12:00 p. m." a formato de 24 horas
    let partesHora = hora.match(/(\d+):(\d+)\s?(a\.?m\.?|p\.?m\.?)?/i);

    if (!partesHora) {
        console.error("❌ Error: Formato de hora incorrecto", hora);
        return null;
    }

    let horas = parseInt(partesHora[1], 10);
    let minutos = partesHora[2].padStart(2, "0");
    let periodo = partesHora[3] ? partesHora[3].toLowerCase() : null;

    if (periodo) {
        if (periodo.includes("p") && horas !== 12) horas += 12; // PM y no es 12
        if (periodo.includes("a") && horas === 12) horas = 0;   // AM y es 12
    }

    // 🔥 Usar segundos actuales del sistema
    let segundos = new Date().getSeconds().toString().padStart(2, "0");
    //console.log(segundos);
    return new Date(`${anio}-${mes}-${dia}T${horas.toString().padStart(2, "0")}:${minutos}:${segundos}`).getTime();
}

function corregirFormatoHora(hora) {
    let [horas, minutos] = hora.split(":");
    return `${horas}:${minutos}`;
}

function guardarChatsEnServidor(chats) {
    fetch("php/guardar_chats.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chats)
    })
        .then(res => res.ok ? console.log("✅ Chats guardados en el servidor") : console.error("❌ Error al guardar"))
        .catch(err => console.error("❌ Error de red:", err));
}