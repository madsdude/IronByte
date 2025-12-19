import React, { useState, useEffect } from 'react';
import { X, Edit2, Check, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import { useAuthStore } from '../../store/authStore';
import { KBArticle, useKBStore } from '../../store/kbStore';
// import ReactMarkdown from 'react-markdown'; // Assuming react-markdown is available based on package.json

interface ArticleModalProps {
    article: KBArticle | null;
    isOpen: boolean;
    onClose: () => void;
    mode: 'view' | 'create' | 'edit';
}

const ArticleModal: React.FC<ArticleModalProps> = ({ article, isOpen, onClose, mode: initialMode }) => {
    const [mode, setMode] = useState(initialMode);
    const [formData, setFormData] = useState({ title: '', content: '', category: '' });
    const { user } = useAuthStore();
    const { addArticle, updateArticle, deleteArticle } = useKBStore();

    useEffect(() => {
        setMode(initialMode);
    }, [initialMode, isOpen]);

    useEffect(() => {
        if (article) {
            setFormData({
                title: article.title,
                content: article.content,
                category: article.category || ''
            });
        } else {
            setFormData({ title: '', content: '', category: '' });
        }
    }, [article, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (mode === 'create') {
                await addArticle(formData);
                onClose();
            } else if (mode === 'edit' && article) {
                await updateArticle(article.id, formData);
                setMode('view');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to save article');
        }
    };

    const handleDelete = async () => {
        if (!article) return;
        try {
            await deleteArticle(article.id);
            onClose();
        } catch (error) {
            alert('Failed to delete article');
        }
    };

    const isEditor = mode === 'create' || mode === 'edit';
    const canEdit = user && (user.role === 'admin' || user.role === 'technician' || (article && user.id === article.author_id));

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-semibold text-gray-900">
                        {mode === 'create' ? 'New Article' : (isEditor ? 'Edit Article' : article?.title)}
                    </h3>
                    <div className="flex items-center space-x-2">
                        {mode === 'view' && canEdit && (
                            <>
                                <Button variant="ghost" onClick={() => setMode('edit')} iconLeft={<Edit2 className="h-4 w-4" />}>
                                    Edit
                                </Button>
                                <Button variant="danger" onClick={handleDelete} iconLeft={<Trash2 className="h-4 w-4" />}>
                                    Delete
                                </Button>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 focus:outline-none"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {isEditor ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Title</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Category</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="">Select Category...</option>
                                <option value="Hardware">Hardware</option>
                                <option value="Software">Software</option>
                                <option value="Network">Network</option>
                                <option value="Security">Security</option>
                                <option value="General">General</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Content (Markdown)</label>
                            <textarea
                                required
                                rows={15}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border font-mono"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder="# Heaading&#10;Write your solution here..."
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button type="button" variant="ghost" onClick={mode === 'create' ? onClose : () => setMode('view')}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="primary" iconLeft={<Check className="h-4 w-4" />}>
                                Save Article
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                            {/* In a real app we would use <ReactMarkdown>{article?.content}</ReactMarkdown> */}
                            {article?.content}
                        </div>

                        <div className="pt-4 border-t text-sm text-gray-500 flex justify-between">
                            <span>Category: {article?.category}</span>
                            <span>Author: {article?.author_name || article?.author_email || 'Unknown'}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ArticleModal;
