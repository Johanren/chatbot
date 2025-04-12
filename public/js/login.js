// Usuarios en memoria (Para pruebas)
const usuarios = {
    "asesor1": { password: "1234", rol: "admin" },
    "asesor2": { password: "5678", rol: "soporte" }
};

const secretKey = "JohanAna1007"; // Clave secreta para encriptar/desencriptar

function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (usuarios[username] && usuarios[username].password === password) {
        const tokenData = {
            user: username,
            rol: usuarios[username].rol,
            timestamp: Date.now(),
            sessionID: Math.random().toString(36).substring(2, 15)
        };

        const encryptedToken = CryptoJS.AES.encrypt(JSON.stringify(tokenData), secretKey).toString();

        localStorage.setItem("authToken", encryptedToken);

        // Guardar asesor activo en archivo PHP
        fetch("php/guardar_usuario.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario: username })
        });

        window.location.href = `chat.html?data=${encodeURIComponent(encryptedToken)}`;
    } else {
        alert("Usuario o contraseña incorrectos");
    }
}
