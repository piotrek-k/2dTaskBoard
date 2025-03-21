const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");
const express = require("express");
const cors = require("cors");
const net = require("net");

const localServerApp = express();
const BASE_PORT = 13000;

let actualPort = BASE_PORT;

const findAvailablePort = (port, callback) => {
  console.log("Trying another port...", port);

  const server = net.createServer();
  
  server.on("error", () => {
    if (port > BASE_PORT + 10) {
      console.error("Could not find an available port");
      process.exit(1);
    }

    findAvailablePort(port + 1, callback);
  });
  server.listen(port, () => {
    server.close(() => {
      callback(port);
    });
  });
};

const startLocalServer = (port, done, fallback = true) => {
  localServerApp.use(express.json({ limit: "100mb" }));
  localServerApp.use(cors());
  localServerApp.use(express.static(__dirname + "/dist"));
  localServerApp.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist/2dTaskBoard", "index.html"));
  });

  const server = localServerApp.listen(port, () => {
    console.log("Server Started on PORT", port);
    actualPort = port;
    done(port);
  });

  server.on("error", (err) => {
    if (fallback && err.code === "EADDRINUSE") {
      console.log(`Port ${port} is in use, searching for a free port...`);
      findAvailablePort(port + 1, (availablePort) => {
        startLocalServer(availablePort, done, false);
      });
    } else {
      console.error("Failed to start server:", err);
    }
  });
};

function createWindow(port) {
  console.log("Using port: ", port);

  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 600
  });

  const template = [
    {
      label: 'File',
      submenu: [{ role: 'quit' }]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  mainWindow.loadURL(`http://localhost:${port}/2dTaskBoard/board`);
}

app.whenReady().then(() => {
  startLocalServer(BASE_PORT, createWindow);

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(actualPort);
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
