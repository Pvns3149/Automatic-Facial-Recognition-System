import { useMemo, useState } from 'react';

function DashboardPage({ classes, onAssignClass, onRemoveClass }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-11
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const calendar = useMemo(() => buildCalendar(year, month, today), [year, month]);

  const assignedClasses = classes.filter((cls) => cls.assigned);
  const activeClasses = assignedClasses.length;
  const totalStudents = assignedClasses.reduce(
    (sum, cls) => sum + cls.totalStudents,
    0,
  );
  const studentsPresent = assignedClasses.reduce(
    (sum, cls) => sum + Math.round(cls.totalStudents * cls.presentPercent),
    0,
  );
  const todayAttendancePct =
    totalStudents > 0 ? Math.round((studentsPresent / totalStudents) * 100) : 0;

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
            Overview of attendance, classes, and recent activity.
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

        <section className="dashboard-stats-row">
          <article className="dashboard-stat-card">
            <h3 className="dashboard-stat-label">Today&apos;s Attendance</h3>
            <p className="dashboard-stat-value">
              {todayAttendancePct}
              %
            </p>
            <p className="dashboard-stat-meta">Average across active classes</p>
          </article>

          <article className="dashboard-stat-card">
            <h3 className="dashboard-stat-label">Active Classes</h3>
            <p className="dashboard-stat-value">{activeClasses}</p>
            <p className="dashboard-stat-meta">Assigned to Alex Smith</p>
          </article>

          <article className="dashboard-stat-card">
            <h3 className="dashboard-stat-label">Students Present</h3>
            <p className="dashboard-stat-value">{studentsPresent}</p>
            <p className="dashboard-stat-meta">
              Present out of {totalStudents} students ({activeClasses} classes)
            </p>
          </article>
        </section>

        <section className="dashboard-main-row">
          {/* Left: attendance breakdown chart */}
          <article className="dashboard-panel dashboard-chart-panel">
            <h3 className="dashboard-panel-title">Week 3 Attendance Breakdown</h3>
            <div className="dashboard-chart-placeholder">
              <span className="dashboard-chart-text">
                Pie chart placeholder – share of Present / Late / Absent for Week 3
              </span>
            </div>
          </article>

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

export default DashboardPage;

