import React, { useEffect, useState } from 'react';
import { Plus, Search, BookOpen, User } from 'lucide-react';
import Button from '../components/ui/Button';
import { useKBStore, KBArticle } from '../store/kbStore';
import { useAuthStore } from '../store/authStore';
import ArticleModal from '../components/kb/ArticleModal';

const KnowledgeBasePage: React.FC = () => {
  const { articles, fetchArticles, loading } = useKBStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit'>('view');

  useEffect(() => {
    // Debounce search could be added here
    const timer = setTimeout(() => {
      fetchArticles(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchArticles]);

  const handleOpenArticle = (article: KBArticle) => {
    setSelectedArticle(article);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleCreateArticle = () => {
    setSelectedArticle(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Knowledge Base</h1>
          <p className="mt-1 text-sm text-gray-500">Find solutions and guides</p>
        </div>

        <div className="flex w-full sm:w-auto gap-3">
          <div className="relative flex-grow sm:flex-grow-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full sm:w-64 pl-10 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {user && (user.role === 'admin' || user.role === 'technician') && (
            <Button variant="primary" iconLeft={<Plus className="h-4 w-4" />} onClick={handleCreateArticle}>
              New Article
            </Button>
          )}
        </div>
      </div>

      {loading && articles.length === 0 ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <div
              key={article.id}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
              onClick={() => handleOpenArticle(article)}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {article.category || 'General'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(article.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">{article.title}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-3 w-full">
                  {article.content.substring(0, 150)}...
                </p>

                <div className="flex items-center text-xs text-gray-500 mt-auto pt-4 border-t border-gray-100">
                  <User className="h-3 w-3 mr-1" />
                  <span>{article.author_name || article.author_email || 'Author'}</span>
                </div>
              </div>
            </div>
          ))}

          {!loading && articles.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No articles found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search terms or create a new article.</p>
            </div>
          )}
        </div>
      )}

      <ArticleModal
        article={selectedArticle}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
      />
    </div>
  );
};

export default KnowledgeBasePage;