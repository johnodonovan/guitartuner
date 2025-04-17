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
    app.run(host='0.0.0.0', port=5001, debug=True)