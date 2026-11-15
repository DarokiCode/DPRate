-- Assessment 3, migration 002: bigger game catalogue and artwork for the redesigned site.
-- Run ONCE, after migration 001, on a database that is already in use. Nothing is deleted.
-- Data checked on 15/11/2026 against Wikipedia and the publishers' pages (sources in the README).
-- Artwork comes from the official Steam store images and stays on Steam's servers
-- (the site links to it, it is not copied). It is shown for review purposes only.

-- Wide artwork for the home page banner, and the transparent game logo shown on top of it.
ALTER TABLE games
  ADD COLUMN banner VARCHAR(255) NULL AFTER image,
  ADD COLUMN logo VARCHAR(255) NULL AFTER banner;

UPDATE games SET banner = '/assets/league-banner.jpg' WHERE id = 2;
UPDATE games SET image = 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/library_600x900_2x.jpg',
  banner = 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/library_hero.jpg',
  logo = 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/logo.png'
WHERE id = 4;

INSERT INTO games (id, title, genre_id, image, banner, logo, tags, description, developer, publisher, release_text, platforms) VALUES
(5, 'Hades', 1, 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1145360/library_600x900_2x.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1145360/library_hero.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1145360/logo.png',
 'Roguelike,Action,Greek Mythology',
 'Fight your way out of the Underworld as Zagreus, son of Hades. Every escape attempt is different, and every death moves the story forward with help from the gods of Olympus.',
 'Supergiant Games', 'Supergiant Games', '2020', 'PC, PlayStation, Xbox, Nintendo Switch'),
(6, 'Red Dead Redemption 2', 2, 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1174180/library_600x900_2x.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1174180/library_hero.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1174180/logo.png',
 'Open World,Western,Story-rich',
 'Ride with outlaw Arthur Morgan and the Van der Linde gang across a huge, living American frontier in 1899, where every choice shapes his story.',
 'Rockstar Games', 'Rockstar Games', '2018', 'PC, PlayStation 4, Xbox One'),
(7, 'Hollow Knight', 2, 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/367520/library_600x900_2x.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/367520/library_hero.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/367520/logo.png',
 'Metroidvania,Exploration,Indie',
 'Explore Hallownest, a vast ruined kingdom of insects, in a hand-drawn 2D action adventure made by Adelaide studio Team Cherry.',
 'Team Cherry', 'Team Cherry', '2017', 'PC, PlayStation, Xbox, Nintendo Switch'),
(8, 'Elden Ring', 3, 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/library_600x900_2x.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/library_hero.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/logo.png',
 'Open World,Souls-like,Fantasy',
 'Rise as a Tarnished and explore the Lands Between, an open fantasy world full of hidden dungeons and brutal bosses, with world-building by George R. R. Martin.',
 'FromSoftware', 'Bandai Namco Entertainment', '2022', 'PC, PlayStation, Xbox'),
(9, 'Baldur''s Gate 3', 3, 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1086940/library_600x900_2x.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1086940/library_hero.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1086940/logo.png',
 'Turn-based,Dungeons & Dragons,Co-op',
 'A party-based role-playing game set in the world of Dungeons & Dragons, where turn-based combat and choices with real consequences shape your own story.',
 'Larian Studios', 'Larian Studios', '2023', 'PC, macOS, PlayStation 5, Xbox Series X|S'),
(10, 'The Witcher 3: Wild Hunt', 3, 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/292030/library_600x900_2x.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/292030/library_hero.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/292030/logo.png',
 'Open World,Story-rich,Fantasy',
 'Play as Geralt of Rivia, a monster hunter for hire, searching for his adopted daughter Ciri across a war-torn open world based on Andrzej Sapkowski''s books.',
 'CD Projekt Red', 'CD Projekt', '2015', 'PC, PlayStation, Xbox, Nintendo Switch'),
(11, 'Rocket League', 4, 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/252950/library_600x900_2x.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/252950/library_hero.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/252950/logo.png',
 'Football,Cars,Competitive',
 'Football with rocket-powered cars: fast, physics-based matches where teams boost, jump and fly to score. Free to play since 2020.',
 'Psyonix', 'Psyonix', '2015', 'PC, PlayStation 4, Xbox One, Nintendo Switch'),
(12, 'Sid Meier''s Civilization VI', 5, 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/289070/library_600x900_2x.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/289070/library_hero.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/289070/logo.png',
 'Turn-based,4X,Historical',
 'Lead a civilisation from the Stone Age to the Information Age in a turn-based strategy game about exploring, building cities and winning through culture, science or war.',
 'Firaxis Games', '2K', '2016', 'PC, PlayStation 4, Xbox One, Nintendo Switch, iOS'),
(13, 'Stardew Valley', 6, 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/413150/library_600x900_2x.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/413150/library_hero.jpg',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/413150/logo.png',
 'Farming,Life Sim,Co-op',
 'Inherit your grandfather''s old farm and build a new life in a small country town: grow crops, raise animals, make friends and explore the mines. Made by one developer, Eric Barone.',
 'ConcernedApe', 'ConcernedApe', '2016', 'PC, PlayStation, Xbox, Nintendo Switch, Mobile');
