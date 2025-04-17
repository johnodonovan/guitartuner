import os
import sys

# Define the project root
project_root = os.getcwd()  # Use current directory

# Create directory structure
os.makedirs(f"{project_root}/static/css", exist_ok=True)
os.makedirs(f"{project_root}/static/js", exist_ok=True)
os.makedirs(f"{project_root}/static/audio", exist_ok=True)
os.makedirs(f"{project_root}/templates", exist_ok=True)

# Define file contents
app_py = '''
from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    guitar_strings = [
        {"name": "E (low/6th string)", "note": "E2", "frequency": "82.41 Hz"},
        {"name": "A (5th string)", "note": "A2", "frequency": "110 Hz"},
        {"name": "D (4th string)", "note": "D3", "frequency": "146.83 Hz"},
        {"name": "G (3rd string)", "note": "G3", "frequency": "196 Hz"},
        {"name": "B (2nd string)", "note": "B3", "frequency": "246.94 Hz"},
        {"name": "E (high/1st string)", "note": "E4", "frequency": "329.63 Hz"}
    ]
    return render_template('index.html', guitar_strings=guitar_strings)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
'''

index_html = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Guitar Tuner</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}">
</head>
<body>
    <div class="container">
        <h1>Acoustic Guitar Tuner</h1>
        <p>Click on a string button to hear the reference note</p>
        
        <div class="guitar">
            <div class="guitar-neck">
                {% for string in guitar_strings|reverse %}
                <div class="string-container">
                    <div class="string-info">
                        <span>{{ string.name }}</span>
                        <span class="frequency">{{ string.frequency }}</span>
                    </div>
                    <div class="string"></div>
                    <button class="tune-button" data-note="{{ string.note }}">
                        Play {{ string.note }}
                    </button>
                </div>
                {% endfor %}
            </div>
        </div>
        
        <div class="controls">
            <button id="stop-button">Stop Sound</button>
        </div>
    </div>
    
    <script src="{{ url_for('static', filename='js/tuner.js') }}"></script>
</body>
</html>
'''

style_css = '''
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    background-color: #f5f5f5;
    color: #333;
    line-height: 1.6;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    text-align: center;
}

h1 {
    margin-bottom: 20px;
    color: #2c3e50;
}

.guitar {
    background-color: #d35400;
    border-radius: 5px;
    padding: 20px;
    margin: 30px 0;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.guitar-neck {
    background-color: #e67e22;
    border-radius: 5px;
    padding: 15px;
}

.string-container {
    display: flex;
    align-items: center;
    margin: 15px 0;
}

.string-container.active .string {
    background-color: #3498db;
    height: 3px;
    box-shadow: 0 0 10px #3498db;
}

.string-info {
    width: 150px;
    text-align: right;
    padding-right: 15px;
    font-weight: bold;
}

.frequency {
    display: block;
    font-size: 0.8em;
    color: #555;
    font-weight: normal;
}

.string {
    flex-grow: 1;
    height: 2px;
    background-color: #7f8c8d;
    margin: 0 15px;
    transition: all 0.3s;
}

.tune-button {
    padding: 8px 15px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.tune-button:hover {
    background-color: #2980b9;
}

.controls {
    margin-top: 20px;
}

#stop-button {
    padding: 10px 20px;
    background-color: #e74c3c;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
}

#stop-button:hover {
    background-color: #c0392b;
}
'''

tuner_js = '''
document.addEventListener('DOMContentLoaded', function() {
    let currentAudio = null;
    
    // Audio context for Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Guitar string frequencies
    const frequencies = {
        'E2': 82.41,  // Low E (6th string)
        'A2': 110.00, // A (5th string)
        'D3': 146.83, // D (4th string)
        'G3': 196.00, // G (3rd string)
        'B3': 246.94, // B (2nd string)
        'E4': 329.63  // High E (1st string)
    };
    
    // Function to generate a tone
    function playTone(frequency) {
        // Stop any currently playing tone
        if (currentAudio && currentAudio.oscillator) {
            currentAudio.oscillator.stop();
            currentAudio.gain.disconnect();
        }
        
        // Create oscillator
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Configure oscillator
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        
        // Apply gain for smooth fade-out
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.8, audioContext.currentTime + 0.1);
        
        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Start oscillator
        oscillator.start();
        
        // Store reference to current audio
        currentAudio = {
            oscillator: oscillator,
            gain: gainNode
        };
    }
    
    // Function to stop the tone with a nice fade out
    function stopTone() {
        if (currentAudio && currentAudio.oscillator) {
            // Fade out
            currentAudio.gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
            
            // Stop after fade out
            setTimeout(() => {
                currentAudio.oscillator.stop();
                currentAudio.gain.disconnect();
                currentAudio = null;
            }, 100);
        }
    }
    
    // Get all tune buttons
    const tuneButtons = document.querySelectorAll('.tune-button');
    
    // Add click event listeners to each button
    tuneButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get the note to play
            const note = this.getAttribute('data-note');
            const frequency = frequencies[note];
            
            // Play the tone
            playTone(frequency);
            
            // Highlight the active string
            document.querySelectorAll('.string-container').forEach(container => {
                container.classList.remove('active');
            });
            this.closest('.string-container').classList.add('active');
        });
    });
    
    // Stop button functionality
    const stopButton = document.getElementById('stop-button');
    stopButton.addEventListener('click', function() {
        stopTone();
        
        // Remove active class from all strings
        document.querySelectorAll('.string-container').forEach(container => {
            container.classList.remove('active');
        });
    });
});
'''

# Write files
with open(f"{project_root}/app.py", "w") as f:
    f.write(app_py.strip())
    
with open(f"{project_root}/templates/index.html", "w") as f:
    f.write(index_html.strip())
    
with open(f"{project_root}/static/css/style.css", "w") as f:
    f.write(style_css.strip())
    
with open(f"{project_root}/static/js/tuner.js", "w") as f:
    f.write(tuner_js.strip())

print("Guitar Tuner project has been set up successfully!")
print(f"Project directory: {project_root}")
print("To run the app:")
print("1. Install Flask: pip install flask")
print("2. Run: python app.py")
print("3. Open browser at: http://127.0.0.1:5000/") 