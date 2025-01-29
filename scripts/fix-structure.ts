import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

interface FileMove {
  source: string;
  destination: string;
  isReadme?: boolean;
}

class StructureFixer {
  private moves: FileMove[] = [];
  private readmeLocations = new Map<string, string>();
  private processedFiles = new Set<string>();

  constructor() {
    // Initialize with the correct README locations from project structure
    this.readmeLocations.set('api/authentication', 'Main API authentication documentation');
    this.readmeLocations.set('api/endpoints', 'API endpoints documentation');
    this.readmeLocations.set('api/error-handling', 'Error handling documentation');
    this.readmeLocations.set('api/websocket', 'WebSocket documentation');
    this.readmeLocations.set('development/guides', 'Development guides');
  }

  addMove(source: string, destination: string, isReadme = false) {
    this.moves.push({ source, destination, isReadme });
  }

  private async createDirectory(dir: string) {
    try {
      await fs.promises.mkdir(dir, { recursive: true });
      console.log(chalk.green(`Created directory: ${dir}`));
    } catch (error) {
      console.error(chalk.red(`Error creating directory ${dir}:`, error));
    }
  }

  private async moveFile(source: string, destination: string) {
    try {
      if (!fs.existsSync(source)) {
        console.log(chalk.yellow(`Source file not found: ${source}`));
        return;
      }

      const destDir = path.dirname(destination);
      await this.createDirectory(destDir);

      if (fs.existsSync(destination)) {
        const sourceContent = await fs.promises.readFile(source, 'utf8');
        const destContent = await fs.promises.readFile(destination, 'utf8');

        if (sourceContent === destContent) {
          await fs.promises.unlink(source);
          console.log(chalk.blue(`Removed duplicate file: ${source}`));
        } else {
          const duplicatePath = destination.replace('.md', '.duplicate.md');
          await fs.promises.rename(source, duplicatePath);
          console.log(chalk.yellow(`Moved unique file to: ${duplicatePath}`));
        }
      } else {
        await fs.promises.rename(source, destination);
        console.log(chalk.green(`Moved file: ${source} to ${destination}`));
      }
    } catch (error) {
      console.error(chalk.red(`Error moving file ${source} to ${destination}:`, error));
    }
  }

  private async handleReadmeDuplicates() {
    for (const [dir, description] of this.readmeLocations.entries()) {
      const readmeFiles = this.moves
        .filter(move => move.isReadme && move.destination.includes(dir))
        .map(move => move.source);

      if (readmeFiles.length > 0) {
        let bestReadme = readmeFiles[0];
        let maxContent = '';

        for (const file of readmeFiles) {
          if (fs.existsSync(file)) {
            const content = await fs.promises.readFile(file, 'utf8');
            if (content.length > maxContent.length) {
              maxContent = content;
              bestReadme = file;
            }
          }
        }

        const destination = path.join(dir, 'README.md');
        await this.moveFile(bestReadme, destination);

        // Remove other README files
        for (const file of readmeFiles) {
          if (file !== bestReadme && fs.existsSync(file)) {
            await fs.promises.unlink(file);
            console.log(chalk.blue(`Removed duplicate README: ${file}`));
          }
        }
      }
    }
  }

  async fix() {
    console.log(chalk.blue('Starting structure fixes...'));
    
    // Handle README files first
    await this.handleReadmeDuplicates();

    // Process other files
    for (const move of this.moves) {
      if (!move.isReadme && !this.processedFiles.has(move.source)) {
        await this.moveFile(move.source, move.destination);
        this.processedFiles.add(move.source);
      }
    }

    console.log(chalk.green('Structure fixes completed.'));
  }
}

// Create instance and add moves
const fixer = new StructureFixer();

// Add moves for README files
fixer.addMove('docs/api/authentication/README.md', 'docs/api/authentication/README.md', true);
fixer.addMove('docs/api/security/README.md', 'docs/api/authentication/README.md', true);
fixer.addMove('docs/api/troubleshooting/README.md', 'docs/api/troubleshooting/README.md', true);
fixer.addMove('docs/api/websocket/README.md', 'docs/api/websocket/README.md', true);
fixer.addMove('README.md', 'docs/README.md', true);

// Add moves for other files
fixer.addMove('docs/api/error-handling/crawler.md', 'docs/api/services/crawler.md');
fixer.addMove('docs/api/websocket/testing.md', 'docs/api/testing/testing.md');
fixer.addMove('docs/development/guides/testing.md', 'docs/development/guides/testing.md');
fixer.addMove('docs/development/guides/PROJECT_STATUS.md', 'docs/development/guides/PROJECT_STATUS.md');
fixer.addMove('docs/PROJECT_STATUS.md', 'docs/development/PROJECT_STATUS.md');

// Add moves for monitoring documentation
fixer.addMove('docs/monitoring/README.md', 'docs/monitoring/README.md');
fixer.addMove('docs/monitoring/logging.md', 'docs/monitoring/logging.md');
fixer.addMove('docs/monitoring/incidents.md', 'docs/monitoring/incidents.md');
fixer.addMove('docs/monitoring/performance.md', 'docs/monitoring/performance.md');
fixer.addMove('docs/monitoring/alerts.md', 'docs/monitoring/alerts.md');
fixer.addMove('docs/monitoring/websockets.md', 'docs/monitoring/websockets.md');
fixer.addMove('docs/monitoring/metrics.md', 'docs/monitoring/metrics.md');

// Add moves for development guides
fixer.addMove('docs/development/guides/database-setup.md', 'docs/development/guides/database-setup.md');
fixer.addMove('docs/development/guides/logging.md', 'docs/development/guides/logging.md');
fixer.addMove('docs/development/guides/incidents.md', 'docs/development/guides/incidents.md');
fixer.addMove('docs/development/guides/contributing.md', 'docs/development/guides/contributing.md');

// Add moves for API documentation
fixer.addMove('docs/api/caching/README.md', 'docs/api/caching/README.md');
fixer.addMove('docs/api/error-handling/README.md', 'docs/api/error-handling/README.md');
fixer.addMove('docs/api/README.md', 'docs/api/README.md');

// Execute the fixes
fixer.fix().catch(console.error);