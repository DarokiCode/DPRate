<?php
// GET /api/genres.php -> every genre with how many games it has (menus and genre filter).
require __DIR__ . '/../../includes/bootstrap.php';

require_method('GET');

$stmt = db()->query(
    'SELECT genres.id, genres.name, COUNT(games.id) AS game_count
     FROM genres
     LEFT JOIN games ON games.genre_id = genres.id
     GROUP BY genres.id, genres.name
     ORDER BY genres.name'
);

$genres = array_map(fn (array $row): array => [
    'id' => (int) $row['id'],
    'name' => $row['name'],
    'game_count' => (int) $row['game_count'],
], $stmt->fetchAll());

json_response(['success' => true, 'genres' => $genres]);
