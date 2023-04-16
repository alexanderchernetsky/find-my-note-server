const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');

const logger = require("../logging");
const logTypes = require("../logging/logTypes");
const validator = require("../validation/validator");
const validateResourceMW = require("../validation/middleware");
const getServiceInstance = require("../db/service");

const loginRoute = express.Router();

loginRoute.post("/login", validateResourceMW(validator.loginSchema), (req, res) => {
    const {email, password} = req.body;

    const instance = getServiceInstance();

    instance.checkUserEmail(email)
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
                    // if both match
                    if (data) {
                        const jwt_token = jwt.sign({
                            email,
                            password
                        }, process.env.JWT_SECRET, {
                            expiresIn: 60 * 60 * 12 // seconds*minutes*hours, 12 hours in this case
                        }); // JWT is way for securely transmitting information between parties as a JSON object. This information can be verified and trusted because it is digitally signed.

                        logger.log(logTypes.INFO, `Logged in successfully! User: ${user.userName}. Email: ${user.email}`);
                        return res
                            .cookie("access_token", jwt_token, {
                                httpOnly: true, // the httpOnly flag ensures that no client-side script can access the cookie other than the server.
                                secure: true, // The Secure flag is used to declare that the cookie may only be transmitted using a secure connection (SSL/HTTPS). The browser will never send the cookie if the connection is HTTP
                                sameSite: "strict" // none value won’t give any kind of protection. The browser attaches the cookies in all cross-site browsing contexts.
                            }) // SameSite strict prevents the browser from sending this cookie along with cross-site requests.
                            .status(200)
                            .json({message: "Logged in successfully!", user: {email: user.email, user_name: user.userName, id: user._id}});

                    } else {
                        logger.log(logTypes.ERROR, 'Failed to login. Invalid credentials!');
                        return res.status(401).json({message: "Invalid credentials!"});
                    }
                })
            }
        });
});

module.exports = loginRoute;
