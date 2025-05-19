/**
 * MCP Server Types
 * Based on the Model Context Protocol specification
 */

// Client capabilities
export interface ClientCapabilities {
  sampling?: SamplingCapability;
  notifications?: NotificationCapability;
}

export interface SamplingCapability {
  supported: boolean;
}

export interface NotificationCapability {
  supported: boolean;
}

// Server capabilities
export interface ServerCapabilities {
  resources?: ResourceCapability;
  tools?: ToolCapability;
  prompts?: PromptCapability;
}

export interface ResourceCapability {
  supported: boolean;
  changeNotifications?: boolean;
}

export interface ToolCapability {
  supported: boolean;
  executionNotifications?: boolean;
}

export interface PromptCapability {
  supported: boolean;
  executionNotifications?: boolean;
}

// Client and server info
export interface ClientInfo {
  name: string;
  version?: string;
}

export interface ServerInfo {
  name: string;
  version: string;
}

// Initialize parameters and result
export interface InitializeParams {
  capabilities: ClientCapabilities;
  clientInfo?: ClientInfo;
  locale?: string;
  rootUri?: string;
}

export interface InitializeResult {
  capabilities: ServerCapabilities;
  serverInfo?: ServerInfo;
}

// Resource types
export interface Resource {
  id: string;
  type: string;
  data: any;
  metadata?: {
    title?: string;
    description?: string;
    timestamp?: string;
    [key: string]: any;
  };
}

// Resource parameters
export interface GetResourcesParams {
  resourceTypes?: string[];
  filter?: any;
}

export interface SubscribeParams {
  resourceTypes: string[];
  filter?: any;
  subscriptionId?: string;
}

export interface SubscriptionResult {
  subscriptionId: string;
  resources: Resource[];
}

export interface UnsubscribeParams {
  subscriptionId: string;
}

// Tool types
export interface Tool {
  name: string;
  description: string;
  inputSchema: any; // JSON Schema
  outputSchema: any; // JSON Schema
}

export interface GetToolsParams {
  filter?: any;
}

export interface ExecuteToolParams {
  toolName: string;
  arguments: any;
  executionId?: string;
  metadata?: {
    userInitiated?: boolean;
    [key: string]: any;
  };
}

export interface ExecuteToolResult {
  result: any;
  resources?: Resource[];
  error?: ErrorResponse;
}

// Prompt types
export interface Prompt {
  id: string;
  title: string;
  description?: string;
  inputSchema: any; // JSON Schema
}

export interface GetPromptsParams {
  filter?: any;
}

export interface ExecutePromptParams {
  promptId: string;
  arguments: any;
  executionId?: string;
}

export interface ExecutePromptResult {
  result: any;
  resources?: Resource[];
  error?: ErrorResponse;
}

// Error response
export interface ErrorResponse {
  code: string;
  category?: string;
  severity?: number;
  message: string;
  context?: any;
  details?: any;
  recovery?: {
    recoverable: boolean;
    retryable: boolean;
    alternatives?: string[];
    suggestedAction?: string;
  };
}

// Notification types
export interface ResourceChangeNotification {
  subscriptionId: string;
  changes: ResourceChange[];
}

export interface ResourceChange {
  type: 'created' | 'updated' | 'deleted';
  resource: Resource;
}

export interface ToolExecutionNotification {
  executionId: string;
  status: 'started' | 'progress' | 'completed' | 'error';
  progress?: {
    percentage?: number;
    message?: string;
  };
  result?: any;
  error?: ErrorResponse;
}

export interface PromptExecutionNotification {
  executionId: string;
  status: 'started' | 'progress' | 'completed' | 'error';
  progress?: {
    percentage?: number;
    message?: string;
  };
  result?: any;
  error?: ErrorResponse;
}

// GeoGebra specific types
export interface VisualizationParams {
  type: '2d-graph' | '3d-graph' | 'geometry' | 'spreadsheet' | 'cas';
  title?: string;
  objects?: CreateObjectParams[];
  commands?: string[];
  viewSettings?: ViewSettings;
  interactive?: boolean;
}

export interface CreateObjectParams {
  type: 'point' | 'line' | 'circle' | 'polygon' | 'function' | 'text' | 'vector' | 'conic';
  definition: string;
  label?: string;
  style?: ObjectStyle;
}

export interface ObjectStyle {
  color?: string;
  opacity?: number;
  lineThickness?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  pointStyle?: 'circle' | 'cross' | 'diamond' | 'plus' | 'square';
  pointSize?: number;
  fillColor?: string;
  fillOpacity?: number;
}

export interface ViewSettings {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  zMin?: number;
  zMax?: number;
  showGrid?: boolean;
  showAxes?: boolean;
}

export interface VisualizationResult {
  visualizationId: string;
  type: string;
  objects: ObjectResult[];
  viewSettings: ViewSettings;
  renderData: {
    format: 'png' | 'svg' | 'html';
    data: string;
    width: number;
    height: number;
  };
  interactiveUrl?: string;
}

export interface ObjectResult {
  objectId: string;
  type: string;
  coordinates?: number[];
  definition: string;
  label?: string;
  style: ObjectStyle;
  dependencies?: string[];
}

