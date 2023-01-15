const { dest, parallel, series, src } = require('gulp');
const del = require('del');
const { join } = require('path');

const { copyTheme, copyFonts, copyIcons, copyImages, copySass } = require('../node_modules/@uswds/uswds/tasks/copy');
const { compileSass } = require('../node_modules/@uswds/uswds/tasks/sass');

const { compileJS } = require('./javascript');

const DEST = join(__dirname, '../assets');

const clean = () => del(DEST, { force: true });
const copy = () => src('dist/{css,fonts,img,js}/**/*')
  .pipe(dest(DEST))

exports.clean = clean;
exports.copy = copy;
exports.build = series(
  parallel(copyImages, copyFonts, copyIcons),
  compileJS,
  compileSass,
  [clean, copy],
);