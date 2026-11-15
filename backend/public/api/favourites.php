<?php
// /api/favourites.php (logged-in users only)
//   GET                -> the user's favourite games (same fields as games.php), newest first
//   POST {game_id}     -> add a game (adding the same game twice is harmless)
//   DELETE ?game_id=2  -> remove a game (removing twice is harmless)
require __DIR__ . '/../../includes/bootstrap.php';

$method = require_method('GET', 'POST', 'DELETE');
start_api_session();
$user = require_login();

if ($method === 'GET') {
    // Only the favourites of the logged-in user: the user id comes from the session.
    $stmt = db()->prepare(
        'SELECT ' . GAME_COLUMNS . ' FROM ' . GAME_FROM . '
         INNER JOIN favourites ON favourites.game_id = games.id
         WHERE favourites.user_id = :user_id
         ORDER BY favourites.created_at DESC, games.title'
    );
    $stmt->execute(['user_id' => $user['id']]);

    json_response(['success' => true, 'favourites' => array_map('format_game', $stmt->fetchAll())]);
}

require_csrf();

$gameId = positive_int($method === 'POST' ? (read_json_body()['game_id'] ?? null) : ($_GET['game_id'] ?? null));
if ($gameId === null) {
    json_error('A valid game_id is required.', 400);
}

if ($method === 'POST') {
    if (!game_exists($gameId)) {
        json_error('Game not found.', 404);
    }

    // The primary key (user_id, game_id) stops duplicates.
    // ON DUPLICATE KEY makes "add" safe to repeat: a second click changes nothing.
    db()->prepare(
        'INSERT INTO favourites (user_id, game_id) VALUES (:user_id, :game_id)
         ON DUPLICATE KEY UPDATE game_id = game_id'
    )->execute(['user_id' => $user['id'], 'game_id' => $gameId]);

    json_response(['success' => true, 'message' => 'Added to your favourites.']);
}

// DELETE: both user_id and game_id are in the WHERE, so nobody can remove another user's favourite.
db()->prepare('DELETE FROM favourites WHERE user_id = :user_id AND game_id = :game_id')
    ->execute(['user_id' => $user['id'], 'game_id' => $gameId]);

json_response(['success' => true, 'message' => 'Removed from your favourites.']);
