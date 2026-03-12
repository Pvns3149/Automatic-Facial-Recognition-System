import { useEffect, useMemo, useState } from 'react';
import { UNIVERSITY_WEEK1_START } from './data';

function MyClassesPage({ classes }) {
  const [selectedId, setSelectedId] = useState(classes[0]?.id ?? '');

  useEffect(() => {
    if (!classes.length) {
      setSelectedId('');
      return;
    }
    if (!classes.some((c) => c.id === selectedId)) {
      setSelectedId(classes[0].id);
    }
  }, [classes, selectedId]);

  if (!classes.length) {
    return (
      <main className="classes-main">
        <section className="classes-header">
          <h2 className="classes-title">My Classes</h2>
          <p className="classes-subtitle">
            No classes have been added from the dashboard yet.
          </p>
        </section>
      </main>
    );
  }

  const current = useMemo(
    () => classes.find((c) => c.id === selectedId) ?? classes[0],
    [classes, selectedId],
  );

  const present = Math.round(current.totalStudents * current.presentPercent);
  const absent = current.totalStudents - present;
  const presentPct = Math.round(current.presentPercent * 100);
  const absentPct = 100 - presentPct;

  const computeTeachingWeek = () => {
    const today = new Date();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const diffMs = today - UNIVERSITY_WEEK1_START;

    // If we're before the term starts, clamp to Week 1.
    if (diffMs <= 0) {
      return 1;
    }

    const diffWeeks = Math.floor(diffMs / weekMs);
    const rawWeek = diffWeeks + 1; // Week 1 during the first 7 days, Week 2 in the next 7, etc.

    // Counter goes up to Week 13 and then stays there.
    return rawWeek > 13 ? 13 : rawWeek;
  };

  const teachingWeek = computeTeachingWeek();

  return (
    <main className="classes-main">
      <section className="classes-header">
        <h2 className="classes-title">My Classes</h2>
        <p className="classes-subtitle">
          Select a class to view detailed attendance statistics.
        </p>
      </section>

      <section className="classes-select-row">
        <label htmlFor="class-select" className="classes-select-label">
          Class
        </label>
        <select
          id="class-select"
          className="classes-select"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {classes.map((cls) => {
            const name = `${cls.subjectCode} – ${cls.subjectName}`;
            return (
              <option key={cls.id} value={cls.id}>
                {name}
              </option>
            );
          })}
        </select>
      </section>

      <p className="classes-meta">
        <span className="classes-meta-name">
          {current.subjectCode} – {current.subjectName}
        </span>
        <span className="classes-meta-separator"> | </span>
        <span className="classes-meta-time">{current.timeSlot}</span>
      </p>

      <section className="classes-stats-row">
        <article className="classes-stat-card">
          <h3 className="classes-stat-label">Students Present</h3>
          <p className="classes-stat-value">{present}</p>
          <p className="classes-stat-meta">
            {present} of {current.totalStudents} ({presentPct}%)
          </p>
        </article>

        <article className="classes-stat-card">
          <h3 className="classes-stat-label">Students Absent</h3>
          <p className="classes-stat-value">{absent}</p>
          <p className="classes-stat-meta">
            {absent} of {current.totalStudents} ({absentPct}%)
          </p>
        </article>

        <article className="classes-stat-card">
          <h3 className="classes-stat-label">Total Students</h3>
          <p className="classes-stat-value">{current.totalStudents}</p>
          <p className="classes-stat-meta">Across this class</p>
        </article>
      </section>

      <h3 className="classes-chart-heading">Class Attendance Overview</h3>
      <section className="classes-chart-row">
        <article className="classes-chart-panel">
          <div className="classes-week-header">
            <span className="classes-week-label-text">WEEK {teachingWeek}</span>
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
                  backgroundImage: `conic-gradient(#3c458e 0 ${presentPct}%, #012970 ${presentPct}% 100%)`,
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
    </main>
  );
}

export default MyClassesPage;

