import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import UploadPage from "./pages/Upload";
import RunPage from "./pages/Run";
import DashboardPage from "./pages/Dashboard";
import ReviewPage from "./pages/Review";
import BenchmarkPage from "./pages/Benchmark";
import HistoryPage from "./pages/History";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/upload" replace />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/run" element={<RunPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/benchmark" element={<BenchmarkPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </Layout>
  );
}
