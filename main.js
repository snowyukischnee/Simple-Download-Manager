const electron = require('electron')
const path = require('path')
const url = require('url')
const globalConfig = require('./config')
const app = electron.app
const ipc = electron.ipcMain
const Menu = electron.Menu
const Tray = electron.Tray
const BrowserWindow = electron.BrowserWindow

let mainWindow
let appIcon = null
function createWindow() {
    mainWindow = new BrowserWindow({
        width: globalConfig.width,
        height: globalConfig.height,
        minWidth: globalConfig.width,
        minHeight: globalConfig.height,
        maxWidth: globalConfig.width,
        maxHeight: globalConfig.height,
        frame: false,
        icon: path.join(__dirname, 'icon.png')
    })
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'views/index/index.html'),
        protocol: 'file:',
        slashes: true
    }))
    //mainWindow.webContents.openDevTools()
    mainWindow.on('closed', () => {
        mainWindow = null
    })
}
app.on('ready', createWindow)
app.on('window-all-closed', () => {
    if (appIcon) appIcon.destroy()
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
app.on('activate', () => {
    if (mainWindow === null) {
        createWindow()
    }
})

ipc.on('put-in-tray', (event) => {
    const iconName = process.platform === 'win32' ? 'icon.png' : 'icon.png'
    const iconPath = path.join(__dirname, iconName)
    appIcon = new Tray(iconPath)
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show',
            click: () => mainWindow.webContents.send('tray-show')
        },
        {
            label: 'Exit',
            click: () => mainWindow.webContents.send('tray-removed')
        }
    ])
    appIcon.setToolTip('Tooltips.')
    appIcon.setContextMenu(contextMenu)
})
ipc.on('remove-tray', () => appIcon.destroy())
ipc.on('hide', () => mainWindow.hide())
ipc.on('show', () => mainWindow.show())