
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Dashboard() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [inquiries, setInquiries] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function fetchInquiries() {
    try {
      const response = await fetch("http://localhost:3000/inquiries", {
        credentials: "include",
      });

      const data = await response.json();

      if (response.status === 401) {
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch inquiries");
      }

      setInquiries(data.Allinquiry);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInquiries();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);

    try {
      const response = await fetch("http://localhost:3000/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name, message }),
      });

      const data = await response.json();

      if (response.status === 401) {
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to create inquiry");
      }

      setName("");
      setMessage("");
      setNotice("Inquiry submitted successfully!");
      await fetchInquiries();
    } catch (err) {
      setError(err.message || "Failed to submit inquiry");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      const response = await fetch("http://localhost:3000/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      navigate("/login");
    } catch (err) {
      setError(err.message || "Could not log out");
    }
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div className="brand">
          <div className="brand-mark">B</div>
          <div>
            <div className="brand-name">Briefly</div>
            <div className="brand-caption">Business workspace</div>
          </div>
        </div>

        <button className="secondary-btn" onClick={handleLogout}>
          Log out ↗
        </button>
      </header>

      <section className="welcome-section">
        <p className="eyebrow">YOUR WORKSPACE</p>
        <h1>Business inquiries</h1>
        <p className="dashboard-subtitle">
          Send a new inquiry and keep track of your messages in one place.
        </p>
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <p className="eyebrow">NEW MESSAGE</p>
          <h2>Submit an inquiry</h2>
          <p className="panel-description">
            Tell us what you need. Your inquiry will be saved to your account.
          </p>

          <form className="inquiry-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="inquiry-name">Your name</label>
              <input
                id="inquiry-name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="inquiry-message">Message</label>
              <textarea
                id="inquiry-message"
                placeholder="How can we help you?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <button className="primary-btn" type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Send inquiry →"}
            </button>
          </form>

          {notice && <p className="status-message">{notice}</p>}
          {error && <p className="error-message">{error}</p>}
        </section>

        <section className="panel">
          <div className="list-heading">
            <div>
              <p className="eyebrow">YOUR MESSAGES</p>
              <h2>My inquiries</h2>
            </div>
            <span className="count-badge">{inquiries.length}</span>
          </div>

          <p className="panel-description">
            Only inquiries associated with your account are shown here.
          </p>

          {loading ? (
            <div className="empty-state">Loading your inquiries...</div>
          ) : inquiries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✦</div>
              <h3>No inquiries yet</h3>
              Your submitted inquiries will appear here.
            </div>
          ) : (
            <div className="inquiry-list">
              {inquiries.map((inquiry) => (
                <article className="inquiry-card" key={inquiry._id}>
                  <div className="inquiry-card-top">
                    <span className="inquiry-dot" />
                    <span className="inquiry-label">INQUIRY</span>
                  </div>

                  <h3>{inquiry.name}</h3>
                  <p>{inquiry.message}</p>

                  <small className="inquiry-date">
                    {inquiry.createdAt
                      ? new Date(inquiry.createdAt).toLocaleString()
                      : "Recently submitted"}
                  </small>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <footer className="dashboard-footer">
        Briefly · Your business workspace
      </footer>
    </main>
  );
}

export default Dashboard;
