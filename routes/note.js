const express = require("express");

// noteRoutes is an instance of the express router.
// We use it to define our routes.
// The router will be added as a middleware and will take control of requests starting with path /record.
const noteRoutes = express.Router();

// This will help us connect to the database
const dbo = require("../db/connection");

// This help convert the id from string to ObjectId for the _id.
const ObjectId = require("mongodb").ObjectId;

// todo: add search by words & tags
// This section will help you GET a list of all the notes.
noteRoutes.route("/notes").get( (req, res) => {
    let db_connect = dbo.getDb("find_my_note_db");

    db_connect
        .collection("notes")
        .find({})
        .toArray((err, result) => {
            if (err) {
                throw err;
            }
            console.log("GET /notes result:", result);
            res.json(result);
        });
});

// This section will help you CREATE a new note.
noteRoutes.route("/note").post( (req, response) => {
    let db_connect = dbo.getDb();

    // todo: add note_id, user_id, date_created, last_updated
    let newNote = {
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
            console.log("POST /note result:", newNote);
            response.json(res);
    });
});

// This section will help you UPDATE a note by id.
noteRoutes.route("/note/:id").patch( (req, response) => {
    let db_connect = dbo.getDb();

    let myQuery = { id: req.params.id };

    // todo: add note_id, user_id, date_created, last_updated
    let newValues = {
        $set: {
            heading: req.body.heading,
            text: req.body.text,
            tags: req.body.tags,
        },
    };

    db_connect
        .collection("notes")
        .updateOne(myQuery, newValues, (err, res) => {
            if (err) {
                throw err;
            }
            console.log("PATCH /note result:", newValues);
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
