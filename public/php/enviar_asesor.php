<?php
$data = json_decode(file_get_contents("php://input"), true);

$numero_asesor = $data['numero_asesor'];
$numero_cliente = $data['numero_cliente'];
$usuario = $data['usuario'];
$asesor = $data['asesor'];

$mensajeAsesor = "Hola, el número $numero_cliente necesita una asesoría. Por favor comunícate con él.";
$mensajeCliente = "En un momento un asesor se comunicará contigo. Si no recibes respuesta, responde a este chat para reasignarte otro asesor.";

function enviarAlServidor($mensaje, $destino, $asesor) {
    $ch = curl_init("http://localhost:3000/enviar");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        "numero" => $destino,
        "mensaje" => $mensaje,
        "asesor" => $asesor
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
    $response = curl_exec($ch);
    curl_close($ch);
    return $response;
}

$res1 = enviarAlServidor($mensajeAsesor, $numero_asesor, $asesor);

// mensaje interno al cliente en el chat
$ch = curl_init("http://localhost:3000/agregar-mensaje-cliente");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "numero" => $numero_cliente,
    "asesor" => $asesor,
    "mensaje" => $mensajeCliente
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
$res2 = curl_exec($ch);
curl_close($ch);

echo json_encode([
    "asesor" => json_decode($res1, true),
    "cliente" => json_decode($res2, true)
]);
?>
