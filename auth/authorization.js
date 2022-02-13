const jwt = require("jsonwebtoken");

const authorization = (req, res, next) => {
    const token = req.cookies.access_token;

    if (!token) {
        console.error("No authorization token!");
        // a 401 Unauthorized response should be used for missing or bad authentication,
        // and a 403 Forbidden response should be used afterwards, when the user is authenticated
        // but isn't authorized to perform the requested operation on the given resource.
        return res.sendStatus(401);
    }
    try {
        const data = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = data.login;
        return next();
    } catch (err) {
        console.error("Authorization error", err); // e.g. TokenExpiredError
        return res.sendStatus(401);
    }
};

module.exports = authorization;
