# 🎯 Best-Locator

**Universal selector generator for UI testing** - The ultimate tool for generating smart, reliable selectors for Playwright, Cypress, and Selenium.

## ✨ Features

- 🧠 **Smart Selector Generation** - Intelligent algorithm that chooses the best selector strategy
- 🔍 **Selector Validation** - Test if selectors work on live websites
- 🚀 **Multiple Element Selection** - Select multiple elements in one session *(NEW!)*
- 🎭 **Multi-Framework Support** - Playwright, Cypress, Selenium WebDriver
- 🌐 **Multi-Language Support** - TypeScript, JavaScript, Python
- 📋 **Auto-Clipboard Copy** - Generated code ready to paste
- ⚡ **Fast & Interactive** - Real-time element selection in browser

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Single element selection
npm run dev pick https://example.com

# Multiple element selection (NEW!)
npm run dev pick-multiple https://example.com

# Validate existing selector
npm run dev validate https://example.com "#my-selector"
```

## 📖 Commands

### 🎯 Single Element Selection

Pick one element and generate its selector:

```bash
npm run dev pick <url> [framework] [language]

# Examples
npm run dev pick https://github.com
npm run dev pick https://google.com playwright typescript
npm run dev pick https://example.com cypress javascript
```

**How it works:**
1. Opens the webpage in browser
2. Click on any element
3. Generates optimized selector
4. Copies code to clipboard

### 🔥 Multiple Element Selection *(NEW!)*

Select multiple elements in one session - perfect for forms, navigation, and complex workflows:

```bash
npm run dev pick-multiple <url> [framework] [language]

# Examples
npm run dev pick-multiple https://github.com/login
npm run dev pick-multiple https://example.com cypress python
```

**How it works:**
1. Opens the webpage in browser
2. Click on multiple elements (username, password, submit button, etc.)
3. Press **ESC** when finished selecting
4. Generates individual selectors for each element
5. Creates combined test snippet
6. Copies everything to clipboard

**Perfect for:**
- 📝 Login forms (username + password + submit)
- 🧭 Navigation menus
- ✅ Form validation scenarios
- 🔄 Multi-step workflows
- 📊 Data extraction from multiple elements

### ✅ Selector Validation

Test if a selector works on a live webpage:

```bash
npm run dev validate <url> <selector>

# Examples
npm run dev validate https://github.com "#user_email"
npm run dev validate https://google.com "[name='q']"
npm run dev validate https://example.com "text=Click me" --timeout 10000
```

## 🎭 Framework Support

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

## 🧠 Smart Selector Strategy

Best-Locator uses an intelligent algorithm to choose the best selector:

1. **🎯 Test-specific attributes** (`data-testid`, `data-cy`, `data-test`)
2. **🆔 Unique IDs** (`#unique-id`)
3. **🏷️ Semantic attributes** (`name`, `role`, `aria-label`)
4. **📝 Text content** (`text="Button Text"`)
5. **🎨 CSS classes** (`.stable-class`)
6. **🏗️ Structural selectors** (`div > button:nth-child(2)`)

## 📊 Examples

### Login Form Example
```bash
npm run dev pick-multiple https://github.com/login
```

**Output:**
```typescript
// Individual selectors
await page.locator('#login_field')      // Username
await page.locator('#password')         // Password  
await page.locator('[name="commit"]')   // Submit button

// Combined test snippet
await page.locator('#login_field').fill('username')
await page.locator('#password').fill('password')
await page.locator('[name="commit"]').click()
```

### E-commerce Navigation
```bash
npm run dev pick-multiple https://amazon.com
```

**Output:**
```javascript
// Cypress format
cy.get('[data-testid="nav-search"]')
cy.get('[data-testid="nav-cart"]')
cy.get('[data-testid="nav-orders"]')
```

## 🛠️ Development

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

## 📁 Project Structure

```
src/
├── cli/
│   └── index.ts          # CLI commands and interface
├── core/
│   ├── selector-generator.ts    # Smart selector generation
│   ├── framework-formatter.ts   # Multi-framework output
│   └── selector-validator.ts    # Selector validation
└── types/
    └── index.ts          # TypeScript definitions
```

## 🎯 Use Cases

### 🧪 Test Automation
```bash
# Generate selectors for login flow
npm run dev pick-multiple https://myapp.com/login

# Validate critical selectors still work
npm run dev validate https://myapp.com "#checkout-button"
```

### 🔍 Web Scraping
```bash
# Select multiple data points
npm run dev pick-multiple https://news.ycombinator.com

# Get selectors for title, author, points, comments
```

### 🐛 Debugging
```bash
# Test if problematic selector works
npm run dev validate https://staging.myapp.com ".flaky-element"
```

## 🏆 Why Best-Locator?

- **🎯 Intelligent** - Chooses the most reliable selector strategy
- **⚡ Fast** - Interactive browser-based selection
- **🔄 Multi-Framework** - Works with Playwright, Cypress, Selenium
- **🌐 Multi-Language** - TypeScript, JavaScript, Python support
- **🚀 Multiple Selection** - Revolutionary multi-element picking
- **✅ Validation** - Test selectors on live websites
- **📋 Ready-to-Use** - Auto-generated code, clipboard-ready

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use in your projects!

## 👨‍💻 Author

**Jonathan Gonzalez**  
🧪 Automation Testing Enthusiast & Developer  
📧 [LinkedIn](https://www.linkedin.com/in/jogonzal/)

*Passionate about building tools that make testing easier, one selector at a time.*

## 🌟 Star the Repository

If Best-Locator helps you generate better selectors, please give it a star! ⭐

---

**Made with ❤️ for the testing community by [Jonathan Gonzalez](https://www.linkedin.com/in/jogonzal/)**

*Transform your selector generation workflow with Best-Locator!*