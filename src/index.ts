import { Request, Response } from 'express';
import * as moment from 'moment-timezone';

moment.tz.setDefault('Asia/Tokyo');

export const example = (req: Request, res: Response): void => {
  const date = moment().toLocaleString();
  const message =
    req.query.message || req.body.message || `Hello World! ${date}`;
  res.status(200).send(message);
};
