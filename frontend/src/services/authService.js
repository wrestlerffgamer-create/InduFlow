import { api } from "./api";

export const loginUser = async (email, password) => {
  return api("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

};

export const logoutUser = () => {
  localStorage.removeItem("token");
};
