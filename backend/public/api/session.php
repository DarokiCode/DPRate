<?php
// GET /api/session.php -> the logged-in user, or null (checked when the site loads).
require __DIR__ . '/../../includes/helpers.php';

require_method('GET');

start_api_session();

json_response(['success' => true, 'user' => $_SESSION['user'] ?? null]);
