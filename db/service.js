const dbo = require("./connection");
const logger = require("../logging");
const logTypes = require("../logging/logTypes");

class DatabaseService {
    databaseInstance;

    constructor() {
        this.databaseInstance = dbo.getDb("find_my_note_db");
    }

    checkUserEmail(email) {
        return this.databaseInstance.collection("users")
            .findOne({ email: email })
            .then(user => {
                if (!user) {
                    logger.log(logTypes.INFO, "User with such email does not exist!");
                }
                return user;
            })
            .catch(error => {
                logger.log(logTypes.ERROR, `Failed to find user by email in the DB. ${error}`);
                throw error;
            });
    };


    createNewUser(newUser) {
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

    getTotalNotesCount(query) {
        return this.databaseInstance.collection("notes")
            .find(query)
            .count()
            .then(count => count)
            .catch (error => {
                logger.log(logTypes.ERROR, `Error when trying to get total notes count. ${error}`);
                throw error;
            });
    };

    getNotes(query, sortOrder, startPage, limit) {
        return new Promise((resolve) => {
            this.databaseInstance.collection("notes")
                .find(query)
                .sort({"last_updated": sortOrder})
                .skip(startPage)
                .limit(limit)
                .toArray((error, result) => {
                    if (error) {
                        logger.log(logTypes.ERROR, `Failed to get notes from the DB: ${error}`);
                        throw error;
                    }

                    resolve(result);
                });
        });
    };
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
