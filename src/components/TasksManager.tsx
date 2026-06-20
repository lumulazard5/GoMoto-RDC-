import React, { useState, useEffect } from 'react';
import { getAccessToken, useAuth } from '../hooks/useAuth';
import { CheckCircle, Circle, Loader2, Plus, Trash2, RefreshCw } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: string;
  notes?: string;
}

interface TaskList {
  id: string;
  title: string;
}

export default function TasksManager({ onClose }: { onClose: () => void }) {
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const { loginWithGoogle } = useAuth();
  const token = getAccessToken();

  useEffect(() => {
    if (token) {
      fetchTaskLists();
    }
  }, [token]);

  const fetchTaskLists = async () => {
    try {
      setLoading(true);
      const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTaskLists(data.items || []);
        if (data.items && data.items.length > 0) {
          setSelectedList(data.items[0].id);
          fetchTasks(data.items[0].id);
        }
      } else if (res.status === 401 || res.status === 403) {
        // Token issue
        console.error("Token issue or scope not granted");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async (listId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleListChange = (listId: string) => {
    setSelectedList(listId);
    fetchTasks(listId);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedList || !token) return;

    try {
      setLoading(true);
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${selectedList}/tasks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: newTaskTitle })
      });
      if (res.ok) {
        setNewTaskTitle('');
        fetchTasks(selectedList);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    if (!selectedList || !token) return;
    
    const newStatus = task.status === 'completed' ? 'needsAction' : 'completed';
    // Optimistic update
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    
    try {
      await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${selectedList}/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...task, status: newStatus })
      });
      fetchTasks(selectedList);
    } catch (e) {
      console.error(e);
      // Revert on failure
      fetchTasks(selectedList);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!selectedList || !token) return;
    
    const confirmed = window.confirm("Voulez-vous vraiment supprimer cette tâche ?");
    if (!confirmed) return;

    try {
      setLoading(true);
      await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${selectedList}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks(selectedList);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]">
        <div className="bg-blue-600 p-5 flex items-center justify-between text-white border-b border-blue-700">
          <h3 className="font-black flex items-center gap-2">
            <CheckCircle className="w-5 h-5 opacity-80" />
            Mes Tâches GoMoto (Google)
          </h3>
          <button 
            onClick={onClose}
            className="text-white hover:text-blue-100 font-bold"
          >
            Fermer
          </button>
        </div>
        
        <div className="p-5 flex-1 overflow-y-auto">
          {!token ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-sm text-slate-600">Connectez-vous pour voir vos tâches Google.</p>
              <button 
                onClick={loginWithGoogle}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold uppercase text-xs"
              >
                Autoriser Google Tasks
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {taskLists.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <select 
                    value={selectedList || ''} 
                    onChange={(e) => handleListChange(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    {taskLists.map(list => (
                      <option key={list.id} value={list.id}>{list.title}</option>
                    ))}
                  </select>
                  <button onClick={() => selectedList && fetchTasks(selectedList)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              )}

              <form onSubmit={handleCreateTask} className="flex gap-2">
                <input 
                  type="text" 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Nouvelle tâche..."
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 shadow-sm"
                />
                <button 
                  type="submit" 
                  disabled={loading || !newTaskTitle.trim()}
                  className="bg-blue-600 text-white p-2 rounded-xl disabled:bg-blue-300"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </form>

              <div className="space-y-2 mt-4">
                {tasks.length === 0 && !loading && (
                  <p className="text-center text-sm text-slate-500 py-6">Aucune tâche dans cette liste.</p>
                )}
                {tasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-200 transition-colors group">
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleToggleTask(task)} className="text-slate-400 hover:text-blue-600 transition-colors">
                        {task.status === 'completed' ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
                      </button>
                      <span className={`text-sm ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>
                        {task.title}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
