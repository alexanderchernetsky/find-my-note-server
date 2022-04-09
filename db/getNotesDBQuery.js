function getNotesDBQuery(userId, searchString, tag) {
    let dbQuery = {"user_id": userId};

    if (searchString) {
        dbQuery = { $and: [{$text: { $search: searchString }}, {"user_id": userId}] }
    }

    if (tag) {
        dbQuery = { $and: [{tags: `#${tag}`}, {"user_id": userId}] }
    }

    return dbQuery;
}

module.exports = getNotesDBQuery;
