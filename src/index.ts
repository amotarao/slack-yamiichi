import { Request, Response } from 'express';

export const example = (req: Request, res: Response): void => {
  const message = req.query.message || req.body.message || 'Hello World!';
  res.status(200).send(message);
};
