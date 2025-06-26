from flask import Flask, jsonify, request

app = Flask(__name__)

# Sample data to simulate quantum backend responses
quantum_jobs = {}

@app.route('/quantum/jobs', methods=['POST'])
def create_job():
    job_data = request.json
    job_id = len(quantum_jobs) + 1
    quantum_jobs[job_id] = job_data
    return jsonify({"job_id": job_id}), 201

@app.route('/quantum/jobs/<int:job_id>', methods=['GET'])
def get_job(job_id):
    job = quantum_jobs.get(job_id)
    if job is None:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(job)

@app.route('/quantum/jobs', methods=['GET'])
def list_jobs():
    return jsonify(quantum_jobs)

if __name__ == '__main__':
    app.run(debug=True)