// REMEMBER: Our requests are coming in as json data and we are sending responses with json data
const {
    validationResult
} = require("express-validator/check");

const {
    catchSyncError,
    catchAsyncError
} = require("../util/error");
const {
    clearImage
} = require("../util/helpers");

const Post = require("../models/post");
const User = require("../models/user");

exports.getPosts = (req, res, next) => {
    // Defaults to 1 if there is no value sent
    const currentPage = req.query.page || 1;
    const perPage = 2;
    let totalItems;
    Post.find()
        .countDocuments()
        .then(count => {
            totalItems = count;
            return Post.find()
                // if page one then skip no items, if page two then skip two items,
                // if page three then skip four items, and so on
                .skip((currentPage - 1) * perPage)
                // take only the number of items that was asked to retrieve per page
                .limit(perPage);
        })
        .then(posts => {
            res.status(200).json({
                message: "Fetched posts successfully.",
                posts: posts,
                totalItems: totalItems
            });
        })
        .catch(catchAsyncError(next));
};

exports.postPost = async (req, res, next) => {
    try {
        // Check for validation errors in the incoming request
        const errors = validationResult(req);

        // If there was any validation errors then throw an error back to the client
        if (!errors.isEmpty()) {
            const error = catchSyncError("Validation failed. Entered data is incorrect.", 422, errors.array());
            throw error;
        }

        // Multer adds the image contents to the request under .file and if there is nothing in
        // file then we need to throw an error.
        if (!req.file) {
            const error = catchSyncError("No image provided.", 422, errors.array());
            throw error;
        }

        // Get the data out of the request
        const title = req.body.title;
        const content = req.body.content;
        const imageUrl = req.file.path.replace("\\", "/");

        const post = new Post({
            // We don't need _id or createdAt because mongoose created both for me with the 
            // timestamps option that was set and the _id is done by default when created
            title: title,
            imageUrl: imageUrl,
            creator: req.userId,
            content: content
        });

        await post.save();
        // After we successfully save the post, we need to tie that post to the currently
        // logged in user. To do that we first get the user by the userId
        const user = await User.findById(req.userId);
        // Then in the user model, we have a reference to posts, and so we save that post
        // that the currently logged in user created.
        user.posts.push(post);

        // Save the user because we just added a post to that user
        await user.save();
        // 201 tells the client - success and that a resource was created
        res.status(201).json({
            message: "Post created successfully!",
            // The post object should be the result because that should be my created post
            post: post,
            // Sending the creator information back to the client 
            creator: {
                _id: user._id,
                name: user.name
            }
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getPost = async (req, res, next) => {
    const postId = req.params.postId;

    try {
        const post = await Post.findById(postId);
        if (!post) {
            const error = catchSyncError("Could not find post.", 404, errors.array());
            throw error;
        }

        res.status(200).json({
            message: "Post fetched.",
            post: post
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.putPost = (req, res, next) => {
    const postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const error = new Error("Validation failed. Entered data is incorrect.");
        error.statusCode = 422;
        throw error;
    }

    // This could be part of the incoming request, and it's just some text in the request body.
    // This would be the case if there was no new file picked on the front end. So this come 
    // from the request body.
    let imageUrl = req.body.image;

    // If there is imageUrl in the request body and there is data in the req.file (which gets 
    // populated by multer) then we need to set the imageUrl to the path of the image.
    if (req.file) {
        // This is the object that multer populates and in the object is the path that we need
        console.log(req.file);
        imageUrl = req.file.path.replace("\\", "/");
    }

    if (!imageUrl) {
        const error = catchSyncError("No file picked.", 422, errors.array());
        throw error;
    }

    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = catchSyncError("Could not find post.", 404, errors.array());
                throw error;
            }

            if (post.creator.toString() !== req.userId) {
                const error = catchSyncError("Not authenticated.", 403, null);
                throw error;
            }

            // If there was a new image uploaded on the frontend
            if (imageUrl !== post.imageUrl) {
                // We need to delete the old image before adding the new image
                // to clean up our server images
                clearImage(post.imageUrl);
            }

            post.title = title;
            post.imageUrl = imageUrl;
            post.content = content;
            return post.save();
        })
        .then(result => {
            return res.status(200).json({
                message: "Post updated!",
                post: result
            });
        })
        .catch(catchAsyncError(next));
};

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = catchSyncError("Could not find post.", 404, errors.array());
                throw error;
            }

            if (post.creator.toString() !== req.userId) {
                const error = catchSyncError("Not authenticated.", 403, null);
                throw error;
            }

            clearImage(post.imageUrl);
            return Post.findByIdAndRemove(postId);
        })
        .then(result => {
            return User.findById(req.userId);
        })
        .then(user => {
            // Pass the ID of the post that I want to remove upon deletion of a user
            user.posts.pull(postId);
            return user.save();
        })
        .then(result => {
            return res.status(200).json({
                message: "Deleted Post."
            });
        })
        .catch(catchAsyncError(next));
};