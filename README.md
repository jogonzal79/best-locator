# Best-Locator

Universal AI-powered selector generator for UI testing with organic navigation and intelligent analysis.

Generate professional-grade selectors for UI testing with the reliability developers trust, the flexibility testers need, and the intelligence of AI.

## Quick Start

```bash
# Install globally
npm install -g bestlocator

# Create a configuration file in your project
bestlocator init

# Start generating selectors in the most powerful mode
bestlocator pick-toggle https://saucedemo.com --ai --explain
```

## Why Best-Locator?

Traditional selector generators are broken. They force you to capture elements immediately, can't handle login flows, and often generate unreliable selectors.

**Best-Locator changes everything:**

- **Hybrid Intelligence** - Combines rule-based stability with AI creativity
- **Navigate Organically** - Browse like a normal user, log in, and navigate between pages
- **Toggle Selector Mode** - Turn element capture ON/OFF with simple keyboard shortcuts (CTRL+S/CTRL+D)
- **Professional Selectors** - Prioritizes data-test, data-testid, and other robust attributes first
- **Multi-Page Capture** - Collect selectors from different pages in one single session
- **Framework Agnostic** - Generates code for Playwright, Selenium, and Cypress
- **AI Explanations** - Understand why a selector was chosen
- **Intelligent Fallback** - Uses AI only when necessary, ensuring speed and reliability

## Installation

```bash
npm install -g bestlocator
```

After installation, verify it's working correctly:

```bash
bestlocator hello
# Expected: 🎉 Best-Locator v2.0.9 is working!
```

## Ollama Installation Guide (For AI Functionality)

To use the AI features (`--ai`, `--explain`), you need to have Ollama installed and running on your computer.

### 1. Install Ollama

Choose the instructions for your operating system:

#### macOS 🍎
1. Go to the official download page: [ollama.com](https://ollama.com)
2. Click the **Download for macOS** button
3. Open the downloaded .zip file and move the Ollama app to your Applications folder
4. Run the Ollama application. You will see a llama icon in your top menu bar

#### Windows 🪟
1. Go to the official download page: [ollama.com](https://ollama.com)
2. Click the **Download for Windows (Preview)** button
3. Run the downloaded .exe installer and follow the steps
4. Once installed, Ollama will run in the background. You will see its icon in the system tray (near the clock)

#### Linux 🐧
1. Open your terminal
2. Run the following command to download and install Ollama:
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ```
3. Ollama will be installed as a systemd service. It usually starts automatically. You can check its status with `systemctl status ollama`

### 2. Download a Model

Once Ollama is installed and running, you need to download a language model for Best-Locator to use.

1. Open your terminal
2. Run the following command to download the recommended model (llama3.1):
   ```bash
   ollama pull llama3.1
   ```
   *(This may take a few minutes, as the model is large)*

### 3. Verify the Integration

Finally, verify that Best-Locator can communicate with Ollama:

```bash
bestlocator ai-test
# Expected: ✅ AI is working correctly!
```

## Usage

### Toggle Mode (Recommended)

```bash
bestlocator pick-toggle https://saucedemo.com --ai --explain
```

**How it works:**
1. **Navigate freely** - A control panel will appear in the browser
2. **Press CTRL+S** - Turn ON selector mode
3. **Click elements** - Capture high-quality selectors
4. **Press CTRL+D** - Turn OFF selector mode to navigate again
5. **Press ESC** - Finish the session and get your selectors

### Single Element Mode

```bash
bestlocator pick https://your-app.com --ai
```

### Multiple Elements Mode

```bash
bestlocator pick-multiple https://your-app.com
```

### Validate Existing Selectors

```bash
bestlocator validate https://your-app.com '[data-test="username"]'
```

## Framework Support

| Framework | JavaScript | TypeScript | Python | Java | C# |
|-----------|------------|------------|--------|------|-----|
| Playwright | ✅ | ✅ | ✅ | ✅ | ✅ |
| Selenium | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cypress | ✅ | ✅ | ❌ | ❌ | ❌ |

```bash
# Specify framework and language
bestlocator pick https://your-app.com selenium python
```

## Intelligent Selector Priority

Best-Locator uses a hybrid strategy to guarantee the best selector every time.

| Priority | Selector Type | Confidence | Strategy | Example |
|----------|---------------|------------|----------|---------|
| 1st | data-test-*, data-cy | 100% | Rule-Based: Always chosen first | `[data-test="username"]` |
| 2nd | Semantic Role + Text | 90% | Rule-Based: High accessibility | `getByRole("button", { name: "Sign In" })` |
| 3rd | ID, Placeholder, etc. | 70-80% | Rule-Based: Good alternatives | `#main-content` |
| 4th | Other Attributes | Varies | AI-Powered: Used when rules fail | `.product-title` |

## Configuration

Run `bestlocator init` to create a `best-locator.config.js` file in your project.

```javascript
// best-locator.config.js
module.exports = {
  defaultFramework: 'playwright',
  defaultLanguage: 'typescript',
  
  ai: {
    enabled: true,
    provider: 'ollama',
    ollama: {
      host: 'http://localhost:11434',
      model: 'llama3.1',
      // ... other settings
    },
  },
  
  projectAttributes: [
    'data-testid',
    'data-cy', 
    'data-test',
    'data-qa'
  ],
  
  urls: {
    local: 'http://localhost:3000',
    staging: 'https://staging.myapp.com',
  }
};
```

### Using URL Aliases

```bash
bestlocator go local --ai # Uses http://localhost:3000 from your config
```

## Command Reference

### Core Commands

```bash
# Interactive Modes
bestlocator pick <url> [framework] [language] [--ai] [--explain]
bestlocator pick-multiple <url> [framework] [language] [--ai] [--explain]
bestlocator pick-toggle <url> [framework] [language] [--ai] [--explain]
bestlocator go <alias> [--ai] [--explain]

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
- `--no-fallback`: (Advanced) Fails if the AI encounters an error instead of using a traditional selector

## Troubleshooting

### Browser Not Opening

This usually means the Playwright browsers aren't installed.

```bash
npx playwright install
```

### Command Not Found

If `bestlocator` is not recognized after installation:

```bash
# Re-link the command
npm link
```

## Author

**Jonathan Gonzalez**  
Automation Testing Enthusiast  
[LinkedIn Profile](https://www.linkedin.com/in/jonathan-g-33607648/)

---

*Generate professional-grade selectors for UI testing with the reliability developers trust, the flexibility testers need, and the intelligence of AI.*