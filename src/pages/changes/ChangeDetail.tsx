import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChangeStore } from '../../store/changeStore';
import { useAuthStore } from '../../store/authStore';
import { useCIStore } from '../../store/ciStore';
import Button from '../../components/ui/Button';
import { ArrowLeft, CheckCircle, XCircle, Calendar, Server, Play } from 'lucide-react';
import { format } from 'date-fns';

export default function ChangeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { change, fetchChange, updateChange, approveChange, linkCI, unlinkCI, loading } = useChangeStore();
    const { user } = useAuthStore();

    // CI Linking state
    const { cis, fetchCIs } = useCIStore();
    const [selectedCI, setSelectedCI] = useState('');
    const [isLinkingCI, setIsLinkingCI] = useState(false);

    useEffect(() => {
        if (id) {
            fetchChange(id);
            fetchCIs();
        }
    }, [id, fetchChange, fetchCIs]);

    if (loading || !change) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    const handleApprove = async () => {
        if (confirm('Are you sure you want to approve this change?')) {
            await approveChange(change.id, user?.id);
        }
    };

    const handleUpdateStatus = async (status: any) => {
        await updateChange(change.id, { status });
    };

    const handleLinkCI = async () => {
        if (!selectedCI) return;
        await linkCI(change.id, selectedCI);
        setIsLinkingCI(false);
        setSelectedCI('');
    };

    const statusSteps = ['draft', 'requested', 'approved', 'in-progress', 'completed'];
    const currentStepIndex = statusSteps.indexOf(change.status);

    return (
        <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-6 flex justify-between items-center">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/changes')}
                    iconLeft={<ArrowLeft className="h-4 w-4" />}
                >
                    Back
                </Button>
                <div className="flex gap-2">
                    {change.status === 'requested' && (user?.role === 'admin' || user?.role === 'agent') && (
                        <Button variant="primary" onClick={handleApprove} iconLeft={<CheckCircle className="h-4 w-4" />}>
                            Approve
                        </Button>
                    )}
                    {change.status === 'approved' && (
                        <Button variant="primary" onClick={() => handleUpdateStatus('in-progress')} iconLeft={<Play className="h-4 w-4" />}>
                            Start Implementation
                        </Button>
                    )}
                    {change.status === 'in-progress' && (
                        <Button variant="primary" onClick={() => handleUpdateStatus('completed')} iconLeft={<CheckCircle className="h-4 w-4" />}>
                            Complete
                        </Button>
                    )}
                    {(change.status === 'requested' || change.status === 'approved') && (
                        <Button variant="danger" onClick={() => handleUpdateStatus('cancelled')} iconLeft={<XCircle className="h-4 w-4" />}>
                            Cancel
                        </Button>
                    )}
                </div>
            </div>

            {/* Progress Stepper */}
            <div className="mb-8">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
                    {statusSteps.map((step, index) => {
                        const isCompleted = index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex;
                        return (
                            <div key={step} className="flex flex-col items-center bg-gray-50 px-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isCompleted ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                                    }`}>
                                    {index + 1}
                                </div>
                                <span className={`text-xs mt-1 uppercase ${isCurrent ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
                                    {step}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {change.title}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        {change.id}
                    </p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">

                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Type</dt>
                            <dd className="mt-1 text-sm text-gray-900 uppercase">{change.type}</dd>
                        </div>

                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Priority</dt>
                            <dd className="mt-1 text-sm text-gray-900 uppercase">{change.priority}</dd>
                        </div>

                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Risk</dt>
                            <dd className="mt-1 text-sm text-gray-900 uppercase">{change.risk}</dd>
                        </div>

                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Requested By</dt>
                            <dd className="mt-1 text-sm text-gray-900">{change.requestor_name || 'Unknown'}</dd>
                        </div>

                        {change.approver_name && (
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Approved By</dt>
                                <dd className="mt-1 text-sm text-gray-900">{change.approver_name}</dd>
                            </div>
                        )}

                        <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500">Description</dt>
                            <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{change.description}</dd>
                        </div>

                        <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500">Impact Analysis</dt>
                            <dd className="mt-1 text-sm text-gray-900">{change.impact || 'Not specified'}</dd>
                        </div>

                        <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500">Backout Plan</dt>
                            <dd className="mt-1 text-sm text-gray-900">{change.backout_plan || 'Not specified'}</dd>
                        </div>

                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500 flex items-center">
                                <Calendar className="h-4 w-4 mr-1" /> Scheduled Start
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {change.scheduled_start ? format(new Date(change.scheduled_start), 'PPpp') : 'Not scheduled'}
                            </dd>
                        </div>

                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500 flex items-center">
                                <Calendar className="h-4 w-4 mr-1" /> Scheduled End
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {change.scheduled_end ? format(new Date(change.scheduled_end), 'PPpp') : 'Not scheduled'}
                            </dd>
                        </div>

                    </dl>
                </div>
            </div>

            {/* Linked CIs */}
            <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Affected CIs</h3>
                    <button
                        onClick={() => setIsLinkingCI(!isLinkingCI)}
                        className="text-sm text-blue-600 hover:text-blue-900"
                    >
                        + Link CI
                    </button>
                </div>

                {isLinkingCI && (
                    <div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
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
                            <Button variant="primary" onClick={handleLinkCI} disabled={!selectedCI}>Link</Button>
                        </div>
                    </div>
                )}

                <ul className="divide-y divide-gray-200">
                    {/* @ts-ignore */}
                    {change.cis && change.cis.length > 0 ? change.cis.map((ci: any) => (
                        <li key={ci.id} className="px-4 py-4 flex items-center justify-between">
                            <div className="flex items-center">
                                <Server className="h-5 w-5 text-gray-400 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{ci.name}</p>
                                    <p className="text-xs text-gray-500">{ci.type} - {ci.status}</p>
                                </div>
                            </div>
                            <button onClick={() => unlinkCI(change.id, ci.id)} className="text-red-600 hover:text-red-900 text-sm">Remove</button>
                        </li>
                    )) : (
                        <li className="px-4 py-4 text-sm text-gray-500 italic">No CIs linked to this change.</li>
                    )}
                </ul>
            </div>

        </div>
    );
}
