import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import queryString from "query-string";
import axios from "axios";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/callback" element={<Redirect />} />
      </Routes>
    </Router>
  );
}

const authenticate = ({ client_id }) => {
  const queries = {
    response_type: "code",
    client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
    scope: "user-read-email",
    redirect_uri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI,
  };
  location.assign(
    `https://accounts.spotify.com/authorize?${queryString.stringify(queries)}`
  );
};

const getRefreshToken = async ({
  authorizationCode,
  redirect_uri,
  authB64,
}) => {
  const params = {
    grant_type: "authorization_code",
    code: authorizationCode,
    redirect_uri: redirect_uri,
  };

  const config = {
    headers: {
      Authorization: `Basic ${authB64}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };

  const {
    data: { refresh_token },
  } = await axios.post(
    "https://accounts.spotify.com/api/token",
    params,
    config
  );

  return refresh_token;
};

const getAccessToken = async ({ refreshToken, authB64 }) => {
  const params = {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  };

  const config = {
    headers: {
      Authorization: `Basic ${authB64}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };

  const {
    data: { access_token },
  } = await axios.post(
    "https://accounts.spotify.com/api/token",
    params,
    config
  );

  return access_token;
};

const Home = () => {
  const [authorization, setAuthorization] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [user, setUser] = useState(null);
  const client_id = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const client_secret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
  const redirect_uri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
  const authB64 = btoa(`${client_id}:${client_secret}`);

  useEffect(() => {
    const authorizationCode = window.localStorage.getItem("authorization");
    const refresh_token = window.localStorage.getItem("refresh_token");
    const localUser = window.localStorage.getItem("user");

    if (authorizationCode) {
      setAuthorization(authorizationCode);
    }

    if (refresh_token) {
      setRefreshToken(refresh_token);
    }

    if (localUser) {
      setUser(localUser);
    }
  }, []);

  useEffect(() => {
    const start = async () => {
      const refresh_token = await getRefreshToken({
        authorizationCode: authorization,
        redirect_uri,
        authB64,
        token: "refresh",
      });

      window.localStorage.setItem("refresh_token", refresh_token);
      setRefreshToken(refresh_token);
    };

    authorization && !refreshToken && start();
  }, [authorization]);

  useEffect(() => {
    const getUser = async () => {
      const access_token = await getAccessToken({
        refreshToken,
        authB64,
      });

      const config = {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      };

      const res = await axios.get("https://api.spotify.com/v1/me", config);

      window.localStorage.setItem("user", res.data);
      setUser(res.data);
    };

    authorization && refreshToken && getUser();
  }, [refreshToken]);

  return (
    <main className="flex justify-center items-center h-screen">
      {!authorization && (
        <button
          className="border-indigo-500/100 border-2 p-2 rounded"
          onClick={authenticate}
        >
          Login with Spotify
        </button>
      )}

      {user && <span>You are Authorized: {user.display_name}</span>}
    </main>
  );
};

const Redirect = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    window.localStorage.setItem("authorization", searchParams.get("code"));
    navigate("/");
  }, []);

  return (
    <main className="flex justify-center items-center h-screen">
      redirecting...
    </main>
  );
};

export default App;
