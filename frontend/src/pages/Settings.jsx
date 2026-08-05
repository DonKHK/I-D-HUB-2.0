import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { DEFAULT_SETTINGS } from '../utils/constants';

// Row component for managing a single project's login credentials (PM + Owner)
// Each credential block (PM / Owner) has its own Generate + Save buttons.
function ProjectCredentialRow({ project, generateProjectCredentials, updateProjectCredentials }) {
  const [pmPassword, setPmPassword] = useState(project.pmPassword || '');
  const [ownerPassword, setOwnerPassword] = useState(project.ownerPassword || '');
  const [copied, setCopied] = useState(null); // 'pm-id' | 'pm-pw' | 'owner-id' | 'owner-pw' | 'saved-pm' | 'saved-owner' | null
  const [savingRole, setSavingRole] = useState(null); // 'pm' | 'owner' | null

  const pmLoginId = `${project.id}pm`;
  const ownerLoginId = `${project.id}owner`;

  const credentialBlockStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.75rem',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    background: '#fafafa',
    minWidth: '250px',
  };
  const credentialFieldRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  };
  const credentialLabelStyle = {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    marginBottom: '0.15rem',
  };

  const handleGenerate = (role) => {
    const creds = generateProjectCredentials(project.id);
    if (role === 'pm') {
      setPmPassword(creds.pmPassword);
    } else {
      setOwnerPassword(creds.ownerPassword);
    }
  };

  const handleSave = async (role) => {
    const pwd = role === 'pm' ? pmPassword : ownerPassword;
    if (!pwd.trim()) return;
    setSavingRole(role);
    await updateProjectCredentials(
      project.id,
      role === 'pm' ? { pmPassword: pwd.trim() } : { ownerPassword: pwd.trim() }
    );
    setSavingRole(null);
    setCopied(`saved-${role}`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopy = (text, key) => {
    if (text) {
      navigator.clipboard.writeText(text).catch(() => {});
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const copyBtn = (text, key, title) => (
    <button
      className="btn btn--secondary"
      style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', flexShrink: 0 }}
      onClick={() => handleCopy(text, key)}
      title={title}
      disabled={!text}
    >
      {copied === key ? '✓' : '📋'}
    </button>
  );

  const renderBlock = (role) => {
    const isPm = role === 'pm';
    const pwd = isPm ? pmPassword : ownerPassword;
    const loginId = isPm ? pmLoginId : ownerLoginId;
    const roleLabel = isPm ? 'PM' : 'Owner';

    return (
      <div style={credentialBlockStyle}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
          {isPm ? '👨‍💼 PM' : '👤 Owner'}
        </div>
        <div>
          <div style={credentialLabelStyle}>Login ID</div>
          <div style={credentialFieldRowStyle}>
            <input
              type="text"
              className="form-input"
              style={{ width: '150px', fontFamily: 'monospace', fontSize: '0.85rem' }}
              value={loginId}
              readOnly
            />
            {copyBtn(loginId, `${role}-id`, `Copy ${roleLabel} login ID`)}
          </div>
        </div>
        <div>
          <div style={credentialLabelStyle}>Password</div>
          <div style={credentialFieldRowStyle}>
            <input
              type="text"
              className="form-input"
              style={{ width: '150px', fontFamily: 'monospace', fontSize: '0.85rem' }}
              placeholder="Click Generate"
              value={pwd}
              readOnly
            />
            {copyBtn(pwd, `${role}-pw`, `Copy ${roleLabel} password`)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
          <button
            className="btn btn--primary"
            style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
            onClick={() => handleGenerate(role)}
          >
            Generate
          </button>
          <button
            className="btn btn--success"
            style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem', opacity: pwd && savingRole !== role ? 1 : 0.5 }}
            onClick={() => handleSave(role)}
            disabled={!pwd || savingRole === role}
          >
            {savingRole === role ? 'Saving...' : copied === `saved-${role}` ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <tr>
      <td><code>{project.id}</code></td>
      <td>{project.name || 'Untitled'}</td>
      <td>
        <span className={`status-badge status--${(project.status || 'Planning').toLowerCase().replace(/\s+/g, '-')}`}>
          {project.status || 'Planning'}
        </span>
      </td>
      <td>{renderBlock('pm')}</td>
      <td>{renderBlock('owner')}</td>
    </tr>
  );
}

export default function Settings() {
  const { settings, updateSettings, resetSettings, projects, generateProjectCredentials, updateProjectCredentials, backupAll, restoreBackup } = useData();
  const [saved, setSaved] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [restoreConfirm, setRestoreConfirm] = useState(false);
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [backupMsg, setBackupMsg] = useState('');
  const [restoreMsg, setRestoreMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleChange = (key, value) => {
    updateSettings({ [key]: value });
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetSettings();
    setResetConfirm(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleBackup = () => {
    const data = backupAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `idhub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMsg('Backup downloaded successfully!');
    setTimeout(() => setBackupMsg(''), 3000);
  };

  const handleRestoreFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreFile(file);
    setRestoreConfirm(true);
  };

  const handleRestore = async () => {
    if (!restoreFile) return;
    setRestoring(true);
    try {
      const text = await restoreFile.text();
      const data = JSON.parse(text);
      await restoreBackup(data);
      setRestoreMsg(`Restore completed successfully! Loaded ${data.projects?.length || 0} projects, ${data.ideas?.length || 0} ideas.`);
    } catch (err) {
      setRestoreMsg('Restore failed: invalid or unreadable backup file.');
    }
    setRestoring(false);
    setRestoreConfirm(false);
    setRestoreFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setRestoreMsg(''), 5000);
  };

  return (
    <div className="page">
      <div className="page-header-row" style={{ justifyContent: 'space-between' }}>
        <h1 className="page-title">⚙️ Settings</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn--danger-outline"
            onClick={() => setResetConfirm(true)}
          >
            Reset to Default
          </button>
          <button
            className="btn btn--primary"
            onClick={handleSave}
          >
            {saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>

      {saved && (
        <div className="alert alert--success" style={{ marginBottom: '1rem' }}>
          Settings saved successfully!
        </div>
      )}

      {resetConfirm && (
        <div className="alert alert--warning" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Are you sure you want to reset all settings to default?</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn--primary" onClick={handleReset}>Yes, Reset</button>
            <button className="btn btn--secondary" onClick={() => setResetConfirm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="settings-grid">
        {/* Overdue Thresholds */}
        <div className="settings-section card">
          <h2 className="settings-section-title">📅 Overdue Thresholds</h2>
          <p className="settings-section-desc">Set when a project is considered overdue or at risk.</p>

          <div className="form-group">
            <label className="form-label">
              Overdue Warning (days)
              <span className="form-hint">How many days before the deadline should a yellow warning appear</span>
            </label>
            <input
              type="number"
              className="form-input"
              min="0"
              max="365"
              value={settings.overdueWarningDays}
              onChange={(e) => handleChange('overdueWarningDays', Math.max(0, parseInt(e.target.value) || 0))}
            />
            <span className="form-caption">
              {settings.overdueWarningDays > 0
                ? `⚠️ Yellow alert when ${settings.overdueWarningDays} days before deadline`
                : '⚠️ Yellow alert disabled'}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">
              Overdue Critical (days)
              <span className="form-hint">How many days past the deadline before a red critical alert appears</span>
            </label>
            <input
              type="number"
              className="form-input"
              min="0"
              max="365"
              value={settings.overdueCriticalDays}
              onChange={(e) => handleChange('overdueCriticalDays', Math.max(0, parseInt(e.target.value) || 0))}
            />
            <span className="form-caption">
              {settings.overdueCriticalDays >= 0
                ? `🔴 Red alert when overdue by ${settings.overdueCriticalDays} days`
                : '🔴 Red alert on any overdue'}
            </span>
          </div>
        </div>

        {/* Budget Thresholds */}
        <div className="settings-section card">
          <h2 className="settings-section-title">💰 Budget Thresholds</h2>
          <p className="settings-section-desc">Set budget usage percentages for warnings and critical alerts.</p>

          <div className="form-group">
            <label className="form-label">
              Budget Warning (%)
              <span className="form-hint">At what percentage of budget used should a warning appear</span>
            </label>
            <div className="form-range-row">
              <input
                type="range"
                min="0"
                max="100"
                value={settings.budgetWarningPercent}
                onChange={(e) => handleChange('budgetWarningPercent', parseInt(e.target.value))}
              />
              <span className="form-range-value">{settings.budgetWarningPercent}%</span>
            </div>
            <span className="form-caption">
              🟡 Yellow alert at {settings.budgetWarningPercent}% budget usage
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">
              Budget Critical (%)
              <span className="form-hint">At what percentage of budget used should a critical red alert appear</span>
            </label>
            <div className="form-range-row">
              <input
                type="range"
                min="50"
                max="200"
                value={settings.budgetCriticalPercent}
                onChange={(e) => handleChange('budgetCriticalPercent', parseInt(e.target.value))}
              />
              <span className="form-range-value">{settings.budgetCriticalPercent}%</span>
            </div>
            <span className="form-caption">
              🔴 Red alert at {settings.budgetCriticalPercent}% budget usage
            </span>
          </div>
        </div>

        {/* Email Notification */}
        <div className="settings-section card">
          <h2 className="settings-section-title">📧 Email Notifications</h2>
          <p className="settings-section-desc">Configure email alerts for project status updates.</p>

          <div className="form-group">
            <label className="form-label">Enable Email Alerts</label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.emailEnabled}
                onChange={(e) => handleChange('emailEnabled', e.target.checked)}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">{settings.emailEnabled ? 'Enabled' : 'Disabled'}</span>
            </label>
          </div>

          {settings.emailEnabled && (
            <>
              <div className="form-group">
                <label className="form-label">
                  Email Recipients
                  <span className="form-hint">Comma-separated email addresses</span>
                </label>
                <textarea
                  className="form-input form-input--textarea"
                  rows="3"
                  placeholder="email1@example.com, email2@example.com"
                  value={settings.emailRecipients}
                  onChange={(e) => handleChange('emailRecipients', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Send When Overdue</label>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.emailOnOverdue}
                    onChange={(e) => handleChange('emailOnOverdue', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">{settings.emailOnOverdue ? 'Yes' : 'No'}</span>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Send When Budget Exceeded</label>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.emailOnBudgetExceeded}
                    onChange={(e) => handleChange('emailOnBudgetExceeded', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">{settings.emailOnBudgetExceeded ? 'Yes' : 'No'}</span>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Send Frequency</label>
                <select
                  className="form-input"
                  value={settings.emailFrequency}
                  onChange={(e) => handleChange('emailFrequency', e.target.value)}
                >
                  <option value="immediate">Immediate (real-time)</option>
                  <option value="daily">Daily Digest</option>
                  <option value="weekly">Weekly Summary</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Alert Colors */}
        <div className="settings-section card">
          <h2 className="settings-section-title">🎨 Alert Colors</h2>
          <p className="settings-section-desc">Customize the colors used for different project health levels.</p>

          <div className="form-color-row">
            <div className="form-group">
              <label className="form-label">Critical Color</label>
              <div className="form-color-picker">
                <input
                  type="color"
                  value={settings.alertCriticalColor}
                  onChange={(e) => handleChange('alertCriticalColor', e.target.value)}
                />
                <span className="form-color-value">{settings.alertCriticalColor}</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Warning Color</label>
              <div className="form-color-picker">
                <input
                  type="color"
                  value={settings.alertWarningColor}
                  onChange={(e) => handleChange('alertWarningColor', e.target.value)}
                />
                <span className="form-color-value">{settings.alertWarningColor}</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">On Track Color</label>
              <div className="form-color-picker">
                <input
                  type="color"
                  value={settings.alertSuccessColor}
                  onChange={(e) => handleChange('alertSuccessColor', e.target.value)}
                />
                <span className="form-color-value">{settings.alertSuccessColor}</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Completed Color</label>
              <div className="form-color-picker">
                <input
                  type="color"
                  value={settings.alertCompletedColor}
                  onChange={(e) => handleChange('alertCompletedColor', e.target.value)}
                />
                <span className="form-color-value">{settings.alertCompletedColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Report Prompt */}
        <div className="settings-section card" style={{ gridColumn: '1 / -1' }}>
          <h2 className="settings-section-title">🤖 AI Report Prompt</h2>
          <p className="settings-section-desc">
            Customize the prompt used by the AI analysis report. The idea details and scorecard JSON output
            requirement are automatically appended after your prompt.
          </p>

          <div className="form-group">
            <label className="form-label">
              AI Analysis Prompt
              <span className="form-hint">Edit the prompt to change how the AI evaluates ideas. Leave unchanged to use the default.</span>
            </label>
            <textarea
              className="form-input form-input--textarea"
              rows="12"
              style={{ fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}
              value={settings.aiPrompt || ''}
              onChange={(e) => handleChange('aiPrompt', e.target.value)}
              placeholder="Enter your custom AI analysis prompt..."
            />
          </div>
        </div>

        {/* Backup & Restore */}
        <div className="settings-section card" style={{ gridColumn: '1 / -1' }}>
          <h2 className="settings-section-title">💾 Backup & Restore</h2>
          <p className="settings-section-desc">
            Download a full system backup or restore from an existing backup file.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {backupMsg && (
              <div className="alert alert--success">{backupMsg}</div>
            )}
            {restoreMsg && (
              <div className={`alert ${restoreMsg.startsWith('Restore failed') ? 'alert--warning' : 'alert--success'}`}>
                {restoreMsg}
              </div>
            )}

            {restoreConfirm && (
              <div className="alert alert--warning" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <span>
                  Are you sure you want to restore from <strong>{restoreFile?.name}</strong>?
                  This will overwrite all current projects, ideas and settings.
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    className="btn btn--primary"
                    onClick={handleRestore}
                    disabled={restoring}
                  >
                    {restoring ? 'Restoring...' : 'Yes, Restore'}
                  </button>
                  <button
                    className="btn btn--secondary"
                    onClick={() => {
                      setRestoreConfirm(false);
                      setRestoreFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button className="btn btn--primary" onClick={handleBackup}>
                💾 Full System Backup
              </button>
              <button className="btn btn--secondary" onClick={() => fileInputRef.current?.click()}>
                📥 Restore Backup
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={handleRestoreFileChange}
              />
            </div>
          </div>
        </div>

        {/* Project Credentials (Super Admin only) */}
        <div className="settings-section card" style={{ gridColumn: '1 / -1' }}>
          <h2 className="settings-section-title">🔑 Project Credentials</h2>
          <p className="settings-section-desc">
            Generate and manage login credentials for project users. Each project has two logins — PM and Owner —
            both access the same project but are identified separately in the activity log.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ minWidth: '1150px' }}>
              <thead>
                <tr>
                  <th>Project ID</th>
                  <th>Project Name</th>
                  <th>Status</th>
                  <th>PM Credentials</th>
                  <th>Owner Credentials</th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                      No projects available yet.
                    </td>
                  </tr>
                ) : (
                  projects.map((project) => (
                    <ProjectCredentialRow
                      key={project.id}
                      project={project}
                      generateProjectCredentials={generateProjectCredentials}
                      updateProjectCredentials={updateProjectCredentials}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}