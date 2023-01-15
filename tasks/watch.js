const { watch, series } = require('gulp');
const { join } = require('path');

const { compileJS } = require('./javascript');
const { build, clean, copy } = require('./build');

/**
 * Watch Sass and JS files.
 */
function watchFiles() {
  // Watch all my JS files and compile if a file changes.
  watch(
    `${__dirname}/js/**/*.js`,
    series(compileJS, clean, copy),
  );
}

  exports.watch = series(
  build,
  watchFiles
);