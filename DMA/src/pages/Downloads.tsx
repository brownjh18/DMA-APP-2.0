import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonText,
  IonButton,
  IonBadge,
  IonLoading,
  IonAlert,
  IonSearchbar
} from '@ionic/react';
import {
  download,
  playCircle,
  calendar,
  person,
  time,
  book,
  search,
  cloudDownload
} from 'ionicons/icons';
import apiService from '../services/api';

interface Sermon {
  _id: string;
  title: string;
  speaker: string;
  description: string;
  scripture: string;
  date: string;
  duration: string;
  tags: string[];
  isPublished: boolean;
  isFeatured: boolean;
  downloadUrl?: string;
  fileSize?: string;
}

const Downloads: React.FC = () => {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [filteredSermons, setFilteredSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    loadSermons();
  }, []);

  useEffect(() => {
    filterSermons();
  }, [sermons, searchText]);

  const loadSermons = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSermons({ isPublished: true });
      // Add mock download URLs and file sizes for demo
      const sermonsWithDownloads = response.data?.map((sermon: Sermon) => ({
        ...sermon,
        downloadUrl: `https://example.com/downloads/${sermon._id}.mp3`,
        fileSize: `${Math.floor(Math.random() * 50) + 10} MB`
      })) || [];
      setSermons(sermonsWithDownloads);
    } catch (err: any) {
      setError('Failed to load sermons. Please try again.');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const filterSermons = () => {
    if (!searchText.trim()) {
      setFilteredSermons(sermons);
      return;
    }

    const filtered = sermons.filter(sermon =>
      sermon.title.toLowerCase().includes(searchText.toLowerCase()) ||
      sermon.speaker.toLowerCase().includes(searchText.toLowerCase()) ||
      sermon.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase()))
    );
    setFilteredSermons(filtered);
  };

  const handleDownload = (sermon: Sermon) => {
    // In a real app, this would trigger the actual download
    // For now, we'll show a success message
    alert(`Download started for "${sermon.title}"\n\nFile: ${sermon.fileSize}\nURL: ${sermon.downloadUrl}`);

    // You could also use:
    // const link = document.createElement('a');
    // link.href = sermon.downloadUrl;
    // link.download = `${sermon.title}.mp3`;
    // link.click();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tab1" />
          </IonButtons>
          <IonTitle className="title-ios">Sermon Downloads</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '16px' }}>
          {/* Header Section */}
          <div style={{
            textAlign: 'center',
            marginBottom: '24px',
            padding: '20px 0'
          }}>
            <IonIcon
              icon={cloudDownload}
              style={{
                fontSize: '3em',
                color: 'var(--ion-color-primary)',
                marginBottom: '12px'
              }}
            />
            <h1 style={{
              margin: '0 0 8px 0',
              fontSize: '1.8em',
              fontWeight: '700',
              color: 'var(--ion-text-color)'
            }}>
              Download Sermons
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Access our complete sermon library offline
            </p>
          </div>

          {/* Search Bar */}
          <IonSearchbar
            value={searchText}
            onIonChange={(e) => setSearchText(e.detail.value!)}
            placeholder="Search sermons by title, speaker, or topic..."
            style={{
              marginBottom: '20px',
              '--border-radius': '12px',
              '--background': 'var(--ion-item-background)',
              '--border-color': 'var(--ion-color-step-300)',
              '--box-shadow': '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          />

          {/* Sermons List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <IonLoading isOpen={loading} message="Loading sermons..." />
            </div>
          ) : filteredSermons.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--ion-text-color)',
              opacity: 0.7
            }}>
              <IonIcon
                icon={search}
                style={{
                  fontSize: '3em',
                  color: 'var(--ion-color-medium)',
                  marginBottom: '16px'
                }}
              />
              <h3>No sermons found</h3>
              <p>Try adjusting your search terms</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredSermons.map((sermon) => (
                <IonCard key={sermon._id} style={{
                  margin: 0,
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  border: '1px solid var(--ion-color-step-100)'
                }}>
                  <IonCardContent style={{ padding: '20px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '16px'
                    }}>
                      <div style={{ flex: 1, marginRight: '16px' }}>
                        <h3 style={{
                          margin: '0 0 8px 0',
                          fontSize: '1.2em',
                          fontWeight: '600',
                          color: 'var(--ion-text-color)',
                          lineHeight: '1.3'
                        }}>
                          {sermon.title}
                        </h3>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '8px',
                          flexWrap: 'wrap'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <IonIcon icon={person} style={{
                              fontSize: '1em',
                              color: 'var(--ion-color-primary)'
                            }} />
                            <IonText style={{
                              fontSize: '0.9em',
                              color: 'var(--ion-text-color)',
                              opacity: 0.8
                            }}>
                              {sermon.speaker}
                            </IonText>
                          </div>

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <IonIcon icon={calendar} style={{
                              fontSize: '1em',
                              color: 'var(--ion-color-primary)'
                            }} />
                            <IonText style={{
                              fontSize: '0.9em',
                              color: 'var(--ion-text-color)',
                              opacity: 0.8
                            }}>
                              {formatDate(sermon.date)}
                            </IonText>
                          </div>

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <IonIcon icon={time} style={{
                              fontSize: '1em',
                              color: 'var(--ion-color-primary)'
                            }} />
                            <IonText style={{
                              fontSize: '0.9em',
                              color: 'var(--ion-text-color)',
                              opacity: 0.8
                            }}>
                              {sermon.duration}
                            </IonText>
                          </div>
                        </div>

                        {sermon.scripture && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginBottom: '12px'
                          }}>
                            <IonIcon icon={book} style={{
                              fontSize: '1em',
                              color: 'var(--ion-color-secondary)'
                            }} />
                            <IonText style={{
                              fontSize: '0.9em',
                              color: 'var(--ion-color-secondary)',
                              fontWeight: '500'
                            }}>
                              {sermon.scripture}
                            </IonText>
                          </div>
                        )}

                        <p style={{
                          margin: '0 0 12px 0',
                          fontSize: '0.95em',
                          color: 'var(--ion-text-color)',
                          opacity: 0.8,
                          lineHeight: '1.4'
                        }}>
                          {sermon.description}
                        </p>

                        <div style={{
                          display: 'flex',
                          gap: '6px',
                          flexWrap: 'wrap',
                          marginBottom: '16px'
                        }}>
                          {sermon.tags.slice(0, 3).map((tag, index) => (
                            <IonBadge
                              key={index}
                              style={{
                                fontSize: '0.75em',
                                padding: '4px 8px',
                                backgroundColor: 'var(--ion-color-light)',
                                color: 'var(--ion-color-dark)'
                              }}
                            >
                              {tag}
                            </IonBadge>
                          ))}
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <IonButton
                          fill="clear"
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--ion-color-primary)',
                            color: 'white',
                            '--border-radius': '50%'
                          }}
                          onClick={() => handleDownload(sermon)}
                        >
                          <IonIcon icon={download} style={{ fontSize: '1.4em' }} />
                        </IonButton>

                        {sermon.fileSize && (
                          <IonText style={{
                            fontSize: '0.8em',
                            color: 'var(--ion-text-color)',
                            opacity: 0.6,
                            textAlign: 'center'
                          }}>
                            {sermon.fileSize}
                          </IonText>
                        )}
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              ))}
            </div>
          )}

          {/* Footer Info */}
          <div style={{
            marginTop: '32px',
            padding: '20px',
            backgroundColor: 'var(--ion-color-light)',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <IonIcon
              icon={cloudDownload}
              style={{
                fontSize: '2em',
                color: 'var(--ion-color-primary)',
                marginBottom: '12px'
              }}
            />
            <h4 style={{
              margin: '0 0 8px 0',
              fontSize: '1em',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              Download & Listen Offline
            </h4>
            <p style={{
              margin: '0',
              fontSize: '0.9em',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              lineHeight: '1.4'
            }}>
              All downloads are available in high-quality MP3 format.
              Perfect for listening on the go or sharing with others.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Error"
          message={error}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default Downloads;