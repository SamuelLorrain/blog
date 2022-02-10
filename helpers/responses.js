const fs = require('fs').promises;

module.exports.sendNotFound = (res) => {
    res.writeHead(404)
    res.end("not found")
}

module.exports.htmlResponse = (res) => {
    res.setHeader("Content-Type", "text/html")
    res.writeHead(200);
}

module.exports.blogTemplate = (async () => {
    const head = await fs.open('./views/head.def')
    const back = await fs.open('./views/back.def');
    const content = await head.readFile() + " {{=it.html}} " + await back.readFile()
    head.close();
    back.close();
    return new Promise((accept) => accept(content));
})()
