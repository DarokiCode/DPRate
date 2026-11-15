<?php
// POST /api/register.php {username, email, password} -> creates an account and logs it in.
require __DIR__ . '/../../includes/bootstrap.php';

require_method('POST');
start_api_session();
require_csrf();

$data = read_json_body();
$username = body_string($data, 'username');
$email = body_string($data, 'email');
$password = is_string($data['password'] ?? null) ? $data['password'] : ''; // passwords are not trimmed

// Same rules as the React form and the account page.
$errors = array_filter([username_error($username), email_error($email), password_error($password)]);
if ($errors) {
    json_error(implode(' ', $errors), 422);
}

// Named placeholders must be different when a value is used twice (PDO rule).
$check = db()->prepare('SELECT id FROM users WHERE username = :username OR email = :email LIMIT 1');
$check->execute(['username' => $username, 'email' => $email]);

if ($check->fetch()) {
    json_error('Username or email is already registered.', 409);
}

$insert = db()->prepare('INSERT INTO users (username, email, password_hash) VALUES (:username, :email, :hash)');

try {
    $insert->execute([
        'username' => $username,
        'email' => $email,
        'hash' => password_hash($password, PASSWORD_DEFAULT), // bcrypt hash, never the real password
    ]);
} catch (PDOException $e) {
    // Two people registering at the same time: the UNIQUE keys in MySQL catch it.
    if (is_duplicate_key($e)) {
        json_error('Username or email is already registered.', 409);
    }
    throw $e;
}

log_in_user(['id' => (int) db()->lastInsertId(), 'username' => $username, 'email' => $email]);

json_response(['success' => true, 'user' => current_user(), 'csrf_token' => csrf_token()], 201);
