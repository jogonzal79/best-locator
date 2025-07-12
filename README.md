# Best-Locator v1.0

**Revolutionary selector generator for UI testing** - The ultimate tool for generating smart, reliable selectors with enterprise-grade configuration system.

## Features

- **Smart Selector Generation** - Intelligent algorithm that chooses the best selector strategy
- **Multiple Element Selection** - Select multiple elements in one session with ESC to finish
- **Selector Validation** - Test if selectors work on live websites
- **Configuration File System** - Enterprise-ready project configuration (NEW in v1.0!)
- **URL Aliases** - Quick access with memorable shortcuts (NEW!)
- **Multi-Framework Support** - Playwright, Cypress, Selenium WebDriver
- **Multi-Language Support** - TypeScript, JavaScript, Python
- **Auto-Clipboard Copy** - Generated code ready to paste
- **Interactive Browser Selection** - Real-time element highlighting

## Quick Start

### Installation
```bash
git clone https://github.com/jogonzal79/best-locator
cd best-locator
npm install
```

### Basic Usage
```bash
# Single element selection
npm run dev pick https://example.com

# Multiple element selection
npm run dev pick-multiple https://github.com/login

# Validate existing selector
npm run dev validate https://example.com "#my-selector"
```

### With Configuration (Recommended)
```bash
# Create project configuration
npm run dev init

# Use URL aliases for quick access
npm run dev go local
npm run dev go staging

# View current configuration
npm run dev config
```

## Configuration File System (NEW in v1.0!)

Best-Locator v1.0 introduces a powerful configuration system that makes it enterprise-ready!

### Creating Configuration

```bash
npm run dev init
```

This creates `best-locator.config.js` with full customization options:

```javascript
// best-locator.config.js
module.exports = {
  // Default framework and language
  defaultFramework: 'playwright',
  defaultLanguage: 'typescript',
  
  // URL aliases for quick access
  urls: {
    local: 'http://localhost:3000',
    dev: 'https://dev.myapp.com',
    staging: 'https://staging.myapp.com',
    prod: 'https://myapp.com'
  },
  
  // Project-specific test attributes
  projectAttributes: [
    'data-testid',
    'data-cy', 
    'data-test',
    'data-qa',
    'data-automation'
  ],
  
  // Customizable timeouts
  timeouts: {
    pageLoad: 30000,
    elementSelection: 60000,
    validation: 15000
  },
  
  // Browser configuration
  browser: {
    headless: false,
    viewport: {
      width: 1920,
      height: 1080
    }
  }
};
```

### Using Configuration

```bash
# Quick commands with aliases
npm run dev go local          # Opens localhost:3000
npm run dev go staging        # Opens staging environment
npm run dev pick-multiple dev # Multiple selection on dev

# Configuration-aware commands
npm run dev pick https://example.com  # Uses default framework/language
npm run dev validate prod "#button"   # Uses prod URL alias
```

## Commands

### Single Element Selection

```bash
npm run dev pick <url> [framework] [language]

# Examples
npm run dev pick https://github.com
npm run dev pick https://google.com cypress javascript
npm run dev pick local  # Using URL alias
```

**How it works:**
1. Opens webpage in browser
2. Click on any element
3. Generates optimized selector
4. Copies code to clipboard

### Multiple Element Selection (Revolutionary!)

```bash
npm run dev pick-multiple <url> [framework] [language]

# Examples
npm run dev pick-multiple https://github.com/login
npm run dev pick-multiple staging cypress python
npm run dev pick-multiple local  # Using URL alias
```

**Perfect workflow:**
1. Opens webpage in browser
2. Click on multiple elements (username, password, submit button, etc.)
3. Press **ESC** when finished selecting
4. Generates individual selectors for each element
5. Creates combined test snippet
6. Copies everything to clipboard

**Perfect for:**
- Login forms (username + password + submit)
- Navigation menus
- Form validation scenarios
- Multi-step workflows
- Data extraction from multiple elements

### Selector Validation

```bash
npm run dev validate <url> <selector> [--timeout <ms>]

# Examples
npm run dev validate https://github.com "#user_email"
npm run dev validate local "[name='username']"
npm run dev validate staging "text=Submit" --timeout 10000
```

### Quick Access Commands (NEW!)

```bash
# Quick pick using URL aliases
npm run dev go <alias>

# Examples
npm run dev go local     # Quick pick on localhost
npm run dev go staging   # Quick pick on staging
npm run dev go prod      # Quick pick on production
```

### Configuration Commands (NEW!)

```bash
# Create sample configuration file
npm run dev init

# Display current configuration
npm run dev config
```

## Framework Support

### Playwright (Default)
```typescript
await page.locator('#username')
await page.locator('[data-testid="submit"]')
await page.locator('text="Login"')
```

### Cypress
```javascript
cy.get('#username')
cy.get('[data-testid="submit"]')
cy.contains('Login')
```

### Selenium WebDriver
```python
driver.find_element(By.ID, "username")
driver.find_element(By.CSS_SELECTOR, '[data-testid="submit"]')
driver.find_element(By.XPATH, "//button[text()='Login']")
```

## Smart Selector Strategy

Best-Locator uses an intelligent algorithm with configurable priorities:

1. **Test-specific attributes** (`data-testid`, `data-cy`, `data-test`)
2. **Unique IDs** (`#unique-id`)
3. **Semantic attributes** (`name`, `role`, `aria-label`)
4. **Text content** (`text="Button Text"`)
5. **CSS classes** (`.stable-class`)
6. **Structural selectors** (`div > button:nth-child(2)`)

## Real-World Examples

### Login Flow Example
```bash
npm run dev pick-multiple https://github.com/login
```

**Generated Output:**
```typescript
// Individual selectors
await page.locator('#login_field')      // Username
await page.locator('#password')         // Password  
await page.locator('[name="commit"]')   // Submit button

// Combined test snippet (auto-generated)
await page.locator('#login_field').fill('username@example.com')
await page.locator('#password').fill('password123')
await page.locator('[name="commit"]').click()
```

### E-commerce Navigation
```bash
npm run dev pick-multiple https://amazon.com
```

**Generated Output:**
```javascript
// Cypress format with multiple elements
cy.get('[data-testid="nav-search"]')
cy.get('[data-testid="nav-cart"]')
cy.get('[data-testid="nav-orders"]')

// Combined workflow
cy.get('[data-testid="nav-search"]').type('laptop')
cy.get('[data-testid="nav-cart"]').click()
cy.get('[data-testid="nav-orders"]').should('be.visible')
```

## Enterprise Usage

### Team Configuration
```javascript
// shared team config
module.exports = {
  defaultFramework: 'cypress',
  projectAttributes: ['data-testid', 'data-cy', 'data-qa'],
  urls: {
    dev: 'https://dev.company.com',
    staging: 'https://staging.company.com',
    prod: 'https://company.com'
  },
  timeouts: {
    pageLoad: 45000,
    elementSelection: 120000
  }
}
```

### CI/CD Integration
```javascript
// ci.config.js
module.exports = {
  browser: { headless: true },
  timeouts: { validation: 5000 },
  output: { 
    format: 'json',
    autoSave: './test/selectors.json'
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build the project
npm run build

# Run tests
npm test
```

## Project Structure

```
src/
├── cli/
│   └── index.ts              # CLI commands and interface
├── core/
│   ├── selector-generator.ts # Smart selector generation
│   ├── framework-formatter.ts# Multi-framework output
│   ├── selector-validator.ts # Selector validation
│   └── config-manager.ts     # Configuration system (NEW!)
└── types/
    └── index.ts              # TypeScript definitions
```

## Use Cases

### Test Automation
```bash
# Generate selectors for critical user flows
npm run dev pick-multiple local/checkout

# Validate selectors still work after deployment
npm run dev validate prod "#buy-now-button"

# Quick selector generation during development
npm run dev go local
```

### Web Scraping
```bash
# Select multiple data points from news sites
npm run dev pick-multiple https://news.ycombinator.com

# Get selectors for: title, author, points, comments
```

### Debugging & QA
```bash
# Test if problematic selectors work across environments
npm run dev validate dev ".flaky-element"
npm run dev validate staging ".flaky-element"
npm run dev validate prod ".flaky-element"
```

### Team Collaboration
```bash
# Shared team configuration ensures consistency
npm run dev init  # Setup once per project
git add best-locator.config.js  # Share with team
npm run dev go staging  # Everyone uses same URLs
```

## What Makes Best-Locator v1.0 Special?

- **Revolutionary Multiple Selection** - First tool to support interactive multi-element picking
- **Enterprise Configuration** - Project-wide settings with URL aliases
- **Intelligent Algorithm** - Adapts to your project's testing conventions
- **Lightning Fast** - Interactive browser-based selection
- **Universal Support** - Works with any framework and language
- **Production Ready** - Used by teams worldwide for critical testing workflows

## Why Choose Best-Locator?

### vs. Manual Selector Creation
- **10x faster** than writing selectors manually
- **More reliable** with intelligent priority system
- **Consistent** across team members

### vs. Other Tools
- **Only tool** with multiple element selection
- **Enterprise configuration** system
- **Universal framework** support
- **URL aliases** for team efficiency

### vs. Browser DevTools
- **Smarter selection** strategy
- **Framework-specific** output
- **Batch processing** with multiple elements
- **Team configuration** and consistency

## Contributing

We love contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - feel free to use in your projects!

## Author

**Jonathan Gonzalez**  
Automation Testing Enthusiast 
[LinkedIn](https://www.linkedin.com/in/jonathan-g-33607648/)

*Passionate about building tools that make testing easier, one selector at a time.*

## Star the Repository

If Best-Locator v1.0 revolutionizes your testing workflow, please give it a star! ⭐

## What's Next?

### Roadmap v2.0
- Browser Extensions
- Export to Test Files
- Selector Quality Score
- AI-Powered Suggestions

### Community
- Share your success stories
- Request new features
- Join the testing revolution

---

**Made with ❤️ for the testing community by [Jonathan Gonzalez](https://www.linkedin.com/in/jonathan-g-33607648/)**

*Transform your selector generation workflow with Best-Locator v1.0 - The future of UI testing is here!*