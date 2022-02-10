const fs = require("fs").promises;
const md = require('./markdown');
const dot = require('dot');
const {sendNotFound, blogTemplate, htmlResponse} = require('./helpers/responses');
const {contentType} = require('./helpers/contentType');

module.exports.index = async () => {
    const f = await fs.open(__dirname + "/views/index.html");
    const content = await f.readFile();
    const template = dot.compile(await blogTemplate);
    f.close();
    return new Promise((accept) => {
        accept(() => {
            return template({html: content.toString()})
        })
    })
}

module.exports.staticPage = async (pageName) => {
    const f = await fs.open(__dirname + "/views/" + pageName + ".html");
    const content = await f.readFile();
    const t = await blogTemplate;
    f.close();
    return new Promise((accept) => {
        accept((req,res,match) => {
            htmlResponse(res);
            let template = dot.compile(t);
            res.end(template({html: content.toString()}));
        });
    });
}

module.exports.blog = (req,res,match) => {
    if (match[1] == '') {
        res.writeHead(200);
        let content = "<h1>blog index</h1>";
        blogTemplate
        .then(async (t) => {
            let template = dot.compile(t);
            res.end(template(md(content.toString())));
        });
        return;
    } else if (match[1].includes("/") || match[1].includes("..")) {
        sendNotFound(res);
        return;
    }
    const postName = match[1];
    fs.open(__dirname + '/blogposts/' + postName + '.md')
    .then((f) => {
        let content = f.readFile();
        f.close();
        return content;
    })
    .then(async (content) => {
        htmlResponse(res);
        let t = await blogTemplate;
        let template = dot.compile(t);
        res.end(template(md(content.toString())));
    })
    .catch((e) => {
        console.log(e);
        sendNotFound(res);
    });
}


module.exports.static = async (req,res,match) => {
    if (match[1].includes("/") || match[1].includes("..")) {
        sendNotFound(res);
        return;
    }
    res.setHeader('Content-Type', contentType(match[1].split('.').pop()))
    try {
        const f = await fs.open(__dirname + "/static/" + match[1]);
        const content = await f.readFile();
        res.writeHead(200)
        res.end(content);
        f.close();
    } catch(e) {
        console.log(e);
        sendNotFound(res);
    }
}
