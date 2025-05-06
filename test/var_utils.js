let var_utils = {};

const VAR_META = {};

const state = {};

function getCurrState() {
  // eslint-disable-next-line no-console
  return `Current state: ${JSON.stringify(state)}`;
}

function varExists(varName) {
  return typeof state[varName] !== "undefined";
}

function getVar(varName) {
  if (!varExists(varName))
    throw new Error(`Variable "${varName}" not found! ${getCurrState()}`);
  return state[varName];
}

const CASE_VARS = {};

function setVar(varName, value, log = true) {
  if (!varExists(varName))
    throw new Error(`Variable "${varName}" not found! ${getCurrState()}`);
  if (VAR_META[varName].isConstant)
    throw new Error(
      `Variable ${varName} is constant - cannot be set! ${getCurrState()}`
    );
  state[varName] = value;
  if (log) {
    console.log(`New value ${varName}: "${value}"`);
  }
}

var_utils.getVar = getVar;
var_utils.setVar = setVar;

function setupCaseVars(caseName) {
  if (!CASE_VARS[caseName]) {
    return;
  }
  const vars = CASE_VARS[caseName]();
  for (const [key, value] of Object.entries(vars)) {
    setVar(key, value, false);
  }
}

var_utils.setupCaseVars = setupCaseVars;

var_utils.EXEC_URL = "https://marge.lct.software/ords/lct_dev/";

module.exports = var_utils;
