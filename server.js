const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");

const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");

const app = express();

// fileStorage is an option passed into the multer middleware and just defines where
// the destination should be save for the images on the server and the filename
// that the image should be called.
const fileStorage = multer.diskStorage({
    destination: (req, file, callback) => {
        // pass null for error that occurred and the destination of where to save the images
        callback(null, "images");
    },
    filename: (req, file, callback) => {
        // pass null for error and give it a unique name
        callback(null, new Date().toISOString().replace(/:/g, '-') + "-" + file.originalname);
    }
});

// fileFilter is another option passed to the multer middleware to tell multer that 
// these mimetypes should be accepted, otherwise reject the upload.
const fileFilter = (req, file, callback) => {
    // Types of image format to accept
    if (file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg") {
        // pass null for error and true if accepted
        callback(null, true);
    }
    else {
        // pass null for error and false if rejected
        callback(null, false);
    }
};

// For parsing the incoming json requests
app.use(bodyParser.json()); // application/json in header

// Here we define the middleware for multer and define the storage options and filter 
// options defined above and the set multer to single() which tells multer that there
// will only be single images that will be uploaded and not multiple at a time.
app.use(multer({
    storage: fileStorage,
    fileFilter: fileFilter
}).single("image"));

// For any request coming in as "/images", serve the images folder statically
app.use("/images", express.static(path.join(__dirname, "images")));

// Override CORS Error
app.use((req, res, next) => {
    // Allow any domain to access the app
    res.setHeader("Access-Control-Allow-Origin", "*");
    // Allow the allowed domains to use these http methods
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
    // Allow the allowed domains to pass these headers in the request
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const errors = error.data;
    return res.status(status).json({
        message: message,
        data: errors
    });
});

mongoose.connect(process.env.MONGODB_CONNECTION_STRING, { useNewUrlParser: true })
    .then(result => {
        // Use the environment PORT that is set otherwise fall back to port: 8080
        app.listen(process.env.PORT || 8080);
    })
    .catch(err => console.log(err));