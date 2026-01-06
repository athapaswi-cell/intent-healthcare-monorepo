import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import HospitalList from './components/HospitalList';
import PatientList from './components/PatientList';
import DoctorList from './components/DoctorList';
import DoctorAvailability from './components/DoctorAvailability';
import DoctorSpecializations from './components/DoctorSpecializations';
import InsurancePolicies from './components/InsurancePolicies';
import InsuranceClaims from './components/InsuranceClaims';
import InsuranceCoverageRules from './components/InsuranceCoverageRules';
import PatientMedicalHistory from './components/PatientMedicalHistory';
import PatientVisits from './components/PatientVisits';
import PharmacyPrescriptions from './components/PharmacyPrescriptions';
import HospitalDetail from './components/HospitalDetail';
import BedAvailability from './components/BedAvailability';
import VoiceInterface from './components/VoiceInterface';
import VoiceButton from './components/VoiceButton';
import VoiceNavigation from './components/VoiceNavigation';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface IntentResponse {
  status: string;
  message?: string;
  [key: string]: any;
}

type UserRole = 'clinical' | 'ops' | 'admin';
type NavigationItem = 'dashboard' | 'patients' | 'doctors' | 'insurance' | 'pharmacy' | 'hospitals' | 'admin';
type SubNavItem = 
  | 'patients-list' | 'patients-history' | 'patients-visits'
  | 'doctors-directory' | 'doctors-specializations' | 'doctors-availability'
  | 'insurance-policies' | 'insurance-claims' | 'insurance-coverage'
  | 'pharmacy-prescriptions' | 'pharmacy-inventory' | 'pharmacy-fulfillment'
  | 'hospitals-facilities' | 'hospitals-departments' | 'hospitals-resources'
  | 'admin-users' | 'admin-master-data' | 'admin-integrations' | 'admin-audit';

interface MenuItem {
  id: NavigationItem;
  label: string;
  icon: string;
  roles: UserRole[];
  submenu?: { id: SubNavItem; label: string }[];
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '🏠',
    roles: ['clinical', 'ops', 'admin']
  },
  {
    id: 'patients',
    label: 'Patients',
    icon: '👤',
    roles: ['clinical', 'admin'],
    submenu: [
      { id: 'patients-list', label: 'Patient List' },
      { id: 'patients-history', label: 'Medical History' },
      { id: 'patients-visits', label: 'Visits' }
    ]
  },
  {
    id: 'doctors',
    label: 'Doctors',
    icon: '🩺',
    roles: ['clinical', 'admin'],
    submenu: [
      { id: 'doctors-directory', label: 'Doctor Directory' },
      { id: 'doctors-specializations', label: 'Specializations' },
      { id: 'doctors-availability', label: 'Availability' }
    ]
  },
  {
    id: 'insurance',
    label: 'Insurance',
    icon: '🛡️',
    roles: ['ops', 'admin'],
    submenu: [
      { id: 'insurance-policies', label: 'Policies' },
      { id: 'insurance-claims', label: 'Claims' },
      { id: 'insurance-coverage', label: 'Coverage Rules' }
    ]
  },
  {
    id: 'pharmacy',
    label: 'Pharmacy',
    icon: '💊',
    roles: ['ops', 'admin'],
    submenu: [
      { id: 'pharmacy-prescriptions', label: 'Prescriptions' },
      { id: 'pharmacy-inventory', label: 'Inventory' },
      { id: 'pharmacy-fulfillment', label: 'Fulfillment Status' }
    ]
  },
  {
    id: 'hospitals',
    label: 'Hospitals',
    icon: '🏥',
    roles: ['clinical', 'admin'],
    submenu: [
      { id: 'hospitals-facilities', label: 'Facilities' },
      { id: 'hospitals-departments', label: 'Departments' },
      { id: 'hospitals-resources', label: 'Beds / Resources' }
    ]
  },
  {
    id: 'admin',
    label: 'Admin / Configuration',
    icon: '⚙️',
    roles: ['admin'],
    submenu: [
      { id: 'admin-users', label: 'Users & Roles' },
      { id: 'admin-master-data', label: 'Master Data' },
      { id: 'admin-integrations', label: 'Integrations' },
      { id: 'admin-audit', label: 'Audit Logs' }
    ]
  }
];

export default function App() {
  const [userRole, setUserRole] = useState<UserRole>('admin'); // Default to admin for now
  const [activeNav, setActiveNav] = useState<NavigationItem>('dashboard');
  const [activeSubNav, setActiveSubNav] = useState<SubNavItem | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<Set<NavigationItem>>(new Set(['dashboard']));
  const [loading, setLoading] = useState<string | null>(null);
  const [response, setResponse] = useState<IntentResponse | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [healthQuery, setHealthQuery] = useState('');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const toggleMenu = (menuId: NavigationItem) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuId)) {
      newExpanded.delete(menuId);
    } else {
      newExpanded.add(menuId);
    }
    setExpandedMenus(newExpanded);
  };

  const handleNavClick = (item: NavigationItem) => {
    setActiveNav(item);
    setSelectedHospitalId(null);
    setActiveSubNav(null);
    
    const menuItem = menuItems.find(m => m.id === item);
    if (menuItem?.submenu && menuItem.submenu.length > 0) {
      // Auto-expand if has submenu
      if (!expandedMenus.has(item)) {
        setExpandedMenus(new Set([...expandedMenus, item]));
      }
    } else {
      // If no submenu, just navigate
    }
  };

  const handleMenuToggle = (item: NavigationItem) => {
    const menuItem = menuItems.find(m => m.id === item);
    if (menuItem?.submenu) {
      toggleMenu(item);
      setActiveNav(item);
      setSelectedHospitalId(null);
      // Don't clear activeSubNav when toggling, keep current subnav if any
    }
  };

  const handleSubNavClick = (subItem: SubNavItem, parentItem: NavigationItem) => {
    setActiveSubNav(subItem);
    setActiveNav(parentItem);
    setSelectedHospitalId(null);
  };

  const executeIntent = async (intentName: string, payload: any) => {
    setLoading(intentName);
    setResponse(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/v1/intent/execute`, {
        intent: { name: intentName },
        actor: { type: 'PATIENT' },
        payload
      }, {
        timeout: 10000
      });
      setResponse(response.data);
    } catch (error: any) {
      let errorMessage = 'Failed to execute intent';
      
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || error.message?.includes('ERR_NETWORK')) {
        errorMessage = 'Backend server is not running. Please start the backend server on port 8000.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setResponse({
        status: 'ERROR',
        message: errorMessage,
        error_code: error.code,
        backend_url: API_BASE_URL
      });
    } finally {
      setLoading(null);
    }
  };

  const handleEmergency = () => {
    if (confirm('Are you experiencing a medical emergency? This will alert emergency services.')) {
      executeIntent('PATIENT_EMERGENCY_HELP', {
        symptoms: symptoms.split(',').map(s => s.trim()).filter(s => s),
        location: 'Patient Location',
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleSymptomReport = () => {
    if (!symptoms.trim()) {
      alert('Please enter your symptoms');
      return;
    }
    executeIntent('PATIENT_SYMPTOM_REPORT', {
      symptoms: symptoms.split(',').map(s => s.trim()).filter(s => s),
      severity: 'moderate',
      duration: 'recent'
    });
  };

  const handleScheduleAppointment = () => {
    const date = appointmentDate || new Date(Date.now() + 86400000).toISOString().split('T')[0];
    executeIntent('SCHEDULE_APPOINTMENT', {
      preferred_date: date,
      reason: 'General consultation',
      doctor_preference: 'Any available'
    });
  };

  const handlePrescriptionRefill = () => {
    executeIntent('REQUEST_PRESCRIPTION_REFILL', {
      medication_name: 'Requested medication',
      pharmacy: 'Preferred pharmacy'
    });
  };

  const handleTelehealth = () => {
    executeIntent('REQUEST_TELEHEALTH_CONSULTATION', {
      preferred_time: 'Anytime',
      reason: 'Consultation needed'
    });
  };

  const handleHealthQuery = () => {
    if (!healthQuery.trim()) {
      alert('Please enter your health question');
      return;
    }
    executeIntent('HEALTH_QUERY', {
      query: healthQuery
    });
  };

  const handleViewRecords = () => {
    executeIntent('VIEW_MEDICAL_RECORDS', {});
  };

  const handleViewLabResults = () => {
    executeIntent('VIEW_LAB_RESULTS', {});
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleVoiceCommand = (command: string, transcript: string) => {
    speak(`Processing ${command.replace('_', ' ')} command`);
    
    switch (command) {
      case 'emergency':
        handleEmergency();
        break;
      case 'schedule_appointment':
        handleScheduleAppointment();
        break;
      case 'report_symptoms':
        if (transcript.includes('pain') || transcript.includes('hurt') || transcript.includes('sick')) {
          setSymptoms(transcript);
          handleSymptomReport();
        } else {
          speak('Please describe your symptoms');
        }
        break;
      case 'prescription_refill':
        handlePrescriptionRefill();
        break;
      case 'telehealth':
        handleTelehealth();
        break;
      case 'view_records':
        handleViewRecords();
        break;
      case 'lab_results':
        handleViewLabResults();
        break;
      case 'view_doctors':
        handleNavClick('doctors');
        break;
      case 'view_hospitals':
        handleNavClick('hospitals');
        break;
      case 'view_beds':
      case 'bed_availability':
        handleNavClick('hospitals');
        handleSubNavClick('hospitals-resources', 'hospitals');
        break;
      case 'view_patients':
        handleNavClick('patients');
        break;
      case 'dashboard':
        handleNavClick('dashboard');
        break;
      case 'stop_listening':
        setIsListening(false);
        speak('Voice recognition stopped');
        break;
      case 'general_query':
        setHealthQuery(transcript);
        handleHealthQuery();
        break;
      default:
        speak('Command not recognized. Please try again.');
    }
  };

  const handleVoiceInput = (input: string) => {
    // Handle general voice input for forms
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('symptom') || lowerInput.includes('pain') || lowerInput.includes('hurt')) {
      setSymptoms(input);
    } else if (lowerInput.includes('question') || lowerInput.includes('ask')) {
      setHealthQuery(input);
    }
  };

  const handleVoiceNavigation = (section: string) => {
    handleNavClick(section as NavigationItem);
  };

  const renderContent = () => {
    if (selectedHospitalId) {
      return (
        <HospitalDetail 
          hospitalId={selectedHospitalId} 
          onBack={() => {
            setSelectedHospitalId(null);
            setActiveNav('hospitals');
          }} 
        />
      );
    }

    // Handle submenu navigation
    if (activeSubNav) {
      if (activeSubNav.startsWith('patients-list')) {
        return <PatientList />;
      }
      if (activeSubNav.startsWith('doctors-directory')) {
        return <DoctorList />;
      }
      if (activeSubNav.startsWith('hospitals-facilities')) {
        return <HospitalList onSelectHospital={setSelectedHospitalId} />;
      }
      // Other submenu items would render here
    }

    switch (activeNav) {
      case 'dashboard':
        return (
          <>
            <VoiceNavigation 
              onNavigate={handleVoiceNavigation}
              currentSection={activeNav}
            />
            
            <section className="intent-section">
              <h2>📅 Appointments</h2>
              <div className="intent-grid">
                <div className="intent-card">
                  <h3>Schedule Appointment</h3>
                  <p>Book a visit with your doctor</p>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="date-input"
                  />
                  <VoiceButton
                    onClick={handleScheduleAppointment}
                    disabled={loading === 'SCHEDULE_APPOINTMENT'}
                    className="btn-primary"
                    voiceCommand="Scheduling your appointment"
                    ariaLabel="Schedule appointment"
                  >
                    {loading === 'SCHEDULE_APPOINTMENT' ? 'Scheduling...' : '📅 Schedule'}
                  </VoiceButton>
                </div>
                <div className="intent-card">
                  <h3>Telehealth Consultation</h3>
                  <p>Request a virtual visit</p>
                  <VoiceButton
                    onClick={handleTelehealth}
                    disabled={loading === 'REQUEST_TELEHEALTH_CONSULTATION'}
                    className="btn-primary"
                    voiceCommand="Requesting telehealth consultation"
                    ariaLabel="Request telehealth consultation"
                  >
                    {loading === 'REQUEST_TELEHEALTH_CONSULTATION' ? 'Processing...' : '💻 Request Consultation'}
                  </VoiceButton>
                </div>
              </div>
            </section>

            <section className="intent-section">
              <h2>🚨 Emergency & Health</h2>
              <div className="intent-grid">
                <div className="intent-card emergency-card">
                  <h3>Emergency Help</h3>
                  <p>Get immediate medical assistance</p>
                  <textarea
                    placeholder="Describe your symptoms (optional)..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="symptoms-input"
                    rows={2}
                  />
                  <VoiceButton
                    onClick={handleEmergency}
                    disabled={loading === 'PATIENT_EMERGENCY_HELP'}
                    className="btn-danger"
                    voiceCommand="Activating emergency services"
                    ariaLabel="Emergency help"
                  >
                    {loading === 'PATIENT_EMERGENCY_HELP' ? 'Alerting...' : '🚨 Emergency Help'}
                  </VoiceButton>
                </div>
                <div className="intent-card">
                  <h3>Report Symptoms</h3>
                  <p>Tell us how you're feeling</p>
                  <textarea
                    placeholder="Enter your symptoms..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="symptoms-input"
                    rows={3}
                  />
                  <VoiceButton
                    onClick={handleSymptomReport}
                    disabled={loading === 'PATIENT_SYMPTOM_REPORT'}
                    className="btn-warning"
                    voiceCommand="Recording your symptoms"
                    ariaLabel="Report symptoms"
                  >
                    {loading === 'PATIENT_SYMPTOM_REPORT' ? 'Processing...' : '🩺 Report Symptoms'}
                  </VoiceButton>
                </div>
              </div>
            </section>

            <section className="intent-section">
              <h2>❓ Health Questions</h2>
              <div className="intent-card">
                <h3>Ask a Health Question</h3>
                <p>Get information about your health concerns</p>
                <textarea
                  placeholder="Enter your health question..."
                  value={healthQuery}
                  onChange={(e) => setHealthQuery(e.target.value)}
                  className="query-input"
                  rows={3}
                />
                <VoiceButton
                  onClick={handleHealthQuery}
                  disabled={loading === 'HEALTH_QUERY'}
                  className="btn-info"
                  voiceCommand="Processing your health question"
                  ariaLabel="Ask health question"
                >
                  {loading === 'HEALTH_QUERY' ? 'Processing...' : '❓ Ask Question'}
                </VoiceButton>
              </div>
            </section>

            <section className="intent-section">
              <h2>📋 Medical Records</h2>
              <div className="intent-grid">
                <div className="intent-card">
                  <h3>View Medical Records</h3>
                  <p>Access your medical history</p>
                  <VoiceButton
                    onClick={handleViewRecords}
                    disabled={loading === 'VIEW_MEDICAL_RECORDS'}
                    className="btn-secondary"
                    voiceCommand="Opening your medical records"
                    ariaLabel="View medical records"
                  >
                    {loading === 'VIEW_MEDICAL_RECORDS' ? 'Loading...' : '📋 View Records'}
                  </VoiceButton>
                </div>
                <div className="intent-card">
                  <h3>Lab Results</h3>
                  <p>Check your latest test results</p>
                  <VoiceButton
                    onClick={handleViewLabResults}
                    disabled={loading === 'VIEW_LAB_RESULTS'}
                    className="btn-secondary"
                    voiceCommand="Retrieving your lab results"
                    ariaLabel="View lab results"
                  >
                    {loading === 'VIEW_LAB_RESULTS' ? 'Loading...' : '🧪 Lab Results'}
                  </VoiceButton>
                </div>
                <div className="intent-card">
                  <h3>Prescription Refill</h3>
                  <p>Request medication refills</p>
                  <VoiceButton
                    onClick={handlePrescriptionRefill}
                    disabled={loading === 'REQUEST_PRESCRIPTION_REFILL'}
                    className="btn-success"
                    voiceCommand="Requesting prescription refill"
                    ariaLabel="Request prescription refill"
                  >
                    {loading === 'REQUEST_PRESCRIPTION_REFILL' ? 'Processing...' : '💊 Refill Prescription'}
                  </VoiceButton>
                </div>
              </div>
            </section>

            {response && (
              <section className="response-section">
                <h2>Response</h2>
                <div className={`response-card ${response.status === 'ERROR' ? 'error' : 'success'}`}>
                  <h3>Status: {response.status}</h3>
                  {response.message && <p>{response.message}</p>}
                  {response.risk && (
                    <div className="risk-info">
                      <p><strong>Risk Score:</strong> {response.risk.risk_score}/100</p>
                      <p><strong>Severity:</strong> {response.risk.severity}</p>
                      <p><strong>Recommendation:</strong> {response.risk.recommended_action}</p>
                    </div>
                  )}
                  {response.appointment_id && <p><strong>Appointment ID:</strong> {response.appointment_id}</p>}
                  {response.appointment_date && <p><strong>Appointment Date:</strong> {response.appointment_date}</p>}
                  <pre>{JSON.stringify(response, null, 2)}</pre>
                </div>
              </section>
            )}
          </>
        );

      case 'patients':
        if (activeSubNav === 'patients-list' || !activeSubNav) {
          return <PatientList />;
        } else if (activeSubNav === 'patients-history') {
          return <PatientMedicalHistory />;
        } else if (activeSubNav === 'patients-visits') {
          return <PatientVisits />;
        } else {
          return (
            <section className="intent-section">
              <h2>👤 Patients - {menuItems.find(m => m.id === 'patients')?.submenu?.find(s => s.id === activeSubNav)?.label}</h2>
              <div className="intent-card">
                <p className="info-text">Feature coming soon...</p>
              </div>
            </section>
          );
        }

      case 'doctors':
        if (activeSubNav === 'doctors-availability') {
          return <DoctorAvailability />;
        } else if (activeSubNav === 'doctors-specializations') {
          return <DoctorSpecializations />;
        } else if (activeSubNav === 'doctors-directory' || !activeSubNav) {
          return <DoctorList />;
        } else {
          return (
            <section className="intent-section">
              <h2>🩺 Doctors - {menuItems.find(m => m.id === 'doctors')?.submenu?.find(s => s.id === activeSubNav)?.label}</h2>
              <div className="intent-card">
                <p className="info-text">Feature coming soon...</p>
              </div>
            </section>
          );
        }

      case 'insurance':
        if (activeSubNav === 'insurance-policies') {
          return <InsurancePolicies />;
        } else if (activeSubNav === 'insurance-claims') {
          return <InsuranceClaims />;
        } else if (activeSubNav === 'insurance-coverage') {
          return <InsuranceCoverageRules />;
        } else {
          return (
            <section className="intent-section">
              <h2>🛡️ Insurance - {activeSubNav ? menuItems.find(m => m.id === 'insurance')?.submenu?.find(s => s.id === activeSubNav)?.label : 'Overview'}</h2>
              <div className="intent-card">
                <p className="info-text">Insurance management features coming soon...</p>
              </div>
            </section>
          );
        }

      case 'pharmacy':
        if (activeSubNav === 'pharmacy-prescriptions') {
          return <PharmacyPrescriptions />;
        } else {
          return (
            <section className="intent-section">
              <h2>💊 Pharmacy - {activeSubNav ? menuItems.find(m => m.id === 'pharmacy')?.submenu?.find(s => s.id === activeSubNav)?.label : 'Overview'}</h2>
              <div className="intent-card">
                <p className="info-text">Pharmacy features coming soon...</p>
              </div>
            </section>
          );
        }

      case 'hospitals':
        if (activeSubNav === 'hospitals-facilities' || !activeSubNav) {
          return <HospitalList onSelectHospital={setSelectedHospitalId} />;
        } else if (activeSubNav === 'hospitals-resources') {
          return <BedAvailability />;
        } else {
          return (
            <section className="intent-section">
              <h2>🏥 Hospitals - {menuItems.find(m => m.id === 'hospitals')?.submenu?.find(s => s.id === activeSubNav)?.label}</h2>
              <div className="intent-card">
                <p className="info-text">Feature coming soon...</p>
              </div>
            </section>
          );
        }

      case 'admin':
        return (
          <section className="intent-section">
            <h2>⚙️ Admin / Configuration - {activeSubNav ? menuItems.find(m => m.id === 'admin')?.submenu?.find(s => s.id === activeSubNav)?.label : 'Overview'}</h2>
            <div className="intent-card">
              <p className="info-text">Administration features coming soon...</p>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  const visibleMenuItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="medical-app">
      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h1>🏥 Healthcare</h1>
            <p>Platform</p>
          </div>
          
          <nav className="sidebar-nav">
            {visibleMenuItems.map((item) => (
              <div key={item.id} className="nav-menu-item">
                <button
                  className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
                  onClick={() => item.submenu ? handleMenuToggle(item.id) : handleNavClick(item.id)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.label}</span>
                  {item.submenu && (
                    <span className="nav-arrow">{expandedMenus.has(item.id) ? '▼' : '▶'}</span>
                  )}
                </button>
                
                {item.submenu && expandedMenus.has(item.id) && (
                  <div className="submenu">
                    {item.submenu.map((subItem) => (
                      <button
                        key={subItem.id}
                        className={`submenu-item ${activeSubNav === subItem.id ? 'active' : ''}`}
                        onClick={() => handleSubNavClick(subItem.id, item.id)}
                      >
                        {subItem.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>

        <main className="main-content">
          <div className="content-wrapper">
            {renderContent()}
          </div>
        </main>
      </div>
      
      {voiceEnabled && (
        <VoiceInterface
          onVoiceCommand={handleVoiceCommand}
          onVoiceInput={handleVoiceInput}
          isListening={isListening}
          setIsListening={setIsListening}
        />
      )}
    </div>
  );
}
