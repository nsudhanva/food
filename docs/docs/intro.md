---
slug: /
---
# Introduction

Welcome to the **Indian Food Companion** documentation. This guide will teach you how to build a complete AI-powered food recommendation application from scratch.

## What You'll Build

By the end of this guide, you'll have built a fully functional chat application that:

- **Understands natural language** - "I want something spicy for breakfast"
- **Provides personalized recommendations** - Based on dietary preferences and allergies
- **Streams responses in real-time** - Just like ChatGPT
- **Uses your own curated data** - Not just relying on the AI's training data

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                    (React + shadcn/ui)                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Chat API   │  │ Preferences  │  │    MCP Server        │  │
│  │   (SSE)      │  │     API      │  │   (AI Tool Access)   │  │
│  └──────┬───────┘  └──────────────┘  └──────────────────────┘  │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  RAG Pipeline                             │  │
│  │  1. Query → 2. Retrieve from ChromaDB → 3. Generate      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────────┐
    │ ChromaDB │   │ Postgres │   │  OpenAI API  │
    │ (Vectors)│   │  (Users) │   │  (LLM)       │
    └──────────┘   └──────────┘   └──────────────┘
```

## Prerequisites

Before starting, you should be comfortable with:

- **React** - Component-based UI development
- **REST APIs** - HTTP methods, JSON, request/response patterns
- **Docker** - Basic containerization concepts
- **Python** - Basic syntax (we'll teach you FastAPI)

You **don't need** prior experience with:

- Large Language Models (LLMs)
- Vector databases
- Embeddings
- RAG (Retrieval-Augmented Generation)
- MCP (Model Context Protocol)

We'll explain all of these concepts as we go.

## Tech Stack

| Component | Technology | Why We Use It |
|-----------|------------|---------------|
| Frontend | React + Vite | Fast development, modern tooling |
| UI Components | shadcn/ui | Beautiful, accessible, customizable |
| Styling | Tailwind CSS | Utility-first, rapid prototyping |
| Backend | FastAPI | Async Python, automatic API docs |
| Vector DB | ChromaDB | Simple, embeddable, perfect for learning |
| Database | PostgreSQL | Reliable, feature-rich |
| LLM | OpenAI | Best-in-class, easy to use |
| Tools | MCP | Standardized AI tool protocol |

## How This Guide is Organized

1. **Getting Started** - Set up your development environment
2. **Core Concepts** - Understand LLMs, RAG, embeddings, and MCP
3. **Backend Development** - Build the FastAPI server step by step
4. **Frontend Development** - Create the React chat interface
5. **Deployment** - Containerize and run with Docker

Let's begin!
