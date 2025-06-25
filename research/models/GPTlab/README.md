# GPTransformer Language Model Training Suite

> **Modern, Hardware-Aware, and User-Friendly Training Pipeline for GPT-style Models**

![Python](https://img.shields.io/badge/Python-3.8%2B-blue)
![PyTorch](https://img.shields.io/badge/PyTorch-1.9%2B-orange)
![CUDA](https://img.shields.io/badge/CUDA-Supported-green)
![ROCm](https://img.shields.io/badge/ROCm-Supported-red)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

---

## Overview

**GPTlab** provides a robust, hardware-aware, and user-friendly pipeline for training, fine-tuning, evaluating, and generating text with GPT-style transformer models. It is designed for both research and practical applications, with a focus on ease of use, transparency, and reliability.

---

## Key Features

- **Intelligent Hardware Detection:** Scans your system for CPU, RAM, and GPU (NVIDIA CUDA, AMD ROCm/HIP) and suggests safe parameter ranges to avoid out-of-memory errors.
- **Interactive CLI Setup:** Optional `--interactive` mode guides you through parameter selection with hardware-aware recommendations.
- **Flexible Device Selection:** Train on CPU, specific NVIDIA/AMD GPUs, or let the system auto-select the best device.
- **Learning Rate Scheduling:** Supports warmup and cosine decay for stable training.
- **Comprehensive Logging:** Logs to both console and timestamped files in `.reports/`.
- **Progress Monitoring:** Clean progress bar with `tqdm` (optional).
- **Checkpointing & Resuming:** Automatic checkpointing, resume from any checkpoint, and best model tracking.
- **Text Generation:** Generate text samples from trained models.
- **Memory Estimation:** Estimates memory footprint before training and warns if settings are unsafe.
- **Evaluation Suite:** Evaluate models for loss, accuracy, and perplexity; generate evaluation reports.

---

## Installation

1. **Clone the repository:**
```powershell
git clone https://github.com/artifact-virtual/GPTlab.git
cd GPTlab
```

2. **Install dependencies:**
```powershell
pip install torch tqdm colorama psutil gputil tabulate
```
*Optional: For GPU support, install the appropriate CUDA/ROCm version of PyTorch.*

---

## Project Structure

```
GPTlab/
├── model.py                # Main training script
├── evaluation/
│   ├── evaluate.py         # Evaluation script
│   └── completed/          # Saved models and reports
├── pretrained/             # Checkpoints and logs
├── README.md               # This file
```

---

## Getting Started

### 1. Prepare Your Data
- Place your training `.txt` files in a folder (e.g., `datasets/ready/`).

### 2. Train a Model
**Basic usage:**
```powershell
python model.py --datasets_folder datasets/ready --output_dir pretrained/
```

**Interactive setup:**
```powershell
python model.py --interactive
```

**Common options:**
- `--block_size`: Sequence length (context window)
- `--n_embd`: Embedding size
- `--n_head`: Number of attention heads
- `--n_layer`: Number of transformer layers
- `--batch_size`: Training batch size
- `--max_iters`: Number of training iterations
- `--device`: `auto`, `cpu`, `cuda:0`, `hip:0`, etc.
- `--resume_from`: Path to a checkpoint to resume training

**Example:**
```powershell
python model.py --datasets_folder datasets/ready --output_dir pretrained/ --block_size 256 --n_embd 384 --n_head 6 --n_layer 6 --batch_size 32 --max_iters 5000
```

### 3. Monitor Training
- Progress and metrics are shown in the console and saved to `.reports/` and `pretrained/training_logs.sqlite`.
- Checkpoints are saved in `pretrained/`.

### 4. Generate Text
After training, generate text samples:
```powershell
python model.py --output_dir pretrained/ --generate_after_training 200 --generate_start_context "Once upon a time"
```

---

## Evaluation

Evaluate a trained model on new data:
```powershell
python evaluation/evaluate.py --model pretrained/model-latest.pt --datasets-folder datasets/ready --metrics loss accuracy perplexity --batch-size 64 --block-size 256 --device cuda
```

- Generates a markdown report in `evaluation/completed/`.
- Supports interactive mode if run without arguments.

---

## Checkpointing & Resuming
- Checkpoints are saved every N iterations (configurable).
- Resume training with `--resume_from pretrained/checkpoint_iter_XXXX.pt`.
- Best model is always preserved.

---

## Best Practices
- Use the interactive CLI for first-time setup to get hardware-aware recommendations.
- Monitor memory warnings and adjust parameters if needed.
- Regularly evaluate your model and review generated text for quality.
- Use checkpoints to avoid losing progress.
- Tune hyperparameters (block size, n_embd, n_head, n_layer, batch size) for your hardware and dataset size.

---

## Example Workflow

1. **Prepare Data:** Place `.txt` files in `datasets/ready/`.
2. **Train:**
   ```powershell
   python model.py --datasets_folder datasets/ready --output_dir pretrained/ --max_iters 3000
   ```
3. **Generate Text:**
   ```powershell
   python model.py --output_dir pretrained/ --generate_after_training 100 --generate_start_context "The future of AI is"
   ```
4. **Evaluate:**
   ```powershell
   python evaluation/evaluate.py --model pretrained/model-latest.pt --datasets-folder datasets/ready --metrics loss accuracy perplexity
   ```

---

## Advanced Features
- **Hardware-aware parameter suggestions**
- **Automatic memory estimation and warnings**
- **Comprehensive logging and SQLite metric tracking**
- **Flexible checkpoint management**
- **Interactive and non-interactive modes**
- **Support for both NVIDIA CUDA and AMD ROCm/HIP GPUs**

---

## License
MIT License

---

## Acknowledgements
- Built with PyTorch, tqdm, colorama, psutil, tabulate, and gputil.
- Inspired by open-source GPT research and the PyTorch community.

---

For questions or contributions, see [CONTRIBUTING.md] or open an issue.
