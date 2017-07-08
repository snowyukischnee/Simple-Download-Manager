const fs = require('fs')
const mkdirp = require('mkdirp')
const getDirName = require('path').dirname

module.exports = (readpath, writepath) => {
    let index = 0
    while (fs.existsSync(readpath + '.' + index)) {
        let err = null
        let data = null
        do {
            try {
                data = fs.readFileSync(readpath + '.' + index, {encoding: null})
            } catch (e) {
                err = e
            }
            console.log(err)
        } while (err)
        err = null
        mkdirp(getDirName(writepath), (err) => {})
        do {
            try {
                fs.appendFileSync(writepath, data, {encoding: null})
            } catch (e) {
                err = e
            }
            console.log(err)
        } while (err)
        index++;
    }
}