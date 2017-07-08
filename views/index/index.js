const electron = require('electron')
const BrowserWindow = electron.remote.BrowserWindow
const path = require('path')
const url = require('url')
const globalConfig = require('../../config')
const ipc = require('electron').ipcRenderer
const self = this
//-------------------------------------------------------------------------------
$('.close-window').on('click', () => self.close())
$('.alert').hide()
//--------------------------------------------------------------------------------
let arr = []
let count = 0
let trayOn = false
$('.submit').on('click', () => {
    if ($('.submit-link').val()) {
        $('.alert').hide()
        let window = new BrowserWindow({
            width: globalConfig.subWidth,
            height: globalConfig.subHeight,
            minWidth: globalConfig.subWidth,
            minHeight: globalConfig.subHeight,
            maxWidth: globalConfig.subWidth,
            maxHeight: globalConfig.subHeight,
            frame: false,
            icon: path.join(__dirname, '../../icon.png')
        })
        window.aID = count
        count++
        window.loadURL(url.format({
            pathname: path.join(__dirname, '../child/index.html'),
            protocol: 'file:',
            slashes: true
        }))
        window.webContents.on('did-finish-load', () => {
            window.webContents.send('data' , {
                url: $('.submit-link').val(),
                proxy: $('.proxy-link').val()
            })
        })
        arr.push(window)
        //window.webContents.openDevTools()
        window.on('closed', () => {
            arr.splice(window.aID, 1)
            window = null
        })
    } else $('.alert').show()
})
$('.minimize-window').on('click', () => {
    if (trayOn) {
        trayOn = false
        ipc.send('remove-tray')
    } else {
        trayOn = true
        ipc.send('put-in-tray')
    }
    for (i in arr) arr[i].hide()
    ipc.send('hide')
})
ipc.on('tray-removed', () => {
    ipc.send('remove-tray')
    trayOn = false
    for (i in arr) arr[i].webContents.send('close')
    self.close()
})
ipc.on('tray-show', () => {
    ipc.send('remove-tray')
    trayOn = false
    for (i in arr) arr[i].show()
    ipc.send('show')
})

