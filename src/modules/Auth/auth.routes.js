
import { Router } from "express";
import * as authController from './auth.controller.js';
import expressAsyncHandler from "express-async-handler";

const router = Router();


router.post('/', expressAsyncHandler(authController.signUp))
router.get('/verify-email', expressAsyncHandler(authController.verifyEmail))


router.post('/login', expressAsyncHandler(authController.signIn))
router.post('/loginWithGmail', expressAsyncHandler(authController.loginWithGmail))
router.post('/signUpWithGmail', expressAsyncHandler(authController.signUpWithGmail))
router.put('/updateUser', expressAsyncHandler(authController.updateUser))
router.delete('/softDeleteUser', expressAsyncHandler(authController.softDeleteUser))
router.get('/getUserProfile', expressAsyncHandler(authController.getUserProfile))
router.put('/updatePassword', expressAsyncHandler(authController.updatePassword))
router.post('/forgetpassword',expressAsyncHandler(authController.forgetPassword))

router.post('/resetpassword/:token',expressAsyncHandler(authController.resetPassword))


export default router;