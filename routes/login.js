const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');

const logger = require("../logging");
const logTypes = require("../logging/logTypes");
const validator = require("../validation/validator");
const validateResourceMW = require("../validation/middleware");
const getServiceInstance = require("../db/service");

const loginRoutes = express.Router();


loginRoutes.post('/register', validateResourceMW(validator.registerSchema), (request, response) => {
    const {email, password, user_name:userName } = request.body;

    const salt = bcrypt.genSaltSync(10); // A salt is a random string that makes the hash unpredictable.
    // By hashing a plain text password plus a salt, the hash algorithm’s output is no longer predictable.
    // The same password will no longer yield the same hash. The salt gets automatically included with the hash, so you do not need to store it in a database.
    const hash = bcrypt.hashSync(password, salt);

    const newUser = {
        email,
        password: hash,
        userName
    };

    getServiceInstance().checkUserEmail(email)
        .then(user => {
            if (user) {
                logger.log(logTypes.INFO, "Registration failed. User with such email already exists!");
                return response.status(400).json({message: "User with such email already exists!"});
            } else {
                logger.log(logTypes.INFO, "OK. User with such email does not exist!");

                getServiceInstance().createNewUser(newUser)
                    .then(() => {
                        return response.json({email: newUser.email, user: newUser.userName, id: newUser._id});
                    })
                    .catch(error => {
                        logger.log(logTypes.ERROR, `${error}`);
                    });
            }
        })
        .catch(error => {
            logger.log(logTypes.ERROR, `${error}`);
        });
});

loginRoutes.post("/login", validateResourceMW(validator.loginSchema), (req, res) => {
    const {email, password} = req.body;

    getServiceInstance().checkUserEmail(email)
        .then(user => {
            // if user does not exist then return status 400
            if (!user) {
                logger.log(logTypes.ERROR, "User with such email does not exist!");
                return res.status(400).json({ message: "User with such email does not exist!" })
            } else {
                // if user exist - compares passwords
                // 'password' comes from the FE request
                // 'user.password' comes from the database
                bcrypt.compare(password, user.password, (error, data) => {
                    if (error) {
                        logger.log(logTypes.ERROR, `bcrypt error, ${error}`);
                        throw error;
                    }
                    // if both match than you can do anything
                    if (data) {
                        const token = jwt.sign({
                            email,
                            password
                        }, process.env.JWT_SECRET, {
                            expiresIn: 60 * 60 * 2 // seconds*minutes*hours, 2 hours in this case
                        }); // JWT is way for securely transmitting information between parties as a JSON object. This information can be verified and trusted because it is digitally signed.

                        logger.log(logTypes.INFO, `Logged in successfully! User: ${user.user_name}. Email: ${user.email}`);
                        return res
                            .cookie("access_token", token, {
                                httpOnly: true, // the httpOnly flag ensures that no client-side script can access the cookie other than the server.
                                secure: process.env.NODE_ENV === "production", // The secure flag ensures that cookie information is sent to the server with an encrypted request over the HTTPS protocol.
                                sameSite: "none"
                            })
                            .status(200)
                            .json({message: "Logged in successfully!", user: {email: user.email, user_name: user.user_name, id: user._id}});

                    } else {
                        logger.log(logTypes.ERROR, 'Failed to login. Invalid credentials!');
                        return res.status(401).json({message: "Invalid credentials!"});
                    }
                })
            }
        });
});

loginRoutes.get("/logout", (request, response) => {
    logger.log(logTypes.INFO, 'Logged out successfully!');
    return response
        .clearCookie("access_token")
        .status(200)
        .json({ message: "Successfully logged out!" });
});

module.exports = loginRoutes;



