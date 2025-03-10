import * as vscode from 'vscode';
import sbd from 'sbd'; // Requires esModuleInterop in tsconfig.json

let isAutoFormatting = false;
let suppressAutoFormat = false; // Prevent auto-format re-triggering on our own edits.
let formatTimeouts: Map<string, NodeJS.Timeout> = new Map();

/**
 * Activate the extension.
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('OneSentencePerLine extension activated!');

    // Register commands.
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

    // Subscribe to document changes if auto-format is enabled.
    const config = vscode.workspace.getConfiguration('oneSentencePerLine');
    if (config.get('autoFormat', true)) {
        subscribeToDocumentChanges(context);
        vscode.window.showInformationMessage('Auto-format is enabled.');
    } else {
        vscode.window.showInformationMessage('Auto-format is disabled.');
    }
}

/**
 * Subscribes to document changes. When a paste is detected (a change contains a newline),
 * we compute the union of affected lines. In addition, if there’s a blank line right after the last changed line,
 * we expand the range to include the following paragraph.
 */
function subscribeToDocumentChanges(context: vscode.ExtensionContext) {
    const disposable = vscode.workspace.onDidChangeTextDocument(event => {
        if (suppressAutoFormat) {
            return;
        }
        const uri = event.document.uri.toString();
        if (formatTimeouts.has(uri)) {
            clearTimeout(formatTimeouts.get(uri));
        }
        let pasteDetected = false;
        let minLine = Number.MAX_VALUE;
        let maxLine = -1;
        for (const change of event.contentChanges) {
            if (change.text.includes('\n')) {
                pasteDetected = true;
                minLine = Math.min(minLine, change.range.start.line);
                maxLine = Math.max(maxLine, change.range.end.line);
            }
        }
        const timeout = setTimeout(() => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.uri.toString() !== event.document.uri.toString()) {
                return;
            }
            if (pasteDetected) {
                // Use the union of affected lines.
                let start = minLine;
                let end = maxLine;
                // If there's a blank line immediately after the union, assume the paste spans multiple paragraphs.
                if (end < editor.document.lineCount - 1 && editor.document.lineAt(end + 1).text.trim() === '') {
                    // Extend end to cover the next paragraph.
                    end = findParagraphEnd(editor.document, end + 1);
                }
                const customRange = new vscode.Range(
                    new vscode.Position(start, 0),
                    new vscode.Position(end, editor.document.lineAt(end).text.length)
                );
                formatActiveEditorSelectionOrParagraph(customRange);
            } else {
                autoFormatParagraph(event.document);
            }
            formatTimeouts.delete(uri);
        }, 500);
        formatTimeouts.set(uri, timeout);
    });
    context.subscriptions.push(disposable);
}

/**
 * Formats the selected text (or expands the selection to full paragraphs).
 * If a customRange is provided (from paste), that range is used.
 */
function formatActiveEditorSelectionOrParagraph(customRange?: vscode.Range) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No active editor.');
        return;
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
                new vscode.Position(endLine, document.lineAt(endLine).text.length)
            );
        } else {
            const currentLine = editor.selection.active.line;
            const startLine = findParagraphStart(document, currentLine);
            const endLine = findParagraphEnd(document, currentLine);
            range = new vscode.Range(
                new vscode.Position(startLine, 0),
                new vscode.Position(endLine, document.lineAt(endLine).text.length)
            );
        }
    }

    const originalText = document.getText(range);
    // Split into paragraphs using one or more blank lines.
    const paragraphs = originalText.split(/\r?\n\s*\r?\n/);
    const formattedParagraphs = paragraphs.map(p => {
        // If the paragraph is already processed (each line ends with punctuation), return it unchanged.
        if (isParagraphProcessed(p)) {
            return p.trim();
        }
        // Otherwise, use sbd to split into sentences.
        const sentences = sbd.sentences(p, { newline_boundaries: false, sanitize: true });
        return sentences.join('\n').trim();
    });
    const formattedText = formattedParagraphs.join('\n\n');

    suppressAutoFormat = true;
    editor.edit(editBuilder => {
        editBuilder.replace(range, formattedText);
    }).then(success => {
        setTimeout(() => { suppressAutoFormat = false; }, 100);
        if (success) {
            vscode.window.showInformationMessage('Formatted text to one sentence per line.');
        } else {
            vscode.window.showErrorMessage('Failed to format text.');
        }
    });
}

/**
 * Auto-formats the paragraph where the user's cursor is located.
 */
function autoFormatParagraph(document: vscode.TextDocument) {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.toString() !== document.uri.toString()) {
        return;
    }
    if (isAutoFormatting) {
        return;
    }
    isAutoFormatting = true;
    const currentLine = editor.selection.active.line;
    const startLine = findParagraphStart(document, currentLine);
    const endLine = findParagraphEnd(document, currentLine);
    const range = new vscode.Range(
        new vscode.Position(startLine, 0),
        new vscode.Position(endLine, document.lineAt(endLine).text.length)
    );
    const originalText = document.getText(range);
    const paragraphs = originalText.split(/\r?\n\s*\r?\n/);
    const formattedParagraphs = paragraphs.map(p => {
        if (isParagraphProcessed(p)) {
            return p.trim();
        }
        const sentences = sbd.sentences(p, { newline_boundaries: false, sanitize: true });
        return sentences.join('\n').trim();
    });
    const formattedText = formattedParagraphs.join('\n\n');
    if (formattedText !== originalText) {
        editor.edit(editBuilder => {
            editBuilder.replace(range, formattedText);
        }).then(() => {
            isAutoFormatting = false;
        }, () => {
            isAutoFormatting = false;
        });
    } else {
        isAutoFormatting = false;
    }
}

/**
 * Checks if a paragraph is already processed, meaning it already appears to have one sentence per line.
 * We assume it is processed if there are multiple lines and every non-empty line ends with punctuation.
 */
function isParagraphProcessed(p: string): boolean {
    const lines = p.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length <= 1) {
        return false;
    }
    return lines.every(line => /[.!?]["']?$/.test(line));
}

/**
 * Finds the starting line of a paragraph by scanning upward until a blank line is encountered.
 */
function findParagraphStart(document: vscode.TextDocument, lineNumber: number): number {
    let startLine = lineNumber;
    while (startLine > 0 && document.lineAt(startLine - 1).text.trim() !== '') {
        startLine--;
    }
    return startLine;
}

/**
 * Finds the ending line of a paragraph by scanning downward until a blank line is encountered.
 */
function findParagraphEnd(document: vscode.TextDocument, lineNumber: number): number {
    let endLine = lineNumber;
    while (endLine < document.lineCount - 1 && document.lineAt(endLine + 1).text.trim() !== '') {
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
