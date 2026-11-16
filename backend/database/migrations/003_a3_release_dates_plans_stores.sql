-- Migration 003 (Assessment 3, refinements). Run after 001 and 002.
-- Nothing is deleted: this only adds columns, one table and one game, and corrects game data.
--
-- 1. games.release_date: the full release date (the A1 proposal promised a release date, not only a year).
--    It also lets the API lock reviews until a game is out (Grand Theft Auto VI).
-- 2. games.sponsored: marks the paid "Sponsored" spot on the home page (a demo of the revenue model).
-- 3. users.plan and users.avatar: the Standard / Silver / Gold plans and the profile picture (A1 minor feature).
-- 4. game_stores: official store links for "Where to buy" (affiliate links in the business model).
-- 5. Data checked against official sources only (publisher sites and the Steam store), listed in the README.

ALTER TABLE games
  ADD COLUMN release_date DATE NULL AFTER release_text,
  ADD COLUMN sponsored TINYINT(1) NOT NULL DEFAULT 0 AFTER platforms;

ALTER TABLE users
  ADD COLUMN plan ENUM('standard', 'silver', 'gold') NOT NULL DEFAULT 'standard' AFTER password_hash,
  ADD COLUMN avatar VARCHAR(30) NULL AFTER plan;

CREATE TABLE game_stores (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  game_id INT UNSIGNED NOT NULL,
  store VARCHAR(40) NOT NULL,
  url VARCHAR(255) NOT NULL,
  position TINYINT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY idx_game_stores_game (game_id),
  CONSTRAINT fk_game_stores_game FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Release dates, developers, publishers and platforms from official sources.
-- League of Legends: Riot's own posts only give the month (October 2009), so release_date holds the 1st
-- (used for sorting) and the page shows the text 'October 2009'.
UPDATE games SET release_text = 'October 2009', release_date = '2009-10-01', platforms = 'PC' WHERE id = 2;
UPDATE games SET release_text = '2 June 2020', release_date = '2020-06-02',
  platforms = 'PC, PlayStation 5, Xbox Series X|S' WHERE id = 3;
UPDATE games SET release_text = '27 September 2023', release_date = '2023-09-27', platforms = 'PC' WHERE id = 4;
UPDATE games SET release_text = '17 September 2020', release_date = '2020-09-17',
  platforms = 'PC, Nintendo Switch, PlayStation 4, PlayStation 5, Xbox One, Xbox Series X|S' WHERE id = 5;
UPDATE games SET release_text = '26 October 2018', release_date = '2018-10-26', developer = 'Rockstar Studios',
  platforms = 'PC, PlayStation 4, Xbox One' WHERE id = 6;
UPDATE games SET release_text = '24 February 2017', release_date = '2017-02-24',
  description = 'Explore Hallownest, a vast ruined kingdom of insects, in a hand-drawn 2D action adventure made by the small independent studio Team Cherry.',
  platforms = 'PC, Nintendo Switch, Nintendo Switch 2, PlayStation 4, PlayStation 5, Xbox One, Xbox Series X|S' WHERE id = 7;
UPDATE games SET release_text = '25 February 2022', release_date = '2022-02-25',
  platforms = 'PC, PlayStation 4, PlayStation 5, Xbox One, Xbox Series X|S' WHERE id = 8;
UPDATE games SET release_text = '3 August 2023', release_date = '2023-08-03',
  platforms = 'PC, Mac, PlayStation 5, Xbox Series X|S' WHERE id = 9;
UPDATE games SET release_text = '19 May 2015', release_date = '2015-05-19', developer = 'CD PROJEKT RED', publisher = 'CD PROJEKT RED',
  platforms = 'PC, PlayStation 4, PlayStation 5, Xbox One, Xbox Series X|S, Nintendo Switch, Nintendo Switch 2' WHERE id = 10;
UPDATE games SET release_text = '7 July 2015', release_date = '2015-07-07',
  platforms = 'PC, PlayStation, Xbox, Nintendo Switch' WHERE id = 11;
UPDATE games SET release_text = '20 October 2016', release_date = '2016-10-20',
  platforms = 'PC, Mac, Linux, PlayStation 4, Xbox One, Nintendo Switch, iOS' WHERE id = 12;
UPDATE games SET release_text = '26 February 2016', release_date = '2016-02-26',
  platforms = 'PC, Mac, Linux, PlayStation 4, Xbox One, Nintendo Switch, PlayStation Vita, iOS, Android' WHERE id = 13;

-- Grand Theft Auto VI (Rockstar Store and Rockstar Newswire). Reviews open on release day.
INSERT INTO games (id, title, genre_id, image, banner, logo, tags, description, developer, publisher, release_text, release_date, platforms, sponsored) VALUES
(14, 'Grand Theft Auto VI', 1,
 'https://images.ctfassets.net/h1rqp7q66d54/2Jdz0iAM18p5xmLns5yGLC/5a43ecf3763a9db84504fc32b8417c4f/GTAVI_PreOrderWebstore_GamesGrid_FOB_1212x1497_R01.jpg?w=600&fm=jpg&q=80',
 'https://images.ctfassets.net/h1rqp7q66d54/6DDt8GD2eOt8L0p3cmEfBX/1dfa343edde7f6baae2e7df6e48bbdd2/GTAVI_PreOrderWebstore_HeroBackground_3840x1646_R03.jpg?w=1920&fm=jpg&q=75',
 NULL,
 'Open World,Crime,Single-player',
 'Jason and Lucia''s easy score goes wrong and pulls them into a criminal conspiracy across the sunny state of Leonida and a modern-day Vice City. The next Grand Theft Auto, a single-player story from Rockstar Games.',
 'Rockstar Games', 'Rockstar Games', '19 November 2026', '2026-11-19', 'PlayStation 5, Xbox Series X|S', 1);

ALTER TABLE games MODIFY release_date DATE NOT NULL;

-- Official store pages for "Where to buy" (position = order on the page).
INSERT INTO game_stores (game_id, store, url, position) VALUES
(2, 'Official site (free to play)', 'https://www.leagueoflegends.com', 1),
(3, 'Official site (free to play)', 'https://playvalorant.com/en-us/platform-selection/', 1),
(4, 'Steam (free to play)', 'https://store.steampowered.com/app/730/', 1),
(5, 'Steam', 'https://store.steampowered.com/app/1145360/', 1),
(5, 'Supergiant Games', 'https://www.supergiantgames.com', 2),
(6, 'Steam', 'https://store.steampowered.com/app/1174180/', 1),
(6, 'Rockstar Games', 'https://www.rockstargames.com/games/RedDeadRedemption2', 2),
(7, 'Steam', 'https://store.steampowered.com/app/367520/', 1),
(7, 'Team Cherry', 'https://www.teamcherry.com.au/games', 2),
(8, 'Steam', 'https://store.steampowered.com/app/1245620/', 1),
(8, 'Bandai Namco', 'https://en.bandainamcoent.eu/elden-ring/elden-ring', 2),
(9, 'Steam', 'https://store.steampowered.com/app/1086940/', 1),
(9, 'Larian Studios', 'https://baldursgate3.game/', 2),
(10, 'Steam', 'https://store.steampowered.com/app/292030/', 1),
(10, 'CD PROJEKT RED', 'https://www.thewitcher.com', 2),
(11, 'Official site (free to play)', 'https://www.rocketleague.com/en/play', 1),
(12, 'Steam', 'https://store.steampowered.com/app/289070/', 1),
(12, '2K Store', 'https://store.2k.com/en/game/buy-civilization-6', 2),
(13, 'Steam', 'https://store.steampowered.com/app/413150/', 1),
(13, 'Stardew Valley', 'https://www.stardewvalley.net', 2),
(14, 'Rockstar Store (pre-order)', 'https://store.rockstargames.com/game/buy-gta-vi', 1),
(14, 'Rockstar Games', 'https://www.rockstargames.com/VI', 2);
