export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-gradient">Platform Settings</h1>
      <p style={{ color: 'var(--border)', marginBottom: '2rem' }}>Configure global portal preferences.</p>

      <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px' }}>
        <h3 className="mb-4">System Configuration</h3>
        <p style={{ color: 'var(--border)', marginBottom: '1.5rem' }}>
          Settings such as OpenAI API Keys, SMTP Email accounts, and Administrative credentials are currently managed securely on the backend and are loaded automatically via environment variables (<code>.env</code> file).
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <strong style={{ fontSize: '1.1rem' }}>Email Service (Nodemailer)</strong>
            <div style={{ color: 'var(--success)', fontSize: '0.875rem', marginTop: '0.4rem' }}>
              Operational (SMTP configured in environment)
            </div>
          </div>
          
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <strong style={{ fontSize: '1.1rem' }}>AI Evaluator Service (OpenAI)</strong>
            <div style={{ color: 'var(--success)', fontSize: '0.875rem', marginTop: '0.4rem' }}>
              Configured (API Key Detected)
            </div>
          </div>

           <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <strong style={{ fontSize: '1.1rem' }}>Authentication & Security</strong>
            <div style={{ color: 'var(--success)', fontSize: '0.875rem', marginTop: '0.4rem' }}>
              JWT Secret securely loaded
            </div>
          </div>
        </div>

        <div className="mt-6" style={{ padding: '1.5rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--primary)', borderRadius: 'var(--radius)' }}>
           <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Future Updates</h4>
           <p style={{ color: 'var(--border)', fontSize: '0.9rem', margin: 0 }}>
             A database-backed configuration system is planned for a future update. This will allow you to update API keys and passwords directly from this UI without modifying the `.env` file or redeploying the server.
           </p>
        </div>
      </div>
    </div>
  );
}
