# One Sentence Per Line

One Sentence Per Line is a Visual Studio Code extension that reformats text so that each sentence appears on its own line. This improves readability and simplifies version control by reducing differences when changes occur.

## Features

- **Automatic Sentence Splitting:**  
  Uses the [sbd](https://www.npmjs.com/package/sbd) library to reliably split paragraphs into sentences and reassemble them so that each sentence is on its own line.
  
- **Manual Formatting Command:**  
  Format the selected text (or the entire paragraph if any part is selected) using the default keybinding (Ctrl+Alt+F on Windows/Linux, Cmd+Alt+F on macOS).

- **Auto-Format on Paste & Typing:**  
  When you paste text, the extension automatically selects all affected lines and processes each paragraph so that every sentence appears on its own line.

- **Toggle Auto-Format:**  
  Enable or disable auto-formatting on text changes using the toggle command (Ctrl+Alt+T on Windows/Linux, Cmd+Alt+T on macOS).

## Installation

### Packaging the Extension

1. **Install Dependencies and Build:**  
   Open a terminal in the extension’s root (the folder containing `package.json`) and run:
   ```bash
   npm install
   npm run compile
   ```
   This compiles your extension into the `dist/` folder.

2. **Package the Extension:**  
   Install the VS Code Extension Manager (if not already installed):
   ```bash
   npm install -g vsce
   ```
   Then package the extension:
   ```bash
   vsce package
   ```
   This generates a file like `one-sentence-per-line-0.0.1.vsix` in your project folder.

### Installing the VSIX File

1. Open Visual Studio Code.
2. Go to the Extensions view (Ctrl+Shift+X).
3. Click the ellipsis (three dots) in the top-right corner and choose **"Install from VSIX..."**.
4. Browse for and select your generated `.vsix` file.

## Usage

### Commands

- **Format: One Sentence Per Line**  
  - **Command ID:** `one-sentence-per-line.format`  
  - **Keybinding:** Ctrl+Alt+F (Cmd+Alt+F on macOS)  
  This command processes the current selection. If part of a paragraph is selected, it expands the selection to include the entire paragraph before formatting.

- **Toggle Auto-Format**  
  - **Command ID:** `one-sentence-per-line.toggleAutoFormat`  
  - **Keybinding:** Ctrl+Alt+T (Cmd+Alt+T on macOS)  
  Enable or disable automatic formatting on text changes.

- **Hello World (for testing)**  
  - **Command ID:** `one-sentence-per-line.helloWorld`  
  - **Keybinding:** Ctrl+Alt+H (Cmd+Alt+H on macOS)

### How It Works

- **Paragraph Splitting:**  
  The extension splits text into paragraphs using a regex that detects one or more blank lines.
  
- **Sentence Splitting:**  
  For each paragraph, the [sbd](https://www.npmjs.com/package/sbd) library splits the paragraph into sentences, which are then reassembled with a newline between each sentence.

- **Auto-Formatting on Paste:**  
  When pasted text is detected, the extension selects all affected lines (without altering paragraph breaks) and processes them as if you manually invoked the format command.

- **Preventing Over-Processing:**  
  The extension checks if a paragraph is already processed (each non-empty line ends with punctuation) and will leave it unchanged on repeated formatting commands.

## Configuration

You can customize the behavior via VS Code settings. For example, to disable auto-formatting on every text change, add this to your settings:

```json
"oneSentencePerLine.autoFormat": false
```

This setting is available under *One Sentence Per Line Configuration* in the Settings UI.

## Troubleshooting

- **Unsaved Files:**  
  If errors occur with "untitled" files, save your document first (e.g. as `.md` or `.txt`).

- **Conflicting Extensions:**  
  Some extensions may interfere with file contexts. If unexpected behavior occurs, try disabling other formatting or file-handling extensions.

- **View Logs:**  
  Use the **Output** panel (select “Log (Extension Host)”) in VS Code for error messages if the extension isn’t behaving as expected.

## Development

To build and package the extension:

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Compile the extension:**
   ```bash
   npm run compile
   ```
3. **Package the extension:**
   ```bash
   vsce package
   ```

## Contributing

Contributions are welcome! If you have suggestions or encounter issues, please open an issue or submit a pull request on GitHub.

## License

This project is licensed under the [GPLv3 License](LICENSE).

---

Make sure you update the LICENSE file to include the full text of GPLv3. Save this README.md in your extension’s root folder along with your package.json.