const vscode = require('vscode');

/**
 * Organizes and formats the document by re-indenting lines.
 * @param {vscode.TextDocument} document
 * @returns {vscode.TextEdit[]}
 */

function formatDocumentCpp(document) {
	console.log("formatting in cpp:\n", document);
	console.log("formatted in cpp:\n", document);
	return document;
}

function formatDocumentYacc(document) {
	const edits = [];
	const indentChar = '\t'; // Use tabs for indentation
	let blockIndentLevel = 0; // Tracks the nesting level of %{ ... %} blocks
	let insideCurlyBlock = false; // Tracks if inside { ... } blocks
	let inProgressCodeBlock = ''; // Holds ongoing %{ ... %} content for splitting

	for (let i = 0; i < document.lineCount; i++) {
		const line = document.lineAt(i);
		let text = line.text.trim();

		// Skip empty lines
		if (text === '') continue;

		let formattedLines = [];

		// Split line into parts based on %{ and %}
		let parts = text.split(/(%{|%})/).filter(part => part !== '');

		for (let part of parts) {
			if (part === '%{') {
				// Handle block opening for %{
				if (inProgressCodeBlock !== '') {
					// Flush in-progress code before starting a new block
					formattedLines.push(`${indentChar.repeat(blockIndentLevel)}${formatDocumentCpp(inProgressCodeBlock.trim())}`);
					inProgressCodeBlock = '';
				}
				formattedLines.push(`${indentChar.repeat(blockIndentLevel)}%{`);
				blockIndentLevel++;
			} else if (part === '%}') {
				// Handle block closing for %}
				if (inProgressCodeBlock !== '') {
					// Flush in-progress code before closing the block
					formattedLines.push(`${indentChar.repeat(blockIndentLevel)}${formatDocumentCpp(inProgressCodeBlock.trim())}`);
					inProgressCodeBlock = '';
				}
				blockIndentLevel = Math.max(blockIndentLevel - 1, 0);
				formattedLines.push(`${indentChar.repeat(blockIndentLevel)}%}`);
			} else {
				// Inside %{ ... %}, add indentation
				inProgressCodeBlock += part.trim();
			}
		}

		// Add any remaining in-progress code
		if (inProgressCodeBlock !== '') {
			formattedLines.push(`${indentChar.repeat(blockIndentLevel)}${formatDocumentCpp(inProgressCodeBlock.trim())}`);
			inProgressCodeBlock = '';
		}

		// Combine the formatted lines into a single string
		const formattedText = formattedLines.join('\n');

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
