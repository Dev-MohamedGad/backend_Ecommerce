import { Schema, model } from "mongoose";

const reviewSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    reviewRate: {
      type: Number,
      default: 0,
      min: 1,
      max: 5,
      enum: [, 2, 3, 4, 5],
    },
    reviewComment: { String },
  },

  { timestamps: true }
);

export const reviewModel = model("review", reviewSchema);
