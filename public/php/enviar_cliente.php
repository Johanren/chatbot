<?php
$data = json_decode(file_get_contents("php://input"), true);
$telefono = $data['telefono'];
$mensaje = $data['mensaje'];

// Aquí puedes usar tu sistema de envío por WhatsApp (ej: API, Bot de Baileys, etc.)
file_put_contents("log_asesor.txt", "Enviar a $telefono: $mensaje\n", FILE_APPEND);

echo json_encode(["success" => true]);
