import { useState } from 'react';
import { AGENT_TEMPLATES, generateBootstrapFiles, downloadBootstrapFiles, generateAgentSetupScript, type AgentTemplate } from '../bootstrapTemplates';
import HelpTooltip from './HelpTooltip';

interface BootstrapWizardProps {
  agentName: string;
  agentId: string;
  workspacePath: string;
}

const HELP_TEXT = {
  templates: {
    title: 'Agent Templates',
    content: 'Templates provide pre-configured bootstrap files (SOUL.md, IDENTITY.md, etc.) tailored to specific roles. Choose a template that matches your agent\'s primary function, or start with Blank to customize everything.',
  },
  bootstrapFiles: {
    title: 'Bootstrap Files',
    content: 'These files define your agent\'s personality, ethics, and operating procedures. SOUL.md defines behavioral constraints, IDENTITY.md defines the persona, MEMORY.md stores long-term context, and AGENTS.md contains operational instructions.',
  },
  setupScript: {
    title: 'Setup Script',
    content: 'A bash script that automatically creates the workspace directory and writes all bootstrap files. Save this as setup.sh and run it to initialize your agent\'s environment.',
  },
};

export default function BootstrapWizard({ agentName, agentId, workspacePath }: BootstrapWizardProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate>(AGENT_TEMPLATES[0]);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [activeTab, setActiveTab] = useState<'templates' | 'preview' | 'script'>('templates');
  const [copiedScript, setCopiedScript] = useState(false);

  const generatedFiles = generateBootstrapFiles(
    selectedTemplate,
    agentName || 'My Agent',
    userName || 'User',
    userRole || 'Developer'
  );

  const setupScript = generateAgentSetupScript(agentId, workspacePath, generatedFiles);

  const handleDownloadFiles = () => {
    downloadBootstrapFiles(generatedFiles);
  };

  const handleCopyScript = async () => {
    await navigator.clipboard.writeText(setupScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleDownloadScript = () => {
    const blob = new Blob([setupScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `setup-${agentId}.sh`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      background: '#0f1117',
      border: '1px solid #2a2d3e',
      borderRadius: '8px',
      padding: '20px',
      marginTop: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <h4 style={{ margin: 0, color: '#e2e8f0', fontSize: '14px' }}>
          🚀 Agent Bootstrap Files
        </h4>
        <HelpTooltip {...HELP_TEXT.bootstrapFiles} />
      </div>

      <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '12px' }}>
        Generate bootstrap files to initialize your agent's workspace with personality, ethics, and operating procedures.
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #2a2d3e', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('templates')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'templates' ? '#00d4d422' : 'transparent',
            color: activeTab === 'templates' ? '#00d4d4' : '#64748b',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          1. Choose Template
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          disabled={!agentName}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'preview' ? '#00d4d422' : 'transparent',
            color: activeTab === 'preview' ? '#00d4d4' : !agentName ? '#475569' : '#64748b',
            cursor: !agentName ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          2. Preview Files
        </button>
        <button
          onClick={() => setActiveTab('script')}
          disabled={!agentName}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'script' ? '#00d4d422' : 'transparent',
            color: activeTab === 'script' ? '#00d4d4' : !agentName ? '#475569' : '#64748b',
            cursor: !agentName ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          3. Get Setup Script
        </button>
      </div>

      {/* Template Selection */}
      {activeTab === 'templates' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <label style={{ color: '#94a3b8', fontSize: '13px' }}>Select Template</label>
            <HelpTooltip {...HELP_TEXT.templates} />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
          }}>
            {AGENT_TEMPLATES.map(template => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                style={{
                  background: selectedTemplate.id === template.id ? '#00d4d422' : '#1a1d27',
                  border: `2px solid ${selectedTemplate.id === template.id ? '#00d4d4' : '#2a2d3e'}`,
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '24px' }}>{template.icon}</span>
                  <span style={{
                    fontWeight: 600,
                    color: selectedTemplate.id === template.id ? '#00d4d4' : '#e2e8f0',
                    fontSize: '14px',
                  }}>
                    {template.name}
                  </span>
                </div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '12px', lineHeight: '1.5' }}>
                  {template.description}
                </p>
                <div style={{
                  marginTop: '10px',
                  fontSize: '10px',
                  color: template.color,
                  background: `${template.color}22`,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  display: 'inline-block',
                }}>
                  {template.focus}
                </div>
              </div>
            ))}
          </div>

          {/* User Context */}
          <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '6px' }}>
                Your Name (optional)
              </label>
              <input
                id="bootstrap-username"
                name="userName"
                type="text"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                placeholder="e.g., John"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#1a1d27',
                  border: '1px solid #2a2d3e',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontSize: '14px',
                }}
              />
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                Used in USER.md to personalize the agent's context
              </div>
            </div>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '6px' }}>
                Your Role (optional)
              </label>
              <input
                id="bootstrap-userrole"
                name="userRole"
                type="text"
                value={userRole}
                onChange={e => setUserRole(e.target.value)}
                placeholder="e.g., Lead Developer"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#1a1d27',
                  border: '1px solid #2a2d3e',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>

          <div style={{
            background: '#00d4d411',
            border: '1px solid #00d4d433',
            borderRadius: '8px',
            padding: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ fontSize: '16px' }}>📦</span>
              <div>
                <div style={{ fontWeight: 600, color: '#00d4d4', fontSize: '12px', marginBottom: '4px' }}>
                  Files to be generated:
                </div>
                <div style={{ color: '#94a3b8', fontSize: '11px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {generatedFiles.map(f => (
                    <code key={f.filename} style={{ background: '#0f1117', padding: '2px 6px', borderRadius: '4px' }}>
                      {f.filename}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Preview */}
      {activeTab === 'preview' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Preview generated files</span>
            <button
              onClick={handleDownloadFiles}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #00d4d4',
                background: '#00d4d422',
                color: '#00d4d4',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              ⬇ Download All Files
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {generatedFiles.map(file => (
              <div key={file.filename} style={{
                background: '#1a1d27',
                border: '1px solid #2a2d3e',
                borderRadius: '8px',
                overflow: 'hidden',
              }}>
                <div style={{
                  background: '#22263a',
                  padding: '10px 16px',
                  borderBottom: '1px solid #2a2d3e',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <code style={{ color: '#00d4d4', fontSize: '13px' }}>{file.filename}</code>
                  <span style={{ color: '#64748b', fontSize: '11px' }}>{file.description}</span>
                </div>
                <pre style={{
                  margin: 0,
                  padding: '16px',
                  color: '#94a3b8',
                  fontSize: '12px',
                  overflow: 'auto',
                  maxHeight: '200px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {file.content.slice(0, 500)}{file.content.length > 500 ? '...' : ''}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Setup Script */}
      {activeTab === 'script' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Bash Setup Script</span>
            <HelpTooltip {...HELP_TEXT.setupScript} />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              onClick={handleCopyScript}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #2a2d3e',
                background: copiedScript ? '#22c55e22' : '#22263a',
                color: copiedScript ? '#22c55e' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              {copiedScript ? '✓ Copied!' : '📋 Copy Script'}
            </button>
            <button
              onClick={handleDownloadScript}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #00d4d4',
                background: '#00d4d422',
                color: '#00d4d4',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              ⬇ Download setup.sh
            </button>
          </div>

          <pre style={{
            background: '#1a1d27',
            border: '1px solid #2a2d3e',
            borderRadius: '8px',
            padding: '16px',
            color: '#94a3b8',
            fontSize: '12px',
            overflow: 'auto',
            maxHeight: '400px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {setupScript}
          </pre>

          <div style={{
            background: '#f59e0b11',
            border: '1px solid #f59e0b33',
            borderRadius: '8px',
            padding: '12px',
            marginTop: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ fontSize: '16px' }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 600, color: '#f59e0b', fontSize: '12px', marginBottom: '4px' }}>
                  How to use:
                </div>
                <ol style={{ margin: 0, paddingLeft: '16px', color: '#94a3b8', fontSize: '11px', lineHeight: '1.6' }}>
                  <li>Download the setup script</li>
                  <li>Save it to your agent's workspace location</li>
                  <li>Run: <code style={{ color: '#fbbf24' }}>chmod +x setup-{agentId}.sh && ./setup-{agentId}.sh</code></li>
                  <li>All bootstrap files will be created automatically</li>
                  <li>Delete BOOTSTRAP.md after completing the initialization ritual</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
