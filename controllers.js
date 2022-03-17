const fs = require("fs").promises;
const nunjucks = require('nunjucks');
const {sendNotFound, htmlResponse} = require('./helpers/responses');
const {contentType} = require('./helpers/contentType');
const {blogPosts} = require('./init');

module.exports.notFoundController = async () => {
    return new Promise((accept) => {
        accept(sendNotFound);
    });
}

module.exports.index = async () => {
    let posts = await blogPosts;
    const content = nunjucks.render(
        "index.html",
        {
            blogposts: posts.getLatestBlogPosts()
        }
    );
    return htmlResponse(content);
}

module.exports.blogIndex = async () => {
    let posts = await blogPosts;
    const content = nunjucks.render(
        "blogindex.html",
        {
            blogposts: posts.getOrderedBlogPosts()
        }
    );
    return htmlResponse(content);
}

// TODO use preloaded blog posts
module.exports.blog = async (req, match) => {
    // TODO change route, possibility to add date in the title
    if (match[1].includes("/") || match[1].includes("..")) {
        sendNotFound(res);
        return;
    }
    const postName = match[1];
    const posts = await blogPosts;
    const article = posts.getBlogPosts()[postName]
    const previous = posts.getPreviousBlogPost(postName);
    const next = posts.getNextBlogPost(postName);
    const content = nunjucks.render(
        "blogpost.html",
        {
            article,
            previous,
            next,
        }
    );
    return htmlResponse(content);
}

module.exports.static = async (req, match) => {
    if (match[1].includes("/") || match[1].includes("..")) {
        throw new Error("not found");
    }
    const f = await fs.open(__dirname + "/static/" + match[1]);
    const content = await f.readFile();
    f.close();
    const format = contentType(match[1].split('.').pop());
    return new Promise((accept) => {
        accept({
            statusCode:200,
            headers: {
                "Content-Type": format,
                // "Cache-Control": "max-age=604800, immutable"
            },
            content
        })
    })
}
