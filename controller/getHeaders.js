const request = require('request')

module.exports = (url, proxy, callback) => {
    let options = {
        url: url,
        followAllRedirects: true,
        proxy: proxy,
        method: 'HEAD',
    }
    request(options, (err, res, body) => {
        if (res == null || res.statusCode == null || res.statusCode != 200 && res.statusCode != 304) callback("Invalid URL!", null)
        else callback(null, res)
    })
}