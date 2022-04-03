const logger = require("../logging");
const logTypes = require("../logging/logTypes");

const validateResourceMW = (schema, checkQuery= false) => async (req, res, next) => {
    const data = checkQuery ? req.query : req.body;
    try {
        await schema.validate(data);
        logger.log(logTypes.INFO, `Validation passed.`);
        next();
    } catch (error) {
        logger.log(logTypes.ERROR, `${error}`);
        res.status(400).json({message: `${error}`});
    }
};

module.exports = validateResourceMW;
