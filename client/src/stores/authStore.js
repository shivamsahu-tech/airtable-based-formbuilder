import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null, 
  isAuthenticated: false,
  isLoading: true, 

  setUser: (userData) => {
    console.log("Setting user in store:", userData);
    if(!userData) return;
    set({ user: userData.id, isAuthenticated: !!userData, isLoading: false });
  },
  setLoading: (status) => set({ isLoading: status }),
  logout: () => {
    set({ user: null, isAuthenticated: false, isLoading: false });
  }
}));

export default useAuthStore;