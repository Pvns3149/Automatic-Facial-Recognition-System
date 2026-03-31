
export const computeTeachingWeek = (startWeek) => {
    const today = new Date();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const diffMs = today - startWeek;

    // If we're before the term starts, clamp to Week 1.
    if (diffMs <= 0) {
      return 1;
    }

    const diffWeeks = Math.floor(diffMs / weekMs);
    const rawWeek = diffWeeks + 1; // Week 1 during the first 7 days, Week 2 in the next 7, etc.

    // Counter goes up to Week 13 and then stays there.
    return rawWeek > 13 ? 13 : rawWeek;
  };


export function ChangeClass(selectedId, classes) {
    console.log('Current change process being called: ', selectedId, classes);
    // Update current whenever classes or selectedId changes
    const selectedClass = classes.find((c) => c.id === parseInt(selectedId)) ?? classes[0];
    return selectedClass;

}