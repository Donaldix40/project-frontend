import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";

import YoutubeTranscribeGenerator from "./components/YoutubeTranscribe/YoutubeTranscribe";

function App() {
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={<YoutubeTranscribeGenerator />}
        />
      </Routes>
    </>
  );
}

export default App;
