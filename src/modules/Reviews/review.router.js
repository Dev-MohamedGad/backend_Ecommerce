 
 import { Router } from "express";

 const router=Router()
 import * as rc from './review.controller.js'
 import expressAsyncHandler from "express-async-handler";

 import { multerMiddleHost } from '../../middlewares/multer.js'
 import { allowedExtensions } from '../../utils/allowed-extensions.js'
 import { endPointsRoles } from './brand.endpoints.js'
 import { auth } from '../../middlewares/auth.middleware.js'
import { validationMiddleware } from "../../middlewares/validation.middleware.js";
import { addReviewSchema } from "./reviews.validationSchema.js";
import { reviewApisRoles } from "./review.endPoints.js";
 
 router.post('/',auth(reviewApisRoles.ADD_REVIEW), validationMiddleware(validator.addReviewSchema),expressAsyncHandler(rc.addReview))
 router.delete('/',auth(reviewApisRoles.ADD_REVIEW),expressAsyncHandler(rc.delReview))