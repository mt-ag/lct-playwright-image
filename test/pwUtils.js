/* eslint-disable @typescript-eslint/no-var-requires */
/* global window */
const { expect } = require("@playwright/test");

const stepTimeMap = new Map();

function stepStart(stepId) {
  // eslint-disable-next-line no-console
  console.debug(`StepStart: #${stepId}`);
  stepTimeMap.set(stepId, Date.now());
}

function stepEnd(stepId) {
  const endTime = Date.now();
  const startTime = stepTimeMap.get(stepId);
  if (!startTime) {
    throw new Error(`No start time found for step ${stepId}`);
  }
  const duration = endTime - startTime;
  // eslint-disable-next-line no-console
  console.debug(`StepEnd: #${stepId} (${duration}ms)`);
}

async function getRandomSelectIndex({ context, selector }) {
  const options = context.locator(`${selector} option`);
  const optionLength = await options.count();

  return Math.floor(Math.random() * optionLength);
}

function getValueFromJson(json, path) {
  const pathElements = path.split(".");
  // current object always gets updated
  let curr = json;
  pathElements.forEach((accessor) => {
    // if reached undefined at some point
    if (!curr) {
      throw new Error(
        `Error in sendRestRequest: Cannot read property "${accessor}" of undefined`
      );
    }
    // get index of array access (e. g. emps[3] --> 3)
    // https://regex101.com/r/8A559y/1
    const regexRes = accessor.match(/[a-z0-9]\[(\d+)\]/i);
    const arrayIndex = regexRes && regexRes.length ? regexRes[1] : null;
    // if array access found (e. g. emps[3])
    // first get curr["emps"]
    // then get  curr[3]
    if (arrayIndex) {
      // object name before e. g. [3]
      const objPath = accessor.split("[")[0];
      curr = curr[objPath];
      if (!curr) {
        throw new Error(
          `Error in sendRestRequest: Cannot read property "${accessor}" on "${objPath}", because "${objPath}" is undefined`
        );
      }
      curr = curr[arrayIndex];
      // else get only next object / string / number
      // e.g. name =>  curr["name"]
    } else {
      curr = curr[accessor];
    }
  });
  return curr;
}

function waitMs(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const RIGHT = "r";
const LEFT = "l";

/**
 * Returns the button id to move all in a shuttle item
 *
 * @typedef {("l" | "r")} DirectionType
 *
 * @param {string} shuttleId
 * @param {DirectionType} direction
 * @returns {string}
 */
function getShuttleMoveAllButton(shuttleId, direction) {
  if (direction === RIGHT) {
    return `${shuttleId}_MOVE_ALL`;
  }

  if (direction === LEFT) {
    return `${shuttleId}_REMOVE_ALL`;
  }

  throw new Error(`Move Shuttle Helper: Unhandled direction: ${direction}`);
}

/**
 * Returns the select ids for a shuttle item
 *
 * @typedef {{ fromSelectId: string, toSelectId: string }} SelectIds
 *
 * @param {string} shuttleId
 * @param {DirectionType} direction
 * @returns {SelectIds}
 */
function getShuttleSelectIds(shuttleId, direction) {
  const leftSelect = `${shuttleId} table.shuttle td.shuttleSelect1 select`;
  const rightSelect = `${shuttleId} table.shuttle td.shuttleSelect2 select`;
  // move to right from left side
  if (direction === RIGHT) {
    return { fromSelectId: leftSelect, toSelectId: rightSelect };
  }

  // move to left from right side
  if (direction === LEFT) {
    return { fromSelectId: rightSelect, toSelectId: leftSelect };
  }

  throw new Error(`Move Shuttle Helper: Unhandled direction: ${direction}`);
}

/**
 * Interact with a shuttle element
 * @param {Object} options
 * @param {Page | FrameLocator} options.context
 * @param {Playwright.expect} options.expect
 * @param {string} options.shuttleId
 * @param {DirectionType} options.direction
 * @param {string[]} options.valueList
 * @param {boolean} options.moveAll
 */
async function moveShuttleValues({
  context,
  expect,
  shuttleId,
  direction,
  valueList,
  moveAll,
}) {
  const { fromSelectId /*, toSelectId */ } = getShuttleSelectIds(
    shuttleId,
    direction
  );

  if (moveAll) {
    await context
      .locator(`${getShuttleMoveAllButton(shuttleId, direction)}`)
      .click();
    return;
  }

  for (const value of valueList) {
    expect(
      await context.locator(`${fromSelectId} option`, { hasText: value })
    ).toBeVisible();
  }

  // move values by selecting them and pressing enter
  await context.locator(`${fromSelectId}`).selectOption(valueList);
  await context.locator(`${fromSelectId}`).press("Enter");

  /*
  Currently not working. This may be commented in in the future
  for (const value of valueList) {
    expect(
      await context.locator(`#${toSelectId} option`, { hasText: value })
    ).toBeVisible();
  }
  */
}

/**
 * Selects a value from the Popup LOV specified by its id.
 * Throws an error if the search string could not be found.
 *
 * @param {Object} options The parameters for this function.
 * @param {Page} options.page The Playwright Page object.
 * @param {number} options.pageId The ID of the page the Popup LOV element is placed on.
 * @param {Page | FrameLocator} options.context The context where the Popup LOV is located.
 * @param {string} options.popupLovId The ID for the element in Oracle APEX.
 * @param {string} options.searchString The displayed value to choose from the list.
 * @param {boolean} options.exactMatch If `true`, then the list item that fully equals `searchString` is selected, otherwise the first list item is selected.
 */
async function selectPopupLovValue({
  page,
  pageId,
  context,
  popupLovId,
  searchString,
  exactMatch,
}) {
  const dialogSelector = `//*[@id="PopupLov_${pageId}_${popupLovId}_dlg"]`;
  const noDataFoundSelector = `${dialogSelector}//*[contains(@class, "a-GV-noDataMsg")]`;

  // Single-column LOVs: first item
  const listItemSelector = `${dialogSelector}//*[@class="a-IconList-item"][1]`;
  // Multi-column LOVs: first row
  const tableRowSelector = `${dialogSelector}//*[@class="a-GV-bdy"]//*[contains(@class, "a-GV-cell")][1]`;

  // Bold highlighted substrings
  const searchResultSelector = `${dialogSelector}//*[@class="popup-lov-highlight"]/..`;

  // Button to open modal always on context (page or iframe)
  await context.locator(`#${popupLovId}_lov_btn`).click();

  // Wait for Popup LOV to complete initial load
  await page
    .locator(
      `(${noDataFoundSelector})|(${listItemSelector})|(${tableRowSelector})`
    )
    .last()
    .waitFor();

  // Popup always on page (not in iframe)
  const searchInputElement = page.locator(
    `#PopupLov_${pageId}_${popupLovId}_dlg .a-PopupLOV-search`
  );

  if ((await searchInputElement.inputValue()) === searchString) {
    throw new Error(
      `Value was already selected from this Popup LOV: "${searchString}"`
    );
  }

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/wwv_flow.ajax") && response.status() === 200
  );

  // Clear previous searchbar input
  await searchInputElement.clear();
  await searchInputElement.type(searchString);

  const searchButton = page.locator(
    `#PopupLov_${pageId}_${popupLovId}_dlg .a-PopupLOV-doSearch`
  );

  if ((await searchButton.count()) === 1) {
    // For default LOVs, start searching
    // For search-as-you-type LOVs, this has no effect
    await searchButton.click();
  }

  // Wait for search results of network request
  await responsePromise;
  await page
    .locator(`(${noDataFoundSelector})|(${searchResultSelector})`)
    .last()
    .waitFor();

  const noDataFoundElement = page.locator(noDataFoundSelector);

  if (await noDataFoundElement.isVisible()) {
    throw new Error(`Could not find any result for input: "${searchString}"`);
  }

  const resultElements = page.locator(searchResultSelector);

  if (exactMatch) {
    let found = false;

    for (const resultElement of await resultElements.all()) {
      const resultText = await resultElement.textContent();

      if (resultText === searchString) {
        found = true;
        await resultElement.click();
        break;
      }
    }

    if (!found) {
      throw new Error(
        `Could not find exact match for input: "${searchString}"`
      );
    }
  } else {
    await resultElements.first().click();
  }
}

async function interactiveTableFilter({
  context,
  interactiveTableId,
  isInteractiveGrid,
  searchString,
}) {
  const searchInput = await context.locator(
    isInteractiveGrid
      ? `#${interactiveTableId}_ig_toolbar_search_field`
      : `#${interactiveTableId}_search_field`
  );
  const searchButton = await context.locator(
    isInteractiveGrid
      ? `#${interactiveTableId}_ig_toolbar button[data-action="search"]`
      : `#${interactiveTableId}_search_button`
  );

  await expect(
    searchInput,
    `search input in Interactive ${
      isInteractiveGrid ? "Grid" : "Report"
    } with id: "${interactiveTableId}" is not visible`
  ).toBeVisible();
  await expect(
    searchButton,
    `search button in Interactive ${
      isInteractiveGrid ? "Grid" : "Report"
    } with id: "${interactiveTableId}" is not visible`
  ).toBeVisible();

  await searchInput.fill(searchString);
  await searchButton.click();

  const filterLabel = await context
    .locator(
      isInteractiveGrid
        ? `#${interactiveTableId}_ig_report_settings .a-IG-controls-cell--label span[id]`
        : `#${interactiveTableId}_control_panel .a-IRR-controls-cell--label span[id]`
    )
    .last();

  await expect(filterLabel).toContainText(searchString);
}

async function getCellLocator({
  context,
  interactiveTableId,
  isInteractiveGrid,
  columnId,
}) {
  if (isInteractiveGrid) {
    const tableHeaders = context
      .locator(`#${interactiveTableId}_ig_grid_vc .a-GV-hdr .a-GV-row`)
      .locator(".a-GV-header > span:first-child");

    const columnIndex = await tableHeaders.evaluateAll(
      (headers, { interactiveTableId, columnId }) => {
        for (let i = 0; i < headers.length; i++) {
          const header = headers[i];
          const headerId = header.getAttribute("id");

          const dataColumn = headerId === `${columnId}_HDR`;
          const rowSelectorColumn =
            columnId === "APEX$ROW_SELECTOR" &&
            headerId === `${interactiveTableId}_ig_grid_vc_shh`;
          const rowActionColumn =
            columnId === "APEX$ROW_ACTION" &&
            headerId === `${interactiveTableId}_ig_grid_vc_h_APEX$ROW_ACTION`;

          if (dataColumn || rowSelectorColumn || rowActionColumn) {
            return i;
          }
        }
        return -1;
      },
      { interactiveTableId, columnId }
    );

    if (columnIndex === -1) {
      throw new Error(`Could not find column with ID: "${columnId}"`);
    }

    return context
      .locator(`#${interactiveTableId}_ig_grid_vc .a-GV-bdy .a-GV-table`)
      .locator("tr.a-GV-row:first-child .a-GV-cell")
      .nth(columnIndex);
  } else {
    return context
      .locator(`#${interactiveTableId} .a-IRR-table`)
      .locator(`tr:nth-child(2) td[headers="${columnId}"]`);
  }
}

function interactiveTable({ context, interactiveTableId, isInteractiveGrid }) {
  return {
    filter: async ({ searchString }) => {
      await interactiveTableFilter({
        context,
        interactiveTableId,
        isInteractiveGrid,
        searchString,
      });
    },
    cellHasText: async ({ columnId, selector, expected }) => {
      const cell = await getCellLocator({
        context,
        interactiveTableId,
        isInteractiveGrid,
        columnId,
      });

      const target = selector ? cell.locator(selector) : cell;

      await expect(target).toHaveText(expected);
    },
    clickCell: async ({ columnId, selector, performDoubleClick }) => {
      const cell = await getCellLocator({
        context,
        interactiveTableId,
        isInteractiveGrid,
        columnId,
      });

      const target = selector ? cell.locator(selector) : cell;

      // More reliable with Popup LOVs in Interactive Grids
      await target.scrollIntoViewIfNeeded();

      if (performDoubleClick) {
        await target.dblclick();
      } else {
        await target.click();
      }
    },
    checkCell: async ({ columnId }) => {
      const cell = await getCellLocator({
        context,
        interactiveTableId,
        isInteractiveGrid: true,
        columnId,
      });

      /*
       * Needed to distinguish between interacting with a single checkbox
       * of an existing record (single click) or of a new record (created by "Add Row" for example).
       * The distinction is made by looking at the grids edit mode.
       * Currently, Single Checkboxes in newly added rows need two clicks/doubleClick: One to activate the field
       * and the second to check the box.
       * For some reason check can't be used here because it always points to an element intercepting
       * pointer events. This is why click is used here as it somehow does not have the same problem.
       */

      const singleCheckboxExistsAlready =
        (await cell.locator(".apex-item-single-checkbox").count()) > 0;

      const inEditMode = await context
        .locator("#" + interactiveTableId)
        .evaluateAll((ig) =>
          // eslint-disable-next-line no-undef
          apex.region(ig[0].id).call("getActions").get("edit")
        );

      await cell.scrollIntoViewIfNeeded();

      if (singleCheckboxExistsAlready) {
        await cell.locator(".apex-item-single-checkbox").click();
      } else if (inEditMode) {
        await cell.click();
        await cell.locator(".apex-item-single-checkbox").click();
      } else {
        await cell.dblclick();
        await cell.locator(".apex-item-single-checkbox").click();
      }
    },
  };
}

/**
 * Obtains the current APEX session id.
 * @param {Object} page The page context to execute the function to obtain the session id in.
 */
async function getSessionId(page) {
  const sessionId = await page.waitForFunction(() => {
    let obtainedSessionId;
    try {
      window.apex;
    } catch (e) {
      throw new Error(`No APEX Context available. Page still loading?`);
    }

    try {
      obtainedSessionId = window.apex.item("pInstance").getValue();
    } catch (e) {
      throw new Error(
        `No session id available yet. Set "Append Session ID" to "No" for this navigation step.`
      );
    }
    return obtainedSessionId;
  });
  return sessionId;
}

/**
 * Build an APEX Url with or without a session id.
 * Differentiates between friendly- and APEX Standard-Urls.
 * @param {string} path The url path to append the session id to, for example http://apex.myinstance.com/ords/f?p=100:12.
 * @param {Object} page The page context to execute the function to obtain the session id in.
 * @param {boolean} appendSession Indicates whether to append the session id.
 * @param {boolean} isFriendlyUrl Indicates whether to use friendly url session id syntax.
 */
async function generateUrl(path, page, appendSession, isFriendlyUrl) {
  let url = path;

  if (appendSession) {
    const sessionId = await getSessionId(page);
    url += isFriendlyUrl ? `?session=` : `:`;
    url += sessionId;
  }

  return url;
}

/**
 * Checks whether an given element has a given attribute.
 * Implemented because Playwright made the "value" attribute for toHaveAttribute mandatory.
 * @param {Page | FrameLocator} options.context The context where the Popup LOV is located.
 * @param {object} options.locatorObj The selector of to find the element by.
 * @param {string} options.attribute The attribute to check for.
 * @param {boolean} options.invert Whether to validate the presence or absence of the given attribute.
 */
async function elementHasAttribute({
  context,
  locatorObj,
  attribute,
  invert,
  useSoftAssertion,
}) {
  const element = await context.locator(locatorObj.selector, {
    hasText: locatorObj.hasText,
  });
  const hasAttribute = await element.evaluate(
    (node, attribute) => node.hasAttribute(attribute),
    attribute
  );

  const assertion = useSoftAssertion
    ? expect.soft(hasAttribute)
    : expect(hasAttribute);

  if (invert) {
    await assertion.toBeFalsy();
  } else {
    await assertion.toBeTruthy();
  }
}

/**
 * Interact with an APEX Switch Element.
 * @param {Object} page The page context to execute the function to obtain the session id in.
 * @param {selector} selector The selector pointing to the switch element.
 * @param {String} switchType The type of switch element.
 * @param {String} value The value to set the switch to.
 * @param {Number} timeout The timeout for the step.
 */
async function setSwitchElement(
  context,
  { switchType, selector, value, timeout }
) {
  switch (switchType) {
    case "standardSwitch":
      await context
        .locator(`#${selector} ~ .a-Switch-toggle`)
        .click({ timeout: timeout });
      break;
    case "pillButton":
      await context
        .locator(`//*[@id="${selector}"]//span//label[text()="${value}"]`)
        .click({ timeout: timeout });
      break;
    case "selectList":
      await context
        .locator(`#${selector}`)
        .selectOption(value, { timeout: timeout });
      break;

    case "unknown":
      throw new Error(`Unknown Switch Type!`);
  }
}

/**
 * Returns a object for interacting with a Date Picker.
 *
 * @param {Page|FrameLocator} context The context to perform on.
 *     Must be a `Page` or `FrameLocator` object.
 * @param {string} name The Page Item name of the Date Picker set in APEX.
 * @param {string} assertTypeCode The internal Date Picker type code to assert.
 *     An error will be thrown if this Date Picker has another type.
 *     Set to `DYNAMIC` to auto-detect type.
 * @returns an object containing functions to interact with this Date Picker
 */
function datePicker(context, name, assertTypeCode) {
  const setup = async function () {
    // ":root" + evaluateAll needed to evaluate apex.item within FrameLocator contexts
    // For Page contexts, we stay within page
    const { nodeName, _datePickerType } = await context
      .locator(':root')
      .evaluateAll((_elements, name) => {
        const item = window.apex.item(name);

        if (!item || !item.node) {
          throw new Error(`No Page Item found with name "${name}"`);
        }

        return {
          nodeName: item.node.nodeName,
          _datePickerType: item._datePickerType,
        };
      }, name);

    let actualTypeCode;
    let selector;
    let cleanup;

    switch (nodeName) {
      case 'A-DATE-PICKER':
        // APEX
        actualTypeCode = 'NATIVE_DATE_PICKER_APEX';
        selector = `#${name}_input`;
        cleanup = async function (locator) {
          await locator.click();
        };
        break;
      case 'OJ-DATE-PICKER':
        // JET (Non-Native)
        actualTypeCode = 'NATIVE_DATE_PICKER_JET';
        selector = `input[id="${name}|input"]`;
        cleanup = async function () {
          const picker = context.locator(
            '.oj-popup-layer .oj-datepicker-popup'
          );

          if (await picker.isVisible()) {
            const button = context.locator(
              `#${name} .oj-inputdatetime-input-trigger > .oj-component-icon`
            );
            await button.click();
          }
        };
        break;
      case 'INPUT':
        if (_datePickerType === 'native') {
          // JET (Native)
          actualTypeCode = 'NATIVE_DATE_PICKER_JET';
          selector = `input#${name}`;
          // no cleanup needed
        } else {
          // jQuery
          actualTypeCode = 'NATIVE_DATE_PICKER';
          selector = `#${name}`;
          cleanup = async function () {
            const picker = context.locator('#ui-datepicker-div');

            if (await picker.isVisible()) {
              const button = context.locator(`${selector} + button`);

              if (await button.isVisible()) {
                await button.click();
              } else {
                // Fallback to JS if button is hidden
                await picker.evaluate((node) => {
                  node.style.display = 'none';
                });
              }
            }
          };
        }
        break;
      default:
        throw new Error('Date Picker type could not be detected');
    }

    if (assertTypeCode !== 'DYNAMIC') {
      expect(actualTypeCode).toBe(assertTypeCode);
    }

    return { selector, cleanup };
  };

  return {
    setValue: async function (value, timeout) {
      const { selector, cleanup } = await setup();

      const options = {};

      if (typeof timeout === 'number') {
        options.timeout = timeout;
      }

      const locator = context.locator(selector);
      await locator.fill(value, options);

      if (typeof cleanup === 'function') {
        await cleanup(locator);
      }
    },
  };
}

/**
 * Helper function for checkForErrors. Obtains error messages on the given page.
 *
 * @param {Page} page The Playwright Page object.
 * @param {Page | FrameLocator} context The current context. Either type Page or FrameLocator.
 * @param {number} delay The static amount of time to wait before starting to get errors.
 */
async function getErrors(page, context, delay) {
  let errorData = { errors: [], sumErrors: 0 };
  const formItemError = {
    displayName: "Inline Item Error",
    selector: `span[class="a-Form-error u-visible"] .t-Form-error`,
    locator: {},
  };
  const jsAlertError = {
    displayName: "Client-Side Notification Error",
    selector: `[role=alertdialog]`,
    locator: {},
  };
  const notificationError = {
    displayName: "Notification Error",
    selector: `#t_Alert_Notification`,
    locator: {},
  };
  const igCellError = {
    displayName: "Interactive Grid Cell Error",
    selector: `.a-IG-body td[role=gridcell][class~=is-error]`,
    locator: {},
  };
  const wholePageError = {
    displayName: "Whole Page Error",
    selector: `[class~=t-Alert--wizard]`,
    locator: {},
  };

  await page.waitForLoadState("networkidle");
  await waitMs(delay);

  let contextIsIframe = Object.prototype.hasOwnProperty.call(context, "_frame");
  let iframeStillExists = contextIsIframe
    ? (await context.owner().count()) > 0
    : false;

  if (!iframeStillExists) {
    context = page;
  }

  formItemError.locator = await context.locator(formItemError.selector);
  notificationError.locator = await context.locator(notificationError.selector);
  igCellError.locator = await context.locator(igCellError.selector);
  wholePageError.locator = await context.locator(wholePageError.selector);
  jsAlertError.locator = await page.locator(jsAlertError.selector);

  const errorTypes = [
    notificationError,
    jsAlertError,
    formItemError,
    igCellError,
    wholePageError,
  ];

  for (let i = 0; i < errorTypes.length; i++) {
    let errorCount = await errorTypes[i].locator.count();
    let errorMessages = [];

    if (errorCount > 0) {
      errorData.sumErrors += errorCount;
      // Get error messages for the current error type
      for (let j = 0; j < errorCount; j++) {
        errorMessages.push(await errorTypes[i].locator.nth(j).innerText());
      }
      errorData.errors.push({
        displayName: errorTypes[i].displayName,
        errorCount: errorCount,
        errorMessages: errorMessages,
      });
    }
  }

  return errorData;
}

/**
 * Checks for different types of errors on the current page.
 * This is a workaround because we can't dynamically wait for errors
 * to appear as the kind of errors is not known beforehand.
 *
 * @param {Object} params The parameters for this function.
 * @param {Page} params.page The Playwright Page object.
 * @param {Page | FrameLocator} params.context The context where the Error is or should not be located.
 * @param {string} params.errorMsgText The optional error message txt to check for.
 * @param {boolean} params.expectErrors Whether an error is expected in the given context or not.
 * @param {number} params.delay The static amount of time to wait before starting to get errors.
 */
async function checkForErrors({
  page,
  context,
  errorMsgText,
  expectErrors,
  delay,
}) {
  const errorsFound = await getErrors(page, context, delay);

  if (errorsFound.sumErrors !== 0) {
    let messageFound = false;
    errorsFound.errors.forEach((error) => {
      console.log(
        `Error of Type "${error.displayName}" found ${error.errorCount} time(s).`
      );
      error.errorMessages.forEach((message) => {
        console.log("Found Error Message: ", message);

        if (errorMsgText) {
          if (message.includes(errorMsgText)) {
            messageFound = true;
          }
        }
      });
    });

    if (!expectErrors) {
      throw new Error(`No errors expected but errors found`);
    }
    if (!messageFound) {
      throw new Error(`Given error message "${errorMsgText}" not found`);
    }
  } else {
    if (expectErrors) {
      throw new Error(`Errors expected but no errors found`);
    }
  }
}

/**
 * Returns a Frame object matching the provided FrameLocator.
 * The current implementation compares the URL of the target frame with all frames on the page.
 *
 * @param {import("playwright-core").Page} page The page object. Used to enumerate all frames.
 * @param {import("playwright-core").Page | import("playwright-core").FrameLocator} frameLocator The target FrameLocator used for search.
 */
async function findMatchingFrame(page, frameLocator) {
  for (const frame of page.frames()) {
    await frame.waitForLoadState('domcontentloaded');
  }

  const getUrl = () => window.location.href;
  const locator = frameLocator.locator(':root');
  const targetUrl = await locator.evaluate(getUrl);

  for (const frame of page.frames()) {
    const potentialUrl = await frame.evaluate(getUrl);

    if (potentialUrl === targetUrl) {
      return frame;
    }
  }

  throw new Error('Frame not found');
}

/**
 * Waits for the context to reach the specified load state.
 *
 * @param {import("playwright-core").Page} page The current page.
 * @param {import("playwright-core").Page | import("playwright-core").FrameLocator} context The context to wait for.
 * @param {'load'|'domcontentloaded'|'networkidle'} loadState The target load state.
 * @param {object} options Additional options. Currently only `timeout`.
 */
async function waitForLoadState(page, context, loadState, options) {
  if ('owner' in context) {
    const frame = await findMatchingFrame(page, context)
    await frame.waitForLoadState(loadState, options);
  } else {
    await page.waitForLoadState(loadState, options);
  }
}

module.exports = {
  stepStart,
  stepEnd,
  getRandomSelectIndex,
  getValueFromJson,
  waitMs,
  moveShuttleValues,
  selectPopupLovValue,
  interactiveTable,
  generateUrl,
  elementHasAttribute,
  getCellLocator,
  setSwitchElement,
  datePicker,
  checkForErrors,
  waitForLoadState,
};
