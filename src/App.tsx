/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from './store';
import { router } from './router';
import { FirebaseProvider } from './components/FirebaseProvider';

export default function App() {
  return (
    <Provider store={store}>
      <FirebaseProvider>
        <RouterProvider router={router} />
      </FirebaseProvider>
    </Provider>
  );
}
