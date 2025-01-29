import * as fs from 'fs';
import * as path from 'path';
import glob from 'glob';
import chalk from 'chalk';

class LineEndingNormalizer {
  private readonly pattern = '{**/*.md,**/*.ts,**/*.js,**/*.json,**/*.yaml,**/*.yml}';
  private readonly excludePatterns = [
    'node_modules/**',
    'dist/**',
    '.git/**',
    'coverage/**'
  ];

  async normalize() {
    console.log(chalk.blue('Starting line ending normalization...'));
    
    const files = await this.findFiles();
    let processedCount = 0;

    for (const file of files) {
      try {
        const content = await fs.promises.readFile(file, 'utf8');
        const normalizedContent = content.replace(/\r\n/g, '\n');
        
        if (content !== normalizedContent) {
          await fs.promises.writeFile(file, normalizedContent, 'utf8');
          console.log(chalk.green(`Normalized: ${file}`));
        }
        
        processedCount++;
      } catch (error) {
        console.error(chalk.red(`Error processing ${file}:`), error);
      }
    }

    console.log(chalk.blue(`Processed ${processedCount} files.`));
  }

  private async findFiles(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      glob(this.pattern, {
        ignore: this.excludePatterns,
        nodir: true,
        absolute: false
      }, (err, matches) => {
        if (err) {
          reject(err);
        } else {
          resolve(matches);
        }
      });
    });
  }
}

// Create instance and run
const normalizer = new LineEndingNormalizer();
normalizer.normalize().catch(console.error); 