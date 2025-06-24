#!/usr/bin/env python3
"""
Simple and Reliable Backup System
No dependencies required, pure Python implementation
"""

import os
import sys
import json
import hashlib
import shutil
import datetime
from pathlib import Path
import argparse

def calculate_checksum(file_path):
    """Calculate SHA256 checksum of a file"""
    try:
        hash_sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        return hash_sha256.hexdigest()
    except Exception as e:
        print(f"ERROR: Failed to calculate checksum for {file_path}: {e}")
        return None

def generate_checksums(workspace_root):
    """Generate checksums for all files in workspace"""
    print("Generating file checksums...")
    
    checksums = {}
    large_files = []
    large_file_threshold = 10 * 1024 * 1024  # 10MB
    
    workspace_path = Path(workspace_root)
    
    for file_path in workspace_path.rglob("*"):
        if file_path.is_file():
            try:
                relative_path = file_path.relative_to(workspace_path)
                checksum = calculate_checksum(file_path)
                
                if checksum:
                    file_size = file_path.stat().st_size
                    file_info = {
                        'checksum': checksum,
                        'size': file_size,
                        'lastModified': datetime.datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
                    }
                    
                    checksums[str(relative_path)] = file_info
                    
                    if file_size > large_file_threshold:
                        large_files.append({
                            'path': str(relative_path),
                            'size': file_size,
                            'checksum': checksum
                        })
            except Exception as e:
                print(f"WARNING: Skipped {file_path}: {e}")
    
    checksum_data = {
        'generated': datetime.datetime.now().isoformat(),
        'checksums': checksums,
        'largeFiles': large_files,
        'stats': {
            'totalFiles': len(checksums),
            'largeFileCount': len(large_files),
            'totalSize': sum(info['size'] for info in checksums.values())
        }
    }
    
    # Save checksums
    logs_dir = workspace_path / "logs"
    logs_dir.mkdir(exist_ok=True)
    
    checksum_file = logs_dir / "file_checksums.json"
    with open(checksum_file, 'w') as f:
        json.dump(checksum_data, f, indent=2)
    
    print(f"Generated checksums for {len(checksums)} files")
    print(f"Found {len(large_files)} large files")
    print(f"Total size: {checksum_data['stats']['totalSize']:,} bytes")
    
    return checksum_data

def verify_integrity(workspace_root):
    """Verify integrity of all files"""
    print("Verifying file integrity...")
    
    workspace_path = Path(workspace_root)
    checksum_file = workspace_path / "logs" / "file_checksums.json"
    
    if not checksum_file.exists():
        print("No checksum file found, generating new checksums")
        generate_checksums(workspace_root)
        return True
    
    with open(checksum_file, 'r') as f:
        stored_data = json.load(f)
    
    issues = []
    verified_count = 0
    
    for relative_path, stored_info in stored_data['checksums'].items():
        file_path = workspace_path / relative_path
        
        if not file_path.exists():
            issues.append(f"Missing file: {relative_path}")
            continue
            
        # Check size
        current_size = file_path.stat().st_size
        if current_size != stored_info['size']:
            issues.append(f"Size mismatch for {relative_path}: expected {stored_info['size']}, got {current_size}")
            continue
            
        # Check checksum
        current_checksum = calculate_checksum(file_path)
        if current_checksum != stored_info['checksum']:
            issues.append(f"Checksum mismatch for {relative_path}")
            continue
            
        verified_count += 1
    
    if issues:
        print(f"ERROR: Integrity verification failed - {len(issues)} issues found:")
        for issue in issues:
            print(f"  - {issue}")
        return False
    else:
        print(f"SUCCESS: Integrity verification passed - {verified_count} files verified")
        return True

def create_backup(workspace_root, backup_location, backup_type="incremental"):
    """Create a backup of the workspace"""
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_name = f"artifact_lab_{backup_type}_{timestamp}"
    backup_path = Path(backup_location) / backup_name
    
    print(f"Creating {backup_type} backup to {backup_path}")
    
    try:
        # Create backup directory
        backup_path.mkdir(parents=True, exist_ok=True)
        
        # Copy all files
        workspace_path = Path(workspace_root)
        
        total_files = sum(1 for _ in workspace_path.rglob("*") if _.is_file())
        current_file = 0
        
        for file_path in workspace_path.rglob("*"):
            if file_path.is_file():
                try:
                    relative_path = file_path.relative_to(workspace_path)
                    dest_path = backup_path / relative_path
                    
                    # Create destination directory
                    dest_path.parent.mkdir(parents=True, exist_ok=True)
                    
                    # Copy file
                    shutil.copy2(file_path, dest_path)
                    
                    current_file += 1
                    if current_file % 100 == 0:
                        progress = (current_file / total_files) * 100
                        print(f"Progress: {progress:.1f}% ({current_file}/{total_files})")
                        
                except Exception as e:
                    print(f"WARNING: Failed to copy {file_path}: {e}")
        
        # Create backup manifest
        manifest = {
            'created': datetime.datetime.now().isoformat(),
            'type': backup_type,
            'source': str(workspace_path),
            'fileCount': current_file,
            'user': os.getenv('USERNAME', 'unknown'),
            'machine': os.getenv('COMPUTERNAME', 'unknown')
        }
        
        with open(backup_path / "backup_manifest.json", 'w') as f:
            json.dump(manifest, f, indent=2)
        
        print(f"Backup completed successfully: {current_file} files backed up")
        return True
        
    except Exception as e:
        print(f"ERROR: Backup failed: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Artifact Lab Backup System")
    parser.add_argument("--workspace", default="L:/devops/artifact_lab", help="Workspace root directory")
    parser.add_argument("--backup-location", default="L:/devops/backups/artifact_lab", help="Backup location")
    parser.add_argument("--backup-type", default="incremental", choices=["full", "incremental"], help="Backup type")
    parser.add_argument("--verify-integrity", action="store_true", help="Verify file integrity")
    parser.add_argument("--generate-checksums", action="store_true", help="Generate checksums only")
    
    args = parser.parse_args()
    
    print("=== Artifact Lab Backup System ===")
    print(f"Workspace: {args.workspace}")
    print(f"Backup Location: {args.backup_location}")
    print(f"Backup Type: {args.backup_type}")
    print()
    
    # Generate checksums if requested or needed
    if args.generate_checksums:
        generate_checksums(args.workspace)
        return
    
    # Update checksums
    checksum_data = generate_checksums(args.workspace)
    
    # Verify integrity if requested
    if args.verify_integrity:
        if not verify_integrity(args.workspace):
            print("ERROR: Integrity check failed - aborting backup")
            sys.exit(1)
    
    # Create backup
    if create_backup(args.workspace, args.backup_location, args.backup_type):
        print("SUCCESS: Backup system completed successfully")
    else:
        print("ERROR: Backup system failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
