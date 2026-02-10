export interface EnvVarDef {
  key: string;
  group: string;
  label: string;
  description: string;
  sensitive: boolean;
  required?: boolean;
  placeholder?: string;
  example?: string;
  docUrl?: string;
}

export const KNOWN_ENV_VARS: EnvVarDef[] = [
  // OpenClaw Core
  {
    key: 'OPENCLAW_GATEWAY_TOKEN',
    group: 'OpenClaw Core',
    label: 'Gateway Token',
    description: 'Authentication token for OpenClaw gateway',
    sensitive: true,
    required: true,
  },
  {
    key: 'OPENCLAW_AGENT_API_KEY',
    group: 'OpenClaw Core',
    label: 'Agent API Key',
    description: 'API key for OpenClaw agent services',
    sensitive: true,
  },

  // AI Providers
  {
    key: 'ANTHROPIC_API_KEY',
    group: 'AI Providers',
    label: 'Anthropic API Key',
    description: 'API key for Claude AI models',
    sensitive: true,
    placeholder: 'sk-ant-...',
    docUrl: 'https://console.anthropic.com/account/keys',
  },
  {
    key: 'OPENAI_API_KEY',
    group: 'AI Providers',
    label: 'OpenAI API Key',
    description: 'API key for GPT models',
    sensitive: true,
    placeholder: 'sk-...',
    docUrl: 'https://platform.openai.com/account/api-keys',
  },
  {
    key: 'GOOGLE_API_KEY',
    group: 'AI Providers',
    label: 'Google API Key',
    description: 'API key for Google AI models (Gemini)',
    sensitive: true,
    docUrl: 'https://makersuite.google.com/app/apikey',
  },
  {
    key: 'OPENROUTER_API_KEY',
    group: 'AI Providers',
    label: 'OpenRouter API Key',
    description: 'API key for OpenRouter model gateway',
    sensitive: true,
    docUrl: 'https://openrouter.ai/keys',
  },
  {
    key: 'OLLAMA_BASE_URL',
    group: 'AI Providers',
    label: 'Ollama Base URL',
    description: 'Local Ollama instance URL',
    sensitive: false,
    placeholder: 'http://localhost:11434',
  },
  {
    key: 'GROQ_API_KEY',
    group: 'AI Providers',
    label: 'Groq API Key',
    description: 'API key for Groq inference',
    sensitive: true,
    docUrl: 'https://console.groq.com',
  },

  // Channels
  {
    key: 'TELEGRAM_BOT_TOKEN',
    group: 'Channels',
    label: 'Telegram Bot Token',
    description: 'Token for Telegram bot integration',
    sensitive: true,
    placeholder: '123456789:ABCdefGHIjklmnoPQRstuvWXYZ...',
    docUrl: 'https://core.telegram.org/bots#botfather',
  },
  {
    key: 'DISCORD_BOT_TOKEN',
    group: 'Channels',
    label: 'Discord Bot Token',
    description: 'Token for Discord bot integration',
    sensitive: true,
    docUrl: 'https://discord.com/developers/applications',
  },
  {
    key: 'SLACK_BOT_TOKEN',
    group: 'Channels',
    label: 'Slack Bot Token',
    description: 'Token for Slack bot integration',
    sensitive: true,
    placeholder: 'xoxb-...',
    docUrl: 'https://api.slack.com/apps',
  },
  {
    key: 'WHATSAPP_API_KEY',
    group: 'Channels',
    label: 'WhatsApp API Key',
    description: 'API key for WhatsApp business integration',
    sensitive: true,
  },

  // Search & Tools
  {
    key: 'BRAVE_SEARCH_API_KEY',
    group: 'Search & Tools',
    label: 'Brave Search API Key',
    description: 'API key for Brave Search',
    sensitive: true,
    docUrl: 'https://api.search.brave.com',
  },
  {
    key: 'PERPLEXITY_API_KEY',
    group: 'Search & Tools',
    label: 'Perplexity API Key',
    description: 'API key for Perplexity AI search',
    sensitive: true,
    docUrl: 'https://www.perplexity.ai',
  },

  // Twitter/X
  {
    key: 'TWITTER_BEARER_TOKEN',
    group: 'Twitter/X',
    label: 'Twitter Bearer Token',
    description: 'Bearer token for Twitter API v2',
    sensitive: true,
    docUrl: 'https://developer.twitter.com/en/portal/dashboard',
  },
  {
    key: 'TWITTER_OAUTH_CONSUMER_KEY',
    group: 'Twitter/X',
    label: 'Twitter OAuth Consumer Key',
    description: 'OAuth consumer key for Twitter',
    sensitive: true,
  },
  {
    key: 'TWITTER_OAUTH_CONSUMER_SECRET',
    group: 'Twitter/X',
    label: 'Twitter OAuth Consumer Secret',
    description: 'OAuth consumer secret for Twitter',
    sensitive: true,
  },
  {
    key: 'TWITTER_OAUTH_CLIENT_ID',
    group: 'Twitter/X',
    label: 'Twitter OAuth Client ID',
    description: 'OAuth client ID for Twitter',
    sensitive: true,
  },
  {
    key: 'TWITTER_OAUTH_CLIENT_SECRET',
    group: 'Twitter/X',
    label: 'Twitter OAuth Client Secret',
    description: 'OAuth client secret for Twitter',
    sensitive: true,
  },
  {
    key: 'TWITTER_ACCESS_TOKEN',
    group: 'Twitter/X',
    label: 'Twitter Access Token',
    description: 'Access token for Twitter API',
    sensitive: true,
  },
  {
    key: 'TWITTER_ACCESS_TOKEN_SECRET',
    group: 'Twitter/X',
    label: 'Twitter Access Token Secret',
    description: 'Access token secret for Twitter API',
    sensitive: true,
  },

  // Ghost CMS
  {
    key: 'CONTENT_API_KEY',
    group: 'Ghost CMS',
    label: 'Ghost Content API Key',
    description: 'Read-only API key for Ghost CMS',
    sensitive: true,
    docUrl: 'https://ghost.org/docs/content-api/',
  },
  {
    key: 'ADMIN_API_KEY',
    group: 'Ghost CMS',
    label: 'Ghost Admin API Key',
    description: 'Admin API key for Ghost CMS (format: id:secret)',
    sensitive: true,
    example: '1234567890abcdef:abcdef1234567890',
    docUrl: 'https://ghost.org/docs/admin-api/',
  },
  {
    key: 'API_URL',
    group: 'Ghost CMS',
    label: 'Ghost API URL',
    description: 'Base URL for Ghost CMS instance',
    sensitive: false,
    placeholder: 'https://myblog.com',
    example: 'https://example.com',
  },

  // Memory / Plugins
  {
    key: 'CHROMA_URL',
    group: 'Memory / Plugins',
    label: 'Chroma URL',
    description: 'URL for Chroma vector database',
    sensitive: false,
    placeholder: 'http://localhost:8100',
  },
  {
    key: 'ELEVENLABS_API_KEY',
    group: 'Memory / Plugins',
    label: 'ElevenLabs API Key',
    description: 'API key for ElevenLabs text-to-speech',
    sensitive: true,
    docUrl: 'https://elevenlabs.io/docs/api-reference/text-to-speech',
  },
];
