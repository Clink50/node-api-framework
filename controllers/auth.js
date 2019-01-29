const {
    validationResult
} = require("express-validator/check");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

const {
    catchSyncError,
    catchAsyncError
} = require("../util/error");

// USING THEN/CATCH BLOCKS 
exports.putSignup = (req, res, next) => {
    // Get the data sent in the request
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;

    // Check for any validation errors using our util/validations.js
    const errors = validationResult(req);

    // If we have errors...
    if (!errors.isEmpty) {
        const error = catchSyncError("Validation failed.", 422, errors.array());
        throw error;
    }

    // Take the password passed in the request, set the salt to a length of 12
    bcrypt.hash(password, 12)
        // Get the hashed password back from bcrypt
        .then(hashedPassword => {
            // Create a new user with the information needed
            const user = new User({
                email: email,
                password: hashedPassword,
                name: name
            });

            // Save the user in the database
            return user.save();
        })
        // We get a result back which is the user that was created
        .then(result => {
            // Send a 200 response code back to the client with a message
            // and the userId
            res.status(201).json({
                message: "User created.",
                userId: result._id
            });
        })
        .catch(catchAsyncError(next));
};

// USING ASYNC/AWAIT CODE
exports.postLogin = async (req, res, next) => {
    try {
        // Get the data sent in the request
        const email = req.body.email;
        const password = req.body.password;

        // Get the user where the email matches
        const user = await User.findOne({
            email: email
        });

        // If we don't get a user then the email didn't match any in the database
        if (!user) {
            const error = catchSyncError("A user with this email could not be found.", 401, null);
            throw error;
        }

        // Check if the hashed password and the password stored on the database for that user matches
        const isMatch = await bcrypt.compare(password, user.password);

        // If it doesn't match, then we have a wrong password
        if (!isMatch) {
            const error = catchAsyncError("Wrong password.", 401, null);
            throw error;
        }

        // Create a new JWT token for authentication
        const token = await jwt.sign({
            // This could be any data that we want to in the token
            email: user.email,
            userId: user._id.toString()
        }, "private-key-secret-should-be-stored-somewhere-on-server", {
            // Token becomes invalid after an hour. This is necessary because the JWT can be stolen since the token
            // is stored on the client side. So a victim could log in and then not log out of the website and leave 
            // the computer and an attacker can get on that computer, store the JWT off the browser and then use it
            // forever. With the expiresIn option, that's not possible.
            expiresIn: "1h"
        });

        res.status(200).json({
            token: token,
            userId: user._id.toString()
        })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

// LEARN MORE ABOUT JWT AND VALIDATING PAYLOADS:
// https://jwt.io/

// LEARN ABOUT REFRESH TOKENS HERE
// https://solidgeargroup.com/refresh-token-with-jwt-authentication-node-js