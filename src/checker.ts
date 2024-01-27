import { Option } from "./types";

export const compareWithBaseFile = (
  json: any,
  cachedBaseFile: string[],
  option: Option
) => {
  const errors: string[] = [];
  for (let i = 0; i < cachedBaseFile.length; i++) {
    const result = checkNestedProperty(json, cachedBaseFile[i], option);
    if (result === true) {
      continue;
    }

    if (result.notFound) {
      errors.push(`Not found: '${cachedBaseFile[i]}'`);
    } else if (result.noValue) {
      errors.push(`No value: '${cachedBaseFile[i]}'`);
    } else if (result.prohibitedKey) {
      errors.push(`Prohibited key: '${cachedBaseFile[i]}'`);
    } else if (result.prohibitedValue) {
      errors.push(`Prohibited value: '${cachedBaseFile[i]}'`);
    }
  }

  return errors;
};

const checkNestedProperty = (
  obj: any,
  propertyPath: string,
  option: Option
):
  | {
      notFound?: boolean;
      noValue?: boolean;
      prohibitedKey?: boolean;
      prohibitedValue?: boolean;
    }
  | true => {
  const properties = propertyPath.split(".");

  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];

    if (option.prohibitedKeys && option.prohibitedKeys.includes(prop)) {
      return { prohibitedKey: true };
    }
    // @ts-ignore
    if (!obj.hasOwnProperty(prop)) {
      return { notFound: true };
    } else {
      obj = obj[prop];
      if (!obj) {
        return { noValue: true };
      } else if (typeof obj === "string" && option.prohibitedValues) {
        for (let j = 0; j < option.prohibitedValues.length; j++) {
          if (obj.includes(option.prohibitedValues[j])) {
            return { prohibitedValue: true };
          }
        }
      }
    }
  }

  return true;
};
