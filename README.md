# 🚀 ModelHub

> A universal AI model playground that lets you connect, manage, and test multiple AI providers from one beautiful interface.

ModelHub is designed for developers who work with multiple LLM providers. Instead of juggling different dashboards and APIs, simply add your API keys, let ModelHub detect the provider, and start chatting with any supported model.

---

## ✨ Features

### 🔑 Universal Provider Management

* Add unlimited AI providers
* Secure API key storage
* Custom base URLs
* Custom headers
* Organization IDs
* Multiple configurations per provider

### 🤖 Smart Provider Detection

Automatically detects providers using:

* API key prefixes
* Base URLs
* Endpoint patterns
* HTTP response fingerprints
* `/models` endpoint inspection
* Authentication responses

Falls back to manual selection when confidence is low.

---

### 📦 Supported Providers

* OpenAI
* Anthropic
* Google Gemini
* OpenRouter
* Groq
* DeepSeek
* Together AI
* Fireworks AI
* Mistral AI
* Cohere
* NVIDIA NIM
* Azure OpenAI
* Ollama
* LM Studio
* OpenAI-compatible APIs
* Custom providers

More providers can be added through the adapter system.

---

## 🎮 Universal Playground

The interface automatically adapts to the selected model.

Supported capabilities include:

* 💬 Chat
* 👁️ Vision
* 🖼️ Image Generation
* 🎤 Audio
* 📄 Embeddings
* 🔧 Tool Calling
* 📡 Streaming
* 📋 JSON Mode

No unnecessary controls are shown—only the features your model supports.

---

## ⚡ Playground Features

* Streaming responses
* Markdown rendering
* Syntax highlighting
* Conversation history
* Regenerate responses
* Prompt editing
* Raw request viewer
* Raw response viewer
* Token usage
* Latency tracking
* Cost estimation

---

## 🏗️ Architecture

ModelHub uses a provider adapter architecture.

```text
Provider
      │
      ▼
Adapter
      │
      ▼
Universal Interface
      │
      ▼
Dynamic Playground
```

Adding a new provider only requires implementing a new adapter.

---

## 📂 Project Structure

```text
src/
│
├── components/
├── pages/
├── hooks/
├── store/
├── services/
│
├── providers/
│   ├── openai.ts
│   ├── anthropic.ts
│   ├── gemini.ts
│   ├── groq.ts
│   ├── openrouter.ts
│   └── ...
│
├── types/
├── utils/
└── lib/

server/

public/
```

---

## 🚀 Getting Started

Clone the repository.

```bash
git clone https://github.com/yourusername/modelhub.git

cd modelhub
```

Install dependencies.

```bash
npm install
```

Run the development server.

```bash
npm run dev
```

---

## 🔑 Adding a Provider

Simply enter:

* API Key
* Base URL (optional)
* Model (optional)

ModelHub will automatically:

* Detect the provider
* Verify authentication
* Fetch available models
* Determine supported capabilities
* Configure the playground

---

## 🧠 Detection Engine

Unlike traditional AI playgrounds, ModelHub prioritizes deterministic detection over AI guessing.

Detection order:

1. User-selected provider
2. Endpoint matching
3. API key prefixes
4. Base URL analysis
5. `/models` endpoint inspection
6. Response schema fingerprinting
7. HTTP headers
8. AI inference (fallback only)

Each detection includes a confidence score and explanation.

---

## 🎨 UI Highlights

* Dark theme
* Glassmorphism
* Responsive layout
* Smooth animations
* Command palette
* Drag-and-drop uploads
* Split panels
* Beautiful loading states
* Keyboard shortcuts
* Premium developer experience

---

## 🛣️ Roadmap

* [ ] Prompt library
* [ ] Multi-chat sessions
* [ ] Team workspaces
* [ ] Model benchmarking
* [ ] Prompt versioning
* [ ] Cost analytics
* [ ] Local model support
* [ ] Plugin marketplace
* [ ] MCP integration
* [ ] Workflow automation
* [ ] API request collections
* [ ] Prompt templates
* [ ] Batch requests

---

## 🤝 Contributing

Contributions are welcome!

If you'd like to improve ModelHub:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push the branch
5. Open a Pull Request

---

## 📄 License

Licensed under the MIT License.

Feel free to use, modify, and build upon this project.

---

## ⭐ Support

If ModelHub helps streamline your AI workflow, consider giving the repository a ⭐ on GitHub. It helps others discover the project and supports future development.
