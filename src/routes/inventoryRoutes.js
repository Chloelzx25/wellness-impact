const express = require('express');
const router = express.Router();

const inventoryController = require('../controllers/inventoryController');
const jwtMiddleware = require('../middlewares/jwtMiddleware');

router.use(jwtMiddleware.verifyToken);


router.get('/me', inventoryController.getMyInventory);
router.put('/weapon/:inventory_id/equip/:character_id', inventoryController.equipWeapon);
router.put('/artifact/:inventory_id/equip/:character_id', inventoryController.equipArtifact);
router.post('/food/:inventory_id/use/:character_id', inventoryController.useFood);
router.put('/:inventory_id/unequip', inventoryController.unequipItem);

module.exports = router;