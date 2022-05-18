import { Cursor } from "mongodb";

export interface IPageInfo<T> {
  data: T[],
  numberOfPages: number;
  nextPage: number;
  previousPage: number;
}

export async function paginate<T>(
  list: Cursor,
  page: number = 1,
  size: number = 100
): Promise<IPageInfo<T>> {
  const skip = (page - 1) * size;
  const count = await list.count();
  const numberOfPages = Math.ceil(count / size);
  const nextPage = page >= numberOfPages
    ? 0
    : page + 1;
  const previousPage = page <= 1
    ? 0
    : page - 1;

    const data = await list
      .sort({ id: 1 })
      .skip(skip)
      .limit(size)
      .toArray() as T[];
    return { data, numberOfPages, nextPage, previousPage }
}