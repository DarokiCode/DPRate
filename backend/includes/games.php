<?php
// How games and reviews are read from MySQL and turned into the JSON that React expects.

// The rating is never stored in the games table: it is the live average of the players' reviews.
// The "stats" subquery groups the reviews by game and calculates the average (1 decimal)
// and how many reviews each game has. LEFT JOIN keeps the games that have no reviews yet:
// their rating is NULL, and React shows "Not rated".
const GAME_FROM = 'games
    INNER JOIN genres ON genres.id = games.genre_id
    LEFT JOIN (
        SELECT game_id, ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS review_count
        FROM reviews
        GROUP BY game_id
    ) AS stats ON stats.game_id = games.id';

// "release" is the name the React front end expects.
const GAME_COLUMNS = 'games.id, games.title, genres.name AS genre,
    stats.avg_rating AS rating, COALESCE(stats.review_count, 0) AS review_count,
    games.image, games.banner, games.logo, games.tags, games.description, games.developer, games.publisher,
    games.release_text AS `release`, games.platforms';

// Turns one database row into the game object defined in the API contract.
function format_game(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'title' => $row['title'],
        'genre' => $row['genre'],
        'rating' => $row['rating'] === null ? null : round((float) $row['rating'], 1),
        'review_count' => (int) $row['review_count'],
        'image' => $row['image'],     // portrait cover
        'banner' => $row['banner'],   // wide artwork (null when the game has none)
        'logo' => $row['logo'],       // transparent logo (null when the game has none)
        'tags' => array_values(array_filter(array_map('trim', explode(',', $row['tags'])))),
        'description' => $row['description'],
        'developer' => $row['developer'],
        'publisher' => $row['publisher'],
        'release' => $row['release'],
        'platforms' => $row['platforms'],
    ];
}

function game_exists(int $id): bool
{
    $stmt = db()->prepare('SELECT 1 FROM games WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $id]);
    return (bool) $stmt->fetchColumn();
}

// Reviews always come with the author's username (never the email or the password hash).
const REVIEW_SELECT = 'SELECT reviews.id, reviews.game_id, reviews.user_id, users.username,
    reviews.rating, reviews.comment, reviews.created_at
    FROM reviews
    INNER JOIN users ON users.id = reviews.user_id';

function format_review(array $row): array
{
    $review = [
        'id' => (int) $row['id'],
        'game_id' => (int) $row['game_id'],
        'user_id' => (int) $row['user_id'],
        'username' => $row['username'],
        'rating' => (int) $row['rating'],
        'comment' => $row['comment'],
        'created_at' => $row['created_at'],
    ];

    // The "latest reviews" list on the home page also shows which game was reviewed.
    if (array_key_exists('game_title', $row)) {
        $review['game_title'] = $row['game_title'];
        $review['game_image'] = $row['game_image'];
    }

    return $review;
}

function find_review(int $id): ?array
{
    $stmt = db()->prepare(REVIEW_SELECT . ' WHERE reviews.id = :id LIMIT 1');
    $stmt->execute(['id' => $id]);
    return $stmt->fetch() ?: null;
}

// Counts words the same way as the React form: groups of characters separated by spaces.
function word_count(string $text): int
{
    return count(preg_split('/\s+/u', trim($text), -1, PREG_SPLIT_NO_EMPTY));
}
