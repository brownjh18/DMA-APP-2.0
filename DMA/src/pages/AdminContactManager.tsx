import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  arrowBack,
  camera,
  trash,
  personAdd,
  locationOutline,
  callOutline,
  mailOutline,
  timeOutline,
  saveOutline,
  informationCircle,
  phonePortrait,
  mail,
  text,
  people,
  search,
  closeCircle as closeIcon,
  checkmarkCircle
} from 'ionicons/icons';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonText,
  IonRefresher,
  IonRefresherContent,
  IonAlert,
  IonFab,
  IonFabButton,
  useIonViewWillEnter
} from '@ionic/react';
import { BACKEND_BASE_URL } from '../services/api';
import './Tab4.css';

const AdminContactManager: React.FC = () => {
  const history = useHistory();
  const [contactInfo, setContactInfo] = useState({
    churchName: 'Dove Church',
    address: '123 Faith Street, Kampala, Uganda',
    phone: '+256 123 456 789',
    email: 'info@doveministriesafrica.org',
    serviceTimes: 'Sundays: 8:00 AM & 10:30 AM\nWednesdays: 7:00 PM',
    about: 'Dove Church is a vibrant church community dedicated to spreading God\'s love and serving our community through worship, fellowship, and outreach programs.',
    mission: 'To bring hope, healing, and transformation to lives through the power of God\'s love.',
    founders: [
      {
        name: 'Pastor Daniel Kaggwa',
        title: 'Co-Founder & Senior Pastor',
        imageUrl: '/pastor.jpg'
      },
      {
        name: 'Erica Kaggwa',
        title: 'Co-Founder & Ministry Leader',
        imageUrl: '/mommy-erica.jpg'
      }
    ]
  });
  const [contactId, setContactId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [activeSection, setActiveSection] = useState<string>('contact');

  // Calculate display values
  const aboutLength = contactInfo.about.length;
  const totalFounders = contactInfo.founders.length;

  useEffect(() => {
    loadContactInfo();
  }, []);

  useIonViewWillEnter(() => {
    loadContactInfo();
  });

  const loadContactInfo = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_BASE_URL}/api/contacts/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.contacts && data.contacts.length > 0) {
          const contact = data.contacts[0];
          setContactId(contact._id);
          setContactInfo({
            churchName: contact.churchName,
            address: contact.address,
            phone: contact.phone,
            email: contact.email,
            serviceTimes: contact.serviceTimes,
            about: contact.about,
            mission: contact.mission,
            founders: contact.founders || [
              {
                name: 'Pastor Daniel Kaggwa',
                title: 'Co-Founder & Senior Pastor',
                imageUrl: '/pastor.jpg'
              },
              {
                name: 'Erica Kaggwa',
                title: 'Co-Founder & Ministry Leader',
                imageUrl: '/mommy-erica.jpg'
              }
            ]
          });
        }
      } else {
        console.error('Failed to load contact info');
      }
    } catch (error) {
      console.error('Error loading contact info:', error);
    }
    setLoading(false);
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadContactInfo();
    event.detail.complete();
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let response;

      if (contactId) {
        response = await fetch(`${BACKEND_BASE_URL}/api/contacts/${contactId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(contactInfo)
        });
      } else {
        response = await fetch(`${BACKEND_BASE_URL}/api/contacts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(contactInfo)
        });
      }

      if (response.ok) {
        const data = await response.json();
        if (!contactId) {
          setContactId(data.contact._id);
        }
        setAlertMessage('Contact information saved successfully!');
        setShowAlert(true);
      } else {
        setAlertMessage('Failed to save contact information. Please try again.');
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error saving contact info:', error);
      setAlertMessage('Error saving contact information. Please try again.');
      setShowAlert(true);
    }
    setLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setContactInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFounderChange = (index: number, field: string, value: string) => {
    setContactInfo(prev => ({
      ...prev,
      founders: prev.founders.map((founder, i) =>
        i === index ? { ...founder, [field]: value } : founder
      )
    }));
  };

  const handleImageUpload = async (index: number, file: File) => {
    try {
      const formData = new FormData();
      formData.append('thumbnailFile', file);

      const response = await fetch(`${BACKEND_BASE_URL}/api/upload/thumbnail`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        handleFounderChange(index, 'imageUrl', data.thumbnailUrl);
        setAlertMessage('Leader image uploaded successfully!');
        setShowAlert(true);
      } else {
        setAlertMessage('Failed to upload image. Please try again.');
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setAlertMessage('Error uploading image. Please try again.');
      setShowAlert(true);
    }
  };

  const handleAddFounder = () => {
    setContactInfo(prev => ({
      ...prev,
      founders: [...prev.founders, { name: '', title: '', imageUrl: '/default-avatar.png' }]
    }));
  };

  const handleRemoveFounder = (index: number) => {
    if (contactInfo.founders.length <= 1) {
      setAlertMessage('You must have at least one leader.');
      setShowAlert(true);
      return;
    }
    setContactInfo(prev => ({
      ...prev,
      founders: prev.founders.filter((_, i) => i !== index)
    }));
  };

  const sections = [
    { id: 'contact', name: 'Contact Info', icon: phonePortrait },
    { id: 'about', name: 'About', icon: text },
    { id: 'founders', name: 'Leaders', icon: people }
  ];

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()} style={{ marginLeft: '4px' }}>
            <IonIcon icon={arrowBack} style={{ fontSize: '22px' }} />
          </IonButton>
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>About & Contact</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px' }}>

          {/* Section Tabs */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginBottom: '20px',
            overflowX: 'auto',
            paddingBottom: '4px'
          }}>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: activeSection === section.id ? 'var(--ion-color-primary)' : 'var(--ion-card-background)',
                  color: activeSection === section.id ? 'white' : 'var(--ion-text-color)',
                  fontSize: '14px',
                  fontWeight: activeSection === section.id ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <IonIcon icon={section.icon} style={{ fontSize: '16px' }} />
                {section.name}
              </button>
            ))}
          </div>

          {/* Contact Info Section */}
          {activeSection === 'contact' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px',
                borderRadius: '14px',
                background: 'var(--ion-card-background)',
                border: '1px solid var(--ion-color-step-200)',
                marginBottom: '10px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                }}>
                  <IonIcon icon={phonePortrait} style={{ fontSize: '28px', color: 'white', opacity: 0.9 }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--ion-text-color)' }}>
                    Contact Information
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--ion-color-medium)' }}>
                    Church address, phone, email, and service times
                  </p>
                </div>
              </div>

              <div style={{
                padding: '16px',
                borderRadius: '14px',
                background: 'var(--ion-card-background)',
                border: '1px solid var(--ion-color-step-200)',
                marginTop: '16px'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--ion-text-color)', marginBottom: '8px', opacity: 0.7 }}>
                    CHURCH NAME
                  </label>
                  <input
                    type="text"
                    value={contactInfo.churchName}
                    onChange={(e) => handleInputChange('churchName', e.target.value)}
                    placeholder="Enter church name"
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: 'var(--ion-color-step-100)',
                      border: '1px solid var(--ion-color-step-200)',
                      borderRadius: '12px',
                      outline: 'none',
                      color: 'var(--ion-text-color)',
                      fontSize: '0.95em'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--ion-text-color)', marginBottom: '8px', opacity: 0.7 }}>
                    ADDRESS
                  </label>
                  <input
                    type="text"
                    value={contactInfo.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter church address"
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: 'var(--ion-color-step-100)',
                      border: '1px solid var(--ion-color-step-200)',
                      borderRadius: '12px',
                      outline: 'none',
                      color: 'var(--ion-text-color)',
                      fontSize: '0.95em'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--ion-text-color)', marginBottom: '8px', opacity: 0.7 }}>
                    PHONE
                  </label>
                  <input
                    type="text"
                    value={contactInfo.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: 'var(--ion-color-step-100)',
                      border: '1px solid var(--ion-color-step-200)',
                      borderRadius: '12px',
                      outline: 'none',
                      color: 'var(--ion-text-color)',
                      fontSize: '0.95em'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--ion-text-color)', marginBottom: '8px', opacity: 0.7 }}>
                    EMAIL
                  </label>
                  <input
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: 'var(--ion-color-step-100)',
                      border: '1px solid var(--ion-color-step-200)',
                      borderRadius: '12px',
                      outline: 'none',
                      color: 'var(--ion-text-color)',
                      fontSize: '0.95em'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--ion-text-color)', marginBottom: '8px', opacity: 0.7 }}>
                    SERVICE TIMES
                  </label>
                  <textarea
                    value={contactInfo.serviceTimes}
                    onChange={(e) => handleInputChange('serviceTimes', e.target.value)}
                    placeholder="Enter service times"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: 'var(--ion-color-step-100)',
                      border: '1px solid var(--ion-color-step-200)',
                      borderRadius: '12px',
                      outline: 'none',
                      color: 'var(--ion-text-color)',
                      fontSize: '0.95em',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* About Section */}
          {activeSection === 'about' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px',
                borderRadius: '14px',
                background: 'var(--ion-card-background)',
                border: '1px solid var(--ion-color-step-200)',
                marginBottom: '10px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}>
                  <IonIcon icon={text} style={{ fontSize: '28px', color: 'white', opacity: 0.9 }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--ion-text-color)' }}>
                    About Content
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--ion-color-medium)' }}>
                    Church story and mission statement
                  </p>
                </div>
              </div>

              <div style={{
                padding: '16px',
                borderRadius: '14px',
                background: 'var(--ion-card-background)',
                border: '1px solid var(--ion-color-step-200)',
                marginTop: '16px'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--ion-text-color)', marginBottom: '8px', opacity: 0.7 }}>
                    OUR STORY
                  </label>
                  <textarea
                    value={contactInfo.about}
                    onChange={(e) => handleInputChange('about', e.target.value)}
                    placeholder="Enter church story"
                    rows={6}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: 'var(--ion-color-step-100)',
                      border: '1px solid var(--ion-color-step-200)',
                      borderRadius: '12px',
                      outline: 'none',
                      color: 'var(--ion-text-color)',
                      fontSize: '0.95em',
                      resize: 'vertical'
                    }}
                  />
                  <p style={{ fontSize: '11px', color: 'var(--ion-color-medium)', opacity: 0.5, marginTop: '4px', textAlign: 'right' }}>
                    {aboutLength} characters
                  </p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--ion-text-color)', marginBottom: '8px', opacity: 0.7 }}>
                    MISSION STATEMENT
                  </label>
                  <textarea
                    value={contactInfo.mission}
                    onChange={(e) => handleInputChange('mission', e.target.value)}
                    placeholder="Enter mission statement"
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: 'var(--ion-color-step-100)',
                      border: '1px solid var(--ion-color-step-200)',
                      borderRadius: '12px',
                      outline: 'none',
                      color: 'var(--ion-text-color)',
                      fontSize: '0.95em',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Founders Section */}
          {activeSection === 'founders' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px',
                borderRadius: '14px',
                background: 'var(--ion-card-background)',
                border: '1px solid var(--ion-color-step-200)',
                marginBottom: '10px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                }}>
                  <IonIcon icon={people} style={{ fontSize: '28px', color: 'white', opacity: 0.9 }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--ion-text-color)' }}>
                    Church Leaders
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--ion-color-medium)' }}>
                    {totalFounders} leader{totalFounders !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                {contactInfo.founders.map((founder, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px',
                      borderRadius: '14px',
                      background: 'var(--ion-card-background)',
                      border: '1px solid var(--ion-color-step-200)',
                      marginBottom: '10px',
                      position: 'relative'
                    }}
                  >
                    {/* Left accent line */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '3px',
                      height: '100%',
                      background: '#f59e0b',
                      opacity: 0.8,
                      borderRadius: '14px 0 0 14px'
                    }} />

                    {/* Avatar */}
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      position: 'relative',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <img
                        src={founder.imageUrl || '/default-avatar.png'}
                        alt={founder.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          position: 'absolute',
                          top: 0,
                          left: 0
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-avatar.png';
                        }}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(index, file);
                          }
                        }}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer',
                          zIndex: 1
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <input
                        type="text"
                        value={founder.name}
                        onChange={(e) => handleFounderChange(index, 'name', e.target.value)}
                        placeholder="Leader name"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'var(--ion-color-step-100)',
                          border: '1px solid var(--ion-color-step-200)',
                          borderRadius: '8px',
                          outline: 'none',
                          color: 'var(--ion-text-color)',
                          fontSize: '14px',
                          fontWeight: '600',
                          marginBottom: '4px'
                        }}
                      />
                      <input
                        type="text"
                        value={founder.title}
                        onChange={(e) => handleFounderChange(index, 'title', e.target.value)}
                        placeholder="Leader title"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'var(--ion-color-step-100)',
                          border: '1px solid var(--ion-color-step-200)',
                          borderRadius: '8px',
                          outline: 'none',
                          color: 'var(--ion-text-color)',
                          fontSize: '12px',
                          opacity: 0.7
                        }}
                      />
                    </div>

                    {/* Delete button */}
                    <div
                      onClick={() => handleRemoveFounder(index)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: '#ef444415',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#ef444425'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#ef444415'}
                    >
                      <IonIcon icon={trash} style={{ fontSize: '16px', color: '#ef4444' }} />
                    </div>
                  </div>
                ))}
              </div>

              <div
                onClick={handleAddFounder}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px',
                  borderRadius: '14px',
                  border: '2px dashed var(--ion-color-step-200)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginTop: '16px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#f59e0b';
                  e.currentTarget.style.background = '#f59e0b08';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--ion-color-step-200)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <IonIcon icon={personAdd} style={{ fontSize: '20px', color: '#f59e0b' }} />
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#f59e0b' }}>Add Leader</span>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div style={{ marginTop: '32px', marginBottom: '24px' }}>
            <button 
              className="save-button"
              onClick={handleSave} 
              disabled={loading}
              style={{
                width: '100%',
                maxWidth: '400px',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '16px 32px',
                border: 'none',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading 
                  ? '0 4px 12px rgba(99, 102, 241, 0.2)' 
                  : '0 8px 24px rgba(99, 102, 241, 0.4), 0 2px 8px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: loading ? 0.6 : 1,
                transform: loading ? 'none' : 'scale(1)',
                letterSpacing: '0.3px'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(99, 102, 241, 0.5), 0 4px 12px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.4), 0 2px 8px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                }
              }}
              onMouseDown={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'scale(0.98)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3), inset 0 2px 4px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseUp={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(99, 102, 241, 0.5), 0 4px 12px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                }
              }}
            >
              <IonIcon icon={saveOutline} style={{ fontSize: '20px', filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))' }} />
              <span style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}>
                {loading ? 'Saving...' : 'Save Changes'}
              </span>
            </button>
          </div>

          {/* Preview Section */}
          <div style={{ marginTop: '32px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px',
              borderRadius: '14px',
              background: 'var(--ion-card-background)',
              border: '1px solid var(--ion-color-step-200)',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
              }}>
                <IonIcon icon={informationCircle} style={{ fontSize: '28px', color: 'white', opacity: 0.9 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--ion-text-color)' }}>
                  Preview
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--ion-color-medium)' }}>
                  How it will appear to users
                </p>
              </div>
            </div>

            <div style={{
              padding: '20px',
              borderRadius: '16px',
              background: 'var(--ion-card-background)',
              border: '1px solid var(--ion-color-step-200)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: 'var(--ion-text-color)' }}>
                {contactInfo.churchName || 'Church Name'}
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <IonIcon icon={locationOutline} style={{ color: 'var(--ion-color-primary)', fontSize: '16px' }} />
                <span style={{ fontSize: '14px', color: 'var(--ion-color-medium)' }}>{contactInfo.address || 'Address'}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <IonIcon icon={callOutline} style={{ color: 'var(--ion-color-primary)', fontSize: '16px' }} />
                <span style={{ fontSize: '14px', color: 'var(--ion-color-medium)' }}>{contactInfo.phone || 'Phone'}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <IonIcon icon={mailOutline} style={{ color: 'var(--ion-color-primary)', fontSize: '16px' }} />
                <span style={{ fontSize: '14px', color: 'var(--ion-color-medium)' }}>{contactInfo.email || 'Email'}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <IonIcon icon={timeOutline} style={{ color: 'var(--ion-color-primary)', fontSize: '16px' }} />
                <span style={{ fontSize: '14px', color: 'var(--ion-color-medium)', whiteSpace: 'pre-line' }}>
                  {contactInfo.serviceTimes || 'Service Times'}
                </span>
              </div>

              {contactInfo.about && (
                <div style={{ marginBottom: '16px', paddingTop: '16px', borderTop: '1px solid var(--ion-color-step-200)' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: 'var(--ion-text-color)' }}>
                    Our Story
                  </h4>
                  <p style={{ margin: '0', fontSize: '14px', color: 'var(--ion-color-medium)', lineHeight: '1.5' }}>
                    {contactInfo.about}
                  </p>
                </div>
              )}

              {contactInfo.mission && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: 'var(--ion-text-color)' }}>
                    Mission
                  </h4>
                  <p style={{ margin: '0', fontSize: '14px', color: 'var(--ion-color-medium)', lineHeight: '1.5' }}>
                    {contactInfo.mission}
                  </p>
                </div>
              )}

              {contactInfo.founders && contactInfo.founders.length > 0 && (
                <div style={{ paddingTop: '16px', borderTop: '1px solid var(--ion-color-step-200)' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: 'var(--ion-text-color)' }}>
                    Leaders
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {contactInfo.founders.map((founder, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={founder.imageUrl || '/default-avatar.png'}
                          alt={founder.name}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            objectFit: 'cover',
                            border: '2px solid var(--ion-color-primary)'
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/default-avatar.png';
                          }}
                        />
                        <div>
                          <p style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '600', color: 'var(--ion-text-color)' }}>
                            {founder.name || 'Leader Name'}
                          </p>
                          <p style={{ margin: '0', fontSize: '12px', color: 'var(--ion-color-medium)' }}>
                            {founder.title || 'Title'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '28px', paddingTop: '16px', borderTop: '1px solid var(--ion-color-step-200)' }}>
            <IonText style={{ color: 'var(--ion-text-color)', opacity: 0.4, fontSize: '11px' }}>
              Dove Church • Admin Panel v2.0
            </IonText>
          </div>
        </div>

        {/* Alert */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Alert"
          message={alertMessage}
          buttons={['OK']}
        />

        {loading && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'var(--ion-card-background)',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            textAlign: 'center',
            zIndex: 1000
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--ion-color-step-200)',
              borderTop: '3px solid var(--ion-color-primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ fontSize: '14px', margin: 0, color: 'var(--ion-text-color)' }}>Saving...</p>
          </div>
        )}

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </IonContent>
    </IonPage>
  );
};

export default AdminContactManager;