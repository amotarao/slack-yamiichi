import { describe, it } from 'mocha';
import { assert } from 'chai';
import * as utils from '../src/utils';

describe('utils.getValues 出品時のテスト(開始価格と終了価格で比較)', () => {
  it('同値 ¥0', () => {
    assert.deepEqual(utils.getValues(0, 0, true), [0]);
  });
  it('同値 ¥100', () => {
    assert.deepEqual(utils.getValues(100, 100, true), [100]);
  });
  it('通常 ¥0 - ¥100', () => {
    assert.deepEqual(utils.getValues(0, 100, true), [0, 50, 100]);
  });
  it('中途半端な値で終わる ¥0 - ¥123', () => {
    assert.deepEqual(utils.getValues(0, 123, true), [0, 50, 100, 123]);
  });
  it('中途半端な値で始まる ¥12 - ¥123', () => {
    assert.deepEqual(utils.getValues(12, 123, true), [12, 62, 112, 123]);
  });
  it('10件まで表示 ¥0 - ¥1,000', () => {
    assert.deepEqual(utils.getValues(0, 1000, true), [
      0,
      50,
      100,
      150,
      200,
      250,
      300,
      350,
      400,
      450,
    ]);
  });
  it('10件まで表示 ¥100 - ¥1,000', () => {
    assert.deepEqual(utils.getValues(100, 1000, true), [
      100,
      150,
      200,
      250,
      300,
      350,
      400,
      450,
      500,
      550,
    ]);
  });
  it('10件まで表示 ¥1,000 - ¥5,000', () => {
    assert.deepEqual(utils.getValues(1000, 5000, true), [
      1000,
      1100,
      1200,
      1300,
      1400,
      1500,
      1600,
      1700,
      1800,
      1900,
    ]);
  });
  it('差額が途中で変わる ¥800 - ¥5,000', () => {
    assert.deepEqual(utils.getValues(800, 5000, true), [
      800,
      850,
      900,
      950,
      1000,
      1100,
      1200,
      1300,
      1400,
      1500,
    ]);
  });
  it('差額が途中で変わり、中途半端に終わる ¥800 - ¥1,250', () => {
    assert.deepEqual(utils.getValues(800, 1250, true), [
      800,
      850,
      900,
      950,
      1000,
      1100,
      1200,
      1250,
    ]);
  });
  it('差額が途中で変わる ¥9,500 - ¥15,000', () => {
    assert.deepEqual(utils.getValues(9500, 15000, true), [
      9500,
      9600,
      9700,
      9800,
      9900,
      10000,
      11000,
      12000,
      13000,
      14000,
    ]);
  });
});

describe('utils.getValues 入札時のテスト(現在価格と終了価格で比較)', () => {
  it('10件まで表示 ¥100 - ¥1,000', () => {
    assert.deepEqual(utils.getValues(100, 1000, false), [
      150,
      200,
      250,
      300,
      350,
      400,
      450,
      500,
      550,
      600,
    ]);
  });
  it('10件まで表示 ¥100 - ¥1,000 (引数省略)', () => {
    assert.deepEqual(utils.getValues(100, 1000), [
      150,
      200,
      250,
      300,
      350,
      400,
      450,
      500,
      550,
      600,
    ]);
  });
  it('同値 ¥100 (基本的に存在しないので空配列を返す)', () => {
    assert.deepEqual(utils.getValues(100, 100, false), []);
  });
  it('通常 ¥100 - ¥300', () => {
    assert.deepEqual(utils.getValues(100, 300, false), [150, 200, 250, 300]);
  });
});

describe('utils.getMinutesFromText ショートコードの変換', () => {
  it('1m 1分', () => {
    assert.equal(utils.getMinutesFromText('1m'), 1);
  });
  it('30m 30分', () => {
    assert.equal(utils.getMinutesFromText('30m'), 30);
  });
  it('60m 60分', () => {
    assert.equal(utils.getMinutesFromText('60m'), 60);
  });
  it('1h 1時間 60分', () => {
    assert.equal(utils.getMinutesFromText('1h'), 60);
  });
  it('6h 6時間 360分', () => {
    assert.equal(utils.getMinutesFromText('6h'), 360);
  });
  it('24h 24時間 1440分', () => {
    assert.equal(utils.getMinutesFromText('24h'), 1440);
  });
  it('1d 1日 1440分', () => {
    assert.equal(utils.getMinutesFromText('1d'), 1440);
  });
  it('7d 7日 10080分', () => {
    assert.equal(utils.getMinutesFromText('7d'), 10080);
  });
  it('1w 1週間 10080分', () => {
    assert.equal(utils.getMinutesFromText('1w'), 10080);
  });
  it('5w 5週間 50400分', () => {
    assert.equal(utils.getMinutesFromText('5w'), 50400);
  });
  it('適当な文字列', () => {
    assert.equal(utils.getMinutesFromText('abcdefg123'), null);
  });
});
