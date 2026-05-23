import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUser, setLoading, User } from '../store/authSlice';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setLoading(true));

    const savedUser = localStorage.getItem('uraltour_user');
    if (savedUser) {
      try {
        const userData: User = JSON.parse(savedUser);
        dispatch(setUser(userData));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('uraltour_user');
        dispatch(setUser(null));
      }
    } else {
      dispatch(setUser(null));
    }

    dispatch(setLoading(false));
  }, [dispatch]);

  return <>{children}</>;
};
