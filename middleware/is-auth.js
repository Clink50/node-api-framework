const jwt = require("jsonwebtoken");

const { catchSyncError } = require("../util/error");

module.exports = (req, res, next) => {
    // get() is able to access the headers sent from the client    
    const authHeader = req.get("Authorization");

    // Check and make sure that the client sent the Authorization header to us
    // If not they are definitely not authenticated, so send back an error.
    if(!authHeader) {
        const error = catchSyncError("Not authenticated.", 401, null);
        throw error;
    }
    
    // Then we need to split on the space because the header looks like:
    // "Authorization": "Bearer this-is-my-generated-token"
    const token = authHeader.split(" ")[1];
    let decodedToken;
    
    try {
        // Decodes and checks if it's a valid token
        decodedToken = jwt.verify(token, "private-key-secret-should-be-stored-somewhere-on-server");
    } 
    catch (err) {
        err.statusCode = 500;
        throw err;
    }

    // Check if it's undefined in case it doesn't fail but was also unable to verify the token meaning that 
    // the decodedToken here would be undefined.
    if(!decodedToken) {
        const error = catchSyncError("Not authenticated.", 401, null);
        throw error;
    }

    // We have a valid token
    // We take the userId out of the token (we stored it in the token when we sent the created token over to the client)
    // because we will use it when later authenticating the user for other methods
    req.userId = decodedToken.userId;
    next();
};