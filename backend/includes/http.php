<?php
// HTTP helpers: JSON responses, allowed methods and reading the request.

// Sends JSON with an HTTP status code and stops the script.
function json_response(array $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');          // personal data is never cached
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION);
    exit;
}

// Sends {"success": false, "message": ...} with an error status.
function json_error(string $message, int $status): void
{
    json_response(['success' => false, 'message' => $message], $status);
}

// Stops the request if its HTTP method is not one of the allowed ones.
// Returns the method, so an endpoint can handle GET, POST, PUT and DELETE in one file.
function require_method(string ...$allowed): string
{
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if (!in_array($method, $allowed, true)) {
        header('Allow: ' . implode(', ', $allowed));
        json_error('Method not allowed. Use ' . implode(' or ', $allowed) . '.', 405);
    }

    return $method;
}

// Reads the JSON body sent by React.
// Only Content-Type application/json is accepted. An HTML form on another website
// cannot send that type without the browser asking permission first (CORS preflight),
// which this API never gives. This is one layer of the CSRF protection.
function read_json_body(): array
{
    $type = strtolower($_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '');

    if (!str_starts_with($type, 'application/json')) {
        json_error('Send the request as JSON (Content-Type: application/json).', 415);
    }

    $data = json_decode(file_get_contents('php://input') ?: '', true);

    if (!is_array($data)) {
        json_error('Request body must be valid JSON.', 400);
    }

    return $data;
}

// A positive whole number (an id) from the query string or the JSON body, or null.
function positive_int(mixed $value): ?int
{
    if (is_int($value)) {
        return $value > 0 ? $value : null;
    }

    if (is_string($value) && preg_match('/^[1-9][0-9]{0,9}$/', $value)) {
        return (int) $value;
    }

    return null;
}

// A trimmed string from the JSON body ('' when it is missing or not text).
function body_string(array $data, string $key): string
{
    return is_string($data[$key] ?? null) ? trim($data[$key]) : '';
}
