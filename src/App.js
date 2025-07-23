// src/App.js
import React, { useEffect, useState } from "react";
import LoginForm from "./components/LoginForm";
import AutoClicker from "./components/AutoClicker";
import SelectorForm from "./components/SelectorForm";

function App() {
  const [user, setUser] = useState(null);
  const [branch, setBranch] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("auth");
    if (savedUser) setUser(JSON.parse(savedUser));

    // กรณีอยากเก็บ session branch/date/time ด้วย
    const savedBranch = localStorage.getItem("branch");
    const savedDate = localStorage.getItem("date");
    const savedTime = localStorage.getItem("time");

    if (savedBranch) setBranch(savedBranch);
    if (savedDate) setDate(savedDate);
    if (savedTime) setTime(savedTime);
  }, []);

  // เก็บค่าใน localStorage ทุกครั้งที่ state เปลี่ยน
  useEffect(() => {
    if (branch) localStorage.setItem("branch", branch);
  }, [branch]);

  useEffect(() => {
    if (date) localStorage.setItem("date", date);
  }, [date]);

  useEffect(() => {
    if (time) localStorage.setItem("time", time);
  }, [time]);

  const handleLogout = () => {
    localStorage.removeItem("auth");
    setUser(null);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      {user ? (
        <>
          <h2>👋 Welcome, {user.username}</h2>
          <button onClick={handleLogout}>Logout</button>

          <SelectorForm
            branch={branch}
            setBranch={setBranch}
            date={date}
            setDate={setDate}
            time={time}
            setTime={setTime}
          />

          <hr />

          <AutoClicker branch={branch} date={date} time={time} />
        </>
      ) : (
        <LoginForm onLogin={setUser} />
      )}
    </div>
  );
}

export default App;
