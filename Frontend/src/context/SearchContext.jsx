import React, { createContext, useContext } from "react";

export const SearchContext = createContext({
  searchText: "",
  setSearchText: () => {},
});

export const useSearch = () => useContext(SearchContext);
