'use client';

const styles = {
  h2: { fontFamily: "var(--font-heading), sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--text)', marginTop: 32, marginBottom: 16 },
  p: { fontSize: 15, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 16 },
  ul: { fontSize: 15, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 16, paddingLeft: 24, listStyleType: 'disc' },
  li: { marginBottom: 8 }
};

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '60px 24px', fontFamily: "var(--font-body), sans-serif" }}>
      <h1 style={{ fontFamily: "var(--font-heading), sans-serif", fontSize: 'clamp(32px, 5vw, 42px)', fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>
        Privacy Policy
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: 40, fontSize: 16 }}>
        Last updated: September 2026
      </p>

      <div className="glass-card" style={{ padding: 'clamp(24px, 5vw, 40px)' }}>
        <p style={styles.p}>
          At <strong>Live Train Station</strong>, developed by DT Solution, we prioritize your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our website and services.
        </p>

        <h2 style={styles.h2}>1. Information We Collect</h2>
        <p style={styles.p}>
          Our core services (Live Train Tracking, PNR Status, etc.) do not require you to create an account or provide personally identifiable information (PII). We may collect non-personal identification information whenever you interact with our website. This may include:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}>Browser name and technical information about your means of connection.</li>
          <li style={styles.li}>Search queries (such as Train Numbers or PNRs) strictly to fetch and display the required data from our servers.</li>
          <li style={styles.li}>Anonymous usage statistics and analytics to improve our services.</li>
        </ul>

        <h2 style={styles.h2}>2. How We Use Information</h2>
        <p style={styles.p}>
          Any information we collect is used solely for the following purposes:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}>To provide and maintain the live tracking and PNR status services.</li>
          <li style={styles.li}>To improve our website's user experience based on aggregated usage data.</li>
          <li style={styles.li}>To debug issues and ensure the security of our platform.</li>
        </ul>

        <h2 style={styles.h2}>3. Data Sourcing and Third-Party Services</h2>
        <p style={styles.p}>
          Live Train Station aggregates publicly available data from third-party APIs related to Indian Railways. When you enter a PNR number or search for a train, that request is processed securely through our proxy servers. We do not permanently store your PNR numbers or travel histories.
        </p>

        <h2 style={styles.h2}>4. Cookies</h2>
        <p style={styles.p}>
          Our website may use "cookies" to enhance the user experience. Your web browser places cookies on your hard drive for record-keeping purposes and sometimes to track information. You can choose to set your browser to refuse cookies, though some parts of the site may not function properly.
        </p>

        <h2 style={styles.h2}>5. Changes to This Privacy Policy</h2>
        <p style={styles.p}>
          DT Solution has the discretion to update this privacy policy at any time. We encourage users to frequently check this page for any changes. You acknowledge and agree that it is your responsibility to review this privacy policy periodically.
        </p>

        <h2 style={styles.h2}>6. Contact Us</h2>
        <p style={styles.p}>
          If you have any questions about this Privacy Policy or your dealings with this site, please contact us through our official support channels provided by DT Solution.
        </p>
      </div>
    </div>
  );
}
