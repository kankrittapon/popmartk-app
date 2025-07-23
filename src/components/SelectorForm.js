// src/components/SelectorForm.js
import React from "react";

function SelectorForm({ branch, setBranch, date, setDate, time, setTime }) {
  // สร้าง Array ของตัวเลข 1 ถึง 31 สำหรับวัน
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <form style={styles.form}>
      <label>
        สาขา:
        <select value={branch} onChange={(e) => setBranch(e.target.value)} style={styles.select}>
          <option value="">เลือกสาขา</option>
          <option value="icon_siam">ICON SIAM</option>
          <option value="terminal_21">Terminal 21</option>
          <option value="central_world">Central World</option>
          <option value="Central Ladprao">Central Ladprao</option>
          <option value="Fashion Island">Fashion Island</option>
          <option value="MEGABANGNA">MEGABANGNA</option>
          <option value="Siam Center">Siam Center</option>
          <option value="Siam Square">Siam Square</option>
          <option value="Emphere">Emphere</option>
          <option value="Central Pattaya">Central Pattaya</option>
          <option value="Seacon Square">Seacon Square</option>
          <option value="Central Westgate">Central Westgate</option>
          <option value="Central Chiangmai">Central Chiangmai</option>
        </select>
      </label>

      <label>
        วันที่ (วัน):
        <select
          value={date} // `date` state จะเก็บค่าตัวเลขของวันที่ที่เลือก
          onChange={(e) => setDate(e.target.value)}
          style={styles.select}
        >
          <option value="">เลือกวัน</option>
          {/* Loop เพื่อสร้าง option สำหรับแต่ละวันจาก 1 ถึง 31 */}
          {days.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
      </label>

      <label>
        เวลา:
        <select value={time} onChange={(e) => setTime(e.target.value)} style={styles.select}>
          <option value="">เลือกเวลา</option>
          <option value="10:00">10:00</option>
          <option value="10:30">10:30</option>
          <option value="11:00">11:00</option>
          <option value="11:30">11:30</option>
          <option value="12:00">12:00</option>
          <option value="12:30">12:30</option>
          <option value="13:00">13:00</option>
          <option value="13:30">13:30</option>
          <option value="14:00">14:00</option>
          <option value="14:30">14:30</option>
          <option value="15:00">15:00</option>
          <option value="15:30">15:30</option>
          <option value="16:00">16:00</option>
          <option value="16:30">16:30</option>
          <option value="17:00">17:00</option>
          <option value="17:30">17:30</option>
          <option value="18:00">18:00</option>
          <option value="18:30">18:30</option>
          <option value="19:00">19:00</option>
          <option value="19:30">19:30</option>
          <option value="20:00">20:00</option>
          <option value="20:30">20:30</option>
          <option value="21:00">21:00</option>
          <option value="21:30">21:30</option>
          <option value="22:00">22:00</option>
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
  input: { // สไตล์นี้อาจไม่ถูกใช้งานโดยตรงสำหรับ select ใหม่ แต่ถูกเก็บไว้เพื่อความสอดคล้อง
    padding: "0.5rem",
    fontSize: "1rem",
    marginLeft: "0.5rem",
  },
};

export default SelectorForm;