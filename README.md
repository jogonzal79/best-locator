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
- **Graphical User Interface** - Beautiful desktop app with premium design

## Installation

```bash
# Clone the repository
git clone https://github.com/jogonzal79/best-locator
cd best-locator

# Install dependencies
npm install

# Build the project
npm run build

# Verify Installation
npm run dev hello
```

**Expected output:**
```
Hello! Best-Locator v1.0 is working!
Ready to generate awesome selectors!
Configuration file detected!
```

## Usage Options

### Option 1: Graphical User Interface (Recommended)

Launch the beautiful desktop application:

```bash
npm run gui
```

**Features:**
- **Premium glassmorphism design** with modern UI
- **Live preview** of generated selectors
- **Visual feedback** and status indicators
- **Framework/language selection** with smart validation
- **Real-time output** with syntax highlighting
- **Copy buttons** for easy code integration
- **Target URL validation** and alias support

**How to use the GUI:**
1. Enter your target URL
2. Select framework (Playwright, Selenium, Cypress)
3. Choose language (TypeScript, JavaScript, Python, Java, C#)
4. Click your preferred capture mode:
   - **Pick Single** - Capture one element
   - **Pick Multiple** - Capture multiple elements
   - **Toggle Mode** - Navigate freely with toggle capture

### Option 2: Command Line Interface

```bash
# Single element selection
npm run dev pick https://your-app.com

# Multiple elements
npm run dev pick-multiple https://your-app.com

# Toggle mode (recommended) - Navigate freely + capture when needed
npm run dev pick-toggle https://your-app.com
```

### Framework & Language Support

| Framework | Command Example |
|-----------|-----------------|
| **Playwright** | `npm run dev pick-toggle https://your-app.com playwright typescript` |
| **Selenium** | `npm run dev pick-toggle https://your-app.com selenium python` |
| **Cypress** | `npm run dev pick-toggle https://your-app.com cypress javascript` |

**Supported Languages:**
- **Playwright:** JavaScript, TypeScript, Python, Java, C#
- **Selenium:** JavaScript, TypeScript, Python, Java, C#  
- **Cypress:** JavaScript, TypeScript

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
- **Red outline**: Navigate freely (clicks work normally)
- **Green outline**: Selector mode ON (clicks capture elements)

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

## GUI Features

### Visual Interface
- **Premium design** with glassmorphism effects
- **Responsive layout** optimized for productivity
- **Dark theme output area** for better code readability
- **Real-time validation** of inputs and combinations

### Smart Controls
- **Framework selection** with automatic language filtering
- **URL validation** with support for aliases
- **Status indicators** showing command progress
- **Copy functionality** for individual or multiple selectors

### User Experience
- **No DevTools by default** - clean interface
- **Keyboard shortcuts** clearly displayed
- **Loading states** with cancel options
- **Error handling** with clear messages

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
```

### Configuration

```bash
# Create config file
npm run dev init

# View current config
npm run dev config

# Launch GUI
npm run gui

# Launch GUI in development mode
npm run gui-dev
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

### GUI Output
The graphical interface displays generated selectors in clean, organized cards with:
- **Syntax highlighting** for better readability
- **Confidence scores** for each selector
- **Individual copy buttons** for each selector
- **Copy all functionality** for batch operations
- **Real-time feedback** during capture

### CLI Output

**Single Element:**
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

**Multiple Elements:**
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

## GUI Troubleshooting

### Common Issues

**Spinner stuck after closing browser:**
- Press `Ctrl+R` or use `View > Reload` to reset the interface

**Framework/Language validation:**
- The GUI automatically validates combinations (e.g., Cypress only supports JS/TS)
- Invalid combinations are automatically corrected

**URL validation:**
- URLs must start with `http://` or `https://`
- Aliases from config file are also supported

## Contributing

We welcome contributions! Please see our Contributing Guide for details.

### Development

```bash
git clone https://github.com/jogonzal79/best-locator
cd best-locator
npm install

# Test CLI
npm run dev hello

# Test GUI
npm run gui-dev
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