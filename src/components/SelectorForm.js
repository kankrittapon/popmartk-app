// src/components/SelectorForm.js
import React from "react";

function SelectorForm({ branch, setBranch, date, setDate, time, setTime }) {
  return (
    <form style={styles.form}>
      <label>
        สาขา:
        <select value={branch} onChange={(e) => setBranch(e.target.value)} style={styles.select}>
          <option value="">เลือกสาขา</option>
          <option value="icon_siam">ICON SIAM</option>
          <option value="terminal_21">Terminal 21</option>
          <option value="central_world">Central World</option>
        </select>
      </label>

      <label>
        วันที่:
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={styles.input}
        />
      </label>

      <label>
        เวลา:
        <select value={time} onChange={(e) => setTime(e.target.value)} style={styles.select}>
          <option value="">เลือกเวลา</option>
          <option value="10:00">10:00</option>
          <option value="10:30">10:30</option>
          <option value="11:00">11:00</option>
        </select>
      </label>
    </form>
  );
}

const styles = {
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    maxWidth: "400px",
    margin: "1rem auto",
  },
  select: {
    padding: "0.5rem",
    fontSize: "1rem",
    marginLeft: "0.5rem",
  },
  input: {
    padding: "0.5rem",
    fontSize: "1rem",
    marginLeft: "0.5rem",
  },
};

export default SelectorForm;
