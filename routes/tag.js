const express = require("express");

const authorization = require("../auth/authorization");

const tagRoutes = express.Router();

const dbo = require("../db/connection");

// This API route will help you GET a list of all the unique tags.
tagRoutes.route("/tags").get(authorization, (req, res) => {
    const db_connect = dbo.getDb("find_my_note_db");

    const user_id = req.query.user_id;

    if (!user_id) {
        console.error('Failed attempt to fetch tags', req.body);
        res.status(400).json({message: 'Field user_id is required to fetch tags!'});
        return;
    }

    let dbQuery = {"user_id": user_id};

    db_connect
        .collection("notes")
        .distinct("tags", dbQuery, (err, result) => {
            if (err) {
                throw err;
            }
            console.log("GET /tags result:", result);
            res.json(result);
        })
});

module.exports = tagRoutes;
