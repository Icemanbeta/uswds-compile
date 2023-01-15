window.uswdsPresent = true; // GLOBAL variable to indicate that the uswds.js has loaded in the DOM.

/**
 * The 'polyfills' define key ECMAScript 5 methods that may be missing from
 * older browsers, so must be loaded first.
 */
require('../../node_modules/@uswds/uswds/packages/uswds-core/src/js/polyfills');

const uswds = require('../../node_modules/@uswds/uswds/packages/uswds-core/src/js/config');

const components = require('../../node_modules/@uswds/uswds/packages/uswds-core/src/js');
const svg4everybody = require('../../node_modules/@uswds/uswds/packages/uswds-core/src/js/polyfills/svg4everybody');

const navigation = require('./usa-header');

components.navigation = navigation;
uswds.components = components;

const initComponents = () => {
  const target = document.body;
  Object.keys(components).forEach((key) => {
    const behavior = components[key];
    behavior.on(target);
  });
  svg4everybody();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initComponents, { once: true });
} else {
  initComponents();
}

exports.default = uswds;
exports.initComponents = initComponents;