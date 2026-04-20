import { useMemo, useRef, useState } from 'react';
import { getAvailableWeeks, getMaxAvailableWeek } from './services/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Converts polar coordinates (angle + radius) to x/y point on SVG canvas.
function polarToCartesian(cx, cy, r, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy + r * Math.sin(angleInRadians),
  };
}

// Creates an SVG path string for a filled pie slice between two angles.
function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

// Builds a smooth cubic-bezier line path through all chart points.
function buildSmoothPath(points) {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const controlX = (p1.x + p2.x) / 2;
    path += ` C ${controlX} ${p1.y}, ${controlX} ${p2.y}, ${p2.x} ${p2.y}`;
  }
  return path;
}

function AnalyticsPage() {
  // Points to the DOM area that we capture for PDF export.
  const reportContentRef = useRef(null);
  // Used to disable the report button and show loading text while exporting.
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  //Student data holder
  const [students, setStudents] = useState([]);

  //Student data holder
  const [classes, setClasses] = useState([])

  // Filter selections that drive the chart and table content.
  const [filters, setFilters] = useState({
    session: '',
    classId: '',
    timeSlot: '',
    week: '3',
  });

  //Get all student attendance for analytics page
  const getStudentAnalytics = async () => {
  
    try{
      console.log(current.id)
      const response = await fetch(`${API_BASE_URL}/getStudentAnalytics`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id : 'LEC001', classId : 1, week: filters.week }) }); //CHANGE ID AND WEEK TO DYNAMIC VAR
      if (!response.ok) {
        throw new Error('Server connection error');
      }
      const data = await response.json();
      setStudents(data.students);
      console.log('Return data:', data.students);

    }

    catch (err) {
      console.error('Class retreival failed:', err)
    }
  };

  const getClasses = async () => {
    try{
      const response = await fetch(`${API_BASE_URL}/getClasses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id : 'LEC001', week: filters.week }) }); //CHANGE ID AND WEEK TO DYNAMIC VAR
      if (!response.ok) {
        throw new Error('Server connection error');
      }
      const data = await response.json();
      setClasses(data.classes);
      console.log('Return data:', data.classes);

    }

    catch (err) {
      console.error('Class retreival failed:', err)
    }
  }


  // Collect all weeks that exist in student attendance data.
  const allAvailableWeeks = useMemo(() => getAvailableWeeks(students), [students]);
  const fallbackWeek = allAvailableWeeks[0] ?? 1;

  // "All Weeks" switches the UI from pie chart to line chart.
  const isAllWeeks = filters.week === 'all';
  // Active week used for weekly pie chart and weekly attendance counts.
  const week = isAllWeeks
    ? fallbackWeek
    : Number(filters.week) || fallbackWeek;

  // Dropdown options for Session filter.
  const sessionOptions = useMemo(
    () => Array.from(new Set(classes.map((cls) => cls.session))),
    [classes],
  );

  // Class dropdown depends on selected session.
  const classOptions = useMemo(
    () =>
      classes.filter((cls) => !filters.session || cls.session === filters.session),
    [classes, filters.session],
  );

  // Time dropdown depends on selected session/class.
  const timeSlotOptions = useMemo(
    () =>
      Array.from(
        new Set(
          classOptions
            .filter((cls) => !filters.classId || cls.id === filters.classId)
            .map((cls) => cls.timeSlot),
        ),
      ),
    [classOptions, filters.classId],
  );

  // Build quick lookup map so we can show class details for each student row.
  const classById = useMemo(
    () => Object.fromEntries(classes.map((cls) => [cls.id, cls])),
    [classes],
  );

  // Apply all current filters to the student list.
  const filteredStudents = useMemo(
    () =>
      students.filter((student) => {
        const cls = classById[student.classId];
        if (!cls) return false;
        if (filters.session && cls.session !== filters.session) return false;
        if (filters.classId && student.classId !== filters.classId) return false;
        if (filters.timeSlot && cls.timeSlot !== filters.timeSlot) return false;
        return true;
      }),
    [students, classById, filters],
  );

  // Present/Absent counts used by the weekly pie chart.
  const chartStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    filteredStudents.forEach((student) => {
      const status = student.weeks?.[week] || 'present';
      if (status === 'absent') {
        absent += 1;
      } else {
        present += 1;
      }
    });
    const total = present + absent;
    const presentPct = total ? Math.round((present / total) * 100) : 0;
    const absentPct = total ? 100 - presentPct : 0;
    return { present, absent, total, presentPct, absentPct };
  }, [filteredStudents, week]);

  // Table rows with calculated attendance percentage per student.
  const studentRows = useMemo(
    () =>
      filteredStudents.map((student) => {
        const missed = Object.values(student.weeks || {}).filter(
          (status) => status === 'absent',
        ).length;
        // Use tracked data range instead of fixed denominator.
        const trackedWeeks = Math.max(getMaxAvailableWeek([student]), 1);
        const attended = Math.max(trackedWeeks - missed, 0);
        const percentage = Math.round((attended / trackedWeeks) * 100);
        return { ...student, percentage };
      }),
    [filteredStudents],
  );

  // For line chart: weekly present/absent totals across all available weeks.
  const weeklyLineStats = useMemo(() => {
    return allAvailableWeeks.map((weekNumber) => {
      let present = 0;
      let absent = 0;
      filteredStudents.forEach((student) => {
        const status = student.weeks?.[weekNumber] || 'present';
        if (status === 'absent') {
          absent += 1;
        } else {
          present += 1;
        }
      });
      return { week: weekNumber, present, absent };
    });
  }, [filteredStudents, allAvailableWeeks]);

  // Precomputes chart dimensions, points, smooth paths, and y-axis ticks.
  const lineChartGeometry = useMemo(() => {
    const width = 880;
    const height = 280;
    const padLeft = 46;
    const padRight = 22;
    const padTop = 20;
    const padBottom = 34;
    const plotWidth = width - padLeft - padRight;
    const plotHeight = height - padTop - padBottom;

    const maxY = Math.max(
      1,
      ...weeklyLineStats.flatMap((point) => [point.present, point.absent]),
    );

    const presentPoints = weeklyLineStats.map((point, index) => ({
      x:
        padLeft +
        (index / Math.max(weeklyLineStats.length - 1, 1)) * plotWidth,
      y: padTop + (1 - point.present / maxY) * plotHeight,
      week: point.week,
      value: point.present,
    }));

    const absentPoints = weeklyLineStats.map((point, index) => ({
      x:
        padLeft +
        (index / Math.max(weeklyLineStats.length - 1, 1)) * plotWidth,
      y: padTop + (1 - point.absent / maxY) * plotHeight,
      week: point.week,
      value: point.absent,
    }));

    const yTicks = Array.from({ length: Math.min(maxY + 1, 6) }, (_, i) =>
      Math.round((maxY * i) / Math.max(Math.min(maxY, 5), 1)),
    );

    return {
      width,
      height,
      padLeft,
      padBottom,
      plotHeight,
      maxY,
      yTicks: [...new Set(yTicks)],
      presentPoints,
      absentPoints,
      presentPath: buildSmoothPath(presentPoints),
      absentPath: buildSmoothPath(absentPoints),
    };
  }, [weeklyLineStats]);

  // Generic filter updater with dependent reset logic.
  // Example: changing session resets class + time.
  const handleFilterChange = (field) => (event) => {
    const value = event.target.value;
    setFilters((prev) => {
      if (field === 'session') {
        return { ...prev, session: value, classId: '', timeSlot: '' };
      }
      if (field === 'classId') {
        return { ...prev, classId: value, timeSlot: '' };
      }
      return { ...prev, [field]: value };
    });
  };

  // Captures the currently shown report section and exports it as PDF.
  // Includes active chart (pie OR line based on filters) and student table.
  const handleGenerateReport = async () => {
    if (!reportContentRef.current || isGeneratingReport) return;

    try {
      setIsGeneratingReport(true);

      const canvas = await html2canvas(reportContentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f0f4fb',
      });

      const imageData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

      // Fit captured image to PDF width and paginate if content is tall.
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const renderWidth = pageWidth - margin * 2;
      const renderHeight = (canvas.height * renderWidth) / canvas.width;
      const printableHeight = pageHeight - margin * 2;

      let heightLeft = renderHeight;
      let yPosition = margin;

      pdf.addImage(imageData, 'PNG', margin, yPosition, renderWidth, renderHeight);
      heightLeft -= printableHeight;

      while (heightLeft > 0) {
        pdf.addPage();
        yPosition = margin - (renderHeight - heightLeft);
        pdf.addImage(imageData, 'PNG', margin, yPosition, renderWidth, renderHeight);
        heightLeft -= printableHeight;
      }

      const selectedWeekLabel = isAllWeeks ? 'all-weeks' : `week-${week}`;
      const fileName = `attendance-report-${selectedWeekLabel}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      // Keep visible for debugging if report generation fails.
      console.error('Failed to generate report PDF:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <main className="analytics-main">
      <section className="analytics-header">
        <h2 className="analytics-title">Analytics</h2>
        <p className="analytics-subtitle">
          Attendance stats by session, class, time, and week.
        </p>
      </section>

      <section className="analytics-filters">
        {/* Session filter */}
        <div className="analytics-filter-field">
          <label htmlFor="analytics-session">Session</label>
          <select
            id="analytics-session"
            value={filters.session}
            onChange={handleFilterChange('session')}
          >
            <option value="">All sessions</option>
            {sessionOptions.map((session) => (
              <option key={session} value={session}>
                {session}
              </option>
            ))}
          </select>
        </div>

        {/* Class filter */}
        <div className="analytics-filter-field">
          <label htmlFor="analytics-class">Class</label>
          <select
            id="analytics-class"
            value={filters.classId}
            onChange={handleFilterChange('classId')}
          >
            <option value="">All classes</option>
            {classOptions.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.subjectCode} - {cls.subjectName}
              </option>
            ))}
          </select>
        </div>

        {/* Time filter */}
        <div className="analytics-filter-field">
          <label htmlFor="analytics-time">Time</label>
          <select
            id="analytics-time"
            value={filters.timeSlot}
            onChange={handleFilterChange('timeSlot')}
          >
            <option value="">All times</option>
            {timeSlotOptions.map((timeSlot) => (
              <option key={timeSlot} value={timeSlot}>
                {timeSlot}
              </option>
            ))}
          </select>
        </div>

        {/* Week / All Weeks filter */}
        <div className="analytics-filter-field">
          <label htmlFor="analytics-week">Week</label>
          <select
            id="analytics-week"
            value={filters.week}
            onChange={handleFilterChange('week')}
          >
            <option value="all">All Weeks</option>
            {allAvailableWeeks.map((weekNumber) => {
              return (
                <option key={weekNumber} value={String(weekNumber)}>
                  Week {weekNumber}
                </option>
              );
            })}
          </select>
        </div>

        {/* Exports current analytics view to PDF */}
        <div className="analytics-filter-field analytics-report-field">
          <span className="analytics-report-label">Action</span>
          <button
            type="button"
            className="btn btn-primary analytics-generate-button"
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
          >
            {isGeneratingReport ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </section>

      {/* Everything in this container is included in exported PDF */}
      <div ref={reportContentRef} className="analytics-report-content">
        {/* Show weekly pie chart only when a specific week is selected */}
        {!isAllWeeks && (
          <section className="analytics-chart-card">
            <h3>Weekly Attendance Distribution</h3>
            <p className="analytics-chart-meta">
              Total students: {chartStats.total} | Week {week}
            </p>
            <div className="analytics-chart-content">
              {/* SVG pie is used (instead of CSS gradient) for reliable PDF capture */}
              <svg
                className="analytics-pie"
                viewBox="0 0 160 160"
                role="img"
                aria-label={`Present ${chartStats.presentPct} percent, absent ${chartStats.absentPct} percent`}
              >
                {/* Base full circle (absent) */}
                <circle cx="80" cy="80" r="80" fill="#b91c1c" />

                {/* Overlay present slice; edge cases 0% and 100% are handled explicitly */}
                {chartStats.presentPct > 0 && chartStats.presentPct < 100 && (
                  <path
                    d={describeArc(80, 80, 80, 0, (chartStats.presentPct / 100) * 360)}
                    fill="#3c458e"
                  />
                )}
                {chartStats.presentPct === 100 && (
                  <circle cx="80" cy="80" r="80" fill="#3c458e" />
                )}
              </svg>
              <div className="analytics-legend">
                <p>
                  <span className="analytics-dot analytics-dot-present" />
                  Present: {chartStats.present} ({chartStats.presentPct}%)
                </p>
                <p>
                  <span className="analytics-dot analytics-dot-absent" />
                  Absent: {chartStats.absent} ({chartStats.absentPct}%)
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Show trend line chart only when "All Weeks" is selected */}
        {isAllWeeks && (
          <section className="analytics-line-card">
            <h3>All Weeks Attendance Trend</h3>
            <p className="analytics-chart-meta">Curved lines for present vs absent</p>
            <div className="analytics-line-chart-wrap">
              <svg
                className="analytics-line-chart"
                viewBox={`0 0 ${lineChartGeometry.width} ${lineChartGeometry.height}`}
                role="img"
                aria-label="Present and absent students by week"
              >
                {/* Horizontal grid + y-axis labels */}
                {lineChartGeometry.yTicks.map((tick) => {
                  const y =
                    20 +
                    (1 - tick / lineChartGeometry.maxY) * lineChartGeometry.plotHeight;
                  return (
                    <g key={tick}>
                      <line
                        x1={lineChartGeometry.padLeft}
                        y1={y}
                        x2={lineChartGeometry.width - 22}
                        y2={y}
                        className="analytics-grid-line"
                      />
                      <text
                        x={lineChartGeometry.padLeft - 10}
                        y={y + 4}
                        className="analytics-axis-label"
                      >
                        {tick}
                      </text>
                    </g>
                  );
                })}

                {/* Curved present/absent lines */}
                <path
                  d={lineChartGeometry.presentPath}
                  className="analytics-line-present"
                />
                <path
                  d={lineChartGeometry.absentPath}
                  className="analytics-line-absent"
                />

                {/* Data points on each line */}
                {lineChartGeometry.presentPoints.map((point) => (
                  <circle
                    key={`p-${point.week}`}
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    className="analytics-point-present"
                  />
                ))}
                {lineChartGeometry.absentPoints.map((point) => (
                  <circle
                    key={`a-${point.week}`}
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    className="analytics-point-absent"
                  />
                ))}

                {/* X-axis week labels */}
                {weeklyLineStats.map((point, index) => {
                  const x =
                    lineChartGeometry.padLeft +
                    (index / Math.max(weeklyLineStats.length - 1, 1)) *
                      (lineChartGeometry.width - lineChartGeometry.padLeft - 22);
                  return (
                    <text
                      key={`x-${point.week}`}
                      x={x}
                      y={lineChartGeometry.height - lineChartGeometry.padBottom + 18}
                      className="analytics-axis-label"
                      textAnchor="middle"
                    >
                      W{point.week}
                    </text>
                  );
                })}
              </svg>
            </div>

            <div className="analytics-line-legend">
              <span>
                <i className="analytics-line-legend-dot present" />
                Present
              </span>
              <span>
                <i className="analytics-line-legend-dot absent" />
                Absent
              </span>
            </div>
          </section>
        )}

        {/* Filtered student table with attendance progress bar */}
        <section className="analytics-table">
          <div className="analytics-table-header">
            <span>#</span>
            <span>Student ID</span>
            <span>Name</span>
            <span>Email</span>
            <span>Class</span>
            <span>Attendance %</span>
          </div>
          {studentRows.map((student, index) => {
            const cls = classById[student.classId];
            return (
              <div key={student.id} className="analytics-table-row">
                <span>{index + 1}</span>
                <span>{student.id}</span>
                <span>{student.name}</span>
                <span>{student.email}</span>
                <span>{cls ? cls.subjectCode : '-'}</span>
                <span className="analytics-percentage-cell">
                  <span className="analytics-progress-track">
                    <span
                      className="analytics-progress-fill"
                      style={{ width: `${student.percentage}%` }}
                    />
                  </span>
                  <span className="analytics-progress-value">{student.percentage}%</span>
                </span>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}

export default AnalyticsPage;