# Best-Locator

> The world's first selector generator with organic navigation and intelligent toggle mode

Generate professional-grade selectors for UI testing with the reliability developers trust and the flexibility testers need.

## Quick Start

```bash
# Install globally
npm install -g best-locator

# Start generating selectors instantly
best-locator pick-toggle https://saucedemo.com

# Generate single selector
best-locator pick https://your-app.com

# Get help
best-locator --help
```

## Why Best-Locator?

**Traditional selector generators are broken.** They force you to capture elements immediately, can't handle login flows, and generate unreliable selectors.

**Best-Locator changes everything:**

- **Navigate organically** - Browse like a normal user, login, navigate between pages
- **Toggle selector mode** - Turn element capture ON/OFF with simple keyboard shortcuts
- **Professional selectors** - Prioritizes `data-test`, `aria-label`, and testing-specific attributes
- **Multi-page capture** - Collect selectors from different pages in one session
- **Framework agnostic** - Works with Playwright, Selenium, Cypress, and more

## Installation

### Global Installation (Recommended)

```bash
npm install -g best-locator
```

### Local Installation

```bash
npm install best-locator
npx best-locator pick-toggle https://your-app.com
```

### Verify Installation

```bash
best-locator hello
# Expected: Best-Locator v1.0.0 is working!
```

## Usage

### Toggle Mode (Recommended)

The breakthrough feature that makes Best-Locator unique:

```bash
best-locator pick-toggle https://saucedemo.com
```

**How it works:**
1. **Navigate freely** - Login, browse, interact normally
2. **Press CTRL+S** - Turn ON selector mode
3. **Click elements** - Capture high-quality selectors
4. **Press CTRL+D** - Turn OFF selector mode
5. **Repeat as needed** - Navigate to other pages, toggle on/off
6. **Press ESC** - Finish and get all selectors

### Single Element Mode

```bash
best-locator pick https://your-app.com
```

### Multiple Elements Mode

```bash
best-locator pick-multiple https://your-app.com
```

### Validate Existing Selectors

```bash
best-locator validate https://your-app.com '[data-test="username"]'
```

## Framework Support

| Framework | JavaScript | TypeScript | Python | Java | C# |
|-----------|------------|------------|--------|------|----|
| **Playwright** | Yes | Yes | Yes | Yes | Yes |
| **Selenium** | Yes | Yes | Yes | Yes | Yes |
| **Cypress** | Yes | Yes | No | No | No |

```bash
# Specify framework and language
best-locator pick-toggle https://your-app.com playwright typescript
best-locator pick https://your-app.com selenium python
best-locator pick https://your-app.com cypress javascript
```

## Intelligent Selector Priority

Best-Locator generates **professional-grade selectors** using industry best practices:

| Priority | Selector Type | Confidence | Example |
|----------|---------------|------------|---------|
| 1st | `data-test` | 95% | `[data-test="username"]` |
| 1st | `data-testid` | 95% | `[data-testid="submit-btn"]` |
| 2nd | `data-cy` | 90% | `[data-cy="login-form"]` |
| 3rd | `aria-label` | 85% | `[aria-label="Close dialog"]` |
| 4th | `role` | 80% | `[role="button"]` |
| 5th | `name` | 75% | `[name="email"]` |
| 6th | `id` | 70% | `#username` |
| 7th | `text` | 60% | `text="Sign In"` |

## Configuration

Create a config file for your project:

```bash
best-locator init
```

This creates `best-locator.config.js`:

```javascript
module.exports = {
  defaultFramework: 'playwright',
  defaultLanguage: 'typescript',
  
  // Your project's test attributes
  projectAttributes: [
    'data-testid',
    'data-cy', 
    'data-test',
    'data-qa'
  ],
  
  // Frequently used URLs
  urls: {
    local: 'http://localhost:3000',
    staging: 'https://staging.myapp.com',
    prod: 'https://myapp.com'
  }
};
```

Then use URL aliases:

```bash
best-locator pick-toggle local      # Uses http://localhost:3000
best-locator pick staging           # Uses staging URL
```

## Real-World Examples

### Login Flow Testing

```bash
# Navigate to login, authenticate, then capture dashboard elements
best-locator pick-toggle https://app.com
# 1. Login normally
# 2. Navigate to dashboard  
# 3. Press CTRL+S to start capturing
# 4. Click elements you need
# 5. Press ESC to finish
```

**Generated Output:**
```typescript
await page.locator('[data-test="username"]')
await page.locator('[data-test="password"]')
await page.locator('[data-test="login-button"]')
await page.locator('[data-testid="dashboard-menu"]')
```

### Multi-Page E-commerce Testing

```bash
best-locator pick-toggle https://shop.com
# 1. Browse products (CTRL+D = selector mode OFF)
# 2. CTRL+S = capture product elements
# 3. Navigate to cart
# 4. CTRL+S = capture cart elements
# 5. ESC = get all selectors from both pages
```

## Advanced Usage

### Custom Framework/Language

```bash
best-locator pick-toggle https://app.com selenium python
```

### Validation with Timeout

```bash
best-locator validate https://app.com '[data-test="button"]' --timeout 30000
```

### View Current Config

```bash
best-locator config
```

## Troubleshooting

### Browser Not Opening
```bash
# Install Playwright browsers
npx playwright install
```

### Command Not Found
```bash
# Verify global installation
npm list -g best-locator

# Reinstall if needed
npm uninstall -g best-locator
npm install -g best-locator
```

### Permission Errors
- **macOS/Linux**: Run with `sudo npm install -g best-locator`
- **Windows**: Run Command Prompt as Administrator

## All Commands

```bash
# Core Commands
best-locator pick <url>                    # Single element
best-locator pick-multiple <url>           # Multiple elements  
best-locator pick-toggle <url>             # Toggle mode (recommended)
best-locator validate <url> <selector>     # Validate selector

# Configuration
best-locator init                          # Create config file
best-locator config                        # Show current config

# Utilities
best-locator hello                         # Test installation
best-locator --version                     # Show version
best-locator --help                        # Show help
```

## Contributing

We welcome contributions! Please see our Contributing Guide for details.

## License

MIT License - see LICENSE file for details.

---

**Made with love for the testing community**

[Documentation](https://github.com/jogonzal79/best-locator) • [Report Issues](https://github.com/jogonzal79/best-locator/issues) • [Discussions](https://github.com/jogonzal79/best-locator/discussions)