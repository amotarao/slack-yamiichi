import { WebClient } from '@slack/client';
import { Response } from 'express';
import { checkElementsForCreate, getPeriod } from '../../common/utils';
import {
  createExhibitionMessageFields,
  createExhibitionMessageActions,
} from '../../common/slack-message';

const client = new WebClient(process.env.SLACK_OAUTH_TOKEN);

export interface CreateInterface {
  type: string;
  token: string;
  action_ts: string;
  team: { id: string; domain: string };
  user: { id: string; name: string };
  channel: { id: string; name: string };
  submission: {
    title: string | null;
    comment: string | null;
    start_value: string | null;
    end_value: string | null;
    period: string | null;
  };
  callback_id: 'create';
  response_url: string;
  state: string;
}

export const createHandler = async (
  payload: CreateInterface,
  res: Response
): Promise<Response | void> => {
  const { user, channel, submission: elms } = payload;

  const errors = checkElementsForCreate(elms);
  if (errors.length) {
    return res.status(200).json({ errors });
  }

  const isAuction = elms.start_value !== elms.end_value;
  const { endDate } = getPeriod(elms.period);

  const fields = createExhibitionMessageFields(
    isAuction,
    false,
    null,
    elms.title || '',
    elms.comment,
    user.id,
    null,
    Number(elms.start_value),
    Number(elms.end_value),
    endDate
  );

  const actions = createExhibitionMessageActions(
    isAuction,
    false,
    Number(elms.start_value),
    Number(elms.end_value)
  );

  const text = `*開催中* ${elms.title}`;

  const postResult = await client.chat.postMessage({
    channel: channel.id,
    text,
    attachments: [
      {
        callback_id: 'bidding',
        color: '#eeeeee',
        fields,
        actions,
      },
    ],
  });
  console.log(postResult);

  return res.status(200).end();
};
