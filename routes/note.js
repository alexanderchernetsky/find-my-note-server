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
const logger = require("../logging");
const logTypes = require("../logging/logTypes");

// This section will help you GET a list of all the notes.
noteRoutes.route("/notes").get(authorization, async (req, res) => {
    const db_connect = dbo.getDb("find_my_note_db");

    const user_id = req.query.user_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const searchString = req.query.search;
    const tag = req.query.tag;

    const startPage = (page - 1) * limit;

    if (!user_id) {
        logger.log(logTypes.ERROR, 'Failed to fetch notes. Field user_id is required!');
        res.status(400).json({message: 'Field user_id is required to fetch notes!'});
        return;
    }

    let dbQuery = {"user_id": user_id};

    if (searchString) {
        dbQuery = { $and: [{$text: { $search: searchString }}, {"user_id": user_id}] }
    }

    if (tag) {
        dbQuery = { $and: [{tags: `#${tag}`}, {"user_id": user_id}] }
    }

    const response = {
        notes: [],
        totalNotes: 0,
        totalPages: 0,
        currentPage: page,
        perPage: limit
    };

    let sortOrder = -1; // desc

    if (req.query.sortBy === 'date' && req.query.sortOrder === 'asc') {
        sortOrder = 1;
    }

    const totalNotes = await db_connect
        .collection("notes")
        .find(dbQuery)
        .count();

    response.totalNotes = totalNotes;
    response.totalPages = Math.ceil(totalNotes / limit);

    db_connect
        .collection("notes")
        .find(dbQuery)
        .sort({"last_updated": sortOrder})
        .skip(startPage)
        .limit(limit)
        .toArray((err, result) => {
            if (err) {
                logger.log(logTypes.ERROR, `Failed to get notes from the DB: ${err}`);
                throw err;
            }
            response.notes = result;
            logger.log(logTypes.INFO, `GET /notes response: ${JSON.stringify(response)}`);
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
        logger.log(logTypes.ERROR, `Failed to increment the counter: ${error}`);
    }
}

// This section will help you CREATE a new note.
noteRoutes.route("/note").post(authorization, async (req, response) => {
    const db_connect = dbo.getDb();

    const user_id = req.body.user_id;
    const noteHeading = req.body.heading;
    const noteText = req.body.text;
    const tags = req.body.tags;

    if (!user_id || !noteHeading || !noteText || !tags.length) {
        logger.log(logTypes.ERROR, `Failed attempt to create a new note. Fields user_id, heading, text, tags - are required to create a new note!`);
        response.status(400).json({message: 'Fields user_id, heading, text, tags - are required to create a new note'});
        return;
    }

    const nextCount = await getNextCount(user_id);

    if (!nextCount) {
        logger.log(logTypes.ERROR, `Error! Failed to increment counter. No nextCount!`);
        response.status(500).json({message: 'Error! Failed to increment counter. No nextCount!'});
    }

    const time = moment.utc().format();

    let newNote = {
        note_id: nextCount,
        user_id: user_id,
        date_created: time,
        last_updated: time,
        heading: noteHeading,
        text: noteText,
        tags: tags,
    };

    db_connect
        .collection("notes")
        .insertOne(newNote, (err, res) => {
            if (err) {
                logger.log(logTypes.ERROR, `Error! Failed to insert a new note into DB: ${err}`);
                throw err;
            }
            logger.log(logTypes.INFO, `POST /note response: ${JSON.stringify(newNote)}`);
            response.json(newNote);
    });
});


// This section will help you UPDATE a note by id.
noteRoutes.route("/note/:id").patch(authorization, (req, response) => {
    const db_connect = dbo.getDb();

    const user_id = req.body.user_id;
    const noteHeading = req.body.heading;
    const noteText = req.body.text;
    const tags = req.body.tags;

    if (!noteHeading || !noteText || !tags.length || !user_id) {
        logger.log(logTypes.ERROR, `Failed attempt to update a note. Fields user_id, heading, text, tags - are required to update a note!`);
        response.status(400).json({message: 'Fields user_id, heading, text, tags are required to update an existing note!'});
        return;
    }

    const time = moment.utc().format();

    const findQuery = { $and: [{"note_id": parseInt(req.params.id)}, {"user_id": user_id}] };

    const newValues = {
        heading: noteHeading,
        text: noteText,
        tags: tags,
        last_updated: time
    };

    let setValuesQuery = {
        $set: newValues,
    };

    db_connect
        .collection("notes")
        .updateOne(findQuery, setValuesQuery, (err, res) => {
            if (err) {
                logger.log(logTypes.ERROR, `Failed attempt to update a note in DB: ${err}`);
                throw err;
            }
            if (res.acknowledged && res.matchedCount && res.modifiedCount) {
                logger.log(logTypes.INFO, `PATCH /note response: ${JSON.stringify(newValues)}`);
                response.json({values: newValues});
            } else {
                logger.log(logTypes.ERROR, `PATCH /note failed, ${res}`);
                response.status(204).json({message: "Nothing has been modified!"});
            }
        });
});


// This section will help you DELETE a note
noteRoutes.route("/note/:id").delete(authorization, (req, response) => {
    const db_connect = dbo.getDb();

    const id = parseInt(req.params.id)
    const user_id = req.query.user_id;

    if (!user_id) {
        logger.log(logTypes.ERROR, 'Failed to delete a note. Field user_id is required!');
        response.status(400).json({message: 'Field user_id is required to delete notes!'});
        return;
    }

    const findQuery = { $and: [{"note_id": id}, {"user_id": user_id}] };

    db_connect
        .collection("notes")
        .deleteOne(findQuery, (err, res) => {
            if (err) {
                logger.log(logTypes.ERROR, `Failed attempt to DELETE a note in DB: ${err}`);
                throw err;
            }

            if (!res.deletedCount) {
                logger.log(logTypes.ERROR, `Failed attempt to delete a note with ID ${id}. Nothing has been deleted!`);
                // If you DELETE something that doesn't exist, you should just return a 204 (even if the resource never existed).
                // The client wanted the resource gone and it is gone.
                // Returning a 404 is exposing internal processing that is unimportant to the client and will result in an unnecessary error condition.
                response.sendStatus(204);
            } else {
                logger.log(logTypes.INFO, `Document note_id ${req.params.id} has been deleted! Response: ${JSON.stringify(res)}`);
                response.json({message: `Document note_id ${req.params.id} has been deleted!`});
            }
    });
});

module.exports = noteRoutes;
