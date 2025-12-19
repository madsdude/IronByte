import React, { useEffect, useState } from 'react';
import { useCIStore, ConfigurationItem } from '../store/ciStore';
import Button from '../components/ui/Button';
import { Search, Plus, Server, Database, Monitor, Box, Trash2 } from 'lucide-react';

export default function ConfigurationItems() {
    const { cis, loading, error, fetchCIs, addCI, deleteCI } = useCIStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState<Partial<ConfigurationItem>>({
        name: '',
        type: 'server',
        status: 'active',
        description: '',
        location: ''
    });

    useEffect(() => {
        fetchCIs();
    }, []);

    const handleOpenModal = () => {
        setFormData({
            name: '',
            type: 'server',
            status: 'active',
            description: '',
            location: ''
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addCI(formData);
            handleCloseModal();
        } catch (err) {
            console.error('Failed to create CI', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this Configuration Item? This cannot be undone.')) {
            await deleteCI(id);
        }
    };

    const filteredCIs = cis.filter(ci =>
        ci.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ci.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getTypeIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'server': return <Server className="h-5 w-5 text-blue-500" />;
            case 'database': return <Database className="h-5 w-5 text-green-500" />;
            case 'application': return <Box className="h-5 w-5 text-purple-500" />;
            default: return <Monitor className="h-5 w-5 text-gray-500" />;
        }
    };

    return (
        <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Configuration Items</h1>
                <Button onClick={handleOpenModal} iconLeft={<Plus className="h-4 w-4" />}>
                    New Item
                </Button>
            </div>

            {error && (
                <div className="mb-4 bg-red-50 p-4 rounded-md text-red-700">
                    {error}
                </div>
            )}

            {/* Search Bar */}
            <div className="mb-6 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Search CIs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* CI List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                {loading ? (
                    <div className="p-4 text-center text-gray-500">Loading CIs...</div>
                ) : filteredCIs.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">
                        No configuration items found. Create one to get started.
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {filteredCIs.map((ci) => (
                            <li key={ci.id} className="block hover:bg-gray-50">
                                <div className="flex items-center px-4 py-4 sm:px-6">
                                    <div className="min-w-0 flex-1 flex items-center">
                                        <div className="flex-shrink-0 mr-4">
                                            {getTypeIcon(ci.type)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-blue-600 truncate">{ci.name}</div>
                                            <div className="mt-2 flex">
                                                <div className="flex items-center text-sm text-gray-500 mr-6">
                                                    <span className="capitalize px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                        {ci.type}
                                                    </span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <span className={`capitalize px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ci.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {ci.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <button
                                            onClick={() => handleDelete(ci.id)}
                                            className="text-gray-400 hover:text-red-500"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed z-10 inset-0 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handleSubmit}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Create Configuration Item</h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Name</label>
                                            <input
                                                required
                                                type="text"
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Type</label>
                                            <select
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                value={formData.type}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            >
                                                <option value="server">Server</option>
                                                <option value="database">Database</option>
                                                <option value="application">Application</option>
                                                <option value="software">Software</option>
                                                <option value="hardware">Hardware</option>
                                                <option value="network">Network</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Status</label>
                                            <select
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                            >
                                                <option value="active">Active</option>
                                                <option value="maintenance">Maintenance</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="retired">Retired</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Location</label>
                                            <input
                                                type="text"
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Description</label>
                                            <textarea
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                rows={3}
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <Button type="submit" className="w-full sm:ml-3 sm:w-auto">
                                        Create
                                    </Button>
                                    <Button type="button" variant="outline" onClick={handleCloseModal} className="mt-3 w-full sm:mt-0 sm:w-auto">
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
