import React from "react";

function AutoClicker() {
  const handleClick = () => {
    const button = document.querySelector(".MuiButton-root");

    if (button) {
      button.click();
      alert("✅ ปุ่มถูกคลิกเรียบร้อยแล้ว!");
    } else {
      alert("⚠️ ไม่พบปุ่ม .MuiButton-root ใน DOM");
    }
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <h3>🖱️ Auto-Clicker</h3>
      <button onClick={handleClick} style={styles.button}>
        คลิกปุ่มอัตโนมัติ (.MuiButton-root)
      </button>
    </div>
  );
}

const styles = {
  button: {
    padding: "10px 20px",
    fontSize: "1rem",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default AutoClicker;
