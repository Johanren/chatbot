<?php
$data = json_decode(file_get_contents('php://input'), true);
file_put_contents('../json/datos_localstorage.json', json_encode($data));
echo json_encode(['status' => 'ok']);
?>
