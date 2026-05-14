# Educational AI Agent App - Project TODO

## Core Features

### Database & Backend
- [x] Create database schema for documents, saves, and user preferences
- [x] Implement S3 file upload/storage for PDFs
- [x] Build OpenRouter agent orchestration system with four models
- [x] Create tRPC procedures for document upload, task execution, saves CRUD
- [x] Implement OCR agent (baidu/qianfan-ocr-fast:free)
- [x] Implement orchestrating agent (inclusionai/ring-2.6-1t:free)
- [x] Implement textual tasks agent (google/gemma-4-31b-it:free)
- [x] Implement rerouting/intermediary agent (openrouter/owl-alpha)
- [x] Build task execution pipeline (Summarize, Extract Key Points, Generate Diagram/Infographic description, Custom Instructions)

### Frontend - Core UI
- [x] Build split-view layout (PDF viewer left, output container right)
- [x] Implement in-browser PDF viewer with page navigation and zoom controls
- [x] Create task selection panel with page range/chapter selection
- [x] Build task type selector (Summarize, Extract Key Points, Generate Diagram/Infographic description, Custom Instructions)
- [x] Create custom instructions chat box
- [x] Build action button to trigger LLM task execution
- [x] Implement output container with formatted LLM response display
- [x] Add markdown rendering with syntax highlighting
- [x] Implement copy-to-clipboard functionality
- [x] Add download options (JSON and text formats)

### Frontend - Navigation & Tabs
- [x] Create navigation bar with three tabs: "Document Viewer", "Saves", "Settings"
- [x] Build Document Viewer tab with split-view layout
- [x] Implement Saves tab with saved responses list
- [x] Implement Settings tab with user preferences

### Frontend - Document Management
- [x] Build PDF upload interface
- [x] Implement file storage via S3
- [x] Add clear/remove document functionality
- [x] Display document name and metadata

### Frontend - Saves Tab
- [x] Display list of saved LLM responses
- [x] Show document name, page/task context, and timestamp for each entry
- [x] Implement view/expand functionality for saved entries
- [x] Add delete functionality for saved entries
- [x] Add download options (JSON, text) for saved entries

### Frontend - Settings Tab
- [x] Build default model selection interface
- [x] Add display options (theme, font size, etc.)
- [x] Implement saved data management (view size, clear all)
- [x] Add user preference persistence

### UI/UX Polish
- [x] Refine typography and spacing throughout
- [x] Implement elegant color scheme and theming
- [x] Add smooth transitions and micro-interactions
- [x] Ensure responsive design for various screen sizes
- [x] Add loading states and error handling
- [x] Implement empty states for no documents/saves
- [x] Add visual feedback for all user actions

### Testing & Deployment
- [x] Write vitest tests for backend procedures
- [x] Test all agent workflows end-to-end
- [x] Test PDF viewer functionality
- [x] Test file upload and storage
- [x] Test saves CRUD operations
- [x] Test settings persistence
- [x] Create checkpoint and prepare for deployment
