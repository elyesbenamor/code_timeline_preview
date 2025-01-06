# Code Timeline Preview

A modern, interactive code visualization tool that helps developers understand and analyze code structure and complexity over time.

## Live Demo

Try out the live demo at: [codevi.netlify.app](https://codevi.netlify.app/)

<img src='./public/thumbnail.png' alt='Thumbnail' height=500/>

## Features

### Core Visualization
- **Interactive Timeline**: Visualize code structure with an intuitive timeline interface
- **Syntax Highlighting**: Clear color-coding for different code elements:
  - Keywords (Deep Red)
  - Classes (Rich Green)
  - Functions (Deep Purple)
  - Variables (Rich Blue)
  - Operators (Warm Orange)
  - Strings (Ocean Blue)
  - Numbers (Ruby Red)
  - Comments (Neutral Gray)
  - Decorators (Bright Orange)

### Code Analysis
- **Complexity Visualization**: Toggle between syntax highlighting and complexity view
- **Complexity Metrics**:
  - Low Complexity (Green): Simple, straightforward code
  - Medium Complexity (Yellow): Moderate control flow and nesting
  - High Complexity (Red): Complex logic and deep nesting
- **Code Structure Analysis**: Automatic analysis of:
  - Control flow statements
  - Nesting levels
  - Logical operators
  - Dependencies

### Navigation & Controls
- **Search Functionality**: Filter code segments based on text search
- **Filter Dialog**: Show/hide specific code types:
  - Keywords
  - Classes
  - Functions
  - Variables
  - Operators
  - Strings
  - Numbers
  - Comments
- **Zoom Controls**: Adjust timeline view scale
- **Mini-map Navigation**: Quick navigation through large codebases with visual preview
- **Scrolling**: Smooth scrolling with proper viewport management

### UI Features
- **Dark/Light Mode**: Optimized color schemes for both themes
- **Responsive Layout**: Adapts to different screen sizes
- **Interactive Tooltips**: Detailed information on hover
- **Modern Design**:
  - Clean, minimalist interface
  - Subtle shadows and transitions
  - Professional color palette
  - High contrast for readability

### Editor Integration
- **Code Input**: Built-in code editor with syntax highlighting
- **Real-time Updates**: Immediate visualization of code changes
- **Error Handling**: Validation and error reporting for code input

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/code_timeline_preview.git
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Input Code**: Paste your code in the left editor panel
2. **Explore Visualization**: 
   - Use the timeline view on the right
   - Toggle between syntax and complexity views
   - Use search and filters to focus on specific code elements
3. **Navigate**: 
   - Use the mini-map for quick navigation
   - Zoom in/out to adjust detail level
   - Scroll through longer code files

## 🐳 Docker Setup

You can run the application using Docker. Here's how:

### Prerequisites

- Docker installed on your machine
- Docker Compose (optional, for development)

### Building the Docker Image

```bash
# Build the image
docker build -t code-timeline . --load 
```

### Running the Container

```bash
# Run the container
docker run -p 3000:3000 code-timeline
```

The application will be available at `http://localhost:3000`

### Development with Docker

For development, you can use volume mounts to reflect changes immediately:

```bash
docker run -p 3000:3000 -v $(pwd):/app code-timeline npm run dev
```

### Docker Commands Reference

```bash
# Stop the container
docker stop <container_id>

# Remove the container
docker rm <container_id>

# List running containers
docker ps

# View container logs
docker logs <container_id>

# Rebuild the image after changes
docker build -t code-timeline . --load
```

### Troubleshooting

If you encounter any issues:

1. Make sure ports are not in use:
   ```bash
   lsof -i :3000
   ```

2. Clean up Docker resources:
   ```bash
   docker system prune
   ```

3. Check container logs:
   ```bash
   docker logs <container_id>
   ```

## Technologies

- **Frontend**: Next.js, React
- **Styling**: Tailwind CSS
- **Code Editor**: Ace Editor
- **Icons**: Lucide React

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.