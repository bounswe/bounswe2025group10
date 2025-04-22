-- USERS TABLE
CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    isAdmin BOOLEAN DEFAULT FALSE,
    profile_id INT UNIQUE,
    profile_image VARCHAR(255), # image URL or path
    bio TEXT
);

-- POSTS TABLE
CREATE TABLE Posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    creator_id INT NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP, # automatically sets to current date/time when post is created
    text TEXT, # post's text content
    image VARCHAR(255), # image URL or path
    FOREIGN KEY (creator_id) REFERENCES Users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- COMMENTS TABLE
CREATE TABLE Comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    author_id INT NOT NULL,
    content TEXT NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP, # automatically sets to current date/time when comment is created
    FOREIGN KEY (post_id) REFERENCES Posts(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (author_id) REFERENCES Users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- CHALLENGES TABLE
CREATE TABLE Challenges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    target_amount FLOAT,
    current_progress FLOAT DEFAULT 0,
    is_public BOOLEAN DEFAULT FALSE, # whether the challenge can be participated by all users or only by the creator
    reward_id INT,
    FOREIGN KEY (reward_id) REFERENCES Achievements(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- USER-CHALLENGE RELATIONSHIP TABLE
# For keeping track of all the challenges a user participates in
CREATE TABLE UserChallenges (
    user_id INT,
    challenge_id INT,
    joined_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, challenge_id),
    FOREIGN KEY (user_id) REFERENCES Users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (challenge_id) REFERENCES Challenges(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ACHIEVEMENTS TABLE
CREATE TABLE Achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(255) # image URL or path for the achievement icon
);

-- USER-ACHIEVEMENT RELATIONSHIP TABLE
CREATE TABLE UserAchievements (
    user_id INT,
    achievement_id INT,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP, # automatically sets to current date/time when achievement is earned
    PRIMARY KEY (user_id, achievement_id),
    FOREIGN KEY (user_id) REFERENCES Users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES Achievements(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- TIPS TABLE
CREATE TABLE Tips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    text TEXT NOT NULL,
    like_count INT DEFAULT 0,
    dislike_count INT DEFAULT 0
);