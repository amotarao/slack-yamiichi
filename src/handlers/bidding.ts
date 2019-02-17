import { Response } from 'express';
import moment from 'moment-timezone';
import { MessageAttachment } from '@slack/client';
import slack from '../utils/slack';
import { getValues } from '../utils';

interface MessageAttachmentField {
  title: string;
  value: string;
  short?: boolean;
}

export default async (payload, res: Response) => {
  const { channel, user, actions: user_actions, original_message } = payload;

  const value =
    user_actions[0].name === 'bidding'
      ? Number(user_actions[0].selected_options[0].value)
      : Number(user_actions[0].value);

  const fields: MessageAttachmentField[] =
    original_message.attachments[0].fields;
  const original_fields_obj: { [key: string]: MessageAttachmentField } = {
    title: fields.find(elm => elm.title === '商品名'),
    period: fields.find(elm => elm.title === '終了日時'),
    sell_user: fields.find(elm => elm.title === '出品者'),
    last_bidding_user: fields.find(elm => elm.title === '最終入札者'),
    start_value: fields.find(elm => elm.title === '出品価格'),
    now_value: fields.find(elm => elm.title === '現在の価格'),
    end_value: fields.find(elm => elm.title === '即決価格'),
    description: fields.find(elm => elm.title === '商品説明'),
  };

  const start_value =
    original_fields_obj.start_value &&
    Number(original_fields_obj.start_value.value.replace(/[¥,]/g, ''));
  const end_value =
    original_fields_obj.end_value &&
    Number(original_fields_obj.end_value.value.replace(/[¥,]/g, ''));
  const now_value =
    original_fields_obj.now_value &&
    Number(original_fields_obj.now_value.value.replace(/[¥,]/g, ''));
  const finish = Boolean(end_value && value >= end_value);
  const period = moment(original_fields_obj.period.value);
  const alreadyFinish = Boolean(moment().diff(period) >= 0);

  const winner = alreadyFinish
    ? original_fields_obj.last_bidding_user
      ? original_fields_obj.last_bidding_user.value.replace(/[<>@]/g, '')
      : null
    : finish
    ? user.id
    : null;

  // 期間を過ぎた場合
  if (alreadyFinish) {
    await slack.chat.postEphemeral({
      channel: channel.id,
      user: user.id,
      text: '既に出品が終了しています',
    });
  }

  // 入札価格が更新されない場合
  if (
    (start_value && start_value > value) ||
    (now_value && now_value >= value)
  ) {
    await slack.chat.postEphemeral({
      channel: channel.id,
      user: user.id,
      text: '入札できませんでした',
    });
    res.status(200).end();
    return;
  }

  const newFields = [
    original_fields_obj.title,
    {
      ...original_fields_obj.sell_user,
      short: true,
    },
    {
      title: finish ? '落札者' : '最終入札者',
      value: finish || alreadyFinish ? `<@${winner}>` : `<@${user.id}>`,
      short: true,
    },
    original_fields_obj.end_value,
    {
      title: '現在の価格',
      value: `¥${Number(value).toLocaleString()}`,
      short: true,
    },
    {
      ...original_fields_obj.period,
      value:
        finish || alreadyFinish
          ? period.add(1, 'minutes').format('YYYY-MM-DD HH:mm:ss')
          : period.format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  if (original_fields_obj.description) {
    newFields.push(original_fields_obj.description);
  }

  const actions = [
    // original_message.attachments[0].actions[0],
    {
      ...original_message.attachments[0].actions[0],
      // ...original_message.attachments[0].actions[1],
      options: getValues(value, end_value),
    },
  ];

  // if (original_message.attachments[0].actions.length === 3) {
  //   actions.push (original_message.attachments[0].actions[2]);
  if (original_message.attachments[0].actions.length === 2) {
    actions.push(original_message.attachments[0].actions[1]);
  }

  const attachments = [
    {
      callback_id: 'bidding',
      color: '#eeeeee',
      newFields,
      actions: !finish && actions,
    },
  ];

  const text = finish
    ? `*終了* ${original_fields_obj.title.value}`
    : `*開催中* ${original_fields_obj.title.value}`;

  slack.chat
    .update({
      channel: channel.id,
      text,
      attachments,
      ts: original_message.ts,
    })
    .then(console.log)
    .catch(console.error);

  slack.chat
    .postMessage({
      channel: channel.id,
      text:
        finish || alreadyFinish
          ? winner
            ? `*<@${winner}> が落札*\n\n${
                original_fields_obj.sell_user.value
              } 取引を進めてください`
            : `${original_fields_obj.sell_user.value} 落札者はいませんでした`
          : `${user.name} が ¥${Number(value).toLocaleString()} で入札`,
      reply_broadcast: true,
      thread_ts: original_message.ts,
    })
    .then(console.log)
    .catch(console.error);

  res.status(200).end();
};
