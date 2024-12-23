const { app, BrowserWindow, protocol, net  } = require("electron");
const path = require("path");

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 600
  });

  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));

  mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  protocol.registerFileProtocol('file', (request, cb) => {
    const url = request.url.replace('file:///', '')
    const decodedUrl = decodeURI(url)
    try {
      return cb(decodedUrl)
    } catch (error) {
      console.error('ERROR: registerLocalResourceProtocol: Could not get file path:', error)
    }
  });

  // protocol.handle('file', (request) => {
  //   // const url = request.url.substr(7); // Remove 'file://' from the start of the URL
  //   // return { path: path.normalize(`${__dirname}/dist/${url}`) };

  //   const url = request.url.replace('file:///', '')
  //   const decodedUrl = decodeURI(url)

  //   return { path: decodedUrl };
  // });

  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});