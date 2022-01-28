const jwt = require("jsonwebtoken");

const TOKEN_EXPIRED_ERROR_NAME = 'TokenExpiredError';


const authorization = (req, res, next) => {
    const token = req.cookies.access_token;

    if (!token) {
        return res.sendStatus(403);
    }
    try {
        const data = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = data.login;
        return next();
    } catch (err) {
        if (err.name === TOKEN_EXPIRED_ERROR_NAME) {
            return res.redirect("/login")
        }
        return res.sendStatus(403);
    }
};

module.exports = authorization;
