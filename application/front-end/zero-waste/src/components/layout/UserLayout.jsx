import React from 'react';
import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';

const UserLayout = () => {
    return (
        <Navbar>
            <Outlet />
        </Navbar>
    );
};

export default UserLayout;
