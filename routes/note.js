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

    const user_id = req.query.user_id;

    if (!user_id) {
        console.error('Failed attempt to fetch notes', req.body);
        res.status(400).json({message: 'Field user_id is required to fetch notes!'});
        return;
    }

    let dbQuery = {"user_id": user_id};

    const searchString = req.query.search;
    const tag = req.query.tag;

    if (searchString) {
        dbQuery = { $and: [{$text: { $search: searchString }}, {"user_id": user_id}] }
    }
    if (tag) {
        dbQuery = { $and: [{tags: `#${tag}`}, {"user_id": user_id}] }
    }

    const response = {
        notes: [],
        count: 0
    };

    let sortOrder = -1; // desc

    if (req.query.sortBy === 'date' && req.query.sortOrder === 'asc') {
        sortOrder = 1;
    }

    db_connect
        .collection("notes")
        .find(dbQuery)
        .sort({"last_updated": sortOrder})
        .toArray((err, result) => {
            if (err) {
                throw err;
            }
            console.log("GET /notes result:", result);

            response.notes = result;
            response.count = result.length;

            res.json(response);
        });
});

const getNextCount= async (userId) => {
    const db_connect = dbo.getDb();

    try {
        const resp = await db_connect.collection("note_counter").findOne({_id: userId}).then(async user => {
            if (user) {
                const response = await db_connect.collection("note_counter").findOneAndUpdate(
                    { _id: userId },
                    { $inc: { count: 1 } }
                );

                return response.value.count + 1;
            } else {
                const response = await db_connect.collection("note_counter").insertOne(
                    {
                        _id: userId,
                        count: 1
                    }
                );

                return 1;
            }
        });

        return resp;
    } catch (error) {
        console.error(`Failed to increment the counter: ${error}`);
    }
}

// This section will help you CREATE a new note.
noteRoutes.route("/note").post(authorization, async (req, response) => {
    const db_connect = dbo.getDb();

    const time = moment.utc().format();

    if (!req.body.user_id || !req.body.heading || !req.body.text || !req.body.tags.length) {
        console.error('Failed attempt to create a new note', req.body);
        response.status(400).json({message: 'Fields user_id, heading, text, tags are required to create a new note!'});
        return;
    }

    const nextCount = await getNextCount(req.body.user_id);

    // todo: send an error if no nextCount

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
        console.error('Failed attempt to update a note', req.body);
        response.status(400).json({message: 'Fields user_id, heading, text, tags are required to update an existing note!'});
        return;
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

            if (!res.deletedCount) {
                console.error(`Nothing has been deleted!`);
                // If you DELETE something that doesn't exist, you should just return a 204 (even if the resource never existed).
                // The client wanted the resource gone and it is gone.
                // Returning a 404 is exposing internal processing that is unimportant to the client and will result in an unnecessary error condition.
                response.sendStatus(204);
            } else {
                console.log(`Document note_id ${req.params.id} has been deleted!`, res);
                response.json({message: `Document note_id ${req.params.id} has been deleted!`});
            }
    });
});

module.exports = noteRoutes;
