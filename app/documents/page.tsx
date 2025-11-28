import type { FC } from 'react'
import React from 'react'
import DocumentTemplates from '@/app/components/tools/document-templates'
import Navigation from '@/app/components/navigation'
import PageAuthGuard from '@/app/components/page-auth-guard'
import ErrorBoundary from '@/app/components/error-boundary'

const DocumentsPage: FC = () => {
  return (
    <ErrorBoundary>
      <PageAuthGuard requireAuth={true}>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200">
          <Navigation />
          
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6 border-b">
                <div>
                  <h2 className="text-3xl font-bold text-purple-800 mb-2">
                    📄 文书模板库
                  </h2>
                  <p className="text-purple-700">
                    标准法律文书模板库，包含各类常用法律文书格式
                  </p>
                </div>
              </div>

              <div className="p-6">
                <DocumentTemplates />
              </div>
            </div>
          </div>
        </div>
      </PageAuthGuard>
    </ErrorBoundary>
  )
}

export default DocumentsPage
