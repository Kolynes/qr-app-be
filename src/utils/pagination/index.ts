export function paginate(
  list: any[], 
  page: number = 1, 
  size: number = 100
): [any[], number, number, number] {
  const [skip, take, count] = [(page - 1) * size, page * size, list.length];
  const numberOfPages = Math.ceil(count / size);
  const nextPage = page >= numberOfPages
    ? 0
    : page + 1;
  const previousPage = page <= 1
    ? 0
    : page - 1;

  const data = list.slice(
    skip,
    take > list.length 
      ? list.length 
      : take
  );

  return [data, numberOfPages, nextPage, previousPage]
}