import { useState, useCallback } from 'react';
import type { Agent, AgentFormData, Binding } from '../agentTypes';
import { AVAILABLE_MODELS, THINKING_OPTIONS, generateAgentId, generateWorkspacePath, createAgentFromForm } from '../agentTypes';
import HelpTooltip from './HelpTooltip';
import BootstrapWizard from './BootstrapWizard';

interface AgentCreatorProps {
  agents: Agent[];
  bindings: Binding[];
  onAgentsChange: (agents: Agent[]) => void;
  onBindingsChange: (bindings: Binding[]) => void;
}

const initialFormData: AgentFormData = {
  id: '',
  name: '',
  workspace: '',
  model: '',
  thinking: 'off',
  setAsDefault: false,
  subagentModel: '',
  subagentThinking: 'off',
  maxConcurrentSubagents: 3,
  sandboxMode: 'off',
};

// Help text for each field
const HELP_TEXT = {
  agentId: {
    title: 'Agent ID',
    content: 'A unique identifier for this agent. It is auto-generated from the agent name (lowercase, hyphenated). This ID is used in config files, session storage paths, and routing rules. Once created, changing the ID requires creating a new agent.',
  },
  workspace: {
    title: 'Workspace Directory',
    content: 'The directory where this agent stores its files, including AGENTS.md (operating instructions), SOUL.md (personality), TOOLS.md (tool notes), and session data. Each agent should have its own isolated workspace to prevent data collisions. Default: ~/.openclaw/workspace-<agent-id>',
  },
  agentDir: {
    title: 'Agent Directory',
    content: 'Internal state directory for this agent, containing auth-profiles.json, model registry, and per-agent configuration. Never reuse agentDir across agents as it causes auth and session collisions. Auto-generated as ~/.openclaw/agents/<id>/agent',
  },
  model: {
    title: 'Agent Model',
    content: 'The primary LLM model this agent uses for responses. If not specified, the agent uses the global default model. Different models have different capabilities, costs, and speed. Claude Opus is best for complex tasks, Sonnet for general use, and smaller models like MiniMax for simpler tasks.',
    link: 'https://docs.openclaw.ai/concepts/agent',
  },
  thinking: {
    title: 'Thinking Budget',
    content: 'Extended reasoning mode that allows the model to "think" before responding. Higher levels give better reasoning for complex tasks but increase cost and latency. Off is fastest and cheapest. Use Low/Medium for most tasks, High/X-High for debugging, research, or complex problem-solving.',
  },
  default: {
    title: 'Default Agent',
    content: 'The default agent receives messages that do not match any specific routing rules. Only one agent should be set as default. When no binding matches an incoming message, it routes to the default agent. If no default is set, the first agent in the list becomes the fallback.',
  },
  subagentModel: {
    title: 'Sub-Agent Model',
    content: 'The model used when this agent spawns sub-agents for background tasks. Sub-agents run in parallel for research, file processing, etc. Using a cheaper model here (like MiniMax or a small Ollama model) can significantly reduce costs while the main agent uses a premium model.',
    link: 'https://docs.openclaw.ai/tools/subagents',
  },
  subagentThinking: {
    title: 'Sub-Agent Thinking',
    content: 'Thinking level for sub-agents. Sub-agents usually perform focused tasks (research, analysis) so they often do not need high thinking budgets. Low or Minimal is usually sufficient, Off for simple data processing tasks.',
  },
  maxConcurrentSubagents: {
    title: 'Max Concurrent Sub-Agents',
    content: 'The maximum number of sub-agents this agent can run simultaneously. Higher values allow more parallel work but consume more resources. Sub-agents run on a dedicated queue lane so they do not block the main agent. Default is 3, max recommended is 8-10.',
  },
  sandboxMode: {
    title: 'Sandbox Mode',
    content: 'Controls which agents run in isolated Docker sandboxes. Off = no sandboxing (direct system access). Non-Main = only sandbox sub-agents and cron jobs (recommended - protects your main agent while isolating background tasks). All = sandbox everything including main agent (requires Docker, maximum isolation).',
  },
  bindings: {
    title: 'Bindings & Routing',
    content: 'Bindings determine which messages route to which agent based on channel (WhatsApp, Telegram, etc.), account ID, and peer (DM/group). You can route specific phone numbers to different agents, or split work by channel type. Configured separately in the Bindings section.',
    link: 'https://docs.openclaw.ai/concepts/multi-agent',
  },
};

function FormField({ label, helpKey, children }: { label: string; helpKey?: keyof typeof HELP_TEXT; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '13px', marginBottom: '6px' }}>
        {label}
        {helpKey && <HelpTooltip {...HELP_TEXT[helpKey]} />}
      </label>
      {children}
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <h4 style={{ margin: '0 0 6px 0', color: '#e2e8f0', fontSize: '14px' }}>{title}</h4>
      <p style={{ margin: 0, color: '#64748b', fontSize: '12px', lineHeight: '1.5' }}>{description}</p>
    </div>
  );
}

export default function AgentCreator({ agents, bindings, onAgentsChange, onBindingsChange }: AgentCreatorProps) {
  const [formData, setFormData] = useState<AgentFormData>(initialFormData);
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleNameChange = (name: string) => {
    const id = generateAgentId(name);
    setFormData(prev => ({
      ...prev,
      name,
      id,
      workspace: generateWorkspacePath(id),
    }));
  };

  const handleSubmit = useCallback(() => {
    if (!formData.name.trim() || !formData.id.trim()) return;

    const newAgent = createAgentFromForm(formData);

    if (editingId) {
      // Update existing
      const updated = agents.map(a => a.id === editingId ? { ...newAgent, id: editingId } : a);
      onAgentsChange(updated);
    } else {
      // Add new
      onAgentsChange([...agents, newAgent]);
    }

    // Reset form
    setFormData(initialFormData);
    setEditingId(null);
    setActiveTab('list');
  }, [formData, agents, editingId, onAgentsChange]);

  const handleEdit = (agent: Agent) => {
    setFormData({
      id: agent.id,
      name: agent.name,
      workspace: agent.workspace,
      model: agent.model || '',
      thinking: agent.thinking || 'off',
      setAsDefault: agent.default || false,
      subagentModel: agent.subagents?.model || '',
      subagentThinking: agent.subagents?.thinking || 'off',
      maxConcurrentSubagents: agent.subagents?.maxConcurrent || 3,
      sandboxMode: agent.sandbox?.mode || 'off',
    });
    setEditingId(agent.id);
    setActiveTab('create');
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      onAgentsChange(agents.filter(a => a.id !== id));
      // Also remove bindings for this agent
      onBindingsChange(bindings.filter(b => b.agentId !== id));
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setActiveTab('list');
  };

  const handleSetDefault = (id: string) => {
    const updated = agents.map(a => ({
      ...a,
      default: a.id === id ? true : undefined,
    }));
    onAgentsChange(updated);
  };

  return (
    <div style={{
      background: '#1a1d27',
      border: '1px solid #2a2d3e',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🤖 Agent Manager
          </h3>
          <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '13px' }}>
            Create and manage multiple isolated agents with specific models and settings
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('list')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #2a2d3e',
              background: activeTab === 'list' ? '#00d4d422' : '#22263a',
              color: activeTab === 'list' ? '#00d4d4' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            List ({agents.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('create');
              setEditingId(null);
              setFormData(initialFormData);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #00d4d4',
              background: '#00d4d422',
              color: '#00d4d4',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            + New Agent
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      {activeTab === 'list' && agents.length > 0 && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '12px',
          marginBottom: '20px' 
        }}>
          <div style={{ background: '#0f1117', border: '1px solid #2a2d3e', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#00d4d4' }}>{agents.length}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Total Agents</div>
          </div>
          <div style={{ background: '#0f1117', border: '1px solid #2a2d3e', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
              {agents.filter(a => a.default).length || 'None'}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Default Agent</div>
          </div>
          <div style={{ background: '#0f1117', border: '1px solid #2a2d3e', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#22c55e' }}>
              {agents.filter(a => a.model).length}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Custom Models</div>
          </div>
          <div style={{ background: '#0f1117', border: '1px solid #2a2d3e', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#a855f7' }}>
              {bindings.filter(b => agents.some(a => a.id === b.agentId)).length}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Active Bindings</div>
          </div>
        </div>
      )}

      {activeTab === 'list' && (
        <div>
          {agents.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#64748b',
              background: '#0f1117',
              borderRadius: '8px',
              border: '1px dashed #2a2d3e',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🤖</div>
              <div style={{ fontSize: '14px', marginBottom: '6px' }}>No agents configured</div>
              <div style={{ fontSize: '12px', marginBottom: '16px' }}>Create your first agent to get started with multi-agent routing</div>
              <div style={{ fontSize: '11px', color: '#475569', maxWidth: '400px', margin: '0 auto', lineHeight: '1.5' }}>
                Agents are isolated AI personalities with their own workspaces, models, and settings. 
                You can route different chats/channels to different agents for specialized tasks.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {agents.map(agent => (
                <div
                  key={agent.id}
                  style={{
                    background: '#0f1117',
                    border: '1px solid #2a2d3e',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: agent.default ? '#00d4d422' : '#22263a',
                      border: `2px solid ${agent.default ? '#00d4d4' : '#2a2d3e'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      {agent.default ? '⭐' : '🤖'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '15px' }}>
                          {agent.name}
                        </span>
                        {agent.default && (
                          <span style={{
                            fontSize: '10px',
                            padding: '2px 8px',
                            background: '#00d4d422',
                            color: '#00d4d4',
                            borderRadius: '12px',
                            fontWeight: 600,
                          }}>
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <span>ID: <code style={{ color: '#94a3b8' }}>{agent.id}</code></span>
                        {agent.model && <span>Model: {agent.model}</span>}
                        {agent.thinking && agent.thinking !== 'off' && (
                          <span style={{ color: '#f59e0b' }}>Thinking: {agent.thinking}</span>
                        )}
                        {agent.subagents?.model && (
                          <span style={{ color: '#22c55e' }}>Sub: {agent.subagents.model.split('/').pop()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!agent.default && (
                      <button
                        onClick={() => handleSetDefault(agent.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid #2a2d3e',
                          background: '#22263a',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                        title="Set as default agent"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(agent)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #2a2d3e',
                        background: '#22263a',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(agent.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #ef4444',
                        background: deleteConfirm === agent.id ? '#ef444422' : '#22263a',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      {deleteConfirm === agent.id ? 'Confirm?' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'create' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Basic Info */}
          <div style={{
            background: '#0f1117',
            border: '1px solid #2a2d3e',
            borderRadius: '8px',
            padding: '20px',
          }}>
            <SectionHeader 
              title="Basic Information" 
              description="Core identity and workspace settings for this agent. Each agent should have a unique workspace to maintain isolation."
            />
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <FormField label="Agent Name *" helpKey="agentId">
                <input
                  id="agent-name"
                  name="agentName"
                  type="text"
                  value={formData.name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="e.g., Work Assistant"
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
                  ID: <code style={{ color: '#00d4d4' }}>{formData.id || 'auto-generated'}</code>
                  {formData.id && (
                    <span style={{ marginLeft: '8px', color: '#475569' }}>
                      • Dir: <code>{generateWorkspacePath(formData.id)}</code>
                    </span>
                  )}
                </div>
              </FormField>

              <FormField label="Workspace Path" helpKey="workspace">
                <input
                  id="agent-workspace"
                  name="agentWorkspace"
                  type="text"
                  value={formData.workspace}
                  onChange={e => setFormData(prev => ({ ...prev, workspace: e.target.value }))}
                  placeholder="~/.openclaw/workspace-agent"
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
              </FormField>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  id="agent-default"
                  name="agentDefault"
                  type="checkbox"
                  checked={formData.setAsDefault}
                  onChange={e => setFormData(prev => ({ ...prev, setAsDefault: e.target.checked }))}
                />
                <span style={{ color: '#94a3b8', fontSize: '13px' }}>Set as default agent</span>
                <HelpTooltip {...HELP_TEXT.default} />
              </label>
            </div>
          </div>

          {/* Model Settings */}
          <div style={{
            background: '#0f1117',
            border: '1px solid #2a2d3e',
            borderRadius: '8px',
            padding: '20px',
          }}>
            <SectionHeader 
              title="Model Settings" 
              description="Choose the AI model and reasoning capabilities for this agent. These settings affect response quality, cost, and speed."
            />
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <FormField label="Model" helpKey="model">
                <select
                  id="agent-model"
                  name="agentModel"
                  value={formData.model}
                  onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#1a1d27',
                    border: '1px solid #2a2d3e',
                    borderRadius: '6px',
                    color: '#e2e8f0',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Use global default model</option>
                  <optgroup label="Anthropic (Recommended)">
                    {AVAILABLE_MODELS.filter(m => m.provider === 'Anthropic').map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="OpenAI">
                    {AVAILABLE_MODELS.filter(m => m.provider === 'OpenAI').map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Other Providers">
                    {AVAILABLE_MODELS.filter(m => !['Anthropic', 'OpenAI'].includes(m.provider)).map(m => (
                      <option key={m.value} value={m.value}>{m.label} ({m.provider})</option>
                    ))}
                  </optgroup>
                </select>
              </FormField>

              <FormField label="Thinking Budget" helpKey="thinking">
                <select
                  id="agent-thinking"
                  name="agentThinking"
                  value={formData.thinking}
                  onChange={e => setFormData(prev => ({ ...prev, thinking: e.target.value as any }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#1a1d27',
                    border: '1px solid #2a2d3e',
                    borderRadius: '6px',
                    color: '#e2e8f0',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  {THINKING_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label} — {opt.description}</option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>

          {/* Sub-Agent Settings */}
          <div style={{
            background: '#0f1117',
            border: '1px solid #2a2d3e',
            borderRadius: '8px',
            padding: '20px',
          }}>
            <SectionHeader 
              title="Sub-Agent Settings" 
              description="Sub-agents run background tasks without blocking the main conversation. Configure cheaper models here to reduce costs while maintaining quality in the main agent."
            />
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <FormField label="Sub-Agent Model" helpKey="subagentModel">
                <select
                  id="subagent-model"
                  name="subagentModel"
                  value={formData.subagentModel}
                  onChange={e => setFormData(prev => ({ ...prev, subagentModel: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#1a1d27',
                    border: '1px solid #2a2d3e',
                    borderRadius: '6px',
                    color: '#e2e8f0',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Same as agent model</option>
                  <optgroup label="Cheaper options for sub-agents">
                    {AVAILABLE_MODELS.filter(m => ['minimax/MiniMax-M2.1', 'ollama/llama3.2:1b'].includes(m.value)).map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="All Models">
                    {AVAILABLE_MODELS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </optgroup>
                </select>
              </FormField>

              <FormField label="Sub-Agent Thinking" helpKey="subagentThinking">
                <select
                  id="subagent-thinking"
                  name="subagentThinking"
                  value={formData.subagentThinking}
                  onChange={e => setFormData(prev => ({ ...prev, subagentThinking: e.target.value as any }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#1a1d27',
                    border: '1px solid #2a2d3e',
                    borderRadius: '6px',
                    color: '#e2e8f0',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  {THINKING_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label} — {opt.description}</option>
                  ))}
                </select>
              </FormField>

              <FormField label={`Max Concurrent Sub-Agents: ${formData.maxConcurrentSubagents}`} helpKey="maxConcurrentSubagents">
                <input
                  id="max-concurrent-subagents"
                  name="maxConcurrentSubagents"
                  type="range"
                  min="1"
                  max="10"
                  value={formData.maxConcurrentSubagents}
                  onChange={e => setFormData(prev => ({ ...prev, maxConcurrentSubagents: parseInt(e.target.value) }))}
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  <span>1 (Sequential)</span>
                  <span>5 (Balanced)</span>
                  <span>10 (Maximum)</span>
                </div>
              </FormField>
            </div>
          </div>

          {/* Sandbox Settings */}
          <div style={{
            background: '#0f1117',
            border: '1px solid #2a2d3e',
            borderRadius: '8px',
            padding: '20px',
          }}>
            <SectionHeader 
              title="Sandbox Settings" 
              description="Sandboxing isolates agents in Docker containers to prevent unauthorized system access. Choose the right balance between security and flexibility."
            />
            
            <FormField label="Sandbox Mode" helpKey="sandboxMode">
              <select
                id="sandbox-mode"
                name="sandboxMode"
                value={formData.sandboxMode}
                onChange={e => setFormData(prev => ({ ...prev, sandboxMode: e.target.value as any }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#1a1d27',
                  border: '1px solid #2a2d3e',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                <option value="off">Off — No sandboxing (full system access)</option>
                <option value="non-main">Non-Main — Sandbox sub-agents and cron only (recommended)</option>
                <option value="all">All — Sandbox all agents including main (requires Docker)</option>
              </select>
            </FormField>
          </div>

          {/* Bootstrap Files */}
          {formData.name && (
            <BootstrapWizard
              agentName={formData.name}
              agentId={formData.id}
              workspacePath={formData.workspace}
            />
          )}

          {/* Quick Tips */}
          <div style={{
            background: '#00d4d411',
            border: '1px solid #00d4d433',
            borderRadius: '8px',
            padding: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>💡</span>
              <div>
                <div style={{ fontWeight: 600, color: '#00d4d4', fontSize: '13px', marginBottom: '6px' }}>
                  Pro Tips
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', color: '#94a3b8', fontSize: '12px', lineHeight: '1.7' }}>
                  <li>Use different models for different tasks — Claude Opus for complex coding, Sonnet for general chat</li>
                  <li>Set a cheaper sub-agent model (MiniMax/Ollama) to save costs on background tasks</li>
                  <li>Enable Non-Main sandboxing for security without restricting your main agent</li>
                  <li>Create separate agents for work vs personal to keep contexts isolated</li>
                  <li>Use the Set Default button to control which agent receives unrouted messages</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={handleCancel}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: '1px solid #2a2d3e',
                background: '#22263a',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.name.trim()}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: '1px solid #00d4d4',
                background: formData.name.trim() ? '#00d4d422' : '#1a1d27',
                color: formData.name.trim() ? '#00d4d4' : '#64748b',
                cursor: formData.name.trim() ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              {editingId ? 'Update Agent' : 'Create Agent'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
