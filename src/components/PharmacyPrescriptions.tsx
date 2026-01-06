import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DataDisplay.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity?: string;
}

interface Prescription {
  id: string;
  patientName?: string;
  doctorName?: string;
  date: string;
  medications: Medication[];
  imageUrl?: string;
}

export default function PharmacyPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedMedications, setExtractedMedications] = useState<Medication[] | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a prescription image');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setExtractedMedications(null);

      // First, test if backend is reachable
      try {
        const testResponse = await axios.get(`${API_BASE_URL}/api/v1/pharmacy/test`, {
          timeout: 5000
        });
        console.log('Backend test:', testResponse.data);
      } catch (testErr) {
        console.error('Backend test failed:', testErr);
        setError('Backend server is not responding. Please make sure the backend is running on port 8000.');
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await axios.post(
        `${API_BASE_URL}/api/v1/pharmacy/scan-prescription`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 15000, // 15 seconds should be plenty
        }
      );

      const { medications, prescription_data } = response.data;
      
      if (medications && medications.length > 0) {
        setExtractedMedications(medications);
        
        // Add to prescriptions list
        const newPrescription: Prescription = {
          id: `PRES-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          medications: medications,
          ...prescription_data
        };
        
        setPrescriptions(prev => [newPrescription, ...prev]);
        
        // Reset form
        setSelectedFile(null);
        setPreviewUrl(null);
        setExtractedMedications(null);
        
        alert(`Successfully extracted ${medications.length} medication(s) from prescription!`);
      } else {
        setError('No medications found in the prescription. Please try a clearer image.');
      }
    } catch (err: any) {
      console.error('Error uploading prescription:', err);
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Processing timed out. Please try again with a clearer image.');
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError(err.message || 'Failed to process prescription image');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractedMedications(null);
    setError(null);
  };

  return (
    <div className="data-list">
      <h2>💊 Prescriptions</h2>

      {/* Upload Section */}
      <div className="prescription-upload-section">
        <div className="upload-card">
          <h3>📸 Scan Prescription</h3>
          <p>Upload a photo of your prescription to extract medication information</p>
          
          <div className="upload-area">
            {!previewUrl ? (
              <label className="upload-button">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <div className="upload-icon">📷</div>
                <div>Click to select prescription image</div>
                <div className="upload-hint">Supports: JPG, PNG, PDF (max 10MB)</div>
              </label>
            ) : (
              <div className="preview-container">
                <img src={previewUrl} alt="Prescription preview" className="preview-image" />
                <div className="preview-actions">
                  <button onClick={handleClear} className="btn-secondary" disabled={uploading}>
                    Remove
                  </button>
                  <button 
                    onClick={handleUpload} 
                    className="btn-primary" 
                    disabled={uploading || !selectedFile}
                  >
                    {uploading ? 'Processing...' : 'Extract Medications'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="error-message" style={{ 
              marginTop: '15px',
              padding: '12px',
              background: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '6px',
              color: '#856404'
            }}>
              ⚠️ {error}
            </div>
          )}

          {uploading && (
            <div className="loading-indicator" style={{ 
              marginTop: '15px',
              textAlign: 'center',
              color: '#1E88E5'
            }}>
              <div className="spinner"></div>
              <p>Processing prescription image with OCR...</p>
            </div>
          )}

          {extractedMedications && extractedMedications.length > 0 && (
            <div className="extracted-medications" style={{ marginTop: '20px' }}>
              <h4>✅ Extracted Medications:</h4>
              <div className="medications-list">
                {extractedMedications.map((med, index) => (
                  <div key={index} className="medication-item">
                    <strong>{med.name}</strong>
                    {med.dosage && <span> - {med.dosage}</span>}
                    {med.frequency && <span> - {med.frequency}</span>}
                    {med.duration && <span> - {med.duration}</span>}
                    {med.instructions && <div className="instructions">{med.instructions}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Prescriptions List */}
      {prescriptions.length > 0 && (
        <div className="prescriptions-list" style={{ marginTop: '30px' }}>
          <h3>Prescription History ({prescriptions.length})</h3>
          <div className="cards-grid">
            {prescriptions.map((prescription) => (
              <div key={prescription.id} className="data-card prescription-card">
                <div className="prescription-header">
                  <h4>Prescription #{prescription.id}</h4>
                  <span className="prescription-date">{prescription.date}</span>
                </div>
                {prescription.patientName && (
                  <p><strong>Patient:</strong> {prescription.patientName}</p>
                )}
                {prescription.doctorName && (
                  <p><strong>Doctor:</strong> {prescription.doctorName}</p>
                )}
                <div className="medications-section">
                  <strong>Medications ({prescription.medications.length}):</strong>
                  <ul className="medications-list">
                    {prescription.medications.map((med, index) => (
                      <li key={index} className="medication-item">
                        <strong>{med.name}</strong>
                        {med.dosage && <span> - {med.dosage}</span>}
                        {med.frequency && <span> - {med.frequency}</span>}
                        {med.duration && <span> - {med.duration}</span>}
                        {med.quantity && <div>Quantity: {med.quantity}</div>}
                        {med.instructions && <div className="instructions">{med.instructions}</div>}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {prescriptions.length === 0 && !uploading && (
        <div className="no-data" style={{ marginTop: '30px' }}>
          <p>No prescriptions yet. Upload a prescription image to get started.</p>
        </div>
      )}
    </div>
  );
}

