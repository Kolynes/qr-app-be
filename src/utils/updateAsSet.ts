export default function updateAsSet<T>(array: T[], ...newEntries: T[]): T[] {
  const set = new Set(array)
  const result = [] as T[];
  for(let newEntry of newEntries) set.add(newEntry);
  set.forEach(entry => result.push(entry))
  return result;
}