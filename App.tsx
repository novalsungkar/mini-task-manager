import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:3001';
type TaskStatus = 'to_do' | 'pending' | 'in_progress' | 'done';
interface Task { id: string; title: string; status: TaskStatus; }
interface AuditLog { id: string; actor: string; fromStatus: string | null; toStatus: string; timestamp: string; }

const USERS = ['john.doe', 'jane.smith', 'admin.system'];

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [currentUser, setCurrentUser] = useState(USERS[0]);
  const [activeLogsTaskId, setActiveLogsTaskId] = useState<string | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  const fetchTasks = async () => {
    const res = await axios.get(`${API_URL}/tasks`);
    setTasks(res.data);
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    await axios.post(`${API_URL}/tasks`, { title: newTaskTitle, actor: currentUser });
    setNewTaskTitle('');
    fetchTasks();
  };

  const handleUpdate = async (id: string, status: TaskStatus) => {
    try {
      await axios.put(`${API_URL}/tasks/${id}/status`, { status, actor: currentUser });
      fetchTasks();
      if (activeLogsTaskId === id) fetchLogs(id);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error updating status');
    }
  };

  const handleDelete = async (id: string) => {
    await axios.delete(`${API_URL}/tasks/${id}`);
    if (activeLogsTaskId === id) setActiveLogsTaskId(null);
    fetchTasks();
  };

  const fetchLogs = async (taskId: string) => {
    const res = await axios.get(`${API_URL}/tasks/${taskId}/audit-logs`);
    setLogs(res.data);
  };

  const toggleLogs = (taskId: string) => {
    if (activeLogsTaskId === taskId) setActiveLogsTaskId(null);
    else { setActiveLogsTaskId(taskId); fetchLogs(taskId); }
  };

  const getNextStatus = (current: TaskStatus): TaskStatus | null => {
    const flow: Record<TaskStatus, TaskStatus | null> = { 'to_do': 'pending', 'pending': 'in_progress', 'in_progress': 'done', 'done': null };
    return flow[current];
  };

  return (
    <div className="container">
      <h1>Mini Task Manager</h1>
      <div className="header">
        <label>Aktor (User): </label>
        <select value={currentUser} onChange={e => setCurrentUser(e.target.value)}>
          {USERS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      <form onSubmit={handleCreate} className="form">
        <input placeholder="Nama task baru..." value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} />
        <button type="submit">Buat Task</button>
      </form>

      <div className="task-list">
        {tasks.map(task => {
          const nextStatus = getNextStatus(task.status);
          return (
            <div key={task.id} className="task-card">
              <div className="task-header">
                <h3>{task.title}</h3>
                <span className={`badge ${task.status}`}>{task.status.replace('_', ' ')}</span>
              </div>
              <div className="actions">
                {nextStatus && <button onClick={() => handleUpdate(task.id, nextStatus)}>Pindah ke {nextStatus.replace('_', ' ')}</button>}
                <button onClick={() => toggleLogs(task.id)}>{activeLogsTaskId === task.id ? 'Tutup Log' : 'Lihat Log'}</button>
                <button className="danger" onClick={() => handleDelete(task.id)}>Hapus</button>
              </div>
              {activeLogsTaskId === task.id && (
                <ul className="logs">
                  {logs.map(log => (
                    <li key={log.id}>
                      <strong>{log.actor}</strong> mengubah dari <strong>{log.fromStatus || 'none'}</strong> menjadi <strong>{log.toStatus}</strong> pada {new Date(log.timestamp).toLocaleString()}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;