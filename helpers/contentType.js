module.exports.contentType = (extension) => {
    return {
        "css": 'text/css; charset=utf-8',
        "ico": 'image/x-icon'
    }[extension]
}
