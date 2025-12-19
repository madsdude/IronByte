import React, { useEffect, useState } from 'react';
import { useProblemStore } from '../../store/problemStore';
import Button from '../../components/ui/Button';
import { Plus, AlertTriangle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/dateUtils';

const ProblemList: React.FC = () => {
    const { problems, fetchProblems, loading, createProblem, deleteProblem } = useProblemStore();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProblemTitle, setNewProblemTitle] = useState('');
    const [newProblemDesc, setNewProblemDesc] = useState('');

    useEffect(() => {
        fetchProblems();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        await createProblem({ title: newProblemTitle, description: newProblemDesc });
        setIsModalOpen(false);
        setNewProblemTitle('');
        setNewProblemDesc('');
    };

    return (
        <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Problem Management</h1>
                    <p className="mt-1 text-sm text-gray-500">Track root causes and known errors.</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => setIsModalOpen(true)}
                    iconLeft={<Plus className="h-4 w-4" />}
                >
                    New Problem
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading problems...</div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {problems.length === 0 ? (
                            <li className="px-4 py-8 text-center text-gray-500">No problems found.</li>
                        ) : (
                            problems.map((problem) => (
                                <li key={problem.id}>
                                    <div
                                        onClick={() => navigate(`/problems/${problem.id}`)}
                                        className="block hover:bg-gray-50 cursor-pointer"
                                    >
                                        <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center truncate">
                                                    <AlertTriangle className={`h-5 w-5 mr-3 ${problem.status === 'resolved' ? 'text-green-500' : 'text-orange-500'}`} />
                                                    <p className="text-sm font-medium text-blue-600 truncate">{problem.title}</p>
                                                </div>
                                                <div className="flex items-center">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            if (window.confirm('Are you sure you want to delete this problem?')) {
                                                                deleteProblem(problem.id);
                                                            }
                                                        }}
                                                        className="ml-4 mr-2 text-gray-400 hover:text-red-500 relative z-10"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                    <div className="ml-2 flex-shrink-0 flex">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${problem.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                                                problem.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                                                                    'bg-orange-100 text-orange-800'}`}>
                                                            {problem.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-2 sm:flex sm:justify-between">
                                                <div className="sm:flex">
                                                    <p className="flex items-center text-sm text-gray-500">
                                                        {problem.ticket_count || 0} Linked Incidents
                                                    </p>
                                                </div>
                                                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                    <p>Created {formatDate(new Date(problem.created_at))}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}

            {/* Simple Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium mb-4">Create New Problem</h3>
                        <form onSubmit={handleCreate}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Title</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    required
                                    value={newProblemTitle}
                                    onChange={e => setNewProblemTitle(e.target.value)}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    required
                                    value={newProblemDesc}
                                    onChange={e => setNewProblemDesc(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button variant="primary" type="submit">Create</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProblemList;
