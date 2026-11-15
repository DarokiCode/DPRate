<?php
// GET /api/session.php -> the logged-in user (or null) and this session's CSRF token.
// React calls it when the site opens, and again if a token expires.
require __DIR__ . '/../../includes/bootstrap.php';

require_method('GET');
start_api_session();

json_response(['success' => true, 'user' => current_user(), 'csrf_token' => csrf_token()]);
