import { useMemo, useState, useEffect } from 'react';
import { UNIVERSITY_WEEK1_START } from './data';
import {computeTeachingWeek, capitalizeFirstLetter} from './ClassUtils';

function DashboardPage2({ classes, onAssignClass, onRemoveClass }) {
  const today = new Date();

  //test friday date
  const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7; // Calculate days until Friday
  const friday = new Date(today);
  friday.setDate(today.getDate() + daysUntilFriday); // Move to Friday
  friday.setHours(15, 30, 0, 0); // Set time to 3:30 PM
  const isoString = friday.toISOString(); // Convert to ISO string
  
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-11
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  
  const startWeek = UNIVERSITY_WEEK1_START;
  const [currentClass, setClass] = useState([]);
  // const [current, setCurrent] = useState(null);


  const currentWeek = computeTeachingWeek(startWeek);

  useEffect(() => {

    //Retreive currently runing class
    const getDashboardClass = async () => {
        try{
        //const response = await fetch(`${API_BASE_URL}/getClasses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id : 'LEC001', week: currentWeek, dashboard: true, session: "Autumn " + year, time: isoString }) }); //CHANGE ID AND WEEK TO DYNAMIC VAR
        const response = await fetch(`${API_BASE_URL}/getDashboardClass`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id : 'LEC001', week: 3, dashboard: true, session: "Autumn " + year, time: isoString }) }) //test to set Friday as current date
        if (!response.ok) {
            throw new Error('Server connection error');
        }
        const data = await response.json();
        setClass(data.class);
        console.log('Return data:', data.class);
        }

        catch (err) {
        console.error('Class retreival failed:', err)
        }
    }
    getDashboardClass();
      
  }, [] );
  

  //Calendar to be integrated with client systems (outlook, Google accounts, etc)
  const calendar = useMemo(() => buildCalendar(year, month, today), [year, month]);

  // const assignedClasses = classes.filter((cls) => cls.assigned);
  // const activeClasses = assignedClasses.length;
  // const totalStudents = assignedClasses.reduce(
  //   (sum, cls) => sum + cls.totalStudents,
  //   0,
  // );
  // const studentsPresent = assignedClasses.reduce(
  //   (sum, cls) => sum + Math.round(cls.totalStudents * cls.presentPercent),
  //   0,
  // );
  // const todayAttendancePct =
  //   totalStudents > 0 ? Math.round((studentsPresent / totalStudents) * 100) : 0;

  const handlePrevMonth = () => {
    setMonth((prev) => {
      if (prev === 0) {
        setYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setMonth((prev) => {
      if (prev === 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
  };

  const handleCloseRemoveModal = () => {
    setShowRemoveModal(false);
  };

  console.log('Current data:', currentClass);
  const present = currentClass.presentStudents;
  const absent = currentClass.totalStudents - present;
  const presentPct = Math.round(present / currentClass.totalStudents * 100) || 0;
  const absentPct = 100 - presentPct;

  return (
    <>
      <main
        className={`dashboard-main${
          showAddModal || showRemoveModal ? ' dashboard-main-blurred' : ''
        }`}
      >
        <section className="dashboard-header">
          <h2 className="dashboard-title">Dashboard</h2>
          <p className="dashboard-subtitle">
            Overview of current class attendance.
          </p>
        </section>

        <div className="dashboard-row-header">
          <h3 className="dashboard-panel-title">Key Attendance Metrics</h3>
          <div className="dashboard-classes-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              + Add
            </button>
            <button type="button" className="btn btn-secondary">
              Edit
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setShowRemoveModal(true)}
            >
              Remove
            </button>
          </div>
        </div>

        <section className="classes-stats-row">
        <article className="classes-stat-card">
          <h3 className="classes-stat-label">Students Present</h3>
          <p className="classes-stat-value">{present}</p>
          <p className="classes-stat-meta">
            {present} of {currentClass.totalStudents} ({presentPct}%)
          </p>
        </article>

        <article className="classes-stat-card">
          <h3 className="classes-stat-label">Students Absent</h3>
          <p className="classes-stat-value">{absent}</p>
          <p className="classes-stat-meta">
            {absent} of {currentClass.totalStudents} ({absentPct}%)
          </p>
        </article>

        <article className="classes-stat-card">
          <h3 className="classes-stat-label">Total Students</h3>
          <p className="classes-stat-value">{currentClass.totalStudents}</p>
          <p className="classes-stat-meta">Across this class</p>
        </article>
      </section>

        <h3 className="classes-chart-heading">Class Attendance Overview</h3>
        <section className="dashboard-main-row">
          <section className="classes-chart-row">
            <article className="classes-chart-panel">
              <div className="classes-week-header">
                <span className="classes-week-label-text">WEEK {currentWeek}</span>
                <div className="classes-week-divider" />
              </div>
              <div className="classes-chart-content">
                <div className="classes-pie-legend">
                  <div className="classes-pie-legend-item">
                    <span className="classes-pie-swatch present" />
                    <span className="classes-pie-legend-label">Present</span>
                    <span className="classes-pie-legend-number">{present}</span>
                    <span className="classes-pie-legend-separator">|</span>
                    <span className="classes-pie-legend-percent">{presentPct}%</span>
                  </div>
                  <div className="classes-pie-legend-item">
                    <span className="classes-pie-swatch absent" />
                    <span className="classes-pie-legend-label">Absent</span>
                    <span className="classes-pie-legend-number">{absent}</span>
                    <span className="classes-pie-legend-separator">|</span>
                    <span className="classes-pie-legend-percent">{absentPct}%</span>
                  </div>
                </div>
                <div className="classes-pie-wrapper">
                  <div
                    className="classes-pie"
                    style={{
                      backgroundImage: `conic-gradient(#4154F1 0 ${presentPct}%, #B31D2F ${presentPct}% 100%)`,
                    }}
                  />
                  <div className="classes-pie-center">
                    <span className="classes-pie-center-line">
                      Present {present} ({presentPct}%)
                    </span>
                    <span className="classes-pie-center-line">
                      Absent {absent} ({absentPct}%)
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </section>

          {/* Right: calendar */}
          <article className="dashboard-panel dashboard-calendar-panel">
            <header className="calendar-header">
              <button
                className="calendar-nav-button"
                type="button"
                onClick={handlePrevMonth}
              >
                ‹
              </button>
              <span className="calendar-month">
                {calendar.monthName} {year}
              </span>
              <button
                className="calendar-nav-button"
                type="button"
                onClick={handleNextMonth}
              >
                ›
              </button>
            </header>

            <div className="calendar-grid">
              {calendar.weekdays.map((label) => (
                <div key={label} className="calendar-weekday">
                  {label}
                </div>
              ))}

              {calendar.cells.map((cell) =>
                cell.day ? (
                  <button
                    key={cell.key}
                    type="button"
                    className={
                      cell.isToday ? 'calendar-day calendar-day-current' : 'calendar-day'
                    }
                  >
                    {cell.day}
                  </button>
                ) : (
                  <span key={cell.key} className="calendar-day calendar-day-empty" />
                ),
              )}
            </div>
          </article>
        </section>
      </main>

      {showAddModal && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div
            className="add-class-modal"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <header className="add-class-header">
              <div className="add-class-title-bar">
                <h2 className="add-class-title">Add Class</h2>
              </div>
              <p className="add-class-subtitle">
                Select a class to add to the dashboard
              </p>
            </header>

            <section className="add-class-table">
              <div className="add-class-table-header">
                <span>#</span>
                <span>Session</span>
                <span>Subject code</span>
                <span>Subject name</span>
                <span>Time slot</span>
                <span>Class type</span>
                <span />
              </div>

              {classes.map((cls, index) => {
                const disabled = cls.assigned;
                return (
                  <div key={cls.id} className="add-class-row">
                    <span className="add-class-index">{index + 1}</span>
                    <span>{cls.session}</span>
                    <span>{cls.subjectCode}</span>
                    <span>{cls.subjectName}</span>
                    <span>{cls.timeSlot}</span>
                    <span>{cls.classType}</span>
                    <button
                      type="button"
                      className={`add-class-row-button${
                        disabled ? ' add-class-row-button-disabled' : ''
                      }`}
                      disabled={disabled}
                      onClick={() => onAssignClass(cls.id)}
                    >
                      {disabled ? 'Added' : 'Add'}
                    </button>
                  </div>
                );
              })}
            </section>

            <div className="add-class-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showRemoveModal && (
        <div className="modal-backdrop" onClick={handleCloseRemoveModal}>
          <div
            className="add-class-modal remove-class-modal"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <header className="add-class-header">
              <div className="add-class-title-bar">
                <h2 className="add-class-title">Remove Class</h2>
              </div>
              <p className="add-class-subtitle">
                Select a class to remove from the dashboard
              </p>
            </header>

            <section className="add-class-table">
              <div className="add-class-table-header">
                <span>#</span>
                <span>Session</span>
                <span>Subject code</span>
                <span>Subject name</span>
                <span>Time slot</span>
                <span>Class type</span>
                <span />
              </div>

              {assignedClasses.map((cls, index) => (
                <div key={cls.id} className="add-class-row">
                  <span className="add-class-index">{index + 1}</span>
                  <span>{cls.session}</span>
                  <span>{cls.subjectCode}</span>
                  <span>{cls.subjectName}</span>
                  <span>{cls.timeSlot}</span>
                  <span>{cls.classType}</span>
                  <button
                    type="button"
                    className="remove-class-row-button"
                    onClick={() => onRemoveClass(cls.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </section>

            <div className="add-class-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseRemoveModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function buildCalendar(year, month, today) {
  const monthName = new Intl.DateTimeFormat('en', { month: 'long' }).format(
    new Date(year, month, 1),
  );

  const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const firstDay = new Date(year, month, 1);
  const jsWeekday = firstDay.getDay(); // 0 (Sun) - 6 (Sat)
  const mondayIndex = (jsWeekday + 6) % 7; // 0 (Mon) - 6 (Sun)

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  let keyCounter = 0;

  for (let i = 0; i < mondayIndex; i += 1) {
    cells.push({ key: `blank-${keyCounter++}`, day: null, isToday: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const isToday =
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();
    cells.push({ key: `day-${day}`, day, isToday });
  }

  // Fill to complete weeks (up to 6 weeks * 7 days)
  while (cells.length < 42) {
    cells.push({ key: `blank-${keyCounter++}`, day: null, isToday: false });
  }

  return { monthName, weekdays, cells };
}

export default DashboardPage2;

