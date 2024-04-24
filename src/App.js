import logo from "./logo.svg";
import "./App.css";
import { Routes, Route } from "react-router-dom";
import { Mail } from "./Pages/Mail";
import { Signin } from "./Pages/Signin";
import { ToastContainer } from 'react-toastify';
  import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <div>
    <ToastContainer />
      <Routes>
        <Route path="/" element={<Signin />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/mail" element={<Mail />} />
      </Routes>
    </div>
  );
}

export default App;
