# AVA File Manager

A Monaco Editor-based file management system with full IDE capabilities built into the AVA workspace.

## Overview

The AVA File Manager provides a VS Code-like editing experience directly in the browser, with comprehensive file management capabilities and seamless integration with the AVA AI assistant.

## Features

### **Core Functionality**
- **Monaco Editor** - Full VS Code editing experience with IntelliSense
- **File Tree Explorer** - Navigate and manage your project structure
- **Syntax Highlighting** - Automatic language detection and highlighting
- **Auto-Save Detection** - Real-time change tracking and save indicators
- **Multi-File Support** - Open and edit multiple files simultaneously
- **New File Creation** - Create files with automatic language detection

### **User Interface**
- **VS Code Dark Theme** - Professional dark interface matching VS Code
- **File Icons** - Visual distinction between file types and folders
- **Status Bar** - Real-time status updates and file information
- **Toolbar** - Quick access to common operations
- **Responsive Design** - Works on desktop and tablet devices

### **Keyboard Shortcuts**
- `Ctrl+S` / `Cmd+S` - Save current file
- `Ctrl+R` / `Cmd+R` - Refresh file tree
- `Ctrl+N` / `Cmd+N` - Create new file
- All standard Monaco Editor shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+F, etc.)

## Supported Languages

### **Programming Languages**
- **JavaScript** (`.js`) - Full ES6+ support with IntelliSense
- **TypeScript** (`.ts`) - Type checking and advanced IntelliSense
- **Python** (`.py`) - Syntax highlighting and basic IntelliSense
- **Java** (`.java`) - Object-oriented programming support
- **C/C++** (`.c`, `.cpp`, `.h`, `.hpp`) - Systems programming support
- **C#** (`.cs`) - .NET framework support
- **Go** (`.go`) - Modern systems programming
- **Rust** (`.rs`) - Memory-safe systems programming
- **PHP** (`.php`) - Web development support
- **Ruby** (`.rb`) - Dynamic programming language

### **Web Technologies**
- **HTML** (`.html`, `.htm`) - Web markup with tag completion
- **CSS** (`.css`) - Styling with property completion
- **SCSS/Sass** (`.scss`, `.sass`) - CSS preprocessor support
- **JSON** (`.json`) - Data interchange format with validation
- **XML** (`.xml`) - Markup language with schema support

### **Documentation & Config**
- **Markdown** (`.md`) - Documentation with live preview
- **YAML** (`.yml`, `.yaml`) - Configuration files with validation
- **TOML** (`.toml`) - Configuration format
- **INI** (`.ini`) - Legacy configuration format
- **Properties** (`.properties`) - Java-style configuration

### **Shell & Scripts**
- **Bash** (`.sh`) - Unix shell scripting
- **PowerShell** (`.ps1`) - Windows automation
- **Batch** (`.bat`, `.cmd`) - Windows batch scripts
- **Dockerfile** (`Dockerfile`) - Container definitions
- **Makefile** (`Makefile`) - Build automation

### **Data & Query Languages**
- **SQL** (`.sql`) - Database queries with syntax highlighting
- **GraphQL** (`.graphql`, `.gql`) - API query language
- **Regular Expressions** - Pattern matching support

### **Specialized Formats**
- **Log Files** (`.log`) - Application logs with highlighting
- **CSV** (`.csv`) - Comma-separated values
- **Plain Text** (`.txt`) - Basic text editing

## File Operations

### **Basic Operations**
- **Open File** - Click any file in the explorer to open it
- **Save File** - Use Ctrl+S or click the Save button
- **Create New File** - Click "New File" button or use Ctrl+N
- **Refresh Explorer** - Click "Refresh" button or use Ctrl+R

### **Advanced Operations**
- **Auto-Save Detection** - File modification is tracked in real-time
- **Language Detection** - File type automatically detected from extension
- **Change Indicators** - Modified files show save button activation
- **Error Highlighting** - Syntax errors highlighted in real-time

## API Integration

The file manager integrates with the AVA backend API:

### **Endpoints Used**
- `GET /api/files/list` - Retrieve file tree structure
- `GET /api/files/read?path={filename}` - Read file contents
- `POST /api/files/write` - Save file contents

### **Data Formats**
```json
// File List Response
{
    "success": true,
    "items": [
        {
            "name": "filename.js",
            "type": "file",
            "size": 1024
        }
    ]
}

// File Read Response
{
    "success": true,
    "content": "file contents here"
}

// File Write Request
{
    "path": "filename.js",
    "content": "new file contents"
}
```

## Monaco Editor Configuration

### **Editor Settings**
- **Theme**: VS Code Dark theme
- **Font Size**: 14px
- **Line Numbers**: Enabled
- **Word Wrap**: Enabled
- **Minimap**: Enabled
- **Smooth Scrolling**: Enabled
- **Cursor Blinking**: Enabled
- **Whitespace Rendering**: Selection-based

### **Advanced Features**
- **IntelliSense** - Auto-completion and suggestions
- **Error Squiggles** - Real-time error detection
- **Find & Replace** - Powerful search capabilities
- **Multiple Cursors** - Edit multiple locations simultaneously
- **Code Folding** - Collapse/expand code blocks
- **Bracket Matching** - Automatic bracket highlighting

## Usage Examples

### **Opening and Editing Files**
1. Navigate to http://localhost:8080/file-manager
2. Browse the file tree in the left sidebar
3. Click on any file to open it in the editor
4. Make changes - the save button will activate
5. Use Ctrl+S or click Save to save changes

### **Creating New Files**
1. Click the "New File" button in the toolbar
2. Enter the filename with appropriate extension
3. Start editing - language will be auto-detected
4. Save the file using Ctrl+S

### **Working with Different Languages**
- **JavaScript**: Get full ES6+ IntelliSense and error checking
- **Python**: Syntax highlighting with basic completion
- **HTML**: Tag completion and validation
- **CSS**: Property completion and color previews
- **JSON**: Schema validation and formatting
- **Markdown**: Live syntax highlighting

## Integration Points

### **With AVA AI Assistant**
- File contents can be referenced in AI conversations
- AI can suggest code changes for the current file
- Direct file modification through AI commands

### **With Workspace Manager**
- File changes trigger workspace indexing updates
- Integration with dependency analysis
- Real-time file watching and updates

### **Future Integrations**
- **Airtable Integration** - Data management workflows
- **Windmill Integration** - Workflow automation
- **Git Integration** - Version control operations
- **Terminal Integration** - In-browser terminal access

## Troubleshooting

### **Common Issues**
- **Monaco Not Loading**: Check internet connection for CDN access
- **Files Not Appearing**: Verify API endpoints are responding
- **Save Failures**: Check file permissions and path validity
- **Language Not Detected**: Ensure file has correct extension

### **Performance Optimization**
- Large files (>1MB) may load slowly
- Minimap can be disabled for better performance
- File tree limited to reasonable directory sizes

## Technical Details

### **Dependencies**
- Monaco Editor 0.44.0 (CDN)
- AVA Backend API
- Modern browser with ES6+ support

### **Browser Compatibility**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### **File Size Limits**
- Maximum file size: 10MB
- Recommended: <1MB for optimal performance
- Very large files may cause browser performance issues

---

*Part of the AVA (Artifact Virtual Assistant) ecosystem - Advanced AI-powered development tools.*
