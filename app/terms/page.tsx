'use client';

const styles = {
  h2: { fontFamily: "var(--font-heading), sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--text)', marginTop: 32, marginBottom: 16 },
  p: { fontSize: 15, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 16 },
  ul: { fontSize: 15, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 16, paddingLeft: 24, listStyleType: 'disc' },
  li: { marginBottom: 8 }
};

export default function TermsAndConditions() {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '60px 24px', fontFamily: "var(--font-body), sans-serif" }}>
      <h1 style={{ fontFamily: "var(--font-heading), sans-serif", fontSize: 'clamp(32px, 5vw, 42px)', fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>
        Terms and Conditions
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: 40, fontSize: 16 }}>
        Last updated: September 2026
      </p>

      <div className="glass-card" style={{ padding: 'clamp(24px, 5vw, 40px)' }}>
        <p style={styles.p}>
          Welcome to <strong>Live Train Station</strong>. By accessing or using our website, you agree to comply with and be bound by the following terms and conditions. If you do not agree to these terms, please do not use our services.
        </p>

        <h2 style={styles.h2}>1. Nature of Service</h2>
        <p style={styles.p}>
          Live Train Station is an informational platform developed by DT Solution. We provide tools for users to check live train running status, PNR status, seat availability, and train schedules based on aggregated public data.
        </p>

        <h2 style={styles.h2}>2. Disclaimers and No Warranties</h2>
        <p style={styles.p}>
          Please note the following important disclaimers before using our platform:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}><strong>Not Affiliated:</strong> We are a private entity and are NOT affiliated with Indian Railways, IRCTC, CRIS, or any Government organization.</li>
          <li style={styles.li}><strong>Accuracy:</strong> All information provided on this site is retrieved from third-party sources. While we strive for accuracy, we do not guarantee that train timings, PNR statuses, or platform numbers are 100% accurate or up-to-date.</li>
          <li style={styles.li}><strong>Responsibility:</strong> Users are strongly advised to verify critical travel information through official IRCTC channels before their journey. We are not liable for any missed trains, financial losses, or inconveniences caused by data inaccuracies.</li>
        </ul>

        <h2 style={styles.h2}>3. Acceptable Use</h2>
        <p style={styles.p}>
          You agree to use this website only for lawful, personal, and non-commercial purposes. You may not:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}>Scrape, extract, or mine data from our APIs or web pages using automated scripts or bots.</li>
          <li style={styles.li}>Attempt to disrupt or overwhelm our servers with excessive requests.</li>
          <li style={styles.li}>Reverse engineer or attempt to copy our proprietary design and functionality.</li>
        </ul>

        <h2 style={styles.h2}>4. Intellectual Property</h2>
        <p style={styles.p}>
          The design, layout, graphics, and custom code of the Live Train Station website are the property of DT Solution. All railway station names, train names, and codes are properties of their respective authoritative bodies and are used here solely for informational purposes.
        </p>

        <h2 style={styles.h2}>5. Limitation of Liability</h2>
        <p style={styles.p}>
          In no event shall DT Solution, its developers, or affiliates be liable for any direct, indirect, incidental, special, or consequential damages arising out of or in connection with your use of the Live Train Station website or the inability to use it.
        </p>

        <h2 style={styles.h2}>6. Modifications to Terms</h2>
        <p style={styles.p}>
          We reserve the right to revise these terms at any time without notice. By using this website, you are agreeing to be bound by the then-current version of these Terms and Conditions.
        </p>
      </div>
    </div>
  );
}
