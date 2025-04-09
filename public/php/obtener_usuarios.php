<?php
$archivo = '../json/usuarios_activos.json';
if (file_exists($archivo)) {
    echo file_get_contents($archivo);
} else {
    echo json_encode([]);
}
?>
