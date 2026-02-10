export interface Agent {
  id: string;
  name: string;
  workspace: string;
  agentDir: string;
  model?: string;
  thinking?: 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';
  default?: boolean;
  subagents?: {
    model?: string;
    thinking?: 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';
    maxConcurrent?: number;
    archiveAfterMinutes?: number;
    allowAgents?: string[];
  };
  sandbox?: {
    mode?: 'off' | 'non-main' | 'all';
    workspaceAccess?: 'none' | 'ro' | 'rw';
  };
}

export interface Binding {
  agentId: string;
  match: {
    channel: string;
    accountId?: string;
    peer?: {
      kind: 'direct' | 'group';
      id: string;
    };
  };
}

export interface AgentFormData {
  id: string;
  name: string;
  workspace: string;
  model: string;
  thinking: 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';
  setAsDefault: boolean;
  subagentModel: string;
  subagentThinking: 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';
  maxConcurrentSubagents: number;
  sandboxMode: 'off' | 'non-main' | 'all';
}

export const AVAILABLE_MODELS = [
  { value: 'anthropic/claude-opus-4', label: 'Claude Opus 4', provider: 'Anthropic' },
  { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4', provider: 'Anthropic' },
  { value: 'anthropic/claude-sonnet-4-5', label: 'Claude Sonnet 4.5', provider: 'Anthropic' },
  { value: 'openai/gpt-5', label: 'GPT-5', provider: 'OpenAI' },
  { value: 'openai/gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
  { value: 'minimax/MiniMax-M2.1', label: 'MiniMax M2.1', provider: 'MiniMax' },
  { value: 'ollama/llama3.2:1b', label: 'Llama 3.2 1B', provider: 'Ollama' },
  { value: 'ollama/llama3.2', label: 'Llama 3.2', provider: 'Ollama' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'Google' },
];

export const THINKING_OPTIONS = [
  { value: 'off', label: 'Off', description: 'No extended thinking. Fastest and cheapest.' },
  { value: 'minimal', label: 'Minimal', description: 'Very brief reasoning step.' },
  { value: 'low', label: 'Low', description: 'Short reasoning. Good for light tasks.' },
  { value: 'medium', label: 'Medium', description: 'Moderate reasoning for multi-step tasks.' },
  { value: 'high', label: 'High', description: 'Deep reasoning for complex problem solving.' },
  { value: 'xhigh', label: 'X-High', description: 'Maximum extended thinking. Slowest and most expensive.' },
];

export function generateAgentId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export function generateWorkspacePath(agentId: string): string {
  return `~/.openclaw/workspace-${agentId}`;
}

export function generateAgentDir(agentId: string): string {
  return `~/.openclaw/agents/${agentId}/agent`;
}

export function createAgentFromForm(data: AgentFormData): Agent {
  const agent: Agent = {
    id: data.id,
    name: data.name,
    workspace: data.workspace || generateWorkspacePath(data.id),
    agentDir: generateAgentDir(data.id),
    model: data.model || undefined,
    thinking: data.thinking !== 'off' ? data.thinking : undefined,
    default: data.setAsDefault || undefined,
  };

  // Only add subagent config if not using defaults
  if (data.subagentModel || data.subagentThinking !== 'off' || data.maxConcurrentSubagents !== 3) {
    agent.subagents = {};
    if (data.subagentModel) agent.subagents.model = data.subagentModel;
    if (data.subagentThinking !== 'off') agent.subagents.thinking = data.subagentThinking;
    if (data.maxConcurrentSubagents !== 3) agent.subagents.maxConcurrent = data.maxConcurrentSubagents;
  }

  // Only add sandbox config if not default
  if (data.sandboxMode !== 'off') {
    agent.sandbox = {
      mode: data.sandboxMode,
    };
  }

  return agent;
}

export function agentToConfig(agent: Agent): Record<string, unknown> {
  const config: Record<string, unknown> = {};
  
  if (agent.workspace) config.workspace = agent.workspace;
  if (agent.agentDir) config.agentDir = agent.agentDir;
  if (agent.model) config.model = agent.model;
  if (agent.thinking) config.thinking = agent.thinking;
  if (agent.default) config.default = agent.default;
  if (agent.subagents) config.subagents = agent.subagents;
  if (agent.sandbox) config.sandbox = agent.sandbox;

  return config;
}
