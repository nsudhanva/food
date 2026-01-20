/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/prerequisites',
        'getting-started/project-setup',
        'getting-started/running-locally',
      ],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      items: [
        'concepts/llm-basics',
        'concepts/rag-explained',
        'concepts/vector-databases',
        'concepts/embeddings',
        'concepts/mcp-protocol',
      ],
    },
    {
      type: 'category',
      label: 'Backend Development',
      items: [
        'backend/fastapi-setup',
        'backend/database-models',
        'backend/chromadb-integration',
        'backend/openai-client',
        'backend/rag-retriever',
        'backend/chat-api',
        'backend/mcp-server',
      ],
    },
    {
      type: 'category',
      label: 'Frontend Development',
      items: [
        'frontend/react-setup',
        'frontend/shadcn-components',
        'frontend/chat-interface',
        'frontend/streaming-responses',
        'frontend/preferences-management',
      ],
    },
    {
      type: 'category',
      label: 'Deployment',
      items: [
        'deployment/docker-compose',
        'deployment/production-tips',
      ],
    },
  ],
};

export default sidebars;
