# Guitar Tuner Web App

A web-based guitar tuner that helps you tune a 6-string acoustic guitar. This application provides two main features:

1. **Reference Mode**: Plays reference tones for each guitar string
2. **Tuner Mode**: Uses your device's microphone to analyze the pitch of your guitar string and provide visual feedback for tuning

## Features

- Clean, intuitive interface
- Reference tones for all six strings of a standard guitar (E2, A2, D3, G3, B3, E4)
- Real-time pitch detection using the Web Audio API
- Visual tuning gauge showing how far your string is from the correct pitch
- Color-coded feedback (red, yellow, green) indicating tuning accuracy
- Audio waveform visualization
- Detailed troubleshooting panel

## Technologies Used

- Python / Flask (backend)
- HTML5 / CSS3
- JavaScript (Web Audio API)
- Autocorrelation algorithm for pitch detection

## How to Use

### Reference Mode

1. Click on a string button to hear the reference tone
2. Tune your guitar string to match the tone
3. Click "Stop Sound" to stop the tone

### Tuner Mode

1. Allow microphone access when prompted
2. Play a note on your guitar
3. The tuner will show:
   - The detected note
   - How many cents you are away from perfect tuning
   - A needle that shows whether you're flat (left) or sharp (right)
4. Adjust your tuning pegs until the needle is centered and green

## Installation

To run the app locally:

1. Clone this repository
2. Install Flask: `pip install flask`
3. Run the application: `python app.py`
4. Open your browser and navigate to `http://127.0.0.1:5001/`

## License

MIT License

## Author

John O'Donovan 