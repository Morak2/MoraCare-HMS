import React, { createContext, useContext } from 'react';
import { Outlet } from 'react-router-dom';

export const SubscriptionContext = createContext({ status: 'active' });
export const useSubscription = () => useContext(SubscriptionContext);

export default function SubscriptionGuard() {
    return (
        <SubscriptionContext.Provider value={{ status: 'active' }}>
            <Outlet />
        </SubscriptionContext.Provider>
    );
}