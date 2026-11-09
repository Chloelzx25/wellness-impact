const pool = require("../services/db");
const bcrypt = require("bcrypt");
const saltRounds = 10;

bcrypt.hash('1234', saltRounds, (error, hash) => {
    if (error) {
        console.error("Error hashing password:", error);
        process.exit();
    }

    bcrypt.hash('admin123', saltRounds, (error, adminHash) => {
        if (error) {
            console.error("Error hashing admin password:", error);
            process.exit();
        }

        const SQLSTATEMENT = `
        -- Drop tables in REVERSE order (child tables first)
        DROP TABLE IF EXISTS MinigameAttempt;
        DROP TABLE IF EXISTS UserCompletion;
        DROP TABLE IF EXISTS UserInventory;
        DROP TABLE IF EXISTS UserCharacter;
        DROP TABLE IF EXISTS WellnessChallenge;
        DROP TABLE IF EXISTS CharacterShop;
        DROP TABLE IF EXISTS WeaponShop;
        DROP TABLE IF EXISTS ArtifactShop;
        DROP TABLE IF EXISTS FoodShop;
        DROP TABLE IF EXISTS User;

        CREATE TABLE User (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            points INT DEFAULT 0,
            role ENUM('user', 'admin') DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE WellnessChallenge (
            challenge_id INT AUTO_INCREMENT PRIMARY KEY,
            creator_id INT NOT NULL,
            description TEXT NOT NULL,
            points INT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (creator_id) REFERENCES User(user_id) ON DELETE CASCADE
        );

        CREATE TABLE CharacterShop (
            character_id INT AUTO_INCREMENT PRIMARY KEY,
            character_name VARCHAR(255) NOT NULL,
            element VARCHAR(50) NOT NULL,
            class_type VARCHAR(50) NOT NULL,
            description TEXT,
            image_url TEXT,
            price INT NOT NULL DEFAULT 1000,
            base_hp INT DEFAULT 80,
            is_starter BOOLEAN DEFAULT FALSE
        );

        CREATE TABLE WeaponShop (
            weapon_id INT AUTO_INCREMENT PRIMARY KEY,
            weapon_name VARCHAR(255) NOT NULL,
            weapon_type VARCHAR(20) NOT NULL,
            description TEXT,
            image_url TEXT,
            price INT NOT NULL,
            xp_boost_percentage INT DEFAULT 10
        );

        CREATE TABLE ArtifactShop (
            artifact_id INT AUTO_INCREMENT PRIMARY KEY,
            artifact_name VARCHAR(255) NOT NULL,
            description TEXT,
            image_url TEXT,
            price INT NOT NULL,
            hp_boost INT DEFAULT 10
        );

        CREATE TABLE FoodShop (
            food_id INT AUTO_INCREMENT PRIMARY KEY,
            food_name VARCHAR(255) NOT NULL,
            description TEXT,
            image_url TEXT,
            price INT NOT NULL,
            heal_amount INT NOT NULL
        );

        CREATE TABLE UserCharacter (
            user_character_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            character_id INT NOT NULL,
            character_name VARCHAR(255) NOT NULL,
            element VARCHAR(50) NOT NULL,
            class_type VARCHAR(50) NOT NULL,
            current_hp INT NOT NULL,
            max_hp INT NOT NULL,
            level INT DEFAULT 1,
            experience INT DEFAULT 0,
            is_equipped BOOLEAN DEFAULT FALSE,
            last_full_health DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_challenge_completion DATETIME NULL,
            obtained_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            image_url TEXT,
            FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
            FOREIGN KEY (character_id) REFERENCES CharacterShop(character_id) ON DELETE CASCADE
        );

        CREATE TABLE UserInventory (
            inventory_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            item_type ENUM('weapon', 'artifact', 'food') NOT NULL,
            item_id INT NOT NULL,
            item_name VARCHAR(255) NOT NULL,
            image_url TEXT,
            quantity INT DEFAULT 1,
            is_equipped BOOLEAN DEFAULT FALSE,
            equipped_to_character_id INT NULL,
            purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
            FOREIGN KEY (equipped_to_character_id) REFERENCES UserCharacter(user_character_id) ON DELETE SET NULL,
            INDEX idx_equipped_to_character (equipped_to_character_id)
        );

        CREATE TABLE UserCompletion (
            completion_id INT AUTO_INCREMENT PRIMARY KEY,
            challenge_id INT NOT NULL,
            user_id INT NOT NULL,
            details TEXT,
            completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (challenge_id) REFERENCES WellnessChallenge(challenge_id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
        );

        CREATE TABLE MinigameAttempt (
            attempt_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            challenge_id INT NOT NULL,
            user_character_id INT NOT NULL,
            element VARCHAR(50) NOT NULL,
            success BOOLEAN NOT NULL,
            hp_lost INT NOT NULL,
            attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
            FOREIGN KEY (challenge_id) REFERENCES WellnessChallenge(challenge_id) ON DELETE CASCADE,
            FOREIGN KEY (user_character_id) REFERENCES UserCharacter(user_character_id) ON DELETE CASCADE
        );

        -- Insert admin user first (for foreign key reference)
        INSERT INTO User (username, email, password, points, role) VALUES
        ('admin', 'admin@genshin.com', '${adminHash}', 10000, 'admin'),
        ('yingen', 'yingen@123.com', '${hash}', 100, 'user'),
        ('testuser', 'test@test.com', '${hash}', 50, 'user');

        -- Insert starter character (Amber) - 50 HP
        INSERT INTO CharacterShop (character_name, element, class_type, description, image_url, price, base_hp, is_starter) VALUES
        ('Amber', 'Pyro', 'Archer', 'Outrider of the Knights of Favonius', 'https://static.wikia.nocookie.net/gensin-impact/images/7/75/Amber_Icon.png/revision/latest?cb=20210213161233', 0, 50, TRUE);

        -- Insert other characters (80 HP)
        INSERT INTO CharacterShop (character_name, element, class_type, description, image_url, price, base_hp) VALUES
        ('Durin', 'Pyro', 'Warrior', 'The Shadow Dragon of the Festering Skies', 'https://static.wikia.nocookie.net/gensin-impact/images/b/ba/Durin_Icon.png', 200, 80),
        ('Klee', 'Pyro', 'Mage', 'The Spark Knight of the Knights of Favonius', 'https://static.wikia.nocookie.net/gensin-impact/images/9/9c/Klee_Icon.png', 200, 80),
        ('Hu Tao', 'Pyro', 'Lancer', 'The 77th Director of the Wangsheng Funeral Parlor', 'https://static.wikia.nocookie.net/gensin-impact/images/e/e9/Hu_Tao_Icon.png', 200, 80),
        ('Mavuika', 'Pyro', 'Tank', 'The Resurrection of the Sacred Flame', 'https://static.wikia.nocookie.net/gensin-impact/images/d/da/Mavuika_Icon.png', 200, 80),
        ('Raiden Shogun', 'Electro', 'Lancer', 'Her Eternal Excellency, the Almighty Narukami Ogosho', 'https://static.wikia.nocookie.net/gensin-impact/images/2/24/Raiden_Shogun_Icon.png', 200, 80),
        ('Yae Miko', 'Electro', 'Mage', 'Guuji of the Grand Narukami Shrine', 'https://static.wikia.nocookie.net/gensin-impact/images/b/ba/Yae_Miko_Icon.png', 200, 80),
        ('Flins', 'Electro', 'Lancer', 'The Lightkeeper of the Final Night Cemetery', 'https://static.wikia.nocookie.net/gensin-impact/images/a/af/Flins_Icon.png', 200, 80),
        ('Zhongli', 'Geo', 'Lancer', 'Consultant of the Wangsheng Funeral Parlor', 'https://static.wikia.nocookie.net/gensin-impact/images/a/a6/Zhongli_Icon.png', 200, 80),
        ('Xilonen', 'Geo', 'Warrior', 'The legendary smith of Nanatzcayan', 'https://static.wikia.nocookie.net/gensin-impact/images/a/ab/Xilonen_Icon.png', 200, 80),
        ('Navia', 'Geo', 'Tank', 'President of the Spina di Rosula', 'https://static.wikia.nocookie.net/gensin-impact/images/c/c0/Navia_Icon.png', 200, 80),
        ('Yelan', 'Hydro', 'Archer', 'A mysterious operative for the Ministry of Civil Affairs', 'https://static.wikia.nocookie.net/gensin-impact/images/d/d3/Yelan_Icon.png', 200, 80),
        ('Furina', 'Hydro', 'Warrior', 'The Regina of All Waters, Kindreds, Peoples and Laws', 'https://static.wikia.nocookie.net/gensin-impact/images/e/e6/Furina_Icon.png', 200, 80),
        ('Columbina', 'Hydro', 'Mage', 'The Third of the Eleven Fatui Harbingers', 'https://static.wikia.nocookie.net/gensin-impact/images/3/35/Columbina_Icon.png', 200, 80),
        ('Xiao', 'Anemo', 'Lancer', 'The Vigilant Yaksha and Conqueror of Demons', 'https://static.wikia.nocookie.net/gensin-impact/images/f/fd/Xiao_Icon.png', 200, 80),
        ('Venti', 'Anemo', 'Archer', 'The free-spirited Tone-Deaf Bard of Mondstadt', 'https://static.wikia.nocookie.net/gensin-impact/images/f/f1/Venti_Icon.png', 200, 80),
        ('Kaedehara Kazuha', 'Anemo', 'Warrior', 'A wandering samurai of the Crux Fleet', 'https://static.wikia.nocookie.net/gensin-impact/images/e/e3/Kaedehara_Kazuha_Icon.png', 200, 80),
        ('Skirk', 'Cryo', 'Warrior', 'The mysterious swordswoman from the Abyss', 'https://static.wikia.nocookie.net/gensin-impact/images/0/03/Skirk_Icon.png', 200, 80),
        ('Citlali', 'Cryo', 'Mage', 'The priestess of the Masters of the Night-Wind', 'https://static.wikia.nocookie.net/gensin-impact/images/d/dd/Citlali_Icon.png', 200, 80),
        ('Ganyu', 'Cryo', 'Archer', 'Secretary of the Liyue Qixing', 'https://static.wikia.nocookie.net/gensin-impact/images/7/79/Ganyu_Icon.png', 200, 80),
        ('Escoffier', 'Cryo', 'Lancer', 'The Renowned Chef of Fontaine', 'https://static.wikia.nocookie.net/gensin-impact/images/2/2a/Escoffier_Icon.png', 200, 80),
        ('Nahida', 'Dendro', 'Mage', 'Lesser Lord Kusanali, the Deity of Wisdom', 'https://static.wikia.nocookie.net/gensin-impact/images/f/f9/Nahida_Icon.png', 200, 80),
        ('Kinich', 'Dendro', 'Tank', 'A Huitztlan Saurian-Hunter', 'https://static.wikia.nocookie.net/gensin-impact/images/9/9a/Kinich_Icon.png', 200, 80),
        ('Alhaitham', 'Dendro', 'Warrior', 'The Scribe of the Sumeru Akademiya', 'https://static.wikia.nocookie.net/gensin-impact/images/2/2c/Alhaitham_Icon.png', 200, 80);

        INSERT INTO WeaponShop
        (weapon_name, weapon_type, description, image_url, price, xp_boost_percentage)VALUES
        -- Pyro Weapons
        ('Athame Artis', 'Sword','A precious sword gifted by the Day King to the brave hero in the little witch''s story, only for the witch to take it and defeat the hero herself.','https://static.wikia.nocookie.net/gensin-impact/images/8/83/Weapon_Athame_Artis.png/revision/latest?cb=20251203231213', 150, 25),
        ('Dodoco Tales', 'Catalyst','A children''s book filled with childish short stories at which one cannot help but laugh.','https://static.wikia.nocookie.net/gensin-impact/images/5/51/Weapon_Dodoco_Tales.png/revision/latest?cb=20210613085809', 150, 25),
        ('Staff of Homa', 'Polearm','A "firewood staff" that was once used in ancient and long-lost rituals.','https://static.wikia.nocookie.net/gensin-impact/images/1/17/Weapon_Staff_of_Homa.png/revision/latest?cb=20210225200935', 150, 25),
        ('A Thousand Blazing Suns', 'Claymore','A greatsword that dazzles like the rising sun. It has witnessed the extinguishing and rekindling of innumerable suns.','https://static.wikia.nocookie.net/gensin-impact/images/2/2c/Weapon_A_Thousand_Blazing_Suns.png/revision/latest?cb=20250102021247', 150, 25),

        -- Electro Weapons
        ('Engulfing Lightning', 'Polearm','A naginata used to "cut grass." Any army that stands before this weapon will probably be likewise cut down...','https://static.wikia.nocookie.net/gensin-impact/images/2/21/Weapon_Engulfing_Lightning.png/revision/latest?cb=20210901044846', 150, 25),
        ('Kagura''s Verity', 'Catalyst','The bells used when performing the Kagura Dance, blessed by the Guuji herself. The scent of the Sacred Sakura tree lingers on it.','https://static.wikia.nocookie.net/gensin-impact/images/b/b7/Weapon_Kagura%27s_Verity.png/revision/latest?cb=20220216070811', 150, 25),
        ('Bloodsoaked Ruins', 'Polearm','A long spear tainted black by unrelenting battle, it shines with an ethereal glow beneath the ghostly blue light of the lantern-fire.','https://static.wikia.nocookie.net/gensin-impact/images/7/79/Weapon_Bloodsoaked_Ruins.png/revision/latest?cb=20250930222728', 150, 25),

        -- Geo Weapons
        ('Vortex Vanquisher', 'Polearm','This sharp polearm can seemingly pierce through anything. When swung, one can almost see the rift it tears in the air.','https://static.wikia.nocookie.net/gensin-impact/images/d/d6/Weapon_Vortex_Vanquisher.png/revision/latest?cb=20201129060822', 150, 25),
        ('Peak Patrol Song', 'Sword','An obsidian blade of unparalleled sharpness, light as a song. It was modified by a certain artisan to come equipped with a record-playing detachable Phlogiston Device.','https://static.wikia.nocookie.net/gensin-impact/images/b/b4/Weapon_Peak_Patrol_Song.png/revision/latest?cb=20241009015437', 150, 25),
        ('The Unforged', 'Claymore','Capable of driving away evil spirits and wicked people alike, this edgeless claymore seems to possess divine might.','https://static.wikia.nocookie.net/gensin-impact/images/f/f7/Weapon_The_Unforged.png/revision/latest?cb=20201129060814', 150, 25),

        -- Hydro Weapons
        ('Aqua Simulacra', 'Bow','This longbow''s color is unpredictable. Under the light, it takes on a lustrous, watery blue.','https://static.wikia.nocookie.net/gensin-impact/images/c/cd/Weapon_Aqua_Simulacra.png/revision/latest?cb=20220531054835', 150, 25),
        ('Splendor of Tranquil Waters', 'Sword','A scepter around which swirls pure water. In days long past, it once symbolized the highest authority over the seas.','https://static.wikia.nocookie.net/gensin-impact/images/4/4f/Weapon_Splendor_of_Tranquil_Waters.png/revision/latest?cb=20231221072120', 150, 25),
        ('Nocturne''s Curtain Call', 'Catalyst','A jade pearl shrouded in the light of the moon. Even in the coldest winter night, its gentle warmth lingers like a song.','https://static.wikia.nocookie.net/gensin-impact/images/2/24/Weapon_Nocturne%27s_Curtain_Call.png/revision/latest?cb=20260114024835', 150, 25),

        -- Anemo Weapons
        ('Primordial Jade Winged-Spear', 'Polearm','A jade polearm made by the archons, capable of slaying ancient beasts.','https://static.wikia.nocookie.net/gensin-impact/images/8/80/Weapon_Primordial_Jade_Winged-Spear.png/revision/latest?cb=20201116152024', 150, 25),
        ('Elegy for the End', 'Bow','A bow as lovely as any bard''s lyre, its arrows pierce the heart like a lamenting sigh.','https://static.wikia.nocookie.net/gensin-impact/images/a/a5/Weapon_Elegy_for_the_End.png/revision/latest?cb=20210317075424', 150, 25),
        ('Freedom-Sworn', 'Sword','A straight sword, azure as antediluvian song, and as keen as the oaths of freedom taken in the Land of Wind.','https://static.wikia.nocookie.net/gensin-impact/images/3/39/Weapon_Freedom-Sworn.png/revision/latest?cb=20210629202549', 150, 25),

        -- Cryo Weapons
        ('Azurelight', 'Sword','This blade was once pure and pristine as a white dawn star, but it has since been tinted a deep, dark blue.','https://static.wikia.nocookie.net/gensin-impact/images/b/bd/Weapon_Azurelight.png/revision/latest?cb=20250618034648', 150, 25),
        ('Starcallers Watch', 'Catalyst','A statue carved in the shape of an eagle, a sacred relic of the Masters of the Night-Wind that has been passed down from generation to generation.','https://static.wikia.nocookie.net/gensin-impact/images/a/a4/Weapon_Starcaller%27s_Watch.png/revision/latest?cb=20250102021801', 150, 25),
        ('Amos Bow', 'Bow','An extremely ancient bow that has retained its power despite its original master being long gone. It draws power from everyone and everything in the world, and the further away you are from that which your heart desires, the more powerful it is.','https://static.wikia.nocookie.net/gensin-impact/images/d/de/Weapon_Amos%27_Bow.png/revision/latest?cb=20201120010513', 150, 25),
        ('Symphonist of Scents', 'Polearm','An elegantly built polearm, said to have been a conductor''s baton wielded by a great musician to bridge tune and taste.','https://static.wikia.nocookie.net/gensin-impact/images/5/5d/Weapon_Symphonist_of_Scents.png/revision/latest?cb=20250507052735', 150, 25),

        -- Dendro Weapons
        ('A Thousand Floating Dreams', 'Catalyst','This lamp illuminates the dreams that float up over a thousand nights, and in its emerald-green light flows a song of ancient days.','https://static.wikia.nocookie.net/gensin-impact/images/4/4c/Weapon_A_Thousand_Floating_Dreams.png/revision/latest?cb=20221102030910', 150, 25),
        ('Fang of the Mountain King', 'Claymore','A giant sword forged from pure turquoise. Due to its greater weight than most ordinary weapons, it was named for Kongomato the Mountain King.','https://static.wikia.nocookie.net/gensin-impact/images/3/35/Weapon_Fang_of_the_Mountain_King.png/revision/latest?cb=20240919114417', 150, 25),
        ('Light of Foliar Incision', 'Sword','This gilded blade was made using precious white branches. It was once used to destroy countless poisons that infested the forest.','https://static.wikia.nocookie.net/gensin-impact/images/d/de/Weapon_Light_of_Foliar_Incision.png/revision/latest?cb=20230120084947', 150, 37);

       
        -- Insert artifacts
        INSERT INTO ArtifactShop (artifact_name, description, image_url, price, hp_boost) VALUES
        ("Gladiator's Finale", "The gladiator's hope and the lady's glory", 'https://static.wikia.nocookie.net/gensin-impact/images/b/b1/Item_Gladiator%27s_Nostalgia.png/revision/latest?cb=20201120063313', 80, 15),
        ("Noblesse Oblige", "The regalia of the old aristocracy", 'https://static.wikia.nocookie.net/gensin-impact/images/7/71/Item_Royal_Flora.png/revision/latest?cb=20201120063610', 90, 20),
        ("Wanderer's Troupe", "The wanderer's troupe of the music", 'https://static.wikia.nocookie.net/gensin-impact/images/a/ad/Item_Troupe%27s_Dawnlight.png/revision/latest?cb=20201120063930', 100, 25),
        ("Emblem of Severed Fate", "Emblem of a samurai's legacy", 'https://static.wikia.nocookie.net/gensin-impact/images/5/53/Item_Magnificent_Tsuba.png/revision/latest?cb=20210721030125', 110, 30);

        -- Insert food items
        INSERT INTO FoodShop (food_name, description, image_url, price, heal_amount) VALUES
        ('Potato Boat', 'A baked appetizer. The potato was washed clean and then baked together with cheese and Rukkhashava Mushrooms. The dish guarantees an unmatched experience when eaten hot. This explains its popularity on the streets of Sumeru. Still, be careful not to burn your tongue.', 'https://static.wikia.nocookie.net/gensin-impact/images/0/02/Item_Potato_Boat.png/revision/latest?cb=20220826001510', 50, 20),
        ('Fruity Duet', 'A dual-flavored fruity beverage. Add a thick layer of pulp at the bottom and then pour in a smoothie made out of juice and tea. Its layered flavors of fresh fruit are so tempting that no one is able to refuse the drink.', 'https://static.wikia.nocookie.net/gensin-impact/images/8/81/Item_Fruity_Duet.png/revision/latest?cb=20230817051440', 15, 5),
        ('Squirrel Fish', 'A hard-to-prepare fish dish. The fish is first completely deboned before crisscross cuts are made on the skin. The fish is then coated in flour and deep-fried to a golden-brown color, then served with ketchup drizzled on top. It is tender and juicy on the inside and crispy on the outside. The dish resembles a squirrel''s tail to a certain degree, hence the name.', 'https://static.wikia.nocookie.net/gensin-impact/images/c/ce/Item_Squirrel_Fish.png/revision/latest?cb=20210416224105', 80, 35),
        ("Adeptus' Temptation", 'A complex, famous type of Liyue cuisine, in which specially selected ingredients are submerged and slowly bowled into soup stock. The recipe scribbled from memory alone was enough to urge the adepti to once again return to the world of men.', 'https://static.wikia.nocookie.net/gensin-impact/images/5/5e/Item_Adeptus%27_Temptation.png/revision/latest?cb=20210415133724', 120, 50);

        -- Insert sample challenges
        INSERT INTO WellnessChallenge (creator_id, description, points) VALUES
        (1, 'Sleep like a boss - Get 7+ hours of sleep', 10),
        (1, 'Stairs over elevator? Respect. - Take the stairs today', 20),
        (1, 'Digital detox (mini edition) - No phone for 1 hour', 10),
        (1, 'Touch grass IRL - Take a 15-minute walk outside', 10),
        (1, 'IRL > DMs - Talk to a friend face-to-face', 20),
        (1, 'Declutter your chaos - Clean your desk or room', 20),
        (1, 'Help a homie - Assist someone without being asked', 20);

        -- Give starter characters to existing users
        INSERT INTO UserCharacter (user_id, character_id, character_name, element, class_type, current_hp, max_hp, level, experience, is_equipped, image_url)
        SELECT u.user_id, 1, 'Amber', 'Pyro', 'Archer', 50, 50, 1, 0, TRUE, 'https://static.wikia.nocookie.net/gensin-impact/images/7/75/Amber_Icon.png/revision/latest?cb=20210213161233'
        FROM User u
        WHERE u.user_id IN (1, 2, 3);
        `;

        pool.query(SQLSTATEMENT, (error, results, fields) => {
            if (error) {
                console.error("Error creating tables:", error);
                process.exit(1);
            } else {
               console.log("Tables created successfully!");
            }
            process.exit(0);
        });
    });
});