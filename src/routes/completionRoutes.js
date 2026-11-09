const express = require('express');
const router = express.Router();

const completionController = require('../controllers/completionController');
const jwtMiddleware = require('../middlewares/jwtMiddleware');

/* 
router.get('/', completionController.readAllCompletion);
router.get('/:challenge_id', completionController.readCompletionsByChallengeId);
 */

router.post('/challenge/:challenge_id', jwtMiddleware.verifyToken, completionController.createCompletionByChallengeId);
router.get('/my-completions', jwtMiddleware.verifyToken, completionController.getUserCompletions);

module.exports = router;
