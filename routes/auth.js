const express = require("express");

const authController = require("../controllers/auth");
const validate = require("../util/validations");

const router = express.Router();

// PUT /auth/signup
router.put("/signup", validate.signUpForm, authController.putSignup);

// POST /auth/login
router.post("/login", authController.postLogin);

module.exports = router;