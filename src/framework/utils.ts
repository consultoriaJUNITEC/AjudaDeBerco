

const isUndefined = (value: any): value is boolean => {
  return typeof value === 'undefined';
};

const isDefinedAndNotNull = (value: any): boolean => {
  return !isUndefined(value) && value !== null;
};

const isUndefinedOrNull = (value: any): boolean => {
  return !isDefinedAndNotNull(value);
};

export { isUndefinedOrNull, isDefinedAndNotNull, isUndefined };
