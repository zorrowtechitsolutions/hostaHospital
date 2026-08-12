// EmailHistory.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useGetEmailsQuery,
  useSendDraftMutation,
  useDeleteDraftMutation,
  useDuplicateEmailMutation,
  useResendEmailMutation,
  useArchiveEmailMutation,
  useUnarchiveEmailMutation
} from '../../../app/service/emailnotification';
import { getHospitalId } from '../../utils/auth';
import { Pagination } from '../ui/Pagination';
import { showErrorToast, showSuccessToast } from '../ui/Toast';

// Import skeleton
const EmailHistorySkeleton = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-7 w-7 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="mt-2">
          <div className="h-9 w-full bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
      <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-3 w-64 bg-gray-200 rounded animate-pulse mt-1"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const EmailHistory = () => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEmailId, setSelectedEmailId] = useState(null);

  const hospitalId = getHospitalId();

  const BACKEND_STATUS = {
    all: undefined,
    draft: 'DRAFT',
    sent: 'SUCCESS',
    failed: 'FAILED',
    archived: 'ARCHIVED',
  };

  const { data: emailsData, isLoading, refetch } = useGetEmailsQuery({
    hospitalId: hospitalId,
    status: BACKEND_STATUS[filterStatus],
    search_query: searchQuery,
    page: currentPage,
    limit: 10,
    isArchived: filterStatus === 'archived' ? true : undefined,
  });

  // Mutation hooks
  const [sendDraftApi] = useSendDraftMutation();
  const [deleteDraftApi] = useDeleteDraftMutation();
  const [duplicateEmailApi] = useDuplicateEmailMutation();
  const [resendEmailApi] = useResendEmailMutation();
  const [archiveEmailApi] = useArchiveEmailMutation();
  const [unarchiveEmailApi] = useUnarchiveEmailMutation();

  const emails = emailsData?.data || [];
  const pagination = emailsData?.pagination;

  const getStatusBadge = (status) => {
    const normalizedStatus = String(status || '').toLowerCase();
    const styles = {
      sent: 'bg-green-100 text-green-700',
      success: 'bg-green-100 text-green-700',
      draft: 'bg-slate-100 text-slate-600',
      failed: 'bg-red-100 text-red-700',
      archived: 'bg-slate-100 text-slate-500',
    };
    return styles[normalizedStatus] || 'bg-slate-100 text-slate-600';
  };

  const getStatusLabel = (status) => {
    const normalizedStatus = String(status || '').toLowerCase();
    const labels = {
      sent: 'Sent',
      success: 'Sent',
      draft: 'Draft',
      failed: 'Failed',
      archived: 'Archived',
    };
    return labels[normalizedStatus] || status || 'Draft';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getEmailPreview = (email) => {
    const preview = email.message?.replace(/<[^>]*>/g, '') || '';
    return preview.length > 100 ? preview.substring(0, 100) + '...' : preview;
  };

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1);
    setSelectedEmailId(null);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
    setSelectedEmailId(null);
  };

  // Navigation with email data via React Router state
  const navigateToCompose = (email) => {
    navigate('/email-notifications', {
      state: {
        editEmail: email,
      },
    });
  };

  const goBackToComposer = () => {
    navigate('/email-notifications');
  };

  // Handler: Send Draft
  const handleSendDraft = async (id) => {
    try {
      await sendDraftApi({ id }).unwrap();
      showSuccessToast('Draft sent successfully!');
      setSelectedEmailId(null);
      await refetch();
    } catch (error) {
      showErrorToast(
        error?.data?.message ||
        error?.error ||
        'Failed to send draft.'
      );
    }
  };

  // Handler: Delete Draft
  const handleDeleteDraft = async (id) => {

    try {
      await deleteDraftApi(id).unwrap();
      showSuccessToast('Draft deleted successfully!');
      setSelectedEmailId(null);
      await refetch();
    } catch (error) {
      showErrorToast(
        error?.data?.message ||
        error?.error ||
        'Failed to delete draft.'
      );
    }
  };

  // Handler: Duplicate Email
  const handleDuplicateEmail = async (id) => {
    try {
      const result = await duplicateEmailApi(id).unwrap();
      showSuccessToast('Email duplicated successfully!');
      setSelectedEmailId(null);

      const duplicatedEmail = result?.data || result;

      if (duplicatedEmail?.id) {
        navigate('/email-notifications', {
          state: {
            editEmail: duplicatedEmail,
          },
        });
      } else {
        await refetch();
      }
    } catch (error) {
      showErrorToast(
        error?.data?.message ||
        error?.error ||
        'Failed to duplicate email.'
      );
    }
  };

  // Handler: Resend Email
  const handleResendEmail = async (id) => {
    try {
      await resendEmailApi({ id }).unwrap();
      showSuccessToast('Email resent successfully!');
      setSelectedEmailId(null);
      await refetch();
    } catch (error) {
      showErrorToast(
        error?.data?.message ||
        error?.error ||
        'Failed to resend email.'
      );
    }
  };

  // Handler: Archive Email
  const handleArchiveEmail = async (id) => {
    try {
      await archiveEmailApi(id).unwrap();
      showSuccessToast('Email archived successfully!');
      setSelectedEmailId(null);
      await refetch();
    } catch (error) {
      showErrorToast(
        error?.data?.message ||
        error?.error ||
        'Failed to archive email.'
      );
    }
  };

  // Handler: Unarchive Email
  const handleUnarchiveEmail = async (id) => {
    try {
      await unarchiveEmailApi(id).unwrap();
      showSuccessToast('Email unarchived successfully!');
      setSelectedEmailId(null);
      await refetch();
    } catch (error) {
      showErrorToast(
        error?.data?.message ||
        error?.error ||
        'Failed to unarchive email.'
      );
    }
  };

  if (isLoading) {
    return <EmailHistorySkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
            <span>📨</span> Email History
          </h1>
        </div>
        <button
          onClick={goBackToComposer}
          className="px-4 py-2 text-black rounded-lg text-sm font-medium transition flex items-center gap-2 border border-slate-300 hover:bg-slate-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Email Composer
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                All Emails
                <span className="text-xs text-slate-400 font-normal">
                  ({pagination?.total || 0} items)
                </span>
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={handleFilterChange}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              >
                <option value="all">All</option>
                <option value="draft">Drafts</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
                <option value="archived">Archived</option>
              </select>
              <button
                onClick={() => refetch()}
                className="p-1.5 text-slate-400 hover:text-slate-600 transition"
                title="Refresh"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
          <div className="mt-2">
            <input
              type="text"
              placeholder="Search emails by subject or recipient..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            />
          </div>
        </div>

        <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100">
          {emails.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              <div className="text-4xl mb-2">📭</div>
              <p>No emails found</p>
              <p className="text-xs mt-1">
                {filterStatus !== 'all' 
                  ? `No ${filterStatus} emails match your criteria` 
                  : 'Try adjusting your filters or search'}
              </p>
            </div>
          ) : (
            emails.map((email) => {
              const normalizedStatus = String(email.status || '').toLowerCase();
              const isDraft = normalizedStatus === 'draft';
              const isSent = normalizedStatus === 'sent' || normalizedStatus === 'success';
              const isFailed = normalizedStatus === 'failed';
              const isArchived = email.isArchived === true || normalizedStatus === 'archived';

              return (
                <div
                  key={email.id}
                  className={`p-4 hover:bg-slate-50 transition cursor-pointer ${
                    selectedEmailId === email.id ? 'bg-indigo-50 border-l-4 border-indigo-500 shadow-sm' : ''
                  }`}
                  onClick={() => setSelectedEmailId(selectedEmailId === email.id ? null : email.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {email.subject || '(No subject)'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(email.status)}`}>
                          {getStatusLabel(email.status)}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDate(email.sentAt || email.createdAt)}
                        </span>
                        <span className="text-xs text-slate-400">
                          {email.recipients?.length || 0} recipients
                        </span>
                        {email.recipients?.length > 0 && (
                          <span className="text-xs text-slate-400 truncate max-w-[150px]">
                            {email.recipients.map(r => 
                              r.userIds?.length || 0
                            ).reduce((a, b) => a + b, 0)} users
                          </span>
                        )}
                      </div>
                      {email.message && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {getEmailPreview(email)}
                        </p>
                      )}
                    </div>
                    {isArchived && (
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-2">
                        Archived
                      </span>
                    )}
                  </div>

                  {selectedEmailId === email.id && (
                    <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap gap-2">
                      {/* Draft Actions */}
                      {isDraft && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateToCompose(email);
                            }}
                            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 transition flex items-center gap-1.5"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendDraft(email.id);
                            }}
                            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 transition flex items-center gap-1.5"
                          >
                            📤 Send
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDraft(email.id);
                            }}
                            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-100 transition flex items-center gap-1.5"
                          >
                            🗑️ Delete
                          </button>
                        </>
                      )}

                      {/* Sent Actions */}
                      {isSent && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateEmail(email.id);
                            }}
                            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-100 transition flex items-center gap-1.5"
                          >
                            📋 Duplicate
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResendEmail(email.id);
                            }}
                            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 transition flex items-center gap-1.5"
                          >
                            🔄 Resend
                          </button>
                          {!isArchived && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArchiveEmail(email.id);
                              }}
                              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-100 transition flex items-center gap-1.5"
                            >
                              📦 Archive
                            </button>
                          )}
                        </>
                      )}

                      {/* Failed Actions */}
                      {isFailed && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResendEmail(email.id);
                            }}
                            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 transition flex items-center gap-1.5"
                          >
                            🔄 Retry
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateEmail(email.id);
                            }}
                            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-100 transition flex items-center gap-1.5"
                          >
                            📋 Duplicate
                          </button>
                        </>
                      )}

                      {/* Archived Actions */}
                      {isArchived && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnarchiveEmail(email.id);
                          }}
                          className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 transition flex items-center gap-1.5"
                        >
                          📤 Unarchive
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEmailId(null);
                        }}
                        className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition ml-auto"
                      >
                        ✕ Close
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {pagination && pagination.pages > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.pages}
            onPageChange={setCurrentPage}
            totalItems={pagination.total}
            itemsPerPage={10}
            className="rounded-b-xl"
          />
        )}
      </div>
    </div>
  );
};

export default EmailHistory;