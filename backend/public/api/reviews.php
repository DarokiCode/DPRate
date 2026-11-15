<?php
// /api/reviews.php
//   GET    ?game_id=2                  -> public list of a game's reviews, newest first
//   GET    ?recent=6                   -> latest reviews on the whole site (Home page)
//   POST   {game_id, rating, comment}  -> the logged-in user reviews a game (one review per game)
//   PUT    {id, rating, comment}       -> the author edits their review
//   DELETE ?id=14                      -> the author deletes their review
require __DIR__ . '/../../includes/bootstrap.php';

const MAX_REVIEW_WORDS = 500;    // same limit as the React form
const MAX_REVIEW_CHARS = 10000;  // safety limit for the TEXT column

$method = require_method('GET', 'POST', 'PUT', 'DELETE');

// ---------- Reading reviews (public) ----------
if ($method === 'GET') {
    if (isset($_GET['recent'])) {
        $limit = min(positive_int($_GET['recent']) ?? 6, 20);
        $stmt = db()->prepare(
            'SELECT reviews.id, reviews.game_id, reviews.user_id, users.username, reviews.rating,
                    reviews.comment, reviews.created_at, games.title AS game_title, games.image AS game_image
             FROM reviews
             INNER JOIN users ON users.id = reviews.user_id
             INNER JOIN games ON games.id = reviews.game_id
             ORDER BY reviews.created_at DESC, reviews.id DESC
             LIMIT :limit'
        );
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        json_response(['success' => true, 'reviews' => array_map('format_review', $stmt->fetchAll())]);
    }

    $gameId = positive_int($_GET['game_id'] ?? null);
    if ($gameId === null) {
        json_error('A valid game_id is required.', 400);
    }
    if (!game_exists($gameId)) {
        json_error('Game not found.', 404);
    }

    $stmt = db()->prepare(REVIEW_SELECT . ' WHERE reviews.game_id = :game_id ORDER BY reviews.created_at DESC, reviews.id DESC');
    $stmt->execute(['game_id' => $gameId]);

    json_response(['success' => true, 'reviews' => array_map('format_review', $stmt->fetchAll())]);
}

// ---------- Changing reviews (logged-in users only) ----------
start_api_session();
$user = require_login();
require_csrf();

// Checks the stars and the text. Returns [rating, comment] or stops with 422.
function valid_review_input(array $data): array
{
    $rating = $data['rating'] ?? null;
    if (is_string($rating) && preg_match('/^[1-5]$/', $rating)) {
        $rating = (int) $rating;
    }
    if (!is_int($rating) || $rating < 1 || $rating > 5) {
        json_error('Choose a rating from 1 to 5 stars.', 422);
    }

    $comment = body_string($data, 'comment');
    if ($comment === '') {
        json_error('Please write your review.', 422);
    }
    if (word_count($comment) > MAX_REVIEW_WORDS || mb_strlen($comment) > MAX_REVIEW_CHARS) {
        json_error('Your review must be ' . MAX_REVIEW_WORDS . ' words or fewer.', 422);
    }

    return [$rating, $comment];
}

if ($method === 'POST') {
    $data = read_json_body();
    $gameId = positive_int($data['game_id'] ?? null);
    if ($gameId === null) {
        json_error('A valid game_id is required.', 422);
    }
    [$rating, $comment] = valid_review_input($data);

    if (!game_exists($gameId)) {
        json_error('Game not found.', 404);
    }

    $insert = db()->prepare(
        'INSERT INTO reviews (game_id, user_id, rating, comment) VALUES (:game_id, :user_id, :rating, :comment)'
    );

    try {
        $insert->execute([
            'game_id' => $gameId,
            'user_id' => $user['id'], // from the session, never from the request
            'rating' => $rating,
            'comment' => $comment,
        ]);
    } catch (PDOException $e) {
        // UNIQUE (user_id, game_id): one review per player per game.
        if (is_duplicate_key($e)) {
            json_error('You have already reviewed this game. You can edit your review instead.', 409);
        }
        throw $e;
    }

    $review = find_review((int) db()->lastInsertId());
    json_response(['success' => true, 'message' => 'Review published.', 'review' => format_review($review)], 201);
}

// PUT and DELETE change an existing review, which must belong to the logged-in user.
$data = $method === 'PUT' ? read_json_body() : [];
$reviewId = positive_int($method === 'PUT' ? ($data['id'] ?? null) : ($_GET['id'] ?? null));
if ($reviewId === null) {
    json_error('A valid review id is required.', 400);
}

$review = find_review($reviewId);
if (!$review) {
    json_error('Review not found.', 404);
}
if ((int) $review['user_id'] !== (int) $user['id']) {
    json_error('You can only change your own reviews.', 403);
}

if ($method === 'PUT') {
    [$rating, $comment] = valid_review_input($data);

    db()->prepare('UPDATE reviews SET rating = :rating, comment = :comment WHERE id = :id AND user_id = :user_id')
        ->execute(['rating' => $rating, 'comment' => $comment, 'id' => $reviewId, 'user_id' => $user['id']]);

    json_response(['success' => true, 'message' => 'Review updated.', 'review' => format_review(find_review($reviewId))]);
}

// DELETE
db()->prepare('DELETE FROM reviews WHERE id = :id AND user_id = :user_id')
    ->execute(['id' => $reviewId, 'user_id' => $user['id']]);

json_response(['success' => true, 'message' => 'Review deleted.']);
