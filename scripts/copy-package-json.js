const fs = require('fs');
const base = require('../package.json');
const { dir } = require('yargs').argv;

const { name, version, main, dependencies } = base;
const data = { name, version, main, dependencies };
const json = JSON.stringify(data, null, 2);

function mkdir(pathArray, base = '.') {
  const [dir, ...children] = pathArray;
  const newDir = `${base}/${dir}`;

  if (!fs.existsSync(newDir)) {
    fs.mkdirSync(newDir);
  }

  if (children.length) {
    mkdir(children, newDir);
  }
}

mkdir(dir.split('/'));

fs.writeFile(`${dir}/package.json`, json, err => {
  if (err) {
    throw err;
  }
});
