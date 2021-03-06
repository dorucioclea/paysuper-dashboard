const _ = require('lodash');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

function throwVariableError(variableName) {
  const message = `Environment variable '${variableName}' is not set`;
  throw new Error(message);
}

const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
if (!nodeEnv) {
  throwVariableError('NODE_ENV');
}

const isLocal = nodeEnv === 'local';
const isTest = nodeEnv === 'test';

const getEnvVariable = (variableName, defaultValue) => {
  const envVal = process.env[variableName];
  if (typeof envVal !== 'undefined') {
    return envVal;
  }
  if (!(isLocal || isTest)) {
    throwVariableError(variableName);
  }
  return defaultValue;
};

const getEnvVariableArray = (variableName, defaultValue, allowedList) => {
  const valuesList = _.compact(getEnvVariable(variableName, defaultValue)
    .split(','));
  if (!valuesList.length) {
    return allowedList || [];
  }
  if (!allowedList) {
    return valuesList;
  }
  return _.intersection(valuesList, allowedList);
};

module.exports.getEnvVariable = getEnvVariable;
module.exports.getEnvVariableArray = getEnvVariableArray;
