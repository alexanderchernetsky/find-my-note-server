const { MongoClient } = require("mongodb");

const logger = require("../logging");
const logTypes = require("../logging/logTypes");

const uri = process.env.MONGO_DB_CONNECTION_STR;

const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

let _db;

module.exports = {
    connectToServerAsync: () => {
        logger.log(logTypes.INFO, "Connecting to the DB... (connectToServerAsync function)");
        return client
            .connect()
            .then((db) => {
                if (db) {
                    _db = db.db("find_my_note_db");
                    logger.log(logTypes.INFO, "Successfully connected to MongoDB.");
                }
            })
            .catch((error) => {
                logger.log(logTypes.ERROR, `Error when connecting to the db: ${error}`);
            });
    },

    connectToServer: (callback) => {
        logger.log(logTypes.INFO, "Connecting to the DB...");
        client.connect( (err, db) => {
            // Verify we got a good "db" object
            if (db) {
                _db = db.db("find_my_note_db");
                logger.log(logTypes.INFO, "Successfully connected to MongoDB.");
            }

            return callback(err);
        });
    },

    getDb: () => {
        return _db;
    },
};
