import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from './store';
import { router } from './router';
import { AuthProvider } from './components/AuthProvider';
import { CatalogProvider } from './components/CatalogProvider';
import { YandexMapsProvider } from './maps/YandexMapsProvider';

export default function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <CatalogProvider>
          <YandexMapsProvider>
            <RouterProvider router={router} />
          </YandexMapsProvider>
        </CatalogProvider>
      </AuthProvider>
    </Provider>
  );
}
