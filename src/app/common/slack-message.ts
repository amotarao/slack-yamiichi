import moment = require('../modules/moment');
import { AttachmentAction } from '@slack/client';
import { getValuesOption } from './utils';

interface SlackMessageField {
  title: string;
  value: string;
  short: boolean;
}

/**
 * 出品用のメッセージフィールドを作成する
 * @param isAuction    オークションスタイルかどうか (開始＝即決は false)
 * @param isFinished   終了しているかどうか
 * @param id           出品ID
 * @param name         商品名
 * @param description  商品説明
 * @param sellerID     出品者の Slack ID
 * @param lastBidderID 最終入札者の Slack ID
 * @param value        開始価格または現在の価格
 * @param endValue     終了価格
 * @param endDate      終了日時
 */
export const createExhibitionMessageFields = (
  isAuction: boolean,
  isFinished: boolean,
  id: string | null,
  name: string,
  description: string | null,
  sellerID: string,
  lastBidderID: string | null,
  startValue: number,
  endValue: number | null,
  endDate: Date | null
): SlackMessageField[] => {
  const fields: SlackMessageField[] = [];
  const hasBidder = Boolean(lastBidderID);

  fields.push({
    title: '商品名',
    value: name || '_設定なし_',
    short: id !== null, // IDの設定があれば true
  });

  id &&
    fields.push({
      title: '出品ID',
      value: id,
      short: true,
    });

  fields.push({
    title: '出品者',
    value: `<@${sellerID}>`,
    short: hasBidder, // 最終入札者がいれば true
  });

  hasBidder &&
    fields.push({
      title: isFinished ? (isAuction ? '落札者' : '購入者') : '最終入札者',
      value: `<@${lastBidderID}>`,
      short: true,
    });

  fields.push({
    title: isAuction ? '即決価格' : '販売価格',
    value: endValue !== null ? `¥${endValue.toLocaleString()}` : '_設定なし_',
    short: true,
  });

  fields.push({
    title: hasBidder ? '現在の価格' : '開始価格',
    value: `¥${startValue.toLocaleString()}`,
    short: true,
  });

  endDate &&
    fields.push({
      title: '終了日時',
      value: moment(endDate).format('YYYY-MM-DD HH:mm:ss'),
      short: !isAuction, // オークションスタイルなら false
    });

  description &&
    fields.push({
      title: '商品説明',
      value: description || '_設定なし_',
      short: false,
    });

  return fields;
};

/**
 * 出品用のメッセージアクションを作成する
 * @param isAuction  オークションスタイルかどうか (開始＝即決は false)
 * @param hasBidder  最終入札者がいるかどうか
 * @param value      開始価格または現在の価格
 * @param endValue   終了価格
 */
export const createExhibitionMessageActions = (
  isAuction: boolean,
  hasBidder: boolean,
  value: number,
  endValue: number | null
): AttachmentAction[] => {
  const actions: AttachmentAction[] = [];

  actions.push({
    name: 'end',
    text: '出品終了',
    value: 'end',
    type: 'button',
    style: 'danger',
    confirm: {
      title: '本当に終了しますか？',
      text: '出品を終了します (出品者のみ操作可能)',
      ok_text: '終了',
      dismiss_text: 'キャンセル',
    },
  });

  isAuction &&
    value !== endValue &&
    actions.push({
      name: 'bidding',
      text: '価格を選んで入札',
      type: 'select',
      options: getValuesOption(value, endValue, !hasBidder).map(value => ({
        text: `¥${value.toLocaleString()}`,
        value: value.toString(),
      })),
      confirm: {
        title: '本当に入札しますか？',
        text: '選択した価格で入札します',
        ok_text: '入札する',
        dismiss_text: 'キャンセル',
      },
    });

  isAuction &&
    endValue !== null &&
    actions.push({
      name: 'winning',
      text: '即決価格で落札',
      value: endValue.toString(),
      type: 'button',
      style: 'primary',
      confirm: {
        title: '本当に落札しますか？',
        text: `即決価格(¥${endValue.toLocaleString()}) で落札します`,
        ok_text: '落札する',
        dismiss_text: 'キャンセル',
      },
    });

  !isAuction &&
    endValue !== null &&
    actions.push({
      name: 'buy',
      text: '購入',
      value: endValue.toString(),
      type: 'button',
      style: 'primary',
      confirm: {
        title: '本当に購入しますか？',
        text: `¥${endValue.toLocaleString()} で購入します`,
        ok_text: '購入する',
        dismiss_text: 'キャンセル',
      },
    });

  return actions;
};
