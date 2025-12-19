import React, { useEffect } from 'react';
import { useChangeStore } from '../../store/changeStore';
import { Plus, ArrowRight, Calendar, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { format } from 'date-fns';

import CreateChangeModal from './CreateChangeModal';

export default function ChangeList() {
    const { changes, fetchChanges, loading } = useChangeStore();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    useEffect(() => {
        fetchChanges();
    }, [fetchChanges]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'in-progress': return 'bg-blue-100 text-blue-800';
            case 'requested': return 'bg-yellow-100 text-yellow-800';
            case 'failed': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Change Management</h1>
                    <p className="mt-1 text-sm text-gray-500">Plan, approve, and track changes to IT infrastructure.</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => setIsModalOpen(true)}
                    iconLeft={<Plus className="h-4 w-4" />}
                >
                    New Change Request
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul role="list" className="divide-y divide-gray-200">
                        {changes.length === 0 ? (
                            <li className="px-4 py-8 text-center text-gray-500">
                                No active change requests found.
                            </li>
                        ) : changes.map((change) => (
                            <li key={change.id}>
                                <Link to={`/changes/${change.id}`} className="block hover:bg-gray-50">
                                    <div className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center truncate">
                                                <p className="text-sm font-medium text-blue-600 truncate">{change.title}</p>
                                                <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(change.status)} uppercase`}>
                                                    {change.status}
                                                </span>
                                            </div>
                                            <div className="ml-2 flex-shrink-0 flex">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${change.type === 'emergency' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {change.type}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-2 sm:flex sm:justify-between">
                                            <div className="sm:flex">
                                                <p className="flex items-center text-sm text-gray-500">
                                                    <AlertTriangle className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                    Risk: {change.risk}
                                                </p>
                                                {change.scheduled_start && (
                                                    <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                        {format(new Date(change.scheduled_start), 'MMM d, yyyy HH:mm')}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                <p>
                                                    Requested by {change.requestor_name || 'Unknown'}
                                                </p>
                                                <ArrowRight className="ml-2 h-4 w-4 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <CreateChangeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}
