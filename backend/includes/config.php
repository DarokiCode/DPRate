<?php
// Site settings.
// The defaults match a standard XAMPP install: MySQL on port 3306, user root, no password.
// Each computer or server changes only what is different in config.local.php.
// That file is ignored by Git, so real passwords never go to GitHub.
// Environment variables also work (the automated tests use them).
$config = [
    'db_host' => getenv('DB_HOST') ?: '127.0.0.1',
    'db_port' => (int) (getenv('DB_PORT') ?: 3306),
    'db_name' => getenv('DB_NAME') ?: 'dprate',
    'db_user' => getenv('DB_USER') ?: 'root',
    'db_pass' => getenv('DB_PASS') ?: '',
    'db_charset' => 'utf8mb4',

    // Websites allowed to send POST, PUT and DELETE requests, besides the site itself.
    // These two are the Vite development server used while coding.
    'allowed_origins' => ['http://localhost:5173', 'http://127.0.0.1:5173'],
];

$localFile = __DIR__ . '/config.local.php';
if (is_file($localFile)) {
    $config = array_replace($config, require $localFile);
}

return $config;
