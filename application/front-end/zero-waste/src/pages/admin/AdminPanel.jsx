import React from "react";
import PostCard from "../../components/features/PostCard";

import { useTheme } from "../../providers/ThemeContext";
import { useLanguage } from "../../providers/LanguageContext";
import { useAdminReports } from "../../hooks/useAdminReports";

function AdminPanel() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { currentTheme } = useTheme();
  const { t } = useLanguage();

  const {
    items: posts,
    loading,
    error,
    currentPage,
    totalPages,
    nextPage,
    previousPage,
    handleNextPage,
    handlePreviousPage,
    deleteItem
  } = useAdminReports('posts');

  const handleDelete = async (post_id) => {
    if (!window.confirm(t('admin.confirmDelete', 'Are you sure you want to delete this post?'))) return;
    try {
      await deleteItem(post_id, "delete_media");
    } catch (e) {
      alert(t('admin.deleteFailed', "Failed to delete post."));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6" style={{ color: currentTheme.text }}>
      <header className="mb-6 border-b pb-4" style={{ borderColor: currentTheme.border }}>
        <h1 className="text-2xl font-bold" style={{ color: currentTheme.text }}>
          {t('admin.postModeration', 'Board Post Moderation')}
        </h1>
        <p className="mt-2 text-sm opacity-70">
          {t('admin.managePosts', 'Review and manage reported posts.')}
        </p>
      </header>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* Loading spinner */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: currentTheme.secondary }}></div>
        </div>
      ) : (
        <>
          {/* Posts list */}
          <div className="flex flex-col items-center">
            {posts.length === 0 ? (
              <div className="p-8 text-center opacity-70 bg-gray-50 rounded-lg w-full" style={{ backgroundColor: currentTheme.hover }}>
                {t('admin.noPosts', 'No reported posts found.')}
              </div>
            ) : (
              posts.map((post) => {
                // Construct full image URL if it's a relative path
                let imageUrl = post.content?.image;
                if (imageUrl && !imageUrl.startsWith('http')) {
                  imageUrl = `${apiUrl}${imageUrl}`;
                }

                return (
                  <PostCard
                    key={post.id}
                    image={imageUrl || "https://via.placeholder.com/400x300?text=No+Image"}
                    title={t('admin.reportedPost', "Reported Post")}
                    description={post.content?.text ?? t('common.noContent', "No content")}
                    reportReason={post.reason}
                    reportDescription={post.description}
                    onDelete={() => handleDelete(post.id)}
                  />
                );
              })
            )}
          </div>

          {/* Pagination controls */}
          {posts.length > 0 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={handlePreviousPage}
                disabled={!previousPage || currentPage === 1}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${!previousPage || currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                style={{ backgroundColor: currentTheme.secondary, color: '#fff' }}
              >
                {t('common.previous', 'Previous')}
              </button>
              <span className="font-bold">
                {t('common.page', 'Page')} {currentPage} {t('common.of', 'of')} {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={!nextPage || currentPage >= totalPages}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${!nextPage || currentPage >= totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                style={{ backgroundColor: currentTheme.secondary, color: '#fff' }}
              >
                {t('common.next', 'Next')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminPanel;