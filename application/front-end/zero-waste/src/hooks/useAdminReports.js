import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import { useLanguage } from '../providers/LanguageContext';

export function useAdminReports(type) {
    const { t } = useLanguage();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [nextPage, setNextPage] = useState(null);
    const [previousPage, setPreviousPage] = useState(null);

    const fetchItems = async (page = 1) => {
        setLoading(true);
        setError(null);
        try {
            const response = await adminService.getReports(type, page);
            setItems(response.data.results || []);
            setNextPage(response.data.next);
            setPreviousPage(response.data.previous);
            if (response.data.count) {
                setTotalPages(Math.ceil(response.data.count / 10));
            }
        } catch (err) {
            console.error(`Failed to fetch ${type}:`, err);
            setError(t('admin.failedToLoad', 'Failed to load items.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems(currentPage);
    }, [currentPage]);

    const handleNextPage = () => {
        if (nextPage && currentPage < totalPages) setCurrentPage(p => p + 1);
    };

    const handlePreviousPage = () => {
        if (previousPage && currentPage > 1) setCurrentPage(p => p - 1);
    };

    const deleteItem = async (id, action = 'delete_media') => {
        try {
            await adminService.moderateReport(id, action);
            // fetchItems(currentPage); // Let the caller decide when to reload or just reload here
            // Actually, better to reload here ensures sync
            fetchItems(currentPage);
        } catch (err) {
            console.error('Delete failed', err);
            throw err;
        }
    };

    return {
        items,
        loading,
        error,
        currentPage,
        totalPages,
        nextPage,
        previousPage,
        handleNextPage,
        handlePreviousPage,
        deleteItem,
        reload: () => fetchItems(currentPage)
    };
}
