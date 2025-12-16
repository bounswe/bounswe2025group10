import apiClient from "./api";

const adminService = {
    getReports: async (type, page = 1) => {
        return apiClient.get(`/api/admin/reports/`, {
            params: { page, type }
        });
    },

    moderateReport: async (id, action) => {
        return apiClient.post(`/api/admin/reports/${id}/moderate/`, { action });
    },

    getActivityEvents: async (page = 1, filters = {}) => {
        const params = {
            page,
            page_size: 15,
            ...filters
        };
        // remove empty filters
        Object.keys(params).forEach(key => {
            if (params[key] === '' || params[key] === null || params[key] === undefined) {
                delete params[key];
            }
        });

        return apiClient.get('/api/activity-events/', { params });
    }
};

export default adminService;
