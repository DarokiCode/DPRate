# DPRate

DPRate is a game review website where **players, not critics, rate and review games** from every platform.
Visitors browse the collection by genre, search it and read reviews. Members give 1 to 5 stars, write
reviews, keep a list of favourites and manage their account.

INT1059 Advanced Web, Assessment 3. Team Guava: Davi Rocha (15617) and Pedro Meloni (15191).

- Live site: _add the InfinityFree address here after deployment_
- Repository: https://github.com/DarokiCode/DPRate

## Features

| Brief requirement | Where it is |
|---|---|
| Home page with random games | `games.php` returns the games with `ORDER BY RAND()`; the home page features five of them |
| Navigation with dropdowns | Games and Genres menus in the top bar (keyboard accessible) |
| Category filter by genre | Genre tiles, Genres menu and the filter chips on the Browse page (`genres.php` gives the counts) |
| Detail page with title, description, metadata and review form | `#game/ID`: cover, developer, publisher, release, platforms, tags, review form |
| Registration and sign-in | `register.php`, `login.php`, `session.php`, `logout.php` (PHP sessions) |
| Rating system | 1 to 5 stars per review; the score is the live average `AVG(reviews.rating)` with a spread of stars |
| Search | Instant suggestions in the top bar and full results on the Browse page |
| Favourites | Add and remove on each game, "My favourites" page, saved per user in MySQL |
| Account page | Edit username and email, change password, see, edit and delete your own reviews |

Extra: a live preview of the new score while choosing stars, the latest community reviews on the home page,
sorting (top rated, most reviewed, newest, A to Z), a phone layout and reduced-motion support.

## Technology

- **Front end:** React 19 with Vite (in `frontend/`). Hash routes (`#browse`, `#game/8`) work on any host.
- **Back end:** PHP 8 JSON API with PDO (in `backend/`). One file per endpoint in `backend/public/api`.
- **Database:** MySQL / MariaDB, tables `users`, `genres`, `games`, `reviews`, `favourites`.
- **Fonts:** Anton and Manrope, installed with npm and served by the site itself.

```
backend/
  database/dprate.sql            full database for a fresh install
  database/migrations/           updates for an existing Assessment 2 database
  includes/                      config, database connection, HTTP helpers, sessions + CSRF, game queries
  public/api/                    the endpoints (web root of the PHP server)
  tests/api_test.php             automated API test (66 checks)
frontend/
  src/api.js                     every call to the PHP API
  src/components/, src/pages/    React components and pages
scripts/build-deploy.mjs         builds the folder to upload to the live server
```

## API

All responses are JSON: `{"success": true, ...}` or `{"success": false, "message": "..."}` with the right HTTP status.

| Endpoint | Methods | Notes |
|---|---|---|
| `games.php` | GET | All games, random order, with `rating` (average or `null`) and `review_count` |
| `game.php?id=8` | GET | One game |
| `genres.php` | GET | Genres with their number of games |
| `reviews.php` | GET `?game_id=` or `?recent=6`, POST, PUT, DELETE `?id=` | One review per player per game; only the author can edit or delete |
| `favourites.php` | GET, POST, DELETE `?game_id=` | Logged-in users only, each user sees only their own |
| `account.php` | GET, PUT | Profile and own reviews; PUT `{username, email}` or `{current_password, new_password}` |
| `register.php`, `login.php`, `logout.php` | POST | Login with username or email |
| `session.php` | GET | Current user and the CSRF token |

## Security

- Passwords stored only with `password_hash()` (bcrypt) and checked with `password_verify()`.
- Every query uses PDO prepared statements (no SQL injection).
- The user id always comes from the PHP session, never from the request.
- CSRF protection (OWASP synchronizer token): every POST, PUT and DELETE must send the session's
  token in the `X-CSRF-Token` header and come from the site itself (`Sec-Fetch-Site` / `Origin` check).
  Request bodies must be JSON.
- Session cookie: HttpOnly, SameSite=Lax, Secure on HTTPS, strict mode, new id after login and password change.
- PHP errors are logged, never printed into the JSON.

## Run it locally (Windows + XAMPP)

1. **Database.** Start Apache and MySQL in XAMPP and open `http://localhost/phpmyadmin`.
   - New computer: Import `backend/database/dprate.sql` (it creates the `dprate` database).
   - Already have the Assessment 2 database: select `dprate`, then Import
     `migrations/001_a3_rating_from_reviews.sql` and then `migrations/002_a3_catalogue_and_artwork.sql`.
     Your users are kept. Do **not** import `dprate.sql` over it.
2. **Settings.** The defaults are XAMPP's (port 3306, user `root`, no password). If yours are different,
   copy `backend/includes/config.local.example.php` to `config.local.php` and change only those values
   (Davi's XAMPP uses `'db_port' => 3307`). This file is ignored by Git.
3. **PHP API**, from the project folder:
   ```
   C:\xampp\php\php.exe -S 127.0.0.1:8000 -t backend/public
   ```
4. **React**, in a second terminal:
   ```
   cd frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:5173`. Vite sends every `/api` request to the PHP server.
5. **Test the API** (with the PHP server running): `C:\xampp\php\php.exe backend/tests/api_test.php`

## Put it online (InfinityFree or any PHP + MySQL host)

1. Create a hosting account and a website, then create a MySQL database in the control panel.
   Note the host name, database name, user name and password.
2. On your computer: `cd frontend`, `npm run build`, then from the project folder `node scripts/build-deploy.mjs`.
3. Upload the **contents** of `deploy/htdocs` (including the hidden `.htaccess` files) into the host's `htdocs` folder.
4. In the host's File Manager create `htdocs/includes/config.local.php`:
   ```php
   <?php
   return [
       'db_host' => 'your MySQL host name',
       'db_name' => 'your database name',
       'db_user' => 'your database user',
       'db_pass' => 'your database password',
   ];
   ```
5. In the host's phpMyAdmin select the database and Import `deploy/dprate_hosting.sql`.
6. Open the site, register a test account and run the checks in the "Testing" section of the report.

## Data and artwork

Game details (developer, publisher, year, platforms) were checked on 15/11/2026 against Wikipedia and the
publishers' pages. Descriptions were written by the team. Artwork for the games added in Assessment 3 is the
official Steam store artwork, loaded from Steam's servers (not copied into this repository) and shown for review
purposes. All game names, artwork and logos belong to their publishers. The League of Legends and Valorant
images and the DPRate logo come from the team's Assessment 1 and 2 work.

## AI assistance

Parts of the code and documentation were written with the help of AI assistants (ChatGPT and Claude) and
reviewed, tested and adjusted by the team, as declared in the report.
