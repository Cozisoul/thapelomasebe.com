# TMM-OS — Dither Cam (v3.0)

A creative web application that combines real-time video dithering with Conway's Game of Life simulation. Features 6 distinct themes with proper color inversion and cellular automata integration.

## 🎨 Features

- **Real-time Video Dithering**: Floyd-Steinberg dithering algorithm applied to webcam feed
- **Conway's Game of Life**: Cellular automata simulation with live seeding from dithered video
- **6 Themed Color Palettes**: Cosmic, Systematic, and Cyan themes with light/dark variants
- **Color Inversion**: Proper color flipping for dark themes
- **Media Recording**: Capture screenshots and record video
- **Responsive Design**: Modern UI with mobile support

## 🎯 Themes

### Cosmic Themes
- **Cosmic Light**: Black on cream cosmic latte (#FFF8e7)
- **Cosmic Dark**: Cream cosmic latte on black (inverted)

### Systematic Themes  
- **Systematic Light**: Red on dark blue (#001f3f)
- **Systematic Dark**: Dark blue on red (inverted)

### Cyan Themes
- **Cyan Light**: Blue on cyan
- **Cyan Dark**: Cyan on blue (inverted)

## ⚙️ Technology Stack

- **p5.js** - Creative coding and canvas manipulation
- **Floyd-Steinberg Dithering** - Image processing algorithm
- **Conway's Game of Life** - Cellular automata simulation
- **CSS3** - Custom properties for theming
- **Vanilla JavaScript** - Interactivity and controls
- **MediaRecorder API** - Video capture functionality

## 🚀 Usage

1. Open `index.html` in a modern web browser
2. Allow camera access when prompted
3. Use the controls to:
   - Adjust detail level and pixel size
   - Toggle Game of Life on/off
   - Switch between continuous and lock seed modes
   - Cycle through themes
   - Capture screenshots or record video
   - View project information

## 👨‍🎨 Creator

**Thapelo Madiba Masebe**

Strategic & Creative Operating System (TMM-OS)  
Version 2.0 | Status: ACTIVE

The Strategic & Creative Operating System serves as the central, version-controlled operating system for Thapelo's entire professional and personal practice. It's a living document, strategic roadmap, and foundational data layer for all current and future projects.

### Links
- [TMM-OS Repository](https://github.com/Cozisoul/tmm-os)
- [GitHub Profile](https://github.com/Cozisoul)

## 📁 Project Structure

```
game-of-life-dith/
├── index.html          # Main HTML structure
├── sketch.js           # Primary p5.js application logic
├── dither.js           # Dithering effect implementation
├── gol.js              # Game of Life implementation
├── theme.js            # Theme management system
├── styles.css          # Styling and responsive design
├── scripts/
│   └── ui.js           # UI binding utilities
└── README.md           # This file
```

## 🎨 Color Palette

The project uses only 6 colors throughout:

1. **#FFF8e7** - Cosmic latte (replaces white)
2. **#000000** - Black
3. **#D32F2F** - Red
4. **#001f3f** - Dark blue
5. **#00FFFF** - Cyan
6. **#0000FF** - Blue

## 🔧 Development

To run locally:
```bash
# Start a local server
python -m http.server 8000
# or
npx serve .
```

Then open `http://localhost:8000` in your browser.

## 📄 License

This project is part of the TMM-OS (Thapelo Madiba Masebe Operating System) and follows the strategic framework outlined in the [TMM-OS repository](https://github.com/Cozisoul/tmm-os).

---

*Part of the Strategic & Creative Operating System for Thapelo Madiba Masebe*