import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, LogOut, Calendar, Book } from 'lucide-react';

const API_GATEWAY = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchDate, setSearchDate] = useState('');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerMode, setRegisterMode] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', date: '' });

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const username = sessionStorage.getItem('username');
    if (token && username) {
      setUser({ username, token });
      fetchEntries(token);
    }
  }, []);

  const fetchEntries = async (token) => {
    try {
      const res = await fetch(`${API_GATEWAY}/search/entries`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (err) {
      console.error('Error fetching entries:', err);
    }
  };

  const handleLogin = async () => {
    const endpoint = registerMode ? '/login/register' : '/login/login';
    try {
      const res = await fetch(`${API_GATEWAY}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      const data = await res.json();
      if (res.ok) {
        setUser({ username: loginData.username, token: data.token });
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('username', loginData.username);
        fetchEntries(data.token);
        setLoginData({ username: '', password: '' });
      } else {
        alert(data.error || 'Error en autenticación');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setEntries([]);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('username');
  };

  const handleCreateEntry = async () => {
    try {
      const res = await fetch(`${API_GATEWAY}/entry/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ title: '', content: '', date: '' });
        fetchEntries(user.token);
      }
    } catch (err) {
      alert('Error al crear entrada');
    }
  };

  const handleUpdateEntry = async () => {
    try {
      const res = await fetch(`${API_GATEWAY}/entry/entries/${selectedEntry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        setSelectedEntry(null);
        setFormData({ title: '', content: '', date: '' });
        fetchEntries(user.token);
      }
    } catch (err) {
      alert('Error al actualizar entrada');
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm('¿Eliminar esta entrada?')) return;
    try {
      const res = await fetch(`${API_GATEWAY}/entry/entries/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        fetchEntries(user.token);
      }
    } catch (err) {
      alert('Error al eliminar entrada');
    }
  };

  const handleSearch = async () => {
    if (!searchDate) {
      fetchEntries(user.token);
      return;
    }
    try {
      const res = await fetch(`${API_GATEWAY}/search/entries/date/${searchDate}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (err) {
      console.error('Error en búsqueda:', err);
    }
  };

  const openCreateModal = () => {
    setSelectedEntry(null);
    setFormData({ title: '', content: '', date: new Date().toISOString().split('T')[0] });
    setShowModal(true);
  };

  const openEditModal = (entry) => {
    setSelectedEntry(entry);
    setFormData({ title: entry.title, content: entry.content, date: entry.date });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (selectedEntry) {
      handleUpdateEntry();
    } else {
      handleCreateEntry();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-300 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
            <Book className="w-12 h-12 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
            Mi Diario Personal
          </h1>
          <p className="text-center text-gray-600 mb-8">
            {registerMode ? 'Crea tu cuenta' : 'Inicia sesión para continuar'}
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario
              </label>
              <input
                type="text"
                value={loginData.username}
                onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleLogin}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              {registerMode ? 'Registrarse' : 'Iniciar Sesión'}
            </button>
          </div>
          <button
            onClick={() => setRegisterMode(!registerMode)}
            className="w-full mt-4 text-purple-600 hover:text-purple-700 text-sm"
          >
            {registerMode ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Book className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-800">Mi Diario Personal</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Hola, {user.username}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Buscar
            </button>
          </div>
          <button
            onClick={openCreateModal}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 justify-center"
          >
            <Plus className="w-4 h-4" />
            Nueva Entrada
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold text-gray-800">{entry.title}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(entry)}
                    className="text-blue-600 hover:bg-blue-50 p-2 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="text-red-600 hover:bg-red-50 p-2 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-gray-600 mb-3 line-clamp-3">{entry.content}</p>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-2" />
                {entry.date}
              </div>
            </div>
          ))}
        </div>

        {entries.length === 0 && (
          <div className="text-center py-12">
            <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay entradas todavía</p>
            <p className="text-gray-400">Crea tu primera entrada para comenzar</p>
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {selectedEntry ? 'Editar Entrada' : 'Nueva Entrada'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenido
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent h-48 resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedEntry(null);
                    setFormData({ title: '', content: '', date: '' });
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {selectedEntry ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;