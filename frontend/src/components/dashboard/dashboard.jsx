import React, { useContext, useState, useCallback, useEffect } from "react";
import { useHistory } from 'react-router-dom';
import { store } from 'state-management';
import { logoutUserAction } from "state-management/actions/authActions";

const Dashboard = () => {
  const { state, dispatch } = useContext(store);
  const logoutUser = useCallback((...args) => logoutUserAction(dispatch)(...args), [dispatch]);
  const [ userData, setUserData ] = useState(state.user);
  const history = useHistory();

  console.log(state);
  useEffect(() => {
    setUserData(state.user);
  }, [state, state.user]);

  const onLogoutClick = useCallback(event => {
    event.preventDefault();
    history.push("/");
    logoutUser();
  }, [logoutUser, history]);


  return (
    <div style={{ height: "75vh" }} className="container valign-wrapper">
      Welcome {`${userData.username}`} how are you! how's your family doing? {"<open groupme>"}
      <div className="row">
        <div className="col s12 center-align">
          <h4>
            <b>Hey there,</b> {userData.firstName}
            <p className="flow-text grey-text text-darken-1">
              You are logged into a full-stack{" "}
              <span style={{ fontFamily: "monospace" }}>MERN</span> app 👏
            </p>
          </h4>
          <button
            style={{
              width: "150px",
              borderRadius: "3px",
              letterSpacing: "1.5px",
              marginTop: "1rem"
            }}
            onClick={onLogoutClick}
            className="btn btn-large waves-effect waves-light hoverable blue accent-3"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
