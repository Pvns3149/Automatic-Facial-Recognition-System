import { useMemo, useState, useEffect } from 'react';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
// CLASS ID HANDLING NOT COMPLETERD, CURRENTLY HARDCODED TO CLASS 3
function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({
    studentId: '',
    name: '',
    week: '1',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  //Retreive all students assigned to the user
  useEffect(() => {console.log(appliedFilters);getStudents();}, [appliedFilters] );

  const activeWeek = appliedFilters.week 

  const filteredStudents = useMemo(() => {
    const idFilter = appliedFilters.studentId;
    const nameFilter = appliedFilters.name.trim().toLowerCase();

    return students.filter((student) => {
      if (idFilter && student.id !== idFilter) {
        return false;
      }
      if (nameFilter && !student.name.toLowerCase().includes(nameFilter)) {
        return false;
      }
      return true;
    });
  }, [students, appliedFilters]);

  const handleFilterChange = (field) => (event) => {
    const value = event.target.value;
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = (event) => {
    event.preventDefault();
    setAppliedFilters(filters);
  };

  const handleSetStatus = async (studentId, status) => {
    try{
      const response = await fetch(`${API_BASE_URL}/changeAttendance`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id : studentId, classId : 3, week: activeWeek, attending: status }) }); //CHANGE ID AND WEEK TO DYNAMIC VAR
      if (!response.ok) {
          throw new Error('Update failed');
      }
      else {
        alert(`Status for student ${studentId} updated to ${status} for week ${activeWeek}`);
      }
      // Refresh students after status change
      await getStudents(); 
    }   
    catch (err) {
      alert(err.message);
    }

  };

  //Get students based on given parameters
  const getStudents = async () => {
      try{
        const response = await fetch(`${API_BASE_URL}/getStudents`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id : appliedFilters.id, name : appliedFilters.name, classId : 3, week: appliedFilters.week }) }); //CHANGE ID AND WEEK TO DYNAMIC VAR
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

  return (
    <main className="students-main">
      <section className="students-header">
        <h2 className="students-title">Students</h2>
        <p className="students-subtitle">
          CSIT123 Spring 2025 | MON 8:30 AM - 10:30 AM
        </p>
      </section>

      <section className="students-filters">
        <form className="students-filters-form" onSubmit={handleApplyFilters}>
          <div className="students-filter-field">
            <label htmlFor="student-id" className="students-filter-label">
              Student ID
            </label>
            <select
              id="student-id"
              className="students-filter-select"
              value={filters.studentId}
              onChange={handleFilterChange('studentId')}
            >
              <option value="">All</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.id}
                </option>
              ))}
            </select>
          </div>

          <div className="students-filter-field students-filter-name-field">
            <label htmlFor="student-name" className="students-filter-label">
              Name
            </label>
            <textarea
              id="student-name"
              className="students-filter-textarea"
              rows={1}
              value={filters.name}
              onChange={handleFilterChange('name')}
              placeholder="Type a student name"
            />
          </div>

          <div className="students-filter-field">
            <label htmlFor="week-select" className="students-filter-label">
              Week
            </label>
            <select
              id="week-select"
              className="students-filter-select"
              value={filters.week}
              onChange={handleFilterChange('week')}
            >
              <option value="0">All Weeks</option>
              {Array.from({ length: 13 }).map((_, index) => {
                const weekNumber = index + 1;
                // if (weekNumber === 0) {
                //   return (
                //     <option key={weekNumber} value={weekNumber}>
                //       All Weeks
                //     </option>
                //   );
                // }else {
                  return (
                    <option key={weekNumber} value={weekNumber}>
                      Week {weekNumber}
                    </option>
                  );
                //}
              })}
            </select>
          </div>

          <div className="students-filter-actions">
            <button type="submit" className="btn btn-primary students-search-button">
              Search
            </button>
          </div>
        </form>
      </section>

      <section className="students-table">
        <div className="students-table-header">
          <span>#</span>
          <span>Student ID</span>
          <span>Email</span>
          <span>Name</span>
          <span>Week</span>
          <span className="students-status-column">Status</span>
        </div>

        {filteredStudents.map((student, index) => {
          const weeks = student.weeks || {};
          const status = weeks[activeWeek] || 'present';
          const isPresent = status === 'present';

          return (
            <div key={student.id} className="students-row">
              <span className="students-cell-index">{index + 1}</span>
              <span>{student.id}</span>
              <span>{student.email}</span>
              <span>{student.name}</span>
              <span>{`Week ${activeWeek}`}</span>
              <span className="students-status-buttons">
                <button
                  type="button"
                  className={`students-status-button students-status-absent${
                    !isPresent ? ' is-active' : ''
                  }`}
                  onClick={() => handleSetStatus(student.id, 'absent')}
                >
                  Absent
                </button>
                <button
                  type="button"
                  className={`students-status-button students-status-present${
                    isPresent ? ' is-active' : ''
                  }`}
                  onClick={() => handleSetStatus(student.id, 'present')}
                >
                  Present
                </button>
              </span>
            </div>
          );
        })}
      </section>
    </main>
  );
}

export default StudentsPage;

