import React from 'react';
import { CrawlerConfig, AlertChannels } from '../../../services/CrawlerConfigTypes';
import { SettingsSection, SettingsInput, SettingsSelect, SettingsToggle } from './shared';

interface TabProps {
  config: CrawlerConfig;
  setConfig: React.Dispatch<React.SetStateAction<CrawlerConfig>>;
}

export default function SchedulingTab({ config, setConfig }: TabProps) {
  const updateConfig = (key: keyof CrawlerConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateAlertChannel = (channel: keyof AlertChannels, value: boolean) => {
    setConfig(prev => ({
      ...prev,
      alertChannels: { ...(prev.alertChannels || {}), [channel]: value }
    }));
  };

  const alertChannels = config.alertChannels || {};

  return (
    <div className="space-y-6">
      <SettingsSection title="Auto-Recrawl" description="Schedule this project to scan automatically.">
        <SettingsToggle 
          label="Enable Scheduled Scanning" 
          checked={config.scheduleEnabled} 
          onChange={(val) => updateConfig('scheduleEnabled', val)} 
        />
        {config.scheduleEnabled && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <SettingsSelect 
              label="Frequency" 
              value={config.scheduleFrequency}
              onChange={(val) => updateConfig('scheduleFrequency', val)}
              options={[
                { label: 'Daily', value: 'daily' },
                { label: 'Weekly', value: 'weekly' },
                { label: 'Monthly', value: 'monthly' }
              ]}
            />
            {config.scheduleFrequency === 'weekly' && (
              <SettingsSelect 
                label="Day of Week" 
                value={config.scheduleDay}
                onChange={(val) => updateConfig('scheduleDay', val)}
                options={[
                  { label: 'Monday', value: 'monday' },
                  { label: 'Tuesday', value: 'tuesday' },
                  { label: 'Wednesday', value: 'wednesday' },
                  { label: 'Thursday', value: 'thursday' },
                  { label: 'Friday', value: 'friday' },
                  { label: 'Saturday', value: 'saturday' },
                  { label: 'Sunday', value: 'sunday' }
                ]}
              />
            )}
            <SettingsInput 
              label="Start Time" 
              value={config.scheduleTime} 
              onChange={(val) => updateConfig('scheduleTime', val)} 
              type="time" 
            />
          </div>
        )}
      </SettingsSection>

      <SettingsSection title="Change Detection" description="Compare current results with the previous scan.">
        <SettingsToggle 
          label="Enable Smart Diff" 
          description="Highlight new issues, fixed issues, and content changes."
          checked={config.changeDetection} 
          onChange={(val) => updateConfig('changeDetection', val)} 
        />
      </SettingsSection>

      <SettingsSection title="Alert Triggers" description="When should we notify you?">
        <SettingsToggle label="On Score Drop" checked={config.alertOnScoreDrop} onChange={(val) => updateConfig('alertOnScoreDrop', val)} />
        <SettingsToggle label="On New 404 Errors" checked={config.alertOnNew404s} onChange={(val) => updateConfig('alertOnNew404s', val)} />
        <SettingsToggle label="On Critical New Issues" checked={config.alertOnNewIssues} onChange={(val) => updateConfig('alertOnNewIssues', val)} />
      </SettingsSection>

      <SettingsSection title="Notification Channels">
        <div className="grid grid-cols-2 gap-3">
          <SettingsToggle label="Email" checked={alertChannels.email} onChange={(val) => updateAlertChannel('email', val)} />
          <SettingsToggle label="In-App Notification" checked={alertChannels.inApp} onChange={(val) => updateAlertChannel('inApp', val)} />
          <SettingsToggle label="Slack" checked={alertChannels.slack} onChange={(val) => updateAlertChannel('slack', val)} />
          <SettingsToggle label="Webhook" checked={alertChannels.webhook} onChange={(val) => updateAlertChannel('webhook', val)} />
        </div>
        {alertChannels.webhook && (
          <div className="mt-3">
            <SettingsInput 
              label="Webhook URL" 
              value={config.webhookUrl} 
              onChange={(val) => updateConfig('webhookUrl', val)} 
              placeholder="https://hooks.slack.com/services/..."
            />
          </div>
        )}
      </SettingsSection>
    </div>
  );
}
