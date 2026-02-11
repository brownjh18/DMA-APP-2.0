import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  IonTextarea,
  IonButton,
  IonIcon,
  IonText,
  IonSpinner,
  IonAlert,
  IonActionSheet,
} from '@ionic/react';
import { send, trash, ellipsisVertical, chevronUp, chevronDown } from 'ionicons/icons';
import { apiService, BACKEND_BASE_URL } from '../services/api';
import { AuthContext } from '../App';

interface Comment {
  _id: string;
  content: string;
  user: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CommentsProps {
  contentId: string;
  contentType: 'sermon' | 'podcast' | 'live_broadcast';
}

const Comments: React.FC<CommentsProps> = ({ contentId, contentType }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [isMinimized, setIsMinimized] = useState(true);

  const { isLoggedIn, user } = useContext(AuthContext);
  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [comments]);

  useEffect(() => {
    loadComments();
  }, [contentId, user?.id]); // Add user.id dependency to reload when user changes

  const getDemoCommentsKey = () => `demo_comments_${user?.id}_${contentId}`;

  const loadDemoComments = (): Comment[] => {
    try {
      const stored = localStorage.getItem(getDemoCommentsKey());
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading demo comments:', error);
      return [];
    }
  };

  const saveDemoComments = (comments: Comment[]) => {
    try {
      localStorage.setItem(getDemoCommentsKey(), JSON.stringify(comments));
    } catch (error) {
      console.error('Error saving demo comments:', error);
    }
  };

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await apiService.getComments(contentId, {}, true);
      console.log('Loaded comments:', response.comments);
      let allComments = response.comments || [];

      // For demo users, also load locally stored demo comments
      if (user?.id?.startsWith('demo-')) {
        const demoComments = loadDemoComments();
        allComments = [...allComments, ...demoComments];
      }

      setComments(allComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      // For demo users, still try to load from localStorage if API fails
      if (user?.id?.startsWith('demo-')) {
        const demoComments = loadDemoComments();
        setComments(demoComments);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const response = await apiService.createComment({
        content: newComment.trim(),
        contentId,
        contentType,
      });

      // Add the new comment to the list
      const newCommentObj = response.comment;
      setComments(prev => {
        const updated = [newCommentObj, ...prev];
        // For demo users, save to localStorage
        if (user?.id?.startsWith('demo-')) {
          saveDemoComments(updated.filter(c => c._id.startsWith('demo-')));
        }
        return updated;
      });
      setNewComment('');
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await apiService.deleteComment(commentId);
      setComments(prev => {
        const updated = prev.filter(comment => comment._id !== commentId);
        // For demo users, update localStorage
        if (user?.id?.startsWith('demo-')) {
          saveDemoComments(updated.filter(c => c._id.startsWith('demo-')));
        }
        return updated;
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  const canDeleteComment = (comment: Comment) => {
    if (!isLoggedIn || !user) return false;

    // Only admins can delete comments
    return user.role === 'admin';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getFullUrl = (url: string) => {
    if (url && url.startsWith('/uploads/')) {
      return `${BACKEND_BASE_URL}${url}`;
    }
    return url;
  };

  const handleCommentOptions = (comment: Comment) => {
    setSelectedComment(comment);
    setShowActionSheet(true);
  };

  const actionSheetButtons = [
    ...(canDeleteComment(selectedComment!) ? [{
      text: 'Delete Comment',
      role: 'destructive' as const,
      icon: trash,
      handler: () => {
        setCommentToDelete(selectedComment?._id || null);
        setShowDeleteAlert(true);
      },
    }] : []),
    {
      text: 'Cancel',
      role: 'cancel' as const,
    },
  ];

  return (
    <div className="comments-section">
      {isMinimized ? (
        <div style={{ height: '40px', backgroundColor: 'var(--ion-background-color)', border: '1px solid var(--ion-color-light-shade)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', borderRadius: '4px' }}>
          <span style={{ fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>Comments ({comments.length})</span>
          <IonButton fill="clear" size="small" onClick={() => setIsMinimized(false)}>
            <IonIcon icon={chevronUp} />
          </IonButton>
        </div>
      ) : (
        <div style={{ height: '400px', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--ion-background-color)', border: '1px solid var(--ion-color-light-shade)', borderRadius: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--ion-color-light-shade)' }}>
            <span style={{ fontWeight: '600', fontSize: '1em' }}>Comments ({comments.length})</span>
            <IonButton fill="clear" size="small" onClick={() => setIsMinimized(true)}>
              <IonIcon icon={chevronDown} />
            </IonButton>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <IonSpinner name="crescent" />
                <p>Loading comments...</p>
              </div>
            ) : sortedComments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ion-color-medium)' }}>
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              sortedComments.map((comment) => (
                <div key={comment._id} style={{ marginBottom: '8px', display: 'flex', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 'bold', marginRight: '8px', color: 'var(--ion-color-primary)' }}>{comment.user?.name || 'Unknown'}:</span>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start' }}>
                    <p style={{ margin: '0', whiteSpace: 'pre-wrap', lineHeight: '1.4', flex: 1 }}>{comment.content}</p>
                    {canDeleteComment(comment) && (
                      <IonButton fill="clear" size="small" onClick={() => handleCommentOptions(comment)} style={{ '--color': 'var(--ion-color-medium)', fontSize: '0.8em', marginLeft: '8px' }}>
                        <IonIcon icon={ellipsisVertical} />
                      </IonButton>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {isLoggedIn ? (
            <div style={{ padding: '8px 12px', borderTop: '1px solid var(--ion-color-light-shade)' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <IonTextarea
                  value={newComment}
                  onIonChange={(e) => setNewComment(e.detail.value!)}
                  placeholder="Say something..."
                  rows={1}
                  style={{ flex: 1, marginRight: '8px' }}
                />
                <IonButton
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                  size="default"
                >
                  {submitting ? <IonSpinner name="crescent" /> : <IonIcon icon={send} />}
                </IonButton>
              </div>
            </div>
          ) : (
            <div style={{ padding: '8px 12px', borderTop: '1px solid var(--ion-color-light-shade)', textAlign: 'center' }}>
              <IonText color="medium" style={{ fontSize: '0.8em' }}>
                <p>Please <a href="/signin" style={{ color: 'var(--ion-color-primary)', textDecoration: 'none', fontWeight: '600' }}>sign in</a> to join the chat.</p>
              </IonText>
            </div>
          )}
        </div>
      )}

      {/* Action Sheet for Comment Options */}
      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        buttons={actionSheetButtons}
      />

      {/* Delete Confirmation Alert */}
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => {
          setShowDeleteAlert(false);
          setCommentToDelete(null);
        }}
        header="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Delete',
            role: 'destructive',
            handler: () => {
              if (commentToDelete) {
                handleDeleteComment(commentToDelete);
              }
            },
          },
        ]}
      />
    </div>
  );
};

export default Comments;