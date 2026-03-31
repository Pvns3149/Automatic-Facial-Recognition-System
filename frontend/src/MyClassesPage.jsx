import { use, useEffect, useState } from 'react';
import { UNIVERSITY_WEEK1_START } from './data';
import {computeTeachingWeek, ChangeClass} from './ClassUtils';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

function MyClassesPage() {
  const startWeek = UNIVERSITY_WEEK1_START;
  const [classes, setClasses] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [current, setCurrent] = useState(null);

  useEffect(() => {

    //Retreive all classes assigned to the user 
    const getClasses = async () => {
      try{
        const response = await fetch(`${API_BASE_URL}/getClasses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id : 'LEC001', week: 1 }) }); //CHANGE ID AND WEEK TO DYNAMIC VAR
        if (!response.ok) {
          throw new Error('Server connection error');
        }
        const data = await response.json();
        setClasses(data.classes);
        console.log('Return data:', data.classes);

        //Set default selected ID 
        if (data.classes.length > 0) {
          setSelectedId(data.classes[0].id);
        }
      }

      catch (err) {
        console.error('Class retreival failed:', err)
      }
    }
    getClasses();
    
  }, [] );

  

  useEffect(() => {
    setCurrent(ChangeClass(selectedId, classes));
  }, [classes, selectedId]);

  if (!classes.length || !current) {
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


  console.log('Current data:', current);
  console.log('Slected ID:', selectedId);
  const present = current.presentStudents;
  const absent = current.totalStudents - present;
  const presentPct = Math.round(present / current.totalStudents * 100) || 0;
  const absentPct = 100 - presentPct;

  const teachingWeek = computeTeachingWeek(startWeek);

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
            const name = `${cls.session} – ${cls.subjectCode} – ${cls.subjectName} – ${cls.timeSlot}`;
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
          {current.session} – {current.subjectCode} – {current.subjectName}
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
    </main>
  );
}

export default MyClassesPage;

