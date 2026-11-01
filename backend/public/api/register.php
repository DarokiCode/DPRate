<?php
// POST /api/register.php {username, email, password} -> creates an account and logs it in.
require __DIR__ . '/../../includes/helpers.php';

require_method('POST');

$data = read_json_body();
$username = trim((string) ($data['username'] ?? ''));
$email = trim((string) ($data['email'] ?? ''));
$password = (string) ($data['password'] ?? '');

// Same rules as the React form: username min 3, password min 8.
// 72 bytes is the limit of bcrypt, the hash used by password_hash().
$errors = [];
if (!preg_match('/^[A-Za-z0-9_]{3,30}$/', $username)) {
    $errors[] = 'Username must have 3 to 30 letters, numbers or underscores.';
}
if (strlen($email) > 255 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Enter a valid email address.';
}
if (strlen($password) < 8 || strlen($password) > 72) {
    $errors[] = 'Password must have between 8 and 72 characters.';
}

if ($errors) {
    json_response(['success' => false, 'message' => implode(' ', $errors)], 422);
}

// Named placeholders must be different when a value is used twice (PDO rule).
$check = db()->prepare('SELECT id FROM users WHERE username = :username OR email = :email LIMIT 1');
$check->execute(['username' => $username, 'email' => $email]);

if ($check->fetch()) {
    json_response(['success' => false, 'message' => 'Username or email is already registered.'], 409);
}

$insert = db()->prepare('INSERT INTO users (username, email, password_hash) VALUES (:username, :email, :hash)');

try {
    $insert->execute([
        'username' => $username,
        'email' => $email,
        'hash' => password_hash($password, PASSWORD_DEFAULT),
    ]);
} catch (PDOException $e) {
    // Two people registering at the same time: the UNIQUE keys in MySQL catch it.
    if ($e->getCode() === '23000') {
        json_response(['success' => false, 'message' => 'Username or email is already registered.'], 409);
    }
    throw $e;
}

$user = [
    'id' => (int) db()->lastInsertId(),
    'username' => $username,
    'email' => $email,
];

start_api_session();
session_regenerate_id(true);
$_SESSION['user'] = $user;

json_response(['success' => true, 'user' => $user], 201);
