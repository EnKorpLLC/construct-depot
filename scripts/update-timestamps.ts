import * as fs from 'fs';
import * as path from 'path';
import glob from 'glob';
import chalk from 'chalk';

class TimestampUpdater {
  private readonly pattern = '**/*.md';
  private readonly excludePatterns = [
    'node_modules/**',
    'dist/**',
    '.git/**',
    'coverage/**'
  ];

  private readonly timestampRegex = /Last Updated: \d{4}-\d{2}-\d{2} \d{2}:\d{2}/;

  async update() {
    console.log(chalk.blue('Starting timestamp updates...'));
    
    const files = await this.findFiles();
    let updatedCount = 0;

    for (const file of files) {
      try {
        const content = await fs.promises.readFile(file, 'utf8');
        const stats = await fs.promises.stat(file);
        
        // Only update if file has been modified
        if (this.needsUpdate(content, stats)) {
          const updatedContent = this.updateTimestamp(content);
          await fs.promises.writeFile(file, updatedContent, 'utf8');
          console.log(chalk.green(`Updated timestamp: ${file}`));
          updatedCount++;
        }
      } catch (error) {
        console.error(chalk.red(`Error processing ${file}:`), error);
      }
    }

    console.log(chalk.blue(`Updated timestamps in ${updatedCount} files.`));
  }

  private needsUpdate(content: string, stats: fs.Stats): boolean {
    const match = content.match(this.timestampRegex);
    if (!match) return true;

    const timestamp = new Date(match[0].replace('Last Updated: ', ''));
    const modifiedTime = new Date(stats.mtime);

    return modifiedTime > timestamp;
  }

  private updateTimestamp(content: string): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/T/, ' ').substring(0, 16);
    
    if (this.timestampRegex.test(content)) {
      return content.replace(this.timestampRegex, `Last Updated: ${timestamp}`);
    } else {
      // Add timestamp after first heading if not present
      const lines = content.split('\n');
      const firstHeadingIndex = lines.findIndex(line => /^#\s+/.test(line));
      
      if (firstHeadingIndex !== -1) {
        lines.splice(firstHeadingIndex + 1, 0, '', `Last Updated: ${timestamp}`, '');
        return lines.join('\n');
      } else {
        return `Last Updated: ${timestamp}\n\n${content}`;
      }
    }
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
const updater = new TimestampUpdater();
updater.update().catch(console.error); 