<?php
// Settings and the MySQL connection.

// Reads config.php once per request.
function app_config(): array
{
    static $config = null;
    if ($config === null) {
        $config = require __DIR__ . '/config.php';
    }
    return $config;
}

// Returns one shared PDO connection to MySQL for the whole request.
function db(): PDO
{
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $config = app_config();
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        $config['db_host'],
        $config['db_port'],
        $config['db_name'],
        $config['db_charset']
    );

    $pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        // Real prepared statements: the SQL and the values travel separately,
        // so user input can never change the SQL (protection against SQL injection).
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}

// True when MySQL refused a row because of a UNIQUE key (error 1062).
function is_duplicate_key(PDOException $e): bool
{
    return ($e->errorInfo[1] ?? null) === 1062;
}
