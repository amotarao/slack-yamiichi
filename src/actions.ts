import { WebClient, AttachmentAction } from '@slack/client';
import { Request, Response } from 'express';
import moment from 'moment-timezone';
import { getValues, getMinutesFromText } from './utils';

const slack = new WebClient(process.env.SLACK_OAUTH_TOKEN);
moment.tz.setDefault('Asia/Tokyo');

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.helloWorld = (req: Request, res: Response) => {
  const { body } = req;
  console.log(body);
  const payload = JSON.parse(body.payload);
  console.log(payload);

  switch (payload.callback_id) {
    case 'create':
      return createHandler(payload, res);
    case 'bidding':
      return biddingHandler(payload, res);
    // case 'close':
    //   return closeHandler (payload, res);
  }

  res.status(400).end();
};

async function createHandler(payload, res) {
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
}

async function biddingHandler(payload, res) {
  const { channel, user, actions: user_actions, original_message } = payload;

  const value =
    user_actions[0].name === 'bidding'
      ? Number(user_actions[0].selected_options[0].value)
      : Number(user_actions[0].value);

  const original_fields = original_message.attachments[0].fields;
  const original_fields_obj = {
    title: original_fields.find(elm => elm.title === '商品名'),
    period: original_fields.find(elm => elm.title === '終了日時'),
    sell_user: original_fields.find(elm => elm.title === '出品者'),
    last_bidding_user: original_fields.find(elm => elm.title === '最終入札者'),
    start_value: original_fields.find(elm => elm.title === '出品価格'),
    now_value: original_fields.find(elm => elm.title === '現在の価格'),
    end_value: original_fields.find(elm => elm.title === '即決価格'),
    description: original_fields.find(elm => elm.title === '商品説明'),
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

  const fields = [
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
    fields.push(original_fields_obj.description);
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
      fields,
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
}

function checkCreateSubmission(submission) {
  const errors = [];

  if (!submission.title) {
    errors.push({
      name: 'title',
      error: '必須項目です',
    });
  }

  if (submission.start_value) {
    const start_value = Number(submission.start_value);

    if (isNaN(start_value)) {
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

    if (isNaN(end_value)) {
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
}
