const express = require('express');
const router = express.Router();

const challengeController = require('../controllers/challengeController');
const jwtMiddleware = require('../middlewares/jwtMiddleware');

router.get('/', challengeController.readAllChallenges);
/* router.get('/:challenge_id', challengeController.getChallengeById); */
/* router.put('/:challenge_id', challengeController.updateChallengeById); */

router.post('/', jwtMiddleware.verifyToken, challengeController.createNewChallenge);
router.delete('/:challenge_id', jwtMiddleware.verifyToken, challengeController.deleteChallengeById);

module.exports = router;
