import slugify from "slugify";

import Brand from "../../../DB/Models/brand.model.js";
import subCategory from "../../../DB/Models/sub-category.model.js";
import cloudinaryConnection from "../../utils/cloudinary.js";
import generateUniqueString from "../../utils/generate-Unique-String.js";

//======================= add brand =======================//
export const addBrand = async (req, res, next) => {
  // 1- desturcture the required data from teh request object
  const { name } = req.body;
  const { categoryId, subCategoryId } = req.query;
  const { _id } = req.authUser;
  // category check , subcategory check
  // 2- subcategory check
  const subCategoryCheck = await subCategory
    .findById(subCategoryId)
    .populate("categoryId", "folderId");
  if (!subCategoryCheck)
    return next({ message: "SubCategory not found", cause: 404 });

  // 3- duplicate  brand document check
  const isBrandExists = await Brand.findOne({ name, subCategoryId });
  if (isBrandExists)
    return next({
      message: "Brand already exists for this subCategory",
      cause: 400,
    });

  // 4- categogry check
  if (categoryId != subCategoryCheck.categoryId._id)
    return next({ message: "Category not found", cause: 404 });

  // 5 - generate the slug
  const slug = slugify(name, "-");

  // 6- upload brand logo
  if (!req.file)
    return next({ message: "Please upload the brand logo", cause: 400 });

  const folderId = generateUniqueString(4);
  const { secure_url, public_id } =
    await cloudinaryConnection().uploader.upload(req.file.path, {
      folder: `${process.env.MAIN_FOLDER}/Categories/${subCategoryCheck.categoryId.folderId}/SubCategories/${subCategoryCheck.folderId}/Brands/${folderId}`,
    });

  const brandObject = {
    name,
    slug,
    Image: { secure_url, public_id },
    folderId,
    addedBy: _id,
    subCategoryId,
    categoryId,
  };

  const newBrand = await Brand.create(brandObject);

  res.status(201).json({
    status: "success",
    message: "Brand added successfully",
    data: newBrand,
  });
};

//======================= Update brand =======================//
export const updateBrand = async (req, res) => {
  const updatedBrand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.status(200).json(updatedBrand);
};

// ==================== del brand

export const deleteBrand = async (req, res) => {
   
      await Brand.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: 'Brand deleted successfully' });
    
  };


  // Get all brands for a specific subcategory
export const getBrandsForSubcategory = async (req, res) => {
  
      const brands = await Brand.find({ subCategoryId: req.params.subCategoryId });
      res.status(200).json(brands);
   
  };

  // Get all brands for a category
export const getBrandsForCategory = async (req, res) => {

      const brands = await Brand.find({ categoryId: req.params.categoryId });
      res.status(200).json(brands);
   
  };