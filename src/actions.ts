import { Request, Response } from 'express';
import moment from 'moment-timezone';
import { createHandler, biddingHandler } from './handlers';

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
    default:
      return res.status(400).end();
  }
};
