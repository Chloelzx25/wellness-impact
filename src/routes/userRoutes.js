const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const jwtMiddleware = require('../middlewares/jwtMiddleware');
const bcryptMiddleware = require('../middlewares/bcryptMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

router.get('/public', jwtMiddleware.verifyToken, userController.readPublicUsers);
router.get('/me', jwtMiddleware.verifyToken, userController.getCurrentUser);
router.get('/', jwtMiddleware.verifyToken, adminMiddleware.verifyAdmin, userController.readAllUser);
router.get('/:user_id', jwtMiddleware.verifyToken, adminMiddleware.verifyAdmin, userController.readUserById);


/* router.post('/', userController.createNewUser); */
/* router.put('/:user_id', userController.updateUserById); */

router.post('/register',
  bcryptMiddleware.hashPassword,
  userController.register,
  jwtMiddleware.generateToken,
  jwtMiddleware.sendToken
);

router.post('/login',
  userController.login,
  bcryptMiddleware.comparePassword,
  jwtMiddleware.generateToken,
  jwtMiddleware.sendToken
);

module.exports = router;
