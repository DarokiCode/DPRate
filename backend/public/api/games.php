<?php
// GET /api/games.php -> every game with its live rating, in random order (Home page).
require __DIR__ . '/../../includes/bootstrap.php';

require_method('GET');

$stmt = db()->query('SELECT ' . GAME_COLUMNS . ' FROM ' . GAME_FROM . ' ORDER BY RAND()');

json_response(['success' => true, 'games' => array_map('format_game', $stmt->fetchAll())]);
