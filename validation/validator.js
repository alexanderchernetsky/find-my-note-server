const yup = require('yup');

const FIELD_MIN_LENGTH = 3;
const FIELD_MAX_LENGTH = 20;

const FIELD_MIN_VALUE = 1;
const FIELD_MAX_VALUE = 10000;

const SEARCH_STRING_MAX_LENGTH = 20;
const TAG_MAX_LENGTH = 20;

const NOTE_HEADING_MIN_LENGTH = 5;
const NOTE_HEADING_MAX_LENGTH = 100;
const NOTE_TEXT_MIN_LENGTH = 10;
const NOTE_TEXT_MAX_LENGTH = 10000;

const getLengthValidationMessage = (fieldName, min, max) => `${fieldName} should contain between ${min} and ${max} characters`;
const getNumberValidationMessage = (fieldName, min, max) => `${fieldName} should be a number from ${min} to ${max}`;

const userNameLengthValidationMsg = getLengthValidationMessage('user name', FIELD_MIN_LENGTH, FIELD_MAX_LENGTH);
const passwordLengthValidationMsg = getLengthValidationMessage('password', FIELD_MIN_LENGTH, FIELD_MAX_LENGTH);
const headingLengthValidationMsg = getLengthValidationMessage('heading', NOTE_HEADING_MIN_LENGTH, NOTE_HEADING_MAX_LENGTH);
const noteTextLengthValidationMsg = getLengthValidationMessage('text', NOTE_TEXT_MIN_LENGTH, NOTE_TEXT_MAX_LENGTH);

const pageValidationMsg = getNumberValidationMessage('page', FIELD_MIN_VALUE, FIELD_MAX_VALUE);
const limitValidationMsg = getNumberValidationMessage('limit', FIELD_MIN_VALUE, FIELD_MAX_VALUE);

const passwordValidationRules = yup.string().required('password is required').min(FIELD_MIN_LENGTH, passwordLengthValidationMsg).max(FIELD_MAX_LENGTH, passwordLengthValidationMsg);
const emailValidationRules = yup.string().required('email is required').email('email is not valid');
const userIdValidationRules = yup.string().required('user id is required');

const registerSchema = yup.object().shape({
    user_name: yup.string().required('user name is required').min(FIELD_MIN_LENGTH, userNameLengthValidationMsg).max(FIELD_MAX_LENGTH, userNameLengthValidationMsg),
    password: passwordValidationRules,
    email: emailValidationRules,
});

const loginSchema = yup.object().shape({
    password: passwordValidationRules,
    email: emailValidationRules,
});

const getNotesSchema = yup.object().shape({
    user_id: userIdValidationRules,
    page: yup.number().min(FIELD_MIN_VALUE, pageValidationMsg).max(FIELD_MAX_VALUE, pageValidationMsg),
    limit: yup.number().min(FIELD_MIN_VALUE, limitValidationMsg).max(FIELD_MAX_VALUE, limitValidationMsg),
    search: yup.string().max(SEARCH_STRING_MAX_LENGTH, `search string max length is ${SEARCH_STRING_MAX_LENGTH} characters`),
    tag: yup.string().max(TAG_MAX_LENGTH, `tag max length is ${TAG_MAX_LENGTH} characters`)
});

const noteSchema = yup.object().shape({
    user_id: userIdValidationRules,
    heading: yup.string().min(NOTE_HEADING_MIN_LENGTH, headingLengthValidationMsg).max(NOTE_HEADING_MAX_LENGTH, headingLengthValidationMsg),
    text: yup.string().min(NOTE_TEXT_MIN_LENGTH, noteTextLengthValidationMsg).max(NOTE_TEXT_MAX_LENGTH, noteTextLengthValidationMsg),
    tags: yup.array().min(1, 'Tags array should contain at least 1 tag').max(10, 'Tags array should contain less than 10 tags'),
});

const validator = {
    registerSchema,
    loginSchema,
    getNotesSchema,
    noteSchema
}

module.exports = validator;
