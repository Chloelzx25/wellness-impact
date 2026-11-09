const express = require('express');
const router = express.Router();

const minigameController = require('../controllers/minigameController');
const jwtMiddleware = require('../middlewares/jwtMiddleware');

router.use(jwtMiddleware.verifyToken);

router.get('/challenge/:challenge_id/can-attempt', minigameController.checkCanAttempt);
router.post('/challenge/:challenge_id/attempt', minigameController.attemptMinigame);

module.exports = router;
