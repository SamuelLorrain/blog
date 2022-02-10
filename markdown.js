const showdown = require("showdown");
const comments = {
    type: 'lang',
    filter: (text) =>
        text.split('\n')
            .filter((x) => !/^\/\/.*$/.test(x))
            .map((x) => x.replace(/(?<!:)\/\/.*$/, ''))
            .join('\n')
}

const showdownConfig = {
    extensions: [comments],
    noHeaderId: true,
    openLinksInNewWindow: true,
}


module.exports = function(text) {
    const converter = new showdown.Converter(showdownConfig);
    let tags = text.match(/\/\/ @tags (.*)/);
    if (tags) {
        tags = tags[1].split(',').map(x => x.trim());
    }
    let date = text.match(/\/\/ @date (.*)/);
    if (date) {
        date = date[1];
    }
    let title = text.match(/\/\/ @title (.*)/);
    if (title) {
        title = title[1];
    }
    return {
        title: title ?? '',
        date : date ?? '',
        tags : tags ?? [],
        html: converter.makeHtml(text)
    };
}
