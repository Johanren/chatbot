<?php
header("Content-Type: application/json");

// Leer los nuevos datos del cuerpo de la petición
$nuevosChats = json_decode(file_get_contents("php://input"), true);

// Verifica que se haya enviado algo válido
if (!$nuevosChats || !is_array($nuevosChats)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Datos inválidos"]);
    exit;
}

$archivo = "../json/chats.json";

// Leer los chats actuales (si existen)
$chatsExistentes = file_exists($archivo) ? json_decode(file_get_contents($archivo), true) : [];

// Fusionar los mensajes por usuario
foreach ($nuevosChats as $usuario => $mensajesNuevos) {
    if (!isset($chatsExistentes[$usuario])) {
        $chatsExistentes[$usuario] = $mensajesNuevos;
    } else {
        // Agregar solo mensajes nuevos que no existan (puedes usar una lógica más robusta si quieres evitar duplicados exactos)
        foreach ($mensajesNuevos as $mensaje) {
            if (!in_array($mensaje, $chatsExistentes[$usuario])) {
                $chatsExistentes[$usuario][] = $mensaje;
            }
        }
    }
}

// Guardar el archivo actualizado
file_put_contents($archivo, json_encode($chatsExistentes, JSON_PRETTY_PRINT));

http_response_code(200);
echo json_encode(["status" => "ok"]);
