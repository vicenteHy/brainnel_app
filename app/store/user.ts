import { create } from "zustand";
import { User,UserSettings } from "../services/api/userApi";


interface UserState {
  user: User;
  settings: UserSettings;
  setUser: (user: User) => void;
  setSettings: (settings: UserSettings) => void;
  clearUser: () => void;
}


const useUserStore = create<UserState>((set) => ({
  user: {} as User,
  settings: {} as UserSettings,
  setUser: (user: User) => set({ user }),
  setSettings: (settings: UserSettings) => set({ settings }),
  clearUser: () => set({ user: {} as User, settings: {} as UserSettings }),
}));

export default useUserStore;

