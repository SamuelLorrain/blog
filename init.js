const md = require('./markdown');
const fs = require('fs').promises;

const loadBlogPosts = async () => {
    const blogPosts = {};
    for(const i of await fs.readdir(__dirname + '/blogposts')) {
        const f = await fs.open(__dirname + '/blogposts/' + i);
        const content = await f.readFile();
        f.close();
        const postMD = md(content.toString());
        blogPosts[
            postMD.title
                  .trim()
                  .replaceAll(/\?|-|!| /g,'_')
                  .toLowerCase()
        ] = postMD;
    }
    return new Promise((accept) => {
        accept(blogPosts);
    });
}

// Sort blog posts by date,
// most recent first
const sortBlogPosts = (blogPosts) => {
    return Object.entries(blogPosts)
        .sort(([,a],[,b]) =>
            new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Sort blog posts by date,
// then takes only the *num* most
// recents
const lastsBlogPosts = (blogPosts, num) => {
    return Object.entries(blogPosts)
        .sort(([,a],[,b]) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0,num); // slice is a shallow copy !
}

module.exports.blogPosts = (async() => {
    const blogPosts = await loadBlogPosts();
    const orderedBlogPostsArray = sortBlogPosts(blogPosts);
    const orderedBlogPosts = Object.fromEntries(orderedBlogPostsArray);
    const latestBlogPosts = Object.fromEntries(lastsBlogPosts(blogPosts,5));
    const getPreviousBlogPost = (postName) => {
        const sorted = orderedBlogPostsArray;
        const len = sorted.length;
        for(let i = 0; i < len; i++) {
            if (sorted[i][0] == postName) {
                if (i <= 0) return null;
                const post = sorted[i-1][1];
                return {
                    slug: sorted[i-1][0],
                    title : post.title,
                    date: post.date
                }
            }
        }
        return null;
    }
    const getNextBlogPost = (postName) => {
        const sorted = orderedBlogPostsArray;
        const len = sorted.length;
        for(let i = 0; i < len; i++) {
            if (sorted[i][0] == postName) {
                if (i >= len-1) return null;
                const post = sorted[i+1][1];
                return {
                    slug: sorted[i+1][0],
                    title : post.title,
                    date: post.date
                }
            }
        }
        return null;
    }
    return new Promise((accept) => {
        accept({
            getBlogPosts: () => blogPosts,
            getOrderedBlogPosts: () => orderedBlogPosts,
            getLatestBlogPosts: () => latestBlogPosts,
            getPreviousBlogPost,
            getNextBlogPost
        })
    });
})()
