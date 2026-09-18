import { GatePassRecord } from '../types/dorm';

/**
 * The pass, if any, that authorises a resident to be off campus on a date.
 *
 * Whether the pass has been marked departed or already closed out does not
 * matter here — the question this answers is only whether leave was on file for
 * that day, which is exactly what an unauthorized-exit record denies.
 */
export const passCoveringDate = (
  passes: GatePassRecord[],
  studentId: string,
  date: string,
): GatePassRecord | undefined =>
  passes.find(
    p => p.studentId === studentId && p.departureDate <= date && p.expectedReturnDate >= date,
  );
