import { Request, Response } from 'express';
import { createHandler } from './create';
// import { biddingHandler } from './bidding';

export const actionsFunction = (
  req: Request,
  res: Response
): Promise<Response | void> | void => {
  const body = JSON.parse(req.body.payload);
  console.log('Actions Request', body);

  switch (body.callback_id) {
    case 'create':
      return createHandler(body, res);
    // case 'bidding':
    //   return biddingHandler(body, res);
    default:
      return res.status(400).end();
  }
};
