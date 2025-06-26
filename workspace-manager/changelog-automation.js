#!/usr/bin/env node

/**
 * CHANGELOG AUTOMATION SYSTEM
 * ═══════════════════════════════════════════════════════════
 * 
 * DevCore Workspace Manager - Changelog Generator
 * Skip Marker: [CHANGELOG-AUTOMATION-v1.0]
 * 
 * This system automatically generates and updates changelogs:
 * - Extracts git commit messages since last release
 * - Categorizes changes by type (feat, fix, docs, etc.)
 * - Formats with proper timestamps and version numbers
 * - Integrates with git hooks for automatic updates
 */

import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CHANGELOG_DIR = path.join(__dirname, '..', '.archive', 'changelog');
const CHANGELOG_FILE = path.join(CHANGELOG_DIR, 'CHANGELOG.md');
const CHANGELOG_DATA = path.join(CHANGELOG_DIR, 'changelog.json');

// Change type mappings
const CHANGE_TYPES = {
    feat: { label: '✨ Features', priority: 1 },
    fix: { label: '🐛 Bug Fixes', priority: 2 },
    perf: { label: '⚡ Performance', priority: 3 },
    refactor: { label: '♻️ Refactoring', priority: 4 },
    docs: { label: '📚 Documentation', priority: 5 },
    style: { label: '💎 Styling', priority: 6 },
    test: { label: '🧪 Testing', priority: 7 },
    build: { label: '📦 Build System', priority: 8 },
    ci: { label: '🔄 CI/CD', priority: 9 },
    chore: { label: '🔧 Maintenance', priority: 10 },
    other: { label: '📝 Other Changes', priority: 11 }
};

/**
 * Execute git command and return output
 */
function gitCommand(command) {
    try {
        return execSync(`git ${command}`, { 
            encoding: 'utf-8',
            cwd: path.join(__dirname, '..')
        }).trim();
    } catch (error) {
        console.error(`× Git command failed: git ${command}`);
        console.error(`× Error: ${error.message}`);
        return null;
    }
}

/**
 * Get git commits since last tag or all commits
 */
function getCommitsSinceLastRelease() {
    console.log('◦ Fetching git commits...');
    
    // Try to get last tag
    const lastTag = gitCommand('describe --tags --abbrev=0 2>/dev/null || echo ""');
    
    let gitLogCommand;
    if (lastTag) {
        console.log(`◦ Last release tag: ${lastTag}`);
        gitLogCommand = `log ${lastTag}..HEAD --pretty=format:"%H|%s|%an|%ad|%b" --date=iso --no-merges`;
    } else {
        console.log('◦ No previous tags found, getting all commits');
        gitLogCommand = 'log --pretty=format:"%H|%s|%an|%ad|%b" --date=iso --no-merges --max-count=50';
    }
    
    const commits = gitCommand(gitLogCommand);
    if (!commits) return [];
    
    return commits.split('\n').filter(line => line.trim()).map(line => {
        const [hash, subject, author, date, body] = line.split('|');
        return {
            hash: hash.substring(0, 7),
            subject: subject.trim(),
            author: author.trim(),
            date: new Date(date),
            body: body ? body.trim() : ''
        };
    });
}

/**
 * Categorize commit by type
 */
function categorizeCommit(commit) {
    const subject = commit.subject.toLowerCase();
    
    // Check for conventional commit format
    const conventionalMatch = subject.match(/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore)(\(.+\))?\s*:\s*(.+)/);
    if (conventionalMatch) {
        return {
            type: conventionalMatch[1],
            scope: conventionalMatch[2] ? conventionalMatch[2].slice(1, -1) : null,
            description: conventionalMatch[3],
            breaking: subject.includes('breaking') || commit.body.includes('BREAKING CHANGE')
        };
    }
    
    // Fallback to keyword detection
    if (subject.includes('feat') || subject.includes('add') || subject.includes('new')) {
        return { type: 'feat', description: commit.subject, breaking: false };
    }
    if (subject.includes('fix') || subject.includes('bug') || subject.includes('error')) {
        return { type: 'fix', description: commit.subject, breaking: false };
    }
    if (subject.includes('doc') || subject.includes('readme')) {
        return { type: 'docs', description: commit.subject, breaking: false };
    }
    if (subject.includes('refactor') || subject.includes('clean') || subject.includes('reorganize')) {
        return { type: 'refactor', description: commit.subject, breaking: false };
    }
    if (subject.includes('test')) {
        return { type: 'test', description: commit.subject, breaking: false };
    }
    if (subject.includes('build') || subject.includes('deps') || subject.includes('package')) {
        return { type: 'build', description: commit.subject, breaking: false };
    }
    if (subject.includes('ci') || subject.includes('workflow')) {
        return { type: 'ci', description: commit.subject, breaking: false };
    }
    if (subject.includes('chore') || subject.includes('update') || subject.includes('maintenance')) {
        return { type: 'chore', description: commit.subject, breaking: false };
    }
    
    return { type: 'other', description: commit.subject, breaking: false };
}

/**
 * Generate version number
 */
function generateVersion() {
    const currentTag = gitCommand('describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0"');
    const version = currentTag.replace('v', '');
    const [major, minor, patch] = version.split('.').map(n => parseInt(n) || 0);
    
    // For now, increment patch version
    // In a real scenario, you'd determine this based on change significance
    return `v${major}.${minor}.${patch + 1}`;
}

/**
 * Load existing changelog data
 */
function loadChangelogData() {
    try {
        if (fs.existsSync(CHANGELOG_DATA)) {
            return JSON.parse(fs.readFileSync(CHANGELOG_DATA, 'utf8'));
        }
    } catch (error) {
        console.log(`◦ Creating new changelog data: ${error.message}`);
    }
    return { 
        releases: [],
        lastUpdate: null,
        version: '1.0'
    };
}

/**
 * Save changelog data
 */
function saveChangelogData(data) {
    try {
        fs.ensureDirSync(CHANGELOG_DIR);
        fs.writeFileSync(CHANGELOG_DATA, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`× Failed to save changelog data: ${error.message}`);
    }
}

/**
 * Generate markdown changelog
 */
function generateChangelogMarkdown(data) {
    let markdown = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

`;

    for (const release of data.releases) {
        markdown += `## [${release.version}] - ${release.date}\n\n`;
        
        if (release.breaking && release.breaking.length > 0) {
            markdown += `### 💥 BREAKING CHANGES\n\n`;
            for (const change of release.breaking) {
                markdown += `- ${change.description}\n`;
            }
            markdown += '\n';
        }
        
        // Sort change types by priority
        const sortedTypes = Object.keys(release.changes).sort((a, b) => {
            return (CHANGE_TYPES[a]?.priority || 99) - (CHANGE_TYPES[b]?.priority || 99);
        });
        
        for (const type of sortedTypes) {
            const changes = release.changes[type];
            if (changes.length === 0) continue;
            
            const typeInfo = CHANGE_TYPES[type] || CHANGE_TYPES.other;
            markdown += `### ${typeInfo.label}\n\n`;
            
            for (const change of changes) {
                const scope = change.scope ? `**${change.scope}:** ` : '';
                const hash = change.hash ? ` ([${change.hash}](commit/${change.hash}))` : '';
                markdown += `- ${scope}${change.description}${hash}\n`;
            }
            markdown += '\n';
        }
        
        if (release.contributors && release.contributors.length > 0) {
            markdown += `### 👥 Contributors\n\n`;
            for (const contributor of release.contributors) {
                markdown += `- ${contributor}\n`;
            }
            markdown += '\n';
        }
        
        markdown += '---\n\n';
    }
    
    return markdown;
}

/**
 * Update changelog with new commits
 */
async function updateChangelog() {
    console.log(`■ DevCore Changelog Automation v1.0`);
    console.log(`────────────────────────────────────────────────`);
    
    const commits = getCommitsSinceLastRelease();
    
    if (commits.length === 0) {
        console.log('○ No new commits since last release');
        return { updated: false, reason: 'no-commits' };
    }
    
    console.log(`◦ Found ${commits.length} new commits`);
    
    const changelogData = loadChangelogData();
    const version = generateVersion();
    const releaseDate = new Date().toISOString().split('T')[0];
    
    // Categorize commits
    const categorizedChanges = {};
    const contributors = new Set();
    const breakingChanges = [];
    
    for (const changeType of Object.keys(CHANGE_TYPES)) {
        categorizedChanges[changeType] = [];
    }
    
    for (const commit of commits) {
        const category = categorizeCommit(commit);
        contributors.add(commit.author);
        
        const change = {
            description: category.description,
            hash: commit.hash,
            scope: category.scope,
            author: commit.author,
            date: commit.date
        };
        
        if (category.breaking) {
            breakingChanges.push(change);
        }
        
        if (categorizedChanges[category.type]) {
            categorizedChanges[category.type].push(change);
        } else {
            categorizedChanges.other.push(change);
        }
    }
    
    // Create new release entry
    const newRelease = {
        version,
        date: releaseDate,
        changes: categorizedChanges,
        contributors: Array.from(contributors).sort(),
        breaking: breakingChanges,
        commitCount: commits.length
    };
    
    // Add to changelog data
    changelogData.releases.unshift(newRelease);
    changelogData.lastUpdate = new Date().toISOString();
    
    // Generate and save markdown
    const markdown = generateChangelogMarkdown(changelogData);
    fs.ensureDirSync(CHANGELOG_DIR);
    fs.writeFileSync(CHANGELOG_FILE, markdown);
    saveChangelogData(changelogData);
    
    console.log(`▣ Generated changelog for version ${version}`);
    console.log(`◦ Changes categorized: ${Object.keys(categorizedChanges).filter(k => categorizedChanges[k].length > 0).length} types`);
    console.log(`◦ Contributors: ${contributors.size}`);
    console.log(`◦ Breaking changes: ${breakingChanges.length}`);
    console.log(`◦ Changelog saved to: ${CHANGELOG_FILE}`);
    
    return {
        updated: true,
        version,
        commitCount: commits.length,
        contributors: contributors.size,
        breakingChanges: breakingChanges.length
    };
}

/**
 * Install git hooks
 */
function installGitHooks() {
    console.log('◦ Installing git hooks...');
    
    const gitHooksDir = path.join(__dirname, '..', '.git', 'hooks');
    if (!fs.existsSync(gitHooksDir)) {
        console.error('× Git hooks directory not found. Is this a git repository?');
        return false;
    }
    
    const postCommitHook = `#!/bin/sh
# Auto-generated by DevCore Changelog Automation
# This hook automatically updates the changelog after commits

echo "▣ Updating changelog..."
cd "${path.dirname(__dirname)}"
node workspace-manager/changelog-automation.js --auto
`;
    
    const hookPath = path.join(gitHooksDir, 'post-commit');
    fs.writeFileSync(hookPath, postCommitHook);
    
    // Make executable on Unix systems
    try {
        execSync(`chmod +x "${hookPath}"`);
    } catch (error) {
        // Ignore on Windows
    }
    
    console.log('▣ Git post-commit hook installed');
    return true;
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    const autoMode = args.includes('--auto');
    const installHooks = args.includes('--install-hooks');
    const helpMode = args.includes('--help') || args.includes('-h');
    
    if (helpMode) {
        console.log(`
■ DevCore Changelog Automation v1.0
────────────────────────────────────────────────

Usage: node changelog-automation.js [options]

Options:
  --auto           Run in automatic mode (minimal output)
  --install-hooks  Install git post-commit hooks
  --help, -h       Show this help message

Features:
  ▣ Automatic changelog generation from git commits
  ▣ Conventional commit format support
  ▣ Categorized change detection
  ▣ Breaking change identification
  ▣ Contributor tracking
  ▣ Git hook integration

Output: ${CHANGELOG_FILE}
        `);
        process.exit(0);
    }
    
    if (installHooks) {
        const success = installGitHooks();
        process.exit(success ? 0 : 1);
    }
    
    updateChangelog().then(result => {
        if (result.error) {
            process.exit(1);
        }
        
        if (!autoMode && result.updated) {
            console.log(`\n■ Changelog Update Complete`);
            console.log(`────────────────────────────────────────────────`);
            console.log(`▣ Version: ${result.version}`);
            console.log(`▣ Commits: ${result.commitCount}`);
            console.log(`▣ Contributors: ${result.contributors}`);
            console.log(`▣ Breaking Changes: ${result.breakingChanges}`);
        }
    }).catch(error => {
        console.error(`× Fatal error: ${error.message}`);
        process.exit(1);
    });
}

export default {
    updateChangelog,
    installGitHooks,
    CHANGELOG_DIR,
    CHANGELOG_FILE
};
