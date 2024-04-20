import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mongoose, { mongo } from "mongoose";
import Products from "./models/product.js";
import User from "./models/user.js";
import orderModel from "./models/orderModel.js";
import Category from "./models/category.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import braintree from "braintree";
import dotenv from "dotenv";
dotenv.config();
const app = express();

app.use(cookieParser());

const port = process.env.PORT || 3001;
const DATABASE_URL = process.env.DATABASE_URL;

mongoose.connect(DATABASE_URL);
app.use(bodyParser.json());
app.use(cors());

app.get("/products/get", (req, res) => {
  const subCategory = req.query.subCategory;
  console.log(subCategory)

  if (subCategory != undefined) {
    // If subCategory exists in the query, filter by it
    Products.find({ subCategory: subCategory })
      .then((data) => {
        res.status(200).send(data);
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  } else {
    // If subCategory doesn't exist in the query, return all products
    Products.find()
      .then((data) => {
        res.status(200).send(data);
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  }
});

app.get("/userdetails", (req, res) => {
  User.find()
    .then((data) => {
      res.status(200).send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

//get category

app.get("/getcategory", (req, res) => {
  Category.find()
    .then((data) => {
      res.status(200).send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.get("/getallorder", async (req, res) => {
  try {
    const orders = await orderModel
      .find()
      .populate("products")
      .populate("buyer", "name");
    res.json(orders);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .send({ success: false, message: "Error while getting orders" });
  }
});

app.post("/order", async (req, res) => {
  try {
    const { buyer } = req.body;
    const orders = await orderModel
      .find({ buyer: buyer })
      .populate("products")
      .populate("buyer", "name");
    res.json(orders);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .send({ success: false, message: "Error while getting orders" });
  }
});

//update order status

app.put("/order-status/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const order = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    res.json(order);
  } catch (err) {
    console.log(err);
  }
});

//update user password
app.put("/updatepassword/:userId", async (req, res) => {
  try {
    // console.log("updatepassword route hit");
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const { name, email, password, newpassword } = req.body;
    // console.log("newpassword", newpassword);
    const hashedPassword = await bcrypt.hash(newpassword, 10);

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).send("Current password is incorrect");
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        name: name || user.name,
        email: email || user.email,
        password: hashedPassword || user.password,
      },
      { new: true }
    );
    console.log("updatedUser", updatedUser);
    res.status(200).send({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

//add actegory
app.post("/createcategory", async (req, res) => {
  const { name } = req.body;
  try {
    if (!name) {
      return res.status(400).json({ error: "Category name is required" });
    }
    console.log(name);
    const newCategory = new Category(req.body);

    await newCategory.save();

    res.status(200).json({ status: "ok", message: "Category created" });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//add products

app.post("/products/add", (req, res) => {
  const ProductDetails = req.body;
  // console.log(ProductDetails);
  const newproduct = new Products(ProductDetails);
  newproduct.save();
  res.status(200).send("Received");
  console.log("Received data", newproduct);
});

//delete products

app.post("/products/deleteproduct", async (req, res) => {
  const id = req.body;
  console.log(id);
  try {
    if (!id) {
      res.status(400).send({ status: "failed", data: "error deleting" });
    }
    const deletionResult = await Products.deleteOne({ _id: id });

    if (deletionResult.deletedCount === 0) {
      return res
        .status(404)
        .send({ status: "failed", data: "Error: Product not found" });
    }

    res.status(200).send({ data: "Product deleted successfully" });
  } catch (error) {
    console.log(error);
  }
});

// register users

app.post("/register", async (req, res) => {
  try {
    // console.log(req.body);
    const { name, email, password } = req.body;
    if (!(name && email && password)) {
      res.status(400).send("All fields are compulsory");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send({ message: "User already exists" });
    }
    const encrptpassword = await bcrypt.hash(password, 10);
    const newuser = new User({
      name,
      email,
      password: encrptpassword,
    });
    // const token = jwt.sign({ id: newuser._id, email }, "shhhh", {
    //   expiresIn: "2h",
    // });
    // newuser.token = token;
    newuser.save();
    res.status(200).send("User registered successfully");
  } catch (error) {
    console.log(error);
  }
});

//delete users

app.post("/deleteusers", async (req, res) => {
  const id = req.body;
  console.log(id);
  try {
    if (!id) {
      res.status(400).send({ status: "failed", data: "error deleting" });
    }
    const deletionResult = await User.deleteOne({ _id: id });

    if (deletionResult.deletedCount === 0) {
      return res
        .status(404)
        .send({ status: "failed", data: "Error: User not found" });
    }

    res.status(200).send({ data: "User deleted successfully" });
  } catch (error) {
    console.log(error);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!(email && password)) {
      res.status(400).send("All fields are compulsory");
    }
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ id: user._id, email }, "shhhh", {
        expiresIn: "2h",
      });
      user.token = token;
      user.password = undefined;

      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };

      res.status(200).cookie("token", token, options).json({
        success: true,
        token,
        user,
      });
    } else {
      res.status(400).send("Wrong credentials");
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).send("Internal Server Error");
  }
});

//payment gateway

var gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

//token
app.get("/braintree/token", (req, res) => {
  try {
    gateway.clientToken.generate({}, function (err, response) {
      if (err) {
        res.status(500).send(err);
      } else {
        res.send(response);
      }
    });
  } catch (err) {
    console.log(err);
  }
});

// //payment
app.post("/braintree/payment", (req, res) => {
  try {
    const { cart, nonce, buyer, address, area, pincode } = req.body;
    // console.log(cart);
    // console.log(buyer);
    let total = 0;
    cart.map((i) => {
      total += i.price;
    });
    let newTransaction = gateway.transaction.sale(
      {
        amount: total,
        paymentMethodNonce: nonce,
        options: {
          submitForSettlement: true,
        },
      },
      function (error, result) {
        if (result) {
          const order = new orderModel({
            products: cart,
            payment: result,
            buyer: buyer,
            address: address,
            area: area,
            pincode: pincode,
          }).save();
          res.json({ ok: true });
        } else {
          res.status(500).send(error);
        }
      }
    );
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () => {
  console.log("server running on port", { port });
});
