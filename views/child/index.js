const ipc = require('electron').ipcRenderer
const requestHeaders = require('../../controller/getHeaders')
const download = require('../../controller/download')
const self = this
const async = require("async")
const rebuild = require('../../controller/rebuild')
//--------------------------------------------------------------------------------
$('.close-window').on('click', () => self.close())
$('.error-wraper').hide()
$('.URLwraper, .Sizewraper').show()
$('.controllerwraper, .Customchunksizewraper, .Etagwraper, .taskviewer, .progresswraper, .taskstate, .taskviewtoggle').hide()
$('.threadnum').on('change', () => {
    let max = parseInt($('.threadnum').attr('max'))
    let min = parseInt($('.threadnum').attr('min'))
    let val = parseInt($('.threadnum').val())
    if (val < min) val = min
    if (val > max) val = max
    $('.threadnum').val(val)
})
$('.customchunk').on('change', () => {
    let max = parseInt($('.customchunk').attr('max'))
    let min = parseInt($('.customchunk').attr('min'))
    let val = parseInt($('.customchunk').val())
    if (val < min) val = min
    if (val > max) val = max
    $('.customchunk').val(val)
})
$('input[name=chunk]').on('change', () => {
    let val = parseInt($('input[name=chunk]:checked').val())
    if (val == -1) {
        $('.Customchunksizewraper').show()
    } else $('.Customchunksizewraper').hide()
})
$('.filename').on('change', () => {
    if ($('.filename').val() == '') $('.filename').val('filename.dat')
})
//--------------------------------------------------------------------------------
let arrTask = []
let fullsize
let arrTaskIndex = []
let URL
let proxy
let downloaded = 0
let lock
let lock1
let nt
//-------------------------------------------------------------------------------
$('.download').on('click', () => {
    arrTask = arrProcess(fullsize, getChunkSize())
    for (i in arrTask) arrTaskIndex.push(i)
    tableload(arrTask)
    loadProgress(0)
    $('.controllerwraper').hide()
    $('.taskviewtoggle, .progresswraper').show()
    process.nextTick(() => processDownload(getThreadNum()))
})
$('.taskviewtoggle').on('click', () => {
    $('.taskviewer').toggle()
})
//--------------------------------------------------------------------------------
ipc.on('close', () => {
    self.close()
});
ipc.on('data', (event , data) => {
    requestHeaders(data.url, data.proxy, (err, res) => {
        if (err) {
            $('.error-wraper').show()
            $('.main-ctn').hide()
            setInterval(() => self.close(), 3000)
        } else {
            showInfo(res)
            if (fullsize != null) {
                $('.controllerwraper').show()
            }
            URL = $('.refhref').val()
            proxy = data.proxy
        }
    })
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function startThreads() {
    while (nt <= 0) await sleep(0)
    nt--
    while (lock1) await sleep(0)
    lock1 = true
    let index
    for (let i in arrTaskIndex) if (arrTask[arrTaskIndex[i]].state == 'ready') {
        index = arrTaskIndex[i]
        arrTaskIndex.splice(i, 1)
        break
    }
    lock1 = false
    if (index == null) {
        nt++
        return
    }
    updateCell(index, 'processing')
    let exit = false
    download(URL, proxy, arrTask[index].query, './TEMP/' + $('.filename').val() + '.' + index, async (err) => {
        if (err) {
            updateCell(index, 'ready')
            arrTaskIndex.push(index)
        } else {
            let fs = parseInt(fullsize) + 1
            let ch = parseInt(getChunkSize()) * (1 << 10)
            while (lock) await sleep(0)
            lock = true
            if (index == arrTask.length - 1) downloaded += fs % ch
            else downloaded += ch
            lock = false
            updateCell(index, 'complete')
            loadProgress((100 * downloaded / fs).toFixed(2))
        }
        nt++
    })
    return
}
async function processDownload(threads) {
    $('.taskstate').show()
    $('.taskstate>p').html('downloading . . .')
    nt = threads
    let queue = async.queue((cb, cb2) => {cb();cb2()}, threads)
    for (i in arrTask) queue.push(startThreads, () => {})
    while (downloaded < parseInt(fullsize) + 1) await sleep(0)
    $('.taskstate>p').html('Rebuilding . . .')
    await sleep(0)
    rebuild('./TEMP/' + $('.filename').val(), './download/' + $('.filename').val())
    await sleep(0)
    $('.taskstate>p').html('Download Completed!')
}

function updateCell(index, val) {
    $('.taskview').bootstrapTable('updateCell', {
        index: index,
        field: 'state',
        value: val
    })
}

function loadProgress(val) {
    if (val < 0) val = 0
    if (val > 100) val = 100
    $('.downloadprogress').css('width', val + '%').attr('aria-valuenow', val).html(val + "'%")
}

function rowStyle(row, index) {
    let obj = {
        'ready': 'danger',
        'processing': 'info',
        'paused': 'warning',
        'complete': 'success'
    }
    return {
        classes: obj[row.state]
    }
}

function tableload(data) {
    load(data, '.taskview')
}

function getThreadNum() {
    return parseInt($('.threadnum').val())
}

function load(data, tableselector) {
    $(tableselector).bootstrapTable({
        data: data
    });
}

function arrProcess(size, chunk) {
    size++
    let res = []
    chunk = chunk * (1 << 10)
    let loop = size / chunk
    loop = Math.floor(loop)
    for (let i = 0; i < loop; i++) {
        res.push({
            name: (i + 1),
            query: 'bytes=' + (i * chunk) + '-' + (i * chunk + chunk - 1),
            state: 'ready'
        })
    }
    if (size % chunk != 0) {
        res.push({
            name: (loop + 1),
            query: 'bytes=' + (loop * chunk) + '-' + (size - 1),
            state: 'ready'
        })
    }
    return res
}

function getChunkSize() {
    let val = parseInt($('input[name=chunk]:checked').val())
    if (val == -1) val = parseInt($('.customchunk').val())
    return val
}

function showInfo(data) {
    $('.error-wraper').hide()
    $('.main-ctn').show()
    $('.refhref').val(data.request.href)
    let size = data.headers['content-length']
    fullsize = size
    let sizeTyp = ['KB(s)', 'MB(s)', 'GB(s)', 'TB(s)']
    for (i in sizeTyp) {
        if (size > (1 << 10)) {
            size /= 1 << 10
            $('.fileSize').val(size.toFixed(2))
            $('.sizeType').html(sizeTyp[i])
        }
    }
}