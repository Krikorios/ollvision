# Ollama Vision Chat 🎥💬

A real-time camera-enabled chat application that connects to your local Ollama vision model, allowing you to have conversations with an AI that can see and understand what you're doing through your camera.

![Ollama Vision Chat Interface](https://img.shields.io/badge/Status-Ready-brightgreen) ![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black) ![Ollama](https://img.shields.io/badge/Ollama-000000?logo=ollama&logoColor=white)

## ✨ Features

### 🎥 **Real-time Camera Integration**
- Continuous camera feed with live preview
- Automatic frame capture at configurable intervals (5-60 seconds)
- Manual photo capture with instant feedback
- Pause/resume auto-capture functionality
- Mobile and desktop camera support

### 💬 **Interactive AI Chat**
- Real-time messaging with vision-enabled AI
- Context-aware responses based on camera feed
- Message history with clear user/assistant distinction
- Auto-resizing text input for comfortable typing
- Smooth animations and modern UI

### ⚙️ **Flexible Configuration**
- Configurable Ollama server URL
- Support for multiple vision models (LLaVA, etc.)
- Adjustable capture intervals
- Real-time connection status monitoring
- Easy settings panel with instant updates

### 📱 **Responsive Design**
- Optimized for desktop and mobile devices
- Adaptive layout that works on any screen size
- Touch-friendly controls
- Modern glassmorphism design with smooth animations

## 🚀 Quick Start

### Prerequisites

1. **Install Ollama**
   ```bash
   # On macOS
   brew install ollama
   
   # On Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # On Windows
   # Download from https://ollama.ai/download
   ```

2. **Pull a Vision Model**
   ```bash
   # LLaVA (recommended)
   ollama pull llava
   
   # Or other vision models
   ollama pull llava:7b
   ollama pull llava:13b
   ollama pull bakllava
   ```

3. **Start Ollama Server**
   ```bash
   ollama serve
   ```

### Installation & Usage

1. **Download the HTML file** or clone this repository
2. **Open `index.html`** in a modern web browser
3. **Grant camera permissions** when prompted
4. **Wait for connection** - the status indicator will turn green
5. **Start chatting!** The AI can see what you're doing and respond accordingly

## 🛠️ Configuration

### Settings Panel
Click the ⚙️ settings button to access:

- **Ollama Server URL**: Default `http://localhost:11434`
- **Vision Model**: Default `llava` (change to your preferred model)
- **Auto-capture Interval**: 5-60 seconds between automatic photos
- **Enable Auto-capture**: Toggle automatic photo capturing

### Supported Models

The app works with any Ollama vision model:
- `llava` - General purpose vision model
- `llava:7b` - Smaller, faster version
- `llava:13b` - Larger, more capable version
- `bakllava` - Alternative vision model
- Custom vision models you've imported

## 💡 Usage Examples

### What You Can Ask:
- **"What am I holding in my hands?"**
- **"How does this setup look?"**
- **"Can you see what's on my screen?"**
- **"What color is my shirt?"**
- **"Help me organize this workspace"**
- **"What do you think of this drawing?"**
- **"Can you read this text for me?"**

### Perfect For:
- 🎨 Getting feedback on artwork or projects
- 📚 Reading assistance and text recognition
- 🏠 Home organization and decoration advice
- 👔 Fashion and styling feedback
- 🔧 Technical troubleshooting with visual context
- 🍳 Cooking assistance and recipe guidance
- 📖 Educational support with visual learning

## 🔧 Technical Details

### Architecture
- **Frontend**: Pure HTML5, CSS3, and JavaScript (no frameworks)
- **Camera**: WebRTC getUserMedia API for camera access
- **Image Processing**: HTML5 Canvas for frame capture
- **Communication**: Fetch API for Ollama REST API calls
- **UI**: Modern CSS Grid and Flexbox layouts

### Browser Requirements
- Modern browser with camera support
- JavaScript enabled
- HTTPS or localhost (required for camera access)
- WebRTC support

### File Structure
```
ollama-vision-chat/
├── index.html          # Main application file
├── README.md          # This file
└── screenshots/       # (Optional) App screenshots
```

## 🚨 Troubleshooting

### Common Issues & Solutions

**🔴 "Failed to connect to Ollama"**
- Ensure Ollama is running: `ollama serve`
- Check the server URL in settings (default: `http://localhost:11434`)
- Verify your firewall isn't blocking the connection

**📷 "Failed to access camera"**
- Grant camera permissions in your browser
- Ensure no other app is using the camera
- Try refreshing the page and granting permissions again
- Use HTTPS or localhost (camera requires secure context)

**🤖 "Model not found"**
- Install a vision model: `ollama pull llava`
- Check available models: `ollama list`
- Update the model name in settings to match your installed model

**⏱️ "Slow responses"**
- Try a smaller model like `llava:7b`
- Increase the auto-capture interval to reduce processing load
- Ensure your system has adequate RAM and CPU

**📱 "Mobile camera issues"**
- Grant camera permissions in browser
- Try both front and back cameras
- Ensure mobile browser supports WebRTC

## 🎯 Performance Tips

- **Use smaller models** (`llava:7b`) for faster responses
- **Adjust capture intervals** based on your use case
- **Pause auto-capture** when not needed to save resources
- **Close other camera applications** to avoid conflicts
- **Use a stable internet connection** for best performance

## 🔒 Privacy & Security

- **All processing is local** - your camera feed never leaves your device
- **No data is stored** - conversations are not saved
- **Direct Ollama connection** - no third-party services involved
- **Open source** - you can review all code in the HTML file

## 🤝 Contributing

Contributions are welcome! Here are some ideas:

- 🎨 UI/UX improvements
- 🔧 Additional model support
- 📱 Enhanced mobile experience
- 🌐 Multi-language support
- 📊 Usage analytics dashboard
- 🔄 Conversation export/import

## 📋 Roadmap

- [ ] Voice input/output support
- [ ] Multiple camera sources
- [ ] Image annotation tools
- [ ] Conversation export
- [ ] Custom model training integration
- [ ] Screen sharing capability
- [ ] Multi-user support

## 📜 License

This project is open source and available under the [MIT License](https://opensource.org/licenses/MIT).

## ⭐ Support

If you find this project helpful:
- ⭐ Star this repository
- 🐛 Report issues and bugs
- 💡 Suggest new features
- 🤝 Contribute improvements

---

**Built with ❤️ for the Ollama community**

*Have questions? Open an issue or start a discussion!*