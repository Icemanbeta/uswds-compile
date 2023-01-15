const { series } = require('gulp');

const { dest, src } = require('gulp');
const buffer = require('vinyl-buffer');
const browserify = require('browserify');
const childProcess = require('child_process');
const rename = require('gulp-rename');
const source = require('vinyl-source-stream');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const merge = require('merge-stream');

const { typeCheck } = require('../node_modules/@uswds/uswds/tasks/javascript');
const dutil = require('../node_modules/@uswds/uswds/tasks/utils/doc-util');

const compileJS = () => {
  dutil.logMessage('javascript', 'Compiling JavaScript');
  let packageName = dutil.pkg.name.replace('@uswds/', '');
  const streams = Object.entries({
    [packageName]: browserify({
      entries: [`${__dirname}/js`],
      debug: true,
    })
      .transform('babelify', {
        global: true,
        presets: ['@babel/preset-env'],
      })
      .bundle()
      .pipe(source(`${packageName}.js`))
      .pipe(buffer()),
    'uswds-init': src('packages/uswds-core/src/js/uswds-init.js'),
  }).map(([basename, stream]) =>
    stream
      .pipe(rename({ basename }))
      .pipe(dest('dist/js'))
      .pipe(sourcemaps.init({ loadMaps: true }))
      .on('error', function handleError(error) {
        dutil.logError(error);
        this.emit('end');
      })
      .pipe(uglify())
      .pipe(
        rename({
          suffix: '.min',
        })
      )
      .pipe(sourcemaps.write('.'))
      .pipe(dest('dist/js'))
  );

  return merge(streams);
};

module.exports = {
  default: series(compileJS, typeCheck),
  compileJS,
  typeCheck,
};
