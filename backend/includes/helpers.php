<?php
require_once __DIR__ . '/db.php';

// Any unexpected error returns JSON instead of an HTML error page.
// The real message goes to the PHP error log, never to the browser.
set_exception_handler(function (Throwable $e) {
    error_log($e->getMessage());
    json_response(['success' => false, 'message' => 'Server error. Please try again later.'], 500);
});

function json_response(array $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Stops the request if the HTTP method is not the one this endpoint accepts.
function require_method(string $method): void
{
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        header('Allow: ' . $method);
        json_response(['success' => false, 'message' => "Method not allowed. Use $method."], 405);
    }
}

// Reads the JSON sent by React (Content-Type application/json).
function read_json_body(): array
{
    $data = json_decode(file_get_contents('php://input') ?: '', true);

    if (!is_array($data)) {
        json_response(['success' => false, 'message' => 'Request body must be valid JSON.'], 400);
    }

    return $data;
}

// Starts the PHP session. The session id goes in an HttpOnly cookie,
// so JavaScript cannot read it.
function start_api_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

// Columns sent for each game. "release" is the name the React front end expects.
// The genre name comes from the genres table (A1 proposal), so the games table joins it.
const GAME_FROM = 'games INNER JOIN genres ON genres.id = games.genre_id';
const GAME_COLUMNS = 'games.id, games.title, genres.name AS genre, games.rating, games.image, games.tags, games.description, games.developer, games.publisher, games.release_text AS `release`, games.platforms';

// Turns one database row into the game object defined in the API contract.
function format_game(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'title' => $row['title'],
        'genre' => $row['genre'],
        'rating' => (float) $row['rating'],
        'image' => $row['image'],
        'tags' => array_values(array_filter(array_map('trim', explode(',', $row['tags'])))),
        'description' => $row['description'],
        'developer' => $row['developer'],
        'publisher' => $row['publisher'],
        'release' => $row['release'],
        'platforms' => $row['platforms'],
    ];
}

// Only these fields may leave the server. Never the password hash.
function public_user(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'username' => $row['username'],
        'email' => $row['email'],
    ];
}
