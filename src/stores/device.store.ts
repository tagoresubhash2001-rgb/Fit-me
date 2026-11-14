/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';

interface DeviceConnection {
  id: string;
  name: string;
  connected: boolean;
  batteryLevel: number | null;
  lastSynced: string;
}

interface DeviceState {
  connections: DeviceConnection[];
  syncing: boolean;
  gpsActive: boolean;
  wearableHeartRate: number;
  toggleConnection: (id: string) => void;
  syncAllData: () => Promise<void>;
  toggleGps: () => void;
  updateWearableHeartRate: (bpm: number) => void;
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  connections: [
    { id: 'fitbit', name: 'Fitbit Sense 3 Pro', connected: true, batteryLevel: 82, lastSynced: 'Just Now' },
    { id: 'healthkit', name: 'Apple HealthKit Sandbox', connected: false, batteryLevel: null, lastSynced: '1 hour ago' },
    { id: 'ble_scale', name: 'BLE Organic Composition Scale', connected: false, batteryLevel: 100, lastSynced: 'Yesterday' },
  ],
  syncing: false,
  gpsActive: false,
  wearableHeartRate: 72,

  toggleConnection: (id) => {
    set((state) => ({
      connections: state.connections.map((c) => (c.id === id ? { ...c, connected: !c.connected, lastSynced: 'Just Now' } : c)),
    }));
  },

  syncAllData: async () => {
    set({ syncing: true });
    // Simulate smart synchronization
    await new Promise((resolve) => setTimeout(resolve, 1200));
    set((state) => ({
      syncing: false,
      connections: state.connections.map((c) => (c.connected ? { ...c, lastSynced: 'Just Now' } : c)),
    }));
  },

  toggleGps: () => {
    set((state) => ({ gpsActive: !state.gpsActive }));
  },

  updateWearableHeartRate: (bpm) => {
    set({ wearableHeartRate: bpm });
  },
}));
