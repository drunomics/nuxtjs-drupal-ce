#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const scaffoldDir = path.join(__dirname, '/../scaffold')
const target = '.'

function copyFile (source, target) {
  const targetFile = target + '/' + path.basename(source)

  // If target is a directory, a new file with the same name will be created
  if (!fs.existsSync(targetFile)) {
    // eslint-disable-next-line no-console
    console.log(targetFile + ' - Created.')
    fs.writeFileSync(targetFile, fs.readFileSync(source))
  } else {
    // eslint-disable-next-line no-console
    console.log(targetFile + ' - Existing, skipped.')
  }
}

function syncDir (directory) {
  fs.readdirSync(scaffoldDir + '/' + directory).forEach(function (item) {
    if (fs.lstatSync(scaffoldDir + '/' + directory + '/' + item).isDirectory()) {
      syncDir(directory + '/' + item)
    } else {
      copyFile(scaffoldDir + '/' + directory + '/' + item, target + '/' + directory)
    }
  })
}

// Here we want to make sure our directories exist.
fs.mkdirSync('./components/global', { recursive: true })
fs.mkdirSync('./layouts', { recursive: true })
fs.mkdirSync('./pages', { recursive: true })
fs.mkdirSync('./store', { recursive: true })
fs.mkdirSync('./mixins', { recursive: true })

syncDir('layouts')
syncDir('pages')
syncDir('components')
syncDir('store')
syncDir('mixins')
