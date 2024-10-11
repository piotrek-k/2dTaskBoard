import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import MainPage from './MainPage';
import CardDetailsStandalone from './components/CardDetailsStandalone';
import CardDetailsStandaloneContainer from './components/CardDetailsStandaloneContainer';

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/board" element={<App />} />
        <Route path="/task/:taskId" element={<CardDetailsStandaloneContainer />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
