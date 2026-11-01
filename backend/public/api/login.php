<?php
// POST /api/login.php {login, password} -> login with username OR email.
require __DIR__ . '/../../includes/helpers.php';

require_method('POST');

$data = read_json_body();
$login = trim((string) ($data['login'] ?? ''));
$password = (string) ($data['password'] ?? '');

if ($login === '' || $password === '') {
    json_response(['success' => false, 'message' => 'Enter your username or email and password.'], 400);
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
    json_response(['success' => false, 'message' => 'Invalid username/email or password.'], 401);
}

$user = public_user($row);

start_api_session();
session_regenerate_id(true); // new session id after login, to prevent session fixation
$_SESSION['user'] = $user;

json_response(['success' => true, 'user' => $user]);
