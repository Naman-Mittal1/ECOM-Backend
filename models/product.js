import mongoose from "mongoose";

const ProductSchema = mongoose.Schema({
  title: String,
  imgURL: String,
  price: Number,
  rating: Number,
  category: {
    type: String,
    required: true,
  },
  subCategory: {
    type: String,
    required: true,
  }
});

const Product = mongoose.model("Product", ProductSchema);

export default Product;
