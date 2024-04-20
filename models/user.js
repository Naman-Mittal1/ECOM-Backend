import mongoose from "mongoose";

const ProductSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: String,
    role: { type: Number, default: 0 },
    token: String,
  },
  { timestamps: true }
);

const User = mongoose.model("User", ProductSchema);

export default User;
