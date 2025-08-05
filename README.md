# Best-Locator

**Universal AI-powered selector generator for Web and Mobile (iOS & Android) UI testing with organic navigation and intelligent analysis.**

Generate professional-grade selectors for UI testing with the reliability developers trust, the flexibility testers need, and the intelligence of AI.

<div align="center">

![NPM Total Downloads](https://img.shields.io/npm/dt/bestlocator?style=for-the-badge&logo=npm&logoColor=white&label=Total%20Downloads&color=ff6b6b)
![NPM Weekly Downloads](https://img.shields.io/npm/dw/bestlocator?style=for-the-badge&logo=npm&logoColor=white&label=Weekly&color=4ecdc4)
![NPM Monthly Downloads](https://img.shields.io/npm/dm/bestlocator?style=for-the-badge&logo=npm&logoColor=white&label=Monthly&color=45b7d1)
![NPM Version](https://img.shields.io/npm/v/bestlocator?style=for-the-badge&logo=npm&logoColor=white&label=Version&color=96ceb4)

![GitHub Stars](https://img.shields.io/github/stars/jogonzal79/best-locator?style=for-the-badge&logo=github&logoColor=white&label=Stars&color=feca57)
![License](https://img.shields.io/npm/l/bestlocator?style=for-the-badge&logoColor=white&label=License&color=54a0ff)

</div>

---

## 🚀 Quick Start

### For Web
```bash
# 1. Install the tool globally
npm install -g bestlocator

# 2. Install the necessary browsers
npx playwright install

# 3. Navigate to your project and create a config file
cd your-project/
bestlocator init

# 4. Start generating selectors in the most powerful mode
# (Note: --ai requires prior setup, see guide below)
bestlocator pick-toggle https://saucedemo.com --ai --explain
```

### For Mobile (iOS & Android)
```bash
# 1. Install Appium and its drivers
npm install -g appium
appium driver install uiautomator2 && appium driver install xcuitest

# 2. Start the Appium server in a separate terminal
appium

# 3. In another terminal, start inspecting your app
# For Android:
bestlocator mobile-inspector <path-to-your.apk> android
# For iOS:
bestlocator mobile-inspector <path-to-your.app> ios
```

---

## ✨ Why Best-Locator?

Traditional selector generators are broken. They force you to capture elements immediately, can't handle login flows, and often generate unreliable selectors.

**Best-Locator changes everything:**

- 🧠 **Hybrid Intelligence**: Combines rule-based stability with AI creativity
- 📱 **Cross-Platform Mobile Support**: Inspect native apps on iOS and Android with a unified visual inspector
- 🌐 **Organic Navigation**: Browse like a normal user, log in, and move between pages
- ⚡ **Toggle Capture Mode**: Turn element capture ON/OFF with keyboard shortcuts for web (`CTRL+S` / `CTRL+D`)
- 🎯 **Professional Selectors**: Prioritizes robust attributes like `data-testid`, `resource-id`, and `accessibility-id`
- 📄 **Multi-Page Capture**: Collect selectors from different pages in a single session
- 🔧 **Framework Agnostic**: Generates code for Playwright, Selenium, Cypress, and Appium
- 💡 **AI Explanations**: Understand why a selector was chosen
- 🚀 **Intelligent Fallback**: Uses AI only when necessary, ensuring speed and reliability

---

## 📋 Prerequisites

### For Web Testing
Before installing, make sure you have:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (installed automatically with Node.js)

Check your Node.js version:
```bash
node -v
```

### For Mobile Testing
All of the above, plus:

- **Appium 2.x**: The automation server
- **Android Studio**: For the Android SDK (ANDROID_HOME) and emulators
- **Xcode (on macOS)**: For iOS simulators and building .app files

---

## 🛠 Installation & Setup

### Step 1: Install Best-Locator
```bash
npm install -g bestlocator
```

### Step 2: Install Web Browsers
Best-Locator uses Playwright under the hood for web testing:
```bash
npx playwright install
```

### Step 3: Setup for Mobile Testing (Appium)
```bash
# Install Appium Server
npm install -g appium

# Install drivers for Android and iOS
appium driver install uiautomator2
appium driver install xcuitest
```

### Step 4: Verify Installation
```bash
bestlocator hello
```
You should see a welcome message. You're all set! 🎉

---

## 🤖 AI Configuration

Best-Locator's most powerful features are unlocked with AI. Choose between two providers:

- **Ollama**: Free, private, and runs on your own machine
- **OpenAI**: Paid (very inexpensive), cloud-based, and extremely powerful

### Option 1: Ollama (Free, Local)

#### 1. Install Ollama

**macOS & Windows:**
- Go to [ollama.com](https://ollama.com)
- Download, install, and run the application
- You'll see a llama icon in your menu bar (macOS) or system tray (Windows)

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

#### 2. Download a Model
```bash
ollama pull llama3.1
```

#### 3. Verify Integration
```bash
bestlocator ai-test
# Expected: ✅ AI is working correctly!
```

### Option 2: OpenAI (Paid, Cloud-Based)

#### 1. Get an OpenAI API Key
1. Go to [OpenAI API Keys](https://platform.openai.com/account/api-keys)
2. Click **Create new secret key**
3. For maximum security, select **Permissions: Restricted**
4. Grant these permissions:
   - **Models**: Read
   - **Model capabilities**: Write
5. Copy the generated API key (`sk-...`) and save it securely

#### 2. Set the API Key
**Never write your API key directly in the config file.** Use an environment variable:

```bash
# Windows (CMD)
set OPENAI_API_KEY=sk-your-key-here

# Windows (PowerShell)
$env:OPENAI_API_KEY='sk-your-key-here'

# macOS / Linux
export OPENAI_API_KEY='sk-your-key-here'
```

#### 3. Configure Best-Locator
Edit your `best-locator.config.js` file:

```javascript
// best-locator.config.js
ai: {
  enabled: true,
  provider: 'openai', // Switch to openai
  openai: {
    model: 'gpt-4o', // Or 'gpt-3.5-turbo'
    // The apiKey is read automatically from the environment variable
  }
}
```

#### 4. Verify Integration
```bash
bestlocator ai-test
# Expected: ✅ Connection to openai is successful!
```

---

## 🎮 Usage

### Web - Toggle Mode (Recommended)
The most powerful mode, allowing you to navigate freely on websites:

```bash
bestlocator pick-toggle https://saucedemo.com --ai --explain
```

**How it works:**
1. **Navigate freely**: A control panel will appear in the browser
2. **Press `CTRL+S`**: Turn ON capture mode
3. **Click elements**: Capture high-quality selectors
4. **Press `CTRL+D`**: Turn OFF capture mode to navigate again
5. **Press `ESC`**: Finish the session and get your results

### Mobile - Inspector Mode (Recommended)
The equivalent powerful mode for mobile, allowing organic navigation:

```bash
# For Android
bestlocator mobile-inspector <path-to-app.apk> android

# For iOS
bestlocator mobile-inspector <path-to-app.app> ios
```

**How it works:**
1. **Navigate freely** on your device/emulator
2. **Click Refresh** in the web inspector (http://localhost:8100) to update the view
3. **Select elements** and click Generate Selectors to get the code in your terminal

### Other Commands

```bash
# Pick a single web element
bestlocator pick https://your-app.com --ai

# Pick multiple web elements in sequence
bestlocator pick-multiple https://your-app.com

# Pick a single mobile element (Android)
bestlocator pick-mobile <path-to-app.apk> android

# Pick a single mobile element (iOS)  
bestlocator pick-mobile <path-to-app.app> ios

# Validate an existing selector
bestlocator validate https://your-app.com '[data-test="username"]'
```

---

## 🔧 Framework Support

### Web Frameworks

| Framework  | JavaScript | TypeScript | Python | Java | C# |
|------------|:----------:|:----------:|:------:|:----:|:--:|
| Playwright |     ✅     |     ✅     |   ✅   |  ✅  | ✅ |
| Selenium   |     ✅     |     ✅     |   ✅   |  ✅  | ✅ |
| Cypress    |     ✅     |     ✅     |   ❌   |  ❌  | ❌ |

### Mobile Frameworks (Appium)

| Framework | JavaScript | TypeScript | Python | Java | C# |
|-----------|:----------:|:----------:|:------:|:----:|:--:|
| Appium    |     ✅     |     ✅     |   ✅   |  ✅  | ✅ |

---

## ⚙️ Configuration File

Run `bestlocator init` in your project's root directory to create a `best-locator.config.js` file:

```javascript
// best-locator.config.js
export default {
  defaultFramework: 'playwright',
  defaultLanguage: 'typescript',
  
  // AI Configuration with Provider model
  ai: {
    enabled: true,
    // Switch between 'ollama' or 'openai'
    provider: 'ollama', 
    
    ollama: {
      host: 'http://localhost:11434',
      model: 'llama3.1',
    },
    openai: {
      // API key is best set as an environment variable (OPENAI_API_KEY)
      model: 'gpt-4o',
    }
  },
  
  // Custom data-* attributes for your web project
  projectAttributes: [
    'data-testid',
    'data-cy', 
    'data-test',
    'data-qa'
  ],

  // NEW: Appium Configuration for Mobile
  appium: {
    enabled: true,
    defaultPlatform: 'android',
    capabilities: {
      android: {
        'appium:platformVersion': '12.0', // Set to match your device/emulator
      },
      ios: {
        'appium:platformVersion': '16.0',
        'appium:deviceName': 'iPhone 14',
      }
    }
  },
  
  // URL shortcuts for the 'go' command
  urls: {
    local: 'http://localhost:3000',
    staging: 'https://staging.myapp.com',
  }
};
```

### Using URL Aliases
Once configured, you can use shortcuts for your most-used URLs:

```bash
bestlocator go local --ai # Uses http://localhost:3000 from your config
```

---

## 📖 Command Reference

### Core Commands

```bash
# Interactive Modes - Web
bestlocator pick <url>
bestlocator pick-multiple <url>
bestlocator pick-toggle <url>
bestlocator go <alias>

# Interactive Modes - Mobile
bestlocator mobile-inspector <path-to-app> <platform>
bestlocator pick-mobile <path-to-app> <platform>

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

---

## 🔍 Troubleshooting

### Browser Not Opening (Web)
This usually means the Playwright browsers aren't installed:

```bash
npx playwright install
```

### Appium Not Working (Mobile)
- **Connection Refused**: Make sure the Appium server is running (`appium`)
- **Driver not found**: Install the required driver (`appium driver install uiautomator2`)
- **ANDROID_HOME not set**: Ensure the ANDROID_HOME environment variable is configured correctly
- **App Crashes or Fails to Start**: This can be due to compatibility issues

**Recommended:** Using a physical device is often more stable than an emulator, as it avoids CPU architecture issues (x86_64 vs ARM).

- If using an emulator, ensure your .apk is compatible with the x86_64 architecture
- For high-security apps (banks, password managers), these may block screenshot capture, preventing the inspector from working

### AI Not Working
1. **For Ollama**: Make sure Ollama is running and the model is downloaded
2. **For OpenAI**: Verify your API key is set as an environment variable
3. **Test the connection**:
   ```bash
   bestlocator ai-test
   ```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Author

**Jonathan Gonzalez**  
Automation Testing Enthusiast  
[LinkedIn Profile](https://www.linkedin.com/in/jonathan-g-33607648/)

---

*Generate professional-grade selectors for UI testing with the reliability developers trust, the flexibility testers need, and the intelligence of AI.*