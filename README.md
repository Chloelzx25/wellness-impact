# Starter Repository for Assignment
You are required to build your folder structures for your project.

# Wellness Impact – CA2 Full Stack Application

## Starter Repository for Assignment
You are required to build your folder structures for your project.

This project extends the CA1 Wellness Challenge Tracker into a **full-stack gamified wellness application** with RPG elements, minigames, characters, inventory, and backend validation.

---

## Express.js + MySQL Gamified Wellness Application (CA2)

This repository contains a **full-stack web application** built using Express.js and MySQL, with a frontend implemented using HTML, CSS, and JavaScript.

The application allows users to:
- Register and log in securely
- Equip characters with elemental attributes
- Play element-based minigames
- Complete wellness challenges
- Earn Mora (points) and experience (XP)
- Manage inventory and shop purchases
- Observe cooldowns and HP limitations enforced by the backend

---

## Prerequisites

Before running the application, ensure that the following are installed:

- Node.js (v14 or higher)
- npm (Node Package Manager)
- MySQL database server
- Visual Studio Code (recommended)

---

## Clone the Repository

1. Open Visual Studio Code (VSCode).
2. Click on the **Source Control** icon on the left sidebar.
3. Click **Clone Repository**.
4. Enter the repository URL provided for CA2.
5. Choose a local directory.
6. Click **Clone** to start cloning.

---

## Setting Up Environment Variables (.env)

This project uses environment variables to store **database credentials** and **JWT authentication settings**.

1. Create a file named `.env` in the **root directory** of the project.

2. Copy and paste the following into `.env`:

DB_HOST=<your_database_host>
DB_USER=<your_database_user>
DB_PASSWORD=<your_database_password>
DB_DATABASE=<your_database_name>
JWT_SECRET_KEY=<your-secret-key>
JWT_EXPIRES_IN=<15m>
JWT_ALGORITHM=<HS256>

Example:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_DATABASE=wellness
JWT_SECRET_KEY=your-secret-key
JWT_EXPIRES_IN=15m
JWT_ALGORITHM=HS256

Note: Make sure there are no spaces around the equal sign (=) in each line.

3. Save the `.env` file.

### Usage

The `db.js` file in the `src/services` directory uses the `dotenv` package to read the `.env` file and set the environment variables. Here's an example of how the `db.js` file should look:

```javascript
require('dotenv').config(); // Read .env file and set environment variables

const mysql = require('mysql2');

const setting = {
    connectionLimit: 10,
    host: process.env.DB_HOST, 
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_DATABASE, 
    multipleStatements: true, 
    dateStrings: true 
}

const pool = mysql.createPool(setting);

module.exports = pool;
```

The `dotenv` package is used to load the environment variables from the `.env` file, and `process.env` is used to access these variables in your code.

Make sure to include the `require('dotenv').config();` line at the beginning of your file to load the environment variables from the `.env` file.


## Important Note

Ensure that the `.env` file is included in your `.gitignore` file to prevent sensitive information (such as database credentials) from being exposed in your version control system.

That's it! You have successfully set up environment variables using a `.env` file in your Express.js application. These variables can now be accessed in the `db.js` file or any other part of your application where needed.

Now you can move on to next part below.

## Install Dependencies

1. Open the terminal in VSCode by going to `View` > `Terminal` or using the shortcut `Ctrl + ``.

2. Navigate to the project root directory.

3. Install the required dependencies using npm:

   ```
   npm install
   ```

## Database Initialization

1. Make sure you have a MySQL database available for the mock test. Update the database configuration details in the `.env` file.

2. To initialize the database tables and populate them with sample data, open the terminal in VSCode and run the following command:

   ```
   npm run init_tables
   ```

## Start the Server

1. To start the Express.js server, run the following command:


2. The server will start on the specified PORT (default: 3000). You can access the API at `http://localhost:3000`.

## Commit and Sync Changes

1. Open the Source Control view in VSCode by clicking on the "Source Control" icon in the left sidebar.

2. Review the changes you made to the files.

3. Enter a commit message summarizing your changes in the input field at the top of the Source Control view.

4. Click on "Commit" to commit the changes.

5. Click on "Sync" to push your changes to the remote repository.

   Note: Make sure you have the necessary permissions to push changes to the repository.

## Core Application Flow

1. User registers for a new account or logs in using existing credentials.
2. Upon successful login, a **JWT token** is generated by the backend and stored securely in `localStorage`.
3. The user navigates to the inventory page and equips a character.
4. The equipped character’s element determines the type of minigame that will be played.
5. The user selects a wellness challenge from the challenge list.
6. Before the challenge can be completed, the user must play an **element-based minigame**.
7. The backend validates whether the user can attempt the minigame (HP availability and cooldown checks).
8. If the minigame is won:
   - The completion form is unlocked.
   - The user submits details describing how the wellness challenge was completed.
9. Upon successful submission:
   - Mora (points) are awarded to the user.
   - Experience points (XP) are added to the equipped character.
   - Character level is updated if XP thresholds are reached.
10. The completed challenge enters a cooldown period before it can be attempted again.
11. When user's earn enough Mora(points) they can go to shop purchase items and characters
---

## Shop Features

The Shop system allows users to spend **Mora (points)** earned from completing wellness challenges to purchase items that enhance gameplay. All purchases are validated by the backend to prevent client-side manipulation.

---

### Available Item Categories

The shop is divided into multiple item categories:

#### Weapons
- Weapons provide stat boosts to characters.
- Equipped weapons can increase damage efficiency or reduce penalties during gameplay.
- Each character can equip only one weapon at a time.

#### Artifacts
- Artifacts provide passive bonuses such as increased HP or XP gain.
- Equipped artifacts affect character performance during minigames.
- Each character can equip only one artifact at a time.

#### Characters
- Characters can be purchased directly from the shop.
- Each character has an elemental attribute that determines the type of minigame played.
- Users can only equip one character at a time.

#### Food (Consumables)
- Food items are consumables that restore character HP.
- Food items are removed from inventory after use.
- Food can only be used when the user owns the item.

---

### Purchase Flow

1. User navigates to the shop page.
2. The shop displays all available items fetched from the backend.
3. User selects an item to purchase.
4. Backend validates:
   - Item existence
   - User authentication
   - Sufficient Mora balance
5. On successful purchase:
   - Mora is deducted from the user’s account.
   - The purchased item is added to the user’s inventory.
6. The frontend updates the UI to reflect the new Mora balance and inventory changes.

---

### Backend Validation

The backend enforces all purchase rules:
- Prevents purchases if Mora is insufficient.
- Prevents purchasing non-existent items.
- Ensures inventory ownership is correctly recorded.
- Returns appropriate HTTP status codes for success or failure.

---

### Integration with Inventory System

- Purchased items are automatically added to the user’s inventory.
- Weapons and artifacts can be equipped from the inventory page.
- Food items can be consumed to restore HP.
- Inventory state is always synced with backend data.

---

### Design Goals

The Shop system is designed to:
- Encourage repeated engagement through rewards.
- Provide meaningful gameplay progression.
- Integrate seamlessly with characters, inventory, and challenges.
- Maintain fairness through backend-controlled validation.


## Minigame System

Each character is associated with a specific elemental attribute, and each element triggers a unique minigame. These minigames are designed to test different player skills and encourage engagement.

**Element-Based Minigames:**
- **Pyro** – Memory and reaction-based challenge.
- **Hydro** – Click speed and accuracy challenge.
- **Anemo** – Directional input and reflex challenge.
- **Electro** – Reaction timing challenge.
- **Dendro** – Growth balance and decision-making challenge.
- **Cryo** – Timed breaking challenge.
- **Geo** – Logic and sequence-based puzzle.

Minigame outcomes directly affect gameplay:
- Winning a minigame allows the user to proceed with challenge completion.
- Failing a minigame results in higher HP loss and prevents challenge completion.
- Character HP is reduced regardless of outcome, with failure causing greater HP loss.
- Characters with 0 HP are unable to attempt new challenges.

---

## Cooldown System

- Cooldowns are enforced **per challenge**, not globally.
- The backend calculates and enforces cooldown durations and remaining time.
- If a challenge is on cooldown, the backend returns a `429` status code.
- The frontend displays remaining cooldown time for user clarity.
- Default cooldown duration is **30 minutes** per challenge.

This system prevents repeated challenge farming and encourages balanced gameplay.

---

## Security Features

- User passwords are securely hashed using **bcrypt** before being stored in the database.
- **JWT authentication** is used to protect secured routes.
- JWT tokens are validated on every protected request.
- Role-based access control differentiates **admin** and **regular users**.
- The backend performs validation for all critical actions, including:
  - Authentication checks
  - Ownership validation
  - Cooldown enforcement
  - Minigame completion verification

All sensitive logic is handled on the backend to ensure system integrity and prevent client-side manipulation.


## API Endpoints Test Cases (CA2)

All endpoints are prefixed with `/api` and are handled by Express.js routes.  
Protected routes require a valid JWT token unless stated otherwise.

---

### User Endpoints

#### POST /users/register
- Creates a new user account.
- Returns 201 status code on success.
- Returns 400 if username, email, or password is missing.
- Returns 409 if username or email already exists.

#### POST /users/login
- Authenticates user credentials.
- Returns 200 status code with JWT token.
- Returns 401 if credentials are invalid.

#### GET /users/me
- Returns details of the currently authenticated user.
- Requires JWT authentication.
- Returns 401 if token is missing or invalid.

#### GET /users
- Returns a list of all users.
- Requires admin role.
- Returns 403 if user is not an admin.

#### GET /users/:user_id
- Returns user details for a specific user ID.
- Requires admin role.
- Returns 404 if user not found.

---

### Character Endpoints

#### POST /characters
- Creates a new character for the authenticated user.
- Returns 201 status code on success.
- Returns 400 if character name or element is missing.
- Returns 403 if user already owns a character.

#### GET /characters
- Returns all characters belonging to the authenticated user.
- Requires JWT authentication.

#### GET /characters/equipped
- Returns the currently equipped character.
- Returns 200 with character data.
- Returns 404 if no character is equipped.

#### PUT /characters/:user_character_id/equip
- Equips the specified character.
- Returns 200 on success.
- Returns 403 if character does not belong to user.

---

### Inventory Endpoints

#### GET /inventory
- Returns all inventory items owned by the user.
- Requires JWT authentication.

#### PUT /inventory/weapon/:inventory_id/equip
- Equips a weapon item.
- Returns 200 on success.
- Returns 400 if item is not a weapon.
- Returns 403 if item does not belong to user.

#### PUT /inventory/artifact/:inventory_id/equip
- Equips an artifact item.
- Returns 200 on success.
- Returns 400 if item is not an artifact.
- Returns 403 if item does not belong to user.

#### POST /inventory/food/:inventory_id/use
- Uses a food item to restore character HP.
- Returns 200 on success.
- Returns 400 if item is not consumable.

---

### Shop Endpoints

#### GET /shop/items/all
- Returns all available shop items.
- Returns 200 status code.

#### POST /shop/weapons/:item_id/purchase
- Purchases a weapon using Mora.
- Returns 200 on success.
- Returns 400 if insufficient Mora.
- Returns 404 if item not found.

#### POST /shop/artifacts/:item_id/purchase
- Purchases an artifact using Mora.
- Returns 200 on success.
- Returns 400 if insufficient Mora.
- Returns 404 if item not found.

#### POST /shop/characters/:item_id/purchase
- Purchases a character using Mora.
- Returns 200 on success.
- Returns 400 if insufficient Mora.
- Returns 404 if item not found.

#### POST /shop/food/:item_id/purchase
- Purchases a food item using Mora.
- Returns 200 on success.
- Returns 400 if insufficient Mora.
- Returns 404 if item not found.

---

### Challenge Endpoints

#### GET /challenges
- Returns all wellness challenges.
- Returns 200 status code.

#### POST /challenges
- Creates a new challenge.
- Requires JWT authentication.
- Returns 201 on success.
- Returns 400 if description or points are missing.

#### DELETE /challenges/:challenge_id
- Deletes a challenge created by the user.
- Returns 200 on success.
- Returns 403 if user is not the creator.
- Returns 404 if challenge not found.

---

### Minigame Endpoints

#### GET /minigame/challenge/:challenge_id/can-attempt
- Checks whether the user can attempt the minigame.
- Validates character HP and cooldown.
- Returns 200 if attempt is allowed.
- Returns 429 if challenge is on cooldown.

#### POST /minigame/challenge/:challenge_id/attempt
- Records a minigame attempt.
- Deducts character HP.
- Returns 200 on success.
- Returns 400 if attempt is invalid.

---

### Completion Endpoints

#### POST /completions/challenge/:challenge_id
- Submits completion details for a challenge.
- Requires a successful minigame attempt.
- Awards Mora and XP.
- Returns 201 on success.
- Returns 400 if completion details are missing.
- Returns 429 if challenge is on cooldown.

---

## Additional Information

- All validation and business logic is enforced by the backend.
- Cooldowns, HP, XP, and rewards are calculated server-side.
- The application uses MySQL with the `mysql2` package.
- Database access is handled via the `pool` object in `src/services/db.js`.
- JWT middleware protects authenticated routes.
