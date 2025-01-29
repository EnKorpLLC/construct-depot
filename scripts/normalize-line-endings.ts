import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import chalk from 'chalk';

function normalizeLineEndings(content: string): string {
    // Convert all line endings to LF
    return content.replace(/\r\n/g, '\n');
}

function processFile(filePath: string): void {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const normalized = normalizeLineEndings(content);
        
        if (content !== normalized) {
            fs.writeFileSync(filePath, normalized, 'utf8');
            console.log(chalk.green(`✓ Normalized line endings in ${filePath}`));
        }
    } catch (error) {
        console.error(chalk.red(`Error processing ${filePath}:`), error);
    }
}

function main() {
    console.log(chalk.blue('Starting line ending normalization...'));
    
    // Find all markdown files
    const files = glob.sync('**/*.md', {
        ignore: ['node_modules/**', 'dist/**', '.next/**']
    });
    
    let processedCount = 0;
    
    files.forEach(file => {
        processFile(file);
        processedCount++;
    });
    
    console.log(chalk.blue(`\nProcessed ${processedCount} files`));
}

main(); 