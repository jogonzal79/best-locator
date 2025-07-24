# Best-Locator

**Universal AI-powered selector generator for UI testing with organic navigation and intelligent analysis.**

Generate professional-grade selectors for UI testing with the reliability developers trust, the flexibility testers need, and the intelligence of AI.

[![npm version](https://badge.fury.io/js/bestlocator.svg)](https://badge.fury.io/js/bestlocator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🚀 Quick Start

```bash
# 1. Install the tool globally
npm install -g bestlocator

# 2. Install the necessary browsers
npx playwright install

# 3. Navigate to your project and create a config file
cd your-project/
bestlocator init

# 4. Start generating selectors in the most powerful mode
# (Note: --ai requires prior setup, see guide below)
bestlocator pick-toggle https://saucedemo.com --ai --explain
```

---

## ✨ Why Best-Locator?

Traditional selector generators are broken. They force you to capture elements immediately, can't handle login flows, and often generate unreliable selectors.

**Best-Locator changes everything:**

- 🧠 **Hybrid Intelligence**: Combines rule-based stability with AI creativity
- 🌐 **Organic Navigation**: Browse like a normal user, log in, and move between pages
- ⚡ **Toggle Capture Mode**: Turn element capture ON/OFF with keyboard shortcuts (`CTRL+S` / `CTRL+D`)
- 🎯 **Professional Selectors**: Prioritizes `data-test`, `data-testid`, and other robust attributes first
- 📄 **Multi-Page Capture**: Collect selectors from different pages in a single session
- 🔧 **Framework Agnostic**: Generates code for Playwright, Selenium, and Cypress
- 💡 **AI Explanations**: Understand why a selector was chosen
- 🚀 **Intelligent Fallback**: Uses AI only when necessary, ensuring speed and reliability

---

## 📋 Prerequisites

Before installing, make sure you have:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (installed automatically with Node.js)

Check your Node.js version:
```bash
node -v
```

---

## 🛠 Installation & Setup

### Step 1: Install Best-Locator
```bash
npm install -g bestlocator
```

### Step 2: Install Browsers
Best-Locator uses Playwright under the hood to control the browser:
```bash
npx playwright install
```

### Step 3: Verify Installation
```bash
bestlocator hello
```
You should see a welcome message. You're all set! 🎉

---

## 🤖 AI Configuration

Best-Locator's most powerful features are unlocked with AI. Choose between two providers:

- **Ollama**: Free, private, and runs on your own machine
- **OpenAI**: Paid (very inexpensive), cloud-based, and extremely powerful

### Option 1: Ollama (Free, Local)

#### 1. Install Ollama

**macOS & Windows:**
- Go to [ollama.com](https://ollama.com)
- Download, install, and run the application
- You'll see a llama icon in your menu bar (macOS) or system tray (Windows)

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

#### 2. Download a Model
```bash
ollama pull llama3.1
```

#### 3. Verify Integration
```bash
bestlocator ai-test
# Expected: ✅ AI is working correctly!
```

### Option 2: OpenAI (Paid, Cloud-Based)

#### 1. Get an OpenAI API Key
1. Go to [OpenAI API Keys](https://platform.openai.com/account/api-keys)
2. Click **Create new secret key**
3. For maximum security, select **Permissions: Restricted**
4. Grant these permissions:
   - **Models**: Read
   - **Model capabilities**: Write
5. Copy the generated API key (`sk-...`) and save it securely

#### 2. Set the API Key
**Never write your API key directly in the config file.** Use an environment variable:

```bash
# Windows (CMD)
set OPENAI_API_KEY=sk-your-key-here

# Windows (PowerShell)
$env:OPENAI_API_KEY='sk-your-key-here'

# macOS / Linux
export OPENAI_API_KEY='sk-your-key-here'
```

#### 3. Configure Best-Locator
Edit your `best-locator.config.js` file:

```javascript
// best-locator.config.js
ai: {
  enabled: true,
  provider: 'openai', // Switch to openai
  openai: {
    model: 'gpt-4o', // Or 'gpt-3.5-turbo'
    // The apiKey is read automatically from the environment variable
  }
}
```

#### 4. Verify Integration
```bash
bestlocator ai-test
# Expected: ✅ Connection to openai is successful!
```

---

## 🎮 Usage

### Toggle Mode (Recommended)
The most powerful mode, allowing you to navigate freely:

```bash
bestlocator pick-toggle https://saucedemo.com --ai --explain
```

**How it works:**
1. **Navigate freely**: A control panel will appear in the browser
2. **Press `CTRL+S`**: Turn ON capture mode
3. **Click elements**: Capture high-quality selectors
4. **Press `CTRL+D`**: Turn OFF capture mode to navigate again
5. **Press `ESC`**: Finish the session and get your results

### Other Modes

```bash
# Pick a single element
bestlocator pick https://your-app.com --ai

# Pick multiple elements in sequence
bestlocator pick-multiple https://your-app.com

# Validate an existing selector
bestlocator validate https://your-app.com '[data-test="username"]'
```

---

## 🔧 Framework Support

| Framework  | JavaScript | TypeScript | Python | Java | C# |
|------------|:----------:|:----------:|:------:|:----:|:--:|
| Playwright |     ✅     |     ✅     |   ✅   |  ✅  | ✅ |
| Selenium   |     ✅     |     ✅     |   ✅   |  ✅  | ✅ |
| Cypress    |     ✅     |     ✅     |   ❌   |  ❌  | ❌ |

---

## ⚙️ Configuration File

Run `bestlocator init` in your project's root directory to create a `best-locator.config.js` file:

```javascript
// best-locator.config.js
export default {
  defaultFramework: 'playwright',
  defaultLanguage: 'typescript',
  
  // AI Configuration with Provider model
  ai: {
    enabled: true,
    // Switch between 'ollama' or 'openai'
    provider: 'ollama', 
    
    ollama: {
      host: 'http://localhost:11434',
      model: 'llama3.1',
    },
    openai: {
      // API key is best set as an environment variable (OPENAI_API_KEY)
      model: 'gpt-4o',
    }
  },
  
  // Custom data-* attributes for your project
  projectAttributes: [
    'data-testid',
    'data-cy', 
    'data-test',
    'data-qa'
  ],
  
  // URL shortcuts for the 'go' command
  urls: {
    local: 'http://localhost:3000',
    staging: 'https://staging.myapp.com',
  }
};
```

### Using URL Aliases
Once configured, you can use shortcuts for your most-used URLs:

```bash
bestlocator go local --ai # Uses http://localhost:3000 from your config
```

---

## 📖 Command Reference

### Core Commands

```bash
# Interactive Modes
bestlocator pick <url>
bestlocator pick-multiple <url>
bestlocator pick-toggle <url>
bestlocator go <alias>

# Utilities
bestlocator validate <url> <selector>
bestlocator init
bestlocator config
bestlocator hello
bestlocator --version
bestlocator --help

# AI Management
bestlocator ai-test
```

### Command Flags

- `--ai`: Enables the hybrid AI strategy for selector generation
- `--explain`: Provides an AI-generated explanation for the chosen selector

---

## 🔍 Troubleshooting

### Browser Not Opening
This usually means the Playwright browsers aren't installed:

```bash
npx playwright install
```

### AI Not Working
1. **For Ollama**: Make sure Ollama is running and the model is downloaded
2. **For OpenAI**: Verify your API key is set as an environment variable
3. **Test the connection**:
   ```bash
   bestlocator ai-test
   ```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Author

**Jonathan Gonzalez**  
Automation Testing Enthusiast  
[LinkedIn Profile](https://www.linkedin.com/in/jonathan-g-33607648/)

---

*Generate professional-grade selectors for UI testing with the reliability developers trust, the flexibility testers need, and the intelligence of AI.*