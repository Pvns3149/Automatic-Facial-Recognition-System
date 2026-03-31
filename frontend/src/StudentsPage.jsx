import { useMemo, useState, useEffect } from 'react';
import {ChangeClass, capitalizeFirstLetter} from './ClassUtils';

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
  const [classes, setClasses] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [current, setCurrent] = useState(null);
  
  //Change this to global
//   const [classList, setClassList] = useState([
//   {
//     "id": 3,
//     "session": "Autumn 2026",
//     "classType" :  "Lecture",
//     "subjectCode" : "CSCI323",
//     "subjectName" : "Modern Artificial Intelligence",
//     "timeSlot" : "2:30 PM - 4:30 PM",
//     "day" : "FRI"
//   },
//   {
//     "id": 1,
//     "session": "Spring 2025",
//     "classType": "Lecture",
//     "subjectCode": "ISIT312",
//     "subjectName": "Big Data Management",
//     "timeSlot": "4:30 PM - 6:30 PM",
//     "day": "TUE"
//   },
//   {
//     "id": 2,
//     "session": "Spring 2025",
//     "classType": "Tutorial",
//     "subjectCode": "ISIT312",
//     "subjectName": "Big Data Management",
//     "timeSlot": "10:30 AM - 12:30 PM",
//     "day": "MON"
    
//   }
//     // getClasses()
// ]);

//Get students based on given parameters
  const getStudents = async () => {
    
      try{
        console.log(current.id)
        const response = await fetch(`${API_BASE_URL}/getStudents`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id : appliedFilters.id, name : appliedFilters.name, classId : current?.id, week: appliedFilters.week }) }); //CHANGE ID AND WEEK TO DYNAMIC VAR
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

  useEffect(() => {
    getClasses()
  }, []);

  //Update classid selected
  useEffect(() => {
    setCurrent(ChangeClass(selectedId, classes));
  }, [selectedId, classes]);

  //Fetch Std list
  useEffect(() => {
    if (current) {
      console.log(appliedFilters);
      getStudents();
    }
  }, [appliedFilters, current]);


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
      const response = await fetch(`${API_BASE_URL}/changeAttendance`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id : studentId, classId : current?.id, week: activeWeek, attending: status }) }); //CHANGE ID AND WEEK TO DYNAMIC VAR
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

    //Default display if no classes assigned to user
  if (!classes.length ) {
    return (
      <main className="classes-main">
        <section className="classes-header">
          <h2 className="classes-title">Students</h2>
          <p className="classes-subtitle">
            No classes have been added from the dashboard yet.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="students-main">
      <section className="students-header">
        <h2 className="students-title">Students</h2>
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
              const name = `${cls.session} – ${cls.subjectCode} – ${cls.subjectName} – ${capitalizeFirstLetter(cls.day)} – ${cls.timeSlot}`;
              return (
                <option key={cls.id} value={cls.id}>
                  {name}
                </option>
              );
            })}
          </select>
        </section>
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

