import os
import json
import hashlib
import time
from collections import defaultdict
from pathlib import Path

INDEX_PATH = os.path.join(os.path.dirname(__file__), 'dependency_index.json')
EXCLUDE_DIRS = {'__pycache__', 'venv', 'env', '.venv', 'node_modules', '.pytest_cache'}

# Include common file types and dotfiles
INCLUDE_EXTENSIONS = {
    '.py', '.js', '.ts', '.html', '.css', '.json', '.yaml', '.yml', 
    '.toml', '.md', '.txt', '.conf', '.cfg', '.ini', '.env', '.sh', 
    '.bat', '.ps1', '.sql', '.xml', '.csv', '.log'
}

# Include important dotfiles
INCLUDE_DOTFILES = {
    '.gitignore', '.gitattributes', '.dockerignore', '.editorconfig',
    '.eslintrc', '.prettierrc', '.babelrc', '.env', '.env.local',
    '.env.development', '.env.production', '.flake8', '.pylintrc'
}

def hash_file(filepath):
    try:
        h = hashlib.sha256()
        with open(filepath, 'rb') as f:
            while chunk := f.read(8192):
                h.update(chunk)
        return h.hexdigest()
    except (OSError, IOError):
        return None

def should_include_file(filename):
    """Determine if a file should be included in the index"""
    if filename in INCLUDE_DOTFILES:
        return True
    
    ext = Path(filename).suffix.lower()
    return ext in INCLUDE_EXTENSIONS

def get_file_info(filepath):
    """Get detailed file information"""
    try:
        stat = os.stat(filepath)
        return {
            'size': stat.st_size,
            'modified': stat.st_mtime,
            'type': Path(filepath).suffix.lower() or 'no_extension'
        }
    except (OSError, IOError):
        return None

def build_dependency_index():
    """Build comprehensive dependency index including dotfiles"""
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    index = defaultdict(lambda: {'files': {}, 'stats': {}})
    
    total_files = 0
    for dirpath, dirnames, filenames in os.walk(root):
        # Don't exclude .git and other dot directories - we want some dotfiles
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        
        rel_dir = os.path.relpath(dirpath, root)
        if rel_dir == '.':
            rel_dir = 'root'
            
        for fname in filenames:
            if should_include_file(fname):
                fpath = os.path.join(dirpath, fname)
                file_hash = hash_file(fpath)
                file_info = get_file_info(fpath)
                
                if file_hash and file_info:
                    index[rel_dir]['files'][fname] = {
                        'hash': file_hash,
                        'size': file_info['size'],
                        'modified': file_info['modified'],
                        'type': file_info['type'],
                        'is_dotfile': fname.startswith('.')
                    }
                    total_files += 1
        
        # Calculate directory statistics
        if index[rel_dir]['files']:
            files_data = index[rel_dir]['files']
            index[rel_dir]['stats'] = {
                'total_files': len(files_data),
                'total_size': sum(f['size'] for f in files_data.values()),
                'file_types': list(set(f['type'] for f in files_data.values())),
                'dotfiles_count': sum(1 for f in files_data.values() if f['is_dotfile']),
                'largest_file': max(files_data.items(), key=lambda x: x[1]['size'])[0] if files_data else None
            }
    
    # Add global statistics
    index['_metadata'] = {
        'total_files': total_files,
        'total_directories': len([k for k in index.keys() if k != '_metadata']),
        'generated_at': time.time(),
        'root_path': root
    }
    
    with open(INDEX_PATH, 'w', encoding='utf-8') as f:
        json.dump(dict(index), f, indent=2)
    
    print(f"Indexed {total_files} files across {len(index)-1} directories")

if __name__ == "__main__":
    build_dependency_index()
