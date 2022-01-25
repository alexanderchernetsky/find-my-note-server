const express = require("express");
const moment = require("moment");

// noteRoutes is an instance of the express router.
// We use it to define our routes.
// The router will be added as a middleware and will take control of requests starting with path /record.
const noteRoutes = express.Router();

// This will help us connect to the database
const dbo = require("../db/connection");

// This help convert the id from string to ObjectId for the _id.
const ObjectId = require("mongodb").ObjectId;


// This section will help you GET a list of all the notes.
noteRoutes.route("/notes").get( (req, res) => {
    let db_connect = dbo.getDb("find_my_note_db");

    let dbQuery = {};

    const searchString = req.query.search;
    const tag = req.query.tag;

    if (searchString) {
        dbQuery = { $text: { $search: searchString } }
    }
    if (tag) {
        dbQuery = { tags: `#${tag}` }
    }

    db_connect
        .collection("notes")
        .find(dbQuery)
        .toArray((err, result) => {
            if (err) {
                throw err;
            }
            console.log("GET /notes result:", result);
            res.json(result);
        });
});

const getNextCount= async (userId) => {
    let db_connect = dbo.getDb();

    try {
        const response = await db_connect.collection("note_counter").findOneAndUpdate(
            { _id: userId },
            { $inc: { count: 1 } }
        );

        return response.value.count + 1;
    } catch (error) {
        console.error(`Failed to increment the counter: ${error}`);
    }
}

// This section will help you CREATE a new note.
noteRoutes.route("/note").post( async (req, response) => {
    let db_connect = dbo.getDb();

    const time = moment.utc().format();

    // todo: add check if heading, text, tags are included OR status 400

    // todo: remove hardcoded id
    const nextCount = await getNextCount(req.body.user_id || 1);

    let newNote = {
        note_id: nextCount,
        user_id: req.body.user_id,
        date_created: time,
        last_updated: time,
        heading: req.body.heading,
        text: req.body.text,
        tags: req.body.tags,
    };

    db_connect
        .collection("notes")
        .insertOne(newNote, (err, res) => {
            if (err) {
                throw err;
            }
            console.log("POST /note newNote:", newNote);
            res.note = newNote;
            response.json(res);
    });
});

// This section will help you UPDATE a note by id.
noteRoutes.route("/note/:id").patch( (req, response) => {
    let db_connect = dbo.getDb();

    const time = moment.utc().format();

    let myQuery = { id: req.params.id };

    let newValues = {
        $set: {
            heading: req.body.heading,
            text: req.body.text,
            tags: req.body.tags,
            last_updated: time
        },
    };

    db_connect
        .collection("notes")
        .updateOne(myQuery, newValues, (err, res) => {
            if (err) {
                throw err;
            }
            console.log("PATCH /note new values:", newValues);
            response.json(res);
        });
});


// This section will help you DELETE a note
noteRoutes.route("/notes/:id").delete((req, response) => {
    let db_connect = dbo.getDb();

    let myQuery = { id: req.params.id };

    db_connect
        .collection("notes")
        .deleteOne(myQuery, (err, obj) => {
            if (err) {
                throw err;
            }
            console.log("1 document deleted");
            response.status(obj);
    });
});

module.exports = noteRoutes;
