const request = require('request');

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.helloWorld = (req, res) => {
  const { body } = req;
  const { trigger_id } = body;

  console.log(body);

  const dialog = {
    callback_id: 'create',
    title: '闇市出品フォーム',
    submit_label: '出品',
    elements: [
      {
        label: '商品名',
        name: 'title',
        type: 'text',
      },
      {
        label: '説明',
        name: 'comment',
        type: 'textarea',
        optional: true,
      },
      {
        label: '開始価格',
        name: 'start_value',
        type: 'text',
        subtype: 'number',
      },
      {
        label: '即決価格',
        name: 'end_value',
        type: 'text',
        subtype: 'number',
        optional: true,
      },
      {
        label: '販売期間',
        type: 'select',
        name: 'period',
        options: [
          {
            label: '1分 (開発用)',
            value: '1m',
          },
          {
            label: '1時間',
            value: '1h',
          },
          {
            label: '3時間',
            value: '3h',
          },
          {
            label: '6時間',
            value: '6h',
          },
          {
            label: '12時間',
            value: '12h',
          },
          {
            label: '1日',
            value: '1d',
          },
          {
            label: '2日',
            value: '2d',
          },
          {
            label: '3日',
            value: '3d',
          },
          {
            label: '4日',
            value: '4d',
          },
          {
            label: '5日',
            value: '5d',
          },
          {
            label: '6日',
            value: '6d',
          },
          {
            label: '1週間',
            value: '1w',
          },
          {
            label: '2週間',
            value: '2w',
          },
        ],
      },
    ],
  };

  const token = process.env.SLACK_OAUTH_TOKEN;
  const url = `https://slack.com/api/dialog.open?token=${token}&trigger_id=${trigger_id}&dialog=${encodeURI(JSON.stringify(dialog))}`;

  request.post(url, (error, response, body) => {
    console.log(body);
    res.status(response.statusCode).end();
  });
};
