<?php
// /api/account.php (logged-in users only)
//   GET                                   -> the user's details and their own reviews
//   PUT {username, email}                 -> update username and email
//   PUT {current_password, new_password}  -> change the password
require __DIR__ . '/../../includes/bootstrap.php';

$method = require_method('GET', 'PUT');
start_api_session();
$sessionUser = require_login();

// Always read the account from the database, not only from the session.
$account = find_user((int) $sessionUser['id']);
if (!$account) {
    $_SESSION = [];
    json_error('This account no longer exists. Please log in again.', 401);
}

if ($method === 'GET') {
    $stmt = db()->prepare(
        'SELECT reviews.id, reviews.game_id, games.title AS game_title, reviews.rating,
                reviews.comment, reviews.created_at
         FROM reviews
         INNER JOIN games ON games.id = reviews.game_id
         WHERE reviews.user_id = :user_id
         ORDER BY reviews.created_at DESC, reviews.id DESC'
    );
    $stmt->execute(['user_id' => $account['id']]);

    $reviews = array_map(fn (array $row): array => [
        'id' => (int) $row['id'],
        'game_id' => (int) $row['game_id'],
        'game_title' => $row['game_title'],
        'rating' => (int) $row['rating'],
        'comment' => $row['comment'],
        'created_at' => $row['created_at'],
    ], $stmt->fetchAll());

    json_response(['success' => true, 'user' => public_user($account), 'reviews' => $reviews]);
}

// ---------- PUT: changes ----------
require_csrf();
$data = read_json_body();

$changesPassword = array_key_exists('current_password', $data) || array_key_exists('new_password', $data);
$changesDetails = array_key_exists('username', $data) || array_key_exists('email', $data);

if ($changesPassword && $changesDetails) {
    json_error('Update your details and your password separately.', 400);
}
if (!$changesPassword && !$changesDetails) {
    json_error('Nothing to update.', 400);
}

if ($changesPassword) {
    $current = is_string($data['current_password'] ?? null) ? $data['current_password'] : '';
    $new = is_string($data['new_password'] ?? null) ? $data['new_password'] : '';

    if ($current === '') {
        json_error('Enter your current password.', 422);
    }
    if (!password_verify($current, $account['password_hash'])) {
        json_error('Your current password is incorrect.', 403);
    }
    if ($error = password_error($new)) {
        json_error($error, 422);
    }
    if (password_verify($new, $account['password_hash'])) {
        json_error('The new password must be different from the current one.', 422);
    }

    db()->prepare('UPDATE users SET password_hash = :hash WHERE id = :id')
        ->execute(['hash' => password_hash($new, PASSWORD_DEFAULT), 'id' => $account['id']]);

    // New session id and new CSRF token after a password change.
    session_regenerate_id(true);
    json_response(['success' => true, 'message' => 'Password updated', 'csrf_token' => rotate_csrf_token()]);
}

// Username and email: a field that is not sent keeps its current value.
$username = array_key_exists('username', $data) ? body_string($data, 'username') : $account['username'];
$email = array_key_exists('email', $data) ? body_string($data, 'email') : $account['email'];

$errors = array_filter([username_error($username), email_error($email)]);
if ($errors) {
    json_error(implode(' ', $errors), 422);
}

// Another account may already use the new username or email.
$check = db()->prepare(
    'SELECT username, email FROM users
     WHERE (username = :username OR email = :email) AND id <> :id
     LIMIT 1'
);
$check->execute(['username' => $username, 'email' => $email, 'id' => $account['id']]);
if ($taken = $check->fetch()) {
    $message = strcasecmp($taken['username'], $username) === 0
        ? 'That username is already taken.'
        : 'That email is already registered.';
    json_error($message, 409);
}

try {
    db()->prepare('UPDATE users SET username = :username, email = :email WHERE id = :id')
        ->execute(['username' => $username, 'email' => $email, 'id' => $account['id']]);
} catch (PDOException $e) {
    if (is_duplicate_key($e)) {
        json_error('That username or email is already in use.', 409);
    }
    throw $e;
}

// The header and session.php show the new name straight away.
$_SESSION['user'] = public_user(['id' => $account['id'], 'username' => $username, 'email' => $email]);

json_response(['success' => true, 'message' => 'Account details updated.', 'user' => current_user()]);
