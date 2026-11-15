<?php
// POST /api/logout.php -> ends the login. The old session id stops working on the server.
require __DIR__ . '/../../includes/bootstrap.php';

require_method('POST');
start_api_session();
require_csrf();

$_SESSION = [];
session_regenerate_id(true); // move to a new empty session and delete the old one

json_response(['success' => true, 'message' => 'Signed out.', 'csrf_token' => rotate_csrf_token()]);
