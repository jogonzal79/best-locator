# Best-Locator 🎯

> Universal selector generator for UI testing frameworks

Best-Locator is a CLI tool that intelligently generates selectors for your UI tests by letting you simply click on any element in your browser. It supports multiple testing frameworks and programming languages, automatically copying the generated code to your clipboard.

## ✨ Features

- 🖱️ **Interactive element selection** - Just click on any element
- 🧠 **Smart selector generation** - Uses intelligent heuristics to find the best selector
- 🔧 **Multi-framework support** - Playwright, Cypress, and Selenium
- 🌐 **Multi-language support** - TypeScript, JavaScript, Python, Java, C#
- 📋 **Auto-copy to clipboard** - Generated code is automatically copied
- ⚡ **Fast and lightweight** - No browser extensions needed
- 🎨 **Beautiful CLI output** - Colored and organized information

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/best-locator.git
cd best-locator

# Install dependencies
npm install

# Install Playwright browsers (first time only)
npx playwright install
```

### Basic Usage

```bash
# Generate Playwright TypeScript selector (default)
npm run dev pick https://example.com

# Generate Cypress JavaScript selector
npm run dev pick https://example.com cypress javascript

# Generate Selenium Python selector
npm run dev pick https://example.com selenium python
```

## 📖 How It Works

1. **Open the tool** with your target URL
2. **Click on any element** you want to test
3. **Get the optimal selector** automatically generated
4. **Use the code** - it's already copied to your clipboard!

### Example Workflow

```bash
$ npm run dev pick https://www.google.com cypress javascript

🚀 Opening https://www.google.com...
📋 Framework: cypress
💬 Language: javascript
✅ Page loaded successfully!
👆 Click on any element to select it...

🎯 Element selected!
📋 Element information:
   Tag: input
   ID: APjFqb
   Classes: gLFyf
   Text: 
🏷️  Attributes:
   aria-label: Buscar
   id: APjFqb
   name: q
   role: combobox

🧠 Generating smart selector...
🎯 Best Selector:
   #APjFqb
   Type: id
   Confidence: 85%

📋 Formatted for cypress javascript:
   cy.get('#APjFqb')
✅ Copied to clipboard!
```

## 🎛️ Command Reference

### Basic Syntax

```bash
npm run dev pick <url> [framework] [language]
```

### Parameters

| Parameter | Description | Options | Default |
|-----------|-------------|---------|---------|
| `url` | Target webpage URL | Any valid URL | Required |
| `framework` | Testing framework | `playwright`, `cypress`, `selenium` | `playwright` |
| `language` | Programming language | `typescript`, `javascript`, `python` | `typescript` |

### Examples

```bash
# Playwright with TypeScript (default)
npm run dev pick https://app.example.com

# Cypress with JavaScript
npm run dev pick https://app.example.com cypress javascript

# Selenium with Python
npm run dev pick https://app.example.com selenium python

# Playwright with Python
npm run dev pick https://app.example.com playwright python
```

## 🧠 Selector Intelligence

Best-Locator uses a smart heuristic system to generate the most reliable selectors:

### Priority Order

1. **`data-testid`** (95% confidence) - Best practice for testing
2. **`data-cy`** (90% confidence) - Cypress convention
3. **`id`** (85% confidence) - Unique identifiers
4. **`text content`** (70% confidence) - For buttons and links
5. **`CSS classes`** (50% confidence) - Fallback option
6. **`tag name`** (30% confidence) - Last resort

### Example Outputs by Framework

#### Playwright
```typescript
// TypeScript
await page.locator('#login-button')
await page.getByTestId('submit-btn')
await page.getByText('Click here')

// Python
page.locator("#login-button")
page.get_by_test_id("submit-btn")
page.get_by_text("Click here")
```

#### Cypress
```javascript
// JavaScript/TypeScript
cy.get('#login-button')
cy.findByTestId('submit-btn')
cy.contains('Click here')
```

#### Selenium
```python
# Python
driver.find_element(By.CSS_SELECTOR, "#login-button")
driver.find_element(By.CSS_SELECTOR, "[data-testid='submit-btn']")

# Java
driver.findElement(By.cssSelector("#login-button"))
driver.findElement(By.cssSelector("[data-testid='submit-btn']"))
```

## 🔧 Framework Support

### Playwright
- **Languages**: TypeScript, JavaScript, Python, Java, C#
- **Features**: Modern async/await syntax, cross-browser support

### Cypress
- **Languages**: JavaScript, TypeScript
- **Features**: jQuery-style selectors, built-in retry logic

### Selenium
- **Languages**: Python, Java, C#, JavaScript, Ruby
- **Features**: Classic WebDriver syntax, widespread adoption

## 📁 Project Structure

```
best-locator/
├── src/
│   ├── cli/
│   │   └── index.ts              # Main CLI interface
│   ├── core/
│   │   ├── selector-generator.ts # Intelligent selector generation
│   │   └── framework-formatter.ts # Multi-framework output formatting
│   └── utils/                    # Utility functions
├── tests/                        # Test files
├── examples/                     # Usage examples
├── package.json
└── README.md
```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
```bash
# Clone and install
git clone https://github.com/your-username/best-locator.git
cd best-locator
npm install

# Install Playwright browsers
npx playwright install

# Run in development mode
npm run dev pick https://example.com
```

### Building
```bash
# Build the project
npm run build

# Run tests
npm test
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Add tests** if applicable
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Areas for Contribution

- 🆕 **New frameworks**: WebdriverIO, TestCafe, etc.
- 🌍 **New languages**: Kotlin, PHP, Go, etc.
- 🎯 **Better selectors**: Improve heuristic algorithms
- 🐛 **Bug fixes**: Help us squash bugs
- 📖 **Documentation**: Improve docs and examples

## 📋 Roadmap

### v0.2.0 - Enhanced Features
- [ ] Batch processing for multiple URLs
- [ ] Selector validation
- [ ] Configuration files
- [ ] Better error handling

### v0.3.0 - Advanced Capabilities
- [ ] Visual element highlighting
- [ ] Selector stability testing
- [ ] Integration with CI/CD pipelines
- [ ] Web interface

### v1.0.0 - Production Ready
- [ ] npm package distribution
- [ ] Comprehensive test coverage
- [ ] Performance optimizations
- [ ] Enterprise features

## 💡 Tips & Best Practices

### For QA Engineers
- Always prefer `data-testid` attributes when available
- Use Best-Locator early in development to identify missing test attributes
- Copy the generated selectors and save them in your test documentation

### For Developers
- Add `data-testid` attributes to your components for better testing
- Use semantic HTML elements with proper roles and labels
- Avoid generated class names for test selectors

### Common Use Cases
```bash
# Testing a login form
npm run dev pick https://app.com/login cypress javascript

# Testing e-commerce checkout
npm run dev pick https://shop.com/checkout selenium python

# Testing dashboard widgets
npm run dev pick https://dashboard.com playwright typescript
```

## 🐛 Troubleshooting

### Common Issues

**Browser doesn't open**
```bash
# Reinstall Playwright browsers
npx playwright install
```

**Command not found**
```bash
# Make sure you're in the project directory
cd best-locator
npm install
```

**Element not detected**
- Make sure the element is visible and clickable
- Try waiting for the page to fully load
- Check if there are any overlays blocking the element

**Selector not working in tests**
- Verify the element still exists with the same attributes
- Check if the page has dynamic content that changes selectors
- Consider using more stable selectors like data-testid

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/your-username/best-locator/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-username/best-locator/discussions)
- 📧 **Email**: your-email@example.com

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Playwright](https://playwright.dev/) - For the amazing browser automation
- [Commander.js](https://github.com/tj/commander.js/) - For the CLI framework
- [Chalk](https://github.com/chalk/chalk) - For beautiful terminal colors
- The QA community for inspiration and feedback

---

**Made with ❤️ for the QA automation community**

*If Best-Locator helps you write better tests, consider giving it a ⭐ on GitHub!*