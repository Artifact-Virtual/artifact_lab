# filepath: w:\\artifact-virtual\\models\\model.py
# Created on May 29, 2025
# GPT-style Transformer Language Model Trainer

import sys
import os

# Ensure the project root is in the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import argparse
import glob
import torch
import torch.nn as nn
from torch.nn import functional as F
from datetime import datetime
import platform
import multiprocessing
import time
import traceback # Add this import
import math # Add for lr decay
import sqlite3 # Add for SQLite logging
import shutil
import csv

# --- Optional Dependency Imports with Graceful Fallbacks ---
psutil = None
GPUtil = None
tabulate = None
tqdm = None

try:
    import psutil # Ensure psutil is imported here
except ImportError:
    print("[WARNING] psutil not found. RAM detection will be limited.")

try:
    import GPUtil # Ensure GPUtil is imported here
except ImportError:
    print("[WARNING] GPUtil not found. GPU detection might be less detailed (torch.cuda will be primary).")

try:
    from tabulate import tabulate
except ImportError:
    print("[INFO] tabulate not found. Summary tables will be in plain text.")

try:
    from tqdm import tqdm
except ImportError:
    print("[INFO] tqdm not found. Progress bar will not be shown.")

# --- Visual Output Helpers (Colorama) ---
try:
    from colorama import init as colorama_init, Fore, Style
    colorama_init(autoreset=True)
    COLOR_ENABLED = True
except ImportError:
    COLOR_ENABLED = False
    class DummyColor:
        RESET = ''
        RED = ''
        GREEN = ''
        YELLOW = ''
        BLUE = ''
        CYAN = ''
        MAGENTA = ''
        WHITE = ''
        BRIGHT = ''
        DIM = ''
    Fore = Style = DummyColor()

def vinfo(msg):
    if COLOR_ENABLED:
        print(Fore.BLUE + Style.BRIGHT + str(msg) + Style.RESET_ALL)
    else:
        print(str(msg))

def vwarn(msg):
    if COLOR_ENABLED:
        print(Fore.YELLOW + Style.BRIGHT + str(msg) + Style.RESET_ALL)
    else:
        print(str(msg))

def verror(msg):
    if COLOR_ENABLED:
        print(Fore.RED + Style.BRIGHT + str(msg) + Style.RESET_ALL)
    else:
        print(str(msg))

def vsep(char='=', length=60, color=Fore.MAGENTA):
    if COLOR_ENABLED:
        print(color + char * length + Style.RESET_ALL)
    else:
        print(char * length)

# --- Global Configuration & Constants ---
torch.manual_seed(1337)  # Consistent seed for reproducibility
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASETS_DIR_DEFAULT = os.path.abspath(os.path.join(BASE_DIR, '../datasets'))
PRETRAINED_DIR_DEFAULT = os.path.abspath(os.path.join(BASE_DIR, 'pretrained'))
REPORTS_DIR_DEFAULT = os.path.abspath(os.path.join(BASE_DIR, '../.reports'))

# --- Utility Functions ---

def find_all_txt_files(base_folder):
    """Recursively find all .txt files in a directory."""
    pattern_root = os.path.join(base_folder, '*.txt')
    pattern_subdirs = os.path.join(base_folder, '**', '*.txt')
    files = glob.glob(pattern_root)
    files.extend(glob.glob(pattern_subdirs, recursive=True))
    return list(set(files))

def encode(s, stoi_map): # Added stoi_map argument
    return [stoi_map[c] for c in s]

def decode(l, itos_map): # Added itos_map argument
    return ''.join([itos_map[i] for i in l])

def get_batch(split, args, train_data, val_data, device):
    """Generate a batch of data for training or validation."""
    data = train_data if split == 'train' else val_data
    if not data.numel() > 0 or len(data) <= args.block_size:
        raise ValueError(
            f"[ERROR] Not enough data for block_size {args.block_size}. "
            f"Dataset split '{split}' has {len(data)} tokens. "
            f"Ensure dataset is large enough or reduce block_size."
        )
    ix = torch.randint(len(data) - args.block_size, (args.batch_size,), device=device)
    x = torch.stack([data[i:i + args.block_size] for i in ix])
    y = torch.stack([data[i + 1:i + args.block_size + 1] for i in ix])
    x, y = x.to(device, non_blocking=True), y.to(device, non_blocking=True)
    return x, y

@torch.no_grad()
def estimate_loss(model, args, train_data, val_data, device, current_tqdm_write):
    """Estimate loss on training and validation sets."""
    out = {}
    model.eval()
    for split in ['train', 'val']:
        losses = torch.zeros(args.eval_iters, device=device)
        for k in range(args.eval_iters):
            try:
                X, Y = get_batch(split, args, train_data, val_data, device)
                _, loss = model(X, Y)
                losses[k] = loss.item()
            except ValueError as e:
                current_tqdm_write(f"[WARNING] Skipping batch in {split} during loss estimation: {e}")
                losses[k] = float('nan')
            except Exception as e:
                current_tqdm_write(f"[ERROR] Unexpected error during {split} loss estimation at iter {k}: {e}")
                losses[k] = float('nan')
        valid_losses = losses[~torch.isnan(losses)]
        if len(valid_losses) > 0:
            out[split] = valid_losses.mean().item()
        else:
            current_tqdm_write(f"[WARNING] All batches failed for {split} loss estimation. Reporting NaN.")
            out[split] = float('nan')
    model.train()
    return out

# --- SQLite Logging Globals ---
db_conn = None
db_cursor = None
current_run_id_for_db = None # Will be set in main()

def init_sqlite(db_path, run_id):
    """Initialize SQLite database and create metrics table if it doesn't exist."""
    global db_conn, db_cursor, current_run_id_for_db
    current_run_id_for_db = run_id
    try:
        db_conn = sqlite3.connect(db_path)
        db_cursor = db_conn.cursor()
        db_cursor.execute('''
        CREATE TABLE IF NOT EXISTS metrics (
            run_id TEXT,
            iter_num INTEGER,
            timestamp TEXT,
            train_loss REAL,
            val_loss REAL,
            learning_rate REAL,
            best_val_loss_achieved REAL,
            PRIMARY KEY (run_id, iter_num)
        )
        ''')
        db_conn.commit()
    except sqlite3.Error as e:
        sys.__stderr__.write(f"[ERROR] Failed to initialize SQLite database at {db_path}: {e}\\n")
        db_conn = None # Ensure db_conn is None if init fails
        db_cursor = None

def log_metric_to_sqlite(iter_num, train_loss, val_loss, learning_rate, best_val_loss_so_far):
    """Log metrics to the SQLite database for the current run."""
    if db_conn and db_cursor and current_run_id_for_db:
        timestamp = datetime.now().isoformat()
        try:
            db_cursor.execute('''
            INSERT INTO metrics (run_id, iter_num, timestamp, train_loss, val_loss, learning_rate, best_val_loss_achieved)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (current_run_id_for_db, iter_num, timestamp, train_loss, val_loss, learning_rate, best_val_loss_so_far))
            db_conn.commit()
        except sqlite3.Error as e:
            sys.__stderr__.write(f"[ERROR] Failed to log metrics to SQLite (iter {iter_num}): {e}\\n")

def close_sqlite_connection():
    """Close the SQLite connection if it's open."""
    global db_conn
    if db_conn:
        try:
            db_conn.close()
            db_conn = None # Reset global
            # print("[INFO] SQLite connection closed.") # This print is optional, might be too verbose for console
        except sqlite3.Error as e:
            sys.__stderr__.write(f"[ERROR] Failed to close SQLite connection: {e}\\n")

def export_sqlite_report_to_csv(db_path, report_dir, run_id):
    try:
        import sqlite3
        import os
        if not os.path.exists(db_path):
            vwarn(f"[WARNING] No SQLite database found at {db_path} to export report.")
            return None
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM metrics WHERE run_id = ? ORDER BY iter_num", (run_id,))
        rows = cursor.fetchall()
        headers = [description[0] for description in cursor.description]
        os.makedirs(report_dir, exist_ok=True)
        report_path = os.path.join(report_dir, f"training_report_{run_id}.csv")
        with open(report_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(headers)
            writer.writerows(rows)
        conn.close()
        vinfo(f"[INFO] Training report exported to: {report_path}")
        return report_path
    except Exception as e:
        verror(f"[ERROR] Failed to export training report: {e}")
        return None

# --- Checkpoint Management ---
def manage_checkpoints(output_dir, keep_n_checkpoints, log_func):
    """Manage iteration-specific checkpoints, keeping only the desired number."""
    if keep_n_checkpoints == 0: # 0 means keep all, so no management needed for deletion
        log_func(f"[DEBUG] [Checkpoint Manager] keep_checkpoints is 0. All iter checkpoints will be kept.")
        return
    # Note: keep_n_checkpoints == -1 (disable iter checkpoints) is handled by not saving them in the first place.

    all_iter_checkpoints_paths = glob.glob(os.path.join(output_dir, 'checkpoint_iter_*.pt'))
    if not all_iter_checkpoints_paths:
        log_func(f"[DEBUG] [Checkpoint Manager] No iteration checkpoints found to manage.")
        return

    checkpoints_data = []
    for ckpt_file_path in all_iter_checkpoints_paths:
        try:
            # Extract iteration number from filename, e.g., "checkpoint_iter_1000.pt"
            iter_str = ckpt_file_path.split('_iter_')[-1].split('.pt')[0]
            if iter_str.isdigit():
                checkpoints_data.append({'path': ckpt_file_path, 'iter': int(iter_str)})
            else:
                log_func(f"[DEBUG] [Checkpoint Manager] Skipped non-standard iter checkpoint name: {ckpt_file_path}")
        except Exception as e:
            log_func(f"[WARNING] [Checkpoint Manager] Could not parse iter num from {ckpt_file_path}: {e}")
            continue
    
    # Sort by iteration number, newest first
    checkpoints_data.sort(key=lambda x: x['iter'], reverse=True)

    if len(checkpoints_data) > keep_n_checkpoints:
        checkpoints_to_delete = checkpoints_data[keep_n_checkpoints:] # These are the oldest ones
        log_func(f"[INFO] [Checkpoint Manager] Found {len(checkpoints_data)} iter checkpoints. Keeping newest {keep_n_checkpoints}. Deleting {len(checkpoints_to_delete)} older ones.")
        for ckpt_to_delete in checkpoints_to_delete:
            # Double-check to not delete best_model.pt if it somehow matched the pattern (it shouldn't)
            if os.path.basename(ckpt_to_delete['path']) == 'best_model.pt':
                continue
            try:
                os.remove(ckpt_to_delete['path'])
                log_func(f"[INFO] [Checkpoint Manager] Removed old checkpoint: {ckpt_to_delete['path']}")
            except OSError as e:
                log_func(f"[WARNING] [Checkpoint Manager] Failed to remove old checkpoint {ckpt_to_delete['path']}: {e}")
    else:
        log_func(f"[DEBUG] [Checkpoint Manager] {len(checkpoints_data)} iter checkpoints found. Less than or equal to {keep_n_checkpoints} to keep. No deletion needed.")

# --- Hardware Detection & Parameter Suggestion ---
def scan_hardware():
    """Scan system hardware (CPU, RAM, GPU, VRAM)."""
    info = {'platform': platform.platform()}
    if psutil:
        info['cpu_count'] = multiprocessing.cpu_count()
        info['ram_gb'] = round(psutil.virtual_memory().total / (1024**3), 2)
    else:
        info['cpu_count'] = os.cpu_count()
        info['ram_gb'] = None

    info['gpus_detected'] = [] # New list to store all detected GPUs

    # NVIDIA CUDA GPUs
    if torch.cuda.is_available():
        for i in range(torch.cuda.device_count()):
            props = torch.cuda.get_device_properties(i)
            info['gpus_detected'].append({
                'name': props.name,
                'vram_gb': round(props.total_memory / (1024**3), 2),
                'type': 'NVIDIA CUDA',
                'torch_id': f'cuda:{i}'
            })

    # AMD ROCm GPUs (HIP) - Attempt basic detection
    # Full HIP support detection is complex and PyTorch version dependent.
    try:
        if hasattr(torch.version, 'hip') and torch.version.hip and \
           callable(getattr(torch.hip, "is_available", None)) and torch.hip.is_available() and \
           callable(getattr(torch.hip, "device_count", None)) and torch.hip.device_count() > 0:
            for i in range(torch.hip.device_count()):
                # Getting detailed props for HIP might require torch.hip.get_device_properties(i)
                # For simplicity, we'll assume a generic name if specific props are hard to get reliably.
                try:
                    props_hip = torch.hip.get_device_properties(i)
                    hip_gpu_name = props_hip.name
                    hip_vram_gb = round(props_hip.total_memory / (1024**3), 2)
                except Exception:
                    hip_gpu_name = f"AMD HIP GPU {i}"
                    hip_vram_gb = 0 # Placeholder if props fail
                info['gpus_detected'].append({
                    'name': hip_gpu_name,
                    'vram_gb': hip_vram_gb,
                    'type': 'AMD HIP',
                    'torch_id': f'hip:{i}'
                })
    except (AttributeError, NameError):
        pass # torch.hip module or functions not available

    # Using GPUtil as a fallback or for additional GPUs (including potentially AMD)
    if GPUtil:
        try:
            gpus_gputil = GPUtil.getGPUs()
            for gpu_gputil_obj in gpus_gputil:
                is_duplicate = False
                for detected_gpu in info['gpus_detected']:
                    if detected_gpu['name'] == gpu_gputil_obj.name:
                        is_duplicate = True
                        break
                if not is_duplicate:
                    gpu_type_from_gputil = "Unknown (via GPUtil)"
                    if "nvidia" in gpu_gputil_obj.name.lower():
                        gpu_type_from_gputil = "NVIDIA (via GPUtil)"
                    elif "amd" in gpu_gputil_obj.name.lower() or "radeon" in gpu_gputil_obj.name.lower():
                        gpu_type_from_gputil = "AMD (via GPUtil)"
                    
                    info['gpus_detected'].append({
                        'name': gpu_gputil_obj.name,
                        'vram_gb': round(gpu_gputil_obj.memoryTotal / 1024, 2), # GPUtil VRAM is in MB
                        'type': gpu_type_from_gputil,
                        'torch_id': None # GPUtil doesn't provide a direct PyTorch ID
                    })
        except Exception as e:
            # print(f"[DEBUG] GPUtil error: {e}") # Optional debug print
            pass # Ignore GPUtil errors
    
    # Determine primary GPU for suggestions (legacy gpu_name, vram_gb for suggest_param_ranges)
    primary_gpu_for_suggestion = None
    if info['gpus_detected']:
        # Prioritize PyTorch visible CUDA, then PyTorch visible HIP, then others
        torch_cuda_gpus = [gpu for gpu in info['gpus_detected'] if gpu['type'] == 'NVIDIA CUDA' and gpu['torch_id'] is not None]
        torch_hip_gpus = [gpu for gpu in info['gpus_detected'] if gpu['type'] == 'AMD HIP' and gpu['torch_id'] is not None]

        if torch_cuda_gpus:
            primary_gpu_for_suggestion = torch_cuda_gpus[0]
        elif torch_hip_gpus:
            primary_gpu_for_suggestion = torch_hip_gpus[0]
        else:
            # Fallback to the first GPU detected by any means, if it has VRAM info
            valid_fallback_gpus = [gpu for gpu in info['gpus_detected'] if gpu['vram_gb'] > 0]
            if valid_fallback_gpus:
                primary_gpu_for_suggestion = valid_fallback_gpus[0]

    if primary_gpu_for_suggestion:
        info['gpu_name'] = primary_gpu_for_suggestion['name']
        info['vram_gb'] = primary_gpu_for_suggestion['vram_gb']
    else:
        info['gpu_name'] = 'N/A'
        info['vram_gb'] = 0.0
    return info

def suggest_param_ranges(hw_info):
    """Suggest training parameter ranges based on detected hardware (conservative)."""
    ram_gb = hw_info.get('ram_gb', 4) or 4
    vram_gb = hw_info.get('vram_gb', 0) or 0

    if vram_gb >= 1.0:
        batch_max = min(32, max(2, int(vram_gb * 4)))
        block_max = min(512, max(32, int(vram_gb * 64)))
        n_embd_max = min(384, max(32, int(vram_gb * 48)))
        n_layer_max = min(6, max(1, int(vram_gb * 1.5)))
        n_head_max = min(6, max(1, int(vram_gb * 1.5)))
    else:
        batch_max = min(16, max(2, int(ram_gb * 1)))
        block_max = min(256, max(32, int(ram_gb * 32)))
        n_embd_max = min(256, max(32, int(ram_gb * 24)))
        n_layer_max = min(4, max(1, int(ram_gb * 0.5)))
        n_head_max = min(4, max(1, int(ram_gb * 0.5)))

    return {
        'batch_size': (2, batch_max),
        'block_size': (32, block_max),
        'n_embd': (32, n_embd_max),
        'n_head': (1, n_head_max),
        'n_layer': (1, n_layer_max),
    }

def estimate_memory_footprint(vocab_size, args, bytes_per_param=4):
    """Estimate model memory footprint in MB (parameters, gradients, optimizer states, activations)."""
    token_emb_mem = vocab_size * args.n_embd * bytes_per_param
    pos_emb_mem = args.block_size * args.n_embd * bytes_per_param
    attention_params_per_layer = (
        4 * (args.n_embd ** 2)
        + 2 * (args.n_embd * 4 * args.n_embd)
        + 2 * 2 * args.n_embd
    )
    transformer_blocks_mem = args.n_layer * attention_params_per_layer * bytes_per_param
    final_ln_mem = args.n_embd * 2 * bytes_per_param
    lm_head_mem = args.n_embd * vocab_size * bytes_per_param
    total_param_mem = token_emb_mem + pos_emb_mem + transformer_blocks_mem + final_ln_mem + lm_head_mem
    gradient_mem = total_param_mem
    optimizer_mem = 2 * total_param_mem
    activation_mem = (
        args.batch_size * args.block_size * args.n_embd * args.n_layer * 12 * bytes_per_param
    )
    total_estimated_mem_bytes = total_param_mem + gradient_mem + optimizer_mem + activation_mem
    total_estimated_mem_mb = total_estimated_mem_bytes / (1024 ** 2)
    return {
        'params_mb': total_param_mem / (1024 ** 2),
        'gradients_mb': gradient_mem / (1024 ** 2),
        'optimizer_mb': optimizer_mem / (1024 ** 2),
        'activations_mb': activation_mem / (1024 ** 2),
        'total_mb': total_estimated_mem_mb,
        'total_gb': total_estimated_mem_mb / 1024,
    }

def check_memory_feasibility(args, hw_info, vocab_size, current_tqdm_write):
    """Warn user if estimated memory usage exceeds available VRAM/RAM."""
    estimated_mem = estimate_memory_footprint(vocab_size, args)
    vram_gb = hw_info.get('vram_gb', 0) or 0
    ram_gb = hw_info.get('ram_gb', 4) or 4
    target_mem_gb = vram_gb if vram_gb > 0.5 else ram_gb
    available_mem_gb_with_margin = target_mem_gb * 0.8

    status = "recommended" if estimated_mem['total_gb'] <= available_mem_gb_with_margin else "not recommended"
    current_tqdm_write(f"Memory: {estimated_mem['total_gb']:.2f}GB (Available: {available_mem_gb_with_margin:.2f}GB) [{status}]")

    if estimated_mem['total_gb'] > available_mem_gb_with_margin:
        current_tqdm_write("[WARNING] Estimated memory usage may exceed available resources!")
        current_tqdm_write("  Consider reducing batch_size, block_size, n_embd, or n_layer.")
        if not args.force_proceed_memory:
            if input("Continue anyway? (y/N): ").lower() != 'y':
                current_tqdm_write("[INFO] Training aborted by user due to memory concerns.")
                sys.exit(0)
            else:
                current_tqdm_write("[INFO] User opted to proceed despite memory warning.")
        else:
            current_tqdm_write("[INFO] --force-proceed-memory is set, proceeding despite memory warning.")

# --- Interactive CLI ---
def interactive_cli_setup(current_args, hw_info, param_ranges):
    """Interactive CLI for setting training parameters."""
    vsep()
    vinfo("=== Interactive Model Training Setup ===")
    if hw_info:
        vinfo("\n[Hardware Info]")
        print(f"  Platform: {hw_info.get('platform', 'N/A')}")
        print(f"  CPU Count: {hw_info.get('cpu_count', 'N/A')}")
        # Ensure ram_gb is displayed correctly, even if None initially
        ram_display = f"{hw_info.get('ram_gb')} GB" if hw_info.get('ram_gb') is not None else "N/A"
        print(f"  RAM: {ram_display}")
        
        if hw_info.get('gpus_detected'):
            print("  Detected GPUs:")
            for gpu_info in hw_info['gpus_detected']:
                torch_id_str = f" (PyTorch ID: {gpu_info['torch_id']})" if gpu_info['torch_id'] else ""
                vram_str = f"{gpu_info['vram_gb']:.2f}GB" if gpu_info.get('vram_gb') is not None else "VRAM N/A"
                print(f"    - {gpu_info['name']} ({gpu_info['type']}), VRAM: {vram_str}{torch_id_str}")
        else:
            # Fallback for basic display if gpus_detected is empty or not populated
            print(f"  Primary GPU for suggestions: {hw_info.get('gpu_name', 'N/A')}")
            vram_fallback_display = f"{hw_info.get('vram_gb', 0):.2f} GB" if hw_info.get('vram_gb') is not None else "N/A"
            print(f"  VRAM (for suggestions): {vram_fallback_display}")
            print("  GPUs: No GPUs detected or listed in detail by the script's current methods.")

    if param_ranges:
        vinfo("\n[Recommended Parameter Ranges (based on your hardware)]")
        for key, (low, high) in param_ranges.items():
            low_display = int(low) if isinstance(low, (int, float)) else low
            high_display = int(high) if isinstance(high, (int, float)) else high
            print(f"  {key.replace('_', ' ').capitalize()}: {low_display} - {high_display}")

    vinfo("\n[Parameter Configuration]")
    print("Press Enter to use the default value shown in [brackets].")

    new_args = vars(current_args).copy()

    for key, default_value in vars(current_args).items():
        if key in ['interactive', 'force_proceed_memory', 'progress_bar']: # Added 'progress_bar' to skip list
            continue

        range_info = ""
        current_range = param_ranges.get(key)
        if current_range:
            low_display = int(current_range[0]) if isinstance(current_range[0], (int, float)) else current_range[0]
            high_display = int(current_range[1]) if isinstance(current_range[1], (int, float)) else current_range[1]
            range_info = f" (Recommended: {low_display}-{high_display})"

        prompt_text = f"{key.replace('_', ' ').capitalize()} [{default_value}]{range_info}: "
        user_input = input(prompt_text).strip()

        if not user_input:
            new_args[key] = default_value
        else:
            try:
                param_type = type(default_value)
                if param_type == bool:
                    if user_input.lower() in ['true', 't', 'yes', 'y', '1']:
                        new_args[key] = True
                    elif user_input.lower() in ['false', 'f', 'no', 'n', '0']:
                        new_args[key] = False
                    else:
                        raise ValueError("Invalid boolean value")
                elif param_type == type(None) and default_value is None:
                    new_args[key] = user_input if user_input.lower() != 'none' else None
                else:
                    new_args[key] = param_type(user_input)

                if current_range and isinstance(new_args[key], (int, float)):
                    if not (current_range[0] <= new_args[key] <= current_range[1]):
                        print(f"[WARNING] Value for {key} ({new_args[key]}) is outside the recommended range {range_info}.")
                        if input(f"  Use this value anyway? (y/N): ").lower() != 'y':
                            new_args[key] = default_value
                            print(f"  Reverted to default: {default_value}")
            except ValueError:
                print(f"[WARNING] Invalid input for {key}. Using default value: {default_value}")
                new_args[key] = default_value

    vinfo("\n[INFO] Final Configuration:")
    for key, value in new_args.items():
        if key in ['interactive', 'force_proceed_memory', 'wandb_api_key']:
            continue
        print(f"  {key.replace('_', ' ').capitalize()}: {value}")

    if input("\nProceed with these settings? (Y/n): ").lower() == 'n':
        vinfo("[INFO] Training aborted by user.")
        sys.exit(0)

    for key, value in new_args.items():
        setattr(current_args, key, value)

# --- Transformer Model Components ---
class Head(nn.Module):
    """One head of self-attention."""
    def __init__(self, n_embd, head_size, block_size, dropout_rate):
        super().__init__()
        self.key = nn.Linear(n_embd, head_size, bias=False)
        self.query = nn.Linear(n_embd, head_size, bias=False)
        self.value = nn.Linear(n_embd, head_size, bias=False)
        self.register_buffer('tril', torch.tril(torch.ones(block_size, block_size)))
        self.dropout = nn.Dropout(dropout_rate)

    def forward(self, x):
        B, T, C = x.shape
        k = self.key(x)
        q = self.query(x)
        wei = q @ k.transpose(-2, -1) * k.shape[-1] ** -0.5
        wei = wei.masked_fill(self.tril[:T, :T] == 0, float('-inf'))
        wei = F.softmax(wei, dim=-1)
        wei = self.dropout(wei)
        v = self.value(x)
        out = wei @ v
        return out

class MultiHeadAttention(nn.Module):
    """Multiple heads of self-attention in parallel."""
    def __init__(self, n_embd, num_heads, block_size, dropout_rate):
        super().__init__()
        assert n_embd % num_heads == 0, "n_embd must be divisible by num_heads"
        head_size = n_embd // num_heads
        self.heads = nn.ModuleList([Head(n_embd, head_size, block_size, dropout_rate) for _ in range(num_heads)])
        self.proj = nn.Linear(n_embd, n_embd)
        self.dropout = nn.Dropout(dropout_rate)

    def forward(self, x):
        out = torch.cat([h(x) for h in self.heads], dim=-1)
        out = self.dropout(self.proj(out))
        return out

class FeedForward(nn.Module):
    """A simple linear layer followed by a non-linearity."""
    def __init__(self, n_embd, dropout_rate):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(n_embd, 4 * n_embd),
            nn.ReLU(),
            nn.Linear(4 * n_embd, n_embd),
            nn.Dropout(dropout_rate),
        )

    def forward(self, x):
        return self.net(x)

class Block(nn.Module):
    """Transformer block: communication followed by computation."""
    def __init__(self, n_embd, n_head, block_size, dropout_rate):
        super().__init__()
        self.sa = MultiHeadAttention(n_embd, n_head, block_size, dropout_rate)
        self.ffwd = FeedForward(n_embd, dropout_rate)
        self.ln1 = nn.LayerNorm(n_embd)
        self.ln2 = nn.LayerNorm(n_embd)

    def forward(self, x):
        x = x + self.sa(self.ln1(x))
        x = x + self.ffwd(self.ln2(x))
        return x

# --- GPT Language Model ---
class GPTLanguageModel(nn.Module):
    def __init__(self, vocab_size, args):
        super().__init__()
        self.args = args
        self.token_embedding_table = nn.Embedding(vocab_size, args.n_embd)
        self.position_embedding_table = nn.Embedding(args.block_size, args.n_embd)
        self.blocks = nn.Sequential(
            *[Block(args.n_embd, args.n_head, args.block_size, args.dropout) for _ in range(args.n_layer)]
        )
        self.ln_f = nn.LayerNorm(args.n_embd)
        self.lm_head = nn.Linear(args.n_embd, vocab_size)
        self.apply(self._init_weights)

    def _init_weights(self, module):
        if isinstance(module, nn.Linear):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if module.bias is not None:
                torch.nn.init.zeros_(module.bias)
        elif isinstance(module, nn.Embedding):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)

    def forward(self, idx, targets=None):
        B, T = idx.shape
        tok_emb = self.token_embedding_table(idx)
        pos_emb = self.position_embedding_table(torch.arange(T, device=idx.device))
        x = tok_emb + pos_emb
        x = self.blocks(x)
        x = self.ln_f(x)
        logits = self.lm_head(x)
        if targets is None:
            loss = None
        else:
            B_logits, T_logits, C_logits = logits.shape
            logits_reshaped = logits.view(B_logits * T_logits, C_logits)
            targets_reshaped = targets.view(B_logits * T_logits)
            loss = F.cross_entropy(logits_reshaped, targets_reshaped)
        return logits, loss

    def generate(self, idx, max_new_tokens, temperature=1.0, top_k=None):
        """Generate text sequence from a starting context."""
        self.eval()
        for _ in range(max_new_tokens):
            idx_cond = idx[:, -self.args.block_size:]
            logits, _ = self(idx_cond)
            logits = logits[:, -1, :] / temperature
            if top_k is not None:
                v, _ = torch.topk(logits, min(top_k, logits.size(-1)))
                logits[logits < v[:, [-1]]] = -float('Inf')
            probs = F.softmax(logits, dim=-1)
            idx_next = torch.multinomial(probs, num_samples=1)
            idx = torch.cat((idx, idx_next), dim=1)
        self.train()
        return idx

# --- Logging and Output Handling ---
class Tee:
    """Helper class to redirect stdout to multiple files/streams (e.g., console and log file)."""
    def __init__(self, *files):
        self.files = [f for f in files if f is not None]
        self._is_tee = True

    def write(self, obj):
        for f in self.files:
            try:
                if not getattr(f, 'closed', False):
                    f.write(str(obj))
                    f.flush()
            except Exception as e:
                sys.__stdout__.write(f"[Tee Error writing to {f}]: {e}\n{obj}")

    def flush(self):
        for f in self.files:
            try:
                if not getattr(f, 'closed', False):
                    f.flush()
            except Exception as e:
                sys.__stdout__.write(f"[Tee Error flushing {f}]: {e}\n")

    def isatty(self):
        if self.files and hasattr(self.files[0], 'isatty'):
            return self.files[0].isatty()
        return False

# --- Learning Rate Scheduler (Optional) ---
def get_lr(it, learning_rate, lr_decay_iters, min_lr, warmup_iters=100): # Added warmup_iters
    # 1) linear warmup for warmup_iters steps
    if it < warmup_iters:
        return learning_rate * it / warmup_iters
    # 2) if it > lr_decay_iters, return min learning rate
    if it > lr_decay_iters:
        return min_lr
    # 3) in between, use cosine decay down to min learning rate
    decay_ratio = (it - warmup_iters) / (lr_decay_iters - warmup_iters)
    assert 0 <= decay_ratio <= 1
    coeff = 0.5 * (1.0 + math.cos(math.pi * decay_ratio)) # coeff ranges 0..1
    return min_lr + coeff * (learning_rate - min_lr)

# --- Main Training Orchestration ---
def main():
    parser = argparse.ArgumentParser(
        description="GPTransformer - GPT-style Transformer Language Model Trainer",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )

    # Core parameters
    core_group = parser.add_argument_group('Core Training Parameters')
    core_group.add_argument('--datasets_folder', type=str, default=DATASETS_DIR_DEFAULT, help='Base folder for datasets.')
    core_group.add_argument('--output_dir', type=str, default=PRETRAINED_DIR_DEFAULT, help='Directory to save trained models and checkpoints.')
    core_group.add_argument('--model_name', type=str, default=f"model_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pt", help='Filename for the final trained model.')
    core_group.add_argument('--resume_from', type=str, default=None, help='Path to a checkpoint (.pt file) to resume training from.')
    core_group.add_argument('--seed', type=int, default=1337, help='Random seed for reproducibility.')

    # Model architecture parameters
    model_group = parser.add_argument_group('Model Architecture Parameters')
    model_group.add_argument('--block_size', type=int, default=128, help='Context length for predictions (sequence length).')
    model_group.add_argument('--n_embd', type=int, default=192, help='Number of Embeds.')
    model_group.add_argument('--n_head', type=int, default=4, help='Number of Heads.')
    model_group.add_argument('--n_layer', type=int, default=4, help='Number of Layers.')
    model_group.add_argument('--dropout', type=float, default=0.1, help='Dropout rate.')

    # Training loop parameters
    train_loop_group = parser.add_argument_group('Training Loop Parameters')
    train_loop_group.add_argument('--batch_size', type=int, default=16, help='Batch size for training.')
    train_loop_group.add_argument('--max_iters', type=int, default=3000, help='Total number of training iterations.')
    train_loop_group.add_argument('--learning_rate', type=float, default=1e-3, help='Learning rate for AdamW optimizer.')
    train_loop_group.add_argument('--decay_lr', action=argparse.BooleanOptionalAction, default=True, help='Whether to decay the learning rate.')
    train_loop_group.add_argument('--lr_decay_iters', type=int, default=3000, help='Number of iterations over which to decay learning rate (if decay_lr is True).')
    train_loop_group.add_argument('--min_lr', type=float, default=1e-4, help='Minimum learning rate after decay (if decay_lr is True).')
    train_loop_group.add_argument('--warmup_iters', type=int, default=100, help='Number of warmup iterations for learning rate scheduler.')
    train_loop_group.add_argument('--eval_interval', type=int, default=250, help='How often to evaluate model performance.')
    train_loop_group.add_argument('--eval_iters', type=int, default=100, help='Number of iterations for loss estimation.')
    train_loop_group.add_argument('--save_checkpoint_every', type=int, default=500, help='Save a checkpoint every N iterations. 0 to disable.')

    # Operational parameters
    op_group = parser.add_argument_group('Operational Parameters')
    op_group.add_argument('--device', type=str, default='auto', help='Device to use (e.g., "cpu", "cuda", "cuda:0", "auto").')
    op_group.add_argument('--interactive', action='store_true', help='Launch interactive CLI for parameter setup.')
    op_group.add_argument('--progress_bar', action=argparse.BooleanOptionalAction, default=True, help='Show tqdm progress bar during training.')
    op_group.add_argument('--log_to_file', action=argparse.BooleanOptionalAction, default=True, help='Log console output to a file in .reports/ directory.')
    op_group.add_argument('--reports_dir', type=str, default=REPORTS_DIR_DEFAULT, help='Directory for log files and reports.')
    op_group.add_argument('--force_proceed_memory', action='store_true', help='Proceed with training even if memory check warns of potential issues.')
    op_group.add_argument('--keep_checkpoints', type=int, default=1, help='Number of recent iteration-specific checkpoints to keep (e.g., checkpoint_iter_N.pt). `best_model.pt` is always preserved. Set to 0 to keep all, -1 to disable iteration checkpoints entirely.')

    # Text generation parameters
    gen_group = parser.add_argument_group('Text Generation Parameters')
    gen_group.add_argument('--generate_after_training', type=int, default=200, metavar='N_TOKENS', help='Generate N tokens after training. 0 to disable.')
    gen_group.add_argument('--generate_temperature', type=float, default=0.8, help='Temperature for generation (higher = more random).')
    gen_group.add_argument('--generate_top_k', type=int, default=50, help='Top-k filtering for generation (e.g., 50). 0 to disable.')
    gen_group.add_argument('--generate_start_context', type=str, default=None, help='Optional start context for text generation.')

    args = parser.parse_args()

    # --- Auto-configuration for best system settings (non-interactive mode) ---
    if not args.interactive:
        hw_info = scan_hardware()
        param_ranges = suggest_param_ranges(hw_info)
        # For each key, set to 90% of the max (rounded down, but not below min)
        for key, (min_val, max_val) in param_ranges.items():
            if hasattr(args, key):
                # Only auto-set if user did not override via CLI
                user_val = getattr(args, key)
                default_val = parser.get_default(key)
                if user_val == default_val:
                    # Compute 90% of max, but not below min
                    best_val = int(max(min_val, math.floor(max_val * 0.9)))
                    setattr(args, key, best_val)

    # --- Initial Setup (Logging, Directories, Device) ---
    os.makedirs(args.output_dir, exist_ok=True)
    os.makedirs(args.reports_dir, exist_ok=True)

    log_file_path = None
    if args.log_to_file:
        log_file_path = os.path.join(args.reports_dir, f"train_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt")
        log_fh = open(log_file_path, 'a', encoding='utf-8')
        if not hasattr(sys.stdout, '_is_tee'):
            sys.stdout = Tee(sys.__stdout__, log_fh)
            sys.stderr = Tee(sys.__stderr__, log_fh)
    else:
        log_fh = None # Ensure log_fh is defined even if logging is off

    # Configure current_tqdm_write based on tqdm availability and progress_bar flag
    if tqdm and args.progress_bar:
        current_tqdm_write = tqdm.write
    else:
        current_tqdm_write = print # Fallback to standard print

    # Now use current_tqdm_write for subsequent initial messages
    if args.log_to_file and log_file_path: # Check if log_file_path was set
        current_tqdm_write(f"[INFO] Logging console output to: {log_file_path}")

    # Define log_to_file_only function here, after log_fh is initialized
    def log_to_file_only(message):
        if log_fh and not getattr(log_fh, 'closed', False):
            try:
                log_fh.write(str(message) + "\\n") # Ensure newline
                log_fh.flush()
            except Exception as e:
                # Fallback to stderr if logging to file fails, to not lose the message entirely
                # This ensures critical messages from file-only logging aren't completely lost
                sys.__stderr__.write(f"[CRITICAL - log_to_file_only ERROR writing to log file]: {e}\\nOriginal message: {message}\\n")
        # If log_fh is None or closed, the message is effectively suppressed for file-only logging.

    current_tqdm_write(f"[INFO] GPTransformer Language Model Trainer started at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}") # Renamed

    # --- SQLite Initialization ---
    # Ensure output_dir exists before trying to create DB in it
    os.makedirs(args.output_dir, exist_ok=True)
    db_path = os.path.join(args.output_dir, 'training_logs.sqlite')
    # Purge any existing SQLite file for a fresh start
    if os.path.exists(db_path):
        try:
            os.remove(db_path)
            vinfo(f"[INFO] Old training log database purged: {db_path}")
        except Exception as e:
            vwarn(f"[WARNING] Could not delete old training log database: {e}")
    # The global current_run_id_for_db will be set by init_sqlite
    _run_id_for_this_session = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
    init_sqlite(db_path, _run_id_for_this_session)
    if db_conn: # Check if SQLite init was successful
        current_tqdm_write(f"[INFO] SQLite logging initialized for run_id {current_run_id_for_db} at {db_path}")
    else:
        current_tqdm_write("[WARNING] SQLite logging failed to initialize. Metrics will not be saved to database.")

    torch.manual_seed(args.seed)

    # Initial device resolution attempt (can be refined after interactive setup)
    _resolved_device = args.device
    if args.device == 'auto':
        if torch.cuda.is_available() and torch.cuda.device_count() > 0:
            _resolved_device = 'cuda:0' # Default to first CUDA GPU
        else:
            try:
                if hasattr(torch.version, 'hip') and torch.version.hip and \
                   callable(getattr(torch.hip, "is_available", None)) and torch.hip.is_available() and \
                   callable(getattr(torch.hip, "device_count", None)) and torch.hip.device_count() > 0:
                    _resolved_device = 'hip:0' # Default to first HIP GPU
                else:
                    _resolved_device = 'cpu'
            except (AttributeError, NameError):
                _resolved_device = 'cpu'
    
    # --- Hardware Scan & Interactive Setup (if enabled) ---
    hw_info = scan_hardware()
    param_ranges = suggest_param_ranges(hw_info) # Uses hw_info['gpu_name'] and ['vram_gb'] from primary detected GPU

    if not args.interactive: # Only print hardware scan here if not in interactive mode
        current_tqdm_write("[INFO] Hardware Scan Results:")
        current_tqdm_write(f"  Platform: {hw_info.get('platform', 'N/A')}")
        current_tqdm_write(f"  CPU Count: {hw_info.get('cpu_count', 'N/A')}")
        ram_display_main = f"{hw_info.get('ram_gb')} GB" if hw_info.get('ram_gb') is not None else "N/A"
        current_tqdm_write(f"  RAM: {ram_display_main}")
        if hw_info.get('gpus_detected'):
            current_tqdm_write("  Detected GPUs:")
            for gpu_info in hw_info['gpus_detected']:
                torch_id_str = f" (PyTorch ID: {gpu_info['torch_id']})" if gpu_info['torch_id'] else ""
                vram_str = f"{gpu_info['vram_gb']:.2f}GB" if gpu_info.get('vram_gb') is not None else "VRAM N/A"
                current_tqdm_write(f"    - {gpu_info['name']} ({gpu_info['type']}), VRAM: {vram_str}{torch_id_str}")
        else:
            current_tqdm_write(f"  Primary GPU for suggestions: {hw_info.get('gpu_name', 'N/A')} (VRAM: {hw_info.get('vram_gb', 0):.2f} GB)")
            current_tqdm_write("  GPUs: No GPUs detected or listed in detail by the script's current methods.")
    
    if args.interactive:
        interactive_cli_setup(args, hw_info, param_ranges) # interactive_cli_setup will print hw_info
        # After interactive setup, args.device might have changed, so re-evaluate _resolved_device
        _resolved_device = args.device # User's choice from interactive overrides
        if args.device == 'auto': # If user kept 'auto' in interactive, re-run auto logic
            if torch.cuda.is_available() and torch.cuda.device_count() > 0:
                _resolved_device = 'cuda:0'
            else:
                try:
                    if hasattr(torch.version, 'hip') and torch.version.hip and \
                       callable(getattr(torch.hip, "is_available", None)) and torch.hip.is_available() and \
                       callable(getattr(torch.hip, "device_count", None)) and torch.hip.device_count() > 0:
                        _resolved_device = 'hip:0'
                    else:
                        _resolved_device = 'cpu'
                except (AttributeError, NameError):
                    _resolved_device = 'cpu'
    
    # Final device validation and assignment
    resolved_device = _resolved_device
    if resolved_device.startswith('cuda'):
        gpu_idx_str = resolved_device.split(':')[-1]
        if resolved_device == 'cuda' and torch.cuda.is_available() and torch.cuda.device_count() > 0:
            resolved_device = 'cuda:0' # Default to cuda:0 if 'cuda' is specified and available
        elif gpu_idx_str.isdigit():
            gpu_idx = int(gpu_idx_str)
            if not (torch.cuda.is_available() and gpu_idx < torch.cuda.device_count()):
                current_tqdm_write(f"[WARNING] CUDA device '{_resolved_device}' requested but not available or index out of bounds. Falling back to CPU.")
                resolved_device = 'cpu'
        elif not torch.cuda.is_available(): # Catch 'cuda' when no CUDA at all
             current_tqdm_write(f"[WARNING] CUDA device ('{_resolved_device}') requested but not available. Falling back to CPU.")
             resolved_device = 'cpu'
    elif resolved_device.startswith('hip'):
        gpu_idx_str = resolved_device.split(':')[-1]
        try:
            hip_available_check = hasattr(torch.version, 'hip') and torch.version.hip and \
                                  callable(getattr(torch.hip, "is_available", None)) and torch.hip.is_available() and \
                                  callable(getattr(torch.hip, "device_count", None))
            if resolved_device == 'hip' and hip_available_check and torch.hip.device_count() > 0:
                resolved_device = 'hip:0' # Default to hip:0 if 'hip' is specified and available
            elif gpu_idx_str.isdigit():
                gpu_idx = int(gpu_idx_str)
                if not (hip_available_check and gpu_idx < torch.hip.device_count()):
                    current_tqdm_write(f"[WARNING] HIP device '{_resolved_device}' requested but not available or index out of bounds. Falling back to CPU.")
                    resolved_device = 'cpu'
            elif not hip_available_check: # Catch 'hip' when no HIP at all
                current_tqdm_write(f"[WARNING] HIP device ('{_resolved_device}') requested but not available. Falling back to CPU.")
                resolved_device = 'cpu'
        except (AttributeError, NameError):
             current_tqdm_write(f"[WARNING] HIP support not detected or device '{_resolved_device}' unavailable. Falling back to CPU.")
             resolved_device = 'cpu'
    elif resolved_device != 'cpu': # Any other non-cpu, non-cuda, non-hip string
        current_tqdm_write(f"[WARNING] Unknown device '{_resolved_device}' specified. Falling back to CPU.")
        resolved_device = 'cpu'

    args.device = resolved_device # Store the finally resolved device string in args
    current_tqdm_write(f"[INFO] Using device: {args.device}")

    # --- Data Loading and Preprocessing ---
    current_tqdm_write(f"[INFO] Loading data from: {args.datasets_folder}")
    all_txt_files = find_all_txt_files(args.datasets_folder)
    if not all_txt_files:
        current_tqdm_write(f"[ERROR] No .txt files found in dataset folder {args.datasets_folder}. Please check the path and ensure .txt files are present. Exiting.")
        if log_fh: log_fh.close()
        sys.exit(1)
    current_tqdm_write(f"[INFO] Found {len(all_txt_files)} .txt files for training: {all_txt_files}")

    text_content = ""
    for txt_file in all_txt_files:
        try:
            with open(txt_file, 'r', encoding='utf-8') as f:
                text_content += f.read()
        except Exception as e:
            current_tqdm_write(f"[WARNING] Failed to read or decode file {txt_file}: {e}. Skipping this file.")
            # current_tqdm_write(traceback.format_exc()) # Uncomment for detailed error

    if not text_content.strip():
        current_tqdm_write(f"[ERROR] Dataset is empty after attempting to load files from {args.datasets_folder}. Please check the content of your .txt files. Exiting.")
        if log_fh: log_fh.close()
        sys.exit(1)
    current_tqdm_write(f"[INFO] Total characters in dataset: {len(text_content)}")

    chars = sorted(list(set(text_content)))
    vocab_size = len(chars)
    if vocab_size < 2:
        current_tqdm_write(f"[ERROR] Vocabulary size is {vocab_size}. This is too small to train a model. Ensure your dataset is not empty or corrupted. Exiting.")
        if log_fh: log_fh.close()
        sys.exit(1)
    current_tqdm_write(f"[INFO] Vocabulary size: {vocab_size}")

    stoi = {ch: i for i, ch in enumerate(chars)}
    itos = {i: ch for i, ch in enumerate(chars)}
    encode = lambda s: [stoi[c] for c in s if c in stoi]
    decode = lambda l: ''.join([itos[i] for i in l if i in itos])

    full_data_tensor = torch.tensor(encode(text_content), dtype=torch.long)
    n_split = int(0.9 * len(full_data_tensor))
    train_data = full_data_tensor[:n_split]
    val_data = full_data_tensor[n_split:]
    current_tqdm_write(f"[INFO] Train data size: {len(train_data)} tokens")
    current_tqdm_write(f"[INFO] Validation data size: {len(val_data)} tokens")

    # --- Memory Feasibility Check (after vocab_size is known) ---
    check_memory_feasibility(args, hw_info, vocab_size, current_tqdm_write)

    # --- Ensure n_embd is divisible by n_head in non-interactive mode ---
    if not args.interactive:
        n_embd = args.n_embd
        n_head = args.n_head
        if n_embd % n_head != 0:
            # Round up to next multiple of n_head, within 10% margin
            min_valid = ((n_embd + n_head - 1) // n_head) * n_head
            max_allowed = int(n_embd * 1.1)
            if min_valid <= max_allowed:
                old_n_embd = args.n_embd
                args.n_embd = min_valid
                current_tqdm_write(f"[WARNING] n_embd ({old_n_embd}) is not divisible by n_head ({n_head}). Automatically adjusted to {args.n_embd}.")
            else:
                # If rounding up exceeds 10% margin, round down
                max_valid = (n_embd // n_head) * n_head
                args.n_embd = max_valid
                current_tqdm_write(f"[WARNING] n_embd ({n_embd}) is not divisible by n_head ({n_head}) and rounding up exceeds 10% margin. Rounded down to {args.n_embd}.")

    # --- Model Initialization ---
    current_tqdm_write("[INFO] Initializing model...")
    model = GPTLanguageModel(vocab_size, args)
    total_params = sum(p.numel() for p in model.parameters()) / 1e6
    current_tqdm_write(f"[INFO] Model initialized with {total_params:.2f}M parameters.")

    # Move model to the resolved device *before* optimizer and checkpoint loading
    model = model.to(resolved_device)
    current_tqdm_write(f"[INFO] Model moved to device: {resolved_device}")

    # --- Optimizer ---
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate)

    # --- Checkpoint Loading (if resuming) ---
    iter_num = 0
    best_val_loss = float('inf')
    checkpoint = None # Initialize checkpoint

    if args.resume_from:
        if os.path.exists(args.resume_from):
            current_tqdm_write(f"[INFO] Resuming training from checkpoint: {args.resume_from}")
            try:
                checkpoint = torch.load(args.resume_from, map_location=resolved_device)
                model.load_state_dict(checkpoint['model_state_dict'])
                optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
                iter_num = checkpoint.get('iter_num', 0)
                best_val_loss = checkpoint.get('best_val_loss', float('inf'))
                
                # Safely update args from checkpoint
                if 'args' in checkpoint:
                    checkpoint_args_data = checkpoint['args']
                    # Convert to Namespace if it's a dict (older checkpoints might store it as dict)
                    if isinstance(checkpoint_args_data, dict):
                        checkpoint_args_ns = argparse.Namespace(**checkpoint_args_data)
                    else: # Assuming it's already a Namespace
                        checkpoint_args_ns = checkpoint_args_data

                    # Update current args with values from checkpoint_args_ns
                    # This preserves defaults for new arguments not in the checkpoint.
                    for arg_name_from_parser in vars(args).keys():
                        if hasattr(checkpoint_args_ns, arg_name_from_parser):
                            setattr(args, arg_name_from_parser, getattr(checkpoint_args_ns, arg_name_from_parser))
                        # If arg_name_from_parser is not in checkpoint_args_ns, it's a new argument
                        # and will retain its default value from the initial parsing.
                
                current_tqdm_write(f"[INFO] Resumed from iter {iter_num}, best val loss: {best_val_loss:.4f}")
                current_tqdm_write(f"[INFO] Arguments updated from checkpoint. New/missing arguments use current defaults.")
            except Exception as e:
                current_tqdm_write(f"[ERROR] Failed to load checkpoint: {e}. Starting from scratch.")
                checkpoint = None
        else:
            current_tqdm_write(f"[WARNING] Checkpoint file not found: {args.resume_from}. Starting from scratch.")

    # Initialize metrics for progress bar
    best_val_loss_for_bar = best_val_loss if best_val_loss != float('inf') else "N/A"
    val_loss_for_bar = "N/A"
    # last_checkpoint_iter_for_bar = "N/A" # No longer needed for postfix
    current_lr_for_bar = args.learning_rate # Initial LR for display

    if checkpoint and 'iter_num' in checkpoint: # Check if checkpoint was loaded
        if checkpoint.get('best_val_loss'):
             best_val_loss_for_bar = checkpoint['best_val_loss']
        # if args.resume_from and iter_num > 0: # No longer needed for postfix
            # last_checkpoint_iter_for_bar = iter_num


    pbar = None
    if tqdm and args.progress_bar:
        pbar = tqdm(total=args.max_iters, initial=iter_num, unit="iter", dynamic_ncols=True, desc="Training") # Removed ascii=True
        # Set initial postfix
        initial_postfix_data = {
            'lr': f"{current_lr_for_bar:.1e}" if isinstance(current_lr_for_bar, float) else str(current_lr_for_bar),
            'loss': "N/A",
            'val': str(val_loss_for_bar),
            'best_val': f"{best_val_loss_for_bar:.4f}" if isinstance(best_val_loss_for_bar, float) else str(best_val_loss_for_bar),
            # 'ckpt_at': str(last_checkpoint_iter_for_bar) # Removed
        }
        pbar.set_postfix(initial_postfix_data)
        # Print initial val/best_val below bar if resuming and values are available
        if iter_num > 0 and (val_loss_for_bar != "N/A" or (isinstance(best_val_loss_for_bar, float) and best_val_loss_for_bar != float('inf'))):
            val_str = f"{val_loss_for_bar:.4f}" if isinstance(val_loss_for_bar, float) else str(val_loss_for_bar)
            best_val_str = f"{best_val_loss_for_bar:.4f}" if isinstance(best_val_loss_for_bar, float) else str(best_val_loss_for_bar)
            current_tqdm_write(f"  Resumed: lr: {current_lr_for_bar:.1e}, val: {val_str}, best_val: {best_val_str}")


    training_start_time = time.time()
    eval_times = [] # For summary table

    # --- Learning Rate Decay ---
    # Ensure current_lr is defined before first use in wandb log or pbar
    if args.decay_lr:
        current_lr = get_lr(iter_num, args.learning_rate, args.lr_decay_iters, args.min_lr, args.warmup_iters)
    else:
        current_lr = args.learning_rate
    current_lr_for_bar = current_lr # Update for pbar

    # --- Checkpoint Saving ---
    def save_checkpoint(iter_num, model, optimizer, val_loss_for_bar, args, log_func):
        checkpoint_path = os.path.join(args.output_dir, f'checkpoint_iter_{iter_num}.pt')
        try:
            torch.save({
                'iter_num': iter_num,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'val_loss': val_loss_for_bar if val_loss_for_bar != "N/A" else None,
                'args': vars(args)
            }, checkpoint_path)
            log_func(f"[INFO] Saved checkpoint to {checkpoint_path} (Iter: {iter_num})")
        except Exception as e:
            log_func(f"[ERROR] Failed to save checkpoint {checkpoint_path}: {e}")

    # Save checkpoint at first iteration (0)
    if args.output_dir and args.keep_checkpoints != -1 and iter_num == 0:
        save_checkpoint(iter_num, model, optimizer, val_loss_for_bar, args, log_to_file_only)

    while iter_num < args.max_iters:
        iter_time_start = time.time()
        
        # Determine and set the learning rate for this iteration
        if args.decay_lr:
            current_lr = get_lr(iter_num, args.learning_rate, args.lr_decay_iters, args.min_lr, args.warmup_iters)
            for param_group in optimizer.param_groups:
                param_group['lr'] = current_lr
        else:
            current_lr = args.learning_rate # Remains constant if not decaying
        current_lr_for_bar = current_lr # For tqdm postfix

        if iter_num % args.eval_interval == 0 or iter_num == args.max_iters - 1:
            losses = estimate_loss(model, args, train_data, val_data, resolved_device, log_to_file_only) # Use log_to_file_only for internal prints
            val_loss_for_bar = losses['val']
            # Log to file only for these repetitive messages
            log_to_file_only(f"Iter {iter_num}: Train loss {losses['train']:.4f}, Val loss {losses['val']:.4f}, LR: {current_lr:.6e}")
            eval_times.append({'iter': iter_num, 'train_loss': losses['train'], 'val_loss': losses['val'], 'lr': current_lr, 'time_s': time.time() - training_start_time})
            
            # Log to SQLite
            log_metric_to_sqlite(iter_num, losses['train'], losses['val'], current_lr, best_val_loss)

            # No best model logic, just normal checkpoints
            pass
        # Save iteration-specific checkpoint
        if args.output_dir and args.save_checkpoint_every > 0 and iter_num % args.save_checkpoint_every == 0 and iter_num > 0:
            if args.keep_checkpoints != -1:
                save_checkpoint(iter_num, model, optimizer, val_loss_for_bar, args, log_to_file_only)
                if args.keep_checkpoints > 0:
                    manage_checkpoints(args.output_dir, args.keep_checkpoints, log_to_file_only)
        # Forward pass and backward pass
        try:
            X, Y = get_batch('train', args, train_data, val_data, resolved_device)
            logits, loss = model(X, Y)
            optimizer.zero_grad(set_to_none=True)
            loss.backward()
            optimizer.step()
        except ValueError as e:
            current_tqdm_write(f"\\n[WARNING] Skipping training batch at iter {iter_num} due to data error: {e}")
            if pbar: pbar.update(1) # Still advance progress bar
            iter_num += 1
            continue # Skip to next iteration
        except Exception as e: # Catch other potential runtime errors during training step
            current_tqdm_write(f"\\n[ERROR] Critical error during training iteration {iter_num}: {e}")
            current_tqdm_write(traceback.format_exc())
            if log_fh: log_fh.close()
            close_sqlite_connection() # Close SQLite connection on error
            sys.exit(1)


        iter_time_end = time.time()
        iter_duration_ms = (iter_time_end - iter_time_start) * 1000

        if pbar:
            pbar.update(1)
            pbar.set_postfix({
                'lr': f"{current_lr_for_bar:.1e}" if isinstance(current_lr_for_bar, float) else str(current_lr_for_bar),
                'loss': f"{losses['train']:.4f}", 
                'val': f"{val_loss_for_bar:.4f}" if isinstance(val_loss_for_bar, float) else str(val_loss_for_bar),
                'best_val': f"{best_val_loss_for_bar:.4f}" if isinstance(best_val_loss_for_bar, float) else str(best_val_loss_for_bar),
                # 'ckpt_at': str(last_checkpoint_iter_for_bar) # Removed
            })
            # Print current metrics on the same line
            current_postfix = {
                'lr': f"{current_lr_for_bar:.1e}" if isinstance(current_lr_for_bar, float) else str(current_lr_for_bar),
                'loss': f"{loss.item():.4f}", # Current batch loss
                'val': f"{val_loss_for_bar:.4f}" if isinstance(val_loss_for_bar, float) else str(val_loss_for_bar),
                'best_val': f"{best_val_loss_for_bar:.4f}" if isinstance(best_val_loss_for_bar, float) else str(best_val_loss_for_bar),
                # 'ckpt_at': str(last_checkpoint_iter_for_bar) # Removed
            }
            pbar.set_postfix(current_postfix)
        
        iter_num += 1

    training_duration = time.time() - training_start_time
    if pbar:
        pbar.close()
        current_tqdm_write(f"\\n[INFO] Training finished after {training_duration:.2f} seconds.") # Newline if pbar was used
    else:
        current_tqdm_write(f"[INFO] Training finished after {training_duration:.2f} seconds.")

    # --- Final Model Saving (if output_dir is specified) ---
    if args.output_dir:
        final_model_path = os.path.join(args.output_dir, f"model_pretrained_{iter_num}.pt")
        current_tqdm_write(f"[INFO] Saving final model to: {final_model_path}")
        torch.save({
            'iter_num': iter_num,
            'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'val_loss': val_loss_for_bar if val_loss_for_bar != "N/A" else None,
            'args': vars(args)
        }, final_model_path)

    # --- Final Summary ---
    current_tqdm_write("\\n" + "="*20 + " Training Summary " + "="*20)
    if eval_times: # Check if eval_times has data
        current_tqdm_write(f"Final Validation Loss: {eval_times[-1]['val_loss']:.4f} (at iter {eval_times[-1]['iter']})")
        current_tqdm_write(f"Best Validation Loss: {best_val_loss:.4f}")
        if eval_times[0]['train_loss'] is not None : # Check if train_loss was recorded
             current_tqdm_write(f"Final Training Loss: {eval_times[-1]['train_loss']:.4f} (at iter {eval_times[-1]['iter']})")

        if tabulate:
            header = ["Iteration", "Train Loss", "Val Loss", "Cumulative Time (s)"]
            table_data = []
            for record in eval_times:
                table_data.append([
                    record['iter'],
                    f"{record['train_loss']:.4f}" if record['train_loss'] is not None else 'N/A',
                    f"{record['val_loss']:.4f}" if record['val_loss'] is not None else 'N/A',
                    f"{record['time_s']:.1f}s"
                ])
            current_tqdm_write(tabulate(table_data, headers=header, tablefmt="grid")) # Corrected call to tabulate
        else:
            current_tqdm_write("[INFO] Evaluation history (install tabulate for a formatted table):")
            for record in eval_times:
                current_tqdm_write(f"  Iter {record['iter']}: Train Loss: {record['train_loss']:.4f if record['train_loss'] is not None else 'N/A'}, Val Loss: {record['val_loss']:.4f if record['val_loss'] is not None else 'N/A'}, Time: {record['time_s']:.1f}s")
    else:
        current_tqdm_write("[INFO] No evaluation steps were performed or recorded.")

    # --- Text Generation (if enabled) ---
    if args.generate_after_training > 0:
        current_tqdm_write(f"[INFO] Generating {args.generate_after_training} tokens with temperature {args.generate_temperature}, top_k {args.generate_top_k}...")
        
        # Define start_context for generation
        start_context = args.generate_start_context if args.generate_start_context else "\n" # Default to newline if not provided
        
        # Ensure stoi and itos are available (should be from data loading or checkpoint)
        if 'stoi' not in locals() or 'itos' not in locals():
            current_tqdm_write("[ERROR] Vocabulary (stoi/itos) not available for generation. Skipping.")
        else:
            try:
                start_ids = encode(start_context) if start_context else [stoi.get('\n', 0)]
                context_tensor = (torch.tensor(start_ids, dtype=torch.long, device=resolved_device)[None, ...])
                current_tqdm_write("--- Generated Text ---")
                generated_tokens = model.generate(context_tensor, max_new_tokens=args.generate_after_training, temperature=args.generate_temperature, top_k=args.generate_top_k)
                generated_text = decode(generated_tokens[0].tolist(), itos)
                current_tqdm_write(generated_text)
                current_tqdm_write("--- End of Generated Text ---")
            except Exception as e:
                current_tqdm_write(f"[ERROR] Text generation failed: {e}")

    if log_fh:
        current_tqdm_write(f"[INFO] Full log saved to: {log_file_path}")
        log_fh.close()
    
    close_sqlite_connection() # Close SQLite connection at the end
    # --- Export SQLite Report ---
    export_sqlite_report_to_csv(db_path, args.reports_dir, _run_id_for_this_session)
    current_tqdm_write("Training process ended successfully.")

# --- Visual Output Helper Integration ---
def current_tqdm_write(msg):
    if '[ERROR]' in str(msg):
        verror(msg)
    elif '[WARNING]' in str(msg):
        vwarn(msg)
    elif '[INFO]' in str(msg):
        vinfo(msg)
    else:
        print(str(msg))

if __name__ == '__main__':
    main()
