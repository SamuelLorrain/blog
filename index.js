//
// TODO portfolio page
//
// TODO syntax highlighting
// TODO static content & compilation
//
// TODO compress files, cache etc.
// TODO dark/light themes
// TODO precompile views
//
const http = require("http");
const host = "localhost";
const port = 8000;
const {routes} = require('./routes');
const {blogPosts} = require('./init');
const { notFoundResponse } = require("./helpers/responses");

const nunjucks = require('nunjucks');
nunjucks.configure('views', { autoescape: false });

const server = http.createServer(async (req,res) => {
    try {
        let response = await routes.getRoute(req,res)
        res.writeHead(response.statusCode, response.headers)
           .end(response.content);
    } catch(e) {
        console.log(e);
        let notFound = notFoundResponse;
        res.writeHead(notFound.statusCode,notFound.headers)
           .end(notFound.content);
    }
});
server.listen(port, host, () => {
    console.log("server is running on " + port + ":" + host)
    blogPosts.then(() => {
        console.log("blogposts initialized");
    });
});
