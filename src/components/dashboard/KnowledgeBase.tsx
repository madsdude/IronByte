import React, { useState } from 'react';
import { Search, BookOpen, ExternalLink } from 'lucide-react';
import { knowledgeBaseArticles } from '../../data/mockData';
import ReactMarkdown from 'react-markdown';

const KnowledgeBase: React.FC = () => {
  const [selectedArticle, setSelectedArticle] = useState<typeof knowledgeBaseArticles[0] | null>(null);

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
        <div className="flex items-center">
          <BookOpen className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Network Documentation
          </h3>
        </div>
        <button 
          type="button"
          className="inline-flex items-center p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100"
        >
          <Search className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Search knowledge base</span>
        </button>
      </div>
      
      {selectedArticle ? (
        <div className="p-4">
          <button
            onClick={() => setSelectedArticle(null)}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
          >
            ← Back to articles
          </button>
          <div className="prose max-w-none">
            <ReactMarkdown>{selectedArticle.content}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
            {knowledgeBaseArticles.map((article) => (
              <li key={article.id} className="hover:bg-gray-50 transition-colors duration-150">
                <button 
                  onClick={() => setSelectedArticle(article)}
                  className="w-full text-left block px-4 py-4 sm:px-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {article.title}
                        </p>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {article.category}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <span>{article.views} views</span>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200">
            <a 
              href="https://github.com/madsdude/Network"
              target="_blank"
              rel="noopener noreferrer" 
              className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center"
            >
              View full documentation
              <ExternalLink className="h-4 w-4 ml-1" />
            </a>
          </div>
        </>
      )}
    </div>
  );
};

export default KnowledgeBase;