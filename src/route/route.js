const express = require('express');
const router = express.Router();
const UserController = require("../controller/userController");
const ProductController = require("../controller/productController");
const mw = require("../middleware/auth");



router.post("/register", UserController.createUser);

router.post("/login", UserController.login);

router.get("/user/:userId/profile", mw.authentication, mw.authorisation, UserController.getUser);

router.put('/user/:userId/profile', mw.authentication, mw.authorisation, UserController.updateUser);

router.post('/products', ProductController.createProduct);

router.get("/products/:productId", ProductController.getProductsById);

router.post("/products/:productId", ProductController.updateProduct);

router.delete("/products/:productId", ProductController.deleteProduct);

// router.put("/books/:bookId", mw.authentication, mw.authorisation, BookController.updateBooks);

// router.delete("/books/:bookId", mw.authentication, mw.authorisation, BookController.deleteBooks);

// router.post("/books/:bookId/review", ReviewController.createReview);

// router.put("/books/:bookId/review/:reviewId", ReviewController.updateReview);

// router.delete("/books/:bookId/review/:reviewId", ReviewController.deleteReview);



module.exports = router;