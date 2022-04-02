const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");

const logger = require("./logging");
const logTypes = require("./logging/logTypes");

dotenv.config({ path: "./config.env" });

const port = process.env.PORT || 3001;

logger.log(logTypes.INFO, `process.env.NODE_ENV ${process.env.NODE_ENV}`);

const app = express();
app.use(cors({
    credentials: true,
    origin: ['http://localhost:3000', 'https://find-my-note.vercel.app'] // necessary to use cookies
}));
app.use(express.json());

// use cookie parser, should go before api routes
app.use(cookieParser());

// use API routes
app.use(require("./routes/login"));
app.use(require("./routes/note"));
app.use(require("./routes/tag"));

// get driver connection
const db = require("./db/connection");

// add swagger
const specs = require('./swagger/index.json');
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(specs));

app.listen(port, () => {
    // perform a database connection when server starts
    db.connectToServer((error) => {
        if (error) {
            logger.log(logTypes.ERROR, `Error when connecting to the db: ${error}`);
        }
    });

    logger.log(logTypes.INFO, `Server is running on port: ${port}`);
});


