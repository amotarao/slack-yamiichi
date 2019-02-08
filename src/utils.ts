export const getValues = (
  start: number,
  end: number | null,
  includeStartValue: boolean = false
): number[] => {
  const values = [];

  if (includeStartValue) {
    values.push(start);
  }

  while (values.length <= 10) {
    const lastValue = values.length ? values[values.length - 1] : start;
    const newValue =
      lastValue + Math.max(50, 10 ** (lastValue.toString().length - 2));
    if (end && newValue >= end) {
      values.push(end);
      break;
    }
    values.push(newValue);
  }

  return values;
};

export const getMinutesFromText = (str: string): number => {
  const [, num, unit] = str.match(/^(\d)+([mhdw])$/);

  if (unit === 'm') {
    return Number(num);
  }
  if (unit === 'h') {
    return Number(num) * 60;
  }
  if (unit === 'd') {
    return Number(num) * 60 * 24;
  }
  if (unit === 'w') {
    return Number(num) * 60 * 24 * 7;
  }
  return 0;
};
