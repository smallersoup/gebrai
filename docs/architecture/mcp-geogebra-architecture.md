```mermaid
graph TD
    %% Main Components
    User[User]
    AI[AI Assistant]
    MCPClient[MCP Client]
    MCPServer[MCP Server]
    GeoAdapter[GeoGebra Adapter]
    GeoAPI[GeoGebra API]
    VisEngine[Visualization Engine]
    UIHandler[User Interaction Handler]
    ErrorHandler[Error Handler]
    
    %% Supporting Components
    AuthService[Authentication Service]
    CacheLayer[Caching Layer]
    LogService[Logging Service]
    ConfigMgr[Configuration Manager]
    
    %% Connections - Main Flow
    User <--> AI
    AI <--> MCPClient
    MCPClient <--> MCPServer
    MCPServer <--> GeoAdapter
    GeoAdapter <--> GeoAPI
    GeoAPI <--> VisEngine
    VisEngine <--> UIHandler
    UIHandler <--> User
    
    %% Error Handling
    MCPServer <--> ErrorHandler
    GeoAdapter <--> ErrorHandler
    VisEngine <--> ErrorHandler
    
    %% Supporting Services
    MCPServer <--> AuthService
    GeoAdapter <--> AuthService
    MCPServer <--> CacheLayer
    GeoAdapter <--> CacheLayer
    MCPServer <--> LogService
    GeoAdapter <--> LogService
    MCPServer <--> ConfigMgr
    GeoAdapter <--> ConfigMgr
    
    %% Subgraphs
    subgraph "Client Side"
        User
        AI
        MCPClient
        UIHandler
    end
    
    subgraph "Server Side"
        MCPServer
        GeoAdapter
        ErrorHandler
        AuthService
        CacheLayer
        LogService
        ConfigMgr
    end
    
    subgraph "GeoGebra Platform"
        GeoAPI
        VisEngine
    end
    
    %% Styling
    classDef user fill:#f9f,stroke:#333,stroke-width:2px;
    classDef ai fill:#bbf,stroke:#333,stroke-width:2px;
    classDef mcp fill:#bfb,stroke:#333,stroke-width:2px;
    classDef geo fill:#fbf,stroke:#333,stroke-width:2px;
    classDef support fill:#fbb,stroke:#333,stroke-width:2px;
    
    class User user;
    class AI ai;
    class MCPClient,MCPServer mcp;
    class GeoAdapter,GeoAPI,VisEngine geo;
    class UIHandler,ErrorHandler,AuthService,CacheLayer,LogService,ConfigMgr support;
```

This Mermaid diagram illustrates the architecture for the MCP-GeoGebra integration. It shows the main components and their interactions, organized into three main areas: Client Side, Server Side, and the GeoGebra Platform.

The diagram depicts:
1. The flow of information from the user through the AI assistant to the MCP components
2. How the MCP Server communicates with the GeoGebra Adapter
3. The connection to the GeoGebra API and Visualization Engine
4. Supporting components like Authentication, Caching, Logging, and Configuration
5. The Error Handler's connections to key components

This visual representation complements the detailed architecture document by providing a clear overview of the system structure and data flow.

