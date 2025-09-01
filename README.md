# HomiesUnlocked

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/itzMRZ/HomiesUnlocked?utm_source=oss&utm_medium=github&utm_campaign=itzMRZ%2FHomiesUnlocked&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

## Overview
HomiesUnlocked is a web application that combines multiple users' class routines into a single, comprehensive schedule. It allows users to quickly see overlapping schedules and coordinate with friends.

## Features
- Combine up to 16 different user routines
- Color-coded schedules for easy identification
- Three visual themes (Dark, Light, and Pink)
- Screenshot functionality to save and share routines
- Local storage for saving progress
- Mobile-responsive design

## Demo
Visit the [live application](https://homies-unlocked.itzmrz.xyz) to try it out.

## How to Use
1. Each user needs to get their own routine ID:
   - Visit [Routine ID Generator](https://routine-id.itzmrz.xyz)
   - Create your routine as you would on PrePreReg
   - Copy your routine ID when finished
2. On HomiesUnlocked:
   - Enter each person's name and their routine ID
   - Add more users with the "+ Add 1 More" button (mobile) or "+ Add 2 More Users" button (desktop)
   - Click "Generate Routine" to create the combined schedule
   - Use the "Capture Routine" button to save a screenshot of the schedule

## Project Structure
```
HomiesUnlocked/
├── index.html              # Main HTML file
├── src/
│   ├── js/                 # JavaScript modules
│   │   ├── main.js         # Entry point
│   │   ├── userInputManager.js   # Manages user input cards
│   │   ├── routineManager.js     # Handles routine generation
│   │   ├── themeSwitcher.js      # Theme functionality
│   │   └── uiManager.js    # UI interactions and effects
│   ├── css/
│   │   └── styles.css      # Main stylesheet
│   └── assets/             # Images and static assets
├── favicon.ico             # Website favicon
├── LICENSE                 # MIT License
├── README.md               # This file
└── CONTRIBUTING.md         # Contribution guidelines
```

## Development

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Basic understanding of HTML, CSS, and JavaScript

### Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/itzMRZ/HomiesUnlocked.git
   ```
2. Open `index.html` in your browser or use a local development server.


## Technologies Used
- HTML5
- CSS3
- JavaScript (ES6+)
- TailwindCSS (via CDN)
- HTML2Canvas (for screenshots)
- Bootstrap Icons (via CDN)
- Local Storage API

## Acknowledgements
This project was made possible thanks to:
- [Tashfeen Vaia (Eniamza)](https://github.com/Eniamza) - for the CDN
- [Moon](https://github.com/mahathirmoon) - for squashing some bugs 

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Contact
For any questions or inquiries, please contact the repository owner [itzMRZ](https://itzmrz.xyz).
