// src/components/AutoClicker.js
import React, { useState, useEffect } from "react";

function AutoClicker({ branch, date, time }) {
  // processStatuses จะเก็บ { [processId]: { browserType: string, status: 'running' | 'success' | 'failed' | 'stopped' } }
  const [processStatuses, setProcessStatuses] = useState({});

  // bookingTasks จะเก็บรายการงาน Booking ที่ผู้ใช้กำหนด
  // แต่ละ task จะมี { id: string, branch: string, date: string, time: string, browserType: string, isTestMode: boolean, testSiteUrl: string, ... }
  const [bookingTasks, setBookingTasks] = useState([]);

  // สถานะสำหรับฟอร์มเพิ่มงานใหม่
  const [newBranch, setNewBranch] = useState(branch);
  const [newDate, setNewDate] = useState(date);
  const [newTime, setNewTime] = useState(time);
  const [newBrowserType, setNewBrowserType] = useState('chrome');
  const [newLineEmail, setNewLineEmail] = useState('');
  const [newLinePassword, setNewLinePassword] = useState('');
  const [newStartDelayMinutes, setNewStartDelayMinutes] = useState(2);

  // เพิ่มสถานะสำหรับ Test Mode
  const [isTestModeEnabled, setIsTestModeEnabled] = useState(false);
  // ลบ https://popmart.ithitec.com/ ออกจากตัวเลือก Test Site URL
  const [newTestSiteUrl, setNewTestSiteUrl] = useState('https://pmrocketbotautoq.web.app/'); // Default test site

  // อัปเดตค่าเริ่มต้นของฟอร์มเมื่อ branch, date, time จาก SelectorForm เปลี่ยน
  useEffect(() => {
    setNewBranch(branch);
    setNewDate(date);
    setNewTime(time);
  }, [branch, date, time]);


  // ฟังก์ชันสำหรับดึงสถานะ Process ที่กำลังทำงานอยู่จาก Backend
  const fetchActiveProcesses = async () => {
    try {
      const response = await fetch('http://localhost:5000/get-active-processes');
      const data = await response.json();
      if (data.status === 'success') {
        const backendActiveIds = new Set(data.activeProcesses);
        
        setProcessStatuses(prevStatuses => {
          const newStatuses = { ...prevStatuses };
          
          for (const pId in newStatuses) {
            if (!backendActiveIds.has(pId) && newStatuses[pId].status === 'running') {
              newStatuses[pId].status = 'success';
              setTimeout(() => {
                setProcessStatuses(current => {
                  const temp = { ...current };
                  delete temp[pId];
                  return temp;
                });
              }, 5000);
            }
          }

          backendActiveIds.forEach(pId => {
            if (!newStatuses[pId]) {
              const task = bookingTasks.find(task => task.id === pId);
              newStatuses[pId] = { browserType: task ? task.browserType : 'N/A', status: 'running' };
            }
          });
          return newStatuses;
        });
      }
    } catch (error) {
      console.error('Failed to fetch active processes:', error);
    }
  };

  // ดึงสถานะ Process เมื่อ Component โหลดและทุกๆ 3 วินาที
  useEffect(() => {
    fetchActiveProcesses();
    const interval = setInterval(fetchActiveProcesses, 3000);
    return () => clearInterval(interval);
  }, [bookingTasks]);


  // ฟังก์ชันสำหรับเพิ่มงาน Booking ใหม่
  const handleAddTask = () => {
    // บังคับกรอกข้อมูลทั้งหมด ยกเว้น LINE Email/Password ใน Test Mode
    if (!newBranch || !newDate || !newTime || !newBrowserType || (!isTestModeEnabled && (!newLineEmail || !newLinePassword))) {
      alert("Please fill all required fields for the new booking task (LINE credentials are optional in Test Mode).");
      return;
    }

    // คำนวณเวลาเริ่มต้นจริง (สำหรับ Real Mode เท่านั้น)
    let actualStartTime = new Date(); // Default to now for test mode or immediate start
    let targetBookingDateTime = new Date(); // Default to now

    if (!isTestModeEnabled) { // Only calculate scheduled time for real mode
        targetBookingDateTime.setFullYear(targetBookingDateTime.getFullYear()); // ใช้ปีปัจจุบัน
        targetBookingDateTime.setMonth(6); // กรกฎาคม (เดือน 6 เพราะเริ่มจาก 0)
        targetBookingDateTime.setDate(parseInt(newDate)); // วันที่จาก input
        const [hours, minutes] = newTime.split(':').map(Number);
        targetBookingDateTime.setHours(hours, minutes, 0, 0);

        actualStartTime = new Date(targetBookingDateTime.getTime() - (newStartDelayMinutes * 60 * 1000));
        const now = new Date();

        if (actualStartTime.getTime() <= now.getTime()) {
            alert("The calculated start time is in the past or too soon. Please adjust the booking time or delay for real mode.");
            return;
        }
    }


    const newTaskId = `Process-${Date.now()}`;
    const newTask = {
      id: newTaskId,
      branch: newBranch,
      date: newDate,
      time: newTime,
      browserType: newBrowserType,
      lineEmail: newLineEmail,
      linePassword: newLinePassword,
      startDelayMinutes: newStartDelayMinutes, // ส่งค่านี้ไปให้ Backend เพื่อแสดงผล
      isTestMode: isTestModeEnabled, // ส่งสถานะ Test Mode
      testSiteUrl: newTestSiteUrl,   // ส่ง URL ของ Test Site
      targetBookingTime: isTestModeEnabled ? 'N/A (Test Mode)' : targetBookingDateTime.toLocaleString(),
      scheduledStartTime: isTestModeEnabled ? 'Immediate (Test Mode)' : actualStartTime.toLocaleString(),
    };
    setBookingTasks(prevTasks => [...prevTasks, newTask]);
    // Clear form fields (optional)
    setNewLineEmail('');
    setNewLinePassword('');
  };

  // ฟังก์ชันสำหรับลบงาน Booking
  const handleRemoveTask = (taskId) => {
    setBookingTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    if (processStatuses[taskId] && processStatuses[taskId].status === 'running') {
      handleStopProcess(taskId);
    }
  };


  const handleStartBooking = async (task) => {
    const { id: processId, browserType, branch, date, time, lineEmail, linePassword, scheduledStartTime, isTestMode, testSiteUrl } = task;

    // *** เปลี่ยนแปลงตรงนี้: เรียก executeBookingProcess ทันทีในทุกกรณี ***
    console.log(`Starting ${processId} immediately.`);
    executeBookingProcess(processId, browserType, branch, date, time, lineEmail, linePassword, isTestMode, testSiteUrl, task.targetBookingTime); // ส่ง targetBookingTime ไปด้วย
  };

  // ฟังก์ชันแยกสำหรับการเรียก Backend
  const executeBookingProcess = async (processId, browserType, branch, date, time, lineEmail, linePassword, isTestMode, testSiteUrl, targetBookingTime) => { // รับ targetBookingTime
    setProcessStatuses(prev => ({
        ...prev,
        [processId]: { browserType, status: 'running' }
    }));
    try {
      const response = await fetch('http://localhost:5000/start-booking-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          processId: processId,
          browserType: browserType,
          config: { branch, date, time, lineEmail, linePassword, isTestMode, testSiteUrl, targetBookingTime } // ส่ง targetBookingTime ไป Backend
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        // สถานะจะถูกอัปเดตโดย fetchActiveProcesses
      } else {
        setProcessStatuses(prev => ({
          ...prev,
          [processId]: { ...prev[processId], status: 'failed' }
        }));
        alert(`❌ Error: ${data.message}`);
        setTimeout(() => {
          setProcessStatuses(current => {
            const temp = { ...current };
            delete temp[processId];
            return temp;
          });
        }, 5000);
      }
    } catch (error) {
      console.error('Failed to send booking request:', error);
      setProcessStatuses(prev => ({
        ...prev,
        [processId]: { ...prev[processId], status: 'failed' }
      }));
      alert('⚠️ Failed to connect to backend server.');
      setTimeout(() => {
        setProcessStatuses(current => {
          const temp = { ...current };
          delete temp[processId];
          return temp;
        });
      }, 5000);
    }
  };

  const handleStopProcess = async (processId) => {
    try {
      const response = await fetch('http://localhost:5000/stop-booking-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ processId: processId }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setProcessStatuses(prev => {
          const newStatuses = { ...prev };
          delete newStatuses[processId];
          return newStatuses;
        });
        alert(`✅ ${data.message}`);
      } else {
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to send stop request:', error);
      alert('⚠️ Failed to connect to backend server.');
    }
  };


  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h3>🖱️ Booking Task Manager</h3>

      {/* Form สำหรับเพิ่มงาน Booking ใหม่ */}
      <div style={styles.formContainer}>
        <h4>Add New Booking Task</h4>
        <div style={styles.formRow}>
          <label style={styles.label}>
            Branch:
            <select value={newBranch} onChange={(e) => setNewBranch(e.target.value)} style={styles.select}>
              <option value="">Select Branch</option>
              <option value="ICON SIAM">ICON SIAM</option>
              <option value="Terminal 21">Terminal 21</option>
              <option value="Centralworld">Central World</option>
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
          <label style={styles.label}>
            Day:
            <select value={newDate} onChange={(e) => setNewDate(e.target.value)} style={styles.select}>
              <option value="">Select Day</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </label>
          <label style={styles.label}>
            Time:
            <select value={newTime} onChange={(e) => setNewTime(e.target.value)} style={styles.select}>
              <option value="">Select Time</option>
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
            </select>
          </label>
          <label style={styles.label}>
            Browser:
            <select value={newBrowserType} onChange={(e) => setNewBrowserType(e.target.value)} style={styles.select}>
              <option value="chrome">Google Chrome</option>
              <option value="msedge">Microsoft Edge</option>
              <option value="firefox">Mozilla Firefox</option>
              <option value="webkit">WebKit (Safari)</option>
            </select>
          </label>
        </div>
        <div style={styles.formRow}>
            <label style={styles.label}>
                LINE Email:
                <input
                    type="email"
                    value={newLineEmail}
                    onChange={(e) => setNewLineEmail(e.target.value)}
                    placeholder="LINE Email"
                    style={styles.input}
                />
            </label>
            <label style={styles.label}>
                LINE Password:
                <input
                    type="password"
                    value={newLinePassword}
                    onChange={(e) => setNewLinePassword(e.target.value)}
                    placeholder="LINE Password"
                    style={styles.input}
                />
            </label>
            <label style={styles.label}>
                Start Delay (minutes before booking):
                <input
                    type="number"
                    value={newStartDelayMinutes}
                    onChange={(e) => setNewStartDelayMinutes(Number(e.target.value))}
                    min="0"
                    max="60"
                    style={styles.input}
                />
            </label>
        </div>
        
        {/* Test Mode Section */}
        <div style={styles.testModeContainer}>
            <label style={styles.label}>
                <input
                    type="checkbox"
                    checked={isTestModeEnabled}
                    onChange={(e) => setIsTestModeEnabled(e.target.checked)}
                    style={{ marginRight: '5px' }}
                />
                Enable Test Mode
            </label>
            {isTestModeEnabled && (
                <label style={styles.label}>
                    Test Site URL:
                    <select value={newTestSiteUrl} onChange={(e) => setNewTestSiteUrl(e.target.value)} style={styles.select}>
                        <option value="https://pmrocketbotautoq.web.app/">https://pmrocketbotautoq.web.app/</option>
                    </select>
                </label>
            )}
        </div>

        <button onClick={handleAddTask} style={{ ...styles.button, backgroundColor: '#28a745', marginTop: '15px' }}>
          Add Booking Task
        </button>
      </div>

      <hr style={{ margin: '30px 0' }} />

      {/* แสดงรายการงาน Booking ที่ถูกเพิ่ม */}
      <h4>Configured Booking Tasks ({bookingTasks.length} tasks)</h4>
      {bookingTasks.length > 0 ? (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {bookingTasks.map(task => (
            <li key={task.id} style={styles.taskItem}>
              <div>
                <strong>{task.id}</strong> {task.isTestMode && <span style={{ color: 'orange' }}>(TEST MODE)</span>}
                <p style={styles.taskDetail}>Branch: {task.branch}</p>
                <p style={styles.taskDetail}>Date: {task.date}</p>
                <p style={styles.taskDetail}>Time: {task.time}</p>
                <p style={styles.taskDetail}>Browser: {task.browserType}</p>
                <p style={styles.taskDetail}>LINE Email: {task.lineEmail ? '******' : 'N/A'}</p>
                <p style={styles.taskDetail}>Start Delay: {task.startDelayMinutes} mins</p> {/* ยังคงแสดงค่านี้ */}
                <p style={styles.taskDetail}>Target Booking Time: {task.targetBookingTime}</p>
                <p style={styles.taskDetail}>Scheduled Start Time: {task.scheduledStartTime}</p>
              </div>
              <div style={styles.taskActions}>
                {/* ปุ่ม Start/Stop */}
                {processStatuses[task.id] && (processStatuses[task.id].status === 'running' || processStatuses[task.id].status.startsWith('Scheduled')) ? (
                  <button
                    onClick={() => handleStopProcess(task.id)}
                    style={{ ...styles.button, backgroundColor: '#dc3545', padding: '8px 15px', fontSize: '0.9rem' }}
                  >
                    Stop Running
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartBooking(task)}
                    style={{ ...styles.button, backgroundColor: '#007bff', padding: '8px 15px', fontSize: '0.9rem' }}
                    disabled={processStatuses[task.id] && (processStatuses[task.id].status === 'success' || processStatuses[task.id].status === 'failed')}
                  >
                    Start Booking
                  </button>
                )}
                {/* ปุ่ม Remove */}
                <button
                  onClick={() => handleRemoveTask(task.id)}
                  style={{ ...styles.button, backgroundColor: '#6c757d', padding: '8px 15px', fontSize: '0.9rem', marginLeft: '10px' }}
                >
                  Remove Task
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No booking tasks configured yet. Add one above!</p>
      )}

      <hr style={{ margin: '30px 0' }} />

      {/* แสดงสถานะของ Process ที่กำลังทำงานอยู่ (แยกจาก Configured Tasks) */}
      <h4>Live Process Status:</h4>
      {Object.keys(processStatuses).length > 0 ? (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {Object.entries(processStatuses).map(([pId, pInfo]) => (
            <li key={pId} style={{ marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
              <strong>{pId}</strong> ({pInfo.browserType || 'N/A'}) - Status: {" "}
              {pInfo.status === 'running' && <span style={{ color: 'blue' }}>Running...</span>}
              {pInfo.status === 'success' && <span style={{ color: 'green' }}>Success! ✅</span>}
              {pInfo.status === 'failed' && <span style={{ color: 'red' }}>Failed ❌</span>}
              {pInfo.status === 'stopped' && <span style={{ color: 'orange' }}>Stopped</span>}
              {pInfo.status.startsWith('Scheduled') && <span style={{ color: 'purple' }}>{pInfo.status}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p>No active processes.</p>
      )}

      {/* ปุ่ม Stop All Processes */}
      {Object.keys(processStatuses).length > 0 && (
        <button
          onClick={() => Object.keys(processStatuses).forEach(pId => handleStopProcess(pId))}
          style={{ ...styles.button, backgroundColor: '#6c757d', marginTop: '20px' }}
        >
          Stop All Running Processes
        </button>
      )}
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
    margin: "0.5rem 0",
  },
  input: {
    padding: "8px",
    fontSize: "0.9rem",
    borderRadius: "4px",
    border: "1px solid #ddd",
    marginTop: '5px',
    width: '100%',
    boxSizing: 'border-box',
  },
  formContainer: {
    border: '1px solid #ccc',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    backgroundColor: '#f9f9f9',
  },
  formRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px',
    marginBottom: '15px',
    alignItems: 'flex-end',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '0.9rem',
    color: '#555',
    flex: '1 1 auto',
    minWidth: '150px',
  },
  select: {
    padding: "8px",
    fontSize: "0.9rem",
    borderRadius: "4px",
    border: "1px solid #ddd",
    marginTop: '5px',
    width: '100%',
    boxSizing: 'border-box',
  },
  taskItem: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    border: '1px solid #eee',
    padding: '15px',
    marginBottom: '10px',
    borderRadius: '8px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  taskDetail: {
    margin: '0 0 5px 0',
    fontSize: '0.9rem',
    color: '#333',
  },
  taskActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
    width: '100%',
    justifyContent: 'flex-end',
  },
  testModeContainer: {
    border: '1px dashed #007bff',
    padding: '15px',
    borderRadius: '8px',
    marginTop: '15px',
    backgroundColor: '#e6f7ff',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  }
};

export default AutoClicker;
