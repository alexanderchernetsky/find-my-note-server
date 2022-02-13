const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');

const dbo = require("../db/connection");

const loginRoutes = express.Router();


loginRoutes.post('/register', (req, response) => {
    const email = req.body.email;
    const password = req.body.password;
    const user_name = req.body.user_name;

    if (!email || !password || !user_name) {
        response.status(400).json({message: 'Fields email, password, user_name are required!'});
    } else {
        const db = dbo.getDb("find_my_note_db");

        const salt = bcrypt.genSaltSync(10); // A salt is a random string that makes the hash unpredictable.
        // By hashing a plain text password plus a salt, the hash algorithm’s output is no longer predictable.
        // The same password will no longer yield the same hash. The salt gets automatically included with the hash, so you do not need to store it in a database.
        const hash = bcrypt.hashSync(password, salt);

        const newUser = {
            email,
            password: hash,
            user_name
        };

        db
            .collection("users")
            .findOne({ email: email })
            .then(user => {
                if (user) return response.status(400).json({ msg: "User with such email already exists!" });
            });

        db
        .collection("users")
            .insertOne(newUser, (err, res) => {
                if (err) {
                    throw err;
                }
                console.log("POST /register:", newUser);
                res.user = newUser;
                response.json(res);
            })
    }
})

loginRoutes.post("/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
        res.status(400).json({message: 'Fields email, password are required!'});
    } else {
        const db = dbo.getDb("find_my_note_db");

        db
            .collection("users")
            .findOne({ email: email })
            .then(user => {
                // if user does not exist then return status 400
                if (!user) return res.status(400).json({ message: "User with such email does not exist!" })

                // if user exist - compares passwords
                // 'password' comes from the FE request
                // 'user.password' comes from the database
                bcrypt.compare(password, user.password, (err, data) => {
                    if (err) throw err;
                    //if both match than you can do anything
                    if (data) {
                        const token = jwt.sign({
                            email: req.body.email,
                            password: req.body.password
                        }, process.env.JWT_SECRET, {
                            expiresIn: 60 * 60 * 2 // seconds*minutes*hours, 2 hours in this case
                        }); // JWT is way for securely transmitting information between parties as a JSON object. This information can be verified and trusted because it is digitally signed.

                        return res
                            .cookie("access_token", token, {
                                httpOnly: true, // the httpOnly flag ensures that no client-side script can access the cookie other than the server.
                                secure: process.env.NODE_ENV === "production", // The secure flag ensures that cookie information is sent to the server with an encrypted request over the HTTPS protocol.
                            })
                            .status(200)
                            .json({message: "Logged in successfully!", user: {email: user.email, user_name: user.user_name, id: user._id}});

                    } else {
                        return res.status(401).json({message: "Invalid credentials!"});
                    }
                })
            })
    }
});

loginRoutes.get("/logout", (req, res) => {
    return res
        .clearCookie("access_token")
        .status(200)
        .json({ message: "Successfully logged out!" });
});

module.exports = loginRoutes;



