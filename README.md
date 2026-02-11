<img width="2816" height="1536" alt="Gemini_Generated_Image_kbrgwmkbrgwmkbrg" src="https://github.com/user-attachments/assets/a42bb6a0-bc83-442c-98db-5576bbd7925c" />

# 🛠️ OpenClaw Config Editor

> **Precision Configuration for the Agentic Era.**


[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/dazeb/openclaw-config-editor)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](./LICENSE)
[![macOS Compatible](https://img.shields.io/badge/macOS-✅-blue.svg)](./README.md#-macOS-Specific-Setup)

OpenClaw Config Editor is a high-fidelity Web SPA for managing your `openclaw.json` configuration and `.env` variables. Designed for speed, security, and deep context.

**🍎 macOS Compatible** - Runs locally on your Mac with full Homebrew integration and native file paths.

---

## 🚀 Features

- **Schema-Driven UI**: Full coverage of all OpenClaw configuration nodes with smart controls.
- **Model Fallback Orchestrator**: Interactive drag-to-reorder fallback chain with provider-specific logic.
- **Sentinel Intelligence**: Integrated help system providing CLI commands and contextual reasoning for every field.
- **Security-First**: Smart redaction of sensitive keys and environment variable interpolation.
- **.env Mastery**: Dedicated environment variable editor with a registry of 25+ known OpenClaw variables.
- **Draft Persistence**: Auto-saves to local storage so you never lose a session.
- **Agent Creator**: Multi-agent management with 5 persona templates (Sentinel, Foreman, Code Specialist, Archivist).
- **Bootstrap Generator**: Auto-generates SOUL.md, IDENTITY.md, MEMORY.md, and TOOLS.md files.
- **macOS Native**: Full Homebrew integration, native file paths, and Apple Silicon compatibility.

---

## 📦 Getting Started

### Prerequisites (macOS)

```bash
# Install Node.js via Homebrew (recommended)
brew install node

# Or download from nodejs.org
# Verify installation
node --version
npm --version
```

### Installation

```bash
# Clone the repository
git clone https://github.com/dazeb/openclaw-config-editor.git
cd openclaw-config-editor

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# Navigate to http://localhost:5173
# Works in Safari, Chrome, Firefox, and Arc
```

### Production Build

```bash
# Build for production
npm run build

# Static files will be generated in dist/
# Serve with any web server or open index.html directly
```

---

## 🕹️ How to Use

1. **Load Config**: Paste your existing `openclaw.json` or start from defaults.
2. **Edit**: Use the intuitive cards to adjust parameters. Hover or click the `?` for Sentinel guidance.
3. **Create Agents**: Use the "Agents" tab to create multiple agents with different personas.
4. **Generate Bootstrap**: Download setup scripts that create SOUL.md, IDENTITY.md, and other files.
5. **Export**: Export your modified config as a JSON file.
6. **Apply**: Move the file to your OpenClaw root and restart the gateway.

## 🍎 macOS-Specific Setup

### Install Dependencies via Homebrew

```bash
# Install ChromaDB for memory features
brew install python3
pip3 install chromadb

# Install Ollama for local embeddings
brew install ollama
ollama pull nomic-embed-text

# Install Docker Desktop (for sandboxing)
brew install --cask docker
```

### macOS File Paths

The editor uses these macOS-compatible paths:
- **OpenClaw workspace**: `~/.openclaw/workspace-<agent-id>`
- **Agent directory**: `~/.openclaw/agents/<agent-id>/agent`
- **Config files**: `~/.openclaw/openclaw.json`
- **Environment files**: `~/.openclaw/.env`

### Bootstrap Setup

```bash
# Run the generated setup script
chmod +x setup-<agent-id>.sh
./setup-<agent-id>.sh

# The script creates:
# - Workspace directory
# - All bootstrap files (AGENTS.md, SOUL.md, etc.)
# - Initializes the agent environment
```

---

## 🛡️ Security Directives

This editor runs entirely in your browser. No configuration data is ever sent to a server. For maximum security, use the `__OPENCLAW_REDACTED__` patterns for sensitive keys.


## 🖼️ Screenshots
<img width="982" height="788" alt="112" src="https://github.com/user-attachments/assets/b7d6d1a5-3f60-4aa9-a6da-a5bacd50f873" />

<img width="976" height="792" alt="rty" src="https://github.com/user-attachments/assets/5fb0ba8a-d82e-4c4d-8bff-6b657bef927a" />
<img width="983" height="790" alt="Screenshot 2026-02-11 084644" src="https://github.com/user-attachments/assets/a0af8b8f-8b8b-45e9-b1e8-5c141ef96c45" />
<img width="721" height="766" alt="gtat" src="https://github.com/user-attachments/assets/bf64cd1f-c2b5-4fd3-8cd9-517841b8192d" />
<img width="722" height="873" alt="Screenshot 2026-02-10 143703" src="https://github.com/user-attachments/assets/a7a8be02-293c-4b77-bff4-40e79d7e9725" />

---

## 📜 License

ISC © [dazeb](https://github.com/dazeb)
