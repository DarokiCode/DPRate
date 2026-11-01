<?php
// GET /api/game.php?id=2 -> one game (Game Details page).
require __DIR__ . '/../../includes/helpers.php';

require_method('GET');

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

if ($id === false || $id === null) {
    json_response(['success' => false, 'message' => 'A valid game id is required.'], 400);
}

$stmt = db()->prepare('SELECT ' . GAME_COLUMNS . ' FROM ' . GAME_FROM . ' WHERE games.id = :id LIMIT 1');
$stmt->execute(['id' => $id]);
$row = $stmt->fetch();

if (!$row) {
    json_response(['success' => false, 'message' => 'Game not found.'], 404);
}

json_response(['success' => true, 'game' => format_game($row)]);
