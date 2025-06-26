/**
 * CODEBASE BACKUP SYSTEM
 * ═════════════════════
 * 
 * DevCore Backup Manager - Creates compressed archives of the entire codebase
 * Excludes common build artifacts and dependency folders
 * Includes metadata and change tracking
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BACKUP_DIR = path.join(__dirname, '..', '.archive', 'backups');
const EXCLUDE_PATTERNS = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.git/**',
    '**/coverage/**',
    '**/temp/**',
    '**/tmp/**',
    '**/*.log',
    '**/.cache/**',
    '**/target/**',
    '**/__pycache__/**',
    '**/*.pyc',
    '**/bin/**',
    '**/obj/**',
    '**/.vs/**',
    '**/.vscode/settings.json',
    '**/package-lock.json',
    '**/yarn.lock'
];

/**
 * Create a backup of the codebase
 */
async function createBackup(options = {}) {
    const {
        rootPath = process.cwd(),
        backupName = null,
        includeGit = false,
        customExcludes = []
    } = options;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const projectName = path.basename(rootPath);
    const finalBackupName = backupName || `${projectName}-backup-${timestamp}`;
    
    // Ensure backup directory exists
    await fs.ensureDir(BACKUP_DIR);
    
    const backupPath = path.join(BACKUP_DIR, `${finalBackupName}.zip`);
    
    console.log(`■ DevCore Backup Manager`);
    console.log(`────────────────────────────────────────────────`);
    console.log(`◦ Source: ${rootPath}`);
    console.log(`◦ Backup: ${backupPath}`);
    console.log(`◦ Include Git: ${includeGit}`);
    console.log(``);

    try {
        // Get files to backup
        const filesToBackup = await getFilesToBackup(rootPath, includeGit, customExcludes);
        console.log(`◦ Found ${filesToBackup.length} files to backup`);

        // Create backup metadata
        const metadata = await createBackupMetadata(rootPath, filesToBackup.length);
        
        // Create the zip archive
        await createZipArchive(backupPath, rootPath, filesToBackup, metadata);
        
        const backupSize = (await fs.stat(backupPath)).size;
        const backupSizeMB = (backupSize / (1024 * 1024)).toFixed(2);
        
        console.log(``);
        console.log(`■ Backup Complete`);
        console.log(`────────────────────────────────────────────────`);
        console.log(`▣ Files Archived: ${filesToBackup.length}`);
        console.log(`▣ Backup Size: ${backupSizeMB} MB`);
        console.log(`▣ Location: ${backupPath}`);
        
        return {
            success: true,
            backupPath,
            fileCount: filesToBackup.length,
            size: backupSize,
            metadata
        };
        
    } catch (error) {
        console.error(`× Backup failed: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get list of files to backup
 */
async function getFilesToBackup(rootPath, includeGit = false, customExcludes = []) {
    const excludePatterns = [...EXCLUDE_PATTERNS, ...customExcludes];
    
    if (!includeGit && !excludePatterns.includes('**/.git/**')) {
        excludePatterns.push('**/.git/**');
    }
    
    try {
        const files = await glob('**/*', {
            cwd: rootPath,
            absolute: false,
            ignore: excludePatterns,
            dot: true,
            nodir: true
        });
        
        return files;
    } catch (error) {
        console.warn(`▲ Warning: Could not scan files: ${error.message}`);
        return [];
    }
}

/**
 * Create backup metadata
 */
async function createBackupMetadata(rootPath, fileCount) {
    const metadata = {
        timestamp: new Date().toISOString(),
        projectName: path.basename(rootPath),
        rootPath: rootPath,
        fileCount: fileCount,
        version: '2.0',
        system: {
            platform: process.platform,
            nodeVersion: process.version,
            hostname: process.env.COMPUTERNAME || process.env.HOSTNAME || 'unknown'
        }
    };

    // Try to get git info if available
    try {
        const gitDir = path.join(rootPath, '.git');
        if (await fs.pathExists(gitDir)) {
            const gitHeadPath = path.join(gitDir, 'HEAD');
            if (await fs.pathExists(gitHeadPath)) {
                const gitHead = await fs.readFile(gitHeadPath, 'utf8');
                const match = gitHead.match(/ref: refs\/heads\/(.+)/);
                if (match) {
                    metadata.git = {
                        branch: match[1].trim(),
                        head: gitHead.trim()
                    };
                }
            }
        }
    } catch (error) {
        // Git info is optional
    }

    // Try to get package.json info if available
    try {
        const packagePath = path.join(rootPath, 'package.json');
        if (await fs.pathExists(packagePath)) {
            const packageJson = await fs.readJson(packagePath);
            metadata.package = {
                name: packageJson.name,
                version: packageJson.version,
                description: packageJson.description
            };
        }
    } catch (error) {
        // Package info is optional
    }

    return metadata;
}

/**
 * Create zip archive
 */
async function createZipArchive(backupPath, rootPath, files, metadata) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(backupPath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        output.on('close', () => {
            resolve();
        });

        archive.on('error', (err) => {
            reject(err);
        });

        archive.pipe(output);

        // Add metadata file
        archive.append(JSON.stringify(metadata, null, 2), { name: 'backup-metadata.json' });

        let processedFiles = 0;
        
        // Add all files
        for (const file of files) {
            const fullPath = path.join(rootPath, file);
            try {
                if (fs.existsSync(fullPath)) {
                    archive.file(fullPath, { name: file });
                    processedFiles++;
                    
                    if (processedFiles % 100 === 0) {
                        console.log(`◦ Archived ${processedFiles}/${files.length} files...`);
                    }
                }
            } catch (error) {
                console.warn(`▲ Warning: Could not archive ${file}: ${error.message}`);
            }
        }

        console.log(`◦ Finalizing archive...`);
        archive.finalize();
    });
}

/**
 * List available backups
 */
async function listBackups() {
    try {
        if (!await fs.pathExists(BACKUP_DIR)) {
            return [];
        }

        const backupFiles = await glob('*.zip', {
            cwd: BACKUP_DIR,
            absolute: false
        });

        const backups = [];
        for (const file of backupFiles) {
            const filePath = path.join(BACKUP_DIR, file);
            const stats = await fs.stat(filePath);
            backups.push({
                name: file,
                path: filePath,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime
            });
        }

        return backups.sort((a, b) => b.created - a.created);
    } catch (error) {
        console.error(`× Error listing backups: ${error.message}`);
        return [];
    }
}

/**
 * Clean old backups (keep last N backups)
 */
async function cleanOldBackups(keepCount = 10) {
    try {
        const backups = await listBackups();
        
        if (backups.length <= keepCount) {
            console.log(`◦ No cleanup needed (${backups.length} backups, keeping ${keepCount})`);
            return { cleaned: 0 };
        }

        const toDelete = backups.slice(keepCount);
        let deletedCount = 0;

        for (const backup of toDelete) {
            try {
                await fs.unlink(backup.path);
                console.log(`▣ Deleted old backup: ${backup.name}`);
                deletedCount++;
            } catch (error) {
                console.warn(`▲ Warning: Could not delete ${backup.name}: ${error.message}`);
            }
        }

        return { cleaned: deletedCount };
    } catch (error) {
        console.error(`× Error cleaning backups: ${error.message}`);
        return { cleaned: 0, error: error.message };
    }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    const command = args[0] || 'create';

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
■ DevCore Backup Manager v2.0
────────────────────────────────────────────────

Usage: node backup-manager.js [command] [options]

Commands:
  create              Create a new backup (default)
  list                List available backups
  clean [count]       Clean old backups (keep last N, default 10)

Options:
  --name <name>       Custom backup name
  --include-git       Include .git directory
  --exclude <pattern> Additional exclude pattern
  --help, -h          Show this help message

Examples:
  node backup-manager.js create --name "release-v1.0"
  node backup-manager.js list
  node backup-manager.js clean 5
        `);
        process.exit(0);
    }

    switch (command) {
        case 'create':
            const nameIndex = args.indexOf('--name');
            const backupName = nameIndex !== -1 ? args[nameIndex + 1] : null;
            const includeGit = args.includes('--include-git');
            
            createBackup({ backupName, includeGit }).then(result => {
                process.exit(result.success ? 0 : 1);
            });
            break;

        case 'list':
            listBackups().then(backups => {
                console.log(`■ Available Backups (${backups.length})`);
                console.log(`────────────────────────────────────────────────`);
                
                if (backups.length === 0) {
                    console.log('◦ No backups found');
                } else {
                    backups.forEach(backup => {
                        const sizeMB = (backup.size / (1024 * 1024)).toFixed(2);
                        const date = backup.created.toISOString().split('T')[0];
                        console.log(`▣ ${backup.name} (${sizeMB} MB, ${date})`);
                    });
                }
            });
            break;

        case 'clean':
            const keepCount = parseInt(args[1]) || 10;
            cleanOldBackups(keepCount).then(result => {
                if (result.error) {
                    process.exit(1);
                } else {
                    console.log(`▣ Cleanup complete: ${result.cleaned} backups deleted`);
                }
            });
            break;

        default:
            console.error(`× Unknown command: ${command}`);
            console.error('Use --help for usage information');
            process.exit(1);
    }
}

export default {
    createBackup,
    listBackups,
    cleanOldBackups
};
