import { BrowserRouter, Routes, Route } from "react-router";
import HomePage from "@/pages/HomePage";
import ListPage from "@/pages/ListPage";
import SitePage from "@/pages/SitePage";
import AccountPage from "@/pages/AccountPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import NotFoundPage from "@/pages/NotFoundPage";
//import AuthLayout from "@/layouts/AuthLayout";

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="list" element={<ListPage />} />
        <Route path="list:tag" element={<ListPage />} />
        <Route path="site/:id" element={<SitePage />} />
        <Route path="account" element={<AccountPage />} />
        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};
export default Router;
