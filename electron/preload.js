const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('deckwing', {
  version: process.env.npm_package_version,
});
