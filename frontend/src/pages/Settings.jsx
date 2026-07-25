import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { DEFAULT_SETTINGS } from '../utils/constants';

export default function Settings() {
  const { settings, updateSettings, resetSettings } = useData();
  const [saved, setSaved] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

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

        {/* Health Score Weights */}
        <div className="settings-section card">
          <h2 className="settings-section-title">📊 Health Score Weights</h2>
          <p className="settings-section-desc">Adjust the impact of date and budget on the project health score.</p>

          <div className="form-group">
            <label className="form-label">
              Date Weight
              <span className="form-hint">Impact of deadline/overdue on health score</span>
            </label>
            <div className="form-range-row">
              <input
                type="range"
                min="0"
                max="3"
                step="0.5"
                value={settings.healthWeightDate}
                onChange={(e) => handleChange('healthWeightDate', parseFloat(e.target.value))}
              />
              <span className="form-range-value">{settings.healthWeightDate}x</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Budget Weight
              <span className="form-hint">Impact of budget usage on health score</span>
            </label>
            <div className="form-range-row">
              <input
                type="range"
                min="0"
                max="3"
                step="0.5"
                value={settings.healthWeightBudget}
                onChange={(e) => handleChange('healthWeightBudget', parseFloat(e.target.value))}
              />
              <span className="form-range-value">{settings.healthWeightBudget}x</span>
            </div>
          </div>
        </div>

        {/* Alert Colors */}
        <div className="settings-section card">
          <h2 className="settings-section-title">🎨 Alert Colors</h2>
          <p className="settings-section-desc">Customize the colors used for different severity levels.</p>

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
              <label className="form-label">Info Color</label>
              <div className="form-color-picker">
                <input
                  type="color"
                  value={settings.alertInfoColor}
                  onChange={(e) => handleChange('alertInfoColor', e.target.value)}
                />
                <span className="form-color-value">{settings.alertInfoColor}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}