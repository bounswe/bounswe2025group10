import apiClient from "./api";

const adminService = {
    /**
     * Fetch paginated reports for moderation.
     * Backend: ModerateReportsViewSet (admin_panel_views.py)
     * URL: /api/admin/reports/
     * * @param {number} page - Page number (default 1)
     * @param {string} type - Filter by content type (post, comment, tip, challenge)
     * @param {number} reporterId - Filter by reporter user ID
     * @param {number} pageSize - Items per page (default 20)
     */
    getReports: async (page = 1, type = null, reporterId = null, pageSize = 20) => {
        const params = {
            page,
            page_size: pageSize
        };

        if (type) params.type = type;
        if (reporterId) params.reporter_id = reporterId;

        return apiClient.get(`/api/admin/reports/`, { params });
    },

    /**
     * Moderate a specific report (Ban user, Delete media, Ignore).
     * Backend: ModerateReportsViewSet.moderate (admin_panel_views.py)
     * URL: /api/admin/reports/{id}/moderate/
     * * @param {number} id - The ID of the Report object
     * @param {string} action - 'delete_media' | 'ban_user' | 'ignore'
     */
    moderateReport: async (id, action) => {
        // Validates against ModerationActionSerializer
        return apiClient.post(`/api/admin/reports/${id}/moderate/`, { action });
    },

    /**
     * Fetch system-wide ActivityPub events.
     * Backend: ActivityEventViewSet (activity_view.py)
     * URL: /api/activity-events/
     * Note: Returns ActivityStreams 2.0 format { items: [], totalItems: N }
     * * @param {number} page - Page number
     * @param {object} filters - Filtering options
     */
    getActivityEvents: async (page = 1, filters = {}) => {
        // Supported filters from ActivityEventViewSet.filterset_fields
        const {
            actor_id,
            type,           // e.g., 'create-waste', 'like-post'
            object_type,
            object_id,
            community_id,
            visibility,
            startDate,      // maps to published_at__gte
            endDate,        // maps to published_at__lte
            search,         // maps to summary search
            ordering,       // e.g., '-published_at'
            pageSize = 15
        } = filters;

        const params = {
            page,
            page_size: pageSize,
            actor_id,
            type,
            object_type,
            object_id,
            community_id,
            visibility,
            search,
            ordering
        };

        // Map date range to django filters
        if (startDate) params['published_at__gte'] = startDate;
        if (endDate) params['published_at__lte'] = endDate;

        // Clean undefined/null/empty params
        Object.keys(params).forEach(key => {
            if (params[key] === '' || params[key] === null || params[key] === undefined) {
                delete params[key];
            }
        });

        return apiClient.get('/api/activity-events/', { params });
    }
};

export default adminService;