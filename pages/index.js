import React, { useState, useEffect, useRef } from 'react';
import { Save, Plus, Edit2, Trash2, LogOut, Users, Calendar, MapPin, DollarSign, FileText, Activity, BarChart3, Settings, Eye, EyeOff, Clipboard, Check } from 'lucide-react';

// ストレージヘルパー
const storage = {
  async get(key) {
    try {
      const result = await window.storage.get(key);
      return result ? JSON.parse(result.value) : null;
    } catch (error) {
      // 404エラー（キーが存在しない）は正常なケースとして扱う
      if (error.message && error.message.includes('404')) {
        console.log(`Storage key "${key}" not found, returning null`);
        return null;
      }
      console.error('Storage get error:', error);
      return null;
    }
  },
  async set(key, value) {
    try {
      await window.storage.set(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  }
};

// 初期データ
const initializeData = async () => {
  // すべてのキーに対して初期値を設定（存在しない場合のみ）
  const keys = [
    'users', 'fiscalYears', 'members', 'coaches', 'venues', 
    'transportCosts', 'categories', 'incomes', 'expenses', 
    'membershipFees', 'membershipPayments', 'activities'
  ];
  
  for (const key of keys) {
    const existing = await storage.get(key);
    if (!existing) {
      await storage.set(key, []);
      console.log(`初期化: ${key} = []`);
    }
  }
  
  // デフォルトユーザーを作成
  const existingUsers = await storage.get('users');
  if (!existingUsers || existingUsers.length === 0) {
    const defaultUsers = [
      { id: '1', username: 'accounting', password: 'pass123', role: '会計担当', name: '会計太郎', practiceFee: '', matchFee: '', transportRate: '' },
      { id: '2', username: 'coach', password: 'pass123', role: 'コーチ', name: '指導花子', practiceFee: '3000', matchFee: '5000', transportRate: '20' },
      { id: '3', username: 'trainer', password: 'pass123', role: 'トレーナー', name: '練習次郎', practiceFee: '3000', matchFee: '5000', transportRate: '20' }
    ];
    await storage.set('users', defaultUsers);
    console.log('初期ユーザーを作成しました');
  }
};

export default function AccountingApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login');
  const [users, setUsers] = useState([]);
  const [fiscalYears, setFiscalYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [members, setMembers] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [venues, setVenues] = useState([]);
  const [transportCosts, setTransportCosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [membershipFees, setMembershipFees] = useState([]);
  const [membershipPayments, setMembershipPayments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // 通知を表示する関数
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // デバッグ用：状態変更を監視
  useEffect(() => {
    console.log('会員数:', members.length);
  }, [members]);

  useEffect(() => {
    console.log('スタッフ数:', coaches.length);
  }, [coaches]);

  useEffect(() => {
    console.log('年度数:', fiscalYears.length);
  }, [fiscalYears]);

  // データ読み込み
  useEffect(() => {
    const initialize = async () => {
      await initializeData();
      await loadAllData();
      
      // 自動ログイン処理
      const savedUserId = localStorage.getItem('savedUserId');
      const savedYearId = localStorage.getItem('savedYearId');
      
      if (savedUserId) {
        const users = await storage.get('users') || [];
        const user = users.find(u => u.id === savedUserId);
        if (user) {
          console.log('自動ログイン:', user.name);
          setCurrentUser(user);
          setView(user.role === '会計担当' ? 'fiscal-years' : 'coach-activities');
          
          // 年度の自動選択
          if (savedYearId) {
            const years = await storage.get('fiscalYears') || [];
            const year = years.find(y => y.id === savedYearId);
            if (year) {
              console.log('年度を自動選択:', year.name);
              setSelectedYear(year);
            }
          }
        }
      }
      
      setIsLoading(false);
    };
    initialize();
  }, []);

  const loadAllData = async () => {
    console.log('データ読み込み開始...');
    setUsers(await storage.get('users') || []);
    setFiscalYears(await storage.get('fiscalYears') || []);
    setMembers(await storage.get('members') || []);
    setCoaches(await storage.get('coaches') || []);
    setVenues(await storage.get('venues') || []);
    setTransportCosts(await storage.get('transportCosts') || []);
    setCategories(await storage.get('categories') || []);
    setIncomes(await storage.get('incomes') || []);
    setExpenses(await storage.get('expenses') || []);
    setMembershipFees(await storage.get('membershipFees') || []);
    setMembershipPayments(await storage.get('membershipPayments') || []);
    setActivities(await storage.get('activities') || []);
    console.log('データ読み込み完了');
  };

  // ログイン
  const LoginView = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [localShowPassword, setLocalShowPassword] = useState(false);

    const handleLogin = async () => {
      console.log('🔵 ログイン試行:', username);
      try {
        // ストレージから直接読み込み
        const storedUsers = await storage.get('users');
        console.log('🔵 読み込んだユーザー:', storedUsers);
        
        if (!storedUsers || storedUsers.length === 0) {
          setError('ユーザーデータが見つかりません。ページを再読み込みしてください。');
          return;
        }
        
        const user = storedUsers.find(u => u.username === username && u.password === password);
        console.log('🔵 見つかったユーザー:', user);
        
        if (user) {
          console.log('🔵 ログイン成功:', user.name, user.role);
          
          // ログイン情報を保存
          localStorage.setItem('savedUserId', user.id);
          console.log('ログイン情報を保存しました');
          
          setCurrentUser(user);
          const nextView = user.role === '会計担当' ? 'fiscal-years' : 'coach-activities';
          console.log('🔵 遷移先view:', nextView);
          setView(nextView);
          setError('');
        } else {
          console.log('🔴 ログイン失敗: ユーザーが見つかりません');
          setError('ユーザー名またはパスワードが正しくありません');
        }
      } catch (err) {
        console.error('ログインエラー:', err);
        setError('ログイン処理中にエラーが発生しました');
      }
    };

    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '48px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <DollarSign size={48} style={{ color: '#667eea', margin: '0 auto' }} />
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a202c', margin: '16px 0 8px' }}>
              会計管理システム
            </h1>
            <p style={{ color: '#718096', fontSize: '14px' }}>ログインしてください</p>
          </div>

          {error && (
            <div style={{
              background: '#fee',
              color: '#c33',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
              ユーザー名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
              パスワード
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={localShowPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                style={{
                  width: '100%',
                  padding: '12px',
                  paddingRight: '40px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
              <button
                onClick={() => setLocalShowPassword(!localShowPassword)}
                type="button"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#718096',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {localShowPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            ログイン
          </button>

          <div style={{ marginTop: '24px', padding: '16px', background: '#f7fafc', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: '#718096', marginBottom: '8px', fontWeight: '600' }}>デモアカウント:</p>
            <p style={{ fontSize: '12px', color: '#4a5568', margin: '4px 0' }}>会計担当: accounting / pass123</p>
            <p style={{ fontSize: '12px', color: '#4a5568', margin: '4px 0' }}>コーチ: coach / pass123</p>
            <button
              onClick={async () => {
                const storedUsers = await storage.get('users');
                console.log('保存されているユーザー数:', storedUsers ? storedUsers.length : 0);
                console.log('ユーザーデータ:', storedUsers);
              }}
              style={{
                marginTop: '12px',
                padding: '8px 12px',
                background: '#e2e8f0',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              データ確認（デバッグ用）
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 年度設定
  const FiscalYearSettings = () => {
    const [editingYear, setEditingYear] = useState(null);
    const [formData, setFormData] = useState({ name: '', startMonth: '', endMonth: '' });

    const handleSave = async () => {
      if (!formData.name || !formData.startMonth || !formData.endMonth) {
        showNotification('全ての項目を入力してください', 'error');
        return;
      }

      let updated;
      if (editingYear?.id) {
        updated = fiscalYears.map(y => y.id === editingYear.id ? { ...y, ...formData } : y);
      } else {
        const newYear = { id: Date.now().toString(), ...formData };
        updated = [...fiscalYears, newYear];
      }
      
      console.log('年度を保存:', updated);
      setFiscalYears(updated);
      await storage.set('fiscalYears', updated);
      
      // 保存確認
      const saved = await storage.get('fiscalYears');
      console.log('保存後の年度データ:', saved);
      
      setEditingYear(null);
      setFormData({ name: '', startMonth: '', endMonth: '' });
      
      // 確認メッセージ
      showNotification(editingYear?.id ? '年度を更新しました' : '年度を追加しました');
    };

    const handleDelete = async (id) => {
      
      console.log('削除ID:', id);
      console.log('削除前の年度:', fiscalYears);
      
      const updated = fiscalYears.filter(y => y.id !== id);
      console.log('削除後の年度:', updated);
      
      // 即座に状態を更新
      setFiscalYears(updated);
      
      if (selectedYear?.id === id) {
        setSelectedYear(null);
        localStorage.removeItem('savedYearId');
      }
      
      // バックグラウンドでストレージに保存
      storage.set('fiscalYears', updated).then(() => {
        console.log('ストレージ保存完了');
        showNotification('年度を削除しました');
      }).catch(err => {
        console.error('保存失敗:', err);
      });
    };

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c' }}>年度設定</h2>
          <button
            onClick={() => {
              setEditingYear({});
              setFormData({ name: '', startDate: '', endDate: '' });
            }}
            style={{
              padding: '10px 20px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600'
            }}
          >
            <Plus size={20} /> 新規年度追加
          </button>
        </div>

        {editingYear && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            border: '2px solid #667eea'
          }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
              {editingYear.id ? '年度編集' : '新規年度'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  年度名
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="2024年度"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  開始月
                </label>
                <input
                  type="month"
                  value={formData.startMonth}
                  onChange={(e) => setFormData({ ...formData, startMonth: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  終了月
                </label>
                <input
                  type="month"
                  value={formData.endMonth}
                  onChange={(e) => setFormData({ ...formData, endMonth: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSave}
                disabled={!formData.name || !formData.startMonth || !formData.endMonth}
                style={{
                  padding: '10px 24px',
                  background: (!formData.name || !formData.startMonth || !formData.endMonth) ? '#cbd5e0' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (!formData.name || !formData.startMonth || !formData.endMonth) ? 'not-allowed' : 'pointer',
                  fontWeight: '600'
                }}
              >
                保存
              </button>
              <button
                onClick={() => {
                  setEditingYear(null);
                  setFormData({ name: '', startMonth: '', endMonth: '' });
                }}
                style={{
                  padding: '10px 24px',
                  background: '#e2e8f0',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gap: '16px' }}>
          {fiscalYears.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#718096', border: '1px solid #e2e8f0' }}>
              年度が登録されていません
            </div>
          ) : (
            fiscalYears.sort((a, b) => new Date(b.startMonth || b.startDate) - new Date(a.startMonth || a.startDate)).map(year => (
              <div key={year.id} style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c', marginBottom: '8px' }}>
                    {year.name}
                  </h4>
                  <p style={{ color: '#718096', fontSize: '14px' }}>
                    {year.startMonth || year.startDate} 〜 {year.endMonth || year.endDate}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setEditingYear(year);
                      setFormData({ 
                        name: year.name, 
                        startMonth: year.startMonth || year.startDate, 
                        endMonth: year.endMonth || year.endDate 
                      });
                    }}
                    style={{
                      padding: '8px 16px',
                      background: '#e2e8f0',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Edit2 size={16} /> 編集
                  </button>
                  <button
                    onClick={() => {
                      console.log('年度削除:', year.id);
                      const updated = fiscalYears.filter(y => y.id !== year.id);
                      setFiscalYears(updated);
                      storage.set('fiscalYears', updated);
                      if (selectedYear?.id === year.id) {
                        setSelectedYear(null);
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      background: '#fee',
                      color: '#c33',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Trash2 size={16} /> 削除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // ユーザー設定
  const UserSettings = () => {
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({ username: '', password: '', role: '会計担当', name: '', practiceFee: '', matchFee: '', transportRate: '' });

    const handleSave = async () => {
      if (!formData.username || !formData.password || !formData.name) {
        showNotification('全ての項目を入力してください', 'error');
        return;
      }

      let updated;
      if (editing?.id) {
        updated = users.map(u => u.id === editing.id ? { ...u, ...formData } : u);
      } else {
        // ユーザー名の重複チェック
        if (users.find(u => u.username === formData.username)) {
          showNotification('このユーザー名は既に使用されています', 'error');
          return;
        }
        const newUser = { id: Date.now().toString(), ...formData };
        updated = [...users, newUser];
      }
      
      console.log('ユーザーを保存:', updated);
      setUsers(updated);
      await storage.set('users', updated);
      
      setEditing(null);
      setFormData({ username: '', password: '', role: '会計担当', name: '', practiceFee: '', matchFee: '', transportRate: '' });
      showNotification(editing?.id ? 'ユーザーを更新しました' : 'ユーザーを追加しました');
    };

    const handleDelete = async (id) => {
      if (id === currentUser.id) {
        showNotification('現在ログイン中のユーザーは削除できません', 'error');
        return;
      }
      
      
      console.log('削除ID:', id);
      console.log('削除前のユーザー:', users);
      
      const updated = users.filter(u => u.id !== id);
      console.log('削除後のユーザー:', updated);
      
      // 即座に状態を更新
      setUsers(updated);
      
      // バックグラウンドでストレージに保存
      storage.set('users', updated).then(() => {
        console.log('ストレージ保存完了');
        showNotification('ユーザーを削除しました');
      }).catch(err => {
        console.error('保存失敗:', err);
      });
    };

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c' }}>ユーザー管理</h2>
          <button
            onClick={() => {
              setEditing({});
              setFormData({ username: '', password: '', role: '会計担当', name: '', practiceFee: '', matchFee: '', transportRate: '' });
            }}
            style={{
              padding: '10px 20px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600'
            }}
          >
            <Plus size={20} /> ユーザー追加
          </button>
        </div>

        {editing && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            border: '2px solid #667eea'
          }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
              {editing.id ? 'ユーザー編集' : '新規ユーザー'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  ユーザー名 *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="user123"
                  disabled={editing?.id}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: editing?.id ? '#f7fafc' : 'white'
                  }}
                />
                {editing?.id && (
                  <p style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>ユーザー名は変更できません</p>
                )}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  パスワード *
                </label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="password"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  権限 *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="会計担当">会計担当</option>
                  <option value="コーチ">コーチ</option>
                  <option value="トレーナー">トレーナー</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  氏名 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="山田太郎"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  練習時コーチ代
                </label>
                <input
                  type="number"
                  value={formData.practiceFee}
                  onChange={(e) => setFormData({ ...formData, practiceFee: e.target.value })}
                  placeholder="3000"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  試合時コーチ代
                </label>
                <input
                  type="number"
                  value={formData.matchFee}
                  onChange={(e) => setFormData({ ...formData, matchFee: e.target.value })}
                  placeholder="5000"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  交通費単価（円/km）
                </label>
                <input
                  type="number"
                  value={formData.transportRate}
                  onChange={(e) => setFormData({ ...formData, transportRate: e.target.value })}
                  placeholder="20"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSave}
                disabled={!formData.username || !formData.password || !formData.name}
                style={{
                  padding: '10px 24px',
                  background: (!formData.username || !formData.password || !formData.name) ? '#cbd5e0' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (!formData.username || !formData.password || !formData.name) ? 'not-allowed' : 'pointer',
                  fontWeight: '600'
                }}
              >
                保存
              </button>
              <button
                onClick={() => {
                  setEditing(null);
                  setFormData({ username: '', password: '', role: '会計担当', name: '', practiceFee: '', matchFee: '', transportRate: '' });
                }}
                style={{
                  padding: '10px 24px',
                  background: '#e2e8f0',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f7fafc' }}>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>ユーザー名</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>氏名</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>権限</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#1a202c' }}>{user.username}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#718096' }}>{user.name}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#718096' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: user.role === '会計担当' ? '#e6f2ff' : '#fff4e6',
                      color: user.role === '会計担当' ? '#0066cc' : '#cc8800'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => {
                          setEditing(user);
                          setFormData({ 
                            username: user.username, 
                            password: user.password, 
                            role: user.role, 
                            name: user.name,
                            practiceFee: user.practiceFee || '',
                            matchFee: user.matchFee || '',
                            transportRate: user.transportRate || ''
                          });
                        }}
                        style={{
                          padding: '6px 12px',
                          background: '#e2e8f0',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (user.id === currentUser.id) return;
                          console.log('ユーザー削除:', user.id);
                          const updated = users.filter(u => u.id !== user.id);
                          setUsers(updated);
                          storage.set('users', updated);
                          
                          // 削除されたユーザーが保存されていた場合はクリア
                          const savedUserId = localStorage.getItem('savedUserId');
                          if (savedUserId === user.id) {
                            localStorage.removeItem('savedUserId');
                            console.log('保存されていたログイン情報をクリアしました');
                          }
                        }}
                        disabled={user.id === currentUser.id}
                        style={{
                          padding: '6px 12px',
                          background: user.id === currentUser.id ? '#f7fafc' : '#fee',
                          color: user.id === currentUser.id ? '#cbd5e0' : '#c33',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: user.id === currentUser.id ? 'not-allowed' : 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 会員設定
  const MemberSettings = () => {
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({ name: '', grade: '', fee: '' });

    const yearMembers = selectedYear ? members.filter(m => m.fiscalYearId === selectedYear.id) : [];

    const handleSave = async () => {
      if (!selectedYear) {
        return;
      }

      if (!formData.name || !formData.grade) {
        return;
      }

      let updated;
      if (editing?.id) {
        updated = members.map(m => m.id === editing.id ? { ...m, ...formData, fee: formData.fee ? Number(formData.fee) : 0 } : m);
      } else {
        const newMember = { id: Date.now().toString(), fiscalYearId: selectedYear.id, ...formData, fee: formData.fee ? Number(formData.fee) : 0 };
        updated = [...members, newMember];
      }
      
      setMembers(updated);
      await storage.set('members', updated);
      
      setEditing(null);
      setFormData({ name: '', grade: '', fee: '' });
    };

    const handleDelete = (id) => {
      console.log('削除ID:', id);
      const updated = members.filter(m => m.id !== id);
      console.log('更新後:', updated);
      setMembers(updated);
      storage.set('members', updated);
    };

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c' }}>
            会員管理 {selectedYear && `(${selectedYear.name})`}
          </h2>
          <button
            onClick={() => {
              if (!selectedYear) {
                showNotification('年度を選択してください', 'error');
                return;
              }
              setEditing({});
              setFormData({ name: '', joinDate: '', phone: '', email: '' });
            }}
            style={{
              padding: '10px 20px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600'
            }}
          >
            <Plus size={20} /> 会員追加
          </button>
        </div>

        {!selectedYear && (
          <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
            <p style={{ color: '#856404' }}>年度を選択してください</p>
          </div>
        )}

        {editing && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            border: '2px solid #667eea'
          }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
              {editing.id ? '会員編集' : '新規会員'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  氏名 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="山田太郎"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  学年 *
                </label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">選択してください</option>
                  <option value="1年">1年</option>
                  <option value="2年">2年</option>
                  <option value="3年">3年</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  会費
                </label>
                <input
                  type="number"
                  value={formData.fee || ''}
                  onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                  placeholder="5000"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSave}
                disabled={!formData.name || !formData.grade}
                style={{
                  padding: '10px 24px',
                  background: (!formData.name || !formData.grade) ? '#cbd5e0' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (!formData.name || !formData.grade) ? 'not-allowed' : 'pointer',
                  fontWeight: '600'
                }}
              >
                保存
              </button>
              <button
                onClick={() => {
                  setEditing(null);
                  setFormData({ name: '', grade: '', fee: '' });
                }}
                style={{
                  padding: '10px 24px',
                  background: '#e2e8f0',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f7fafc' }}>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>氏名</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>学年</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>会費</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {yearMembers.map(member => (
                <tr key={member.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#1a202c' }}>{member.name}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#718096' }}>{member.grade}</td>
                  <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: '#1a202c', fontWeight: '600' }}>
                    {member.fee ? `¥${member.fee.toLocaleString()}` : '-'}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => {
                          setEditing(member);
                          setFormData({ name: member.name, grade: member.grade, fee: member.fee || '' });
                        }}
                        style={{
                          padding: '6px 12px',
                          background: '#e2e8f0',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => {
                          console.log('🔥🔥🔥 ボタンクリック検知！');
                          console.log('member.id:', member.id);
                          console.log('members before:', members);
                          const updated = members.filter(m => m.id !== member.id);
                          console.log('members after:', updated);
                          setMembers(updated);
                          console.log('setMembers実行完了');
                        }}
                        style={{
                          padding: '6px 12px',
                          background: '#fee',
                          color: '#c33',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {yearMembers.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>
              会員が登録されていません
            </div>
          )}
        </div>
      </div>
    );
  };

  // スタッフ在籍設定
  const CoachSettings = () => {
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({ userId: '', name: '', venueDistances: {} });

    const yearCoaches = selectedYear ? coaches.filter(c => c.fiscalYearId === selectedYear.id) : [];

    const handleSave = async () => {
      if (!selectedYear) {
        showNotification('年度を選択してください', 'error');
        return;
      }

      if (!formData.name) {
        showNotification('スタッフ名を入力してください', 'error');
        return;
      }

      let updated;
      if (editing?.id) {
        updated = coaches.map(c => c.id === editing.id ? { ...c, ...formData } : c);
      } else {
        const newCoach = { id: Date.now().toString(), fiscalYearId: selectedYear.id, ...formData };
        updated = [...coaches, newCoach];
      }
      
      console.log('スタッフを保存:', updated);
      setCoaches(updated);
      await storage.set('coaches', updated);
      
      // 保存確認
      const saved = await storage.get('coaches');
      console.log('保存後のスタッフデータ:', saved);
      
      setEditing(null);
      setFormData({ userId: '', name: '', venueDistances: {} });
      showNotification(editing?.id ? 'スタッフを更新しました' : 'スタッフを追加しました');
    };

    const handleDelete = async (id) => {
      
      console.log('削除ID:', id);
      console.log('削除前のスタッフ:', coaches);
      
      const updated = coaches.filter(c => c.id !== id);
      console.log('削除後のスタッフ:', updated);
      
      // 即座に状態を更新
      setCoaches(updated);
      
      // バックグラウンドでストレージに保存
      storage.set('coaches', updated).then(() => {
        console.log('ストレージ保存完了');
        showNotification('スタッフを削除しました');
      }).catch(err => {
        console.error('保存失敗:', err);
      });
    };

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c' }}>
            スタッフ在籍管理 {selectedYear && `(${selectedYear.name})`}
          </h2>
          <button
            onClick={() => {
              if (!selectedYear) {
                showNotification('年度を選択してください', 'error');
                return;
              }
              setEditing({});
              setFormData({ userId: '', name: '', venueDistances: {} });
            }}
            style={{
              padding: '10px 20px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600'
            }}
          >
            <Plus size={20} /> スタッフ追加
          </button>
        </div>

        {!selectedYear && (
          <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
            <p style={{ color: '#856404' }}>年度を選択してください</p>
          </div>
        )}

        {editing && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            border: '2px solid #667eea'
          }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
              {editing.id ? 'スタッフ編集' : '新規スタッフ'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  ユーザー
                </label>
                <select
                  value={formData.userId}
                  onChange={(e) => {
                    const user = users.find(u => u.id === e.target.value);
                    setFormData({ ...formData, userId: e.target.value, name: user?.name || '' });
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">選択してください</option>
                  {users.filter(u => u.role === 'コーチ' || u.role === 'トレーナー').map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  スタッフ名 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="指導花子"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            
            {/* 会場ごとの距離設定 */}
            <div style={{ marginTop: '24px', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1a202c', marginBottom: '12px' }}>
                会場までの距離設定
              </h4>
              <div style={{ display: 'grid', gap: '12px' }}>
                {venues.map(venue => (
                  <div key={venue.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{ flex: 1, fontSize: '14px', color: '#4a5568' }}>
                      {venue.name}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        value={formData.venueDistances[venue.id] || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          venueDistances: {
                            ...formData.venueDistances,
                            [venue.id]: e.target.value
                          }
                        })}
                        placeholder="15"
                        style={{
                          width: '100px',
                          padding: '8px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                      <span style={{ fontSize: '14px', color: '#718096' }}>km</span>
                    </div>
                  </div>
                ))}
                {venues.length === 0 && (
                  <p style={{ fontSize: '14px', color: '#718096', fontStyle: 'italic' }}>
                    会場を先に登録してください
                  </p>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSave}
                disabled={!formData.name}
                style={{
                  padding: '10px 24px',
                  background: !formData.name ? '#cbd5e0' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: !formData.name ? 'not-allowed' : 'pointer',
                  fontWeight: '600'
                }}
              >
                保存
              </button>
              <button
                onClick={() => {
                  setEditing(null);
                  setFormData({ userId: '', name: '', venueDistances: {} });
                }}
                style={{
                  padding: '10px 24px',
                  background: '#e2e8f0',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f7fafc' }}>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>スタッフ名</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>ユーザーアカウント</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {yearCoaches.map(coach => {
                const user = users.find(u => u.id === coach.userId);
                return (
                  <tr key={coach.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#1a202c' }}>{coach.name}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#718096' }}>{user?.username || '-'}</td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setEditing(coach);
                            setFormData({ 
                              userId: coach.userId, 
                              name: coach.name,
                              venueDistances: coach.venueDistances || {}
                            });
                          }}
                          style={{
                            padding: '6px 12px',
                            background: '#e2e8f0',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            console.log('スタッフ削除:', coach.id);
                            const updated = coaches.filter(c => c.id !== coach.id);
                            setCoaches(updated);
                            storage.set('coaches', updated);
                          }}
                          style={{
                            padding: '6px 12px',
                            background: '#fee',
                            color: '#c33',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {yearCoaches.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>
              スタッフが登録されていません
            </div>
          )}
        </div>
      </div>
    );
  };

  // 会場設定
  const VenueSettings = () => {
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({ name: '' });

    const handleSave = async () => {
      if (editing?.id) {
        const updated = venues.map(v => v.id === editing.id ? { ...v, ...formData } : v);
        setVenues(updated);
        await storage.set('venues', updated);
      } else {
        const newVenue = { id: Date.now().toString(), ...formData };
        const updated = [...venues, newVenue];
        setVenues(updated);
        await storage.set('venues', updated);
      }
      setEditing(null);
      setFormData({ name: '' });
    };

    const handleDelete = async (id) => {
      
      console.log('削除ID:', id);
      const updated = venues.filter(v => v.id !== id);
      
      setVenues(updated);
      storage.set('venues', updated).then(() => {
        showNotification('会場を削除しました');
      });
    };

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c' }}>会場管理</h2>
          <button
            onClick={() => {
              setEditing({});
              setFormData({ name: '' });
            }}
            style={{
              padding: '10px 20px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600'
            }}
          >
            <Plus size={20} /> 会場追加
          </button>
        </div>

        {editing && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            border: '2px solid #667eea'
          }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
              {editing.id ? '会場編集' : '新規会場'}
            </h3>
            <div style={{ display: 'grid', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  会場名 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="〇〇体育館"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSave}
                style={{
                  padding: '10px 24px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                保存
              </button>
              <button
                onClick={() => {
                  setEditing(null);
                  setFormData({ name: '' });
                }}
                style={{
                  padding: '10px 24px',
                  background: '#e2e8f0',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gap: '16px' }}>
          {venues.map(venue => (
            <div key={venue.id} style={{
              background: 'white',
              borderRadius: '12px',
              padding: '16px 20px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c' }}>
                    {venue.name}
                  </h4>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setEditing(venue);
                      setFormData({ name: venue.name });
                    }}
                    style={{
                      padding: '8px 16px',
                      background: '#e2e8f0',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Edit2 size={16} /> 編集
                  </button>
                  <button
                    onClick={() => {
                      console.log('会場削除:', venue.id);
                      const updated = venues.filter(v => v.id !== venue.id);
                      setVenues(updated);
                      storage.set('venues', updated);
                    }}
                    style={{
                      padding: '8px 16px',
                      background: '#fee',
                      color: '#c33',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Trash2 size={16} /> 削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {venues.length === 0 && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#718096' }}>
            会場が登録されていません
          </div>
        )}
      </div>
    );
  };

  // カテゴリー設定
  const CategorySettings = () => {
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({ type: 'income', name: '' });

    const handleSave = async () => {
      if (editing?.id) {
        const updated = categories.map(c => c.id === editing.id ? { ...c, ...formData } : c);
        setCategories(updated);
        await storage.set('categories', updated);
      } else {
        const newCategory = { id: Date.now().toString(), ...formData };
        const updated = [...categories, newCategory];
        setCategories(updated);
        await storage.set('categories', updated);
      }
      setEditing(null);
      setFormData({ type: 'income', name: '' });
    };

    const handleDelete = async (id) => {
      
      console.log('削除ID:', id);
      const updated = categories.filter(c => c.id !== id);
      
      setCategories(updated);
      storage.set('categories', updated).then(() => {
        showNotification('カテゴリーを削除しました');
      });
    };

    const incomeCategories = categories.filter(c => c.type === 'income');
    const expenseCategories = categories.filter(c => c.type === 'expense');

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c' }}>収支カテゴリー設定</h2>
          <button
            onClick={() => {
              setEditing({});
              setFormData({ type: 'income', name: '' });
            }}
            style={{
              padding: '10px 20px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600'
            }}
          >
            <Plus size={20} /> カテゴリー追加
          </button>
        </div>

        {editing && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            border: '2px solid #667eea'
          }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
              {editing.id ? 'カテゴリー編集' : '新規カテゴリー'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  種類 *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="income">収入</option>
                  <option value="expense">支出</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  カテゴリー名 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="会費、教材費など"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSave}
                style={{
                  padding: '10px 24px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                保存
              </button>
              <button
                onClick={() => {
                  setEditing(null);
                  setFormData({ type: 'income', name: '' });
                }}
                style={{
                  padding: '10px 24px',
                  background: '#e2e8f0',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c', marginBottom: '16px' }}>収入カテゴリー</h3>
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              {incomeCategories.map(cat => (
                <div key={cat.id} style={{
                  padding: '16px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#1a202c', fontSize: '14px' }}>{cat.name}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setEditing(cat);
                        setFormData({ type: cat.type, name: cat.name });
                      }}
                      style={{
                        padding: '6px 12px',
                        background: '#e2e8f0',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        console.log('カテゴリー削除:', cat.id);
                        const updated = categories.filter(c => c.id !== cat.id);
                        setCategories(updated);
                        storage.set('categories', updated);
                      }}
                      style={{
                        padding: '6px 12px',
                        background: '#fee',
                        color: '#c33',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {incomeCategories.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', color: '#718096' }}>
                  収入カテゴリーがありません
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c', marginBottom: '16px' }}>支出カテゴリー</h3>
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              {expenseCategories.map(cat => (
                <div key={cat.id} style={{
                  padding: '16px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#1a202c', fontSize: '14px' }}>{cat.name}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setEditing(cat);
                        setFormData({ type: cat.type, name: cat.name });
                      }}
                      style={{
                        padding: '6px 12px',
                        background: '#e2e8f0',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        console.log('カテゴリー削除:', cat.id);
                        const updated = categories.filter(c => c.id !== cat.id);
                        setCategories(updated);
                        storage.set('categories', updated);
                      }}
                      style={{
                        padding: '6px 12px',
                        background: '#fee',
                        color: '#c33',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {expenseCategories.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', color: '#718096' }}>
                  支出カテゴリーがありません
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 会費管理
  const MembershipFeeManagement = () => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [pendingSave, setPendingSave] = useState(false);
    const saveTimeoutRef = useRef(null);
    const yearMembers = selectedYear ? members.filter(m => m.fiscalYearId === selectedYear.id) : [];
    
    // デバウンス保存
    useEffect(() => {
      if (pendingSave) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        
        saveTimeoutRef.current = setTimeout(async () => {
          try {
            await storage.set('membershipPayments', membershipPayments);
            console.log('会費データを保存しました');
            setPendingSave(false);
            setIsUpdating(false);
          } catch (error) {
            console.error('会費保存エラー:', error);
            setIsUpdating(false);
          }
        }, 500); // 500ms待ってから保存
      }
      
      return () => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
      };
    }, [membershipPayments, pendingSave]);
    
    // 年度の月リストを生成（開始月〜終了月）
    const getMonthsList = () => {
      if (!selectedYear) return [];
      const start = new Date(selectedYear.startMonth + '-01');
      const end = new Date(selectedYear.endMonth + '-01');
      const months = [];
      
      let current = new Date(start);
      while (current <= end) {
        months.push(current.toISOString().slice(0, 7)); // YYYY-MM形式
        current.setMonth(current.getMonth() + 1);
      }
      return months;
    };
    
    const monthsList = getMonthsList();
    
    const handleTogglePayment = (memberId, month) => {
      if (!selectedYear) return;
      
      setIsUpdating(true);
      
      const paymentKey = `${selectedYear.id}-${memberId}-${month}`;
      const existingPayment = membershipPayments.find(p => p.id === paymentKey);
      
      let updated;
      if (existingPayment) {
        // 支払い状態をトグル
        updated = membershipPayments.map(p => 
          p.id === paymentKey ? { ...p, paid: !p.paid } : p
        );
      } else {
        // 新規支払い記録
        const newPayment = {
          id: paymentKey,
          fiscalYearId: selectedYear.id,
          memberId: memberId,
          month: month,
          paid: true
        };
        updated = [...membershipPayments, newPayment];
      }
      
      setMembershipPayments(updated);
      setPendingSave(true);
    };

    const getPaymentStatus = (memberId, month) => {
      if (!selectedYear) return false;
      const paymentKey = `${selectedYear.id}-${memberId}-${month}`;
      const payment = membershipPayments.find(p => p.id === paymentKey);
      return payment?.paid || false;
    };

    // 会員ごとの入金済み月数をカウント
    const getPaidMonthsCount = (memberId) => {
      return monthsList.filter(month => getPaymentStatus(memberId, month)).length;
    };

    // 現在の月を取得
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM形式
    
    // 現在月までの月リストを取得
    const monthsUpToNow = monthsList.filter(month => month <= currentMonth);
    
    // 現在月までに未入金がある会員数をカウント
    const getMembersWithUnpaidUpToNow = () => {
      return yearMembers.filter(member => {
        // この会員が現在月までに1つでも未入金の月があるか
        return monthsUpToNow.some(month => !getPaymentStatus(member.id, month));
      }).length;
    };

    // 統計計算
    const totalMonths = monthsList.length;
    
    // 入金済み会費の合計（各会員の会費 × 入金済み月数）
    const totalPaidFees = yearMembers.reduce((sum, member) => {
      const paidCount = getPaidMonthsCount(member.id);
      return sum + (member.fee || 0) * paidCount;
    }, 0);
    
    const unpaidMembersUpToNow = getMembersWithUnpaidUpToNow(); // 現在までの未入金者数

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c' }}>
            会費管理 {selectedYear && `(${selectedYear.name})`}
          </h2>
          {isUpdating && (
            <span style={{ 
              fontSize: '13px', 
              color: '#667eea', 
              background: '#eef2ff',
              padding: '4px 12px',
              borderRadius: '12px',
              fontWeight: '600'
            }}>
              保存中...
            </span>
          )}
        </div>
        <p style={{ color: '#718096', marginBottom: '24px' }}>会員の月ごとの会費納入状況を管理します</p>

        {!selectedYear && (
          <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
            <p style={{ color: '#856404' }}>年度を選択してください</p>
          </div>
        )}

        {selectedYear && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                padding: '24px',
                color: 'white'
              }}>
                <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>入金済み会費</p>
                <p style={{ fontSize: '32px', fontWeight: '700' }}>¥{totalPaidFees.toLocaleString()}</p>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: '12px',
                padding: '24px',
                color: 'white'
              }}>
                <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>現在までの未入金者</p>
                <p style={{ fontSize: '32px', fontWeight: '700' }}>{unpaidMembersUpToNow}人</p>
                <p style={{ fontSize: '13px', opacity: 0.8, marginTop: '4px' }}>
                  {currentMonth.slice(5)}月まで
                </p>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', overflow: 'auto', border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead style={{ background: '#f7fafc' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4a5568', position: 'sticky', left: 0, background: '#f7fafc', zIndex: 1 }}>氏名</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>学年</th>
                    {monthsList.map(month => (
                      <th key={month} style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#4a5568', minWidth: '70px' }}>
                        {month.slice(5)}月
                      </th>
                    ))}
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>済</th>
                  </tr>
                </thead>
                <tbody>
                  {yearMembers.map(member => {
                    const paidCount = getPaidMonthsCount(member.id);
                    return (
                      <tr key={member.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1a202c', position: 'sticky', left: 0, background: 'white', zIndex: 1 }}>{member.name}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#718096' }}>{member.grade}</td>
                        {monthsList.map(month => {
                          const isPaid = getPaymentStatus(member.id, month);
                          return (
                            <td key={month} style={{ padding: '8px', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={isPaid}
                                onChange={() => handleTogglePayment(member.id, month)}
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  cursor: 'pointer',
                                  accentColor: '#667eea'
                                }}
                              />
                            </td>
                          );
                        })}
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: paidCount === totalMonths ? '#155724' : '#721c24' }}>
                          {paidCount}/{totalMonths}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {yearMembers.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>
                  会員が登録されていません
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  // 収入管理
  const IncomeManagement = () => {
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({ date: '', categoryId: '', amount: '', description: '' });
    const [filterMonth, setFilterMonth] = useState('');

    const yearIncomes = selectedYear ? incomes.filter(i => i.fiscalYearId === selectedYear.id) : [];
    
    // 月フィルター適用
    const filteredIncomes = filterMonth 
      ? yearIncomes.filter(i => i.date && i.date.startsWith(filterMonth))
      : yearIncomes;

    const handleSave = async () => {
      if (!selectedYear) {
        showNotification('年度を選択してください', 'error');
        return;
      }

      let updated;
      if (editing?.id) {
        updated = incomes.map(i => i.id === editing.id ? { ...i, ...formData, amount: Number(formData.amount) } : i);
      } else {
        const newIncome = { id: Date.now().toString(), fiscalYearId: selectedYear.id, ...formData, amount: Number(formData.amount) };
        updated = [...incomes, newIncome];
      }
      
      setIncomes(updated);
      await storage.set('incomes', updated);
      
      // データ再読み込み
      await loadAllData();
      
      setEditing(null);
      setFormData({ date: '', categoryId: '', amount: '', description: '' });
      showNotification(editing?.id ? '収入を更新しました' : '収入を追加しました');
    };

    const handleDelete = async (id) => {
      
      console.log('削除ID:', id);
      console.log('削除前の収入:', incomes);
      
      const updated = incomes.filter(i => i.id !== id);
      console.log('削除後の収入:', updated);
      
      // 即座に状態を更新
      setIncomes(updated);
      
      // バックグラウンドでストレージに保存
      storage.set('incomes', updated).then(() => {
        console.log('ストレージ保存完了');
        showNotification('収入を削除しました');
      }).catch(err => {
        console.error('保存失敗:', err);
      });
    };

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c' }}>
            収入管理 {selectedYear && `(${selectedYear.name})`}
          </h2>
          <button
            onClick={() => {
              if (!selectedYear) {
                showNotification('年度を選択してください', 'error');
                return;
              }
              setEditing({});
              setFormData({ date: '', categoryId: '', amount: '', description: '' });
            }}
            style={{
              padding: '10px 20px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600'
            }}
          >
            <Plus size={20} /> 収入追加
          </button>
        </div>

        {/* 月フィルター */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
            月で絞り込み:
          </label>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
          {filterMonth && (
            <button
              onClick={() => setFilterMonth('')}
              style={{
                padding: '8px 16px',
                background: '#e2e8f0',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              クリア
            </button>
          )}
          <span style={{ color: '#718096', fontSize: '14px' }}>
            {filteredIncomes.length}件の記録
          </span>
        </div>

        {!selectedYear && (
          <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
            <p style={{ color: '#856404' }}>年度を選択してください</p>
          </div>
        )}

        {editing && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            border: '2px solid #667eea'
          }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
              {editing.id ? '収入編集' : '新規収入'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  日付 *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  カテゴリー *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">選択してください</option>
                  {categories.filter(c => c.type === 'income').map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  金額 *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="10000"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                摘要
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="詳細説明"
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSave}
                style={{
                  padding: '10px 24px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                保存
              </button>
              <button
                onClick={() => {
                  setEditing(null);
                  setFormData({ date: '', categoryId: '', memberId: '', amount: '', description: '' });
                }}
                style={{
                  padding: '10px 24px',
                  background: '#e2e8f0',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f7fafc' }}>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>日付</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>カテゴリー</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>金額</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>摘要</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncomes.sort((a, b) => new Date(b.date) - new Date(a.date)).map(income => {
                const category = categories.find(c => c.id === income.categoryId);
                return (
                  <tr key={income.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#1a202c' }}>{income.date}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#718096' }}>{category?.name || '-'}</td>
                    <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: '#1a202c', fontWeight: '600' }}>
                      ¥{income.amount.toLocaleString()}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#718096' }}>{income.description}</td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setEditing(income);
                            setFormData({
                              date: income.date,
                              categoryId: income.categoryId,
                              amount: income.amount.toString(),
                              description: income.description
                            });
                          }}
                          style={{
                            padding: '6px 12px',
                            background: '#e2e8f0',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            console.log('収入削除:', income.id);
                            const updated = incomes.filter(i => i.id !== income.id);
                            setIncomes(updated);
                            storage.set('incomes', updated);
                          }}
                          style={{
                            padding: '6px 12px',
                            background: '#fee',
                            color: '#c33',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredIncomes.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>
              {filterMonth ? '該当する収入記録がありません' : '収入記録がありません'}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 支出管理
  const ExpenseManagement = () => {
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({ date: '', categoryId: '', amount: '', description: '' });
    const [filterMonth, setFilterMonth] = useState('');

    const yearExpenses = selectedYear ? expenses.filter(e => e.fiscalYearId === selectedYear.id) : [];
    
    // 月フィルター適用
    const filteredExpenses = filterMonth 
      ? yearExpenses.filter(e => e.date && e.date.startsWith(filterMonth))
      : yearExpenses;

    const handleSave = async () => {
      if (!selectedYear) {
        showNotification('年度を選択してください', 'error');
        return;
      }

      let updated;
      if (editing?.id) {
        updated = expenses.map(e => e.id === editing.id ? { ...e, ...formData, amount: Number(formData.amount) } : e);
      } else {
        const newExpense = { id: Date.now().toString(), fiscalYearId: selectedYear.id, ...formData, amount: Number(formData.amount) };
        updated = [...expenses, newExpense];
      }
      
      setExpenses(updated);
      await storage.set('expenses', updated);
      
      // データ再読み込み
      await loadAllData();
      
      setEditing(null);
      setFormData({ date: '', categoryId: '', amount: '', description: '' });
      showNotification(editing?.id ? '支出を更新しました' : '支出を追加しました');
    };

    const handleDelete = async (id) => {
      
      console.log('削除ID:', id);
      console.log('削除前の支出:', expenses);
      
      const updated = expenses.filter(e => e.id !== id);
      console.log('削除後の支出:', updated);
      
      // 即座に状態を更新
      setExpenses(updated);
      
      // バックグラウンドでストレージに保存
      storage.set('expenses', updated).then(() => {
        console.log('ストレージ保存完了');
        showNotification('支出を削除しました');
      }).catch(err => {
        console.error('保存失敗:', err);
      });
    };

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c' }}>
            支出管理 {selectedYear && `(${selectedYear.name})`}
          </h2>
          <button
            onClick={() => {
              if (!selectedYear) {
                showNotification('年度を選択してください', 'error');
                return;
              }
              setEditing({});
              setFormData({ date: '', categoryId: '', amount: '', description: '' });
            }}
            style={{
              padding: '10px 20px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600'
            }}
          >
            <Plus size={20} /> 支出追加
          </button>
        </div>

        {/* 月フィルター */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
            月で絞り込み:
          </label>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
          {filterMonth && (
            <button
              onClick={() => setFilterMonth('')}
              style={{
                padding: '8px 16px',
                background: '#e2e8f0',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              クリア
            </button>
          )}
          <span style={{ color: '#718096', fontSize: '14px' }}>
            {filteredExpenses.length}件の記録
          </span>
        </div>

        {!selectedYear && (
          <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
            <p style={{ color: '#856404' }}>年度を選択してください</p>
          </div>
        )}

        {editing && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            border: '2px solid #667eea'
          }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
              {editing.id ? '支出編集' : '新規支出'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  日付 *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  カテゴリー *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">選択してください</option>
                  {categories.filter(c => c.type === 'expense').map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  金額 *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="5000"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                摘要
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="詳細説明"
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSave}
                style={{
                  padding: '10px 24px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                保存
              </button>
              <button
                onClick={() => {
                  setEditing(null);
                  setFormData({ date: '', categoryId: '', coachId: '', amount: '', description: '' });
                }}
                style={{
                  padding: '10px 24px',
                  background: '#e2e8f0',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f7fafc' }}>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>日付</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>カテゴリー</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>金額</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>摘要</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date)).map(expense => {
                const category = categories.find(c => c.id === expense.categoryId);
                return (
                  <tr key={expense.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#1a202c' }}>{expense.date}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#718096' }}>{category?.name || '-'}</td>
                    <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: '#1a202c', fontWeight: '600' }}>
                      ¥{expense.amount.toLocaleString()}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#718096' }}>{expense.description}</td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setEditing(expense);
                            setFormData({
                              date: expense.date,
                              categoryId: expense.categoryId,
                              amount: expense.amount.toString(),
                              description: expense.description
                            });
                          }}
                          style={{
                            padding: '6px 12px',
                            background: '#e2e8f0',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            console.log('支出削除:', expense.id);
                            const updated = expenses.filter(e => e.id !== expense.id);
                            setExpenses(updated);
                            storage.set('expenses', updated);
                          }}
                          style={{
                            padding: '6px 12px',
                            background: '#fee',
                            color: '#c33',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredExpenses.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>
              {filterMonth ? '該当する支出記録がありません' : '支出記録がありません'}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 活動記録（コーチ・トレーナー用）
  const CoachActivities = () => {
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({ date: '', venueId: '', customVenue: '', distance: '', coachFee: '', etcFee: '', description: '練習' });

    const myCoach = coaches.find(c => c.userId === currentUser?.id && (!selectedYear || c.fiscalYearId === selectedYear.id));
    const myActivities = selectedYear && myCoach 
      ? activities.filter(a => a.fiscalYearId === selectedYear.id && a.coachId === myCoach.id)
      : [];

    const handleSave = async () => {
      if (!selectedYear) {
        showNotification('年度を選択してください', 'error');
        return;
      }
      if (!myCoach) {
        showNotification('この年度にスタッフとして登録されていません', 'error');
        return;
      }

      if (editing?.id) {
        // 交通費を計算
        const user = users.find(u => u.id === currentUser?.id);
        const transportCost = formData.distance && user?.transportRate 
          ? Number(formData.distance) * Number(user.transportRate)
          : 0;
        const totalFee = Number(formData.coachFee || 0) + transportCost + Number(formData.etcFee || 0);
        
        const updated = activities.map(a => a.id === editing.id ? { 
          ...a, 
          ...formData, 
          coachFee: Number(formData.coachFee || 0),
          transportCost: transportCost,
          etcFee: Number(formData.etcFee || 0),
          totalFee: totalFee,
          distance: Number(formData.distance) || 0
        } : a);
        setActivities(updated);
        await storage.set('activities', updated);
      } else {
        // 交通費を計算
        const user = users.find(u => u.id === currentUser?.id);
        const transportCost = formData.distance && user?.transportRate 
          ? Number(formData.distance) * Number(user.transportRate)
          : 0;
        const totalFee = Number(formData.coachFee || 0) + transportCost + Number(formData.etcFee || 0);
        
        const newActivity = { 
          id: Date.now().toString(), 
          fiscalYearId: selectedYear.id, 
          coachId: myCoach.id,
          ...formData, 
          coachFee: Number(formData.coachFee || 0),
          transportCost: transportCost,
          etcFee: Number(formData.etcFee || 0),
          totalFee: totalFee,
          distance: Number(formData.distance) || 0
        };
        const updated = [...activities, newActivity];
        setActivities(updated);
        await storage.set('activities', updated);
      }
      setEditing(null);
      // ログインユーザーの練習コーチ代を取得
      const user = users.find(u => u.id === currentUser?.id);
      const defaultFee = user?.practiceFee || '';
      setFormData({ date: '', venueId: '', customVenue: '', distance: '', coachFee: defaultFee, etcFee: '', description: '練習' });
    };

    const handleDelete = async (id) => {
      
      console.log('削除ID:', id);
      const updated = activities.filter(a => a.id !== id);
      
      setActivities(updated);
      storage.set('activities', updated).then(() => {
        showNotification('活動記録を削除しました');
      });
    };

    const totalFee = myActivities.reduce((sum, a) => sum + a.fee, 0);

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c' }}>
            活動記録 {selectedYear && `(${selectedYear.name})`}
          </h2>
          <button
            onClick={() => {
              if (!selectedYear) {
                showNotification('年度を選択してください', 'error');
                return;
              }
              if (!myCoach) {
                showNotification('この年度にスタッフとして登録されていません', 'error');
                return;
              }
              // ログインユーザーの練習コーチ代を取得
              const user = users.find(u => u.id === currentUser?.id);
              const defaultFee = user?.practiceFee || '';
              setEditing({});
              setFormData({ date: '', venueId: '', customVenue: '', distance: '', coachFee: defaultFee, etcFee: '', description: '練習' });
            }}
            style={{
              padding: '10px 20px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600'
            }}
          >
            <Plus size={20} /> 活動追加
          </button>
        </div>

        {!selectedYear && (
          <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
            <p style={{ color: '#856404' }}>年度を選択してください</p>
          </div>
        )}

        {selectedYear && !myCoach && (
          <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
            <p style={{ color: '#856404' }}>この年度にスタッフとして登録されていません。会計担当にスタッフ登録を依頼してください。</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            padding: '24px',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <Activity size={24} />
              <span style={{ marginLeft: '8px', fontSize: '14px', opacity: 0.9 }}>活動回数</span>
            </div>
            <p style={{ fontSize: '32px', fontWeight: '700' }}>{myActivities.length}回</p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            borderRadius: '12px',
            padding: '24px',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <DollarSign size={24} />
              <span style={{ marginLeft: '8px', fontSize: '14px', opacity: 0.9 }}>コーチ代合計</span>
            </div>
            <p style={{ fontSize: '32px', fontWeight: '700' }}>¥{totalFee.toLocaleString()}</p>
          </div>
        </div>

        {editing && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            border: '2px solid #667eea'
          }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
              {editing.id ? '活動編集' : '新規活動'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  日付 *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  種別 *
                </label>
                <select
                  value={formData.description}
                  onChange={(e) => {
                    const newDescription = e.target.value;
                    // ログインユーザーの情報を取得
                    const user = users.find(u => u.id === currentUser?.id);
                    
                    // 種別に応じてコーチ代を設定
                    const coachFee = newDescription === '練習' 
                      ? (user?.practiceFee || '') 
                      : (user?.matchFee || '');
                    
                    setFormData({ ...formData, description: newDescription, coachFee: coachFee });
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="練習">練習</option>
                  <option value="試合">試合</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  会場 *
                </label>
                <select
                  value={formData.venueId}
                  onChange={(e) => {
                    const venueId = e.target.value;
                    
                    // コーチの会場距離設定から距離を取得
                    const distance = myCoach?.venueDistances?.[venueId] || '';
                    
                    // コーチ代を取得
                    const user = users.find(u => u.id === currentUser?.id);
                    const coachFee = formData.description === '練習' 
                      ? (user?.practiceFee || '') 
                      : (user?.matchFee || '');
                    
                    setFormData({ 
                      ...formData, 
                      venueId, 
                      distance: distance || '',
                      customVenue: '',
                      coachFee: coachFee
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">選択してください</option>
                  {venues.map(venue => (
                    <option key={venue.id} value={venue.id}>{venue.name}</option>
                  ))}
                  <option value="other">その他...</option>
                </select>
              </div>
              
              {formData.venueId === 'other' && (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                      会場名（その他）
                    </label>
                    <input
                      type="text"
                      value={formData.customVenue}
                      onChange={(e) => setFormData({ ...formData, customVenue: e.target.value })}
                      placeholder="会場名を入力"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                      距離（km）
                    </label>
                    <input
                      type="number"
                      value={formData.distance}
                      onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                      placeholder="15"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </>
              )}
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  ETC代
                </label>
                <input
                  type="number"
                  value={formData.etcFee}
                  onChange={(e) => setFormData({ ...formData, etcFee: e.target.value })}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                <p style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>高速利用時のみ入力</p>
              </div>
            </div>
            
            {/* 計算内容の表示 */}
            {formData.venueId && formData.distance && (
              <div style={{ 
                background: '#f0f9ff', 
                border: '1px solid #bfdbfe', 
                borderRadius: '8px', 
                padding: '12px', 
                marginBottom: '16px',
                fontSize: '13px',
                color: '#1e40af'
              }}>
                <p style={{ marginBottom: '4px' }}>
                  <strong>計算内容：</strong>
                </p>
                <p>距離: {formData.distance}km {formData.venueId !== 'other' && myCoach?.venueDistances?.[formData.venueId] && '（スタッフ設定より）'}</p>
                <p>コーチ代: ¥{formData.coachFee?.toLocaleString() || '0'}</p>
                <p>交通費: ¥{
                  formData.distance && users.find(u => u.id === currentUser?.id)?.transportRate
                    ? (Number(formData.distance) * Number(users.find(u => u.id === currentUser?.id).transportRate)).toLocaleString()
                    : '0'
                } ({formData.distance}km × ¥{users.find(u => u.id === currentUser?.id)?.transportRate || 0}/km)</p>
                <p>ETC代: ¥{formData.etcFee?.toLocaleString() || '0'}</p>
                <p style={{ marginTop: '8px', fontSize: '14px', fontWeight: '600' }}>
                  合計報酬: ¥{
                    (Number(formData.coachFee || 0) + 
                    (formData.distance && users.find(u => u.id === currentUser?.id)?.transportRate
                      ? Number(formData.distance) * Number(users.find(u => u.id === currentUser?.id).transportRate)
                      : 0) +
                    Number(formData.etcFee || 0)).toLocaleString()
                  }
                </p>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSave}
                style={{
                  padding: '10px 24px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                保存
              </button>
              <button
                onClick={() => {
                  setEditing(null);
                  // ログインユーザーの練習コーチ代を取得
                  const user = users.find(u => u.id === currentUser?.id);
                  const defaultFee = user?.practiceFee || '';
                  setFormData({ date: '', venueId: '', customVenue: '', distance: '', coachFee: defaultFee, etcFee: '', description: '練習' });
                }}
                style={{
                  padding: '10px 24px',
                  background: '#e2e8f0',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f7fafc' }}>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>日付</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>会場</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>距離</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>コーチ代</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>交通費</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>ETC代</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>合計</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>種別</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {myActivities.sort((a, b) => new Date(b.date) - new Date(a.date)).map(activity => {
                const venue = venues.find(v => v.id === activity.venueId);
                const venueName = activity.customVenue || venue?.name || '-';
                return (
                  <tr key={activity.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#1a202c' }}>{activity.date}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#718096' }}>{venueName}</td>
                    <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: '#718096' }}>
                      {activity.distance ? `${activity.distance}km` : '-'}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: '#1a202c' }}>
                      ¥{(activity.coachFee || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: '#1a202c' }}>
                      ¥{(activity.transportCost || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: '#1a202c' }}>
                      ¥{(activity.etcFee || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: '#1a202c', fontWeight: '600' }}>
                      ¥{(activity.totalFee || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#718096' }}>{activity.description}</td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setEditing(activity);
                            setFormData({
                              date: activity.date,
                              venueId: activity.venueId || '',
                              customVenue: activity.customVenue || '',
                              distance: activity.distance?.toString() || '',
                              coachFee: activity.coachFee?.toString() || '',
                              etcFee: activity.etcFee?.toString() || '',
                              description: activity.description
                            });
                          }}
                          style={{
                            padding: '6px 12px',
                            background: '#e2e8f0',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            console.log('活動削除:', activity.id);
                            const updated = activities.filter(a => a.id !== activity.id);
                            setActivities(updated);
                            storage.set('activities', updated);
                          }}
                          style={{
                            padding: '6px 12px',
                            background: '#fee',
                            color: '#c33',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {myActivities.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>
              活動記録がありません
            </div>
          )}
        </div>
      </div>
    );
  };

  // 報酬管理（会計担当用）
  const CoachPaymentManagement = () => {
    const [filterMonth, setFilterMonth] = useState('');
    const [selectedCoachId, setSelectedCoachId] = useState('');
    
    const yearActivities = selectedYear ? activities.filter(a => a.fiscalYearId === selectedYear.id) : [];
    const yearCoaches = selectedYear ? coaches.filter(c => c.fiscalYearId === selectedYear.id) : [];
    
    // 月フィルター適用
    const filteredActivities = filterMonth
      ? yearActivities.filter(a => a.date.startsWith(filterMonth))
      : yearActivities;
    
    // コーチフィルター適用
    const displayActivities = selectedCoachId
      ? filteredActivities.filter(a => a.coachId === selectedCoachId)
      : filteredActivities;
    
    // スタッフフィルター適用後のコーチリスト
    const displayCoaches = selectedCoachId
      ? yearCoaches.filter(c => c.id === selectedCoachId)
      : yearCoaches;
    
    // コーチごとの集計
    const coachSummaries = displayCoaches.map(coach => {
      const coachActivities = filteredActivities.filter(a => a.coachId === coach.id);
      const totalPayment = coachActivities.reduce((sum, a) => sum + (a.totalFee || 0), 0);
      const activityCount = coachActivities.length;
      const user = users.find(u => u.id === coach.userId);
      
      return {
        coach,
        user,
        totalPayment,
        activityCount
      };
    });
    
    const totalPayments = coachSummaries.reduce((sum, cs) => sum + cs.totalPayment, 0);
    const totalActivities = coachSummaries.reduce((sum, cs) => sum + cs.activityCount, 0);
    
    return (
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c', marginBottom: '8px' }}>
          報酬管理 {selectedYear && `(${selectedYear.name})`}
        </h2>
        <p style={{ color: '#718096', marginBottom: '24px' }}>コーチ・トレーナーの報酬を確認します</p>

        {!selectedYear && (
          <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
            <p style={{ color: '#856404' }}>年度を選択してください</p>
          </div>
        )}

        {selectedYear && (
          <>
            {/* 統計カード */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                padding: '24px',
                color: 'white'
              }}>
                <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>総支払額</p>
                <p style={{ fontSize: '32px', fontWeight: '700' }}>¥{totalPayments.toLocaleString()}</p>
                <p style={{ fontSize: '14px', opacity: 0.9, marginTop: '4px' }}>{filterMonth ? `${filterMonth.slice(5)}月分` : '全期間'}</p>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                borderRadius: '12px',
                padding: '24px',
                color: 'white'
              }}>
                <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>活動回数</p>
                <p style={{ fontSize: '32px', fontWeight: '700' }}>{totalActivities}回</p>
                <p style={{ fontSize: '14px', opacity: 0.9, marginTop: '4px' }}>
                  {selectedCoachId 
                    ? displayCoaches[0] && users.find(u => u.id === displayCoaches[0].userId)?.name 
                    : `${displayCoaches.length}名のスタッフ`}
                </p>
              </div>
            </div>

            {/* フィルター */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  月フィルター
                </label>
                <input
                  type="month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                  スタッフフィルター
                </label>
                <select
                  value={selectedCoachId}
                  onChange={(e) => setSelectedCoachId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">全員</option>
                  {yearCoaches.map(coach => {
                    const user = users.find(u => u.id === coach.userId);
                    return (
                      <option key={coach.id} value={coach.id}>{user?.name || '-'}</option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* コーチ別集計 */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c', marginBottom: '16px' }}>
                スタッフ別集計
              </h3>
              <div style={{ display: 'grid', gap: '16px' }}>
                {coachSummaries.map(({ coach, user, totalPayment, activityCount }) => (
                  <div key={coach.id} style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1a202c', marginBottom: '4px' }}>
                        {user?.name || '-'}
                      </h4>
                      <p style={{ fontSize: '14px', color: '#718096' }}>
                        活動回数: {activityCount}回
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '24px', fontWeight: '700', color: '#667eea' }}>
                        ¥{totalPayment.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 活動記録詳細 */}
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c', marginBottom: '16px' }}>
                活動記録詳細
              </h3>
              <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f7fafc' }}>
                    <tr>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>日付</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>スタッフ</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>会場</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>種別</th>
                      <th style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>距離</th>
                      <th style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>コーチ代</th>
                      <th style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>交通費</th>
                      <th style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>ETC代</th>
                      <th style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>合計</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayActivities.sort((a, b) => new Date(b.date) - new Date(a.date)).map(activity => {
                      const coach = yearCoaches.find(c => c.id === activity.coachId);
                      const user = users.find(u => u.id === coach?.userId);
                      const venue = venues.find(v => v.id === activity.venueId);
                      const venueName = activity.customVenue || venue?.name || '-';
                      
                      return (
                        <tr key={activity.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '16px', fontSize: '14px', color: '#1a202c' }}>{activity.date}</td>
                          <td style={{ padding: '16px', fontSize: '14px', color: '#718096' }}>{user?.name || '-'}</td>
                          <td style={{ padding: '16px', fontSize: '14px', color: '#718096' }}>{venueName}</td>
                          <td style={{ padding: '16px', fontSize: '14px', color: '#718096' }}>{activity.description}</td>
                          <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: '#718096' }}>
                            {activity.distance ? `${activity.distance}km` : '-'}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: '#1a202c' }}>
                            ¥{(activity.coachFee || 0).toLocaleString()}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: '#1a202c' }}>
                            ¥{(activity.transportCost || 0).toLocaleString()}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: '#1a202c' }}>
                            ¥{(activity.etcFee || 0).toLocaleString()}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: '#1a202c', fontWeight: '600' }}>
                            ¥{(activity.totalFee || 0).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {displayActivities.length === 0 && (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>
                    活動記録がありません
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // 年度決算レポート
  const FiscalReport = () => {
    if (!selectedYear) {
      return (
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c', marginBottom: '24px' }}>年度収支決算</h2>
          <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '16px' }}>
            <p style={{ color: '#856404' }}>年度を選択してください</p>
          </div>
        </div>
      );
    }

    const yearIncomes = incomes.filter(i => i.fiscalYearId === selectedYear.id);
    const yearExpenses = expenses.filter(e => e.fiscalYearId === selectedYear.id);

    const totalIncome = yearIncomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = yearExpenses.reduce((sum, e) => sum + e.amount, 0);
    const balance = totalIncome - totalExpense;

    // カテゴリー別集計
    const incomeByCategory = {};
    yearIncomes.forEach(income => {
      const cat = categories.find(c => c.id === income.categoryId);
      const catName = cat?.name || '未分類';
      incomeByCategory[catName] = (incomeByCategory[catName] || 0) + income.amount;
    });

    const expenseByCategory = {};
    yearExpenses.forEach(expense => {
      const cat = categories.find(c => c.id === expense.categoryId);
      const catName = cat?.name || '未分類';
      expenseByCategory[catName] = (expenseByCategory[catName] || 0) + expense.amount;
    });

    return (
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c', marginBottom: '24px' }}>
          年度収支決算 ({selectedYear.name})
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            padding: '32px',
            color: 'white'
          }}>
            <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '8px' }}>総収入</p>
            <p style={{ fontSize: '40px', fontWeight: '700' }}>¥{totalIncome.toLocaleString()}</p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            borderRadius: '12px',
            padding: '32px',
            color: 'white'
          }}>
            <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '8px' }}>総支出</p>
            <p style={{ fontSize: '40px', fontWeight: '700' }}>¥{totalExpense.toLocaleString()}</p>
          </div>

          <div style={{
            background: balance >= 0 
              ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
              : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            borderRadius: '12px',
            padding: '32px',
            color: 'white'
          }}>
            <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '8px' }}>収支差額</p>
            <p style={{ fontSize: '40px', fontWeight: '700' }}>
              {balance >= 0 ? '+' : ''}¥{balance.toLocaleString()}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c', marginBottom: '20px' }}>
              収入内訳
            </h3>
            {Object.entries(incomeByCategory).map(([category, amount]) => (
              <div key={category} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid #e2e8f0'
              }}>
                <span style={{ color: '#4a5568', fontSize: '14px' }}>{category}</span>
                <span style={{ color: '#1a202c', fontSize: '16px', fontWeight: '600' }}>
                  ¥{amount.toLocaleString()}
                </span>
              </div>
            ))}
            {Object.keys(incomeByCategory).length === 0 && (
              <p style={{ color: '#718096', textAlign: 'center', padding: '20px' }}>データがありません</p>
            )}
          </div>

          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c', marginBottom: '20px' }}>
              支出内訳
            </h3>
            {Object.entries(expenseByCategory).map(([category, amount]) => (
              <div key={category} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid #e2e8f0'
              }}>
                <span style={{ color: '#4a5568', fontSize: '14px' }}>{category}</span>
                <span style={{ color: '#1a202c', fontSize: '16px', fontWeight: '600' }}>
                  ¥{amount.toLocaleString()}
                </span>
              </div>
            ))}
            {Object.keys(expenseByCategory).length === 0 && (
              <p style={{ color: '#718096', textAlign: 'center', padding: '20px' }}>データがありません</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // パスワード変更
  const ChangePassword = () => {
    const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');

      // 検証
      if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
        setError('全ての項目を入力してください');
        return;
      }

      if (formData.currentPassword !== currentUser.password) {
        setError('現在のパスワードが正しくありません');
        return;
      }

      if (formData.newPassword.length < 4) {
        setError('新しいパスワードは4文字以上で設定してください');
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        setError('新しいパスワードと確認用パスワードが一致しません');
        return;
      }

      // パスワード更新
      const updatedUsers = users.map(u => 
        u.id === currentUser.id 
          ? { ...u, password: formData.newPassword } 
          : u
      );
      
      setUsers(updatedUsers);
      await storage.set('users', updatedUsers);
      
      // 現在のユーザー情報も更新
      setCurrentUser({ ...currentUser, password: formData.newPassword });
      
      // フォームをリセット
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      showNotification('パスワードを変更しました');
    };

    return (
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c', marginBottom: '8px' }}>
          パスワード変更
        </h2>
        <p style={{ color: '#718096', marginBottom: '24px' }}>
          セキュリティのため、定期的にパスワードを変更することをおすすめします
        </p>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '500px',
          border: '1px solid #e2e8f0'
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                現在のパスワード *
              </label>
              <input
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                新しいパスワード *
              </label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <p style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>4文字以上で設定してください</p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568', fontSize: '14px', fontWeight: '600' }}>
                新しいパスワード（確認）*
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            {error && (
              <div style={{
                background: '#fee',
                border: '1px solid #fcc',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                color: '#c33',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                style={{
                  padding: '12px 24px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                パスワードを変更
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setError('');
                }}
                style={{
                  padding: '12px 24px',
                  background: '#e2e8f0',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                クリア
              </button>
            </div>
          </form>
        </div>

        <div style={{
          background: '#f0f9ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '24px',
          maxWidth: '500px'
        }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af', marginBottom: '8px' }}>
            パスワード設定のヒント
          </h4>
          <ul style={{ fontSize: '13px', color: '#1e40af', paddingLeft: '20px', margin: 0 }}>
            <li>4文字以上で設定してください</li>
            <li>英数字を組み合わせると安全性が高まります</li>
            <li>他のサービスと同じパスワードは避けましょう</li>
            <li>定期的に変更することをおすすめします</li>
          </ul>
        </div>
      </div>
    );
  };

  // メインレイアウト
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ fontSize: '18px' }}>読み込み中...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView />;
  }

  const isAccounting = currentUser.role === '会計担当';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', position: 'relative' }}>
      {/* 通知 */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: notification.type === 'error' ? '#fee' : '#d4edda',
          color: notification.type === 'error' ? '#c33' : '#155724',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          border: notification.type === 'error' ? '1px solid #f5c6cb' : '1px solid #c3e6cb',
          fontSize: '14px',
          fontWeight: '600',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {notification.message}
        </div>
      )}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      
      {/* サイドバー */}
      <div style={{
        width: '280px',
        background: 'linear-gradient(180deg, #1a202c 0%, #2d3748 100%)',
        color: 'white',
        padding: '24px',
        boxShadow: '4px 0 12px rgba(0,0,0,0.1)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>会計管理</h1>
          <p style={{ fontSize: '14px', opacity: 0.7 }}>{currentUser.name}</p>
        </div>

        {isAccounting && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', opacity: 0.9 }}>対象年度</label>
            <select
              value={selectedYear?.id || ''}
              onChange={(e) => {
                const year = fiscalYears.find(y => y.id === e.target.value);
                setSelectedYear(year);
                if (year) {
                  localStorage.setItem('savedYearId', year.id);
                  console.log('選択した年度を保存:', year.name);
                } else {
                  localStorage.removeItem('savedYearId');
                }
              }}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                background: 'rgba(255,255,255,0.1)',
                color: 'white'
              }}
            >
              <option value="">年度を選択</option>
              {fiscalYears.map(year => (
                <option key={year.id} value={year.id}>{year.name}</option>
              ))}
            </select>
          </div>
        )}

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {isAccounting ? (
            <>
              <div style={{ fontSize: '12px', opacity: 0.6, margin: '20px 0 12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                設定
              </div>

              <button
                onClick={() => setView('fiscal-years')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: '8px',
                  background: view === 'fiscal-years' ? 'rgba(255,255,255,0.2)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={(e) => e.target.style.background = view === 'fiscal-years' ? 'rgba(255,255,255,0.2)' : 'transparent'}
              >
                <Calendar size={20} /> 年度設定
              </button>

              <button
                onClick={() => setView('users')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: '8px',
                  background: view === 'users' ? 'rgba(255,255,255,0.2)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={(e) => e.target.style.background = view === 'users' ? 'rgba(255,255,255,0.2)' : 'transparent'}
              >
                <Settings size={20} /> ユーザー管理
              </button>

              <button
                onClick={() => setView('members')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: '8px',
                  background: view === 'members' ? 'rgba(255,255,255,0.2)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={(e) => e.target.style.background = view === 'members' ? 'rgba(255,255,255,0.2)' : 'transparent'}
              >
                <Users size={20} /> 会員管理
              </button>

              <button
                onClick={() => setView('coaches')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: '8px',
                  background: view === 'coaches' ? 'rgba(255,255,255,0.2)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={(e) => e.target.style.background = view === 'coaches' ? 'rgba(255,255,255,0.2)' : 'transparent'}
              >
                <Activity size={20} /> スタッフ在籍管理
              </button>

              <button
                onClick={() => setView('venues')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: '8px',
                  background: view === 'venues' ? 'rgba(255,255,255,0.2)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={(e) => e.target.style.background = view === 'venues' ? 'rgba(255,255,255,0.2)' : 'transparent'}
              >
                <MapPin size={20} /> 会場管理
              </button>

              <button
                onClick={() => setView('categories')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: '8px',
                  background: view === 'categories' ? 'rgba(255,255,255,0.2)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={(e) => e.target.style.background = view === 'categories' ? 'rgba(255,255,255,0.2)' : 'transparent'}
              >
                <FileText size={20} /> カテゴリー
              </button>

              <div style={{ fontSize: '12px', opacity: 0.6, margin: '20px 0 12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                収支管理
              </div>

              <button
                onClick={() => setView('membership-fees')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: '8px',
                  background: view === 'membership-fees' ? 'rgba(255,255,255,0.2)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={(e) => e.target.style.background = view === 'membership-fees' ? 'rgba(255,255,255,0.2)' : 'transparent'}
              >
                <Users size={20} /> 会費管理
              </button>

              <button
                onClick={() => setView('incomes')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: '8px',
                  background: view === 'incomes' ? 'rgba(255,255,255,0.2)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={(e) => e.target.style.background = view === 'incomes' ? 'rgba(255,255,255,0.2)' : 'transparent'}
              >
                <DollarSign size={20} /> 収入管理
              </button>

              <button
                onClick={() => setView('expenses')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: '8px',
                  background: view === 'expenses' ? 'rgba(255,255,255,0.2)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={(e) => e.target.style.background = view === 'expenses' ? 'rgba(255,255,255,0.2)' : 'transparent'}
              >
                <DollarSign size={20} /> 支出管理
              </button>

              <button
                onClick={() => setView('coach-payments')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: '8px',
                  background: view === 'coach-payments' ? 'rgba(255,255,255,0.2)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={(e) => e.target.style.background = view === 'coach-payments' ? 'rgba(255,255,255,0.2)' : 'transparent'}
              >
                <Activity size={20} /> 報酬管理
              </button>

              <button
                onClick={() => setView('report')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: '8px',
                  background: view === 'report' ? 'rgba(255,255,255,0.2)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={(e) => e.target.style.background = view === 'report' ? 'rgba(255,255,255,0.2)' : 'transparent'}
              >
                <BarChart3 size={20} /> 年度決算
              </button>
            </>
          ) : (
            <>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', opacity: 0.9 }}>対象年度</label>
                <select
                  value={selectedYear?.id || ''}
                  onChange={(e) => {
                    const year = fiscalYears.find(y => y.id === e.target.value);
                    setSelectedYear(year);
                    if (year) {
                      localStorage.setItem('savedYearId', year.id);
                      console.log('選択した年度を保存:', year.name);
                    } else {
                      localStorage.removeItem('savedYearId');
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '14px',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white'
                  }}
                >
                  <option value="">年度を選択</option>
                  {fiscalYears.map(year => (
                    <option key={year.id} value={year.id}>{year.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setView('coach-activities')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: '8px',
                  background: view === 'coach-activities' ? 'rgba(255,255,255,0.2)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={(e) => e.target.style.background = view === 'coach-activities' ? 'rgba(255,255,255,0.2)' : 'transparent'}
              >
                <Clipboard size={20} /> 活動記録
              </button>
            </>
          )}
          
          <button
            onClick={() => setView('change-password')}
            style={{
              width: '100%',
              padding: '12px 16px',
              marginTop: 'auto',
              background: view === 'change-password' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={(e) => e.target.style.background = view === 'change-password' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}
          >
            <Settings size={20} /> パスワード変更
          </button>
          
          <button
            onClick={() => {
              // ログイン情報をクリア
              localStorage.removeItem('savedUserId');
              localStorage.removeItem('savedYearId');
              console.log('ログイン情報をクリアしました');
              
              setCurrentUser(null);
              setView('login');
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              marginTop: 'auto',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              justifyContent: 'center'
            }}
          >
            <LogOut size={20} /> ログアウト
          </button>
        </nav>
      </div>

      {/* メインコンテンツ */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {view === 'fiscal-years' && <FiscalYearSettings />}
        {view === 'users' && <UserSettings />}
        {view === 'members' && <MemberSettings />}
        {view === 'coaches' && <CoachSettings />}
        {view === 'venues' && <VenueSettings />}
        {view === 'categories' && <CategorySettings />}
        {view === 'membership-fees' && <MembershipFeeManagement />}
        {view === 'incomes' && <IncomeManagement />}
        {view === 'expenses' && <ExpenseManagement />}
        {view === 'coach-payments' && <CoachPaymentManagement />}
        {view === 'coach-activities' && <CoachActivities />}
        {view === 'report' && <FiscalReport />}
        {view === 'change-password' && <ChangePassword />}
      </div>
    </div>
  );
}
