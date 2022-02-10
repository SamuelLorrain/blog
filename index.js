//
// TODO portfolio page
//
// TODO syntax highlighting
// TODO static content & compilation
//
// TODO compress files, caching etc.
// TODO dark/light themes
// TODO precompile views  (mostly done)
// TODO async for showdown and nunjuck
//
// TODO responsive
// TODO https/ssl
// TODO use strings in fs.writeStream & when sending response ?
// TODO mesure performances
// TODO minifining
//

const http = require("http");
const {pipeline} = require('stream');
const zlib = require('zlib');
const {routes} = require('./routes');
const {blogPosts} = require('./init');
const {notFoundResponse} = require("./helpers/responses");

const process = require('process');
const host = process.env['PORT'] ? '0.0.0.0' : 'localhost';
const port = process.env['PORT'] ? process.env['PORT'] : 5000;

const nunjucks = require('nunjucks');
nunjucks.configure('views', { autoescape: false });

const server = http.createServer(async (req,res) => {
    try {
        let response = await routes.getRoute(req,res)
        response.headers['Content-Encoding'] = 'gzip';
        res.writeHead(response.statusCode, response.headers);
        pipeline(response.content.toString(), zlib.createGzip(), res, (e) => {
            if(e){
                res.end();
                console.log("gzip error:")
                console.log(e);
            }
        });
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
