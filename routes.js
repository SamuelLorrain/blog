const {staticPage,
       blog,
       static,
} = require('./controllers');
const { sendNotFound } = require('./helpers/responses');

Map.prototype.getRoute = async function(req,res) {
    for (const [k,v] of this.entries()) {
        const m = req.url.match(k)
        if (m) {
            let x = await v;
            return x(req,res,m)
        }
    }
    sendNotFound(res);
}

module.exports.routes = new Map([
    [/^\/static\/(..*)$/, static],
    [/^\/$|^\/index\/?$|^\/home\/?$/, staticPage("index")],
    [/^\/blog\/?(.*)$/, blog],
])
