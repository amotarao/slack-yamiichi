import { WebClient } from '@slack/client';

export default new WebClient(process.env.SLACK_OAUTH_TOKEN);
