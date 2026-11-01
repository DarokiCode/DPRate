<?php
// POST /api/logout.php -> ends the session and removes the cookie.
require __DIR__ . '/../../includes/helpers.php';

require_method('POST');

start_api_session();

$_SESSION = [];

$params = session_get_cookie_params();
setcookie(session_name(), '', [
    'expires' => time() - 42000,
    'path' => $params['path'],
    'httponly' => true,
    'samesite' => 'Lax',
]);

session_destroy();

json_response(['success' => true, 'message' => 'Signed out.']);
