# Prerequisites

Before we start building, let's make sure you have all the necessary tools installed.

## Required Software

### 1. Node.js and Bun

We use **Bun** as our JavaScript runtime and package manager. It's faster than npm/yarn and works great with React.

```bash
# Install Bun (macOS/Linux)
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version
```

### 2. Python and uv

We use **uv** for Python package management. It's extremely fast and handles virtual environments automatically.

```bash
# Install uv (macOS/Linux)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Verify installation
uv --version
```

### 3. Docker and Docker Compose

Docker runs our databases (PostgreSQL, ChromaDB) in containers.

```bash
# macOS: Install Docker Desktop from https://docker.com/desktop

# Verify installation
docker --version
docker compose version
```

### 4. OpenAI API Key

You'll need an OpenAI API key to use their language models.

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new key
5. Save it somewhere safe (you'll need it later)

:::caution Cost Warning
OpenAI API calls cost money. For development, `gpt-4o-mini` is cheap (~$0.15 per 1M input tokens). A typical development session costs less than $1.
:::

## Recommended VS Code Extensions

If you're using VS Code, install these extensions:

- **Python** - Microsoft's Python extension
- **Pylance** - Python language server
- **ESLint** - JavaScript linting
- **Tailwind CSS IntelliSense** - CSS autocomplete
- **Thunder Client** - API testing (alternative to Postman)

## Verify Your Setup

Run these commands to verify everything is installed:

```bash
# Check all tools
echo "Bun: $(bun --version)"
echo "uv: $(uv --version)"
echo "Docker: $(docker --version)"
echo "Docker Compose: $(docker compose version --short)"
```

You should see version numbers for all tools. If any command fails, revisit the installation steps above.

## Project Directory

Create a directory for our project:

```bash
mkdir food-companion
cd food-companion
```

We'll build everything inside this directory.

---

Next, we'll set up the project structure and initialize both the backend and frontend.
