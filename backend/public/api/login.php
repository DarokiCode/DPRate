<?php
// POST /api/login.php {login, password} -> logs in with username OR email.
require __DIR__ . '/../../includes/bootstrap.php';

require_method('POST');
start_api_session();
require_csrf();

$data = read_json_body();
$login = body_string($data, 'login');
$password = is_string($data['password'] ?? null) ? $data['password'] : '';

if ($login === '' || $password === '') {
    json_error('Enter your username or email and password.', 400);
}

// Two different placeholder names, because PDO does not allow reusing one.
$stmt = db()->prepare(
    'SELECT id, username, email, password_hash FROM users
     WHERE username = :login_username OR email = :login_email
     LIMIT 1'
);
$stmt->execute(['login_username' => $login, 'login_email' => $login]);
$row = $stmt->fetch();

// Same message for "no such user" and "wrong password", so attackers learn nothing.
if (!$row || !password_verify($password, $row['password_hash'])) {
    json_error('Invalid username/email or password.', 401);
}

// If PHP's default hashing algorithm gets stronger, old hashes are upgraded at login.
if (password_needs_rehash($row['password_hash'], PASSWORD_DEFAULT)) {
    db()->prepare('UPDATE users SET password_hash = :hash WHERE id = :id')
        ->execute(['hash' => password_hash($password, PASSWORD_DEFAULT), 'id' => $row['id']]);
}

log_in_user($row);

json_response(['success' => true, 'user' => current_user(), 'csrf_token' => csrf_token()]);
