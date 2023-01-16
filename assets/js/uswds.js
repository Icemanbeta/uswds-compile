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
    [NAV_PRIMARY_ITEM]() {
      const button = this.querySelector(NAV_CONTROL);
      if (button) {
        console.log(this.closest('.usa-nav__submenu-item'));
        if (this.closest('.usa-nav__submenu-item')) {
          const contents = button.getAttribute('aria-controls') && document.getElementById(button.getAttribute('aria-controls'));
          if (contents) {
            contents.style.position = 'relative';
          }
        }
        toggle(button, true);
      }
    }
  },
  mouseout: {
    [NAV_PRIMARY_ITEM](event) {
      if (!this.contains(event.relatedTarget)) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInBhY2thZ2VzL191c2EtcGFzc3dvcmQvc3JjL2luZGV4LmpzIiwicGFja2FnZXMvdXNhLWFjY29yZGlvbi9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy91c2EtYmFubmVyL3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS1jaGFyYWN0ZXItY291bnQvc3JjL2luZGV4LmpzIiwicGFja2FnZXMvdXNhLWNvbWJvLWJveC9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy91c2EtZGF0ZS1waWNrZXIvc3JjL2luZGV4LmpzIiwicGFja2FnZXMvdXNhLWRhdGUtcmFuZ2UtcGlja2VyL3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS1maWxlLWlucHV0L3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS1mb290ZXIvc3JjL2luZGV4LmpzIiwicGFja2FnZXMvdXNhLWhlYWRlci9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy91c2EtaW4tcGFnZS1uYXZpZ2F0aW9uL3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS1pbnB1dC1tYXNrL3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS1pbnB1dC1wcmVmaXgtc3VmZml4L3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS1sYW5ndWFnZS1zZWxlY3Rvci9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy91c2EtbW9kYWwvc3JjL2luZGV4LmpzIiwicGFja2FnZXMvdXNhLXNlYXJjaC9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy91c2Etc2tpcG5hdi9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy91c2EtdGFibGUvc3JjL2luZGV4LmpzIiwicGFja2FnZXMvdXNhLXRpbWUtcGlja2VyL3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS10b29sdGlwL3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3VzYS12YWxpZGF0aW9uL3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL2NvbmZpZy5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL2V2ZW50cy5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL2luZGV4LmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvcG9seWZpbGxzL2N1c3RvbS1ldmVudC5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3BvbHlmaWxscy9lbGVtZW50LWhpZGRlbi5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3BvbHlmaWxscy9pbmRleC5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3BvbHlmaWxscy9udW1iZXItaXMtbmFuLmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvcG9seWZpbGxzL3N2ZzRldmVyeWJvZHkuanMiLCJwYWNrYWdlcy91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9hY3RpdmUtZWxlbWVudC5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yLmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvZGVib3VuY2UuanMiLCJwYWNrYWdlcy91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9mb2N1cy10cmFwLmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvaXMtaW4tdmlld3BvcnQuanMiLCJwYWNrYWdlcy91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9pcy1pb3MtZGV2aWNlLmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2FuaXRpemVyLmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2Nyb2xsYmFyLXdpZHRoLmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2VsZWN0LW9yLW1hdGNoZXMuanMiLCJwYWNrYWdlcy91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3QuanMiLCJwYWNrYWdlcy91c3dkcy1jb3JlL3NyYy9qcy91dGlscy90b2dnbGUtZmllbGQtbWFzay5qcyIsInBhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3RvZ2dsZS1mb3JtLWlucHV0LmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvdG9nZ2xlLmpzIiwicGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvdmFsaWRhdGUtaW5wdXQuanMiLCIuLi8uLi9jbGFzc2xpc3QtcG9seWZpbGwvc3JjL2luZGV4LmpzIiwiLi4vLi4vZWxlbWVudC1jbG9zZXN0L2VsZW1lbnQtY2xvc2VzdC5qcyIsIi4uLy4uL2tleWJvYXJkZXZlbnQta2V5LXBvbHlmaWxsL2luZGV4LmpzIiwiLi4vLi4vb2JqZWN0LWFzc2lnbi9pbmRleC5qcyIsIi4uLy4uL3JlY2VwdG9yL2JlaGF2aW9yL2luZGV4LmpzIiwiLi4vLi4vcmVjZXB0b3IvY29tcG9zZS9pbmRleC5qcyIsIi4uLy4uL3JlY2VwdG9yL2RlbGVnYXRlL2luZGV4LmpzIiwiLi4vLi4vcmVjZXB0b3IvZGVsZWdhdGVBbGwvaW5kZXguanMiLCIuLi8uLi9yZWNlcHRvci9pZ25vcmUvaW5kZXguanMiLCIuLi8uLi9yZWNlcHRvci9pbmRleC5qcyIsIi4uLy4uL3JlY2VwdG9yL2tleW1hcC9pbmRleC5qcyIsIi4uLy4uL3JlY2VwdG9yL29uY2UvaW5kZXguanMiLCIuLi8uLi9yZXNvbHZlLWlkLXJlZnMvaW5kZXguanMiLCIuLi8uLi8uLi90YXNrcy9qcy91c2EtaGVhZGVyLmpzIiwiLi4vLi4vLi4vdGFza3MvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyx3Q0FBd0MsQ0FBQztBQUNsRSxNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsaURBQWlELENBQUM7QUFFbEYsTUFBTTtFQUFFO0FBQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQztBQUMzRCxNQUFNO0VBQUUsTUFBTSxFQUFFO0FBQU8sQ0FB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TztNQUNYLEVBQUUsRUFBRSxTQUFTO01BQ2IsRUFBRSxFQUFFLGFBQWE7TUFDakIsRUFBRSxFQUFFLFFBQVE7TUFDWixFQUFFLEVBQUUsUUFBUTtNQUNaLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7TUFDZCxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO01BQ2QsRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztNQUNkLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7TUFDZCxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO01BQ2QsRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztNQUNkLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7TUFDZCxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO01BQ2QsRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztNQUNkLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7TUFDZCxFQUFFLEVBQUUsSUFBSTtNQUNSLEVBQUUsRUFBRSxhQUFhO01BQ2pCLEdBQUcsRUFBRSxTQUFTO01BQ2QsR0FBRyxFQUFFLFlBQVk7TUFDakIsR0FBRyxFQUFFLFlBQVk7TUFDakIsR0FBRyxFQUFFLFlBQVk7TUFDakIsR0FBRyxFQUFFLFVBQVU7TUFDZixHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO01BQ2YsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztNQUNmLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7TUFDZixHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO01BQ2YsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztNQUNmLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7TUFDZixHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FB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O0FBRUQsSUFBSSxRQUFRLENBQUMsVUFBVSxLQUFLLFNBQVMsRUFBRTtFQUNyQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCLEVBQUUsY0FBYyxFQUFFO0lBQUUsSUFBSSxFQUFFO0VBQUssQ0FBQyxDQUFDO0FBQy9FLENBQUMsTUFBTTtFQUNMLGNBQWMsRUFBRTtBQUNsQjtBQUVBLE9BQU8sQ0FBQyxPQUFPLEdBQUcsS0FBSztBQUN2QixPQUFPLENBQUMsY0FBYyxHQUFHLGNBQWMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJjb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcbmNvbnN0IHRvZ2dsZUZvcm1JbnB1dCA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy90b2dnbGUtZm9ybS1pbnB1dFwiKTtcblxuY29uc3QgeyBDTElDSyB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2V2ZW50c1wiKTtcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XG5cbmNvbnN0IExJTksgPSBgLiR7UFJFRklYfS1zaG93LXBhc3N3b3JkYDtcblxuZnVuY3Rpb24gdG9nZ2xlKGV2ZW50KSB7XG4gIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gIHRvZ2dsZUZvcm1JbnB1dCh0aGlzKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiZWhhdmlvcih7XG4gIFtDTElDS106IHtcbiAgICBbTElOS106IHRvZ2dsZSxcbiAgfSxcbn0pO1xuIiwiY29uc3Qgc2VsZWN0ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3NlbGVjdFwiKTtcbmNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xuY29uc3QgdG9nZ2xlID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3RvZ2dsZVwiKTtcbmNvbnN0IGlzRWxlbWVudEluVmlld3BvcnQgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvaXMtaW4tdmlld3BvcnRcIik7XG5jb25zdCB7IENMSUNLIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvZXZlbnRzXCIpO1xuY29uc3QgeyBwcmVmaXg6IFBSRUZJWCB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2NvbmZpZ1wiKTtcblxuY29uc3QgQUNDT1JESU9OID0gYC4ke1BSRUZJWH0tYWNjb3JkaW9uLCAuJHtQUkVGSVh9LWFjY29yZGlvbi0tYm9yZGVyZWRgO1xuY29uc3QgQlVUVE9OID0gYC4ke1BSRUZJWH0tYWNjb3JkaW9uX19idXR0b25bYXJpYS1jb250cm9sc11gO1xuY29uc3QgRVhQQU5ERUQgPSBcImFyaWEtZXhwYW5kZWRcIjtcbmNvbnN0IE1VTFRJU0VMRUNUQUJMRSA9IFwiZGF0YS1hbGxvdy1tdWx0aXBsZVwiO1xuXG4vKipcbiAqIEdldCBhbiBBcnJheSBvZiBidXR0b24gZWxlbWVudHMgYmVsb25naW5nIGRpcmVjdGx5IHRvIHRoZSBnaXZlblxuICogYWNjb3JkaW9uIGVsZW1lbnQuXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBhY2NvcmRpb25cbiAqIEByZXR1cm4ge2FycmF5PEhUTUxCdXR0b25FbGVtZW50Pn1cbiAqL1xuY29uc3QgZ2V0QWNjb3JkaW9uQnV0dG9ucyA9IChhY2NvcmRpb24pID0+IHtcbiAgY29uc3QgYnV0dG9ucyA9IHNlbGVjdChCVVRUT04sIGFjY29yZGlvbik7XG5cbiAgcmV0dXJuIGJ1dHRvbnMuZmlsdGVyKChidXR0b24pID0+IGJ1dHRvbi5jbG9zZXN0KEFDQ09SRElPTikgPT09IGFjY29yZGlvbik7XG59O1xuXG4vKipcbiAqIFRvZ2dsZSBhIGJ1dHRvbidzIFwicHJlc3NlZFwiIHN0YXRlLCBvcHRpb25hbGx5IHByb3ZpZGluZyBhIHRhcmdldFxuICogc3RhdGUuXG4gKlxuICogQHBhcmFtIHtIVE1MQnV0dG9uRWxlbWVudH0gYnV0dG9uXG4gKiBAcGFyYW0ge2Jvb2xlYW4/fSBleHBhbmRlZCBJZiBubyBzdGF0ZSBpcyBwcm92aWRlZCwgdGhlIGN1cnJlbnRcbiAqIHN0YXRlIHdpbGwgYmUgdG9nZ2xlZCAoZnJvbSBmYWxzZSB0byB0cnVlLCBhbmQgdmljZS12ZXJzYSkuXG4gKiBAcmV0dXJuIHtib29sZWFufSB0aGUgcmVzdWx0aW5nIHN0YXRlXG4gKi9cbmNvbnN0IHRvZ2dsZUJ1dHRvbiA9IChidXR0b24sIGV4cGFuZGVkKSA9PiB7XG4gIGNvbnN0IGFjY29yZGlvbiA9IGJ1dHRvbi5jbG9zZXN0KEFDQ09SRElPTik7XG4gIGxldCBzYWZlRXhwYW5kZWQgPSBleHBhbmRlZDtcblxuICBpZiAoIWFjY29yZGlvbikge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHtCVVRUT059IGlzIG1pc3Npbmcgb3V0ZXIgJHtBQ0NPUkRJT059YCk7XG4gIH1cblxuICBzYWZlRXhwYW5kZWQgPSB0b2dnbGUoYnV0dG9uLCBleHBhbmRlZCk7XG5cbiAgLy8gWFhYIG11bHRpc2VsZWN0YWJsZSBpcyBvcHQtaW4sIHRvIHByZXNlcnZlIGxlZ2FjeSBiZWhhdmlvclxuICBjb25zdCBtdWx0aXNlbGVjdGFibGUgPSBhY2NvcmRpb24uaGFzQXR0cmlidXRlKE1VTFRJU0VMRUNUQUJMRSk7XG5cbiAgaWYgKHNhZmVFeHBhbmRlZCAmJiAhbXVsdGlzZWxlY3RhYmxlKSB7XG4gICAgZ2V0QWNjb3JkaW9uQnV0dG9ucyhhY2NvcmRpb24pLmZvckVhY2goKG90aGVyKSA9PiB7XG4gICAgICBpZiAob3RoZXIgIT09IGJ1dHRvbikge1xuICAgICAgICB0b2dnbGUob3RoZXIsIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufTtcblxuLyoqXG4gKiBAcGFyYW0ge0hUTUxCdXR0b25FbGVtZW50fSBidXR0b25cbiAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWVcbiAqL1xuY29uc3Qgc2hvd0J1dHRvbiA9IChidXR0b24pID0+IHRvZ2dsZUJ1dHRvbihidXR0b24sIHRydWUpO1xuXG4vKipcbiAqIEBwYXJhbSB7SFRNTEJ1dHRvbkVsZW1lbnR9IGJ1dHRvblxuICogQHJldHVybiB7Ym9vbGVhbn0gZmFsc2VcbiAqL1xuY29uc3QgaGlkZUJ1dHRvbiA9IChidXR0b24pID0+IHRvZ2dsZUJ1dHRvbihidXR0b24sIGZhbHNlKTtcblxuY29uc3QgYWNjb3JkaW9uID0gYmVoYXZpb3IoXG4gIHtcbiAgICBbQ0xJQ0tdOiB7XG4gICAgICBbQlVUVE9OXShldmVudCkge1xuICAgICAgICB0b2dnbGVCdXR0b24odGhpcyk7XG5cbiAgICAgICAgaWYgKHRoaXMuZ2V0QXR0cmlidXRlKEVYUEFOREVEKSA9PT0gXCJ0cnVlXCIpIHtcbiAgICAgICAgICAvLyBXZSB3ZXJlIGp1c3QgZXhwYW5kZWQsIGJ1dCBpZiBhbm90aGVyIGFjY29yZGlvbiB3YXMgYWxzbyBqdXN0XG4gICAgICAgICAgLy8gY29sbGFwc2VkLCB3ZSBtYXkgbm8gbG9uZ2VyIGJlIGluIHRoZSB2aWV3cG9ydC4gVGhpcyBlbnN1cmVzXG4gICAgICAgICAgLy8gdGhhdCB3ZSBhcmUgc3RpbGwgdmlzaWJsZSwgc28gdGhlIHVzZXIgaXNuJ3QgY29uZnVzZWQuXG4gICAgICAgICAgaWYgKCFpc0VsZW1lbnRJblZpZXdwb3J0KHRoaXMpKSB0aGlzLnNjcm9sbEludG9WaWV3KCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAge1xuICAgIGluaXQocm9vdCkge1xuICAgICAgc2VsZWN0KEJVVFRPTiwgcm9vdCkuZm9yRWFjaCgoYnV0dG9uKSA9PiB7XG4gICAgICAgIGNvbnN0IGV4cGFuZGVkID0gYnV0dG9uLmdldEF0dHJpYnV0ZShFWFBBTkRFRCkgPT09IFwidHJ1ZVwiO1xuICAgICAgICB0b2dnbGVCdXR0b24oYnV0dG9uLCBleHBhbmRlZCk7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIEFDQ09SRElPTixcbiAgICBCVVRUT04sXG4gICAgc2hvdzogc2hvd0J1dHRvbixcbiAgICBoaWRlOiBoaWRlQnV0dG9uLFxuICAgIHRvZ2dsZTogdG9nZ2xlQnV0dG9uLFxuICAgIGdldEJ1dHRvbnM6IGdldEFjY29yZGlvbkJ1dHRvbnMsXG4gIH1cbik7XG5cbm1vZHVsZS5leHBvcnRzID0gYWNjb3JkaW9uO1xuIiwiY29uc3QgYmVoYXZpb3IgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvYmVoYXZpb3JcIik7XG5jb25zdCB7IENMSUNLIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvZXZlbnRzXCIpO1xuY29uc3QgeyBwcmVmaXg6IFBSRUZJWCB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2NvbmZpZ1wiKTtcblxuY29uc3QgSEVBREVSID0gYC4ke1BSRUZJWH0tYmFubmVyX19oZWFkZXJgO1xuY29uc3QgRVhQQU5ERURfQ0xBU1MgPSBgJHtQUkVGSVh9LWJhbm5lcl9faGVhZGVyLS1leHBhbmRlZGA7XG5cbmNvbnN0IHRvZ2dsZUJhbm5lciA9IGZ1bmN0aW9uIHRvZ2dsZUVsKGV2ZW50KSB7XG4gIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gIHRoaXMuY2xvc2VzdChIRUFERVIpLmNsYXNzTGlzdC50b2dnbGUoRVhQQU5ERURfQ0xBU1MpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBiZWhhdmlvcih7XG4gIFtDTElDS106IHtcbiAgICBbYCR7SEVBREVSfSBbYXJpYS1jb250cm9sc11gXTogdG9nZ2xlQmFubmVyLFxuICB9LFxufSk7XG4iLCJjb25zdCBzZWxlY3QgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2VsZWN0XCIpO1xuY29uc3QgYmVoYXZpb3IgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvYmVoYXZpb3JcIik7XG5jb25zdCBkZWJvdW5jZSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9kZWJvdW5jZVwiKTtcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XG5cbmNvbnN0IENIQVJBQ1RFUl9DT1VOVF9DTEFTUyA9IGAke1BSRUZJWH0tY2hhcmFjdGVyLWNvdW50YDtcbmNvbnN0IENIQVJBQ1RFUl9DT1VOVCA9IGAuJHtDSEFSQUNURVJfQ09VTlRfQ0xBU1N9YDtcbmNvbnN0IElOUFVUID0gYC4ke1BSRUZJWH0tY2hhcmFjdGVyLWNvdW50X19maWVsZGA7XG5jb25zdCBNRVNTQUdFID0gYC4ke1BSRUZJWH0tY2hhcmFjdGVyLWNvdW50X19tZXNzYWdlYDtcbmNvbnN0IFZBTElEQVRJT05fTUVTU0FHRSA9IFwiVGhlIGNvbnRlbnQgaXMgdG9vIGxvbmcuXCI7XG5jb25zdCBNRVNTQUdFX0lOVkFMSURfQ0xBU1MgPSBgJHtQUkVGSVh9LWNoYXJhY3Rlci1jb3VudF9fc3RhdHVzLS1pbnZhbGlkYDtcbmNvbnN0IFNUQVRVU19NRVNTQUdFX0NMQVNTID0gYCR7Q0hBUkFDVEVSX0NPVU5UX0NMQVNTfV9fc3RhdHVzYDtcbmNvbnN0IFNUQVRVU19NRVNTQUdFX1NSX09OTFlfQ0xBU1MgPSBgJHtDSEFSQUNURVJfQ09VTlRfQ0xBU1N9X19zci1zdGF0dXNgO1xuY29uc3QgU1RBVFVTX01FU1NBR0UgPSBgLiR7U1RBVFVTX01FU1NBR0VfQ0xBU1N9YDtcbmNvbnN0IFNUQVRVU19NRVNTQUdFX1NSX09OTFkgPSBgLiR7U1RBVFVTX01FU1NBR0VfU1JfT05MWV9DTEFTU31gO1xuY29uc3QgREVGQVVMVF9TVEFUVVNfTEFCRUwgPSBgY2hhcmFjdGVycyBhbGxvd2VkYDtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSByb290IGFuZCBtZXNzYWdlIGVsZW1lbnQgZm9yIGFuIGNoYXJhY3RlciBjb3VudCBpbnB1dFxuICpcbiAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudHxIVE1MVGV4dEFyZWFFbGVtZW50fSBpbnB1dEVsIFRoZSBjaGFyYWN0ZXIgY291bnQgaW5wdXQgZWxlbWVudFxuICogQHJldHVybnMge0NoYXJhY3RlckNvdW50RWxlbWVudHN9IGVsZW1lbnRzIFRoZSByb290IGFuZCBtZXNzYWdlIGVsZW1lbnQuXG4gKi9cbmNvbnN0IGdldENoYXJhY3RlckNvdW50RWxlbWVudHMgPSAoaW5wdXRFbCkgPT4ge1xuICBjb25zdCBjaGFyYWN0ZXJDb3VudEVsID0gaW5wdXRFbC5jbG9zZXN0KENIQVJBQ1RFUl9DT1VOVCk7XG5cbiAgaWYgKCFjaGFyYWN0ZXJDb3VudEVsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAke0lOUFVUfSBpcyBtaXNzaW5nIG91dGVyICR7Q0hBUkFDVEVSX0NPVU5UfWApO1xuICB9XG5cbiAgY29uc3QgbWVzc2FnZUVsID0gY2hhcmFjdGVyQ291bnRFbC5xdWVyeVNlbGVjdG9yKE1FU1NBR0UpO1xuXG4gIGlmICghbWVzc2FnZUVsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAke0NIQVJBQ1RFUl9DT1VOVH0gaXMgbWlzc2luZyBpbm5lciAke01FU1NBR0V9YCk7XG4gIH1cblxuICByZXR1cm4geyBjaGFyYWN0ZXJDb3VudEVsLCBtZXNzYWdlRWwgfTtcbn07XG5cbi8qKlxuICogTW92ZSBtYXhsZW5ndGggYXR0cmlidXRlIHRvIGEgZGF0YSBhdHRyaWJ1dGUgb24gdXNhLWNoYXJhY3Rlci1jb3VudFxuICpcbiAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudHxIVE1MVGV4dEFyZWFFbGVtZW50fSBpbnB1dEVsIFRoZSBjaGFyYWN0ZXIgY291bnQgaW5wdXQgZWxlbWVudFxuICovXG5jb25zdCBzZXREYXRhTGVuZ3RoID0gKGlucHV0RWwpID0+IHtcbiAgY29uc3QgeyBjaGFyYWN0ZXJDb3VudEVsIH0gPSBnZXRDaGFyYWN0ZXJDb3VudEVsZW1lbnRzKGlucHV0RWwpO1xuXG4gIGNvbnN0IG1heGxlbmd0aCA9IGlucHV0RWwuZ2V0QXR0cmlidXRlKFwibWF4bGVuZ3RoXCIpO1xuXG4gIGlmICghbWF4bGVuZ3RoKSByZXR1cm47XG5cbiAgaW5wdXRFbC5yZW1vdmVBdHRyaWJ1dGUoXCJtYXhsZW5ndGhcIik7XG4gIGNoYXJhY3RlckNvdW50RWwuc2V0QXR0cmlidXRlKFwiZGF0YS1tYXhsZW5ndGhcIiwgbWF4bGVuZ3RoKTtcbn07XG5cbi8qKlxuICogQ3JlYXRlIGFuZCBhcHBlbmQgc3RhdHVzIG1lc3NhZ2VzIGZvciB2aXN1YWwgYW5kIHNjcmVlbiByZWFkZXJzXG4gKlxuICogQHBhcmFtIHtIVE1MRGl2RWxlbWVudH0gY2hhcmFjdGVyQ291bnRFbCAtIERpdiB3aXRoIGAudXNhLWNoYXJhY3Rlci1jb3VudGAgY2xhc3NcbiAqIEBkZXNjcmlwdGlvbiAgQ3JlYXRlIHR3byBzdGF0dXMgbWVzc2FnZXMgZm9yIG51bWJlciBvZiBjaGFyYWN0ZXJzIGxlZnQ7XG4gKiBvbmUgdmlzdWFsIHN0YXR1cyBhbmQgYW5vdGhlciBmb3Igc2NyZWVuIHJlYWRlcnNcbiAqL1xuY29uc3QgY3JlYXRlU3RhdHVzTWVzc2FnZXMgPSAoY2hhcmFjdGVyQ291bnRFbCkgPT4ge1xuICBjb25zdCBzdGF0dXNNZXNzYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgY29uc3Qgc3JTdGF0dXNNZXNzYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgY29uc3QgbWF4TGVuZ3RoID0gY2hhcmFjdGVyQ291bnRFbC5kYXRhc2V0Lm1heGxlbmd0aDtcbiAgY29uc3QgZGVmYXVsdE1lc3NhZ2UgPSBgJHttYXhMZW5ndGh9ICR7REVGQVVMVF9TVEFUVVNfTEFCRUx9YDtcblxuICBzdGF0dXNNZXNzYWdlLmNsYXNzTGlzdC5hZGQoYCR7U1RBVFVTX01FU1NBR0VfQ0xBU1N9YCwgXCJ1c2EtaGludFwiKTtcbiAgc3JTdGF0dXNNZXNzYWdlLmNsYXNzTGlzdC5hZGQoXG4gICAgYCR7U1RBVFVTX01FU1NBR0VfU1JfT05MWV9DTEFTU31gLFxuICAgIFwidXNhLXNyLW9ubHlcIlxuICApO1xuXG4gIHN0YXR1c01lc3NhZ2Uuc2V0QXR0cmlidXRlKFwiYXJpYS1oaWRkZW5cIiwgdHJ1ZSk7XG4gIHNyU3RhdHVzTWVzc2FnZS5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxpdmVcIiwgXCJwb2xpdGVcIik7XG5cbiAgc3RhdHVzTWVzc2FnZS50ZXh0Q29udGVudCA9IGRlZmF1bHRNZXNzYWdlO1xuICBzclN0YXR1c01lc3NhZ2UudGV4dENvbnRlbnQgPSBkZWZhdWx0TWVzc2FnZTtcblxuICBjaGFyYWN0ZXJDb3VudEVsLmFwcGVuZChzdGF0dXNNZXNzYWdlLCBzclN0YXR1c01lc3NhZ2UpO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIG1lc3NhZ2Ugd2l0aCBob3cgbWFueSBjaGFyYWN0ZXJzIGFyZSBsZWZ0XG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IGN1cnJlbnRMZW5ndGggLSBUaGUgbnVtYmVyIG9mIGNoYXJhY3RlcnMgdXNlZFxuICogQHBhcmFtIHtudW1iZXJ9IG1heExlbmd0aCAtIFRoZSB0b3RhbCBudW1iZXIgb2YgY2hhcmFjdGVycyBhbGxvd2VkXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBBIHN0cmluZyBkZXNjcmlwdGlvbiBvZiBob3cgbWFueSBjaGFyYWN0ZXJzIGFyZSBsZWZ0XG4gKi9cbmNvbnN0IGdldENvdW50TWVzc2FnZSA9IChjdXJyZW50TGVuZ3RoLCBtYXhMZW5ndGgpID0+IHtcbiAgbGV0IG5ld01lc3NhZ2UgPSBcIlwiO1xuXG4gIGlmIChjdXJyZW50TGVuZ3RoID09PSAwKSB7XG4gICAgbmV3TWVzc2FnZSA9IGAke21heExlbmd0aH0gJHtERUZBVUxUX1NUQVRVU19MQUJFTH1gO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGRpZmZlcmVuY2UgPSBNYXRoLmFicyhtYXhMZW5ndGggLSBjdXJyZW50TGVuZ3RoKTtcbiAgICBjb25zdCBjaGFyYWN0ZXJzID0gYGNoYXJhY3RlciR7ZGlmZmVyZW5jZSA9PT0gMSA/IFwiXCIgOiBcInNcIn1gO1xuICAgIGNvbnN0IGd1aWRhbmNlID0gY3VycmVudExlbmd0aCA+IG1heExlbmd0aCA/IFwib3ZlciBsaW1pdFwiIDogXCJsZWZ0XCI7XG5cbiAgICBuZXdNZXNzYWdlID0gYCR7ZGlmZmVyZW5jZX0gJHtjaGFyYWN0ZXJzfSAke2d1aWRhbmNlfWA7XG4gIH1cblxuICByZXR1cm4gbmV3TWVzc2FnZTtcbn07XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgY2hhcmFjdGVyIGNvdW50IHN0YXR1cyBmb3Igc2NyZWVuIHJlYWRlcnMgYWZ0ZXIgYSAxMDAwbXMgZGVsYXkuXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gbXNnRWwgLSBUaGUgc2NyZWVuIHJlYWRlciBzdGF0dXMgbWVzc2FnZSBlbGVtZW50XG4gKiBAcGFyYW0ge3N0cmluZ30gc3RhdHVzTWVzc2FnZSAtIEEgc3RyaW5nIG9mIHRoZSBjdXJyZW50IGNoYXJhY3RlciBzdGF0dXNcbiAqL1xuY29uc3Qgc3JVcGRhdGVTdGF0dXMgPSBkZWJvdW5jZSgobXNnRWwsIHN0YXR1c01lc3NhZ2UpID0+IHtcbiAgY29uc3Qgc3JTdGF0dXNNZXNzYWdlID0gbXNnRWw7XG4gIHNyU3RhdHVzTWVzc2FnZS50ZXh0Q29udGVudCA9IHN0YXR1c01lc3NhZ2U7XG59LCAxMDAwKTtcblxuLyoqXG4gKiBVcGRhdGUgdGhlIGNoYXJhY3RlciBjb3VudCBjb21wb25lbnRcbiAqXG4gKiBAZGVzY3JpcHRpb24gT24gaW5wdXQsIGl0IHdpbGwgdXBkYXRlIHZpc3VhbCBzdGF0dXMsIHNjcmVlbnJlYWRlclxuICogc3RhdHVzIGFuZCB1cGRhdGUgaW5wdXQgdmFsaWRhdGlvbiAoaWYgb3ZlciBjaGFyYWN0ZXIgbGVuZ3RoKVxuICogQHBhcmFtIHtIVE1MSW5wdXRFbGVtZW50fEhUTUxUZXh0QXJlYUVsZW1lbnR9IGlucHV0RWwgVGhlIGNoYXJhY3RlciBjb3VudCBpbnB1dCBlbGVtZW50XG4gKi9cbmNvbnN0IHVwZGF0ZUNvdW50TWVzc2FnZSA9IChpbnB1dEVsKSA9PiB7XG4gIGNvbnN0IHsgY2hhcmFjdGVyQ291bnRFbCB9ID0gZ2V0Q2hhcmFjdGVyQ291bnRFbGVtZW50cyhpbnB1dEVsKTtcbiAgY29uc3QgY3VycmVudExlbmd0aCA9IGlucHV0RWwudmFsdWUubGVuZ3RoO1xuICBjb25zdCBtYXhMZW5ndGggPSBwYXJzZUludChcbiAgICBjaGFyYWN0ZXJDb3VudEVsLmdldEF0dHJpYnV0ZShcImRhdGEtbWF4bGVuZ3RoXCIpLFxuICAgIDEwXG4gICk7XG4gIGNvbnN0IHN0YXR1c01lc3NhZ2UgPSBjaGFyYWN0ZXJDb3VudEVsLnF1ZXJ5U2VsZWN0b3IoU1RBVFVTX01FU1NBR0UpO1xuICBjb25zdCBzclN0YXR1c01lc3NhZ2UgPSBjaGFyYWN0ZXJDb3VudEVsLnF1ZXJ5U2VsZWN0b3IoXG4gICAgU1RBVFVTX01FU1NBR0VfU1JfT05MWVxuICApO1xuICBjb25zdCBjdXJyZW50U3RhdHVzTWVzc2FnZSA9IGdldENvdW50TWVzc2FnZShjdXJyZW50TGVuZ3RoLCBtYXhMZW5ndGgpO1xuXG4gIGlmICghbWF4TGVuZ3RoKSByZXR1cm47XG5cbiAgY29uc3QgaXNPdmVyTGltaXQgPSBjdXJyZW50TGVuZ3RoICYmIGN1cnJlbnRMZW5ndGggPiBtYXhMZW5ndGg7XG5cbiAgc3RhdHVzTWVzc2FnZS50ZXh0Q29udGVudCA9IGN1cnJlbnRTdGF0dXNNZXNzYWdlO1xuICBzclVwZGF0ZVN0YXR1cyhzclN0YXR1c01lc3NhZ2UsIGN1cnJlbnRTdGF0dXNNZXNzYWdlKTtcblxuICBpZiAoaXNPdmVyTGltaXQgJiYgIWlucHV0RWwudmFsaWRhdGlvbk1lc3NhZ2UpIHtcbiAgICBpbnB1dEVsLnNldEN1c3RvbVZhbGlkaXR5KFZBTElEQVRJT05fTUVTU0FHRSk7XG4gIH1cblxuICBpZiAoIWlzT3ZlckxpbWl0ICYmIGlucHV0RWwudmFsaWRhdGlvbk1lc3NhZ2UgPT09IFZBTElEQVRJT05fTUVTU0FHRSkge1xuICAgIGlucHV0RWwuc2V0Q3VzdG9tVmFsaWRpdHkoXCJcIik7XG4gIH1cblxuICBzdGF0dXNNZXNzYWdlLmNsYXNzTGlzdC50b2dnbGUoTUVTU0FHRV9JTlZBTElEX0NMQVNTLCBpc092ZXJMaW1pdCk7XG59O1xuXG4vKipcbiAqIEluaXRpYWxpemUgY29tcG9uZW50XG4gKlxuICogQGRlc2NyaXB0aW9uIE9uIGluaXQgdGhpcyBmdW5jdGlvbiB3aWxsIGNyZWF0ZSBlbGVtZW50cyBhbmQgdXBkYXRlIGFueVxuICogYXR0cmlidXRlcyBzbyBpdCBjYW4gdGVsbCB0aGUgdXNlciBob3cgbWFueSBjaGFyYWN0ZXJzIGFyZSBsZWZ0LlxuICogQHBhcmFtICB7SFRNTElucHV0RWxlbWVudHxIVE1MVGV4dEFyZWFFbGVtZW50fSBpbnB1dEVsIHRoZSBjb21wb25lbnRzIGlucHV0XG4gKi9cbmNvbnN0IGVuaGFuY2VDaGFyYWN0ZXJDb3VudCA9IChpbnB1dEVsKSA9PiB7XG4gIGNvbnN0IHsgY2hhcmFjdGVyQ291bnRFbCwgbWVzc2FnZUVsIH0gPSBnZXRDaGFyYWN0ZXJDb3VudEVsZW1lbnRzKGlucHV0RWwpO1xuXG4gIC8vIEhpZGUgaGludCBhbmQgcmVtb3ZlIGFyaWEtbGl2ZSBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHlcbiAgbWVzc2FnZUVsLmNsYXNzTGlzdC5hZGQoXCJ1c2Etc3Itb25seVwiKTtcbiAgbWVzc2FnZUVsLnJlbW92ZUF0dHJpYnV0ZShcImFyaWEtbGl2ZVwiKTtcblxuICBzZXREYXRhTGVuZ3RoKGlucHV0RWwpO1xuICBjcmVhdGVTdGF0dXNNZXNzYWdlcyhjaGFyYWN0ZXJDb3VudEVsKTtcbn07XG5cbmNvbnN0IGNoYXJhY3RlckNvdW50ID0gYmVoYXZpb3IoXG4gIHtcbiAgICBpbnB1dDoge1xuICAgICAgW0lOUFVUXSgpIHtcbiAgICAgICAgdXBkYXRlQ291bnRNZXNzYWdlKHRoaXMpO1xuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICB7XG4gICAgaW5pdChyb290KSB7XG4gICAgICBzZWxlY3QoSU5QVVQsIHJvb3QpLmZvckVhY2goKGlucHV0KSA9PiBlbmhhbmNlQ2hhcmFjdGVyQ291bnQoaW5wdXQpKTtcbiAgICB9LFxuICAgIE1FU1NBR0VfSU5WQUxJRF9DTEFTUyxcbiAgICBWQUxJREFUSU9OX01FU1NBR0UsXG4gICAgU1RBVFVTX01FU1NBR0VfQ0xBU1MsXG4gICAgU1RBVFVTX01FU1NBR0VfU1JfT05MWV9DTEFTUyxcbiAgICBERUZBVUxUX1NUQVRVU19MQUJFTCxcbiAgICBjcmVhdGVTdGF0dXNNZXNzYWdlcyxcbiAgICBnZXRDb3VudE1lc3NhZ2UsXG4gICAgdXBkYXRlQ291bnRNZXNzYWdlLFxuICB9XG4pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNoYXJhY3RlckNvdW50O1xuIiwiY29uc3Qga2V5bWFwID0gcmVxdWlyZShcInJlY2VwdG9yL2tleW1hcFwiKTtcbmNvbnN0IHNlbGVjdE9yTWF0Y2hlcyA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3Qtb3ItbWF0Y2hlc1wiKTtcbmNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xuY29uc3QgU2FuaXRpemVyID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3Nhbml0aXplclwiKTtcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XG5jb25zdCB7IENMSUNLIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvZXZlbnRzXCIpO1xuXG5jb25zdCBDT01CT19CT1hfQ0xBU1MgPSBgJHtQUkVGSVh9LWNvbWJvLWJveGA7XG5jb25zdCBDT01CT19CT1hfUFJJU1RJTkVfQ0xBU1MgPSBgJHtDT01CT19CT1hfQ0xBU1N9LS1wcmlzdGluZWA7XG5jb25zdCBTRUxFQ1RfQ0xBU1MgPSBgJHtDT01CT19CT1hfQ0xBU1N9X19zZWxlY3RgO1xuY29uc3QgSU5QVVRfQ0xBU1MgPSBgJHtDT01CT19CT1hfQ0xBU1N9X19pbnB1dGA7XG5jb25zdCBDTEVBUl9JTlBVVF9CVVRUT05fQ0xBU1MgPSBgJHtDT01CT19CT1hfQ0xBU1N9X19jbGVhci1pbnB1dGA7XG5jb25zdCBDTEVBUl9JTlBVVF9CVVRUT05fV1JBUFBFUl9DTEFTUyA9IGAke0NMRUFSX0lOUFVUX0JVVFRPTl9DTEFTU31fX3dyYXBwZXJgO1xuY29uc3QgSU5QVVRfQlVUVE9OX1NFUEFSQVRPUl9DTEFTUyA9IGAke0NPTUJPX0JPWF9DTEFTU31fX2lucHV0LWJ1dHRvbi1zZXBhcmF0b3JgO1xuY29uc3QgVE9HR0xFX0xJU1RfQlVUVE9OX0NMQVNTID0gYCR7Q09NQk9fQk9YX0NMQVNTfV9fdG9nZ2xlLWxpc3RgO1xuY29uc3QgVE9HR0xFX0xJU1RfQlVUVE9OX1dSQVBQRVJfQ0xBU1MgPSBgJHtUT0dHTEVfTElTVF9CVVRUT05fQ0xBU1N9X193cmFwcGVyYDtcbmNvbnN0IExJU1RfQ0xBU1MgPSBgJHtDT01CT19CT1hfQ0xBU1N9X19saXN0YDtcbmNvbnN0IExJU1RfT1BUSU9OX0NMQVNTID0gYCR7Q09NQk9fQk9YX0NMQVNTfV9fbGlzdC1vcHRpb25gO1xuY29uc3QgTElTVF9PUFRJT05fRk9DVVNFRF9DTEFTUyA9IGAke0xJU1RfT1BUSU9OX0NMQVNTfS0tZm9jdXNlZGA7XG5jb25zdCBMSVNUX09QVElPTl9TRUxFQ1RFRF9DTEFTUyA9IGAke0xJU1RfT1BUSU9OX0NMQVNTfS0tc2VsZWN0ZWRgO1xuY29uc3QgU1RBVFVTX0NMQVNTID0gYCR7Q09NQk9fQk9YX0NMQVNTfV9fc3RhdHVzYDtcblxuY29uc3QgQ09NQk9fQk9YID0gYC4ke0NPTUJPX0JPWF9DTEFTU31gO1xuY29uc3QgU0VMRUNUID0gYC4ke1NFTEVDVF9DTEFTU31gO1xuY29uc3QgSU5QVVQgPSBgLiR7SU5QVVRfQ0xBU1N9YDtcbmNvbnN0IENMRUFSX0lOUFVUX0JVVFRPTiA9IGAuJHtDTEVBUl9JTlBVVF9CVVRUT05fQ0xBU1N9YDtcbmNvbnN0IFRPR0dMRV9MSVNUX0JVVFRPTiA9IGAuJHtUT0dHTEVfTElTVF9CVVRUT05fQ0xBU1N9YDtcbmNvbnN0IExJU1QgPSBgLiR7TElTVF9DTEFTU31gO1xuY29uc3QgTElTVF9PUFRJT04gPSBgLiR7TElTVF9PUFRJT05fQ0xBU1N9YDtcbmNvbnN0IExJU1RfT1BUSU9OX0ZPQ1VTRUQgPSBgLiR7TElTVF9PUFRJT05fRk9DVVNFRF9DTEFTU31gO1xuY29uc3QgTElTVF9PUFRJT05fU0VMRUNURUQgPSBgLiR7TElTVF9PUFRJT05fU0VMRUNURURfQ0xBU1N9YDtcbmNvbnN0IFNUQVRVUyA9IGAuJHtTVEFUVVNfQ0xBU1N9YDtcblxuY29uc3QgREVGQVVMVF9GSUxURVIgPSBcIi4qe3txdWVyeX19LipcIjtcblxuY29uc3Qgbm9vcCA9ICgpID0+IHt9O1xuXG4vKipcbiAqIHNldCB0aGUgdmFsdWUgb2YgdGhlIGVsZW1lbnQgYW5kIGRpc3BhdGNoIGEgY2hhbmdlIGV2ZW50XG4gKlxuICogQHBhcmFtIHtIVE1MSW5wdXRFbGVtZW50fEhUTUxTZWxlY3RFbGVtZW50fSBlbCBUaGUgZWxlbWVudCB0byB1cGRhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSBUaGUgbmV3IHZhbHVlIG9mIHRoZSBlbGVtZW50XG4gKi9cbmNvbnN0IGNoYW5nZUVsZW1lbnRWYWx1ZSA9IChlbCwgdmFsdWUgPSBcIlwiKSA9PiB7XG4gIGNvbnN0IGVsZW1lbnRUb0NoYW5nZSA9IGVsO1xuICBlbGVtZW50VG9DaGFuZ2UudmFsdWUgPSB2YWx1ZTtcblxuICBjb25zdCBldmVudCA9IG5ldyBDdXN0b21FdmVudChcImNoYW5nZVwiLCB7XG4gICAgYnViYmxlczogdHJ1ZSxcbiAgICBjYW5jZWxhYmxlOiB0cnVlLFxuICAgIGRldGFpbDogeyB2YWx1ZSB9LFxuICB9KTtcbiAgZWxlbWVudFRvQ2hhbmdlLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xufTtcblxuLyoqXG4gKiBUaGUgZWxlbWVudHMgd2l0aGluIHRoZSBjb21ibyBib3guXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBDb21ib0JveENvbnRleHRcbiAqIEBwcm9wZXJ0eSB7SFRNTEVsZW1lbnR9IGNvbWJvQm94RWxcbiAqIEBwcm9wZXJ0eSB7SFRNTFNlbGVjdEVsZW1lbnR9IHNlbGVjdEVsXG4gKiBAcHJvcGVydHkge0hUTUxJbnB1dEVsZW1lbnR9IGlucHV0RWxcbiAqIEBwcm9wZXJ0eSB7SFRNTFVMaXN0RWxlbWVudH0gbGlzdEVsXG4gKiBAcHJvcGVydHkge0hUTUxEaXZFbGVtZW50fSBzdGF0dXNFbFxuICogQHByb3BlcnR5IHtIVE1MTElFbGVtZW50fSBmb2N1c2VkT3B0aW9uRWxcbiAqIEBwcm9wZXJ0eSB7SFRNTExJRWxlbWVudH0gc2VsZWN0ZWRPcHRpb25FbFxuICogQHByb3BlcnR5IHtIVE1MQnV0dG9uRWxlbWVudH0gdG9nZ2xlTGlzdEJ0bkVsXG4gKiBAcHJvcGVydHkge0hUTUxCdXR0b25FbGVtZW50fSBjbGVhcklucHV0QnRuRWxcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gaXNQcmlzdGluZVxuICogQHByb3BlcnR5IHtib29sZWFufSBkaXNhYmxlRmlsdGVyaW5nXG4gKi9cblxuLyoqXG4gKiBHZXQgYW4gb2JqZWN0IG9mIGVsZW1lbnRzIGJlbG9uZ2luZyBkaXJlY3RseSB0byB0aGUgZ2l2ZW5cbiAqIGNvbWJvIGJveCBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgdGhlIGVsZW1lbnQgd2l0aGluIHRoZSBjb21ibyBib3hcbiAqIEByZXR1cm5zIHtDb21ib0JveENvbnRleHR9IGVsZW1lbnRzXG4gKi9cbmNvbnN0IGdldENvbWJvQm94Q29udGV4dCA9IChlbCkgPT4ge1xuICBjb25zdCBjb21ib0JveEVsID0gZWwuY2xvc2VzdChDT01CT19CT1gpO1xuXG4gIGlmICghY29tYm9Cb3hFbCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgRWxlbWVudCBpcyBtaXNzaW5nIG91dGVyICR7Q09NQk9fQk9YfWApO1xuICB9XG5cbiAgY29uc3Qgc2VsZWN0RWwgPSBjb21ib0JveEVsLnF1ZXJ5U2VsZWN0b3IoU0VMRUNUKTtcbiAgY29uc3QgaW5wdXRFbCA9IGNvbWJvQm94RWwucXVlcnlTZWxlY3RvcihJTlBVVCk7XG4gIGNvbnN0IGxpc3RFbCA9IGNvbWJvQm94RWwucXVlcnlTZWxlY3RvcihMSVNUKTtcbiAgY29uc3Qgc3RhdHVzRWwgPSBjb21ib0JveEVsLnF1ZXJ5U2VsZWN0b3IoU1RBVFVTKTtcbiAgY29uc3QgZm9jdXNlZE9wdGlvbkVsID0gY29tYm9Cb3hFbC5xdWVyeVNlbGVjdG9yKExJU1RfT1BUSU9OX0ZPQ1VTRUQpO1xuICBjb25zdCBzZWxlY3RlZE9wdGlvbkVsID0gY29tYm9Cb3hFbC5xdWVyeVNlbGVjdG9yKExJU1RfT1BUSU9OX1NFTEVDVEVEKTtcbiAgY29uc3QgdG9nZ2xlTGlzdEJ0bkVsID0gY29tYm9Cb3hFbC5xdWVyeVNlbGVjdG9yKFRPR0dMRV9MSVNUX0JVVFRPTik7XG4gIGNvbnN0IGNsZWFySW5wdXRCdG5FbCA9IGNvbWJvQm94RWwucXVlcnlTZWxlY3RvcihDTEVBUl9JTlBVVF9CVVRUT04pO1xuXG4gIGNvbnN0IGlzUHJpc3RpbmUgPSBjb21ib0JveEVsLmNsYXNzTGlzdC5jb250YWlucyhDT01CT19CT1hfUFJJU1RJTkVfQ0xBU1MpO1xuICBjb25zdCBkaXNhYmxlRmlsdGVyaW5nID0gY29tYm9Cb3hFbC5kYXRhc2V0LmRpc2FibGVGaWx0ZXJpbmcgPT09IFwidHJ1ZVwiO1xuXG4gIHJldHVybiB7XG4gICAgY29tYm9Cb3hFbCxcbiAgICBzZWxlY3RFbCxcbiAgICBpbnB1dEVsLFxuICAgIGxpc3RFbCxcbiAgICBzdGF0dXNFbCxcbiAgICBmb2N1c2VkT3B0aW9uRWwsXG4gICAgc2VsZWN0ZWRPcHRpb25FbCxcbiAgICB0b2dnbGVMaXN0QnRuRWwsXG4gICAgY2xlYXJJbnB1dEJ0bkVsLFxuICAgIGlzUHJpc3RpbmUsXG4gICAgZGlzYWJsZUZpbHRlcmluZyxcbiAgfTtcbn07XG5cbi8qKlxuICogRGlzYWJsZSB0aGUgY29tYm8tYm94IGNvbXBvbmVudFxuICpcbiAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcbiAqL1xuY29uc3QgZGlzYWJsZSA9IChlbCkgPT4ge1xuICBjb25zdCB7IGlucHV0RWwsIHRvZ2dsZUxpc3RCdG5FbCwgY2xlYXJJbnB1dEJ0bkVsIH0gPSBnZXRDb21ib0JveENvbnRleHQoZWwpO1xuXG4gIGNsZWFySW5wdXRCdG5FbC5oaWRkZW4gPSB0cnVlO1xuICBjbGVhcklucHV0QnRuRWwuZGlzYWJsZWQgPSB0cnVlO1xuICB0b2dnbGVMaXN0QnRuRWwuZGlzYWJsZWQgPSB0cnVlO1xuICBpbnB1dEVsLmRpc2FibGVkID0gdHJ1ZTtcbn07XG5cbi8qKlxuICogRW5hYmxlIHRoZSBjb21iby1ib3ggY29tcG9uZW50XG4gKlxuICogQHBhcmFtIHtIVE1MSW5wdXRFbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudFxuICovXG5jb25zdCBlbmFibGUgPSAoZWwpID0+IHtcbiAgY29uc3QgeyBpbnB1dEVsLCB0b2dnbGVMaXN0QnRuRWwsIGNsZWFySW5wdXRCdG5FbCB9ID0gZ2V0Q29tYm9Cb3hDb250ZXh0KGVsKTtcblxuICBjbGVhcklucHV0QnRuRWwuaGlkZGVuID0gZmFsc2U7XG4gIGNsZWFySW5wdXRCdG5FbC5kaXNhYmxlZCA9IGZhbHNlO1xuICB0b2dnbGVMaXN0QnRuRWwuZGlzYWJsZWQgPSBmYWxzZTtcbiAgaW5wdXRFbC5kaXNhYmxlZCA9IGZhbHNlO1xufTtcblxuLyoqXG4gKiBFbmhhbmNlIGEgc2VsZWN0IGVsZW1lbnQgaW50byBhIGNvbWJvIGJveCBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gX2NvbWJvQm94RWwgVGhlIGluaXRpYWwgZWxlbWVudCBvZiB0aGUgY29tYm8gYm94IGNvbXBvbmVudFxuICovXG5jb25zdCBlbmhhbmNlQ29tYm9Cb3ggPSAoX2NvbWJvQm94RWwpID0+IHtcbiAgY29uc3QgY29tYm9Cb3hFbCA9IF9jb21ib0JveEVsLmNsb3Nlc3QoQ09NQk9fQk9YKTtcblxuICBpZiAoY29tYm9Cb3hFbC5kYXRhc2V0LmVuaGFuY2VkKSByZXR1cm47XG5cbiAgY29uc3Qgc2VsZWN0RWwgPSBjb21ib0JveEVsLnF1ZXJ5U2VsZWN0b3IoXCJzZWxlY3RcIik7XG5cbiAgaWYgKCFzZWxlY3RFbCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHtDT01CT19CT1h9IGlzIG1pc3NpbmcgaW5uZXIgc2VsZWN0YCk7XG4gIH1cblxuICBjb25zdCBzZWxlY3RJZCA9IHNlbGVjdEVsLmlkO1xuICBjb25zdCBzZWxlY3RMYWJlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYGxhYmVsW2Zvcj1cIiR7c2VsZWN0SWR9XCJdYCk7XG4gIGNvbnN0IGxpc3RJZCA9IGAke3NlbGVjdElkfS0tbGlzdGA7XG4gIGNvbnN0IGxpc3RJZExhYmVsID0gYCR7c2VsZWN0SWR9LWxhYmVsYDtcbiAgY29uc3QgYXNzaXN0aXZlSGludElEID0gYCR7c2VsZWN0SWR9LS1hc3Npc3RpdmVIaW50YDtcbiAgY29uc3QgYWRkaXRpb25hbEF0dHJpYnV0ZXMgPSBbXTtcbiAgY29uc3QgeyBkZWZhdWx0VmFsdWUgfSA9IGNvbWJvQm94RWwuZGF0YXNldDtcbiAgY29uc3QgeyBwbGFjZWhvbGRlciB9ID0gY29tYm9Cb3hFbC5kYXRhc2V0O1xuICBsZXQgc2VsZWN0ZWRPcHRpb247XG5cbiAgaWYgKHBsYWNlaG9sZGVyKSB7XG4gICAgYWRkaXRpb25hbEF0dHJpYnV0ZXMucHVzaCh7IHBsYWNlaG9sZGVyIH0pO1xuICB9XG5cbiAgaWYgKGRlZmF1bHRWYWx1ZSkge1xuICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSBzZWxlY3RFbC5vcHRpb25zLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICBjb25zdCBvcHRpb25FbCA9IHNlbGVjdEVsLm9wdGlvbnNbaV07XG5cbiAgICAgIGlmIChvcHRpb25FbC52YWx1ZSA9PT0gZGVmYXVsdFZhbHVlKSB7XG4gICAgICAgIHNlbGVjdGVkT3B0aW9uID0gb3B0aW9uRWw7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUaHJvdyBlcnJvciBpZiBjb21ib2JveCBpcyBtaXNzaW5nIGEgbGFiZWwgb3IgbGFiZWwgaXMgbWlzc2luZ1xuICAgKiBgZm9yYCBhdHRyaWJ1dGUuIE90aGVyd2lzZSwgc2V0IHRoZSBJRCB0byBtYXRjaCB0aGUgPHVsPiBhcmlhLWxhYmVsbGVkYnlcbiAgICovXG4gIGlmICghc2VsZWN0TGFiZWwgfHwgIXNlbGVjdExhYmVsLm1hdGNoZXMoYGxhYmVsW2Zvcj1cIiR7c2VsZWN0SWR9XCJdYCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgJHtDT01CT19CT1h9IGZvciAke3NlbGVjdElkfSBpcyBlaXRoZXIgbWlzc2luZyBhIGxhYmVsIG9yIGEgXCJmb3JcIiBhdHRyaWJ1dGVgXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICBzZWxlY3RMYWJlbC5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBsaXN0SWRMYWJlbCk7XG4gIH1cblxuICBzZWxlY3RMYWJlbC5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBsaXN0SWRMYWJlbCk7XG4gIHNlbGVjdEVsLnNldEF0dHJpYnV0ZShcImFyaWEtaGlkZGVuXCIsIFwidHJ1ZVwiKTtcbiAgc2VsZWN0RWwuc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIiwgXCItMVwiKTtcbiAgc2VsZWN0RWwuY2xhc3NMaXN0LmFkZChcInVzYS1zci1vbmx5XCIsIFNFTEVDVF9DTEFTUyk7XG4gIHNlbGVjdEVsLmlkID0gXCJcIjtcbiAgc2VsZWN0RWwudmFsdWUgPSBcIlwiO1xuXG4gIFtcInJlcXVpcmVkXCIsIFwiYXJpYS1sYWJlbFwiLCBcImFyaWEtbGFiZWxsZWRieVwiXS5mb3JFYWNoKChuYW1lKSA9PiB7XG4gICAgaWYgKHNlbGVjdEVsLmhhc0F0dHJpYnV0ZShuYW1lKSkge1xuICAgICAgY29uc3QgdmFsdWUgPSBzZWxlY3RFbC5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgICBhZGRpdGlvbmFsQXR0cmlidXRlcy5wdXNoKHsgW25hbWVdOiB2YWx1ZSB9KTtcbiAgICAgIHNlbGVjdEVsLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIHNhbml0aXplIGRvZXNuJ3QgbGlrZSBmdW5jdGlvbnMgaW4gdGVtcGxhdGUgbGl0ZXJhbHNcbiAgY29uc3QgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIik7XG4gIGlucHV0LnNldEF0dHJpYnV0ZShcImlkXCIsIHNlbGVjdElkKTtcbiAgaW5wdXQuc2V0QXR0cmlidXRlKFwiYXJpYS1vd25zXCIsIGxpc3RJZCk7XG4gIGlucHV0LnNldEF0dHJpYnV0ZShcImFyaWEtY29udHJvbHNcIiwgbGlzdElkKTtcbiAgaW5wdXQuc2V0QXR0cmlidXRlKFwiYXJpYS1hdXRvY29tcGxldGVcIiwgXCJsaXN0XCIpO1xuICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWRlc2NyaWJlZGJ5XCIsIGFzc2lzdGl2ZUhpbnRJRCk7XG4gIGlucHV0LnNldEF0dHJpYnV0ZShcImFyaWEtZXhwYW5kZWRcIiwgXCJmYWxzZVwiKTtcbiAgaW5wdXQuc2V0QXR0cmlidXRlKFwiYXV0b2NhcGl0YWxpemVcIiwgXCJvZmZcIik7XG4gIGlucHV0LnNldEF0dHJpYnV0ZShcImF1dG9jb21wbGV0ZVwiLCBcIm9mZlwiKTtcbiAgaW5wdXQuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgSU5QVVRfQ0xBU1MpO1xuICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsIFwidGV4dFwiKTtcbiAgaW5wdXQuc2V0QXR0cmlidXRlKFwicm9sZVwiLCBcImNvbWJvYm94XCIpO1xuICBhZGRpdGlvbmFsQXR0cmlidXRlcy5mb3JFYWNoKChhdHRyKSA9PlxuICAgIE9iamVjdC5rZXlzKGF0dHIpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgY29uc3QgdmFsdWUgPSBTYW5pdGl6ZXIuZXNjYXBlSFRNTGAke2F0dHJba2V5XX1gO1xuICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpO1xuICAgIH0pXG4gICk7XG5cbiAgY29tYm9Cb3hFbC5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJiZWZvcmVlbmRcIiwgaW5wdXQpO1xuXG4gIGNvbWJvQm94RWwuaW5zZXJ0QWRqYWNlbnRIVE1MKFxuICAgIFwiYmVmb3JlZW5kXCIsXG4gICAgU2FuaXRpemVyLmVzY2FwZUhUTUxgXG4gICAgPHNwYW4gY2xhc3M9XCIke0NMRUFSX0lOUFVUX0JVVFRPTl9XUkFQUEVSX0NMQVNTfVwiIHRhYmluZGV4PVwiLTFcIj5cbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCIke0NMRUFSX0lOUFVUX0JVVFRPTl9DTEFTU31cIiBhcmlhLWxhYmVsPVwiQ2xlYXIgdGhlIHNlbGVjdCBjb250ZW50c1wiPiZuYnNwOzwvYnV0dG9uPlxuICAgICAgPC9zcGFuPlxuICAgICAgPHNwYW4gY2xhc3M9XCIke0lOUFVUX0JVVFRPTl9TRVBBUkFUT1JfQ0xBU1N9XCI+Jm5ic3A7PC9zcGFuPlxuICAgICAgPHNwYW4gY2xhc3M9XCIke1RPR0dMRV9MSVNUX0JVVFRPTl9XUkFQUEVSX0NMQVNTfVwiIHRhYmluZGV4PVwiLTFcIj5cbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgdGFiaW5kZXg9XCItMVwiIGNsYXNzPVwiJHtUT0dHTEVfTElTVF9CVVRUT05fQ0xBU1N9XCIgYXJpYS1sYWJlbD1cIlRvZ2dsZSB0aGUgZHJvcGRvd24gbGlzdFwiPiZuYnNwOzwvYnV0dG9uPlxuICAgICAgPC9zcGFuPlxuICAgICAgPHVsXG4gICAgICAgIHRhYmluZGV4PVwiLTFcIlxuICAgICAgICBpZD1cIiR7bGlzdElkfVwiXG4gICAgICAgIGNsYXNzPVwiJHtMSVNUX0NMQVNTfVwiXG4gICAgICAgIHJvbGU9XCJsaXN0Ym94XCJcbiAgICAgICAgYXJpYS1sYWJlbGxlZGJ5PVwiJHtsaXN0SWRMYWJlbH1cIlxuICAgICAgICBoaWRkZW4+XG4gICAgICA8L3VsPlxuICAgICAgPGRpdiBjbGFzcz1cIiR7U1RBVFVTX0NMQVNTfSB1c2Etc3Itb25seVwiIHJvbGU9XCJzdGF0dXNcIj48L2Rpdj5cbiAgICAgIDxzcGFuIGlkPVwiJHthc3Npc3RpdmVIaW50SUR9XCIgY2xhc3M9XCJ1c2Etc3Itb25seVwiPlxuICAgICAgICBXaGVuIGF1dG9jb21wbGV0ZSByZXN1bHRzIGFyZSBhdmFpbGFibGUgdXNlIHVwIGFuZCBkb3duIGFycm93cyB0byByZXZpZXcgYW5kIGVudGVyIHRvIHNlbGVjdC5cbiAgICAgICAgVG91Y2ggZGV2aWNlIHVzZXJzLCBleHBsb3JlIGJ5IHRvdWNoIG9yIHdpdGggc3dpcGUgZ2VzdHVyZXMuXG4gICAgICA8L3NwYW4+YFxuICApO1xuXG4gIGlmIChzZWxlY3RlZE9wdGlvbikge1xuICAgIGNvbnN0IHsgaW5wdXRFbCB9ID0gZ2V0Q29tYm9Cb3hDb250ZXh0KGNvbWJvQm94RWwpO1xuICAgIGNoYW5nZUVsZW1lbnRWYWx1ZShzZWxlY3RFbCwgc2VsZWN0ZWRPcHRpb24udmFsdWUpO1xuICAgIGNoYW5nZUVsZW1lbnRWYWx1ZShpbnB1dEVsLCBzZWxlY3RlZE9wdGlvbi50ZXh0KTtcbiAgICBjb21ib0JveEVsLmNsYXNzTGlzdC5hZGQoQ09NQk9fQk9YX1BSSVNUSU5FX0NMQVNTKTtcbiAgfVxuXG4gIGlmIChzZWxlY3RFbC5kaXNhYmxlZCkge1xuICAgIGRpc2FibGUoY29tYm9Cb3hFbCk7XG4gICAgc2VsZWN0RWwuZGlzYWJsZWQgPSBmYWxzZTtcbiAgfVxuXG4gIGNvbWJvQm94RWwuZGF0YXNldC5lbmhhbmNlZCA9IFwidHJ1ZVwiO1xufTtcblxuLyoqXG4gKiBNYW5hZ2UgdGhlIGZvY3VzZWQgZWxlbWVudCB3aXRoaW4gdGhlIGxpc3Qgb3B0aW9ucyB3aGVuXG4gKiBuYXZpZ2F0aW5nIHZpYSBrZXlib2FyZC5cbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBBbiBhbmNob3IgZWxlbWVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IG5leHRFbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgb3B0aW9uc1xuICogQHBhcmFtIHtib29sZWFufSBvcHRpb25zLnNraXBGb2N1cyBza2lwIGZvY3VzIG9mIGhpZ2hsaWdodGVkIGl0ZW1cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy5wcmV2ZW50U2Nyb2xsIHNob3VsZCBza2lwIHByb2NlZHVyZSB0byBzY3JvbGwgdG8gZWxlbWVudFxuICovXG5jb25zdCBoaWdobGlnaHRPcHRpb24gPSAoZWwsIG5leHRFbCwgeyBza2lwRm9jdXMsIHByZXZlbnRTY3JvbGwgfSA9IHt9KSA9PiB7XG4gIGNvbnN0IHsgaW5wdXRFbCwgbGlzdEVsLCBmb2N1c2VkT3B0aW9uRWwgfSA9IGdldENvbWJvQm94Q29udGV4dChlbCk7XG5cbiAgaWYgKGZvY3VzZWRPcHRpb25FbCkge1xuICAgIGZvY3VzZWRPcHRpb25FbC5jbGFzc0xpc3QucmVtb3ZlKExJU1RfT1BUSU9OX0ZPQ1VTRURfQ0xBU1MpO1xuICAgIGZvY3VzZWRPcHRpb25FbC5zZXRBdHRyaWJ1dGUoXCJ0YWJJbmRleFwiLCBcIi0xXCIpO1xuICB9XG5cbiAgaWYgKG5leHRFbCkge1xuICAgIGlucHV0RWwuc2V0QXR0cmlidXRlKFwiYXJpYS1hY3RpdmVkZXNjZW5kYW50XCIsIG5leHRFbC5pZCk7XG4gICAgbmV4dEVsLnNldEF0dHJpYnV0ZShcInRhYkluZGV4XCIsIFwiMFwiKTtcbiAgICBuZXh0RWwuY2xhc3NMaXN0LmFkZChMSVNUX09QVElPTl9GT0NVU0VEX0NMQVNTKTtcblxuICAgIGlmICghcHJldmVudFNjcm9sbCkge1xuICAgICAgY29uc3Qgb3B0aW9uQm90dG9tID0gbmV4dEVsLm9mZnNldFRvcCArIG5leHRFbC5vZmZzZXRIZWlnaHQ7XG4gICAgICBjb25zdCBjdXJyZW50Qm90dG9tID0gbGlzdEVsLnNjcm9sbFRvcCArIGxpc3RFbC5vZmZzZXRIZWlnaHQ7XG5cbiAgICAgIGlmIChvcHRpb25Cb3R0b20gPiBjdXJyZW50Qm90dG9tKSB7XG4gICAgICAgIGxpc3RFbC5zY3JvbGxUb3AgPSBvcHRpb25Cb3R0b20gLSBsaXN0RWwub2Zmc2V0SGVpZ2h0O1xuICAgICAgfVxuXG4gICAgICBpZiAobmV4dEVsLm9mZnNldFRvcCA8IGxpc3RFbC5zY3JvbGxUb3ApIHtcbiAgICAgICAgbGlzdEVsLnNjcm9sbFRvcCA9IG5leHRFbC5vZmZzZXRUb3A7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFza2lwRm9jdXMpIHtcbiAgICAgIG5leHRFbC5mb2N1cyh7IHByZXZlbnRTY3JvbGwgfSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlucHV0RWwuc2V0QXR0cmlidXRlKFwiYXJpYS1hY3RpdmVkZXNjZW5kYW50XCIsIFwiXCIpO1xuICAgIGlucHV0RWwuZm9jdXMoKTtcbiAgfVxufTtcblxuLyoqXG4gKiBHZW5lcmF0ZSBhIGR5bmFtaWMgcmVndWxhciBleHByZXNzaW9uIGJhc2VkIG9mZiBvZiBhIHJlcGxhY2VhYmxlIGFuZCBwb3NzaWJseSBmaWx0ZXJlZCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcbiAqIEBwYXJhbSB7c3RyaW5nfSBxdWVyeSBUaGUgdmFsdWUgdG8gdXNlIGluIHRoZSByZWd1bGFyIGV4cHJlc3Npb25cbiAqIEBwYXJhbSB7b2JqZWN0fSBleHRyYXMgQW4gb2JqZWN0IG9mIHJlZ3VsYXIgZXhwcmVzc2lvbnMgdG8gcmVwbGFjZSBhbmQgZmlsdGVyIHRoZSBxdWVyeVxuICovXG5jb25zdCBnZW5lcmF0ZUR5bmFtaWNSZWdFeHAgPSAoZmlsdGVyLCBxdWVyeSA9IFwiXCIsIGV4dHJhcyA9IHt9KSA9PiB7XG4gIGNvbnN0IGVzY2FwZVJlZ0V4cCA9ICh0ZXh0KSA9PlxuICAgIHRleHQucmVwbGFjZSgvWy1bXFxde30oKSorPy4sXFxcXF4kfCNcXHNdL2csIFwiXFxcXCQmXCIpO1xuXG4gIGxldCBmaW5kID0gZmlsdGVyLnJlcGxhY2UoL3t7KC4qPyl9fS9nLCAobSwgJDEpID0+IHtcbiAgICBjb25zdCBrZXkgPSAkMS50cmltKCk7XG4gICAgY29uc3QgcXVlcnlGaWx0ZXIgPSBleHRyYXNba2V5XTtcbiAgICBpZiAoa2V5ICE9PSBcInF1ZXJ5XCIgJiYgcXVlcnlGaWx0ZXIpIHtcbiAgICAgIGNvbnN0IG1hdGNoZXIgPSBuZXcgUmVnRXhwKHF1ZXJ5RmlsdGVyLCBcImlcIik7XG4gICAgICBjb25zdCBtYXRjaGVzID0gcXVlcnkubWF0Y2gobWF0Y2hlcik7XG5cbiAgICAgIGlmIChtYXRjaGVzKSB7XG4gICAgICAgIHJldHVybiBlc2NhcGVSZWdFeHAobWF0Y2hlc1sxXSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgICByZXR1cm4gZXNjYXBlUmVnRXhwKHF1ZXJ5KTtcbiAgfSk7XG5cbiAgZmluZCA9IGBeKD86JHtmaW5kfSkkYDtcblxuICByZXR1cm4gbmV3IFJlZ0V4cChmaW5kLCBcImlcIik7XG59O1xuXG4vKipcbiAqIERpc3BsYXkgdGhlIG9wdGlvbiBsaXN0IG9mIGEgY29tYm8gYm94IGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudFxuICovXG5jb25zdCBkaXNwbGF5TGlzdCA9IChlbCkgPT4ge1xuICBjb25zdCB7XG4gICAgY29tYm9Cb3hFbCxcbiAgICBzZWxlY3RFbCxcbiAgICBpbnB1dEVsLFxuICAgIGxpc3RFbCxcbiAgICBzdGF0dXNFbCxcbiAgICBpc1ByaXN0aW5lLFxuICAgIGRpc2FibGVGaWx0ZXJpbmcsXG4gIH0gPSBnZXRDb21ib0JveENvbnRleHQoZWwpO1xuICBsZXQgc2VsZWN0ZWRJdGVtSWQ7XG4gIGxldCBmaXJzdEZvdW5kSWQ7XG5cbiAgY29uc3QgbGlzdE9wdGlvbkJhc2VJZCA9IGAke2xpc3RFbC5pZH0tLW9wdGlvbi1gO1xuXG4gIGNvbnN0IGlucHV0VmFsdWUgPSAoaW5wdXRFbC52YWx1ZSB8fCBcIlwiKS50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBmaWx0ZXIgPSBjb21ib0JveEVsLmRhdGFzZXQuZmlsdGVyIHx8IERFRkFVTFRfRklMVEVSO1xuICBjb25zdCByZWdleCA9IGdlbmVyYXRlRHluYW1pY1JlZ0V4cChmaWx0ZXIsIGlucHV0VmFsdWUsIGNvbWJvQm94RWwuZGF0YXNldCk7XG5cbiAgY29uc3Qgb3B0aW9ucyA9IFtdO1xuICBmb3IgKGxldCBpID0gMCwgbGVuID0gc2VsZWN0RWwub3B0aW9ucy5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMSkge1xuICAgIGNvbnN0IG9wdGlvbkVsID0gc2VsZWN0RWwub3B0aW9uc1tpXTtcbiAgICBjb25zdCBvcHRpb25JZCA9IGAke2xpc3RPcHRpb25CYXNlSWR9JHtvcHRpb25zLmxlbmd0aH1gO1xuXG4gICAgaWYgKFxuICAgICAgb3B0aW9uRWwudmFsdWUgJiZcbiAgICAgIChkaXNhYmxlRmlsdGVyaW5nIHx8XG4gICAgICAgIGlzUHJpc3RpbmUgfHxcbiAgICAgICAgIWlucHV0VmFsdWUgfHxcbiAgICAgICAgcmVnZXgudGVzdChvcHRpb25FbC50ZXh0KSlcbiAgICApIHtcbiAgICAgIGlmIChzZWxlY3RFbC52YWx1ZSAmJiBvcHRpb25FbC52YWx1ZSA9PT0gc2VsZWN0RWwudmFsdWUpIHtcbiAgICAgICAgc2VsZWN0ZWRJdGVtSWQgPSBvcHRpb25JZDtcbiAgICAgIH1cblxuICAgICAgaWYgKGRpc2FibGVGaWx0ZXJpbmcgJiYgIWZpcnN0Rm91bmRJZCAmJiByZWdleC50ZXN0KG9wdGlvbkVsLnRleHQpKSB7XG4gICAgICAgIGZpcnN0Rm91bmRJZCA9IG9wdGlvbklkO1xuICAgICAgfVxuICAgICAgb3B0aW9ucy5wdXNoKG9wdGlvbkVsKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBudW1PcHRpb25zID0gb3B0aW9ucy5sZW5ndGg7XG4gIGNvbnN0IG9wdGlvbkh0bWwgPSBvcHRpb25zLm1hcCgob3B0aW9uLCBpbmRleCkgPT4ge1xuICAgIGNvbnN0IG9wdGlvbklkID0gYCR7bGlzdE9wdGlvbkJhc2VJZH0ke2luZGV4fWA7XG4gICAgY29uc3QgY2xhc3NlcyA9IFtMSVNUX09QVElPTl9DTEFTU107XG4gICAgbGV0IHRhYmluZGV4ID0gXCItMVwiO1xuICAgIGxldCBhcmlhU2VsZWN0ZWQgPSBcImZhbHNlXCI7XG5cbiAgICBpZiAob3B0aW9uSWQgPT09IHNlbGVjdGVkSXRlbUlkKSB7XG4gICAgICBjbGFzc2VzLnB1c2goTElTVF9PUFRJT05fU0VMRUNURURfQ0xBU1MsIExJU1RfT1BUSU9OX0ZPQ1VTRURfQ0xBU1MpO1xuICAgICAgdGFiaW5kZXggPSBcIjBcIjtcbiAgICAgIGFyaWFTZWxlY3RlZCA9IFwidHJ1ZVwiO1xuICAgIH1cblxuICAgIGlmICghc2VsZWN0ZWRJdGVtSWQgJiYgaW5kZXggPT09IDApIHtcbiAgICAgIGNsYXNzZXMucHVzaChMSVNUX09QVElPTl9GT0NVU0VEX0NMQVNTKTtcbiAgICAgIHRhYmluZGV4ID0gXCIwXCI7XG4gICAgfVxuXG4gICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XG5cbiAgICBsaS5zZXRBdHRyaWJ1dGUoXCJhcmlhLXNldHNpemVcIiwgb3B0aW9ucy5sZW5ndGgpO1xuICAgIGxpLnNldEF0dHJpYnV0ZShcImFyaWEtcG9zaW5zZXRcIiwgaW5kZXggKyAxKTtcbiAgICBsaS5zZXRBdHRyaWJ1dGUoXCJhcmlhLXNlbGVjdGVkXCIsIGFyaWFTZWxlY3RlZCk7XG4gICAgbGkuc2V0QXR0cmlidXRlKFwiaWRcIiwgb3B0aW9uSWQpO1xuICAgIGxpLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIGNsYXNzZXMuam9pbihcIiBcIikpO1xuICAgIGxpLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIHRhYmluZGV4KTtcbiAgICBsaS5zZXRBdHRyaWJ1dGUoXCJyb2xlXCIsIFwib3B0aW9uXCIpO1xuICAgIGxpLnNldEF0dHJpYnV0ZShcImRhdGEtdmFsdWVcIiwgb3B0aW9uLnZhbHVlKTtcbiAgICBsaS50ZXh0Q29udGVudCA9IG9wdGlvbi50ZXh0O1xuXG4gICAgcmV0dXJuIGxpO1xuICB9KTtcblxuICBjb25zdCBub1Jlc3VsdHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XG4gIG5vUmVzdWx0cy5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBgJHtMSVNUX09QVElPTl9DTEFTU30tLW5vLXJlc3VsdHNgKTtcbiAgbm9SZXN1bHRzLnRleHRDb250ZW50ID0gXCJObyByZXN1bHRzIGZvdW5kXCI7XG5cbiAgbGlzdEVsLmhpZGRlbiA9IGZhbHNlO1xuXG4gIGlmIChudW1PcHRpb25zKSB7XG4gICAgbGlzdEVsLmlubmVySFRNTCA9IFwiXCI7XG4gICAgb3B0aW9uSHRtbC5mb3JFYWNoKChpdGVtKSA9PlxuICAgICAgbGlzdEVsLmluc2VydEFkamFjZW50RWxlbWVudChcImJlZm9yZWVuZFwiLCBpdGVtKVxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgbGlzdEVsLmlubmVySFRNTCA9IFwiXCI7XG4gICAgbGlzdEVsLmluc2VydEFkamFjZW50RWxlbWVudChcImJlZm9yZWVuZFwiLCBub1Jlc3VsdHMpO1xuICB9XG5cbiAgaW5wdXRFbC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWV4cGFuZGVkXCIsIFwidHJ1ZVwiKTtcblxuICBzdGF0dXNFbC50ZXh0Q29udGVudCA9IG51bU9wdGlvbnNcbiAgICA/IGAke251bU9wdGlvbnN9IHJlc3VsdCR7bnVtT3B0aW9ucyA+IDEgPyBcInNcIiA6IFwiXCJ9IGF2YWlsYWJsZS5gXG4gICAgOiBcIk5vIHJlc3VsdHMuXCI7XG5cbiAgbGV0IGl0ZW1Ub0ZvY3VzO1xuXG4gIGlmIChpc1ByaXN0aW5lICYmIHNlbGVjdGVkSXRlbUlkKSB7XG4gICAgaXRlbVRvRm9jdXMgPSBsaXN0RWwucXVlcnlTZWxlY3RvcihgIyR7c2VsZWN0ZWRJdGVtSWR9YCk7XG4gIH0gZWxzZSBpZiAoZGlzYWJsZUZpbHRlcmluZyAmJiBmaXJzdEZvdW5kSWQpIHtcbiAgICBpdGVtVG9Gb2N1cyA9IGxpc3RFbC5xdWVyeVNlbGVjdG9yKGAjJHtmaXJzdEZvdW5kSWR9YCk7XG4gIH1cblxuICBpZiAoaXRlbVRvRm9jdXMpIHtcbiAgICBoaWdobGlnaHRPcHRpb24obGlzdEVsLCBpdGVtVG9Gb2N1cywge1xuICAgICAgc2tpcEZvY3VzOiB0cnVlLFxuICAgIH0pO1xuICB9XG59O1xuXG4vKipcbiAqIEhpZGUgdGhlIG9wdGlvbiBsaXN0IG9mIGEgY29tYm8gYm94IGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudFxuICovXG5jb25zdCBoaWRlTGlzdCA9IChlbCkgPT4ge1xuICBjb25zdCB7IGlucHV0RWwsIGxpc3RFbCwgc3RhdHVzRWwsIGZvY3VzZWRPcHRpb25FbCB9ID0gZ2V0Q29tYm9Cb3hDb250ZXh0KGVsKTtcblxuICBzdGF0dXNFbC5pbm5lckhUTUwgPSBcIlwiO1xuXG4gIGlucHV0RWwuc2V0QXR0cmlidXRlKFwiYXJpYS1leHBhbmRlZFwiLCBcImZhbHNlXCIpO1xuICBpbnB1dEVsLnNldEF0dHJpYnV0ZShcImFyaWEtYWN0aXZlZGVzY2VuZGFudFwiLCBcIlwiKTtcblxuICBpZiAoZm9jdXNlZE9wdGlvbkVsKSB7XG4gICAgZm9jdXNlZE9wdGlvbkVsLmNsYXNzTGlzdC5yZW1vdmUoTElTVF9PUFRJT05fRk9DVVNFRF9DTEFTUyk7XG4gIH1cblxuICBsaXN0RWwuc2Nyb2xsVG9wID0gMDtcbiAgbGlzdEVsLmhpZGRlbiA9IHRydWU7XG59O1xuXG4vKipcbiAqIFNlbGVjdCBhbiBvcHRpb24gbGlzdCBvZiB0aGUgY29tYm8gYm94IGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBsaXN0T3B0aW9uRWwgVGhlIGxpc3Qgb3B0aW9uIGJlaW5nIHNlbGVjdGVkXG4gKi9cbmNvbnN0IHNlbGVjdEl0ZW0gPSAobGlzdE9wdGlvbkVsKSA9PiB7XG4gIGNvbnN0IHsgY29tYm9Cb3hFbCwgc2VsZWN0RWwsIGlucHV0RWwgfSA9IGdldENvbWJvQm94Q29udGV4dChsaXN0T3B0aW9uRWwpO1xuXG4gIGNoYW5nZUVsZW1lbnRWYWx1ZShzZWxlY3RFbCwgbGlzdE9wdGlvbkVsLmRhdGFzZXQudmFsdWUpO1xuICBjaGFuZ2VFbGVtZW50VmFsdWUoaW5wdXRFbCwgbGlzdE9wdGlvbkVsLnRleHRDb250ZW50KTtcbiAgY29tYm9Cb3hFbC5jbGFzc0xpc3QuYWRkKENPTUJPX0JPWF9QUklTVElORV9DTEFTUyk7XG4gIGhpZGVMaXN0KGNvbWJvQm94RWwpO1xuICBpbnB1dEVsLmZvY3VzKCk7XG59O1xuXG4vKipcbiAqIENsZWFyIHRoZSBpbnB1dCBvZiB0aGUgY29tYm8gYm94XG4gKlxuICogQHBhcmFtIHtIVE1MQnV0dG9uRWxlbWVudH0gY2xlYXJCdXR0b25FbCBUaGUgY2xlYXIgaW5wdXQgYnV0dG9uXG4gKi9cbmNvbnN0IGNsZWFySW5wdXQgPSAoY2xlYXJCdXR0b25FbCkgPT4ge1xuICBjb25zdCB7IGNvbWJvQm94RWwsIGxpc3RFbCwgc2VsZWN0RWwsIGlucHV0RWwgfSA9XG4gICAgZ2V0Q29tYm9Cb3hDb250ZXh0KGNsZWFyQnV0dG9uRWwpO1xuICBjb25zdCBsaXN0U2hvd24gPSAhbGlzdEVsLmhpZGRlbjtcblxuICBpZiAoc2VsZWN0RWwudmFsdWUpIGNoYW5nZUVsZW1lbnRWYWx1ZShzZWxlY3RFbCk7XG4gIGlmIChpbnB1dEVsLnZhbHVlKSBjaGFuZ2VFbGVtZW50VmFsdWUoaW5wdXRFbCk7XG4gIGNvbWJvQm94RWwuY2xhc3NMaXN0LnJlbW92ZShDT01CT19CT1hfUFJJU1RJTkVfQ0xBU1MpO1xuXG4gIGlmIChsaXN0U2hvd24pIGRpc3BsYXlMaXN0KGNvbWJvQm94RWwpO1xuICBpbnB1dEVsLmZvY3VzKCk7XG59O1xuXG4vKipcbiAqIFJlc2V0IHRoZSBzZWxlY3QgYmFzZWQgb2ZmIG9mIGN1cnJlbnRseSBzZXQgc2VsZWN0IHZhbHVlXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcbiAqL1xuY29uc3QgcmVzZXRTZWxlY3Rpb24gPSAoZWwpID0+IHtcbiAgY29uc3QgeyBjb21ib0JveEVsLCBzZWxlY3RFbCwgaW5wdXRFbCB9ID0gZ2V0Q29tYm9Cb3hDb250ZXh0KGVsKTtcblxuICBjb25zdCBzZWxlY3RWYWx1ZSA9IHNlbGVjdEVsLnZhbHVlO1xuICBjb25zdCBpbnB1dFZhbHVlID0gKGlucHV0RWwudmFsdWUgfHwgXCJcIikudG9Mb3dlckNhc2UoKTtcblxuICBpZiAoc2VsZWN0VmFsdWUpIHtcbiAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gc2VsZWN0RWwub3B0aW9ucy5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMSkge1xuICAgICAgY29uc3Qgb3B0aW9uRWwgPSBzZWxlY3RFbC5vcHRpb25zW2ldO1xuICAgICAgaWYgKG9wdGlvbkVsLnZhbHVlID09PSBzZWxlY3RWYWx1ZSkge1xuICAgICAgICBpZiAoaW5wdXRWYWx1ZSAhPT0gb3B0aW9uRWwudGV4dCkge1xuICAgICAgICAgIGNoYW5nZUVsZW1lbnRWYWx1ZShpbnB1dEVsLCBvcHRpb25FbC50ZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBjb21ib0JveEVsLmNsYXNzTGlzdC5hZGQoQ09NQk9fQk9YX1BSSVNUSU5FX0NMQVNTKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChpbnB1dFZhbHVlKSB7XG4gICAgY2hhbmdlRWxlbWVudFZhbHVlKGlucHV0RWwpO1xuICB9XG59O1xuXG4vKipcbiAqIFNlbGVjdCBhbiBvcHRpb24gbGlzdCBvZiB0aGUgY29tYm8gYm94IGNvbXBvbmVudCBiYXNlZCBvZmYgb2ZcbiAqIGhhdmluZyBhIGN1cnJlbnQgZm9jdXNlZCBsaXN0IG9wdGlvbiBvclxuICogaGF2aW5nIHRlc3QgdGhhdCBjb21wbGV0ZWx5IG1hdGNoZXMgYSBsaXN0IG9wdGlvbi5cbiAqIE90aGVyd2lzZSBpdCBjbGVhcnMgdGhlIGlucHV0IGFuZCBzZWxlY3QuXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcbiAqL1xuY29uc3QgY29tcGxldGVTZWxlY3Rpb24gPSAoZWwpID0+IHtcbiAgY29uc3QgeyBjb21ib0JveEVsLCBzZWxlY3RFbCwgaW5wdXRFbCwgc3RhdHVzRWwgfSA9IGdldENvbWJvQm94Q29udGV4dChlbCk7XG5cbiAgc3RhdHVzRWwudGV4dENvbnRlbnQgPSBcIlwiO1xuXG4gIGNvbnN0IGlucHV0VmFsdWUgPSAoaW5wdXRFbC52YWx1ZSB8fCBcIlwiKS50b0xvd2VyQ2FzZSgpO1xuXG4gIGlmIChpbnB1dFZhbHVlKSB7XG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHNlbGVjdEVsLm9wdGlvbnMubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgIGNvbnN0IG9wdGlvbkVsID0gc2VsZWN0RWwub3B0aW9uc1tpXTtcbiAgICAgIGlmIChvcHRpb25FbC50ZXh0LnRvTG93ZXJDYXNlKCkgPT09IGlucHV0VmFsdWUpIHtcbiAgICAgICAgY2hhbmdlRWxlbWVudFZhbHVlKHNlbGVjdEVsLCBvcHRpb25FbC52YWx1ZSk7XG4gICAgICAgIGNoYW5nZUVsZW1lbnRWYWx1ZShpbnB1dEVsLCBvcHRpb25FbC50ZXh0KTtcbiAgICAgICAgY29tYm9Cb3hFbC5jbGFzc0xpc3QuYWRkKENPTUJPX0JPWF9QUklTVElORV9DTEFTUyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXNldFNlbGVjdGlvbihjb21ib0JveEVsKTtcbn07XG5cbi8qKlxuICogSGFuZGxlIHRoZSBlc2NhcGUgZXZlbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgQW4gZXZlbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50XG4gKi9cbmNvbnN0IGhhbmRsZUVzY2FwZSA9IChldmVudCkgPT4ge1xuICBjb25zdCB7IGNvbWJvQm94RWwsIGlucHV0RWwgfSA9IGdldENvbWJvQm94Q29udGV4dChldmVudC50YXJnZXQpO1xuXG4gIGhpZGVMaXN0KGNvbWJvQm94RWwpO1xuICByZXNldFNlbGVjdGlvbihjb21ib0JveEVsKTtcbiAgaW5wdXRFbC5mb2N1cygpO1xufTtcblxuLyoqXG4gKiBIYW5kbGUgdGhlIGRvd24gZXZlbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgQW4gZXZlbnQgd2l0aGluIHRoZSBjb21ibyBib3ggY29tcG9uZW50XG4gKi9cbmNvbnN0IGhhbmRsZURvd25Gcm9tSW5wdXQgPSAoZXZlbnQpID0+IHtcbiAgY29uc3QgeyBjb21ib0JveEVsLCBsaXN0RWwgfSA9IGdldENvbWJvQm94Q29udGV4dChldmVudC50YXJnZXQpO1xuXG4gIGlmIChsaXN0RWwuaGlkZGVuKSB7XG4gICAgZGlzcGxheUxpc3QoY29tYm9Cb3hFbCk7XG4gIH1cblxuICBjb25zdCBuZXh0T3B0aW9uRWwgPVxuICAgIGxpc3RFbC5xdWVyeVNlbGVjdG9yKExJU1RfT1BUSU9OX0ZPQ1VTRUQpIHx8XG4gICAgbGlzdEVsLnF1ZXJ5U2VsZWN0b3IoTElTVF9PUFRJT04pO1xuXG4gIGlmIChuZXh0T3B0aW9uRWwpIHtcbiAgICBoaWdobGlnaHRPcHRpb24oY29tYm9Cb3hFbCwgbmV4dE9wdGlvbkVsKTtcbiAgfVxuXG4gIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG59O1xuXG4vKipcbiAqIEhhbmRsZSB0aGUgZW50ZXIgZXZlbnQgZnJvbSBhbiBpbnB1dCBlbGVtZW50IHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IEFuIGV2ZW50IHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudFxuICovXG5jb25zdCBoYW5kbGVFbnRlckZyb21JbnB1dCA9IChldmVudCkgPT4ge1xuICBjb25zdCB7IGNvbWJvQm94RWwsIGxpc3RFbCB9ID0gZ2V0Q29tYm9Cb3hDb250ZXh0KGV2ZW50LnRhcmdldCk7XG4gIGNvbnN0IGxpc3RTaG93biA9ICFsaXN0RWwuaGlkZGVuO1xuXG4gIGNvbXBsZXRlU2VsZWN0aW9uKGNvbWJvQm94RWwpO1xuXG4gIGlmIChsaXN0U2hvd24pIHtcbiAgICBoaWRlTGlzdChjb21ib0JveEVsKTtcbiAgfVxuXG4gIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG59O1xuXG4vKipcbiAqIEhhbmRsZSB0aGUgZG93biBldmVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCBBbiBldmVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcbiAqL1xuY29uc3QgaGFuZGxlRG93bkZyb21MaXN0T3B0aW9uID0gKGV2ZW50KSA9PiB7XG4gIGNvbnN0IGZvY3VzZWRPcHRpb25FbCA9IGV2ZW50LnRhcmdldDtcbiAgY29uc3QgbmV4dE9wdGlvbkVsID0gZm9jdXNlZE9wdGlvbkVsLm5leHRTaWJsaW5nO1xuXG4gIGlmIChuZXh0T3B0aW9uRWwpIHtcbiAgICBoaWdobGlnaHRPcHRpb24oZm9jdXNlZE9wdGlvbkVsLCBuZXh0T3B0aW9uRWwpO1xuICB9XG5cbiAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbn07XG5cbi8qKlxuICogSGFuZGxlIHRoZSB0YWIgZXZlbnQgZnJvbSBhbiBsaXN0IG9wdGlvbiBlbGVtZW50IHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IEFuIGV2ZW50IHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudFxuICovXG5jb25zdCBoYW5kbGVUYWJGcm9tTGlzdE9wdGlvbiA9IChldmVudCkgPT4ge1xuICBzZWxlY3RJdGVtKGV2ZW50LnRhcmdldCk7XG4gIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG59O1xuXG4vKipcbiAqIEhhbmRsZSB0aGUgZW50ZXIgZXZlbnQgZnJvbSBsaXN0IG9wdGlvbiB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCBBbiBldmVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcbiAqL1xuY29uc3QgaGFuZGxlRW50ZXJGcm9tTGlzdE9wdGlvbiA9IChldmVudCkgPT4ge1xuICBzZWxlY3RJdGVtKGV2ZW50LnRhcmdldCk7XG4gIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG59O1xuXG4vKipcbiAqIEhhbmRsZSB0aGUgdXAgZXZlbnQgZnJvbSBsaXN0IG9wdGlvbiB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCBBbiBldmVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcbiAqL1xuY29uc3QgaGFuZGxlVXBGcm9tTGlzdE9wdGlvbiA9IChldmVudCkgPT4ge1xuICBjb25zdCB7IGNvbWJvQm94RWwsIGxpc3RFbCwgZm9jdXNlZE9wdGlvbkVsIH0gPSBnZXRDb21ib0JveENvbnRleHQoXG4gICAgZXZlbnQudGFyZ2V0XG4gICk7XG4gIGNvbnN0IG5leHRPcHRpb25FbCA9IGZvY3VzZWRPcHRpb25FbCAmJiBmb2N1c2VkT3B0aW9uRWwucHJldmlvdXNTaWJsaW5nO1xuICBjb25zdCBsaXN0U2hvd24gPSAhbGlzdEVsLmhpZGRlbjtcblxuICBoaWdobGlnaHRPcHRpb24oY29tYm9Cb3hFbCwgbmV4dE9wdGlvbkVsKTtcblxuICBpZiAobGlzdFNob3duKSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgfVxuXG4gIGlmICghbmV4dE9wdGlvbkVsKSB7XG4gICAgaGlkZUxpc3QoY29tYm9Cb3hFbCk7XG4gIH1cbn07XG5cbi8qKlxuICogU2VsZWN0IGxpc3Qgb3B0aW9uIG9uIHRoZSBtb3VzZW92ZXIgZXZlbnQuXG4gKlxuICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCBUaGUgbW91c2VvdmVyIGV2ZW50XG4gKiBAcGFyYW0ge0hUTUxMSUVsZW1lbnR9IGxpc3RPcHRpb25FbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgY29tYm8gYm94IGNvbXBvbmVudFxuICovXG5jb25zdCBoYW5kbGVNb3VzZW92ZXIgPSAobGlzdE9wdGlvbkVsKSA9PiB7XG4gIGNvbnN0IGlzQ3VycmVudGx5Rm9jdXNlZCA9IGxpc3RPcHRpb25FbC5jbGFzc0xpc3QuY29udGFpbnMoXG4gICAgTElTVF9PUFRJT05fRk9DVVNFRF9DTEFTU1xuICApO1xuXG4gIGlmIChpc0N1cnJlbnRseUZvY3VzZWQpIHJldHVybjtcblxuICBoaWdobGlnaHRPcHRpb24obGlzdE9wdGlvbkVsLCBsaXN0T3B0aW9uRWwsIHtcbiAgICBwcmV2ZW50U2Nyb2xsOiB0cnVlLFxuICB9KTtcbn07XG5cbi8qKlxuICogVG9nZ2xlIHRoZSBsaXN0IHdoZW4gdGhlIGJ1dHRvbiBpcyBjbGlja2VkXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcbiAqL1xuY29uc3QgdG9nZ2xlTGlzdCA9IChlbCkgPT4ge1xuICBjb25zdCB7IGNvbWJvQm94RWwsIGxpc3RFbCwgaW5wdXRFbCB9ID0gZ2V0Q29tYm9Cb3hDb250ZXh0KGVsKTtcblxuICBpZiAobGlzdEVsLmhpZGRlbikge1xuICAgIGRpc3BsYXlMaXN0KGNvbWJvQm94RWwpO1xuICB9IGVsc2Uge1xuICAgIGhpZGVMaXN0KGNvbWJvQm94RWwpO1xuICB9XG5cbiAgaW5wdXRFbC5mb2N1cygpO1xufTtcblxuLyoqXG4gKiBIYW5kbGUgY2xpY2sgZnJvbSBpbnB1dFxuICpcbiAqIEBwYXJhbSB7SFRNTElucHV0RWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGNvbWJvIGJveCBjb21wb25lbnRcbiAqL1xuY29uc3QgaGFuZGxlQ2xpY2tGcm9tSW5wdXQgPSAoZWwpID0+IHtcbiAgY29uc3QgeyBjb21ib0JveEVsLCBsaXN0RWwgfSA9IGdldENvbWJvQm94Q29udGV4dChlbCk7XG5cbiAgaWYgKGxpc3RFbC5oaWRkZW4pIHtcbiAgICBkaXNwbGF5TGlzdChjb21ib0JveEVsKTtcbiAgfVxufTtcblxuY29uc3QgY29tYm9Cb3ggPSBiZWhhdmlvcihcbiAge1xuICAgIFtDTElDS106IHtcbiAgICAgIFtJTlBVVF0oKSB7XG4gICAgICAgIGlmICh0aGlzLmRpc2FibGVkKSByZXR1cm47XG4gICAgICAgIGhhbmRsZUNsaWNrRnJvbUlucHV0KHRoaXMpO1xuICAgICAgfSxcbiAgICAgIFtUT0dHTEVfTElTVF9CVVRUT05dKCkge1xuICAgICAgICBpZiAodGhpcy5kaXNhYmxlZCkgcmV0dXJuO1xuICAgICAgICB0b2dnbGVMaXN0KHRoaXMpO1xuICAgICAgfSxcbiAgICAgIFtMSVNUX09QVElPTl0oKSB7XG4gICAgICAgIGlmICh0aGlzLmRpc2FibGVkKSByZXR1cm47XG4gICAgICAgIHNlbGVjdEl0ZW0odGhpcyk7XG4gICAgICB9LFxuICAgICAgW0NMRUFSX0lOUFVUX0JVVFRPTl0oKSB7XG4gICAgICAgIGlmICh0aGlzLmRpc2FibGVkKSByZXR1cm47XG4gICAgICAgIGNsZWFySW5wdXQodGhpcyk7XG4gICAgICB9LFxuICAgIH0sXG4gICAgZm9jdXNvdXQ6IHtcbiAgICAgIFtDT01CT19CT1hdKGV2ZW50KSB7XG4gICAgICAgIGlmICghdGhpcy5jb250YWlucyhldmVudC5yZWxhdGVkVGFyZ2V0KSkge1xuICAgICAgICAgIHJlc2V0U2VsZWN0aW9uKHRoaXMpO1xuICAgICAgICAgIGhpZGVMaXN0KHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0sXG4gICAga2V5ZG93bjoge1xuICAgICAgW0NPTUJPX0JPWF06IGtleW1hcCh7XG4gICAgICAgIEVzY2FwZTogaGFuZGxlRXNjYXBlLFxuICAgICAgfSksXG4gICAgICBbSU5QVVRdOiBrZXltYXAoe1xuICAgICAgICBFbnRlcjogaGFuZGxlRW50ZXJGcm9tSW5wdXQsXG4gICAgICAgIEFycm93RG93bjogaGFuZGxlRG93bkZyb21JbnB1dCxcbiAgICAgICAgRG93bjogaGFuZGxlRG93bkZyb21JbnB1dCxcbiAgICAgIH0pLFxuICAgICAgW0xJU1RfT1BUSU9OXToga2V5bWFwKHtcbiAgICAgICAgQXJyb3dVcDogaGFuZGxlVXBGcm9tTGlzdE9wdGlvbixcbiAgICAgICAgVXA6IGhhbmRsZVVwRnJvbUxpc3RPcHRpb24sXG4gICAgICAgIEFycm93RG93bjogaGFuZGxlRG93bkZyb21MaXN0T3B0aW9uLFxuICAgICAgICBEb3duOiBoYW5kbGVEb3duRnJvbUxpc3RPcHRpb24sXG4gICAgICAgIEVudGVyOiBoYW5kbGVFbnRlckZyb21MaXN0T3B0aW9uLFxuICAgICAgICBUYWI6IGhhbmRsZVRhYkZyb21MaXN0T3B0aW9uLFxuICAgICAgICBcIlNoaWZ0K1RhYlwiOiBub29wLFxuICAgICAgfSksXG4gICAgfSxcbiAgICBpbnB1dDoge1xuICAgICAgW0lOUFVUXSgpIHtcbiAgICAgICAgY29uc3QgY29tYm9Cb3hFbCA9IHRoaXMuY2xvc2VzdChDT01CT19CT1gpO1xuICAgICAgICBjb21ib0JveEVsLmNsYXNzTGlzdC5yZW1vdmUoQ09NQk9fQk9YX1BSSVNUSU5FX0NMQVNTKTtcbiAgICAgICAgZGlzcGxheUxpc3QodGhpcyk7XG4gICAgICB9LFxuICAgIH0sXG4gICAgbW91c2VvdmVyOiB7XG4gICAgICBbTElTVF9PUFRJT05dKCkge1xuICAgICAgICBoYW5kbGVNb3VzZW92ZXIodGhpcyk7XG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIHtcbiAgICBpbml0KHJvb3QpIHtcbiAgICAgIHNlbGVjdE9yTWF0Y2hlcyhDT01CT19CT1gsIHJvb3QpLmZvckVhY2goKGNvbWJvQm94RWwpID0+IHtcbiAgICAgICAgZW5oYW5jZUNvbWJvQm94KGNvbWJvQm94RWwpO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBnZXRDb21ib0JveENvbnRleHQsXG4gICAgZW5oYW5jZUNvbWJvQm94LFxuICAgIGdlbmVyYXRlRHluYW1pY1JlZ0V4cCxcbiAgICBkaXNhYmxlLFxuICAgIGVuYWJsZSxcbiAgICBkaXNwbGF5TGlzdCxcbiAgICBoaWRlTGlzdCxcbiAgICBDT01CT19CT1hfQ0xBU1MsXG4gIH1cbik7XG5cbm1vZHVsZS5leHBvcnRzID0gY29tYm9Cb3g7XG4iLCJjb25zdCBrZXltYXAgPSByZXF1aXJlKFwicmVjZXB0b3Iva2V5bWFwXCIpO1xuY29uc3QgYmVoYXZpb3IgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvYmVoYXZpb3JcIik7XG5jb25zdCBzZWxlY3QgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2VsZWN0XCIpO1xuY29uc3Qgc2VsZWN0T3JNYXRjaGVzID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3NlbGVjdC1vci1tYXRjaGVzXCIpO1xuY29uc3QgeyBwcmVmaXg6IFBSRUZJWCB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2NvbmZpZ1wiKTtcbmNvbnN0IHsgQ0xJQ0sgfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9ldmVudHNcIik7XG5jb25zdCBhY3RpdmVFbGVtZW50ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2FjdGl2ZS1lbGVtZW50XCIpO1xuY29uc3QgaXNJb3NEZXZpY2UgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvaXMtaW9zLWRldmljZVwiKTtcbmNvbnN0IFNhbml0aXplciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zYW5pdGl6ZXJcIik7XG5cbmNvbnN0IERBVEVfUElDS0VSX0NMQVNTID0gYCR7UFJFRklYfS1kYXRlLXBpY2tlcmA7XG5jb25zdCBEQVRFX1BJQ0tFUl9XUkFQUEVSX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0xBU1N9X193cmFwcGVyYDtcbmNvbnN0IERBVEVfUElDS0VSX0lOSVRJQUxJWkVEX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0xBU1N9LS1pbml0aWFsaXplZGA7XG5jb25zdCBEQVRFX1BJQ0tFUl9BQ1RJVkVfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DTEFTU30tLWFjdGl2ZWA7XG5jb25zdCBEQVRFX1BJQ0tFUl9JTlRFUk5BTF9JTlBVVF9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NMQVNTfV9faW50ZXJuYWwtaW5wdXRgO1xuY29uc3QgREFURV9QSUNLRVJfRVhURVJOQUxfSU5QVVRfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DTEFTU31fX2V4dGVybmFsLWlucHV0YDtcbmNvbnN0IERBVEVfUElDS0VSX0JVVFRPTl9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NMQVNTfV9fYnV0dG9uYDtcbmNvbnN0IERBVEVfUElDS0VSX0NBTEVOREFSX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0xBU1N9X19jYWxlbmRhcmA7XG5jb25zdCBEQVRFX1BJQ0tFUl9TVEFUVVNfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DTEFTU31fX3N0YXR1c2A7XG5jb25zdCBDQUxFTkRBUl9EQVRFX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1N9X19kYXRlYDtcblxuY29uc3QgQ0FMRU5EQVJfREFURV9GT0NVU0VEX0NMQVNTID0gYCR7Q0FMRU5EQVJfREFURV9DTEFTU30tLWZvY3VzZWRgO1xuY29uc3QgQ0FMRU5EQVJfREFURV9TRUxFQ1RFRF9DTEFTUyA9IGAke0NBTEVOREFSX0RBVEVfQ0xBU1N9LS1zZWxlY3RlZGA7XG5jb25zdCBDQUxFTkRBUl9EQVRFX1BSRVZJT1VTX01PTlRIX0NMQVNTID0gYCR7Q0FMRU5EQVJfREFURV9DTEFTU30tLXByZXZpb3VzLW1vbnRoYDtcbmNvbnN0IENBTEVOREFSX0RBVEVfQ1VSUkVOVF9NT05USF9DTEFTUyA9IGAke0NBTEVOREFSX0RBVEVfQ0xBU1N9LS1jdXJyZW50LW1vbnRoYDtcbmNvbnN0IENBTEVOREFSX0RBVEVfTkVYVF9NT05USF9DTEFTUyA9IGAke0NBTEVOREFSX0RBVEVfQ0xBU1N9LS1uZXh0LW1vbnRoYDtcbmNvbnN0IENBTEVOREFSX0RBVEVfUkFOR0VfREFURV9DTEFTUyA9IGAke0NBTEVOREFSX0RBVEVfQ0xBU1N9LS1yYW5nZS1kYXRlYDtcbmNvbnN0IENBTEVOREFSX0RBVEVfVE9EQVlfQ0xBU1MgPSBgJHtDQUxFTkRBUl9EQVRFX0NMQVNTfS0tdG9kYXlgO1xuY29uc3QgQ0FMRU5EQVJfREFURV9SQU5HRV9EQVRFX1NUQVJUX0NMQVNTID0gYCR7Q0FMRU5EQVJfREFURV9DTEFTU30tLXJhbmdlLWRhdGUtc3RhcnRgO1xuY29uc3QgQ0FMRU5EQVJfREFURV9SQU5HRV9EQVRFX0VORF9DTEFTUyA9IGAke0NBTEVOREFSX0RBVEVfQ0xBU1N9LS1yYW5nZS1kYXRlLWVuZGA7XG5jb25zdCBDQUxFTkRBUl9EQVRFX1dJVEhJTl9SQU5HRV9DTEFTUyA9IGAke0NBTEVOREFSX0RBVEVfQ0xBU1N9LS13aXRoaW4tcmFuZ2VgO1xuY29uc3QgQ0FMRU5EQVJfUFJFVklPVVNfWUVBUl9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NBTEVOREFSX0NMQVNTfV9fcHJldmlvdXMteWVhcmA7XG5jb25zdCBDQUxFTkRBUl9QUkVWSU9VU19NT05USF9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NBTEVOREFSX0NMQVNTfV9fcHJldmlvdXMtbW9udGhgO1xuY29uc3QgQ0FMRU5EQVJfTkVYVF9ZRUFSX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1N9X19uZXh0LXllYXJgO1xuY29uc3QgQ0FMRU5EQVJfTkVYVF9NT05USF9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NBTEVOREFSX0NMQVNTfV9fbmV4dC1tb250aGA7XG5jb25zdCBDQUxFTkRBUl9NT05USF9TRUxFQ1RJT05fQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31fX21vbnRoLXNlbGVjdGlvbmA7XG5jb25zdCBDQUxFTkRBUl9ZRUFSX1NFTEVDVElPTl9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NBTEVOREFSX0NMQVNTfV9feWVhci1zZWxlY3Rpb25gO1xuY29uc3QgQ0FMRU5EQVJfTU9OVEhfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31fX21vbnRoYDtcbmNvbnN0IENBTEVOREFSX01PTlRIX0ZPQ1VTRURfQ0xBU1MgPSBgJHtDQUxFTkRBUl9NT05USF9DTEFTU30tLWZvY3VzZWRgO1xuY29uc3QgQ0FMRU5EQVJfTU9OVEhfU0VMRUNURURfQ0xBU1MgPSBgJHtDQUxFTkRBUl9NT05USF9DTEFTU30tLXNlbGVjdGVkYDtcbmNvbnN0IENBTEVOREFSX1lFQVJfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31fX3llYXJgO1xuY29uc3QgQ0FMRU5EQVJfWUVBUl9GT0NVU0VEX0NMQVNTID0gYCR7Q0FMRU5EQVJfWUVBUl9DTEFTU30tLWZvY3VzZWRgO1xuY29uc3QgQ0FMRU5EQVJfWUVBUl9TRUxFQ1RFRF9DTEFTUyA9IGAke0NBTEVOREFSX1lFQVJfQ0xBU1N9LS1zZWxlY3RlZGA7XG5jb25zdCBDQUxFTkRBUl9QUkVWSU9VU19ZRUFSX0NIVU5LX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1N9X19wcmV2aW91cy15ZWFyLWNodW5rYDtcbmNvbnN0IENBTEVOREFSX05FWFRfWUVBUl9DSFVOS19DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NBTEVOREFSX0NMQVNTfV9fbmV4dC15ZWFyLWNodW5rYDtcbmNvbnN0IENBTEVOREFSX0RBVEVfUElDS0VSX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1N9X19kYXRlLXBpY2tlcmA7XG5jb25zdCBDQUxFTkRBUl9NT05USF9QSUNLRVJfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31fX21vbnRoLXBpY2tlcmA7XG5jb25zdCBDQUxFTkRBUl9ZRUFSX1BJQ0tFUl9DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NBTEVOREFSX0NMQVNTfV9feWVhci1waWNrZXJgO1xuY29uc3QgQ0FMRU5EQVJfVEFCTEVfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31fX3RhYmxlYDtcbmNvbnN0IENBTEVOREFSX1JPV19DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NBTEVOREFSX0NMQVNTfV9fcm93YDtcbmNvbnN0IENBTEVOREFSX0NFTExfQ0xBU1MgPSBgJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31fX2NlbGxgO1xuY29uc3QgQ0FMRU5EQVJfQ0VMTF9DRU5URVJfSVRFTVNfQ0xBU1MgPSBgJHtDQUxFTkRBUl9DRUxMX0NMQVNTfS0tY2VudGVyLWl0ZW1zYDtcbmNvbnN0IENBTEVOREFSX01PTlRIX0xBQkVMX0NMQVNTID0gYCR7REFURV9QSUNLRVJfQ0FMRU5EQVJfQ0xBU1N9X19tb250aC1sYWJlbGA7XG5jb25zdCBDQUxFTkRBUl9EQVlfT0ZfV0VFS19DTEFTUyA9IGAke0RBVEVfUElDS0VSX0NBTEVOREFSX0NMQVNTfV9fZGF5LW9mLXdlZWtgO1xuXG5jb25zdCBEQVRFX1BJQ0tFUiA9IGAuJHtEQVRFX1BJQ0tFUl9DTEFTU31gO1xuY29uc3QgREFURV9QSUNLRVJfQlVUVE9OID0gYC4ke0RBVEVfUElDS0VSX0JVVFRPTl9DTEFTU31gO1xuY29uc3QgREFURV9QSUNLRVJfSU5URVJOQUxfSU5QVVQgPSBgLiR7REFURV9QSUNLRVJfSU5URVJOQUxfSU5QVVRfQ0xBU1N9YDtcbmNvbnN0IERBVEVfUElDS0VSX0VYVEVSTkFMX0lOUFVUID0gYC4ke0RBVEVfUElDS0VSX0VYVEVSTkFMX0lOUFVUX0NMQVNTfWA7XG5jb25zdCBEQVRFX1BJQ0tFUl9DQUxFTkRBUiA9IGAuJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31gO1xuY29uc3QgREFURV9QSUNLRVJfU1RBVFVTID0gYC4ke0RBVEVfUElDS0VSX1NUQVRVU19DTEFTU31gO1xuY29uc3QgQ0FMRU5EQVJfREFURSA9IGAuJHtDQUxFTkRBUl9EQVRFX0NMQVNTfWA7XG5jb25zdCBDQUxFTkRBUl9EQVRFX0ZPQ1VTRUQgPSBgLiR7Q0FMRU5EQVJfREFURV9GT0NVU0VEX0NMQVNTfWA7XG5jb25zdCBDQUxFTkRBUl9EQVRFX0NVUlJFTlRfTU9OVEggPSBgLiR7Q0FMRU5EQVJfREFURV9DVVJSRU5UX01PTlRIX0NMQVNTfWA7XG5jb25zdCBDQUxFTkRBUl9QUkVWSU9VU19ZRUFSID0gYC4ke0NBTEVOREFSX1BSRVZJT1VTX1lFQVJfQ0xBU1N9YDtcbmNvbnN0IENBTEVOREFSX1BSRVZJT1VTX01PTlRIID0gYC4ke0NBTEVOREFSX1BSRVZJT1VTX01PTlRIX0NMQVNTfWA7XG5jb25zdCBDQUxFTkRBUl9ORVhUX1lFQVIgPSBgLiR7Q0FMRU5EQVJfTkVYVF9ZRUFSX0NMQVNTfWA7XG5jb25zdCBDQUxFTkRBUl9ORVhUX01PTlRIID0gYC4ke0NBTEVOREFSX05FWFRfTU9OVEhfQ0xBU1N9YDtcbmNvbnN0IENBTEVOREFSX1lFQVJfU0VMRUNUSU9OID0gYC4ke0NBTEVOREFSX1lFQVJfU0VMRUNUSU9OX0NMQVNTfWA7XG5jb25zdCBDQUxFTkRBUl9NT05USF9TRUxFQ1RJT04gPSBgLiR7Q0FMRU5EQVJfTU9OVEhfU0VMRUNUSU9OX0NMQVNTfWA7XG5jb25zdCBDQUxFTkRBUl9NT05USCA9IGAuJHtDQUxFTkRBUl9NT05USF9DTEFTU31gO1xuY29uc3QgQ0FMRU5EQVJfWUVBUiA9IGAuJHtDQUxFTkRBUl9ZRUFSX0NMQVNTfWA7XG5jb25zdCBDQUxFTkRBUl9QUkVWSU9VU19ZRUFSX0NIVU5LID0gYC4ke0NBTEVOREFSX1BSRVZJT1VTX1lFQVJfQ0hVTktfQ0xBU1N9YDtcbmNvbnN0IENBTEVOREFSX05FWFRfWUVBUl9DSFVOSyA9IGAuJHtDQUxFTkRBUl9ORVhUX1lFQVJfQ0hVTktfQ0xBU1N9YDtcbmNvbnN0IENBTEVOREFSX0RBVEVfUElDS0VSID0gYC4ke0NBTEVOREFSX0RBVEVfUElDS0VSX0NMQVNTfWA7XG5jb25zdCBDQUxFTkRBUl9NT05USF9QSUNLRVIgPSBgLiR7Q0FMRU5EQVJfTU9OVEhfUElDS0VSX0NMQVNTfWA7XG5jb25zdCBDQUxFTkRBUl9ZRUFSX1BJQ0tFUiA9IGAuJHtDQUxFTkRBUl9ZRUFSX1BJQ0tFUl9DTEFTU31gO1xuY29uc3QgQ0FMRU5EQVJfTU9OVEhfRk9DVVNFRCA9IGAuJHtDQUxFTkRBUl9NT05USF9GT0NVU0VEX0NMQVNTfWA7XG5jb25zdCBDQUxFTkRBUl9ZRUFSX0ZPQ1VTRUQgPSBgLiR7Q0FMRU5EQVJfWUVBUl9GT0NVU0VEX0NMQVNTfWA7XG5cbmNvbnN0IFZBTElEQVRJT05fTUVTU0FHRSA9IFwiUGxlYXNlIGVudGVyIGEgdmFsaWQgZGF0ZVwiO1xuXG5jb25zdCBNT05USF9MQUJFTFMgPSBbXG4gIFwiSmFudWFyeVwiLFxuICBcIkZlYnJ1YXJ5XCIsXG4gIFwiTWFyY2hcIixcbiAgXCJBcHJpbFwiLFxuICBcIk1heVwiLFxuICBcIkp1bmVcIixcbiAgXCJKdWx5XCIsXG4gIFwiQXVndXN0XCIsXG4gIFwiU2VwdGVtYmVyXCIsXG4gIFwiT2N0b2JlclwiLFxuICBcIk5vdmVtYmVyXCIsXG4gIFwiRGVjZW1iZXJcIixcbl07XG5cbmNvbnN0IERBWV9PRl9XRUVLX0xBQkVMUyA9IFtcbiAgXCJTdW5kYXlcIixcbiAgXCJNb25kYXlcIixcbiAgXCJUdWVzZGF5XCIsXG4gIFwiV2VkbmVzZGF5XCIsXG4gIFwiVGh1cnNkYXlcIixcbiAgXCJGcmlkYXlcIixcbiAgXCJTYXR1cmRheVwiLFxuXTtcblxuY29uc3QgRU5URVJfS0VZQ09ERSA9IDEzO1xuXG5jb25zdCBZRUFSX0NIVU5LID0gMTI7XG5cbmNvbnN0IERFRkFVTFRfTUlOX0RBVEUgPSBcIjAwMDAtMDEtMDFcIjtcbmNvbnN0IERFRkFVTFRfRVhURVJOQUxfREFURV9GT1JNQVQgPSBcIk1NL0REL1lZWVlcIjtcbmNvbnN0IElOVEVSTkFMX0RBVEVfRk9STUFUID0gXCJZWVlZLU1NLUREXCI7XG5cbmNvbnN0IE5PVF9ESVNBQkxFRF9TRUxFQ1RPUiA9IFwiOm5vdChbZGlzYWJsZWRdKVwiO1xuXG5jb25zdCBwcm9jZXNzRm9jdXNhYmxlU2VsZWN0b3JzID0gKC4uLnNlbGVjdG9ycykgPT5cbiAgc2VsZWN0b3JzLm1hcCgocXVlcnkpID0+IHF1ZXJ5ICsgTk9UX0RJU0FCTEVEX1NFTEVDVE9SKS5qb2luKFwiLCBcIik7XG5cbmNvbnN0IERBVEVfUElDS0VSX0ZPQ1VTQUJMRSA9IHByb2Nlc3NGb2N1c2FibGVTZWxlY3RvcnMoXG4gIENBTEVOREFSX1BSRVZJT1VTX1lFQVIsXG4gIENBTEVOREFSX1BSRVZJT1VTX01PTlRILFxuICBDQUxFTkRBUl9ZRUFSX1NFTEVDVElPTixcbiAgQ0FMRU5EQVJfTU9OVEhfU0VMRUNUSU9OLFxuICBDQUxFTkRBUl9ORVhUX1lFQVIsXG4gIENBTEVOREFSX05FWFRfTU9OVEgsXG4gIENBTEVOREFSX0RBVEVfRk9DVVNFRFxuKTtcblxuY29uc3QgTU9OVEhfUElDS0VSX0ZPQ1VTQUJMRSA9IHByb2Nlc3NGb2N1c2FibGVTZWxlY3RvcnMoXG4gIENBTEVOREFSX01PTlRIX0ZPQ1VTRURcbik7XG5cbmNvbnN0IFlFQVJfUElDS0VSX0ZPQ1VTQUJMRSA9IHByb2Nlc3NGb2N1c2FibGVTZWxlY3RvcnMoXG4gIENBTEVOREFSX1BSRVZJT1VTX1lFQVJfQ0hVTkssXG4gIENBTEVOREFSX05FWFRfWUVBUl9DSFVOSyxcbiAgQ0FMRU5EQVJfWUVBUl9GT0NVU0VEXG4pO1xuXG4vLyAjcmVnaW9uIERhdGUgTWFuaXB1bGF0aW9uIEZ1bmN0aW9uc1xuXG4vKipcbiAqIEtlZXAgZGF0ZSB3aXRoaW4gbW9udGguIE1vbnRoIHdvdWxkIG9ubHkgYmUgb3ZlciBieSAxIHRvIDMgZGF5c1xuICpcbiAqIEBwYXJhbSB7RGF0ZX0gZGF0ZVRvQ2hlY2sgdGhlIGRhdGUgb2JqZWN0IHRvIGNoZWNrXG4gKiBAcGFyYW0ge251bWJlcn0gbW9udGggdGhlIGNvcnJlY3QgbW9udGhcbiAqIEByZXR1cm5zIHtEYXRlfSB0aGUgZGF0ZSwgY29ycmVjdGVkIGlmIG5lZWRlZFxuICovXG5jb25zdCBrZWVwRGF0ZVdpdGhpbk1vbnRoID0gKGRhdGVUb0NoZWNrLCBtb250aCkgPT4ge1xuICBpZiAobW9udGggIT09IGRhdGVUb0NoZWNrLmdldE1vbnRoKCkpIHtcbiAgICBkYXRlVG9DaGVjay5zZXREYXRlKDApO1xuICB9XG5cbiAgcmV0dXJuIGRhdGVUb0NoZWNrO1xufTtcblxuLyoqXG4gKiBTZXQgZGF0ZSBmcm9tIG1vbnRoIGRheSB5ZWFyXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHllYXIgdGhlIHllYXIgdG8gc2V0XG4gKiBAcGFyYW0ge251bWJlcn0gbW9udGggdGhlIG1vbnRoIHRvIHNldCAoemVyby1pbmRleGVkKVxuICogQHBhcmFtIHtudW1iZXJ9IGRhdGUgdGhlIGRhdGUgdG8gc2V0XG4gKiBAcmV0dXJucyB7RGF0ZX0gdGhlIHNldCBkYXRlXG4gKi9cbmNvbnN0IHNldERhdGUgPSAoeWVhciwgbW9udGgsIGRhdGUpID0+IHtcbiAgY29uc3QgbmV3RGF0ZSA9IG5ldyBEYXRlKDApO1xuICBuZXdEYXRlLnNldEZ1bGxZZWFyKHllYXIsIG1vbnRoLCBkYXRlKTtcbiAgcmV0dXJuIG5ld0RhdGU7XG59O1xuXG4vKipcbiAqIHRvZGF5cyBkYXRlXG4gKlxuICogQHJldHVybnMge0RhdGV9IHRvZGF5cyBkYXRlXG4gKi9cbmNvbnN0IHRvZGF5ID0gKCkgPT4ge1xuICBjb25zdCBuZXdEYXRlID0gbmV3IERhdGUoKTtcbiAgY29uc3QgZGF5ID0gbmV3RGF0ZS5nZXREYXRlKCk7XG4gIGNvbnN0IG1vbnRoID0gbmV3RGF0ZS5nZXRNb250aCgpO1xuICBjb25zdCB5ZWFyID0gbmV3RGF0ZS5nZXRGdWxsWWVhcigpO1xuICByZXR1cm4gc2V0RGF0ZSh5ZWFyLCBtb250aCwgZGF5KTtcbn07XG5cbi8qKlxuICogU2V0IGRhdGUgdG8gZmlyc3QgZGF5IG9mIHRoZSBtb250aFxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBkYXRlIHRoZSBkYXRlIHRvIGFkanVzdFxuICogQHJldHVybnMge0RhdGV9IHRoZSBhZGp1c3RlZCBkYXRlXG4gKi9cbmNvbnN0IHN0YXJ0T2ZNb250aCA9IChkYXRlKSA9PiB7XG4gIGNvbnN0IG5ld0RhdGUgPSBuZXcgRGF0ZSgwKTtcbiAgbmV3RGF0ZS5zZXRGdWxsWWVhcihkYXRlLmdldEZ1bGxZZWFyKCksIGRhdGUuZ2V0TW9udGgoKSwgMSk7XG4gIHJldHVybiBuZXdEYXRlO1xufTtcblxuLyoqXG4gKiBTZXQgZGF0ZSB0byBsYXN0IGRheSBvZiB0aGUgbW9udGhcbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gZGF0ZSB0aGUgZGF0ZSB0byBhZGp1c3RcbiAqIEByZXR1cm5zIHtEYXRlfSB0aGUgYWRqdXN0ZWQgZGF0ZVxuICovXG5jb25zdCBsYXN0RGF5T2ZNb250aCA9IChkYXRlKSA9PiB7XG4gIGNvbnN0IG5ld0RhdGUgPSBuZXcgRGF0ZSgwKTtcbiAgbmV3RGF0ZS5zZXRGdWxsWWVhcihkYXRlLmdldEZ1bGxZZWFyKCksIGRhdGUuZ2V0TW9udGgoKSArIDEsIDApO1xuICByZXR1cm4gbmV3RGF0ZTtcbn07XG5cbi8qKlxuICogQWRkIGRheXMgdG8gZGF0ZVxuICpcbiAqIEBwYXJhbSB7RGF0ZX0gX2RhdGUgdGhlIGRhdGUgdG8gYWRqdXN0XG4gKiBAcGFyYW0ge251bWJlcn0gbnVtRGF5cyB0aGUgZGlmZmVyZW5jZSBpbiBkYXlzXG4gKiBAcmV0dXJucyB7RGF0ZX0gdGhlIGFkanVzdGVkIGRhdGVcbiAqL1xuY29uc3QgYWRkRGF5cyA9IChfZGF0ZSwgbnVtRGF5cykgPT4ge1xuICBjb25zdCBuZXdEYXRlID0gbmV3IERhdGUoX2RhdGUuZ2V0VGltZSgpKTtcbiAgbmV3RGF0ZS5zZXREYXRlKG5ld0RhdGUuZ2V0RGF0ZSgpICsgbnVtRGF5cyk7XG4gIHJldHVybiBuZXdEYXRlO1xufTtcblxuLyoqXG4gKiBTdWJ0cmFjdCBkYXlzIGZyb20gZGF0ZVxuICpcbiAqIEBwYXJhbSB7RGF0ZX0gX2RhdGUgdGhlIGRhdGUgdG8gYWRqdXN0XG4gKiBAcGFyYW0ge251bWJlcn0gbnVtRGF5cyB0aGUgZGlmZmVyZW5jZSBpbiBkYXlzXG4gKiBAcmV0dXJucyB7RGF0ZX0gdGhlIGFkanVzdGVkIGRhdGVcbiAqL1xuY29uc3Qgc3ViRGF5cyA9IChfZGF0ZSwgbnVtRGF5cykgPT4gYWRkRGF5cyhfZGF0ZSwgLW51bURheXMpO1xuXG4vKipcbiAqIEFkZCB3ZWVrcyB0byBkYXRlXG4gKlxuICogQHBhcmFtIHtEYXRlfSBfZGF0ZSB0aGUgZGF0ZSB0byBhZGp1c3RcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW1XZWVrcyB0aGUgZGlmZmVyZW5jZSBpbiB3ZWVrc1xuICogQHJldHVybnMge0RhdGV9IHRoZSBhZGp1c3RlZCBkYXRlXG4gKi9cbmNvbnN0IGFkZFdlZWtzID0gKF9kYXRlLCBudW1XZWVrcykgPT4gYWRkRGF5cyhfZGF0ZSwgbnVtV2Vla3MgKiA3KTtcblxuLyoqXG4gKiBTdWJ0cmFjdCB3ZWVrcyBmcm9tIGRhdGVcbiAqXG4gKiBAcGFyYW0ge0RhdGV9IF9kYXRlIHRoZSBkYXRlIHRvIGFkanVzdFxuICogQHBhcmFtIHtudW1iZXJ9IG51bVdlZWtzIHRoZSBkaWZmZXJlbmNlIGluIHdlZWtzXG4gKiBAcmV0dXJucyB7RGF0ZX0gdGhlIGFkanVzdGVkIGRhdGVcbiAqL1xuY29uc3Qgc3ViV2Vla3MgPSAoX2RhdGUsIG51bVdlZWtzKSA9PiBhZGRXZWVrcyhfZGF0ZSwgLW51bVdlZWtzKTtcblxuLyoqXG4gKiBTZXQgZGF0ZSB0byB0aGUgc3RhcnQgb2YgdGhlIHdlZWsgKFN1bmRheSlcbiAqXG4gKiBAcGFyYW0ge0RhdGV9IF9kYXRlIHRoZSBkYXRlIHRvIGFkanVzdFxuICogQHJldHVybnMge0RhdGV9IHRoZSBhZGp1c3RlZCBkYXRlXG4gKi9cbmNvbnN0IHN0YXJ0T2ZXZWVrID0gKF9kYXRlKSA9PiB7XG4gIGNvbnN0IGRheU9mV2VlayA9IF9kYXRlLmdldERheSgpO1xuICByZXR1cm4gc3ViRGF5cyhfZGF0ZSwgZGF5T2ZXZWVrKTtcbn07XG5cbi8qKlxuICogU2V0IGRhdGUgdG8gdGhlIGVuZCBvZiB0aGUgd2VlayAoU2F0dXJkYXkpXG4gKlxuICogQHBhcmFtIHtEYXRlfSBfZGF0ZSB0aGUgZGF0ZSB0byBhZGp1c3RcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW1XZWVrcyB0aGUgZGlmZmVyZW5jZSBpbiB3ZWVrc1xuICogQHJldHVybnMge0RhdGV9IHRoZSBhZGp1c3RlZCBkYXRlXG4gKi9cbmNvbnN0IGVuZE9mV2VlayA9IChfZGF0ZSkgPT4ge1xuICBjb25zdCBkYXlPZldlZWsgPSBfZGF0ZS5nZXREYXkoKTtcbiAgcmV0dXJuIGFkZERheXMoX2RhdGUsIDYgLSBkYXlPZldlZWspO1xufTtcblxuLyoqXG4gKiBBZGQgbW9udGhzIHRvIGRhdGUgYW5kIGtlZXAgZGF0ZSB3aXRoaW4gbW9udGhcbiAqXG4gKiBAcGFyYW0ge0RhdGV9IF9kYXRlIHRoZSBkYXRlIHRvIGFkanVzdFxuICogQHBhcmFtIHtudW1iZXJ9IG51bU1vbnRocyB0aGUgZGlmZmVyZW5jZSBpbiBtb250aHNcbiAqIEByZXR1cm5zIHtEYXRlfSB0aGUgYWRqdXN0ZWQgZGF0ZVxuICovXG5jb25zdCBhZGRNb250aHMgPSAoX2RhdGUsIG51bU1vbnRocykgPT4ge1xuICBjb25zdCBuZXdEYXRlID0gbmV3IERhdGUoX2RhdGUuZ2V0VGltZSgpKTtcblxuICBjb25zdCBkYXRlTW9udGggPSAobmV3RGF0ZS5nZXRNb250aCgpICsgMTIgKyBudW1Nb250aHMpICUgMTI7XG4gIG5ld0RhdGUuc2V0TW9udGgobmV3RGF0ZS5nZXRNb250aCgpICsgbnVtTW9udGhzKTtcbiAga2VlcERhdGVXaXRoaW5Nb250aChuZXdEYXRlLCBkYXRlTW9udGgpO1xuXG4gIHJldHVybiBuZXdEYXRlO1xufTtcblxuLyoqXG4gKiBTdWJ0cmFjdCBtb250aHMgZnJvbSBkYXRlXG4gKlxuICogQHBhcmFtIHtEYXRlfSBfZGF0ZSB0aGUgZGF0ZSB0byBhZGp1c3RcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW1Nb250aHMgdGhlIGRpZmZlcmVuY2UgaW4gbW9udGhzXG4gKiBAcmV0dXJucyB7RGF0ZX0gdGhlIGFkanVzdGVkIGRhdGVcbiAqL1xuY29uc3Qgc3ViTW9udGhzID0gKF9kYXRlLCBudW1Nb250aHMpID0+IGFkZE1vbnRocyhfZGF0ZSwgLW51bU1vbnRocyk7XG5cbi8qKlxuICogQWRkIHllYXJzIHRvIGRhdGUgYW5kIGtlZXAgZGF0ZSB3aXRoaW4gbW9udGhcbiAqXG4gKiBAcGFyYW0ge0RhdGV9IF9kYXRlIHRoZSBkYXRlIHRvIGFkanVzdFxuICogQHBhcmFtIHtudW1iZXJ9IG51bVllYXJzIHRoZSBkaWZmZXJlbmNlIGluIHllYXJzXG4gKiBAcmV0dXJucyB7RGF0ZX0gdGhlIGFkanVzdGVkIGRhdGVcbiAqL1xuY29uc3QgYWRkWWVhcnMgPSAoX2RhdGUsIG51bVllYXJzKSA9PiBhZGRNb250aHMoX2RhdGUsIG51bVllYXJzICogMTIpO1xuXG4vKipcbiAqIFN1YnRyYWN0IHllYXJzIGZyb20gZGF0ZVxuICpcbiAqIEBwYXJhbSB7RGF0ZX0gX2RhdGUgdGhlIGRhdGUgdG8gYWRqdXN0XG4gKiBAcGFyYW0ge251bWJlcn0gbnVtWWVhcnMgdGhlIGRpZmZlcmVuY2UgaW4geWVhcnNcbiAqIEByZXR1cm5zIHtEYXRlfSB0aGUgYWRqdXN0ZWQgZGF0ZVxuICovXG5jb25zdCBzdWJZZWFycyA9IChfZGF0ZSwgbnVtWWVhcnMpID0+IGFkZFllYXJzKF9kYXRlLCAtbnVtWWVhcnMpO1xuXG4vKipcbiAqIFNldCBtb250aHMgb2YgZGF0ZVxuICpcbiAqIEBwYXJhbSB7RGF0ZX0gX2RhdGUgdGhlIGRhdGUgdG8gYWRqdXN0XG4gKiBAcGFyYW0ge251bWJlcn0gbW9udGggemVyby1pbmRleGVkIG1vbnRoIHRvIHNldFxuICogQHJldHVybnMge0RhdGV9IHRoZSBhZGp1c3RlZCBkYXRlXG4gKi9cbmNvbnN0IHNldE1vbnRoID0gKF9kYXRlLCBtb250aCkgPT4ge1xuICBjb25zdCBuZXdEYXRlID0gbmV3IERhdGUoX2RhdGUuZ2V0VGltZSgpKTtcblxuICBuZXdEYXRlLnNldE1vbnRoKG1vbnRoKTtcbiAga2VlcERhdGVXaXRoaW5Nb250aChuZXdEYXRlLCBtb250aCk7XG5cbiAgcmV0dXJuIG5ld0RhdGU7XG59O1xuXG4vKipcbiAqIFNldCB5ZWFyIG9mIGRhdGVcbiAqXG4gKiBAcGFyYW0ge0RhdGV9IF9kYXRlIHRoZSBkYXRlIHRvIGFkanVzdFxuICogQHBhcmFtIHtudW1iZXJ9IHllYXIgdGhlIHllYXIgdG8gc2V0XG4gKiBAcmV0dXJucyB7RGF0ZX0gdGhlIGFkanVzdGVkIGRhdGVcbiAqL1xuY29uc3Qgc2V0WWVhciA9IChfZGF0ZSwgeWVhcikgPT4ge1xuICBjb25zdCBuZXdEYXRlID0gbmV3IERhdGUoX2RhdGUuZ2V0VGltZSgpKTtcblxuICBjb25zdCBtb250aCA9IG5ld0RhdGUuZ2V0TW9udGgoKTtcbiAgbmV3RGF0ZS5zZXRGdWxsWWVhcih5ZWFyKTtcbiAga2VlcERhdGVXaXRoaW5Nb250aChuZXdEYXRlLCBtb250aCk7XG5cbiAgcmV0dXJuIG5ld0RhdGU7XG59O1xuXG4vKipcbiAqIFJldHVybiB0aGUgZWFybGllc3QgZGF0ZVxuICpcbiAqIEBwYXJhbSB7RGF0ZX0gZGF0ZUEgZGF0ZSB0byBjb21wYXJlXG4gKiBAcGFyYW0ge0RhdGV9IGRhdGVCIGRhdGUgdG8gY29tcGFyZVxuICogQHJldHVybnMge0RhdGV9IHRoZSBlYXJsaWVzdCBkYXRlXG4gKi9cbmNvbnN0IG1pbiA9IChkYXRlQSwgZGF0ZUIpID0+IHtcbiAgbGV0IG5ld0RhdGUgPSBkYXRlQTtcblxuICBpZiAoZGF0ZUIgPCBkYXRlQSkge1xuICAgIG5ld0RhdGUgPSBkYXRlQjtcbiAgfVxuXG4gIHJldHVybiBuZXcgRGF0ZShuZXdEYXRlLmdldFRpbWUoKSk7XG59O1xuXG4vKipcbiAqIFJldHVybiB0aGUgbGF0ZXN0IGRhdGVcbiAqXG4gKiBAcGFyYW0ge0RhdGV9IGRhdGVBIGRhdGUgdG8gY29tcGFyZVxuICogQHBhcmFtIHtEYXRlfSBkYXRlQiBkYXRlIHRvIGNvbXBhcmVcbiAqIEByZXR1cm5zIHtEYXRlfSB0aGUgbGF0ZXN0IGRhdGVcbiAqL1xuY29uc3QgbWF4ID0gKGRhdGVBLCBkYXRlQikgPT4ge1xuICBsZXQgbmV3RGF0ZSA9IGRhdGVBO1xuXG4gIGlmIChkYXRlQiA+IGRhdGVBKSB7XG4gICAgbmV3RGF0ZSA9IGRhdGVCO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBEYXRlKG5ld0RhdGUuZ2V0VGltZSgpKTtcbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgZGF0ZXMgYXJlIHRoZSBpbiB0aGUgc2FtZSB5ZWFyXG4gKlxuICogQHBhcmFtIHtEYXRlfSBkYXRlQSBkYXRlIHRvIGNvbXBhcmVcbiAqIEBwYXJhbSB7RGF0ZX0gZGF0ZUIgZGF0ZSB0byBjb21wYXJlXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gYXJlIGRhdGVzIGluIHRoZSBzYW1lIHllYXJcbiAqL1xuY29uc3QgaXNTYW1lWWVhciA9IChkYXRlQSwgZGF0ZUIpID0+XG4gIGRhdGVBICYmIGRhdGVCICYmIGRhdGVBLmdldEZ1bGxZZWFyKCkgPT09IGRhdGVCLmdldEZ1bGxZZWFyKCk7XG5cbi8qKlxuICogQ2hlY2sgaWYgZGF0ZXMgYXJlIHRoZSBpbiB0aGUgc2FtZSBtb250aFxuICpcbiAqIEBwYXJhbSB7RGF0ZX0gZGF0ZUEgZGF0ZSB0byBjb21wYXJlXG4gKiBAcGFyYW0ge0RhdGV9IGRhdGVCIGRhdGUgdG8gY29tcGFyZVxuICogQHJldHVybnMge2Jvb2xlYW59IGFyZSBkYXRlcyBpbiB0aGUgc2FtZSBtb250aFxuICovXG5jb25zdCBpc1NhbWVNb250aCA9IChkYXRlQSwgZGF0ZUIpID0+XG4gIGlzU2FtZVllYXIoZGF0ZUEsIGRhdGVCKSAmJiBkYXRlQS5nZXRNb250aCgpID09PSBkYXRlQi5nZXRNb250aCgpO1xuXG4vKipcbiAqIENoZWNrIGlmIGRhdGVzIGFyZSB0aGUgc2FtZSBkYXRlXG4gKlxuICogQHBhcmFtIHtEYXRlfSBkYXRlQSB0aGUgZGF0ZSB0byBjb21wYXJlXG4gKiBAcGFyYW0ge0RhdGV9IGRhdGVBIHRoZSBkYXRlIHRvIGNvbXBhcmVcbiAqIEByZXR1cm5zIHtib29sZWFufSBhcmUgZGF0ZXMgdGhlIHNhbWUgZGF0ZVxuICovXG5jb25zdCBpc1NhbWVEYXkgPSAoZGF0ZUEsIGRhdGVCKSA9PlxuICBpc1NhbWVNb250aChkYXRlQSwgZGF0ZUIpICYmIGRhdGVBLmdldERhdGUoKSA9PT0gZGF0ZUIuZ2V0RGF0ZSgpO1xuXG4vKipcbiAqIHJldHVybiBhIG5ldyBkYXRlIHdpdGhpbiBtaW5pbXVtIGFuZCBtYXhpbXVtIGRhdGVcbiAqXG4gKiBAcGFyYW0ge0RhdGV9IGRhdGUgZGF0ZSB0byBjaGVja1xuICogQHBhcmFtIHtEYXRlfSBtaW5EYXRlIG1pbmltdW0gZGF0ZSB0byBhbGxvd1xuICogQHBhcmFtIHtEYXRlfSBtYXhEYXRlIG1heGltdW0gZGF0ZSB0byBhbGxvd1xuICogQHJldHVybnMge0RhdGV9IHRoZSBkYXRlIGJldHdlZW4gbWluIGFuZCBtYXhcbiAqL1xuY29uc3Qga2VlcERhdGVCZXR3ZWVuTWluQW5kTWF4ID0gKGRhdGUsIG1pbkRhdGUsIG1heERhdGUpID0+IHtcbiAgbGV0IG5ld0RhdGUgPSBkYXRlO1xuXG4gIGlmIChkYXRlIDwgbWluRGF0ZSkge1xuICAgIG5ld0RhdGUgPSBtaW5EYXRlO1xuICB9IGVsc2UgaWYgKG1heERhdGUgJiYgZGF0ZSA+IG1heERhdGUpIHtcbiAgICBuZXdEYXRlID0gbWF4RGF0ZTtcbiAgfVxuXG4gIHJldHVybiBuZXcgRGF0ZShuZXdEYXRlLmdldFRpbWUoKSk7XG59O1xuXG4vKipcbiAqIENoZWNrIGlmIGRhdGVzIGlzIHZhbGlkLlxuICpcbiAqIEBwYXJhbSB7RGF0ZX0gZGF0ZSBkYXRlIHRvIGNoZWNrXG4gKiBAcGFyYW0ge0RhdGV9IG1pbkRhdGUgbWluaW11bSBkYXRlIHRvIGFsbG93XG4gKiBAcGFyYW0ge0RhdGV9IG1heERhdGUgbWF4aW11bSBkYXRlIHRvIGFsbG93XG4gKiBAcmV0dXJuIHtib29sZWFufSBpcyB0aGVyZSBhIGRheSB3aXRoaW4gdGhlIG1vbnRoIHdpdGhpbiBtaW4gYW5kIG1heCBkYXRlc1xuICovXG5jb25zdCBpc0RhdGVXaXRoaW5NaW5BbmRNYXggPSAoZGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSkgPT5cbiAgZGF0ZSA+PSBtaW5EYXRlICYmICghbWF4RGF0ZSB8fCBkYXRlIDw9IG1heERhdGUpO1xuXG4vKipcbiAqIENoZWNrIGlmIGRhdGVzIG1vbnRoIGlzIGludmFsaWQuXG4gKlxuICogQHBhcmFtIHtEYXRlfSBkYXRlIGRhdGUgdG8gY2hlY2tcbiAqIEBwYXJhbSB7RGF0ZX0gbWluRGF0ZSBtaW5pbXVtIGRhdGUgdG8gYWxsb3dcbiAqIEBwYXJhbSB7RGF0ZX0gbWF4RGF0ZSBtYXhpbXVtIGRhdGUgdG8gYWxsb3dcbiAqIEByZXR1cm4ge2Jvb2xlYW59IGlzIHRoZSBtb250aCBvdXRzaWRlIG1pbiBvciBtYXggZGF0ZXNcbiAqL1xuY29uc3QgaXNEYXRlc01vbnRoT3V0c2lkZU1pbk9yTWF4ID0gKGRhdGUsIG1pbkRhdGUsIG1heERhdGUpID0+XG4gIGxhc3REYXlPZk1vbnRoKGRhdGUpIDwgbWluRGF0ZSB8fCAobWF4RGF0ZSAmJiBzdGFydE9mTW9udGgoZGF0ZSkgPiBtYXhEYXRlKTtcblxuLyoqXG4gKiBDaGVjayBpZiBkYXRlcyB5ZWFyIGlzIGludmFsaWQuXG4gKlxuICogQHBhcmFtIHtEYXRlfSBkYXRlIGRhdGUgdG8gY2hlY2tcbiAqIEBwYXJhbSB7RGF0ZX0gbWluRGF0ZSBtaW5pbXVtIGRhdGUgdG8gYWxsb3dcbiAqIEBwYXJhbSB7RGF0ZX0gbWF4RGF0ZSBtYXhpbXVtIGRhdGUgdG8gYWxsb3dcbiAqIEByZXR1cm4ge2Jvb2xlYW59IGlzIHRoZSBtb250aCBvdXRzaWRlIG1pbiBvciBtYXggZGF0ZXNcbiAqL1xuY29uc3QgaXNEYXRlc1llYXJPdXRzaWRlTWluT3JNYXggPSAoZGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSkgPT5cbiAgbGFzdERheU9mTW9udGgoc2V0TW9udGgoZGF0ZSwgMTEpKSA8IG1pbkRhdGUgfHxcbiAgKG1heERhdGUgJiYgc3RhcnRPZk1vbnRoKHNldE1vbnRoKGRhdGUsIDApKSA+IG1heERhdGUpO1xuXG4vKipcbiAqIFBhcnNlIGEgZGF0ZSB3aXRoIGZvcm1hdCBNLUQtWVlcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gZGF0ZVN0cmluZyB0aGUgZGF0ZSBzdHJpbmcgdG8gcGFyc2VcbiAqIEBwYXJhbSB7c3RyaW5nfSBkYXRlRm9ybWF0IHRoZSBmb3JtYXQgb2YgdGhlIGRhdGUgc3RyaW5nXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGFkanVzdERhdGUgc2hvdWxkIHRoZSBkYXRlIGJlIGFkanVzdGVkXG4gKiBAcmV0dXJucyB7RGF0ZX0gdGhlIHBhcnNlZCBkYXRlXG4gKi9cbmNvbnN0IHBhcnNlRGF0ZVN0cmluZyA9IChcbiAgZGF0ZVN0cmluZyxcbiAgZGF0ZUZvcm1hdCA9IElOVEVSTkFMX0RBVEVfRk9STUFULFxuICBhZGp1c3REYXRlID0gZmFsc2VcbikgPT4ge1xuICBsZXQgZGF0ZTtcbiAgbGV0IG1vbnRoO1xuICBsZXQgZGF5O1xuICBsZXQgeWVhcjtcbiAgbGV0IHBhcnNlZDtcblxuICBpZiAoZGF0ZVN0cmluZykge1xuICAgIGxldCBtb250aFN0cjtcbiAgICBsZXQgZGF5U3RyO1xuICAgIGxldCB5ZWFyU3RyO1xuXG4gICAgaWYgKGRhdGVGb3JtYXQgPT09IERFRkFVTFRfRVhURVJOQUxfREFURV9GT1JNQVQpIHtcbiAgICAgIFttb250aFN0ciwgZGF5U3RyLCB5ZWFyU3RyXSA9IGRhdGVTdHJpbmcuc3BsaXQoXCIvXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBbeWVhclN0ciwgbW9udGhTdHIsIGRheVN0cl0gPSBkYXRlU3RyaW5nLnNwbGl0KFwiLVwiKTtcbiAgICB9XG5cbiAgICBpZiAoeWVhclN0cikge1xuICAgICAgcGFyc2VkID0gcGFyc2VJbnQoeWVhclN0ciwgMTApO1xuICAgICAgaWYgKCFOdW1iZXIuaXNOYU4ocGFyc2VkKSkge1xuICAgICAgICB5ZWFyID0gcGFyc2VkO1xuICAgICAgICBpZiAoYWRqdXN0RGF0ZSkge1xuICAgICAgICAgIHllYXIgPSBNYXRoLm1heCgwLCB5ZWFyKTtcbiAgICAgICAgICBpZiAoeWVhclN0ci5sZW5ndGggPCAzKSB7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50WWVhciA9IHRvZGF5KCkuZ2V0RnVsbFllYXIoKTtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRZZWFyU3R1YiA9XG4gICAgICAgICAgICAgIGN1cnJlbnRZZWFyIC0gKGN1cnJlbnRZZWFyICUgMTAgKiogeWVhclN0ci5sZW5ndGgpO1xuICAgICAgICAgICAgeWVhciA9IGN1cnJlbnRZZWFyU3R1YiArIHBhcnNlZDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobW9udGhTdHIpIHtcbiAgICAgIHBhcnNlZCA9IHBhcnNlSW50KG1vbnRoU3RyLCAxMCk7XG4gICAgICBpZiAoIU51bWJlci5pc05hTihwYXJzZWQpKSB7XG4gICAgICAgIG1vbnRoID0gcGFyc2VkO1xuICAgICAgICBpZiAoYWRqdXN0RGF0ZSkge1xuICAgICAgICAgIG1vbnRoID0gTWF0aC5tYXgoMSwgbW9udGgpO1xuICAgICAgICAgIG1vbnRoID0gTWF0aC5taW4oMTIsIG1vbnRoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChtb250aCAmJiBkYXlTdHIgJiYgeWVhciAhPSBudWxsKSB7XG4gICAgICBwYXJzZWQgPSBwYXJzZUludChkYXlTdHIsIDEwKTtcbiAgICAgIGlmICghTnVtYmVyLmlzTmFOKHBhcnNlZCkpIHtcbiAgICAgICAgZGF5ID0gcGFyc2VkO1xuICAgICAgICBpZiAoYWRqdXN0RGF0ZSkge1xuICAgICAgICAgIGNvbnN0IGxhc3REYXlPZlRoZU1vbnRoID0gc2V0RGF0ZSh5ZWFyLCBtb250aCwgMCkuZ2V0RGF0ZSgpO1xuICAgICAgICAgIGRheSA9IE1hdGgubWF4KDEsIGRheSk7XG4gICAgICAgICAgZGF5ID0gTWF0aC5taW4obGFzdERheU9mVGhlTW9udGgsIGRheSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobW9udGggJiYgZGF5ICYmIHllYXIgIT0gbnVsbCkge1xuICAgICAgZGF0ZSA9IHNldERhdGUoeWVhciwgbW9udGggLSAxLCBkYXkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBkYXRlO1xufTtcblxuLyoqXG4gKiBGb3JtYXQgYSBkYXRlIHRvIGZvcm1hdCBNTS1ERC1ZWVlZXG4gKlxuICogQHBhcmFtIHtEYXRlfSBkYXRlIHRoZSBkYXRlIHRvIGZvcm1hdFxuICogQHBhcmFtIHtzdHJpbmd9IGRhdGVGb3JtYXQgdGhlIGZvcm1hdCBvZiB0aGUgZGF0ZSBzdHJpbmdcbiAqIEByZXR1cm5zIHtzdHJpbmd9IHRoZSBmb3JtYXR0ZWQgZGF0ZSBzdHJpbmdcbiAqL1xuY29uc3QgZm9ybWF0RGF0ZSA9IChkYXRlLCBkYXRlRm9ybWF0ID0gSU5URVJOQUxfREFURV9GT1JNQVQpID0+IHtcbiAgY29uc3QgcGFkWmVyb3MgPSAodmFsdWUsIGxlbmd0aCkgPT4gYDAwMDAke3ZhbHVlfWAuc2xpY2UoLWxlbmd0aCk7XG5cbiAgY29uc3QgbW9udGggPSBkYXRlLmdldE1vbnRoKCkgKyAxO1xuICBjb25zdCBkYXkgPSBkYXRlLmdldERhdGUoKTtcbiAgY29uc3QgeWVhciA9IGRhdGUuZ2V0RnVsbFllYXIoKTtcblxuICBpZiAoZGF0ZUZvcm1hdCA9PT0gREVGQVVMVF9FWFRFUk5BTF9EQVRFX0ZPUk1BVCkge1xuICAgIHJldHVybiBbcGFkWmVyb3MobW9udGgsIDIpLCBwYWRaZXJvcyhkYXksIDIpLCBwYWRaZXJvcyh5ZWFyLCA0KV0uam9pbihcIi9cIik7XG4gIH1cblxuICByZXR1cm4gW3BhZFplcm9zKHllYXIsIDQpLCBwYWRaZXJvcyhtb250aCwgMiksIHBhZFplcm9zKGRheSwgMildLmpvaW4oXCItXCIpO1xufTtcblxuLy8gI2VuZHJlZ2lvbiBEYXRlIE1hbmlwdWxhdGlvbiBGdW5jdGlvbnNcblxuLyoqXG4gKiBDcmVhdGUgYSBncmlkIHN0cmluZyBmcm9tIGFuIGFycmF5IG9mIGh0bWwgc3RyaW5nc1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nW119IGh0bWxBcnJheSB0aGUgYXJyYXkgb2YgaHRtbCBpdGVtc1xuICogQHBhcmFtIHtudW1iZXJ9IHJvd1NpemUgdGhlIGxlbmd0aCBvZiBhIHJvd1xuICogQHJldHVybnMge3N0cmluZ30gdGhlIGdyaWQgc3RyaW5nXG4gKi9cbmNvbnN0IGxpc3RUb0dyaWRIdG1sID0gKGh0bWxBcnJheSwgcm93U2l6ZSkgPT4ge1xuICBjb25zdCBncmlkID0gW107XG4gIGxldCByb3cgPSBbXTtcblxuICBsZXQgaSA9IDA7XG4gIHdoaWxlIChpIDwgaHRtbEFycmF5Lmxlbmd0aCkge1xuICAgIHJvdyA9IFtdO1xuXG4gICAgY29uc3QgdHIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidHJcIik7XG4gICAgd2hpbGUgKGkgPCBodG1sQXJyYXkubGVuZ3RoICYmIHJvdy5sZW5ndGggPCByb3dTaXplKSB7XG4gICAgICBjb25zdCB0ZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZFwiKTtcbiAgICAgIHRkLmluc2VydEFkamFjZW50RWxlbWVudChcImJlZm9yZWVuZFwiLCBodG1sQXJyYXlbaV0pO1xuICAgICAgcm93LnB1c2godGQpO1xuICAgICAgaSArPSAxO1xuICAgIH1cblxuICAgIHJvdy5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG4gICAgICB0ci5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJiZWZvcmVlbmRcIiwgZWxlbWVudCk7XG4gICAgfSk7XG5cbiAgICBncmlkLnB1c2godHIpO1xuICB9XG5cbiAgcmV0dXJuIGdyaWQ7XG59O1xuXG5jb25zdCBjcmVhdGVUYWJsZUJvZHkgPSAoZ3JpZCkgPT4ge1xuICBjb25zdCB0YWJsZUJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGJvZHlcIik7XG4gIGdyaWQuZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xuICAgIHRhYmxlQm9keS5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJiZWZvcmVlbmRcIiwgZWxlbWVudCk7XG4gIH0pO1xuXG4gIHJldHVybiB0YWJsZUJvZHk7XG59O1xuXG4vKipcbiAqIHNldCB0aGUgdmFsdWUgb2YgdGhlIGVsZW1lbnQgYW5kIGRpc3BhdGNoIGEgY2hhbmdlIGV2ZW50XG4gKlxuICogQHBhcmFtIHtIVE1MSW5wdXRFbGVtZW50fSBlbCBUaGUgZWxlbWVudCB0byB1cGRhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSBUaGUgbmV3IHZhbHVlIG9mIHRoZSBlbGVtZW50XG4gKi9cbmNvbnN0IGNoYW5nZUVsZW1lbnRWYWx1ZSA9IChlbCwgdmFsdWUgPSBcIlwiKSA9PiB7XG4gIGNvbnN0IGVsZW1lbnRUb0NoYW5nZSA9IGVsO1xuICBlbGVtZW50VG9DaGFuZ2UudmFsdWUgPSB2YWx1ZTtcblxuICBjb25zdCBldmVudCA9IG5ldyBDdXN0b21FdmVudChcImNoYW5nZVwiLCB7XG4gICAgYnViYmxlczogdHJ1ZSxcbiAgICBjYW5jZWxhYmxlOiB0cnVlLFxuICAgIGRldGFpbDogeyB2YWx1ZSB9LFxuICB9KTtcbiAgZWxlbWVudFRvQ2hhbmdlLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xufTtcblxuLyoqXG4gKiBUaGUgcHJvcGVydGllcyBhbmQgZWxlbWVudHMgd2l0aGluIHRoZSBkYXRlIHBpY2tlci5cbiAqIEB0eXBlZGVmIHtPYmplY3R9IERhdGVQaWNrZXJDb250ZXh0XG4gKiBAcHJvcGVydHkge0hUTUxEaXZFbGVtZW50fSBjYWxlbmRhckVsXG4gKiBAcHJvcGVydHkge0hUTUxFbGVtZW50fSBkYXRlUGlja2VyRWxcbiAqIEBwcm9wZXJ0eSB7SFRNTElucHV0RWxlbWVudH0gaW50ZXJuYWxJbnB1dEVsXG4gKiBAcHJvcGVydHkge0hUTUxJbnB1dEVsZW1lbnR9IGV4dGVybmFsSW5wdXRFbFxuICogQHByb3BlcnR5IHtIVE1MRGl2RWxlbWVudH0gc3RhdHVzRWxcbiAqIEBwcm9wZXJ0eSB7SFRNTERpdkVsZW1lbnR9IGZpcnN0WWVhckNodW5rRWxcbiAqIEBwcm9wZXJ0eSB7RGF0ZX0gY2FsZW5kYXJEYXRlXG4gKiBAcHJvcGVydHkge0RhdGV9IG1pbkRhdGVcbiAqIEBwcm9wZXJ0eSB7RGF0ZX0gbWF4RGF0ZVxuICogQHByb3BlcnR5IHtEYXRlfSBzZWxlY3RlZERhdGVcbiAqIEBwcm9wZXJ0eSB7RGF0ZX0gcmFuZ2VEYXRlXG4gKiBAcHJvcGVydHkge0RhdGV9IGRlZmF1bHREYXRlXG4gKi9cblxuLyoqXG4gKiBHZXQgYW4gb2JqZWN0IG9mIHRoZSBwcm9wZXJ0aWVzIGFuZCBlbGVtZW50cyBiZWxvbmdpbmcgZGlyZWN0bHkgdG8gdGhlIGdpdmVuXG4gKiBkYXRlIHBpY2tlciBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgdGhlIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlclxuICogQHJldHVybnMge0RhdGVQaWNrZXJDb250ZXh0fSBlbGVtZW50c1xuICovXG5jb25zdCBnZXREYXRlUGlja2VyQ29udGV4dCA9IChlbCkgPT4ge1xuICBjb25zdCBkYXRlUGlja2VyRWwgPSBlbC5jbG9zZXN0KERBVEVfUElDS0VSKTtcblxuICBpZiAoIWRhdGVQaWNrZXJFbCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgRWxlbWVudCBpcyBtaXNzaW5nIG91dGVyICR7REFURV9QSUNLRVJ9YCk7XG4gIH1cblxuICBjb25zdCBpbnRlcm5hbElucHV0RWwgPSBkYXRlUGlja2VyRWwucXVlcnlTZWxlY3RvcihcbiAgICBEQVRFX1BJQ0tFUl9JTlRFUk5BTF9JTlBVVFxuICApO1xuICBjb25zdCBleHRlcm5hbElucHV0RWwgPSBkYXRlUGlja2VyRWwucXVlcnlTZWxlY3RvcihcbiAgICBEQVRFX1BJQ0tFUl9FWFRFUk5BTF9JTlBVVFxuICApO1xuICBjb25zdCBjYWxlbmRhckVsID0gZGF0ZVBpY2tlckVsLnF1ZXJ5U2VsZWN0b3IoREFURV9QSUNLRVJfQ0FMRU5EQVIpO1xuICBjb25zdCB0b2dnbGVCdG5FbCA9IGRhdGVQaWNrZXJFbC5xdWVyeVNlbGVjdG9yKERBVEVfUElDS0VSX0JVVFRPTik7XG4gIGNvbnN0IHN0YXR1c0VsID0gZGF0ZVBpY2tlckVsLnF1ZXJ5U2VsZWN0b3IoREFURV9QSUNLRVJfU1RBVFVTKTtcbiAgY29uc3QgZmlyc3RZZWFyQ2h1bmtFbCA9IGRhdGVQaWNrZXJFbC5xdWVyeVNlbGVjdG9yKENBTEVOREFSX1lFQVIpO1xuXG4gIGNvbnN0IGlucHV0RGF0ZSA9IHBhcnNlRGF0ZVN0cmluZyhcbiAgICBleHRlcm5hbElucHV0RWwudmFsdWUsXG4gICAgREVGQVVMVF9FWFRFUk5BTF9EQVRFX0ZPUk1BVCxcbiAgICB0cnVlXG4gICk7XG4gIGNvbnN0IHNlbGVjdGVkRGF0ZSA9IHBhcnNlRGF0ZVN0cmluZyhpbnRlcm5hbElucHV0RWwudmFsdWUpO1xuXG4gIGNvbnN0IGNhbGVuZGFyRGF0ZSA9IHBhcnNlRGF0ZVN0cmluZyhjYWxlbmRhckVsLmRhdGFzZXQudmFsdWUpO1xuICBjb25zdCBtaW5EYXRlID0gcGFyc2VEYXRlU3RyaW5nKGRhdGVQaWNrZXJFbC5kYXRhc2V0Lm1pbkRhdGUpO1xuICBjb25zdCBtYXhEYXRlID0gcGFyc2VEYXRlU3RyaW5nKGRhdGVQaWNrZXJFbC5kYXRhc2V0Lm1heERhdGUpO1xuICBjb25zdCByYW5nZURhdGUgPSBwYXJzZURhdGVTdHJpbmcoZGF0ZVBpY2tlckVsLmRhdGFzZXQucmFuZ2VEYXRlKTtcbiAgY29uc3QgZGVmYXVsdERhdGUgPSBwYXJzZURhdGVTdHJpbmcoZGF0ZVBpY2tlckVsLmRhdGFzZXQuZGVmYXVsdERhdGUpO1xuXG4gIGlmIChtaW5EYXRlICYmIG1heERhdGUgJiYgbWluRGF0ZSA+IG1heERhdGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJNaW5pbXVtIGRhdGUgY2Fubm90IGJlIGFmdGVyIG1heGltdW0gZGF0ZVwiKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgY2FsZW5kYXJEYXRlLFxuICAgIG1pbkRhdGUsXG4gICAgdG9nZ2xlQnRuRWwsXG4gICAgc2VsZWN0ZWREYXRlLFxuICAgIG1heERhdGUsXG4gICAgZmlyc3RZZWFyQ2h1bmtFbCxcbiAgICBkYXRlUGlja2VyRWwsXG4gICAgaW5wdXREYXRlLFxuICAgIGludGVybmFsSW5wdXRFbCxcbiAgICBleHRlcm5hbElucHV0RWwsXG4gICAgY2FsZW5kYXJFbCxcbiAgICByYW5nZURhdGUsXG4gICAgZGVmYXVsdERhdGUsXG4gICAgc3RhdHVzRWwsXG4gIH07XG59O1xuXG4vKipcbiAqIERpc2FibGUgdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcbiAqL1xuY29uc3QgZGlzYWJsZSA9IChlbCkgPT4ge1xuICBjb25zdCB7IGV4dGVybmFsSW5wdXRFbCwgdG9nZ2xlQnRuRWwgfSA9IGdldERhdGVQaWNrZXJDb250ZXh0KGVsKTtcblxuICB0b2dnbGVCdG5FbC5kaXNhYmxlZCA9IHRydWU7XG4gIGV4dGVybmFsSW5wdXRFbC5kaXNhYmxlZCA9IHRydWU7XG59O1xuXG4vKipcbiAqIEVuYWJsZSB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICovXG5jb25zdCBlbmFibGUgPSAoZWwpID0+IHtcbiAgY29uc3QgeyBleHRlcm5hbElucHV0RWwsIHRvZ2dsZUJ0bkVsIH0gPSBnZXREYXRlUGlja2VyQ29udGV4dChlbCk7XG5cbiAgdG9nZ2xlQnRuRWwuZGlzYWJsZWQgPSBmYWxzZTtcbiAgZXh0ZXJuYWxJbnB1dEVsLmRpc2FibGVkID0gZmFsc2U7XG59O1xuXG4vLyAjcmVnaW9uIFZhbGlkYXRpb25cblxuLyoqXG4gKiBWYWxpZGF0ZSB0aGUgdmFsdWUgaW4gdGhlIGlucHV0IGFzIGEgdmFsaWQgZGF0ZSBvZiBmb3JtYXQgTS9EL1lZWVlcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKi9cbmNvbnN0IGlzRGF0ZUlucHV0SW52YWxpZCA9IChlbCkgPT4ge1xuICBjb25zdCB7IGV4dGVybmFsSW5wdXRFbCwgbWluRGF0ZSwgbWF4RGF0ZSB9ID0gZ2V0RGF0ZVBpY2tlckNvbnRleHQoZWwpO1xuXG4gIGNvbnN0IGRhdGVTdHJpbmcgPSBleHRlcm5hbElucHV0RWwudmFsdWU7XG4gIGxldCBpc0ludmFsaWQgPSBmYWxzZTtcblxuICBpZiAoZGF0ZVN0cmluZykge1xuICAgIGlzSW52YWxpZCA9IHRydWU7XG5cbiAgICBjb25zdCBkYXRlU3RyaW5nUGFydHMgPSBkYXRlU3RyaW5nLnNwbGl0KFwiL1wiKTtcbiAgICBjb25zdCBbbW9udGgsIGRheSwgeWVhcl0gPSBkYXRlU3RyaW5nUGFydHMubWFwKChzdHIpID0+IHtcbiAgICAgIGxldCB2YWx1ZTtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlSW50KHN0ciwgMTApO1xuICAgICAgaWYgKCFOdW1iZXIuaXNOYU4ocGFyc2VkKSkgdmFsdWUgPSBwYXJzZWQ7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSk7XG5cbiAgICBpZiAobW9udGggJiYgZGF5ICYmIHllYXIgIT0gbnVsbCkge1xuICAgICAgY29uc3QgY2hlY2tEYXRlID0gc2V0RGF0ZSh5ZWFyLCBtb250aCAtIDEsIGRheSk7XG5cbiAgICAgIGlmIChcbiAgICAgICAgY2hlY2tEYXRlLmdldE1vbnRoKCkgPT09IG1vbnRoIC0gMSAmJlxuICAgICAgICBjaGVja0RhdGUuZ2V0RGF0ZSgpID09PSBkYXkgJiZcbiAgICAgICAgY2hlY2tEYXRlLmdldEZ1bGxZZWFyKCkgPT09IHllYXIgJiZcbiAgICAgICAgZGF0ZVN0cmluZ1BhcnRzWzJdLmxlbmd0aCA9PT0gNCAmJlxuICAgICAgICBpc0RhdGVXaXRoaW5NaW5BbmRNYXgoY2hlY2tEYXRlLCBtaW5EYXRlLCBtYXhEYXRlKVxuICAgICAgKSB7XG4gICAgICAgIGlzSW52YWxpZCA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBpc0ludmFsaWQ7XG59O1xuXG4vKipcbiAqIFZhbGlkYXRlIHRoZSB2YWx1ZSBpbiB0aGUgaW5wdXQgYXMgYSB2YWxpZCBkYXRlIG9mIGZvcm1hdCBNL0QvWVlZWVxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcbiAqL1xuY29uc3QgdmFsaWRhdGVEYXRlSW5wdXQgPSAoZWwpID0+IHtcbiAgY29uc3QgeyBleHRlcm5hbElucHV0RWwgfSA9IGdldERhdGVQaWNrZXJDb250ZXh0KGVsKTtcbiAgY29uc3QgaXNJbnZhbGlkID0gaXNEYXRlSW5wdXRJbnZhbGlkKGV4dGVybmFsSW5wdXRFbCk7XG5cbiAgaWYgKGlzSW52YWxpZCAmJiAhZXh0ZXJuYWxJbnB1dEVsLnZhbGlkYXRpb25NZXNzYWdlKSB7XG4gICAgZXh0ZXJuYWxJbnB1dEVsLnNldEN1c3RvbVZhbGlkaXR5KFZBTElEQVRJT05fTUVTU0FHRSk7XG4gIH1cblxuICBpZiAoIWlzSW52YWxpZCAmJiBleHRlcm5hbElucHV0RWwudmFsaWRhdGlvbk1lc3NhZ2UgPT09IFZBTElEQVRJT05fTUVTU0FHRSkge1xuICAgIGV4dGVybmFsSW5wdXRFbC5zZXRDdXN0b21WYWxpZGl0eShcIlwiKTtcbiAgfVxufTtcblxuLy8gI2VuZHJlZ2lvbiBWYWxpZGF0aW9uXG5cbi8qKlxuICogRW5hYmxlIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKi9cbmNvbnN0IHJlY29uY2lsZUlucHV0VmFsdWVzID0gKGVsKSA9PiB7XG4gIGNvbnN0IHsgaW50ZXJuYWxJbnB1dEVsLCBpbnB1dERhdGUgfSA9IGdldERhdGVQaWNrZXJDb250ZXh0KGVsKTtcbiAgbGV0IG5ld1ZhbHVlID0gXCJcIjtcblxuICBpZiAoaW5wdXREYXRlICYmICFpc0RhdGVJbnB1dEludmFsaWQoZWwpKSB7XG4gICAgbmV3VmFsdWUgPSBmb3JtYXREYXRlKGlucHV0RGF0ZSk7XG4gIH1cblxuICBpZiAoaW50ZXJuYWxJbnB1dEVsLnZhbHVlICE9PSBuZXdWYWx1ZSkge1xuICAgIGNoYW5nZUVsZW1lbnRWYWx1ZShpbnRlcm5hbElucHV0RWwsIG5ld1ZhbHVlKTtcbiAgfVxufTtcblxuLyoqXG4gKiBTZWxlY3QgdGhlIHZhbHVlIG9mIHRoZSBkYXRlIHBpY2tlciBpbnB1dHMuXG4gKlxuICogQHBhcmFtIHtIVE1MQnV0dG9uRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICogQHBhcmFtIHtzdHJpbmd9IGRhdGVTdHJpbmcgVGhlIGRhdGUgc3RyaW5nIHRvIHVwZGF0ZSBpbiBZWVlZLU1NLUREIGZvcm1hdFxuICovXG5jb25zdCBzZXRDYWxlbmRhclZhbHVlID0gKGVsLCBkYXRlU3RyaW5nKSA9PiB7XG4gIGNvbnN0IHBhcnNlZERhdGUgPSBwYXJzZURhdGVTdHJpbmcoZGF0ZVN0cmluZyk7XG5cbiAgaWYgKHBhcnNlZERhdGUpIHtcbiAgICBjb25zdCBmb3JtYXR0ZWREYXRlID0gZm9ybWF0RGF0ZShwYXJzZWREYXRlLCBERUZBVUxUX0VYVEVSTkFMX0RBVEVfRk9STUFUKTtcblxuICAgIGNvbnN0IHsgZGF0ZVBpY2tlckVsLCBpbnRlcm5hbElucHV0RWwsIGV4dGVybmFsSW5wdXRFbCB9ID1cbiAgICAgIGdldERhdGVQaWNrZXJDb250ZXh0KGVsKTtcblxuICAgIGNoYW5nZUVsZW1lbnRWYWx1ZShpbnRlcm5hbElucHV0RWwsIGRhdGVTdHJpbmcpO1xuICAgIGNoYW5nZUVsZW1lbnRWYWx1ZShleHRlcm5hbElucHV0RWwsIGZvcm1hdHRlZERhdGUpO1xuXG4gICAgdmFsaWRhdGVEYXRlSW5wdXQoZGF0ZVBpY2tlckVsKTtcbiAgfVxufTtcblxuLyoqXG4gKiBFbmhhbmNlIGFuIGlucHV0IHdpdGggdGhlIGRhdGUgcGlja2VyIGVsZW1lbnRzXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgVGhlIGluaXRpYWwgd3JhcHBpbmcgZWxlbWVudCBvZiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKi9cbmNvbnN0IGVuaGFuY2VEYXRlUGlja2VyID0gKGVsKSA9PiB7XG4gIGNvbnN0IGRhdGVQaWNrZXJFbCA9IGVsLmNsb3Nlc3QoREFURV9QSUNLRVIpO1xuICBjb25zdCB7IGRlZmF1bHRWYWx1ZSB9ID0gZGF0ZVBpY2tlckVsLmRhdGFzZXQ7XG5cbiAgY29uc3QgaW50ZXJuYWxJbnB1dEVsID0gZGF0ZVBpY2tlckVsLnF1ZXJ5U2VsZWN0b3IoYGlucHV0YCk7XG5cbiAgaWYgKCFpbnRlcm5hbElucHV0RWwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7REFURV9QSUNLRVJ9IGlzIG1pc3NpbmcgaW5uZXIgaW5wdXRgKTtcbiAgfVxuXG4gIGlmIChpbnRlcm5hbElucHV0RWwudmFsdWUpIHtcbiAgICBpbnRlcm5hbElucHV0RWwudmFsdWUgPSBcIlwiO1xuICB9XG5cbiAgY29uc3QgbWluRGF0ZSA9IHBhcnNlRGF0ZVN0cmluZyhcbiAgICBkYXRlUGlja2VyRWwuZGF0YXNldC5taW5EYXRlIHx8IGludGVybmFsSW5wdXRFbC5nZXRBdHRyaWJ1dGUoXCJtaW5cIilcbiAgKTtcbiAgZGF0ZVBpY2tlckVsLmRhdGFzZXQubWluRGF0ZSA9IG1pbkRhdGVcbiAgICA/IGZvcm1hdERhdGUobWluRGF0ZSlcbiAgICA6IERFRkFVTFRfTUlOX0RBVEU7XG5cbiAgY29uc3QgbWF4RGF0ZSA9IHBhcnNlRGF0ZVN0cmluZyhcbiAgICBkYXRlUGlja2VyRWwuZGF0YXNldC5tYXhEYXRlIHx8IGludGVybmFsSW5wdXRFbC5nZXRBdHRyaWJ1dGUoXCJtYXhcIilcbiAgKTtcbiAgaWYgKG1heERhdGUpIHtcbiAgICBkYXRlUGlja2VyRWwuZGF0YXNldC5tYXhEYXRlID0gZm9ybWF0RGF0ZShtYXhEYXRlKTtcbiAgfVxuXG4gIGNvbnN0IGNhbGVuZGFyV3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGNhbGVuZGFyV3JhcHBlci5jbGFzc0xpc3QuYWRkKERBVEVfUElDS0VSX1dSQVBQRVJfQ0xBU1MpO1xuXG4gIGNvbnN0IGV4dGVybmFsSW5wdXRFbCA9IGludGVybmFsSW5wdXRFbC5jbG9uZU5vZGUoKTtcbiAgZXh0ZXJuYWxJbnB1dEVsLmNsYXNzTGlzdC5hZGQoREFURV9QSUNLRVJfRVhURVJOQUxfSU5QVVRfQ0xBU1MpO1xuICBleHRlcm5hbElucHV0RWwudHlwZSA9IFwidGV4dFwiO1xuXG4gIGNhbGVuZGFyV3JhcHBlci5hcHBlbmRDaGlsZChleHRlcm5hbElucHV0RWwpO1xuICBjYWxlbmRhcldyYXBwZXIuaW5zZXJ0QWRqYWNlbnRIVE1MKFxuICAgIFwiYmVmb3JlZW5kXCIsXG4gICAgU2FuaXRpemVyLmVzY2FwZUhUTUxgXG4gICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCIke0RBVEVfUElDS0VSX0JVVFRPTl9DTEFTU31cIiBhcmlhLWhhc3BvcHVwPVwidHJ1ZVwiIGFyaWEtbGFiZWw9XCJUb2dnbGUgY2FsZW5kYXJcIj48L2J1dHRvbj5cbiAgICA8ZGl2IGNsYXNzPVwiJHtEQVRFX1BJQ0tFUl9DQUxFTkRBUl9DTEFTU31cIiByb2xlPVwiZGlhbG9nXCIgYXJpYS1tb2RhbD1cInRydWVcIiBoaWRkZW4+PC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cInVzYS1zci1vbmx5ICR7REFURV9QSUNLRVJfU1RBVFVTX0NMQVNTfVwiIHJvbGU9XCJzdGF0dXNcIiBhcmlhLWxpdmU9XCJwb2xpdGVcIj48L2Rpdj5gXG4gICk7XG5cbiAgaW50ZXJuYWxJbnB1dEVsLnNldEF0dHJpYnV0ZShcImFyaWEtaGlkZGVuXCIsIFwidHJ1ZVwiKTtcbiAgaW50ZXJuYWxJbnB1dEVsLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIFwiLTFcIik7XG4gIGludGVybmFsSW5wdXRFbC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gIGludGVybmFsSW5wdXRFbC5jbGFzc0xpc3QuYWRkKERBVEVfUElDS0VSX0lOVEVSTkFMX0lOUFVUX0NMQVNTKTtcbiAgaW50ZXJuYWxJbnB1dEVsLnJlbW92ZUF0dHJpYnV0ZShcImlkXCIpO1xuICBpbnRlcm5hbElucHV0RWwucmVtb3ZlQXR0cmlidXRlKFwibmFtZVwiKTtcbiAgaW50ZXJuYWxJbnB1dEVsLnJlcXVpcmVkID0gZmFsc2U7XG5cbiAgZGF0ZVBpY2tlckVsLmFwcGVuZENoaWxkKGNhbGVuZGFyV3JhcHBlcik7XG4gIGRhdGVQaWNrZXJFbC5jbGFzc0xpc3QuYWRkKERBVEVfUElDS0VSX0lOSVRJQUxJWkVEX0NMQVNTKTtcblxuICBpZiAoZGVmYXVsdFZhbHVlKSB7XG4gICAgc2V0Q2FsZW5kYXJWYWx1ZShkYXRlUGlja2VyRWwsIGRlZmF1bHRWYWx1ZSk7XG4gIH1cblxuICBpZiAoaW50ZXJuYWxJbnB1dEVsLmRpc2FibGVkKSB7XG4gICAgZGlzYWJsZShkYXRlUGlja2VyRWwpO1xuICAgIGludGVybmFsSW5wdXRFbC5kaXNhYmxlZCA9IGZhbHNlO1xuICB9XG59O1xuXG4vLyAjcmVnaW9uIENhbGVuZGFyIC0gRGF0ZSBTZWxlY3Rpb24gVmlld1xuXG4vKipcbiAqIHJlbmRlciB0aGUgY2FsZW5kYXIuXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICogQHBhcmFtIHtEYXRlfSBfZGF0ZVRvRGlzcGxheSBhIGRhdGUgdG8gcmVuZGVyIG9uIHRoZSBjYWxlbmRhclxuICogQHJldHVybnMge0hUTUxFbGVtZW50fSBhIHJlZmVyZW5jZSB0byB0aGUgbmV3IGNhbGVuZGFyIGVsZW1lbnRcbiAqL1xuY29uc3QgcmVuZGVyQ2FsZW5kYXIgPSAoZWwsIF9kYXRlVG9EaXNwbGF5KSA9PiB7XG4gIGNvbnN0IHtcbiAgICBkYXRlUGlja2VyRWwsXG4gICAgY2FsZW5kYXJFbCxcbiAgICBzdGF0dXNFbCxcbiAgICBzZWxlY3RlZERhdGUsXG4gICAgbWF4RGF0ZSxcbiAgICBtaW5EYXRlLFxuICAgIHJhbmdlRGF0ZSxcbiAgfSA9IGdldERhdGVQaWNrZXJDb250ZXh0KGVsKTtcbiAgY29uc3QgdG9kYXlzRGF0ZSA9IHRvZGF5KCk7XG4gIGxldCBkYXRlVG9EaXNwbGF5ID0gX2RhdGVUb0Rpc3BsYXkgfHwgdG9kYXlzRGF0ZTtcblxuICBjb25zdCBjYWxlbmRhcldhc0hpZGRlbiA9IGNhbGVuZGFyRWwuaGlkZGVuO1xuXG4gIGNvbnN0IGZvY3VzZWREYXRlID0gYWRkRGF5cyhkYXRlVG9EaXNwbGF5LCAwKTtcbiAgY29uc3QgZm9jdXNlZE1vbnRoID0gZGF0ZVRvRGlzcGxheS5nZXRNb250aCgpO1xuICBjb25zdCBmb2N1c2VkWWVhciA9IGRhdGVUb0Rpc3BsYXkuZ2V0RnVsbFllYXIoKTtcblxuICBjb25zdCBwcmV2TW9udGggPSBzdWJNb250aHMoZGF0ZVRvRGlzcGxheSwgMSk7XG4gIGNvbnN0IG5leHRNb250aCA9IGFkZE1vbnRocyhkYXRlVG9EaXNwbGF5LCAxKTtcblxuICBjb25zdCBjdXJyZW50Rm9ybWF0dGVkRGF0ZSA9IGZvcm1hdERhdGUoZGF0ZVRvRGlzcGxheSk7XG5cbiAgY29uc3QgZmlyc3RPZk1vbnRoID0gc3RhcnRPZk1vbnRoKGRhdGVUb0Rpc3BsYXkpO1xuICBjb25zdCBwcmV2QnV0dG9uc0Rpc2FibGVkID0gaXNTYW1lTW9udGgoZGF0ZVRvRGlzcGxheSwgbWluRGF0ZSk7XG4gIGNvbnN0IG5leHRCdXR0b25zRGlzYWJsZWQgPSBpc1NhbWVNb250aChkYXRlVG9EaXNwbGF5LCBtYXhEYXRlKTtcblxuICBjb25zdCByYW5nZUNvbmNsdXNpb25EYXRlID0gc2VsZWN0ZWREYXRlIHx8IGRhdGVUb0Rpc3BsYXk7XG4gIGNvbnN0IHJhbmdlU3RhcnREYXRlID0gcmFuZ2VEYXRlICYmIG1pbihyYW5nZUNvbmNsdXNpb25EYXRlLCByYW5nZURhdGUpO1xuICBjb25zdCByYW5nZUVuZERhdGUgPSByYW5nZURhdGUgJiYgbWF4KHJhbmdlQ29uY2x1c2lvbkRhdGUsIHJhbmdlRGF0ZSk7XG5cbiAgY29uc3Qgd2l0aGluUmFuZ2VTdGFydERhdGUgPSByYW5nZURhdGUgJiYgYWRkRGF5cyhyYW5nZVN0YXJ0RGF0ZSwgMSk7XG4gIGNvbnN0IHdpdGhpblJhbmdlRW5kRGF0ZSA9IHJhbmdlRGF0ZSAmJiBzdWJEYXlzKHJhbmdlRW5kRGF0ZSwgMSk7XG5cbiAgY29uc3QgbW9udGhMYWJlbCA9IE1PTlRIX0xBQkVMU1tmb2N1c2VkTW9udGhdO1xuXG4gIGNvbnN0IGdlbmVyYXRlRGF0ZUh0bWwgPSAoZGF0ZVRvUmVuZGVyKSA9PiB7XG4gICAgY29uc3QgY2xhc3NlcyA9IFtDQUxFTkRBUl9EQVRFX0NMQVNTXTtcbiAgICBjb25zdCBkYXkgPSBkYXRlVG9SZW5kZXIuZ2V0RGF0ZSgpO1xuICAgIGNvbnN0IG1vbnRoID0gZGF0ZVRvUmVuZGVyLmdldE1vbnRoKCk7XG4gICAgY29uc3QgeWVhciA9IGRhdGVUb1JlbmRlci5nZXRGdWxsWWVhcigpO1xuICAgIGNvbnN0IGRheU9mV2VlayA9IGRhdGVUb1JlbmRlci5nZXREYXkoKTtcblxuICAgIGNvbnN0IGZvcm1hdHRlZERhdGUgPSBmb3JtYXREYXRlKGRhdGVUb1JlbmRlcik7XG5cbiAgICBsZXQgdGFiaW5kZXggPSBcIi0xXCI7XG5cbiAgICBjb25zdCBpc0Rpc2FibGVkID0gIWlzRGF0ZVdpdGhpbk1pbkFuZE1heChkYXRlVG9SZW5kZXIsIG1pbkRhdGUsIG1heERhdGUpO1xuICAgIGNvbnN0IGlzU2VsZWN0ZWQgPSBpc1NhbWVEYXkoZGF0ZVRvUmVuZGVyLCBzZWxlY3RlZERhdGUpO1xuXG4gICAgaWYgKGlzU2FtZU1vbnRoKGRhdGVUb1JlbmRlciwgcHJldk1vbnRoKSkge1xuICAgICAgY2xhc3Nlcy5wdXNoKENBTEVOREFSX0RBVEVfUFJFVklPVVNfTU9OVEhfQ0xBU1MpO1xuICAgIH1cblxuICAgIGlmIChpc1NhbWVNb250aChkYXRlVG9SZW5kZXIsIGZvY3VzZWREYXRlKSkge1xuICAgICAgY2xhc3Nlcy5wdXNoKENBTEVOREFSX0RBVEVfQ1VSUkVOVF9NT05USF9DTEFTUyk7XG4gICAgfVxuXG4gICAgaWYgKGlzU2FtZU1vbnRoKGRhdGVUb1JlbmRlciwgbmV4dE1vbnRoKSkge1xuICAgICAgY2xhc3Nlcy5wdXNoKENBTEVOREFSX0RBVEVfTkVYVF9NT05USF9DTEFTUyk7XG4gICAgfVxuXG4gICAgaWYgKGlzU2VsZWN0ZWQpIHtcbiAgICAgIGNsYXNzZXMucHVzaChDQUxFTkRBUl9EQVRFX1NFTEVDVEVEX0NMQVNTKTtcbiAgICB9XG5cbiAgICBpZiAoaXNTYW1lRGF5KGRhdGVUb1JlbmRlciwgdG9kYXlzRGF0ZSkpIHtcbiAgICAgIGNsYXNzZXMucHVzaChDQUxFTkRBUl9EQVRFX1RPREFZX0NMQVNTKTtcbiAgICB9XG5cbiAgICBpZiAocmFuZ2VEYXRlKSB7XG4gICAgICBpZiAoaXNTYW1lRGF5KGRhdGVUb1JlbmRlciwgcmFuZ2VEYXRlKSkge1xuICAgICAgICBjbGFzc2VzLnB1c2goQ0FMRU5EQVJfREFURV9SQU5HRV9EQVRFX0NMQVNTKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGlzU2FtZURheShkYXRlVG9SZW5kZXIsIHJhbmdlU3RhcnREYXRlKSkge1xuICAgICAgICBjbGFzc2VzLnB1c2goQ0FMRU5EQVJfREFURV9SQU5HRV9EQVRFX1NUQVJUX0NMQVNTKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGlzU2FtZURheShkYXRlVG9SZW5kZXIsIHJhbmdlRW5kRGF0ZSkpIHtcbiAgICAgICAgY2xhc3Nlcy5wdXNoKENBTEVOREFSX0RBVEVfUkFOR0VfREFURV9FTkRfQ0xBU1MpO1xuICAgICAgfVxuXG4gICAgICBpZiAoXG4gICAgICAgIGlzRGF0ZVdpdGhpbk1pbkFuZE1heChcbiAgICAgICAgICBkYXRlVG9SZW5kZXIsXG4gICAgICAgICAgd2l0aGluUmFuZ2VTdGFydERhdGUsXG4gICAgICAgICAgd2l0aGluUmFuZ2VFbmREYXRlXG4gICAgICAgIClcbiAgICAgICkge1xuICAgICAgICBjbGFzc2VzLnB1c2goQ0FMRU5EQVJfREFURV9XSVRISU5fUkFOR0VfQ0xBU1MpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChpc1NhbWVEYXkoZGF0ZVRvUmVuZGVyLCBmb2N1c2VkRGF0ZSkpIHtcbiAgICAgIHRhYmluZGV4ID0gXCIwXCI7XG4gICAgICBjbGFzc2VzLnB1c2goQ0FMRU5EQVJfREFURV9GT0NVU0VEX0NMQVNTKTtcbiAgICB9XG5cbiAgICBjb25zdCBtb250aFN0ciA9IE1PTlRIX0xBQkVMU1ttb250aF07XG4gICAgY29uc3QgZGF5U3RyID0gREFZX09GX1dFRUtfTEFCRUxTW2RheU9mV2Vla107XG5cbiAgICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgIGJ0bi5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsIFwiYnV0dG9uXCIpO1xuICAgIGJ0bi5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCB0YWJpbmRleCk7XG4gICAgYnRuLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIGNsYXNzZXMuam9pbihcIiBcIikpO1xuICAgIGJ0bi5zZXRBdHRyaWJ1dGUoXCJkYXRhLWRheVwiLCBkYXkpO1xuICAgIGJ0bi5zZXRBdHRyaWJ1dGUoXCJkYXRhLW1vbnRoXCIsIG1vbnRoICsgMSk7XG4gICAgYnRuLnNldEF0dHJpYnV0ZShcImRhdGEteWVhclwiLCB5ZWFyKTtcbiAgICBidG4uc2V0QXR0cmlidXRlKFwiZGF0YS12YWx1ZVwiLCBmb3JtYXR0ZWREYXRlKTtcbiAgICBidG4uc2V0QXR0cmlidXRlKFxuICAgICAgXCJhcmlhLWxhYmVsXCIsXG4gICAgICBTYW5pdGl6ZXIuZXNjYXBlSFRNTGAke2RheX0gJHttb250aFN0cn0gJHt5ZWFyfSAke2RheVN0cn1gXG4gICAgKTtcbiAgICBidG4uc2V0QXR0cmlidXRlKFwiYXJpYS1zZWxlY3RlZFwiLCBpc1NlbGVjdGVkID8gXCJ0cnVlXCIgOiBcImZhbHNlXCIpO1xuICAgIGlmIChpc0Rpc2FibGVkID09PSB0cnVlKSB7XG4gICAgICBidG4uZGlzYWJsZWQgPSB0cnVlO1xuICAgIH1cbiAgICBidG4udGV4dENvbnRlbnQgPSBkYXk7XG5cbiAgICByZXR1cm4gYnRuO1xuICB9O1xuXG4gIC8vIHNldCBkYXRlIHRvIGZpcnN0IHJlbmRlcmVkIGRheVxuICBkYXRlVG9EaXNwbGF5ID0gc3RhcnRPZldlZWsoZmlyc3RPZk1vbnRoKTtcblxuICBjb25zdCBkYXlzID0gW107XG5cbiAgd2hpbGUgKFxuICAgIGRheXMubGVuZ3RoIDwgMjggfHxcbiAgICBkYXRlVG9EaXNwbGF5LmdldE1vbnRoKCkgPT09IGZvY3VzZWRNb250aCB8fFxuICAgIGRheXMubGVuZ3RoICUgNyAhPT0gMFxuICApIHtcbiAgICBkYXlzLnB1c2goZ2VuZXJhdGVEYXRlSHRtbChkYXRlVG9EaXNwbGF5KSk7XG4gICAgZGF0ZVRvRGlzcGxheSA9IGFkZERheXMoZGF0ZVRvRGlzcGxheSwgMSk7XG4gIH1cblxuICBjb25zdCBkYXRlc0dyaWQgPSBsaXN0VG9HcmlkSHRtbChkYXlzLCA3KTtcblxuICBjb25zdCBuZXdDYWxlbmRhciA9IGNhbGVuZGFyRWwuY2xvbmVOb2RlKCk7XG4gIG5ld0NhbGVuZGFyLmRhdGFzZXQudmFsdWUgPSBjdXJyZW50Rm9ybWF0dGVkRGF0ZTtcbiAgbmV3Q2FsZW5kYXIuc3R5bGUudG9wID0gYCR7ZGF0ZVBpY2tlckVsLm9mZnNldEhlaWdodH1weGA7XG4gIG5ld0NhbGVuZGFyLmhpZGRlbiA9IGZhbHNlO1xuICBuZXdDYWxlbmRhci5pbm5lckhUTUwgPSBTYW5pdGl6ZXIuZXNjYXBlSFRNTGBcbiAgICA8ZGl2IHRhYmluZGV4PVwiLTFcIiBjbGFzcz1cIiR7Q0FMRU5EQVJfREFURV9QSUNLRVJfQ0xBU1N9XCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiJHtDQUxFTkRBUl9ST1dfQ0xBU1N9XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCIke0NBTEVOREFSX0NFTExfQ0xBU1N9ICR7Q0FMRU5EQVJfQ0VMTF9DRU5URVJfSVRFTVNfQ0xBU1N9XCI+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cIiR7Q0FMRU5EQVJfUFJFVklPVVNfWUVBUl9DTEFTU31cIlxuICAgICAgICAgICAgYXJpYS1sYWJlbD1cIk5hdmlnYXRlIGJhY2sgb25lIHllYXJcIlxuICAgICAgICAgICAgJHtwcmV2QnV0dG9uc0Rpc2FibGVkID8gYGRpc2FibGVkPVwiZGlzYWJsZWRcImAgOiBcIlwifVxuICAgICAgICAgID48L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCIke0NBTEVOREFSX0NFTExfQ0xBU1N9ICR7Q0FMRU5EQVJfQ0VMTF9DRU5URVJfSVRFTVNfQ0xBU1N9XCI+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cIiR7Q0FMRU5EQVJfUFJFVklPVVNfTU9OVEhfQ0xBU1N9XCJcbiAgICAgICAgICAgIGFyaWEtbGFiZWw9XCJOYXZpZ2F0ZSBiYWNrIG9uZSBtb250aFwiXG4gICAgICAgICAgICAke3ByZXZCdXR0b25zRGlzYWJsZWQgPyBgZGlzYWJsZWQ9XCJkaXNhYmxlZFwiYCA6IFwiXCJ9XG4gICAgICAgICAgPjwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIiR7Q0FMRU5EQVJfQ0VMTF9DTEFTU30gJHtDQUxFTkRBUl9NT05USF9MQUJFTF9DTEFTU31cIj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwiJHtDQUxFTkRBUl9NT05USF9TRUxFQ1RJT05fQ0xBU1N9XCIgYXJpYS1sYWJlbD1cIiR7bW9udGhMYWJlbH0uIENsaWNrIHRvIHNlbGVjdCBtb250aFwiXG4gICAgICAgICAgPiR7bW9udGhMYWJlbH08L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIGNsYXNzPVwiJHtDQUxFTkRBUl9ZRUFSX1NFTEVDVElPTl9DTEFTU31cIiBhcmlhLWxhYmVsPVwiJHtmb2N1c2VkWWVhcn0uIENsaWNrIHRvIHNlbGVjdCB5ZWFyXCJcbiAgICAgICAgICA+JHtmb2N1c2VkWWVhcn08L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCIke0NBTEVOREFSX0NFTExfQ0xBU1N9ICR7Q0FMRU5EQVJfQ0VMTF9DRU5URVJfSVRFTVNfQ0xBU1N9XCI+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjbGFzcz1cIiR7Q0FMRU5EQVJfTkVYVF9NT05USF9DTEFTU31cIlxuICAgICAgICAgICAgYXJpYS1sYWJlbD1cIk5hdmlnYXRlIGZvcndhcmQgb25lIG1vbnRoXCJcbiAgICAgICAgICAgICR7bmV4dEJ1dHRvbnNEaXNhYmxlZCA/IGBkaXNhYmxlZD1cImRpc2FibGVkXCJgIDogXCJcIn1cbiAgICAgICAgICA+PC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiJHtDQUxFTkRBUl9DRUxMX0NMQVNTfSAke0NBTEVOREFSX0NFTExfQ0VOVEVSX0lURU1TX0NMQVNTfVwiPlxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY2xhc3M9XCIke0NBTEVOREFSX05FWFRfWUVBUl9DTEFTU31cIlxuICAgICAgICAgICAgYXJpYS1sYWJlbD1cIk5hdmlnYXRlIGZvcndhcmQgb25lIHllYXJcIlxuICAgICAgICAgICAgJHtuZXh0QnV0dG9uc0Rpc2FibGVkID8gYGRpc2FibGVkPVwiZGlzYWJsZWRcImAgOiBcIlwifVxuICAgICAgICAgID48L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICBgO1xuXG4gIGNvbnN0IHRhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRhYmxlXCIpO1xuICB0YWJsZS5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBDQUxFTkRBUl9UQUJMRV9DTEFTUyk7XG4gIHRhYmxlLnNldEF0dHJpYnV0ZShcInJvbGVcIiwgXCJwcmVzZW50YXRpb25cIik7XG5cbiAgY29uc3QgdGFibGVIZWFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRoZWFkXCIpO1xuICB0YWJsZS5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJiZWZvcmVlbmRcIiwgdGFibGVIZWFkKTtcbiAgY29uc3QgdGFibGVIZWFkUm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRyXCIpO1xuICB0YWJsZUhlYWQuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIHRhYmxlSGVhZFJvdyk7XG5cbiAgY29uc3QgZGF5c09mV2VlayA9IHtcbiAgICBTdW5kYXk6IFwiU1wiLFxuICAgIE1vbmRheTogXCJNXCIsXG4gICAgVHVlc2RheTogXCJUXCIsXG4gICAgV2VkbmVzZGF5OiBcIldcIixcbiAgICBUaHVyc2RheTogXCJUaFwiLFxuICAgIEZyaWRheTogXCJGclwiLFxuICAgIFNhdHVyZGF5OiBcIlNcIixcbiAgfTtcblxuICBPYmplY3Qua2V5cyhkYXlzT2ZXZWVrKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICBjb25zdCB0aCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0aFwiKTtcbiAgICB0aC5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBDQUxFTkRBUl9EQVlfT0ZfV0VFS19DTEFTUyk7XG4gICAgdGguc2V0QXR0cmlidXRlKFwic2NvcGVcIiwgXCJwcmVzZW50YXRpb25cIik7XG4gICAgdGguc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCBrZXkpO1xuICAgIHRoLnRleHRDb250ZW50ID0gZGF5c09mV2Vla1trZXldO1xuICAgIHRhYmxlSGVhZFJvdy5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJiZWZvcmVlbmRcIiwgdGgpO1xuICB9KTtcblxuICBjb25zdCB0YWJsZUJvZHkgPSBjcmVhdGVUYWJsZUJvZHkoZGF0ZXNHcmlkKTtcbiAgdGFibGUuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIHRhYmxlQm9keSk7XG5cbiAgLy8gQ29udGFpbmVyIGZvciBZZWFycywgTW9udGhzLCBhbmQgRGF5c1xuICBjb25zdCBkYXRlUGlja2VyQ2FsZW5kYXJDb250YWluZXIgPVxuICAgIG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfREFURV9QSUNLRVIpO1xuXG4gIGRhdGVQaWNrZXJDYWxlbmRhckNvbnRhaW5lci5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJiZWZvcmVlbmRcIiwgdGFibGUpO1xuXG4gIGNhbGVuZGFyRWwucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQobmV3Q2FsZW5kYXIsIGNhbGVuZGFyRWwpO1xuXG4gIGRhdGVQaWNrZXJFbC5jbGFzc0xpc3QuYWRkKERBVEVfUElDS0VSX0FDVElWRV9DTEFTUyk7XG5cbiAgY29uc3Qgc3RhdHVzZXMgPSBbXTtcblxuICBpZiAoaXNTYW1lRGF5KHNlbGVjdGVkRGF0ZSwgZm9jdXNlZERhdGUpKSB7XG4gICAgc3RhdHVzZXMucHVzaChcIlNlbGVjdGVkIGRhdGVcIik7XG4gIH1cblxuICBpZiAoY2FsZW5kYXJXYXNIaWRkZW4pIHtcbiAgICBzdGF0dXNlcy5wdXNoKFxuICAgICAgXCJZb3UgY2FuIG5hdmlnYXRlIGJ5IGRheSB1c2luZyBsZWZ0IGFuZCByaWdodCBhcnJvd3NcIixcbiAgICAgIFwiV2Vla3MgYnkgdXNpbmcgdXAgYW5kIGRvd24gYXJyb3dzXCIsXG4gICAgICBcIk1vbnRocyBieSB1c2luZyBwYWdlIHVwIGFuZCBwYWdlIGRvd24ga2V5c1wiLFxuICAgICAgXCJZZWFycyBieSB1c2luZyBzaGlmdCBwbHVzIHBhZ2UgdXAgYW5kIHNoaWZ0IHBsdXMgcGFnZSBkb3duXCIsXG4gICAgICBcIkhvbWUgYW5kIGVuZCBrZXlzIG5hdmlnYXRlIHRvIHRoZSBiZWdpbm5pbmcgYW5kIGVuZCBvZiBhIHdlZWtcIlxuICAgICk7XG4gICAgc3RhdHVzRWwudGV4dENvbnRlbnQgPSBcIlwiO1xuICB9IGVsc2Uge1xuICAgIHN0YXR1c2VzLnB1c2goYCR7bW9udGhMYWJlbH0gJHtmb2N1c2VkWWVhcn1gKTtcbiAgfVxuICBzdGF0dXNFbC50ZXh0Q29udGVudCA9IHN0YXR1c2VzLmpvaW4oXCIuIFwiKTtcblxuICByZXR1cm4gbmV3Q2FsZW5kYXI7XG59O1xuXG4vKipcbiAqIE5hdmlnYXRlIGJhY2sgb25lIHllYXIgYW5kIGRpc3BsYXkgdGhlIGNhbGVuZGFyLlxuICpcbiAqIEBwYXJhbSB7SFRNTEJ1dHRvbkVsZW1lbnR9IF9idXR0b25FbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKi9cbmNvbnN0IGRpc3BsYXlQcmV2aW91c1llYXIgPSAoX2J1dHRvbkVsKSA9PiB7XG4gIGlmIChfYnV0dG9uRWwuZGlzYWJsZWQpIHJldHVybjtcbiAgY29uc3QgeyBjYWxlbmRhckVsLCBjYWxlbmRhckRhdGUsIG1pbkRhdGUsIG1heERhdGUgfSA9XG4gICAgZ2V0RGF0ZVBpY2tlckNvbnRleHQoX2J1dHRvbkVsKTtcbiAgbGV0IGRhdGUgPSBzdWJZZWFycyhjYWxlbmRhckRhdGUsIDEpO1xuICBkYXRlID0ga2VlcERhdGVCZXR3ZWVuTWluQW5kTWF4KGRhdGUsIG1pbkRhdGUsIG1heERhdGUpO1xuICBjb25zdCBuZXdDYWxlbmRhciA9IHJlbmRlckNhbGVuZGFyKGNhbGVuZGFyRWwsIGRhdGUpO1xuXG4gIGxldCBuZXh0VG9Gb2N1cyA9IG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfUFJFVklPVVNfWUVBUik7XG4gIGlmIChuZXh0VG9Gb2N1cy5kaXNhYmxlZCkge1xuICAgIG5leHRUb0ZvY3VzID0gbmV3Q2FsZW5kYXIucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9EQVRFX1BJQ0tFUik7XG4gIH1cbiAgbmV4dFRvRm9jdXMuZm9jdXMoKTtcbn07XG5cbi8qKlxuICogTmF2aWdhdGUgYmFjayBvbmUgbW9udGggYW5kIGRpc3BsYXkgdGhlIGNhbGVuZGFyLlxuICpcbiAqIEBwYXJhbSB7SFRNTEJ1dHRvbkVsZW1lbnR9IF9idXR0b25FbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKi9cbmNvbnN0IGRpc3BsYXlQcmV2aW91c01vbnRoID0gKF9idXR0b25FbCkgPT4ge1xuICBpZiAoX2J1dHRvbkVsLmRpc2FibGVkKSByZXR1cm47XG4gIGNvbnN0IHsgY2FsZW5kYXJFbCwgY2FsZW5kYXJEYXRlLCBtaW5EYXRlLCBtYXhEYXRlIH0gPVxuICAgIGdldERhdGVQaWNrZXJDb250ZXh0KF9idXR0b25FbCk7XG4gIGxldCBkYXRlID0gc3ViTW9udGhzKGNhbGVuZGFyRGF0ZSwgMSk7XG4gIGRhdGUgPSBrZWVwRGF0ZUJldHdlZW5NaW5BbmRNYXgoZGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSk7XG4gIGNvbnN0IG5ld0NhbGVuZGFyID0gcmVuZGVyQ2FsZW5kYXIoY2FsZW5kYXJFbCwgZGF0ZSk7XG5cbiAgbGV0IG5leHRUb0ZvY3VzID0gbmV3Q2FsZW5kYXIucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9QUkVWSU9VU19NT05USCk7XG4gIGlmIChuZXh0VG9Gb2N1cy5kaXNhYmxlZCkge1xuICAgIG5leHRUb0ZvY3VzID0gbmV3Q2FsZW5kYXIucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9EQVRFX1BJQ0tFUik7XG4gIH1cbiAgbmV4dFRvRm9jdXMuZm9jdXMoKTtcbn07XG5cbi8qKlxuICogTmF2aWdhdGUgZm9yd2FyZCBvbmUgbW9udGggYW5kIGRpc3BsYXkgdGhlIGNhbGVuZGFyLlxuICpcbiAqIEBwYXJhbSB7SFRNTEJ1dHRvbkVsZW1lbnR9IF9idXR0b25FbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKi9cbmNvbnN0IGRpc3BsYXlOZXh0TW9udGggPSAoX2J1dHRvbkVsKSA9PiB7XG4gIGlmIChfYnV0dG9uRWwuZGlzYWJsZWQpIHJldHVybjtcbiAgY29uc3QgeyBjYWxlbmRhckVsLCBjYWxlbmRhckRhdGUsIG1pbkRhdGUsIG1heERhdGUgfSA9XG4gICAgZ2V0RGF0ZVBpY2tlckNvbnRleHQoX2J1dHRvbkVsKTtcbiAgbGV0IGRhdGUgPSBhZGRNb250aHMoY2FsZW5kYXJEYXRlLCAxKTtcbiAgZGF0ZSA9IGtlZXBEYXRlQmV0d2Vlbk1pbkFuZE1heChkYXRlLCBtaW5EYXRlLCBtYXhEYXRlKTtcbiAgY29uc3QgbmV3Q2FsZW5kYXIgPSByZW5kZXJDYWxlbmRhcihjYWxlbmRhckVsLCBkYXRlKTtcblxuICBsZXQgbmV4dFRvRm9jdXMgPSBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX05FWFRfTU9OVEgpO1xuICBpZiAobmV4dFRvRm9jdXMuZGlzYWJsZWQpIHtcbiAgICBuZXh0VG9Gb2N1cyA9IG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfREFURV9QSUNLRVIpO1xuICB9XG4gIG5leHRUb0ZvY3VzLmZvY3VzKCk7XG59O1xuXG4vKipcbiAqIE5hdmlnYXRlIGZvcndhcmQgb25lIHllYXIgYW5kIGRpc3BsYXkgdGhlIGNhbGVuZGFyLlxuICpcbiAqIEBwYXJhbSB7SFRNTEJ1dHRvbkVsZW1lbnR9IF9idXR0b25FbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKi9cbmNvbnN0IGRpc3BsYXlOZXh0WWVhciA9IChfYnV0dG9uRWwpID0+IHtcbiAgaWYgKF9idXR0b25FbC5kaXNhYmxlZCkgcmV0dXJuO1xuICBjb25zdCB7IGNhbGVuZGFyRWwsIGNhbGVuZGFyRGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSB9ID1cbiAgICBnZXREYXRlUGlja2VyQ29udGV4dChfYnV0dG9uRWwpO1xuICBsZXQgZGF0ZSA9IGFkZFllYXJzKGNhbGVuZGFyRGF0ZSwgMSk7XG4gIGRhdGUgPSBrZWVwRGF0ZUJldHdlZW5NaW5BbmRNYXgoZGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSk7XG4gIGNvbnN0IG5ld0NhbGVuZGFyID0gcmVuZGVyQ2FsZW5kYXIoY2FsZW5kYXJFbCwgZGF0ZSk7XG5cbiAgbGV0IG5leHRUb0ZvY3VzID0gbmV3Q2FsZW5kYXIucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9ORVhUX1lFQVIpO1xuICBpZiAobmV4dFRvRm9jdXMuZGlzYWJsZWQpIHtcbiAgICBuZXh0VG9Gb2N1cyA9IG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfREFURV9QSUNLRVIpO1xuICB9XG4gIG5leHRUb0ZvY3VzLmZvY3VzKCk7XG59O1xuXG4vKipcbiAqIEhpZGUgdGhlIGNhbGVuZGFyIG9mIGEgZGF0ZSBwaWNrZXIgY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcbiAqL1xuY29uc3QgaGlkZUNhbGVuZGFyID0gKGVsKSA9PiB7XG4gIGNvbnN0IHsgZGF0ZVBpY2tlckVsLCBjYWxlbmRhckVsLCBzdGF0dXNFbCB9ID0gZ2V0RGF0ZVBpY2tlckNvbnRleHQoZWwpO1xuXG4gIGRhdGVQaWNrZXJFbC5jbGFzc0xpc3QucmVtb3ZlKERBVEVfUElDS0VSX0FDVElWRV9DTEFTUyk7XG4gIGNhbGVuZGFyRWwuaGlkZGVuID0gdHJ1ZTtcbiAgc3RhdHVzRWwudGV4dENvbnRlbnQgPSBcIlwiO1xufTtcblxuLyoqXG4gKiBTZWxlY3QgYSBkYXRlIHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSB7SFRNTEJ1dHRvbkVsZW1lbnR9IGNhbGVuZGFyRGF0ZUVsIEEgZGF0ZSBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKi9cbmNvbnN0IHNlbGVjdERhdGUgPSAoY2FsZW5kYXJEYXRlRWwpID0+IHtcbiAgaWYgKGNhbGVuZGFyRGF0ZUVsLmRpc2FibGVkKSByZXR1cm47XG5cbiAgY29uc3QgeyBkYXRlUGlja2VyRWwsIGV4dGVybmFsSW5wdXRFbCB9ID1cbiAgICBnZXREYXRlUGlja2VyQ29udGV4dChjYWxlbmRhckRhdGVFbCk7XG5cbiAgc2V0Q2FsZW5kYXJWYWx1ZShjYWxlbmRhckRhdGVFbCwgY2FsZW5kYXJEYXRlRWwuZGF0YXNldC52YWx1ZSk7XG4gIGhpZGVDYWxlbmRhcihkYXRlUGlja2VyRWwpO1xuXG4gIGV4dGVybmFsSW5wdXRFbC5mb2N1cygpO1xufTtcblxuLyoqXG4gKiBUb2dnbGUgdGhlIGNhbGVuZGFyLlxuICpcbiAqIEBwYXJhbSB7SFRNTEJ1dHRvbkVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcbiAqL1xuY29uc3QgdG9nZ2xlQ2FsZW5kYXIgPSAoZWwpID0+IHtcbiAgaWYgKGVsLmRpc2FibGVkKSByZXR1cm47XG4gIGNvbnN0IHsgY2FsZW5kYXJFbCwgaW5wdXREYXRlLCBtaW5EYXRlLCBtYXhEYXRlLCBkZWZhdWx0RGF0ZSB9ID1cbiAgICBnZXREYXRlUGlja2VyQ29udGV4dChlbCk7XG5cbiAgaWYgKGNhbGVuZGFyRWwuaGlkZGVuKSB7XG4gICAgY29uc3QgZGF0ZVRvRGlzcGxheSA9IGtlZXBEYXRlQmV0d2Vlbk1pbkFuZE1heChcbiAgICAgIGlucHV0RGF0ZSB8fCBkZWZhdWx0RGF0ZSB8fCB0b2RheSgpLFxuICAgICAgbWluRGF0ZSxcbiAgICAgIG1heERhdGVcbiAgICApO1xuICAgIGNvbnN0IG5ld0NhbGVuZGFyID0gcmVuZGVyQ2FsZW5kYXIoY2FsZW5kYXJFbCwgZGF0ZVRvRGlzcGxheSk7XG4gICAgbmV3Q2FsZW5kYXIucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9EQVRFX0ZPQ1VTRUQpLmZvY3VzKCk7XG4gIH0gZWxzZSB7XG4gICAgaGlkZUNhbGVuZGFyKGVsKTtcbiAgfVxufTtcblxuLyoqXG4gKiBVcGRhdGUgdGhlIGNhbGVuZGFyIHdoZW4gdmlzaWJsZS5cbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBhbiBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXJcbiAqL1xuY29uc3QgdXBkYXRlQ2FsZW5kYXJJZlZpc2libGUgPSAoZWwpID0+IHtcbiAgY29uc3QgeyBjYWxlbmRhckVsLCBpbnB1dERhdGUsIG1pbkRhdGUsIG1heERhdGUgfSA9IGdldERhdGVQaWNrZXJDb250ZXh0KGVsKTtcbiAgY29uc3QgY2FsZW5kYXJTaG93biA9ICFjYWxlbmRhckVsLmhpZGRlbjtcblxuICBpZiAoY2FsZW5kYXJTaG93biAmJiBpbnB1dERhdGUpIHtcbiAgICBjb25zdCBkYXRlVG9EaXNwbGF5ID0ga2VlcERhdGVCZXR3ZWVuTWluQW5kTWF4KGlucHV0RGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSk7XG4gICAgcmVuZGVyQ2FsZW5kYXIoY2FsZW5kYXJFbCwgZGF0ZVRvRGlzcGxheSk7XG4gIH1cbn07XG5cbi8vICNlbmRyZWdpb24gQ2FsZW5kYXIgLSBEYXRlIFNlbGVjdGlvbiBWaWV3XG5cbi8vICNyZWdpb24gQ2FsZW5kYXIgLSBNb250aCBTZWxlY3Rpb24gVmlld1xuLyoqXG4gKiBEaXNwbGF5IHRoZSBtb250aCBzZWxlY3Rpb24gc2NyZWVuIGluIHRoZSBkYXRlIHBpY2tlci5cbiAqXG4gKiBAcGFyYW0ge0hUTUxCdXR0b25FbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9IGEgcmVmZXJlbmNlIHRvIHRoZSBuZXcgY2FsZW5kYXIgZWxlbWVudFxuICovXG5jb25zdCBkaXNwbGF5TW9udGhTZWxlY3Rpb24gPSAoZWwsIG1vbnRoVG9EaXNwbGF5KSA9PiB7XG4gIGNvbnN0IHsgY2FsZW5kYXJFbCwgc3RhdHVzRWwsIGNhbGVuZGFyRGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSB9ID1cbiAgICBnZXREYXRlUGlja2VyQ29udGV4dChlbCk7XG5cbiAgY29uc3Qgc2VsZWN0ZWRNb250aCA9IGNhbGVuZGFyRGF0ZS5nZXRNb250aCgpO1xuICBjb25zdCBmb2N1c2VkTW9udGggPSBtb250aFRvRGlzcGxheSA9PSBudWxsID8gc2VsZWN0ZWRNb250aCA6IG1vbnRoVG9EaXNwbGF5O1xuXG4gIGNvbnN0IG1vbnRocyA9IE1PTlRIX0xBQkVMUy5tYXAoKG1vbnRoLCBpbmRleCkgPT4ge1xuICAgIGNvbnN0IG1vbnRoVG9DaGVjayA9IHNldE1vbnRoKGNhbGVuZGFyRGF0ZSwgaW5kZXgpO1xuXG4gICAgY29uc3QgaXNEaXNhYmxlZCA9IGlzRGF0ZXNNb250aE91dHNpZGVNaW5Pck1heChcbiAgICAgIG1vbnRoVG9DaGVjayxcbiAgICAgIG1pbkRhdGUsXG4gICAgICBtYXhEYXRlXG4gICAgKTtcblxuICAgIGxldCB0YWJpbmRleCA9IFwiLTFcIjtcblxuICAgIGNvbnN0IGNsYXNzZXMgPSBbQ0FMRU5EQVJfTU9OVEhfQ0xBU1NdO1xuICAgIGNvbnN0IGlzU2VsZWN0ZWQgPSBpbmRleCA9PT0gc2VsZWN0ZWRNb250aDtcblxuICAgIGlmIChpbmRleCA9PT0gZm9jdXNlZE1vbnRoKSB7XG4gICAgICB0YWJpbmRleCA9IFwiMFwiO1xuICAgICAgY2xhc3Nlcy5wdXNoKENBTEVOREFSX01PTlRIX0ZPQ1VTRURfQ0xBU1MpO1xuICAgIH1cblxuICAgIGlmIChpc1NlbGVjdGVkKSB7XG4gICAgICBjbGFzc2VzLnB1c2goQ0FMRU5EQVJfTU9OVEhfU0VMRUNURURfQ0xBU1MpO1xuICAgIH1cblxuICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgYnRuLnNldEF0dHJpYnV0ZShcInR5cGVcIiwgXCJidXR0b25cIik7XG4gICAgYnRuLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIHRhYmluZGV4KTtcbiAgICBidG4uc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgY2xhc3Nlcy5qb2luKFwiIFwiKSk7XG4gICAgYnRuLnNldEF0dHJpYnV0ZShcImRhdGEtdmFsdWVcIiwgaW5kZXgpO1xuICAgIGJ0bi5zZXRBdHRyaWJ1dGUoXCJkYXRhLWxhYmVsXCIsIG1vbnRoKTtcbiAgICBidG4uc2V0QXR0cmlidXRlKFwiYXJpYS1zZWxlY3RlZFwiLCBpc1NlbGVjdGVkID8gXCJ0cnVlXCIgOiBcImZhbHNlXCIpO1xuICAgIGlmIChpc0Rpc2FibGVkID09PSB0cnVlKSB7XG4gICAgICBidG4uZGlzYWJsZWQgPSB0cnVlO1xuICAgIH1cbiAgICBidG4udGV4dENvbnRlbnQgPSBtb250aDtcblxuICAgIHJldHVybiBidG47XG4gIH0pO1xuXG4gIGNvbnN0IG1vbnRoc0h0bWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBtb250aHNIdG1sLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIFwiLTFcIik7XG4gIG1vbnRoc0h0bWwuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgQ0FMRU5EQVJfTU9OVEhfUElDS0VSX0NMQVNTKTtcblxuICBjb25zdCB0YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0YWJsZVwiKTtcbiAgdGFibGUuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgQ0FMRU5EQVJfVEFCTEVfQ0xBU1MpO1xuICB0YWJsZS5zZXRBdHRyaWJ1dGUoXCJyb2xlXCIsIFwicHJlc2VudGF0aW9uXCIpO1xuXG4gIGNvbnN0IG1vbnRoc0dyaWQgPSBsaXN0VG9HcmlkSHRtbChtb250aHMsIDMpO1xuICBjb25zdCB0YWJsZUJvZHkgPSBjcmVhdGVUYWJsZUJvZHkobW9udGhzR3JpZCk7XG4gIHRhYmxlLmluc2VydEFkamFjZW50RWxlbWVudChcImJlZm9yZWVuZFwiLCB0YWJsZUJvZHkpO1xuICBtb250aHNIdG1sLmluc2VydEFkamFjZW50RWxlbWVudChcImJlZm9yZWVuZFwiLCB0YWJsZSk7XG5cbiAgY29uc3QgbmV3Q2FsZW5kYXIgPSBjYWxlbmRhckVsLmNsb25lTm9kZSgpO1xuICBuZXdDYWxlbmRhci5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJiZWZvcmVlbmRcIiwgbW9udGhzSHRtbCk7XG4gIGNhbGVuZGFyRWwucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQobmV3Q2FsZW5kYXIsIGNhbGVuZGFyRWwpO1xuXG4gIHN0YXR1c0VsLnRleHRDb250ZW50ID0gXCJTZWxlY3QgYSBtb250aC5cIjtcblxuICByZXR1cm4gbmV3Q2FsZW5kYXI7XG59O1xuXG4vKipcbiAqIFNlbGVjdCBhIG1vbnRoIGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHtIVE1MQnV0dG9uRWxlbWVudH0gbW9udGhFbCBBbiBtb250aCBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKi9cbmNvbnN0IHNlbGVjdE1vbnRoID0gKG1vbnRoRWwpID0+IHtcbiAgaWYgKG1vbnRoRWwuZGlzYWJsZWQpIHJldHVybjtcbiAgY29uc3QgeyBjYWxlbmRhckVsLCBjYWxlbmRhckRhdGUsIG1pbkRhdGUsIG1heERhdGUgfSA9XG4gICAgZ2V0RGF0ZVBpY2tlckNvbnRleHQobW9udGhFbCk7XG4gIGNvbnN0IHNlbGVjdGVkTW9udGggPSBwYXJzZUludChtb250aEVsLmRhdGFzZXQudmFsdWUsIDEwKTtcbiAgbGV0IGRhdGUgPSBzZXRNb250aChjYWxlbmRhckRhdGUsIHNlbGVjdGVkTW9udGgpO1xuICBkYXRlID0ga2VlcERhdGVCZXR3ZWVuTWluQW5kTWF4KGRhdGUsIG1pbkRhdGUsIG1heERhdGUpO1xuICBjb25zdCBuZXdDYWxlbmRhciA9IHJlbmRlckNhbGVuZGFyKGNhbGVuZGFyRWwsIGRhdGUpO1xuICBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX0RBVEVfRk9DVVNFRCkuZm9jdXMoKTtcbn07XG5cbi8vICNlbmRyZWdpb24gQ2FsZW5kYXIgLSBNb250aCBTZWxlY3Rpb24gVmlld1xuXG4vLyAjcmVnaW9uIENhbGVuZGFyIC0gWWVhciBTZWxlY3Rpb24gVmlld1xuXG4vKipcbiAqIERpc3BsYXkgdGhlIHllYXIgc2VsZWN0aW9uIHNjcmVlbiBpbiB0aGUgZGF0ZSBwaWNrZXIuXG4gKlxuICogQHBhcmFtIHtIVE1MQnV0dG9uRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICogQHBhcmFtIHtudW1iZXJ9IHllYXJUb0Rpc3BsYXkgeWVhciB0byBkaXNwbGF5IGluIHllYXIgc2VsZWN0aW9uXG4gKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9IGEgcmVmZXJlbmNlIHRvIHRoZSBuZXcgY2FsZW5kYXIgZWxlbWVudFxuICovXG5jb25zdCBkaXNwbGF5WWVhclNlbGVjdGlvbiA9IChlbCwgeWVhclRvRGlzcGxheSkgPT4ge1xuICBjb25zdCB7IGNhbGVuZGFyRWwsIHN0YXR1c0VsLCBjYWxlbmRhckRhdGUsIG1pbkRhdGUsIG1heERhdGUgfSA9XG4gICAgZ2V0RGF0ZVBpY2tlckNvbnRleHQoZWwpO1xuXG4gIGNvbnN0IHNlbGVjdGVkWWVhciA9IGNhbGVuZGFyRGF0ZS5nZXRGdWxsWWVhcigpO1xuICBjb25zdCBmb2N1c2VkWWVhciA9IHllYXJUb0Rpc3BsYXkgPT0gbnVsbCA/IHNlbGVjdGVkWWVhciA6IHllYXJUb0Rpc3BsYXk7XG5cbiAgbGV0IHllYXJUb0NodW5rID0gZm9jdXNlZFllYXI7XG4gIHllYXJUb0NodW5rIC09IHllYXJUb0NodW5rICUgWUVBUl9DSFVOSztcbiAgeWVhclRvQ2h1bmsgPSBNYXRoLm1heCgwLCB5ZWFyVG9DaHVuayk7XG5cbiAgY29uc3QgcHJldlllYXJDaHVua0Rpc2FibGVkID0gaXNEYXRlc1llYXJPdXRzaWRlTWluT3JNYXgoXG4gICAgc2V0WWVhcihjYWxlbmRhckRhdGUsIHllYXJUb0NodW5rIC0gMSksXG4gICAgbWluRGF0ZSxcbiAgICBtYXhEYXRlXG4gICk7XG5cbiAgY29uc3QgbmV4dFllYXJDaHVua0Rpc2FibGVkID0gaXNEYXRlc1llYXJPdXRzaWRlTWluT3JNYXgoXG4gICAgc2V0WWVhcihjYWxlbmRhckRhdGUsIHllYXJUb0NodW5rICsgWUVBUl9DSFVOSyksXG4gICAgbWluRGF0ZSxcbiAgICBtYXhEYXRlXG4gICk7XG5cbiAgY29uc3QgeWVhcnMgPSBbXTtcbiAgbGV0IHllYXJJbmRleCA9IHllYXJUb0NodW5rO1xuICB3aGlsZSAoeWVhcnMubGVuZ3RoIDwgWUVBUl9DSFVOSykge1xuICAgIGNvbnN0IGlzRGlzYWJsZWQgPSBpc0RhdGVzWWVhck91dHNpZGVNaW5Pck1heChcbiAgICAgIHNldFllYXIoY2FsZW5kYXJEYXRlLCB5ZWFySW5kZXgpLFxuICAgICAgbWluRGF0ZSxcbiAgICAgIG1heERhdGVcbiAgICApO1xuXG4gICAgbGV0IHRhYmluZGV4ID0gXCItMVwiO1xuXG4gICAgY29uc3QgY2xhc3NlcyA9IFtDQUxFTkRBUl9ZRUFSX0NMQVNTXTtcbiAgICBjb25zdCBpc1NlbGVjdGVkID0geWVhckluZGV4ID09PSBzZWxlY3RlZFllYXI7XG5cbiAgICBpZiAoeWVhckluZGV4ID09PSBmb2N1c2VkWWVhcikge1xuICAgICAgdGFiaW5kZXggPSBcIjBcIjtcbiAgICAgIGNsYXNzZXMucHVzaChDQUxFTkRBUl9ZRUFSX0ZPQ1VTRURfQ0xBU1MpO1xuICAgIH1cblxuICAgIGlmIChpc1NlbGVjdGVkKSB7XG4gICAgICBjbGFzc2VzLnB1c2goQ0FMRU5EQVJfWUVBUl9TRUxFQ1RFRF9DTEFTUyk7XG4gICAgfVxuXG4gICAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICBidG4uc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcImJ1dHRvblwiKTtcbiAgICBidG4uc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIiwgdGFiaW5kZXgpO1xuICAgIGJ0bi5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBjbGFzc2VzLmpvaW4oXCIgXCIpKTtcbiAgICBidG4uc2V0QXR0cmlidXRlKFwiZGF0YS12YWx1ZVwiLCB5ZWFySW5kZXgpO1xuICAgIGJ0bi5zZXRBdHRyaWJ1dGUoXCJhcmlhLXNlbGVjdGVkXCIsIGlzU2VsZWN0ZWQgPyBcInRydWVcIiA6IFwiZmFsc2VcIik7XG4gICAgaWYgKGlzRGlzYWJsZWQgPT09IHRydWUpIHtcbiAgICAgIGJ0bi5kaXNhYmxlZCA9IHRydWU7XG4gICAgfVxuICAgIGJ0bi50ZXh0Q29udGVudCA9IHllYXJJbmRleDtcblxuICAgIHllYXJzLnB1c2goYnRuKTtcbiAgICB5ZWFySW5kZXggKz0gMTtcbiAgfVxuXG4gIGNvbnN0IG5ld0NhbGVuZGFyID0gY2FsZW5kYXJFbC5jbG9uZU5vZGUoKTtcblxuICAvLyBjcmVhdGUgdGhlIHllYXJzIGNhbGVuZGFyIHdyYXBwZXJcbiAgY29uc3QgeWVhcnNDYWxlbmRhcldyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB5ZWFyc0NhbGVuZGFyV3JhcHBlci5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCBcIi0xXCIpO1xuICB5ZWFyc0NhbGVuZGFyV3JhcHBlci5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBDQUxFTkRBUl9ZRUFSX1BJQ0tFUl9DTEFTUyk7XG5cbiAgLy8gY3JlYXRlIHRhYmxlIHBhcmVudFxuICBjb25zdCB5ZWFyc1RhYmxlUGFyZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRhYmxlXCIpO1xuICB5ZWFyc1RhYmxlUGFyZW50LnNldEF0dHJpYnV0ZShcInJvbGVcIiwgXCJwcmVzZW50YXRpb25cIik7XG4gIHllYXJzVGFibGVQYXJlbnQuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgQ0FMRU5EQVJfVEFCTEVfQ0xBU1MpO1xuXG4gIC8vIGNyZWF0ZSB0YWJsZSBib2R5IGFuZCB0YWJsZSByb3dcbiAgY29uc3QgeWVhcnNIVE1MVGFibGVCb2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRib2R5XCIpO1xuICBjb25zdCB5ZWFyc0hUTUxUYWJsZUJvZHlSb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidHJcIik7XG5cbiAgLy8gY3JlYXRlIHByZXZpb3VzIGJ1dHRvblxuICBjb25zdCBwcmV2aW91c1llYXJzQnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgcHJldmlvdXNZZWFyc0J0bi5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsIFwiYnV0dG9uXCIpO1xuICBwcmV2aW91c1llYXJzQnRuLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIENBTEVOREFSX1BSRVZJT1VTX1lFQVJfQ0hVTktfQ0xBU1MpO1xuICBwcmV2aW91c1llYXJzQnRuLnNldEF0dHJpYnV0ZShcbiAgICBcImFyaWEtbGFiZWxcIixcbiAgICBgTmF2aWdhdGUgYmFjayAke1lFQVJfQ0hVTkt9IHllYXJzYFxuICApO1xuICBpZiAocHJldlllYXJDaHVua0Rpc2FibGVkID09PSB0cnVlKSB7XG4gICAgcHJldmlvdXNZZWFyc0J0bi5kaXNhYmxlZCA9IHRydWU7XG4gIH1cbiAgcHJldmlvdXNZZWFyc0J0bi5pbm5lckhUTUwgPSBTYW5pdGl6ZXIuZXNjYXBlSFRNTGAmbmJzcGA7XG5cbiAgLy8gY3JlYXRlIG5leHQgYnV0dG9uXG4gIGNvbnN0IG5leHRZZWFyc0J0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gIG5leHRZZWFyc0J0bi5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsIFwiYnV0dG9uXCIpO1xuICBuZXh0WWVhcnNCdG4uc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgQ0FMRU5EQVJfTkVYVF9ZRUFSX0NIVU5LX0NMQVNTKTtcbiAgbmV4dFllYXJzQnRuLnNldEF0dHJpYnV0ZShcbiAgICBcImFyaWEtbGFiZWxcIixcbiAgICBgTmF2aWdhdGUgZm9yd2FyZCAke1lFQVJfQ0hVTkt9IHllYXJzYFxuICApO1xuICBpZiAobmV4dFllYXJDaHVua0Rpc2FibGVkID09PSB0cnVlKSB7XG4gICAgbmV4dFllYXJzQnRuLmRpc2FibGVkID0gdHJ1ZTtcbiAgfVxuICBuZXh0WWVhcnNCdG4uaW5uZXJIVE1MID0gU2FuaXRpemVyLmVzY2FwZUhUTUxgJm5ic3BgO1xuXG4gIC8vIGNyZWF0ZSB0aGUgYWN0dWFsIHllYXJzIHRhYmxlXG4gIGNvbnN0IHllYXJzVGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGFibGVcIik7XG4gIHllYXJzVGFibGUuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgQ0FMRU5EQVJfVEFCTEVfQ0xBU1MpO1xuICB5ZWFyc1RhYmxlLnNldEF0dHJpYnV0ZShcInJvbGVcIiwgXCJwcmVzZW50YXRpb25cIik7XG5cbiAgLy8gY3JlYXRlIHRoZSB5ZWFycyBjaGlsZCB0YWJsZVxuICBjb25zdCB5ZWFyc0dyaWQgPSBsaXN0VG9HcmlkSHRtbCh5ZWFycywgMyk7XG4gIGNvbnN0IHllYXJzVGFibGVCb2R5ID0gY3JlYXRlVGFibGVCb2R5KHllYXJzR3JpZCk7XG5cbiAgLy8gYXBwZW5kIHRoZSBncmlkIHRvIHRoZSB5ZWFycyBjaGlsZCB0YWJsZVxuICB5ZWFyc1RhYmxlLmluc2VydEFkamFjZW50RWxlbWVudChcImJlZm9yZWVuZFwiLCB5ZWFyc1RhYmxlQm9keSk7XG5cbiAgLy8gY3JlYXRlIHRoZSBwcmV2IGJ1dHRvbiB0ZCBhbmQgYXBwZW5kIHRoZSBwcmV2IGJ1dHRvblxuICBjb25zdCB5ZWFyc0hUTUxUYWJsZUJvZHlEZXRhaWxQcmV2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRkXCIpO1xuICB5ZWFyc0hUTUxUYWJsZUJvZHlEZXRhaWxQcmV2Lmluc2VydEFkamFjZW50RWxlbWVudChcbiAgICBcImJlZm9yZWVuZFwiLFxuICAgIHByZXZpb3VzWWVhcnNCdG5cbiAgKTtcblxuICAvLyBjcmVhdGUgdGhlIHllYXJzIHRkIGFuZCBhcHBlbmQgdGhlIHllYXJzIGNoaWxkIHRhYmxlXG4gIGNvbnN0IHllYXJzSFRNTFRhYmxlQm9keVllYXJzRGV0YWlsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRkXCIpO1xuICB5ZWFyc0hUTUxUYWJsZUJvZHlZZWFyc0RldGFpbC5zZXRBdHRyaWJ1dGUoXCJjb2xzcGFuXCIsIFwiM1wiKTtcbiAgeWVhcnNIVE1MVGFibGVCb2R5WWVhcnNEZXRhaWwuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIHllYXJzVGFibGUpO1xuXG4gIC8vIGNyZWF0ZSB0aGUgbmV4dCBidXR0b24gdGQgYW5kIGFwcGVuZCB0aGUgbmV4dCBidXR0b25cbiAgY29uc3QgeWVhcnNIVE1MVGFibGVCb2R5RGV0YWlsTmV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZFwiKTtcbiAgeWVhcnNIVE1MVGFibGVCb2R5RGV0YWlsTmV4dC5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJiZWZvcmVlbmRcIiwgbmV4dFllYXJzQnRuKTtcblxuICAvLyBhcHBlbmQgdGhlIHRocmVlIHRkIHRvIHRoZSB5ZWFycyBjaGlsZCB0YWJsZSByb3dcbiAgeWVhcnNIVE1MVGFibGVCb2R5Um93Lmluc2VydEFkamFjZW50RWxlbWVudChcbiAgICBcImJlZm9yZWVuZFwiLFxuICAgIHllYXJzSFRNTFRhYmxlQm9keURldGFpbFByZXZcbiAgKTtcbiAgeWVhcnNIVE1MVGFibGVCb2R5Um93Lmluc2VydEFkamFjZW50RWxlbWVudChcbiAgICBcImJlZm9yZWVuZFwiLFxuICAgIHllYXJzSFRNTFRhYmxlQm9keVllYXJzRGV0YWlsXG4gICk7XG4gIHllYXJzSFRNTFRhYmxlQm9keVJvdy5pbnNlcnRBZGphY2VudEVsZW1lbnQoXG4gICAgXCJiZWZvcmVlbmRcIixcbiAgICB5ZWFyc0hUTUxUYWJsZUJvZHlEZXRhaWxOZXh0XG4gICk7XG5cbiAgLy8gYXBwZW5kIHRoZSB0YWJsZSByb3cgdG8gdGhlIHllYXJzIGNoaWxkIHRhYmxlIGJvZHlcbiAgeWVhcnNIVE1MVGFibGVCb2R5Lmluc2VydEFkamFjZW50RWxlbWVudChcImJlZm9yZWVuZFwiLCB5ZWFyc0hUTUxUYWJsZUJvZHlSb3cpO1xuXG4gIC8vIGFwcGVuZCB0aGUgeWVhcnMgdGFibGUgYm9keSB0byB0aGUgeWVhcnMgcGFyZW50IHRhYmxlXG4gIHllYXJzVGFibGVQYXJlbnQuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIHllYXJzSFRNTFRhYmxlQm9keSk7XG5cbiAgLy8gYXBwZW5kIHRoZSBwYXJlbnQgdGFibGUgdG8gdGhlIGNhbGVuZGFyIHdyYXBwZXJcbiAgeWVhcnNDYWxlbmRhcldyYXBwZXIuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KFwiYmVmb3JlZW5kXCIsIHllYXJzVGFibGVQYXJlbnQpO1xuXG4gIC8vIGFwcGVuZCB0aGUgeWVhcnMgY2FsZW5kZXIgdG8gdGhlIG5ldyBjYWxlbmRhclxuICBuZXdDYWxlbmRhci5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJiZWZvcmVlbmRcIiwgeWVhcnNDYWxlbmRhcldyYXBwZXIpO1xuXG4gIC8vIHJlcGxhY2UgY2FsZW5kYXJcbiAgY2FsZW5kYXJFbC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChuZXdDYWxlbmRhciwgY2FsZW5kYXJFbCk7XG5cbiAgc3RhdHVzRWwudGV4dENvbnRlbnQgPSBTYW5pdGl6ZXIuZXNjYXBlSFRNTGBTaG93aW5nIHllYXJzICR7eWVhclRvQ2h1bmt9IHRvICR7XG4gICAgeWVhclRvQ2h1bmsgKyBZRUFSX0NIVU5LIC0gMVxuICB9LiBTZWxlY3QgYSB5ZWFyLmA7XG5cbiAgcmV0dXJuIG5ld0NhbGVuZGFyO1xufTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSBiYWNrIGJ5IHllYXJzIGFuZCBkaXNwbGF5IHRoZSB5ZWFyIHNlbGVjdGlvbiBzY3JlZW4uXG4gKlxuICogQHBhcmFtIHtIVE1MQnV0dG9uRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICovXG5jb25zdCBkaXNwbGF5UHJldmlvdXNZZWFyQ2h1bmsgPSAoZWwpID0+IHtcbiAgaWYgKGVsLmRpc2FibGVkKSByZXR1cm47XG5cbiAgY29uc3QgeyBjYWxlbmRhckVsLCBjYWxlbmRhckRhdGUsIG1pbkRhdGUsIG1heERhdGUgfSA9XG4gICAgZ2V0RGF0ZVBpY2tlckNvbnRleHQoZWwpO1xuICBjb25zdCB5ZWFyRWwgPSBjYWxlbmRhckVsLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfWUVBUl9GT0NVU0VEKTtcbiAgY29uc3Qgc2VsZWN0ZWRZZWFyID0gcGFyc2VJbnQoeWVhckVsLnRleHRDb250ZW50LCAxMCk7XG5cbiAgbGV0IGFkanVzdGVkWWVhciA9IHNlbGVjdGVkWWVhciAtIFlFQVJfQ0hVTks7XG4gIGFkanVzdGVkWWVhciA9IE1hdGgubWF4KDAsIGFkanVzdGVkWWVhcik7XG5cbiAgY29uc3QgZGF0ZSA9IHNldFllYXIoY2FsZW5kYXJEYXRlLCBhZGp1c3RlZFllYXIpO1xuICBjb25zdCBjYXBwZWREYXRlID0ga2VlcERhdGVCZXR3ZWVuTWluQW5kTWF4KGRhdGUsIG1pbkRhdGUsIG1heERhdGUpO1xuICBjb25zdCBuZXdDYWxlbmRhciA9IGRpc3BsYXlZZWFyU2VsZWN0aW9uKFxuICAgIGNhbGVuZGFyRWwsXG4gICAgY2FwcGVkRGF0ZS5nZXRGdWxsWWVhcigpXG4gICk7XG5cbiAgbGV0IG5leHRUb0ZvY3VzID0gbmV3Q2FsZW5kYXIucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9QUkVWSU9VU19ZRUFSX0NIVU5LKTtcbiAgaWYgKG5leHRUb0ZvY3VzLmRpc2FibGVkKSB7XG4gICAgbmV4dFRvRm9jdXMgPSBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX1lFQVJfUElDS0VSKTtcbiAgfVxuICBuZXh0VG9Gb2N1cy5mb2N1cygpO1xufTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSBmb3J3YXJkIGJ5IHllYXJzIGFuZCBkaXNwbGF5IHRoZSB5ZWFyIHNlbGVjdGlvbiBzY3JlZW4uXG4gKlxuICogQHBhcmFtIHtIVE1MQnV0dG9uRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICovXG5jb25zdCBkaXNwbGF5TmV4dFllYXJDaHVuayA9IChlbCkgPT4ge1xuICBpZiAoZWwuZGlzYWJsZWQpIHJldHVybjtcblxuICBjb25zdCB7IGNhbGVuZGFyRWwsIGNhbGVuZGFyRGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSB9ID1cbiAgICBnZXREYXRlUGlja2VyQ29udGV4dChlbCk7XG4gIGNvbnN0IHllYXJFbCA9IGNhbGVuZGFyRWwucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9ZRUFSX0ZPQ1VTRUQpO1xuICBjb25zdCBzZWxlY3RlZFllYXIgPSBwYXJzZUludCh5ZWFyRWwudGV4dENvbnRlbnQsIDEwKTtcblxuICBsZXQgYWRqdXN0ZWRZZWFyID0gc2VsZWN0ZWRZZWFyICsgWUVBUl9DSFVOSztcbiAgYWRqdXN0ZWRZZWFyID0gTWF0aC5tYXgoMCwgYWRqdXN0ZWRZZWFyKTtcblxuICBjb25zdCBkYXRlID0gc2V0WWVhcihjYWxlbmRhckRhdGUsIGFkanVzdGVkWWVhcik7XG4gIGNvbnN0IGNhcHBlZERhdGUgPSBrZWVwRGF0ZUJldHdlZW5NaW5BbmRNYXgoZGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSk7XG4gIGNvbnN0IG5ld0NhbGVuZGFyID0gZGlzcGxheVllYXJTZWxlY3Rpb24oXG4gICAgY2FsZW5kYXJFbCxcbiAgICBjYXBwZWREYXRlLmdldEZ1bGxZZWFyKClcbiAgKTtcblxuICBsZXQgbmV4dFRvRm9jdXMgPSBuZXdDYWxlbmRhci5xdWVyeVNlbGVjdG9yKENBTEVOREFSX05FWFRfWUVBUl9DSFVOSyk7XG4gIGlmIChuZXh0VG9Gb2N1cy5kaXNhYmxlZCkge1xuICAgIG5leHRUb0ZvY3VzID0gbmV3Q2FsZW5kYXIucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9ZRUFSX1BJQ0tFUik7XG4gIH1cbiAgbmV4dFRvRm9jdXMuZm9jdXMoKTtcbn07XG5cbi8qKlxuICogU2VsZWN0IGEgeWVhciBpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSB7SFRNTEJ1dHRvbkVsZW1lbnR9IHllYXJFbCBBIHllYXIgZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICovXG5jb25zdCBzZWxlY3RZZWFyID0gKHllYXJFbCkgPT4ge1xuICBpZiAoeWVhckVsLmRpc2FibGVkKSByZXR1cm47XG4gIGNvbnN0IHsgY2FsZW5kYXJFbCwgY2FsZW5kYXJEYXRlLCBtaW5EYXRlLCBtYXhEYXRlIH0gPVxuICAgIGdldERhdGVQaWNrZXJDb250ZXh0KHllYXJFbCk7XG4gIGNvbnN0IHNlbGVjdGVkWWVhciA9IHBhcnNlSW50KHllYXJFbC5pbm5lckhUTUwsIDEwKTtcbiAgbGV0IGRhdGUgPSBzZXRZZWFyKGNhbGVuZGFyRGF0ZSwgc2VsZWN0ZWRZZWFyKTtcbiAgZGF0ZSA9IGtlZXBEYXRlQmV0d2Vlbk1pbkFuZE1heChkYXRlLCBtaW5EYXRlLCBtYXhEYXRlKTtcbiAgY29uc3QgbmV3Q2FsZW5kYXIgPSByZW5kZXJDYWxlbmRhcihjYWxlbmRhckVsLCBkYXRlKTtcbiAgbmV3Q2FsZW5kYXIucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9EQVRFX0ZPQ1VTRUQpLmZvY3VzKCk7XG59O1xuXG4vLyAjZW5kcmVnaW9uIENhbGVuZGFyIC0gWWVhciBTZWxlY3Rpb24gVmlld1xuXG4vLyAjcmVnaW9uIENhbGVuZGFyIEV2ZW50IEhhbmRsaW5nXG5cbi8qKlxuICogSGlkZSB0aGUgY2FsZW5kYXIuXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxuICovXG5jb25zdCBoYW5kbGVFc2NhcGVGcm9tQ2FsZW5kYXIgPSAoZXZlbnQpID0+IHtcbiAgY29uc3QgeyBkYXRlUGlja2VyRWwsIGV4dGVybmFsSW5wdXRFbCB9ID0gZ2V0RGF0ZVBpY2tlckNvbnRleHQoZXZlbnQudGFyZ2V0KTtcblxuICBoaWRlQ2FsZW5kYXIoZGF0ZVBpY2tlckVsKTtcbiAgZXh0ZXJuYWxJbnB1dEVsLmZvY3VzKCk7XG5cbiAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbn07XG5cbi8vICNlbmRyZWdpb24gQ2FsZW5kYXIgRXZlbnQgSGFuZGxpbmdcblxuLy8gI3JlZ2lvbiBDYWxlbmRhciBEYXRlIEV2ZW50IEhhbmRsaW5nXG5cbi8qKlxuICogQWRqdXN0IHRoZSBkYXRlIGFuZCBkaXNwbGF5IHRoZSBjYWxlbmRhciBpZiBuZWVkZWQuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gYWRqdXN0RGF0ZUZuIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aGUgYWRqdXN0ZWQgZGF0ZVxuICovXG5jb25zdCBhZGp1c3RDYWxlbmRhciA9IChhZGp1c3REYXRlRm4pID0+IChldmVudCkgPT4ge1xuICBjb25zdCB7IGNhbGVuZGFyRWwsIGNhbGVuZGFyRGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSB9ID0gZ2V0RGF0ZVBpY2tlckNvbnRleHQoXG4gICAgZXZlbnQudGFyZ2V0XG4gICk7XG5cbiAgY29uc3QgZGF0ZSA9IGFkanVzdERhdGVGbihjYWxlbmRhckRhdGUpO1xuXG4gIGNvbnN0IGNhcHBlZERhdGUgPSBrZWVwRGF0ZUJldHdlZW5NaW5BbmRNYXgoZGF0ZSwgbWluRGF0ZSwgbWF4RGF0ZSk7XG4gIGlmICghaXNTYW1lRGF5KGNhbGVuZGFyRGF0ZSwgY2FwcGVkRGF0ZSkpIHtcbiAgICBjb25zdCBuZXdDYWxlbmRhciA9IHJlbmRlckNhbGVuZGFyKGNhbGVuZGFyRWwsIGNhcHBlZERhdGUpO1xuICAgIG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfREFURV9GT0NVU0VEKS5mb2N1cygpO1xuICB9XG4gIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG59O1xuXG4vKipcbiAqIE5hdmlnYXRlIGJhY2sgb25lIHdlZWsgYW5kIGRpc3BsYXkgdGhlIGNhbGVuZGFyLlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcbiAqL1xuY29uc3QgaGFuZGxlVXBGcm9tRGF0ZSA9IGFkanVzdENhbGVuZGFyKChkYXRlKSA9PiBzdWJXZWVrcyhkYXRlLCAxKSk7XG5cbi8qKlxuICogTmF2aWdhdGUgZm9yd2FyZCBvbmUgd2VlayBhbmQgZGlzcGxheSB0aGUgY2FsZW5kYXIuXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxuICovXG5jb25zdCBoYW5kbGVEb3duRnJvbURhdGUgPSBhZGp1c3RDYWxlbmRhcigoZGF0ZSkgPT4gYWRkV2Vla3MoZGF0ZSwgMSkpO1xuXG4vKipcbiAqIE5hdmlnYXRlIGJhY2sgb25lIGRheSBhbmQgZGlzcGxheSB0aGUgY2FsZW5kYXIuXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxuICovXG5jb25zdCBoYW5kbGVMZWZ0RnJvbURhdGUgPSBhZGp1c3RDYWxlbmRhcigoZGF0ZSkgPT4gc3ViRGF5cyhkYXRlLCAxKSk7XG5cbi8qKlxuICogTmF2aWdhdGUgZm9yd2FyZCBvbmUgZGF5IGFuZCBkaXNwbGF5IHRoZSBjYWxlbmRhci5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XG4gKi9cbmNvbnN0IGhhbmRsZVJpZ2h0RnJvbURhdGUgPSBhZGp1c3RDYWxlbmRhcigoZGF0ZSkgPT4gYWRkRGF5cyhkYXRlLCAxKSk7XG5cbi8qKlxuICogTmF2aWdhdGUgdG8gdGhlIHN0YXJ0IG9mIHRoZSB3ZWVrIGFuZCBkaXNwbGF5IHRoZSBjYWxlbmRhci5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XG4gKi9cbmNvbnN0IGhhbmRsZUhvbWVGcm9tRGF0ZSA9IGFkanVzdENhbGVuZGFyKChkYXRlKSA9PiBzdGFydE9mV2VlayhkYXRlKSk7XG5cbi8qKlxuICogTmF2aWdhdGUgdG8gdGhlIGVuZCBvZiB0aGUgd2VlayBhbmQgZGlzcGxheSB0aGUgY2FsZW5kYXIuXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxuICovXG5jb25zdCBoYW5kbGVFbmRGcm9tRGF0ZSA9IGFkanVzdENhbGVuZGFyKChkYXRlKSA9PiBlbmRPZldlZWsoZGF0ZSkpO1xuXG4vKipcbiAqIE5hdmlnYXRlIGZvcndhcmQgb25lIG1vbnRoIGFuZCBkaXNwbGF5IHRoZSBjYWxlbmRhci5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XG4gKi9cbmNvbnN0IGhhbmRsZVBhZ2VEb3duRnJvbURhdGUgPSBhZGp1c3RDYWxlbmRhcigoZGF0ZSkgPT4gYWRkTW9udGhzKGRhdGUsIDEpKTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSBiYWNrIG9uZSBtb250aCBhbmQgZGlzcGxheSB0aGUgY2FsZW5kYXIuXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxuICovXG5jb25zdCBoYW5kbGVQYWdlVXBGcm9tRGF0ZSA9IGFkanVzdENhbGVuZGFyKChkYXRlKSA9PiBzdWJNb250aHMoZGF0ZSwgMSkpO1xuXG4vKipcbiAqIE5hdmlnYXRlIGZvcndhcmQgb25lIHllYXIgYW5kIGRpc3BsYXkgdGhlIGNhbGVuZGFyLlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcbiAqL1xuY29uc3QgaGFuZGxlU2hpZnRQYWdlRG93bkZyb21EYXRlID0gYWRqdXN0Q2FsZW5kYXIoKGRhdGUpID0+IGFkZFllYXJzKGRhdGUsIDEpKTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSBiYWNrIG9uZSB5ZWFyIGFuZCBkaXNwbGF5IHRoZSBjYWxlbmRhci5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XG4gKi9cbmNvbnN0IGhhbmRsZVNoaWZ0UGFnZVVwRnJvbURhdGUgPSBhZGp1c3RDYWxlbmRhcigoZGF0ZSkgPT4gc3ViWWVhcnMoZGF0ZSwgMSkpO1xuXG4vKipcbiAqIGRpc3BsYXkgdGhlIGNhbGVuZGFyIGZvciB0aGUgbW91c2VvdmVyIGRhdGUuXG4gKlxuICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCBUaGUgbW91c2VvdmVyIGV2ZW50XG4gKiBAcGFyYW0ge0hUTUxCdXR0b25FbGVtZW50fSBkYXRlRWwgQSBkYXRlIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHBpY2tlciBjb21wb25lbnRcbiAqL1xuY29uc3QgaGFuZGxlTW91c2VvdmVyRnJvbURhdGUgPSAoZGF0ZUVsKSA9PiB7XG4gIGlmIChkYXRlRWwuZGlzYWJsZWQpIHJldHVybjtcblxuICBjb25zdCBjYWxlbmRhckVsID0gZGF0ZUVsLmNsb3Nlc3QoREFURV9QSUNLRVJfQ0FMRU5EQVIpO1xuXG4gIGNvbnN0IGN1cnJlbnRDYWxlbmRhckRhdGUgPSBjYWxlbmRhckVsLmRhdGFzZXQudmFsdWU7XG4gIGNvbnN0IGhvdmVyRGF0ZSA9IGRhdGVFbC5kYXRhc2V0LnZhbHVlO1xuXG4gIGlmIChob3ZlckRhdGUgPT09IGN1cnJlbnRDYWxlbmRhckRhdGUpIHJldHVybjtcblxuICBjb25zdCBkYXRlVG9EaXNwbGF5ID0gcGFyc2VEYXRlU3RyaW5nKGhvdmVyRGF0ZSk7XG4gIGNvbnN0IG5ld0NhbGVuZGFyID0gcmVuZGVyQ2FsZW5kYXIoY2FsZW5kYXJFbCwgZGF0ZVRvRGlzcGxheSk7XG4gIG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfREFURV9GT0NVU0VEKS5mb2N1cygpO1xufTtcblxuLy8gI2VuZHJlZ2lvbiBDYWxlbmRhciBEYXRlIEV2ZW50IEhhbmRsaW5nXG5cbi8vICNyZWdpb24gQ2FsZW5kYXIgTW9udGggRXZlbnQgSGFuZGxpbmdcblxuLyoqXG4gKiBBZGp1c3QgdGhlIG1vbnRoIGFuZCBkaXNwbGF5IHRoZSBtb250aCBzZWxlY3Rpb24gc2NyZWVuIGlmIG5lZWRlZC5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBhZGp1c3RNb250aEZuIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aGUgYWRqdXN0ZWQgbW9udGhcbiAqL1xuY29uc3QgYWRqdXN0TW9udGhTZWxlY3Rpb25TY3JlZW4gPSAoYWRqdXN0TW9udGhGbikgPT4gKGV2ZW50KSA9PiB7XG4gIGNvbnN0IG1vbnRoRWwgPSBldmVudC50YXJnZXQ7XG4gIGNvbnN0IHNlbGVjdGVkTW9udGggPSBwYXJzZUludChtb250aEVsLmRhdGFzZXQudmFsdWUsIDEwKTtcbiAgY29uc3QgeyBjYWxlbmRhckVsLCBjYWxlbmRhckRhdGUsIG1pbkRhdGUsIG1heERhdGUgfSA9XG4gICAgZ2V0RGF0ZVBpY2tlckNvbnRleHQobW9udGhFbCk7XG4gIGNvbnN0IGN1cnJlbnREYXRlID0gc2V0TW9udGgoY2FsZW5kYXJEYXRlLCBzZWxlY3RlZE1vbnRoKTtcblxuICBsZXQgYWRqdXN0ZWRNb250aCA9IGFkanVzdE1vbnRoRm4oc2VsZWN0ZWRNb250aCk7XG4gIGFkanVzdGVkTW9udGggPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxMSwgYWRqdXN0ZWRNb250aCkpO1xuXG4gIGNvbnN0IGRhdGUgPSBzZXRNb250aChjYWxlbmRhckRhdGUsIGFkanVzdGVkTW9udGgpO1xuICBjb25zdCBjYXBwZWREYXRlID0ga2VlcERhdGVCZXR3ZWVuTWluQW5kTWF4KGRhdGUsIG1pbkRhdGUsIG1heERhdGUpO1xuICBpZiAoIWlzU2FtZU1vbnRoKGN1cnJlbnREYXRlLCBjYXBwZWREYXRlKSkge1xuICAgIGNvbnN0IG5ld0NhbGVuZGFyID0gZGlzcGxheU1vbnRoU2VsZWN0aW9uKFxuICAgICAgY2FsZW5kYXJFbCxcbiAgICAgIGNhcHBlZERhdGUuZ2V0TW9udGgoKVxuICAgICk7XG4gICAgbmV3Q2FsZW5kYXIucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9NT05USF9GT0NVU0VEKS5mb2N1cygpO1xuICB9XG4gIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG59O1xuXG4vKipcbiAqIE5hdmlnYXRlIGJhY2sgdGhyZWUgbW9udGhzIGFuZCBkaXNwbGF5IHRoZSBtb250aCBzZWxlY3Rpb24gc2NyZWVuLlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcbiAqL1xuY29uc3QgaGFuZGxlVXBGcm9tTW9udGggPSBhZGp1c3RNb250aFNlbGVjdGlvblNjcmVlbigobW9udGgpID0+IG1vbnRoIC0gMyk7XG5cbi8qKlxuICogTmF2aWdhdGUgZm9yd2FyZCB0aHJlZSBtb250aHMgYW5kIGRpc3BsYXkgdGhlIG1vbnRoIHNlbGVjdGlvbiBzY3JlZW4uXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxuICovXG5jb25zdCBoYW5kbGVEb3duRnJvbU1vbnRoID0gYWRqdXN0TW9udGhTZWxlY3Rpb25TY3JlZW4oKG1vbnRoKSA9PiBtb250aCArIDMpO1xuXG4vKipcbiAqIE5hdmlnYXRlIGJhY2sgb25lIG1vbnRoIGFuZCBkaXNwbGF5IHRoZSBtb250aCBzZWxlY3Rpb24gc2NyZWVuLlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcbiAqL1xuY29uc3QgaGFuZGxlTGVmdEZyb21Nb250aCA9IGFkanVzdE1vbnRoU2VsZWN0aW9uU2NyZWVuKChtb250aCkgPT4gbW9udGggLSAxKTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSBmb3J3YXJkIG9uZSBtb250aCBhbmQgZGlzcGxheSB0aGUgbW9udGggc2VsZWN0aW9uIHNjcmVlbi5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XG4gKi9cbmNvbnN0IGhhbmRsZVJpZ2h0RnJvbU1vbnRoID0gYWRqdXN0TW9udGhTZWxlY3Rpb25TY3JlZW4oKG1vbnRoKSA9PiBtb250aCArIDEpO1xuXG4vKipcbiAqIE5hdmlnYXRlIHRvIHRoZSBzdGFydCBvZiB0aGUgcm93IG9mIG1vbnRocyBhbmQgZGlzcGxheSB0aGUgbW9udGggc2VsZWN0aW9uIHNjcmVlbi5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XG4gKi9cbmNvbnN0IGhhbmRsZUhvbWVGcm9tTW9udGggPSBhZGp1c3RNb250aFNlbGVjdGlvblNjcmVlbihcbiAgKG1vbnRoKSA9PiBtb250aCAtIChtb250aCAlIDMpXG4pO1xuXG4vKipcbiAqIE5hdmlnYXRlIHRvIHRoZSBlbmQgb2YgdGhlIHJvdyBvZiBtb250aHMgYW5kIGRpc3BsYXkgdGhlIG1vbnRoIHNlbGVjdGlvbiBzY3JlZW4uXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxuICovXG5jb25zdCBoYW5kbGVFbmRGcm9tTW9udGggPSBhZGp1c3RNb250aFNlbGVjdGlvblNjcmVlbihcbiAgKG1vbnRoKSA9PiBtb250aCArIDIgLSAobW9udGggJSAzKVxuKTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSB0byB0aGUgbGFzdCBtb250aCAoRGVjZW1iZXIpIGFuZCBkaXNwbGF5IHRoZSBtb250aCBzZWxlY3Rpb24gc2NyZWVuLlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcbiAqL1xuY29uc3QgaGFuZGxlUGFnZURvd25Gcm9tTW9udGggPSBhZGp1c3RNb250aFNlbGVjdGlvblNjcmVlbigoKSA9PiAxMSk7XG5cbi8qKlxuICogTmF2aWdhdGUgdG8gdGhlIGZpcnN0IG1vbnRoIChKYW51YXJ5KSBhbmQgZGlzcGxheSB0aGUgbW9udGggc2VsZWN0aW9uIHNjcmVlbi5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XG4gKi9cbmNvbnN0IGhhbmRsZVBhZ2VVcEZyb21Nb250aCA9IGFkanVzdE1vbnRoU2VsZWN0aW9uU2NyZWVuKCgpID0+IDApO1xuXG4vKipcbiAqIHVwZGF0ZSB0aGUgZm9jdXMgb24gYSBtb250aCB3aGVuIHRoZSBtb3VzZSBtb3Zlcy5cbiAqXG4gKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IFRoZSBtb3VzZW92ZXIgZXZlbnRcbiAqIEBwYXJhbSB7SFRNTEJ1dHRvbkVsZW1lbnR9IG1vbnRoRWwgQSBtb250aCBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKi9cbmNvbnN0IGhhbmRsZU1vdXNlb3ZlckZyb21Nb250aCA9IChtb250aEVsKSA9PiB7XG4gIGlmIChtb250aEVsLmRpc2FibGVkKSByZXR1cm47XG4gIGlmIChtb250aEVsLmNsYXNzTGlzdC5jb250YWlucyhDQUxFTkRBUl9NT05USF9GT0NVU0VEX0NMQVNTKSkgcmV0dXJuO1xuXG4gIGNvbnN0IGZvY3VzTW9udGggPSBwYXJzZUludChtb250aEVsLmRhdGFzZXQudmFsdWUsIDEwKTtcblxuICBjb25zdCBuZXdDYWxlbmRhciA9IGRpc3BsYXlNb250aFNlbGVjdGlvbihtb250aEVsLCBmb2N1c01vbnRoKTtcbiAgbmV3Q2FsZW5kYXIucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9NT05USF9GT0NVU0VEKS5mb2N1cygpO1xufTtcblxuLy8gI2VuZHJlZ2lvbiBDYWxlbmRhciBNb250aCBFdmVudCBIYW5kbGluZ1xuXG4vLyAjcmVnaW9uIENhbGVuZGFyIFllYXIgRXZlbnQgSGFuZGxpbmdcblxuLyoqXG4gKiBBZGp1c3QgdGhlIHllYXIgYW5kIGRpc3BsYXkgdGhlIHllYXIgc2VsZWN0aW9uIHNjcmVlbiBpZiBuZWVkZWQuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gYWRqdXN0WWVhckZuIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aGUgYWRqdXN0ZWQgeWVhclxuICovXG5jb25zdCBhZGp1c3RZZWFyU2VsZWN0aW9uU2NyZWVuID0gKGFkanVzdFllYXJGbikgPT4gKGV2ZW50KSA9PiB7XG4gIGNvbnN0IHllYXJFbCA9IGV2ZW50LnRhcmdldDtcbiAgY29uc3Qgc2VsZWN0ZWRZZWFyID0gcGFyc2VJbnQoeWVhckVsLmRhdGFzZXQudmFsdWUsIDEwKTtcbiAgY29uc3QgeyBjYWxlbmRhckVsLCBjYWxlbmRhckRhdGUsIG1pbkRhdGUsIG1heERhdGUgfSA9XG4gICAgZ2V0RGF0ZVBpY2tlckNvbnRleHQoeWVhckVsKTtcbiAgY29uc3QgY3VycmVudERhdGUgPSBzZXRZZWFyKGNhbGVuZGFyRGF0ZSwgc2VsZWN0ZWRZZWFyKTtcblxuICBsZXQgYWRqdXN0ZWRZZWFyID0gYWRqdXN0WWVhckZuKHNlbGVjdGVkWWVhcik7XG4gIGFkanVzdGVkWWVhciA9IE1hdGgubWF4KDAsIGFkanVzdGVkWWVhcik7XG5cbiAgY29uc3QgZGF0ZSA9IHNldFllYXIoY2FsZW5kYXJEYXRlLCBhZGp1c3RlZFllYXIpO1xuICBjb25zdCBjYXBwZWREYXRlID0ga2VlcERhdGVCZXR3ZWVuTWluQW5kTWF4KGRhdGUsIG1pbkRhdGUsIG1heERhdGUpO1xuICBpZiAoIWlzU2FtZVllYXIoY3VycmVudERhdGUsIGNhcHBlZERhdGUpKSB7XG4gICAgY29uc3QgbmV3Q2FsZW5kYXIgPSBkaXNwbGF5WWVhclNlbGVjdGlvbihcbiAgICAgIGNhbGVuZGFyRWwsXG4gICAgICBjYXBwZWREYXRlLmdldEZ1bGxZZWFyKClcbiAgICApO1xuICAgIG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfWUVBUl9GT0NVU0VEKS5mb2N1cygpO1xuICB9XG4gIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG59O1xuXG4vKipcbiAqIE5hdmlnYXRlIGJhY2sgdGhyZWUgeWVhcnMgYW5kIGRpc3BsYXkgdGhlIHllYXIgc2VsZWN0aW9uIHNjcmVlbi5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XG4gKi9cbmNvbnN0IGhhbmRsZVVwRnJvbVllYXIgPSBhZGp1c3RZZWFyU2VsZWN0aW9uU2NyZWVuKCh5ZWFyKSA9PiB5ZWFyIC0gMyk7XG5cbi8qKlxuICogTmF2aWdhdGUgZm9yd2FyZCB0aHJlZSB5ZWFycyBhbmQgZGlzcGxheSB0aGUgeWVhciBzZWxlY3Rpb24gc2NyZWVuLlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcbiAqL1xuY29uc3QgaGFuZGxlRG93bkZyb21ZZWFyID0gYWRqdXN0WWVhclNlbGVjdGlvblNjcmVlbigoeWVhcikgPT4geWVhciArIDMpO1xuXG4vKipcbiAqIE5hdmlnYXRlIGJhY2sgb25lIHllYXIgYW5kIGRpc3BsYXkgdGhlIHllYXIgc2VsZWN0aW9uIHNjcmVlbi5cbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XG4gKi9cbmNvbnN0IGhhbmRsZUxlZnRGcm9tWWVhciA9IGFkanVzdFllYXJTZWxlY3Rpb25TY3JlZW4oKHllYXIpID0+IHllYXIgLSAxKTtcblxuLyoqXG4gKiBOYXZpZ2F0ZSBmb3J3YXJkIG9uZSB5ZWFyIGFuZCBkaXNwbGF5IHRoZSB5ZWFyIHNlbGVjdGlvbiBzY3JlZW4uXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxuICovXG5jb25zdCBoYW5kbGVSaWdodEZyb21ZZWFyID0gYWRqdXN0WWVhclNlbGVjdGlvblNjcmVlbigoeWVhcikgPT4geWVhciArIDEpO1xuXG4vKipcbiAqIE5hdmlnYXRlIHRvIHRoZSBzdGFydCBvZiB0aGUgcm93IG9mIHllYXJzIGFuZCBkaXNwbGF5IHRoZSB5ZWFyIHNlbGVjdGlvbiBzY3JlZW4uXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxuICovXG5jb25zdCBoYW5kbGVIb21lRnJvbVllYXIgPSBhZGp1c3RZZWFyU2VsZWN0aW9uU2NyZWVuKFxuICAoeWVhcikgPT4geWVhciAtICh5ZWFyICUgMylcbik7XG5cbi8qKlxuICogTmF2aWdhdGUgdG8gdGhlIGVuZCBvZiB0aGUgcm93IG9mIHllYXJzIGFuZCBkaXNwbGF5IHRoZSB5ZWFyIHNlbGVjdGlvbiBzY3JlZW4uXG4gKlxuICogQHBhcmFtIHtLZXlib2FyZEV2ZW50fSBldmVudCB0aGUga2V5ZG93biBldmVudFxuICovXG5jb25zdCBoYW5kbGVFbmRGcm9tWWVhciA9IGFkanVzdFllYXJTZWxlY3Rpb25TY3JlZW4oXG4gICh5ZWFyKSA9PiB5ZWFyICsgMiAtICh5ZWFyICUgMylcbik7XG5cbi8qKlxuICogTmF2aWdhdGUgdG8gYmFjayAxMiB5ZWFycyBhbmQgZGlzcGxheSB0aGUgeWVhciBzZWxlY3Rpb24gc2NyZWVuLlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcbiAqL1xuY29uc3QgaGFuZGxlUGFnZVVwRnJvbVllYXIgPSBhZGp1c3RZZWFyU2VsZWN0aW9uU2NyZWVuKFxuICAoeWVhcikgPT4geWVhciAtIFlFQVJfQ0hVTktcbik7XG5cbi8qKlxuICogTmF2aWdhdGUgZm9yd2FyZCAxMiB5ZWFycyBhbmQgZGlzcGxheSB0aGUgeWVhciBzZWxlY3Rpb24gc2NyZWVuLlxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgdGhlIGtleWRvd24gZXZlbnRcbiAqL1xuY29uc3QgaGFuZGxlUGFnZURvd25Gcm9tWWVhciA9IGFkanVzdFllYXJTZWxlY3Rpb25TY3JlZW4oXG4gICh5ZWFyKSA9PiB5ZWFyICsgWUVBUl9DSFVOS1xuKTtcblxuLyoqXG4gKiB1cGRhdGUgdGhlIGZvY3VzIG9uIGEgeWVhciB3aGVuIHRoZSBtb3VzZSBtb3Zlcy5cbiAqXG4gKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50IFRoZSBtb3VzZW92ZXIgZXZlbnRcbiAqIEBwYXJhbSB7SFRNTEJ1dHRvbkVsZW1lbnR9IGRhdGVFbCBBIHllYXIgZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcGlja2VyIGNvbXBvbmVudFxuICovXG5jb25zdCBoYW5kbGVNb3VzZW92ZXJGcm9tWWVhciA9ICh5ZWFyRWwpID0+IHtcbiAgaWYgKHllYXJFbC5kaXNhYmxlZCkgcmV0dXJuO1xuICBpZiAoeWVhckVsLmNsYXNzTGlzdC5jb250YWlucyhDQUxFTkRBUl9ZRUFSX0ZPQ1VTRURfQ0xBU1MpKSByZXR1cm47XG5cbiAgY29uc3QgZm9jdXNZZWFyID0gcGFyc2VJbnQoeWVhckVsLmRhdGFzZXQudmFsdWUsIDEwKTtcblxuICBjb25zdCBuZXdDYWxlbmRhciA9IGRpc3BsYXlZZWFyU2VsZWN0aW9uKHllYXJFbCwgZm9jdXNZZWFyKTtcbiAgbmV3Q2FsZW5kYXIucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9ZRUFSX0ZPQ1VTRUQpLmZvY3VzKCk7XG59O1xuXG4vLyAjZW5kcmVnaW9uIENhbGVuZGFyIFllYXIgRXZlbnQgSGFuZGxpbmdcblxuLy8gI3JlZ2lvbiBGb2N1cyBIYW5kbGluZyBFdmVudCBIYW5kbGluZ1xuXG5jb25zdCB0YWJIYW5kbGVyID0gKGZvY3VzYWJsZSkgPT4ge1xuICBjb25zdCBnZXRGb2N1c2FibGVDb250ZXh0ID0gKGVsKSA9PiB7XG4gICAgY29uc3QgeyBjYWxlbmRhckVsIH0gPSBnZXREYXRlUGlja2VyQ29udGV4dChlbCk7XG4gICAgY29uc3QgZm9jdXNhYmxlRWxlbWVudHMgPSBzZWxlY3QoZm9jdXNhYmxlLCBjYWxlbmRhckVsKTtcblxuICAgIGNvbnN0IGZpcnN0VGFiSW5kZXggPSAwO1xuICAgIGNvbnN0IGxhc3RUYWJJbmRleCA9IGZvY3VzYWJsZUVsZW1lbnRzLmxlbmd0aCAtIDE7XG4gICAgY29uc3QgZmlyc3RUYWJTdG9wID0gZm9jdXNhYmxlRWxlbWVudHNbZmlyc3RUYWJJbmRleF07XG4gICAgY29uc3QgbGFzdFRhYlN0b3AgPSBmb2N1c2FibGVFbGVtZW50c1tsYXN0VGFiSW5kZXhdO1xuICAgIGNvbnN0IGZvY3VzSW5kZXggPSBmb2N1c2FibGVFbGVtZW50cy5pbmRleE9mKGFjdGl2ZUVsZW1lbnQoKSk7XG5cbiAgICBjb25zdCBpc0xhc3RUYWIgPSBmb2N1c0luZGV4ID09PSBsYXN0VGFiSW5kZXg7XG4gICAgY29uc3QgaXNGaXJzdFRhYiA9IGZvY3VzSW5kZXggPT09IGZpcnN0VGFiSW5kZXg7XG4gICAgY29uc3QgaXNOb3RGb3VuZCA9IGZvY3VzSW5kZXggPT09IC0xO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZvY3VzYWJsZUVsZW1lbnRzLFxuICAgICAgaXNOb3RGb3VuZCxcbiAgICAgIGZpcnN0VGFiU3RvcCxcbiAgICAgIGlzRmlyc3RUYWIsXG4gICAgICBsYXN0VGFiU3RvcCxcbiAgICAgIGlzTGFzdFRhYixcbiAgICB9O1xuICB9O1xuXG4gIHJldHVybiB7XG4gICAgdGFiQWhlYWQoZXZlbnQpIHtcbiAgICAgIGNvbnN0IHsgZmlyc3RUYWJTdG9wLCBpc0xhc3RUYWIsIGlzTm90Rm91bmQgfSA9IGdldEZvY3VzYWJsZUNvbnRleHQoXG4gICAgICAgIGV2ZW50LnRhcmdldFxuICAgICAgKTtcblxuICAgICAgaWYgKGlzTGFzdFRhYiB8fCBpc05vdEZvdW5kKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGZpcnN0VGFiU3RvcC5mb2N1cygpO1xuICAgICAgfVxuICAgIH0sXG4gICAgdGFiQmFjayhldmVudCkge1xuICAgICAgY29uc3QgeyBsYXN0VGFiU3RvcCwgaXNGaXJzdFRhYiwgaXNOb3RGb3VuZCB9ID0gZ2V0Rm9jdXNhYmxlQ29udGV4dChcbiAgICAgICAgZXZlbnQudGFyZ2V0XG4gICAgICApO1xuXG4gICAgICBpZiAoaXNGaXJzdFRhYiB8fCBpc05vdEZvdW5kKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGxhc3RUYWJTdG9wLmZvY3VzKCk7XG4gICAgICB9XG4gICAgfSxcbiAgfTtcbn07XG5cbmNvbnN0IGRhdGVQaWNrZXJUYWJFdmVudEhhbmRsZXIgPSB0YWJIYW5kbGVyKERBVEVfUElDS0VSX0ZPQ1VTQUJMRSk7XG5jb25zdCBtb250aFBpY2tlclRhYkV2ZW50SGFuZGxlciA9IHRhYkhhbmRsZXIoTU9OVEhfUElDS0VSX0ZPQ1VTQUJMRSk7XG5jb25zdCB5ZWFyUGlja2VyVGFiRXZlbnRIYW5kbGVyID0gdGFiSGFuZGxlcihZRUFSX1BJQ0tFUl9GT0NVU0FCTEUpO1xuXG4vLyAjZW5kcmVnaW9uIEZvY3VzIEhhbmRsaW5nIEV2ZW50IEhhbmRsaW5nXG5cbi8vICNyZWdpb24gRGF0ZSBQaWNrZXIgRXZlbnQgRGVsZWdhdGlvbiBSZWdpc3RyYXRpb24gLyBDb21wb25lbnRcblxuY29uc3QgZGF0ZVBpY2tlckV2ZW50cyA9IHtcbiAgW0NMSUNLXToge1xuICAgIFtEQVRFX1BJQ0tFUl9CVVRUT05dKCkge1xuICAgICAgdG9nZ2xlQ2FsZW5kYXIodGhpcyk7XG4gICAgfSxcbiAgICBbQ0FMRU5EQVJfREFURV0oKSB7XG4gICAgICBzZWxlY3REYXRlKHRoaXMpO1xuICAgIH0sXG4gICAgW0NBTEVOREFSX01PTlRIXSgpIHtcbiAgICAgIHNlbGVjdE1vbnRoKHRoaXMpO1xuICAgIH0sXG4gICAgW0NBTEVOREFSX1lFQVJdKCkge1xuICAgICAgc2VsZWN0WWVhcih0aGlzKTtcbiAgICB9LFxuICAgIFtDQUxFTkRBUl9QUkVWSU9VU19NT05USF0oKSB7XG4gICAgICBkaXNwbGF5UHJldmlvdXNNb250aCh0aGlzKTtcbiAgICB9LFxuICAgIFtDQUxFTkRBUl9ORVhUX01PTlRIXSgpIHtcbiAgICAgIGRpc3BsYXlOZXh0TW9udGgodGhpcyk7XG4gICAgfSxcbiAgICBbQ0FMRU5EQVJfUFJFVklPVVNfWUVBUl0oKSB7XG4gICAgICBkaXNwbGF5UHJldmlvdXNZZWFyKHRoaXMpO1xuICAgIH0sXG4gICAgW0NBTEVOREFSX05FWFRfWUVBUl0oKSB7XG4gICAgICBkaXNwbGF5TmV4dFllYXIodGhpcyk7XG4gICAgfSxcbiAgICBbQ0FMRU5EQVJfUFJFVklPVVNfWUVBUl9DSFVOS10oKSB7XG4gICAgICBkaXNwbGF5UHJldmlvdXNZZWFyQ2h1bmsodGhpcyk7XG4gICAgfSxcbiAgICBbQ0FMRU5EQVJfTkVYVF9ZRUFSX0NIVU5LXSgpIHtcbiAgICAgIGRpc3BsYXlOZXh0WWVhckNodW5rKHRoaXMpO1xuICAgIH0sXG4gICAgW0NBTEVOREFSX01PTlRIX1NFTEVDVElPTl0oKSB7XG4gICAgICBjb25zdCBuZXdDYWxlbmRhciA9IGRpc3BsYXlNb250aFNlbGVjdGlvbih0aGlzKTtcbiAgICAgIG5ld0NhbGVuZGFyLnF1ZXJ5U2VsZWN0b3IoQ0FMRU5EQVJfTU9OVEhfRk9DVVNFRCkuZm9jdXMoKTtcbiAgICB9LFxuICAgIFtDQUxFTkRBUl9ZRUFSX1NFTEVDVElPTl0oKSB7XG4gICAgICBjb25zdCBuZXdDYWxlbmRhciA9IGRpc3BsYXlZZWFyU2VsZWN0aW9uKHRoaXMpO1xuICAgICAgbmV3Q2FsZW5kYXIucXVlcnlTZWxlY3RvcihDQUxFTkRBUl9ZRUFSX0ZPQ1VTRUQpLmZvY3VzKCk7XG4gICAgfSxcbiAgfSxcbiAga2V5dXA6IHtcbiAgICBbREFURV9QSUNLRVJfQ0FMRU5EQVJdKGV2ZW50KSB7XG4gICAgICBjb25zdCBrZXlkb3duID0gdGhpcy5kYXRhc2V0LmtleWRvd25LZXlDb2RlO1xuICAgICAgaWYgKGAke2V2ZW50LmtleUNvZGV9YCAhPT0ga2V5ZG93bikge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgfVxuICAgIH0sXG4gIH0sXG4gIGtleWRvd246IHtcbiAgICBbREFURV9QSUNLRVJfRVhURVJOQUxfSU5QVVRdKGV2ZW50KSB7XG4gICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PT0gRU5URVJfS0VZQ09ERSkge1xuICAgICAgICB2YWxpZGF0ZURhdGVJbnB1dCh0aGlzKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIFtDQUxFTkRBUl9EQVRFXToga2V5bWFwKHtcbiAgICAgIFVwOiBoYW5kbGVVcEZyb21EYXRlLFxuICAgICAgQXJyb3dVcDogaGFuZGxlVXBGcm9tRGF0ZSxcbiAgICAgIERvd246IGhhbmRsZURvd25Gcm9tRGF0ZSxcbiAgICAgIEFycm93RG93bjogaGFuZGxlRG93bkZyb21EYXRlLFxuICAgICAgTGVmdDogaGFuZGxlTGVmdEZyb21EYXRlLFxuICAgICAgQXJyb3dMZWZ0OiBoYW5kbGVMZWZ0RnJvbURhdGUsXG4gICAgICBSaWdodDogaGFuZGxlUmlnaHRGcm9tRGF0ZSxcbiAgICAgIEFycm93UmlnaHQ6IGhhbmRsZVJpZ2h0RnJvbURhdGUsXG4gICAgICBIb21lOiBoYW5kbGVIb21lRnJvbURhdGUsXG4gICAgICBFbmQ6IGhhbmRsZUVuZEZyb21EYXRlLFxuICAgICAgUGFnZURvd246IGhhbmRsZVBhZ2VEb3duRnJvbURhdGUsXG4gICAgICBQYWdlVXA6IGhhbmRsZVBhZ2VVcEZyb21EYXRlLFxuICAgICAgXCJTaGlmdCtQYWdlRG93blwiOiBoYW5kbGVTaGlmdFBhZ2VEb3duRnJvbURhdGUsXG4gICAgICBcIlNoaWZ0K1BhZ2VVcFwiOiBoYW5kbGVTaGlmdFBhZ2VVcEZyb21EYXRlLFxuICAgICAgVGFiOiBkYXRlUGlja2VyVGFiRXZlbnRIYW5kbGVyLnRhYkFoZWFkLFxuICAgIH0pLFxuICAgIFtDQUxFTkRBUl9EQVRFX1BJQ0tFUl06IGtleW1hcCh7XG4gICAgICBUYWI6IGRhdGVQaWNrZXJUYWJFdmVudEhhbmRsZXIudGFiQWhlYWQsXG4gICAgICBcIlNoaWZ0K1RhYlwiOiBkYXRlUGlja2VyVGFiRXZlbnRIYW5kbGVyLnRhYkJhY2ssXG4gICAgfSksXG4gICAgW0NBTEVOREFSX01PTlRIXToga2V5bWFwKHtcbiAgICAgIFVwOiBoYW5kbGVVcEZyb21Nb250aCxcbiAgICAgIEFycm93VXA6IGhhbmRsZVVwRnJvbU1vbnRoLFxuICAgICAgRG93bjogaGFuZGxlRG93bkZyb21Nb250aCxcbiAgICAgIEFycm93RG93bjogaGFuZGxlRG93bkZyb21Nb250aCxcbiAgICAgIExlZnQ6IGhhbmRsZUxlZnRGcm9tTW9udGgsXG4gICAgICBBcnJvd0xlZnQ6IGhhbmRsZUxlZnRGcm9tTW9udGgsXG4gICAgICBSaWdodDogaGFuZGxlUmlnaHRGcm9tTW9udGgsXG4gICAgICBBcnJvd1JpZ2h0OiBoYW5kbGVSaWdodEZyb21Nb250aCxcbiAgICAgIEhvbWU6IGhhbmRsZUhvbWVGcm9tTW9udGgsXG4gICAgICBFbmQ6IGhhbmRsZUVuZEZyb21Nb250aCxcbiAgICAgIFBhZ2VEb3duOiBoYW5kbGVQYWdlRG93bkZyb21Nb250aCxcbiAgICAgIFBhZ2VVcDogaGFuZGxlUGFnZVVwRnJvbU1vbnRoLFxuICAgIH0pLFxuICAgIFtDQUxFTkRBUl9NT05USF9QSUNLRVJdOiBrZXltYXAoe1xuICAgICAgVGFiOiBtb250aFBpY2tlclRhYkV2ZW50SGFuZGxlci50YWJBaGVhZCxcbiAgICAgIFwiU2hpZnQrVGFiXCI6IG1vbnRoUGlja2VyVGFiRXZlbnRIYW5kbGVyLnRhYkJhY2ssXG4gICAgfSksXG4gICAgW0NBTEVOREFSX1lFQVJdOiBrZXltYXAoe1xuICAgICAgVXA6IGhhbmRsZVVwRnJvbVllYXIsXG4gICAgICBBcnJvd1VwOiBoYW5kbGVVcEZyb21ZZWFyLFxuICAgICAgRG93bjogaGFuZGxlRG93bkZyb21ZZWFyLFxuICAgICAgQXJyb3dEb3duOiBoYW5kbGVEb3duRnJvbVllYXIsXG4gICAgICBMZWZ0OiBoYW5kbGVMZWZ0RnJvbVllYXIsXG4gICAgICBBcnJvd0xlZnQ6IGhhbmRsZUxlZnRGcm9tWWVhcixcbiAgICAgIFJpZ2h0OiBoYW5kbGVSaWdodEZyb21ZZWFyLFxuICAgICAgQXJyb3dSaWdodDogaGFuZGxlUmlnaHRGcm9tWWVhcixcbiAgICAgIEhvbWU6IGhhbmRsZUhvbWVGcm9tWWVhcixcbiAgICAgIEVuZDogaGFuZGxlRW5kRnJvbVllYXIsXG4gICAgICBQYWdlRG93bjogaGFuZGxlUGFnZURvd25Gcm9tWWVhcixcbiAgICAgIFBhZ2VVcDogaGFuZGxlUGFnZVVwRnJvbVllYXIsXG4gICAgfSksXG4gICAgW0NBTEVOREFSX1lFQVJfUElDS0VSXToga2V5bWFwKHtcbiAgICAgIFRhYjogeWVhclBpY2tlclRhYkV2ZW50SGFuZGxlci50YWJBaGVhZCxcbiAgICAgIFwiU2hpZnQrVGFiXCI6IHllYXJQaWNrZXJUYWJFdmVudEhhbmRsZXIudGFiQmFjayxcbiAgICB9KSxcbiAgICBbREFURV9QSUNLRVJfQ0FMRU5EQVJdKGV2ZW50KSB7XG4gICAgICB0aGlzLmRhdGFzZXQua2V5ZG93bktleUNvZGUgPSBldmVudC5rZXlDb2RlO1xuICAgIH0sXG4gICAgW0RBVEVfUElDS0VSXShldmVudCkge1xuICAgICAgY29uc3Qga2V5TWFwID0ga2V5bWFwKHtcbiAgICAgICAgRXNjYXBlOiBoYW5kbGVFc2NhcGVGcm9tQ2FsZW5kYXIsXG4gICAgICB9KTtcblxuICAgICAga2V5TWFwKGV2ZW50KTtcbiAgICB9LFxuICB9LFxuICBmb2N1c291dDoge1xuICAgIFtEQVRFX1BJQ0tFUl9FWFRFUk5BTF9JTlBVVF0oKSB7XG4gICAgICB2YWxpZGF0ZURhdGVJbnB1dCh0aGlzKTtcbiAgICB9LFxuICAgIFtEQVRFX1BJQ0tFUl0oZXZlbnQpIHtcbiAgICAgIGlmICghdGhpcy5jb250YWlucyhldmVudC5yZWxhdGVkVGFyZ2V0KSkge1xuICAgICAgICBoaWRlQ2FsZW5kYXIodGhpcyk7XG4gICAgICB9XG4gICAgfSxcbiAgfSxcbiAgaW5wdXQ6IHtcbiAgICBbREFURV9QSUNLRVJfRVhURVJOQUxfSU5QVVRdKCkge1xuICAgICAgcmVjb25jaWxlSW5wdXRWYWx1ZXModGhpcyk7XG4gICAgICB1cGRhdGVDYWxlbmRhcklmVmlzaWJsZSh0aGlzKTtcbiAgICB9LFxuICB9LFxufTtcblxuaWYgKCFpc0lvc0RldmljZSgpKSB7XG4gIGRhdGVQaWNrZXJFdmVudHMubW91c2VvdmVyID0ge1xuICAgIFtDQUxFTkRBUl9EQVRFX0NVUlJFTlRfTU9OVEhdKCkge1xuICAgICAgaGFuZGxlTW91c2VvdmVyRnJvbURhdGUodGhpcyk7XG4gICAgfSxcbiAgICBbQ0FMRU5EQVJfTU9OVEhdKCkge1xuICAgICAgaGFuZGxlTW91c2VvdmVyRnJvbU1vbnRoKHRoaXMpO1xuICAgIH0sXG4gICAgW0NBTEVOREFSX1lFQVJdKCkge1xuICAgICAgaGFuZGxlTW91c2VvdmVyRnJvbVllYXIodGhpcyk7XG4gICAgfSxcbiAgfTtcbn1cblxuY29uc3QgZGF0ZVBpY2tlciA9IGJlaGF2aW9yKGRhdGVQaWNrZXJFdmVudHMsIHtcbiAgaW5pdChyb290KSB7XG4gICAgc2VsZWN0T3JNYXRjaGVzKERBVEVfUElDS0VSLCByb290KS5mb3JFYWNoKChkYXRlUGlja2VyRWwpID0+IHtcbiAgICAgIGVuaGFuY2VEYXRlUGlja2VyKGRhdGVQaWNrZXJFbCk7XG4gICAgfSk7XG4gIH0sXG4gIGdldERhdGVQaWNrZXJDb250ZXh0LFxuICBkaXNhYmxlLFxuICBlbmFibGUsXG4gIGlzRGF0ZUlucHV0SW52YWxpZCxcbiAgc2V0Q2FsZW5kYXJWYWx1ZSxcbiAgdmFsaWRhdGVEYXRlSW5wdXQsXG4gIHJlbmRlckNhbGVuZGFyLFxuICB1cGRhdGVDYWxlbmRhcklmVmlzaWJsZSxcbn0pO1xuXG4vLyAjZW5kcmVnaW9uIERhdGUgUGlja2VyIEV2ZW50IERlbGVnYXRpb24gUmVnaXN0cmF0aW9uIC8gQ29tcG9uZW50XG5cbm1vZHVsZS5leHBvcnRzID0gZGF0ZVBpY2tlcjtcbiIsImNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xuY29uc3Qgc2VsZWN0ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3NlbGVjdFwiKTtcbmNvbnN0IHNlbGVjdE9yTWF0Y2hlcyA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3Qtb3ItbWF0Y2hlc1wiKTtcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XG5jb25zdCB7XG4gIGdldERhdGVQaWNrZXJDb250ZXh0LFxuICBpc0RhdGVJbnB1dEludmFsaWQsXG4gIHVwZGF0ZUNhbGVuZGFySWZWaXNpYmxlLFxufSA9IHJlcXVpcmUoXCIuLi8uLi91c2EtZGF0ZS1waWNrZXIvc3JjL2luZGV4XCIpO1xuXG5jb25zdCBEQVRFX1BJQ0tFUl9DTEFTUyA9IGAke1BSRUZJWH0tZGF0ZS1waWNrZXJgO1xuY29uc3QgREFURV9SQU5HRV9QSUNLRVJfQ0xBU1MgPSBgJHtQUkVGSVh9LWRhdGUtcmFuZ2UtcGlja2VyYDtcbmNvbnN0IERBVEVfUkFOR0VfUElDS0VSX1JBTkdFX1NUQVJUX0NMQVNTID0gYCR7REFURV9SQU5HRV9QSUNLRVJfQ0xBU1N9X19yYW5nZS1zdGFydGA7XG5jb25zdCBEQVRFX1JBTkdFX1BJQ0tFUl9SQU5HRV9FTkRfQ0xBU1MgPSBgJHtEQVRFX1JBTkdFX1BJQ0tFUl9DTEFTU31fX3JhbmdlLWVuZGA7XG5cbmNvbnN0IERBVEVfUElDS0VSID0gYC4ke0RBVEVfUElDS0VSX0NMQVNTfWA7XG5jb25zdCBEQVRFX1JBTkdFX1BJQ0tFUiA9IGAuJHtEQVRFX1JBTkdFX1BJQ0tFUl9DTEFTU31gO1xuY29uc3QgREFURV9SQU5HRV9QSUNLRVJfUkFOR0VfU1RBUlQgPSBgLiR7REFURV9SQU5HRV9QSUNLRVJfUkFOR0VfU1RBUlRfQ0xBU1N9YDtcbmNvbnN0IERBVEVfUkFOR0VfUElDS0VSX1JBTkdFX0VORCA9IGAuJHtEQVRFX1JBTkdFX1BJQ0tFUl9SQU5HRV9FTkRfQ0xBU1N9YDtcblxuY29uc3QgREVGQVVMVF9NSU5fREFURSA9IFwiMDAwMC0wMS0wMVwiO1xuXG4vKipcbiAqIFRoZSBwcm9wZXJ0aWVzIGFuZCBlbGVtZW50cyB3aXRoaW4gdGhlIGRhdGUgcmFuZ2UgcGlja2VyLlxuICogQHR5cGVkZWYge09iamVjdH0gRGF0ZVJhbmdlUGlja2VyQ29udGV4dFxuICogQHByb3BlcnR5IHtIVE1MRWxlbWVudH0gZGF0ZVJhbmdlUGlja2VyRWxcbiAqIEBwcm9wZXJ0eSB7SFRNTEVsZW1lbnR9IHJhbmdlU3RhcnRFbFxuICogQHByb3BlcnR5IHtIVE1MRWxlbWVudH0gcmFuZ2VFbmRFbFxuICovXG5cbi8qKlxuICogR2V0IGFuIG9iamVjdCBvZiB0aGUgcHJvcGVydGllcyBhbmQgZWxlbWVudHMgYmVsb25naW5nIGRpcmVjdGx5IHRvIHRoZSBnaXZlblxuICogZGF0ZSBwaWNrZXIgY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIHRoZSBlbGVtZW50IHdpdGhpbiB0aGUgZGF0ZSBwaWNrZXJcbiAqIEByZXR1cm5zIHtEYXRlUmFuZ2VQaWNrZXJDb250ZXh0fSBlbGVtZW50c1xuICovXG5jb25zdCBnZXREYXRlUmFuZ2VQaWNrZXJDb250ZXh0ID0gKGVsKSA9PiB7XG4gIGNvbnN0IGRhdGVSYW5nZVBpY2tlckVsID0gZWwuY2xvc2VzdChEQVRFX1JBTkdFX1BJQ0tFUik7XG5cbiAgaWYgKCFkYXRlUmFuZ2VQaWNrZXJFbCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgRWxlbWVudCBpcyBtaXNzaW5nIG91dGVyICR7REFURV9SQU5HRV9QSUNLRVJ9YCk7XG4gIH1cblxuICBjb25zdCByYW5nZVN0YXJ0RWwgPSBkYXRlUmFuZ2VQaWNrZXJFbC5xdWVyeVNlbGVjdG9yKFxuICAgIERBVEVfUkFOR0VfUElDS0VSX1JBTkdFX1NUQVJUXG4gICk7XG4gIGNvbnN0IHJhbmdlRW5kRWwgPSBkYXRlUmFuZ2VQaWNrZXJFbC5xdWVyeVNlbGVjdG9yKFxuICAgIERBVEVfUkFOR0VfUElDS0VSX1JBTkdFX0VORFxuICApO1xuXG4gIHJldHVybiB7XG4gICAgZGF0ZVJhbmdlUGlja2VyRWwsXG4gICAgcmFuZ2VTdGFydEVsLFxuICAgIHJhbmdlRW5kRWwsXG4gIH07XG59O1xuXG4vKipcbiAqIGhhbmRsZSB1cGRhdGUgZnJvbSByYW5nZSBzdGFydCBkYXRlIHBpY2tlclxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIGFuIGVsZW1lbnQgd2l0aGluIHRoZSBkYXRlIHJhbmdlIHBpY2tlclxuICovXG5jb25zdCBoYW5kbGVSYW5nZVN0YXJ0VXBkYXRlID0gKGVsKSA9PiB7XG4gIGNvbnN0IHsgZGF0ZVJhbmdlUGlja2VyRWwsIHJhbmdlU3RhcnRFbCwgcmFuZ2VFbmRFbCB9ID1cbiAgICBnZXREYXRlUmFuZ2VQaWNrZXJDb250ZXh0KGVsKTtcbiAgY29uc3QgeyBpbnRlcm5hbElucHV0RWwgfSA9IGdldERhdGVQaWNrZXJDb250ZXh0KHJhbmdlU3RhcnRFbCk7XG4gIGNvbnN0IHVwZGF0ZWREYXRlID0gaW50ZXJuYWxJbnB1dEVsLnZhbHVlO1xuXG4gIGlmICh1cGRhdGVkRGF0ZSAmJiAhaXNEYXRlSW5wdXRJbnZhbGlkKGludGVybmFsSW5wdXRFbCkpIHtcbiAgICByYW5nZUVuZEVsLmRhdGFzZXQubWluRGF0ZSA9IHVwZGF0ZWREYXRlO1xuICAgIHJhbmdlRW5kRWwuZGF0YXNldC5yYW5nZURhdGUgPSB1cGRhdGVkRGF0ZTtcbiAgICByYW5nZUVuZEVsLmRhdGFzZXQuZGVmYXVsdERhdGUgPSB1cGRhdGVkRGF0ZTtcbiAgfSBlbHNlIHtcbiAgICByYW5nZUVuZEVsLmRhdGFzZXQubWluRGF0ZSA9IGRhdGVSYW5nZVBpY2tlckVsLmRhdGFzZXQubWluRGF0ZSB8fCBcIlwiO1xuICAgIHJhbmdlRW5kRWwuZGF0YXNldC5yYW5nZURhdGUgPSBcIlwiO1xuICAgIHJhbmdlRW5kRWwuZGF0YXNldC5kZWZhdWx0RGF0ZSA9IFwiXCI7XG4gIH1cblxuICB1cGRhdGVDYWxlbmRhcklmVmlzaWJsZShyYW5nZUVuZEVsKTtcbn07XG5cbi8qKlxuICogaGFuZGxlIHVwZGF0ZSBmcm9tIHJhbmdlIHN0YXJ0IGRhdGUgcGlja2VyXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgYW4gZWxlbWVudCB3aXRoaW4gdGhlIGRhdGUgcmFuZ2UgcGlja2VyXG4gKi9cbmNvbnN0IGhhbmRsZVJhbmdlRW5kVXBkYXRlID0gKGVsKSA9PiB7XG4gIGNvbnN0IHsgZGF0ZVJhbmdlUGlja2VyRWwsIHJhbmdlU3RhcnRFbCwgcmFuZ2VFbmRFbCB9ID1cbiAgICBnZXREYXRlUmFuZ2VQaWNrZXJDb250ZXh0KGVsKTtcbiAgY29uc3QgeyBpbnRlcm5hbElucHV0RWwgfSA9IGdldERhdGVQaWNrZXJDb250ZXh0KHJhbmdlRW5kRWwpO1xuICBjb25zdCB1cGRhdGVkRGF0ZSA9IGludGVybmFsSW5wdXRFbC52YWx1ZTtcblxuICBpZiAodXBkYXRlZERhdGUgJiYgIWlzRGF0ZUlucHV0SW52YWxpZChpbnRlcm5hbElucHV0RWwpKSB7XG4gICAgcmFuZ2VTdGFydEVsLmRhdGFzZXQubWF4RGF0ZSA9IHVwZGF0ZWREYXRlO1xuICAgIHJhbmdlU3RhcnRFbC5kYXRhc2V0LnJhbmdlRGF0ZSA9IHVwZGF0ZWREYXRlO1xuICAgIHJhbmdlU3RhcnRFbC5kYXRhc2V0LmRlZmF1bHREYXRlID0gdXBkYXRlZERhdGU7XG4gIH0gZWxzZSB7XG4gICAgcmFuZ2VTdGFydEVsLmRhdGFzZXQubWF4RGF0ZSA9IGRhdGVSYW5nZVBpY2tlckVsLmRhdGFzZXQubWF4RGF0ZSB8fCBcIlwiO1xuICAgIHJhbmdlU3RhcnRFbC5kYXRhc2V0LnJhbmdlRGF0ZSA9IFwiXCI7XG4gICAgcmFuZ2VTdGFydEVsLmRhdGFzZXQuZGVmYXVsdERhdGUgPSBcIlwiO1xuICB9XG5cbiAgdXBkYXRlQ2FsZW5kYXJJZlZpc2libGUocmFuZ2VTdGFydEVsKTtcbn07XG5cbi8qKlxuICogRW5oYW5jZSBhbiBpbnB1dCB3aXRoIHRoZSBkYXRlIHBpY2tlciBlbGVtZW50c1xuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIFRoZSBpbml0aWFsIHdyYXBwaW5nIGVsZW1lbnQgb2YgdGhlIGRhdGUgcmFuZ2UgcGlja2VyIGNvbXBvbmVudFxuICovXG5jb25zdCBlbmhhbmNlRGF0ZVJhbmdlUGlja2VyID0gKGVsKSA9PiB7XG4gIGNvbnN0IGRhdGVSYW5nZVBpY2tlckVsID0gZWwuY2xvc2VzdChEQVRFX1JBTkdFX1BJQ0tFUik7XG5cbiAgY29uc3QgW3JhbmdlU3RhcnQsIHJhbmdlRW5kXSA9IHNlbGVjdChEQVRFX1BJQ0tFUiwgZGF0ZVJhbmdlUGlja2VyRWwpO1xuXG4gIGlmICghcmFuZ2VTdGFydCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGAke0RBVEVfUkFOR0VfUElDS0VSfSBpcyBtaXNzaW5nIGlubmVyIHR3byAnJHtEQVRFX1BJQ0tFUn0nIGVsZW1lbnRzYFxuICAgICk7XG4gIH1cblxuICBpZiAoIXJhbmdlRW5kKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYCR7REFURV9SQU5HRV9QSUNLRVJ9IGlzIG1pc3Npbmcgc2Vjb25kICcke0RBVEVfUElDS0VSfScgZWxlbWVudGBcbiAgICApO1xuICB9XG5cbiAgcmFuZ2VTdGFydC5jbGFzc0xpc3QuYWRkKERBVEVfUkFOR0VfUElDS0VSX1JBTkdFX1NUQVJUX0NMQVNTKTtcbiAgcmFuZ2VFbmQuY2xhc3NMaXN0LmFkZChEQVRFX1JBTkdFX1BJQ0tFUl9SQU5HRV9FTkRfQ0xBU1MpO1xuXG4gIGlmICghZGF0ZVJhbmdlUGlja2VyRWwuZGF0YXNldC5taW5EYXRlKSB7XG4gICAgZGF0ZVJhbmdlUGlja2VyRWwuZGF0YXNldC5taW5EYXRlID0gREVGQVVMVF9NSU5fREFURTtcbiAgfVxuXG4gIGNvbnN0IHsgbWluRGF0ZSB9ID0gZGF0ZVJhbmdlUGlja2VyRWwuZGF0YXNldDtcbiAgcmFuZ2VTdGFydC5kYXRhc2V0Lm1pbkRhdGUgPSBtaW5EYXRlO1xuICByYW5nZUVuZC5kYXRhc2V0Lm1pbkRhdGUgPSBtaW5EYXRlO1xuXG4gIGNvbnN0IHsgbWF4RGF0ZSB9ID0gZGF0ZVJhbmdlUGlja2VyRWwuZGF0YXNldDtcbiAgaWYgKG1heERhdGUpIHtcbiAgICByYW5nZVN0YXJ0LmRhdGFzZXQubWF4RGF0ZSA9IG1heERhdGU7XG4gICAgcmFuZ2VFbmQuZGF0YXNldC5tYXhEYXRlID0gbWF4RGF0ZTtcbiAgfVxuXG4gIGhhbmRsZVJhbmdlU3RhcnRVcGRhdGUoZGF0ZVJhbmdlUGlja2VyRWwpO1xuICBoYW5kbGVSYW5nZUVuZFVwZGF0ZShkYXRlUmFuZ2VQaWNrZXJFbCk7XG59O1xuXG5jb25zdCBkYXRlUmFuZ2VQaWNrZXIgPSBiZWhhdmlvcihcbiAge1xuICAgIFwiaW5wdXQgY2hhbmdlXCI6IHtcbiAgICAgIFtEQVRFX1JBTkdFX1BJQ0tFUl9SQU5HRV9TVEFSVF0oKSB7XG4gICAgICAgIGhhbmRsZVJhbmdlU3RhcnRVcGRhdGUodGhpcyk7XG4gICAgICB9LFxuICAgICAgW0RBVEVfUkFOR0VfUElDS0VSX1JBTkdFX0VORF0oKSB7XG4gICAgICAgIGhhbmRsZVJhbmdlRW5kVXBkYXRlKHRoaXMpO1xuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICB7XG4gICAgaW5pdChyb290KSB7XG4gICAgICBzZWxlY3RPck1hdGNoZXMoREFURV9SQU5HRV9QSUNLRVIsIHJvb3QpLmZvckVhY2goKGRhdGVSYW5nZVBpY2tlckVsKSA9PiB7XG4gICAgICAgIGVuaGFuY2VEYXRlUmFuZ2VQaWNrZXIoZGF0ZVJhbmdlUGlja2VyRWwpO1xuICAgICAgfSk7XG4gICAgfSxcbiAgfVxuKTtcblxubW9kdWxlLmV4cG9ydHMgPSBkYXRlUmFuZ2VQaWNrZXI7XG4iLCJjb25zdCBzZWxlY3RPck1hdGNoZXMgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2VsZWN0LW9yLW1hdGNoZXNcIik7XG5jb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcbmNvbnN0IFNhbml0aXplciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zYW5pdGl6ZXJcIik7XG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvY29uZmlnXCIpO1xuXG5jb25zdCBEUk9QWk9ORV9DTEFTUyA9IGAke1BSRUZJWH0tZmlsZS1pbnB1dGA7XG5jb25zdCBEUk9QWk9ORSA9IGAuJHtEUk9QWk9ORV9DTEFTU31gO1xuY29uc3QgSU5QVVRfQ0xBU1MgPSBgJHtQUkVGSVh9LWZpbGUtaW5wdXRfX2lucHV0YDtcbmNvbnN0IFRBUkdFVF9DTEFTUyA9IGAke1BSRUZJWH0tZmlsZS1pbnB1dF9fdGFyZ2V0YDtcbmNvbnN0IElOUFVUID0gYC4ke0lOUFVUX0NMQVNTfWA7XG5jb25zdCBCT1hfQ0xBU1MgPSBgJHtQUkVGSVh9LWZpbGUtaW5wdXRfX2JveGA7XG5jb25zdCBJTlNUUlVDVElPTlNfQ0xBU1MgPSBgJHtQUkVGSVh9LWZpbGUtaW5wdXRfX2luc3RydWN0aW9uc2A7XG5jb25zdCBQUkVWSUVXX0NMQVNTID0gYCR7UFJFRklYfS1maWxlLWlucHV0X19wcmV2aWV3YDtcbmNvbnN0IFBSRVZJRVdfSEVBRElOR19DTEFTUyA9IGAke1BSRUZJWH0tZmlsZS1pbnB1dF9fcHJldmlldy1oZWFkaW5nYDtcbmNvbnN0IERJU0FCTEVEX0NMQVNTID0gYCR7UFJFRklYfS1maWxlLWlucHV0LS1kaXNhYmxlZGA7XG5jb25zdCBDSE9PU0VfQ0xBU1MgPSBgJHtQUkVGSVh9LWZpbGUtaW5wdXRfX2Nob29zZWA7XG5jb25zdCBBQ0NFUFRFRF9GSUxFX01FU1NBR0VfQ0xBU1MgPSBgJHtQUkVGSVh9LWZpbGUtaW5wdXRfX2FjY2VwdGVkLWZpbGVzLW1lc3NhZ2VgO1xuY29uc3QgRFJBR19URVhUX0NMQVNTID0gYCR7UFJFRklYfS1maWxlLWlucHV0X19kcmFnLXRleHRgO1xuY29uc3QgRFJBR19DTEFTUyA9IGAke1BSRUZJWH0tZmlsZS1pbnB1dC0tZHJhZ2A7XG5jb25zdCBMT0FESU5HX0NMQVNTID0gXCJpcy1sb2FkaW5nXCI7XG5jb25zdCBISURERU5fQ0xBU1MgPSBcImRpc3BsYXktbm9uZVwiO1xuY29uc3QgSU5WQUxJRF9GSUxFX0NMQVNTID0gXCJoYXMtaW52YWxpZC1maWxlXCI7XG5jb25zdCBHRU5FUklDX1BSRVZJRVdfQ0xBU1NfTkFNRSA9IGAke1BSRUZJWH0tZmlsZS1pbnB1dF9fcHJldmlldy1pbWFnZWA7XG5jb25zdCBHRU5FUklDX1BSRVZJRVdfQ0xBU1MgPSBgJHtHRU5FUklDX1BSRVZJRVdfQ0xBU1NfTkFNRX0tLWdlbmVyaWNgO1xuY29uc3QgUERGX1BSRVZJRVdfQ0xBU1MgPSBgJHtHRU5FUklDX1BSRVZJRVdfQ0xBU1NfTkFNRX0tLXBkZmA7XG5jb25zdCBXT1JEX1BSRVZJRVdfQ0xBU1MgPSBgJHtHRU5FUklDX1BSRVZJRVdfQ0xBU1NfTkFNRX0tLXdvcmRgO1xuY29uc3QgVklERU9fUFJFVklFV19DTEFTUyA9IGAke0dFTkVSSUNfUFJFVklFV19DTEFTU19OQU1FfS0tdmlkZW9gO1xuY29uc3QgRVhDRUxfUFJFVklFV19DTEFTUyA9IGAke0dFTkVSSUNfUFJFVklFV19DTEFTU19OQU1FfS0tZXhjZWxgO1xuY29uc3QgU1BBQ0VSX0dJRiA9XG4gIFwiZGF0YTppbWFnZS9naWY7YmFzZTY0LFIwbEdPRGxoQVFBQkFJQUFBQUFBQVAvLy95SDVCQUVBQUFBQUxBQUFBQUFCQUFFQUFBSUJSQUE3XCI7XG5cbmxldCBUWVBFX0lTX1ZBTElEID0gQm9vbGVhbih0cnVlKTsgLy8gbG9naWMgZ2F0ZSBmb3IgY2hhbmdlIGxpc3RlbmVyXG5cbi8qKlxuICogVGhlIHByb3BlcnRpZXMgYW5kIGVsZW1lbnRzIHdpdGhpbiB0aGUgZmlsZSBpbnB1dC5cbiAqIEB0eXBlZGVmIHtPYmplY3R9IEZpbGVJbnB1dENvbnRleHRcbiAqIEBwcm9wZXJ0eSB7SFRNTERpdkVsZW1lbnR9IGRyb3Bab25lRWxcbiAqIEBwcm9wZXJ0eSB7SFRNTElucHV0RWxlbWVudH0gaW5wdXRFbFxuICovXG5cbi8qKlxuICogR2V0IGFuIG9iamVjdCBvZiB0aGUgcHJvcGVydGllcyBhbmQgZWxlbWVudHMgYmVsb25naW5nIGRpcmVjdGx5IHRvIHRoZSBnaXZlblxuICogZmlsZSBpbnB1dCBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgdGhlIGVsZW1lbnQgd2l0aGluIHRoZSBmaWxlIGlucHV0XG4gKiBAcmV0dXJucyB7RmlsZUlucHV0Q29udGV4dH0gZWxlbWVudHNcbiAqL1xuY29uc3QgZ2V0RmlsZUlucHV0Q29udGV4dCA9IChlbCkgPT4ge1xuICBjb25zdCBkcm9wWm9uZUVsID0gZWwuY2xvc2VzdChEUk9QWk9ORSk7XG5cbiAgaWYgKCFkcm9wWm9uZUVsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBFbGVtZW50IGlzIG1pc3Npbmcgb3V0ZXIgJHtEUk9QWk9ORX1gKTtcbiAgfVxuXG4gIGNvbnN0IGlucHV0RWwgPSBkcm9wWm9uZUVsLnF1ZXJ5U2VsZWN0b3IoSU5QVVQpO1xuXG4gIHJldHVybiB7XG4gICAgZHJvcFpvbmVFbCxcbiAgICBpbnB1dEVsLFxuICB9O1xufTtcblxuLyoqXG4gKiBEaXNhYmxlIHRoZSBmaWxlIGlucHV0IGNvbXBvbmVudFxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIEFuIGVsZW1lbnQgd2l0aGluIHRoZSBmaWxlIGlucHV0IGNvbXBvbmVudFxuICovXG5jb25zdCBkaXNhYmxlID0gKGVsKSA9PiB7XG4gIGNvbnN0IHsgZHJvcFpvbmVFbCwgaW5wdXRFbCB9ID0gZ2V0RmlsZUlucHV0Q29udGV4dChlbCk7XG5cbiAgaW5wdXRFbC5kaXNhYmxlZCA9IHRydWU7XG4gIGRyb3Bab25lRWwuY2xhc3NMaXN0LmFkZChESVNBQkxFRF9DTEFTUyk7XG4gIGRyb3Bab25lRWwuc2V0QXR0cmlidXRlKFwiYXJpYS1kaXNhYmxlZFwiLCBcInRydWVcIik7XG59O1xuXG4vKipcbiAqIEVuYWJsZSB0aGUgZmlsZSBpbnB1dCBjb21wb25lbnRcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgZmlsZSBpbnB1dCBjb21wb25lbnRcbiAqL1xuY29uc3QgZW5hYmxlID0gKGVsKSA9PiB7XG4gIGNvbnN0IHsgZHJvcFpvbmVFbCwgaW5wdXRFbCB9ID0gZ2V0RmlsZUlucHV0Q29udGV4dChlbCk7XG5cbiAgaW5wdXRFbC5kaXNhYmxlZCA9IGZhbHNlO1xuICBkcm9wWm9uZUVsLmNsYXNzTGlzdC5yZW1vdmUoRElTQUJMRURfQ0xBU1MpO1xuICBkcm9wWm9uZUVsLnJlbW92ZUF0dHJpYnV0ZShcImFyaWEtZGlzYWJsZWRcIik7XG59O1xuXG4vKipcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcyBzcGVjaWFsIGNoYXJhY3RlcnNcbiAqIEByZXR1cm5zIHtTdHJpbmd9IHJlcGxhY2VzIHNwZWNpZmllZCB2YWx1ZXNcbiAqL1xuY29uc3QgcmVwbGFjZU5hbWUgPSAocykgPT4ge1xuICBjb25zdCBjID0gcy5jaGFyQ29kZUF0KDApO1xuICBpZiAoYyA9PT0gMzIpIHJldHVybiBcIi1cIjtcbiAgaWYgKGMgPj0gNjUgJiYgYyA8PSA5MCkgcmV0dXJuIGBpbWdfJHtzLnRvTG93ZXJDYXNlKCl9YDtcbiAgcmV0dXJuIGBfXyR7KFwiMDAwXCIsIGMudG9TdHJpbmcoMTYpKS5zbGljZSgtNCl9YDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBJRCBuYW1lIGZvciBlYWNoIGZpbGUgdGhhdCBzdHJpcHMgYWxsIGludmFsaWQgY2hhcmFjdGVycy5cbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIC0gbmFtZSBvZiB0aGUgZmlsZSBhZGRlZCB0byBmaWxlIGlucHV0IChzZWFyY2h2YWx1ZSlcbiAqIEByZXR1cm5zIHtTdHJpbmd9IHNhbWUgY2hhcmFjdGVycyBhcyB0aGUgbmFtZSB3aXRoIGludmFsaWQgY2hhcnMgcmVtb3ZlZCAobmV3dmFsdWUpXG4gKi9cbmNvbnN0IG1ha2VTYWZlRm9ySUQgPSAobmFtZSkgPT4gbmFtZS5yZXBsYWNlKC9bXmEtejAtOV0vZywgcmVwbGFjZU5hbWUpO1xuXG4vLyBUYWtlcyBhIGdlbmVyYXRlZCBzYWZlIElEIGFuZCBjcmVhdGVzIGEgdW5pcXVlIElELlxuY29uc3QgY3JlYXRlVW5pcXVlSUQgPSAobmFtZSkgPT5cbiAgYCR7bmFtZX0tJHtNYXRoLmZsb29yKERhdGUubm93KCkudG9TdHJpbmcoKSAvIDEwMDApfWA7XG5cbi8qKlxuICogQnVpbGRzIGZ1bGwgZmlsZSBpbnB1dCBjb21wb25lbnRcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGZpbGVJbnB1dEVsIC0gb3JpZ2luYWwgZmlsZSBpbnB1dCBvbiBwYWdlXG4gKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR8SFRNTEVsZW1lbnR9IC0gSW5zdHJ1Y3Rpb25zLCB0YXJnZXQgYXJlYSBkaXZcbiAqL1xuY29uc3QgYnVpbGRGaWxlSW5wdXQgPSAoZmlsZUlucHV0RWwpID0+IHtcbiAgY29uc3QgYWNjZXB0c011bHRpcGxlID0gZmlsZUlucHV0RWwuaGFzQXR0cmlidXRlKFwibXVsdGlwbGVcIik7XG4gIGNvbnN0IGZpbGVJbnB1dFBhcmVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGNvbnN0IGRyb3BUYXJnZXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBjb25zdCBib3ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBjb25zdCBpbnN0cnVjdGlvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBjb25zdCBkaXNhYmxlZCA9IGZpbGVJbnB1dEVsLmhhc0F0dHJpYnV0ZShcImRpc2FibGVkXCIpO1xuICBsZXQgZGVmYXVsdEFyaWFMYWJlbDtcblxuICAvLyBBZGRzIGNsYXNzIG5hbWVzIGFuZCBvdGhlciBhdHRyaWJ1dGVzXG4gIGZpbGVJbnB1dEVsLmNsYXNzTGlzdC5yZW1vdmUoRFJPUFpPTkVfQ0xBU1MpO1xuICBmaWxlSW5wdXRFbC5jbGFzc0xpc3QuYWRkKElOUFVUX0NMQVNTKTtcbiAgZmlsZUlucHV0UGFyZW50LmNsYXNzTGlzdC5hZGQoRFJPUFpPTkVfQ0xBU1MpO1xuICBib3guY2xhc3NMaXN0LmFkZChCT1hfQ0xBU1MpO1xuICBpbnN0cnVjdGlvbnMuY2xhc3NMaXN0LmFkZChJTlNUUlVDVElPTlNfQ0xBU1MpO1xuICBpbnN0cnVjdGlvbnMuc2V0QXR0cmlidXRlKFwiYXJpYS1oaWRkZW5cIiwgXCJ0cnVlXCIpO1xuICBkcm9wVGFyZ2V0LmNsYXNzTGlzdC5hZGQoVEFSR0VUX0NMQVNTKTtcbiAgLy8gRW5jb3VyYWdlIHNjcmVlbnJlYWRlciB0byByZWFkIG91dCBhcmlhIGNoYW5nZXMgaW1tZWRpYXRlbHkgZm9sbG93aW5nIHVwbG9hZCBzdGF0dXMgY2hhbmdlXG4gIGZpbGVJbnB1dEVsLnNldEF0dHJpYnV0ZShcImFyaWEtbGl2ZVwiLCBcInBvbGl0ZVwiKTtcblxuICAvLyBBZGRzIGNoaWxkIGVsZW1lbnRzIHRvIHRoZSBET01cbiAgZmlsZUlucHV0RWwucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZHJvcFRhcmdldCwgZmlsZUlucHV0RWwpO1xuICBmaWxlSW5wdXRFbC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShmaWxlSW5wdXRQYXJlbnQsIGRyb3BUYXJnZXQpO1xuICBkcm9wVGFyZ2V0LmFwcGVuZENoaWxkKGZpbGVJbnB1dEVsKTtcbiAgZmlsZUlucHV0UGFyZW50LmFwcGVuZENoaWxkKGRyb3BUYXJnZXQpO1xuICBmaWxlSW5wdXRFbC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShpbnN0cnVjdGlvbnMsIGZpbGVJbnB1dEVsKTtcbiAgZmlsZUlucHV0RWwucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoYm94LCBmaWxlSW5wdXRFbCk7XG5cbiAgLy8gRGlzYWJsZWQgc3R5bGluZ1xuICBpZiAoZGlzYWJsZWQpIHtcbiAgICBkaXNhYmxlKGZpbGVJbnB1dEVsKTtcbiAgfVxuXG4gIC8vIFNldHMgaW5zdHJ1Y3Rpb24gdGVzdCBhbmQgYXJpYS1sYWJlbCBiYXNlZCBvbiB3aGV0aGVyIG9yIG5vdCBtdWx0aXBsZSBmaWxlcyBhcmUgYWNjZXB0ZWRcbiAgaWYgKGFjY2VwdHNNdWx0aXBsZSkge1xuICAgIGRlZmF1bHRBcmlhTGFiZWwgPSBcIk5vIGZpbGVzIHNlbGVjdGVkXCI7XG4gICAgaW5zdHJ1Y3Rpb25zLmlubmVySFRNTCA9IFNhbml0aXplci5lc2NhcGVIVE1MYDxzcGFuIGNsYXNzPVwiJHtEUkFHX1RFWFRfQ0xBU1N9XCI+RHJhZyBmaWxlcyBoZXJlIG9yIDwvc3Bhbj48c3BhbiBjbGFzcz1cIiR7Q0hPT1NFX0NMQVNTfVwiPmNob29zZSBmcm9tIGZvbGRlcjwvc3Bhbj5gO1xuICAgIGZpbGVJbnB1dEVsLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgZGVmYXVsdEFyaWFMYWJlbCk7XG4gICAgZmlsZUlucHV0RWwuc2V0QXR0cmlidXRlKFwiZGF0YS1kZWZhdWx0LWFyaWEtbGFiZWxcIiwgZGVmYXVsdEFyaWFMYWJlbCk7XG4gIH0gZWxzZSB7XG4gICAgZGVmYXVsdEFyaWFMYWJlbCA9IFwiTm8gZmlsZSBzZWxlY3RlZFwiO1xuICAgIGluc3RydWN0aW9ucy5pbm5lckhUTUwgPSBTYW5pdGl6ZXIuZXNjYXBlSFRNTGA8c3BhbiBjbGFzcz1cIiR7RFJBR19URVhUX0NMQVNTfVwiPkRyYWcgZmlsZSBoZXJlIG9yIDwvc3Bhbj48c3BhbiBjbGFzcz1cIiR7Q0hPT1NFX0NMQVNTfVwiPmNob29zZSBmcm9tIGZvbGRlcjwvc3Bhbj5gO1xuICAgIGZpbGVJbnB1dEVsLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgZGVmYXVsdEFyaWFMYWJlbCk7XG4gICAgZmlsZUlucHV0RWwuc2V0QXR0cmlidXRlKFwiZGF0YS1kZWZhdWx0LWFyaWEtbGFiZWxcIiwgZGVmYXVsdEFyaWFMYWJlbCk7XG4gIH1cblxuICAvLyBJRTExIGFuZCBFZGdlIGRvIG5vdCBzdXBwb3J0IGRyb3AgZmlsZXMgb24gZmlsZSBpbnB1dHMsIHNvIHdlJ3ZlIHJlbW92ZWQgdGV4dCB0aGF0IGluZGljYXRlcyB0aGF0XG4gIGlmIChcbiAgICAvcnY6MTEuMC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgfHxcbiAgICAvRWRnZVxcL1xcZC4vaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpXG4gICkge1xuICAgIGZpbGVJbnB1dFBhcmVudC5xdWVyeVNlbGVjdG9yKGAuJHtEUkFHX1RFWFRfQ0xBU1N9YCkub3V0ZXJIVE1MID0gXCJcIjtcbiAgfVxuXG4gIHJldHVybiB7IGluc3RydWN0aW9ucywgZHJvcFRhcmdldCB9O1xufTtcblxuLyoqXG4gKiBSZW1vdmVzIGltYWdlIHByZXZpZXdzLCB3ZSB3YW50IHRvIHN0YXJ0IHdpdGggYSBjbGVhbiBsaXN0IGV2ZXJ5IHRpbWUgZmlsZXMgYXJlIGFkZGVkIHRvIHRoZSBmaWxlIGlucHV0XG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBkcm9wVGFyZ2V0IC0gdGFyZ2V0IGFyZWEgZGl2IHRoYXQgZW5jYXNlcyB0aGUgaW5wdXRcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGluc3RydWN0aW9ucyAtIHRleHQgdG8gaW5mb3JtIHVzZXJzIHRvIGRyYWcgb3Igc2VsZWN0IGZpbGVzXG4gKi9cbmNvbnN0IHJlbW92ZU9sZFByZXZpZXdzID0gKGRyb3BUYXJnZXQsIGluc3RydWN0aW9ucywgaW5wdXRBcmlhTGFiZWwpID0+IHtcbiAgY29uc3QgZmlsZVByZXZpZXdzID0gZHJvcFRhcmdldC5xdWVyeVNlbGVjdG9yQWxsKGAuJHtQUkVWSUVXX0NMQVNTfWApO1xuICBjb25zdCBmaWxlSW5wdXRFbGVtZW50ID0gZHJvcFRhcmdldC5xdWVyeVNlbGVjdG9yKElOUFVUKTtcbiAgY29uc3QgY3VycmVudFByZXZpZXdIZWFkaW5nID0gZHJvcFRhcmdldC5xdWVyeVNlbGVjdG9yKFxuICAgIGAuJHtQUkVWSUVXX0hFQURJTkdfQ0xBU1N9YFxuICApO1xuICBjb25zdCBjdXJyZW50RXJyb3JNZXNzYWdlID0gZHJvcFRhcmdldC5xdWVyeVNlbGVjdG9yKFxuICAgIGAuJHtBQ0NFUFRFRF9GSUxFX01FU1NBR0VfQ0xBU1N9YFxuICApO1xuXG4gIC8qKlxuICAgKiBmaW5kcyB0aGUgcGFyZW50IG9mIHRoZSBwYXNzZWQgbm9kZSBhbmQgcmVtb3ZlcyB0aGUgY2hpbGRcbiAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gbm9kZVxuICAgKi9cbiAgY29uc3QgcmVtb3ZlSW1hZ2VzID0gKG5vZGUpID0+IHtcbiAgICBub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG4gIH07XG5cbiAgLy8gUmVtb3ZlIHRoZSBoZWFkaW5nIGFib3ZlIHRoZSBwcmV2aWV3c1xuICBpZiAoY3VycmVudFByZXZpZXdIZWFkaW5nKSB7XG4gICAgY3VycmVudFByZXZpZXdIZWFkaW5nLm91dGVySFRNTCA9IFwiXCI7XG4gIH1cblxuICAvLyBSZW1vdmUgZXhpc3RpbmcgZXJyb3IgbWVzc2FnZXNcbiAgaWYgKGN1cnJlbnRFcnJvck1lc3NhZ2UpIHtcbiAgICBjdXJyZW50RXJyb3JNZXNzYWdlLm91dGVySFRNTCA9IFwiXCI7XG4gICAgZHJvcFRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKElOVkFMSURfRklMRV9DTEFTUyk7XG4gIH1cblxuICAvLyBHZXQgcmlkIG9mIGV4aXN0aW5nIHByZXZpZXdzIGlmIHRoZXkgZXhpc3QsIHNob3cgaW5zdHJ1Y3Rpb25zXG4gIGlmIChmaWxlUHJldmlld3MgIT09IG51bGwpIHtcbiAgICBpZiAoaW5zdHJ1Y3Rpb25zKSB7XG4gICAgICBpbnN0cnVjdGlvbnMuY2xhc3NMaXN0LnJlbW92ZShISURERU5fQ0xBU1MpO1xuICAgIH1cbiAgICBmaWxlSW5wdXRFbGVtZW50LnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgaW5wdXRBcmlhTGFiZWwpO1xuICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoZmlsZVByZXZpZXdzLCByZW1vdmVJbWFnZXMpO1xuICB9XG59O1xuXG4vKipcbiAqIFdoZW4gbmV3IGZpbGVzIGFyZSBhcHBsaWVkIHRvIGZpbGUgaW5wdXQsIHRoaXMgZnVuY3Rpb24gZ2VuZXJhdGVzIHByZXZpZXdzXG4gKiBhbmQgcmVtb3ZlcyBvbGQgb25lcy5cbiAqIEBwYXJhbSB7ZXZlbnR9IGVcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGZpbGVJbnB1dEVsIC0gZmlsZSBpbnB1dCBlbGVtZW50XG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBpbnN0cnVjdGlvbnMgLSB0ZXh0IHRvIGluZm9ybSB1c2VycyB0byBkcmFnIG9yIHNlbGVjdCBmaWxlc1xuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZHJvcFRhcmdldCAtIHRhcmdldCBhcmVhIGRpdiB0aGF0IGVuY2FzZXMgdGhlIGlucHV0XG4gKi9cblxuY29uc3QgaGFuZGxlQ2hhbmdlID0gKGUsIGZpbGVJbnB1dEVsLCBpbnN0cnVjdGlvbnMsIGRyb3BUYXJnZXQpID0+IHtcbiAgY29uc3QgZmlsZU5hbWVzID0gZS50YXJnZXQuZmlsZXM7XG4gIGNvbnN0IGZpbGVQcmV2aWV3c0hlYWRpbmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBjb25zdCBpbnB1dEFyaWFMYWJlbCA9IGZpbGVJbnB1dEVsLmRhdGFzZXQuZGVmYXVsdEFyaWFMYWJlbDtcbiAgY29uc3QgZmlsZVN0b3JlID0gW107XG5cbiAgLy8gRmlyc3QsIGdldCByaWQgb2YgZXhpc3RpbmcgcHJldmlld3NcbiAgcmVtb3ZlT2xkUHJldmlld3MoZHJvcFRhcmdldCwgaW5zdHJ1Y3Rpb25zLCBpbnB1dEFyaWFMYWJlbCk7XG5cbiAgLy8gVGhlbiwgaXRlcmF0ZSB0aHJvdWdoIGZpbGVzIGxpc3QgYW5kOlxuICAvLyAxLiBBZGQgc2VsZWN0ZWQgZmlsZSBsaXN0IG5hbWVzIHRvIGFyaWEtbGFiZWxcbiAgLy8gMi4gQ3JlYXRlIHByZXZpZXdzXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZmlsZU5hbWVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgY29uc3QgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICBjb25zdCBmaWxlTmFtZSA9IGZpbGVOYW1lc1tpXS5uYW1lO1xuXG4gICAgLy8gUHVzaCB1cGRhdGVkIGZpbGUgbmFtZXMgaW50byB0aGUgc3RvcmUgYXJyYXlcbiAgICBmaWxlU3RvcmUucHVzaChmaWxlTmFtZSk7XG5cbiAgICAvLyByZWFkIG91dCB0aGUgc3RvcmUgYXJyYXkgdmlhIGFyaWEtbGFiZWwsIHdvcmRpbmcgb3B0aW9ucyB2YXJ5IGJhc2VkIG9uIGZpbGUgY291bnRcbiAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgZmlsZUlucHV0RWwuc2V0QXR0cmlidXRlKFxuICAgICAgICBcImFyaWEtbGFiZWxcIixcbiAgICAgICAgYFlvdSBoYXZlIHNlbGVjdGVkIHRoZSBmaWxlOiAke2ZpbGVOYW1lfWBcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmIChpID49IDEpIHtcbiAgICAgIGZpbGVJbnB1dEVsLnNldEF0dHJpYnV0ZShcbiAgICAgICAgXCJhcmlhLWxhYmVsXCIsXG4gICAgICAgIGBZb3UgaGF2ZSBzZWxlY3RlZCAke2ZpbGVOYW1lcy5sZW5ndGh9IGZpbGVzOiAke2ZpbGVTdG9yZS5qb2luKFwiLCBcIil9YFxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBTdGFydHMgd2l0aCBhIGxvYWRpbmcgaW1hZ2Ugd2hpbGUgcHJldmlldyBpcyBjcmVhdGVkXG4gICAgcmVhZGVyLm9ubG9hZHN0YXJ0ID0gZnVuY3Rpb24gY3JlYXRlTG9hZGluZ0ltYWdlKCkge1xuICAgICAgY29uc3QgaW1hZ2VJZCA9IGNyZWF0ZVVuaXF1ZUlEKG1ha2VTYWZlRm9ySUQoZmlsZU5hbWUpKTtcblxuICAgICAgaW5zdHJ1Y3Rpb25zLmluc2VydEFkamFjZW50SFRNTChcbiAgICAgICAgXCJhZnRlcmVuZFwiLFxuICAgICAgICBTYW5pdGl6ZXIuZXNjYXBlSFRNTGA8ZGl2IGNsYXNzPVwiJHtQUkVWSUVXX0NMQVNTfVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPlxuICAgICAgICAgIDxpbWcgaWQ9XCIke2ltYWdlSWR9XCIgc3JjPVwiJHtTUEFDRVJfR0lGfVwiIGFsdD1cIlwiIGNsYXNzPVwiJHtHRU5FUklDX1BSRVZJRVdfQ0xBU1NfTkFNRX0gJHtMT0FESU5HX0NMQVNTfVwiLz4ke2ZpbGVOYW1lfVxuICAgICAgICA8ZGl2PmBcbiAgICAgICk7XG4gICAgfTtcblxuICAgIC8vIE5vdCBhbGwgZmlsZXMgd2lsbCBiZSBhYmxlIHRvIGdlbmVyYXRlIHByZXZpZXdzLiBJbiBjYXNlIHRoaXMgaGFwcGVucywgd2UgcHJvdmlkZSBzZXZlcmFsIHR5cGVzIFwiZ2VuZXJpYyBwcmV2aWV3c1wiIGJhc2VkIG9uIHRoZSBmaWxlIGV4dGVuc2lvbi5cbiAgICByZWFkZXIub25sb2FkZW5kID0gZnVuY3Rpb24gY3JlYXRlRmlsZVByZXZpZXcoKSB7XG4gICAgICBjb25zdCBpbWFnZUlkID0gY3JlYXRlVW5pcXVlSUQobWFrZVNhZmVGb3JJRChmaWxlTmFtZSkpO1xuICAgICAgY29uc3QgcHJldmlld0ltYWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaW1hZ2VJZCk7XG4gICAgICBpZiAoZmlsZU5hbWUuaW5kZXhPZihcIi5wZGZcIikgPiAwKSB7XG4gICAgICAgIHByZXZpZXdJbWFnZS5zZXRBdHRyaWJ1dGUoXG4gICAgICAgICAgXCJvbmVycm9yXCIsXG4gICAgICAgICAgYHRoaXMub25lcnJvcj1udWxsO3RoaXMuc3JjPVwiJHtTUEFDRVJfR0lGfVwiOyB0aGlzLmNsYXNzTGlzdC5hZGQoXCIke1BERl9QUkVWSUVXX0NMQVNTfVwiKWBcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIGZpbGVOYW1lLmluZGV4T2YoXCIuZG9jXCIpID4gMCB8fFxuICAgICAgICBmaWxlTmFtZS5pbmRleE9mKFwiLnBhZ2VzXCIpID4gMFxuICAgICAgKSB7XG4gICAgICAgIHByZXZpZXdJbWFnZS5zZXRBdHRyaWJ1dGUoXG4gICAgICAgICAgXCJvbmVycm9yXCIsXG4gICAgICAgICAgYHRoaXMub25lcnJvcj1udWxsO3RoaXMuc3JjPVwiJHtTUEFDRVJfR0lGfVwiOyB0aGlzLmNsYXNzTGlzdC5hZGQoXCIke1dPUkRfUFJFVklFV19DTEFTU31cIilgXG4gICAgICAgICk7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICBmaWxlTmFtZS5pbmRleE9mKFwiLnhsc1wiKSA+IDAgfHxcbiAgICAgICAgZmlsZU5hbWUuaW5kZXhPZihcIi5udW1iZXJzXCIpID4gMFxuICAgICAgKSB7XG4gICAgICAgIHByZXZpZXdJbWFnZS5zZXRBdHRyaWJ1dGUoXG4gICAgICAgICAgXCJvbmVycm9yXCIsXG4gICAgICAgICAgYHRoaXMub25lcnJvcj1udWxsO3RoaXMuc3JjPVwiJHtTUEFDRVJfR0lGfVwiOyB0aGlzLmNsYXNzTGlzdC5hZGQoXCIke0VYQ0VMX1BSRVZJRVdfQ0xBU1N9XCIpYFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIGlmIChmaWxlTmFtZS5pbmRleE9mKFwiLm1vdlwiKSA+IDAgfHwgZmlsZU5hbWUuaW5kZXhPZihcIi5tcDRcIikgPiAwKSB7XG4gICAgICAgIHByZXZpZXdJbWFnZS5zZXRBdHRyaWJ1dGUoXG4gICAgICAgICAgXCJvbmVycm9yXCIsXG4gICAgICAgICAgYHRoaXMub25lcnJvcj1udWxsO3RoaXMuc3JjPVwiJHtTUEFDRVJfR0lGfVwiOyB0aGlzLmNsYXNzTGlzdC5hZGQoXCIke1ZJREVPX1BSRVZJRVdfQ0xBU1N9XCIpYFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJldmlld0ltYWdlLnNldEF0dHJpYnV0ZShcbiAgICAgICAgICBcIm9uZXJyb3JcIixcbiAgICAgICAgICBgdGhpcy5vbmVycm9yPW51bGw7dGhpcy5zcmM9XCIke1NQQUNFUl9HSUZ9XCI7IHRoaXMuY2xhc3NMaXN0LmFkZChcIiR7R0VORVJJQ19QUkVWSUVXX0NMQVNTfVwiKWBcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgLy8gUmVtb3ZlcyBsb2FkZXIgYW5kIGRpc3BsYXlzIHByZXZpZXdcbiAgICAgIHByZXZpZXdJbWFnZS5jbGFzc0xpc3QucmVtb3ZlKExPQURJTkdfQ0xBU1MpO1xuICAgICAgcHJldmlld0ltYWdlLnNyYyA9IHJlYWRlci5yZXN1bHQ7XG4gICAgfTtcblxuICAgIGlmIChmaWxlTmFtZXNbaV0pIHtcbiAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGVOYW1lc1tpXSk7XG4gICAgfVxuXG4gICAgLy8gQWRkcyBoZWFkaW5nIGFib3ZlIGZpbGUgcHJldmlld3MsIHBsdXJhbGl6ZXMgaWYgdGhlcmUgYXJlIG11bHRpcGxlXG4gICAgaWYgKGkgPT09IDApIHtcbiAgICAgIGRyb3BUYXJnZXQuaW5zZXJ0QmVmb3JlKGZpbGVQcmV2aWV3c0hlYWRpbmcsIGluc3RydWN0aW9ucyk7XG4gICAgICBmaWxlUHJldmlld3NIZWFkaW5nLmlubmVySFRNTCA9IGBTZWxlY3RlZCBmaWxlIDxzcGFuIGNsYXNzPVwidXNhLWZpbGUtaW5wdXRfX2Nob29zZVwiPkNoYW5nZSBmaWxlPC9zcGFuPmA7XG4gICAgfSBlbHNlIGlmIChpID49IDEpIHtcbiAgICAgIGRyb3BUYXJnZXQuaW5zZXJ0QmVmb3JlKGZpbGVQcmV2aWV3c0hlYWRpbmcsIGluc3RydWN0aW9ucyk7XG4gICAgICBmaWxlUHJldmlld3NIZWFkaW5nLmlubmVySFRNTCA9IFNhbml0aXplci5lc2NhcGVIVE1MYCR7XG4gICAgICAgIGkgKyAxXG4gICAgICB9IGZpbGVzIHNlbGVjdGVkIDxzcGFuIGNsYXNzPVwidXNhLWZpbGUtaW5wdXRfX2Nob29zZVwiPkNoYW5nZSBmaWxlczwvc3Bhbj5gO1xuICAgIH1cblxuICAgIC8vIEhpZGVzIG51bGwgc3RhdGUgY29udGVudCBhbmQgc2V0cyBwcmV2aWV3IGhlYWRpbmcgY2xhc3NcbiAgICBpZiAoZmlsZVByZXZpZXdzSGVhZGluZykge1xuICAgICAgaW5zdHJ1Y3Rpb25zLmNsYXNzTGlzdC5hZGQoSElEREVOX0NMQVNTKTtcbiAgICAgIGZpbGVQcmV2aWV3c0hlYWRpbmcuY2xhc3NMaXN0LmFkZChQUkVWSUVXX0hFQURJTkdfQ0xBU1MpO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBXaGVuIHVzaW5nIGFuIEFjY2VwdCBhdHRyaWJ1dGUsIGludmFsaWQgZmlsZXMgd2lsbCBiZSBoaWRkZW4gZnJvbVxuICogZmlsZSBicm93c2VyLCBidXQgdGhleSBjYW4gc3RpbGwgYmUgZHJhZ2dlZCB0byB0aGUgaW5wdXQuIFRoaXNcbiAqIGZ1bmN0aW9uIHByZXZlbnRzIHRoZW0gZnJvbSBiZWluZyBkcmFnZ2VkIGFuZCByZW1vdmVzIGVycm9yIHN0YXRlc1xuICogd2hlbiBjb3JyZWN0IGZpbGVzIGFyZSBhZGRlZC5cbiAqIEBwYXJhbSB7ZXZlbnR9IGVcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGZpbGVJbnB1dEVsIC0gZmlsZSBpbnB1dCBlbGVtZW50XG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBpbnN0cnVjdGlvbnMgLSB0ZXh0IHRvIGluZm9ybSB1c2VycyB0byBkcmFnIG9yIHNlbGVjdCBmaWxlc1xuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZHJvcFRhcmdldCAtIHRhcmdldCBhcmVhIGRpdiB0aGF0IGVuY2FzZXMgdGhlIGlucHV0XG4gKi9cbmNvbnN0IHByZXZlbnRJbnZhbGlkRmlsZXMgPSAoZSwgZmlsZUlucHV0RWwsIGluc3RydWN0aW9ucywgZHJvcFRhcmdldCkgPT4ge1xuICBjb25zdCBhY2NlcHRlZEZpbGVzQXR0ciA9IGZpbGVJbnB1dEVsLmdldEF0dHJpYnV0ZShcImFjY2VwdFwiKTtcbiAgZHJvcFRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKElOVkFMSURfRklMRV9DTEFTUyk7XG5cbiAgLyoqXG4gICAqIFdlIGNhbiBwcm9iYWJseSBtb3ZlIGF3YXkgZnJvbSB0aGlzIG9uY2UgSUUxMSBzdXBwb3J0IHN0b3BzLCBhbmQgcmVwbGFjZVxuICAgKiB3aXRoIGEgc2ltcGxlIGVzIGAuaW5jbHVkZXNgXG4gICAqIGNoZWNrIGlmIGVsZW1lbnQgaXMgaW4gYXJyYXlcbiAgICogY2hlY2sgaWYgMSBvciBtb3JlIGFscGhhYmV0cyBhcmUgaW4gc3RyaW5nXG4gICAqIGlmIGVsZW1lbnQgaXMgcHJlc2VudCByZXR1cm4gdGhlIHBvc2l0aW9uIHZhbHVlIGFuZCAtMSBvdGhlcndpc2VcbiAgICogQHBhcmFtIHtPYmplY3R9IGZpbGVcbiAgICogQHBhcmFtIHtTdHJpbmd9IHZhbHVlXG4gICAqIEByZXR1cm5zIHtCb29sZWFufVxuICAgKi9cbiAgY29uc3QgaXNJbmNsdWRlZCA9IChmaWxlLCB2YWx1ZSkgPT4ge1xuICAgIGxldCByZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgIGNvbnN0IHBvcyA9IGZpbGUuaW5kZXhPZih2YWx1ZSk7XG4gICAgaWYgKHBvcyA+PSAwKSB7XG4gICAgICByZXR1cm5WYWx1ZSA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiByZXR1cm5WYWx1ZTtcbiAgfTtcblxuICAvLyBSdW5zIGlmIG9ubHkgc3BlY2lmaWMgZmlsZXMgYXJlIGFjY2VwdGVkXG4gIGlmIChhY2NlcHRlZEZpbGVzQXR0cikge1xuICAgIGNvbnN0IGFjY2VwdGVkRmlsZXMgPSBhY2NlcHRlZEZpbGVzQXR0ci5zcGxpdChcIixcIik7XG4gICAgY29uc3QgZXJyb3JNZXNzYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuICAgIC8vIElmIG11bHRpcGxlIGZpbGVzIGFyZSBkcmFnZ2VkLCB0aGlzIGl0ZXJhdGVzIHRocm91Z2ggdGhlbSBhbmQgbG9vayBmb3IgYW55IGZpbGVzIHRoYXQgYXJlIG5vdCBhY2NlcHRlZC5cbiAgICBsZXQgYWxsRmlsZXNBbGxvd2VkID0gdHJ1ZTtcbiAgICBjb25zdCBzY2FubmVkRmlsZXMgPSBlLnRhcmdldC5maWxlcyB8fCBlLmRhdGFUcmFuc2Zlci5maWxlcztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNjYW5uZWRGaWxlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgY29uc3QgZmlsZSA9IHNjYW5uZWRGaWxlc1tpXTtcbiAgICAgIGlmIChhbGxGaWxlc0FsbG93ZWQpIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBhY2NlcHRlZEZpbGVzLmxlbmd0aDsgaiArPSAxKSB7XG4gICAgICAgICAgY29uc3QgZmlsZVR5cGUgPSBhY2NlcHRlZEZpbGVzW2pdO1xuICAgICAgICAgIGFsbEZpbGVzQWxsb3dlZCA9XG4gICAgICAgICAgICBmaWxlLm5hbWUuaW5kZXhPZihmaWxlVHlwZSkgPiAwIHx8XG4gICAgICAgICAgICBpc0luY2x1ZGVkKGZpbGUudHlwZSwgZmlsZVR5cGUucmVwbGFjZSgvXFwqL2csIFwiXCIpKTtcbiAgICAgICAgICBpZiAoYWxsRmlsZXNBbGxvd2VkKSB7XG4gICAgICAgICAgICBUWVBFX0lTX1ZBTElEID0gdHJ1ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGJyZWFrO1xuICAgIH1cblxuICAgIC8vIElmIGRyYWdnZWQgZmlsZXMgYXJlIG5vdCBhY2NlcHRlZCwgdGhpcyByZW1vdmVzIHRoZW0gZnJvbSB0aGUgdmFsdWUgb2YgdGhlIGlucHV0IGFuZCBjcmVhdGVzIGFuZCBlcnJvciBzdGF0ZVxuICAgIGlmICghYWxsRmlsZXNBbGxvd2VkKSB7XG4gICAgICByZW1vdmVPbGRQcmV2aWV3cyhkcm9wVGFyZ2V0LCBpbnN0cnVjdGlvbnMpO1xuICAgICAgZmlsZUlucHV0RWwudmFsdWUgPSBcIlwiOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICBkcm9wVGFyZ2V0Lmluc2VydEJlZm9yZShlcnJvck1lc3NhZ2UsIGZpbGVJbnB1dEVsKTtcbiAgICAgIGVycm9yTWVzc2FnZS50ZXh0Q29udGVudCA9XG4gICAgICAgIGZpbGVJbnB1dEVsLmRhdGFzZXQuZXJyb3JtZXNzYWdlIHx8IGBUaGlzIGlzIG5vdCBhIHZhbGlkIGZpbGUgdHlwZS5gO1xuICAgICAgZXJyb3JNZXNzYWdlLmNsYXNzTGlzdC5hZGQoQUNDRVBURURfRklMRV9NRVNTQUdFX0NMQVNTKTtcbiAgICAgIGRyb3BUYXJnZXQuY2xhc3NMaXN0LmFkZChJTlZBTElEX0ZJTEVfQ0xBU1MpO1xuICAgICAgVFlQRV9JU19WQUxJRCA9IGZhbHNlO1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogMS4gcGFzc2VzIHRocm91Z2ggZ2F0ZSBmb3IgcHJldmVudGluZyBpbnZhbGlkIGZpbGVzXG4gKiAyLiBoYW5kbGVzIHVwZGF0ZXMgaWYgZmlsZSBpcyB2YWxpZFxuICogQHBhcmFtIHtldmVudH0gZXZlbnRcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnRcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGluc3RydWN0aW9uc0VsXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSB0YXJnZXRcbiAqL1xuY29uc3QgaGFuZGxlVXBsb2FkID0gKGV2ZW50LCBlbGVtZW50LCBpbnN0cnVjdGlvbnNFbCwgZHJvcFRhcmdldEVsKSA9PiB7XG4gIHByZXZlbnRJbnZhbGlkRmlsZXMoZXZlbnQsIGVsZW1lbnQsIGluc3RydWN0aW9uc0VsLCBkcm9wVGFyZ2V0RWwpO1xuICBpZiAoVFlQRV9JU19WQUxJRCA9PT0gdHJ1ZSkge1xuICAgIGhhbmRsZUNoYW5nZShldmVudCwgZWxlbWVudCwgaW5zdHJ1Y3Rpb25zRWwsIGRyb3BUYXJnZXRFbCk7XG4gIH1cbn07XG5cbmNvbnN0IGZpbGVJbnB1dCA9IGJlaGF2aW9yKFxuICB7fSxcbiAge1xuICAgIGluaXQocm9vdCkge1xuICAgICAgc2VsZWN0T3JNYXRjaGVzKERST1BaT05FLCByb290KS5mb3JFYWNoKChmaWxlSW5wdXRFbCkgPT4ge1xuICAgICAgICBjb25zdCB7IGluc3RydWN0aW9ucywgZHJvcFRhcmdldCB9ID0gYnVpbGRGaWxlSW5wdXQoZmlsZUlucHV0RWwpO1xuXG4gICAgICAgIGRyb3BUYXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgICBcImRyYWdvdmVyXCIsXG4gICAgICAgICAgZnVuY3Rpb24gaGFuZGxlRHJhZ092ZXIoKSB7XG4gICAgICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoRFJBR19DTEFTUyk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBmYWxzZVxuICAgICAgICApO1xuXG4gICAgICAgIGRyb3BUYXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgICBcImRyYWdsZWF2ZVwiLFxuICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZURyYWdMZWF2ZSgpIHtcbiAgICAgICAgICAgIHRoaXMuY2xhc3NMaXN0LnJlbW92ZShEUkFHX0NMQVNTKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGZhbHNlXG4gICAgICAgICk7XG5cbiAgICAgICAgZHJvcFRhcmdldC5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICAgIFwiZHJvcFwiLFxuICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZURyb3AoKSB7XG4gICAgICAgICAgICB0aGlzLmNsYXNzTGlzdC5yZW1vdmUoRFJBR19DTEFTUyk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBmYWxzZVxuICAgICAgICApO1xuXG4gICAgICAgIGZpbGVJbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgXCJjaGFuZ2VcIixcbiAgICAgICAgICAoZSkgPT4gaGFuZGxlVXBsb2FkKGUsIGZpbGVJbnB1dEVsLCBpbnN0cnVjdGlvbnMsIGRyb3BUYXJnZXQpLFxuICAgICAgICAgIGZhbHNlXG4gICAgICAgICk7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHRlYXJkb3duKHJvb3QpIHtcbiAgICAgIHNlbGVjdE9yTWF0Y2hlcyhJTlBVVCwgcm9vdCkuZm9yRWFjaCgoZmlsZUlucHV0RWwpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZUlucHV0VG9wRWxlbWVudCA9IGZpbGVJbnB1dEVsLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudDtcbiAgICAgICAgZmlsZUlucHV0VG9wRWxlbWVudC5wYXJlbnRFbGVtZW50LnJlcGxhY2VDaGlsZChmaWxlSW5wdXRFbCwgZmlsZUlucHV0VG9wRWxlbWVudCk7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgICAgICBmaWxlSW5wdXRFbC5jbGFzc05hbWUgPSBEUk9QWk9ORV9DTEFTUztcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZ2V0RmlsZUlucHV0Q29udGV4dCxcbiAgICBkaXNhYmxlLFxuICAgIGVuYWJsZSxcbiAgfVxuKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmaWxlSW5wdXQ7XG4iLCJjb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcbmNvbnN0IHsgQ0xJQ0sgfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9ldmVudHNcIik7XG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvY29uZmlnXCIpO1xuXG5jb25zdCBTQ09QRSA9IGAuJHtQUkVGSVh9LWZvb3Rlci0tYmlnYDtcbmNvbnN0IE5BViA9IGAke1NDT1BFfSBuYXZgO1xuY29uc3QgQlVUVE9OID0gYCR7TkFWfSAuJHtQUkVGSVh9LWZvb3Rlcl9fcHJpbWFyeS1saW5rYDtcbmNvbnN0IEhJREVfTUFYX1dJRFRIID0gNDgwO1xuXG4vKipcbiAqIEV4cGFuZHMgc2VsZWN0ZWQgZm9vdGVyIG1lbnUgcGFuZWwsIHdoaWxlIGNvbGxhcHNpbmcgb3RoZXJzXG4gKi9cbmZ1bmN0aW9uIHNob3dQYW5lbCgpIHtcbiAgaWYgKHdpbmRvdy5pbm5lcldpZHRoIDwgSElERV9NQVhfV0lEVEgpIHtcbiAgICBjb25zdCBpc09wZW4gPSB0aGlzLmdldEF0dHJpYnV0ZShcImFyaWEtZXhwYW5kZWRcIikgPT09IFwidHJ1ZVwiO1xuICAgIGNvbnN0IHRoaXNGb290ZXIgPSB0aGlzLmNsb3Nlc3QoU0NPUEUpO1xuXG4gICAgLy8gQ2xvc2UgYWxsIG90aGVyIG1lbnVzXG4gICAgdGhpc0Zvb3Rlci5xdWVyeVNlbGVjdG9yQWxsKEJVVFRPTikuZm9yRWFjaCgoYnV0dG9uKSA9PiB7XG4gICAgICBidXR0b24uc2V0QXR0cmlidXRlKFwiYXJpYS1leHBhbmRlZFwiLCBmYWxzZSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnNldEF0dHJpYnV0ZShcImFyaWEtZXhwYW5kZWRcIiwgIWlzT3Blbik7XG4gIH1cbn1cblxuLyoqXG4gKiBTd2FwcyB0aGUgPGg0PiBlbGVtZW50IGZvciBhIDxidXR0b24+IGVsZW1lbnQgKGFuZCB2aWNlLXZlcnNhKSBhbmQgc2V0cyBpZFxuICogb2YgbWVudSBsaXN0XG4gKlxuICogQHBhcmFtIHtCb29sZWFufSBpc01vYmlsZSAtIElmIHRoZSBmb290ZXIgaXMgaW4gbW9iaWxlIGNvbmZpZ3VyYXRpb25cbiAqL1xuZnVuY3Rpb24gdG9nZ2xlSHRtbFRhZyhpc01vYmlsZSkge1xuICBjb25zdCBiaWdGb290ZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFNDT1BFKTtcblxuICBpZiAoIWJpZ0Zvb3Rlcikge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHByaW1hcnlMaW5rcyA9IGJpZ0Zvb3Rlci5xdWVyeVNlbGVjdG9yQWxsKEJVVFRPTik7XG4gIGNvbnN0IG5ld0VsZW1lbnRUeXBlID0gaXNNb2JpbGUgPyBcImJ1dHRvblwiIDogXCJoNFwiO1xuXG4gIHByaW1hcnlMaW5rcy5mb3JFYWNoKChjdXJyZW50RWxlbWVudCkgPT4ge1xuICAgIGNvbnN0IGN1cnJlbnRFbGVtZW50Q2xhc3NlcyA9IGN1cnJlbnRFbGVtZW50LmdldEF0dHJpYnV0ZShcImNsYXNzXCIpO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBuZXcgZWxlbWVudFxuICAgIGNvbnN0IG5ld0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5ld0VsZW1lbnRUeXBlKTtcbiAgICBuZXdFbGVtZW50LnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIGN1cnJlbnRFbGVtZW50Q2xhc3Nlcyk7XG4gICAgbmV3RWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKFxuICAgICAgYCR7UFJFRklYfS1mb290ZXJfX3ByaW1hcnktbGluay0tYnV0dG9uYCxcbiAgICAgIGlzTW9iaWxlXG4gICAgKTtcbiAgICBuZXdFbGVtZW50LnRleHRDb250ZW50ID0gY3VycmVudEVsZW1lbnQudGV4dENvbnRlbnQ7XG5cbiAgICBpZiAoaXNNb2JpbGUpIHtcbiAgICAgIGNvbnN0IG1lbnVJZCA9IGAke1BSRUZJWH0tZm9vdGVyLW1lbnUtbGlzdC0ke01hdGguZmxvb3IoXG4gICAgICAgIE1hdGgucmFuZG9tKCkgKiAxMDAwMDBcbiAgICAgICl9YDtcblxuICAgICAgbmV3RWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWNvbnRyb2xzXCIsIG1lbnVJZCk7XG4gICAgICBuZXdFbGVtZW50LnNldEF0dHJpYnV0ZShcImFyaWEtZXhwYW5kZWRcIiwgXCJmYWxzZVwiKTtcbiAgICAgIGN1cnJlbnRFbGVtZW50Lm5leHRFbGVtZW50U2libGluZy5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBtZW51SWQpO1xuICAgICAgbmV3RWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsIFwiYnV0dG9uXCIpO1xuICAgIH1cblxuICAgIC8vIEluc2VydCB0aGUgbmV3IGVsZW1lbnQgYW5kIGRlbGV0ZSB0aGUgb2xkXG4gICAgY3VycmVudEVsZW1lbnQuYWZ0ZXIobmV3RWxlbWVudCk7XG4gICAgY3VycmVudEVsZW1lbnQucmVtb3ZlKCk7XG4gIH0pO1xufVxuXG5jb25zdCByZXNpemUgPSAoZXZlbnQpID0+IHtcbiAgdG9nZ2xlSHRtbFRhZyhldmVudC5tYXRjaGVzKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYmVoYXZpb3IoXG4gIHtcbiAgICBbQ0xJQ0tdOiB7XG4gICAgICBbQlVUVE9OXTogc2hvd1BhbmVsLFxuICAgIH0sXG4gIH0sXG4gIHtcbiAgICAvLyBleHBvcnQgZm9yIHVzZSBlbHNld2hlcmVcbiAgICBISURFX01BWF9XSURUSCxcblxuICAgIGluaXQoKSB7XG4gICAgICB0b2dnbGVIdG1sVGFnKHdpbmRvdy5pbm5lcldpZHRoIDwgSElERV9NQVhfV0lEVEgpO1xuICAgICAgdGhpcy5tZWRpYVF1ZXJ5TGlzdCA9IHdpbmRvdy5tYXRjaE1lZGlhKFxuICAgICAgICBgKG1heC13aWR0aDogJHtISURFX01BWF9XSURUSCAtIDAuMX1weClgXG4gICAgICApO1xuICAgICAgdGhpcy5tZWRpYVF1ZXJ5TGlzdC5hZGRMaXN0ZW5lcihyZXNpemUpO1xuICAgIH0sXG5cbiAgICB0ZWFyZG93bigpIHtcbiAgICAgIHRoaXMubWVkaWFRdWVyeUxpc3QucmVtb3ZlTGlzdGVuZXIocmVzaXplKTtcbiAgICB9LFxuICB9XG4pO1xuIiwiY29uc3Qga2V5bWFwID0gcmVxdWlyZShcInJlY2VwdG9yL2tleW1hcFwiKTtcbmNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xuY29uc3Qgc2VsZWN0ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3NlbGVjdFwiKTtcbmNvbnN0IHRvZ2dsZSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy90b2dnbGVcIik7XG5jb25zdCBGb2N1c1RyYXAgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvZm9jdXMtdHJhcFwiKTtcbmNvbnN0IGFjY29yZGlvbiA9IHJlcXVpcmUoXCIuLi8uLi91c2EtYWNjb3JkaW9uL3NyYy9pbmRleFwiKTtcbmNvbnN0IFNjcm9sbEJhcldpZHRoID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3Njcm9sbGJhci13aWR0aFwiKTtcblxuY29uc3QgeyBDTElDSyB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2V2ZW50c1wiKTtcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XG5cbmNvbnN0IEJPRFkgPSBcImJvZHlcIjtcbmNvbnN0IEhFQURFUiA9IGAuJHtQUkVGSVh9LWhlYWRlcmA7XG5jb25zdCBOQVYgPSBgLiR7UFJFRklYfS1uYXZgO1xuY29uc3QgTkFWX0NPTlRBSU5FUiA9IGAuJHtQUkVGSVh9LW5hdi1jb250YWluZXJgO1xuY29uc3QgTkFWX1BSSU1BUlkgPSBgLiR7UFJFRklYfS1uYXZfX3ByaW1hcnlgO1xuY29uc3QgTkFWX1BSSU1BUllfSVRFTSA9IGAuJHtQUkVGSVh9LW5hdl9fcHJpbWFyeS1pdGVtYDtcbmNvbnN0IE5BVl9DT05UUk9MID0gYGJ1dHRvbi4ke1BSRUZJWH0tbmF2X19saW5rYDtcbmNvbnN0IE5BVl9MSU5LUyA9IGAke05BVn0gYWA7XG5jb25zdCBOT05fTkFWX0hJRERFTl9BVFRSSUJVVEUgPSBgZGF0YS1uYXYtaGlkZGVuYDtcbmNvbnN0IE9QRU5FUlMgPSBgLiR7UFJFRklYfS1tZW51LWJ0bmA7XG5jb25zdCBDTE9TRV9CVVRUT04gPSBgLiR7UFJFRklYfS1uYXZfX2Nsb3NlYDtcbmNvbnN0IE9WRVJMQVkgPSBgLiR7UFJFRklYfS1vdmVybGF5YDtcbmNvbnN0IENMT1NFUlMgPSBgJHtDTE9TRV9CVVRUT059LCAuJHtQUkVGSVh9LW92ZXJsYXlgO1xuY29uc3QgVE9HR0xFUyA9IFtOQVYsIE9WRVJMQVldLmpvaW4oXCIsIFwiKTtcbmNvbnN0IE5PTl9OQVZfRUxFTUVOVFMgPSBgYm9keSAqOm5vdCgke0hFQURFUn0sICR7TkFWX0NPTlRBSU5FUn0sICR7TkFWfSwgJHtOQVZ9ICopOm5vdChbYXJpYS1oaWRkZW5dKWA7XG5jb25zdCBOT05fTkFWX0hJRERFTiA9IGBbJHtOT05fTkFWX0hJRERFTl9BVFRSSUJVVEV9XWA7XG5cbmNvbnN0IEFDVElWRV9DTEFTUyA9IFwidXNhLWpzLW1vYmlsZS1uYXYtLWFjdGl2ZVwiO1xuY29uc3QgVklTSUJMRV9DTEFTUyA9IFwiaXMtdmlzaWJsZVwiO1xuXG5sZXQgbmF2aWdhdGlvbjtcbmxldCBuYXZBY3RpdmU7XG5sZXQgbm9uTmF2RWxlbWVudHM7XG5cbmNvbnN0IGlzQWN0aXZlID0gKCkgPT4gZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuY29udGFpbnMoQUNUSVZFX0NMQVNTKTtcbmNvbnN0IFNDUk9MTEJBUl9XSURUSCA9IFNjcm9sbEJhcldpZHRoKCk7XG5jb25zdCBJTklUSUFMX1BBRERJTkcgPSB3aW5kb3dcbiAgLmdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQuYm9keSlcbiAgLmdldFByb3BlcnR5VmFsdWUoXCJwYWRkaW5nLXJpZ2h0XCIpO1xuY29uc3QgVEVNUE9SQVJZX1BBRERJTkcgPSBgJHtcbiAgcGFyc2VJbnQoSU5JVElBTF9QQURESU5HLnJlcGxhY2UoL3B4LywgXCJcIiksIDEwKSArXG4gIHBhcnNlSW50KFNDUk9MTEJBUl9XSURUSC5yZXBsYWNlKC9weC8sIFwiXCIpLCAxMClcbn1weGA7XG5cbmNvbnN0IGhpZGVOb25OYXZJdGVtcyA9ICgpID0+IHtcbiAgY29uc3QgaGVhZGVyUGFyZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgJHtIRUFERVJ9YCkucGFyZW50Tm9kZTtcbiAgbm9uTmF2RWxlbWVudHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKE5PTl9OQVZfRUxFTUVOVFMpO1xuXG4gIG5vbk5hdkVsZW1lbnRzLmZvckVhY2goKG5vbk5hdkVsZW1lbnQpID0+IHtcbiAgICBpZihub25OYXZFbGVtZW50ICE9PSBoZWFkZXJQYXJlbnQpIHtcbiAgICAgIG5vbk5hdkVsZW1lbnQuc2V0QXR0cmlidXRlKFwiYXJpYS1oaWRkZW5cIiwgdHJ1ZSk7XG4gICAgICBub25OYXZFbGVtZW50LnNldEF0dHJpYnV0ZShOT05fTkFWX0hJRERFTl9BVFRSSUJVVEUsIFwiXCIpO1xuICAgIH1cbiAgfSk7XG59O1xuXG5jb25zdCBzaG93Tm9uTmF2SXRlbXMgPSAoKSA9PiB7XG4gIG5vbk5hdkVsZW1lbnRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChOT05fTkFWX0hJRERFTik7XG5cbiAgaWYgKCFub25OYXZFbGVtZW50cykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIFJlbW92ZSBhcmlhLWhpZGRlbiBmcm9tIG5vbi1oZWFkZXIgZWxlbWVudHNcbiAgbm9uTmF2RWxlbWVudHMuZm9yRWFjaCgobm9uTmF2RWxlbWVudCkgPT4ge1xuICAgIG5vbk5hdkVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKFwiYXJpYS1oaWRkZW5cIik7XG4gICAgbm9uTmF2RWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoTk9OX05BVl9ISURERU5fQVRUUklCVVRFKTtcbiAgfSk7XG59O1xuXG4vLyBUb2dnbGUgYWxsIG5vbi1oZWFkZXIgZWxlbWVudHMgIzM1MjcuXG5jb25zdCB0b2dnbGVOb25OYXZJdGVtcyA9IChhY3RpdmUpID0+IHtcbiAgaWYgKGFjdGl2ZSkge1xuICAgIGhpZGVOb25OYXZJdGVtcygpO1xuICB9IGVsc2Uge1xuICAgIHNob3dOb25OYXZJdGVtcygpO1xuICB9XG59O1xuXG5jb25zdCB0b2dnbGVOYXYgPSAoYWN0aXZlKSA9PiB7XG4gIGNvbnN0IHsgYm9keSB9ID0gZG9jdW1lbnQ7XG4gIGNvbnN0IHNhZmVBY3RpdmUgPSB0eXBlb2YgYWN0aXZlID09PSBcImJvb2xlYW5cIiA/IGFjdGl2ZSA6ICFpc0FjdGl2ZSgpO1xuXG4gIGJvZHkuY2xhc3NMaXN0LnRvZ2dsZShBQ1RJVkVfQ0xBU1MsIHNhZmVBY3RpdmUpO1xuXG4gIHNlbGVjdChUT0dHTEVTKS5mb3JFYWNoKChlbCkgPT5cbiAgICBlbC5jbGFzc0xpc3QudG9nZ2xlKFZJU0lCTEVfQ0xBU1MsIHNhZmVBY3RpdmUpXG4gICk7XG5cbiAgbmF2aWdhdGlvbi5mb2N1c1RyYXAudXBkYXRlKHNhZmVBY3RpdmUpO1xuXG4gIGNvbnN0IGNsb3NlQnV0dG9uID0gYm9keS5xdWVyeVNlbGVjdG9yKENMT1NFX0JVVFRPTik7XG4gIGNvbnN0IG1lbnVCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKE9QRU5FUlMpO1xuXG4gIGJvZHkuc3R5bGUucGFkZGluZ1JpZ2h0ID1cbiAgICBib2R5LnN0eWxlLnBhZGRpbmdSaWdodCA9PT0gVEVNUE9SQVJZX1BBRERJTkdcbiAgICAgID8gSU5JVElBTF9QQURESU5HXG4gICAgICA6IFRFTVBPUkFSWV9QQURESU5HO1xuXG4gIHRvZ2dsZU5vbk5hdkl0ZW1zKHNhZmVBY3RpdmUpO1xuXG4gIGlmIChzYWZlQWN0aXZlICYmIGNsb3NlQnV0dG9uKSB7XG4gICAgLy8gVGhlIG1vYmlsZSBuYXYgd2FzIGp1c3QgYWN0aXZhdGVkLiBGb2N1cyBvbiB0aGUgY2xvc2UgYnV0dG9uLCB3aGljaCBpc1xuICAgIC8vIGp1c3QgYmVmb3JlIGFsbCB0aGUgbmF2IGVsZW1lbnRzIGluIHRoZSB0YWIgb3JkZXIuXG4gICAgY2xvc2VCdXR0b24uZm9jdXMoKTtcbiAgfSBlbHNlIGlmIChcbiAgICAhc2FmZUFjdGl2ZSAmJlxuICAgIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgPT09IGNsb3NlQnV0dG9uICYmXG4gICAgbWVudUJ1dHRvblxuICApIHtcbiAgICAvLyBUaGUgbW9iaWxlIG5hdiB3YXMganVzdCBkZWFjdGl2YXRlZCwgYW5kIGZvY3VzIHdhcyBvbiB0aGUgY2xvc2VcbiAgICAvLyBidXR0b24sIHdoaWNoIGlzIG5vIGxvbmdlciB2aXNpYmxlLiBXZSBkb24ndCB3YW50IHRoZSBmb2N1cyB0b1xuICAgIC8vIGRpc2FwcGVhciBpbnRvIHRoZSB2b2lkLCBzbyBmb2N1cyBvbiB0aGUgbWVudSBidXR0b24gaWYgaXQnc1xuICAgIC8vIHZpc2libGUgKHRoaXMgbWF5IGhhdmUgYmVlbiB3aGF0IHRoZSB1c2VyIHdhcyBqdXN0IGZvY3VzZWQgb24sXG4gICAgLy8gaWYgdGhleSB0cmlnZ2VyZWQgdGhlIG1vYmlsZSBuYXYgYnkgbWlzdGFrZSkuXG4gICAgbWVudUJ1dHRvbi5mb2N1cygpO1xuICB9XG5cbiAgcmV0dXJuIHNhZmVBY3RpdmU7XG59O1xuXG5jb25zdCByZXNpemUgPSAoKSA9PiB7XG4gIGNvbnN0IGNsb3NlciA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvcihDTE9TRV9CVVRUT04pO1xuXG4gIGlmIChpc0FjdGl2ZSgpICYmIGNsb3NlciAmJiBjbG9zZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkud2lkdGggPT09IDApIHtcbiAgICAvLyBXaGVuIHRoZSBtb2JpbGUgbmF2IGlzIGFjdGl2ZSwgYW5kIHRoZSBjbG9zZSBib3ggaXNuJ3QgdmlzaWJsZSxcbiAgICAvLyB3ZSBrbm93IHRoZSB1c2VyJ3Mgdmlld3BvcnQgaGFzIGJlZW4gcmVzaXplZCB0byBiZSBsYXJnZXIuXG4gICAgLy8gTGV0J3MgbWFrZSB0aGUgcGFnZSBzdGF0ZSBjb25zaXN0ZW50IGJ5IGRlYWN0aXZhdGluZyB0aGUgbW9iaWxlIG5hdi5cbiAgICBuYXZpZ2F0aW9uLnRvZ2dsZU5hdi5jYWxsKGNsb3NlciwgZmFsc2UpO1xuICB9XG59O1xuXG5jb25zdCBvbk1lbnVDbG9zZSA9ICgpID0+IG5hdmlnYXRpb24udG9nZ2xlTmF2LmNhbGwobmF2aWdhdGlvbiwgZmFsc2UpO1xuXG5jb25zdCBoaWRlQWN0aXZlTmF2RHJvcGRvd24gPSAoKSA9PiB7XG4gIGlmICghbmF2QWN0aXZlKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdG9nZ2xlKG5hdkFjdGl2ZSwgZmFsc2UpO1xuICBuYXZBY3RpdmUgPSBudWxsO1xufTtcblxuY29uc3QgZm9jdXNOYXZCdXR0b24gPSAoZXZlbnQpID0+IHtcbiAgY29uc3QgcGFyZW50TmF2SXRlbSA9IGV2ZW50LnRhcmdldC5jbG9zZXN0KE5BVl9QUklNQVJZX0lURU0pO1xuXG4gIC8vIE9ubHkgc2hpZnQgZm9jdXMgaWYgd2l0aGluIGRyb3Bkb3duXG4gIGlmICghZXZlbnQudGFyZ2V0Lm1hdGNoZXMoTkFWX0NPTlRST0wpKSB7XG4gICAgcGFyZW50TmF2SXRlbS5xdWVyeVNlbGVjdG9yKE5BVl9DT05UUk9MKS5mb2N1cygpO1xuICB9XG59O1xuXG5jb25zdCBoYW5kbGVFc2NhcGUgPSAoZXZlbnQpID0+IHtcbiAgaGlkZUFjdGl2ZU5hdkRyb3Bkb3duKCk7XG4gIGZvY3VzTmF2QnV0dG9uKGV2ZW50KTtcbn07XG5cbm5hdmlnYXRpb24gPSBiZWhhdmlvcihcbiAge1xuICAgIFtDTElDS106IHtcbiAgICAgIFtOQVZfQ09OVFJPTF0oKSB7XG4gICAgICAgIC8vIElmIGFub3RoZXIgbmF2IGlzIG9wZW4sIGNsb3NlIGl0XG4gICAgICAgIGlmIChuYXZBY3RpdmUgIT09IHRoaXMpIHtcbiAgICAgICAgICBoaWRlQWN0aXZlTmF2RHJvcGRvd24oKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBzdG9yZSBhIHJlZmVyZW5jZSB0byB0aGUgbGFzdCBjbGlja2VkIG5hdiBsaW5rIGVsZW1lbnQsIHNvIHdlXG4gICAgICAgIC8vIGNhbiBoaWRlIHRoZSBkcm9wZG93biBpZiBhbm90aGVyIGVsZW1lbnQgb24gdGhlIHBhZ2UgaXMgY2xpY2tlZFxuICAgICAgICBpZiAoIW5hdkFjdGl2ZSkge1xuICAgICAgICAgIG5hdkFjdGl2ZSA9IHRoaXM7XG4gICAgICAgICAgdG9nZ2xlKG5hdkFjdGl2ZSwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEbyB0aGlzIHNvIHRoZSBldmVudCBoYW5kbGVyIG9uIHRoZSBib2R5IGRvZXNuJ3QgZmlyZVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9LFxuICAgICAgW0JPRFldOiBoaWRlQWN0aXZlTmF2RHJvcGRvd24sXG4gICAgICBbT1BFTkVSU106IHRvZ2dsZU5hdixcbiAgICAgIFtDTE9TRVJTXTogdG9nZ2xlTmF2LFxuICAgICAgW05BVl9MSU5LU10oKSB7XG4gICAgICAgIC8vIEEgbmF2aWdhdGlvbiBsaW5rIGhhcyBiZWVuIGNsaWNrZWQhIFdlIHdhbnQgdG8gY29sbGFwc2UgYW55XG4gICAgICAgIC8vIGhpZXJhcmNoaWNhbCBuYXZpZ2F0aW9uIFVJIGl0J3MgYSBwYXJ0IG9mLCBzbyB0aGF0IHRoZSB1c2VyXG4gICAgICAgIC8vIGNhbiBmb2N1cyBvbiB3aGF0ZXZlciB0aGV5J3ZlIGp1c3Qgc2VsZWN0ZWQuXG5cbiAgICAgICAgLy8gU29tZSBuYXZpZ2F0aW9uIGxpbmtzIGFyZSBpbnNpZGUgYWNjb3JkaW9uczsgd2hlbiB0aGV5J3JlXG4gICAgICAgIC8vIGNsaWNrZWQsIHdlIHdhbnQgdG8gY29sbGFwc2UgdGhvc2UgYWNjb3JkaW9ucy5cbiAgICAgICAgY29uc3QgYWNjID0gdGhpcy5jbG9zZXN0KGFjY29yZGlvbi5BQ0NPUkRJT04pO1xuXG4gICAgICAgIGlmIChhY2MpIHtcbiAgICAgICAgICBhY2NvcmRpb24uZ2V0QnV0dG9ucyhhY2MpLmZvckVhY2goKGJ0bikgPT4gYWNjb3JkaW9uLmhpZGUoYnRuKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgbW9iaWxlIG5hdmlnYXRpb24gbWVudSBpcyBhY3RpdmUsIHdlIHdhbnQgdG8gaGlkZSBpdC5cbiAgICAgICAgaWYgKGlzQWN0aXZlKCkpIHtcbiAgICAgICAgICBuYXZpZ2F0aW9uLnRvZ2dsZU5hdi5jYWxsKG5hdmlnYXRpb24sIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuICAgIGtleWRvd246IHtcbiAgICAgIFtOQVZfUFJJTUFSWV06IGtleW1hcCh7IEVzY2FwZTogaGFuZGxlRXNjYXBlIH0pLFxuICAgIH0sXG4gICAgZm9jdXNvdXQ6IHtcbiAgICAgIFtOQVZfUFJJTUFSWV0oZXZlbnQpIHtcbiAgICAgICAgY29uc3QgbmF2ID0gZXZlbnQudGFyZ2V0LmNsb3Nlc3QoTkFWX1BSSU1BUlkpO1xuXG4gICAgICAgIGlmICghbmF2LmNvbnRhaW5zKGV2ZW50LnJlbGF0ZWRUYXJnZXQpKSB7XG4gICAgICAgICAgaGlkZUFjdGl2ZU5hdkRyb3Bkb3duKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAge1xuICAgIGluaXQocm9vdCkge1xuICAgICAgY29uc3QgdHJhcENvbnRhaW5lciA9IHJvb3QubWF0Y2hlcyhOQVYpID8gcm9vdCA6IHJvb3QucXVlcnlTZWxlY3RvcihOQVYpO1xuXG4gICAgICBpZiAodHJhcENvbnRhaW5lcikge1xuICAgICAgICBuYXZpZ2F0aW9uLmZvY3VzVHJhcCA9IEZvY3VzVHJhcCh0cmFwQ29udGFpbmVyLCB7XG4gICAgICAgICAgRXNjYXBlOiBvbk1lbnVDbG9zZSxcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJlc2l6ZSgpO1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgcmVzaXplLCBmYWxzZSk7XG4gICAgfSxcbiAgICB0ZWFyZG93bigpIHtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIHJlc2l6ZSwgZmFsc2UpO1xuICAgICAgbmF2QWN0aXZlID0gZmFsc2U7XG4gICAgfSxcbiAgICBmb2N1c1RyYXA6IG51bGwsXG4gICAgdG9nZ2xlTmF2LFxuICB9XG4pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5hdmlnYXRpb247XG4iLCJjb25zdCBvbmNlID0gcmVxdWlyZShcInJlY2VwdG9yL29uY2VcIik7XG5jb25zdCBrZXltYXAgPSByZXF1aXJlKFwicmVjZXB0b3Iva2V5bWFwXCIpO1xuY29uc3Qgc2VsZWN0T3JNYXRjaGVzID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3NlbGVjdC1vci1tYXRjaGVzXCIpO1xuY29uc3QgYmVoYXZpb3IgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvYmVoYXZpb3JcIik7XG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvY29uZmlnXCIpO1xuY29uc3QgeyBDTElDSyB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2V2ZW50c1wiKTtcbmNvbnN0IFNhbml0aXplciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zYW5pdGl6ZXJcIik7XG5cbmNvbnN0IENVUlJFTlRfQ0xBU1MgPSBgJHtQUkVGSVh9LWN1cnJlbnRgO1xuY29uc3QgSU5fUEFHRV9OQVZfVElUTEVfVEVYVCA9IFwiT24gdGhpcyBwYWdlXCI7XG5jb25zdCBJTl9QQUdFX05BVl9USVRMRV9IRUFESU5HX0xFVkVMID0gXCJoNFwiO1xuY29uc3QgSU5fUEFHRV9OQVZfU0NST0xMX09GRlNFVCA9IDA7XG5jb25zdCBJTl9QQUdFX05BVl9ST09UX01BUkdJTiA9IFwiMHB4IDBweCAwcHggMHB4XCI7XG5jb25zdCBJTl9QQUdFX05BVl9USFJFU0hPTEQgPSBcIjFcIjtcbmNvbnN0IElOX1BBR0VfTkFWX0NMQVNTID0gYCR7UFJFRklYfS1pbi1wYWdlLW5hdmA7XG5jb25zdCBJTl9QQUdFX05BVl9BTkNIT1JfQ0xBU1MgPSBgJHtQUkVGSVh9LWFuY2hvcmA7XG5jb25zdCBJTl9QQUdFX05BVl9OQVZfQ0xBU1MgPSBgJHtJTl9QQUdFX05BVl9DTEFTU31fX25hdmA7XG5jb25zdCBJTl9QQUdFX05BVl9MSVNUX0NMQVNTID0gYCR7SU5fUEFHRV9OQVZfQ0xBU1N9X19saXN0YDtcbmNvbnN0IElOX1BBR0VfTkFWX0lURU1fQ0xBU1MgPSBgJHtJTl9QQUdFX05BVl9DTEFTU31fX2l0ZW1gO1xuY29uc3QgSU5fUEFHRV9OQVZfTElOS19DTEFTUyA9IGAke0lOX1BBR0VfTkFWX0NMQVNTfV9fbGlua2A7XG5jb25zdCBJTl9QQUdFX05BVl9USVRMRV9DTEFTUyA9IGAke0lOX1BBR0VfTkFWX0NMQVNTfV9faGVhZGluZ2A7XG5jb25zdCBTVUJfSVRFTV9DTEFTUyA9IGAke0lOX1BBR0VfTkFWX0lURU1fQ0xBU1N9LS1zdWItaXRlbWA7XG5jb25zdCBNQUlOX0VMRU1FTlQgPSBcIm1haW5cIjtcblxuLyoqXG4gKiBTZXQgdGhlIGFjdGl2ZSBsaW5rIHN0YXRlIGZvciB0aGUgY3VycmVudGx5IG9ic2VydmVkIHNlY3Rpb25cbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbCBBbiBlbGVtZW50IHdpdGhpbiB0aGUgaW4tcGFnZSBuYXYgY29tcG9uZW50XG4gKi9cbmNvbnN0IHNldEFjdGl2ZSA9IChlbCkgPT4ge1xuICBjb25zdCBhbGxMaW5rcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYC4ke0lOX1BBR0VfTkFWX0xJTktfQ0xBU1N9YCk7XG4gIGVsLm1hcCgoaSkgPT4ge1xuICAgIGlmIChpLmlzSW50ZXJzZWN0aW5nID09PSB0cnVlICYmIGkuaW50ZXJzZWN0aW9uUmF0aW8gPj0gMSkge1xuICAgICAgYWxsTGlua3MuZm9yRWFjaCgobGluaykgPT4gbGluay5jbGFzc0xpc3QucmVtb3ZlKENVUlJFTlRfQ0xBU1MpKTtcbiAgICAgIGRvY3VtZW50XG4gICAgICAgIC5xdWVyeVNlbGVjdG9yKGBhW2hyZWY9XCIjJHtpLnRhcmdldC5pZH1cIl1gKVxuICAgICAgICAuY2xhc3NMaXN0LmFkZChDVVJSRU5UX0NMQVNTKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gYSBub2RlIGxpc3Qgb2Ygc2VjdGlvbiBoZWFkaW5nc1xuICpcbiAqIEByZXR1cm4ge0hUTUxFbGVtZW50W119IC0gQW4gYXJyYXkgb2YgRE9NIG5vZGVzXG4gKi9cbmNvbnN0IGdldFNlY3Rpb25IZWFkaW5ncyA9ICgpID0+IHtcbiAgY29uc3Qgc2VjdGlvbkhlYWRpbmdzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcbiAgICBgJHtNQUlOX0VMRU1FTlR9IGgyLCAke01BSU5fRUxFTUVOVH0gaDNgXG4gICk7XG4gIHJldHVybiBzZWN0aW9uSGVhZGluZ3M7XG59O1xuXG4vKipcbiAqIFJldHVybiBhIG5vZGUgbGlzdCBvZiBzZWN0aW9uIGFuY2hvciB0YWdzXG4gKlxuICogQHJldHVybiB7SFRNTEVsZW1lbnRbXX0gLSBBbiBhcnJheSBvZiBET00gbm9kZXNcbiAqL1xuY29uc3QgZ2V0U2VjdGlvbkFuY2hvcnMgPSAoKSA9PiB7XG4gIGNvbnN0IHNlY3Rpb25BbmNob3JzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcbiAgICBgLiR7SU5fUEFHRV9OQVZfQU5DSE9SX0NMQVNTfWBcbiAgKTtcbiAgcmV0dXJuIHNlY3Rpb25BbmNob3JzO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gYSBzZWN0aW9uIGlkL2FuY2hvciBoYXNoIHdpdGhvdXQgdGhlIG51bWJlciBzaWduXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSAtIElkIHZhbHVlIHdpdGggdGhlIG51bWJlciBzaWduIHJlbW92ZWRcbiAqL1xuY29uc3QgZ2V0U2VjdGlvbklkID0gKHZhbHVlKSA9PiB7XG4gIGxldCBpZDtcblxuICAvLyBDaGVjayBpZiB2YWx1ZSBpcyBhbiBldmVudCBvciBlbGVtZW50IGFuZCBnZXQgdGhlIGNsZWFuZWQgdXAgaWRcbiAgaWYgKHZhbHVlICYmIHZhbHVlLm5vZGVUeXBlID09PSAxKSB7XG4gICAgaWQgPSB2YWx1ZS5nZXRBdHRyaWJ1dGUoXCJocmVmXCIpLnJlcGxhY2UoXCIjXCIsIFwiXCIpO1xuICB9IGVsc2Uge1xuICAgIGlkID0gdmFsdWUudGFyZ2V0Lmhhc2gucmVwbGFjZShcIiNcIiwgXCJcIik7XG4gIH1cblxuICByZXR1cm4gaWQ7XG59O1xuXG4vKipcbiAqIFNjcm9sbCBzbW9vdGhseSB0byBhIHNlY3Rpb24gYmFzZWQgb24gdGhlIHBhc3NlZCBpbiBlbGVtZW50XG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gLSBJZCB2YWx1ZSB3aXRoIHRoZSBudW1iZXIgc2lnbiByZW1vdmVkXG4gKi9cbmNvbnN0IGhhbmRsZVNjcm9sbFRvU2VjdGlvbiA9IChlbCkgPT4ge1xuICBjb25zdCBpblBhZ2VOYXZFbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke0lOX1BBR0VfTkFWX0NMQVNTfWApO1xuICBjb25zdCBpblBhZ2VOYXZTY3JvbGxPZmZzZXQgPVxuICAgIGluUGFnZU5hdkVsLmRhdGFzZXQuc2Nyb2xsT2Zmc2V0IHx8IElOX1BBR0VfTkFWX1NDUk9MTF9PRkZTRVQ7XG5cbiAgd2luZG93LnNjcm9sbCh7XG4gICAgYmVoYXZpb3I6IFwic21vb3RoXCIsXG4gICAgdG9wOiBlbC5vZmZzZXRUb3AgLSBpblBhZ2VOYXZTY3JvbGxPZmZzZXQsXG4gICAgYmxvY2s6IFwic3RhcnRcIixcbiAgfSk7XG59O1xuXG4vKipcbiAqIENyZWF0ZSB0aGUgaW4tcGFnZSBuYXZpZ2F0aW9uIGNvbXBvbmVudFxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGluUGFnZU5hdkVsIFRoZSBpbi1wYWdlIG5hdiBlbGVtZW50XG4gKi9cbmNvbnN0IGNyZWF0ZUluUGFnZU5hdiA9IChpblBhZ2VOYXZFbCkgPT4ge1xuICBjb25zdCBpblBhZ2VOYXZUaXRsZVRleHQgPSBTYW5pdGl6ZXIuZXNjYXBlSFRNTGAke1xuICAgIGluUGFnZU5hdkVsLmRhdGFzZXQudGl0bGVUZXh0IHx8IElOX1BBR0VfTkFWX1RJVExFX1RFWFRcbiAgfWA7XG4gIGNvbnN0IGluUGFnZU5hdlRpdGxlSGVhZGluZ0xldmVsID0gU2FuaXRpemVyLmVzY2FwZUhUTUxgJHtcbiAgICBpblBhZ2VOYXZFbC5kYXRhc2V0LnRpdGxlSGVhZGluZ0xldmVsIHx8IElOX1BBR0VfTkFWX1RJVExFX0hFQURJTkdfTEVWRUxcbiAgfWA7XG4gIGNvbnN0IGluUGFnZU5hdlJvb3RNYXJnaW4gPSBTYW5pdGl6ZXIuZXNjYXBlSFRNTGAke1xuICAgIGluUGFnZU5hdkVsLmRhdGFzZXQucm9vdE1hcmdpbiB8fCBJTl9QQUdFX05BVl9ST09UX01BUkdJTlxuICB9YDtcbiAgY29uc3QgaW5QYWdlTmF2VGhyZXNob2xkID0gU2FuaXRpemVyLmVzY2FwZUhUTUxgJHtcbiAgICBpblBhZ2VOYXZFbC5kYXRhc2V0LnRocmVzaG9sZCB8fCBJTl9QQUdFX05BVl9USFJFU0hPTERcbiAgfWA7XG5cbiAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICByb290OiBudWxsLFxuICAgIHJvb3RNYXJnaW46IGluUGFnZU5hdlJvb3RNYXJnaW4sXG4gICAgdGhyZXNob2xkOiBbaW5QYWdlTmF2VGhyZXNob2xkXSxcbiAgfTtcblxuICBjb25zdCBzZWN0aW9uSGVhZGluZ3MgPSBnZXRTZWN0aW9uSGVhZGluZ3MoKTtcbiAgY29uc3QgaW5QYWdlTmF2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIm5hdlwiKTtcbiAgaW5QYWdlTmF2LnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgaW5QYWdlTmF2VGl0bGVUZXh0KTtcbiAgaW5QYWdlTmF2LmNsYXNzTGlzdC5hZGQoSU5fUEFHRV9OQVZfTkFWX0NMQVNTKTtcblxuICBjb25zdCBpblBhZ2VOYXZUaXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoaW5QYWdlTmF2VGl0bGVIZWFkaW5nTGV2ZWwpO1xuICBpblBhZ2VOYXZUaXRsZS5jbGFzc0xpc3QuYWRkKElOX1BBR0VfTkFWX1RJVExFX0NMQVNTKTtcbiAgaW5QYWdlTmF2VGl0bGUuc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIiwgXCIwXCIpO1xuICBpblBhZ2VOYXZUaXRsZS50ZXh0Q29udGVudCA9IGluUGFnZU5hdlRpdGxlVGV4dDtcbiAgaW5QYWdlTmF2LmFwcGVuZENoaWxkKGluUGFnZU5hdlRpdGxlKTtcblxuICBjb25zdCBpblBhZ2VOYXZMaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInVsXCIpO1xuICBpblBhZ2VOYXZMaXN0LmNsYXNzTGlzdC5hZGQoSU5fUEFHRV9OQVZfTElTVF9DTEFTUyk7XG4gIGluUGFnZU5hdi5hcHBlbmRDaGlsZChpblBhZ2VOYXZMaXN0KTtcblxuICBzZWN0aW9uSGVhZGluZ3MuZm9yRWFjaCgoZWwsIGkpID0+IHtcbiAgICBjb25zdCBsaXN0SXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcbiAgICBjb25zdCBuYXZMaW5rcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuICAgIGNvbnN0IGFuY2hvclRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuICAgIGNvbnN0IHRleHRDb250ZW50T2ZMaW5rID0gZWwudGV4dENvbnRlbnQ7XG4gICAgY29uc3QgdGFnID0gZWwudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgbGlzdEl0ZW0uY2xhc3NMaXN0LmFkZChJTl9QQUdFX05BVl9JVEVNX0NMQVNTKTtcbiAgICBpZiAodGFnID09PSBcImgzXCIpIHtcbiAgICAgIGxpc3RJdGVtLmNsYXNzTGlzdC5hZGQoU1VCX0lURU1fQ0xBU1MpO1xuICAgIH1cblxuICAgIG5hdkxpbmtzLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgYCNzZWN0aW9uXyR7aX1gKTtcbiAgICBuYXZMaW5rcy5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBJTl9QQUdFX05BVl9MSU5LX0NMQVNTKTtcbiAgICBuYXZMaW5rcy50ZXh0Q29udGVudCA9IHRleHRDb250ZW50T2ZMaW5rO1xuXG4gICAgYW5jaG9yVGFnLnNldEF0dHJpYnV0ZShcImlkXCIsIGBzZWN0aW9uXyR7aX1gKTtcbiAgICBhbmNob3JUYWcuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgSU5fUEFHRV9OQVZfQU5DSE9SX0NMQVNTKTtcbiAgICBlbC5pbnNlcnRBZGphY2VudEVsZW1lbnQoXCJhZnRlcmJlZ2luXCIsIGFuY2hvclRhZyk7XG5cbiAgICBpblBhZ2VOYXZMaXN0LmFwcGVuZENoaWxkKGxpc3RJdGVtKTtcbiAgICBsaXN0SXRlbS5hcHBlbmRDaGlsZChuYXZMaW5rcyk7XG4gIH0pO1xuXG4gIGluUGFnZU5hdkVsLmFwcGVuZENoaWxkKGluUGFnZU5hdik7XG5cbiAgY29uc3QgYW5jaG9yVGFncyA9IGdldFNlY3Rpb25BbmNob3JzKCk7XG4gIGNvbnN0IG9ic2VydmVTZWN0aW9ucyA9IG5ldyB3aW5kb3cuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIoc2V0QWN0aXZlLCBvcHRpb25zKTtcblxuICBhbmNob3JUYWdzLmZvckVhY2goKHRhZykgPT4ge1xuICAgIG9ic2VydmVTZWN0aW9ucy5vYnNlcnZlKHRhZyk7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBIYW5kbGUgY2xpY2sgZnJvbSBsaW5rXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgQW4gZWxlbWVudCB3aXRoaW4gdGhlIGluLXBhZ2UgbmF2IGNvbXBvbmVudFxuICovXG5jb25zdCBoYW5kbGVDbGlja0Zyb21MaW5rID0gKGVsKSA9PiB7XG4gIGNvbnN0IGVsZW1lbnRUb1Njcm9sbFRvID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihlbC5oYXNoKTtcbiAgaGFuZGxlU2Nyb2xsVG9TZWN0aW9uKGVsZW1lbnRUb1Njcm9sbFRvKTtcbn07XG5cbi8qKlxuICogSGFuZGxlIHRoZSBlbnRlciBldmVudCBmcm9tIGEgbGluayB3aXRoaW4gdGhlIGluLXBhZ2UgbmF2IGNvbXBvbmVudFxuICpcbiAqIEBwYXJhbSB7S2V5Ym9hcmRFdmVudH0gZXZlbnQgQW4gZXZlbnQgd2l0aGluIHRoZSBpbi1wYWdlIG5hdiBjb21wb25lbnRcbiAqL1xuY29uc3QgaGFuZGxlRW50ZXJGcm9tTGluayA9IChldmVudCkgPT4ge1xuICBjb25zdCBpZCA9IGdldFNlY3Rpb25JZChldmVudCk7XG4gIGNvbnN0IHRhcmdldEFuY2hvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgY29uc3QgdGFyZ2V0ID0gdGFyZ2V0QW5jaG9yLnBhcmVudEVsZW1lbnQ7XG5cbiAgaWYgKHRhcmdldCkge1xuICAgIHRhcmdldC5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCAwKTtcbiAgICB0YXJnZXQuZm9jdXMoKTtcbiAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgIFwiYmx1clwiLFxuICAgICAgb25jZSgoKSA9PiB7XG4gICAgICAgIHRhcmdldC5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCAtMSk7XG4gICAgICB9KVxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgLy8gdGhyb3cgYW4gZXJyb3I/XG4gIH1cbiAgaGFuZGxlU2Nyb2xsVG9TZWN0aW9uKHRhcmdldCk7XG59O1xuXG5jb25zdCBpblBhZ2VOYXZpZ2F0aW9uID0gYmVoYXZpb3IoXG4gIHtcbiAgICBbQ0xJQ0tdOiB7XG4gICAgICBbYC4ke0lOX1BBR0VfTkFWX0xJTktfQ0xBU1N9YF0oZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgaWYgKHRoaXMuZGlzYWJsZWQpIHJldHVybjtcbiAgICAgICAgaGFuZGxlQ2xpY2tGcm9tTGluayh0aGlzKTtcbiAgICAgIH0sXG4gICAgfSxcbiAgICBrZXlkb3duOiB7XG4gICAgICBbYC4ke0lOX1BBR0VfTkFWX0xJTktfQ0xBU1N9YF06IGtleW1hcCh7XG4gICAgICAgIEVudGVyOiBoYW5kbGVFbnRlckZyb21MaW5rLFxuICAgICAgfSksXG4gICAgfSxcbiAgfSxcbiAge1xuICAgIGluaXQocm9vdCkge1xuICAgICAgc2VsZWN0T3JNYXRjaGVzKGAuJHtJTl9QQUdFX05BVl9DTEFTU31gLCByb290KS5mb3JFYWNoKChpblBhZ2VOYXZFbCkgPT4ge1xuICAgICAgICBjcmVhdGVJblBhZ2VOYXYoaW5QYWdlTmF2RWwpO1xuICAgICAgfSk7XG4gICAgfSxcbiAgfVxuKTtcblxubW9kdWxlLmV4cG9ydHMgPSBpblBhZ2VOYXZpZ2F0aW9uO1xuIiwiY29uc3Qgc2VsZWN0T3JNYXRjaGVzID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3NlbGVjdC1vci1tYXRjaGVzXCIpO1xuY29uc3QgYmVoYXZpb3IgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvYmVoYXZpb3JcIik7XG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvY29uZmlnXCIpO1xuXG5jb25zdCBNQVNLRURfQ0xBU1MgPSBgJHtQUkVGSVh9LW1hc2tlZGA7XG5jb25zdCBNQVNLRUQgPSBgLiR7TUFTS0VEX0NMQVNTfWA7XG5jb25zdCBNQVNLID0gYCR7UFJFRklYfS1pbnB1dC1tYXNrYDtcbmNvbnN0IE1BU0tfQ09OVEVOVCA9IGAke01BU0t9LS1jb250ZW50YDtcbmNvbnN0IFBMQUNFSE9MREVSID0gXCJwbGFjZWhvbGRlclwiO1xuY29uc3QgQ09OVEVYVCA9IFwiZm9ybVwiO1xuXG4vLyBVc2VyIGRlZmluZWQgVmFsdWVzXG5jb25zdCBtYXNrZWROdW1iZXIgPSBcIl8jZERtTXlZOVwiO1xuY29uc3QgbWFza2VkTGV0dGVyID0gXCJBXCI7XG5cbi8vIHJlcGxhY2VzIGVhY2ggbWFza2VkIGlucHV0IHdpdGggYSBzaGVsbCBjb250YWluaW5nIHRoZSBpbnB1dCBhbmQgaXQncyBtYXNrLlxuY29uc3QgY3JlYXRlTWFza2VkSW5wdXRTaGVsbCA9IChpbnB1dCkgPT4ge1xuICBjb25zdCBwbGFjZWhvbGRlciA9IGlucHV0LmdldEF0dHJpYnV0ZShgJHtQTEFDRUhPTERFUn1gKTtcbiAgaWYgKHBsYWNlaG9sZGVyKSB7XG4gICAgaW5wdXQuc2V0QXR0cmlidXRlKFwibWF4bGVuZ3RoXCIsIHBsYWNlaG9sZGVyLmxlbmd0aCk7XG4gICAgaW5wdXQuc2V0QXR0cmlidXRlKFwiZGF0YS1wbGFjZWhvbGRlclwiLCBwbGFjZWhvbGRlcik7XG4gICAgaW5wdXQucmVtb3ZlQXR0cmlidXRlKGAke1BMQUNFSE9MREVSfWApO1xuICB9IGVsc2Uge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHNoZWxsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gIHNoZWxsLmNsYXNzTGlzdC5hZGQoTUFTSyk7XG4gIHNoZWxsLnNldEF0dHJpYnV0ZShcImRhdGEtbWFza1wiLCBwbGFjZWhvbGRlcik7XG5cbiAgY29uc3QgY29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICBjb250ZW50LmNsYXNzTGlzdC5hZGQoTUFTS19DT05URU5UKTtcbiAgY29udGVudC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWhpZGRlblwiLCBcInRydWVcIik7XG4gIGNvbnRlbnQuaWQgPSBgJHtpbnB1dC5pZH1NYXNrYDtcbiAgY29udGVudC50ZXh0Q29udGVudCA9IHBsYWNlaG9sZGVyO1xuXG4gIHNoZWxsLmFwcGVuZENoaWxkKGNvbnRlbnQpO1xuICBpbnB1dC5jbG9zZXN0KENPTlRFWFQpLmluc2VydEJlZm9yZShzaGVsbCwgaW5wdXQpO1xuICBzaGVsbC5hcHBlbmRDaGlsZChpbnB1dCk7XG59O1xuXG5jb25zdCBzZXRWYWx1ZU9mTWFzayA9IChlbCkgPT4ge1xuICBjb25zdCB7IHZhbHVlIH0gPSBlbDtcbiAgY29uc3QgcGxhY2Vob2xkZXJWYWwgPSBgJHtlbC5kYXRhc2V0LnBsYWNlaG9sZGVyLnN1YnN0cih2YWx1ZS5sZW5ndGgpfWA7XG5cbiAgY29uc3QgdGhlSUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlcIik7XG4gIHRoZUlFbC50ZXh0Q29udGVudCA9IHZhbHVlO1xuICByZXR1cm4gW3RoZUlFbCwgcGxhY2Vob2xkZXJWYWxdO1xufTtcblxuY29uc3Qgc3RyaXBwZWRWYWx1ZSA9IChpc0NoYXJzZXRQcmVzZW50LCB2YWx1ZSkgPT5cbiAgaXNDaGFyc2V0UHJlc2VudCA/IHZhbHVlLnJlcGxhY2UoL1xcVy9nLCBcIlwiKSA6IHZhbHVlLnJlcGxhY2UoL1xcRC9nLCBcIlwiKTtcblxuY29uc3QgaXNJbnRlZ2VyID0gKHZhbHVlKSA9PiAhTnVtYmVyLmlzTmFOKHBhcnNlSW50KHZhbHVlLCAxMCkpO1xuXG5jb25zdCBpc0xldHRlciA9ICh2YWx1ZSkgPT4gKHZhbHVlID8gdmFsdWUubWF0Y2goL1tBLVpdL2kpIDogZmFsc2UpO1xuXG5jb25zdCBoYW5kbGVDdXJyZW50VmFsdWUgPSAoZWwpID0+IHtcbiAgY29uc3QgaXNDaGFyc2V0UHJlc2VudCA9IGVsLmRhdGFzZXQuY2hhcnNldDtcbiAgY29uc3QgcGxhY2Vob2xkZXIgPSBpc0NoYXJzZXRQcmVzZW50IHx8IGVsLmRhdGFzZXQucGxhY2Vob2xkZXI7XG4gIGNvbnN0IHsgdmFsdWUgfSA9IGVsO1xuICBjb25zdCBsZW4gPSBwbGFjZWhvbGRlci5sZW5ndGg7XG4gIGxldCBuZXdWYWx1ZSA9IFwiXCI7XG4gIGxldCBpO1xuICBsZXQgY2hhckluZGV4O1xuXG4gIGNvbnN0IHN0cmlwcGVkVmFsID0gc3RyaXBwZWRWYWx1ZShpc0NoYXJzZXRQcmVzZW50LCB2YWx1ZSk7XG5cbiAgZm9yIChpID0gMCwgY2hhckluZGV4ID0gMDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgY29uc3QgaXNJbnQgPSBpc0ludGVnZXIoc3RyaXBwZWRWYWxbY2hhckluZGV4XSk7XG4gICAgY29uc3QgaXNMZXQgPSBpc0xldHRlcihzdHJpcHBlZFZhbFtjaGFySW5kZXhdKTtcbiAgICBjb25zdCBtYXRjaGVzTnVtYmVyID0gbWFza2VkTnVtYmVyLmluZGV4T2YocGxhY2Vob2xkZXJbaV0pID49IDA7XG4gICAgY29uc3QgbWF0Y2hlc0xldHRlciA9IG1hc2tlZExldHRlci5pbmRleE9mKHBsYWNlaG9sZGVyW2ldKSA+PSAwO1xuXG4gICAgaWYgKFxuICAgICAgKG1hdGNoZXNOdW1iZXIgJiYgaXNJbnQpIHx8XG4gICAgICAoaXNDaGFyc2V0UHJlc2VudCAmJiBtYXRjaGVzTGV0dGVyICYmIGlzTGV0KVxuICAgICkge1xuICAgICAgbmV3VmFsdWUgKz0gc3RyaXBwZWRWYWxbY2hhckluZGV4XTtcbiAgICAgIGNoYXJJbmRleCArPSAxO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICAoIWlzQ2hhcnNldFByZXNlbnQgJiYgIWlzSW50ICYmIG1hdGNoZXNOdW1iZXIpIHx8XG4gICAgICAoaXNDaGFyc2V0UHJlc2VudCAmJlxuICAgICAgICAoKG1hdGNoZXNMZXR0ZXIgJiYgIWlzTGV0KSB8fCAobWF0Y2hlc051bWJlciAmJiAhaXNJbnQpKSlcbiAgICApIHtcbiAgICAgIHJldHVybiBuZXdWYWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3VmFsdWUgKz0gcGxhY2Vob2xkZXJbaV07XG4gICAgfVxuICAgIC8vIGJyZWFrIGlmIG5vIGNoYXJhY3RlcnMgbGVmdCBhbmQgdGhlIHBhdHRlcm4gaXMgbm9uLXNwZWNpYWwgY2hhcmFjdGVyXG4gICAgaWYgKHN0cmlwcGVkVmFsW2NoYXJJbmRleF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5ld1ZhbHVlO1xufTtcblxuY29uc3QgaGFuZGxlVmFsdWVDaGFuZ2UgPSAoZWwpID0+IHtcbiAgY29uc3QgaW5wdXRFbCA9IGVsO1xuICBjb25zdCBpZCA9IGlucHV0RWwuZ2V0QXR0cmlidXRlKFwiaWRcIik7XG4gIGlucHV0RWwudmFsdWUgPSBoYW5kbGVDdXJyZW50VmFsdWUoaW5wdXRFbCk7XG5cbiAgY29uc3QgbWFza1ZhbCA9IHNldFZhbHVlT2ZNYXNrKGVsKTtcbiAgY29uc3QgbWFza0VsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYCR7aWR9TWFza2ApO1xuICBtYXNrRWwudGV4dENvbnRlbnQgPSBcIlwiO1xuICBtYXNrRWwucmVwbGFjZUNoaWxkcmVuKG1hc2tWYWxbMF0sIG1hc2tWYWxbMV0pO1xufTtcblxuY29uc3QgaW5wdXRNYXNrRXZlbnRzID0ge1xuICBrZXl1cDoge1xuICAgIFtNQVNLRURdKCkge1xuICAgICAgaGFuZGxlVmFsdWVDaGFuZ2UodGhpcyk7XG4gICAgfSxcbiAgfSxcbn07XG5cbmNvbnN0IGlucHV0TWFzayA9IGJlaGF2aW9yKGlucHV0TWFza0V2ZW50cywge1xuICBpbml0KHJvb3QpIHtcbiAgICBzZWxlY3RPck1hdGNoZXMoTUFTS0VELCByb290KS5mb3JFYWNoKChtYXNrZWRJbnB1dCkgPT4ge1xuICAgICAgY3JlYXRlTWFza2VkSW5wdXRTaGVsbChtYXNrZWRJbnB1dCk7XG4gICAgfSk7XG4gIH0sXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBpbnB1dE1hc2s7XG4iLCJjb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcbmNvbnN0IHNlbGVjdCA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3RcIik7XG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvY29uZmlnXCIpO1xuY29uc3QgeyBDTElDSyB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2V2ZW50c1wiKTtcblxuY29uc3QgQ09OVEFJTkVSID0gYC4ke1BSRUZJWH0taW5wdXQtZ3JvdXBgO1xuY29uc3QgSU5QVVQgPSBgJHtDT05UQUlORVJ9IC4ke1BSRUZJWH0taW5wdXRgO1xuY29uc3QgREVDT1JBVElPTiA9IGAke0NPTlRBSU5FUn0gLiR7UFJFRklYfS1pbnB1dC1wcmVmaXgsICR7Q09OVEFJTkVSfSAuJHtQUkVGSVh9LWlucHV0LXN1ZmZpeGA7XG5jb25zdCBGT0NVU19DTEFTUyA9IFwiaXMtZm9jdXNlZFwiO1xuXG5mdW5jdGlvbiBzZXRGb2N1cyhlbCkge1xuICBlbC5jbG9zZXN0KENPTlRBSU5FUikucXVlcnlTZWxlY3RvcihgLiR7UFJFRklYfS1pbnB1dGApLmZvY3VzKCk7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZUZvY3VzKCkge1xuICB0aGlzLmNsb3Nlc3QoQ09OVEFJTkVSKS5jbGFzc0xpc3QuYWRkKEZPQ1VTX0NMQVNTKTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlQmx1cigpIHtcbiAgdGhpcy5jbG9zZXN0KENPTlRBSU5FUikuY2xhc3NMaXN0LnJlbW92ZShGT0NVU19DTEFTUyk7XG59XG5cbmNvbnN0IGlucHV0UHJlZml4U3VmZml4ID0gYmVoYXZpb3IoXG4gIHtcbiAgICBbQ0xJQ0tdOiB7XG4gICAgICBbREVDT1JBVElPTl0oKSB7XG4gICAgICAgIHNldEZvY3VzKHRoaXMpO1xuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICB7XG4gICAgaW5pdChyb290KSB7XG4gICAgICBzZWxlY3QoSU5QVVQsIHJvb3QpLmZvckVhY2goKGlucHV0RWwpID0+IHtcbiAgICAgICAgaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKFwiZm9jdXNcIiwgaGFuZGxlRm9jdXMsIGZhbHNlKTtcbiAgICAgICAgaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCBoYW5kbGVCbHVyLCBmYWxzZSk7XG4gICAgICB9KTtcbiAgICB9LFxuICB9XG4pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGlucHV0UHJlZml4U3VmZml4O1xuIiwiY29uc3Qga2V5bWFwID0gcmVxdWlyZShcInJlY2VwdG9yL2tleW1hcFwiKTtcbmNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xuY29uc3QgdG9nZ2xlID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3RvZ2dsZVwiKTtcbmNvbnN0IEZvY3VzVHJhcCA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9mb2N1cy10cmFwXCIpO1xuY29uc3QgYWNjb3JkaW9uID0gcmVxdWlyZShcIi4uLy4uL3VzYS1hY2NvcmRpb24vc3JjL2luZGV4XCIpO1xuXG5jb25zdCB7IENMSUNLIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvZXZlbnRzXCIpO1xuY29uc3QgeyBwcmVmaXg6IFBSRUZJWCB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2NvbmZpZ1wiKTtcblxuY29uc3QgQk9EWSA9IFwiYm9keVwiO1xuY29uc3QgTEFOR1VBR0UgPSBgLiR7UFJFRklYfS1sYW5ndWFnZWA7XG5jb25zdCBMQU5HVUFHRV9TVUIgPSBgLiR7UFJFRklYfS1sYW5ndWFnZV9fc3VibWVudWA7XG5jb25zdCBMQU5HVUFHRV9QUklNQVJZID0gYC4ke1BSRUZJWH0tbGFuZ3VhZ2VfX3ByaW1hcnlgO1xuY29uc3QgTEFOR1VBR0VfUFJJTUFSWV9JVEVNID0gYC4ke1BSRUZJWH0tbGFuZ3VhZ2VfX3ByaW1hcnktaXRlbWA7XG5jb25zdCBMQU5HVUFHRV9DT05UUk9MID0gYGJ1dHRvbi4ke1BSRUZJWH0tbGFuZ3VhZ2VfX2xpbmtgO1xuY29uc3QgTEFOR1VBR0VfTElOS1MgPSBgJHtMQU5HVUFHRX0gYWA7XG5cbmxldCBsYW5ndWFnZVNlbGVjdG9yO1xubGV0IGxhbmd1YWdlQWN0aXZlO1xuXG5jb25zdCBvbkxhbmd1YWdlQ2xvc2UgPSAoKSA9PlxuICBsYW5ndWFnZVNlbGVjdG9yLnRvZ2dsZUxhbmd1YWdlLmNhbGwobGFuZ3VhZ2VTZWxlY3RvciwgZmFsc2UpO1xuXG5jb25zdCBoaWRlQWN0aXZlTGFuZ3VhZ2VEcm9wZG93biA9ICgpID0+IHtcbiAgaWYgKCFsYW5ndWFnZUFjdGl2ZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRvZ2dsZShsYW5ndWFnZUFjdGl2ZSwgZmFsc2UpO1xuICBsYW5ndWFnZUFjdGl2ZSA9IG51bGw7XG59O1xuXG5jb25zdCBmb2N1c0xhbmd1YWdlQnV0dG9uID0gKGV2ZW50KSA9PiB7XG4gIGNvbnN0IHBhcmVudExhbmd1YWdlSXRlbSA9IGV2ZW50LnRhcmdldC5jbG9zZXN0KExBTkdVQUdFX1BSSU1BUllfSVRFTSk7XG5cbiAgaWYgKCFldmVudC50YXJnZXQubWF0Y2hlcyhMQU5HVUFHRV9DT05UUk9MKSkge1xuICAgIHBhcmVudExhbmd1YWdlSXRlbS5xdWVyeVNlbGVjdG9yKExBTkdVQUdFX0NPTlRST0wpLmZvY3VzKCk7XG4gIH1cbn07XG5cbmNvbnN0IGhhbmRsZUVzY2FwZSA9IChldmVudCkgPT4ge1xuICBoaWRlQWN0aXZlTGFuZ3VhZ2VEcm9wZG93bigpO1xuICBmb2N1c0xhbmd1YWdlQnV0dG9uKGV2ZW50KTtcbn07XG5cbmxhbmd1YWdlU2VsZWN0b3IgPSBiZWhhdmlvcihcbiAge1xuICAgIFtDTElDS106IHtcbiAgICAgIFtMQU5HVUFHRV9DT05UUk9MXSgpIHtcbiAgICAgICAgaWYgKGxhbmd1YWdlQWN0aXZlICE9PSB0aGlzKSB7XG4gICAgICAgICAgaGlkZUFjdGl2ZUxhbmd1YWdlRHJvcGRvd24oKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGFuZ3VhZ2VBY3RpdmUgPT09IHRoaXMpIHtcbiAgICAgICAgICBoaWRlQWN0aXZlTGFuZ3VhZ2VEcm9wZG93bigpO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWxhbmd1YWdlQWN0aXZlKSB7XG4gICAgICAgICAgbGFuZ3VhZ2VBY3RpdmUgPSB0aGlzO1xuICAgICAgICAgIHRvZ2dsZShsYW5ndWFnZUFjdGl2ZSwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9LFxuICAgICAgW0JPRFldOiBoaWRlQWN0aXZlTGFuZ3VhZ2VEcm9wZG93bixcbiAgICAgIFtMQU5HVUFHRV9MSU5LU10oKSB7XG4gICAgICAgIGNvbnN0IGFjYyA9IHRoaXMuY2xvc2VzdChhY2NvcmRpb24uQUNDT1JESU9OKTtcblxuICAgICAgICBpZiAoYWNjKSB7XG4gICAgICAgICAgYWNjb3JkaW9uLmdldEJ1dHRvbnMoYWNjKS5mb3JFYWNoKChidG4pID0+IGFjY29yZGlvbi5oaWRlKGJ0bikpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0sXG4gICAga2V5ZG93bjoge1xuICAgICAgW0xBTkdVQUdFX1BSSU1BUlldOiBrZXltYXAoeyBFc2NhcGU6IGhhbmRsZUVzY2FwZSB9KSxcbiAgICB9LFxuICAgIGZvY3Vzb3V0OiB7XG4gICAgICBbTEFOR1VBR0VfUFJJTUFSWV0oZXZlbnQpIHtcbiAgICAgICAgY29uc3QgbGFuZ3VhZ2UgPSBldmVudC50YXJnZXQuY2xvc2VzdChMQU5HVUFHRV9QUklNQVJZKTtcblxuICAgICAgICBpZiAoIWxhbmd1YWdlLmNvbnRhaW5zKGV2ZW50LnJlbGF0ZWRUYXJnZXQpKSB7XG4gICAgICAgICAgaGlkZUFjdGl2ZUxhbmd1YWdlRHJvcGRvd24oKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICB7XG4gICAgaW5pdChyb290KSB7XG4gICAgICBjb25zdCB0cmFwQ29udGFpbmVyID0gcm9vdC5tYXRjaGVzKExBTkdVQUdFX1NVQilcbiAgICAgICAgPyByb290XG4gICAgICAgIDogcm9vdC5xdWVyeVNlbGVjdG9yKExBTkdVQUdFX1NVQik7XG5cbiAgICAgIGlmICh0cmFwQ29udGFpbmVyKSB7XG4gICAgICAgIGxhbmd1YWdlU2VsZWN0b3IuZm9jdXNUcmFwID0gRm9jdXNUcmFwKHRyYXBDb250YWluZXIsIHtcbiAgICAgICAgICBFc2NhcGU6IG9uTGFuZ3VhZ2VDbG9zZSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSxcbiAgICB0ZWFyZG93bigpIHtcbiAgICAgIGxhbmd1YWdlQWN0aXZlID0gZmFsc2U7XG4gICAgfSxcbiAgICBmb2N1c1RyYXA6IG51bGwsXG4gIH1cbik7XG5cbm1vZHVsZS5leHBvcnRzID0gbGFuZ3VhZ2VTZWxlY3RvcjtcbiIsImNvbnN0IHNlbGVjdE9yTWF0Y2hlcyA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3Qtb3ItbWF0Y2hlc1wiKTtcbmNvbnN0IEZvY3VzVHJhcCA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9mb2N1cy10cmFwXCIpO1xuY29uc3QgU2Nyb2xsQmFyV2lkdGggPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2Nyb2xsYmFyLXdpZHRoXCIpO1xuXG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvY29uZmlnXCIpO1xuXG5jb25zdCBNT0RBTF9DTEFTU05BTUUgPSBgJHtQUkVGSVh9LW1vZGFsYDtcbmNvbnN0IE9WRVJMQVlfQ0xBU1NOQU1FID0gYCR7TU9EQUxfQ0xBU1NOQU1FfS1vdmVybGF5YDtcbmNvbnN0IFdSQVBQRVJfQ0xBU1NOQU1FID0gYCR7TU9EQUxfQ0xBU1NOQU1FfS13cmFwcGVyYDtcbmNvbnN0IE9QRU5FUl9BVFRSSUJVVEUgPSBcImRhdGEtb3Blbi1tb2RhbFwiO1xuY29uc3QgQ0xPU0VSX0FUVFJJQlVURSA9IFwiZGF0YS1jbG9zZS1tb2RhbFwiO1xuY29uc3QgRk9SQ0VfQUNUSU9OX0FUVFJJQlVURSA9IFwiZGF0YS1mb3JjZS1hY3Rpb25cIjtcbmNvbnN0IE5PTl9NT0RBTF9ISURERU5fQVRUUklCVVRFID0gYGRhdGEtbW9kYWwtaGlkZGVuYDtcbmNvbnN0IE1PREFMID0gYC4ke01PREFMX0NMQVNTTkFNRX1gO1xuY29uc3QgSU5JVElBTF9GT0NVUyA9IGAuJHtXUkFQUEVSX0NMQVNTTkFNRX0gKltkYXRhLWZvY3VzXWA7XG5jb25zdCBDTE9TRV9CVVRUT04gPSBgJHtXUkFQUEVSX0NMQVNTTkFNRX0gKlske0NMT1NFUl9BVFRSSUJVVEV9XWA7XG5jb25zdCBPUEVORVJTID0gYCpbJHtPUEVORVJfQVRUUklCVVRFfV1bYXJpYS1jb250cm9sc11gO1xuY29uc3QgQ0xPU0VSUyA9IGAke0NMT1NFX0JVVFRPTn0sIC4ke09WRVJMQVlfQ0xBU1NOQU1FfTpub3QoWyR7Rk9SQ0VfQUNUSU9OX0FUVFJJQlVURX1dKWA7XG5jb25zdCBOT05fTU9EQUxTID0gYGJvZHkgPiAqOm5vdCguJHtXUkFQUEVSX0NMQVNTTkFNRX0pOm5vdChbYXJpYS1oaWRkZW5dKWA7XG5jb25zdCBOT05fTU9EQUxTX0hJRERFTiA9IGBbJHtOT05fTU9EQUxfSElEREVOX0FUVFJJQlVURX1dYDtcblxuY29uc3QgQUNUSVZFX0NMQVNTID0gXCJ1c2EtanMtbW9kYWwtLWFjdGl2ZVwiO1xuY29uc3QgUFJFVkVOVF9DTElDS19DTEFTUyA9IFwidXNhLWpzLW5vLWNsaWNrXCI7XG5jb25zdCBWSVNJQkxFX0NMQVNTID0gXCJpcy12aXNpYmxlXCI7XG5jb25zdCBISURERU5fQ0xBU1MgPSBcImlzLWhpZGRlblwiO1xuXG5sZXQgbW9kYWw7XG5cbmNvbnN0IGlzQWN0aXZlID0gKCkgPT4gZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuY29udGFpbnMoQUNUSVZFX0NMQVNTKTtcbmNvbnN0IFNDUk9MTEJBUl9XSURUSCA9IFNjcm9sbEJhcldpZHRoKCk7XG5jb25zdCBJTklUSUFMX1BBRERJTkcgPSB3aW5kb3dcbiAgLmdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQuYm9keSlcbiAgLmdldFByb3BlcnR5VmFsdWUoXCJwYWRkaW5nLXJpZ2h0XCIpO1xuY29uc3QgVEVNUE9SQVJZX1BBRERJTkcgPSBgJHtcbiAgcGFyc2VJbnQoSU5JVElBTF9QQURESU5HLnJlcGxhY2UoL3B4LywgXCJcIiksIDEwKSArXG4gIHBhcnNlSW50KFNDUk9MTEJBUl9XSURUSC5yZXBsYWNlKC9weC8sIFwiXCIpLCAxMClcbn1weGA7XG5cbi8qKlxuICogIElzIGJvdW5kIHRvIGVzY2FwZSBrZXksIGNsb3NlcyBtb2RhbCB3aGVuXG4gKi9cbmNvbnN0IG9uTWVudUNsb3NlID0gKCkgPT4ge1xuICBtb2RhbC50b2dnbGVNb2RhbC5jYWxsKG1vZGFsLCBmYWxzZSk7XG59O1xuXG4vKipcbiAqICBUb2dnbGUgdGhlIHZpc2liaWxpdHkgb2YgYSBtb2RhbCB3aW5kb3dcbiAqXG4gKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGV2ZW50IHRoZSBrZXlkb3duIGV2ZW50XG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gc2FmZUFjdGl2ZSBpZiBtb2JpbGUgaXMgb3BlblxuICovXG5mdW5jdGlvbiB0b2dnbGVNb2RhbChldmVudCkge1xuICBsZXQgb3JpZ2luYWxPcGVuZXI7XG4gIGxldCBjbGlja2VkRWxlbWVudCA9IGV2ZW50LnRhcmdldDtcbiAgY29uc3QgeyBib2R5IH0gPSBkb2N1bWVudDtcbiAgY29uc3Qgc2FmZUFjdGl2ZSA9ICFpc0FjdGl2ZSgpO1xuICBjb25zdCBtb2RhbElkID0gY2xpY2tlZEVsZW1lbnRcbiAgICA/IGNsaWNrZWRFbGVtZW50LmdldEF0dHJpYnV0ZShcImFyaWEtY29udHJvbHNcIilcbiAgICA6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIudXNhLW1vZGFsLXdyYXBwZXIuaXMtdmlzaWJsZVwiKTtcbiAgY29uc3QgdGFyZ2V0TW9kYWwgPSBzYWZlQWN0aXZlXG4gICAgPyBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChtb2RhbElkKVxuICAgIDogZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi51c2EtbW9kYWwtd3JhcHBlci5pcy12aXNpYmxlXCIpO1xuXG4gIC8vIGlmIHRoZXJlIGlzIG5vIG1vZGFsIHdlIHJldHVybiBlYXJseVxuICBpZiAoIXRhcmdldE1vZGFsKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgY29uc3Qgb3BlbkZvY3VzRWwgPSB0YXJnZXRNb2RhbC5xdWVyeVNlbGVjdG9yKElOSVRJQUxfRk9DVVMpXG4gICAgPyB0YXJnZXRNb2RhbC5xdWVyeVNlbGVjdG9yKElOSVRJQUxfRk9DVVMpXG4gICAgOiB0YXJnZXRNb2RhbC5xdWVyeVNlbGVjdG9yKFwiLnVzYS1tb2RhbFwiKTtcbiAgY29uc3QgcmV0dXJuRm9jdXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcbiAgICB0YXJnZXRNb2RhbC5nZXRBdHRyaWJ1dGUoXCJkYXRhLW9wZW5lclwiKVxuICApO1xuICBjb25zdCBtZW51QnV0dG9uID0gYm9keS5xdWVyeVNlbGVjdG9yKE9QRU5FUlMpO1xuICBjb25zdCBmb3JjZVVzZXJBY3Rpb24gPSB0YXJnZXRNb2RhbC5nZXRBdHRyaWJ1dGUoRk9SQ0VfQUNUSU9OX0FUVFJJQlVURSk7XG5cbiAgLy8gU2V0cyB0aGUgY2xpY2tlZCBlbGVtZW50IHRvIHRoZSBjbG9zZSBidXR0b25cbiAgLy8gc28gZXNjIGtleSBhbHdheXMgY2xvc2VzIG1vZGFsXG4gIGlmIChldmVudC50eXBlID09PSBcImtleWRvd25cIiAmJiB0YXJnZXRNb2RhbCAhPT0gbnVsbCkge1xuICAgIGNsaWNrZWRFbGVtZW50ID0gdGFyZ2V0TW9kYWwucXVlcnlTZWxlY3RvcihDTE9TRV9CVVRUT04pO1xuICB9XG5cbiAgLy8gV2hlbiB3ZSdyZSBub3QgaGl0dGluZyB0aGUgZXNjYXBlIGtleeKAplxuICBpZiAoY2xpY2tlZEVsZW1lbnQpIHtcbiAgICAvLyBNYWtlIHN1cmUgd2UgY2xpY2sgdGhlIG9wZW5lclxuICAgIC8vIElmIGl0IGRvZXNuJ3QgaGF2ZSBhbiBJRCwgbWFrZSBvbmVcbiAgICAvLyBTdG9yZSBpZCBhcyBkYXRhIGF0dHJpYnV0ZSBvbiBtb2RhbFxuICAgIGlmIChjbGlja2VkRWxlbWVudC5oYXNBdHRyaWJ1dGUoT1BFTkVSX0FUVFJJQlVURSkpIHtcbiAgICAgIGlmICh0aGlzLmdldEF0dHJpYnV0ZShcImlkXCIpID09PSBudWxsKSB7XG4gICAgICAgIG9yaWdpbmFsT3BlbmVyID0gYG1vZGFsLSR7TWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogOTAwMDAwKSArIDEwMDAwMH1gO1xuICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShcImlkXCIsIG9yaWdpbmFsT3BlbmVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9yaWdpbmFsT3BlbmVyID0gdGhpcy5nZXRBdHRyaWJ1dGUoXCJpZFwiKTtcbiAgICAgIH1cbiAgICAgIHRhcmdldE1vZGFsLnNldEF0dHJpYnV0ZShcImRhdGEtb3BlbmVyXCIsIG9yaWdpbmFsT3BlbmVyKTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIGJhc2ljYWxseSBzdG9wcyB0aGUgcHJvcGFnYXRpb24gaWYgdGhlIGVsZW1lbnRcbiAgICAvLyBpcyBpbnNpZGUgdGhlIG1vZGFsIGFuZCBub3QgYSBjbG9zZSBidXR0b24gb3JcbiAgICAvLyBlbGVtZW50IGluc2lkZSBhIGNsb3NlIGJ1dHRvblxuICAgIGlmIChjbGlja2VkRWxlbWVudC5jbG9zZXN0KGAuJHtNT0RBTF9DTEFTU05BTUV9YCkpIHtcbiAgICAgIGlmIChcbiAgICAgICAgY2xpY2tlZEVsZW1lbnQuaGFzQXR0cmlidXRlKENMT1NFUl9BVFRSSUJVVEUpIHx8XG4gICAgICAgIGNsaWNrZWRFbGVtZW50LmNsb3Nlc3QoYFske0NMT1NFUl9BVFRSSUJVVEV9XWApXG4gICAgICApIHtcbiAgICAgICAgLy8gZG8gbm90aGluZy4gbW92ZSBvbi5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYm9keS5jbGFzc0xpc3QudG9nZ2xlKEFDVElWRV9DTEFTUywgc2FmZUFjdGl2ZSk7XG4gIHRhcmdldE1vZGFsLmNsYXNzTGlzdC50b2dnbGUoVklTSUJMRV9DTEFTUywgc2FmZUFjdGl2ZSk7XG4gIHRhcmdldE1vZGFsLmNsYXNzTGlzdC50b2dnbGUoSElEREVOX0NMQVNTLCAhc2FmZUFjdGl2ZSk7XG5cbiAgLy8gSWYgdXNlciBpcyBmb3JjZWQgdG8gdGFrZSBhbiBhY3Rpb24sIGFkZGluZ1xuICAvLyBhIGNsYXNzIHRvIHRoZSBib2R5IHRoYXQgcHJldmVudHMgY2xpY2tpbmcgdW5kZXJuZWF0aFxuICAvLyBvdmVybGF5XG4gIGlmIChmb3JjZVVzZXJBY3Rpb24pIHtcbiAgICBib2R5LmNsYXNzTGlzdC50b2dnbGUoUFJFVkVOVF9DTElDS19DTEFTUywgc2FmZUFjdGl2ZSk7XG4gIH1cblxuICAvLyBBY2NvdW50IGZvciBjb250ZW50IHNoaWZ0aW5nIGZyb20gYm9keSBvdmVyZmxvdzogaGlkZGVuXG4gIC8vIFdlIG9ubHkgY2hlY2sgcGFkZGluZ1JpZ2h0IGluIGNhc2UgYXBwcyBhcmUgYWRkaW5nIG90aGVyIHByb3BlcnRpZXNcbiAgLy8gdG8gdGhlIGJvZHkgZWxlbWVudFxuICBib2R5LnN0eWxlLnBhZGRpbmdSaWdodCA9XG4gICAgYm9keS5zdHlsZS5wYWRkaW5nUmlnaHQgPT09IFRFTVBPUkFSWV9QQURESU5HXG4gICAgICA/IElOSVRJQUxfUEFERElOR1xuICAgICAgOiBURU1QT1JBUllfUEFERElORztcblxuICAvLyBIYW5kbGUgdGhlIGZvY3VzIGFjdGlvbnNcbiAgaWYgKHNhZmVBY3RpdmUgJiYgb3BlbkZvY3VzRWwpIHtcbiAgICAvLyBUaGUgbW9kYWwgd2luZG93IGlzIG9wZW5lZC4gRm9jdXMgaXMgc2V0IHRvIGNsb3NlIGJ1dHRvbi5cblxuICAgIC8vIEJpbmRzIGVzY2FwZSBrZXkgaWYgd2UncmUgbm90IGZvcmNpbmdcbiAgICAvLyB0aGUgdXNlciB0byB0YWtlIGFuIGFjdGlvblxuICAgIGlmIChmb3JjZVVzZXJBY3Rpb24pIHtcbiAgICAgIG1vZGFsLmZvY3VzVHJhcCA9IEZvY3VzVHJhcCh0YXJnZXRNb2RhbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1vZGFsLmZvY3VzVHJhcCA9IEZvY3VzVHJhcCh0YXJnZXRNb2RhbCwge1xuICAgICAgICBFc2NhcGU6IG9uTWVudUNsb3NlLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gSGFuZGxlcyBmb2N1cyBzZXR0aW5nIGFuZCBpbnRlcmFjdGlvbnNcbiAgICBtb2RhbC5mb2N1c1RyYXAudXBkYXRlKHNhZmVBY3RpdmUpO1xuICAgIG9wZW5Gb2N1c0VsLmZvY3VzKCk7XG5cbiAgICAvLyBIaWRlcyBldmVyeXRoaW5nIHRoYXQgaXMgbm90IHRoZSBtb2RhbCBmcm9tIHNjcmVlbiByZWFkZXJzXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChOT05fTU9EQUxTKS5mb3JFYWNoKChub25Nb2RhbCkgPT4ge1xuICAgICAgbm9uTW9kYWwuc2V0QXR0cmlidXRlKFwiYXJpYS1oaWRkZW5cIiwgXCJ0cnVlXCIpO1xuICAgICAgbm9uTW9kYWwuc2V0QXR0cmlidXRlKE5PTl9NT0RBTF9ISURERU5fQVRUUklCVVRFLCBcIlwiKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICghc2FmZUFjdGl2ZSAmJiBtZW51QnV0dG9uICYmIHJldHVybkZvY3VzKSB7XG4gICAgLy8gVGhlIG1vZGFsIHdpbmRvdyBpcyBjbG9zZWQuXG4gICAgLy8gTm9uLW1vZGFscyBub3cgYWNjZXNpYmxlIHRvIHNjcmVlbiByZWFkZXJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKE5PTl9NT0RBTFNfSElEREVOKS5mb3JFYWNoKChub25Nb2RhbCkgPT4ge1xuICAgICAgbm9uTW9kYWwucmVtb3ZlQXR0cmlidXRlKFwiYXJpYS1oaWRkZW5cIik7XG4gICAgICBub25Nb2RhbC5yZW1vdmVBdHRyaWJ1dGUoTk9OX01PREFMX0hJRERFTl9BVFRSSUJVVEUpO1xuICAgIH0pO1xuXG4gICAgLy8gRm9jdXMgaXMgcmV0dXJuZWQgdG8gdGhlIG9wZW5lclxuICAgIHJldHVybkZvY3VzLmZvY3VzKCk7XG4gICAgbW9kYWwuZm9jdXNUcmFwLnVwZGF0ZShzYWZlQWN0aXZlKTtcbiAgfVxuXG4gIHJldHVybiBzYWZlQWN0aXZlO1xufVxuXG4vKipcbiAqICBCdWlsZHMgbW9kYWwgd2luZG93IGZyb20gYmFzZSBIVE1MXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gYmFzZUNvbXBvbmVudCB0aGUgbW9kYWwgaHRtbCBpbiB0aGUgRE9NXG4gKi9cbmNvbnN0IHNldFVwTW9kYWwgPSAoYmFzZUNvbXBvbmVudCkgPT4ge1xuICBjb25zdCBtb2RhbENvbnRlbnQgPSBiYXNlQ29tcG9uZW50O1xuICBjb25zdCBtb2RhbFdyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBjb25zdCBvdmVybGF5RGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgY29uc3QgbW9kYWxJRCA9IGJhc2VDb21wb25lbnQuZ2V0QXR0cmlidXRlKFwiaWRcIik7XG4gIGNvbnN0IGFyaWFMYWJlbGxlZEJ5ID0gYmFzZUNvbXBvbmVudC5nZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsbGVkYnlcIik7XG4gIGNvbnN0IGFyaWFEZXNjcmliZWRCeSA9IGJhc2VDb21wb25lbnQuZ2V0QXR0cmlidXRlKFwiYXJpYS1kZXNjcmliZWRieVwiKTtcbiAgY29uc3QgZm9yY2VVc2VyQWN0aW9uID0gYmFzZUNvbXBvbmVudC5oYXNBdHRyaWJ1dGUoRk9SQ0VfQUNUSU9OX0FUVFJJQlVURSlcbiAgICA/IGJhc2VDb21wb25lbnQuaGFzQXR0cmlidXRlKEZPUkNFX0FDVElPTl9BVFRSSUJVVEUpXG4gICAgOiBmYWxzZTtcbiAgLy8gQ3JlYXRlIHBsYWNlaG9sZGVyIHdoZXJlIG1vZGFsIGlzIGZvciBjbGVhbnVwXG4gIGNvbnN0IG9yaWdpbmFsTG9jYXRpb25QbGFjZUhvbGRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIG9yaWdpbmFsTG9jYXRpb25QbGFjZUhvbGRlci5zZXRBdHRyaWJ1dGUoYGRhdGEtcGxhY2Vob2xkZXItZm9yYCwgbW9kYWxJRCk7XG4gIG9yaWdpbmFsTG9jYXRpb25QbGFjZUhvbGRlci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gIG9yaWdpbmFsTG9jYXRpb25QbGFjZUhvbGRlci5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgZm9yIChsZXQgYXR0cmlidXRlSW5kZXggPSAwOyBhdHRyaWJ1dGVJbmRleCA8IG1vZGFsQ29udGVudC5hdHRyaWJ1dGVzLmxlbmd0aDsgYXR0cmlidXRlSW5kZXggKz0gMSkge1xuICAgIGNvbnN0IGF0dHJpYnV0ZSA9IG1vZGFsQ29udGVudC5hdHRyaWJ1dGVzW2F0dHJpYnV0ZUluZGV4XTtcbiAgICBvcmlnaW5hbExvY2F0aW9uUGxhY2VIb2xkZXIuc2V0QXR0cmlidXRlKGBkYXRhLW9yaWdpbmFsLSR7YXR0cmlidXRlLm5hbWV9YCwgYXR0cmlidXRlLnZhbHVlKTtcbiAgfVxuXG4gIG1vZGFsQ29udGVudC5hZnRlcihvcmlnaW5hbExvY2F0aW9uUGxhY2VIb2xkZXIpO1xuXG4gIC8vIFJlYnVpbGQgdGhlIG1vZGFsIGVsZW1lbnRcbiAgbW9kYWxDb250ZW50LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKG1vZGFsV3JhcHBlciwgbW9kYWxDb250ZW50KTtcbiAgbW9kYWxXcmFwcGVyLmFwcGVuZENoaWxkKG1vZGFsQ29udGVudCk7XG4gIG1vZGFsQ29udGVudC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShvdmVybGF5RGl2LCBtb2RhbENvbnRlbnQpO1xuICBvdmVybGF5RGl2LmFwcGVuZENoaWxkKG1vZGFsQ29udGVudCk7XG5cbiAgLy8gQWRkIGNsYXNzZXMgYW5kIGF0dHJpYnV0ZXNcbiAgbW9kYWxXcmFwcGVyLmNsYXNzTGlzdC5hZGQoSElEREVOX0NMQVNTKTtcbiAgbW9kYWxXcmFwcGVyLmNsYXNzTGlzdC5hZGQoV1JBUFBFUl9DTEFTU05BTUUpO1xuICBvdmVybGF5RGl2LmNsYXNzTGlzdC5hZGQoT1ZFUkxBWV9DTEFTU05BTUUpO1xuXG4gIC8vIFNldCBhdHRyaWJ1dGVzXG4gIG1vZGFsV3JhcHBlci5zZXRBdHRyaWJ1dGUoXCJyb2xlXCIsIFwiZGlhbG9nXCIpO1xuICBtb2RhbFdyYXBwZXIuc2V0QXR0cmlidXRlKFwiaWRcIiwgbW9kYWxJRCk7XG5cbiAgaWYgKGFyaWFMYWJlbGxlZEJ5KSB7XG4gICAgbW9kYWxXcmFwcGVyLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxsZWRieVwiLCBhcmlhTGFiZWxsZWRCeSk7XG4gIH1cblxuICBpZiAoYXJpYURlc2NyaWJlZEJ5KSB7XG4gICAgbW9kYWxXcmFwcGVyLnNldEF0dHJpYnV0ZShcImFyaWEtZGVzY3JpYmVkYnlcIiwgYXJpYURlc2NyaWJlZEJ5KTtcbiAgfVxuXG4gIGlmIChmb3JjZVVzZXJBY3Rpb24pIHtcbiAgICBtb2RhbFdyYXBwZXIuc2V0QXR0cmlidXRlKEZPUkNFX0FDVElPTl9BVFRSSUJVVEUsIFwidHJ1ZVwiKTtcbiAgfVxuXG4gIC8vIFVwZGF0ZSB0aGUgYmFzZSBlbGVtZW50IEhUTUxcbiAgYmFzZUNvbXBvbmVudC5yZW1vdmVBdHRyaWJ1dGUoXCJpZFwiKTtcbiAgYmFzZUNvbXBvbmVudC5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsbGVkYnlcIik7XG4gIGJhc2VDb21wb25lbnQucmVtb3ZlQXR0cmlidXRlKFwiYXJpYS1kZXNjcmliZWRieVwiKTtcbiAgYmFzZUNvbXBvbmVudC5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCBcIi0xXCIpO1xuXG4gIC8vIEFkZCBhcmlhLWNvbnRyb2xzXG4gIGNvbnN0IG1vZGFsQ2xvc2VycyA9IG1vZGFsV3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKENMT1NFUlMpO1xuICBtb2RhbENsb3NlcnMuZm9yRWFjaCgoZWwpID0+IHtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWNvbnRyb2xzXCIsIG1vZGFsSUQpO1xuICB9KTtcblxuICAvLyBNb3ZlIGFsbCBtb2RhbHMgdG8gdGhlIGVuZCBvZiB0aGUgRE9NLiBEb2luZyB0aGlzIGFsbG93cyB1cyB0b1xuICAvLyBtb3JlIGVhc2lseSBmaW5kIHRoZSBlbGVtZW50cyB0byBoaWRlIGZyb20gc2NyZWVuIHJlYWRlcnNcbiAgLy8gd2hlbiB0aGUgbW9kYWwgaXMgb3Blbi5cbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChtb2RhbFdyYXBwZXIpO1xufTtcblxuY29uc3QgY2xlYW5VcE1vZGFsID0gKGJhc2VDb21wb25lbnQpID0+IHtcbiAgY29uc3QgbW9kYWxDb250ZW50ID0gYmFzZUNvbXBvbmVudDtcbiAgY29uc3QgbW9kYWxXcmFwcGVyID0gbW9kYWxDb250ZW50LnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudDtcbiAgY29uc3QgbW9kYWxJRCA9IG1vZGFsV3JhcHBlci5nZXRBdHRyaWJ1dGUoXCJpZFwiKTtcblxuICBjb25zdCBvcmlnaW5hbExvY2F0aW9uUGxhY2VIb2xkZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBbZGF0YS1wbGFjZWhvbGRlci1mb3I9XCIke21vZGFsSUR9XCJdYCk7XG4gIGlmKG9yaWdpbmFsTG9jYXRpb25QbGFjZUhvbGRlcilcbiAge1xuICAgIGZvciAobGV0IGF0dHJpYnV0ZUluZGV4ID0gMDsgYXR0cmlidXRlSW5kZXggPCBvcmlnaW5hbExvY2F0aW9uUGxhY2VIb2xkZXIuYXR0cmlidXRlcy5sZW5ndGg7IGF0dHJpYnV0ZUluZGV4ICs9IDEpIHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IG9yaWdpbmFsTG9jYXRpb25QbGFjZUhvbGRlci5hdHRyaWJ1dGVzW2F0dHJpYnV0ZUluZGV4XTtcbiAgICAgIGlmKGF0dHJpYnV0ZS5uYW1lLnN0YXJ0c1dpdGgoJ2RhdGEtb3JpZ2luYWwtJykpXG4gICAgICB7XG4gICAgICAgIC8vIGRhdGEtb3JpZ2luYWwtIGlzIDE0IGxvbmdcbiAgICAgICAgbW9kYWxDb250ZW50LnNldEF0dHJpYnV0ZShhdHRyaWJ1dGUubmFtZS5zdWJzdHIoMTQpLCBhdHRyaWJ1dGUudmFsdWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIG9yaWdpbmFsTG9jYXRpb25QbGFjZUhvbGRlci5hZnRlcihtb2RhbENvbnRlbnQpO1xuICAgIG9yaWdpbmFsTG9jYXRpb25QbGFjZUhvbGRlci5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKG9yaWdpbmFsTG9jYXRpb25QbGFjZUhvbGRlcik7XG4gIH1cblxuICBtb2RhbFdyYXBwZXIucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZChtb2RhbFdyYXBwZXIpO1xufTtcblxubW9kYWwgPSB7XG4gIGluaXQocm9vdCkge1xuICAgIHNlbGVjdE9yTWF0Y2hlcyhNT0RBTCwgcm9vdCkuZm9yRWFjaCgobW9kYWxXaW5kb3cpID0+IHtcbiAgICAgIGNvbnN0IG1vZGFsSWQgPSBtb2RhbFdpbmRvdy5pZDtcbiAgICAgIHNldFVwTW9kYWwobW9kYWxXaW5kb3cpO1xuXG4gICAgICAvLyB0aGlzIHdpbGwgcXVlcnkgYWxsIG9wZW5lcnMgYW5kIGNsb3NlcnMgaW5jbHVkaW5nIHRoZSBvdmVybGF5XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGBbYXJpYS1jb250cm9scz1cIiR7bW9kYWxJZH1cIl1gKS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgIC8vIFR1cm4gYW5jaG9yIGxpbmtzIGludG8gYnV0dG9ucyBiZWNhdXNlIG9mXG4gICAgICAgIC8vIFZvaWNlT3ZlciBvbiBTYWZhcmlcbiAgICAgICAgaWYgKGl0ZW0ubm9kZU5hbWUgPT09IFwiQVwiKSB7XG4gICAgICAgICAgaXRlbS5zZXRBdHRyaWJ1dGUoXCJyb2xlXCIsIFwiYnV0dG9uXCIpO1xuICAgICAgICAgIGl0ZW0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiBlLnByZXZlbnREZWZhdWx0KCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FuIHVuY29tbWVudCB3aGVuIGFyaWEtaGFzcG9wdXA9XCJkaWFsb2dcIiBpcyBzdXBwb3J0ZWRcbiAgICAgICAgLy8gaHR0cHM6Ly9hMTF5c3VwcG9ydC5pby90ZWNoL2FyaWEvYXJpYS1oYXNwb3B1cF9hdHRyaWJ1dGVcbiAgICAgICAgLy8gTW9zdCBzY3JlZW4gcmVhZGVycyBzdXBwb3J0IGFyaWEtaGFzcG9wdXAsIGJ1dCBtaWdodCBhbm5vdW5jZVxuICAgICAgICAvLyBhcyBvcGVuaW5nIGEgbWVudSBpZiBcImRpYWxvZ1wiIGlzIG5vdCBzdXBwb3J0ZWQuXG4gICAgICAgIC8vIGl0ZW0uc2V0QXR0cmlidXRlKFwiYXJpYS1oYXNwb3B1cFwiLCBcImRpYWxvZ1wiKTtcblxuICAgICAgICBpdGVtLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0b2dnbGVNb2RhbCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSxcbiAgdGVhcmRvd24ocm9vdCkge1xuICAgIHNlbGVjdE9yTWF0Y2hlcyhNT0RBTCwgcm9vdCkuZm9yRWFjaCgobW9kYWxXaW5kb3cpID0+IHtcbiAgICAgIGNsZWFuVXBNb2RhbChtb2RhbFdpbmRvdyk7XG4gICAgICBjb25zdCBtb2RhbElkID0gbW9kYWxXaW5kb3cuaWQ7XG5cbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYFthcmlhLWNvbnRyb2xzPVwiJHttb2RhbElkfVwiXWApXG4gICAgICAgIC5mb3JFYWNoKChpdGVtKSA9PiBpdGVtLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0b2dnbGVNb2RhbCkpO1xuICAgIH0pO1xuICB9LFxuICBmb2N1c1RyYXA6IG51bGwsXG4gIHRvZ2dsZU1vZGFsLFxuICBvbihyb290KSB7XG4gICAgdGhpcy5pbml0KHJvb3QpO1xuICB9LFxuICBvZmYocm9vdCkge1xuICAgIHRoaXMudGVhcmRvd24ocm9vdCk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gbW9kYWw7XG4iLCJjb25zdCBpZ25vcmUgPSByZXF1aXJlKFwicmVjZXB0b3IvaWdub3JlXCIpO1xuY29uc3QgYmVoYXZpb3IgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvYmVoYXZpb3JcIik7XG5jb25zdCBzZWxlY3QgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2VsZWN0XCIpO1xuXG5jb25zdCB7IENMSUNLIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvZXZlbnRzXCIpO1xuXG5jb25zdCBCVVRUT04gPSBcIi5qcy1zZWFyY2gtYnV0dG9uXCI7XG5jb25zdCBGT1JNID0gXCIuanMtc2VhcmNoLWZvcm1cIjtcbmNvbnN0IElOUFVUID0gXCJbdHlwZT1zZWFyY2hdXCI7XG5jb25zdCBDT05URVhUID0gXCJoZWFkZXJcIjsgLy8gWFhYXG5cbmxldCBsYXN0QnV0dG9uO1xuXG5jb25zdCBnZXRGb3JtID0gKGJ1dHRvbikgPT4ge1xuICBjb25zdCBjb250ZXh0ID0gYnV0dG9uLmNsb3Nlc3QoQ09OVEVYVCk7XG4gIHJldHVybiBjb250ZXh0ID8gY29udGV4dC5xdWVyeVNlbGVjdG9yKEZPUk0pIDogZG9jdW1lbnQucXVlcnlTZWxlY3RvcihGT1JNKTtcbn07XG5cbmNvbnN0IHRvZ2dsZVNlYXJjaCA9IChidXR0b24sIGFjdGl2ZSkgPT4ge1xuICBjb25zdCBmb3JtID0gZ2V0Rm9ybShidXR0b24pO1xuXG4gIGlmICghZm9ybSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgTm8gJHtGT1JNfSBmb3VuZCBmb3Igc2VhcmNoIHRvZ2dsZSBpbiAke0NPTlRFWFR9IWApO1xuICB9XG5cbiAgLyogZXNsaW50LWRpc2FibGUgbm8tcGFyYW0tcmVhc3NpZ24gKi9cbiAgYnV0dG9uLmhpZGRlbiA9IGFjdGl2ZTtcbiAgZm9ybS5oaWRkZW4gPSAhYWN0aXZlO1xuICAvKiBlc2xpbnQtZW5hYmxlICovXG5cbiAgaWYgKCFhY3RpdmUpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBpbnB1dCA9IGZvcm0ucXVlcnlTZWxlY3RvcihJTlBVVCk7XG5cbiAgaWYgKGlucHV0KSB7XG4gICAgaW5wdXQuZm9jdXMoKTtcbiAgfVxuICAvLyB3aGVuIHRoZSB1c2VyIGNsaWNrcyBfb3V0c2lkZV8gb2YgdGhlIGZvcm0gdy9pZ25vcmUoKTogaGlkZSB0aGVcbiAgLy8gc2VhcmNoLCB0aGVuIHJlbW92ZSB0aGUgbGlzdGVuZXJcbiAgY29uc3QgbGlzdGVuZXIgPSBpZ25vcmUoZm9ybSwgKCkgPT4ge1xuICAgIGlmIChsYXN0QnV0dG9uKSB7XG4gICAgICBoaWRlU2VhcmNoLmNhbGwobGFzdEJ1dHRvbik7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdXNlLWJlZm9yZS1kZWZpbmVcbiAgICB9XG5cbiAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUV2ZW50TGlzdGVuZXIoQ0xJQ0ssIGxpc3RlbmVyKTtcbiAgfSk7XG5cbiAgLy8gTm9ybWFsbHkgd2Ugd291bGQganVzdCBydW4gdGhpcyBjb2RlIHdpdGhvdXQgYSB0aW1lb3V0LCBidXRcbiAgLy8gSUUxMSBhbmQgRWRnZSB3aWxsIGFjdHVhbGx5IGNhbGwgdGhlIGxpc3RlbmVyICppbW1lZGlhdGVseSogYmVjYXVzZVxuICAvLyB0aGV5IGFyZSBjdXJyZW50bHkgaGFuZGxpbmcgdGhpcyBleGFjdCB0eXBlIG9mIGV2ZW50LCBzbyB3ZSdsbFxuICAvLyBtYWtlIHN1cmUgdGhlIGJyb3dzZXIgaXMgZG9uZSBoYW5kbGluZyB0aGUgY3VycmVudCBjbGljayBldmVudCxcbiAgLy8gaWYgYW55LCBiZWZvcmUgd2UgYXR0YWNoIHRoZSBsaXN0ZW5lci5cbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKENMSUNLLCBsaXN0ZW5lcik7XG4gIH0sIDApO1xufTtcblxuZnVuY3Rpb24gc2hvd1NlYXJjaCgpIHtcbiAgdG9nZ2xlU2VhcmNoKHRoaXMsIHRydWUpO1xuICBsYXN0QnV0dG9uID0gdGhpcztcbn1cblxuZnVuY3Rpb24gaGlkZVNlYXJjaCgpIHtcbiAgdG9nZ2xlU2VhcmNoKHRoaXMsIGZhbHNlKTtcbiAgbGFzdEJ1dHRvbiA9IHVuZGVmaW5lZDtcbn1cblxuY29uc3Qgc2VhcmNoID0gYmVoYXZpb3IoXG4gIHtcbiAgICBbQ0xJQ0tdOiB7XG4gICAgICBbQlVUVE9OXTogc2hvd1NlYXJjaCxcbiAgICB9LFxuICB9LFxuICB7XG4gICAgaW5pdCh0YXJnZXQpIHtcbiAgICAgIHNlbGVjdChCVVRUT04sIHRhcmdldCkuZm9yRWFjaCgoYnV0dG9uKSA9PiB7XG4gICAgICAgIHRvZ2dsZVNlYXJjaChidXR0b24sIGZhbHNlKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgdGVhcmRvd24oKSB7XG4gICAgICAvLyBmb3JnZXQgdGhlIGxhc3QgYnV0dG9uIGNsaWNrZWRcbiAgICAgIGxhc3RCdXR0b24gPSB1bmRlZmluZWQ7XG4gICAgfSxcbiAgfVxuKTtcblxubW9kdWxlLmV4cG9ydHMgPSBzZWFyY2g7XG4iLCJjb25zdCBvbmNlID0gcmVxdWlyZShcInJlY2VwdG9yL29uY2VcIik7XG5jb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcbmNvbnN0IHsgQ0xJQ0sgfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9ldmVudHNcIik7XG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvY29uZmlnXCIpO1xuXG5jb25zdCBMSU5LID0gYC4ke1BSRUZJWH0tc2tpcG5hdltocmVmXj1cIiNcIl0sIC4ke1BSRUZJWH0tZm9vdGVyX19yZXR1cm4tdG8tdG9wIFtocmVmXj1cIiNcIl1gO1xuY29uc3QgTUFJTkNPTlRFTlQgPSBcIm1haW4tY29udGVudFwiO1xuXG5mdW5jdGlvbiBzZXRUYWJpbmRleCgpIHtcbiAgLy8gTkI6IHdlIGtub3cgYmVjYXVzZSBvZiB0aGUgc2VsZWN0b3Igd2UncmUgZGVsZWdhdGluZyB0byBiZWxvdyB0aGF0IHRoZVxuICAvLyBocmVmIGFscmVhZHkgYmVnaW5zIHdpdGggJyMnXG4gIGNvbnN0IGlkID0gZW5jb2RlVVJJKHRoaXMuZ2V0QXR0cmlidXRlKFwiaHJlZlwiKSk7XG4gIGNvbnN0IHRhcmdldCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFxuICAgIGlkID09PSBcIiNcIiA/IE1BSU5DT05URU5UIDogaWQuc2xpY2UoMSlcbiAgKTtcblxuICBpZiAodGFyZ2V0KSB7XG4gICAgdGFyZ2V0LnN0eWxlLm91dGxpbmUgPSBcIjBcIjtcbiAgICB0YXJnZXQuc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIiwgMCk7XG4gICAgdGFyZ2V0LmZvY3VzKCk7XG4gICAgdGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICBcImJsdXJcIixcbiAgICAgIG9uY2UoKCkgPT4ge1xuICAgICAgICB0YXJnZXQuc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIiwgLTEpO1xuICAgICAgfSlcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIC8vIHRocm93IGFuIGVycm9yP1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmVoYXZpb3Ioe1xuICBbQ0xJQ0tdOiB7XG4gICAgW0xJTktdOiBzZXRUYWJpbmRleCxcbiAgfSxcbn0pO1xuIiwiY29uc3Qgc2VsZWN0ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3NlbGVjdFwiKTtcbmNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xuY29uc3QgeyBDTElDSyB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2V2ZW50c1wiKTtcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy9jb25maWdcIik7XG5jb25zdCBTYW5pdGl6ZXIgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2FuaXRpemVyXCIpO1xuXG5jb25zdCBUQUJMRSA9IGAuJHtQUkVGSVh9LXRhYmxlYDtcbmNvbnN0IFNPUlRFRCA9IFwiYXJpYS1zb3J0XCI7XG5jb25zdCBBU0NFTkRJTkcgPSBcImFzY2VuZGluZ1wiO1xuY29uc3QgREVTQ0VORElORyA9IFwiZGVzY2VuZGluZ1wiO1xuY29uc3QgU09SVF9PVkVSUklERSA9IFwiZGF0YS1zb3J0LXZhbHVlXCI7XG5jb25zdCBTT1JUX0JVVFRPTl9DTEFTUyA9IGAke1BSRUZJWH0tdGFibGVfX2hlYWRlcl9fYnV0dG9uYDtcbmNvbnN0IFNPUlRfQlVUVE9OID0gYC4ke1NPUlRfQlVUVE9OX0NMQVNTfWA7XG5jb25zdCBTT1JUQUJMRV9IRUFERVIgPSBgdGhbZGF0YS1zb3J0YWJsZV1gO1xuY29uc3QgQU5OT1VOQ0VNRU5UX1JFR0lPTiA9IGAuJHtQUkVGSVh9LXRhYmxlX19hbm5vdW5jZW1lbnQtcmVnaW9uW2FyaWEtbGl2ZT1cInBvbGl0ZVwiXWA7XG5cbi8qKiBHZXRzIHRoZSBkYXRhLXNvcnQtdmFsdWUgYXR0cmlidXRlIHZhbHVlLCBpZiBwcm92aWRlZCDigJQgb3RoZXJ3aXNlLCBnZXRzXG4gKiB0aGUgaW5uZXJUZXh0IG9yIHRleHRDb250ZW50IOKAlCBvZiB0aGUgY2hpbGQgZWxlbWVudCAoSFRNTFRhYmxlQ2VsbEVsZW1lbnQpXG4gKiBhdCB0aGUgc3BlY2lmaWVkIGluZGV4IG9mIHRoZSBnaXZlbiB0YWJsZSByb3dcbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gaW5kZXhcbiAqIEBwYXJhbSB7YXJyYXk8SFRNTFRhYmxlUm93RWxlbWVudD59IHRyXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5jb25zdCBnZXRDZWxsVmFsdWUgPSAodHIsIGluZGV4KSA9PlxuICB0ci5jaGlsZHJlbltpbmRleF0uZ2V0QXR0cmlidXRlKFNPUlRfT1ZFUlJJREUpIHx8XG4gIHRyLmNoaWxkcmVuW2luZGV4XS5pbm5lclRleHQgfHxcbiAgdHIuY2hpbGRyZW5baW5kZXhdLnRleHRDb250ZW50O1xuXG4vKipcbiAqIENvbXBhcmVzIHRoZSB2YWx1ZXMgb2YgdHdvIHJvdyBhcnJheSBpdGVtcyBhdCB0aGUgZ2l2ZW4gaW5kZXgsIHRoZW4gc29ydHMgYnkgdGhlIGdpdmVuIGRpcmVjdGlvblxuICogQHBhcmFtIHtudW1iZXJ9IGluZGV4XG4gKiBAcGFyYW0ge3N0cmluZ30gZGlyZWN0aW9uXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5jb25zdCBjb21wYXJlRnVuY3Rpb24gPSAoaW5kZXgsIGlzQXNjZW5kaW5nKSA9PiAodGhpc1JvdywgbmV4dFJvdykgPT4ge1xuICAvLyBnZXQgdmFsdWVzIHRvIGNvbXBhcmUgZnJvbSBkYXRhIGF0dHJpYnV0ZSBvciBjZWxsIGNvbnRlbnRcbiAgY29uc3QgdmFsdWUxID0gZ2V0Q2VsbFZhbHVlKGlzQXNjZW5kaW5nID8gdGhpc1JvdyA6IG5leHRSb3csIGluZGV4KTtcbiAgY29uc3QgdmFsdWUyID0gZ2V0Q2VsbFZhbHVlKGlzQXNjZW5kaW5nID8gbmV4dFJvdyA6IHRoaXNSb3csIGluZGV4KTtcblxuICAvLyBpZiBuZWl0aGVyIHZhbHVlIGlzIGVtcHR5LCBhbmQgaWYgYm90aCB2YWx1ZXMgYXJlIGFscmVhZHkgbnVtYmVycywgY29tcGFyZSBudW1lcmljYWxseVxuICBpZiAoXG4gICAgdmFsdWUxICYmXG4gICAgdmFsdWUyICYmXG4gICAgIU51bWJlci5pc05hTihOdW1iZXIodmFsdWUxKSkgJiZcbiAgICAhTnVtYmVyLmlzTmFOKE51bWJlcih2YWx1ZTIpKVxuICApIHtcbiAgICByZXR1cm4gdmFsdWUxIC0gdmFsdWUyO1xuICB9XG4gIC8vIE90aGVyd2lzZSwgY29tcGFyZSBhbHBoYWJldGljYWxseSBiYXNlZCBvbiBjdXJyZW50IHVzZXIgbG9jYWxlXG4gIHJldHVybiB2YWx1ZTEudG9TdHJpbmcoKS5sb2NhbGVDb21wYXJlKHZhbHVlMiwgbmF2aWdhdG9yLmxhbmd1YWdlLCB7XG4gICAgbnVtZXJpYzogdHJ1ZSxcbiAgICBpZ25vcmVQdW5jdHVhdGlvbjogdHJ1ZSxcbiAgfSk7XG59O1xuXG4vKipcbiAqIEdldCBhbiBBcnJheSBvZiBjb2x1bW4gaGVhZGVycyBlbGVtZW50cyBiZWxvbmdpbmcgZGlyZWN0bHkgdG8gdGhlIGdpdmVuXG4gKiB0YWJsZSBlbGVtZW50LlxuICogQHBhcmFtIHtIVE1MVGFibGVFbGVtZW50fSB0YWJsZVxuICogQHJldHVybiB7YXJyYXk8SFRNTFRhYmxlSGVhZGVyQ2VsbEVsZW1lbnQ+fVxuICovXG5jb25zdCBnZXRDb2x1bW5IZWFkZXJzID0gKHRhYmxlKSA9PiB7XG4gIGNvbnN0IGhlYWRlcnMgPSBzZWxlY3QoU09SVEFCTEVfSEVBREVSLCB0YWJsZSk7XG4gIHJldHVybiBoZWFkZXJzLmZpbHRlcigoaGVhZGVyKSA9PiBoZWFkZXIuY2xvc2VzdChUQUJMRSkgPT09IHRhYmxlKTtcbn07XG5cbi8qKlxuICogVXBkYXRlIHRoZSBidXR0b24gbGFiZWwgd2l0aGluIHRoZSBnaXZlbiBoZWFkZXIgZWxlbWVudCwgcmVzZXR0aW5nIGl0XG4gKiB0byB0aGUgZGVmYXVsdCBzdGF0ZSAocmVhZHkgdG8gc29ydCBhc2NlbmRpbmcpIGlmIGl0J3Mgbm8gbG9uZ2VyIHNvcnRlZFxuICogQHBhcmFtIHtIVE1MVGFibGVIZWFkZXJDZWxsRWxlbWVudH0gaGVhZGVyXG4gKi9cbmNvbnN0IHVwZGF0ZVNvcnRMYWJlbCA9IChoZWFkZXIpID0+IHtcbiAgY29uc3QgaGVhZGVyTmFtZSA9IGhlYWRlci5pbm5lclRleHQ7XG4gIGNvbnN0IHNvcnRlZEFzY2VuZGluZyA9IGhlYWRlci5nZXRBdHRyaWJ1dGUoU09SVEVEKSA9PT0gQVNDRU5ESU5HO1xuICBjb25zdCBpc1NvcnRlZCA9XG4gICAgaGVhZGVyLmdldEF0dHJpYnV0ZShTT1JURUQpID09PSBBU0NFTkRJTkcgfHxcbiAgICBoZWFkZXIuZ2V0QXR0cmlidXRlKFNPUlRFRCkgPT09IERFU0NFTkRJTkcgfHxcbiAgICBmYWxzZTtcbiAgY29uc3QgaGVhZGVyTGFiZWwgPSBgJHtoZWFkZXJOYW1lfScsIHNvcnRhYmxlIGNvbHVtbiwgY3VycmVudGx5ICR7XG4gICAgaXNTb3J0ZWRcbiAgICAgID8gYCR7c29ydGVkQXNjZW5kaW5nID8gYHNvcnRlZCAke0FTQ0VORElOR31gIDogYHNvcnRlZCAke0RFU0NFTkRJTkd9YH1gXG4gICAgICA6IFwidW5zb3J0ZWRcIlxuICB9YDtcbiAgY29uc3QgaGVhZGVyQnV0dG9uTGFiZWwgPSBgQ2xpY2sgdG8gc29ydCBieSAke2hlYWRlck5hbWV9IGluICR7XG4gICAgc29ydGVkQXNjZW5kaW5nID8gREVTQ0VORElORyA6IEFTQ0VORElOR1xuICB9IG9yZGVyLmA7XG4gIGhlYWRlci5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIGhlYWRlckxhYmVsKTtcbiAgaGVhZGVyLnF1ZXJ5U2VsZWN0b3IoU09SVF9CVVRUT04pLnNldEF0dHJpYnV0ZShcInRpdGxlXCIsIGhlYWRlckJ1dHRvbkxhYmVsKTtcbn07XG5cbi8qKlxuICogUmVtb3ZlIHRoZSBhcmlhLXNvcnQgYXR0cmlidXRlIG9uIHRoZSBnaXZlbiBoZWFkZXIgZWxlbWVudCwgYW5kIHJlc2V0IHRoZSBsYWJlbCBhbmQgYnV0dG9uIGljb25cbiAqIEBwYXJhbSB7SFRNTFRhYmxlSGVhZGVyQ2VsbEVsZW1lbnR9IGhlYWRlclxuICovXG5jb25zdCB1bnNldFNvcnQgPSAoaGVhZGVyKSA9PiB7XG4gIGhlYWRlci5yZW1vdmVBdHRyaWJ1dGUoU09SVEVEKTtcbiAgdXBkYXRlU29ydExhYmVsKGhlYWRlcik7XG59O1xuXG4vKipcbiAqIFNvcnQgcm93cyBlaXRoZXIgYXNjZW5kaW5nIG9yIGRlc2NlbmRpbmcsIGJhc2VkIG9uIGEgZ2l2ZW4gaGVhZGVyJ3MgYXJpYS1zb3J0IGF0dHJpYnV0ZVxuICogQHBhcmFtIHtIVE1MVGFibGVIZWFkZXJDZWxsRWxlbWVudH0gaGVhZGVyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGlzQXNjZW5kaW5nXG4gKiBAcmV0dXJuIHtib29sZWFufSB0cnVlXG4gKi9cbmNvbnN0IHNvcnRSb3dzID0gKGhlYWRlciwgaXNBc2NlbmRpbmcpID0+IHtcbiAgaGVhZGVyLnNldEF0dHJpYnV0ZShTT1JURUQsIGlzQXNjZW5kaW5nID09PSB0cnVlID8gREVTQ0VORElORyA6IEFTQ0VORElORyk7XG4gIHVwZGF0ZVNvcnRMYWJlbChoZWFkZXIpO1xuXG4gIGNvbnN0IHRib2R5ID0gaGVhZGVyLmNsb3Nlc3QoVEFCTEUpLnF1ZXJ5U2VsZWN0b3IoXCJ0Ym9keVwiKTtcblxuICAvLyBXZSBjYW4gdXNlIEFycmF5LmZyb20oKSBhbmQgQXJyYXkuc29ydCgpIGluc3RlYWQgb25jZSB3ZSBkcm9wIElFMTEgc3VwcG9ydCwgbGlrZWx5IGluIHRoZSBzdW1tZXIgb2YgMjAyMVxuICAvL1xuICAvLyBBcnJheS5mcm9tKHRib2R5LnF1ZXJ5U2VsZWN0b3JBbGwoJ3RyJykuc29ydChcbiAgLy8gICBjb21wYXJlRnVuY3Rpb24oXG4gIC8vICAgICBBcnJheS5mcm9tKGhlYWRlci5wYXJlbnROb2RlLmNoaWxkcmVuKS5pbmRleE9mKGhlYWRlciksXG4gIC8vICAgICAhaXNBc2NlbmRpbmcpXG4gIC8vICAgKVxuICAvLyAuZm9yRWFjaCh0ciA9PiB0Ym9keS5hcHBlbmRDaGlsZCh0cikgKTtcblxuICAvLyBbXS5zbGljZS5jYWxsKCkgdHVybnMgYXJyYXktbGlrZSBzZXRzIGludG8gdHJ1ZSBhcnJheXMgc28gdGhhdCB3ZSBjYW4gc29ydCB0aGVtXG4gIGNvbnN0IGFsbFJvd3MgPSBbXS5zbGljZS5jYWxsKHRib2R5LnF1ZXJ5U2VsZWN0b3JBbGwoXCJ0clwiKSk7XG4gIGNvbnN0IGFsbEhlYWRlcnMgPSBbXS5zbGljZS5jYWxsKGhlYWRlci5wYXJlbnROb2RlLmNoaWxkcmVuKTtcbiAgY29uc3QgdGhpc0hlYWRlckluZGV4ID0gYWxsSGVhZGVycy5pbmRleE9mKGhlYWRlcik7XG4gIGFsbFJvd3Muc29ydChjb21wYXJlRnVuY3Rpb24odGhpc0hlYWRlckluZGV4LCAhaXNBc2NlbmRpbmcpKS5mb3JFYWNoKCh0cikgPT4ge1xuICAgIFtdLnNsaWNlXG4gICAgICAuY2FsbCh0ci5jaGlsZHJlbilcbiAgICAgIC5mb3JFYWNoKCh0ZCkgPT4gdGQucmVtb3ZlQXR0cmlidXRlKFwiZGF0YS1zb3J0LWFjdGl2ZVwiKSk7XG4gICAgdHIuY2hpbGRyZW5bdGhpc0hlYWRlckluZGV4XS5zZXRBdHRyaWJ1dGUoXCJkYXRhLXNvcnQtYWN0aXZlXCIsIHRydWUpO1xuICAgIHRib2R5LmFwcGVuZENoaWxkKHRyKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vKipcbiAqIFVwZGF0ZSB0aGUgbGl2ZSByZWdpb24gaW1tZWRpYXRlbHkgZm9sbG93aW5nIHRoZSB0YWJsZSB3aGVuZXZlciBzb3J0IGNoYW5nZXMuXG4gKiBAcGFyYW0ge0hUTUxUYWJsZUVsZW1lbnR9IHRhYmxlXG4gKiBAcGFyYW0ge0hUTUxUYWJsZUhlYWRlckNlbGxFbGVtZW50fSBzb3J0ZWRIZWFkZXJcbiAqL1xuXG5jb25zdCB1cGRhdGVMaXZlUmVnaW9uID0gKHRhYmxlLCBzb3J0ZWRIZWFkZXIpID0+IHtcbiAgY29uc3QgY2FwdGlvbiA9IHRhYmxlLnF1ZXJ5U2VsZWN0b3IoXCJjYXB0aW9uXCIpLmlubmVyVGV4dDtcbiAgY29uc3Qgc29ydGVkQXNjZW5kaW5nID0gc29ydGVkSGVhZGVyLmdldEF0dHJpYnV0ZShTT1JURUQpID09PSBBU0NFTkRJTkc7XG4gIGNvbnN0IGhlYWRlckxhYmVsID0gc29ydGVkSGVhZGVyLmlubmVyVGV4dDtcbiAgY29uc3QgbGl2ZVJlZ2lvbiA9IHRhYmxlLm5leHRFbGVtZW50U2libGluZztcbiAgaWYgKGxpdmVSZWdpb24gJiYgbGl2ZVJlZ2lvbi5tYXRjaGVzKEFOTk9VTkNFTUVOVF9SRUdJT04pKSB7XG4gICAgY29uc3Qgc29ydEFubm91bmNlbWVudCA9IGBUaGUgdGFibGUgbmFtZWQgXCIke2NhcHRpb259XCIgaXMgbm93IHNvcnRlZCBieSAke2hlYWRlckxhYmVsfSBpbiAke1xuICAgICAgc29ydGVkQXNjZW5kaW5nID8gQVNDRU5ESU5HIDogREVTQ0VORElOR1xuICAgIH0gb3JkZXIuYDtcbiAgICBsaXZlUmVnaW9uLmlubmVyVGV4dCA9IHNvcnRBbm5vdW5jZW1lbnQ7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYFRhYmxlIGNvbnRhaW5pbmcgYSBzb3J0YWJsZSBjb2x1bW4gaGVhZGVyIGlzIG5vdCBmb2xsb3dlZCBieSBhbiBhcmlhLWxpdmUgcmVnaW9uLmBcbiAgICApO1xuICB9XG59O1xuXG4vKipcbiAqIFRvZ2dsZSBhIGhlYWRlcidzIHNvcnQgc3RhdGUsIG9wdGlvbmFsbHkgcHJvdmlkaW5nIGEgdGFyZ2V0XG4gKiBzdGF0ZS5cbiAqXG4gKiBAcGFyYW0ge0hUTUxUYWJsZUhlYWRlckNlbGxFbGVtZW50fSBoZWFkZXJcbiAqIEBwYXJhbSB7Ym9vbGVhbj99IGlzQXNjZW5kaW5nIElmIG5vIHN0YXRlIGlzIHByb3ZpZGVkLCB0aGUgY3VycmVudFxuICogc3RhdGUgd2lsbCBiZSB0b2dnbGVkIChmcm9tIGZhbHNlIHRvIHRydWUsIGFuZCB2aWNlLXZlcnNhKS5cbiAqL1xuY29uc3QgdG9nZ2xlU29ydCA9IChoZWFkZXIsIGlzQXNjZW5kaW5nKSA9PiB7XG4gIGNvbnN0IHRhYmxlID0gaGVhZGVyLmNsb3Nlc3QoVEFCTEUpO1xuICBsZXQgc2FmZUFzY2VuZGluZyA9IGlzQXNjZW5kaW5nO1xuICBpZiAodHlwZW9mIHNhZmVBc2NlbmRpbmcgIT09IFwiYm9vbGVhblwiKSB7XG4gICAgc2FmZUFzY2VuZGluZyA9IGhlYWRlci5nZXRBdHRyaWJ1dGUoU09SVEVEKSA9PT0gQVNDRU5ESU5HO1xuICB9XG5cbiAgaWYgKCF0YWJsZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHtTT1JUQUJMRV9IRUFERVJ9IGlzIG1pc3Npbmcgb3V0ZXIgJHtUQUJMRX1gKTtcbiAgfVxuXG4gIHNhZmVBc2NlbmRpbmcgPSBzb3J0Um93cyhoZWFkZXIsIGlzQXNjZW5kaW5nKTtcblxuICBpZiAoc2FmZUFzY2VuZGluZykge1xuICAgIGdldENvbHVtbkhlYWRlcnModGFibGUpLmZvckVhY2goKG90aGVySGVhZGVyKSA9PiB7XG4gICAgICBpZiAob3RoZXJIZWFkZXIgIT09IGhlYWRlcikge1xuICAgICAgICB1bnNldFNvcnQob3RoZXJIZWFkZXIpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHVwZGF0ZUxpdmVSZWdpb24odGFibGUsIGhlYWRlcik7XG4gIH1cbn07XG5cbi8qKlxuICoqIEluc2VydHMgYSBidXR0b24gd2l0aCBpY29uIGluc2lkZSBhIHNvcnRhYmxlIGhlYWRlclxuICogQHBhcmFtIHtIVE1MVGFibGVIZWFkZXJDZWxsRWxlbWVudH0gaGVhZGVyXG4gKi9cblxuY29uc3QgY3JlYXRlSGVhZGVyQnV0dG9uID0gKGhlYWRlcikgPT4ge1xuICBjb25zdCBidXR0b25FbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gIGJ1dHRvbkVsLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIFwiMFwiKTtcbiAgYnV0dG9uRWwuY2xhc3NMaXN0LmFkZChTT1JUX0JVVFRPTl9DTEFTUyk7XG4gIC8vIElDT05fU09VUkNFXG4gIGJ1dHRvbkVsLmlubmVySFRNTCA9IFNhbml0aXplci5lc2NhcGVIVE1MYFxuICA8c3ZnIGNsYXNzPVwiJHtQUkVGSVh9LWljb25cIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiPlxuICAgIDxnIGNsYXNzPVwiZGVzY2VuZGluZ1wiIGZpbGw9XCJ0cmFuc3BhcmVudFwiPlxuICAgICAgPHBhdGggZD1cIk0xNyAxN0wxNS41OSAxNS41OUwxMi45OTk5IDE4LjE3VjJIMTAuOTk5OVYxOC4xN0w4LjQxIDE1LjU4TDcgMTdMMTEuOTk5OSAyMkwxNyAxN1pcIiAvPlxuICAgIDwvZz5cbiAgICA8ZyBjbGFzcz1cImFzY2VuZGluZ1wiIGZpbGw9XCJ0cmFuc3BhcmVudFwiPlxuICAgICAgPHBhdGggdHJhbnNmb3JtPVwicm90YXRlKDE4MCwgMTIsIDEyKVwiIGQ9XCJNMTcgMTdMMTUuNTkgMTUuNTlMMTIuOTk5OSAxOC4xN1YySDEwLjk5OTlWMTguMTdMOC40MSAxNS41OEw3IDE3TDExLjk5OTkgMjJMMTcgMTdaXCIgLz5cbiAgICA8L2c+XG4gICAgPGcgY2xhc3M9XCJ1bnNvcnRlZFwiIGZpbGw9XCJ0cmFuc3BhcmVudFwiPlxuICAgICAgPHBvbHlnb24gcG9pbnRzPVwiMTUuMTcgMTUgMTMgMTcuMTcgMTMgNi44MyAxNS4xNyA5IDE2LjU4IDcuNTkgMTIgMyA3LjQxIDcuNTkgOC44MyA5IDExIDYuODMgMTEgMTcuMTcgOC44MyAxNSA3LjQyIDE2LjQxIDEyIDIxIDE2LjU5IDE2LjQxIDE1LjE3IDE1XCIvPlxuICAgIDwvZz5cbiAgPC9zdmc+XG4gIGA7XG4gIGhlYWRlci5hcHBlbmRDaGlsZChidXR0b25FbCk7XG4gIHVwZGF0ZVNvcnRMYWJlbChoZWFkZXIpO1xufTtcblxuY29uc3QgdGFibGUgPSBiZWhhdmlvcihcbiAge1xuICAgIFtDTElDS106IHtcbiAgICAgIFtTT1JUX0JVVFRPTl0oZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdG9nZ2xlU29ydChcbiAgICAgICAgICBldmVudC50YXJnZXQuY2xvc2VzdChTT1JUQUJMRV9IRUFERVIpLFxuICAgICAgICAgIGV2ZW50LnRhcmdldC5jbG9zZXN0KFNPUlRBQkxFX0hFQURFUikuZ2V0QXR0cmlidXRlKFNPUlRFRCkgPT09XG4gICAgICAgICAgICBBU0NFTkRJTkdcbiAgICAgICAgKTtcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAge1xuICAgIGluaXQocm9vdCkge1xuICAgICAgY29uc3Qgc29ydGFibGVIZWFkZXJzID0gc2VsZWN0KFNPUlRBQkxFX0hFQURFUiwgcm9vdCk7XG4gICAgICBzb3J0YWJsZUhlYWRlcnMuZm9yRWFjaCgoaGVhZGVyKSA9PiBjcmVhdGVIZWFkZXJCdXR0b24oaGVhZGVyKSk7XG5cbiAgICAgIGNvbnN0IGZpcnN0U29ydGVkID0gc29ydGFibGVIZWFkZXJzLmZpbHRlcihcbiAgICAgICAgKGhlYWRlcikgPT5cbiAgICAgICAgICBoZWFkZXIuZ2V0QXR0cmlidXRlKFNPUlRFRCkgPT09IEFTQ0VORElORyB8fFxuICAgICAgICAgIGhlYWRlci5nZXRBdHRyaWJ1dGUoU09SVEVEKSA9PT0gREVTQ0VORElOR1xuICAgICAgKVswXTtcbiAgICAgIGlmICh0eXBlb2YgZmlyc3RTb3J0ZWQgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgLy8gbm8gc29ydGFibGUgaGVhZGVycyBmb3VuZFxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBzb3J0RGlyID0gZmlyc3RTb3J0ZWQuZ2V0QXR0cmlidXRlKFNPUlRFRCk7XG4gICAgICBpZiAoc29ydERpciA9PT0gQVNDRU5ESU5HKSB7XG4gICAgICAgIHRvZ2dsZVNvcnQoZmlyc3RTb3J0ZWQsIHRydWUpO1xuICAgICAgfSBlbHNlIGlmIChzb3J0RGlyID09PSBERVNDRU5ESU5HKSB7XG4gICAgICAgIHRvZ2dsZVNvcnQoZmlyc3RTb3J0ZWQsIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIFRBQkxFLFxuICAgIFNPUlRBQkxFX0hFQURFUixcbiAgICBTT1JUX0JVVFRPTixcbiAgfVxuKTtcblxubW9kdWxlLmV4cG9ydHMgPSB0YWJsZTtcbiIsImNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL2JlaGF2aW9yXCIpO1xuY29uc3Qgc2VsZWN0T3JNYXRjaGVzID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3NlbGVjdC1vci1tYXRjaGVzXCIpO1xuY29uc3QgeyBwcmVmaXg6IFBSRUZJWCB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2NvbmZpZ1wiKTtcbmNvbnN0IHtcbiAgQ09NQk9fQk9YX0NMQVNTLFxuICBlbmhhbmNlQ29tYm9Cb3gsXG59ID0gcmVxdWlyZShcIi4uLy4uL3VzYS1jb21iby1ib3gvc3JjL2luZGV4XCIpO1xuXG5jb25zdCBUSU1FX1BJQ0tFUl9DTEFTUyA9IGAke1BSRUZJWH0tdGltZS1waWNrZXJgO1xuY29uc3QgVElNRV9QSUNLRVIgPSBgLiR7VElNRV9QSUNLRVJfQ0xBU1N9YDtcbmNvbnN0IE1BWF9USU1FID0gNjAgKiAyNCAtIDE7XG5jb25zdCBNSU5fVElNRSA9IDA7XG5jb25zdCBERUZBVUxUX1NURVAgPSAzMDtcbmNvbnN0IE1JTl9TVEVQID0gMTtcblxuY29uc3QgRklMVEVSX0RBVEFTRVQgPSB7XG4gIGZpbHRlcjpcbiAgICBcIjA/e3sgaG91clF1ZXJ5RmlsdGVyIH19Ont7bWludXRlUXVlcnlGaWx0ZXJ9fS4qe3sgYXBRdWVyeUZpbHRlciB9fW0/XCIsXG4gIGFwUXVlcnlGaWx0ZXI6IFwiKFthcF0pXCIsXG4gIGhvdXJRdWVyeUZpbHRlcjogXCIoWzEtOV1bMC0yXT8pXCIsXG4gIG1pbnV0ZVF1ZXJ5RmlsdGVyOiBcIltcXFxcZF0rOihbMC05XXswLDJ9KVwiLFxufTtcblxuLyoqXG4gKiBQYXJzZSBhIHN0cmluZyBvZiBoaDptbSBpbnRvIG1pbnV0ZXNcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGltZVN0ciB0aGUgdGltZSBzdHJpbmcgdG8gcGFyc2VcbiAqIEByZXR1cm5zIHtudW1iZXJ9IHRoZSBudW1iZXIgb2YgbWludXRlc1xuICovXG5jb25zdCBwYXJzZVRpbWVTdHJpbmcgPSAodGltZVN0cikgPT4ge1xuICBsZXQgbWludXRlcztcblxuICBpZiAodGltZVN0cikge1xuICAgIGNvbnN0IFtob3VycywgbWluc10gPSB0aW1lU3RyLnNwbGl0KFwiOlwiKS5tYXAoKHN0cikgPT4ge1xuICAgICAgbGV0IHZhbHVlO1xuICAgICAgY29uc3QgcGFyc2VkID0gcGFyc2VJbnQoc3RyLCAxMCk7XG4gICAgICBpZiAoIU51bWJlci5pc05hTihwYXJzZWQpKSB2YWx1ZSA9IHBhcnNlZDtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9KTtcblxuICAgIGlmIChob3VycyAhPSBudWxsICYmIG1pbnMgIT0gbnVsbCkge1xuICAgICAgbWludXRlcyA9IGhvdXJzICogNjAgKyBtaW5zO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBtaW51dGVzO1xufTtcblxuLyoqXG4gKiBFbmhhbmNlIGFuIGlucHV0IHdpdGggdGhlIGRhdGUgcGlja2VyIGVsZW1lbnRzXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWwgVGhlIGluaXRpYWwgd3JhcHBpbmcgZWxlbWVudCBvZiB0aGUgZGF0ZSBwaWNrZXIgY29tcG9uZW50XG4gKi9cbmNvbnN0IHRyYW5zZm9ybVRpbWVQaWNrZXIgPSAoZWwpID0+IHtcbiAgY29uc3QgdGltZVBpY2tlckVsID0gZWwuY2xvc2VzdChUSU1FX1BJQ0tFUik7XG5cbiAgY29uc3QgaW5pdGlhbElucHV0RWwgPSB0aW1lUGlja2VyRWwucXVlcnlTZWxlY3RvcihgaW5wdXRgKTtcblxuICBpZiAoIWluaXRpYWxJbnB1dEVsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAke1RJTUVfUElDS0VSfSBpcyBtaXNzaW5nIGlubmVyIGlucHV0YCk7XG4gIH1cblxuICBjb25zdCBzZWxlY3RFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzZWxlY3RcIik7XG5cbiAgW1wiaWRcIiwgXCJuYW1lXCIsIFwicmVxdWlyZWRcIiwgXCJhcmlhLWxhYmVsXCIsIFwiYXJpYS1sYWJlbGxlZGJ5XCJdLmZvckVhY2goXG4gICAgKG5hbWUpID0+IHtcbiAgICAgIGlmIChpbml0aWFsSW5wdXRFbC5oYXNBdHRyaWJ1dGUobmFtZSkpIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBpbml0aWFsSW5wdXRFbC5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgIHNlbGVjdEVsLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG4gICAgICAgIGluaXRpYWxJbnB1dEVsLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICAgIH1cbiAgICB9XG4gICk7XG5cbiAgY29uc3QgcGFkWmVyb3MgPSAodmFsdWUsIGxlbmd0aCkgPT4gYDAwMDAke3ZhbHVlfWAuc2xpY2UoLWxlbmd0aCk7XG5cbiAgY29uc3QgZ2V0VGltZUNvbnRleHQgPSAobWludXRlcykgPT4ge1xuICAgIGNvbnN0IG1pbnV0ZSA9IG1pbnV0ZXMgJSA2MDtcbiAgICBjb25zdCBob3VyMjQgPSBNYXRoLmZsb29yKG1pbnV0ZXMgLyA2MCk7XG4gICAgY29uc3QgaG91cjEyID0gaG91cjI0ICUgMTIgfHwgMTI7XG4gICAgY29uc3QgYW1wbSA9IGhvdXIyNCA8IDEyID8gXCJhbVwiIDogXCJwbVwiO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIG1pbnV0ZSxcbiAgICAgIGhvdXIyNCxcbiAgICAgIGhvdXIxMixcbiAgICAgIGFtcG0sXG4gICAgfTtcbiAgfTtcblxuICBjb25zdCBtaW5UaW1lID0gTWF0aC5tYXgoXG4gICAgTUlOX1RJTUUsXG4gICAgcGFyc2VUaW1lU3RyaW5nKHRpbWVQaWNrZXJFbC5kYXRhc2V0Lm1pblRpbWUpIHx8IE1JTl9USU1FXG4gICk7XG4gIGNvbnN0IG1heFRpbWUgPSBNYXRoLm1pbihcbiAgICBNQVhfVElNRSxcbiAgICBwYXJzZVRpbWVTdHJpbmcodGltZVBpY2tlckVsLmRhdGFzZXQubWF4VGltZSkgfHwgTUFYX1RJTUVcbiAgKTtcbiAgY29uc3Qgc3RlcCA9IE1hdGguZmxvb3IoXG4gICAgTWF0aC5tYXgoTUlOX1NURVAsIHRpbWVQaWNrZXJFbC5kYXRhc2V0LnN0ZXAgfHwgREVGQVVMVF9TVEVQKVxuICApO1xuXG4gIGxldCBkZWZhdWx0VmFsdWU7XG4gIGZvciAobGV0IHRpbWUgPSBtaW5UaW1lOyB0aW1lIDw9IG1heFRpbWU7IHRpbWUgKz0gc3RlcCkge1xuICAgIGNvbnN0IHsgbWludXRlLCBob3VyMjQsIGhvdXIxMiwgYW1wbSB9ID0gZ2V0VGltZUNvbnRleHQodGltZSk7XG5cbiAgICBjb25zdCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwib3B0aW9uXCIpO1xuICAgIG9wdGlvbi52YWx1ZSA9IGAke3BhZFplcm9zKGhvdXIyNCwgMil9OiR7cGFkWmVyb3MobWludXRlLCAyKX1gO1xuICAgIG9wdGlvbi50ZXh0ID0gYCR7aG91cjEyfToke3BhZFplcm9zKG1pbnV0ZSwgMil9JHthbXBtfWA7XG4gICAgaWYgKG9wdGlvbi50ZXh0ID09PSBpbml0aWFsSW5wdXRFbC52YWx1ZSkge1xuICAgICAgZGVmYXVsdFZhbHVlID0gb3B0aW9uLnZhbHVlO1xuICAgIH1cbiAgICBzZWxlY3RFbC5hcHBlbmRDaGlsZChvcHRpb24pO1xuICB9XG5cbiAgdGltZVBpY2tlckVsLmNsYXNzTGlzdC5hZGQoQ09NQk9fQk9YX0NMQVNTKTtcblxuICAvLyBjb21ibyBib3ggcHJvcGVydGllc1xuICBPYmplY3Qua2V5cyhGSUxURVJfREFUQVNFVCkuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgdGltZVBpY2tlckVsLmRhdGFzZXRba2V5XSA9IEZJTFRFUl9EQVRBU0VUW2tleV07XG4gIH0pO1xuICB0aW1lUGlja2VyRWwuZGF0YXNldC5kaXNhYmxlRmlsdGVyaW5nID0gXCJ0cnVlXCI7XG4gIHRpbWVQaWNrZXJFbC5kYXRhc2V0LmRlZmF1bHRWYWx1ZSA9IGRlZmF1bHRWYWx1ZTtcblxuICB0aW1lUGlja2VyRWwuYXBwZW5kQ2hpbGQoc2VsZWN0RWwpO1xuICBpbml0aWFsSW5wdXRFbC5yZW1vdmUoKTtcbn07XG5cbmNvbnN0IHRpbWVQaWNrZXIgPSBiZWhhdmlvcihcbiAge30sXG4gIHtcbiAgICBpbml0KHJvb3QpIHtcbiAgICAgIHNlbGVjdE9yTWF0Y2hlcyhUSU1FX1BJQ0tFUiwgcm9vdCkuZm9yRWFjaCgodGltZVBpY2tlckVsKSA9PiB7XG4gICAgICAgIHRyYW5zZm9ybVRpbWVQaWNrZXIodGltZVBpY2tlckVsKTtcbiAgICAgICAgZW5oYW5jZUNvbWJvQm94KHRpbWVQaWNrZXJFbCk7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIEZJTFRFUl9EQVRBU0VULFxuICB9XG4pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHRpbWVQaWNrZXI7XG4iLCIvLyBUb29sdGlwc1xuY29uc3Qgc2VsZWN0T3JNYXRjaGVzID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3NlbGVjdC1vci1tYXRjaGVzXCIpO1xuY29uc3QgYmVoYXZpb3IgPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvYmVoYXZpb3JcIik7XG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vLi4vdXN3ZHMtY29yZS9zcmMvanMvY29uZmlnXCIpO1xuY29uc3QgaXNFbGVtZW50SW5WaWV3cG9ydCA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9pcy1pbi12aWV3cG9ydFwiKTtcblxuY29uc3QgVE9PTFRJUCA9IGAuJHtQUkVGSVh9LXRvb2x0aXBgO1xuY29uc3QgVE9PTFRJUF9UUklHR0VSID0gYC4ke1BSRUZJWH0tdG9vbHRpcF9fdHJpZ2dlcmA7XG5jb25zdCBUT09MVElQX1RSSUdHRVJfQ0xBU1MgPSBgJHtQUkVGSVh9LXRvb2x0aXBfX3RyaWdnZXJgO1xuY29uc3QgVE9PTFRJUF9DTEFTUyA9IGAke1BSRUZJWH0tdG9vbHRpcGA7XG5jb25zdCBUT09MVElQX0JPRFlfQ0xBU1MgPSBgJHtQUkVGSVh9LXRvb2x0aXBfX2JvZHlgO1xuY29uc3QgU0VUX0NMQVNTID0gXCJpcy1zZXRcIjtcbmNvbnN0IFZJU0lCTEVfQ0xBU1MgPSBcImlzLXZpc2libGVcIjtcbmNvbnN0IFRSSUFOR0xFX1NJWkUgPSA1O1xuY29uc3QgQURKVVNUX1dJRFRIX0NMQVNTID0gYCR7UFJFRklYfS10b29sdGlwX19ib2R5LS13cmFwYDtcblxuLyoqXG4gKlxuICogQHBhcmFtIHtET01FbGVtZW50fSB0cmlnZ2VyIC0gVGhlIHRvb2x0aXAgdHJpZ2dlclxuICogQHJldHVybnMge29iamVjdH0gRWxlbWVudHMgZm9yIGluaXRpYWxpemVkIHRvb2x0aXA7IGluY2x1ZGVzIHRyaWdnZXIsIHdyYXBwZXIsIGFuZCBib2R5XG4gKi9cbmNvbnN0IGdldFRvb2x0aXBFbGVtZW50cyA9ICh0cmlnZ2VyKSA9PiB7XG4gIGNvbnN0IHdyYXBwZXIgPSB0cmlnZ2VyLnBhcmVudE5vZGU7XG4gIGNvbnN0IGJvZHkgPSB3cmFwcGVyLnF1ZXJ5U2VsZWN0b3IoYC4ke1RPT0xUSVBfQk9EWV9DTEFTU31gKTtcblxuICByZXR1cm4geyB0cmlnZ2VyLCB3cmFwcGVyLCBib2R5IH07XG59O1xuXG4vKipcbiAqIFNob3dzIHRoZSB0b29sdGlwXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSB0b29sdGlwVHJpZ2dlciAtIHRoZSBlbGVtZW50IHRoYXQgaW5pdGlhbGl6ZXMgdGhlIHRvb2x0aXBcbiAqL1xuY29uc3Qgc2hvd1Rvb2xUaXAgPSAodG9vbHRpcEJvZHksIHRvb2x0aXBUcmlnZ2VyLCBwb3NpdGlvbikgPT4ge1xuICB0b29sdGlwQm9keS5zZXRBdHRyaWJ1dGUoXCJhcmlhLWhpZGRlblwiLCBcImZhbHNlXCIpO1xuXG4gIC8vIFRoaXMgc2V0cyB1cCB0aGUgdG9vbHRpcCBib2R5LiBUaGUgb3BhY2l0eSBpcyAwLCBidXRcbiAgLy8gd2UgY2FuIGJlZ2luIHJ1bm5pbmcgdGhlIGNhbGN1bGF0aW9ucyBiZWxvdy5cbiAgdG9vbHRpcEJvZHkuY2xhc3NMaXN0LmFkZChTRVRfQ0xBU1MpO1xuXG4gIC8qKlxuICAgKiBQb3NpdGlvbiB0aGUgdG9vbHRpcCBib2R5IHdoZW4gdGhlIHRyaWdnZXIgaXMgaG92ZXJlZFxuICAgKiBSZW1vdmVzIG9sZCBwb3NpdGlvbmluZyBjbGFzc25hbWVzIGFuZCByZWFwcGxpZXMuIFRoaXMgYWxsb3dzXG4gICAqIHBvc2l0aW9uaW5nIHRvIGNoYW5nZSBpbiBjYXNlIHRoZSB1c2VyIHJlc2l6ZXMgYnJvd3NlciBvciBET00gbWFuaXB1bGF0aW9uXG4gICAqIGNhdXNlcyB0b29sdGlwIHRvIGdldCBjbGlwcGVkIGZyb20gdmlld3BvcnRcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNldFBvcyAtIGNhbiBiZSBcInRvcFwiLCBcImJvdHRvbVwiLCBcInJpZ2h0XCIsIFwibGVmdFwiXG4gICAqL1xuICBjb25zdCBzZXRQb3NpdGlvbkNsYXNzID0gKHNldFBvcykgPT4ge1xuICAgIHRvb2x0aXBCb2R5LmNsYXNzTGlzdC5yZW1vdmUoYCR7VE9PTFRJUF9CT0RZX0NMQVNTfS0tdG9wYCk7XG4gICAgdG9vbHRpcEJvZHkuY2xhc3NMaXN0LnJlbW92ZShgJHtUT09MVElQX0JPRFlfQ0xBU1N9LS1ib3R0b21gKTtcbiAgICB0b29sdGlwQm9keS5jbGFzc0xpc3QucmVtb3ZlKGAke1RPT0xUSVBfQk9EWV9DTEFTU30tLXJpZ2h0YCk7XG4gICAgdG9vbHRpcEJvZHkuY2xhc3NMaXN0LnJlbW92ZShgJHtUT09MVElQX0JPRFlfQ0xBU1N9LS1sZWZ0YCk7XG4gICAgdG9vbHRpcEJvZHkuY2xhc3NMaXN0LmFkZChgJHtUT09MVElQX0JPRFlfQ0xBU1N9LS0ke3NldFBvc31gKTtcbiAgfTtcblxuICAvKipcbiAgICogUmVtb3ZlcyBvbGQgcG9zaXRpb25pbmcgc3R5bGVzLiBUaGlzIGFsbG93c1xuICAgKiByZS1wb3NpdGlvbmluZyB0byBjaGFuZ2Ugd2l0aG91dCBpbmhlcml0aW5nIG90aGVyXG4gICAqIGR5bmFtaWMgc3R5bGVzXG4gICAqXG4gICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGUgLSB0aGlzIGlzIHRoZSB0b29sdGlwIGJvZHlcbiAgICovXG4gIGNvbnN0IHJlc2V0UG9zaXRpb25TdHlsZXMgPSAoZSkgPT4ge1xuICAgIC8vIHdlIGRvbid0IG92ZXJyaWRlIGFueXRoaW5nIGluIHRoZSBzdHlsZXNoZWV0IHdoZW4gZmluZGluZyBhbHQgcG9zaXRpb25zXG4gICAgZS5zdHlsZS50b3AgPSBudWxsO1xuICAgIGUuc3R5bGUuYm90dG9tID0gbnVsbDtcbiAgICBlLnN0eWxlLnJpZ2h0ID0gbnVsbDtcbiAgICBlLnN0eWxlLmxlZnQgPSBudWxsO1xuICAgIGUuc3R5bGUubWFyZ2luID0gbnVsbDtcbiAgfTtcblxuICAvKipcbiAgICogZ2V0IG1hcmdpbiBvZmZzZXQgY2FsY3VsYXRpb25zXG4gICAqXG4gICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHRhcmdldCAtIHRoaXMgaXMgdGhlIHRvb2x0aXAgYm9keVxuICAgKiBAcGFyYW0ge1N0cmluZ30gcHJvcGVydHlWYWx1ZSAtIHRoaXMgaXMgdGhlIHRvb2x0aXAgYm9keVxuICAgKi9cblxuICBjb25zdCBvZmZzZXRNYXJnaW4gPSAodGFyZ2V0LCBwcm9wZXJ0eVZhbHVlKSA9PlxuICAgIHBhcnNlSW50KFxuICAgICAgd2luZG93LmdldENvbXB1dGVkU3R5bGUodGFyZ2V0KS5nZXRQcm9wZXJ0eVZhbHVlKHByb3BlcnR5VmFsdWUpLFxuICAgICAgMTBcbiAgICApO1xuXG4gIC8vIG9mZnNldExlZnQgPSB0aGUgbGVmdCBwb3NpdGlvbiwgYW5kIG1hcmdpbiBvZiB0aGUgZWxlbWVudCwgdGhlIGxlZnRcbiAgLy8gcGFkZGluZywgc2Nyb2xsYmFyIGFuZCBib3JkZXIgb2YgdGhlIG9mZnNldFBhcmVudCBlbGVtZW50XG4gIC8vIG9mZnNldFdpZHRoID0gVGhlIG9mZnNldFdpZHRoIHByb3BlcnR5IHJldHVybnMgdGhlIHZpZXdhYmxlIHdpZHRoIG9mIGFuXG4gIC8vIGVsZW1lbnQgaW4gcGl4ZWxzLCBpbmNsdWRpbmcgcGFkZGluZywgYm9yZGVyIGFuZCBzY3JvbGxiYXIsIGJ1dCBub3RcbiAgLy8gdGhlIG1hcmdpbi5cblxuICAvKipcbiAgICogQ2FsY3VsYXRlIG1hcmdpbiBvZmZzZXRcbiAgICogdG9vbHRpcCB0cmlnZ2VyIG1hcmdpbihwb3NpdGlvbikgb2Zmc2V0ICsgdG9vbHRpcEJvZHkgb2Zmc2V0V2lkdGhcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1hcmdpblBvc2l0aW9uXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB0b29sdGlwQm9keU9mZnNldFxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSB0cmlnZ2VyXG4gICAqL1xuICBjb25zdCBjYWxjdWxhdGVNYXJnaW5PZmZzZXQgPSAoXG4gICAgbWFyZ2luUG9zaXRpb24sXG4gICAgdG9vbHRpcEJvZHlPZmZzZXQsXG4gICAgdHJpZ2dlclxuICApID0+IHtcbiAgICBjb25zdCBvZmZzZXQgPVxuICAgICAgb2Zmc2V0TWFyZ2luKHRyaWdnZXIsIGBtYXJnaW4tJHttYXJnaW5Qb3NpdGlvbn1gKSA+IDBcbiAgICAgICAgPyB0b29sdGlwQm9keU9mZnNldCAtIG9mZnNldE1hcmdpbih0cmlnZ2VyLCBgbWFyZ2luLSR7bWFyZ2luUG9zaXRpb259YClcbiAgICAgICAgOiB0b29sdGlwQm9keU9mZnNldDtcblxuICAgIHJldHVybiBvZmZzZXQ7XG4gIH07XG5cbiAgLyoqXG4gICAqIFBvc2l0aW9ucyB0b29sdGlwIGF0IHRoZSB0b3BcbiAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZSAtIHRoaXMgaXMgdGhlIHRvb2x0aXAgYm9keVxuICAgKi9cbiAgY29uc3QgcG9zaXRpb25Ub3AgPSAoZSkgPT4ge1xuICAgIHJlc2V0UG9zaXRpb25TdHlsZXMoZSk7IC8vIGVuc3VyZXMgd2Ugc3RhcnQgZnJvbSB0aGUgc2FtZSBwb2ludFxuICAgIC8vIGdldCBkZXRhaWxzIG9uIHRoZSBlbGVtZW50cyBvYmplY3Qgd2l0aFxuXG4gICAgY29uc3QgdG9wTWFyZ2luID0gY2FsY3VsYXRlTWFyZ2luT2Zmc2V0KFxuICAgICAgXCJ0b3BcIixcbiAgICAgIGUub2Zmc2V0SGVpZ2h0LFxuICAgICAgdG9vbHRpcFRyaWdnZXJcbiAgICApO1xuXG4gICAgY29uc3QgbGVmdE1hcmdpbiA9IGNhbGN1bGF0ZU1hcmdpbk9mZnNldChcbiAgICAgIFwibGVmdFwiLFxuICAgICAgZS5vZmZzZXRXaWR0aCxcbiAgICAgIHRvb2x0aXBUcmlnZ2VyXG4gICAgKTtcblxuICAgIHNldFBvc2l0aW9uQ2xhc3MoXCJ0b3BcIik7XG4gICAgZS5zdHlsZS5sZWZ0ID0gYDUwJWA7IC8vIGNlbnRlciB0aGUgZWxlbWVudFxuICAgIGUuc3R5bGUudG9wID0gYC0ke1RSSUFOR0xFX1NJWkV9cHhgOyAvLyBjb25zaWRlciB0aGUgcHNldWRvIGVsZW1lbnRcbiAgICAvLyBhcHBseSBvdXIgbWFyZ2lucyBiYXNlZCBvbiB0aGUgb2Zmc2V0XG4gICAgZS5zdHlsZS5tYXJnaW4gPSBgLSR7dG9wTWFyZ2lufXB4IDAgMCAtJHtsZWZ0TWFyZ2luIC8gMn1weGA7XG4gIH07XG5cbiAgLyoqXG4gICAqIFBvc2l0aW9ucyB0b29sdGlwIGF0IHRoZSBib3R0b21cbiAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZSAtIHRoaXMgaXMgdGhlIHRvb2x0aXAgYm9keVxuICAgKi9cbiAgY29uc3QgcG9zaXRpb25Cb3R0b20gPSAoZSkgPT4ge1xuICAgIHJlc2V0UG9zaXRpb25TdHlsZXMoZSk7XG5cbiAgICBjb25zdCBsZWZ0TWFyZ2luID0gY2FsY3VsYXRlTWFyZ2luT2Zmc2V0KFxuICAgICAgXCJsZWZ0XCIsXG4gICAgICBlLm9mZnNldFdpZHRoLFxuICAgICAgdG9vbHRpcFRyaWdnZXJcbiAgICApO1xuXG4gICAgc2V0UG9zaXRpb25DbGFzcyhcImJvdHRvbVwiKTtcbiAgICBlLnN0eWxlLmxlZnQgPSBgNTAlYDtcbiAgICBlLnN0eWxlLm1hcmdpbiA9IGAke1RSSUFOR0xFX1NJWkV9cHggMCAwIC0ke2xlZnRNYXJnaW4gLyAyfXB4YDtcbiAgfTtcblxuICAvKipcbiAgICogUG9zaXRpb25zIHRvb2x0aXAgYXQgdGhlIHJpZ2h0XG4gICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGUgLSB0aGlzIGlzIHRoZSB0b29sdGlwIGJvZHlcbiAgICovXG4gIGNvbnN0IHBvc2l0aW9uUmlnaHQgPSAoZSkgPT4ge1xuICAgIHJlc2V0UG9zaXRpb25TdHlsZXMoZSk7XG5cbiAgICBjb25zdCB0b3BNYXJnaW4gPSBjYWxjdWxhdGVNYXJnaW5PZmZzZXQoXG4gICAgICBcInRvcFwiLFxuICAgICAgZS5vZmZzZXRIZWlnaHQsXG4gICAgICB0b29sdGlwVHJpZ2dlclxuICAgICk7XG5cbiAgICBzZXRQb3NpdGlvbkNsYXNzKFwicmlnaHRcIik7XG4gICAgZS5zdHlsZS50b3AgPSBgNTAlYDtcbiAgICBlLnN0eWxlLmxlZnQgPSBgJHtcbiAgICAgIHRvb2x0aXBUcmlnZ2VyLm9mZnNldExlZnQgKyB0b29sdGlwVHJpZ2dlci5vZmZzZXRXaWR0aCArIFRSSUFOR0xFX1NJWkVcbiAgICB9cHhgO1xuICAgIGUuc3R5bGUubWFyZ2luID0gYC0ke3RvcE1hcmdpbiAvIDJ9cHggMCAwIDBgO1xuICB9O1xuXG4gIC8qKlxuICAgKiBQb3NpdGlvbnMgdG9vbHRpcCBhdCB0aGUgcmlnaHRcbiAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZSAtIHRoaXMgaXMgdGhlIHRvb2x0aXAgYm9keVxuICAgKi9cbiAgY29uc3QgcG9zaXRpb25MZWZ0ID0gKGUpID0+IHtcbiAgICByZXNldFBvc2l0aW9uU3R5bGVzKGUpO1xuXG4gICAgY29uc3QgdG9wTWFyZ2luID0gY2FsY3VsYXRlTWFyZ2luT2Zmc2V0KFxuICAgICAgXCJ0b3BcIixcbiAgICAgIGUub2Zmc2V0SGVpZ2h0LFxuICAgICAgdG9vbHRpcFRyaWdnZXJcbiAgICApO1xuXG4gICAgLy8gd2UgaGF2ZSB0byBjaGVjayBmb3Igc29tZSB1dGlsaXR5IG1hcmdpbnNcbiAgICBjb25zdCBsZWZ0TWFyZ2luID0gY2FsY3VsYXRlTWFyZ2luT2Zmc2V0KFxuICAgICAgXCJsZWZ0XCIsXG4gICAgICB0b29sdGlwVHJpZ2dlci5vZmZzZXRMZWZ0ID4gZS5vZmZzZXRXaWR0aFxuICAgICAgICA/IHRvb2x0aXBUcmlnZ2VyLm9mZnNldExlZnQgLSBlLm9mZnNldFdpZHRoXG4gICAgICAgIDogZS5vZmZzZXRXaWR0aCxcbiAgICAgIHRvb2x0aXBUcmlnZ2VyXG4gICAgKTtcblxuICAgIHNldFBvc2l0aW9uQ2xhc3MoXCJsZWZ0XCIpO1xuICAgIGUuc3R5bGUudG9wID0gYDUwJWA7XG4gICAgZS5zdHlsZS5sZWZ0ID0gYC0ke1RSSUFOR0xFX1NJWkV9cHhgO1xuICAgIGUuc3R5bGUubWFyZ2luID0gYC0ke3RvcE1hcmdpbiAvIDJ9cHggMCAwICR7XG4gICAgICB0b29sdGlwVHJpZ2dlci5vZmZzZXRMZWZ0ID4gZS5vZmZzZXRXaWR0aCA/IGxlZnRNYXJnaW4gOiAtbGVmdE1hcmdpblxuICAgIH1weGA7IC8vIGFkanVzdCB0aGUgbWFyZ2luXG4gIH07XG5cbiAgLyoqXG4gICAqIFdlIHRyeSB0byBzZXQgdGhlIHBvc2l0aW9uIGJhc2VkIG9uIHRoZVxuICAgKiBvcmlnaW5hbCBpbnRlbnRpb24sIGJ1dCBtYWtlIGFkanVzdG1lbnRzXG4gICAqIGlmIHRoZSBlbGVtZW50IGlzIGNsaXBwZWQgb3V0IG9mIHRoZSB2aWV3cG9ydFxuICAgKiB3ZSBjb25zdHJhaW4gdGhlIHdpZHRoIG9ubHkgYXMgYSBsYXN0IHJlc29ydFxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50KGFsaWFzIHRvb2x0aXBCb2R5KVxuICAgKiBAcGFyYW0ge051bWJlcn0gYXR0ZW1wdCAoLS1mbGFnKVxuICAgKi9cblxuICBjb25zdCBtYXhBdHRlbXB0cyA9IDI7XG5cbiAgZnVuY3Rpb24gZmluZEJlc3RQb3NpdGlvbihlbGVtZW50LCBhdHRlbXB0ID0gMSkge1xuICAgIC8vIGNyZWF0ZSBhcnJheSBvZiBvcHRpb25hbCBwb3NpdGlvbnNcbiAgICBjb25zdCBwb3NpdGlvbnMgPSBbXG4gICAgICBwb3NpdGlvblRvcCxcbiAgICAgIHBvc2l0aW9uQm90dG9tLFxuICAgICAgcG9zaXRpb25SaWdodCxcbiAgICAgIHBvc2l0aW9uTGVmdCxcbiAgICBdO1xuXG4gICAgbGV0IGhhc1Zpc2libGVQb3NpdGlvbiA9IGZhbHNlO1xuXG4gICAgLy8gd2UgdGFrZSBhIHJlY3Vyc2l2ZSBhcHByb2FjaFxuICAgIGZ1bmN0aW9uIHRyeVBvc2l0aW9ucyhpKSB7XG4gICAgICBpZiAoaSA8IHBvc2l0aW9ucy5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgcG9zID0gcG9zaXRpb25zW2ldO1xuICAgICAgICBwb3MoZWxlbWVudCk7XG5cbiAgICAgICAgaWYgKCFpc0VsZW1lbnRJblZpZXdwb3J0KGVsZW1lbnQpKSB7XG4gICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICAgICAgdHJ5UG9zaXRpb25zKChpICs9IDEpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBoYXNWaXNpYmxlUG9zaXRpb24gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdHJ5UG9zaXRpb25zKDApO1xuICAgIC8vIGlmIHdlIGNhbid0IGZpbmQgYSBwb3NpdGlvbiB3ZSBjb21wcmVzcyBpdCBhbmQgdHJ5IGFnYWluXG4gICAgaWYgKCFoYXNWaXNpYmxlUG9zaXRpb24pIHtcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChBREpVU1RfV0lEVEhfQ0xBU1MpO1xuICAgICAgaWYgKGF0dGVtcHQgPD0gbWF4QXR0ZW1wdHMpIHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICAgIGZpbmRCZXN0UG9zaXRpb24oZWxlbWVudCwgKGF0dGVtcHQgKz0gMSkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHN3aXRjaCAocG9zaXRpb24pIHtcbiAgICBjYXNlIFwidG9wXCI6XG4gICAgICBwb3NpdGlvblRvcCh0b29sdGlwQm9keSk7XG4gICAgICBpZiAoIWlzRWxlbWVudEluVmlld3BvcnQodG9vbHRpcEJvZHkpKSB7XG4gICAgICAgIGZpbmRCZXN0UG9zaXRpb24odG9vbHRpcEJvZHkpO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImJvdHRvbVwiOlxuICAgICAgcG9zaXRpb25Cb3R0b20odG9vbHRpcEJvZHkpO1xuICAgICAgaWYgKCFpc0VsZW1lbnRJblZpZXdwb3J0KHRvb2x0aXBCb2R5KSkge1xuICAgICAgICBmaW5kQmVzdFBvc2l0aW9uKHRvb2x0aXBCb2R5KTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJyaWdodFwiOlxuICAgICAgcG9zaXRpb25SaWdodCh0b29sdGlwQm9keSk7XG4gICAgICBpZiAoIWlzRWxlbWVudEluVmlld3BvcnQodG9vbHRpcEJvZHkpKSB7XG4gICAgICAgIGZpbmRCZXN0UG9zaXRpb24odG9vbHRpcEJvZHkpO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImxlZnRcIjpcbiAgICAgIHBvc2l0aW9uTGVmdCh0b29sdGlwQm9keSk7XG4gICAgICBpZiAoIWlzRWxlbWVudEluVmlld3BvcnQodG9vbHRpcEJvZHkpKSB7XG4gICAgICAgIGZpbmRCZXN0UG9zaXRpb24odG9vbHRpcEJvZHkpO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG5cbiAgICBkZWZhdWx0OlxuICAgICAgLy8gc2tpcCBkZWZhdWx0IGNhc2VcbiAgICAgIGJyZWFrO1xuICB9XG5cbiAgLyoqXG4gICAqIEFjdHVhbGx5IHNob3cgdGhlIHRvb2x0aXAuIFRoZSBWSVNJQkxFX0NMQVNTXG4gICAqIHdpbGwgY2hhbmdlIHRoZSBvcGFjaXR5IHRvIDFcbiAgICovXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIHRvb2x0aXBCb2R5LmNsYXNzTGlzdC5hZGQoVklTSUJMRV9DTEFTUyk7XG4gIH0sIDIwKTtcbn07XG5cbi8qKlxuICogUmVtb3ZlcyBhbGwgdGhlIHByb3BlcnRpZXMgdG8gc2hvdyBhbmQgcG9zaXRpb24gdGhlIHRvb2x0aXAsXG4gKiBhbmQgcmVzZXRzIHRoZSB0b29sdGlwIHBvc2l0aW9uIHRvIHRoZSBvcmlnaW5hbCBpbnRlbnRpb25cbiAqIGluIGNhc2UgdGhlIHdpbmRvdyBpcyByZXNpemVkIG9yIHRoZSBlbGVtZW50IGlzIG1vdmVkIHRocm91Z2hcbiAqIERPTSBtYW5pcHVsYXRpb24uXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSB0b29sdGlwQm9keSAtIFRoZSBib2R5IG9mIHRoZSB0b29sdGlwXG4gKi9cbmNvbnN0IGhpZGVUb29sVGlwID0gKHRvb2x0aXBCb2R5KSA9PiB7XG4gIHRvb2x0aXBCb2R5LmNsYXNzTGlzdC5yZW1vdmUoVklTSUJMRV9DTEFTUyk7XG4gIHRvb2x0aXBCb2R5LmNsYXNzTGlzdC5yZW1vdmUoU0VUX0NMQVNTKTtcbiAgdG9vbHRpcEJvZHkuY2xhc3NMaXN0LnJlbW92ZShBREpVU1RfV0lEVEhfQ0xBU1MpO1xuICB0b29sdGlwQm9keS5zZXRBdHRyaWJ1dGUoXCJhcmlhLWhpZGRlblwiLCBcInRydWVcIik7XG59O1xuXG4vKipcbiAqIFNldHVwIHRoZSB0b29sdGlwIGNvbXBvbmVudFxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gdG9vbHRpcFRyaWdnZXIgVGhlIGVsZW1lbnQgdGhhdCBjcmVhdGVzIHRoZSB0b29sdGlwXG4gKi9cbmNvbnN0IHNldFVwQXR0cmlidXRlcyA9ICh0b29sdGlwVHJpZ2dlcikgPT4ge1xuICBjb25zdCB0b29sdGlwSUQgPSBgdG9vbHRpcC0ke01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDkwMDAwMCkgKyAxMDAwMDB9YDtcbiAgY29uc3QgdG9vbHRpcENvbnRlbnQgPSB0b29sdGlwVHJpZ2dlci5nZXRBdHRyaWJ1dGUoXCJ0aXRsZVwiKTtcbiAgY29uc3Qgd3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICBjb25zdCB0b29sdGlwQm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICBjb25zdCBwb3NpdGlvbiA9IHRvb2x0aXBUcmlnZ2VyLmdldEF0dHJpYnV0ZShcImRhdGEtcG9zaXRpb25cIilcbiAgICA/IHRvb2x0aXBUcmlnZ2VyLmdldEF0dHJpYnV0ZShcImRhdGEtcG9zaXRpb25cIilcbiAgICA6IFwidG9wXCI7XG4gIGNvbnN0IGFkZGl0aW9uYWxDbGFzc2VzID0gdG9vbHRpcFRyaWdnZXIuZ2V0QXR0cmlidXRlKFwiZGF0YS1jbGFzc2VzXCIpO1xuXG4gIC8vIFNldCB1cCB0b29sdGlwIGF0dHJpYnV0ZXNcbiAgdG9vbHRpcFRyaWdnZXIuc2V0QXR0cmlidXRlKFwiYXJpYS1kZXNjcmliZWRieVwiLCB0b29sdGlwSUQpO1xuICB0b29sdGlwVHJpZ2dlci5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCBcIjBcIik7XG4gIHRvb2x0aXBUcmlnZ2VyLnJlbW92ZUF0dHJpYnV0ZShcInRpdGxlXCIpO1xuICB0b29sdGlwVHJpZ2dlci5jbGFzc0xpc3QucmVtb3ZlKFRPT0xUSVBfQ0xBU1MpO1xuICB0b29sdGlwVHJpZ2dlci5jbGFzc0xpc3QuYWRkKFRPT0xUSVBfVFJJR0dFUl9DTEFTUyk7XG5cbiAgLy8gaW5zZXJ0IHdyYXBwZXIgYmVmb3JlIGVsIGluIHRoZSBET00gdHJlZVxuICB0b29sdGlwVHJpZ2dlci5wYXJlbnROb2RlLmluc2VydEJlZm9yZSh3cmFwcGVyLCB0b29sdGlwVHJpZ2dlcik7XG5cbiAgLy8gc2V0IHVwIHRoZSB3cmFwcGVyXG4gIHdyYXBwZXIuYXBwZW5kQ2hpbGQodG9vbHRpcFRyaWdnZXIpO1xuICB3cmFwcGVyLmNsYXNzTGlzdC5hZGQoVE9PTFRJUF9DTEFTUyk7XG4gIHdyYXBwZXIuYXBwZW5kQ2hpbGQodG9vbHRpcEJvZHkpO1xuXG4gIC8vIEFwcGx5IGFkZGl0aW9uYWwgY2xhc3MgbmFtZXMgdG8gd3JhcHBlciBlbGVtZW50XG4gIGlmIChhZGRpdGlvbmFsQ2xhc3Nlcykge1xuICAgIGNvbnN0IGNsYXNzZXNBcnJheSA9IGFkZGl0aW9uYWxDbGFzc2VzLnNwbGl0KFwiIFwiKTtcbiAgICBjbGFzc2VzQXJyYXkuZm9yRWFjaCgoY2xhc3NuYW1lKSA9PiB3cmFwcGVyLmNsYXNzTGlzdC5hZGQoY2xhc3NuYW1lKSk7XG4gIH1cblxuICAvLyBzZXQgdXAgdGhlIHRvb2x0aXAgYm9keVxuICB0b29sdGlwQm9keS5jbGFzc0xpc3QuYWRkKFRPT0xUSVBfQk9EWV9DTEFTUyk7XG4gIHRvb2x0aXBCb2R5LnNldEF0dHJpYnV0ZShcImlkXCIsIHRvb2x0aXBJRCk7XG4gIHRvb2x0aXBCb2R5LnNldEF0dHJpYnV0ZShcInJvbGVcIiwgXCJ0b29sdGlwXCIpO1xuICB0b29sdGlwQm9keS5zZXRBdHRyaWJ1dGUoXCJhcmlhLWhpZGRlblwiLCBcInRydWVcIik7XG5cbiAgLy8gcGxhY2UgdGhlIHRleHQgaW4gdGhlIHRvb2x0aXBcbiAgdG9vbHRpcEJvZHkudGV4dENvbnRlbnQgPSB0b29sdGlwQ29udGVudDtcblxuICByZXR1cm4geyB0b29sdGlwQm9keSwgcG9zaXRpb24sIHRvb2x0aXBDb250ZW50LCB3cmFwcGVyIH07XG59O1xuXG4vLyBTZXR1cCBvdXIgZnVuY3Rpb24gdG8gcnVuIG9uIHZhcmlvdXMgZXZlbnRzXG5jb25zdCB0b29sdGlwID0gYmVoYXZpb3IoXG4gIHtcbiAgICBcIm1vdXNlb3ZlciBmb2N1c2luXCI6IHtcbiAgICAgIFtUT09MVElQXShlKSB7XG4gICAgICAgIGNvbnN0IHRyaWdnZXIgPSBlLnRhcmdldDtcbiAgICAgICAgY29uc3QgZWxlbWVudFR5cGUgPSB0cmlnZ2VyLm5vZGVOYW1lO1xuXG4gICAgICAgIC8vIEluaXRpYWxpemUgdG9vbHRpcCBpZiBpdCBoYXNuJ3QgYWxyZWFkeVxuICAgICAgICBpZiAoZWxlbWVudFR5cGUgPT09IFwiQlVUVE9OXCIgJiYgdHJpZ2dlci5oYXNBdHRyaWJ1dGUoXCJ0aXRsZVwiKSkge1xuICAgICAgICAgIHNldFVwQXR0cmlidXRlcyh0cmlnZ2VyKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFtUT09MVElQX1RSSUdHRVJdKGUpIHtcbiAgICAgICAgY29uc3QgeyB0cmlnZ2VyLCBib2R5IH0gPSBnZXRUb29sdGlwRWxlbWVudHMoZS50YXJnZXQpO1xuXG4gICAgICAgIHNob3dUb29sVGlwKGJvZHksIHRyaWdnZXIsIHRyaWdnZXIuZGF0YXNldC5wb3NpdGlvbik7XG4gICAgICB9LFxuICAgIH0sXG4gICAgXCJtb3VzZW91dCBmb2N1c291dFwiOiB7XG4gICAgICBbVE9PTFRJUF9UUklHR0VSXShlKSB7XG4gICAgICAgIGNvbnN0IHsgYm9keSB9ID0gZ2V0VG9vbHRpcEVsZW1lbnRzKGUudGFyZ2V0KTtcblxuICAgICAgICBoaWRlVG9vbFRpcChib2R5KTtcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAge1xuICAgIGluaXQocm9vdCkge1xuICAgICAgc2VsZWN0T3JNYXRjaGVzKFRPT0xUSVAsIHJvb3QpLmZvckVhY2goKHRvb2x0aXBUcmlnZ2VyKSA9PiB7XG4gICAgICAgIHNldFVwQXR0cmlidXRlcyh0b29sdGlwVHJpZ2dlcik7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHNldHVwOiBzZXRVcEF0dHJpYnV0ZXMsXG4gICAgZ2V0VG9vbHRpcEVsZW1lbnRzLFxuICAgIHNob3c6IHNob3dUb29sVGlwLFxuICAgIGhpZGU6IGhpZGVUb29sVGlwLFxuICB9XG4pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHRvb2x0aXA7XG4iLCJjb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9iZWhhdmlvclwiKTtcbmNvbnN0IHZhbGlkYXRlID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3ZhbGlkYXRlLWlucHV0XCIpO1xuY29uc3QgeyBwcmVmaXg6IFBSRUZJWCB9ID0gcmVxdWlyZShcIi4uLy4uL3Vzd2RzLWNvcmUvc3JjL2pzL2NvbmZpZ1wiKTtcbmNvbnN0IHNlbGVjdE9yTWF0Y2hlcyA9IHJlcXVpcmUoXCIuLi8uLi91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9zZWxlY3Qtb3ItbWF0Y2hlc1wiKTtcblxuY29uc3QgVkFMSURBVEVfSU5QVVQgPSBcImlucHV0W2RhdGEtdmFsaWRhdGlvbi1lbGVtZW50XVwiO1xuY29uc3QgQ0hFQ0tMSVNUX0lURU0gPSBgLiR7UFJFRklYfS1jaGVja2xpc3RfX2l0ZW1gO1xuXG4vLyBUcmlnZ2VyIHZhbGlkYXRpb24gb24gaW5wdXQgY2hhbmdlXG5jb25zdCBoYW5kbGVDaGFuZ2UgPSAoZWwpID0+IHZhbGlkYXRlKGVsKTtcblxuLy8gQ3JlYXRlIGNvbnRhaW5lciB0byBob2xkIGFyaWEgcmVhZG91dFxuY29uc3QgY3JlYXRlU3RhdHVzRWxlbWVudCA9IChpbnB1dCkgPT4ge1xuICBjb25zdCB2YWxpZGF0aW9uQ29udGFpbmVyID0gaW5wdXQucGFyZW50Tm9kZTtcbiAgY29uc3QgaW5wdXRJRCA9IGlucHV0LmdldEF0dHJpYnV0ZShcImlkXCIpO1xuICBjb25zdCBzdGF0dXNTdW1tYXJ5SUQgPSBgJHtpbnB1dElEfS1zci1zdW1tYXJ5YDtcbiAgaW5wdXQuc2V0QXR0cmlidXRlKFwiYXJpYS1kZXNjcmliZWRieVwiLCBzdGF0dXNTdW1tYXJ5SUQpO1xuXG4gIGNvbnN0IHN0YXR1c1N1bW1hcnlDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcblxuICBzdGF0dXNTdW1tYXJ5Q29udGFpbmVyLnNldEF0dHJpYnV0ZShcImRhdGEtdmFsaWRhdGlvbi1zdGF0dXNcIiwgXCJcIik7XG4gIHN0YXR1c1N1bW1hcnlDb250YWluZXIuY2xhc3NMaXN0LmFkZChcInVzYS1zci1vbmx5XCIpO1xuICBzdGF0dXNTdW1tYXJ5Q29udGFpbmVyLnNldEF0dHJpYnV0ZShcImFyaWEtbGl2ZVwiLCBcInBvbGl0ZVwiKTtcbiAgc3RhdHVzU3VtbWFyeUNvbnRhaW5lci5zZXRBdHRyaWJ1dGUoXCJhcmlhLWF0b21pY1wiLCB0cnVlKTtcbiAgc3RhdHVzU3VtbWFyeUNvbnRhaW5lci5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBzdGF0dXNTdW1tYXJ5SUQpO1xuICB2YWxpZGF0aW9uQ29udGFpbmVyLmFwcGVuZChzdGF0dXNTdW1tYXJ5Q29udGFpbmVyKTtcbn07XG5cbi8vIFNldCB1cCBjaGVja2xpc3QgaXRlbXMgd2l0aCBpbml0aWFsIGFyaWEtbGFiZWwgKGluY29tcGxldGUpIHZhbHVlc1xuY29uc3QgY3JlYXRlSW5pdGlhbFN0YXR1cyA9IChpbnB1dCkgPT4ge1xuICBjb25zdCB2YWxpZGF0aW9uQ29udGFpbmVyID0gaW5wdXQucGFyZW50Tm9kZTtcbiAgY29uc3QgY2hlY2tsaXN0SXRlbXMgPSB2YWxpZGF0aW9uQ29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoQ0hFQ0tMSVNUX0lURU0pO1xuICBjb25zdCB2YWxpZGF0aW9uRWxlbWVudCA9IGlucHV0LmdldEF0dHJpYnV0ZShcImRhdGEtdmFsaWRhdGlvbi1lbGVtZW50XCIpO1xuXG4gIGlucHV0LnNldEF0dHJpYnV0ZShcImFyaWEtY29udHJvbHNcIiwgdmFsaWRhdGlvbkVsZW1lbnQpO1xuXG4gIGNoZWNrbGlzdEl0ZW1zLmZvckVhY2goKGxpc3RJdGVtKSA9PiB7XG4gICAgbGV0IGN1cnJlbnRTdGF0dXMgPSBcInN0YXR1cyBpbmNvbXBsZXRlXCI7XG4gICAgaWYgKGlucHV0Lmhhc0F0dHJpYnV0ZShcImRhdGEtdmFsaWRhdGlvbi1pbmNvbXBsZXRlXCIpKSB7XG4gICAgICBjdXJyZW50U3RhdHVzID0gaW5wdXQuZ2V0QXR0cmlidXRlKFwiZGF0YS12YWxpZGF0aW9uLWluY29tcGxldGVcIik7XG4gICAgfVxuICAgIGNvbnN0IGl0ZW1TdGF0dXMgPSBgJHtsaXN0SXRlbS50ZXh0Q29udGVudH0gJHtjdXJyZW50U3RhdHVzfSBgO1xuICAgIGxpc3RJdGVtLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIFwiMFwiKTtcbiAgICBsaXN0SXRlbS5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIGl0ZW1TdGF0dXMpO1xuICB9KTtcbn07XG5cbmNvbnN0IGVuaGFuY2VWYWxpZGF0aW9uID0gKGlucHV0KSA9PiB7XG4gIGNyZWF0ZVN0YXR1c0VsZW1lbnQoaW5wdXQpO1xuICBjcmVhdGVJbml0aWFsU3RhdHVzKGlucHV0KTtcbn07XG5cbmNvbnN0IHZhbGlkYXRvciA9IGJlaGF2aW9yKFxuICB7XG4gICAgXCJpbnB1dCBjaGFuZ2VcIjoge1xuICAgICAgW1ZBTElEQVRFX0lOUFVUXShldmVudCkge1xuICAgICAgICBoYW5kbGVDaGFuZ2UoZXZlbnQudGFyZ2V0KTtcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAge1xuICAgIGluaXQocm9vdCkge1xuICAgICAgc2VsZWN0T3JNYXRjaGVzKFZBTElEQVRFX0lOUFVULCByb290KS5mb3JFYWNoKChpbnB1dCkgPT5cbiAgICAgICAgZW5oYW5jZVZhbGlkYXRpb24oaW5wdXQpXG4gICAgICApO1xuICAgIH0sXG4gIH1cbik7XG5cbm1vZHVsZS5leHBvcnRzID0gdmFsaWRhdG9yO1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIHByZWZpeDogXCJ1c2FcIixcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgLy8gVGhpcyB1c2VkIHRvIGJlIGNvbmRpdGlvbmFsbHkgZGVwZW5kZW50IG9uIHdoZXRoZXIgdGhlXG4gIC8vIGJyb3dzZXIgc3VwcG9ydGVkIHRvdWNoIGV2ZW50czsgaWYgaXQgZGlkLCBgQ0xJQ0tgIHdhcyBzZXQgdG9cbiAgLy8gYHRvdWNoc3RhcnRgLiAgSG93ZXZlciwgdGhpcyBoYWQgZG93bnNpZGVzOlxuICAvL1xuICAvLyAqIEl0IHByZS1lbXB0ZWQgbW9iaWxlIGJyb3dzZXJzJyBkZWZhdWx0IGJlaGF2aW9yIG9mIGRldGVjdGluZ1xuICAvLyAgIHdoZXRoZXIgYSB0b3VjaCB0dXJuZWQgaW50byBhIHNjcm9sbCwgdGhlcmVieSBwcmV2ZW50aW5nXG4gIC8vICAgdXNlcnMgZnJvbSB1c2luZyBzb21lIG9mIG91ciBjb21wb25lbnRzIGFzIHNjcm9sbCBzdXJmYWNlcy5cbiAgLy9cbiAgLy8gKiBTb21lIGRldmljZXMsIHN1Y2ggYXMgdGhlIE1pY3Jvc29mdCBTdXJmYWNlIFBybywgc3VwcG9ydCAqYm90aCpcbiAgLy8gICB0b3VjaCBhbmQgY2xpY2tzLiBUaGlzIG1lYW50IHRoZSBjb25kaXRpb25hbCBlZmZlY3RpdmVseSBkcm9wcGVkXG4gIC8vICAgc3VwcG9ydCBmb3IgdGhlIHVzZXIncyBtb3VzZSwgZnJ1c3RyYXRpbmcgdXNlcnMgd2hvIHByZWZlcnJlZFxuICAvLyAgIGl0IG9uIHRob3NlIHN5c3RlbXMuXG4gIENMSUNLOiBcImNsaWNrXCIsXG59O1xuIiwiY29uc3QgYWNjb3JkaW9uID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS1hY2NvcmRpb24vc3JjL2luZGV4XCIpO1xuY29uc3QgYmFubmVyID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS1iYW5uZXIvc3JjL2luZGV4XCIpO1xuY29uc3QgY2hhcmFjdGVyQ291bnQgPSByZXF1aXJlKFwiLi4vLi4vLi4vdXNhLWNoYXJhY3Rlci1jb3VudC9zcmMvaW5kZXhcIik7XG5jb25zdCBjb21ib0JveCA9IHJlcXVpcmUoXCIuLi8uLi8uLi91c2EtY29tYm8tYm94L3NyYy9pbmRleFwiKTtcbmNvbnN0IGRhdGVQaWNrZXIgPSByZXF1aXJlKFwiLi4vLi4vLi4vdXNhLWRhdGUtcGlja2VyL3NyYy9pbmRleFwiKTtcbmNvbnN0IGRhdGVSYW5nZVBpY2tlciA9IHJlcXVpcmUoXCIuLi8uLi8uLi91c2EtZGF0ZS1yYW5nZS1waWNrZXIvc3JjL2luZGV4XCIpO1xuY29uc3QgZmlsZUlucHV0ID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS1maWxlLWlucHV0L3NyYy9pbmRleFwiKTtcbmNvbnN0IGZvb3RlciA9IHJlcXVpcmUoXCIuLi8uLi8uLi91c2EtZm9vdGVyL3NyYy9pbmRleFwiKTtcbmNvbnN0IGluUGFnZU5hdmlnYXRpb24gPSByZXF1aXJlKFwiLi4vLi4vLi4vdXNhLWluLXBhZ2UtbmF2aWdhdGlvbi9zcmMvaW5kZXhcIik7XG5jb25zdCBpbnB1dE1hc2sgPSByZXF1aXJlKFwiLi4vLi4vLi4vdXNhLWlucHV0LW1hc2svc3JjL2luZGV4XCIpO1xuY29uc3QgaW5wdXRQcmVmaXhTdWZmaXggPSByZXF1aXJlKFwiLi4vLi4vLi4vdXNhLWlucHV0LXByZWZpeC1zdWZmaXgvc3JjL2luZGV4XCIpO1xuY29uc3QgbGFuZ3VhZ2VTZWxlY3RvciA9IHJlcXVpcmUoXCIuLi8uLi8uLi91c2EtbGFuZ3VhZ2Utc2VsZWN0b3Ivc3JjL2luZGV4XCIpO1xuY29uc3QgbW9kYWwgPSByZXF1aXJlKFwiLi4vLi4vLi4vdXNhLW1vZGFsL3NyYy9pbmRleFwiKTtcbmNvbnN0IG5hdmlnYXRpb24gPSByZXF1aXJlKFwiLi4vLi4vLi4vdXNhLWhlYWRlci9zcmMvaW5kZXhcIik7XG5jb25zdCBwYXNzd29yZCA9IHJlcXVpcmUoXCIuLi8uLi8uLi9fdXNhLXBhc3N3b3JkL3NyYy9pbmRleFwiKTtcbmNvbnN0IHNlYXJjaCA9IHJlcXVpcmUoXCIuLi8uLi8uLi91c2Etc2VhcmNoL3NyYy9pbmRleFwiKTtcbmNvbnN0IHNraXBuYXYgPSByZXF1aXJlKFwiLi4vLi4vLi4vdXNhLXNraXBuYXYvc3JjL2luZGV4XCIpO1xuY29uc3QgdGFibGUgPSByZXF1aXJlKFwiLi4vLi4vLi4vdXNhLXRhYmxlL3NyYy9pbmRleFwiKTtcbmNvbnN0IHRpbWVQaWNrZXIgPSByZXF1aXJlKFwiLi4vLi4vLi4vdXNhLXRpbWUtcGlja2VyL3NyYy9pbmRleFwiKTtcbmNvbnN0IHRvb2x0aXAgPSByZXF1aXJlKFwiLi4vLi4vLi4vdXNhLXRvb2x0aXAvc3JjL2luZGV4XCIpO1xuY29uc3QgdmFsaWRhdG9yID0gcmVxdWlyZShcIi4uLy4uLy4uL3VzYS12YWxpZGF0aW9uL3NyYy9pbmRleFwiKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFjY29yZGlvbixcbiAgYmFubmVyLFxuICBjaGFyYWN0ZXJDb3VudCxcbiAgY29tYm9Cb3gsXG4gIGRhdGVQaWNrZXIsXG4gIGRhdGVSYW5nZVBpY2tlcixcbiAgZmlsZUlucHV0LFxuICBmb290ZXIsXG4gIGluUGFnZU5hdmlnYXRpb24sXG4gIGlucHV0TWFzayxcbiAgaW5wdXRQcmVmaXhTdWZmaXgsXG4gIGxhbmd1YWdlU2VsZWN0b3IsXG4gIG1vZGFsLFxuICBuYXZpZ2F0aW9uLFxuICBwYXNzd29yZCxcbiAgc2VhcmNoLFxuICBza2lwbmF2LFxuICB0YWJsZSxcbiAgdGltZVBpY2tlcixcbiAgdG9vbHRpcCxcbiAgdmFsaWRhdG9yLFxufTtcbiIsIi8qIGVzbGludC1kaXNhYmxlIGNvbnNpc3RlbnQtcmV0dXJuICovXG4vKiBlc2xpbnQtZGlzYWJsZSBmdW5jLW5hbWVzICovXG4oZnVuY3Rpb24gKCkge1xuICBpZiAodHlwZW9mIHdpbmRvdy5DdXN0b21FdmVudCA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gZmFsc2U7XG5cbiAgZnVuY3Rpb24gQ3VzdG9tRXZlbnQoZXZlbnQsIF9wYXJhbXMpIHtcbiAgICBjb25zdCBwYXJhbXMgPSBfcGFyYW1zIHx8IHtcbiAgICAgIGJ1YmJsZXM6IGZhbHNlLFxuICAgICAgY2FuY2VsYWJsZTogZmFsc2UsXG4gICAgICBkZXRhaWw6IG51bGwsXG4gICAgfTtcbiAgICBjb25zdCBldnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkN1c3RvbUV2ZW50XCIpO1xuICAgIGV2dC5pbml0Q3VzdG9tRXZlbnQoXG4gICAgICBldmVudCxcbiAgICAgIHBhcmFtcy5idWJibGVzLFxuICAgICAgcGFyYW1zLmNhbmNlbGFibGUsXG4gICAgICBwYXJhbXMuZGV0YWlsXG4gICAgKTtcbiAgICByZXR1cm4gZXZ0O1xuICB9XG5cbiAgd2luZG93LkN1c3RvbUV2ZW50ID0gQ3VzdG9tRXZlbnQ7XG59KSgpO1xuIiwiY29uc3QgZWxwcm90byA9IHdpbmRvdy5IVE1MRWxlbWVudC5wcm90b3R5cGU7XG5jb25zdCBISURERU4gPSBcImhpZGRlblwiO1xuXG5pZiAoIShISURERU4gaW4gZWxwcm90bykpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVscHJvdG8sIEhJRERFTiwge1xuICAgIGdldCgpIHtcbiAgICAgIHJldHVybiB0aGlzLmhhc0F0dHJpYnV0ZShISURERU4pO1xuICAgIH0sXG4gICAgc2V0KHZhbHVlKSB7XG4gICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoSElEREVOLCBcIlwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKEhJRERFTik7XG4gICAgICB9XG4gICAgfSxcbiAgfSk7XG59XG4iLCIvLyBwb2x5ZmlsbHMgSFRNTEVsZW1lbnQucHJvdG90eXBlLmNsYXNzTGlzdCBhbmQgRE9NVG9rZW5MaXN0XG5yZXF1aXJlKFwiY2xhc3NsaXN0LXBvbHlmaWxsXCIpO1xuLy8gcG9seWZpbGxzIEhUTUxFbGVtZW50LnByb3RvdHlwZS5oaWRkZW5cbnJlcXVpcmUoXCIuL2VsZW1lbnQtaGlkZGVuXCIpO1xuLy8gcG9seWZpbGxzIE51bWJlci5pc05hTigpXG5yZXF1aXJlKFwiLi9udW1iZXItaXMtbmFuXCIpO1xuLy8gcG9seWZpbGxzIEN1c3RvbUV2ZW50XG5yZXF1aXJlKFwiLi9jdXN0b20tZXZlbnRcIik7XG4vLyBwb2x5ZmlsbHMgc3ZnNGV2ZXJ5Ym9keVxucmVxdWlyZShcIi4vc3ZnNGV2ZXJ5Ym9keVwiKTtcbiIsIk51bWJlci5pc05hTiA9XG4gIE51bWJlci5pc05hTiB8fFxuICBmdW5jdGlvbiBpc05hTihpbnB1dCkge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1zZWxmLWNvbXBhcmVcbiAgICByZXR1cm4gdHlwZW9mIGlucHV0ID09PSBcIm51bWJlclwiICYmIGlucHV0ICE9PSBpbnB1dDtcbiAgfTtcbiIsIi8qIGVzbGludC1kaXNhYmxlICovXG4hKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xufSkoZnVuY3Rpb24gKCkge1xuICAvKiEgc3ZnNGV2ZXJ5Ym9keSB2Mi4xLjkgfCBnaXRodWIuY29tL2pvbmF0aGFudG5lYWwvc3ZnNGV2ZXJ5Ym9keSAqL1xuICBmdW5jdGlvbiBlbWJlZChwYXJlbnQsIHN2ZywgdGFyZ2V0LCB1c2UpIHtcbiAgICAvLyBpZiB0aGUgdGFyZ2V0IGV4aXN0c1xuICAgIGlmICh0YXJnZXQpIHtcbiAgICAgIC8vIGNyZWF0ZSBhIGRvY3VtZW50IGZyYWdtZW50IHRvIGhvbGQgdGhlIGNvbnRlbnRzIG9mIHRoZSB0YXJnZXRcbiAgICAgIHZhciBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKSxcbiAgICAgICAgdmlld0JveCA9XG4gICAgICAgICAgIXN2Zy5oYXNBdHRyaWJ1dGUoXCJ2aWV3Qm94XCIpICYmIHRhcmdldC5nZXRBdHRyaWJ1dGUoXCJ2aWV3Qm94XCIpO1xuICAgICAgLy8gY29uZGl0aW9uYWxseSBzZXQgdGhlIHZpZXdCb3ggb24gdGhlIHN2Z1xuICAgICAgdmlld0JveCAmJiBzdmcuc2V0QXR0cmlidXRlKFwidmlld0JveFwiLCB2aWV3Qm94KTtcbiAgICAgIC8vIGNvcHkgdGhlIGNvbnRlbnRzIG9mIHRoZSBjbG9uZSBpbnRvIHRoZSBmcmFnbWVudFxuICAgICAgZm9yIChcbiAgICAgICAgLy8gY2xvbmUgdGhlIHRhcmdldFxuICAgICAgICB2YXIgY2xvbmUgPSBkb2N1bWVudC5pbXBvcnROb2RlXG4gICAgICAgICAgICA/IGRvY3VtZW50LmltcG9ydE5vZGUodGFyZ2V0LCAhMClcbiAgICAgICAgICAgIDogdGFyZ2V0LmNsb25lTm9kZSghMCksXG4gICAgICAgICAgZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcbiAgICAgICAgICAgIHN2Zy5uYW1lc3BhY2VVUkkgfHwgXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLFxuICAgICAgICAgICAgXCJnXCJcbiAgICAgICAgICApO1xuICAgICAgICBjbG9uZS5jaGlsZE5vZGVzLmxlbmd0aDtcblxuICAgICAgKSB7XG4gICAgICAgIGcuYXBwZW5kQ2hpbGQoY2xvbmUuZmlyc3RDaGlsZCk7XG4gICAgICB9XG4gICAgICBpZiAodXNlKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyB1c2UuYXR0cmlidXRlcy5sZW5ndGggPiBpOyBpKyspIHtcbiAgICAgICAgICB2YXIgYXR0ciA9IHVzZS5hdHRyaWJ1dGVzW2ldO1xuICAgICAgICAgIFwieGxpbms6aHJlZlwiICE9PSBhdHRyLm5hbWUgJiZcbiAgICAgICAgICAgIFwiaHJlZlwiICE9PSBhdHRyLm5hbWUgJiZcbiAgICAgICAgICAgIGcuc2V0QXR0cmlidXRlKGF0dHIubmFtZSwgYXR0ci52YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKGcpLCAvLyBhcHBlbmQgdGhlIGZyYWdtZW50IGludG8gdGhlIHN2Z1xuICAgICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoZnJhZ21lbnQpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBsb2FkcmVhZHlzdGF0ZWNoYW5nZSh4aHIsIHVzZSkge1xuICAgIC8vIGxpc3RlbiB0byBjaGFuZ2VzIGluIHRoZSByZXF1ZXN0XG4gICAgKHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBpZiB0aGUgcmVxdWVzdCBpcyByZWFkeVxuICAgICAgaWYgKDQgPT09IHhoci5yZWFkeVN0YXRlKSB7XG4gICAgICAgIC8vIGdldCB0aGUgY2FjaGVkIGh0bWwgZG9jdW1lbnRcbiAgICAgICAgdmFyIGNhY2hlZERvY3VtZW50ID0geGhyLl9jYWNoZWREb2N1bWVudDtcbiAgICAgICAgLy8gZW5zdXJlIHRoZSBjYWNoZWQgaHRtbCBkb2N1bWVudCBiYXNlZCBvbiB0aGUgeGhyIHJlc3BvbnNlXG4gICAgICAgIGNhY2hlZERvY3VtZW50IHx8XG4gICAgICAgICAgKChjYWNoZWREb2N1bWVudCA9IHhoci5fY2FjaGVkRG9jdW1lbnQgPVxuICAgICAgICAgICAgZG9jdW1lbnQuaW1wbGVtZW50YXRpb24uY3JlYXRlSFRNTERvY3VtZW50KFwiXCIpKSxcbiAgICAgICAgICAoY2FjaGVkRG9jdW1lbnQuYm9keS5pbm5lckhUTUwgPSB4aHIucmVzcG9uc2VUZXh0KSwgLy8gZW5zdXJlIGRvbWFpbnMgYXJlIHRoZSBzYW1lLCBvdGhlcndpc2Ugd2UnbGwgaGF2ZSBpc3N1ZXMgYXBwZW5kaW5nIHRoZVxuICAgICAgICAgIC8vIGVsZW1lbnQgaW4gSUUgMTFcbiAgICAgICAgICBjYWNoZWREb2N1bWVudC5kb21haW4gIT09IGRvY3VtZW50LmRvbWFpbiAmJlxuICAgICAgICAgICAgKGNhY2hlZERvY3VtZW50LmRvbWFpbiA9IGRvY3VtZW50LmRvbWFpbiksXG4gICAgICAgICAgKHhoci5fY2FjaGVkVGFyZ2V0ID0ge30pKSwgLy8gY2xlYXIgdGhlIHhociBlbWJlZHMgbGlzdCBhbmQgZW1iZWQgZWFjaCBpdGVtXG4gICAgICAgICAgeGhyLl9lbWJlZHMuc3BsaWNlKDApLm1hcChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgLy8gZ2V0IHRoZSBjYWNoZWQgdGFyZ2V0XG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0geGhyLl9jYWNoZWRUYXJnZXRbaXRlbS5pZF07XG4gICAgICAgICAgICAvLyBlbnN1cmUgdGhlIGNhY2hlZCB0YXJnZXRcbiAgICAgICAgICAgIHRhcmdldCB8fFxuICAgICAgICAgICAgICAodGFyZ2V0ID0geGhyLl9jYWNoZWRUYXJnZXRbaXRlbS5pZF0gPVxuICAgICAgICAgICAgICAgIGNhY2hlZERvY3VtZW50LmdldEVsZW1lbnRCeUlkKGl0ZW0uaWQpKSxcbiAgICAgICAgICAgICAgLy8gZW1iZWQgdGhlIHRhcmdldCBpbnRvIHRoZSBzdmdcbiAgICAgICAgICAgICAgZW1iZWQoaXRlbS5wYXJlbnQsIGl0ZW0uc3ZnLCB0YXJnZXQsIHVzZSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSksIC8vIHRlc3QgdGhlIHJlYWR5IHN0YXRlIGNoYW5nZSBpbW1lZGlhdGVseVxuICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSgpO1xuICB9XG4gIGZ1bmN0aW9uIHN2ZzRldmVyeWJvZHkocmF3b3B0cykge1xuICAgIGZ1bmN0aW9uIG9uaW50ZXJ2YWwoKSB7XG4gICAgICAvLyBpZiBhbGwgPHVzZT5zIGluIHRoZSBhcnJheSBhcmUgYmVpbmcgYnlwYXNzZWQsIGRvbid0IHByb2NlZWQuXG4gICAgICBpZiAoXG4gICAgICAgIG51bWJlck9mU3ZnVXNlRWxlbWVudHNUb0J5cGFzcyAmJlxuICAgICAgICB1c2VzLmxlbmd0aCAtIG51bWJlck9mU3ZnVXNlRWxlbWVudHNUb0J5cGFzcyA8PSAwXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHZvaWQgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKG9uaW50ZXJ2YWwsIDY3KTtcbiAgICAgIH1cbiAgICAgIC8vIGlmIHRoZXJlIGFyZSA8dXNlPnMgdG8gcHJvY2VzcywgcHJvY2VlZC5cbiAgICAgIC8vIHJlc2V0IHRoZSBieXBhc3MgY291bnRlciwgc2luY2UgdGhlIGNvdW50ZXIgd2lsbCBiZSBpbmNyZW1lbnRlZCBmb3IgZXZlcnkgYnlwYXNzZWQgZWxlbWVudCxcbiAgICAgIC8vIGV2ZW4gb25lcyB0aGF0IHdlcmUgY291bnRlZCBiZWZvcmUuXG4gICAgICBudW1iZXJPZlN2Z1VzZUVsZW1lbnRzVG9CeXBhc3MgPSAwO1xuICAgICAgLy8gd2hpbGUgdGhlIGluZGV4IGV4aXN0cyBpbiB0aGUgbGl2ZSA8dXNlPiBjb2xsZWN0aW9uXG4gICAgICBmb3IgKFxuICAgICAgICAvLyBnZXQgdGhlIGNhY2hlZCA8dXNlPiBpbmRleFxuICAgICAgICB2YXIgaW5kZXggPSAwO1xuICAgICAgICBpbmRleCA8IHVzZXMubGVuZ3RoO1xuXG4gICAgICApIHtcbiAgICAgICAgLy8gZ2V0IHRoZSBjdXJyZW50IDx1c2U+XG4gICAgICAgIHZhciB1c2UgPSB1c2VzW2luZGV4XSxcbiAgICAgICAgICBwYXJlbnQgPSB1c2UucGFyZW50Tm9kZSxcbiAgICAgICAgICBzdmcgPSBnZXRTVkdBbmNlc3RvcihwYXJlbnQpLFxuICAgICAgICAgIHNyYyA9IHVzZS5nZXRBdHRyaWJ1dGUoXCJ4bGluazpocmVmXCIpIHx8IHVzZS5nZXRBdHRyaWJ1dGUoXCJocmVmXCIpO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgKCFzcmMgJiZcbiAgICAgICAgICAgIG9wdHMuYXR0cmlidXRlTmFtZSAmJlxuICAgICAgICAgICAgKHNyYyA9IHVzZS5nZXRBdHRyaWJ1dGUob3B0cy5hdHRyaWJ1dGVOYW1lKSksXG4gICAgICAgICAgc3ZnICYmIHNyYylcbiAgICAgICAgKSB7XG4gICAgICAgICAgaWYgKHBvbHlmaWxsKSB7XG4gICAgICAgICAgICBpZiAoIW9wdHMudmFsaWRhdGUgfHwgb3B0cy52YWxpZGF0ZShzcmMsIHN2ZywgdXNlKSkge1xuICAgICAgICAgICAgICAvLyByZW1vdmUgdGhlIDx1c2U+IGVsZW1lbnRcbiAgICAgICAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKHVzZSk7XG4gICAgICAgICAgICAgIC8vIHBhcnNlIHRoZSBzcmMgYW5kIGdldCB0aGUgdXJsIGFuZCBpZFxuICAgICAgICAgICAgICB2YXIgc3JjU3BsaXQgPSBzcmMuc3BsaXQoXCIjXCIpLFxuICAgICAgICAgICAgICAgIHVybCA9IHNyY1NwbGl0LnNoaWZ0KCksXG4gICAgICAgICAgICAgICAgaWQgPSBzcmNTcGxpdC5qb2luKFwiI1wiKTtcbiAgICAgICAgICAgICAgLy8gaWYgdGhlIGxpbmsgaXMgZXh0ZXJuYWxcbiAgICAgICAgICAgICAgaWYgKHVybC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAvLyBnZXQgdGhlIGNhY2hlZCB4aHIgcmVxdWVzdFxuICAgICAgICAgICAgICAgIHZhciB4aHIgPSByZXF1ZXN0c1t1cmxdO1xuICAgICAgICAgICAgICAgIC8vIGVuc3VyZSB0aGUgeGhyIHJlcXVlc3QgZXhpc3RzXG4gICAgICAgICAgICAgICAgeGhyIHx8XG4gICAgICAgICAgICAgICAgICAoKHhociA9IHJlcXVlc3RzW3VybF0gPSBuZXcgWE1MSHR0cFJlcXVlc3QoKSksXG4gICAgICAgICAgICAgICAgICB4aHIub3BlbihcIkdFVFwiLCB1cmwpLFxuICAgICAgICAgICAgICAgICAgeGhyLnNlbmQoKSxcbiAgICAgICAgICAgICAgICAgICh4aHIuX2VtYmVkcyA9IFtdKSksIC8vIGFkZCB0aGUgc3ZnIGFuZCBpZCBhcyBhbiBpdGVtIHRvIHRoZSB4aHIgZW1iZWRzIGxpc3RcbiAgICAgICAgICAgICAgICAgIHhoci5fZW1iZWRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IHBhcmVudCxcbiAgICAgICAgICAgICAgICAgICAgc3ZnOiBzdmcsXG4gICAgICAgICAgICAgICAgICAgIGlkOiBpZCxcbiAgICAgICAgICAgICAgICAgIH0pLCAvLyBwcmVwYXJlIHRoZSB4aHIgcmVhZHkgc3RhdGUgY2hhbmdlIGV2ZW50XG4gICAgICAgICAgICAgICAgICBsb2FkcmVhZHlzdGF0ZWNoYW5nZSh4aHIsIHVzZSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gZW1iZWQgdGhlIGxvY2FsIGlkIGludG8gdGhlIHN2Z1xuICAgICAgICAgICAgICAgIGVtYmVkKHBhcmVudCwgc3ZnLCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCksIHVzZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIGluY3JlYXNlIHRoZSBpbmRleCB3aGVuIHRoZSBwcmV2aW91cyB2YWx1ZSB3YXMgbm90IFwidmFsaWRcIlxuICAgICAgICAgICAgICArK2luZGV4LCArK251bWJlck9mU3ZnVXNlRWxlbWVudHNUb0J5cGFzcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gaW5jcmVhc2UgdGhlIGluZGV4IHdoZW4gdGhlIHByZXZpb3VzIHZhbHVlIHdhcyBub3QgXCJ2YWxpZFwiXG4gICAgICAgICAgKytpbmRleDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gY29udGludWUgdGhlIGludGVydmFsXG4gICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUob25pbnRlcnZhbCwgNjcpO1xuICAgIH1cbiAgICB2YXIgcG9seWZpbGwsXG4gICAgICBvcHRzID0gT2JqZWN0KHJhd29wdHMpLFxuICAgICAgbmV3ZXJJRVVBID0gL1xcYlRyaWRlbnRcXC9bNTY3XVxcYnxcXGJNU0lFICg/Ojl8MTApXFwuMFxcYi8sXG4gICAgICB3ZWJraXRVQSA9IC9cXGJBcHBsZVdlYktpdFxcLyhcXGQrKVxcYi8sXG4gICAgICBvbGRlckVkZ2VVQSA9IC9cXGJFZGdlXFwvMTJcXC4oXFxkKylcXGIvLFxuICAgICAgZWRnZVVBID0gL1xcYkVkZ2VcXC8uKFxcZCspXFxiLyxcbiAgICAgIGluSWZyYW1lID0gd2luZG93LnRvcCAhPT0gd2luZG93LnNlbGY7XG4gICAgcG9seWZpbGwgPVxuICAgICAgXCJwb2x5ZmlsbFwiIGluIG9wdHNcbiAgICAgICAgPyBvcHRzLnBvbHlmaWxsXG4gICAgICAgIDogbmV3ZXJJRVVBLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgfHxcbiAgICAgICAgICAobmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaChvbGRlckVkZ2VVQSkgfHwgW10pWzFdIDwgMTA1NDcgfHxcbiAgICAgICAgICAobmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCh3ZWJraXRVQSkgfHwgW10pWzFdIDwgNTM3IHx8XG4gICAgICAgICAgKGVkZ2VVQS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpICYmIGluSWZyYW1lKTtcbiAgICAvLyBjcmVhdGUgeGhyIHJlcXVlc3RzIG9iamVjdFxuICAgIHZhciByZXF1ZXN0cyA9IHt9LFxuICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCBzZXRUaW1lb3V0LFxuICAgICAgdXNlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwidXNlXCIpLFxuICAgICAgbnVtYmVyT2ZTdmdVc2VFbGVtZW50c1RvQnlwYXNzID0gMDtcbiAgICAvLyBjb25kaXRpb25hbGx5IHN0YXJ0IHRoZSBpbnRlcnZhbCBpZiB0aGUgcG9seWZpbGwgaXMgYWN0aXZlXG4gICAgcG9seWZpbGwgJiYgb25pbnRlcnZhbCgpO1xuICB9XG4gIGZ1bmN0aW9uIGdldFNWR0FuY2VzdG9yKG5vZGUpIHtcbiAgICBmb3IgKFxuICAgICAgdmFyIHN2ZyA9IG5vZGU7XG4gICAgICBcInN2Z1wiICE9PSBzdmcubm9kZU5hbWUudG9Mb3dlckNhc2UoKSAmJiAoc3ZnID0gc3ZnLnBhcmVudE5vZGUpO1xuXG4gICAgKSB7fVxuICAgIHJldHVybiBzdmc7XG4gIH1cbiAgcmV0dXJuIHN2ZzRldmVyeWJvZHk7XG59KTtcbiIsIm1vZHVsZS5leHBvcnRzID0gKGh0bWxEb2N1bWVudCA9IGRvY3VtZW50KSA9PiBodG1sRG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiIsImNvbnN0IGFzc2lnbiA9IHJlcXVpcmUoXCJvYmplY3QtYXNzaWduXCIpO1xuY29uc3QgQmVoYXZpb3IgPSByZXF1aXJlKFwicmVjZXB0b3IvYmVoYXZpb3JcIik7XG5cbi8qKlxuICogQG5hbWUgc2VxdWVuY2VcbiAqIEBwYXJhbSB7Li4uRnVuY3Rpb259IHNlcSBhbiBhcnJheSBvZiBmdW5jdGlvbnNcbiAqIEByZXR1cm4geyBjbG9zdXJlIH0gY2FsbEhvb2tzXG4gKi9cbi8vIFdlIHVzZSBhIG5hbWVkIGZ1bmN0aW9uIGhlcmUgYmVjYXVzZSB3ZSB3YW50IGl0IHRvIGluaGVyaXQgaXRzIGxleGljYWwgc2NvcGVcbi8vIGZyb20gdGhlIGJlaGF2aW9yIHByb3BzIG9iamVjdCwgbm90IGZyb20gdGhlIG1vZHVsZVxuY29uc3Qgc2VxdWVuY2UgPSAoLi4uc2VxKSA9PlxuICBmdW5jdGlvbiBjYWxsSG9va3ModGFyZ2V0ID0gZG9jdW1lbnQuYm9keSkge1xuICAgIHNlcS5mb3JFYWNoKChtZXRob2QpID0+IHtcbiAgICAgIGlmICh0eXBlb2YgdGhpc1ttZXRob2RdID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhpc1ttZXRob2RdLmNhbGwodGhpcywgdGFyZ2V0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuLyoqXG4gKiBAbmFtZSBiZWhhdmlvclxuICogQHBhcmFtIHtvYmplY3R9IGV2ZW50c1xuICogQHBhcmFtIHtvYmplY3Q/fSBwcm9wc1xuICogQHJldHVybiB7cmVjZXB0b3IuYmVoYXZpb3J9XG4gKi9cbm1vZHVsZS5leHBvcnRzID0gKGV2ZW50cywgcHJvcHMpID0+XG4gIEJlaGF2aW9yKFxuICAgIGV2ZW50cyxcbiAgICBhc3NpZ24oXG4gICAgICB7XG4gICAgICAgIG9uOiBzZXF1ZW5jZShcImluaXRcIiwgXCJhZGRcIiksXG4gICAgICAgIG9mZjogc2VxdWVuY2UoXCJ0ZWFyZG93blwiLCBcInJlbW92ZVwiKSxcbiAgICAgIH0sXG4gICAgICBwcm9wc1xuICAgIClcbiAgKTtcbiIsIi8qKlxuICogQ2FsbCBhIGZ1bmN0aW9uIGV2ZXJ5IFggYW1vdW50IG9mIG1pbGxpc2Vjb25kcy5cbiAqXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGJlIGRlYm91bmNlZFxuICogQHBhcmFtICB7bnVtYmVyfSBkZWxheSAtIE1pbGxpc2Vjb25kcyB0byB3YWl0IGJlZm9yZSBjYWxsaW5nIGZ1bmN0aW9uXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IEEgZGVib3VuY2VkIGZ1bmN0aW9uXG4gKiBAZXhhbXBsZSBjb25zdCB1cGRhdGVTdGF0dXMgPSBkZWJvdW5jZSgoc3RyaW5nKSA9PiBjb25zb2xlLmxvZyhzdHJpbmcpLCAyMDAwKVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGVib3VuY2UoY2FsbGJhY2ssIGRlbGF5ID0gNTAwKSB7XG4gIGxldCB0aW1lciA9IG51bGw7XG4gIHJldHVybiAoLi4uYXJncykgPT4ge1xuICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGltZXIpO1xuICAgIHRpbWVyID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY2FsbGJhY2suYXBwbHkodGhpcywgYXJncyk7XG4gICAgfSwgZGVsYXkpO1xuICB9O1xufTtcbiIsImNvbnN0IGFzc2lnbiA9IHJlcXVpcmUoXCJvYmplY3QtYXNzaWduXCIpO1xuY29uc3QgeyBrZXltYXAgfSA9IHJlcXVpcmUoXCJyZWNlcHRvclwiKTtcbmNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4vYmVoYXZpb3JcIik7XG5jb25zdCBzZWxlY3QgPSByZXF1aXJlKFwiLi9zZWxlY3RcIik7XG5jb25zdCBhY3RpdmVFbGVtZW50ID0gcmVxdWlyZShcIi4vYWN0aXZlLWVsZW1lbnRcIik7XG5cbmNvbnN0IEZPQ1VTQUJMRSA9XG4gICdhW2hyZWZdLCBhcmVhW2hyZWZdLCBpbnB1dDpub3QoW2Rpc2FibGVkXSksIHNlbGVjdDpub3QoW2Rpc2FibGVkXSksIHRleHRhcmVhOm5vdChbZGlzYWJsZWRdKSwgYnV0dG9uOm5vdChbZGlzYWJsZWRdKSwgaWZyYW1lLCBvYmplY3QsIGVtYmVkLCBbdGFiaW5kZXg9XCIwXCJdLCBbY29udGVudGVkaXRhYmxlXSc7XG5cbmNvbnN0IHRhYkhhbmRsZXIgPSAoY29udGV4dCkgPT4ge1xuICBjb25zdCBmb2N1c2FibGVFbGVtZW50cyA9IHNlbGVjdChGT0NVU0FCTEUsIGNvbnRleHQpO1xuICBjb25zdCBmaXJzdFRhYlN0b3AgPSBmb2N1c2FibGVFbGVtZW50c1swXTtcbiAgY29uc3QgbGFzdFRhYlN0b3AgPSBmb2N1c2FibGVFbGVtZW50c1tmb2N1c2FibGVFbGVtZW50cy5sZW5ndGggLSAxXTtcblxuICAvLyBTcGVjaWFsIHJ1bGVzIGZvciB3aGVuIHRoZSB1c2VyIGlzIHRhYmJpbmcgZm9yd2FyZCBmcm9tIHRoZSBsYXN0IGZvY3VzYWJsZSBlbGVtZW50LFxuICAvLyBvciB3aGVuIHRhYmJpbmcgYmFja3dhcmRzIGZyb20gdGhlIGZpcnN0IGZvY3VzYWJsZSBlbGVtZW50XG4gIGZ1bmN0aW9uIHRhYkFoZWFkKGV2ZW50KSB7XG4gICAgaWYgKGFjdGl2ZUVsZW1lbnQoKSA9PT0gbGFzdFRhYlN0b3ApIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBmaXJzdFRhYlN0b3AuZm9jdXMoKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB0YWJCYWNrKGV2ZW50KSB7XG4gICAgaWYgKGFjdGl2ZUVsZW1lbnQoKSA9PT0gZmlyc3RUYWJTdG9wKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgbGFzdFRhYlN0b3AuZm9jdXMoKTtcbiAgICB9XG4gICAgLy8gVGhpcyBjaGVja3MgaWYgeW91IHdhbnQgdG8gc2V0IHRoZSBpbml0aWFsIGZvY3VzIHRvIGEgY29udGFpbmVyXG4gICAgLy8gaW5zdGVhZCBvZiBhbiBlbGVtZW50IHdpdGhpbiwgYW5kIHRoZSB1c2VyIHRhYnMgYmFjay5cbiAgICAvLyBUaGVuIHdlIHNldCB0aGUgZm9jdXMgdG8gdGhlIGZpcnN0XG4gICAgZWxzZSBpZiAoIWZvY3VzYWJsZUVsZW1lbnRzLmluY2x1ZGVzKGFjdGl2ZUVsZW1lbnQoKSkpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBmaXJzdFRhYlN0b3AuZm9jdXMoKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGZpcnN0VGFiU3RvcCxcbiAgICBsYXN0VGFiU3RvcCxcbiAgICB0YWJBaGVhZCxcbiAgICB0YWJCYWNrLFxuICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSAoY29udGV4dCwgYWRkaXRpb25hbEtleUJpbmRpbmdzID0ge30pID0+IHtcbiAgY29uc3QgdGFiRXZlbnRIYW5kbGVyID0gdGFiSGFuZGxlcihjb250ZXh0KTtcbiAgY29uc3QgYmluZGluZ3MgPSBhZGRpdGlvbmFsS2V5QmluZGluZ3M7XG4gIGNvbnN0IHsgRXNjLCBFc2NhcGUgfSA9IGJpbmRpbmdzO1xuXG4gIGlmIChFc2NhcGUgJiYgIUVzYykgYmluZGluZ3MuRXNjID0gRXNjYXBlO1xuXG4gIC8vICBUT0RPOiBJbiB0aGUgZnV0dXJlLCBsb29wIG92ZXIgYWRkaXRpb25hbCBrZXliaW5kaW5ncyBhbmQgcGFzcyBhbiBhcnJheVxuICAvLyBvZiBmdW5jdGlvbnMsIGlmIG5lY2Vzc2FyeSwgdG8gdGhlIG1hcCBrZXlzLiBUaGVuIHBlb3BsZSBpbXBsZW1lbnRpbmdcbiAgLy8gdGhlIGZvY3VzIHRyYXAgY291bGQgcGFzcyBjYWxsYmFja3MgdG8gZmlyZSB3aGVuIHRhYmJpbmdcbiAgY29uc3Qga2V5TWFwcGluZ3MgPSBrZXltYXAoXG4gICAgYXNzaWduKFxuICAgICAge1xuICAgICAgICBUYWI6IHRhYkV2ZW50SGFuZGxlci50YWJBaGVhZCxcbiAgICAgICAgXCJTaGlmdCtUYWJcIjogdGFiRXZlbnRIYW5kbGVyLnRhYkJhY2ssXG4gICAgICB9LFxuICAgICAgYWRkaXRpb25hbEtleUJpbmRpbmdzXG4gICAgKVxuICApO1xuXG4gIGNvbnN0IGZvY3VzVHJhcCA9IGJlaGF2aW9yKFxuICAgIHtcbiAgICAgIGtleWRvd246IGtleU1hcHBpbmdzLFxuICAgIH0sXG4gICAge1xuICAgICAgaW5pdCgpIHtcbiAgICAgICAgLy8gVE9ETzogaXMgdGhpcyBkZXNpcmVhYmxlIGJlaGF2aW9yPyBTaG91bGQgdGhlIHRyYXAgYWx3YXlzIGRvIHRoaXMgYnkgZGVmYXVsdCBvciBzaG91bGRcbiAgICAgICAgLy8gdGhlIGNvbXBvbmVudCBnZXR0aW5nIGRlY29yYXRlZCBoYW5kbGUgdGhpcz9cbiAgICAgICAgaWYgKHRhYkV2ZW50SGFuZGxlci5maXJzdFRhYlN0b3ApIHtcbiAgICAgICAgICB0YWJFdmVudEhhbmRsZXIuZmlyc3RUYWJTdG9wLmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB1cGRhdGUoaXNBY3RpdmUpIHtcbiAgICAgICAgaWYgKGlzQWN0aXZlKSB7XG4gICAgICAgICAgdGhpcy5vbigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMub2ZmKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfVxuICApO1xuXG4gIHJldHVybiBmb2N1c1RyYXA7XG59O1xuIiwiLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzc1NTc0MzNcbmZ1bmN0aW9uIGlzRWxlbWVudEluVmlld3BvcnQoXG4gIGVsLFxuICB3aW4gPSB3aW5kb3csXG4gIGRvY0VsID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50XG4pIHtcbiAgY29uc3QgcmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gIHJldHVybiAoXG4gICAgcmVjdC50b3AgPj0gMCAmJlxuICAgIHJlY3QubGVmdCA+PSAwICYmXG4gICAgcmVjdC5ib3R0b20gPD0gKHdpbi5pbm5lckhlaWdodCB8fCBkb2NFbC5jbGllbnRIZWlnaHQpICYmXG4gICAgcmVjdC5yaWdodCA8PSAod2luLmlubmVyV2lkdGggfHwgZG9jRWwuY2xpZW50V2lkdGgpXG4gICk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNFbGVtZW50SW5WaWV3cG9ydDtcbiIsIi8vIGlPUyBkZXRlY3Rpb24gZnJvbTogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvOTAzOTg4NS8xNzc3MTBcbmZ1bmN0aW9uIGlzSW9zRGV2aWNlKCkge1xuICByZXR1cm4gKFxuICAgIHR5cGVvZiBuYXZpZ2F0b3IgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAobmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvKGlQb2R8aVBob25lfGlQYWQpL2cpIHx8XG4gICAgICAobmF2aWdhdG9yLnBsYXRmb3JtID09PSBcIk1hY0ludGVsXCIgJiYgbmF2aWdhdG9yLm1heFRvdWNoUG9pbnRzID4gMSkpICYmXG4gICAgIXdpbmRvdy5NU1N0cmVhbVxuICApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzSW9zRGV2aWNlO1xuIiwiLyogZXNsaW50LWRpc2FibGUgKi9cbi8qIGdsb2JhbHMgZGVmaW5lLCBtb2R1bGUgKi9cblxuLyoqXG4gKiBBIHNpbXBsZSBsaWJyYXJ5IHRvIGhlbHAgeW91IGVzY2FwZSBIVE1MIHVzaW5nIHRlbXBsYXRlIHN0cmluZ3MuXG4gKlxuICogSXQncyB0aGUgY291bnRlcnBhcnQgdG8gb3VyIGVzbGludCBcIm5vLXVuc2FmZS1pbm5lcmh0bWxcIiBwbHVnaW4gdGhhdCBoZWxwcyB1c1xuICogYXZvaWQgdW5zYWZlIGNvZGluZyBwcmFjdGljZXMuXG4gKiBBIGZ1bGwgd3JpdGUtdXAgb2YgdGhlIEhvd3MgYW5kIFdoeXMgYXJlIGRvY3VtZW50ZWRcbiAqIGZvciBkZXZlbG9wZXJzIGF0XG4gKiAgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvRmlyZWZveF9PUy9TZWN1cml0eS9TZWN1cml0eV9BdXRvbWF0aW9uXG4gKiB3aXRoIGFkZGl0aW9uYWwgYmFja2dyb3VuZCBpbmZvcm1hdGlvbiBhbmQgZGVzaWduIGRvY3MgYXRcbiAqICBodHRwczovL3dpa2kubW96aWxsYS5vcmcvVXNlcjpGYnJhdW4vR2FpYS9TYWZlaW5uZXJIVE1MUm9hZG1hcFxuICpcbiAqL1xuXG4hKGZ1bmN0aW9uIChmYWN0b3J5KSB7XG4gIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xufSkoZnVuY3Rpb24gKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIFNhbml0aXplciA9IHtcbiAgICBfZW50aXR5OiAvWyY8PlwiJy9dL2csXG5cbiAgICBfZW50aXRpZXM6IHtcbiAgICAgICcmJzogJyZhbXA7JyxcbiAgICAgICc8JzogJyZsdDsnLFxuICAgICAgJz4nOiAnJmd0OycsXG4gICAgICAnXCInOiAnJnF1b3Q7JyxcbiAgICAgICdcXCcnOiAnJmFwb3M7JyxcbiAgICAgICcvJzogJyYjeDJGOydcbiAgICB9LFxuXG4gICAgZ2V0RW50aXR5OiBmdW5jdGlvbiAocykge1xuICAgICAgcmV0dXJuIFNhbml0aXplci5fZW50aXRpZXNbc107XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEVzY2FwZXMgSFRNTCBmb3IgYWxsIHZhbHVlcyBpbiBhIHRhZ2dlZCB0ZW1wbGF0ZSBzdHJpbmcuXG4gICAgICovXG4gICAgZXNjYXBlSFRNTDogZnVuY3Rpb24gKHN0cmluZ3MpIHtcbiAgICAgIHZhciByZXN1bHQgPSAnJztcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHJpbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHJlc3VsdCArPSBzdHJpbmdzW2ldO1xuICAgICAgICBpZiAoaSArIDEgPCBhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgdmFyIHZhbHVlID0gYXJndW1lbnRzW2kgKyAxXSB8fCAnJztcbiAgICAgICAgICByZXN1bHQgKz0gU3RyaW5nKHZhbHVlKS5yZXBsYWNlKFNhbml0aXplci5fZW50aXR5LFxuICAgICAgICAgICAgU2FuaXRpemVyLmdldEVudGl0eSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIEVzY2FwZXMgSFRNTCBhbmQgcmV0dXJucyBhIHdyYXBwZWQgb2JqZWN0IHRvIGJlIHVzZWQgZHVyaW5nIERPTSBpbnNlcnRpb25cbiAgICAgKi9cbiAgICBjcmVhdGVTYWZlSFRNTDogZnVuY3Rpb24gKHN0cmluZ3MpIHtcbiAgICAgIHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgIHZhciB2YWx1ZXMgPSBuZXcgQXJyYXkoX2xlbiA+IDEgPyBfbGVuIC0gMSA6IDApO1xuICAgICAgZm9yICh2YXIgX2tleSA9IDE7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgICAgdmFsdWVzW19rZXkgLSAxXSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgICAgIH1cblxuICAgICAgdmFyIGVzY2FwZWQgPSBTYW5pdGl6ZXIuZXNjYXBlSFRNTC5hcHBseShTYW5pdGl6ZXIsXG4gICAgICAgIFtzdHJpbmdzXS5jb25jYXQodmFsdWVzKSk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBfX2h0bWw6IGVzY2FwZWQsXG4gICAgICAgIHRvU3RyaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcmV0dXJuICdbb2JqZWN0IFdyYXBwZWRIVE1MT2JqZWN0XSc7XG4gICAgICAgIH0sXG4gICAgICAgIGluZm86ICdUaGlzIGlzIGEgd3JhcHBlZCBIVE1MIG9iamVjdC4gU2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3InK1xuICAgICAgICAgICdnL2VuLVVTL0ZpcmVmb3hfT1MvU2VjdXJpdHkvU2VjdXJpdHlfQXV0b21hdGlvbiBmb3IgbW9yZS4nXG4gICAgICB9O1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogVW53cmFwIHNhZmUgSFRNTCBjcmVhdGVkIGJ5IGNyZWF0ZVNhZmVIVE1MIG9yIGEgY3VzdG9tIHJlcGxhY2VtZW50IHRoYXRcbiAgICAgKiB1bmRlcndlbnQgc2VjdXJpdHkgcmV2aWV3LlxuICAgICAqL1xuICAgIHVud3JhcFNhZmVIVE1MOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICB2YXIgaHRtbE9iamVjdHMgPSBuZXcgQXJyYXkoX2xlbik7XG4gICAgICBmb3IgKHZhciBfa2V5ID0gMDsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgICBodG1sT2JqZWN0c1tfa2V5XSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgICAgIH1cblxuICAgICAgdmFyIG1hcmt1cExpc3QgPSBodG1sT2JqZWN0cy5tYXAoZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIHJldHVybiBvYmouX19odG1sO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gbWFya3VwTGlzdC5qb2luKCcnKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIFNhbml0aXplcjtcblxufSk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdldFNjcm9sbGJhcldpZHRoKCkge1xuICAvLyBDcmVhdGluZyBpbnZpc2libGUgY29udGFpbmVyXG4gIGNvbnN0IG91dGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIG91dGVyLnN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcbiAgb3V0ZXIuc3R5bGUub3ZlcmZsb3cgPSAnc2Nyb2xsJzsgLy8gZm9yY2luZyBzY3JvbGxiYXIgdG8gYXBwZWFyXG4gIG91dGVyLnN0eWxlLm1zT3ZlcmZsb3dTdHlsZSA9ICdzY3JvbGxiYXInOyAvLyBuZWVkZWQgZm9yIFdpbkpTIGFwcHNcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChvdXRlcik7XG5cbiAgLy8gQ3JlYXRpbmcgaW5uZXIgZWxlbWVudCBhbmQgcGxhY2luZyBpdCBpbiB0aGUgY29udGFpbmVyXG4gIGNvbnN0IGlubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIG91dGVyLmFwcGVuZENoaWxkKGlubmVyKTtcbiAgXG4gIC8vIENhbGN1bGF0aW5nIGRpZmZlcmVuY2UgYmV0d2VlbiBjb250YWluZXIncyBmdWxsIHdpZHRoIGFuZCB0aGUgY2hpbGQgd2lkdGhcbiAgY29uc3Qgc2Nyb2xsYmFyV2lkdGggPSBgJHsob3V0ZXIub2Zmc2V0V2lkdGggLSBpbm5lci5vZmZzZXRXaWR0aCl9cHhgO1xuXG4gIC8vIFJlbW92aW5nIHRlbXBvcmFyeSBlbGVtZW50cyBmcm9tIHRoZSBET01cbiAgb3V0ZXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChvdXRlcik7XG5cbiAgcmV0dXJuIHNjcm9sbGJhcldpZHRoO1xufTtcbiIsImNvbnN0IHNlbGVjdCA9IHJlcXVpcmUoXCIuL3NlbGVjdFwiKTtcbi8qKlxuICogQG5hbWUgaXNFbGVtZW50XG4gKiBAZGVzYyByZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhIERPTSBlbGVtZW50LlxuICogQHBhcmFtIHthbnl9IHZhbHVlXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5jb25zdCBpc0VsZW1lbnQgPSAodmFsdWUpID0+XG4gIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZS5ub2RlVHlwZSA9PT0gMTtcblxuLyoqXG4gKiBAbmFtZSBzZWxlY3RPck1hdGNoZXNcbiAqIEBkZXNjIHNlbGVjdHMgZWxlbWVudHMgZnJvbSB0aGUgRE9NIGJ5IGNsYXNzIHNlbGVjdG9yIG9yIElEIHNlbGVjdG9yLlxuICogQHBhcmFtIHtzdHJpbmd9IHNlbGVjdG9yIC0gVGhlIHNlbGVjdG9yIHRvIHRyYXZlcnNlIHRoZSBET00gd2l0aC5cbiAqIEBwYXJhbSB7RG9jdW1lbnR8SFRNTEVsZW1lbnQ/fSBjb250ZXh0IC0gVGhlIGNvbnRleHQgdG8gdHJhdmVyc2UgdGhlIERPTVxuICogICBpbi4gSWYgbm90IHByb3ZpZGVkLCBpdCBkZWZhdWx0cyB0byB0aGUgZG9jdW1lbnQuXG4gKiBAcmV0dXJuIHtIVE1MRWxlbWVudFtdfSAtIEFuIGFycmF5IG9mIERPTSBub2RlcyBvciBhbiBlbXB0eSBhcnJheS5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSAoc2VsZWN0b3IsIGNvbnRleHQpID0+IHtcbiAgY29uc3Qgc2VsZWN0aW9uID0gc2VsZWN0KHNlbGVjdG9yLCBjb250ZXh0KTtcbiAgaWYgKHR5cGVvZiBzZWxlY3RvciAhPT0gXCJzdHJpbmdcIikge1xuICAgIHJldHVybiBzZWxlY3Rpb247XG4gIH1cblxuICBpZiAoaXNFbGVtZW50KGNvbnRleHQpICYmIGNvbnRleHQubWF0Y2hlcyhzZWxlY3RvcikpIHtcbiAgICBzZWxlY3Rpb24ucHVzaChjb250ZXh0KTtcbiAgfVxuXG4gIHJldHVybiBzZWxlY3Rpb247XG59O1xuIiwiLyoqXG4gKiBAbmFtZSBpc0VsZW1lbnRcbiAqIEBkZXNjIHJldHVybnMgd2hldGhlciBvciBub3QgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGEgRE9NIGVsZW1lbnQuXG4gKiBAcGFyYW0ge2FueX0gdmFsdWVcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmNvbnN0IGlzRWxlbWVudCA9ICh2YWx1ZSkgPT5cbiAgdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlLm5vZGVUeXBlID09PSAxO1xuXG4vKipcbiAqIEBuYW1lIHNlbGVjdFxuICogQGRlc2Mgc2VsZWN0cyBlbGVtZW50cyBmcm9tIHRoZSBET00gYnkgY2xhc3Mgc2VsZWN0b3Igb3IgSUQgc2VsZWN0b3IuXG4gKiBAcGFyYW0ge3N0cmluZ30gc2VsZWN0b3IgLSBUaGUgc2VsZWN0b3IgdG8gdHJhdmVyc2UgdGhlIERPTSB3aXRoLlxuICogQHBhcmFtIHtEb2N1bWVudHxIVE1MRWxlbWVudD99IGNvbnRleHQgLSBUaGUgY29udGV4dCB0byB0cmF2ZXJzZSB0aGUgRE9NXG4gKiAgIGluLiBJZiBub3QgcHJvdmlkZWQsIGl0IGRlZmF1bHRzIHRvIHRoZSBkb2N1bWVudC5cbiAqIEByZXR1cm4ge0hUTUxFbGVtZW50W119IC0gQW4gYXJyYXkgb2YgRE9NIG5vZGVzIG9yIGFuIGVtcHR5IGFycmF5LlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IChzZWxlY3RvciwgY29udGV4dCkgPT4ge1xuICBpZiAodHlwZW9mIHNlbGVjdG9yICE9PSBcInN0cmluZ1wiKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgaWYgKCFjb250ZXh0IHx8ICFpc0VsZW1lbnQoY29udGV4dCkpIHtcbiAgICBjb250ZXh0ID0gd2luZG93LmRvY3VtZW50OyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gIH1cblxuICBjb25zdCBzZWxlY3Rpb24gPSBjb250ZXh0LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xuICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoc2VsZWN0aW9uKTtcbn07XG4iLCIvKipcbiAqIEZsaXBzIGdpdmVuIElOUFVUIGVsZW1lbnRzIGJldHdlZW4gbWFza2VkIChoaWRpbmcgdGhlIGZpZWxkIHZhbHVlKSBhbmQgdW5tYXNrZWRcbiAqIEBwYXJhbSB7QXJyYXkuSFRNTEVsZW1lbnR9IGZpZWxkcyAtIEFuIGFycmF5IG9mIElOUFVUIGVsZW1lbnRzXG4gKiBAcGFyYW0ge0Jvb2xlYW59IG1hc2sgLSBXaGV0aGVyIHRoZSBtYXNrIHNob3VsZCBiZSBhcHBsaWVkLCBoaWRpbmcgdGhlIGZpZWxkIHZhbHVlXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gKGZpZWxkLCBtYXNrKSA9PiB7XG4gIGZpZWxkLnNldEF0dHJpYnV0ZShcImF1dG9jYXBpdGFsaXplXCIsIFwib2ZmXCIpO1xuICBmaWVsZC5zZXRBdHRyaWJ1dGUoXCJhdXRvY29ycmVjdFwiLCBcIm9mZlwiKTtcbiAgZmllbGQuc2V0QXR0cmlidXRlKFwidHlwZVwiLCBtYXNrID8gXCJwYXNzd29yZFwiIDogXCJ0ZXh0XCIpO1xufTtcbiIsImNvbnN0IHJlc29sdmVJZFJlZnMgPSByZXF1aXJlKFwicmVzb2x2ZS1pZC1yZWZzXCIpO1xuY29uc3QgdG9nZ2xlRmllbGRNYXNrID0gcmVxdWlyZShcIi4vdG9nZ2xlLWZpZWxkLW1hc2tcIik7XG5cbmNvbnN0IENPTlRST0xTID0gXCJhcmlhLWNvbnRyb2xzXCI7XG5jb25zdCBQUkVTU0VEID0gXCJhcmlhLXByZXNzZWRcIjtcbmNvbnN0IFNIT1dfQVRUUiA9IFwiZGF0YS1zaG93LXRleHRcIjtcbmNvbnN0IEhJREVfQVRUUiA9IFwiZGF0YS1oaWRlLXRleHRcIjtcblxuLyoqXG4gKiBSZXBsYWNlIHRoZSB3b3JkIFwiU2hvd1wiIChvciBcInNob3dcIikgd2l0aCBcIkhpZGVcIiAob3IgXCJoaWRlXCIpIGluIGEgc3RyaW5nLlxuICogQHBhcmFtIHtzdHJpbmd9IHNob3dUZXh0XG4gKiBAcmV0dXJuIHtzdHJvbmd9IGhpZGVUZXh0XG4gKi9cbmNvbnN0IGdldEhpZGVUZXh0ID0gKHNob3dUZXh0KSA9PlxuICBzaG93VGV4dC5yZXBsYWNlKC9cXGJTaG93XFxiL2ksIChzaG93KSA9PiBgJHtzaG93WzBdID09PSBcIlNcIiA/IFwiSFwiIDogXCJoXCJ9aWRlYCk7XG5cbi8qKlxuICogQ29tcG9uZW50IHRoYXQgZGVjb3JhdGVzIGFuIEhUTUwgZWxlbWVudCB3aXRoIHRoZSBhYmlsaXR5IHRvIHRvZ2dsZSB0aGVcbiAqIG1hc2tlZCBzdGF0ZSBvZiBhbiBpbnB1dCBmaWVsZCAobGlrZSBhIHBhc3N3b3JkKSB3aGVuIGNsaWNrZWQuXG4gKiBUaGUgaWRzIG9mIHRoZSBmaWVsZHMgdG8gYmUgbWFza2VkIHdpbGwgYmUgcHVsbGVkIGRpcmVjdGx5IGZyb20gdGhlIGJ1dHRvbidzXG4gKiBgYXJpYS1jb250cm9sc2AgYXR0cmlidXRlLlxuICpcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbCAgICBQYXJlbnQgZWxlbWVudCBjb250YWluaW5nIHRoZSBmaWVsZHMgdG8gYmUgbWFza2VkXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IChlbCkgPT4ge1xuICAvLyB0aGlzIGlzIHRoZSAqdGFyZ2V0KiBzdGF0ZTpcbiAgLy8gKiBpZiB0aGUgZWxlbWVudCBoYXMgdGhlIGF0dHIgYW5kIGl0J3MgIT09IFwidHJ1ZVwiLCBwcmVzc2VkIGlzIHRydWVcbiAgLy8gKiBvdGhlcndpc2UsIHByZXNzZWQgaXMgZmFsc2VcbiAgY29uc3QgcHJlc3NlZCA9XG4gICAgZWwuaGFzQXR0cmlidXRlKFBSRVNTRUQpICYmIGVsLmdldEF0dHJpYnV0ZShQUkVTU0VEKSAhPT0gXCJ0cnVlXCI7XG5cbiAgY29uc3QgZmllbGRzID0gcmVzb2x2ZUlkUmVmcyhlbC5nZXRBdHRyaWJ1dGUoQ09OVFJPTFMpKTtcbiAgZmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB0b2dnbGVGaWVsZE1hc2soZmllbGQsIHByZXNzZWQpKTtcblxuICBpZiAoIWVsLmhhc0F0dHJpYnV0ZShTSE9XX0FUVFIpKSB7XG4gICAgZWwuc2V0QXR0cmlidXRlKFNIT1dfQVRUUiwgZWwudGV4dENvbnRlbnQpO1xuICB9XG5cbiAgY29uc3Qgc2hvd1RleHQgPSBlbC5nZXRBdHRyaWJ1dGUoU0hPV19BVFRSKTtcbiAgY29uc3QgaGlkZVRleHQgPSBlbC5nZXRBdHRyaWJ1dGUoSElERV9BVFRSKSB8fCBnZXRIaWRlVGV4dChzaG93VGV4dCk7XG5cbiAgZWwudGV4dENvbnRlbnQgPSBwcmVzc2VkID8gc2hvd1RleHQgOiBoaWRlVGV4dDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICBlbC5zZXRBdHRyaWJ1dGUoUFJFU1NFRCwgcHJlc3NlZCk7XG4gIHJldHVybiBwcmVzc2VkO1xufTtcbiIsImNvbnN0IEVYUEFOREVEID0gXCJhcmlhLWV4cGFuZGVkXCI7XG5jb25zdCBDT05UUk9MUyA9IFwiYXJpYS1jb250cm9sc1wiO1xuY29uc3QgSElEREVOID0gXCJoaWRkZW5cIjtcblxubW9kdWxlLmV4cG9ydHMgPSAoYnV0dG9uLCBleHBhbmRlZCkgPT4ge1xuICBsZXQgc2FmZUV4cGFuZGVkID0gZXhwYW5kZWQ7XG5cbiAgaWYgKHR5cGVvZiBzYWZlRXhwYW5kZWQgIT09IFwiYm9vbGVhblwiKSB7XG4gICAgc2FmZUV4cGFuZGVkID0gYnV0dG9uLmdldEF0dHJpYnV0ZShFWFBBTkRFRCkgPT09IFwiZmFsc2VcIjtcbiAgfVxuXG4gIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoRVhQQU5ERUQsIHNhZmVFeHBhbmRlZCk7XG5cbiAgY29uc3QgaWQgPSBidXR0b24uZ2V0QXR0cmlidXRlKENPTlRST0xTKTtcbiAgY29uc3QgY29udHJvbHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gIGlmICghY29udHJvbHMpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIHRvZ2dsZSB0YXJnZXQgZm91bmQgd2l0aCBpZDogXCIke2lkfVwiYCk7XG4gIH1cblxuICBpZiAoc2FmZUV4cGFuZGVkKSB7XG4gICAgY29udHJvbHMucmVtb3ZlQXR0cmlidXRlKEhJRERFTik7XG4gIH0gZWxzZSB7XG4gICAgY29udHJvbHMuc2V0QXR0cmlidXRlKEhJRERFTiwgXCJcIik7XG4gIH1cblxuICByZXR1cm4gc2FmZUV4cGFuZGVkO1xufTtcbiIsImNvbnN0IGRlYm91bmNlID0gcmVxdWlyZShcIi4vZGVib3VuY2VcIik7XG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vY29uZmlnXCIpO1xuXG5jb25zdCBDSEVDS0VEX0NMQVNTID0gYCR7UFJFRklYfS1jaGVja2xpc3RfX2l0ZW0tLWNoZWNrZWRgO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHZhbGlkYXRlKGVsKSB7XG4gIGNvbnN0IGlkID0gZWwuZGF0YXNldC52YWxpZGF0aW9uRWxlbWVudDtcbiAgY29uc3QgY2hlY2tMaXN0ID1cbiAgICBpZC5jaGFyQXQoMCkgPT09IFwiI1wiXG4gICAgICA/IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoaWQpXG4gICAgICA6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcblxuICBpZiAoIWNoZWNrTGlzdCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgTm8gdmFsaWRhdGlvbiBlbGVtZW50IGZvdW5kIHdpdGggaWQ6IFwiJHtpZH1cImApO1xuICB9XG5cbiAgbGV0IHN0YXR1c1N1bW1hcnkgPSBcIlwiO1xuICBPYmplY3QuZW50cmllcyhlbC5kYXRhc2V0KS5mb3JFYWNoKChba2V5LCB2YWx1ZV0pID0+IHtcbiAgICBpZiAoa2V5LnN0YXJ0c1dpdGgoXCJ2YWxpZGF0ZVwiKSkge1xuICAgICAgY29uc3QgdmFsaWRhdG9yTmFtZSA9IGtleS5zdWJzdHIoXCJ2YWxpZGF0ZVwiLmxlbmd0aCkudG9Mb3dlckNhc2UoKTtcbiAgICAgIGNvbnN0IHZhbGlkYXRvclBhdHRlcm4gPSBuZXcgUmVnRXhwKHZhbHVlKTtcbiAgICAgIGNvbnN0IHZhbGlkYXRvclNlbGVjdG9yID0gYFtkYXRhLXZhbGlkYXRvcj1cIiR7dmFsaWRhdG9yTmFtZX1cIl1gO1xuICAgICAgY29uc3QgdmFsaWRhdG9yQ2hlY2tib3ggPSBjaGVja0xpc3QucXVlcnlTZWxlY3Rvcih2YWxpZGF0b3JTZWxlY3Rvcik7XG4gICAgICBjb25zdCB2YWxpZGF0b3JQYXJlbnQgPSBlbC5wYXJlbnROb2RlO1xuICAgICAgY29uc3Qgc3RhdHVzU3VtbWFyeUNvbnRhaW5lciA9IHZhbGlkYXRvclBhcmVudC5xdWVyeVNlbGVjdG9yKFxuICAgICAgICBgW2RhdGEtdmFsaWRhdGlvbi1zdGF0dXNdYFxuICAgICAgKTtcblxuICAgICAgY29uc3QgY2hlY2tlZCA9IHZhbGlkYXRvclBhdHRlcm4udGVzdChlbC52YWx1ZSk7XG4gICAgICB2YWxpZGF0b3JDaGVja2JveC5jbGFzc0xpc3QudG9nZ2xlKENIRUNLRURfQ0xBU1MsIGNoZWNrZWQpO1xuXG4gICAgICBpZiAoIXZhbGlkYXRvckNoZWNrYm94KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gdmFsaWRhdG9yIGNoZWNrYm94IGZvdW5kIGZvcjogXCIke3ZhbGlkYXRvck5hbWV9XCJgKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ3JlYXRlIHN0YXR1cyByZXBvcnRzIGZvciBjaGVja2xpc3QgaXRlbXNcbiAgICAgIGNvbnN0IHN0YXR1c0NvbXBsZXRlID0gZWwuZGF0YXNldC52YWxpZGF0aW9uQ29tcGxldGUgfHwgXCJzdGF0dXMgY29tcGxldGVcIjtcbiAgICAgIGNvbnN0IHN0YXR1c0luY29tcGxldGUgPVxuICAgICAgICBlbC5kYXRhc2V0LnZhbGlkYXRpb25JbmNvbXBsZXRlIHx8IFwic3RhdHVzIGluY29tcGxldGVcIjtcbiAgICAgIGxldCBjaGVja2JveENvbnRlbnQgPSBgJHt2YWxpZGF0b3JDaGVja2JveC50ZXh0Q29udGVudH0gYDtcblxuICAgICAgaWYgKHZhbGlkYXRvckNoZWNrYm94LmNsYXNzTGlzdC5jb250YWlucyhDSEVDS0VEX0NMQVNTKSkge1xuICAgICAgICBjaGVja2JveENvbnRlbnQgKz0gc3RhdHVzQ29tcGxldGU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjaGVja2JveENvbnRlbnQgKz0gc3RhdHVzSW5jb21wbGV0ZTtcbiAgICAgIH1cblxuICAgICAgLy8gbW92ZSBzdGF0dXMgdXBkYXRlcyB0byBhcmlhLWxhYmVsIG9uIGNoZWNrbGlzdCBpdGVtXG4gICAgICB2YWxpZGF0b3JDaGVja2JveC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIGNoZWNrYm94Q29udGVudCk7XG5cbiAgICAgIC8vIENyZWF0ZSBhIHN1bW1hcnkgb2Ygc3RhdHVzIGZvciBhbGwgY2hlY2tsaXN0IGl0ZW1zXG4gICAgICBzdGF0dXNTdW1tYXJ5ICs9IGAke2NoZWNrYm94Q29udGVudH0uIGA7XG5cbiAgICAgIC8vIEFkZCBzdW1tYXJ5IHRvIHNjcmVlbiByZWFkZXIgc3VtbWFyeSBjb250YWluZXIsIGFmdGVyIGEgZGVsYXlcbiAgICAgIGNvbnN0IHNyVXBkYXRlU3RhdHVzID0gZGVib3VuY2UoKCkgPT4ge1xuICAgICAgICBzdGF0dXNTdW1tYXJ5Q29udGFpbmVyLnRleHRDb250ZW50ID0gc3RhdHVzU3VtbWFyeTtcbiAgICAgIH0sIDEwMDApO1xuXG4gICAgICBzclVwZGF0ZVN0YXR1cygpO1xuICAgIH1cbiAgfSk7XG59O1xuIiwiLypcbiAqIGNsYXNzTGlzdC5qczogQ3Jvc3MtYnJvd3NlciBmdWxsIGVsZW1lbnQuY2xhc3NMaXN0IGltcGxlbWVudGF0aW9uLlxuICogMjAxNC0wNy0yM1xuICpcbiAqIEJ5IEVsaSBHcmV5LCBodHRwOi8vZWxpZ3JleS5jb21cbiAqIFB1YmxpYyBEb21haW4uXG4gKiBOTyBXQVJSQU5UWSBFWFBSRVNTRUQgT1IgSU1QTElFRC4gVVNFIEFUIFlPVVIgT1dOIFJJU0suXG4gKi9cblxuLypnbG9iYWwgc2VsZiwgZG9jdW1lbnQsIERPTUV4Y2VwdGlvbiAqL1xuXG4vKiEgQHNvdXJjZSBodHRwOi8vcHVybC5lbGlncmV5LmNvbS9naXRodWIvY2xhc3NMaXN0LmpzL2Jsb2IvbWFzdGVyL2NsYXNzTGlzdC5qcyovXG5cbi8qIENvcGllZCBmcm9tIE1ETjpcbiAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9FbGVtZW50L2NsYXNzTGlzdFxuICovXG5cbmlmIChcImRvY3VtZW50XCIgaW4gd2luZG93LnNlbGYpIHtcblxuICAvLyBGdWxsIHBvbHlmaWxsIGZvciBicm93c2VycyB3aXRoIG5vIGNsYXNzTGlzdCBzdXBwb3J0XG4gIC8vIEluY2x1ZGluZyBJRSA8IEVkZ2UgbWlzc2luZyBTVkdFbGVtZW50LmNsYXNzTGlzdFxuICBpZiAoIShcImNsYXNzTGlzdFwiIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJfXCIpKVxuICAgIHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyAmJiAhKFwiY2xhc3NMaXN0XCIgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIixcImdcIikpKSB7XG5cbiAgKGZ1bmN0aW9uICh2aWV3KSB7XG5cbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIGlmICghKCdFbGVtZW50JyBpbiB2aWV3KSkgcmV0dXJuO1xuXG4gICAgdmFyXG4gICAgICAgIGNsYXNzTGlzdFByb3AgPSBcImNsYXNzTGlzdFwiXG4gICAgICAsIHByb3RvUHJvcCA9IFwicHJvdG90eXBlXCJcbiAgICAgICwgZWxlbUN0clByb3RvID0gdmlldy5FbGVtZW50W3Byb3RvUHJvcF1cbiAgICAgICwgb2JqQ3RyID0gT2JqZWN0XG4gICAgICAsIHN0clRyaW0gPSBTdHJpbmdbcHJvdG9Qcm9wXS50cmltIHx8IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgXCJcIik7XG4gICAgICB9XG4gICAgICAsIGFyckluZGV4T2YgPSBBcnJheVtwcm90b1Byb3BdLmluZGV4T2YgfHwgZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgdmFyXG4gICAgICAgICAgICBpID0gMFxuICAgICAgICAgICwgbGVuID0gdGhpcy5sZW5ndGhcbiAgICAgICAgO1xuICAgICAgICBmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgaWYgKGkgaW4gdGhpcyAmJiB0aGlzW2ldID09PSBpdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgfVxuICAgICAgLy8gVmVuZG9yczogcGxlYXNlIGFsbG93IGNvbnRlbnQgY29kZSB0byBpbnN0YW50aWF0ZSBET01FeGNlcHRpb25zXG4gICAgICAsIERPTUV4ID0gZnVuY3Rpb24gKHR5cGUsIG1lc3NhZ2UpIHtcbiAgICAgICAgdGhpcy5uYW1lID0gdHlwZTtcbiAgICAgICAgdGhpcy5jb2RlID0gRE9NRXhjZXB0aW9uW3R5cGVdO1xuICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICAgfVxuICAgICAgLCBjaGVja1Rva2VuQW5kR2V0SW5kZXggPSBmdW5jdGlvbiAoY2xhc3NMaXN0LCB0b2tlbikge1xuICAgICAgICBpZiAodG9rZW4gPT09IFwiXCIpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRE9NRXgoXG4gICAgICAgICAgICAgIFwiU1lOVEFYX0VSUlwiXG4gICAgICAgICAgICAsIFwiQW4gaW52YWxpZCBvciBpbGxlZ2FsIHN0cmluZyB3YXMgc3BlY2lmaWVkXCJcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGlmICgvXFxzLy50ZXN0KHRva2VuKSkge1xuICAgICAgICAgIHRocm93IG5ldyBET01FeChcbiAgICAgICAgICAgICAgXCJJTlZBTElEX0NIQVJBQ1RFUl9FUlJcIlxuICAgICAgICAgICAgLCBcIlN0cmluZyBjb250YWlucyBhbiBpbnZhbGlkIGNoYXJhY3RlclwiXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXJySW5kZXhPZi5jYWxsKGNsYXNzTGlzdCwgdG9rZW4pO1xuICAgICAgfVxuICAgICAgLCBDbGFzc0xpc3QgPSBmdW5jdGlvbiAoZWxlbSkge1xuICAgICAgICB2YXJcbiAgICAgICAgICAgIHRyaW1tZWRDbGFzc2VzID0gc3RyVHJpbS5jYWxsKGVsZW0uZ2V0QXR0cmlidXRlKFwiY2xhc3NcIikgfHwgXCJcIilcbiAgICAgICAgICAsIGNsYXNzZXMgPSB0cmltbWVkQ2xhc3NlcyA/IHRyaW1tZWRDbGFzc2VzLnNwbGl0KC9cXHMrLykgOiBbXVxuICAgICAgICAgICwgaSA9IDBcbiAgICAgICAgICAsIGxlbiA9IGNsYXNzZXMubGVuZ3RoXG4gICAgICAgIDtcbiAgICAgICAgZm9yICg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgIHRoaXMucHVzaChjbGFzc2VzW2ldKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl91cGRhdGVDbGFzc05hbWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCB0aGlzLnRvU3RyaW5nKCkpO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgLCBjbGFzc0xpc3RQcm90byA9IENsYXNzTGlzdFtwcm90b1Byb3BdID0gW11cbiAgICAgICwgY2xhc3NMaXN0R2V0dGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IENsYXNzTGlzdCh0aGlzKTtcbiAgICAgIH1cbiAgICA7XG4gICAgLy8gTW9zdCBET01FeGNlcHRpb24gaW1wbGVtZW50YXRpb25zIGRvbid0IGFsbG93IGNhbGxpbmcgRE9NRXhjZXB0aW9uJ3MgdG9TdHJpbmcoKVxuICAgIC8vIG9uIG5vbi1ET01FeGNlcHRpb25zLiBFcnJvcidzIHRvU3RyaW5nKCkgaXMgc3VmZmljaWVudCBoZXJlLlxuICAgIERPTUV4W3Byb3RvUHJvcF0gPSBFcnJvcltwcm90b1Byb3BdO1xuICAgIGNsYXNzTGlzdFByb3RvLml0ZW0gPSBmdW5jdGlvbiAoaSkge1xuICAgICAgcmV0dXJuIHRoaXNbaV0gfHwgbnVsbDtcbiAgICB9O1xuICAgIGNsYXNzTGlzdFByb3RvLmNvbnRhaW5zID0gZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgICB0b2tlbiArPSBcIlwiO1xuICAgICAgcmV0dXJuIGNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbikgIT09IC0xO1xuICAgIH07XG4gICAgY2xhc3NMaXN0UHJvdG8uYWRkID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyXG4gICAgICAgICAgdG9rZW5zID0gYXJndW1lbnRzXG4gICAgICAgICwgaSA9IDBcbiAgICAgICAgLCBsID0gdG9rZW5zLmxlbmd0aFxuICAgICAgICAsIHRva2VuXG4gICAgICAgICwgdXBkYXRlZCA9IGZhbHNlXG4gICAgICA7XG4gICAgICBkbyB7XG4gICAgICAgIHRva2VuID0gdG9rZW5zW2ldICsgXCJcIjtcbiAgICAgICAgaWYgKGNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbikgPT09IC0xKSB7XG4gICAgICAgICAgdGhpcy5wdXNoKHRva2VuKTtcbiAgICAgICAgICB1cGRhdGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgd2hpbGUgKCsraSA8IGwpO1xuXG4gICAgICBpZiAodXBkYXRlZCkge1xuICAgICAgICB0aGlzLl91cGRhdGVDbGFzc05hbWUoKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGNsYXNzTGlzdFByb3RvLnJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhclxuICAgICAgICAgIHRva2VucyA9IGFyZ3VtZW50c1xuICAgICAgICAsIGkgPSAwXG4gICAgICAgICwgbCA9IHRva2Vucy5sZW5ndGhcbiAgICAgICAgLCB0b2tlblxuICAgICAgICAsIHVwZGF0ZWQgPSBmYWxzZVxuICAgICAgICAsIGluZGV4XG4gICAgICA7XG4gICAgICBkbyB7XG4gICAgICAgIHRva2VuID0gdG9rZW5zW2ldICsgXCJcIjtcbiAgICAgICAgaW5kZXggPSBjaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4pO1xuICAgICAgICB3aGlsZSAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgdGhpcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgIHVwZGF0ZWQgPSB0cnVlO1xuICAgICAgICAgIGluZGV4ID0gY2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgd2hpbGUgKCsraSA8IGwpO1xuXG4gICAgICBpZiAodXBkYXRlZCkge1xuICAgICAgICB0aGlzLl91cGRhdGVDbGFzc05hbWUoKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGNsYXNzTGlzdFByb3RvLnRvZ2dsZSA9IGZ1bmN0aW9uICh0b2tlbiwgZm9yY2UpIHtcbiAgICAgIHRva2VuICs9IFwiXCI7XG5cbiAgICAgIHZhclxuICAgICAgICAgIHJlc3VsdCA9IHRoaXMuY29udGFpbnModG9rZW4pXG4gICAgICAgICwgbWV0aG9kID0gcmVzdWx0ID9cbiAgICAgICAgICBmb3JjZSAhPT0gdHJ1ZSAmJiBcInJlbW92ZVwiXG4gICAgICAgIDpcbiAgICAgICAgICBmb3JjZSAhPT0gZmFsc2UgJiYgXCJhZGRcIlxuICAgICAgO1xuXG4gICAgICBpZiAobWV0aG9kKSB7XG4gICAgICAgIHRoaXNbbWV0aG9kXSh0b2tlbik7XG4gICAgICB9XG5cbiAgICAgIGlmIChmb3JjZSA9PT0gdHJ1ZSB8fCBmb3JjZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIGZvcmNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuICFyZXN1bHQ7XG4gICAgICB9XG4gICAgfTtcbiAgICBjbGFzc0xpc3RQcm90by50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzLmpvaW4oXCIgXCIpO1xuICAgIH07XG5cbiAgICBpZiAob2JqQ3RyLmRlZmluZVByb3BlcnR5KSB7XG4gICAgICB2YXIgY2xhc3NMaXN0UHJvcERlc2MgPSB7XG4gICAgICAgICAgZ2V0OiBjbGFzc0xpc3RHZXR0ZXJcbiAgICAgICAgLCBlbnVtZXJhYmxlOiB0cnVlXG4gICAgICAgICwgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9O1xuICAgICAgdHJ5IHtcbiAgICAgICAgb2JqQ3RyLmRlZmluZVByb3BlcnR5KGVsZW1DdHJQcm90bywgY2xhc3NMaXN0UHJvcCwgY2xhc3NMaXN0UHJvcERlc2MpO1xuICAgICAgfSBjYXRjaCAoZXgpIHsgLy8gSUUgOCBkb2Vzbid0IHN1cHBvcnQgZW51bWVyYWJsZTp0cnVlXG4gICAgICAgIGlmIChleC5udW1iZXIgPT09IC0weDdGRjVFQzU0KSB7XG4gICAgICAgICAgY2xhc3NMaXN0UHJvcERlc2MuZW51bWVyYWJsZSA9IGZhbHNlO1xuICAgICAgICAgIG9iakN0ci5kZWZpbmVQcm9wZXJ0eShlbGVtQ3RyUHJvdG8sIGNsYXNzTGlzdFByb3AsIGNsYXNzTGlzdFByb3BEZXNjKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAob2JqQ3RyW3Byb3RvUHJvcF0uX19kZWZpbmVHZXR0ZXJfXykge1xuICAgICAgZWxlbUN0clByb3RvLl9fZGVmaW5lR2V0dGVyX18oY2xhc3NMaXN0UHJvcCwgY2xhc3NMaXN0R2V0dGVyKTtcbiAgICB9XG5cbiAgICB9KHdpbmRvdy5zZWxmKSk7XG5cbiAgICB9IGVsc2Uge1xuICAgIC8vIFRoZXJlIGlzIGZ1bGwgb3IgcGFydGlhbCBuYXRpdmUgY2xhc3NMaXN0IHN1cHBvcnQsIHNvIGp1c3QgY2hlY2sgaWYgd2UgbmVlZFxuICAgIC8vIHRvIG5vcm1hbGl6ZSB0aGUgYWRkL3JlbW92ZSBhbmQgdG9nZ2xlIEFQSXMuXG5cbiAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgIHZhciB0ZXN0RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJfXCIpO1xuXG4gICAgICB0ZXN0RWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiYzFcIiwgXCJjMlwiKTtcblxuICAgICAgLy8gUG9seWZpbGwgZm9yIElFIDEwLzExIGFuZCBGaXJlZm94IDwyNiwgd2hlcmUgY2xhc3NMaXN0LmFkZCBhbmRcbiAgICAgIC8vIGNsYXNzTGlzdC5yZW1vdmUgZXhpc3QgYnV0IHN1cHBvcnQgb25seSBvbmUgYXJndW1lbnQgYXQgYSB0aW1lLlxuICAgICAgaWYgKCF0ZXN0RWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoXCJjMlwiKSkge1xuICAgICAgICB2YXIgY3JlYXRlTWV0aG9kID0gZnVuY3Rpb24obWV0aG9kKSB7XG4gICAgICAgICAgdmFyIG9yaWdpbmFsID0gRE9NVG9rZW5MaXN0LnByb3RvdHlwZVttZXRob2RdO1xuXG4gICAgICAgICAgRE9NVG9rZW5MaXN0LnByb3RvdHlwZVttZXRob2RdID0gZnVuY3Rpb24odG9rZW4pIHtcbiAgICAgICAgICAgIHZhciBpLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgdG9rZW4gPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICAgIG9yaWdpbmFsLmNhbGwodGhpcywgdG9rZW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICAgIGNyZWF0ZU1ldGhvZCgnYWRkJyk7XG4gICAgICAgIGNyZWF0ZU1ldGhvZCgncmVtb3ZlJyk7XG4gICAgICB9XG5cbiAgICAgIHRlc3RFbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoXCJjM1wiLCBmYWxzZSk7XG5cbiAgICAgIC8vIFBvbHlmaWxsIGZvciBJRSAxMCBhbmQgRmlyZWZveCA8MjQsIHdoZXJlIGNsYXNzTGlzdC50b2dnbGUgZG9lcyBub3RcbiAgICAgIC8vIHN1cHBvcnQgdGhlIHNlY29uZCBhcmd1bWVudC5cbiAgICAgIGlmICh0ZXN0RWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoXCJjM1wiKSkge1xuICAgICAgICB2YXIgX3RvZ2dsZSA9IERPTVRva2VuTGlzdC5wcm90b3R5cGUudG9nZ2xlO1xuXG4gICAgICAgIERPTVRva2VuTGlzdC5wcm90b3R5cGUudG9nZ2xlID0gZnVuY3Rpb24odG9rZW4sIGZvcmNlKSB7XG4gICAgICAgICAgaWYgKDEgaW4gYXJndW1lbnRzICYmICF0aGlzLmNvbnRhaW5zKHRva2VuKSA9PT0gIWZvcmNlKSB7XG4gICAgICAgICAgICByZXR1cm4gZm9yY2U7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBfdG9nZ2xlLmNhbGwodGhpcywgdG9rZW4pO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgfVxuXG4gICAgICB0ZXN0RWxlbWVudCA9IG51bGw7XG4gICAgfSgpKTtcbiAgfVxufVxuIiwiLy8gZWxlbWVudC1jbG9zZXN0IHwgQ0MwLTEuMCB8IGdpdGh1Yi5jb20vam9uYXRoYW50bmVhbC9jbG9zZXN0XG5cbihmdW5jdGlvbiAoRWxlbWVudFByb3RvKSB7XG5cdGlmICh0eXBlb2YgRWxlbWVudFByb3RvLm1hdGNoZXMgIT09ICdmdW5jdGlvbicpIHtcblx0XHRFbGVtZW50UHJvdG8ubWF0Y2hlcyA9IEVsZW1lbnRQcm90by5tc01hdGNoZXNTZWxlY3RvciB8fCBFbGVtZW50UHJvdG8ubW96TWF0Y2hlc1NlbGVjdG9yIHx8IEVsZW1lbnRQcm90by53ZWJraXRNYXRjaGVzU2VsZWN0b3IgfHwgZnVuY3Rpb24gbWF0Y2hlcyhzZWxlY3Rvcikge1xuXHRcdFx0dmFyIGVsZW1lbnQgPSB0aGlzO1xuXHRcdFx0dmFyIGVsZW1lbnRzID0gKGVsZW1lbnQuZG9jdW1lbnQgfHwgZWxlbWVudC5vd25lckRvY3VtZW50KS5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcblx0XHRcdHZhciBpbmRleCA9IDA7XG5cblx0XHRcdHdoaWxlIChlbGVtZW50c1tpbmRleF0gJiYgZWxlbWVudHNbaW5kZXhdICE9PSBlbGVtZW50KSB7XG5cdFx0XHRcdCsraW5kZXg7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBCb29sZWFuKGVsZW1lbnRzW2luZGV4XSk7XG5cdFx0fTtcblx0fVxuXG5cdGlmICh0eXBlb2YgRWxlbWVudFByb3RvLmNsb3Nlc3QgIT09ICdmdW5jdGlvbicpIHtcblx0XHRFbGVtZW50UHJvdG8uY2xvc2VzdCA9IGZ1bmN0aW9uIGNsb3Nlc3Qoc2VsZWN0b3IpIHtcblx0XHRcdHZhciBlbGVtZW50ID0gdGhpcztcblxuXHRcdFx0d2hpbGUgKGVsZW1lbnQgJiYgZWxlbWVudC5ub2RlVHlwZSA9PT0gMSkge1xuXHRcdFx0XHRpZiAoZWxlbWVudC5tYXRjaGVzKHNlbGVjdG9yKSkge1xuXHRcdFx0XHRcdHJldHVybiBlbGVtZW50O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZWxlbWVudCA9IGVsZW1lbnQucGFyZW50Tm9kZTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fTtcblx0fVxufSkod2luZG93LkVsZW1lbnQucHJvdG90eXBlKTtcbiIsIi8qIGdsb2JhbCBkZWZpbmUsIEtleWJvYXJkRXZlbnQsIG1vZHVsZSAqL1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gIHZhciBrZXlib2FyZGV2ZW50S2V5UG9seWZpbGwgPSB7XG4gICAgcG9seWZpbGw6IHBvbHlmaWxsLFxuICAgIGtleXM6IHtcbiAgICAgIDM6ICdDYW5jZWwnLFxuICAgICAgNjogJ0hlbHAnLFxuICAgICAgODogJ0JhY2tzcGFjZScsXG4gICAgICA5OiAnVGFiJyxcbiAgICAgIDEyOiAnQ2xlYXInLFxuICAgICAgMTM6ICdFbnRlcicsXG4gICAgICAxNjogJ1NoaWZ0JyxcbiAgICAgIDE3OiAnQ29udHJvbCcsXG4gICAgICAxODogJ0FsdCcsXG4gICAgICAxOTogJ1BhdXNlJyxcbiAgICAgIDIwOiAnQ2Fwc0xvY2snLFxuICAgICAgMjc6ICdFc2NhcGUnLFxuICAgICAgMjg6ICdDb252ZXJ0JyxcbiAgICAgIDI5OiAnTm9uQ29udmVydCcsXG4gICAgICAzMDogJ0FjY2VwdCcsXG4gICAgICAzMTogJ01vZGVDaGFuZ2UnLFxuICAgICAgMzI6ICcgJyxcbiAgICAgIDMzOiAnUGFnZVVwJyxcbiAgICAgIDM0OiAnUGFnZURvd24nLFxuICAgICAgMzU6ICdFbmQnLFxuICAgICAgMzY6ICdIb21lJyxcbiAgICAgIDM3OiAnQXJyb3dMZWZ0JyxcbiAgICAgIDM4OiAnQXJyb3dVcCcsXG4gICAgICAzOTogJ0Fycm93UmlnaHQnLFxuICAgICAgNDA6ICdBcnJvd0Rvd24nLFxuICAgICAgNDE6ICdTZWxlY3QnLFxuICAgICAgNDI6ICdQcmludCcsXG4gICAgICA0MzogJ0V4ZWN1dGUnLFxuICAgICAgNDQ6ICdQcmludFNjcmVlbicsXG4gICAgICA0NTogJ0luc2VydCcsXG4gICAgICA0NjogJ0RlbGV0ZScsXG4gICAgICA0ODogWycwJywgJyknXSxcbiAgICAgIDQ5OiBbJzEnLCAnISddLFxuICAgICAgNTA6IFsnMicsICdAJ10sXG4gICAgICA1MTogWyczJywgJyMnXSxcbiAgICAgIDUyOiBbJzQnLCAnJCddLFxuICAgICAgNTM6IFsnNScsICclJ10sXG4gICAgICA1NDogWyc2JywgJ14nXSxcbiAgICAgIDU1OiBbJzcnLCAnJiddLFxuICAgICAgNTY6IFsnOCcsICcqJ10sXG4gICAgICA1NzogWyc5JywgJygnXSxcbiAgICAgIDkxOiAnT1MnLFxuICAgICAgOTM6ICdDb250ZXh0TWVudScsXG4gICAgICAxNDQ6ICdOdW1Mb2NrJyxcbiAgICAgIDE0NTogJ1Njcm9sbExvY2snLFxuICAgICAgMTgxOiAnVm9sdW1lTXV0ZScsXG4gICAgICAxODI6ICdWb2x1bWVEb3duJyxcbiAgICAgIDE4MzogJ1ZvbHVtZVVwJyxcbiAgICAgIDE4NjogWyc7JywgJzonXSxcbiAgICAgIDE4NzogWyc9JywgJysnXSxcbiAgICAgIDE4ODogWycsJywgJzwnXSxcbiAgICAgIDE4OTogWyctJywgJ18nXSxcbiAgICAgIDE5MDogWycuJywgJz4nXSxcbiAgICAgIDE5MTogWycvJywgJz8nXSxcbiAgICAgIDE5MjogWydgJywgJ34nXSxcbiAgICAgIDIxOTogWydbJywgJ3snXSxcbiAgICAgIDIyMDogWydcXFxcJywgJ3wnXSxcbiAgICAgIDIyMTogWyddJywgJ30nXSxcbiAgICAgIDIyMjogW1wiJ1wiLCAnXCInXSxcbiAgICAgIDIyNDogJ01ldGEnLFxuICAgICAgMjI1OiAnQWx0R3JhcGgnLFxuICAgICAgMjQ2OiAnQXR0bicsXG4gICAgICAyNDc6ICdDclNlbCcsXG4gICAgICAyNDg6ICdFeFNlbCcsXG4gICAgICAyNDk6ICdFcmFzZUVvZicsXG4gICAgICAyNTA6ICdQbGF5JyxcbiAgICAgIDI1MTogJ1pvb21PdXQnXG4gICAgfVxuICB9O1xuXG4gIC8vIEZ1bmN0aW9uIGtleXMgKEYxLTI0KS5cbiAgdmFyIGk7XG4gIGZvciAoaSA9IDE7IGkgPCAyNTsgaSsrKSB7XG4gICAga2V5Ym9hcmRldmVudEtleVBvbHlmaWxsLmtleXNbMTExICsgaV0gPSAnRicgKyBpO1xuICB9XG5cbiAgLy8gUHJpbnRhYmxlIEFTQ0lJIGNoYXJhY3RlcnMuXG4gIHZhciBsZXR0ZXIgPSAnJztcbiAgZm9yIChpID0gNjU7IGkgPCA5MTsgaSsrKSB7XG4gICAgbGV0dGVyID0gU3RyaW5nLmZyb21DaGFyQ29kZShpKTtcbiAgICBrZXlib2FyZGV2ZW50S2V5UG9seWZpbGwua2V5c1tpXSA9IFtsZXR0ZXIudG9Mb3dlckNhc2UoKSwgbGV0dGVyLnRvVXBwZXJDYXNlKCldO1xuICB9XG5cbiAgZnVuY3Rpb24gcG9seWZpbGwgKCkge1xuICAgIGlmICghKCdLZXlib2FyZEV2ZW50JyBpbiB3aW5kb3cpIHx8XG4gICAgICAgICdrZXknIGluIEtleWJvYXJkRXZlbnQucHJvdG90eXBlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gUG9seWZpbGwgYGtleWAgb24gYEtleWJvYXJkRXZlbnRgLlxuICAgIHZhciBwcm90byA9IHtcbiAgICAgIGdldDogZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgdmFyIGtleSA9IGtleWJvYXJkZXZlbnRLZXlQb2x5ZmlsbC5rZXlzW3RoaXMud2hpY2ggfHwgdGhpcy5rZXlDb2RlXTtcblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShrZXkpKSB7XG4gICAgICAgICAga2V5ID0ga2V5Wyt0aGlzLnNoaWZ0S2V5XTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBrZXk7XG4gICAgICB9XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoS2V5Ym9hcmRFdmVudC5wcm90b3R5cGUsICdrZXknLCBwcm90byk7XG4gICAgcmV0dXJuIHByb3RvO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZSgna2V5Ym9hcmRldmVudC1rZXktcG9seWZpbGwnLCBrZXlib2FyZGV2ZW50S2V5UG9seWZpbGwpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICAgIG1vZHVsZS5leHBvcnRzID0ga2V5Ym9hcmRldmVudEtleVBvbHlmaWxsO1xuICB9IGVsc2UgaWYgKHdpbmRvdykge1xuICAgIHdpbmRvdy5rZXlib2FyZGV2ZW50S2V5UG9seWZpbGwgPSBrZXlib2FyZGV2ZW50S2V5UG9seWZpbGw7XG4gIH1cblxufSkoKTtcbiIsIi8qXG5vYmplY3QtYXNzaWduXG4oYykgU2luZHJlIFNvcmh1c1xuQGxpY2Vuc2UgTUlUXG4qL1xuXG4ndXNlIHN0cmljdCc7XG4vKiBlc2xpbnQtZGlzYWJsZSBuby11bnVzZWQtdmFycyAqL1xudmFyIGdldE93blByb3BlcnR5U3ltYm9scyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHM7XG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHByb3BJc0VudW1lcmFibGUgPSBPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlO1xuXG5mdW5jdGlvbiB0b09iamVjdCh2YWwpIHtcblx0aWYgKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ09iamVjdC5hc3NpZ24gY2Fubm90IGJlIGNhbGxlZCB3aXRoIG51bGwgb3IgdW5kZWZpbmVkJyk7XG5cdH1cblxuXHRyZXR1cm4gT2JqZWN0KHZhbCk7XG59XG5cbmZ1bmN0aW9uIHNob3VsZFVzZU5hdGl2ZSgpIHtcblx0dHJ5IHtcblx0XHRpZiAoIU9iamVjdC5hc3NpZ24pIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBEZXRlY3QgYnVnZ3kgcHJvcGVydHkgZW51bWVyYXRpb24gb3JkZXIgaW4gb2xkZXIgVjggdmVyc2lvbnMuXG5cblx0XHQvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvdjgvaXNzdWVzL2RldGFpbD9pZD00MTE4XG5cdFx0dmFyIHRlc3QxID0gbmV3IFN0cmluZygnYWJjJyk7ICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW5ldy13cmFwcGVyc1xuXHRcdHRlc3QxWzVdID0gJ2RlJztcblx0XHRpZiAoT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGVzdDEpWzBdID09PSAnNScpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0zMDU2XG5cdFx0dmFyIHRlc3QyID0ge307XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCAxMDsgaSsrKSB7XG5cdFx0XHR0ZXN0MlsnXycgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGkpXSA9IGk7XG5cdFx0fVxuXHRcdHZhciBvcmRlcjIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0ZXN0MikubWFwKGZ1bmN0aW9uIChuKSB7XG5cdFx0XHRyZXR1cm4gdGVzdDJbbl07XG5cdFx0fSk7XG5cdFx0aWYgKG9yZGVyMi5qb2luKCcnKSAhPT0gJzAxMjM0NTY3ODknKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9MzA1NlxuXHRcdHZhciB0ZXN0MyA9IHt9O1xuXHRcdCdhYmNkZWZnaGlqa2xtbm9wcXJzdCcuc3BsaXQoJycpLmZvckVhY2goZnVuY3Rpb24gKGxldHRlcikge1xuXHRcdFx0dGVzdDNbbGV0dGVyXSA9IGxldHRlcjtcblx0XHR9KTtcblx0XHRpZiAoT2JqZWN0LmtleXMoT2JqZWN0LmFzc2lnbih7fSwgdGVzdDMpKS5qb2luKCcnKSAhPT1cblx0XHRcdFx0J2FiY2RlZmdoaWprbG1ub3BxcnN0Jykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9IGNhdGNoIChlcnIpIHtcblx0XHQvLyBXZSBkb24ndCBleHBlY3QgYW55IG9mIHRoZSBhYm92ZSB0byB0aHJvdywgYnV0IGJldHRlciB0byBiZSBzYWZlLlxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNob3VsZFVzZU5hdGl2ZSgpID8gT2JqZWN0LmFzc2lnbiA6IGZ1bmN0aW9uICh0YXJnZXQsIHNvdXJjZSkge1xuXHR2YXIgZnJvbTtcblx0dmFyIHRvID0gdG9PYmplY3QodGFyZ2V0KTtcblx0dmFyIHN5bWJvbHM7XG5cblx0Zm9yICh2YXIgcyA9IDE7IHMgPCBhcmd1bWVudHMubGVuZ3RoOyBzKyspIHtcblx0XHRmcm9tID0gT2JqZWN0KGFyZ3VtZW50c1tzXSk7XG5cblx0XHRmb3IgKHZhciBrZXkgaW4gZnJvbSkge1xuXHRcdFx0aWYgKGhhc093blByb3BlcnR5LmNhbGwoZnJvbSwga2V5KSkge1xuXHRcdFx0XHR0b1trZXldID0gZnJvbVtrZXldO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChnZXRPd25Qcm9wZXJ0eVN5bWJvbHMpIHtcblx0XHRcdHN5bWJvbHMgPSBnZXRPd25Qcm9wZXJ0eVN5bWJvbHMoZnJvbSk7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHN5bWJvbHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKHByb3BJc0VudW1lcmFibGUuY2FsbChmcm9tLCBzeW1ib2xzW2ldKSkge1xuXHRcdFx0XHRcdHRvW3N5bWJvbHNbaV1dID0gZnJvbVtzeW1ib2xzW2ldXTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0bztcbn07XG4iLCJjb25zdCBhc3NpZ24gPSByZXF1aXJlKCdvYmplY3QtYXNzaWduJyk7XG5jb25zdCBkZWxlZ2F0ZSA9IHJlcXVpcmUoJy4uL2RlbGVnYXRlJyk7XG5jb25zdCBkZWxlZ2F0ZUFsbCA9IHJlcXVpcmUoJy4uL2RlbGVnYXRlQWxsJyk7XG5cbmNvbnN0IERFTEVHQVRFX1BBVFRFUk4gPSAvXiguKyk6ZGVsZWdhdGVcXCgoLispXFwpJC87XG5jb25zdCBTUEFDRSA9ICcgJztcblxuY29uc3QgZ2V0TGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSwgaGFuZGxlcikge1xuICB2YXIgbWF0Y2ggPSB0eXBlLm1hdGNoKERFTEVHQVRFX1BBVFRFUk4pO1xuICB2YXIgc2VsZWN0b3I7XG4gIGlmIChtYXRjaCkge1xuICAgIHR5cGUgPSBtYXRjaFsxXTtcbiAgICBzZWxlY3RvciA9IG1hdGNoWzJdO1xuICB9XG5cbiAgdmFyIG9wdGlvbnM7XG4gIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gJ29iamVjdCcpIHtcbiAgICBvcHRpb25zID0ge1xuICAgICAgY2FwdHVyZTogcG9wS2V5KGhhbmRsZXIsICdjYXB0dXJlJyksXG4gICAgICBwYXNzaXZlOiBwb3BLZXkoaGFuZGxlciwgJ3Bhc3NpdmUnKVxuICAgIH07XG4gIH1cblxuICB2YXIgbGlzdGVuZXIgPSB7XG4gICAgc2VsZWN0b3I6IHNlbGVjdG9yLFxuICAgIGRlbGVnYXRlOiAodHlwZW9mIGhhbmRsZXIgPT09ICdvYmplY3QnKVxuICAgICAgPyBkZWxlZ2F0ZUFsbChoYW5kbGVyKVxuICAgICAgOiBzZWxlY3RvclxuICAgICAgICA/IGRlbGVnYXRlKHNlbGVjdG9yLCBoYW5kbGVyKVxuICAgICAgICA6IGhhbmRsZXIsXG4gICAgb3B0aW9uczogb3B0aW9uc1xuICB9O1xuXG4gIGlmICh0eXBlLmluZGV4T2YoU1BBQ0UpID4gLTEpIHtcbiAgICByZXR1cm4gdHlwZS5zcGxpdChTUEFDRSkubWFwKGZ1bmN0aW9uKF90eXBlKSB7XG4gICAgICByZXR1cm4gYXNzaWduKHt0eXBlOiBfdHlwZX0sIGxpc3RlbmVyKTtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBsaXN0ZW5lci50eXBlID0gdHlwZTtcbiAgICByZXR1cm4gW2xpc3RlbmVyXTtcbiAgfVxufTtcblxudmFyIHBvcEtleSA9IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gIHZhciB2YWx1ZSA9IG9ialtrZXldO1xuICBkZWxldGUgb2JqW2tleV07XG4gIHJldHVybiB2YWx1ZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYmVoYXZpb3IoZXZlbnRzLCBwcm9wcykge1xuICBjb25zdCBsaXN0ZW5lcnMgPSBPYmplY3Qua2V5cyhldmVudHMpXG4gICAgLnJlZHVjZShmdW5jdGlvbihtZW1vLCB0eXBlKSB7XG4gICAgICB2YXIgbGlzdGVuZXJzID0gZ2V0TGlzdGVuZXJzKHR5cGUsIGV2ZW50c1t0eXBlXSk7XG4gICAgICByZXR1cm4gbWVtby5jb25jYXQobGlzdGVuZXJzKTtcbiAgICB9LCBbXSk7XG5cbiAgcmV0dXJuIGFzc2lnbih7XG4gICAgYWRkOiBmdW5jdGlvbiBhZGRCZWhhdmlvcihlbGVtZW50KSB7XG4gICAgICBsaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbihsaXN0ZW5lcikge1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgbGlzdGVuZXIudHlwZSxcbiAgICAgICAgICBsaXN0ZW5lci5kZWxlZ2F0ZSxcbiAgICAgICAgICBsaXN0ZW5lci5vcHRpb25zXG4gICAgICAgICk7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHJlbW92ZTogZnVuY3Rpb24gcmVtb3ZlQmVoYXZpb3IoZWxlbWVudCkge1xuICAgICAgbGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obGlzdGVuZXIpIHtcbiAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFxuICAgICAgICAgIGxpc3RlbmVyLnR5cGUsXG4gICAgICAgICAgbGlzdGVuZXIuZGVsZWdhdGUsXG4gICAgICAgICAgbGlzdGVuZXIub3B0aW9uc1xuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfVxuICB9LCBwcm9wcyk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjb21wb3NlKGZ1bmN0aW9ucykge1xuICByZXR1cm4gZnVuY3Rpb24oZSkge1xuICAgIHJldHVybiBmdW5jdGlvbnMuc29tZShmdW5jdGlvbihmbikge1xuICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgZSkgPT09IGZhbHNlO1xuICAgIH0sIHRoaXMpO1xuICB9O1xufTtcbiIsIi8vIHBvbHlmaWxsIEVsZW1lbnQucHJvdG90eXBlLmNsb3Nlc3RcbnJlcXVpcmUoJ2VsZW1lbnQtY2xvc2VzdCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlbGVnYXRlKHNlbGVjdG9yLCBmbikge1xuICByZXR1cm4gZnVuY3Rpb24gZGVsZWdhdGlvbihldmVudCkge1xuICAgIHZhciB0YXJnZXQgPSBldmVudC50YXJnZXQuY2xvc2VzdChzZWxlY3Rvcik7XG4gICAgaWYgKHRhcmdldCkge1xuICAgICAgcmV0dXJuIGZuLmNhbGwodGFyZ2V0LCBldmVudCk7XG4gICAgfVxuICB9XG59O1xuIiwiY29uc3QgZGVsZWdhdGUgPSByZXF1aXJlKCcuLi9kZWxlZ2F0ZScpO1xuY29uc3QgY29tcG9zZSA9IHJlcXVpcmUoJy4uL2NvbXBvc2UnKTtcblxuY29uc3QgU1BMQVQgPSAnKic7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGVsZWdhdGVBbGwoc2VsZWN0b3JzKSB7XG4gIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhzZWxlY3RvcnMpXG5cbiAgLy8gWFhYIG9wdGltaXphdGlvbjogaWYgdGhlcmUgaXMgb25seSBvbmUgaGFuZGxlciBhbmQgaXQgYXBwbGllcyB0b1xuICAvLyBhbGwgZWxlbWVudHMgKHRoZSBcIipcIiBDU1Mgc2VsZWN0b3IpLCB0aGVuIGp1c3QgcmV0dXJuIHRoYXRcbiAgLy8gaGFuZGxlclxuICBpZiAoa2V5cy5sZW5ndGggPT09IDEgJiYga2V5c1swXSA9PT0gU1BMQVQpIHtcbiAgICByZXR1cm4gc2VsZWN0b3JzW1NQTEFUXTtcbiAgfVxuXG4gIGNvbnN0IGRlbGVnYXRlcyA9IGtleXMucmVkdWNlKGZ1bmN0aW9uKG1lbW8sIHNlbGVjdG9yKSB7XG4gICAgbWVtby5wdXNoKGRlbGVnYXRlKHNlbGVjdG9yLCBzZWxlY3RvcnNbc2VsZWN0b3JdKSk7XG4gICAgcmV0dXJuIG1lbW87XG4gIH0sIFtdKTtcbiAgcmV0dXJuIGNvbXBvc2UoZGVsZWdhdGVzKTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlnbm9yZShlbGVtZW50LCBmbikge1xuICByZXR1cm4gZnVuY3Rpb24gaWdub3JhbmNlKGUpIHtcbiAgICBpZiAoZWxlbWVudCAhPT0gZS50YXJnZXQgJiYgIWVsZW1lbnQuY29udGFpbnMoZS50YXJnZXQpKSB7XG4gICAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCBlKTtcbiAgICB9XG4gIH07XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIGJlaGF2aW9yOiAgICAgcmVxdWlyZSgnLi9iZWhhdmlvcicpLFxuICBkZWxlZ2F0ZTogICAgIHJlcXVpcmUoJy4vZGVsZWdhdGUnKSxcbiAgZGVsZWdhdGVBbGw6ICByZXF1aXJlKCcuL2RlbGVnYXRlQWxsJyksXG4gIGlnbm9yZTogICAgICAgcmVxdWlyZSgnLi9pZ25vcmUnKSxcbiAga2V5bWFwOiAgICAgICByZXF1aXJlKCcuL2tleW1hcCcpLFxufTtcbiIsInJlcXVpcmUoJ2tleWJvYXJkZXZlbnQta2V5LXBvbHlmaWxsJyk7XG5cbi8vIHRoZXNlIGFyZSB0aGUgb25seSByZWxldmFudCBtb2RpZmllcnMgc3VwcG9ydGVkIG9uIGFsbCBwbGF0Zm9ybXMsXG4vLyBhY2NvcmRpbmcgdG8gTUROOlxuLy8gPGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9LZXlib2FyZEV2ZW50L2dldE1vZGlmaWVyU3RhdGU+XG5jb25zdCBNT0RJRklFUlMgPSB7XG4gICdBbHQnOiAgICAgICdhbHRLZXknLFxuICAnQ29udHJvbCc6ICAnY3RybEtleScsXG4gICdDdHJsJzogICAgICdjdHJsS2V5JyxcbiAgJ1NoaWZ0JzogICAgJ3NoaWZ0S2V5J1xufTtcblxuY29uc3QgTU9ESUZJRVJfU0VQQVJBVE9SID0gJysnO1xuXG5jb25zdCBnZXRFdmVudEtleSA9IGZ1bmN0aW9uKGV2ZW50LCBoYXNNb2RpZmllcnMpIHtcbiAgdmFyIGtleSA9IGV2ZW50LmtleTtcbiAgaWYgKGhhc01vZGlmaWVycykge1xuICAgIGZvciAodmFyIG1vZGlmaWVyIGluIE1PRElGSUVSUykge1xuICAgICAgaWYgKGV2ZW50W01PRElGSUVSU1ttb2RpZmllcl1dID09PSB0cnVlKSB7XG4gICAgICAgIGtleSA9IFttb2RpZmllciwga2V5XS5qb2luKE1PRElGSUVSX1NFUEFSQVRPUik7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBrZXk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGtleW1hcChrZXlzKSB7XG4gIGNvbnN0IGhhc01vZGlmaWVycyA9IE9iamVjdC5rZXlzKGtleXMpLnNvbWUoZnVuY3Rpb24oa2V5KSB7XG4gICAgcmV0dXJuIGtleS5pbmRleE9mKE1PRElGSUVSX1NFUEFSQVRPUikgPiAtMTtcbiAgfSk7XG4gIHJldHVybiBmdW5jdGlvbihldmVudCkge1xuICAgIHZhciBrZXkgPSBnZXRFdmVudEtleShldmVudCwgaGFzTW9kaWZpZXJzKTtcbiAgICByZXR1cm4gW2tleSwga2V5LnRvTG93ZXJDYXNlKCldXG4gICAgICAucmVkdWNlKGZ1bmN0aW9uKHJlc3VsdCwgX2tleSkge1xuICAgICAgICBpZiAoX2tleSBpbiBrZXlzKSB7XG4gICAgICAgICAgcmVzdWx0ID0ga2V5c1trZXldLmNhbGwodGhpcywgZXZlbnQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9LCB1bmRlZmluZWQpO1xuICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMuTU9ESUZJRVJTID0gTU9ESUZJRVJTO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBvbmNlKGxpc3RlbmVyLCBvcHRpb25zKSB7XG4gIHZhciB3cmFwcGVkID0gZnVuY3Rpb24gd3JhcHBlZE9uY2UoZSkge1xuICAgIGUuY3VycmVudFRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKGUudHlwZSwgd3JhcHBlZCwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIGxpc3RlbmVyLmNhbGwodGhpcywgZSk7XG4gIH07XG4gIHJldHVybiB3cmFwcGVkO1xufTtcblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgUkVfVFJJTSA9IC8oXlxccyspfChcXHMrJCkvZztcbnZhciBSRV9TUExJVCA9IC9cXHMrLztcblxudmFyIHRyaW0gPSBTdHJpbmcucHJvdG90eXBlLnRyaW1cbiAgPyBmdW5jdGlvbihzdHIpIHsgcmV0dXJuIHN0ci50cmltKCk7IH1cbiAgOiBmdW5jdGlvbihzdHIpIHsgcmV0dXJuIHN0ci5yZXBsYWNlKFJFX1RSSU0sICcnKTsgfTtcblxudmFyIHF1ZXJ5QnlJZCA9IGZ1bmN0aW9uKGlkKSB7XG4gIHJldHVybiB0aGlzLnF1ZXJ5U2VsZWN0b3IoJ1tpZD1cIicgKyBpZC5yZXBsYWNlKC9cIi9nLCAnXFxcXFwiJykgKyAnXCJdJyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHJlc29sdmVJZHMoaWRzLCBkb2MpIHtcbiAgaWYgKHR5cGVvZiBpZHMgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RlZCBhIHN0cmluZyBidXQgZ290ICcgKyAodHlwZW9mIGlkcykpO1xuICB9XG5cbiAgaWYgKCFkb2MpIHtcbiAgICBkb2MgPSB3aW5kb3cuZG9jdW1lbnQ7XG4gIH1cblxuICB2YXIgZ2V0RWxlbWVudEJ5SWQgPSBkb2MuZ2V0RWxlbWVudEJ5SWRcbiAgICA/IGRvYy5nZXRFbGVtZW50QnlJZC5iaW5kKGRvYylcbiAgICA6IHF1ZXJ5QnlJZC5iaW5kKGRvYyk7XG5cbiAgaWRzID0gdHJpbShpZHMpLnNwbGl0KFJFX1NQTElUKTtcblxuICAvLyBYWFggd2UgY2FuIHNob3J0LWNpcmN1aXQgaGVyZSBiZWNhdXNlIHRyaW1taW5nIGFuZCBzcGxpdHRpbmcgYVxuICAvLyBzdHJpbmcgb2YganVzdCB3aGl0ZXNwYWNlIHByb2R1Y2VzIGFuIGFycmF5IGNvbnRhaW5pbmcgYSBzaW5nbGUsXG4gIC8vIGVtcHR5IHN0cmluZ1xuICBpZiAoaWRzLmxlbmd0aCA9PT0gMSAmJiBpZHNbMF0gPT09ICcnKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgcmV0dXJuIGlkc1xuICAgIC5tYXAoZnVuY3Rpb24oaWQpIHtcbiAgICAgIHZhciBlbCA9IGdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgIGlmICghZWwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdubyBlbGVtZW50IHdpdGggaWQ6IFwiJyArIGlkICsgJ1wiJyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZWw7XG4gICAgfSk7XG59O1xuIiwiY29uc3Qga2V5bWFwID0gcmVxdWlyZSgncmVjZXB0b3Iva2V5bWFwJyk7XG5jb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoJy4uLy4uL25vZGVfbW9kdWxlcy9AdXN3ZHMvdXN3ZHMvcGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvYmVoYXZpb3InKTtcbmNvbnN0IHNlbGVjdCA9IHJlcXVpcmUoJy4uLy4uL25vZGVfbW9kdWxlcy9AdXN3ZHMvdXN3ZHMvcGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2VsZWN0Jyk7XG5jb25zdCB0b2dnbGUgPSByZXF1aXJlKCcuLi8uLi9ub2RlX21vZHVsZXMvQHVzd2RzL3Vzd2RzL3BhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3V0aWxzL3RvZ2dsZScpO1xuY29uc3QgRm9jdXNUcmFwID0gcmVxdWlyZSgnLi4vLi4vbm9kZV9tb2R1bGVzL0B1c3dkcy91c3dkcy9wYWNrYWdlcy91c3dkcy1jb3JlL3NyYy9qcy91dGlscy9mb2N1cy10cmFwJyk7XG5jb25zdCBhY2NvcmRpb24gPSByZXF1aXJlKCcuLi8uLi9ub2RlX21vZHVsZXMvQHVzd2RzL3Vzd2RzL3BhY2thZ2VzL3VzYS1hY2NvcmRpb24vc3JjJyk7XG5jb25zdCBTY3JvbGxCYXJXaWR0aCA9IHJlcXVpcmUoJy4uLy4uL25vZGVfbW9kdWxlcy9AdXN3ZHMvdXN3ZHMvcGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvdXRpbHMvc2Nyb2xsYmFyLXdpZHRoJyk7XG5cbmNvbnN0IHsgQ0xJQ0sgfSA9IHJlcXVpcmUoJy4uLy4uL25vZGVfbW9kdWxlcy9AdXN3ZHMvdXN3ZHMvcGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvZXZlbnRzJyk7XG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKCcuLi8uLi9ub2RlX21vZHVsZXMvQHVzd2RzL3Vzd2RzL3BhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL2NvbmZpZycpO1xuXG5jb25zdCBCT0RZID0gJ2JvZHknO1xuY29uc3QgSEVBREVSID0gYC4ke1BSRUZJWH0taGVhZGVyYDtcbmNvbnN0IE5BViA9IGAuJHtQUkVGSVh9LW5hdmA7XG5jb25zdCBOQVZfQ09OVEFJTkVSID0gYC4ke1BSRUZJWH0tbmF2LWNvbnRhaW5lcmA7XG5jb25zdCBOQVZfUFJJTUFSWSA9IGAuJHtQUkVGSVh9LW5hdl9fcHJpbWFyeWA7XG5jb25zdCBOQVZfUFJJTUFSWV9JVEVNID0gYC4ke1BSRUZJWH0tbmF2X19wcmltYXJ5LWl0ZW1gO1xuY29uc3QgTkFWX0NPTlRST0wgPSBgYnV0dG9uLiR7UFJFRklYfS1uYXZfX2xpbmtgO1xuY29uc3QgTkFWX0xJTktTID0gYCR7TkFWfSBhYDtcbmNvbnN0IE5PTl9OQVZfSElEREVOX0FUVFJJQlVURSA9IGBkYXRhLW5hdi1oaWRkZW5gO1xuY29uc3QgT1BFTkVSUyA9IGAuJHtQUkVGSVh9LW1lbnUtYnRuYDtcbmNvbnN0IENMT1NFX0JVVFRPTiA9IGAuJHtQUkVGSVh9LW5hdl9fY2xvc2VgO1xuY29uc3QgT1ZFUkxBWSA9IGAuJHtQUkVGSVh9LW92ZXJsYXlgO1xuY29uc3QgQ0xPU0VSUyA9IGAke0NMT1NFX0JVVFRPTn0sIC4ke1BSRUZJWH0tb3ZlcmxheWA7XG5jb25zdCBUT0dHTEVTID0gW05BViwgT1ZFUkxBWV0uam9pbignLCAnKTtcbmNvbnN0IE5PTl9OQVZfRUxFTUVOVFMgPSBgYm9keSAqOm5vdCgke0hFQURFUn0sICR7TkFWX0NPTlRBSU5FUn0sICR7TkFWfSwgJHtOQVZ9ICopOm5vdChbYXJpYS1oaWRkZW5dKWA7XG5jb25zdCBOT05fTkFWX0hJRERFTiA9IGBbJHtOT05fTkFWX0hJRERFTl9BVFRSSUJVVEV9XWA7XG5cbmNvbnN0IEFDVElWRV9DTEFTUyA9ICd1c2EtanMtbW9iaWxlLW5hdi0tYWN0aXZlJztcbmNvbnN0IFZJU0lCTEVfQ0xBU1MgPSAnaXMtdmlzaWJsZSc7XG5cbmxldCBuYXZpZ2F0aW9uO1xubGV0IG5hdkFjdGl2ZTtcbmxldCBub25OYXZFbGVtZW50cztcblxuY29uc3QgaXNBY3RpdmUgPSAoKSA9PiBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5jb250YWlucyhBQ1RJVkVfQ0xBU1MpO1xuY29uc3QgU0NST0xMQkFSX1dJRFRIID0gU2Nyb2xsQmFyV2lkdGgoKTtcbmNvbnN0IElOSVRJQUxfUEFERElORyA9IHdpbmRvd1xuICAuZ2V0Q29tcHV0ZWRTdHlsZShkb2N1bWVudC5ib2R5KVxuICAuZ2V0UHJvcGVydHlWYWx1ZSgncGFkZGluZy1yaWdodCcpO1xuY29uc3QgVEVNUE9SQVJZX1BBRERJTkcgPSBgJHtcbiAgcGFyc2VJbnQoSU5JVElBTF9QQURESU5HLnJlcGxhY2UoL3B4LywgJycpLCAxMCkgK1xuICBwYXJzZUludChTQ1JPTExCQVJfV0lEVEgucmVwbGFjZSgvcHgvLCAnJyksIDEwKVxufXB4YDtcblxuY29uc3QgaGlkZU5vbk5hdkl0ZW1zID0gKCkgPT4ge1xuICBjb25zdCBoZWFkZXJQYXJlbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAke0hFQURFUn1gKS5wYXJlbnROb2RlO1xuICBub25OYXZFbGVtZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoTk9OX05BVl9FTEVNRU5UUyk7XG5cbiAgbm9uTmF2RWxlbWVudHMuZm9yRWFjaCgobm9uTmF2RWxlbWVudCkgPT4ge1xuICAgIGlmKG5vbk5hdkVsZW1lbnQgIT09IGhlYWRlclBhcmVudCkge1xuICAgICAgbm9uTmF2RWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgdHJ1ZSk7XG4gICAgICBub25OYXZFbGVtZW50LnNldEF0dHJpYnV0ZShOT05fTkFWX0hJRERFTl9BVFRSSUJVVEUsICcnKTtcbiAgICB9XG4gIH0pO1xufTtcblxuY29uc3Qgc2hvd05vbk5hdkl0ZW1zID0gKCkgPT4ge1xuICBub25OYXZFbGVtZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoTk9OX05BVl9ISURERU4pO1xuXG4gIGlmICghbm9uTmF2RWxlbWVudHMpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBSZW1vdmUgYXJpYS1oaWRkZW4gZnJvbSBub24taGVhZGVyIGVsZW1lbnRzXG4gIG5vbk5hdkVsZW1lbnRzLmZvckVhY2goKG5vbk5hdkVsZW1lbnQpID0+IHtcbiAgICBub25OYXZFbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nKTtcbiAgICBub25OYXZFbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShOT05fTkFWX0hJRERFTl9BVFRSSUJVVEUpO1xuICB9KTtcbn07XG5cbi8vIFRvZ2dsZSBhbGwgbm9uLWhlYWRlciBlbGVtZW50cyAjMzUyNy5cbmNvbnN0IHRvZ2dsZU5vbk5hdkl0ZW1zID0gKGFjdGl2ZSkgPT4ge1xuICBpZiAoYWN0aXZlKSB7XG4gICAgaGlkZU5vbk5hdkl0ZW1zKCk7XG4gIH0gZWxzZSB7XG4gICAgc2hvd05vbk5hdkl0ZW1zKCk7XG4gIH1cbn07XG5cbmNvbnN0IHRvZ2dsZU5hdiA9IChhY3RpdmUpID0+IHtcbiAgY29uc3QgeyBib2R5IH0gPSBkb2N1bWVudDtcbiAgY29uc3Qgc2FmZUFjdGl2ZSA9IHR5cGVvZiBhY3RpdmUgPT09ICdib29sZWFuJyA/IGFjdGl2ZSA6ICFpc0FjdGl2ZSgpO1xuXG4gIGJvZHkuY2xhc3NMaXN0LnRvZ2dsZShBQ1RJVkVfQ0xBU1MsIHNhZmVBY3RpdmUpO1xuXG4gIHNlbGVjdChUT0dHTEVTKS5mb3JFYWNoKChlbCkgPT5cbiAgICBlbC5jbGFzc0xpc3QudG9nZ2xlKFZJU0lCTEVfQ0xBU1MsIHNhZmVBY3RpdmUpXG4gICk7XG5cbiAgbmF2aWdhdGlvbi5mb2N1c1RyYXAudXBkYXRlKHNhZmVBY3RpdmUpO1xuXG4gIGNvbnN0IGNsb3NlQnV0dG9uID0gYm9keS5xdWVyeVNlbGVjdG9yKENMT1NFX0JVVFRPTik7XG4gIGNvbnN0IG1lbnVCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKE9QRU5FUlMpO1xuXG4gIGJvZHkuc3R5bGUucGFkZGluZ1JpZ2h0ID1cbiAgICBib2R5LnN0eWxlLnBhZGRpbmdSaWdodCA9PT0gVEVNUE9SQVJZX1BBRERJTkdcbiAgICAgID8gSU5JVElBTF9QQURESU5HXG4gICAgICA6IFRFTVBPUkFSWV9QQURESU5HO1xuXG4gIHRvZ2dsZU5vbk5hdkl0ZW1zKHNhZmVBY3RpdmUpO1xuXG4gIGlmIChzYWZlQWN0aXZlICYmIGNsb3NlQnV0dG9uKSB7XG4gICAgLy8gVGhlIG1vYmlsZSBuYXYgd2FzIGp1c3QgYWN0aXZhdGVkLiBGb2N1cyBvbiB0aGUgY2xvc2UgYnV0dG9uLCB3aGljaCBpc1xuICAgIC8vIGp1c3QgYmVmb3JlIGFsbCB0aGUgbmF2IGVsZW1lbnRzIGluIHRoZSB0YWIgb3JkZXIuXG4gICAgY2xvc2VCdXR0b24uZm9jdXMoKTtcbiAgfSBlbHNlIGlmIChcbiAgICAhc2FmZUFjdGl2ZSAmJlxuICAgIG1lbnVCdXR0b24gJiZcbiAgICBnZXRDb21wdXRlZFN0eWxlKG1lbnVCdXR0b24pLmRpc3BsYXkgIT09ICdub25lJ1xuXG4gICkge1xuICAgIC8vIFRoZSBtb2JpbGUgbmF2IHdhcyBqdXN0IGRlYWN0aXZhdGVkLiBXZSBkb24ndCB3YW50IHRoZSBmb2N1cyB0b1xuICAgIC8vIGRpc2FwcGVhciBpbnRvIHRoZSB2b2lkLCBzbyBmb2N1cyBvbiB0aGUgbWVudSBidXR0b24gaWYgaXQnc1xuICAgIC8vIHZpc2libGUgKHRoaXMgbWF5IGhhdmUgYmVlbiB3aGF0IHRoZSB1c2VyIHdhcyBqdXN0IGZvY3VzZWQgb24sXG4gICAgLy8gaWYgdGhleSB0cmlnZ2VyZWQgdGhlIG1vYmlsZSBuYXYgYnkgbWlzdGFrZSkuXG4gICAgbWVudUJ1dHRvbi5mb2N1cygpO1xuICB9XG5cbiAgcmV0dXJuIHNhZmVBY3RpdmU7XG59O1xuXG5jb25zdCByZXNpemUgPSAoKSA9PiB7XG4gIGNvbnN0IGNsb3NlciA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvcihDTE9TRV9CVVRUT04pO1xuXG4gIGlmIChpc0FjdGl2ZSgpICYmIGNsb3NlciAmJiBjbG9zZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkud2lkdGggPT09IDApIHtcbiAgICAvLyBXaGVuIHRoZSBtb2JpbGUgbmF2IGlzIGFjdGl2ZSwgYW5kIHRoZSBjbG9zZSBib3ggaXNuJ3QgdmlzaWJsZSxcbiAgICAvLyB3ZSBrbm93IHRoZSB1c2VyJ3Mgdmlld3BvcnQgaGFzIGJlZW4gcmVzaXplZCB0byBiZSBsYXJnZXIuXG4gICAgLy8gTGV0J3MgbWFrZSB0aGUgcGFnZSBzdGF0ZSBjb25zaXN0ZW50IGJ5IGRlYWN0aXZhdGluZyB0aGUgbW9iaWxlIG5hdi5cbiAgICBuYXZpZ2F0aW9uLnRvZ2dsZU5hdi5jYWxsKGNsb3NlciwgZmFsc2UpO1xuICB9XG59O1xuXG5jb25zdCBvbk1lbnVDbG9zZSA9ICgpID0+IG5hdmlnYXRpb24udG9nZ2xlTmF2LmNhbGwobmF2aWdhdGlvbiwgZmFsc2UpO1xuXG5jb25zdCBoaWRlQWN0aXZlTmF2RHJvcGRvd24gPSAoKSA9PiB7XG4gIGlmICghbmF2QWN0aXZlKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdG9nZ2xlKG5hdkFjdGl2ZSwgZmFsc2UpO1xuICBuYXZBY3RpdmUgPSBudWxsO1xufTtcblxuY29uc3QgZm9jdXNOYXZCdXR0b24gPSAoZXZlbnQpID0+IHtcbiAgY29uc3QgcGFyZW50TmF2SXRlbSA9IGV2ZW50LnRhcmdldC5jbG9zZXN0KE5BVl9QUklNQVJZX0lURU0pO1xuXG4gIC8vIE9ubHkgc2hpZnQgZm9jdXMgaWYgd2l0aGluIGRyb3Bkb3duXG4gIGlmICghZXZlbnQudGFyZ2V0Lm1hdGNoZXMoTkFWX0NPTlRST0wpKSB7XG4gICAgY29uc3QgbmF2Q29udHJvbCA9IHBhcmVudE5hdkl0ZW0ucXVlcnlTZWxlY3RvcihOQVZfQ09OVFJPTClcbiAgICBpZiAobmF2Q29udHJvbCkge1xuICAgICAgbmF2Q29udHJvbC5mb2N1cygpXG4gICAgfVxuICB9XG59O1xuXG5jb25zdCBoYW5kbGVFc2NhcGUgPSAoZXZlbnQpID0+IHtcbiAgaGlkZUFjdGl2ZU5hdkRyb3Bkb3duKCk7XG4gIGZvY3VzTmF2QnV0dG9uKGV2ZW50KTtcbn07XG5cbmNvbnN0IGhhbmRsZVRvZ2dsZSA9IHtcbiAgW05BVl9DT05UUk9MXSgpIHtcbiAgICAvLyBJZiBhbm90aGVyIG5hdiBpcyBvcGVuLCBjbG9zZSBpdFxuICAgIGlmIChuYXZBY3RpdmUgIT09IHRoaXMpIHtcbiAgICAgIGhpZGVBY3RpdmVOYXZEcm9wZG93bigpO1xuICAgIH1cbiAgICAvLyBzdG9yZSBhIHJlZmVyZW5jZSB0byB0aGUgbGFzdCBjbGlja2VkIG5hdiBsaW5rIGVsZW1lbnQsIHNvIHdlXG4gICAgLy8gY2FuIGhpZGUgdGhlIGRyb3Bkb3duIGlmIGFub3RoZXIgZWxlbWVudCBvbiB0aGUgcGFnZSBpcyBjbGlja2VkXG4gICAgaWYgKCFuYXZBY3RpdmUpIHtcbiAgICAgIG5hdkFjdGl2ZSA9IHRoaXM7XG4gICAgICB0b2dnbGUobmF2QWN0aXZlLCB0cnVlKTtcbiAgICB9XG5cbiAgICAvLyBEbyB0aGlzIHNvIHRoZSBldmVudCBoYW5kbGVyIG9uIHRoZSBib2R5IGRvZXNuJ3QgZmlyZVxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcblxuICBbQk9EWV06IGhpZGVBY3RpdmVOYXZEcm9wZG93bixcbiAgW09QRU5FUlNdOiB0b2dnbGVOYXYsXG4gIFtDTE9TRVJTXTogdG9nZ2xlTmF2LFxuICBbTkFWX0xJTktTXSgpIHtcbiAgICAvLyBBIG5hdmlnYXRpb24gbGluayBoYXMgYmVlbiBjbGlja2VkISBXZSB3YW50IHRvIGNvbGxhcHNlIGFueVxuICAgIC8vIGhpZXJhcmNoaWNhbCBuYXZpZ2F0aW9uIFVJIGl0J3MgYSBwYXJ0IG9mLCBzbyB0aGF0IHRoZSB1c2VyXG4gICAgLy8gY2FuIGZvY3VzIG9uIHdoYXRldmVyIHRoZXkndmUganVzdCBzZWxlY3RlZC5cblxuICAgIC8vIFNvbWUgbmF2aWdhdGlvbiBsaW5rcyBhcmUgaW5zaWRlIGFjY29yZGlvbnM7IHdoZW4gdGhleSdyZVxuICAgIC8vIGNsaWNrZWQsIHdlIHdhbnQgdG8gY29sbGFwc2UgdGhvc2UgYWNjb3JkaW9ucy5cbiAgICBjb25zdCBhY2MgPSB0aGlzLmNsb3Nlc3QoYWNjb3JkaW9uLkFDQ09SRElPTik7XG5cbiAgICBpZiAoYWNjKSB7XG4gICAgICBhY2NvcmRpb24uZ2V0QnV0dG9ucyhhY2MpLmZvckVhY2goKGJ0bikgPT4gYWNjb3JkaW9uLmhpZGUoYnRuKSk7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIG1vYmlsZSBuYXZpZ2F0aW9uIG1lbnUgaXMgYWN0aXZlLCB3ZSB3YW50IHRvIGhpZGUgaXQuXG4gICAgaWYgKGlzQWN0aXZlKCkpIHtcbiAgICAgIG5hdmlnYXRpb24udG9nZ2xlTmF2LmNhbGwobmF2aWdhdGlvbiwgZmFsc2UpO1xuICAgIH1cbiAgfSxcbn07XG5cbm5hdmlnYXRpb24gPSBiZWhhdmlvcihcbiAge1xuICAgIFtDTElDS106IHtcbiAgICAgIFtOQVZfQ09OVFJPTF0oKSB7XG4gICAgICAgIC8vIElmIGFub3RoZXIgbmF2IGlzIG9wZW4sIGNsb3NlIGl0XG4gICAgICAgIGlmIChuYXZBY3RpdmUgIT09IHRoaXMpIHtcbiAgICAgICAgICBoaWRlQWN0aXZlTmF2RHJvcGRvd24oKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBzdG9yZSBhIHJlZmVyZW5jZSB0byB0aGUgbGFzdCBjbGlja2VkIG5hdiBsaW5rIGVsZW1lbnQsIHNvIHdlXG4gICAgICAgIC8vIGNhbiBoaWRlIHRoZSBkcm9wZG93biBpZiBhbm90aGVyIGVsZW1lbnQgb24gdGhlIHBhZ2UgaXMgY2xpY2tlZFxuICAgICAgICBpZiAoIW5hdkFjdGl2ZSkge1xuICAgICAgICAgIG5hdkFjdGl2ZSA9IHRoaXM7XG4gICAgICAgICAgdG9nZ2xlKG5hdkFjdGl2ZSwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEbyB0aGlzIHNvIHRoZSBldmVudCBoYW5kbGVyIG9uIHRoZSBib2R5IGRvZXNuJ3QgZmlyZVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9LFxuXG4gICAgICBbQk9EWV06IGhpZGVBY3RpdmVOYXZEcm9wZG93bixcbiAgICAgIFtPUEVORVJTXTogdG9nZ2xlTmF2LFxuICAgICAgW0NMT1NFUlNdOiB0b2dnbGVOYXYsXG4gICAgICBbTkFWX0xJTktTXSgpIHtcbiAgICAgICAgLy8gQSBuYXZpZ2F0aW9uIGxpbmsgaGFzIGJlZW4gY2xpY2tlZCEgV2Ugd2FudCB0byBjb2xsYXBzZSBhbnlcbiAgICAgICAgLy8gaGllcmFyY2hpY2FsIG5hdmlnYXRpb24gVUkgaXQncyBhIHBhcnQgb2YsIHNvIHRoYXQgdGhlIHVzZXJcbiAgICAgICAgLy8gY2FuIGZvY3VzIG9uIHdoYXRldmVyIHRoZXkndmUganVzdCBzZWxlY3RlZC5cblxuICAgICAgICAvLyBTb21lIG5hdmlnYXRpb24gbGlua3MgYXJlIGluc2lkZSBhY2NvcmRpb25zOyB3aGVuIHRoZXkncmVcbiAgICAgICAgLy8gY2xpY2tlZCwgd2Ugd2FudCB0byBjb2xsYXBzZSB0aG9zZSBhY2NvcmRpb25zLlxuICAgICAgICBjb25zdCBhY2MgPSB0aGlzLmNsb3Nlc3QoYWNjb3JkaW9uLkFDQ09SRElPTik7XG5cbiAgICAgICAgaWYgKGFjYykge1xuICAgICAgICAgIGFjY29yZGlvbi5nZXRCdXR0b25zKGFjYykuZm9yRWFjaCgoYnRuKSA9PiBhY2NvcmRpb24uaGlkZShidG4pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHRoZSBtb2JpbGUgbmF2aWdhdGlvbiBtZW51IGlzIGFjdGl2ZSwgd2Ugd2FudCB0byBoaWRlIGl0LlxuICAgICAgICBpZiAoaXNBY3RpdmUoKSkge1xuICAgICAgICAgIG5hdmlnYXRpb24udG9nZ2xlTmF2LmNhbGwobmF2aWdhdGlvbiwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0sXG5cbiAgICBtb3VzZW92ZXI6IHtcbiAgICAgIFtOQVZfUFJJTUFSWV9JVEVNXSgpIHtcbiAgICAgICAgY29uc3QgYnV0dG9uID0gdGhpcy5xdWVyeVNlbGVjdG9yKE5BVl9DT05UUk9MKTtcblxuICAgICAgICBpZihidXR0b24pIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLmNsb3Nlc3QoJy51c2EtbmF2X19zdWJtZW51LWl0ZW0nKSlcbiAgICAgICAgICBpZih0aGlzLmNsb3Nlc3QoJy51c2EtbmF2X19zdWJtZW51LWl0ZW0nKSkge1xuICAgICAgICAgICAgY29uc3QgY29udGVudHMgPSAoXG4gICAgICAgICAgICAgIGJ1dHRvbi5nZXRBdHRyaWJ1dGUoJ2FyaWEtY29udHJvbHMnKSAmJlxuICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChidXR0b24uZ2V0QXR0cmlidXRlKCdhcmlhLWNvbnRyb2xzJykpXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBpZihjb250ZW50cykge1xuICAgICAgICAgICAgICBjb250ZW50cy5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdG9nZ2xlKGJ1dHRvbiwgdHJ1ZSk7XG5cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuXG4gICAgbW91c2VvdXQ6IHtcbiAgICAgIFtOQVZfUFJJTUFSWV9JVEVNXShldmVudCkge1xuICAgICAgICBpZighdGhpcy5jb250YWlucyhldmVudC5yZWxhdGVkVGFyZ2V0KSkge1xuICAgICAgICAgIGNvbnN0IGJ1dHRvbiA9IHRoaXMucXVlcnlTZWxlY3RvcihOQVZfQ09OVFJPTCk7XG5cbiAgICAgICAgICBpZihidXR0b24pIHtcbiAgICAgICAgICAgIGlmKHRoaXMuY2xvc2VzdCgnLnVzYS1uYXZfX3N1Ym1lbnUtaXRlbScpKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnRzID0gKFxuICAgICAgICAgICAgICAgIGJ1dHRvbi5nZXRBdHRyaWJ1dGUoJ2FyaWEtY29udHJvbHMnKSAmJlxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGJ1dHRvbi5nZXRBdHRyaWJ1dGUoJ2FyaWEtY29udHJvbHMnKSlcbiAgICAgICAgICAgICAgKTtcbiAgICBcbiAgICAgICAgICAgICAgaWYoY29udGVudHMpIHtcbiAgICAgICAgICAgICAgICBjb250ZW50cy5zdHlsZS5wb3NpdGlvbiA9IG51bGw7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdG9nZ2xlKGJ1dHRvbiwgZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuXG4gICAga2V5ZG93bjoge1xuICAgICAgW05BVl9QUklNQVJZXToga2V5bWFwKHsgRXNjYXBlOiBoYW5kbGVFc2NhcGUgfSksXG4gICAgfSxcbiAgICBmb2N1c291dDoge1xuICAgICAgW05BVl9QUklNQVJZXShldmVudCkge1xuICAgICAgICBjb25zdCBuYXYgPSBldmVudC50YXJnZXQuY2xvc2VzdChOQVZfUFJJTUFSWSk7XG5cbiAgICAgICAgaWYgKCFuYXYuY29udGFpbnMoZXZlbnQucmVsYXRlZFRhcmdldCkpIHtcbiAgICAgICAgICBoaWRlQWN0aXZlTmF2RHJvcGRvd24oKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICB7XG4gICAgaW5pdChyb290KSB7XG4gICAgICBjb25zdCB0cmFwQ29udGFpbmVyID0gcm9vdC5tYXRjaGVzKE5BVikgPyByb290IDogcm9vdC5xdWVyeVNlbGVjdG9yKE5BVik7XG5cbiAgICAgIGlmICh0cmFwQ29udGFpbmVyKSB7XG4gICAgICAgIG5hdmlnYXRpb24uZm9jdXNUcmFwID0gRm9jdXNUcmFwKHRyYXBDb250YWluZXIsIHtcbiAgICAgICAgICBFc2NhcGU6IG9uTWVudUNsb3NlLFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmVzaXplKCk7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgcmVzaXplLCBmYWxzZSk7XG4gICAgfSxcbiAgICB0ZWFyZG93bigpIHtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCByZXNpemUsIGZhbHNlKTtcbiAgICAgIG5hdkFjdGl2ZSA9IGZhbHNlO1xuICAgIH0sXG4gICAgZm9jdXNUcmFwOiBudWxsLFxuICAgIHRvZ2dsZU5hdixcbiAgfVxuKTtcblxubW9kdWxlLmV4cG9ydHMgPSBuYXZpZ2F0aW9uOyIsIndpbmRvdy51c3dkc1ByZXNlbnQgPSB0cnVlOyAvLyBHTE9CQUwgdmFyaWFibGUgdG8gaW5kaWNhdGUgdGhhdCB0aGUgdXN3ZHMuanMgaGFzIGxvYWRlZCBpbiB0aGUgRE9NLlxuXG4vKipcbiAqIFRoZSAncG9seWZpbGxzJyBkZWZpbmUga2V5IEVDTUFTY3JpcHQgNSBtZXRob2RzIHRoYXQgbWF5IGJlIG1pc3NpbmcgZnJvbVxuICogb2xkZXIgYnJvd3NlcnMsIHNvIG11c3QgYmUgbG9hZGVkIGZpcnN0LlxuICovXG5yZXF1aXJlKCcuLi8uLi9ub2RlX21vZHVsZXMvQHVzd2RzL3Vzd2RzL3BhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzL3BvbHlmaWxscycpO1xuXG5jb25zdCB1c3dkcyA9IHJlcXVpcmUoJy4uLy4uL25vZGVfbW9kdWxlcy9AdXN3ZHMvdXN3ZHMvcGFja2FnZXMvdXN3ZHMtY29yZS9zcmMvanMvY29uZmlnJyk7XG5cbmNvbnN0IGNvbXBvbmVudHMgPSByZXF1aXJlKCcuLi8uLi9ub2RlX21vZHVsZXMvQHVzd2RzL3Vzd2RzL3BhY2thZ2VzL3Vzd2RzLWNvcmUvc3JjL2pzJyk7XG5jb25zdCBzdmc0ZXZlcnlib2R5ID0gcmVxdWlyZSgnLi4vLi4vbm9kZV9tb2R1bGVzL0B1c3dkcy91c3dkcy9wYWNrYWdlcy91c3dkcy1jb3JlL3NyYy9qcy9wb2x5ZmlsbHMvc3ZnNGV2ZXJ5Ym9keScpO1xuXG5jb25zdCBuYXZpZ2F0aW9uID0gcmVxdWlyZSgnLi91c2EtaGVhZGVyJyk7XG5cbmNvbXBvbmVudHMubmF2aWdhdGlvbiA9IG5hdmlnYXRpb247XG51c3dkcy5jb21wb25lbnRzID0gY29tcG9uZW50cztcblxuY29uc3QgaW5pdENvbXBvbmVudHMgPSAoKSA9PiB7XG4gIGNvbnN0IHRhcmdldCA9IGRvY3VtZW50LmJvZHk7XG4gIE9iamVjdC5rZXlzKGNvbXBvbmVudHMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgIGNvbnN0IGJlaGF2aW9yID0gY29tcG9uZW50c1trZXldO1xuICAgIGJlaGF2aW9yLm9uKHRhcmdldCk7XG4gIH0pO1xuICBzdmc0ZXZlcnlib2R5KCk7XG59O1xuXG5pZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gXCJsb2FkaW5nXCIpIHtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgaW5pdENvbXBvbmVudHMsIHsgb25jZTogdHJ1ZSB9KTtcbn0gZWxzZSB7XG4gIGluaXRDb21wb25lbnRzKCk7XG59XG5cbmV4cG9ydHMuZGVmYXVsdCA9IHVzd2RzO1xuZXhwb3J0cy5pbml0Q29tcG9uZW50cyA9IGluaXRDb21wb25lbnRzOyJdfQ==
