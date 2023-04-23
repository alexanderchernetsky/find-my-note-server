const jwt = require("jsonwebtoken");

const logTypes = require('../logging/logTypes');
const logger = require("../logging");

const authorization = (request, response, next) => {
    const authHeader = request.headers.authorization;
    const token = authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        logger.log(logTypes.ERROR, "Authorization failed. No authorization token!");
        // a 401 Unauthorized response should be used for missing or bad authentication,
        // and a 403 Forbidden response should be used afterwards, when the user is authenticated
        // but isn't authorized to perform the requested operation on the given resource.
        return response.sendStatus(401);
    }
    try {
        const data = jwt.verify(token, process.env.JWT_SECRET);
        request.email = data.email;
        logger.log(logTypes.INFO, `Authorization success. User email: ${data.email}`);
        return next();
    } catch (error) {
        // todo: send some info to the FE when it's TokenExpiredError
        logger.log(logTypes.ERROR, `Authorization error. ${error}`); // e.g. TokenExpiredError
        return response.sendStatus(401);
    }
};

module.exports = authorization;
