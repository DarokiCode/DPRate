<?php
// Loaded first by every endpoint in public/api.

// PHP warnings go to the server log, never into the page: one warning in the
// middle of the JSON would break the response that React reads.
ini_set('display_errors', '0');
ini_set('log_errors', '1');

require_once __DIR__ . '/db.php';      // settings and MySQL connection
require_once __DIR__ . '/http.php';    // JSON responses and request input
require_once __DIR__ . '/auth.php';    // sessions, login, account rules, CSRF
require_once __DIR__ . '/games.php';   // games, ratings and reviews
require_once __DIR__ . '/membership.php'; // plans and profile pictures

// Release days and review dates follow Australian time (DPRate is made in Sydney).
date_default_timezone_set(app_config()['timezone']);

// Any unexpected error returns JSON instead of an HTML error page.
// The real message goes to the PHP error log, never to the browser.
set_exception_handler(function (Throwable $e): void {
    error_log('[DPRate] ' . $e->getMessage());
    json_error('Server error. Please try again later.', 500);
});
