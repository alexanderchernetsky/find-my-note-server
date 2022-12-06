const express = require("express");

const logger = require("../logging");
const logTypes = require("../logging/logTypes");

const logoutRoute = express.Router();

logoutRoute.get("/logout", (request, response) => {
    logger.log(logTypes.INFO, 'Logged out successfully!');
    return response
        .clearCookie("access_token")
        .status(200)
        .json({ message: "Successfully logged out!" });
});

module.exports = logoutRoute;
