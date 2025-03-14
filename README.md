# URL Manager Chrome Extension

A powerful Chrome extension for managing URLs with custom headers and request types.

## Features

### URL Management
- Save and organize URLs with custom names
- Support for both GET and POST requests
- Quick access to saved URLs
- Search functionality for saved links
- Edit and delete saved URLs
- Pagination for better organization

### Request Handling
- **GET Requests**: 
  - Automatically opens in a new tab
  - Applies global headers to requests
  - Automatically fills URL input with current tab's URL

- **POST Requests**:
  - Custom JSON body support
  - Response display in a formatted view
  - Status code and response headers information
  - Error handling with user-friendly messages

### Header Management
- Global headers support for all requests
- Add, edit, and remove global headers
- Headers persist across browser sessions
- Applied automatically to both GET and POST requests

### Data Management
- Import/Export functionality for backup and sharing
- Export all URLs and header configurations
- Import configurations from JSON file
- Option to delete all saved data

### User Interface
- Clean and intuitive interface
- Accordion-style sections for better organization
- Search functionality for quick access
- Responsive design with proper spacing
- Easy-to-use edit and delete functions

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to \`chrome://extensions/\`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

### Managing URLs

1. **Adding a URL**
   - Click the extension icon
   - Enter URL name and address
   - Select request type (GET/POST)
   - For POST requests, add JSON body if needed
   - Click "Add" to save

2. **Editing URLs**
   - Click the edit icon next to any URL
   - Modify the details as needed
   - Click "Update" to save changes
   - Or "Cancel" to discard changes

3. **Searching URLs**
   - Use the search bar at the top
   - Results update in real-time
   - Pagination maintains organization

### Managing Global Headers

1. **Adding Headers**
   - Open the "Global Headers" section
   - Click "+" to add a new header
   - Enter key and value
   - Headers are saved automatically

2. **Import/Export**
   - Click the menu icon
   - Select Import/Export
   - Choose JSON file for import
   - Save backup file for export

## Technical Details

### Storage
- Uses Chrome's \`storage.local\` API
- Stores URLs and global headers
- Maintains data across browser sessions

### Permissions Required
```json
{
  "permissions": [
    "storage",
    "tabs",
    "declarativeNetRequest",
    "declarativeNetRequestWithHostAccess"
  ],
  "host_permissions": [
    "<all_urls>"
  ]
}
```

### Data Structure
```javascript
// URL Structure
{
  name: "Example API",
  address: "https://api.example.com",
  type: "GET/POST",
  body: {} // Optional, for POST requests
}

// Global Headers Structure
{
  "Authorization": "Bearer token",
  "Content-Type": "application/json"
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - [see](./LICENSE) the LICENSE file for details.

## Acknowledgments

- Built with Chrome Extension APIs
- Uses Manifest V3
- Developed using Cursor AI Editor
- Inspired by the need for better API testing tools

## Development

This project was developed using [Cursor](https://cursor.sh/), an AI-powered code editor. Cursor's AI capabilities significantly enhanced the development process by:
- Providing intelligent code suggestions
- Helping with bug fixes and optimizations
- Assisting in code refactoring
- Generating documentation
- Offering real-time code explanations

The combination of Cursor's AI features and Chrome Extension APIs made it possible to create a robust and user-friendly URL management tool.