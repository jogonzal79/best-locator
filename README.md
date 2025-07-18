# Best-Locator

> Universal AI-powered selector generator for UI testing with organic navigation and intelligent analysis

Generate professional-grade selectors for UI testing with the reliability developers trust, the flexibility testers need, and the intelligence of AI.

## Quick Start

```bash
# Install globally
npm install -g bestlocator

# Set up AI enhancement (optional)
bestlocator ai-setup

# Start generating intelligent selectors
bestlocator pick-toggle https://saucedemo.com --ai --explain

# Generate single selector with AI
bestlocator pick https://your-app.com --ai

# Get help
bestlocator --help
```

## Why Best-Locator 2.0?

**Traditional selector generators are broken.** They force you to capture elements immediately, can't handle login flows, and generate unreliable selectors.

**Best-Locator 2.0 changes everything:**

- **AI-Enhanced Selection** - Powered by Ollama for intelligent selector generation
- **Navigate Organically** - Browse like a normal user, login, navigate between pages
- **Toggle Selector Mode** - Turn element capture ON/OFF with simple keyboard shortcuts
- **Professional Selectors** - Prioritizes data-test, aria-label, and testing-specific attributes
- **Multi-Page Capture** - Collect selectors from different pages in one session
- **Framework Agnostic** - Works with Playwright, Selenium, Cypress, and more
- **AI Explanations** - Understand why each selector was chosen
- **Intelligent Fallback** - AI fails gracefully to traditional methods

## Installation

### Global Installation (Recommended)

```bash
npm install -g bestlocator
```

### Verify Installation

```bash
bestlocator hello
# Expected: Best-Locator v2.0.0 is working!
```

### Set Up AI Enhancement (Optional)

```bash
# Configure AI with Ollama
bestlocator ai-setup

# Test AI functionality
bestlocator ai-test
# Expected: AI is working! Model: llama3.1:8b
```

**AI Requirements:**
- Ollama installed and running
- Model: llama3.1:8b (default) or any compatible model
- 8GB+ RAM recommended for optimal performance

## Usage

### Toggle Mode with AI (Recommended)

The breakthrough feature that makes Best-Locator unique:

```bash
bestlocator pick-toggle https://saucedemo.com --ai --explain
```

**How it works:**
1. **Navigate freely** - Login, browse, interact normally
2. **Press CTRL+S** - Turn ON selector mode (green indicator)
3. **Click elements** - AI analyzes and captures intelligent selectors
4. **Press CTRL+D** - Turn OFF selector mode (red indicator)
5. **Repeat as needed** - Navigate to other pages, toggle on/off
6. **Press ESC** - Finish and get all selectors with AI explanations

**Visual indicators:**
- **Red outline**: Navigate freely (clicks work normally)
- **Green outline**: AI selector mode ON (clicks capture elements with AI analysis)

### Single Element Mode with AI

```bash
bestlocator pick https://your-app.com --ai --explain
```

**AI-Enhanced Output:**
```typescript
// Generated Code:
await page.locator('[data-test="username"]')

// AI Analysis:
Type: ai-enhanced
Confidence: 92%
Explanation: Login form username field with stable test attribute. 
High reliability due to testing-specific data-test attribute.
Risk factors: None detected
```

### Multiple Elements Mode

```bash
bestlocator pick-multiple https://your-app.com --ai
```

### Validate Existing Selectors

```bash
bestlocator validate https://your-app.com '[data-test="username"]'
```

## AI Features

### AI-Enhanced Selector Generation

Best-Locator 2.0 uses advanced AI to analyze page context and generate intelligent selectors:

```bash
# Basic AI usage
bestlocator pick https://app.com --ai

# AI with detailed explanations
bestlocator pick https://app.com --ai --explain

# Traditional fallback (no AI)
bestlocator pick https://app.com
```

### AI Analysis Output

**Traditional Selector:**
```
Type: data-test
Confidence: 95%
Selector: [data-test="username"]
```

**AI-Enhanced Selector:**
```
Type: ai-enhanced
Confidence: 92%
Selector: [data-test="username"]
AI Explanation: Login form username field with stable test attribute. 
High reliability due to testing-specific data-test attribute.
Risk factors: None detected
```

### AI Setup and Configuration

```bash
# Initial AI setup
bestlocator ai-setup
# Guides you through Ollama installation and model setup

# Test AI functionality
bestlocator ai-test
# Verifies AI is working correctly

# Check AI status
bestlocator config
# Shows AI configuration status
```

## Framework Support

| Framework | JavaScript | TypeScript | Python | Java | C# |
|-----------|------------|------------|--------|------|----|
| **Playwright** | Yes | Yes | Yes | Yes | Yes |
| **Selenium** | Yes | Yes | Yes | Yes | Yes |
| **Cypress** | Yes | Yes | No | No | No |

```bash
# Specify framework and language with AI
bestlocator pick-toggle https://your-app.com playwright typescript --ai
bestlocator pick https://your-app.com selenium python --ai
bestlocator pick https://your-app.com cypress javascript --ai
```

## Intelligent Selector Priority

Best-Locator 2.0 generates **AI-enhanced selectors** using advanced analysis:

| Priority | Selector Type | Confidence | AI Enhancement | Example |
|----------|---------------|------------|----------------|---------|
| **1st** | `data-test` | 95% | Context analysis | `[data-test="username"]` |
| **1st** | `data-testid` | 95% | Framework detection | `[data-testid="submit-btn"]` |
| **2nd** | `data-cy` | 90% | Pattern recognition | `[data-cy="login-form"]` |
| **3rd** | `aria-label` | 85% | Accessibility analysis | `[aria-label="Close dialog"]` |
| **4th** | `role` | 80% | Semantic understanding | `[role="button"]` |
| **5th** | `name` | 75% | Form field analysis | `[name="email"]` |
| **6th** | `id` | 70% | Stability assessment | `#username` |
| **7th** | `text` | 60% | Content analysis | `text="Sign In"` |

## Configuration

### Create Configuration File

```bash
bestlocator init
```

This creates `best-locator.config.json`:

```json
{
  "defaultFramework": "playwright",
  "defaultLanguage": "typescript",
  
  "ai": {
    "enabled": true,
    "model": "llama3.1:8b",
    "baseUrl": "http://localhost:11434",
    "timeout": 30000,
    "fallbackToTraditional": true
  },
  
  "browser": {
    "headless": false,
    "viewport": {
      "width": 1280,
      "height": 720
    }
  },
  
  "timeouts": {
    "pageLoad": 30000,
    "elementSelection": 1800000,
    "validation": 15000
  },
  
  "projectAttributes": [
    "data-testid",
    "data-cy", 
    "data-test",
    "data-qa"
  ],
  
  "urls": {
    "local": "http://localhost:3000",
    "staging": "https://staging.myapp.com",
    "prod": "https://myapp.com"
  }
}
```

### Using URL Aliases

```bash
bestlocator pick-toggle local --ai     # Uses http://localhost:3000
bestlocator pick staging --ai          # Uses staging URL
```

## Real-World Examples

### Login Flow Testing with AI

```bash
# Navigate to login, authenticate, then capture dashboard elements
bestlocator pick-toggle https://app.com --ai --explain
# 1. Login normally
# 2. Navigate to dashboard  
# 3. Press CTRL+S to start AI-powered capturing
# 4. Click elements - AI analyzes context and stability
# 5. Press ESC to finish with explanations
```

**AI-Enhanced Output:**
```typescript
// Element 1: Username Field
await page.locator('[data-test="username"]')
// AI: Login form field with test attribute, 94% confidence
// Risk factors: None detected

// Element 2: Password Field  
await page.locator('[data-test="password"]')
// AI: Password input with semantic type, 93% confidence
// Risk factors: None detected

// Element 3: Submit Button
await page.locator('[data-test="login-button"]')
// AI: Form submission button with stable identifier, 95% confidence
// Risk factors: None detected
```

### E-commerce Flow with AI Context

```bash
bestlocator pick-toggle https://shop.com --ai --explain
# 1. Browse products (CTRL+D = selector mode OFF)
# 2. CTRL+S = AI analyzes product page context
# 3. Navigate to cart - AI maintains context across pages
# 4. CTRL+S = AI captures cart-specific elements
# 5. ESC = get all selectors with intelligent explanations
```

### Traditional vs AI-Enhanced

**Traditional tools generate:**
```javascript
await page.locator('#user-name')              // Unreliable
await page.locator('#password')               // Can change
await page.locator('#login-button')           // Styling dependent
```

**Best-Locator AI generates:**
```javascript
await page.locator('[data-test="username"]')     // 94% AI confidence
await page.locator('[data-test="password"]')     // Context-aware
await page.locator('[data-test="login-button"]') // Risk-assessed
```

## Command Reference

### Core Commands

```bash
# AI-Enhanced Selection
bestlocator pick <url> [framework] [language] [--ai] [--explain]
bestlocator pick-multiple <url> [framework] [language] [--ai]  
bestlocator pick-toggle <url> [framework] [language] [--ai] [--explain]

# Validation
bestlocator validate <url> <selector> [--timeout <ms>]

# Configuration
bestlocator init                          # Create config file
bestlocator config                        # Show current config

# AI Management
bestlocator ai-setup                      # Configure AI
bestlocator ai-test                       # Test AI functionality

# Utilities
bestlocator hello                         # Test installation
bestlocator --version                     # Show version
bestlocator --help                        # Show help
```

### Command Flags

- `--ai`: Enable AI-enhanced selector generation
- `--explain`: Include AI explanations for selector choices
- `--timeout <ms>`: Set custom timeout for validation

### Examples with All Options

```bash
# Single element with AI and explanations
bestlocator pick https://app.com playwright typescript --ai --explain

# Multiple elements with AI
bestlocator pick-multiple https://app.com selenium python --ai

# Toggle mode with all features
bestlocator pick-toggle https://app.com cypress javascript --ai --explain

# Validation with custom timeout
bestlocator validate https://app.com '[data-test="button"]' --timeout 30000
```

## Troubleshooting

### Browser Not Opening
```bash
# Install Playwright browsers
npx playwright install
```

### AI Not Working

**Check AI Status:**
```bash
bestlocator ai-test
```

**Common AI Issues:**
- **Ollama not installed**: Install from https://ollama.ai
- **Ollama not running**: Start with `ollama serve`
- **Model not available**: Download with `ollama pull llama3.1:8b`
- **Port conflicts**: Check if port 11434 is available

**Manual AI Setup:**
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama service
ollama serve

# Download AI model
ollama pull llama3.1:8b

# Test Best-Locator AI
bestlocator ai-test
```

### Command Not Found
```bash
# Verify global installation
npm list -g bestlocator

# Reinstall if needed
npm uninstall -g bestlocator
npm install -g bestlocator
```

### Performance Issues

**For Better AI Performance:**
- Use machines with 8GB+ RAM
- Close unnecessary applications
- Use lighter AI models if needed:
  ```bash
  # In config file, change ai.model to:
  "model": "llama3.1:8b"  # Default (recommended)
  "model": "phi3:mini"    # Lighter option
  ```

### Session Expires Too Quickly

Extend session time in your config:
```json
{
  "timeouts": {
    "elementSelection": 3600000  // 1 hour
  }
}
```

### Browser Opens Too Large

Control browser size in config:
```json
{
  "browser": {
    "viewport": {
      "width": 1024,
      "height": 768
    }
  }
}
```

## Use Cases

### QA Engineers
- Generate AI-verified selectors for manual testing
- Get explanations for why selectors were chosen
- Validate existing test selectors with AI insights
- Create selectors for complex multi-page flows

### Automation Engineers  
- Build robust test suites with AI-enhanced selectors
- Handle login flows and authenticated pages intelligently
- Generate selectors optimized for multiple testing frameworks
- Reduce test flakiness with AI stability analysis

### Development Teams
- Standardize intelligent selector generation across projects
- Reduce test maintenance with AI-verified stable selectors
- Speed up test creation with context-aware generation
- Get instant feedback on selector reliability

## Advanced Configuration

### AI Model Options

Best-Locator supports multiple AI models via Ollama:

```json
{
  "ai": {
    "model": "llama3.1:8b",     // Default (recommended)
    "model": "phi3:mini",       // Lighter, faster
    "model": "codellama:7b",    // Code-focused
    "model": "mistral:7b"       // Alternative option
  }
}
```

### Custom AI Endpoints

```json
{
  "ai": {
    "baseUrl": "http://localhost:11434",  // Default Ollama
    "baseUrl": "http://custom-ai:8080",   // Custom endpoint
    "timeout": 30000,                     // Request timeout
    "retries": 3                         // Retry attempts
  }
}
```

### Framework-Specific Configuration

```json
{
  "frameworks": {
    "playwright": {
      "defaultLanguage": "typescript",
      "preferredSelectors": ["data-testid", "data-test"]
    },
    "cypress": {
      "defaultLanguage": "javascript", 
      "preferredSelectors": ["data-cy", "data-test"]
    }
  }
}
```

## Contributing

We welcome contributions! Areas where you can help:

- **AI Model Integration**: Add support for more AI models
- **Framework Support**: Extend language and framework support  
- **Selector Intelligence**: Improve AI reasoning capabilities
- **Documentation**: Help improve guides and examples
- **Testing**: Test on different websites and scenarios

## Roadmap

### Version 2.1 (Coming Soon)
- Visual AI selector suggestions
- Cross-browser compatibility analysis
- Natural language selector generation
- Team collaboration features

### Version 2.2 (Future)
- Cloud AI integration
- Selector performance analytics  
- Auto-updating selector maintenance
- Enterprise features

## License

MIT License - see LICENSE file for details.

## Author

**Jonathan Gonzalez**  
Automation Testing Enthusiast
[LinkedIn](https://www.linkedin.com/in/jonathan-g-33607648/)

---

**Made with love for the testing community**

**Now powered by AI for the next generation of testing**

[Documentation](https://github.com/jogonzal79/best-locator) • [Report Issues](https://github.com/jogonzal79/best-locator/issues) • [Discussions](https://github.com/jogonzal79/best-locator/discussions) • [AI Setup Guide](https://github.com/jogonzal79/best-locator/wiki/AI-Setup)