import { useEffect, useRef, useState } from 'react';

function ProfilePage({ API_BASE_URL }) {

const [educator, setEducator] = useState("");

    useEffect(() => {
        const getEducator = async () => {
            try{
            const response = await fetch(`${API_BASE_URL}/getEducator`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include' }); //CHANGE ID AND WEEK TO DYNAMIC VAR
            if (!response.ok) {
                throw new Error('Server connection error');
            }
            const data = await response.json();
            setEducator(data.educator);
            }catch (error) {
            console.error('Error fetching educator data:', error);
            }

        }

        getEducator();
    }, []);
    console.log('Educator data in ProfilePage:', educator);

  return (
    <main className="profile-main">
      <section className="profile-header">
        <h2 className="profile-title">Profile</h2>
        <p className="profile-subtitle">Tutor account information and contact details.</p>
      </section>

      <section className="profile-card">
        <div className="profile-avatar-column">
          <div className="profile-avatar-frame">
            <img
              src="./public/assets/profile-picture.png"
              className="profile-avatar"
            />
          </div>

        </div> 

        <div className="profile-details-column">
          <h3 className="profile-name">{educator.name}</h3>

          <div className="profile-details-grid">
            <article className="profile-detail-item">
              <span className="profile-detail-label">Email</span>
              <span className="profile-detail-value">{educator.email}</span>
            </article>
            <article className="profile-detail-item">
              <span className="profile-detail-label">Phone</span>
              <span className="profile-detail-value">{educator.phone}</span>
            </article>
            <article className="profile-detail-item">
              <span className="profile-detail-label">Staff ID</span>
              <span className="profile-detail-value">{educator.id}</span>
            </article>
            <article className="profile-detail-item">
              <span className="profile-detail-label">Faculty</span>
              <span className="profile-detail-value">{educator.faculty}</span>
            </article>
            <article className="profile-detail-item profile-detail-item-full">
              <span className="profile-detail-label">Office</span>
              <span className="profile-detail-value">{educator.location}</span>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}

export default ProfilePage;