import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import styles from "../css/Landing.module.css"

export default function Landing() {
  const route = useNavigate();

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap";
    link.rel = "stylesheet";
    link.id = "landing-font";
    document.head.appendChild(link);

    return () => {
      const el = document.getElementById("landing-font");
      if (el) document.head.removeChild(el);
    }
  }, []);

  const handleGetStarted = () => {
    let token = localStorage.getItem("token");
    if (token) {
      route("/home")
    } else {
      route("/auth")
    }
  }

  return (
    <div className={styles.homepage}>

      <nav className={styles.nav}>
        <div className={styles.logo} onClick={() => route("/")}>
          Open<span className={styles.accent}>Room</span>
        </div>
        <div className={styles.navLinks}>
          <button className={styles.navBtn} onClick={() => route("/auth")}>Login</button>
          <button className={`${styles.navBtn} ${styles.filled}`} onClick={() => route("/auth")}>Register</button>
        </div>
      </nav>

      <section className={styles.hero}>

        <div className={styles.badge}>
          <span className={styles.badgeDot}></span>
          Real-time video powered by WebRTC
        </div>

        <h1>Meet anyone,<br />
          <span className={styles.accent}>anywhere</span><br />
          <span className={styles.dim}>instantly.</span>
        </h1>

        <p className={styles.sub}>
          OpenRoom lets you start a video call in seconds. No downloads, no setup — just click and connect.
        </p>

        <button className={styles.btnMain} onClick={handleGetStarted}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          Get Started — It's Free
        </button>

        <p className={styles.hint}> Account required to join a call</p>

        <div className={styles.divider}>
          <div className={styles.dividerLine}></div>
          <div className={styles.dividerText}>what's inside</div>
          <div className={styles.dividerLine}></div>
        </div>

        <div className={styles.pills}>
          <div className={styles.pill}>
            <span className={styles.pillDot} style={{ background: '#c9a96e' }}></span>HD Video Calls
          </div>
          <div className={styles.pill}>
            <span className={styles.pillDot} style={{ background: '#1d9e75' }}></span>Real-time Chat
          </div>
          <div className={styles.pill}>
            <span className={styles.pillDot} style={{ background: '#d85a30' }}></span>Screen Sharing
          </div>
          <div className={styles.pill}>
            <span className={styles.pillDot} style={{ background: '#378add' }}></span>Multi-user Rooms
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerText}>OpenRoom — Built with React, Node.js & WebRTC</div>
        <div className={styles.footerText}>by Abhishek Rajpoot</div>
      </footer>

    </div>
  )
}