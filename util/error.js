exports.catchAsyncError = next => err => {
    if(!err.statusCode) {
        err.statusCode = 500;
    }
    return next(err);
};

exports.catchSyncError = (message, code, errors) => {
    const error = new Error(message);
    error.statusCode = code;
    error.data = errors || null;
    return error;
};;