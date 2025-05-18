# DPC Shield - All-in-One Browser Protection

![DPC Shield Logo](./icons/icon48.svg)

> "Protecting your digital experience" - Developed by Dineth Nethsara for DPC Media Unit

## ✨ Features

- 🛡️ **Anti-Malware Protection**: Blocks harmful downloads and suspicious files
- 🚫 **Ad Blocking**: Removes intrusive ads for cleaner browsing
- 🎣 **Anti-Phishing**: Warns about suspicious login forms
- ⚡ **Lightweight**: Minimal impact on browser performance
- 🔧 **Customizable**: Configure protection levels to your needs

## 🚀 Installation

1. Download the extension package
2. Open Chrome and go to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder

## 🛠️ Configuration

Click the DPC Shield icon in your toolbar to:
- Toggle protection modules on/off
- Select different protection providers
- View current protection status

## 📜 Credits

Developed with ❤️ by **Dineth Nethsara** for **DPC Media Unit**

```javascript
// Sample typing animation for the README
const title = document.querySelector('h1');
const text = "DPC Shield - Your Digital Protector";
let i = 0;

function typeWriter() {
  if (i < text.length) {
    title.innerHTML += text.charAt(i);
    i++;
    setTimeout(typeWriter, 100);
  }
}

typeWriter();
```

<style>
  h1 {
    color: #2c3e50;
    font-family: 'Segoe UI', sans-serif;
    border-bottom: 2px solid #3498db;
    padding-bottom: 10px;
  }
  
  body {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    line-height: 1.6;
  }
</style>