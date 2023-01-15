const uswds = require('./node_modules/@uswds/uswds/gulpfile');

process.chdir('./node_modules/@uswds/uswds')

const { build } = require('./tasks/build');
const { compileJS } = require('./tasks/javascript');
const { watch } = require('./tasks/watch');

uswds.buildJS = compileJS;
uswds.default = uswds.buildUSWDS = uswds.build = build;
uswds.watch = watch;

module.exports = uswds;
