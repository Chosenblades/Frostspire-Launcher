const electron = require('electron');
const url = require('url');
const path = require('path');
const exec = require('child_process').exec;
const fs = require('fs');

const {app, BrowserWindow, Menu, ipcMain} = electron;

let mainWindow;
let downloadWindow;

const jarPath = path.join(app.getPath('home'), 'Frostspire', 'client.jar');

// Listen for app to be ready
app.on('ready', function(){
	if (require('electron-squirrel-startup')) return;
	//Create main window
	mainWindow = new BrowserWindow({ resizable: false});
	// Load html into window
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'mainWindow.html'),
		protocol: 'file:',
		slashes: true
	}));

	//Quit app when closed
	mainWindow.on('closed', function(){
		app.quit();
	});

	//Remove menu - TODO: make menu for mac
	//Menu.setApplicationMenu(null);

	//Download game client
	downloadWindow = new BrowserWindow({show: false});
	downloadWindow.webContents.session.on('will-download', (event, item, webContents) => {
		item.setSavePath(jarPath);

		item.on('updated', (event, state) => {
			if (state === 'interuppted') {
				console.log('Download interrupted');
			} else if (state === 'progressing') {
				if(item.isPaused()) {
					console.log('Download is paused');
				} else {
					console.log(`Received bytes: ${item.getReceivedBytes()}`);
					const downloadPercent = item.getReceivedBytes()/item.getTotalBytes();
					console.log('Download percentage: '+downloadPercent*100);
					mainWindow.webContents.send('updateDownloadProgress', downloadPercent*100);
				}
			}
		});

		item.once('done', (event, state) => {
			if (state === 'completed') {
				console.log('Download completed');
				downloadWindow.close();
				downloadWindow = null;
				mainWindow.webContents.send('downloadFinishedSuccessfully');
			} else {
				console.log(`Download failed: ${state}`);
			}
		});
	});

	downloadWindow.webContents.downloadURL('https://www.dropbox.com/s/b3tpp5jdtnhnd8s/Frostspire%20Beta.jar?dl=1');
});

ipcMain.on('launchGame', function(e){
	//const jarPath = '"'+path.join(app.getPath('home'), 'Frostspire', 'client.jar')+'"';
	const child = exec('java -jar "'+jarPath+'"', (error, stdout, stderr) => {
		if (error) {
			throw error;
		}

		console.log(stdout);
	});

})

