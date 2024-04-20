import mongoose from "mongoose";

const OrderSchema = mongoose.Schema(
  {
    products: [
      {
        type: mongoose.ObjectId,
        ref: "Product",
      },
    ],
    payment: {},
    buyer: {
      type: String,
    },
    address: {
      type: String,
    },
    area: {
      type: String,
    },
    pincode: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", OrderSchema);
