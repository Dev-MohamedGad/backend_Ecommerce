import slugify from "slugify"

import Brand from "../../../DB/Models/brand.model.js"
import Product from "../../../DB/Models/product.model.js"
import { systemRoles } from "../../utils/system-roles.js"
import cloudinaryConnection from "../../utils/cloudinary.js"
import generateUniqueString from "../../utils/generate-Unique-String.js"
import { APIFeatures } from "../../utils/api-features.js"
import { getIo } from "../../utils/io-generation.js"



//================================= Add product API =================================//
export const addProduct = async (req, res, next) => {
    console.log('I am in the add product api');
    // data from the request body
    const { title, basePrice, stock,  /*discount,specs,desc */ } = req.body

    const product = {
        title,  basePrice, stock
          /*, desc,  discount, appliedPrice,
           specs: JSON.parse(specs), categoryId, subCategoryId,
            brandId, addedBy, Images, folderId*/
    }

    const newProduct = await Product.create(product)
    req.savedDocuments = { model: Product, _id: newProduct._id }

    
    getIo().emit('new-product', newProduct)
    res.status(201).json({ success: true, message: 'Product created successfully', data: newProduct })
}

/**
 * 
 * @param {*} req body: {title, desc, basePrice, discount, stock, specs} 
 * @param {*} req params : {productId}
 * @param {*} req authUser :{_id}
 * @returns the updated product data with status 200 and success message
 * @description update a product in the database
 */

//================================================= Update product API ============================================//
export const updateProduct = async (req, res, next) => {
    // data from the request body
    const { title, desc, specs, stock, basePrice, discount, oldPublicId } = req.body
    // data for condition
    const { productId } = req.params
    // data from the request authUser
    const addedBy = req.authUser._id


    // prodcuct Id  
    const product = await Product.findById(productId)
    if (!product) return next({ cause: 404, message: 'Product not found' })

    // who will be authorized to update a product
    if (
        req.authUser.role !== systemRoles.SUPER_ADMIN &&
        product.addedBy.toString() !== addedBy.toString()
    ) return next({ cause: 403, message: 'You are not authorized to update this product' })

    // title update
    if (title) {
        product.title = title
        product.slug = slugify(title, { lower: true, replacement: '-' })
    }
    if (desc) product.desc = desc
    if (specs) product.specs = JSON.parse(specs)
    if (stock) product.stock = stock

    // prices changes
    const appliedPrice = (basePrice || product.basePrice) * (1 - ((discount || product.discount) / 100))
    product.appliedPrice = appliedPrice

    if (basePrice) product.basePrice = basePrice
    if (discount) product.discount = discount


    if (oldPublicId) {

        if (!req.file) return next({ cause: 400, message: 'Please select new image' })

        const folderPath = product.Images[0].public_id.split(`${product.folderId}/`)[0]
        const newPublicId = oldPublicId.split(`${product.folderId}/`)[1]

        const { secure_url } = await cloudinaryConnection().uploader.upload(req.file.path, {
            folder: folderPath + `${product.folderId}`,
            public_id: newPublicId
        })
        product.Images.map((img) => {
            if (img.public_id === oldPublicId) {
                img.secure_url = secure_url
            }
        })
        req.folder = folderPath + `${product.folderId}`
    }

    await product.save()

    res.status(200).json({ success: true, message: 'Product updated successfully', data: product })
}


//===================================== get all products API ===================================//
export const getAllProducts = async (req, res, next) => {
    console.log('I am in the get all products api');
    const { page, size, sort, ...search } = req.query
    // const features = new APIFeatures(req.query, Product.find())
        // .sort(sort)
        // .pagination({ page, size })
        // .search(search)
        // .filters(search)

    // console.log(features.mongooseQuery);
    // const products = await features.mongooseQuery
    const products = await Product.find().populate([{
        path:'Reviews'
    }])
   
    res.status(200).json({ success: true, data: products })
}