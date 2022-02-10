const {index,
       blog,
       static,
       notFoundController,
       blogIndex,
} = require('./controllers');

Map.prototype.getRoute = async function(req) {
    for (const [k,v] of this.entries()) {
        const m = req.url.match(k)
        if (m) {
            let controllerFunction = await v;
            return controllerFunction(req,m)
        }
    }
    return notFoundController(req);
};

module.exports.routes = new Map([
    [/^\/static\/(.+)$/, static],
    [/^\/$|^\/index\/?$|^\/home\/?$/, index],
    [/^\/blog\/?$/, blogIndex],
    [/^\/blog\/?(.+)$/, blog],
]);
