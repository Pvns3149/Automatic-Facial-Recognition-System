// Central dummy data for the prototype UI.
// Backend can replace these with real API calls later.

// Teaching period start (Week 1 Monday) used for the My Classes page.
// Update this date to match the beginning of the current session.
export const UNIVERSITY_WEEK1_START = new Date(2026, 2, 2); // 2 March 2026 (Monday)

// Classes shown on the Dashboard and My Classes pages.
export const INITIAL_CLASSES = [
  {
    id: 'isit312',
    session: 'Spring 2025',
    subjectCode: 'ISIT312',
    subjectName: 'Big Data Management',
    timeSlot: 'MON 10.30 AM - 12.30 PM',
    classType: 'Laboratory',
    totalStudents: 35,
    presentPercent: 0.96,
    assigned: true,
  },
  {
    id: 'csci218',
    session: 'Spring 2025',
    subjectCode: 'CSCI218',
    subjectName: 'Foundations of Artificial Intelligence',
    timeSlot: 'THU 8.30 AM - 10.30 AM',
    classType: 'Lecture',
    totalStudents: 35,
    presentPercent: 0.92,
    assigned: true,
  },
  {
    id: 'csit214',
    session: 'Spring 2025',
    subjectCode: 'CSIT214',
    subjectName: 'IT Project Management',
    timeSlot: 'WED 10.30 AM - 12.30 PM',
    classType: 'Lecture',
    totalStudents: 35,
    presentPercent: 0.89,
    assigned: true,
  },
  {
    id: 'csit213',
    session: 'Spring 2025',
    subjectCode: 'CSIT213',
    subjectName: 'Java Programming',
    timeSlot: 'TUE 8.30 AM - 10.30 AM',
    classType: 'Lecture',
    totalStudents: 35,
    presentPercent: 0.9,
    assigned: false,
  },
];

// Students and their per‑week attendance on the Students page.
// `weeks` is a map: { [weekNumber]: 'present' | 'absent' }.
export const INITIAL_STUDENTS = [
  {
    id: '8469532',
    email: 'aaj296@uowmail.edu.au',
    name: 'Adel Al JASRY',
    weeks: { 1: 'present' },
  },
  {
    id: '9783210',
    email: 'pvs576@uowmail.edu.au',
    name: 'Puvennesan SANDRANESAN',
    weeks: { 1: 'present' },
  },
  {
    id: '8070799',
    email: 'aba456@uowmail.edu.au',
    name: 'Alyan Babar ALAM',
    weeks: { 1: 'absent' },
  },
  {
    id: '8123456',
    email: 'xyz123@uowmail.edu.au',
    name: 'Student FOUR',
    weeks: { 1: 'present' },
  },
];

