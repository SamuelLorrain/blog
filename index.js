//
// TODO contact page
// TODO about page
// TODO portfolio page
// TODO github link
//
// TODO next/prev links for blog posts
//
// TODO syntax highlighting
// TODO static content & compilation
//
// TODO compress files, cache etc.
// TODO dark/light themes
//
const http = require("http");
const host = "localhost";
const port = 8000;
const {routes} = require('./routes');
const {blogPosts} = async require('./init');

const server = http.createServer((req,res) => routes.getRoute(req,res));
server.listen(port, host, async () => {
    console.log("server is running on " + port + ":" + host)
    blogPosts.then(() => {
        console.log("blogposts initialized");
    });
});
