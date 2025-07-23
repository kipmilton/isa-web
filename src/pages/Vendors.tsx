
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Vendors = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/");
  }, [navigate]);
  return null;
};

export default Vendors;
