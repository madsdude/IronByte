import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProblemStore } from '../../store/problemStore';
import Button from '../../components/ui/Button';
import { ArrowLeft, CheckCircle, Ticket, AlertTriangle, Link, Trash2 } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

const ProblemDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { fetchProblem, currentProblem, updateProblem, linkTicket, unlinkTicket, resolveProblem, deleteProblem, loading } = useProblemStore();

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ root_cause: '', resolution: '' });
    const [ticketIdToLink, setTicketIdToLink] = useState('');

    useEffect(() => {
        if (id) fetchProblem(id);
    }, [id]);

    useEffect(() => {
        if (currentProblem) {
            setEditForm({
                root_cause: currentProblem.root_cause || '',
                resolution: currentProblem.resolution || ''
            });
        }
    }, [currentProblem]);

    if (loading || !currentProblem) return <div className="p-8 text-center">Loading...</div>;

    const handleSave = async () => {
        if (!id) return;
        await updateProblem(id, editForm);
        setIsEditing(false);
    };

    const handleLink = async () => {
        if (!id || !ticketIdToLink) return;
        await linkTicket(id, ticketIdToLink);
        setTicketIdToLink('');
    };

    const handleResolve = async () => {
        if (!id || !currentProblem.resolution) {
            if (!currentProblem.resolution) alert('Please add a resolution before resolving.');
            return;
        }
        // if (confirm('This will resolve the Problem AND all linked tickets. Continue?')) {
        await resolveProblem(id, currentProblem.resolution);
        // }
    };

    const isResolved = currentProblem.status === 'resolved' || currentProblem.status === 'closed';

    return (
        <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex justify-between items-center">
                <Button variant="ghost" onClick={() => navigate('/problems')} iconLeft={<ArrowLeft className="h-4 w-4" />}>
                    Back to Problems
                </Button>
                {isResolved ? (
                    <Button variant="danger" onClick={async () => {
                        if (window.confirm('Are you sure you want to delete this problem?')) {
                            await deleteProblem(id!);
                            navigate('/problems');
                        }
                    }} iconLeft={<Trash2 className="h-4 w-4" />}>
                        Delete Problem
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="danger" onClick={async () => {
                            if (window.confirm('Are you sure you want to delete this problem?')) {
                                await deleteProblem(id!);
                                navigate('/problems');
                            }
                        }} iconLeft={<Trash2 className="h-4 w-4" />}>
                            Delete
                        </Button>
                        <Button variant="primary" onClick={handleResolve} iconLeft={<CheckCircle className="h-4 w-4" />}>
                            Resolve Problem
                        </Button>
                    </div>
                )}
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                <div className="px-4 py-5 sm:px-6 flex justify-between">
                    <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            {currentProblem.title}
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Created on {formatDate(new Date(currentProblem.created_at))}
                        </p>
                    </div>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full items-center h-6
                        ${isResolved ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                        {currentProblem.status}
                    </span>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                    <dl className="sm:divide-y sm:divide-gray-200">
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Description</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{currentProblem.description}</dd>
                        </div>

                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-gray-50">
                            <dt className="text-sm font-medium text-gray-500 flex items-center">
                                <AlertTriangle className="h-4 w-4 mr-2" /> Root Cause Analysis
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {isEditing ? (
                                    <textarea
                                        className="w-full border-gray-300 rounded-md shadow-sm p-2"
                                        rows={3}
                                        value={editForm.root_cause}
                                        onChange={e => setEditForm({ ...editForm, root_cause: e.target.value })}
                                        placeholder="Explain why this happened..."
                                    />
                                ) : (
                                    <p>{currentProblem.root_cause || 'Not analyzed yet.'}</p>
                                )}
                            </dd>
                        </div>

                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500 flex items-center">
                                <CheckCircle className="h-4 w-4 mr-2" /> Solution / Workaround
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {isEditing ? (
                                    <textarea
                                        className="w-full border-gray-300 rounded-md shadow-sm p-2"
                                        rows={3}
                                        value={editForm.resolution}
                                        onChange={e => setEditForm({ ...editForm, resolution: e.target.value })}
                                        placeholder="How do we fix it?"
                                    />
                                ) : (
                                    <p>{currentProblem.resolution || 'No resolution yet.'}</p>
                                )}
                            </dd>
                        </div>

                        {!isResolved && (
                            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                                {isEditing ? (
                                    <>
                                        <Button variant="ghost" onClick={() => setIsEditing(false)} className="mr-2">Cancel</Button>
                                        <Button variant="primary" onClick={handleSave}>Save Analysis</Button>
                                    </>
                                ) : (
                                    <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Analysis</Button>
                                )}
                            </div>
                        )}
                    </dl>
                </div>
            </div>

            {/* Linked Tickets */}
            <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                        <Ticket className="h-5 w-5 mr-2" /> Linked Incidents
                    </h3>
                    {!isResolved && (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Ticket ID..."
                                className="border-gray-300 rounded-md shadow-sm p-1 text-sm border"
                                value={ticketIdToLink}
                                onChange={e => setTicketIdToLink(e.target.value)}
                            />
                            <Button variant="outline" size="sm" onClick={handleLink} iconLeft={<Link className="h-4 w-4" />}>
                                Link
                            </Button>
                        </div>
                    )}
                </div>
                <ul className="divide-y divide-gray-200">
                    {currentProblem.tickets && currentProblem.tickets.length > 0 ? (
                        currentProblem.tickets.map((ticket: any) => (
                            <li key={ticket.id} className="px-4 py-4 sm:px-6 flex justify-between items-center hover:bg-gray-50">
                                <div onClick={() => navigate(`/tickets/${ticket.id}`)} className="cursor-pointer flex-1">
                                    <div className="flex items-center">
                                        <p className="text-sm font-medium text-blue-600 truncate">{ticket.title}</p>
                                        <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                            {ticket.status}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">#{ticket.id}</p>
                                </div>
                                {!isResolved && (
                                    <button onClick={() => id && unlinkTicket(id, ticket.id)} className="text-red-400 hover:text-red-500">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </li>
                        ))
                    ) : (
                        <li className="px-4 py-8 text-center text-gray-500">No linked incidents.</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default ProblemDetail;
