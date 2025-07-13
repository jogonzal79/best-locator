# Best-Locator

> The world's first selector generator with organic navigation and intelligent toggle mode

Generate professional-grade selectors for UI testing with the reliability developers trust and the flexibility testers need.

## Why Best-Locator?

**Traditional selector generators are broken.** They force you to capture elements immediately, can't handle login flows, and generate unreliable selectors. 

**Best-Locator changes everything:**

- **Navigate organically** - Browse like a normal user, login, navigate between pages
- **Toggle selector mode** - Turn element capture ON/OFF with simple keyboard shortcuts
- **Professional selectors** - Prioritizes `data-test`, `aria-label`, and testing-specific attributes
- **Multi-page capture** - Collect selectors from different pages in one session
- **Framework agnostic** - Works with Playwright, Selenium, Cypress, and more

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/jogonzal79/best-locator
cd best-locator

# Install dependencies
npm install

# Build the project
npm run build

## ✅ **La instalación está correcta:**

# Clone the repository
git clone https://github.com/jogonzal79/best-locator
cd best-locator

# Install dependencies  
npm install

# Build the project
npm run build

# Verify Installation
npm run dev hello

# Expected output:
🎉 Hello! Best-Locator v1.0 is working!
✨ Ready to generate awesome selectors!
```

### Basic Usage

```bash
# Single element selection
npm run dev pick https://your-app.com

# Multiple elements
npm run dev pick-multiple https://your-app.com

# Toggle mode (recommended) - Navigate freely + capture when needed
npm run dev pick-toggle https://your-app.com
```

## Toggle Mode (Revolutionary)

**The breakthrough feature that makes Best-Locator unique:**

```bash
npm run dev pick-toggle https://saucedemo.com
```

**How it works:**
1. **Navigate freely** - Login, browse, interact normally
2. **Press CTRL+S** - Turn ON selector mode
3. **Click elements** - Capture high-quality selectors
4. **Press CTRL+D** - Turn OFF selector mode
5. **Repeat as needed** - Navigate to other pages, toggle on/off
6. **Press ESC** - Finish and get all selectors

**Visual indicators:**
- **Red indicator**: Navigate freely (clicks work normally)
- **Green indicator**: Selector mode ON (clicks capture elements)

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

## Real-World Example

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

## All Commands

### Core Commands

```bash
# Quick single element
npm run dev pick <url> [framework] [language]

# Multiple elements with ESC to finish
npm run dev pick-multiple <url> [framework] [language]

# Organic navigation with toggle (recommended)
npm run dev pick-toggle <url> [framework] [language]

# Validate existing selectors
npm run dev validate <url> <selector>
```

### Framework Support

```bash
# Playwright (default)
npm run dev pick https://app.com playwright typescript

# Selenium
npm run dev pick https://app.com selenium python

# Cypress
npm run dev pick https://app.com cypress javascript

# WebdriverIO
npm run dev pick https://app.com webdriverio javascript
```

### Configuration

```bash
# Create config file
npm run dev init

# View current config
npm run dev config

# Quick pick with URL alias
npm run dev go staging
```

## Configuration

Create `best-locator.config.json` in your project root:

```json
{
  "defaultFramework": "playwright",
  "defaultLanguage": "typescript",
  "browser": {
    "headless": false,
    "viewport": { "width": 1280, "height": 720 }
  },
  "urls": {
    "local": "http://localhost:3000",
    "staging": "https://staging.yourapp.com",
    "prod": "https://yourapp.com"
  },
  "projectAttributes": ["data-testid", "data-cy"],
  "timeouts": {
    "pageLoad": 30000,
    "elementSelection": 60000
  }
}
```

## Use Cases

### Login Flows
```bash
# Navigate to login, authenticate, then capture elements from dashboard
npm run dev pick-toggle https://app.com
# 1. Login normally
# 2. Navigate to dashboard
# 3. Press CTRL+S to start capturing
# 4. Click elements you need
# 5. Press ESC to finish
```

### Multi-Page Testing
```bash
# Capture elements from multiple pages in one session
npm run dev pick-toggle https://ecommerce.com
# 1. Browse products (selector mode OFF)
# 2. CTRL+S -> capture product elements
# 3. CTRL+D -> navigate to cart
# 4. CTRL+S -> capture cart elements
# 5. ESC -> get all selectors
```

### Form Testing
```bash
# Capture all form elements efficiently
npm run dev pick-multiple https://forms.com
# Click all form fields, then press ESC
```

## Output Examples

### Single Element
```bash
Element selected!
Element information:
   Tag: input
   Text: ""
   Selector: [data-test="username"]
   Code: await page.locator('[data-test="username"]')
   Confidence: 95%

Copied to clipboard!
```

### Multiple Elements
```bash
Session completed! 3 elements captured:

Element 1:
   Tag: input
   Selector: [data-test="username"]
   Code: await page.locator('[data-test="username"]')

Element 2:
   Tag: input  
   Selector: [data-test="password"]
   Code: await page.locator('[data-test="password"]')

Element 3:
   Tag: input
   Selector: [data-test="login-button"]
   Code: await page.locator('[data-test="login-button"]')

Combined test snippet:
   await page.locator('[data-test="username"]')
   await page.locator('[data-test="password"]')
   await page.locator('[data-test="login-button"]')

All code copied to clipboard!
```

## Supported Frameworks

| Framework | JavaScript | TypeScript | Python | Java | C# |
|-----------|------------|------------|--------|------|----|
| **Playwright** | Yes | Yes | Yes | Yes | Yes |
| **Selenium** | Yes | Yes | Yes | Yes | Yes |
| **Cypress** | Yes | Yes | No | No | No |



## Contributing

We welcome contributions! Please see our Contributing Guide for details.

### Development

```bash
git clone https://github.com/jogonzal79/best-locator
cd best-locator
npm install
npm run dev hello
```

## License

MIT License

---

## Why "Best-Locator"?

Because it generates the **best possible selectors** using **the best practices** with **the best user experience**. No compromises.

**Traditional approach:** Click -> Get bad selector -> Repeat  
**Best-Locator approach:** Navigate -> Login -> Browse -> Toggle ON -> Capture -> Get professional selectors

---

## Author

**Jonathan Gonzalez**  
Automation Testing Enthusiast 
[LinkedIn](https://www.linkedin.com/in/jonathan-g-33607648/)

---

**Star on GitHub** • **Documentation** • **Report Issues**

Made with love for the testing community