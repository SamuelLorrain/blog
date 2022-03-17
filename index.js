//
// TODO better date formatting
// TODO title date and tags in blog
// TODO search by tags (not now...)
//
// TODO portfolio page
//
// TODO syntax highlighting
// TODO static content & compilation
//
// TODO caching (mostly done)
// TODO dark/light themes
// TODO precompile views (mostly done)
// TODO async for showdown and nunjuck
//
// TODO use strings in fs.writeStream & when sending response ?
// TODO mesure performances
// TODO minifining css and all sended views
//

const http = require("http");
const {routes} = require('./routes');
const {blogPosts} = require('./init');
const {notFoundResponse} = require("./helpers/responses");
const {compressResponse} = require("./helpers/compress");

const process = require('process');
const host = process.env['PORT'] ? '0.0.0.0' : 'localhost';
const port = process.env['PORT'] ? process.env['PORT'] : 5000;

const nunjucks = require('nunjucks');
nunjucks.configure('views', { autoescape: false });

const server = http.createServer(async (req,res) => {
    try {
        let response = await routes.getRoute(req,res)
        try {
            compressResponse(req,res,response);
        }catch(e) {
            console.log(e);
            res.writeHead(response.statusCode, response.headers);
            res.end(response.content);
        }
    } catch(e) {
        console.log(e);
        let notFound = notFoundResponse;
        res.writeHead(notFound.statusCode,notFound.headers)
           .end(notFound.content);
    }
});
server.listen(port, host, () => {
    console.log("server is running on " + host + ":" + port)
    blogPosts.then(() => {
        console.log("blogposts initialized");
    })
    .catch((e) => {
        console.log(e);
        return 1;
    });
});
