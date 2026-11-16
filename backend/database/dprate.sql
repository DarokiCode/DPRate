-- DPRate database: full structure and data (Assessment 3).
-- Fresh install only. Import with phpMyAdmin (Import tab) or from the command line:
--   mysql -u root -p < backend/database/dprate.sql
--
-- Safe by design: there is no DROP TABLE. If the tables already exist, MySQL stops at the
-- first CREATE TABLE and nothing is deleted. To update an Assessment 2 database that is
-- already in use, run the files in backend/database/migrations instead (see the README).

CREATE DATABASE IF NOT EXISTS dprate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dprate;

-- Users: passwords are stored only as a hash made by password_hash().
CREATE TABLE users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(30) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  plan ENUM('standard', 'silver', 'gold') NOT NULL DEFAULT 'standard', -- subscription plan (demo, no payment)
  avatar VARCHAR(30) NULL,                                             -- chosen profile picture, NULL = initials
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Genres (table from the A1 proposal). The names match the genre buttons in the React front end.
CREATE TABLE genres (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_genres_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Games: the live dataset. "tags" is a comma-separated list, turned into an array by PHP.
-- There is no rating column: the rating is always calculated from the reviews (AVG in games.php).
CREATE TABLE games (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(120) NOT NULL,
  genre_id INT UNSIGNED NOT NULL,
  image VARCHAR(255) NOT NULL,
  banner VARCHAR(255) NULL,   -- wide artwork for the home page banner
  logo VARCHAR(255) NULL,     -- transparent game logo shown on the banner
  tags VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  developer VARCHAR(120) NOT NULL,
  publisher VARCHAR(120) NOT NULL,
  release_text VARCHAR(40) NOT NULL,  -- release date as shown on the page
  release_date DATE NOT NULL,          -- used for sorting and to open reviews on release day
  platforms VARCHAR(120) NOT NULL,
  sponsored TINYINT(1) NOT NULL DEFAULT 0, -- paid "Sponsored" spot on the home page (demo)
  PRIMARY KEY (id),
  CONSTRAINT fk_games_genre FOREIGN KEY (genre_id) REFERENCES genres (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reviews: one review per player per game (UNIQUE user_id + game_id), 1 to 5 stars.
CREATE TABLE reviews (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  game_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reviews_user_game (user_id, game_id),
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_reviews_game FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Favourites: the primary key (user_id, game_id) stops the same game being saved twice.
CREATE TABLE favourites (
  user_id INT UNSIGNED NOT NULL,
  game_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, game_id),
  CONSTRAINT fk_favourites_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_favourites_game FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Where to buy: official store pages for each game (affiliate links in the business model).
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

INSERT INTO genres (id, name) VALUES
(1, 'Action'),
(2, 'Adventure'),
(3, 'RPG'),
(4, 'Sports'),
(5, 'Strategy'),
(6, 'Simulation');

-- Ids 2, 3 and 4 come from the A1 mockup (game.php?id=2 must return League of Legends).
-- Ids 5 to 14 were added in Assessment 3. Data checked on 16/11/2026 against official sources only
-- (publisher sites and the Steam store, listed in the README). League of Legends: Riot only gives the
-- month, so release_date holds 1 October 2009 for sorting and the page shows 'October 2009'.
-- Artwork stays on the official servers (Steam, Rockstar Store) and is shown for review purposes only.
INSERT INTO games (id, title, genre_id, image, banner, logo, tags, description, developer, publisher, release_text, release_date, platforms, sponsored) VALUES
(2, 'League of Legends', 5, '/assets/league-of-legends.jpg',
 '/assets/league-banner.jpg',
 NULL,
 'Strategy,MOBA,Multiplayer',
 'League of Legends is a multiplayer online, fast-paced strategy game where two teams of five players fight to destroy the enemy''s main base.',
 'Riot Games', 'Riot Games', 'October 2009', '2009-10-01', 'PC', 0),
(3, 'Valorant', 1, '/assets/valorant.jpg',
 NULL,
 NULL,
 'Action,Tactical Shooter,Multiplayer',
 'A team-based tactical shooter where players use their skills and abilities to compete in exciting matches.',
 'Riot Games', 'Riot Games', '2 June 2020', '2020-06-02', 'PC, PlayStation 5, Xbox Series X|S', 0),
(4, 'Counter-Strike 2', 1, 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/library_600x900_2x.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/library_hero.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/logo.png',
 'Action,FPS,Multiplayer',
 'A competitive tactical shooter with objective-based matches and team gameplay.',
 'Valve', 'Valve', '27 September 2023', '2023-09-27', 'PC', 0),
(5, 'Hades', 1, 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1145360/library_600x900_2x.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1145360/library_hero.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1145360/logo.png',
 'Roguelike,Action,Greek Mythology',
 'Fight your way out of the Underworld as Zagreus, son of Hades. Every escape attempt is different, and every death moves the story forward with help from the gods of Olympus.',
 'Supergiant Games', 'Supergiant Games', '17 September 2020', '2020-09-17', 'PC, Nintendo Switch, PlayStation 4, PlayStation 5, Xbox One, Xbox Series X|S', 0),
(6, 'Red Dead Redemption 2', 2, 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1174180/library_600x900_2x.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1174180/library_hero.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1174180/logo.png',
 'Open World,Western,Story-rich',
 'Ride with outlaw Arthur Morgan and the Van der Linde gang across a huge, living American frontier in 1899, where every choice shapes his story.',
 'Rockstar Studios', 'Rockstar Games', '26 October 2018', '2018-10-26', 'PC, PlayStation 4, Xbox One', 0),
(7, 'Hollow Knight', 2, 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/367520/library_600x900_2x.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/367520/library_hero.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/367520/logo.png',
 'Metroidvania,Exploration,Indie',
 'Explore Hallownest, a vast ruined kingdom of insects, in a hand-drawn 2D action adventure made by the small independent studio Team Cherry.',
 'Team Cherry', 'Team Cherry', '24 February 2017', '2017-02-24', 'PC, Nintendo Switch, Nintendo Switch 2, PlayStation 4, PlayStation 5, Xbox One, Xbox Series X|S', 0),
(8, 'Elden Ring', 3, 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/library_600x900_2x.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/library_hero.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/logo.png',
 'Open World,Souls-like,Fantasy',
 'Rise as a Tarnished and explore the Lands Between, an open fantasy world full of hidden dungeons and brutal bosses, with world-building by George R. R. Martin.',
 'FromSoftware', 'Bandai Namco Entertainment', '25 February 2022', '2022-02-25', 'PC, PlayStation 4, PlayStation 5, Xbox One, Xbox Series X|S', 0),
(9, 'Baldur''s Gate 3', 3, 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1086940/library_600x900_2x.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1086940/library_hero.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1086940/logo.png',
 'Turn-based,Dungeons & Dragons,Co-op',
 'A party-based role-playing game set in the world of Dungeons & Dragons, where turn-based combat and choices with real consequences shape your own story.',
 'Larian Studios', 'Larian Studios', '3 August 2023', '2023-08-03', 'PC, Mac, PlayStation 5, Xbox Series X|S', 0),
(10, 'The Witcher 3: Wild Hunt', 3, 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/292030/library_600x900_2x.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/292030/library_hero.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/292030/logo.png',
 'Open World,Story-rich,Fantasy',
 'Play as Geralt of Rivia, a monster hunter for hire, searching for his adopted daughter Ciri across a war-torn open world based on Andrzej Sapkowski''s books.',
 'CD PROJEKT RED', 'CD PROJEKT RED', '19 May 2015', '2015-05-19', 'PC, PlayStation 4, PlayStation 5, Xbox One, Xbox Series X|S, Nintendo Switch, Nintendo Switch 2', 0),
(11, 'Rocket League', 4, 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/252950/library_600x900_2x.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/252950/library_hero.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/252950/logo.png',
 'Football,Cars,Competitive',
 'Football with rocket-powered cars: fast, physics-based matches where teams boost, jump and fly to score. Free to play since 2020.',
 'Psyonix', 'Psyonix', '7 July 2015', '2015-07-07', 'PC, PlayStation, Xbox, Nintendo Switch', 0),
(12, 'Sid Meier''s Civilization VI', 5, 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/289070/library_600x900_2x.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/289070/library_hero.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/289070/logo.png',
 'Turn-based,4X,Historical',
 'Lead a civilisation from the Stone Age to the Information Age in a turn-based strategy game about exploring, building cities and winning through culture, science or war.',
 'Firaxis Games', '2K', '20 October 2016', '2016-10-20', 'PC, Mac, Linux, PlayStation 4, Xbox One, Nintendo Switch, iOS', 0),
(13, 'Stardew Valley', 6, 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/413150/library_600x900_2x.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/413150/library_hero.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/413150/logo.png',
 'Farming,Life Sim,Co-op',
 'Inherit your grandfather''s old farm and build a new life in a small country town: grow crops, raise animals, make friends and explore the mines. Made by one developer, Eric Barone.',
 'ConcernedApe', 'ConcernedApe', '26 February 2016', '2016-02-26', 'PC, Mac, Linux, PlayStation 4, Xbox One, Nintendo Switch, PlayStation Vita, iOS, Android', 0),
(14, 'Grand Theft Auto VI', 1, 'https://images.ctfassets.net/h1rqp7q66d54/2Jdz0iAM18p5xmLns5yGLC/5a43ecf3763a9db84504fc32b8417c4f/GTAVI_PreOrderWebstore_GamesGrid_FOB_1212x1497_R01.jpg?w=600&fm=jpg&q=80',
 'https://images.ctfassets.net/h1rqp7q66d54/6DDt8GD2eOt8L0p3cmEfBX/1dfa343edde7f6baae2e7df6e48bbdd2/GTAVI_PreOrderWebstore_HeroBackground_3840x1646_R03.jpg?w=1920&fm=jpg&q=75',
 NULL,
 'Open World,Crime,Single-player',
 'Jason and Lucia''s easy score goes wrong and pulls them into a criminal conspiracy across the sunny state of Leonida and a modern-day Vice City. The next Grand Theft Auto, a single-player story from Rockstar Games.',
 'Rockstar Games', 'Rockstar Games', '19 November 2026', '2026-11-19', 'PlayStation 5, Xbox Series X|S', 1);

-- Official store pages for "Where to buy" (affiliate links in the business model).
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
