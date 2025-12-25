# URL Manager Chrome Extension

A powerful Chrome extension for managing URLs with custom headers, request types, and smart categorization.

## Version 1.1 - What's New 🎉

- **Category System**: Organize URLs into custom categories
- **Searchable Dropdowns**: Fast, case-insensitive category search and filtering
- **Smart Search**: Intelligent search ranking that prioritizes exact and partial matches
- **Backward Compatible**: Existing URLs automatically assigned to "Other" category
- **Enhanced UI**: Modern, user-friendly interface with improved form layout
- **Auto-Close Forms**: Accordion forms automatically close after updates

## Features

### URL Management
- Save and organize URLs with custom names
- **Category System**: Organize URLs into custom categories for better management
- Support for both GET and POST requests
- **Smart Search**: Intelligent search with result ranking (exact match → starts with → contains)
- **Category Filtering**: Filter URLs by category using searchable dropdown
- Search across URL name, address, and category
- Edit and delete saved URLs
- Pagination for better organization (5 items per page)

### Category Management
- **Searchable Category Dropdown**: Type to search categories (case-insensitive)
- **Create New Categories**: Simply type a new category name
- **Select Existing Categories**: Choose from dropdown of saved categories
- **Category Filtering**: Filter entire URL list by category
- **Auto-Complete**: Suggestions appear as you type
- **Backward Compatible**: Existing URLs automatically get "Other" category

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
   - **Select or create a category** (top field with searchable dropdown)
   - Enter URL name and address
   - Select request type (GET/POST)
   - For POST requests, add JSON body if needed
   - Click "Add" to save
   - Form automatically closes after save

2. **Editing URLs**
   - Click the edit icon next to any URL
   - Modify category, name, URL, or request type
   - Click "Update" to save changes
   - Or "Cancel" to discard changes
   - Form automatically closes after update/cancel

3. **Searching and Filtering URLs**
   - **Smart Search**: Use the search bar (with 🔍 icon)
     - Search across URL name, address, and category
     - Results ranked by relevance (exact match first)
     - Real-time results as you type
   
   - **Category Filter**: Use the category dropdown (with 🏷️ icon)
     - Type to search categories (case-insensitive)
     - Select a category to filter URLs
     - Click "X" to clear filter
     - Show all categories by clicking dropdown arrow
   
   - **Combined Filtering**: Search and category filter work together

### Managing Categories

1. **Creating Categories**
   - In Add/Edit URL form, type a new category name
   - Category is automatically created when URL is saved
   - No need to pre-define categories

2. **Using Existing Categories**
   - Click category dropdown in form or filter bar
   - Type to search existing categories
   - Click to select from dropdown
   - Categories are sorted alphabetically

3. **Filtering by Category**
   - Use the category dropdown in top bar
   - Select a category to view only those URLs
   - Clear filter to view all URLs again

### Managing Global Headers

1. **Adding Headers**
   - Open the "Global Headers" section
   - Click "+" to add a new header
   - Enter key and value
   - Headers are saved automatically
   - Headers apply to all requests via `declarativeNetRequest` API

2. **Import/Export**
   - Click the menu icon (⋮)
   - Select Import/Export
   - Choose JSON file for import
   - Save backup file for export
   - Includes both URLs and global headers

## Tips & Tricks

### Search Best Practices
- 🎯 **Exact matches appear first**: Type the exact URL name for instant access
- 📝 **Use partial words**: "console" will find "tbp-console"
- 🔤 **Case doesn't matter**: Search is case-insensitive
- 🏷️ **Search by category**: Type category name to find all related URLs

### Category Organization
- 📁 **Use meaningful names**: "Development", "Production", "Testing"
- 🎨 **Visual badges**: Each URL displays its category with a colored badge
- 🔄 **Easy re-categorization**: Edit any URL to change its category
- 📊 **Quick filtering**: One click to see all URLs in a category

### Workflow Optimization
- ⚡ **Quick add**: Category field is first for fast entry
- 🔄 **Auto-close forms**: Forms close automatically after save/update
- 🎯 **Smart defaults**: New URLs start with blank category (or type to search)
- 📋 **Keyboard friendly**: Use Tab to navigate between fields

### Performance
- 🚀 **Fast startup**: Background listeners optimized for quick load
- 💾 **Efficient storage**: Category data integrated without overhead
- 🔍 **Real-time search**: Results update instantly as you type

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
// URL Structure (v1.1+)
{
  name: "Example API",
  address: "https://api.example.com",
  type: "GET/POST",
  category: "Development", // New in v1.1 (defaults to "Other" if not set)
  body: {} // Optional, for POST requests
}

// Global Headers Structure
{
  "Authorization": "Bearer token",
  "Content-Type": "application/json"
}
```

### Search Algorithm
URL Manager uses an intelligent search ranking system:
- **Priority 0**: Exact match in name
- **Priority 1**: Name starts with search term
- **Priority 1.5**: Word match in name (e.g., "console" matches "tbp-console")
- **Priority 2**: Word starts with search term
- **Priority 3**: Contains in name
- **Priority 4**: Contains in address
- **Priority 5**: Contains in category

Results with the same priority are sorted alphabetically.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - [see](./LICENSE) the LICENSE file for details.

## Version History

### v1.1 (Current)
- ✨ Category system for organizing URLs
- 🔍 Smart search with intelligent result ranking
- 📋 Searchable category dropdowns (case-insensitive)
- 🎯 Category-based filtering
- ♻️ Backward compatibility (auto-assigns "Other" to existing URLs)
- 🎨 Enhanced UI/UX with improved form layout
- ⚡ Performance optimizations for faster startup
- 🔄 Auto-close forms after operations

### v1.0
- Initial release
- Basic URL management
- Global headers support
- GET/POST request handling
- Import/Export functionality
- Search and pagination

## Acknowledgments

- Built with Chrome Extension APIs
- Uses Manifest V3
- Uses `declarativeNetRequest` API for header modification
- Developed using Cursor AI Editor
- Inspired by the need for better API testing tools

## Development

This project was developed using [Cursor](https://cursor.sh/), an AI-powered code editor. Cursor's AI capabilities significantly enhanced the development process by:
- Providing intelligent code suggestions
- Helping with bug fixes and optimizations
- Assisting in code refactoring
- Generating documentation
- Offering real-time code explanations
- Implementing complex search algorithms
- Creating intuitive UI/UX patterns

The combination of Cursor's AI features and Chrome Extension APIs made it possible to create a robust, user-friendly, and feature-rich URL management tool.