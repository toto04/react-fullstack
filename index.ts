#!/usr/bin/env ts-node

import { promisify } from 'util'
import fs from 'fs'

const mkdir = promisify(fs.mkdir);

(async () => {
    console.log('hi')
    let [_exec, _name, folderName] = process.argv
    if (!folderName) {
        console.log('Missing folder name!')
        return
    }

    mkdir(folderName)
})()