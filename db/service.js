const dbo = require("./connection");
const logger = require("../logging");
const logTypes = require("../logging/logTypes");
const getNotesDBQuery = require("./getNotesDBQuery");
const db = require("./connection");

class DatabaseService {
    databaseInstance;

    constructor() {
        this.databaseInstance = dbo.getDb("find_my_note_db");
    }

     async connectToDB() {
         return await db.connectToServerAsync();
    }

    async checkDatabaseConnection() {
        // vercel uses serverless functions, so we need to check if the connection is still alive
        if (!this.databaseInstance) {
            await this.connectToDB();
            this.databaseInstance = dbo.getDb("find_my_note_db");
        }
    }

     async checkUserEmail(email) {
        await this.checkDatabaseConnection();

        return this.databaseInstance.collection("users")
            .findOne({ email: email })
            .then(user => user)
            .catch(error => {
                logger.log(logTypes.ERROR, `Failed to find user by email in the DB. ${error}`);
                throw error;
            });
    };


    async createNewUser(newUser) {
        await this.checkDatabaseConnection();

        return this.databaseInstance.collection("users")
            .insertOne(newUser)
            .then(() => {
                logger.log(logTypes.INFO, `Successfully inserted a new user in the DB.`);
            })
            .catch(error => {
                logger.log(logTypes.ERROR, `Failed to insert a new user in the DB. ${error}`);
                throw error;
            });
    };

    async getTotalNotesCount(userId, searchString, tag) {
        await this.checkDatabaseConnection();

        const query = getNotesDBQuery(userId, searchString, tag);

        return this.databaseInstance.collection("notes")
            .find(query)
            .count()
            .then(count => count)
            .catch (error => {
                logger.log(logTypes.ERROR, `Error when trying to get total notes count. ${error}`);
                throw error;
            });
    };

    async getNotes(userId, searchString, tag, sortOrder, startPage, limit) {
        await this.checkDatabaseConnection();

        const query = getNotesDBQuery(userId, searchString, tag);

        return new Promise((resolve, reject) => {
            this.databaseInstance.collection("notes")
                .find(query)
                .sort({"last_updated": sortOrder})
                .skip(startPage)
                .limit(limit)
                .toArray((error, result) => {
                    if (error) {
                        reject(error);
                    }

                    resolve(result);
                });
        });
    };

    async getNextNoteCount(userId) {
        await this.checkDatabaseConnection();

        return this.databaseInstance.collection("note_counter")
            .findOne({_id: userId})
            .then(user => {
                if (user) {
                    return this.databaseInstance.collection("note_counter").findOneAndUpdate(
                        {_id: userId},
                        {$inc: {count: 1}}
                    ).then(response => {
                        return response.value.count + 1;
                    })
                    .catch(error => {
                        logger.log(logTypes.ERROR, `Failed to increment the counter: ${error}`);
                    });
                } else {
                    return this.databaseInstance.collection("note_counter").insertOne(
                        {
                            _id: userId,
                            count: 1
                        }
                    )
                        .then(() => {
                            return 1;
                        })
                        .catch(error => {
                            logger.log(logTypes.ERROR, `Failed to create a new counter: ${error}`);
                        });
                }
            })
            .catch(error => {
                logger.log(logTypes.ERROR, `Failed to get next note count: ${error}`);
            });
    };

    async addNewNote(newNote) {
        await this.checkDatabaseConnection();

        return this.databaseInstance.collection("notes")
            .insertOne(newNote)
            .then(() => {
                return newNote;
            })
            .catch(error => error);
    };

    async updateExistingNote(noteId, userId, newValues) {
        await this.checkDatabaseConnection();

        const findQuery = { $and: [{"note_id": noteId}, {"user_id": userId}] };
        const setValuesQuery = {
            $set: newValues,
        };

        return new Promise((resolve, reject) => {
            this.databaseInstance.collection("notes")
                .updateOne(findQuery, setValuesQuery, (error, response) => {
                    if (error) {
                        logger.log(logTypes.ERROR, `Failed attempt to update a note in DB: ${error}`);
                        throw error;
                    }
                    if (response.acknowledged && response.matchedCount && response.modifiedCount) {
                        resolve({values: newValues});
                    } else {
                        reject({message: "Nothing has been modified!"});
                    }
                });
        })};

    async deleteNote(noteId, userId) {
        await this.checkDatabaseConnection();

        const findQuery = { $and: [{"note_id": noteId}, {"user_id": userId}] };

        return new Promise((resolve, reject) => {
            this.databaseInstance.collection("notes")
                .deleteOne(findQuery, (error, response) => {
                    if (error) {
                        logger.log(logTypes.ERROR, `Failed attempt to DELETE a note in DB: ${error}`);
                        throw error;
                    }

                    if (response.deletedCount) {
                        resolve(response);
                    } else {
                        reject();
                    }
                });
        });
    };

    async getTags(userId) {
        await this.checkDatabaseConnection();

        const dbQuery = {"user_id": userId};

        return new Promise((resolve, reject) => {
            this.databaseInstance.collection("notes")
                .distinct("tags", dbQuery, (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                });
        });
    }
}

let DBServiceInstance;

function getServiceInstance() {
    if (DBServiceInstance) {
        return DBServiceInstance;
    } else {
        DBServiceInstance = new DatabaseService();
        return DBServiceInstance;
    }
}

module.exports = getServiceInstance;
