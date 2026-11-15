-- Assessment 3, migration 001: the rating now comes from the players' reviews.
-- Run this ONCE on an Assessment 2 database that is already in use (XAMPP of Pedro or Davi).
-- It keeps every user, review and favourite. It only removes the fixed example
-- ratings (4.6, 4.5 and 4.8) that Assessment 2 stored in the games table.
-- phpMyAdmin: select the dprate database, open the Import tab, choose this file, click Go.

ALTER TABLE games DROP COLUMN rating;
