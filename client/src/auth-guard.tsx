import { PropsWithChildren, useEffect, useState } from "react";
import ky from "ky";
import { User } from "./model";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { userAtom } from "./atoms";

export default function AuthGuard(props: PropsWithChildren) {
  const [user, setUser] = useAtom(userAtom);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    ky.get("/api/me")
      .json<User>()
      .then((response) => {
        setUser(response);
        setLoading(false);
      })
      .catch((e) => {
        navigate("/login", {});
      });
  }, []);

  if (loading) {
    return <></>;
  }

  return <>{props.children}</>;
}
