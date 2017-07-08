const request = require('request')
const fs = require('fs')
const getDirName = require('path').dirname
const mkdirp = require('mkdirp')

function writeFile(path, content, callback) {
    mkdirp(getDirName(path), (err) => {
        if (err) return callback(err)
        let stream = fs.createWriteStream(path)
        stream.write(content)
        stream.end()
        return callback(null)
    })
}

module.exports = (url, proxy, range, path, callback) => {
    let options = {
        url: url,
        followAllRedirects: true,
        proxy: proxy,
        method: 'GET',
        headers: {
            'Range': range
        },
        encoding: null
    }
    let err = null
    do {
        try {
            request(options, (err, res, body) => {
                writeFile(path, body, callback)
            })
        } catch (e) {
            err = e
        }
    } while (err)
}