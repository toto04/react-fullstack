#!/usr/bin/env node

import fs from 'fs-extra'
import path from 'path'
import readline from 'readline'
import { exec } from 'child_process'
import c from 'chalk'

let progressChars = ['⠇', '⠦', '⠴', '⠸', '⠙', '⠋'].map(s => c.bold(s))

let call: (command: string) => Promise<void> = (command) => {
    return new Promise((res, rej) => {
        let char = 0
        let interval = setInterval(() => {
            readline.moveCursor(process.stdout, -1, 0)
            process.stdout.write(progressChars[char++])
            if (char >= progressChars.length) char = 0
        }, 100)
        process.stdout.write(` > ` + command + `  `)
        let cp = exec(command)
        cp.on(`exit`, sc => {
            readline.moveCursor(process.stdout, -1, 0)
            clearInterval(interval)
            if (sc) {
                process.stdout.write(`❌`)
                rej()
            }
            else {
                process.stdout.write(`✅`)
                res()
            }
            process.stdout.write(`\n`)
        })
    })
}

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

let ask: (q: string) => Promise<string> = q => new Promise((res, rej) => {
    rl.question(q, ans => res(ans))
})

let packages: { [key: string]: string[] } = {
    client: [
        `@types/node`,
        `@types/react`,
        `@types/react-dom`,
        `node-sass`,
        `react`,
        `react-dom`,
        `react-scripts`,
        `typescript`
    ],
    src: [
        `@types/node`,
        `typescript`,
        `ts-node`
    ]
}

let main = async () => {
    console.log(c.bold.cyanBright`\nreact-fullstack by Tommaso Morganti`)
    let [_exec, _name, folderName] = process.argv
    if (!folderName) {
        console.log(c.bgRedBright`Missing folder name!`)
        return
    }

    let templatePath = path.join(__filename, `../../template/`)
    let ignorePath = path.join(__filename, '../../.ignore_template')

    if (fs.existsSync(folderName)) {
        console.log(c.bgRedBright`This folder already exists`)
        return
    }

    console.log(`\ncreating \x1b[1m${folderName}\x1b[0m folder...`)
    await fs.mkdir(folderName)
    console.log(`copying template...`)
    await fs.copy(templatePath, folderName)
    process.chdir(folderName)

    let json = JSON.parse((await fs.readFile(`package.json`)).toString())
    json.name = folderName
    await fs.writeFile(`package.json`, JSON.stringify(json, undefined, 4))
    await fs.writeFile(`README.md`, `# ${folderName}\n`)

    console.log(c.bold`installing packages` + ` (this will take a while)...`)
    for (let folder in packages) {
        let pkg = packages[folder]
        process.chdir(folder)
        await call(`yarn add ${pkg.join(` `)}`)
        process.chdir(`..`)
    }

    console.log(c.bgWhiteBright.black`all done! ❤️ `)

    let ans = (await ask('git init?')).toLowerCase()
    if (ans !== 'n' && ans !== 'no') {
        await fs.move(ignorePath, '/.gitignore')
        await call('git init')
        await call('git add .')
        await call('git commit -m "initial commit"')
    }

    ans = (await ask('open with vscode?')).toLowerCase()
    if (ans !== 'n' && ans !== 'no') {
        await call('code .')
    }
}

main().then(() => {
    console.log(c.underline`\nexiting, thank you for using this script!\n`)
    rl.close()
})