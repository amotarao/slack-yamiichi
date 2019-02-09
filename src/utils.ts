/**
 * 入札価格の候補を生成
 * @param start 開始価格 / 現在価格
 * @param end 終了価格
 * @param includeStartValue startを含むか (開始価格なら true)
 */
export const getValues = (
  start: number,
  end: number | null,
  includeStartValue: boolean = false
): number[] => {
  const values = [];

  if (includeStartValue) {
    values.push(start);
  }

  if (start === end) {
    return values;
  }

  while (values.length < 10) {
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

/**
 * 日時のショートコードを分の値に変換する
 * @param sc ショートコード (分,時,日,週間)
 */
export const getMinutesFromText = (sc: string): number => {
  const [, num, unit] = sc.match(/^(\d+)([mhdw])$/);

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
