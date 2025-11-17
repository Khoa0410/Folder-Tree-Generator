# Folder Tree Generator

Generate a visual folder tree structure for any folder in VS Code.

## Features

- Right-click on any folder to generate a tree structure
- Automatically respects `.gitignore` patterns
- Includes default ignore patterns for common files (node_modules, .git, etc.)
- Outputs to `tree.txt` file

## Usage

1. Right-click on a folder in the Explorer
2. Select "Generate Folder Tree"
3. The tree structure will be saved to `tree.txt` in the selected folder

## Default Ignored Patterns

- node_modules
- .vscode
- out
- build
- dist
- .git
- .DS_Store
- Thumbs.db
- \*.log

If a `.gitignore` file exists, its patterns will be combined with the default patterns.

## Requirements

VS Code version 1.95.0 or higher

## Release Notes

### 0.0.1

Initial release
