const express = require('express');
const router = express.Router();

const shopController = require('../controllers/shopController');
const jwtMiddleware = require('../middlewares/jwtMiddleware');

router.get('/items/all', jwtMiddleware.verifyToken, shopController.getAllItems);

router.post('/characters/:character_id/purchase', jwtMiddleware.verifyToken, shopController.purchaseCharacter);
router.post('/weapons/:weapon_id/purchase', jwtMiddleware.verifyToken, shopController.purchaseWeapon);
router.post('/artifacts/:artifact_id/purchase', jwtMiddleware.verifyToken, shopController.purchaseArtifact);
router.post('/food/:food_id/purchase', jwtMiddleware.verifyToken, shopController.purchaseFood);

module.exports = router;
