(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

const behavior = require("../../uswds-core/src/js/utils/behavior");
const toggleFormInput = require("../../uswds-core/src/js/utils/toggle-form-input");
const {
  CLICK
} = require("../../uswds-core/src/js/events");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const LINK = `.${PREFIX}-show-password`;
function toggle(event) {
  event.preventDefault();
  toggleFormInput(this);
}
module.exports = behavior({
  [CLICK]: {
    [LINK]: toggle
  }
});

},{"../../uswds-core/src/js/config":22,"../../uswds-core/src/js/events":23,"../../uswds-core/src/js/utils/behavior":31,"../../uswds-core/src/js/utils/toggle-form-input":41}],2:[function(require,module,exports){
"use strict";

const select = require("../../uswds-core/src/js/utils/select");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const toggle = require("../../uswds-core/src/js/utils/toggle");
const isElementInViewport = require("../../uswds-core/src/js/utils/is-in-viewport");
const {
  CLICK
} = require("../../uswds-core/src/js/events");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const ACCORDION = `.${PREFIX}-accordion, .${PREFIX}-accordion--bordered`;
const BUTTON = `.${PREFIX}-accordion__button[aria-controls]`;
const EXPANDED = "aria-expanded";
const MULTISELECTABLE = "data-allow-multiple";

/**
 * Get an Array of button elements belonging directly to the given
 * accordion element.
 * @param {HTMLElement} accordion
 * @return {array<HTMLButtonElement>}
 */
const getAccordionButtons = accordion => {
  const buttons = select(BUTTON, accordion);
  return buttons.filter(button => button.closest(ACCORDION) === accordion);
};

/**
 * Toggle a button's "pressed" state, optionally providing a target
 * state.
 *
 * @param {HTMLButtonElement} button
 * @param {boolean?} expanded If no state is provided, the current
 * state will be toggled (from false to true, and vice-versa).
 * @return {boolean} the resulting state
 */
const toggleButton = (button, expanded) => {
  const accordion = button.closest(ACCORDION);
  let safeExpanded = expanded;
  if (!accordion) {
    throw new Error(`${BUTTON} is missing outer ${ACCORDION}`);
  }
  safeExpanded = toggle(button, expanded);

  // XXX multiselectable is opt-in, to preserve legacy behavior
  const multiselectable = accordion.hasAttribute(MULTISELECTABLE);
  if (safeExpanded && !multiselectable) {
    getAccordionButtons(accordion).forEach(other => {
      if (other !== button) {
        toggle(other, false);
      }
    });
  }
};

/**
 * @param {HTMLButtonElement} button
 * @return {boolean} true
 */
const showButton = button => toggleButton(button, true);

/**
 * @param {HTMLButtonElement} button
 * @return {boolean} false
 */
const hideButton = button => toggleButton(button, false);
const accordion = behavior({
  [CLICK]: {
    [BUTTON](event) {
      toggleButton(this);
      if (this.getAttribute(EXPANDED) === "true") {
        // We were just expanded, but if another accordion was also just
        // collapsed, we may no longer be in the viewport. This ensures
        // that we are still visible, so the user isn't confused.
        if (!isElementInViewport(this)) this.scrollIntoView();
      }
    }
  }
}, {
  init(root) {
    select(BUTTON, root).forEach(button => {
      const expanded = button.getAttribute(EXPANDED) === "true";
      toggleButton(button, expanded);
    });
  },
  ACCORDION,
  BUTTON,
  show: showButton,
  hide: hideButton,
  toggle: toggleButton,
  getButtons: getAccordionButtons
});
module.exports = accordion;

},{"../../uswds-core/src/js/config":22,"../../uswds-core/src/js/events":23,"../../uswds-core/src/js/utils/behavior":31,"../../uswds-core/src/js/utils/is-in-viewport":34,"../../uswds-core/src/js/utils/select":39,"../../uswds-core/src/js/utils/toggle":42}],3:[function(require,module,exports){
"use strict";

const behavior = require("../../uswds-core/src/js/utils/behavior");
const {
  CLICK
} = require("../../uswds-core/src/js/events");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const HEADER = `.${PREFIX}-banner__header`;
const EXPANDED_CLASS = `${PREFIX}-banner__header--expanded`;
const toggleBanner = function toggleEl(event) {
  event.preventDefault();
  this.closest(HEADER).classList.toggle(EXPANDED_CLASS);
};
module.exports = behavior({
  [CLICK]: {
    [`${HEADER} [aria-controls]`]: toggleBanner
  }
});

},{"../../uswds-core/src/js/config":22,"../../uswds-core/src/js/events":23,"../../uswds-core/src/js/utils/behavior":31}],4:[function(require,module,exports){
"use strict";

const select = require("../../uswds-core/src/js/utils/select");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const debounce = require("../../uswds-core/src/js/utils/debounce");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const CHARACTER_COUNT_CLASS = `${PREFIX}-character-count`;
const CHARACTER_COUNT = `.${CHARACTER_COUNT_CLASS}`;
const INPUT = `.${PREFIX}-character-count__field`;
const MESSAGE = `.${PREFIX}-character-count__message`;
const VALIDATION_MESSAGE = "The content is too long.";
const MESSAGE_INVALID_CLASS = `${PREFIX}-character-count__status--invalid`;
const STATUS_MESSAGE_CLASS = `${CHARACTER_COUNT_CLASS}__status`;
const STATUS_MESSAGE_SR_ONLY_CLASS = `${CHARACTER_COUNT_CLASS}__sr-status`;
const STATUS_MESSAGE = `.${STATUS_MESSAGE_CLASS}`;
const STATUS_MESSAGE_SR_ONLY = `.${STATUS_MESSAGE_SR_ONLY_CLASS}`;
const DEFAULT_STATUS_LABEL = `characters allowed`;

/**
 * Returns the root and message element for an character count input
 *
 * @param {HTMLInputElement|HTMLTextAreaElement} inputEl The character count input element
 * @returns {CharacterCountElements} elements The root and message element.
 */
const getCharacterCountElements = inputEl => {
  const characterCountEl = inputEl.closest(CHARACTER_COUNT);
  if (!characterCountEl) {
    throw new Error(`${INPUT} is missing outer ${CHARACTER_COUNT}`);
  }
  const messageEl = characterCountEl.querySelector(MESSAGE);
  if (!messageEl) {
    throw new Error(`${CHARACTER_COUNT} is missing inner ${MESSAGE}`);
  }
  return {
    characterCountEl,
    messageEl
  };
};

/**
 * Move maxlength attribute to a data attribute on usa-character-count
 *
 * @param {HTMLInputElement|HTMLTextAreaElement} inputEl The character count input element
 */
const setDataLength = inputEl => {
  const {
    characterCountEl
  } = getCharacterCountElements(inputEl);
  const maxlength = inputEl.getAttribute("maxlength");
  if (!maxlength) return;
  inputEl.removeAttribute("maxlength");
  characterCountEl.setAttribute("data-maxlength", maxlength);
};

/**
 * Create and append status messages for visual and screen readers
 *
 * @param {HTMLDivElement} characterCountEl - Div with `.usa-character-count` class
 * @description  Create two status messages for number of characters left;
 * one visual status and another for screen readers
 */
const createStatusMessages = characterCountEl => {
  const statusMessage = document.createElement("div");
  const srStatusMessage = document.createElement("div");
  const maxLength = characterCountEl.dataset.maxlength;
  const defaultMessage = `${maxLength} ${DEFAULT_STATUS_LABEL}`;
  statusMessage.classList.add(`${STATUS_MESSAGE_CLASS}`, "usa-hint");
  srStatusMessage.classList.add(`${STATUS_MESSAGE_SR_ONLY_CLASS}`, "usa-sr-only");
  statusMessage.setAttribute("aria-hidden", true);
  srStatusMessage.setAttribute("aria-live", "polite");
  statusMessage.textContent = defaultMessage;
  srStatusMessage.textContent = defaultMessage;
  characterCountEl.append(statusMessage, srStatusMessage);
};

/**
 * Returns message with how many characters are left
 *
 * @param {number} currentLength - The number of characters used
 * @param {number} maxLength - The total number of characters allowed
 * @returns {string} A string description of how many characters are left
 */
const getCountMessage = (currentLength, maxLength) => {
  let newMessage = "";
  if (currentLength === 0) {
    newMessage = `${maxLength} ${DEFAULT_STATUS_LABEL}`;
  } else {
    const difference = Math.abs(maxLength - currentLength);
    const characters = `character${difference === 1 ? "" : "s"}`;
    const guidance = currentLength > maxLength ? "over limit" : "left";
    newMessage = `${difference} ${characters} ${guidance}`;
  }
  return newMessage;
};

/**
 * Updates the character count status for screen readers after a 1000ms delay.
 *
 * @param {HTMLElement} msgEl - The screen reader status message element
 * @param {string} statusMessage - A string of the current character status
 */
const srUpdateStatus = debounce((msgEl, statusMessage) => {
  const srStatusMessage = msgEl;
  srStatusMessage.textContent = statusMessage;
}, 1000);

/**
 * Update the character count component
 *
 * @description On input, it will update visual status, screenreader
 * status and update input validation (if over character length)
 * @param {HTMLInputElement|HTMLTextAreaElement} inputEl The character count input element
 */
const updateCountMessage = inputEl => {
  const {
    characterCountEl
  } = getCharacterCountElements(inputEl);
  const currentLength = inputEl.value.length;
  const maxLength = parseInt(characterCountEl.getAttribute("data-maxlength"), 10);
  const statusMessage = characterCountEl.querySelector(STATUS_MESSAGE);
  const srStatusMessage = characterCountEl.querySelector(STATUS_MESSAGE_SR_ONLY);
  const currentStatusMessage = getCountMessage(currentLength, maxLength);
  if (!maxLength) return;
  const isOverLimit = currentLength && currentLength > maxLength;
  statusMessage.textContent = currentStatusMessage;
  srUpdateStatus(srStatusMessage, currentStatusMessage);
  if (isOverLimit && !inputEl.validationMessage) {
    inputEl.setCustomValidity(VALIDATION_MESSAGE);
  }
  if (!isOverLimit && inputEl.validationMessage === VALIDATION_MESSAGE) {
    inputEl.setCustomValidity("");
  }
  statusMessage.classList.toggle(MESSAGE_INVALID_CLASS, isOverLimit);
};

/**
 * Initialize component
 *
 * @description On init this function will create elements and update any
 * attributes so it can tell the user how many characters are left.
 * @param  {HTMLInputElement|HTMLTextAreaElement} inputEl the components input
 */
const enhanceCharacterCount = inputEl => {
  const {
    characterCountEl,
    messageEl
  } = getCharacterCountElements(inputEl);

  // Hide hint and remove aria-live for backwards compatibility
  messageEl.classList.add("usa-sr-only");
  messageEl.removeAttribute("aria-live");
  setDataLength(inputEl);
  createStatusMessages(characterCountEl);
};
const characterCount = behavior({
  input: {
    [INPUT]() {
      updateCountMessage(this);
    }
  }
}, {
  init(root) {
    select(INPUT, root).forEach(input => enhanceCharacterCount(input));
  },
  MESSAGE_INVALID_CLASS,
  VALIDATION_MESSAGE,
  STATUS_MESSAGE_CLASS,
  STATUS_MESSAGE_SR_ONLY_CLASS,
  DEFAULT_STATUS_LABEL,
  createStatusMessages,
  getCountMessage,
  updateCountMessage
});
module.exports = characterCount;

},{"../../uswds-core/src/js/config":22,"../../uswds-core/src/js/utils/behavior":31,"../../uswds-core/src/js/utils/debounce":32,"../../uswds-core/src/js/utils/select":39}],5:[function(require,module,exports){
"use strict";

const keymap = require("receptor/keymap");
const selectOrMatches = require("../../uswds-core/src/js/utils/select-or-matches");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const Sanitizer = require("../../uswds-core/src/js/utils/sanitizer");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const {
  CLICK
} = require("../../uswds-core/src/js/events");
const COMBO_BOX_CLASS = `${PREFIX}-combo-box`;
const COMBO_BOX_PRISTINE_CLASS = `${COMBO_BOX_CLASS}--pristine`;
const SELECT_CLASS = `${COMBO_BOX_CLASS}__select`;
const INPUT_CLASS = `${COMBO_BOX_CLASS}__input`;
const CLEAR_INPUT_BUTTON_CLASS = `${COMBO_BOX_CLASS}__clear-input`;
const CLEAR_INPUT_BUTTON_WRAPPER_CLASS = `${CLEAR_INPUT_BUTTON_CLASS}__wrapper`;
const INPUT_BUTTON_SEPARATOR_CLASS = `${COMBO_BOX_CLASS}__input-button-separator`;
const TOGGLE_LIST_BUTTON_CLASS = `${COMBO_BOX_CLASS}__toggle-list`;
const TOGGLE_LIST_BUTTON_WRAPPER_CLASS = `${TOGGLE_LIST_BUTTON_CLASS}__wrapper`;
const LIST_CLASS = `${COMBO_BOX_CLASS}__list`;
const LIST_OPTION_CLASS = `${COMBO_BOX_CLASS}__list-option`;
const LIST_OPTION_FOCUSED_CLASS = `${LIST_OPTION_CLASS}--focused`;
const LIST_OPTION_SELECTED_CLASS = `${LIST_OPTION_CLASS}--selected`;
const STATUS_CLASS = `${COMBO_BOX_CLASS}__status`;
const COMBO_BOX = `.${COMBO_BOX_CLASS}`;
const SELECT = `.${SELECT_CLASS}`;
const INPUT = `.${INPUT_CLASS}`;
const CLEAR_INPUT_BUTTON = `.${CLEAR_INPUT_BUTTON_CLASS}`;
const TOGGLE_LIST_BUTTON = `.${TOGGLE_LIST_BUTTON_CLASS}`;
const LIST = `.${LIST_CLASS}`;
const LIST_OPTION = `.${LIST_OPTION_CLASS}`;
const LIST_OPTION_FOCUSED = `.${LIST_OPTION_FOCUSED_CLASS}`;
const LIST_OPTION_SELECTED = `.${LIST_OPTION_SELECTED_CLASS}`;
const STATUS = `.${STATUS_CLASS}`;
const DEFAULT_FILTER = ".*{{query}}.*";
const noop = () => {};

/**
 * set the value of the element and dispatch a change event
 *
 * @param {HTMLInputElement|HTMLSelectElement} el The element to update
 * @param {string} value The new value of the element
 */
const changeElementValue = function (el) {
  let value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
  const elementToChange = el;
  elementToChange.value = value;
  const event = new CustomEvent("change", {
    bubbles: true,
    cancelable: true,
    detail: {
      value
    }
  });
  elementToChange.dispatchEvent(event);
};

/**
 * The elements within the combo box.
 * @typedef {Object} ComboBoxContext
 * @property {HTMLElement} comboBoxEl
 * @property {HTMLSelectElement} selectEl
 * @property {HTMLInputElement} inputEl
 * @property {HTMLUListElement} listEl
 * @property {HTMLDivElement} statusEl
 * @property {HTMLLIElement} focusedOptionEl
 * @property {HTMLLIElement} selectedOptionEl
 * @property {HTMLButtonElement} toggleListBtnEl
 * @property {HTMLButtonElement} clearInputBtnEl
 * @property {boolean} isPristine
 * @property {boolean} disableFiltering
 */

/**
 * Get an object of elements belonging directly to the given
 * combo box component.
 *
 * @param {HTMLElement} el the element within the combo box
 * @returns {ComboBoxContext} elements
 */
const getComboBoxContext = el => {
  const comboBoxEl = el.closest(COMBO_BOX);
  if (!comboBoxEl) {
    throw new Error(`Element is missing outer ${COMBO_BOX}`);
  }
  const selectEl = comboBoxEl.querySelector(SELECT);
  const inputEl = comboBoxEl.querySelector(INPUT);
  const listEl = comboBoxEl.querySelector(LIST);
  const statusEl = comboBoxEl.querySelector(STATUS);
  const focusedOptionEl = comboBoxEl.querySelector(LIST_OPTION_FOCUSED);
  const selectedOptionEl = comboBoxEl.querySelector(LIST_OPTION_SELECTED);
  const toggleListBtnEl = comboBoxEl.querySelector(TOGGLE_LIST_BUTTON);
  const clearInputBtnEl = comboBoxEl.querySelector(CLEAR_INPUT_BUTTON);
  const isPristine = comboBoxEl.classList.contains(COMBO_BOX_PRISTINE_CLASS);
  const disableFiltering = comboBoxEl.dataset.disableFiltering === "true";
  return {
    comboBoxEl,
    selectEl,
    inputEl,
    listEl,
    statusEl,
    focusedOptionEl,
    selectedOptionEl,
    toggleListBtnEl,
    clearInputBtnEl,
    isPristine,
    disableFiltering
  };
};

/**
 * Disable the combo-box component
 *
 * @param {HTMLInputElement} el An element within the combo box component
 */
const disable = el => {
  const {
    inputEl,
    toggleListBtnEl,
    clearInputBtnEl
  } = getComboBoxContext(el);
  clearInputBtnEl.hidden = true;
  clearInputBtnEl.disabled = true;
  toggleListBtnEl.disabled = true;
  inputEl.disabled = true;
};

/**
 * Enable the combo-box component
 *
 * @param {HTMLInputElement} el An element within the combo box component
 */
const enable = el => {
  const {
    inputEl,
    toggleListBtnEl,
    clearInputBtnEl
  } = getComboBoxContext(el);
  clearInputBtnEl.hidden = false;
  clearInputBtnEl.disabled = false;
  toggleListBtnEl.disabled = false;
  inputEl.disabled = false;
};

/**
 * Enhance a select element into a combo box component.
 *
 * @param {HTMLElement} _comboBoxEl The initial element of the combo box component
 */
const enhanceComboBox = _comboBoxEl => {
  const comboBoxEl = _comboBoxEl.closest(COMBO_BOX);
  if (comboBoxEl.dataset.enhanced) return;
  const selectEl = comboBoxEl.querySelector("select");
  if (!selectEl) {
    throw new Error(`${COMBO_BOX} is missing inner select`);
  }
  const selectId = selectEl.id;
  const selectLabel = document.querySelector(`label[for="${selectId}"]`);
  const listId = `${selectId}--list`;
  const listIdLabel = `${selectId}-label`;
  const assistiveHintID = `${selectId}--assistiveHint`;
  const additionalAttributes = [];
  const {
    defaultValue
  } = comboBoxEl.dataset;
  const {
    placeholder
  } = comboBoxEl.dataset;
  let selectedOption;
  if (placeholder) {
    additionalAttributes.push({
      placeholder
    });
  }
  if (defaultValue) {
    for (let i = 0, len = selectEl.options.length; i < len; i += 1) {
      const optionEl = selectEl.options[i];
      if (optionEl.value === defaultValue) {
        selectedOption = optionEl;
        break;
      }
    }
  }

  /**
   * Throw error if combobox is missing a label or label is missing
   * `for` attribute. Otherwise, set the ID to match the <ul> aria-labelledby
   */
  if (!selectLabel || !selectLabel.matches(`label[for="${selectId}"]`)) {
    throw new Error(`${COMBO_BOX} for ${selectId} is either missing a label or a "for" attribute`);
  } else {
    selectLabel.setAttribute("id", listIdLabel);
  }
  selectLabel.setAttribute("id", listIdLabel);
  selectEl.setAttribute("aria-hidden", "true");
  selectEl.setAttribute("tabindex", "-1");
  selectEl.classList.add("usa-sr-only", SELECT_CLASS);
  selectEl.id = "";
  selectEl.value = "";
  ["required", "aria-label", "aria-labelledby"].forEach(name => {
    if (selectEl.hasAttribute(name)) {
      const value = selectEl.getAttribute(name);
      additionalAttributes.push({
        [name]: value
      });
      selectEl.removeAttribute(name);
    }
  });

  // sanitize doesn't like functions in template literals
  const input = document.createElement("input");
  input.setAttribute("id", selectId);
  input.setAttribute("aria-owns", listId);
  input.setAttribute("aria-controls", listId);
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-describedby", assistiveHintID);
  input.setAttribute("aria-expanded", "false");
  input.setAttribute("autocapitalize", "off");
  input.setAttribute("autocomplete", "off");
  input.setAttribute("class", INPUT_CLASS);
  input.setAttribute("type", "text");
  input.setAttribute("role", "combobox");
  additionalAttributes.forEach(attr => Object.keys(attr).forEach(key => {
    const value = Sanitizer.escapeHTML`${attr[key]}`;
    input.setAttribute(key, value);
  }));
  comboBoxEl.insertAdjacentElement("beforeend", input);
  comboBoxEl.insertAdjacentHTML("beforeend", Sanitizer.escapeHTML`
    <span class="${CLEAR_INPUT_BUTTON_WRAPPER_CLASS}" tabindex="-1">
        <button type="button" class="${CLEAR_INPUT_BUTTON_CLASS}" aria-label="Clear the select contents">&nbsp;</button>
      </span>
      <span class="${INPUT_BUTTON_SEPARATOR_CLASS}">&nbsp;</span>
      <span class="${TOGGLE_LIST_BUTTON_WRAPPER_CLASS}" tabindex="-1">
        <button type="button" tabindex="-1" class="${TOGGLE_LIST_BUTTON_CLASS}" aria-label="Toggle the dropdown list">&nbsp;</button>
      </span>
      <ul
        tabindex="-1"
        id="${listId}"
        class="${LIST_CLASS}"
        role="listbox"
        aria-labelledby="${listIdLabel}"
        hidden>
      </ul>
      <div class="${STATUS_CLASS} usa-sr-only" role="status"></div>
      <span id="${assistiveHintID}" class="usa-sr-only">
        When autocomplete results are available use up and down arrows to review and enter to select.
        Touch device users, explore by touch or with swipe gestures.
      </span>`);
  if (selectedOption) {
    const {
      inputEl
    } = getComboBoxContext(comboBoxEl);
    changeElementValue(selectEl, selectedOption.value);
    changeElementValue(inputEl, selectedOption.text);
    comboBoxEl.classList.add(COMBO_BOX_PRISTINE_CLASS);
  }
  if (selectEl.disabled) {
    disable(comboBoxEl);
    selectEl.disabled = false;
  }
  comboBoxEl.dataset.enhanced = "true";
};

/**
 * Manage the focused element within the list options when
 * navigating via keyboard.
 *
 * @param {HTMLElement} el An anchor element within the combo box component
 * @param {HTMLElement} nextEl An element within the combo box component
 * @param {Object} options options
 * @param {boolean} options.skipFocus skip focus of highlighted item
 * @param {boolean} options.preventScroll should skip procedure to scroll to element
 */
const highlightOption = function (el, nextEl) {
  let {
    skipFocus,
    preventScroll
  } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  const {
    inputEl,
    listEl,
    focusedOptionEl
  } = getComboBoxContext(el);
  if (focusedOptionEl) {
    focusedOptionEl.classList.remove(LIST_OPTION_FOCUSED_CLASS);
    focusedOptionEl.setAttribute("tabIndex", "-1");
  }
  if (nextEl) {
    inputEl.setAttribute("aria-activedescendant", nextEl.id);
    nextEl.setAttribute("tabIndex", "0");
    nextEl.classList.add(LIST_OPTION_FOCUSED_CLASS);
    if (!preventScroll) {
      const optionBottom = nextEl.offsetTop + nextEl.offsetHeight;
      const currentBottom = listEl.scrollTop + listEl.offsetHeight;
      if (optionBottom > currentBottom) {
        listEl.scrollTop = optionBottom - listEl.offsetHeight;
      }
      if (nextEl.offsetTop < listEl.scrollTop) {
        listEl.scrollTop = nextEl.offsetTop;
      }
    }
    if (!skipFocus) {
      nextEl.focus({
        preventScroll
      });
    }
  } else {
    inputEl.setAttribute("aria-activedescendant", "");
    inputEl.focus();
  }
};

/**
 * Generate a dynamic regular expression based off of a replaceable and possibly filtered value.
 *
 * @param {string} el An element within the combo box component
 * @param {string} query The value to use in the regular expression
 * @param {object} extras An object of regular expressions to replace and filter the query
 */
const generateDynamicRegExp = function (filter) {
  let query = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
  let extras = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  const escapeRegExp = text => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  let find = filter.replace(/{{(.*?)}}/g, (m, $1) => {
    const key = $1.trim();
    const queryFilter = extras[key];
    if (key !== "query" && queryFilter) {
      const matcher = new RegExp(queryFilter, "i");
      const matches = query.match(matcher);
      if (matches) {
        return escapeRegExp(matches[1]);
      }
      return "";
    }
    return escapeRegExp(query);
  });
  find = `^(?:${find})$`;
  return new RegExp(find, "i");
};

/**
 * Display the option list of a combo box component.
 *
 * @param {HTMLElement} el An element within the combo box component
 */
const displayList = el => {
  const {
    comboBoxEl,
    selectEl,
    inputEl,
    listEl,
    statusEl,
    isPristine,
    disableFiltering
  } = getComboBoxContext(el);
  let selectedItemId;
  let firstFoundId;
  const listOptionBaseId = `${listEl.id}--option-`;
  const inputValue = (inputEl.value || "").toLowerCase();
  const filter = comboBoxEl.dataset.filter || DEFAULT_FILTER;
  const regex = generateDynamicRegExp(filter, inputValue, comboBoxEl.dataset);
  const options = [];
  for (let i = 0, len = selectEl.options.length; i < len; i += 1) {
    const optionEl = selectEl.options[i];
    const optionId = `${listOptionBaseId}${options.length}`;
    if (optionEl.value && (disableFiltering || isPristine || !inputValue || regex.test(optionEl.text))) {
      if (selectEl.value && optionEl.value === selectEl.value) {
        selectedItemId = optionId;
      }
      if (disableFiltering && !firstFoundId && regex.test(optionEl.text)) {
        firstFoundId = optionId;
      }
      options.push(optionEl);
    }
  }
  const numOptions = options.length;
  const optionHtml = options.map((option, index) => {
    const optionId = `${listOptionBaseId}${index}`;
    const classes = [LIST_OPTION_CLASS];
    let tabindex = "-1";
    let ariaSelected = "false";
    if (optionId === selectedItemId) {
      classes.push(LIST_OPTION_SELECTED_CLASS, LIST_OPTION_FOCUSED_CLASS);
      tabindex = "0";
      ariaSelected = "true";
    }
    if (!selectedItemId && index === 0) {
      classes.push(LIST_OPTION_FOCUSED_CLASS);
      tabindex = "0";
    }
    const li = document.createElement("li");
    li.setAttribute("aria-setsize", options.length);
    li.setAttribute("aria-posinset", index + 1);
    li.setAttribute("aria-selected", ariaSelected);
    li.setAttribute("id", optionId);
    li.setAttribute("class", classes.join(" "));
    li.setAttribute("tabindex", tabindex);
    li.setAttribute("role", "option");
    li.setAttribute("data-value", option.value);
    li.textContent = option.text;
    return li;
  });
  const noResults = document.createElement("li");
  noResults.setAttribute("class", `${LIST_OPTION_CLASS}--no-results`);
  noResults.textContent = "No results found";
  listEl.hidden = false;
  if (numOptions) {
    listEl.innerHTML = "";
    optionHtml.forEach(item => listEl.insertAdjacentElement("beforeend", item));
  } else {
    listEl.innerHTML = "";
    listEl.insertAdjacentElement("beforeend", noResults);
  }
  inputEl.setAttribute("aria-expanded", "true");
  statusEl.textContent = numOptions ? `${numOptions} result${numOptions > 1 ? "s" : ""} available.` : "No results.";
  let itemToFocus;
  if (isPristine && selectedItemId) {
    itemToFocus = listEl.querySelector(`#${selectedItemId}`);
  } else if (disableFiltering && firstFoundId) {
    itemToFocus = listEl.querySelector(`#${firstFoundId}`);
  }
  if (itemToFocus) {
    highlightOption(listEl, itemToFocus, {
      skipFocus: true
    });
  }
};

/**
 * Hide the option list of a combo box component.
 *
 * @param {HTMLElement} el An element within the combo box component
 */
const hideList = el => {
  const {
    inputEl,
    listEl,
    statusEl,
    focusedOptionEl
  } = getComboBoxContext(el);
  statusEl.innerHTML = "";
  inputEl.setAttribute("aria-expanded", "false");
  inputEl.setAttribute("aria-activedescendant", "");
  if (focusedOptionEl) {
    focusedOptionEl.classList.remove(LIST_OPTION_FOCUSED_CLASS);
  }
  listEl.scrollTop = 0;
  listEl.hidden = true;
};

/**
 * Select an option list of the combo box component.
 *
 * @param {HTMLElement} listOptionEl The list option being selected
 */
const selectItem = listOptionEl => {
  const {
    comboBoxEl,
    selectEl,
    inputEl
  } = getComboBoxContext(listOptionEl);
  changeElementValue(selectEl, listOptionEl.dataset.value);
  changeElementValue(inputEl, listOptionEl.textContent);
  comboBoxEl.classList.add(COMBO_BOX_PRISTINE_CLASS);
  hideList(comboBoxEl);
  inputEl.focus();
};

/**
 * Clear the input of the combo box
 *
 * @param {HTMLButtonElement} clearButtonEl The clear input button
 */
const clearInput = clearButtonEl => {
  const {
    comboBoxEl,
    listEl,
    selectEl,
    inputEl
  } = getComboBoxContext(clearButtonEl);
  const listShown = !listEl.hidden;
  if (selectEl.value) changeElementValue(selectEl);
  if (inputEl.value) changeElementValue(inputEl);
  comboBoxEl.classList.remove(COMBO_BOX_PRISTINE_CLASS);
  if (listShown) displayList(comboBoxEl);
  inputEl.focus();
};

/**
 * Reset the select based off of currently set select value
 *
 * @param {HTMLElement} el An element within the combo box component
 */
const resetSelection = el => {
  const {
    comboBoxEl,
    selectEl,
    inputEl
  } = getComboBoxContext(el);
  const selectValue = selectEl.value;
  const inputValue = (inputEl.value || "").toLowerCase();
  if (selectValue) {
    for (let i = 0, len = selectEl.options.length; i < len; i += 1) {
      const optionEl = selectEl.options[i];
      if (optionEl.value === selectValue) {
        if (inputValue !== optionEl.text) {
          changeElementValue(inputEl, optionEl.text);
        }
        comboBoxEl.classList.add(COMBO_BOX_PRISTINE_CLASS);
        return;
      }
    }
  }
  if (inputValue) {
    changeElementValue(inputEl);
  }
};

/**
 * Select an option list of the combo box component based off of
 * having a current focused list option or
 * having test that completely matches a list option.
 * Otherwise it clears the input and select.
 *
 * @param {HTMLElement} el An element within the combo box component
 */
const completeSelection = el => {
  const {
    comboBoxEl,
    selectEl,
    inputEl,
    statusEl
  } = getComboBoxContext(el);
  statusEl.textContent = "";
  const inputValue = (inputEl.value || "").toLowerCase();
  if (inputValue) {
    for (let i = 0, len = selectEl.options.length; i < len; i += 1) {
      const optionEl = selectEl.options[i];
      if (optionEl.text.toLowerCase() === inputValue) {
        changeElementValue(selectEl, optionEl.value);
        changeElementValue(inputEl, optionEl.text);
        comboBoxEl.classList.add(COMBO_BOX_PRISTINE_CLASS);
        return;
      }
    }
  }
  resetSelection(comboBoxEl);
};

/**
 * Handle the escape event within the combo box component.
 *
 * @param {KeyboardEvent} event An event within the combo box component
 */
const handleEscape = event => {
  const {
    comboBoxEl,
    inputEl
  } = getComboBoxContext(event.target);
  hideList(comboBoxEl);
  resetSelection(comboBoxEl);
  inputEl.focus();
};

/**
 * Handle the down event within the combo box component.
 *
 * @param {KeyboardEvent} event An event within the combo box component
 */
const handleDownFromInput = event => {
  const {
    comboBoxEl,
    listEl
  } = getComboBoxContext(event.target);
  if (listEl.hidden) {
    displayList(comboBoxEl);
  }
  const nextOptionEl = listEl.querySelector(LIST_OPTION_FOCUSED) || listEl.querySelector(LIST_OPTION);
  if (nextOptionEl) {
    highlightOption(comboBoxEl, nextOptionEl);
  }
  event.preventDefault();
};

/**
 * Handle the enter event from an input element within the combo box component.
 *
 * @param {KeyboardEvent} event An event within the combo box component
 */
const handleEnterFromInput = event => {
  const {
    comboBoxEl,
    listEl
  } = getComboBoxContext(event.target);
  const listShown = !listEl.hidden;
  completeSelection(comboBoxEl);
  if (listShown) {
    hideList(comboBoxEl);
  }
  event.preventDefault();
};

/**
 * Handle the down event within the combo box component.
 *
 * @param {KeyboardEvent} event An event within the combo box component
 */
const handleDownFromListOption = event => {
  const focusedOptionEl = event.target;
  const nextOptionEl = focusedOptionEl.nextSibling;
  if (nextOptionEl) {
    highlightOption(focusedOptionEl, nextOptionEl);
  }
  event.preventDefault();
};

/**
 * Handle the tab event from an list option element within the combo box component.
 *
 * @param {KeyboardEvent} event An event within the combo box component
 */
const handleTabFromListOption = event => {
  selectItem(event.target);
  event.preventDefault();
};

/**
 * Handle the enter event from list option within the combo box component.
 *
 * @param {KeyboardEvent} event An event within the combo box component
 */
const handleEnterFromListOption = event => {
  selectItem(event.target);
  event.preventDefault();
};

/**
 * Handle the up event from list option within the combo box component.
 *
 * @param {KeyboardEvent} event An event within the combo box component
 */
const handleUpFromListOption = event => {
  const {
    comboBoxEl,
    listEl,
    focusedOptionEl
  } = getComboBoxContext(event.target);
  const nextOptionEl = focusedOptionEl && focusedOptionEl.previousSibling;
  const listShown = !listEl.hidden;
  highlightOption(comboBoxEl, nextOptionEl);
  if (listShown) {
    event.preventDefault();
  }
  if (!nextOptionEl) {
    hideList(comboBoxEl);
  }
};

/**
 * Select list option on the mouseover event.
 *
 * @param {MouseEvent} event The mouseover event
 * @param {HTMLLIElement} listOptionEl An element within the combo box component
 */
const handleMouseover = listOptionEl => {
  const isCurrentlyFocused = listOptionEl.classList.contains(LIST_OPTION_FOCUSED_CLASS);
  if (isCurrentlyFocused) return;
  highlightOption(listOptionEl, listOptionEl, {
    preventScroll: true
  });
};

/**
 * Toggle the list when the button is clicked
 *
 * @param {HTMLElement} el An element within the combo box component
 */
const toggleList = el => {
  const {
    comboBoxEl,
    listEl,
    inputEl
  } = getComboBoxContext(el);
  if (listEl.hidden) {
    displayList(comboBoxEl);
  } else {
    hideList(comboBoxEl);
  }
  inputEl.focus();
};

/**
 * Handle click from input
 *
 * @param {HTMLInputElement} el An element within the combo box component
 */
const handleClickFromInput = el => {
  const {
    comboBoxEl,
    listEl
  } = getComboBoxContext(el);
  if (listEl.hidden) {
    displayList(comboBoxEl);
  }
};
const comboBox = behavior({
  [CLICK]: {
    [INPUT]() {
      if (this.disabled) return;
      handleClickFromInput(this);
    },
    [TOGGLE_LIST_BUTTON]() {
      if (this.disabled) return;
      toggleList(this);
    },
    [LIST_OPTION]() {
      if (this.disabled) return;
      selectItem(this);
    },
    [CLEAR_INPUT_BUTTON]() {
      if (this.disabled) return;
      clearInput(this);
    }
  },
  focusout: {
    [COMBO_BOX](event) {
      if (!this.contains(event.relatedTarget)) {
        resetSelection(this);
        hideList(this);
      }
    }
  },
  keydown: {
    [COMBO_BOX]: keymap({
      Escape: handleEscape
    }),
    [INPUT]: keymap({
      Enter: handleEnterFromInput,
      ArrowDown: handleDownFromInput,
      Down: handleDownFromInput
    }),
    [LIST_OPTION]: keymap({
      ArrowUp: handleUpFromListOption,
      Up: handleUpFromListOption,
      ArrowDown: handleDownFromListOption,
      Down: handleDownFromListOption,
      Enter: handleEnterFromListOption,
      Tab: handleTabFromListOption,
      "Shift+Tab": noop
    })
  },
  input: {
    [INPUT]() {
      const comboBoxEl = this.closest(COMBO_BOX);
      comboBoxEl.classList.remove(COMBO_BOX_PRISTINE_CLASS);
      displayList(this);
    }
  },
  mouseover: {
    [LIST_OPTION]() {
      handleMouseover(this);
    }
  }
}, {
  init(root) {
    selectOrMatches(COMBO_BOX, root).forEach(comboBoxEl => {
      enhanceComboBox(comboBoxEl);
    });
  },
  getComboBoxContext,
  enhanceComboBox,
  generateDynamicRegExp,
  disable,
  enable,
  displayList,
  hideList,
  COMBO_BOX_CLASS
});
module.exports = comboBox;

},{"../../uswds-core/src/js/config":22,"../../uswds-core/src/js/events":23,"../../uswds-core/src/js/utils/behavior":31,"../../uswds-core/src/js/utils/sanitizer":36,"../../uswds-core/src/js/utils/select-or-matches":38,"receptor/keymap":54}],6:[function(require,module,exports){
"use strict";

const keymap = require("receptor/keymap");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const select = require("../../uswds-core/src/js/utils/select");
const selectOrMatches = require("../../uswds-core/src/js/utils/select-or-matches");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const {
  CLICK
} = require("../../uswds-core/src/js/events");
const activeElement = require("../../uswds-core/src/js/utils/active-element");
const isIosDevice = require("../../uswds-core/src/js/utils/is-ios-device");
const Sanitizer = require("../../uswds-core/src/js/utils/sanitizer");
const DATE_PICKER_CLASS = `${PREFIX}-date-picker`;
const DATE_PICKER_WRAPPER_CLASS = `${DATE_PICKER_CLASS}__wrapper`;
const DATE_PICKER_INITIALIZED_CLASS = `${DATE_PICKER_CLASS}--initialized`;
const DATE_PICKER_ACTIVE_CLASS = `${DATE_PICKER_CLASS}--active`;
const DATE_PICKER_INTERNAL_INPUT_CLASS = `${DATE_PICKER_CLASS}__internal-input`;
const DATE_PICKER_EXTERNAL_INPUT_CLASS = `${DATE_PICKER_CLASS}__external-input`;
const DATE_PICKER_BUTTON_CLASS = `${DATE_PICKER_CLASS}__button`;
const DATE_PICKER_CALENDAR_CLASS = `${DATE_PICKER_CLASS}__calendar`;
const DATE_PICKER_STATUS_CLASS = `${DATE_PICKER_CLASS}__status`;
const CALENDAR_DATE_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__date`;
const CALENDAR_DATE_FOCUSED_CLASS = `${CALENDAR_DATE_CLASS}--focused`;
const CALENDAR_DATE_SELECTED_CLASS = `${CALENDAR_DATE_CLASS}--selected`;
const CALENDAR_DATE_PREVIOUS_MONTH_CLASS = `${CALENDAR_DATE_CLASS}--previous-month`;
const CALENDAR_DATE_CURRENT_MONTH_CLASS = `${CALENDAR_DATE_CLASS}--current-month`;
const CALENDAR_DATE_NEXT_MONTH_CLASS = `${CALENDAR_DATE_CLASS}--next-month`;
const CALENDAR_DATE_RANGE_DATE_CLASS = `${CALENDAR_DATE_CLASS}--range-date`;
const CALENDAR_DATE_TODAY_CLASS = `${CALENDAR_DATE_CLASS}--today`;
const CALENDAR_DATE_RANGE_DATE_START_CLASS = `${CALENDAR_DATE_CLASS}--range-date-start`;
const CALENDAR_DATE_RANGE_DATE_END_CLASS = `${CALENDAR_DATE_CLASS}--range-date-end`;
const CALENDAR_DATE_WITHIN_RANGE_CLASS = `${CALENDAR_DATE_CLASS}--within-range`;
const CALENDAR_PREVIOUS_YEAR_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__previous-year`;
const CALENDAR_PREVIOUS_MONTH_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__previous-month`;
const CALENDAR_NEXT_YEAR_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__next-year`;
const CALENDAR_NEXT_MONTH_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__next-month`;
const CALENDAR_MONTH_SELECTION_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__month-selection`;
const CALENDAR_YEAR_SELECTION_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__year-selection`;
const CALENDAR_MONTH_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__month`;
const CALENDAR_MONTH_FOCUSED_CLASS = `${CALENDAR_MONTH_CLASS}--focused`;
const CALENDAR_MONTH_SELECTED_CLASS = `${CALENDAR_MONTH_CLASS}--selected`;
const CALENDAR_YEAR_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__year`;
const CALENDAR_YEAR_FOCUSED_CLASS = `${CALENDAR_YEAR_CLASS}--focused`;
const CALENDAR_YEAR_SELECTED_CLASS = `${CALENDAR_YEAR_CLASS}--selected`;
const CALENDAR_PREVIOUS_YEAR_CHUNK_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__previous-year-chunk`;
const CALENDAR_NEXT_YEAR_CHUNK_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__next-year-chunk`;
const CALENDAR_DATE_PICKER_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__date-picker`;
const CALENDAR_MONTH_PICKER_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__month-picker`;
const CALENDAR_YEAR_PICKER_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__year-picker`;
const CALENDAR_TABLE_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__table`;
const CALENDAR_ROW_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__row`;
const CALENDAR_CELL_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__cell`;
const CALENDAR_CELL_CENTER_ITEMS_CLASS = `${CALENDAR_CELL_CLASS}--center-items`;
const CALENDAR_MONTH_LABEL_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__month-label`;
const CALENDAR_DAY_OF_WEEK_CLASS = `${DATE_PICKER_CALENDAR_CLASS}__day-of-week`;
const DATE_PICKER = `.${DATE_PICKER_CLASS}`;
const DATE_PICKER_BUTTON = `.${DATE_PICKER_BUTTON_CLASS}`;
const DATE_PICKER_INTERNAL_INPUT = `.${DATE_PICKER_INTERNAL_INPUT_CLASS}`;
const DATE_PICKER_EXTERNAL_INPUT = `.${DATE_PICKER_EXTERNAL_INPUT_CLASS}`;
const DATE_PICKER_CALENDAR = `.${DATE_PICKER_CALENDAR_CLASS}`;
const DATE_PICKER_STATUS = `.${DATE_PICKER_STATUS_CLASS}`;
const CALENDAR_DATE = `.${CALENDAR_DATE_CLASS}`;
const CALENDAR_DATE_FOCUSED = `.${CALENDAR_DATE_FOCUSED_CLASS}`;
const CALENDAR_DATE_CURRENT_MONTH = `.${CALENDAR_DATE_CURRENT_MONTH_CLASS}`;
const CALENDAR_PREVIOUS_YEAR = `.${CALENDAR_PREVIOUS_YEAR_CLASS}`;
const CALENDAR_PREVIOUS_MONTH = `.${CALENDAR_PREVIOUS_MONTH_CLASS}`;
const CALENDAR_NEXT_YEAR = `.${CALENDAR_NEXT_YEAR_CLASS}`;
const CALENDAR_NEXT_MONTH = `.${CALENDAR_NEXT_MONTH_CLASS}`;
const CALENDAR_YEAR_SELECTION = `.${CALENDAR_YEAR_SELECTION_CLASS}`;
const CALENDAR_MONTH_SELECTION = `.${CALENDAR_MONTH_SELECTION_CLASS}`;
const CALENDAR_MONTH = `.${CALENDAR_MONTH_CLASS}`;
const CALENDAR_YEAR = `.${CALENDAR_YEAR_CLASS}`;
const CALENDAR_PREVIOUS_YEAR_CHUNK = `.${CALENDAR_PREVIOUS_YEAR_CHUNK_CLASS}`;
const CALENDAR_NEXT_YEAR_CHUNK = `.${CALENDAR_NEXT_YEAR_CHUNK_CLASS}`;
const CALENDAR_DATE_PICKER = `.${CALENDAR_DATE_PICKER_CLASS}`;
const CALENDAR_MONTH_PICKER = `.${CALENDAR_MONTH_PICKER_CLASS}`;
const CALENDAR_YEAR_PICKER = `.${CALENDAR_YEAR_PICKER_CLASS}`;
const CALENDAR_MONTH_FOCUSED = `.${CALENDAR_MONTH_FOCUSED_CLASS}`;
const CALENDAR_YEAR_FOCUSED = `.${CALENDAR_YEAR_FOCUSED_CLASS}`;
const VALIDATION_MESSAGE = "Please enter a valid date";
const MONTH_LABELS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_OF_WEEK_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ENTER_KEYCODE = 13;
const YEAR_CHUNK = 12;
const DEFAULT_MIN_DATE = "0000-01-01";
const DEFAULT_EXTERNAL_DATE_FORMAT = "MM/DD/YYYY";
const INTERNAL_DATE_FORMAT = "YYYY-MM-DD";
const NOT_DISABLED_SELECTOR = ":not([disabled])";
const processFocusableSelectors = function () {
  for (var _len = arguments.length, selectors = new Array(_len), _key = 0; _key < _len; _key++) {
    selectors[_key] = arguments[_key];
  }
  return selectors.map(query => query + NOT_DISABLED_SELECTOR).join(", ");
};
const DATE_PICKER_FOCUSABLE = processFocusableSelectors(CALENDAR_PREVIOUS_YEAR, CALENDAR_PREVIOUS_MONTH, CALENDAR_YEAR_SELECTION, CALENDAR_MONTH_SELECTION, CALENDAR_NEXT_YEAR, CALENDAR_NEXT_MONTH, CALENDAR_DATE_FOCUSED);
const MONTH_PICKER_FOCUSABLE = processFocusableSelectors(CALENDAR_MONTH_FOCUSED);
const YEAR_PICKER_FOCUSABLE = processFocusableSelectors(CALENDAR_PREVIOUS_YEAR_CHUNK, CALENDAR_NEXT_YEAR_CHUNK, CALENDAR_YEAR_FOCUSED);

// #region Date Manipulation Functions

/**
 * Keep date within month. Month would only be over by 1 to 3 days
 *
 * @param {Date} dateToCheck the date object to check
 * @param {number} month the correct month
 * @returns {Date} the date, corrected if needed
 */
const keepDateWithinMonth = (dateToCheck, month) => {
  if (month !== dateToCheck.getMonth()) {
    dateToCheck.setDate(0);
  }
  return dateToCheck;
};

/**
 * Set date from month day year
 *
 * @param {number} year the year to set
 * @param {number} month the month to set (zero-indexed)
 * @param {number} date the date to set
 * @returns {Date} the set date
 */
const setDate = (year, month, date) => {
  const newDate = new Date(0);
  newDate.setFullYear(year, month, date);
  return newDate;
};

/**
 * todays date
 *
 * @returns {Date} todays date
 */
const today = () => {
  const newDate = new Date();
  const day = newDate.getDate();
  const month = newDate.getMonth();
  const year = newDate.getFullYear();
  return setDate(year, month, day);
};

/**
 * Set date to first day of the month
 *
 * @param {number} date the date to adjust
 * @returns {Date} the adjusted date
 */
const startOfMonth = date => {
  const newDate = new Date(0);
  newDate.setFullYear(date.getFullYear(), date.getMonth(), 1);
  return newDate;
};

/**
 * Set date to last day of the month
 *
 * @param {number} date the date to adjust
 * @returns {Date} the adjusted date
 */
const lastDayOfMonth = date => {
  const newDate = new Date(0);
  newDate.setFullYear(date.getFullYear(), date.getMonth() + 1, 0);
  return newDate;
};

/**
 * Add days to date
 *
 * @param {Date} _date the date to adjust
 * @param {number} numDays the difference in days
 * @returns {Date} the adjusted date
 */
const addDays = (_date, numDays) => {
  const newDate = new Date(_date.getTime());
  newDate.setDate(newDate.getDate() + numDays);
  return newDate;
};

/**
 * Subtract days from date
 *
 * @param {Date} _date the date to adjust
 * @param {number} numDays the difference in days
 * @returns {Date} the adjusted date
 */
const subDays = (_date, numDays) => addDays(_date, -numDays);

/**
 * Add weeks to date
 *
 * @param {Date} _date the date to adjust
 * @param {number} numWeeks the difference in weeks
 * @returns {Date} the adjusted date
 */
const addWeeks = (_date, numWeeks) => addDays(_date, numWeeks * 7);

/**
 * Subtract weeks from date
 *
 * @param {Date} _date the date to adjust
 * @param {number} numWeeks the difference in weeks
 * @returns {Date} the adjusted date
 */
const subWeeks = (_date, numWeeks) => addWeeks(_date, -numWeeks);

/**
 * Set date to the start of the week (Sunday)
 *
 * @param {Date} _date the date to adjust
 * @returns {Date} the adjusted date
 */
const startOfWeek = _date => {
  const dayOfWeek = _date.getDay();
  return subDays(_date, dayOfWeek);
};

/**
 * Set date to the end of the week (Saturday)
 *
 * @param {Date} _date the date to adjust
 * @param {number} numWeeks the difference in weeks
 * @returns {Date} the adjusted date
 */
const endOfWeek = _date => {
  const dayOfWeek = _date.getDay();
  return addDays(_date, 6 - dayOfWeek);
};

/**
 * Add months to date and keep date within month
 *
 * @param {Date} _date the date to adjust
 * @param {number} numMonths the difference in months
 * @returns {Date} the adjusted date
 */
const addMonths = (_date, numMonths) => {
  const newDate = new Date(_date.getTime());
  const dateMonth = (newDate.getMonth() + 12 + numMonths) % 12;
  newDate.setMonth(newDate.getMonth() + numMonths);
  keepDateWithinMonth(newDate, dateMonth);
  return newDate;
};

/**
 * Subtract months from date
 *
 * @param {Date} _date the date to adjust
 * @param {number} numMonths the difference in months
 * @returns {Date} the adjusted date
 */
const subMonths = (_date, numMonths) => addMonths(_date, -numMonths);

/**
 * Add years to date and keep date within month
 *
 * @param {Date} _date the date to adjust
 * @param {number} numYears the difference in years
 * @returns {Date} the adjusted date
 */
const addYears = (_date, numYears) => addMonths(_date, numYears * 12);

/**
 * Subtract years from date
 *
 * @param {Date} _date the date to adjust
 * @param {number} numYears the difference in years
 * @returns {Date} the adjusted date
 */
const subYears = (_date, numYears) => addYears(_date, -numYears);

/**
 * Set months of date
 *
 * @param {Date} _date the date to adjust
 * @param {number} month zero-indexed month to set
 * @returns {Date} the adjusted date
 */
const setMonth = (_date, month) => {
  const newDate = new Date(_date.getTime());
  newDate.setMonth(month);
  keepDateWithinMonth(newDate, month);
  return newDate;
};

/**
 * Set year of date
 *
 * @param {Date} _date the date to adjust
 * @param {number} year the year to set
 * @returns {Date} the adjusted date
 */
const setYear = (_date, year) => {
  const newDate = new Date(_date.getTime());
  const month = newDate.getMonth();
  newDate.setFullYear(year);
  keepDateWithinMonth(newDate, month);
  return newDate;
};

/**
 * Return the earliest date
 *
 * @param {Date} dateA date to compare
 * @param {Date} dateB date to compare
 * @returns {Date} the earliest date
 */
const min = (dateA, dateB) => {
  let newDate = dateA;
  if (dateB < dateA) {
    newDate = dateB;
  }
  return new Date(newDate.getTime());
};

/**
 * Return the latest date
 *
 * @param {Date} dateA date to compare
 * @param {Date} dateB date to compare
 * @returns {Date} the latest date
 */
const max = (dateA, dateB) => {
  let newDate = dateA;
  if (dateB > dateA) {
    newDate = dateB;
  }
  return new Date(newDate.getTime());
};

/**
 * Check if dates are the in the same year
 *
 * @param {Date} dateA date to compare
 * @param {Date} dateB date to compare
 * @returns {boolean} are dates in the same year
 */
const isSameYear = (dateA, dateB) => dateA && dateB && dateA.getFullYear() === dateB.getFullYear();

/**
 * Check if dates are the in the same month
 *
 * @param {Date} dateA date to compare
 * @param {Date} dateB date to compare
 * @returns {boolean} are dates in the same month
 */
const isSameMonth = (dateA, dateB) => isSameYear(dateA, dateB) && dateA.getMonth() === dateB.getMonth();

/**
 * Check if dates are the same date
 *
 * @param {Date} dateA the date to compare
 * @param {Date} dateA the date to compare
 * @returns {boolean} are dates the same date
 */
const isSameDay = (dateA, dateB) => isSameMonth(dateA, dateB) && dateA.getDate() === dateB.getDate();

/**
 * return a new date within minimum and maximum date
 *
 * @param {Date} date date to check
 * @param {Date} minDate minimum date to allow
 * @param {Date} maxDate maximum date to allow
 * @returns {Date} the date between min and max
 */
const keepDateBetweenMinAndMax = (date, minDate, maxDate) => {
  let newDate = date;
  if (date < minDate) {
    newDate = minDate;
  } else if (maxDate && date > maxDate) {
    newDate = maxDate;
  }
  return new Date(newDate.getTime());
};

/**
 * Check if dates is valid.
 *
 * @param {Date} date date to check
 * @param {Date} minDate minimum date to allow
 * @param {Date} maxDate maximum date to allow
 * @return {boolean} is there a day within the month within min and max dates
 */
const isDateWithinMinAndMax = (date, minDate, maxDate) => date >= minDate && (!maxDate || date <= maxDate);

/**
 * Check if dates month is invalid.
 *
 * @param {Date} date date to check
 * @param {Date} minDate minimum date to allow
 * @param {Date} maxDate maximum date to allow
 * @return {boolean} is the month outside min or max dates
 */
const isDatesMonthOutsideMinOrMax = (date, minDate, maxDate) => lastDayOfMonth(date) < minDate || maxDate && startOfMonth(date) > maxDate;

/**
 * Check if dates year is invalid.
 *
 * @param {Date} date date to check
 * @param {Date} minDate minimum date to allow
 * @param {Date} maxDate maximum date to allow
 * @return {boolean} is the month outside min or max dates
 */
const isDatesYearOutsideMinOrMax = (date, minDate, maxDate) => lastDayOfMonth(setMonth(date, 11)) < minDate || maxDate && startOfMonth(setMonth(date, 0)) > maxDate;

/**
 * Parse a date with format M-D-YY
 *
 * @param {string} dateString the date string to parse
 * @param {string} dateFormat the format of the date string
 * @param {boolean} adjustDate should the date be adjusted
 * @returns {Date} the parsed date
 */
const parseDateString = function (dateString) {
  let dateFormat = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : INTERNAL_DATE_FORMAT;
  let adjustDate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  let date;
  let month;
  let day;
  let year;
  let parsed;
  if (dateString) {
    let monthStr;
    let dayStr;
    let yearStr;
    if (dateFormat === DEFAULT_EXTERNAL_DATE_FORMAT) {
      [monthStr, dayStr, yearStr] = dateString.split("/");
    } else {
      [yearStr, monthStr, dayStr] = dateString.split("-");
    }
    if (yearStr) {
      parsed = parseInt(yearStr, 10);
      if (!Number.isNaN(parsed)) {
        year = parsed;
        if (adjustDate) {
          year = Math.max(0, year);
          if (yearStr.length < 3) {
            const currentYear = today().getFullYear();
            const currentYearStub = currentYear - currentYear % 10 ** yearStr.length;
            year = currentYearStub + parsed;
          }
        }
      }
    }
    if (monthStr) {
      parsed = parseInt(monthStr, 10);
      if (!Number.isNaN(parsed)) {
        month = parsed;
        if (adjustDate) {
          month = Math.max(1, month);
          month = Math.min(12, month);
        }
      }
    }
    if (month && dayStr && year != null) {
      parsed = parseInt(dayStr, 10);
      if (!Number.isNaN(parsed)) {
        day = parsed;
        if (adjustDate) {
          const lastDayOfTheMonth = setDate(year, month, 0).getDate();
          day = Math.max(1, day);
          day = Math.min(lastDayOfTheMonth, day);
        }
      }
    }
    if (month && day && year != null) {
      date = setDate(year, month - 1, day);
    }
  }
  return date;
};

/**
 * Format a date to format MM-DD-YYYY
 *
 * @param {Date} date the date to format
 * @param {string} dateFormat the format of the date string
 * @returns {string} the formatted date string
 */
const formatDate = function (date) {
  let dateFormat = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : INTERNAL_DATE_FORMAT;
  const padZeros = (value, length) => `0000${value}`.slice(-length);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  if (dateFormat === DEFAULT_EXTERNAL_DATE_FORMAT) {
    return [padZeros(month, 2), padZeros(day, 2), padZeros(year, 4)].join("/");
  }
  return [padZeros(year, 4), padZeros(month, 2), padZeros(day, 2)].join("-");
};

// #endregion Date Manipulation Functions

/**
 * Create a grid string from an array of html strings
 *
 * @param {string[]} htmlArray the array of html items
 * @param {number} rowSize the length of a row
 * @returns {string} the grid string
 */
const listToGridHtml = (htmlArray, rowSize) => {
  const grid = [];
  let row = [];
  let i = 0;
  while (i < htmlArray.length) {
    row = [];
    const tr = document.createElement("tr");
    while (i < htmlArray.length && row.length < rowSize) {
      const td = document.createElement("td");
      td.insertAdjacentElement("beforeend", htmlArray[i]);
      row.push(td);
      i += 1;
    }
    row.forEach(element => {
      tr.insertAdjacentElement("beforeend", element);
    });
    grid.push(tr);
  }
  return grid;
};
const createTableBody = grid => {
  const tableBody = document.createElement("tbody");
  grid.forEach(element => {
    tableBody.insertAdjacentElement("beforeend", element);
  });
  return tableBody;
};

/**
 * set the value of the element and dispatch a change event
 *
 * @param {HTMLInputElement} el The element to update
 * @param {string} value The new value of the element
 */
const changeElementValue = function (el) {
  let value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
  const elementToChange = el;
  elementToChange.value = value;
  const event = new CustomEvent("change", {
    bubbles: true,
    cancelable: true,
    detail: {
      value
    }
  });
  elementToChange.dispatchEvent(event);
};

/**
 * The properties and elements within the date picker.
 * @typedef {Object} DatePickerContext
 * @property {HTMLDivElement} calendarEl
 * @property {HTMLElement} datePickerEl
 * @property {HTMLInputElement} internalInputEl
 * @property {HTMLInputElement} externalInputEl
 * @property {HTMLDivElement} statusEl
 * @property {HTMLDivElement} firstYearChunkEl
 * @property {Date} calendarDate
 * @property {Date} minDate
 * @property {Date} maxDate
 * @property {Date} selectedDate
 * @property {Date} rangeDate
 * @property {Date} defaultDate
 */

/**
 * Get an object of the properties and elements belonging directly to the given
 * date picker component.
 *
 * @param {HTMLElement} el the element within the date picker
 * @returns {DatePickerContext} elements
 */
const getDatePickerContext = el => {
  const datePickerEl = el.closest(DATE_PICKER);
  if (!datePickerEl) {
    throw new Error(`Element is missing outer ${DATE_PICKER}`);
  }
  const internalInputEl = datePickerEl.querySelector(DATE_PICKER_INTERNAL_INPUT);
  const externalInputEl = datePickerEl.querySelector(DATE_PICKER_EXTERNAL_INPUT);
  const calendarEl = datePickerEl.querySelector(DATE_PICKER_CALENDAR);
  const toggleBtnEl = datePickerEl.querySelector(DATE_PICKER_BUTTON);
  const statusEl = datePickerEl.querySelector(DATE_PICKER_STATUS);
  const firstYearChunkEl = datePickerEl.querySelector(CALENDAR_YEAR);
  const inputDate = parseDateString(externalInputEl.value, DEFAULT_EXTERNAL_DATE_FORMAT, true);
  const selectedDate = parseDateString(internalInputEl.value);
  const calendarDate = parseDateString(calendarEl.dataset.value);
  const minDate = parseDateString(datePickerEl.dataset.minDate);
  const maxDate = parseDateString(datePickerEl.dataset.maxDate);
  const rangeDate = parseDateString(datePickerEl.dataset.rangeDate);
  const defaultDate = parseDateString(datePickerEl.dataset.defaultDate);
  if (minDate && maxDate && minDate > maxDate) {
    throw new Error("Minimum date cannot be after maximum date");
  }
  return {
    calendarDate,
    minDate,
    toggleBtnEl,
    selectedDate,
    maxDate,
    firstYearChunkEl,
    datePickerEl,
    inputDate,
    internalInputEl,
    externalInputEl,
    calendarEl,
    rangeDate,
    defaultDate,
    statusEl
  };
};

/**
 * Disable the date picker component
 *
 * @param {HTMLElement} el An element within the date picker component
 */
const disable = el => {
  const {
    externalInputEl,
    toggleBtnEl
  } = getDatePickerContext(el);
  toggleBtnEl.disabled = true;
  externalInputEl.disabled = true;
};

/**
 * Enable the date picker component
 *
 * @param {HTMLElement} el An element within the date picker component
 */
const enable = el => {
  const {
    externalInputEl,
    toggleBtnEl
  } = getDatePickerContext(el);
  toggleBtnEl.disabled = false;
  externalInputEl.disabled = false;
};

// #region Validation

/**
 * Validate the value in the input as a valid date of format M/D/YYYY
 *
 * @param {HTMLElement} el An element within the date picker component
 */
const isDateInputInvalid = el => {
  const {
    externalInputEl,
    minDate,
    maxDate
  } = getDatePickerContext(el);
  const dateString = externalInputEl.value;
  let isInvalid = false;
  if (dateString) {
    isInvalid = true;
    const dateStringParts = dateString.split("/");
    const [month, day, year] = dateStringParts.map(str => {
      let value;
      const parsed = parseInt(str, 10);
      if (!Number.isNaN(parsed)) value = parsed;
      return value;
    });
    if (month && day && year != null) {
      const checkDate = setDate(year, month - 1, day);
      if (checkDate.getMonth() === month - 1 && checkDate.getDate() === day && checkDate.getFullYear() === year && dateStringParts[2].length === 4 && isDateWithinMinAndMax(checkDate, minDate, maxDate)) {
        isInvalid = false;
      }
    }
  }
  return isInvalid;
};

/**
 * Validate the value in the input as a valid date of format M/D/YYYY
 *
 * @param {HTMLElement} el An element within the date picker component
 */
const validateDateInput = el => {
  const {
    externalInputEl
  } = getDatePickerContext(el);
  const isInvalid = isDateInputInvalid(externalInputEl);
  if (isInvalid && !externalInputEl.validationMessage) {
    externalInputEl.setCustomValidity(VALIDATION_MESSAGE);
  }
  if (!isInvalid && externalInputEl.validationMessage === VALIDATION_MESSAGE) {
    externalInputEl.setCustomValidity("");
  }
};

// #endregion Validation

/**
 * Enable the date picker component
 *
 * @param {HTMLElement} el An element within the date picker component
 */
const reconcileInputValues = el => {
  const {
    internalInputEl,
    inputDate
  } = getDatePickerContext(el);
  let newValue = "";
  if (inputDate && !isDateInputInvalid(el)) {
    newValue = formatDate(inputDate);
  }
  if (internalInputEl.value !== newValue) {
    changeElementValue(internalInputEl, newValue);
  }
};

/**
 * Select the value of the date picker inputs.
 *
 * @param {HTMLButtonElement} el An element within the date picker component
 * @param {string} dateString The date string to update in YYYY-MM-DD format
 */
const setCalendarValue = (el, dateString) => {
  const parsedDate = parseDateString(dateString);
  if (parsedDate) {
    const formattedDate = formatDate(parsedDate, DEFAULT_EXTERNAL_DATE_FORMAT);
    const {
      datePickerEl,
      internalInputEl,
      externalInputEl
    } = getDatePickerContext(el);
    changeElementValue(internalInputEl, dateString);
    changeElementValue(externalInputEl, formattedDate);
    validateDateInput(datePickerEl);
  }
};

/**
 * Enhance an input with the date picker elements
 *
 * @param {HTMLElement} el The initial wrapping element of the date picker component
 */
const enhanceDatePicker = el => {
  const datePickerEl = el.closest(DATE_PICKER);
  const {
    defaultValue
  } = datePickerEl.dataset;
  const internalInputEl = datePickerEl.querySelector(`input`);
  if (!internalInputEl) {
    throw new Error(`${DATE_PICKER} is missing inner input`);
  }
  if (internalInputEl.value) {
    internalInputEl.value = "";
  }
  const minDate = parseDateString(datePickerEl.dataset.minDate || internalInputEl.getAttribute("min"));
  datePickerEl.dataset.minDate = minDate ? formatDate(minDate) : DEFAULT_MIN_DATE;
  const maxDate = parseDateString(datePickerEl.dataset.maxDate || internalInputEl.getAttribute("max"));
  if (maxDate) {
    datePickerEl.dataset.maxDate = formatDate(maxDate);
  }
  const calendarWrapper = document.createElement("div");
  calendarWrapper.classList.add(DATE_PICKER_WRAPPER_CLASS);
  const externalInputEl = internalInputEl.cloneNode();
  externalInputEl.classList.add(DATE_PICKER_EXTERNAL_INPUT_CLASS);
  externalInputEl.type = "text";
  calendarWrapper.appendChild(externalInputEl);
  calendarWrapper.insertAdjacentHTML("beforeend", Sanitizer.escapeHTML`
    <button type="button" class="${DATE_PICKER_BUTTON_CLASS}" aria-haspopup="true" aria-label="Toggle calendar"></button>
    <div class="${DATE_PICKER_CALENDAR_CLASS}" role="dialog" aria-modal="true" hidden></div>
    <div class="usa-sr-only ${DATE_PICKER_STATUS_CLASS}" role="status" aria-live="polite"></div>`);
  internalInputEl.setAttribute("aria-hidden", "true");
  internalInputEl.setAttribute("tabindex", "-1");
  internalInputEl.style.display = "none";
  internalInputEl.classList.add(DATE_PICKER_INTERNAL_INPUT_CLASS);
  internalInputEl.removeAttribute("id");
  internalInputEl.removeAttribute("name");
  internalInputEl.required = false;
  datePickerEl.appendChild(calendarWrapper);
  datePickerEl.classList.add(DATE_PICKER_INITIALIZED_CLASS);
  if (defaultValue) {
    setCalendarValue(datePickerEl, defaultValue);
  }
  if (internalInputEl.disabled) {
    disable(datePickerEl);
    internalInputEl.disabled = false;
  }
};

// #region Calendar - Date Selection View

/**
 * render the calendar.
 *
 * @param {HTMLElement} el An element within the date picker component
 * @param {Date} _dateToDisplay a date to render on the calendar
 * @returns {HTMLElement} a reference to the new calendar element
 */
const renderCalendar = (el, _dateToDisplay) => {
  const {
    datePickerEl,
    calendarEl,
    statusEl,
    selectedDate,
    maxDate,
    minDate,
    rangeDate
  } = getDatePickerContext(el);
  const todaysDate = today();
  let dateToDisplay = _dateToDisplay || todaysDate;
  const calendarWasHidden = calendarEl.hidden;
  const focusedDate = addDays(dateToDisplay, 0);
  const focusedMonth = dateToDisplay.getMonth();
  const focusedYear = dateToDisplay.getFullYear();
  const prevMonth = subMonths(dateToDisplay, 1);
  const nextMonth = addMonths(dateToDisplay, 1);
  const currentFormattedDate = formatDate(dateToDisplay);
  const firstOfMonth = startOfMonth(dateToDisplay);
  const prevButtonsDisabled = isSameMonth(dateToDisplay, minDate);
  const nextButtonsDisabled = isSameMonth(dateToDisplay, maxDate);
  const rangeConclusionDate = selectedDate || dateToDisplay;
  const rangeStartDate = rangeDate && min(rangeConclusionDate, rangeDate);
  const rangeEndDate = rangeDate && max(rangeConclusionDate, rangeDate);
  const withinRangeStartDate = rangeDate && addDays(rangeStartDate, 1);
  const withinRangeEndDate = rangeDate && subDays(rangeEndDate, 1);
  const monthLabel = MONTH_LABELS[focusedMonth];
  const generateDateHtml = dateToRender => {
    const classes = [CALENDAR_DATE_CLASS];
    const day = dateToRender.getDate();
    const month = dateToRender.getMonth();
    const year = dateToRender.getFullYear();
    const dayOfWeek = dateToRender.getDay();
    const formattedDate = formatDate(dateToRender);
    let tabindex = "-1";
    const isDisabled = !isDateWithinMinAndMax(dateToRender, minDate, maxDate);
    const isSelected = isSameDay(dateToRender, selectedDate);
    if (isSameMonth(dateToRender, prevMonth)) {
      classes.push(CALENDAR_DATE_PREVIOUS_MONTH_CLASS);
    }
    if (isSameMonth(dateToRender, focusedDate)) {
      classes.push(CALENDAR_DATE_CURRENT_MONTH_CLASS);
    }
    if (isSameMonth(dateToRender, nextMonth)) {
      classes.push(CALENDAR_DATE_NEXT_MONTH_CLASS);
    }
    if (isSelected) {
      classes.push(CALENDAR_DATE_SELECTED_CLASS);
    }
    if (isSameDay(dateToRender, todaysDate)) {
      classes.push(CALENDAR_DATE_TODAY_CLASS);
    }
    if (rangeDate) {
      if (isSameDay(dateToRender, rangeDate)) {
        classes.push(CALENDAR_DATE_RANGE_DATE_CLASS);
      }
      if (isSameDay(dateToRender, rangeStartDate)) {
        classes.push(CALENDAR_DATE_RANGE_DATE_START_CLASS);
      }
      if (isSameDay(dateToRender, rangeEndDate)) {
        classes.push(CALENDAR_DATE_RANGE_DATE_END_CLASS);
      }
      if (isDateWithinMinAndMax(dateToRender, withinRangeStartDate, withinRangeEndDate)) {
        classes.push(CALENDAR_DATE_WITHIN_RANGE_CLASS);
      }
    }
    if (isSameDay(dateToRender, focusedDate)) {
      tabindex = "0";
      classes.push(CALENDAR_DATE_FOCUSED_CLASS);
    }
    const monthStr = MONTH_LABELS[month];
    const dayStr = DAY_OF_WEEK_LABELS[dayOfWeek];
    const btn = document.createElement("button");
    btn.setAttribute("type", "button");
    btn.setAttribute("tabindex", tabindex);
    btn.setAttribute("class", classes.join(" "));
    btn.setAttribute("data-day", day);
    btn.setAttribute("data-month", month + 1);
    btn.setAttribute("data-year", year);
    btn.setAttribute("data-value", formattedDate);
    btn.setAttribute("aria-label", Sanitizer.escapeHTML`${day} ${monthStr} ${year} ${dayStr}`);
    btn.setAttribute("aria-selected", isSelected ? "true" : "false");
    if (isDisabled === true) {
      btn.disabled = true;
    }
    btn.textContent = day;
    return btn;
  };

  // set date to first rendered day
  dateToDisplay = startOfWeek(firstOfMonth);
  const days = [];
  while (days.length < 28 || dateToDisplay.getMonth() === focusedMonth || days.length % 7 !== 0) {
    days.push(generateDateHtml(dateToDisplay));
    dateToDisplay = addDays(dateToDisplay, 1);
  }
  const datesGrid = listToGridHtml(days, 7);
  const newCalendar = calendarEl.cloneNode();
  newCalendar.dataset.value = currentFormattedDate;
  newCalendar.style.top = `${datePickerEl.offsetHeight}px`;
  newCalendar.hidden = false;
  newCalendar.innerHTML = Sanitizer.escapeHTML`
    <div tabindex="-1" class="${CALENDAR_DATE_PICKER_CLASS}">
      <div class="${CALENDAR_ROW_CLASS}">
        <div class="${CALENDAR_CELL_CLASS} ${CALENDAR_CELL_CENTER_ITEMS_CLASS}">
          <button
            type="button"
            class="${CALENDAR_PREVIOUS_YEAR_CLASS}"
            aria-label="Navigate back one year"
            ${prevButtonsDisabled ? `disabled="disabled"` : ""}
          ></button>
        </div>
        <div class="${CALENDAR_CELL_CLASS} ${CALENDAR_CELL_CENTER_ITEMS_CLASS}">
          <button
            type="button"
            class="${CALENDAR_PREVIOUS_MONTH_CLASS}"
            aria-label="Navigate back one month"
            ${prevButtonsDisabled ? `disabled="disabled"` : ""}
          ></button>
        </div>
        <div class="${CALENDAR_CELL_CLASS} ${CALENDAR_MONTH_LABEL_CLASS}">
          <button
            type="button"
            class="${CALENDAR_MONTH_SELECTION_CLASS}" aria-label="${monthLabel}. Click to select month"
          >${monthLabel}</button>
          <button
            type="button"
            class="${CALENDAR_YEAR_SELECTION_CLASS}" aria-label="${focusedYear}. Click to select year"
          >${focusedYear}</button>
        </div>
        <div class="${CALENDAR_CELL_CLASS} ${CALENDAR_CELL_CENTER_ITEMS_CLASS}">
          <button
            type="button"
            class="${CALENDAR_NEXT_MONTH_CLASS}"
            aria-label="Navigate forward one month"
            ${nextButtonsDisabled ? `disabled="disabled"` : ""}
          ></button>
        </div>
        <div class="${CALENDAR_CELL_CLASS} ${CALENDAR_CELL_CENTER_ITEMS_CLASS}">
          <button
            type="button"
            class="${CALENDAR_NEXT_YEAR_CLASS}"
            aria-label="Navigate forward one year"
            ${nextButtonsDisabled ? `disabled="disabled"` : ""}
          ></button>
        </div>
      </div>
    </div>
    `;
  const table = document.createElement("table");
  table.setAttribute("class", CALENDAR_TABLE_CLASS);
  table.setAttribute("role", "presentation");
  const tableHead = document.createElement("thead");
  table.insertAdjacentElement("beforeend", tableHead);
  const tableHeadRow = document.createElement("tr");
  tableHead.insertAdjacentElement("beforeend", tableHeadRow);
  const daysOfWeek = {
    Sunday: "S",
    Monday: "M",
    Tuesday: "T",
    Wednesday: "W",
    Thursday: "Th",
    Friday: "Fr",
    Saturday: "S"
  };
  Object.keys(daysOfWeek).forEach(key => {
    const th = document.createElement("th");
    th.setAttribute("class", CALENDAR_DAY_OF_WEEK_CLASS);
    th.setAttribute("scope", "presentation");
    th.setAttribute("aria-label", key);
    th.textContent = daysOfWeek[key];
    tableHeadRow.insertAdjacentElement("beforeend", th);
  });
  const tableBody = createTableBody(datesGrid);
  table.insertAdjacentElement("beforeend", tableBody);

  // Container for Years, Months, and Days
  const datePickerCalendarContainer = newCalendar.querySelector(CALENDAR_DATE_PICKER);
  datePickerCalendarContainer.insertAdjacentElement("beforeend", table);
  calendarEl.parentNode.replaceChild(newCalendar, calendarEl);
  datePickerEl.classList.add(DATE_PICKER_ACTIVE_CLASS);
  const statuses = [];
  if (isSameDay(selectedDate, focusedDate)) {
    statuses.push("Selected date");
  }
  if (calendarWasHidden) {
    statuses.push("You can navigate by day using left and right arrows", "Weeks by using up and down arrows", "Months by using page up and page down keys", "Years by using shift plus page up and shift plus page down", "Home and end keys navigate to the beginning and end of a week");
    statusEl.textContent = "";
  } else {
    statuses.push(`${monthLabel} ${focusedYear}`);
  }
  statusEl.textContent = statuses.join(". ");
  return newCalendar;
};

/**
 * Navigate back one year and display the calendar.
 *
 * @param {HTMLButtonElement} _buttonEl An element within the date picker component
 */
const displayPreviousYear = _buttonEl => {
  if (_buttonEl.disabled) return;
  const {
    calendarEl,
    calendarDate,
    minDate,
    maxDate
  } = getDatePickerContext(_buttonEl);
  let date = subYears(calendarDate, 1);
  date = keepDateBetweenMinAndMax(date, minDate, maxDate);
  const newCalendar = renderCalendar(calendarEl, date);
  let nextToFocus = newCalendar.querySelector(CALENDAR_PREVIOUS_YEAR);
  if (nextToFocus.disabled) {
    nextToFocus = newCalendar.querySelector(CALENDAR_DATE_PICKER);
  }
  nextToFocus.focus();
};

/**
 * Navigate back one month and display the calendar.
 *
 * @param {HTMLButtonElement} _buttonEl An element within the date picker component
 */
const displayPreviousMonth = _buttonEl => {
  if (_buttonEl.disabled) return;
  const {
    calendarEl,
    calendarDate,
    minDate,
    maxDate
  } = getDatePickerContext(_buttonEl);
  let date = subMonths(calendarDate, 1);
  date = keepDateBetweenMinAndMax(date, minDate, maxDate);
  const newCalendar = renderCalendar(calendarEl, date);
  let nextToFocus = newCalendar.querySelector(CALENDAR_PREVIOUS_MONTH);
  if (nextToFocus.disabled) {
    nextToFocus = newCalendar.querySelector(CALENDAR_DATE_PICKER);
  }
  nextToFocus.focus();
};

/**
 * Navigate forward one month and display the calendar.
 *
 * @param {HTMLButtonElement} _buttonEl An element within the date picker component
 */
const displayNextMonth = _buttonEl => {
  if (_buttonEl.disabled) return;
  const {
    calendarEl,
    calendarDate,
    minDate,
    maxDate
  } = getDatePickerContext(_buttonEl);
  let date = addMonths(calendarDate, 1);
  date = keepDateBetweenMinAndMax(date, minDate, maxDate);
  const newCalendar = renderCalendar(calendarEl, date);
  let nextToFocus = newCalendar.querySelector(CALENDAR_NEXT_MONTH);
  if (nextToFocus.disabled) {
    nextToFocus = newCalendar.querySelector(CALENDAR_DATE_PICKER);
  }
  nextToFocus.focus();
};

/**
 * Navigate forward one year and display the calendar.
 *
 * @param {HTMLButtonElement} _buttonEl An element within the date picker component
 */
const displayNextYear = _buttonEl => {
  if (_buttonEl.disabled) return;
  const {
    calendarEl,
    calendarDate,
    minDate,
    maxDate
  } = getDatePickerContext(_buttonEl);
  let date = addYears(calendarDate, 1);
  date = keepDateBetweenMinAndMax(date, minDate, maxDate);
  const newCalendar = renderCalendar(calendarEl, date);
  let nextToFocus = newCalendar.querySelector(CALENDAR_NEXT_YEAR);
  if (nextToFocus.disabled) {
    nextToFocus = newCalendar.querySelector(CALENDAR_DATE_PICKER);
  }
  nextToFocus.focus();
};

/**
 * Hide the calendar of a date picker component.
 *
 * @param {HTMLElement} el An element within the date picker component
 */
const hideCalendar = el => {
  const {
    datePickerEl,
    calendarEl,
    statusEl
  } = getDatePickerContext(el);
  datePickerEl.classList.remove(DATE_PICKER_ACTIVE_CLASS);
  calendarEl.hidden = true;
  statusEl.textContent = "";
};

/**
 * Select a date within the date picker component.
 *
 * @param {HTMLButtonElement} calendarDateEl A date element within the date picker component
 */
const selectDate = calendarDateEl => {
  if (calendarDateEl.disabled) return;
  const {
    datePickerEl,
    externalInputEl
  } = getDatePickerContext(calendarDateEl);
  setCalendarValue(calendarDateEl, calendarDateEl.dataset.value);
  hideCalendar(datePickerEl);
  externalInputEl.focus();
};

/**
 * Toggle the calendar.
 *
 * @param {HTMLButtonElement} el An element within the date picker component
 */
const toggleCalendar = el => {
  if (el.disabled) return;
  const {
    calendarEl,
    inputDate,
    minDate,
    maxDate,
    defaultDate
  } = getDatePickerContext(el);
  if (calendarEl.hidden) {
    const dateToDisplay = keepDateBetweenMinAndMax(inputDate || defaultDate || today(), minDate, maxDate);
    const newCalendar = renderCalendar(calendarEl, dateToDisplay);
    newCalendar.querySelector(CALENDAR_DATE_FOCUSED).focus();
  } else {
    hideCalendar(el);
  }
};

/**
 * Update the calendar when visible.
 *
 * @param {HTMLElement} el an element within the date picker
 */
const updateCalendarIfVisible = el => {
  const {
    calendarEl,
    inputDate,
    minDate,
    maxDate
  } = getDatePickerContext(el);
  const calendarShown = !calendarEl.hidden;
  if (calendarShown && inputDate) {
    const dateToDisplay = keepDateBetweenMinAndMax(inputDate, minDate, maxDate);
    renderCalendar(calendarEl, dateToDisplay);
  }
};

// #endregion Calendar - Date Selection View

// #region Calendar - Month Selection View
/**
 * Display the month selection screen in the date picker.
 *
 * @param {HTMLButtonElement} el An element within the date picker component
 * @returns {HTMLElement} a reference to the new calendar element
 */
const displayMonthSelection = (el, monthToDisplay) => {
  const {
    calendarEl,
    statusEl,
    calendarDate,
    minDate,
    maxDate
  } = getDatePickerContext(el);
  const selectedMonth = calendarDate.getMonth();
  const focusedMonth = monthToDisplay == null ? selectedMonth : monthToDisplay;
  const months = MONTH_LABELS.map((month, index) => {
    const monthToCheck = setMonth(calendarDate, index);
    const isDisabled = isDatesMonthOutsideMinOrMax(monthToCheck, minDate, maxDate);
    let tabindex = "-1";
    const classes = [CALENDAR_MONTH_CLASS];
    const isSelected = index === selectedMonth;
    if (index === focusedMonth) {
      tabindex = "0";
      classes.push(CALENDAR_MONTH_FOCUSED_CLASS);
    }
    if (isSelected) {
      classes.push(CALENDAR_MONTH_SELECTED_CLASS);
    }
    const btn = document.createElement("button");
    btn.setAttribute("type", "button");
    btn.setAttribute("tabindex", tabindex);
    btn.setAttribute("class", classes.join(" "));
    btn.setAttribute("data-value", index);
    btn.setAttribute("data-label", month);
    btn.setAttribute("aria-selected", isSelected ? "true" : "false");
    if (isDisabled === true) {
      btn.disabled = true;
    }
    btn.textContent = month;
    return btn;
  });
  const monthsHtml = document.createElement("div");
  monthsHtml.setAttribute("tabindex", "-1");
  monthsHtml.setAttribute("class", CALENDAR_MONTH_PICKER_CLASS);
  const table = document.createElement("table");
  table.setAttribute("class", CALENDAR_TABLE_CLASS);
  table.setAttribute("role", "presentation");
  const monthsGrid = listToGridHtml(months, 3);
  const tableBody = createTableBody(monthsGrid);
  table.insertAdjacentElement("beforeend", tableBody);
  monthsHtml.insertAdjacentElement("beforeend", table);
  const newCalendar = calendarEl.cloneNode();
  newCalendar.insertAdjacentElement("beforeend", monthsHtml);
  calendarEl.parentNode.replaceChild(newCalendar, calendarEl);
  statusEl.textContent = "Select a month.";
  return newCalendar;
};

/**
 * Select a month in the date picker component.
 *
 * @param {HTMLButtonElement} monthEl An month element within the date picker component
 */
const selectMonth = monthEl => {
  if (monthEl.disabled) return;
  const {
    calendarEl,
    calendarDate,
    minDate,
    maxDate
  } = getDatePickerContext(monthEl);
  const selectedMonth = parseInt(monthEl.dataset.value, 10);
  let date = setMonth(calendarDate, selectedMonth);
  date = keepDateBetweenMinAndMax(date, minDate, maxDate);
  const newCalendar = renderCalendar(calendarEl, date);
  newCalendar.querySelector(CALENDAR_DATE_FOCUSED).focus();
};

// #endregion Calendar - Month Selection View

// #region Calendar - Year Selection View

/**
 * Display the year selection screen in the date picker.
 *
 * @param {HTMLButtonElement} el An element within the date picker component
 * @param {number} yearToDisplay year to display in year selection
 * @returns {HTMLElement} a reference to the new calendar element
 */
const displayYearSelection = (el, yearToDisplay) => {
  const {
    calendarEl,
    statusEl,
    calendarDate,
    minDate,
    maxDate
  } = getDatePickerContext(el);
  const selectedYear = calendarDate.getFullYear();
  const focusedYear = yearToDisplay == null ? selectedYear : yearToDisplay;
  let yearToChunk = focusedYear;
  yearToChunk -= yearToChunk % YEAR_CHUNK;
  yearToChunk = Math.max(0, yearToChunk);
  const prevYearChunkDisabled = isDatesYearOutsideMinOrMax(setYear(calendarDate, yearToChunk - 1), minDate, maxDate);
  const nextYearChunkDisabled = isDatesYearOutsideMinOrMax(setYear(calendarDate, yearToChunk + YEAR_CHUNK), minDate, maxDate);
  const years = [];
  let yearIndex = yearToChunk;
  while (years.length < YEAR_CHUNK) {
    const isDisabled = isDatesYearOutsideMinOrMax(setYear(calendarDate, yearIndex), minDate, maxDate);
    let tabindex = "-1";
    const classes = [CALENDAR_YEAR_CLASS];
    const isSelected = yearIndex === selectedYear;
    if (yearIndex === focusedYear) {
      tabindex = "0";
      classes.push(CALENDAR_YEAR_FOCUSED_CLASS);
    }
    if (isSelected) {
      classes.push(CALENDAR_YEAR_SELECTED_CLASS);
    }
    const btn = document.createElement("button");
    btn.setAttribute("type", "button");
    btn.setAttribute("tabindex", tabindex);
    btn.setAttribute("class", classes.join(" "));
    btn.setAttribute("data-value", yearIndex);
    btn.setAttribute("aria-selected", isSelected ? "true" : "false");
    if (isDisabled === true) {
      btn.disabled = true;
    }
    btn.textContent = yearIndex;
    years.push(btn);
    yearIndex += 1;
  }
  const newCalendar = calendarEl.cloneNode();

  // create the years calendar wrapper
  const yearsCalendarWrapper = document.createElement("div");
  yearsCalendarWrapper.setAttribute("tabindex", "-1");
  yearsCalendarWrapper.setAttribute("class", CALENDAR_YEAR_PICKER_CLASS);

  // create table parent
  const yearsTableParent = document.createElement("table");
  yearsTableParent.setAttribute("role", "presentation");
  yearsTableParent.setAttribute("class", CALENDAR_TABLE_CLASS);

  // create table body and table row
  const yearsHTMLTableBody = document.createElement("tbody");
  const yearsHTMLTableBodyRow = document.createElement("tr");

  // create previous button
  const previousYearsBtn = document.createElement("button");
  previousYearsBtn.setAttribute("type", "button");
  previousYearsBtn.setAttribute("class", CALENDAR_PREVIOUS_YEAR_CHUNK_CLASS);
  previousYearsBtn.setAttribute("aria-label", `Navigate back ${YEAR_CHUNK} years`);
  if (prevYearChunkDisabled === true) {
    previousYearsBtn.disabled = true;
  }
  previousYearsBtn.innerHTML = Sanitizer.escapeHTML`&nbsp`;

  // create next button
  const nextYearsBtn = document.createElement("button");
  nextYearsBtn.setAttribute("type", "button");
  nextYearsBtn.setAttribute("class", CALENDAR_NEXT_YEAR_CHUNK_CLASS);
  nextYearsBtn.setAttribute("aria-label", `Navigate forward ${YEAR_CHUNK} years`);
  if (nextYearChunkDisabled === true) {
    nextYearsBtn.disabled = true;
  }
  nextYearsBtn.innerHTML = Sanitizer.escapeHTML`&nbsp`;

  // create the actual years table
  const yearsTable = document.createElement("table");
  yearsTable.setAttribute("class", CALENDAR_TABLE_CLASS);
  yearsTable.setAttribute("role", "presentation");

  // create the years child table
  const yearsGrid = listToGridHtml(years, 3);
  const yearsTableBody = createTableBody(yearsGrid);

  // append the grid to the years child table
  yearsTable.insertAdjacentElement("beforeend", yearsTableBody);

  // create the prev button td and append the prev button
  const yearsHTMLTableBodyDetailPrev = document.createElement("td");
  yearsHTMLTableBodyDetailPrev.insertAdjacentElement("beforeend", previousYearsBtn);

  // create the years td and append the years child table
  const yearsHTMLTableBodyYearsDetail = document.createElement("td");
  yearsHTMLTableBodyYearsDetail.setAttribute("colspan", "3");
  yearsHTMLTableBodyYearsDetail.insertAdjacentElement("beforeend", yearsTable);

  // create the next button td and append the next button
  const yearsHTMLTableBodyDetailNext = document.createElement("td");
  yearsHTMLTableBodyDetailNext.insertAdjacentElement("beforeend", nextYearsBtn);

  // append the three td to the years child table row
  yearsHTMLTableBodyRow.insertAdjacentElement("beforeend", yearsHTMLTableBodyDetailPrev);
  yearsHTMLTableBodyRow.insertAdjacentElement("beforeend", yearsHTMLTableBodyYearsDetail);
  yearsHTMLTableBodyRow.insertAdjacentElement("beforeend", yearsHTMLTableBodyDetailNext);

  // append the table row to the years child table body
  yearsHTMLTableBody.insertAdjacentElement("beforeend", yearsHTMLTableBodyRow);

  // append the years table body to the years parent table
  yearsTableParent.insertAdjacentElement("beforeend", yearsHTMLTableBody);

  // append the parent table to the calendar wrapper
  yearsCalendarWrapper.insertAdjacentElement("beforeend", yearsTableParent);

  // append the years calender to the new calendar
  newCalendar.insertAdjacentElement("beforeend", yearsCalendarWrapper);

  // replace calendar
  calendarEl.parentNode.replaceChild(newCalendar, calendarEl);
  statusEl.textContent = Sanitizer.escapeHTML`Showing years ${yearToChunk} to ${yearToChunk + YEAR_CHUNK - 1}. Select a year.`;
  return newCalendar;
};

/**
 * Navigate back by years and display the year selection screen.
 *
 * @param {HTMLButtonElement} el An element within the date picker component
 */
const displayPreviousYearChunk = el => {
  if (el.disabled) return;
  const {
    calendarEl,
    calendarDate,
    minDate,
    maxDate
  } = getDatePickerContext(el);
  const yearEl = calendarEl.querySelector(CALENDAR_YEAR_FOCUSED);
  const selectedYear = parseInt(yearEl.textContent, 10);
  let adjustedYear = selectedYear - YEAR_CHUNK;
  adjustedYear = Math.max(0, adjustedYear);
  const date = setYear(calendarDate, adjustedYear);
  const cappedDate = keepDateBetweenMinAndMax(date, minDate, maxDate);
  const newCalendar = displayYearSelection(calendarEl, cappedDate.getFullYear());
  let nextToFocus = newCalendar.querySelector(CALENDAR_PREVIOUS_YEAR_CHUNK);
  if (nextToFocus.disabled) {
    nextToFocus = newCalendar.querySelector(CALENDAR_YEAR_PICKER);
  }
  nextToFocus.focus();
};

/**
 * Navigate forward by years and display the year selection screen.
 *
 * @param {HTMLButtonElement} el An element within the date picker component
 */
const displayNextYearChunk = el => {
  if (el.disabled) return;
  const {
    calendarEl,
    calendarDate,
    minDate,
    maxDate
  } = getDatePickerContext(el);
  const yearEl = calendarEl.querySelector(CALENDAR_YEAR_FOCUSED);
  const selectedYear = parseInt(yearEl.textContent, 10);
  let adjustedYear = selectedYear + YEAR_CHUNK;
  adjustedYear = Math.max(0, adjustedYear);
  const date = setYear(calendarDate, adjustedYear);
  const cappedDate = keepDateBetweenMinAndMax(date, minDate, maxDate);
  const newCalendar = displayYearSelection(calendarEl, cappedDate.getFullYear());
  let nextToFocus = newCalendar.querySelector(CALENDAR_NEXT_YEAR_CHUNK);
  if (nextToFocus.disabled) {
    nextToFocus = newCalendar.querySelector(CALENDAR_YEAR_PICKER);
  }
  nextToFocus.focus();
};

/**
 * Select a year in the date picker component.
 *
 * @param {HTMLButtonElement} yearEl A year element within the date picker component
 */
const selectYear = yearEl => {
  if (yearEl.disabled) return;
  const {
    calendarEl,
    calendarDate,
    minDate,
    maxDate
  } = getDatePickerContext(yearEl);
  const selectedYear = parseInt(yearEl.innerHTML, 10);
  let date = setYear(calendarDate, selectedYear);
  date = keepDateBetweenMinAndMax(date, minDate, maxDate);
  const newCalendar = renderCalendar(calendarEl, date);
  newCalendar.querySelector(CALENDAR_DATE_FOCUSED).focus();
};

// #endregion Calendar - Year Selection View

// #region Calendar Event Handling

/**
 * Hide the calendar.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleEscapeFromCalendar = event => {
  const {
    datePickerEl,
    externalInputEl
  } = getDatePickerContext(event.target);
  hideCalendar(datePickerEl);
  externalInputEl.focus();
  event.preventDefault();
};

// #endregion Calendar Event Handling

// #region Calendar Date Event Handling

/**
 * Adjust the date and display the calendar if needed.
 *
 * @param {function} adjustDateFn function that returns the adjusted date
 */
const adjustCalendar = adjustDateFn => event => {
  const {
    calendarEl,
    calendarDate,
    minDate,
    maxDate
  } = getDatePickerContext(event.target);
  const date = adjustDateFn(calendarDate);
  const cappedDate = keepDateBetweenMinAndMax(date, minDate, maxDate);
  if (!isSameDay(calendarDate, cappedDate)) {
    const newCalendar = renderCalendar(calendarEl, cappedDate);
    newCalendar.querySelector(CALENDAR_DATE_FOCUSED).focus();
  }
  event.preventDefault();
};

/**
 * Navigate back one week and display the calendar.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleUpFromDate = adjustCalendar(date => subWeeks(date, 1));

/**
 * Navigate forward one week and display the calendar.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleDownFromDate = adjustCalendar(date => addWeeks(date, 1));

/**
 * Navigate back one day and display the calendar.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleLeftFromDate = adjustCalendar(date => subDays(date, 1));

/**
 * Navigate forward one day and display the calendar.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleRightFromDate = adjustCalendar(date => addDays(date, 1));

/**
 * Navigate to the start of the week and display the calendar.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleHomeFromDate = adjustCalendar(date => startOfWeek(date));

/**
 * Navigate to the end of the week and display the calendar.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleEndFromDate = adjustCalendar(date => endOfWeek(date));

/**
 * Navigate forward one month and display the calendar.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handlePageDownFromDate = adjustCalendar(date => addMonths(date, 1));

/**
 * Navigate back one month and display the calendar.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handlePageUpFromDate = adjustCalendar(date => subMonths(date, 1));

/**
 * Navigate forward one year and display the calendar.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleShiftPageDownFromDate = adjustCalendar(date => addYears(date, 1));

/**
 * Navigate back one year and display the calendar.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleShiftPageUpFromDate = adjustCalendar(date => subYears(date, 1));

/**
 * display the calendar for the mouseover date.
 *
 * @param {MouseEvent} event The mouseover event
 * @param {HTMLButtonElement} dateEl A date element within the date picker component
 */
const handleMouseoverFromDate = dateEl => {
  if (dateEl.disabled) return;
  const calendarEl = dateEl.closest(DATE_PICKER_CALENDAR);
  const currentCalendarDate = calendarEl.dataset.value;
  const hoverDate = dateEl.dataset.value;
  if (hoverDate === currentCalendarDate) return;
  const dateToDisplay = parseDateString(hoverDate);
  const newCalendar = renderCalendar(calendarEl, dateToDisplay);
  newCalendar.querySelector(CALENDAR_DATE_FOCUSED).focus();
};

// #endregion Calendar Date Event Handling

// #region Calendar Month Event Handling

/**
 * Adjust the month and display the month selection screen if needed.
 *
 * @param {function} adjustMonthFn function that returns the adjusted month
 */
const adjustMonthSelectionScreen = adjustMonthFn => event => {
  const monthEl = event.target;
  const selectedMonth = parseInt(monthEl.dataset.value, 10);
  const {
    calendarEl,
    calendarDate,
    minDate,
    maxDate
  } = getDatePickerContext(monthEl);
  const currentDate = setMonth(calendarDate, selectedMonth);
  let adjustedMonth = adjustMonthFn(selectedMonth);
  adjustedMonth = Math.max(0, Math.min(11, adjustedMonth));
  const date = setMonth(calendarDate, adjustedMonth);
  const cappedDate = keepDateBetweenMinAndMax(date, minDate, maxDate);
  if (!isSameMonth(currentDate, cappedDate)) {
    const newCalendar = displayMonthSelection(calendarEl, cappedDate.getMonth());
    newCalendar.querySelector(CALENDAR_MONTH_FOCUSED).focus();
  }
  event.preventDefault();
};

/**
 * Navigate back three months and display the month selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleUpFromMonth = adjustMonthSelectionScreen(month => month - 3);

/**
 * Navigate forward three months and display the month selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleDownFromMonth = adjustMonthSelectionScreen(month => month + 3);

/**
 * Navigate back one month and display the month selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleLeftFromMonth = adjustMonthSelectionScreen(month => month - 1);

/**
 * Navigate forward one month and display the month selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleRightFromMonth = adjustMonthSelectionScreen(month => month + 1);

/**
 * Navigate to the start of the row of months and display the month selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleHomeFromMonth = adjustMonthSelectionScreen(month => month - month % 3);

/**
 * Navigate to the end of the row of months and display the month selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleEndFromMonth = adjustMonthSelectionScreen(month => month + 2 - month % 3);

/**
 * Navigate to the last month (December) and display the month selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handlePageDownFromMonth = adjustMonthSelectionScreen(() => 11);

/**
 * Navigate to the first month (January) and display the month selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handlePageUpFromMonth = adjustMonthSelectionScreen(() => 0);

/**
 * update the focus on a month when the mouse moves.
 *
 * @param {MouseEvent} event The mouseover event
 * @param {HTMLButtonElement} monthEl A month element within the date picker component
 */
const handleMouseoverFromMonth = monthEl => {
  if (monthEl.disabled) return;
  if (monthEl.classList.contains(CALENDAR_MONTH_FOCUSED_CLASS)) return;
  const focusMonth = parseInt(monthEl.dataset.value, 10);
  const newCalendar = displayMonthSelection(monthEl, focusMonth);
  newCalendar.querySelector(CALENDAR_MONTH_FOCUSED).focus();
};

// #endregion Calendar Month Event Handling

// #region Calendar Year Event Handling

/**
 * Adjust the year and display the year selection screen if needed.
 *
 * @param {function} adjustYearFn function that returns the adjusted year
 */
const adjustYearSelectionScreen = adjustYearFn => event => {
  const yearEl = event.target;
  const selectedYear = parseInt(yearEl.dataset.value, 10);
  const {
    calendarEl,
    calendarDate,
    minDate,
    maxDate
  } = getDatePickerContext(yearEl);
  const currentDate = setYear(calendarDate, selectedYear);
  let adjustedYear = adjustYearFn(selectedYear);
  adjustedYear = Math.max(0, adjustedYear);
  const date = setYear(calendarDate, adjustedYear);
  const cappedDate = keepDateBetweenMinAndMax(date, minDate, maxDate);
  if (!isSameYear(currentDate, cappedDate)) {
    const newCalendar = displayYearSelection(calendarEl, cappedDate.getFullYear());
    newCalendar.querySelector(CALENDAR_YEAR_FOCUSED).focus();
  }
  event.preventDefault();
};

/**
 * Navigate back three years and display the year selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleUpFromYear = adjustYearSelectionScreen(year => year - 3);

/**
 * Navigate forward three years and display the year selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleDownFromYear = adjustYearSelectionScreen(year => year + 3);

/**
 * Navigate back one year and display the year selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleLeftFromYear = adjustYearSelectionScreen(year => year - 1);

/**
 * Navigate forward one year and display the year selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleRightFromYear = adjustYearSelectionScreen(year => year + 1);

/**
 * Navigate to the start of the row of years and display the year selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleHomeFromYear = adjustYearSelectionScreen(year => year - year % 3);

/**
 * Navigate to the end of the row of years and display the year selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handleEndFromYear = adjustYearSelectionScreen(year => year + 2 - year % 3);

/**
 * Navigate to back 12 years and display the year selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handlePageUpFromYear = adjustYearSelectionScreen(year => year - YEAR_CHUNK);

/**
 * Navigate forward 12 years and display the year selection screen.
 *
 * @param {KeyboardEvent} event the keydown event
 */
const handlePageDownFromYear = adjustYearSelectionScreen(year => year + YEAR_CHUNK);

/**
 * update the focus on a year when the mouse moves.
 *
 * @param {MouseEvent} event The mouseover event
 * @param {HTMLButtonElement} dateEl A year element within the date picker component
 */
const handleMouseoverFromYear = yearEl => {
  if (yearEl.disabled) return;
  if (yearEl.classList.contains(CALENDAR_YEAR_FOCUSED_CLASS)) return;
  const focusYear = parseInt(yearEl.dataset.value, 10);
  const newCalendar = displayYearSelection(yearEl, focusYear);
  newCalendar.querySelector(CALENDAR_YEAR_FOCUSED).focus();
};

// #endregion Calendar Year Event Handling

// #region Focus Handling Event Handling

const tabHandler = focusable => {
  const getFocusableContext = el => {
    const {
      calendarEl
    } = getDatePickerContext(el);
    const focusableElements = select(focusable, calendarEl);
    const firstTabIndex = 0;
    const lastTabIndex = focusableElements.length - 1;
    const firstTabStop = focusableElements[firstTabIndex];
    const lastTabStop = focusableElements[lastTabIndex];
    const focusIndex = focusableElements.indexOf(activeElement());
    const isLastTab = focusIndex === lastTabIndex;
    const isFirstTab = focusIndex === firstTabIndex;
    const isNotFound = focusIndex === -1;
    return {
      focusableElements,
      isNotFound,
      firstTabStop,
      isFirstTab,
      lastTabStop,
      isLastTab
    };
  };
  return {
    tabAhead(event) {
      const {
        firstTabStop,
        isLastTab,
        isNotFound
      } = getFocusableContext(event.target);
      if (isLastTab || isNotFound) {
        event.preventDefault();
        firstTabStop.focus();
      }
    },
    tabBack(event) {
      const {
        lastTabStop,
        isFirstTab,
        isNotFound
      } = getFocusableContext(event.target);
      if (isFirstTab || isNotFound) {
        event.preventDefault();
        lastTabStop.focus();
      }
    }
  };
};
const datePickerTabEventHandler = tabHandler(DATE_PICKER_FOCUSABLE);
const monthPickerTabEventHandler = tabHandler(MONTH_PICKER_FOCUSABLE);
const yearPickerTabEventHandler = tabHandler(YEAR_PICKER_FOCUSABLE);

// #endregion Focus Handling Event Handling

// #region Date Picker Event Delegation Registration / Component

const datePickerEvents = {
  [CLICK]: {
    [DATE_PICKER_BUTTON]() {
      toggleCalendar(this);
    },
    [CALENDAR_DATE]() {
      selectDate(this);
    },
    [CALENDAR_MONTH]() {
      selectMonth(this);
    },
    [CALENDAR_YEAR]() {
      selectYear(this);
    },
    [CALENDAR_PREVIOUS_MONTH]() {
      displayPreviousMonth(this);
    },
    [CALENDAR_NEXT_MONTH]() {
      displayNextMonth(this);
    },
    [CALENDAR_PREVIOUS_YEAR]() {
      displayPreviousYear(this);
    },
    [CALENDAR_NEXT_YEAR]() {
      displayNextYear(this);
    },
    [CALENDAR_PREVIOUS_YEAR_CHUNK]() {
      displayPreviousYearChunk(this);
    },
    [CALENDAR_NEXT_YEAR_CHUNK]() {
      displayNextYearChunk(this);
    },
    [CALENDAR_MONTH_SELECTION]() {
      const newCalendar = displayMonthSelection(this);
      newCalendar.querySelector(CALENDAR_MONTH_FOCUSED).focus();
    },
    [CALENDAR_YEAR_SELECTION]() {
      const newCalendar = displayYearSelection(this);
      newCalendar.querySelector(CALENDAR_YEAR_FOCUSED).focus();
    }
  },
  keyup: {
    [DATE_PICKER_CALENDAR](event) {
      const keydown = this.dataset.keydownKeyCode;
      if (`${event.keyCode}` !== keydown) {
        event.preventDefault();
      }
    }
  },
  keydown: {
    [DATE_PICKER_EXTERNAL_INPUT](event) {
      if (event.keyCode === ENTER_KEYCODE) {
        validateDateInput(this);
      }
    },
    [CALENDAR_DATE]: keymap({
      Up: handleUpFromDate,
      ArrowUp: handleUpFromDate,
      Down: handleDownFromDate,
      ArrowDown: handleDownFromDate,
      Left: handleLeftFromDate,
      ArrowLeft: handleLeftFromDate,
      Right: handleRightFromDate,
      ArrowRight: handleRightFromDate,
      Home: handleHomeFromDate,
      End: handleEndFromDate,
      PageDown: handlePageDownFromDate,
      PageUp: handlePageUpFromDate,
      "Shift+PageDown": handleShiftPageDownFromDate,
      "Shift+PageUp": handleShiftPageUpFromDate,
      Tab: datePickerTabEventHandler.tabAhead
    }),
    [CALENDAR_DATE_PICKER]: keymap({
      Tab: datePickerTabEventHandler.tabAhead,
      "Shift+Tab": datePickerTabEventHandler.tabBack
    }),
    [CALENDAR_MONTH]: keymap({
      Up: handleUpFromMonth,
      ArrowUp: handleUpFromMonth,
      Down: handleDownFromMonth,
      ArrowDown: handleDownFromMonth,
      Left: handleLeftFromMonth,
      ArrowLeft: handleLeftFromMonth,
      Right: handleRightFromMonth,
      ArrowRight: handleRightFromMonth,
      Home: handleHomeFromMonth,
      End: handleEndFromMonth,
      PageDown: handlePageDownFromMonth,
      PageUp: handlePageUpFromMonth
    }),
    [CALENDAR_MONTH_PICKER]: keymap({
      Tab: monthPickerTabEventHandler.tabAhead,
      "Shift+Tab": monthPickerTabEventHandler.tabBack
    }),
    [CALENDAR_YEAR]: keymap({
      Up: handleUpFromYear,
      ArrowUp: handleUpFromYear,
      Down: handleDownFromYear,
      ArrowDown: handleDownFromYear,
      Left: handleLeftFromYear,
      ArrowLeft: handleLeftFromYear,
      Right: handleRightFromYear,
      ArrowRight: handleRightFromYear,
      Home: handleHomeFromYear,
      End: handleEndFromYear,
      PageDown: handlePageDownFromYear,
      PageUp: handlePageUpFromYear
    }),
    [CALENDAR_YEAR_PICKER]: keymap({
      Tab: yearPickerTabEventHandler.tabAhead,
      "Shift+Tab": yearPickerTabEventHandler.tabBack
    }),
    [DATE_PICKER_CALENDAR](event) {
      this.dataset.keydownKeyCode = event.keyCode;
    },
    [DATE_PICKER](event) {
      const keyMap = keymap({
        Escape: handleEscapeFromCalendar
      });
      keyMap(event);
    }
  },
  focusout: {
    [DATE_PICKER_EXTERNAL_INPUT]() {
      validateDateInput(this);
    },
    [DATE_PICKER](event) {
      if (!this.contains(event.relatedTarget)) {
        hideCalendar(this);
      }
    }
  },
  input: {
    [DATE_PICKER_EXTERNAL_INPUT]() {
      reconcileInputValues(this);
      updateCalendarIfVisible(this);
    }
  }
};
if (!isIosDevice()) {
  datePickerEvents.mouseover = {
    [CALENDAR_DATE_CURRENT_MONTH]() {
      handleMouseoverFromDate(this);
    },
    [CALENDAR_MONTH]() {
      handleMouseoverFromMonth(this);
    },
    [CALENDAR_YEAR]() {
      handleMouseoverFromYear(this);
    }
  };
}
const datePicker = behavior(datePickerEvents, {
  init(root) {
    selectOrMatches(DATE_PICKER, root).forEach(datePickerEl => {
      enhanceDatePicker(datePickerEl);
    });
  },
  getDatePickerContext,
  disable,
  enable,
  isDateInputInvalid,
  setCalendarValue,
  validateDateInput,
  renderCalendar,
  updateCalendarIfVisible
});

// #endregion Date Picker Event Delegation Registration / Component

module.exports = datePicker;

},{"../../uswds-core/src/js/config":22,"../../uswds-core/src/js/events":23,"../../uswds-core/src/js/utils/active-element":30,"../../uswds-core/src/js/utils/behavior":31,"../../uswds-core/src/js/utils/is-ios-device":35,"../../uswds-core/src/js/utils/sanitizer":36,"../../uswds-core/src/js/utils/select":39,"../../uswds-core/src/js/utils/select-or-matches":38,"receptor/keymap":54}],7:[function(require,module,exports){
"use strict";

const behavior = require("../../uswds-core/src/js/utils/behavior");
const select = require("../../uswds-core/src/js/utils/select");
const selectOrMatches = require("../../uswds-core/src/js/utils/select-or-matches");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const {
  getDatePickerContext,
  isDateInputInvalid,
  updateCalendarIfVisible
} = require("../../usa-date-picker/src/index");
const DATE_PICKER_CLASS = `${PREFIX}-date-picker`;
const DATE_RANGE_PICKER_CLASS = `${PREFIX}-date-range-picker`;
const DATE_RANGE_PICKER_RANGE_START_CLASS = `${DATE_RANGE_PICKER_CLASS}__range-start`;
const DATE_RANGE_PICKER_RANGE_END_CLASS = `${DATE_RANGE_PICKER_CLASS}__range-end`;
const DATE_PICKER = `.${DATE_PICKER_CLASS}`;
const DATE_RANGE_PICKER = `.${DATE_RANGE_PICKER_CLASS}`;
const DATE_RANGE_PICKER_RANGE_START = `.${DATE_RANGE_PICKER_RANGE_START_CLASS}`;
const DATE_RANGE_PICKER_RANGE_END = `.${DATE_RANGE_PICKER_RANGE_END_CLASS}`;
const DEFAULT_MIN_DATE = "0000-01-01";

/**
 * The properties and elements within the date range picker.
 * @typedef {Object} DateRangePickerContext
 * @property {HTMLElement} dateRangePickerEl
 * @property {HTMLElement} rangeStartEl
 * @property {HTMLElement} rangeEndEl
 */

/**
 * Get an object of the properties and elements belonging directly to the given
 * date picker component.
 *
 * @param {HTMLElement} el the element within the date picker
 * @returns {DateRangePickerContext} elements
 */
const getDateRangePickerContext = el => {
  const dateRangePickerEl = el.closest(DATE_RANGE_PICKER);
  if (!dateRangePickerEl) {
    throw new Error(`Element is missing outer ${DATE_RANGE_PICKER}`);
  }
  const rangeStartEl = dateRangePickerEl.querySelector(DATE_RANGE_PICKER_RANGE_START);
  const rangeEndEl = dateRangePickerEl.querySelector(DATE_RANGE_PICKER_RANGE_END);
  return {
    dateRangePickerEl,
    rangeStartEl,
    rangeEndEl
  };
};

/**
 * handle update from range start date picker
 *
 * @param {HTMLElement} el an element within the date range picker
 */
const handleRangeStartUpdate = el => {
  const {
    dateRangePickerEl,
    rangeStartEl,
    rangeEndEl
  } = getDateRangePickerContext(el);
  const {
    internalInputEl
  } = getDatePickerContext(rangeStartEl);
  const updatedDate = internalInputEl.value;
  if (updatedDate && !isDateInputInvalid(internalInputEl)) {
    rangeEndEl.dataset.minDate = updatedDate;
    rangeEndEl.dataset.rangeDate = updatedDate;
    rangeEndEl.dataset.defaultDate = updatedDate;
  } else {
    rangeEndEl.dataset.minDate = dateRangePickerEl.dataset.minDate || "";
    rangeEndEl.dataset.rangeDate = "";
    rangeEndEl.dataset.defaultDate = "";
  }
  updateCalendarIfVisible(rangeEndEl);
};

/**
 * handle update from range start date picker
 *
 * @param {HTMLElement} el an element within the date range picker
 */
const handleRangeEndUpdate = el => {
  const {
    dateRangePickerEl,
    rangeStartEl,
    rangeEndEl
  } = getDateRangePickerContext(el);
  const {
    internalInputEl
  } = getDatePickerContext(rangeEndEl);
  const updatedDate = internalInputEl.value;
  if (updatedDate && !isDateInputInvalid(internalInputEl)) {
    rangeStartEl.dataset.maxDate = updatedDate;
    rangeStartEl.dataset.rangeDate = updatedDate;
    rangeStartEl.dataset.defaultDate = updatedDate;
  } else {
    rangeStartEl.dataset.maxDate = dateRangePickerEl.dataset.maxDate || "";
    rangeStartEl.dataset.rangeDate = "";
    rangeStartEl.dataset.defaultDate = "";
  }
  updateCalendarIfVisible(rangeStartEl);
};

/**
 * Enhance an input with the date picker elements
 *
 * @param {HTMLElement} el The initial wrapping element of the date range picker component
 */
const enhanceDateRangePicker = el => {
  const dateRangePickerEl = el.closest(DATE_RANGE_PICKER);
  const [rangeStart, rangeEnd] = select(DATE_PICKER, dateRangePickerEl);
  if (!rangeStart) {
    throw new Error(`${DATE_RANGE_PICKER} is missing inner two '${DATE_PICKER}' elements`);
  }
  if (!rangeEnd) {
    throw new Error(`${DATE_RANGE_PICKER} is missing second '${DATE_PICKER}' element`);
  }
  rangeStart.classList.add(DATE_RANGE_PICKER_RANGE_START_CLASS);
  rangeEnd.classList.add(DATE_RANGE_PICKER_RANGE_END_CLASS);
  if (!dateRangePickerEl.dataset.minDate) {
    dateRangePickerEl.dataset.minDate = DEFAULT_MIN_DATE;
  }
  const {
    minDate
  } = dateRangePickerEl.dataset;
  rangeStart.dataset.minDate = minDate;
  rangeEnd.dataset.minDate = minDate;
  const {
    maxDate
  } = dateRangePickerEl.dataset;
  if (maxDate) {
    rangeStart.dataset.maxDate = maxDate;
    rangeEnd.dataset.maxDate = maxDate;
  }
  handleRangeStartUpdate(dateRangePickerEl);
  handleRangeEndUpdate(dateRangePickerEl);
};
const dateRangePicker = behavior({
  "input change": {
    [DATE_RANGE_PICKER_RANGE_START]() {
      handleRangeStartUpdate(this);
    },
    [DATE_RANGE_PICKER_RANGE_END]() {
      handleRangeEndUpdate(this);
    }
  }
}, {
  init(root) {
    selectOrMatches(DATE_RANGE_PICKER, root).forEach(dateRangePickerEl => {
      enhanceDateRangePicker(dateRangePickerEl);
    });
  }
});
module.exports = dateRangePicker;

},{"../../usa-date-picker/src/index":6,"../../uswds-core/src/js/config":22,"../../uswds-core/src/js/utils/behavior":31,"../../uswds-core/src/js/utils/select":39,"../../uswds-core/src/js/utils/select-or-matches":38}],8:[function(require,module,exports){
"use strict";

const selectOrMatches = require("../../uswds-core/src/js/utils/select-or-matches");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const Sanitizer = require("../../uswds-core/src/js/utils/sanitizer");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const DROPZONE_CLASS = `${PREFIX}-file-input`;
const DROPZONE = `.${DROPZONE_CLASS}`;
const INPUT_CLASS = `${PREFIX}-file-input__input`;
const TARGET_CLASS = `${PREFIX}-file-input__target`;
const INPUT = `.${INPUT_CLASS}`;
const BOX_CLASS = `${PREFIX}-file-input__box`;
const INSTRUCTIONS_CLASS = `${PREFIX}-file-input__instructions`;
const PREVIEW_CLASS = `${PREFIX}-file-input__preview`;
const PREVIEW_HEADING_CLASS = `${PREFIX}-file-input__preview-heading`;
const DISABLED_CLASS = `${PREFIX}-file-input--disabled`;
const CHOOSE_CLASS = `${PREFIX}-file-input__choose`;
const ACCEPTED_FILE_MESSAGE_CLASS = `${PREFIX}-file-input__accepted-files-message`;
const DRAG_TEXT_CLASS = `${PREFIX}-file-input__drag-text`;
const DRAG_CLASS = `${PREFIX}-file-input--drag`;
const LOADING_CLASS = "is-loading";
const HIDDEN_CLASS = "display-none";
const INVALID_FILE_CLASS = "has-invalid-file";
const GENERIC_PREVIEW_CLASS_NAME = `${PREFIX}-file-input__preview-image`;
const GENERIC_PREVIEW_CLASS = `${GENERIC_PREVIEW_CLASS_NAME}--generic`;
const PDF_PREVIEW_CLASS = `${GENERIC_PREVIEW_CLASS_NAME}--pdf`;
const WORD_PREVIEW_CLASS = `${GENERIC_PREVIEW_CLASS_NAME}--word`;
const VIDEO_PREVIEW_CLASS = `${GENERIC_PREVIEW_CLASS_NAME}--video`;
const EXCEL_PREVIEW_CLASS = `${GENERIC_PREVIEW_CLASS_NAME}--excel`;
const SPACER_GIF = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
let TYPE_IS_VALID = Boolean(true); // logic gate for change listener

/**
 * The properties and elements within the file input.
 * @typedef {Object} FileInputContext
 * @property {HTMLDivElement} dropZoneEl
 * @property {HTMLInputElement} inputEl
 */

/**
 * Get an object of the properties and elements belonging directly to the given
 * file input component.
 *
 * @param {HTMLElement} el the element within the file input
 * @returns {FileInputContext} elements
 */
const getFileInputContext = el => {
  const dropZoneEl = el.closest(DROPZONE);
  if (!dropZoneEl) {
    throw new Error(`Element is missing outer ${DROPZONE}`);
  }
  const inputEl = dropZoneEl.querySelector(INPUT);
  return {
    dropZoneEl,
    inputEl
  };
};

/**
 * Disable the file input component
 *
 * @param {HTMLElement} el An element within the file input component
 */
const disable = el => {
  const {
    dropZoneEl,
    inputEl
  } = getFileInputContext(el);
  inputEl.disabled = true;
  dropZoneEl.classList.add(DISABLED_CLASS);
  dropZoneEl.setAttribute("aria-disabled", "true");
};

/**
 * Enable the file input component
 *
 * @param {HTMLElement} el An element within the file input component
 */
const enable = el => {
  const {
    dropZoneEl,
    inputEl
  } = getFileInputContext(el);
  inputEl.disabled = false;
  dropZoneEl.classList.remove(DISABLED_CLASS);
  dropZoneEl.removeAttribute("aria-disabled");
};

/**
 *
 * @param {String} s special characters
 * @returns {String} replaces specified values
 */
const replaceName = s => {
  const c = s.charCodeAt(0);
  if (c === 32) return "-";
  if (c >= 65 && c <= 90) return `img_${s.toLowerCase()}`;
  return `__${("000", c.toString(16)).slice(-4)}`;
};

/**
 * Creates an ID name for each file that strips all invalid characters.
 * @param {String} name - name of the file added to file input (searchvalue)
 * @returns {String} same characters as the name with invalid chars removed (newvalue)
 */
const makeSafeForID = name => name.replace(/[^a-z0-9]/g, replaceName);

// Takes a generated safe ID and creates a unique ID.
const createUniqueID = name => `${name}-${Math.floor(Date.now().toString() / 1000)}`;

/**
 * Builds full file input component
 * @param {HTMLElement} fileInputEl - original file input on page
 * @returns {HTMLElement|HTMLElement} - Instructions, target area div
 */
const buildFileInput = fileInputEl => {
  const acceptsMultiple = fileInputEl.hasAttribute("multiple");
  const fileInputParent = document.createElement("div");
  const dropTarget = document.createElement("div");
  const box = document.createElement("div");
  const instructions = document.createElement("div");
  const disabled = fileInputEl.hasAttribute("disabled");
  let defaultAriaLabel;

  // Adds class names and other attributes
  fileInputEl.classList.remove(DROPZONE_CLASS);
  fileInputEl.classList.add(INPUT_CLASS);
  fileInputParent.classList.add(DROPZONE_CLASS);
  box.classList.add(BOX_CLASS);
  instructions.classList.add(INSTRUCTIONS_CLASS);
  instructions.setAttribute("aria-hidden", "true");
  dropTarget.classList.add(TARGET_CLASS);
  // Encourage screenreader to read out aria changes immediately following upload status change
  fileInputEl.setAttribute("aria-live", "polite");

  // Adds child elements to the DOM
  fileInputEl.parentNode.insertBefore(dropTarget, fileInputEl);
  fileInputEl.parentNode.insertBefore(fileInputParent, dropTarget);
  dropTarget.appendChild(fileInputEl);
  fileInputParent.appendChild(dropTarget);
  fileInputEl.parentNode.insertBefore(instructions, fileInputEl);
  fileInputEl.parentNode.insertBefore(box, fileInputEl);

  // Disabled styling
  if (disabled) {
    disable(fileInputEl);
  }

  // Sets instruction test and aria-label based on whether or not multiple files are accepted
  if (acceptsMultiple) {
    defaultAriaLabel = "No files selected";
    instructions.innerHTML = Sanitizer.escapeHTML`<span class="${DRAG_TEXT_CLASS}">Drag files here or </span><span class="${CHOOSE_CLASS}">choose from folder</span>`;
    fileInputEl.setAttribute("aria-label", defaultAriaLabel);
    fileInputEl.setAttribute("data-default-aria-label", defaultAriaLabel);
  } else {
    defaultAriaLabel = "No file selected";
    instructions.innerHTML = Sanitizer.escapeHTML`<span class="${DRAG_TEXT_CLASS}">Drag file here or </span><span class="${CHOOSE_CLASS}">choose from folder</span>`;
    fileInputEl.setAttribute("aria-label", defaultAriaLabel);
    fileInputEl.setAttribute("data-default-aria-label", defaultAriaLabel);
  }

  // IE11 and Edge do not support drop files on file inputs, so we've removed text that indicates that
  if (/rv:11.0/i.test(navigator.userAgent) || /Edge\/\d./i.test(navigator.userAgent)) {
    fileInputParent.querySelector(`.${DRAG_TEXT_CLASS}`).outerHTML = "";
  }
  return {
    instructions,
    dropTarget
  };
};

/**
 * Removes image previews, we want to start with a clean list every time files are added to the file input
 * @param {HTMLElement} dropTarget - target area div that encases the input
 * @param {HTMLElement} instructions - text to inform users to drag or select files
 */
const removeOldPreviews = (dropTarget, instructions, inputAriaLabel) => {
  const filePreviews = dropTarget.querySelectorAll(`.${PREVIEW_CLASS}`);
  const fileInputElement = dropTarget.querySelector(INPUT);
  const currentPreviewHeading = dropTarget.querySelector(`.${PREVIEW_HEADING_CLASS}`);
  const currentErrorMessage = dropTarget.querySelector(`.${ACCEPTED_FILE_MESSAGE_CLASS}`);

  /**
   * finds the parent of the passed node and removes the child
   * @param {HTMLElement} node
   */
  const removeImages = node => {
    node.parentNode.removeChild(node);
  };

  // Remove the heading above the previews
  if (currentPreviewHeading) {
    currentPreviewHeading.outerHTML = "";
  }

  // Remove existing error messages
  if (currentErrorMessage) {
    currentErrorMessage.outerHTML = "";
    dropTarget.classList.remove(INVALID_FILE_CLASS);
  }

  // Get rid of existing previews if they exist, show instructions
  if (filePreviews !== null) {
    if (instructions) {
      instructions.classList.remove(HIDDEN_CLASS);
    }
    fileInputElement.setAttribute("aria-label", inputAriaLabel);
    Array.prototype.forEach.call(filePreviews, removeImages);
  }
};

/**
 * When new files are applied to file input, this function generates previews
 * and removes old ones.
 * @param {event} e
 * @param {HTMLElement} fileInputEl - file input element
 * @param {HTMLElement} instructions - text to inform users to drag or select files
 * @param {HTMLElement} dropTarget - target area div that encases the input
 */

const handleChange = (e, fileInputEl, instructions, dropTarget) => {
  const fileNames = e.target.files;
  const filePreviewsHeading = document.createElement("div");
  const inputAriaLabel = fileInputEl.dataset.defaultAriaLabel;
  const fileStore = [];

  // First, get rid of existing previews
  removeOldPreviews(dropTarget, instructions, inputAriaLabel);

  // Then, iterate through files list and:
  // 1. Add selected file list names to aria-label
  // 2. Create previews
  for (let i = 0; i < fileNames.length; i += 1) {
    const reader = new FileReader();
    const fileName = fileNames[i].name;

    // Push updated file names into the store array
    fileStore.push(fileName);

    // read out the store array via aria-label, wording options vary based on file count
    if (i === 0) {
      fileInputEl.setAttribute("aria-label", `You have selected the file: ${fileName}`);
    } else if (i >= 1) {
      fileInputEl.setAttribute("aria-label", `You have selected ${fileNames.length} files: ${fileStore.join(", ")}`);
    }

    // Starts with a loading image while preview is created
    reader.onloadstart = function createLoadingImage() {
      const imageId = createUniqueID(makeSafeForID(fileName));
      instructions.insertAdjacentHTML("afterend", Sanitizer.escapeHTML`<div class="${PREVIEW_CLASS}" aria-hidden="true">
          <img id="${imageId}" src="${SPACER_GIF}" alt="" class="${GENERIC_PREVIEW_CLASS_NAME} ${LOADING_CLASS}"/>${fileName}
        <div>`);
    };

    // Not all files will be able to generate previews. In case this happens, we provide several types "generic previews" based on the file extension.
    reader.onloadend = function createFilePreview() {
      const imageId = createUniqueID(makeSafeForID(fileName));
      const previewImage = document.getElementById(imageId);
      if (fileName.indexOf(".pdf") > 0) {
        previewImage.setAttribute("onerror", `this.onerror=null;this.src="${SPACER_GIF}"; this.classList.add("${PDF_PREVIEW_CLASS}")`);
      } else if (fileName.indexOf(".doc") > 0 || fileName.indexOf(".pages") > 0) {
        previewImage.setAttribute("onerror", `this.onerror=null;this.src="${SPACER_GIF}"; this.classList.add("${WORD_PREVIEW_CLASS}")`);
      } else if (fileName.indexOf(".xls") > 0 || fileName.indexOf(".numbers") > 0) {
        previewImage.setAttribute("onerror", `this.onerror=null;this.src="${SPACER_GIF}"; this.classList.add("${EXCEL_PREVIEW_CLASS}")`);
      } else if (fileName.indexOf(".mov") > 0 || fileName.indexOf(".mp4") > 0) {
        previewImage.setAttribute("onerror", `this.onerror=null;this.src="${SPACER_GIF}"; this.classList.add("${VIDEO_PREVIEW_CLASS}")`);
      } else {
        previewImage.setAttribute("onerror", `this.onerror=null;this.src="${SPACER_GIF}"; this.classList.add("${GENERIC_PREVIEW_CLASS}")`);
      }

      // Removes loader and displays preview
      previewImage.classList.remove(LOADING_CLASS);
      previewImage.src = reader.result;
    };
    if (fileNames[i]) {
      reader.readAsDataURL(fileNames[i]);
    }

    // Adds heading above file previews, pluralizes if there are multiple
    if (i === 0) {
      dropTarget.insertBefore(filePreviewsHeading, instructions);
      filePreviewsHeading.innerHTML = `Selected file <span class="usa-file-input__choose">Change file</span>`;
    } else if (i >= 1) {
      dropTarget.insertBefore(filePreviewsHeading, instructions);
      filePreviewsHeading.innerHTML = Sanitizer.escapeHTML`${i + 1} files selected <span class="usa-file-input__choose">Change files</span>`;
    }

    // Hides null state content and sets preview heading class
    if (filePreviewsHeading) {
      instructions.classList.add(HIDDEN_CLASS);
      filePreviewsHeading.classList.add(PREVIEW_HEADING_CLASS);
    }
  }
};

/**
 * When using an Accept attribute, invalid files will be hidden from
 * file browser, but they can still be dragged to the input. This
 * function prevents them from being dragged and removes error states
 * when correct files are added.
 * @param {event} e
 * @param {HTMLElement} fileInputEl - file input element
 * @param {HTMLElement} instructions - text to inform users to drag or select files
 * @param {HTMLElement} dropTarget - target area div that encases the input
 */
const preventInvalidFiles = (e, fileInputEl, instructions, dropTarget) => {
  const acceptedFilesAttr = fileInputEl.getAttribute("accept");
  dropTarget.classList.remove(INVALID_FILE_CLASS);

  /**
   * We can probably move away from this once IE11 support stops, and replace
   * with a simple es `.includes`
   * check if element is in array
   * check if 1 or more alphabets are in string
   * if element is present return the position value and -1 otherwise
   * @param {Object} file
   * @param {String} value
   * @returns {Boolean}
   */
  const isIncluded = (file, value) => {
    let returnValue = false;
    const pos = file.indexOf(value);
    if (pos >= 0) {
      returnValue = true;
    }
    return returnValue;
  };

  // Runs if only specific files are accepted
  if (acceptedFilesAttr) {
    const acceptedFiles = acceptedFilesAttr.split(",");
    const errorMessage = document.createElement("div");

    // If multiple files are dragged, this iterates through them and look for any files that are not accepted.
    let allFilesAllowed = true;
    const scannedFiles = e.target.files || e.dataTransfer.files;
    for (let i = 0; i < scannedFiles.length; i += 1) {
      const file = scannedFiles[i];
      if (allFilesAllowed) {
        for (let j = 0; j < acceptedFiles.length; j += 1) {
          const fileType = acceptedFiles[j];
          allFilesAllowed = file.name.indexOf(fileType) > 0 || isIncluded(file.type, fileType.replace(/\*/g, ""));
          if (allFilesAllowed) {
            TYPE_IS_VALID = true;
            break;
          }
        }
      } else break;
    }

    // If dragged files are not accepted, this removes them from the value of the input and creates and error state
    if (!allFilesAllowed) {
      removeOldPreviews(dropTarget, instructions);
      fileInputEl.value = ""; // eslint-disable-line no-param-reassign
      dropTarget.insertBefore(errorMessage, fileInputEl);
      errorMessage.textContent = fileInputEl.dataset.errormessage || `This is not a valid file type.`;
      errorMessage.classList.add(ACCEPTED_FILE_MESSAGE_CLASS);
      dropTarget.classList.add(INVALID_FILE_CLASS);
      TYPE_IS_VALID = false;
      e.preventDefault();
      e.stopPropagation();
    }
  }
};

/**
 * 1. passes through gate for preventing invalid files
 * 2. handles updates if file is valid
 * @param {event} event
 * @param {HTMLElement} element
 * @param {HTMLElement} instructionsEl
 * @param {HTMLElement} target
 */
const handleUpload = (event, element, instructionsEl, dropTargetEl) => {
  preventInvalidFiles(event, element, instructionsEl, dropTargetEl);
  if (TYPE_IS_VALID === true) {
    handleChange(event, element, instructionsEl, dropTargetEl);
  }
};
const fileInput = behavior({}, {
  init(root) {
    selectOrMatches(DROPZONE, root).forEach(fileInputEl => {
      const {
        instructions,
        dropTarget
      } = buildFileInput(fileInputEl);
      dropTarget.addEventListener("dragover", function handleDragOver() {
        this.classList.add(DRAG_CLASS);
      }, false);
      dropTarget.addEventListener("dragleave", function handleDragLeave() {
        this.classList.remove(DRAG_CLASS);
      }, false);
      dropTarget.addEventListener("drop", function handleDrop() {
        this.classList.remove(DRAG_CLASS);
      }, false);
      fileInputEl.addEventListener("change", e => handleUpload(e, fileInputEl, instructions, dropTarget), false);
    });
  },
  teardown(root) {
    selectOrMatches(INPUT, root).forEach(fileInputEl => {
      const fileInputTopElement = fileInputEl.parentElement.parentElement;
      fileInputTopElement.parentElement.replaceChild(fileInputEl, fileInputTopElement);
      // eslint-disable-next-line no-param-reassign
      fileInputEl.className = DROPZONE_CLASS;
    });
  },
  getFileInputContext,
  disable,
  enable
});
module.exports = fileInput;

},{"../../uswds-core/src/js/config":22,"../../uswds-core/src/js/utils/behavior":31,"../../uswds-core/src/js/utils/sanitizer":36,"../../uswds-core/src/js/utils/select-or-matches":38}],9:[function(require,module,exports){
"use strict";

const behavior = require("../../uswds-core/src/js/utils/behavior");
const {
  CLICK
} = require("../../uswds-core/src/js/events");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const SCOPE = `.${PREFIX}-footer--big`;
const NAV = `${SCOPE} nav`;
const BUTTON = `${NAV} .${PREFIX}-footer__primary-link`;
const HIDE_MAX_WIDTH = 480;

/**
 * Expands selected footer menu panel, while collapsing others
 */
function showPanel() {
  if (window.innerWidth < HIDE_MAX_WIDTH) {
    const isOpen = this.getAttribute("aria-expanded") === "true";
    const thisFooter = this.closest(SCOPE);

    // Close all other menus
    thisFooter.querySelectorAll(BUTTON).forEach(button => {
      button.setAttribute("aria-expanded", false);
    });
    this.setAttribute("aria-expanded", !isOpen);
  }
}

/**
 * Swaps the <h4> element for a <button> element (and vice-versa) and sets id
 * of menu list
 *
 * @param {Boolean} isMobile - If the footer is in mobile configuration
 */
function toggleHtmlTag(isMobile) {
  const bigFooter = document.querySelector(SCOPE);
  if (!bigFooter) {
    return;
  }
  const primaryLinks = bigFooter.querySelectorAll(BUTTON);
  const newElementType = isMobile ? "button" : "h4";
  primaryLinks.forEach(currentElement => {
    const currentElementClasses = currentElement.getAttribute("class");

    // Create the new element
    const newElement = document.createElement(newElementType);
    newElement.setAttribute("class", currentElementClasses);
    newElement.classList.toggle(`${PREFIX}-footer__primary-link--button`, isMobile);
    newElement.textContent = currentElement.textContent;
    if (isMobile) {
      const menuId = `${PREFIX}-footer-menu-list-${Math.floor(Math.random() * 100000)}`;
      newElement.setAttribute("aria-controls", menuId);
      newElement.setAttribute("aria-expanded", "false");
      currentElement.nextElementSibling.setAttribute("id", menuId);
      newElement.setAttribute("type", "button");
    }

    // Insert the new element and delete the old
    currentElement.after(newElement);
    currentElement.remove();
  });
}
const resize = event => {
  toggleHtmlTag(event.matches);
};
module.exports = behavior({
  [CLICK]: {
    [BUTTON]: showPanel
  }
}, {
  // export for use elsewhere
  HIDE_MAX_WIDTH,
  init() {
    toggleHtmlTag(window.innerWidth < HIDE_MAX_WIDTH);
    this.mediaQueryList = window.matchMedia(`(max-width: ${HIDE_MAX_WIDTH - 0.1}px)`);
    this.mediaQueryList.addListener(resize);
  },
  teardown() {
    this.mediaQueryList.removeListener(resize);
  }
});

},{"../../uswds-core/src/js/config":22,"../../uswds-core/src/js/events":23,"../../uswds-core/src/js/utils/behavior":31}],10:[function(require,module,exports){
"use strict";

const keymap = require("receptor/keymap");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const select = require("../../uswds-core/src/js/utils/select");
const toggle = require("../../uswds-core/src/js/utils/toggle");
const FocusTrap = require("../../uswds-core/src/js/utils/focus-trap");
const accordion = require("../../usa-accordion/src/index");
const ScrollBarWidth = require("../../uswds-core/src/js/utils/scrollbar-width");
const {
  CLICK
} = require("../../uswds-core/src/js/events");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const BODY = "body";
const HEADER = `.${PREFIX}-header`;
const NAV = `.${PREFIX}-nav`;
const NAV_CONTAINER = `.${PREFIX}-nav-container`;
const NAV_PRIMARY = `.${PREFIX}-nav__primary`;
const NAV_PRIMARY_ITEM = `.${PREFIX}-nav__primary-item`;
const NAV_CONTROL = `button.${PREFIX}-nav__link`;
const NAV_LINKS = `${NAV} a`;
const NON_NAV_HIDDEN_ATTRIBUTE = `data-nav-hidden`;
const OPENERS = `.${PREFIX}-menu-btn`;
const CLOSE_BUTTON = `.${PREFIX}-nav__close`;
const OVERLAY = `.${PREFIX}-overlay`;
const CLOSERS = `${CLOSE_BUTTON}, .${PREFIX}-overlay`;
const TOGGLES = [NAV, OVERLAY].join(", ");
const NON_NAV_ELEMENTS = `body *:not(${HEADER}, ${NAV_CONTAINER}, ${NAV}, ${NAV} *):not([aria-hidden])`;
const NON_NAV_HIDDEN = `[${NON_NAV_HIDDEN_ATTRIBUTE}]`;
const ACTIVE_CLASS = "usa-js-mobile-nav--active";
const VISIBLE_CLASS = "is-visible";
let navigation;
let navActive;
let nonNavElements;
const isActive = () => document.body.classList.contains(ACTIVE_CLASS);
const SCROLLBAR_WIDTH = ScrollBarWidth();
const INITIAL_PADDING = window.getComputedStyle(document.body).getPropertyValue("padding-right");
const TEMPORARY_PADDING = `${parseInt(INITIAL_PADDING.replace(/px/, ""), 10) + parseInt(SCROLLBAR_WIDTH.replace(/px/, ""), 10)}px`;
const hideNonNavItems = () => {
  const headerParent = document.querySelector(`${HEADER}`).parentNode;
  nonNavElements = document.querySelectorAll(NON_NAV_ELEMENTS);
  nonNavElements.forEach(nonNavElement => {
    if (nonNavElement !== headerParent) {
      nonNavElement.setAttribute("aria-hidden", true);
      nonNavElement.setAttribute(NON_NAV_HIDDEN_ATTRIBUTE, "");
    }
  });
};
const showNonNavItems = () => {
  nonNavElements = document.querySelectorAll(NON_NAV_HIDDEN);
  if (!nonNavElements) {
    return;
  }

  // Remove aria-hidden from non-header elements
  nonNavElements.forEach(nonNavElement => {
    nonNavElement.removeAttribute("aria-hidden");
    nonNavElement.removeAttribute(NON_NAV_HIDDEN_ATTRIBUTE);
  });
};

// Toggle all non-header elements #3527.
const toggleNonNavItems = active => {
  if (active) {
    hideNonNavItems();
  } else {
    showNonNavItems();
  }
};
const toggleNav = active => {
  const {
    body
  } = document;
  const safeActive = typeof active === "boolean" ? active : !isActive();
  body.classList.toggle(ACTIVE_CLASS, safeActive);
  select(TOGGLES).forEach(el => el.classList.toggle(VISIBLE_CLASS, safeActive));
  navigation.focusTrap.update(safeActive);
  const closeButton = body.querySelector(CLOSE_BUTTON);
  const menuButton = document.querySelector(OPENERS);
  body.style.paddingRight = body.style.paddingRight === TEMPORARY_PADDING ? INITIAL_PADDING : TEMPORARY_PADDING;
  toggleNonNavItems(safeActive);
  if (safeActive && closeButton) {
    // The mobile nav was just activated. Focus on the close button, which is
    // just before all the nav elements in the tab order.
    closeButton.focus();
  } else if (!safeActive && document.activeElement === closeButton && menuButton) {
    // The mobile nav was just deactivated, and focus was on the close
    // button, which is no longer visible. We don't want the focus to
    // disappear into the void, so focus on the menu button if it's
    // visible (this may have been what the user was just focused on,
    // if they triggered the mobile nav by mistake).
    menuButton.focus();
  }
  return safeActive;
};
const resize = () => {
  const closer = document.body.querySelector(CLOSE_BUTTON);
  if (isActive() && closer && closer.getBoundingClientRect().width === 0) {
    // When the mobile nav is active, and the close box isn't visible,
    // we know the user's viewport has been resized to be larger.
    // Let's make the page state consistent by deactivating the mobile nav.
    navigation.toggleNav.call(closer, false);
  }
};
const onMenuClose = () => navigation.toggleNav.call(navigation, false);
const hideActiveNavDropdown = () => {
  if (!navActive) {
    return;
  }
  toggle(navActive, false);
  navActive = null;
};
const focusNavButton = event => {
  const parentNavItem = event.target.closest(NAV_PRIMARY_ITEM);

  // Only shift focus if within dropdown
  if (!event.target.matches(NAV_CONTROL)) {
    parentNavItem.querySelector(NAV_CONTROL).focus();
  }
};
const handleEscape = event => {
  hideActiveNavDropdown();
  focusNavButton(event);
};
navigation = behavior({
  [CLICK]: {
    [NAV_CONTROL]() {
      // If another nav is open, close it
      if (navActive !== this) {
        hideActiveNavDropdown();
      }
      // store a reference to the last clicked nav link element, so we
      // can hide the dropdown if another element on the page is clicked
      if (!navActive) {
        navActive = this;
        toggle(navActive, true);
      }

      // Do this so the event handler on the body doesn't fire
      return false;
    },
    [BODY]: hideActiveNavDropdown,
    [OPENERS]: toggleNav,
    [CLOSERS]: toggleNav,
    [NAV_LINKS]() {
      // A navigation link has been clicked! We want to collapse any
      // hierarchical navigation UI it's a part of, so that the user
      // can focus on whatever they've just selected.

      // Some navigation links are inside accordions; when they're
      // clicked, we want to collapse those accordions.
      const acc = this.closest(accordion.ACCORDION);
      if (acc) {
        accordion.getButtons(acc).forEach(btn => accordion.hide(btn));
      }

      // If the mobile navigation menu is active, we want to hide it.
      if (isActive()) {
        navigation.toggleNav.call(navigation, false);
      }
    }
  },
  keydown: {
    [NAV_PRIMARY]: keymap({
      Escape: handleEscape
    })
  },
  focusout: {
    [NAV_PRIMARY](event) {
      const nav = event.target.closest(NAV_PRIMARY);
      if (!nav.contains(event.relatedTarget)) {
        hideActiveNavDropdown();
      }
    }
  }
}, {
  init(root) {
    const trapContainer = root.matches(NAV) ? root : root.querySelector(NAV);
    if (trapContainer) {
      navigation.focusTrap = FocusTrap(trapContainer, {
        Escape: onMenuClose
      });
    }
    resize();
    window.addEventListener("resize", resize, false);
  },
  teardown() {
    window.removeEventListener("resize", resize, false);
    navActive = false;
  },
  focusTrap: null,
  toggleNav
});
module.exports = navigation;

},{"../../usa-accordion/src/index":2,"../../uswds-core/src/js/config":22,"../../uswds-core/src/js/events":23,"../../uswds-core/src/js/utils/behavior":31,"../../uswds-core/src/js/utils/focus-trap":33,"../../uswds-core/src/js/utils/scrollbar-width":37,"../../uswds-core/src/js/utils/select":39,"../../uswds-core/src/js/utils/toggle":42,"receptor/keymap":54}],11:[function(require,module,exports){
"use strict";

const once = require("receptor/once");
const keymap = require("receptor/keymap");
const selectOrMatches = require("../../uswds-core/src/js/utils/select-or-matches");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const {
  CLICK
} = require("../../uswds-core/src/js/events");
const Sanitizer = require("../../uswds-core/src/js/utils/sanitizer");
const CURRENT_CLASS = `${PREFIX}-current`;
const IN_PAGE_NAV_TITLE_TEXT = "On this page";
const IN_PAGE_NAV_TITLE_HEADING_LEVEL = "h4";
const IN_PAGE_NAV_SCROLL_OFFSET = 0;
const IN_PAGE_NAV_ROOT_MARGIN = "0px 0px 0px 0px";
const IN_PAGE_NAV_THRESHOLD = "1";
const IN_PAGE_NAV_CLASS = `${PREFIX}-in-page-nav`;
const IN_PAGE_NAV_ANCHOR_CLASS = `${PREFIX}-anchor`;
const IN_PAGE_NAV_NAV_CLASS = `${IN_PAGE_NAV_CLASS}__nav`;
const IN_PAGE_NAV_LIST_CLASS = `${IN_PAGE_NAV_CLASS}__list`;
const IN_PAGE_NAV_ITEM_CLASS = `${IN_PAGE_NAV_CLASS}__item`;
const IN_PAGE_NAV_LINK_CLASS = `${IN_PAGE_NAV_CLASS}__link`;
const IN_PAGE_NAV_TITLE_CLASS = `${IN_PAGE_NAV_CLASS}__heading`;
const SUB_ITEM_CLASS = `${IN_PAGE_NAV_ITEM_CLASS}--sub-item`;
const MAIN_ELEMENT = "main";

/**
 * Set the active link state for the currently observed section
 *
 * @param {HTMLElement} el An element within the in-page nav component
 */
const setActive = el => {
  const allLinks = document.querySelectorAll(`.${IN_PAGE_NAV_LINK_CLASS}`);
  el.map(i => {
    if (i.isIntersecting === true && i.intersectionRatio >= 1) {
      allLinks.forEach(link => link.classList.remove(CURRENT_CLASS));
      document.querySelector(`a[href="#${i.target.id}"]`).classList.add(CURRENT_CLASS);
      return true;
    }
    return false;
  });
};

/**
 * Return a node list of section headings
 *
 * @return {HTMLElement[]} - An array of DOM nodes
 */
const getSectionHeadings = () => {
  const sectionHeadings = document.querySelectorAll(`${MAIN_ELEMENT} h2, ${MAIN_ELEMENT} h3`);
  return sectionHeadings;
};

/**
 * Return a node list of section anchor tags
 *
 * @return {HTMLElement[]} - An array of DOM nodes
 */
const getSectionAnchors = () => {
  const sectionAnchors = document.querySelectorAll(`.${IN_PAGE_NAV_ANCHOR_CLASS}`);
  return sectionAnchors;
};

/**
 * Return a section id/anchor hash without the number sign
 *
 * @return {String} - Id value with the number sign removed
 */
const getSectionId = value => {
  let id;

  // Check if value is an event or element and get the cleaned up id
  if (value && value.nodeType === 1) {
    id = value.getAttribute("href").replace("#", "");
  } else {
    id = value.target.hash.replace("#", "");
  }
  return id;
};

/**
 * Scroll smoothly to a section based on the passed in element
 *
 * @param {HTMLElement} - Id value with the number sign removed
 */
const handleScrollToSection = el => {
  const inPageNavEl = document.querySelector(`.${IN_PAGE_NAV_CLASS}`);
  const inPageNavScrollOffset = inPageNavEl.dataset.scrollOffset || IN_PAGE_NAV_SCROLL_OFFSET;
  window.scroll({
    behavior: "smooth",
    top: el.offsetTop - inPageNavScrollOffset,
    block: "start"
  });
};

/**
 * Create the in-page navigation component
 *
 * @param {HTMLElement} inPageNavEl The in-page nav element
 */
const createInPageNav = inPageNavEl => {
  const inPageNavTitleText = Sanitizer.escapeHTML`${inPageNavEl.dataset.titleText || IN_PAGE_NAV_TITLE_TEXT}`;
  const inPageNavTitleHeadingLevel = Sanitizer.escapeHTML`${inPageNavEl.dataset.titleHeadingLevel || IN_PAGE_NAV_TITLE_HEADING_LEVEL}`;
  const inPageNavRootMargin = Sanitizer.escapeHTML`${inPageNavEl.dataset.rootMargin || IN_PAGE_NAV_ROOT_MARGIN}`;
  const inPageNavThreshold = Sanitizer.escapeHTML`${inPageNavEl.dataset.threshold || IN_PAGE_NAV_THRESHOLD}`;
  const options = {
    root: null,
    rootMargin: inPageNavRootMargin,
    threshold: [inPageNavThreshold]
  };
  const sectionHeadings = getSectionHeadings();
  const inPageNav = document.createElement("nav");
  inPageNav.setAttribute("aria-label", inPageNavTitleText);
  inPageNav.classList.add(IN_PAGE_NAV_NAV_CLASS);
  const inPageNavTitle = document.createElement(inPageNavTitleHeadingLevel);
  inPageNavTitle.classList.add(IN_PAGE_NAV_TITLE_CLASS);
  inPageNavTitle.setAttribute("tabindex", "0");
  inPageNavTitle.textContent = inPageNavTitleText;
  inPageNav.appendChild(inPageNavTitle);
  const inPageNavList = document.createElement("ul");
  inPageNavList.classList.add(IN_PAGE_NAV_LIST_CLASS);
  inPageNav.appendChild(inPageNavList);
  sectionHeadings.forEach((el, i) => {
    const listItem = document.createElement("li");
    const navLinks = document.createElement("a");
    const anchorTag = document.createElement("a");
    const textContentOfLink = el.textContent;
    const tag = el.tagName.toLowerCase();
    listItem.classList.add(IN_PAGE_NAV_ITEM_CLASS);
    if (tag === "h3") {
      listItem.classList.add(SUB_ITEM_CLASS);
    }
    navLinks.setAttribute("href", `#section_${i}`);
    navLinks.setAttribute("class", IN_PAGE_NAV_LINK_CLASS);
    navLinks.textContent = textContentOfLink;
    anchorTag.setAttribute("id", `section_${i}`);
    anchorTag.setAttribute("class", IN_PAGE_NAV_ANCHOR_CLASS);
    el.insertAdjacentElement("afterbegin", anchorTag);
    inPageNavList.appendChild(listItem);
    listItem.appendChild(navLinks);
  });
  inPageNavEl.appendChild(inPageNav);
  const anchorTags = getSectionAnchors();
  const observeSections = new window.IntersectionObserver(setActive, options);
  anchorTags.forEach(tag => {
    observeSections.observe(tag);
  });
};

/**
 * Handle click from link
 *
 * @param {HTMLElement} el An element within the in-page nav component
 */
const handleClickFromLink = el => {
  const elementToScrollTo = document.querySelector(el.hash);
  handleScrollToSection(elementToScrollTo);
};

/**
 * Handle the enter event from a link within the in-page nav component
 *
 * @param {KeyboardEvent} event An event within the in-page nav component
 */
const handleEnterFromLink = event => {
  const id = getSectionId(event);
  const targetAnchor = document.getElementById(id);
  const target = targetAnchor.parentElement;
  if (target) {
    target.setAttribute("tabindex", 0);
    target.focus();
    target.addEventListener("blur", once(() => {
      target.setAttribute("tabindex", -1);
    }));
  } else {
    // throw an error?
  }
  handleScrollToSection(target);
};
const inPageNavigation = behavior({
  [CLICK]: {
    [`.${IN_PAGE_NAV_LINK_CLASS}`](event) {
      event.preventDefault();
      if (this.disabled) return;
      handleClickFromLink(this);
    }
  },
  keydown: {
    [`.${IN_PAGE_NAV_LINK_CLASS}`]: keymap({
      Enter: handleEnterFromLink
    })
  }
}, {
  init(root) {
    selectOrMatches(`.${IN_PAGE_NAV_CLASS}`, root).forEach(inPageNavEl => {
      createInPageNav(inPageNavEl);
    });
  }
});
module.exports = inPageNavigation;

},{"../../uswds-core/src/js/config":22,"../../uswds-core/src/js/events":23,"../../uswds-core/src/js/utils/behavior":31,"../../uswds-core/src/js/utils/sanitizer":36,"../../uswds-core/src/js/utils/select-or-matches":38,"receptor/keymap":54,"receptor/once":55}],12:[function(require,module,exports){
"use strict";

const selectOrMatches = require("../../uswds-core/src/js/utils/select-or-matches");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const MASKED_CLASS = `${PREFIX}-masked`;
const MASKED = `.${MASKED_CLASS}`;
const MASK = `${PREFIX}-input-mask`;
const MASK_CONTENT = `${MASK}--content`;
const PLACEHOLDER = "placeholder";
const CONTEXT = "form";

// User defined Values
const maskedNumber = "_#dDmMyY9";
const maskedLetter = "A";

// replaces each masked input with a shell containing the input and it's mask.
const createMaskedInputShell = input => {
  const placeholder = input.getAttribute(`${PLACEHOLDER}`);
  if (placeholder) {
    input.setAttribute("maxlength", placeholder.length);
    input.setAttribute("data-placeholder", placeholder);
    input.removeAttribute(`${PLACEHOLDER}`);
  } else {
    return;
  }
  const shell = document.createElement("span");
  shell.classList.add(MASK);
  shell.setAttribute("data-mask", placeholder);
  const content = document.createElement("span");
  content.classList.add(MASK_CONTENT);
  content.setAttribute("aria-hidden", "true");
  content.id = `${input.id}Mask`;
  content.textContent = placeholder;
  shell.appendChild(content);
  input.closest(CONTEXT).insertBefore(shell, input);
  shell.appendChild(input);
};
const setValueOfMask = el => {
  const {
    value
  } = el;
  const placeholderVal = `${el.dataset.placeholder.substr(value.length)}`;
  const theIEl = document.createElement("i");
  theIEl.textContent = value;
  return [theIEl, placeholderVal];
};
const strippedValue = (isCharsetPresent, value) => isCharsetPresent ? value.replace(/\W/g, "") : value.replace(/\D/g, "");
const isInteger = value => !Number.isNaN(parseInt(value, 10));
const isLetter = value => value ? value.match(/[A-Z]/i) : false;
const handleCurrentValue = el => {
  const isCharsetPresent = el.dataset.charset;
  const placeholder = isCharsetPresent || el.dataset.placeholder;
  const {
    value
  } = el;
  const len = placeholder.length;
  let newValue = "";
  let i;
  let charIndex;
  const strippedVal = strippedValue(isCharsetPresent, value);
  for (i = 0, charIndex = 0; i < len; i += 1) {
    const isInt = isInteger(strippedVal[charIndex]);
    const isLet = isLetter(strippedVal[charIndex]);
    const matchesNumber = maskedNumber.indexOf(placeholder[i]) >= 0;
    const matchesLetter = maskedLetter.indexOf(placeholder[i]) >= 0;
    if (matchesNumber && isInt || isCharsetPresent && matchesLetter && isLet) {
      newValue += strippedVal[charIndex];
      charIndex += 1;
    } else if (!isCharsetPresent && !isInt && matchesNumber || isCharsetPresent && (matchesLetter && !isLet || matchesNumber && !isInt)) {
      return newValue;
    } else {
      newValue += placeholder[i];
    }
    // break if no characters left and the pattern is non-special character
    if (strippedVal[charIndex] === undefined) {
      break;
    }
  }
  return newValue;
};
const handleValueChange = el => {
  const inputEl = el;
  const id = inputEl.getAttribute("id");
  inputEl.value = handleCurrentValue(inputEl);
  const maskVal = setValueOfMask(el);
  const maskEl = document.getElementById(`${id}Mask`);
  maskEl.textContent = "";
  maskEl.replaceChildren(maskVal[0], maskVal[1]);
};
const inputMaskEvents = {
  keyup: {
    [MASKED]() {
      handleValueChange(this);
    }
  }
};
const inputMask = behavior(inputMaskEvents, {
  init(root) {
    selectOrMatches(MASKED, root).forEach(maskedInput => {
      createMaskedInputShell(maskedInput);
    });
  }
});
module.exports = inputMask;

},{"../../uswds-core/src/js/config":22,"../../uswds-core/src/js/utils/behavior":31,"../../uswds-core/src/js/utils/select-or-matches":38}],13:[function(require,module,exports){
"use strict";

const behavior = require("../../uswds-core/src/js/utils/behavior");
const select = require("../../uswds-core/src/js/utils/select");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const {
  CLICK
} = require("../../uswds-core/src/js/events");
const CONTAINER = `.${PREFIX}-input-group`;
const INPUT = `${CONTAINER} .${PREFIX}-input`;
const DECORATION = `${CONTAINER} .${PREFIX}-input-prefix, ${CONTAINER} .${PREFIX}-input-suffix`;
const FOCUS_CLASS = "is-focused";
function setFocus(el) {
  el.closest(CONTAINER).querySelector(`.${PREFIX}-input`).focus();
}
function handleFocus() {
  this.closest(CONTAINER).classList.add(FOCUS_CLASS);
}
function handleBlur() {
  this.closest(CONTAINER).classList.remove(FOCUS_CLASS);
}
const inputPrefixSuffix = behavior({
  [CLICK]: {
    [DECORATION]() {
      setFocus(this);
    }
  }
}, {
  init(root) {
    select(INPUT, root).forEach(inputEl => {
      inputEl.addEventListener("focus", handleFocus, false);
      inputEl.addEventListener("blur", handleBlur, false);
    });
  }
});
module.exports = inputPrefixSuffix;

},{"../../uswds-core/src/js/config":22,"../../uswds-core/src/js/events":23,"../../uswds-core/src/js/utils/behavior":31,"../../uswds-core/src/js/utils/select":39}],14:[function(require,module,exports){
"use strict";

const keymap = require("receptor/keymap");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const toggle = require("../../uswds-core/src/js/utils/toggle");
const FocusTrap = require("../../uswds-core/src/js/utils/focus-trap");
const accordion = require("../../usa-accordion/src/index");
const {
  CLICK
} = require("../../uswds-core/src/js/events");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const BODY = "body";
const LANGUAGE = `.${PREFIX}-language`;
const LANGUAGE_SUB = `.${PREFIX}-language__submenu`;
const LANGUAGE_PRIMARY = `.${PREFIX}-language__primary`;
const LANGUAGE_PRIMARY_ITEM = `.${PREFIX}-language__primary-item`;
const LANGUAGE_CONTROL = `button.${PREFIX}-language__link`;
const LANGUAGE_LINKS = `${LANGUAGE} a`;
let languageSelector;
let languageActive;
const onLanguageClose = () => languageSelector.toggleLanguage.call(languageSelector, false);
const hideActiveLanguageDropdown = () => {
  if (!languageActive) {
    return;
  }
  toggle(languageActive, false);
  languageActive = null;
};
const focusLanguageButton = event => {
  const parentLanguageItem = event.target.closest(LANGUAGE_PRIMARY_ITEM);
  if (!event.target.matches(LANGUAGE_CONTROL)) {
    parentLanguageItem.querySelector(LANGUAGE_CONTROL).focus();
  }
};
const handleEscape = event => {
  hideActiveLanguageDropdown();
  focusLanguageButton(event);
};
languageSelector = behavior({
  [CLICK]: {
    [LANGUAGE_CONTROL]() {
      if (languageActive !== this) {
        hideActiveLanguageDropdown();
      }
      if (languageActive === this) {
        hideActiveLanguageDropdown();
        return false;
      }
      if (!languageActive) {
        languageActive = this;
        toggle(languageActive, true);
      }
      return false;
    },
    [BODY]: hideActiveLanguageDropdown,
    [LANGUAGE_LINKS]() {
      const acc = this.closest(accordion.ACCORDION);
      if (acc) {
        accordion.getButtons(acc).forEach(btn => accordion.hide(btn));
      }
    }
  },
  keydown: {
    [LANGUAGE_PRIMARY]: keymap({
      Escape: handleEscape
    })
  },
  focusout: {
    [LANGUAGE_PRIMARY](event) {
      const language = event.target.closest(LANGUAGE_PRIMARY);
      if (!language.contains(event.relatedTarget)) {
        hideActiveLanguageDropdown();
      }
    }
  }
}, {
  init(root) {
    const trapContainer = root.matches(LANGUAGE_SUB) ? root : root.querySelector(LANGUAGE_SUB);
    if (trapContainer) {
      languageSelector.focusTrap = FocusTrap(trapContainer, {
        Escape: onLanguageClose
      });
    }
  },
  teardown() {
    languageActive = false;
  },
  focusTrap: null
});
module.exports = languageSelector;

},{"../../usa-accordion/src/index":2,"../../uswds-core/src/js/config":22,"../../uswds-core/src/js/events":23,"../../uswds-core/src/js/utils/behavior":31,"../../uswds-core/src/js/utils/focus-trap":33,"../../uswds-core/src/js/utils/toggle":42,"receptor/keymap":54}],15:[function(require,module,exports){
"use strict";

const selectOrMatches = require("../../uswds-core/src/js/utils/select-or-matches");
const FocusTrap = require("../../uswds-core/src/js/utils/focus-trap");
const ScrollBarWidth = require("../../uswds-core/src/js/utils/scrollbar-width");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const MODAL_CLASSNAME = `${PREFIX}-modal`;
const OVERLAY_CLASSNAME = `${MODAL_CLASSNAME}-overlay`;
const WRAPPER_CLASSNAME = `${MODAL_CLASSNAME}-wrapper`;
const OPENER_ATTRIBUTE = "data-open-modal";
const CLOSER_ATTRIBUTE = "data-close-modal";
const FORCE_ACTION_ATTRIBUTE = "data-force-action";
const NON_MODAL_HIDDEN_ATTRIBUTE = `data-modal-hidden`;
const MODAL = `.${MODAL_CLASSNAME}`;
const INITIAL_FOCUS = `.${WRAPPER_CLASSNAME} *[data-focus]`;
const CLOSE_BUTTON = `${WRAPPER_CLASSNAME} *[${CLOSER_ATTRIBUTE}]`;
const OPENERS = `*[${OPENER_ATTRIBUTE}][aria-controls]`;
const CLOSERS = `${CLOSE_BUTTON}, .${OVERLAY_CLASSNAME}:not([${FORCE_ACTION_ATTRIBUTE}])`;
const NON_MODALS = `body > *:not(.${WRAPPER_CLASSNAME}):not([aria-hidden])`;
const NON_MODALS_HIDDEN = `[${NON_MODAL_HIDDEN_ATTRIBUTE}]`;
const ACTIVE_CLASS = "usa-js-modal--active";
const PREVENT_CLICK_CLASS = "usa-js-no-click";
const VISIBLE_CLASS = "is-visible";
const HIDDEN_CLASS = "is-hidden";
let modal;
const isActive = () => document.body.classList.contains(ACTIVE_CLASS);
const SCROLLBAR_WIDTH = ScrollBarWidth();
const INITIAL_PADDING = window.getComputedStyle(document.body).getPropertyValue("padding-right");
const TEMPORARY_PADDING = `${parseInt(INITIAL_PADDING.replace(/px/, ""), 10) + parseInt(SCROLLBAR_WIDTH.replace(/px/, ""), 10)}px`;

/**
 *  Is bound to escape key, closes modal when
 */
const onMenuClose = () => {
  modal.toggleModal.call(modal, false);
};

/**
 *  Toggle the visibility of a modal window
 *
 * @param {KeyboardEvent} event the keydown event
 * @returns {boolean} safeActive if mobile is open
 */
function toggleModal(event) {
  let originalOpener;
  let clickedElement = event.target;
  const {
    body
  } = document;
  const safeActive = !isActive();
  const modalId = clickedElement ? clickedElement.getAttribute("aria-controls") : document.querySelector(".usa-modal-wrapper.is-visible");
  const targetModal = safeActive ? document.getElementById(modalId) : document.querySelector(".usa-modal-wrapper.is-visible");

  // if there is no modal we return early
  if (!targetModal) {
    return false;
  }
  const openFocusEl = targetModal.querySelector(INITIAL_FOCUS) ? targetModal.querySelector(INITIAL_FOCUS) : targetModal.querySelector(".usa-modal");
  const returnFocus = document.getElementById(targetModal.getAttribute("data-opener"));
  const menuButton = body.querySelector(OPENERS);
  const forceUserAction = targetModal.getAttribute(FORCE_ACTION_ATTRIBUTE);

  // Sets the clicked element to the close button
  // so esc key always closes modal
  if (event.type === "keydown" && targetModal !== null) {
    clickedElement = targetModal.querySelector(CLOSE_BUTTON);
  }

  // When we're not hitting the escape key…
  if (clickedElement) {
    // Make sure we click the opener
    // If it doesn't have an ID, make one
    // Store id as data attribute on modal
    if (clickedElement.hasAttribute(OPENER_ATTRIBUTE)) {
      if (this.getAttribute("id") === null) {
        originalOpener = `modal-${Math.floor(Math.random() * 900000) + 100000}`;
        this.setAttribute("id", originalOpener);
      } else {
        originalOpener = this.getAttribute("id");
      }
      targetModal.setAttribute("data-opener", originalOpener);
    }

    // This basically stops the propagation if the element
    // is inside the modal and not a close button or
    // element inside a close button
    if (clickedElement.closest(`.${MODAL_CLASSNAME}`)) {
      if (clickedElement.hasAttribute(CLOSER_ATTRIBUTE) || clickedElement.closest(`[${CLOSER_ATTRIBUTE}]`)) {
        // do nothing. move on.
      } else {
        event.stopPropagation();
        return false;
      }
    }
  }
  body.classList.toggle(ACTIVE_CLASS, safeActive);
  targetModal.classList.toggle(VISIBLE_CLASS, safeActive);
  targetModal.classList.toggle(HIDDEN_CLASS, !safeActive);

  // If user is forced to take an action, adding
  // a class to the body that prevents clicking underneath
  // overlay
  if (forceUserAction) {
    body.classList.toggle(PREVENT_CLICK_CLASS, safeActive);
  }

  // Account for content shifting from body overflow: hidden
  // We only check paddingRight in case apps are adding other properties
  // to the body element
  body.style.paddingRight = body.style.paddingRight === TEMPORARY_PADDING ? INITIAL_PADDING : TEMPORARY_PADDING;

  // Handle the focus actions
  if (safeActive && openFocusEl) {
    // The modal window is opened. Focus is set to close button.

    // Binds escape key if we're not forcing
    // the user to take an action
    if (forceUserAction) {
      modal.focusTrap = FocusTrap(targetModal);
    } else {
      modal.focusTrap = FocusTrap(targetModal, {
        Escape: onMenuClose
      });
    }

    // Handles focus setting and interactions
    modal.focusTrap.update(safeActive);
    openFocusEl.focus();

    // Hides everything that is not the modal from screen readers
    document.querySelectorAll(NON_MODALS).forEach(nonModal => {
      nonModal.setAttribute("aria-hidden", "true");
      nonModal.setAttribute(NON_MODAL_HIDDEN_ATTRIBUTE, "");
    });
  } else if (!safeActive && menuButton && returnFocus) {
    // The modal window is closed.
    // Non-modals now accesible to screen reader
    document.querySelectorAll(NON_MODALS_HIDDEN).forEach(nonModal => {
      nonModal.removeAttribute("aria-hidden");
      nonModal.removeAttribute(NON_MODAL_HIDDEN_ATTRIBUTE);
    });

    // Focus is returned to the opener
    returnFocus.focus();
    modal.focusTrap.update(safeActive);
  }
  return safeActive;
}

/**
 *  Builds modal window from base HTML
 *
 * @param {HTMLElement} baseComponent the modal html in the DOM
 */
const setUpModal = baseComponent => {
  const modalContent = baseComponent;
  const modalWrapper = document.createElement("div");
  const overlayDiv = document.createElement("div");
  const modalID = baseComponent.getAttribute("id");
  const ariaLabelledBy = baseComponent.getAttribute("aria-labelledby");
  const ariaDescribedBy = baseComponent.getAttribute("aria-describedby");
  const forceUserAction = baseComponent.hasAttribute(FORCE_ACTION_ATTRIBUTE) ? baseComponent.hasAttribute(FORCE_ACTION_ATTRIBUTE) : false;
  // Create placeholder where modal is for cleanup
  const originalLocationPlaceHolder = document.createElement("div");
  originalLocationPlaceHolder.setAttribute(`data-placeholder-for`, modalID);
  originalLocationPlaceHolder.style.display = "none";
  originalLocationPlaceHolder.setAttribute('aria-hidden', 'true');
  for (let attributeIndex = 0; attributeIndex < modalContent.attributes.length; attributeIndex += 1) {
    const attribute = modalContent.attributes[attributeIndex];
    originalLocationPlaceHolder.setAttribute(`data-original-${attribute.name}`, attribute.value);
  }
  modalContent.after(originalLocationPlaceHolder);

  // Rebuild the modal element
  modalContent.parentNode.insertBefore(modalWrapper, modalContent);
  modalWrapper.appendChild(modalContent);
  modalContent.parentNode.insertBefore(overlayDiv, modalContent);
  overlayDiv.appendChild(modalContent);

  // Add classes and attributes
  modalWrapper.classList.add(HIDDEN_CLASS);
  modalWrapper.classList.add(WRAPPER_CLASSNAME);
  overlayDiv.classList.add(OVERLAY_CLASSNAME);

  // Set attributes
  modalWrapper.setAttribute("role", "dialog");
  modalWrapper.setAttribute("id", modalID);
  if (ariaLabelledBy) {
    modalWrapper.setAttribute("aria-labelledby", ariaLabelledBy);
  }
  if (ariaDescribedBy) {
    modalWrapper.setAttribute("aria-describedby", ariaDescribedBy);
  }
  if (forceUserAction) {
    modalWrapper.setAttribute(FORCE_ACTION_ATTRIBUTE, "true");
  }

  // Update the base element HTML
  baseComponent.removeAttribute("id");
  baseComponent.removeAttribute("aria-labelledby");
  baseComponent.removeAttribute("aria-describedby");
  baseComponent.setAttribute("tabindex", "-1");

  // Add aria-controls
  const modalClosers = modalWrapper.querySelectorAll(CLOSERS);
  modalClosers.forEach(el => {
    el.setAttribute("aria-controls", modalID);
  });

  // Move all modals to the end of the DOM. Doing this allows us to
  // more easily find the elements to hide from screen readers
  // when the modal is open.
  document.body.appendChild(modalWrapper);
};
const cleanUpModal = baseComponent => {
  const modalContent = baseComponent;
  const modalWrapper = modalContent.parentElement.parentElement;
  const modalID = modalWrapper.getAttribute("id");
  const originalLocationPlaceHolder = document.querySelector(`[data-placeholder-for="${modalID}"]`);
  if (originalLocationPlaceHolder) {
    for (let attributeIndex = 0; attributeIndex < originalLocationPlaceHolder.attributes.length; attributeIndex += 1) {
      const attribute = originalLocationPlaceHolder.attributes[attributeIndex];
      if (attribute.name.startsWith('data-original-')) {
        // data-original- is 14 long
        modalContent.setAttribute(attribute.name.substr(14), attribute.value);
      }
    }
    originalLocationPlaceHolder.after(modalContent);
    originalLocationPlaceHolder.parentElement.removeChild(originalLocationPlaceHolder);
  }
  modalWrapper.parentElement.removeChild(modalWrapper);
};
modal = {
  init(root) {
    selectOrMatches(MODAL, root).forEach(modalWindow => {
      const modalId = modalWindow.id;
      setUpModal(modalWindow);

      // this will query all openers and closers including the overlay
      document.querySelectorAll(`[aria-controls="${modalId}"]`).forEach(item => {
        // Turn anchor links into buttons because of
        // VoiceOver on Safari
        if (item.nodeName === "A") {
          item.setAttribute("role", "button");
          item.addEventListener("click", e => e.preventDefault());
        }

        // Can uncomment when aria-haspopup="dialog" is supported
        // https://a11ysupport.io/tech/aria/aria-haspopup_attribute
        // Most screen readers support aria-haspopup, but might announce
        // as opening a menu if "dialog" is not supported.
        // item.setAttribute("aria-haspopup", "dialog");

        item.addEventListener("click", toggleModal);
      });
    });
  },
  teardown(root) {
    selectOrMatches(MODAL, root).forEach(modalWindow => {
      cleanUpModal(modalWindow);
      const modalId = modalWindow.id;
      document.querySelectorAll(`[aria-controls="${modalId}"]`).forEach(item => item.removeEventListener("click", toggleModal));
    });
  },
  focusTrap: null,
  toggleModal,
  on(root) {
    this.init(root);
  },
  off(root) {
    this.teardown(root);
  }
};
module.exports = modal;

},{"../../uswds-core/src/js/config":22,"../../uswds-core/src/js/utils/focus-trap":33,"../../uswds-core/src/js/utils/scrollbar-width":37,"../../uswds-core/src/js/utils/select-or-matches":38}],16:[function(require,module,exports){
"use strict";

const ignore = require("receptor/ignore");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const select = require("../../uswds-core/src/js/utils/select");
const {
  CLICK
} = require("../../uswds-core/src/js/events");
const BUTTON = ".js-search-button";
const FORM = ".js-search-form";
const INPUT = "[type=search]";
const CONTEXT = "header"; // XXX

let lastButton;
const getForm = button => {
  const context = button.closest(CONTEXT);
  return context ? context.querySelector(FORM) : document.querySelector(FORM);
};
const toggleSearch = (button, active) => {
  const form = getForm(button);
  if (!form) {
    throw new Error(`No ${FORM} found for search toggle in ${CONTEXT}!`);
  }

  /* eslint-disable no-param-reassign */
  button.hidden = active;
  form.hidden = !active;
  /* eslint-enable */

  if (!active) {
    return;
  }
  const input = form.querySelector(INPUT);
  if (input) {
    input.focus();
  }
  // when the user clicks _outside_ of the form w/ignore(): hide the
  // search, then remove the listener
  const listener = ignore(form, () => {
    if (lastButton) {
      hideSearch.call(lastButton); // eslint-disable-line no-use-before-define
    }

    document.body.removeEventListener(CLICK, listener);
  });

  // Normally we would just run this code without a timeout, but
  // IE11 and Edge will actually call the listener *immediately* because
  // they are currently handling this exact type of event, so we'll
  // make sure the browser is done handling the current click event,
  // if any, before we attach the listener.
  setTimeout(() => {
    document.body.addEventListener(CLICK, listener);
  }, 0);
};
function showSearch() {
  toggleSearch(this, true);
  lastButton = this;
}
function hideSearch() {
  toggleSearch(this, false);
  lastButton = undefined;
}
const search = behavior({
  [CLICK]: {
    [BUTTON]: showSearch
  }
}, {
  init(target) {
    select(BUTTON, target).forEach(button => {
      toggleSearch(button, false);
    });
  },
  teardown() {
    // forget the last button clicked
    lastButton = undefined;
  }
});
module.exports = search;

},{"../../uswds-core/src/js/events":23,"../../uswds-core/src/js/utils/behavior":31,"../../uswds-core/src/js/utils/select":39,"receptor/ignore":52}],17:[function(require,module,exports){
"use strict";

const once = require("receptor/once");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const {
  CLICK
} = require("../../uswds-core/src/js/events");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const LINK = `.${PREFIX}-skipnav[href^="#"], .${PREFIX}-footer__return-to-top [href^="#"]`;
const MAINCONTENT = "main-content";
function setTabindex() {
  // NB: we know because of the selector we're delegating to below that the
  // href already begins with '#'
  const id = encodeURI(this.getAttribute("href"));
  const target = document.getElementById(id === "#" ? MAINCONTENT : id.slice(1));
  if (target) {
    target.style.outline = "0";
    target.setAttribute("tabindex", 0);
    target.focus();
    target.addEventListener("blur", once(() => {
      target.setAttribute("tabindex", -1);
    }));
  } else {
    // throw an error?
  }
}
module.exports = behavior({
  [CLICK]: {
    [LINK]: setTabindex
  }
});

},{"../../uswds-core/src/js/config":22,"../../uswds-core/src/js/events":23,"../../uswds-core/src/js/utils/behavior":31,"receptor/once":55}],18:[function(require,module,exports){
"use strict";

const select = require("../../uswds-core/src/js/utils/select");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const {
  CLICK
} = require("../../uswds-core/src/js/events");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const Sanitizer = require("../../uswds-core/src/js/utils/sanitizer");
const TABLE = `.${PREFIX}-table`;
const SORTED = "aria-sort";
const ASCENDING = "ascending";
const DESCENDING = "descending";
const SORT_OVERRIDE = "data-sort-value";
const SORT_BUTTON_CLASS = `${PREFIX}-table__header__button`;
const SORT_BUTTON = `.${SORT_BUTTON_CLASS}`;
const SORTABLE_HEADER = `th[data-sortable]`;
const ANNOUNCEMENT_REGION = `.${PREFIX}-table__announcement-region[aria-live="polite"]`;

/** Gets the data-sort-value attribute value, if provided — otherwise, gets
 * the innerText or textContent — of the child element (HTMLTableCellElement)
 * at the specified index of the given table row
 *
 * @param {number} index
 * @param {array<HTMLTableRowElement>} tr
 * @return {boolean}
 */
const getCellValue = (tr, index) => tr.children[index].getAttribute(SORT_OVERRIDE) || tr.children[index].innerText || tr.children[index].textContent;

/**
 * Compares the values of two row array items at the given index, then sorts by the given direction
 * @param {number} index
 * @param {string} direction
 * @return {boolean}
 */
const compareFunction = (index, isAscending) => (thisRow, nextRow) => {
  // get values to compare from data attribute or cell content
  const value1 = getCellValue(isAscending ? thisRow : nextRow, index);
  const value2 = getCellValue(isAscending ? nextRow : thisRow, index);

  // if neither value is empty, and if both values are already numbers, compare numerically
  if (value1 && value2 && !Number.isNaN(Number(value1)) && !Number.isNaN(Number(value2))) {
    return value1 - value2;
  }
  // Otherwise, compare alphabetically based on current user locale
  return value1.toString().localeCompare(value2, navigator.language, {
    numeric: true,
    ignorePunctuation: true
  });
};

/**
 * Get an Array of column headers elements belonging directly to the given
 * table element.
 * @param {HTMLTableElement} table
 * @return {array<HTMLTableHeaderCellElement>}
 */
const getColumnHeaders = table => {
  const headers = select(SORTABLE_HEADER, table);
  return headers.filter(header => header.closest(TABLE) === table);
};

/**
 * Update the button label within the given header element, resetting it
 * to the default state (ready to sort ascending) if it's no longer sorted
 * @param {HTMLTableHeaderCellElement} header
 */
const updateSortLabel = header => {
  const headerName = header.innerText;
  const sortedAscending = header.getAttribute(SORTED) === ASCENDING;
  const isSorted = header.getAttribute(SORTED) === ASCENDING || header.getAttribute(SORTED) === DESCENDING || false;
  const headerLabel = `${headerName}', sortable column, currently ${isSorted ? `${sortedAscending ? `sorted ${ASCENDING}` : `sorted ${DESCENDING}`}` : "unsorted"}`;
  const headerButtonLabel = `Click to sort by ${headerName} in ${sortedAscending ? DESCENDING : ASCENDING} order.`;
  header.setAttribute("aria-label", headerLabel);
  header.querySelector(SORT_BUTTON).setAttribute("title", headerButtonLabel);
};

/**
 * Remove the aria-sort attribute on the given header element, and reset the label and button icon
 * @param {HTMLTableHeaderCellElement} header
 */
const unsetSort = header => {
  header.removeAttribute(SORTED);
  updateSortLabel(header);
};

/**
 * Sort rows either ascending or descending, based on a given header's aria-sort attribute
 * @param {HTMLTableHeaderCellElement} header
 * @param {boolean} isAscending
 * @return {boolean} true
 */
const sortRows = (header, isAscending) => {
  header.setAttribute(SORTED, isAscending === true ? DESCENDING : ASCENDING);
  updateSortLabel(header);
  const tbody = header.closest(TABLE).querySelector("tbody");

  // We can use Array.from() and Array.sort() instead once we drop IE11 support, likely in the summer of 2021
  //
  // Array.from(tbody.querySelectorAll('tr').sort(
  //   compareFunction(
  //     Array.from(header.parentNode.children).indexOf(header),
  //     !isAscending)
  //   )
  // .forEach(tr => tbody.appendChild(tr) );

  // [].slice.call() turns array-like sets into true arrays so that we can sort them
  const allRows = [].slice.call(tbody.querySelectorAll("tr"));
  const allHeaders = [].slice.call(header.parentNode.children);
  const thisHeaderIndex = allHeaders.indexOf(header);
  allRows.sort(compareFunction(thisHeaderIndex, !isAscending)).forEach(tr => {
    [].slice.call(tr.children).forEach(td => td.removeAttribute("data-sort-active"));
    tr.children[thisHeaderIndex].setAttribute("data-sort-active", true);
    tbody.appendChild(tr);
  });
  return true;
};

/**
 * Update the live region immediately following the table whenever sort changes.
 * @param {HTMLTableElement} table
 * @param {HTMLTableHeaderCellElement} sortedHeader
 */

const updateLiveRegion = (table, sortedHeader) => {
  const caption = table.querySelector("caption").innerText;
  const sortedAscending = sortedHeader.getAttribute(SORTED) === ASCENDING;
  const headerLabel = sortedHeader.innerText;
  const liveRegion = table.nextElementSibling;
  if (liveRegion && liveRegion.matches(ANNOUNCEMENT_REGION)) {
    const sortAnnouncement = `The table named "${caption}" is now sorted by ${headerLabel} in ${sortedAscending ? ASCENDING : DESCENDING} order.`;
    liveRegion.innerText = sortAnnouncement;
  } else {
    throw new Error(`Table containing a sortable column header is not followed by an aria-live region.`);
  }
};

/**
 * Toggle a header's sort state, optionally providing a target
 * state.
 *
 * @param {HTMLTableHeaderCellElement} header
 * @param {boolean?} isAscending If no state is provided, the current
 * state will be toggled (from false to true, and vice-versa).
 */
const toggleSort = (header, isAscending) => {
  const table = header.closest(TABLE);
  let safeAscending = isAscending;
  if (typeof safeAscending !== "boolean") {
    safeAscending = header.getAttribute(SORTED) === ASCENDING;
  }
  if (!table) {
    throw new Error(`${SORTABLE_HEADER} is missing outer ${TABLE}`);
  }
  safeAscending = sortRows(header, isAscending);
  if (safeAscending) {
    getColumnHeaders(table).forEach(otherHeader => {
      if (otherHeader !== header) {
        unsetSort(otherHeader);
      }
    });
    updateLiveRegion(table, header);
  }
};

/**
 ** Inserts a button with icon inside a sortable header
 * @param {HTMLTableHeaderCellElement} header
 */

const createHeaderButton = header => {
  const buttonEl = document.createElement("button");
  buttonEl.setAttribute("tabindex", "0");
  buttonEl.classList.add(SORT_BUTTON_CLASS);
  // ICON_SOURCE
  buttonEl.innerHTML = Sanitizer.escapeHTML`
  <svg class="${PREFIX}-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <g class="descending" fill="transparent">
      <path d="M17 17L15.59 15.59L12.9999 18.17V2H10.9999V18.17L8.41 15.58L7 17L11.9999 22L17 17Z" />
    </g>
    <g class="ascending" fill="transparent">
      <path transform="rotate(180, 12, 12)" d="M17 17L15.59 15.59L12.9999 18.17V2H10.9999V18.17L8.41 15.58L7 17L11.9999 22L17 17Z" />
    </g>
    <g class="unsorted" fill="transparent">
      <polygon points="15.17 15 13 17.17 13 6.83 15.17 9 16.58 7.59 12 3 7.41 7.59 8.83 9 11 6.83 11 17.17 8.83 15 7.42 16.41 12 21 16.59 16.41 15.17 15"/>
    </g>
  </svg>
  `;
  header.appendChild(buttonEl);
  updateSortLabel(header);
};
const table = behavior({
  [CLICK]: {
    [SORT_BUTTON](event) {
      event.preventDefault();
      toggleSort(event.target.closest(SORTABLE_HEADER), event.target.closest(SORTABLE_HEADER).getAttribute(SORTED) === ASCENDING);
    }
  }
}, {
  init(root) {
    const sortableHeaders = select(SORTABLE_HEADER, root);
    sortableHeaders.forEach(header => createHeaderButton(header));
    const firstSorted = sortableHeaders.filter(header => header.getAttribute(SORTED) === ASCENDING || header.getAttribute(SORTED) === DESCENDING)[0];
    if (typeof firstSorted === "undefined") {
      // no sortable headers found
      return;
    }
    const sortDir = firstSorted.getAttribute(SORTED);
    if (sortDir === ASCENDING) {
      toggleSort(firstSorted, true);
    } else if (sortDir === DESCENDING) {
      toggleSort(firstSorted, false);
    }
  },
  TABLE,
  SORTABLE_HEADER,
  SORT_BUTTON
});
module.exports = table;

},{"../../uswds-core/src/js/config":22,"../../uswds-core/src/js/events":23,"../../uswds-core/src/js/utils/behavior":31,"../../uswds-core/src/js/utils/sanitizer":36,"../../uswds-core/src/js/utils/select":39}],19:[function(require,module,exports){
"use strict";

const behavior = require("../../uswds-core/src/js/utils/behavior");
const selectOrMatches = require("../../uswds-core/src/js/utils/select-or-matches");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const {
  COMBO_BOX_CLASS,
  enhanceComboBox
} = require("../../usa-combo-box/src/index");
const TIME_PICKER_CLASS = `${PREFIX}-time-picker`;
const TIME_PICKER = `.${TIME_PICKER_CLASS}`;
const MAX_TIME = 60 * 24 - 1;
const MIN_TIME = 0;
const DEFAULT_STEP = 30;
const MIN_STEP = 1;
const FILTER_DATASET = {
  filter: "0?{{ hourQueryFilter }}:{{minuteQueryFilter}}.*{{ apQueryFilter }}m?",
  apQueryFilter: "([ap])",
  hourQueryFilter: "([1-9][0-2]?)",
  minuteQueryFilter: "[\\d]+:([0-9]{0,2})"
};

/**
 * Parse a string of hh:mm into minutes
 *
 * @param {string} timeStr the time string to parse
 * @returns {number} the number of minutes
 */
const parseTimeString = timeStr => {
  let minutes;
  if (timeStr) {
    const [hours, mins] = timeStr.split(":").map(str => {
      let value;
      const parsed = parseInt(str, 10);
      if (!Number.isNaN(parsed)) value = parsed;
      return value;
    });
    if (hours != null && mins != null) {
      minutes = hours * 60 + mins;
    }
  }
  return minutes;
};

/**
 * Enhance an input with the date picker elements
 *
 * @param {HTMLElement} el The initial wrapping element of the date picker component
 */
const transformTimePicker = el => {
  const timePickerEl = el.closest(TIME_PICKER);
  const initialInputEl = timePickerEl.querySelector(`input`);
  if (!initialInputEl) {
    throw new Error(`${TIME_PICKER} is missing inner input`);
  }
  const selectEl = document.createElement("select");
  ["id", "name", "required", "aria-label", "aria-labelledby"].forEach(name => {
    if (initialInputEl.hasAttribute(name)) {
      const value = initialInputEl.getAttribute(name);
      selectEl.setAttribute(name, value);
      initialInputEl.removeAttribute(name);
    }
  });
  const padZeros = (value, length) => `0000${value}`.slice(-length);
  const getTimeContext = minutes => {
    const minute = minutes % 60;
    const hour24 = Math.floor(minutes / 60);
    const hour12 = hour24 % 12 || 12;
    const ampm = hour24 < 12 ? "am" : "pm";
    return {
      minute,
      hour24,
      hour12,
      ampm
    };
  };
  const minTime = Math.max(MIN_TIME, parseTimeString(timePickerEl.dataset.minTime) || MIN_TIME);
  const maxTime = Math.min(MAX_TIME, parseTimeString(timePickerEl.dataset.maxTime) || MAX_TIME);
  const step = Math.floor(Math.max(MIN_STEP, timePickerEl.dataset.step || DEFAULT_STEP));
  let defaultValue;
  for (let time = minTime; time <= maxTime; time += step) {
    const {
      minute,
      hour24,
      hour12,
      ampm
    } = getTimeContext(time);
    const option = document.createElement("option");
    option.value = `${padZeros(hour24, 2)}:${padZeros(minute, 2)}`;
    option.text = `${hour12}:${padZeros(minute, 2)}${ampm}`;
    if (option.text === initialInputEl.value) {
      defaultValue = option.value;
    }
    selectEl.appendChild(option);
  }
  timePickerEl.classList.add(COMBO_BOX_CLASS);

  // combo box properties
  Object.keys(FILTER_DATASET).forEach(key => {
    timePickerEl.dataset[key] = FILTER_DATASET[key];
  });
  timePickerEl.dataset.disableFiltering = "true";
  timePickerEl.dataset.defaultValue = defaultValue;
  timePickerEl.appendChild(selectEl);
  initialInputEl.remove();
};
const timePicker = behavior({}, {
  init(root) {
    selectOrMatches(TIME_PICKER, root).forEach(timePickerEl => {
      transformTimePicker(timePickerEl);
      enhanceComboBox(timePickerEl);
    });
  },
  FILTER_DATASET
});
module.exports = timePicker;

},{"../../usa-combo-box/src/index":5,"../../uswds-core/src/js/config":22,"../../uswds-core/src/js/utils/behavior":31,"../../uswds-core/src/js/utils/select-or-matches":38}],20:[function(require,module,exports){
"use strict";

// Tooltips
const selectOrMatches = require("../../uswds-core/src/js/utils/select-or-matches");
const behavior = require("../../uswds-core/src/js/utils/behavior");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const isElementInViewport = require("../../uswds-core/src/js/utils/is-in-viewport");
const TOOLTIP = `.${PREFIX}-tooltip`;
const TOOLTIP_TRIGGER = `.${PREFIX}-tooltip__trigger`;
const TOOLTIP_TRIGGER_CLASS = `${PREFIX}-tooltip__trigger`;
const TOOLTIP_CLASS = `${PREFIX}-tooltip`;
const TOOLTIP_BODY_CLASS = `${PREFIX}-tooltip__body`;
const SET_CLASS = "is-set";
const VISIBLE_CLASS = "is-visible";
const TRIANGLE_SIZE = 5;
const ADJUST_WIDTH_CLASS = `${PREFIX}-tooltip__body--wrap`;

/**
 *
 * @param {DOMElement} trigger - The tooltip trigger
 * @returns {object} Elements for initialized tooltip; includes trigger, wrapper, and body
 */
const getTooltipElements = trigger => {
  const wrapper = trigger.parentNode;
  const body = wrapper.querySelector(`.${TOOLTIP_BODY_CLASS}`);
  return {
    trigger,
    wrapper,
    body
  };
};

/**
 * Shows the tooltip
 * @param {HTMLElement} tooltipTrigger - the element that initializes the tooltip
 */
const showToolTip = (tooltipBody, tooltipTrigger, position) => {
  tooltipBody.setAttribute("aria-hidden", "false");

  // This sets up the tooltip body. The opacity is 0, but
  // we can begin running the calculations below.
  tooltipBody.classList.add(SET_CLASS);

  /**
   * Position the tooltip body when the trigger is hovered
   * Removes old positioning classnames and reapplies. This allows
   * positioning to change in case the user resizes browser or DOM manipulation
   * causes tooltip to get clipped from viewport
   *
   * @param {string} setPos - can be "top", "bottom", "right", "left"
   */
  const setPositionClass = setPos => {
    tooltipBody.classList.remove(`${TOOLTIP_BODY_CLASS}--top`);
    tooltipBody.classList.remove(`${TOOLTIP_BODY_CLASS}--bottom`);
    tooltipBody.classList.remove(`${TOOLTIP_BODY_CLASS}--right`);
    tooltipBody.classList.remove(`${TOOLTIP_BODY_CLASS}--left`);
    tooltipBody.classList.add(`${TOOLTIP_BODY_CLASS}--${setPos}`);
  };

  /**
   * Removes old positioning styles. This allows
   * re-positioning to change without inheriting other
   * dynamic styles
   *
   * @param {HTMLElement} e - this is the tooltip body
   */
  const resetPositionStyles = e => {
    // we don't override anything in the stylesheet when finding alt positions
    e.style.top = null;
    e.style.bottom = null;
    e.style.right = null;
    e.style.left = null;
    e.style.margin = null;
  };

  /**
   * get margin offset calculations
   *
   * @param {HTMLElement} target - this is the tooltip body
   * @param {String} propertyValue - this is the tooltip body
   */

  const offsetMargin = (target, propertyValue) => parseInt(window.getComputedStyle(target).getPropertyValue(propertyValue), 10);

  // offsetLeft = the left position, and margin of the element, the left
  // padding, scrollbar and border of the offsetParent element
  // offsetWidth = The offsetWidth property returns the viewable width of an
  // element in pixels, including padding, border and scrollbar, but not
  // the margin.

  /**
   * Calculate margin offset
   * tooltip trigger margin(position) offset + tooltipBody offsetWidth
   * @param {String} marginPosition
   * @param {Number} tooltipBodyOffset
   * @param {HTMLElement} trigger
   */
  const calculateMarginOffset = (marginPosition, tooltipBodyOffset, trigger) => {
    const offset = offsetMargin(trigger, `margin-${marginPosition}`) > 0 ? tooltipBodyOffset - offsetMargin(trigger, `margin-${marginPosition}`) : tooltipBodyOffset;
    return offset;
  };

  /**
   * Positions tooltip at the top
   * @param {HTMLElement} e - this is the tooltip body
   */
  const positionTop = e => {
    resetPositionStyles(e); // ensures we start from the same point
    // get details on the elements object with

    const topMargin = calculateMarginOffset("top", e.offsetHeight, tooltipTrigger);
    const leftMargin = calculateMarginOffset("left", e.offsetWidth, tooltipTrigger);
    setPositionClass("top");
    e.style.left = `50%`; // center the element
    e.style.top = `-${TRIANGLE_SIZE}px`; // consider the pseudo element
    // apply our margins based on the offset
    e.style.margin = `-${topMargin}px 0 0 -${leftMargin / 2}px`;
  };

  /**
   * Positions tooltip at the bottom
   * @param {HTMLElement} e - this is the tooltip body
   */
  const positionBottom = e => {
    resetPositionStyles(e);
    const leftMargin = calculateMarginOffset("left", e.offsetWidth, tooltipTrigger);
    setPositionClass("bottom");
    e.style.left = `50%`;
    e.style.margin = `${TRIANGLE_SIZE}px 0 0 -${leftMargin / 2}px`;
  };

  /**
   * Positions tooltip at the right
   * @param {HTMLElement} e - this is the tooltip body
   */
  const positionRight = e => {
    resetPositionStyles(e);
    const topMargin = calculateMarginOffset("top", e.offsetHeight, tooltipTrigger);
    setPositionClass("right");
    e.style.top = `50%`;
    e.style.left = `${tooltipTrigger.offsetLeft + tooltipTrigger.offsetWidth + TRIANGLE_SIZE}px`;
    e.style.margin = `-${topMargin / 2}px 0 0 0`;
  };

  /**
   * Positions tooltip at the right
   * @param {HTMLElement} e - this is the tooltip body
   */
  const positionLeft = e => {
    resetPositionStyles(e);
    const topMargin = calculateMarginOffset("top", e.offsetHeight, tooltipTrigger);

    // we have to check for some utility margins
    const leftMargin = calculateMarginOffset("left", tooltipTrigger.offsetLeft > e.offsetWidth ? tooltipTrigger.offsetLeft - e.offsetWidth : e.offsetWidth, tooltipTrigger);
    setPositionClass("left");
    e.style.top = `50%`;
    e.style.left = `-${TRIANGLE_SIZE}px`;
    e.style.margin = `-${topMargin / 2}px 0 0 ${tooltipTrigger.offsetLeft > e.offsetWidth ? leftMargin : -leftMargin}px`; // adjust the margin
  };

  /**
   * We try to set the position based on the
   * original intention, but make adjustments
   * if the element is clipped out of the viewport
   * we constrain the width only as a last resort
   * @param {HTMLElement} element(alias tooltipBody)
   * @param {Number} attempt (--flag)
   */

  const maxAttempts = 2;
  function findBestPosition(element) {
    let attempt = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
    // create array of optional positions
    const positions = [positionTop, positionBottom, positionRight, positionLeft];
    let hasVisiblePosition = false;

    // we take a recursive approach
    function tryPositions(i) {
      if (i < positions.length) {
        const pos = positions[i];
        pos(element);
        if (!isElementInViewport(element)) {
          // eslint-disable-next-line no-param-reassign
          tryPositions(i += 1);
        } else {
          hasVisiblePosition = true;
        }
      }
    }
    tryPositions(0);
    // if we can't find a position we compress it and try again
    if (!hasVisiblePosition) {
      element.classList.add(ADJUST_WIDTH_CLASS);
      if (attempt <= maxAttempts) {
        // eslint-disable-next-line no-param-reassign
        findBestPosition(element, attempt += 1);
      }
    }
  }
  switch (position) {
    case "top":
      positionTop(tooltipBody);
      if (!isElementInViewport(tooltipBody)) {
        findBestPosition(tooltipBody);
      }
      break;
    case "bottom":
      positionBottom(tooltipBody);
      if (!isElementInViewport(tooltipBody)) {
        findBestPosition(tooltipBody);
      }
      break;
    case "right":
      positionRight(tooltipBody);
      if (!isElementInViewport(tooltipBody)) {
        findBestPosition(tooltipBody);
      }
      break;
    case "left":
      positionLeft(tooltipBody);
      if (!isElementInViewport(tooltipBody)) {
        findBestPosition(tooltipBody);
      }
      break;
    default:
      // skip default case
      break;
  }

  /**
   * Actually show the tooltip. The VISIBLE_CLASS
   * will change the opacity to 1
   */
  setTimeout(() => {
    tooltipBody.classList.add(VISIBLE_CLASS);
  }, 20);
};

/**
 * Removes all the properties to show and position the tooltip,
 * and resets the tooltip position to the original intention
 * in case the window is resized or the element is moved through
 * DOM manipulation.
 * @param {HTMLElement} tooltipBody - The body of the tooltip
 */
const hideToolTip = tooltipBody => {
  tooltipBody.classList.remove(VISIBLE_CLASS);
  tooltipBody.classList.remove(SET_CLASS);
  tooltipBody.classList.remove(ADJUST_WIDTH_CLASS);
  tooltipBody.setAttribute("aria-hidden", "true");
};

/**
 * Setup the tooltip component
 * @param {HTMLElement} tooltipTrigger The element that creates the tooltip
 */
const setUpAttributes = tooltipTrigger => {
  const tooltipID = `tooltip-${Math.floor(Math.random() * 900000) + 100000}`;
  const tooltipContent = tooltipTrigger.getAttribute("title");
  const wrapper = document.createElement("span");
  const tooltipBody = document.createElement("span");
  const position = tooltipTrigger.getAttribute("data-position") ? tooltipTrigger.getAttribute("data-position") : "top";
  const additionalClasses = tooltipTrigger.getAttribute("data-classes");

  // Set up tooltip attributes
  tooltipTrigger.setAttribute("aria-describedby", tooltipID);
  tooltipTrigger.setAttribute("tabindex", "0");
  tooltipTrigger.removeAttribute("title");
  tooltipTrigger.classList.remove(TOOLTIP_CLASS);
  tooltipTrigger.classList.add(TOOLTIP_TRIGGER_CLASS);

  // insert wrapper before el in the DOM tree
  tooltipTrigger.parentNode.insertBefore(wrapper, tooltipTrigger);

  // set up the wrapper
  wrapper.appendChild(tooltipTrigger);
  wrapper.classList.add(TOOLTIP_CLASS);
  wrapper.appendChild(tooltipBody);

  // Apply additional class names to wrapper element
  if (additionalClasses) {
    const classesArray = additionalClasses.split(" ");
    classesArray.forEach(classname => wrapper.classList.add(classname));
  }

  // set up the tooltip body
  tooltipBody.classList.add(TOOLTIP_BODY_CLASS);
  tooltipBody.setAttribute("id", tooltipID);
  tooltipBody.setAttribute("role", "tooltip");
  tooltipBody.setAttribute("aria-hidden", "true");

  // place the text in the tooltip
  tooltipBody.textContent = tooltipContent;
  return {
    tooltipBody,
    position,
    tooltipContent,
    wrapper
  };
};

// Setup our function to run on various events
const tooltip = behavior({
  "mouseover focusin": {
    [TOOLTIP](e) {
      const trigger = e.target;
      const elementType = trigger.nodeName;

      // Initialize tooltip if it hasn't already
      if (elementType === "BUTTON" && trigger.hasAttribute("title")) {
        setUpAttributes(trigger);
      }
    },
    [TOOLTIP_TRIGGER](e) {
      const {
        trigger,
        body
      } = getTooltipElements(e.target);
      showToolTip(body, trigger, trigger.dataset.position);
    }
  },
  "mouseout focusout": {
    [TOOLTIP_TRIGGER](e) {
      const {
        body
      } = getTooltipElements(e.target);
      hideToolTip(body);
    }
  }
}, {
  init(root) {
    selectOrMatches(TOOLTIP, root).forEach(tooltipTrigger => {
      setUpAttributes(tooltipTrigger);
    });
  },
  setup: setUpAttributes,
  getTooltipElements,
  show: showToolTip,
  hide: hideToolTip
});
module.exports = tooltip;

},{"../../uswds-core/src/js/config":22,"../../uswds-core/src/js/utils/behavior":31,"../../uswds-core/src/js/utils/is-in-viewport":34,"../../uswds-core/src/js/utils/select-or-matches":38}],21:[function(require,module,exports){
"use strict";

const behavior = require("../../uswds-core/src/js/utils/behavior");
const validate = require("../../uswds-core/src/js/utils/validate-input");
const {
  prefix: PREFIX
} = require("../../uswds-core/src/js/config");
const selectOrMatches = require("../../uswds-core/src/js/utils/select-or-matches");
const VALIDATE_INPUT = "input[data-validation-element]";
const CHECKLIST_ITEM = `.${PREFIX}-checklist__item`;

// Trigger validation on input change
const handleChange = el => validate(el);

// Create container to hold aria readout
const createStatusElement = input => {
  const validationContainer = input.parentNode;
  const inputID = input.getAttribute("id");
  const statusSummaryID = `${inputID}-sr-summary`;
  input.setAttribute("aria-describedby", statusSummaryID);
  const statusSummaryContainer = document.createElement("span");
  statusSummaryContainer.setAttribute("data-validation-status", "");
  statusSummaryContainer.classList.add("usa-sr-only");
  statusSummaryContainer.setAttribute("aria-live", "polite");
  statusSummaryContainer.setAttribute("aria-atomic", true);
  statusSummaryContainer.setAttribute("id", statusSummaryID);
  validationContainer.append(statusSummaryContainer);
};

// Set up checklist items with initial aria-label (incomplete) values
const createInitialStatus = input => {
  const validationContainer = input.parentNode;
  const checklistItems = validationContainer.querySelectorAll(CHECKLIST_ITEM);
  const validationElement = input.getAttribute("data-validation-element");
  input.setAttribute("aria-controls", validationElement);
  checklistItems.forEach(listItem => {
    let currentStatus = "status incomplete";
    if (input.hasAttribute("data-validation-incomplete")) {
      currentStatus = input.getAttribute("data-validation-incomplete");
    }
    const itemStatus = `${listItem.textContent} ${currentStatus} `;
    listItem.setAttribute("tabindex", "0");
    listItem.setAttribute("aria-label", itemStatus);
  });
};
const enhanceValidation = input => {
  createStatusElement(input);
  createInitialStatus(input);
};
const validator = behavior({
  "input change": {
    [VALIDATE_INPUT](event) {
      handleChange(event.target);
    }
  }
}, {
  init(root) {
    selectOrMatches(VALIDATE_INPUT, root).forEach(input => enhanceValidation(input));
  }
});
module.exports = validator;

},{"../../uswds-core/src/js/config":22,"../../uswds-core/src/js/utils/behavior":31,"../../uswds-core/src/js/utils/select-or-matches":38,"../../uswds-core/src/js/utils/validate-input":43}],22:[function(require,module,exports){
"use strict";

module.exports = {
  prefix: "usa"
};

},{}],23:[function(require,module,exports){
"use strict";

module.exports = {
  // This used to be conditionally dependent on whether the
  // browser supported touch events; if it did, `CLICK` was set to
  // `touchstart`.  However, this had downsides:
  //
  // * It pre-empted mobile browsers' default behavior of detecting
  //   whether a touch turned into a scroll, thereby preventing
  //   users from using some of our components as scroll surfaces.
  //
  // * Some devices, such as the Microsoft Surface Pro, support *both*
  //   touch and clicks. This meant the conditional effectively dropped
  //   support for the user's mouse, frustrating users who preferred
  //   it on those systems.
  CLICK: "click"
};

},{}],24:[function(require,module,exports){
"use strict";

const accordion = require("../../../usa-accordion/src/index");
const banner = require("../../../usa-banner/src/index");
const characterCount = require("../../../usa-character-count/src/index");
const comboBox = require("../../../usa-combo-box/src/index");
const datePicker = require("../../../usa-date-picker/src/index");
const dateRangePicker = require("../../../usa-date-range-picker/src/index");
const fileInput = require("../../../usa-file-input/src/index");
const footer = require("../../../usa-footer/src/index");
const inPageNavigation = require("../../../usa-in-page-navigation/src/index");
const inputMask = require("../../../usa-input-mask/src/index");
const inputPrefixSuffix = require("../../../usa-input-prefix-suffix/src/index");
const languageSelector = require("../../../usa-language-selector/src/index");
const modal = require("../../../usa-modal/src/index");
const navigation = require("../../../usa-header/src/index");
const password = require("../../../_usa-password/src/index");
const search = require("../../../usa-search/src/index");
const skipnav = require("../../../usa-skipnav/src/index");
const table = require("../../../usa-table/src/index");
const timePicker = require("../../../usa-time-picker/src/index");
const tooltip = require("../../../usa-tooltip/src/index");
const validator = require("../../../usa-validation/src/index");
module.exports = {
  accordion,
  banner,
  characterCount,
  comboBox,
  datePicker,
  dateRangePicker,
  fileInput,
  footer,
  inPageNavigation,
  inputMask,
  inputPrefixSuffix,
  languageSelector,
  modal,
  navigation,
  password,
  search,
  skipnav,
  table,
  timePicker,
  tooltip,
  validator
};

},{"../../../_usa-password/src/index":1,"../../../usa-accordion/src/index":2,"../../../usa-banner/src/index":3,"../../../usa-character-count/src/index":4,"../../../usa-combo-box/src/index":5,"../../../usa-date-picker/src/index":6,"../../../usa-date-range-picker/src/index":7,"../../../usa-file-input/src/index":8,"../../../usa-footer/src/index":9,"../../../usa-header/src/index":10,"../../../usa-in-page-navigation/src/index":11,"../../../usa-input-mask/src/index":12,"../../../usa-input-prefix-suffix/src/index":13,"../../../usa-language-selector/src/index":14,"../../../usa-modal/src/index":15,"../../../usa-search/src/index":16,"../../../usa-skipnav/src/index":17,"../../../usa-table/src/index":18,"../../../usa-time-picker/src/index":19,"../../../usa-tooltip/src/index":20,"../../../usa-validation/src/index":21}],25:[function(require,module,exports){
"use strict";

/* eslint-disable consistent-return */
/* eslint-disable func-names */
(function () {
  if (typeof window.CustomEvent === "function") return false;
  function CustomEvent(event, _params) {
    const params = _params || {
      bubbles: false,
      cancelable: false,
      detail: null
    };
    const evt = document.createEvent("CustomEvent");
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
  }
  window.CustomEvent = CustomEvent;
})();

},{}],26:[function(require,module,exports){
"use strict";

const elproto = window.HTMLElement.prototype;
const HIDDEN = "hidden";
if (!(HIDDEN in elproto)) {
  Object.defineProperty(elproto, HIDDEN, {
    get() {
      return this.hasAttribute(HIDDEN);
    },
    set(value) {
      if (value) {
        this.setAttribute(HIDDEN, "");
      } else {
        this.removeAttribute(HIDDEN);
      }
    }
  });
}

},{}],27:[function(require,module,exports){
"use strict";

// polyfills HTMLElement.prototype.classList and DOMTokenList
require("classlist-polyfill");
// polyfills HTMLElement.prototype.hidden
require("./element-hidden");
// polyfills Number.isNaN()
require("./number-is-nan");
// polyfills CustomEvent
require("./custom-event");
// polyfills svg4everybody
require("./svg4everybody");

},{"./custom-event":25,"./element-hidden":26,"./number-is-nan":28,"./svg4everybody":29,"classlist-polyfill":44}],28:[function(require,module,exports){
"use strict";

Number.isNaN = Number.isNaN || function isNaN(input) {
  // eslint-disable-next-line no-self-compare
  return typeof input === "number" && input !== input;
};

},{}],29:[function(require,module,exports){
"use strict";

/* eslint-disable */
!function (factory) {
  module.exports = factory();
}(function () {
  /*! svg4everybody v2.1.9 | github.com/jonathantneal/svg4everybody */
  function embed(parent, svg, target, use) {
    // if the target exists
    if (target) {
      // create a document fragment to hold the contents of the target
      var fragment = document.createDocumentFragment(),
        viewBox = !svg.hasAttribute("viewBox") && target.getAttribute("viewBox");
      // conditionally set the viewBox on the svg
      viewBox && svg.setAttribute("viewBox", viewBox);
      // copy the contents of the clone into the fragment
      for (
      // clone the target
      var clone = document.importNode ? document.importNode(target, !0) : target.cloneNode(!0), g = document.createElementNS(svg.namespaceURI || "http://www.w3.org/2000/svg", "g"); clone.childNodes.length;) {
        g.appendChild(clone.firstChild);
      }
      if (use) {
        for (var i = 0; use.attributes.length > i; i++) {
          var attr = use.attributes[i];
          "xlink:href" !== attr.name && "href" !== attr.name && g.setAttribute(attr.name, attr.value);
        }
      }
      fragment.appendChild(g),
      // append the fragment into the svg
      parent.appendChild(fragment);
    }
  }
  function loadreadystatechange(xhr, use) {
    // listen to changes in the request
    xhr.onreadystatechange = function () {
      // if the request is ready
      if (4 === xhr.readyState) {
        // get the cached html document
        var cachedDocument = xhr._cachedDocument;
        // ensure the cached html document based on the xhr response
        cachedDocument || (cachedDocument = xhr._cachedDocument = document.implementation.createHTMLDocument(""), cachedDocument.body.innerHTML = xhr.responseText,
        // ensure domains are the same, otherwise we'll have issues appending the
        // element in IE 11
        cachedDocument.domain !== document.domain && (cachedDocument.domain = document.domain), xhr._cachedTarget = {}),
        // clear the xhr embeds list and embed each item
        xhr._embeds.splice(0).map(function (item) {
          // get the cached target
          var target = xhr._cachedTarget[item.id];
          // ensure the cached target
          target || (target = xhr._cachedTarget[item.id] = cachedDocument.getElementById(item.id)),
          // embed the target into the svg
          embed(item.parent, item.svg, target, use);
        });
      }
    },
    // test the ready state change immediately
    xhr.onreadystatechange();
  }
  function svg4everybody(rawopts) {
    function oninterval() {
      // if all <use>s in the array are being bypassed, don't proceed.
      if (numberOfSvgUseElementsToBypass && uses.length - numberOfSvgUseElementsToBypass <= 0) {
        return void requestAnimationFrame(oninterval, 67);
      }
      // if there are <use>s to process, proceed.
      // reset the bypass counter, since the counter will be incremented for every bypassed element,
      // even ones that were counted before.
      numberOfSvgUseElementsToBypass = 0;
      // while the index exists in the live <use> collection
      for (
      // get the cached <use> index
      var index = 0; index < uses.length;) {
        // get the current <use>
        var use = uses[index],
          parent = use.parentNode,
          svg = getSVGAncestor(parent),
          src = use.getAttribute("xlink:href") || use.getAttribute("href");
        if (!src && opts.attributeName && (src = use.getAttribute(opts.attributeName)), svg && src) {
          if (polyfill) {
            if (!opts.validate || opts.validate(src, svg, use)) {
              // remove the <use> element
              parent.removeChild(use);
              // parse the src and get the url and id
              var srcSplit = src.split("#"),
                url = srcSplit.shift(),
                id = srcSplit.join("#");
              // if the link is external
              if (url.length) {
                // get the cached xhr request
                var xhr = requests[url];
                // ensure the xhr request exists
                xhr || (xhr = requests[url] = new XMLHttpRequest(), xhr.open("GET", url), xhr.send(), xhr._embeds = []),
                // add the svg and id as an item to the xhr embeds list
                xhr._embeds.push({
                  parent: parent,
                  svg: svg,
                  id: id
                }),
                // prepare the xhr ready state change event
                loadreadystatechange(xhr, use);
              } else {
                // embed the local id into the svg
                embed(parent, svg, document.getElementById(id), use);
              }
            } else {
              // increase the index when the previous value was not "valid"
              ++index, ++numberOfSvgUseElementsToBypass;
            }
          }
        } else {
          // increase the index when the previous value was not "valid"
          ++index;
        }
      }
      // continue the interval
      requestAnimationFrame(oninterval, 67);
    }
    var polyfill,
      opts = Object(rawopts),
      newerIEUA = /\bTrident\/[567]\b|\bMSIE (?:9|10)\.0\b/,
      webkitUA = /\bAppleWebKit\/(\d+)\b/,
      olderEdgeUA = /\bEdge\/12\.(\d+)\b/,
      edgeUA = /\bEdge\/.(\d+)\b/,
      inIframe = window.top !== window.self;
    polyfill = "polyfill" in opts ? opts.polyfill : newerIEUA.test(navigator.userAgent) || (navigator.userAgent.match(olderEdgeUA) || [])[1] < 10547 || (navigator.userAgent.match(webkitUA) || [])[1] < 537 || edgeUA.test(navigator.userAgent) && inIframe;
    // create xhr requests object
    var requests = {},
      requestAnimationFrame = window.requestAnimationFrame || setTimeout,
      uses = document.getElementsByTagName("use"),
      numberOfSvgUseElementsToBypass = 0;
    // conditionally start the interval if the polyfill is active
    polyfill && oninterval();
  }
  function getSVGAncestor(node) {
    for (var svg = node; "svg" !== svg.nodeName.toLowerCase() && (svg = svg.parentNode);) {}
    return svg;
  }
  return svg4everybody;
});

},{}],30:[function(require,module,exports){
"use strict";

module.exports = function () {
  let htmlDocument = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document;
  return htmlDocument.activeElement;
};

},{}],31:[function(require,module,exports){
"use strict";

const assign = require("object-assign");
const Behavior = require("receptor/behavior");

/**
 * @name sequence
 * @param {...Function} seq an array of functions
 * @return { closure } callHooks
 */
// We use a named function here because we want it to inherit its lexical scope
// from the behavior props object, not from the module
const sequence = function () {
  for (var _len = arguments.length, seq = new Array(_len), _key = 0; _key < _len; _key++) {
    seq[_key] = arguments[_key];
  }
  return function callHooks() {
    let target = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document.body;
    seq.forEach(method => {
      if (typeof this[method] === "function") {
        this[method].call(this, target);
      }
    });
  };
};

/**
 * @name behavior
 * @param {object} events
 * @param {object?} props
 * @return {receptor.behavior}
 */
module.exports = (events, props) => Behavior(events, assign({
  on: sequence("init", "add"),
  off: sequence("teardown", "remove")
}, props));

},{"object-assign":47,"receptor/behavior":48}],32:[function(require,module,exports){
"use strict";

/**
 * Call a function every X amount of milliseconds.
 *
 * @param  {Function} callback - A callback function to be debounced
 * @param  {number} delay - Milliseconds to wait before calling function
 * @returns {Function} A debounced function
 * @example const updateStatus = debounce((string) => console.log(string), 2000)
 */

module.exports = function debounce(callback) {
  var _this = this;
  let delay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 500;
  let timer = null;
  return function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      callback.apply(_this, args);
    }, delay);
  };
};

},{}],33:[function(require,module,exports){
"use strict";

const assign = require("object-assign");
const {
  keymap
} = require("receptor");
const behavior = require("./behavior");
const select = require("./select");
const activeElement = require("./active-element");
const FOCUSABLE = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
const tabHandler = context => {
  const focusableElements = select(FOCUSABLE, context);
  const firstTabStop = focusableElements[0];
  const lastTabStop = focusableElements[focusableElements.length - 1];

  // Special rules for when the user is tabbing forward from the last focusable element,
  // or when tabbing backwards from the first focusable element
  function tabAhead(event) {
    if (activeElement() === lastTabStop) {
      event.preventDefault();
      firstTabStop.focus();
    }
  }
  function tabBack(event) {
    if (activeElement() === firstTabStop) {
      event.preventDefault();
      lastTabStop.focus();
    }
    // This checks if you want to set the initial focus to a container
    // instead of an element within, and the user tabs back.
    // Then we set the focus to the first
    else if (!focusableElements.includes(activeElement())) {
      event.preventDefault();
      firstTabStop.focus();
    }
  }
  return {
    firstTabStop,
    lastTabStop,
    tabAhead,
    tabBack
  };
};
module.exports = function (context) {
  let additionalKeyBindings = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const tabEventHandler = tabHandler(context);
  const bindings = additionalKeyBindings;
  const {
    Esc,
    Escape
  } = bindings;
  if (Escape && !Esc) bindings.Esc = Escape;

  //  TODO: In the future, loop over additional keybindings and pass an array
  // of functions, if necessary, to the map keys. Then people implementing
  // the focus trap could pass callbacks to fire when tabbing
  const keyMappings = keymap(assign({
    Tab: tabEventHandler.tabAhead,
    "Shift+Tab": tabEventHandler.tabBack
  }, additionalKeyBindings));
  const focusTrap = behavior({
    keydown: keyMappings
  }, {
    init() {
      // TODO: is this desireable behavior? Should the trap always do this by default or should
      // the component getting decorated handle this?
      if (tabEventHandler.firstTabStop) {
        tabEventHandler.firstTabStop.focus();
      }
    },
    update(isActive) {
      if (isActive) {
        this.on();
      } else {
        this.off();
      }
    }
  });
  return focusTrap;
};

},{"./active-element":30,"./behavior":31,"./select":39,"object-assign":47,"receptor":53}],34:[function(require,module,exports){
"use strict";

// https://stackoverflow.com/a/7557433
function isElementInViewport(el) {
  let win = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window;
  let docEl = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : document.documentElement;
  const rect = el.getBoundingClientRect();
  return rect.top >= 0 && rect.left >= 0 && rect.bottom <= (win.innerHeight || docEl.clientHeight) && rect.right <= (win.innerWidth || docEl.clientWidth);
}
module.exports = isElementInViewport;

},{}],35:[function(require,module,exports){
"use strict";

// iOS detection from: http://stackoverflow.com/a/9039885/177710
function isIosDevice() {
  return typeof navigator !== "undefined" && (navigator.userAgent.match(/(iPod|iPhone|iPad)/g) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) && !window.MSStream;
}
module.exports = isIosDevice;

},{}],36:[function(require,module,exports){
"use strict";

/* eslint-disable */
/* globals define, module */

/**
 * A simple library to help you escape HTML using template strings.
 *
 * It's the counterpart to our eslint "no-unsafe-innerhtml" plugin that helps us
 * avoid unsafe coding practices.
 * A full write-up of the Hows and Whys are documented
 * for developers at
 *  https://developer.mozilla.org/en-US/Firefox_OS/Security/Security_Automation
 * with additional background information and design docs at
 *  https://wiki.mozilla.org/User:Fbraun/Gaia/SafeinnerHTMLRoadmap
 *
 */

!function (factory) {
  module.exports = factory();
}(function () {
  'use strict';

  var Sanitizer = {
    _entity: /[&<>"'/]/g,
    _entities: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      '\'': '&apos;',
      '/': '&#x2F;'
    },
    getEntity: function (s) {
      return Sanitizer._entities[s];
    },
    /**
     * Escapes HTML for all values in a tagged template string.
     */
    escapeHTML: function (strings) {
      var result = '';
      for (var i = 0; i < strings.length; i++) {
        result += strings[i];
        if (i + 1 < arguments.length) {
          var value = arguments[i + 1] || '';
          result += String(value).replace(Sanitizer._entity, Sanitizer.getEntity);
        }
      }
      return result;
    },
    /**
     * Escapes HTML and returns a wrapped object to be used during DOM insertion
     */
    createSafeHTML: function (strings) {
      var _len = arguments.length;
      var values = new Array(_len > 1 ? _len - 1 : 0);
      for (var _key = 1; _key < _len; _key++) {
        values[_key - 1] = arguments[_key];
      }
      var escaped = Sanitizer.escapeHTML.apply(Sanitizer, [strings].concat(values));
      return {
        __html: escaped,
        toString: function () {
          return '[object WrappedHTMLObject]';
        },
        info: 'This is a wrapped HTML object. See https://developer.mozilla.or' + 'g/en-US/Firefox_OS/Security/Security_Automation for more.'
      };
    },
    /**
     * Unwrap safe HTML created by createSafeHTML or a custom replacement that
     * underwent security review.
     */
    unwrapSafeHTML: function () {
      var _len = arguments.length;
      var htmlObjects = new Array(_len);
      for (var _key = 0; _key < _len; _key++) {
        htmlObjects[_key] = arguments[_key];
      }
      var markupList = htmlObjects.map(function (obj) {
        return obj.__html;
      });
      return markupList.join('');
    }
  };
  return Sanitizer;
});

},{}],37:[function(require,module,exports){
"use strict";

module.exports = function getScrollbarWidth() {
  // Creating invisible container
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll'; // forcing scrollbar to appear
  outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
  document.body.appendChild(outer);

  // Creating inner element and placing it in the container
  const inner = document.createElement('div');
  outer.appendChild(inner);

  // Calculating difference between container's full width and the child width
  const scrollbarWidth = `${outer.offsetWidth - inner.offsetWidth}px`;

  // Removing temporary elements from the DOM
  outer.parentNode.removeChild(outer);
  return scrollbarWidth;
};

},{}],38:[function(require,module,exports){
"use strict";

const select = require("./select");
/**
 * @name isElement
 * @desc returns whether or not the given argument is a DOM element.
 * @param {any} value
 * @return {boolean}
 */
const isElement = value => value && typeof value === "object" && value.nodeType === 1;

/**
 * @name selectOrMatches
 * @desc selects elements from the DOM by class selector or ID selector.
 * @param {string} selector - The selector to traverse the DOM with.
 * @param {Document|HTMLElement?} context - The context to traverse the DOM
 *   in. If not provided, it defaults to the document.
 * @return {HTMLElement[]} - An array of DOM nodes or an empty array.
 */
module.exports = (selector, context) => {
  const selection = select(selector, context);
  if (typeof selector !== "string") {
    return selection;
  }
  if (isElement(context) && context.matches(selector)) {
    selection.push(context);
  }
  return selection;
};

},{"./select":39}],39:[function(require,module,exports){
"use strict";

/**
 * @name isElement
 * @desc returns whether or not the given argument is a DOM element.
 * @param {any} value
 * @return {boolean}
 */
const isElement = value => value && typeof value === "object" && value.nodeType === 1;

/**
 * @name select
 * @desc selects elements from the DOM by class selector or ID selector.
 * @param {string} selector - The selector to traverse the DOM with.
 * @param {Document|HTMLElement?} context - The context to traverse the DOM
 *   in. If not provided, it defaults to the document.
 * @return {HTMLElement[]} - An array of DOM nodes or an empty array.
 */
module.exports = (selector, context) => {
  if (typeof selector !== "string") {
    return [];
  }
  if (!context || !isElement(context)) {
    context = window.document; // eslint-disable-line no-param-reassign
  }

  const selection = context.querySelectorAll(selector);
  return Array.prototype.slice.call(selection);
};

},{}],40:[function(require,module,exports){
"use strict";

/**
 * Flips given INPUT elements between masked (hiding the field value) and unmasked
 * @param {Array.HTMLElement} fields - An array of INPUT elements
 * @param {Boolean} mask - Whether the mask should be applied, hiding the field value
 */
module.exports = (field, mask) => {
  field.setAttribute("autocapitalize", "off");
  field.setAttribute("autocorrect", "off");
  field.setAttribute("type", mask ? "password" : "text");
};

},{}],41:[function(require,module,exports){
"use strict";

const resolveIdRefs = require("resolve-id-refs");
const toggleFieldMask = require("./toggle-field-mask");
const CONTROLS = "aria-controls";
const PRESSED = "aria-pressed";
const SHOW_ATTR = "data-show-text";
const HIDE_ATTR = "data-hide-text";

/**
 * Replace the word "Show" (or "show") with "Hide" (or "hide") in a string.
 * @param {string} showText
 * @return {strong} hideText
 */
const getHideText = showText => showText.replace(/\bShow\b/i, show => `${show[0] === "S" ? "H" : "h"}ide`);

/**
 * Component that decorates an HTML element with the ability to toggle the
 * masked state of an input field (like a password) when clicked.
 * The ids of the fields to be masked will be pulled directly from the button's
 * `aria-controls` attribute.
 *
 * @param  {HTMLElement} el    Parent element containing the fields to be masked
 * @return {boolean}
 */
module.exports = el => {
  // this is the *target* state:
  // * if the element has the attr and it's !== "true", pressed is true
  // * otherwise, pressed is false
  const pressed = el.hasAttribute(PRESSED) && el.getAttribute(PRESSED) !== "true";
  const fields = resolveIdRefs(el.getAttribute(CONTROLS));
  fields.forEach(field => toggleFieldMask(field, pressed));
  if (!el.hasAttribute(SHOW_ATTR)) {
    el.setAttribute(SHOW_ATTR, el.textContent);
  }
  const showText = el.getAttribute(SHOW_ATTR);
  const hideText = el.getAttribute(HIDE_ATTR) || getHideText(showText);
  el.textContent = pressed ? showText : hideText; // eslint-disable-line no-param-reassign
  el.setAttribute(PRESSED, pressed);
  return pressed;
};

},{"./toggle-field-mask":40,"resolve-id-refs":56}],42:[function(require,module,exports){
"use strict";

const EXPANDED = "aria-expanded";
const CONTROLS = "aria-controls";
const HIDDEN = "hidden";
module.exports = (button, expanded) => {
  let safeExpanded = expanded;
  if (typeof safeExpanded !== "boolean") {
    safeExpanded = button.getAttribute(EXPANDED) === "false";
  }
  button.setAttribute(EXPANDED, safeExpanded);
  const id = button.getAttribute(CONTROLS);
  const controls = document.getElementById(id);
  if (!controls) {
    throw new Error(`No toggle target found with id: "${id}"`);
  }
  if (safeExpanded) {
    controls.removeAttribute(HIDDEN);
  } else {
    controls.setAttribute(HIDDEN, "");
  }
  return safeExpanded;
};

},{}],43:[function(require,module,exports){
"use strict";

const debounce = require("./debounce");
const {
  prefix: PREFIX
} = require("../config");
const CHECKED_CLASS = `${PREFIX}-checklist__item--checked`;
module.exports = function validate(el) {
  const id = el.dataset.validationElement;
  const checkList = id.charAt(0) === "#" ? document.querySelector(id) : document.getElementById(id);
  if (!checkList) {
    throw new Error(`No validation element found with id: "${id}"`);
  }
  let statusSummary = "";
  Object.entries(el.dataset).forEach(_ref => {
    let [key, value] = _ref;
    if (key.startsWith("validate")) {
      const validatorName = key.substr("validate".length).toLowerCase();
      const validatorPattern = new RegExp(value);
      const validatorSelector = `[data-validator="${validatorName}"]`;
      const validatorCheckbox = checkList.querySelector(validatorSelector);
      const validatorParent = el.parentNode;
      const statusSummaryContainer = validatorParent.querySelector(`[data-validation-status]`);
      const checked = validatorPattern.test(el.value);
      validatorCheckbox.classList.toggle(CHECKED_CLASS, checked);
      if (!validatorCheckbox) {
        throw new Error(`No validator checkbox found for: "${validatorName}"`);
      }

      // Create status reports for checklist items
      const statusComplete = el.dataset.validationComplete || "status complete";
      const statusIncomplete = el.dataset.validationIncomplete || "status incomplete";
      let checkboxContent = `${validatorCheckbox.textContent} `;
      if (validatorCheckbox.classList.contains(CHECKED_CLASS)) {
        checkboxContent += statusComplete;
      } else {
        checkboxContent += statusIncomplete;
      }

      // move status updates to aria-label on checklist item
      validatorCheckbox.setAttribute("aria-label", checkboxContent);

      // Create a summary of status for all checklist items
      statusSummary += `${checkboxContent}. `;

      // Add summary to screen reader summary container, after a delay
      const srUpdateStatus = debounce(() => {
        statusSummaryContainer.textContent = statusSummary;
      }, 1000);
      srUpdateStatus();
    }
  });
};

},{"../config":22,"./debounce":32}],44:[function(require,module,exports){
"use strict";

/*
 * classList.js: Cross-browser full element.classList implementation.
 * 2014-07-23
 *
 * By Eli Grey, http://eligrey.com
 * Public Domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */

/*global self, document, DOMException */

/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js*/

/* Copied from MDN:
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
 */

if ("document" in window.self) {
  // Full polyfill for browsers with no classList support
  // Including IE < Edge missing SVGElement.classList
  if (!("classList" in document.createElement("_")) || document.createElementNS && !("classList" in document.createElementNS("http://www.w3.org/2000/svg", "g"))) {
    (function (view) {
      "use strict";

      if (!('Element' in view)) return;
      var classListProp = "classList",
        protoProp = "prototype",
        elemCtrProto = view.Element[protoProp],
        objCtr = Object,
        strTrim = String[protoProp].trim || function () {
          return this.replace(/^\s+|\s+$/g, "");
        },
        arrIndexOf = Array[protoProp].indexOf || function (item) {
          var i = 0,
            len = this.length;
          for (; i < len; i++) {
            if (i in this && this[i] === item) {
              return i;
            }
          }
          return -1;
        }
        // Vendors: please allow content code to instantiate DOMExceptions
        ,
        DOMEx = function (type, message) {
          this.name = type;
          this.code = DOMException[type];
          this.message = message;
        },
        checkTokenAndGetIndex = function (classList, token) {
          if (token === "") {
            throw new DOMEx("SYNTAX_ERR", "An invalid or illegal string was specified");
          }
          if (/\s/.test(token)) {
            throw new DOMEx("INVALID_CHARACTER_ERR", "String contains an invalid character");
          }
          return arrIndexOf.call(classList, token);
        },
        ClassList = function (elem) {
          var trimmedClasses = strTrim.call(elem.getAttribute("class") || ""),
            classes = trimmedClasses ? trimmedClasses.split(/\s+/) : [],
            i = 0,
            len = classes.length;
          for (; i < len; i++) {
            this.push(classes[i]);
          }
          this._updateClassName = function () {
            elem.setAttribute("class", this.toString());
          };
        },
        classListProto = ClassList[protoProp] = [],
        classListGetter = function () {
          return new ClassList(this);
        };
      // Most DOMException implementations don't allow calling DOMException's toString()
      // on non-DOMExceptions. Error's toString() is sufficient here.
      DOMEx[protoProp] = Error[protoProp];
      classListProto.item = function (i) {
        return this[i] || null;
      };
      classListProto.contains = function (token) {
        token += "";
        return checkTokenAndGetIndex(this, token) !== -1;
      };
      classListProto.add = function () {
        var tokens = arguments,
          i = 0,
          l = tokens.length,
          token,
          updated = false;
        do {
          token = tokens[i] + "";
          if (checkTokenAndGetIndex(this, token) === -1) {
            this.push(token);
            updated = true;
          }
        } while (++i < l);
        if (updated) {
          this._updateClassName();
        }
      };
      classListProto.remove = function () {
        var tokens = arguments,
          i = 0,
          l = tokens.length,
          token,
          updated = false,
          index;
        do {
          token = tokens[i] + "";
          index = checkTokenAndGetIndex(this, token);
          while (index !== -1) {
            this.splice(index, 1);
            updated = true;
            index = checkTokenAndGetIndex(this, token);
          }
        } while (++i < l);
        if (updated) {
          this._updateClassName();
        }
      };
      classListProto.toggle = function (token, force) {
        token += "";
        var result = this.contains(token),
          method = result ? force !== true && "remove" : force !== false && "add";
        if (method) {
          this[method](token);
        }
        if (force === true || force === false) {
          return force;
        } else {
          return !result;
        }
      };
      classListProto.toString = function () {
        return this.join(" ");
      };
      if (objCtr.defineProperty) {
        var classListPropDesc = {
          get: classListGetter,
          enumerable: true,
          configurable: true
        };
        try {
          objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
        } catch (ex) {
          // IE 8 doesn't support enumerable:true
          if (ex.number === -0x7FF5EC54) {
            classListPropDesc.enumerable = false;
            objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
          }
        }
      } else if (objCtr[protoProp].__defineGetter__) {
        elemCtrProto.__defineGetter__(classListProp, classListGetter);
      }
    })(window.self);
  } else {
    // There is full or partial native classList support, so just check if we need
    // to normalize the add/remove and toggle APIs.

    (function () {
      "use strict";

      var testElement = document.createElement("_");
      testElement.classList.add("c1", "c2");

      // Polyfill for IE 10/11 and Firefox <26, where classList.add and
      // classList.remove exist but support only one argument at a time.
      if (!testElement.classList.contains("c2")) {
        var createMethod = function (method) {
          var original = DOMTokenList.prototype[method];
          DOMTokenList.prototype[method] = function (token) {
            var i,
              len = arguments.length;
            for (i = 0; i < len; i++) {
              token = arguments[i];
              original.call(this, token);
            }
          };
        };
        createMethod('add');
        createMethod('remove');
      }
      testElement.classList.toggle("c3", false);

      // Polyfill for IE 10 and Firefox <24, where classList.toggle does not
      // support the second argument.
      if (testElement.classList.contains("c3")) {
        var _toggle = DOMTokenList.prototype.toggle;
        DOMTokenList.prototype.toggle = function (token, force) {
          if (1 in arguments && !this.contains(token) === !force) {
            return force;
          } else {
            return _toggle.call(this, token);
          }
        };
      }
      testElement = null;
    })();
  }
}

},{}],45:[function(require,module,exports){
"use strict";

// element-closest | CC0-1.0 | github.com/jonathantneal/closest

(function (ElementProto) {
  if (typeof ElementProto.matches !== 'function') {
    ElementProto.matches = ElementProto.msMatchesSelector || ElementProto.mozMatchesSelector || ElementProto.webkitMatchesSelector || function matches(selector) {
      var element = this;
      var elements = (element.document || element.ownerDocument).querySelectorAll(selector);
      var index = 0;
      while (elements[index] && elements[index] !== element) {
        ++index;
      }
      return Boolean(elements[index]);
    };
  }
  if (typeof ElementProto.closest !== 'function') {
    ElementProto.closest = function closest(selector) {
      var element = this;
      while (element && element.nodeType === 1) {
        if (element.matches(selector)) {
          return element;
        }
        element = element.parentNode;
      }
      return null;
    };
  }
})(window.Element.prototype);

},{}],46:[function(require,module,exports){
"use strict";

/* global define, KeyboardEvent, module */

(function () {
  var keyboardeventKeyPolyfill = {
    polyfill: polyfill,
    keys: {
      3: 'Cancel',
      6: 'Help',
      8: 'Backspace',
      9: 'Tab',
      12: 'Clear',
      13: 'Enter',
      16: 'Shift',
      17: 'Control',
      18: 'Alt',
      19: 'Pause',
      20: 'CapsLock',
      27: 'Escape',
      28: 'Convert',
      29: 'NonConvert',
      30: 'Accept',
      31: 'ModeChange',
      32: ' ',
      33: 'PageUp',
      34: 'PageDown',
      35: 'End',
      36: 'Home',
      37: 'ArrowLeft',
      38: 'ArrowUp',
      39: 'ArrowRight',
      40: 'ArrowDown',
      41: 'Select',
      42: 'Print',
      43: 'Execute',
      44: 'PrintScreen',
      45: 'Insert',
      46: 'Delete',
      48: ['0', ')'],
      49: ['1', '!'],
      50: ['2', '@'],
      51: ['3', '#'],
      52: ['4', '$'],
      53: ['5', '%'],
      54: ['6', '^'],
      55: ['7', '&'],
      56: ['8', '*'],
      57: ['9', '('],
      91: 'OS',
      93: 'ContextMenu',
      144: 'NumLock',
      145: 'ScrollLock',
      181: 'VolumeMute',
      182: 'VolumeDown',
      183: 'VolumeUp',
      186: [';', ':'],
      187: ['=', '+'],
      188: [',', '<'],
      189: ['-', '_'],
      190: ['.', '>'],
      191: ['/', '?'],
      192: ['`', '~'],
      219: ['[', '{'],
      220: ['\\', '|'],
      221: [']', '}'],
      222: ["'", '"'],
      224: 'Meta',
      225: 'AltGraph',
      246: 'Attn',
      247: 'CrSel',
      248: 'ExSel',
      249: 'EraseEof',
      250: 'Play',
      251: 'ZoomOut'
    }
  };

  // Function keys (F1-24).
  var i;
  for (i = 1; i < 25; i++) {
    keyboardeventKeyPolyfill.keys[111 + i] = 'F' + i;
  }

  // Printable ASCII characters.
  var letter = '';
  for (i = 65; i < 91; i++) {
    letter = String.fromCharCode(i);
    keyboardeventKeyPolyfill.keys[i] = [letter.toLowerCase(), letter.toUpperCase()];
  }
  function polyfill() {
    if (!('KeyboardEvent' in window) || 'key' in KeyboardEvent.prototype) {
      return false;
    }

    // Polyfill `key` on `KeyboardEvent`.
    var proto = {
      get: function (x) {
        var key = keyboardeventKeyPolyfill.keys[this.which || this.keyCode];
        if (Array.isArray(key)) {
          key = key[+this.shiftKey];
        }
        return key;
      }
    };
    Object.defineProperty(KeyboardEvent.prototype, 'key', proto);
    return proto;
  }
  if (typeof define === 'function' && define.amd) {
    define('keyboardevent-key-polyfill', keyboardeventKeyPolyfill);
  } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
    module.exports = keyboardeventKeyPolyfill;
  } else if (window) {
    window.keyboardeventKeyPolyfill = keyboardeventKeyPolyfill;
  }
})();

},{}],47:[function(require,module,exports){
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/

'use strict';

/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;
function toObject(val) {
  if (val === null || val === undefined) {
    throw new TypeError('Object.assign cannot be called with null or undefined');
  }
  return Object(val);
}
function shouldUseNative() {
  try {
    if (!Object.assign) {
      return false;
    }

    // Detect buggy property enumeration order in older V8 versions.

    // https://bugs.chromium.org/p/v8/issues/detail?id=4118
    var test1 = new String('abc'); // eslint-disable-line no-new-wrappers
    test1[5] = 'de';
    if (Object.getOwnPropertyNames(test1)[0] === '5') {
      return false;
    }

    // https://bugs.chromium.org/p/v8/issues/detail?id=3056
    var test2 = {};
    for (var i = 0; i < 10; i++) {
      test2['_' + String.fromCharCode(i)] = i;
    }
    var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
      return test2[n];
    });
    if (order2.join('') !== '0123456789') {
      return false;
    }

    // https://bugs.chromium.org/p/v8/issues/detail?id=3056
    var test3 = {};
    'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
      test3[letter] = letter;
    });
    if (Object.keys(Object.assign({}, test3)).join('') !== 'abcdefghijklmnopqrst') {
      return false;
    }
    return true;
  } catch (err) {
    // We don't expect any of the above to throw, but better to be safe.
    return false;
  }
}
module.exports = shouldUseNative() ? Object.assign : function (target, source) {
  var from;
  var to = toObject(target);
  var symbols;
  for (var s = 1; s < arguments.length; s++) {
    from = Object(arguments[s]);
    for (var key in from) {
      if (hasOwnProperty.call(from, key)) {
        to[key] = from[key];
      }
    }
    if (getOwnPropertySymbols) {
      symbols = getOwnPropertySymbols(from);
      for (var i = 0; i < symbols.length; i++) {
        if (propIsEnumerable.call(from, symbols[i])) {
          to[symbols[i]] = from[symbols[i]];
        }
      }
    }
  }
  return to;
};

},{}],48:[function(require,module,exports){
"use strict";

const assign = require('object-assign');
const delegate = require('../delegate');
const delegateAll = require('../delegateAll');
const DELEGATE_PATTERN = /^(.+):delegate\((.+)\)$/;
const SPACE = ' ';
const getListeners = function (type, handler) {
  var match = type.match(DELEGATE_PATTERN);
  var selector;
  if (match) {
    type = match[1];
    selector = match[2];
  }
  var options;
  if (typeof handler === 'object') {
    options = {
      capture: popKey(handler, 'capture'),
      passive: popKey(handler, 'passive')
    };
  }
  var listener = {
    selector: selector,
    delegate: typeof handler === 'object' ? delegateAll(handler) : selector ? delegate(selector, handler) : handler,
    options: options
  };
  if (type.indexOf(SPACE) > -1) {
    return type.split(SPACE).map(function (_type) {
      return assign({
        type: _type
      }, listener);
    });
  } else {
    listener.type = type;
    return [listener];
  }
};
var popKey = function (obj, key) {
  var value = obj[key];
  delete obj[key];
  return value;
};
module.exports = function behavior(events, props) {
  const listeners = Object.keys(events).reduce(function (memo, type) {
    var listeners = getListeners(type, events[type]);
    return memo.concat(listeners);
  }, []);
  return assign({
    add: function addBehavior(element) {
      listeners.forEach(function (listener) {
        element.addEventListener(listener.type, listener.delegate, listener.options);
      });
    },
    remove: function removeBehavior(element) {
      listeners.forEach(function (listener) {
        element.removeEventListener(listener.type, listener.delegate, listener.options);
      });
    }
  }, props);
};

},{"../delegate":50,"../delegateAll":51,"object-assign":47}],49:[function(require,module,exports){
"use strict";

module.exports = function compose(functions) {
  return function (e) {
    return functions.some(function (fn) {
      return fn.call(this, e) === false;
    }, this);
  };
};

},{}],50:[function(require,module,exports){
"use strict";

// polyfill Element.prototype.closest
require('element-closest');
module.exports = function delegate(selector, fn) {
  return function delegation(event) {
    var target = event.target.closest(selector);
    if (target) {
      return fn.call(target, event);
    }
  };
};

},{"element-closest":45}],51:[function(require,module,exports){
"use strict";

const delegate = require('../delegate');
const compose = require('../compose');
const SPLAT = '*';
module.exports = function delegateAll(selectors) {
  const keys = Object.keys(selectors);

  // XXX optimization: if there is only one handler and it applies to
  // all elements (the "*" CSS selector), then just return that
  // handler
  if (keys.length === 1 && keys[0] === SPLAT) {
    return selectors[SPLAT];
  }
  const delegates = keys.reduce(function (memo, selector) {
    memo.push(delegate(selector, selectors[selector]));
    return memo;
  }, []);
  return compose(delegates);
};

},{"../compose":49,"../delegate":50}],52:[function(require,module,exports){
"use strict";

module.exports = function ignore(element, fn) {
  return function ignorance(e) {
    if (element !== e.target && !element.contains(e.target)) {
      return fn.call(this, e);
    }
  };
};

},{}],53:[function(require,module,exports){
"use strict";

module.exports = {
  behavior: require('./behavior'),
  delegate: require('./delegate'),
  delegateAll: require('./delegateAll'),
  ignore: require('./ignore'),
  keymap: require('./keymap')
};

},{"./behavior":48,"./delegate":50,"./delegateAll":51,"./ignore":52,"./keymap":54}],54:[function(require,module,exports){
"use strict";

require('keyboardevent-key-polyfill');

// these are the only relevant modifiers supported on all platforms,
// according to MDN:
// <https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/getModifierState>
const MODIFIERS = {
  'Alt': 'altKey',
  'Control': 'ctrlKey',
  'Ctrl': 'ctrlKey',
  'Shift': 'shiftKey'
};
const MODIFIER_SEPARATOR = '+';
const getEventKey = function (event, hasModifiers) {
  var key = event.key;
  if (hasModifiers) {
    for (var modifier in MODIFIERS) {
      if (event[MODIFIERS[modifier]] === true) {
        key = [modifier, key].join(MODIFIER_SEPARATOR);
      }
    }
  }
  return key;
};
module.exports = function keymap(keys) {
  const hasModifiers = Object.keys(keys).some(function (key) {
    return key.indexOf(MODIFIER_SEPARATOR) > -1;
  });
  return function (event) {
    var key = getEventKey(event, hasModifiers);
    return [key, key.toLowerCase()].reduce(function (result, _key) {
      if (_key in keys) {
        result = keys[key].call(this, event);
      }
      return result;
    }, undefined);
  };
};
module.exports.MODIFIERS = MODIFIERS;

},{"keyboardevent-key-polyfill":46}],55:[function(require,module,exports){
"use strict";

module.exports = function once(listener, options) {
  var wrapped = function wrappedOnce(e) {
    e.currentTarget.removeEventListener(e.type, wrapped, options);
    return listener.call(this, e);
  };
  return wrapped;
};

},{}],56:[function(require,module,exports){
'use strict';

var RE_TRIM = /(^\s+)|(\s+$)/g;
var RE_SPLIT = /\s+/;
var trim = String.prototype.trim ? function (str) {
  return str.trim();
} : function (str) {
  return str.replace(RE_TRIM, '');
};
var queryById = function (id) {
  return this.querySelector('[id="' + id.replace(/"/g, '\\"') + '"]');
};
module.exports = function resolveIds(ids, doc) {
  if (typeof ids !== 'string') {
    throw new Error('Expected a string but got ' + typeof ids);
  }
  if (!doc) {
    doc = window.document;
  }
  var getElementById = doc.getElementById ? doc.getElementById.bind(doc) : queryById.bind(doc);
  ids = trim(ids).split(RE_SPLIT);

  // XXX we can short-circuit here because trimming and splitting a
  // string of just whitespace produces an array containing a single,
  // empty string
  if (ids.length === 1 && ids[0] === '') {
    return [];
  }
  return ids.map(function (id) {
    var el = getElementById(id);
    if (!el) {
      throw new Error('no element with id: "' + id + '"');
    }
    return el;
  });
};

},{}],57:[function(require,module,exports){
"use strict";

const keymap = require('receptor/keymap');
const behavior = require('../../node_modules/@uswds/uswds/packages/uswds-core/src/js/utils/behavior');
const select = require('../../node_modules/@uswds/uswds/packages/uswds-core/src/js/utils/select');
const toggle = require('../../node_modules/@uswds/uswds/packages/uswds-core/src/js/utils/toggle');
const FocusTrap = require('../../node_modules/@uswds/uswds/packages/uswds-core/src/js/utils/focus-trap');
const accordion = require('../../node_modules/@uswds/uswds/packages/usa-accordion/src');
const ScrollBarWidth = require('../../node_modules/@uswds/uswds/packages/uswds-core/src/js/utils/scrollbar-width');
const {
  CLICK
} = require('../../node_modules/@uswds/uswds/packages/uswds-core/src/js/events');
const {
  prefix: PREFIX
} = require('../../node_modules/@uswds/uswds/packages/uswds-core/src/js/config');
const BODY = 'body';
const HEADER = `.${PREFIX}-header`;
const NAV = `.${PREFIX}-nav`;
const NAV_CONTAINER = `.${PREFIX}-nav-container`;
const NAV_PRIMARY = `.${PREFIX}-nav__primary`;
const NAV_PRIMARY_ITEM = `.${PREFIX}-nav__primary-item`;
const NAV_CONTROL = `button.${PREFIX}-nav__link`;
const NAV_LINKS = `${NAV} a`;
const NON_NAV_HIDDEN_ATTRIBUTE = `data-nav-hidden`;
const OPENERS = `.${PREFIX}-menu-btn`;
const CLOSE_BUTTON = `.${PREFIX}-nav__close`;
const OVERLAY = `.${PREFIX}-overlay`;
const CLOSERS = `${CLOSE_BUTTON}, .${PREFIX}-overlay`;
const TOGGLES = [NAV, OVERLAY].join(', ');
const NON_NAV_ELEMENTS = `body *:not(${HEADER}, ${NAV_CONTAINER}, ${NAV}, ${NAV} *):not([aria-hidden])`;
const NON_NAV_HIDDEN = `[${NON_NAV_HIDDEN_ATTRIBUTE}]`;
const ACTIVE_CLASS = 'usa-js-mobile-nav--active';
const VISIBLE_CLASS = 'is-visible';
let navigation;
let navActive;
let nonNavElements;
const isDescendant = function (parent, child) {
  let node = child.parentNode;
  while (node) {
    if (node === parent) return true;

    // Traverse up to the parent
    node = node.parentNode;
  }

  // Go up until the root but couldn't find the `parent`
  return false;
};
const isActive = () => document.body.classList.contains(ACTIVE_CLASS);
const SCROLLBAR_WIDTH = ScrollBarWidth();
const INITIAL_PADDING = window.getComputedStyle(document.body).getPropertyValue('padding-right');
const TEMPORARY_PADDING = `${parseInt(INITIAL_PADDING.replace(/px/, ''), 10) + parseInt(SCROLLBAR_WIDTH.replace(/px/, ''), 10)}px`;
const hideNonNavItems = () => {
  const headerParent = document.querySelector(`${HEADER}`).parentNode;
  nonNavElements = document.querySelectorAll(NON_NAV_ELEMENTS);
  nonNavElements.forEach(nonNavElement => {
    if (nonNavElement !== headerParent) {
      nonNavElement.setAttribute('aria-hidden', true);
      nonNavElement.setAttribute(NON_NAV_HIDDEN_ATTRIBUTE, '');
    }
  });
};
const showNonNavItems = () => {
  nonNavElements = document.querySelectorAll(NON_NAV_HIDDEN);
  if (!nonNavElements) {
    return;
  }

  // Remove aria-hidden from non-header elements
  nonNavElements.forEach(nonNavElement => {
    nonNavElement.removeAttribute('aria-hidden');
    nonNavElement.removeAttribute(NON_NAV_HIDDEN_ATTRIBUTE);
  });
};

// Toggle all non-header elements #3527.
const toggleNonNavItems = active => {
  if (active) {
    hideNonNavItems();
  } else {
    showNonNavItems();
  }
};
const toggleNav = active => {
  const {
    body
  } = document;
  const safeActive = typeof active === 'boolean' ? active : !isActive();
  body.classList.toggle(ACTIVE_CLASS, safeActive);
  select(TOGGLES).forEach(el => el.classList.toggle(VISIBLE_CLASS, safeActive));
  navigation.focusTrap.update(safeActive);
  const closeButton = body.querySelector(CLOSE_BUTTON);
  const menuButton = document.querySelector(OPENERS);
  body.style.paddingRight = body.style.paddingRight === TEMPORARY_PADDING ? INITIAL_PADDING : TEMPORARY_PADDING;
  toggleNonNavItems(safeActive);
  if (safeActive && closeButton) {
    // The mobile nav was just activated. Focus on the close button, which is
    // just before all the nav elements in the tab order.
    closeButton.focus();
  } else if (!safeActive && menuButton && getComputedStyle(menuButton).display !== 'none') {
    // The mobile nav was just deactivated. We don't want the focus to
    // disappear into the void, so focus on the menu button if it's
    // visible (this may have been what the user was just focused on,
    // if they triggered the mobile nav by mistake).
    menuButton.focus();
  }
  return safeActive;
};
const resize = () => {
  const closer = document.body.querySelector(CLOSE_BUTTON);
  if (isActive() && closer && closer.getBoundingClientRect().width === 0) {
    // When the mobile nav is active, and the close box isn't visible,
    // we know the user's viewport has been resized to be larger.
    // Let's make the page state consistent by deactivating the mobile nav.
    navigation.toggleNav.call(closer, false);
  }
};
const onMenuClose = () => navigation.toggleNav.call(navigation, false);
const hideActiveNavDropdown = () => {
  if (!navActive) {
    return;
  }
  toggle(navActive, false);
  navActive = null;
};
const focusNavButton = event => {
  const parentNavItem = event.target.closest(NAV_PRIMARY_ITEM);

  // Only shift focus if within dropdown
  if (!event.target.matches(NAV_CONTROL)) {
    const navControl = parentNavItem.querySelector(NAV_CONTROL);
    if (navControl) {
      navControl.focus();
    }
  }
};
const handleEscape = event => {
  hideActiveNavDropdown();
  focusNavButton(event);
};
const handleToggle = {
  [NAV_CONTROL]() {
    // If another nav is open, close it
    if (navActive !== this) {
      hideActiveNavDropdown();
    }
    // store a reference to the last clicked nav link element, so we
    // can hide the dropdown if another element on the page is clicked
    if (!navActive) {
      navActive = this;
      toggle(navActive, true);
    }

    // Do this so the event handler on the body doesn't fire
    return false;
  },
  [BODY]: hideActiveNavDropdown,
  [OPENERS]: toggleNav,
  [CLOSERS]: toggleNav,
  [NAV_LINKS]() {
    // A navigation link has been clicked! We want to collapse any
    // hierarchical navigation UI it's a part of, so that the user
    // can focus on whatever they've just selected.

    // Some navigation links are inside accordions; when they're
    // clicked, we want to collapse those accordions.
    const acc = this.closest(accordion.ACCORDION);
    if (acc) {
      accordion.getButtons(acc).forEach(btn => accordion.hide(btn));
    }

    // If the mobile navigation menu is active, we want to hide it.
    if (isActive()) {
      navigation.toggleNav.call(navigation, false);
    }
  }
};
navigation = behavior({
  [CLICK]: {
    [NAV_CONTROL]() {
      // If another nav is open, close it
      if (navActive !== this) {
        hideActiveNavDropdown();
      }
      // store a reference to the last clicked nav link element, so we
      // can hide the dropdown if another element on the page is clicked
      if (!navActive) {
        navActive = this;
        toggle(navActive, true);
      }

      // Do this so the event handler on the body doesn't fire
      return false;
    },
    [BODY]: hideActiveNavDropdown,
    [OPENERS]: toggleNav,
    [CLOSERS]: toggleNav,
    [NAV_LINKS]() {
      // A navigation link has been clicked! We want to collapse any
      // hierarchical navigation UI it's a part of, so that the user
      // can focus on whatever they've just selected.

      // Some navigation links are inside accordions; when they're
      // clicked, we want to collapse those accordions.
      const acc = this.closest(accordion.ACCORDION);
      if (acc) {
        accordion.getButtons(acc).forEach(btn => accordion.hide(btn));
      }

      // If the mobile navigation menu is active, we want to hide it.
      if (isActive()) {
        navigation.toggleNav.call(navigation, false);
      }
    }
  },
  mouseover: {
    [NAV_PRIMARY_ITEM](e) {
      const button = this.querySelector(NAV_CONTROL);
      e.stopPropagation();
      if (button && !!isDescendant(button, e.target)) {
        let contents;
        if (this.closest('.usa-nav__submenu-item')) {
          contents = button.getAttribute('aria-controls') && document.getElementById(button.getAttribute('aria-controls'));

          // x=e.clientX;

          if (contents) {
            contents.style.top = '6px';
            contents.style.left = '-16px';
            contents.style.marginLeft = '100%';
          }
        }
        toggle(button, true);
        if (contents) {
          console.log(e.clientX, window.outerWidth, contents.offsetWidth);
        }
      }
    }
  },
  mouseout: {
    [NAV_PRIMARY_ITEM](e) {
      e.stopPropagation();
      if (!this.contains(e.relatedTarget)) {
        const button = this.querySelector(NAV_CONTROL);
        if (button) {
          if (this.closest('.usa-nav__submenu-item')) {
            const contents = button.getAttribute('aria-controls') && document.getElementById(button.getAttribute('aria-controls'));
            if (contents) {
              contents.style.position = null;
            }
          }
          toggle(button, false);
        }
      }
    }
  },
  keydown: {
    [NAV_PRIMARY]: keymap({
      Escape: handleEscape
    })
  },
  focusout: {
    [NAV_PRIMARY](event) {
      const nav = event.target.closest(NAV_PRIMARY);
      if (!nav.contains(event.relatedTarget)) {
        hideActiveNavDropdown();
      }
    }
  }
}, {
  init(root) {
    const trapContainer = root.matches(NAV) ? root : root.querySelector(NAV);
    if (trapContainer) {
      navigation.focusTrap = FocusTrap(trapContainer, {
        Escape: onMenuClose
      });
    }
    resize();
    window.addEventListener('resize', resize, false);
  },
  teardown() {
    window.removeEventListener('resize', resize, false);
    navActive = false;
  },
  focusTrap: null,
  toggleNav
});
module.exports = navigation;

},{"../../node_modules/@uswds/uswds/packages/usa-accordion/src":2,"../../node_modules/@uswds/uswds/packages/uswds-core/src/js/config":22,"../../node_modules/@uswds/uswds/packages/uswds-core/src/js/events":23,"../../node_modules/@uswds/uswds/packages/uswds-core/src/js/utils/behavior":31,"../../node_modules/@uswds/uswds/packages/uswds-core/src/js/utils/focus-trap":33,"../../node_modules/@uswds/uswds/packages/uswds-core/src/js/utils/scrollbar-width":37,"../../node_modules/@uswds/uswds/packages/uswds-core/src/js/utils/select":39,"../../node_modules/@uswds/uswds/packages/uswds-core/src/js/utils/toggle":42,"receptor/keymap":54}],58:[function(require,module,exports){
"use strict";

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
  Object.keys(components).forEach(key => {
    const behavior = components[key];
    behavior.on(target);
  });
  svg4everybody();
};
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initComponents, {
    once: true
  });
} else {
  initComponents();
}
exports.default = uswds;
exports.initComponents = initComponents;

},{"../../node_modules/@uswds/uswds/packages/uswds-core/src/js":24,"../../node_modules/@uswds/uswds/packages/uswds-core/src/js/config":22,"../../node_modules/@uswds/uswds/packages/uswds-core/src/js/polyfills":27,"../../node_modules/@uswds/uswds/packages/uswds-core/src/js/polyfills/svg4everybody":29,"./usa-header":57}]},{},[58])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInBhY2thZ2VzL191c2EtcGFzc3dvcmQvc3JjL2luZGV4LmpzIiwicGFja2FnZXMvdXNhLWFjY29yZGlvbi9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy91c2EtYmFubmVyL3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS1jaGFyYWN0ZXItY291bnQvc3JjL2luZGV4LmpzIiwicGFja2FnZXMvdXNhLWNvbWJvLWJveC9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy91c2EtZGF0ZS1waWNrZXIvc3JjL2luZGV4LmpzIiwicGFja2FnZXMvdXNhLWRhdGUtcmFuZ2UtcGlja2VyL3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS1maWxlLWlucHV0L3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS1mb290ZXIvc3JjL2luZGV4LmpzIiwicGFja2FnZXMvdXNhLWhlYWRlci9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy91c2EtaW4tcGFnZS1uYXZpZ2F0aW9uL3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS1pbnB1dC1tYXNrL3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS1pbnB1dC1wcmVmaXgtc3VmZml4L3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS1sYW5ndWFnZS1zZWxlY3Rvci9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy91c2EtbW9kYWwvc3JjL2luZGV4LmpzIiwicGFja2FnZXMvdXNhLXNlYXJjaC9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy91c2Etc2tpcG5hdi9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy91c2EtdGFibGUvc3JjL2luZGV4LmpzIiwicGFja2FnZXMvdXNhLXRpbWUtcGlja2VyL3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS10b29sdGlwL3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS12YWxpZGF0aW9uL3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL2NvbmZpZy5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL2V2ZW50cy5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL2luZGV4LmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvcG9seWZpbGxzL2N1c3RvbS1ldmVudC5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3BvbHlmaWxscy9lbGVtZW50LWhpZGRlbi5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3BvbHlmaWxscy9pbmRleC5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3BvbHlmaWxscy9udW1iZXItaXMtbmFuLmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvcG9seWZpbGxzL3N2ZzRldmVyeWJvZHkuanMiLCJwYWNrYWdlcy91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9hY3RpdmUtZWxlbWVudC5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yLmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvZGVib3VuY2UuanMiLCJwYWNrYWdlcy91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9mb2N1cy10cmFwLmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvaXMtaW4tdmlld3BvcnQuanMiLCJwYWNrYWdlcy91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9pcy1pb3MtZGV2aWNlLmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2FuaXRpemVyLmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2Nyb2xsYmFyLXdpZHRoLmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2VsZWN0LW9yLW1hdGNoZXMuanMiLCJwYWNrYWdlcy91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3QuanMiLCJwYWNrYWdlcy91c3dkcy1jb3JlL3NyYy9qcy91dGlscy90b2dnbGUtZmllbGQtbWFzay5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3RvZ2dsZS1mb3JtLWlucHV0LmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvdG9nZ2xlLmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvdmFsaWRhdGUtaW5wdXQuanMiLCIuLi8uLi9jbGFzc2xpc3QtcG9seWZpbGwvc3JjL2luZGV4LmpzIiwiLi4vLi4vZWxlbWVudC1jbG9zZXN0L2VsZW1lbnQtY2xvc2VzdC5qcyIsIi4uLy4uL2tleWJvYXJkZXZlbnQta2V5LXBvbHlmaWxsL2luZGV4LmpzIiwiLi4vLi4vb2JqZWN0LWFzc2lnbi9pbmRleC5qcyIsIi4uLy4uL3JlY2VwdG9yL2JlaGF2aW9yL2luZGV4LmpzIiwiLi4vLi4vcmVjZXB0b3IvY29tcG9zZS9pbmRleC5qcyIsIi4uLy4uL3JlY2VwdG9yL2RlbGVnYXRlL2luZGV4LmpzIiwiLi4vLi4vcmVjZXB0b3IvZGVsZWdhdGVBbGwvaW5kZXguanMiLCIuLi8uLi9yZWNlcHRvci9pZ25vcmUvaW5kZXguanMiLCIuLi8uLi9yZWNlcHRvci9pbmRleC5qcyIsIi4uLy4uL3JlY2VwdG9yL2tleW1hcC9pbmRleC5qcyIsIi4uLy4uL3JlY2VwdG9yL29uY2UvaW5kZXguanMiLCIuLi8uLi9yZXNvbHZlLWlkLXJlZnMvaW5kZXguanMiLCIuLi8uLi8uLi90YXNrcy9qcy91c2EtaGVhZGVyLmpzIiwiLi4vLi4vLi4vdGFza3MvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyx3Q0FBd0MsQ0FBQztBQUNsRSxNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsaURBQWlELENBQUM7QUFFbEYsTUFBTTtFQUFFO0FBQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQztBQUMzRCxNQUFNO0VBQUUsTUFBTSxFQUFFO0FBQU8sQ0FB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TztNQUNYLEVBQUUsRUFBRSxTQUFTO01BQ2IsRUFBRSxFQUFFLGFBQWE7TUFDakIsRUFBRSxFQUFFLFFBQVE7TUFDWixFQUFFLEVBQUUsUUFBUTtNQUNaLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7TUFDZCxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO01BQ2QsRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztNQUNkLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7TUFDZCxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO01BQ2QsRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztNQUNkLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7TUFDZCxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO01BQ2QsRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztNQUNkLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7TUFDZCxFQUFFLEVBQUUsSUFBSTtNQUNSLEVBQUUsRUFBRSxhQUFhO01BQ2pCLEdBQUcsRUFBRSxTQUFTO01BQ2QsR0FBRyxFQUFFLFlBQVk7TUFDakIsR0FBRyxFQUFFLFlBQVk7TUFDakIsR0FBRyxFQUFFLFlBQVk7TUFDakIsR0FBRyxFQUFFLFVBQVU7TUFDZixHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO01BQ2YsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztNQUNmLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7TUFDZixHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO01BQ2YsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztNQUNmLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7TUFDZixHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FB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c0UsQ0FBQztBQUUvRSxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsbUVBQW1FLENBQUM7QUFFMUYsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLDREQUE0RCxDQUFDO0FBQ3hGLE1BQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQyxvRkFBb0YsQ0FBQztBQUVuSCxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDO0FBRTFDLFVBQVUsQ0FBQyxVQUFVLEdBQUcsVUFBVTtBQUNsQyxLQUFLLENBQUMsVUFBVSxHQUFHLFVBQVU7QUFFN0IsTUFBTSxjQUFjLEdBQUcsTUFBTTtFQUMzQixNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsSUFBSTtFQUM1QixNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBRSxHQUFHLElBQUs7SUFDdkMsTUFBTSxRQUFRLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQztJQUNoQyxRQUFRLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQztFQUNyQixDQUFDLENBQUM7RUFDRixhQUFhLEVBQUU7QUFDakIsQ0FBQztBQUVELElBQUksUUFBUSxDQUFDLFVBQVUsS0FBSyxTQUFTLEVBQUU7RUFDckMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLGtCQUFrQixFQUFFLGNBQWMsRUFBRTtJQUFFLElBQUksRUFBRTtFQUFLLENBQUMsQ0FBQztBQUMvRSxDQUFDLE1BQU07RUFDTCxjQUFjLEVBQUU7QUFDbEI7QUFFQSxPQUFPLENBQUMsT0FBTyxHQUFHLEtBQUs7QUFDdkIsT0FBTyxDQUFDLGNBQWMsR0FBRyxjQUFjIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiY29uc3QgYmVoYXZpb3IgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvYmVoYXZpb3JcIik7XG5jb25zdCB0b2dnbGVGb3JtSW5wdXQgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvdG9nZ2xlLWZvcm0taW5wdXRcIik7XG5cbmNvbnN0IHsgQ0xJQ0sgfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9ldmVudHNcIik7XG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvY29uZmlnXCIpO1xuXG5jb25zdCBMSU5LID0gYC4ke1BSRUZJWH0tc2hvdy1wYXNzd29yZGA7XG5cbmZ1bmN0aW9uIHRvZ2dsZShldmVudCkge1xuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICB0b2dnbGVGb3JtSW5wdXQodGhpcyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmVoYXZpb3Ioe1xuICBbQ0xJQ0tdOiB7XG4gICAgW0xJTktdOiB0b2dnbGUsXG4gIH0sXG59KTtcbiIsImNvbnN0IHNlbGVjdCA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3RcIik7XG5jb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcbmNvbnN0IHRvZ2dsZSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy90b2dnbGVcIik7XG5jb25zdCBpc0VsZW1lbnRJblZpZXdwb3J0ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2lzLWluLXZpZXdwb3J0XCIpO1xuY29uc3QgeyBDTElDSyB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2V2ZW50c1wiKTtcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XG5cbmNvbnN0IEFDQ09SRElPTiA9IGAuJHtQUkVGSVh9LWFjY29yZGlvbiwgLiR7UFJFRklYfS1hY2NvcmRpb24tLWJvcmRlcmVkYDtcbmNvbnN0IEJVVFRPTiA9IGAuJHtQUkVGSVh9LWFjY29yZGlvbl9fYnV0dG9uW2FyaWEtY29udHJvbHNdYDtcbmNvbnN0IEVYUEFOREVEID0gXCJhcmlhLWV4cGFuZGVkXCI7XG5jb25zdCBNVUxUSVNFTEVDVEFCTEUgPSBcImRhdGEtYWxsb3ctbXVsdGlwbGVcIjtcblxuLyoqXG4gKiBHZXQgYW4gQXJyYXkgb2YgYnV0dG9uIGVsZW1lbnRzIGJlbG9uZ2luZyBkaXJlY3RseSB0byB0aGUgZ2l2ZW5cbiAqIGFjY29yZGlvbiBlbGVtZW50LlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gYWNjb3JkaW9uXG4gKiBAcmV0dXJuIHthcnJheTxIVE1MQnV0dG9uRWxlbWVudD59XG4gKi9cbmNvbnN0IGdldEFjY29yZGlvbkJ1dHRvbnMgPSAoYWNjb3JkaW9uKSA9PiB7XG4gIGNvbnN0IGJ1dHRvbnMgPSBzZWxlY3QoQlVUVE9OLCBhY2NvcmRpb24pO1xuXG4gIHJldHVybiBidXR0b25zLmZpbHRlcigoYnV0dG9uKSA9PiBidXR0b24uY2xvc2VzdChBQ0NPUkRJT04pID09PSBhY2NvcmRpb24pO1xufTtcblxuLyoqXG4gKiBUb2dnbGUgYSBidXR0b24ncyBcInByZXNzZWRcIiBzdGF0ZSwgb3B0aW9uYWxseSBwcm92aWRpbmcgYSB0YXJnZXRcbiAqIHN0YXRlLlxuICpcbiAqIEBwYXJhbSB7SFRNTEJ1dHRvbkVsZW1lbnR9IGJ1dHRvblxuICogQHBhcmFtIHtib29sZWFuP30gZXhwYW5kZWQgSWYgbm8gc3RhdGUgaXMgcHJvdmlkZWQsIHRoZSBjdXJyZW50XG4gKiBzdGF0ZSB3aWxsIGJlIHRvZ2dsZWQgKGZyb20gZmFsc2UgdG8gdHJ1ZSwgYW5kIHZpY2UtdmVyc2EpLlxuICogQHJldHVybiB7Ym9vbGVhbn0gdGhlIHJlc3VsdGluZyBzdGF0ZVxuICovXG5jb25zdCB0b2dnbGVCdXR0b24gPSAoYnV0dG9uLCBleHBhbmRlZCkgPT4ge1xuICBjb25zdCBhY2NvcmRpb24gPSBidXR0b24uY2xvc2VzdChBQ0NPUkRJT04pO1xuICBsZXQgc2FmZUV4cGFuZGVkID0gZXhwYW5kZWQ7XG5cbiAgaWYgKCFhY2NvcmRpb24pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7QlVUVE9OfSBpcyBtaXNzaW5nIG91dGVyICR7QUNDT1JESU9OfWApO1xuICB9XG5cbiAgc2FmZUV4cGFuZGVkID0gdG9nZ2xlKGJ1dHRvbiwgZXhwYW5kZWQpO1xuXG4gIC8vIFhYWCBtdWx0aXNlbGVjdGFibGUgaXMgb3B0LWluLCB0byBwcmVzZXJ2ZSBsZWdhY3kgYmVoYXZpb3JcbiAgY29uc3QgbXVsdGlzZWxlY3RhYmxlID0gYWNjb3JkaW9uLmhhc0F0dHJpYnV0ZShNVUxUSVNFTEVDVEFCTEUpO1xuXG4gIGlmIChzYWZlRXhwYW5kZWQgJiYgIW11bHRpc2VsZWN0YWJsZSkge1xuICAgIGdldEFjY29yZGlvbkJ1dHRvbnMoYWNjb3JkaW9uKS5mb3JFYWNoKChvdGhlcikgPT4ge1xuICAgICAgaWYgKG90aGVyICE9PSBidXR0b24pIHtcbiAgICAgICAgdG9nZ2xlKG90aGVyLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn07XG5cbi8qKlxuICogQHBhcmFtIHtIVE1MQnV0dG9uRWxlbWVudH0gYnV0dG9uXG4gKiBAcmV0dXJuIHtib29sZWFufSB0cnVlXG4gKi9cbmNvbnN0IHNob3dCdXR0b24gPSAoYnV0dG9uKSA9PiB0b2dnbGVCdXR0b24oYnV0dG9uLCB0cnVlKTtcblxuLyoqXG4gKiBAcGFyYW0ge0hUTUxCdXR0b25FbGVtZW50fSBidXR0b25cbiAqIEByZXR1cm4ge2Jvb2xlYW59IGZhbHNlXG4gKi9cbmNvbnN0IGhpZGVCdXR0b24gPSAoYnV0dG9uKSA9PiB0b2dnbGVCdXR0b24oYnV0dG9uLCBmYWxzZSk7XG5cbmNvbnN0IGFjY29yZGlvbiA9IGJlaGF2aW9yKFxuICB7XG4gICAgW0NMSUNLXToge1xuICAgICAgW0JVVFRPTl0oZXZlbnQpIHtcbiAgICAgICAgdG9nZ2xlQnV0dG9uKHRoaXMpO1xuXG4gICAgICAgIGlmICh0aGlzLmdldEF0dHJpYnV0ZShFWFBBTkRFRCkgPT09IFwidHJ1ZVwiKSB7XG4gICAgICAgICAgLy8gV2Ugd2VyZSBqdXN0IGV4cGFuZGVkLCBidXQgaWYgYW5vdGhlciBhY2NvcmRpb24gd2FzIGFsc28ganVzdFxuICAgICAgICAgIC8vIGNvbGxhcHNlZCwgd2UgbWF5IG5vIGxvbmdlciBiZSBpbiB0aGUgdmlld3BvcnQuIFRoaXMgZW5zdXJlc1xuICAgICAgICAgIC8vIHRoYXQgd2UgYXJlIHN0aWxsIHZpc2libGUsIHNvIHRoZSB1c2VyIGlzbid0IGNvbmZ1c2VkLlxuICAgICAgICAgIGlmICghaXNFbGVtZW50SW5WaWV3cG9ydCh0aGlzKSkgdGhpcy5zY3JvbGxJbnRvVmlldygpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIHtcbiAgICBpbml0KHJvb3QpIHtcbiAgICAgIHNlbGVjdChCVVRUT04sIHJvb3QpLmZvckVhY2goKGJ1dHRvbikgPT4ge1xuICAgICAgICBjb25zdCBleHBhbmRlZCA9IGJ1dHRvbi5nZXRBdHRyaWJ1dGUoRVhQQU5ERUQpID09PSBcInRydWVcIjtcbiAgICAgICAgdG9nZ2xlQnV0dG9uKGJ1dHRvbiwgZXhwYW5kZWQpO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBBQ0NPUkRJT04sXG4gICAgQlVUVE9OLFxuICAgIHNob3c6IHNob3dCdXR0b24sXG4gICAgaGlkZTogaGlkZUJ1dHRvbixcbiAgICB0b2dnbGU6IHRvZ2dsZUJ1dHRvbixcbiAgICBnZXRCdXR0b25zOiBnZXRBY2NvcmRpb25CdXR0b25zLFxuICB9XG4pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFjY29yZGlvbjtcbiIsImNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xuY29uc3QgeyBDTElDSyB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2V2ZW50c1wiKTtcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XG5cbmNvbnN0IEhFQURFUiA9IGAuJHtQUkVGSVh9LWJhbm5lcl9faGVhZGVyYDtcbmNvbnN0IEVYUEFOREVEX0NMQVNTID0gYCR7UFJFRklYfS1iYW5uZXJfX2hlYWRlci0tZXhwYW5kZWRgO1xuXG5jb25zdCB0b2dnbGVCYW5uZXIgPSBmdW5jdGlvbiB0b2dnbGVFbChldmVudCkge1xuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICB0aGlzLmNsb3Nlc3QoSEVBREVSKS5jbGFzc0xpc3QudG9nZ2xlKEVYUEFOREVEX0NMQVNTKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYmVoYXZpb3Ioe1xuICBbQ0xJQ0tdOiB7XG4gICAgW2Ake0hFQURFUn0gW2FyaWEtY29udHJvbHNdYF06IHRvZ2dsZUJhbm5lcixcbiAgfSxcbn0pO1xuIiwiY29uc3Qgc2VsZWN0ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3NlbGVjdFwiKTtcbmNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xuY29uc3QgZGVib3VuY2UgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvZGVib3VuY2VcIik7XG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvY29uZmlnXCIpO1xuXG5jb25zdCBDSEFSQUNURVJfQ09VTlRfQ0xBU1MgPSBgJHtQUkVGSVh9LWNoYXJhY3Rlci1jb3VudGA7XG5jb25zdCBDSEFSQUNURVJfQ09VTlQgPSBgLiR7Q0hBUkFDVEVSX0NPVU5UX0NMQVNTfWA7XG5jb25zdCBJTlBVVCA9IGAuJHtQUkVGSVh9LWNoYXJhY3Rlci1jb3VudF9fZmllbGRgO1xuY29uc3QgTUVTU0FHRSA9IGAuJHtQUkVGSVh9LWNoYXJhY3Rlci1jb3VudF9fbWVzc2FnZWA7XG5jb25zdCBWQUxJREFUSU9OX01FU1NBR0UgPSBcIlRoZSBjb250ZW50IGlzIHRvbyBsb25nLlwiO1xuY29uc3QgTUVTU0FHRV9JTlZBTElEX0NMQVNTID0gYCR7UFJFRklYfS1jaGFyYWN0ZXItY291bnRfX3N0YXR1cy0taW52YWxpZGA7XG5jb25zdCBTVEFUVVNfTUVTU0FHRV9DTEFTUyA9IGAke0NIQVJBQ1RFUl9DT1VOVF9DTEFTU31fX3N0YXR1c2A7XG5jb25zdCBTVEFUVVNfTUVTU0FHRV9TUl9PTkxZX0NMQVNTID0gYCR7Q0hBUkFDVEVSX0NPVU5UX0NMQVNTfV9fc3Itc3RhdHVzYDtcbmNvbnN0IFNUQVRVU19NRVNTQUdFID0gYC4ke1NUQVRVU19NRVNTQUdFX0NMQVNTfWA7XG5jb25zdCBTVEFUVVNfTUVTU0FHRV9TUl9PTkxZID0gYC4ke1NUQVRVU19NRVNTQUdFX1NSX09OTFlfQ0xBU1N9YDtcbmNvbnN0IERFRkFVTFRfU1RBVFVTX0xBQkVMID0gYGNoYXJhY3RlcnMgYWxsb3dlZGA7XG5cbi8qKlxuICogUmV0dXJucyB0aGUgcm9vdCBhbmQgbWVzc2FnZSBlbGVtZW50IGZvciBhbiBjaGFyYWN0ZXIgY291bnQgaW5wdXRcbiAqXG4gKiBAcGFyYW0ge0hUTUxJbnB1dEVsZW1lbnR8SFRNTFRleHRBcmVhRWxlbWVudH0gaW5wdXRFbCBUaGUgY2hhcmFjdGVyIGNvdW50IGlucHV0IGVsZW1lbnRcbiAqIEByZXR1cm5zIHtDaGFyYWN0ZXJDb3VudEVsZW1lbnRzfSBlbGVtZW50cyBUaGUgcm9vdCBhbmQgbWVzc2FnZSBlbGVtZW50LlxuICovXG5jb25zdCBnZXRDaGFyYWN0ZXJDb3VudEVsZW1lbnRzID0gKGlucHV0RWwpID0+IHtcbiAgY29uc3QgY2hhcmFjdGVyQ291bnRFbCA9IGlucHV0RWwuY2xvc2VzdChDSEFSQUNURVJfQ09VTlQpO1xuXG4gIGlmICghY2hhcmFjdGVyQ291bnRFbCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHtJTlBVVH0gaXMgbWlzc2luZyBvdXRlciAke0NIQVJBQ1RFUl9DT1VOVH1gKTtcbiAgfVxuXG4gIGNvbnN0IG1lc3NhZ2VFbCA9IGNoYXJhY3RlckNvdW50RWwucXVlcnlTZWxlY3RvcihNRVNTQUdFKTtcblxuICBpZiAoIW1lc3NhZ2VFbCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHtDSEFSQUNURVJfQ09VTlR9IGlzIG1pc3NpbmcgaW5uZXIgJHtNRVNTQUdFfWApO1xuICB9XG5cbiAgcmV0dXJuIHsgY2hhcmFjdGVyQ291bnRFbCwgbWVzc2FnZUVsIH07XG59O1xuXG4vKipcbiAqIE1vdmUgbWF4bGVuZ3RoIGF0dHJpYnV0ZSB0byBhIGRhdGEgYXR0cmlidXRlIG9uIHVzYS1jaGFyYWN0ZXItY291bnRcbiAqXG4gKiBAcGFyYW0ge0hUTUxJbnB1dEVsZW1lbnR8SFRNTFRleHRBcmVhRWxlbWVudH0gaW5wdXRFbCBUaGUgY2hhcmFjdGVyIGNvdW50IGlucHV0IGVsZW1lbnRcbiAqL1xuY29uc3Qgc2V0RGF0YUxlbmd0aCA9IChpbnB1dEVsKSA9PiB7XG4gIGNvbnN0IHsgY2hhcmFjdGVyQ291bnRFbCB9ID0gZ2V0Q2hhcmFjdGVyQ291bnRFbGVtZW50cyhpbnB1dEVsKTtcblxuICBjb25zdCBtYXhsZW5ndGggPSBpbnB1dEVsLmdldEF0dHJpYnV0ZShcIm1heGxlbmd0aFwiKTtcblxuICBpZiAoIW1heGxlbmd0aCkgcmV0dXJuO1xuXG4gIGlucHV0RWwucmVtb3ZlQXR0cmlidXRlKFwibWF4bGVuZ3RoXCIpO1xuICBjaGFyYWN0ZXJDb3VudEVsLnNldEF0dHJpYnV0ZShcImRhdGEtbWF4bGVuZ3RoXCIsIG1heGxlbmd0aCk7XG59O1xuXG4vKipcbiAqIENyZWF0ZSBhbmQgYXBwZW5kIHN0YXR1cyBtZXNzYWdlcyBmb3IgdmlzdWFsIGFuZCBzY3JlZW4gcmVhZGVyc1xuICpcbiAqIEBwYXJhbSB7SFRNTERpdkVsZW1lbnR9IGNoYXJhY3RlckNvdW50RWwgLSBEaXYgd2l0aCBgLnVzYS1jaGFyYWN0ZXItY291bnRgIGNsYXNzXG4gKiBAZGVzY3JpcHRpb24gIENyZWF0ZSB0d28gc3RhdHVzIG1lc3NhZ2VzIGZvciBudW1iZXIgb2YgY2hhcmFjdGVycyBsZWZ0O1xuICogb25lIHZpc3VhbCBzdGF0dXMgYW5kIGFub3RoZXIgZm9yIHNjcmVlbiByZWFkZXJzXG4gKi9cbmNvbnN0IGNyZWF0ZVN0YXR1c01lc3NhZ2VzID0gKGNoYXJhY3RlckNvdW50RWwpID0+IHtcbiAgY29uc3Qgc3RhdHVzTWVzc2FnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGNvbnN0IHNyU3RhdHVzTWVzc2FnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGNvbnN0IG1heExlbmd0aCA9IGNoYXJhY3RlckNvdW50RWwuZGF0YXNldC5tYXhsZW5ndGg7XG4gIGNvbnN0IGRlZmF1bHRNZXNzYWdlID0gYCR7bWF4TGVuZ3RofSAke0RFRkFVTFRfU1RBVFVTX0xBQkVMfWA7XG5cbiAgc3RhdHVzTWVzc2FnZS5jbGFzc0xpc3QuYWRkKGAke1NUQVRVU19NRVNTQUdFX0NMQVNTfWAsIFwidXNhLWhpbnRcIik7XG4gIHNyU3RhdHVzTWVzc2FnZS5jbGFzc0xpc3QuYWRkKFxuICAgIGAke1NUQVRVU19NRVNTQUdFX1NSX09OTFlfQ0xBU1N9YCxcbiAgICBcInVzYS1zci1vbmx5XCJcbiAgKTtcblxuICBzdGF0dXNNZXNzYWdlLnNldEF0dHJpYnV0ZShcImFyaWEtaGlkZGVuXCIsIHRydWUpO1xuICBzclN0YXR1c01lc3NhZ2Uuc2V0QXR0cmlidXRlKFwiYXJpYS1saXZlXCIsIFwicG9saXRlXCIpO1xuXG4gIHN0YXR1c01lc3NhZ2UudGV4dENvbnRlbnQgPSBkZWZhdWx0TWVzc2FnZTtcbiAgc3JTdGF0dXNNZXNzYWdlLnRleHRDb250ZW50ID0gZGVmYXVsdE1lc3NhZ2U7XG5cbiAgY2hhcmFjdGVyQ291bnRFbC5hcHBlbmQoc3RhdHVzTWVzc2FnZSwgc3JTdGF0dXNNZXNzYWdlKTtcbn07XG5cbi8qKlxuICogUmV0dXJucyBtZXNzYWdlIHdpdGggaG93IG1hbnkgY2hhcmFjdGVycyBhcmUgbGVmdFxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBjdXJyZW50TGVuZ3RoIC0gVGhlIG51bWJlciBvZiBjaGFyYWN0ZXJzIHVzZWRcbiAqIEBwYXJhbSB7bnVtYmVyfSBtYXhMZW5ndGggLSBUaGUgdG90YWwgbnVtYmVyIG9mIGNoYXJhY3RlcnMgYWxsb3dlZFxuICogQHJldHVybnMge3N0cmluZ30gQSBzdHJpbmcgZGVzY3JpcHRpb24gb2YgaG93IG1hbnkgY2hhcmFjdGVycyBhcmUgbGVmdFxuICovXG5jb25zdCBnZXRDb3VudE1lc3NhZ2UgPSAoY3VycmVudExlbmd0aCwgbWF4TGVuZ3RoKSA9PiB7XG4gIGxldCBuZXdNZXNzYWdlID0gXCJcIjtcblxuICBpZiAoY3VycmVudExlbmd0aCA9PT0gMCkge1xuICAgIG5ld01lc3NhZ2UgPSBgJHttYXhMZW5ndGh9ICR7REVGQVVMVF9TVEFUVVNfTEFCRUx9YDtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBkaWZmZXJlbmNlID0gTWF0aC5hYnMobWF4TGVuZ3RoIC0gY3VycmVudExlbmd0aCk7XG4gICAgY29uc3QgY2hhcmFjdGVycyA9IGBjaGFyYWN0ZXIke2RpZmZlcmVuY2UgPT09IDEgPyBcIlwiIDogXCJzXCJ9YDtcbiAgICBjb25zdCBndWlkYW5jZSA9IGN1cnJlbnRMZW5ndGggPiBtYXhMZW5ndGggPyBcIm92ZXIgbGltaXRcIiA6IFwibGVmdFwiO1xuXG4gICAgbmV3TWVzc2FnZSA9IGAke2RpZmZlcmVuY2V9ICR7Y2hhcmFjdGVyc30gJHtndWlkYW5jZX1gO1xuICB9XG5cbiAgcmV0dXJuIG5ld01lc3NhZ2U7XG59O1xuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIGNoYXJhY3RlciBjb3VudCBzdGF0dXMgZm9yIHNjcmVlbiByZWFkZXJzIGFmdGVyIGEgMTAwMG1zIGRlbGF5LlxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IG1zZ0VsIC0gVGhlIHNjcmVlbiByZWFkZXIgc3RhdHVzIG1lc3NhZ2UgZWxlbWVudFxuICogQHBhcmFtIHtzdHJpbmd9IHN0YXR1c01lc3NhZ2UgLSBBIHN0cmluZyBvZiB0aGUgY3VycmVudCBjaGFyYWN0ZXIgc3RhdHVzXG4gKi9cbmNvbnN0IHNyVXBkYXRlU3RhdHVzID0gZGVib3VuY2UoKG1zZ0VsLCBzdGF0dXNNZXNzYWdlKSA9PiB7XG4gIGNvbnN0IHNyU3RhdHVzTWVzc2FnZSA9IG1zZ0VsO1xuICBzclN0YXR1c01lc3NhZ2UudGV4dENvbnRlbnQgPSBzdGF0dXNNZXNzYWdlO1xufSwgMTAwMCk7XG5cbi8qKlxuICogVXBkYXRlIHRoZSBjaGFyYWN0ZXIgY291bnQgY29tcG9uZW50XG4gKlxuICogQGRlc2NyaXB0aW9uIE9uIGlucHV0LCBpdCB3aWxsIHVwZGF0ZSB2aXN1YWwgc3RhdHVzLCBzY3JlZW5yZWFkZXJcbiAqIHN0YXR1cyBhbmQgdXBkYXRlIGlucHV0IHZhbGlkYXRpb24gKGlmIG92ZXIgY2hhcmFjdGVyIGxlbmd0aClcbiAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudHxIVE1MVGV4dEFyZWFFbGVtZW50fSBpbnB1dEVsIFRoZSBjaGFyYWN0ZXIgY291bnQgaW5wdXQgZWxlbWVudFxuICovXG5jb25zdCB1cGRhdGVDb3VudE1lc3NhZ2UgPSAoaW5wdXRFbCkgPT4ge1xuICBjb25zdCB7IGNoYXJhY3RlckNvdW50RWwgfSA9IGdldENoYXJhY3RlckNvdW50RWxlbWVudHMoaW5wdXRFbCk7XG4gIGNvbnN0IGN1cnJlbnRMZW5ndGggPSBpbnB1dEVsLnZhbHVlLmxlbmd0aDtcbiAgY29uc3QgbWF4TGVuZ3RoID0gcGFyc2VJbnQoXG4gICAgY2hhcmFjdGVyQ291bnRFbC5nZXRBdHRyaWJ1dGUoXCJkYXRhLW1heGxlbmd0aFwiKSxcbiAgICAxMFxuICApO1xuICBjb25zdCBzdGF0dXNNZXNzYWdlID0gY2hhcmFjdGVyQ291bnRFbC5xdWVyeVNlbGVjdG9yKFNUQVRVU19NRVNTQUdFKTtcbiAgY29uc3Qgc3JTdGF0dXNNZXNzYWdlID0gY2hhcmFjdGVyQ291bnRFbC5xdWVyeVNlbGVjdG9yKFxuICAgIFNUQVRVU19NRVNTQUdFX1NSX09OTFlcbiAgKTtcbiAgY29uc3QgY3VycmVudFN0YXR1c01lc3NhZ2UgPSBnZXRDb3VudE1lc3NhZ2UoY3VycmVudExlbmd0aCwgbWF4TGVuZ3RoKTtcblxuICBpZiAoIW1heExlbmd0aCkgcmV0dXJuO1xuXG4gIGNvbnN0IGlzT3ZlckxpbWl0ID0gY3VycmVudExlbmd0aCAmJiBjdXJyZW50TGVuZ3RoID4gbWF4TGVuZ3RoO1xuXG4gIHN0YXR1c01lc3NhZ2UudGV4dENvbnRlbnQgPSBjdXJyZW50U3RhdHVzTWVzc2FnZTtcbiAgc3JVcGRhdGVTdGF0dXMoc3JTdGF0dXNNZXNzYWdlLCBjdXJyZW50U3RhdHVzTWVzc2FnZSk7XG5cbiAgaWYgKGlzT3ZlckxpbWl0ICYmICFpbnB1dEVsLnZhbGlkYXRpb25NZXNzYWdlKSB7XG4gICAgaW5wdXRFbC5zZXRDdXN0b21WYWxpZGl0eShWQUxJREFUSU9OX01FU1NBR0UpO1xuICB9XG5cbiAgaWYgKCFpc092ZXJMaW1pdCAmJiBpbnB1dEVsLnZhbGlkYXRpb25NZXNzYWdlID09PSBWQUxJREFUSU9OX01FU1NBR0UpIHtcbiAgICBpbnB1dEVsLnNldEN1c3RvbVZhbGlkaXR5KFwiXCIpO1xuICB9XG5cbiAgc3RhdHVzTWVzc2FnZS5jbGFzc0xpc3QudG9nZ2xlKE1FU1NBR0VfSU5WQUxJRF9DTEFTUywgaXNPdmVyTGltaXQpO1xufTtcblxuLyoqXG4gKiBJbml0aWFsaXplIGNvbXBvbmVudFxuICpcbiAqIEBkZXNjcmlwdGlvbiBPbiBpbml0IHRoaXMgZnVuY3Rpb24gd2lsbCBjcmVhdGUgZWxlbWVudHMgYW5kIHVwZGF0ZSBhbnlcbiAqIGF0dHJpYnV0ZXMgc28gaXQgY2FuIHRlbGwgdGhlIHVzZXIgaG93IG1hbnkgY2hhcmFjdGVycyBhcmUgbGVmdC5cbiAqIEBwYXJhbSAge0hUTUxJbnB1dEVsZW1lbnR8SFRNTFRleHRBcmVhRWxlbWVudH0gaW5wdXRFbCB0aGUgY29tcG9uZW50cyBpbnB1dFxuICovXG5jb25zdCBlbmhhbmNlQ2hhcmFjdGVyQ291bnQgPSAoaW5wdXRFbCkgPT4ge1xuICBjb25zdCB7IGNoYXJhY3RlckNvdW50RWwsIG1lc3NhZ2VFbCB9ID0gZ2V0Q2hhcmFjdGVyQ291bnRFbGVtZW50cyhpbnB1dEVsKTtcblxuICAvLyBIaWRlIGhpbnQgYW5kIHJlbW92ZSBhcmlhLWxpdmUgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG4gIG1lc3NhZ2VFbC5jbGFzc0xpc3QuYWRkKFwidXNhLXNyLW9ubHlcIik7XG4gIG1lc3NhZ2VFbC5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWxpdmVcIik7XG5cbiAgc2V0RGF0YUxlbmd0aChpbnB1dEVsKTtcbiAgY3JlYXRlU3RhdHVzTWVzc2FnZXMoY2hhcmFjdGVyQ291bnRFbCk7XG59O1xuXG5jb25zdCBjaGFyYWN0ZXJDb3VudCA9IGJlaGF2aW9yKFxuICB7XG4gICAgaW5wdXQ6IHtcbiAgICAgIFtJTlBVVF0oKSB7XG4gICAgICAgIHVwZGF0ZUNvdW50TWVzc2FnZSh0aGlzKTtcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAge1xuICAgIGluaXQocm9vdCkge1xuICAgICAgc2VsZWN0KElOUFVULCByb290KS5mb3JFYWNoKChpbnB1dCkgPT4gZW5oYW5jZUNoYXJhY3RlckNvdW50KGlucHV0KSk7XG4gICAgfSxcbiAgICBNRVNTQUdFX0lOVkFMSURfQ0xBU1MsXG4gICAgVkFMSURBVElPTl9NRVNTQUdFLFxuICAgIFNUQVRVU19NRVNTQUdFX0NMQVNTLFxuICAgIFNUQVRVU19NRVNTQUdFX1NSX09OTFlfQ0xBU1MsXG4gICAgREVGQVVMVF9TVEFUVVNfTEFCRUwsXG4gICAgY3JlYXRlU3RhdHVzTWVzc2FnZXMsXG4gICAgZ2V0Q291bnRNZXNzYWdlLFxuICAgIHVwZGF0ZUNvdW50TWVzc2FnZSxcbiAgfVxuKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjaGFyYWN0ZXJDb3VudDtcbiIsImNvbnN0IGtleW1hcCA9IHJlcXVpcmUoXCJyZWNlcHRvci9rZXltYXBcIik7XG5jb25zdCBzZWxlY3RPck1hdGNoZXMgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2VsZWN0LW9yLW1hdGNoZXNcIik7XG5jb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcbmNvbnN0IFNhbml0aXplciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zYW5pdGl6ZXJcIik7XG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvY29uZmlnXCIpO1xuY29uc3QgeyBDTElDSyB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2V2ZW50c1wiKTtcblxuY29uc3QgQ09NQk9fQk9YX0NMQVNTID0gYCR7UFJFRklYfS1jb21iby1ib3hgO1xuY29uc3QgQ09NQk9fQk9YX1BSSVNUSU5FX0NMQVNTID0gYCR7Q09NQk9fQk9YX0NMQVNTfS0tcHJpc3RpbmVgO1xuY29uc3QgU0VMRUNUX0NMQVNTID0gYCR7Q09NQk9fQk9YX0NMQVNTfV9fc2VsZWN0YDtcbmNvbnN0IElOUFVUX0NMQVNTID0gYCR7Q09NQk9fQk9YX0NMQVNTfV9faW5wdXRgO1xuY29uc3QgQ0xFQVJfSU5QVVRfQlVUVE9OX0NMQVNTID0gYCR7Q09NQk9fQk9YX0NMQVNTfV9fY2xlYXItaW5wdXRgO1xuY29uc3QgQ0xFQVJfSU5QVVRfQlVUVE9OX1dSQVBQRVJfQ0xBU1MgPSBgJHtDTEVBUl9JTlBVVF9CVVRUT05fQ0xBU1N9X193cmFwcGVyYDtcbmNvbnN0IElOUFVUX0JVVFRPTl9TRVBBUkFUT1JfQ0xBU1MgPSBgJHtDT01CT19CT1hfQ0xBU1N9X19pbnB1dC1idXR0b24tc2VwYXJhdG9yYDtcbmNvbnN0IFRPR0dMRV9MSVNUX0JVVFRPTl9DTEFTUyA9IGAke0NPTUJPX0JPWF9DTEFTU31fX3RvZ2dsZS1saXN0YDtcbmNvbnN0IFRPR0dMRV9MSVNUX0JVVFRPTl9XUkFQUEVSX0NMQVNTID0gYCR7VE9HR0xFX0xJU1RfQlVUVE9OX0NMQVNTfV9fd3JhcHBlcmA7XG5jb25zdCBMSVNUX0NMQVNTID0gYCR7Q09NQk9fQk9YX0NMQVNTfV9fbGlzdGA7XG5jb25zdCBMSVNUX09QVElPTl9DTEFTUyA9IGAke0NPTUJPX0JPWF9DTEFTU31fX2xpc3Qtb3B0aW9uYDtcbmNvbnN0IExJU1RfT1BUSU9OX0ZPQ1VTRURfQ0xBU1MgPSBgJHtMSVNUX09QVElPTl9DTEFTU30tLWZvY3VzZWRgO1xuY29uc3QgTElTVF9PUFRJT05fU0VMRUNURURfQ0xBU1MgPSBgJHtMSVNUX09QVElPTl9DTEFTU30tLXNlbGVjdGVkYDtcbmNvbnN0IFNUQVRVU19DTEFTUyA9IGAke0NPTUJPX0JPWF9DTEFTU31fX3N0YXR1c2A7XG5cbmNvbnN0IENPTUJPX0JPWCA9IGAuJHtDT01CT19CT1hfQ0xBU1N9YDtcbmNvbnN0IFNFTEVDVCA9IGAuJHtTRUxFQ1RfQ0xBU1N9YDtcbmNvbnN0IElOUFVUID0gYC4ke0lOUFVUX0NMQVNTfWA7XG5jb25zdCBDTEVBUl9JTlBVVF9CVVRUT04gPSBgLiR7Q0xFQVJfSU5QVVRfQlVUVE9OX0NMQVNTfWA7XG5jb25zdCBUT0dHTEVfTElTVF9CVVRUT04gPSBgLiR7VE9HR0xFX0xJU1RfQlVUVE9OX0NMQVNTfWA7XG5jb25zdCBMSVNUID0gYC4ke0xJU1RfQ0xBU1N9YDtcbmNvbnN0IExJU1RfT1BUSU9OID0gYC4ke0xJU1RfT1BUSU9OX0NMQVNTfWA7XG5jb25zdCBMSVNUX09QVElPTl9GT0NVU0VEID0gYC4ke0xJU1RfT1BUSU9OX0ZPQ1VTRURfQ0xBU1N9YDtcbmNvbnN0IExJU1RfT1BUSU9OX1NFTEVDVEVEID0gYC4ke0xJU1RfT1BUSU9OX1NFTEVDVEVEX0NMQVNTfWA7XG5jb25zdCBTVEFUVVMgPSBgLiR7U1RBVFVTX0NMQVNTfWA7XG5cbmNvbnN0IERFRkFVTFRfRklMVEVSID0gXCIuKnt7cXVlcnl9fS4qXCI7XG5cbmNvbnN0IG5vb3AgPSAoKSA9PiB7fTtcblxuLyoqXG4gKiBzZXQgdGhlIHZhbHVlIG9mIHRoZSBlbGVtZW50IGFuZCBkaXNwYXRjaCBhIGNoYW5nZSBldmVudFxuICpcbiAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudHxIVE1MU2VsZWN0RWxlbWVudH0gZWwgVGhlIGVsZW1lbnQgdG8gdXBkYXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgVGhlIG5ldyB2YWx1ZSBvZiB0aGUgZWxlbWVudFxuICovXG5jb25zdCBjaGFuZ2VFbGVtZW50VmFsdWUgPSAoZWwsIHZhbHVlID0gXCJcIikgPT4ge1xuICBjb25zdCBlbGVtZW50VG9DaGFuZ2UgPSBlbDtcbiAgZWxlbWVudFRvQ2hhbmdlLnZhbHVlID0gdmFsdWU7XG5cbiAgY29uc3QgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoXCJjaGFuZ2VcIiwge1xuICAgIGJ1YmJsZXM6IHRydWUsXG4gICAgY2FuY2VsYWJsZTogdHJ1ZSxcbiAgICBkZXRhaWw6IHsgdmFsdWUgfSxcbiAgfSk7XG4gIGVsZW1lbnRUb0NoYW5nZS5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbn07XG5cbi8qKlxuICogVGhlIGVsZW1lbnRzIHdpdGhpbiB0aGUgY29tYm8gYm94LlxuICogQHR5cGVkZWYge09iamVjdH0gQ29tYm9Cb3hDb250ZXh0XG4gKiBAcHJvcGVydHkge0hUTUxFbGVtZW50fSBjb21ib0JveEVsXG4gKiBAcHJvcGVydHkge0hUTUxTZWxlY3RFbGVtZW50fSBzZWxlY3RFbFxuICogQHByb3BlcnR5IHtIVE1MSW5wdXRFbGVtZW50fSBpbnB1dEVsXG4gKiBAcHJvcGVydHkge0hUTUxVTGlzdEVsZW1lbnR9IGxpc3RFbFxuICogQHByb3BlcnR5IHtIVE1MRGl2RWxlbWVudH0gc3RhdHVzRWxcbiAqIEBwcm9wZXJ0eSB7SFRNTExJRWxlbWVudH0gZm9jdXNlZE9wdGlvbkVsXG4gKiBAcHJvcGVydHkge0hUTUxMSUVsZW1lbnR9IHNlbGVjdGVkT3B0aW9uRWxcbiAqIEBwcm9wZXJ0eSB7SFRNTEJ1dHRvbkVsZW1lbnR9IHRvZ2dsZUxpc3RCdG5FbFxuICogQHByb3BlcnR5IHtIVE1MQnV0dG9uRWxlbWVudH0gY2xlYXJJbnB1dEJ0bkVsXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IGlzUHJpc3RpbmVcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gZGlzYWJsZUZpbHRlcmluZ1xuICovXG5cbi8qKlxuICogR2V0IGFuIG9iamVjdCBvZiBlbGVtZW50cyBiZWxvbmdpbmcgZGlyZWN0bHkgdG8gdGhlIGdpdmVuXG4gKiBjb21ibyBib3ggY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIHRoZSBlbGVtZW50IHdpdGhpbiB0aGUgY29tYm8gYm94XG4gKiBAcmV0dXJucyB7Q29tYm9Cb3hDb250ZXh0fSBlbGVtZW50c1xuICovXG5jb25zdCBnZXRDb21ib0JveENvbnRleHQgPSAoZWwpID0+IHtcbiAgY29uc3QgY29tYm9Cb3hFbCA9IGVsLmNsb3Nlc3QoQ09NQk9fQk9YKTtcblxuICBpZiAoIWNvbWJvQm94RWwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEVsZW1lbnQgaXMgbWlzc2luZyBvdXRlciAke0NPTUJPX0JPWH1gKTtcbiAgfVxuXG4gIGNvbnN0IHNlbGVjdEVsID0gY29tYm9Cb3hFbC5xdWVyeVNlbGVjdG9yKFNFTEVDVCk7XG4gIGNvbnN0IGlucHV0RWwgPSBjb21ib0JveEVsLnF1ZXJ5U2VsZWN0b3IoSU5QVVQpO1xuICBjb25zdCBsaXN0RWwgPSBjb21ib0JveEVsLnF1ZXJ5U2VsZWN0b3IoTElTVCk7XG4gIGNvbnN0IHN0YXR1c0VsID0gY29tYm9Cb3hFbC5xdWVyeVNlbGVjdG9yKFNUQVRVUyk7XG4gIGNvbnN0IGZvY3VzZWRPcHRpb25FbCA9IGNvbWJvQm94RWwucXVlcnlTZWxlY3RvcihMSVNUX09QVElPTl9GT0NVU0VEKTtcbiAgY29uc3Qgc2VsZWN0ZWRPcHRpb25FbCA9IGNvbWJvQm94RWwucXVlcnlTZWxlY3RvcihMSVNUX09QVElPTl9TRUxFQ1RFRCk7XG4gIGNvbnN0IHRvZ2dsZUxpc3RCdG5FbCA9IGNvbWJvQm94RWwucXVlcnlTZWxlY3RvcihUT0dHTEVfTElTVF9CVVRUT04pO1xuICBjb25zdCBjbGVhcklucHV0QnRuRWwgPSBjb21ib0JveEVsLnF1ZXJ5U2VsZWN0b3IoQ0xFQVJfSU5QVVRfQlVUVE9OKTtcblxuICBjb25zdCBpc1ByaXN0aW5lID0gY29tYm9Cb3hFbC5jbGFzc0xpc3QuY29udGFpbnMoQ09NQk9fQk9YX1BSSVNUSU5FX0NMQVNTKTtcbiAgY29uc3QgZGlzYWJsZUZpbHRlcmluZyA9IGNvbWJvQm94RWwuZGF0YXNldC5kaXNhYmxlRmlsdGVyaW5nID09PSBcInRydWVcIjtcblxuICByZXR1cm4ge1xuICAgIGNvbWJvQm94RWwsXG4gICAgc2VsZWN0RWwsXG4gICAgaW5wdXRFbCxcbiAgICBsaXN0RWwsXG4gICAgc3RhdHVzRWwsXG4gICAgZm9jdXNlZE9wdGlvbkVsLFxuICAgIHNlbGVjdGVkT3B0aW9uRWwsXG4gICAgdG9nZ2xlTGlzdEJ0bkVsLFxuICAgIGNsZWFySW5wdXRCdG5FbCxcbiAgICBpc1ByaXN0aW5lLFxuICAgIGRpc2FibGVGaWx0ZXJpbmcsXG4gIH07XG59O1xuXG4vKipcbiAqIERpc2FibGUgdGhlIGNvbWJvLWJveCBjb21wb25lbnRcbiAqXG4gKiBAcGFyYW0ge0hUTUxJbnB1dEVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50XG4gKi9cbmNvbnN0IGRpc2FibGUgPSAoZWwpID0+IHtcbiAgY29uc3QgeyBpbnB1dEVsLCB0b2dnbGVMaXN0QnRuRWwsIGNsZWFySW5wdXRCdG5FbCB9ID0gZ2V0Q29tYm9Cb3hDb250ZXh0KGVsKTtcblxuICBjbGVhcklucHV0QnRuRWwuaGlkZGVuID0gdHJ1ZTtcbiAgY2xlYXJJbnB1dEJ0bkVsLmRpc2FibGVkID0gdHJ1ZTtcbiAgdG9nZ2xlTGlzdEJ0bkVsLmRpc2FibGVkID0gdHJ1ZTtcbiAgaW5wdXRFbC5kaXNhYmxlZCA9IHRydWU7XG59O1xuXG4vKipcbiAqIEVuYWJsZSB0aGUgY29tYm8tYm94IGNvbXBvbmVudFxuICpcbiAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcbiAqL1xuY29uc3QgZW5hYmxlID0gKGVsKSA9PiB7XG4gIGNvbnN0IHsgaW5wdXRFbCwgdG9nZ2xlTGlzdEJ0bkVsLCBjbGVhcklucHV0QnRuRWwgfSA9IGdldENvbWJvQm94Q29udGV4dChlbCk7XG5cbiAgY2xlYXJJbnB1dEJ0bkVsLmhpZGRlbiA9IGZhbHNlO1xuICBjbGVhcklucHV0QnRuRWwuZGlzYWJsZWQgPSBmYWxzZTtcbiAgdG9nZ2xlTGlzdEJ0bkVsLmRpc2FibGVkID0gZmFsc2U7XG4gIGlucHV0RWwuZGlzYWJsZWQgPSBmYWxzZTtcbn07XG5cbi8qKlxuICogRW5oYW5jZSBhIHNlbGVjdCBlbGVtZW50IGludG8gYSBjb21ibyBib3ggY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IF9jb21ib0JveEVsIFRoZSBpbml0aWFsIGVsZW1lbnQgb2YgdGhlIGNvbWJvIGJveCBjb21wb25lbnRcbiAqL1xuY29uc3QgZW5oYW5jZUNvbWJvQm94ID0gKF9jb21ib0JveEVsKSA9PiB7XG4gIGNvbnN0IGNvbWJvQm94RWwgPSBfY29tYm9Cb3hFbC5jbG9zZXN0KENPTUJPX0JPWCk7XG5cbiAgaWYgKGNvbWJvQm94RWwuZGF0YXNldC5lbmhhbmNlZCkgcmV0dXJuO1xuXG4gIGNvbnN0IHNlbGVjdEVsID0gY29tYm9Cb3hFbC5xdWVyeVNlbGVjdG9yKFwic2VsZWN0XCIpO1xuXG4gIGlmICghc2VsZWN0RWwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7Q09NQk9fQk9YfSBpcyBtaXNzaW5nIGlubmVyIHNlbGVjdGApO1xuICB9XG5cbiAgY29uc3Qgc2VsZWN0SWQgPSBzZWxlY3RFbC5pZDtcbiAgY29uc3Qgc2VsZWN0TGFiZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBsYWJlbFtmb3I9XCIke3NlbGVjdElkfVwiXWApO1xuICBjb25zdCBsaXN0SWQgPSBgJHtzZWxlY3RJZH0tLWxpc3RgO1xuICBjb25zdCBsaXN0SWRMYWJlbCA9IGAke3NlbGVjdElkfS1sYWJlbGA7XG4gIGNvbnN0IGFzc2lzdGl2ZUhpbnRJRCA9IGAke3NlbGVjdElkfS0tYXNzaXN0aXZlSGludGA7XG4gIGNvbnN0IGFkZGl0aW9uYWxBdHRyaWJ1dGVzID0gW107XG4gIGNvbnN0IHsgZGVmYXVsdFZhbHVlIH0gPSBjb21ib0JveEVsLmRhdGFzZXQ7XG4gIGNvbnN0IHsgcGxhY2Vob2xkZXIgfSA9IGNvbWJvQm94RWwuZGF0YXNldDtcbiAgbGV0IHNlbGVjdGVkT3B0aW9uO1xuXG4gIGlmIChwbGFjZWhvbGRlcikge1xuICAgIGFkZGl0aW9uYWxBdHRyaWJ1dGVzLnB1c2goeyBwbGFjZWhvbGRlciB9KTtcbiAgfVxuXG4gIGlmIChkZWZhdWx0VmFsdWUpIHtcbiAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gc2VsZWN0RWwub3B0aW9ucy5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMSkge1xuICAgICAgY29uc3Qgb3B0aW9uRWwgPSBzZWxlY3RFbC5vcHRpb25zW2ldO1xuXG4gICAgICBpZiAob3B0aW9uRWwudmFsdWUgPT09IGRlZmF1bHRWYWx1ZSkge1xuICAgICAgICBzZWxlY3RlZE9wdGlvbiA9IG9wdGlvbkVsO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVGhyb3cgZXJyb3IgaWYgY29tYm9ib3ggaXMgbWlzc2luZyBhIGxhYmVsIG9yIGxhYmVsIGlzIG1pc3NpbmdcbiAgICogYGZvcmAgYXR0cmlidXRlLiBPdGhlcndpc2UsIHNldCB0aGUgSUQgdG8gbWF0Y2ggdGhlIDx1bD4gYXJpYS1sYWJlbGxlZGJ5XG4gICAqL1xuICBpZiAoIXNlbGVjdExhYmVsIHx8ICFzZWxlY3RMYWJlbC5tYXRjaGVzKGBsYWJlbFtmb3I9XCIke3NlbGVjdElkfVwiXWApKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYCR7Q09NQk9fQk9YfSBmb3IgJHtzZWxlY3RJZH0gaXMgZWl0aGVyIG1pc3NpbmcgYSBsYWJlbCBvciBhIFwiZm9yXCIgYXR0cmlidXRlYFxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgc2VsZWN0TGFiZWwuc2V0QXR0cmlidXRlKFwiaWRcIiwgbGlzdElkTGFiZWwpO1xuICB9XG5cbiAgc2VsZWN0TGFiZWwuc2V0QXR0cmlidXRlKFwiaWRcIiwgbGlzdElkTGFiZWwpO1xuICBzZWxlY3RFbC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWhpZGRlblwiLCBcInRydWVcIik7XG4gIHNlbGVjdEVsLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIFwiLTFcIik7XG4gIHNlbGVjdEVsLmNsYXNzTGlzdC5hZGQoXCJ1c2Etc3Itb25seVwiLCBTRUxFQ1RfQ0xBU1MpO1xuICBzZWxlY3RFbC5pZCA9IFwiXCI7XG4gIHNlbGVjdEVsLnZhbHVlID0gXCJcIjtcblxuICBbXCJyZXF1aXJlZFwiLCBcImFyaWEtbGFiZWxcIiwgXCJhcmlhLWxhYmVsbGVkYnlcIl0uZm9yRWFjaCgobmFtZSkgPT4ge1xuICAgIGlmIChzZWxlY3RFbC5oYXNBdHRyaWJ1dGUobmFtZSkpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gc2VsZWN0RWwuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICAgICAgYWRkaXRpb25hbEF0dHJpYnV0ZXMucHVzaCh7IFtuYW1lXTogdmFsdWUgfSk7XG4gICAgICBzZWxlY3RFbC5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gICAgfVxuICB9KTtcblxuICAvLyBzYW5pdGl6ZSBkb2Vzbid0IGxpa2UgZnVuY3Rpb25zIGluIHRlbXBsYXRlIGxpdGVyYWxzXG4gIGNvbnN0IGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlucHV0XCIpO1xuICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBzZWxlY3RJZCk7XG4gIGlucHV0LnNldEF0dHJpYnV0ZShcImFyaWEtb3duc1wiLCBsaXN0SWQpO1xuICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWNvbnRyb2xzXCIsIGxpc3RJZCk7XG4gIGlucHV0LnNldEF0dHJpYnV0ZShcImFyaWEtYXV0b2NvbXBsZXRlXCIsIFwibGlzdFwiKTtcbiAgaW5wdXQuc2V0QXR0cmlidXRlKFwiYXJpYS1kZXNjcmliZWRieVwiLCBhc3Npc3RpdmVIaW50SUQpO1xuICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWV4cGFuZGVkXCIsIFwiZmFsc2VcIik7XG4gIGlucHV0LnNldEF0dHJpYnV0ZShcImF1dG9jYXBpdGFsaXplXCIsIFwib2ZmXCIpO1xuICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJhdXRvY29tcGxldGVcIiwgXCJvZmZcIik7XG4gIGlucHV0LnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIElOUFVUX0NMQVNTKTtcbiAgaW5wdXQuc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcInRleHRcIik7XG4gIGlucHV0LnNldEF0dHJpYnV0ZShcInJvbGVcIiwgXCJjb21ib2JveFwiKTtcbiAgYWRkaXRpb25hbEF0dHJpYnV0ZXMuZm9yRWFjaCgoYXR0cikgPT5cbiAgICBPYmplY3Qua2V5cyhhdHRyKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIGNvbnN0IHZhbHVlID0gU2FuaXRpemVyLmVzY2FwZUhUTUxgJHthdHRyW2tleV19YDtcbiAgICAgIGlucHV0LnNldEF0dHJpYnV0ZShrZXksIHZhbHVlKTtcbiAgICB9KVxuICApO1xuXG4gIGNvbWJvQm94RWwuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIGlucHV0KTtcblxuICBjb21ib0JveEVsLmluc2VydEFkamFjZW50SFRNTChcbiAgICBcImJlZm9yZWVuZFwiLFxuICAgIFNhbml0aXplci5lc2NhcGVIVE1MYFxuICAgIDxzcGFuIGNsYXNzPVwiJHtDTEVBUl9JTlBVVF9CVVRUT05fV1JBUFBFUl9DTEFTU31cIiB0YWJpbmRleD1cIi0xXCI+XG4gICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiJHtDTEVBUl9JTlBVVF9CVVRUT05fQ0xBU1N9XCIgYXJpYS1sYWJlbD1cIkNsZWFyIHRoZSBzZWxlY3QgY29udGVudHNcIj4mbmJzcDs8L2J1dHRvbj5cbiAgICAgIDwvc3Bhbj5cbiAgICAgIDxzcGFuIGNsYXNzPVwiJHtJTlBVVF9CVVRUT05fU0VQQVJBVE9SX0NMQVNTfVwiPiZuYnNwOzwvc3Bhbj5cbiAgICAgIDxzcGFuIGNsYXNzPVwiJHtUT0dHTEVfTElTVF9CVVRUT05fV1JBUFBFUl9DTEFTU31cIiB0YWJpbmRleD1cIi0xXCI+XG4gICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIHRhYmluZGV4PVwiLTFcIiBjbGFzcz1cIiR7VE9HR0xFX0xJU1RfQlVUVE9OX0NMQVNTfVwiIGFyaWEtbGFiZWw9XCJUb2dnbGUgdGhlIGRyb3Bkb3duIGxpc3RcIj4mbmJzcDs8L2J1dHRvbj5cbiAgICAgIDwvc3Bhbj5cbiAgICAgIDx1bFxuICAgICAgICB0YWJpbmRleD1cIi0xXCJcbiAgICAgICAgaWQ9XCIke2xpc3RJZH1cIlxuICAgICAgICBjbGFzcz1cIiR7TElTVF9DTEFTU31cIlxuICAgICAgICByb2xlPVwibGlzdGJveFwiXG4gICAgICAgIGFyaWEtbGFiZWxsZWRieT1cIiR7bGlzdElkTGFiZWx9XCJcbiAgICAgICAgaGlkZGVuPlxuICAgICAgPC91bD5cbiAgICAgIDxkaXYgY2xhc3M9XCIke1NUQVRVU19DTEFTU30gdXNhLXNyLW9ubHlcIiByb2xlPVwic3RhdHVzXCI+PC9kaXY+XG4gICAgICA8c3BhbiBpZD1cIiR7YXNzaXN0aXZlSGludElEfVwiIGNsYXNzPVwidXNhLXNyLW9ubHlcIj5cbiAgICAgICAgV2hlbiBhdXRvY29tcGxldGUgcmVzdWx0cyBhcmUgYXZhaWxhYmxlIHVzZSB1cCBhbmQgZG93biBhcnJvd3MgdG8gcmV2aWV3IGFuZCBlbnRlciB0byBzZWxlY3QuXG4gICAgICAgIFRvdWNoIGRldmljZSB1c2VycywgZXhwbG9yZSBieSB0b3VjaCBvciB3aXRoIHN3aXBlIGdlc3R1cmVzLlxuICAgICAgPC9zcGFuPmBcbiAgKTtcblxuICBpZiAoc2VsZWN0ZWRPcHRpb24pIHtcbiAgICBjb25zdCB7IGlucHV0RWwgfSA9IGdldENvbWJvQm94Q29udGV4dChjb21ib0JveEVsKTtcbiAgICBjaGFuZ2VFbGVtZW50VmFsdWUoc2VsZWN0RWwsIHNlbGVjdGVkT3B0aW9uLnZhbHVlKTtcbiAgICBjaGFuZ2VFbGVtZW50VmFsdWUoaW5wdXRFbCwgc2VsZWN0ZWRPcHRpb24udGV4dCk7XG4gICAgY29tYm9Cb3hFbC5jbGFzc0xpc3QuYWRkKENPTUJPX0JPWF9QUklTVElORV9DTEFTUyk7XG4gIH1cblxuICBpZiAoc2VsZWN0RWwuZGlzYWJsZWQpIHtcbiAgICBkaXNhYmxlKGNvbWJvQm94RWwpO1xuICAgIHNlbGVjdEVsLmRpc2FibGVkID0gZmFsc2U7XG4gIH1cblxuICBjb21ib0JveEVsLmRhdGFzZXQuZW5oYW5jZWQgPSBcInRydWVcIjtcbn07XG5cbi8qKlxuICogTWFuYWdlIHRoZSBmb2N1c2VkIGVsZW1lbnQgd2l0aGluIHRoZSBsaXN0IG9wdGlvbnMgd2hlblxuICogbmF2aWdhdGluZyB2aWEga2V5Ym9hcmQuXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgQW4gYW5jaG9yIGVsZW1lbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50XG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBuZXh0RWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIG9wdGlvbnNcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy5za2lwRm9jdXMgc2tpcCBmb2N1cyBvZiBoaWdobGlnaHRlZCBpdGVtXG4gKiBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbnMucHJldmVudFNjcm9sbCBzaG91bGQgc2tpcCBwcm9jZWR1cmUgdG8gc2Nyb2xsIHRvIGVsZW1lbnRcbiAqL1xuY29uc3QgaGlnaGxpZ2h0T3B0aW9uID0gKGVsLCBuZXh0RWwsIHsgc2tpcEZvY3VzLCBwcmV2ZW50U2Nyb2xsIH0gPSB7fSkgPT4ge1xuICBjb25zdCB7IGlucHV0RWwsIGxpc3RFbCwgZm9jdXNlZE9wdGlvbkVsIH0gPSBnZXRDb21ib0JveENvbnRleHQoZWwpO1xuXG4gIGlmIChmb2N1c2VkT3B0aW9uRWwpIHtcbiAgICBmb2N1c2VkT3B0aW9uRWwuY2xhc3NMaXN0LnJlbW92ZShMSVNUX09QVElPTl9GT0NVU0VEX0NMQVNTKTtcbiAgICBmb2N1c2VkT3B0aW9uRWwuc2V0QXR0cmlidXRlKFwidGFiSW5kZXhcIiwgXCItMVwiKTtcbiAgfVxuXG4gIGlmIChuZXh0RWwpIHtcbiAgICBpbnB1dEVsLnNldEF0dHJpYnV0ZShcImFyaWEtYWN0aXZlZGVzY2VuZGFudFwiLCBuZXh0RWwuaWQpO1xuICAgIG5leHRFbC5zZXRBdHRyaWJ1dGUoXCJ0YWJJbmRleFwiLCBcIjBcIik7XG4gICAgbmV4dEVsLmNsYXNzTGlzdC5hZGQoTElTVF9PUFRJT05fRk9DVVNFRF9DTEFTUyk7XG5cbiAgICBpZiAoIXByZXZlbnRTY3JvbGwpIHtcbiAgICAgIGNvbnN0IG9wdGlvbkJvdHRvbSA9IG5leHRFbC5vZmZzZXRUb3AgKyBuZXh0RWwub2Zmc2V0SGVpZ2h0O1xuICAgICAgY29uc3QgY3VycmVudEJvdHRvbSA9IGxpc3RFbC5zY3JvbGxUb3AgKyBsaXN0RWwub2Zmc2V0SGVpZ2h0O1xuXG4gICAgICBpZiAob3B0aW9uQm90dG9tID4gY3VycmVudEJvdHRvbSkge1xuICAgICAgICBsaXN0RWwuc2Nyb2xsVG9wID0gb3B0aW9uQm90dG9tIC0gbGlzdEVsLm9mZnNldEhlaWdodDtcbiAgICAgIH1cblxuICAgICAgaWYgKG5leHRFbC5vZmZzZXRUb3AgPCBsaXN0RWwuc2Nyb2xsVG9wKSB7XG4gICAgICAgIGxpc3RFbC5zY3JvbGxUb3AgPSBuZXh0RWwub2Zmc2V0VG9wO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghc2tpcEZvY3VzKSB7XG4gICAgICBuZXh0RWwuZm9jdXMoeyBwcmV2ZW50U2Nyb2xsIH0pO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpbnB1dEVsLnNldEF0dHJpYnV0ZShcImFyaWEtYWN0aXZlZGVzY2VuZGFudFwiLCBcIlwiKTtcbiAgICBpbnB1dEVsLmZvY3VzKCk7XG4gIH1cbn07XG5cbi8qKlxuICogR2VuZXJhdGUgYSBkeW5hbWljIHJlZ3VsYXIgZXhwcmVzc2lvbiBiYXNlZCBvZmYgb2YgYSByZXBsYWNlYWJsZSBhbmQgcG9zc2libHkgZmlsdGVyZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50XG4gKiBAcGFyYW0ge3N0cmluZ30gcXVlcnkgVGhlIHZhbHVlIHRvIHVzZSBpbiB0aGUgcmVndWxhciBleHByZXNzaW9uXG4gKiBAcGFyYW0ge29iamVjdH0gZXh0cmFzIEFuIG9iamVjdCBvZiByZWd1bGFyIGV4cHJlc3Npb25zIHRvIHJlcGxhY2UgYW5kIGZpbHRlciB0aGUgcXVlcnlcbiAqL1xuY29uc3QgZ2VuZXJhdGVEeW5hbWljUmVnRXhwID0gKGZpbHRlciwgcXVlcnkgPSBcIlwiLCBleHRyYXMgPSB7fSkgPT4ge1xuICBjb25zdCBlc2NhcGVSZWdFeHAgPSAodGV4dCkgPT5cbiAgICB0ZXh0LnJlcGxhY2UoL1stW1xcXXt9KCkqKz8uLFxcXFxeJHwjXFxzXS9nLCBcIlxcXFwkJlwiKTtcblxuICBsZXQgZmluZCA9IGZpbHRlci5yZXBsYWNlKC97eyguKj8pfX0vZywgKG0sICQxKSA9PiB7XG4gICAgY29uc3Qga2V5ID0gJDEudHJpbSgpO1xuICAgIGNvbnN0IHF1ZXJ5RmlsdGVyID0gZXh0cmFzW2tleV07XG4gICAgaWYgKGtleSAhPT0gXCJxdWVyeVwiICYmIHF1ZXJ5RmlsdGVyKSB7XG4gICAgICBjb25zdCBtYXRjaGVyID0gbmV3IFJlZ0V4cChxdWVyeUZpbHRlciwgXCJpXCIpO1xuICAgICAgY29uc3QgbWF0Y2hlcyA9IHF1ZXJ5Lm1hdGNoKG1hdGNoZXIpO1xuXG4gICAgICBpZiAobWF0Y2hlcykge1xuICAgICAgICByZXR1cm4gZXNjYXBlUmVnRXhwKG1hdGNoZXNbMV0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgcmV0dXJuIGVzY2FwZVJlZ0V4cChxdWVyeSk7XG4gIH0pO1xuXG4gIGZpbmQgPSBgXig/OiR7ZmluZH0pJGA7XG5cbiAgcmV0dXJuIG5ldyBSZWdFeHAoZmluZCwgXCJpXCIpO1xufTtcblxuLyoqXG4gKiBEaXNwbGF5IHRoZSBvcHRpb24gbGlzdCBvZiBhIGNvbWJvIGJveCBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcbiAqL1xuY29uc3QgZGlzcGxheUxpc3QgPSAoZWwpID0+IHtcbiAgY29uc3Qge1xuICAgIGNvbWJvQm94RWwsXG4gICAgc2VsZWN0RWwsXG4gICAgaW5wdXRFbCxcbiAgICBsaXN0RWwsXG4gICAgc3RhdHVzRWwsXG4gICAgaXNQcmlzdGluZSxcbiAgICBkaXNhYmxlRmlsdGVyaW5nLFxuICB9ID0gZ2V0Q29tYm9Cb3hDb250ZXh0KGVsKTtcbiAgbGV0IHNlbGVjdGVkSXRlbUlkO1xuICBsZXQgZmlyc3RGb3VuZElkO1xuXG4gIGNvbnN0IGxpc3RPcHRpb25CYXNlSWQgPSBgJHtsaXN0RWwuaWR9LS1vcHRpb24tYDtcblxuICBjb25zdCBpbnB1dFZhbHVlID0gKGlucHV0RWwudmFsdWUgfHwgXCJcIikudG9Mb3dlckNhc2UoKTtcbiAgY29uc3QgZmlsdGVyID0gY29tYm9Cb3hFbC5kYXRhc2V0LmZpbHRlciB8fCBERUZBVUxUX0ZJTFRFUjtcbiAgY29uc3QgcmVnZXggPSBnZW5lcmF0ZUR5bmFtaWNSZWdFeHAoZmlsdGVyLCBpbnB1dFZhbHVlLCBjb21ib0JveEVsLmRhdGFzZXQpO1xuXG4gIGNvbnN0IG9wdGlvbnMgPSBbXTtcbiAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHNlbGVjdEVsLm9wdGlvbnMubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICBjb25zdCBvcHRpb25FbCA9IHNlbGVjdEVsLm9wdGlvbnNbaV07XG4gICAgY29uc3Qgb3B0aW9uSWQgPSBgJHtsaXN0T3B0aW9uQmFzZUlkfSR7b3B0aW9ucy5sZW5ndGh9YDtcblxuICAgIGlmIChcbiAgICAgIG9wdGlvbkVsLnZhbHVlICYmXG4gICAgICAoZGlzYWJsZUZpbHRlcmluZyB8fFxuICAgICAgICBpc1ByaXN0aW5lIHx8XG4gICAgICAgICFpbnB1dFZhbHVlIHx8XG4gICAgICAgIHJlZ2V4LnRlc3Qob3B0aW9uRWwudGV4dCkpXG4gICAgKSB7XG4gICAgICBpZiAoc2VsZWN0RWwudmFsdWUgJiYgb3B0aW9uRWwudmFsdWUgPT09IHNlbGVjdEVsLnZhbHVlKSB7XG4gICAgICAgIHNlbGVjdGVkSXRlbUlkID0gb3B0aW9uSWQ7XG4gICAgICB9XG5cbiAgICAgIGlmIChkaXNhYmxlRmlsdGVyaW5nICYmICFmaXJzdEZvdW5kSWQgJiYgcmVnZXgudGVzdChvcHRpb25FbC50ZXh0KSkge1xuICAgICAgICBmaXJzdEZvdW5kSWQgPSBvcHRpb25JZDtcbiAgICAgIH1cbiAgICAgIG9wdGlvbnMucHVzaChvcHRpb25FbCk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgbnVtT3B0aW9ucyA9IG9wdGlvbnMubGVuZ3RoO1xuICBjb25zdCBvcHRpb25IdG1sID0gb3B0aW9ucy5tYXAoKG9wdGlvbiwgaW5kZXgpID0+IHtcbiAgICBjb25zdCBvcHRpb25JZCA9IGAke2xpc3RPcHRpb25CYXNlSWR9JHtpbmRleH1gO1xuICAgIGNvbnN0IGNsYXNzZXMgPSBbTElTVF9PUFRJT05fQ0xBU1NdO1xuICAgIGxldCB0YWJpbmRleCA9IFwiLTFcIjtcbiAgICBsZXQgYXJpYVNlbGVjdGVkID0gXCJmYWxzZVwiO1xuXG4gICAgaWYgKG9wdGlvbklkID09PSBzZWxlY3RlZEl0ZW1JZCkge1xuICAgICAgY2xhc3Nlcy5wdXNoKExJU1RfT1BUSU9OX1NFTEVDVEVEX0NMQVNTLCBMSVNUX09QVElPTl9GT0NVU0VEX0NMQVNTKTtcbiAgICAgIHRhYmluZGV4ID0gXCIwXCI7XG4gICAgICBhcmlhU2VsZWN0ZWQgPSBcInRydWVcIjtcbiAgICB9XG5cbiAgICBpZiAoIXNlbGVjdGVkSXRlbUlkICYmIGluZGV4ID09PSAwKSB7XG4gICAgICBjbGFzc2VzLnB1c2goTElTVF9PUFRJT05fRk9DVVNFRF9DTEFTUyk7XG4gICAgICB0YWJpbmRleCA9IFwiMFwiO1xuICAgIH1cblxuICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuXG4gICAgbGkuc2V0QXR0cmlidXRlKFwiYXJpYS1zZXRzaXplXCIsIG9wdGlvbnMubGVuZ3RoKTtcbiAgICBsaS5zZXRBdHRyaWJ1dGUoXCJhcmlhLXBvc2luc2V0XCIsIGluZGV4ICsgMSk7XG4gICAgbGkuc2V0QXR0cmlidXRlKFwiYXJpYS1zZWxlY3RlZFwiLCBhcmlhU2VsZWN0ZWQpO1xuICAgIGxpLnNldEF0dHJpYnV0ZShcImlkXCIsIG9wdGlvbklkKTtcbiAgICBsaS5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBjbGFzc2VzLmpvaW4oXCIgXCIpKTtcbiAgICBsaS5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCB0YWJpbmRleCk7XG4gICAgbGkuc2V0QXR0cmlidXRlKFwicm9sZVwiLCBcIm9wdGlvblwiKTtcbiAgICBsaS5zZXRBdHRyaWJ1dGUoXCJkYXRhLXZhbHVlXCIsIG9wdGlvbi52YWx1ZSk7XG4gICAgbGkudGV4dENvbnRlbnQgPSBvcHRpb24udGV4dDtcblxuICAgIHJldHVybiBsaTtcbiAgfSk7XG5cbiAgY29uc3Qgbm9SZXN1bHRzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuICBub1Jlc3VsdHMuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgYCR7TElTVF9PUFRJT05fQ0xBU1N9LS1uby1yZXN1bHRzYCk7XG4gIG5vUmVzdWx0cy50ZXh0Q29udGVudCA9IFwiTm8gcmVzdWx0cyBmb3VuZFwiO1xuXG4gIGxpc3RFbC5oaWRkZW4gPSBmYWxzZTtcblxuICBpZiAobnVtT3B0aW9ucykge1xuICAgIGxpc3RFbC5pbm5lckhUTUwgPSBcIlwiO1xuICAgIG9wdGlvbkh0bWwuZm9yRWFjaCgoaXRlbSkgPT5cbiAgICAgIGxpc3RFbC5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJiZWZvcmVlbmRcIiwgaXRlbSlcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIGxpc3RFbC5pbm5lckhUTUwgPSBcIlwiO1xuICAgIGxpc3RFbC5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJiZWZvcmVlbmRcIiwgbm9SZXN1bHRzKTtcbiAgfVxuXG4gIGlucHV0RWwuc2V0QXR0cmlidXRlKFwiYXJpYS1leHBhbmRlZFwiLCBcInRydWVcIik7XG5cbiAgc3RhdHVzRWwudGV4dENvbnRlbnQgPSBudW1PcHRpb25zXG4gICAgPyBgJHtudW1PcHRpb25zfSByZXN1bHQke251bU9wdGlvbnMgPiAxID8gXCJzXCIgOiBcIlwifSBhdmFpbGFibGUuYFxuICAgIDogXCJObyByZXN1bHRzLlwiO1xuXG4gIGxldCBpdGVtVG9Gb2N1cztcblxuICBpZiAoaXNQcmlzdGluZSAmJiBzZWxlY3RlZEl0ZW1JZCkge1xuICAgIGl0ZW1Ub0ZvY3VzID0gbGlzdEVsLnF1ZXJ5U2VsZWN0b3IoYCMke3NlbGVjdGVkSXRlbUlkfWApO1xuICB9IGVsc2UgaWYgKGRpc2FibGVGaWx0ZXJpbmcgJiYgZmlyc3RGb3VuZElkKSB7XG4gICAgaXRlbVRvRm9jdXMgPSBsaXN0RWwucXVlcnlTZWxlY3RvcihgIyR7Zmlyc3RGb3VuZElkfWApO1xuICB9XG5cbiAgaWYgKGl0ZW1Ub0ZvY3VzKSB7XG4gICAgaGlnaGxpZ2h0T3B0aW9uKGxpc3RFbCwgaXRlbVRvRm9jdXMsIHtcbiAgICAgIHNraXBGb2N1czogdHJ1ZSxcbiAgICB9KTtcbiAgfVxufTtcblxuLyoqXG4gKiBIaWRlIHRoZSBvcHRpb24gbGlzdCBvZiBhIGNvbWJvIGJveCBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcbiAqL1xuY29uc3QgaGlkZUxpc3QgPSAoZWwpID0+IHtcbiAgY29uc3QgeyBpbnB1dEVsLCBsaXN0RWwsIHN0YXR1c0VsLCBmb2N1c2VkT3B0aW9uRWwgfSA9IGdldENvbWJvQm94Q29udGV4dChlbCk7XG5cbiAgc3RhdHVzRWwuaW5uZXJIVE1MID0gXCJcIjtcblxuICBpbnB1dEVsLnNldEF0dHJpYnV0ZShcImFyaWEtZXhwYW5kZWRcIiwgXCJmYWxzZVwiKTtcbiAgaW5wdXRFbC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWFjdGl2ZWRlc2NlbmRhbnRcIiwgXCJcIik7XG5cbiAgaWYgKGZvY3VzZWRPcHRpb25FbCkge1xuICAgIGZvY3VzZWRPcHRpb25FbC5jbGFzc0xpc3QucmVtb3ZlKExJU1RfT1BUSU9OX0ZPQ1VTRURfQ0xBU1MpO1xuICB9XG5cbiAgbGlzdEVsLnNjcm9sbFRvcCA9IDA7XG4gIGxpc3RFbC5oaWRkZW4gPSB0cnVlO1xufTtcblxuLyoqXG4gKiBTZWxlY3QgYW4gb3B0aW9uIGxpc3Qgb2YgdGhlIGNvbWJvIGJveCBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gbGlzdE9wdGlvbkVsIFRoZSBsaXN0IG9wdGlvbiBiZWluZyBzZWxlY3RlZFxuICovXG5jb25zdCBzZWxlY3RJdGVtID0gKGxpc3RPcHRpb25FbCkgPT4ge1xuICBjb25zdCB7IGNvbWJvQm94RWwsIHNlbGVjdEVsLCBpbnB1dEVsIH0gPSBnZXRDb21ib0JveENvbnRleHQobGlzdE9wdGlvbkVsKTtcblxuICBjaGFuZ2VFbGVtZW50VmFsdWUoc2VsZWN0RWwsIGxpc3RPcHRpb25FbC5kYXRhc2V0LnZhbHVlKTtcbiAgY2hhbmdlRWxlbWVudFZhbHVlKGlucHV0RWwsIGxpc3RPcHRpb25FbC50ZXh0Q29udGVudCk7XG4gIGNvbWJvQm94RWwuY2xhc3NMaXN0LmFkZChDT01CT19CT1hfUFJJU1RJTkVfQ0xBU1MpO1xuICBoaWRlTGlzdChjb21ib0JveEVsKTtcbiAgaW5wdXRFbC5mb2N1cygpO1xufTtcblxuLyoqXG4gKiBDbGVhciB0aGUgaW5wdXQgb2YgdGhlIGNvbWJvIGJveFxuICpcbiAqIEBwYXJhbSB7SFRNTEJ1dHRvbkVsZW1lbnR9IGNsZWFyQnV0dG9uRWwgVGhlIGNsZWFyIGlucHV0IGJ1dHRvblxuICovXG5jb25zdCBjbGVhcklucHV0ID0gKGNsZWFyQnV0dG9uRWwpID0+IHtcbiAgY29uc3QgeyBjb21ib0JveEVsLCBsaXN0RWwsIHNlbGVjdEVsLCBpbnB1dEVsIH0gPVxuICAgIGdldENvbWJvQm94Q29udGV4dChjbGVhckJ1dHRvbkVsKTtcbiAgY29uc3QgbGlzdFNob3duID0gIWxpc3RFbC5oaWRkZW47XG5cbiAgaWYgKHNlbGVjdEVsLnZhbHVlKSBjaGFuZ2VFbGVtZW50VmFsdWUoc2VsZWN0RWwpO1xuICBpZiAoaW5wdXRFbC52YWx1ZSkgY2hhbmdlRWxlbWVudFZhbHVlKGlucHV0RWwpO1xuICBjb21ib0JveEVsLmNsYXNzTGlzdC5yZW1vdmUoQ09NQk9fQk9YX1BSSVNUSU5FX0NMQVNTKTtcblxuICBpZiAobGlzdFNob3duKSBkaXNwbGF5TGlzdChjb21ib0JveEVsKTtcbiAgaW5wdXRFbC5mb2N1cygpO1xufTtcblxuLyoqXG4gKiBSZXNldCB0aGUgc2VsZWN0IGJhc2VkIG9mZiBvZiBjdXJyZW50bHkgc2V0IHNlbGVjdCB2YWx1ZVxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50XG4gKi9cbmNvbnN0IHJlc2V0U2VsZWN0aW9uID0gKGVsKSA9PiB7XG4gIGNvbnN0IHsgY29tYm9Cb3hFbCwgc2VsZWN0RWwsIGlucHV0RWwgfSA9IGdldENvbWJvQm94Q29udGV4dChlbCk7XG5cbiAgY29uc3Qgc2VsZWN0VmFsdWUgPSBzZWxlY3RFbC52YWx1ZTtcbiAgY29uc3QgaW5wdXRWYWx1ZSA9IChpbnB1dEVsLnZhbHVlIHx8IFwiXCIpLnRvTG93ZXJDYXNlKCk7XG5cbiAgaWYgKHNlbGVjdFZhbHVlKSB7XG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHNlbGVjdEVsLm9wdGlvbnMubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgIGNvbnN0IG9wdGlvbkVsID0gc2VsZWN0RWwub3B0aW9uc1tpXTtcbiAgICAgIGlmIChvcHRpb25FbC52YWx1ZSA9PT0gc2VsZWN0VmFsdWUpIHtcbiAgICAgICAgaWYgKGlucHV0VmFsdWUgIT09IG9wdGlvbkVsLnRleHQpIHtcbiAgICAgICAgICBjaGFuZ2VFbGVtZW50VmFsdWUoaW5wdXRFbCwgb3B0aW9uRWwudGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgY29tYm9Cb3hFbC5jbGFzc0xpc3QuYWRkKENPTUJPX0JPWF9QUklTVElORV9DTEFTUyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoaW5wdXRWYWx1ZSkge1xuICAgIGNoYW5nZUVsZW1lbnRWYWx1ZShpbnB1dEVsKTtcbiAgfVxufTtcblxuLyoqXG4gKiBTZWxlY3QgYW4gb3B0aW9uIGxpc3Qgb2YgdGhlIGNvbWJvIGJveCBjb21wb25lbnQgYmFzZWQgb2ZmIG9mXG4gKiBoYXZpbmcgYSBjdXJyZW50IGZvY3VzZWQgbGlzdCBvcHRpb24gb3JcbiAqIGhhdmluZyB0ZXN0IHRoYXQgY29tcGxldGVseSBtYXRjaGVzIGEgbGlzdCBvcHRpb24uXG4gKiBPdGhlcndpc2UgaXQgY2xlYXJzIHRoZSBpbnB1dCBhbmQgc2VsZWN0LlxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50XG4gKi9cbmNvbnN0IGNvbXBsZXRlU2VsZWN0aW9uID0gKGVsKSA9PiB7XG4gIGNvbnN0IHsgY29tYm9Cb3hFbCwgc2VsZWN0RWwsIGlucHV0RWwsIHN0YXR1c0VsIH0gPSBnZXRDb21ib0JveENvbnRleHQoZWwpO1xuXG4gIHN0YXR1c0VsLnRleHRDb250ZW50ID0gXCJcIjtcblxuICBjb25zdCBpbnB1dFZhbHVlID0gKGlucHV0RWwudmFsdWUgfHwgXCJcIikudG9Mb3dlckNhc2UoKTtcblxuICBpZiAoaW5wdXRWYWx1ZSkge1xuICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSBzZWxlY3RFbC5vcHRpb25zLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICBjb25zdCBvcHRpb25FbCA9IHNlbGVjdEVsLm9wdGlvbnNbaV07XG4gICAgICBpZiAob3B0aW9uRWwudGV4dC50b0xvd2VyQ2FzZSgpID09PSBpbnB1dFZhbHVlKSB7XG4gICAgICAgIGNoYW5nZUVsZW1lbnRWYWx1ZShzZWxlY3RFbCwgb3B0aW9uRWwudmFsdWUpO1xuICAgICAgICBjaGFuZ2VFbGVtZW50VmFsdWUoaW5wdXRFbCwgb3B0aW9uRWwudGV4dCk7XG4gICAgICAgIGNvbWJvQm94RWwuY2xhc3NMaXN0LmFkZChDT01CT19CT1hfUFJJU1RJTkVfQ0xBU1MpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmVzZXRTZWxlY3Rpb24oY29tYm9Cb3hFbCk7XG59O1xuXG4vKipcbiAqIEhhbmRsZSB0aGUgZXNjYXBlIGV2ZW50IHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IEFuIGV2ZW50IHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudFxuICovXG5jb25zdCBoYW5kbGVFc2NhcGUgPSAoZXZlbnQpID0+IHtcbiAgY29uc3QgeyBjb21ib0JveEVsLCBpbnB1dEVsIH0gPSBnZXRDb21ib0JveENvbnRleHQoZXZlbnQudGFyZ2V0KTtcblxuICBoaWRlTGlzdChjb21ib0JveEVsKTtcbiAgcmVzZXRTZWxlY3Rpb24oY29tYm9Cb3hFbCk7XG4gIGlucHV0RWwuZm9jdXMoKTtcbn07XG5cbi8qKlxuICogSGFuZGxlIHRoZSBkb3duIGV2ZW50IHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IEFuIGV2ZW50IHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudFxuICovXG5jb25zdCBoYW5kbGVEb3duRnJvbUlucHV0ID0gKGV2ZW50KSA9PiB7XG4gIGNvbnN0IHsgY29tYm9Cb3hFbCwgbGlzdEVsIH0gPSBnZXRDb21ib0JveENvbnRleHQoZXZlbnQudGFyZ2V0KTtcblxuICBpZiAobGlzdEVsLmhpZGRlbikge1xuICAgIGRpc3BsYXlMaXN0KGNvbWJvQm94RWwpO1xuICB9XG5cbiAgY29uc3QgbmV4dE9wdGlvbkVsID1cbiAgICBsaXN0RWwucXVlcnlTZWxlY3RvcihMSVNUX09QVElPTl9GT0NVU0VEKSB8fFxuICAgIGxpc3RFbC5xdWVyeVNlbGVjdG9yKExJU1RfT1BUSU9OKTtcblxuICBpZiAobmV4dE9wdGlvbkVsKSB7XG4gICAgaGlnaGxpZ2h0T3B0aW9uKGNvbWJvQm94RWwsIG5leHRPcHRpb25FbCk7XG4gIH1cblxuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xufTtcblxuLyoqXG4gKiBIYW5kbGUgdGhlIGVudGVyIGV2ZW50IGZyb20gYW4gaW5wdXQgZWxlbWVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCBBbiBldmVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcbiAqL1xuY29uc3QgaGFuZGxlRW50ZXJGcm9tSW5wdXQgPSAoZXZlbnQpID0+IHtcbiAgY29uc3QgeyBjb21ib0JveEVsLCBsaXN0RWwgfSA9IGdldENvbWJvQm94Q29udGV4dChldmVudC50YXJnZXQpO1xuICBjb25zdCBsaXN0U2hvd24gPSAhbGlzdEVsLmhpZGRlbjtcblxuICBjb21wbGV0ZVNlbGVjdGlvbihjb21ib0JveEVsKTtcblxuICBpZiAobGlzdFNob3duKSB7XG4gICAgaGlkZUxpc3QoY29tYm9Cb3hFbCk7XG4gIH1cblxuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xufTtcblxuLyoqXG4gKiBIYW5kbGUgdGhlIGRvd24gZXZlbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgQW4gZXZlbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50XG4gKi9cbmNvbnN0IGhhbmRsZURvd25Gcm9tTGlzdE9wdGlvbiA9IChldmVudCkgPT4ge1xuICBjb25zdCBmb2N1c2VkT3B0aW9uRWwgPSBldmVudC50YXJnZXQ7XG4gIGNvbnN0IG5leHRPcHRpb25FbCA9IGZvY3VzZWRPcHRpb25FbC5uZXh0U2libGluZztcblxuICBpZiAobmV4dE9wdGlvbkVsKSB7XG4gICAgaGlnaGxpZ2h0T3B0aW9uKGZvY3VzZWRPcHRpb25FbCwgbmV4dE9wdGlvbkVsKTtcbiAgfVxuXG4gIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG59O1xuXG4vKipcbiAqIEhhbmRsZSB0aGUgdGFiIGV2ZW50IGZyb20gYW4gbGlzdCBvcHRpb24gZWxlbWVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCBBbiBldmVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcbiAqL1xuY29uc3QgaGFuZGxlVGFiRnJvbUxpc3RPcHRpb24gPSAoZXZlbnQpID0+IHtcbiAgc2VsZWN0SXRlbShldmVudC50YXJnZXQpO1xuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xufTtcblxuLyoqXG4gKiBIYW5kbGUgdGhlIGVudGVyIGV2ZW50IGZyb20gbGlzdCBvcHRpb24gd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgQW4gZXZlbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50XG4gKi9cbmNvbnN0IGhhbmRsZUVudGVyRnJvbUxpc3RPcHRpb24gPSAoZXZlbnQpID0+IHtcbiAgc2VsZWN0SXRlbShldmVudC50YXJnZXQpO1xuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xufTtcblxuLyoqXG4gKiBIYW5kbGUgdGhlIHVwIGV2ZW50IGZyb20gbGlzdCBvcHRpb24gd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgQW4gZXZlbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50XG4gKi9cbmNvbnN0IGhhbmRsZVVwRnJvbUxpc3RPcHRpb24gPSAoZXZlbnQpID0+IHtcbiAgY29uc3QgeyBjb21ib0JveEVsLCBsaXN0RWwsIGZvY3VzZWRPcHRpb25FbCB9ID0gZ2V0Q29tYm9Cb3hDb250ZXh0KFxuICAgIGV2ZW50LnRhcmdldFxuICApO1xuICBjb25zdCBuZXh0T3B0aW9uRWwgPSBmb2N1c2VkT3B0aW9uRWwgJiYgZm9jdXNlZE9wdGlvbkVsLnByZXZpb3VzU2libGluZztcbiAgY29uc3QgbGlzdFNob3duID0gIWxpc3RFbC5oaWRkZW47XG5cbiAgaGlnaGxpZ2h0T3B0aW9uKGNvbWJvQm94RWwsIG5leHRPcHRpb25FbCk7XG5cbiAgaWYgKGxpc3RTaG93bikge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gIH1cblxuICBpZiAoIW5leHRPcHRpb25FbCkge1xuICAgIGhpZGVMaXN0KGNvbWJvQm94RWwpO1xuICB9XG59O1xuXG4vKipcbiAqIFNlbGVjdCBsaXN0IG9wdGlvbiBvbiB0aGUgbW91c2VvdmVyIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgVGhlIG1vdXNlb3ZlciBldmVudFxuICogQHBhcmFtIHtIVE1MTElFbGVtZW50fSBsaXN0T3B0aW9uRWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcbiAqL1xuY29uc3QgaGFuZGxlTW91c2VvdmVyID0gKGxpc3RPcHRpb25FbCkgPT4ge1xuICBjb25zdCBpc0N1cnJlbnRseUZvY3VzZWQgPSBsaXN0T3B0aW9uRWwuY2xhc3NMaXN0LmNvbnRhaW5zKFxuICAgIExJU1RfT1BUSU9OX0ZPQ1VTRURfQ0xBU1NcbiAgKTtcblxuICBpZiAoaXNDdXJyZW50bHlGb2N1c2VkKSByZXR1cm47XG5cbiAgaGlnaGxpZ2h0T3B0aW9uKGxpc3RPcHRpb25FbCwgbGlzdE9wdGlvbkVsLCB7XG4gICAgcHJldmVudFNjcm9sbDogdHJ1ZSxcbiAgfSk7XG59O1xuXG4vKipcbiAqIFRvZ2dsZSB0aGUgbGlzdCB3aGVuIHRoZSBidXR0b24gaXMgY2xpY2tlZFxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50XG4gKi9cbmNvbnN0IHRvZ2dsZUxpc3QgPSAoZWwpID0+IHtcbiAgY29uc3QgeyBjb21ib0JveEVsLCBsaXN0RWwsIGlucHV0RWwgfSA9IGdldENvbWJvQm94Q29udGV4dChlbCk7XG5cbiAgaWYgKGxpc3RFbC5oaWRkZW4pIHtcbiAgICBkaXNwbGF5TGlzdChjb21ib0JveEVsKTtcbiAgfSBlbHNlIHtcbiAgICBoaWRlTGlzdChjb21ib0JveEVsKTtcbiAgfVxuXG4gIGlucHV0RWwuZm9jdXMoKTtcbn07XG5cbi8qKlxuICogSGFuZGxlIGNsaWNrIGZyb20gaW5wdXRcbiAqXG4gKiBAcGFyYW0ge0hUTUxJbnB1dEVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50XG4gKi9cbmNvbnN0IGhhbmRsZUNsaWNrRnJvbUlucHV0ID0gKGVsKSA9PiB7XG4gIGNvbnN0IHsgY29tYm9Cb3hFbCwgbGlzdEVsIH0gPSBnZXRDb21ib0JveENvbnRleHQoZWwpO1xuXG4gIGlmIChsaXN0RWwuaGlkZGVuKSB7XG4gICAgZGlzcGxheUxpc3QoY29tYm9Cb3hFbCk7XG4gIH1cbn07XG5cbmNvbnN0IGNvbWJvQm94ID0gYmVoYXZpb3IoXG4gIHtcbiAgICBbQ0xJQ0tdOiB7XG4gICAgICBbSU5QVVRdKCkge1xuICAgICAgICBpZiAodGhpcy5kaXNhYmxlZCkgcmV0dXJuO1xuICAgICAgICBoYW5kbGVDbGlja0Zyb21JbnB1dCh0aGlzKTtcbiAgICAgIH0sXG4gICAgICBbVE9HR0xFX0xJU1RfQlVUVE9OXSgpIHtcbiAgICAgICAgaWYgKHRoaXMuZGlzYWJsZWQpIHJldHVybjtcbiAgICAgICAgdG9nZ2xlTGlzdCh0aGlzKTtcbiAgICAgIH0sXG4gICAgICBbTElTVF9PUFRJT05dKCkge1xuICAgICAgICBpZiAodGhpcy5kaXNhYmxlZCkgcmV0dXJuO1xuICAgICAgICBzZWxlY3RJdGVtKHRoaXMpO1xuICAgICAgfSxcbiAgICAgIFtDTEVBUl9JTlBVVF9CVVRUT05dKCkge1xuICAgICAgICBpZiAodGhpcy5kaXNhYmxlZCkgcmV0dXJuO1xuICAgICAgICBjbGVhcklucHV0KHRoaXMpO1xuICAgICAgfSxcbiAgICB9LFxuICAgIGZvY3Vzb3V0OiB7XG4gICAgICBbQ09NQk9fQk9YXShldmVudCkge1xuICAgICAgICBpZiAoIXRoaXMuY29udGFpbnMoZXZlbnQucmVsYXRlZFRhcmdldCkpIHtcbiAgICAgICAgICByZXNldFNlbGVjdGlvbih0aGlzKTtcbiAgICAgICAgICBoaWRlTGlzdCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuICAgIGtleWRvd246IHtcbiAgICAgIFtDT01CT19CT1hdOiBrZXltYXAoe1xuICAgICAgICBFc2NhcGU6IGhhbmRsZUVzY2FwZSxcbiAgICAgIH0pLFxuICAgICAgW0lOUFVUXToga2V5bWFwKHtcbiAgICAgICAgRW50ZXI6IGhhbmRsZUVudGVyRnJvbUlucHV0LFxuICAgICAgICBBcnJvd0Rvd246IGhhbmRsZURvd25Gcm9tSW5wdXQsXG4gICAgICAgIERvd246IGhhbmRsZURvd25Gcm9tSW5wdXQsXG4gICAgICB9KSxcbiAgICAgIFtMSVNUX09QVElPTl06IGtleW1hcCh7XG4gICAgICAgIEFycm93VXA6IGhhbmRsZVVwRnJvbUxpc3RPcHRpb24sXG4gICAgICAgIFVwOiBoYW5kbGVVcEZyb21MaXN0T3B0aW9uLFxuICAgICAgICBBcnJvd0Rvd246IGhhbmRsZURvd25Gcm9tTGlzdE9wdGlvbixcbiAgICAgICAgRG93bjogaGFuZGxlRG93bkZyb21MaXN0T3B0aW9uLFxuICAgICAgICBFbnRlcjogaGFuZGxlRW50ZXJGcm9tTGlzdE9wdGlvbixcbiAgICAgICAgVGFiOiBoYW5kbGVUYWJGcm9tTGlzdE9wdGlvbixcbiAgICAgICAgXCJTaGlmdCtUYWJcIjogbm9vcCxcbiAgICAgIH0pLFxuICAgIH0sXG4gICAgaW5wdXQ6IHtcbiAgICAgIFtJTlBVVF0oKSB7XG4gICAgICAgIGNvbnN0IGNvbWJvQm94RWwgPSB0aGlzLmNsb3Nlc3QoQ09NQk9fQk9YKTtcbiAgICAgICAgY29tYm9Cb3hFbC5jbGFzc0xpc3QucmVtb3ZlKENPTUJPX0JPWF9QUklTVElORV9DTEFTUyk7XG4gICAgICAgIGRpc3BsYXlMaXN0KHRoaXMpO1xuICAgICAgfSxcbiAgICB9LFxuICAgIG1vdXNlb3Zlcjoge1xuICAgICAgW0xJU1RfT1BUSU9OXSgpIHtcbiAgICAgICAgaGFuZGxlTW91c2VvdmVyKHRoaXMpO1xuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICB7XG4gICAgaW5pdChyb290KSB7XG4gICAgICBzZWxlY3RPck1hdGNoZXMoQ09NQk9fQk9YLCByb290KS5mb3JFYWNoKChjb21ib0JveEVsKSA9PiB7XG4gICAgICAgIGVuaGFuY2VDb21ib0JveChjb21ib0JveEVsKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZ2V0Q29tYm9Cb3hDb250ZXh0LFxuICAgIGVuaGFuY2VDb21ib0JveCxcbiAgICBnZW5lcmF0ZUR5bmFtaWNSZWdFeHAsXG4gICAgZGlzYWJsZSxcbiAgICBlbmFibGUsXG4gICAgZGlzcGxheUxpc3QsXG4gICAgaGlkZUxpc3QsXG4gICAgQ09NQk9fQk9YX0NMQVNTLFxuICB9XG4pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNvbWJvQm94O1xuIiwiY29uc3Qga2V5bWFwID0gcmVxdWlyZShcInJlY2VwdG9yL2tleW1hcFwiKTtcbmNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xuY29uc3Qgc2VsZWN0ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3NlbGVjdFwiKTtcbmNvbnN0IHNlbGVjdE9yTWF0Y2hlcyA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3Qtb3ItbWF0Y2hlc1wiKTtcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XG5jb25zdCB7IENMSUNLIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvZXZlbnRzXCIpO1xuY29uc3QgYWN0aXZlRWxlbWVudCA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9hY3RpdmUtZWxlbWVudFwiKTtcbmNvbnN0IGlzSW9zRGV2aWNlID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2lzLWlvcy1kZXZpY2VcIik7XG5jb25zdCBTYW5pdGl6ZXIgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2FuaXRpemVyXCIpO1xuXG5jb25zdCBEQVRFX1BJQ0tFUl9DTEFTUyA9IGAke1BSRUZJWH0tZGF0ZS1waWNrZXJgO1xuY29uc3QgREFURV9QSUNLRVJfV1JBUFBFUl9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NMQVNTfV9fd3JhcHBlcmA7XG5jb25zdCBEQVRFX1BJQ0tFUl9JTklUSUFMSVpFRF9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NMQVNTfS0taW5pdGlhbGl6ZWRgO1xuY29uc3QgREFURV9QSUNLRVJfQUNUSVZFX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0xBU1N9LS1hY3RpdmVgO1xuY29uc3QgREFURV9QSUNLRVJfSU5URVJOQUxfSU5QVVRfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DTEFTU31fX2ludGVybmFsLWlucHV0YDtcbmNvbnN0IERBVEVfUElDS0VSX0VYVEVSTkFMX0lOUFVUX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0xBU1N9X19leHRlcm5hbC1pbnB1dGA7XG5jb25zdCBEQVRFX1BJQ0tFUl9CVVRUT05fQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DTEFTU31fX2J1dHRvbmA7XG5jb25zdCBEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NMQVNTfV9fY2FsZW5kYXJgO1xuY29uc3QgREFURV9QSUNLRVJfU1RBVFVTX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0xBU1N9X19zdGF0dXNgO1xuY29uc3QgQ0FMRU5EQVJfREFURV9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NBTEVOREFSX0NMQVNTfV9fZGF0ZWA7XG5cbmNvbnN0IENBTEVOREFSX0RBVEVfRk9DVVNFRF9DTEFTUyA9IGAke0NBTEVOREFSX0RBVEVfQ0xBU1N9LS1mb2N1c2VkYDtcbmNvbnN0IENBTEVOREFSX0RBVEVfU0VMRUNURURfQ0xBU1MgPSBgJHtDQUxFTkRBUl9EQVRFX0NMQVNTfS0tc2VsZWN0ZWRgO1xuY29uc3QgQ0FMRU5EQVJfREFURV9QUkVWSU9VU19NT05USF9DTEFTUyA9IGAke0NBTEVOREFSX0RBVEVfQ0xBU1N9LS1wcmV2aW91cy1tb250aGA7XG5jb25zdCBDQUxFTkRBUl9EQVRFX0NVUlJFTlRfTU9OVEhfQ0xBU1MgPSBgJHtDQUxFTkRBUl9EQVRFX0NMQVNTfS0tY3VycmVudC1tb250aGA7XG5jb25zdCBDQUxFTkRBUl9EQVRFX05FWFRfTU9OVEhfQ0xBU1MgPSBgJHtDQUxFTkRBUl9EQVRFX0NMQVNTfS0tbmV4dC1tb250aGA7XG5jb25zdCBDQUxFTkRBUl9EQVRFX1JBTkdFX0RBVEVfQ0xBU1MgPSBgJHtDQUxFTkRBUl9EQVRFX0NMQVNTfS0tcmFuZ2UtZGF0ZWA7XG5jb25zdCBDQUxFTkRBUl9EQVRFX1RPREFZX0NMQVNTID0gYCR7Q0FMRU5EQVJfREFURV9DTEFTU30tLXRvZGF5YDtcbmNvbnN0IENBTEVOREFSX0RBVEVfUkFOR0VfREFURV9TVEFSVF9DTEFTUyA9IGAke0NBTEVOREFSX0RBVEVfQ0xBU1N9LS1yYW5nZS1kYXRlLXN0YXJ0YDtcbmNvbnN0IENBTEVOREFSX0RBVEVfUkFOR0VfREFURV9FTkRfQ0xBU1MgPSBgJHtDQUxFTkRBUl9EQVRFX0NMQVNTfS0tcmFuZ2UtZGF0ZS1lbmRgO1xuY29uc3QgQ0FMRU5EQVJfREFURV9XSVRISU5fUkFOR0VfQ0xBU1MgPSBgJHtDQUxFTkRBUl9EQVRFX0NMQVNTfS0td2l0aGluLXJhbmdlYDtcbmNvbnN0IENBTEVOREFSX1BSRVZJT1VTX1lFQVJfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31fX3ByZXZpb3VzLXllYXJgO1xuY29uc3QgQ0FMRU5EQVJfUFJFVklPVVNfTU9OVEhfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31fX3ByZXZpb3VzLW1vbnRoYDtcbmNvbnN0IENBTEVOREFSX05FWFRfWUVBUl9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NBTEVOREFSX0NMQVNTfV9fbmV4dC15ZWFyYDtcbmNvbnN0IENBTEVOREFSX05FWFRfTU9OVEhfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31fX25leHQtbW9udGhgO1xuY29uc3QgQ0FMRU5EQVJfTU9OVEhfU0VMRUNUSU9OX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1N9X19tb250aC1zZWxlY3Rpb25gO1xuY29uc3QgQ0FMRU5EQVJfWUVBUl9TRUxFQ1RJT05fQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31fX3llYXItc2VsZWN0aW9uYDtcbmNvbnN0IENBTEVOREFSX01PTlRIX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1N9X19tb250aGA7XG5jb25zdCBDQUxFTkRBUl9NT05USF9GT0NVU0VEX0NMQVNTID0gYCR7Q0FMRU5EQVJfTU9OVEhfQ0xBU1N9LS1mb2N1c2VkYDtcbmNvbnN0IENBTEVOREFSX01PTlRIX1NFTEVDVEVEX0NMQVNTID0gYCR7Q0FMRU5EQVJfTU9OVEhfQ0xBU1N9LS1zZWxlY3RlZGA7XG5jb25zdCBDQUxFTkRBUl9ZRUFSX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1N9X195ZWFyYDtcbmNvbnN0IENBTEVOREFSX1lFQVJfRk9DVVNFRF9DTEFTUyA9IGAke0NBTEVOREFSX1lFQVJfQ0xBU1N9LS1mb2N1c2VkYDtcbmNvbnN0IENBTEVOREFSX1lFQVJfU0VMRUNURURfQ0xBU1MgPSBgJHtDQUxFTkRBUl9ZRUFSX0NMQVNTfS0tc2VsZWN0ZWRgO1xuY29uc3QgQ0FMRU5EQVJfUFJFVklPVVNfWUVBUl9DSFVOS19DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NBTEVOREFSX0NMQVNTfV9fcHJldmlvdXMteWVhci1jaHVua2A7XG5jb25zdCBDQUxFTkRBUl9ORVhUX1lFQVJfQ0hVTktfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31fX25leHQteWVhci1jaHVua2A7XG5jb25zdCBDQUxFTkRBUl9EQVRFX1BJQ0tFUl9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NBTEVOREFSX0NMQVNTfV9fZGF0ZS1waWNrZXJgO1xuY29uc3QgQ0FMRU5EQVJfTU9OVEhfUElDS0VSX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1N9X19tb250aC1waWNrZXJgO1xuY29uc3QgQ0FMRU5EQVJfWUVBUl9QSUNLRVJfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31fX3llYXItcGlja2VyYDtcbmNvbnN0IENBTEVOREFSX1RBQkxFX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1N9X190YWJsZWA7XG5jb25zdCBDQUxFTkRBUl9ST1dfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31fX3Jvd2A7XG5jb25zdCBDQUxFTkRBUl9DRUxMX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1N9X19jZWxsYDtcbmNvbnN0IENBTEVOREFSX0NFTExfQ0VOVEVSX0lURU1TX0NMQVNTID0gYCR7Q0FMRU5EQVJfQ0VMTF9DTEFTU30tLWNlbnRlci1pdGVtc2A7XG5jb25zdCBDQUxFTkRBUl9NT05USF9MQUJFTF9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NBTEVOREFSX0NMQVNTfV9fbW9udGgtbGFiZWxgO1xuY29uc3QgQ0FMRU5EQVJfREFZX09GX1dFRUtfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31fX2RheS1vZi13ZWVrYDtcblxuY29uc3QgREFURV9QSUNLRVIgPSBgLiR7REFURV9QSUNLRVJfQ0xBU1N9YDtcbmNvbnN0IERBVEVfUElDS0VSX0JVVFRPTiA9IGAuJHtEQVRFX1BJQ0tFUl9CVVRUT05fQ0xBU1N9YDtcbmNvbnN0IERBVEVfUElDS0VSX0lOVEVSTkFMX0lOUFVUID0gYC4ke0RBVEVfUElDS0VSX0lOVEVSTkFMX0lOUFVUX0NMQVNTfWA7XG5jb25zdCBEQVRFX1BJQ0tFUl9FWFRFUk5BTF9JTlBVVCA9IGAuJHtEQVRFX1BJQ0tFUl9FWFRFUk5BTF9JTlBVVF9DTEFTU31gO1xuY29uc3QgREFURV9QSUNLRVJfQ0FMRU5EQVIgPSBgLiR7REFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1N9YDtcbmNvbnN0IERBVEVfUElDS0VSX1NUQVRVUyA9IGAuJHtEQVRFX1BJQ0tFUl9TVEFUVVNfQ0xBU1N9YDtcbmNvbnN0IENBTEVOREFSX0RBVEUgPSBgLiR7Q0FMRU5EQVJfREFURV9DTEFTU31gO1xuY29uc3QgQ0FMRU5EQVJfREFURV9GT0NVU0VEID0gYC4ke0NBTEVOREFSX0RBVEVfRk9DVVNFRF9DTEFTU31gO1xuY29uc3QgQ0FMRU5EQVJfREFURV9DVVJSRU5UX01PTlRIID0gYC4ke0NBTEVOREFSX0RBVEVfQ1VSUkVOVF9NT05USF9DTEFTU31gO1xuY29uc3QgQ0FMRU5EQVJfUFJFVklPVVNfWUVBUiA9IGAuJHtDQUxFTkRBUl9QUkVWSU9VU19ZRUFSX0NMQVNTfWA7XG5jb25zdCBDQUxFTkRBUl9QUkVWSU9VU19NT05USCA9IGAuJHtDQUxFTkRBUl9QUkVWSU9VU19NT05USF9DTEFTU31gO1xuY29uc3QgQ0FMRU5EQVJfTkVYVF9ZRUFSID0gYC4ke0NBTEVOREFSX05FWFRfWUVBUl9DTEFTU31gO1xuY29uc3QgQ0FMRU5EQVJfTkVYVF9NT05USCA9IGAuJHtDQUxFTkRBUl9ORVhUX01PTlRIX0NMQVNTfWA7XG5jb25zdCBDQUxFTkRBUl9ZRUFSX1NFTEVDVElPTiA9IGAuJHtDQUxFTkRBUl9ZRUFSX1NFTEVDVElPTl9DTEFTU31gO1xuY29uc3QgQ0FMRU5EQVJfTU9OVEhfU0VMRUNUSU9OID0gYC4ke0NBTEVOREFSX01PTlRIX1NFTEVDVElPTl9DTEFTU31gO1xuY29uc3QgQ0FMRU5EQVJfTU9OVEggPSBgLiR7Q0FMRU5EQVJfTU9OVEhfQ0xBU1N9YDtcbmNvbnN0IENBTEVOREFSX1lFQVIgPSBgLiR7Q0FMRU5EQVJfWUVBUl9DTEFTU31gO1xuY29uc3QgQ0FMRU5EQVJfUFJFVklPVVNfWUVBUl9DSFVOSyA9IGAuJHtDQUxFTkRBUl9QUkVWSU9VU19ZRUFSX0NIVU5LX0NMQVNTfWA7XG5jb25zdCBDQUxFTkRBUl9ORVhUX1lFQVJfQ0hVTksgPSBgLiR7Q0FMRU5EQVJfTkVYVF9ZRUFSX0NIVU5LX0NMQVNTfWA7XG5jb25zdCBDQUxFTkRBUl9EQVRFX1BJQ0tFUiA9IGAuJHtDQUxFTkRBUl9EQVRFX1BJQ0tFUl9DTEFTU31gO1xuY29uc3QgQ0FMRU5EQVJfTU9OVEhfUElDS0VSID0gYC4ke0NBTEVOREFSX01PTlRIX1BJQ0tFUl9DTEFTU31gO1xuY29uc3QgQ0FMRU5EQVJfWUVBUl9QSUNLRVIgPSBgLiR7Q0FMRU5EQVJfWUVBUl9QSUNLRVJfQ0xBU1N9YDtcbmNvbnN0IENBTEVOREFSX01PTlRIX0ZPQ1VTRUQgPSBgLiR7Q0FMRU5EQVJfTU9OVEhfRk9DVVNFRF9DTEFTU31gO1xuY29uc3QgQ0FMRU5EQVJfWUVBUl9GT0NVU0VEID0gYC4ke0NBTEVOREFSX1lFQVJfRk9DVVNFRF9DTEFTU31gO1xuXG5jb25zdCBWQUxJREFUSU9OX01FU1NBR0UgPSBcIlBsZWFzZSBlbnRlciBhIHZhbGlkIGRhdGVcIjtcblxuY29uc3QgTU9OVEhfTEFCRUxTID0gW1xuICBcIkphbnVhcnlcIixcbiAgXCJGZWJydWFyeVwiLFxuICBcIk1hcmNoXCIsXG4gIFwiQXByaWxcIixcbiAgXCJNYXlcIixcbiAgXCJKdW5lXCIsXG4gIFwiSnVseVwiLFxuICBcIkF1Z3VzdFwiLFxuICBcIlNlcHRlbWJlclwiLFxuICBcIk9jdG9iZXJcIixcbiAgXCJOb3ZlbWJlclwiLFxuICBcIkRlY2VtYmVyXCIsXG5dO1xuXG5jb25zdCBEQVlfT0ZfV0VFS19MQUJFTFMgPSBbXG4gIFwiU3VuZGF5XCIsXG4gIFwiTW9uZGF5XCIsXG4gIFwiVHVlc2RheVwiLFxuICBcIldlZG5lc2RheVwiLFxuICBcIlRodXJzZGF5XCIsXG4gIFwiRnJpZGF5XCIsXG4gIFwiU2F0dXJkYXlcIixcbl07XG5cbmNvbnN0IEVOVEVSX0tFWUNPREUgPSAxMztcblxuY29uc3QgWUVBUl9DSFVOSyA9IDEyO1xuXG5jb25zdCBERUZBVUxUX01JTl9EQVRFID0gXCIwMDAwLTAxLTAxXCI7XG5jb25zdCBERUZBVUxUX0VYVEVSTkFMX0RBVEVfRk9STUFUID0gXCJNTS9ERC9ZWVlZXCI7XG5jb25zdCBJTlRFUk5BTF9EQVRFX0ZPUk1BVCA9IFwiWVlZWS1NTS1ERFwiO1xuXG5jb25zdCBOT1RfRElTQUJMRURfU0VMRUNUT1IgPSBcIjpub3QoW2Rpc2FibGVkXSlcIjtcblxuY29uc3QgcHJvY2Vzc0ZvY3VzYWJsZVNlbGVjdG9ycyA9ICguLi5zZWxlY3RvcnMpID0+XG4gIHNlbGVjdG9ycy5tYXAoKHF1ZXJ5KSA9PiBxdWVyeSArIE5PVF9ESVNBQkxFRF9TRUxFQ1RPUikuam9pbihcIiwgXCIpO1xuXG5jb25zdCBEQVRFX1BJQ0tFUl9GT0NVU0FCTEUgPSBwcm9jZXNzRm9jdXNhYmxlU2VsZWN0b3JzKFxuICBDQUxFTkRBUl9QUkVWSU9VU19ZRUFSLFxuICBDQUxFTkRBUl9QUkVWSU9VU19NT05USCxcbiAgQ0FMRU5EQVJfWUVBUl9TRUxFQ1RJT04sXG4gIENBTEVOREFSX01PTlRIX1NFTEVDVElPTixcbiAgQ0FMRU5EQVJfTkVYVF9ZRUFSLFxuICBDQUxFTkRBUl9ORVhUX01PTlRILFxuICBDQUxFTkRBUl9EQVRFX0ZPQ1VTRURcbik7XG5cbmNvbnN0IE1PTlRIX1BJQ0tFUl9GT0NVU0FCTEUgPSBwcm9jZXNzRm9jdXNhYmxlU2VsZWN0b3JzKFxuICBDQUxFTkRBUl9NT05USF9GT0NVU0VEXG4pO1xuXG5jb25zdCBZRUFSX1BJQ0tFUl9GT0NVU0FCTEUgPSBwcm9jZXNzRm9jdXNhYmxlU2VsZWN0b3JzKFxuICBDQUxFTkRBUl9QUkVWSU9VU19ZRUFSX0NIVU5LLFxuICBDQUxFTkRBUl9ORVhUX1lFQVJfQ0hVTkssXG4gIENBTEVOREFSX1lFQVJfRk9DVVNFRFxuKTtcblxuLy8gI3JlZ2lvbiBEYXRlIE1hbmlwdWxhdGlvbiBGdW5jdGlvbnNcblxuLyoqXG4gKiBLZWVwIGRhdGUgd2l0aGluIG1vbnRoLiBNb250aCB3b3VsZCBvbmx5IGJlIG92ZXIgYnkgMSB0byAzIGRheXNcbiAqXG4gKiBAcGFyYW0ge0RhdGV9IGRhdGVUb0NoZWNrIHRoZSBkYXRlIG9iamVjdCB0byBjaGVja1xuICogQHBhcmFtIHtudW1iZXJ9IG1vbnRoIHRoZSBjb3JyZWN0IG1vbnRoXG4gKiBAcmV0dXJucyB7RGF0ZX0gdGhlIGRhdGUsIGNvcnJlY3RlZCBpZiBuZWVkZWRcbiAqL1xuY29uc3Qga2VlcERhdGVXaXRoaW5Nb250aCA9IChkYXRlVG9DaGVjaywgbW9udGgpID0+IHtcbiAgaWYgKG1vbnRoICE9PSBkYXRlVG9DaGVjay5nZXRNb250aCgpKSB7XG4gICAgZGF0ZVRvQ2hlY2suc2V0RGF0ZSgwKTtcbiAgfVxuXG4gIHJldHVybiBkYXRlVG9DaGVjaztcbn07XG5cbi8qKlxuICogU2V0IGRhdGUgZnJvbSBtb250aCBkYXkgeWVhclxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSB5ZWFyIHRoZSB5ZWFyIHRvIHNldFxuICogQHBhcmFtIHtudW1iZXJ9IG1vbnRoIHRoZSBtb250aCB0byBzZXQgKHplcm8taW5kZXhlZClcbiAqIEBwYXJhbSB7bnVtYmVyfSBkYXRlIHRoZSBkYXRlIHRvIHNldFxuICogQHJldHVybnMge0RhdGV9IHRoZSBzZXQgZGF0ZVxuICovXG5jb25zdCBzZXREYXRlID0gKHllYXIsIG1vbnRoLCBkYXRlKSA9PiB7XG4gIGNvbnN0IG5ld0RhdGUgPSBuZXcgRGF0ZSgwKTtcbiAgbmV3RGF0ZS5zZXRGdWxsWWVhcih5ZWFyLCBtb250aCwgZGF0ZSk7XG4gIHJldHVybiBuZXdEYXRlO1xufTtcblxuLyoqXG4gKiB0b2RheXMgZGF0ZVxuICpcbiAqIEByZXR1cm5zIHtEYXRlfSB0b2RheXMgZGF0ZVxuICovXG5jb25zdCB0b2RheSA9ICgpID0+IHtcbiAgY29uc3QgbmV3RGF0ZSA9IG5ldyBEYXRlKCk7XG4gIGNvbnN0IGRheSA9IG5ld0RhdGUuZ2V0RGF0ZSgpO1xuICBjb25zdCBtb250aCA9IG5ld0RhdGUuZ2V0TW9udGgoKTtcbiAgY29uc3QgeWVhciA9IG5ld0RhdGUuZ2V0RnVsbFllYXIoKTtcbiAgcmV0dXJuIHNldERhdGUoeWVhciwgbW9udGgsIGRheSk7XG59O1xuXG4vKipcbiAqIFNldCBkYXRlIHRvIGZpcnN0IGRheSBvZiB0aGUgbW9udGhcbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gZGF0ZSB0aGUgZGF0ZSB0byBhZGp1c3RcbiAqIEByZXR1cm5zIHtEYXRlfSB0aGUgYWRqdXN0ZWQgZGF0ZVxuICovXG5jb25zdCBzdGFydE9mTW9udGggPSAoZGF0ZSkgPT4ge1xuICBjb25zdCBuZXdEYXRlID0gbmV3IERhdGUoMCk7XG4gIG5ld0RhdGUuc2V0RnVsbFllYXIoZGF0ZS5nZXRGdWxsWWVhcigpLCBkYXRlLmdldE1vbnRoKCksIDEpO1xuICByZXR1cm4gbmV3RGF0ZTtcbn07XG5cbi8qKlxuICogU2V0IGRhdGUgdG8gbGFzdCBkYXkgb2YgdGhlIG1vbnRoXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IGRhdGUgdGhlIGRhdGUgdG8gYWRqdXN0XG4gKiBAcmV0dXJucyB7RGF0ZX0gdGhlIGFkanVzdGVkIGRhdGVcbiAqL1xuY29uc3QgbGFzdERheU9mTW9udGggPSAoZGF0ZSkgPT4ge1xuICBjb25zdCBuZXdEYXRlID0gbmV3IERhdGUoMCk7XG4gIG5ld0RhdGUuc2V0RnVsbFllYXIoZGF0ZS5nZXRGdWxsWWVhcigpLCBkYXRlLmdldE1vbnRoKCkgKyAxLCAwKTtcbiAgcmV0dXJuIG5ld0RhdGU7XG59O1xuXG4vKipcbiAqIEFkZCBkYXlzIHRvIGRhdGVcbiAqXG4gKiBAcGFyYW0ge0RhdGV9IF9kYXRlIHRoZSBkYXRlIHRvIGFkanVzdFxuICogQHBhcmFtIHtudW1iZXJ9IG51bURheXMgdGhlIGRpZmZlcmVuY2UgaW4gZGF5c1xuICogQHJldHVybnMge0RhdGV9IHRoZSBhZGp1c3RlZCBkYXRlXG4gKi9cbmNvbnN0IGFkZERheXMgPSAoX2RhdGUsIG51bURheXMpID0+IHtcbiAgY29uc3QgbmV3RGF0ZSA9IG5ldyBEYXRlKF9kYXRlLmdldFRpbWUoKSk7XG4gIG5ld0RhdGUuc2V0RGF0ZShuZXdEYXRlLmdldERhdGUoKSArIG51bURheXMpO1xuICByZXR1cm4gbmV3RGF0ZTtcbn07XG5cbi8qKlxuICogU3VidHJhY3QgZGF5cyBmcm9tIGRhdGVcbiAqXG4gKiBAcGFyYW0ge0RhdGV9IF9kYXRlIHRoZSBkYXRlIHRvIGFkanVzdFxuICogQHBhcmFtIHtudW1iZXJ9IG51bURheXMgdGhlIGRpZmZlcmVuY2UgaW4gZGF5c1xuICogQHJldHVybnMge0RhdGV9IHRoZSBhZGp1c3RlZCBkYXRlXG4gKi9cbmNvbnN0IHN1YkRheXMgPSAoX2RhdGUsIG51bURheXMpID0+IGFkZERheXMoX2RhdGUsIC1udW1EYXlzKTtcblxuLyoqXG4gKiBBZGQgd2Vla3MgdG8gZGF0ZVxuICpcbiAqIEBwYXJhbSB7RGF0ZX0gX2RhdGUgdGhlIGRhdGUgdG8gYWRqdXN0XG4gKiBAcGFyYW0ge251bWJlcn0gbnVtV2Vla3MgdGhlIGRpZmZlcmVuY2UgaW4gd2Vla3NcbiAqIEByZXR1cm5zIHtEYXRlfSB0aGUgYWRqdXN0ZWQgZGF0ZVxuICovXG5jb25zdCBhZGRXZWVrcyA9IChfZGF0ZSwgbnVtV2Vla3MpID0+IGFkZERheXMoX2RhdGUsIG51bVdlZWtzICogNyk7XG5cbi8qKlxuICogU3VidHJhY3Qgd2Vla3MgZnJvbSBkYXRlXG4gKlxuICogQHBhcmFtIHtEYXRlfSBfZGF0ZSB0aGUgZGF0ZSB0byBhZGp1c3RcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW1XZWVrcyB0aGUgZGlmZmVyZW5jZSBpbiB3ZWVrc1xuICogQHJldHVybnMge0RhdGV9IHRoZSBhZGp1c3RlZCBkYXRlXG4gKi9cbmNvbnN0IHN1YldlZWtzID0gKF9kYXRlLCBudW1XZWVrcykgPT4gYWRkV2Vla3MoX2RhdGUsIC1udW1XZWVrcyk7XG5cbi8qKlxuICogU2V0IGRhdGUgdG8gdGhlIHN0YXJ0IG9mIHRoZSB3ZWVrIChTdW5kYXkpXG4gKlxuICogQHBhcmFtIHtEYXRlfSBfZGF0ZSB0aGUgZGF0ZSB0byBhZGp1c3RcbiAqIEByZXR1cm5zIHtEYXRlfSB0aGUgYWRqdXN0ZWQgZGF0ZVxuICovXG5jb25zdCBzdGFydE9mV2VlayA9IChfZGF0ZSkgPT4ge1xuICBjb25zdCBkYXlPZldlZWsgPSBfZGF0ZS5nZXREYXkoKTtcbiAgcmV0dXJuIHN1YkRheXMoX2RhdGUsIGRheU9mV2Vlayk7XG59O1xuXG4vKipcbiAqIFNldCBkYXRlIHRvIHRoZSBlbmQgb2YgdGhlIHdlZWsgKFNhdHVyZGF5KVxuICpcbiAqIEBwYXJhbSB7RGF0ZX0gX2RhdGUgdGhlIGRhdGUgdG8gYWRqdXN0XG4gKiBAcGFyYW0ge251bWJlcn0gbnVtV2Vla3MgdGhlIGRpZmZlcmVuY2UgaW4gd2Vla3NcbiAqIEByZXR1cm5zIHtEYXRlfSB0aGUgYWRqdXN0ZWQgZGF0ZVxuICovXG5jb25zdCBlbmRPZldlZWsgPSAoX2RhdGUpID0+IHtcbiAgY29uc3QgZGF5T2ZXZWVrID0gX2RhdGUuZ2V0RGF5KCk7XG4gIHJldHVybiBhZGREYXlzKF9kYXRlLCA2IC0gZGF5T2ZXZWVrKTtcbn07XG5cbi8qKlxuICogQWRkIG1vbnRocyB0byBkYXRlIGFuZCBrZWVwIGRhdGUgd2l0aGluIG1vbnRoXG4gKlxuICogQHBhcmFtIHtEYXRlfSBfZGF0ZSB0aGUgZGF0ZSB0byBhZGp1c3RcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW1Nb250aHMgdGhlIGRpZmZlcmVuY2UgaW4gbW9udGhzXG4gKiBAcmV0dXJucyB7RGF0ZX0gdGhlIGFkanVzdGVkIGRhdGVcbiAqL1xuY29uc3QgYWRkTW9udGhzID0gKF9kYXRlLCBudW1Nb250aHMpID0+IHtcbiAgY29uc3QgbmV3RGF0ZSA9IG5ldyBEYXRlKF9kYXRlLmdldFRpbWUoKSk7XG5cbiAgY29uc3QgZGF0ZU1vbnRoID0gKG5ld0RhdGUuZ2V0TW9udGgoKSArIDEyICsgbnVtTW9udGhzKSAlIDEyO1xuICBuZXdEYXRlLnNldE1vbnRoKG5ld0RhdGUuZ2V0TW9udGgoKSArIG51bU1vbnRocyk7XG4gIGtlZXBEYXRlV2l0aGluTW9udGgobmV3RGF0ZSwgZGF0ZU1vbnRoKTtcblxuICByZXR1cm4gbmV3RGF0ZTtcbn07XG5cbi8qKlxuICogU3VidHJhY3QgbW9udGhzIGZyb20gZGF0ZVxuICpcbiAqIEBwYXJhbSB7RGF0ZX0gX2RhdGUgdGhlIGRhdGUgdG8gYWRqdXN0XG4gKiBAcGFyYW0ge251bWJlcn0gbnVtTW9udGhzIHRoZSBkaWZmZXJlbmNlIGluIG1vbnRoc1xuICogQHJldHVybnMge0RhdGV9IHRoZSBhZGp1c3RlZCBkYXRlXG4gKi9cbmNvbnN0IHN1Yk1vbnRocyA9IChfZGF0ZSwgbnVtTW9udGhzKSA9PiBhZGRNb250aHMoX2RhdGUsIC1udW1Nb250aHMpO1xuXG4vKipcbiAqIEFkZCB5ZWFycyB0byBkYXRlIGFuZCBrZWVwIGRhdGUgd2l0aGluIG1vbnRoXG4gKlxuICogQHBhcmFtIHtEYXRlfSBfZGF0ZSB0aGUgZGF0ZSB0byBhZGp1c3RcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW1ZZWFycyB0aGUgZGlmZmVyZW5jZSBpbiB5ZWFyc1xuICogQHJldHVybnMge0RhdGV9IHRoZSBhZGp1c3RlZCBkYXRlXG4gKi9cbmNvbnN0IGFkZFllYXJzID0gKF9kYXRlLCBudW1ZZWFycykgPT4gYWRkTW9udGhzKF9kYXRlLCBudW1ZZWFycyAqIDEyKTtcblxuLyoqXG4gKiBTdWJ0cmFjdCB5ZWFycyBmcm9tIGRhdGVcbiAqXG4gKiBAcGFyYW0ge0RhdGV9IF9kYXRlIHRoZSBkYXRlIHRvIGFkanVzdFxuICogQHBhcmFtIHtudW1iZXJ9IG51bVllYXJzIHRoZSBkaWZmZXJlbmNlIGluIHllYXJzXG4gKiBAcmV0dXJucyB7RGF0ZX0gdGhlIGFkanVzdGVkIGRhdGVcbiAqL1xuY29uc3Qgc3ViWWVhcnMgPSAoX2RhdGUsIG51bVllYXJzKSA9PiBhZGRZZWFycyhfZGF0ZSwgLW51bVllYXJzKTtcblxuLyoqXG4gKiBTZXQgbW9udGhzIG9mIGRhdGVcbiAqXG4gKiBAcGFyYW0ge0RhdGV9IF9kYXRlIHRoZSBkYXRlIHRvIGFkanVzdFxuICogQHBhcmFtIHtudW1iZXJ9IG1vbnRoIHplcm8taW5kZXhlZCBtb250aCB0byBzZXRcbiAqIEByZXR1cm5zIHtEYXRlfSB0aGUgYWRqdXN0ZWQgZGF0ZVxuICovXG5jb25zdCBzZXRNb250aCA9IChfZGF0ZSwgbW9udGgpID0+IHtcbiAgY29uc3QgbmV3RGF0ZSA9IG5ldyBEYXRlKF9kYXRlLmdldFRpbWUoKSk7XG5cbiAgbmV3RGF0ZS5zZXRNb250aChtb250aCk7XG4gIGtlZXBEYXRlV2l0aGluTW9udGgobmV3RGF0ZSwgbW9udGgpO1xuXG4gIHJldHVybiBuZXdEYXRlO1xufTtcblxuLyoqXG4gKiBTZXQgeWVhciBvZiBkYXRlXG4gKlxuICogQHBhcmFtIHtEYXRlfSBfZGF0ZSB0aGUgZGF0ZSB0byBhZGp1c3RcbiAqIEBwYXJhbSB7bnVtYmVyfSB5ZWFyIHRoZSB5ZWFyIHRvIHNldFxuICogQHJldHVybnMge0RhdGV9IHRoZSBhZGp1c3RlZCBkYXRlXG4gKi9cbmNvbnN0IHNldFllYXIgPSAoX2RhdGUsIHllYXIpID0+IHtcbiAgY29uc3QgbmV3RGF0ZSA9IG5ldyBEYXRlKF9kYXRlLmdldFRpbWUoKSk7XG5cbiAgY29uc3QgbW9udGggPSBuZXdEYXRlLmdldE1vbnRoKCk7XG4gIG5ld0RhdGUuc2V0RnVsbFllYXIoeWVhcik7XG4gIGtlZXBEYXRlV2l0aGluTW9udGgobmV3RGF0ZSwgbW9udGgpO1xuXG4gIHJldHVybiBuZXdEYXRlO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGVhcmxpZXN0IGRhdGVcbiAqXG4gKiBAcGFyYW0ge0RhdGV9IGRhdGVBIGRhdGUgdG8gY29tcGFyZVxuICogQHBhcmFtIHtEYXRlfSBkYXRlQiBkYXRlIHRvIGNvbXBhcmVcbiAqIEByZXR1cm5zIHtEYXRlfSB0aGUgZWFybGllc3QgZGF0ZVxuICovXG5jb25zdCBtaW4gPSAoZGF0ZUEsIGRhdGVCKSA9PiB7XG4gIGxldCBuZXdEYXRlID0gZGF0ZUE7XG5cbiAgaWYgKGRhdGVCIDwgZGF0ZUEpIHtcbiAgICBuZXdEYXRlID0gZGF0ZUI7XG4gIH1cblxuICByZXR1cm4gbmV3IERhdGUobmV3RGF0ZS5nZXRUaW1lKCkpO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGxhdGVzdCBkYXRlXG4gKlxuICogQHBhcmFtIHtEYXRlfSBkYXRlQSBkYXRlIHRvIGNvbXBhcmVcbiAqIEBwYXJhbSB7RGF0ZX0gZGF0ZUIgZGF0ZSB0byBjb21wYXJlXG4gKiBAcmV0dXJucyB7RGF0ZX0gdGhlIGxhdGVzdCBkYXRlXG4gKi9cbmNvbnN0IG1heCA9IChkYXRlQSwgZGF0ZUIpID0+IHtcbiAgbGV0IG5ld0RhdGUgPSBkYXRlQTtcblxuICBpZiAoZGF0ZUIgPiBkYXRlQSkge1xuICAgIG5ld0RhdGUgPSBkYXRlQjtcbiAgfVxuXG4gIHJldHVybiBuZXcgRGF0ZShuZXdEYXRlLmdldFRpbWUoKSk7XG59O1xuXG4vKipcbiAqIENoZWNrIGlmIGRhdGVzIGFyZSB0aGUgaW4gdGhlIHNhbWUgeWVhclxuICpcbiAqIEBwYXJhbSB7RGF0ZX0gZGF0ZUEgZGF0ZSB0byBjb21wYXJlXG4gKiBAcGFyYW0ge0RhdGV9IGRhdGVCIGRhdGUgdG8gY29tcGFyZVxuICogQHJldHVybnMge2Jvb2xlYW59IGFyZSBkYXRlcyBpbiB0aGUgc2FtZSB5ZWFyXG4gKi9cbmNvbnN0IGlzU2FtZVllYXIgPSAoZGF0ZUEsIGRhdGVCKSA9PlxuICBkYXRlQSAmJiBkYXRlQiAmJiBkYXRlQS5nZXRGdWxsWWVhcigpID09PSBkYXRlQi5nZXRGdWxsWWVhcigpO1xuXG4vKipcbiAqIENoZWNrIGlmIGRhdGVzIGFyZSB0aGUgaW4gdGhlIHNhbWUgbW9udGhcbiAqXG4gKiBAcGFyYW0ge0RhdGV9IGRhdGVBIGRhdGUgdG8gY29tcGFyZVxuICogQHBhcmFtIHtEYXRlfSBkYXRlQiBkYXRlIHRvIGNvbXBhcmVcbiAqIEByZXR1cm5zIHtib29sZWFufSBhcmUgZGF0ZXMgaW4gdGhlIHNhbWUgbW9udGhcbiAqL1xuY29uc3QgaXNTYW1lTW9udGggPSAoZGF0ZUEsIGRhdGVCKSA9PlxuICBpc1NhbWVZZWFyKGRhdGVBLCBkYXRlQikgJiYgZGF0ZUEuZ2V0TW9udGgoKSA9PT0gZGF0ZUIuZ2V0TW9udGgoKTtcblxuLyoqXG4gKiBDaGVjayBpZiBkYXRlcyBhcmUgdGhlIHNhbWUgZGF0ZVxuICpcbiAqIEBwYXJhbSB7RGF0ZX0gZGF0ZUEgdGhlIGRhdGUgdG8gY29tcGFyZVxuICogQHBhcmFtIHtEYXRlfSBkYXRlQSB0aGUgZGF0ZSB0byBjb21wYXJlXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gYXJlIGRhdGVzIHRoZSBzYW1lIGRhdGVcbiAqL1xuY29uc3QgaXNTYW1lRGF5ID0gKGRhdGVBLCBkYXRlQikgPT5cbiAgaXNTYW1lTW9udGgoZGF0ZUEsIGRhdGVCKSAmJiBkYXRlQS5nZXREYXRlKCkgPT09IGRhdGVCLmdldERhdGUoKTtcblxuLyoqXG4gKiByZXR1cm4gYSBuZXcgZGF0ZSB3aXRoaW4gbWluaW11bSBhbmQgbWF4aW11bSBkYXRlXG4gKlxuICogQHBhcmFtIHtEYXRlfSBkYXRlIGRhdGUgdG8gY2hlY2tcbiAqIEBwYXJhbSB7RGF0ZX0gbWluRGF0ZSBtaW5pbXVtIGRhdGUgdG8gYWxsb3dcbiAqIEBwYXJhbSB7RGF0ZX0gbWF4RGF0ZSBtYXhpbXVtIGRhdGUgdG8gYWxsb3dcbiAqIEByZXR1cm5zIHtEYXRlfSB0aGUgZGF0ZSBiZXR3ZWVuIG1pbiBhbmQgbWF4XG4gKi9cbmNvbnN0IGtlZXBEYXRlQmV0d2Vlbk1pbkFuZE1heCA9IChkYXRlLCBtaW5EYXRlLCBtYXhEYXRlKSA9PiB7XG4gIGxldCBuZXdEYXRlID0gZGF0ZTtcblxuICBpZiAoZGF0ZSA8IG1pbkRhdGUpIHtcbiAgICBuZXdEYXRlID0gbWluRGF0ZTtcbiAgfSBlbHNlIGlmIChtYXhEYXRlICYmIGRhdGUgPiBtYXhEYXRlKSB7XG4gICAgbmV3RGF0ZSA9IG1heERhdGU7XG4gIH1cblxuICByZXR1cm4gbmV3IERhdGUobmV3RGF0ZS5nZXRUaW1lKCkpO1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiBkYXRlcyBpcyB2YWxpZC5cbiAqXG4gKiBAcGFyYW0ge0RhdGV9IGRhdGUgZGF0ZSB0byBjaGVja1xuICogQHBhcmFtIHtEYXRlfSBtaW5EYXRlIG1pbmltdW0gZGF0ZSB0byBhbGxvd1xuICogQHBhcmFtIHtEYXRlfSBtYXhEYXRlIG1heGltdW0gZGF0ZSB0byBhbGxvd1xuICogQHJldHVybiB7Ym9vbGVhbn0gaXMgdGhlcmUgYSBkYXkgd2l0aGluIHRoZSBtb250aCB3aXRoaW4gbWluIGFuZCBtYXggZGF0ZXNcbiAqL1xuY29uc3QgaXNEYXRlV2l0aGluTWluQW5kTWF4ID0gKGRhdGUsIG1pbkRhdGUsIG1heERhdGUpID0+XG4gIGRhdGUgPj0gbWluRGF0ZSAmJiAoIW1heERhdGUgfHwgZGF0ZSA8PSBtYXhEYXRlKTtcblxuLyoqXG4gKiBDaGVjayBpZiBkYXRlcyBtb250aCBpcyBpbnZhbGlkLlxuICpcbiAqIEBwYXJhbSB7RGF0ZX0gZGF0ZSBkYXRlIHRvIGNoZWNrXG4gKiBAcGFyYW0ge0RhdGV9IG1pbkRhdGUgbWluaW11bSBkYXRlIHRvIGFsbG93XG4gKiBAcGFyYW0ge0RhdGV9IG1heERhdGUgbWF4aW11bSBkYXRlIHRvIGFsbG93XG4gKiBAcmV0dXJuIHtib29sZWFufSBpcyB0aGUgbW9udGggb3V0c2lkZSBtaW4gb3IgbWF4IGRhdGVzXG4gKi9cbmNvbnN0IGlzRGF0ZXNNb250aE91dHNpZGVNaW5Pck1heCA9IChkYXRlLCBtaW5EYXRlLCBtYXhEYXRlKSA9PlxuICBsYXN0RGF5T2ZNb250aChkYXRlKSA8IG1pbkRhdGUgfHwgKG1heERhdGUgJiYgc3RhcnRPZk1vbnRoKGRhdGUpID4gbWF4RGF0ZSk7XG5cbi8qKlxuICogQ2hlY2sgaWYgZGF0ZXMgeWVhciBpcyBpbnZhbGlkLlxuICpcbiAqIEBwYXJhbSB7RGF0ZX0gZGF0ZSBkYXRlIHRvIGNoZWNrXG4gKiBAcGFyYW0ge0RhdGV9IG1pbkRhdGUgbWluaW11bSBkYXRlIHRvIGFsbG93XG4gKiBAcGFyYW0ge0RhdGV9IG1heERhdGUgbWF4aW11bSBkYXRlIHRvIGFsbG93XG4gKiBAcmV0dXJuIHtib29sZWFufSBpcyB0aGUgbW9udGggb3V0c2lkZSBtaW4gb3IgbWF4IGRhdGVzXG4gKi9cbmNvbnN0IGlzRGF0ZXNZZWFyT3V0c2lkZU1pbk9yTWF4ID0gKGRhdGUsIG1pbkRhdGUsIG1heERhdGUpID0+XG4gIGxhc3REYXlPZk1vbnRoKHNldE1vbnRoKGRhdGUsIDExKSkgPCBtaW5EYXRlIHx8XG4gIChtYXhEYXRlICYmIHN0YXJ0T2ZNb250aChzZXRNb250aChkYXRlLCAwKSkgPiBtYXhEYXRlKTtcblxuLyoqXG4gKiBQYXJzZSBhIGRhdGUgd2l0aCBmb3JtYXQgTS1ELVlZXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGRhdGVTdHJpbmcgdGhlIGRhdGUgc3RyaW5nIHRvIHBhcnNlXG4gKiBAcGFyYW0ge3N0cmluZ30gZGF0ZUZvcm1hdCB0aGUgZm9ybWF0IG9mIHRoZSBkYXRlIHN0cmluZ1xuICogQHBhcmFtIHtib29sZWFufSBhZGp1c3REYXRlIHNob3VsZCB0aGUgZGF0ZSBiZSBhZGp1c3RlZFxuICogQHJldHVybnMge0RhdGV9IHRoZSBwYXJzZWQgZGF0ZVxuICovXG5jb25zdCBwYXJzZURhdGVTdHJpbmcgPSAoXG4gIGRhdGVTdHJpbmcsXG4gIGRhdGVGb3JtYXQgPSBJTlRFUk5BTF9EQVRFX0ZPUk1BVCxcbiAgYWRqdXN0RGF0ZSA9IGZhbHNlXG4pID0+IHtcbiAgbGV0IGRhdGU7XG4gIGxldCBtb250aDtcbiAgbGV0IGRheTtcbiAgbGV0IHllYXI7XG4gIGxldCBwYXJzZWQ7XG5cbiAgaWYgKGRhdGVTdHJpbmcpIHtcbiAgICBsZXQgbW9udGhTdHI7XG4gICAgbGV0IGRheVN0cjtcbiAgICBsZXQgeWVhclN0cjtcblxuICAgIGlmIChkYXRlRm9ybWF0ID09PSBERUZBVUxUX0VYVEVSTkFMX0RBVEVfRk9STUFUKSB7XG4gICAgICBbbW9udGhTdHIsIGRheVN0ciwgeWVhclN0cl0gPSBkYXRlU3RyaW5nLnNwbGl0KFwiL1wiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgW3llYXJTdHIsIG1vbnRoU3RyLCBkYXlTdHJdID0gZGF0ZVN0cmluZy5zcGxpdChcIi1cIik7XG4gICAgfVxuXG4gICAgaWYgKHllYXJTdHIpIHtcbiAgICAgIHBhcnNlZCA9IHBhcnNlSW50KHllYXJTdHIsIDEwKTtcbiAgICAgIGlmICghTnVtYmVyLmlzTmFOKHBhcnNlZCkpIHtcbiAgICAgICAgeWVhciA9IHBhcnNlZDtcbiAgICAgICAgaWYgKGFkanVzdERhdGUpIHtcbiAgICAgICAgICB5ZWFyID0gTWF0aC5tYXgoMCwgeWVhcik7XG4gICAgICAgICAgaWYgKHllYXJTdHIubGVuZ3RoIDwgMykge1xuICAgICAgICAgICAgY29uc3QgY3VycmVudFllYXIgPSB0b2RheSgpLmdldEZ1bGxZZWFyKCk7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50WWVhclN0dWIgPVxuICAgICAgICAgICAgICBjdXJyZW50WWVhciAtIChjdXJyZW50WWVhciAlIDEwICoqIHllYXJTdHIubGVuZ3RoKTtcbiAgICAgICAgICAgIHllYXIgPSBjdXJyZW50WWVhclN0dWIgKyBwYXJzZWQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG1vbnRoU3RyKSB7XG4gICAgICBwYXJzZWQgPSBwYXJzZUludChtb250aFN0ciwgMTApO1xuICAgICAgaWYgKCFOdW1iZXIuaXNOYU4ocGFyc2VkKSkge1xuICAgICAgICBtb250aCA9IHBhcnNlZDtcbiAgICAgICAgaWYgKGFkanVzdERhdGUpIHtcbiAgICAgICAgICBtb250aCA9IE1hdGgubWF4KDEsIG1vbnRoKTtcbiAgICAgICAgICBtb250aCA9IE1hdGgubWluKDEyLCBtb250aCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobW9udGggJiYgZGF5U3RyICYmIHllYXIgIT0gbnVsbCkge1xuICAgICAgcGFyc2VkID0gcGFyc2VJbnQoZGF5U3RyLCAxMCk7XG4gICAgICBpZiAoIU51bWJlci5pc05hTihwYXJzZWQpKSB7XG4gICAgICAgIGRheSA9IHBhcnNlZDtcbiAgICAgICAgaWYgKGFkanVzdERhdGUpIHtcbiAgICAgICAgICBjb25zdCBsYXN0RGF5T2ZUaGVNb250aCA9IHNldERhdGUoeWVhciwgbW9udGgsIDApLmdldERhdGUoKTtcbiAgICAgICAgICBkYXkgPSBNYXRoLm1heCgxLCBkYXkpO1xuICAgICAgICAgIGRheSA9IE1hdGgubWluKGxhc3REYXlPZlRoZU1vbnRoLCBkYXkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG1vbnRoICYmIGRheSAmJiB5ZWFyICE9IG51bGwpIHtcbiAgICAgIGRhdGUgPSBzZXREYXRlKHllYXIsIG1vbnRoIC0gMSwgZGF5KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZGF0ZTtcbn07XG5cbi8qKlxuICogRm9ybWF0IGEgZGF0ZSB0byBmb3JtYXQgTU0tREQtWVlZWVxuICpcbiAqIEBwYXJhbSB7RGF0ZX0gZGF0ZSB0aGUgZGF0ZSB0byBmb3JtYXRcbiAqIEBwYXJhbSB7c3RyaW5nfSBkYXRlRm9ybWF0IHRoZSBmb3JtYXQgb2YgdGhlIGRhdGUgc3RyaW5nXG4gKiBAcmV0dXJucyB7c3RyaW5nfSB0aGUgZm9ybWF0dGVkIGRhdGUgc3RyaW5nXG4gKi9cbmNvbnN0IGZvcm1hdERhdGUgPSAoZGF0ZSwgZGF0ZUZvcm1hdCA9IElOVEVSTkFMX0RBVEVfRk9STUFUKSA9PiB7XG4gIGNvbnN0IHBhZFplcm9zID0gKHZhbHVlLCBsZW5ndGgpID0+IGAwMDAwJHt2YWx1ZX1gLnNsaWNlKC1sZW5ndGgpO1xuXG4gIGNvbnN0IG1vbnRoID0gZGF0ZS5nZXRNb250aCgpICsgMTtcbiAgY29uc3QgZGF5ID0gZGF0ZS5nZXREYXRlKCk7XG4gIGNvbnN0IHllYXIgPSBkYXRlLmdldEZ1bGxZZWFyKCk7XG5cbiAgaWYgKGRhdGVGb3JtYXQgPT09IERFRkFVTFRfRVhURVJOQUxfREFURV9GT1JNQVQpIHtcbiAgICByZXR1cm4gW3BhZFplcm9zKG1vbnRoLCAyKSwgcGFkWmVyb3MoZGF5LCAyKSwgcGFkWmVyb3MoeWVhciwgNCldLmpvaW4oXCIvXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtwYWRaZXJvcyh5ZWFyLCA0KSwgcGFkWmVyb3MobW9udGgsIDIpLCBwYWRaZXJvcyhkYXksIDIpXS5qb2luKFwiLVwiKTtcbn07XG5cbi8vICNlbmRyZWdpb24gRGF0ZSBNYW5pcHVsYXRpb24gRnVuY3Rpb25zXG5cbi8qKlxuICogQ3JlYXRlIGEgZ3JpZCBzdHJpbmcgZnJvbSBhbiBhcnJheSBvZiBodG1sIHN0cmluZ3NcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ1tdfSBodG1sQXJyYXkgdGhlIGFycmF5IG9mIGh0bWwgaXRlbXNcbiAqIEBwYXJhbSB7bnVtYmVyfSByb3dTaXplIHRoZSBsZW5ndGggb2YgYSByb3dcbiAqIEByZXR1cm5zIHtzdHJpbmd9IHRoZSBncmlkIHN0cmluZ1xuICovXG5jb25zdCBsaXN0VG9HcmlkSHRtbCA9IChodG1sQXJyYXksIHJvd1NpemUpID0+IHtcbiAgY29uc3QgZ3JpZCA9IFtdO1xuICBsZXQgcm93ID0gW107XG5cbiAgbGV0IGkgPSAwO1xuICB3aGlsZSAoaSA8IGh0bWxBcnJheS5sZW5ndGgpIHtcbiAgICByb3cgPSBbXTtcblxuICAgIGNvbnN0IHRyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRyXCIpO1xuICAgIHdoaWxlIChpIDwgaHRtbEFycmF5Lmxlbmd0aCAmJiByb3cubGVuZ3RoIDwgcm93U2l6ZSkge1xuICAgICAgY29uc3QgdGQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGRcIik7XG4gICAgICB0ZC5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJiZWZvcmVlbmRcIiwgaHRtbEFycmF5W2ldKTtcbiAgICAgIHJvdy5wdXNoKHRkKTtcbiAgICAgIGkgKz0gMTtcbiAgICB9XG5cbiAgICByb3cuZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xuICAgICAgdHIuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIGVsZW1lbnQpO1xuICAgIH0pO1xuXG4gICAgZ3JpZC5wdXNoKHRyKTtcbiAgfVxuXG4gIHJldHVybiBncmlkO1xufTtcblxuY29uc3QgY3JlYXRlVGFibGVCb2R5ID0gKGdyaWQpID0+IHtcbiAgY29uc3QgdGFibGVCb2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRib2R5XCIpO1xuICBncmlkLmZvckVhY2goKGVsZW1lbnQpID0+IHtcbiAgICB0YWJsZUJvZHkuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIGVsZW1lbnQpO1xuICB9KTtcblxuICByZXR1cm4gdGFibGVCb2R5O1xufTtcblxuLyoqXG4gKiBzZXQgdGhlIHZhbHVlIG9mIHRoZSBlbGVtZW50IGFuZCBkaXNwYXRjaCBhIGNoYW5nZSBldmVudFxuICpcbiAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudH0gZWwgVGhlIGVsZW1lbnQgdG8gdXBkYXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgVGhlIG5ldyB2YWx1ZSBvZiB0aGUgZWxlbWVudFxuICovXG5jb25zdCBjaGFuZ2VFbGVtZW50VmFsdWUgPSAoZWwsIHZhbHVlID0gXCJcIikgPT4ge1xuICBjb25zdCBlbGVtZW50VG9DaGFuZ2UgPSBlbDtcbiAgZWxlbWVudFRvQ2hhbmdlLnZhbHVlID0gdmFsdWU7XG5cbiAgY29uc3QgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoXCJjaGFuZ2VcIiwge1xuICAgIGJ1YmJsZXM6IHRydWUsXG4gICAgY2FuY2VsYWJsZTogdHJ1ZSxcbiAgICBkZXRhaWw6IHsgdmFsdWUgfSxcbiAgfSk7XG4gIGVsZW1lbnRUb0NoYW5nZS5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbn07XG5cbi8qKlxuICogVGhlIHByb3BlcnRpZXMgYW5kIGVsZW1lbnRzIHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIuXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBEYXRlUGlja2VyQ29udGV4dFxuICogQHByb3BlcnR5IHtIVE1MRGl2RWxlbWVudH0gY2FsZW5kYXJFbFxuICogQHByb3BlcnR5IHtIVE1MRWxlbWVudH0gZGF0ZVBpY2tlckVsXG4gKiBAcHJvcGVydHkge0hUTUxJbnB1dEVsZW1lbnR9IGludGVybmFsSW5wdXRFbFxuICogQHByb3BlcnR5IHtIVE1MSW5wdXRFbGVtZW50fSBleHRlcm5hbElucHV0RWxcbiAqIEBwcm9wZXJ0eSB7SFRNTERpdkVsZW1lbnR9IHN0YXR1c0VsXG4gKiBAcHJvcGVydHkge0hUTUxEaXZFbGVtZW50fSBmaXJzdFllYXJDaHVua0VsXG4gKiBAcHJvcGVydHkge0RhdGV9IGNhbGVuZGFyRGF0ZVxuICogQHByb3BlcnR5IHtEYXRlfSBtaW5EYXRlXG4gKiBAcHJvcGVydHkge0RhdGV9IG1heERhdGVcbiAqIEBwcm9wZXJ0eSB7RGF0ZX0gc2VsZWN0ZWREYXRlXG4gKiBAcHJvcGVydHkge0RhdGV9IHJhbmdlRGF0ZVxuICogQHByb3BlcnR5IHtEYXRlfSBkZWZhdWx0RGF0ZVxuICovXG5cbi8qKlxuICogR2V0IGFuIG9iamVjdCBvZiB0aGUgcHJvcGVydGllcyBhbmQgZWxlbWVudHMgYmVsb25naW5nIGRpcmVjdGx5IHRvIHRoZSBnaXZlblxuICogZGF0ZSBwaWNrZXIgY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIHRoZSBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXJcbiAqIEByZXR1cm5zIHtEYXRlUGlja2VyQ29udGV4dH0gZWxlbWVudHNcbiAqL1xuY29uc3QgZ2V0RGF0ZVBpY2tlckNvbnRleHQgPSAoZWwpID0+IHtcbiAgY29uc3QgZGF0ZVBpY2tlckVsID0gZWwuY2xvc2VzdChEQVRFX1BJQ0tFUik7XG5cbiAgaWYgKCFkYXRlUGlja2VyRWwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEVsZW1lbnQgaXMgbWlzc2luZyBvdXRlciAke0RBVEVfUElDS0VSfWApO1xuICB9XG5cbiAgY29uc3QgaW50ZXJuYWxJbnB1dEVsID0gZGF0ZVBpY2tlckVsLnF1ZXJ5U2VsZWN0b3IoXG4gICAgREFURV9QSUNLRVJfSU5URVJOQUxfSU5QVVRcbiAgKTtcbiAgY29uc3QgZXh0ZXJuYWxJbnB1dEVsID0gZGF0ZVBpY2tlckVsLnF1ZXJ5U2VsZWN0b3IoXG4gICAgREFURV9QSUNLRVJfRVhURVJOQUxfSU5QVVRcbiAgKTtcbiAgY29uc3QgY2FsZW5kYXJFbCA9IGRhdGVQaWNrZXJFbC5xdWVyeVNlbGVjdG9yKERBVEVfUElDS0VSX0NBTEVOREFSKTtcbiAgY29uc3QgdG9nZ2xlQnRuRWwgPSBkYXRlUGlja2VyRWwucXVlcnlTZWxlY3RvcihEQVRFX1BJQ0tFUl9CVVRUT04pO1xuICBjb25zdCBzdGF0dXNFbCA9IGRhdGVQaWNrZXJFbC5xdWVyeVNlbGVjdG9yKERBVEVfUElDS0VSX1NUQVRVUyk7XG4gIGNvbnN0IGZpcnN0WWVhckNodW5rRWwgPSBkYXRlUGlja2VyRWwucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9ZRUFSKTtcblxuICBjb25zdCBpbnB1dERhdGUgPSBwYXJzZURhdGVTdHJpbmcoXG4gICAgZXh0ZXJuYWxJbnB1dEVsLnZhbHVlLFxuICAgIERFRkFVTFRfRVhURVJOQUxfREFURV9GT1JNQVQsXG4gICAgdHJ1ZVxuICApO1xuICBjb25zdCBzZWxlY3RlZERhdGUgPSBwYXJzZURhdGVTdHJpbmcoaW50ZXJuYWxJbnB1dEVsLnZhbHVlKTtcblxuICBjb25zdCBjYWxlbmRhckRhdGUgPSBwYXJzZURhdGVTdHJpbmcoY2FsZW5kYXJFbC5kYXRhc2V0LnZhbHVlKTtcbiAgY29uc3QgbWluRGF0ZSA9IHBhcnNlRGF0ZVN0cmluZyhkYXRlUGlja2VyRWwuZGF0YXNldC5taW5EYXRlKTtcbiAgY29uc3QgbWF4RGF0ZSA9IHBhcnNlRGF0ZVN0cmluZyhkYXRlUGlja2VyRWwuZGF0YXNldC5tYXhEYXRlKTtcbiAgY29uc3QgcmFuZ2VEYXRlID0gcGFyc2VEYXRlU3RyaW5nKGRhdGVQaWNrZXJFbC5kYXRhc2V0LnJhbmdlRGF0ZSk7XG4gIGNvbnN0IGRlZmF1bHREYXRlID0gcGFyc2VEYXRlU3RyaW5nKGRhdGVQaWNrZXJFbC5kYXRhc2V0LmRlZmF1bHREYXRlKTtcblxuICBpZiAobWluRGF0ZSAmJiBtYXhEYXRlICYmIG1pbkRhdGUgPiBtYXhEYXRlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTWluaW11bSBkYXRlIGNhbm5vdCBiZSBhZnRlciBtYXhpbXVtIGRhdGVcIik7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGNhbGVuZGFyRGF0ZSxcbiAgICBtaW5EYXRlLFxuICAgIHRvZ2dsZUJ0bkVsLFxuICAgIHNlbGVjdGVkRGF0ZSxcbiAgICBtYXhEYXRlLFxuICAgIGZpcnN0WWVhckNodW5rRWwsXG4gICAgZGF0ZVBpY2tlckVsLFxuICAgIGlucHV0RGF0ZSxcbiAgICBpbnRlcm5hbElucHV0RWwsXG4gICAgZXh0ZXJuYWxJbnB1dEVsLFxuICAgIGNhbGVuZGFyRWwsXG4gICAgcmFuZ2VEYXRlLFxuICAgIGRlZmF1bHREYXRlLFxuICAgIHN0YXR1c0VsLFxuICB9O1xufTtcblxuLyoqXG4gKiBEaXNhYmxlIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKi9cbmNvbnN0IGRpc2FibGUgPSAoZWwpID0+IHtcbiAgY29uc3QgeyBleHRlcm5hbElucHV0RWwsIHRvZ2dsZUJ0bkVsIH0gPSBnZXREYXRlUGlja2VyQ29udGV4dChlbCk7XG5cbiAgdG9nZ2xlQnRuRWwuZGlzYWJsZWQgPSB0cnVlO1xuICBleHRlcm5hbElucHV0RWwuZGlzYWJsZWQgPSB0cnVlO1xufTtcblxuLyoqXG4gKiBFbmFibGUgdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcbiAqL1xuY29uc3QgZW5hYmxlID0gKGVsKSA9PiB7XG4gIGNvbnN0IHsgZXh0ZXJuYWxJbnB1dEVsLCB0b2dnbGVCdG5FbCB9ID0gZ2V0RGF0ZVBpY2tlckNvbnRleHQoZWwpO1xuXG4gIHRvZ2dsZUJ0bkVsLmRpc2FibGVkID0gZmFsc2U7XG4gIGV4dGVybmFsSW5wdXRFbC5kaXNhYmxlZCA9IGZhbHNlO1xufTtcblxuLy8gI3JlZ2lvbiBWYWxpZGF0aW9uXG5cbi8qKlxuICogVmFsaWRhdGUgdGhlIHZhbHVlIGluIHRoZSBpbnB1dCBhcyBhIHZhbGlkIGRhdGUgb2YgZm9ybWF0IE0vRC9ZWVlZXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICovXG5jb25zdCBpc0RhdGVJbnB1dEludmFsaWQgPSAoZWwpID0+IHtcbiAgY29uc3QgeyBleHRlcm5hbElucHV0RWwsIG1pbkRhdGUsIG1heERhdGUgfSA9IGdldERhdGVQaWNrZXJDb250ZXh0KGVsKTtcblxuICBjb25zdCBkYXRlU3RyaW5nID0gZXh0ZXJuYWxJbnB1dEVsLnZhbHVlO1xuICBsZXQgaXNJbnZhbGlkID0gZmFsc2U7XG5cbiAgaWYgKGRhdGVTdHJpbmcpIHtcbiAgICBpc0ludmFsaWQgPSB0cnVlO1xuXG4gICAgY29uc3QgZGF0ZVN0cmluZ1BhcnRzID0gZGF0ZVN0cmluZy5zcGxpdChcIi9cIik7XG4gICAgY29uc3QgW21vbnRoLCBkYXksIHllYXJdID0gZGF0ZVN0cmluZ1BhcnRzLm1hcCgoc3RyKSA9PiB7XG4gICAgICBsZXQgdmFsdWU7XG4gICAgICBjb25zdCBwYXJzZWQgPSBwYXJzZUludChzdHIsIDEwKTtcbiAgICAgIGlmICghTnVtYmVyLmlzTmFOKHBhcnNlZCkpIHZhbHVlID0gcGFyc2VkO1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH0pO1xuXG4gICAgaWYgKG1vbnRoICYmIGRheSAmJiB5ZWFyICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IGNoZWNrRGF0ZSA9IHNldERhdGUoeWVhciwgbW9udGggLSAxLCBkYXkpO1xuXG4gICAgICBpZiAoXG4gICAgICAgIGNoZWNrRGF0ZS5nZXRNb250aCgpID09PSBtb250aCAtIDEgJiZcbiAgICAgICAgY2hlY2tEYXRlLmdldERhdGUoKSA9PT0gZGF5ICYmXG4gICAgICAgIGNoZWNrRGF0ZS5nZXRGdWxsWWVhcigpID09PSB5ZWFyICYmXG4gICAgICAgIGRhdGVTdHJpbmdQYXJ0c1syXS5sZW5ndGggPT09IDQgJiZcbiAgICAgICAgaXNEYXRlV2l0aGluTWluQW5kTWF4KGNoZWNrRGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSlcbiAgICAgICkge1xuICAgICAgICBpc0ludmFsaWQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gaXNJbnZhbGlkO1xufTtcblxuLyoqXG4gKiBWYWxpZGF0ZSB0aGUgdmFsdWUgaW4gdGhlIGlucHV0IGFzIGEgdmFsaWQgZGF0ZSBvZiBmb3JtYXQgTS9EL1lZWVlcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKi9cbmNvbnN0IHZhbGlkYXRlRGF0ZUlucHV0ID0gKGVsKSA9PiB7XG4gIGNvbnN0IHsgZXh0ZXJuYWxJbnB1dEVsIH0gPSBnZXREYXRlUGlja2VyQ29udGV4dChlbCk7XG4gIGNvbnN0IGlzSW52YWxpZCA9IGlzRGF0ZUlucHV0SW52YWxpZChleHRlcm5hbElucHV0RWwpO1xuXG4gIGlmIChpc0ludmFsaWQgJiYgIWV4dGVybmFsSW5wdXRFbC52YWxpZGF0aW9uTWVzc2FnZSkge1xuICAgIGV4dGVybmFsSW5wdXRFbC5zZXRDdXN0b21WYWxpZGl0eShWQUxJREFUSU9OX01FU1NBR0UpO1xuICB9XG5cbiAgaWYgKCFpc0ludmFsaWQgJiYgZXh0ZXJuYWxJbnB1dEVsLnZhbGlkYXRpb25NZXNzYWdlID09PSBWQUxJREFUSU9OX01FU1NBR0UpIHtcbiAgICBleHRlcm5hbElucHV0RWwuc2V0Q3VzdG9tVmFsaWRpdHkoXCJcIik7XG4gIH1cbn07XG5cbi8vICNlbmRyZWdpb24gVmFsaWRhdGlvblxuXG4vKipcbiAqIEVuYWJsZSB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICovXG5jb25zdCByZWNvbmNpbGVJbnB1dFZhbHVlcyA9IChlbCkgPT4ge1xuICBjb25zdCB7IGludGVybmFsSW5wdXRFbCwgaW5wdXREYXRlIH0gPSBnZXREYXRlUGlja2VyQ29udGV4dChlbCk7XG4gIGxldCBuZXdWYWx1ZSA9IFwiXCI7XG5cbiAgaWYgKGlucHV0RGF0ZSAmJiAhaXNEYXRlSW5wdXRJbnZhbGlkKGVsKSkge1xuICAgIG5ld1ZhbHVlID0gZm9ybWF0RGF0ZShpbnB1dERhdGUpO1xuICB9XG5cbiAgaWYgKGludGVybmFsSW5wdXRFbC52YWx1ZSAhPT0gbmV3VmFsdWUpIHtcbiAgICBjaGFuZ2VFbGVtZW50VmFsdWUoaW50ZXJuYWxJbnB1dEVsLCBuZXdWYWx1ZSk7XG4gIH1cbn07XG5cbi8qKlxuICogU2VsZWN0IHRoZSB2YWx1ZSBvZiB0aGUgZGF0ZSBwaWNrZXIgaW5wdXRzLlxuICpcbiAqIEBwYXJhbSB7SFRNTEJ1dHRvbkVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcbiAqIEBwYXJhbSB7c3RyaW5nfSBkYXRlU3RyaW5nIFRoZSBkYXRlIHN0cmluZyB0byB1cGRhdGUgaW4gWVlZWS1NTS1ERCBmb3JtYXRcbiAqL1xuY29uc3Qgc2V0Q2FsZW5kYXJWYWx1ZSA9IChlbCwgZGF0ZVN0cmluZykgPT4ge1xuICBjb25zdCBwYXJzZWREYXRlID0gcGFyc2VEYXRlU3RyaW5nKGRhdGVTdHJpbmcpO1xuXG4gIGlmIChwYXJzZWREYXRlKSB7XG4gICAgY29uc3QgZm9ybWF0dGVkRGF0ZSA9IGZvcm1hdERhdGUocGFyc2VkRGF0ZSwgREVGQVVMVF9FWFRFUk5BTF9EQVRFX0ZPUk1BVCk7XG5cbiAgICBjb25zdCB7IGRhdGVQaWNrZXJFbCwgaW50ZXJuYWxJbnB1dEVsLCBleHRlcm5hbElucHV0RWwgfSA9XG4gICAgICBnZXREYXRlUGlja2VyQ29udGV4dChlbCk7XG5cbiAgICBjaGFuZ2VFbGVtZW50VmFsdWUoaW50ZXJuYWxJbnB1dEVsLCBkYXRlU3RyaW5nKTtcbiAgICBjaGFuZ2VFbGVtZW50VmFsdWUoZXh0ZXJuYWxJbnB1dEVsLCBmb3JtYXR0ZWREYXRlKTtcblxuICAgIHZhbGlkYXRlRGF0ZUlucHV0KGRhdGVQaWNrZXJFbCk7XG4gIH1cbn07XG5cbi8qKlxuICogRW5oYW5jZSBhbiBpbnB1dCB3aXRoIHRoZSBkYXRlIHBpY2tlciBlbGVtZW50c1xuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIFRoZSBpbml0aWFsIHdyYXBwaW5nIGVsZW1lbnQgb2YgdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICovXG5jb25zdCBlbmhhbmNlRGF0ZVBpY2tlciA9IChlbCkgPT4ge1xuICBjb25zdCBkYXRlUGlja2VyRWwgPSBlbC5jbG9zZXN0KERBVEVfUElDS0VSKTtcbiAgY29uc3QgeyBkZWZhdWx0VmFsdWUgfSA9IGRhdGVQaWNrZXJFbC5kYXRhc2V0O1xuXG4gIGNvbnN0IGludGVybmFsSW5wdXRFbCA9IGRhdGVQaWNrZXJFbC5xdWVyeVNlbGVjdG9yKGBpbnB1dGApO1xuXG4gIGlmICghaW50ZXJuYWxJbnB1dEVsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAke0RBVEVfUElDS0VSfSBpcyBtaXNzaW5nIGlubmVyIGlucHV0YCk7XG4gIH1cblxuICBpZiAoaW50ZXJuYWxJbnB1dEVsLnZhbHVlKSB7XG4gICAgaW50ZXJuYWxJbnB1dEVsLnZhbHVlID0gXCJcIjtcbiAgfVxuXG4gIGNvbnN0IG1pbkRhdGUgPSBwYXJzZURhdGVTdHJpbmcoXG4gICAgZGF0ZVBpY2tlckVsLmRhdGFzZXQubWluRGF0ZSB8fCBpbnRlcm5hbElucHV0RWwuZ2V0QXR0cmlidXRlKFwibWluXCIpXG4gICk7XG4gIGRhdGVQaWNrZXJFbC5kYXRhc2V0Lm1pbkRhdGUgPSBtaW5EYXRlXG4gICAgPyBmb3JtYXREYXRlKG1pbkRhdGUpXG4gICAgOiBERUZBVUxUX01JTl9EQVRFO1xuXG4gIGNvbnN0IG1heERhdGUgPSBwYXJzZURhdGVTdHJpbmcoXG4gICAgZGF0ZVBpY2tlckVsLmRhdGFzZXQubWF4RGF0ZSB8fCBpbnRlcm5hbElucHV0RWwuZ2V0QXR0cmlidXRlKFwibWF4XCIpXG4gICk7XG4gIGlmIChtYXhEYXRlKSB7XG4gICAgZGF0ZVBpY2tlckVsLmRhdGFzZXQubWF4RGF0ZSA9IGZvcm1hdERhdGUobWF4RGF0ZSk7XG4gIH1cblxuICBjb25zdCBjYWxlbmRhcldyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBjYWxlbmRhcldyYXBwZXIuY2xhc3NMaXN0LmFkZChEQVRFX1BJQ0tFUl9XUkFQUEVSX0NMQVNTKTtcblxuICBjb25zdCBleHRlcm5hbElucHV0RWwgPSBpbnRlcm5hbElucHV0RWwuY2xvbmVOb2RlKCk7XG4gIGV4dGVybmFsSW5wdXRFbC5jbGFzc0xpc3QuYWRkKERBVEVfUElDS0VSX0VYVEVSTkFMX0lOUFVUX0NMQVNTKTtcbiAgZXh0ZXJuYWxJbnB1dEVsLnR5cGUgPSBcInRleHRcIjtcblxuICBjYWxlbmRhcldyYXBwZXIuYXBwZW5kQ2hpbGQoZXh0ZXJuYWxJbnB1dEVsKTtcbiAgY2FsZW5kYXJXcmFwcGVyLmluc2VydEFkamFjZW50SFRNTChcbiAgICBcImJlZm9yZWVuZFwiLFxuICAgIFNhbml0aXplci5lc2NhcGVIVE1MYFxuICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiJHtEQVRFX1BJQ0tFUl9CVVRUT05fQ0xBU1N9XCIgYXJpYS1oYXNwb3B1cD1cInRydWVcIiBhcmlhLWxhYmVsPVwiVG9nZ2xlIGNhbGVuZGFyXCI+PC9idXR0b24+XG4gICAgPGRpdiBjbGFzcz1cIiR7REFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1N9XCIgcm9sZT1cImRpYWxvZ1wiIGFyaWEtbW9kYWw9XCJ0cnVlXCIgaGlkZGVuPjwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJ1c2Etc3Itb25seSAke0RBVEVfUElDS0VSX1NUQVRVU19DTEFTU31cIiByb2xlPVwic3RhdHVzXCIgYXJpYS1saXZlPVwicG9saXRlXCI+PC9kaXY+YFxuICApO1xuXG4gIGludGVybmFsSW5wdXRFbC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWhpZGRlblwiLCBcInRydWVcIik7XG4gIGludGVybmFsSW5wdXRFbC5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCBcIi0xXCIpO1xuICBpbnRlcm5hbElucHV0RWwuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICBpbnRlcm5hbElucHV0RWwuY2xhc3NMaXN0LmFkZChEQVRFX1BJQ0tFUl9JTlRFUk5BTF9JTlBVVF9DTEFTUyk7XG4gIGludGVybmFsSW5wdXRFbC5yZW1vdmVBdHRyaWJ1dGUoXCJpZFwiKTtcbiAgaW50ZXJuYWxJbnB1dEVsLnJlbW92ZUF0dHJpYnV0ZShcIm5hbWVcIik7XG4gIGludGVybmFsSW5wdXRFbC5yZXF1aXJlZCA9IGZhbHNlO1xuXG4gIGRhdGVQaWNrZXJFbC5hcHBlbmRDaGlsZChjYWxlbmRhcldyYXBwZXIpO1xuICBkYXRlUGlja2VyRWwuY2xhc3NMaXN0LmFkZChEQVRFX1BJQ0tFUl9JTklUSUFMSVpFRF9DTEFTUyk7XG5cbiAgaWYgKGRlZmF1bHRWYWx1ZSkge1xuICAgIHNldENhbGVuZGFyVmFsdWUoZGF0ZVBpY2tlckVsLCBkZWZhdWx0VmFsdWUpO1xuICB9XG5cbiAgaWYgKGludGVybmFsSW5wdXRFbC5kaXNhYmxlZCkge1xuICAgIGRpc2FibGUoZGF0ZVBpY2tlckVsKTtcbiAgICBpbnRlcm5hbElucHV0RWwuZGlzYWJsZWQgPSBmYWxzZTtcbiAgfVxufTtcblxuLy8gI3JlZ2lvbiBDYWxlbmRhciAtIERhdGUgU2VsZWN0aW9uIFZpZXdcblxuLyoqXG4gKiByZW5kZXIgdGhlIGNhbGVuZGFyLlxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcbiAqIEBwYXJhbSB7RGF0ZX0gX2RhdGVUb0Rpc3BsYXkgYSBkYXRlIHRvIHJlbmRlciBvbiB0aGUgY2FsZW5kYXJcbiAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH0gYSByZWZlcmVuY2UgdG8gdGhlIG5ldyBjYWxlbmRhciBlbGVtZW50XG4gKi9cbmNvbnN0IHJlbmRlckNhbGVuZGFyID0gKGVsLCBfZGF0ZVRvRGlzcGxheSkgPT4ge1xuICBjb25zdCB7XG4gICAgZGF0ZVBpY2tlckVsLFxuICAgIGNhbGVuZGFyRWwsXG4gICAgc3RhdHVzRWwsXG4gICAgc2VsZWN0ZWREYXRlLFxuICAgIG1heERhdGUsXG4gICAgbWluRGF0ZSxcbiAgICByYW5nZURhdGUsXG4gIH0gPSBnZXREYXRlUGlja2VyQ29udGV4dChlbCk7XG4gIGNvbnN0IHRvZGF5c0RhdGUgPSB0b2RheSgpO1xuICBsZXQgZGF0ZVRvRGlzcGxheSA9IF9kYXRlVG9EaXNwbGF5IHx8IHRvZGF5c0RhdGU7XG5cbiAgY29uc3QgY2FsZW5kYXJXYXNIaWRkZW4gPSBjYWxlbmRhckVsLmhpZGRlbjtcblxuICBjb25zdCBmb2N1c2VkRGF0ZSA9IGFkZERheXMoZGF0ZVRvRGlzcGxheSwgMCk7XG4gIGNvbnN0IGZvY3VzZWRNb250aCA9IGRhdGVUb0Rpc3BsYXkuZ2V0TW9udGgoKTtcbiAgY29uc3QgZm9jdXNlZFllYXIgPSBkYXRlVG9EaXNwbGF5LmdldEZ1bGxZZWFyKCk7XG5cbiAgY29uc3QgcHJldk1vbnRoID0gc3ViTW9udGhzKGRhdGVUb0Rpc3BsYXksIDEpO1xuICBjb25zdCBuZXh0TW9udGggPSBhZGRNb250aHMoZGF0ZVRvRGlzcGxheSwgMSk7XG5cbiAgY29uc3QgY3VycmVudEZvcm1hdHRlZERhdGUgPSBmb3JtYXREYXRlKGRhdGVUb0Rpc3BsYXkpO1xuXG4gIGNvbnN0IGZpcnN0T2ZNb250aCA9IHN0YXJ0T2ZNb250aChkYXRlVG9EaXNwbGF5KTtcbiAgY29uc3QgcHJldkJ1dHRvbnNEaXNhYmxlZCA9IGlzU2FtZU1vbnRoKGRhdGVUb0Rpc3BsYXksIG1pbkRhdGUpO1xuICBjb25zdCBuZXh0QnV0dG9uc0Rpc2FibGVkID0gaXNTYW1lTW9udGgoZGF0ZVRvRGlzcGxheSwgbWF4RGF0ZSk7XG5cbiAgY29uc3QgcmFuZ2VDb25jbHVzaW9uRGF0ZSA9IHNlbGVjdGVkRGF0ZSB8fCBkYXRlVG9EaXNwbGF5O1xuICBjb25zdCByYW5nZVN0YXJ0RGF0ZSA9IHJhbmdlRGF0ZSAmJiBtaW4ocmFuZ2VDb25jbHVzaW9uRGF0ZSwgcmFuZ2VEYXRlKTtcbiAgY29uc3QgcmFuZ2VFbmREYXRlID0gcmFuZ2VEYXRlICYmIG1heChyYW5nZUNvbmNsdXNpb25EYXRlLCByYW5nZURhdGUpO1xuXG4gIGNvbnN0IHdpdGhpblJhbmdlU3RhcnREYXRlID0gcmFuZ2VEYXRlICYmIGFkZERheXMocmFuZ2VTdGFydERhdGUsIDEpO1xuICBjb25zdCB3aXRoaW5SYW5nZUVuZERhdGUgPSByYW5nZURhdGUgJiYgc3ViRGF5cyhyYW5nZUVuZERhdGUsIDEpO1xuXG4gIGNvbnN0IG1vbnRoTGFiZWwgPSBNT05USF9MQUJFTFNbZm9jdXNlZE1vbnRoXTtcblxuICBjb25zdCBnZW5lcmF0ZURhdGVIdG1sID0gKGRhdGVUb1JlbmRlcikgPT4ge1xuICAgIGNvbnN0IGNsYXNzZXMgPSBbQ0FMRU5EQVJfREFURV9DTEFTU107XG4gICAgY29uc3QgZGF5ID0gZGF0ZVRvUmVuZGVyLmdldERhdGUoKTtcbiAgICBjb25zdCBtb250aCA9IGRhdGVUb1JlbmRlci5nZXRNb250aCgpO1xuICAgIGNvbnN0IHllYXIgPSBkYXRlVG9SZW5kZXIuZ2V0RnVsbFllYXIoKTtcbiAgICBjb25zdCBkYXlPZldlZWsgPSBkYXRlVG9SZW5kZXIuZ2V0RGF5KCk7XG5cbiAgICBjb25zdCBmb3JtYXR0ZWREYXRlID0gZm9ybWF0RGF0ZShkYXRlVG9SZW5kZXIpO1xuXG4gICAgbGV0IHRhYmluZGV4ID0gXCItMVwiO1xuXG4gICAgY29uc3QgaXNEaXNhYmxlZCA9ICFpc0RhdGVXaXRoaW5NaW5BbmRNYXgoZGF0ZVRvUmVuZGVyLCBtaW5EYXRlLCBtYXhEYXRlKTtcbiAgICBjb25zdCBpc1NlbGVjdGVkID0gaXNTYW1lRGF5KGRhdGVUb1JlbmRlciwgc2VsZWN0ZWREYXRlKTtcblxuICAgIGlmIChpc1NhbWVNb250aChkYXRlVG9SZW5kZXIsIHByZXZNb250aCkpIHtcbiAgICAgIGNsYXNzZXMucHVzaChDQUxFTkRBUl9EQVRFX1BSRVZJT1VTX01PTlRIX0NMQVNTKTtcbiAgICB9XG5cbiAgICBpZiAoaXNTYW1lTW9udGgoZGF0ZVRvUmVuZGVyLCBmb2N1c2VkRGF0ZSkpIHtcbiAgICAgIGNsYXNzZXMucHVzaChDQUxFTkRBUl9EQVRFX0NVUlJFTlRfTU9OVEhfQ0xBU1MpO1xuICAgIH1cblxuICAgIGlmIChpc1NhbWVNb250aChkYXRlVG9SZW5kZXIsIG5leHRNb250aCkpIHtcbiAgICAgIGNsYXNzZXMucHVzaChDQUxFTkRBUl9EQVRFX05FWFRfTU9OVEhfQ0xBU1MpO1xuICAgIH1cblxuICAgIGlmIChpc1NlbGVjdGVkKSB7XG4gICAgICBjbGFzc2VzLnB1c2goQ0FMRU5EQVJfREFURV9TRUxFQ1RFRF9DTEFTUyk7XG4gICAgfVxuXG4gICAgaWYgKGlzU2FtZURheShkYXRlVG9SZW5kZXIsIHRvZGF5c0RhdGUpKSB7XG4gICAgICBjbGFzc2VzLnB1c2goQ0FMRU5EQVJfREFURV9UT0RBWV9DTEFTUyk7XG4gICAgfVxuXG4gICAgaWYgKHJhbmdlRGF0ZSkge1xuICAgICAgaWYgKGlzU2FtZURheShkYXRlVG9SZW5kZXIsIHJhbmdlRGF0ZSkpIHtcbiAgICAgICAgY2xhc3Nlcy5wdXNoKENBTEVOREFSX0RBVEVfUkFOR0VfREFURV9DTEFTUyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChpc1NhbWVEYXkoZGF0ZVRvUmVuZGVyLCByYW5nZVN0YXJ0RGF0ZSkpIHtcbiAgICAgICAgY2xhc3Nlcy5wdXNoKENBTEVOREFSX0RBVEVfUkFOR0VfREFURV9TVEFSVF9DTEFTUyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChpc1NhbWVEYXkoZGF0ZVRvUmVuZGVyLCByYW5nZUVuZERhdGUpKSB7XG4gICAgICAgIGNsYXNzZXMucHVzaChDQUxFTkRBUl9EQVRFX1JBTkdFX0RBVEVfRU5EX0NMQVNTKTtcbiAgICAgIH1cblxuICAgICAgaWYgKFxuICAgICAgICBpc0RhdGVXaXRoaW5NaW5BbmRNYXgoXG4gICAgICAgICAgZGF0ZVRvUmVuZGVyLFxuICAgICAgICAgIHdpdGhpblJhbmdlU3RhcnREYXRlLFxuICAgICAgICAgIHdpdGhpblJhbmdlRW5kRGF0ZVxuICAgICAgICApXG4gICAgICApIHtcbiAgICAgICAgY2xhc3Nlcy5wdXNoKENBTEVOREFSX0RBVEVfV0lUSElOX1JBTkdFX0NMQVNTKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaXNTYW1lRGF5KGRhdGVUb1JlbmRlciwgZm9jdXNlZERhdGUpKSB7XG4gICAgICB0YWJpbmRleCA9IFwiMFwiO1xuICAgICAgY2xhc3Nlcy5wdXNoKENBTEVOREFSX0RBVEVfRk9DVVNFRF9DTEFTUyk7XG4gICAgfVxuXG4gICAgY29uc3QgbW9udGhTdHIgPSBNT05USF9MQUJFTFNbbW9udGhdO1xuICAgIGNvbnN0IGRheVN0ciA9IERBWV9PRl9XRUVLX0xBQkVMU1tkYXlPZldlZWtdO1xuXG4gICAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICBidG4uc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcImJ1dHRvblwiKTtcbiAgICBidG4uc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIiwgdGFiaW5kZXgpO1xuICAgIGJ0bi5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBjbGFzc2VzLmpvaW4oXCIgXCIpKTtcbiAgICBidG4uc2V0QXR0cmlidXRlKFwiZGF0YS1kYXlcIiwgZGF5KTtcbiAgICBidG4uc2V0QXR0cmlidXRlKFwiZGF0YS1tb250aFwiLCBtb250aCArIDEpO1xuICAgIGJ0bi5zZXRBdHRyaWJ1dGUoXCJkYXRhLXllYXJcIiwgeWVhcik7XG4gICAgYnRuLnNldEF0dHJpYnV0ZShcImRhdGEtdmFsdWVcIiwgZm9ybWF0dGVkRGF0ZSk7XG4gICAgYnRuLnNldEF0dHJpYnV0ZShcbiAgICAgIFwiYXJpYS1sYWJlbFwiLFxuICAgICAgU2FuaXRpemVyLmVzY2FwZUhUTUxgJHtkYXl9ICR7bW9udGhTdHJ9ICR7eWVhcn0gJHtkYXlTdHJ9YFxuICAgICk7XG4gICAgYnRuLnNldEF0dHJpYnV0ZShcImFyaWEtc2VsZWN0ZWRcIiwgaXNTZWxlY3RlZCA/IFwidHJ1ZVwiIDogXCJmYWxzZVwiKTtcbiAgICBpZiAoaXNEaXNhYmxlZCA9PT0gdHJ1ZSkge1xuICAgICAgYnRuLmRpc2FibGVkID0gdHJ1ZTtcbiAgICB9XG4gICAgYnRuLnRleHRDb250ZW50ID0gZGF5O1xuXG4gICAgcmV0dXJuIGJ0bjtcbiAgfTtcblxuICAvLyBzZXQgZGF0ZSB0byBmaXJzdCByZW5kZXJlZCBkYXlcbiAgZGF0ZVRvRGlzcGxheSA9IHN0YXJ0T2ZXZWVrKGZpcnN0T2ZNb250aCk7XG5cbiAgY29uc3QgZGF5cyA9IFtdO1xuXG4gIHdoaWxlIChcbiAgICBkYXlzLmxlbmd0aCA8IDI4IHx8XG4gICAgZGF0ZVRvRGlzcGxheS5nZXRNb250aCgpID09PSBmb2N1c2VkTW9udGggfHxcbiAgICBkYXlzLmxlbmd0aCAlIDcgIT09IDBcbiAgKSB7XG4gICAgZGF5cy5wdXNoKGdlbmVyYXRlRGF0ZUh0bWwoZGF0ZVRvRGlzcGxheSkpO1xuICAgIGRhdGVUb0Rpc3BsYXkgPSBhZGREYXlzKGRhdGVUb0Rpc3BsYXksIDEpO1xuICB9XG5cbiAgY29uc3QgZGF0ZXNHcmlkID0gbGlzdFRvR3JpZEh0bWwoZGF5cywgNyk7XG5cbiAgY29uc3QgbmV3Q2FsZW5kYXIgPSBjYWxlbmRhckVsLmNsb25lTm9kZSgpO1xuICBuZXdDYWxlbmRhci5kYXRhc2V0LnZhbHVlID0gY3VycmVudEZvcm1hdHRlZERhdGU7XG4gIG5ld0NhbGVuZGFyLnN0eWxlLnRvcCA9IGAke2RhdGVQaWNrZXJFbC5vZmZzZXRIZWlnaHR9cHhgO1xuICBuZXdDYWxlbmRhci5oaWRkZW4gPSBmYWxzZTtcbiAgbmV3Q2FsZW5kYXIuaW5uZXJIVE1MID0gU2FuaXRpemVyLmVzY2FwZUhUTUxgXG4gICAgPGRpdiB0YWJpbmRleD1cIi0xXCIgY2xhc3M9XCIke0NBTEVOREFSX0RBVEVfUElDS0VSX0NMQVNTfVwiPlxuICAgICAgPGRpdiBjbGFzcz1cIiR7Q0FMRU5EQVJfUk9XX0NMQVNTfVwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiJHtDQUxFTkRBUl9DRUxMX0NMQVNTfSAke0NBTEVOREFSX0NFTExfQ0VOVEVSX0lURU1TX0NMQVNTfVwiPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY2xhc3M9XCIke0NBTEVOREFSX1BSRVZJT1VTX1lFQVJfQ0xBU1N9XCJcbiAgICAgICAgICAgIGFyaWEtbGFiZWw9XCJOYXZpZ2F0ZSBiYWNrIG9uZSB5ZWFyXCJcbiAgICAgICAgICAgICR7cHJldkJ1dHRvbnNEaXNhYmxlZCA/IGBkaXNhYmxlZD1cImRpc2FibGVkXCJgIDogXCJcIn1cbiAgICAgICAgICA+PC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiJHtDQUxFTkRBUl9DRUxMX0NMQVNTfSAke0NBTEVOREFSX0NFTExfQ0VOVEVSX0lURU1TX0NMQVNTfVwiPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY2xhc3M9XCIke0NBTEVOREFSX1BSRVZJT1VTX01PTlRIX0NMQVNTfVwiXG4gICAgICAgICAgICBhcmlhLWxhYmVsPVwiTmF2aWdhdGUgYmFjayBvbmUgbW9udGhcIlxuICAgICAgICAgICAgJHtwcmV2QnV0dG9uc0Rpc2FibGVkID8gYGRpc2FibGVkPVwiZGlzYWJsZWRcImAgOiBcIlwifVxuICAgICAgICAgID48L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCIke0NBTEVOREFSX0NFTExfQ0xBU1N9ICR7Q0FMRU5EQVJfTU9OVEhfTEFCRUxfQ0xBU1N9XCI+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cIiR7Q0FMRU5EQVJfTU9OVEhfU0VMRUNUSU9OX0NMQVNTfVwiIGFyaWEtbGFiZWw9XCIke21vbnRoTGFiZWx9LiBDbGljayB0byBzZWxlY3QgbW9udGhcIlxuICAgICAgICAgID4ke21vbnRoTGFiZWx9PC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cIiR7Q0FMRU5EQVJfWUVBUl9TRUxFQ1RJT05fQ0xBU1N9XCIgYXJpYS1sYWJlbD1cIiR7Zm9jdXNlZFllYXJ9LiBDbGljayB0byBzZWxlY3QgeWVhclwiXG4gICAgICAgICAgPiR7Zm9jdXNlZFllYXJ9PC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiJHtDQUxFTkRBUl9DRUxMX0NMQVNTfSAke0NBTEVOREFSX0NFTExfQ0VOVEVSX0lURU1TX0NMQVNTfVwiPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY2xhc3M9XCIke0NBTEVOREFSX05FWFRfTU9OVEhfQ0xBU1N9XCJcbiAgICAgICAgICAgIGFyaWEtbGFiZWw9XCJOYXZpZ2F0ZSBmb3J3YXJkIG9uZSBtb250aFwiXG4gICAgICAgICAgICAke25leHRCdXR0b25zRGlzYWJsZWQgPyBgZGlzYWJsZWQ9XCJkaXNhYmxlZFwiYCA6IFwiXCJ9XG4gICAgICAgICAgPjwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIiR7Q0FMRU5EQVJfQ0VMTF9DTEFTU30gJHtDQUxFTkRBUl9DRUxMX0NFTlRFUl9JVEVNU19DTEFTU31cIj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwiJHtDQUxFTkRBUl9ORVhUX1lFQVJfQ0xBU1N9XCJcbiAgICAgICAgICAgIGFyaWEtbGFiZWw9XCJOYXZpZ2F0ZSBmb3J3YXJkIG9uZSB5ZWFyXCJcbiAgICAgICAgICAgICR7bmV4dEJ1dHRvbnNEaXNhYmxlZCA/IGBkaXNhYmxlZD1cImRpc2FibGVkXCJgIDogXCJcIn1cbiAgICAgICAgICA+PC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICAgYDtcblxuICBjb25zdCB0YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0YWJsZVwiKTtcbiAgdGFibGUuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgQ0FMRU5EQVJfVEFCTEVfQ0xBU1MpO1xuICB0YWJsZS5zZXRBdHRyaWJ1dGUoXCJyb2xlXCIsIFwicHJlc2VudGF0aW9uXCIpO1xuXG4gIGNvbnN0IHRhYmxlSGVhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0aGVhZFwiKTtcbiAgdGFibGUuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIHRhYmxlSGVhZCk7XG4gIGNvbnN0IHRhYmxlSGVhZFJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0clwiKTtcbiAgdGFibGVIZWFkLmluc2VydEFkamFjZW50RWxlbWVudChcImJlZm9yZWVuZFwiLCB0YWJsZUhlYWRSb3cpO1xuXG4gIGNvbnN0IGRheXNPZldlZWsgPSB7XG4gICAgU3VuZGF5OiBcIlNcIixcbiAgICBNb25kYXk6IFwiTVwiLFxuICAgIFR1ZXNkYXk6IFwiVFwiLFxuICAgIFdlZG5lc2RheTogXCJXXCIsXG4gICAgVGh1cnNkYXk6IFwiVGhcIixcbiAgICBGcmlkYXk6IFwiRnJcIixcbiAgICBTYXR1cmRheTogXCJTXCIsXG4gIH07XG5cbiAgT2JqZWN0LmtleXMoZGF5c09mV2VlaykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgY29uc3QgdGggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGhcIik7XG4gICAgdGguc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgQ0FMRU5EQVJfREFZX09GX1dFRUtfQ0xBU1MpO1xuICAgIHRoLnNldEF0dHJpYnV0ZShcInNjb3BlXCIsIFwicHJlc2VudGF0aW9uXCIpO1xuICAgIHRoLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwga2V5KTtcbiAgICB0aC50ZXh0Q29udGVudCA9IGRheXNPZldlZWtba2V5XTtcbiAgICB0YWJsZUhlYWRSb3cuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIHRoKTtcbiAgfSk7XG5cbiAgY29uc3QgdGFibGVCb2R5ID0gY3JlYXRlVGFibGVCb2R5KGRhdGVzR3JpZCk7XG4gIHRhYmxlLmluc2VydEFkamFjZW50RWxlbWVudChcImJlZm9yZWVuZFwiLCB0YWJsZUJvZHkpO1xuXG4gIC8vIENvbnRhaW5lciBmb3IgWWVhcnMsIE1vbnRocywgYW5kIERheXNcbiAgY29uc3QgZGF0ZVBpY2tlckNhbGVuZGFyQ29udGFpbmVyID1cbiAgICBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX0RBVEVfUElDS0VSKTtcblxuICBkYXRlUGlja2VyQ2FsZW5kYXJDb250YWluZXIuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIHRhYmxlKTtcblxuICBjYWxlbmRhckVsLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKG5ld0NhbGVuZGFyLCBjYWxlbmRhckVsKTtcblxuICBkYXRlUGlja2VyRWwuY2xhc3NMaXN0LmFkZChEQVRFX1BJQ0tFUl9BQ1RJVkVfQ0xBU1MpO1xuXG4gIGNvbnN0IHN0YXR1c2VzID0gW107XG5cbiAgaWYgKGlzU2FtZURheShzZWxlY3RlZERhdGUsIGZvY3VzZWREYXRlKSkge1xuICAgIHN0YXR1c2VzLnB1c2goXCJTZWxlY3RlZCBkYXRlXCIpO1xuICB9XG5cbiAgaWYgKGNhbGVuZGFyV2FzSGlkZGVuKSB7XG4gICAgc3RhdHVzZXMucHVzaChcbiAgICAgIFwiWW91IGNhbiBuYXZpZ2F0ZSBieSBkYXkgdXNpbmcgbGVmdCBhbmQgcmlnaHQgYXJyb3dzXCIsXG4gICAgICBcIldlZWtzIGJ5IHVzaW5nIHVwIGFuZCBkb3duIGFycm93c1wiLFxuICAgICAgXCJNb250aHMgYnkgdXNpbmcgcGFnZSB1cCBhbmQgcGFnZSBkb3duIGtleXNcIixcbiAgICAgIFwiWWVhcnMgYnkgdXNpbmcgc2hpZnQgcGx1cyBwYWdlIHVwIGFuZCBzaGlmdCBwbHVzIHBhZ2UgZG93blwiLFxuICAgICAgXCJIb21lIGFuZCBlbmQga2V5cyBuYXZpZ2F0ZSB0byB0aGUgYmVnaW5uaW5nIGFuZCBlbmQgb2YgYSB3ZWVrXCJcbiAgICApO1xuICAgIHN0YXR1c0VsLnRleHRDb250ZW50ID0gXCJcIjtcbiAgfSBlbHNlIHtcbiAgICBzdGF0dXNlcy5wdXNoKGAke21vbnRoTGFiZWx9ICR7Zm9jdXNlZFllYXJ9YCk7XG4gIH1cbiAgc3RhdHVzRWwudGV4dENvbnRlbnQgPSBzdGF0dXNlcy5qb2luKFwiLiBcIik7XG5cbiAgcmV0dXJuIG5ld0NhbGVuZGFyO1xufTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSBiYWNrIG9uZSB5ZWFyIGFuZCBkaXNwbGF5IHRoZSBjYWxlbmRhci5cbiAqXG4gKiBAcGFyYW0ge0hUTUxCdXR0b25FbGVtZW50fSBfYnV0dG9uRWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICovXG5jb25zdCBkaXNwbGF5UHJldmlvdXNZZWFyID0gKF9idXR0b25FbCkgPT4ge1xuICBpZiAoX2J1dHRvbkVsLmRpc2FibGVkKSByZXR1cm47XG4gIGNvbnN0IHsgY2FsZW5kYXJFbCwgY2FsZW5kYXJEYXRlLCBtaW5EYXRlLCBtYXhEYXRlIH0gPVxuICAgIGdldERhdGVQaWNrZXJDb250ZXh0KF9idXR0b25FbCk7XG4gIGxldCBkYXRlID0gc3ViWWVhcnMoY2FsZW5kYXJEYXRlLCAxKTtcbiAgZGF0ZSA9IGtlZXBEYXRlQmV0d2Vlbk1pbkFuZE1heChkYXRlLCBtaW5EYXRlLCBtYXhEYXRlKTtcbiAgY29uc3QgbmV3Q2FsZW5kYXIgPSByZW5kZXJDYWxlbmRhcihjYWxlbmRhckVsLCBkYXRlKTtcblxuICBsZXQgbmV4dFRvRm9jdXMgPSBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX1BSRVZJT1VTX1lFQVIpO1xuICBpZiAobmV4dFRvRm9jdXMuZGlzYWJsZWQpIHtcbiAgICBuZXh0VG9Gb2N1cyA9IG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfREFURV9QSUNLRVIpO1xuICB9XG4gIG5leHRUb0ZvY3VzLmZvY3VzKCk7XG59O1xuXG4vKipcbiAqIE5hdmlnYXRlIGJhY2sgb25lIG1vbnRoIGFuZCBkaXNwbGF5IHRoZSBjYWxlbmRhci5cbiAqXG4gKiBAcGFyYW0ge0hUTUxCdXR0b25FbGVtZW50fSBfYnV0dG9uRWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICovXG5jb25zdCBkaXNwbGF5UHJldmlvdXNNb250aCA9IChfYnV0dG9uRWwpID0+IHtcbiAgaWYgKF9idXR0b25FbC5kaXNhYmxlZCkgcmV0dXJuO1xuICBjb25zdCB7IGNhbGVuZGFyRWwsIGNhbGVuZGFyRGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSB9ID1cbiAgICBnZXREYXRlUGlja2VyQ29udGV4dChfYnV0dG9uRWwpO1xuICBsZXQgZGF0ZSA9IHN1Yk1vbnRocyhjYWxlbmRhckRhdGUsIDEpO1xuICBkYXRlID0ga2VlcERhdGVCZXR3ZWVuTWluQW5kTWF4KGRhdGUsIG1pbkRhdGUsIG1heERhdGUpO1xuICBjb25zdCBuZXdDYWxlbmRhciA9IHJlbmRlckNhbGVuZGFyKGNhbGVuZGFyRWwsIGRhdGUpO1xuXG4gIGxldCBuZXh0VG9Gb2N1cyA9IG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfUFJFVklPVVNfTU9OVEgpO1xuICBpZiAobmV4dFRvRm9jdXMuZGlzYWJsZWQpIHtcbiAgICBuZXh0VG9Gb2N1cyA9IG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfREFURV9QSUNLRVIpO1xuICB9XG4gIG5leHRUb0ZvY3VzLmZvY3VzKCk7XG59O1xuXG4vKipcbiAqIE5hdmlnYXRlIGZvcndhcmQgb25lIG1vbnRoIGFuZCBkaXNwbGF5IHRoZSBjYWxlbmRhci5cbiAqXG4gKiBAcGFyYW0ge0hUTUxCdXR0b25FbGVtZW50fSBfYnV0dG9uRWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICovXG5jb25zdCBkaXNwbGF5TmV4dE1vbnRoID0gKF9idXR0b25FbCkgPT4ge1xuICBpZiAoX2J1dHRvbkVsLmRpc2FibGVkKSByZXR1cm47XG4gIGNvbnN0IHsgY2FsZW5kYXJFbCwgY2FsZW5kYXJEYXRlLCBtaW5EYXRlLCBtYXhEYXRlIH0gPVxuICAgIGdldERhdGVQaWNrZXJDb250ZXh0KF9idXR0b25FbCk7XG4gIGxldCBkYXRlID0gYWRkTW9udGhzKGNhbGVuZGFyRGF0ZSwgMSk7XG4gIGRhdGUgPSBrZWVwRGF0ZUJldHdlZW5NaW5BbmRNYXgoZGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSk7XG4gIGNvbnN0IG5ld0NhbGVuZGFyID0gcmVuZGVyQ2FsZW5kYXIoY2FsZW5kYXJFbCwgZGF0ZSk7XG5cbiAgbGV0IG5leHRUb0ZvY3VzID0gbmV3Q2FsZW5kYXIucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9ORVhUX01PTlRIKTtcbiAgaWYgKG5leHRUb0ZvY3VzLmRpc2FibGVkKSB7XG4gICAgbmV4dFRvRm9jdXMgPSBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX0RBVEVfUElDS0VSKTtcbiAgfVxuICBuZXh0VG9Gb2N1cy5mb2N1cygpO1xufTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSBmb3J3YXJkIG9uZSB5ZWFyIGFuZCBkaXNwbGF5IHRoZSBjYWxlbmRhci5cbiAqXG4gKiBAcGFyYW0ge0hUTUxCdXR0b25FbGVtZW50fSBfYnV0dG9uRWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICovXG5jb25zdCBkaXNwbGF5TmV4dFllYXIgPSAoX2J1dHRvbkVsKSA9PiB7XG4gIGlmIChfYnV0dG9uRWwuZGlzYWJsZWQpIHJldHVybjtcbiAgY29uc3QgeyBjYWxlbmRhckVsLCBjYWxlbmRhckRhdGUsIG1pbkRhdGUsIG1heERhdGUgfSA9XG4gICAgZ2V0RGF0ZVBpY2tlckNvbnRleHQoX2J1dHRvbkVsKTtcbiAgbGV0IGRhdGUgPSBhZGRZZWFycyhjYWxlbmRhckRhdGUsIDEpO1xuICBkYXRlID0ga2VlcERhdGVCZXR3ZWVuTWluQW5kTWF4KGRhdGUsIG1pbkRhdGUsIG1heERhdGUpO1xuICBjb25zdCBuZXdDYWxlbmRhciA9IHJlbmRlckNhbGVuZGFyKGNhbGVuZGFyRWwsIGRhdGUpO1xuXG4gIGxldCBuZXh0VG9Gb2N1cyA9IG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfTkVYVF9ZRUFSKTtcbiAgaWYgKG5leHRUb0ZvY3VzLmRpc2FibGVkKSB7XG4gICAgbmV4dFRvRm9jdXMgPSBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX0RBVEVfUElDS0VSKTtcbiAgfVxuICBuZXh0VG9Gb2N1cy5mb2N1cygpO1xufTtcblxuLyoqXG4gKiBIaWRlIHRoZSBjYWxlbmRhciBvZiBhIGRhdGUgcGlja2VyIGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKi9cbmNvbnN0IGhpZGVDYWxlbmRhciA9IChlbCkgPT4ge1xuICBjb25zdCB7IGRhdGVQaWNrZXJFbCwgY2FsZW5kYXJFbCwgc3RhdHVzRWwgfSA9IGdldERhdGVQaWNrZXJDb250ZXh0KGVsKTtcblxuICBkYXRlUGlja2VyRWwuY2xhc3NMaXN0LnJlbW92ZShEQVRFX1BJQ0tFUl9BQ1RJVkVfQ0xBU1MpO1xuICBjYWxlbmRhckVsLmhpZGRlbiA9IHRydWU7XG4gIHN0YXR1c0VsLnRleHRDb250ZW50ID0gXCJcIjtcbn07XG5cbi8qKlxuICogU2VsZWN0IGEgZGF0ZSB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0ge0hUTUxCdXR0b25FbGVtZW50fSBjYWxlbmRhckRhdGVFbCBBIGRhdGUgZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICovXG5jb25zdCBzZWxlY3REYXRlID0gKGNhbGVuZGFyRGF0ZUVsKSA9PiB7XG4gIGlmIChjYWxlbmRhckRhdGVFbC5kaXNhYmxlZCkgcmV0dXJuO1xuXG4gIGNvbnN0IHsgZGF0ZVBpY2tlckVsLCBleHRlcm5hbElucHV0RWwgfSA9XG4gICAgZ2V0RGF0ZVBpY2tlckNvbnRleHQoY2FsZW5kYXJEYXRlRWwpO1xuXG4gIHNldENhbGVuZGFyVmFsdWUoY2FsZW5kYXJEYXRlRWwsIGNhbGVuZGFyRGF0ZUVsLmRhdGFzZXQudmFsdWUpO1xuICBoaWRlQ2FsZW5kYXIoZGF0ZVBpY2tlckVsKTtcblxuICBleHRlcm5hbElucHV0RWwuZm9jdXMoKTtcbn07XG5cbi8qKlxuICogVG9nZ2xlIHRoZSBjYWxlbmRhci5cbiAqXG4gKiBAcGFyYW0ge0hUTUxCdXR0b25FbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKi9cbmNvbnN0IHRvZ2dsZUNhbGVuZGFyID0gKGVsKSA9PiB7XG4gIGlmIChlbC5kaXNhYmxlZCkgcmV0dXJuO1xuICBjb25zdCB7IGNhbGVuZGFyRWwsIGlucHV0RGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSwgZGVmYXVsdERhdGUgfSA9XG4gICAgZ2V0RGF0ZVBpY2tlckNvbnRleHQoZWwpO1xuXG4gIGlmIChjYWxlbmRhckVsLmhpZGRlbikge1xuICAgIGNvbnN0IGRhdGVUb0Rpc3BsYXkgPSBrZWVwRGF0ZUJldHdlZW5NaW5BbmRNYXgoXG4gICAgICBpbnB1dERhdGUgfHwgZGVmYXVsdERhdGUgfHwgdG9kYXkoKSxcbiAgICAgIG1pbkRhdGUsXG4gICAgICBtYXhEYXRlXG4gICAgKTtcbiAgICBjb25zdCBuZXdDYWxlbmRhciA9IHJlbmRlckNhbGVuZGFyKGNhbGVuZGFyRWwsIGRhdGVUb0Rpc3BsYXkpO1xuICAgIG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfREFURV9GT0NVU0VEKS5mb2N1cygpO1xuICB9IGVsc2Uge1xuICAgIGhpZGVDYWxlbmRhcihlbCk7XG4gIH1cbn07XG5cbi8qKlxuICogVXBkYXRlIHRoZSBjYWxlbmRhciB3aGVuIHZpc2libGUuXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgYW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyXG4gKi9cbmNvbnN0IHVwZGF0ZUNhbGVuZGFySWZWaXNpYmxlID0gKGVsKSA9PiB7XG4gIGNvbnN0IHsgY2FsZW5kYXJFbCwgaW5wdXREYXRlLCBtaW5EYXRlLCBtYXhEYXRlIH0gPSBnZXREYXRlUGlja2VyQ29udGV4dChlbCk7XG4gIGNvbnN0IGNhbGVuZGFyU2hvd24gPSAhY2FsZW5kYXJFbC5oaWRkZW47XG5cbiAgaWYgKGNhbGVuZGFyU2hvd24gJiYgaW5wdXREYXRlKSB7XG4gICAgY29uc3QgZGF0ZVRvRGlzcGxheSA9IGtlZXBEYXRlQmV0d2Vlbk1pbkFuZE1heChpbnB1dERhdGUsIG1pbkRhdGUsIG1heERhdGUpO1xuICAgIHJlbmRlckNhbGVuZGFyKGNhbGVuZGFyRWwsIGRhdGVUb0Rpc3BsYXkpO1xuICB9XG59O1xuXG4vLyAjZW5kcmVnaW9uIENhbGVuZGFyIC0gRGF0ZSBTZWxlY3Rpb24gVmlld1xuXG4vLyAjcmVnaW9uIENhbGVuZGFyIC0gTW9udGggU2VsZWN0aW9uIFZpZXdcbi8qKlxuICogRGlzcGxheSB0aGUgbW9udGggc2VsZWN0aW9uIHNjcmVlbiBpbiB0aGUgZGF0ZSBwaWNrZXIuXG4gKlxuICogQHBhcmFtIHtIVE1MQnV0dG9uRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICogQHJldHVybnMge0hUTUxFbGVtZW50fSBhIHJlZmVyZW5jZSB0byB0aGUgbmV3IGNhbGVuZGFyIGVsZW1lbnRcbiAqL1xuY29uc3QgZGlzcGxheU1vbnRoU2VsZWN0aW9uID0gKGVsLCBtb250aFRvRGlzcGxheSkgPT4ge1xuICBjb25zdCB7IGNhbGVuZGFyRWwsIHN0YXR1c0VsLCBjYWxlbmRhckRhdGUsIG1pbkRhdGUsIG1heERhdGUgfSA9XG4gICAgZ2V0RGF0ZVBpY2tlckNvbnRleHQoZWwpO1xuXG4gIGNvbnN0IHNlbGVjdGVkTW9udGggPSBjYWxlbmRhckRhdGUuZ2V0TW9udGgoKTtcbiAgY29uc3QgZm9jdXNlZE1vbnRoID0gbW9udGhUb0Rpc3BsYXkgPT0gbnVsbCA/IHNlbGVjdGVkTW9udGggOiBtb250aFRvRGlzcGxheTtcblxuICBjb25zdCBtb250aHMgPSBNT05USF9MQUJFTFMubWFwKChtb250aCwgaW5kZXgpID0+IHtcbiAgICBjb25zdCBtb250aFRvQ2hlY2sgPSBzZXRNb250aChjYWxlbmRhckRhdGUsIGluZGV4KTtcblxuICAgIGNvbnN0IGlzRGlzYWJsZWQgPSBpc0RhdGVzTW9udGhPdXRzaWRlTWluT3JNYXgoXG4gICAgICBtb250aFRvQ2hlY2ssXG4gICAgICBtaW5EYXRlLFxuICAgICAgbWF4RGF0ZVxuICAgICk7XG5cbiAgICBsZXQgdGFiaW5kZXggPSBcIi0xXCI7XG5cbiAgICBjb25zdCBjbGFzc2VzID0gW0NBTEVOREFSX01PTlRIX0NMQVNTXTtcbiAgICBjb25zdCBpc1NlbGVjdGVkID0gaW5kZXggPT09IHNlbGVjdGVkTW9udGg7XG5cbiAgICBpZiAoaW5kZXggPT09IGZvY3VzZWRNb250aCkge1xuICAgICAgdGFiaW5kZXggPSBcIjBcIjtcbiAgICAgIGNsYXNzZXMucHVzaChDQUxFTkRBUl9NT05USF9GT0NVU0VEX0NMQVNTKTtcbiAgICB9XG5cbiAgICBpZiAoaXNTZWxlY3RlZCkge1xuICAgICAgY2xhc3Nlcy5wdXNoKENBTEVOREFSX01PTlRIX1NFTEVDVEVEX0NMQVNTKTtcbiAgICB9XG5cbiAgICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgIGJ0bi5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsIFwiYnV0dG9uXCIpO1xuICAgIGJ0bi5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCB0YWJpbmRleCk7XG4gICAgYnRuLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIGNsYXNzZXMuam9pbihcIiBcIikpO1xuICAgIGJ0bi5zZXRBdHRyaWJ1dGUoXCJkYXRhLXZhbHVlXCIsIGluZGV4KTtcbiAgICBidG4uc2V0QXR0cmlidXRlKFwiZGF0YS1sYWJlbFwiLCBtb250aCk7XG4gICAgYnRuLnNldEF0dHJpYnV0ZShcImFyaWEtc2VsZWN0ZWRcIiwgaXNTZWxlY3RlZCA/IFwidHJ1ZVwiIDogXCJmYWxzZVwiKTtcbiAgICBpZiAoaXNEaXNhYmxlZCA9PT0gdHJ1ZSkge1xuICAgICAgYnRuLmRpc2FibGVkID0gdHJ1ZTtcbiAgICB9XG4gICAgYnRuLnRleHRDb250ZW50ID0gbW9udGg7XG5cbiAgICByZXR1cm4gYnRuO1xuICB9KTtcblxuICBjb25zdCBtb250aHNIdG1sID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgbW9udGhzSHRtbC5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCBcIi0xXCIpO1xuICBtb250aHNIdG1sLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIENBTEVOREFSX01PTlRIX1BJQ0tFUl9DTEFTUyk7XG5cbiAgY29uc3QgdGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGFibGVcIik7XG4gIHRhYmxlLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIENBTEVOREFSX1RBQkxFX0NMQVNTKTtcbiAgdGFibGUuc2V0QXR0cmlidXRlKFwicm9sZVwiLCBcInByZXNlbnRhdGlvblwiKTtcblxuICBjb25zdCBtb250aHNHcmlkID0gbGlzdFRvR3JpZEh0bWwobW9udGhzLCAzKTtcbiAgY29uc3QgdGFibGVCb2R5ID0gY3JlYXRlVGFibGVCb2R5KG1vbnRoc0dyaWQpO1xuICB0YWJsZS5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJiZWZvcmVlbmRcIiwgdGFibGVCb2R5KTtcbiAgbW9udGhzSHRtbC5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJiZWZvcmVlbmRcIiwgdGFibGUpO1xuXG4gIGNvbnN0IG5ld0NhbGVuZGFyID0gY2FsZW5kYXJFbC5jbG9uZU5vZGUoKTtcbiAgbmV3Q2FsZW5kYXIuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIG1vbnRoc0h0bWwpO1xuICBjYWxlbmRhckVsLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKG5ld0NhbGVuZGFyLCBjYWxlbmRhckVsKTtcblxuICBzdGF0dXNFbC50ZXh0Q29udGVudCA9IFwiU2VsZWN0IGEgbW9udGguXCI7XG5cbiAgcmV0dXJuIG5ld0NhbGVuZGFyO1xufTtcblxuLyoqXG4gKiBTZWxlY3QgYSBtb250aCBpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSB7SFRNTEJ1dHRvbkVsZW1lbnR9IG1vbnRoRWwgQW4gbW9udGggZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICovXG5jb25zdCBzZWxlY3RNb250aCA9IChtb250aEVsKSA9PiB7XG4gIGlmIChtb250aEVsLmRpc2FibGVkKSByZXR1cm47XG4gIGNvbnN0IHsgY2FsZW5kYXJFbCwgY2FsZW5kYXJEYXRlLCBtaW5EYXRlLCBtYXhEYXRlIH0gPVxuICAgIGdldERhdGVQaWNrZXJDb250ZXh0KG1vbnRoRWwpO1xuICBjb25zdCBzZWxlY3RlZE1vbnRoID0gcGFyc2VJbnQobW9udGhFbC5kYXRhc2V0LnZhbHVlLCAxMCk7XG4gIGxldCBkYXRlID0gc2V0TW9udGgoY2FsZW5kYXJEYXRlLCBzZWxlY3RlZE1vbnRoKTtcbiAgZGF0ZSA9IGtlZXBEYXRlQmV0d2Vlbk1pbkFuZE1heChkYXRlLCBtaW5EYXRlLCBtYXhEYXRlKTtcbiAgY29uc3QgbmV3Q2FsZW5kYXIgPSByZW5kZXJDYWxlbmRhcihjYWxlbmRhckVsLCBkYXRlKTtcbiAgbmV3Q2FsZW5kYXIucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9EQVRFX0ZPQ1VTRUQpLmZvY3VzKCk7XG59O1xuXG4vLyAjZW5kcmVnaW9uIENhbGVuZGFyIC0gTW9udGggU2VsZWN0aW9uIFZpZXdcblxuLy8gI3JlZ2lvbiBDYWxlbmRhciAtIFllYXIgU2VsZWN0aW9uIFZpZXdcblxuLyoqXG4gKiBEaXNwbGF5IHRoZSB5ZWFyIHNlbGVjdGlvbiBzY3JlZW4gaW4gdGhlIGRhdGUgcGlja2VyLlxuICpcbiAqIEBwYXJhbSB7SFRNTEJ1dHRvbkVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcbiAqIEBwYXJhbSB7bnVtYmVyfSB5ZWFyVG9EaXNwbGF5IHllYXIgdG8gZGlzcGxheSBpbiB5ZWFyIHNlbGVjdGlvblxuICogQHJldHVybnMge0hUTUxFbGVtZW50fSBhIHJlZmVyZW5jZSB0byB0aGUgbmV3IGNhbGVuZGFyIGVsZW1lbnRcbiAqL1xuY29uc3QgZGlzcGxheVllYXJTZWxlY3Rpb24gPSAoZWwsIHllYXJUb0Rpc3BsYXkpID0+IHtcbiAgY29uc3QgeyBjYWxlbmRhckVsLCBzdGF0dXNFbCwgY2FsZW5kYXJEYXRlLCBtaW5EYXRlLCBtYXhEYXRlIH0gPVxuICAgIGdldERhdGVQaWNrZXJDb250ZXh0KGVsKTtcblxuICBjb25zdCBzZWxlY3RlZFllYXIgPSBjYWxlbmRhckRhdGUuZ2V0RnVsbFllYXIoKTtcbiAgY29uc3QgZm9jdXNlZFllYXIgPSB5ZWFyVG9EaXNwbGF5ID09IG51bGwgPyBzZWxlY3RlZFllYXIgOiB5ZWFyVG9EaXNwbGF5O1xuXG4gIGxldCB5ZWFyVG9DaHVuayA9IGZvY3VzZWRZZWFyO1xuICB5ZWFyVG9DaHVuayAtPSB5ZWFyVG9DaHVuayAlIFlFQVJfQ0hVTks7XG4gIHllYXJUb0NodW5rID0gTWF0aC5tYXgoMCwgeWVhclRvQ2h1bmspO1xuXG4gIGNvbnN0IHByZXZZZWFyQ2h1bmtEaXNhYmxlZCA9IGlzRGF0ZXNZZWFyT3V0c2lkZU1pbk9yTWF4KFxuICAgIHNldFllYXIoY2FsZW5kYXJEYXRlLCB5ZWFyVG9DaHVuayAtIDEpLFxuICAgIG1pbkRhdGUsXG4gICAgbWF4RGF0ZVxuICApO1xuXG4gIGNvbnN0IG5leHRZZWFyQ2h1bmtEaXNhYmxlZCA9IGlzRGF0ZXNZZWFyT3V0c2lkZU1pbk9yTWF4KFxuICAgIHNldFllYXIoY2FsZW5kYXJEYXRlLCB5ZWFyVG9DaHVuayArIFlFQVJfQ0hVTkspLFxuICAgIG1pbkRhdGUsXG4gICAgbWF4RGF0ZVxuICApO1xuXG4gIGNvbnN0IHllYXJzID0gW107XG4gIGxldCB5ZWFySW5kZXggPSB5ZWFyVG9DaHVuaztcbiAgd2hpbGUgKHllYXJzLmxlbmd0aCA8IFlFQVJfQ0hVTkspIHtcbiAgICBjb25zdCBpc0Rpc2FibGVkID0gaXNEYXRlc1llYXJPdXRzaWRlTWluT3JNYXgoXG4gICAgICBzZXRZZWFyKGNhbGVuZGFyRGF0ZSwgeWVhckluZGV4KSxcbiAgICAgIG1pbkRhdGUsXG4gICAgICBtYXhEYXRlXG4gICAgKTtcblxuICAgIGxldCB0YWJpbmRleCA9IFwiLTFcIjtcblxuICAgIGNvbnN0IGNsYXNzZXMgPSBbQ0FMRU5EQVJfWUVBUl9DTEFTU107XG4gICAgY29uc3QgaXNTZWxlY3RlZCA9IHllYXJJbmRleCA9PT0gc2VsZWN0ZWRZZWFyO1xuXG4gICAgaWYgKHllYXJJbmRleCA9PT0gZm9jdXNlZFllYXIpIHtcbiAgICAgIHRhYmluZGV4ID0gXCIwXCI7XG4gICAgICBjbGFzc2VzLnB1c2goQ0FMRU5EQVJfWUVBUl9GT0NVU0VEX0NMQVNTKTtcbiAgICB9XG5cbiAgICBpZiAoaXNTZWxlY3RlZCkge1xuICAgICAgY2xhc3Nlcy5wdXNoKENBTEVOREFSX1lFQVJfU0VMRUNURURfQ0xBU1MpO1xuICAgIH1cblxuICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgYnRuLnNldEF0dHJpYnV0ZShcInR5cGVcIiwgXCJidXR0b25cIik7XG4gICAgYnRuLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIHRhYmluZGV4KTtcbiAgICBidG4uc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgY2xhc3Nlcy5qb2luKFwiIFwiKSk7XG4gICAgYnRuLnNldEF0dHJpYnV0ZShcImRhdGEtdmFsdWVcIiwgeWVhckluZGV4KTtcbiAgICBidG4uc2V0QXR0cmlidXRlKFwiYXJpYS1zZWxlY3RlZFwiLCBpc1NlbGVjdGVkID8gXCJ0cnVlXCIgOiBcImZhbHNlXCIpO1xuICAgIGlmIChpc0Rpc2FibGVkID09PSB0cnVlKSB7XG4gICAgICBidG4uZGlzYWJsZWQgPSB0cnVlO1xuICAgIH1cbiAgICBidG4udGV4dENvbnRlbnQgPSB5ZWFySW5kZXg7XG5cbiAgICB5ZWFycy5wdXNoKGJ0bik7XG4gICAgeWVhckluZGV4ICs9IDE7XG4gIH1cblxuICBjb25zdCBuZXdDYWxlbmRhciA9IGNhbGVuZGFyRWwuY2xvbmVOb2RlKCk7XG5cbiAgLy8gY3JlYXRlIHRoZSB5ZWFycyBjYWxlbmRhciB3cmFwcGVyXG4gIGNvbnN0IHllYXJzQ2FsZW5kYXJXcmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgeWVhcnNDYWxlbmRhcldyYXBwZXIuc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIiwgXCItMVwiKTtcbiAgeWVhcnNDYWxlbmRhcldyYXBwZXIuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgQ0FMRU5EQVJfWUVBUl9QSUNLRVJfQ0xBU1MpO1xuXG4gIC8vIGNyZWF0ZSB0YWJsZSBwYXJlbnRcbiAgY29uc3QgeWVhcnNUYWJsZVBhcmVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0YWJsZVwiKTtcbiAgeWVhcnNUYWJsZVBhcmVudC5zZXRBdHRyaWJ1dGUoXCJyb2xlXCIsIFwicHJlc2VudGF0aW9uXCIpO1xuICB5ZWFyc1RhYmxlUGFyZW50LnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIENBTEVOREFSX1RBQkxFX0NMQVNTKTtcblxuICAvLyBjcmVhdGUgdGFibGUgYm9keSBhbmQgdGFibGUgcm93XG4gIGNvbnN0IHllYXJzSFRNTFRhYmxlQm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0Ym9keVwiKTtcbiAgY29uc3QgeWVhcnNIVE1MVGFibGVCb2R5Um93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRyXCIpO1xuXG4gIC8vIGNyZWF0ZSBwcmV2aW91cyBidXR0b25cbiAgY29uc3QgcHJldmlvdXNZZWFyc0J0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gIHByZXZpb3VzWWVhcnNCdG4uc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcImJ1dHRvblwiKTtcbiAgcHJldmlvdXNZZWFyc0J0bi5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBDQUxFTkRBUl9QUkVWSU9VU19ZRUFSX0NIVU5LX0NMQVNTKTtcbiAgcHJldmlvdXNZZWFyc0J0bi5zZXRBdHRyaWJ1dGUoXG4gICAgXCJhcmlhLWxhYmVsXCIsXG4gICAgYE5hdmlnYXRlIGJhY2sgJHtZRUFSX0NIVU5LfSB5ZWFyc2BcbiAgKTtcbiAgaWYgKHByZXZZZWFyQ2h1bmtEaXNhYmxlZCA9PT0gdHJ1ZSkge1xuICAgIHByZXZpb3VzWWVhcnNCdG4uZGlzYWJsZWQgPSB0cnVlO1xuICB9XG4gIHByZXZpb3VzWWVhcnNCdG4uaW5uZXJIVE1MID0gU2FuaXRpemVyLmVzY2FwZUhUTUxgJm5ic3BgO1xuXG4gIC8vIGNyZWF0ZSBuZXh0IGJ1dHRvblxuICBjb25zdCBuZXh0WWVhcnNCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICBuZXh0WWVhcnNCdG4uc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcImJ1dHRvblwiKTtcbiAgbmV4dFllYXJzQnRuLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIENBTEVOREFSX05FWFRfWUVBUl9DSFVOS19DTEFTUyk7XG4gIG5leHRZZWFyc0J0bi5zZXRBdHRyaWJ1dGUoXG4gICAgXCJhcmlhLWxhYmVsXCIsXG4gICAgYE5hdmlnYXRlIGZvcndhcmQgJHtZRUFSX0NIVU5LfSB5ZWFyc2BcbiAgKTtcbiAgaWYgKG5leHRZZWFyQ2h1bmtEaXNhYmxlZCA9PT0gdHJ1ZSkge1xuICAgIG5leHRZZWFyc0J0bi5kaXNhYmxlZCA9IHRydWU7XG4gIH1cbiAgbmV4dFllYXJzQnRuLmlubmVySFRNTCA9IFNhbml0aXplci5lc2NhcGVIVE1MYCZuYnNwYDtcblxuICAvLyBjcmVhdGUgdGhlIGFjdHVhbCB5ZWFycyB0YWJsZVxuICBjb25zdCB5ZWFyc1RhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRhYmxlXCIpO1xuICB5ZWFyc1RhYmxlLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIENBTEVOREFSX1RBQkxFX0NMQVNTKTtcbiAgeWVhcnNUYWJsZS5zZXRBdHRyaWJ1dGUoXCJyb2xlXCIsIFwicHJlc2VudGF0aW9uXCIpO1xuXG4gIC8vIGNyZWF0ZSB0aGUgeWVhcnMgY2hpbGQgdGFibGVcbiAgY29uc3QgeWVhcnNHcmlkID0gbGlzdFRvR3JpZEh0bWwoeWVhcnMsIDMpO1xuICBjb25zdCB5ZWFyc1RhYmxlQm9keSA9IGNyZWF0ZVRhYmxlQm9keSh5ZWFyc0dyaWQpO1xuXG4gIC8vIGFwcGVuZCB0aGUgZ3JpZCB0byB0aGUgeWVhcnMgY2hpbGQgdGFibGVcbiAgeWVhcnNUYWJsZS5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJiZWZvcmVlbmRcIiwgeWVhcnNUYWJsZUJvZHkpO1xuXG4gIC8vIGNyZWF0ZSB0aGUgcHJldiBidXR0b24gdGQgYW5kIGFwcGVuZCB0aGUgcHJldiBidXR0b25cbiAgY29uc3QgeWVhcnNIVE1MVGFibGVCb2R5RGV0YWlsUHJldiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZFwiKTtcbiAgeWVhcnNIVE1MVGFibGVCb2R5RGV0YWlsUHJldi5pbnNlcnRBZGphY2VudEVsZW1lbnQoXG4gICAgXCJiZWZvcmVlbmRcIixcbiAgICBwcmV2aW91c1llYXJzQnRuXG4gICk7XG5cbiAgLy8gY3JlYXRlIHRoZSB5ZWFycyB0ZCBhbmQgYXBwZW5kIHRoZSB5ZWFycyBjaGlsZCB0YWJsZVxuICBjb25zdCB5ZWFyc0hUTUxUYWJsZUJvZHlZZWFyc0RldGFpbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZFwiKTtcbiAgeWVhcnNIVE1MVGFibGVCb2R5WWVhcnNEZXRhaWwuc2V0QXR0cmlidXRlKFwiY29sc3BhblwiLCBcIjNcIik7XG4gIHllYXJzSFRNTFRhYmxlQm9keVllYXJzRGV0YWlsLmluc2VydEFkamFjZW50RWxlbWVudChcImJlZm9yZWVuZFwiLCB5ZWFyc1RhYmxlKTtcblxuICAvLyBjcmVhdGUgdGhlIG5leHQgYnV0dG9uIHRkIGFuZCBhcHBlbmQgdGhlIG5leHQgYnV0dG9uXG4gIGNvbnN0IHllYXJzSFRNTFRhYmxlQm9keURldGFpbE5leHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGRcIik7XG4gIHllYXJzSFRNTFRhYmxlQm9keURldGFpbE5leHQuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIG5leHRZZWFyc0J0bik7XG5cbiAgLy8gYXBwZW5kIHRoZSB0aHJlZSB0ZCB0byB0aGUgeWVhcnMgY2hpbGQgdGFibGUgcm93XG4gIHllYXJzSFRNTFRhYmxlQm9keVJvdy5pbnNlcnRBZGphY2VudEVsZW1lbnQoXG4gICAgXCJiZWZvcmVlbmRcIixcbiAgICB5ZWFyc0hUTUxUYWJsZUJvZHlEZXRhaWxQcmV2XG4gICk7XG4gIHllYXJzSFRNTFRhYmxlQm9keVJvdy5pbnNlcnRBZGphY2VudEVsZW1lbnQoXG4gICAgXCJiZWZvcmVlbmRcIixcbiAgICB5ZWFyc0hUTUxUYWJsZUJvZHlZZWFyc0RldGFpbFxuICApO1xuICB5ZWFyc0hUTUxUYWJsZUJvZHlSb3cuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFxuICAgIFwiYmVmb3JlZW5kXCIsXG4gICAgeWVhcnNIVE1MVGFibGVCb2R5RGV0YWlsTmV4dFxuICApO1xuXG4gIC8vIGFwcGVuZCB0aGUgdGFibGUgcm93IHRvIHRoZSB5ZWFycyBjaGlsZCB0YWJsZSBib2R5XG4gIHllYXJzSFRNTFRhYmxlQm9keS5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJiZWZvcmVlbmRcIiwgeWVhcnNIVE1MVGFibGVCb2R5Um93KTtcblxuICAvLyBhcHBlbmQgdGhlIHllYXJzIHRhYmxlIGJvZHkgdG8gdGhlIHllYXJzIHBhcmVudCB0YWJsZVxuICB5ZWFyc1RhYmxlUGFyZW50Lmluc2VydEFkamFjZW50RWxlbWVudChcImJlZm9yZWVuZFwiLCB5ZWFyc0hUTUxUYWJsZUJvZHkpO1xuXG4gIC8vIGFwcGVuZCB0aGUgcGFyZW50IHRhYmxlIHRvIHRoZSBjYWxlbmRhciB3cmFwcGVyXG4gIHllYXJzQ2FsZW5kYXJXcmFwcGVyLmluc2VydEFkamFjZW50RWxlbWVudChcImJlZm9yZWVuZFwiLCB5ZWFyc1RhYmxlUGFyZW50KTtcblxuICAvLyBhcHBlbmQgdGhlIHllYXJzIGNhbGVuZGVyIHRvIHRoZSBuZXcgY2FsZW5kYXJcbiAgbmV3Q2FsZW5kYXIuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIHllYXJzQ2FsZW5kYXJXcmFwcGVyKTtcblxuICAvLyByZXBsYWNlIGNhbGVuZGFyXG4gIGNhbGVuZGFyRWwucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQobmV3Q2FsZW5kYXIsIGNhbGVuZGFyRWwpO1xuXG4gIHN0YXR1c0VsLnRleHRDb250ZW50ID0gU2FuaXRpemVyLmVzY2FwZUhUTUxgU2hvd2luZyB5ZWFycyAke3llYXJUb0NodW5rfSB0byAke1xuICAgIHllYXJUb0NodW5rICsgWUVBUl9DSFVOSyAtIDFcbiAgfS4gU2VsZWN0IGEgeWVhci5gO1xuXG4gIHJldHVybiBuZXdDYWxlbmRhcjtcbn07XG5cbi8qKlxuICogTmF2aWdhdGUgYmFjayBieSB5ZWFycyBhbmQgZGlzcGxheSB0aGUgeWVhciBzZWxlY3Rpb24gc2NyZWVuLlxuICpcbiAqIEBwYXJhbSB7SFRNTEJ1dHRvbkVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcbiAqL1xuY29uc3QgZGlzcGxheVByZXZpb3VzWWVhckNodW5rID0gKGVsKSA9PiB7XG4gIGlmIChlbC5kaXNhYmxlZCkgcmV0dXJuO1xuXG4gIGNvbnN0IHsgY2FsZW5kYXJFbCwgY2FsZW5kYXJEYXRlLCBtaW5EYXRlLCBtYXhEYXRlIH0gPVxuICAgIGdldERhdGVQaWNrZXJDb250ZXh0KGVsKTtcbiAgY29uc3QgeWVhckVsID0gY2FsZW5kYXJFbC5xdWVyeVNlbGVjdG9yKENBTEVOREFSX1lFQVJfRk9DVVNFRCk7XG4gIGNvbnN0IHNlbGVjdGVkWWVhciA9IHBhcnNlSW50KHllYXJFbC50ZXh0Q29udGVudCwgMTApO1xuXG4gIGxldCBhZGp1c3RlZFllYXIgPSBzZWxlY3RlZFllYXIgLSBZRUFSX0NIVU5LO1xuICBhZGp1c3RlZFllYXIgPSBNYXRoLm1heCgwLCBhZGp1c3RlZFllYXIpO1xuXG4gIGNvbnN0IGRhdGUgPSBzZXRZZWFyKGNhbGVuZGFyRGF0ZSwgYWRqdXN0ZWRZZWFyKTtcbiAgY29uc3QgY2FwcGVkRGF0ZSA9IGtlZXBEYXRlQmV0d2Vlbk1pbkFuZE1heChkYXRlLCBtaW5EYXRlLCBtYXhEYXRlKTtcbiAgY29uc3QgbmV3Q2FsZW5kYXIgPSBkaXNwbGF5WWVhclNlbGVjdGlvbihcbiAgICBjYWxlbmRhckVsLFxuICAgIGNhcHBlZERhdGUuZ2V0RnVsbFllYXIoKVxuICApO1xuXG4gIGxldCBuZXh0VG9Gb2N1cyA9IG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfUFJFVklPVVNfWUVBUl9DSFVOSyk7XG4gIGlmIChuZXh0VG9Gb2N1cy5kaXNhYmxlZCkge1xuICAgIG5leHRUb0ZvY3VzID0gbmV3Q2FsZW5kYXIucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9ZRUFSX1BJQ0tFUik7XG4gIH1cbiAgbmV4dFRvRm9jdXMuZm9jdXMoKTtcbn07XG5cbi8qKlxuICogTmF2aWdhdGUgZm9yd2FyZCBieSB5ZWFycyBhbmQgZGlzcGxheSB0aGUgeWVhciBzZWxlY3Rpb24gc2NyZWVuLlxuICpcbiAqIEBwYXJhbSB7SFRNTEJ1dHRvbkVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcbiAqL1xuY29uc3QgZGlzcGxheU5leHRZZWFyQ2h1bmsgPSAoZWwpID0+IHtcbiAgaWYgKGVsLmRpc2FibGVkKSByZXR1cm47XG5cbiAgY29uc3QgeyBjYWxlbmRhckVsLCBjYWxlbmRhckRhdGUsIG1pbkRhdGUsIG1heERhdGUgfSA9XG4gICAgZ2V0RGF0ZVBpY2tlckNvbnRleHQoZWwpO1xuICBjb25zdCB5ZWFyRWwgPSBjYWxlbmRhckVsLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfWUVBUl9GT0NVU0VEKTtcbiAgY29uc3Qgc2VsZWN0ZWRZZWFyID0gcGFyc2VJbnQoeWVhckVsLnRleHRDb250ZW50LCAxMCk7XG5cbiAgbGV0IGFkanVzdGVkWWVhciA9IHNlbGVjdGVkWWVhciArIFlFQVJfQ0hVTks7XG4gIGFkanVzdGVkWWVhciA9IE1hdGgubWF4KDAsIGFkanVzdGVkWWVhcik7XG5cbiAgY29uc3QgZGF0ZSA9IHNldFllYXIoY2FsZW5kYXJEYXRlLCBhZGp1c3RlZFllYXIpO1xuICBjb25zdCBjYXBwZWREYXRlID0ga2VlcERhdGVCZXR3ZWVuTWluQW5kTWF4KGRhdGUsIG1pbkRhdGUsIG1heERhdGUpO1xuICBjb25zdCBuZXdDYWxlbmRhciA9IGRpc3BsYXlZZWFyU2VsZWN0aW9uKFxuICAgIGNhbGVuZGFyRWwsXG4gICAgY2FwcGVkRGF0ZS5nZXRGdWxsWWVhcigpXG4gICk7XG5cbiAgbGV0IG5leHRUb0ZvY3VzID0gbmV3Q2FsZW5kYXIucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9ORVhUX1lFQVJfQ0hVTkspO1xuICBpZiAobmV4dFRvRm9jdXMuZGlzYWJsZWQpIHtcbiAgICBuZXh0VG9Gb2N1cyA9IG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfWUVBUl9QSUNLRVIpO1xuICB9XG4gIG5leHRUb0ZvY3VzLmZvY3VzKCk7XG59O1xuXG4vKipcbiAqIFNlbGVjdCBhIHllYXIgaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0ge0hUTUxCdXR0b25FbGVtZW50fSB5ZWFyRWwgQSB5ZWFyIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcbiAqL1xuY29uc3Qgc2VsZWN0WWVhciA9ICh5ZWFyRWwpID0+IHtcbiAgaWYgKHllYXJFbC5kaXNhYmxlZCkgcmV0dXJuO1xuICBjb25zdCB7IGNhbGVuZGFyRWwsIGNhbGVuZGFyRGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSB9ID1cbiAgICBnZXREYXRlUGlja2VyQ29udGV4dCh5ZWFyRWwpO1xuICBjb25zdCBzZWxlY3RlZFllYXIgPSBwYXJzZUludCh5ZWFyRWwuaW5uZXJIVE1MLCAxMCk7XG4gIGxldCBkYXRlID0gc2V0WWVhcihjYWxlbmRhckRhdGUsIHNlbGVjdGVkWWVhcik7XG4gIGRhdGUgPSBrZWVwRGF0ZUJldHdlZW5NaW5BbmRNYXgoZGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSk7XG4gIGNvbnN0IG5ld0NhbGVuZGFyID0gcmVuZGVyQ2FsZW5kYXIoY2FsZW5kYXJFbCwgZGF0ZSk7XG4gIG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfREFURV9GT0NVU0VEKS5mb2N1cygpO1xufTtcblxuLy8gI2VuZHJlZ2lvbiBDYWxlbmRhciAtIFllYXIgU2VsZWN0aW9uIFZpZXdcblxuLy8gI3JlZ2lvbiBDYWxlbmRhciBFdmVudCBIYW5kbGluZ1xuXG4vKipcbiAqIEhpZGUgdGhlIGNhbGVuZGFyLlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcbiAqL1xuY29uc3QgaGFuZGxlRXNjYXBlRnJvbUNhbGVuZGFyID0gKGV2ZW50KSA9PiB7XG4gIGNvbnN0IHsgZGF0ZVBpY2tlckVsLCBleHRlcm5hbElucHV0RWwgfSA9IGdldERhdGVQaWNrZXJDb250ZXh0KGV2ZW50LnRhcmdldCk7XG5cbiAgaGlkZUNhbGVuZGFyKGRhdGVQaWNrZXJFbCk7XG4gIGV4dGVybmFsSW5wdXRFbC5mb2N1cygpO1xuXG4gIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG59O1xuXG4vLyAjZW5kcmVnaW9uIENhbGVuZGFyIEV2ZW50IEhhbmRsaW5nXG5cbi8vICNyZWdpb24gQ2FsZW5kYXIgRGF0ZSBFdmVudCBIYW5kbGluZ1xuXG4vKipcbiAqIEFkanVzdCB0aGUgZGF0ZSBhbmQgZGlzcGxheSB0aGUgY2FsZW5kYXIgaWYgbmVlZGVkLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGFkanVzdERhdGVGbiBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlIGFkanVzdGVkIGRhdGVcbiAqL1xuY29uc3QgYWRqdXN0Q2FsZW5kYXIgPSAoYWRqdXN0RGF0ZUZuKSA9PiAoZXZlbnQpID0+IHtcbiAgY29uc3QgeyBjYWxlbmRhckVsLCBjYWxlbmRhckRhdGUsIG1pbkRhdGUsIG1heERhdGUgfSA9IGdldERhdGVQaWNrZXJDb250ZXh0KFxuICAgIGV2ZW50LnRhcmdldFxuICApO1xuXG4gIGNvbnN0IGRhdGUgPSBhZGp1c3REYXRlRm4oY2FsZW5kYXJEYXRlKTtcblxuICBjb25zdCBjYXBwZWREYXRlID0ga2VlcERhdGVCZXR3ZWVuTWluQW5kTWF4KGRhdGUsIG1pbkRhdGUsIG1heERhdGUpO1xuICBpZiAoIWlzU2FtZURheShjYWxlbmRhckRhdGUsIGNhcHBlZERhdGUpKSB7XG4gICAgY29uc3QgbmV3Q2FsZW5kYXIgPSByZW5kZXJDYWxlbmRhcihjYWxlbmRhckVsLCBjYXBwZWREYXRlKTtcbiAgICBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX0RBVEVfRk9DVVNFRCkuZm9jdXMoKTtcbiAgfVxuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xufTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSBiYWNrIG9uZSB3ZWVrIGFuZCBkaXNwbGF5IHRoZSBjYWxlbmRhci5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XG4gKi9cbmNvbnN0IGhhbmRsZVVwRnJvbURhdGUgPSBhZGp1c3RDYWxlbmRhcigoZGF0ZSkgPT4gc3ViV2Vla3MoZGF0ZSwgMSkpO1xuXG4vKipcbiAqIE5hdmlnYXRlIGZvcndhcmQgb25lIHdlZWsgYW5kIGRpc3BsYXkgdGhlIGNhbGVuZGFyLlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcbiAqL1xuY29uc3QgaGFuZGxlRG93bkZyb21EYXRlID0gYWRqdXN0Q2FsZW5kYXIoKGRhdGUpID0+IGFkZFdlZWtzKGRhdGUsIDEpKTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSBiYWNrIG9uZSBkYXkgYW5kIGRpc3BsYXkgdGhlIGNhbGVuZGFyLlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcbiAqL1xuY29uc3QgaGFuZGxlTGVmdEZyb21EYXRlID0gYWRqdXN0Q2FsZW5kYXIoKGRhdGUpID0+IHN1YkRheXMoZGF0ZSwgMSkpO1xuXG4vKipcbiAqIE5hdmlnYXRlIGZvcndhcmQgb25lIGRheSBhbmQgZGlzcGxheSB0aGUgY2FsZW5kYXIuXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxuICovXG5jb25zdCBoYW5kbGVSaWdodEZyb21EYXRlID0gYWRqdXN0Q2FsZW5kYXIoKGRhdGUpID0+IGFkZERheXMoZGF0ZSwgMSkpO1xuXG4vKipcbiAqIE5hdmlnYXRlIHRvIHRoZSBzdGFydCBvZiB0aGUgd2VlayBhbmQgZGlzcGxheSB0aGUgY2FsZW5kYXIuXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxuICovXG5jb25zdCBoYW5kbGVIb21lRnJvbURhdGUgPSBhZGp1c3RDYWxlbmRhcigoZGF0ZSkgPT4gc3RhcnRPZldlZWsoZGF0ZSkpO1xuXG4vKipcbiAqIE5hdmlnYXRlIHRvIHRoZSBlbmQgb2YgdGhlIHdlZWsgYW5kIGRpc3BsYXkgdGhlIGNhbGVuZGFyLlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcbiAqL1xuY29uc3QgaGFuZGxlRW5kRnJvbURhdGUgPSBhZGp1c3RDYWxlbmRhcigoZGF0ZSkgPT4gZW5kT2ZXZWVrKGRhdGUpKTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSBmb3J3YXJkIG9uZSBtb250aCBhbmQgZGlzcGxheSB0aGUgY2FsZW5kYXIuXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxuICovXG5jb25zdCBoYW5kbGVQYWdlRG93bkZyb21EYXRlID0gYWRqdXN0Q2FsZW5kYXIoKGRhdGUpID0+IGFkZE1vbnRocyhkYXRlLCAxKSk7XG5cbi8qKlxuICogTmF2aWdhdGUgYmFjayBvbmUgbW9udGggYW5kIGRpc3BsYXkgdGhlIGNhbGVuZGFyLlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcbiAqL1xuY29uc3QgaGFuZGxlUGFnZVVwRnJvbURhdGUgPSBhZGp1c3RDYWxlbmRhcigoZGF0ZSkgPT4gc3ViTW9udGhzKGRhdGUsIDEpKTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSBmb3J3YXJkIG9uZSB5ZWFyIGFuZCBkaXNwbGF5IHRoZSBjYWxlbmRhci5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XG4gKi9cbmNvbnN0IGhhbmRsZVNoaWZ0UGFnZURvd25Gcm9tRGF0ZSA9IGFkanVzdENhbGVuZGFyKChkYXRlKSA9PiBhZGRZZWFycyhkYXRlLCAxKSk7XG5cbi8qKlxuICogTmF2aWdhdGUgYmFjayBvbmUgeWVhciBhbmQgZGlzcGxheSB0aGUgY2FsZW5kYXIuXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxuICovXG5jb25zdCBoYW5kbGVTaGlmdFBhZ2VVcEZyb21EYXRlID0gYWRqdXN0Q2FsZW5kYXIoKGRhdGUpID0+IHN1YlllYXJzKGRhdGUsIDEpKTtcblxuLyoqXG4gKiBkaXNwbGF5IHRoZSBjYWxlbmRhciBmb3IgdGhlIG1vdXNlb3ZlciBkYXRlLlxuICpcbiAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgVGhlIG1vdXNlb3ZlciBldmVudFxuICogQHBhcmFtIHtIVE1MQnV0dG9uRWxlbWVudH0gZGF0ZUVsIEEgZGF0ZSBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKi9cbmNvbnN0IGhhbmRsZU1vdXNlb3ZlckZyb21EYXRlID0gKGRhdGVFbCkgPT4ge1xuICBpZiAoZGF0ZUVsLmRpc2FibGVkKSByZXR1cm47XG5cbiAgY29uc3QgY2FsZW5kYXJFbCA9IGRhdGVFbC5jbG9zZXN0KERBVEVfUElDS0VSX0NBTEVOREFSKTtcblxuICBjb25zdCBjdXJyZW50Q2FsZW5kYXJEYXRlID0gY2FsZW5kYXJFbC5kYXRhc2V0LnZhbHVlO1xuICBjb25zdCBob3ZlckRhdGUgPSBkYXRlRWwuZGF0YXNldC52YWx1ZTtcblxuICBpZiAoaG92ZXJEYXRlID09PSBjdXJyZW50Q2FsZW5kYXJEYXRlKSByZXR1cm47XG5cbiAgY29uc3QgZGF0ZVRvRGlzcGxheSA9IHBhcnNlRGF0ZVN0cmluZyhob3ZlckRhdGUpO1xuICBjb25zdCBuZXdDYWxlbmRhciA9IHJlbmRlckNhbGVuZGFyKGNhbGVuZGFyRWwsIGRhdGVUb0Rpc3BsYXkpO1xuICBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX0RBVEVfRk9DVVNFRCkuZm9jdXMoKTtcbn07XG5cbi8vICNlbmRyZWdpb24gQ2FsZW5kYXIgRGF0ZSBFdmVudCBIYW5kbGluZ1xuXG4vLyAjcmVnaW9uIENhbGVuZGFyIE1vbnRoIEV2ZW50IEhhbmRsaW5nXG5cbi8qKlxuICogQWRqdXN0IHRoZSBtb250aCBhbmQgZGlzcGxheSB0aGUgbW9udGggc2VsZWN0aW9uIHNjcmVlbiBpZiBuZWVkZWQuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gYWRqdXN0TW9udGhGbiBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlIGFkanVzdGVkIG1vbnRoXG4gKi9cbmNvbnN0IGFkanVzdE1vbnRoU2VsZWN0aW9uU2NyZWVuID0gKGFkanVzdE1vbnRoRm4pID0+IChldmVudCkgPT4ge1xuICBjb25zdCBtb250aEVsID0gZXZlbnQudGFyZ2V0O1xuICBjb25zdCBzZWxlY3RlZE1vbnRoID0gcGFyc2VJbnQobW9udGhFbC5kYXRhc2V0LnZhbHVlLCAxMCk7XG4gIGNvbnN0IHsgY2FsZW5kYXJFbCwgY2FsZW5kYXJEYXRlLCBtaW5EYXRlLCBtYXhEYXRlIH0gPVxuICAgIGdldERhdGVQaWNrZXJDb250ZXh0KG1vbnRoRWwpO1xuICBjb25zdCBjdXJyZW50RGF0ZSA9IHNldE1vbnRoKGNhbGVuZGFyRGF0ZSwgc2VsZWN0ZWRNb250aCk7XG5cbiAgbGV0IGFkanVzdGVkTW9udGggPSBhZGp1c3RNb250aEZuKHNlbGVjdGVkTW9udGgpO1xuICBhZGp1c3RlZE1vbnRoID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMTEsIGFkanVzdGVkTW9udGgpKTtcblxuICBjb25zdCBkYXRlID0gc2V0TW9udGgoY2FsZW5kYXJEYXRlLCBhZGp1c3RlZE1vbnRoKTtcbiAgY29uc3QgY2FwcGVkRGF0ZSA9IGtlZXBEYXRlQmV0d2Vlbk1pbkFuZE1heChkYXRlLCBtaW5EYXRlLCBtYXhEYXRlKTtcbiAgaWYgKCFpc1NhbWVNb250aChjdXJyZW50RGF0ZSwgY2FwcGVkRGF0ZSkpIHtcbiAgICBjb25zdCBuZXdDYWxlbmRhciA9IGRpc3BsYXlNb250aFNlbGVjdGlvbihcbiAgICAgIGNhbGVuZGFyRWwsXG4gICAgICBjYXBwZWREYXRlLmdldE1vbnRoKClcbiAgICApO1xuICAgIG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfTU9OVEhfRk9DVVNFRCkuZm9jdXMoKTtcbiAgfVxuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xufTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSBiYWNrIHRocmVlIG1vbnRocyBhbmQgZGlzcGxheSB0aGUgbW9udGggc2VsZWN0aW9uIHNjcmVlbi5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XG4gKi9cbmNvbnN0IGhhbmRsZVVwRnJvbU1vbnRoID0gYWRqdXN0TW9udGhTZWxlY3Rpb25TY3JlZW4oKG1vbnRoKSA9PiBtb250aCAtIDMpO1xuXG4vKipcbiAqIE5hdmlnYXRlIGZvcndhcmQgdGhyZWUgbW9udGhzIGFuZCBkaXNwbGF5IHRoZSBtb250aCBzZWxlY3Rpb24gc2NyZWVuLlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcbiAqL1xuY29uc3QgaGFuZGxlRG93bkZyb21Nb250aCA9IGFkanVzdE1vbnRoU2VsZWN0aW9uU2NyZWVuKChtb250aCkgPT4gbW9udGggKyAzKTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSBiYWNrIG9uZSBtb250aCBhbmQgZGlzcGxheSB0aGUgbW9udGggc2VsZWN0aW9uIHNjcmVlbi5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XG4gKi9cbmNvbnN0IGhhbmRsZUxlZnRGcm9tTW9udGggPSBhZGp1c3RNb250aFNlbGVjdGlvblNjcmVlbigobW9udGgpID0+IG1vbnRoIC0gMSk7XG5cbi8qKlxuICogTmF2aWdhdGUgZm9yd2FyZCBvbmUgbW9udGggYW5kIGRpc3BsYXkgdGhlIG1vbnRoIHNlbGVjdGlvbiBzY3JlZW4uXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxuICovXG5jb25zdCBoYW5kbGVSaWdodEZyb21Nb250aCA9IGFkanVzdE1vbnRoU2VsZWN0aW9uU2NyZWVuKChtb250aCkgPT4gbW9udGggKyAxKTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSB0byB0aGUgc3RhcnQgb2YgdGhlIHJvdyBvZiBtb250aHMgYW5kIGRpc3BsYXkgdGhlIG1vbnRoIHNlbGVjdGlvbiBzY3JlZW4uXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxuICovXG5jb25zdCBoYW5kbGVIb21lRnJvbU1vbnRoID0gYWRqdXN0TW9udGhTZWxlY3Rpb25TY3JlZW4oXG4gIChtb250aCkgPT4gbW9udGggLSAobW9udGggJSAzKVxuKTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSB0byB0aGUgZW5kIG9mIHRoZSByb3cgb2YgbW9udGhzIGFuZCBkaXNwbGF5IHRoZSBtb250aCBzZWxlY3Rpb24gc2NyZWVuLlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcbiAqL1xuY29uc3QgaGFuZGxlRW5kRnJvbU1vbnRoID0gYWRqdXN0TW9udGhTZWxlY3Rpb25TY3JlZW4oXG4gIChtb250aCkgPT4gbW9udGggKyAyIC0gKG1vbnRoICUgMylcbik7XG5cbi8qKlxuICogTmF2aWdhdGUgdG8gdGhlIGxhc3QgbW9udGggKERlY2VtYmVyKSBhbmQgZGlzcGxheSB0aGUgbW9udGggc2VsZWN0aW9uIHNjcmVlbi5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XG4gKi9cbmNvbnN0IGhhbmRsZVBhZ2VEb3duRnJvbU1vbnRoID0gYWRqdXN0TW9udGhTZWxlY3Rpb25TY3JlZW4oKCkgPT4gMTEpO1xuXG4vKipcbiAqIE5hdmlnYXRlIHRvIHRoZSBmaXJzdCBtb250aCAoSmFudWFyeSkgYW5kIGRpc3BsYXkgdGhlIG1vbnRoIHNlbGVjdGlvbiBzY3JlZW4uXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxuICovXG5jb25zdCBoYW5kbGVQYWdlVXBGcm9tTW9udGggPSBhZGp1c3RNb250aFNlbGVjdGlvblNjcmVlbigoKSA9PiAwKTtcblxuLyoqXG4gKiB1cGRhdGUgdGhlIGZvY3VzIG9uIGEgbW9udGggd2hlbiB0aGUgbW91c2UgbW92ZXMuXG4gKlxuICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCBUaGUgbW91c2VvdmVyIGV2ZW50XG4gKiBAcGFyYW0ge0hUTUxCdXR0b25FbGVtZW50fSBtb250aEVsIEEgbW9udGggZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICovXG5jb25zdCBoYW5kbGVNb3VzZW92ZXJGcm9tTW9udGggPSAobW9udGhFbCkgPT4ge1xuICBpZiAobW9udGhFbC5kaXNhYmxlZCkgcmV0dXJuO1xuICBpZiAobW9udGhFbC5jbGFzc0xpc3QuY29udGFpbnMoQ0FMRU5EQVJfTU9OVEhfRk9DVVNFRF9DTEFTUykpIHJldHVybjtcblxuICBjb25zdCBmb2N1c01vbnRoID0gcGFyc2VJbnQobW9udGhFbC5kYXRhc2V0LnZhbHVlLCAxMCk7XG5cbiAgY29uc3QgbmV3Q2FsZW5kYXIgPSBkaXNwbGF5TW9udGhTZWxlY3Rpb24obW9udGhFbCwgZm9jdXNNb250aCk7XG4gIG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfTU9OVEhfRk9DVVNFRCkuZm9jdXMoKTtcbn07XG5cbi8vICNlbmRyZWdpb24gQ2FsZW5kYXIgTW9udGggRXZlbnQgSGFuZGxpbmdcblxuLy8gI3JlZ2lvbiBDYWxlbmRhciBZZWFyIEV2ZW50IEhhbmRsaW5nXG5cbi8qKlxuICogQWRqdXN0IHRoZSB5ZWFyIGFuZCBkaXNwbGF5IHRoZSB5ZWFyIHNlbGVjdGlvbiBzY3JlZW4gaWYgbmVlZGVkLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGFkanVzdFllYXJGbiBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlIGFkanVzdGVkIHllYXJcbiAqL1xuY29uc3QgYWRqdXN0WWVhclNlbGVjdGlvblNjcmVlbiA9IChhZGp1c3RZZWFyRm4pID0+IChldmVudCkgPT4ge1xuICBjb25zdCB5ZWFyRWwgPSBldmVudC50YXJnZXQ7XG4gIGNvbnN0IHNlbGVjdGVkWWVhciA9IHBhcnNlSW50KHllYXJFbC5kYXRhc2V0LnZhbHVlLCAxMCk7XG4gIGNvbnN0IHsgY2FsZW5kYXJFbCwgY2FsZW5kYXJEYXRlLCBtaW5EYXRlLCBtYXhEYXRlIH0gPVxuICAgIGdldERhdGVQaWNrZXJDb250ZXh0KHllYXJFbCk7XG4gIGNvbnN0IGN1cnJlbnREYXRlID0gc2V0WWVhcihjYWxlbmRhckRhdGUsIHNlbGVjdGVkWWVhcik7XG5cbiAgbGV0IGFkanVzdGVkWWVhciA9IGFkanVzdFllYXJGbihzZWxlY3RlZFllYXIpO1xuICBhZGp1c3RlZFllYXIgPSBNYXRoLm1heCgwLCBhZGp1c3RlZFllYXIpO1xuXG4gIGNvbnN0IGRhdGUgPSBzZXRZZWFyKGNhbGVuZGFyRGF0ZSwgYWRqdXN0ZWRZZWFyKTtcbiAgY29uc3QgY2FwcGVkRGF0ZSA9IGtlZXBEYXRlQmV0d2Vlbk1pbkFuZE1heChkYXRlLCBtaW5EYXRlLCBtYXhEYXRlKTtcbiAgaWYgKCFpc1NhbWVZZWFyKGN1cnJlbnREYXRlLCBjYXBwZWREYXRlKSkge1xuICAgIGNvbnN0IG5ld0NhbGVuZGFyID0gZGlzcGxheVllYXJTZWxlY3Rpb24oXG4gICAgICBjYWxlbmRhckVsLFxuICAgICAgY2FwcGVkRGF0ZS5nZXRGdWxsWWVhcigpXG4gICAgKTtcbiAgICBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX1lFQVJfRk9DVVNFRCkuZm9jdXMoKTtcbiAgfVxuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xufTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSBiYWNrIHRocmVlIHllYXJzIGFuZCBkaXNwbGF5IHRoZSB5ZWFyIHNlbGVjdGlvbiBzY3JlZW4uXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxuICovXG5jb25zdCBoYW5kbGVVcEZyb21ZZWFyID0gYWRqdXN0WWVhclNlbGVjdGlvblNjcmVlbigoeWVhcikgPT4geWVhciAtIDMpO1xuXG4vKipcbiAqIE5hdmlnYXRlIGZvcndhcmQgdGhyZWUgeWVhcnMgYW5kIGRpc3BsYXkgdGhlIHllYXIgc2VsZWN0aW9uIHNjcmVlbi5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XG4gKi9cbmNvbnN0IGhhbmRsZURvd25Gcm9tWWVhciA9IGFkanVzdFllYXJTZWxlY3Rpb25TY3JlZW4oKHllYXIpID0+IHllYXIgKyAzKTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSBiYWNrIG9uZSB5ZWFyIGFuZCBkaXNwbGF5IHRoZSB5ZWFyIHNlbGVjdGlvbiBzY3JlZW4uXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxuICovXG5jb25zdCBoYW5kbGVMZWZ0RnJvbVllYXIgPSBhZGp1c3RZZWFyU2VsZWN0aW9uU2NyZWVuKCh5ZWFyKSA9PiB5ZWFyIC0gMSk7XG5cbi8qKlxuICogTmF2aWdhdGUgZm9yd2FyZCBvbmUgeWVhciBhbmQgZGlzcGxheSB0aGUgeWVhciBzZWxlY3Rpb24gc2NyZWVuLlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcbiAqL1xuY29uc3QgaGFuZGxlUmlnaHRGcm9tWWVhciA9IGFkanVzdFllYXJTZWxlY3Rpb25TY3JlZW4oKHllYXIpID0+IHllYXIgKyAxKTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSB0byB0aGUgc3RhcnQgb2YgdGhlIHJvdyBvZiB5ZWFycyBhbmQgZGlzcGxheSB0aGUgeWVhciBzZWxlY3Rpb24gc2NyZWVuLlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcbiAqL1xuY29uc3QgaGFuZGxlSG9tZUZyb21ZZWFyID0gYWRqdXN0WWVhclNlbGVjdGlvblNjcmVlbihcbiAgKHllYXIpID0+IHllYXIgLSAoeWVhciAlIDMpXG4pO1xuXG4vKipcbiAqIE5hdmlnYXRlIHRvIHRoZSBlbmQgb2YgdGhlIHJvdyBvZiB5ZWFycyBhbmQgZGlzcGxheSB0aGUgeWVhciBzZWxlY3Rpb24gc2NyZWVuLlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcbiAqL1xuY29uc3QgaGFuZGxlRW5kRnJvbVllYXIgPSBhZGp1c3RZZWFyU2VsZWN0aW9uU2NyZWVuKFxuICAoeWVhcikgPT4geWVhciArIDIgLSAoeWVhciAlIDMpXG4pO1xuXG4vKipcbiAqIE5hdmlnYXRlIHRvIGJhY2sgMTIgeWVhcnMgYW5kIGRpc3BsYXkgdGhlIHllYXIgc2VsZWN0aW9uIHNjcmVlbi5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XG4gKi9cbmNvbnN0IGhhbmRsZVBhZ2VVcEZyb21ZZWFyID0gYWRqdXN0WWVhclNlbGVjdGlvblNjcmVlbihcbiAgKHllYXIpID0+IHllYXIgLSBZRUFSX0NIVU5LXG4pO1xuXG4vKipcbiAqIE5hdmlnYXRlIGZvcndhcmQgMTIgeWVhcnMgYW5kIGRpc3BsYXkgdGhlIHllYXIgc2VsZWN0aW9uIHNjcmVlbi5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XG4gKi9cbmNvbnN0IGhhbmRsZVBhZ2VEb3duRnJvbVllYXIgPSBhZGp1c3RZZWFyU2VsZWN0aW9uU2NyZWVuKFxuICAoeWVhcikgPT4geWVhciArIFlFQVJfQ0hVTktcbik7XG5cbi8qKlxuICogdXBkYXRlIHRoZSBmb2N1cyBvbiBhIHllYXIgd2hlbiB0aGUgbW91c2UgbW92ZXMuXG4gKlxuICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCBUaGUgbW91c2VvdmVyIGV2ZW50XG4gKiBAcGFyYW0ge0hUTUxCdXR0b25FbGVtZW50fSBkYXRlRWwgQSB5ZWFyIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcbiAqL1xuY29uc3QgaGFuZGxlTW91c2VvdmVyRnJvbVllYXIgPSAoeWVhckVsKSA9PiB7XG4gIGlmICh5ZWFyRWwuZGlzYWJsZWQpIHJldHVybjtcbiAgaWYgKHllYXJFbC5jbGFzc0xpc3QuY29udGFpbnMoQ0FMRU5EQVJfWUVBUl9GT0NVU0VEX0NMQVNTKSkgcmV0dXJuO1xuXG4gIGNvbnN0IGZvY3VzWWVhciA9IHBhcnNlSW50KHllYXJFbC5kYXRhc2V0LnZhbHVlLCAxMCk7XG5cbiAgY29uc3QgbmV3Q2FsZW5kYXIgPSBkaXNwbGF5WWVhclNlbGVjdGlvbih5ZWFyRWwsIGZvY3VzWWVhcik7XG4gIG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfWUVBUl9GT0NVU0VEKS5mb2N1cygpO1xufTtcblxuLy8gI2VuZHJlZ2lvbiBDYWxlbmRhciBZZWFyIEV2ZW50IEhhbmRsaW5nXG5cbi8vICNyZWdpb24gRm9jdXMgSGFuZGxpbmcgRXZlbnQgSGFuZGxpbmdcblxuY29uc3QgdGFiSGFuZGxlciA9IChmb2N1c2FibGUpID0+IHtcbiAgY29uc3QgZ2V0Rm9jdXNhYmxlQ29udGV4dCA9IChlbCkgPT4ge1xuICAgIGNvbnN0IHsgY2FsZW5kYXJFbCB9ID0gZ2V0RGF0ZVBpY2tlckNvbnRleHQoZWwpO1xuICAgIGNvbnN0IGZvY3VzYWJsZUVsZW1lbnRzID0gc2VsZWN0KGZvY3VzYWJsZSwgY2FsZW5kYXJFbCk7XG5cbiAgICBjb25zdCBmaXJzdFRhYkluZGV4ID0gMDtcbiAgICBjb25zdCBsYXN0VGFiSW5kZXggPSBmb2N1c2FibGVFbGVtZW50cy5sZW5ndGggLSAxO1xuICAgIGNvbnN0IGZpcnN0VGFiU3RvcCA9IGZvY3VzYWJsZUVsZW1lbnRzW2ZpcnN0VGFiSW5kZXhdO1xuICAgIGNvbnN0IGxhc3RUYWJTdG9wID0gZm9jdXNhYmxlRWxlbWVudHNbbGFzdFRhYkluZGV4XTtcbiAgICBjb25zdCBmb2N1c0luZGV4ID0gZm9jdXNhYmxlRWxlbWVudHMuaW5kZXhPZihhY3RpdmVFbGVtZW50KCkpO1xuXG4gICAgY29uc3QgaXNMYXN0VGFiID0gZm9jdXNJbmRleCA9PT0gbGFzdFRhYkluZGV4O1xuICAgIGNvbnN0IGlzRmlyc3RUYWIgPSBmb2N1c0luZGV4ID09PSBmaXJzdFRhYkluZGV4O1xuICAgIGNvbnN0IGlzTm90Rm91bmQgPSBmb2N1c0luZGV4ID09PSAtMTtcblxuICAgIHJldHVybiB7XG4gICAgICBmb2N1c2FibGVFbGVtZW50cyxcbiAgICAgIGlzTm90Rm91bmQsXG4gICAgICBmaXJzdFRhYlN0b3AsXG4gICAgICBpc0ZpcnN0VGFiLFxuICAgICAgbGFzdFRhYlN0b3AsXG4gICAgICBpc0xhc3RUYWIsXG4gICAgfTtcbiAgfTtcblxuICByZXR1cm4ge1xuICAgIHRhYkFoZWFkKGV2ZW50KSB7XG4gICAgICBjb25zdCB7IGZpcnN0VGFiU3RvcCwgaXNMYXN0VGFiLCBpc05vdEZvdW5kIH0gPSBnZXRGb2N1c2FibGVDb250ZXh0KFxuICAgICAgICBldmVudC50YXJnZXRcbiAgICAgICk7XG5cbiAgICAgIGlmIChpc0xhc3RUYWIgfHwgaXNOb3RGb3VuZCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBmaXJzdFRhYlN0b3AuZm9jdXMoKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHRhYkJhY2soZXZlbnQpIHtcbiAgICAgIGNvbnN0IHsgbGFzdFRhYlN0b3AsIGlzRmlyc3RUYWIsIGlzTm90Rm91bmQgfSA9IGdldEZvY3VzYWJsZUNvbnRleHQoXG4gICAgICAgIGV2ZW50LnRhcmdldFxuICAgICAgKTtcblxuICAgICAgaWYgKGlzRmlyc3RUYWIgfHwgaXNOb3RGb3VuZCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBsYXN0VGFiU3RvcC5mb2N1cygpO1xuICAgICAgfVxuICAgIH0sXG4gIH07XG59O1xuXG5jb25zdCBkYXRlUGlja2VyVGFiRXZlbnRIYW5kbGVyID0gdGFiSGFuZGxlcihEQVRFX1BJQ0tFUl9GT0NVU0FCTEUpO1xuY29uc3QgbW9udGhQaWNrZXJUYWJFdmVudEhhbmRsZXIgPSB0YWJIYW5kbGVyKE1PTlRIX1BJQ0tFUl9GT0NVU0FCTEUpO1xuY29uc3QgeWVhclBpY2tlclRhYkV2ZW50SGFuZGxlciA9IHRhYkhhbmRsZXIoWUVBUl9QSUNLRVJfRk9DVVNBQkxFKTtcblxuLy8gI2VuZHJlZ2lvbiBGb2N1cyBIYW5kbGluZyBFdmVudCBIYW5kbGluZ1xuXG4vLyAjcmVnaW9uIERhdGUgUGlja2VyIEV2ZW50IERlbGVnYXRpb24gUmVnaXN0cmF0aW9uIC8gQ29tcG9uZW50XG5cbmNvbnN0IGRhdGVQaWNrZXJFdmVudHMgPSB7XG4gIFtDTElDS106IHtcbiAgICBbREFURV9QSUNLRVJfQlVUVE9OXSgpIHtcbiAgICAgIHRvZ2dsZUNhbGVuZGFyKHRoaXMpO1xuICAgIH0sXG4gICAgW0NBTEVOREFSX0RBVEVdKCkge1xuICAgICAgc2VsZWN0RGF0ZSh0aGlzKTtcbiAgICB9LFxuICAgIFtDQUxFTkRBUl9NT05USF0oKSB7XG4gICAgICBzZWxlY3RNb250aCh0aGlzKTtcbiAgICB9LFxuICAgIFtDQUxFTkRBUl9ZRUFSXSgpIHtcbiAgICAgIHNlbGVjdFllYXIodGhpcyk7XG4gICAgfSxcbiAgICBbQ0FMRU5EQVJfUFJFVklPVVNfTU9OVEhdKCkge1xuICAgICAgZGlzcGxheVByZXZpb3VzTW9udGgodGhpcyk7XG4gICAgfSxcbiAgICBbQ0FMRU5EQVJfTkVYVF9NT05USF0oKSB7XG4gICAgICBkaXNwbGF5TmV4dE1vbnRoKHRoaXMpO1xuICAgIH0sXG4gICAgW0NBTEVOREFSX1BSRVZJT1VTX1lFQVJdKCkge1xuICAgICAgZGlzcGxheVByZXZpb3VzWWVhcih0aGlzKTtcbiAgICB9LFxuICAgIFtDQUxFTkRBUl9ORVhUX1lFQVJdKCkge1xuICAgICAgZGlzcGxheU5leHRZZWFyKHRoaXMpO1xuICAgIH0sXG4gICAgW0NBTEVOREFSX1BSRVZJT1VTX1lFQVJfQ0hVTktdKCkge1xuICAgICAgZGlzcGxheVByZXZpb3VzWWVhckNodW5rKHRoaXMpO1xuICAgIH0sXG4gICAgW0NBTEVOREFSX05FWFRfWUVBUl9DSFVOS10oKSB7XG4gICAgICBkaXNwbGF5TmV4dFllYXJDaHVuayh0aGlzKTtcbiAgICB9LFxuICAgIFtDQUxFTkRBUl9NT05USF9TRUxFQ1RJT05dKCkge1xuICAgICAgY29uc3QgbmV3Q2FsZW5kYXIgPSBkaXNwbGF5TW9udGhTZWxlY3Rpb24odGhpcyk7XG4gICAgICBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX01PTlRIX0ZPQ1VTRUQpLmZvY3VzKCk7XG4gICAgfSxcbiAgICBbQ0FMRU5EQVJfWUVBUl9TRUxFQ1RJT05dKCkge1xuICAgICAgY29uc3QgbmV3Q2FsZW5kYXIgPSBkaXNwbGF5WWVhclNlbGVjdGlvbih0aGlzKTtcbiAgICAgIG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfWUVBUl9GT0NVU0VEKS5mb2N1cygpO1xuICAgIH0sXG4gIH0sXG4gIGtleXVwOiB7XG4gICAgW0RBVEVfUElDS0VSX0NBTEVOREFSXShldmVudCkge1xuICAgICAgY29uc3Qga2V5ZG93biA9IHRoaXMuZGF0YXNldC5rZXlkb3duS2V5Q29kZTtcbiAgICAgIGlmIChgJHtldmVudC5rZXlDb2RlfWAgIT09IGtleWRvd24pIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH1cbiAgICB9LFxuICB9LFxuICBrZXlkb3duOiB7XG4gICAgW0RBVEVfUElDS0VSX0VYVEVSTkFMX0lOUFVUXShldmVudCkge1xuICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IEVOVEVSX0tFWUNPREUpIHtcbiAgICAgICAgdmFsaWRhdGVEYXRlSW5wdXQodGhpcyk7XG4gICAgICB9XG4gICAgfSxcbiAgICBbQ0FMRU5EQVJfREFURV06IGtleW1hcCh7XG4gICAgICBVcDogaGFuZGxlVXBGcm9tRGF0ZSxcbiAgICAgIEFycm93VXA6IGhhbmRsZVVwRnJvbURhdGUsXG4gICAgICBEb3duOiBoYW5kbGVEb3duRnJvbURhdGUsXG4gICAgICBBcnJvd0Rvd246IGhhbmRsZURvd25Gcm9tRGF0ZSxcbiAgICAgIExlZnQ6IGhhbmRsZUxlZnRGcm9tRGF0ZSxcbiAgICAgIEFycm93TGVmdDogaGFuZGxlTGVmdEZyb21EYXRlLFxuICAgICAgUmlnaHQ6IGhhbmRsZVJpZ2h0RnJvbURhdGUsXG4gICAgICBBcnJvd1JpZ2h0OiBoYW5kbGVSaWdodEZyb21EYXRlLFxuICAgICAgSG9tZTogaGFuZGxlSG9tZUZyb21EYXRlLFxuICAgICAgRW5kOiBoYW5kbGVFbmRGcm9tRGF0ZSxcbiAgICAgIFBhZ2VEb3duOiBoYW5kbGVQYWdlRG93bkZyb21EYXRlLFxuICAgICAgUGFnZVVwOiBoYW5kbGVQYWdlVXBGcm9tRGF0ZSxcbiAgICAgIFwiU2hpZnQrUGFnZURvd25cIjogaGFuZGxlU2hpZnRQYWdlRG93bkZyb21EYXRlLFxuICAgICAgXCJTaGlmdCtQYWdlVXBcIjogaGFuZGxlU2hpZnRQYWdlVXBGcm9tRGF0ZSxcbiAgICAgIFRhYjogZGF0ZVBpY2tlclRhYkV2ZW50SGFuZGxlci50YWJBaGVhZCxcbiAgICB9KSxcbiAgICBbQ0FMRU5EQVJfREFURV9QSUNLRVJdOiBrZXltYXAoe1xuICAgICAgVGFiOiBkYXRlUGlja2VyVGFiRXZlbnRIYW5kbGVyLnRhYkFoZWFkLFxuICAgICAgXCJTaGlmdCtUYWJcIjogZGF0ZVBpY2tlclRhYkV2ZW50SGFuZGxlci50YWJCYWNrLFxuICAgIH0pLFxuICAgIFtDQUxFTkRBUl9NT05USF06IGtleW1hcCh7XG4gICAgICBVcDogaGFuZGxlVXBGcm9tTW9udGgsXG4gICAgICBBcnJvd1VwOiBoYW5kbGVVcEZyb21Nb250aCxcbiAgICAgIERvd246IGhhbmRsZURvd25Gcm9tTW9udGgsXG4gICAgICBBcnJvd0Rvd246IGhhbmRsZURvd25Gcm9tTW9udGgsXG4gICAgICBMZWZ0OiBoYW5kbGVMZWZ0RnJvbU1vbnRoLFxuICAgICAgQXJyb3dMZWZ0OiBoYW5kbGVMZWZ0RnJvbU1vbnRoLFxuICAgICAgUmlnaHQ6IGhhbmRsZVJpZ2h0RnJvbU1vbnRoLFxuICAgICAgQXJyb3dSaWdodDogaGFuZGxlUmlnaHRGcm9tTW9udGgsXG4gICAgICBIb21lOiBoYW5kbGVIb21lRnJvbU1vbnRoLFxuICAgICAgRW5kOiBoYW5kbGVFbmRGcm9tTW9udGgsXG4gICAgICBQYWdlRG93bjogaGFuZGxlUGFnZURvd25Gcm9tTW9udGgsXG4gICAgICBQYWdlVXA6IGhhbmRsZVBhZ2VVcEZyb21Nb250aCxcbiAgICB9KSxcbiAgICBbQ0FMRU5EQVJfTU9OVEhfUElDS0VSXToga2V5bWFwKHtcbiAgICAgIFRhYjogbW9udGhQaWNrZXJUYWJFdmVudEhhbmRsZXIudGFiQWhlYWQsXG4gICAgICBcIlNoaWZ0K1RhYlwiOiBtb250aFBpY2tlclRhYkV2ZW50SGFuZGxlci50YWJCYWNrLFxuICAgIH0pLFxuICAgIFtDQUxFTkRBUl9ZRUFSXToga2V5bWFwKHtcbiAgICAgIFVwOiBoYW5kbGVVcEZyb21ZZWFyLFxuICAgICAgQXJyb3dVcDogaGFuZGxlVXBGcm9tWWVhcixcbiAgICAgIERvd246IGhhbmRsZURvd25Gcm9tWWVhcixcbiAgICAgIEFycm93RG93bjogaGFuZGxlRG93bkZyb21ZZWFyLFxuICAgICAgTGVmdDogaGFuZGxlTGVmdEZyb21ZZWFyLFxuICAgICAgQXJyb3dMZWZ0OiBoYW5kbGVMZWZ0RnJvbVllYXIsXG4gICAgICBSaWdodDogaGFuZGxlUmlnaHRGcm9tWWVhcixcbiAgICAgIEFycm93UmlnaHQ6IGhhbmRsZVJpZ2h0RnJvbVllYXIsXG4gICAgICBIb21lOiBoYW5kbGVIb21lRnJvbVllYXIsXG4gICAgICBFbmQ6IGhhbmRsZUVuZEZyb21ZZWFyLFxuICAgICAgUGFnZURvd246IGhhbmRsZVBhZ2VEb3duRnJvbVllYXIsXG4gICAgICBQYWdlVXA6IGhhbmRsZVBhZ2VVcEZyb21ZZWFyLFxuICAgIH0pLFxuICAgIFtDQUxFTkRBUl9ZRUFSX1BJQ0tFUl06IGtleW1hcCh7XG4gICAgICBUYWI6IHllYXJQaWNrZXJUYWJFdmVudEhhbmRsZXIudGFiQWhlYWQsXG4gICAgICBcIlNoaWZ0K1RhYlwiOiB5ZWFyUGlja2VyVGFiRXZlbnRIYW5kbGVyLnRhYkJhY2ssXG4gICAgfSksXG4gICAgW0RBVEVfUElDS0VSX0NBTEVOREFSXShldmVudCkge1xuICAgICAgdGhpcy5kYXRhc2V0LmtleWRvd25LZXlDb2RlID0gZXZlbnQua2V5Q29kZTtcbiAgICB9LFxuICAgIFtEQVRFX1BJQ0tFUl0oZXZlbnQpIHtcbiAgICAgIGNvbnN0IGtleU1hcCA9IGtleW1hcCh7XG4gICAgICAgIEVzY2FwZTogaGFuZGxlRXNjYXBlRnJvbUNhbGVuZGFyLFxuICAgICAgfSk7XG5cbiAgICAgIGtleU1hcChldmVudCk7XG4gICAgfSxcbiAgfSxcbiAgZm9jdXNvdXQ6IHtcbiAgICBbREFURV9QSUNLRVJfRVhURVJOQUxfSU5QVVRdKCkge1xuICAgICAgdmFsaWRhdGVEYXRlSW5wdXQodGhpcyk7XG4gICAgfSxcbiAgICBbREFURV9QSUNLRVJdKGV2ZW50KSB7XG4gICAgICBpZiAoIXRoaXMuY29udGFpbnMoZXZlbnQucmVsYXRlZFRhcmdldCkpIHtcbiAgICAgICAgaGlkZUNhbGVuZGFyKHRoaXMpO1xuICAgICAgfVxuICAgIH0sXG4gIH0sXG4gIGlucHV0OiB7XG4gICAgW0RBVEVfUElDS0VSX0VYVEVSTkFMX0lOUFVUXSgpIHtcbiAgICAgIHJlY29uY2lsZUlucHV0VmFsdWVzKHRoaXMpO1xuICAgICAgdXBkYXRlQ2FsZW5kYXJJZlZpc2libGUodGhpcyk7XG4gICAgfSxcbiAgfSxcbn07XG5cbmlmICghaXNJb3NEZXZpY2UoKSkge1xuICBkYXRlUGlja2VyRXZlbnRzLm1vdXNlb3ZlciA9IHtcbiAgICBbQ0FMRU5EQVJfREFURV9DVVJSRU5UX01PTlRIXSgpIHtcbiAgICAgIGhhbmRsZU1vdXNlb3ZlckZyb21EYXRlKHRoaXMpO1xuICAgIH0sXG4gICAgW0NBTEVOREFSX01PTlRIXSgpIHtcbiAgICAgIGhhbmRsZU1vdXNlb3ZlckZyb21Nb250aCh0aGlzKTtcbiAgICB9LFxuICAgIFtDQUxFTkRBUl9ZRUFSXSgpIHtcbiAgICAgIGhhbmRsZU1vdXNlb3ZlckZyb21ZZWFyKHRoaXMpO1xuICAgIH0sXG4gIH07XG59XG5cbmNvbnN0IGRhdGVQaWNrZXIgPSBiZWhhdmlvcihkYXRlUGlja2VyRXZlbnRzLCB7XG4gIGluaXQocm9vdCkge1xuICAgIHNlbGVjdE9yTWF0Y2hlcyhEQVRFX1BJQ0tFUiwgcm9vdCkuZm9yRWFjaCgoZGF0ZVBpY2tlckVsKSA9PiB7XG4gICAgICBlbmhhbmNlRGF0ZVBpY2tlcihkYXRlUGlja2VyRWwpO1xuICAgIH0pO1xuICB9LFxuICBnZXREYXRlUGlja2VyQ29udGV4dCxcbiAgZGlzYWJsZSxcbiAgZW5hYmxlLFxuICBpc0RhdGVJbnB1dEludmFsaWQsXG4gIHNldENhbGVuZGFyVmFsdWUsXG4gIHZhbGlkYXRlRGF0ZUlucHV0LFxuICByZW5kZXJDYWxlbmRhcixcbiAgdXBkYXRlQ2FsZW5kYXJJZlZpc2libGUsXG59KTtcblxuLy8gI2VuZHJlZ2lvbiBEYXRlIFBpY2tlciBFdmVudCBEZWxlZ2F0aW9uIFJlZ2lzdHJhdGlvbiAvIENvbXBvbmVudFxuXG5tb2R1bGUuZXhwb3J0cyA9IGRhdGVQaWNrZXI7XG4iLCJjb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcbmNvbnN0IHNlbGVjdCA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3RcIik7XG5jb25zdCBzZWxlY3RPck1hdGNoZXMgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2VsZWN0LW9yLW1hdGNoZXNcIik7XG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvY29uZmlnXCIpO1xuY29uc3Qge1xuICBnZXREYXRlUGlja2VyQ29udGV4dCxcbiAgaXNEYXRlSW5wdXRJbnZhbGlkLFxuICB1cGRhdGVDYWxlbmRhcklmVmlzaWJsZSxcbn0gPSByZXF1aXJlKFwiLi4vLi4vdXNhLWRhdGUtcGlja2VyL3NyYy9pbmRleFwiKTtcblxuY29uc3QgREFURV9QSUNLRVJfQ0xBU1MgPSBgJHtQUkVGSVh9LWRhdGUtcGlja2VyYDtcbmNvbnN0IERBVEVfUkFOR0VfUElDS0VSX0NMQVNTID0gYCR7UFJFRklYfS1kYXRlLXJhbmdlLXBpY2tlcmA7XG5jb25zdCBEQVRFX1JBTkdFX1BJQ0tFUl9SQU5HRV9TVEFSVF9DTEFTUyA9IGAke0RBVEVfUkFOR0VfUElDS0VSX0NMQVNTfV9fcmFuZ2Utc3RhcnRgO1xuY29uc3QgREFURV9SQU5HRV9QSUNLRVJfUkFOR0VfRU5EX0NMQVNTID0gYCR7REFURV9SQU5HRV9QSUNLRVJfQ0xBU1N9X19yYW5nZS1lbmRgO1xuXG5jb25zdCBEQVRFX1BJQ0tFUiA9IGAuJHtEQVRFX1BJQ0tFUl9DTEFTU31gO1xuY29uc3QgREFURV9SQU5HRV9QSUNLRVIgPSBgLiR7REFURV9SQU5HRV9QSUNLRVJfQ0xBU1N9YDtcbmNvbnN0IERBVEVfUkFOR0VfUElDS0VSX1JBTkdFX1NUQVJUID0gYC4ke0RBVEVfUkFOR0VfUElDS0VSX1JBTkdFX1NUQVJUX0NMQVNTfWA7XG5jb25zdCBEQVRFX1JBTkdFX1BJQ0tFUl9SQU5HRV9FTkQgPSBgLiR7REFURV9SQU5HRV9QSUNLRVJfUkFOR0VfRU5EX0NMQVNTfWA7XG5cbmNvbnN0IERFRkFVTFRfTUlOX0RBVEUgPSBcIjAwMDAtMDEtMDFcIjtcblxuLyoqXG4gKiBUaGUgcHJvcGVydGllcyBhbmQgZWxlbWVudHMgd2l0aGluIHRoZSBkYXRlIHJhbmdlIHBpY2tlci5cbiAqIEB0eXBlZGVmIHtPYmplY3R9IERhdGVSYW5nZVBpY2tlckNvbnRleHRcbiAqIEBwcm9wZXJ0eSB7SFRNTEVsZW1lbnR9IGRhdGVSYW5nZVBpY2tlckVsXG4gKiBAcHJvcGVydHkge0hUTUxFbGVtZW50fSByYW5nZVN0YXJ0RWxcbiAqIEBwcm9wZXJ0eSB7SFRNTEVsZW1lbnR9IHJhbmdlRW5kRWxcbiAqL1xuXG4vKipcbiAqIEdldCBhbiBvYmplY3Qgb2YgdGhlIHByb3BlcnRpZXMgYW5kIGVsZW1lbnRzIGJlbG9uZ2luZyBkaXJlY3RseSB0byB0aGUgZ2l2ZW5cbiAqIGRhdGUgcGlja2VyIGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCB0aGUgZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyXG4gKiBAcmV0dXJucyB7RGF0ZVJhbmdlUGlja2VyQ29udGV4dH0gZWxlbWVudHNcbiAqL1xuY29uc3QgZ2V0RGF0ZVJhbmdlUGlja2VyQ29udGV4dCA9IChlbCkgPT4ge1xuICBjb25zdCBkYXRlUmFuZ2VQaWNrZXJFbCA9IGVsLmNsb3Nlc3QoREFURV9SQU5HRV9QSUNLRVIpO1xuXG4gIGlmICghZGF0ZVJhbmdlUGlja2VyRWwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEVsZW1lbnQgaXMgbWlzc2luZyBvdXRlciAke0RBVEVfUkFOR0VfUElDS0VSfWApO1xuICB9XG5cbiAgY29uc3QgcmFuZ2VTdGFydEVsID0gZGF0ZVJhbmdlUGlja2VyRWwucXVlcnlTZWxlY3RvcihcbiAgICBEQVRFX1JBTkdFX1BJQ0tFUl9SQU5HRV9TVEFSVFxuICApO1xuICBjb25zdCByYW5nZUVuZEVsID0gZGF0ZVJhbmdlUGlja2VyRWwucXVlcnlTZWxlY3RvcihcbiAgICBEQVRFX1JBTkdFX1BJQ0tFUl9SQU5HRV9FTkRcbiAgKTtcblxuICByZXR1cm4ge1xuICAgIGRhdGVSYW5nZVBpY2tlckVsLFxuICAgIHJhbmdlU3RhcnRFbCxcbiAgICByYW5nZUVuZEVsLFxuICB9O1xufTtcblxuLyoqXG4gKiBoYW5kbGUgdXBkYXRlIGZyb20gcmFuZ2Ugc3RhcnQgZGF0ZSBwaWNrZXJcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBhbiBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSByYW5nZSBwaWNrZXJcbiAqL1xuY29uc3QgaGFuZGxlUmFuZ2VTdGFydFVwZGF0ZSA9IChlbCkgPT4ge1xuICBjb25zdCB7IGRhdGVSYW5nZVBpY2tlckVsLCByYW5nZVN0YXJ0RWwsIHJhbmdlRW5kRWwgfSA9XG4gICAgZ2V0RGF0ZVJhbmdlUGlja2VyQ29udGV4dChlbCk7XG4gIGNvbnN0IHsgaW50ZXJuYWxJbnB1dEVsIH0gPSBnZXREYXRlUGlja2VyQ29udGV4dChyYW5nZVN0YXJ0RWwpO1xuICBjb25zdCB1cGRhdGVkRGF0ZSA9IGludGVybmFsSW5wdXRFbC52YWx1ZTtcblxuICBpZiAodXBkYXRlZERhdGUgJiYgIWlzRGF0ZUlucHV0SW52YWxpZChpbnRlcm5hbElucHV0RWwpKSB7XG4gICAgcmFuZ2VFbmRFbC5kYXRhc2V0Lm1pbkRhdGUgPSB1cGRhdGVkRGF0ZTtcbiAgICByYW5nZUVuZEVsLmRhdGFzZXQucmFuZ2VEYXRlID0gdXBkYXRlZERhdGU7XG4gICAgcmFuZ2VFbmRFbC5kYXRhc2V0LmRlZmF1bHREYXRlID0gdXBkYXRlZERhdGU7XG4gIH0gZWxzZSB7XG4gICAgcmFuZ2VFbmRFbC5kYXRhc2V0Lm1pbkRhdGUgPSBkYXRlUmFuZ2VQaWNrZXJFbC5kYXRhc2V0Lm1pbkRhdGUgfHwgXCJcIjtcbiAgICByYW5nZUVuZEVsLmRhdGFzZXQucmFuZ2VEYXRlID0gXCJcIjtcbiAgICByYW5nZUVuZEVsLmRhdGFzZXQuZGVmYXVsdERhdGUgPSBcIlwiO1xuICB9XG5cbiAgdXBkYXRlQ2FsZW5kYXJJZlZpc2libGUocmFuZ2VFbmRFbCk7XG59O1xuXG4vKipcbiAqIGhhbmRsZSB1cGRhdGUgZnJvbSByYW5nZSBzdGFydCBkYXRlIHBpY2tlclxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIGFuIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHJhbmdlIHBpY2tlclxuICovXG5jb25zdCBoYW5kbGVSYW5nZUVuZFVwZGF0ZSA9IChlbCkgPT4ge1xuICBjb25zdCB7IGRhdGVSYW5nZVBpY2tlckVsLCByYW5nZVN0YXJ0RWwsIHJhbmdlRW5kRWwgfSA9XG4gICAgZ2V0RGF0ZVJhbmdlUGlja2VyQ29udGV4dChlbCk7XG4gIGNvbnN0IHsgaW50ZXJuYWxJbnB1dEVsIH0gPSBnZXREYXRlUGlja2VyQ29udGV4dChyYW5nZUVuZEVsKTtcbiAgY29uc3QgdXBkYXRlZERhdGUgPSBpbnRlcm5hbElucHV0RWwudmFsdWU7XG5cbiAgaWYgKHVwZGF0ZWREYXRlICYmICFpc0RhdGVJbnB1dEludmFsaWQoaW50ZXJuYWxJbnB1dEVsKSkge1xuICAgIHJhbmdlU3RhcnRFbC5kYXRhc2V0Lm1heERhdGUgPSB1cGRhdGVkRGF0ZTtcbiAgICByYW5nZVN0YXJ0RWwuZGF0YXNldC5yYW5nZURhdGUgPSB1cGRhdGVkRGF0ZTtcbiAgICByYW5nZVN0YXJ0RWwuZGF0YXNldC5kZWZhdWx0RGF0ZSA9IHVwZGF0ZWREYXRlO1xuICB9IGVsc2Uge1xuICAgIHJhbmdlU3RhcnRFbC5kYXRhc2V0Lm1heERhdGUgPSBkYXRlUmFuZ2VQaWNrZXJFbC5kYXRhc2V0Lm1heERhdGUgfHwgXCJcIjtcbiAgICByYW5nZVN0YXJ0RWwuZGF0YXNldC5yYW5nZURhdGUgPSBcIlwiO1xuICAgIHJhbmdlU3RhcnRFbC5kYXRhc2V0LmRlZmF1bHREYXRlID0gXCJcIjtcbiAgfVxuXG4gIHVwZGF0ZUNhbGVuZGFySWZWaXNpYmxlKHJhbmdlU3RhcnRFbCk7XG59O1xuXG4vKipcbiAqIEVuaGFuY2UgYW4gaW5wdXQgd2l0aCB0aGUgZGF0ZSBwaWNrZXIgZWxlbWVudHNcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBUaGUgaW5pdGlhbCB3cmFwcGluZyBlbGVtZW50IG9mIHRoZSBkYXRlIHJhbmdlIHBpY2tlciBjb21wb25lbnRcbiAqL1xuY29uc3QgZW5oYW5jZURhdGVSYW5nZVBpY2tlciA9IChlbCkgPT4ge1xuICBjb25zdCBkYXRlUmFuZ2VQaWNrZXJFbCA9IGVsLmNsb3Nlc3QoREFURV9SQU5HRV9QSUNLRVIpO1xuXG4gIGNvbnN0IFtyYW5nZVN0YXJ0LCByYW5nZUVuZF0gPSBzZWxlY3QoREFURV9QSUNLRVIsIGRhdGVSYW5nZVBpY2tlckVsKTtcblxuICBpZiAoIXJhbmdlU3RhcnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgJHtEQVRFX1JBTkdFX1BJQ0tFUn0gaXMgbWlzc2luZyBpbm5lciB0d28gJyR7REFURV9QSUNLRVJ9JyBlbGVtZW50c2BcbiAgICApO1xuICB9XG5cbiAgaWYgKCFyYW5nZUVuZCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGAke0RBVEVfUkFOR0VfUElDS0VSfSBpcyBtaXNzaW5nIHNlY29uZCAnJHtEQVRFX1BJQ0tFUn0nIGVsZW1lbnRgXG4gICAgKTtcbiAgfVxuXG4gIHJhbmdlU3RhcnQuY2xhc3NMaXN0LmFkZChEQVRFX1JBTkdFX1BJQ0tFUl9SQU5HRV9TVEFSVF9DTEFTUyk7XG4gIHJhbmdlRW5kLmNsYXNzTGlzdC5hZGQoREFURV9SQU5HRV9QSUNLRVJfUkFOR0VfRU5EX0NMQVNTKTtcblxuICBpZiAoIWRhdGVSYW5nZVBpY2tlckVsLmRhdGFzZXQubWluRGF0ZSkge1xuICAgIGRhdGVSYW5nZVBpY2tlckVsLmRhdGFzZXQubWluRGF0ZSA9IERFRkFVTFRfTUlOX0RBVEU7XG4gIH1cblxuICBjb25zdCB7IG1pbkRhdGUgfSA9IGRhdGVSYW5nZVBpY2tlckVsLmRhdGFzZXQ7XG4gIHJhbmdlU3RhcnQuZGF0YXNldC5taW5EYXRlID0gbWluRGF0ZTtcbiAgcmFuZ2VFbmQuZGF0YXNldC5taW5EYXRlID0gbWluRGF0ZTtcblxuICBjb25zdCB7IG1heERhdGUgfSA9IGRhdGVSYW5nZVBpY2tlckVsLmRhdGFzZXQ7XG4gIGlmIChtYXhEYXRlKSB7XG4gICAgcmFuZ2VTdGFydC5kYXRhc2V0Lm1heERhdGUgPSBtYXhEYXRlO1xuICAgIHJhbmdlRW5kLmRhdGFzZXQubWF4RGF0ZSA9IG1heERhdGU7XG4gIH1cblxuICBoYW5kbGVSYW5nZVN0YXJ0VXBkYXRlKGRhdGVSYW5nZVBpY2tlckVsKTtcbiAgaGFuZGxlUmFuZ2VFbmRVcGRhdGUoZGF0ZVJhbmdlUGlja2VyRWwpO1xufTtcblxuY29uc3QgZGF0ZVJhbmdlUGlja2VyID0gYmVoYXZpb3IoXG4gIHtcbiAgICBcImlucHV0IGNoYW5nZVwiOiB7XG4gICAgICBbREFURV9SQU5HRV9QSUNLRVJfUkFOR0VfU1RBUlRdKCkge1xuICAgICAgICBoYW5kbGVSYW5nZVN0YXJ0VXBkYXRlKHRoaXMpO1xuICAgICAgfSxcbiAgICAgIFtEQVRFX1JBTkdFX1BJQ0tFUl9SQU5HRV9FTkRdKCkge1xuICAgICAgICBoYW5kbGVSYW5nZUVuZFVwZGF0ZSh0aGlzKTtcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAge1xuICAgIGluaXQocm9vdCkge1xuICAgICAgc2VsZWN0T3JNYXRjaGVzKERBVEVfUkFOR0VfUElDS0VSLCByb290KS5mb3JFYWNoKChkYXRlUmFuZ2VQaWNrZXJFbCkgPT4ge1xuICAgICAgICBlbmhhbmNlRGF0ZVJhbmdlUGlja2VyKGRhdGVSYW5nZVBpY2tlckVsKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gIH1cbik7XG5cbm1vZHVsZS5leHBvcnRzID0gZGF0ZVJhbmdlUGlja2VyO1xuIiwiY29uc3Qgc2VsZWN0T3JNYXRjaGVzID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3NlbGVjdC1vci1tYXRjaGVzXCIpO1xuY29uc3QgYmVoYXZpb3IgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvYmVoYXZpb3JcIik7XG5jb25zdCBTYW5pdGl6ZXIgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2FuaXRpemVyXCIpO1xuY29uc3QgeyBwcmVmaXg6IFBSRUZJWCB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2NvbmZpZ1wiKTtcblxuY29uc3QgRFJPUFpPTkVfQ0xBU1MgPSBgJHtQUkVGSVh9LWZpbGUtaW5wdXRgO1xuY29uc3QgRFJPUFpPTkUgPSBgLiR7RFJPUFpPTkVfQ0xBU1N9YDtcbmNvbnN0IElOUFVUX0NMQVNTID0gYCR7UFJFRklYfS1maWxlLWlucHV0X19pbnB1dGA7XG5jb25zdCBUQVJHRVRfQ0xBU1MgPSBgJHtQUkVGSVh9LWZpbGUtaW5wdXRfX3RhcmdldGA7XG5jb25zdCBJTlBVVCA9IGAuJHtJTlBVVF9DTEFTU31gO1xuY29uc3QgQk9YX0NMQVNTID0gYCR7UFJFRklYfS1maWxlLWlucHV0X19ib3hgO1xuY29uc3QgSU5TVFJVQ1RJT05TX0NMQVNTID0gYCR7UFJFRklYfS1maWxlLWlucHV0X19pbnN0cnVjdGlvbnNgO1xuY29uc3QgUFJFVklFV19DTEFTUyA9IGAke1BSRUZJWH0tZmlsZS1pbnB1dF9fcHJldmlld2A7XG5jb25zdCBQUkVWSUVXX0hFQURJTkdfQ0xBU1MgPSBgJHtQUkVGSVh9LWZpbGUtaW5wdXRfX3ByZXZpZXctaGVhZGluZ2A7XG5jb25zdCBESVNBQkxFRF9DTEFTUyA9IGAke1BSRUZJWH0tZmlsZS1pbnB1dC0tZGlzYWJsZWRgO1xuY29uc3QgQ0hPT1NFX0NMQVNTID0gYCR7UFJFRklYfS1maWxlLWlucHV0X19jaG9vc2VgO1xuY29uc3QgQUNDRVBURURfRklMRV9NRVNTQUdFX0NMQVNTID0gYCR7UFJFRklYfS1maWxlLWlucHV0X19hY2NlcHRlZC1maWxlcy1tZXNzYWdlYDtcbmNvbnN0IERSQUdfVEVYVF9DTEFTUyA9IGAke1BSRUZJWH0tZmlsZS1pbnB1dF9fZHJhZy10ZXh0YDtcbmNvbnN0IERSQUdfQ0xBU1MgPSBgJHtQUkVGSVh9LWZpbGUtaW5wdXQtLWRyYWdgO1xuY29uc3QgTE9BRElOR19DTEFTUyA9IFwiaXMtbG9hZGluZ1wiO1xuY29uc3QgSElEREVOX0NMQVNTID0gXCJkaXNwbGF5LW5vbmVcIjtcbmNvbnN0IElOVkFMSURfRklMRV9DTEFTUyA9IFwiaGFzLWludmFsaWQtZmlsZVwiO1xuY29uc3QgR0VORVJJQ19QUkVWSUVXX0NMQVNTX05BTUUgPSBgJHtQUkVGSVh9LWZpbGUtaW5wdXRfX3ByZXZpZXctaW1hZ2VgO1xuY29uc3QgR0VORVJJQ19QUkVWSUVXX0NMQVNTID0gYCR7R0VORVJJQ19QUkVWSUVXX0NMQVNTX05BTUV9LS1nZW5lcmljYDtcbmNvbnN0IFBERl9QUkVWSUVXX0NMQVNTID0gYCR7R0VORVJJQ19QUkVWSUVXX0NMQVNTX05BTUV9LS1wZGZgO1xuY29uc3QgV09SRF9QUkVWSUVXX0NMQVNTID0gYCR7R0VORVJJQ19QUkVWSUVXX0NMQVNTX05BTUV9LS13b3JkYDtcbmNvbnN0IFZJREVPX1BSRVZJRVdfQ0xBU1MgPSBgJHtHRU5FUklDX1BSRVZJRVdfQ0xBU1NfTkFNRX0tLXZpZGVvYDtcbmNvbnN0IEVYQ0VMX1BSRVZJRVdfQ0xBU1MgPSBgJHtHRU5FUklDX1BSRVZJRVdfQ0xBU1NfTkFNRX0tLWV4Y2VsYDtcbmNvbnN0IFNQQUNFUl9HSUYgPVxuICBcImRhdGE6aW1hZ2UvZ2lmO2Jhc2U2NCxSMGxHT0RsaEFRQUJBSUFBQUFBQUFQLy8veUg1QkFFQUFBQUFMQUFBQUFBQkFBRUFBQUlCUkFBN1wiO1xuXG5sZXQgVFlQRV9JU19WQUxJRCA9IEJvb2xlYW4odHJ1ZSk7IC8vIGxvZ2ljIGdhdGUgZm9yIGNoYW5nZSBsaXN0ZW5lclxuXG4vKipcbiAqIFRoZSBwcm9wZXJ0aWVzIGFuZCBlbGVtZW50cyB3aXRoaW4gdGhlIGZpbGUgaW5wdXQuXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBGaWxlSW5wdXRDb250ZXh0XG4gKiBAcHJvcGVydHkge0hUTUxEaXZFbGVtZW50fSBkcm9wWm9uZUVsXG4gKiBAcHJvcGVydHkge0hUTUxJbnB1dEVsZW1lbnR9IGlucHV0RWxcbiAqL1xuXG4vKipcbiAqIEdldCBhbiBvYmplY3Qgb2YgdGhlIHByb3BlcnRpZXMgYW5kIGVsZW1lbnRzIGJlbG9uZ2luZyBkaXJlY3RseSB0byB0aGUgZ2l2ZW5cbiAqIGZpbGUgaW5wdXQgY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIHRoZSBlbGVtZW50IHdpdGhpbiB0aGUgZmlsZSBpbnB1dFxuICogQHJldHVybnMge0ZpbGVJbnB1dENvbnRleHR9IGVsZW1lbnRzXG4gKi9cbmNvbnN0IGdldEZpbGVJbnB1dENvbnRleHQgPSAoZWwpID0+IHtcbiAgY29uc3QgZHJvcFpvbmVFbCA9IGVsLmNsb3Nlc3QoRFJPUFpPTkUpO1xuXG4gIGlmICghZHJvcFpvbmVFbCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgRWxlbWVudCBpcyBtaXNzaW5nIG91dGVyICR7RFJPUFpPTkV9YCk7XG4gIH1cblxuICBjb25zdCBpbnB1dEVsID0gZHJvcFpvbmVFbC5xdWVyeVNlbGVjdG9yKElOUFVUKTtcblxuICByZXR1cm4ge1xuICAgIGRyb3Bab25lRWwsXG4gICAgaW5wdXRFbCxcbiAgfTtcbn07XG5cbi8qKlxuICogRGlzYWJsZSB0aGUgZmlsZSBpbnB1dCBjb21wb25lbnRcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgZmlsZSBpbnB1dCBjb21wb25lbnRcbiAqL1xuY29uc3QgZGlzYWJsZSA9IChlbCkgPT4ge1xuICBjb25zdCB7IGRyb3Bab25lRWwsIGlucHV0RWwgfSA9IGdldEZpbGVJbnB1dENvbnRleHQoZWwpO1xuXG4gIGlucHV0RWwuZGlzYWJsZWQgPSB0cnVlO1xuICBkcm9wWm9uZUVsLmNsYXNzTGlzdC5hZGQoRElTQUJMRURfQ0xBU1MpO1xuICBkcm9wWm9uZUVsLnNldEF0dHJpYnV0ZShcImFyaWEtZGlzYWJsZWRcIiwgXCJ0cnVlXCIpO1xufTtcblxuLyoqXG4gKiBFbmFibGUgdGhlIGZpbGUgaW5wdXQgY29tcG9uZW50XG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGZpbGUgaW5wdXQgY29tcG9uZW50XG4gKi9cbmNvbnN0IGVuYWJsZSA9IChlbCkgPT4ge1xuICBjb25zdCB7IGRyb3Bab25lRWwsIGlucHV0RWwgfSA9IGdldEZpbGVJbnB1dENvbnRleHQoZWwpO1xuXG4gIGlucHV0RWwuZGlzYWJsZWQgPSBmYWxzZTtcbiAgZHJvcFpvbmVFbC5jbGFzc0xpc3QucmVtb3ZlKERJU0FCTEVEX0NMQVNTKTtcbiAgZHJvcFpvbmVFbC5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWRpc2FibGVkXCIpO1xufTtcblxuLyoqXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHMgc3BlY2lhbCBjaGFyYWN0ZXJzXG4gKiBAcmV0dXJucyB7U3RyaW5nfSByZXBsYWNlcyBzcGVjaWZpZWQgdmFsdWVzXG4gKi9cbmNvbnN0IHJlcGxhY2VOYW1lID0gKHMpID0+IHtcbiAgY29uc3QgYyA9IHMuY2hhckNvZGVBdCgwKTtcbiAgaWYgKGMgPT09IDMyKSByZXR1cm4gXCItXCI7XG4gIGlmIChjID49IDY1ICYmIGMgPD0gOTApIHJldHVybiBgaW1nXyR7cy50b0xvd2VyQ2FzZSgpfWA7XG4gIHJldHVybiBgX18keyhcIjAwMFwiLCBjLnRvU3RyaW5nKDE2KSkuc2xpY2UoLTQpfWA7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gSUQgbmFtZSBmb3IgZWFjaCBmaWxlIHRoYXQgc3RyaXBzIGFsbCBpbnZhbGlkIGNoYXJhY3RlcnMuXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIG5hbWUgb2YgdGhlIGZpbGUgYWRkZWQgdG8gZmlsZSBpbnB1dCAoc2VhcmNodmFsdWUpXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBzYW1lIGNoYXJhY3RlcnMgYXMgdGhlIG5hbWUgd2l0aCBpbnZhbGlkIGNoYXJzIHJlbW92ZWQgKG5ld3ZhbHVlKVxuICovXG5jb25zdCBtYWtlU2FmZUZvcklEID0gKG5hbWUpID0+IG5hbWUucmVwbGFjZSgvW15hLXowLTldL2csIHJlcGxhY2VOYW1lKTtcblxuLy8gVGFrZXMgYSBnZW5lcmF0ZWQgc2FmZSBJRCBhbmQgY3JlYXRlcyBhIHVuaXF1ZSBJRC5cbmNvbnN0IGNyZWF0ZVVuaXF1ZUlEID0gKG5hbWUpID0+XG4gIGAke25hbWV9LSR7TWF0aC5mbG9vcihEYXRlLm5vdygpLnRvU3RyaW5nKCkgLyAxMDAwKX1gO1xuXG4vKipcbiAqIEJ1aWxkcyBmdWxsIGZpbGUgaW5wdXQgY29tcG9uZW50XG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBmaWxlSW5wdXRFbCAtIG9yaWdpbmFsIGZpbGUgaW5wdXQgb24gcGFnZVxuICogQHJldHVybnMge0hUTUxFbGVtZW50fEhUTUxFbGVtZW50fSAtIEluc3RydWN0aW9ucywgdGFyZ2V0IGFyZWEgZGl2XG4gKi9cbmNvbnN0IGJ1aWxkRmlsZUlucHV0ID0gKGZpbGVJbnB1dEVsKSA9PiB7XG4gIGNvbnN0IGFjY2VwdHNNdWx0aXBsZSA9IGZpbGVJbnB1dEVsLmhhc0F0dHJpYnV0ZShcIm11bHRpcGxlXCIpO1xuICBjb25zdCBmaWxlSW5wdXRQYXJlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBjb25zdCBkcm9wVGFyZ2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgY29uc3QgYm94ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgY29uc3QgZGlzYWJsZWQgPSBmaWxlSW5wdXRFbC5oYXNBdHRyaWJ1dGUoXCJkaXNhYmxlZFwiKTtcbiAgbGV0IGRlZmF1bHRBcmlhTGFiZWw7XG5cbiAgLy8gQWRkcyBjbGFzcyBuYW1lcyBhbmQgb3RoZXIgYXR0cmlidXRlc1xuICBmaWxlSW5wdXRFbC5jbGFzc0xpc3QucmVtb3ZlKERST1BaT05FX0NMQVNTKTtcbiAgZmlsZUlucHV0RWwuY2xhc3NMaXN0LmFkZChJTlBVVF9DTEFTUyk7XG4gIGZpbGVJbnB1dFBhcmVudC5jbGFzc0xpc3QuYWRkKERST1BaT05FX0NMQVNTKTtcbiAgYm94LmNsYXNzTGlzdC5hZGQoQk9YX0NMQVNTKTtcbiAgaW5zdHJ1Y3Rpb25zLmNsYXNzTGlzdC5hZGQoSU5TVFJVQ1RJT05TX0NMQVNTKTtcbiAgaW5zdHJ1Y3Rpb25zLnNldEF0dHJpYnV0ZShcImFyaWEtaGlkZGVuXCIsIFwidHJ1ZVwiKTtcbiAgZHJvcFRhcmdldC5jbGFzc0xpc3QuYWRkKFRBUkdFVF9DTEFTUyk7XG4gIC8vIEVuY291cmFnZSBzY3JlZW5yZWFkZXIgdG8gcmVhZCBvdXQgYXJpYSBjaGFuZ2VzIGltbWVkaWF0ZWx5IGZvbGxvd2luZyB1cGxvYWQgc3RhdHVzIGNoYW5nZVxuICBmaWxlSW5wdXRFbC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxpdmVcIiwgXCJwb2xpdGVcIik7XG5cbiAgLy8gQWRkcyBjaGlsZCBlbGVtZW50cyB0byB0aGUgRE9NXG4gIGZpbGVJbnB1dEVsLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGRyb3BUYXJnZXQsIGZpbGVJbnB1dEVsKTtcbiAgZmlsZUlucHV0RWwucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZmlsZUlucHV0UGFyZW50LCBkcm9wVGFyZ2V0KTtcbiAgZHJvcFRhcmdldC5hcHBlbmRDaGlsZChmaWxlSW5wdXRFbCk7XG4gIGZpbGVJbnB1dFBhcmVudC5hcHBlbmRDaGlsZChkcm9wVGFyZ2V0KTtcbiAgZmlsZUlucHV0RWwucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoaW5zdHJ1Y3Rpb25zLCBmaWxlSW5wdXRFbCk7XG4gIGZpbGVJbnB1dEVsLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGJveCwgZmlsZUlucHV0RWwpO1xuXG4gIC8vIERpc2FibGVkIHN0eWxpbmdcbiAgaWYgKGRpc2FibGVkKSB7XG4gICAgZGlzYWJsZShmaWxlSW5wdXRFbCk7XG4gIH1cblxuICAvLyBTZXRzIGluc3RydWN0aW9uIHRlc3QgYW5kIGFyaWEtbGFiZWwgYmFzZWQgb24gd2hldGhlciBvciBub3QgbXVsdGlwbGUgZmlsZXMgYXJlIGFjY2VwdGVkXG4gIGlmIChhY2NlcHRzTXVsdGlwbGUpIHtcbiAgICBkZWZhdWx0QXJpYUxhYmVsID0gXCJObyBmaWxlcyBzZWxlY3RlZFwiO1xuICAgIGluc3RydWN0aW9ucy5pbm5lckhUTUwgPSBTYW5pdGl6ZXIuZXNjYXBlSFRNTGA8c3BhbiBjbGFzcz1cIiR7RFJBR19URVhUX0NMQVNTfVwiPkRyYWcgZmlsZXMgaGVyZSBvciA8L3NwYW4+PHNwYW4gY2xhc3M9XCIke0NIT09TRV9DTEFTU31cIj5jaG9vc2UgZnJvbSBmb2xkZXI8L3NwYW4+YDtcbiAgICBmaWxlSW5wdXRFbC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIGRlZmF1bHRBcmlhTGFiZWwpO1xuICAgIGZpbGVJbnB1dEVsLnNldEF0dHJpYnV0ZShcImRhdGEtZGVmYXVsdC1hcmlhLWxhYmVsXCIsIGRlZmF1bHRBcmlhTGFiZWwpO1xuICB9IGVsc2Uge1xuICAgIGRlZmF1bHRBcmlhTGFiZWwgPSBcIk5vIGZpbGUgc2VsZWN0ZWRcIjtcbiAgICBpbnN0cnVjdGlvbnMuaW5uZXJIVE1MID0gU2FuaXRpemVyLmVzY2FwZUhUTUxgPHNwYW4gY2xhc3M9XCIke0RSQUdfVEVYVF9DTEFTU31cIj5EcmFnIGZpbGUgaGVyZSBvciA8L3NwYW4+PHNwYW4gY2xhc3M9XCIke0NIT09TRV9DTEFTU31cIj5jaG9vc2UgZnJvbSBmb2xkZXI8L3NwYW4+YDtcbiAgICBmaWxlSW5wdXRFbC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIGRlZmF1bHRBcmlhTGFiZWwpO1xuICAgIGZpbGVJbnB1dEVsLnNldEF0dHJpYnV0ZShcImRhdGEtZGVmYXVsdC1hcmlhLWxhYmVsXCIsIGRlZmF1bHRBcmlhTGFiZWwpO1xuICB9XG5cbiAgLy8gSUUxMSBhbmQgRWRnZSBkbyBub3Qgc3VwcG9ydCBkcm9wIGZpbGVzIG9uIGZpbGUgaW5wdXRzLCBzbyB3ZSd2ZSByZW1vdmVkIHRleHQgdGhhdCBpbmRpY2F0ZXMgdGhhdFxuICBpZiAoXG4gICAgL3J2OjExLjAvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpIHx8XG4gICAgL0VkZ2VcXC9cXGQuL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KVxuICApIHtcbiAgICBmaWxlSW5wdXRQYXJlbnQucXVlcnlTZWxlY3RvcihgLiR7RFJBR19URVhUX0NMQVNTfWApLm91dGVySFRNTCA9IFwiXCI7XG4gIH1cblxuICByZXR1cm4geyBpbnN0cnVjdGlvbnMsIGRyb3BUYXJnZXQgfTtcbn07XG5cbi8qKlxuICogUmVtb3ZlcyBpbWFnZSBwcmV2aWV3cywgd2Ugd2FudCB0byBzdGFydCB3aXRoIGEgY2xlYW4gbGlzdCBldmVyeSB0aW1lIGZpbGVzIGFyZSBhZGRlZCB0byB0aGUgZmlsZSBpbnB1dFxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZHJvcFRhcmdldCAtIHRhcmdldCBhcmVhIGRpdiB0aGF0IGVuY2FzZXMgdGhlIGlucHV0XG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBpbnN0cnVjdGlvbnMgLSB0ZXh0IHRvIGluZm9ybSB1c2VycyB0byBkcmFnIG9yIHNlbGVjdCBmaWxlc1xuICovXG5jb25zdCByZW1vdmVPbGRQcmV2aWV3cyA9IChkcm9wVGFyZ2V0LCBpbnN0cnVjdGlvbnMsIGlucHV0QXJpYUxhYmVsKSA9PiB7XG4gIGNvbnN0IGZpbGVQcmV2aWV3cyA9IGRyb3BUYXJnZXQucXVlcnlTZWxlY3RvckFsbChgLiR7UFJFVklFV19DTEFTU31gKTtcbiAgY29uc3QgZmlsZUlucHV0RWxlbWVudCA9IGRyb3BUYXJnZXQucXVlcnlTZWxlY3RvcihJTlBVVCk7XG4gIGNvbnN0IGN1cnJlbnRQcmV2aWV3SGVhZGluZyA9IGRyb3BUYXJnZXQucXVlcnlTZWxlY3RvcihcbiAgICBgLiR7UFJFVklFV19IRUFESU5HX0NMQVNTfWBcbiAgKTtcbiAgY29uc3QgY3VycmVudEVycm9yTWVzc2FnZSA9IGRyb3BUYXJnZXQucXVlcnlTZWxlY3RvcihcbiAgICBgLiR7QUNDRVBURURfRklMRV9NRVNTQUdFX0NMQVNTfWBcbiAgKTtcblxuICAvKipcbiAgICogZmluZHMgdGhlIHBhcmVudCBvZiB0aGUgcGFzc2VkIG5vZGUgYW5kIHJlbW92ZXMgdGhlIGNoaWxkXG4gICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IG5vZGVcbiAgICovXG4gIGNvbnN0IHJlbW92ZUltYWdlcyA9IChub2RlKSA9PiB7XG4gICAgbm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGUpO1xuICB9O1xuXG4gIC8vIFJlbW92ZSB0aGUgaGVhZGluZyBhYm92ZSB0aGUgcHJldmlld3NcbiAgaWYgKGN1cnJlbnRQcmV2aWV3SGVhZGluZykge1xuICAgIGN1cnJlbnRQcmV2aWV3SGVhZGluZy5vdXRlckhUTUwgPSBcIlwiO1xuICB9XG5cbiAgLy8gUmVtb3ZlIGV4aXN0aW5nIGVycm9yIG1lc3NhZ2VzXG4gIGlmIChjdXJyZW50RXJyb3JNZXNzYWdlKSB7XG4gICAgY3VycmVudEVycm9yTWVzc2FnZS5vdXRlckhUTUwgPSBcIlwiO1xuICAgIGRyb3BUYXJnZXQuY2xhc3NMaXN0LnJlbW92ZShJTlZBTElEX0ZJTEVfQ0xBU1MpO1xuICB9XG5cbiAgLy8gR2V0IHJpZCBvZiBleGlzdGluZyBwcmV2aWV3cyBpZiB0aGV5IGV4aXN0LCBzaG93IGluc3RydWN0aW9uc1xuICBpZiAoZmlsZVByZXZpZXdzICE9PSBudWxsKSB7XG4gICAgaWYgKGluc3RydWN0aW9ucykge1xuICAgICAgaW5zdHJ1Y3Rpb25zLmNsYXNzTGlzdC5yZW1vdmUoSElEREVOX0NMQVNTKTtcbiAgICB9XG4gICAgZmlsZUlucHV0RWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIGlucHV0QXJpYUxhYmVsKTtcbiAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKGZpbGVQcmV2aWV3cywgcmVtb3ZlSW1hZ2VzKTtcbiAgfVxufTtcblxuLyoqXG4gKiBXaGVuIG5ldyBmaWxlcyBhcmUgYXBwbGllZCB0byBmaWxlIGlucHV0LCB0aGlzIGZ1bmN0aW9uIGdlbmVyYXRlcyBwcmV2aWV3c1xuICogYW5kIHJlbW92ZXMgb2xkIG9uZXMuXG4gKiBAcGFyYW0ge2V2ZW50fSBlXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBmaWxlSW5wdXRFbCAtIGZpbGUgaW5wdXQgZWxlbWVudFxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gaW5zdHJ1Y3Rpb25zIC0gdGV4dCB0byBpbmZvcm0gdXNlcnMgdG8gZHJhZyBvciBzZWxlY3QgZmlsZXNcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGRyb3BUYXJnZXQgLSB0YXJnZXQgYXJlYSBkaXYgdGhhdCBlbmNhc2VzIHRoZSBpbnB1dFxuICovXG5cbmNvbnN0IGhhbmRsZUNoYW5nZSA9IChlLCBmaWxlSW5wdXRFbCwgaW5zdHJ1Y3Rpb25zLCBkcm9wVGFyZ2V0KSA9PiB7XG4gIGNvbnN0IGZpbGVOYW1lcyA9IGUudGFyZ2V0LmZpbGVzO1xuICBjb25zdCBmaWxlUHJldmlld3NIZWFkaW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgY29uc3QgaW5wdXRBcmlhTGFiZWwgPSBmaWxlSW5wdXRFbC5kYXRhc2V0LmRlZmF1bHRBcmlhTGFiZWw7XG4gIGNvbnN0IGZpbGVTdG9yZSA9IFtdO1xuXG4gIC8vIEZpcnN0LCBnZXQgcmlkIG9mIGV4aXN0aW5nIHByZXZpZXdzXG4gIHJlbW92ZU9sZFByZXZpZXdzKGRyb3BUYXJnZXQsIGluc3RydWN0aW9ucywgaW5wdXRBcmlhTGFiZWwpO1xuXG4gIC8vIFRoZW4sIGl0ZXJhdGUgdGhyb3VnaCBmaWxlcyBsaXN0IGFuZDpcbiAgLy8gMS4gQWRkIHNlbGVjdGVkIGZpbGUgbGlzdCBuYW1lcyB0byBhcmlhLWxhYmVsXG4gIC8vIDIuIENyZWF0ZSBwcmV2aWV3c1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGZpbGVOYW1lcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgY29uc3QgZmlsZU5hbWUgPSBmaWxlTmFtZXNbaV0ubmFtZTtcblxuICAgIC8vIFB1c2ggdXBkYXRlZCBmaWxlIG5hbWVzIGludG8gdGhlIHN0b3JlIGFycmF5XG4gICAgZmlsZVN0b3JlLnB1c2goZmlsZU5hbWUpO1xuXG4gICAgLy8gcmVhZCBvdXQgdGhlIHN0b3JlIGFycmF5IHZpYSBhcmlhLWxhYmVsLCB3b3JkaW5nIG9wdGlvbnMgdmFyeSBiYXNlZCBvbiBmaWxlIGNvdW50XG4gICAgaWYgKGkgPT09IDApIHtcbiAgICAgIGZpbGVJbnB1dEVsLnNldEF0dHJpYnV0ZShcbiAgICAgICAgXCJhcmlhLWxhYmVsXCIsXG4gICAgICAgIGBZb3UgaGF2ZSBzZWxlY3RlZCB0aGUgZmlsZTogJHtmaWxlTmFtZX1gXG4gICAgICApO1xuICAgIH0gZWxzZSBpZiAoaSA+PSAxKSB7XG4gICAgICBmaWxlSW5wdXRFbC5zZXRBdHRyaWJ1dGUoXG4gICAgICAgIFwiYXJpYS1sYWJlbFwiLFxuICAgICAgICBgWW91IGhhdmUgc2VsZWN0ZWQgJHtmaWxlTmFtZXMubGVuZ3RofSBmaWxlczogJHtmaWxlU3RvcmUuam9pbihcIiwgXCIpfWBcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gU3RhcnRzIHdpdGggYSBsb2FkaW5nIGltYWdlIHdoaWxlIHByZXZpZXcgaXMgY3JlYXRlZFxuICAgIHJlYWRlci5vbmxvYWRzdGFydCA9IGZ1bmN0aW9uIGNyZWF0ZUxvYWRpbmdJbWFnZSgpIHtcbiAgICAgIGNvbnN0IGltYWdlSWQgPSBjcmVhdGVVbmlxdWVJRChtYWtlU2FmZUZvcklEKGZpbGVOYW1lKSk7XG5cbiAgICAgIGluc3RydWN0aW9ucy5pbnNlcnRBZGphY2VudEhUTUwoXG4gICAgICAgIFwiYWZ0ZXJlbmRcIixcbiAgICAgICAgU2FuaXRpemVyLmVzY2FwZUhUTUxgPGRpdiBjbGFzcz1cIiR7UFJFVklFV19DTEFTU31cIiBhcmlhLWhpZGRlbj1cInRydWVcIj5cbiAgICAgICAgICA8aW1nIGlkPVwiJHtpbWFnZUlkfVwiIHNyYz1cIiR7U1BBQ0VSX0dJRn1cIiBhbHQ9XCJcIiBjbGFzcz1cIiR7R0VORVJJQ19QUkVWSUVXX0NMQVNTX05BTUV9ICR7TE9BRElOR19DTEFTU31cIi8+JHtmaWxlTmFtZX1cbiAgICAgICAgPGRpdj5gXG4gICAgICApO1xuICAgIH07XG5cbiAgICAvLyBOb3QgYWxsIGZpbGVzIHdpbGwgYmUgYWJsZSB0byBnZW5lcmF0ZSBwcmV2aWV3cy4gSW4gY2FzZSB0aGlzIGhhcHBlbnMsIHdlIHByb3ZpZGUgc2V2ZXJhbCB0eXBlcyBcImdlbmVyaWMgcHJldmlld3NcIiBiYXNlZCBvbiB0aGUgZmlsZSBleHRlbnNpb24uXG4gICAgcmVhZGVyLm9ubG9hZGVuZCA9IGZ1bmN0aW9uIGNyZWF0ZUZpbGVQcmV2aWV3KCkge1xuICAgICAgY29uc3QgaW1hZ2VJZCA9IGNyZWF0ZVVuaXF1ZUlEKG1ha2VTYWZlRm9ySUQoZmlsZU5hbWUpKTtcbiAgICAgIGNvbnN0IHByZXZpZXdJbWFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGltYWdlSWQpO1xuICAgICAgaWYgKGZpbGVOYW1lLmluZGV4T2YoXCIucGRmXCIpID4gMCkge1xuICAgICAgICBwcmV2aWV3SW1hZ2Uuc2V0QXR0cmlidXRlKFxuICAgICAgICAgIFwib25lcnJvclwiLFxuICAgICAgICAgIGB0aGlzLm9uZXJyb3I9bnVsbDt0aGlzLnNyYz1cIiR7U1BBQ0VSX0dJRn1cIjsgdGhpcy5jbGFzc0xpc3QuYWRkKFwiJHtQREZfUFJFVklFV19DTEFTU31cIilgXG4gICAgICAgICk7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICBmaWxlTmFtZS5pbmRleE9mKFwiLmRvY1wiKSA+IDAgfHxcbiAgICAgICAgZmlsZU5hbWUuaW5kZXhPZihcIi5wYWdlc1wiKSA+IDBcbiAgICAgICkge1xuICAgICAgICBwcmV2aWV3SW1hZ2Uuc2V0QXR0cmlidXRlKFxuICAgICAgICAgIFwib25lcnJvclwiLFxuICAgICAgICAgIGB0aGlzLm9uZXJyb3I9bnVsbDt0aGlzLnNyYz1cIiR7U1BBQ0VSX0dJRn1cIjsgdGhpcy5jbGFzc0xpc3QuYWRkKFwiJHtXT1JEX1BSRVZJRVdfQ0xBU1N9XCIpYFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgZmlsZU5hbWUuaW5kZXhPZihcIi54bHNcIikgPiAwIHx8XG4gICAgICAgIGZpbGVOYW1lLmluZGV4T2YoXCIubnVtYmVyc1wiKSA+IDBcbiAgICAgICkge1xuICAgICAgICBwcmV2aWV3SW1hZ2Uuc2V0QXR0cmlidXRlKFxuICAgICAgICAgIFwib25lcnJvclwiLFxuICAgICAgICAgIGB0aGlzLm9uZXJyb3I9bnVsbDt0aGlzLnNyYz1cIiR7U1BBQ0VSX0dJRn1cIjsgdGhpcy5jbGFzc0xpc3QuYWRkKFwiJHtFWENFTF9QUkVWSUVXX0NMQVNTfVwiKWBcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSBpZiAoZmlsZU5hbWUuaW5kZXhPZihcIi5tb3ZcIikgPiAwIHx8IGZpbGVOYW1lLmluZGV4T2YoXCIubXA0XCIpID4gMCkge1xuICAgICAgICBwcmV2aWV3SW1hZ2Uuc2V0QXR0cmlidXRlKFxuICAgICAgICAgIFwib25lcnJvclwiLFxuICAgICAgICAgIGB0aGlzLm9uZXJyb3I9bnVsbDt0aGlzLnNyYz1cIiR7U1BBQ0VSX0dJRn1cIjsgdGhpcy5jbGFzc0xpc3QuYWRkKFwiJHtWSURFT19QUkVWSUVXX0NMQVNTfVwiKWBcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHByZXZpZXdJbWFnZS5zZXRBdHRyaWJ1dGUoXG4gICAgICAgICAgXCJvbmVycm9yXCIsXG4gICAgICAgICAgYHRoaXMub25lcnJvcj1udWxsO3RoaXMuc3JjPVwiJHtTUEFDRVJfR0lGfVwiOyB0aGlzLmNsYXNzTGlzdC5hZGQoXCIke0dFTkVSSUNfUFJFVklFV19DTEFTU31cIilgXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIC8vIFJlbW92ZXMgbG9hZGVyIGFuZCBkaXNwbGF5cyBwcmV2aWV3XG4gICAgICBwcmV2aWV3SW1hZ2UuY2xhc3NMaXN0LnJlbW92ZShMT0FESU5HX0NMQVNTKTtcbiAgICAgIHByZXZpZXdJbWFnZS5zcmMgPSByZWFkZXIucmVzdWx0O1xuICAgIH07XG5cbiAgICBpZiAoZmlsZU5hbWVzW2ldKSB7XG4gICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlTmFtZXNbaV0pO1xuICAgIH1cblxuICAgIC8vIEFkZHMgaGVhZGluZyBhYm92ZSBmaWxlIHByZXZpZXdzLCBwbHVyYWxpemVzIGlmIHRoZXJlIGFyZSBtdWx0aXBsZVxuICAgIGlmIChpID09PSAwKSB7XG4gICAgICBkcm9wVGFyZ2V0Lmluc2VydEJlZm9yZShmaWxlUHJldmlld3NIZWFkaW5nLCBpbnN0cnVjdGlvbnMpO1xuICAgICAgZmlsZVByZXZpZXdzSGVhZGluZy5pbm5lckhUTUwgPSBgU2VsZWN0ZWQgZmlsZSA8c3BhbiBjbGFzcz1cInVzYS1maWxlLWlucHV0X19jaG9vc2VcIj5DaGFuZ2UgZmlsZTwvc3Bhbj5gO1xuICAgIH0gZWxzZSBpZiAoaSA+PSAxKSB7XG4gICAgICBkcm9wVGFyZ2V0Lmluc2VydEJlZm9yZShmaWxlUHJldmlld3NIZWFkaW5nLCBpbnN0cnVjdGlvbnMpO1xuICAgICAgZmlsZVByZXZpZXdzSGVhZGluZy5pbm5lckhUTUwgPSBTYW5pdGl6ZXIuZXNjYXBlSFRNTGAke1xuICAgICAgICBpICsgMVxuICAgICAgfSBmaWxlcyBzZWxlY3RlZCA8c3BhbiBjbGFzcz1cInVzYS1maWxlLWlucHV0X19jaG9vc2VcIj5DaGFuZ2UgZmlsZXM8L3NwYW4+YDtcbiAgICB9XG5cbiAgICAvLyBIaWRlcyBudWxsIHN0YXRlIGNvbnRlbnQgYW5kIHNldHMgcHJldmlldyBoZWFkaW5nIGNsYXNzXG4gICAgaWYgKGZpbGVQcmV2aWV3c0hlYWRpbmcpIHtcbiAgICAgIGluc3RydWN0aW9ucy5jbGFzc0xpc3QuYWRkKEhJRERFTl9DTEFTUyk7XG4gICAgICBmaWxlUHJldmlld3NIZWFkaW5nLmNsYXNzTGlzdC5hZGQoUFJFVklFV19IRUFESU5HX0NMQVNTKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogV2hlbiB1c2luZyBhbiBBY2NlcHQgYXR0cmlidXRlLCBpbnZhbGlkIGZpbGVzIHdpbGwgYmUgaGlkZGVuIGZyb21cbiAqIGZpbGUgYnJvd3NlciwgYnV0IHRoZXkgY2FuIHN0aWxsIGJlIGRyYWdnZWQgdG8gdGhlIGlucHV0LiBUaGlzXG4gKiBmdW5jdGlvbiBwcmV2ZW50cyB0aGVtIGZyb20gYmVpbmcgZHJhZ2dlZCBhbmQgcmVtb3ZlcyBlcnJvciBzdGF0ZXNcbiAqIHdoZW4gY29ycmVjdCBmaWxlcyBhcmUgYWRkZWQuXG4gKiBAcGFyYW0ge2V2ZW50fSBlXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBmaWxlSW5wdXRFbCAtIGZpbGUgaW5wdXQgZWxlbWVudFxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gaW5zdHJ1Y3Rpb25zIC0gdGV4dCB0byBpbmZvcm0gdXNlcnMgdG8gZHJhZyBvciBzZWxlY3QgZmlsZXNcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGRyb3BUYXJnZXQgLSB0YXJnZXQgYXJlYSBkaXYgdGhhdCBlbmNhc2VzIHRoZSBpbnB1dFxuICovXG5jb25zdCBwcmV2ZW50SW52YWxpZEZpbGVzID0gKGUsIGZpbGVJbnB1dEVsLCBpbnN0cnVjdGlvbnMsIGRyb3BUYXJnZXQpID0+IHtcbiAgY29uc3QgYWNjZXB0ZWRGaWxlc0F0dHIgPSBmaWxlSW5wdXRFbC5nZXRBdHRyaWJ1dGUoXCJhY2NlcHRcIik7XG4gIGRyb3BUYXJnZXQuY2xhc3NMaXN0LnJlbW92ZShJTlZBTElEX0ZJTEVfQ0xBU1MpO1xuXG4gIC8qKlxuICAgKiBXZSBjYW4gcHJvYmFibHkgbW92ZSBhd2F5IGZyb20gdGhpcyBvbmNlIElFMTEgc3VwcG9ydCBzdG9wcywgYW5kIHJlcGxhY2VcbiAgICogd2l0aCBhIHNpbXBsZSBlcyBgLmluY2x1ZGVzYFxuICAgKiBjaGVjayBpZiBlbGVtZW50IGlzIGluIGFycmF5XG4gICAqIGNoZWNrIGlmIDEgb3IgbW9yZSBhbHBoYWJldHMgYXJlIGluIHN0cmluZ1xuICAgKiBpZiBlbGVtZW50IGlzIHByZXNlbnQgcmV0dXJuIHRoZSBwb3NpdGlvbiB2YWx1ZSBhbmQgLTEgb3RoZXJ3aXNlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBmaWxlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB2YWx1ZVxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICovXG4gIGNvbnN0IGlzSW5jbHVkZWQgPSAoZmlsZSwgdmFsdWUpID0+IHtcbiAgICBsZXQgcmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICBjb25zdCBwb3MgPSBmaWxlLmluZGV4T2YodmFsdWUpO1xuICAgIGlmIChwb3MgPj0gMCkge1xuICAgICAgcmV0dXJuVmFsdWUgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gcmV0dXJuVmFsdWU7XG4gIH07XG5cbiAgLy8gUnVucyBpZiBvbmx5IHNwZWNpZmljIGZpbGVzIGFyZSBhY2NlcHRlZFxuICBpZiAoYWNjZXB0ZWRGaWxlc0F0dHIpIHtcbiAgICBjb25zdCBhY2NlcHRlZEZpbGVzID0gYWNjZXB0ZWRGaWxlc0F0dHIuc3BsaXQoXCIsXCIpO1xuICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cbiAgICAvLyBJZiBtdWx0aXBsZSBmaWxlcyBhcmUgZHJhZ2dlZCwgdGhpcyBpdGVyYXRlcyB0aHJvdWdoIHRoZW0gYW5kIGxvb2sgZm9yIGFueSBmaWxlcyB0aGF0IGFyZSBub3QgYWNjZXB0ZWQuXG4gICAgbGV0IGFsbEZpbGVzQWxsb3dlZCA9IHRydWU7XG4gICAgY29uc3Qgc2Nhbm5lZEZpbGVzID0gZS50YXJnZXQuZmlsZXMgfHwgZS5kYXRhVHJhbnNmZXIuZmlsZXM7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzY2FubmVkRmlsZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIGNvbnN0IGZpbGUgPSBzY2FubmVkRmlsZXNbaV07XG4gICAgICBpZiAoYWxsRmlsZXNBbGxvd2VkKSB7XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgYWNjZXB0ZWRGaWxlcy5sZW5ndGg7IGogKz0gMSkge1xuICAgICAgICAgIGNvbnN0IGZpbGVUeXBlID0gYWNjZXB0ZWRGaWxlc1tqXTtcbiAgICAgICAgICBhbGxGaWxlc0FsbG93ZWQgPVxuICAgICAgICAgICAgZmlsZS5uYW1lLmluZGV4T2YoZmlsZVR5cGUpID4gMCB8fFxuICAgICAgICAgICAgaXNJbmNsdWRlZChmaWxlLnR5cGUsIGZpbGVUeXBlLnJlcGxhY2UoL1xcKi9nLCBcIlwiKSk7XG4gICAgICAgICAgaWYgKGFsbEZpbGVzQWxsb3dlZCkge1xuICAgICAgICAgICAgVFlQRV9JU19WQUxJRCA9IHRydWU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBicmVhaztcbiAgICB9XG5cbiAgICAvLyBJZiBkcmFnZ2VkIGZpbGVzIGFyZSBub3QgYWNjZXB0ZWQsIHRoaXMgcmVtb3ZlcyB0aGVtIGZyb20gdGhlIHZhbHVlIG9mIHRoZSBpbnB1dCBhbmQgY3JlYXRlcyBhbmQgZXJyb3Igc3RhdGVcbiAgICBpZiAoIWFsbEZpbGVzQWxsb3dlZCkge1xuICAgICAgcmVtb3ZlT2xkUHJldmlld3MoZHJvcFRhcmdldCwgaW5zdHJ1Y3Rpb25zKTtcbiAgICAgIGZpbGVJbnB1dEVsLnZhbHVlID0gXCJcIjsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgZHJvcFRhcmdldC5pbnNlcnRCZWZvcmUoZXJyb3JNZXNzYWdlLCBmaWxlSW5wdXRFbCk7XG4gICAgICBlcnJvck1lc3NhZ2UudGV4dENvbnRlbnQgPVxuICAgICAgICBmaWxlSW5wdXRFbC5kYXRhc2V0LmVycm9ybWVzc2FnZSB8fCBgVGhpcyBpcyBub3QgYSB2YWxpZCBmaWxlIHR5cGUuYDtcbiAgICAgIGVycm9yTWVzc2FnZS5jbGFzc0xpc3QuYWRkKEFDQ0VQVEVEX0ZJTEVfTUVTU0FHRV9DTEFTUyk7XG4gICAgICBkcm9wVGFyZ2V0LmNsYXNzTGlzdC5hZGQoSU5WQUxJRF9GSUxFX0NMQVNTKTtcbiAgICAgIFRZUEVfSVNfVkFMSUQgPSBmYWxzZTtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIDEuIHBhc3NlcyB0aHJvdWdoIGdhdGUgZm9yIHByZXZlbnRpbmcgaW52YWxpZCBmaWxlc1xuICogMi4gaGFuZGxlcyB1cGRhdGVzIGlmIGZpbGUgaXMgdmFsaWRcbiAqIEBwYXJhbSB7ZXZlbnR9IGV2ZW50XG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBpbnN0cnVjdGlvbnNFbFxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdGFyZ2V0XG4gKi9cbmNvbnN0IGhhbmRsZVVwbG9hZCA9IChldmVudCwgZWxlbWVudCwgaW5zdHJ1Y3Rpb25zRWwsIGRyb3BUYXJnZXRFbCkgPT4ge1xuICBwcmV2ZW50SW52YWxpZEZpbGVzKGV2ZW50LCBlbGVtZW50LCBpbnN0cnVjdGlvbnNFbCwgZHJvcFRhcmdldEVsKTtcbiAgaWYgKFRZUEVfSVNfVkFMSUQgPT09IHRydWUpIHtcbiAgICBoYW5kbGVDaGFuZ2UoZXZlbnQsIGVsZW1lbnQsIGluc3RydWN0aW9uc0VsLCBkcm9wVGFyZ2V0RWwpO1xuICB9XG59O1xuXG5jb25zdCBmaWxlSW5wdXQgPSBiZWhhdmlvcihcbiAge30sXG4gIHtcbiAgICBpbml0KHJvb3QpIHtcbiAgICAgIHNlbGVjdE9yTWF0Y2hlcyhEUk9QWk9ORSwgcm9vdCkuZm9yRWFjaCgoZmlsZUlucHV0RWwpID0+IHtcbiAgICAgICAgY29uc3QgeyBpbnN0cnVjdGlvbnMsIGRyb3BUYXJnZXQgfSA9IGJ1aWxkRmlsZUlucHV0KGZpbGVJbnB1dEVsKTtcblxuICAgICAgICBkcm9wVGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgXCJkcmFnb3ZlclwiLFxuICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZURyYWdPdmVyKCkge1xuICAgICAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKERSQUdfQ0xBU1MpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZmFsc2VcbiAgICAgICAgKTtcblxuICAgICAgICBkcm9wVGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgXCJkcmFnbGVhdmVcIixcbiAgICAgICAgICBmdW5jdGlvbiBoYW5kbGVEcmFnTGVhdmUoKSB7XG4gICAgICAgICAgICB0aGlzLmNsYXNzTGlzdC5yZW1vdmUoRFJBR19DTEFTUyk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBmYWxzZVxuICAgICAgICApO1xuXG4gICAgICAgIGRyb3BUYXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgICBcImRyb3BcIixcbiAgICAgICAgICBmdW5jdGlvbiBoYW5kbGVEcm9wKCkge1xuICAgICAgICAgICAgdGhpcy5jbGFzc0xpc3QucmVtb3ZlKERSQUdfQ0xBU1MpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZmFsc2VcbiAgICAgICAgKTtcblxuICAgICAgICBmaWxlSW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICAgIFwiY2hhbmdlXCIsXG4gICAgICAgICAgKGUpID0+IGhhbmRsZVVwbG9hZChlLCBmaWxlSW5wdXRFbCwgaW5zdHJ1Y3Rpb25zLCBkcm9wVGFyZ2V0KSxcbiAgICAgICAgICBmYWxzZVxuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICB0ZWFyZG93bihyb290KSB7XG4gICAgICBzZWxlY3RPck1hdGNoZXMoSU5QVVQsIHJvb3QpLmZvckVhY2goKGZpbGVJbnB1dEVsKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpbGVJbnB1dFRvcEVsZW1lbnQgPSBmaWxlSW5wdXRFbC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQ7XG4gICAgICAgIGZpbGVJbnB1dFRvcEVsZW1lbnQucGFyZW50RWxlbWVudC5yZXBsYWNlQ2hpbGQoZmlsZUlucHV0RWwsIGZpbGVJbnB1dFRvcEVsZW1lbnQpO1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICAgICAgZmlsZUlucHV0RWwuY2xhc3NOYW1lID0gRFJPUFpPTkVfQ0xBU1M7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGdldEZpbGVJbnB1dENvbnRleHQsXG4gICAgZGlzYWJsZSxcbiAgICBlbmFibGUsXG4gIH1cbik7XG5cbm1vZHVsZS5leHBvcnRzID0gZmlsZUlucHV0O1xuIiwiY29uc3QgYmVoYXZpb3IgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvYmVoYXZpb3JcIik7XG5jb25zdCB7IENMSUNLIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvZXZlbnRzXCIpO1xuY29uc3QgeyBwcmVmaXg6IFBSRUZJWCB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2NvbmZpZ1wiKTtcblxuY29uc3QgU0NPUEUgPSBgLiR7UFJFRklYfS1mb290ZXItLWJpZ2A7XG5jb25zdCBOQVYgPSBgJHtTQ09QRX0gbmF2YDtcbmNvbnN0IEJVVFRPTiA9IGAke05BVn0gLiR7UFJFRklYfS1mb290ZXJfX3ByaW1hcnktbGlua2A7XG5jb25zdCBISURFX01BWF9XSURUSCA9IDQ4MDtcblxuLyoqXG4gKiBFeHBhbmRzIHNlbGVjdGVkIGZvb3RlciBtZW51IHBhbmVsLCB3aGlsZSBjb2xsYXBzaW5nIG90aGVyc1xuICovXG5mdW5jdGlvbiBzaG93UGFuZWwoKSB7XG4gIGlmICh3aW5kb3cuaW5uZXJXaWR0aCA8IEhJREVfTUFYX1dJRFRIKSB7XG4gICAgY29uc3QgaXNPcGVuID0gdGhpcy5nZXRBdHRyaWJ1dGUoXCJhcmlhLWV4cGFuZGVkXCIpID09PSBcInRydWVcIjtcbiAgICBjb25zdCB0aGlzRm9vdGVyID0gdGhpcy5jbG9zZXN0KFNDT1BFKTtcblxuICAgIC8vIENsb3NlIGFsbCBvdGhlciBtZW51c1xuICAgIHRoaXNGb290ZXIucXVlcnlTZWxlY3RvckFsbChCVVRUT04pLmZvckVhY2goKGJ1dHRvbikgPT4ge1xuICAgICAgYnV0dG9uLnNldEF0dHJpYnV0ZShcImFyaWEtZXhwYW5kZWRcIiwgZmFsc2UpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJhcmlhLWV4cGFuZGVkXCIsICFpc09wZW4pO1xuICB9XG59XG5cbi8qKlxuICogU3dhcHMgdGhlIDxoND4gZWxlbWVudCBmb3IgYSA8YnV0dG9uPiBlbGVtZW50IChhbmQgdmljZS12ZXJzYSkgYW5kIHNldHMgaWRcbiAqIG9mIG1lbnUgbGlzdFxuICpcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNNb2JpbGUgLSBJZiB0aGUgZm9vdGVyIGlzIGluIG1vYmlsZSBjb25maWd1cmF0aW9uXG4gKi9cbmZ1bmN0aW9uIHRvZ2dsZUh0bWxUYWcoaXNNb2JpbGUpIHtcbiAgY29uc3QgYmlnRm9vdGVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihTQ09QRSk7XG5cbiAgaWYgKCFiaWdGb290ZXIpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBwcmltYXJ5TGlua3MgPSBiaWdGb290ZXIucXVlcnlTZWxlY3RvckFsbChCVVRUT04pO1xuICBjb25zdCBuZXdFbGVtZW50VHlwZSA9IGlzTW9iaWxlID8gXCJidXR0b25cIiA6IFwiaDRcIjtcblxuICBwcmltYXJ5TGlua3MuZm9yRWFjaCgoY3VycmVudEVsZW1lbnQpID0+IHtcbiAgICBjb25zdCBjdXJyZW50RWxlbWVudENsYXNzZXMgPSBjdXJyZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKTtcblxuICAgIC8vIENyZWF0ZSB0aGUgbmV3IGVsZW1lbnRcbiAgICBjb25zdCBuZXdFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuZXdFbGVtZW50VHlwZSk7XG4gICAgbmV3RWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBjdXJyZW50RWxlbWVudENsYXNzZXMpO1xuICAgIG5ld0VsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZShcbiAgICAgIGAke1BSRUZJWH0tZm9vdGVyX19wcmltYXJ5LWxpbmstLWJ1dHRvbmAsXG4gICAgICBpc01vYmlsZVxuICAgICk7XG4gICAgbmV3RWxlbWVudC50ZXh0Q29udGVudCA9IGN1cnJlbnRFbGVtZW50LnRleHRDb250ZW50O1xuXG4gICAgaWYgKGlzTW9iaWxlKSB7XG4gICAgICBjb25zdCBtZW51SWQgPSBgJHtQUkVGSVh9LWZvb3Rlci1tZW51LWxpc3QtJHtNYXRoLmZsb29yKFxuICAgICAgICBNYXRoLnJhbmRvbSgpICogMTAwMDAwXG4gICAgICApfWA7XG5cbiAgICAgIG5ld0VsZW1lbnQuc2V0QXR0cmlidXRlKFwiYXJpYS1jb250cm9sc1wiLCBtZW51SWQpO1xuICAgICAgbmV3RWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWV4cGFuZGVkXCIsIFwiZmFsc2VcIik7XG4gICAgICBjdXJyZW50RWxlbWVudC5uZXh0RWxlbWVudFNpYmxpbmcuc2V0QXR0cmlidXRlKFwiaWRcIiwgbWVudUlkKTtcbiAgICAgIG5ld0VsZW1lbnQuc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcImJ1dHRvblwiKTtcbiAgICB9XG5cbiAgICAvLyBJbnNlcnQgdGhlIG5ldyBlbGVtZW50IGFuZCBkZWxldGUgdGhlIG9sZFxuICAgIGN1cnJlbnRFbGVtZW50LmFmdGVyKG5ld0VsZW1lbnQpO1xuICAgIGN1cnJlbnRFbGVtZW50LnJlbW92ZSgpO1xuICB9KTtcbn1cblxuY29uc3QgcmVzaXplID0gKGV2ZW50KSA9PiB7XG4gIHRvZ2dsZUh0bWxUYWcoZXZlbnQubWF0Y2hlcyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGJlaGF2aW9yKFxuICB7XG4gICAgW0NMSUNLXToge1xuICAgICAgW0JVVFRPTl06IHNob3dQYW5lbCxcbiAgICB9LFxuICB9LFxuICB7XG4gICAgLy8gZXhwb3J0IGZvciB1c2UgZWxzZXdoZXJlXG4gICAgSElERV9NQVhfV0lEVEgsXG5cbiAgICBpbml0KCkge1xuICAgICAgdG9nZ2xlSHRtbFRhZyh3aW5kb3cuaW5uZXJXaWR0aCA8IEhJREVfTUFYX1dJRFRIKTtcbiAgICAgIHRoaXMubWVkaWFRdWVyeUxpc3QgPSB3aW5kb3cubWF0Y2hNZWRpYShcbiAgICAgICAgYChtYXgtd2lkdGg6ICR7SElERV9NQVhfV0lEVEggLSAwLjF9cHgpYFxuICAgICAgKTtcbiAgICAgIHRoaXMubWVkaWFRdWVyeUxpc3QuYWRkTGlzdGVuZXIocmVzaXplKTtcbiAgICB9LFxuXG4gICAgdGVhcmRvd24oKSB7XG4gICAgICB0aGlzLm1lZGlhUXVlcnlMaXN0LnJlbW92ZUxpc3RlbmVyKHJlc2l6ZSk7XG4gICAgfSxcbiAgfVxuKTtcbiIsImNvbnN0IGtleW1hcCA9IHJlcXVpcmUoXCJyZWNlcHRvci9rZXltYXBcIik7XG5jb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcbmNvbnN0IHNlbGVjdCA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3RcIik7XG5jb25zdCB0b2dnbGUgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvdG9nZ2xlXCIpO1xuY29uc3QgRm9jdXNUcmFwID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2ZvY3VzLXRyYXBcIik7XG5jb25zdCBhY2NvcmRpb24gPSByZXF1aXJlKFwiLi4vLi4vdXNhLWFjY29yZGlvbi9zcmMvaW5kZXhcIik7XG5jb25zdCBTY3JvbGxCYXJXaWR0aCA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zY3JvbGxiYXItd2lkdGhcIik7XG5cbmNvbnN0IHsgQ0xJQ0sgfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9ldmVudHNcIik7XG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvY29uZmlnXCIpO1xuXG5jb25zdCBCT0RZID0gXCJib2R5XCI7XG5jb25zdCBIRUFERVIgPSBgLiR7UFJFRklYfS1oZWFkZXJgO1xuY29uc3QgTkFWID0gYC4ke1BSRUZJWH0tbmF2YDtcbmNvbnN0IE5BVl9DT05UQUlORVIgPSBgLiR7UFJFRklYfS1uYXYtY29udGFpbmVyYDtcbmNvbnN0IE5BVl9QUklNQVJZID0gYC4ke1BSRUZJWH0tbmF2X19wcmltYXJ5YDtcbmNvbnN0IE5BVl9QUklNQVJZX0lURU0gPSBgLiR7UFJFRklYfS1uYXZfX3ByaW1hcnktaXRlbWA7XG5jb25zdCBOQVZfQ09OVFJPTCA9IGBidXR0b24uJHtQUkVGSVh9LW5hdl9fbGlua2A7XG5jb25zdCBOQVZfTElOS1MgPSBgJHtOQVZ9IGFgO1xuY29uc3QgTk9OX05BVl9ISURERU5fQVRUUklCVVRFID0gYGRhdGEtbmF2LWhpZGRlbmA7XG5jb25zdCBPUEVORVJTID0gYC4ke1BSRUZJWH0tbWVudS1idG5gO1xuY29uc3QgQ0xPU0VfQlVUVE9OID0gYC4ke1BSRUZJWH0tbmF2X19jbG9zZWA7XG5jb25zdCBPVkVSTEFZID0gYC4ke1BSRUZJWH0tb3ZlcmxheWA7XG5jb25zdCBDTE9TRVJTID0gYCR7Q0xPU0VfQlVUVE9OfSwgLiR7UFJFRklYfS1vdmVybGF5YDtcbmNvbnN0IFRPR0dMRVMgPSBbTkFWLCBPVkVSTEFZXS5qb2luKFwiLCBcIik7XG5jb25zdCBOT05fTkFWX0VMRU1FTlRTID0gYGJvZHkgKjpub3QoJHtIRUFERVJ9LCAke05BVl9DT05UQUlORVJ9LCAke05BVn0sICR7TkFWfSAqKTpub3QoW2FyaWEtaGlkZGVuXSlgO1xuY29uc3QgTk9OX05BVl9ISURERU4gPSBgWyR7Tk9OX05BVl9ISURERU5fQVRUUklCVVRFfV1gO1xuXG5jb25zdCBBQ1RJVkVfQ0xBU1MgPSBcInVzYS1qcy1tb2JpbGUtbmF2LS1hY3RpdmVcIjtcbmNvbnN0IFZJU0lCTEVfQ0xBU1MgPSBcImlzLXZpc2libGVcIjtcblxubGV0IG5hdmlnYXRpb247XG5sZXQgbmF2QWN0aXZlO1xubGV0IG5vbk5hdkVsZW1lbnRzO1xuXG5jb25zdCBpc0FjdGl2ZSA9ICgpID0+IGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmNvbnRhaW5zKEFDVElWRV9DTEFTUyk7XG5jb25zdCBTQ1JPTExCQVJfV0lEVEggPSBTY3JvbGxCYXJXaWR0aCgpO1xuY29uc3QgSU5JVElBTF9QQURESU5HID0gd2luZG93XG4gIC5nZXRDb21wdXRlZFN0eWxlKGRvY3VtZW50LmJvZHkpXG4gIC5nZXRQcm9wZXJ0eVZhbHVlKFwicGFkZGluZy1yaWdodFwiKTtcbmNvbnN0IFRFTVBPUkFSWV9QQURESU5HID0gYCR7XG4gIHBhcnNlSW50KElOSVRJQUxfUEFERElORy5yZXBsYWNlKC9weC8sIFwiXCIpLCAxMCkgK1xuICBwYXJzZUludChTQ1JPTExCQVJfV0lEVEgucmVwbGFjZSgvcHgvLCBcIlwiKSwgMTApXG59cHhgO1xuXG5jb25zdCBoaWRlTm9uTmF2SXRlbXMgPSAoKSA9PiB7XG4gIGNvbnN0IGhlYWRlclBhcmVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCR7SEVBREVSfWApLnBhcmVudE5vZGU7XG4gIG5vbk5hdkVsZW1lbnRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChOT05fTkFWX0VMRU1FTlRTKTtcblxuICBub25OYXZFbGVtZW50cy5mb3JFYWNoKChub25OYXZFbGVtZW50KSA9PiB7XG4gICAgaWYobm9uTmF2RWxlbWVudCAhPT0gaGVhZGVyUGFyZW50KSB7XG4gICAgICBub25OYXZFbGVtZW50LnNldEF0dHJpYnV0ZShcImFyaWEtaGlkZGVuXCIsIHRydWUpO1xuICAgICAgbm9uTmF2RWxlbWVudC5zZXRBdHRyaWJ1dGUoTk9OX05BVl9ISURERU5fQVRUUklCVVRFLCBcIlwiKTtcbiAgICB9XG4gIH0pO1xufTtcblxuY29uc3Qgc2hvd05vbk5hdkl0ZW1zID0gKCkgPT4ge1xuICBub25OYXZFbGVtZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoTk9OX05BVl9ISURERU4pO1xuXG4gIGlmICghbm9uTmF2RWxlbWVudHMpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBSZW1vdmUgYXJpYS1oaWRkZW4gZnJvbSBub24taGVhZGVyIGVsZW1lbnRzXG4gIG5vbk5hdkVsZW1lbnRzLmZvckVhY2goKG5vbk5hdkVsZW1lbnQpID0+IHtcbiAgICBub25OYXZFbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShcImFyaWEtaGlkZGVuXCIpO1xuICAgIG5vbk5hdkVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKE5PTl9OQVZfSElEREVOX0FUVFJJQlVURSk7XG4gIH0pO1xufTtcblxuLy8gVG9nZ2xlIGFsbCBub24taGVhZGVyIGVsZW1lbnRzICMzNTI3LlxuY29uc3QgdG9nZ2xlTm9uTmF2SXRlbXMgPSAoYWN0aXZlKSA9PiB7XG4gIGlmIChhY3RpdmUpIHtcbiAgICBoaWRlTm9uTmF2SXRlbXMoKTtcbiAgfSBlbHNlIHtcbiAgICBzaG93Tm9uTmF2SXRlbXMoKTtcbiAgfVxufTtcblxuY29uc3QgdG9nZ2xlTmF2ID0gKGFjdGl2ZSkgPT4ge1xuICBjb25zdCB7IGJvZHkgfSA9IGRvY3VtZW50O1xuICBjb25zdCBzYWZlQWN0aXZlID0gdHlwZW9mIGFjdGl2ZSA9PT0gXCJib29sZWFuXCIgPyBhY3RpdmUgOiAhaXNBY3RpdmUoKTtcblxuICBib2R5LmNsYXNzTGlzdC50b2dnbGUoQUNUSVZFX0NMQVNTLCBzYWZlQWN0aXZlKTtcblxuICBzZWxlY3QoVE9HR0xFUykuZm9yRWFjaCgoZWwpID0+XG4gICAgZWwuY2xhc3NMaXN0LnRvZ2dsZShWSVNJQkxFX0NMQVNTLCBzYWZlQWN0aXZlKVxuICApO1xuXG4gIG5hdmlnYXRpb24uZm9jdXNUcmFwLnVwZGF0ZShzYWZlQWN0aXZlKTtcblxuICBjb25zdCBjbG9zZUJ1dHRvbiA9IGJvZHkucXVlcnlTZWxlY3RvcihDTE9TRV9CVVRUT04pO1xuICBjb25zdCBtZW51QnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihPUEVORVJTKTtcblxuICBib2R5LnN0eWxlLnBhZGRpbmdSaWdodCA9XG4gICAgYm9keS5zdHlsZS5wYWRkaW5nUmlnaHQgPT09IFRFTVBPUkFSWV9QQURESU5HXG4gICAgICA/IElOSVRJQUxfUEFERElOR1xuICAgICAgOiBURU1QT1JBUllfUEFERElORztcblxuICB0b2dnbGVOb25OYXZJdGVtcyhzYWZlQWN0aXZlKTtcblxuICBpZiAoc2FmZUFjdGl2ZSAmJiBjbG9zZUJ1dHRvbikge1xuICAgIC8vIFRoZSBtb2JpbGUgbmF2IHdhcyBqdXN0IGFjdGl2YXRlZC4gRm9jdXMgb24gdGhlIGNsb3NlIGJ1dHRvbiwgd2hpY2ggaXNcbiAgICAvLyBqdXN0IGJlZm9yZSBhbGwgdGhlIG5hdiBlbGVtZW50cyBpbiB0aGUgdGFiIG9yZGVyLlxuICAgIGNsb3NlQnV0dG9uLmZvY3VzKCk7XG4gIH0gZWxzZSBpZiAoXG4gICAgIXNhZmVBY3RpdmUgJiZcbiAgICBkb2N1bWVudC5hY3RpdmVFbGVtZW50ID09PSBjbG9zZUJ1dHRvbiAmJlxuICAgIG1lbnVCdXR0b25cbiAgKSB7XG4gICAgLy8gVGhlIG1vYmlsZSBuYXYgd2FzIGp1c3QgZGVhY3RpdmF0ZWQsIGFuZCBmb2N1cyB3YXMgb24gdGhlIGNsb3NlXG4gICAgLy8gYnV0dG9uLCB3aGljaCBpcyBubyBsb25nZXIgdmlzaWJsZS4gV2UgZG9uJ3Qgd2FudCB0aGUgZm9jdXMgdG9cbiAgICAvLyBkaXNhcHBlYXIgaW50byB0aGUgdm9pZCwgc28gZm9jdXMgb24gdGhlIG1lbnUgYnV0dG9uIGlmIGl0J3NcbiAgICAvLyB2aXNpYmxlICh0aGlzIG1heSBoYXZlIGJlZW4gd2hhdCB0aGUgdXNlciB3YXMganVzdCBmb2N1c2VkIG9uLFxuICAgIC8vIGlmIHRoZXkgdHJpZ2dlcmVkIHRoZSBtb2JpbGUgbmF2IGJ5IG1pc3Rha2UpLlxuICAgIG1lbnVCdXR0b24uZm9jdXMoKTtcbiAgfVxuXG4gIHJldHVybiBzYWZlQWN0aXZlO1xufTtcblxuY29uc3QgcmVzaXplID0gKCkgPT4ge1xuICBjb25zdCBjbG9zZXIgPSBkb2N1bWVudC5ib2R5LnF1ZXJ5U2VsZWN0b3IoQ0xPU0VfQlVUVE9OKTtcblxuICBpZiAoaXNBY3RpdmUoKSAmJiBjbG9zZXIgJiYgY2xvc2VyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoID09PSAwKSB7XG4gICAgLy8gV2hlbiB0aGUgbW9iaWxlIG5hdiBpcyBhY3RpdmUsIGFuZCB0aGUgY2xvc2UgYm94IGlzbid0IHZpc2libGUsXG4gICAgLy8gd2Uga25vdyB0aGUgdXNlcidzIHZpZXdwb3J0IGhhcyBiZWVuIHJlc2l6ZWQgdG8gYmUgbGFyZ2VyLlxuICAgIC8vIExldCdzIG1ha2UgdGhlIHBhZ2Ugc3RhdGUgY29uc2lzdGVudCBieSBkZWFjdGl2YXRpbmcgdGhlIG1vYmlsZSBuYXYuXG4gICAgbmF2aWdhdGlvbi50b2dnbGVOYXYuY2FsbChjbG9zZXIsIGZhbHNlKTtcbiAgfVxufTtcblxuY29uc3Qgb25NZW51Q2xvc2UgPSAoKSA9PiBuYXZpZ2F0aW9uLnRvZ2dsZU5hdi5jYWxsKG5hdmlnYXRpb24sIGZhbHNlKTtcblxuY29uc3QgaGlkZUFjdGl2ZU5hdkRyb3Bkb3duID0gKCkgPT4ge1xuICBpZiAoIW5hdkFjdGl2ZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRvZ2dsZShuYXZBY3RpdmUsIGZhbHNlKTtcbiAgbmF2QWN0aXZlID0gbnVsbDtcbn07XG5cbmNvbnN0IGZvY3VzTmF2QnV0dG9uID0gKGV2ZW50KSA9PiB7XG4gIGNvbnN0IHBhcmVudE5hdkl0ZW0gPSBldmVudC50YXJnZXQuY2xvc2VzdChOQVZfUFJJTUFSWV9JVEVNKTtcblxuICAvLyBPbmx5IHNoaWZ0IGZvY3VzIGlmIHdpdGhpbiBkcm9wZG93blxuICBpZiAoIWV2ZW50LnRhcmdldC5tYXRjaGVzKE5BVl9DT05UUk9MKSkge1xuICAgIHBhcmVudE5hdkl0ZW0ucXVlcnlTZWxlY3RvcihOQVZfQ09OVFJPTCkuZm9jdXMoKTtcbiAgfVxufTtcblxuY29uc3QgaGFuZGxlRXNjYXBlID0gKGV2ZW50KSA9PiB7XG4gIGhpZGVBY3RpdmVOYXZEcm9wZG93bigpO1xuICBmb2N1c05hdkJ1dHRvbihldmVudCk7XG59O1xuXG5uYXZpZ2F0aW9uID0gYmVoYXZpb3IoXG4gIHtcbiAgICBbQ0xJQ0tdOiB7XG4gICAgICBbTkFWX0NPTlRST0xdKCkge1xuICAgICAgICAvLyBJZiBhbm90aGVyIG5hdiBpcyBvcGVuLCBjbG9zZSBpdFxuICAgICAgICBpZiAobmF2QWN0aXZlICE9PSB0aGlzKSB7XG4gICAgICAgICAgaGlkZUFjdGl2ZU5hdkRyb3Bkb3duKCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gc3RvcmUgYSByZWZlcmVuY2UgdG8gdGhlIGxhc3QgY2xpY2tlZCBuYXYgbGluayBlbGVtZW50LCBzbyB3ZVxuICAgICAgICAvLyBjYW4gaGlkZSB0aGUgZHJvcGRvd24gaWYgYW5vdGhlciBlbGVtZW50IG9uIHRoZSBwYWdlIGlzIGNsaWNrZWRcbiAgICAgICAgaWYgKCFuYXZBY3RpdmUpIHtcbiAgICAgICAgICBuYXZBY3RpdmUgPSB0aGlzO1xuICAgICAgICAgIHRvZ2dsZShuYXZBY3RpdmUsIHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRG8gdGhpcyBzbyB0aGUgZXZlbnQgaGFuZGxlciBvbiB0aGUgYm9keSBkb2Vzbid0IGZpcmVcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSxcbiAgICAgIFtCT0RZXTogaGlkZUFjdGl2ZU5hdkRyb3Bkb3duLFxuICAgICAgW09QRU5FUlNdOiB0b2dnbGVOYXYsXG4gICAgICBbQ0xPU0VSU106IHRvZ2dsZU5hdixcbiAgICAgIFtOQVZfTElOS1NdKCkge1xuICAgICAgICAvLyBBIG5hdmlnYXRpb24gbGluayBoYXMgYmVlbiBjbGlja2VkISBXZSB3YW50IHRvIGNvbGxhcHNlIGFueVxuICAgICAgICAvLyBoaWVyYXJjaGljYWwgbmF2aWdhdGlvbiBVSSBpdCdzIGEgcGFydCBvZiwgc28gdGhhdCB0aGUgdXNlclxuICAgICAgICAvLyBjYW4gZm9jdXMgb24gd2hhdGV2ZXIgdGhleSd2ZSBqdXN0IHNlbGVjdGVkLlxuXG4gICAgICAgIC8vIFNvbWUgbmF2aWdhdGlvbiBsaW5rcyBhcmUgaW5zaWRlIGFjY29yZGlvbnM7IHdoZW4gdGhleSdyZVxuICAgICAgICAvLyBjbGlja2VkLCB3ZSB3YW50IHRvIGNvbGxhcHNlIHRob3NlIGFjY29yZGlvbnMuXG4gICAgICAgIGNvbnN0IGFjYyA9IHRoaXMuY2xvc2VzdChhY2NvcmRpb24uQUNDT1JESU9OKTtcblxuICAgICAgICBpZiAoYWNjKSB7XG4gICAgICAgICAgYWNjb3JkaW9uLmdldEJ1dHRvbnMoYWNjKS5mb3JFYWNoKChidG4pID0+IGFjY29yZGlvbi5oaWRlKGJ0bikpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlIG1vYmlsZSBuYXZpZ2F0aW9uIG1lbnUgaXMgYWN0aXZlLCB3ZSB3YW50IHRvIGhpZGUgaXQuXG4gICAgICAgIGlmIChpc0FjdGl2ZSgpKSB7XG4gICAgICAgICAgbmF2aWdhdGlvbi50b2dnbGVOYXYuY2FsbChuYXZpZ2F0aW9uLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSxcbiAgICBrZXlkb3duOiB7XG4gICAgICBbTkFWX1BSSU1BUlldOiBrZXltYXAoeyBFc2NhcGU6IGhhbmRsZUVzY2FwZSB9KSxcbiAgICB9LFxuICAgIGZvY3Vzb3V0OiB7XG4gICAgICBbTkFWX1BSSU1BUlldKGV2ZW50KSB7XG4gICAgICAgIGNvbnN0IG5hdiA9IGV2ZW50LnRhcmdldC5jbG9zZXN0KE5BVl9QUklNQVJZKTtcblxuICAgICAgICBpZiAoIW5hdi5jb250YWlucyhldmVudC5yZWxhdGVkVGFyZ2V0KSkge1xuICAgICAgICAgIGhpZGVBY3RpdmVOYXZEcm9wZG93bigpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIHtcbiAgICBpbml0KHJvb3QpIHtcbiAgICAgIGNvbnN0IHRyYXBDb250YWluZXIgPSByb290Lm1hdGNoZXMoTkFWKSA/IHJvb3QgOiByb290LnF1ZXJ5U2VsZWN0b3IoTkFWKTtcblxuICAgICAgaWYgKHRyYXBDb250YWluZXIpIHtcbiAgICAgICAgbmF2aWdhdGlvbi5mb2N1c1RyYXAgPSBGb2N1c1RyYXAodHJhcENvbnRhaW5lciwge1xuICAgICAgICAgIEVzY2FwZTogb25NZW51Q2xvc2UsXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZXNpemUoKTtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIHJlc2l6ZSwgZmFsc2UpO1xuICAgIH0sXG4gICAgdGVhcmRvd24oKSB7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCByZXNpemUsIGZhbHNlKTtcbiAgICAgIG5hdkFjdGl2ZSA9IGZhbHNlO1xuICAgIH0sXG4gICAgZm9jdXNUcmFwOiBudWxsLFxuICAgIHRvZ2dsZU5hdixcbiAgfVxuKTtcblxubW9kdWxlLmV4cG9ydHMgPSBuYXZpZ2F0aW9uO1xuIiwiY29uc3Qgb25jZSA9IHJlcXVpcmUoXCJyZWNlcHRvci9vbmNlXCIpO1xuY29uc3Qga2V5bWFwID0gcmVxdWlyZShcInJlY2VwdG9yL2tleW1hcFwiKTtcbmNvbnN0IHNlbGVjdE9yTWF0Y2hlcyA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3Qtb3ItbWF0Y2hlc1wiKTtcbmNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xuY29uc3QgeyBwcmVmaXg6IFBSRUZJWCB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2NvbmZpZ1wiKTtcbmNvbnN0IHsgQ0xJQ0sgfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9ldmVudHNcIik7XG5jb25zdCBTYW5pdGl6ZXIgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2FuaXRpemVyXCIpO1xuXG5jb25zdCBDVVJSRU5UX0NMQVNTID0gYCR7UFJFRklYfS1jdXJyZW50YDtcbmNvbnN0IElOX1BBR0VfTkFWX1RJVExFX1RFWFQgPSBcIk9uIHRoaXMgcGFnZVwiO1xuY29uc3QgSU5fUEFHRV9OQVZfVElUTEVfSEVBRElOR19MRVZFTCA9IFwiaDRcIjtcbmNvbnN0IElOX1BBR0VfTkFWX1NDUk9MTF9PRkZTRVQgPSAwO1xuY29uc3QgSU5fUEFHRV9OQVZfUk9PVF9NQVJHSU4gPSBcIjBweCAwcHggMHB4IDBweFwiO1xuY29uc3QgSU5fUEFHRV9OQVZfVEhSRVNIT0xEID0gXCIxXCI7XG5jb25zdCBJTl9QQUdFX05BVl9DTEFTUyA9IGAke1BSRUZJWH0taW4tcGFnZS1uYXZgO1xuY29uc3QgSU5fUEFHRV9OQVZfQU5DSE9SX0NMQVNTID0gYCR7UFJFRklYfS1hbmNob3JgO1xuY29uc3QgSU5fUEFHRV9OQVZfTkFWX0NMQVNTID0gYCR7SU5fUEFHRV9OQVZfQ0xBU1N9X19uYXZgO1xuY29uc3QgSU5fUEFHRV9OQVZfTElTVF9DTEFTUyA9IGAke0lOX1BBR0VfTkFWX0NMQVNTfV9fbGlzdGA7XG5jb25zdCBJTl9QQUdFX05BVl9JVEVNX0NMQVNTID0gYCR7SU5fUEFHRV9OQVZfQ0xBU1N9X19pdGVtYDtcbmNvbnN0IElOX1BBR0VfTkFWX0xJTktfQ0xBU1MgPSBgJHtJTl9QQUdFX05BVl9DTEFTU31fX2xpbmtgO1xuY29uc3QgSU5fUEFHRV9OQVZfVElUTEVfQ0xBU1MgPSBgJHtJTl9QQUdFX05BVl9DTEFTU31fX2hlYWRpbmdgO1xuY29uc3QgU1VCX0lURU1fQ0xBU1MgPSBgJHtJTl9QQUdFX05BVl9JVEVNX0NMQVNTfS0tc3ViLWl0ZW1gO1xuY29uc3QgTUFJTl9FTEVNRU5UID0gXCJtYWluXCI7XG5cbi8qKlxuICogU2V0IHRoZSBhY3RpdmUgbGluayBzdGF0ZSBmb3IgdGhlIGN1cnJlbnRseSBvYnNlcnZlZCBzZWN0aW9uXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGluLXBhZ2UgbmF2IGNvbXBvbmVudFxuICovXG5jb25zdCBzZXRBY3RpdmUgPSAoZWwpID0+IHtcbiAgY29uc3QgYWxsTGlua3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGAuJHtJTl9QQUdFX05BVl9MSU5LX0NMQVNTfWApO1xuICBlbC5tYXAoKGkpID0+IHtcbiAgICBpZiAoaS5pc0ludGVyc2VjdGluZyA9PT0gdHJ1ZSAmJiBpLmludGVyc2VjdGlvblJhdGlvID49IDEpIHtcbiAgICAgIGFsbExpbmtzLmZvckVhY2goKGxpbmspID0+IGxpbmsuY2xhc3NMaXN0LnJlbW92ZShDVVJSRU5UX0NMQVNTKSk7XG4gICAgICBkb2N1bWVudFxuICAgICAgICAucXVlcnlTZWxlY3RvcihgYVtocmVmPVwiIyR7aS50YXJnZXQuaWR9XCJdYClcbiAgICAgICAgLmNsYXNzTGlzdC5hZGQoQ1VSUkVOVF9DTEFTUyk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9KTtcbn07XG5cbi8qKlxuICogUmV0dXJuIGEgbm9kZSBsaXN0IG9mIHNlY3Rpb24gaGVhZGluZ3NcbiAqXG4gKiBAcmV0dXJuIHtIVE1MRWxlbWVudFtdfSAtIEFuIGFycmF5IG9mIERPTSBub2Rlc1xuICovXG5jb25zdCBnZXRTZWN0aW9uSGVhZGluZ3MgPSAoKSA9PiB7XG4gIGNvbnN0IHNlY3Rpb25IZWFkaW5ncyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXG4gICAgYCR7TUFJTl9FTEVNRU5UfSBoMiwgJHtNQUlOX0VMRU1FTlR9IGgzYFxuICApO1xuICByZXR1cm4gc2VjdGlvbkhlYWRpbmdzO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gYSBub2RlIGxpc3Qgb2Ygc2VjdGlvbiBhbmNob3IgdGFnc1xuICpcbiAqIEByZXR1cm4ge0hUTUxFbGVtZW50W119IC0gQW4gYXJyYXkgb2YgRE9NIG5vZGVzXG4gKi9cbmNvbnN0IGdldFNlY3Rpb25BbmNob3JzID0gKCkgPT4ge1xuICBjb25zdCBzZWN0aW9uQW5jaG9ycyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXG4gICAgYC4ke0lOX1BBR0VfTkFWX0FOQ0hPUl9DTEFTU31gXG4gICk7XG4gIHJldHVybiBzZWN0aW9uQW5jaG9ycztcbn07XG5cbi8qKlxuICogUmV0dXJuIGEgc2VjdGlvbiBpZC9hbmNob3IgaGFzaCB3aXRob3V0IHRoZSBudW1iZXIgc2lnblxuICpcbiAqIEByZXR1cm4ge1N0cmluZ30gLSBJZCB2YWx1ZSB3aXRoIHRoZSBudW1iZXIgc2lnbiByZW1vdmVkXG4gKi9cbmNvbnN0IGdldFNlY3Rpb25JZCA9ICh2YWx1ZSkgPT4ge1xuICBsZXQgaWQ7XG5cbiAgLy8gQ2hlY2sgaWYgdmFsdWUgaXMgYW4gZXZlbnQgb3IgZWxlbWVudCBhbmQgZ2V0IHRoZSBjbGVhbmVkIHVwIGlkXG4gIGlmICh2YWx1ZSAmJiB2YWx1ZS5ub2RlVHlwZSA9PT0gMSkge1xuICAgIGlkID0gdmFsdWUuZ2V0QXR0cmlidXRlKFwiaHJlZlwiKS5yZXBsYWNlKFwiI1wiLCBcIlwiKTtcbiAgfSBlbHNlIHtcbiAgICBpZCA9IHZhbHVlLnRhcmdldC5oYXNoLnJlcGxhY2UoXCIjXCIsIFwiXCIpO1xuICB9XG5cbiAgcmV0dXJuIGlkO1xufTtcblxuLyoqXG4gKiBTY3JvbGwgc21vb3RobHkgdG8gYSBzZWN0aW9uIGJhc2VkIG9uIHRoZSBwYXNzZWQgaW4gZWxlbWVudFxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IC0gSWQgdmFsdWUgd2l0aCB0aGUgbnVtYmVyIHNpZ24gcmVtb3ZlZFxuICovXG5jb25zdCBoYW5kbGVTY3JvbGxUb1NlY3Rpb24gPSAoZWwpID0+IHtcbiAgY29uc3QgaW5QYWdlTmF2RWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAuJHtJTl9QQUdFX05BVl9DTEFTU31gKTtcbiAgY29uc3QgaW5QYWdlTmF2U2Nyb2xsT2Zmc2V0ID1cbiAgICBpblBhZ2VOYXZFbC5kYXRhc2V0LnNjcm9sbE9mZnNldCB8fCBJTl9QQUdFX05BVl9TQ1JPTExfT0ZGU0VUO1xuXG4gIHdpbmRvdy5zY3JvbGwoe1xuICAgIGJlaGF2aW9yOiBcInNtb290aFwiLFxuICAgIHRvcDogZWwub2Zmc2V0VG9wIC0gaW5QYWdlTmF2U2Nyb2xsT2Zmc2V0LFxuICAgIGJsb2NrOiBcInN0YXJ0XCIsXG4gIH0pO1xufTtcblxuLyoqXG4gKiBDcmVhdGUgdGhlIGluLXBhZ2UgbmF2aWdhdGlvbiBjb21wb25lbnRcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBpblBhZ2VOYXZFbCBUaGUgaW4tcGFnZSBuYXYgZWxlbWVudFxuICovXG5jb25zdCBjcmVhdGVJblBhZ2VOYXYgPSAoaW5QYWdlTmF2RWwpID0+IHtcbiAgY29uc3QgaW5QYWdlTmF2VGl0bGVUZXh0ID0gU2FuaXRpemVyLmVzY2FwZUhUTUxgJHtcbiAgICBpblBhZ2VOYXZFbC5kYXRhc2V0LnRpdGxlVGV4dCB8fCBJTl9QQUdFX05BVl9USVRMRV9URVhUXG4gIH1gO1xuICBjb25zdCBpblBhZ2VOYXZUaXRsZUhlYWRpbmdMZXZlbCA9IFNhbml0aXplci5lc2NhcGVIVE1MYCR7XG4gICAgaW5QYWdlTmF2RWwuZGF0YXNldC50aXRsZUhlYWRpbmdMZXZlbCB8fCBJTl9QQUdFX05BVl9USVRMRV9IRUFESU5HX0xFVkVMXG4gIH1gO1xuICBjb25zdCBpblBhZ2VOYXZSb290TWFyZ2luID0gU2FuaXRpemVyLmVzY2FwZUhUTUxgJHtcbiAgICBpblBhZ2VOYXZFbC5kYXRhc2V0LnJvb3RNYXJnaW4gfHwgSU5fUEFHRV9OQVZfUk9PVF9NQVJHSU5cbiAgfWA7XG4gIGNvbnN0IGluUGFnZU5hdlRocmVzaG9sZCA9IFNhbml0aXplci5lc2NhcGVIVE1MYCR7XG4gICAgaW5QYWdlTmF2RWwuZGF0YXNldC50aHJlc2hvbGQgfHwgSU5fUEFHRV9OQVZfVEhSRVNIT0xEXG4gIH1gO1xuXG4gIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgcm9vdDogbnVsbCxcbiAgICByb290TWFyZ2luOiBpblBhZ2VOYXZSb290TWFyZ2luLFxuICAgIHRocmVzaG9sZDogW2luUGFnZU5hdlRocmVzaG9sZF0sXG4gIH07XG5cbiAgY29uc3Qgc2VjdGlvbkhlYWRpbmdzID0gZ2V0U2VjdGlvbkhlYWRpbmdzKCk7XG4gIGNvbnN0IGluUGFnZU5hdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJuYXZcIik7XG4gIGluUGFnZU5hdi5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIGluUGFnZU5hdlRpdGxlVGV4dCk7XG4gIGluUGFnZU5hdi5jbGFzc0xpc3QuYWRkKElOX1BBR0VfTkFWX05BVl9DTEFTUyk7XG5cbiAgY29uc3QgaW5QYWdlTmF2VGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGluUGFnZU5hdlRpdGxlSGVhZGluZ0xldmVsKTtcbiAgaW5QYWdlTmF2VGl0bGUuY2xhc3NMaXN0LmFkZChJTl9QQUdFX05BVl9USVRMRV9DTEFTUyk7XG4gIGluUGFnZU5hdlRpdGxlLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIFwiMFwiKTtcbiAgaW5QYWdlTmF2VGl0bGUudGV4dENvbnRlbnQgPSBpblBhZ2VOYXZUaXRsZVRleHQ7XG4gIGluUGFnZU5hdi5hcHBlbmRDaGlsZChpblBhZ2VOYXZUaXRsZSk7XG5cbiAgY29uc3QgaW5QYWdlTmF2TGlzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ1bFwiKTtcbiAgaW5QYWdlTmF2TGlzdC5jbGFzc0xpc3QuYWRkKElOX1BBR0VfTkFWX0xJU1RfQ0xBU1MpO1xuICBpblBhZ2VOYXYuYXBwZW5kQ2hpbGQoaW5QYWdlTmF2TGlzdCk7XG5cbiAgc2VjdGlvbkhlYWRpbmdzLmZvckVhY2goKGVsLCBpKSA9PiB7XG4gICAgY29uc3QgbGlzdEl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XG4gICAgY29uc3QgbmF2TGlua3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcbiAgICBjb25zdCBhbmNob3JUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcbiAgICBjb25zdCB0ZXh0Q29udGVudE9mTGluayA9IGVsLnRleHRDb250ZW50O1xuICAgIGNvbnN0IHRhZyA9IGVsLnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcblxuICAgIGxpc3RJdGVtLmNsYXNzTGlzdC5hZGQoSU5fUEFHRV9OQVZfSVRFTV9DTEFTUyk7XG4gICAgaWYgKHRhZyA9PT0gXCJoM1wiKSB7XG4gICAgICBsaXN0SXRlbS5jbGFzc0xpc3QuYWRkKFNVQl9JVEVNX0NMQVNTKTtcbiAgICB9XG5cbiAgICBuYXZMaW5rcy5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIGAjc2VjdGlvbl8ke2l9YCk7XG4gICAgbmF2TGlua3Muc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgSU5fUEFHRV9OQVZfTElOS19DTEFTUyk7XG4gICAgbmF2TGlua3MudGV4dENvbnRlbnQgPSB0ZXh0Q29udGVudE9mTGluaztcblxuICAgIGFuY2hvclRhZy5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBgc2VjdGlvbl8ke2l9YCk7XG4gICAgYW5jaG9yVGFnLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIElOX1BBR0VfTkFWX0FOQ0hPUl9DTEFTUyk7XG4gICAgZWwuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYWZ0ZXJiZWdpblwiLCBhbmNob3JUYWcpO1xuXG4gICAgaW5QYWdlTmF2TGlzdC5hcHBlbmRDaGlsZChsaXN0SXRlbSk7XG4gICAgbGlzdEl0ZW0uYXBwZW5kQ2hpbGQobmF2TGlua3MpO1xuICB9KTtcblxuICBpblBhZ2VOYXZFbC5hcHBlbmRDaGlsZChpblBhZ2VOYXYpO1xuXG4gIGNvbnN0IGFuY2hvclRhZ3MgPSBnZXRTZWN0aW9uQW5jaG9ycygpO1xuICBjb25zdCBvYnNlcnZlU2VjdGlvbnMgPSBuZXcgd2luZG93LkludGVyc2VjdGlvbk9ic2VydmVyKHNldEFjdGl2ZSwgb3B0aW9ucyk7XG5cbiAgYW5jaG9yVGFncy5mb3JFYWNoKCh0YWcpID0+IHtcbiAgICBvYnNlcnZlU2VjdGlvbnMub2JzZXJ2ZSh0YWcpO1xuICB9KTtcbn07XG5cbi8qKlxuICogSGFuZGxlIGNsaWNrIGZyb20gbGlua1xuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBpbi1wYWdlIG5hdiBjb21wb25lbnRcbiAqL1xuY29uc3QgaGFuZGxlQ2xpY2tGcm9tTGluayA9IChlbCkgPT4ge1xuICBjb25zdCBlbGVtZW50VG9TY3JvbGxUbyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZWwuaGFzaCk7XG4gIGhhbmRsZVNjcm9sbFRvU2VjdGlvbihlbGVtZW50VG9TY3JvbGxUbyk7XG59O1xuXG4vKipcbiAqIEhhbmRsZSB0aGUgZW50ZXIgZXZlbnQgZnJvbSBhIGxpbmsgd2l0aGluIHRoZSBpbi1wYWdlIG5hdiBjb21wb25lbnRcbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IEFuIGV2ZW50IHdpdGhpbiB0aGUgaW4tcGFnZSBuYXYgY29tcG9uZW50XG4gKi9cbmNvbnN0IGhhbmRsZUVudGVyRnJvbUxpbmsgPSAoZXZlbnQpID0+IHtcbiAgY29uc3QgaWQgPSBnZXRTZWN0aW9uSWQoZXZlbnQpO1xuICBjb25zdCB0YXJnZXRBbmNob3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gIGNvbnN0IHRhcmdldCA9IHRhcmdldEFuY2hvci5wYXJlbnRFbGVtZW50O1xuXG4gIGlmICh0YXJnZXQpIHtcbiAgICB0YXJnZXQuc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIiwgMCk7XG4gICAgdGFyZ2V0LmZvY3VzKCk7XG4gICAgdGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICBcImJsdXJcIixcbiAgICAgIG9uY2UoKCkgPT4ge1xuICAgICAgICB0YXJnZXQuc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIiwgLTEpO1xuICAgICAgfSlcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIC8vIHRocm93IGFuIGVycm9yP1xuICB9XG4gIGhhbmRsZVNjcm9sbFRvU2VjdGlvbih0YXJnZXQpO1xufTtcblxuY29uc3QgaW5QYWdlTmF2aWdhdGlvbiA9IGJlaGF2aW9yKFxuICB7XG4gICAgW0NMSUNLXToge1xuICAgICAgW2AuJHtJTl9QQUdFX05BVl9MSU5LX0NMQVNTfWBdKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGlmICh0aGlzLmRpc2FibGVkKSByZXR1cm47XG4gICAgICAgIGhhbmRsZUNsaWNrRnJvbUxpbmsodGhpcyk7XG4gICAgICB9LFxuICAgIH0sXG4gICAga2V5ZG93bjoge1xuICAgICAgW2AuJHtJTl9QQUdFX05BVl9MSU5LX0NMQVNTfWBdOiBrZXltYXAoe1xuICAgICAgICBFbnRlcjogaGFuZGxlRW50ZXJGcm9tTGluayxcbiAgICAgIH0pLFxuICAgIH0sXG4gIH0sXG4gIHtcbiAgICBpbml0KHJvb3QpIHtcbiAgICAgIHNlbGVjdE9yTWF0Y2hlcyhgLiR7SU5fUEFHRV9OQVZfQ0xBU1N9YCwgcm9vdCkuZm9yRWFjaCgoaW5QYWdlTmF2RWwpID0+IHtcbiAgICAgICAgY3JlYXRlSW5QYWdlTmF2KGluUGFnZU5hdkVsKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gIH1cbik7XG5cbm1vZHVsZS5leHBvcnRzID0gaW5QYWdlTmF2aWdhdGlvbjtcbiIsImNvbnN0IHNlbGVjdE9yTWF0Y2hlcyA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3Qtb3ItbWF0Y2hlc1wiKTtcbmNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xuY29uc3QgeyBwcmVmaXg6IFBSRUZJWCB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2NvbmZpZ1wiKTtcblxuY29uc3QgTUFTS0VEX0NMQVNTID0gYCR7UFJFRklYfS1tYXNrZWRgO1xuY29uc3QgTUFTS0VEID0gYC4ke01BU0tFRF9DTEFTU31gO1xuY29uc3QgTUFTSyA9IGAke1BSRUZJWH0taW5wdXQtbWFza2A7XG5jb25zdCBNQVNLX0NPTlRFTlQgPSBgJHtNQVNLfS0tY29udGVudGA7XG5jb25zdCBQTEFDRUhPTERFUiA9IFwicGxhY2Vob2xkZXJcIjtcbmNvbnN0IENPTlRFWFQgPSBcImZvcm1cIjtcblxuLy8gVXNlciBkZWZpbmVkIFZhbHVlc1xuY29uc3QgbWFza2VkTnVtYmVyID0gXCJfI2REbU15WTlcIjtcbmNvbnN0IG1hc2tlZExldHRlciA9IFwiQVwiO1xuXG4vLyByZXBsYWNlcyBlYWNoIG1hc2tlZCBpbnB1dCB3aXRoIGEgc2hlbGwgY29udGFpbmluZyB0aGUgaW5wdXQgYW5kIGl0J3MgbWFzay5cbmNvbnN0IGNyZWF0ZU1hc2tlZElucHV0U2hlbGwgPSAoaW5wdXQpID0+IHtcbiAgY29uc3QgcGxhY2Vob2xkZXIgPSBpbnB1dC5nZXRBdHRyaWJ1dGUoYCR7UExBQ0VIT0xERVJ9YCk7XG4gIGlmIChwbGFjZWhvbGRlcikge1xuICAgIGlucHV0LnNldEF0dHJpYnV0ZShcIm1heGxlbmd0aFwiLCBwbGFjZWhvbGRlci5sZW5ndGgpO1xuICAgIGlucHV0LnNldEF0dHJpYnV0ZShcImRhdGEtcGxhY2Vob2xkZXJcIiwgcGxhY2Vob2xkZXIpO1xuICAgIGlucHV0LnJlbW92ZUF0dHJpYnV0ZShgJHtQTEFDRUhPTERFUn1gKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBzaGVsbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICBzaGVsbC5jbGFzc0xpc3QuYWRkKE1BU0spO1xuICBzaGVsbC5zZXRBdHRyaWJ1dGUoXCJkYXRhLW1hc2tcIiwgcGxhY2Vob2xkZXIpO1xuXG4gIGNvbnN0IGNvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgY29udGVudC5jbGFzc0xpc3QuYWRkKE1BU0tfQ09OVEVOVCk7XG4gIGNvbnRlbnQuc2V0QXR0cmlidXRlKFwiYXJpYS1oaWRkZW5cIiwgXCJ0cnVlXCIpO1xuICBjb250ZW50LmlkID0gYCR7aW5wdXQuaWR9TWFza2A7XG4gIGNvbnRlbnQudGV4dENvbnRlbnQgPSBwbGFjZWhvbGRlcjtcblxuICBzaGVsbC5hcHBlbmRDaGlsZChjb250ZW50KTtcbiAgaW5wdXQuY2xvc2VzdChDT05URVhUKS5pbnNlcnRCZWZvcmUoc2hlbGwsIGlucHV0KTtcbiAgc2hlbGwuYXBwZW5kQ2hpbGQoaW5wdXQpO1xufTtcblxuY29uc3Qgc2V0VmFsdWVPZk1hc2sgPSAoZWwpID0+IHtcbiAgY29uc3QgeyB2YWx1ZSB9ID0gZWw7XG4gIGNvbnN0IHBsYWNlaG9sZGVyVmFsID0gYCR7ZWwuZGF0YXNldC5wbGFjZWhvbGRlci5zdWJzdHIodmFsdWUubGVuZ3RoKX1gO1xuXG4gIGNvbnN0IHRoZUlFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpXCIpO1xuICB0aGVJRWwudGV4dENvbnRlbnQgPSB2YWx1ZTtcbiAgcmV0dXJuIFt0aGVJRWwsIHBsYWNlaG9sZGVyVmFsXTtcbn07XG5cbmNvbnN0IHN0cmlwcGVkVmFsdWUgPSAoaXNDaGFyc2V0UHJlc2VudCwgdmFsdWUpID0+XG4gIGlzQ2hhcnNldFByZXNlbnQgPyB2YWx1ZS5yZXBsYWNlKC9cXFcvZywgXCJcIikgOiB2YWx1ZS5yZXBsYWNlKC9cXEQvZywgXCJcIik7XG5cbmNvbnN0IGlzSW50ZWdlciA9ICh2YWx1ZSkgPT4gIU51bWJlci5pc05hTihwYXJzZUludCh2YWx1ZSwgMTApKTtcblxuY29uc3QgaXNMZXR0ZXIgPSAodmFsdWUpID0+ICh2YWx1ZSA/IHZhbHVlLm1hdGNoKC9bQS1aXS9pKSA6IGZhbHNlKTtcblxuY29uc3QgaGFuZGxlQ3VycmVudFZhbHVlID0gKGVsKSA9PiB7XG4gIGNvbnN0IGlzQ2hhcnNldFByZXNlbnQgPSBlbC5kYXRhc2V0LmNoYXJzZXQ7XG4gIGNvbnN0IHBsYWNlaG9sZGVyID0gaXNDaGFyc2V0UHJlc2VudCB8fCBlbC5kYXRhc2V0LnBsYWNlaG9sZGVyO1xuICBjb25zdCB7IHZhbHVlIH0gPSBlbDtcbiAgY29uc3QgbGVuID0gcGxhY2Vob2xkZXIubGVuZ3RoO1xuICBsZXQgbmV3VmFsdWUgPSBcIlwiO1xuICBsZXQgaTtcbiAgbGV0IGNoYXJJbmRleDtcblxuICBjb25zdCBzdHJpcHBlZFZhbCA9IHN0cmlwcGVkVmFsdWUoaXNDaGFyc2V0UHJlc2VudCwgdmFsdWUpO1xuXG4gIGZvciAoaSA9IDAsIGNoYXJJbmRleCA9IDA7IGkgPCBsZW47IGkgKz0gMSkge1xuICAgIGNvbnN0IGlzSW50ID0gaXNJbnRlZ2VyKHN0cmlwcGVkVmFsW2NoYXJJbmRleF0pO1xuICAgIGNvbnN0IGlzTGV0ID0gaXNMZXR0ZXIoc3RyaXBwZWRWYWxbY2hhckluZGV4XSk7XG4gICAgY29uc3QgbWF0Y2hlc051bWJlciA9IG1hc2tlZE51bWJlci5pbmRleE9mKHBsYWNlaG9sZGVyW2ldKSA+PSAwO1xuICAgIGNvbnN0IG1hdGNoZXNMZXR0ZXIgPSBtYXNrZWRMZXR0ZXIuaW5kZXhPZihwbGFjZWhvbGRlcltpXSkgPj0gMDtcblxuICAgIGlmIChcbiAgICAgIChtYXRjaGVzTnVtYmVyICYmIGlzSW50KSB8fFxuICAgICAgKGlzQ2hhcnNldFByZXNlbnQgJiYgbWF0Y2hlc0xldHRlciAmJiBpc0xldClcbiAgICApIHtcbiAgICAgIG5ld1ZhbHVlICs9IHN0cmlwcGVkVmFsW2NoYXJJbmRleF07XG4gICAgICBjaGFySW5kZXggKz0gMTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgKCFpc0NoYXJzZXRQcmVzZW50ICYmICFpc0ludCAmJiBtYXRjaGVzTnVtYmVyKSB8fFxuICAgICAgKGlzQ2hhcnNldFByZXNlbnQgJiZcbiAgICAgICAgKChtYXRjaGVzTGV0dGVyICYmICFpc0xldCkgfHwgKG1hdGNoZXNOdW1iZXIgJiYgIWlzSW50KSkpXG4gICAgKSB7XG4gICAgICByZXR1cm4gbmV3VmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld1ZhbHVlICs9IHBsYWNlaG9sZGVyW2ldO1xuICAgIH1cbiAgICAvLyBicmVhayBpZiBubyBjaGFyYWN0ZXJzIGxlZnQgYW5kIHRoZSBwYXR0ZXJuIGlzIG5vbi1zcGVjaWFsIGNoYXJhY3RlclxuICAgIGlmIChzdHJpcHBlZFZhbFtjaGFySW5kZXhdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuZXdWYWx1ZTtcbn07XG5cbmNvbnN0IGhhbmRsZVZhbHVlQ2hhbmdlID0gKGVsKSA9PiB7XG4gIGNvbnN0IGlucHV0RWwgPSBlbDtcbiAgY29uc3QgaWQgPSBpbnB1dEVsLmdldEF0dHJpYnV0ZShcImlkXCIpO1xuICBpbnB1dEVsLnZhbHVlID0gaGFuZGxlQ3VycmVudFZhbHVlKGlucHV0RWwpO1xuXG4gIGNvbnN0IG1hc2tWYWwgPSBzZXRWYWx1ZU9mTWFzayhlbCk7XG4gIGNvbnN0IG1hc2tFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGAke2lkfU1hc2tgKTtcbiAgbWFza0VsLnRleHRDb250ZW50ID0gXCJcIjtcbiAgbWFza0VsLnJlcGxhY2VDaGlsZHJlbihtYXNrVmFsWzBdLCBtYXNrVmFsWzFdKTtcbn07XG5cbmNvbnN0IGlucHV0TWFza0V2ZW50cyA9IHtcbiAga2V5dXA6IHtcbiAgICBbTUFTS0VEXSgpIHtcbiAgICAgIGhhbmRsZVZhbHVlQ2hhbmdlKHRoaXMpO1xuICAgIH0sXG4gIH0sXG59O1xuXG5jb25zdCBpbnB1dE1hc2sgPSBiZWhhdmlvcihpbnB1dE1hc2tFdmVudHMsIHtcbiAgaW5pdChyb290KSB7XG4gICAgc2VsZWN0T3JNYXRjaGVzKE1BU0tFRCwgcm9vdCkuZm9yRWFjaCgobWFza2VkSW5wdXQpID0+IHtcbiAgICAgIGNyZWF0ZU1hc2tlZElucHV0U2hlbGwobWFza2VkSW5wdXQpO1xuICAgIH0pO1xuICB9LFxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gaW5wdXRNYXNrO1xuIiwiY29uc3QgYmVoYXZpb3IgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvYmVoYXZpb3JcIik7XG5jb25zdCBzZWxlY3QgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2VsZWN0XCIpO1xuY29uc3QgeyBwcmVmaXg6IFBSRUZJWCB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2NvbmZpZ1wiKTtcbmNvbnN0IHsgQ0xJQ0sgfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9ldmVudHNcIik7XG5cbmNvbnN0IENPTlRBSU5FUiA9IGAuJHtQUkVGSVh9LWlucHV0LWdyb3VwYDtcbmNvbnN0IElOUFVUID0gYCR7Q09OVEFJTkVSfSAuJHtQUkVGSVh9LWlucHV0YDtcbmNvbnN0IERFQ09SQVRJT04gPSBgJHtDT05UQUlORVJ9IC4ke1BSRUZJWH0taW5wdXQtcHJlZml4LCAke0NPTlRBSU5FUn0gLiR7UFJFRklYfS1pbnB1dC1zdWZmaXhgO1xuY29uc3QgRk9DVVNfQ0xBU1MgPSBcImlzLWZvY3VzZWRcIjtcblxuZnVuY3Rpb24gc2V0Rm9jdXMoZWwpIHtcbiAgZWwuY2xvc2VzdChDT05UQUlORVIpLnF1ZXJ5U2VsZWN0b3IoYC4ke1BSRUZJWH0taW5wdXRgKS5mb2N1cygpO1xufVxuXG5mdW5jdGlvbiBoYW5kbGVGb2N1cygpIHtcbiAgdGhpcy5jbG9zZXN0KENPTlRBSU5FUikuY2xhc3NMaXN0LmFkZChGT0NVU19DTEFTUyk7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZUJsdXIoKSB7XG4gIHRoaXMuY2xvc2VzdChDT05UQUlORVIpLmNsYXNzTGlzdC5yZW1vdmUoRk9DVVNfQ0xBU1MpO1xufVxuXG5jb25zdCBpbnB1dFByZWZpeFN1ZmZpeCA9IGJlaGF2aW9yKFxuICB7XG4gICAgW0NMSUNLXToge1xuICAgICAgW0RFQ09SQVRJT05dKCkge1xuICAgICAgICBzZXRGb2N1cyh0aGlzKTtcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAge1xuICAgIGluaXQocm9vdCkge1xuICAgICAgc2VsZWN0KElOUFVULCByb290KS5mb3JFYWNoKChpbnB1dEVsKSA9PiB7XG4gICAgICAgIGlucHV0RWwuYWRkRXZlbnRMaXN0ZW5lcihcImZvY3VzXCIsIGhhbmRsZUZvY3VzLCBmYWxzZSk7XG4gICAgICAgIGlucHV0RWwuYWRkRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgaGFuZGxlQmx1ciwgZmFsc2UpO1xuICAgICAgfSk7XG4gICAgfSxcbiAgfVxuKTtcblxubW9kdWxlLmV4cG9ydHMgPSBpbnB1dFByZWZpeFN1ZmZpeDtcbiIsImNvbnN0IGtleW1hcCA9IHJlcXVpcmUoXCJyZWNlcHRvci9rZXltYXBcIik7XG5jb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcbmNvbnN0IHRvZ2dsZSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy90b2dnbGVcIik7XG5jb25zdCBGb2N1c1RyYXAgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvZm9jdXMtdHJhcFwiKTtcbmNvbnN0IGFjY29yZGlvbiA9IHJlcXVpcmUoXCIuLi8uLi91c2EtYWNjb3JkaW9uL3NyYy9pbmRleFwiKTtcblxuY29uc3QgeyBDTElDSyB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2V2ZW50c1wiKTtcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XG5cbmNvbnN0IEJPRFkgPSBcImJvZHlcIjtcbmNvbnN0IExBTkdVQUdFID0gYC4ke1BSRUZJWH0tbGFuZ3VhZ2VgO1xuY29uc3QgTEFOR1VBR0VfU1VCID0gYC4ke1BSRUZJWH0tbGFuZ3VhZ2VfX3N1Ym1lbnVgO1xuY29uc3QgTEFOR1VBR0VfUFJJTUFSWSA9IGAuJHtQUkVGSVh9LWxhbmd1YWdlX19wcmltYXJ5YDtcbmNvbnN0IExBTkdVQUdFX1BSSU1BUllfSVRFTSA9IGAuJHtQUkVGSVh9LWxhbmd1YWdlX19wcmltYXJ5LWl0ZW1gO1xuY29uc3QgTEFOR1VBR0VfQ09OVFJPTCA9IGBidXR0b24uJHtQUkVGSVh9LWxhbmd1YWdlX19saW5rYDtcbmNvbnN0IExBTkdVQUdFX0xJTktTID0gYCR7TEFOR1VBR0V9IGFgO1xuXG5sZXQgbGFuZ3VhZ2VTZWxlY3RvcjtcbmxldCBsYW5ndWFnZUFjdGl2ZTtcblxuY29uc3Qgb25MYW5ndWFnZUNsb3NlID0gKCkgPT5cbiAgbGFuZ3VhZ2VTZWxlY3Rvci50b2dnbGVMYW5ndWFnZS5jYWxsKGxhbmd1YWdlU2VsZWN0b3IsIGZhbHNlKTtcblxuY29uc3QgaGlkZUFjdGl2ZUxhbmd1YWdlRHJvcGRvd24gPSAoKSA9PiB7XG4gIGlmICghbGFuZ3VhZ2VBY3RpdmUpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB0b2dnbGUobGFuZ3VhZ2VBY3RpdmUsIGZhbHNlKTtcbiAgbGFuZ3VhZ2VBY3RpdmUgPSBudWxsO1xufTtcblxuY29uc3QgZm9jdXNMYW5ndWFnZUJ1dHRvbiA9IChldmVudCkgPT4ge1xuICBjb25zdCBwYXJlbnRMYW5ndWFnZUl0ZW0gPSBldmVudC50YXJnZXQuY2xvc2VzdChMQU5HVUFHRV9QUklNQVJZX0lURU0pO1xuXG4gIGlmICghZXZlbnQudGFyZ2V0Lm1hdGNoZXMoTEFOR1VBR0VfQ09OVFJPTCkpIHtcbiAgICBwYXJlbnRMYW5ndWFnZUl0ZW0ucXVlcnlTZWxlY3RvcihMQU5HVUFHRV9DT05UUk9MKS5mb2N1cygpO1xuICB9XG59O1xuXG5jb25zdCBoYW5kbGVFc2NhcGUgPSAoZXZlbnQpID0+IHtcbiAgaGlkZUFjdGl2ZUxhbmd1YWdlRHJvcGRvd24oKTtcbiAgZm9jdXNMYW5ndWFnZUJ1dHRvbihldmVudCk7XG59O1xuXG5sYW5ndWFnZVNlbGVjdG9yID0gYmVoYXZpb3IoXG4gIHtcbiAgICBbQ0xJQ0tdOiB7XG4gICAgICBbTEFOR1VBR0VfQ09OVFJPTF0oKSB7XG4gICAgICAgIGlmIChsYW5ndWFnZUFjdGl2ZSAhPT0gdGhpcykge1xuICAgICAgICAgIGhpZGVBY3RpdmVMYW5ndWFnZURyb3Bkb3duKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxhbmd1YWdlQWN0aXZlID09PSB0aGlzKSB7XG4gICAgICAgICAgaGlkZUFjdGl2ZUxhbmd1YWdlRHJvcGRvd24oKTtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFsYW5ndWFnZUFjdGl2ZSkge1xuICAgICAgICAgIGxhbmd1YWdlQWN0aXZlID0gdGhpcztcbiAgICAgICAgICB0b2dnbGUobGFuZ3VhZ2VBY3RpdmUsIHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSxcbiAgICAgIFtCT0RZXTogaGlkZUFjdGl2ZUxhbmd1YWdlRHJvcGRvd24sXG4gICAgICBbTEFOR1VBR0VfTElOS1NdKCkge1xuICAgICAgICBjb25zdCBhY2MgPSB0aGlzLmNsb3Nlc3QoYWNjb3JkaW9uLkFDQ09SRElPTik7XG5cbiAgICAgICAgaWYgKGFjYykge1xuICAgICAgICAgIGFjY29yZGlvbi5nZXRCdXR0b25zKGFjYykuZm9yRWFjaCgoYnRuKSA9PiBhY2NvcmRpb24uaGlkZShidG4pKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuICAgIGtleWRvd246IHtcbiAgICAgIFtMQU5HVUFHRV9QUklNQVJZXToga2V5bWFwKHsgRXNjYXBlOiBoYW5kbGVFc2NhcGUgfSksXG4gICAgfSxcbiAgICBmb2N1c291dDoge1xuICAgICAgW0xBTkdVQUdFX1BSSU1BUlldKGV2ZW50KSB7XG4gICAgICAgIGNvbnN0IGxhbmd1YWdlID0gZXZlbnQudGFyZ2V0LmNsb3Nlc3QoTEFOR1VBR0VfUFJJTUFSWSk7XG5cbiAgICAgICAgaWYgKCFsYW5ndWFnZS5jb250YWlucyhldmVudC5yZWxhdGVkVGFyZ2V0KSkge1xuICAgICAgICAgIGhpZGVBY3RpdmVMYW5ndWFnZURyb3Bkb3duKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAge1xuICAgIGluaXQocm9vdCkge1xuICAgICAgY29uc3QgdHJhcENvbnRhaW5lciA9IHJvb3QubWF0Y2hlcyhMQU5HVUFHRV9TVUIpXG4gICAgICAgID8gcm9vdFxuICAgICAgICA6IHJvb3QucXVlcnlTZWxlY3RvcihMQU5HVUFHRV9TVUIpO1xuXG4gICAgICBpZiAodHJhcENvbnRhaW5lcikge1xuICAgICAgICBsYW5ndWFnZVNlbGVjdG9yLmZvY3VzVHJhcCA9IEZvY3VzVHJhcCh0cmFwQ29udGFpbmVyLCB7XG4gICAgICAgICAgRXNjYXBlOiBvbkxhbmd1YWdlQ2xvc2UsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0sXG4gICAgdGVhcmRvd24oKSB7XG4gICAgICBsYW5ndWFnZUFjdGl2ZSA9IGZhbHNlO1xuICAgIH0sXG4gICAgZm9jdXNUcmFwOiBudWxsLFxuICB9XG4pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGxhbmd1YWdlU2VsZWN0b3I7XG4iLCJjb25zdCBzZWxlY3RPck1hdGNoZXMgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2VsZWN0LW9yLW1hdGNoZXNcIik7XG5jb25zdCBGb2N1c1RyYXAgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvZm9jdXMtdHJhcFwiKTtcbmNvbnN0IFNjcm9sbEJhcldpZHRoID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3Njcm9sbGJhci13aWR0aFwiKTtcblxuY29uc3QgeyBwcmVmaXg6IFBSRUZJWCB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2NvbmZpZ1wiKTtcblxuY29uc3QgTU9EQUxfQ0xBU1NOQU1FID0gYCR7UFJFRklYfS1tb2RhbGA7XG5jb25zdCBPVkVSTEFZX0NMQVNTTkFNRSA9IGAke01PREFMX0NMQVNTTkFNRX0tb3ZlcmxheWA7XG5jb25zdCBXUkFQUEVSX0NMQVNTTkFNRSA9IGAke01PREFMX0NMQVNTTkFNRX0td3JhcHBlcmA7XG5jb25zdCBPUEVORVJfQVRUUklCVVRFID0gXCJkYXRhLW9wZW4tbW9kYWxcIjtcbmNvbnN0IENMT1NFUl9BVFRSSUJVVEUgPSBcImRhdGEtY2xvc2UtbW9kYWxcIjtcbmNvbnN0IEZPUkNFX0FDVElPTl9BVFRSSUJVVEUgPSBcImRhdGEtZm9yY2UtYWN0aW9uXCI7XG5jb25zdCBOT05fTU9EQUxfSElEREVOX0FUVFJJQlVURSA9IGBkYXRhLW1vZGFsLWhpZGRlbmA7XG5jb25zdCBNT0RBTCA9IGAuJHtNT0RBTF9DTEFTU05BTUV9YDtcbmNvbnN0IElOSVRJQUxfRk9DVVMgPSBgLiR7V1JBUFBFUl9DTEFTU05BTUV9ICpbZGF0YS1mb2N1c11gO1xuY29uc3QgQ0xPU0VfQlVUVE9OID0gYCR7V1JBUFBFUl9DTEFTU05BTUV9ICpbJHtDTE9TRVJfQVRUUklCVVRFfV1gO1xuY29uc3QgT1BFTkVSUyA9IGAqWyR7T1BFTkVSX0FUVFJJQlVURX1dW2FyaWEtY29udHJvbHNdYDtcbmNvbnN0IENMT1NFUlMgPSBgJHtDTE9TRV9CVVRUT059LCAuJHtPVkVSTEFZX0NMQVNTTkFNRX06bm90KFske0ZPUkNFX0FDVElPTl9BVFRSSUJVVEV9XSlgO1xuY29uc3QgTk9OX01PREFMUyA9IGBib2R5ID4gKjpub3QoLiR7V1JBUFBFUl9DTEFTU05BTUV9KTpub3QoW2FyaWEtaGlkZGVuXSlgO1xuY29uc3QgTk9OX01PREFMU19ISURERU4gPSBgWyR7Tk9OX01PREFMX0hJRERFTl9BVFRSSUJVVEV9XWA7XG5cbmNvbnN0IEFDVElWRV9DTEFTUyA9IFwidXNhLWpzLW1vZGFsLS1hY3RpdmVcIjtcbmNvbnN0IFBSRVZFTlRfQ0xJQ0tfQ0xBU1MgPSBcInVzYS1qcy1uby1jbGlja1wiO1xuY29uc3QgVklTSUJMRV9DTEFTUyA9IFwiaXMtdmlzaWJsZVwiO1xuY29uc3QgSElEREVOX0NMQVNTID0gXCJpcy1oaWRkZW5cIjtcblxubGV0IG1vZGFsO1xuXG5jb25zdCBpc0FjdGl2ZSA9ICgpID0+IGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmNvbnRhaW5zKEFDVElWRV9DTEFTUyk7XG5jb25zdCBTQ1JPTExCQVJfV0lEVEggPSBTY3JvbGxCYXJXaWR0aCgpO1xuY29uc3QgSU5JVElBTF9QQURESU5HID0gd2luZG93XG4gIC5nZXRDb21wdXRlZFN0eWxlKGRvY3VtZW50LmJvZHkpXG4gIC5nZXRQcm9wZXJ0eVZhbHVlKFwicGFkZGluZy1yaWdodFwiKTtcbmNvbnN0IFRFTVBPUkFSWV9QQURESU5HID0gYCR7XG4gIHBhcnNlSW50KElOSVRJQUxfUEFERElORy5yZXBsYWNlKC9weC8sIFwiXCIpLCAxMCkgK1xuICBwYXJzZUludChTQ1JPTExCQVJfV0lEVEgucmVwbGFjZSgvcHgvLCBcIlwiKSwgMTApXG59cHhgO1xuXG4vKipcbiAqICBJcyBib3VuZCB0byBlc2NhcGUga2V5LCBjbG9zZXMgbW9kYWwgd2hlblxuICovXG5jb25zdCBvbk1lbnVDbG9zZSA9ICgpID0+IHtcbiAgbW9kYWwudG9nZ2xlTW9kYWwuY2FsbChtb2RhbCwgZmFsc2UpO1xufTtcblxuLyoqXG4gKiAgVG9nZ2xlIHRoZSB2aXNpYmlsaXR5IG9mIGEgbW9kYWwgd2luZG93XG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxuICogQHJldHVybnMge2Jvb2xlYW59IHNhZmVBY3RpdmUgaWYgbW9iaWxlIGlzIG9wZW5cbiAqL1xuZnVuY3Rpb24gdG9nZ2xlTW9kYWwoZXZlbnQpIHtcbiAgbGV0IG9yaWdpbmFsT3BlbmVyO1xuICBsZXQgY2xpY2tlZEVsZW1lbnQgPSBldmVudC50YXJnZXQ7XG4gIGNvbnN0IHsgYm9keSB9ID0gZG9jdW1lbnQ7XG4gIGNvbnN0IHNhZmVBY3RpdmUgPSAhaXNBY3RpdmUoKTtcbiAgY29uc3QgbW9kYWxJZCA9IGNsaWNrZWRFbGVtZW50XG4gICAgPyBjbGlja2VkRWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJhcmlhLWNvbnRyb2xzXCIpXG4gICAgOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnVzYS1tb2RhbC13cmFwcGVyLmlzLXZpc2libGVcIik7XG4gIGNvbnN0IHRhcmdldE1vZGFsID0gc2FmZUFjdGl2ZVxuICAgID8gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobW9kYWxJZClcbiAgICA6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIudXNhLW1vZGFsLXdyYXBwZXIuaXMtdmlzaWJsZVwiKTtcblxuICAvLyBpZiB0aGVyZSBpcyBubyBtb2RhbCB3ZSByZXR1cm4gZWFybHlcbiAgaWYgKCF0YXJnZXRNb2RhbCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0IG9wZW5Gb2N1c0VsID0gdGFyZ2V0TW9kYWwucXVlcnlTZWxlY3RvcihJTklUSUFMX0ZPQ1VTKVxuICAgID8gdGFyZ2V0TW9kYWwucXVlcnlTZWxlY3RvcihJTklUSUFMX0ZPQ1VTKVxuICAgIDogdGFyZ2V0TW9kYWwucXVlcnlTZWxlY3RvcihcIi51c2EtbW9kYWxcIik7XG4gIGNvbnN0IHJldHVybkZvY3VzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXG4gICAgdGFyZ2V0TW9kYWwuZ2V0QXR0cmlidXRlKFwiZGF0YS1vcGVuZXJcIilcbiAgKTtcbiAgY29uc3QgbWVudUJ1dHRvbiA9IGJvZHkucXVlcnlTZWxlY3RvcihPUEVORVJTKTtcbiAgY29uc3QgZm9yY2VVc2VyQWN0aW9uID0gdGFyZ2V0TW9kYWwuZ2V0QXR0cmlidXRlKEZPUkNFX0FDVElPTl9BVFRSSUJVVEUpO1xuXG4gIC8vIFNldHMgdGhlIGNsaWNrZWQgZWxlbWVudCB0byB0aGUgY2xvc2UgYnV0dG9uXG4gIC8vIHNvIGVzYyBrZXkgYWx3YXlzIGNsb3NlcyBtb2RhbFxuICBpZiAoZXZlbnQudHlwZSA9PT0gXCJrZXlkb3duXCIgJiYgdGFyZ2V0TW9kYWwgIT09IG51bGwpIHtcbiAgICBjbGlja2VkRWxlbWVudCA9IHRhcmdldE1vZGFsLnF1ZXJ5U2VsZWN0b3IoQ0xPU0VfQlVUVE9OKTtcbiAgfVxuXG4gIC8vIFdoZW4gd2UncmUgbm90IGhpdHRpbmcgdGhlIGVzY2FwZSBrZXnigKZcbiAgaWYgKGNsaWNrZWRFbGVtZW50KSB7XG4gICAgLy8gTWFrZSBzdXJlIHdlIGNsaWNrIHRoZSBvcGVuZXJcbiAgICAvLyBJZiBpdCBkb2Vzbid0IGhhdmUgYW4gSUQsIG1ha2Ugb25lXG4gICAgLy8gU3RvcmUgaWQgYXMgZGF0YSBhdHRyaWJ1dGUgb24gbW9kYWxcbiAgICBpZiAoY2xpY2tlZEVsZW1lbnQuaGFzQXR0cmlidXRlKE9QRU5FUl9BVFRSSUJVVEUpKSB7XG4gICAgICBpZiAodGhpcy5nZXRBdHRyaWJ1dGUoXCJpZFwiKSA9PT0gbnVsbCkge1xuICAgICAgICBvcmlnaW5hbE9wZW5lciA9IGBtb2RhbC0ke01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDkwMDAwMCkgKyAxMDAwMDB9YDtcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBvcmlnaW5hbE9wZW5lcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvcmlnaW5hbE9wZW5lciA9IHRoaXMuZ2V0QXR0cmlidXRlKFwiaWRcIik7XG4gICAgICB9XG4gICAgICB0YXJnZXRNb2RhbC5zZXRBdHRyaWJ1dGUoXCJkYXRhLW9wZW5lclwiLCBvcmlnaW5hbE9wZW5lcik7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBiYXNpY2FsbHkgc3RvcHMgdGhlIHByb3BhZ2F0aW9uIGlmIHRoZSBlbGVtZW50XG4gICAgLy8gaXMgaW5zaWRlIHRoZSBtb2RhbCBhbmQgbm90IGEgY2xvc2UgYnV0dG9uIG9yXG4gICAgLy8gZWxlbWVudCBpbnNpZGUgYSBjbG9zZSBidXR0b25cbiAgICBpZiAoY2xpY2tlZEVsZW1lbnQuY2xvc2VzdChgLiR7TU9EQUxfQ0xBU1NOQU1FfWApKSB7XG4gICAgICBpZiAoXG4gICAgICAgIGNsaWNrZWRFbGVtZW50Lmhhc0F0dHJpYnV0ZShDTE9TRVJfQVRUUklCVVRFKSB8fFxuICAgICAgICBjbGlja2VkRWxlbWVudC5jbG9zZXN0KGBbJHtDTE9TRVJfQVRUUklCVVRFfV1gKVxuICAgICAgKSB7XG4gICAgICAgIC8vIGRvIG5vdGhpbmcuIG1vdmUgb24uXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGJvZHkuY2xhc3NMaXN0LnRvZ2dsZShBQ1RJVkVfQ0xBU1MsIHNhZmVBY3RpdmUpO1xuICB0YXJnZXRNb2RhbC5jbGFzc0xpc3QudG9nZ2xlKFZJU0lCTEVfQ0xBU1MsIHNhZmVBY3RpdmUpO1xuICB0YXJnZXRNb2RhbC5jbGFzc0xpc3QudG9nZ2xlKEhJRERFTl9DTEFTUywgIXNhZmVBY3RpdmUpO1xuXG4gIC8vIElmIHVzZXIgaXMgZm9yY2VkIHRvIHRha2UgYW4gYWN0aW9uLCBhZGRpbmdcbiAgLy8gYSBjbGFzcyB0byB0aGUgYm9keSB0aGF0IHByZXZlbnRzIGNsaWNraW5nIHVuZGVybmVhdGhcbiAgLy8gb3ZlcmxheVxuICBpZiAoZm9yY2VVc2VyQWN0aW9uKSB7XG4gICAgYm9keS5jbGFzc0xpc3QudG9nZ2xlKFBSRVZFTlRfQ0xJQ0tfQ0xBU1MsIHNhZmVBY3RpdmUpO1xuICB9XG5cbiAgLy8gQWNjb3VudCBmb3IgY29udGVudCBzaGlmdGluZyBmcm9tIGJvZHkgb3ZlcmZsb3c6IGhpZGRlblxuICAvLyBXZSBvbmx5IGNoZWNrIHBhZGRpbmdSaWdodCBpbiBjYXNlIGFwcHMgYXJlIGFkZGluZyBvdGhlciBwcm9wZXJ0aWVzXG4gIC8vIHRvIHRoZSBib2R5IGVsZW1lbnRcbiAgYm9keS5zdHlsZS5wYWRkaW5nUmlnaHQgPVxuICAgIGJvZHkuc3R5bGUucGFkZGluZ1JpZ2h0ID09PSBURU1QT1JBUllfUEFERElOR1xuICAgICAgPyBJTklUSUFMX1BBRERJTkdcbiAgICAgIDogVEVNUE9SQVJZX1BBRERJTkc7XG5cbiAgLy8gSGFuZGxlIHRoZSBmb2N1cyBhY3Rpb25zXG4gIGlmIChzYWZlQWN0aXZlICYmIG9wZW5Gb2N1c0VsKSB7XG4gICAgLy8gVGhlIG1vZGFsIHdpbmRvdyBpcyBvcGVuZWQuIEZvY3VzIGlzIHNldCB0byBjbG9zZSBidXR0b24uXG5cbiAgICAvLyBCaW5kcyBlc2NhcGUga2V5IGlmIHdlJ3JlIG5vdCBmb3JjaW5nXG4gICAgLy8gdGhlIHVzZXIgdG8gdGFrZSBhbiBhY3Rpb25cbiAgICBpZiAoZm9yY2VVc2VyQWN0aW9uKSB7XG4gICAgICBtb2RhbC5mb2N1c1RyYXAgPSBGb2N1c1RyYXAodGFyZ2V0TW9kYWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICBtb2RhbC5mb2N1c1RyYXAgPSBGb2N1c1RyYXAodGFyZ2V0TW9kYWwsIHtcbiAgICAgICAgRXNjYXBlOiBvbk1lbnVDbG9zZSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEhhbmRsZXMgZm9jdXMgc2V0dGluZyBhbmQgaW50ZXJhY3Rpb25zXG4gICAgbW9kYWwuZm9jdXNUcmFwLnVwZGF0ZShzYWZlQWN0aXZlKTtcbiAgICBvcGVuRm9jdXNFbC5mb2N1cygpO1xuXG4gICAgLy8gSGlkZXMgZXZlcnl0aGluZyB0aGF0IGlzIG5vdCB0aGUgbW9kYWwgZnJvbSBzY3JlZW4gcmVhZGVyc1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoTk9OX01PREFMUykuZm9yRWFjaCgobm9uTW9kYWwpID0+IHtcbiAgICAgIG5vbk1vZGFsLnNldEF0dHJpYnV0ZShcImFyaWEtaGlkZGVuXCIsIFwidHJ1ZVwiKTtcbiAgICAgIG5vbk1vZGFsLnNldEF0dHJpYnV0ZShOT05fTU9EQUxfSElEREVOX0FUVFJJQlVURSwgXCJcIik7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAoIXNhZmVBY3RpdmUgJiYgbWVudUJ1dHRvbiAmJiByZXR1cm5Gb2N1cykge1xuICAgIC8vIFRoZSBtb2RhbCB3aW5kb3cgaXMgY2xvc2VkLlxuICAgIC8vIE5vbi1tb2RhbHMgbm93IGFjY2VzaWJsZSB0byBzY3JlZW4gcmVhZGVyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChOT05fTU9EQUxTX0hJRERFTikuZm9yRWFjaCgobm9uTW9kYWwpID0+IHtcbiAgICAgIG5vbk1vZGFsLnJlbW92ZUF0dHJpYnV0ZShcImFyaWEtaGlkZGVuXCIpO1xuICAgICAgbm9uTW9kYWwucmVtb3ZlQXR0cmlidXRlKE5PTl9NT0RBTF9ISURERU5fQVRUUklCVVRFKTtcbiAgICB9KTtcblxuICAgIC8vIEZvY3VzIGlzIHJldHVybmVkIHRvIHRoZSBvcGVuZXJcbiAgICByZXR1cm5Gb2N1cy5mb2N1cygpO1xuICAgIG1vZGFsLmZvY3VzVHJhcC51cGRhdGUoc2FmZUFjdGl2ZSk7XG4gIH1cblxuICByZXR1cm4gc2FmZUFjdGl2ZTtcbn1cblxuLyoqXG4gKiAgQnVpbGRzIG1vZGFsIHdpbmRvdyBmcm9tIGJhc2UgSFRNTFxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGJhc2VDb21wb25lbnQgdGhlIG1vZGFsIGh0bWwgaW4gdGhlIERPTVxuICovXG5jb25zdCBzZXRVcE1vZGFsID0gKGJhc2VDb21wb25lbnQpID0+IHtcbiAgY29uc3QgbW9kYWxDb250ZW50ID0gYmFzZUNvbXBvbmVudDtcbiAgY29uc3QgbW9kYWxXcmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgY29uc3Qgb3ZlcmxheURpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGNvbnN0IG1vZGFsSUQgPSBiYXNlQ29tcG9uZW50LmdldEF0dHJpYnV0ZShcImlkXCIpO1xuICBjb25zdCBhcmlhTGFiZWxsZWRCeSA9IGJhc2VDb21wb25lbnQuZ2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbGxlZGJ5XCIpO1xuICBjb25zdCBhcmlhRGVzY3JpYmVkQnkgPSBiYXNlQ29tcG9uZW50LmdldEF0dHJpYnV0ZShcImFyaWEtZGVzY3JpYmVkYnlcIik7XG4gIGNvbnN0IGZvcmNlVXNlckFjdGlvbiA9IGJhc2VDb21wb25lbnQuaGFzQXR0cmlidXRlKEZPUkNFX0FDVElPTl9BVFRSSUJVVEUpXG4gICAgPyBiYXNlQ29tcG9uZW50Lmhhc0F0dHJpYnV0ZShGT1JDRV9BQ1RJT05fQVRUUklCVVRFKVxuICAgIDogZmFsc2U7XG4gIC8vIENyZWF0ZSBwbGFjZWhvbGRlciB3aGVyZSBtb2RhbCBpcyBmb3IgY2xlYW51cFxuICBjb25zdCBvcmlnaW5hbExvY2F0aW9uUGxhY2VIb2xkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBvcmlnaW5hbExvY2F0aW9uUGxhY2VIb2xkZXIuc2V0QXR0cmlidXRlKGBkYXRhLXBsYWNlaG9sZGVyLWZvcmAsIG1vZGFsSUQpO1xuICBvcmlnaW5hbExvY2F0aW9uUGxhY2VIb2xkZXIuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICBvcmlnaW5hbExvY2F0aW9uUGxhY2VIb2xkZXIuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gIGZvciAobGV0IGF0dHJpYnV0ZUluZGV4ID0gMDsgYXR0cmlidXRlSW5kZXggPCBtb2RhbENvbnRlbnQuYXR0cmlidXRlcy5sZW5ndGg7IGF0dHJpYnV0ZUluZGV4ICs9IDEpIHtcbiAgICBjb25zdCBhdHRyaWJ1dGUgPSBtb2RhbENvbnRlbnQuYXR0cmlidXRlc1thdHRyaWJ1dGVJbmRleF07XG4gICAgb3JpZ2luYWxMb2NhdGlvblBsYWNlSG9sZGVyLnNldEF0dHJpYnV0ZShgZGF0YS1vcmlnaW5hbC0ke2F0dHJpYnV0ZS5uYW1lfWAsIGF0dHJpYnV0ZS52YWx1ZSk7XG4gIH1cblxuICBtb2RhbENvbnRlbnQuYWZ0ZXIob3JpZ2luYWxMb2NhdGlvblBsYWNlSG9sZGVyKTtcblxuICAvLyBSZWJ1aWxkIHRoZSBtb2RhbCBlbGVtZW50XG4gIG1vZGFsQ29udGVudC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShtb2RhbFdyYXBwZXIsIG1vZGFsQ29udGVudCk7XG4gIG1vZGFsV3JhcHBlci5hcHBlbmRDaGlsZChtb2RhbENvbnRlbnQpO1xuICBtb2RhbENvbnRlbnQucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUob3ZlcmxheURpdiwgbW9kYWxDb250ZW50KTtcbiAgb3ZlcmxheURpdi5hcHBlbmRDaGlsZChtb2RhbENvbnRlbnQpO1xuXG4gIC8vIEFkZCBjbGFzc2VzIGFuZCBhdHRyaWJ1dGVzXG4gIG1vZGFsV3JhcHBlci5jbGFzc0xpc3QuYWRkKEhJRERFTl9DTEFTUyk7XG4gIG1vZGFsV3JhcHBlci5jbGFzc0xpc3QuYWRkKFdSQVBQRVJfQ0xBU1NOQU1FKTtcbiAgb3ZlcmxheURpdi5jbGFzc0xpc3QuYWRkKE9WRVJMQVlfQ0xBU1NOQU1FKTtcblxuICAvLyBTZXQgYXR0cmlidXRlc1xuICBtb2RhbFdyYXBwZXIuc2V0QXR0cmlidXRlKFwicm9sZVwiLCBcImRpYWxvZ1wiKTtcbiAgbW9kYWxXcmFwcGVyLnNldEF0dHJpYnV0ZShcImlkXCIsIG1vZGFsSUQpO1xuXG4gIGlmIChhcmlhTGFiZWxsZWRCeSkge1xuICAgIG1vZGFsV3JhcHBlci5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsbGVkYnlcIiwgYXJpYUxhYmVsbGVkQnkpO1xuICB9XG5cbiAgaWYgKGFyaWFEZXNjcmliZWRCeSkge1xuICAgIG1vZGFsV3JhcHBlci5zZXRBdHRyaWJ1dGUoXCJhcmlhLWRlc2NyaWJlZGJ5XCIsIGFyaWFEZXNjcmliZWRCeSk7XG4gIH1cblxuICBpZiAoZm9yY2VVc2VyQWN0aW9uKSB7XG4gICAgbW9kYWxXcmFwcGVyLnNldEF0dHJpYnV0ZShGT1JDRV9BQ1RJT05fQVRUUklCVVRFLCBcInRydWVcIik7XG4gIH1cblxuICAvLyBVcGRhdGUgdGhlIGJhc2UgZWxlbWVudCBIVE1MXG4gIGJhc2VDb21wb25lbnQucmVtb3ZlQXR0cmlidXRlKFwiaWRcIik7XG4gIGJhc2VDb21wb25lbnQucmVtb3ZlQXR0cmlidXRlKFwiYXJpYS1sYWJlbGxlZGJ5XCIpO1xuICBiYXNlQ29tcG9uZW50LnJlbW92ZUF0dHJpYnV0ZShcImFyaWEtZGVzY3JpYmVkYnlcIik7XG4gIGJhc2VDb21wb25lbnQuc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIiwgXCItMVwiKTtcblxuICAvLyBBZGQgYXJpYS1jb250cm9sc1xuICBjb25zdCBtb2RhbENsb3NlcnMgPSBtb2RhbFdyYXBwZXIucXVlcnlTZWxlY3RvckFsbChDTE9TRVJTKTtcbiAgbW9kYWxDbG9zZXJzLmZvckVhY2goKGVsKSA9PiB7XG4gICAgZWwuc2V0QXR0cmlidXRlKFwiYXJpYS1jb250cm9sc1wiLCBtb2RhbElEKTtcbiAgfSk7XG5cbiAgLy8gTW92ZSBhbGwgbW9kYWxzIHRvIHRoZSBlbmQgb2YgdGhlIERPTS4gRG9pbmcgdGhpcyBhbGxvd3MgdXMgdG9cbiAgLy8gbW9yZSBlYXNpbHkgZmluZCB0aGUgZWxlbWVudHMgdG8gaGlkZSBmcm9tIHNjcmVlbiByZWFkZXJzXG4gIC8vIHdoZW4gdGhlIG1vZGFsIGlzIG9wZW4uXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobW9kYWxXcmFwcGVyKTtcbn07XG5cbmNvbnN0IGNsZWFuVXBNb2RhbCA9IChiYXNlQ29tcG9uZW50KSA9PiB7XG4gIGNvbnN0IG1vZGFsQ29udGVudCA9IGJhc2VDb21wb25lbnQ7XG4gIGNvbnN0IG1vZGFsV3JhcHBlciA9IG1vZGFsQ29udGVudC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQ7XG4gIGNvbnN0IG1vZGFsSUQgPSBtb2RhbFdyYXBwZXIuZ2V0QXR0cmlidXRlKFwiaWRcIik7XG5cbiAgY29uc3Qgb3JpZ2luYWxMb2NhdGlvblBsYWNlSG9sZGVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgW2RhdGEtcGxhY2Vob2xkZXItZm9yPVwiJHttb2RhbElEfVwiXWApO1xuICBpZihvcmlnaW5hbExvY2F0aW9uUGxhY2VIb2xkZXIpXG4gIHtcbiAgICBmb3IgKGxldCBhdHRyaWJ1dGVJbmRleCA9IDA7IGF0dHJpYnV0ZUluZGV4IDwgb3JpZ2luYWxMb2NhdGlvblBsYWNlSG9sZGVyLmF0dHJpYnV0ZXMubGVuZ3RoOyBhdHRyaWJ1dGVJbmRleCArPSAxKSB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGUgPSBvcmlnaW5hbExvY2F0aW9uUGxhY2VIb2xkZXIuYXR0cmlidXRlc1thdHRyaWJ1dGVJbmRleF07XG4gICAgICBpZihhdHRyaWJ1dGUubmFtZS5zdGFydHNXaXRoKCdkYXRhLW9yaWdpbmFsLScpKVxuICAgICAge1xuICAgICAgICAvLyBkYXRhLW9yaWdpbmFsLSBpcyAxNCBsb25nXG4gICAgICAgIG1vZGFsQ29udGVudC5zZXRBdHRyaWJ1dGUoYXR0cmlidXRlLm5hbWUuc3Vic3RyKDE0KSwgYXR0cmlidXRlLnZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBvcmlnaW5hbExvY2F0aW9uUGxhY2VIb2xkZXIuYWZ0ZXIobW9kYWxDb250ZW50KTtcbiAgICBvcmlnaW5hbExvY2F0aW9uUGxhY2VIb2xkZXIucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZChvcmlnaW5hbExvY2F0aW9uUGxhY2VIb2xkZXIpO1xuICB9XG5cbiAgbW9kYWxXcmFwcGVyLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQobW9kYWxXcmFwcGVyKTtcbn07XG5cbm1vZGFsID0ge1xuICBpbml0KHJvb3QpIHtcbiAgICBzZWxlY3RPck1hdGNoZXMoTU9EQUwsIHJvb3QpLmZvckVhY2goKG1vZGFsV2luZG93KSA9PiB7XG4gICAgICBjb25zdCBtb2RhbElkID0gbW9kYWxXaW5kb3cuaWQ7XG4gICAgICBzZXRVcE1vZGFsKG1vZGFsV2luZG93KTtcblxuICAgICAgLy8gdGhpcyB3aWxsIHF1ZXJ5IGFsbCBvcGVuZXJzIGFuZCBjbG9zZXJzIGluY2x1ZGluZyB0aGUgb3ZlcmxheVxuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgW2FyaWEtY29udHJvbHM9XCIke21vZGFsSWR9XCJdYCkuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAvLyBUdXJuIGFuY2hvciBsaW5rcyBpbnRvIGJ1dHRvbnMgYmVjYXVzZSBvZlxuICAgICAgICAvLyBWb2ljZU92ZXIgb24gU2FmYXJpXG4gICAgICAgIGlmIChpdGVtLm5vZGVOYW1lID09PSBcIkFcIikge1xuICAgICAgICAgIGl0ZW0uc2V0QXR0cmlidXRlKFwicm9sZVwiLCBcImJ1dHRvblwiKTtcbiAgICAgICAgICBpdGVtLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4gZS5wcmV2ZW50RGVmYXVsdCgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbiB1bmNvbW1lbnQgd2hlbiBhcmlhLWhhc3BvcHVwPVwiZGlhbG9nXCIgaXMgc3VwcG9ydGVkXG4gICAgICAgIC8vIGh0dHBzOi8vYTExeXN1cHBvcnQuaW8vdGVjaC9hcmlhL2FyaWEtaGFzcG9wdXBfYXR0cmlidXRlXG4gICAgICAgIC8vIE1vc3Qgc2NyZWVuIHJlYWRlcnMgc3VwcG9ydCBhcmlhLWhhc3BvcHVwLCBidXQgbWlnaHQgYW5ub3VuY2VcbiAgICAgICAgLy8gYXMgb3BlbmluZyBhIG1lbnUgaWYgXCJkaWFsb2dcIiBpcyBub3Qgc3VwcG9ydGVkLlxuICAgICAgICAvLyBpdGVtLnNldEF0dHJpYnV0ZShcImFyaWEtaGFzcG9wdXBcIiwgXCJkaWFsb2dcIik7XG5cbiAgICAgICAgaXRlbS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdG9nZ2xlTW9kYWwpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0sXG4gIHRlYXJkb3duKHJvb3QpIHtcbiAgICBzZWxlY3RPck1hdGNoZXMoTU9EQUwsIHJvb3QpLmZvckVhY2goKG1vZGFsV2luZG93KSA9PiB7XG4gICAgICBjbGVhblVwTW9kYWwobW9kYWxXaW5kb3cpO1xuICAgICAgY29uc3QgbW9kYWxJZCA9IG1vZGFsV2luZG93LmlkO1xuXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGBbYXJpYS1jb250cm9scz1cIiR7bW9kYWxJZH1cIl1gKVxuICAgICAgICAuZm9yRWFjaCgoaXRlbSkgPT4gaXRlbS5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdG9nZ2xlTW9kYWwpKTtcbiAgICB9KTtcbiAgfSxcbiAgZm9jdXNUcmFwOiBudWxsLFxuICB0b2dnbGVNb2RhbCxcbiAgb24ocm9vdCkge1xuICAgIHRoaXMuaW5pdChyb290KTtcbiAgfSxcbiAgb2ZmKHJvb3QpIHtcbiAgICB0aGlzLnRlYXJkb3duKHJvb3QpO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1vZGFsO1xuIiwiY29uc3QgaWdub3JlID0gcmVxdWlyZShcInJlY2VwdG9yL2lnbm9yZVwiKTtcbmNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xuY29uc3Qgc2VsZWN0ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3NlbGVjdFwiKTtcblxuY29uc3QgeyBDTElDSyB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2V2ZW50c1wiKTtcblxuY29uc3QgQlVUVE9OID0gXCIuanMtc2VhcmNoLWJ1dHRvblwiO1xuY29uc3QgRk9STSA9IFwiLmpzLXNlYXJjaC1mb3JtXCI7XG5jb25zdCBJTlBVVCA9IFwiW3R5cGU9c2VhcmNoXVwiO1xuY29uc3QgQ09OVEVYVCA9IFwiaGVhZGVyXCI7IC8vIFhYWFxuXG5sZXQgbGFzdEJ1dHRvbjtcblxuY29uc3QgZ2V0Rm9ybSA9IChidXR0b24pID0+IHtcbiAgY29uc3QgY29udGV4dCA9IGJ1dHRvbi5jbG9zZXN0KENPTlRFWFQpO1xuICByZXR1cm4gY29udGV4dCA/IGNvbnRleHQucXVlcnlTZWxlY3RvcihGT1JNKSA6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoRk9STSk7XG59O1xuXG5jb25zdCB0b2dnbGVTZWFyY2ggPSAoYnV0dG9uLCBhY3RpdmUpID0+IHtcbiAgY29uc3QgZm9ybSA9IGdldEZvcm0oYnV0dG9uKTtcblxuICBpZiAoIWZvcm0pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYE5vICR7Rk9STX0gZm91bmQgZm9yIHNlYXJjaCB0b2dnbGUgaW4gJHtDT05URVhUfSFgKTtcbiAgfVxuXG4gIC8qIGVzbGludC1kaXNhYmxlIG5vLXBhcmFtLXJlYXNzaWduICovXG4gIGJ1dHRvbi5oaWRkZW4gPSBhY3RpdmU7XG4gIGZvcm0uaGlkZGVuID0gIWFjdGl2ZTtcbiAgLyogZXNsaW50LWVuYWJsZSAqL1xuXG4gIGlmICghYWN0aXZlKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgaW5wdXQgPSBmb3JtLnF1ZXJ5U2VsZWN0b3IoSU5QVVQpO1xuXG4gIGlmIChpbnB1dCkge1xuICAgIGlucHV0LmZvY3VzKCk7XG4gIH1cbiAgLy8gd2hlbiB0aGUgdXNlciBjbGlja3MgX291dHNpZGVfIG9mIHRoZSBmb3JtIHcvaWdub3JlKCk6IGhpZGUgdGhlXG4gIC8vIHNlYXJjaCwgdGhlbiByZW1vdmUgdGhlIGxpc3RlbmVyXG4gIGNvbnN0IGxpc3RlbmVyID0gaWdub3JlKGZvcm0sICgpID0+IHtcbiAgICBpZiAobGFzdEJ1dHRvbikge1xuICAgICAgaGlkZVNlYXJjaC5jYWxsKGxhc3RCdXR0b24pOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVzZS1iZWZvcmUtZGVmaW5lXG4gICAgfVxuXG4gICAgZG9jdW1lbnQuYm9keS5yZW1vdmVFdmVudExpc3RlbmVyKENMSUNLLCBsaXN0ZW5lcik7XG4gIH0pO1xuXG4gIC8vIE5vcm1hbGx5IHdlIHdvdWxkIGp1c3QgcnVuIHRoaXMgY29kZSB3aXRob3V0IGEgdGltZW91dCwgYnV0XG4gIC8vIElFMTEgYW5kIEVkZ2Ugd2lsbCBhY3R1YWxseSBjYWxsIHRoZSBsaXN0ZW5lciAqaW1tZWRpYXRlbHkqIGJlY2F1c2VcbiAgLy8gdGhleSBhcmUgY3VycmVudGx5IGhhbmRsaW5nIHRoaXMgZXhhY3QgdHlwZSBvZiBldmVudCwgc28gd2UnbGxcbiAgLy8gbWFrZSBzdXJlIHRoZSBicm93c2VyIGlzIGRvbmUgaGFuZGxpbmcgdGhlIGN1cnJlbnQgY2xpY2sgZXZlbnQsXG4gIC8vIGlmIGFueSwgYmVmb3JlIHdlIGF0dGFjaCB0aGUgbGlzdGVuZXIuXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcihDTElDSywgbGlzdGVuZXIpO1xuICB9LCAwKTtcbn07XG5cbmZ1bmN0aW9uIHNob3dTZWFyY2goKSB7XG4gIHRvZ2dsZVNlYXJjaCh0aGlzLCB0cnVlKTtcbiAgbGFzdEJ1dHRvbiA9IHRoaXM7XG59XG5cbmZ1bmN0aW9uIGhpZGVTZWFyY2goKSB7XG4gIHRvZ2dsZVNlYXJjaCh0aGlzLCBmYWxzZSk7XG4gIGxhc3RCdXR0b24gPSB1bmRlZmluZWQ7XG59XG5cbmNvbnN0IHNlYXJjaCA9IGJlaGF2aW9yKFxuICB7XG4gICAgW0NMSUNLXToge1xuICAgICAgW0JVVFRPTl06IHNob3dTZWFyY2gsXG4gICAgfSxcbiAgfSxcbiAge1xuICAgIGluaXQodGFyZ2V0KSB7XG4gICAgICBzZWxlY3QoQlVUVE9OLCB0YXJnZXQpLmZvckVhY2goKGJ1dHRvbikgPT4ge1xuICAgICAgICB0b2dnbGVTZWFyY2goYnV0dG9uLCBmYWxzZSk7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHRlYXJkb3duKCkge1xuICAgICAgLy8gZm9yZ2V0IHRoZSBsYXN0IGJ1dHRvbiBjbGlja2VkXG4gICAgICBsYXN0QnV0dG9uID0gdW5kZWZpbmVkO1xuICAgIH0sXG4gIH1cbik7XG5cbm1vZHVsZS5leHBvcnRzID0gc2VhcmNoO1xuIiwiY29uc3Qgb25jZSA9IHJlcXVpcmUoXCJyZWNlcHRvci9vbmNlXCIpO1xuY29uc3QgYmVoYXZpb3IgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvYmVoYXZpb3JcIik7XG5jb25zdCB7IENMSUNLIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvZXZlbnRzXCIpO1xuY29uc3QgeyBwcmVmaXg6IFBSRUZJWCB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2NvbmZpZ1wiKTtcblxuY29uc3QgTElOSyA9IGAuJHtQUkVGSVh9LXNraXBuYXZbaHJlZl49XCIjXCJdLCAuJHtQUkVGSVh9LWZvb3Rlcl9fcmV0dXJuLXRvLXRvcCBbaHJlZl49XCIjXCJdYDtcbmNvbnN0IE1BSU5DT05URU5UID0gXCJtYWluLWNvbnRlbnRcIjtcblxuZnVuY3Rpb24gc2V0VGFiaW5kZXgoKSB7XG4gIC8vIE5COiB3ZSBrbm93IGJlY2F1c2Ugb2YgdGhlIHNlbGVjdG9yIHdlJ3JlIGRlbGVnYXRpbmcgdG8gYmVsb3cgdGhhdCB0aGVcbiAgLy8gaHJlZiBhbHJlYWR5IGJlZ2lucyB3aXRoICcjJ1xuICBjb25zdCBpZCA9IGVuY29kZVVSSSh0aGlzLmdldEF0dHJpYnV0ZShcImhyZWZcIikpO1xuICBjb25zdCB0YXJnZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcbiAgICBpZCA9PT0gXCIjXCIgPyBNQUlOQ09OVEVOVCA6IGlkLnNsaWNlKDEpXG4gICk7XG5cbiAgaWYgKHRhcmdldCkge1xuICAgIHRhcmdldC5zdHlsZS5vdXRsaW5lID0gXCIwXCI7XG4gICAgdGFyZ2V0LnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIDApO1xuICAgIHRhcmdldC5mb2N1cygpO1xuICAgIHRhcmdldC5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgXCJibHVyXCIsXG4gICAgICBvbmNlKCgpID0+IHtcbiAgICAgICAgdGFyZ2V0LnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIC0xKTtcbiAgICAgIH0pXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICAvLyB0aHJvdyBhbiBlcnJvcj9cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJlaGF2aW9yKHtcbiAgW0NMSUNLXToge1xuICAgIFtMSU5LXTogc2V0VGFiaW5kZXgsXG4gIH0sXG59KTtcbiIsImNvbnN0IHNlbGVjdCA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3RcIik7XG5jb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcbmNvbnN0IHsgQ0xJQ0sgfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9ldmVudHNcIik7XG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvY29uZmlnXCIpO1xuY29uc3QgU2FuaXRpemVyID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3Nhbml0aXplclwiKTtcblxuY29uc3QgVEFCTEUgPSBgLiR7UFJFRklYfS10YWJsZWA7XG5jb25zdCBTT1JURUQgPSBcImFyaWEtc29ydFwiO1xuY29uc3QgQVNDRU5ESU5HID0gXCJhc2NlbmRpbmdcIjtcbmNvbnN0IERFU0NFTkRJTkcgPSBcImRlc2NlbmRpbmdcIjtcbmNvbnN0IFNPUlRfT1ZFUlJJREUgPSBcImRhdGEtc29ydC12YWx1ZVwiO1xuY29uc3QgU09SVF9CVVRUT05fQ0xBU1MgPSBgJHtQUkVGSVh9LXRhYmxlX19oZWFkZXJfX2J1dHRvbmA7XG5jb25zdCBTT1JUX0JVVFRPTiA9IGAuJHtTT1JUX0JVVFRPTl9DTEFTU31gO1xuY29uc3QgU09SVEFCTEVfSEVBREVSID0gYHRoW2RhdGEtc29ydGFibGVdYDtcbmNvbnN0IEFOTk9VTkNFTUVOVF9SRUdJT04gPSBgLiR7UFJFRklYfS10YWJsZV9fYW5ub3VuY2VtZW50LXJlZ2lvblthcmlhLWxpdmU9XCJwb2xpdGVcIl1gO1xuXG4vKiogR2V0cyB0aGUgZGF0YS1zb3J0LXZhbHVlIGF0dHJpYnV0ZSB2YWx1ZSwgaWYgcHJvdmlkZWQg4oCUIG90aGVyd2lzZSwgZ2V0c1xuICogdGhlIGlubmVyVGV4dCBvciB0ZXh0Q29udGVudCDigJQgb2YgdGhlIGNoaWxkIGVsZW1lbnQgKEhUTUxUYWJsZUNlbGxFbGVtZW50KVxuICogYXQgdGhlIHNwZWNpZmllZCBpbmRleCBvZiB0aGUgZ2l2ZW4gdGFibGUgcm93XG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IGluZGV4XG4gKiBAcGFyYW0ge2FycmF5PEhUTUxUYWJsZVJvd0VsZW1lbnQ+fSB0clxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuY29uc3QgZ2V0Q2VsbFZhbHVlID0gKHRyLCBpbmRleCkgPT5cbiAgdHIuY2hpbGRyZW5baW5kZXhdLmdldEF0dHJpYnV0ZShTT1JUX09WRVJSSURFKSB8fFxuICB0ci5jaGlsZHJlbltpbmRleF0uaW5uZXJUZXh0IHx8XG4gIHRyLmNoaWxkcmVuW2luZGV4XS50ZXh0Q29udGVudDtcblxuLyoqXG4gKiBDb21wYXJlcyB0aGUgdmFsdWVzIG9mIHR3byByb3cgYXJyYXkgaXRlbXMgYXQgdGhlIGdpdmVuIGluZGV4LCB0aGVuIHNvcnRzIGJ5IHRoZSBnaXZlbiBkaXJlY3Rpb25cbiAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleFxuICogQHBhcmFtIHtzdHJpbmd9IGRpcmVjdGlvblxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuY29uc3QgY29tcGFyZUZ1bmN0aW9uID0gKGluZGV4LCBpc0FzY2VuZGluZykgPT4gKHRoaXNSb3csIG5leHRSb3cpID0+IHtcbiAgLy8gZ2V0IHZhbHVlcyB0byBjb21wYXJlIGZyb20gZGF0YSBhdHRyaWJ1dGUgb3IgY2VsbCBjb250ZW50XG4gIGNvbnN0IHZhbHVlMSA9IGdldENlbGxWYWx1ZShpc0FzY2VuZGluZyA/IHRoaXNSb3cgOiBuZXh0Um93LCBpbmRleCk7XG4gIGNvbnN0IHZhbHVlMiA9IGdldENlbGxWYWx1ZShpc0FzY2VuZGluZyA/IG5leHRSb3cgOiB0aGlzUm93LCBpbmRleCk7XG5cbiAgLy8gaWYgbmVpdGhlciB2YWx1ZSBpcyBlbXB0eSwgYW5kIGlmIGJvdGggdmFsdWVzIGFyZSBhbHJlYWR5IG51bWJlcnMsIGNvbXBhcmUgbnVtZXJpY2FsbHlcbiAgaWYgKFxuICAgIHZhbHVlMSAmJlxuICAgIHZhbHVlMiAmJlxuICAgICFOdW1iZXIuaXNOYU4oTnVtYmVyKHZhbHVlMSkpICYmXG4gICAgIU51bWJlci5pc05hTihOdW1iZXIodmFsdWUyKSlcbiAgKSB7XG4gICAgcmV0dXJuIHZhbHVlMSAtIHZhbHVlMjtcbiAgfVxuICAvLyBPdGhlcndpc2UsIGNvbXBhcmUgYWxwaGFiZXRpY2FsbHkgYmFzZWQgb24gY3VycmVudCB1c2VyIGxvY2FsZVxuICByZXR1cm4gdmFsdWUxLnRvU3RyaW5nKCkubG9jYWxlQ29tcGFyZSh2YWx1ZTIsIG5hdmlnYXRvci5sYW5ndWFnZSwge1xuICAgIG51bWVyaWM6IHRydWUsXG4gICAgaWdub3JlUHVuY3R1YXRpb246IHRydWUsXG4gIH0pO1xufTtcblxuLyoqXG4gKiBHZXQgYW4gQXJyYXkgb2YgY29sdW1uIGhlYWRlcnMgZWxlbWVudHMgYmVsb25naW5nIGRpcmVjdGx5IHRvIHRoZSBnaXZlblxuICogdGFibGUgZWxlbWVudC5cbiAqIEBwYXJhbSB7SFRNTFRhYmxlRWxlbWVudH0gdGFibGVcbiAqIEByZXR1cm4ge2FycmF5PEhUTUxUYWJsZUhlYWRlckNlbGxFbGVtZW50Pn1cbiAqL1xuY29uc3QgZ2V0Q29sdW1uSGVhZGVycyA9ICh0YWJsZSkgPT4ge1xuICBjb25zdCBoZWFkZXJzID0gc2VsZWN0KFNPUlRBQkxFX0hFQURFUiwgdGFibGUpO1xuICByZXR1cm4gaGVhZGVycy5maWx0ZXIoKGhlYWRlcikgPT4gaGVhZGVyLmNsb3Nlc3QoVEFCTEUpID09PSB0YWJsZSk7XG59O1xuXG4vKipcbiAqIFVwZGF0ZSB0aGUgYnV0dG9uIGxhYmVsIHdpdGhpbiB0aGUgZ2l2ZW4gaGVhZGVyIGVsZW1lbnQsIHJlc2V0dGluZyBpdFxuICogdG8gdGhlIGRlZmF1bHQgc3RhdGUgKHJlYWR5IHRvIHNvcnQgYXNjZW5kaW5nKSBpZiBpdCdzIG5vIGxvbmdlciBzb3J0ZWRcbiAqIEBwYXJhbSB7SFRNTFRhYmxlSGVhZGVyQ2VsbEVsZW1lbnR9IGhlYWRlclxuICovXG5jb25zdCB1cGRhdGVTb3J0TGFiZWwgPSAoaGVhZGVyKSA9PiB7XG4gIGNvbnN0IGhlYWRlck5hbWUgPSBoZWFkZXIuaW5uZXJUZXh0O1xuICBjb25zdCBzb3J0ZWRBc2NlbmRpbmcgPSBoZWFkZXIuZ2V0QXR0cmlidXRlKFNPUlRFRCkgPT09IEFTQ0VORElORztcbiAgY29uc3QgaXNTb3J0ZWQgPVxuICAgIGhlYWRlci5nZXRBdHRyaWJ1dGUoU09SVEVEKSA9PT0gQVNDRU5ESU5HIHx8XG4gICAgaGVhZGVyLmdldEF0dHJpYnV0ZShTT1JURUQpID09PSBERVNDRU5ESU5HIHx8XG4gICAgZmFsc2U7XG4gIGNvbnN0IGhlYWRlckxhYmVsID0gYCR7aGVhZGVyTmFtZX0nLCBzb3J0YWJsZSBjb2x1bW4sIGN1cnJlbnRseSAke1xuICAgIGlzU29ydGVkXG4gICAgICA/IGAke3NvcnRlZEFzY2VuZGluZyA/IGBzb3J0ZWQgJHtBU0NFTkRJTkd9YCA6IGBzb3J0ZWQgJHtERVNDRU5ESU5HfWB9YFxuICAgICAgOiBcInVuc29ydGVkXCJcbiAgfWA7XG4gIGNvbnN0IGhlYWRlckJ1dHRvbkxhYmVsID0gYENsaWNrIHRvIHNvcnQgYnkgJHtoZWFkZXJOYW1lfSBpbiAke1xuICAgIHNvcnRlZEFzY2VuZGluZyA/IERFU0NFTkRJTkcgOiBBU0NFTkRJTkdcbiAgfSBvcmRlci5gO1xuICBoZWFkZXIuc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCBoZWFkZXJMYWJlbCk7XG4gIGhlYWRlci5xdWVyeVNlbGVjdG9yKFNPUlRfQlVUVE9OKS5zZXRBdHRyaWJ1dGUoXCJ0aXRsZVwiLCBoZWFkZXJCdXR0b25MYWJlbCk7XG59O1xuXG4vKipcbiAqIFJlbW92ZSB0aGUgYXJpYS1zb3J0IGF0dHJpYnV0ZSBvbiB0aGUgZ2l2ZW4gaGVhZGVyIGVsZW1lbnQsIGFuZCByZXNldCB0aGUgbGFiZWwgYW5kIGJ1dHRvbiBpY29uXG4gKiBAcGFyYW0ge0hUTUxUYWJsZUhlYWRlckNlbGxFbGVtZW50fSBoZWFkZXJcbiAqL1xuY29uc3QgdW5zZXRTb3J0ID0gKGhlYWRlcikgPT4ge1xuICBoZWFkZXIucmVtb3ZlQXR0cmlidXRlKFNPUlRFRCk7XG4gIHVwZGF0ZVNvcnRMYWJlbChoZWFkZXIpO1xufTtcblxuLyoqXG4gKiBTb3J0IHJvd3MgZWl0aGVyIGFzY2VuZGluZyBvciBkZXNjZW5kaW5nLCBiYXNlZCBvbiBhIGdpdmVuIGhlYWRlcidzIGFyaWEtc29ydCBhdHRyaWJ1dGVcbiAqIEBwYXJhbSB7SFRNTFRhYmxlSGVhZGVyQ2VsbEVsZW1lbnR9IGhlYWRlclxuICogQHBhcmFtIHtib29sZWFufSBpc0FzY2VuZGluZ1xuICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZVxuICovXG5jb25zdCBzb3J0Um93cyA9IChoZWFkZXIsIGlzQXNjZW5kaW5nKSA9PiB7XG4gIGhlYWRlci5zZXRBdHRyaWJ1dGUoU09SVEVELCBpc0FzY2VuZGluZyA9PT0gdHJ1ZSA/IERFU0NFTkRJTkcgOiBBU0NFTkRJTkcpO1xuICB1cGRhdGVTb3J0TGFiZWwoaGVhZGVyKTtcblxuICBjb25zdCB0Ym9keSA9IGhlYWRlci5jbG9zZXN0KFRBQkxFKS5xdWVyeVNlbGVjdG9yKFwidGJvZHlcIik7XG5cbiAgLy8gV2UgY2FuIHVzZSBBcnJheS5mcm9tKCkgYW5kIEFycmF5LnNvcnQoKSBpbnN0ZWFkIG9uY2Ugd2UgZHJvcCBJRTExIHN1cHBvcnQsIGxpa2VseSBpbiB0aGUgc3VtbWVyIG9mIDIwMjFcbiAgLy9cbiAgLy8gQXJyYXkuZnJvbSh0Ym9keS5xdWVyeVNlbGVjdG9yQWxsKCd0cicpLnNvcnQoXG4gIC8vICAgY29tcGFyZUZ1bmN0aW9uKFxuICAvLyAgICAgQXJyYXkuZnJvbShoZWFkZXIucGFyZW50Tm9kZS5jaGlsZHJlbikuaW5kZXhPZihoZWFkZXIpLFxuICAvLyAgICAgIWlzQXNjZW5kaW5nKVxuICAvLyAgIClcbiAgLy8gLmZvckVhY2godHIgPT4gdGJvZHkuYXBwZW5kQ2hpbGQodHIpICk7XG5cbiAgLy8gW10uc2xpY2UuY2FsbCgpIHR1cm5zIGFycmF5LWxpa2Ugc2V0cyBpbnRvIHRydWUgYXJyYXlzIHNvIHRoYXQgd2UgY2FuIHNvcnQgdGhlbVxuICBjb25zdCBhbGxSb3dzID0gW10uc2xpY2UuY2FsbCh0Ym9keS5xdWVyeVNlbGVjdG9yQWxsKFwidHJcIikpO1xuICBjb25zdCBhbGxIZWFkZXJzID0gW10uc2xpY2UuY2FsbChoZWFkZXIucGFyZW50Tm9kZS5jaGlsZHJlbik7XG4gIGNvbnN0IHRoaXNIZWFkZXJJbmRleCA9IGFsbEhlYWRlcnMuaW5kZXhPZihoZWFkZXIpO1xuICBhbGxSb3dzLnNvcnQoY29tcGFyZUZ1bmN0aW9uKHRoaXNIZWFkZXJJbmRleCwgIWlzQXNjZW5kaW5nKSkuZm9yRWFjaCgodHIpID0+IHtcbiAgICBbXS5zbGljZVxuICAgICAgLmNhbGwodHIuY2hpbGRyZW4pXG4gICAgICAuZm9yRWFjaCgodGQpID0+IHRkLnJlbW92ZUF0dHJpYnV0ZShcImRhdGEtc29ydC1hY3RpdmVcIikpO1xuICAgIHRyLmNoaWxkcmVuW3RoaXNIZWFkZXJJbmRleF0uc2V0QXR0cmlidXRlKFwiZGF0YS1zb3J0LWFjdGl2ZVwiLCB0cnVlKTtcbiAgICB0Ym9keS5hcHBlbmRDaGlsZCh0cik7XG4gIH0pO1xuXG4gIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBVcGRhdGUgdGhlIGxpdmUgcmVnaW9uIGltbWVkaWF0ZWx5IGZvbGxvd2luZyB0aGUgdGFibGUgd2hlbmV2ZXIgc29ydCBjaGFuZ2VzLlxuICogQHBhcmFtIHtIVE1MVGFibGVFbGVtZW50fSB0YWJsZVxuICogQHBhcmFtIHtIVE1MVGFibGVIZWFkZXJDZWxsRWxlbWVudH0gc29ydGVkSGVhZGVyXG4gKi9cblxuY29uc3QgdXBkYXRlTGl2ZVJlZ2lvbiA9ICh0YWJsZSwgc29ydGVkSGVhZGVyKSA9PiB7XG4gIGNvbnN0IGNhcHRpb24gPSB0YWJsZS5xdWVyeVNlbGVjdG9yKFwiY2FwdGlvblwiKS5pbm5lclRleHQ7XG4gIGNvbnN0IHNvcnRlZEFzY2VuZGluZyA9IHNvcnRlZEhlYWRlci5nZXRBdHRyaWJ1dGUoU09SVEVEKSA9PT0gQVNDRU5ESU5HO1xuICBjb25zdCBoZWFkZXJMYWJlbCA9IHNvcnRlZEhlYWRlci5pbm5lclRleHQ7XG4gIGNvbnN0IGxpdmVSZWdpb24gPSB0YWJsZS5uZXh0RWxlbWVudFNpYmxpbmc7XG4gIGlmIChsaXZlUmVnaW9uICYmIGxpdmVSZWdpb24ubWF0Y2hlcyhBTk5PVU5DRU1FTlRfUkVHSU9OKSkge1xuICAgIGNvbnN0IHNvcnRBbm5vdW5jZW1lbnQgPSBgVGhlIHRhYmxlIG5hbWVkIFwiJHtjYXB0aW9ufVwiIGlzIG5vdyBzb3J0ZWQgYnkgJHtoZWFkZXJMYWJlbH0gaW4gJHtcbiAgICAgIHNvcnRlZEFzY2VuZGluZyA/IEFTQ0VORElORyA6IERFU0NFTkRJTkdcbiAgICB9IG9yZGVyLmA7XG4gICAgbGl2ZVJlZ2lvbi5pbm5lclRleHQgPSBzb3J0QW5ub3VuY2VtZW50O1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBUYWJsZSBjb250YWluaW5nIGEgc29ydGFibGUgY29sdW1uIGhlYWRlciBpcyBub3QgZm9sbG93ZWQgYnkgYW4gYXJpYS1saXZlIHJlZ2lvbi5gXG4gICAgKTtcbiAgfVxufTtcblxuLyoqXG4gKiBUb2dnbGUgYSBoZWFkZXIncyBzb3J0IHN0YXRlLCBvcHRpb25hbGx5IHByb3ZpZGluZyBhIHRhcmdldFxuICogc3RhdGUuXG4gKlxuICogQHBhcmFtIHtIVE1MVGFibGVIZWFkZXJDZWxsRWxlbWVudH0gaGVhZGVyXG4gKiBAcGFyYW0ge2Jvb2xlYW4/fSBpc0FzY2VuZGluZyBJZiBubyBzdGF0ZSBpcyBwcm92aWRlZCwgdGhlIGN1cnJlbnRcbiAqIHN0YXRlIHdpbGwgYmUgdG9nZ2xlZCAoZnJvbSBmYWxzZSB0byB0cnVlLCBhbmQgdmljZS12ZXJzYSkuXG4gKi9cbmNvbnN0IHRvZ2dsZVNvcnQgPSAoaGVhZGVyLCBpc0FzY2VuZGluZykgPT4ge1xuICBjb25zdCB0YWJsZSA9IGhlYWRlci5jbG9zZXN0KFRBQkxFKTtcbiAgbGV0IHNhZmVBc2NlbmRpbmcgPSBpc0FzY2VuZGluZztcbiAgaWYgKHR5cGVvZiBzYWZlQXNjZW5kaW5nICE9PSBcImJvb2xlYW5cIikge1xuICAgIHNhZmVBc2NlbmRpbmcgPSBoZWFkZXIuZ2V0QXR0cmlidXRlKFNPUlRFRCkgPT09IEFTQ0VORElORztcbiAgfVxuXG4gIGlmICghdGFibGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7U09SVEFCTEVfSEVBREVSfSBpcyBtaXNzaW5nIG91dGVyICR7VEFCTEV9YCk7XG4gIH1cblxuICBzYWZlQXNjZW5kaW5nID0gc29ydFJvd3MoaGVhZGVyLCBpc0FzY2VuZGluZyk7XG5cbiAgaWYgKHNhZmVBc2NlbmRpbmcpIHtcbiAgICBnZXRDb2x1bW5IZWFkZXJzKHRhYmxlKS5mb3JFYWNoKChvdGhlckhlYWRlcikgPT4ge1xuICAgICAgaWYgKG90aGVySGVhZGVyICE9PSBoZWFkZXIpIHtcbiAgICAgICAgdW5zZXRTb3J0KG90aGVySGVhZGVyKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB1cGRhdGVMaXZlUmVnaW9uKHRhYmxlLCBoZWFkZXIpO1xuICB9XG59O1xuXG4vKipcbiAqKiBJbnNlcnRzIGEgYnV0dG9uIHdpdGggaWNvbiBpbnNpZGUgYSBzb3J0YWJsZSBoZWFkZXJcbiAqIEBwYXJhbSB7SFRNTFRhYmxlSGVhZGVyQ2VsbEVsZW1lbnR9IGhlYWRlclxuICovXG5cbmNvbnN0IGNyZWF0ZUhlYWRlckJ1dHRvbiA9IChoZWFkZXIpID0+IHtcbiAgY29uc3QgYnV0dG9uRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICBidXR0b25FbC5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCBcIjBcIik7XG4gIGJ1dHRvbkVsLmNsYXNzTGlzdC5hZGQoU09SVF9CVVRUT05fQ0xBU1MpO1xuICAvLyBJQ09OX1NPVVJDRVxuICBidXR0b25FbC5pbm5lckhUTUwgPSBTYW5pdGl6ZXIuZXNjYXBlSFRNTGBcbiAgPHN2ZyBjbGFzcz1cIiR7UFJFRklYfS1pY29uXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj5cbiAgICA8ZyBjbGFzcz1cImRlc2NlbmRpbmdcIiBmaWxsPVwidHJhbnNwYXJlbnRcIj5cbiAgICAgIDxwYXRoIGQ9XCJNMTcgMTdMMTUuNTkgMTUuNTlMMTIuOTk5OSAxOC4xN1YySDEwLjk5OTlWMTguMTdMOC40MSAxNS41OEw3IDE3TDExLjk5OTkgMjJMMTcgMTdaXCIgLz5cbiAgICA8L2c+XG4gICAgPGcgY2xhc3M9XCJhc2NlbmRpbmdcIiBmaWxsPVwidHJhbnNwYXJlbnRcIj5cbiAgICAgIDxwYXRoIHRyYW5zZm9ybT1cInJvdGF0ZSgxODAsIDEyLCAxMilcIiBkPVwiTTE3IDE3TDE1LjU5IDE1LjU5TDEyLjk5OTkgMTguMTdWMkgxMC45OTk5VjE4LjE3TDguNDEgMTUuNThMNyAxN0wxMS45OTk5IDIyTDE3IDE3WlwiIC8+XG4gICAgPC9nPlxuICAgIDxnIGNsYXNzPVwidW5zb3J0ZWRcIiBmaWxsPVwidHJhbnNwYXJlbnRcIj5cbiAgICAgIDxwb2x5Z29uIHBvaW50cz1cIjE1LjE3IDE1IDEzIDE3LjE3IDEzIDYuODMgMTUuMTcgOSAxNi41OCA3LjU5IDEyIDMgNy40MSA3LjU5IDguODMgOSAxMSA2LjgzIDExIDE3LjE3IDguODMgMTUgNy40MiAxNi40MSAxMiAyMSAxNi41OSAxNi40MSAxNS4xNyAxNVwiLz5cbiAgICA8L2c+XG4gIDwvc3ZnPlxuICBgO1xuICBoZWFkZXIuYXBwZW5kQ2hpbGQoYnV0dG9uRWwpO1xuICB1cGRhdGVTb3J0TGFiZWwoaGVhZGVyKTtcbn07XG5cbmNvbnN0IHRhYmxlID0gYmVoYXZpb3IoXG4gIHtcbiAgICBbQ0xJQ0tdOiB7XG4gICAgICBbU09SVF9CVVRUT05dKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRvZ2dsZVNvcnQoXG4gICAgICAgICAgZXZlbnQudGFyZ2V0LmNsb3Nlc3QoU09SVEFCTEVfSEVBREVSKSxcbiAgICAgICAgICBldmVudC50YXJnZXQuY2xvc2VzdChTT1JUQUJMRV9IRUFERVIpLmdldEF0dHJpYnV0ZShTT1JURUQpID09PVxuICAgICAgICAgICAgQVNDRU5ESU5HXG4gICAgICAgICk7XG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIHtcbiAgICBpbml0KHJvb3QpIHtcbiAgICAgIGNvbnN0IHNvcnRhYmxlSGVhZGVycyA9IHNlbGVjdChTT1JUQUJMRV9IRUFERVIsIHJvb3QpO1xuICAgICAgc29ydGFibGVIZWFkZXJzLmZvckVhY2goKGhlYWRlcikgPT4gY3JlYXRlSGVhZGVyQnV0dG9uKGhlYWRlcikpO1xuXG4gICAgICBjb25zdCBmaXJzdFNvcnRlZCA9IHNvcnRhYmxlSGVhZGVycy5maWx0ZXIoXG4gICAgICAgIChoZWFkZXIpID0+XG4gICAgICAgICAgaGVhZGVyLmdldEF0dHJpYnV0ZShTT1JURUQpID09PSBBU0NFTkRJTkcgfHxcbiAgICAgICAgICBoZWFkZXIuZ2V0QXR0cmlidXRlKFNPUlRFRCkgPT09IERFU0NFTkRJTkdcbiAgICAgIClbMF07XG4gICAgICBpZiAodHlwZW9mIGZpcnN0U29ydGVkID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8vIG5vIHNvcnRhYmxlIGhlYWRlcnMgZm91bmRcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3Qgc29ydERpciA9IGZpcnN0U29ydGVkLmdldEF0dHJpYnV0ZShTT1JURUQpO1xuICAgICAgaWYgKHNvcnREaXIgPT09IEFTQ0VORElORykge1xuICAgICAgICB0b2dnbGVTb3J0KGZpcnN0U29ydGVkLCB0cnVlKTtcbiAgICAgIH0gZWxzZSBpZiAoc29ydERpciA9PT0gREVTQ0VORElORykge1xuICAgICAgICB0b2dnbGVTb3J0KGZpcnN0U29ydGVkLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBUQUJMRSxcbiAgICBTT1JUQUJMRV9IRUFERVIsXG4gICAgU09SVF9CVVRUT04sXG4gIH1cbik7XG5cbm1vZHVsZS5leHBvcnRzID0gdGFibGU7XG4iLCJjb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcbmNvbnN0IHNlbGVjdE9yTWF0Y2hlcyA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3Qtb3ItbWF0Y2hlc1wiKTtcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XG5jb25zdCB7XG4gIENPTUJPX0JPWF9DTEFTUyxcbiAgZW5oYW5jZUNvbWJvQm94LFxufSA9IHJlcXVpcmUoXCIuLi8uLi91c2EtY29tYm8tYm94L3NyYy9pbmRleFwiKTtcblxuY29uc3QgVElNRV9QSUNLRVJfQ0xBU1MgPSBgJHtQUkVGSVh9LXRpbWUtcGlja2VyYDtcbmNvbnN0IFRJTUVfUElDS0VSID0gYC4ke1RJTUVfUElDS0VSX0NMQVNTfWA7XG5jb25zdCBNQVhfVElNRSA9IDYwICogMjQgLSAxO1xuY29uc3QgTUlOX1RJTUUgPSAwO1xuY29uc3QgREVGQVVMVF9TVEVQID0gMzA7XG5jb25zdCBNSU5fU1RFUCA9IDE7XG5cbmNvbnN0IEZJTFRFUl9EQVRBU0VUID0ge1xuICBmaWx0ZXI6XG4gICAgXCIwP3t7IGhvdXJRdWVyeUZpbHRlciB9fTp7e21pbnV0ZVF1ZXJ5RmlsdGVyfX0uKnt7IGFwUXVlcnlGaWx0ZXIgfX1tP1wiLFxuICBhcFF1ZXJ5RmlsdGVyOiBcIihbYXBdKVwiLFxuICBob3VyUXVlcnlGaWx0ZXI6IFwiKFsxLTldWzAtMl0/KVwiLFxuICBtaW51dGVRdWVyeUZpbHRlcjogXCJbXFxcXGRdKzooWzAtOV17MCwyfSlcIixcbn07XG5cbi8qKlxuICogUGFyc2UgYSBzdHJpbmcgb2YgaGg6bW0gaW50byBtaW51dGVzXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHRpbWVTdHIgdGhlIHRpbWUgc3RyaW5nIHRvIHBhcnNlXG4gKiBAcmV0dXJucyB7bnVtYmVyfSB0aGUgbnVtYmVyIG9mIG1pbnV0ZXNcbiAqL1xuY29uc3QgcGFyc2VUaW1lU3RyaW5nID0gKHRpbWVTdHIpID0+IHtcbiAgbGV0IG1pbnV0ZXM7XG5cbiAgaWYgKHRpbWVTdHIpIHtcbiAgICBjb25zdCBbaG91cnMsIG1pbnNdID0gdGltZVN0ci5zcGxpdChcIjpcIikubWFwKChzdHIpID0+IHtcbiAgICAgIGxldCB2YWx1ZTtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlSW50KHN0ciwgMTApO1xuICAgICAgaWYgKCFOdW1iZXIuaXNOYU4ocGFyc2VkKSkgdmFsdWUgPSBwYXJzZWQ7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSk7XG5cbiAgICBpZiAoaG91cnMgIT0gbnVsbCAmJiBtaW5zICE9IG51bGwpIHtcbiAgICAgIG1pbnV0ZXMgPSBob3VycyAqIDYwICsgbWlucztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbWludXRlcztcbn07XG5cbi8qKlxuICogRW5oYW5jZSBhbiBpbnB1dCB3aXRoIHRoZSBkYXRlIHBpY2tlciBlbGVtZW50c1xuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIFRoZSBpbml0aWFsIHdyYXBwaW5nIGVsZW1lbnQgb2YgdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICovXG5jb25zdCB0cmFuc2Zvcm1UaW1lUGlja2VyID0gKGVsKSA9PiB7XG4gIGNvbnN0IHRpbWVQaWNrZXJFbCA9IGVsLmNsb3Nlc3QoVElNRV9QSUNLRVIpO1xuXG4gIGNvbnN0IGluaXRpYWxJbnB1dEVsID0gdGltZVBpY2tlckVsLnF1ZXJ5U2VsZWN0b3IoYGlucHV0YCk7XG5cbiAgaWYgKCFpbml0aWFsSW5wdXRFbCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHtUSU1FX1BJQ0tFUn0gaXMgbWlzc2luZyBpbm5lciBpbnB1dGApO1xuICB9XG5cbiAgY29uc3Qgc2VsZWN0RWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2VsZWN0XCIpO1xuXG4gIFtcImlkXCIsIFwibmFtZVwiLCBcInJlcXVpcmVkXCIsIFwiYXJpYS1sYWJlbFwiLCBcImFyaWEtbGFiZWxsZWRieVwiXS5mb3JFYWNoKFxuICAgIChuYW1lKSA9PiB7XG4gICAgICBpZiAoaW5pdGlhbElucHV0RWwuaGFzQXR0cmlidXRlKG5hbWUpKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gaW5pdGlhbElucHV0RWwuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICAgICAgICBzZWxlY3RFbC5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xuICAgICAgICBpbml0aWFsSW5wdXRFbC5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gICAgICB9XG4gICAgfVxuICApO1xuXG4gIGNvbnN0IHBhZFplcm9zID0gKHZhbHVlLCBsZW5ndGgpID0+IGAwMDAwJHt2YWx1ZX1gLnNsaWNlKC1sZW5ndGgpO1xuXG4gIGNvbnN0IGdldFRpbWVDb250ZXh0ID0gKG1pbnV0ZXMpID0+IHtcbiAgICBjb25zdCBtaW51dGUgPSBtaW51dGVzICUgNjA7XG4gICAgY29uc3QgaG91cjI0ID0gTWF0aC5mbG9vcihtaW51dGVzIC8gNjApO1xuICAgIGNvbnN0IGhvdXIxMiA9IGhvdXIyNCAlIDEyIHx8IDEyO1xuICAgIGNvbnN0IGFtcG0gPSBob3VyMjQgPCAxMiA/IFwiYW1cIiA6IFwicG1cIjtcblxuICAgIHJldHVybiB7XG4gICAgICBtaW51dGUsXG4gICAgICBob3VyMjQsXG4gICAgICBob3VyMTIsXG4gICAgICBhbXBtLFxuICAgIH07XG4gIH07XG5cbiAgY29uc3QgbWluVGltZSA9IE1hdGgubWF4KFxuICAgIE1JTl9USU1FLFxuICAgIHBhcnNlVGltZVN0cmluZyh0aW1lUGlja2VyRWwuZGF0YXNldC5taW5UaW1lKSB8fCBNSU5fVElNRVxuICApO1xuICBjb25zdCBtYXhUaW1lID0gTWF0aC5taW4oXG4gICAgTUFYX1RJTUUsXG4gICAgcGFyc2VUaW1lU3RyaW5nKHRpbWVQaWNrZXJFbC5kYXRhc2V0Lm1heFRpbWUpIHx8IE1BWF9USU1FXG4gICk7XG4gIGNvbnN0IHN0ZXAgPSBNYXRoLmZsb29yKFxuICAgIE1hdGgubWF4KE1JTl9TVEVQLCB0aW1lUGlja2VyRWwuZGF0YXNldC5zdGVwIHx8IERFRkFVTFRfU1RFUClcbiAgKTtcblxuICBsZXQgZGVmYXVsdFZhbHVlO1xuICBmb3IgKGxldCB0aW1lID0gbWluVGltZTsgdGltZSA8PSBtYXhUaW1lOyB0aW1lICs9IHN0ZXApIHtcbiAgICBjb25zdCB7IG1pbnV0ZSwgaG91cjI0LCBob3VyMTIsIGFtcG0gfSA9IGdldFRpbWVDb250ZXh0KHRpbWUpO1xuXG4gICAgY29uc3Qgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIm9wdGlvblwiKTtcbiAgICBvcHRpb24udmFsdWUgPSBgJHtwYWRaZXJvcyhob3VyMjQsIDIpfToke3BhZFplcm9zKG1pbnV0ZSwgMil9YDtcbiAgICBvcHRpb24udGV4dCA9IGAke2hvdXIxMn06JHtwYWRaZXJvcyhtaW51dGUsIDIpfSR7YW1wbX1gO1xuICAgIGlmIChvcHRpb24udGV4dCA9PT0gaW5pdGlhbElucHV0RWwudmFsdWUpIHtcbiAgICAgIGRlZmF1bHRWYWx1ZSA9IG9wdGlvbi52YWx1ZTtcbiAgICB9XG4gICAgc2VsZWN0RWwuYXBwZW5kQ2hpbGQob3B0aW9uKTtcbiAgfVxuXG4gIHRpbWVQaWNrZXJFbC5jbGFzc0xpc3QuYWRkKENPTUJPX0JPWF9DTEFTUyk7XG5cbiAgLy8gY29tYm8gYm94IHByb3BlcnRpZXNcbiAgT2JqZWN0LmtleXMoRklMVEVSX0RBVEFTRVQpLmZvckVhY2goKGtleSkgPT4ge1xuICAgIHRpbWVQaWNrZXJFbC5kYXRhc2V0W2tleV0gPSBGSUxURVJfREFUQVNFVFtrZXldO1xuICB9KTtcbiAgdGltZVBpY2tlckVsLmRhdGFzZXQuZGlzYWJsZUZpbHRlcmluZyA9IFwidHJ1ZVwiO1xuICB0aW1lUGlja2VyRWwuZGF0YXNldC5kZWZhdWx0VmFsdWUgPSBkZWZhdWx0VmFsdWU7XG5cbiAgdGltZVBpY2tlckVsLmFwcGVuZENoaWxkKHNlbGVjdEVsKTtcbiAgaW5pdGlhbElucHV0RWwucmVtb3ZlKCk7XG59O1xuXG5jb25zdCB0aW1lUGlja2VyID0gYmVoYXZpb3IoXG4gIHt9LFxuICB7XG4gICAgaW5pdChyb290KSB7XG4gICAgICBzZWxlY3RPck1hdGNoZXMoVElNRV9QSUNLRVIsIHJvb3QpLmZvckVhY2goKHRpbWVQaWNrZXJFbCkgPT4ge1xuICAgICAgICB0cmFuc2Zvcm1UaW1lUGlja2VyKHRpbWVQaWNrZXJFbCk7XG4gICAgICAgIGVuaGFuY2VDb21ib0JveCh0aW1lUGlja2VyRWwpO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBGSUxURVJfREFUQVNFVCxcbiAgfVxuKTtcblxubW9kdWxlLmV4cG9ydHMgPSB0aW1lUGlja2VyO1xuIiwiLy8gVG9vbHRpcHNcbmNvbnN0IHNlbGVjdE9yTWF0Y2hlcyA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3Qtb3ItbWF0Y2hlc1wiKTtcbmNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xuY29uc3QgeyBwcmVmaXg6IFBSRUZJWCB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2NvbmZpZ1wiKTtcbmNvbnN0IGlzRWxlbWVudEluVmlld3BvcnQgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvaXMtaW4tdmlld3BvcnRcIik7XG5cbmNvbnN0IFRPT0xUSVAgPSBgLiR7UFJFRklYfS10b29sdGlwYDtcbmNvbnN0IFRPT0xUSVBfVFJJR0dFUiA9IGAuJHtQUkVGSVh9LXRvb2x0aXBfX3RyaWdnZXJgO1xuY29uc3QgVE9PTFRJUF9UUklHR0VSX0NMQVNTID0gYCR7UFJFRklYfS10b29sdGlwX190cmlnZ2VyYDtcbmNvbnN0IFRPT0xUSVBfQ0xBU1MgPSBgJHtQUkVGSVh9LXRvb2x0aXBgO1xuY29uc3QgVE9PTFRJUF9CT0RZX0NMQVNTID0gYCR7UFJFRklYfS10b29sdGlwX19ib2R5YDtcbmNvbnN0IFNFVF9DTEFTUyA9IFwiaXMtc2V0XCI7XG5jb25zdCBWSVNJQkxFX0NMQVNTID0gXCJpcy12aXNpYmxlXCI7XG5jb25zdCBUUklBTkdMRV9TSVpFID0gNTtcbmNvbnN0IEFESlVTVF9XSURUSF9DTEFTUyA9IGAke1BSRUZJWH0tdG9vbHRpcF9fYm9keS0td3JhcGA7XG5cbi8qKlxuICpcbiAqIEBwYXJhbSB7RE9NRWxlbWVudH0gdHJpZ2dlciAtIFRoZSB0b29sdGlwIHRyaWdnZXJcbiAqIEByZXR1cm5zIHtvYmplY3R9IEVsZW1lbnRzIGZvciBpbml0aWFsaXplZCB0b29sdGlwOyBpbmNsdWRlcyB0cmlnZ2VyLCB3cmFwcGVyLCBhbmQgYm9keVxuICovXG5jb25zdCBnZXRUb29sdGlwRWxlbWVudHMgPSAodHJpZ2dlcikgPT4ge1xuICBjb25zdCB3cmFwcGVyID0gdHJpZ2dlci5wYXJlbnROb2RlO1xuICBjb25zdCBib2R5ID0gd3JhcHBlci5xdWVyeVNlbGVjdG9yKGAuJHtUT09MVElQX0JPRFlfQ0xBU1N9YCk7XG5cbiAgcmV0dXJuIHsgdHJpZ2dlciwgd3JhcHBlciwgYm9keSB9O1xufTtcblxuLyoqXG4gKiBTaG93cyB0aGUgdG9vbHRpcFxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdG9vbHRpcFRyaWdnZXIgLSB0aGUgZWxlbWVudCB0aGF0IGluaXRpYWxpemVzIHRoZSB0b29sdGlwXG4gKi9cbmNvbnN0IHNob3dUb29sVGlwID0gKHRvb2x0aXBCb2R5LCB0b29sdGlwVHJpZ2dlciwgcG9zaXRpb24pID0+IHtcbiAgdG9vbHRpcEJvZHkuc2V0QXR0cmlidXRlKFwiYXJpYS1oaWRkZW5cIiwgXCJmYWxzZVwiKTtcblxuICAvLyBUaGlzIHNldHMgdXAgdGhlIHRvb2x0aXAgYm9keS4gVGhlIG9wYWNpdHkgaXMgMCwgYnV0XG4gIC8vIHdlIGNhbiBiZWdpbiBydW5uaW5nIHRoZSBjYWxjdWxhdGlvbnMgYmVsb3cuXG4gIHRvb2x0aXBCb2R5LmNsYXNzTGlzdC5hZGQoU0VUX0NMQVNTKTtcblxuICAvKipcbiAgICogUG9zaXRpb24gdGhlIHRvb2x0aXAgYm9keSB3aGVuIHRoZSB0cmlnZ2VyIGlzIGhvdmVyZWRcbiAgICogUmVtb3ZlcyBvbGQgcG9zaXRpb25pbmcgY2xhc3NuYW1lcyBhbmQgcmVhcHBsaWVzLiBUaGlzIGFsbG93c1xuICAgKiBwb3NpdGlvbmluZyB0byBjaGFuZ2UgaW4gY2FzZSB0aGUgdXNlciByZXNpemVzIGJyb3dzZXIgb3IgRE9NIG1hbmlwdWxhdGlvblxuICAgKiBjYXVzZXMgdG9vbHRpcCB0byBnZXQgY2xpcHBlZCBmcm9tIHZpZXdwb3J0XG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzZXRQb3MgLSBjYW4gYmUgXCJ0b3BcIiwgXCJib3R0b21cIiwgXCJyaWdodFwiLCBcImxlZnRcIlxuICAgKi9cbiAgY29uc3Qgc2V0UG9zaXRpb25DbGFzcyA9IChzZXRQb3MpID0+IHtcbiAgICB0b29sdGlwQm9keS5jbGFzc0xpc3QucmVtb3ZlKGAke1RPT0xUSVBfQk9EWV9DTEFTU30tLXRvcGApO1xuICAgIHRvb2x0aXBCb2R5LmNsYXNzTGlzdC5yZW1vdmUoYCR7VE9PTFRJUF9CT0RZX0NMQVNTfS0tYm90dG9tYCk7XG4gICAgdG9vbHRpcEJvZHkuY2xhc3NMaXN0LnJlbW92ZShgJHtUT09MVElQX0JPRFlfQ0xBU1N9LS1yaWdodGApO1xuICAgIHRvb2x0aXBCb2R5LmNsYXNzTGlzdC5yZW1vdmUoYCR7VE9PTFRJUF9CT0RZX0NMQVNTfS0tbGVmdGApO1xuICAgIHRvb2x0aXBCb2R5LmNsYXNzTGlzdC5hZGQoYCR7VE9PTFRJUF9CT0RZX0NMQVNTfS0tJHtzZXRQb3N9YCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgb2xkIHBvc2l0aW9uaW5nIHN0eWxlcy4gVGhpcyBhbGxvd3NcbiAgICogcmUtcG9zaXRpb25pbmcgdG8gY2hhbmdlIHdpdGhvdXQgaW5oZXJpdGluZyBvdGhlclxuICAgKiBkeW5hbWljIHN0eWxlc1xuICAgKlxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlIC0gdGhpcyBpcyB0aGUgdG9vbHRpcCBib2R5XG4gICAqL1xuICBjb25zdCByZXNldFBvc2l0aW9uU3R5bGVzID0gKGUpID0+IHtcbiAgICAvLyB3ZSBkb24ndCBvdmVycmlkZSBhbnl0aGluZyBpbiB0aGUgc3R5bGVzaGVldCB3aGVuIGZpbmRpbmcgYWx0IHBvc2l0aW9uc1xuICAgIGUuc3R5bGUudG9wID0gbnVsbDtcbiAgICBlLnN0eWxlLmJvdHRvbSA9IG51bGw7XG4gICAgZS5zdHlsZS5yaWdodCA9IG51bGw7XG4gICAgZS5zdHlsZS5sZWZ0ID0gbnVsbDtcbiAgICBlLnN0eWxlLm1hcmdpbiA9IG51bGw7XG4gIH07XG5cbiAgLyoqXG4gICAqIGdldCBtYXJnaW4gb2Zmc2V0IGNhbGN1bGF0aW9uc1xuICAgKlxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSB0YXJnZXQgLSB0aGlzIGlzIHRoZSB0b29sdGlwIGJvZHlcbiAgICogQHBhcmFtIHtTdHJpbmd9IHByb3BlcnR5VmFsdWUgLSB0aGlzIGlzIHRoZSB0b29sdGlwIGJvZHlcbiAgICovXG5cbiAgY29uc3Qgb2Zmc2V0TWFyZ2luID0gKHRhcmdldCwgcHJvcGVydHlWYWx1ZSkgPT5cbiAgICBwYXJzZUludChcbiAgICAgIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHRhcmdldCkuZ2V0UHJvcGVydHlWYWx1ZShwcm9wZXJ0eVZhbHVlKSxcbiAgICAgIDEwXG4gICAgKTtcblxuICAvLyBvZmZzZXRMZWZ0ID0gdGhlIGxlZnQgcG9zaXRpb24sIGFuZCBtYXJnaW4gb2YgdGhlIGVsZW1lbnQsIHRoZSBsZWZ0XG4gIC8vIHBhZGRpbmcsIHNjcm9sbGJhciBhbmQgYm9yZGVyIG9mIHRoZSBvZmZzZXRQYXJlbnQgZWxlbWVudFxuICAvLyBvZmZzZXRXaWR0aCA9IFRoZSBvZmZzZXRXaWR0aCBwcm9wZXJ0eSByZXR1cm5zIHRoZSB2aWV3YWJsZSB3aWR0aCBvZiBhblxuICAvLyBlbGVtZW50IGluIHBpeGVscywgaW5jbHVkaW5nIHBhZGRpbmcsIGJvcmRlciBhbmQgc2Nyb2xsYmFyLCBidXQgbm90XG4gIC8vIHRoZSBtYXJnaW4uXG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZSBtYXJnaW4gb2Zmc2V0XG4gICAqIHRvb2x0aXAgdHJpZ2dlciBtYXJnaW4ocG9zaXRpb24pIG9mZnNldCArIHRvb2x0aXBCb2R5IG9mZnNldFdpZHRoXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtYXJnaW5Qb3NpdGlvblxuICAgKiBAcGFyYW0ge051bWJlcn0gdG9vbHRpcEJvZHlPZmZzZXRcbiAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdHJpZ2dlclxuICAgKi9cbiAgY29uc3QgY2FsY3VsYXRlTWFyZ2luT2Zmc2V0ID0gKFxuICAgIG1hcmdpblBvc2l0aW9uLFxuICAgIHRvb2x0aXBCb2R5T2Zmc2V0LFxuICAgIHRyaWdnZXJcbiAgKSA9PiB7XG4gICAgY29uc3Qgb2Zmc2V0ID1cbiAgICAgIG9mZnNldE1hcmdpbih0cmlnZ2VyLCBgbWFyZ2luLSR7bWFyZ2luUG9zaXRpb259YCkgPiAwXG4gICAgICAgID8gdG9vbHRpcEJvZHlPZmZzZXQgLSBvZmZzZXRNYXJnaW4odHJpZ2dlciwgYG1hcmdpbi0ke21hcmdpblBvc2l0aW9ufWApXG4gICAgICAgIDogdG9vbHRpcEJvZHlPZmZzZXQ7XG5cbiAgICByZXR1cm4gb2Zmc2V0O1xuICB9O1xuXG4gIC8qKlxuICAgKiBQb3NpdGlvbnMgdG9vbHRpcCBhdCB0aGUgdG9wXG4gICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGUgLSB0aGlzIGlzIHRoZSB0b29sdGlwIGJvZHlcbiAgICovXG4gIGNvbnN0IHBvc2l0aW9uVG9wID0gKGUpID0+IHtcbiAgICByZXNldFBvc2l0aW9uU3R5bGVzKGUpOyAvLyBlbnN1cmVzIHdlIHN0YXJ0IGZyb20gdGhlIHNhbWUgcG9pbnRcbiAgICAvLyBnZXQgZGV0YWlscyBvbiB0aGUgZWxlbWVudHMgb2JqZWN0IHdpdGhcblxuICAgIGNvbnN0IHRvcE1hcmdpbiA9IGNhbGN1bGF0ZU1hcmdpbk9mZnNldChcbiAgICAgIFwidG9wXCIsXG4gICAgICBlLm9mZnNldEhlaWdodCxcbiAgICAgIHRvb2x0aXBUcmlnZ2VyXG4gICAgKTtcblxuICAgIGNvbnN0IGxlZnRNYXJnaW4gPSBjYWxjdWxhdGVNYXJnaW5PZmZzZXQoXG4gICAgICBcImxlZnRcIixcbiAgICAgIGUub2Zmc2V0V2lkdGgsXG4gICAgICB0b29sdGlwVHJpZ2dlclxuICAgICk7XG5cbiAgICBzZXRQb3NpdGlvbkNsYXNzKFwidG9wXCIpO1xuICAgIGUuc3R5bGUubGVmdCA9IGA1MCVgOyAvLyBjZW50ZXIgdGhlIGVsZW1lbnRcbiAgICBlLnN0eWxlLnRvcCA9IGAtJHtUUklBTkdMRV9TSVpFfXB4YDsgLy8gY29uc2lkZXIgdGhlIHBzZXVkbyBlbGVtZW50XG4gICAgLy8gYXBwbHkgb3VyIG1hcmdpbnMgYmFzZWQgb24gdGhlIG9mZnNldFxuICAgIGUuc3R5bGUubWFyZ2luID0gYC0ke3RvcE1hcmdpbn1weCAwIDAgLSR7bGVmdE1hcmdpbiAvIDJ9cHhgO1xuICB9O1xuXG4gIC8qKlxuICAgKiBQb3NpdGlvbnMgdG9vbHRpcCBhdCB0aGUgYm90dG9tXG4gICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGUgLSB0aGlzIGlzIHRoZSB0b29sdGlwIGJvZHlcbiAgICovXG4gIGNvbnN0IHBvc2l0aW9uQm90dG9tID0gKGUpID0+IHtcbiAgICByZXNldFBvc2l0aW9uU3R5bGVzKGUpO1xuXG4gICAgY29uc3QgbGVmdE1hcmdpbiA9IGNhbGN1bGF0ZU1hcmdpbk9mZnNldChcbiAgICAgIFwibGVmdFwiLFxuICAgICAgZS5vZmZzZXRXaWR0aCxcbiAgICAgIHRvb2x0aXBUcmlnZ2VyXG4gICAgKTtcblxuICAgIHNldFBvc2l0aW9uQ2xhc3MoXCJib3R0b21cIik7XG4gICAgZS5zdHlsZS5sZWZ0ID0gYDUwJWA7XG4gICAgZS5zdHlsZS5tYXJnaW4gPSBgJHtUUklBTkdMRV9TSVpFfXB4IDAgMCAtJHtsZWZ0TWFyZ2luIC8gMn1weGA7XG4gIH07XG5cbiAgLyoqXG4gICAqIFBvc2l0aW9ucyB0b29sdGlwIGF0IHRoZSByaWdodFxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlIC0gdGhpcyBpcyB0aGUgdG9vbHRpcCBib2R5XG4gICAqL1xuICBjb25zdCBwb3NpdGlvblJpZ2h0ID0gKGUpID0+IHtcbiAgICByZXNldFBvc2l0aW9uU3R5bGVzKGUpO1xuXG4gICAgY29uc3QgdG9wTWFyZ2luID0gY2FsY3VsYXRlTWFyZ2luT2Zmc2V0KFxuICAgICAgXCJ0b3BcIixcbiAgICAgIGUub2Zmc2V0SGVpZ2h0LFxuICAgICAgdG9vbHRpcFRyaWdnZXJcbiAgICApO1xuXG4gICAgc2V0UG9zaXRpb25DbGFzcyhcInJpZ2h0XCIpO1xuICAgIGUuc3R5bGUudG9wID0gYDUwJWA7XG4gICAgZS5zdHlsZS5sZWZ0ID0gYCR7XG4gICAgICB0b29sdGlwVHJpZ2dlci5vZmZzZXRMZWZ0ICsgdG9vbHRpcFRyaWdnZXIub2Zmc2V0V2lkdGggKyBUUklBTkdMRV9TSVpFXG4gICAgfXB4YDtcbiAgICBlLnN0eWxlLm1hcmdpbiA9IGAtJHt0b3BNYXJnaW4gLyAyfXB4IDAgMCAwYDtcbiAgfTtcblxuICAvKipcbiAgICogUG9zaXRpb25zIHRvb2x0aXAgYXQgdGhlIHJpZ2h0XG4gICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGUgLSB0aGlzIGlzIHRoZSB0b29sdGlwIGJvZHlcbiAgICovXG4gIGNvbnN0IHBvc2l0aW9uTGVmdCA9IChlKSA9PiB7XG4gICAgcmVzZXRQb3NpdGlvblN0eWxlcyhlKTtcblxuICAgIGNvbnN0IHRvcE1hcmdpbiA9IGNhbGN1bGF0ZU1hcmdpbk9mZnNldChcbiAgICAgIFwidG9wXCIsXG4gICAgICBlLm9mZnNldEhlaWdodCxcbiAgICAgIHRvb2x0aXBUcmlnZ2VyXG4gICAgKTtcblxuICAgIC8vIHdlIGhhdmUgdG8gY2hlY2sgZm9yIHNvbWUgdXRpbGl0eSBtYXJnaW5zXG4gICAgY29uc3QgbGVmdE1hcmdpbiA9IGNhbGN1bGF0ZU1hcmdpbk9mZnNldChcbiAgICAgIFwibGVmdFwiLFxuICAgICAgdG9vbHRpcFRyaWdnZXIub2Zmc2V0TGVmdCA+IGUub2Zmc2V0V2lkdGhcbiAgICAgICAgPyB0b29sdGlwVHJpZ2dlci5vZmZzZXRMZWZ0IC0gZS5vZmZzZXRXaWR0aFxuICAgICAgICA6IGUub2Zmc2V0V2lkdGgsXG4gICAgICB0b29sdGlwVHJpZ2dlclxuICAgICk7XG5cbiAgICBzZXRQb3NpdGlvbkNsYXNzKFwibGVmdFwiKTtcbiAgICBlLnN0eWxlLnRvcCA9IGA1MCVgO1xuICAgIGUuc3R5bGUubGVmdCA9IGAtJHtUUklBTkdMRV9TSVpFfXB4YDtcbiAgICBlLnN0eWxlLm1hcmdpbiA9IGAtJHt0b3BNYXJnaW4gLyAyfXB4IDAgMCAke1xuICAgICAgdG9vbHRpcFRyaWdnZXIub2Zmc2V0TGVmdCA+IGUub2Zmc2V0V2lkdGggPyBsZWZ0TWFyZ2luIDogLWxlZnRNYXJnaW5cbiAgICB9cHhgOyAvLyBhZGp1c3QgdGhlIG1hcmdpblxuICB9O1xuXG4gIC8qKlxuICAgKiBXZSB0cnkgdG8gc2V0IHRoZSBwb3NpdGlvbiBiYXNlZCBvbiB0aGVcbiAgICogb3JpZ2luYWwgaW50ZW50aW9uLCBidXQgbWFrZSBhZGp1c3RtZW50c1xuICAgKiBpZiB0aGUgZWxlbWVudCBpcyBjbGlwcGVkIG91dCBvZiB0aGUgdmlld3BvcnRcbiAgICogd2UgY29uc3RyYWluIHRoZSB3aWR0aCBvbmx5IGFzIGEgbGFzdCByZXNvcnRcbiAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudChhbGlhcyB0b29sdGlwQm9keSlcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGF0dGVtcHQgKC0tZmxhZylcbiAgICovXG5cbiAgY29uc3QgbWF4QXR0ZW1wdHMgPSAyO1xuXG4gIGZ1bmN0aW9uIGZpbmRCZXN0UG9zaXRpb24oZWxlbWVudCwgYXR0ZW1wdCA9IDEpIHtcbiAgICAvLyBjcmVhdGUgYXJyYXkgb2Ygb3B0aW9uYWwgcG9zaXRpb25zXG4gICAgY29uc3QgcG9zaXRpb25zID0gW1xuICAgICAgcG9zaXRpb25Ub3AsXG4gICAgICBwb3NpdGlvbkJvdHRvbSxcbiAgICAgIHBvc2l0aW9uUmlnaHQsXG4gICAgICBwb3NpdGlvbkxlZnQsXG4gICAgXTtcblxuICAgIGxldCBoYXNWaXNpYmxlUG9zaXRpb24gPSBmYWxzZTtcblxuICAgIC8vIHdlIHRha2UgYSByZWN1cnNpdmUgYXBwcm9hY2hcbiAgICBmdW5jdGlvbiB0cnlQb3NpdGlvbnMoaSkge1xuICAgICAgaWYgKGkgPCBwb3NpdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IHBvcyA9IHBvc2l0aW9uc1tpXTtcbiAgICAgICAgcG9zKGVsZW1lbnQpO1xuXG4gICAgICAgIGlmICghaXNFbGVtZW50SW5WaWV3cG9ydChlbGVtZW50KSkge1xuICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICAgIHRyeVBvc2l0aW9ucygoaSArPSAxKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaGFzVmlzaWJsZVBvc2l0aW9uID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHRyeVBvc2l0aW9ucygwKTtcbiAgICAvLyBpZiB3ZSBjYW4ndCBmaW5kIGEgcG9zaXRpb24gd2UgY29tcHJlc3MgaXQgYW5kIHRyeSBhZ2FpblxuICAgIGlmICghaGFzVmlzaWJsZVBvc2l0aW9uKSB7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoQURKVVNUX1dJRFRIX0NMQVNTKTtcbiAgICAgIGlmIChhdHRlbXB0IDw9IG1heEF0dGVtcHRzKSB7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICBmaW5kQmVzdFBvc2l0aW9uKGVsZW1lbnQsIChhdHRlbXB0ICs9IDEpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzd2l0Y2ggKHBvc2l0aW9uKSB7XG4gICAgY2FzZSBcInRvcFwiOlxuICAgICAgcG9zaXRpb25Ub3AodG9vbHRpcEJvZHkpO1xuICAgICAgaWYgKCFpc0VsZW1lbnRJblZpZXdwb3J0KHRvb2x0aXBCb2R5KSkge1xuICAgICAgICBmaW5kQmVzdFBvc2l0aW9uKHRvb2x0aXBCb2R5KTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJib3R0b21cIjpcbiAgICAgIHBvc2l0aW9uQm90dG9tKHRvb2x0aXBCb2R5KTtcbiAgICAgIGlmICghaXNFbGVtZW50SW5WaWV3cG9ydCh0b29sdGlwQm9keSkpIHtcbiAgICAgICAgZmluZEJlc3RQb3NpdGlvbih0b29sdGlwQm9keSk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIFwicmlnaHRcIjpcbiAgICAgIHBvc2l0aW9uUmlnaHQodG9vbHRpcEJvZHkpO1xuICAgICAgaWYgKCFpc0VsZW1lbnRJblZpZXdwb3J0KHRvb2x0aXBCb2R5KSkge1xuICAgICAgICBmaW5kQmVzdFBvc2l0aW9uKHRvb2x0aXBCb2R5KTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJsZWZ0XCI6XG4gICAgICBwb3NpdGlvbkxlZnQodG9vbHRpcEJvZHkpO1xuICAgICAgaWYgKCFpc0VsZW1lbnRJblZpZXdwb3J0KHRvb2x0aXBCb2R5KSkge1xuICAgICAgICBmaW5kQmVzdFBvc2l0aW9uKHRvb2x0aXBCb2R5KTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuXG4gICAgZGVmYXVsdDpcbiAgICAgIC8vIHNraXAgZGVmYXVsdCBjYXNlXG4gICAgICBicmVhaztcbiAgfVxuXG4gIC8qKlxuICAgKiBBY3R1YWxseSBzaG93IHRoZSB0b29sdGlwLiBUaGUgVklTSUJMRV9DTEFTU1xuICAgKiB3aWxsIGNoYW5nZSB0aGUgb3BhY2l0eSB0byAxXG4gICAqL1xuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICB0b29sdGlwQm9keS5jbGFzc0xpc3QuYWRkKFZJU0lCTEVfQ0xBU1MpO1xuICB9LCAyMCk7XG59O1xuXG4vKipcbiAqIFJlbW92ZXMgYWxsIHRoZSBwcm9wZXJ0aWVzIHRvIHNob3cgYW5kIHBvc2l0aW9uIHRoZSB0b29sdGlwLFxuICogYW5kIHJlc2V0cyB0aGUgdG9vbHRpcCBwb3NpdGlvbiB0byB0aGUgb3JpZ2luYWwgaW50ZW50aW9uXG4gKiBpbiBjYXNlIHRoZSB3aW5kb3cgaXMgcmVzaXplZCBvciB0aGUgZWxlbWVudCBpcyBtb3ZlZCB0aHJvdWdoXG4gKiBET00gbWFuaXB1bGF0aW9uLlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdG9vbHRpcEJvZHkgLSBUaGUgYm9keSBvZiB0aGUgdG9vbHRpcFxuICovXG5jb25zdCBoaWRlVG9vbFRpcCA9ICh0b29sdGlwQm9keSkgPT4ge1xuICB0b29sdGlwQm9keS5jbGFzc0xpc3QucmVtb3ZlKFZJU0lCTEVfQ0xBU1MpO1xuICB0b29sdGlwQm9keS5jbGFzc0xpc3QucmVtb3ZlKFNFVF9DTEFTUyk7XG4gIHRvb2x0aXBCb2R5LmNsYXNzTGlzdC5yZW1vdmUoQURKVVNUX1dJRFRIX0NMQVNTKTtcbiAgdG9vbHRpcEJvZHkuc2V0QXR0cmlidXRlKFwiYXJpYS1oaWRkZW5cIiwgXCJ0cnVlXCIpO1xufTtcblxuLyoqXG4gKiBTZXR1cCB0aGUgdG9vbHRpcCBjb21wb25lbnRcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHRvb2x0aXBUcmlnZ2VyIFRoZSBlbGVtZW50IHRoYXQgY3JlYXRlcyB0aGUgdG9vbHRpcFxuICovXG5jb25zdCBzZXRVcEF0dHJpYnV0ZXMgPSAodG9vbHRpcFRyaWdnZXIpID0+IHtcbiAgY29uc3QgdG9vbHRpcElEID0gYHRvb2x0aXAtJHtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA5MDAwMDApICsgMTAwMDAwfWA7XG4gIGNvbnN0IHRvb2x0aXBDb250ZW50ID0gdG9vbHRpcFRyaWdnZXIuZ2V0QXR0cmlidXRlKFwidGl0bGVcIik7XG4gIGNvbnN0IHdyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgY29uc3QgdG9vbHRpcEJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgY29uc3QgcG9zaXRpb24gPSB0b29sdGlwVHJpZ2dlci5nZXRBdHRyaWJ1dGUoXCJkYXRhLXBvc2l0aW9uXCIpXG4gICAgPyB0b29sdGlwVHJpZ2dlci5nZXRBdHRyaWJ1dGUoXCJkYXRhLXBvc2l0aW9uXCIpXG4gICAgOiBcInRvcFwiO1xuICBjb25zdCBhZGRpdGlvbmFsQ2xhc3NlcyA9IHRvb2x0aXBUcmlnZ2VyLmdldEF0dHJpYnV0ZShcImRhdGEtY2xhc3Nlc1wiKTtcblxuICAvLyBTZXQgdXAgdG9vbHRpcCBhdHRyaWJ1dGVzXG4gIHRvb2x0aXBUcmlnZ2VyLnNldEF0dHJpYnV0ZShcImFyaWEtZGVzY3JpYmVkYnlcIiwgdG9vbHRpcElEKTtcbiAgdG9vbHRpcFRyaWdnZXIuc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIiwgXCIwXCIpO1xuICB0b29sdGlwVHJpZ2dlci5yZW1vdmVBdHRyaWJ1dGUoXCJ0aXRsZVwiKTtcbiAgdG9vbHRpcFRyaWdnZXIuY2xhc3NMaXN0LnJlbW92ZShUT09MVElQX0NMQVNTKTtcbiAgdG9vbHRpcFRyaWdnZXIuY2xhc3NMaXN0LmFkZChUT09MVElQX1RSSUdHRVJfQ0xBU1MpO1xuXG4gIC8vIGluc2VydCB3cmFwcGVyIGJlZm9yZSBlbCBpbiB0aGUgRE9NIHRyZWVcbiAgdG9vbHRpcFRyaWdnZXIucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUod3JhcHBlciwgdG9vbHRpcFRyaWdnZXIpO1xuXG4gIC8vIHNldCB1cCB0aGUgd3JhcHBlclxuICB3cmFwcGVyLmFwcGVuZENoaWxkKHRvb2x0aXBUcmlnZ2VyKTtcbiAgd3JhcHBlci5jbGFzc0xpc3QuYWRkKFRPT0xUSVBfQ0xBU1MpO1xuICB3cmFwcGVyLmFwcGVuZENoaWxkKHRvb2x0aXBCb2R5KTtcblxuICAvLyBBcHBseSBhZGRpdGlvbmFsIGNsYXNzIG5hbWVzIHRvIHdyYXBwZXIgZWxlbWVudFxuICBpZiAoYWRkaXRpb25hbENsYXNzZXMpIHtcbiAgICBjb25zdCBjbGFzc2VzQXJyYXkgPSBhZGRpdGlvbmFsQ2xhc3Nlcy5zcGxpdChcIiBcIik7XG4gICAgY2xhc3Nlc0FycmF5LmZvckVhY2goKGNsYXNzbmFtZSkgPT4gd3JhcHBlci5jbGFzc0xpc3QuYWRkKGNsYXNzbmFtZSkpO1xuICB9XG5cbiAgLy8gc2V0IHVwIHRoZSB0b29sdGlwIGJvZHlcbiAgdG9vbHRpcEJvZHkuY2xhc3NMaXN0LmFkZChUT09MVElQX0JPRFlfQ0xBU1MpO1xuICB0b29sdGlwQm9keS5zZXRBdHRyaWJ1dGUoXCJpZFwiLCB0b29sdGlwSUQpO1xuICB0b29sdGlwQm9keS5zZXRBdHRyaWJ1dGUoXCJyb2xlXCIsIFwidG9vbHRpcFwiKTtcbiAgdG9vbHRpcEJvZHkuc2V0QXR0cmlidXRlKFwiYXJpYS1oaWRkZW5cIiwgXCJ0cnVlXCIpO1xuXG4gIC8vIHBsYWNlIHRoZSB0ZXh0IGluIHRoZSB0b29sdGlwXG4gIHRvb2x0aXBCb2R5LnRleHRDb250ZW50ID0gdG9vbHRpcENvbnRlbnQ7XG5cbiAgcmV0dXJuIHsgdG9vbHRpcEJvZHksIHBvc2l0aW9uLCB0b29sdGlwQ29udGVudCwgd3JhcHBlciB9O1xufTtcblxuLy8gU2V0dXAgb3VyIGZ1bmN0aW9uIHRvIHJ1biBvbiB2YXJpb3VzIGV2ZW50c1xuY29uc3QgdG9vbHRpcCA9IGJlaGF2aW9yKFxuICB7XG4gICAgXCJtb3VzZW92ZXIgZm9jdXNpblwiOiB7XG4gICAgICBbVE9PTFRJUF0oZSkge1xuICAgICAgICBjb25zdCB0cmlnZ2VyID0gZS50YXJnZXQ7XG4gICAgICAgIGNvbnN0IGVsZW1lbnRUeXBlID0gdHJpZ2dlci5ub2RlTmFtZTtcblxuICAgICAgICAvLyBJbml0aWFsaXplIHRvb2x0aXAgaWYgaXQgaGFzbid0IGFscmVhZHlcbiAgICAgICAgaWYgKGVsZW1lbnRUeXBlID09PSBcIkJVVFRPTlwiICYmIHRyaWdnZXIuaGFzQXR0cmlidXRlKFwidGl0bGVcIikpIHtcbiAgICAgICAgICBzZXRVcEF0dHJpYnV0ZXModHJpZ2dlcik7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBbVE9PTFRJUF9UUklHR0VSXShlKSB7XG4gICAgICAgIGNvbnN0IHsgdHJpZ2dlciwgYm9keSB9ID0gZ2V0VG9vbHRpcEVsZW1lbnRzKGUudGFyZ2V0KTtcblxuICAgICAgICBzaG93VG9vbFRpcChib2R5LCB0cmlnZ2VyLCB0cmlnZ2VyLmRhdGFzZXQucG9zaXRpb24pO1xuICAgICAgfSxcbiAgICB9LFxuICAgIFwibW91c2VvdXQgZm9jdXNvdXRcIjoge1xuICAgICAgW1RPT0xUSVBfVFJJR0dFUl0oZSkge1xuICAgICAgICBjb25zdCB7IGJvZHkgfSA9IGdldFRvb2x0aXBFbGVtZW50cyhlLnRhcmdldCk7XG5cbiAgICAgICAgaGlkZVRvb2xUaXAoYm9keSk7XG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIHtcbiAgICBpbml0KHJvb3QpIHtcbiAgICAgIHNlbGVjdE9yTWF0Y2hlcyhUT09MVElQLCByb290KS5mb3JFYWNoKCh0b29sdGlwVHJpZ2dlcikgPT4ge1xuICAgICAgICBzZXRVcEF0dHJpYnV0ZXModG9vbHRpcFRyaWdnZXIpO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBzZXR1cDogc2V0VXBBdHRyaWJ1dGVzLFxuICAgIGdldFRvb2x0aXBFbGVtZW50cyxcbiAgICBzaG93OiBzaG93VG9vbFRpcCxcbiAgICBoaWRlOiBoaWRlVG9vbFRpcCxcbiAgfVxuKTtcblxubW9kdWxlLmV4cG9ydHMgPSB0b29sdGlwO1xuIiwiY29uc3QgYmVoYXZpb3IgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvYmVoYXZpb3JcIik7XG5jb25zdCB2YWxpZGF0ZSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy92YWxpZGF0ZS1pbnB1dFwiKTtcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XG5jb25zdCBzZWxlY3RPck1hdGNoZXMgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2VsZWN0LW9yLW1hdGNoZXNcIik7XG5cbmNvbnN0IFZBTElEQVRFX0lOUFVUID0gXCJpbnB1dFtkYXRhLXZhbGlkYXRpb24tZWxlbWVudF1cIjtcbmNvbnN0IENIRUNLTElTVF9JVEVNID0gYC4ke1BSRUZJWH0tY2hlY2tsaXN0X19pdGVtYDtcblxuLy8gVHJpZ2dlciB2YWxpZGF0aW9uIG9uIGlucHV0IGNoYW5nZVxuY29uc3QgaGFuZGxlQ2hhbmdlID0gKGVsKSA9PiB2YWxpZGF0ZShlbCk7XG5cbi8vIENyZWF0ZSBjb250YWluZXIgdG8gaG9sZCBhcmlhIHJlYWRvdXRcbmNvbnN0IGNyZWF0ZVN0YXR1c0VsZW1lbnQgPSAoaW5wdXQpID0+IHtcbiAgY29uc3QgdmFsaWRhdGlvbkNvbnRhaW5lciA9IGlucHV0LnBhcmVudE5vZGU7XG4gIGNvbnN0IGlucHV0SUQgPSBpbnB1dC5nZXRBdHRyaWJ1dGUoXCJpZFwiKTtcbiAgY29uc3Qgc3RhdHVzU3VtbWFyeUlEID0gYCR7aW5wdXRJRH0tc3Itc3VtbWFyeWA7XG4gIGlucHV0LnNldEF0dHJpYnV0ZShcImFyaWEtZGVzY3JpYmVkYnlcIiwgc3RhdHVzU3VtbWFyeUlEKTtcblxuICBjb25zdCBzdGF0dXNTdW1tYXJ5Q29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG5cbiAgc3RhdHVzU3VtbWFyeUNvbnRhaW5lci5zZXRBdHRyaWJ1dGUoXCJkYXRhLXZhbGlkYXRpb24tc3RhdHVzXCIsIFwiXCIpO1xuICBzdGF0dXNTdW1tYXJ5Q29udGFpbmVyLmNsYXNzTGlzdC5hZGQoXCJ1c2Etc3Itb25seVwiKTtcbiAgc3RhdHVzU3VtbWFyeUNvbnRhaW5lci5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxpdmVcIiwgXCJwb2xpdGVcIik7XG4gIHN0YXR1c1N1bW1hcnlDb250YWluZXIuc2V0QXR0cmlidXRlKFwiYXJpYS1hdG9taWNcIiwgdHJ1ZSk7XG4gIHN0YXR1c1N1bW1hcnlDb250YWluZXIuc2V0QXR0cmlidXRlKFwiaWRcIiwgc3RhdHVzU3VtbWFyeUlEKTtcbiAgdmFsaWRhdGlvbkNvbnRhaW5lci5hcHBlbmQoc3RhdHVzU3VtbWFyeUNvbnRhaW5lcik7XG59O1xuXG4vLyBTZXQgdXAgY2hlY2tsaXN0IGl0ZW1zIHdpdGggaW5pdGlhbCBhcmlhLWxhYmVsIChpbmNvbXBsZXRlKSB2YWx1ZXNcbmNvbnN0IGNyZWF0ZUluaXRpYWxTdGF0dXMgPSAoaW5wdXQpID0+IHtcbiAgY29uc3QgdmFsaWRhdGlvbkNvbnRhaW5lciA9IGlucHV0LnBhcmVudE5vZGU7XG4gIGNvbnN0IGNoZWNrbGlzdEl0ZW1zID0gdmFsaWRhdGlvbkNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKENIRUNLTElTVF9JVEVNKTtcbiAgY29uc3QgdmFsaWRhdGlvbkVsZW1lbnQgPSBpbnB1dC5nZXRBdHRyaWJ1dGUoXCJkYXRhLXZhbGlkYXRpb24tZWxlbWVudFwiKTtcblxuICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWNvbnRyb2xzXCIsIHZhbGlkYXRpb25FbGVtZW50KTtcblxuICBjaGVja2xpc3RJdGVtcy5mb3JFYWNoKChsaXN0SXRlbSkgPT4ge1xuICAgIGxldCBjdXJyZW50U3RhdHVzID0gXCJzdGF0dXMgaW5jb21wbGV0ZVwiO1xuICAgIGlmIChpbnB1dC5oYXNBdHRyaWJ1dGUoXCJkYXRhLXZhbGlkYXRpb24taW5jb21wbGV0ZVwiKSkge1xuICAgICAgY3VycmVudFN0YXR1cyA9IGlucHV0LmdldEF0dHJpYnV0ZShcImRhdGEtdmFsaWRhdGlvbi1pbmNvbXBsZXRlXCIpO1xuICAgIH1cbiAgICBjb25zdCBpdGVtU3RhdHVzID0gYCR7bGlzdEl0ZW0udGV4dENvbnRlbnR9ICR7Y3VycmVudFN0YXR1c30gYDtcbiAgICBsaXN0SXRlbS5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCBcIjBcIik7XG4gICAgbGlzdEl0ZW0uc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCBpdGVtU3RhdHVzKTtcbiAgfSk7XG59O1xuXG5jb25zdCBlbmhhbmNlVmFsaWRhdGlvbiA9IChpbnB1dCkgPT4ge1xuICBjcmVhdGVTdGF0dXNFbGVtZW50KGlucHV0KTtcbiAgY3JlYXRlSW5pdGlhbFN0YXR1cyhpbnB1dCk7XG59O1xuXG5jb25zdCB2YWxpZGF0b3IgPSBiZWhhdmlvcihcbiAge1xuICAgIFwiaW5wdXQgY2hhbmdlXCI6IHtcbiAgICAgIFtWQUxJREFURV9JTlBVVF0oZXZlbnQpIHtcbiAgICAgICAgaGFuZGxlQ2hhbmdlKGV2ZW50LnRhcmdldCk7XG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIHtcbiAgICBpbml0KHJvb3QpIHtcbiAgICAgIHNlbGVjdE9yTWF0Y2hlcyhWQUxJREFURV9JTlBVVCwgcm9vdCkuZm9yRWFjaCgoaW5wdXQpID0+XG4gICAgICAgIGVuaGFuY2VWYWxpZGF0aW9uKGlucHV0KVxuICAgICAgKTtcbiAgICB9LFxuICB9XG4pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHZhbGlkYXRvcjtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBwcmVmaXg6IFwidXNhXCIsXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIC8vIFRoaXMgdXNlZCB0byBiZSBjb25kaXRpb25hbGx5IGRlcGVuZGVudCBvbiB3aGV0aGVyIHRoZVxuICAvLyBicm93c2VyIHN1cHBvcnRlZCB0b3VjaCBldmVudHM7IGlmIGl0IGRpZCwgYENMSUNLYCB3YXMgc2V0IHRvXG4gIC8vIGB0b3VjaHN0YXJ0YC4gIEhvd2V2ZXIsIHRoaXMgaGFkIGRvd25zaWRlczpcbiAgLy9cbiAgLy8gKiBJdCBwcmUtZW1wdGVkIG1vYmlsZSBicm93c2VycycgZGVmYXVsdCBiZWhhdmlvciBvZiBkZXRlY3RpbmdcbiAgLy8gICB3aGV0aGVyIGEgdG91Y2ggdHVybmVkIGludG8gYSBzY3JvbGwsIHRoZXJlYnkgcHJldmVudGluZ1xuICAvLyAgIHVzZXJzIGZyb20gdXNpbmcgc29tZSBvZiBvdXIgY29tcG9uZW50cyBhcyBzY3JvbGwgc3VyZmFjZXMuXG4gIC8vXG4gIC8vICogU29tZSBkZXZpY2VzLCBzdWNoIGFzIHRoZSBNaWNyb3NvZnQgU3VyZmFjZSBQcm8sIHN1cHBvcnQgKmJvdGgqXG4gIC8vICAgdG91Y2ggYW5kIGNsaWNrcy4gVGhpcyBtZWFudCB0aGUgY29uZGl0aW9uYWwgZWZmZWN0aXZlbHkgZHJvcHBlZFxuICAvLyAgIHN1cHBvcnQgZm9yIHRoZSB1c2VyJ3MgbW91c2UsIGZydXN0cmF0aW5nIHVzZXJzIHdobyBwcmVmZXJyZWRcbiAgLy8gICBpdCBvbiB0aG9zZSBzeXN0ZW1zLlxuICBDTElDSzogXCJjbGlja1wiLFxufTtcbiIsImNvbnN0IGFjY29yZGlvbiA9IHJlcXVpcmUoXCIuLi8uLi8uLi91c2EtYWNjb3JkaW9uL3NyYy9pbmRleFwiKTtcbmNvbnN0IGJhbm5lciA9IHJlcXVpcmUoXCIuLi8uLi8uLi91c2EtYmFubmVyL3NyYy9pbmRleFwiKTtcbmNvbnN0IGNoYXJhY3RlckNvdW50ID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS1jaGFyYWN0ZXItY291bnQvc3JjL2luZGV4XCIpO1xuY29uc3QgY29tYm9Cb3ggPSByZXF1aXJlKFwiLi4vLi4vLi4vdXNhLWNvbWJvLWJveC9zcmMvaW5kZXhcIik7XG5jb25zdCBkYXRlUGlja2VyID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS1kYXRlLXBpY2tlci9zcmMvaW5kZXhcIik7XG5jb25zdCBkYXRlUmFuZ2VQaWNrZXIgPSByZXF1aXJlKFwiLi4vLi4vLi4vdXNhLWRhdGUtcmFuZ2UtcGlja2VyL3NyYy9pbmRleFwiKTtcbmNvbnN0IGZpbGVJbnB1dCA9IHJlcXVpcmUoXCIuLi8uLi8uLi91c2EtZmlsZS1pbnB1dC9zcmMvaW5kZXhcIik7XG5jb25zdCBmb290ZXIgPSByZXF1aXJlKFwiLi4vLi4vLi4vdXNhLWZvb3Rlci9zcmMvaW5kZXhcIik7XG5jb25zdCBpblBhZ2VOYXZpZ2F0aW9uID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS1pbi1wYWdlLW5hdmlnYXRpb24vc3JjL2luZGV4XCIpO1xuY29uc3QgaW5wdXRNYXNrID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS1pbnB1dC1tYXNrL3NyYy9pbmRleFwiKTtcbmNvbnN0IGlucHV0UHJlZml4U3VmZml4ID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS1pbnB1dC1wcmVmaXgtc3VmZml4L3NyYy9pbmRleFwiKTtcbmNvbnN0IGxhbmd1YWdlU2VsZWN0b3IgPSByZXF1aXJlKFwiLi4vLi4vLi4vdXNhLWxhbmd1YWdlLXNlbGVjdG9yL3NyYy9pbmRleFwiKTtcbmNvbnN0IG1vZGFsID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS1tb2RhbC9zcmMvaW5kZXhcIik7XG5jb25zdCBuYXZpZ2F0aW9uID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS1oZWFkZXIvc3JjL2luZGV4XCIpO1xuY29uc3QgcGFzc3dvcmQgPSByZXF1aXJlKFwiLi4vLi4vLi4vX3VzYS1wYXNzd29yZC9zcmMvaW5kZXhcIik7XG5jb25zdCBzZWFyY2ggPSByZXF1aXJlKFwiLi4vLi4vLi4vdXNhLXNlYXJjaC9zcmMvaW5kZXhcIik7XG5jb25zdCBza2lwbmF2ID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS1za2lwbmF2L3NyYy9pbmRleFwiKTtcbmNvbnN0IHRhYmxlID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS10YWJsZS9zcmMvaW5kZXhcIik7XG5jb25zdCB0aW1lUGlja2VyID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS10aW1lLXBpY2tlci9zcmMvaW5kZXhcIik7XG5jb25zdCB0b29sdGlwID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS10b29sdGlwL3NyYy9pbmRleFwiKTtcbmNvbnN0IHZhbGlkYXRvciA9IHJlcXVpcmUoXCIuLi8uLi8uLi91c2EtdmFsaWRhdGlvbi9zcmMvaW5kZXhcIik7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhY2NvcmRpb24sXG4gIGJhbm5lcixcbiAgY2hhcmFjdGVyQ291bnQsXG4gIGNvbWJvQm94LFxuICBkYXRlUGlja2VyLFxuICBkYXRlUmFuZ2VQaWNrZXIsXG4gIGZpbGVJbnB1dCxcbiAgZm9vdGVyLFxuICBpblBhZ2VOYXZpZ2F0aW9uLFxuICBpbnB1dE1hc2ssXG4gIGlucHV0UHJlZml4U3VmZml4LFxuICBsYW5ndWFnZVNlbGVjdG9yLFxuICBtb2RhbCxcbiAgbmF2aWdhdGlvbixcbiAgcGFzc3dvcmQsXG4gIHNlYXJjaCxcbiAgc2tpcG5hdixcbiAgdGFibGUsXG4gIHRpbWVQaWNrZXIsXG4gIHRvb2x0aXAsXG4gIHZhbGlkYXRvcixcbn07XG4iLCIvKiBlc2xpbnQtZGlzYWJsZSBjb25zaXN0ZW50LXJldHVybiAqL1xuLyogZXNsaW50LWRpc2FibGUgZnVuYy1uYW1lcyAqL1xuKGZ1bmN0aW9uICgpIHtcbiAgaWYgKHR5cGVvZiB3aW5kb3cuQ3VzdG9tRXZlbnQgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIGZhbHNlO1xuXG4gIGZ1bmN0aW9uIEN1c3RvbUV2ZW50KGV2ZW50LCBfcGFyYW1zKSB7XG4gICAgY29uc3QgcGFyYW1zID0gX3BhcmFtcyB8fCB7XG4gICAgICBidWJibGVzOiBmYWxzZSxcbiAgICAgIGNhbmNlbGFibGU6IGZhbHNlLFxuICAgICAgZGV0YWlsOiBudWxsLFxuICAgIH07XG4gICAgY29uc3QgZXZ0ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoXCJDdXN0b21FdmVudFwiKTtcbiAgICBldnQuaW5pdEN1c3RvbUV2ZW50KFxuICAgICAgZXZlbnQsXG4gICAgICBwYXJhbXMuYnViYmxlcyxcbiAgICAgIHBhcmFtcy5jYW5jZWxhYmxlLFxuICAgICAgcGFyYW1zLmRldGFpbFxuICAgICk7XG4gICAgcmV0dXJuIGV2dDtcbiAgfVxuXG4gIHdpbmRvdy5DdXN0b21FdmVudCA9IEN1c3RvbUV2ZW50O1xufSkoKTtcbiIsImNvbnN0IGVscHJvdG8gPSB3aW5kb3cuSFRNTEVsZW1lbnQucHJvdG90eXBlO1xuY29uc3QgSElEREVOID0gXCJoaWRkZW5cIjtcblxuaWYgKCEoSElEREVOIGluIGVscHJvdG8pKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbHByb3RvLCBISURERU4sIHtcbiAgICBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5oYXNBdHRyaWJ1dGUoSElEREVOKTtcbiAgICB9LFxuICAgIHNldCh2YWx1ZSkge1xuICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKEhJRERFTiwgXCJcIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShISURERU4pO1xuICAgICAgfVxuICAgIH0sXG4gIH0pO1xufVxuIiwiLy8gcG9seWZpbGxzIEhUTUxFbGVtZW50LnByb3RvdHlwZS5jbGFzc0xpc3QgYW5kIERPTVRva2VuTGlzdFxucmVxdWlyZShcImNsYXNzbGlzdC1wb2x5ZmlsbFwiKTtcbi8vIHBvbHlmaWxscyBIVE1MRWxlbWVudC5wcm90b3R5cGUuaGlkZGVuXG5yZXF1aXJlKFwiLi9lbGVtZW50LWhpZGRlblwiKTtcbi8vIHBvbHlmaWxscyBOdW1iZXIuaXNOYU4oKVxucmVxdWlyZShcIi4vbnVtYmVyLWlzLW5hblwiKTtcbi8vIHBvbHlmaWxscyBDdXN0b21FdmVudFxucmVxdWlyZShcIi4vY3VzdG9tLWV2ZW50XCIpO1xuLy8gcG9seWZpbGxzIHN2ZzRldmVyeWJvZHlcbnJlcXVpcmUoXCIuL3N2ZzRldmVyeWJvZHlcIik7XG4iLCJOdW1iZXIuaXNOYU4gPVxuICBOdW1iZXIuaXNOYU4gfHxcbiAgZnVuY3Rpb24gaXNOYU4oaW5wdXQpIHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tc2VsZi1jb21wYXJlXG4gICAgcmV0dXJuIHR5cGVvZiBpbnB1dCA9PT0gXCJudW1iZXJcIiAmJiBpbnB1dCAhPT0gaW5wdXQ7XG4gIH07XG4iLCIvKiBlc2xpbnQtZGlzYWJsZSAqL1xuIShmdW5jdGlvbiAoZmFjdG9yeSkge1xuICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbn0pKGZ1bmN0aW9uICgpIHtcbiAgLyohIHN2ZzRldmVyeWJvZHkgdjIuMS45IHwgZ2l0aHViLmNvbS9qb25hdGhhbnRuZWFsL3N2ZzRldmVyeWJvZHkgKi9cbiAgZnVuY3Rpb24gZW1iZWQocGFyZW50LCBzdmcsIHRhcmdldCwgdXNlKSB7XG4gICAgLy8gaWYgdGhlIHRhcmdldCBleGlzdHNcbiAgICBpZiAodGFyZ2V0KSB7XG4gICAgICAvLyBjcmVhdGUgYSBkb2N1bWVudCBmcmFnbWVudCB0byBob2xkIHRoZSBjb250ZW50cyBvZiB0aGUgdGFyZ2V0XG4gICAgICB2YXIgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCksXG4gICAgICAgIHZpZXdCb3ggPVxuICAgICAgICAgICFzdmcuaGFzQXR0cmlidXRlKFwidmlld0JveFwiKSAmJiB0YXJnZXQuZ2V0QXR0cmlidXRlKFwidmlld0JveFwiKTtcbiAgICAgIC8vIGNvbmRpdGlvbmFsbHkgc2V0IHRoZSB2aWV3Qm94IG9uIHRoZSBzdmdcbiAgICAgIHZpZXdCb3ggJiYgc3ZnLnNldEF0dHJpYnV0ZShcInZpZXdCb3hcIiwgdmlld0JveCk7XG4gICAgICAvLyBjb3B5IHRoZSBjb250ZW50cyBvZiB0aGUgY2xvbmUgaW50byB0aGUgZnJhZ21lbnRcbiAgICAgIGZvciAoXG4gICAgICAgIC8vIGNsb25lIHRoZSB0YXJnZXRcbiAgICAgICAgdmFyIGNsb25lID0gZG9jdW1lbnQuaW1wb3J0Tm9kZVxuICAgICAgICAgICAgPyBkb2N1bWVudC5pbXBvcnROb2RlKHRhcmdldCwgITApXG4gICAgICAgICAgICA6IHRhcmdldC5jbG9uZU5vZGUoITApLFxuICAgICAgICAgIGcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXG4gICAgICAgICAgICBzdmcubmFtZXNwYWNlVVJJIHx8IFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIixcbiAgICAgICAgICAgIFwiZ1wiXG4gICAgICAgICAgKTtcbiAgICAgICAgY2xvbmUuY2hpbGROb2Rlcy5sZW5ndGg7XG5cbiAgICAgICkge1xuICAgICAgICBnLmFwcGVuZENoaWxkKGNsb25lLmZpcnN0Q2hpbGQpO1xuICAgICAgfVxuICAgICAgaWYgKHVzZSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgdXNlLmF0dHJpYnV0ZXMubGVuZ3RoID4gaTsgaSsrKSB7XG4gICAgICAgICAgdmFyIGF0dHIgPSB1c2UuYXR0cmlidXRlc1tpXTtcbiAgICAgICAgICBcInhsaW5rOmhyZWZcIiAhPT0gYXR0ci5uYW1lICYmXG4gICAgICAgICAgICBcImhyZWZcIiAhPT0gYXR0ci5uYW1lICYmXG4gICAgICAgICAgICBnLnNldEF0dHJpYnV0ZShhdHRyLm5hbWUsIGF0dHIudmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmcmFnbWVudC5hcHBlbmRDaGlsZChnKSwgLy8gYXBwZW5kIHRoZSBmcmFnbWVudCBpbnRvIHRoZSBzdmdcbiAgICAgICAgcGFyZW50LmFwcGVuZENoaWxkKGZyYWdtZW50KTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gbG9hZHJlYWR5c3RhdGVjaGFuZ2UoeGhyLCB1c2UpIHtcbiAgICAvLyBsaXN0ZW4gdG8gY2hhbmdlcyBpbiB0aGUgcmVxdWVzdFxuICAgICh4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgLy8gaWYgdGhlIHJlcXVlc3QgaXMgcmVhZHlcbiAgICAgIGlmICg0ID09PSB4aHIucmVhZHlTdGF0ZSkge1xuICAgICAgICAvLyBnZXQgdGhlIGNhY2hlZCBodG1sIGRvY3VtZW50XG4gICAgICAgIHZhciBjYWNoZWREb2N1bWVudCA9IHhoci5fY2FjaGVkRG9jdW1lbnQ7XG4gICAgICAgIC8vIGVuc3VyZSB0aGUgY2FjaGVkIGh0bWwgZG9jdW1lbnQgYmFzZWQgb24gdGhlIHhociByZXNwb25zZVxuICAgICAgICBjYWNoZWREb2N1bWVudCB8fFxuICAgICAgICAgICgoY2FjaGVkRG9jdW1lbnQgPSB4aHIuX2NhY2hlZERvY3VtZW50ID1cbiAgICAgICAgICAgIGRvY3VtZW50LmltcGxlbWVudGF0aW9uLmNyZWF0ZUhUTUxEb2N1bWVudChcIlwiKSksXG4gICAgICAgICAgKGNhY2hlZERvY3VtZW50LmJvZHkuaW5uZXJIVE1MID0geGhyLnJlc3BvbnNlVGV4dCksIC8vIGVuc3VyZSBkb21haW5zIGFyZSB0aGUgc2FtZSwgb3RoZXJ3aXNlIHdlJ2xsIGhhdmUgaXNzdWVzIGFwcGVuZGluZyB0aGVcbiAgICAgICAgICAvLyBlbGVtZW50IGluIElFIDExXG4gICAgICAgICAgY2FjaGVkRG9jdW1lbnQuZG9tYWluICE9PSBkb2N1bWVudC5kb21haW4gJiZcbiAgICAgICAgICAgIChjYWNoZWREb2N1bWVudC5kb21haW4gPSBkb2N1bWVudC5kb21haW4pLFxuICAgICAgICAgICh4aHIuX2NhY2hlZFRhcmdldCA9IHt9KSksIC8vIGNsZWFyIHRoZSB4aHIgZW1iZWRzIGxpc3QgYW5kIGVtYmVkIGVhY2ggaXRlbVxuICAgICAgICAgIHhoci5fZW1iZWRzLnNwbGljZSgwKS5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgIC8vIGdldCB0aGUgY2FjaGVkIHRhcmdldFxuICAgICAgICAgICAgdmFyIHRhcmdldCA9IHhoci5fY2FjaGVkVGFyZ2V0W2l0ZW0uaWRdO1xuICAgICAgICAgICAgLy8gZW5zdXJlIHRoZSBjYWNoZWQgdGFyZ2V0XG4gICAgICAgICAgICB0YXJnZXQgfHxcbiAgICAgICAgICAgICAgKHRhcmdldCA9IHhoci5fY2FjaGVkVGFyZ2V0W2l0ZW0uaWRdID1cbiAgICAgICAgICAgICAgICBjYWNoZWREb2N1bWVudC5nZXRFbGVtZW50QnlJZChpdGVtLmlkKSksXG4gICAgICAgICAgICAgIC8vIGVtYmVkIHRoZSB0YXJnZXQgaW50byB0aGUgc3ZnXG4gICAgICAgICAgICAgIGVtYmVkKGl0ZW0ucGFyZW50LCBpdGVtLnN2ZywgdGFyZ2V0LCB1c2UpO1xuICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pLCAvLyB0ZXN0IHRoZSByZWFkeSBzdGF0ZSBjaGFuZ2UgaW1tZWRpYXRlbHlcbiAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UoKTtcbiAgfVxuICBmdW5jdGlvbiBzdmc0ZXZlcnlib2R5KHJhd29wdHMpIHtcbiAgICBmdW5jdGlvbiBvbmludGVydmFsKCkge1xuICAgICAgLy8gaWYgYWxsIDx1c2U+cyBpbiB0aGUgYXJyYXkgYXJlIGJlaW5nIGJ5cGFzc2VkLCBkb24ndCBwcm9jZWVkLlxuICAgICAgaWYgKFxuICAgICAgICBudW1iZXJPZlN2Z1VzZUVsZW1lbnRzVG9CeXBhc3MgJiZcbiAgICAgICAgdXNlcy5sZW5ndGggLSBudW1iZXJPZlN2Z1VzZUVsZW1lbnRzVG9CeXBhc3MgPD0gMFxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiB2b2lkIHJlcXVlc3RBbmltYXRpb25GcmFtZShvbmludGVydmFsLCA2Nyk7XG4gICAgICB9XG4gICAgICAvLyBpZiB0aGVyZSBhcmUgPHVzZT5zIHRvIHByb2Nlc3MsIHByb2NlZWQuXG4gICAgICAvLyByZXNldCB0aGUgYnlwYXNzIGNvdW50ZXIsIHNpbmNlIHRoZSBjb3VudGVyIHdpbGwgYmUgaW5jcmVtZW50ZWQgZm9yIGV2ZXJ5IGJ5cGFzc2VkIGVsZW1lbnQsXG4gICAgICAvLyBldmVuIG9uZXMgdGhhdCB3ZXJlIGNvdW50ZWQgYmVmb3JlLlxuICAgICAgbnVtYmVyT2ZTdmdVc2VFbGVtZW50c1RvQnlwYXNzID0gMDtcbiAgICAgIC8vIHdoaWxlIHRoZSBpbmRleCBleGlzdHMgaW4gdGhlIGxpdmUgPHVzZT4gY29sbGVjdGlvblxuICAgICAgZm9yIChcbiAgICAgICAgLy8gZ2V0IHRoZSBjYWNoZWQgPHVzZT4gaW5kZXhcbiAgICAgICAgdmFyIGluZGV4ID0gMDtcbiAgICAgICAgaW5kZXggPCB1c2VzLmxlbmd0aDtcblxuICAgICAgKSB7XG4gICAgICAgIC8vIGdldCB0aGUgY3VycmVudCA8dXNlPlxuICAgICAgICB2YXIgdXNlID0gdXNlc1tpbmRleF0sXG4gICAgICAgICAgcGFyZW50ID0gdXNlLnBhcmVudE5vZGUsXG4gICAgICAgICAgc3ZnID0gZ2V0U1ZHQW5jZXN0b3IocGFyZW50KSxcbiAgICAgICAgICBzcmMgPSB1c2UuZ2V0QXR0cmlidXRlKFwieGxpbms6aHJlZlwiKSB8fCB1c2UuZ2V0QXR0cmlidXRlKFwiaHJlZlwiKTtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICghc3JjICYmXG4gICAgICAgICAgICBvcHRzLmF0dHJpYnV0ZU5hbWUgJiZcbiAgICAgICAgICAgIChzcmMgPSB1c2UuZ2V0QXR0cmlidXRlKG9wdHMuYXR0cmlidXRlTmFtZSkpLFxuICAgICAgICAgIHN2ZyAmJiBzcmMpXG4gICAgICAgICkge1xuICAgICAgICAgIGlmIChwb2x5ZmlsbCkge1xuICAgICAgICAgICAgaWYgKCFvcHRzLnZhbGlkYXRlIHx8IG9wdHMudmFsaWRhdGUoc3JjLCBzdmcsIHVzZSkpIHtcbiAgICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSA8dXNlPiBlbGVtZW50XG4gICAgICAgICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZCh1c2UpO1xuICAgICAgICAgICAgICAvLyBwYXJzZSB0aGUgc3JjIGFuZCBnZXQgdGhlIHVybCBhbmQgaWRcbiAgICAgICAgICAgICAgdmFyIHNyY1NwbGl0ID0gc3JjLnNwbGl0KFwiI1wiKSxcbiAgICAgICAgICAgICAgICB1cmwgPSBzcmNTcGxpdC5zaGlmdCgpLFxuICAgICAgICAgICAgICAgIGlkID0gc3JjU3BsaXQuam9pbihcIiNcIik7XG4gICAgICAgICAgICAgIC8vIGlmIHRoZSBsaW5rIGlzIGV4dGVybmFsXG4gICAgICAgICAgICAgIGlmICh1cmwubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgLy8gZ2V0IHRoZSBjYWNoZWQgeGhyIHJlcXVlc3RcbiAgICAgICAgICAgICAgICB2YXIgeGhyID0gcmVxdWVzdHNbdXJsXTtcbiAgICAgICAgICAgICAgICAvLyBlbnN1cmUgdGhlIHhociByZXF1ZXN0IGV4aXN0c1xuICAgICAgICAgICAgICAgIHhociB8fFxuICAgICAgICAgICAgICAgICAgKCh4aHIgPSByZXF1ZXN0c1t1cmxdID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCkpLFxuICAgICAgICAgICAgICAgICAgeGhyLm9wZW4oXCJHRVRcIiwgdXJsKSxcbiAgICAgICAgICAgICAgICAgIHhoci5zZW5kKCksXG4gICAgICAgICAgICAgICAgICAoeGhyLl9lbWJlZHMgPSBbXSkpLCAvLyBhZGQgdGhlIHN2ZyBhbmQgaWQgYXMgYW4gaXRlbSB0byB0aGUgeGhyIGVtYmVkcyBsaXN0XG4gICAgICAgICAgICAgICAgICB4aHIuX2VtYmVkcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50OiBwYXJlbnQsXG4gICAgICAgICAgICAgICAgICAgIHN2Zzogc3ZnLFxuICAgICAgICAgICAgICAgICAgICBpZDogaWQsXG4gICAgICAgICAgICAgICAgICB9KSwgLy8gcHJlcGFyZSB0aGUgeGhyIHJlYWR5IHN0YXRlIGNoYW5nZSBldmVudFxuICAgICAgICAgICAgICAgICAgbG9hZHJlYWR5c3RhdGVjaGFuZ2UoeGhyLCB1c2UpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGVtYmVkIHRoZSBsb2NhbCBpZCBpbnRvIHRoZSBzdmdcbiAgICAgICAgICAgICAgICBlbWJlZChwYXJlbnQsIHN2ZywgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpLCB1c2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBpbmNyZWFzZSB0aGUgaW5kZXggd2hlbiB0aGUgcHJldmlvdXMgdmFsdWUgd2FzIG5vdCBcInZhbGlkXCJcbiAgICAgICAgICAgICAgKytpbmRleCwgKytudW1iZXJPZlN2Z1VzZUVsZW1lbnRzVG9CeXBhc3M7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGluY3JlYXNlIHRoZSBpbmRleCB3aGVuIHRoZSBwcmV2aW91cyB2YWx1ZSB3YXMgbm90IFwidmFsaWRcIlxuICAgICAgICAgICsraW5kZXg7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIGNvbnRpbnVlIHRoZSBpbnRlcnZhbFxuICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKG9uaW50ZXJ2YWwsIDY3KTtcbiAgICB9XG4gICAgdmFyIHBvbHlmaWxsLFxuICAgICAgb3B0cyA9IE9iamVjdChyYXdvcHRzKSxcbiAgICAgIG5ld2VySUVVQSA9IC9cXGJUcmlkZW50XFwvWzU2N11cXGJ8XFxiTVNJRSAoPzo5fDEwKVxcLjBcXGIvLFxuICAgICAgd2Via2l0VUEgPSAvXFxiQXBwbGVXZWJLaXRcXC8oXFxkKylcXGIvLFxuICAgICAgb2xkZXJFZGdlVUEgPSAvXFxiRWRnZVxcLzEyXFwuKFxcZCspXFxiLyxcbiAgICAgIGVkZ2VVQSA9IC9cXGJFZGdlXFwvLihcXGQrKVxcYi8sXG4gICAgICBpbklmcmFtZSA9IHdpbmRvdy50b3AgIT09IHdpbmRvdy5zZWxmO1xuICAgIHBvbHlmaWxsID1cbiAgICAgIFwicG9seWZpbGxcIiBpbiBvcHRzXG4gICAgICAgID8gb3B0cy5wb2x5ZmlsbFxuICAgICAgICA6IG5ld2VySUVVQS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpIHx8XG4gICAgICAgICAgKG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2gob2xkZXJFZGdlVUEpIHx8IFtdKVsxXSA8IDEwNTQ3IHx8XG4gICAgICAgICAgKG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2god2Via2l0VUEpIHx8IFtdKVsxXSA8IDUzNyB8fFxuICAgICAgICAgIChlZGdlVUEudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSAmJiBpbklmcmFtZSk7XG4gICAgLy8gY3JlYXRlIHhociByZXF1ZXN0cyBvYmplY3RcbiAgICB2YXIgcmVxdWVzdHMgPSB7fSxcbiAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgc2V0VGltZW91dCxcbiAgICAgIHVzZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInVzZVwiKSxcbiAgICAgIG51bWJlck9mU3ZnVXNlRWxlbWVudHNUb0J5cGFzcyA9IDA7XG4gICAgLy8gY29uZGl0aW9uYWxseSBzdGFydCB0aGUgaW50ZXJ2YWwgaWYgdGhlIHBvbHlmaWxsIGlzIGFjdGl2ZVxuICAgIHBvbHlmaWxsICYmIG9uaW50ZXJ2YWwoKTtcbiAgfVxuICBmdW5jdGlvbiBnZXRTVkdBbmNlc3Rvcihub2RlKSB7XG4gICAgZm9yIChcbiAgICAgIHZhciBzdmcgPSBub2RlO1xuICAgICAgXCJzdmdcIiAhPT0gc3ZnLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgJiYgKHN2ZyA9IHN2Zy5wYXJlbnROb2RlKTtcblxuICAgICkge31cbiAgICByZXR1cm4gc3ZnO1xuICB9XG4gIHJldHVybiBzdmc0ZXZlcnlib2R5O1xufSk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IChodG1sRG9jdW1lbnQgPSBkb2N1bWVudCkgPT4gaHRtbERvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4iLCJjb25zdCBhc3NpZ24gPSByZXF1aXJlKFwib2JqZWN0LWFzc2lnblwiKTtcbmNvbnN0IEJlaGF2aW9yID0gcmVxdWlyZShcInJlY2VwdG9yL2JlaGF2aW9yXCIpO1xuXG4vKipcbiAqIEBuYW1lIHNlcXVlbmNlXG4gKiBAcGFyYW0gey4uLkZ1bmN0aW9ufSBzZXEgYW4gYXJyYXkgb2YgZnVuY3Rpb25zXG4gKiBAcmV0dXJuIHsgY2xvc3VyZSB9IGNhbGxIb29rc1xuICovXG4vLyBXZSB1c2UgYSBuYW1lZCBmdW5jdGlvbiBoZXJlIGJlY2F1c2Ugd2Ugd2FudCBpdCB0byBpbmhlcml0IGl0cyBsZXhpY2FsIHNjb3BlXG4vLyBmcm9tIHRoZSBiZWhhdmlvciBwcm9wcyBvYmplY3QsIG5vdCBmcm9tIHRoZSBtb2R1bGVcbmNvbnN0IHNlcXVlbmNlID0gKC4uLnNlcSkgPT5cbiAgZnVuY3Rpb24gY2FsbEhvb2tzKHRhcmdldCA9IGRvY3VtZW50LmJvZHkpIHtcbiAgICBzZXEuZm9yRWFjaCgobWV0aG9kKSA9PiB7XG4gICAgICBpZiAodHlwZW9mIHRoaXNbbWV0aG9kXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRoaXNbbWV0aG9kXS5jYWxsKHRoaXMsIHRhcmdldCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbi8qKlxuICogQG5hbWUgYmVoYXZpb3JcbiAqIEBwYXJhbSB7b2JqZWN0fSBldmVudHNcbiAqIEBwYXJhbSB7b2JqZWN0P30gcHJvcHNcbiAqIEByZXR1cm4ge3JlY2VwdG9yLmJlaGF2aW9yfVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IChldmVudHMsIHByb3BzKSA9PlxuICBCZWhhdmlvcihcbiAgICBldmVudHMsXG4gICAgYXNzaWduKFxuICAgICAge1xuICAgICAgICBvbjogc2VxdWVuY2UoXCJpbml0XCIsIFwiYWRkXCIpLFxuICAgICAgICBvZmY6IHNlcXVlbmNlKFwidGVhcmRvd25cIiwgXCJyZW1vdmVcIiksXG4gICAgICB9LFxuICAgICAgcHJvcHNcbiAgICApXG4gICk7XG4iLCIvKipcbiAqIENhbGwgYSBmdW5jdGlvbiBldmVyeSBYIGFtb3VudCBvZiBtaWxsaXNlY29uZHMuXG4gKlxuICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIC0gQSBjYWxsYmFjayBmdW5jdGlvbiB0byBiZSBkZWJvdW5jZWRcbiAqIEBwYXJhbSAge251bWJlcn0gZGVsYXkgLSBNaWxsaXNlY29uZHMgdG8gd2FpdCBiZWZvcmUgY2FsbGluZyBmdW5jdGlvblxuICogQHJldHVybnMge0Z1bmN0aW9ufSBBIGRlYm91bmNlZCBmdW5jdGlvblxuICogQGV4YW1wbGUgY29uc3QgdXBkYXRlU3RhdHVzID0gZGVib3VuY2UoKHN0cmluZykgPT4gY29uc29sZS5sb2coc3RyaW5nKSwgMjAwMClcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlYm91bmNlKGNhbGxiYWNrLCBkZWxheSA9IDUwMCkge1xuICBsZXQgdGltZXIgPSBudWxsO1xuICByZXR1cm4gKC4uLmFyZ3MpID0+IHtcbiAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICB0aW1lciA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH0sIGRlbGF5KTtcbiAgfTtcbn07XG4iLCJjb25zdCBhc3NpZ24gPSByZXF1aXJlKFwib2JqZWN0LWFzc2lnblwiKTtcbmNvbnN0IHsga2V5bWFwIH0gPSByZXF1aXJlKFwicmVjZXB0b3JcIik7XG5jb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuL2JlaGF2aW9yXCIpO1xuY29uc3Qgc2VsZWN0ID0gcmVxdWlyZShcIi4vc2VsZWN0XCIpO1xuY29uc3QgYWN0aXZlRWxlbWVudCA9IHJlcXVpcmUoXCIuL2FjdGl2ZS1lbGVtZW50XCIpO1xuXG5jb25zdCBGT0NVU0FCTEUgPVxuICAnYVtocmVmXSwgYXJlYVtocmVmXSwgaW5wdXQ6bm90KFtkaXNhYmxlZF0pLCBzZWxlY3Q6bm90KFtkaXNhYmxlZF0pLCB0ZXh0YXJlYTpub3QoW2Rpc2FibGVkXSksIGJ1dHRvbjpub3QoW2Rpc2FibGVkXSksIGlmcmFtZSwgb2JqZWN0LCBlbWJlZCwgW3RhYmluZGV4PVwiMFwiXSwgW2NvbnRlbnRlZGl0YWJsZV0nO1xuXG5jb25zdCB0YWJIYW5kbGVyID0gKGNvbnRleHQpID0+IHtcbiAgY29uc3QgZm9jdXNhYmxlRWxlbWVudHMgPSBzZWxlY3QoRk9DVVNBQkxFLCBjb250ZXh0KTtcbiAgY29uc3QgZmlyc3RUYWJTdG9wID0gZm9jdXNhYmxlRWxlbWVudHNbMF07XG4gIGNvbnN0IGxhc3RUYWJTdG9wID0gZm9jdXNhYmxlRWxlbWVudHNbZm9jdXNhYmxlRWxlbWVudHMubGVuZ3RoIC0gMV07XG5cbiAgLy8gU3BlY2lhbCBydWxlcyBmb3Igd2hlbiB0aGUgdXNlciBpcyB0YWJiaW5nIGZvcndhcmQgZnJvbSB0aGUgbGFzdCBmb2N1c2FibGUgZWxlbWVudCxcbiAgLy8gb3Igd2hlbiB0YWJiaW5nIGJhY2t3YXJkcyBmcm9tIHRoZSBmaXJzdCBmb2N1c2FibGUgZWxlbWVudFxuICBmdW5jdGlvbiB0YWJBaGVhZChldmVudCkge1xuICAgIGlmIChhY3RpdmVFbGVtZW50KCkgPT09IGxhc3RUYWJTdG9wKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZmlyc3RUYWJTdG9wLmZvY3VzKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdGFiQmFjayhldmVudCkge1xuICAgIGlmIChhY3RpdmVFbGVtZW50KCkgPT09IGZpcnN0VGFiU3RvcCkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGxhc3RUYWJTdG9wLmZvY3VzKCk7XG4gICAgfVxuICAgIC8vIFRoaXMgY2hlY2tzIGlmIHlvdSB3YW50IHRvIHNldCB0aGUgaW5pdGlhbCBmb2N1cyB0byBhIGNvbnRhaW5lclxuICAgIC8vIGluc3RlYWQgb2YgYW4gZWxlbWVudCB3aXRoaW4sIGFuZCB0aGUgdXNlciB0YWJzIGJhY2suXG4gICAgLy8gVGhlbiB3ZSBzZXQgdGhlIGZvY3VzIHRvIHRoZSBmaXJzdFxuICAgIGVsc2UgaWYgKCFmb2N1c2FibGVFbGVtZW50cy5pbmNsdWRlcyhhY3RpdmVFbGVtZW50KCkpKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZmlyc3RUYWJTdG9wLmZvY3VzKCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBmaXJzdFRhYlN0b3AsXG4gICAgbGFzdFRhYlN0b3AsXG4gICAgdGFiQWhlYWQsXG4gICAgdGFiQmFjayxcbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gKGNvbnRleHQsIGFkZGl0aW9uYWxLZXlCaW5kaW5ncyA9IHt9KSA9PiB7XG4gIGNvbnN0IHRhYkV2ZW50SGFuZGxlciA9IHRhYkhhbmRsZXIoY29udGV4dCk7XG4gIGNvbnN0IGJpbmRpbmdzID0gYWRkaXRpb25hbEtleUJpbmRpbmdzO1xuICBjb25zdCB7IEVzYywgRXNjYXBlIH0gPSBiaW5kaW5ncztcblxuICBpZiAoRXNjYXBlICYmICFFc2MpIGJpbmRpbmdzLkVzYyA9IEVzY2FwZTtcblxuICAvLyAgVE9ETzogSW4gdGhlIGZ1dHVyZSwgbG9vcCBvdmVyIGFkZGl0aW9uYWwga2V5YmluZGluZ3MgYW5kIHBhc3MgYW4gYXJyYXlcbiAgLy8gb2YgZnVuY3Rpb25zLCBpZiBuZWNlc3NhcnksIHRvIHRoZSBtYXAga2V5cy4gVGhlbiBwZW9wbGUgaW1wbGVtZW50aW5nXG4gIC8vIHRoZSBmb2N1cyB0cmFwIGNvdWxkIHBhc3MgY2FsbGJhY2tzIHRvIGZpcmUgd2hlbiB0YWJiaW5nXG4gIGNvbnN0IGtleU1hcHBpbmdzID0ga2V5bWFwKFxuICAgIGFzc2lnbihcbiAgICAgIHtcbiAgICAgICAgVGFiOiB0YWJFdmVudEhhbmRsZXIudGFiQWhlYWQsXG4gICAgICAgIFwiU2hpZnQrVGFiXCI6IHRhYkV2ZW50SGFuZGxlci50YWJCYWNrLFxuICAgICAgfSxcbiAgICAgIGFkZGl0aW9uYWxLZXlCaW5kaW5nc1xuICAgIClcbiAgKTtcblxuICBjb25zdCBmb2N1c1RyYXAgPSBiZWhhdmlvcihcbiAgICB7XG4gICAgICBrZXlkb3duOiBrZXlNYXBwaW5ncyxcbiAgICB9LFxuICAgIHtcbiAgICAgIGluaXQoKSB7XG4gICAgICAgIC8vIFRPRE86IGlzIHRoaXMgZGVzaXJlYWJsZSBiZWhhdmlvcj8gU2hvdWxkIHRoZSB0cmFwIGFsd2F5cyBkbyB0aGlzIGJ5IGRlZmF1bHQgb3Igc2hvdWxkXG4gICAgICAgIC8vIHRoZSBjb21wb25lbnQgZ2V0dGluZyBkZWNvcmF0ZWQgaGFuZGxlIHRoaXM/XG4gICAgICAgIGlmICh0YWJFdmVudEhhbmRsZXIuZmlyc3RUYWJTdG9wKSB7XG4gICAgICAgICAgdGFiRXZlbnRIYW5kbGVyLmZpcnN0VGFiU3RvcC5mb2N1cygpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgdXBkYXRlKGlzQWN0aXZlKSB7XG4gICAgICAgIGlmIChpc0FjdGl2ZSkge1xuICAgICAgICAgIHRoaXMub24oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLm9mZigpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH1cbiAgKTtcblxuICByZXR1cm4gZm9jdXNUcmFwO1xufTtcbiIsIi8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vYS83NTU3NDMzXG5mdW5jdGlvbiBpc0VsZW1lbnRJblZpZXdwb3J0KFxuICBlbCxcbiAgd2luID0gd2luZG93LFxuICBkb2NFbCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudFxuKSB7XG4gIGNvbnN0IHJlY3QgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICByZXR1cm4gKFxuICAgIHJlY3QudG9wID49IDAgJiZcbiAgICByZWN0LmxlZnQgPj0gMCAmJlxuICAgIHJlY3QuYm90dG9tIDw9ICh3aW4uaW5uZXJIZWlnaHQgfHwgZG9jRWwuY2xpZW50SGVpZ2h0KSAmJlxuICAgIHJlY3QucmlnaHQgPD0gKHdpbi5pbm5lcldpZHRoIHx8IGRvY0VsLmNsaWVudFdpZHRoKVxuICApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzRWxlbWVudEluVmlld3BvcnQ7XG4iLCIvLyBpT1MgZGV0ZWN0aW9uIGZyb206IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzkwMzk4ODUvMTc3NzEwXG5mdW5jdGlvbiBpc0lvc0RldmljZSgpIHtcbiAgcmV0dXJuIChcbiAgICB0eXBlb2YgbmF2aWdhdG9yICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgKG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goLyhpUG9kfGlQaG9uZXxpUGFkKS9nKSB8fFxuICAgICAgKG5hdmlnYXRvci5wbGF0Zm9ybSA9PT0gXCJNYWNJbnRlbFwiICYmIG5hdmlnYXRvci5tYXhUb3VjaFBvaW50cyA+IDEpKSAmJlxuICAgICF3aW5kb3cuTVNTdHJlYW1cbiAgKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0lvc0RldmljZTtcbiIsIi8qIGVzbGludC1kaXNhYmxlICovXG4vKiBnbG9iYWxzIGRlZmluZSwgbW9kdWxlICovXG5cbi8qKlxuICogQSBzaW1wbGUgbGlicmFyeSB0byBoZWxwIHlvdSBlc2NhcGUgSFRNTCB1c2luZyB0ZW1wbGF0ZSBzdHJpbmdzLlxuICpcbiAqIEl0J3MgdGhlIGNvdW50ZXJwYXJ0IHRvIG91ciBlc2xpbnQgXCJuby11bnNhZmUtaW5uZXJodG1sXCIgcGx1Z2luIHRoYXQgaGVscHMgdXNcbiAqIGF2b2lkIHVuc2FmZSBjb2RpbmcgcHJhY3RpY2VzLlxuICogQSBmdWxsIHdyaXRlLXVwIG9mIHRoZSBIb3dzIGFuZCBXaHlzIGFyZSBkb2N1bWVudGVkXG4gKiBmb3IgZGV2ZWxvcGVycyBhdFxuICogIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL0ZpcmVmb3hfT1MvU2VjdXJpdHkvU2VjdXJpdHlfQXV0b21hdGlvblxuICogd2l0aCBhZGRpdGlvbmFsIGJhY2tncm91bmQgaW5mb3JtYXRpb24gYW5kIGRlc2lnbiBkb2NzIGF0XG4gKiAgaHR0cHM6Ly93aWtpLm1vemlsbGEub3JnL1VzZXI6RmJyYXVuL0dhaWEvU2FmZWlubmVySFRNTFJvYWRtYXBcbiAqXG4gKi9cblxuIShmdW5jdGlvbiAoZmFjdG9yeSkge1xuICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbn0pKGZ1bmN0aW9uICgpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBTYW5pdGl6ZXIgPSB7XG4gICAgX2VudGl0eTogL1smPD5cIicvXS9nLFxuXG4gICAgX2VudGl0aWVzOiB7XG4gICAgICAnJic6ICcmYW1wOycsXG4gICAgICAnPCc6ICcmbHQ7JyxcbiAgICAgICc+JzogJyZndDsnLFxuICAgICAgJ1wiJzogJyZxdW90OycsXG4gICAgICAnXFwnJzogJyZhcG9zOycsXG4gICAgICAnLyc6ICcmI3gyRjsnXG4gICAgfSxcblxuICAgIGdldEVudGl0eTogZnVuY3Rpb24gKHMpIHtcbiAgICAgIHJldHVybiBTYW5pdGl6ZXIuX2VudGl0aWVzW3NdO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFc2NhcGVzIEhUTUwgZm9yIGFsbCB2YWx1ZXMgaW4gYSB0YWdnZWQgdGVtcGxhdGUgc3RyaW5nLlxuICAgICAqL1xuICAgIGVzY2FwZUhUTUw6IGZ1bmN0aW9uIChzdHJpbmdzKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gJyc7XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyaW5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICByZXN1bHQgKz0gc3RyaW5nc1tpXTtcbiAgICAgICAgaWYgKGkgKyAxIDwgYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgIHZhciB2YWx1ZSA9IGFyZ3VtZW50c1tpICsgMV0gfHwgJyc7XG4gICAgICAgICAgcmVzdWx0ICs9IFN0cmluZyh2YWx1ZSkucmVwbGFjZShTYW5pdGl6ZXIuX2VudGl0eSxcbiAgICAgICAgICAgIFNhbml0aXplci5nZXRFbnRpdHkpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBFc2NhcGVzIEhUTUwgYW5kIHJldHVybnMgYSB3cmFwcGVkIG9iamVjdCB0byBiZSB1c2VkIGR1cmluZyBET00gaW5zZXJ0aW9uXG4gICAgICovXG4gICAgY3JlYXRlU2FmZUhUTUw6IGZ1bmN0aW9uIChzdHJpbmdzKSB7XG4gICAgICB2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICB2YXIgdmFsdWVzID0gbmV3IEFycmF5KF9sZW4gPiAxID8gX2xlbiAtIDEgOiAwKTtcbiAgICAgIGZvciAodmFyIF9rZXkgPSAxOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICAgIHZhbHVlc1tfa2V5IC0gMV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgICB9XG5cbiAgICAgIHZhciBlc2NhcGVkID0gU2FuaXRpemVyLmVzY2FwZUhUTUwuYXBwbHkoU2FuaXRpemVyLFxuICAgICAgICBbc3RyaW5nc10uY29uY2F0KHZhbHVlcykpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgX19odG1sOiBlc2NhcGVkLFxuICAgICAgICB0b1N0cmluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJldHVybiAnW29iamVjdCBXcmFwcGVkSFRNTE9iamVjdF0nO1xuICAgICAgICB9LFxuICAgICAgICBpbmZvOiAnVGhpcyBpcyBhIHdyYXBwZWQgSFRNTCBvYmplY3QuIFNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yJytcbiAgICAgICAgICAnZy9lbi1VUy9GaXJlZm94X09TL1NlY3VyaXR5L1NlY3VyaXR5X0F1dG9tYXRpb24gZm9yIG1vcmUuJ1xuICAgICAgfTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIFVud3JhcCBzYWZlIEhUTUwgY3JlYXRlZCBieSBjcmVhdGVTYWZlSFRNTCBvciBhIGN1c3RvbSByZXBsYWNlbWVudCB0aGF0XG4gICAgICogdW5kZXJ3ZW50IHNlY3VyaXR5IHJldmlldy5cbiAgICAgKi9cbiAgICB1bndyYXBTYWZlSFRNTDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgdmFyIGh0bWxPYmplY3RzID0gbmV3IEFycmF5KF9sZW4pO1xuICAgICAgZm9yICh2YXIgX2tleSA9IDA7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgICAgaHRtbE9iamVjdHNbX2tleV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgICB9XG5cbiAgICAgIHZhciBtYXJrdXBMaXN0ID0gaHRtbE9iamVjdHMubWFwKGZ1bmN0aW9uKG9iaikge1xuICAgICAgICByZXR1cm4gb2JqLl9faHRtbDtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIG1hcmt1cExpc3Quam9pbignJyk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBTYW5pdGl6ZXI7XG5cbn0pO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBnZXRTY3JvbGxiYXJXaWR0aCgpIHtcbiAgLy8gQ3JlYXRpbmcgaW52aXNpYmxlIGNvbnRhaW5lclxuICBjb25zdCBvdXRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBvdXRlci5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG4gIG91dGVyLnN0eWxlLm92ZXJmbG93ID0gJ3Njcm9sbCc7IC8vIGZvcmNpbmcgc2Nyb2xsYmFyIHRvIGFwcGVhclxuICBvdXRlci5zdHlsZS5tc092ZXJmbG93U3R5bGUgPSAnc2Nyb2xsYmFyJzsgLy8gbmVlZGVkIGZvciBXaW5KUyBhcHBzXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQob3V0ZXIpO1xuXG4gIC8vIENyZWF0aW5nIGlubmVyIGVsZW1lbnQgYW5kIHBsYWNpbmcgaXQgaW4gdGhlIGNvbnRhaW5lclxuICBjb25zdCBpbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBvdXRlci5hcHBlbmRDaGlsZChpbm5lcik7XG4gIFxuICAvLyBDYWxjdWxhdGluZyBkaWZmZXJlbmNlIGJldHdlZW4gY29udGFpbmVyJ3MgZnVsbCB3aWR0aCBhbmQgdGhlIGNoaWxkIHdpZHRoXG4gIGNvbnN0IHNjcm9sbGJhcldpZHRoID0gYCR7KG91dGVyLm9mZnNldFdpZHRoIC0gaW5uZXIub2Zmc2V0V2lkdGgpfXB4YDtcblxuICAvLyBSZW1vdmluZyB0ZW1wb3JhcnkgZWxlbWVudHMgZnJvbSB0aGUgRE9NXG4gIG91dGVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQob3V0ZXIpO1xuXG4gIHJldHVybiBzY3JvbGxiYXJXaWR0aDtcbn07XG4iLCJjb25zdCBzZWxlY3QgPSByZXF1aXJlKFwiLi9zZWxlY3RcIik7XG4vKipcbiAqIEBuYW1lIGlzRWxlbWVudFxuICogQGRlc2MgcmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYSBET00gZWxlbWVudC5cbiAqIEBwYXJhbSB7YW55fSB2YWx1ZVxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuY29uc3QgaXNFbGVtZW50ID0gKHZhbHVlKSA9PlxuICB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUubm9kZVR5cGUgPT09IDE7XG5cbi8qKlxuICogQG5hbWUgc2VsZWN0T3JNYXRjaGVzXG4gKiBAZGVzYyBzZWxlY3RzIGVsZW1lbnRzIGZyb20gdGhlIERPTSBieSBjbGFzcyBzZWxlY3RvciBvciBJRCBzZWxlY3Rvci5cbiAqIEBwYXJhbSB7c3RyaW5nfSBzZWxlY3RvciAtIFRoZSBzZWxlY3RvciB0byB0cmF2ZXJzZSB0aGUgRE9NIHdpdGguXG4gKiBAcGFyYW0ge0RvY3VtZW50fEhUTUxFbGVtZW50P30gY29udGV4dCAtIFRoZSBjb250ZXh0IHRvIHRyYXZlcnNlIHRoZSBET01cbiAqICAgaW4uIElmIG5vdCBwcm92aWRlZCwgaXQgZGVmYXVsdHMgdG8gdGhlIGRvY3VtZW50LlxuICogQHJldHVybiB7SFRNTEVsZW1lbnRbXX0gLSBBbiBhcnJheSBvZiBET00gbm9kZXMgb3IgYW4gZW1wdHkgYXJyYXkuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gKHNlbGVjdG9yLCBjb250ZXh0KSA9PiB7XG4gIGNvbnN0IHNlbGVjdGlvbiA9IHNlbGVjdChzZWxlY3RvciwgY29udGV4dCk7XG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgIT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4gc2VsZWN0aW9uO1xuICB9XG5cbiAgaWYgKGlzRWxlbWVudChjb250ZXh0KSAmJiBjb250ZXh0Lm1hdGNoZXMoc2VsZWN0b3IpKSB7XG4gICAgc2VsZWN0aW9uLnB1c2goY29udGV4dCk7XG4gIH1cblxuICByZXR1cm4gc2VsZWN0aW9uO1xufTtcbiIsIi8qKlxuICogQG5hbWUgaXNFbGVtZW50XG4gKiBAZGVzYyByZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhIERPTSBlbGVtZW50LlxuICogQHBhcmFtIHthbnl9IHZhbHVlXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5jb25zdCBpc0VsZW1lbnQgPSAodmFsdWUpID0+XG4gIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZS5ub2RlVHlwZSA9PT0gMTtcblxuLyoqXG4gKiBAbmFtZSBzZWxlY3RcbiAqIEBkZXNjIHNlbGVjdHMgZWxlbWVudHMgZnJvbSB0aGUgRE9NIGJ5IGNsYXNzIHNlbGVjdG9yIG9yIElEIHNlbGVjdG9yLlxuICogQHBhcmFtIHtzdHJpbmd9IHNlbGVjdG9yIC0gVGhlIHNlbGVjdG9yIHRvIHRyYXZlcnNlIHRoZSBET00gd2l0aC5cbiAqIEBwYXJhbSB7RG9jdW1lbnR8SFRNTEVsZW1lbnQ/fSBjb250ZXh0IC0gVGhlIGNvbnRleHQgdG8gdHJhdmVyc2UgdGhlIERPTVxuICogICBpbi4gSWYgbm90IHByb3ZpZGVkLCBpdCBkZWZhdWx0cyB0byB0aGUgZG9jdW1lbnQuXG4gKiBAcmV0dXJuIHtIVE1MRWxlbWVudFtdfSAtIEFuIGFycmF5IG9mIERPTSBub2RlcyBvciBhbiBlbXB0eSBhcnJheS5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSAoc2VsZWN0b3IsIGNvbnRleHQpID0+IHtcbiAgaWYgKHR5cGVvZiBzZWxlY3RvciAhPT0gXCJzdHJpbmdcIikge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGlmICghY29udGV4dCB8fCAhaXNFbGVtZW50KGNvbnRleHQpKSB7XG4gICAgY29udGV4dCA9IHdpbmRvdy5kb2N1bWVudDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICB9XG5cbiAgY29uc3Qgc2VsZWN0aW9uID0gY29udGV4dC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbiAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHNlbGVjdGlvbik7XG59O1xuIiwiLyoqXG4gKiBGbGlwcyBnaXZlbiBJTlBVVCBlbGVtZW50cyBiZXR3ZWVuIG1hc2tlZCAoaGlkaW5nIHRoZSBmaWVsZCB2YWx1ZSkgYW5kIHVubWFza2VkXG4gKiBAcGFyYW0ge0FycmF5LkhUTUxFbGVtZW50fSBmaWVsZHMgLSBBbiBhcnJheSBvZiBJTlBVVCBlbGVtZW50c1xuICogQHBhcmFtIHtCb29sZWFufSBtYXNrIC0gV2hldGhlciB0aGUgbWFzayBzaG91bGQgYmUgYXBwbGllZCwgaGlkaW5nIHRoZSBmaWVsZCB2YWx1ZVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IChmaWVsZCwgbWFzaykgPT4ge1xuICBmaWVsZC5zZXRBdHRyaWJ1dGUoXCJhdXRvY2FwaXRhbGl6ZVwiLCBcIm9mZlwiKTtcbiAgZmllbGQuc2V0QXR0cmlidXRlKFwiYXV0b2NvcnJlY3RcIiwgXCJvZmZcIik7XG4gIGZpZWxkLnNldEF0dHJpYnV0ZShcInR5cGVcIiwgbWFzayA/IFwicGFzc3dvcmRcIiA6IFwidGV4dFwiKTtcbn07XG4iLCJjb25zdCByZXNvbHZlSWRSZWZzID0gcmVxdWlyZShcInJlc29sdmUtaWQtcmVmc1wiKTtcbmNvbnN0IHRvZ2dsZUZpZWxkTWFzayA9IHJlcXVpcmUoXCIuL3RvZ2dsZS1maWVsZC1tYXNrXCIpO1xuXG5jb25zdCBDT05UUk9MUyA9IFwiYXJpYS1jb250cm9sc1wiO1xuY29uc3QgUFJFU1NFRCA9IFwiYXJpYS1wcmVzc2VkXCI7XG5jb25zdCBTSE9XX0FUVFIgPSBcImRhdGEtc2hvdy10ZXh0XCI7XG5jb25zdCBISURFX0FUVFIgPSBcImRhdGEtaGlkZS10ZXh0XCI7XG5cbi8qKlxuICogUmVwbGFjZSB0aGUgd29yZCBcIlNob3dcIiAob3IgXCJzaG93XCIpIHdpdGggXCJIaWRlXCIgKG9yIFwiaGlkZVwiKSBpbiBhIHN0cmluZy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBzaG93VGV4dFxuICogQHJldHVybiB7c3Ryb25nfSBoaWRlVGV4dFxuICovXG5jb25zdCBnZXRIaWRlVGV4dCA9IChzaG93VGV4dCkgPT5cbiAgc2hvd1RleHQucmVwbGFjZSgvXFxiU2hvd1xcYi9pLCAoc2hvdykgPT4gYCR7c2hvd1swXSA9PT0gXCJTXCIgPyBcIkhcIiA6IFwiaFwifWlkZWApO1xuXG4vKipcbiAqIENvbXBvbmVudCB0aGF0IGRlY29yYXRlcyBhbiBIVE1MIGVsZW1lbnQgd2l0aCB0aGUgYWJpbGl0eSB0byB0b2dnbGUgdGhlXG4gKiBtYXNrZWQgc3RhdGUgb2YgYW4gaW5wdXQgZmllbGQgKGxpa2UgYSBwYXNzd29yZCkgd2hlbiBjbGlja2VkLlxuICogVGhlIGlkcyBvZiB0aGUgZmllbGRzIHRvIGJlIG1hc2tlZCB3aWxsIGJlIHB1bGxlZCBkaXJlY3RseSBmcm9tIHRoZSBidXR0b24nc1xuICogYGFyaWEtY29udHJvbHNgIGF0dHJpYnV0ZS5cbiAqXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWwgICAgUGFyZW50IGVsZW1lbnQgY29udGFpbmluZyB0aGUgZmllbGRzIHRvIGJlIG1hc2tlZFxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSAoZWwpID0+IHtcbiAgLy8gdGhpcyBpcyB0aGUgKnRhcmdldCogc3RhdGU6XG4gIC8vICogaWYgdGhlIGVsZW1lbnQgaGFzIHRoZSBhdHRyIGFuZCBpdCdzICE9PSBcInRydWVcIiwgcHJlc3NlZCBpcyB0cnVlXG4gIC8vICogb3RoZXJ3aXNlLCBwcmVzc2VkIGlzIGZhbHNlXG4gIGNvbnN0IHByZXNzZWQgPVxuICAgIGVsLmhhc0F0dHJpYnV0ZShQUkVTU0VEKSAmJiBlbC5nZXRBdHRyaWJ1dGUoUFJFU1NFRCkgIT09IFwidHJ1ZVwiO1xuXG4gIGNvbnN0IGZpZWxkcyA9IHJlc29sdmVJZFJlZnMoZWwuZ2V0QXR0cmlidXRlKENPTlRST0xTKSk7XG4gIGZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4gdG9nZ2xlRmllbGRNYXNrKGZpZWxkLCBwcmVzc2VkKSk7XG5cbiAgaWYgKCFlbC5oYXNBdHRyaWJ1dGUoU0hPV19BVFRSKSkge1xuICAgIGVsLnNldEF0dHJpYnV0ZShTSE9XX0FUVFIsIGVsLnRleHRDb250ZW50KTtcbiAgfVxuXG4gIGNvbnN0IHNob3dUZXh0ID0gZWwuZ2V0QXR0cmlidXRlKFNIT1dfQVRUUik7XG4gIGNvbnN0IGhpZGVUZXh0ID0gZWwuZ2V0QXR0cmlidXRlKEhJREVfQVRUUikgfHwgZ2V0SGlkZVRleHQoc2hvd1RleHQpO1xuXG4gIGVsLnRleHRDb250ZW50ID0gcHJlc3NlZCA/IHNob3dUZXh0IDogaGlkZVRleHQ7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgZWwuc2V0QXR0cmlidXRlKFBSRVNTRUQsIHByZXNzZWQpO1xuICByZXR1cm4gcHJlc3NlZDtcbn07XG4iLCJjb25zdCBFWFBBTkRFRCA9IFwiYXJpYS1leHBhbmRlZFwiO1xuY29uc3QgQ09OVFJPTFMgPSBcImFyaWEtY29udHJvbHNcIjtcbmNvbnN0IEhJRERFTiA9IFwiaGlkZGVuXCI7XG5cbm1vZHVsZS5leHBvcnRzID0gKGJ1dHRvbiwgZXhwYW5kZWQpID0+IHtcbiAgbGV0IHNhZmVFeHBhbmRlZCA9IGV4cGFuZGVkO1xuXG4gIGlmICh0eXBlb2Ygc2FmZUV4cGFuZGVkICE9PSBcImJvb2xlYW5cIikge1xuICAgIHNhZmVFeHBhbmRlZCA9IGJ1dHRvbi5nZXRBdHRyaWJ1dGUoRVhQQU5ERUQpID09PSBcImZhbHNlXCI7XG4gIH1cblxuICBidXR0b24uc2V0QXR0cmlidXRlKEVYUEFOREVELCBzYWZlRXhwYW5kZWQpO1xuXG4gIGNvbnN0IGlkID0gYnV0dG9uLmdldEF0dHJpYnV0ZShDT05UUk9MUyk7XG4gIGNvbnN0IGNvbnRyb2xzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICBpZiAoIWNvbnRyb2xzKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBObyB0b2dnbGUgdGFyZ2V0IGZvdW5kIHdpdGggaWQ6IFwiJHtpZH1cImApO1xuICB9XG5cbiAgaWYgKHNhZmVFeHBhbmRlZCkge1xuICAgIGNvbnRyb2xzLnJlbW92ZUF0dHJpYnV0ZShISURERU4pO1xuICB9IGVsc2Uge1xuICAgIGNvbnRyb2xzLnNldEF0dHJpYnV0ZShISURERU4sIFwiXCIpO1xuICB9XG5cbiAgcmV0dXJuIHNhZmVFeHBhbmRlZDtcbn07XG4iLCJjb25zdCBkZWJvdW5jZSA9IHJlcXVpcmUoXCIuL2RlYm91bmNlXCIpO1xuY29uc3QgeyBwcmVmaXg6IFBSRUZJWCB9ID0gcmVxdWlyZShcIi4uL2NvbmZpZ1wiKTtcblxuY29uc3QgQ0hFQ0tFRF9DTEFTUyA9IGAke1BSRUZJWH0tY2hlY2tsaXN0X19pdGVtLS1jaGVja2VkYDtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB2YWxpZGF0ZShlbCkge1xuICBjb25zdCBpZCA9IGVsLmRhdGFzZXQudmFsaWRhdGlvbkVsZW1lbnQ7XG4gIGNvbnN0IGNoZWNrTGlzdCA9XG4gICAgaWQuY2hhckF0KDApID09PSBcIiNcIlxuICAgICAgPyBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGlkKVxuICAgICAgOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG5cbiAgaWYgKCFjaGVja0xpc3QpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIHZhbGlkYXRpb24gZWxlbWVudCBmb3VuZCB3aXRoIGlkOiBcIiR7aWR9XCJgKTtcbiAgfVxuXG4gIGxldCBzdGF0dXNTdW1tYXJ5ID0gXCJcIjtcbiAgT2JqZWN0LmVudHJpZXMoZWwuZGF0YXNldCkuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgaWYgKGtleS5zdGFydHNXaXRoKFwidmFsaWRhdGVcIikpIHtcbiAgICAgIGNvbnN0IHZhbGlkYXRvck5hbWUgPSBrZXkuc3Vic3RyKFwidmFsaWRhdGVcIi5sZW5ndGgpLnRvTG93ZXJDYXNlKCk7XG4gICAgICBjb25zdCB2YWxpZGF0b3JQYXR0ZXJuID0gbmV3IFJlZ0V4cCh2YWx1ZSk7XG4gICAgICBjb25zdCB2YWxpZGF0b3JTZWxlY3RvciA9IGBbZGF0YS12YWxpZGF0b3I9XCIke3ZhbGlkYXRvck5hbWV9XCJdYDtcbiAgICAgIGNvbnN0IHZhbGlkYXRvckNoZWNrYm94ID0gY2hlY2tMaXN0LnF1ZXJ5U2VsZWN0b3IodmFsaWRhdG9yU2VsZWN0b3IpO1xuICAgICAgY29uc3QgdmFsaWRhdG9yUGFyZW50ID0gZWwucGFyZW50Tm9kZTtcbiAgICAgIGNvbnN0IHN0YXR1c1N1bW1hcnlDb250YWluZXIgPSB2YWxpZGF0b3JQYXJlbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICAgYFtkYXRhLXZhbGlkYXRpb24tc3RhdHVzXWBcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IGNoZWNrZWQgPSB2YWxpZGF0b3JQYXR0ZXJuLnRlc3QoZWwudmFsdWUpO1xuICAgICAgdmFsaWRhdG9yQ2hlY2tib3guY2xhc3NMaXN0LnRvZ2dsZShDSEVDS0VEX0NMQVNTLCBjaGVja2VkKTtcblxuICAgICAgaWYgKCF2YWxpZGF0b3JDaGVja2JveCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIHZhbGlkYXRvciBjaGVja2JveCBmb3VuZCBmb3I6IFwiJHt2YWxpZGF0b3JOYW1lfVwiYCk7XG4gICAgICB9XG5cbiAgICAgIC8vIENyZWF0ZSBzdGF0dXMgcmVwb3J0cyBmb3IgY2hlY2tsaXN0IGl0ZW1zXG4gICAgICBjb25zdCBzdGF0dXNDb21wbGV0ZSA9IGVsLmRhdGFzZXQudmFsaWRhdGlvbkNvbXBsZXRlIHx8IFwic3RhdHVzIGNvbXBsZXRlXCI7XG4gICAgICBjb25zdCBzdGF0dXNJbmNvbXBsZXRlID1cbiAgICAgICAgZWwuZGF0YXNldC52YWxpZGF0aW9uSW5jb21wbGV0ZSB8fCBcInN0YXR1cyBpbmNvbXBsZXRlXCI7XG4gICAgICBsZXQgY2hlY2tib3hDb250ZW50ID0gYCR7dmFsaWRhdG9yQ2hlY2tib3gudGV4dENvbnRlbnR9IGA7XG5cbiAgICAgIGlmICh2YWxpZGF0b3JDaGVja2JveC5jbGFzc0xpc3QuY29udGFpbnMoQ0hFQ0tFRF9DTEFTUykpIHtcbiAgICAgICAgY2hlY2tib3hDb250ZW50ICs9IHN0YXR1c0NvbXBsZXRlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2hlY2tib3hDb250ZW50ICs9IHN0YXR1c0luY29tcGxldGU7XG4gICAgICB9XG5cbiAgICAgIC8vIG1vdmUgc3RhdHVzIHVwZGF0ZXMgdG8gYXJpYS1sYWJlbCBvbiBjaGVja2xpc3QgaXRlbVxuICAgICAgdmFsaWRhdG9yQ2hlY2tib3guc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCBjaGVja2JveENvbnRlbnQpO1xuXG4gICAgICAvLyBDcmVhdGUgYSBzdW1tYXJ5IG9mIHN0YXR1cyBmb3IgYWxsIGNoZWNrbGlzdCBpdGVtc1xuICAgICAgc3RhdHVzU3VtbWFyeSArPSBgJHtjaGVja2JveENvbnRlbnR9LiBgO1xuXG4gICAgICAvLyBBZGQgc3VtbWFyeSB0byBzY3JlZW4gcmVhZGVyIHN1bW1hcnkgY29udGFpbmVyLCBhZnRlciBhIGRlbGF5XG4gICAgICBjb25zdCBzclVwZGF0ZVN0YXR1cyA9IGRlYm91bmNlKCgpID0+IHtcbiAgICAgICAgc3RhdHVzU3VtbWFyeUNvbnRhaW5lci50ZXh0Q29udGVudCA9IHN0YXR1c1N1bW1hcnk7XG4gICAgICB9LCAxMDAwKTtcblxuICAgICAgc3JVcGRhdGVTdGF0dXMoKTtcbiAgICB9XG4gIH0pO1xufTtcbiIsIi8qXG4gKiBjbGFzc0xpc3QuanM6IENyb3NzLWJyb3dzZXIgZnVsbCBlbGVtZW50LmNsYXNzTGlzdCBpbXBsZW1lbnRhdGlvbi5cbiAqIDIwMTQtMDctMjNcbiAqXG4gKiBCeSBFbGkgR3JleSwgaHR0cDovL2VsaWdyZXkuY29tXG4gKiBQdWJsaWMgRG9tYWluLlxuICogTk8gV0FSUkFOVFkgRVhQUkVTU0VEIE9SIElNUExJRUQuIFVTRSBBVCBZT1VSIE9XTiBSSVNLLlxuICovXG5cbi8qZ2xvYmFsIHNlbGYsIGRvY3VtZW50LCBET01FeGNlcHRpb24gKi9cblxuLyohIEBzb3VyY2UgaHR0cDovL3B1cmwuZWxpZ3JleS5jb20vZ2l0aHViL2NsYXNzTGlzdC5qcy9ibG9iL21hc3Rlci9jbGFzc0xpc3QuanMqL1xuXG4vKiBDb3BpZWQgZnJvbSBNRE46XG4gKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRWxlbWVudC9jbGFzc0xpc3RcbiAqL1xuXG5pZiAoXCJkb2N1bWVudFwiIGluIHdpbmRvdy5zZWxmKSB7XG5cbiAgLy8gRnVsbCBwb2x5ZmlsbCBmb3IgYnJvd3NlcnMgd2l0aCBubyBjbGFzc0xpc3Qgc3VwcG9ydFxuICAvLyBJbmNsdWRpbmcgSUUgPCBFZGdlIG1pc3NpbmcgU1ZHRWxlbWVudC5jbGFzc0xpc3RcbiAgaWYgKCEoXCJjbGFzc0xpc3RcIiBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiX1wiKSlcbiAgICB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMgJiYgIShcImNsYXNzTGlzdFwiIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsXCJnXCIpKSkge1xuXG4gIChmdW5jdGlvbiAodmlldykge1xuXG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICBpZiAoISgnRWxlbWVudCcgaW4gdmlldykpIHJldHVybjtcblxuICAgIHZhclxuICAgICAgICBjbGFzc0xpc3RQcm9wID0gXCJjbGFzc0xpc3RcIlxuICAgICAgLCBwcm90b1Byb3AgPSBcInByb3RvdHlwZVwiXG4gICAgICAsIGVsZW1DdHJQcm90byA9IHZpZXcuRWxlbWVudFtwcm90b1Byb3BdXG4gICAgICAsIG9iakN0ciA9IE9iamVjdFxuICAgICAgLCBzdHJUcmltID0gU3RyaW5nW3Byb3RvUHJvcF0udHJpbSB8fCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlcGxhY2UoL15cXHMrfFxccyskL2csIFwiXCIpO1xuICAgICAgfVxuICAgICAgLCBhcnJJbmRleE9mID0gQXJyYXlbcHJvdG9Qcm9wXS5pbmRleE9mIHx8IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgIHZhclxuICAgICAgICAgICAgaSA9IDBcbiAgICAgICAgICAsIGxlbiA9IHRoaXMubGVuZ3RoXG4gICAgICAgIDtcbiAgICAgICAgZm9yICg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgIGlmIChpIGluIHRoaXMgJiYgdGhpc1tpXSA9PT0gaXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAtMTtcbiAgICAgIH1cbiAgICAgIC8vIFZlbmRvcnM6IHBsZWFzZSBhbGxvdyBjb250ZW50IGNvZGUgdG8gaW5zdGFudGlhdGUgRE9NRXhjZXB0aW9uc1xuICAgICAgLCBET01FeCA9IGZ1bmN0aW9uICh0eXBlLCBtZXNzYWdlKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IHR5cGU7XG4gICAgICAgIHRoaXMuY29kZSA9IERPTUV4Y2VwdGlvblt0eXBlXTtcbiAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgIH1cbiAgICAgICwgY2hlY2tUb2tlbkFuZEdldEluZGV4ID0gZnVuY3Rpb24gKGNsYXNzTGlzdCwgdG9rZW4pIHtcbiAgICAgICAgaWYgKHRva2VuID09PSBcIlwiKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IERPTUV4KFxuICAgICAgICAgICAgICBcIlNZTlRBWF9FUlJcIlxuICAgICAgICAgICAgLCBcIkFuIGludmFsaWQgb3IgaWxsZWdhbCBzdHJpbmcgd2FzIHNwZWNpZmllZFwiXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoL1xccy8udGVzdCh0b2tlbikpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRE9NRXgoXG4gICAgICAgICAgICAgIFwiSU5WQUxJRF9DSEFSQUNURVJfRVJSXCJcbiAgICAgICAgICAgICwgXCJTdHJpbmcgY29udGFpbnMgYW4gaW52YWxpZCBjaGFyYWN0ZXJcIlxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFyckluZGV4T2YuY2FsbChjbGFzc0xpc3QsIHRva2VuKTtcbiAgICAgIH1cbiAgICAgICwgQ2xhc3NMaXN0ID0gZnVuY3Rpb24gKGVsZW0pIHtcbiAgICAgICAgdmFyXG4gICAgICAgICAgICB0cmltbWVkQ2xhc3NlcyA9IHN0clRyaW0uY2FsbChlbGVtLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpIHx8IFwiXCIpXG4gICAgICAgICAgLCBjbGFzc2VzID0gdHJpbW1lZENsYXNzZXMgPyB0cmltbWVkQ2xhc3Nlcy5zcGxpdCgvXFxzKy8pIDogW11cbiAgICAgICAgICAsIGkgPSAwXG4gICAgICAgICAgLCBsZW4gPSBjbGFzc2VzLmxlbmd0aFxuICAgICAgICA7XG4gICAgICAgIGZvciAoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICB0aGlzLnB1c2goY2xhc3Nlc1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fdXBkYXRlQ2xhc3NOYW1lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgdGhpcy50b1N0cmluZygpKTtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgICwgY2xhc3NMaXN0UHJvdG8gPSBDbGFzc0xpc3RbcHJvdG9Qcm9wXSA9IFtdXG4gICAgICAsIGNsYXNzTGlzdEdldHRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDbGFzc0xpc3QodGhpcyk7XG4gICAgICB9XG4gICAgO1xuICAgIC8vIE1vc3QgRE9NRXhjZXB0aW9uIGltcGxlbWVudGF0aW9ucyBkb24ndCBhbGxvdyBjYWxsaW5nIERPTUV4Y2VwdGlvbidzIHRvU3RyaW5nKClcbiAgICAvLyBvbiBub24tRE9NRXhjZXB0aW9ucy4gRXJyb3IncyB0b1N0cmluZygpIGlzIHN1ZmZpY2llbnQgaGVyZS5cbiAgICBET01FeFtwcm90b1Byb3BdID0gRXJyb3JbcHJvdG9Qcm9wXTtcbiAgICBjbGFzc0xpc3RQcm90by5pdGVtID0gZnVuY3Rpb24gKGkpIHtcbiAgICAgIHJldHVybiB0aGlzW2ldIHx8IG51bGw7XG4gICAgfTtcbiAgICBjbGFzc0xpc3RQcm90by5jb250YWlucyA9IGZ1bmN0aW9uICh0b2tlbikge1xuICAgICAgdG9rZW4gKz0gXCJcIjtcbiAgICAgIHJldHVybiBjaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4pICE9PSAtMTtcbiAgICB9O1xuICAgIGNsYXNzTGlzdFByb3RvLmFkZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhclxuICAgICAgICAgIHRva2VucyA9IGFyZ3VtZW50c1xuICAgICAgICAsIGkgPSAwXG4gICAgICAgICwgbCA9IHRva2Vucy5sZW5ndGhcbiAgICAgICAgLCB0b2tlblxuICAgICAgICAsIHVwZGF0ZWQgPSBmYWxzZVxuICAgICAgO1xuICAgICAgZG8ge1xuICAgICAgICB0b2tlbiA9IHRva2Vuc1tpXSArIFwiXCI7XG4gICAgICAgIGlmIChjaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4pID09PSAtMSkge1xuICAgICAgICAgIHRoaXMucHVzaCh0b2tlbik7XG4gICAgICAgICAgdXBkYXRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHdoaWxlICgrK2kgPCBsKTtcblxuICAgICAgaWYgKHVwZGF0ZWQpIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlQ2xhc3NOYW1lKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICBjbGFzc0xpc3RQcm90by5yZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXJcbiAgICAgICAgICB0b2tlbnMgPSBhcmd1bWVudHNcbiAgICAgICAgLCBpID0gMFxuICAgICAgICAsIGwgPSB0b2tlbnMubGVuZ3RoXG4gICAgICAgICwgdG9rZW5cbiAgICAgICAgLCB1cGRhdGVkID0gZmFsc2VcbiAgICAgICAgLCBpbmRleFxuICAgICAgO1xuICAgICAgZG8ge1xuICAgICAgICB0b2tlbiA9IHRva2Vuc1tpXSArIFwiXCI7XG4gICAgICAgIGluZGV4ID0gY2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuKTtcbiAgICAgICAgd2hpbGUgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgIHRoaXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICB1cGRhdGVkID0gdHJ1ZTtcbiAgICAgICAgICBpbmRleCA9IGNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHdoaWxlICgrK2kgPCBsKTtcblxuICAgICAgaWYgKHVwZGF0ZWQpIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlQ2xhc3NOYW1lKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICBjbGFzc0xpc3RQcm90by50b2dnbGUgPSBmdW5jdGlvbiAodG9rZW4sIGZvcmNlKSB7XG4gICAgICB0b2tlbiArPSBcIlwiO1xuXG4gICAgICB2YXJcbiAgICAgICAgICByZXN1bHQgPSB0aGlzLmNvbnRhaW5zKHRva2VuKVxuICAgICAgICAsIG1ldGhvZCA9IHJlc3VsdCA/XG4gICAgICAgICAgZm9yY2UgIT09IHRydWUgJiYgXCJyZW1vdmVcIlxuICAgICAgICA6XG4gICAgICAgICAgZm9yY2UgIT09IGZhbHNlICYmIFwiYWRkXCJcbiAgICAgIDtcblxuICAgICAgaWYgKG1ldGhvZCkge1xuICAgICAgICB0aGlzW21ldGhvZF0odG9rZW4pO1xuICAgICAgfVxuXG4gICAgICBpZiAoZm9yY2UgPT09IHRydWUgfHwgZm9yY2UgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiBmb3JjZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAhcmVzdWx0O1xuICAgICAgfVxuICAgIH07XG4gICAgY2xhc3NMaXN0UHJvdG8udG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gdGhpcy5qb2luKFwiIFwiKTtcbiAgICB9O1xuXG4gICAgaWYgKG9iakN0ci5kZWZpbmVQcm9wZXJ0eSkge1xuICAgICAgdmFyIGNsYXNzTGlzdFByb3BEZXNjID0ge1xuICAgICAgICAgIGdldDogY2xhc3NMaXN0R2V0dGVyXG4gICAgICAgICwgZW51bWVyYWJsZTogdHJ1ZVxuICAgICAgICAsIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfTtcbiAgICAgIHRyeSB7XG4gICAgICAgIG9iakN0ci5kZWZpbmVQcm9wZXJ0eShlbGVtQ3RyUHJvdG8sIGNsYXNzTGlzdFByb3AsIGNsYXNzTGlzdFByb3BEZXNjKTtcbiAgICAgIH0gY2F0Y2ggKGV4KSB7IC8vIElFIDggZG9lc24ndCBzdXBwb3J0IGVudW1lcmFibGU6dHJ1ZVxuICAgICAgICBpZiAoZXgubnVtYmVyID09PSAtMHg3RkY1RUM1NCkge1xuICAgICAgICAgIGNsYXNzTGlzdFByb3BEZXNjLmVudW1lcmFibGUgPSBmYWxzZTtcbiAgICAgICAgICBvYmpDdHIuZGVmaW5lUHJvcGVydHkoZWxlbUN0clByb3RvLCBjbGFzc0xpc3RQcm9wLCBjbGFzc0xpc3RQcm9wRGVzYyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG9iakN0cltwcm90b1Byb3BdLl9fZGVmaW5lR2V0dGVyX18pIHtcbiAgICAgIGVsZW1DdHJQcm90by5fX2RlZmluZUdldHRlcl9fKGNsYXNzTGlzdFByb3AsIGNsYXNzTGlzdEdldHRlcik7XG4gICAgfVxuXG4gICAgfSh3aW5kb3cuc2VsZikpO1xuXG4gICAgfSBlbHNlIHtcbiAgICAvLyBUaGVyZSBpcyBmdWxsIG9yIHBhcnRpYWwgbmF0aXZlIGNsYXNzTGlzdCBzdXBwb3J0LCBzbyBqdXN0IGNoZWNrIGlmIHdlIG5lZWRcbiAgICAvLyB0byBub3JtYWxpemUgdGhlIGFkZC9yZW1vdmUgYW5kIHRvZ2dsZSBBUElzLlxuXG4gICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgICB2YXIgdGVzdEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiX1wiKTtcblxuICAgICAgdGVzdEVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImMxXCIsIFwiYzJcIik7XG5cbiAgICAgIC8vIFBvbHlmaWxsIGZvciBJRSAxMC8xMSBhbmQgRmlyZWZveCA8MjYsIHdoZXJlIGNsYXNzTGlzdC5hZGQgYW5kXG4gICAgICAvLyBjbGFzc0xpc3QucmVtb3ZlIGV4aXN0IGJ1dCBzdXBwb3J0IG9ubHkgb25lIGFyZ3VtZW50IGF0IGEgdGltZS5cbiAgICAgIGlmICghdGVzdEVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiYzJcIikpIHtcbiAgICAgICAgdmFyIGNyZWF0ZU1ldGhvZCA9IGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgICAgICAgIHZhciBvcmlnaW5hbCA9IERPTVRva2VuTGlzdC5wcm90b3R5cGVbbWV0aG9kXTtcblxuICAgICAgICAgIERPTVRva2VuTGlzdC5wcm90b3R5cGVbbWV0aG9kXSA9IGZ1bmN0aW9uKHRva2VuKSB7XG4gICAgICAgICAgICB2YXIgaSwgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcblxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgIHRva2VuID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgICBvcmlnaW5hbC5jYWxsKHRoaXMsIHRva2VuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgICAgICBjcmVhdGVNZXRob2QoJ2FkZCcpO1xuICAgICAgICBjcmVhdGVNZXRob2QoJ3JlbW92ZScpO1xuICAgICAgfVxuXG4gICAgICB0ZXN0RWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKFwiYzNcIiwgZmFsc2UpO1xuXG4gICAgICAvLyBQb2x5ZmlsbCBmb3IgSUUgMTAgYW5kIEZpcmVmb3ggPDI0LCB3aGVyZSBjbGFzc0xpc3QudG9nZ2xlIGRvZXMgbm90XG4gICAgICAvLyBzdXBwb3J0IHRoZSBzZWNvbmQgYXJndW1lbnQuXG4gICAgICBpZiAodGVzdEVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiYzNcIikpIHtcbiAgICAgICAgdmFyIF90b2dnbGUgPSBET01Ub2tlbkxpc3QucHJvdG90eXBlLnRvZ2dsZTtcblxuICAgICAgICBET01Ub2tlbkxpc3QucHJvdG90eXBlLnRvZ2dsZSA9IGZ1bmN0aW9uKHRva2VuLCBmb3JjZSkge1xuICAgICAgICAgIGlmICgxIGluIGFyZ3VtZW50cyAmJiAhdGhpcy5jb250YWlucyh0b2tlbikgPT09ICFmb3JjZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZvcmNlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gX3RvZ2dsZS5jYWxsKHRoaXMsIHRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgIH1cblxuICAgICAgdGVzdEVsZW1lbnQgPSBudWxsO1xuICAgIH0oKSk7XG4gIH1cbn1cbiIsIi8vIGVsZW1lbnQtY2xvc2VzdCB8IENDMC0xLjAgfCBnaXRodWIuY29tL2pvbmF0aGFudG5lYWwvY2xvc2VzdFxuXG4oZnVuY3Rpb24gKEVsZW1lbnRQcm90bykge1xuXHRpZiAodHlwZW9mIEVsZW1lbnRQcm90by5tYXRjaGVzICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0RWxlbWVudFByb3RvLm1hdGNoZXMgPSBFbGVtZW50UHJvdG8ubXNNYXRjaGVzU2VsZWN0b3IgfHwgRWxlbWVudFByb3RvLm1vek1hdGNoZXNTZWxlY3RvciB8fCBFbGVtZW50UHJvdG8ud2Via2l0TWF0Y2hlc1NlbGVjdG9yIHx8IGZ1bmN0aW9uIG1hdGNoZXMoc2VsZWN0b3IpIHtcblx0XHRcdHZhciBlbGVtZW50ID0gdGhpcztcblx0XHRcdHZhciBlbGVtZW50cyA9IChlbGVtZW50LmRvY3VtZW50IHx8IGVsZW1lbnQub3duZXJEb2N1bWVudCkucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG5cdFx0XHR2YXIgaW5kZXggPSAwO1xuXG5cdFx0XHR3aGlsZSAoZWxlbWVudHNbaW5kZXhdICYmIGVsZW1lbnRzW2luZGV4XSAhPT0gZWxlbWVudCkge1xuXHRcdFx0XHQrK2luZGV4O1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gQm9vbGVhbihlbGVtZW50c1tpbmRleF0pO1xuXHRcdH07XG5cdH1cblxuXHRpZiAodHlwZW9mIEVsZW1lbnRQcm90by5jbG9zZXN0ICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0RWxlbWVudFByb3RvLmNsb3Nlc3QgPSBmdW5jdGlvbiBjbG9zZXN0KHNlbGVjdG9yKSB7XG5cdFx0XHR2YXIgZWxlbWVudCA9IHRoaXM7XG5cblx0XHRcdHdoaWxlIChlbGVtZW50ICYmIGVsZW1lbnQubm9kZVR5cGUgPT09IDEpIHtcblx0XHRcdFx0aWYgKGVsZW1lbnQubWF0Y2hlcyhzZWxlY3RvcikpIHtcblx0XHRcdFx0XHRyZXR1cm4gZWxlbWVudDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudE5vZGU7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH07XG5cdH1cbn0pKHdpbmRvdy5FbGVtZW50LnByb3RvdHlwZSk7XG4iLCIvKiBnbG9iYWwgZGVmaW5lLCBLZXlib2FyZEV2ZW50LCBtb2R1bGUgKi9cblxuKGZ1bmN0aW9uICgpIHtcblxuICB2YXIga2V5Ym9hcmRldmVudEtleVBvbHlmaWxsID0ge1xuICAgIHBvbHlmaWxsOiBwb2x5ZmlsbCxcbiAgICBrZXlzOiB7XG4gICAgICAzOiAnQ2FuY2VsJyxcbiAgICAgIDY6ICdIZWxwJyxcbiAgICAgIDg6ICdCYWNrc3BhY2UnLFxuICAgICAgOTogJ1RhYicsXG4gICAgICAxMjogJ0NsZWFyJyxcbiAgICAgIDEzOiAnRW50ZXInLFxuICAgICAgMTY6ICdTaGlmdCcsXG4gICAgICAxNzogJ0NvbnRyb2wnLFxuICAgICAgMTg6ICdBbHQnLFxuICAgICAgMTk6ICdQYXVzZScsXG4gICAgICAyMDogJ0NhcHNMb2NrJyxcbiAgICAgIDI3OiAnRXNjYXBlJyxcbiAgICAgIDI4OiAnQ29udmVydCcsXG4gICAgICAyOTogJ05vbkNvbnZlcnQnLFxuICAgICAgMzA6ICdBY2NlcHQnLFxuICAgICAgMzE6ICdNb2RlQ2hhbmdlJyxcbiAgICAgIDMyOiAnICcsXG4gICAgICAzMzogJ1BhZ2VVcCcsXG4gICAgICAzNDogJ1BhZ2VEb3duJyxcbiAgICAgIDM1OiAnRW5kJyxcbiAgICAgIDM2OiAnSG9tZScsXG4gICAgICAzNzogJ0Fycm93TGVmdCcsXG4gICAgICAzODogJ0Fycm93VXAnLFxuICAgICAgMzk6ICdBcnJvd1JpZ2h0JyxcbiAgICAgIDQwOiAnQXJyb3dEb3duJyxcbiAgICAgIDQxOiAnU2VsZWN0JyxcbiAgICAgIDQyOiAnUHJpbnQnLFxuICAgICAgNDM6ICdFeGVjdXRlJyxcbiAgICAgIDQ0OiAnUHJpbnRTY3JlZW4nLFxuICAgICAgNDU6ICdJbnNlcnQnLFxuICAgICAgNDY6ICdEZWxldGUnLFxuICAgICAgNDg6IFsnMCcsICcpJ10sXG4gICAgICA0OTogWycxJywgJyEnXSxcbiAgICAgIDUwOiBbJzInLCAnQCddLFxuICAgICAgNTE6IFsnMycsICcjJ10sXG4gICAgICA1MjogWyc0JywgJyQnXSxcbiAgICAgIDUzOiBbJzUnLCAnJSddLFxuICAgICAgNTQ6IFsnNicsICdeJ10sXG4gICAgICA1NTogWyc3JywgJyYnXSxcbiAgICAgIDU2OiBbJzgnLCAnKiddLFxuICAgICAgNTc6IFsnOScsICcoJ10sXG4gICAgICA5MTogJ09TJyxcbiAgICAgIDkzOiAnQ29udGV4dE1lbnUnLFxuICAgICAgMTQ0OiAnTnVtTG9jaycsXG4gICAgICAxNDU6ICdTY3JvbGxMb2NrJyxcbiAgICAgIDE4MTogJ1ZvbHVtZU11dGUnLFxuICAgICAgMTgyOiAnVm9sdW1lRG93bicsXG4gICAgICAxODM6ICdWb2x1bWVVcCcsXG4gICAgICAxODY6IFsnOycsICc6J10sXG4gICAgICAxODc6IFsnPScsICcrJ10sXG4gICAgICAxODg6IFsnLCcsICc8J10sXG4gICAgICAxODk6IFsnLScsICdfJ10sXG4gICAgICAxOTA6IFsnLicsICc+J10sXG4gICAgICAxOTE6IFsnLycsICc/J10sXG4gICAgICAxOTI6IFsnYCcsICd+J10sXG4gICAgICAyMTk6IFsnWycsICd7J10sXG4gICAgICAyMjA6IFsnXFxcXCcsICd8J10sXG4gICAgICAyMjE6IFsnXScsICd9J10sXG4gICAgICAyMjI6IFtcIidcIiwgJ1wiJ10sXG4gICAgICAyMjQ6ICdNZXRhJyxcbiAgICAgIDIyNTogJ0FsdEdyYXBoJyxcbiAgICAgIDI0NjogJ0F0dG4nLFxuICAgICAgMjQ3OiAnQ3JTZWwnLFxuICAgICAgMjQ4OiAnRXhTZWwnLFxuICAgICAgMjQ5OiAnRXJhc2VFb2YnLFxuICAgICAgMjUwOiAnUGxheScsXG4gICAgICAyNTE6ICdab29tT3V0J1xuICAgIH1cbiAgfTtcblxuICAvLyBGdW5jdGlvbiBrZXlzIChGMS0yNCkuXG4gIHZhciBpO1xuICBmb3IgKGkgPSAxOyBpIDwgMjU7IGkrKykge1xuICAgIGtleWJvYXJkZXZlbnRLZXlQb2x5ZmlsbC5rZXlzWzExMSArIGldID0gJ0YnICsgaTtcbiAgfVxuXG4gIC8vIFByaW50YWJsZSBBU0NJSSBjaGFyYWN0ZXJzLlxuICB2YXIgbGV0dGVyID0gJyc7XG4gIGZvciAoaSA9IDY1OyBpIDwgOTE7IGkrKykge1xuICAgIGxldHRlciA9IFN0cmluZy5mcm9tQ2hhckNvZGUoaSk7XG4gICAga2V5Ym9hcmRldmVudEtleVBvbHlmaWxsLmtleXNbaV0gPSBbbGV0dGVyLnRvTG93ZXJDYXNlKCksIGxldHRlci50b1VwcGVyQ2FzZSgpXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBvbHlmaWxsICgpIHtcbiAgICBpZiAoISgnS2V5Ym9hcmRFdmVudCcgaW4gd2luZG93KSB8fFxuICAgICAgICAna2V5JyBpbiBLZXlib2FyZEV2ZW50LnByb3RvdHlwZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIFBvbHlmaWxsIGBrZXlgIG9uIGBLZXlib2FyZEV2ZW50YC5cbiAgICB2YXIgcHJvdG8gPSB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHZhciBrZXkgPSBrZXlib2FyZGV2ZW50S2V5UG9seWZpbGwua2V5c1t0aGlzLndoaWNoIHx8IHRoaXMua2V5Q29kZV07XG5cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoa2V5KSkge1xuICAgICAgICAgIGtleSA9IGtleVsrdGhpcy5zaGlmdEtleV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ga2V5O1xuICAgICAgfVxuICAgIH07XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEtleWJvYXJkRXZlbnQucHJvdG90eXBlLCAna2V5JywgcHJvdG8pO1xuICAgIHJldHVybiBwcm90bztcbiAgfVxuXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoJ2tleWJvYXJkZXZlbnQta2V5LXBvbHlmaWxsJywga2V5Ym9hcmRldmVudEtleVBvbHlmaWxsKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGtleWJvYXJkZXZlbnRLZXlQb2x5ZmlsbDtcbiAgfSBlbHNlIGlmICh3aW5kb3cpIHtcbiAgICB3aW5kb3cua2V5Ym9hcmRldmVudEtleVBvbHlmaWxsID0ga2V5Ym9hcmRldmVudEtleVBvbHlmaWxsO1xuICB9XG5cbn0pKCk7XG4iLCIvKlxub2JqZWN0LWFzc2lnblxuKGMpIFNpbmRyZSBTb3JodXNcbkBsaWNlbnNlIE1JVFxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuLyogZXNsaW50LWRpc2FibGUgbm8tdW51c2VkLXZhcnMgKi9cbnZhciBnZXRPd25Qcm9wZXJ0eVN5bWJvbHMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzO1xudmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciBwcm9wSXNFbnVtZXJhYmxlID0gT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZTtcblxuZnVuY3Rpb24gdG9PYmplY3QodmFsKSB7XG5cdGlmICh2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQpIHtcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdPYmplY3QuYXNzaWduIGNhbm5vdCBiZSBjYWxsZWQgd2l0aCBudWxsIG9yIHVuZGVmaW5lZCcpO1xuXHR9XG5cblx0cmV0dXJuIE9iamVjdCh2YWwpO1xufVxuXG5mdW5jdGlvbiBzaG91bGRVc2VOYXRpdmUoKSB7XG5cdHRyeSB7XG5cdFx0aWYgKCFPYmplY3QuYXNzaWduKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gRGV0ZWN0IGJ1Z2d5IHByb3BlcnR5IGVudW1lcmF0aW9uIG9yZGVyIGluIG9sZGVyIFY4IHZlcnNpb25zLlxuXG5cdFx0Ly8gaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9NDExOFxuXHRcdHZhciB0ZXN0MSA9IG5ldyBTdHJpbmcoJ2FiYycpOyAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1uZXctd3JhcHBlcnNcblx0XHR0ZXN0MVs1XSA9ICdkZSc7XG5cdFx0aWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRlc3QxKVswXSA9PT0gJzUnKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9MzA1NlxuXHRcdHZhciB0ZXN0MiA9IHt9O1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgMTA7IGkrKykge1xuXHRcdFx0dGVzdDJbJ18nICsgU3RyaW5nLmZyb21DaGFyQ29kZShpKV0gPSBpO1xuXHRcdH1cblx0XHR2YXIgb3JkZXIyID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGVzdDIpLm1hcChmdW5jdGlvbiAobikge1xuXHRcdFx0cmV0dXJuIHRlc3QyW25dO1xuXHRcdH0pO1xuXHRcdGlmIChvcmRlcjIuam9pbignJykgIT09ICcwMTIzNDU2Nzg5Jykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIGh0dHBzOi8vYnVncy5jaHJvbWl1bS5vcmcvcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTMwNTZcblx0XHR2YXIgdGVzdDMgPSB7fTtcblx0XHQnYWJjZGVmZ2hpamtsbW5vcHFyc3QnLnNwbGl0KCcnKS5mb3JFYWNoKGZ1bmN0aW9uIChsZXR0ZXIpIHtcblx0XHRcdHRlc3QzW2xldHRlcl0gPSBsZXR0ZXI7XG5cdFx0fSk7XG5cdFx0aWYgKE9iamVjdC5rZXlzKE9iamVjdC5hc3NpZ24oe30sIHRlc3QzKSkuam9pbignJykgIT09XG5cdFx0XHRcdCdhYmNkZWZnaGlqa2xtbm9wcXJzdCcpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0Ly8gV2UgZG9uJ3QgZXhwZWN0IGFueSBvZiB0aGUgYWJvdmUgdG8gdGhyb3csIGJ1dCBiZXR0ZXIgdG8gYmUgc2FmZS5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzaG91bGRVc2VOYXRpdmUoKSA/IE9iamVjdC5hc3NpZ24gOiBmdW5jdGlvbiAodGFyZ2V0LCBzb3VyY2UpIHtcblx0dmFyIGZyb207XG5cdHZhciB0byA9IHRvT2JqZWN0KHRhcmdldCk7XG5cdHZhciBzeW1ib2xzO1xuXG5cdGZvciAodmFyIHMgPSAxOyBzIDwgYXJndW1lbnRzLmxlbmd0aDsgcysrKSB7XG5cdFx0ZnJvbSA9IE9iamVjdChhcmd1bWVudHNbc10pO1xuXG5cdFx0Zm9yICh2YXIga2V5IGluIGZyb20pIHtcblx0XHRcdGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKGZyb20sIGtleSkpIHtcblx0XHRcdFx0dG9ba2V5XSA9IGZyb21ba2V5XTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoZ2V0T3duUHJvcGVydHlTeW1ib2xzKSB7XG5cdFx0XHRzeW1ib2xzID0gZ2V0T3duUHJvcGVydHlTeW1ib2xzKGZyb20pO1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBzeW1ib2xzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmIChwcm9wSXNFbnVtZXJhYmxlLmNhbGwoZnJvbSwgc3ltYm9sc1tpXSkpIHtcblx0XHRcdFx0XHR0b1tzeW1ib2xzW2ldXSA9IGZyb21bc3ltYm9sc1tpXV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdG87XG59O1xuIiwiY29uc3QgYXNzaWduID0gcmVxdWlyZSgnb2JqZWN0LWFzc2lnbicpO1xuY29uc3QgZGVsZWdhdGUgPSByZXF1aXJlKCcuLi9kZWxlZ2F0ZScpO1xuY29uc3QgZGVsZWdhdGVBbGwgPSByZXF1aXJlKCcuLi9kZWxlZ2F0ZUFsbCcpO1xuXG5jb25zdCBERUxFR0FURV9QQVRURVJOID0gL14oLispOmRlbGVnYXRlXFwoKC4rKVxcKSQvO1xuY29uc3QgU1BBQ0UgPSAnICc7XG5cbmNvbnN0IGdldExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUsIGhhbmRsZXIpIHtcbiAgdmFyIG1hdGNoID0gdHlwZS5tYXRjaChERUxFR0FURV9QQVRURVJOKTtcbiAgdmFyIHNlbGVjdG9yO1xuICBpZiAobWF0Y2gpIHtcbiAgICB0eXBlID0gbWF0Y2hbMV07XG4gICAgc2VsZWN0b3IgPSBtYXRjaFsyXTtcbiAgfVxuXG4gIHZhciBvcHRpb25zO1xuICBpZiAodHlwZW9mIGhhbmRsZXIgPT09ICdvYmplY3QnKSB7XG4gICAgb3B0aW9ucyA9IHtcbiAgICAgIGNhcHR1cmU6IHBvcEtleShoYW5kbGVyLCAnY2FwdHVyZScpLFxuICAgICAgcGFzc2l2ZTogcG9wS2V5KGhhbmRsZXIsICdwYXNzaXZlJylcbiAgICB9O1xuICB9XG5cbiAgdmFyIGxpc3RlbmVyID0ge1xuICAgIHNlbGVjdG9yOiBzZWxlY3RvcixcbiAgICBkZWxlZ2F0ZTogKHR5cGVvZiBoYW5kbGVyID09PSAnb2JqZWN0JylcbiAgICAgID8gZGVsZWdhdGVBbGwoaGFuZGxlcilcbiAgICAgIDogc2VsZWN0b3JcbiAgICAgICAgPyBkZWxlZ2F0ZShzZWxlY3RvciwgaGFuZGxlcilcbiAgICAgICAgOiBoYW5kbGVyLFxuICAgIG9wdGlvbnM6IG9wdGlvbnNcbiAgfTtcblxuICBpZiAodHlwZS5pbmRleE9mKFNQQUNFKSA+IC0xKSB7XG4gICAgcmV0dXJuIHR5cGUuc3BsaXQoU1BBQ0UpLm1hcChmdW5jdGlvbihfdHlwZSkge1xuICAgICAgcmV0dXJuIGFzc2lnbih7dHlwZTogX3R5cGV9LCBsaXN0ZW5lcik7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgbGlzdGVuZXIudHlwZSA9IHR5cGU7XG4gICAgcmV0dXJuIFtsaXN0ZW5lcl07XG4gIH1cbn07XG5cbnZhciBwb3BLZXkgPSBmdW5jdGlvbihvYmosIGtleSkge1xuICB2YXIgdmFsdWUgPSBvYmpba2V5XTtcbiAgZGVsZXRlIG9ialtrZXldO1xuICByZXR1cm4gdmFsdWU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJlaGF2aW9yKGV2ZW50cywgcHJvcHMpIHtcbiAgY29uc3QgbGlzdGVuZXJzID0gT2JqZWN0LmtleXMoZXZlbnRzKVxuICAgIC5yZWR1Y2UoZnVuY3Rpb24obWVtbywgdHlwZSkge1xuICAgICAgdmFyIGxpc3RlbmVycyA9IGdldExpc3RlbmVycyh0eXBlLCBldmVudHNbdHlwZV0pO1xuICAgICAgcmV0dXJuIG1lbW8uY29uY2F0KGxpc3RlbmVycyk7XG4gICAgfSwgW10pO1xuXG4gIHJldHVybiBhc3NpZ24oe1xuICAgIGFkZDogZnVuY3Rpb24gYWRkQmVoYXZpb3IoZWxlbWVudCkge1xuICAgICAgbGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obGlzdGVuZXIpIHtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICAgIGxpc3RlbmVyLnR5cGUsXG4gICAgICAgICAgbGlzdGVuZXIuZGVsZWdhdGUsXG4gICAgICAgICAgbGlzdGVuZXIub3B0aW9uc1xuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICByZW1vdmU6IGZ1bmN0aW9uIHJlbW92ZUJlaGF2aW9yKGVsZW1lbnQpIHtcbiAgICAgIGxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGxpc3RlbmVyKSB7XG4gICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgICBsaXN0ZW5lci50eXBlLFxuICAgICAgICAgIGxpc3RlbmVyLmRlbGVnYXRlLFxuICAgICAgICAgIGxpc3RlbmVyLm9wdGlvbnNcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwgcHJvcHMpO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY29tcG9zZShmdW5jdGlvbnMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb25zLnNvbWUoZnVuY3Rpb24oZm4pIHtcbiAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGUpID09PSBmYWxzZTtcbiAgICB9LCB0aGlzKTtcbiAgfTtcbn07XG4iLCIvLyBwb2x5ZmlsbCBFbGVtZW50LnByb3RvdHlwZS5jbG9zZXN0XG5yZXF1aXJlKCdlbGVtZW50LWNsb3Nlc3QnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkZWxlZ2F0ZShzZWxlY3RvciwgZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGRlbGVnYXRpb24oZXZlbnQpIHtcbiAgICB2YXIgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0LmNsb3Nlc3Qoc2VsZWN0b3IpO1xuICAgIGlmICh0YXJnZXQpIHtcbiAgICAgIHJldHVybiBmbi5jYWxsKHRhcmdldCwgZXZlbnQpO1xuICAgIH1cbiAgfVxufTtcbiIsImNvbnN0IGRlbGVnYXRlID0gcmVxdWlyZSgnLi4vZGVsZWdhdGUnKTtcbmNvbnN0IGNvbXBvc2UgPSByZXF1aXJlKCcuLi9jb21wb3NlJyk7XG5cbmNvbnN0IFNQTEFUID0gJyonO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlbGVnYXRlQWxsKHNlbGVjdG9ycykge1xuICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoc2VsZWN0b3JzKVxuXG4gIC8vIFhYWCBvcHRpbWl6YXRpb246IGlmIHRoZXJlIGlzIG9ubHkgb25lIGhhbmRsZXIgYW5kIGl0IGFwcGxpZXMgdG9cbiAgLy8gYWxsIGVsZW1lbnRzICh0aGUgXCIqXCIgQ1NTIHNlbGVjdG9yKSwgdGhlbiBqdXN0IHJldHVybiB0aGF0XG4gIC8vIGhhbmRsZXJcbiAgaWYgKGtleXMubGVuZ3RoID09PSAxICYmIGtleXNbMF0gPT09IFNQTEFUKSB7XG4gICAgcmV0dXJuIHNlbGVjdG9yc1tTUExBVF07XG4gIH1cblxuICBjb25zdCBkZWxlZ2F0ZXMgPSBrZXlzLnJlZHVjZShmdW5jdGlvbihtZW1vLCBzZWxlY3Rvcikge1xuICAgIG1lbW8ucHVzaChkZWxlZ2F0ZShzZWxlY3Rvciwgc2VsZWN0b3JzW3NlbGVjdG9yXSkpO1xuICAgIHJldHVybiBtZW1vO1xuICB9LCBbXSk7XG4gIHJldHVybiBjb21wb3NlKGRlbGVnYXRlcyk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpZ25vcmUoZWxlbWVudCwgZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGlnbm9yYW5jZShlKSB7XG4gICAgaWYgKGVsZW1lbnQgIT09IGUudGFyZ2V0ICYmICFlbGVtZW50LmNvbnRhaW5zKGUudGFyZ2V0KSkge1xuICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgZSk7XG4gICAgfVxuICB9O1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBiZWhhdmlvcjogICAgIHJlcXVpcmUoJy4vYmVoYXZpb3InKSxcbiAgZGVsZWdhdGU6ICAgICByZXF1aXJlKCcuL2RlbGVnYXRlJyksXG4gIGRlbGVnYXRlQWxsOiAgcmVxdWlyZSgnLi9kZWxlZ2F0ZUFsbCcpLFxuICBpZ25vcmU6ICAgICAgIHJlcXVpcmUoJy4vaWdub3JlJyksXG4gIGtleW1hcDogICAgICAgcmVxdWlyZSgnLi9rZXltYXAnKSxcbn07XG4iLCJyZXF1aXJlKCdrZXlib2FyZGV2ZW50LWtleS1wb2x5ZmlsbCcpO1xuXG4vLyB0aGVzZSBhcmUgdGhlIG9ubHkgcmVsZXZhbnQgbW9kaWZpZXJzIHN1cHBvcnRlZCBvbiBhbGwgcGxhdGZvcm1zLFxuLy8gYWNjb3JkaW5nIHRvIE1ETjpcbi8vIDxodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvS2V5Ym9hcmRFdmVudC9nZXRNb2RpZmllclN0YXRlPlxuY29uc3QgTU9ESUZJRVJTID0ge1xuICAnQWx0JzogICAgICAnYWx0S2V5JyxcbiAgJ0NvbnRyb2wnOiAgJ2N0cmxLZXknLFxuICAnQ3RybCc6ICAgICAnY3RybEtleScsXG4gICdTaGlmdCc6ICAgICdzaGlmdEtleSdcbn07XG5cbmNvbnN0IE1PRElGSUVSX1NFUEFSQVRPUiA9ICcrJztcblxuY29uc3QgZ2V0RXZlbnRLZXkgPSBmdW5jdGlvbihldmVudCwgaGFzTW9kaWZpZXJzKSB7XG4gIHZhciBrZXkgPSBldmVudC5rZXk7XG4gIGlmIChoYXNNb2RpZmllcnMpIHtcbiAgICBmb3IgKHZhciBtb2RpZmllciBpbiBNT0RJRklFUlMpIHtcbiAgICAgIGlmIChldmVudFtNT0RJRklFUlNbbW9kaWZpZXJdXSA9PT0gdHJ1ZSkge1xuICAgICAgICBrZXkgPSBbbW9kaWZpZXIsIGtleV0uam9pbihNT0RJRklFUl9TRVBBUkFUT1IpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4ga2V5O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBrZXltYXAoa2V5cykge1xuICBjb25zdCBoYXNNb2RpZmllcnMgPSBPYmplY3Qua2V5cyhrZXlzKS5zb21lKGZ1bmN0aW9uKGtleSkge1xuICAgIHJldHVybiBrZXkuaW5kZXhPZihNT0RJRklFUl9TRVBBUkFUT1IpID4gLTE7XG4gIH0pO1xuICByZXR1cm4gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICB2YXIga2V5ID0gZ2V0RXZlbnRLZXkoZXZlbnQsIGhhc01vZGlmaWVycyk7XG4gICAgcmV0dXJuIFtrZXksIGtleS50b0xvd2VyQ2FzZSgpXVxuICAgICAgLnJlZHVjZShmdW5jdGlvbihyZXN1bHQsIF9rZXkpIHtcbiAgICAgICAgaWYgKF9rZXkgaW4ga2V5cykge1xuICAgICAgICAgIHJlc3VsdCA9IGtleXNba2V5XS5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSwgdW5kZWZpbmVkKTtcbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzLk1PRElGSUVSUyA9IE1PRElGSUVSUztcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gb25jZShsaXN0ZW5lciwgb3B0aW9ucykge1xuICB2YXIgd3JhcHBlZCA9IGZ1bmN0aW9uIHdyYXBwZWRPbmNlKGUpIHtcbiAgICBlLmN1cnJlbnRUYXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcihlLnR5cGUsIHdyYXBwZWQsIG9wdGlvbnMpO1xuICAgIHJldHVybiBsaXN0ZW5lci5jYWxsKHRoaXMsIGUpO1xuICB9O1xuICByZXR1cm4gd3JhcHBlZDtcbn07XG5cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFJFX1RSSU0gPSAvKF5cXHMrKXwoXFxzKyQpL2c7XG52YXIgUkVfU1BMSVQgPSAvXFxzKy87XG5cbnZhciB0cmltID0gU3RyaW5nLnByb3RvdHlwZS50cmltXG4gID8gZnVuY3Rpb24oc3RyKSB7IHJldHVybiBzdHIudHJpbSgpOyB9XG4gIDogZnVuY3Rpb24oc3RyKSB7IHJldHVybiBzdHIucmVwbGFjZShSRV9UUklNLCAnJyk7IH07XG5cbnZhciBxdWVyeUJ5SWQgPSBmdW5jdGlvbihpZCkge1xuICByZXR1cm4gdGhpcy5xdWVyeVNlbGVjdG9yKCdbaWQ9XCInICsgaWQucmVwbGFjZSgvXCIvZywgJ1xcXFxcIicpICsgJ1wiXScpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiByZXNvbHZlSWRzKGlkcywgZG9jKSB7XG4gIGlmICh0eXBlb2YgaWRzICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBFcnJvcignRXhwZWN0ZWQgYSBzdHJpbmcgYnV0IGdvdCAnICsgKHR5cGVvZiBpZHMpKTtcbiAgfVxuXG4gIGlmICghZG9jKSB7XG4gICAgZG9jID0gd2luZG93LmRvY3VtZW50O1xuICB9XG5cbiAgdmFyIGdldEVsZW1lbnRCeUlkID0gZG9jLmdldEVsZW1lbnRCeUlkXG4gICAgPyBkb2MuZ2V0RWxlbWVudEJ5SWQuYmluZChkb2MpXG4gICAgOiBxdWVyeUJ5SWQuYmluZChkb2MpO1xuXG4gIGlkcyA9IHRyaW0oaWRzKS5zcGxpdChSRV9TUExJVCk7XG5cbiAgLy8gWFhYIHdlIGNhbiBzaG9ydC1jaXJjdWl0IGhlcmUgYmVjYXVzZSB0cmltbWluZyBhbmQgc3BsaXR0aW5nIGFcbiAgLy8gc3RyaW5nIG9mIGp1c3Qgd2hpdGVzcGFjZSBwcm9kdWNlcyBhbiBhcnJheSBjb250YWluaW5nIGEgc2luZ2xlLFxuICAvLyBlbXB0eSBzdHJpbmdcbiAgaWYgKGlkcy5sZW5ndGggPT09IDEgJiYgaWRzWzBdID09PSAnJykge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIHJldHVybiBpZHNcbiAgICAubWFwKGZ1bmN0aW9uKGlkKSB7XG4gICAgICB2YXIgZWwgPSBnZXRFbGVtZW50QnlJZChpZCk7XG4gICAgICBpZiAoIWVsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignbm8gZWxlbWVudCB3aXRoIGlkOiBcIicgKyBpZCArICdcIicpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGVsO1xuICAgIH0pO1xufTtcbiIsImNvbnN0IGtleW1hcCA9IHJlcXVpcmUoJ3JlY2VwdG9yL2tleW1hcCcpO1xuY29uc3QgYmVoYXZpb3IgPSByZXF1aXJlKCcuLi8uLi9ub2RlX21vZHVsZXMvQHVzd2RzL3Vzd2RzL3BhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yJyk7XG5jb25zdCBzZWxlY3QgPSByZXF1aXJlKCcuLi8uLi9ub2RlX21vZHVsZXMvQHVzd2RzL3Vzd2RzL3BhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3NlbGVjdCcpO1xuY29uc3QgdG9nZ2xlID0gcmVxdWlyZSgnLi4vLi4vbm9kZV9tb2R1bGVzL0B1c3dkcy91c3dkcy9wYWNrYWdlcy91c3dkcy1jb3JlL3NyYy9qcy91dGlscy90b2dnbGUnKTtcbmNvbnN0IEZvY3VzVHJhcCA9IHJlcXVpcmUoJy4uLy4uL25vZGVfbW9kdWxlcy9AdXN3ZHMvdXN3ZHMvcGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvZm9jdXMtdHJhcCcpO1xuY29uc3QgYWNjb3JkaW9uID0gcmVxdWlyZSgnLi4vLi4vbm9kZV9tb2R1bGVzL0B1c3dkcy91c3dkcy9wYWNrYWdlcy91c2EtYWNjb3JkaW9uL3NyYycpO1xuY29uc3QgU2Nyb2xsQmFyV2lkdGggPSByZXF1aXJlKCcuLi8uLi9ub2RlX21vZHVsZXMvQHVzd2RzL3Vzd2RzL3BhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3Njcm9sbGJhci13aWR0aCcpO1xuXG5jb25zdCB7IENMSUNLIH0gPSByZXF1aXJlKCcuLi8uLi9ub2RlX21vZHVsZXMvQHVzd2RzL3Vzd2RzL3BhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL2V2ZW50cycpO1xuY29uc3QgeyBwcmVmaXg6IFBSRUZJWCB9ID0gcmVxdWlyZSgnLi4vLi4vbm9kZV9tb2R1bGVzL0B1c3dkcy91c3dkcy9wYWNrYWdlcy91c3dkcy1jb3JlL3NyYy9qcy9jb25maWcnKTtcblxuY29uc3QgQk9EWSA9ICdib2R5JztcbmNvbnN0IEhFQURFUiA9IGAuJHtQUkVGSVh9LWhlYWRlcmA7XG5jb25zdCBOQVYgPSBgLiR7UFJFRklYfS1uYXZgO1xuY29uc3QgTkFWX0NPTlRBSU5FUiA9IGAuJHtQUkVGSVh9LW5hdi1jb250YWluZXJgO1xuY29uc3QgTkFWX1BSSU1BUlkgPSBgLiR7UFJFRklYfS1uYXZfX3ByaW1hcnlgO1xuY29uc3QgTkFWX1BSSU1BUllfSVRFTSA9IGAuJHtQUkVGSVh9LW5hdl9fcHJpbWFyeS1pdGVtYDtcbmNvbnN0IE5BVl9DT05UUk9MID0gYGJ1dHRvbi4ke1BSRUZJWH0tbmF2X19saW5rYDtcbmNvbnN0IE5BVl9MSU5LUyA9IGAke05BVn0gYWA7XG5jb25zdCBOT05fTkFWX0hJRERFTl9BVFRSSUJVVEUgPSBgZGF0YS1uYXYtaGlkZGVuYDtcbmNvbnN0IE9QRU5FUlMgPSBgLiR7UFJFRklYfS1tZW51LWJ0bmA7XG5jb25zdCBDTE9TRV9CVVRUT04gPSBgLiR7UFJFRklYfS1uYXZfX2Nsb3NlYDtcbmNvbnN0IE9WRVJMQVkgPSBgLiR7UFJFRklYfS1vdmVybGF5YDtcbmNvbnN0IENMT1NFUlMgPSBgJHtDTE9TRV9CVVRUT059LCAuJHtQUkVGSVh9LW92ZXJsYXlgO1xuY29uc3QgVE9HR0xFUyA9IFtOQVYsIE9WRVJMQVldLmpvaW4oJywgJyk7XG5jb25zdCBOT05fTkFWX0VMRU1FTlRTID0gYGJvZHkgKjpub3QoJHtIRUFERVJ9LCAke05BVl9DT05UQUlORVJ9LCAke05BVn0sICR7TkFWfSAqKTpub3QoW2FyaWEtaGlkZGVuXSlgO1xuY29uc3QgTk9OX05BVl9ISURERU4gPSBgWyR7Tk9OX05BVl9ISURERU5fQVRUUklCVVRFfV1gO1xuXG5jb25zdCBBQ1RJVkVfQ0xBU1MgPSAndXNhLWpzLW1vYmlsZS1uYXYtLWFjdGl2ZSc7XG5jb25zdCBWSVNJQkxFX0NMQVNTID0gJ2lzLXZpc2libGUnO1xuXG5sZXQgbmF2aWdhdGlvbjtcbmxldCBuYXZBY3RpdmU7XG5sZXQgbm9uTmF2RWxlbWVudHM7XG5cbmNvbnN0IGlzRGVzY2VuZGFudCA9IGZ1bmN0aW9uIChwYXJlbnQsIGNoaWxkKSB7XG4gIGxldCBub2RlID0gY2hpbGQucGFyZW50Tm9kZTtcblxuICB3aGlsZSAobm9kZSkge1xuICAgIGlmIChub2RlID09PSBwYXJlbnQpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIC8vIFRyYXZlcnNlIHVwIHRvIHRoZSBwYXJlbnRcbiAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICB9XG5cbiAgLy8gR28gdXAgdW50aWwgdGhlIHJvb3QgYnV0IGNvdWxkbid0IGZpbmQgdGhlIGBwYXJlbnRgXG4gIHJldHVybiBmYWxzZTtcbn07XG5cbmNvbnN0IGlzQWN0aXZlID0gKCkgPT4gZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuY29udGFpbnMoQUNUSVZFX0NMQVNTKTtcbmNvbnN0IFNDUk9MTEJBUl9XSURUSCA9IFNjcm9sbEJhcldpZHRoKCk7XG5jb25zdCBJTklUSUFMX1BBRERJTkcgPSB3aW5kb3dcbiAgLmdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQuYm9keSlcbiAgLmdldFByb3BlcnR5VmFsdWUoJ3BhZGRpbmctcmlnaHQnKTtcbmNvbnN0IFRFTVBPUkFSWV9QQURESU5HID0gYCR7XG4gIHBhcnNlSW50KElOSVRJQUxfUEFERElORy5yZXBsYWNlKC9weC8sICcnKSwgMTApICtcbiAgcGFyc2VJbnQoU0NST0xMQkFSX1dJRFRILnJlcGxhY2UoL3B4LywgJycpLCAxMClcbn1weGA7XG5cbmNvbnN0IGhpZGVOb25OYXZJdGVtcyA9ICgpID0+IHtcbiAgY29uc3QgaGVhZGVyUGFyZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgJHtIRUFERVJ9YCkucGFyZW50Tm9kZTtcbiAgbm9uTmF2RWxlbWVudHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKE5PTl9OQVZfRUxFTUVOVFMpO1xuXG4gIG5vbk5hdkVsZW1lbnRzLmZvckVhY2goKG5vbk5hdkVsZW1lbnQpID0+IHtcbiAgICBpZihub25OYXZFbGVtZW50ICE9PSBoZWFkZXJQYXJlbnQpIHtcbiAgICAgIG5vbk5hdkVsZW1lbnQuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsIHRydWUpO1xuICAgICAgbm9uTmF2RWxlbWVudC5zZXRBdHRyaWJ1dGUoTk9OX05BVl9ISURERU5fQVRUUklCVVRFLCAnJyk7XG4gICAgfVxuICB9KTtcbn07XG5cbmNvbnN0IHNob3dOb25OYXZJdGVtcyA9ICgpID0+IHtcbiAgbm9uTmF2RWxlbWVudHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKE5PTl9OQVZfSElEREVOKTtcblxuICBpZiAoIW5vbk5hdkVsZW1lbnRzKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gUmVtb3ZlIGFyaWEtaGlkZGVuIGZyb20gbm9uLWhlYWRlciBlbGVtZW50c1xuICBub25OYXZFbGVtZW50cy5mb3JFYWNoKChub25OYXZFbGVtZW50KSA9PiB7XG4gICAgbm9uTmF2RWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJyk7XG4gICAgbm9uTmF2RWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoTk9OX05BVl9ISURERU5fQVRUUklCVVRFKTtcbiAgfSk7XG59O1xuXG4vLyBUb2dnbGUgYWxsIG5vbi1oZWFkZXIgZWxlbWVudHMgIzM1MjcuXG5jb25zdCB0b2dnbGVOb25OYXZJdGVtcyA9IChhY3RpdmUpID0+IHtcbiAgaWYgKGFjdGl2ZSkge1xuICAgIGhpZGVOb25OYXZJdGVtcygpO1xuICB9IGVsc2Uge1xuICAgIHNob3dOb25OYXZJdGVtcygpO1xuICB9XG59O1xuXG5jb25zdCB0b2dnbGVOYXYgPSAoYWN0aXZlKSA9PiB7XG4gIGNvbnN0IHsgYm9keSB9ID0gZG9jdW1lbnQ7XG4gIGNvbnN0IHNhZmVBY3RpdmUgPSB0eXBlb2YgYWN0aXZlID09PSAnYm9vbGVhbicgPyBhY3RpdmUgOiAhaXNBY3RpdmUoKTtcblxuICBib2R5LmNsYXNzTGlzdC50b2dnbGUoQUNUSVZFX0NMQVNTLCBzYWZlQWN0aXZlKTtcblxuICBzZWxlY3QoVE9HR0xFUykuZm9yRWFjaCgoZWwpID0+XG4gICAgZWwuY2xhc3NMaXN0LnRvZ2dsZShWSVNJQkxFX0NMQVNTLCBzYWZlQWN0aXZlKVxuICApO1xuXG4gIG5hdmlnYXRpb24uZm9jdXNUcmFwLnVwZGF0ZShzYWZlQWN0aXZlKTtcblxuICBjb25zdCBjbG9zZUJ1dHRvbiA9IGJvZHkucXVlcnlTZWxlY3RvcihDTE9TRV9CVVRUT04pO1xuICBjb25zdCBtZW51QnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihPUEVORVJTKTtcblxuICBib2R5LnN0eWxlLnBhZGRpbmdSaWdodCA9XG4gICAgYm9keS5zdHlsZS5wYWRkaW5nUmlnaHQgPT09IFRFTVBPUkFSWV9QQURESU5HXG4gICAgICA/IElOSVRJQUxfUEFERElOR1xuICAgICAgOiBURU1QT1JBUllfUEFERElORztcblxuICB0b2dnbGVOb25OYXZJdGVtcyhzYWZlQWN0aXZlKTtcblxuICBpZiAoc2FmZUFjdGl2ZSAmJiBjbG9zZUJ1dHRvbikge1xuICAgIC8vIFRoZSBtb2JpbGUgbmF2IHdhcyBqdXN0IGFjdGl2YXRlZC4gRm9jdXMgb24gdGhlIGNsb3NlIGJ1dHRvbiwgd2hpY2ggaXNcbiAgICAvLyBqdXN0IGJlZm9yZSBhbGwgdGhlIG5hdiBlbGVtZW50cyBpbiB0aGUgdGFiIG9yZGVyLlxuICAgIGNsb3NlQnV0dG9uLmZvY3VzKCk7XG4gIH0gZWxzZSBpZiAoXG4gICAgIXNhZmVBY3RpdmUgJiZcbiAgICBtZW51QnV0dG9uICYmXG4gICAgZ2V0Q29tcHV0ZWRTdHlsZShtZW51QnV0dG9uKS5kaXNwbGF5ICE9PSAnbm9uZSdcblxuICApIHtcbiAgICAvLyBUaGUgbW9iaWxlIG5hdiB3YXMganVzdCBkZWFjdGl2YXRlZC4gV2UgZG9uJ3Qgd2FudCB0aGUgZm9jdXMgdG9cbiAgICAvLyBkaXNhcHBlYXIgaW50byB0aGUgdm9pZCwgc28gZm9jdXMgb24gdGhlIG1lbnUgYnV0dG9uIGlmIGl0J3NcbiAgICAvLyB2aXNpYmxlICh0aGlzIG1heSBoYXZlIGJlZW4gd2hhdCB0aGUgdXNlciB3YXMganVzdCBmb2N1c2VkIG9uLFxuICAgIC8vIGlmIHRoZXkgdHJpZ2dlcmVkIHRoZSBtb2JpbGUgbmF2IGJ5IG1pc3Rha2UpLlxuICAgIG1lbnVCdXR0b24uZm9jdXMoKTtcbiAgfVxuXG4gIHJldHVybiBzYWZlQWN0aXZlO1xufTtcblxuY29uc3QgcmVzaXplID0gKCkgPT4ge1xuICBjb25zdCBjbG9zZXIgPSBkb2N1bWVudC5ib2R5LnF1ZXJ5U2VsZWN0b3IoQ0xPU0VfQlVUVE9OKTtcblxuICBpZiAoaXNBY3RpdmUoKSAmJiBjbG9zZXIgJiYgY2xvc2VyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoID09PSAwKSB7XG4gICAgLy8gV2hlbiB0aGUgbW9iaWxlIG5hdiBpcyBhY3RpdmUsIGFuZCB0aGUgY2xvc2UgYm94IGlzbid0IHZpc2libGUsXG4gICAgLy8gd2Uga25vdyB0aGUgdXNlcidzIHZpZXdwb3J0IGhhcyBiZWVuIHJlc2l6ZWQgdG8gYmUgbGFyZ2VyLlxuICAgIC8vIExldCdzIG1ha2UgdGhlIHBhZ2Ugc3RhdGUgY29uc2lzdGVudCBieSBkZWFjdGl2YXRpbmcgdGhlIG1vYmlsZSBuYXYuXG4gICAgbmF2aWdhdGlvbi50b2dnbGVOYXYuY2FsbChjbG9zZXIsIGZhbHNlKTtcbiAgfVxufTtcblxuY29uc3Qgb25NZW51Q2xvc2UgPSAoKSA9PiBuYXZpZ2F0aW9uLnRvZ2dsZU5hdi5jYWxsKG5hdmlnYXRpb24sIGZhbHNlKTtcblxuY29uc3QgaGlkZUFjdGl2ZU5hdkRyb3Bkb3duID0gKCkgPT4ge1xuICBpZiAoIW5hdkFjdGl2ZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRvZ2dsZShuYXZBY3RpdmUsIGZhbHNlKTtcbiAgbmF2QWN0aXZlID0gbnVsbDtcbn07XG5cbmNvbnN0IGZvY3VzTmF2QnV0dG9uID0gKGV2ZW50KSA9PiB7XG4gIGNvbnN0IHBhcmVudE5hdkl0ZW0gPSBldmVudC50YXJnZXQuY2xvc2VzdChOQVZfUFJJTUFSWV9JVEVNKTtcblxuICAvLyBPbmx5IHNoaWZ0IGZvY3VzIGlmIHdpdGhpbiBkcm9wZG93blxuICBpZiAoIWV2ZW50LnRhcmdldC5tYXRjaGVzKE5BVl9DT05UUk9MKSkge1xuICAgIGNvbnN0IG5hdkNvbnRyb2wgPSBwYXJlbnROYXZJdGVtLnF1ZXJ5U2VsZWN0b3IoTkFWX0NPTlRST0wpXG4gICAgaWYgKG5hdkNvbnRyb2wpIHtcbiAgICAgIG5hdkNvbnRyb2wuZm9jdXMoKVxuICAgIH1cbiAgfVxufTtcblxuY29uc3QgaGFuZGxlRXNjYXBlID0gKGV2ZW50KSA9PiB7XG4gIGhpZGVBY3RpdmVOYXZEcm9wZG93bigpO1xuICBmb2N1c05hdkJ1dHRvbihldmVudCk7XG59O1xuXG5jb25zdCBoYW5kbGVUb2dnbGUgPSB7XG4gIFtOQVZfQ09OVFJPTF0oKSB7XG4gICAgLy8gSWYgYW5vdGhlciBuYXYgaXMgb3BlbiwgY2xvc2UgaXRcbiAgICBpZiAobmF2QWN0aXZlICE9PSB0aGlzKSB7XG4gICAgICBoaWRlQWN0aXZlTmF2RHJvcGRvd24oKTtcbiAgICB9XG4gICAgLy8gc3RvcmUgYSByZWZlcmVuY2UgdG8gdGhlIGxhc3QgY2xpY2tlZCBuYXYgbGluayBlbGVtZW50LCBzbyB3ZVxuICAgIC8vIGNhbiBoaWRlIHRoZSBkcm9wZG93biBpZiBhbm90aGVyIGVsZW1lbnQgb24gdGhlIHBhZ2UgaXMgY2xpY2tlZFxuICAgIGlmICghbmF2QWN0aXZlKSB7XG4gICAgICBuYXZBY3RpdmUgPSB0aGlzO1xuICAgICAgdG9nZ2xlKG5hdkFjdGl2ZSwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgLy8gRG8gdGhpcyBzbyB0aGUgZXZlbnQgaGFuZGxlciBvbiB0aGUgYm9keSBkb2Vzbid0IGZpcmVcbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG5cbiAgW0JPRFldOiBoaWRlQWN0aXZlTmF2RHJvcGRvd24sXG4gIFtPUEVORVJTXTogdG9nZ2xlTmF2LFxuICBbQ0xPU0VSU106IHRvZ2dsZU5hdixcbiAgW05BVl9MSU5LU10oKSB7XG4gICAgLy8gQSBuYXZpZ2F0aW9uIGxpbmsgaGFzIGJlZW4gY2xpY2tlZCEgV2Ugd2FudCB0byBjb2xsYXBzZSBhbnlcbiAgICAvLyBoaWVyYXJjaGljYWwgbmF2aWdhdGlvbiBVSSBpdCdzIGEgcGFydCBvZiwgc28gdGhhdCB0aGUgdXNlclxuICAgIC8vIGNhbiBmb2N1cyBvbiB3aGF0ZXZlciB0aGV5J3ZlIGp1c3Qgc2VsZWN0ZWQuXG5cbiAgICAvLyBTb21lIG5hdmlnYXRpb24gbGlua3MgYXJlIGluc2lkZSBhY2NvcmRpb25zOyB3aGVuIHRoZXkncmVcbiAgICAvLyBjbGlja2VkLCB3ZSB3YW50IHRvIGNvbGxhcHNlIHRob3NlIGFjY29yZGlvbnMuXG4gICAgY29uc3QgYWNjID0gdGhpcy5jbG9zZXN0KGFjY29yZGlvbi5BQ0NPUkRJT04pO1xuXG4gICAgaWYgKGFjYykge1xuICAgICAgYWNjb3JkaW9uLmdldEJ1dHRvbnMoYWNjKS5mb3JFYWNoKChidG4pID0+IGFjY29yZGlvbi5oaWRlKGJ0bikpO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBtb2JpbGUgbmF2aWdhdGlvbiBtZW51IGlzIGFjdGl2ZSwgd2Ugd2FudCB0byBoaWRlIGl0LlxuICAgIGlmIChpc0FjdGl2ZSgpKSB7XG4gICAgICBuYXZpZ2F0aW9uLnRvZ2dsZU5hdi5jYWxsKG5hdmlnYXRpb24sIGZhbHNlKTtcbiAgICB9XG4gIH0sXG59O1xuXG5uYXZpZ2F0aW9uID0gYmVoYXZpb3IoXG4gIHtcbiAgICBbQ0xJQ0tdOiB7XG4gICAgICBbTkFWX0NPTlRST0xdKCkge1xuICAgICAgICAvLyBJZiBhbm90aGVyIG5hdiBpcyBvcGVuLCBjbG9zZSBpdFxuICAgICAgICBpZiAobmF2QWN0aXZlICE9PSB0aGlzKSB7XG4gICAgICAgICAgaGlkZUFjdGl2ZU5hdkRyb3Bkb3duKCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gc3RvcmUgYSByZWZlcmVuY2UgdG8gdGhlIGxhc3QgY2xpY2tlZCBuYXYgbGluayBlbGVtZW50LCBzbyB3ZVxuICAgICAgICAvLyBjYW4gaGlkZSB0aGUgZHJvcGRvd24gaWYgYW5vdGhlciBlbGVtZW50IG9uIHRoZSBwYWdlIGlzIGNsaWNrZWRcbiAgICAgICAgaWYgKCFuYXZBY3RpdmUpIHtcbiAgICAgICAgICBuYXZBY3RpdmUgPSB0aGlzO1xuICAgICAgICAgIHRvZ2dsZShuYXZBY3RpdmUsIHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRG8gdGhpcyBzbyB0aGUgZXZlbnQgaGFuZGxlciBvbiB0aGUgYm9keSBkb2Vzbid0IGZpcmVcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSxcblxuICAgICAgW0JPRFldOiBoaWRlQWN0aXZlTmF2RHJvcGRvd24sXG4gICAgICBbT1BFTkVSU106IHRvZ2dsZU5hdixcbiAgICAgIFtDTE9TRVJTXTogdG9nZ2xlTmF2LFxuICAgICAgW05BVl9MSU5LU10oKSB7XG4gICAgICAgIC8vIEEgbmF2aWdhdGlvbiBsaW5rIGhhcyBiZWVuIGNsaWNrZWQhIFdlIHdhbnQgdG8gY29sbGFwc2UgYW55XG4gICAgICAgIC8vIGhpZXJhcmNoaWNhbCBuYXZpZ2F0aW9uIFVJIGl0J3MgYSBwYXJ0IG9mLCBzbyB0aGF0IHRoZSB1c2VyXG4gICAgICAgIC8vIGNhbiBmb2N1cyBvbiB3aGF0ZXZlciB0aGV5J3ZlIGp1c3Qgc2VsZWN0ZWQuXG5cbiAgICAgICAgLy8gU29tZSBuYXZpZ2F0aW9uIGxpbmtzIGFyZSBpbnNpZGUgYWNjb3JkaW9uczsgd2hlbiB0aGV5J3JlXG4gICAgICAgIC8vIGNsaWNrZWQsIHdlIHdhbnQgdG8gY29sbGFwc2UgdGhvc2UgYWNjb3JkaW9ucy5cbiAgICAgICAgY29uc3QgYWNjID0gdGhpcy5jbG9zZXN0KGFjY29yZGlvbi5BQ0NPUkRJT04pO1xuXG4gICAgICAgIGlmIChhY2MpIHtcbiAgICAgICAgICBhY2NvcmRpb24uZ2V0QnV0dG9ucyhhY2MpLmZvckVhY2goKGJ0bikgPT4gYWNjb3JkaW9uLmhpZGUoYnRuKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgbW9iaWxlIG5hdmlnYXRpb24gbWVudSBpcyBhY3RpdmUsIHdlIHdhbnQgdG8gaGlkZSBpdC5cbiAgICAgICAgaWYgKGlzQWN0aXZlKCkpIHtcbiAgICAgICAgICBuYXZpZ2F0aW9uLnRvZ2dsZU5hdi5jYWxsKG5hdmlnYXRpb24sIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuXG4gICAgbW91c2VvdmVyOiB7XG4gICAgICBbTkFWX1BSSU1BUllfSVRFTV0oZSkge1xuICAgICAgICBjb25zdCBidXR0b24gPSB0aGlzLnF1ZXJ5U2VsZWN0b3IoTkFWX0NPTlRST0wpO1xuXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgaWYoYnV0dG9uICYmICEhaXNEZXNjZW5kYW50KGJ1dHRvbiwgZS50YXJnZXQpKSB7XG4gICAgICAgICAgbGV0IGNvbnRlbnRzO1xuXG4gICAgICAgICAgaWYodGhpcy5jbG9zZXN0KCcudXNhLW5hdl9fc3VibWVudS1pdGVtJykpIHtcbiAgICAgICAgICAgIGNvbnRlbnRzID0gKFxuICAgICAgICAgICAgICBidXR0b24uZ2V0QXR0cmlidXRlKCdhcmlhLWNvbnRyb2xzJykgJiZcbiAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYnV0dG9uLmdldEF0dHJpYnV0ZSgnYXJpYS1jb250cm9scycpKVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgLy8geD1lLmNsaWVudFg7XG5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYoY29udGVudHMpIHtcbiAgICAgICAgICAgICAgY29udGVudHMuc3R5bGUudG9wID0gJzZweCc7XG4gICAgICAgICAgICAgIGNvbnRlbnRzLnN0eWxlLmxlZnQgPSAnLTE2cHgnO1xuICAgICAgICAgICAgICBjb250ZW50cy5zdHlsZS5tYXJnaW5MZWZ0ID0gJzEwMCUnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRvZ2dsZShidXR0b24sIHRydWUpO1xuXG4gICAgICAgICAgaWYoY29udGVudHMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUuY2xpZW50WCwgd2luZG93Lm91dGVyV2lkdGgsIGNvbnRlbnRzLm9mZnNldFdpZHRoKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuXG4gICAgbW91c2VvdXQ6IHtcbiAgICAgIFtOQVZfUFJJTUFSWV9JVEVNXShlKSB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgaWYoIXRoaXMuY29udGFpbnMoZS5yZWxhdGVkVGFyZ2V0KSkge1xuICAgICAgICAgIGNvbnN0IGJ1dHRvbiA9IHRoaXMucXVlcnlTZWxlY3RvcihOQVZfQ09OVFJPTCk7XG5cbiAgICAgICAgICBpZihidXR0b24pIHtcbiAgICAgICAgICAgIGlmKHRoaXMuY2xvc2VzdCgnLnVzYS1uYXZfX3N1Ym1lbnUtaXRlbScpKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnRzID0gKFxuICAgICAgICAgICAgICAgIGJ1dHRvbi5nZXRBdHRyaWJ1dGUoJ2FyaWEtY29udHJvbHMnKSAmJlxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGJ1dHRvbi5nZXRBdHRyaWJ1dGUoJ2FyaWEtY29udHJvbHMnKSlcbiAgICAgICAgICAgICAgKTtcbiAgICBcbiAgICAgICAgICAgICAgaWYoY29udGVudHMpIHtcbiAgICAgICAgICAgICAgICBjb250ZW50cy5zdHlsZS5wb3NpdGlvbiA9IG51bGw7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdG9nZ2xlKGJ1dHRvbiwgZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuXG4gICAga2V5ZG93bjoge1xuICAgICAgW05BVl9QUklNQVJZXToga2V5bWFwKHsgRXNjYXBlOiBoYW5kbGVFc2NhcGUgfSksXG4gICAgfSxcbiAgICBmb2N1c291dDoge1xuICAgICAgW05BVl9QUklNQVJZXShldmVudCkge1xuICAgICAgICBjb25zdCBuYXYgPSBldmVudC50YXJnZXQuY2xvc2VzdChOQVZfUFJJTUFSWSk7XG5cbiAgICAgICAgaWYgKCFuYXYuY29udGFpbnMoZXZlbnQucmVsYXRlZFRhcmdldCkpIHtcbiAgICAgICAgICBoaWRlQWN0aXZlTmF2RHJvcGRvd24oKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICB7XG4gICAgaW5pdChyb290KSB7XG4gICAgICBjb25zdCB0cmFwQ29udGFpbmVyID0gcm9vdC5tYXRjaGVzKE5BVikgPyByb290IDogcm9vdC5xdWVyeVNlbGVjdG9yKE5BVik7XG5cbiAgICAgIGlmICh0cmFwQ29udGFpbmVyKSB7XG4gICAgICAgIG5hdmlnYXRpb24uZm9jdXNUcmFwID0gRm9jdXNUcmFwKHRyYXBDb250YWluZXIsIHtcbiAgICAgICAgICBFc2NhcGU6IG9uTWVudUNsb3NlLFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmVzaXplKCk7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgcmVzaXplLCBmYWxzZSk7XG4gICAgfSxcbiAgICB0ZWFyZG93bigpIHtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCByZXNpemUsIGZhbHNlKTtcbiAgICAgIG5hdkFjdGl2ZSA9IGZhbHNlO1xuICAgIH0sXG4gICAgZm9jdXNUcmFwOiBudWxsLFxuICAgIHRvZ2dsZU5hdixcbiAgfVxuKTtcblxubW9kdWxlLmV4cG9ydHMgPSBuYXZpZ2F0aW9uOyIsIndpbmRvdy51c3dkc1ByZXNlbnQgPSB0cnVlOyAvLyBHTE9CQUwgdmFyaWFibGUgdG8gaW5kaWNhdGUgdGhhdCB0aGUgdXN3ZHMuanMgaGFzIGxvYWRlZCBpbiB0aGUgRE9NLlxuXG4vKipcbiAqIFRoZSAncG9seWZpbGxzJyBkZWZpbmUga2V5IEVDTUFTY3JpcHQgNSBtZXRob2RzIHRoYXQgbWF5IGJlIG1pc3NpbmcgZnJvbVxuICogb2xkZXIgYnJvd3NlcnMsIHNvIG11c3QgYmUgbG9hZGVkIGZpcnN0LlxuICovXG5yZXF1aXJlKCcuLi8uLi9ub2RlX21vZHVsZXMvQHVzd2RzL3Vzd2RzL3BhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3BvbHlmaWxscycpO1xuXG5jb25zdCB1c3dkcyA9IHJlcXVpcmUoJy4uLy4uL25vZGVfbW9kdWxlcy9AdXN3ZHMvdXN3ZHMvcGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvY29uZmlnJyk7XG5cbmNvbnN0IGNvbXBvbmVudHMgPSByZXF1aXJlKCcuLi8uLi9ub2RlX21vZHVsZXMvQHVzd2RzL3Vzd2RzL3BhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzJyk7XG5jb25zdCBzdmc0ZXZlcnlib2R5ID0gcmVxdWlyZSgnLi4vLi4vbm9kZV9tb2R1bGVzL0B1c3dkcy91c3dkcy9wYWNrYWdlcy91c3dkcy1jb3JlL3NyYy9qcy9wb2x5ZmlsbHMvc3ZnNGV2ZXJ5Ym9keScpO1xuXG5jb25zdCBuYXZpZ2F0aW9uID0gcmVxdWlyZSgnLi91c2EtaGVhZGVyJyk7XG5cbmNvbXBvbmVudHMubmF2aWdhdGlvbiA9IG5hdmlnYXRpb247XG51c3dkcy5jb21wb25lbnRzID0gY29tcG9uZW50cztcblxuY29uc3QgaW5pdENvbXBvbmVudHMgPSAoKSA9PiB7XG4gIGNvbnN0IHRhcmdldCA9IGRvY3VtZW50LmJvZHk7XG4gIE9iamVjdC5rZXlzKGNvbXBvbmVudHMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgIGNvbnN0IGJlaGF2aW9yID0gY29tcG9uZW50c1trZXldO1xuICAgIGJlaGF2aW9yLm9uKHRhcmdldCk7XG4gIH0pO1xuICBzdmc0ZXZlcnlib2R5KCk7XG59O1xuXG5pZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gXCJsb2FkaW5nXCIpIHtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgaW5pdENvbXBvbmVudHMsIHsgb25jZTogdHJ1ZSB9KTtcbn0gZWxzZSB7XG4gIGluaXRDb21wb25lbnRzKCk7XG59XG5cbmV4cG9ydHMuZGVmYXVsdCA9IHVzd2RzO1xuZXhwb3J0cy5pbml0Q29tcG9uZW50cyA9IGluaXRDb21wb25lbnRzOyJdfQ==
