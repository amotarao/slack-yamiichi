import { Dialog } from '@slack/client';
import { Request, Response } from 'express';
import slack from './utils/slack';

interface DialogRequestBody {
  token: string;
  team_id: string;
  team_domain: string;
  channel_id: string;
  channel_name: string;
  user_id: string;
  user_name: string;
  command: string;
  text: string;
  response_url: string;
  trigger_id: string;
}

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
export default async (req: Request, res: Response) => {
  const { body }: { body: DialogRequestBody } = req;
  const { trigger_id } = body;

  console.log(body);

  const dialog: Dialog = {
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
        label: '出品期間',
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

  try {
    const result = await slack.dialog.open({
      trigger_id,
      dialog,
    });
    console.log(result);
  } catch (error) {
    console.error(error);
  }

  res.status(200).end();
};
