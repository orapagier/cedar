/**
 * Finding a resident by name rather than by room.
 *
 * Every check in the dormitory is organised by room, because that is how the
 * rounds are walked. But a dean at the church door has a name in his hand, not
 * a room number, and making him remember which room a boy sleeps in before he
 * can mark him off is the wrong way round. A search runs across the whole
 * dormitory and steps in front of the room picker while it has something in it.
 */

/**
 * A name reduced to what matching should care about: no case, no accents, no
 * punctuation. "Acuña, Cris Jeiden C." and "acuna cris" fold to the same
 * letters, so a boy is findable without the comma or the ñ.
 */
const fold = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** What a search looks at, so a partial name, a room or an email all find him. */
export interface SearchableResident {
  name: string;
  roomNumber?: string;
  email?: string;
}

/**
 * Whether a resident answers to what was typed. Each word has to appear
 * somewhere, in any order, so "erlou budiongan" finds "Budiongan, Erlou T."
 * the same as "budiongan erlou" does. An empty search matches everyone.
 */
export const residentMatches = (resident: SearchableResident, query: string) => {
  const words = fold(query).split(' ').filter(Boolean);
  if (!words.length) return true;
  const haystack = fold([resident.name, resident.roomNumber ?? '', resident.email ?? ''].join(' '));
  return words.every(word => haystack.includes(word));
};

/** Room order first, then name — the order a dean reads a dormitory in. */
export const byRoomThenName = (a: SearchableResident, b: SearchableResident) =>
  String(a.roomNumber ?? '').localeCompare(String(b.roomNumber ?? ''), undefined, { numeric: true }) ||
  a.name.localeCompare(b.name);

/**
 * The residents a check should list: everyone matching the search while one is
 * running, and otherwise whoever the room picker settled on.
 */
export const listedResidents = <T extends SearchableResident>(
  query: string,
  everyone: T[],
  roomSelection: T[]
): T[] =>
  query.trim()
    ? everyone.filter(resident => residentMatches(resident, query)).sort(byRoomThenName)
    : roomSelection;
