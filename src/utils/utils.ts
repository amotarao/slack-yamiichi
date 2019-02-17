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
  const matches = sc.match(/^(\d+)([mhdw])$/);

  if (!matches) {
    return null;
  }
  const [, num, unit] = matches;

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
  return null;
};

/**
 *
 * @param submission 送信データ
 */
export const checkCreateSubmission = (submission: {
  [key: string]: string;
}): { name: string; error: string }[] => {
  const errors = [];

  if (!submission.title) {
    errors.push({
      name: 'title',
      error: '必須項目です',
    });
  }

  if (submission.start_value) {
    const start_value = Number(submission.start_value);

    if (Number.isNaN(start_value)) {
      errors.push({
        name: 'start_value',
        error: '数値を入力してください',
      });
    } else if (!Number.isInteger(start_value)) {
      errors.push({
        name: 'start_value',
        error: '整数を入力してください',
      });
    } else if (start_value >= 1000000) {
      errors.push({
        name: 'start_value',
        error: '¥999,999 までにしてください',
      });
    }
  } else {
    errors.push({
      name: 'start_value',
      error: '必須項目です',
    });
  }

  if (submission.end_value) {
    const start_value = Number(submission.start_value);
    const end_value = Number(submission.end_value);

    if (Number.isNaN(end_value)) {
      errors.push({
        name: 'end_value',
        error: '数値を入力してください',
      });
    } else if (!Number.isInteger(end_value)) {
      errors.push({
        name: 'end_value',
        error: '整数を入力してください',
      });
    } else if (end_value >= 1000000) {
      errors.push({
        name: 'end_value',
        error: '¥999,999 までにしてください',
      });
    } else if (start_value > end_value) {
      errors.push({
        name: 'end_value',
        error: '開始価格 以上の金額を入力してください',
      });
    }
  }

  if (!submission.period) {
    errors.push({
      name: 'period',
      error: '必須項目です',
    });
  }

  return errors;
};
