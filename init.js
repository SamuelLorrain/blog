const md = require('./markdown');
const fs = require('fs').promises;

module.exports.blogPosts = (async () => {
    let blogPosts = {};
    for(const i of await fs.readdir(__dirname + '/blogposts')) {
        let f = await fs.open(__dirname + '/blogposts/' + i);
        let content = await f.readFile();
        f.close();
        let postMD = md(content.toString());
        blogPosts[
            postMD.title
                  .trim()
                  .replaceAll(/\?|-|!| /g,'_')
                  .toLowerCase()
        ] = postMD;
    }
    return blogPosts;
})()
