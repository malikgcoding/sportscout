<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get the API key from environment variable
$apiKey = getenv('DEEPSEEK_API_KEY');
if (!$apiKey) {
    http_response_code(500);
    echo json_encode(['error' => 'API key not configured']);
    exit;
}

// Get the JSON input
$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['prompt'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request format']);
    exit;
}

// Prepare the request to DeepSeek API
$data = [
    'model' => 'deepseek-chat',
    'messages' => [
        [
            'role' => 'system',
            'content' => 'You are a sports expert who analyzes personality profiles to recommend perfect sports matches. Provide clear, specific recommendations with reasoning.'
        ],
        [
            'role' => 'user',
            'content' => $input['prompt']
        ]
    ],
    'max_tokens' => 1000,
    'temperature' => 0.7
];

// Make the API request
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://api.deepseek.com/chat/completions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to get AI response']);
    exit;
}

$decodedResponse = json_decode($response, true);
if (!$decodedResponse || !isset($decodedResponse['choices'][0]['message']['content'])) {
    http_response_code(500);
    echo json_encode(['error' => 'Invalid API response']);
    exit;
}

// Return the AI response
echo json_encode([
    'success' => true,
    'recommendation' => $decodedResponse['choices'][0]['message']['content']
]);
?>
