import { create } from 'zustand';

export type Route =
  | 'welcome'
  | 'create-wallet'
  | 'import-wallet'
  | 'seed-phrase'
  | 'set-password'
  | 'unlock'
  | 'dashboard'
  | 'send'
  | 'send-amount'
  | 'send-address'
  | 'send-confirm'
  | 'receive'
  | 'activity'
  | 'settings'
  | 'connected-sites'
  | 'security';

export type Tab = 'wallet' | 'activity' | 'settings';

interface UIState {
  route: Route;
  previousRoute: Route | null;
  activeTab: Tab;
  isOnboarded: boolean;
  selectedToken: string | null;
  sendAmount: string;
  sendAddress: string;
  isLoading: boolean;
  pendingSeedPhrase: string | null;

  setRoute: (route: Route) => void;
  goBack: () => void;
  setActiveTab: (tab: Tab) => void;
  setOnboarded: (value: boolean) => void;
  setSelectedToken: (token: string | null) => void;
  setSendAmount: (amount: string) => void;
  setSendAddress: (address: string) => void;
  setLoading: (loading: boolean) => void;
  resetSendFlow: () => void;
  setPendingSeedPhrase: (seed: string | null) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  route: 'welcome',
  previousRoute: null,
  activeTab: 'wallet',
  isOnboarded: false,
  selectedToken: null,
  sendAmount: '',
  sendAddress: '',
  isLoading: false,

  setRoute: (route) => set({ route, previousRoute: get().route }),

  goBack: () => {
    const { previousRoute } = get();
    if (previousRoute) {
      set({ route: previousRoute, previousRoute: null });
    }
  },

  setActiveTab: (tab) => {
    const routeMap: Record<Tab, Route> = {
      wallet: 'dashboard',
      activity: 'activity',
      settings: 'settings',
    };
    set({ activeTab: tab, route: routeMap[tab] });
  },

  setOnboarded: (value) => set({ isOnboarded: value }),
  setSelectedToken: (token) => set({ selectedToken: token }),
  setSendAmount: (amount) => set({ sendAmount: amount }),
  setSendAddress: (address) => set({ sendAddress: address }),
  setLoading: (loading) => set({ isLoading: loading }),

  resetSendFlow: () =>
    set({ selectedToken: null, sendAmount: '', sendAddress: '' }),

  pendingSeedPhrase: null,
  setPendingSeedPhrase: (seed) => set({ pendingSeedPhrase: seed }),
}));
