/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from './store';
import { router } from './router';
import { AuthProvider } from './components/AuthProvider';
import { CatalogProvider } from './components/CatalogProvider';

export default function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <CatalogProvider>
          <RouterProvider router={router} />
        </CatalogProvider>
      </AuthProvider>
    </Provider>
  );
}
