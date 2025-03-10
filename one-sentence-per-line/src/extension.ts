import * as vscode from 'vscode';
import sbd from 'sbd'; // Requires "esModuleInterop": true in tsconfig.json

let suppressAutoFormat = false; // Prevent our own edits from re-triggering formatting.
let formatTimeouts: Map<string, NodeJS.Timeout> = new Map();

export function activate(context: vscode.ExtensionContext) {
  console.log('OneSentencePerLine extension activated!');

  context.subscriptions.push(
    vscode.commands.registerCommand('one-sentence-per-line.helloWorld', () => {
      vscode.window.showInformationMessage('Hello World from OneSentencePerLine!');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('one-sentence-per-line.format', () => {
      formatActiveEditorSelectionOrParagraph();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('one-sentence-per-line.toggleAutoFormat', () => {
      toggleAutoFormat();
    })
  );

  // Subscribe to document changes to detect paste events.
  subscribeToDocumentChanges(context);
  console.log('Auto-format (paste) subscription established.');
}

/**
 * Subscribes to document changes.
 * If any content change includes a newline, we interpret that as a paste event.
 * Then we compute the union of all affected lines (minLine to maxLine) and immediately
 * set the editor’s selection to that custom range, then call our formatting function.
 */
function subscribeToDocumentChanges(context: vscode.ExtensionContext) {
  const disposable = vscode.workspace.onDidChangeTextDocument(event => {
    const config = vscode.workspace.getConfiguration('oneSentencePerLine');
    const autoFormatEnabled = config.get('autoFormat', true);
    if (!autoFormatEnabled) return;
    if (suppressAutoFormat) return;

    let pasteDetected = false;
    let minLine = Number.MAX_VALUE;
    let maxLine = -1;

    // Iterate over all content changes.
    for (const change of event.contentChanges) {
      if (change.text.includes('\n')) {
        pasteDetected = true;
        // Compute inserted line count.
        const insertedLines = change.text.split(/\r?\n/).length;
        const changeStart = change.range.start.line;
        const changeEnd = changeStart + insertedLines - 1;
        minLine = Math.min(minLine, changeStart);
        maxLine = Math.max(maxLine, changeEnd);
      }
    }

    if (pasteDetected) {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.uri.toString() !== event.document.uri.toString()) return;
      
      // Compute a custom range covering from minLine to maxLine using the full line range.
      const customRange = new vscode.Range(
        new vscode.Position(minLine, 0),
        new vscode.Position(maxLine, editor.document.lineAt(maxLine).range.end.character)
      );
      console.log("Paste detected. Custom range:", customRange);

      // Save the original selection.
      const originalSelection = editor.selection;
      // Temporarily set the selection to the custom range (invisibly).
      editor.selection = new vscode.Selection(customRange.start, customRange.end);
      // Immediately process the pasted text using the same formatting function as manual formatting.
      formatActiveEditorSelectionOrParagraph(customRange).then(() => {
        // Restore the original selection.
        editor.selection = originalSelection;
      });
    }
  });
  context.subscriptions.push(disposable);
}

/**
 * Formats the selected text (or, if provided, the customRange).
 * It splits the text into paragraphs (using one or more blank lines),
 * collapses internal newlines to a single space,
 * then uses sbd to split each paragraph into sentences.
 * Sentences are reassembled with one newline between them and paragraphs are reassembled with two newlines.
 */
function formatActiveEditorSelectionOrParagraph(customRange?: vscode.Range): Thenable<boolean> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage('No active editor.');
    return Promise.resolve(false);
  }
  const document = editor.document;
  let range: vscode.Range;
  if (customRange) {
    range = customRange;
  } else {
    const selection = editor.selection;
    if (!selection.isEmpty) {
      const startLine = findParagraphStart(document, selection.start.line);
      const endLine = findParagraphEnd(document, selection.end.line);
      range = new vscode.Range(
        new vscode.Position(startLine, 0),
        new vscode.Position(endLine, document.lineAt(endLine).range.end.character)
      );
    } else {
      const currentLine = editor.selection.active.line;
      const startLine = findParagraphStart(document, currentLine);
      const endLine = findParagraphEnd(document, currentLine);
      range = new vscode.Range(
        new vscode.Position(startLine, 0),
        new vscode.Position(endLine, document.lineAt(endLine).range.end.character)
      );
    }
  }
  console.log("Formatting range:", range);

  const originalText = document.getText(range);
  // Split the text into paragraphs (delimited by one or more blank lines).
  const paragraphs = originalText.split(/\r?\n\s*\r?\n/);
  const formattedParagraphs = paragraphs.map(p => {
    // Collapse internal newlines to a single space.
    const collapsed = p.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
    // Use sbd to split into sentences.
    const sentences = sbd.sentences(collapsed, { newline_boundaries: false, sanitize: true });
    return sentences.join('\n').trim();
  });
  const formattedText = formattedParagraphs.join('\n\n');

  suppressAutoFormat = true;
  return editor.edit(editBuilder => {
    editBuilder.replace(range, formattedText);
  }).then(success => {
    setTimeout(() => { suppressAutoFormat = false; }, 100);
    if (success) {
      console.log("Formatted text:", formattedText);
      vscode.window.showInformationMessage("Formatted pasted text to one sentence per line.");
    } else {
      vscode.window.showErrorMessage("Failed to format text.");
    }
    return success;
  });
}

/**
 * Finds the starting line of a paragraph by scanning upward until a blank line is encountered.
 */
function findParagraphStart(document: vscode.TextDocument, lineNumber: number): number {
  let startLine = lineNumber;
  while (startLine > 0 && document.lineAt(startLine - 1).text.trim() !== "") {
    startLine--;
  }
  return startLine;
}

/**
 * Finds the ending line of a paragraph by scanning downward until a blank line is encountered.
 */
function findParagraphEnd(document: vscode.TextDocument, lineNumber: number): number {
  let endLine = lineNumber;
  while (endLine < document.lineCount - 1 && document.lineAt(endLine + 1).text.trim() !== "") {
    endLine++;
  }
  return endLine;
}

/**
 * Toggles the auto-format configuration setting.
 */
function toggleAutoFormat() {
  const config = vscode.workspace.getConfiguration('oneSentencePerLine');
  const current = config.get('autoFormat', true);
  config.update('autoFormat', !current, vscode.ConfigurationTarget.Global).then(() => {
    vscode.window.showInformationMessage(`Auto-format is now ${!current ? 'enabled' : 'disabled'}.`);
  }, err => {
    vscode.window.showErrorMessage('Failed to update configuration: ' + err);
  });
}

export function deactivate() {}
