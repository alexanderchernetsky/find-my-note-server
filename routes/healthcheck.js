const express = require("express");

const logger = require("../logging");
const logTypes = require("../logging/logTypes");

const healthcheckRoute = express.Router();

healthcheckRoute.get("/", (request, response) => {
    logger.log(logTypes.INFO, 'Healthcheck route was called!');
    return response
        .status(200)
        .json({ message: "Service is alive!" });
});

module.exports = healthcheckRoute;
