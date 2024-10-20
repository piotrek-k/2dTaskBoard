import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './pages/board/App';
import MainPage from './MainPage';
import CardDetailsStandaloneContainer from './pages/cardView/CardDetailsStandaloneContainer';

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/board" element={<App />} />
        <Route path="/card/:taskIdProp" element={<CardDetailsStandaloneContainer />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
