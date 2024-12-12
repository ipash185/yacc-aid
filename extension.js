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
    const splitTokens = ['%{', '%}', '%union', '%start', '%type', '%token', '%left', '%right', '%nonassoc', '%%'];

    // Read the entire content of the document
    let content = document.getText();

    // Split into meaningful parts while ignoring string literals
    const parts = content.split(/((?<!["'])(?:%\{|%\}|%union|%start|%type|%token|%left|%right|%nonassoc|%%)(?!["']))/);

    let formattedLines = [];
    let blockIndentLevel = 0;

	const CPP_CODE = Symbol('CPP_CODE');
	const PRODUCTIONS = Symbol('PRODUCTIONS');
	const OTHERS = Symbol('OTHERS');

	let state = null;

    for (const part of parts) {
        const trimmedPart = part.trim();

        if (trimmedPart === '%{') {
			state = CPP_CODE;
            formattedLines.push(`${indentChar.repeat(blockIndentLevel)}%{\n`);
            blockIndentLevel++;
        } else if (trimmedPart === '%}') {
			state = null;
            blockIndentLevel = Math.max(blockIndentLevel - 1, 0);
            formattedLines.push(`${indentChar.repeat(blockIndentLevel)}%}\n`);
        } else if (trimmedPart === '%union') {
			state = CPP_CODE;
			formattedLines.push(`\n${indentChar.repeat(blockIndentLevel)}%union\n`);
        } else if (trimmedPart === '%%') {
			if (state === null) {
				state = PRODUCTIONS;
			}
			else {
				state = CPP_CODE;
			}
			formattedLines.push(`\n\n${indentChar.repeat(blockIndentLevel)}%%\n\n`);
		} else if (trimmedPart === '%start' || trimmedPart === '%type' || trimmedPart === '%token' || trimmedPart === '%left' || trimmedPart === '%right' || trimmedPart === '%nonassoc') {
			state = OTHERS;
			formattedLines.push(`\n${indentChar.repeat(blockIndentLevel)}${trimmedPart}\t`);
		} else {
			if (state === CPP_CODE) {
				formattedLines.push(`${indentChar.repeat(blockIndentLevel)}${trimmedPart}\n`);
			}
			else if (state === PRODUCTIONS) {
				formattedLines.push(`${indentChar.repeat(blockIndentLevel)}${trimmedPart}\n`);
			}
			else if (state === OTHERS) {
				formattedLines.push(`${trimmedPart}\n`);
			}
		}
    }

    // Join formatted lines into a single string
    const formattedContent = formattedLines.join('');

    // Replace the entire document if changes are detected
    if (formattedContent !== content) {
        const fullRange = new vscode.Range(
            document.lineAt(0).range.start,
            document.lineAt(document.lineCount - 1).range.end
        );
        edits.push(vscode.TextEdit.replace(fullRange, formattedContent));
    }

    return edits;
}

function organiseYACC() {
	console.log("hi");
}

/**
 * Activate the extension.
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	console.log('YACC Aid is now active!');
	const organiseCommand = vscode.commands.registerCommand(
		'yacc-aid.organise',
		organiseYACC
	);

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

	context.subscriptions.push(organiseCommand, lexFormatter, yaccFormatter);
}

/**
 * Deactivate the extension.
 */
function deactivate() { }

module.exports = {
	activate,
	deactivate,
};
