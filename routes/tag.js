const express = require("express");

const tagRoutes = express.Router();

const logger = require("../logging");
const logTypes = require("../logging/logTypes");
const {tagSchema} = require("../validation/validator");
const validateResourceMW = require("../validation/middleware");
const getServiceInstance = require("../db/service");

// This API route will help you GET a list of all the unique tags.
tagRoutes.route("/tags").get(validateResourceMW(tagSchema, true),(request, response) => {
    const userId = request.query.user_id;

    getServiceInstance().getTags(userId)
        .then((data) => {
            logger.log(logTypes.INFO, `GET /tags response ${data}`);
            response.json(data);
        })
        .catch(error => {
            logger.log(logTypes.ERROR, `Error! Failed to get tags from the DB. ${error}`);
        });
});

module.exports = tagRoutes;
