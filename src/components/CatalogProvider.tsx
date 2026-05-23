import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useCatalogItems } from '../api/hooks/useCatalogItems';
import { setCatalogItems } from '../store/authSlice';

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const { items, isLoading } = useCatalogItems();

  useEffect(() => {
    if (!isLoading && items.length > 0) {
      dispatch(setCatalogItems(items));
    }
  }, [dispatch, isLoading, items]);

  return <>{children}</>;
};
