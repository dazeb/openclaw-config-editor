<img width="2816" height="1536" alt="Gemini_Generated_Image_kbrgwmkbrgwmkbrg" src="https://github.com/user-attachments/assets/a42bb6a0-bc83-442c-98db-5576bbd7925c" />

# 🛠️ OpenClaw Config Editor

> **Precision Configuration for the Agentic Era.**


[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/dazeb/openclaw-config-editor)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](./LICENSE)

OpenClaw Config Editor is a high-fidelity Web SPA for managing your `openclaw.json` configuration and `.env` variables. Designed for speed, security, and deep context.

---

## 🚀 Features

- **Schema-Driven UI**: Full coverage of all OpenClaw configuration nodes with smart controls.
- **Model Fallback Orchestrator**: Interactive drag-to-reorder fallback chain with provider-specific logic.
- **Sentinel Intelligence**: Integrated help system providing CLI commands and contextual reasoning for every field.
- **Security-First**: Smart redaction of sensitive keys and environment variable interpolation.
- **.env Mastery**: Dedicated environment variable editor with a registry of 25+ known OpenClaw variables.
- **Draft Persistence**: Auto-saves to local storage so you never lose a session.

---

## 📦 Getting Started

### Installation

```bash
git clone https://github.com/dazeb/openclaw-config-editor.git
cd openclaw-config-editor
npm install
```

### Development

```bash
npm run dev
```
Navigate to `http://localhost:5173`.

### Production Build

```bash
npm run build
```
Static files will be generated in the `dist/` directory.

---

## 🕹️ How to Use

1. **Load Config**: Paste your existing `openclaw.json` or start from defaults.
2. **Edit**: Use the intuitive cards to adjust parameters. Hover or click the `?` for Sentinel guidance.
3. **Export**: Export your modified config as a JSON file.
4. **Apply**: Move the file to your OpenClaw root and restart the gateway.

---

## 🛡️ Security Directives

This editor runs entirely in your browser. No configuration data is ever sent to a server. For maximum security, use the `__OPENCLAW_REDACTED__` patterns for sensitive keys.

---

## 📜 License

ISC © [dazeb](https://github.com/dazeb)
