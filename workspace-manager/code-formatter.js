#!/usr/bin/env node

/**
 * CODE FORMATTER AND STANDARDIZATION SYSTEM
 * ═════════════════════════════════════════
 * 
 * DevCore Code Formatter - File Processing Engine
 * Skip Marker: [PROCESSED-BY-DEVCORE-CODE-FORMATTER-v2.0]
 * 
 * This system exhaustively processes ALL files in the workspace:
 * - Replaces emojis with dedicated Unicode symbols
 * - Adds standardized headers and footers
 * - Skips already processed files via marker detection
 * - Integrates with file indexer for continuous monitoring
 * - Supports all file types with proper formatting
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import chokidar from 'chokidar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SKIP_MARKER = '[PROCESSED-BY-DEVCORE-CODE-FORMATTER-v2.0]';
const PROCESSED_LOG = path.join(__dirname, 'code-formatter-log.json');

// File type mappings for proper comment syntax
const COMMENT_STYLES = {
    js: { start: '/*', end: '*/', line: '//' },
    ts: { start: '/*', end: '*/', line: '//' },
    jsx: { start: '/*', end: '*/', line: '//' },
    tsx: { start: '/*', end: '*/', line: '//' },
    css: { start: '/*', end: '*/', line: null },
    scss: { start: '/*', end: '*/', line: '//' },
    less: { start: '/*', end: '*/', line: '//' },
    html: { start: '<!--', end: '-->', line: null },
    xml: { start: '<!--', end: '-->', line: null },
    vue: { start: '<!--', end: '-->', line: null },
    py: { start: '"""', end: '"""', line: '#' },
    rb: { start: '=begin', end: '=end', line: '#' },
    php: { start: '/*', end: '*/', line: '//' },
    java: { start: '/*', end: '*/', line: '//' },
    c: { start: '/*', end: '*/', line: '//' },
    cpp: { start: '/*', end: '*/', line: '//' },
    h: { start: '/*', end: '*/', line: '//' },
    hpp: { start: '/*', end: '*/', line: '//' },
    cs: { start: '/*', end: '*/', line: '//' },
    go: { start: '/*', end: '*/', line: '//' },
    rs: { start: '/*', end: '*/', line: '//' },
    sh: { start: ': <<\'COMMENT\'', end: 'COMMENT', line: '#' },
    bash: { start: ': <<\'COMMENT\'', end: 'COMMENT', line: '#' },
    ps1: { start: '<#', end: '#>', line: '#' },
    bat: { start: 'REM', end: 'REM', line: 'REM' },
    cmd: { start: 'REM', end: 'REM', line: 'REM' },
    sql: { start: '/*', end: '*/', line: '--' },
    md: { start: null, end: null, line: null }, // Special handling
    txt: { start: null, end: null, line: null }, // Special handling
    json: { start: null, end: null, line: null }, // No comments allowed
    yaml: { start: null, end: null, line: '#' },
    yml: { start: null, end: null, line: '#' },
    toml: { start: null, end: null, line: '#' },
    ini: { start: null, end: null, line: ';' },
    cfg: { start: null, end: null, line: '#' }
};

// Enhanced emoji mapping from dedicated icons
const EMOJI_MAPPINGS = {
    '🚀': '▶',  // Launch/Start
    '✅': '▣',  // Success/Check
    '❌': '×',  // Error/Fail
    '⚡': '◊',  // Fast/Power
    '🔄': '○',  // Process/Cycle
    '📊': '■',  // Data/Stats
    '📝': '▢',  // Document/Note
    '🎯': '●',  // Target/Goal
    '💡': '◐',  // Idea/Light
    '🔥': '▲',  // Hot/Fire
    '🌟': '★',  // Star/Special
    '⭐': '☆',  // Star outline
    '✨': '✦',  // Sparkle
    '🎉': '◈',  // Celebration
    '📁': '□',  // Folder
    '📂': '■',  // Open folder
    '🔗': '⟐',  // Link
    '🔍': '⚬',  // Search
    '⚙️': '⚙',  // Settings
    '🛠️': '⚒',  // Tools
    '📺': '▯',  // Monitor
    '💻': '⌨',  // Computer
    '🖥️': '□',  // Desktop
    '📱': '▢',  // Mobile
    '⌚': '○',  // Watch
    '🔔': '◐',  // Notification
    '🔕': '◑',  // Silent
    '🎵': '♪',  // Music
    '🎶': '♫',  // Music notes
    '📈': '↗',  // Trending up
    '📉': '↘',  // Trending down
    '🔝': '↑',  // Top
    '🔚': '↓',  // End
    '▶️': '▶',  // Play
    '⏸️': '⏸',  // Pause
    '⏹️': '⏹',  // Stop
    '⏭️': '⏭',  // Next
    '⏮️': '⏮',  // Previous
    '⏯️': '⏯',  // Play/Pause
    '🔀': '⚮',  // Shuffle
    '🔁': '⟲',  // Repeat
    '🔂': '⟳',  // Repeat one
    '⏫': '⏫',  // Fast forward
    '⏬': '⏬',  // Fast backward
    '🆕': 'N',  // New
    '🆓': 'F',  // Free
    '🆒': 'C',  // Cool
    '🆗': 'OK', // OK
    '📮': '⊞',  // Postbox
    '📪': '⊟',  // Closed mailbox
    '📫': '⊠',  // Open mailbox
    '📬': '⊡',  // Mailbox with mail
    '🚪': '▢',  // Door
    '🔐': '⚿',  // Locked
    '🔓': '○',  // Unlocked
    '🔒': '●',  // Lock
    '🔑': '⚷',  // Key
    '🛡️': '◈',  // Shield
    '⚠️': '▲',  // Warning
    '🚨': '◆',  // Alert
    '❗': '!',  // Exclamation
    '❓': '?',  // Question
    '💬': '◐',  // Speech bubble
    '💭': '◑',  // Thought bubble
    '🗨️': '○',  // Left speech bubble
    '🗯️': '●',  // Right speech bubble
    '💌': '♡',  // Love letter
    '💝': '◈',  // Gift heart
    '🎁': '⬟',  // Gift
    '🎊': '✦',  // Confetti
    '🎈': '○',  // Balloon
    '🎀': '◈',  // Ribbon
    '🏆': '♛',  // Trophy
    '🥇': '①',  // Gold medal
    '🥈': '②',  // Silver medal
    '🥉': '③',  // Bronze medal
    '🎖️': '★',  // Military medal
    '🏅': '○',  // Sports medal
    '🌐': '⚬',  // Globe
    '🌍': '○',  // Earth Africa
    '🌎': '◐',  // Earth Americas
    '🌏': '◑',  // Earth Asia
    '🌟': '✦',  // Glowing star
    '⚡': '⟢',  // Lightning
    '🔋': '▯',  // Battery
    '🔌': '⚮',  // Plug
    '💾': '▢',  // Floppy disk
    '💿': '○',  // CD
    '📀': '◐',  // DVD
    '💽': '◑',  // Minidisc
    '💻': '▢',  // Laptop
    '🖨️': '▢',  // Printer
    '⌨️': '▯',  // Keyboard
    '🖱️': '◐',  // Mouse
    '🖲️': '○',  // Trackball
    '💡': '◐',  // Light bulb
    '🔦': '◑',  // Flashlight
    '🕯️': '|',  // Candle
    '💊': '○',  // Pill
    '🧬': '⚮',  // DNA
    '🔬': '◐',  // Microscope
    '🔭': '○',  // Telescope
    '📡': '◈',  // Satellite
    '🚀': '▲',  // Rocket
    '🛸': '○',  // UFO
    '🌙': '☽',  // Moon
    '☀️': '☀',  // Sun
    '⭐': '★',  // Star
    '🌟': '✦',  // Glowing star
    '💫': '✧',  // Dizzy star
    '✨': '✦',  // Sparkles
    '☄️': '●',  // Comet
    '🌈': '⌒',  // Rainbow
    '☁️': '☁',  // Cloud
    '⛅': '☁',  // Partly cloudy
    '⛈️': '⚡',  // Thunderstorm
    '🌤️': '☀',  // Partly sunny
    '🌦️': '☂',  // Rain
    '🌧️': '☂',  // Heavy rain
    '⛆': '❅',  // Snow
    '❄️': '❅',  // Snowflake
    '⛄': '☃',  // Snowman
    '🌡️': '|',  // Thermometer
    '💨': '~',  // Wind
    '🌊': '~',  // Wave
    '🏔️': '⛰',  // Mountain
    '🗻': '▲',  // Mount Fuji
    '🌋': '▲',  // Volcano
    '🏕️': '▲',  // Camping
    '🏖️': '~',  // Beach
    '🏝️': '○',  // Desert island
    '🏞️': '⛰',  // National park
    '🏟️': '○',  // Stadium
    '🏛️': '▢',  // Classical building
    '🏗️': '▲',  // Construction
    '🏘️': '▢',  // Houses
    '🏚️': '▢',  // Derelict house
    '🏠': '▢',  // House
    '🏡': '▢',  // House with garden
    '🏢': '▢',  // Office building
    '🏣': '▢',  // Japanese post office
    '🏤': '▢',  // European post office
    '🏥': '▢',  // Hospital
    '🏦': '▢',  // Bank
    '🏧': '▢',  // ATM
    '🏨': '▢',  // Hotel
    '🏩': '▢',  // Love hotel
    '🏪': '▢',  // Convenience store
    '🏫': '▢',  // School
    '🏬': '▢',  // Department store
    '🏭': '▢',  // Factory
    '🏮': '○',  // Lantern
    '🏯': '▲',  // Japanese castle
    '🏰': '▲'   // European castle
};

/**
 * Load or initialize processed files tracking
 */
function loadProcessedFiles() {
    try {
        if (fs.existsSync(PROCESSED_LOG)) {
            return JSON.parse(fs.readFileSync(PROCESSED_LOG, 'utf8'));
        }
    } catch (error) {
        console.log(`◐ Creating new processed files tracking: ${error.message}`);
    }
    return { files: {}, lastRun: null, version: '2.0' };
}

/**
 * Save processed files tracking
 */
function saveProcessedFiles(data) {
    try {
        fs.writeFileSync(PROCESSED_LOG, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`× Failed to save processed files log: ${error.message}`);
    }
}

/**
 * Generate appropriate header for file type
 */
function generateHeader(filePath, fileExt) {
    const style = COMMENT_STYLES[fileExt] || COMMENT_STYLES.txt;
    const fileName = path.basename(filePath);
    const timestamp = new Date().toISOString();
    
    if (!style) return null;
    
    if (fileExt === 'md') {
        return `<!-- ${SKIP_MARKER} -->
<!-- DevCore Code Formatter - File Processing Engine -->
<!-- File: ${fileName} -->
<!-- Processed: ${timestamp} -->
<!-- ═══════════════════════════════════════════════════════════ -->

`;
    }
    
    if (fileExt === 'json') {
        // JSON doesn't support comments, use a special property
        return null; // Will be handled specially
    }
    
    if (style.start && style.end) {
        return `${style.start}
 * ${SKIP_MARKER}
 * DevCore Code Formatter - File Processing Engine
 * File: ${fileName}
 * Processed: ${timestamp}
 * ═══════════════════════════════════════════════════════════
 ${style.end}

`;
    }
    
    if (style.line) {
        return `${style.line} ${SKIP_MARKER}
${style.line} DevCore Code Formatter - File Processing Engine
${style.line} File: ${fileName}
${style.line} Processed: ${timestamp}
${style.line} ═══════════════════════════════════════════════════════════

`;
    }
    
    return null;
}

/**
 * Generate appropriate footer for file type
 */
function generateFooter(filePath, fileExt) {
    const style = COMMENT_STYLES[fileExt] || COMMENT_STYLES.txt;
    const timestamp = new Date().toISOString();
    
    if (!style) return null;
    
    if (fileExt === 'md') {
        return `

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- DevCore Code Formatter - Processing Complete -->
<!-- Processed: ${timestamp} -->`;
    }
    
    if (fileExt === 'json') {
        return null; // JSON handled specially
    }
    
    if (style.start && style.end) {
        return `

${style.start}
 * ═══════════════════════════════════════════════════════════
 * DevCore Code Formatter - Processing Complete
 * Processed: ${timestamp}
 ${style.end}`;
    }
    
    if (style.line) {
        return `

${style.line} ═══════════════════════════════════════════════════════════
${style.line} DevCore Code Formatter - Processing Complete
${style.line} Processed: ${timestamp}`;
    }
    
    return null;
}

/**
 * Check if file has already been processed
 */
function isFileProcessed(content) {
    return content.includes(SKIP_MARKER);
}

/**
 * Replace emojis in content
 */
function replaceEmojis(content) {
    let replacedContent = content;
    let replacementCount = 0;
    
    for (const [emoji, replacement] of Object.entries(EMOJI_MAPPINGS)) {
        const regex = new RegExp(emoji, 'g');
        const matches = replacedContent.match(regex);
        if (matches) {
            replacementCount += matches.length;
            replacedContent = replacedContent.replace(regex, replacement);
        }
    }
    
    return { content: replacedContent, count: replacementCount };
}

/**
 * Process a single file
 */
async function processFile(filePath, processedFiles) {
    try {
        const fileExt = path.extname(filePath).slice(1).toLowerCase();
        const stats = fs.statSync(filePath);
        const fileKey = filePath.replace(/\\/g, '/');
        
        // Skip if file hasn't changed since last processing
        if (processedFiles.files[fileKey] && 
            processedFiles.files[fileKey].lastModified >= stats.mtime.getTime()) {
            return { skipped: true, reason: 'unchanged' };
        }
        
        const originalContent = fs.readFileSync(filePath, 'utf8');
        
        // Skip if already processed
        if (isFileProcessed(originalContent)) {
            processedFiles.files[fileKey] = {
                lastModified: stats.mtime.getTime(),
                processed: true,
                lastProcessed: Date.now()
            };
            return { skipped: true, reason: 'already-processed' };
        }
        
        // Replace emojis
        const { content: emojiReplacedContent, count: emojiCount } = replaceEmojis(originalContent);
        
        // Add headers and footers (except for certain file types)
        let finalContent = emojiReplacedContent;
        
        if (fileExt === 'json') {
            // Special handling for JSON - add processing info as a comment-like property
            try {
                const jsonData = JSON.parse(finalContent);
                if (typeof jsonData === 'object' && jsonData !== null && !Array.isArray(jsonData)) {
                    jsonData['_devcore_processed'] = {
                        marker: SKIP_MARKER,
                        timestamp: new Date().toISOString(),
                        version: '2.0'
                    };
                    finalContent = JSON.stringify(jsonData, null, 2);
                }
            } catch (e) {
                // If JSON is invalid, skip processing
                return { skipped: true, reason: 'invalid-json' };
            }
        } else {
            const header = generateHeader(filePath, fileExt);
            const footer = generateFooter(filePath, fileExt);
            
            if (header) {
                finalContent = header + finalContent;
            }
            if (footer) {
                finalContent = finalContent + footer;
            }
        }
        
        // Write the processed file
        fs.writeFileSync(filePath, finalContent);
        
        // Update tracking
        processedFiles.files[fileKey] = {
            lastModified: stats.mtime.getTime(),
            processed: true,
            lastProcessed: Date.now(),
            emojiReplacements: emojiCount
        };
        
        return { 
            processed: true, 
            emojiCount,
            size: stats.size,
            path: filePath
        };
        
    } catch (error) {
        console.error(`× Error processing ${filePath}: ${error.message}`);
        return { error: error.message, path: filePath };
    }
}

/**
 * Get all files to process
 */
async function getAllFiles(rootDir) {
    const patterns = [
        '**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx',
        '**/*.css', '**/*.scss', '**/*.less',
        '**/*.html', '**/*.htm', '**/*.xml', '**/*.vue',
        '**/*.py', '**/*.rb', '**/*.php',
        '**/*.java', '**/*.c', '**/*.cpp', '**/*.h', '**/*.hpp',
        '**/*.cs', '**/*.go', '**/*.rs',
        '**/*.sh', '**/*.bash', '**/*.ps1', '**/*.bat', '**/*.cmd',
        '**/*.sql', '**/*.md', '**/*.txt',
        '**/*.json', '**/*.yaml', '**/*.yml', '**/*.toml',
        '**/*.ini', '**/*.cfg', '**/*.conf'
    ];
    
    const excludePatterns = [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**',
        '**/coverage/**',
        '**/temp/**',
        '**/tmp/**',
        '**/*.log',
        '**/processed_files.json',
        '**/package-lock.json',
        '**/yarn.lock'
    ];
    
    const allFiles = [];
    
    for (const pattern of patterns) {
        try {
            const files = await glob(pattern, {
                cwd: rootDir,
                absolute: true,
                ignore: excludePatterns
            });
            allFiles.push(...files);
        } catch (error) {
            console.warn(`▲ Warning: Could not process pattern ${pattern}: ${error.message}`);
        }
    }
    
    // Remove duplicates
    return [...new Set(allFiles)];
}

/**
 * Main processing function
 */
async function processAllFiles(watchMode = false) {
    const rootDir = process.cwd();
    console.log(`■ DevCore Code Formatter v2.0`);
    console.log(`────────────────────────────────────────────────`);
    console.log(`◦ Root Directory: ${rootDir}`);
    console.log(`◦ Watch Mode: ${watchMode ? 'ENABLED' : 'DISABLED'}`);
    console.log(`◦ Skip Marker: ${SKIP_MARKER}`);
    console.log(``);
    
    let processedFiles = loadProcessedFiles();
    const startTime = Date.now();
    
    try {
        const allFiles = await getAllFiles(rootDir);
        console.log(`◦ Found ${allFiles.length} files to analyze`);
        
        let processedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        let totalEmojiReplacements = 0;
        
        for (const filePath of allFiles) {
            const result = await processFile(filePath, processedFiles);
            
            if (result.skipped) {
                skippedCount++;
                if (result.reason !== 'unchanged') {
                    console.log(`○ Skipped: ${path.relative(rootDir, result.path || filePath)} (${result.reason})`);
                }
            } else if (result.error) {
                errorCount++;
                console.error(`× Error: ${path.relative(rootDir, result.path)} - ${result.error}`);
            } else if (result.processed) {
                processedCount++;
                totalEmojiReplacements += result.emojiCount || 0;
                const relativePath = path.relative(rootDir, result.path);
                const emojiInfo = result.emojiCount > 0 ? ` (${result.emojiCount} emoji${result.emojiCount !== 1 ? 's' : ''})` : '';
                console.log(`▣ Processed: ${relativePath}${emojiInfo}`);
            }
        }
        
        // Update tracking
        processedFiles.lastRun = Date.now();
        saveProcessedFiles(processedFiles);
        
        const duration = Date.now() - startTime;
        console.log(``);
        console.log(`■ Processing Complete`);
        console.log(`────────────────────────────────────────────────`);
        console.log(`▣ Files Processed: ${processedCount}`);
        console.log(`○ Files Skipped: ${skippedCount}`);
        console.log(`× Files with Errors: ${errorCount}`);
        console.log(`◦ Total Emoji Replacements: ${totalEmojiReplacements}`);
        console.log(`◦ Processing Time: ${duration}ms`);
        
        return {
            processed: processedCount,
            skipped: skippedCount,
            errors: errorCount,
            emojiReplacements: totalEmojiReplacements,
            duration
        };
        
    } catch (error) {
        console.error(`× Fatal error during processing: ${error.message}`);
        return { error: error.message };
    }
}

/**
 * File watcher integration
 */
function startWatcher() {
    console.log(`◐ Starting file watcher integration...`);
    
    const watcher = chokidar.watch('.', {
        ignored: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/.git/**',
            '**/coverage/**',
            '**/temp/**',
            '**/tmp/**',
            '**/*.log',
            '**/processed_files.json'
        ],
        persistent: true,
        ignoreInitial: true
    });
    
    let processQueue = new Set();
    let processingTimer = null;
    
    const processQueuedFiles = async () => {
        if (processQueue.size === 0) return;
        
        const files = Array.from(processQueue);
        processQueue.clear();
        
        console.log(`◦ Processing ${files.length} changed file${files.length !== 1 ? 's' : ''}...`);
        
        const processedFiles = loadProcessedFiles();
        let processedCount = 0;
        
        for (const filePath of files) {
            if (fs.existsSync(filePath)) {
                const result = await processFile(filePath, processedFiles);
                if (result.processed) {
                    processedCount++;
                    const relativePath = path.relative(process.cwd(), result.path);
                    const emojiInfo = result.emojiCount > 0 ? ` (${result.emojiCount} emoji${result.emojiCount !== 1 ? 's' : ''})` : '';
                    console.log(`▣ Auto-processed: ${relativePath}${emojiInfo}`);
                }
            }
        }
        
        if (processedCount > 0) {
            saveProcessedFiles(processedFiles);
        }
    };
    
    const queueFileForProcessing = (filePath) => {
        // Filter file types we care about
        const ext = path.extname(filePath).slice(1).toLowerCase();
        if (Object.keys(COMMENT_STYLES).includes(ext) || ['txt', 'md'].includes(ext)) {
            processQueue.add(filePath);
            
            // Debounce processing
            if (processingTimer) {
                clearTimeout(processingTimer);
            }
            processingTimer = setTimeout(processQueuedFiles, 2000);
        }
    };
    
    watcher
        .on('add', queueFileForProcessing)
        .on('change', queueFileForProcessing)
        .on('ready', () => {
            console.log(`▣ File watcher ready - monitoring for changes`);
        })
        .on('error', error => {
            console.error(`× Watcher error: ${error.message}`);
        });
    
    return watcher;
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    const watchMode = args.includes('--watch') || args.includes('-w');
    const helpMode = args.includes('--help') || args.includes('-h');
    
    if (helpMode) {
        console.log(`
■ DevCore Code Formatter v2.0
────────────────────────────────────────────────

Usage: node code-formatter.js [options]

Options:
  --watch, -w     Enable file watcher mode
  --help, -h      Show this help message

Features:
  ▣ Exhaustive emoji replacement with Unicode symbols
  ▣ Standardized headers and footers for all file types
  ▣ Skip marker detection to avoid reprocessing
  ▣ File watcher integration for continuous monitoring
  ▣ Support for 40+ file types
  ▣ JSON-based processing tracking
  ▣ Detailed progress reporting

Skip Marker: ${SKIP_MARKER}
        `);
        process.exit(0);
    }
    
    processAllFiles(watchMode).then(result => {
        if (result.error) {
            process.exit(1);
        }
        
        if (watchMode) {
            const watcher = startWatcher();
            
            // Graceful shutdown
            process.on('SIGINT', () => {
                console.log(`\n◐ Shutting down file watcher...`);
                watcher.close().then(() => {
                    console.log(`▣ File watcher stopped`);
                    process.exit(0);
                });
            });
            
            console.log(`◐ File watcher is running. Press Ctrl+C to stop.`);
        }
    }).catch(error => {
        console.error(`× Fatal error: ${error.message}`);
        process.exit(1);
    });
}

export default {
    processAllFiles,
    startWatcher,
    EMOJI_MAPPINGS,
    SKIP_MARKER
};
