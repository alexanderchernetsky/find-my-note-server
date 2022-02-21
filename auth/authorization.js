const jwt = require("jsonwebtoken");

const logTypes = require('../logging/logTypes');
const logger = require("../logging");

const authorization = (req, res, next) => {
    const token = req.cookies.access_token;

    if (!token) {
        logger.log(logTypes.ERROR, "Authorization failed. No authorization token!");
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
        logger.log(logTypes.ERROR, `Authorization error. ${err}`); // e.g. TokenExpiredError
        return res.sendStatus(401);
    }
};

module.exports = authorization;
