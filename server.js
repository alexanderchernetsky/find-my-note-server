const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");


dotenv.config({ path: "./config.env" });

const port = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());
app.use(require("./routes/note"));

// get driver connection
const db = require("./db/connection");

app.listen(port, () => {
    // perform a database connection when server starts
    db.connectToServer((error) => {
        if (error) {
            console.error(error);
        }
    });

    console.log(`Server is running on port: ${port}`);
});


