const fs = require('fs').promises;

module.exports.notFoundResponse = (() => {
    return {
        statusCode: 404,
        headers: {
           "Content-Type": "text/html"
        },
        content: "Page Not Found" // TODO better not found response
    }
})();

module.exports.htmlResponse = (content) => {
    return new Promise((accept) => {
        accept({
        statusCode: 200,
        headers: {
           "Content-Type": "text/html"
        },
        content: content
        });
    });
};
