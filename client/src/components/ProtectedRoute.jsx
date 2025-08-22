// import { useNavigate } from "react-router-dom";

// import Spinner from "./Spinner"; //create spinner
// import { useEffect } from "react";


export default function ProtectedRoute({ children }) {
  // const navigation = useNavigate();
  // const { user, isLoadingUserData } = useUser(); //create hook

  // useEffect(() => {
  //   if (!user && !isLoadingUserData) return navigation("/login");
  // }, [user, isLoadingUserData, navigation])

  // if (isLoadingUserData)
  //   return (
  //     <main>
  //       <Spinner />
  //     </main>
  //   );


  // if (user) return children;
  return children
}
