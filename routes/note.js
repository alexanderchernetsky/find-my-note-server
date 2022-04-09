const express = require("express");
const moment = require("moment");

// noteRoutes is an instance of the express router.
// We use it to define our routes.
// The router will be added as a middleware and will take control of requests starting with path /note or /notes.
const noteRoutes = express.Router();

const logger = require("../logging");
const logTypes = require("../logging/logTypes");
const {getNotesSchema, noteSchema, deleteNoteSchema} = require("../validation/validator");
const validateResourceMW = require("../validation/middleware");
const getServiceInstance = require("../db/service");

// This section will help you GET a list of all the notes.
noteRoutes.route("/notes").get(validateResourceMW(getNotesSchema, true), async (req, res) => {
    const {user_id: userId, search: searchString, tag, sortBy, sortOrder} = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const totalNotes = await getServiceInstance().getTotalNotesCount(userId, searchString, tag);

    const data = {
        notes: [],
        totalNotes,
        totalPages: Math.ceil(totalNotes / limit),
        currentPage: page,
        perPage: limit
    };

    const notesSortOrder = (sortBy === 'date' && sortOrder === 'asc') ? 1 : -1;
    const startPage = (page - 1) * limit;

    getServiceInstance().getNotes(userId, searchString, tag, notesSortOrder, startPage, limit)
        .then(result => {
            data.notes = result;
            logger.log(logTypes.INFO, `GET /notes response: ${JSON.stringify(data)}`);
            res.json(data);
        })
        .catch(error => {
            logger.log(logTypes.ERROR, `Failed to get notes from the DB: ${error}`);
        });
});

// This section will help you CREATE a new note.
noteRoutes.route("/note").post(validateResourceMW(noteSchema), async (req, response) => {
    const {user_id: userId, heading: noteHeading, text: noteText, tags} = req.body;

    const nextCount = await getServiceInstance().getNextNoteCount(userId);

    if (!nextCount) {
        logger.log(logTypes.ERROR, `Error! No next count!`);
        response.status(500).json({message: 'Error! No next count!'});
    }

    const time = moment.utc().format();

    const newNote = {
        note_id: nextCount,
        user_id: userId,
        date_created: time,
        last_updated: time,
        heading: noteHeading,
        text: noteText,
        tags: tags,
    };

    getServiceInstance().addNewNote(newNote)
        .then(() => {
            logger.log(logTypes.INFO, `POST /note response: ${JSON.stringify(newNote)}`);
            response.json(newNote);
        })
        .catch(error => {
            logger.log(logTypes.ERROR, `Error! Failed to insert a new note into DB: ${error}`);
        })
});


// This section will help you UPDATE a note by id.
noteRoutes.route("/note/:id").patch(validateResourceMW(noteSchema), (request, response) => {
    const {user_id: userId, heading: noteHeading, text: noteText, tags} = request.body;

    const noteId = parseInt(request.params.id);

    const newValues = {
        heading: noteHeading,
        text: noteText,
        tags: tags,
        last_updated: moment.utc().format()
    };

    getServiceInstance().updateExistingNote(noteId, userId, newValues)
        .then((data) => {
            logger.log(logTypes.INFO, `PATCH /note response: ${JSON.stringify(newValues)}`);
            response.json(data);
        })
        .catch(error => {
            logger.log(logTypes.ERROR, `PATCH /note failed, ${JSON.stringify(error)}`);
            response.status(204).json();
        });
});


// This section will help you DELETE a note
noteRoutes.route("/note/:id").delete(validateResourceMW(deleteNoteSchema, true), (request, response) => {
    const userId = request.query.user_id;

    const noteId = parseInt(request.params.id);

    getServiceInstance().deleteNote(noteId, userId)
        .then((data) => {
            logger.log(logTypes.INFO, `Document note_id ${noteId} has been deleted! Response: ${JSON.stringify(data)}`);
            response.json({message: `Document note_id ${noteId} has been deleted!`});
        })
        .catch(() => {
            logger.log(logTypes.ERROR, `Failed attempt to delete a note with ID ${noteId}. Nothing has been deleted!`);
            // If you DELETE something that doesn't exist, you should just return a 204 (even if the resource never existed).
            // The client wanted the resource gone, and it is gone.
            // Returning a 404 is exposing internal processing that is unimportant to the client and will result in an unnecessary error condition.
            response.sendStatus(204);
        });
});

module.exports = noteRoutes;
