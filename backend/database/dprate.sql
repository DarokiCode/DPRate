-- DPRate database: structure and sample data (SQL dump for Assessment 2)
-- Import with phpMyAdmin (XAMPP: Import tab) or from the command line:
--   mysql -u root -p < backend/database/dprate.sql

CREATE DATABASE IF NOT EXISTS dprate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dprate;

-- Child tables first, because of the foreign keys.
DROP TABLE IF EXISTS favourites;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS genres;
DROP TABLE IF EXISTS users;

-- Users: passwords are stored only as a hash made by password_hash().
CREATE TABLE users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(30) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
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
-- "rating" is a fixed value per game in Assessment 2 (there are no reviews yet).
-- In Assessment 3 the API will take it from AVG(reviews.rating) instead.
CREATE TABLE games (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(120) NOT NULL,
  genre_id INT UNSIGNED NOT NULL,
  rating DECIMAL(2,1) NOT NULL DEFAULT 0.0,
  image VARCHAR(255) NOT NULL,
  tags VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  developer VARCHAR(120) NOT NULL,
  publisher VARCHAR(120) NOT NULL,
  release_text VARCHAR(40) NOT NULL,
  platforms VARCHAR(120) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_games_genre FOREIGN KEY (genre_id) REFERENCES genres (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reviews (table from the A1 proposal). Empty in Assessment 2; the review system is built in Assessment 3.
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

-- Favourites (table from the A1 proposal). Empty in Assessment 2; add and remove are built in Assessment 3.
CREATE TABLE favourites (
  user_id INT UNSIGNED NOT NULL,
  game_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, game_id),
  CONSTRAINT fk_favourites_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_favourites_game FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO genres (id, name) VALUES
(1, 'Action'),
(2, 'Adventure'),
(3, 'RPG'),
(4, 'Sports'),
(5, 'Strategy'),
(6, 'Simulation');

-- Fixed ids (2, 3, 4) match the React mockup and the API contract:
-- game.php?id=2 must return League of Legends.
INSERT INTO games (id, title, genre_id, rating, image, tags, description, developer, publisher, release_text, platforms) VALUES
(2, 'League of Legends', 5, 4.6, '/assets/league-of-legends.jpg', 'Strategy,MOBA,Multiplayer',
 'League of Legends is a multiplayer online, fast-paced strategy game where two teams of five players fight to destroy the enemy''s main base.',
 'Riot Games', 'Riot Games', '2009', 'PC'),
(3, 'Valorant', 1, 4.5, '/assets/valorant.jpg', 'Action,Tactical Shooter,Multiplayer',
 'A team-based tactical shooter where players use their skills and abilities to compete in exciting matches.',
 'Riot Games', 'Riot Games', '2020', 'PC and consoles'),
(4, 'Counter-Strike 2', 1, 4.8, '/assets/counter-strike-2.jpg', 'Action,FPS,Multiplayer',
 'A competitive tactical shooter with objective-based matches and team gameplay.',
 'Valve', 'Valve', '2023', 'PC');
