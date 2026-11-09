const express = require("express");
const router = express.Router();

const characterController = require("../controllers/characterController");
const jwtMiddleware = require("../middlewares/jwtMiddleware");

router.use(jwtMiddleware.verifyToken);

router.get("/", characterController.getUserCharacters);
router.get("/equipped", characterController.getEquippedCharacter);
router.put("/:user_character_id/equip", characterController.equipCharacter);

module.exports = router;
