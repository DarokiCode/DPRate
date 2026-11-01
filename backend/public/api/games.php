<?php
// GET /api/games.php -> all games from MySQL, in random order (Home page).
require __DIR__ . '/../../includes/helpers.php';

require_method('GET');

$stmt = db()->query('SELECT ' . GAME_COLUMNS . ' FROM ' . GAME_FROM . ' ORDER BY RAND()');
$games = array_map('format_game', $stmt->fetchAll());

json_response(['success' => true, 'games' => $games]);
