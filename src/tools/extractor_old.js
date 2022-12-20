"use strict";
const extract = require('extract-zip');
const fs = require('fs');

function packageFolderName(file) {
    let regex = /([^\.]*)\.([0-9|\.]*)\.zip/gi
    let match = regex.exec(file);
    if (match) {
        return match[1];
    }
    return null;
}

async function extractor(args) {
    try {
        let files = [];
        let target = __dirname + '/../wp-content/plugins/';
        if (args) {
            target = args[0];
            console.log(`Target argument: ${args[0]}`);
        }
        fs.readdirSync('./packages').forEach(file => {
            files.push(file);
        });
        files.forEach(async (file) => {
            let folderName = packageFolderName(file);
            if (folderName) {
                console.log(`Extracting package: ${file} | target ${target} | folder ${folderName}`);
                await extract(`./packages/${file}`, { dir: target });
            }
        })
        console.log('Extraction complete');
    } catch (err) {
        console.log('Error found in extraction');
        console.log(err);
    }
};

const args = process.argv.slice(2);

extractor(args);