import { useState } from 'react';

function SupportPage() {
  const [view, setView] = useState('contact'); // 'faqs' | 'contact'

  const showFaqs = (e) => {
    e.preventDefault();
    setView('faqs');
  };

  const showContact = (e) => {
    e.preventDefault();
    setView('contact');
  };

  return (
    <main className="support-main">
      <section className="support-title">
        <h2 className="support-heading">Help &amp; Support</h2>
        <div className="support-breadcrumb">
          <a
            href="#faqs"
            className={
              view === 'faqs'
                ? 'support-breadcrumb-link support-breadcrumb-active'
                : 'support-breadcrumb-link support-breadcrumb-muted'
            }
            onClick={showFaqs}
          >
            FAQs
          </a>
          <span>&nbsp;|&nbsp;</span>
          <a
            href="#contact"
            className={
              view === 'contact'
                ? 'support-breadcrumb-link support-breadcrumb-active'
                : 'support-breadcrumb-link support-breadcrumb-muted'
            }
            onClick={showContact}
          >
            Contact Support
          </a>
        </div>
      </section>

      {view === 'contact' ? (
        <section className="support-body">
          <SupportCard
            title="SYSTEM ADMINISTRATION CONTACTS"
            description="For general enquiries, account, or class-related concerns:"
            phone="0405 699 966"
            email="support-admin@uow.edu.au"
            address="Building 17, Northfields Avenue, Gwynneville, Wollongong NSW 2500"
          />

          <SupportCard
            title="MAINTENANCE TEAM CONTACTS"
            description="For bug reports and system-related issues:"
            phone="0402 456 789"
            email="support-maintenance@uow.edu.au"
            address="Building 17, Northfields Avenue, Gwynneville, Wollongong NSW 2500"
          />
        </section>
      ) : (
        <FaqSection />
      )}
    </main>
  );
}

function SupportCard({ title, description, phone, email, address }) {
  return (
    <article className="support-card">
      <header className="support-card-header">
        <div className="support-card-header-bar">{title}</div>
        <p className="support-card-description">{description}</p>
      </header>

      <div className="support-card-details">
        <div className="support-card-column support-card-column-keys">
          <div className="support-card-key">Support Phone</div>
          <div className="support-card-key">Support Email</div>
          <div className="support-card-key">Address</div>
        </div>
        <div className="support-card-divider" />
        <div className="support-card-column support-card-column-values">
          <div className="support-card-value">{phone}</div>
          <div className="support-card-value">{email}</div>
          <div className="support-card-value">{address}</div>
        </div>
      </div>
    </article>
  );
}

function FaqSection() {
  return (
    <section className="faq-body">
      <h3 className="faq-title">FAQs (Frequently Asked Questions)</h3>

      <div className="faq-item">
        <h4 className="faq-question">How do I reset my password?</h4>
        <p className="faq-answer">
          Go to your Profile page → Settings → Change Password. If you forgot your
          password, use the &quot;Forgot Password&quot; link on the login page.
        </p>
      </div>

      <div className="faq-item">
        <h4 className="faq-question">How can I update my personal details?</h4>
        <p className="faq-answer">
          Open the Profile page, tap &quot;Edit Profile,&quot; and update your
          information.
        </p>
      </div>

      <div className="faq-item">
        <h4 className="faq-question">Why can&apos;t I see my classes?</h4>
        <p className="faq-answer">
          Make sure you are enrolled and logged in with the correct account.
          Contact support if the issue continues.
        </p>
      </div>

      <div className="faq-item">
        <h4 className="faq-question">
          Where can I find my analytics or reports?
        </h4>
        <p className="faq-answer">
          Navigate to the Dashboard → Analytics tab to view weekly or overall
          reports.
        </p>
      </div>

      <div className="faq-item">
        <h4 className="faq-question">
          What should I do if I find a technical issue?
        </h4>
        <p className="faq-answer">
          Take a screenshot of the error and send it through the Contact Support
          section below.
        </p>
      </div>

      <div className="faq-divider" />
    </section>
  );
}

export default SupportPage;

