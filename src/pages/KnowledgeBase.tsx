import React from 'react';
import { knowledgeBaseArticles } from '../data/mockData';
import KnowledgeBase from '../components/dashboard/KnowledgeBase';

const KnowledgeBasePage: React.FC = () => {
  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="pb-5 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">Knowledge Base</h1>
        <p className="mt-2 text-sm text-gray-500">
          Browse helpful articles and guides
        </p>
      </div>

      <div className="mt-6">
        <KnowledgeBase />
      </div>
    </div>
  );
};

export default KnowledgeBasePage;