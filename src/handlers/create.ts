import { AttachmentAction } from '@slack/client';
import { Response } from 'express';
import moment from 'moment-timezone';
import slack from '../utils/slack';
import { checkCreateSubmission, getMinutesFromText, getValues } from '../utils';

export default async (payload, res: Response) => {
  const { user, channel, submission } = payload;

  const errors = checkCreateSubmission(submission);
  if (errors.length) {
    return res.status(200).json({ errors });
  }

  const periodHours = getMinutesFromText(submission.period);
  const period = moment()
    .add(periodHours, 'minutes')
    .format('YYYY-MM-DD HH:mm:ss');

  const fields = [
    {
      title: '商品名',
      value: submission.title,
      short: false,
    },
    {
      title: '出品者',
      value: `<@${user.id}>`,
      short: false,
    },
    {
      title: '即決価格',
      value: submission.end_value
        ? `¥${Number(submission.end_value).toLocaleString()}`
        : '設定なし',
      short: true,
    },
    {
      title: '出品価格',
      value: `¥${Number(submission.start_value).toLocaleString()}`,
      short: true,
    },
    {
      title: '終了日時',
      value: period,
      short: false,
    },
  ];

  const actions: AttachmentAction[] = [
    // {
    //   name: 'close',
    //   text: '出品終了',
    //   type: 'button',
    //   value: '',
    //   style: 'danger',
    //   confirm: {
    //     title: '本当に終了しますか？',
    //     text: '出品を終了します (出品者のみ操作可能)',
    //     ok_text: '終了',
    //     dismiss_text: 'キャンセル',
    //   },
    // },
    {
      name: 'bidding',
      text: '価格を選んで入札',
      type: 'select',
      options: getValues(
        submission.start_value,
        submission.end_value,
        true
      ).map(value => ({
        text: `¥${value.toLocaleString()}`,
        value: value.toString(),
      })),
      confirm: {
        title: '本当に入札しますか？',
        text: '選択した価格で入札します',
        ok_text: '入札する',
        dismiss_text: 'キャンセル',
      },
    },
  ];

  if (submission.comment) {
    fields.push({
      title: '商品説明',
      value: submission.comment,
      short: false,
    });
  }

  if (submission.end_value) {
    actions.push({
      name: 'winning',
      text: '即決価格で落札',
      type: 'button',
      value: submission.end_value,
      style: 'primary',
      confirm: {
        title: '本当に落札しますか？',
        text: '即決価格で落札します',
        ok_text: '落札する',
        dismiss_text: 'キャンセル',
      },
    });
  }

  const attachments = [
    {
      callback_id: 'bidding',
      color: '#eeeeee',
      fields,
      actions,
    },
  ];

  const text = `*開催中* ${submission.title}`;

  const postResult = await slack.chat.postMessage({
    channel: channel.id,
    text,
    attachments,
  });
  console.log(postResult);

  return res.status(200).end();
};
