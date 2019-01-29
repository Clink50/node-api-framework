const express = require("express");

const feedController = require("../controllers/feed");
const validate = require("../util/validations");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

// GET /feed/posts
router.get("/posts", isAuth, feedController.getPosts);

// POST /feed/post
router.post("/post", isAuth, validate.createPost, feedController.postPost);

// GET /feed/post/postId
router.get("/post/:postId", isAuth, feedController.getPost);

// PUT /feed/post/postId
router.put("/post/:postId", isAuth, validate.updatePost, feedController.putPost);

// DELETE /feed/post/postId
router.delete("/post/:postId", isAuth, feedController.deletePost);

module.exports = router;