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

### Prerequisites

- **Node.js** version 16 or higher
- **NPM** (comes with Node.js)
- **Git** (for cloning the repository)

### Basic Installation

```bash
# Clone the repository
git clone https://github.com/jogonzal79/best-locator
cd best-locator

# Install dependencies
npm install

# Build the project
npm run build

# Install browser dependencies
npx playwright install

# Verify Installation
npm run dev hello
```

**Expected output:**
```
Hello! Best-Locator v1.0 is working!
Ready to generate awesome selectors!
Configuration file detected!
```

### Installation Troubleshooting

#### Windows Users - Common Issues

**Issue 1: TypeScript compilation fails**

If you get `ERR_UNKNOWN_FILE_EXTENSION` errors:

```cmd
# Check if tsconfig.json exists
type tsconfig.json

# If missing or incorrect, create proper tsconfig.json:
```

Create `tsconfig.json` with this content:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": false,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": false,
    "outDir": "./dist",
    "rootDir": "./src",
    "allowJs": true
  },
  "include": [
    "src/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

**Issue 2: "No inputs were found" during build**

```cmd
# Install TypeScript globally
npm install -g typescript

# Rebuild the project
npm run build
```

**Issue 3: Script configuration error**

If `npm run dev` tries to run `.ts` files directly, edit `package.json`:

Find the `"scripts"` section and change:
```json
"dev": "ts-node --esm src/cli/index.ts"
```

To:
```json
"dev": "node dist/cli/index.js"
```

**Issue 4: Browser executable not found**

```cmd
# Install Playwright browsers
npx playwright install

# Or install only Chromium (faster)
npx playwright install chromium
```

**Issue 5: Permission errors on Windows**

Run Command Prompt or PowerShell as Administrator, then repeat installation steps.

#### Verification Steps

After installation, verify everything works:

```bash
# 1. Test basic functionality
npm run dev hello

# 2. Test browser launching
npm run dev pick-toggle https://saucedemo.com

# 3. Test GUI
npm run gui
```

If any step fails, refer to the specific issue above.

## Quick Start

**Try Best-Locator in 30 seconds:**

```bash
# Launch the beautiful GUI
npm run gui

# Or use CLI directly
npm run dev pick-toggle https://saucedemo.com
```

**In the GUI:**
1. Enter URL: `https://saucedemo.com`
2. Select: Playwright + TypeScript 
3. Click: **Toggle Mode**
4. Navigate freely, press CTRL+S to capture, ESC to finish

**Get professional selectors instantly!**

## Usage Options

### Option 1: Graphical User Interface (Recommended)

```bash
npm run gui
```

**Modern desktop app with:**
- Premium glassmorphism design
- Live preview of generated selectors
- Framework/language selection with smart validation
- Real-time output with syntax highlighting
- Copy buttons for easy integration

### Option 2: Command Line Interface

```bash
# Single element
npm run dev pick https://your-app.com

# Multiple elements  
npm run dev pick-multiple https://your-app.com

# Toggle mode (recommended)
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
- **Red outline**: Navigate freely (clicks work normally)
- **Green outline**: Selector mode ON (clicks capture elements)

**Key Feature: Navigation Persistence**
- Toggle mode works across page navigation
- Login flows are fully supported
- Selectors can be captured from multiple pages in one session

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

## Framework & Language Support

| Framework | JavaScript | TypeScript | Python | Java | C# |
|-----------|------------|------------|--------|------|----|
| **Playwright** | Yes | Yes | Yes | Yes | Yes |
| **Selenium** | Yes | Yes | Yes | Yes | Yes |
| **Cypress** | Yes | Yes | No | No | No |

**Command Examples:**

| Framework | Command Example |
|-----------|-----------------|
| **Playwright** | `npm run dev pick-toggle https://your-app.com playwright typescript` |
| **Selenium** | `npm run dev pick-toggle https://your-app.com selenium python` |
| **Cypress** | `npm run dev pick-toggle https://your-app.com cypress javascript` |

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

**Configuration Commands:**
```bash
# Create config file
npm run dev init

# View current config
npm run dev config

# Launch GUI in development mode
npm run gui-dev
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

**Command execution fails:**
- Ensure the project is built: `npm run build`
- Verify CLI works first: `npm run dev hello`
- Check browser installation: `npx playwright install`

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