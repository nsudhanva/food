# LangChain and Alternatives

This project includes LangChain in its dependencies but intentionally uses a **lightweight, direct approach** for core functionality. Understanding why helps you make informed decisions for your own projects.

## What is LangChain?

LangChain is a popular framework for building LLM applications. It provides:

```mermaid
mindmap
  root((LangChain))
    Chains
      Sequential chains
      Router chains
      Summarization chains
    Agents
      Tool calling
      Planning
      Memory
    Retrievers
      Vector stores
      Document loaders
      Text splitters
    Integrations
      OpenAI
      Anthropic
      HuggingFace
      100+ more
```

## LangChain Architecture

```mermaid
graph TB
    subgraph LangChain["LangChain Framework"]
        direction TB
        LC_Doc["Document Loaders"] --> LC_Split["Text Splitters"]
        LC_Split --> LC_Embed["Embeddings"]
        LC_Embed --> LC_Vec["Vector Stores"]
        LC_Vec --> LC_Ret["Retrievers"]
        LC_Ret --> LC_Chain["Chains"]
        LC_Chain --> LC_LLM["LLM"]
    end
    
    User["User Query"] --> LC_Chain
    LC_LLM --> Response["Response"]
```

## Why We Use Direct Implementation

This project takes a different approach:

```mermaid
graph LR
    subgraph Our_Approach["Our Approach (Direct)"]
        direction TB
        A1["ChromaDB Client"] --> A2["search_foods()"]
        A2 --> A3["OpenAI Client"]
        A3 --> A4["SSE Stream"]
    end
    
    subgraph LangChain_Approach["LangChain Approach"]
        direction TB
        L1["VectorStoreRetriever"] --> L2["RetrievalQA Chain"]
        L2 --> L3["ChatOpenAI"]
        L3 --> L4["Output Parser"]
    end
```

### Comparison

| Aspect | Direct Approach | LangChain |
|--------|-----------------|-----------|
| **Learning curve** | Lower - plain Python | Higher - framework concepts |
| **Control** | Full control over every step | Abstracted, less visibility |
| **Dependencies** | Minimal | Heavy (many sub-packages) |
| **Debugging** | Straightforward | Can be opaque |
| **Flexibility** | Maximum | Framework constraints |
| **Best for** | Understanding internals | Rapid prototyping |

## When to Use LangChain

LangChain excels when you need:

```mermaid
flowchart TD
    Start["Starting a project?"]
    
    Start --> Q1{"Need complex\nchaining logic?"}
    Q1 -->|Yes| LC["Use LangChain"]
    Q1 -->|No| Q2{"Multiple LLM\nproviders?"}
    
    Q2 -->|Yes| LC
    Q2 -->|No| Q3{"Building\nagents?"}
    
    Q3 -->|Yes| LC
    Q3 -->|No| Q4{"Need to learn\ninternals?"}
    
    Q4 -->|Yes| Direct["Use Direct Approach"]
    Q4 -->|No| Either["Either works"]
```

**Use LangChain when:**

- Building complex agent systems
- Need to switch between LLM providers quickly
- Want pre-built chains (summarization, QA, etc.)
- Rapid prototyping without deep customization

**Use Direct Approach when:**

- Learning how LLM applications work
- Need maximum control over behavior
- Want minimal dependencies
- Building production systems with specific requirements

## Our Hybrid Approach

We include LangChain in `pyproject.toml` for potential future use:

```python title="pyproject.toml (relevant deps)"
dependencies = [
    # Core (what we actually use)
    "chromadb>=1.4.1",
    "openai>=1.63.0",
    
    # Available but not primary (for extensions)
    "langchain>=0.3.18",
    "langchain-openai>=0.3.5",
    "langchain-chroma>=0.2.2",
]
```

This lets you:

1. Learn with the direct approach
2. Optionally refactor to LangChain later
3. Use LangChain for specific features (like document loaders)

## Code Comparison

### Direct Approach (What We Use)

```python title="app/rag/retriever.py"
import chromadb

def search_foods(query: str, **filters) -> list[dict]:
    client = chromadb.HttpClient(host="localhost", port=8000)
    collection = client.get_collection("foods")
    
    results = collection.query(
        query_texts=[query],
        n_results=5,
        where=build_filters(filters),
    )
    
    return format_results(results)
```

### LangChain Equivalent

```python title="Alternative with LangChain"
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

def search_foods_langchain(query: str) -> list[dict]:
    vectorstore = Chroma(
        collection_name="foods",
        embedding_function=OpenAIEmbeddings(),
    )
    
    retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
    docs = retriever.invoke(query)
    
    return [{"content": d.page_content, "metadata": d.metadata} for d in docs]
```

## Converting to LangChain

If you want to migrate later, here's a path:

```mermaid
sequenceDiagram
    participant Direct as Direct Approach
    participant Hybrid as Hybrid
    participant LC as Full LangChain
    
    Direct->>Hybrid: 1. Replace ChromaDB client<br/>with langchain-chroma
    Hybrid->>Hybrid: 2. Replace OpenAI client<br/>with ChatOpenAI
    Hybrid->>LC: 3. Create RetrievalQA chain
    LC->>LC: 4. Add memory, agents, etc.
```

### Step 1: Replace Vector Store

```python
# Before
from chromadb import HttpClient
client = HttpClient(host="localhost", port=8000)

# After
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
vectorstore = Chroma(
    client=client,
    embedding_function=OpenAIEmbeddings()
)
```

### Step 2: Use LangChain LLM

```python
# Before
from openai import AsyncOpenAI
client = AsyncOpenAI()
response = await client.chat.completions.create(...)

# After
from langchain_openai import ChatOpenAI
llm = ChatOpenAI(model="gpt-4o-mini", streaming=True)
response = await llm.ainvoke(messages)
```

### Step 3: Create Chain

```python
from langchain.chains import RetrievalQA

chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=vectorstore.as_retriever(),
)

response = chain.invoke({"query": "spicy breakfast"})
```

## Summary

| Our Project | Why |
|-------------|-----|
| Uses direct ChromaDB | Maximum control, clear code paths |
| Uses direct OpenAI | Simple streaming, no abstractions |
| Includes LangChain deps | Future flexibility, optional use |
| MCP for tools | Standard protocol, not LangChain agents |

This approach prioritizes **learning** and **understanding** over convenience. Once you understand how everything works, you can make informed decisions about when LangChain's abstractions help vs. hinder.

---

Next, let's dive deep into each file of the backend.
