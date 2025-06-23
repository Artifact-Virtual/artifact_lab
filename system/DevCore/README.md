# DEVELOPMENT CORE - README

## Overview

The Development Core project is a modular framework designed for efficient codebase management and visualization. It integrates various components to monitor, index, and visualize code, ensuring developers have the tools they need to maintain and understand their projects effectively.

## Features

- **Core Module**: Centralized management of application components.
- **File Watching**: Monitors file system changes and triggers events.
- **Indexing**: Builds and maintains an index of files and their dependencies.
- **Visualization**: Provides visual representations of the codebase, including metrics and performance data.
- **Configuration Management**: Loads and manages configuration settings from various sources.
- **Logging**: Offers logging functionalities with different log levels and outputs.

## Project Structure

```
development-core
├── src
│   ├── core
│   ├── components
│   └── utils
├── config
├── tests
├── docs
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- TypeScript (version 4 or higher)

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd development-core
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

### Running the Application

To start the application, use the following command:

```bash
npm start
```

Run Instructions

1. Make sure Ollama is running (ollama run codellama)


2. Run DevCore:
3. 
python run.py

1. Input your task:

What should I build? > Create a CLI that fetches weather for a city


### Running Tests

To run the tests, execute:

```bash
npm test
```

## Python CLI Usage

The DevCore CLI provides an interactive interface for building and testing code projects using AI agents.

### Prerequisites
- Python 3.8+
- Required Python packages (see `requirements.txt`)
- Ollama running (e.g., `ollama run codellama`)

### Running the CLI

From the project root, run:

```bash
python DevCore/run.py
```

You will see:

```
DevCore CLI is ready.
What should I build? >
```

Type your project/task description and press Enter. The CLI will:
- Plan a file structure for your project
- Generate code for each file
- Run tests on the generated code
- Attempt to fix issues automatically if tests fail

### Available Commands (Pipeline Steps)

The CLI currently supports the following pipeline steps:

- **ScaffolderAgent**: Plans the file structure for your project.
- **CodeGenAgent**: Generates code for each planned file.
- **TestAgent**: Compiles and tests the generated code.
- **AutoLoopAgent**: Attempts to fix code if tests fail (up to 5 retries).

All steps are run automatically for each task you enter.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.