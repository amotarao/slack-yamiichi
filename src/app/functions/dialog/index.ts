import { WebClient, Dialog } from '@slack/client';
import { Request, Response } from 'express';
import {
  IDs,
  Names,
  ExhibitElementNames,
  ExhibitElementIDs,
} from '../../common/enums';

const client = new WebClient(process.env.SLACK_OAUTH_TOKEN);

export const dialogFunction = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { body } = req;
  console.log('Dialog Request', body);

  const { token, trigger_id }: { token: string; trigger_id: string } = body;

  if (token !== process.env.SLACK_VERIFICATION_TOKEN) {
    return res.send(403).end();
  }

  const dialog: Dialog = {
    callback_id: IDs.Create,
    title: Names.ExhibitionFormTitle,
    submit_label: Names.Exhibit,
    elements: [
      {
        label: ExhibitElementNames.Name,
        name: ExhibitElementIDs.Name,
        type: 'text',
      },
      {
        label: ExhibitElementNames.Description,
        name: ExhibitElementIDs.Description,
        type: 'textarea',
        optional: true,
      },
      {
        label: ExhibitElementNames.StartValue,
        name: ExhibitElementIDs.StartValue,
        type: 'text',
        subtype: 'number',
      },
      {
        label: ExhibitElementNames.EndValue,
        name: ExhibitElementIDs.EndValue,
        type: 'text',
        subtype: 'number',
        optional: true,
      },
      {
        label: ExhibitElementNames.ExhibitionPeriod,
        name: ExhibitElementIDs.ExhibitionPeriod,
        type: 'select',
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
    const result = await client.dialog.open({
      trigger_id,
      dialog,
    });
    console.log('Dialog Result', result);
  } catch (err) {
    console.log('Dialog Result Error', err);
    return res.status(500).end();
  }

  return res.status(200).end();
};
