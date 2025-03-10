# One Sentence Per Line

**One Sentence Per Line** is a Visual Studio Code extension that reformats your text so that each sentence appears on its own line. This helps improve readability and makes version control diffs cleaner. The extension provides manual formatting commands as well as a sidebar view with convenient buttons.

## Features

- **Manual Formatting:**  
  Press <kbd>Ctrl+Alt+F</kbd> (or run the command `one-sentence-per-line.formatSelected`) to format the selected text or, if nothing is selected, the current paragraph.
  
- **Format Entire Document:**  
  Use the "Format Document" button in the sidebar (or run the command `one-sentence-per-line.formatDocument`) to reformat the entire document.

- **Auto-Format on Paste:**  
  When you paste text, the extension automatically reformats the pasted text so that each sentence is on a new line.

- **Toggle Auto-Format:**  
  The sidebar includes an on/off slider to enable or disable auto-formatting (applied to pasted text).

- **Sidebar Integration:**  
  A custom view appears in the Activity Bar (left sidebar) with an icon. This view includes:
  - A **Format Document** button.
  - A **Format Selected** button.
  - An **Auto-Format Toggle** (on/off slider).

## Installation

### Prerequisites

- **Node.js and npm:** Make sure you have Node.js (and npm) installed.
- **VS Code:** Version 1.98 or later is required.

### Building and Packaging

1. **Clone the Repository** (if not already done):
   ```bash
   git clone https://github.com/Feureau/one-sentence-per-line.git
   cd one-sentence-per-line
   cd one-sentence-per-line  # Make sure you're in the folder with package.json
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Compile the Extension:**
   ```bash
   npm run compile
   ```
   This will compile your TypeScript source from the `src` folder into the `dist` folder.

4. **Package the Extension:**
   Make sure you have vsce installed:
   ```bash
   npm install -g vsce
   ```
   Then package your extension:
   ```bash
   vsce package
   ```
   This will generate a VSIX file (e.g. `one-sentence-per-line-0.0.1.vsix`) in your project folder.

### Installing the VSIX

1. Open Visual Studio Code.
2. Go to the Extensions view (Ctrl+Shift+X).
3. Click the ellipsis (three dots) at the top-right of the Extensions pane and choose **"Install from VSIX..."**.
4. Browse to and select your generated `.vsix` file.

## Usage

### Manual Commands

- **Format Selected / Format Paragraph:**  
  - Command: `one-sentence-per-line.formatSelected`
  - Keybinding: <kbd>Ctrl+Alt+F</kbd>
  - Description: Formats the selected text. If no text is selected, the current paragraph is reformatted so that each sentence is on its own line.

- **Format Entire Document:**  
  - Command: `one-sentence-per-line.formatDocument`
  - Description: Formats the entire document.

- **Toggle Auto-Format (Paste):**  
  - Command: `one-sentence-per-line.toggleAutoFormat`
  - Keybinding: <kbd>Ctrl+Alt+T</kbd>
  - Description: Toggles whether pasted text is automatically reformatted.

### Sidebar View

When you open VS Code, a new view appears in the Activity Bar on the left labeled **One Sentence** (with an icon from `resources/icon.png`). In that sidebar you'll find:
- A **Format Document** button: Formats the entire document.
- A **Format Selected** button: Formats only the selected text (or the current paragraph if nothing is selected).
- An **Auto-Format Toggle** (on/off slider): Enables or disables auto-formatting for pasted text.

Clicking these buttons sends commands to the extension to perform the corresponding actions.

## How It Works

- **Formatting Logic:**  
  The extension uses the [sbd](https://www.npmjs.com/package/sbd) library to detect sentence boundaries. It splits text into paragraphs (using blank lines as delimiters), collapses any internal newlines into spaces, and then splits each paragraph into sentences so that each sentence appears on its own line.

- **Auto-Format on Paste:**  
  When text is pasted into a document, the extension detects the change (by looking for newline characters), calculates the union of the affected lines, and automatically formats the pasted text using the same formatting logic as the manual command.

- **Manual Formatting:**  
  You can manually trigger formatting by using the command (or keybinding) to format the selected text or paragraph.

## Configuration

You can adjust settings for the extension in VS Code’s Settings. For example, you can toggle the auto-format (paste) feature:
```json
"oneSentencePerLine.autoFormat": true
```
This setting is available in the Settings UI under **One Sentence Per Line Configuration**.

## Development

### Compiling and Packaging

A batch file or Python script can be used to automate building and packaging. For example, to package your extension:

1. Run:
   ```bash
   npm install
   npm run compile
   vsce package
   ```
2. A VSIX file (e.g. `one-sentence-per-line-0.0.1.vsix`) will be generated in your project folder.

### Testing

You can use the VS Code Extension Development Host (F5) to test your extension. Open the project in VS Code, press F5, and a new window will launch with your extension enabled.

## License

This project is licensed under the [GPLv3 License](LICENSE).

## Contributing

Contributions are welcome! Please open issues or submit pull requests on GitHub.

