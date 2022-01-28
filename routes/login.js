const express = require("express");
const jwt = require("jsonwebtoken");
const authorization = require("../auth/authorization");

const loginRoutes = express.Router();

loginRoutes.get("/login", (req, res) => {
    const token = jwt.sign({ login: req.body.login, password: req.body.password }, process.env.JWT_SECRET, {
        expiresIn: 60*60*2 // seconds*minutes*hours, 2 hours in this case
    }); // JWT is way for securely transmitting information between parties as a JSON object. This information can be verified and trusted because it is digitally signed.
    // todo: check credentials and handle wrong credentials case
    return res
        .cookie("access_token", token, {
            httpOnly: true, // the httpOnly flag ensures that no client-side script can access the cookie other than the server.
            secure: process.env.NODE_ENV === "production", // The secure flag ensures that cookie information is sent to the server with an encrypted request over the HTTPS protocol.
        })
        .status(200)
        .json({ message: "Logged in successfully!" });
});

loginRoutes.get("/logout", authorization, (req, res) => {
    return res
        .clearCookie("access_token")
        .status(200)
        .json({ message: "Successfully logged out!" });
});

module.exports = loginRoutes;



