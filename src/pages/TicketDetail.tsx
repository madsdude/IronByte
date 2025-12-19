import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTicketStore } from '../store/ticketStore';
import { useAuthStore } from '../store/authStore';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { ArrowLeft, Clock, XCircle, CheckCircle, User, Play } from 'lucide-react';
import { formatDate, formatTime } from '../utils/dateUtils';
import { api } from '../lib/api';
// import { useUserStore } from '../store/userStore'; // assuming userStore is refactored
import CommentSection from '../components/tickets/CommentSection';
import { TicketComment } from '../types';
import { useCIStore } from '../store/ciStore';
import { Server, Trash2, Plus, AlertTriangle } from 'lucide-react';
import SLATimer from '../components/tickets/SLATimer';
import { Link } from 'react-router-dom';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, updateTicket, linkCI, unlinkCI, fetchTicket] = useTicketStore((state) => [
    state.tickets.find((t) => t.id === id),
    state.updateTicket,
    state.linkCI,
    state.unlinkCI,
    state.fetchTicket
  ]);
  const user = useAuthStore((state) => state.user);

  const [showAssignmentConfirmation, setShowAssignmentConfirmation] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; email: string; display_name?: string }>>([]);
  // const { users, fetchUser } = useUserStore();
  const [selectedUserId, setSelectedUserId] = useState<string>(ticket?.assigned_to || '');
  const [comments, setComments] = useState<TicketComment[]>([]);

  // CI State
  const { cis, fetchCIs } = useCIStore();
  const [selectedCI, setSelectedCI] = useState('');
  const [isLinkingCI, setIsLinkingCI] = useState(false);

  useEffect(() => {
    fetchCIs();
    if (id) fetchTicket(id);
  }, [id]);

  useEffect(() => {
    const fetchComments = async () => {
      if (!id) return;

      try {
        const data = await api.get(`/tickets/${id}/comments`);

        setComments(data.map((comment: any) => ({
          id: comment.id,
          ticketId: comment.ticket_id,
          userId: comment.user_id,
          content: comment.content,
          createdAt: comment.created_at,
          updatedAt: comment.updated_at
        })));

      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };

    fetchComments();
  }, [id]);

  const handleAddComment = async (content: string) => {
    if (!user || !id) return;

    try {
      const data = await api.post(`/tickets/${id}/comments`, { content });

      const newComment: TicketComment = {
        id: data.id,
        ticketId: data.ticket_id,
        userId: data.user_id,
        content: data.content,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setComments(prev => [...prev, newComment]);
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await api.get('/users');
        // Filter users to only show technicians and admins
        const techsAndAdmins = Array.isArray(users) ? users.filter((u: any) => {
          const r = u.role?.toLowerCase();
          return r === 'technician' || r === 'admin';
        }) : [];
        console.log('Filtered Users:', techsAndAdmins);
        setAvailableUsers(techsAndAdmins);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);



  useEffect(() => {
    if (ticket?.assigned_to) {
      setSelectedUserId(ticket.assigned_to);
    }
  }, [ticket?.assigned_to]);

  const handleCloseTicket = () => {
    if (ticket) {
      updateTicket(ticket.id, { status: 'closed' });
    }
  };

  const handleResolveTicket = () => {
    if (ticket) {
      updateTicket(ticket.id, { status: 'resolved' });
    }
  };

  const handleStartProgress = () => {
    if (ticket) {
      updateTicket(ticket.id, { status: 'in-progress' });
    }
  };

  const handleAssignTicket = async () => {
    if (!ticket || !selectedUserId) return;

    try {
      await updateTicket(ticket.id, { assigned_to: selectedUserId });

      // Find the assigned user from the availableUsers array
      const assignedUser = availableUsers.find(user => user.id === selectedUserId);

      // Update the local state with the assigned user data
      if (assignedUser) {
        setShowAssignmentConfirmation(true);
        setTimeout(() => setShowAssignmentConfirmation(false), 3000);
      }
    } catch (error) {
      console.error('Failed to assign ticket:', error);
    }
  };

  const handleDeleteTicket = async () => {
    if (!ticket || !id) return;

    try {
      await api.delete(`/tickets/${ticket.id}`);
      // Optionally update store to remove ticket
      // useTicketStore.setState((state) => ({ tickets: state.tickets.filter(t => t.id !== id) })); 
      // But navigating away triggers fetching usually or stales.

      navigate('/');
    } catch (error) {
      console.error('Failed to delete ticket:', error);
      alert('Failed to delete ticket');
    }
  };

  const handleLinkCI = async () => {
    if (!ticket || !selectedCI) return;
    try {
      await linkCI(ticket.id, selectedCI);
      setIsLinkingCI(false);
      setSelectedCI('');
    } catch (error) {
      console.error('Failed to link CI', error);
    }
  };

  const handleUnlinkCI = async (ciId: string) => {
    console.log('handleUnlinkCI called with:', ciId);
    if (!ticket) return;
    try {
      console.log('Calling unlinkCI store action...');
      await unlinkCI(ticket.id, ciId);
      console.log('unlinkCI store action completed.');
    } catch (error) {
      console.error('Failed to unlink CI', error);
      alert('Failed to unlink CI');
    }
  };

  if (!ticket) {
    return (
      <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Ticket not found</h2>
          <p className="mt-2 text-sm text-gray-500">
            The ticket you're looking for doesn't exist or has been removed.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const assignedUser = availableUsers.find(u => u.id === ticket.assigned_to);
  const submitter = availableUsers.find(u => u.id === ticket.submittedBy);
  const canAssign = user && ticket.status !== 'closed' && ticket.status !== 'resolved';

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          iconLeft={<ArrowLeft className="h-4 w-4" />}
        >
          Back
        </Button>

        {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
          <div className="flex gap-2">
            {ticket.status !== 'in-progress' && (
              <Button
                variant="primary"
                onClick={handleStartProgress}
                iconLeft={<Play className="h-4 w-4" />}
              >
                Start Progress
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleResolveTicket}
              iconLeft={<CheckCircle className="h-4 w-4" />}
            >
              Resolve Ticket
            </Button>
            <Button
              variant="danger"
              onClick={handleCloseTicket}
              iconLeft={<XCircle className="h-4 w-4" />}
            >
              Close Ticket
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {ticket.linked_problem && (
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-orange-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-orange-700">
                  This incident is linked to a known problem:{' '}
                  <Link to={`/problems/${ticket.linked_problem.id}`} className="font-medium underline hover:text-orange-600">
                    {ticket.linked_problem.title}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {ticket.title}
            </h2>
            <div className="flex items-center space-x-2">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              {ticket.sla_due_at && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                <SLATimer dueDate={ticket.sla_due_at} />
              )}
            </div>
          </div>
          <div className="mt-1 flex items-center text-sm text-gray-500">
            <CategoryBadge category={ticket.category} />
            <span className="ml-2">#{ticket.id}</span>
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Details</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Description</h4>
                  <p className="mt-2 text-sm text-gray-900">{ticket.description}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Category</h4>
                  <p className="mt-2 text-sm text-gray-900 capitalize">
                    {ticket.category.replace('-', ' ')}
                  </p>
                </div>

                {ticket.additionalFields && Object.keys(ticket.additionalFields).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Additional Information</h4>
                    <dl className="mt-2 space-y-2">
                      {Object.entries(ticket.additionalFields).map(([key, value]) => (
                        <div key={key}>
                          <dt className="text-sm text-gray-500 capitalize">{key.replace('_', ' ')}</dt>
                          <dd className="text-sm text-gray-900">{value as string}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {/* Submitted By */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Submitted by</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      {ticket.submittedBy ? (
                        <>
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-800">
                              {submitter?.display_name?.charAt(0) || submitter?.email?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {submitter?.display_name || submitter?.email || 'Unknown User'}
                            </p>
                            <p className="text-sm text-gray-700">{submitter?.email}</p>
                          </div>
                        </>
                      ) : (
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {ticket.additionalFields?.contact_email || 'Anonymous User'}
                          </p>
                          <p className="text-sm text-gray-700">
                            {ticket.additionalFields?.company || 'No company provided'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Configuration Items */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Configuration Items</h3>
                  <button
                    onClick={() => setIsLinkingCI(!isLinkingCI)}
                    className="text-sm text-blue-600 hover:text-blue-500 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Link CI
                  </button>
                </div>

                {isLinkingCI && (
                  <div className="mb-4 bg-gray-50 p-4 rounded-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select CI to Link</label>
                    <div className="flex gap-2">
                      <select
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={selectedCI}
                        onChange={(e) => setSelectedCI(e.target.value)}
                      >
                        <option value="">Select a CI...</option>
                        {cis.map((ci) => (
                          <option key={ci.id} value={ci.id}>
                            {ci.name} ({ci.type})
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="primary"
                        disabled={!selectedCI}
                        onClick={handleLinkCI}
                      >
                        Link
                      </Button>
                    </div>
                  </div>
                )}

                {ticket.cis && ticket.cis.length > 0 ? (
                  <div className="space-y-3">
                    {ticket.cis.map((ci: any) => (
                      <div key={ci.id} className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-md flex items-center justify-center text-blue-600">
                            <Server className="h-5 w-5" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{ci.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{ci.type} • {ci.status}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnlinkCI(ci.id)}
                          className="text-gray-400 hover:text-red-500"
                          title="Unlink CI"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No Configuration Items linked.</p>
                )}
              </div>

              {/* Assignment Dropdown */}
              {canAssign && (
                <div className="relative mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-4">
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="">Select user to assign</option>
                      {availableUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.display_name || user.email}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="primary"
                      onClick={handleAssignTicket}
                      disabled={!selectedUserId || selectedUserId === ticket.assigned_to}
                      iconLeft={<User className="h-4 w-4" />}
                    >
                      Assign Ticket
                    </Button>
                  </div>
                  {showAssignmentConfirmation && (
                    <div className="absolute top-0 left-0 right-0 -mt-8 flex items-center justify-center">
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium animate-fade-in-down">
                        ✓ Ticket assigned successfully
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900">Timeline</h3>
            <div className="mt-4 space-y-4">
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-500">Created:</span>
                <span className="ml-2 text-gray-900">
                  {formatDate(new Date(ticket.createdAt))} at {formatTime(new Date(ticket.createdAt))}
                </span>
              </div>

              {/* Assignment Status */}
              <div className="flex items-center text-sm">
                <User className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-500">Assignment:</span>
                {assignedUser ? (
                  <div className="ml-2 flex items-center">
                    <div className="h-6 w-6 rounded-full bg-blue-100 border border-white flex items-center justify-center mr-2">
                      <span className="text-xs font-medium text-blue-800">
                        {assignedUser.display_name?.charAt(0) || assignedUser.email.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">
                        {assignedUser.display_name || assignedUser.email}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="ml-2 text-gray-500 italic">Unassigned</span>
                )}
              </div>

              {ticket.dueDate && (
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-500">Due:</span>
                  <span className="ml-2 text-gray-900">
                    {formatDate(new Date(ticket.dueDate))} at {formatTime(new Date(ticket.dueDate))}
                  </span>
                </div>
              )}
            </div>

            {/* Assigned To Card */}
            {assignedUser && (
              <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-200 border-2 border-white flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-800">
                      {assignedUser.display_name?.charAt(0) || assignedUser.email.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-900">Currently assigned to</h4>
                    <p className="text-sm font-medium text-blue-700">
                      {assignedUser.display_name || assignedUser.email}
                    </p>
                    <p className="text-sm text-blue-600">{assignedUser.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <CommentSection
          ticketId={ticket.id}
          comments={comments}
          onAddComment={handleAddComment}
          onDeleteTicket={handleDeleteTicket}
        />
      </div>
    </div>
  );
}
