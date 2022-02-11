const zlib = require('zlib');
const {pipeline, Readable} = require('stream');

getCompressionAlgorithm = (encodingString) => {
    const priorities = ['br', 'gzip', 'deflate'];
    const encoding = encodingString.split(',').map(x => x.trim());
    for (const i of priorities) {
        if (encoding.includes(i)) {
            switch (i) {
                case 'br':
                    return {
                        name : 'br',
                        object : zlib.createBrotliCompress()
                    };
                case 'gzip':
                    return {
                        name : 'gzip',
                        object : zlib.createGzip()
                    };
                case 'deflate':
                    return {
                        name : 'deflate',
                        object : zlib.createDeflate()
                    };
                default:
                    return undefined;
            }
        }
    }
}

module.exports.compressResponse = (req,res,responseContent) =>  {
    if (!req.headers['accept-encoding']) {
        throw new Error("No compression available");
    }
    let compression = getCompressionAlgorithm(req.headers['accept-encoding']);
    responseContent.headers['Content-Encoding'] = compression.name;
    res.writeHead(responseContent.statusCode, responseContent.headers);
    pipeline(Readable.from(responseContent.content), compression.object, res, (e) => {
        if(e){
            res.end();
            console.log("compression error:");
            console.log(e);
        }
    });
}
