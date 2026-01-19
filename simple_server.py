
import os
from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return "Hello from Railway! Server is UP."

@app.route('/api/internships')
def internships():
    return "Internships endpoint is reachable (Mock)."

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting simple server on port {port}")
    app.run(host='0.0.0.0', port=port)
