<?php
// Sessions, the logged-in user, account rules and CSRF protection.

// ---------- Session ----------

function is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || strtolower($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'
        || ($_SERVER['SERVER_PORT'] ?? '') === '443';
}

// Starts the PHP session. The session id travels in a cookie that:
// - JavaScript cannot read (HttpOnly), so a script injected in a page cannot steal it;
// - other websites do not receive on POST requests (SameSite=Lax);
// - only travels over HTTPS on the live site (Secure).
function start_api_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    ini_set('session.use_strict_mode', '1');     // refuse session ids the server did not create
    ini_set('session.gc_maxlifetime', '7200');   // stay logged in for 2 hours without activity
    session_name('DPRATESESSID');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => is_https(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

// ---------- Logged-in user ----------

// Only these fields may leave the server. Never the password hash.
function public_user(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'username' => $row['username'],
        'email' => $row['email'],
        'plan' => $row['plan'] ?? 'standard',   // standard, silver or gold
        'avatar' => $row['avatar'] ?? null,     // chosen profile picture, null = initials
    ];
}

// The user saved in the session at login, or null for a visitor.
function current_user(): ?array
{
    return $_SESSION['user'] ?? null;
}

// Stops the request with 401 when nobody is logged in.
// The user id always comes from the session, never from the request,
// so nobody can act as another user by sending a different id.
function require_login(): array
{
    $user = current_user();

    if (!$user) {
        json_error('Please log in to continue.', 401);
    }

    return $user;
}

// Saves the user in a brand-new session id (prevents session fixation)
// and gives the new session its own CSRF token.
function log_in_user(array $row): void
{
    session_regenerate_id(true);
    $_SESSION['user'] = public_user($row);
    rotate_csrf_token();
}

function find_user(int $id): ?array
{
    $stmt = db()->prepare('SELECT id, username, email, password_hash, plan, avatar FROM users WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $id]);
    return $stmt->fetch() ?: null;
}

// ---------- Account rules (same rules for register and the account page) ----------

function username_error(string $username): ?string
{
    return preg_match('/^[A-Za-z0-9_]{3,30}$/', $username)
        ? null
        : 'Username must have 3 to 30 letters, numbers or underscores.';
}

function email_error(string $email): ?string
{
    return strlen($email) <= 255 && filter_var($email, FILTER_VALIDATE_EMAIL)
        ? null
        : 'Enter a valid email address.';
}

// 72 bytes is the limit of bcrypt, the hash used by password_hash().
function password_error(string $password): ?string
{
    $length = strlen($password);
    return $length >= 8 && $length <= 72
        ? null
        : 'Password must have between 8 and 72 characters.';
}

// ---------- CSRF protection (OWASP synchronizer token pattern) ----------
// CSRF: another website tries to make the browser of a logged-in user send a request to DPRate.
// Every request that changes data must pass two checks:
// 1. it comes from the DPRate website itself (browser headers);
// 2. it carries the secret token of this session in the X-CSRF-Token header.
//    React receives the token from session.php and adds the header to every change.

function csrf_token(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function rotate_csrf_token(): string
{
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf_token'];
}

function require_csrf(): void
{
    if (!request_from_this_site()) {
        json_response(['success' => false, 'message' => 'This request did not come from the DPRate website.', 'csrf' => true], 403);
    }

    $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $expected = $_SESSION['csrf_token'] ?? '';

    // hash_equals compares in constant time, so the token cannot be guessed by timing.
    if ($expected === '' || !is_string($sent) || !hash_equals($expected, $sent)) {
        json_response(['success' => false, 'message' => 'Your security token expired. Please try again.', 'csrf' => true], 403);
    }
}

// Modern browsers say where a request comes from (Sec-Fetch-Site).
// Older browsers send Origin or Referer, which are compared with this site.
function request_from_this_site(): bool
{
    $fetchSite = $_SERVER['HTTP_SEC_FETCH_SITE'] ?? '';
    if ($fetchSite !== '') {
        return $fetchSite === 'same-origin';
    }

    $source = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($source === '' && !empty($_SERVER['HTTP_REFERER'])) {
        $source = origin_of($_SERVER['HTTP_REFERER']);
    }

    if ($source === '') {
        // No browser headers at all (for example a test tool). The token check still applies.
        return true;
    }

    $thisSite = (is_https() ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST'] ?? '');
    return $source === $thisSite || in_array($source, app_config()['allowed_origins'], true);
}

function origin_of(string $url): string
{
    $parts = parse_url($url);
    if (empty($parts['scheme']) || empty($parts['host'])) {
        return '';
    }
    return $parts['scheme'] . '://' . $parts['host'] . (isset($parts['port']) ? ':' . $parts['port'] : '');
}
