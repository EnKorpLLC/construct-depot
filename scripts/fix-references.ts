import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

interface ReferenceUpdate {
  file: string;
  line: number;
  oldRef: string;
  newRef: string;
}

class ReferenceFixer {
  private readonly rootDir: string;
  private updates: ReferenceUpdate[] = [];

  constructor(rootDir: string) {
    this.rootDir = rootDir;
  }

  private addUpdate(file: string, line: number, oldRef: string, newRef: string) {
    this.updates.push({
      file: path.join(this.rootDir, file),
      line,
      oldRef,
      newRef
    });
  }

  private initializeReferenceMap() {
    // Map old references to new ones based on the project structure
    this.addUpdate('docs/api/authentication/DEVELOPER_HUB.md', 263, 'TROUBLESHOOTING.md#authentication', '../troubleshooting/README.md#authentication');
    this.addUpdate('docs/api/authentication/DEVELOPER_HUB.md', 273, 'docs/services/DATABASE_SETUP.md#errors', '../../development/guides/database-setup.md#errors');
    
    // Fix monitoring references
    const monitoringRefs = [
      { file: 'docs/api/authentication/errors.md', line: 14, old: '../../development/guides/monitoring.md#logging', new: '../../monitoring/README.md#logging' },
      { file: 'docs/api/authentication/errors.md', line: 15, old: '../../development/guides/monitoring.md#incidents', new: '../../monitoring/README.md#incidents' },
      { file: 'docs/api/authentication/errors.md', line: 56, old: '../../development/guides/monitoring.md', new: '../../monitoring/README.md' },
      { file: 'docs/api/authentication/errors.md', line: 57, old: '../../development/guides/monitoring.md#performance', new: '../../monitoring/README.md#performance' },
      { file: 'docs/api/authentication/errors.md', line: 58, old: '../../development/guides/monitoring.md#alerts', new: '../../monitoring/README.md#alerts' }
    ];

    monitoringRefs.forEach(ref => {
      this.addUpdate(ref.file, ref.line, ref.old, ref.new);
    });

    // Fix error handling references
    this.addUpdate('docs/api/authentication/errors.md', 126, '../error-handling/README.md', '../error-handling/README.md');
    this.addUpdate('docs/api/authentication/errors.md', 127, '../../development/guides/logging.md', '../../monitoring/README.md#logging');
    this.addUpdate('docs/api/authentication/errors.md', 128, '../../development/guides/incidents.md', '../../monitoring/README.md#incidents');

    // Fix caching references
    this.addUpdate('docs/api/caching/deployment.md', 261, '../monitoring/README.md', '../../monitoring/README.md');

    // Fix development references
    this.addUpdate('docs/api/error-handling/development.md', 267, './testing.md', '../../development/guides/testing.md');
    this.addUpdate('docs/api/error-handling/development.md', 268, './components.md', '../../development/guides/components.md');

    // Fix websocket references
    const websocketRefs = [
      { file: 'docs/api/error-handling/websocket-optimization.md', line: 14, old: '../../development/guides/monitoring.md#websockets', new: '../../monitoring/README.md#websockets' },
      { file: 'docs/api/error-handling/websocket-optimization.md', line: 15, old: '../../development/guides/monitoring.md#metrics', new: '../../monitoring/README.md#metrics' },
      { file: 'docs/api/error-handling/websocket-optimization.md', line: 57, old: '../../development/guides/monitoring.md', new: '../../monitoring/README.md' },
      { file: 'docs/api/error-handling/websocket-optimization.md', line: 58, old: '../error-handling/README.md', new: './README.md' }
    ];

    websocketRefs.forEach(ref => {
      this.addUpdate(ref.file, ref.line, ref.old, ref.new);
    });

    // Fix troubleshooting references
    const troubleshootingRefs = [
      { file: 'docs/api/troubleshooting/README.md', line: 235, old: '../api/error-handling/README.md', new: '../error-handling/README.md' },
      { file: 'docs/api/troubleshooting/README.md', line: 236, old: '../monitoring/README.md', new: '../../monitoring/README.md' },
      { file: 'docs/api/troubleshooting/README.md', line: 237, old: 'database-setup.md', new: '../../development/guides/database-setup.md' },
      { file: 'docs/api/troubleshooting/README.md', line: 238, old: 'redis-setup.md', new: '../../development/guides/redis-setup.md' }
    ];

    troubleshootingRefs.forEach(ref => {
      this.addUpdate(ref.file, ref.line, ref.old, ref.new);
    });

    // Fix database references
    const databaseRefs = [
      { file: 'docs/development/guides/database.md', line: 183, old: 'README.md', new: './README.md' },
      { file: 'docs/development/guides/database.md', line: 184, old: '../caching/README.md', new: '../../api/caching/README.md' },
      { file: 'docs/development/guides/database.md', line: 185, old: '../../development/guides/monitoring.md', new: '../../monitoring/README.md' },
      { file: 'docs/development/guides/database.md', line: 186, old: '../error-handling/README.md', new: '../../api/error-handling/README.md' }
    ];

    databaseRefs.forEach(ref => {
      this.addUpdate(ref.file, ref.line, ref.old, ref.new);
    });

    // Fix quick start references
    const quickStartRefs = [
      { file: 'docs/development/guides/QUICK_START.md', line: 94, old: '../docs/services/REDIS_SETUP.md', new: './redis-setup.md' },
      { file: 'docs/development/guides/QUICK_START.md', line: 99, old: '../docs/development/guides/database.md', new: './database.md' },
      { file: 'docs/development/guides/QUICK_START.md', line: 104, old: '../docs/development/guides/configuration.md', new: './configuration.md' },
      { file: 'docs/development/guides/QUICK_START.md', line: 108, old: '../docs/DEVELOPER_HUB.md', new: '../README.md' },
      { file: 'docs/development/guides/QUICK_START.md', line: 109, old: '../docs/core/PROJECT_STATUS.md', new: './PROJECT_STATUS.md' },
      { file: 'docs/development/guides/QUICK_START.md', line: 110, old: '../CONTRIBUTING.md', new: './contributing.md' },
      { file: 'docs/development/guides/QUICK_START.md', line: 114, old: '../docs/development/TROUBLESHOOTING.md', new: '../../api/troubleshooting/README.md' },
      { file: 'docs/development/guides/QUICK_START.md', line: 115, old: '../docs/README.md', new: '../../README.md' }
    ];

    quickStartRefs.forEach(ref => {
      this.addUpdate(ref.file, ref.line, ref.old, ref.new);
    });

    // Fix redis setup references
    this.addUpdate('docs/development/guides/redis-setup.md', 163, '../api/caching/README.md', '../../api/caching/README.md');
    this.addUpdate('docs/development/guides/redis-setup.md', 164, '../monitoring/README.md', '../../monitoring/README.md');

    // Fix getting started references
    this.addUpdate('docs/getting-started.md', 100, 'internal-wiki-link', '../api/README.md');
    this.addUpdate('docs/getting-started.md', 101, '/technical/api/overview.md', '../api/README.md');
  }

  public async fix() {
    console.log(chalk.blue('Starting reference fixes...'));
    
    this.initializeReferenceMap();
    
    for (const update of this.updates) {
      try {
        if (!fs.existsSync(update.file)) {
          console.log(chalk.yellow(`File not found: ${update.file}`));
          continue;
        }

        const content = fs.readFileSync(update.file, 'utf8');
        const lines = content.split('\n');

        if (update.line > lines.length) {
          console.log(chalk.yellow(`Line ${update.line} not found in ${update.file}`));
          continue;
        }

        const oldLine = lines[update.line - 1];
        const newLine = oldLine.replace(update.oldRef, update.newRef);

        if (oldLine === newLine) {
          console.log(chalk.yellow(`Reference not found in ${update.file}:${update.line}`));
          continue;
        }

        lines[update.line - 1] = newLine;
        fs.writeFileSync(update.file, lines.join('\n'));
        console.log(chalk.green(`Updated reference in ${update.file}:${update.line}`));
      } catch (error) {
        console.error(chalk.red(`Error updating reference in ${update.file}`), error);
      }
    }

    console.log(chalk.blue('Reference fixes completed.'));
  }
}

// Create instance with project root
const fixer = new ReferenceFixer(process.cwd());

// Execute the fixes
fixer.fix().catch(console.error); 