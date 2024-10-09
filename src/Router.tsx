import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import MainPage from './MainPage';

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/board" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
