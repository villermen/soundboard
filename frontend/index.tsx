import { createRoot } from 'react-dom/client';

import App from './components/App';
import './init-fontawesome';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
