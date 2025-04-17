document.addEventListener('DOMContentLoaded', function() {
    let currentAudio = null;
    let audioContext = null;
    let analyser = null;
    let microphone = null;
    let isListening = false;
    let animationId = null;
    let micStream = null;
    let currentMode = 'reference'; // 'reference' or 'tuner'
    
    // Guitar string frequencies and notes
    const frequencies = {
        'E2': 82.41,  // Low E (6th string)
        'A2': 110.00, // A (5th string)
        'D3': 146.83, // D (4th string)
        'G3': 196.00, // G (3rd string)
        'B3': 246.94, // B (2nd string)
        'E4': 329.63  // High E (1st string)
    };

    // All note frequencies (extended range for pitch detection)
    const allNotes = {
        'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 
        'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
        'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 
        'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
        'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 
        'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88
    };
    
    // Reference to UI elements
    const referenceMode = document.getElementById('reference-mode');
    const tunerMode = document.getElementById('tuner-mode');
    const referenceModeBtn = document.getElementById('reference-mode-btn');
    const tunerModeBtn = document.getElementById('tuner-mode-btn');
    const startMicBtn = document.getElementById('start-mic-btn');
    const stopMicBtn = document.getElementById('stop-mic-btn');
    const detectedNote = document.querySelector('.detected-note');
    const detectedFreq = document.querySelector('.detected-freq');
    const gaugeNeedle = document.querySelector('.gauge-needle');
    const centValue = document.querySelector('.cent-value');
    const closestString = document.getElementById('closest-string');
    const targetNote = document.getElementById('target-note');
    const micStatusValue = document.getElementById('mic-status-value');
    const testAudioBtn = document.getElementById('test-audio-btn');
    const waveformCanvas = document.getElementById('waveform-canvas');
    const waveformCtx = waveformCanvas ? waveformCanvas.getContext('2d') : null;
    
    // Initialize Audio Context
    function initAudioContext() {
        if (!audioContext) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log("Audio context initialized successfully");
            } catch (e) {
                console.error("Failed to initialize audio context:", e);
                alert("Failed to initialize audio system. Please try using a different browser.");
            }
        }
        return audioContext;
    }
    
    // Function to generate a tone
    function playTone(frequency) {
        if (!initAudioContext()) return;
        
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
            try {
                currentAudio.gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
                
                // Stop after fade out
                setTimeout(() => {
                    currentAudio.oscillator.stop();
                    currentAudio.gain.disconnect();
                    currentAudio = null;
                }, 100);
            } catch (e) {
                console.error("Error stopping tone:", e);
                // Fallback if there was an error
                if (currentAudio.oscillator) {
                    try {
                        currentAudio.oscillator.stop();
                        currentAudio = null;
                    } catch (err) {
                        console.error("Failed to stop oscillator:", err);
                    }
                }
            }
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
    
    // Mode switching
    referenceModeBtn.addEventListener('click', () => switchMode('reference'));
    tunerModeBtn.addEventListener('click', () => switchMode('tuner'));
    
    // Microphone control
    startMicBtn.addEventListener('click', startMicrophone);
    stopMicBtn.addEventListener('click', stopMicrophone);
    
    // Test if microphone permissions are available
    function checkMicrophonePermission() {
        return navigator.permissions.query({ name: 'microphone' })
            .then(permissionStatus => {
                console.log('Microphone permission status:', permissionStatus.state);
                return permissionStatus.state;
            })
            .catch(error => {
                console.error('Error checking microphone permission:', error);
                return 'unknown';
            });
    }
    
    // Start microphone with improved error handling
    async function startMicrophone() {
        try {
            if (!initAudioContext()) return;
            
            // Update status
            micStatusValue.textContent = "Requesting permission...";
            
            // Resume audio context if it was suspended (required for some browsers)
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
                console.log("Audio context resumed");
            }
            
            console.log("Requesting microphone access...");
            
            // Get microphone access with detailed constraints
            const constraints = {
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            };
            
            micStream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log("Microphone access granted", micStream);
            
            // Update status
            micStatusValue.textContent = "Permission granted, initializing...";
            
            // Create analyser with better parameters for pitch detection
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 4096; // Larger FFT for better frequency resolution
            analyser.minDecibels = -100;
            analyser.maxDecibels = -10;
            analyser.smoothingTimeConstant = 0.85;
            
            // Create microphone source
            microphone = audioContext.createMediaStreamSource(micStream);
            microphone.connect(analyser);
            console.log("Microphone connected to analyser");
            
            // Update UI
            startMicBtn.disabled = true;
            stopMicBtn.disabled = false;
            isListening = true;
            micStatusValue.textContent = "Active - listening for sounds";
            
            // Start the pitch detection loop
            updatePitch();
            console.log("Pitch detection started");
            
            // Add debug info to the page
            detectedFreq.textContent = "Listening...";
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            
            // Update status
            micStatusValue.textContent = `Error: ${error.name}`;
            
            // Check for specific error types and provide better user feedback
            if (error.name === 'NotAllowedError') {
                alert('Microphone access denied. Please allow microphone access in your browser settings and try again.');
            } else if (error.name === 'NotFoundError') {
                alert('No microphone found. Please connect a microphone and try again.');
            } else if (error.name === 'NotReadableError') {
                alert('Microphone is being used by another application. Please close other applications that might be using the microphone.');
            } else {
                alert(`Error accessing microphone: ${error.message}. Please try using a different browser.`);
            }
            
            // Reset UI
            startMicBtn.disabled = false;
            stopMicBtn.disabled = true;
        }
    }
    
    // Stop microphone with improved cleanup
    function stopMicrophone() {
        console.log("Stopping microphone...");
        micStatusValue.textContent = "Stopped";
        
        // Clean up audio processing
        if (microphone) {
            microphone.disconnect();
            microphone = null;
            console.log("Microphone disconnected");
        }
        
        // Stop animation frame loop
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
            console.log("Animation loop stopped");
        }
        
        // Stop and release the media stream
        if (micStream) {
            micStream.getTracks().forEach(track => {
                track.stop();
                console.log("Media track stopped:", track.kind);
            });
            micStream = null;
        }
        
        isListening = false;
        startMicBtn.disabled = false;
        stopMicBtn.disabled = true;
        
        // Reset displays
        detectedNote.textContent = '--';
        detectedFreq.textContent = '0 Hz';
        centValue.textContent = '0 cents';
        closestString.textContent = '--';
        targetNote.textContent = '--';
        
        // Reset needle position
        gaugeNeedle.style.left = '50%';
        gaugeNeedle.style.backgroundColor = '#e74c3c';
    }
    
    // Improved autocorrelation pitch detection algorithm
    function autoCorrelate(buffer, sampleRate) {
        // Buffer size should be a power of 2
        const SIZE = buffer.length;
        const MAX_SAMPLES = Math.floor(SIZE / 2);
        let bestOffset = -1;
        let bestCorrelation = 0;
        let rms = 0;
        let foundGoodCorrelation = false;
        
        // Calculate RMS (Root Mean Square) to determine if there's enough signal
        for (let i = 0; i < SIZE; i++) {
            const val = buffer[i];
            rms += val * val;
        }
        rms = Math.sqrt(rms / SIZE);
        
        // Not enough signal - higher threshold for better noise rejection
        if (rms < 0.015) {
            console.log("Signal too weak, RMS:", rms);
            return -1;
        }
        
        // Find the best correlation
        let lastCorrelation = 1;
        for (let offset = 0; offset < MAX_SAMPLES; offset++) {
            let correlation = 0;
            
            for (let i = 0; i < MAX_SAMPLES; i++) {
                correlation += Math.abs(buffer[i] - buffer[i + offset]);
            }
            
            correlation = 1 - (correlation / MAX_SAMPLES);
            
            // Detect peak correlation
            if ((correlation > 0.9) && (correlation > lastCorrelation)) {
                foundGoodCorrelation = true;
                if (correlation > bestCorrelation) {
                    bestCorrelation = correlation;
                    bestOffset = offset;
                }
            } else if (foundGoodCorrelation) {
                // Short-circuit - we found a good correlation, then a bad one
                break;
            }
            
            lastCorrelation = correlation;
        }
        
        if (bestCorrelation > 0.01) {
            // Convert samples to Hz
            return sampleRate / bestOffset;
        }
        
        return -1;
    }
    
    // Find the closest note to a given frequency
    function findClosestNote(frequency) {
        let closestNote = null;
        let closestDistance = Infinity;
        let closestFreq = 0;
        
        for (const [note, freq] of Object.entries(allNotes)) {
            const distance = Math.abs(frequency - freq);
            if (distance < closestDistance) {
                closestNote = note;
                closestDistance = distance;
                closestFreq = freq;
            }
        }
        
        // Calculate the cents deviation (how sharp or flat the note is)
        const cents = Math.round(1200 * Math.log2(frequency / closestFreq));
        
        return { note: closestNote, frequency: closestFreq, cents };
    }
    
    // Find closest guitar string
    function findClosestString(frequency) {
        let closestString = null;
        let closestDistance = Infinity;
        
        for (const [note, freq] of Object.entries(frequencies)) {
            const distance = Math.abs(frequency - freq);
            if (distance < closestDistance) {
                closestString = note;
                closestDistance = distance;
            }
        }
        
        return closestString;
    }
    
    // Update the tuner display with the detected pitch
    function updateTunerDisplay(frequency) {
        if (frequency <= 0) {
            // Only update the display if we're not already showing empty values
            if (detectedNote.textContent !== '--') {
                detectedNote.textContent = '--';
                detectedFreq.textContent = 'Listening...';
                centValue.textContent = '0 cents';
                closestString.textContent = '--';
                targetNote.textContent = '--';
                gaugeNeedle.style.left = '50%';
            }
            return;
        }
        
        // Find closest note and deviation in cents
        const { note, cents } = findClosestNote(frequency);
        
        // Find closest guitar string
        const string = findClosestString(frequency);
        
        // Update the display
        detectedNote.textContent = note;
        detectedFreq.textContent = `${frequency.toFixed(2)} Hz`;
        centValue.textContent = `${cents} cents`;
        closestString.textContent = string;
        targetNote.textContent = string;
        
        // Update the gauge needle position (range: -50 to +50 cents)
        // Map -50 to +50 cents to 10% to 90% of gauge width
        const needlePosition = Math.max(10, Math.min(90, 50 + cents * 0.8));
        gaugeNeedle.style.left = `${needlePosition}%`;
        
        // Change needle color based on how close to perfect tuning
        if (Math.abs(cents) < 5) {
            gaugeNeedle.style.backgroundColor = '#2ecc71'; // Green for very close
        } else if (Math.abs(cents) < 15) {
            gaugeNeedle.style.backgroundColor = '#f1c40f'; // Yellow for close
        } else {
            gaugeNeedle.style.backgroundColor = '#e74c3c'; // Red for far
        }
    }
    
    // Main pitch detection loop with improved stability
    function updatePitch() {
        if (!isListening || !analyser) {
            return;
        }
        
        try {
            const bufferLength = analyser.fftSize;
            const buffer = new Float32Array(bufferLength);
            analyser.getFloatTimeDomainData(buffer);
            
            // Draw waveform if canvas exists
            if (waveformCtx) {
                drawWaveform(buffer);
            }
            
            const sampleRate = audioContext.sampleRate;
            const frequency = autoCorrelate(buffer, sampleRate);
            
            updateTunerDisplay(frequency);
            
            animationId = requestAnimationFrame(updatePitch);
        } catch (e) {
            console.error("Error in updatePitch:", e);
            micStatusValue.textContent = "Error: " + e.message;
            stopMicrophone();
            alert("An error occurred while analyzing audio. The microphone has been stopped.");
        }
    }
    
    // Draw audio waveform on canvas
    function drawWaveform(buffer) {
        const width = waveformCanvas.width;
        const height = waveformCanvas.height;
        const bufferLength = buffer.length;
        const sliceWidth = width / bufferLength;
        
        waveformCtx.clearRect(0, 0, width, height);
        waveformCtx.beginPath();
        waveformCtx.strokeStyle = '#3498db';
        waveformCtx.lineWidth = 2;
        
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            const v = buffer[i] * 0.5 + 0.5; // Normalize to [0,1]
            const y = height - (v * height);
            
            if (i === 0) {
                waveformCtx.moveTo(x, y);
            } else {
                waveformCtx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        waveformCtx.stroke();
        
        // Draw a center line
        waveformCtx.beginPath();
        waveformCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        waveformCtx.lineWidth = 1;
        waveformCtx.moveTo(0, height / 2);
        waveformCtx.lineTo(width, height / 2);
        waveformCtx.stroke();
    }
    
    // Test audio system function
    function testAudioSystem() {
        if (!initAudioContext()) return;
        
        try {
            micStatusValue.textContent = "Testing audio...";
            
            // Create a test tone
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1.0);
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 1.0);
            
            micStatusValue.textContent = "Audio test complete";
            
            // Reset status after a delay
            setTimeout(() => {
                if (!isListening) {
                    micStatusValue.textContent = "Not started";
                }
            }, 2000);
            
        } catch (e) {
            console.error("Audio test failed:", e);
            micStatusValue.textContent = "Audio test failed: " + e.message;
        }
    }
    
    // Add event listener for the test audio button
    if (testAudioBtn) {
        testAudioBtn.addEventListener('click', testAudioSystem);
    }
    
    // Check for microphone support when the app loads
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("getUserMedia is not supported in this browser");
        if (startMicBtn) startMicBtn.disabled = true;
        if (startMicBtn) startMicBtn.textContent = "Microphone Not Supported";
        if (micStatusValue) micStatusValue.textContent = "Not supported";
        if (detectedFreq) detectedFreq.textContent = "Your browser doesn't support microphone access.";
    }

    // Switch between reference and tuner modes
    function switchMode(mode) {
        currentMode = mode;
        updateUIForMode();
    }

    // Update UI based on the current mode
    function updateUIForMode() {
        if (currentMode === 'reference') {
            referenceMode.style.display = 'block';
            tunerMode.style.display = 'none';
            referenceModeBtn.classList.add('active');
            tunerModeBtn.classList.remove('active');
        } else {
            referenceMode.style.display = 'none';
            tunerMode.style.display = 'block';
            referenceModeBtn.classList.remove('active');
            tunerModeBtn.classList.add('active');
        }
    }
});