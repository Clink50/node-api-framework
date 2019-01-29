const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const postSchema = new Schema({
    title: {
        type: String,
        require: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    // Mongoose will automatically adds a timestamp whenever a new version is added to the database,
    // when a new object is added to the database.
    timestamps: true
});

module.exports = mongoose.model("Post", postSchema);