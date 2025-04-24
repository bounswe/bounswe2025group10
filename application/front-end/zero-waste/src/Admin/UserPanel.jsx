import React from "react";
import { useContext } from "react";
import { Nav } from "react-bootstrap";
import { useAuth } from "../Login/AuthContent";









function UserPanel(){

  const {token} =useAuth()

    function Sidebar() {
        return (
          <div style={{ height: "100vh", width: "250px", backgroundColor: "#f8f9fa", padding: "1rem", position: "fixed" }}>
            <h5>My App</h5>
            <Nav defaultActiveKey="/home" className="flex-column">
              <Nav.Link href="/adminPage">Home</Nav.Link>
              <Nav.Link href="/challengePage">Profile</Nav.Link>
              <Nav.Link href="/postPage">Settings</Nav.Link>
              <Nav.Link href="/commentPage">Settings</Nav.Link>
            </Nav>
          </div>
        );
      }

    return(
        <div>
            <Sidebar>

            </Sidebar>
        </div>
    )


}
export default UserPanel
