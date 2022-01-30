const express = require("express");
const moment = require("moment");

// noteRoutes is an instance of the express router.
// We use it to define our routes.
// The router will be added as a middleware and will take control of requests starting with path /note or /notes.
const noteRoutes = express.Router();

// This will help us connect to the database
const dbo = require("../db/connection");

// should be added to each api route to check the token
const authorization = require("../auth/authorization");

// This section will help you GET a list of all the notes.
noteRoutes.route("/notes").get(authorization, (req, res) => {
    const db_connect = dbo.getDb("find_my_note_db");

    let dbQuery = {};

    const searchString = req.query.search;
    const tag = req.query.tag;

    if (searchString) {
        dbQuery = { $text: { $search: searchString } }
    }
    if (tag) {
        dbQuery = { tags: `#${tag}` }
    }

    // todo: add results count

    // todo: add notes for user with note.user_id === user_id

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
    const db_connect = dbo.getDb();

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
noteRoutes.route("/note").post(authorization, async (req, response) => {
    const db_connect = dbo.getDb();

    const time = moment.utc().format();

    if (!req.body.heading || !req.body.text || !req.body.tags.length) {
        response.status(400).json({message: 'Fields heading, text, tags are required to create a new note!'});
    }

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
noteRoutes.route("/note/:id").patch(authorization, (req, response) => {
    const db_connect = dbo.getDb();

    if (!req.body.heading || !req.body.text || !req.body.tags.length) {
        response.status(400).json({message: 'Fields heading, text, tags are required to update an existing note!'});
    }

    const time = moment.utc().format();

    const findQuery = { note_id: parseInt(req.params.id) };

    const newValues = {
        heading: req.body.heading,
        text: req.body.text,
        tags: req.body.tags,
        last_updated: time
    };

    let setValuesQuery = {
        $set: newValues,
    };

    db_connect
        .collection("notes")
        .updateOne(findQuery, setValuesQuery, (err, res) => {
            if (err) {
                throw err;
            }
            res.values = newValues;
            console.log("PATCH /note response:", res);
            response.json(res);
        });
});


// This section will help you DELETE a note
noteRoutes.route("/note/:id").delete(authorization, (req, response) => {
    const db_connect = dbo.getDb();

    let findQuery = { note_id: parseInt(req.params.id) };

    db_connect
        .collection("notes")
        .deleteOne(findQuery, (err, res) => {
            if (err) {
                throw err;
            }
            console.log(`Document note_id ${req.params.id} has been deleted`, res);
            response.json(res);
    });
});

module.exports = noteRoutes;
