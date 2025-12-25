import { Routes, Route } from 'react-router-dom';
import { WalletLayout } from './components/layout';
import {
  DashboardPage,
  SendPage,
  ReceivePage,
  HistoryPage,
  AddressesPage,
  DustPage,
  SettingsPage,
} from './pages';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<WalletLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="send" element={<SendPage />} />
        <Route path="receive" element={<ReceivePage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="addresses" element={<AddressesPage />} />
        <Route path="dust" element={<DustPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
