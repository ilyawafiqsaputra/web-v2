/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layout } from './components/Layout';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { CatalogPage } from './pages/CatalogPage';
import { CirculationPage } from './pages/CirculationPage';
import { DashboardPage } from './pages/DashboardPage';
import { MemberCardPage } from './pages/MemberCardPage';
import { MemberDetailPage } from './pages/MemberDetailPage';
import { MembersPage } from './pages/MembersPage';
import { ReceiptPage } from './pages/ReceiptPage';
import { SettingsPage } from './pages/SettingsPage';

const PageRouter: React.FC = () => {
  const { route } = useLibrary();

  switch (route) {
    case 'dashboard':
      return <DashboardPage />;
    case 'catalog':
      return <CatalogPage />;
    case 'circulation':
      return <CirculationPage />;
    case 'members':
      return <MembersPage />;
    case 'member-detail':
      return <MemberDetailPage />;
    case 'member-card':
      return <MemberCardPage />;
    case 'receipt':
      return <ReceiptPage />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <CirculationPage />;
  }
};

export default function App() {
  return (
    <LibraryProvider>
      <Layout>
        <PageRouter />
      </Layout>
    </LibraryProvider>
  );
}
