const fs = require('fs');
const base = require('../package.json');

const { name, version, main, dependencies } = base;
const data = { name, version, main, dependencies };
const json = JSON.stringify(data, null, 2);

if (!fs.existsSync('./build')) {
  fs.mkdirSync('./build');
}

fs.writeFile('./build/package.json', json, err => {
  if (err) {
    throw err;
  }
});
