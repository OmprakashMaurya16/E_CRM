import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { SearchContext } from "../context/SearchContext";

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [searchText, setSearchText] = useState("");

  return (
    <SearchContext.Provider value={{ searchText, setSearchText }}>
      <div className="min-h-screen bg-gray-50">
        <Navbar setSidebarOpen={setSidebarOpen} />
        <div className="flex pt-16 h-[calc(100vh-4rem)] overflow-hidden">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
          <main className="flex-1 md:ml-64 px-6 md:px-10 lg:px-14 xl:px-20 py-6 h-full overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SearchContext.Provider>
  );
};

export default AppLayout;
