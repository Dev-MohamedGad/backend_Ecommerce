import mongoose, { Schema, model } from "mongoose";


const productSchema = new Schema({
    /** String */
    title: { type: String, required: true, trim: true },
    desc: String,
   

    /** Number */
    basePrice: { type: Number, required: true },
    stock: { type: Number, required: true, min: 1 },

}, { timestamps: true });


export default mongoose.models.Product || model('Product', productSchema)

