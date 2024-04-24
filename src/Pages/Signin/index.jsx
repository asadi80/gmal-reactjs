import { useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { MDBContainer } from "mdb-react-ui-kit";

export const Signin = () => {
  const navigate = useNavigate();
  const login = useGoogleLogin({
    scope: "https://mail.google.com/",
    onSuccess: (codeResponse) => {
      console.log(codeResponse);
      localStorage.setItem("items", JSON.stringify(codeResponse.access_token));
      navigate("/mail");
    },
  });
  return (
    <MDBContainer
      fluid
      className="w-100  d-flex align-items-center justify-content-center"
    >
    <button type="button" class="login-with-google-btn" onClick={() => login()}>
    Sign in with Google
  </button>
  
    </MDBContainer>
  );
};
