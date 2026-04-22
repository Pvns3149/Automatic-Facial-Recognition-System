
export const computeTeachingWeek = (startWeek, weekOfBreak) => {
    const today = new Date();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const diffMs = today - startWeek;

    // If we're before the term starts, clamp to Week 1.
    if (diffMs <= 0) {
      return 1;
    }

    const diffWeeks = Math.floor(diffMs / weekMs);
    var rawWeek = diffWeeks + 1; // Week 1 during the first 7 days, Week 2 in the next 7, etc.
    
    // Make computing teaching week "mid-session-break-aware"
    // e.g. If the 8th week is a break, should the current week be the 8th week, set the week to teaching week 7
    //      If the current week is the 9th week (after the break week), set the week to teaching week 8 etc
    if (rawWeek == weekOfBreak) {
      rawWeek = -1;
    } 
    else if (rawWeek > weekOfBreak) {
      rawWeek = rawWeek - 1;
    }

    // Counter goes up to Week 13 and then stays there.
    return rawWeek > 13 ? 13 : rawWeek;
  };


export function ChangeClass(selectedId, classes) {
    console.log('Current change process being called: ', selectedId, classes);
    // Update current whenever classes or selectedId changes
    const selectedClass = classes.find((c) => c.id === parseInt(selectedId)) ?? classes[0];
    return selectedClass;

}

export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }


//Find the number of unique weels available
export function getAvailableWeeks(students) {
  const weekSet = new Set();
  students.forEach((student) => {
    Object.keys(student.weeks || {}).forEach((weekKey) => {
      const parsedWeek = Number(weekKey);
      if (!Number.isNaN(parsedWeek) && parsedWeek > 0) {
        weekSet.add(parsedWeek);
      }
    });
  });
  return [...weekSet].sort((a, b) => a - b);
}


// Highest available week in the provided data.
export function getMaxAvailableWeek(students) {
  const weeks = getAvailableWeeks(students);
  return weeks.length ? weeks[weeks.length - 1] : 1;
}