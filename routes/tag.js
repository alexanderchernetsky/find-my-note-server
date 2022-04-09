const express = require("express");

const tagRoutes = express.Router();

const dbo = require("../db/connection");
const logger = require("../logging");
const logTypes = require("../logging/logTypes");
const {tagSchema} = require("../validation/validator");
const validateResourceMW = require("../validation/middleware");

// This API route will help you GET a list of all the unique tags.
tagRoutes.route("/tags").get(validateResourceMW(tagSchema, true),(request, response) => {
    const dbConnect = dbo.getDb("find_my_note_db");

    const userId = request.query.user_id;

    let dbQuery = {"user_id": userId};

    dbConnect
        .collection("notes")
        .distinct("tags", dbQuery, (error, result) => {
            if (error) {
                logger.log(logTypes.ERROR, `Error! Failed to get tags from the DB. ${error}`);
                throw error;
            }
            logger.log(logTypes.INFO, `GET /tags response ${result}`);
            response.json(result);
        });
});

module.exports = tagRoutes;
