import { Response } from "express";
import { OutgoingHttpHeaders } from "http2";
import { IIndexable } from "../../types";

export type Responder = (res: Response) => void;

export function jsonResponse(payload: {
  status: number, 
  data?: any, 
  error?: JsonResponseError, 
  numberOfPages?: number,
  nextPage?: number,
  previousPage?: number,
  headers?: OutgoingHttpHeaders
}): Responder {
  const {headers, ...payloadWithOutHeader} = payload;
  return (res: Response) => {
    if(headers)
      for(let h in headers)
        res.setHeader(h, (headers[h] as string) || "");
    res.status(payload.status).json(payloadWithOutHeader);
  }
}

export class JsonResponseError {
  constructor(
    readonly summary: string,
    readonly fields?: IIndexable<string[]>
  ) {}
}