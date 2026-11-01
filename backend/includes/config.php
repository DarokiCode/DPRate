<?php
// Database settings.
// The defaults below match a standard XAMPP install (user root, no password).
// Environment variables can override them, which is how the tests are run.
return [
    'db_host' => getenv('DB_HOST') ?: '127.0.0.1',
    'db_name' => getenv('DB_NAME') ?: 'dprate',
    'db_user' => getenv('DB_USER') ?: 'root',
    'db_pass' => getenv('DB_PASS') ?: '',
    'db_charset' => 'utf8mb4',
];
