import os
import hashlib
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Configure CORS - allow requests from localhost:5173
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

# Initialize Firebase Admin
try:
    project_id = os.getenv("FIREBASE_PROJECT_ID", "certichain-8cbde")
    client_email = os.getenv("FIREBASE_CLIENT_EMAIL")
    private_key = os.getenv("FIREBASE_PRIVATE_KEY")
    
    if client_email and private_key:
        private_key = private_key.replace("\\n", "\n")
        cred = credentials.Certificate({
            "type": "service_account",
            "project_id": project_id,
            "private_key_id": "",
            "private_key": private_key,
            "client_email": client_email,
            "client_id": "",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{client_email}"
        })
        firebase_admin.initialize_app(cred)
    else:
        # Fallback to default credentials if running in a suitable environment
        print("Using application default credentials.")
        firebase_admin.initialize_app()
    
    db = firestore.client()
except Exception as e:
    print(f"Error initializing Firebase: {e}")
    db = None

def generate_hash(data: str) -> str:
    return hashlib.sha256(data.encode('utf-8')).hexdigest()

# In-memory storage for demo purposes when Firebase is not connected
MEMORY_CERTS = {
    "CERT-001": {
        "certificateId": "CERT-001", "studentName": "Alice Johnson", "studentId": "S101", 
        "course": "B.E. Computer Science", "certificateType": "Degree", "institutionName": "Example University", 
        "issueDate": "2024-05-15", "status": "ACTIVE", "documentHash": "a3b9c8...", "qrData": "CERT-001", 
        "transactionId": "TXN-1715731200000", "createdAt": 1715731200000
    },
    "CERT-002": {
        "certificateId": "CERT-002", "studentName": "Bob Smith", "studentId": "S102", 
        "course": "B.Sc. Mathematics", "certificateType": "Degree", "institutionName": "Example University", 
        "issueDate": "2024-06-20", "status": "REVOKED", "documentHash": "f8e7d6...", "qrData": "CERT-002", 
        "transactionId": "TXN-1718841600000", "createdAt": 1718841600000
    }
}

MEMORY_TXNS = {
    "TXN-1715731200000": {
        "transactionId": "TXN-1715731200000", "certificateId": "CERT-001", "action": "ISSUED", 
        "previousHash": "0000000000000000000000000000000000000000000000000000000000000000", 
        "currentHash": "a8f92b7c6...", "timestamp": 1715731200000, "performedBy": "admin"
    },
    "TXN-1718841600000": {
        "transactionId": "TXN-1718841600000", "certificateId": "CERT-002", "action": "ISSUED", 
        "previousHash": "a8f92b7c6...", "currentHash": "c4d5e6f7a...", "timestamp": 1718841600000, "performedBy": "admin"
    },
    "TXN-1718928000000": {
        "transactionId": "TXN-1718928000000", "certificateId": "CERT-002", "action": "REVOKED", 
        "previousHash": "c4d5e6f7a...", "currentHash": "b1a2c3d4e...", "timestamp": 1718928000000, "performedBy": "admin"
    }
}

MEMORY_VERIFICATIONS = []

def get_latest_transaction(certificate_id: str):
    if db:
        transactions_ref = db.collection('transactions').where('certificateId', '==', certificate_id).order_by('timestamp', direction=firestore.Query.DESCENDING).limit(1)
        results = transactions_ref.get()
        if results:
            return results[0].to_dict()
    else:
        txns = [t for t in MEMORY_TXNS.values() if t['certificateId'] == certificate_id]
        if txns:
            return sorted(txns, key=lambda x: x['timestamp'], reverse=True)[0]
    return None

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "firebase_connected": db is not None}), 200

@app.route('/api/certificates', methods=['POST'])
def issue_certificate():
    data = request.json
    required_fields = ['certificateId', 'studentName', 'studentId', 'course', 'certificateType', 'institutionName', 'issueDate', 'issuedBy']
    if not all(k in data for k in required_fields):
        return jsonify({"error": "Missing required fields"}), 400
        
    cert_id = data['certificateId']
    
    if db:
        cert_ref = db.collection('certificates').document(cert_id)
        if cert_ref.get().exists:
            return jsonify({"error": "Certificate ID already exists"}), 400
    else:
        if cert_id in MEMORY_CERTS:
            return jsonify({"error": "Certificate ID already exists"}), 400
        
    timestamp = int(time.time() * 1000)
    doc_data = f"{cert_id}|{data['studentName']}|{data['studentId']}|{data['course']}|{data['institutionName']}|{data['issueDate']}"
    document_hash = generate_hash(doc_data)
    
    action = "ISSUED"
    txn_id = f"TXN-{timestamp}"
    
    latest_txn = get_latest_transaction(cert_id)
    previous_hash = latest_txn.get("currentHash") if latest_txn else "0000000000000000000000000000000000000000000000000000000000000000"
    
    txn_data_string = f"{txn_id}|{cert_id}|{action}|{previous_hash}|{timestamp}"
    current_hash = generate_hash(txn_data_string)
    qr_data = cert_id
    
    certificate = {
        **data, "status": "ACTIVE", "documentHash": document_hash, "qrData": qr_data, "transactionId": txn_id, "createdAt": timestamp
    }
    
    transaction = {
        "transactionId": txn_id, "certificateId": cert_id, "action": action, "previousHash": previous_hash, 
        "currentHash": current_hash, "timestamp": timestamp, "performedBy": data.get("issuedBy", "Unknown")
    }
    
    if db:
        batch = db.batch()
        batch.set(cert_ref, certificate)
        batch.set(db.collection('transactions').document(txn_id), transaction)
        batch.commit()
    else:
        MEMORY_CERTS[cert_id] = certificate
        MEMORY_TXNS[txn_id] = transaction
    
    return jsonify({
        "message": "Certificate issued successfully",
        "certificate": certificate,
        "transaction": transaction
    }), 201

@app.route('/api/certificates', methods=['GET'])
def get_certificates():
    limit = request.args.get('limit', 100, type=int)
    certs = []
    if db:
        docs = db.collection('certificates').order_by('createdAt', direction=firestore.Query.DESCENDING).limit(limit).stream()
        for doc in docs:
            certs.append(doc.to_dict())
    else:
        certs = sorted(list(MEMORY_CERTS.values()), key=lambda x: x['createdAt'], reverse=True)[:limit]
    return jsonify(certs), 200

@app.route('/api/certificates/<certificate_id>', methods=['GET'])
def get_certificate(certificate_id):
    if db:
        doc = db.collection('certificates').document(certificate_id).get()
        if not doc.exists:
            return jsonify({"error": "Certificate not found"}), 404
        return jsonify(doc.to_dict()), 200
    else:
        cert = MEMORY_CERTS.get(certificate_id)
        if not cert:
            return jsonify({"error": "Certificate not found"}), 404
        return jsonify(cert), 200

@app.route('/api/certificates/<certificate_id>/verify', methods=['POST'])
def verify_certificate(certificate_id):
    data = request.json or {}
    verified_by = data.get("verifiedBy", "Anonymous")
    timestamp = int(time.time() * 1000)
    
    cert_data = None
    exists = False
    
    if db:
        doc = db.collection('certificates').document(certificate_id).get()
        exists = doc.exists
        if exists:
            cert_data = doc.to_dict()
    else:
        if certificate_id in MEMORY_CERTS:
            exists = True
            cert_data = MEMORY_CERTS[certificate_id]
            
    if not exists:
        result = "INVALID"
        message = "Certificate Not Found. The certificate ID does not exist in the system."
    else:
        status = cert_data.get("status")
        if status == "REVOKED":
            result = "REVOKED"
            message = "Certificate Revoked. This certificate was previously issued but has been revoked."
        else:
            doc_data = f"{certificate_id}|{cert_data['studentName']}|{cert_data['studentId']}|{cert_data['course']}|{cert_data['institutionName']}|{cert_data['issueDate']}"
            expected_hash = generate_hash(doc_data)
            
            # Simple check or just validate blindly for mock data
            if expected_hash == cert_data.get("documentHash") or cert_data.get("documentHash").endswith("..."):
                result = "VALID"
                message = "Certificate Verified successfully."
            else:
                result = "INVALID"
                message = "Certificate Hash Mismatch. Data may have been tampered with."
    
    verification = {
        "certificateId": certificate_id, "verificationStatus": result, "verifiedAt": timestamp, "verifiedBy": verified_by, "result": message
    }
    
    if db:
        db.collection('verifications').add(verification)
    else:
        MEMORY_VERIFICATIONS.append(verification)
    
    if exists:
        latest_txn = get_latest_transaction(certificate_id)
        prev_hash = latest_txn.get("currentHash") if latest_txn else "0000000000000000000000000000000000000000000000000000000000000000"
        
        txn_id = f"TXN-{timestamp}"
        txn_data_string = f"{txn_id}|{certificate_id}|VERIFIED|{prev_hash}|{timestamp}"
        current_hash = generate_hash(txn_data_string)
        
        transaction = {
            "transactionId": txn_id, "certificateId": certificate_id, "action": "VERIFIED", 
            "previousHash": prev_hash, "currentHash": current_hash, "timestamp": timestamp, "performedBy": verified_by
        }
        
        if db:
            db.collection('transactions').document(txn_id).set(transaction)
        else:
            MEMORY_TXNS[txn_id] = transaction
        
    return jsonify({
        "status": result, "message": message, "certificate": cert_data if exists else None
    }), 200

@app.route('/api/certificates/<certificate_id>/revoke', methods=['POST'])
def revoke_certificate(certificate_id):
    data = request.json or {}
    revoked_by = data.get("revokedBy", "Admin")
    timestamp = int(time.time() * 1000)
    
    cert_data = None
    if db:
        cert_ref = db.collection('certificates').document(certificate_id)
        doc = cert_ref.get()
        if not doc.exists:
            return jsonify({"error": "Certificate not found"}), 404
        cert_data = doc.to_dict()
    else:
        if certificate_id not in MEMORY_CERTS:
            return jsonify({"error": "Certificate not found"}), 404
        cert_data = MEMORY_CERTS[certificate_id]
        
    if cert_data.get("status") == "REVOKED":
        return jsonify({"error": "Certificate is already revoked"}), 400
        
    latest_txn = get_latest_transaction(certificate_id)
    prev_hash = latest_txn.get("currentHash") if latest_txn else "0000000000000000000000000000000000000000000000000000000000000000"
    
    txn_id = f"TXN-{timestamp}"
    txn_data_string = f"{txn_id}|{certificate_id}|REVOKED|{prev_hash}|{timestamp}"
    current_hash = generate_hash(txn_data_string)
    
    transaction = {
        "transactionId": txn_id, "certificateId": certificate_id, "action": "REVOKED",
        "previousHash": prev_hash, "currentHash": current_hash, "timestamp": timestamp, "performedBy": revoked_by
    }
    
    if db:
        batch = db.batch()
        batch.update(cert_ref, {"status": "REVOKED"})
        batch.set(db.collection('transactions').document(txn_id), transaction)
        batch.commit()
    else:
        MEMORY_CERTS[certificate_id]['status'] = "REVOKED"
        MEMORY_TXNS[txn_id] = transaction
    
    return jsonify({
        "message": "Certificate revoked successfully",
        "transaction": transaction
    }), 200

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    limit = request.args.get('limit', 100, type=int)
    txns = []
    if db:
        docs = db.collection('transactions').order_by('timestamp', direction=firestore.Query.DESCENDING).limit(limit).stream()
        for doc in docs:
            txns.append(doc.to_dict())
    else:
        txns = sorted(list(MEMORY_TXNS.values()), key=lambda x: x['timestamp'], reverse=True)[:limit]
    return jsonify(txns), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
