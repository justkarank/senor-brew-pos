const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);
const FALSE_VALUES = new Set(['0', 'false', 'no', 'off']);

const getBooleanEnv = (name, defaultValue = false) => {
  const rawValue = process.env[name];

  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return defaultValue;
  }

  const normalizedValue = String(rawValue).trim().toLowerCase();

  if (TRUE_VALUES.has(normalizedValue)) {
    return true;
  }

  if (FALSE_VALUES.has(normalizedValue)) {
    return false;
  }

  return defaultValue;
};

const getTrimmedEnv = (name) => String(process.env[name] || '').trim();

module.exports = {
  getBooleanEnv,
  getTrimmedEnv
};
