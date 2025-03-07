#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')

const scaffoldDir = path.join(__dirname, '/../playground')
const target = '.'

function copyFile(source, target) {
  const targetFile = target + '/' + path.basename(source)

  // Create the target directory if it doesn't exist
  const targetDir = path.dirname(targetFile)
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
    console.log(targetDir + ' - Directory created.')
  }

  // If target is a file that doesn't exist, create it
  if (!fs.existsSync(targetFile)) {
    console.log(targetFile + ' - Created.')
    fs.readFileSync(source)
    fs.writeFileSync(targetFile, fs.readFileSync(source))
  }
  else {
    console.log(targetFile + ' - Existing, skipped.')
  }
}

function syncDir(directory) {
  fs.readdirSync(scaffoldDir + '/' + directory).forEach(function (item) {
    if (fs.lstatSync(scaffoldDir + '/' + directory + '/' + item).isDirectory()) {
      syncDir(directory + '/' + item)
    }
    else {
      copyFile(scaffoldDir + '/' + directory + '/' + item, target + '/' + directory)
    }
  })
}

// Here we want to make sure our directories exist.
fs.mkdirSync('./components/global', { recursive: true })
fs.mkdirSync('./pages', { recursive: true })
fs.mkdirSync('./layouts', { recursive: true })

syncDir('pages')
syncDir('layouts')
syncDir('components')
copyFile(scaffoldDir + '/app.vue', target)
