const vscode = require('vscode');

/**
 * Organizes and formats the document by re-indenting lines.
 * @param {vscode.TextDocument} document
 * @returns {vscode.TextEdit[]}
 */
function formatDocumentYacc(document) {
	const edits = [];
	const indentChar = '\t'; // Use tabs for indentation
	let blockIndentLevel = 0; // Tracks the nesting level of %{ ... %} blocks
	let insideCurlyBlock = false; // Tracks if inside { ... } blocks

	for (let i = 0; i < document.lineCount; i++) {
		const line = document.lineAt(i);
		let text = line.text.trim();

		// Skip empty lines
		if (text === '') continue;

		let formattedText = text;

		// Handle block openings for %{
		if (text.startsWith('%{') && !text.endsWith('%}')) {
			// Ensure `%{` is on its own line
			if (text.length > 2) {
				formattedText = '%{\n' + indentChar.repeat(blockIndentLevel + 1) + text.slice(2).trim();
			}
			blockIndentLevel++;
		} else if (text.startsWith('%{') && text.endsWith('%}')) {
			// Convert `%{ abc%}` to multiline format
			const content = text.slice(2, -2).trim();
			formattedText = `%{\n${indentChar.repeat(blockIndentLevel + 1)}${content}\n%}`;
		} else if (text.startsWith('%}')) {
			// Handle block closings for %}
			blockIndentLevel = Math.max(blockIndentLevel - 1, 0);
			formattedText = `${indentChar.repeat(blockIndentLevel)}%}`;
		} else if (blockIndentLevel > 0) {
			// Indent code inside %{ ... %}
			formattedText = `${indentChar.repeat(blockIndentLevel)}${text}`;
		}

		// Handle block openings for { ... }
		if (text.startsWith('{') && !insideCurlyBlock) {
			insideCurlyBlock = true;
		}

		// Handle block closings for { ... }
		if (text.startsWith('}') && insideCurlyBlock) {
			insideCurlyBlock = false;
		}

		// Apply indentation for { ... } blocks
		if (insideCurlyBlock) {
			formattedText = `${indentChar}${text}`;
		}

		// Add edit if the formatted text differs from the original
		if (formattedText !== line.text) {
			edits.push(vscode.TextEdit.replace(line.range, formattedText));
		}
	}

	return edits;
}


/**
 * Activate the extension.
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('YACC Aid is now active!');

	// Register the formatter for Lex
	const lexFormatter = vscode.languages.registerDocumentFormattingEditProvider(
		{ language: 'lex' },
		{
			provideDocumentFormattingEdits(document) {
				return formatDocumentLex(document);
			},
		}
	);

	// Register the formatter for YACC
	const yaccFormatter = vscode.languages.registerDocumentFormattingEditProvider(
		{ language: 'yacc' },
		{
			provideDocumentFormattingEdits(document) {
				return formatDocumentYacc(document);
			},
		}
	);

	context.subscriptions.push(lexFormatter, yaccFormatter);
}

/**
 * Deactivate the extension.
 */
function deactivate() { }

module.exports = {
	activate,
	deactivate,
};
