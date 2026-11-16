<?php
// Automated API test for DPRate (Assessment 3).
// It plays the part of a visitor and two players (A and B) and checks every endpoint,
// including the security rules (login required, owner only, CSRF).
//
// How to run (PHP server running, database imported):
//   php backend/tests/api_test.php                       (uses http://127.0.0.1:8000/api)
//   php backend/tests/api_test.php https://your-site/api (live site)
// It creates two new test accounts with random names each time it runs.

$base = rtrim($argv[1] ?? 'http://127.0.0.1:8000/api', '/');
$passed = 0;
$failed = 0;

// ---------- Small HTTP client: one cookie jar per person ----------

function client(): array
{
    $handle = curl_init();
    curl_setopt($handle, CURLOPT_COOKIEFILE, ''); // keep cookies in memory, like a browser
    return ['curl' => $handle, 'token' => ''];
}

function call(array &$who, string $method, string $path, ?array $body = null, array $headers = []): array
{
    global $base;
    $handle = $who['curl'];
    $sendHeaders = array_merge(['Accept: application/json'], $headers);
    if ($method !== 'GET' && $who['token'] !== '' && !array_filter($headers, fn ($h) => stripos($h, 'X-CSRF-Token') === 0)) {
        $sendHeaders[] = 'X-CSRF-Token: ' . $who['token'];
    }
    if ($body !== null && !array_filter($headers, fn ($h) => stripos($h, 'Content-Type') === 0)) {
        $sendHeaders[] = 'Content-Type: application/json';
    }

    $options = [
        CURLOPT_URL => $base . '/' . $path,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $sendHeaders,
    ];
    if ($method === 'GET') {
        $options[CURLOPT_HTTPGET] = true;
        $options[CURLOPT_CUSTOMREQUEST] = 'GET';
    } else {
        $options[CURLOPT_CUSTOMREQUEST] = $method;
        $options[CURLOPT_POSTFIELDS] = $body === null ? '' : json_encode($body);
    }
    curl_setopt_array($handle, $options);

    $raw = curl_exec($handle);
    $status = curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
    $json = json_decode((string) $raw, true);

    if (is_array($json) && isset($json['csrf_token'])) {
        $who['token'] = $json['csrf_token']; // the server rotates the token at login, logout, etc.
    }

    return [$status, is_array($json) ? $json : ['raw' => $raw]];
}

function check(string $name, bool $ok, string $detail = ''): void
{
    global $passed, $failed;
    if ($ok) {
        $passed++;
        echo "  PASS  $name\n";
    } else {
        $failed++;
        echo "  FAIL  $name" . ($detail !== '' ? "  ->  $detail" : '') . "\n";
    }
}

function expect(string $name, array $result, int $status, ?callable $extra = null): array
{
    [$code, $json] = $result;
    $ok = $code === $status && (($status < 300) === (($json['success'] ?? null) === true));
    if ($ok && $extra) {
        $ok = (bool) $extra($json);
    }
    check($name, $ok, "HTTP $code " . substr(json_encode($json), 0, 160));
    return $json;
}

function game_by_id(array $games, int $id): ?array
{
    foreach ($games as $game) {
        if ($game['id'] === $id) {
            return $game;
        }
    }
    return null;
}

$suffix = substr(bin2hex(random_bytes(3)), 0, 6);
$guest = client();
$a = client();
$b = client();
$userA = ['username' => "player_a_$suffix", 'email' => "a_$suffix@example.com", 'password' => 'password-a-123'];
$userB = ['username' => "player_b_$suffix", 'email' => "b_$suffix@example.com", 'password' => 'password-b-123'];

echo "DPRate API test on $base\n\n";

// ---------- 1. Games, genres and errors ----------
echo "Games and genres\n";
$games = expect('GET games.php lists games', call($guest, 'GET', 'games.php'), 200,
    fn ($j) => is_array($j['games']) && count($j['games']) > 0);
$first = $games['games'][0] ?? [];
check('each game has every contract field',
    array_keys($first) === ['id', 'title', 'genre', 'rating', 'review_count', 'image', 'banner', 'logo', 'tags', 'description', 'developer', 'publisher', 'release', 'release_label', 'release_date', 'released', 'platforms', 'sponsored']);
check('release is the year and release_date is a full date',
    preg_match('/^\d{4}$/', (string) ($first['release'] ?? '')) === 1 && preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) ($first['release_date'] ?? '')) === 1);
$gta = game_by_id($games['games'], 14);
check('Grand Theft Auto VI is in the catalogue and marked sponsored', $gta !== null && $gta['sponsored'] === true);
check('released matches the release date (Sydney time)',
    $gta !== null && $gta['released'] === ((new DateTimeImmutable('now', new DateTimeZone('Australia/Sydney')))->format('Y-m-d') >= $gta['release_date']));
expect('game.php includes the official store links', call($guest, 'GET', 'game.php?id=8'), 200,
    fn ($j) => count($j['game']['stores']) >= 1 && str_starts_with($j['game']['stores'][0]['url'], 'https://'));
expect('plans.php lists Standard, Silver and Gold', call($guest, 'GET', 'plans.php'), 200,
    fn ($j) => array_column($j['plans'], 'id') === ['standard', 'silver', 'gold'] && $j['plans'][0]['price'] === 0.0
        && $j['plans'][1]['price'] === 2.99 && $j['plans'][2]['price'] === 5.99);
check('tags arrive as an array', is_array($first['tags'] ?? null));
$gameId = 2;
$before = game_by_id($games['games'], $gameId);
expect('GET game.php?id=2 returns League of Legends', call($guest, 'GET', 'game.php?id=2'), 200,
    fn ($j) => $j['game']['title'] === 'League of Legends');
expect('GET game.php?id=99999 is 404', call($guest, 'GET', 'game.php?id=99999'), 404);
expect('GET game.php?id=abc is 400', call($guest, 'GET', 'game.php?id=abc'), 400);
expect('GET genres.php lists genres with counts', call($guest, 'GET', 'genres.php'), 200,
    fn ($j) => count($j['genres']) >= 6 && isset($j['genres'][0]['game_count']));
expect('DELETE games.php is 405', call($guest, 'DELETE', 'games.php'), 405);

// ---------- 2. CSRF protection ----------
echo "\nCSRF protection\n";
expect('session.php gives a CSRF token', call($guest, 'GET', 'session.php'), 200,
    fn ($j) => $j['user'] === null && strlen($j['csrf_token']) === 64);
$token = $guest['token'];
$guest['token'] = '';
expect('register without the token is refused (403)', call($guest, 'POST', 'register.php', $userA), 403,
    fn ($j) => ($j['csrf'] ?? false) === true);
$guest['token'] = str_repeat('0', 64);
expect('register with a wrong token is refused (403)', call($guest, 'POST', 'register.php', $userA), 403);
$guest['token'] = $token;
expect('request from another website is refused (Sec-Fetch-Site)',
    call($guest, 'POST', 'register.php', $userA, ['Sec-Fetch-Site: cross-site']), 403);
expect('request from another website is refused (Origin)',
    call($guest, 'POST', 'register.php', $userA, ['Origin: https://evil.example']), 403);
expect('text/plain body is refused (415)',
    call($guest, 'POST', 'register.php', $userA, ['Content-Type: text/plain']), 415);

// ---------- 3. Register, login, session ----------
echo "\nAccounts\n";
call($a, 'GET', 'session.php');
call($b, 'GET', 'session.php');
expect('player A registers (201)', call($a, 'POST', 'register.php', $userA), 201,
    fn ($j) => $j['user']['username'] === $userA['username'] && !isset($j['user']['password_hash']));
expect('same username again is 409', call($b, 'POST', 'register.php', $userA), 409);
expect('invalid email and short password are 422',
    call($b, 'POST', 'register.php', ['username' => 'ok_name', 'email' => 'nope', 'password' => '123']), 422);
expect('player B registers (201)', call($b, 'POST', 'register.php', $userB), 201);
expect('session.php shows player A', call($a, 'GET', 'session.php'), 200,
    fn ($j) => $j['user']['username'] === $userA['username']);
expect('wrong password is 401', call($guest, 'POST', 'login.php', ['login' => $userA['username'], 'password' => 'wrong-pass']), 401);

// ---------- 4. Reviews and live rating ----------
echo "\nReviews and rating\n";
expect('a game with no new reviews lists its reviews', call($guest, 'GET', "reviews.php?game_id=$gameId"), 200,
    fn ($j) => is_array($j['reviews']));
$startCount = $before['review_count'];
expect('visitor cannot post a review (401)',
    call($guest, 'POST', 'reviews.php', ['game_id' => $gameId, 'rating' => 5, 'comment' => 'Great']), 401);
$reviewA = expect('player A posts 5 stars (201)',
    call($a, 'POST', 'reviews.php', ['game_id' => $gameId, 'rating' => 5, 'comment' => 'Brilliant teamwork game.']), 201,
    fn ($j) => $j['review']['rating'] === 5 && $j['review']['username'] === $userA['username'])['review']['id'] ?? 0;
expect('second review of the same game is 409',
    call($a, 'POST', 'reviews.php', ['game_id' => $gameId, 'rating' => 4, 'comment' => 'Again']), 409);
expect('6 stars is 422', call($a, 'POST', 'reviews.php', ['game_id' => 3, 'rating' => 6, 'comment' => 'Too many']), 422);
expect('empty comment is 422', call($a, 'POST', 'reviews.php', ['game_id' => 3, 'rating' => 4, 'comment' => '   ']), 422);
expect('501 words is 422',
    call($a, 'POST', 'reviews.php', ['game_id' => 3, 'rating' => 4, 'comment' => str_repeat('word ', 501)]), 422);
expect('review of a game that does not exist is 404',
    call($a, 'POST', 'reviews.php', ['game_id' => 99999, 'rating' => 4, 'comment' => 'Ghost']), 404);
$reviewB = expect('player B posts 3 stars (201)',
    call($b, 'POST', 'reviews.php', ['game_id' => $gameId, 'rating' => 3, 'comment' => 'Fun but stressful.']), 201)['review']['id'] ?? 0;
$list = expect('GET reviews shows both, newest first', call($guest, 'GET', "reviews.php?game_id=$gameId"), 200,
    fn ($j) => count($j['reviews']) === $startCount + 2 && $j['reviews'][0]['id'] === $reviewB
        && !isset($j['reviews'][0]['email']));
$game = call($guest, 'GET', "game.php?id=$gameId")[1]['game'];
check('rating and review_count update after the reviews',
    $game['review_count'] === $startCount + 2 && $game['rating'] !== null);
expect('player B cannot edit A\'s review (403)',
    call($b, 'PUT', 'reviews.php', ['id' => $reviewA, 'rating' => 1, 'comment' => 'Hacked']), 403);
expect('player B cannot delete A\'s review (403)', call($b, 'DELETE', "reviews.php?id=$reviewA"), 403);
expect('player A edits own review to 4 stars', call($a, 'PUT', 'reviews.php', ['id' => $reviewA, 'rating' => 4, 'comment' => 'Still great, a bit long.']), 200,
    fn ($j) => $j['review']['rating'] === 4);
expect('editing a review that does not exist is 404',
    call($a, 'PUT', 'reviews.php', ['id' => 99999999, 'rating' => 4, 'comment' => 'x']), 404);
expect('latest reviews for the home page', call($guest, 'GET', 'reviews.php?recent=3'), 200,
    fn ($j) => count($j['reviews']) >= 2 && isset($j['reviews'][0]['game_title']));
expect('player A deletes own review', call($a, 'DELETE', "reviews.php?id=$reviewA"), 200);
$game = call($guest, 'GET', "game.php?id=$gameId")[1]['game'];
check('review_count goes down after deleting', $game['review_count'] === $startCount + 1);

// Exact average on a game nobody else has reviewed in this test.
$fresh = null;
foreach (call($guest, 'GET', 'games.php')[1]['games'] as $candidate) {
    if ($candidate['review_count'] === 0 && $candidate['released']) { // games not out yet cannot be reviewed
        $fresh = $candidate;
        break;
    }
}
if ($fresh) {
    check('a game with no reviews has rating null ("Not rated")', $fresh['rating'] === null);
    call($a, 'POST', 'reviews.php', ['game_id' => $fresh['id'], 'rating' => 5, 'comment' => 'Five']);
    $reviewB2 = call($b, 'POST', 'reviews.php', ['game_id' => $fresh['id'], 'rating' => 2, 'comment' => 'Two'])[1]['review']['id'];
    $avg = call($guest, 'GET', 'game.php?id=' . $fresh['id'])[1]['game'];
    check('average of 5 and 2 stars is 3.5', $avg['rating'] === 3.5 && $avg['review_count'] === 2, json_encode($avg['rating']));
    call($b, 'DELETE', "reviews.php?id=$reviewB2");
    $avg = call($guest, 'GET', 'game.php?id=' . $fresh['id'])[1]['game'];
    check('after deleting the 2, the average is 5.0', $avg['rating'] === 5.0 && $avg['review_count'] === 1, json_encode($avg['rating']));
}

// ---------- 5. Favourites ----------
echo "\nFavourites\n";
expect('visitor cannot see favourites (401)', call($guest, 'GET', 'favourites.php'), 401);
expect('player A starts with no favourites', call($a, 'GET', 'favourites.php'), 200, fn ($j) => $j['favourites'] === []);
expect('player A adds game 2', call($a, 'POST', 'favourites.php', ['game_id' => 2]), 200);
expect('adding the same game again is harmless', call($a, 'POST', 'favourites.php', ['game_id' => 2]), 200);
expect('adding a game that does not exist is 404', call($a, 'POST', 'favourites.php', ['game_id' => 99999]), 404);
expect('player A sees game 2 with the same fields as games.php', call($a, 'GET', 'favourites.php'), 200,
    fn ($j) => count($j['favourites']) === 1 && $j['favourites'][0]['id'] === 2 && array_key_exists('review_count', $j['favourites'][0]));
expect('player B does not see A\'s favourites', call($b, 'GET', 'favourites.php'), 200, fn ($j) => $j['favourites'] === []);
call($b, 'DELETE', 'favourites.php?game_id=2');
expect('B removing game 2 does not touch A\'s list', call($a, 'GET', 'favourites.php'), 200, fn ($j) => count($j['favourites']) === 1);
expect('player A removes game 2', call($a, 'DELETE', 'favourites.php?game_id=2'), 200);
expect('the list is empty again', call($a, 'GET', 'favourites.php'), 200, fn ($j) => $j['favourites'] === []);

// ---------- 5b. Games that are not out yet ----------
echo "\nRelease day lock\n";
if ($gta !== null && $gta['released'] === false) {
    expect('reviewing a game before its release day is refused (403)',
        call($a, 'POST', 'reviews.php', ['game_id' => 14, 'rating' => 5, 'comment' => 'Too early.']), 403,
        fn ($j) => str_contains($j['message'], 'Reviews open on'));
} else {
    $early = expect('a released game accepts reviews', call($a, 'POST', 'reviews.php', ['game_id' => 14, 'rating' => 5, 'comment' => 'Out now.']), 201);
    call($a, 'DELETE', 'reviews.php?id=' . ($early['review']['id'] ?? 0));
}

// ---------- 5c. Plans and profile pictures ----------
echo "\nPlans and profile pictures\n";
expect('new players start on the Standard plan', call($a, 'GET', 'session.php'), 200,
    fn ($j) => $j['user']['plan'] === 'standard' && $j['user']['avatar'] === null);
expect('a Standard picture can be chosen', call($a, 'PUT', 'account.php', ['avatar' => 'rocket']), 200,
    fn ($j) => $j['user']['avatar'] === 'rocket');
expect('a Gold picture is refused on Standard (403)', call($a, 'PUT', 'account.php', ['avatar' => 'gem']), 403);
expect('an unknown picture is 422', call($a, 'PUT', 'account.php', ['avatar' => 'not-a-picture']), 422);
expect('an unknown plan is 422', call($a, 'PUT', 'account.php', ['plan' => 'platinum']), 422);
expect('player A moves to Gold (demo, no payment)', call($a, 'PUT', 'account.php', ['plan' => 'gold']), 200,
    fn ($j) => $j['user']['plan'] === 'gold');
expect('a Gold picture works on Gold', call($a, 'PUT', 'account.php', ['avatar' => 'gem']), 200,
    fn ($j) => $j['user']['avatar'] === 'gem');
[, $mine] = call($a, 'GET', 'account.php');
$reviewedId = $mine['reviews'][0]['game_id'] ?? null;
if ($reviewedId === null) {
    call($a, 'POST', 'reviews.php', ['game_id' => 3, 'rating' => 4, 'comment' => 'Badge test.']);
    $reviewedId = 3;
}
expect('reviews show the author plan and picture', call($guest, 'GET', "reviews.php?game_id=$reviewedId"), 200,
    fn ($j) => count(array_filter($j['reviews'], fn ($r) => $r['username'] === $userA['username'] && $r['plan'] === 'gold' && $r['avatar'] === 'gem')) === 1);
expect('moving back to Silver drops the Gold-only picture', call($a, 'PUT', 'account.php', ['plan' => 'silver']), 200,
    fn ($j) => $j['user']['plan'] === 'silver' && $j['user']['avatar'] === null);
expect('two changes in one request are refused (400)', call($a, 'PUT', 'account.php', ['plan' => 'gold', 'avatar' => 'rocket']), 400);
expect('visitor cannot change plan (401)', call($guest, 'PUT', 'account.php', ['plan' => 'gold']), 401);

// ---------- 6. Account page ----------
echo "\nAccount\n";
expect('visitor cannot open the account (401)', call($guest, 'GET', 'account.php'), 401);
expect('player A sees own details and only own reviews', call($a, 'GET', 'account.php'), 200,
    fn ($j) => $j['user']['email'] === $userA['email'] && !isset($j['user']['password_hash'])
        && count(array_filter($j['reviews'], fn ($r) => !isset($r['game_title']))) === 0);
expect('taking B\'s username is 409',
    call($a, 'PUT', 'account.php', ['username' => $userB['username'], 'email' => $userA['email']]), 409,
    fn ($j) => str_contains($j['message'], 'username'));
expect('taking B\'s email is 409',
    call($a, 'PUT', 'account.php', ['username' => $userA['username'], 'email' => $userB['email']]), 409,
    fn ($j) => str_contains($j['message'], 'email'));
expect('invalid email is 422', call($a, 'PUT', 'account.php', ['username' => $userA['username'], 'email' => 'bad']), 422);
$newName = "player_a2_$suffix";
expect('player A changes username', call($a, 'PUT', 'account.php', ['username' => $newName, 'email' => $userA['email']]), 200,
    fn ($j) => $j['user']['username'] === $newName);
expect('session.php shows the new username', call($a, 'GET', 'session.php'), 200, fn ($j) => $j['user']['username'] === $newName);
expect('wrong current password is refused (403)',
    call($a, 'PUT', 'account.php', ['current_password' => 'not-it', 'new_password' => 'new-password-1']), 403);
expect('new password too short is 422',
    call($a, 'PUT', 'account.php', ['current_password' => $userA['password'], 'new_password' => 'short']), 422);
expect('player A changes password',
    call($a, 'PUT', 'account.php', ['current_password' => $userA['password'], 'new_password' => 'new-password-1']), 200);
expect('old password no longer works', call($guest, 'POST', 'login.php', ['login' => $newName, 'password' => $userA['password']]), 401);
$fresh = client();
call($fresh, 'GET', 'session.php');
expect('new password works', call($fresh, 'POST', 'login.php', ['login' => $userA['email'], 'password' => 'new-password-1']), 200);

// ---------- 7. Logout ----------
echo "\nLogout\n";
$oldToken = $b['token'];
expect('player B logs out', call($b, 'POST', 'logout.php', []), 200);
expect('after logout the session has no user', call($b, 'GET', 'session.php'), 200, fn ($j) => $j['user'] === null);
$b['token'] = $oldToken;
expect('the old token stops working after logout', call($b, 'POST', 'login.php', ['login' => $userB['username'], 'password' => $userB['password']]), 403);

// Clean up the test reviews of player A and B is not needed: they are normal accounts.
echo "\n$passed passed, $failed failed\n";
exit($failed === 0 ? 0 : 1);
