const express = require('express');
const router = express.Router();

const userRoutes = require('./userRoutes');
const challengeRoutes = require('./challengeRoutes');
const completionRoutes = require('./completionRoutes');
const shopRoutes = require('./shopRoutes');
const characterRoutes = require('./characterRoutes');
const minigameRoutes = require('./minigameRoutes');
const inventoryRoutes = require('./inventoryRoutes'); 

router.use("/users", userRoutes);
router.use("/challenges", challengeRoutes);
router.use("/completions", completionRoutes);
router.use("/shop", shopRoutes);
router.use("/characters", characterRoutes);
router.use("/minigame", minigameRoutes);
router.use('/inventory', inventoryRoutes); 

module.exports = router;
