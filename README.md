# DPRate

DPRate is a game review website where **players, not critics, rate and review games** from every platform.
Visitors browse the collection by genre, search it and read reviews. Members give 1 to 5 stars, write
reviews, keep a list of favourites and manage their account.

INT1059 Advanced Web, Assessment 3. Team Guava: Davi Rocha (15617) and Pedro Meloni (15191).

- Live site: https://dprate.gamer.gd (free InfinityFree hosting; the first visit can take a few seconds while the host checks the browser)
- Demo login for the marker: given on the cover page of the report (or register a new account on the site)
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
| Account page | Edit username and email, change password, choose a profile picture, see, edit and delete your own reviews |
| Profile picture (A1 minor feature) | 16 avatars drawn in SVG, grouped by plan; the server checks the plan before saving one |
| Release dates | Full release date on every game page; upcoming games (Grand Theft Auto VI) show a live countdown and reviews open on release day |

Extra: a live preview of the new score while choosing stars, the latest community reviews on the home page,
sorting (top rated, most reviewed, release date, A to Z), a phone layout and reduced-motion support.

## Business model (demo)

DPRate is free to use. The team planned two sources of income, advertising and subscriptions, plus two smaller ones.
The site shows all of them as a working demo: **no payment is ever taken**.

| Income | How it works on the site |
|---|---|
| Plans | Standard (free), Silver (A$2.99 a month: no ads, Silver badge, 4 extra avatars), Gold (A$5.99 a month: Gold badge, reviews highlighted, 4 Gold avatars). Players switch plan on the Plans page, with a confirm step |
| Advertising | Ad spaces on the home page and the game pages, labelled "Advertisement", shown only to visitors and Standard players. They advertise DPRate itself, because no company has paid for an ad |
| Sponsored spot | One game shown first on the home page, labelled "Sponsored · demo" (Grand Theft Auto VI) |
| Store links | "Where to buy" links to official stores on each game page, marked `rel="sponsored"` (affiliate links on a live site) |

Money never changes a score: every review counts the same in the average, whatever the player's plan.

## Technology

- **Front end:** React 19 with Vite (in `frontend/`). Hash routes (`#browse`, `#game/8`) work on any host.
- **Back end:** PHP 8 JSON API with PDO (in `backend/`). One file per endpoint in `backend/public/api`.
- **Database:** MySQL / MariaDB, tables `users`, `genres`, `games`, `reviews`, `favourites`, `game_stores`.
- **Fonts:** Anton and Manrope, installed with npm and served by the site itself.

```
backend/
  database/dprate.sql            full database for a fresh install
  database/migrations/           updates for an existing Assessment 2 database
  includes/                      config, database connection, HTTP helpers, sessions + CSRF, game queries
  public/api/                    the endpoints (web root of the PHP server)
  includes/membership.php        plans, prices and which profile pictures each plan unlocks
  tests/api_test.php             automated API test (83 checks)
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
| `game.php?id=8` | GET | One game, with its official store links |
| `plans.php` | GET | The three plans with prices (AUD), perks and profile pictures |
| `genres.php` | GET | Genres with their number of games |
| `reviews.php` | GET `?game_id=` or `?recent=6`, POST, PUT, DELETE `?id=` | One review per player per game; only the author can edit or delete; no reviews before release day (403) |
| `favourites.php` | GET, POST, DELETE `?game_id=` | Logged-in users only, each user sees only their own |
| `account.php` | GET, PUT | Profile and own reviews; PUT `{username, email}`, `{current_password, new_password}`, `{plan}` or `{avatar}` (one at a time) |
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
   - Already have the Assessment 2 database: select `dprate`, then Import the files in `migrations/`
     in order (`001`, `002`, `003`). Your users are kept. Do **not** import `dprate.sql` over it.
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

Release dates, developers, publishers and platforms were checked in November 2026 against **official sources only**:
the publisher's or developer's own website, or the game's official store page. Open encyclopaedias such as Wikipedia
were not used, because anyone can edit them. When a publisher gives only a month, the official Steam store date is used.

| Game | Official source |
|---|---|
| League of Legends | leagueoflegends.com (Riot gives only the month: October 2009) |
| Valorant | playvalorant.com |
| Counter-Strike 2 | Valve's Steam store page |
| Hades | supergiantgames.com and the Steam store |
| Red Dead Redemption 2 | rockstargames.com |
| Hollow Knight | teamcherry.com.au |
| Elden Ring | bandainamcoent.eu and the Steam store |
| Baldur's Gate 3 | baldursgate3.game (Larian Studios) |
| The Witcher 3: Wild Hunt | thewitcher.com (CD PROJEKT RED) |
| Rocket League | rocketleague.com (Psyonix) |
| Sid Meier's Civilization VI | store.2k.com and the Steam store (2K gives only the month, so the Steam date is used) |
| Stardew Valley | stardewvalley.net (ConcernedApe) |
| Grand Theft Auto VI | rockstargames.com/VI and the Rockstar Store |

Descriptions were written by the team. Artwork is the official store artwork (Steam, and Rockstar's own site for
Grand Theft Auto VI), loaded from the publishers' servers (not copied into this repository) and shown for review
purposes. All game names, artwork and logos belong to their publishers. The League of Legends and Valorant
images and the DPRate logo come from the team's Assessment 1 and 2 work.
