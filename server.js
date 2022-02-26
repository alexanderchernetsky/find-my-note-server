const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");

dotenv.config({ path: "./config.env" });

const port = process.env.PORT || 3001;

const app = express();
app.use(cors({
    credentials: true,
    origin: ['http://localhost:3000', 'https://find-my-note-api.herokuapp.com'] // necessary to use cookies
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
            console.error(error);
        }
    });

    console.log(`Server is running on port: ${port}`);
});


