import React from 'react';
import Navbar from './Navbar';
import { useLanguage } from '../../providers/LanguageContext';
import { Outlet, useLocation } from 'react-router-dom';

const AdminLayout = () => {
    const { t } = useLanguage();
    const location = useLocation();

    const adminNavItems = [
        { key: 'adminPage', path: '/adminPage', icon: '📝', label: 'Post Moderation' },
        { key: 'challengePage', path: '/challengePage', icon: '🎯', label: 'Challenge Moderation' },
        { key: 'userPage', path: '/userPage', icon: '👤', label: 'User Moderation' },
        { key: 'commentPage', path: '/commentPage', icon: '💬', label: 'Comment Moderation' },
        { key: 'activityPage', path: '/activityPage', icon: '📊', label: 'Activities' },
    ];

    // Determine active item based on current path
    const activeItem = adminNavItems.find(item => location.pathname.startsWith(item.path));
    const activeKey = activeItem ? activeItem.key : 'adminPage';

    return (
        <Navbar active={activeKey} navItems={adminNavItems}>
            <Outlet />
        </Navbar>
    );
};

export default AdminLayout;
