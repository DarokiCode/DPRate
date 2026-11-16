<?php
// /api/account.php (logged-in users only)
//   GET                                   -> the user's details and their own reviews
//   PUT {username, email}                 -> update username and email
//   PUT {current_password, new_password}  -> change the password
//   PUT {plan}                            -> switch plan: standard, silver or gold (demo, no payment)
//   PUT {avatar}                          -> choose a profile picture allowed by the plan (null = initials)
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
$changesPlan = array_key_exists('plan', $data);
$changesAvatar = array_key_exists('avatar', $data);

$changes = (int) $changesPassword + (int) $changesDetails + (int) $changesPlan + (int) $changesAvatar;
if ($changes > 1) {
    json_error('Update one part of your account at a time.', 400);
}
if ($changes === 0) {
    json_error('Nothing to update.', 400);
}

// ---------- Plan (demo of the subscription model: no payment is taken) ----------
if ($changesPlan) {
    $plan = is_string($data['plan']) ? $data['plan'] : '';
    if (!plan_exists($plan)) {
        json_error('Choose the Standard, Silver or Gold plan.', 422);
    }

    // A picture from a higher plan goes back to the initials when the player moves down.
    $avatar = $account['avatar'];
    if ($avatar !== null && !avatar_allowed($avatar, $plan)) {
        $avatar = null;
    }

    db()->prepare('UPDATE users SET plan = :plan, avatar = :avatar WHERE id = :id')
        ->execute(['plan' => $plan, 'avatar' => $avatar, 'id' => $account['id']]);

    $_SESSION['user'] = public_user(array_merge($account, ['plan' => $plan, 'avatar' => $avatar]));
    json_response(['success' => true, 'message' => 'You are now on the ' . PLANS[$plan]['name'] . ' plan.', 'user' => current_user()]);
}

// ---------- Profile picture ----------
if ($changesAvatar) {
    $avatar = $data['avatar'];
    if ($avatar !== null && (!is_string($avatar) || !avatar_exists($avatar))) {
        json_error('Choose one of the DPRate profile pictures.', 422);
    }
    if ($avatar !== null && !avatar_allowed($avatar, $account['plan'])) {
        json_error('This profile picture comes with a higher plan.', 403);
    }

    db()->prepare('UPDATE users SET avatar = :avatar WHERE id = :id')
        ->execute(['avatar' => $avatar, 'id' => $account['id']]);

    $_SESSION['user'] = public_user(array_merge($account, ['avatar' => $avatar]));
    json_response(['success' => true, 'message' => 'Profile picture updated.', 'user' => current_user()]);
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
$_SESSION['user'] = public_user(array_merge($account, ['username' => $username, 'email' => $email]));

json_response(['success' => true, 'message' => 'Account details updated.', 'user' => current_user()]);
