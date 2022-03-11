import { Response } from "express";
import { OutgoingHttpHeaders } from "http2";
import { IIndexable } from "../../types";

export type Responder = (res: Response) => void;

export function jsonResponse(statusCode: number, data?: IIndexable, headers?: OutgoingHttpHeaders): Responder {
  return (res: Response) => {
    if(headers)
      for(let h in headers)
        res.setHeader(h, (headers[h] as string) || "");
    res.status(statusCode).json(data);
  }
}