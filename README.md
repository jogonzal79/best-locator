# Best-Locator

**The first AI-powered selector generator with professional Toggle Mode for seamless cross-platform testing. Navigate organically, capture selectively, test intelligently.**

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

# 4. Start the most powerful mode with professional controls
bestlocator pick-toggle https://your-app.com --ai --explain
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

Existing selector tools are limited. They require re-capturing on every page, can't handle complex user flows, and lack intelligent selector generation.

**Best-Locator is different:**

### 🎛️ **Professional Toggle Mode** (Unique in Market)
- **Visual Control Panel**: Intuitive buttons + keyboard shortcuts for seamless workflow
- **Organic Navigation**: Browse naturally through login flows and complex user journeys
- **Session Persistence**: Capture elements across multiple pages in one unified session  
- **Real-time State Management**: Always know if you're navigating or capturing
- **Cross-Frame Support**: Works flawlessly with iframes and shadow DOM

### 🧠 **AI-Enhanced Intelligence** (First of Its Kind)
- **Hybrid AI Strategy**: Combines GPT-4/Ollama with rule-based reliability
- **Smart Selector Analysis**: AI explains why each selector was chosen
- **Fallback Intelligence**: Uses AI only when needed for optimal speed
- **Learning Capability**: Improves suggestions based on your testing patterns

### 📱 **Unified Cross-Platform** (No Context Switching)
- **Same Workflow**: Identical process for Web and Mobile testing
- **Visual Mobile Inspector**: Interactive screenshot-based element selection
- **Native App Support**: iOS and Android with unified selector generation
- **Consistent Output**: Same code format regardless of platform

### 🚀 **Framework Intelligence** (Professional Output)
- **5 Programming Languages**: TypeScript, JavaScript, Python, Java, C#
- **3 Testing Frameworks**: Playwright, Selenium, Cypress + Appium for mobile
- **Optimized Code Generation**: Framework-specific best practices applied
- **Copy-Paste Ready**: Generated code works immediately in your tests

### 🔧 **Professional Reliability** 
- **Smart Attribute Prioritization**: `data-testid`, `aria-label`, semantic selectors first
- **Stable CSS Detection**: Filters out utility classes like Tailwind automatically
- **Link Intelligence**: Detects and uses href keywords (github, login, etc.)
- **Confidence Scoring**: Know how reliable each selector is before using it

---

## 🖼️ **Professional Toggle Mode in Action**

### Visual Control Panel
The professional control panel gives you complete control over your testing session:

**How it works:**
1. 🌐 **Navigate Freely**: Browse through your app naturally (login, multi-step flows)
2. 🎯 **Visual Controls**: Click "CAPTURE" button or press CTRL+S to start selecting
3. 👆 **Smart Selection**: Click elements with real-time visual feedback and count
4. 🌐 **Seamless Navigation**: Click "NAV" button or press CTRL+D to continue browsing  
5. 🏁 **Complete Session**: Click "FINISH" or press ESC to get all selectors

**Key Features:**
- **Drag & Drop Panel**: Position the control panel wherever you need it
- **Session Counter**: See how many elements you've captured in real-time
- **URL Context**: Always know which page you're currently testing
- **Visual State**: Clear indication of CAPTURE vs NAVIGATION mode
- **Keyboard + Mouse**: Use whatever input method feels natural

---

## 🆚 **How We Compare**

| Feature | Best-Locator | SelectorGadget | ChroPath | SelectorsHub |
|---------|:------------:|:--------------:|:--------:|:------------:|
| **AI-Powered Generation** | ✅ | ❌ | ❌ | ❌ |
| **Professional Toggle Mode** | ✅ | ❌ | ❌ | ❌ |
| **Cross-Page Sessions** | ✅ | ❌ | ❌ | ❌ |
| **Visual Control Panel** | ✅ | Basic | Basic | Basic |
| **Mobile App Support** | ✅ | ❌ | ❌ | ❌ |
| **Multi-Framework Output** | ✅ | CSS Only | Limited | Limited |
| **Complex User Flows** | ✅ | ❌ | ❌ | ❌ |
| **Session Persistence** | ✅ | ❌ | ❌ | ❌ |
| **Target Audience** | **Professional** | Hobbyist | Developer | Developer |

---

**Professional Benefits:**
- 🎯 Handle login flows and multi-step processes naturally
- 🧠 AI-powered reliability scoring prevents brittle selectors  
- 🔄 Consistent cross-platform testing approach
- 📊 Scale testing workflows across development teams

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

### Web - Professional Toggle Mode (Recommended)
The most powerful mode with visual controls and session persistence:

```bash
bestlocator pick-toggle https://your-app.com --ai --explain
```

**Professional Workflow:**
1. **Navigate freely**: Visual control panel appears in browser
2. **Smart Controls**: Click "CAPTURE" button or press `CTRL+S` to start
3. **Visual Feedback**: Click elements with real-time selection count
4. **Seamless Flow**: Click "NAV" button or press `CTRL+D` to continue browsing  
5. **Complete Session**: Click "FINISH" or press `ESC` to get all results

### Mobile - Interactive Inspector (Recommended)
Professional mobile testing with visual screenshot interface:

```bash
# For Android
bestlocator mobile-inspector <path-to-app.apk> android

# For iOS
bestlocator mobile-inspector <path-to-app.app> ios
```

**Professional Mobile Workflow:**
1. **Navigate naturally** on your device/emulator
2. **Visual Inspector** opens at http://localhost:8100 with live screenshots
3. **Interactive Selection** - click elements directly on the screenshot
4. **Generate Code** - get production-ready selectors instantly

### Other Commands

```bash
# Single element selection (Web)
bestlocator pick https://your-app.com --ai

# Multiple elements in sequence (Web)  
bestlocator pick-multiple https://your-app.com

# Single element selection (Mobile)
bestlocator pick-mobile <path-to-app.apk> android

# Single element selection (iOS)  
bestlocator pick-mobile <path-to-app.app> ios

# Validate existing selectors
bestlocator validate https://your-app.com '[data-test="username"]'
```

---

## 🔧 Framework Support

### Web Frameworks

| Framework   | JavaScript | TypeScript | Python | Java | C# |
|-------------|:----------:|:----------:|:------:|:----:|:--:|
| Playwright  |     ✅     |     ✅     |   ✅   |  ✅  | ✅ |
| Selenium    |     ✅     |     ✅     |   ✅   |  ✅  | ✅ |
| Cypress     |     ✅     |     ✅     |   ❌   |  ❌  | ❌ |
| TestCafe    |     ✅     |     ✅     |   ❌   |  ❌  | ❌ |
| WebdriverIO |     ✅     |     ✅     |   ❌   |  ❌  | ❌ |

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

  // Appium Configuration for Mobile
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
bestlocator pick-toggle <url>    # 🌟 Professional Toggle Mode
bestlocator go <alias>

# Interactive Modes - Mobile
bestlocator mobile-inspector <path-to-app> <platform>    # 🌟 Visual Inspector
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

*The first AI-powered selector generator with professional Toggle Mode for seamless cross-platform testing. Navigate organically, capture selectively, test intelligently.*