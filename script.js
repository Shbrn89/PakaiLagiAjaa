// PakaiLagiAja Interactive Demo
// Data disimpan di localStorage, jadi akun/barang/request tetap ada walaupun halaman di-refresh.

const STORAGE = {
  users: 'pla_users',
  currentUser: 'pla_current_user',
  items: 'pla_items',
  requests: 'pla_requests',
  notifications: 'pla_notifications',
  activities: 'pla_activities'
};

const CATEGORIES = {
  elektronik: { label: 'Elektronik', icon: '⚡', bg: '#E1F5EE', waste: 3.5 },
  buku: { label: 'Buku', icon: '📚', bg: '#E6F1FB', waste: 0.7 },
  dapur: { label: 'Dapur', icon: '🍳', bg: '#FAEEDA', waste: 2.0 },
  pakaian: { label: 'Pakaian', icon: '👕', bg: '#FAECE7', waste: 1.2 },
  perabot: { label: 'Perabot', icon: '🪑', bg: '#F1EFE8', waste: 5.0 },
  lainnya: { label: 'Lainnya', icon: '📦', bg: '#F1EFE8', waste: 1.5 }
};

const STATUS_TAG = {
  Tersedia: 'tag-green',
  Dipinjam: 'tag-amber',
  Ditukar: 'tag-blue',
  Disalurkan: 'tag-purple',
  Menunggu: 'tag-amber',
  Ditolak: 'tag-red',
  Disetujui: 'tag-green',
  Selesai: 'tag-green'
};

const TYPE_TAG = { Pinjam: 'tag-gray', Tukar: 'tag-blue', Gratis: 'tag-green' };
let currentCategory = 'semua';
let selectedItemId = null;
let uploadedImage = '';

function $(selector) { return document.querySelector(selector); }
function $all(selector) { return [...document.querySelectorAll(selector)]; }
function now() { return new Date().toISOString(); }
function makeId(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));
}
function formatDate(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const minute = 60000;
  const hour = minute * 60;
  const day = hour * 24;
  if (diff < minute) return 'baru saja';
  if (diff < hour) return `${Math.floor(diff / minute)}m lalu`;
  if (diff < day) return `${Math.floor(diff / hour)}j lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
function initials(name = 'U') {
  return name.split(' ').filter(Boolean).map(word => word[0]).join('').slice(0, 2).toUpperCase();
}
function getUsers() { return read(STORAGE.users, []); }
function getItems() { return read(STORAGE.items, []); }
function getRequests() { return read(STORAGE.requests, []); }
function getNotifications() { return read(STORAGE.notifications, []); }
function getActivities() { return read(STORAGE.activities, []); }
function getCurrentUser() { return read(STORAGE.currentUser, null); }
function saveUsers(data) { write(STORAGE.users, data); }
function saveItems(data) { write(STORAGE.items, data); }
function saveRequests(data) { write(STORAGE.requests, data); }
function saveNotifications(data) { write(STORAGE.notifications, data); }
function saveActivities(data) { write(STORAGE.activities, data); }

function createItem(id, name, cat, type, status, ownerId, ownerName, condition, desc, icon, approved = true) {
  const time = now();
  return {
    id,
    name,
    cat,
    type,
    status,
    ownerId,
    ownerName,
    condition,
    desc,
    icon: icon || CATEGORIES[cat]?.icon || '📦',
    bg: CATEGORIES[cat]?.bg || '#F1EFE8',
    image: '',
    approved,
    createdAt: time,
    updatedAt: time,
    history: [
      { action: 'Ditambahkan', actor: ownerName, condition, note: 'Barang masuk ke sistem.', at: time }
    ]
  };
}

function seedData() {
  const users = [
    { id: 'u-admin', name: 'Admin PakaiLagiAja', email: 'admin@pakailagiaja.com', password: 'admin12345', role: 'Admin', createdAt: now() },
    { id: 'u-ihsan', name: 'Ihsan', email: 'ihsan@mail.com', password: 'user12345', role: 'User', createdAt: now() },
    { id: 'u-raka', name: 'Raka Setya', email: 'raka@mail.com', password: 'user12345', role: 'User', createdAt: now() },
    { id: 'u-nadia', name: 'Nadia Aulia', email: 'nadia@mail.com', password: 'user12345', role: 'User', createdAt: now() }
  ];

  const items = [
    createItem('item-fan', 'Kipas Angin COSMOS', 'elektronik', 'Pinjam', 'Tersedia', 'u-ihsan', 'Ihsan', 'Sangat Baik', 'Kondisi baik, fungsi normal. Cocok untuk kamar kos.', '🌀'),
    createItem('item-rice', 'Rice Cooker 1L', 'dapur', 'Pinjam', 'Dipinjam', 'u-nadia', 'Nadia Aulia', 'Baik', 'Masih bagus dan sudah dicuci bersih.', '🍳'),
    createItem('item-calculus', 'Buku Kalkulus Ed.9', 'buku', 'Tukar', 'Tersedia', 'u-raka', 'Raka Setya', 'Baik', 'Lengkap, cover sedikit lecet.', '📚'),
    createItem('item-iron', 'Setrika Philips', 'elektronik', 'Pinjam', 'Tersedia', 'u-raka', 'Raka Setya', 'Sangat Baik', 'Normal, bersih, kabel masih bagus.', '🪣'),
    createItem('item-jacket', 'Jaket Kulit M', 'pakaian', 'Gratis', 'Tersedia', 'u-raka', 'Raka Setya', 'Sangat Baik', 'Ukuran M, jarang dipakai.', '🧥'),
    createItem('item-lamp', 'Lampu Belajar LED', 'elektronik', 'Pinjam', 'Tersedia', 'u-nadia', 'Nadia Aulia', 'Baik', 'Hemat energi, 3 level kecerahan.', '💡'),
    createItem('item-physics', 'Buku Fisika Dasar', 'buku', 'Tukar', 'Tersedia', 'u-ihsan', 'Ihsan', 'Cukup Baik', 'Ada catatan ringan di beberapa halaman.', '🔭'),
    createItem('item-chair', 'Kursi Lipat', 'perabot', 'Pinjam', 'Tersedia', 'u-nadia', 'Nadia Aulia', 'Baik', 'Kuat, anti karat, cocok untuk acara.', '🪑'),
    createItem('item-charger', 'Charger Laptop 65W', 'elektronik', 'Pinjam', 'Tersedia', 'u-ihsan', 'Ihsan', 'Sangat Baik', 'Universal type C, baru 2 bulan.', '💻'),
    createItem('item-pan', 'Wajan 28cm', 'dapur', 'Gratis', 'Tersedia', 'u-raka', 'Raka Setya', 'Baik', 'Anti lengket masih bagus.', '🥘'),
    createItem('item-shirt', 'Kemeja Formal L', 'pakaian', 'Gratis', 'Tersedia', 'u-nadia', 'Nadia Aulia', 'Baik', 'Ukuran L, warna putih, sudah dicuci.', '👔'),
    createItem('item-stand', 'Laptop Stand', 'elektronik', 'Pinjam', 'Dipinjam', 'u-raka', 'Raka Setya', 'Baik', 'Aluminium, adjustable.', '🖥️')
  ];

  const requests = [
    { id: 'req-1', itemId: 'item-fan', requesterId: 'u-raka', requesterName: 'Raka Setya', ownerId: 'u-ihsan', type: 'Pinjam', status: 'Menunggu', note: 'Butuh untuk acara kelas besok.', createdAt: now(), updatedAt: now() },
    { id: 'req-2', itemId: 'item-rice', requesterId: 'u-ihsan', requesterName: 'Ihsan', ownerId: 'u-nadia', type: 'Pinjam', status: 'Disetujui', note: 'Pinjam untuk kos selama 3 hari.', createdAt: now(), updatedAt: now() }
  ];

  write(STORAGE.users, users);
  write(STORAGE.items, items);
  write(STORAGE.requests, requests);
  write(STORAGE.notifications, [
    { id: 'n-1', userId: 'u-ihsan', role: null, text: 'Raka Setya mengajukan pinjam Kipas Angin COSMOS milikmu.', read: false, createdAt: now() },
    { id: 'n-2', userId: 'u-ihsan', role: null, text: 'Permohonan pinjam Rice Cooker 1L telah disetujui.', read: false, createdAt: now() },
    { id: 'n-3', userId: null, role: 'Admin', text: 'Ada request peminjaman baru yang perlu dimoderasi.', read: false, createdAt: now() }
  ]);
  write(STORAGE.activities, [
    { id: 'a-1', text: 'Raka Setya mengajukan pinjam Kipas Angin COSMOS.', createdAt: now() },
    { id: 'a-2', text: 'Ihsan mengajukan pinjam Rice Cooker 1L dan disetujui.', createdAt: now() }
  ]);
}

function initStorage() {
  if (!localStorage.getItem(STORAGE.users)) seedData();
}

function toast(message) {
  $all('.toast').forEach(item => item.remove());
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
}
function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
}
function closeAllModals() { $all('.modal-overlay').forEach(modal => modal.classList.remove('open')); }

function requireLoginThen(callback) {
  if (!getCurrentUser()) {
    openModal('login-modal');
    toast('Login dulu untuk memakai fitur ini.');
    return;
  }
  callback();
}

function addActivity(text) {
  const data = getActivities();
  data.unshift({ id: makeId('a'), text, createdAt: now() });
  saveActivities(data.slice(0, 60));
}

function addNotification({ userId = null, role = null, text }) {
  const data = getNotifications();
  data.unshift({ id: makeId('n'), userId, role, text, read: false, createdAt: now() });
  saveNotifications(data.slice(0, 100));
}

function injectModals() {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div class="modal-overlay" id="login-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('login-modal')">✕</button>
        <div class="modal-title">Selamat datang kembali</div>
        <div class="modal-sub">Masuk ke akun PakaiLagiAja kamu</div>
        <form onsubmit="handleLogin(event)">
          <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="login-email" type="email" placeholder="nama@email.com" required></div>
          <div class="form-group"><label class="form-label">Password</label><input class="form-input" id="login-password" type="password" placeholder="••••••••" required></div>
          <button class="btn btn-primary full" type="submit">Masuk</button>
        </form>
        <div class="divider">atau</div>
        <p style="text-align:center;font-size:13px;color:var(--text-muted);">Belum punya akun? <a href="#" onclick="closeModal('login-modal');openModal('register-modal');return false;" style="color:var(--green);">Daftar sekarang</a></p>
        <div class="demo-login-box">
          Demo login:<br>
          <strong>User:</strong> ihsan@mail.com / user12345<br>
          <strong>Admin:</strong> admin@pakailagiaja.com / admin12345
        </div>
      </div>
    </div>

    <div class="modal-overlay" id="register-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('register-modal')">✕</button>
        <div class="modal-title">Buat akun baru</div>
        <div class="modal-sub">Akun akan tersimpan di browser menggunakan localStorage</div>
        <form onsubmit="handleRegister(event)">
          <div class="form-group">
            <label class="form-label">Bergabung sebagai</label>
            <div class="role-toggle" data-selected-role="User">
              <button class="role-btn selected" type="button" onclick="selectRole(this,'User')">👤 User</button>
              <button class="role-btn" type="button" onclick="selectRole(this,'Admin')">🛡️ Admin</button>
            </div>
          </div>
          <div class="form-group"><label class="form-label">Nama Lengkap</label><input class="form-input" id="register-name" type="text" placeholder="Nama kamu" required></div>
          <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="register-email" type="email" placeholder="nama@email.com" required></div>
          <div class="form-group"><label class="form-label">Password</label><input class="form-input" id="register-password" type="password" placeholder="Min. 8 karakter" minlength="8" required></div>
          <div class="form-group" id="admin-code-group" style="display:none;"><label class="form-label">Kode Admin</label><input class="form-input" id="register-admin-code" type="password" placeholder="Kode admin"><div class="form-help">Untuk demo: ADMIN123</div></div>
          <button class="btn btn-primary full" type="submit">Daftar</button>
        </form>
      </div>
    </div>

    <div class="modal-overlay" id="add-item-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal('add-item-modal')">✕</button>
        <div class="modal-title">Tambah Barang</div>
        <div class="modal-sub">User biasa masuk moderasi admin, Admin langsung tampil di katalog.</div>
        <form onsubmit="submitAddItem(event)">
          <div class="form-group"><label class="form-label">Nama Barang</label><input class="form-input" id="item-name" type="text" placeholder="Contoh: Kipas Angin Miyako" required></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group"><label class="form-label">Kategori</label><select class="form-input" id="item-cat" required><option value="elektronik">Elektronik</option><option value="buku">Buku</option><option value="dapur">Dapur</option><option value="pakaian">Pakaian</option><option value="perabot">Perabot</option><option value="lainnya">Lainnya</option></select></div>
            <div class="form-group"><label class="form-label">Jenis</label><select class="form-input" id="item-type" required><option>Pinjam</option><option>Tukar</option><option>Gratis</option></select></div>
          </div>
          <div class="form-group"><label class="form-label">Kondisi</label><select class="form-input" id="item-condition" required><option>Sangat Baik</option><option>Baik</option><option>Cukup Baik</option><option>Perlu Perbaikan</option></select></div>
          <div class="form-group"><label class="form-label">Deskripsi</label><textarea class="form-input" id="item-desc" rows="3" placeholder="Ceritakan kondisi barang..." required></textarea></div>
          <div class="form-group">
            <label class="form-label">Foto Barang</label>
            <input type="file" id="add-item-file-input" accept="image/*" style="display:none;">
            <div id="add-item-upload-area"><div id="add-item-placeholder">📷 Klik untuk upload foto</div><img id="add-item-preview" src="" alt="Preview"></div>
          </div>
          <button class="btn btn-primary full" type="submit">Tambah ke Katalog</button>
        </form>
      </div>
    </div>

    <div class="modal-overlay" id="item-detail-modal">
      <div class="modal modal-wide">
        <button class="modal-close" onclick="closeModal('item-detail-modal')">✕</button>
        <div class="detail-img" id="detail-img"></div>
        <div class="modal-title" id="detail-name">Nama Barang</div>
        <div class="modal-sub" id="detail-owner">Pemilik</div>
        <div class="detail-grid">
          <div class="detail-box"><b>Kategori</b><br><span id="detail-cat"></span></div>
          <div class="detail-box"><b>Jenis</b><br><span id="detail-type"></span></div>
          <div class="detail-box"><b>Status</b><br><span id="detail-status"></span></div>
          <div class="detail-box"><b>Kondisi</b><br><span id="detail-condition"></span></div>
        </div>
        <p id="detail-desc" style="color:var(--text-muted);font-size:14px;"></p>
        <div class="form-group" id="request-note-wrap">
          <label class="form-label">Catatan Request</label>
          <textarea class="form-input" id="request-note" rows="2" placeholder="Contoh: Mau pinjam untuk tugas kelompok selama 3 hari..."></textarea>
        </div>
        <div class="list-actions" id="detail-actions"></div>
        <h3 class="mini-title">Riwayat Lifecycle</h3>
        <div class="history-list" id="detail-history"></div>
      </div>
    </div>
  `;
  document.body.appendChild(wrapper);

  $all('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', event => {
      if (event.target === modal) closeModal(modal.id);
    });
  });
}

function setupImageUpload() {
  const area = $('#add-item-upload-area');
  const input = $('#add-item-file-input');
  const preview = $('#add-item-preview');
  const placeholder = $('#add-item-placeholder');
  if (!area || !input) return;
  area.addEventListener('click', () => input.click());
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      uploadedImage = reader.result;
      preview.src = uploadedImage;
      preview.style.display = 'block';
      placeholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
  });
}

function selectRole(button, role) {
  const wrap = button.closest('.role-toggle');
  wrap.dataset.selectedRole = role;
  wrap.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('selected'));
  button.classList.add('selected');
  const adminCode = $('#admin-code-group');
  if (adminCode) adminCode.style.display = role === 'Admin' ? 'block' : 'none';
}

function handleRegister(event) {
  event.preventDefault();
  const name = $('#register-name').value.trim();
  const email = $('#register-email').value.trim().toLowerCase();
  const password = $('#register-password').value;
  const role = $('#register-modal .role-toggle').dataset.selectedRole || 'User';
  const adminCode = $('#register-admin-code')?.value.trim();

  if (!name || !email || !password) return toast('Lengkapi semua data.');
  if (password.length < 8) return toast('Password minimal 8 karakter.');
  if (role === 'Admin' && adminCode !== 'ADMIN123') return toast('Kode admin salah. Gunakan ADMIN123 untuk demo.');

  const users = getUsers();
  if (users.some(user => user.email === email)) return toast('Email sudah terdaftar.');

  const user = { id: makeId('u'), name, email, password, role, createdAt: now() };
  users.push(user);
  saveUsers(users);
  write(STORAGE.currentUser, user);
  addActivity(`${user.name} membuat akun sebagai ${user.role}.`);
  addNotification({ userId: user.id, text: `Selamat datang, ${user.name}! Akun kamu berhasil dibuat.` });
  closeAllModals();
  toast('Akun berhasil dibuat dan tersimpan.');
  setTimeout(() => location.href = 'dashboard.html', 500);
}

function handleLogin(event) {
  event.preventDefault();
  const email = $('#login-email').value.trim().toLowerCase();
  const password = $('#login-password').value;
  const user = getUsers().find(item => item.email === email && item.password === password);
  if (!user) return toast('Email atau password salah.');

  write(STORAGE.currentUser, user);
  addNotification({ userId: user.id, text: `${user.name}, kamu berhasil login ke PakaiLagiAja.` });
  closeAllModals();
  toast('Login berhasil.');
  setTimeout(() => location.href = 'dashboard.html', 400);
}

function logout() {
  localStorage.removeItem(STORAGE.currentUser);
  toast('Berhasil logout.');
  setTimeout(() => location.href = 'index.html', 400);
}

function updateNav() {
  const navRight = $('#nav-right');
  if (!navRight) return;
  const user = getCurrentUser();
  if (!user) {
    navRight.innerHTML = `
      <button class="btn btn-outline btn-sm" onclick="openModal('login-modal')">Masuk</button>
      <button class="btn btn-primary btn-sm" onclick="openModal('register-modal')">Daftar</button>
    `;
    return;
  }
  navRight.innerHTML = `
    <div class="nav-user"><span class="avatar">${initials(user.name)}</span><span>${escapeHTML(user.name)} · ${user.role}</span></div>
    <button class="btn btn-outline btn-sm" onclick="logout()">Logout</button>
  `;
}

function openAddItemModal() {
  const form = $('#add-item-modal form');
  if (form) form.reset();
  uploadedImage = '';
  const preview = $('#add-item-preview');
  const placeholder = $('#add-item-placeholder');
  if (preview) { preview.src = ''; preview.style.display = 'none'; }
  if (placeholder) placeholder.style.display = 'block';
  openModal('add-item-modal');
}

function submitAddItem(event) {
  event.preventDefault();
  const user = getCurrentUser();
  if (!user) return toast('Login dulu.');

  const name = $('#item-name').value.trim();
  const cat = $('#item-cat').value;
  const type = $('#item-type').value;
  const condition = $('#item-condition').value;
  const desc = $('#item-desc').value.trim();
  const approved = user.role === 'Admin';
  const item = createItem(
    makeId('item'), name, cat, type, approved ? 'Tersedia' : 'Menunggu',
    user.id, user.name, condition, desc, CATEGORIES[cat].icon, approved
  );
  item.image = uploadedImage;
  item.history.push({
    action: approved ? 'Disetujui otomatis' : 'Menunggu moderasi',
    actor: user.name,
    condition,
    note: approved ? 'Barang ditambahkan oleh admin.' : 'Barang perlu dicek admin sebelum tampil di katalog.',
    at: now()
  });

  const items = getItems();
  items.unshift(item);
  saveItems(items);
  addActivity(`${user.name} menambahkan barang baru: ${name}.`);
  addNotification({ userId: user.id, text: approved ? `${name} langsung tampil di katalog.` : `${name} berhasil ditambahkan dan menunggu moderasi admin.` });
  if (!approved) addNotification({ role: 'Admin', text: `Barang baru "${name}" menunggu moderasi.` });

  closeModal('add-item-modal');
  toast(approved ? 'Barang berhasil ditambahkan ke katalog.' : 'Barang tersimpan dan menunggu moderasi admin.');
  renderAll();
}

function getVisibleCatalogItems() {
  return getItems().filter(item => item.approved);
}

function filterCat(button, cat) {
  currentCategory = cat;
  $all('.cat-btn').forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');
  renderCatalog();
}

function renderCategoryCounts() {
  const items = getVisibleCatalogItems();
  const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  setText('count-semua', items.length);
  Object.keys(CATEGORIES).forEach(cat => setText(`count-${cat}`, items.filter(item => item.cat === cat).length));
  setText('catalog-count', items.length);
}

function renderCatalog() {
  const grid = $('#catalog-grid');
  if (!grid) return;
  renderCategoryCounts();

  const search = ($('#search-input')?.value || '').toLowerCase();
  const sort = $('#sort-select')?.value || 'terbaru';
  const statusChecked = $all('.filter-status:checked').map(input => input.value);
  const typeChecked = $all('.filter-type:checked').map(input => input.value);

  let items = getVisibleCatalogItems().filter(item => {
    const matchCat = currentCategory === 'semua' || item.cat === currentCategory;
    const matchSearch = item.name.toLowerCase().includes(search) || item.desc.toLowerCase().includes(search);
    const matchStatus = statusChecked.length === 0 || statusChecked.includes(item.status);
    const matchType = typeChecked.length === 0 || typeChecked.includes(item.type);
    return matchCat && matchSearch && matchStatus && matchType;
  });

  if (sort === 'az') items.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'za') items.sort((a, b) => b.name.localeCompare(a.name));
  if (sort === 'terbaru') items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (items.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;">Barang tidak ditemukan. Coba ubah filter atau kata kunci.</div>';
    return;
  }

  grid.innerHTML = items.map(item => {
    const imgStyle = item.image ? `background-image:url('${item.image}')` : `background:${item.bg}`;
    const imgContent = item.image ? '' : item.icon;
    return `
      <div class="catalog-item" onclick="openItemDetail('${item.id}')">
        <div class="catalog-img" style="${imgStyle}">${imgContent}</div>
        <div class="catalog-body">
          <div class="catalog-name">${escapeHTML(item.name)}</div>
          <div class="catalog-owner">oleh ${escapeHTML(item.ownerName)}</div>
          <div class="catalog-footer">
            <span class="tag ${STATUS_TAG[item.status] || 'tag-gray'}">${item.status}</span>
            <span class="tag ${TYPE_TAG[item.type] || 'tag-gray'}">${item.type}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openItemDetail(itemId) {
  const item = getItems().find(data => data.id === itemId);
  if (!item) return;
  selectedItemId = itemId;
  const currentUser = getCurrentUser();
  const img = $('#detail-img');

  if (item.image) {
    img.style.backgroundImage = `url('${item.image}')`;
    img.style.backgroundColor = 'transparent';
    img.textContent = '';
  } else {
    img.style.backgroundImage = '';
    img.style.backgroundColor = item.bg;
    img.textContent = item.icon;
  }

  $('#detail-name').textContent = item.name;
  $('#detail-owner').textContent = `Pemilik: ${item.ownerName}`;
  $('#detail-cat').textContent = CATEGORIES[item.cat]?.label || item.cat;
  $('#detail-type').innerHTML = `<span class="tag ${TYPE_TAG[item.type]}">${item.type}</span>`;
  $('#detail-status').innerHTML = `<span class="tag ${STATUS_TAG[item.status] || 'tag-gray'}">${item.status}</span>`;
  $('#detail-condition').textContent = item.condition;
  $('#detail-desc').textContent = item.desc;

  const history = item.history || [];
  $('#detail-history').innerHTML = history.slice().reverse().map(row => `
    <div class="history-row">
      <b>${escapeHTML(row.action)}</b> · ${escapeHTML(row.actor)}<br>
      Kondisi: ${escapeHTML(row.condition || '-')} · ${formatDate(row.at)}<br>
      ${escapeHTML(row.note || '')}
    </div>
  `).join('') || '<div class="empty-state">Belum ada riwayat.</div>';

  const actionWrap = $('#detail-actions');
  const noteWrap = $('#request-note-wrap');
  if (!currentUser) {
    noteWrap.style.display = 'none';
    actionWrap.innerHTML = `<button class="btn btn-primary" onclick="closeModal('item-detail-modal');openModal('login-modal')">Login untuk Ajukan</button>`;
  } else if (currentUser.id === item.ownerId) {
    noteWrap.style.display = 'none';
    actionWrap.innerHTML = `<span class="tag tag-blue">Ini barang milik kamu</span>`;
  } else if (item.status !== 'Tersedia') {
    noteWrap.style.display = 'none';
    actionWrap.innerHTML = `<span class="tag tag-amber">Barang belum tersedia untuk request</span>`;
  } else {
    noteWrap.style.display = 'block';
    actionWrap.innerHTML = `<button class="btn btn-primary" onclick="submitRequest()">Ajukan ${item.type}</button>`;
  }

  openModal('item-detail-modal');
}

function submitRequest() {
  const user = getCurrentUser();
  const item = getItems().find(data => data.id === selectedItemId);
  if (!user || !item) return;
  if (item.ownerId === user.id) return toast('Tidak bisa request barang sendiri.');
  if (item.status !== 'Tersedia') return toast('Barang sedang tidak tersedia.');

  const requests = getRequests();
  const duplicate = requests.some(req => req.itemId === item.id && req.requesterId === user.id && req.status === 'Menunggu');
  if (duplicate) return toast('Kamu sudah punya request yang menunggu untuk barang ini.');

  const request = {
    id: makeId('req'),
    itemId: item.id,
    requesterId: user.id,
    requesterName: user.name,
    ownerId: item.ownerId,
    type: item.type,
    status: 'Menunggu',
    note: $('#request-note')?.value.trim() || '-',
    createdAt: now(),
    updatedAt: now()
  };
  requests.unshift(request);
  saveRequests(requests);
  addActivity(`${user.name} mengajukan ${item.type.toLowerCase()} ${item.name}.`);
  addNotification({ userId: item.ownerId, text: `${user.name} mengajukan ${item.type.toLowerCase()} ${item.name} milikmu.` });
  addNotification({ role: 'Admin', text: `Request baru: ${user.name} → ${item.name}.` });
  closeModal('item-detail-modal');
  toast('Request berhasil diajukan dan tersimpan.');
  renderAll();
}

function requestTargetStatus(type) {
  if (type === 'Pinjam') return 'Dipinjam';
  if (type === 'Tukar') return 'Ditukar';
  return 'Disalurkan';
}

function approveRequest(requestId) {
  const user = getCurrentUser();
  let requests = getRequests();
  let items = getItems();
  const req = requests.find(data => data.id === requestId);
  const item = items.find(data => data.id === req?.itemId);
  if (!req || !item) return;
  if (user.role !== 'Admin' && user.id !== req.ownerId) return toast('Hanya pemilik atau admin yang bisa menyetujui.');

  req.status = 'Disetujui';
  req.updatedAt = now();
  item.status = requestTargetStatus(req.type);
  item.updatedAt = now();
  item.history.push({
    action: `${req.type} disetujui`,
    actor: user.name,
    condition: item.condition,
    note: `${req.requesterName} mendapat persetujuan untuk ${req.type.toLowerCase()} barang ini.`,
    at: now()
  });

  saveRequests(requests);
  saveItems(items);
  addActivity(`${user.name} menyetujui request ${req.type.toLowerCase()} ${item.name}.`);
  addNotification({ userId: req.requesterId, text: `Request ${req.type.toLowerCase()} ${item.name} telah disetujui.` });
  toast('Request disetujui dan status barang diperbarui.');
  renderAll();
}

function rejectRequest(requestId) {
  const user = getCurrentUser();
  const requests = getRequests();
  const req = requests.find(data => data.id === requestId);
  const item = getItems().find(data => data.id === req?.itemId);
  if (!req || !item) return;
  if (user.role !== 'Admin' && user.id !== req.ownerId) return toast('Hanya pemilik atau admin yang bisa menolak.');

  req.status = 'Ditolak';
  req.updatedAt = now();
  saveRequests(requests);
  addActivity(`${user.name} menolak request ${req.type.toLowerCase()} ${item.name}.`);
  addNotification({ userId: req.requesterId, text: `Request ${req.type.toLowerCase()} ${item.name} ditolak.` });
  toast('Request ditolak.');
  renderAll();
}

function finishRequest(requestId) {
  const user = getCurrentUser();
  const requests = getRequests();
  const items = getItems();
  const req = requests.find(data => data.id === requestId);
  const item = items.find(data => data.id === req?.itemId);
  if (!req || !item) return;
  if (user.role !== 'Admin' && user.id !== req.ownerId && user.id !== req.requesterId) return toast('Kamu tidak punya akses ke request ini.');

  const newCondition = prompt('Masukkan kondisi barang setelah transaksi:', item.condition) || item.condition;
  req.status = 'Selesai';
  req.updatedAt = now();
  item.condition = newCondition;
  if (req.type === 'Pinjam') item.status = 'Tersedia';
  item.updatedAt = now();
  item.history.push({
    action: 'Transaksi selesai',
    actor: user.name,
    condition: newCondition,
    note: req.type === 'Pinjam' ? 'Barang dikembalikan dan tersedia kembali.' : 'Transaksi selesai dan riwayat tercatat.',
    at: now()
  });
  saveRequests(requests);
  saveItems(items);
  addActivity(`Transaksi ${req.type.toLowerCase()} ${item.name} selesai.`);
  addNotification({ userId: req.ownerId, text: `Transaksi ${item.name} telah selesai.` });
  addNotification({ userId: req.requesterId, text: `Transaksi ${item.name} telah selesai.` });
  toast('Transaksi selesai dan lifecycle diperbarui.');
  renderAll();
}

function approveItem(itemId) {
  const user = getCurrentUser();
  if (user?.role !== 'Admin') return toast('Hanya admin yang bisa approve barang.');
  const items = getItems();
  const item = items.find(data => data.id === itemId);
  if (!item) return;
  item.approved = true;
  item.status = 'Tersedia';
  item.updatedAt = now();
  item.history.push({ action: 'Disetujui Admin', actor: user.name, condition: item.condition, note: 'Barang lolos moderasi dan tampil di katalog.', at: now() });
  saveItems(items);
  addActivity(`Admin menyetujui barang ${item.name}.`);
  addNotification({ userId: item.ownerId, text: `${item.name} disetujui admin dan tampil di katalog.` });
  toast('Barang berhasil disetujui.');
  renderAll();
}

function rejectItem(itemId) {
  const user = getCurrentUser();
  if (user?.role !== 'Admin') return toast('Hanya admin yang bisa menolak barang.');
  const items = getItems();
  const item = items.find(data => data.id === itemId);
  if (!item) return;
  item.approved = false;
  item.status = 'Ditolak';
  item.updatedAt = now();
  item.history.push({ action: 'Ditolak Admin', actor: user.name, condition: item.condition, note: 'Barang tidak tampil di katalog.', at: now() });
  saveItems(items);
  addActivity(`Admin menolak barang ${item.name}.`);
  addNotification({ userId: item.ownerId, text: `${item.name} ditolak admin.` });
  toast('Barang ditolak.');
  renderAll();
}

function renderHomeStats() {
  const users = getUsers();
  const items = getVisibleCatalogItems();
  const waste = calculateWaste();
  if ($('#home-item-count')) $('#home-item-count').textContent = items.length;
  if ($('#home-waste-count')) $('#home-waste-count').textContent = `${waste}kg`;
  if ($('#home-user-count')) $('#home-user-count').textContent = users.length;
}

function calculateWaste() {
  const items = getVisibleCatalogItems();
  const total = items.reduce((sum, item) => sum + (CATEGORIES[item.cat]?.waste || 1), 0);
  return Number(total.toFixed(1));
}

function renderDashboard() {
  if (document.body.dataset.page !== 'dashboard') return;
  const user = getCurrentUser();
  if (!user) {
    $('#dash-name').textContent = 'Guest';
    $('#tab-activity').innerHTML = '<div class="empty-state">Silakan login dulu untuk melihat dashboard.</div>';
    openModal('login-modal');
    return;
  }

  $('#dash-name').textContent = user.name;
  $all('.admin-only').forEach(el => el.classList.toggle('hidden', user.role !== 'Admin'));

  const items = getItems();
  const approved = items.filter(item => item.approved);
  const requests = getRequests();
  const successRequests = requests.filter(req => ['Disetujui', 'Selesai'].includes(req.status));
  const waste = calculateWaste();

  $('#stat-active').textContent = approved.filter(item => item.status === 'Tersedia').length;
  $('#stat-borrowed').textContent = approved.filter(item => item.status === 'Dipinjam').length;
  $('#stat-transactions').textContent = successRequests.length;
  $('#stat-waste').textContent = `${waste}kg`;
  $('#impact-text').textContent = `${waste}kg`;

  const itemPercent = Math.min(100, approved.length * 8);
  const transPercent = Math.min(100, successRequests.length * 12);
  const userPercent = Math.min(100, getUsers().length * 18);
  setBar('bar-items', 'bar-items-label', itemPercent);
  setBar('bar-trans', 'bar-trans-label', transPercent);
  setBar('bar-users', 'bar-users-label', userPercent);

  renderActivities();
  renderNotifications(user);
  renderMyItems(user);
  renderRequests(user);
  renderAdminPanel(user);
}

function setBar(barId, labelId, percent) {
  const bar = document.getElementById(barId);
  const label = document.getElementById(labelId);
  if (bar) bar.style.width = `${percent}%`;
  if (label) label.textContent = `${percent}%`;
}

function renderActivities() {
  const list = $('#activity-list');
  if (!list) return;
  const acts = getActivities().slice(0, 12);
  if (acts.length === 0) {
    list.innerHTML = '<div class="empty-state">Belum ada aktivitas.</div>';
    return;
  }
  list.innerHTML = acts.map(act => `
    <li class="activity-item">
      <div class="activity-avatar">♻</div>
      <div><div class="activity-text">${escapeHTML(act.text)}</div><div class="activity-time">${formatDate(act.createdAt)}</div></div>
    </li>
  `).join('');
}

function renderNotifications(user) {
  const list = $('#notif-list');
  if (!list) return;
  const data = getNotifications().filter(notif => notif.userId === user.id || notif.role === user.role).slice(0, 20);
  if (data.length === 0) {
    list.innerHTML = '<div class="empty-state">Belum ada notifikasi.</div>';
    return;
  }
  list.innerHTML = data.map(notif => `
    <li class="notif-item ${notif.read ? '' : 'unread'}">
      <div class="notif-text">${escapeHTML(notif.text)}</div>
      <div class="notif-time">${formatDate(notif.createdAt)}</div>
    </li>
  `).join('');
}

function renderMyItems(user) {
  const wrap = $('#my-items-list');
  if (!wrap) return;
  const data = getItems().filter(item => item.ownerId === user.id);
  if (data.length === 0) {
    wrap.innerHTML = '<div class="empty-state">Kamu belum menambahkan barang.</div>';
    return;
  }
  wrap.innerHTML = data.map(item => itemCardHTML(item)).join('');
}

function renderRequests(user) {
  const wrap = $('#request-list');
  if (!wrap) return;
  const items = getItems();
  const data = getRequests().filter(req => req.requesterId === user.id || req.ownerId === user.id || user.role === 'Admin');
  if (data.length === 0) {
    wrap.innerHTML = '<div class="empty-state">Belum ada request.</div>';
    return;
  }
  wrap.innerHTML = data.map(req => {
    const item = items.find(data => data.id === req.itemId);
    return requestCardHTML(req, item, user);
  }).join('');
}

function renderAdminPanel(user) {
  if (user.role !== 'Admin') return;
  const itemWrap = $('#admin-item-list');
  const requestWrap = $('#admin-request-list');
  if (itemWrap) {
    const pending = getItems().filter(item => !item.approved && item.status === 'Menunggu');
    itemWrap.innerHTML = pending.length ? pending.map(item => itemCardHTML(item, true)).join('') : '<div class="empty-state">Tidak ada barang menunggu moderasi.</div>';
  }
  if (requestWrap) {
    const requests = getRequests();
    const items = getItems();
    requestWrap.innerHTML = requests.length ? requests.map(req => requestCardHTML(req, items.find(item => item.id === req.itemId), user, true)).join('') : '<div class="empty-state">Belum ada request.</div>';
  }
}

function itemCardHTML(item, adminMode = false) {
  const imgStyle = item.image ? `background-image:url('${item.image}')` : `background:${item.bg}`;
  const imgContent = item.image ? '' : item.icon;
  return `
    <div class="list-card">
      <div class="list-top">
        <div class="list-icon" style="${imgStyle}">${imgContent}</div>
        <div class="list-main">
          <div class="list-title">${escapeHTML(item.name)}</div>
          <div class="list-meta">${CATEGORIES[item.cat]?.label || item.cat} · ${item.type} · oleh ${escapeHTML(item.ownerName)}</div>
          <div class="list-desc">Kondisi: ${escapeHTML(item.condition)}</div>
          <div style="margin-top:6px;"><span class="tag ${STATUS_TAG[item.status] || 'tag-gray'}">${item.status}</span> ${item.approved ? '<span class="tag tag-green">Approved</span>' : '<span class="tag tag-amber">Moderasi</span>'}</div>
        </div>
      </div>
      <div class="list-actions">
        <button class="btn btn-outline btn-sm" onclick="openItemDetail('${item.id}')">Detail</button>
        ${adminMode ? `<button class="btn btn-primary btn-sm" onclick="approveItem('${item.id}')">Approve</button><button class="btn btn-danger btn-sm" onclick="rejectItem('${item.id}')">Tolak</button>` : ''}
      </div>
    </div>
  `;
}

function requestCardHTML(req, item, user, adminMode = false) {
  if (!item) return '';
  const canManage = user.role === 'Admin' || user.id === req.ownerId;
  const canFinish = req.status === 'Disetujui' && (user.role === 'Admin' || user.id === req.ownerId || user.id === req.requesterId);
  return `
    <div class="list-card">
      <div class="list-title">${escapeHTML(item.name)}</div>
      <div class="list-meta">Requester: ${escapeHTML(req.requesterName)} · Jenis: ${req.type} · ${formatDate(req.createdAt)}</div>
      <div class="list-desc">Catatan: ${escapeHTML(req.note || '-')}</div>
      <div style="margin-top:6px;"><span class="tag ${STATUS_TAG[req.status] || 'tag-gray'}">${req.status}</span></div>
      <div class="list-actions">
        <button class="btn btn-outline btn-sm" onclick="openItemDetail('${item.id}')">Detail Barang</button>
        ${canManage && req.status === 'Menunggu' ? `<button class="btn btn-primary btn-sm" onclick="approveRequest('${req.id}')">Setujui</button><button class="btn btn-danger btn-sm" onclick="rejectRequest('${req.id}')">Tolak</button>` : ''}
        ${canFinish ? `<button class="btn btn-blue btn-sm" onclick="finishRequest('${req.id}')">Selesaikan</button>` : ''}
      </div>
    </div>
  `;
}

function switchTab(button, tab) {
  $all('.tab').forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');
  ['activity', 'notif', 'items', 'requests', 'admin'].forEach(name => {
    const el = document.getElementById(`tab-${name}`);
    if (el) el.style.display = name === tab ? 'block' : 'none';
  });
}

function markAllNotificationsRead() {
  const user = getCurrentUser();
  if (!user) return toast('Login dulu.');
  const data = getNotifications().map(notif => {
    if (notif.userId === user.id || notif.role === user.role) return { ...notif, read: true };
    return notif;
  });
  saveNotifications(data);
  toast('Semua notifikasi ditandai sudah dibaca.');
  renderDashboard();
}

function resetDemoData() {
  if (!confirm('Reset semua data demo? Akun/barang/request yang kamu buat akan hilang.')) return;
  localStorage.removeItem(STORAGE.currentUser);
  seedData();
  toast('Data demo berhasil di-reset.');
  setTimeout(() => location.href = 'index.html', 500);
}

function setupPageEvents() {
  $('#search-input')?.addEventListener('input', renderCatalog);
  $('#sort-select')?.addEventListener('change', renderCatalog);
  $all('.filter-status, .filter-type').forEach(input => input.addEventListener('change', renderCatalog));
}

function renderAll() {
  updateNav();
  renderHomeStats();
  renderCatalog();
  renderDashboard();
}

window.addEventListener('load', () => {
  initStorage();
  injectModals();
  setupImageUpload();
  setupPageEvents();
  renderAll();
});