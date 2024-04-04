import Joi from "joi";

export const addReviewSchema = {
  body: Joi.object({
    reviewRate: Joi.number.min(1).max(5).required(),
    reviewCommecnt: Joi.string().min(5).max(255).optional(),
  }),
  query: Joi.object({ productId: generalFields._id.required() }),
};
