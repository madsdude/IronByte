import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { TicketComment } from '../../types';
import { formatDistance } from '../../utils/dateUtils';
import Button from '../ui/Button';
import { Send, Trash2 } from 'lucide-react';

interface CommentSectionProps {
  ticketId: string;
  comments: TicketComment[];
  onAddComment: (content: string) => Promise<void>;
  onDeleteTicket?: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  ticketId,
  comments,
  onAddComment,
  onDeleteTicket
}) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const user = useAuthStore(state => state.user);
  const { users, fetchUser } = useUserStore();

  // Fetch user info for all comment authors
  React.useEffect(() => {
    comments.forEach(comment => {
      fetchUser(comment.userId);
    });
  }, [comments, fetchUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment);
      setNewComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Comments</h3>

      <div className="space-y-4 mb-6">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm">No comments yet</p>
        ) : (
          comments.map((comment) => {
            const author = users[comment.userId];
            return (
              <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-800">
                      {author?.displayName?.charAt(0) || author?.email?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {author?.displayName || author?.email || 'Unknown User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistance(new Date(comment.createdAt))}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {comment.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      {user && (
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="mb-4">
            <label htmlFor="comment" className="sr-only">
              Add a comment
            </label>
            <textarea
              id="comment"
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
          </div>
          <div className="flex justify-between items-center">
            {onDeleteTicket && (
              isDeleting ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-red-600">Are you sure?</span>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={onDeleteTicket}
                  >
                    Confirm
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDeleting(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => setIsDeleting(true)}
                  iconLeft={<Trash2 className="h-4 w-4" />}
                >
                  Delete Ticket
                </Button>
              )
            )}
            <Button
              type="submit"
              variant="primary"
              disabled={!newComment.trim() || isSubmitting}
              isLoading={isSubmitting}
              iconRight={<Send className="h-4 w-4" />}
            >
              Add Comment
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CommentSection;