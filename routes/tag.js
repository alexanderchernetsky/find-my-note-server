const express = require("express");

const tagRoutes = express.Router();

const dbo = require("../db/connection");

// This API route will help you GET a list of all the unique tags.
tagRoutes.route("/tags").get( (req, res) => {
    const db_connect = dbo.getDb("find_my_note_db");

    db_connect
        .collection("notes")
        .distinct("tags", (err, result) => {
            if (err) {
                throw err;
            }
            console.log("GET /tags result:", result);
            res.json(result);
        })
});

module.exports = tagRoutes;
