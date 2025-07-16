# Best-Locator

> The world's first selector generator with organic navigation and intelligent toggle mode

Generate professional-grade selectors for UI testing with the reliability developers trust and the flexibility testers need.

## Quick Start

```bash
# Install globally
npm install -g bestlocator

# Start generating selectors instantly
bestlocator pick-toggle https://saucedemo.com

# Generate single selector
bestlocator pick https://your-app.com

# Get help
bestlocator --help
```

## Why Best-Locator?

**Traditional selector generators are broken.** They force you to capture elements immediately, can't handle login flows, and generate unreliable selectors.

**Best-Locator changes everything:**

- **Navigate organically** - Browse like a normal user, login, navigate between pages
- **Toggle selector mode** - Turn element capture ON/OFF with simple keyboard shortcuts
- **Professional selectors** - Prioritizes `data-test`, `aria-label`, and testing-specific attributes
- **Multi-page capture** - Collect selectors from different pages in one session
- **Framework agnostic** - Works with Playwright, Selenium, Cypress, and more
- **30-minute sessions** - Plenty of time to navigate and capture elements

## Installation

### Global Installation (Recommended)

```bash
npm install -g bestlocator
```

### Local Installation

```bash
npm install bestlocator
npx bestlocator pick-toggle https://your-app.com
```

### Verify Installation

```bash
bestlocator hello
# Expected: Best-Locator v1.1.0 is working!
```

## Usage

### Toggle Mode (Recommended)

The breakthrough feature that makes Best-Locator unique:

```bash
bestlocator pick-toggle https://saucedemo.com
```

**How it works:**
1. **Navigate freely** - Login, browse, interact normally
2. **Press CTRL+S** - Turn ON selector mode
3. **Click elements** - Capture high-quality selectors
4. **Press CTRL+D** - Turn OFF selector mode
5. **Repeat as needed** - Navigate to other pages, toggle on/off
6. **Press ESC** - Finish and get all selectors

**Visual indicators:**
- **Red outline**: Navigate freely (clicks work normally)
- **Green outline**: Selector mode ON (clicks capture elements)

### Single Element Mode

```bash
bestlocator pick https://your-app.com
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
|-----------|------------|------------|--------|------|----|
| **Playwright** | Yes | Yes | Yes | Yes | Yes |
| **Selenium** | Yes | Yes | Yes | Yes | Yes |
| **Cypress** | Yes | Yes | No | No | No |

```bash
# Specify framework and language
bestlocator pick-toggle https://your-app.com playwright typescript
bestlocator pick https://your-app.com selenium python
bestlocator pick https://your-app.com cypress javascript
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
bestlocator init
```

This creates `best-locator.config.js`:

```javascript
module.exports = {
  defaultFramework: 'playwright',
  defaultLanguage: 'typescript',
  
  // Browser settings
  browser: {
    headless: false,
    viewport: {
      width: 1280,
      height: 720
    }
  },
  
  // Session timeouts
  timeouts: {
    pageLoad: 30000,        // 30 seconds to load page
    elementSelection: 1800000, // 30 minutes for user interaction
    validation: 15000      // 15 seconds to validate selectors
  },
  
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
bestlocator pick-toggle local      # Uses http://localhost:3000
bestlocator pick staging           # Uses staging URL
```

## Real-World Examples

### Login Flow Testing

```bash
# Navigate to login, authenticate, then capture dashboard elements
bestlocator pick-toggle https://app.com
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
bestlocator pick-toggle https://shop.com
# 1. Browse products (CTRL+D = selector mode OFF)
# 2. CTRL+S = capture product elements
# 3. Navigate to cart
# 4. CTRL+S = capture cart elements
# 5. ESC = get all selectors from both pages
```

### Traditional vs Best-Locator

**Traditional tools generate:**
```javascript
await page.locator('#user-name')              // Unreliable
await page.locator('#password')               // Can change
await page.locator('#login-button')           // Styling dependent
```

**Best-Locator generates:**
```javascript
await page.locator('[data-test="username"]')     // 95% reliable
await page.locator('[data-test="password"]')     // Testing-specific
await page.locator('[data-test="login-button"]') // Industry standard
```

## Advanced Usage

### Custom Framework/Language

```bash
bestlocator pick-toggle https://app.com Cypress JavaScript
bestlocator pick-toggle <url> <framework> <language>

```

### Validation with Timeout

```bash
bestlocator validate https://app.com '[data-test="button"]' --timeout 30000
```

### View Current Config

```bash
bestlocator config
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
npm list -g bestlocator

# Reinstall if needed
npm uninstall -g bestlocator
npm install -g bestlocator
```

### Permission Errors
- **macOS/Linux**: Run with `sudo npm install -g bestlocator`
- **Windows**: Run Command Prompt as Administrator

### Browser Opens Too Large
Create a config file to control browser size:
```bash
bestlocator init
# Then edit best-locator.config.js to set viewport size
```

### Session Expires Too Quickly
Best-Locator gives you 30 minutes by default. Extend it in your config:
```javascript
timeouts: {
  elementSelection: 3600000  // 1 hour
}
```

## All Commands

```bash
# Core Commands
bestlocator pick <url>                    # Single element
bestlocator pick-multiple <url>           # Multiple elements  
bestlocator pick-toggle <url>             # Toggle mode (recommended)
bestlocator validate <url> <selector>     # Validate selector

# Configuration
bestlocator init                          # Create config file
bestlocator config                        # Show current config

# Utilities
bestlocator hello                         # Test installation
bestlocator --version                     # Show version
bestlocator --help                        # Show help
```

## Use Cases

### QA Engineers
- Generate reliable selectors for manual testing
- Validate existing test selectors
- Create selectors for complex multi-page flows

### Automation Engineers  
- Build robust test suites with high-quality selectors
- Handle login flows and authenticated pages
- Generate selectors for multiple testing frameworks

### Development Teams
- Standardize selector generation across projects
- Reduce test flakiness with better selectors
- Speed up test creation and maintenance

## Contributing

We welcome contributions! Please see our Contributing Guide for details.

## License

MIT License - see LICENSE file for details.

## Author

**Jonathan Gonzalez**  
Automation Testing Enthusiast 
[LinkedIn](https://www.linkedin.com/in/jonathan-g-33607648/)

---

**Made with love for the testing community**

[Documentation](https://github.com/jogonzal79/best-locator) • [Report Issues](https://github.com/jogonzal79/best-locator/issues) • [Discussions](https://github.com/jogonzal79/best-locator/discussions)