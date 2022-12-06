const express = require("express");
const bcrypt = require('bcryptjs');


const validateResourceMW = require("../validation/middleware");
const validator = require("../validation/validator");
const getServiceInstance = require("../db/service");
const logger = require("../logging");
const logTypes = require("../logging/logTypes");

const registerRoute = express.Router();

registerRoute.post('/register', validateResourceMW(validator.registerSchema), (request, response) => {
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

module.exports = registerRoute;
