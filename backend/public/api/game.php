<?php
// GET /api/game.php?id=2 -> one game with its live rating and store links (Game Details page).
require __DIR__ . '/../../includes/bootstrap.php';

require_method('GET');

$id = positive_int($_GET['id'] ?? null);
if ($id === null) {
    json_error('A valid game id is required.', 400);
}

$stmt = db()->prepare('SELECT ' . GAME_COLUMNS . ' FROM ' . GAME_FROM . ' WHERE games.id = :id LIMIT 1');
$stmt->execute(['id' => $id]);
$row = $stmt->fetch();

if (!$row) {
    json_error('Game not found.', 404);
}

$game = format_game($row);
$game['stores'] = game_stores($game['id']);

json_response(['success' => true, 'game' => $game]);
