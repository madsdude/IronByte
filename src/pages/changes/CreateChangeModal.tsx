import React, { useState, useEffect } from 'react';
import Button from '../../components/ui/Button'; // Adjusted path
import { X } from 'lucide-react';
import { useChangeStore } from '../../store/changeStore'; // Adjusted path
import { api } from '../../lib/api';

interface CreateChangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    linkedProblemId?: string | null;
}

const CreateChangeModal: React.FC<CreateChangeModalProps> = ({ isOpen, onClose, linkedProblemId }) => {
    const { createChange, linkProblem } = useChangeStore();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'standard',
        priority: 'low',
        risk: 'low',
        impact: '',
        backout_plan: '',
        scheduled_start: '',
        scheduled_end: '',
        assigned_approver_id: ''
    });

    useEffect(() => {
        if (isOpen) {
            api.get('/users').then(setUsers).catch(console.error);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        console.log('Submitting form data:', formData);

        // Sanitize payload
        const payload = {
            ...formData,
            scheduled_start: formData.scheduled_start === '' ? null : formData.scheduled_start,
            scheduled_end: formData.scheduled_end === '' ? null : formData.scheduled_end,
            assigned_approver_id: formData.assigned_approver_id === '' ? null : formData.assigned_approver_id
        };

        try {
            const newChange = await createChange(payload as any);

            if (linkedProblemId) {
                await linkProblem(newChange.id, linkedProblemId);
            }

            onClose();
            // Reset form (optional)
        } catch (error: any) {
            console.error('Create Change Error:', error);
            alert(`Failed to create change: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
                </div>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Create Change Request</h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Title</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    required
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Type</label>
                                    <select
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="standard">Standard</option>
                                        <option value="normal">Normal</option>
                                        <option value="emergency">Emergency</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                                    <select
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        value={formData.priority}
                                        onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Risk</label>
                                    <select
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        value={formData.risk}
                                        onChange={e => setFormData({ ...formData, risk: e.target.value })}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Impact Analysis</label>
                                <textarea
                                    rows={2}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    value={formData.impact}
                                    onChange={e => setFormData({ ...formData, impact: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Backout Plan</label>
                                <textarea
                                    rows={2}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    value={formData.backout_plan}
                                    onChange={e => setFormData({ ...formData, backout_plan: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Assign Approver</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    value={formData.assigned_approver_id}
                                    onChange={e => setFormData({ ...formData, assigned_approver_id: e.target.value })}
                                >
                                    <option value="">Select an Approver (Optional)</option>
                                    {users.filter(u => u.role === 'admin' || u.role === 'technician').map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.display_name} ({user.role})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                                    <input
                                        type="datetime-local"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        value={formData.scheduled_start}
                                        onChange={e => setFormData({ ...formData, scheduled_start: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">End Time</label>
                                    <input
                                        type="datetime-local"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        value={formData.scheduled_end}
                                        onChange={e => setFormData({ ...formData, scheduled_end: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-full sm:col-start-2"
                                    isLoading={loading}
                                >
                                    Create
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="mt-3 w-full sm:mt-0 sm:col-start-1"
                                    onClick={onClose}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateChangeModal;
