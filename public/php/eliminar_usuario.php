<?php
$data = json_decode(file_get_contents('php://input'), true);
$archivo = '../json/usuarios_activos.json';

// Verificar que se recibió un string válido
$usuario = isset($data['usuario']) && is_string($data['usuario']) ? $data['usuario'] : '';

if ($usuario === '') {
    echo json_encode(['status' => 'error', 'message' => 'Usuario inválido']);
    exit;
}

if (file_exists($archivo)) {
    $usuarios = json_decode(file_get_contents($archivo), true);

    $usuarios = array_filter($usuarios, function($u) use ($usuario) {
        return strtolower($u) !== strtolower($usuario);
    });

    file_put_contents($archivo, json_encode(array_values($usuarios)));
}

echo json_encode(['status' => 'ok']);
?>
