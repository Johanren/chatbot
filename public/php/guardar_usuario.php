<?php
$data = json_decode(file_get_contents('php://input'), true);
$archivo = '../json/usuarios_activos.json';

$usuarios = file_exists($archivo) ? json_decode(file_get_contents($archivo), true) : [];

if (!in_array($data['usuario'], $usuarios)) {
    $usuarios[] = $data['usuario'];
    file_put_contents($archivo, json_encode($usuarios));
}
echo json_encode(['status' => 'ok']);
?>
