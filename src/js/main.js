"use strict";
/*------------------------------------------------------------------------------
 *  Copyright (c) 2019 Sagar Gurtu
 *  Licensed under the MIT License.
 *  See License in the project root for license information.
 *----------------------------------------------------------------------------*/

const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const { buildMenuTemplate } = require('./menutemplate');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win, aboutWin;

const truncate = (q) => {
    var len = q.length;
    if(len<=20) return q;
    return q.substring(0, 10) + len + q.substring(len-10, len);
}

function tran(query) {
            const { net } = require('electron');
            const request = net.request({
                method: 'POST',
                url: 'https://openapi.youdao.com/api'
            })

           var appKey = '14240d2ebe4b8336';
           var key = 'STdxLa3CuwSxeeWrFzSVbLlVoC8VN94c';//注意：暴露appSecret，有被盗用造成损失的风险
           var salt = (new Date).getTime();
           var curTime = Math.round(new Date().getTime()/1000);
           // 多个query可以用\n连接  如 query='apple\norange\nbanana\npear'
           var from = 'en';
           var to = 'zh-CHS';
           var str1 = appKey + truncate(query) + salt + curTime + key;
           console.log(str1);
           // var sign = sha256(str1);
           var sign = require("crypto")
                .createHash("sha256")
                .update(str1)
                .digest("hex");
           var postData = {
                   q: query,
                   appKey: appKey,
                   salt: salt,
                   from: from,
                   to: to,
                   sign: sign,
                   signType: "v3",
                   curtime: curTime,
           };

           let body = '';
           request.on('response', (response) => {
               console.log(`HEADERS: ${JSON.stringify(response.headers)}`);

               response.on('data', (chunk) => {
                 console.log(`BODY: ${chunk}`)
                 body += chunk.toString()
               })
               response.on('end', () => {
                   console.log(`body: ${body}`);
                   
               })
           })
           request.write(JSON.stringify(postData));
           request.end();
        }

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        width: 1200,
        height: 600,
        minWidth: 300,
        minHeight: 300,
        icon: './src/assets/images/logo.png',
        webPreferences: {
            plugins: true,
            nodeIntegration: true
        },
        frame: false
    });
    win.webContents.openDevTools();

    // and load the index.html of the app.
    win.loadFile('./src/index.html');

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
        aboutWin = null;
    });

    // Create a menu using template
    const menu = Menu.buildFromTemplate(buildMenuTemplate(win));
    // Create about window
    menu.getMenuItemById('about').click = () => {

        if (!aboutWin) {
            aboutWin = new BrowserWindow({
                width: 300,
                height: 150,
                resizable: false,
                frame: false,
                parent: win,
                modal: true,
                webPreferences: {
                    nodeIntegration: true
                },
            });

            aboutWin.loadFile('./src/about.html');

            aboutWin.on('closed', () => {
                aboutWin = null;
            })

        }
    };

    // Set application menu
    Menu.setApplicationMenu(menu);

    // Add event listener for enabling/disabling menu items
    ipcMain.on('toggle-menu-items', (event, flag) => {
        menu.getMenuItemById('file-print').enabled = flag;
        menu.getMenuItemById('file-properties').enabled = flag;
        menu.getMenuItemById('file-close').enabled = flag;
        menu.getMenuItemById('view-fullscreen').enabled = flag;
    });

    ipcMain.on('query', (event, query) => {
        tran(query);
    })

}

// Allow only a single instance of the app
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine) => {
        // Someone tried to run a second instance, we should focus our window.
        if (win) {
            if (win.isMinimized()) {
                win.restore();
            }
            win.focus();
            win.webContents.send('external-file-open', commandLine);
        }
    });

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    app.on('ready', createWindow);

    // Quit when all windows are closed.
    app.on('window-all-closed', () => {
        // On macOS it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (win === null) {
            createWindow();
        }
    });
}


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.