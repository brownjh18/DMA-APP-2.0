import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonIcon } from '@ionic/react';
import { useState, useEffect } from 'react';
import { newspaper, arrowBack, calendar, person, eye } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';

interface NewsArticle {
  id?: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  category: string;
  imageUrl: string;
  publishDate: string;
  viewCount: number;
}

const FullNewsArticle: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const id = urlParams.get('newsId');

    console.log('FullNewsArticle: URL params - newsId:', id);

    if (id) {
      const fetchArticle = async () => {
        try {
          setLoading(true);
          const data = await apiService.getNews(id);
          const apiArticle = data.news || data;

          const formattedArticle: NewsArticle = {
            id: apiArticle._id || apiArticle.id,
            title: apiArticle.title,
            content: apiArticle.content,
            excerpt: apiArticle.excerpt,
            author: apiArticle.author,
            category: apiArticle.category,
            imageUrl: apiArticle.imageUrl,
            publishDate: apiArticle.publishDate || apiArticle.createdAt,
            viewCount: apiArticle.viewCount || 0
          };
          setArticle(formattedArticle);
          console.log('Fetched news article by ID:', formattedArticle.title);
        } catch (error) {
          console.error('Failed to fetch news article by ID:', error);
          setArticle(null);
        } finally {
          setLoading(false);
        }
      };

      fetchArticle();
    } else {
      console.log('No valid news ID provided');
      setLoading(false);
    }
  }, [location.search]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'announcement': return 'var(--ion-color-primary)';
      case 'ministry-update': return 'var(--ion-color-secondary)';
      case 'event': return 'var(--ion-color-tertiary)';
      case 'testimony': return 'var(--ion-color-success)';
      case 'community': return 'var(--ion-color-warning)';
      default: return 'var(--ion-color-medium)';
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader translucent>
          <IonToolbar className="toolbar-ios">
            <div
              onClick={() => history.goBack()}
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 25,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer'
              }}
            >
              <IonIcon
                icon={arrowBack}
                style={{
                  fontSize: '1.2em',
                  color: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000'
                }}
              />
            </div>
            <IonTitle className="title-ios">News Article</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="content-ios">
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <IonIcon icon={newspaper} style={{ fontSize: '48px', color: '#9ca3af', marginBottom: '16px' }} />
            <h3>Loading article...</h3>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!article) {
    return (
      <IonPage>
        <IonHeader translucent>
          <IonToolbar className="toolbar-ios">
            <div
              onClick={() => history.goBack()}
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 25,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer'
              }}
            >
              <IonIcon
                icon={arrowBack}
                style={{
                  fontSize: '1.2em',
                  color: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000'
                }}
              />
            </div>
            <IonTitle className="title-ios">News Article</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="content-ios">
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <IonIcon icon={newspaper} style={{ fontSize: '48px', color: '#9ca3af', marginBottom: '16px' }} />
            <h3>Article not found</h3>
            <p style={{ color: '#666', marginTop: '20px' }}>
              The requested article could not be found.
            </p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <div
            onClick={() => history.goBack()}
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 25,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <IonIcon
              icon={arrowBack}
              style={{
                fontSize: '1.2em',
                color: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000'
              }}
            />
          </div>
          <IonTitle className="title-ios">News Article</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios" style={{ backgroundColor: 'var(--ion-background-color)' }}>
        {/* Hero Image */}
        {article.imageUrl && (
          <div style={{
            width: '100%',
            height: '250px',
            backgroundImage: `url(${article.imageUrl.startsWith('/uploads') ? `http://localhost:5000${article.imageUrl}` : article.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7))'
            }} />
          </div>
        )}

        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          {/* Category Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '6px 12px',
            borderRadius: '20px',
            backgroundColor: getCategoryColor(article.category),
            color: 'white',
            fontSize: '0.8em',
            fontWeight: '600',
            textTransform: 'capitalize',
            marginBottom: '16px'
          }}>
            {article.category.replace('-', ' ')}
          </div>

          {/* Title */}
          <h1 style={{
            margin: '0 0 20px 0',
            fontSize: '1.8em',
            fontWeight: '700',
            color: 'var(--ion-text-color)',
            lineHeight: '1.3'
          }}>
            {article.title}
          </h1>

          {/* Meta Info */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '20px',
            marginBottom: '24px',
            paddingBottom: '24px',
            borderBottom: '1px solid var(--ion-border-color, rgba(0,0,0,0.1))'
          }}>
            {article.author && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IonIcon icon={person} style={{ color: 'var(--ion-color-medium)', fontSize: '1.1em' }} />
                <span style={{ color: 'var(--ion-text-color)', fontSize: '0.9em' }}>{article.author}</span>
              </div>
            )}
            {article.publishDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IonIcon icon={calendar} style={{ color: 'var(--ion-color-medium)', fontSize: '1.1em' }} />
                <span style={{ color: 'var(--ion-text-color)', fontSize: '0.9em' }}>{formatDate(article.publishDate)}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IonIcon icon={eye} style={{ color: 'var(--ion-color-medium)', fontSize: '1.1em' }} />
              <span style={{ color: 'var(--ion-text-color)', fontSize: '0.9em' }}>{article.viewCount} views</span>
            </div>
          </div>

          {/* Excerpt */}
          {article.excerpt && (
            <div style={{
              fontSize: '1.1em',
              fontWeight: '500',
              color: 'var(--ion-text-color)',
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: 'var(--ion-color-primary-tint)',
              borderRadius: '12px',
              borderLeft: '4px solid var(--ion-color-primary)'
            }}>
              {article.excerpt}
            </div>
          )}

          {/* Content */}
          <div style={{
            fontSize: '1em',
            lineHeight: '1.8',
            color: 'var(--ion-text-color)',
            whiteSpace: 'pre-wrap'
          }}>
            {article.content}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          marginTop: '40px',
          borderTop: '1px solid var(--ion-border-color, rgba(0,0,0,0.1))'
        }}>
          <IonIcon icon={newspaper} style={{ fontSize: '2em', color: 'var(--ion-color-primary)', marginBottom: '12px' }} />
          <p style={{
            color: 'var(--ion-text-color)',
            opacity: 0.6,
            fontSize: '0.9em',
            margin: '0'
          }}>
            Dove Ministries Africa
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default FullNewsArticle;
