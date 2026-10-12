import express from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { tasks, auditLogs, validTransitions, TaskStatus } from './data';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/tasks', (req, res) => res.json(tasks));

app.post('/tasks', (req, res) => {
  const { title, actor } = req.body;
  if (!title || !actor) return res.status(400).json({ error: 'Title and actor are required' });

  const newTask = { id: randomUUID(), title, status: 'to_do' as TaskStatus, createdAt: new Date().toISOString() };
  const newLog = { id: randomUUID(), taskId: newTask.id, actor, fromStatus: null, toStatus: 'to_do' as TaskStatus, timestamp: new Date().toISOString() };

  tasks.push(newTask);
  auditLogs.push(newLog);
  res.status(201).json(newTask);
});

app.put('/tasks/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, actor } = req.body;
  const task = tasks.find(t => t.id === id);
  
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.status === status) return res.status(200).json(task);
  if (!validTransitions[task.status].includes(status as TaskStatus)) {
    return res.status(400).json({ error: `Invalid transition` });
  }

  const oldStatus = task.status;
  task.status = status as TaskStatus;

  auditLogs.push({
    id: randomUUID(), taskId: task.id, actor, fromStatus: oldStatus,
    toStatus: task.status, timestamp: new Date().toISOString()
  });
  res.status(200).json(task);
});

app.delete('/tasks/:id', (req, res) => {
  const taskIndex = tasks.findIndex(t => t.id === req.params.id);
  if (taskIndex > -1) tasks.splice(taskIndex, 1);
  res.status(204).send();
});

app.get('/tasks/:id/audit-logs', (req, res) => {
  const logs = auditLogs.filter(log => log.taskId === req.params.id)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  res.json(logs);
});

app.listen(3001, () => console.log('Backend running on http://localhost:3001'));