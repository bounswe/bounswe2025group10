-- USERS TABLE
CREATE TABLE `Users` (
  `id`             INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `password`       VARCHAR(128)            NOT NULL,
  `last_login`     DATETIME                NULL,
  `is_superuser`   BOOLEAN    NOT NULL DEFAULT FALSE,
  `email`          VARCHAR(254) UNIQUE     NOT NULL,
  `username`       VARCHAR(150) UNIQUE     NOT NULL,
  `first_name`     VARCHAR(150)            NOT NULL DEFAULT '',
  `last_name`      VARCHAR(150)            NOT NULL DEFAULT '',
  `is_active`      BOOLEAN    NOT NULL DEFAULT TRUE,
  `date_joined`    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `isAdmin`        BOOLEAN    NOT NULL DEFAULT FALSE,
  `is_staff`       BOOLEAN    NOT NULL DEFAULT FALSE,
  `profile_id`     INT(11)    UNIQUE,
  `profile_image`  VARCHAR(255),
  `bio`            TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- POSTS TABLE
CREATE TABLE `Posts` (
    `id` INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `creator_id` INT(11) NOT NULL,
    `date` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,  # automatically sets to current date/time when post is created
    `text` TEXT,
    `image` VARCHAR(255),
    FOREIGN KEY (`creator_id`) REFERENCES `Users`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- COMMENTS TABLE
CREATE TABLE `Comments` (
    `id` INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `post_id` INT(11) NOT NULL,
    `author_id` INT(11) NOT NULL,
    `content` TEXT NOT NULL,
    `date` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`post_id`) REFERENCES `Posts`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (`author_id`) REFERENCES `Users`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ACHIEVEMENTS TABLE
CREATE TABLE `Achievements` (
    `id` INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(100)   NOT NULL,
    `description` TEXT,
    `icon` VARCHAR(255) # image URL or path for the achievement icon
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CHALLENGES TABLE
CREATE TABLE `Challenges` (
    `id` INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(100)   NOT NULL,
    `description` TEXT,
    `target_amount` FLOAT,
    `current_progress` FLOAT NOT NULL DEFAULT 0,
    `is_public` BOOLEAN    NOT NULL DEFAULT FALSE,  # whether the challenge can be participated by all users or only by the creator
    `reward_id` INT(11),
    FOREIGN KEY (`reward_id`) REFERENCES `Achievements`(`id`)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- USER-CHALLENGE RELATIONSHIP TABLE
# For keeping track of all the challenges a user participates in
CREATE TABLE `UserChallenges` (
    `user_id` INT(11) NOT NULL,
    `challenge_id` INT(11) NOT NULL,
    `joined_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`, `challenge_id`),
    FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (`challenge_id`) REFERENCES `Challenges`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- USER-ACHIEVEMENT RELATIONSHIP TABLE
CREATE TABLE `UserAchievements` (
    `user_id` INT(11) NOT NULL,
    `achievement_id` INT(11) NOT NULL,
    `earned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`, `achievement_id`),
    FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (`achievement_id`) REFERENCES `Achievements`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- TIPS TABLE
CREATE TABLE `Tips` (
    `id` INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `text` TEXT    NOT NULL,
    `like_count` INT(11) NOT NULL DEFAULT 0,
    `dislike_count` INT(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
