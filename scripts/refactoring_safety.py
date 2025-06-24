#!/usr/bin/env python3
"""
Refactoring Safety System - Comprehensive file operation safety and rollback
This system ensures no data loss during large-scale refactoring operations
"""

import os
import sys
import json
import hashlib
import shutil
import datetime
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import tempfile
import subprocess

class RefactoringSafetySystem:
    """Comprehensive safety system for refactoring operations"""
    
    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root).resolve()
        self.logs_dir = self.workspace_root / "logs"
        self.temp_dir = self.workspace_root / "temp" / "refactoring"
        self.backup_dir = Path("L:/devops/backups/artifact_lab")
        
        # Create necessary directories
        self.logs_dir.mkdir(exist_ok=True)
        self.temp_dir.mkdir(parents=True, exist_ok=True)
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        
        # Setup logging
        self.setup_logging()        
        # Operation history
        self.operations: List[Dict[str, Any]] = []
        self.rollback_stack: List[Dict[str, Any]] = []
        
    def setup_logging(self):
        """Setup comprehensive logging"""
        log_file = self.logs_dir / f"refactoring_safety_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler(sys.stdout)
            ]
        )
        
        self.logger = logging.getLogger(__name__)
        self.logger.info(f"Refactoring Safety System initialized for {self.workspace_root}")
        
    def calculate_checksum(self, file_path: Path) -> Optional[str]:
        """Calculate SHA256 checksum of a file"""
        try:
            with open(file_path, 'rb') as f:
                return hashlib.sha256(f.read()).hexdigest()
        except Exception as e:
            self.logger.error(f"Failed to calculate checksum for {file_path}: {e}")
            return None
            
    def get_file_metadata(self, file_path: Path) -> Dict[str, Any]:
        """Get comprehensive file metadata"""
        try:
            stat = file_path.stat()
            return {
                'path': str(file_path),
                'size': stat.st_size,
                'mtime': stat.st_mtime,
                'checksum': self.calculate_checksum(file_path),
                'exists': True
            }
        except Exception as e:
            self.logger.error(f"Failed to get metadata for {file_path}: {e}")
            return {
                'path': str(file_path),
                'exists': False,
                'error': str(e)
            }
            
    def create_operation_snapshot(self, operation_name: str, affected_paths: List[Path]) -> str:
        """Create a snapshot before an operation"""
        snapshot_id = f"{operation_name}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S_%f')}"
        snapshot_dir = self.temp_dir / snapshot_id
        snapshot_dir.mkdir(exist_ok=True)
        
        snapshot_data = {
            'id': snapshot_id,
            'operation': operation_name,
            'timestamp': datetime.datetime.now().isoformat(),
            'affected_paths': [str(p) for p in affected_paths],
            'metadata': {}
        }
        
        # Create backups and collect metadata
        for path in affected_paths:
            if path.exists():
                # Create backup
                relative_path = path.relative_to(self.workspace_root)
                backup_path = snapshot_dir / relative_path
                backup_path.parent.mkdir(parents=True, exist_ok=True)
                
                if path.is_file():
                    shutil.copy2(path, backup_path)
                elif path.is_dir():
                    shutil.copytree(path, backup_path, dirs_exist_ok=True)
                
                # Collect metadata
                snapshot_data['metadata'][str(relative_path)] = self.get_file_metadata(path)
        
        # Save snapshot metadata
        with open(snapshot_dir / 'snapshot_metadata.json', 'w') as f:
            json.dump(snapshot_data, f, indent=2)
            
        self.logger.info(f"Created operation snapshot: {snapshot_id}")
        return snapshot_id
        
    def safe_move(self, source: Path, destination: Path, dry_run: bool = False) -> bool:
        """Safely move a file or directory with rollback capability"""
        operation_name = f"move_{source.name}_to_{destination.name}"
        
        if dry_run:
            self.logger.info(f"DRY RUN: Would move {source} to {destination}")
            return True
            
        # Create snapshot
        snapshot_id = self.create_operation_snapshot(operation_name, [source, destination.parent])
        
        try:
            # Ensure destination directory exists
            destination.parent.mkdir(parents=True, exist_ok=True)
            
            # Perform the move
            shutil.move(str(source), str(destination))
            
            # Record operation for rollback
            self.rollback_stack.append({
                'operation': 'move',
                'snapshot_id': snapshot_id,
                'source': str(source),
                'destination': str(destination),
                'timestamp': datetime.datetime.now().isoformat()
            })
            
            self.logger.info(f"Successfully moved {source} to {destination}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to move {source} to {destination}: {e}")
            self.rollback_operation(snapshot_id)
            return False
            
    def safe_copy(self, source: Path, destination: Path, dry_run: bool = False) -> bool:
        """Safely copy a file or directory"""
        operation_name = f"copy_{source.name}_to_{destination.name}"
        
        if dry_run:
            self.logger.info(f"DRY RUN: Would copy {source} to {destination}")
            return True
            
        # Create snapshot
        snapshot_id = self.create_operation_snapshot(operation_name, [destination])
        
        try:
            # Ensure destination directory exists
            destination.parent.mkdir(parents=True, exist_ok=True)
            
            # Perform the copy
            if source.is_file():
                shutil.copy2(source, destination)
            elif source.is_dir():
                shutil.copytree(source, destination, dirs_exist_ok=True)
                
            # Record operation for rollback
            self.rollback_stack.append({
                'operation': 'copy',
                'snapshot_id': snapshot_id,
                'source': str(source),
                'destination': str(destination),
                'timestamp': datetime.datetime.now().isoformat()
            })
            
            self.logger.info(f"Successfully copied {source} to {destination}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to copy {source} to {destination}: {e}")
            self.rollback_operation(snapshot_id)
            return False
            
    def safe_delete(self, path: Path, dry_run: bool = False) -> bool:
        """Safely delete a file or directory with backup"""
        operation_name = f"delete_{path.name}"
        
        if dry_run:
            self.logger.info(f"DRY RUN: Would delete {path}")
            return True
            
        # Create snapshot
        snapshot_id = self.create_operation_snapshot(operation_name, [path])
        
        try:
            # Perform the deletion
            if path.is_file():
                path.unlink()
            elif path.is_dir():
                shutil.rmtree(path)
                
            # Record operation for rollback
            self.rollback_stack.append({
                'operation': 'delete',
                'snapshot_id': snapshot_id,
                'path': str(path),
                'timestamp': datetime.datetime.now().isoformat()
            })
            
            self.logger.info(f"Successfully deleted {path}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to delete {path}: {e}")
            return False
            
    def rollback_operation(self, snapshot_id: str) -> bool:
        """Rollback a specific operation using its snapshot"""
        snapshot_dir = self.temp_dir / snapshot_id
        
        if not snapshot_dir.exists():
            self.logger.error(f"Snapshot {snapshot_id} not found")
            return False
            
        try:
            # Load snapshot metadata
            with open(snapshot_dir / 'snapshot_metadata.json', 'r') as f:
                snapshot_data = json.load(f)
                
            # Restore files from snapshot
            for relative_path_str in snapshot_data['metadata']:
                relative_path = Path(relative_path_str)
                original_path = self.workspace_root / relative_path
                backup_path = snapshot_dir / relative_path
                
                if backup_path.exists():
                    # Ensure parent directory exists
                    original_path.parent.mkdir(parents=True, exist_ok=True)
                    
                    # Restore the file/directory
                    if backup_path.is_file():
                        shutil.copy2(backup_path, original_path)
                    elif backup_path.is_dir():
                        if original_path.exists():
                            shutil.rmtree(original_path)
                        shutil.copytree(backup_path, original_path)
                        
            self.logger.info(f"Successfully rolled back operation: {snapshot_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to rollback operation {snapshot_id}: {e}")
            return False
            
    def rollback_all_operations(self) -> bool:
        """Rollback all operations in reverse order"""
        self.logger.info("Starting full rollback of all operations")
        
        success_count = 0
        for operation in reversed(self.rollback_stack):
            if self.rollback_operation(operation['snapshot_id']):
                success_count += 1
            else:
                self.logger.error(f"Failed to rollback operation: {operation}")
                
        self.logger.info(f"Rollback completed: {success_count}/{len(self.rollback_stack)} operations")
        return success_count == len(self.rollback_stack)
        
    def verify_integrity(self) -> Tuple[bool, List[str]]:
        """Verify integrity of all files in workspace"""
        self.logger.info("Starting integrity verification")
        
        issues = []
        checksum_file = self.logs_dir / "file_checksums.json"
        
        if not checksum_file.exists():
            issues.append("No checksum file found for integrity verification")
            return False, issues
            
        try:
            with open(checksum_file, 'r') as f:
                stored_checksums = json.load(f)
                
            for relative_path, stored_data in stored_checksums.get('checksums', {}).items():
                file_path = self.workspace_root / relative_path
                
                if not file_path.exists():
                    issues.append(f"Missing file: {relative_path}")
                    continue
                    
                current_checksum = self.calculate_checksum(file_path)
                if current_checksum != stored_data.get('checksum'):
                    issues.append(f"Checksum mismatch: {relative_path}")
                    
                current_size = file_path.stat().st_size
                if current_size != stored_data.get('size'):
                    issues.append(f"Size mismatch: {relative_path}")
                    
        except Exception as e:
            issues.append(f"Error during integrity check: {e}")
            
        if issues:
            self.logger.error(f"Integrity verification failed: {len(issues)} issues found")
            for issue in issues:
                self.logger.error(f"  - {issue}")
        else:
            self.logger.info("Integrity verification passed")
            
        return len(issues) == 0, issues
        
    def cleanup_snapshots(self, keep_recent: int = 10):
        """Clean up old snapshots, keeping only recent ones"""
        snapshots = sorted(self.temp_dir.glob("*"), key=lambda x: x.stat().st_mtime, reverse=True)
        
        for snapshot in snapshots[keep_recent:]:
            try:
                shutil.rmtree(snapshot)
                self.logger.info(f"Cleaned up old snapshot: {snapshot.name}")
            except Exception as e:
                self.logger.error(f"Failed to clean up snapshot {snapshot.name}: {e}")

def main():
    """Main function for command-line usage"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Refactoring Safety System")
    parser.add_argument("--workspace", default="L:/devops/artifact_lab", help="Workspace root directory")
    parser.add_argument("--verify", action="store_true", help="Run integrity verification")
    parser.add_argument("--rollback-all", action="store_true", help="Rollback all operations")
    parser.add_argument("--cleanup", action="store_true", help="Clean up old snapshots")
    
    args = parser.parse_args()
    
    safety = RefactoringSafetySystem(args.workspace)
    
    if args.verify:
        is_valid, issues = safety.verify_integrity()
        if not is_valid:
            sys.exit(1)
            
    if args.rollback_all:
        if not safety.rollback_all_operations():
            sys.exit(1)
            
    if args.cleanup:
        safety.cleanup_snapshots()

if __name__ == "__main__":
    main()
